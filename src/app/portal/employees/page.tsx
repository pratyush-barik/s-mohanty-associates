import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CreateEmployeeForm from './CreateEmployeeForm';
import EmployeeDashboard from './EmployeeDashboard';

export default async function ManageEmployeesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'OWNER' && currentUser?.role !== 'MANAGER') {
    redirect('/portal');
  }

  // Managers can only see/manage FIELD_EMPLOYEE and REPORT_EMPLOYEE roles
  const where = currentUser.role === 'MANAGER'
    ? { role: { in: ['FIELD_EMPLOYEE', 'REPORT_EMPLOYEE'] as any } }
    : undefined;

  const employees = await prisma.employee.findMany({
    where,
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      employeeId: true,
      designation: true,
      role: true,
      profilePhoto: true,
      isActive: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          Manage Employees
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          {currentUser.role === 'OWNER'
            ? 'Create and manage all employee accounts.'
            : 'Create and manage Field Inspectors and Report Analysts.'
          }
        </p>
      </div>

      {/* Create Employee Form */}
      <CreateEmployeeForm currentUserRole={currentUser.role} />

      {/* Employee Dashboard (with search, update, termination) */}
      <EmployeeDashboard employees={employees as any} currentUserRole={currentUser.role} />
    </div>
  );
}
