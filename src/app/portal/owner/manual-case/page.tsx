import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import ManualCaseForm from './ManualCaseForm';

export default async function ManualCasePage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal/dashboard');
  }

  // Fetch managers for assignment
  const managers = await prisma.employee.findMany({
    where: { role: 'MANAGER', isActive: true },
    select: { id: true, name: true, employeeId: true },
    orderBy: { name: 'asc' },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          Create Manual Case
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Directly create a new Service Request and Project for email-only clients without requiring a client account.
        </p>
      </div>

      <div className="card p-6">
        <ManualCaseForm managers={managers} />
      </div>
    </div>
  );
}
