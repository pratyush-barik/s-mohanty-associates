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

  const tab = searchParams.tab || 'all';
  const searchQ = searchParams.q || '';

  const inspections = allInspections.filter((ins) => {
    // Tab filter
    const finishedStatuses = ['INSPECTION_COMPLETED', 'REPORT_DRAFTING', 'MANAGER_REVIEW', 'COMPLETED', 'ARCHIVED'];
    const isCompleted = ins.completedFieldAgents.includes(userId) || ins.status === 'COMPLETED' || finishedStatuses.includes(ins.project.status);
    let passesTab = true;
    if (tab === 'pending') passesTab = !isCompleted;
    if (tab === 'completed') passesTab = isCompleted;

    // Search filter
    let passesSearch = true;
    if (searchQ) {
      passesSearch = ins.project.projectCode.toLowerCase().includes(searchQ.toLowerCase());
    }

    return passesTab && passesSearch;
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
        <div className="flex flex-col lg:flex-row items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
          {/* Search Form */}
          <form method="GET" action="/portal/inspections" className="relative w-full lg:w-64">
            <input type="hidden" name="tab" value={tab} />
            <input 
              type="text" 
              name="q" 
              defaultValue={searchQ}
              placeholder="Search Project Code..." 
              className="w-full pl-9 pr-4 py-1.5 bg-white border border-[#e9ecef] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/50 transition-shadow shadow-sm"
            />
            <svg className="w-4 h-4 text-[#6c757d] absolute left-3 top-[0.55rem]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-md border border-[#e9ecef] shadow-sm w-full lg:w-auto overflow-x-auto">
            <Link
              href={`/portal/inspections?tab=pending${searchQ ? `&q=${searchQ}` : ''}`}
              className={`px-4 py-1 rounded-sm text-[13px] font-medium transition-colors whitespace-nowrap ${
                tab === 'pending' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
              }`}
            >
              Pending
            </Link>
            <Link
              href={`/portal/inspections?tab=completed${searchQ ? `&q=${searchQ}` : ''}`}
              className={`px-4 py-1 rounded-sm text-[13px] font-medium transition-colors whitespace-nowrap ${
                tab === 'completed' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
              }`}
            >
              Completed
            </Link>
            <Link
              href={`/portal/inspections?tab=all${searchQ ? `&q=${searchQ}` : ''}`}
              className={`px-4 py-1 rounded-sm text-[13px] font-medium transition-colors whitespace-nowrap ${
                tab === 'all' ? 'bg-[#0f2038] text-white' : 'text-[#6c757d] hover:bg-gray-50'
              }`}
            >
              All
            </Link>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-4">
        {inspections.length === 0 ? (
          <div className="card p-12 text-center text-[#6c757d] text-sm">
            No inspections assigned to you yet.
          </div>
        ) : (
          inspections.map((inspection) => {
            const finishedStatuses = ['INSPECTION_COMPLETED', 'REPORT_DRAFTING', 'MANAGER_REVIEW', 'COMPLETED', 'ARCHIVED'];
            const isAgentCompleted = inspection.completedFieldAgents.includes(userId) || inspection.status === 'COMPLETED' || finishedStatuses.includes(inspection.project.status);
            const agentStatusLabel = isAgentCompleted ? 'INSPECTION COMPLETED' : 'PENDING INSPECTION';
            const agentStatusColor = isAgentCompleted ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200';

            return (
            <div key={inspection.id} className="card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${agentStatusColor}`}>
                    {agentStatusLabel}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
                    inspection.project.status.includes('COMPLETED') ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                    inspection.project.status.includes('IN_PROGRESS') ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    'bg-gray-50 text-gray-700 border border-gray-200'
                  }`}>
                    {inspection.project.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-mono text-[#0f2038] font-bold text-base mb-1">
                  {inspection.project.projectCode}
                </h3>
                <div className="flex items-center gap-2 text-xs text-[#6c757d]">
                  <span className="font-medium text-[#0f2038]">{inspection.project.serviceRequest.contactName}</span>
                  <span>•</span>
                  <span>{inspection.project.serviceRequest.propertyType}</span>
                </div>
              </div>

              <div className="flex-shrink-0 w-full md:w-auto mt-2 md:mt-0">
                <Link
                  href={`/portal/inspections/${inspection.projectId}`}
                  className="btn btn-primary text-sm py-2 px-6 w-full md:w-auto text-center"
                >
                  View Details
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
