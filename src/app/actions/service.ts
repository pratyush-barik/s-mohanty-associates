'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ServiceRequestSchema, type ServiceRequestFormState } from '@/lib/definitions';
import { revalidatePath } from 'next/cache';
import { sendMail } from '@/lib/mail';
import { supabaseAdmin } from '@/lib/supabase';
import { STORAGE_BUCKETS } from '@/lib/supabase-client';

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

  const serviceRequest = await prisma.serviceRequest.create({
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

  // Create a linked Enquiry record with PORTAL_SIGNUP source for internal tracking
  const count = await prisma.enquiry.count();
  const ticketNumber = `SMA-${100 + count + 1}`;

  await prisma.enquiry.create({
    data: {
      ticketNumber,
      source: 'PORTAL_SIGNUP',
      serviceRequestId: serviceRequest.id,
      name: data.contactName,
      email: data.contactEmail,
      phone: data.contactPhone || null,
      subject: `${data.propertyType} — ${data.purpose}`,
      message: data.propertyDetails,
      senderType: 'INDIVIDUAL',
      status: 'NEW',
    },
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/requests');

  return { success: true, message: 'Your service request has been submitted successfully!' };
}

/**
 * Upload an attachment for a project message to Supabase Storage.
 * Returns the file URL and document record.
 */
export async function uploadProjectMessageAttachment(
  projectId: string,
  formData: FormData
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in.' };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        serviceRequest: true,
        fieldEmployees: { select: { id: true } },
      },
    });

    if (!project) {
      return { error: 'Project not found.' };
    }

    const userRole = (session.user as any).role;
    const isAssigned =
      project.assignedManagerId === session.user.id ||
      project.reportEmployeeId === session.user.id ||
      project.fieldEmployees?.some((e) => e.id === session.user.id);

    const isClientOwner = userRole === 'CLIENT' && project.serviceRequest?.clientId === session.user.id;

    if (userRole !== 'OWNER' && !isAssigned && !isClientOwner) {
      return { error: 'You do not have access to this project.' };
    }

    const file = formData.get('file') as File | null;
    if (!file) {
      return { error: 'No file provided.' };
    }

    const fileName = `${projectId}/${Date.now()}-${file.name}`;
    const bucket = STORAGE_BUCKETS.ENQUIRY_FILES;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(fileName, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: `Failed to upload file. Supabase Error: ${uploadError.message}` };
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from(bucket).getPublicUrl(fileName);

    const document = await prisma.document.create({
      data: {
        name: file.name,
        url: publicUrlData.publicUrl,
        type: file.type || 'application/octet-stream',
        size: file.size,
        projectId,
      },
    });

    revalidatePath(`/portal/projects/${projectId}`);
    return { success: true, document };
  } catch (err: any) {
    console.error('Exception in uploadProjectMessageAttachment:', err);
    return { error: `Server exception: ${err?.message || String(err)}` };
    return { error: err?.message || String(err) };
  }
}

/**
 * Send a project message (chat). For Gmail/External source projects,
 * also sends an email reply to the client.
 */
export async function sendProjectMessage(
  projectId: string,
  content: string,
  attachmentDocIds: string[] = []
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { error: 'You must be logged in.' };
    }

    if (!content.trim() && attachmentDocIds.length === 0) {
      return { error: 'Message cannot be empty.' };
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        serviceRequest: true,
        fieldEmployees: { select: { id: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    if (!project) {
      return { error: 'Project not found.' };
    }

    const userRole = (session.user as any).role;
    const isAssigned =
      project.assignedManagerId === session.user.id ||
      project.fieldEmployees.some((e) => e.id === session.user.id) ||
      project.reportEmployeeId === session.user.id;

    const isClientOwner = userRole === 'CLIENT' && project.serviceRequest?.clientId === session.user.id;

    if (!isAssigned && userRole !== 'OWNER' && !isClientOwner) {
      return { error: 'You do not have access to this project.' };
    }

    // Check for pending transfer — if the project is in transfer state,
    // only the current manager and the target manager can chat
    if (project.pendingManagerId) {
      const isCurrentManager = project.assignedManagerId === session.user.id;
      const isTargetManager = project.pendingManagerId === session.user.id;
      const isOwner = userRole === 'OWNER';
      if (!isCurrentManager && !isTargetManager && !isOwner) {
        return { error: 'This project is pending transfer. You cannot send messages until the transfer is resolved.' };
      }
    }

    // Create the message
    const message = await prisma.projectMessage.create({
      data: {
        projectId,
        content: content.trim(),
        employeeId: userRole === 'CLIENT' ? null : session.user.id,
        clientId: userRole === 'CLIENT' ? session.user.id : null,
      },
    });

    // Link attachments to the message
    if (attachmentDocIds.length > 0) {
      await prisma.document.updateMany({
        where: {
          id: { in: attachmentDocIds },
          projectId,
        },
        data: { messageId: message.id },
      });
    }

    const replyTextLower = content.trim().toLowerCase();

    // Send email reply for Gmail or External source projects
    const shouldEmail = project.source === 'GMAIL' || project.source === 'EXTERNAL';

    if (shouldEmail) {
      const contactEmail = project.serviceRequest?.contactEmail || project.serviceRequest?.guestEmail;
      if (contactEmail) {
        const projectCode = project.projectCode;
        let attachmentLinks = '';
        if (attachmentDocIds.length > 0) {
          const docs = await prisma.document.findMany({
            where: { id: { in: attachmentDocIds }, projectId },
            select: { url: true },
          });
          attachmentLinks = docs.map(d => d.url).filter(Boolean).join('\n');
        }

        await sendMail({
          from: 'smohantyassociate@gmail.com',
          to: contactEmail,
          subject: `Re: [${projectCode}] ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <p>${content.replace(/\n/g, '<br/>')}</p>
              ${attachmentLinks ? `<p><strong>Attachments:</strong><br/>${attachmentLinks}</p>` : ''}
              <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;" />
              <p style="font-size: 12px; color: #6c757d;">Project Code: <strong>${projectCode}</strong></p>
              <p style="font-size: 12px; color: #6c757d;">This is an automated reply from S. Mohanty Associates.</p>
            </div>
          `,
        });
      }
    }

    revalidatePath(`/portal/projects/${projectId}`);
    return { success: true, messageId: message.id };
  } catch (err: any) {
    console.error('Exception in sendProjectMessage:', err);
    return { error: `Server exception in send: ${err?.message || String(err)}` };
  }
}
