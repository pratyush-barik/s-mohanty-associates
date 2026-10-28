'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { sendMail } from '@/lib/mail';
import { decodeHtmlEntities, decodeHtmlEntitiesDeep } from '@/lib/html-entities';

/**
 * Assign a Field Employee and Report Employee to a Project.
 * Only Managers and Owners can perform this action.
 */
export async function updateProjectTeam(
  projectId: string,
  fieldEmployeeIds: string[],
  reportEmployeeId: string | null
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  const caller = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!caller || !['OWNER', 'MANAGER'].includes(caller.role)) {
    return { error: 'You do not have permission to manage team assignments.' };
  }

  try {
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true, reportEmployeeId: true },
    });

    if (!currentProject) {
      return { error: 'Project not found.' };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        fieldEmployees: {
          set: fieldEmployeeIds.map((id) => ({ id })),
        },
        reportEmployeeId,
      },
    });

    // Handle Inspection record (using the first field agent as the primary inspector for the sheet)
    const primaryFieldEmployeeId = fieldEmployeeIds[0] || null;

    if (primaryFieldEmployeeId) {
      const existingInspection = await prisma.inspection.findUnique({
        where: { projectId },
      });

      if (!existingInspection) {
        await prisma.inspection.create({
          data: {
            projectId,
            employeeId: primaryFieldEmployeeId,
            status: 'PENDING',
          },
        });
      } else {
        await prisma.inspection.update({
          where: { projectId },
          data: { employeeId: primaryFieldEmployeeId },
        });
      }
    } else {
      await prisma.inspection.deleteMany({
        where: { projectId },
      });
    }

    // Handle Report record
    if (reportEmployeeId) {
      const existingReport = await prisma.report.findUnique({
        where: { projectId },
      });

      if (existingReport) {
        await prisma.report.update({
          where: { projectId },
          data: { employeeId: reportEmployeeId },
        });
      }
    } else {
      await prisma.report.deleteMany({
        where: { projectId },
      });
    }

    revalidatePath('/portal/projects', 'layout');
    revalidatePath('/portal/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to update project team:', error);
    return { error: 'Failed to update project team.' };
  }
}

/**
 * Update the status of an inspection.
 */
export async function updateInspectionStatus(
  projectId: string,
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
  notes?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const inspection = await prisma.inspection.findUnique({
      where: { projectId },
      include: { project: { include: { fieldEmployees: true } } }
    });

    if (!inspection) return { error: 'Inspection not found.' };

    // Verify ownership or manager
    const user = await prisma.employee.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: 'Unauthorized' };

    if (user.role === 'FIELD_EMPLOYEE' && !inspection.project.fieldEmployees.some(emp => emp.id === session.user.id)) {
      return { error: 'You are not assigned to this inspection.' };
    }

    let updatedCompletedFieldAgents = inspection.completedFieldAgents || [];
    if (status === 'COMPLETED' && !updatedCompletedFieldAgents.includes(session.user.id)) {
      updatedCompletedFieldAgents = [...updatedCompletedFieldAgents, session.user.id];
    } else if (status !== 'COMPLETED') {
      updatedCompletedFieldAgents = updatedCompletedFieldAgents.filter(id => id !== session.user.id);
    }
    
    if (status === 'COMPLETED') {
      const photoCount = await prisma.bucketImage.count({ where: { projectId } });
      if (photoCount < 1) {
        return { error: 'You must upload at least 1 photo to the bucket before marking the inspection as COMPLETED.' };
      }
    }

    await prisma.inspection.update({
      where: { projectId },
      data: { 
        status,
        completedFieldAgents: updatedCompletedFieldAgents,
        ...(notes && { notes })
      }
    });

    // If completed, update project status
    if (status === 'COMPLETED' && inspection.project.status === 'INSPECTION_IN_PROGRESS') {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'INSPECTION_COMPLETED' }
      });
    } else if (status === 'IN_PROGRESS' && inspection.project.status === 'ASSIGNED') {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'INSPECTION_IN_PROGRESS' }
      });
    }

    revalidatePath(`/portal/inspections/${projectId}`);
    revalidatePath('/portal/inspections');
    revalidatePath('/portal/projects', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to update inspection:', error);
    return { error: 'Failed to update inspection.' };
  }
}

/**
 * Update the milestone of an inspection and log the timestamp.
 */
