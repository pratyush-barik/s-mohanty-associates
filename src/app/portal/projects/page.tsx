import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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

  // Fetch all projects (we could paginate this later)
  const projects = await prisma.project.findMany({
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
          All Projects
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Manage all active and completed valuation projects.
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
                <th className="px-6 py-3 font-medium text-[#6c757d]">Status</th>
                <th className="px-6 py-3 font-medium text-[#6c757d]">Field Agent</th>
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
                    <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-semibold">
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#6c757d]">
                    {project.fieldEmployees.map(e => e.name).join(', ') || 'Unassigned'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/portal/projects/${project.id}`}
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
