'use client';

import React, { useState, useEffect, useRef } from 'react';
import { normalizeMapImages } from '@/lib/bank-fields';
import { DEFAULT_LETTERHEAD_PATH, fetchDefaultLetterhead, fetchBytes, formatReportDate } from '@/lib/pdf-bank-renderer';
import { SERVICES_LIST } from '../constants';
export { DEFAULT_LETTERHEAD_PATH, fetchDefaultLetterhead, fetchBytes, formatReportDate, SERVICES_LIST };

// ─── Dynamic Floor Naming (Pure Algorithmic Ordinal Generator) ───────────
const ORDINALS_MAP: Record<number, string> = {
  1: 'First', 2: 'Second', 3: 'Third', 4: 'Fourth', 5: 'Fifth',
  6: 'Sixth', 7: 'Seventh', 8: 'Eighth', 9: 'Ninth', 10: 'Tenth',
  11: 'Eleventh', 12: 'Twelfth', 13: 'Thirteenth', 14: 'Fourteenth', 15: 'Fifteenth',
  16: 'Sixteenth', 17: 'Seventeenth', 18: 'Eighteenth', 19: 'Nineteenth', 20: 'Twentieth',
  30: 'Thirtieth', 40: 'Fortieth', 50: 'Fiftieth', 60: 'Sixtieth', 70: 'Seventieth',
  80: 'Eightieth', 90: 'Ninetieth',
};

const TENS_WORDS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
const ONES_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];

export function numberToOrdinalWord(num: number): string {
  if (num <= 0) return 'Ground';
  if (ORDINALS_MAP[num]) return ORDINALS_MAP[num];

  if (num < 100) {
    const tens = Math.floor(num / 10);
    const units = num % 10;
    return `${TENS_WORDS[tens]} ${ORDINALS_MAP[units] || `${units}th`}`;
  }

  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    if (remainder === 0) return `${ONES_WORDS[hundreds]} Hundredth`;
    return `${ONES_WORDS[hundreds]} Hundred ${numberToOrdinalWord(remainder)}`;
  }

  return `${num}th`;
}

export function getFloorName(index: number): string {
  if (index <= 0) return 'Ground Floor';
  return `${numberToOrdinalWord(index)} Floor`;
}

// ─── Assigned Field Engineers Formatter ──────────────────────────────
export function formatAssignedEngineers(fieldEmployees?: Array<any>): string {
  if (!fieldEmployees || !Array.isArray(fieldEmployees) || fieldEmployees.length === 0) {
    return '';
  }
  const rawNames = fieldEmployees
    .map(e => {
      if (!e) return '';
      if (typeof e === 'string') return e.trim();
      return (e.name || e.employee?.name || e.user?.name || '').trim();
    })
    .filter(Boolean);

  // Remove duplicates while preserving original order
  const seen = new Set<string>();
  const names: string[] = [];
  for (const n of rawNames) {
    const lower = n.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      names.push(n);
    }
  }

  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

// ─── Standard Input & Select Classes ─────────────────────────────────
export const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-500 disabled:bg-[#f1f3f5] disabled:text-[#6c757d] transition-all";
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

  const displayTitle = React.useMemo(() => {
    if (!title || typeof title !== 'string') return title;
    let clean = title;
    if (number !== undefined && number !== null) {
      clean = clean.replace(/^\s*\d+\.\s*/, '');
    }
    return clean;
  }, [title, number]);

  return (
    <div id={secId} className="card border border-[#e9ecef] overflow-hidden scroll-mt-24 rounded-2xl bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-linear-to-r from-[#0a1628] to-[#162d4a] text-white hover:from-[#0f1e35] hover:to-[#1e3a5f] transition-all"
      >
        <div className="flex items-center gap-3">
          {number && (
            <span className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center text-sm font-bold shadow-sm">
              {number}
            </span>
          )}
          <span className="font-semibold text-sm tracking-wide whitespace-pre-line text-left">{displayTitle}</span>
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
  className = '',
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  span?: number;
  className?: string;
}) {
  return (
    <div className={`${span === 2 ? 'md:col-span-2' : span === 3 ? 'md:col-span-3' : ''} ${className}`.trim()}>
      <div className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5 flex items-center justify-between">{label}</div>
      {children}
    </div>
  );
}

