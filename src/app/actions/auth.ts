'use server';

import { signIn, auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { SignupFormSchema, LoginFormSchema, type SignupFormState, type LoginFormState } from '@/lib/definitions';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

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

  // 1. Verify email validation code
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
  const hashedPassword = await bcrypt.hash(password, 10);

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
      to: email,
      subject: 'Verify Your Email - S Mohanty Associates',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f3f5; border-radius: 8px;">
          <h2 style="color: #0f2038;">S Mohanty Associates</h2>
          <p>Thank you for starting your registration. Please use the following One-Time Password (OTP) to verify your email address. This code is valid for 5 minutes.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #b8860b; border: 1px solid #e9ecef; margin: 20px 0;">
            ${code}
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

  // Strict Segregation & Password Verification BEFORE signIn
  if (portal === 'CLIENT') {
    const existingClient = await prisma.client.findUnique({
      where: { email },
    });

    if (!existingClient) {
      return { message: 'Client does not exist. Please register.' };
    }

    const passwordMatch = await bcrypt.compare(password, existingClient.password);
    if (!passwordMatch) {
      return { message: 'Incorrect password.' };
    }
  } else {
    const existingEmployee = await prisma.employee.findUnique({
      where: { email },
    });

    if (!existingEmployee) {
      return { message: 'Employee account does not exist.' };
    }

    if (!existingEmployee.isActive) {
      return { message: 'This employee account is inactive.' };
    }

    const passwordMatch = await bcrypt.compare(password, existingEmployee.password);
    if (!passwordMatch) {
      return { message: 'Incorrect password.' };
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
          return { message: 'Invalid email or password.' };
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

  const name = formData.get('name') as string;
  const mobile = formData.get('mobile') as string;
  const email = formData.get('email') as string;
  const organisationName = formData.get('organisationName') as string;
  const otp = formData.get('otp') as string;

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
        to: connectedEmail,
        subject: 'Confirm Profile Changes - S Mohanty Associates',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f3f5; border-radius: 8px;">
            <h2 style="color: #0f2038;">S Mohanty Associates</h2>
            <p>You have requested to update your profile details. Please enter the following One-Time Password (OTP) to confirm and apply these changes. This code is valid for 5 minutes.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #b8860b; border: 1px solid #e9ecef; margin: 20px 0;">
              ${code}
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

    // 3. OTP is provided. Verify it against database
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
      to: email,
      subject: 'Your S Mohanty Associates Login OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #f1f3f5; border-radius: 8px;">
          <h2 style="color: #0f2038;">S Mohanty Associates</h2>
          <p>Please use the following One-Time Password (OTP) to log in to your account. This code is valid for 5 minutes.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; text-align: center; color: #b8860b; border: 1px solid #e9ecef; margin: 20px 0;">
            ${code}
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
