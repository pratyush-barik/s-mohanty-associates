import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ReportAgentDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.user.findUnique({
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
          My Assigned Reports
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Draft and submit valuation reports for verification.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-[#6c757d] text-sm">
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
              <div key={project.id} className="card p-6 flex flex-col h-full">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${statusColor}`}>
                      {statusLabel}
                    </span>
                    <h3 className="font-mono text-[#0f2038] font-bold mt-2">
                      {project.projectCode}
                    </h3>
                  </div>
                </div>

                <div className="space-y-2 mb-6 flex-1">
                  <p className="text-sm font-medium text-[#0f2038]">{project.serviceRequest.contactName}</p>
                  <p className="text-xs text-[#6c757d]">{project.serviceRequest.propertyType}</p>
                  <p className="text-xs text-[#6c757d] line-clamp-2">{project.serviceRequest.propertyAddress}</p>
                </div>

                <Link
                  href={`/portal/reports/${project.id}`}
                  className="btn btn-primary text-sm py-2 w-full text-center"
                >
                  {project.status === 'MANAGER_REVIEW' ? 'View Report' : 'Draft Report'}
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