export async function updateInspectionMilestone(
  projectId: string,
  milestone: 'startedAt' | 'reachedSiteAt' | 'inspectedAt' | 'completedAt',
  notes?: string
) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const inspection = await prisma.inspection.findUnique({
      where: { projectId },
      include: { project: true }
    });

    if (!inspection) return { error: 'Inspection not found.' };

    // Verify ownership or manager
    const user = await prisma.employee.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: 'Unauthorized' };

    if (user.role === 'FIELD_EMPLOYEE' && inspection.employeeId !== session.user.id) {
      return { error: 'You are not assigned to this inspection.' };
    }

    // Update status based on milestone
    let status = inspection.status;
    let completedAt = inspection.completedAt;

    if (milestone === 'startedAt') {
      status = 'IN_PROGRESS';
    } else if (milestone === 'completedAt') {
      const photoCount = await prisma.bucketImage.count({ where: { projectId } });
      if (photoCount < 1) {
        return { error: 'You must upload at least 1 photo to the bucket before marking the inspection as COMPLETED.' };
      }
      status = 'COMPLETED';
      completedAt = new Date();
    }

    // Parse existing measurements/milestones safely
    const currentMeasurements = (inspection.measurements as any) || {};
    const currentMilestones = currentMeasurements.milestones || {};
    
    currentMilestones[milestone] = new Date().toISOString();
    currentMeasurements.milestones = currentMilestones;

    await prisma.inspection.update({
      where: { projectId },
      data: { 
        status,
        completedAt,
        measurements: currentMeasurements,
        ...(notes !== undefined && { notes })
      }
    });

    // If completed or started, update project status
    if (milestone === 'completedAt' && inspection.project.status === 'INSPECTION_IN_PROGRESS') {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'INSPECTION_COMPLETED' }
      });
    } else if (milestone === 'startedAt' && inspection.project.status === 'ASSIGNED') {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'INSPECTION_IN_PROGRESS' }
      });
    }

    revalidatePath(`/portal/inspections/${projectId}`);
    revalidatePath('/portal/inspections');
    revalidatePath('/portal/projects', 'layout');
    return { success: true, measurements: currentMeasurements };
  } catch (error) {
    console.error('Failed to update inspection milestone:', error);
    return { error: 'Failed to update inspection milestone.' };
  }
}

/**
 * Save report draft fields (JSON data)
 */
export async function saveReportDraft(projectId: string, fields: any) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { report: true }
    });

    if (!project) return { error: 'Project not found.' };

    const user = await prisma.employee.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: 'Unauthorized' };

    if (user.role === 'REPORT_EMPLOYEE' && project.reportEmployeeId && project.reportEmployeeId !== session.user.id) {
      return { error: 'You are not assigned to this report.' };
    }

    const cleanFields = decodeHtmlEntitiesDeep(fields);

    if (project.report) {
      // Update existing
      await prisma.report.update({
        where: { id: project.report.id },
        data: { data: cleanFields, status: 'DRAFTING' }
      });
    } else {
      // Create new report record
      await prisma.report.create({
        data: {
          projectId,
          employeeId: project.reportEmployeeId || session.user.id,
          status: 'DRAFTING',
          data: cleanFields
        }
      });
      if (project.status !== 'MANAGER_REVIEW') {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: 'REPORT_DRAFTING' }
        });
      }
    }

    return { success: true, savedAt: new Date().toISOString() };
  } catch (error) {
    console.error('Failed to save draft:', error);
    return { error: 'Failed to save report draft.' };
  }
}
/**
 * Auto-generate or retrieve the annual statutory reference for Income Tax:
 * SMA/V-01/IT/BBSR-NNNN/YY
 * Resets back to 0001 on January 1st every year.
 */
