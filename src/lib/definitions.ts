import * as z from 'zod';

// Top 100 most common passwords — reject these outright
const COMMON_PASSWORDS = new Set([
  'password', '123456', '12345678', '1234', 'qwerty', '12345', 'dragon', 'pussy',
  'baseball', 'football', 'letmein', 'monkey', '696969', 'abc123', 'mustang',
  'michael', 'shadow', 'master', 'jennifer', '111111', '2000', 'jordan',
  'superman', 'harley', '1234567', 'fuckme', 'hunter', 'fuckyou', 'trustno1',
  'ranger', 'buster', 'thomas', 'tigger', 'robert', 'soccer', 'batman',
  'test', 'pass', 'killer', 'hockey', 'george', 'charlie', 'andrew',
  'michelle', 'love', 'sunshine', 'jessica', 'asshole', '6969', 'pepper',
  'daniel', 'access', '123456789', '654321', 'joshua', 'maggie', 'starwars',
  'silver', 'william', 'dallas', 'yankees', '123123', 'ashley', '666666',
  'hello', 'amanda', 'orange', 'biteme', 'freedom', 'computer', 'sexy',
  'thunder', 'nicole', 'ginger', 'heather', 'hammer', 'summer', 'corvette',
  'taylor', 'fucker', 'austin', '1111', 'merlin', 'matthew', '121212',
  'golfer', 'cheese', 'princess', 'martin', 'chelsea', 'patrick', 'richard',
  'diamond', 'yellow', 'bigdog', 'secret', 'asdfgh', 'sparky', 'cowboy',
  'password1', 'password123', 'qwerty123', 'iloveyou', 'welcome', 'admin',
  'passw0rd', 'p@ssword', 'changeme', 'default', 'guest', 'login',
]);

export const SignupFormSchema = z.object({
  clientType: z.enum(['INDIVIDUAL', 'ORGANISATION']).default('INDIVIDUAL'),
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  mobile: z
    .string()
    .min(10, { message: 'Please enter a valid mobile number.' })
    .max(15)
    .trim(),
  password: z
    .string()
    .min(12, { message: 'Password must be at least 12 characters long.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, { message: 'Password must contain at least one special character (!@#$%^&* etc.).' })
    .refine((val) => !COMMON_PASSWORDS.has(val.toLowerCase()), {
      message: 'This password is too common. Please choose a stronger password.',
    })
    .transform((val) => val.trim()),
  organisationName: z.string().optional(),
  otp: z.string().length(6, { message: 'OTP must be exactly 6 digits.' }),
});

export const LoginFormSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z.string().min(1, { message: 'Password is required.' }).trim(),
});

export const ServiceRequestSchema = z.object({
  propertyType: z.string().min(1, { message: 'Please select a property type.' }),
  purpose: z.string().min(1, { message: 'Please select the purpose of valuation.' }),
  propertyDetails: z
    .string()
    .min(10, { message: 'Please provide property details (at least 10 characters).' })
    .trim(),
  propertyAddress: z
    .string()
    .min(10, { message: 'Please provide the complete address.' })
    .trim(),
  contactName: z.string().min(2, { message: 'Please provide your name.' }).trim(),
  contactPhone: z.string().min(10, { message: 'Please provide a valid phone number.' }).trim(),
  contactEmail: z.string().email({ message: 'Please provide a valid email.' }).trim(),
  additionalNotes: z.string().optional(),
});

export const ProfileUpdateSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }).trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  mobile: z.string().min(10, { message: 'Please enter a valid mobile number.' }).max(15).trim(),
  organisationName: z.string().optional(),
  otp: z.string().optional(),
});

export type SignupFormState =
  | {
      errors?: {
        clientType?: string[];
        name?: string[];
        email?: string[];
        mobile?: string[];
        password?: string[];
        organisationName?: string[];
        otp?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;

export type LoginFormState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
      success?: boolean;
      require2FA?: boolean;
      email?: string;
    }
  | undefined;

export type ServiceRequestFormState =
  | {
      errors?: {
        propertyType?: string[];
        purpose?: string[];
        propertyDetails?: string[];
        propertyAddress?: string[];
        contactName?: string[];
        contactPhone?: string[];
        contactEmail?: string[];
      };
      message?: string;
      success?: boolean;
    }
  | undefined;
