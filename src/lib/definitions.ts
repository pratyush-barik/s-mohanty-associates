import * as z from 'zod';

export const SignupFormSchema = z.object({
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
    .min(8, { message: 'Password must be at least 8 characters long.' })
    .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .trim(),
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

export type SignupFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        mobile?: string[];
        password?: string[];
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
