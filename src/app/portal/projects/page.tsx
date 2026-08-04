import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

function formatStatus(status: string, clientReworkRequested?: boolean) {
  if (clientReworkRequested) return 'CLIENT REWORK REQUESTED';
  if (status === 'ASSIGNED') return 'MANAGER ASSIGNED';
  return status.replace(/_/g, ' ');
}

function formatSource(source: string) {
  if (source === 'GMAIL') return 'Gmail';
  if (source === 'EXTERNAL') return 'External';
  return 'Website';
}

function sourceColor(source: string) {
  if (source === 'GMAIL') return 'bg-blue-100 text-blue-700 border-blue-200';
  if (source === 'EXTERNAL') return 'bg-amber-100 text-amber-700 border-amber-200';
  return 'bg-purple-100 text-purple-700 border-purple-200';
}

export default async function PortalProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal');
  }

  const whereClause = currentUser.role === 'MANAGER'
    ? { assignedManagerId: session.user.id }
    : {};

  const projects = await prisma.project.findMany({
    where: whereClause,
    include: {
      serviceRequest: { select: { propertyType: true, contactName: true } },
      fieldEmployees: { select: { name: true } },
      reportEmployee: { select: { name: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          {currentUser.role === 'MANAGER' ? 'My Projects' : 'All Projects'}
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          {currentUser.role === 'MANAGER'
            ? 'Projects assigned to you for oversight.'
            : 'Manage all active and completed valuation projects.'}
        </p>
      </div>

      <div className="card overflow-hidden">
        {projects.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-[#6c757d] text-sm">No projects found.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#f8f9fa] border-b border-[#e9ecef]">
              <tr>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Project Code</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Client</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Source</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Status</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Field Agent</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Report Agent</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e9ecef]">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-[#f8f9fa] transition-colors">
                  <td className="px-6 py-4 font-mono font-medium text-[#0f2038]">
                    {project.projectCode}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-[#0f2038]">{project.serviceRequest.contactName}</p>
                    <p className="text-xs text-[#6c757d]">{project.serviceRequest.propertyType}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${sourceColor(project.source)}`}>
                      {formatSource(project.source)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${project.clientReworkRequested ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      {formatStatus(project.status, project.clientReworkRequested)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#6c757d]">
                    {project.fieldEmployees.map(e => e.name).join(', ') || <span className="italic text-gray-400">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4 text-[#6c757d]">
                    {project.reportEmployee?.name || <span className="italic text-gray-400">Unassigned</span>}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/portal/projects/${project.projectCode}`}
                      className="text-[#b8860b] hover:underline font-medium text-xs"
                    >
                      Manage
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
