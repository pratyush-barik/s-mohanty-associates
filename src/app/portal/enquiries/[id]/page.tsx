import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ChatInterface from './ChatInterface';

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
    where: { id },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
      },
      documents: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          url: true,
          type: true,
          size: true,
          createdAt: true,
        },
      },
      project: {
        select: {
          id: true,
          projectCode: true,
          status: true,
        },
      },
      serviceRequest: {
        select: {
          id: true,
          propertyType: true,
          purpose: true,
          contactName: true,
        },
      },
    },
  });

  if (!enquiry) {
    redirect('/portal/enquiries');
  }

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

  const sourceLabel = enquiry.source === 'EMAIL' ? '📧 Email Direct' : enquiry.source === 'PORTAL_SIGNUP' ? '🌐 Portal Signup' : '🌐 Website Contact';

  const sourceBadgeColor = enquiry.source === 'EMAIL'
    ? 'bg-blue-100 text-blue-700 border-blue-200'
    : enquiry.source === 'PORTAL_SIGNUP'
      ? 'bg-green-100 text-green-700 border-green-200'
      : 'bg-purple-100 text-purple-700 border-purple-200';

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
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${sourceBadgeColor}`}>
            {sourceLabel}
          </span>
        </div>
      </div>

      {/* Linked Project Info */}
      {enquiry.project && (
        <div className="card p-4 bg-[#f8f9fa] border border-[#e9ecef]">
          <div className="flex items-center gap-3">
            <span className="text-lg">📁</span>
            <div>
              <Link href={`/portal/projects/${enquiry.project.id}`} className="text-sm font-bold text-[#b8860b] hover:underline font-mono">
                {enquiry.project.projectCode}
              </Link>
              <p className="text-xs text-[#6c757d] mt-0.5">
                {enquiry.project.status.replace(/_/g, ' ')} • {enquiry.serviceRequest?.propertyType} — {enquiry.serviceRequest?.purpose}
              </p>
            </div>
          </div>
        </div>
      )}

      <ChatInterface
        enquiryId={enquiry.id}
        status={enquiry.status}
        source={enquiry.source}
        messages={enquiry.messages.map((m) => ({
          id: m.id,
          sender: m.sender,
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        }))}
        documents={enquiry.documents.map((d) => ({
          id: d.id,
          name: d.name,
          url: d.url,
          type: d.type,
          size: d.size,
          createdAt: d.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}