import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client for browser-side operations.
 * Safe to use in 'use client' components.
 */
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

export const STORAGE_BUCKETS = {
  EMPLOYEE_PROFILES: 'employee-profiles',
  VALUATION_DOCUMENTS: 'valuation-documents',
} as const;
