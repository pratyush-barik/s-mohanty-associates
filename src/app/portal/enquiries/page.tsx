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
    redirect('/portal/dashboard');
  }

  const enquiries = await prisma.enquiry.findMany({
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: enquiries.length,
    unread: enquiries.filter((e) => e.status === 'UNREAD').length,
    read: enquiries.filter((e) => e.status === 'READ').length,
    replied: enquiries.filter((e) => e.status === 'REPLIED').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
          Public Enquiries
        </h1>
        <p className="text-sm text-[#6c757d] mt-1">
          Enquiries submitted by visitors through the Contact Us form.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.total}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Unread</p>
          <p className="text-2xl font-bold text-red-500" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.unread}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Read</p>
          <p className="text-2xl font-bold text-[#b8860b]" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.read}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-xs font-medium text-[#6c757d] uppercase tracking-wider mb-1">Replied</p>
          <p className="text-2xl font-bold text-green-600" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.replied}
          </p>
        </div>
      </div>

      <EnquiryList
        enquiries={enquiries.map((e) => ({
          id: e.id,
          name: e.name,
          email: e.email,
          phone: e.phone,
          subject: e.subject,
          message: e.message,
          senderType: e.senderType,
          organisationName: e.organisationName,
          status: e.status,
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
