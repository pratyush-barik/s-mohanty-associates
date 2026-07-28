import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import EnquiryList from './EnquiryList';

export default async function EnquiriesPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal');
  }

  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      project: {
        select: {
          projectCode: true,
          status: true,
        },
      },
    },
  });

  const stats = {
    total: enquiries.length,
    new: enquiries.filter((e) => e.status === 'NEW').length,
    waiting: enquiries.filter((e) => e.status === 'WAITING_FOR_CLIENT').length,
    inProgress: enquiries.filter((e) => e.status === 'IN_PROGRESS').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          Public Enquiries
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Enquiries submitted by visitors through the Contact Us form or via email.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Total Cases</p>
          <p className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.total}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">New</p>
          <p className="text-2xl font-bold text-red-500" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.new}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Waiting on Client</p>
          <p className="text-2xl font-bold text-orange-500" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.waiting}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-600" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.inProgress}
          </p>
        </div>
      </div>

      <EnquiryList
        enquiries={enquiries.map((e) => ({
          id: e.id,
          ticketNumber: e.ticketNumber,
          source: e.source,
          name: e.name,
          email: e.email,
          phone: e.phone,
          subject: e.subject,
          senderType: e.senderType,
          organisationName: e.organisationName,
          status: e.status,
          projectCode: e.project?.projectCode ?? null,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