export async function getOrGenerateTaxRef(projectId: string): Promise<{ refNo?: string; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { report: true }
    });

    if (!project) return { error: 'Project not found.' };

    const reportData = (project.report?.data as any) || {};
    if (reportData.refNo && typeof reportData.refNo === 'string' && reportData.refNo.startsWith('SMA/V-01/IT/BBSR-')) {
      return { refNo: reportData.refNo };
    }

    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const prefix = 'SMA/V-01/IT/BBSR-';
    const suffix = `/${yy}`;

    // Count existing reports for this year
    const reports = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count 
      FROM "reports" 
      WHERE ("data"->>'refNo') LIKE ${`${prefix}%${suffix}`}
    `;
    const count = Number(reports[0]?.count || 0);
    const nextNum = String(count + 1).padStart(4, '0');
    const refNo = `${prefix}${nextNum}${suffix}`;

    return { refNo };
  } catch (error) {
    console.error('Failed to generate Income Tax ref:', error);
    return { error: 'Failed to generate reference.' };
  }
}


/**
 * Submit report for manager verification
 */
export async function submitReportForVerification(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const report = await prisma.report.findFirst({
      where: { projectId }
    });

    if (!report) return { error: 'Report data not found.' };

    await prisma.report.update({
      where: { id: report.id },
      data: { 
        status: 'SUBMITTED_FOR_REVIEW',
        submittedAt: new Date()
      }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'MANAGER_REVIEW' }
    });

    revalidatePath(`/portal/reports/${projectId}`);
    revalidatePath('/portal/my-projects');
    revalidatePath('/portal/projects', 'layout');
    revalidatePath('/portal/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to submit report:', error);
    return { error: 'Failed to submit report for verification.' };
  }
}

/**
 * Manager: Send report back for rework
 */
export async function sendReportForRework(projectId: string, reworkComment?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const report = await prisma.report.findFirst({ where: { projectId } });
    if (!report) return { error: 'Report data not found.' };

    const updatedData = {
      ...(report.data as object || {}),
      reworkNotes: reworkComment || undefined,
    };

    await prisma.report.update({
      where: { id: report.id },
      data: { 
        status: 'REVISION_REQUESTED',
        data: updatedData
      }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: 'REPORT_DRAFTING',
        clientReworkRequested: false 
      }
    });

    // Reopen the linked enquiry when the project goes back for rework
    const enquiry = await prisma.enquiry.findUnique({
      where: { projectId },
    });
    if (enquiry && enquiry.status === 'CLOSED') {
      await prisma.enquiry.update({
        where: { id: enquiry.id },
        data: { status: 'NEW' },
      });
    }

    revalidatePath('/portal/projects', 'layout');
    revalidatePath('/portal/my-projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to send for rework:', error);
    return { error: 'Failed to send for rework.' };
  }
}

/**
 * Client: Request changes on a completed report
 */
export async function requestClientRework(projectId: string, message: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { serviceRequest: true }
    });

    if (!project || project.serviceRequest.clientId !== session.user.id) {
      return { error: 'Project not found or unauthorized.' };
    }

    if (project.status !== 'COMPLETED') {
      return { error: 'Can only request changes on a completed project.' };
    }

    // Set project status back to MANAGER_REVIEW so manager can review the client's request
    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: 'MANAGER_REVIEW',
        clientReworkRequested: true 
      }
    });

    // Reopen the linked enquiry when client requests rework
    const enquiry = await prisma.enquiry.findUnique({
      where: { projectId },
    });
    if (enquiry && enquiry.status === 'CLOSED') {
      await prisma.enquiry.update({
        where: { id: enquiry.id },
        data: { status: 'NEW' },
      });
    }

    // Save the client's request as a project message
    await prisma.projectMessage.create({
      data: {
        projectId,
        clientId: session.user.id,
        content: `**Rework Request:** ${message}`,
      }
    });

    revalidatePath('/dashboard/projects', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to submit rework request:', error);
    return { error: 'Failed to submit rework request.' };
  }
}

/**
 * Agent: Cancel submitted report, bringing it back to DRAFT / REPORT_DRAFTING
 */
export async function cancelReportSubmission(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const report = await prisma.report.findFirst({ where: { projectId } });
    if (!report) return { error: 'Report data not found.' };

    await prisma.report.update({
      where: { id: report.id },
      data: { status: 'DRAFTING' }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'REPORT_DRAFTING' }
    });

    revalidatePath(`/portal/reports/${projectId}`);
    revalidatePath('/portal/my-projects');
    revalidatePath('/portal/projects', 'layout');
    revalidatePath('/portal/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel submission:', error);
    return { error: 'Failed to cancel submission.' };
  }
}

/**
 * Manager: Finalize report with PDF URL
 */
export async function finalizeReport(projectId: string, pdfUrl: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const report = await prisma.report.findFirst({ where: { projectId } });
    if (!report) return { error: 'Report data not found.' };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { serviceRequest: true }
    });
    if (!project) return { error: 'Project not found.' };

    await prisma.report.update({
      where: { id: report.id },
      data: { 
        status: 'APPROVED',
        fileUrl: pdfUrl,
        approvedAt: new Date()
      }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: 'COMPLETED',
        clientReworkRequested: false
      }
    });

    // Close the linked enquiry when the report is finalized
    const enquiry = await prisma.enquiry.findUnique({
      where: { projectId },
    });
    if (enquiry && enquiry.status !== 'CLOSED') {
      await prisma.enquiry.update({
        where: { id: enquiry.id },
        data: { status: 'CLOSED' },
      });
    }

    // Append report data as one row to train_model.csv for ML training
    // Fire-and-forget: errors logged but never block finalization
    const { appendTrainingData } = await import('@/lib/training-data');
    appendTrainingData(projectId, project.projectCode, report.data, new Date());

    const isExternalCase = project.source === 'EXTERNAL' || project.source === 'GMAIL' || project.isEmailOnly;

    if (isExternalCase) {
      const recipientEmail = (project.serviceRequest?.guestEmail || project.serviceRequest?.contactEmail || '').trim();
      const recipientName = project.serviceRequest?.guestName || project.serviceRequest?.contactName || 'Valued Client';

      if (recipientEmail) {
        const { sendMail } = await import('@/lib/mail');
        await sendMail({
          from: process.env.GMAIL_SMTP_FROM || 'smohantyassociates@gmail.com',
          to: recipientEmail,
          subject: `Your Valuation Report is Ready [${project.projectCode}]`,
          attachments: [
            {
              filename: `${project.projectCode}_Valuation_Report.pdf`,
              path: pdfUrl,
            },
          ],
          html: `
            <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
              <h2>Valuation Report Finalized</h2>
              <p>Dear ${recipientName},</p>
              <p>Your property valuation report for <strong>${project.projectCode}</strong> has been successfully finalized.</p>
              <p>Please find the official finalized PDF report attached directly to this email for your records and compliance filings.</p>
              <p>Thank you for choosing S Mohanty Associates.</p>
              <p style="margin-top: 24px; color: #666; font-size: 13px;">Best regards,<br><strong>S Mohanty & Associates</strong><br>Government Registered & IBBI Valuers</p>
            </div>
          `
        });
      }
    } else {
      const recipientEmail = (project.serviceRequest?.contactEmail || '').trim();
      const recipientName = project.serviceRequest?.contactName || 'Valued Client';

      if (recipientEmail) {
        const { sendMail } = await import('@/lib/mail');
        await sendMail({
          from: 'report@smohantyassociates.com',
          to: recipientEmail,
          subject: `Your Valuation Report is Ready [${project.projectCode}]`,
          html: `
            <div style="font-family: sans-serif; color: #333; line-height: 1.6;">
              <h2>Report Completed</h2>
              <p>Dear ${recipientName},</p>
              <p>Your property valuation report for <strong>${project.projectCode}</strong> has been successfully finalized.</p>
              <p>Please log in to your client dashboard to view and download the official PDF copy of your report.</p>
              <p>Thank you for choosing S Mohanty Associates.</p>
              <p style="margin-top: 24px; color: #666; font-size: 13px;">Best regards,<br><strong>S Mohanty & Associates</strong></p>
            </div>
          `
        });
      }
    }

    revalidatePath('/portal/projects', 'layout');
    revalidatePath('/dashboard/projects', 'layout');
    return { success: true };
  } catch (error) {
    console.error('Failed to finalize report:', error);
    return { error: 'Failed to finalize report.' };
  }
}

/**
 * Owner/Manager: Accept a pending service request and create a Project.
 */
export async function acceptServiceRequest(
  requestId: string,
  overrideManagerId?: string | null
) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const caller = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true },
  });

  if (!caller || !['OWNER', 'MANAGER'].includes(caller.role)) {
    return { error: 'Only owners and managers can approve service requests.' };
  }

  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) return { error: 'Service request not found.' };
    if (request.status !== 'SUBMITTED') return { error: 'Request is already processed.' };

    // Update ServiceRequest status
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { status: 'APPROVED' },
    });

    // Generate sequential projectCode (SMA-YYYY/MM-NNNN) - Monthly reset
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `SMA-${year}/${month}-`;

    const projectCount = await prisma.project.count({
      where: { projectCode: { startsWith: prefix } }
    });
    const nextNum = String(projectCount + 1).padStart(4, '0');
    const projectCode = `${prefix}${nextNum}`;

    // Determine Manager Assignment rules
    let assignedManagerId: string | null = null;
    let projectStatus: 'PENDING_REVIEW' | 'APPROVED' | 'ASSIGNED' = 'APPROVED';

    if (caller.role === 'MANAGER') {
      // Managers approve -> directly assigned to them
      assignedManagerId = caller.id;
      projectStatus = 'ASSIGNED';
    } else if (caller.role === 'OWNER') {
      // Owner approves -> can optionally override/assign themselves or leave blank
      if (overrideManagerId) {
        assignedManagerId = overrideManagerId;
        projectStatus = 'ASSIGNED';
      }
    }

    const source = request.clientId ? 'WEBSITE' : 'EXTERNAL';

    const project = await prisma.project.create({
      data: {
        projectCode,
        serviceRequestId: requestId,
        status: projectStatus as any,
        assignedManagerId,
        source,
        isEmailOnly: !request.clientId,
      },
    });

  // Link enquiry to project if the service request has one
  if (request.enquiryId) {
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: { enquiryId: request.enquiryId },
    });

    await prisma.enquiry.update({
      where: { id: request.enquiryId },
      data: { projectId: project.id, serviceRequestId: requestId },
    });
  }

  revalidatePath('/portal/requests');
  revalidatePath('/portal/projects');
  return { success: true, projectCode: project.projectCode };
  } catch (error) {
    console.error('Failed to accept request:', error);
    return { error: 'Failed to accept service request.' };
  }
}

/**
 * Owner/Manager: Reject a pending service request.
 */
export async function rejectServiceRequest(requestId: string, reviewNotes?: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const caller = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!caller || !['OWNER', 'MANAGER'].includes(caller.role)) {
    return { error: 'Only owners and managers can reject service requests.' };
  }

  try {
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        reviewNotes: reviewNotes || null,
      },
    });

    revalidatePath('/portal/requests');
    return { success: true };
  } catch (error) {
    console.error('Failed to reject request:', error);
    return { error: 'Failed to reject service request.' };
  }
}

/**
 * Owner: Assign a Manager to oversee an approved project.
 */
export async function assignProjectManager(projectId: string, managerId: string | null) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const caller = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!caller || caller.role !== 'OWNER') {
    return { error: 'Only the Owner can assign project managers.' };
  }

  try {
    const project = await prisma.project.findUnique({ 
      where: { id: projectId },
      include: { serviceRequest: true }
    });
    if (!project) return { error: 'Project not found.' };

    await prisma.project.update({
      where: { id: projectId },
      data: {
        assignedManagerId: managerId,
        status: managerId ? 'ASSIGNED' : 'APPROVED',
      },
    });

    if (managerId && project.serviceRequest?.contactEmail) {
      const { sendMail } = await import('@/lib/mail');
      await sendMail({
        from: 'status@smohantyassociates.com',
        to: project.serviceRequest.contactEmail,
        subject: `Project Update: Manager Assigned [${project.projectCode}]`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Project Status Update</h2>
            <p>Dear ${project.serviceRequest.contactName},</p>
            <p>A manager has been assigned to your project (<strong>${project.projectCode}</strong>) and they will be reviewing your property details shortly.</p>
            <p>You can track the full progress of your valuation in your client dashboard.</p>
          </div>
        `
      });
    }

    revalidatePath('/portal/requests');
    revalidatePath('/portal/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to assign manager:', error);
    return { error: 'Failed to assign manager.' };
  }
}

