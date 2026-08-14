'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { sendMail } from '@/lib/mail';
import { headers } from 'next/headers';
import { checkEnquiryRateLimit } from '@/lib/rate-limit';

/**
 * Submit a public enquiry from the Contact Us form.
 * No authentication required.
 */
export async function submitEnquiry(formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const subject = formData.get('subject') as string;
  const message = formData.get('message') as string;
  const senderType = (formData.get('senderType') as string) || 'INDIVIDUAL';
  const organisationName = formData.get('organisationName') as string;

  // Bot Protection / Spam Prevention
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for') || '127.0.0.1';
  const rateLimit = checkEnquiryRateLimit(ip);
  if (!rateLimit.allowed) {
    return { error: 'Too many requests from this IP. Please try again in an hour.' };
  }

  if (!name || !email || !subject || !message) {
    return { error: 'Please fill in all required fields.' };
  }

  if (senderType === 'ORGANISATION' && !organisationName) {
    return { error: 'Please provide the organisation name.' };
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address.' };
  }

  try {
    const count = await prisma.enquiry.count();
    const ticketNumber = `SMA-${100 + count + 1}`;

    const enquiry = await prisma.enquiry.create({
      data: {
        ticketNumber,
        source: 'WEBSITE',
        name,
        email,
        phone: phone || null,
        subject,
        message, // storing for base text
        senderType: senderType as any,
        organisationName: organisationName || null,
        status: 'NEW',
        messages: {
          create: {
            sender: 'CLIENT',
            body: message,
          },
        },
      },
    });

    // Send auto-reply
    await sendMail({
      from: 'info@smohantyassociates.com',
      to: email,
      subject: `We've received your enquiry [Ticket #${ticketNumber}]`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #0f2038;">Enquiry Received</h2>
          <p>Dear ${name},</p>
          <p>Thank you for reaching out to S Mohanty & Associates.</p>
          <p>We have successfully received your enquiry regarding "<strong>${subject}</strong>".</p>
          <p>A member of our team will review your request and get back to you shortly. You can reply directly to this email to add more information to your ticket.</p>
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6c757d;">Your Ticket Number: <strong>${ticketNumber}</strong></p>
          <p style="font-size: 12px; color: #6c757d;">Please keep the ticket number in the subject line of your replies.</p>
        </div>
      `,
    });

    return { success: true };
  } catch {
    return { error: 'Something went wrong. Please try again later.' };
  }
}

/**
 * Update an enquiry's status (Manager/Owner only).
 */
export async function updateEnquiryStatus(enquiryId: string, status: 'NEW' | 'WAITING_FOR_CLIENT' | 'IN_PROGRESS' | 'CLOSED') {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  const user = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !['OWNER', 'MANAGER'].includes(user.role)) {
    return { error: 'Only managers can manage enquiries.' };
  }

  try {
    await prisma.enquiry.update({
      where: { id: enquiryId },
      data: { status },
    });

    revalidatePath('/portal/enquiries');
    return { success: true };
  } catch {
    return { error: 'Failed to update enquiry status.' };
  }
}

/**
 * Reply to an enquiry (Manager/Owner only).
 */
export async function replyToEnquiry(enquiryId: string, body: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  const user = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !['OWNER', 'MANAGER'].includes(user.role)) {
    return { error: 'Only managers can reply to enquiries.' };
  }

  try {
    const enquiry = await prisma.enquiry.findUnique({
      where: { id: enquiryId },
    });

    if (!enquiry) {
      return { error: 'Enquiry not found.' };
    }

    // Save the message
    await prisma.enquiryMessage.create({
      data: {
        enquiryId,
        sender: 'MANAGER',
        body,
      },
    });

    // Update status
    await prisma.enquiry.update({
      where: { id: enquiryId },
      data: { status: 'WAITING_FOR_CLIENT' },
    });

    // Send email to client
    await sendMail({
      from: 'manager@smohantyassociates.com',
      to: enquiry.email,
      subject: `Re: ${enquiry.subject} [Ticket #${enquiry.ticketNumber}]`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <p>${body.replace(/\\n/g, '<br/>')}</p>
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6c757d;">Ticket Number: <strong>${enquiry.ticketNumber}</strong></p>
          <p style="font-size: 12px; color: #6c757d;">Please reply directly to this email and keep the ticket number in the subject line.</p>
        </div>
      `,
    });

    revalidatePath(`/portal/enquiries/${enquiryId}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: 'Failed to reply to enquiry.' };
  }
}
