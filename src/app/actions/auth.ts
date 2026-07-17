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
    name: formData.get('name'),
    email: formData.get('email'),
    mobile: formData.get('mobile'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, mobile, password } = validatedFields.data;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      message: 'An account with this email already exists. Please log in.',
    };
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      mobile,
      password: hashedPassword,
      role: 'CLIENT',
    },
  });

  if (!user) {
    return {
      message: 'An error occurred while creating your account. Please try again.',
    };
  }

  return { success: true, message: 'Account created successfully! Please log in.' };
}

export async function login(state: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const portal = formData.get('portal');
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Strict Segregation Check BEFORE signIn
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedFields.data.email },
  });

  if (!existingUser) {
    if (portal === 'CLIENT') {
      return { message: 'Client does not exist. Please register.' };
    }
    return { message: 'Invalid email or password.' };
  }

  const passwordMatch = await bcrypt.compare(validatedFields.data.password, existingUser.password);
  
  if (!passwordMatch) {
    return { message: 'Incorrect password.' };
  }

  if (portal === 'CLIENT' && existingUser.role !== 'CLIENT') {
    return { message: 'Client does not exist. Please register.' };
  }
  
  if (portal === 'EMPLOYEE' && existingUser.role === 'CLIENT') {
    return { message: 'Employee account does not exist.' };
  }

  try {
    await signIn('credentials', {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
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
