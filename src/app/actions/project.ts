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
  const caller = await prisma.user.findUnique({
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
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
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