/**
 * Manager/Owner: Initiate transfer of a project to another manager.
 */
export async function initiateManagerTransfer(projectId: string, targetManagerId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const caller = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true },
  });

  if (!caller || !['OWNER', 'MANAGER'].includes(caller.role)) {
    return { error: 'Only owners and managers can transfer projects.' };
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: 'Project not found.' };

    if (caller.role === 'MANAGER' && project.assignedManagerId !== caller.id) {
      return { error: 'You are not authorized to transfer this project.' };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        pendingManagerId: targetManagerId,
      },
    });

    revalidatePath('/portal/projects', 'layout');
    revalidatePath('/portal/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to initiate transfer:', error);
    return { error: 'Failed to initiate project transfer.' };
  }
}

/**
 * Target Manager: Accept a pending project transfer.
 */
export async function acceptManagerTransfer(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: 'Project not found.' };

    if (project.pendingManagerId !== session.user.id) {
      return { error: 'You are not the designated recipient for this project transfer.' };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        assignedManagerId: project.pendingManagerId,
        pendingManagerId: null,
      },
    });

    revalidatePath('/portal/projects', 'layout');
    revalidatePath('/portal/projects');
    revalidatePath('/portal');
    return { success: true };
  } catch (error) {
    console.error('Failed to accept transfer:', error);
    return { error: 'Failed to accept project transfer.' };
  }
}

