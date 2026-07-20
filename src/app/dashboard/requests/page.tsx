import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  APPROVED: 'bg-green-50 text-green-700 border-green-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

function formatStatus(status: string) {
  if (status === 'SUBMITTED') return 'Requested';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}

export default async function RequestsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const requests = await prisma.serviceRequest.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: { id: true, projectCode: true, status: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            My Service Requests
          </h1>
          <p className="text-sm text-[#6c757d] mt-1">Track all your valuation service requests.</p>
        </div>
        <Link href="/dashboard/request" className="btn btn-primary text-sm px-6 py-2.5">
          New Request
        </Link>
      </div>

      {requests.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">📋</div>
          <h2 className="text-lg font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
            No Requests Yet
          </h2>
          <p className="text-sm text-[#6c757d] mb-6">Submit your first property valuation request to get started.</p>
          <Link href="/dashboard/request" className="btn btn-primary text-sm px-6 py-2.5">
            Submit Request
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <div key={req.id} className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-base font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
                      {req.propertyType}
                    </h3>
                    <span className={`px-3 py-0.5 rounded-full text-xs font-medium border ${statusColors[req.status]}`}>
                      {formatStatus(req.status)}
                    </span>
                  </div>
                  <p className="text-sm text-[#6c757d] mb-1">
                    <span className="font-medium text-[#495057]">Purpose:</span> {req.purpose}
                  </p>
                  <p className="text-sm text-[#6c757d] mb-1">
                    <span className="font-medium text-[#495057]">Address:</span> {req.propertyAddress}
                  </p>
                  <p className="text-xs text-[#adb5bd] mt-2">
                    Submitted on {new Date(req.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {req.project && (
                    <Link
                      href={`/dashboard/projects/${req.project.id}`}
                      className="btn btn-primary text-xs px-4 py-2"
                    >
                      View Project → {req.project.projectCode}
                    </Link>
                  )}
                  {req.reviewNotes && (
                    <div className="max-w-xs p-3 rounded-lg bg-[#f8f9fa] border border-[#e9ecef]">
                      <p className="text-xs text-[#6c757d]">
                        <span className="font-medium text-[#495057]">Review Notes:</span> {req.reviewNotes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
