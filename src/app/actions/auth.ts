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
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn('credentials', {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirect: false,
    });
    const session = await auth();
    if (session?.user?.role && session.user.role !== 'CLIENT') {
      redirect('/portal/dashboard');
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