/**
 * Target Manager: Decline a pending project transfer.
 */
export async function declineManagerTransfer(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: 'Project not found.' };

    if (project.pendingManagerId !== session.user.id) {
      return { error: 'You are not authorized to perform this action.' };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        pendingManagerId: null,
      },
    });

    revalidatePath('/portal/projects', 'layout');
    revalidatePath('/portal/projects');
    revalidatePath('/portal');
    return { success: true };
  } catch (error) {
    console.error('Failed to decline transfer:', error);
    return { error: 'Failed to decline project transfer.' };
  }
}

/**
 * Owner/Manager: Cancel a pending project transfer.
 */
export async function cancelManagerTransfer(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const caller = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true, id: true },
  });

  if (!caller || !['OWNER', 'MANAGER'].includes(caller.role)) {
    return { error: 'Only owners and managers can cancel project transfers.' };
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return { error: 'Project not found.' };

    if (caller.role === 'MANAGER' && project.assignedManagerId !== caller.id) {
      return { error: 'You are not authorized to cancel this transfer.' };
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        pendingManagerId: null,
      },
    });

    revalidatePath('/portal/projects', 'layout');
    revalidatePath('/portal/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel transfer:', error);
    return { error: 'Failed to cancel project transfer.' };
  }
}

/**
 * Owner: Create a manual case for an email-only client (guest).
 */
