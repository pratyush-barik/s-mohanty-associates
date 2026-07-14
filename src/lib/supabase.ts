import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Supabase client with service role key for server-side operations.
 * Used for file uploads (employee photos, PDFs, documents).
 * DO NOT expose this client to the browser — service role bypasses RLS.
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Storage bucket names — centralized so they are easy to change.
 */
export const STORAGE_BUCKETS = {
  EMPLOYEE_PROFILES: 'employee-profiles',
  VALUATION_DOCUMENTS: 'valuation-documents',
} as const;

/**
 * Get the public URL for a file in a Supabase storage bucket.
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
