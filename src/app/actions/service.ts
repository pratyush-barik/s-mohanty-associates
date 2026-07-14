'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ServiceRequestSchema, type ServiceRequestFormState } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';

export async function submitServiceRequest(
  state: ServiceRequestFormState,
  formData: FormData
): Promise<ServiceRequestFormState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { message: 'You must be logged in to submit a service request.' };
  }

  const validatedFields = ServiceRequestSchema.safeParse({
    propertyType: formData.get('propertyType'),
    purpose: formData.get('purpose'),
    propertyDetails: formData.get('propertyDetails'),
    propertyAddress: formData.get('propertyAddress'),
    contactName: formData.get('contactName'),
    contactPhone: formData.get('contactPhone'),
    contactEmail: formData.get('contactEmail'),
    additionalNotes: formData.get('additionalNotes'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const data = validatedFields.data;

  await prisma.serviceRequest.create({
    data: {
      clientId: session.user.id,
      propertyType: data.propertyType,
      purpose: data.purpose,
      propertyDetails: data.propertyDetails,
      propertyAddress: data.propertyAddress,
      contactName: data.contactName,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      additionalNotes: data.additionalNotes || null,
      status: 'SUBMITTED',
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/requests');

  return { success: true, message: 'Your service request has been submitted successfully!' };
}

export async function sendProjectMessage(projectId: string, content: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  if (!content.trim()) {
    return { error: 'Message cannot be empty.' };
  }

  // Verify user has access to this project
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { serviceRequest: true },
  });

  if (!project) {
    return { error: 'Project not found.' };
  }

  const userRole = (session.user as any).role;
  const isClient = project.serviceRequest.clientId === session.user.id;
  const isAssigned =
    project.assignedManagerId === session.user.id ||
    project.fieldEmployeeId === session.user.id ||
    project.reportEmployeeId === session.user.id;

  if (!isClient && !isAssigned && userRole !== 'OWNER') {
    return { error: 'You do not have access to this project.' };
  }

  await prisma.projectMessage.create({
    data: {
      projectId,
      senderId: session.user.id,
      content: content.trim(),
    },
  });

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/portal/projects/${projectId}`);

  return { success: true };
}