export async function createManualCase(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  const caller = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!caller || !['OWNER', 'MANAGER'].includes(caller.role)) {
    return { error: 'Only owners and managers can create manual cases.' };
  }

  const clientType = formData.get('clientType') as string;
  const clientName = formData.get('clientName') as string;
  const organisationName = formData.get('organisationName') as string;
  const guestEmail = (formData.get('guestEmail') as string || '').trim();
  const guestPhone = (formData.get('guestPhone') as string) || null;
  const propertyType = formData.get('propertyType') as string;
  const purpose = formData.get('purpose') as string;
  const propertyAddress = formData.get('propertyAddress') as string;
  const propertyDetails = formData.get('propertyDetails') as string;
  const managerId = formData.get('managerId') as string;

  const guestName = clientType === 'ORGANISATION' && organisationName ? organisationName : clientName;
  const contactName = clientName;
  const contactPhone = guestPhone || '';
  const contactEmail = guestEmail;

  try {
    const sr = await prisma.serviceRequest.create({
      data: {
        guestName: decodeHtmlEntities(guestName),
        guestEmail: decodeHtmlEntities(guestEmail),
        guestPhone: decodeHtmlEntities(guestPhone || ''),
        propertyType: decodeHtmlEntities(propertyType),
        purpose: decodeHtmlEntities(purpose),
        propertyAddress: decodeHtmlEntities(propertyAddress),
        propertyDetails: decodeHtmlEntities(propertyDetails),
        contactName: decodeHtmlEntities(contactName),
        contactPhone: decodeHtmlEntities(contactPhone),
        contactEmail: decodeHtmlEntities(contactEmail),
        status: 'APPROVED',
      }
    });

    // Generate sequential projectCode (SMA-YYYY/MM-NNNN) - Monthly reset
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `SMA-${year}/${month}-`;

    const projectCount = await prisma.project.count({
      where: { projectCode: { startsWith: prefix } }
    });
    const nextNum = String(projectCount + 1).padStart(4, '0');
    const projectCode = `${prefix}${nextNum}`;

    const project = await prisma.project.create({
      data: {
        projectCode,
        serviceRequestId: sr.id,
        status: 'ASSIGNED',
        isEmailOnly: true,
        assignedManagerId: managerId,
        source: 'EXTERNAL',
      }
    });

    // Send Welcome Email
    const emailHtml = `
      <h2>Welcome to S Mohanty Associates</h2>
      <p>Dear ${guestName},</p>
      <p>Your valuation request for <strong>${propertyType}</strong> has been successfully initiated.</p>
      <p><strong>Project Code:</strong> ${projectCode}</p>
      <p>Your case has been assigned to a manager and is now actively being processed. We will keep you updated via email at every major milestone.</p>
      <p>Thank you for choosing S Mohanty Associates.</p>
    `;

    await sendMail({
      from: process.env.GMAIL_SMTP_FROM || 'smohantyassociates@gmail.com',
      to: guestEmail,
      subject: `[Ticket #${projectCode}] Your Valuation Case has been Started`,
      html: emailHtml,
    });

    revalidatePath('/portal/owner');
    revalidatePath('/portal/projects');
    return { success: true, projectId: project.id };
  } catch (error) {
    console.error('Failed to create manual case:', error);
    return { error: 'Failed to create manual case.' };
  }
}

// ═══════════════════════════════════════════════════════════
// PHOTO BUCKET — Field Agent Image Collection
// ═══════════════════════════════════════════════════════════

