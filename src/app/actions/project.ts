'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

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

    revalidatePath(`/portal/projects/${projectId}`);
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
      include: { project: true }
    });

    if (!inspection) return { error: 'Inspection not found.' };

    // Verify ownership or manager
    const user = await prisma.employee.findUnique({ where: { id: session.user.id } });
    if (!user) return { error: 'Unauthorized' };

    if (user.role === 'FIELD_EMPLOYEE' && inspection.employeeId !== session.user.id) {
      return { error: 'You are not assigned to this inspection.' };
    }

    await prisma.inspection.update({
      where: { projectId },
      data: { 
        status,
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
    revalidatePath(`/portal/projects/${projectId}`);
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
    revalidatePath(`/portal/projects/${projectId}`);
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

    if (user.role === 'REPORT_EMPLOYEE' && project.reportEmployeeId !== session.user.id) {
      return { error: 'You are not assigned to this report.' };
    }

    if (project.report) {
      // Update existing
      await prisma.report.update({
        where: { id: project.report.id },
        data: { data: fields, status: 'DRAFTING' }
      });
    } else {
      // Create new report record
      await prisma.report.create({
        data: {
          projectId,
          employeeId: project.reportEmployeeId || session.user.id,
          status: 'DRAFTING',
          data: fields
        }
      });
      if (project.status !== 'MANAGER_REVIEW') {
        await prisma.project.update({
          where: { id: projectId },
          data: { status: 'REPORT_DRAFTING' }
        });
      }
    }

    revalidatePath(`/portal/reports/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to save draft:', error);
    return { error: 'Failed to save report draft.' };
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
    revalidatePath(`/portal/projects/${projectId}`);
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

    revalidatePath(`/portal/projects/${projectId}`);
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

    // Save the client's request as a project message
    await prisma.projectMessage.create({
      data: {
        projectId,
        clientId: session.user.id,
        content: `**Rework Request:** ${message}`,
      }
    });

    revalidatePath(`/dashboard/projects/${projectId}`);
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
    revalidatePath(`/portal/projects/${projectId}`);
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

    if (project?.serviceRequest?.contactEmail) {
      const { sendMail } = await import('@/lib/mail');
      await sendMail({
        from: 'report@smohantyassociates.com',
        to: project.serviceRequest.contactEmail,
        subject: `Your Valuation Report is Ready [${project.projectCode}]`,
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2>Report Completed</h2>
            <p>Dear ${project.serviceRequest.contactName},</p>
            <p>Your property valuation report for <strong>${project.projectCode}</strong> has been successfully finalized.</p>
            <p>Please log in to your client dashboard to download the official PDF copy of your report.</p>
            <p>Thank you for choosing S. Mohanty Associates.</p>
          </div>
        `
      });
    }

    revalidatePath(`/portal/projects/${projectId}`);
    revalidatePath(`/dashboard/projects/${projectId}`);
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

    // Generate sequential projectCode (SMA-YYYY-NNN)
    const year = new Date().getFullYear();
    const projectCount = await prisma.project.count({
      where: { projectCode: { startsWith: `SMA-${year}-` } }
    });
    const nextNum = String(projectCount + 1).padStart(3, '0');
    const projectCode = `SMA-${year}-${nextNum}`;

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

    const project = await prisma.project.create({
      data: {
        projectCode,
        serviceRequestId: requestId,
        status: projectStatus as any,
        assignedManagerId,
      },
    });

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

    revalidatePath(`/portal/projects/${projectId}`);
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

    revalidatePath(`/portal/projects/${projectId}`);
    revalidatePath('/portal/projects');
    revalidatePath('/portal/dashboard');
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

    revalidatePath(`/portal/projects/${projectId}`);
    revalidatePath('/portal/projects');
    revalidatePath('/portal/dashboard');
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

    revalidatePath(`/portal/projects/${projectId}`);
    revalidatePath('/portal/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to cancel transfer:', error);
    return { error: 'Failed to cancel project transfer.' };
  }
}
