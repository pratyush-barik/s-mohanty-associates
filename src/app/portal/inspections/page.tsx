import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function FieldAgentDashboard() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['FIELD_EMPLOYEE', 'OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal/dashboard');
  }

  // Fetch projects assigned to this field employee, or all if Owner/Manager
  const whereClause = ['OWNER', 'MANAGER'].includes(currentUser.role) 
    ? {} 
    : { fieldEmployeeId: session.user.id };

  const inspections = await prisma.inspection.findMany({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          My Inspections
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Manage your assigned field inspections.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {inspections.length === 0 ? (
          <div className="col-span-full card p-12 text-center text-[#6c757d] text-sm">
            No inspections assigned to you yet.
          </div>
        ) : (
          inspections.map((inspection) => (
            <div key={inspection.id} className="card p-6 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    inspection.status === 'COMPLETED' ? 'bg-green-50 text-green-700' : 
                    inspection.status === 'IN_PROGRESS' ? 'bg-orange-50 text-orange-700' :
                    'bg-blue-50 text-blue-700'
                  }`}>
                    {inspection.status.replace('_', ' ')}
                  </span>
                  <h3 className="font-mono text-[#0f2038] font-bold mt-2">
                    {inspection.project.projectCode}
                  </h3>
                </div>
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
          ))
        )}
      </div>
    </div>
  );
}
