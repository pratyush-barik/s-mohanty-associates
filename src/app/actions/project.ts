'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

/**
 * Assign a Field Employee and Report Employee to a Project.
 * Only Managers and Owners can perform this action.
 */
export async function assignProjectStaff(
  projectId: string,
  fieldEmployeeId: string | null,
  reportEmployeeId: string | null
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  // Verify caller is Owner or Manager
  const caller = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!caller || !['OWNER', 'MANAGER'].includes(caller.role)) {
    return { error: 'You do not have permission to assign staff.' };
  }

  try {
    // Determine the new status
    // If we are assigning staff, it moves to ASSIGNED (if it was PENDING_REVIEW or APPROVED)
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
      select: { status: true },
    });

    if (!currentProject) {
      return { error: 'Project not found.' };
    }

    let newStatus = currentProject.status;
    if (currentProject.status === 'PENDING_REVIEW' || currentProject.status === 'APPROVED') {
      newStatus = 'ASSIGNED';
    }

    await prisma.project.update({
      where: { id: projectId },
      data: {
        fieldEmployeeId,
        reportEmployeeId,
        assignedManagerId: session.user.id, // The manager who assigned them takes ownership
        status: newStatus,
      },
    });

    // If a field employee was assigned, ensure an Inspection record exists
    if (fieldEmployeeId) {
      const existingInspection = await prisma.inspection.findUnique({
        where: { projectId },
      });

      if (!existingInspection) {
        await prisma.inspection.create({
          data: {
            projectId,
            employeeId: fieldEmployeeId,
            status: 'PENDING',
          },
        });
      } else {
        // Update the assigned employee if it changed
        await prisma.inspection.update({
          where: { projectId },
          data: { employeeId: fieldEmployeeId },
        });
      }
    }

    revalidatePath(`/portal/projects/${projectId}`);
    revalidatePath('/portal/projects');
    return { success: true };
  } catch (error) {
    console.error('Failed to assign staff:', error);
    return { error: 'Failed to assign staff to the project.' };
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
export async function sendReportForRework(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const report = await prisma.report.findFirst({ where: { projectId } });
    if (!report) return { error: 'Report data not found.' };

    await prisma.report.update({
      where: { id: report.id },
      data: { status: 'REVISION_REQUESTED' }
    });

    await prisma.project.update({
      where: { id: projectId },
      data: { status: 'REPORT_DRAFTING' }
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
 * Manager: Finalize report with PDF URL
 */
export async function finalizeReport(projectId: string, pdfUrl: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: 'Unauthorized' };

  try {
    const report = await prisma.report.findFirst({ where: { projectId } });
    if (!report) return { error: 'Report data not found.' };

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
      data: { status: 'COMPLETED' }
    });

    revalidatePath(`/portal/projects/${projectId}`);
    revalidatePath(`/dashboard/projects/${projectId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to finalize report:', error);
    return { error: 'Failed to finalize report.' };
  }
}
