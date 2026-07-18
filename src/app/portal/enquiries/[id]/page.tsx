import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from './ChatInterface';

export default async function EnquiryDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentUser = await prisma.employee.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!currentUser || !['OWNER', 'MANAGER'].includes(currentUser.role)) {
    redirect('/portal/dashboard');
  }

  const enquiry = await prisma.enquiry.findUnique({
    where: { id: params.id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!enquiry) {
    redirect('/portal/enquiries');
  }

  // Define subject labels
  const subjectLabels: Record<string, string> = {
    'property-valuation': 'Property Valuation',
    'land-valuation': 'Land Valuation',
    'building-valuation': 'Building Valuation',
    'industrial-valuation': 'Industrial Valuation',
    'bank-valuation': 'Bank Valuation',
    'insurance-valuation': 'Insurance Valuation',
    'government-valuation': 'Government Valuation',
    'other': 'Other Inquiry',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/portal/enquiries" className="p-2 rounded-xl border border-[#dee2e6] text-[#495057] hover:bg-[#f8f9fa] transition-colors">
            ←
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
              Ticket {enquiry.ticketNumber || 'N/A'}
            </h1>
            <p className="text-sm text-[#6c757d] mt-1">
              {subjectLabels[enquiry.subject] || enquiry.subject}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-[#0f2038]">{enquiry.name}</p>
          <p className="text-xs text-[#6c757d]">{enquiry.email}</p>
        </div>
      </div>

      <ChatInterface 
        enquiryId={enquiry.id}
        status={enquiry.status}
        messages={enquiry.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
