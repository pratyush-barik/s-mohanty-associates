import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
  PENDING_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
  ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
  INSPECTION_IN_PROGRESS: 'bg-orange-50 text-orange-700 border-orange-200',
  INSPECTION_COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',
  REPORT_DRAFTING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MANAGER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  ARCHIVED: 'bg-gray-50 text-gray-700 border-gray-200',
};

function formatStatus(status: string) {
  if (status === 'SUBMITTED' || status === 'PENDING_REVIEW') return 'Requested';
  if (status === 'ASSIGNED') return 'Manager Assigned';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const projects = await prisma.project.findMany({
    where: { serviceRequest: { clientId: session.user.id } },
    include: {
      serviceRequest: true,
      manager: { select: { name: true, email: true, profilePhoto: true } },
      fieldEmployees: { select: { name: true, email: true, profilePhoto: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const activeProjects = projects.filter((p: any) => p.status !== 'ARCHIVED' && p.status !== 'COMPLETED');
  const requestCount = await prisma.serviceRequest.count({ where: { clientId: session.user.id } });

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            Welcome, {session.user.name}
          </h1>
          <p className="text-sm text-[#6c757d] mt-1">
            Manage your property valuation requests and track active projects.
          </p>
        </div>
        <Link href="/dashboard/request" className="btn btn-primary text-sm px-6 py-2.5">
          Request a Service
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Total Requests</p>
          <p className="text-3xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            {requestCount}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Active Projects</p>
          <p className="text-3xl font-bold text-[#b8860b]" style={{ fontFamily: 'var(--font-heading)' }}>
            {activeProjects.length}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600" style={{ fontFamily: 'var(--font-heading)' }}>
            {projects.filter((p: any) => p.status === 'COMPLETED').length}
          </p>
        </div>
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
              Active Projects
            </h2>
            <Link href="/dashboard/projects" className="text-sm text-[#b8860b] hover:underline font-medium">
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {activeProjects.map((project: any) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.projectCode}`}
                className="block p-4 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] hover:border-[#b8860b]/30 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-[#0f2038]">{project.projectCode}</p>
                    <p className="text-xs text-[#6c757d] mt-0.5">
                      {project.serviceRequest.propertyType} — {project.serviceRequest.purpose}
                    </p>
                    {project.manager && (
                      <p className="text-xs text-[#b8860b] mt-1">Manager: {project.manager.name}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status]}`}>
                    {formatStatus(project.status)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
