import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const roleLabels: Record<string, string> = {
  OWNER: 'Owner', MANAGER: 'Manager', FIELD_EMPLOYEE: 'Field Inspector', REPORT_EMPLOYEE: 'Report Analyst',
};

const statusColors: Record<string, string> = {
  PENDING_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
  INSPECTION_IN_PROGRESS: 'bg-orange-50 text-orange-700 border-orange-200',
  INSPECTION_COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',
  REPORT_DRAFTING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MANAGER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

function formatStatus(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default async function FieldAgentDashboard() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== 'FIELD_EMPLOYEE') return null;

  const user = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true, employeeId: true, designation: true, profilePhoto: true, role: true },
  });

  if (!user) return null;

  const fieldProjects = await prisma.project.findMany({
    where: {
      fieldEmployees: {
        some: { id: session.user.id },
      },
    },
    include: { 
      serviceRequest: { select: { propertyType: true, contactName: true } },
      inspection: { select: { completedFieldAgents: true } }
    },
    orderBy: { createdAt: 'desc' },
  });
  
  const assignedProjects = fieldProjects.slice(0, 5);
  const stats = {
    total: fieldProjects.length,
    active: fieldProjects.filter((p) => ['ASSIGNED', 'INSPECTION_IN_PROGRESS'].includes(p.status)).length,
    completed: fieldProjects.filter((p) => !['ASSIGNED', 'INSPECTION_IN_PROGRESS'].includes(p.status)).length,
  };

  return (
    <div className="space-y-8">
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] flex items-center justify-center">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>{user.name}</h1>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#b8860b]/10 text-[#b8860b] text-xs font-semibold">
                {roleLabels[user.role] || user.role}
              </span>
              {user.employeeId && <span className="text-sm text-[#6c757d] font-mono">{user.employeeId}</span>}
              {user.designation && <span className="text-sm text-[#6c757d]">• {user.designation}</span>}
            </div>
            <p className="text-xs text-[#adb5bd] mt-1.5">{user.email}</p>
          </div>
          <Link href="/portal/profile" className="text-sm text-[#b8860b] hover:underline font-medium">Edit Profile →</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Total Assigned</p>
          <p className="text-3xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>{stats.total}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Pending Inspections</p>
          <p className="text-3xl font-bold text-[#b8860b]" style={{ fontFamily: 'var(--font-heading)' }}>{stats.active}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600" style={{ fontFamily: 'var(--font-heading)' }}>{stats.completed}</p>
        </div>
      </div>

      {assignedProjects.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>My Inspections</h2>
            <Link href="/portal/inspections" className="text-sm text-[#b8860b] hover:underline font-medium">View All →</Link>
          </div>
          <div className="space-y-3">
            {assignedProjects.map((project) => {
              const isAgentCompleted = project.inspection?.completedFieldAgents?.includes(session.user.id) || project.inspection?.status === 'COMPLETED';
              const agentStatusLabel = isAgentCompleted ? 'INSPECTION COMPLETED' : 'PENDING INSPECTION';
              const agentStatusColor = isAgentCompleted ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200';
              
              return (
              <div key={project.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] hover:border-[#b8860b]/30 transition-colors">
                <div>
                  <p className="text-sm font-bold text-[#0f2038]">{project.projectCode}</p>
                  <p className="text-xs text-[#6c757d] mt-0.5">{project.serviceRequest.propertyType} • {project.serviceRequest.contactName}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border ${agentStatusColor}`}>
                    {agentStatusLabel}
                  </span>
                  <span className={`px-3 py-1 rounded-none text-[10px] font-bold uppercase tracking-wider border ${statusColors[project.status] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                    {formatStatus(project.status)}
                  </span>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {assignedProjects.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-lg font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>All Clear!</h2>
          <p className="text-sm text-[#6c757d]">You have no assigned inspections right now.</p>
        </div>
      )}
    </div>
  );
}
