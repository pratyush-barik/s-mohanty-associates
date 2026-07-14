import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  FIELD_EMPLOYEE: 'Field Inspector',
  REPORT_EMPLOYEE: 'Report Analyst',
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

export default async function PortalDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userRole = (session.user as any).role;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      employeeId: true,
      designation: true,
      profilePhoto: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) return null;

  // Fetch role-specific data
  let pendingRequests: any[] = [];
  let assignedProjects: any[] = [];
  let stats = { total: 0, active: 0, completed: 0 };

  if (userRole === 'OWNER' || userRole === 'MANAGER') {
    pendingRequests = await prisma.serviceRequest.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      include: { client: { select: { name: true, email: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const managerProjects = await prisma.project.findMany({
      where: userRole === 'OWNER' ? {} : { assignedManagerId: session.user.id },
      include: { serviceRequest: { select: { propertyType: true, contactName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    assignedProjects = managerProjects.slice(0, 5);
    stats.total = managerProjects.length;
    stats.active = managerProjects.filter((p) => !['COMPLETED', 'ARCHIVED'].includes(p.status)).length;
    stats.completed = managerProjects.filter((p) => p.status === 'COMPLETED').length;
  }

  if (userRole === 'FIELD_EMPLOYEE') {
    const fieldProjects = await prisma.project.findMany({
      where: { fieldEmployeeId: session.user.id },
      include: { serviceRequest: { select: { propertyType: true, propertyAddress: true, contactName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    assignedProjects = fieldProjects.slice(0, 5);
    stats.total = fieldProjects.length;
    stats.active = fieldProjects.filter((p) => ['ASSIGNED', 'INSPECTION_IN_PROGRESS'].includes(p.status)).length;
    stats.completed = fieldProjects.filter((p) => !['ASSIGNED', 'INSPECTION_IN_PROGRESS'].includes(p.status)).length;
  }

  if (userRole === 'REPORT_EMPLOYEE') {
    const reportProjects = await prisma.project.findMany({
      where: { reportEmployeeId: session.user.id },
      include: { serviceRequest: { select: { propertyType: true, contactName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    assignedProjects = reportProjects.slice(0, 5);
    stats.total = reportProjects.length;
    stats.active = reportProjects.filter((p) => ['REPORT_DRAFTING', 'MANAGER_REVIEW'].includes(p.status)).length;
    stats.completed = reportProjects.filter((p) => p.status === 'COMPLETED').length;
  }

  return (
    <div className="space-y-8">
      {/* Profile Card */}
      <div className="card p-6">
        <div className="flex items-center gap-6">
          {/* Photo */}
          <div className="w-20 h-20 rounded-2xl flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] flex items-center justify-center">
            {user.profilePhoto ? (
              <img src={user.profilePhoto} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-3xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
            )}
          </div>
          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
              {user.name}
            </h1>
            <div className="flex items-center gap-4 mt-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#b8860b]/10 text-[#b8860b] text-xs font-semibold">
                {roleLabels[user.role] || user.role}
              </span>
              {user.employeeId && (
                <span className="text-sm text-[#6c757d] font-mono">{user.employeeId}</span>
              )}
              {user.designation && (
                <span className="text-sm text-[#6c757d]">• {user.designation}</span>
              )}
            </div>
            <p className="text-xs text-[#adb5bd] mt-1.5">{user.email}</p>
          </div>
          {/* Edit Profile Link */}
          <Link href="/portal/profile" className="text-sm text-[#b8860b] hover:underline font-medium">
            Edit Profile →
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Total Assigned</p>
          <p className="text-3xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.total}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Active</p>
          <p className="text-3xl font-bold text-[#b8860b]" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.active}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Completed</p>
          <p className="text-3xl font-bold text-green-600" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.completed}
          </p>
        </div>
      </div>

      {/* Pending Requests (Managers/Owner only) */}
      {(userRole === 'OWNER' || userRole === 'MANAGER') && pendingRequests.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
              Pending Service Requests
            </h2>
            <Link href="/portal/requests" className="text-sm text-[#b8860b] hover:underline font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-4 rounded-xl bg-[#f8f9fa] border border-[#e9ecef]">
                <div>
                  <p className="text-sm font-medium text-[#0f2038]">{req.propertyType} — {req.purpose}</p>
                  <p className="text-xs text-[#6c757d] mt-0.5">
                    From: {req.client.name} • {new Date(req.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[req.status]}`}>
                  {formatStatus(req.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assigned Projects */}
      {assignedProjects.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
              {userRole === 'FIELD_EMPLOYEE' ? 'My Inspections' :
               userRole === 'REPORT_EMPLOYEE' ? 'My Reports' : 'Assigned Projects'}
            </h2>
            <Link href={
              userRole === 'FIELD_EMPLOYEE' ? '/portal/inspections' :
              userRole === 'REPORT_EMPLOYEE' ? '/portal/reports' : '/portal/projects'
            } className="text-sm text-[#b8860b] hover:underline font-medium">
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {assignedProjects.map((project) => (
              <div key={project.id} className="flex items-center justify-between p-4 rounded-xl bg-[#f8f9fa] border border-[#e9ecef] hover:border-[#b8860b]/30 transition-colors">
                <div>
                  <p className="text-sm font-bold text-[#0f2038]">{project.projectCode}</p>
                  <p className="text-xs text-[#6c757d] mt-0.5">
                    {project.serviceRequest.propertyType} • {project.serviceRequest.contactName}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[project.status]}`}>
                  {formatStatus(project.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {assignedProjects.length === 0 && pendingRequests.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">✨</div>
          <h2 className="text-lg font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            All Clear!
          </h2>
          <p className="text-sm text-[#6c757d]">No pending items at the moment. Check back later.</p>
        </div>
      )}
    </div>
  );
}