// ─── Universal Date Formatter & Input Components (Strict DD/MM/YYYY) ──
export function toISODate(d?: string | null | Date): string {
  if (!d) return '';
  if (d instanceof Date) {
    if (isNaN(d.getTime())) return '';
    return d.toISOString().split('T')[0];
  }
  const t = String(d).trim();
  if (!t || t === 'NA' || t === 'N/A') return '';
  const ddmmyyyy = t.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  const dd_mm_yyyy = t.match(/^(\d{1,2})-(\d{1,2})-(\d{4})/);
  if (dd_mm_yyyy) {
    const [, dd, mm, yyyy] = dd_mm_yyyy;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  const yyyymmdd = t.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (yyyymmdd) {
    const [, yyyy, mm, dd] = yyyymmdd;
    return `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  return '';
}

export function BaseDateInput({
  value,
  onChange,
  label,
  placeholder = 'DD/MM/YYYY',
  disabled = false,
  span,
  className = '',
  max,
  min,
}: {
  value?: string | null;
  onChange: (val: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  disabled?: boolean;
  span?: number;
  className?: string;
  max?: string;
  min?: string;
}) {
  const hiddenDateRef = useRef<HTMLInputElement>(null);
  const strVal = value || '';
  const isoVal = toISODate(strVal);

  const handleOpenPicker = () => {
    if (disabled) return;
    try {
      if (hiddenDateRef.current && typeof (hiddenDateRef.current as any).showPicker === 'function') {
        (hiddenDateRef.current as any).showPicker();
      } else {
        hiddenDateRef.current?.click();
      }
    } catch {
      hiddenDateRef.current?.click();
    }
  };

  const inputContent = (
    <div className="relative flex items-center w-full group">
      <input
        type="text"
        className={`${inputCls} pr-10 ${className}`.trim()}
        value={strVal}
        onChange={e => onChange(e.target.value)}
        onBlur={() => {
          if (strVal && strVal.trim() && strVal !== 'NA' && strVal !== 'N/A') {
            const formatted = formatReportDate(strVal);
            if (formatted && formatted !== '________' && formatted !== strVal) {
              onChange(formatted);
            }
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
      />
      {!disabled ? (
        <div className="absolute right-1.5 flex items-center">
          <input
            ref={hiddenDateRef}
            type="date"
            value={isoVal}
            max={max ? toISODate(max) : undefined}
            min={min ? toISODate(min) : undefined}
            tabIndex={-1}
            aria-hidden="true"
            className="opacity-0 absolute pointer-events-none w-0 h-0"
            onChange={e => {
              if (e.target.value) {
                onChange(formatReportDate(e.target.value));
              }
            }}
          />
          <button
            type="button"
            onClick={handleOpenPicker}
            title="Choose date from calendar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="absolute right-2.5 flex items-center pointer-events-none text-slate-300">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}
    </div>
  );

  if (label) {
    return (
      <Field label={label} span={span}>
        {inputContent}
      </Field>
    );
  }
  return inputContent;
}

export const DateInput = BaseDateInput;

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
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="hidden xl:flex flex-col bg-white/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-[#e9ecef] p-2 rounded-2xl w-43.75 sticky top-24 shrink-0 z-40 max-h-[calc(100vh-120px)] overflow-hidden">
      <div className="text-[10px] font-black text-emerald-500 mb-2 px-2 uppercase tracking-widest shrink-0">Sections</div>
      <div className="flex flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
        {sections.map((sec) => {
          const isActive = activeId === sec.id;
          const cleanTitle = (sec.title || '').replace(/^\d+[\.\s\-:]*\s*/, '');
          return (
            <button
              key={sec.id}
              type="button"
              title={cleanTitle}
              onClick={() => scrollTo(sec.id)}
              className={`w-full py-1.5 px-2.5 rounded-xl text-center transition-all duration-200 text-xs font-bold my-0.5 shrink-0 ${
                isActive
                  ? 'bg-accent-500 text-white border border-[#96700a] shadow-md font-extrabold scale-[1.02]'
                  : 'bg-indigo-50/90 text-indigo-900 border border-indigo-100/80 shadow-sm hover:bg-indigo-100 hover:border-indigo-200'
              }`}
            >
              <span className="leading-snug block w-full whitespace-normal wrap-break-word">
                {cleanTitle}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Standard Active Configuration Top Banner ────────────────────────
export function ActiveConfigBanner({
  clientType = 'organisation',
  bankName,
  subclass,
  formatName,
  category,
  serviceType,
  subjectType,
  onResetWizard,
}: {
  clientType?: 'individual' | 'organisation';
  bankName?: string;
  subclass?: string;
  formatName?: string;
  category?: string;
  serviceType?: string;
  subjectType?: string;
  onResetWizard?: () => void;
}) {
  const activeSubclass = (subclass || formatName || '').trim();
  const isIndividual = clientType === 'individual';
  const serviceTitle = serviceType
    ? (SERVICES_LIST.find((s) => s.id === serviceType)?.title || serviceType).replace(/_/g, ' ')
    : undefined;

  const isGenericValuationReport = activeSubclass.toLowerCase() === 'valuation report';
  const displaySubclass = isGenericValuationReport ? undefined : activeSubclass;

  return (
    <div className="p-4 bg-white border border-[#dee2e6] flex flex-row items-center justify-between gap-4 shadow-md rounded-2xl sticky top-2 z-50">
      <div className="flex items-center gap-4">
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight min-w-[90px] select-none">
          Active<br />Configuration
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
            <span className={`w-1.5 h-1.5 rounded-full ${isIndividual ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
            {isIndividual ? 'Individual' : 'Organisation / Bank'}
          </span>
          {!isIndividual && category && (
            <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
              {category}
            </span>
          )}
          {!isIndividual && bankName && (
            <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
              {bankName}
            </span>
          )}
          {!isIndividual && displaySubclass && (
            <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              {displaySubclass}
            </span>
          )}
          {serviceTitle && (
            <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Service: {serviceTitle}
            </span>
          )}
          {subjectType && (
            <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Subject: {subjectType.replace(/_/g, ' ')}
            </span>
          )}
        </div>
      </div>
      {onResetWizard && (
        <button
          type="button"
          onClick={onResetWizard}
          className="text-xs text-[#b8860b] hover:text-[#8a6507] hover:underline font-bold transition-colors shrink-0 pr-2 uppercase cursor-pointer"
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
    <div className="p-5 bg-[#556B2F] border-2 border-[#3F5021] rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-40">
      <div className="flex items-center gap-3">
        {!isReadOnly && (
          <>
            {autoSaveStatus === 'saving' && (
              <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                Auto-saving...
              </span>
            )}
            {autoSaveStatus === 'saved' && (
              <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                ✓ Auto-saved
              </span>
            )}
            {autoSaveStatus === 'error' && (
              <span className="text-xs font-bold text-rose-900 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                ⚠️ Auto-save failed
              </span>
            )}
          </>
        )}
        {message && (
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-xs ${message.type === 'error' ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-green-100 text-green-900 border border-green-300'}`}>
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
                className="px-6 py-2.5 rounded-full bg-white border-2 border-accent-500 text-accent-500 font-bold text-sm hover:bg-amber-50 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading ? '⏳ Saving...' : '💾 Save Draft'}
              </button>
            )}
            {onSubmit && (
              <button
                type="button"
                onClick={onSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-[#1e3a5f] text-white font-bold text-sm hover:bg-[#0f2038] shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
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
          className="px-6 py-2.5 rounded-full bg-white border border-gray-300 text-gray-800 font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          👁️ Preview PDF
        </button>

        <button
          type="button"
          onClick={onDownloadPDF}
          disabled={loading}
          className="px-6 py-2.5 rounded-full bg-white border border-gray-300 text-gray-800 font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
        >
          📥 Download PDF
        </button>
      </div>
    </div>
  );
}

export const DEFAULT_PHOTO_LABEL = 'Site Picture';

// ─── Standard Photographs Section (Boxed UI with Drag & Drop Reordering) ───
export function BasePhotographsSection({
  propertyImages = [],
  propertyImageNames = [],
  isReadOnly = false,
  uploading = false,
  bucketCount = 0,
  onOpenBucketPicker,
  onUploadImages,
  onRemoveImage,
  onImageNameChange,
  onReorderImages,
  sectionNumber = 11,
  sectionId = 'section-11',
  title = 'Property Photographs',
  withoutSectionWrapper = false,
  defaultOpen = false,
}: {
  propertyImages?: string[];
  propertyImageNames?: string[];
  isReadOnly?: boolean;
  uploading?: boolean | string;
  bucketCount?: number;
  onOpenBucketPicker?: () => void;
  onUploadImages?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage?: (idx: number) => void;
  onImageNameChange?: (idx: number, name: string) => void;
  onReorderImages?: (newImages: string[], newNames: string[]) => void;
  sectionNumber?: number | string;
  sectionId?: string;
  title?: string;
  withoutSectionWrapper?: boolean;
  defaultOpen?: boolean;
}) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const isPhotosUploading = uploading === true || uploading === 'photos' || uploading === 'propertyImages';
  const validPhotos = propertyImages.filter(Boolean);

  const movePhoto = (fromIdx: number, toIdx: number) => {
    if (isReadOnly || !onReorderImages) return;
    if (fromIdx < 0 || fromIdx >= propertyImages.length) return;
    if (toIdx < 0 || toIdx >= propertyImages.length) return;
    if (fromIdx === toIdx) return;

    const reorderedImgs = [...propertyImages];
    const reorderedNames = [...(propertyImageNames || [])];

    while (reorderedNames.length < reorderedImgs.length) {
      reorderedNames.push(`Photograph ${reorderedNames.length + 1}`);
    }

    const [movedImg] = reorderedImgs.splice(fromIdx, 1);
    const [movedName] = reorderedNames.splice(fromIdx, 1);

    reorderedImgs.splice(toIdx, 0, movedImg);
    reorderedNames.splice(toIdx, 0, movedName);

    setDraggedIdx(null);
    setDragOverIdx(null);
    onReorderImages(reorderedImgs, reorderedNames);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (isReadOnly) return;
    try {
      e.dataTransfer.setData('text/plain', String(idx));
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      /* ignore */
    }
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {
      /* ignore */
    }
    if (draggedIdx === null || draggedIdx === idx) return;
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    let fromIdx = draggedIdx;
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (data !== '') {
        const parsed = parseInt(data, 10);
        if (!isNaN(parsed)) fromIdx = parsed;
      }
    } catch {
      /* fallback */
    }
    setDraggedIdx(null);
    setDragOverIdx(null);

    if (fromIdx === null || isNaN(fromIdx) || fromIdx === targetIdx) {
      return;
    }
    movePhoto(fromIdx, targetIdx);
  };

  const content = (
    <div className="space-y-4">
      {/* Photo Grid */}
      {propertyImages.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {propertyImages.map((url, idx) => {
            const currentLabel = propertyImageNames?.[idx] || `Photograph ${idx + 1}`;
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx;
            const canDrag = !isReadOnly && propertyImages.length > 1;

            return (
              <div
                key={`${url}-${idx}`}
                draggable={canDrag}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`space-y-2 p-3 border rounded-2xl bg-white shadow-xs transition-all duration-200 ${
                  isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'
                } ${
                  isDragOver
                    ? 'border-2 border-dashed border-accent-500 ring-2 ring-accent-500/20 shadow-md bg-amber-50/20'
                    : 'border-[#dee2e6] hover:border-slate-300'
                }`}
              >
                {/* Header: Badge / Drag Handle + Editable Label + Actions */}
                <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-100">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span
                      className="px-2 py-0.5 rounded bg-[#1e3a5f] text-white text-[11px] font-bold select-none shrink-0 flex items-center gap-1 shadow-2xs"
                      title="Drag photo card to reposition or use arrow buttons"
                    >
                      {canDrag && <span className="cursor-grab active:cursor-grabbing text-slate-300">⠿</span>}
                      <span>#{idx + 1}</span>
                    </span>
                    <input
                      type="text"
                      className="w-full text-xs font-semibold text-[#0f2038] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-accent-500 focus:bg-slate-50 rounded px-1 py-0.5 outline-none truncate transition-colors"
                      value={currentLabel}
                      onChange={(e) => onImageNameChange?.(idx, e.target.value)}
                      placeholder={`Photograph ${idx + 1}`}
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Move Left / Right Buttons + Remove */}
                  {!isReadOnly && onRemoveImage && (
                    <div className="flex items-center gap-1 shrink-0">
                      {onReorderImages && propertyImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => movePhoto(idx, idx - 1)}
                            disabled={idx === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold shadow-2xs cursor-pointer"
                            title="Move Photo Left / Previous"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            onClick={() => movePhoto(idx, idx + 1)}
                            disabled={idx === propertyImages.length - 1}
                            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-bold shadow-2xs cursor-pointer"
                            title="Move Photo Right / Next"
                          >
                            ▶
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemoveImage(idx)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors text-xs font-bold shadow-2xs cursor-pointer ml-0.5"
                        title="Remove Photo"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Body: Uploaded Photo Preview */}
                <div className="relative rounded-xl overflow-hidden border border-[#dee2e6] bg-slate-100 h-52 flex items-center justify-center cursor-grab active:cursor-grabbing">
                  <img src={url} alt={currentLabel} className="w-full h-full object-cover pointer-events-none select-none" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload & Actions Bar */}
      {!isReadOnly && (
        <div className={`flex flex-wrap items-center justify-between gap-3 ${validPhotos.length > 0 ? 'pt-3 border-t border-slate-100' : ''}`}>
          <div className="flex flex-wrap items-center gap-3">
            {/* 1. Local Device Upload */}
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-accent-500 text-accent-500 text-sm font-semibold cursor-pointer hover:bg-accent-500/10 transition-all shadow-xs">
              {isPhotosUploading ? '⏳ Uploading...' : '📷 Add Property Images'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onUploadImages}
                disabled={isPhotosUploading}
              />
            </label>

            {/* 2. Cloud Storage Bucket Pick */}
            {onOpenBucketPicker && (
              <button
                type="button"
                onClick={onOpenBucketPicker}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#1e3a5f] text-[#1e3a5f] text-sm font-semibold hover:bg-[#1e3a5f]/10 transition-all cursor-pointer shadow-xs"
              >
                📁 Pick from Bucket {bucketCount > 0 ? `(${bucketCount})` : ''}
              </button>
            )}
          </div>

          <div
            className={`text-xs font-semibold ${
              validPhotos.length < 2 ? 'text-amber-600' : 'text-green-600'
            }`}
          >
            {validPhotos.length} / 2 minimum uploaded
            {validPhotos.length < 2 && ' — At least 2 photographs are required to submit.'}
          </div>
        </div>
      )}
    </div>
  );

  if (withoutSectionWrapper) {
    return content;
  }

  return (
    <Section title={title} number={sectionNumber} id={sectionId} defaultOpen={defaultOpen}>
      {content}
    </Section>
  );
}

// ─── Standard Maps & Documents Section (Derived from General) ─────────
export function BaseMapsSection({
  locationMapImage,
  locationMapImages,
  latitude = '',
  longitude = '',
  propertyAddress = '',
  technicalAddress = '',
  sketchMapImages = [],
  mouzaMapImage,
  mouzaMapImages,
  cadastralMapImage,
  cadastralMapImages,
  isReadOnly = false,
  uploading = false,
  hasExternalCoordinatesField = false,
  coordinatesSectionName = '',
  onLatitudeChange,
  onLongitudeChange,
  onLocationMapUpload,
  onLocationMapRemove,
  onSketchMapUpload,
  onSketchMapRemove,
  onMouzaMapUpload,
  onMouzaMapRemove,
  onCadastralMapUpload,
  onCadastralMapRemove,
  onReorderLocationMap,
  onReorderMouzaMap,
  onReorderSketchMap,
  onReorderCadastralMap,
  sectionNumber = 10,
  sectionId = 'section-10',
  title = 'Maps & Documents',
  mapOrder = ['location', 'mouza', 'sketch', 'cadastral'],
  withoutSectionWrapper = false,
}: {
  locationMapImage?: string | string[];
  locationMapImages?: string[];
  latitude?: string;
  longitude?: string;
  propertyAddress?: string;
  technicalAddress?: string;
  sketchMapImages?: string[];
  mouzaMapImage?: string | string[];
  mouzaMapImages?: string[];
  cadastralMapImage?: string | string[];
  cadastralMapImages?: string[];
  isReadOnly?: boolean;
  uploading?: boolean | string;
  hasExternalCoordinatesField?: boolean;
  coordinatesSectionName?: string;
  onLatitudeChange?: (val: string) => void;
  onLongitudeChange?: (val: string) => void;
  onLocationMapUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLocationMapRemove?: (index?: number) => void;
  onSketchMapUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSketchMapRemove?: (index: number) => void;
  onMouzaMapUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMouzaMapRemove?: (index?: number) => void;
  onCadastralMapUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCadastralMapRemove?: (index?: number) => void;
  onReorderLocationMap?: (newImages: string[]) => void;
  onReorderMouzaMap?: (newImages: string[]) => void;
  onReorderSketchMap?: (newImages: string[]) => void;
  onReorderCadastralMap?: (newImages: string[]) => void;
  sectionNumber?: number | string;
  sectionId?: string;
  title?: string;
  mapOrder?: ('location' | 'mouza' | 'sketch' | 'cadastral')[];
  withoutSectionWrapper?: boolean;
}) {
  const [localLat, setLocalLat] = useState(latitude || '');
  const [localLng, setLocalLng] = useState(longitude || '');

  useEffect(() => {
    setLocalLat(latitude || '');
  }, [latitude]);

  useEffect(() => {
    setLocalLng(longitude || '');
  }, [longitude]);

  // Lock coordinates if external coordinates exist or if change handlers are omitted
  const isLocked = hasExternalCoordinatesField || (!onLatitudeChange && !onLongitudeChange);
  const activeLat = isLocked ? (latitude || '') : (onLatitudeChange ? (latitude || '') : localLat);
  const activeLng = isLocked ? (longitude || '') : (onLongitudeChange ? (longitude || '') : localLng);

  const handleLatChange = (val: string) => {
    if (isLocked) return;
    setLocalLat(val);
    onLatitudeChange?.(val);
  };

  const handleLngChange = (val: string) => {
    if (isLocked) return;
    setLocalLng(val);
    onLongitudeChange?.(val);
  };

  const cleanLat = (activeLat || '').trim();
  const cleanLng = (activeLng || '').trim();
  const hasCoordinates = Boolean(cleanLat && cleanLng && !isNaN(Number(cleanLat)) && !isNaN(Number(cleanLng)));
  
  const cleanTechnicalAddress = (technicalAddress || '').trim();
  const cleanPropertyAddress = (propertyAddress || '').trim();
  const effectiveAddress = cleanTechnicalAddress || cleanPropertyAddress;

  // Specific uploading booleans per map category
  const isLocationUploading = typeof uploading === 'string'
    ? (uploading === 'location' || uploading === 'locationMapImages' || uploading === 'locationMapImage')
    : Boolean(uploading);

  const isMouzaUploading = typeof uploading === 'string'
    ? (uploading === 'mouza' || uploading === 'mouzaMapImages' || uploading === 'mouzaMapImage')
    : Boolean(uploading);

  const isSketchUploading = typeof uploading === 'string'
    ? (uploading === 'sketch' || uploading === 'sketchMapImages' || uploading === 'sketchMapImage')
    : Boolean(uploading);

  const isCadastralUploading = typeof uploading === 'string'
    ? (uploading === 'cadastral' || uploading === 'cadastralMapImages' || uploading === 'cadastralMapImage')
    : Boolean(uploading);

  // Coordinates override technical address for more accurate pinpointing
  const queryParam = hasCoordinates
    ? `${cleanLat},${cleanLng}`
    : effectiveAddress;

  const encodedQuery = encodeURIComponent(queryParam);
  const hasQuery = hasCoordinates || effectiveAddress.length > 0;
  const googleMapsUrl = hasCoordinates
    ? `https://www.google.com/maps?q=${cleanLat},${cleanLng}&z=17&t=k`
    : `https://www.google.com/maps/search/${encodeURIComponent(effectiveAddress)}`;

  // Normalize multi-photo arrays (supports both legacy single string and array)
  const normLocationImages = normalizeMapImages(locationMapImages || locationMapImage);
  const normMouzaImages = normalizeMapImages(mouzaMapImages || mouzaMapImage);
  const normSketchImages = normalizeMapImages(sketchMapImages);
  const normCadastralImages = normalizeMapImages(cadastralMapImages || cadastralMapImage);

  const renderLocationMap = () => (
    <div key="location">
      <MapImageCategoryCard
        images={normLocationImages}
        categoryLabel="Satellite Screenshot"
        isReadOnly={isReadOnly}
        uploading={isLocationUploading}
        icon="🛰️"
        title="Google Satellite Map"
        btnLabel="Satellite Image"
        onUpload={onLocationMapUpload}
        onRemove={onLocationMapRemove}
        onReorder={onReorderLocationMap}
        emptyMessage="No satellite map screenshots uploaded yet. Click '+ Add Satellite Image' to add one or more photos for PDF."
        headerExtra={
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Live Satellite & Coordinate Preview
            </div>

            {hasQuery ? (
              <div className="rounded-xl overflow-hidden border border-[#c8d6e5] shadow-xs">
                <div className="bg-[#d5e8f5] px-3.5 py-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider flex items-center gap-1.5">
                      📍 Live Pin {hasCoordinates ? `(${cleanLat}, ${cleanLng})` : `— ${cleanTechnicalAddress ? 'Technical Address' : 'Property Address'}`}
                    </span>
                  </div>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-accent-500 hover:underline"
                  >
                    Open in Google Maps &#x2197;
                  </a>
                </div>
                <iframe
                  src={`https://maps.google.com/maps?q=${encodedQuery}&t=k&z=17&output=embed`}
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Property Location Map"
                />
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                Enter property address or coordinates in report details to view live satellite map preview.
              </div>
            )}

            {/* Map Reference Source Notice */}
            {hasCoordinates ? (
              <div className="rounded-lg p-2.5 bg-emerald-50 border border-emerald-200 text-xs text-slate-800 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-xs" />
                    <span className="font-bold text-emerald-950">📍 Map Referenced From:</span>
                    <span className="font-semibold text-emerald-800 font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded">
                      GPS Coordinates ({cleanLat}, {cleanLng})
                    </span>
                    <span className="text-[11px] font-medium text-emerald-700">
                      {isLocked
                        ? `(Referenced from ${coordinatesSectionName || 'report coordinates'})`
                        : '(Manual coordinate entry below)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wide">
                    Coordinates Active
                  </span>
                </div>
                {effectiveAddress && (
                  <div className="text-[11px] text-slate-600 pl-4 truncate" title={effectiveAddress}>
                    <span className="font-medium text-slate-700">
                      {cleanTechnicalAddress ? 'Technical Address:' : 'Property Address:'}
                    </span> {effectiveAddress}
                  </div>
                )}
              </div>
            ) : effectiveAddress ? (
              <div className="rounded-lg p-2.5 bg-blue-50 border border-blue-200 text-xs text-slate-800 space-y-1">
                <div className="flex items-center justify-between flex-wrap gap-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 shadow-xs" />
                    <span className="font-bold text-blue-950">📍 Map Referenced From:</span>
                    <span className="font-semibold text-blue-800 bg-blue-100/80 px-1.5 py-0.5 rounded">
                      {cleanTechnicalAddress ? 'Technical Address' : 'Property Address'}
                    </span>
                    <span className="text-[11px] text-blue-700 font-medium">
                      {cleanTechnicalAddress ? '(Technical Specifics)' : '(Default Address)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-blue-200">
                    {isLocked
                      ? `Coordinates empty in ${coordinatesSectionName || 'report details'}; map preview referencing address`
                      : 'Enter coordinates below to override for higher accuracy'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 pl-4 font-normal truncate" title={effectiveAddress}>
                  <span className="font-semibold text-blue-900">Address text:</span> {effectiveAddress}
                </div>
              </div>
            ) : (
              <div className="rounded-lg p-2.5 bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <span>⚠️</span>
                <span>
                  No property address or coordinates found.{' '}
                  {isLocked
                    ? `Please enter property address or coordinates in ${coordinatesSectionName || 'Location Details'}.`
                    : 'Enter property address in report details or input coordinates below.'}
                </span>
              </div>
            )}

            {/* Direct GPS Coordinates entry / Reference Box */}
            <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 space-y-2 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0f2038] flex items-center gap-1.5">
                  🧭 {isLocked ? 'Report Coordinates' : 'Direct GPS Coordinates Entry'}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {isLocked
                    ? `🔒 Coordinates referenced from ${coordinatesSectionName || 'report details'}`
                    : 'Input latitude & longitude to set map pin'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isLocked ? 'Latitude (Locked)' : 'Latitude (DD)'}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-mono ${
                      isLocked
                        ? 'bg-slate-100 text-slate-700 cursor-not-allowed select-all'
                        : 'bg-white text-slate-800 focus:ring-1 focus:ring-[#0f2038] focus:border-[#0f2038]'
                    }`}
                    placeholder={isLocked ? 'Not entered in report details' : ''}
                    value={activeLat || ''}
                    onChange={e => handleLatChange(e.target.value)}
                    readOnly={isLocked}
                    disabled={isReadOnly || isLocked}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    {isLocked ? 'Longitude (Locked)' : 'Longitude (DD)'}
                  </label>
                  <input
                    type="text"
                    className={`w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none font-mono ${
                      isLocked
                        ? 'bg-slate-100 text-slate-700 cursor-not-allowed select-all'
                        : 'bg-white text-slate-800 focus:ring-1 focus:ring-[#0f2038] focus:border-[#0f2038]'
                    }`}
                    placeholder={isLocked ? 'Not entered in report details' : ''}
                    value={activeLng || ''}
                    onChange={e => handleLngChange(e.target.value)}
                    readOnly={isLocked}
                    disabled={isReadOnly || isLocked}
                  />
                </div>
              </div>
            </div>

            {normLocationImages.length > 0 && (
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider pt-2">
                Satellite Screenshots (For PDF Inclusion)
              </div>
            )}
          </div>
        }
      />
    </div>
  );

  const renderMouzaMap = () => (
    <div key="mouza">
      <MapImageCategoryCard
        images={normMouzaImages}
        categoryLabel="Mouza Map"
        isReadOnly={isReadOnly}
        uploading={isMouzaUploading}
        icon="🗺️"
        title="Mouza Map (Bhulekh / Revenue Map)"
        btnLabel="Mouza Map"
        onUpload={onMouzaMapUpload}
        onRemove={onMouzaMapRemove}
        onReorder={onReorderMouzaMap}
        emptyMessage="No mouza map uploaded yet. Click '+ Add Mouza Map' to upload one or more maps."
      />
    </div>
  );

  const renderSketchMap = () => (
    <div key="sketch">
      <MapImageCategoryCard
        images={normSketchImages}
        categoryLabel="Sketch Map"
        isReadOnly={isReadOnly}
        uploading={isSketchUploading}
        icon="📐"
        title="Sketch Map (Demarcation / Hand-Drawn)"
        btnLabel="Sketch Map"
        onUpload={onSketchMapUpload}
        onRemove={onSketchMapRemove}
        onReorder={onReorderSketchMap}
        emptyMessage="No sketch maps uploaded yet. Click '+ Add Sketch Map' to upload one or more maps."
      />
    </div>
  );

  const renderCadastralMap = () => (
    <div key="cadastral">
      <MapImageCategoryCard
        images={normCadastralImages}
        categoryLabel="Cadastral Map"
        isReadOnly={isReadOnly}
        uploading={isCadastralUploading}
        icon="🌐"
        title="Cadastral Map"
        btnLabel="Cadastral Map"
        onUpload={onCadastralMapUpload}
        onRemove={onCadastralMapRemove}
        onReorder={onReorderCadastralMap}
        emptyMessage="No cadastral map uploaded yet. Click '+ Add Cadastral Map' to upload one or more maps."
      />
    </div>
  );

  const contentMap: Record<'location' | 'mouza' | 'sketch' | 'cadastral', () => React.ReactNode> = {
    location: renderLocationMap,
    mouza: renderMouzaMap,
    sketch: renderSketchMap,
    cadastral: renderCadastralMap,
  };

  const content = (
    <div className="space-y-6">
      {mapOrder.map((key) => contentMap[key]?.())}
    </div>
  );

  if (withoutSectionWrapper) {
    return content;
  }

  return (
    <Section title={title} number={sectionNumber} id={sectionId} defaultOpen={false}>
      {content}
    </Section>
  );
}

// ─── Standardized Map Category Card with Drag & Drop + 1-Click Arrow Repositioning ───
function MapImageCategoryCard({
  images,
  categoryLabel,
  isReadOnly = false,
  uploading = false,
  icon,
  title,
  btnLabel,
  onUpload,
  onRemove,
  onReorder,
  emptyMessage,
  headerExtra,
}: {
  images: string[];
  categoryLabel: string;
  isReadOnly?: boolean;
  uploading?: boolean;
  icon: string;
  title: string;
  btnLabel: string;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove?: (idx: number) => void;
  onReorder?: (newImages: string[]) => void;
  emptyMessage: string;
  headerExtra?: React.ReactNode;
}) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const moveMap = (fromIdx: number, toIdx: number) => {
    if (isReadOnly || !onReorder) return;
    if (fromIdx < 0 || fromIdx >= images.length) return;
    if (toIdx < 0 || toIdx >= images.length) return;
    if (fromIdx === toIdx) return;

    const reordered = [...images];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(toIdx, 0, moved);

    setDraggedIdx(null);
    setDragOverIdx(null);
    onReorder(reordered);
  };

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    if (isReadOnly) return;
    try {
      e.dataTransfer.setData('text/plain', String(idx));
      e.dataTransfer.effectAllowed = 'move';
    } catch {
      /* ignore */
    }
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    try {
      e.dataTransfer.dropEffect = 'move';
    } catch {
      /* ignore */
    }
    if (draggedIdx === null || draggedIdx === idx) return;
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    let fromIdx = draggedIdx;
    try {
      const data = e.dataTransfer.getData('text/plain');
      if (data !== '') {
        const parsed = parseInt(data, 10);
        if (!isNaN(parsed)) fromIdx = parsed;
      }
    } catch {
      /* fallback */
    }
    setDraggedIdx(null);
    setDragOverIdx(null);

    if (fromIdx === null || isNaN(fromIdx) || fromIdx === targetIdx) {
      return;
    }
    moveMap(fromIdx, targetIdx);
  };

  return (
    <div className="space-y-4 p-4 border border-[#dee2e6] rounded-2xl bg-white shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {title} {images.length > 0 ? `(${images.length})` : ''}
          </h4>
        </div>
        {!isReadOnly && onUpload && (
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent-500 text-accent-500 text-xs font-semibold cursor-pointer hover:bg-accent-500/10 transition-all shadow-2xs">
            {uploading ? '⏳ Uploading...' : `+ Add ${btnLabel}`}
            <input type="file" accept="image/*" multiple className="hidden" onChange={onUpload} disabled={uploading} />
          </label>
        )}
      </div>

      {headerExtra}

      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((url, idx) => {
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx;
            const canDrag = !isReadOnly && images.length > 1;

            return (
              <div
                key={`${url}-${idx}`}
                draggable={canDrag}
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`relative group rounded-xl overflow-hidden border bg-slate-50 shadow-xs aspect-video flex items-center justify-center transition-all duration-200 ${
                  isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'
                } ${
                  isDragOver
                    ? 'border-2 border-dashed border-accent-500 ring-2 ring-accent-500/20 shadow-md bg-amber-50/20'
                    : 'border-[#dee2e6] hover:border-slate-300'
                }`}
              >
                <img src={url} alt={`${categoryLabel} ${idx + 1}`} className="w-full h-full object-contain pointer-events-none select-none" />

                {/* Left Badge: Drag Handle + Order */}
                <span
                  className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-white text-[11px] font-bold select-none flex items-center gap-1.5 shadow-xs backdrop-blur-xs"
                  title="Drag to reposition or use arrow buttons"
                >
                  {canDrag && <span className="cursor-grab active:cursor-grabbing text-slate-300">⠿</span>}
                  <span>#{idx + 1}</span>
                </span>

                {/* Right Action Controls: Reposition Arrows + Remove Button */}
                {!isReadOnly && (
                  <div
                    className="absolute top-2 right-2 flex items-center gap-1 z-10"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    {onReorder && images.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => moveMap(idx, idx - 1)}
                          disabled={idx === 0}
                          className="w-6 h-6 flex items-center justify-center rounded bg-black/70 hover:bg-black text-white text-[10px] font-bold disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer backdrop-blur-xs"
                          title="Move Left / Previous"
                        >
                          ◀
                        </button>
                        <button
                          type="button"
                          onClick={() => moveMap(idx, idx + 1)}
                          disabled={idx === images.length - 1}
                          className="w-6 h-6 flex items-center justify-center rounded bg-black/70 hover:bg-black text-white text-[10px] font-bold disabled:opacity-30 disabled:cursor-not-allowed shadow-xs transition-all cursor-pointer backdrop-blur-xs"
                          title="Move Right / Next"
                        >
                          ▶
                        </button>
                      </>
                    )}
                    {onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(idx)}
                        className="w-6 h-6 flex items-center justify-center rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
                        title={`Remove ${categoryLabel}`}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400 bg-slate-50/50">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}


// ─── Standard Photo Bucket Picker Modal ───────────────────────────────
export function BasePhotoBucketModal({
  isOpen,
  bucketImages = [],
  mode = 'propertyImages',
  onClose,
  onConfirm,
  onDeleteImage,
}: {
  isOpen: boolean;
  bucketImages: any[];
  mode?: 'propertyImages' | 'sketchMapImages' | 'locationMapImage';
  onClose: () => void;
  onConfirm: (selectedUrls: string[]) => void;
  onDeleteImage?: (img: any) => Promise<void>;
}) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleSelect = (id: string, _url?: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleConfirmSelection = () => {
    const urls = bucketImages
      .filter((img) => selectedIds.has(img.id))
      .map((img) => img.url);
    onConfirm(urls);
    onClose();
  };

  const uniqueAgents = Array.from(new Set(bucketImages.map((img) => img.employee?.employeeId).filter(Boolean)));

  return (
    <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0f2038] flex items-center gap-2">
              📸 Pick from Photo Bucket
            </h2>
            <p className="text-xs text-[#6c757d] mt-1">
              Select one or more inspection photos to add to the valuation report
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {bucketImages.length > 0 ? (
            selectedAgent === null && uniqueAgents.length > 1 ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-[#495057]">Select a Field Engineer to view their photos:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {uniqueAgents.map((empId) => {
                    const agentImages = bucketImages.filter((img) => img.employee?.employeeId === empId);
                    const agentName = agentImages[0]?.employee?.name || empId;
                    return (
                      <div
                        key={empId}
                        onClick={() => setSelectedAgent(empId)}
                        className="p-4 rounded-xl border border-gray-200 bg-white hover:border-accent-500 cursor-pointer shadow-sm"
                      >
                        <p className="font-bold text-sm text-[#0f2038]">{agentName}</p>
                        <p className="text-xs text-gray-500 mt-1">{agentImages.length} photos uploaded</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {uniqueAgents.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setSelectedAgent(null)}
                    className="text-xs font-bold text-accent-500 hover:underline mb-2 block"
                  >
                    &larr; Back to all Engineers
                  </button>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {(selectedAgent ? bucketImages.filter((img) => img.employee?.employeeId === selectedAgent) : bucketImages).map((img) => {
                    const isSel = selectedIds.has(img.id);
                    return (
                      <div
                        key={img.id}
                        onClick={() => toggleSelect(img.id, img.url)}
                        className={`relative group aspect-square rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isSel ? 'border-accent-500 ring-2 ring-accent-500/40 shadow-md' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img src={img.url} alt={img.fileName || 'Bucket image'} className="w-full h-full object-cover" />
                        {isSel && (
                          <div className="absolute top-1.5 right-1.5 bg-accent-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
                            ✓
                          </div>
                        )}
                        {onDeleteImage && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this photo from bucket?')) onDeleteImage(img);
                            }}
                            className="absolute top-1.5 left-1.5 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl block mb-2">📷</span>
              No photos found in project bucket.
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#e9ecef] bg-white flex justify-between items-center">
          <span className="text-xs text-gray-500 font-semibold">{selectedIds.size} photo(s) selected</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#dee2e6] text-xs font-semibold text-[#495057] hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSelection}
              disabled={selectedIds.size === 0}
              className="px-5 py-2 rounded-xl bg-accent-500 text-white text-xs font-bold hover:bg-[#96700a] disabled:opacity-50"
            >
              Add Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Standard Annexure Reference Selector (Used in Address / Legal Sections) ───
export function AnnexureRefSelector({
  label,
  annexureEnabled,
  annexureRef,
  annexureRefShowAlso,
  annexures = [],
  isReadOnly = false,
  onToggleEnabled,
  onToggleShowAlso,
  onSelectRef,
  onAutoCreateAnnexure,
  reportRefText = 'Property Address',
}: {
  label: string;
  annexureEnabled?: boolean;
  annexureRef?: string;
  annexureRefShowAlso?: boolean;
  annexures?: Array<{ id: string; label: string; title?: string; [key: string]: any }>;
  isReadOnly?: boolean;
  onToggleEnabled: () => void;
  onToggleShowAlso?: () => void;
  onSelectRef?: (id: string) => void;
  onAutoCreateAnnexure?: () => void;
  reportRefText?: string;
}) {
  const linked = annexures.find(a => a.id === annexureRef) || (annexures.find(a => a.parsedData) || annexures[0]);
  const displayTitle = linked ? (linked.title || `Annexure ${linked.label}`) : 'Annexure';

  return (
    <div className="flex items-center gap-3 flex-wrap justify-end">
      <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wide">Use Annexure</span>
      <button
        type="button"
        disabled={isReadOnly}
        onClick={onToggleEnabled}
        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
          annexureEnabled ? 'bg-accent-500' : 'bg-[#ccc]'
        }`}
        title={annexureEnabled ? 'Disable Annexure' : 'Enable Annexure'}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            annexureEnabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      {annexureEnabled && (
        <>
          <span className="w-px h-4 bg-neutral-200" />
          <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wide">Also show address</span>
          <button
            type="button"
            disabled={isReadOnly}
            onClick={onToggleShowAlso}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              annexureRefShowAlso ? 'bg-emerald-500' : 'bg-[#ccc]'
            }`}
            title={annexureRefShowAlso ? 'Hide address field' : 'Also show address field'}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                annexureRefShowAlso ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </>
      )}
    </div>
  );
}

// ─── Standard Annexure Card & Section (100% Identical to General Report) ─────
export function BaseAnnexureSection({
  annexures = [],
  isReadOnly = false,
  uploading = false,
  onAddAnnexure,
  onRemoveAnnexure,
  onUpdateTitle,
  onUploadExcel,
  onRemoveFile,
  sectionNumber = 12,
  sectionId = 'section-12-annexure',
  title,
}: {
  annexures: Array<{
    id: string;
    label: string;
    title?: string;
    excelFileUrl?: string;
    excelFileName?: string;
    parsedData?: {
      headers: string[];
      rows: string[][];
      allRows?: string[][];
      merges?: { sr: number; sc: number; er: number; ec: number }[];
      colWidths?: number[];
    };
  }>;
  isReadOnly?: boolean;
  uploading?: boolean | string;
  onAddAnnexure: () => void;
  onRemoveAnnexure: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUploadExcel: (id: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: string) => void;
  sectionNumber?: number | string;
  sectionId?: string;
  title?: string;
}) {
  return (
    <Section title={title || "Annexures & Schedules"} number={sectionNumber} id={sectionId} defaultOpen={true}>
      <div className="space-y-4">
        {/* Info banner */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-linear-to-r from-[#0a1628]/5 to-accent-500/5 border border-accent-500/20">
          <svg className="w-5 h-5 text-accent-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-xs text-[#495057]">
            Upload detailed property address schedules, khasra details, or other annexure data in Excel format (.xlsx, .xls, .csv).
          </p>
        </div>

        {/* Annexure Cards */}
        {annexures.map((annexure) => (
          <div key={annexure.id} className="rounded-xl border border-[#dee2e6] overflow-hidden bg-white shadow-xs">
            {/* Annexure header */}
            <div className="flex items-center justify-between px-5 py-3 bg-linear-to-r from-[#162d4a] to-[#1e3a5f]">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg bg-accent-500 flex items-center justify-center text-xs font-bold text-white shadow-xs">
                  {annexure.label}
                </span>
                <span className="text-sm font-semibold text-white">Annexure {annexure.label}</span>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => onRemoveAnnexure(annexure.id)}
                  className="text-red-300 hover:text-red-100 hover:bg-red-500/20 p-1 rounded-lg transition-colors"
                  title="Remove this annexure"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Annexure body */}
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5">
                  Annexure Title / Heading
                </label>
                <input
                  type="text"
                  value={annexure.title || ''}
                  onChange={e => onUpdateTitle(annexure.id, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Schedule of Property Details / Plot List"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5">
                  Excel Spreadsheet Upload
                </label>
                {annexure.excelFileUrl ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
                      <svg className="w-8 h-8 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-800 truncate">{annexure.excelFileName}</p>
                        <a href={annexure.excelFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline inline-flex items-center gap-1">
                          Download / View file ↗
                        </a>
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => onRemoveFile(annexure.id)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    {/* Table Preview */}
                    {annexure.parsedData && annexure.parsedData.rows && annexure.parsedData.rows.length > 0 && (
                      <div className="border border-[#dee2e6] rounded-xl overflow-hidden shadow-xs">
                        <div className="bg-slate-100 px-4 py-2 border-b border-[#dee2e6] flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#1e3a5f] uppercase tracking-wider">Spreadsheet Preview</span>
                          <span className="text-[10px] text-gray-500 font-semibold">{annexure.parsedData.rows.length} rows parsed</span>
                        </div>
                        <div className="overflow-x-auto max-h-64">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className="bg-[#f8f9fa] border-b border-[#dee2e6]">
                                {annexure.parsedData.headers.map((h, hi) => (
                                  <th key={hi} className="px-3 py-2 font-bold text-[#1e3a5f] border-r border-[#dee2e6] last:border-r-0 whitespace-nowrap">
                                    {h || `Col ${hi + 1}`}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {annexure.parsedData.rows.map((row, ri) => (
                                <tr key={ri} className="border-b border-[#eee] hover:bg-slate-50 transition-colors">
                                  {row.map((cell, ci) => (
                                    <td key={ci} className="px-3 py-1.5 border-r border-[#eee] last:border-r-0 text-slate-700 whitespace-nowrap">
                                      {cell}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  !isReadOnly && (
                    <label className="flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed border-accent-500/30 bg-[#fffaf0] cursor-pointer hover:bg-[#fff5e0] hover:border-accent-500/50 transition-all group">
                      <svg className="w-10 h-10 text-accent-500/40 group-hover:text-accent-500/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm font-medium text-accent-500">
                        {uploading ? 'Uploading...' : 'Click to upload Excel file'}
                      </span>
                      <span className="text-[10px] text-[#999]">Supports .xlsx, .xls, .csv (max 10MB)</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                        className="hidden"
                        onChange={e => onUploadExcel(annexure.id, e)}
                        disabled={!!uploading}
                      />
                    </label>
                  )
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Add Annexure button */}
        {!isReadOnly && (
          <button
            type="button"
            onClick={onAddAnnexure}
            className="mt-1 text-sm text-accent-500 hover:text-[#96700a] font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent-500/30 hover:bg-accent-500/10 transition-colors"
          >
            <span className="text-lg leading-none">+</span> Add Annexure
          </button>
        )}
      </div>
    </Section>
  );
}


