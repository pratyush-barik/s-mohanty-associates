'use client';

import React, { useState, useEffect } from 'react';

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
export function formatAssignedEngineers(fieldEmployees?: Array<{ name: string; [key: string]: any }>): string {
  if (!fieldEmployees || !Array.isArray(fieldEmployees) || fieldEmployees.length === 0) {
    return '';
  }
  const names = fieldEmployees.map(e => e.name?.trim()).filter(Boolean);
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

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
    <div className="hidden xl:flex flex-col gap-1 bg-white/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-[#e9ecef] p-2 rounded-2xl w-[160px] sticky top-24 shrink-0 z-40">
      <div className="text-[10px] font-black text-emerald-500 mb-1 px-2 uppercase tracking-widest">Sections</div>
      {sections.map((sec) => {
        const isActive = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            className={`w-full py-1.5 px-3 rounded-full text-center transition-all duration-200 text-xs font-bold my-0.5 ${
              isActive
                ? 'bg-[#b8860b] text-white border border-[#96700a] shadow-md font-extrabold scale-[1.02]'
                : 'bg-indigo-50/90 text-indigo-900 border border-indigo-100/80 shadow-sm hover:bg-indigo-100 hover:border-indigo-200'
            }`}
          >
            <span className="leading-tight truncate block w-full">
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
                className="px-6 py-2.5 rounded-full bg-white border-2 border-[#b8860b] text-[#b8860b] font-bold text-sm hover:bg-amber-50 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading ? '⏳ Saving...' : '💾 Save Draft'}
              </button>
            )}
            {onSubmit && userRole === 'REPORT_EMPLOYEE' && (
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
  onImageNameChange,
  onRemoveImage,
  onReorderImages,
  onUploadImages,
  onOpenBucketPicker,
  sectionNumber = 11,
  sectionId = 'section-11',
  withoutSectionWrapper = false,
}: {
  propertyImages: string[];
  propertyImageNames: string[];
  isReadOnly?: boolean;
  uploading?: boolean;
  bucketCount?: number;
  onImageNameChange: (index: number, name: string) => void;
  onRemoveImage: (index: number) => void;
  onReorderImages?: (newImages: string[], newNames: string[]) => void;
  onUploadImages: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenBucketPicker?: () => void;
  sectionNumber?: number | string;
  sectionId?: string;
  withoutSectionWrapper?: boolean;
}) {
  const validPhotos = propertyImages.filter(Boolean);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (idx: number) => {
    if (isReadOnly) return;
    setDraggedIdx(idx);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (draggedIdx === null || draggedIdx === idx) return;
    setDragOverIdx(idx);
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (targetIdx: number) => {
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const reorderedImages = [...propertyImages];
    const reorderedNames = [...(propertyImageNames || [])];
    while (reorderedNames.length < reorderedImages.length) {
      reorderedNames.push(DEFAULT_PHOTO_LABEL);
    }

    const [movedImg] = reorderedImages.splice(draggedIdx, 1);
    const [movedName] = reorderedNames.splice(draggedIdx, 1);

    reorderedImages.splice(targetIdx, 0, movedImg);
    reorderedNames.splice(targetIdx, 0, movedName);

    setDraggedIdx(null);
    setDragOverIdx(null);

    if (onReorderImages) {
      onReorderImages(reorderedImages, reorderedNames);
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Uploaded Photo Slots Grid: 2 slots per row */}
      {validPhotos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {propertyImages.map((url, idx) => {
            if (!url) return null;
            const currentLabel =
              propertyImageNames?.[idx] !== undefined && propertyImageNames[idx] !== ''
                ? propertyImageNames[idx]
                : DEFAULT_PHOTO_LABEL;

            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx;

            return (
              <div
                key={idx}
                draggable={!isReadOnly}
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(idx)}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`p-4 border rounded-2xl bg-white space-y-3 transition-all duration-200 ${
                  isDragging ? 'opacity-40 scale-[0.98]' : 'opacity-100'
                } ${
                  isDragOver
                    ? 'border-2 border-dashed border-[#b8860b] ring-2 ring-[#b8860b]/20 shadow-md'
                    : 'border-[#dee2e6] shadow-xs hover:border-slate-300'
                }`}
              >
                {/* Header: Drag Handle + Editable Label Input (First order) on Left, Remove Cross on Right */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {!isReadOnly && (
                      <span
                        className="text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing select-none text-base font-bold px-0.5"
                        title="Drag to reorder photograph"
                      >
                        ⠿
                      </span>
                    )}
                    <input
                      type="text"
                      placeholder="Photo Label"
                      value={propertyImageNames?.[idx] !== undefined ? propertyImageNames[idx] : DEFAULT_PHOTO_LABEL}
                      disabled={isReadOnly}
                      onChange={(e) => onImageNameChange(idx, e.target.value)}
                      className="text-xs font-bold text-slate-800 bg-white border border-[#dee2e6] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#b8860b] w-full max-w-sm"
                    />
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onRemoveImage(idx)}
                      className="w-7 h-7 flex items-center justify-center rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-colors text-xs font-bold shrink-0 shadow-2xs cursor-pointer"
                      title="Remove Photo"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Body: Uploaded Photo Preview */}
                <div className="relative rounded-xl overflow-hidden border border-[#dee2e6] bg-slate-100 h-52 flex items-center justify-center cursor-grab active:cursor-grabbing">
                  <img src={url} alt={currentLabel} className="w-full h-full object-cover pointer-events-none" />
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
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
              {uploading ? '⏳ Uploading...' : 'Add Property Images'}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onUploadImages}
                disabled={uploading}
              />
            </label>

            {/* 2. Cloud Storage Bucket Pick */}
            {onOpenBucketPicker && (
              <button
                type="button"
                onClick={onOpenBucketPicker}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e3a5f] text-[#1e3a5f] text-sm font-medium hover:bg-[#1e3a5f]/5 transition-colors cursor-pointer"
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
    <Section title="Photographs" number={sectionNumber} id={sectionId} defaultOpen={false}>
      {content}
    </Section>
  );
}

// ─── Standard Maps & Documents Section (Derived from General) ─────────
export function BaseMapsSection({
  locationMapImage = '',
  latitude = '',
  longitude = '',
  propertyAddress = '',
  sketchMapImages = [],
  mouzaMapImage = '',
  cadastralMapImage = '',
  isReadOnly = false,
  uploading = false,
  bucketCount = 0,
  onLocationMapUpload,
  onLocationMapRemove,
  onSketchMapUpload,
  onSketchMapRemove,
  onMouzaMapUpload,
  onMouzaMapRemove,
  onCadastralMapUpload,
  onCadastralMapRemove,
  onOpenBucketPicker,
  sectionNumber = 10,
  sectionId = 'section-10',
}: {
  locationMapImage?: string;
  latitude?: string;
  longitude?: string;
  propertyAddress?: string;
  sketchMapImages?: string[];
  mouzaMapImage?: string;
  cadastralMapImage?: string;
  isReadOnly?: boolean;
  uploading?: boolean;
  bucketCount?: number;
  onLocationMapUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLocationMapRemove: () => void;
  onSketchMapUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSketchMapRemove: (index: number) => void;
  onMouzaMapUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMouzaMapRemove?: () => void;
  onCadastralMapUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCadastralMapRemove?: () => void;
  onOpenBucketPicker?: (mode: 'sketchMapImages' | 'locationMapImage') => void;
  sectionNumber?: number | string;
  sectionId?: string;
}) {
  const mapQuery = latitude && longitude
    ? `${latitude.trim()},${longitude.trim()}`
    : propertyAddress.trim();
  const encodedQuery = encodeURIComponent(mapQuery);
  const hasQuery = mapQuery.length > 0;
  const googleMapsUrl = latitude && longitude
    ? `https://www.google.com/maps?q=${latitude.trim()},${longitude.trim()}&z=15&t=k`
    : `https://www.google.com/maps/search/${encodedQuery}`;

  return (
    <Section title="Maps & Documents" number={sectionNumber} id={sectionId} defaultOpen={false}>
      <div className="space-y-6">
        {/* 1. Live Google Map Preview */}
        <div>
          <h4 className="text-xs font-bold text-[#495057] uppercase tracking-wider mb-2">Live Map & Location</h4>
          {hasQuery ? (
            <div className="rounded-2xl overflow-hidden border border-[#c8d6e5] shadow-sm">
              <div className="bg-[#d5e8f5] px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider">
                  Live Satellite Preview
                </span>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#b8860b] hover:underline"
                >
                  Open in Google Maps &#x2197;
                </a>
              </div>
              <iframe
                src={`https://maps.google.com/maps?q=${encodedQuery}&t=k&z=16&output=embed`}
                width="100%"
                height="320"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Property Location Map"
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
              Enter Property Address or Coordinates in Section 2 to view live satellite map.
            </div>
          )}
        </div>

        {/* 2. Map Screenshot for PDF */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-[#495057] uppercase tracking-wider">Location Map Screenshot (For PDF)</h4>
          {locationMapImage ? (
            <div className="relative group rounded-xl overflow-hidden border border-[#e9ecef] max-w-md">
              <img src={locationMapImage} alt="Location Map" className="w-full h-44 object-cover" />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={onLocationMapRemove}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                >
                  Remove
                </button>
              )}
            </div>
          ) : (
            !isReadOnly && (
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#b8860b] text-[#b8860b] text-xs font-bold cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                  {uploading ? '⏳ Uploading...' : '📁 Upload Map Screenshot'}
                  <input type="file" accept="image/*" className="hidden" onChange={onLocationMapUpload} disabled={uploading} />
                </label>
                {onOpenBucketPicker && (
                  <button
                    type="button"
                    onClick={() => onOpenBucketPicker('locationMapImage')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#1e3a5f] text-[#1e3a5f] text-xs font-bold hover:bg-[#1e3a5f]/5 transition-colors cursor-pointer"
                  >
                    📁 Pick from Bucket {bucketCount > 0 ? `(${bucketCount})` : ''}
                  </button>
                )}
              </div>
            )
          )}
        </div>

        {/* 3. Sketch Maps */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#495057] uppercase tracking-wider">Sketch Maps</h4>
            {!isReadOnly && (
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#b8860b] text-[#b8860b] text-xs font-bold cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                  {uploading ? '⏳...' : '+ Upload Sketch'}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onSketchMapUpload} disabled={uploading} />
                </label>
                {onOpenBucketPicker && (
                  <button
                    type="button"
                    onClick={() => onOpenBucketPicker('sketchMapImages')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e3a5f] text-[#1e3a5f] text-xs font-bold hover:bg-[#1e3a5f]/5 transition-colors cursor-pointer"
                  >
                    📁 Pick from Bucket {bucketCount > 0 ? `(${bucketCount})` : ''}
                  </button>
                )}
              </div>
            )}
          </div>
          {sketchMapImages.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sketchMapImages.map((url, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#e9ecef] bg-slate-50">
                  <img src={url} alt={`Sketch Map ${idx + 1}`} className="w-full h-36 object-contain" />
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onSketchMapRemove(idx)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-dashed rounded-xl text-center text-xs text-gray-500">
              No sketch maps uploaded yet.
            </div>
          )}
        </div>

        {/* 4. Optional Mouza & Cadastral Maps */}
        {(onMouzaMapUpload || onCadastralMapUpload) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {onMouzaMapUpload && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#495057] uppercase tracking-wider">Mouza Map</h4>
                {mouzaMapImage ? (
                  <div className="relative group rounded-xl overflow-hidden border border-[#e9ecef] bg-slate-50">
                    <img src={mouzaMapImage} alt="Mouza Map" className="w-full h-36 object-contain" />
                    {!isReadOnly && onMouzaMapRemove && (
                      <button
                        type="button"
                        onClick={onMouzaMapRemove}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  !isReadOnly && (
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#b8860b] text-[#b8860b] text-xs font-bold cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                      {uploading ? '⏳...' : '📁 Upload Mouza Map'}
                      <input type="file" accept="image/*" className="hidden" onChange={onMouzaMapUpload} disabled={uploading} />
                    </label>
                  )
                )}
              </div>
            )}

            {onCadastralMapUpload && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-[#495057] uppercase tracking-wider">Cadastral Map</h4>
                {cadastralMapImage ? (
                  <div className="relative group rounded-xl overflow-hidden border border-[#e9ecef] bg-slate-50">
                    <img src={cadastralMapImage} alt="Cadastral Map" className="w-full h-36 object-contain" />
                    {!isReadOnly && onCadastralMapRemove && (
                      <button
                        type="button"
                        onClick={onCadastralMapRemove}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ) : (
                  !isReadOnly && (
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#b8860b] text-[#b8860b] text-xs font-bold cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                      {uploading ? '⏳...' : '📁 Upload Cadastral Map'}
                      <input type="file" accept="image/*" className="hidden" onChange={onCadastralMapUpload} disabled={uploading} />
                    </label>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

// ─── Standard Photo Bucket Picker Modal ───────────────────────────────
export function BasePhotoBucketModal({
  isOpen,
  bucketImages = [],
  mode,
  onClose,
  onConfirm,
  onDeleteImage,
}: {
  isOpen: boolean;
  bucketImages: any[];
  mode: 'propertyImages' | 'sketchMapImages' | 'locationMapImage';
  onClose: () => void;
  onConfirm: (selectedUrls: string[]) => void;
  onDeleteImage?: (img: any) => Promise<void>;
}) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleSelect = (id: string, url: string) => {
    if (mode === 'locationMapImage') {
      onConfirm([url]);
      onClose();
      return;
    }
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
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0f2038] flex items-center gap-2">
              📸 Pick from Photo Bucket
            </h2>
            <p className="text-xs text-[#6c757d] mt-1">
              {mode === 'propertyImages'
                ? 'Select photos to add to the valuation report'
                : 'Select images to add as sketch maps'}
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
                        className="p-4 rounded-xl border border-gray-200 bg-white hover:border-[#b8860b] cursor-pointer shadow-sm"
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
                    className="text-xs font-bold text-[#b8860b] hover:underline mb-2 block"
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
                          isSel ? 'border-[#b8860b] ring-2 ring-[#b8860b]/40 shadow-md' : 'border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        <img src={img.url} alt={img.fileName || 'Bucket image'} className="w-full h-full object-cover" />
                        {isSel && (
                          <div className="absolute top-1.5 right-1.5 bg-[#b8860b] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">
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
              className="px-5 py-2 rounded-xl bg-[#b8860b] text-white text-xs font-bold hover:bg-[#96700a] disabled:opacity-50"
            >
              Add Selected ({selectedIds.size})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


