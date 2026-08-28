'use client';

import React, { useState, useEffect } from 'react';

// ─── Standard Input & Select Classes ─────────────────────────────────
export const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] disabled:bg-[#f1f3f5] disabled:text-[#6c757d] transition-all";
export const selectCls = inputCls;

// ─── Standard Accordion Section Card ─────────────────────────────────
export function Section({
  title,
  number,
  id,
  children,
  defaultOpen = true,
}: {
  title: string;
  number?: number | string;
  id?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const secId = id || (number ? `section-${number}` : undefined);

  return (
    <div id={secId} className="card border border-[#e9ecef] overflow-hidden scroll-mt-24 rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0a1628] to-[#162d4a] text-white hover:from-[#0f1e35] hover:to-[#1e3a5f] transition-all"
      >
        <div className="flex items-center gap-3">
          {number && (
            <span className="w-8 h-8 rounded-lg bg-[#b8860b] flex items-center justify-center text-sm font-bold shadow-sm">
              {number}
            </span>
          )}
          <span className="font-semibold text-sm tracking-wide">{title}</span>
        </div>
        <svg className={`w-5 h-5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-6 space-y-5">{children}</div>}
    </div>
  );
}

// ─── Standard Form Field Wrapper ─────────────────────────────────────
export function Field({
  label,
  children,
  span = 1,
}: {
  label: string;
  children: React.ReactNode;
  span?: number;
}) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : span === 3 ? 'md:col-span-3' : ''}>
      <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

// ─── Standard Floating Navigator ─────────────────────────────────────
export interface NavItem {
  id: string;
  title: string;
}

export function FloatingNavigator({ sections }: { sections: NavItem[] }) {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -80% 0px' }
    );

    sections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="hidden xl:flex flex-col gap-0 bg-white/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-[#e9ecef] p-2 rounded-2xl w-[160px] sticky top-24 shrink-0 z-40">
      <div className="text-[10px] font-black text-neutral-400 mb-1 px-2 uppercase tracking-widest">Sections</div>
      {sections.map((sec) => {
        const isActive = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            className={`text-left py-1 px-2.5 rounded-lg transition-all flex flex-col justify-center my-0.5 ${
              isActive
                ? '!bg-[#b8860b] !text-white !border-[#b8860b] shadow-md font-bold'
                : 'text-slate-600 hover:bg-[#b8860b]/10 hover:text-[#b8860b]'
            }`}
          >
            <span className="text-[11.5px] leading-tight truncate w-full">
              {sec.title}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Standard Active Configuration Top Banner ────────────────────────
export function ActiveConfigBanner({
  bankName,
  formatName,
  category,
  serviceType,
  subjectType,
  onResetWizard,
}: {
  bankName: string;
  formatName?: string;
  category?: string;
  serviceType?: string;
  subjectType?: string;
  onResetWizard?: () => void;
}) {
  return (
    <div className="p-4 bg-white border border-[#dee2e6] flex flex-row items-center justify-between gap-4 shadow-md rounded-2xl sticky top-2 z-50">
      <div className="flex items-center gap-4">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight min-w-[90px] select-none">
          Active<br />Configuration
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Organisation / Bank
          </span>
          {category && (
            <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              {category}
            </span>
          )}
          <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            {bankName}
          </span>
          {formatName && (
            <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              Format: {formatName}
            </span>
          )}
          {serviceType && (
            <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
              Service: {serviceType.replace(/_/g, ' ')}
            </span>
          )}
          {subjectType && (
            <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
              Subject: {subjectType.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>
      {onResetWizard && (
        <button
          type="button"
          onClick={onResetWizard}
          className="text-xs text-[#b8860b] hover:text-[#8a6507] hover:underline font-bold transition-colors shrink-0 pr-2 uppercase"
        >
          Change Parameters
        </button>
      )}
    </div>
  );
}

// ─── Standard Report Action Bar (Sticky Bottom) ──────────────────────
export function ReportActionBar({
  isReadOnly,
  userRole,
  autoSaveStatus,
  message,
  loading,
  onSaveDraft,
  onSubmit,
  onPreviewPDF,
  onDownloadPDF,
}: {
  isReadOnly: boolean;
  userRole?: string;
  autoSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  message?: { text: string; type: 'success' | 'error' } | null;
  loading: boolean;
  onSaveDraft?: () => void;
  onSubmit?: () => void;
  onPreviewPDF: () => void;
  onDownloadPDF: () => void;
}) {
  return (
    <div className="p-6 bg-white border border-[#dee2e6] rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-40">
      <div className="flex items-center gap-3">
        {!isReadOnly && (
          <>
            {autoSaveStatus === 'saving' && (
              <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Auto-saving...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ✓ Auto-saved
              </span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                ⚠️ Auto-save failed
              </span>
            )}
          </>
        )}
        {message && (
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
            {message.text}
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!isReadOnly && (
          <>
            {onSaveDraft && (
              <button
                type="button"
                onClick={onSaveDraft}
                disabled={loading}
                className="px-6 py-2.5 rounded-full border-2 border-[#b8860b] text-[#b8860b] font-bold text-sm hover:bg-[#b8860b]/5 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? '⏳ Saving...' : '💾 Save Draft'}
              </button>
            )}
            {onSubmit && userRole === 'REPORT_EMPLOYEE' && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? '⏳ Submitting...' : '📤 Submit to Manager'}
              </button>
            )}
          </>
        )}

        <button
          type="button"
          onClick={onPreviewPDF}
          disabled={loading}
          className="px-6 py-2.5 rounded-full border border-gray-400 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          👁️ Preview PDF
        </button>

        <button
          type="button"
          onClick={onDownloadPDF}
          disabled={loading}
          className="px-6 py-2.5 rounded-full border border-gray-400 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          📥 Download PDF
        </button>
      </div>
    </div>
  );
}

// ─── Standard PDF Preview Modal ──────────────────────────────────────
export function PDFPreviewModal({
  title,
  pdfUrl,
  onClose,
}: {
  title: string;
  pdfUrl: string | null;
  onClose: () => void;
}) {
  if (!pdfUrl) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <h3 className="text-sm font-bold tracking-wider uppercase">{title} - PDF Preview</h3>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
          >
            ✕ Close
          </button>
        </div>
        <iframe src={pdfUrl} className="flex-1 w-full h-full border-0" />
      </div>
    </div>
  );
}
