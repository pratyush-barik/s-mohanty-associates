'use server';

import { signIn, auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SignupFormSchema, LoginFormSchema, ProfileUpdateSchema, type SignupFormState, type LoginFormState } from '@/lib/definitions';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';
import { escapeHtml } from '@/lib/mail';
import { checkIpRateLimit, checkAccountRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limit';
import { logSecurityEvent } from '@/lib/security-log';

export async function signup(state: SignupFormState, formData: FormData): Promise<SignupFormState> {
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    clientType: formData.get('clientType'),
    name: formData.get('name'),
    email: formData.get('email'),
    mobile: formData.get('mobile'),
    password: formData.get('password'),
    organisationName: formData.get('organisationName'),
    otp: formData.get('otp'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { clientType, name, email, mobile, password, organisationName, otp } = validatedFields.data;

  // 1. Verify email validation code (Allow permanent test code only if env var is set)
  const ALLOWED_TEST_OTP = process.env.ALLOWED_TEST_OTP || '';
  if (!ALLOWED_TEST_OTP || otp !== ALLOWED_TEST_OTP) {
    const otpRecord = await prisma.otp.findFirst({
      where: {
        email,
        code: otp,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      return {
        message: 'Invalid or expired email verification code. Please click Verify to receive a code.',
      };
    }

    // Delete verification OTP
    await prisma.otp.deleteMany({ where: { email } });
  }

  if (clientType === 'ORGANISATION' && !organisationName) {
    return {
      message: 'Organisation name is required for Organisation accounts.',
    };
  }

  // Check if user already exists
  const [existingClient, existingEmployee] = await Promise.all([
    prisma.client.findUnique({ where: { email } }),
    prisma.employee.findUnique({ where: { email } }),
  ]);

  if (existingClient || existingEmployee) {
    return {
      message: 'An account with this email already exists. Please log in.',
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Generate unique Client ID (e.g. C1000)
  const clientCount = await prisma.client.count();
  let nextNum = 1000 + clientCount;
  let clientId = `C${nextNum}`;
  let exists = await prisma.client.findUnique({ where: { clientId } });
  while (exists) {
    nextNum++;
    clientId = `C${nextNum}`;
    exists = await prisma.client.findUnique({ where: { clientId } });
  }

  // Create client with appropriate profile
  let user;
  if (clientType === 'INDIVIDUAL') {
    user = await prisma.client.create({
      data: {
        email,
        password: hashedPassword,
        clientType: 'INDIVIDUAL',
        clientId,
        individual: {
          create: {
            name,
            mobile: mobile || null,
          },
        },
      },
    });
  } else {
    user = await prisma.client.create({
      data: {
        email,
        password: hashedPassword,
        clientType: 'ORGANISATION',
        clientId,
        organisation: {
          create: {
            organisationName: organisationName!,
            contactName: name,
            mobile: mobile || null,
          },
        },
      },
    });
  }

  if (!user) {
    return {
      message: 'An error occurred while creating your account. Please try again.',
    };
  }

  return { success: true, message: 'Account created successfully! Please log in.' };
}

export async function requestRegistrationOtp(email: string) {
  if (!email) return { error: 'Email address is required.' };

  try {
    // 1. Verify email does not already exist
    const [existingClient, existingEmployee] = await Promise.all([
      prisma.client.findUnique({ where: { email } }),
      prisma.employee.findUnique({ where: { email } }),
    ]);

    if (existingClient || existingEmployee) {
      return { error: 'An account with this email already exists. Please log in.' };
    }

    // 2. Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity

    // 3. Store OTP in DB (clearing any old ones for this email first)
    await prisma.otp.deleteMany({ where: { email } });
    await prisma.otp.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // 4. Send email
    const { sendMail } = await import('@/lib/mail');
    const mailResult = await sendMail({
      from: 'otp@smohantyassociates.com',
      to: email,
      subject: 'Verify Your Email - S Mohanty Associates',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f3f5; border-radius: 8px;">
          <h2 style="color: #0f2038;">S Mohanty Associates</h2>
          <p>Thank you for starting your registration. Please use the following One-Time Password (OTP) to verify your email address. This code is valid for 5 minutes.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #b8860b; border: 1px solid #e9ecef; margin: 20px 0;">
            ${escapeHtml(code)}
          </div>
          <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">If you did not request this verification, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (mailResult.error) {
      return { error: 'Failed to send verification email. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to request registration OTP:', error);
    return { error: 'An error occurred while generating the OTP.' };
  }
}

export async function login(state: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const { headers } = await import('next/headers');
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || headersList.get('x-real-ip') || 'unknown';

  const portal = formData.get('portal');
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const otp = formData.get('otp') as string;

  if (!email || !password) {
    return { message: 'Email and password are required.' };
  }

  const validatedFields = LoginFormSchema.safeParse({ email, password });
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // ── Rate Limiting (per IP) ──
  const ipCheck = checkIpRateLimit(ip);
  if (!ipCheck.allowed) {
    logSecurityEvent({ event: 'RATE_LIMIT_HIT', email, ipAddress: ip, metadata: { portal, retryAfter: ipCheck.retryAfterSeconds } });
    return { message: `Too many login attempts. Please wait ${Math.ceil(ipCheck.retryAfterSeconds / 60)} minutes before trying again.` };
  }

  const accountCheck = checkAccountRateLimit(email);
  if (!accountCheck.allowed) {
    logSecurityEvent({ event: 'RATE_LIMIT_HIT', email, ipAddress: ip, metadata: { portal, type: 'account', retryAfter: accountCheck.retryAfterSeconds } });
    return { message: `Too many login attempts for this account. Please wait before trying again.` };
  }

  // Use a single generic error message to prevent account enumeration
  const GENERIC_LOGIN_ERROR = 'Invalid email or password. Please try again.';
  const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  const MAX_FAILED_ATTEMPTS = 5;

  if (portal === 'CLIENT') {
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (!existingClient) {
      recordFailedAttempt(ip, email);
      logSecurityEvent({ event: 'LOGIN_FAILED', email, ipAddress: ip, metadata: { portal, reason: 'not_found' } });
      return { message: GENERIC_LOGIN_ERROR };
    }

    // ── Account Lockout Check ──
    if (existingClient.lockedUntil && existingClient.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingClient.lockedUntil.getTime() - Date.now()) / 60000);
      return { message: `Your account has been temporarily locked due to too many failed attempts. Please try again in ${minutesLeft} minutes or reset your password.` };
    }

    const passwordMatch = await bcrypt.compare(password, existingClient.password);
    if (!passwordMatch) {
      const newCount = existingClient.failedLoginAttempts + 1;
      const lockData: any = { failedLoginAttempts: newCount, lastFailedLoginIp: ip };
      if (newCount >= MAX_FAILED_ATTEMPTS) {
        lockData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        logSecurityEvent({ event: 'ACCOUNT_LOCKED', email, ipAddress: ip, metadata: { portal, attempts: newCount } });
      }
      await prisma.client.update({ where: { id: existingClient.id }, data: lockData });
      recordFailedAttempt(ip, email);
      logSecurityEvent({ event: 'LOGIN_FAILED', email, ipAddress: ip, metadata: { portal, attempts: newCount } });
      return { message: GENERIC_LOGIN_ERROR };
    }
  } else {
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });

    if (!existingEmployee || !existingEmployee.isActive) {
      recordFailedAttempt(ip, email);
      logSecurityEvent({ event: 'LOGIN_FAILED', email, ipAddress: ip, metadata: { portal, reason: existingEmployee ? 'inactive' : 'not_found' } });
      return { message: GENERIC_LOGIN_ERROR };
    }

    // ── Account Lockout Check ──
    if (existingEmployee.lockedUntil && existingEmployee.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((existingEmployee.lockedUntil.getTime() - Date.now()) / 60000);
      return { message: `Your account has been temporarily locked due to too many failed attempts. Please try again in ${minutesLeft} minutes or reset your password.` };
    }

    const passwordMatch = await bcrypt.compare(password, existingEmployee.password);
    if (!passwordMatch) {
      const newCount = existingEmployee.failedLoginAttempts + 1;
      const lockData: any = { failedLoginAttempts: newCount, lastFailedLoginIp: ip };
      if (newCount >= MAX_FAILED_ATTEMPTS) {
        lockData.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        logSecurityEvent({ event: 'ACCOUNT_LOCKED', email, ipAddress: ip, metadata: { portal, attempts: newCount } });
      }
      await prisma.employee.update({ where: { id: existingEmployee.id }, data: lockData });
      recordFailedAttempt(ip, email);
      logSecurityEvent({ event: 'LOGIN_FAILED', email, ipAddress: ip, metadata: { portal, attempts: newCount } });
      return { message: GENERIC_LOGIN_ERROR };
    }
  }

  // 2. If password matched but no OTP code provided yet, generate and send OTP for 2FA
  if (!otp) {
    const otpResult = await requestOtp(email, portal as 'CLIENT' | 'EMPLOYEE');
    if (otpResult.error) {
      return { message: otpResult.error };
    }
    return { success: true, require2FA: true, email };
  }

  try {
    await signIn('credentials', {
      email,
      password,
      otp,
      portal: portal as string,
      redirect: false,
    });

    // ── Reset lockout on successful login ──
    resetRateLimit(ip, email);
    if (portal === 'CLIENT') {
      await prisma.client.updateMany({ where: { email }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    } else {
      await prisma.employee.updateMany({ where: { email }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }
    logSecurityEvent({ event: 'LOGIN_SUCCESS', email, ipAddress: ip, metadata: { portal } });
    
    const session = await auth();
    if (session?.user?.role) {
      const role = session.user.role;
      if (role === 'OWNER') redirect('/portal/owner');
      if (role === 'MANAGER') redirect('/portal/manager');
      if (role === 'FIELD_EMPLOYEE') redirect('/portal/field-agent');
      if (role === 'REPORT_EMPLOYEE') redirect('/portal/report-agent');
      if (role === 'CLIENT') redirect('/dashboard');
    }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return { message: GENERIC_LOGIN_ERROR };
        default:
          return { message: 'Something went wrong. Please try again.' };
      }
    }
    throw error;
  }

  redirect('/dashboard');
}

export async function logout() {
  // signOut handled client-side via next-auth
}

export async function updateClientProfile(formData: FormData) {
  const { revalidatePath } = await import('next/cache');
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'CLIENT') {
    return { error: 'Unauthorized' };
  }

  const validatedFields = ProfileUpdateSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    mobile: formData.get('mobile'),
    organisationName: formData.get('organisationName'),
    otp: formData.get('otp'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Invalid input. Please check your details.',
      details: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, mobile, organisationName, otp } = validatedFields.data;

  if (!email || !name) {
    return { error: 'Required fields must be completed.' };
  }

  try {
    // 1. Fetch current client data to get connected email and profile type
    const currentClient = await prisma.client.findUnique({
      where: { id: session.user.id },
      include: { individual: true, organisation: true },
    });

    if (!currentClient) {
      return { error: 'Client profile not found.' };
    }

    const connectedEmail = currentClient.email;
    const clientType = currentClient.clientType; // Lock clientType from DB directly

    // 2. Check if OTP is provided. If not, generate and send OTP to the currently connected email
    if (!otp) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity

      await prisma.otp.deleteMany({ where: { email: connectedEmail } });
      await prisma.otp.create({
        data: {
          email: connectedEmail,
          code,
          expiresAt,
        },
      });

      const { sendMail } = await import('@/lib/mail');
      const mailResult = await sendMail({
        from: 'otp@smohantyassociates.com',
        to: connectedEmail,
        subject: 'Confirm Profile Changes - S Mohanty Associates',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f3f5; border-radius: 8px;">
          <h2 style="color: #0f2038;">S Mohanty Associates</h2>
          <p>You have requested to update your profile details. Please enter the following One-Time Password (OTP) to confirm and apply these changes. This code is valid for 5 minutes.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #b8860b; border: 1px solid #e9ecef; margin: 20px 0;">
            ${escapeHtml(code)}
          </div>
          <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">If you did not request this update, please ignore this message.</p>
        </div>
      `,
      });

      if (mailResult.error) {
        return { error: 'Failed to send verification code. Please try again.' };
      }

      return { success: true, requireVerification: true, email: connectedEmail };
    }

    // 3. OTP is provided. Verify it against database (Allow permanent test code only if env var is set)
    const ALLOWED_TEST_OTP_PROFILE = process.env.ALLOWED_TEST_OTP || '';
    if (!ALLOWED_TEST_OTP_PROFILE || otp !== ALLOWED_TEST_OTP_PROFILE) {
      const otpRecord = await prisma.otp.findFirst({
        where: {
          email: connectedEmail,
          code: otp,
          expiresAt: { gte: new Date() },
        },
      });

      if (!otpRecord) {
        return { error: 'Invalid or expired verification code.' };
      }

      // Clear verification OTP
      await prisma.otp.deleteMany({ where: { email: connectedEmail } });
    }

    // 4. Check duplicate email if they are trying to change it
    if (email !== connectedEmail) {
      const [dupClient, dupEmployee] = await Promise.all([
        prisma.client.findFirst({
          where: { email, NOT: { id: session.user.id } },
        }),
        prisma.employee.findFirst({
          where: { email },
        }),
      ]);

      if (dupClient || dupEmployee) {
        return { error: 'This email is already in use by another account.' };
      }
    }

    // 5. Update database records
    await prisma.$transaction(async (tx) => {
      // Update core client email
      await tx.client.update({
        where: { id: session.user.id },
        data: {
          email,
        },
      });

      if (clientType === 'INDIVIDUAL') {
        await tx.individualProfile.update({
          where: { clientId: session.user.id },
          data: {
            name,
            mobile: mobile || null,
          },
        });
      } else {
        await tx.organisationProfile.update({
          where: { clientId: session.user.id },
          data: {
            organisationName,
            contactName: name,
            mobile: mobile || null,
          },
        });
      }
    });

    revalidatePath('/dashboard/profile');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Failed to update client profile:', error);
    return { error: 'An error occurred while updating your profile.' };
  }
}

export async function requestOtp(email: string, portal: 'CLIENT' | 'EMPLOYEE') {
  if (!email) return { error: 'Email address is required.' };

  try {
    // 1. Verify that user exists in their respective portal
    if (portal === 'CLIENT') {
      const client = await prisma.client.findUnique({ where: { email } });
      if (!client) {
        return { error: 'No client account found with this email. Please register.' };
      }
    } else {
      const employee = await prisma.employee.findUnique({ where: { email } });
      if (!employee) {
        return { error: 'No employee account found with this email.' };
      }
      if (!employee.isActive) {
        return { error: 'This employee account is inactive.' };
      }
    }

    // 2. Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins validity

    // 3. Store OTP in DB (clearing any old ones for this email first)
    await prisma.otp.deleteMany({ where: { email } });
    await prisma.otp.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // 4. Send email
    const { sendMail } = await import('@/lib/mail');
    const mailResult = await sendMail({
      from: 'otp@smohantyassociates.com',
      to: email,
      subject: 'Your S Mohanty Associates Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f3f5; border-radius: 8px;">
          <h2 style="color: #0f2038;">S Mohanty Associates</h2>
          <p>Please use the following One-Time Password (OTP) to log in to your account. This code is valid for 5 minutes.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #b8860b; border: 1px solid #e9ecef; margin: 20px 0;">
            ${escapeHtml(code)}
          </div>
          <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">If you did not request this login code, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (mailResult.error) {
      return { error: 'Failed to send OTP email. Please try again.' };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to request OTP:', error);
    return { error: 'An error occurred while generating the OTP.' };
  }
}

// ═══════════════════════════════════════════
// CHANGE PASSWORD (Client + Employee)
// ═══════════════════════════════════════════

const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', '1234', 'qwerty', '12345', 'abc123',
  'password1', 'password123', 'qwerty123', 'iloveyou', 'welcome', 'admin',
  'letmein', 'monkey', 'master', 'dragon', 'trustno1', 'baseball', 'shadow',
  'passw0rd', 'p@ssword', 'changeme', 'default', 'guest', 'login', '111111',
  '123123', '654321', '123456789', 'superman', 'batman', 'football', 'soccer',
]);

function validateNewPassword(password: string): string | null {
  if (password.length < 12) return 'Password must be at least 12 characters long.';
  if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Password must contain at least one special character (!@#$%^&* etc.).';
  if (COMMON_PASSWORDS.has(password.toLowerCase())) return 'This password is too common. Please choose a stronger password.';
  return null;
}

export async function changePassword(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Unauthorized. Please log in again.' };
  }

  const currentPassword = (formData.get('currentPassword') as string)?.trim();
  const newPassword = (formData.get('newPassword') as string)?.trim();
  const confirmPassword = (formData.get('confirmPassword') as string)?.trim();
  const portal = formData.get('portal') as string; // 'CLIENT' or 'EMPLOYEE'
  const otp = (formData.get('otp') as string)?.trim();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'All password fields are required.' };
  }

  if (newPassword !== confirmPassword) {
    return { error: 'New password and confirmation do not match.' };
  }

  // Validate new password strength
  const validationError = validateNewPassword(newPassword);
  if (validationError) {
    return { error: validationError };
  }

  try {
    // Determine user email based on portal
    let userEmail: string;
    let userPasswordHash: string;

    if (portal === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, password: true },
      });
      if (!client) return { error: 'Account not found.' };
      userEmail = client.email;
      userPasswordHash = client.password;
    } else {
      const employee = await prisma.employee.findUnique({
        where: { id: session.user.id },
        select: { id: true, email: true, password: true },
      });
      if (!employee) return { error: 'Account not found.' };
      userEmail = employee.email;
      userPasswordHash = employee.password;
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, userPasswordHash);
    if (!isCurrentValid) {
      return { error: 'Current password is incorrect.' };
    }

    // Ensure new password is different
    const isSamePassword = await bcrypt.compare(newPassword, userPasswordHash);
    if (isSamePassword) {
      return { error: 'New password must be different from your current password.' };
    }

    // ── STEP 1: No OTP provided yet → Send OTP to user's email ──
    if (!otp) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

      await prisma.otp.deleteMany({ where: { email: userEmail } });
      await prisma.otp.create({ data: { email: userEmail, code, expiresAt } });

      const { sendMail } = await import('@/lib/mail');
      const mailResult = await sendMail({
        to: userEmail,
        subject: 'Password Change Verification — S Mohanty Associates',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f3f5; border-radius: 8px;">
            <h2 style="color: #0f2038;">S Mohanty Associates</h2>
            <p style="color: #343a40;">You have requested to change your account password. Please use the following verification code to confirm this action.</p>
            <div style="background-color: #fff5f5; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #dc3545; border: 1px solid #f5c6cb; margin: 20px 0;">
              ${escapeHtml(code)}
            </div>
            <p style="color: #6c757d; font-size: 12px;">This code is valid for <strong>5 minutes</strong>. If you did not request this password change, please ignore this email and ensure your account is secure.</p>
            <hr style="border: none; border-top: 1px solid #e9ecef; margin: 20px 0;" />
            <p style="color: #adb5bd; font-size: 11px;">S Mohanty & Associates | Bhubaneswar</p>
          </div>
        `,
      });

      if (mailResult.error) {
        return { error: 'Failed to send verification email. Please try again.' };
      }

      return { requireOtp: true, email: userEmail };
    }

    // ── STEP 2: OTP provided → Verify and change password ──
    const ALLOWED_TEST_OTP = process.env.ALLOWED_TEST_OTP || '';

    if (!ALLOWED_TEST_OTP || otp !== ALLOWED_TEST_OTP) {
      const otpRecord = await prisma.otp.findFirst({
        where: { email: userEmail },
        orderBy: { createdAt: 'desc' },
      });

      if (!otpRecord) {
        return { error: 'No verification code found. Please request a new one.' };
      }

      if (otpRecord.expiresAt < new Date()) {
        await prisma.otp.deleteMany({ where: { email: userEmail } });
        return { error: 'Verification code has expired. Please request a new one.' };
      }

      if (otpRecord.code !== otp) {
        return { error: 'Invalid verification code. Please check and try again.' };
      }

      // OTP verified — clean up
      await prisma.otp.deleteMany({ where: { email: userEmail } });
    }

    // Hash and save the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    if (portal === 'CLIENT') {
      await prisma.client.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });
    } else {
      await prisma.employee.update({
        where: { id: session.user.id },
        data: { password: hashedPassword },
      });
    }

    logSecurityEvent({ event: 'PASSWORD_CHANGED', email: userEmail, metadata: { portal } });

    return { success: true };
  } catch (error) {
    console.error('Failed to change password:', error);
    return { error: 'An error occurred while changing your password. Please try again.' };
  }
}
