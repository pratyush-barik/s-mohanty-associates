import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function PortalIndexPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/employee-login');

  const role = (session.user as any).role;
  if (role === 'OWNER') redirect('/portal/owner');
  if (role === 'MANAGER') redirect('/portal/manager');
  if (role === 'FIELD_EMPLOYEE') redirect('/portal/field-agent');
  if (role === 'REPORT_EMPLOYEE') redirect('/portal/report-agent');

  // Fallback for CLIENT or unknown
  redirect('/dashboard');
}
