import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import CreateEmployeeForm from './CreateEmployeeForm';

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  FIELD_EMPLOYEE: 'Field Inspector',
  REPORT_EMPLOYEE: 'Report Analyst',
};

export default async function ManageEmployeesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (currentUser?.role !== 'OWNER') redirect('/portal/dashboard');

  const employees = await prisma.employee.findMany({
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
        <p className="text-sm text-[#6c757d] mt-1">Create and manage employee accounts.</p>
      </div>

      {/* Create Employee Form */}
      <CreateEmployeeForm />

      {/* Employee List */}
      <div className="card p-6">
        <h2 className="text-lg font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
          All Employees ({employees.length})
        </h2>

        {employees.length === 0 ? (
          <p className="text-sm text-[#adb5bd] text-center py-8">No employees added yet.</p>
        ) : (
          <div className="space-y-3">
            {employees.map((emp) => (
              <div key={emp.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#e9ecef]">
                {/* Photo */}
                <div className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] flex items-center justify-center">
                  {emp.profilePhoto ? (
                    <img src={emp.profilePhoto} alt={emp.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-bold">{emp.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#0f2038]">{emp.name}</p>
                    {emp.employeeId && (
                      <span className="text-xs font-mono text-[#b8860b] bg-[#b8860b]/10 px-2 py-0.5 rounded">
                        {emp.employeeId}
                      </span>
                    )}
                    {!emp.isActive && (
                      <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6c757d] mt-0.5">
                    {emp.email} {emp.mobile && `• ${emp.mobile}`}
                  </p>
                </div>
                {/* Role Badge */}
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#b8860b]/10 text-[#b8860b] border border-[#b8860b]/20">
                  {roleLabels[emp.role] || emp.role}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