/**
 * Save a bucket image record after the client uploads it to Supabase Storage.
 * Only field agents assigned to the project (or managers/owners) can save.
 */
export async function saveBucketImage(
  projectId: string,
  imageData: {
    url: string;
    storagePath: string;
    fileName: string;
    size: number;
    mimeType: string;
  }
) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const user = await prisma.employee.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: 'Unauthorized' };

    // Verify the user has access to this project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { fieldEmployees: { select: { id: true } } },
    });

    if (!project) return { error: 'Project not found.' };

    const isFieldAgent = project.fieldEmployees.some((e) => e.id === session.user.id);
    const isProjectManager = project.assignedManagerId === session.user.id || project.pendingManagerId === session.user.id;
    const isOwner = user.role === 'OWNER';

    if (!isFieldAgent && !isProjectManager && !isOwner) {
      return { error: 'You are not authorized to upload to this project\'s bucket.' };
    }

    // Bucket Locking Constraint
    if (isFieldAgent && !isProjectManager && !isOwner) {
      if (project.status === 'MANAGER_REVIEW' || project.status === 'COMPLETED') {
        return { error: 'The Photo Bucket is locked because the project is in review or completed.' };
      }
    }

    if (imageData.size > 10 * 1024 * 1024) {
      return { error: 'File size exceeds the 10MB limit.' };
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageData.mimeType)) {
      return { error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.' };
    }

    const currentPhotoCount = await prisma.bucketImage.count({ where: { projectId } });
    if (currentPhotoCount >= 30) {
      return { error: 'Maximum limit of 30 photos per project bucket reached.' };
    }

    const bucketImage = await prisma.bucketImage.create({
      data: {
        projectId,
        employeeId: session.user.id,
        url: imageData.url,
        storagePath: imageData.storagePath,
        fileName: imageData.fileName,
        size: imageData.size,
        mimeType: imageData.mimeType,
      },
      include: {
        employee: { select: { name: true, employeeId: true } },
      },
    });

    revalidatePath(`/portal/inspections/${projectId}`);
    return { success: true, image: bucketImage };
  } catch (error) {
    console.error('Failed to save bucket image:', error);
    return { error: 'Failed to save bucket image.' };
  }
}

/**
 * Delete a bucket image. Only the uploader, project manager, or owner can delete.
 */
export async function deleteBucketImage(imageId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const user = await prisma.employee.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: 'Unauthorized' };

    const image = await prisma.bucketImage.findUnique({ 
      where: { id: imageId },
      include: {
        project: {
          select: { id: true, status: true, assignedManagerId: true, pendingManagerId: true }
        }
      }
    });
    
    if (!image) return { error: 'Image not found.' };

    const isOwnerOfImage = image.employeeId === session.user.id;
    const isProjectManager = image.project.assignedManagerId === session.user.id || image.project.pendingManagerId === session.user.id;
    const isOwner = user.role === 'OWNER';

    if (!isOwnerOfImage && !isProjectManager && !isOwner) {
      return { error: 'You can only delete your own uploads unless you manage this project.' };
    }

    // Bucket Locking Constraint
    if (!isProjectManager && !isOwner) {
      if (image.project.status === 'MANAGER_REVIEW' || image.project.status === 'COMPLETED') {
        return { error: 'The Photo Bucket is locked because the project is in review or completed.' };
      }
    }

    // Drafting Lock Constraint
    const report = await prisma.report.findUnique({
      where: { projectId: image.project.id }
    });
    if (report && report.data) {
      const draft = report.data as any;
      const isUsedInSketch = draft.sketchMapImage === image.url;
      const isUsedInLocation = draft.locationMapImage === image.url;
      let isUsedInPropertyPhotos = false;
      
      try {
        if (draft.propertyImages && typeof draft.propertyImages === 'string') {
          const parsed = JSON.parse(draft.propertyImages);
          if (Array.isArray(parsed) && parsed.includes(image.url)) {
            isUsedInPropertyPhotos = true;
          }
        } else if (Array.isArray(draft.propertyImages) && draft.propertyImages.includes(image.url)) {
          isUsedInPropertyPhotos = true;
        }
      } catch (e) {
        // Safe parse
      }

      if (isUsedInSketch || isUsedInLocation || isUsedInPropertyPhotos) {
        return { error: 'This photo cannot be deleted because it is actively used in the Report Draft.' };
      }
    }

    // Delete from database
    await prisma.bucketImage.delete({ where: { id: imageId } });

    revalidatePath(`/portal/inspections/${image.projectId}`);
    return { success: true, storagePath: image.storagePath };
  } catch (error) {
    console.error('Failed to delete bucket image:', error);
    return { error: 'Failed to delete bucket image.' };
  }
}

