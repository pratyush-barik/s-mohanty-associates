'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { supabaseAdmin, STORAGE_BUCKETS, getPublicUrl } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';

/**
 * Upload or update an employee's profile photo to Supabase Storage.
 * File is saved as {employeeId}.{extension}, overwriting any previous photo.
 */
export async function uploadProfilePhoto(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  const file = formData.get('photo') as File;
  if (!file || file.size === 0) {
    return { error: 'Please select an image.' };
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { error: 'Only JPEG, PNG, and WebP images are allowed.' };
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'Image must be under 5MB.' };
  }

  // Get employee info
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true, id: true },
  });

  if (!user) return { error: 'User not found.' };

  // Determine file path: use employeeId if available, otherwise user id
  const identifier = user.employeeId || user.id;
  const extension = file.type.split('/')[1] === 'jpeg' ? 'jpg' : file.type.split('/')[1];
  const filePath = `${identifier}.${extension}`;

  // Convert File to Buffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Upload to Supabase Storage (upsert — overwrites if exists)
  const { error: uploadError } = await supabaseAdmin.storage
    .from(STORAGE_BUCKETS.EMPLOYEE_PROFILES)
    .upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('Supabase upload error:', uploadError);
    return { error: 'Failed to upload image. Please try again.' };
  }

  // Get public URL and update database
  const publicUrl = getPublicUrl(STORAGE_BUCKETS.EMPLOYEE_PROFILES, filePath);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { profilePhoto: publicUrl },
  });

  revalidatePath('/portal/profile');
  revalidatePath('/portal/dashboard');

  return { success: true, url: publicUrl };
}

/**
 * Create a new employee account (Owner/Admin only).
 * Generates a temporary password and creates the user with the specified role.
 */
export async function createEmployee(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  // Only Owner can create employees
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'OWNER') {
    return { error: 'Only the Owner can create employee accounts.' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const mobile = formData.get('mobile') as string;
  const role = formData.get('role') as string;
  const designation = formData.get('designation') as string;
  const tempPassword = formData.get('password') as string;

  // Validate required fields
  if (!name || !email || !role || !tempPassword) {
    return { error: 'All required fields must be filled.' };
  }

  // Check for duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  // Validate role
  const validRoles = ['MANAGER', 'FIELD_EMPLOYEE', 'REPORT_EMPLOYEE'];
  if (!validRoles.includes(role)) {
    return { error: 'Invalid role selected.' };
  }

  // Auto-generate employeeId (e.g., 1000M, 1001R, 1002F)
  let suffix = '';
  if (role === 'MANAGER') suffix = 'M';
  else if (role === 'FIELD_EMPLOYEE') suffix = 'F';
  else if (role === 'REPORT_EMPLOYEE') suffix = 'R';
  else if (role === 'OWNER') suffix = 'O';

  const employeeCount = await prisma.user.count({
    where: {
      role: { in: ['MANAGER', 'FIELD_EMPLOYEE', 'REPORT_EMPLOYEE'] }
    }
  });

  let nextNum = 1000 + employeeCount;
  let generatedEmployeeId = `${nextNum}${suffix}`;
  let exists = await prisma.user.findUnique({ where: { employeeId: generatedEmployeeId } });
  while (exists) {
    nextNum++;
    generatedEmployeeId = `${nextNum}${suffix}`;
    exists = await prisma.user.findUnique({ where: { employeeId: generatedEmployeeId } });
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  await prisma.user.create({
    data: {
      name,
      email,
      mobile: mobile || null,
      password: hashedPassword,
      role: role as any,
      designation: designation || null,
      employeeId: generatedEmployeeId,
      isActive: true,
    },
  });

  revalidatePath('/portal/employees');

  return { success: true, message: `Employee ${name} (${generatedEmployeeId}) created successfully.` };
}
