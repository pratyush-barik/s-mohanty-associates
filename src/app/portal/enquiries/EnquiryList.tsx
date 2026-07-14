'use client';

import { useState } from 'react';
import { updateEnquiryStatus } from '@/app/actions/enquiry';

interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  senderType: string;
  organisationName: string | null;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  UNREAD: 'bg-red-50 text-red-600 border-red-200',
  READ: 'bg-amber-50 text-amber-600 border-amber-200',
  REPLIED: 'bg-green-50 text-green-600 border-green-200',
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

export default function EnquiryList({ enquiries: initial }: { enquiries: Enquiry[] }) {
  const [enquiries, setEnquiries] = useState(initial);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (id: string, status: 'READ' | 'REPLIED') => {
    setUpdatingId(id);
    const result = await updateEnquiryStatus(id, status);
    if (result.success) {
      setEnquiries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, status } : e))
      );
    }
    setUpdatingId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
    // Auto-mark as READ when opening an UNREAD enquiry
    const enquiry = enquiries.find((e) => e.id === id);
    if (enquiry && enquiry.status === 'UNREAD' && expandedId !== id) {
      handleStatusUpdate(id, 'READ');
    }
  };

  if (enquiries.length === 0) {
    return (
      <div className="card p-12 text-center">
        <div className="text-4xl mb-4">📭</div>
        <h2 className="text-lg font-bold text-[#0f2038] mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
          No Enquiries Yet
        </h2>
        <p className="text-sm text-[#6c757d]">
          When visitors submit the Contact Us form, their enquiries will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {enquiries.map((enquiry) => {
        const isExpanded = expandedId === enquiry.id;
        const isUnread = enquiry.status === 'UNREAD';

        return (
          <div
            key={enquiry.id}
            className={`card overflow-hidden transition-all ${isUnread ? 'border-l-4 border-l-red-400' : ''}`}
          >
            {/* Header — always visible */}
            <button
              onClick={() => toggleExpand(enquiry.id)}
              className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-[#f8f9fa] transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Unread dot */}
                {isUnread && (
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm truncate ${isUnread ? 'font-bold text-[#0f2038]' : 'font-medium text-[#0f2038]'}`}>
                      {enquiry.name}
                    </p>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                      enquiry.senderType === 'ORGANISATION'
                        ? 'bg-purple-50 text-purple-600 border border-purple-200'
                        : 'bg-blue-50 text-blue-600 border border-blue-200'
                    }`}>
                      {enquiry.senderType === 'ORGANISATION' ? '🏢 Org' : '👤 Ind'}
                    </span>
                    <span className="text-xs text-[#adb5bd]">•</span>
                    <p className="text-xs text-[#6c757d] truncate">{enquiry.email}</p>
                  </div>
                  <p className="text-xs text-[#6c757d] truncate">
                    {subjectLabels[enquiry.subject] || enquiry.subject}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusColors[enquiry.status]}`}>
                  {enquiry.status}
                </span>
                <span className="text-[10px] text-[#adb5bd] whitespace-nowrap">
                  {new Date(enquiry.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                <svg className={`w-4 h-4 text-[#adb5bd] transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-6 pb-5 border-t border-[#e9ecef]">
                <div className="pt-4 space-y-4">
                  {/* Contact Details */}
                  <div className="grid sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] font-medium text-[#adb5bd] uppercase tracking-wider mb-0.5">Name</p>
                      <p className="text-sm font-medium text-[#0f2038]">{enquiry.name}</p>
                    </div>
                    {enquiry.senderType === 'ORGANISATION' && (
                      <div>
                        <p className="text-[10px] font-medium text-[#adb5bd] uppercase tracking-wider mb-0.5">Organisation</p>
                        <p className="text-sm font-medium text-[#0f2038]">{enquiry.organisationName}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-medium text-[#adb5bd] uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-sm text-[#0f2038]">{enquiry.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-[#adb5bd] uppercase tracking-wider mb-0.5">Phone</p>
                      <p className="text-sm text-[#0f2038]">{enquiry.phone || 'Not provided'}</p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <p className="text-[10px] font-medium text-[#adb5bd] uppercase tracking-wider mb-0.5">Subject</p>
                    <p className="text-sm font-medium text-[#b8860b]">
                      {subjectLabels[enquiry.subject] || enquiry.subject}
                    </p>
                  </div>

                  {/* Message */}
                  <div>
                    <p className="text-[10px] font-medium text-[#adb5bd] uppercase tracking-wider mb-1">Message</p>
                    <div className="p-4 rounded-xl bg-[#f8f9fa] border border-[#e9ecef]">
                      <p className="text-sm text-[#343a40] leading-relaxed whitespace-pre-wrap">{enquiry.message}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-2">
                    <a
                      href={`mailto:${enquiry.email}?subject=Re: ${encodeURIComponent(subjectLabels[enquiry.subject] || enquiry.subject)} — S Mohanty Associates&body=${encodeURIComponent(
                        `Dear ${enquiry.name},\n\nThank you for reaching out to S Mohanty Associates regarding ${subjectLabels[enquiry.subject] || enquiry.subject}.\n\n\n\nBest regards,\nS Mohanty Associates\nPlot No. 858(P) & 859(P), Near Astha Einodini Apartment\nBhubaneswar-751018, Odisha\nTel: 06743155572`
                      )}`}
                      onClick={() => {
                        if (enquiry.status !== 'REPLIED') handleStatusUpdate(enquiry.id, 'REPLIED');
                      }}
                      className="btn btn-primary text-xs px-5 py-2"
                    >
                      ✉️ Reply via Email
                    </a>

                    {enquiry.phone && (
                      <a
                        href={`tel:${enquiry.phone}`}
                        className="px-4 py-2 rounded-xl text-xs font-medium border border-[#dee2e6] text-[#495057] hover:bg-[#f8f9fa] transition-colors"
                      >
                        📞 Call
                      </a>
                    )}

                    {enquiry.status !== 'REPLIED' && (
                      <button
                        onClick={() => handleStatusUpdate(enquiry.id, 'REPLIED')}
                        disabled={updatingId === enquiry.id}
                        className="px-4 py-2 rounded-xl text-xs font-medium border border-green-200 text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                      >
                        ✓ Mark as Replied
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