/**
 * Fetch all bucket images for a project. Accessible to assigned field agents, assigned report agents, assigned managers, and owners.
 */
export async function getBucketImages(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized', images: [] };

  try {
    const user = await prisma.employee.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: 'Unauthorized', images: [] };

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { fieldEmployees: { select: { id: true } } },
    });

    if (!project) return { error: 'Project not found.', images: [] };

    const isAssignedFieldAgent = project.fieldEmployees.some(e => e.id === session.user.id);
    const isAssignedReportAgent = project.reportEmployeeId === session.user.id;
    const isAssignedManager = project.assignedManagerId === session.user.id || project.pendingManagerId === session.user.id;
    const isOwner = user.role === 'OWNER';

    if (!isAssignedFieldAgent && !isAssignedReportAgent && !isAssignedManager && !isOwner) {
      return { error: 'You are not authorized to view this project\'s bucket.', images: [] };
    }

    const rawImages = await prisma.bucketImage.findMany({
      where: { projectId },
      include: {
        employee: { select: { name: true, employeeId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const validImages: typeof rawImages = [];
    const deadImageIds: string[] = [];

    await Promise.all(
      rawImages.map(async (img) => {
        if (!img.url || img.url.trim().length <= 5) {
          deadImageIds.push(img.id);
          return;
        }
        try {
          const resp = await fetch(img.url, { method: 'HEAD' });
          if (resp.ok) {
            validImages.push(img);
          } else {
            deadImageIds.push(img.id);
          }
        } catch {
          deadImageIds.push(img.id);
        }
      })
    );

    // Auto-purge orphaned database records that do not exist in Supabase storage
    if (deadImageIds.length > 0) {
      await prisma.bucketImage.deleteMany({
        where: { id: { in: deadImageIds } }
      }).catch(err => console.error('Failed to cleanup dead bucket images:', err));
    }

    return { images: validImages };
  } catch (error) {
    console.error('Failed to fetch bucket images:', error);
    return { error: 'Failed to fetch images.', images: [] };
  }
}

/**
 * Terminate / End a project.
 * Only OWNER and MANAGER roles can perform this action.
 * Records the reason, notifies the client via email, and logs the event.
 */
export async function terminateProject(
  projectId: string,
  reason: string,
  notes?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: 'Not authenticated.' };

    const employee = await prisma.employee.findUnique({
      where: { id: session.user.id },
      select: { role: true, name: true },
    });

    if (!employee || !['OWNER', 'MANAGER'].includes(employee.role)) {
      return { error: 'Permission denied. Only Owner or Manager can end a project.' };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        serviceRequest: { select: { contactName: true, contactEmail: true } },
      },
    });

    if (!project) return { error: 'Project not found.' };

    if (['COMPLETED', 'ARCHIVED', 'TERMINATED'].includes(project.status)) {
      return { error: `Project is already ${project.status.toLowerCase()}. Cannot terminate.` };
    }

    // Update project status to TERMINATED and record reasons
    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: 'TERMINATED',
        terminationReason: reason,
        terminationNotes: notes || null
      },
    });

    // Log the event in SecurityLog
    await prisma.securityLog.create({
      data: {
        event: 'PROJECT_TERMINATED',
        email: session.user.id,
        metadata: {
          projectId,
          projectCode: project.projectCode,
          reason,
          notes: notes || null,
          terminatedBy: employee.name,
        },
      },
    });

    // Notify the client via email (best-effort, don't block on failure)
    const clientEmail = project.serviceRequest?.contactEmail;
    const clientName = project.serviceRequest?.contactName || 'Client';
    if (clientEmail) {
      try {
        await sendMail({
          to: clientEmail,
          subject: `Project ${project.projectCode} — Closed`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #0f2038;">Project Update — ${project.projectCode}</h2>
              <p>Dear ${clientName},</p>
              <p>We regret to inform you that your valuation project <strong>${project.projectCode}</strong> has been closed.</p>
              <p>If you have any questions or would like to initiate a new request, please contact us.</p>
              <br/>
              <p>Regards,<br/>S Mohanty Associates</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error('Failed to send termination email:', emailErr);
      }
    }

    revalidatePath(`/portal/projects`);
    revalidatePath(`/portal/projects/${encodeURIComponent(project.projectCode)}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to terminate project:', error);
    return { error: 'Failed to end the project. Please try again.' };
  }
}
