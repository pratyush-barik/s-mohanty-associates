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
  const user = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { employeeId: true, id: true },
  });

  if (!user) return { error: 'Employee not found.' };

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

  await prisma.employee.update({
    where: { id: session.user.id },
    data: { profilePhoto: publicUrl },
  });

  revalidatePath('/portal/profile');
  revalidatePath('/portal');

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

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'OWNER') {
    return { error: 'Only the Owner can create employee accounts.' };
  }

  const role = formData.get('role') as string;

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const mobile = formData.get('mobile') as string;
  const designation = formData.get('designation') as string;
  const tempPassword = formData.get('password') as string;

  // Validate required fields
  if (!name || !email || !role || !tempPassword) {
    return { error: 'All required fields must be filled.' };
  }

  // Check for duplicate email
  const [existingClient, existingEmployee] = await Promise.all([
    prisma.client.findUnique({ where: { email } }),
    prisma.employee.findUnique({ where: { email } }),
  ]);
  if (existingClient || existingEmployee) {
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

  const employeeCount = await prisma.employee.count({
    where: {
      role: { in: ['MANAGER', 'FIELD_EMPLOYEE', 'REPORT_EMPLOYEE'] }
    }
  });

  let nextNum = 1000 + employeeCount;
  let generatedEmployeeId = `${nextNum}${suffix}`;
  let exists = await prisma.employee.findUnique({ where: { employeeId: generatedEmployeeId } });
  while (exists) {
    nextNum++;
    generatedEmployeeId = `${nextNum}${suffix}`;
    exists = await prisma.employee.findUnique({ where: { employeeId: generatedEmployeeId } });
  }

  // Hash password and create user
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  await prisma.employee.create({
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

  // Send welcome email with login credentials
  try {
    const { sendMail } = await import('@/lib/mail');
    const loginUrl = process.env.NODE_ENV === 'production'
      ? 'https://smohantyassociates.com/auth/employee-login'
      : 'http://localhost:3000/auth/employee-login';
    await sendMail({
      to: email,
      subject: 'Welcome to S Mohanty Associates — Your Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f3f5; border-radius: 8px;">
          <h2 style="color: #0f2038;">Welcome to S Mohanty Associates!</h2>
          <p>Dear <strong>${name}</strong>,</p>
          <p>Your employee account has been created. Below are your login credentials:</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; border: 1px solid #e9ecef; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Employee ID:</strong> ${generatedEmployeeId}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> ${role.replace('_', ' ')}</p>
          </div>
          <p><a href="${loginUrl}" style="display: inline-block; background-color: #b8860b; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">Login Now</a></p>
          <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">Please change your password after your first login. If you did not expect this email, please contact your administrator.</p>
        </div>
      `,
    });
  } catch (mailErr) {
    console.error('Failed to send welcome email:', mailErr);
  }

  revalidatePath('/portal/employees');

  return { success: true, message: `Employee ${name} (${generatedEmployeeId}) created successfully. Welcome email sent.` };
}

export async function updateEmployee(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'OWNER') {
    return { error: 'Only the Owner can edit employee accounts.' };
  }

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const mobile = formData.get('mobile') as string;
  const designation = formData.get('designation') as string;
  const role = formData.get('role') as string;

  if (!id || !name || !email || !role) {
    return { error: 'Required fields must be filled.' };
  }

  // Fetch target employee
  const targetEmployee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!targetEmployee) {
    return { error: 'Employee not found.' };
  }

  // Check email duplicate
  const dupEmail = await prisma.employee.findFirst({
    where: { email, NOT: { id } },
  });
  if (dupEmail) {
    return { error: 'This email is already in use by another employee.' };
  }

  try {
    await prisma.employee.update({
      where: { id },
      data: {
        name,
        email,
        mobile: mobile || null,
        role: role as any,
        designation: designation || null,
      },
    });

    revalidatePath('/portal/employees');
    return { success: true, message: 'Employee details updated successfully.' };
  } catch (error) {
    console.error('Failed to update employee:', error);
    return { error: 'Failed to update employee details.' };
  }
}

export async function terminateEmployee(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'You must be logged in.' };
  }

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'OWNER') {
    return { error: 'Only the Owner can terminate employee accounts.' };
  }

  // Fetch target employee
  const targetEmployee = await prisma.employee.findUnique({
    where: { id },
  });

  if (!targetEmployee) {
    return { error: 'Employee not found.' };
  }

  try {
    // 1. Deactivate employee
    await prisma.employee.update({
      where: { id },
      data: { isActive: false },
    });

    const activeProjects = await prisma.project.findMany({
      where: {
        OR: [
          { assignedManagerId: id },
          { pendingManagerId: id },
          { fieldEmployees: { some: { id } } },
          { reportEmployeeId: id },
        ],
        status: { not: 'COMPLETED' },
      },
    });

    for (const project of activeProjects) {
      await prisma.project.update({
        where: { id: project.id },
        data: {
          assignedManagerId: project.assignedManagerId === id ? null : undefined,
          pendingManagerId: project.pendingManagerId === id ? null : undefined,
          fieldEmployees: {
            disconnect: { id },
          },
          reportEmployeeId: project.reportEmployeeId === id ? null : undefined,
        },
      });
    }

    revalidatePath('/portal/employees');
    return { success: true, message: 'Employee account terminated successfully.' };
  } catch (error) {
    console.error('Failed to terminate employee:', error);
    return { error: 'Failed to terminate employee account.' };
  }
}
