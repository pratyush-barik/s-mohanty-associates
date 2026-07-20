import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  PENDING_REVIEW: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  ASSIGNED: 'bg-purple-50 text-purple-700 border-purple-200',
  INSPECTION_IN_PROGRESS: 'bg-orange-50 text-orange-700 border-orange-200',
  INSPECTION_COMPLETED: 'bg-teal-50 text-teal-700 border-teal-200',
  REPORT_DRAFTING: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  MANAGER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  COMPLETED: 'bg-green-50 text-green-700 border-green-200',
  ARCHIVED: 'bg-gray-50 text-gray-700 border-gray-200',
};

const statusSteps = [
  'PENDING_REVIEW', 'APPROVED', 'ASSIGNED', 'INSPECTION_IN_PROGRESS',
  'INSPECTION_COMPLETED', 'REPORT_DRAFTING', 'MANAGER_REVIEW', 'COMPLETED',
];

function formatStatus(status: string) {
  if (status === 'ASSIGNED') return 'Manager Assigned';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

function getProgress(status: string): number {
  const idx = statusSteps.indexOf(status);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / statusSteps.length) * 100);
}

export default async function ProjectsPage() {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          My Projects
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">Track the progress of your valuation projects.</p>
      </div>

      {projects.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📁</div>
          <h2 className="text-lg font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            No Active Projects
          </h2>
          <p className="text-sm text-[#6c757d] mb-6">
            Once your service request is approved, it will appear here as a project.
          </p>
          <Link href="/dashboard/request" className="btn btn-primary text-sm px-6 py-2.5">
            Submit a Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="card p-6 block hover:shadow-xl transition-all group"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-[#0f2038] group-hover:text-[#b8860b] transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
                      {project.projectCode}
                    </h3>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-medium border ${statusColors[project.status]}`}>
                      {formatStatus(project.status)}
                    </span>
                  </div>
                  <p className="text-sm text-[#6c757d]">
                    {project.serviceRequest.propertyType} — {project.serviceRequest.purpose}
                  </p>

                  {/* Progress Bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-[#e9ecef] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#b8860b] to-[#c9952c] rounded-full transition-all duration-500"
                        style={{ width: `${getProgress(project.status)}%` }}
                      />
                    </div>
                    <span className="text-xs text-[#6c757d] font-medium">{getProgress(project.status)}%</span>
                  </div>
                </div>

                {/* Assigned Team */}
                <div className="flex items-center gap-4">
                  {project.manager && (
                    <div className="text-right">
                      <p className="text-xs text-[#adb5bd]">Manager</p>
                      <p className="text-sm font-medium text-[#0f2038]">{project.manager.name}</p>
                    </div>
                  )}
                  {project.fieldEmployees && project.fieldEmployees.length > 0 && (
                    <div className="text-right">
                      <p className="text-xs text-[#adb5bd]">Field Agent</p>
                      <p className="text-sm font-medium text-[#0f2038]">{project.fieldEmployees.map(e => e.name).join(', ')}</p>
                    </div>
                  )}
                  <svg className="w-5 h-5 text-[#adb5bd] group-hover:text-[#b8860b] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
