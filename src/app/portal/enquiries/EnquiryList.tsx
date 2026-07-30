'use client';

import Link from 'next/link';

interface Enquiry {
  id: string;
  ticketNumber: string | null;
  source: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  senderType: string;
  organisationName: string | null;
  status: string;
  projectCode: string | null;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  NEW: 'bg-red-50 text-red-600 border-red-200',
  WAITING_FOR_CLIENT: 'bg-amber-50 text-amber-600 border-amber-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-200',
  CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
};

const sourceStyles: Record<string, { bg: string; text: string; icon: string }> = {
  WEBSITE: { bg: 'bg-purple-50', text: 'text-purple-700', icon: '🌐' },
  EMAIL: { bg: 'bg-blue-50', text: 'text-blue-700', icon: '📧' },
  PORTAL_SIGNUP: { bg: 'bg-green-50', text: 'text-green-700', icon: '🔐' },
};

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

export default function EnquiryList({ enquiries }: { enquiries: Enquiry[] }) {
  if (enquiries.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-4">📭</div>
        <h2 className="text-lg font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          No Enquiries Yet
        </h2>
        <p className="text-sm text-[#6c757d]">
          When visitors submit the Contact Us form or email directly, they will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#f8f9fa] border-b border-[#e9ecef]">
              <th className="px-6 py-3 text-xs font-semibold text-[#495057] uppercase tracking-wider">Ticket</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#495057] uppercase tracking-wider">Source</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#495057] uppercase tracking-wider">Enquirer</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#495057] uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-xs font-semibold text-[#495057] uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e9ecef]">
            {enquiries.map((enquiry) => {
              const isNew = enquiry.status === 'NEW';
              const sourceStyle = sourceStyles[enquiry.source] || sourceStyles.WEBSITE;

              return (
                <tr key={enquiry.id} className="hover:bg-[#f8f9fa] transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-mono text-xs font-medium text-[#0f2038]">
                      {enquiry.ticketNumber || 'N/A'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${sourceStyle.bg} ${sourceStyle.text}`}>
                      {sourceStyle.icon} {enquiry.source === 'EMAIL' ? 'Gmail' : enquiry.source === 'PORTAL_SIGNUP' ? 'Portal' : 'Website'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {isNew && <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />}
                      <div>
                        <p className={`text-sm ${isNew ? 'font-bold text-[#0f2038]' : 'font-medium text-[#0f2038]'}`}>
                          {enquiry.name}
                        </p>
                        <p className="text-xs text-[#6c757d]">{enquiry.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColors[enquiry.status] || 'bg-gray-50 text-gray-600'}`}>
                      {enquiry.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/portal/enquiries/${enquiry.id}`}
                      className="text-xs font-medium text-[#b8860b] hover:text-[#0f2038] transition-colors"
                    >
                      View Ticket →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
