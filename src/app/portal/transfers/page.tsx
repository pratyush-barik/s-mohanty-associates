import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import PendingTransfersList from '../manager/PendingTransfersList';

export default async function IncomingTransfersPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/employee-login');

  const userRole = (session.user as any).role;
  if (userRole !== 'OWNER' && userRole !== 'MANAGER') {
    redirect('/portal');
  }

  const pendingTransfers = await prisma.project.findMany({
    where: {
      pendingManagerId: session.user.id,
    },
    select: {
      id: true,
      projectCode: true,
      serviceRequest: {
        select: {
          propertyType: true,
          contactName: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          Incoming Project Transfers
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Review and accept project transfer requests initiated by other managers.
        </p>
      </div>

      {pendingTransfers.length > 0 ? (
        <div className="space-y-4">
          <PendingTransfersList transfers={pendingTransfers} />
        </div>
      ) : (
        <div className="card p-8 text-center text-[#6c757d]">
          <span className="text-3xl block mb-2">🔄</span>
          <p className="text-sm font-semibold">No pending project transfers</p>
          <p className="text-xs mt-1">When another manager transfers a project to you, it will appear here for your acceptance.</p>
        </div>
      )}
    </div>
  );
}
