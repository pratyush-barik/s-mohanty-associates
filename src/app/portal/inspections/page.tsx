import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function FieldAgentDashboard({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  const currentUser = await prisma.employee.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!currentUser || !['FIELD_EMPLOYEE', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal/dashboard');
  }

  // Fetch projects assigned to this field employee, or all if Owner/Manager
  const whereClause = ['OWNER', 'MANAGER'].includes(currentUser.role) 
    ? {} 
    : {
        fieldEmployees: {
          some: { id: userId },
        },
      };

  const allInspections = await prisma.inspection.findMany({
    where: { project: whereClause },
    include: {
      project: {
        include: {
          serviceRequest: { select: { propertyAddress: true, propertyType: true, contactName: true } }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const tab = searchParams.tab || 'pending';

  const inspections = allInspections.filter((ins) => {
    const isCompleted = ins.completedFieldAgents.includes(userId);
    if (tab === 'pending') return !isCompleted;
    if (tab === 'completed') return isCompleted;
    return true; // 'all'
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            My Inspections
          </h1>
          <p className="text-sm text-[#6c757d] mt-1">
            Manage your assigned field inspections.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-md border border-[#e9ecef] shadow-sm">
          <Link
            href="/portal/inspections?tab=pending"
            className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-colors ${
              tab === 'pending' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
            }`}
          >
            Pending
          </Link>
          <Link
            href="/portal/inspections?tab=completed"
            className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-colors ${
              tab === 'completed' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
            }`}
          >
            Completed
          </Link>
          <Link
            href="/portal/inspections?tab=all"
            className={`px-4 py-1.5 rounded-sm text-sm font-medium transition-colors ${
              tab === 'all' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
            }`}
          >
            All
          </Link>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspections.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-[#6c757d] text-sm">
            No inspections assigned to you yet.
          </div>
        ) : (
          inspections.map((inspection) => {
            const isAgentCompleted = inspection.completedFieldAgents.includes(session.user.id);
            const agentStatusLabel = isAgentCompleted ? 'INSPECTION COMPLETED' : 'PENDING INSPECTION';
            const agentStatusColor = isAgentCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200';

            return (
            <div key={inspection.id} className="card p-6 flex flex-col h-full">
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${agentStatusColor}`}>
                    {agentStatusLabel}
                  </span>
                  <span className={`px-3 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                    inspection.project.status.includes('COMPLETED') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                    inspection.project.status.includes('IN_PROGRESS') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}>
                    {inspection.project.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-mono text-[#0f2038] font-bold text-lg">
                  {inspection.project.projectCode}
                </h3>
              </div>

              <div className="space-y-2 mb-6 flex-1">
                <p className="text-sm font-medium text-[#0f2038]">{inspection.project.serviceRequest.contactName}</p>
                <p className="text-xs text-[#6c757d]">{inspection.project.serviceRequest.propertyType}</p>
                <p className="text-xs text-[#6c757d] line-clamp-2">{inspection.project.serviceRequest.propertyAddress}</p>
              </div>

              <Link
                href={`/portal/inspections/${inspection.projectId}`}
                className="btn btn-primary text-sm py-2 w-full text-center"
              >
                View Details
              </Link>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
}
