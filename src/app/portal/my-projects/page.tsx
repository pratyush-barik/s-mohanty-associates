import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ReportAgentDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['REPORT_EMPLOYEE', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal/dashboard');
  }

  // Fetch projects assigned to this report employee, or all if Owner/Manager
  const whereClause = ['OWNER', 'MANAGER'].includes(currentUser.role) 
    ? {} 
    : { reportEmployeeId: session.user.id };

  const projects = await prisma.project.findMany({
    where: {
      ...whereClause,
      status: { notIn: ['COMPLETED', 'ARCHIVED'] }
    },
    include: {
      serviceRequest: { select: { propertyAddress: true, propertyType: true, contactName: true } },
      inspection: true,
      report: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          My Projects
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Draft and submit valuation reports for verification.
        </p>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="card p-12 text-center text-[#6c757d] text-sm">
            No active projects assigned to you for reporting.
          </div>
        ) : (
          projects.map((project) => {
            // Determine report status visually
            let statusLabel = 'DRAFTING';
            let statusColor = 'bg-blue-50 text-blue-700';
            
            if (project.status === 'MANAGER_REVIEW') {
              statusLabel = 'IN VERIFICATION';
              statusColor = 'bg-orange-50 text-orange-700';
            } else if (project.report?.status === 'REVISION_REQUESTED') {
              statusLabel = 'REVISION NEEDED';
              statusColor = 'bg-red-50 text-red-700';
            }

            return (
              <div key={project.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#e9ecef] hover:border-[#b8860b] transition-all hover:shadow-md">
                <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-4">
                  {/* Status & Code */}
                  <div className="w-40 shrink-0">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${statusColor}`}>
                      {statusLabel}
                    </span>
                    <h3 className="font-mono text-[#0f2038] font-bold mt-2 text-base">
                      {project.projectCode}
                    </h3>
                  </div>
                  {/* Property Details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-[#0f2038] truncate">{project.serviceRequest.contactName}</h4>
                    <p className="text-xs font-semibold text-[#b8860b] mt-0.5">{project.serviceRequest.propertyType}</p>
                    <p className="text-xs text-[#6c757d] truncate mt-1">{project.serviceRequest.propertyAddress}</p>
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0 w-full md:w-auto">
                  <Link
                    href={`/portal/reports/${project.id}`}
                    className="btn btn-primary text-sm py-2.5 px-6 block w-full text-center md:inline-block font-semibold"
                  >
                    {project.status === 'MANAGER_REVIEW' ? 'View Report' : 'Draft Report'}
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
