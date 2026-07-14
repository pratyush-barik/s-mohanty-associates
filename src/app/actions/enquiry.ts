'use server';

import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';

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
    await prisma.enquiry.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
        senderType: senderType as any,
        organisationName: organisationName || null,
      },
    });

    return { success: true };
  } catch {
    return { error: 'Something went wrong. Please try again later.' };
  }
}

/**
 * Update an enquiry's status (Manager/Owner only).
 */
export async function updateEnquiryStatus(enquiryId: string, status: 'READ' | 'REPLIED') {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  // Verify role
  const user = await prisma.user.findUnique({
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
