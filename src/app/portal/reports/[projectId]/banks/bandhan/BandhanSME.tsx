'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import {
  ActiveConfigBanner,
  FloatingNavigator,
  Section,
  Field,
  BaseDateInput,
  BasePhotoBucketModal,
  BasePhotographsSection,
  BaseMapsSection,
  BaseDocumentsSection,
  DEFAULT_PHOTO_LABEL,
  DEFAULT_DOCUMENT_LABEL,
  ReportActionBar,
  NavItem,
  inputCls,
  selectCls,
} from '../BaseBankReportComponents';
import {
  BandhanSMEReportFields,
  BandhanSMEPlotBoundary,
  BandhanSMEFloorDetail,
  BandhanSMEBuildingValuationRow,
  BandhanSMESubScheduleItem,
  BandhanSMEChecklistItem,
  BandhanSMEPhoto,
  PDFBandhanSMERenderer,
  generateBandhanSMEReport,
  generateBandhanSMEReportWithCount,
  convertAreaToSqft,
  parseSqftFromArea,
  parseAreaValueAndUnit,
  formatAreaOfLandStatement,
  formatDateDisplay,
  formatCommencementCompletion,
  getConstructionDetailsForStructure,
  getFloorNameForIndex,
  deriveBuildingStories,
  formatFloorSummaryStatement,
  getStructurePrefix,
  formatAssessmentHoldingStatement,
  formatActualBuiltUpStatement,
  formatCarpetAreaStatement,
  formatSaleableAreaStatement,
  parseNum,
  formatCurrencyINR,
} from '@/lib/banks/pdf-bandhan-sme-renderer';
import { BankConfig } from '@/lib/bank-fields';
import { formatReportDate } from '@/lib/pdf-bank-renderer';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';

export const BANDHAN_SME_CONFIG: BankConfig = {
  bankId: 'BANDHAN BANK',
  subTemplateId: 'SME',
  displayName: 'Bandhan Bank — SME',
  defaultValues: {
    purpose: 'SME / Commercial Valuation',
  },
};

const compressImageFile = (
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<{ dataUrl: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              resolve({ dataUrl, blob: file });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export interface BandhanSMEProps {
  projectId: string;
  projectCode?: string;
  initialFields?: any;
  initialData?: any;
  status?: string;
  userRole?: string;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
  prefill?: any;
  bucketImages?: any[];
}

const NAV_SECTIONS: NavItem[] = [
  // Section I
  { id: '', title: 'Section I', isHeader: true },
  { id: 'sec-basic', title: 'Basic Information' },

  // Section II: Valuation of Land
  { id: '', title: 'Section II', isHeader: true },
  { id: 'sec-prop-details', title: 'Details of Property' },
  { id: 'sec-title-rent', title: 'Title, Ownership & Rent' },
  { id: 'sec-desc-boundaries', title: 'Description & Boundaries' },
  { id: 'sec-site-char', title: 'Characteristics of Site' },
  { id: 'sec-location-adv-disadv', title: 'Location Advantages' },
  { id: 'sec-other-issues', title: 'Other Issues & Points' },
  { id: 'sec-land-valuation', title: 'Valuation' },

  // Section III: Valuation of Building
  { id: '', title: 'Section III', isHeader: true },
  { id: 'sec-bldg-basic', title: 'Basic Information' },
  { id: 'sec-bldg-tech', title: 'Technical Details' },
  { id: 'sec-bldg-specs', title: 'Specifications of Construction' },
  { id: 'sec-bldg-valuation', title: 'Building Valuation Table' },
  { id: 'sec-bldg-subschedules', title: 'Sub-Schedules' },
  { id: 'sec-bldg-abstract-matrix', title: 'Total Abstract Matrix' },

  // Additional Sections
  { id: '', title: 'Additional Sections', isHeader: true },
  { id: 'sec-remarks-opinion', title: 'Remarks & Valuation Certificate' },
  { id: 'sec-declaration', title: 'Declaration & Credentials' },
  { id: 'sec-checklist', title: 'Valuation Checklist' },
  { id: 'sec-documents', title: 'Documents & Maps' },
  { id: 'sec-photos', title: 'Property Photographs' },
];

const sanitizePositiveInt = (val: string, maxLen?: number): string => {
  const digits = val.replace(/[^0-9]/g, '');
  return maxLen ? digits.slice(0, maxLen) : digits;
};

const sanitizePositiveFloat = (val: string): string => {
  let clean = val.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  return clean;
};

const sanitizePercentage = (val: string): string => {
  const clean = sanitizePositiveFloat(val.replace(/%/g, ''));
  if (!clean) return '';
  const num = parseFloat(clean);
  if (num > 100) return '100';
  return clean;
};

const formatCoordinateDms = (coordStr?: string, isLat: boolean = true): string => {
  if (!coordStr) return '';
  const trimmed = coordStr.trim();
  if (!trimmed) return '';

  // If already formatted in DMS (has ° and ' or " or ′ or ″)
  if (trimmed.includes('°') && (trimmed.includes("'") || trimmed.includes('"') || trimmed.includes('′') || trimmed.includes('″'))) {
    return trimmed;
  }

  // Match e.g. "20.312833", "20.312833° N", "20.312833N"
  const match = trimmed.match(/^([+-]?\d+(?:\.\d+)?)\s*°?\s*([NSEW])?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    if (!isNaN(num)) {
      const explicitDir = match[2]?.toUpperCase();
      const defaultHemi = isLat ? (num >= 0 ? 'N' : 'S') : (num >= 0 ? 'E' : 'W');
      const hemi = explicitDir || defaultHemi;
      const absVal = Math.abs(num);
      const deg = Math.floor(absVal);
      const minFull = (absVal - deg) * 60;
      const min = Math.floor(minFull);
      const sec = ((minFull - min) * 60).toFixed(1);
      return `${deg}°${min}'${sec}"${hemi}`;
    }
  }

  const parsed = parseFloat(trimmed);
  if (!isNaN(parsed)) {
    const hemi = isLat ? (parsed >= 0 ? 'N' : 'S') : (parsed >= 0 ? 'E' : 'W');
    const absVal = Math.abs(parsed);
    const deg = Math.floor(absVal);
    const minFull = (absVal - deg) * 60;
    const min = Math.floor(minFull);
    const sec = ((minFull - min) * 60).toFixed(1);
    return `${deg}°${min}'${sec}"${hemi}`;
  }

  return trimmed;
};

const deriveCoordinates = (lat?: string, lng?: string): string => {
  const cleanLat = (lat || '').trim();
  const cleanLng = (lng || '').trim();
  if (!cleanLat && !cleanLng) return '';
  if (cleanLat && cleanLng) {
    const formattedLat = formatCoordinateDms(cleanLat, true);
    const formattedLng = formatCoordinateDms(cleanLng, false);
    return `${formattedLat} ${formattedLng}`;
  }
  return formatCoordinateDms(cleanLat || cleanLng, Boolean(cleanLat));
};

const formatYearCommencementCompletion = (construction?: string, completion?: string): string => {
  const c = (construction || '').trim();
  const comp = (completion || '').trim();
  const parts: string[] = [];
  if (c) parts.push(`Year of Construction- ${c}`);
  if (comp) parts.push(`Year of Completion- ${comp}`);
  return parts.join('                                                     ');
};

const getBenchmarkUnitFactor = (unit?: string): number => {
  switch (unit) {
    case 'ACRE':
      return 43560;
    case 'DECIMAL':
    case 'CENT':
      return 435.6;
    case 'SQFT':
      return 1;
    case 'SQYD':
      return 9;
    case 'SQMT':
      return 10.7639;
    case 'HECTARE':
      return 107639.1;
    case 'GUNTHA':
      return 1089;
    case 'BIGHA':
      return 14400;
    default:
      return 43560;
  }
};

const formatGovtGuidelineStatement = (areaSqft: number, ratePerSqft: number): string => {
  if (areaSqft <= 0 || ratePerSqft <= 0) return '';
  const total = Math.round(areaSqft * ratePerSqft);
  const areaFmt = areaSqft.toFixed(2);
  const rateFmt = ratePerSqft % 1 === 0 ? formatCurrencyINR(ratePerSqft) : ratePerSqft.toFixed(2);
  const totalFmt = formatCurrencyINR(total);
  return `Guideline Value of Land= ${areaFmt} Sft x Rs.${rateFmt}/- Per Sft = Rs.${totalFmt}/-`;
};

const formatMarketValueStatement = (areaSqft: number, ratePerSqft: number): string => {
  if (areaSqft <= 0 || ratePerSqft <= 0) return '';
  const total = Math.round(areaSqft * ratePerSqft);
  const areaFmt = areaSqft.toFixed(2);
  const rateFmt = ratePerSqft % 1 === 0 ? formatCurrencyINR(ratePerSqft) : ratePerSqft.toFixed(2);
  const totalFmt = formatCurrencyINR(total);
  return `Total Market Value of Land: ${areaFmt} Sft x Rs.${rateFmt}/- Per Sft = Rs.${totalFmt}/-`;
};

const renderSelect = (
  value: string | undefined,
  options: string[],
  onChange: (v: string) => void,
  disabled?: boolean,
  defaultVal?: string
) => {
  const current = value !== undefined && value !== '' ? value : (defaultVal || options[0] || '');
  const hasCurrent = options.includes(current);
  return (
    <select
      className={selectCls}
      value={current}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {!hasCurrent && current && <option value={current}>{current}</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
};

function AreaOfLandField({
  label,
  value,
  fieldKey,
  onChange,
  isReadOnly = false,
}: {
  label: string;
  value?: string;
  fieldKey: 'areaLandDoc' | 'areaLandRor' | 'areaLandPhysical';
  onChange: (formatted: string, unit: string, numVal: string) => void;
  isReadOnly?: boolean;
}) {
  const parsed = useMemo(() => parseAreaValueAndUnit(value), [value]);
  const [unit, setUnit] = useState<string>(parsed.unit || 'ACRE_DEC');
  const [numVal, setNumVal] = useState<string>(parsed.value || '');

  useEffect(() => {
    if (value) {
      const p = parseAreaValueAndUnit(value);
      if (p.unit) setUnit(p.unit);
      if (p.value) setNumVal(p.value);
    }
  }, [value]);

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    const res = formatAreaOfLandStatement(newUnit, numVal);
    onChange(numVal ? res.statement : '', newUnit, numVal);
  };

  const handleValueChange = (newVal: string) => {
    const clean = sanitizePositiveFloat(newVal);
    setNumVal(clean);
    const res = formatAreaOfLandStatement(unit, clean);
    onChange(clean ? res.statement : '', unit, clean);
  };

  const currentFormatted = useMemo(() => {
    if (numVal && numVal.trim()) return formatAreaOfLandStatement(unit, numVal).statement;
    if (value && value.trim()) return value;
    return '';
  }, [value, unit, numVal]);

  const unitInputLabel = useMemo(() => {
    switch (unit) {
      case 'ACRE_DEC':
        return 'Area in Acre:';
      case 'DECIMAL':
        return 'Area in Decimal:';
      case 'SQFT':
        return 'Area in Sq.Ft:';
      case 'SQYD':
        return 'Area in Sq.Yards:';
      case 'SQMT':
        return 'Area in Sq.Meters:';
      case 'GUNTHA':
        return 'Area in Guntha:';
      default:
        return 'Area:';
    }
  }, [unit]);

  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
      <label className="text-xs font-bold text-slate-800 tracking-wide block">{label}</label>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-3">
          <span className="text-[11px] font-medium text-slate-600 block mb-1">Choose Unit:</span>
          <select
            className={selectCls}
            value={unit}
            onChange={(e) => handleUnitChange(e.target.value)}
            disabled={isReadOnly}
          >
            <option value="ACRE_DEC">Acre (Ac. ... Dec)</option>
            <option value="DECIMAL">Decimal (Dec)</option>
            <option value="SQFT">Sq.Ft (Sft)</option>
            <option value="SQYD">Sq.Yards (Sq.Yds)</option>
            <option value="SQMT">Sq.Meters (Sq.Mtr)</option>
            <option value="GUNTHA">Guntha</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <span className="text-[11px] font-medium text-slate-600 block mb-1">{unitInputLabel}</span>
          <input
            type="text"
            className={inputCls}
            value={numVal}
            onChange={(e) => handleValueChange(e.target.value)}
            disabled={isReadOnly}
          />
        </div>

        <div className="sm:col-span-6">
          <span className="text-[11px] font-medium text-slate-600 block mb-1">Converted Value (Read-Only):</span>
          <input
            type="text"
            className={inputCls + ' bg-slate-100/90 text-slate-800 font-medium cursor-default select-all'}
            value={currentFormatted || ''}
            readOnly
            disabled={isReadOnly}
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}

function ExtentOfLandField({
  label,
  subLabel = '(Referred from E. Area of Land - Title Deed, Editable)',
  value,
  inheritedUnit = 'ACRE_DEC',
  onChange,
  isReadOnly = false,
}: {
  label: string;
  subLabel?: string;
  value?: string;
  inheritedUnit?: string;
  onChange: (formatted: string) => void;
  isReadOnly?: boolean;
}) {
  const activeUnit = inheritedUnit || 'ACRE_DEC';
  const parsed = useMemo(() => parseAreaValueAndUnit(value, activeUnit), [value, activeUnit]);
  const [numVal, setNumVal] = useState<string>(parsed.value || '');

  useEffect(() => {
    if (value) {
      const p = parseAreaValueAndUnit(value, activeUnit);
      setNumVal(p.value);
    } else {
      setNumVal('');
    }
  }, [value, activeUnit]);

  const handleValChange = (newVal: string) => {
    const clean = sanitizePositiveFloat(newVal);
    setNumVal(clean);
    if (!clean) {
      onChange('');
    } else {
      const res = formatAreaOfLandStatement(activeUnit, clean);
      onChange(res.statement);
    }
  };

  const unitInputLabel = useMemo(() => {
    switch (activeUnit) {
      case 'ACRE_DEC':
        return 'Area in Acre:';
      case 'DECIMAL':
        return 'Area in Decimal:';
      case 'SQFT':
        return 'Area in Sq.Ft:';
      case 'SQYD':
        return 'Area in Sq.Yards:';
      case 'SQMT':
        return 'Area in Sq.Meters:';
      case 'GUNTHA':
        return 'Area in Guntha:';
      default:
        return 'Area:';
    }
  }, [activeUnit]);

  const convertedSqftDisplay = useMemo(() => {
    if (!numVal || !numVal.trim()) return '';
    const res = formatAreaOfLandStatement(activeUnit, numVal);
    return res.sqftStr || (res.sqft > 0 ? `${res.sqft} Sft` : '');
  }, [activeUnit, numVal]);

  return (
    <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-1">
        <label className="text-xs font-semibold text-slate-800">{label}</label>
        {subLabel && <span className="text-[11px] text-slate-500 font-normal italic">{subLabel}</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
        <div>
          <span className="text-[11px] font-medium text-slate-600 block mb-1">{unitInputLabel}</span>
          <input
            type="text"
            className={inputCls}
            value={numVal}
            onChange={(e) => handleValChange(e.target.value)}
            disabled={isReadOnly}
          />
        </div>
        <div>
          <span className="text-[11px] font-medium text-slate-600 block mb-1">Converted Value (Sq.Ft):</span>
          <input
            type="text"
            className={inputCls + ' bg-slate-100/90 text-slate-800 font-medium cursor-default select-all'}
            value={convertedSqftDisplay || ''}
            readOnly
            disabled={isReadOnly}
            tabIndex={-1}
          />
        </div>
      </div>
    </div>
  );
}

function BulletListField({
  label,
  value,
  onChange,
  placeholder = '',
  isReadOnly = false,
}: {
  label: string;
  value?: string;
  onChange: (val: string) => void;
  placeholder?: string;
  isReadOnly?: boolean;
}) {
  const parseBullets = (raw?: string): string[] => {
    if (!raw || !raw.trim()) return [''];
    const lines = raw
      .split('\n')
      .map((l) => l.replace(/^[•\-\*]\s*/, '').trim())
      .filter((l) => l.length > 0);
    return lines.length > 0 ? lines : [''];
  };

  const [items, setItems] = useState<string[]>(() => parseBullets(value));

  useEffect(() => {
    const parsed = parseBullets(value);
    setItems(parsed);
  }, [value]);

  const updateItem = (index: number, text: string) => {
    const updated = [...items];
    updated[index] = text;
    setItems(updated);
    const formatted = updated
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('•') ? t : `• ${t}`))
      .join('\n');
    onChange(formatted);
  };

  const addItem = () => {
    const updated = [...items, ''];
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      setItems(['']);
      onChange('');
      return;
    }
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    const formatted = updated
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((t) => (t.startsWith('•') ? t : `• ${t}`))
      .join('\n');
    onChange(formatted);
  };

  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-800">{label}</label>
        {!isReadOnly && (
          <button
            type="button"
            onClick={addItem}
            className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
          >
            + Add Bullet
          </button>
        )}
      </div>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span className="text-emerald-600 font-bold text-sm select-none">•</span>
            <input
              type="text"
              className={inputCls + ' flex-1 bg-white'}
              value={item}
              onChange={(e) => updateItem(idx, e.target.value)}
              placeholder={placeholder}
              disabled={isReadOnly}
            />
            {!isReadOnly && items.length > 1 && (
              <button
                type="button"
                onClick={() => removeItem(idx)}
                className="text-slate-400 hover:text-red-600 text-xs font-bold px-1.5 py-1 rounded hover:bg-red-50 cursor-pointer"
                title="Remove bullet"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function BandhanSME({
  projectId,
  projectCode,
  initialFields,
  initialData,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  onResetWizard,
  prefill,
  bucketImages = [],
}: BandhanSMEProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');

  // Default Ref No
  const defaultRefNo = useMemo(() => {
    const id = projectCode || projectId || '';
    return id ? (id.toLowerCase().startsWith('bandhan/') ? id : `Bandhan/${id}`) : '';
  }, [projectCode, projectId]);

  // ── Find First Field Engineer Visit Date (Earliest Visit Date) ──
  const firstFieldAgentVisit = useMemo(() => {
    if (bucketImages && bucketImages.length > 0) {
      const validImages = [...bucketImages]
        .filter(img => img.createdAt)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (validImages.length > 0) {
        return {
          dateStr: formatReportDate(validImages[0].createdAt),
          rawDate: validImages[0].createdAt,
          agentName: validImages[0].employee?.name || prefill?.firstFieldAgentName || '',
          agentId: validImages[0].employee?.employeeId || '',
        };
      }
    }
    const fallbackDate = prefill?.fieldVisitDate || prefill?.inspectionDate;
    if (fallbackDate) {
      return {
        dateStr: formatReportDate(fallbackDate),
        rawDate: fallbackDate,
        agentName: prefill?.firstFieldAgentName || prefill?.fieldEmployees?.[0]?.name || '',
        agentId: prefill?.fieldEmployees?.[0]?.employeeId || '',
      };
    }
    return null;
  }, [bucketImages, prefill]);

  // State initialization with clean defaults and project prefill
  const [fields, setFields] = useState<BandhanSMEReportFields>(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : (initialData?.reportFields || initialData || {});

    const defaultPlots: BandhanSMEPlotBoundary[] = Array.isArray(raw.documentPlotBoundaries) && raw.documentPlotBoundaries.length > 0
      ? raw.documentPlotBoundaries.map((dp: BandhanSMEPlotBoundary, i: number) => ({
          ...dp,
          plotNo: dp.plotNo ? dp.plotNo.replace(/^Plot No:\s*/i, '') : `Schedule ${i + 1}`,
        }))
      : [
          { plotNo: raw.plotNo ? raw.plotNo.replace(/^Plot No:\s*/i, '') : 'Schedule 1', east: '', west: '', north: '', south: '' },
        ];

    const defaultPhysPlots: BandhanSMEPlotBoundary[] = Array.isArray(raw.physicalPlotBoundaries) && raw.physicalPlotBoundaries.length > 0
      ? raw.physicalPlotBoundaries
      : defaultPlots.map((dp, idx) => ({
          plotNo: dp.plotNo || `Schedule ${idx + 1}`,
          east: idx === 0 ? (raw.verifiedBoundaryEast || '') : '',
          west: idx === 0 ? (raw.verifiedBoundaryWest || '') : '',
          north: idx === 0 ? (raw.verifiedBoundaryNorth || '') : '',
          south: idx === 0 ? (raw.verifiedBoundarySouth || '') : '',
        }));

    const defaultBldgRows: BandhanSMEBuildingValuationRow[] = Array.isArray(raw.buildingValuationRows) && raw.buildingValuationRows.length > 0
      ? raw.buildingValuationRows
      : [
          {
            description: 'RESIDENTIAL & COMMERCIAL BUILDING',
            plinthArea: '',
            height: '',
            age: '',
            replacementRate: '',
            replacementCost: '',
            depreciation: '',
            valueAfterDepreciation: '',
          },
        ];

    const defaultChecklist: BandhanSMEChecklistItem[] = Array.isArray(raw.checklist) && raw.checklist.length > 0
      ? raw.checklist
      : [
          { pointNo: 1, question: 'Full names of all property owners are mentioned. Address of the property is mentioned and is same as latest title deed', answer: 'Yes' },
          { pointNo: 2, question: 'Boundaries of the property are mentioned as per both, title deed and actual observations', answer: 'Yes' },
          { pointNo: 3, question: 'Clearly mentioned that property has been identified by the valuer on his own based on the address', answer: 'Yes' },
          { pointNo: 4, question: 'Type of property is clearly mentioned (amongst agricultural, residential, commercial, industrial etc.)', answer: 'Yes' },
          { pointNo: 5, question: 'If land, clearly mentioned whether the land is land locked plot or independent land', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
          { pointNo: 6, question: 'If vacant land, clearly mentioned that proper demarcation and fencing has been done', answer: 'Yes' },
          { pointNo: 7, question: 'If building, clearly mentioned that construction has been done according to the building plan approval', subText: '(If not, deviation should be clearly specified)', answer: 'No' },
          { pointNo: 8, question: 'If building, clearly mentioned that building use / completion certificate has been obtained from competent authority', answer: 'No' },
          { pointNo: 9, question: 'Clearly mentioned whether access to the property is available', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
          { pointNo: 10, question: 'Basis for arriving at government value has been mentioned and necessary documents have been enclosed', answer: 'Yes' },
        ];

    // Parse branch details from raw data if branchDetails not explicitly stored
    let branchDetails = raw.branchDetails || '';
    let branchName = raw.branchName || '';
    if (!branchDetails && branchName) {
      branchDetails = branchName.replace(/^The\s+Bandhan\s+Bank,?\s*|^Bandhan\s+Bank,?\s*/i, '').trim();
    }
    if (!branchName) {
      branchName = branchDetails ? `Bandhan Bank, ${branchDetails}` : 'Bandhan Bank';
    }

    // Parse letter no and date from raw data if not explicitly set
    let bankLetterNo = raw.bankLetterNo || '';
    let bankLetterDate = raw.bankLetterDate ? formatReportDate(raw.bankLetterDate) : '';
    let letterNoAndDate = raw.letterNoAndDate || '';
    if (!bankLetterNo && !bankLetterDate && letterNoAndDate) {
      const dtMatch = letterNoAndDate.match(/^(.*?)(?:\s*(?:Dt\.?|Date:?|\/|,|-)\s*)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})$/i);
      if (dtMatch) {
        bankLetterNo = dtMatch[1].trim();
        bankLetterDate = formatReportDate(dtMatch[2].trim());
      } else {
        bankLetterNo = letterNoAndDate;
      }
    }
    if (!letterNoAndDate) {
      letterNoAndDate = [bankLetterNo, bankLetterDate ? `Dt. ${bankLetterDate}` : ''].filter(Boolean).join(' ');
    }

    const landAreaUnit = raw.landAreaUnit || 'ACRE_DEC';
    const landAreaValue = (() => {
      if (raw.landAreaValue !== undefined && raw.landAreaValue !== '') return raw.landAreaValue;
      const rawSrc = raw.extentOfSite || raw.areaLandDoc || raw.landAreaTotal || '';
      if (!rawSrc) return '';
      const s = String(rawSrc).trim();
      const acMatch = s.match(/AC\.(\d+(?:\.\d+)?)/i);
      if (acMatch && acMatch[1]) return acMatch[1];
      const parenMatch = s.match(/\((\d+(?:\.\d+)?)\s*(?:Decs|Sq\.Yds|Sq\.Mtr|Guntha|Acre|Decimal)/i);
      if (parenMatch && parenMatch[1]) return parenMatch[1];
      const sqftMatch = s.match(/^([\d,]+(?:\.\d+)?)\s*sqft/i);
      if (sqftMatch && sqftMatch[1]) return sqftMatch[1].replace(/,/g, '');
      if (/^\d+(?:\.\d+)?$/.test(s)) return s;
      return '';
    })();

    const defaultInitFloors: BandhanSMEFloorDetail[] = Array.isArray(raw.floorDetails)
      ? raw.floorDetails
      : [
          { floorName: 'Ground Floor', height: raw.floorHeightGF || "10'-6\"", plinthArea: raw.plinthAreaGF || '', doorsWindows: raw.doorsWindowsGF || 'Iron Shutter', flooring: raw.flooringGF || 'VT Flooring', wallFinishing: raw.wallFinishingGF || 'Cement Plastering, Putty, Painting' },
          { floorName: 'First Floor', height: raw.floorHeightFF || 'Do', plinthArea: raw.plinthAreaFF || '', doorsWindows: raw.doorsWindowsFF || 'Sal wood choukath with non sal wood shutter', flooring: raw.flooringFF || 'Do', wallFinishing: raw.wallFinishingFF || 'Do' },
          { floorName: 'Second Floor', height: raw.floorHeightSF || 'Do', plinthArea: raw.plinthAreaSF || '', doorsWindows: raw.doorsWindowsSF || 'Do', flooring: raw.flooringSF || 'Do', wallFinishing: raw.wallFinishingSF || 'Do' },
          { floorName: 'Third Floor', height: raw.floorHeightTF || 'Do', plinthArea: raw.plinthAreaTF || '', doorsWindows: raw.doorsWindowsTF || 'Do', flooring: raw.flooringTF || 'Do', wallFinishing: raw.wallFinishingTF || 'Do' },
        ];

    const initialStories = raw.buildingStoriesDescription !== undefined
      ? raw.buildingStoriesDescription
      : deriveBuildingStories(defaultInitFloors);

    const initialStdHeight = raw.buildingStandardHeight !== undefined
      ? raw.buildingStandardHeight
      : (raw.floorHeightGF || defaultInitFloors[0]?.height || "10'-6\"");

    const initialSummaryStmt = raw.numberOfFloorsAndHeight !== undefined
      ? raw.numberOfFloorsAndHeight
      : formatFloorSummaryStatement(initialStories, initialStdHeight);

    return {
      ...raw,
      clientType: raw.clientType || 'organisation',
      institutionCategory: raw.institutionCategory || 'Bank & FIS',
      organisationTemplate: raw.organisationTemplate || 'BANDHAN BANK',
      organisationSubTemplate: raw.organisationSubTemplate || 'SME',
      bankName: raw.bankName || 'BANDHAN BANK',
      serviceType: raw.serviceType || prefill?.purpose || undefined,
      subjectType: raw.subjectType || prefill?.propertyType || undefined,
      reworkNotes: raw.reworkNotes || '',

      // Header
      refNo: raw.refNo !== undefined ? raw.refNo : defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || new Date()),

      // Section I: Basic Information (A - M)
      branchDetails,
      branchName,
      bankLetterNo,
      bankLetterDate,
      letterNoAndDate,
      valuationMadeAtBorrowerRequest: raw.valuationMadeAtBorrowerRequest || 'No',
      managerAccompanied: raw.managerAccompanied !== undefined ? raw.managerAccompanied : '',
      valuationType: raw.valuationType || 'Fresh Valuation',
      dateOfEarlierValuation: raw.dateOfEarlierValuation !== undefined ? raw.dateOfEarlierValuation : '',
      previousValuerName: raw.previousValuerName !== undefined ? raw.previousValuerName : '',
      dateOfVisit: raw.dateOfVisit
        ? formatReportDate(raw.dateOfVisit)
        : (firstFieldAgentVisit?.dateStr || (prefill?.fieldVisitDate ? formatReportDate(prefill.fieldVisitDate) : (prefill?.inspectionDate ? formatReportDate(prefill.inspectionDate) : formatReportDate(new Date())))),
      dateOfValuation: raw.dateOfValuation ? formatReportDate(raw.dateOfValuation) : (raw.reportDate ? formatReportDate(raw.reportDate) : formatReportDate(new Date())),
      personsPresent: raw.personsPresent !== undefined
        ? (typeof raw.personsPresent === 'string' ? raw.personsPresent.replace(/,\s*Mob-?\s*$/, '').trim() : raw.personsPresent)
        : (prefill?.contactName
            ? (prefill?.serviceRequest?.guestPhone?.trim() ? `${prefill.contactName}, Mob- ${prefill.serviceRequest.guestPhone.trim()}` : prefill.contactName)
            : ''),
      documentsProduced: raw.documentsProduced !== undefined ? raw.documentsProduced : '',

      // Borrower Details (L)
      borrowerName: raw.borrowerName !== undefined ? raw.borrowerName : (prefill?.serviceRequest?.guestName || prefill?.contactName || ''),
      borrowerAt: raw.borrowerAt !== undefined ? raw.borrowerAt : (prefill?.propertyAddress || ''),
      borrowerPo: raw.borrowerPo !== undefined ? raw.borrowerPo : '',
      borrowerPs: raw.borrowerPs !== undefined ? raw.borrowerPs : '',
      borrowerDist: raw.borrowerDist !== undefined ? raw.borrowerDist : (prefill?.serviceRequest?.city || ''),
      borrowerPhone: raw.borrowerPhone !== undefined ? raw.borrowerPhone : (prefill?.serviceRequest?.guestPhone || ''),
      borrowerNatureOfBusiness: raw.borrowerNatureOfBusiness !== undefined ? raw.borrowerNatureOfBusiness : '',

      // Owner Details (M)
      ownerName: raw.ownerName !== undefined ? raw.ownerName : (prefill?.contactName || ''),
      ownerAt: raw.ownerAt !== undefined ? raw.ownerAt : (prefill?.propertyAddress || ''),
      ownerPo: raw.ownerPo !== undefined ? raw.ownerPo : '',
      ownerPs: raw.ownerPs !== undefined ? raw.ownerPs : '',
      ownerPin: raw.ownerPin !== undefined ? raw.ownerPin : (prefill?.serviceRequest?.pincode || ''),
      ownerDist: raw.ownerDist !== undefined ? raw.ownerDist : (prefill?.serviceRequest?.city || ''),
      ownerPhone: raw.ownerPhone !== undefined ? raw.ownerPhone : (prefill?.serviceRequest?.guestPhone || ''),
      ownerFatherName: raw.ownerFatherName !== undefined ? raw.ownerFatherName : '',

      // Section II: Valuation of Land
      // 1. Details of Property (A - L, I)
      detailsPropertyOffered: raw.detailsPropertyOffered !== undefined ? raw.detailsPropertyOffered : 'Land & Building',
      dateAcquisitionLand: raw.dateAcquisitionLand ? formatReportDate(raw.dateAcquisitionLand) : '',
      valueAsPerSaleDeed: raw.valueAsPerSaleDeed !== undefined ? raw.valueAsPerSaleDeed : '',
      saleDeedDocNo: raw.saleDeedDocNo !== undefined ? raw.saleDeedDocNo : '',
      landAreaUnit,
      landAreaValue,
      landAreaSqft: raw.landAreaSqft !== undefined ? raw.landAreaSqft : '',
      areaLandDoc: raw.areaLandDoc !== undefined ? raw.areaLandDoc : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),
      areaLandRor: raw.areaLandRor !== undefined ? raw.areaLandRor : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),
      areaLandPhysical: raw.areaLandPhysical !== undefined ? raw.areaLandPhysical : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),

      // Location of Property & Postal Address (H)
      plotNo: raw.plotNo !== undefined ? raw.plotNo : '',
      khataNo: raw.khataNo !== undefined ? raw.khataNo : '',
      propAt: raw.propAt !== undefined ? raw.propAt : (prefill?.propertyAddress || ''),
      propPo: raw.propPo !== undefined ? raw.propPo : '',
      propPs: raw.propPs !== undefined ? raw.propPs : '',
      propPin: raw.propPin !== undefined ? raw.propPin : (prefill?.serviceRequest?.pincode || ''),
      propDist: raw.propDist !== undefined ? raw.propDist : (prefill?.serviceRequest?.city || ''),

      urbanSemiUrbanRural: raw.urbanSemiUrbanRural !== undefined ? raw.urbanSemiUrbanRural : 'Urban Area',
      situatedAreaType: raw.situatedAreaType !== undefined ? raw.situatedAreaType : 'Residential cum Commercial Area',
      classificationOfLocality: raw.classificationOfLocality !== undefined ? raw.classificationOfLocality : 'Middle Class',
      typeOfProperty: raw.typeOfProperty !== undefined ? raw.typeOfProperty : 'Land & building',
      isAgricultural: raw.isAgricultural !== undefined ? raw.isAgricultural : 'No',
      agriculturalConversionContemplated: raw.agriculturalConversionContemplated !== undefined ? raw.agriculturalConversionContemplated : 'Not Applicable',
      isIndustrial: raw.isIndustrial !== undefined ? raw.isIndustrial : 'No',
      industrialActivitySuited: raw.industrialActivitySuited !== undefined ? raw.industrialActivitySuited : 'Not Applicable',
      isResidential: raw.isResidential !== undefined ? raw.isResidential : 'Yes',
      isCommercial: raw.isCommercial !== undefined ? raw.isCommercial : 'Yes',
      isInstitutional: raw.isInstitutional !== undefined ? raw.isInstitutional : 'No',
      isOthersSpecify: raw.isOthersSpecify !== undefined ? raw.isOthersSpecify : 'No',

      // 2.1 Title of Property Freehold / Leasehold
      titleFreeholdLeasehold: raw.titleFreeholdLeasehold !== undefined ? raw.titleFreeholdLeasehold : 'It is a free hold land',
      ownershipOfProperty: raw.ownershipOfProperty !== undefined ? raw.ownershipOfProperty : 'Single Ownership',
      jointOwnershipShare: raw.jointOwnershipShare !== undefined ? raw.jointOwnershipShare : 'Not Applicable',
      taxesPaidUpTo: raw.taxesPaidUpTo !== undefined ? raw.taxesPaidUpTo : 'We have not verified any recent rent receipt',
      landRevenue: raw.landRevenue !== undefined ? raw.landRevenue : 'We have not verified any recent rent receipt',
      landBuildingMunicipalTaxes: raw.landBuildingMunicipalTaxes !== undefined ? raw.landBuildingMunicipalTaxes : 'We have not verified any recent rent receipt',
      wealthTaxAssessedPaid: raw.wealthTaxAssessedPaid !== undefined ? raw.wealthTaxAssessedPaid : 'Not Applicable',

      // 2.2 If Leasehold
      isLeaseholdApplicable: raw.isLeaseholdApplicable !== undefined ? raw.isLeaseholdApplicable : 'No',
      lessorName: raw.lessorName !== undefined ? raw.lessorName : 'Not Applicable',
      lesseeName: raw.lesseeName !== undefined ? raw.lesseeName : 'Not Applicable',
      natureOfLease: raw.natureOfLease !== undefined ? raw.natureOfLease : 'Not Applicable',
      dateCommencementLease: raw.dateCommencementLease !== undefined ? raw.dateCommencementLease : 'Not Applicable',
      periodOfLease: raw.periodOfLease !== undefined ? raw.periodOfLease : 'Not Applicable',
      termsOfRenewal: raw.termsOfRenewal !== undefined ? raw.termsOfRenewal : 'Not Applicable',
      leasePremiumRentPerAnnum: raw.leasePremiumRentPerAnnum !== undefined ? raw.leasePremiumRentPerAnnum : 'Not Applicable',
      unexpiredPeriodOfLease: raw.unexpiredPeriodOfLease !== undefined ? raw.unexpiredPeriodOfLease : 'Not Applicable',
      initialPremium: raw.initialPremium !== undefined ? raw.initialPremium : 'Not Applicable',
      groundRentPerAnnum: raw.groundRentPerAnnum !== undefined ? raw.groundRentPerAnnum : 'Not Applicable',
      unearnedIncreasePayable: raw.unearnedIncreasePayable !== undefined ? raw.unearnedIncreasePayable : 'Not Applicable',
      leasePermitsMortgage: raw.leasePermitsMortgage !== undefined ? raw.leasePermitsMortgage : 'Not Applicable',

      // 2. Rent Details
      rentOccupationStatus: raw.rentOccupationStatus !== undefined ? raw.rentOccupationStatus : 'The Plot is occupied by Owner',
      tenantNames: raw.tenantNames !== undefined ? raw.tenantNames : 'Not Applicable',
      tenantPortionOccupied: raw.tenantPortionOccupied !== undefined ? raw.tenantPortionOccupied : 'Not Applicable',
      monthlyAnnualRentPaid: raw.monthlyAnnualRentPaid !== undefined ? raw.monthlyAnnualRentPaid : 'Not Applicable',
      grossRentReceived: raw.grossRentReceived !== undefined ? raw.grossRentReceived : 'Not Applicable',

      // 3. Brief Description of Property
      detailedAddressWithPin: raw.detailedAddressWithPin !== undefined ? raw.detailedAddressWithPin : (prefill?.propertyAddress || ''),
      municipalityWardNo: raw.municipalityWardNo !== undefined ? raw.municipalityWardNo : '',
      streetNo: raw.streetNo !== undefined ? raw.streetNo : '',
      surveyPlotNo: raw.surveyPlotNo !== undefined ? raw.surveyPlotNo : (raw.plotNo || ''),
      briefKhataNo: raw.briefKhataNo !== undefined ? raw.briefKhataNo : (raw.khataNo || ''),
      mouza: raw.mouza !== undefined ? raw.mouza : '',
      thanaNo: raw.thanaNo !== undefined ? raw.thanaNo : '',
      tehasilNo: raw.tehasilNo !== undefined ? raw.tehasilNo : '',
      tehasil: raw.tehasil !== undefined ? raw.tehasil : '',
      sro: raw.sro !== undefined ? raw.sro : '',
      policeStation: raw.policeStation !== undefined ? raw.policeStation : '',
      villageTownCity: raw.villageTownCity !== undefined ? raw.villageTownCity : 'City',
      district: raw.district !== undefined ? raw.district : (prefill?.serviceRequest?.city || ''),
      state: raw.state !== undefined ? raw.state : 'Odisha',

      dimensionDocEastWest: raw.dimensionDocEastWest !== undefined ? raw.dimensionDocEastWest : '',
      dimensionDocNorthSouth: raw.dimensionDocNorthSouth !== undefined ? raw.dimensionDocNorthSouth : '',
      dimensionMeasEastWest: raw.dimensionMeasEastWest !== undefined ? raw.dimensionMeasEastWest : '',
      dimensionMeasNorthSouth: raw.dimensionMeasNorthSouth !== undefined ? raw.dimensionMeasNorthSouth : '',
      extentOfSite: raw.extentOfSite !== undefined ? raw.extentOfSite : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),
      extentConsideredValuation: raw.extentConsideredValuation !== undefined ? raw.extentConsideredValuation : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),

      documentPlotBoundaries: defaultPlots,
      physicalPlotBoundaries: defaultPhysPlots,
      verifiedBoundaryEast: raw.verifiedBoundaryEast !== undefined ? raw.verifiedBoundaryEast : '',
      verifiedBoundaryWest: raw.verifiedBoundaryWest !== undefined ? raw.verifiedBoundaryWest : '',
      verifiedBoundaryNorth: raw.verifiedBoundaryNorth !== undefined ? raw.verifiedBoundaryNorth : '',
      verifiedBoundarySouth: raw.verifiedBoundarySouth !== undefined ? raw.verifiedBoundarySouth : '',
      sketchEnclosed: raw.sketchEnclosed !== undefined ? raw.sketchEnclosed : 'Yes, Enclosed',

      // 4. Characteristics of the Site
      levelOfLand: raw.levelOfLand !== undefined ? raw.levelOfLand : 'Leveled and Plain',
      useToWhichCanBePut: raw.useToWhichCanBePut !== undefined ? raw.useToWhichCanBePut : 'Residential cum Commercial Purpose',
      easementAgreements: raw.easementAgreements !== undefined ? raw.easementAgreements : 'No such agreement verified',
      restrictiveCovenant: raw.restrictiveCovenant !== undefined ? raw.restrictiveCovenant : 'No',
      approvalLetterNoDateDevelopment: raw.approvalLetterNoDateDevelopment !== undefined ? raw.approvalLetterNoDateDevelopment : 'Not Applicable',
      buildingUseCertificateObtained: raw.buildingUseCertificateObtained !== undefined ? raw.buildingUseCertificateObtained : 'Not Applicable',
      townPlanningSchemeInclusion: raw.townPlanningSchemeInclusion !== undefined ? raw.townPlanningSchemeInclusion : '',
      cornerOrIntermittentPlot: raw.cornerOrIntermittentPlot !== undefined ? raw.cornerOrIntermittentPlot : 'Intermittent Plot',
      isLandLocked: raw.isLandLocked !== undefined ? raw.isLandLocked : 'No',
      hasFreeAccess: raw.hasFreeAccess !== undefined ? raw.hasFreeAccess : (raw.freeAccessAndProximity ? raw.freeAccessAndProximity.split('/')[0]?.trim() : 'Yes (15 ft wide CC Road)'),
      surfaceCommunicationProximity: raw.surfaceCommunicationProximity !== undefined ? raw.surfaceCommunicationProximity : (raw.freeAccessAndProximity && raw.freeAccessAndProximity.includes('/') ? raw.freeAccessAndProximity.split('/').slice(1).join('/').trim() : (raw.freeAccessAndProximity || 'Bike, Car, Auto, Bus')),
      freeAccessAndProximity: raw.freeAccessAndProximity !== undefined ? raw.freeAccessAndProximity : '',
      roadFacilities: raw.roadFacilities !== undefined ? raw.roadFacilities : 'Yes, Available at site',
      roadKindAndWidth: raw.roadKindAndWidth !== undefined ? raw.roadKindAndWidth : '15 ft wide BT Road',
      distMunicipalLimitStatus: raw.distMunicipalLimitStatus !== undefined ? raw.distMunicipalLimitStatus : (raw.distMunicipalLimitNotWithin !== undefined ? raw.distMunicipalLimitNotWithin : ''),
      distMunicipalOffice: raw.distMunicipalOffice !== undefined ? raw.distMunicipalOffice : '',
      distMunicipalLimits: raw.distMunicipalLimits !== undefined ? raw.distMunicipalLimits : '',
      waterPotentialities: raw.waterPotentialities !== undefined ? raw.waterPotentialities : '',
      possibilityFlooding: raw.possibilityFlooding !== undefined ? raw.possibilityFlooding : 'No',
      undergroundSewerageAvailable: raw.undergroundSewerageAvailable !== undefined ? raw.undergroundSewerageAvailable : 'No',
      drainageSystemsAvailable: raw.drainageSystemsAvailable !== undefined ? raw.drainageSystemsAvailable : '',
      powerSupplyAvailable: raw.powerSupplyAvailable !== undefined ? raw.powerSupplyAvailable : 'Yes',
      surroundingDevelopment: raw.surroundingDevelopment !== undefined ? raw.surroundingDevelopment : '',

      proximitySchool: raw.proximitySchool !== undefined ? raw.proximitySchool : '',
      proximityCollege: raw.proximityCollege !== undefined ? raw.proximityCollege : '',
      proximityHospital: raw.proximityHospital !== undefined ? raw.proximityHospital : '',
      proximityMarket: raw.proximityMarket !== undefined ? raw.proximityMarket : '',
      proximityBusStand: raw.proximityBusStand !== undefined ? raw.proximityBusStand : '',
      proximityRailwayStation: raw.proximityRailwayStation !== undefined ? raw.proximityRailwayStation : '',
      proximityOtherPlace: raw.proximityOtherPlace !== undefined ? raw.proximityOtherPlace : '',
      latitude: raw.latitude !== undefined
        ? raw.latitude
        : (prefill?.serviceRequest?.latitude || (raw.latitudeLongitude ? (raw.latitudeLongitude.match(/([\d.]+)\s*°?\s*N?/i)?.[1] || '') : '')),
      longitude: raw.longitude !== undefined
        ? raw.longitude
        : (prefill?.serviceRequest?.longitude || (raw.latitudeLongitude ? (raw.latitudeLongitude.match(/([\d.]+)\s*°?\s*E?/i)?.[1] || '') : '')),
      latitudeLongitude: raw.latitudeLongitude !== undefined && raw.latitudeLongitude !== ''
        ? raw.latitudeLongitude
        : deriveCoordinates(
            raw.latitude || prefill?.serviceRequest?.latitude,
            raw.longitude || prefill?.serviceRequest?.longitude
          ),
      locationAdvantages: raw.locationAdvantages !== undefined ? raw.locationAdvantages : '',
      locationDisadvantages: raw.locationDisadvantages !== undefined ? raw.locationDisadvantages : 'Nothing Observed',

      // 5. Other Issues / Points
      landAcquisitionNotification: raw.landAcquisitionNotification !== undefined ? raw.landAcquisitionNotification : 'No such documents verified',
      developmentContributionDemanded: raw.developmentContributionDemanded !== undefined ? raw.developmentContributionDemanded : 'No such documents verified',
      landCeilingEnactments: raw.landCeilingEnactments !== undefined ? raw.landCeilingEnactments : 'No such documents verified',
      salesInstancesInLocality: raw.salesInstancesInLocality !== undefined ? raw.salesInstancesInLocality : 'Transactions of the property are not available in the locality',
      salesBasisArrivingLandRate: raw.salesBasisArrivingLandRate !== undefined ? raw.salesBasisArrivingLandRate : '',
      adoptedLandRateRationale: raw.adoptedLandRateRationale !== undefined ? raw.adoptedLandRateRationale : '',

      // 6. Valuation of Land
      previousValuationDetails: raw.previousValuationDetails !== undefined ? raw.previousValuationDetails : 'Not Available',
      presentValuationApproachDetails: raw.presentValuationApproachDetails !== undefined ? raw.presentValuationApproachDetails : 'Land & Building Method has been adopted for valuation purpose.',
      landAreaTotal: raw.landAreaTotal !== undefined ? raw.landAreaTotal : (raw.areaLandDoc || (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : '')),
      landGovtBenchmarkUnit: raw.landGovtBenchmarkUnit !== undefined ? raw.landGovtBenchmarkUnit : 'ACRE',
      landGovtBenchmarkValue: raw.landGovtBenchmarkValue !== undefined ? raw.landGovtBenchmarkValue : (raw.landGovtBenchmarkPerAcre !== undefined ? raw.landGovtBenchmarkPerAcre : ''),
      landGovtBenchmarkPerAcre: raw.landGovtBenchmarkPerAcre !== undefined ? raw.landGovtBenchmarkPerAcre : '',
      landGovtBenchmarkRate: raw.landGovtBenchmarkRate !== undefined ? raw.landGovtBenchmarkRate : '',
      landGovtValueTotal: raw.landGovtValueTotal !== undefined ? raw.landGovtValueTotal : '',
      landMarketUnit: raw.landMarketUnit !== undefined ? raw.landMarketUnit : 'SQFT',
      landMarketRateInput: raw.landMarketRateInput !== undefined ? raw.landMarketRateInput : (raw.landMarketRate !== undefined ? raw.landMarketRate : ''),
      landMarketRate: raw.landMarketRate !== undefined ? raw.landMarketRate : '',
      landMarketValueTotal: raw.landMarketValueTotal !== undefined ? raw.landMarketValueTotal : '',
      landDistressValue: raw.landDistressValue !== undefined ? raw.landDistressValue : '',
      landRealisableValue: raw.landRealisableValue !== undefined ? raw.landRealisableValue : '',
      distressSalePct: raw.distressSalePct !== undefined ? String(raw.distressSalePct) : '85',
      realisableValuePct: raw.realisableValuePct !== undefined ? String(raw.realisableValuePct) : '95',

      // Valuation of Building
      // 1. Basic Info
      buildingType: raw.buildingType !== undefined ? raw.buildingType : 'Residential Cum Commercial',
      yearConstruction: raw.yearConstruction !== undefined
        ? raw.yearConstruction
        : (raw.yearCommencementCompletion ? (raw.yearCommencementCompletion.match(/Construction[-\s:]*(\d{4})/i)?.[1] || '') : ''),
      yearCompletion: raw.yearCompletion !== undefined
        ? raw.yearCompletion
        : (raw.yearCommencementCompletion ? (raw.yearCommencementCompletion.match(/Completion[-\s:]*(\d{4})/i)?.[1] || '') : ''),
      yearCommencementCompletion: raw.yearCommencementCompletion !== undefined
        ? raw.yearCommencementCompletion
        : formatYearCommencementCompletion(
            raw.yearConstruction || (raw.yearCommencementCompletion ? raw.yearCommencementCompletion.match(/Construction[-\s:]*(\d{4})/i)?.[1] : ''),
            raw.yearCompletion || (raw.yearCommencementCompletion ? raw.yearCommencementCompletion.match(/Completion[-\s:]*(\d{4})/i)?.[1] : '')
          ),
      typeOfConstruction: raw.typeOfConstruction !== undefined ? raw.typeOfConstruction : 'RCC Frames',
      estimatedFutureLife: raw.estimatedFutureLife !== undefined ? sanitizePositiveInt(raw.estimatedFutureLife, 3) : '60',
      farFsiPermissibleUtilized: raw.farFsiPermissibleUtilized !== undefined ? raw.farFsiPermissibleUtilized : '',
      buildingApprovalAuthorityDetails: raw.buildingApprovalAuthorityDetails !== undefined ? raw.buildingApprovalAuthorityDetails : '',
      constructionAsPerPlanDeviations: raw.constructionAsPerPlanDeviations !== undefined ? raw.constructionAsPerPlanDeviations : 'Yes',

      // 1.H Built up Area
      assessmentResidentialArea: raw.assessmentResidentialArea !== undefined
        ? raw.assessmentResidentialArea
        : (raw.builtUpAreaAssessmentHolding?.match(/Residential[^\d]*([\d,]+(?:\.\d+)?)/i)?.[1]?.replace(/,/g, '') || ''),
      assessmentCommercialArea: raw.assessmentCommercialArea !== undefined
        ? raw.assessmentCommercialArea
        : (raw.builtUpAreaAssessmentHolding?.match(/Commercial[^\d]*([\d,]+(?:\.\d+)?)/i)?.[1]?.replace(/,/g, '') || ''),
      builtUpAreaAssessmentHolding: raw.builtUpAreaAssessmentHolding !== undefined
        ? raw.builtUpAreaAssessmentHolding
        : formatAssessmentHoldingStatement(
            raw.assessmentResidentialArea || raw.builtUpAreaAssessmentHolding?.match(/Residential[^\d]*([\d,]+(?:\.\d+)?)/i)?.[1],
            raw.assessmentCommercialArea || raw.builtUpAreaAssessmentHolding?.match(/Commercial[^\d]*([\d,]+(?:\.\d+)?)/i)?.[1]
          ),
      builtUpAreaAsPerActual: raw.builtUpAreaAsPerActual !== undefined
        ? raw.builtUpAreaAsPerActual
        : formatActualBuiltUpStatement(defaultInitFloors, raw.typeOfConstruction || 'RCC Frames'),
      carpetAreaValue: raw.carpetAreaValue !== undefined
        ? raw.carpetAreaValue
        : (raw.carpetAreaTotal ? (raw.carpetAreaTotal.match(/([\d,]+(?:\.\d+)?)/)?.[1]?.replace(/,/g, '') || raw.carpetAreaTotal) : ''),
      carpetAreaTotal: raw.carpetAreaTotal !== undefined
        ? raw.carpetAreaTotal
        : formatCarpetAreaStatement(
            raw.carpetAreaValue || (raw.carpetAreaTotal ? raw.carpetAreaTotal.match(/([\d,]+(?:\.\d+)?)/)?.[1] : '')
          ),
      saleableAreaValue: raw.saleableAreaValue !== undefined
        ? raw.saleableAreaValue
        : (raw.saleableAreaTotal ? (raw.saleableAreaTotal.match(/([\d,]+(?:\.\d+)?)/)?.[1]?.replace(/,/g, '') || raw.saleableAreaTotal) : ''),
      saleableAreaTotal: raw.saleableAreaTotal !== undefined
        ? raw.saleableAreaTotal
        : formatSaleableAreaStatement(
            raw.saleableAreaValue || (raw.saleableAreaTotal ? raw.saleableAreaTotal.match(/([\d,]+(?:\.\d+)?)/)?.[1] : '')
          ),

      buildingOwnerOccupiedTenanted: raw.buildingOwnerOccupiedTenanted !== undefined ? raw.buildingOwnerOccupiedTenanted : 'Owner Occupied',
      ownerOccupiedPortion: raw.ownerOccupiedPortion !== undefined ? raw.ownerOccupiedPortion : 'Not Applicable',
      isUnderRentControlAct: raw.isUnderRentControlAct !== undefined ? raw.isUnderRentControlAct : 'No',
      buildingTenantNames: raw.buildingTenantNames !== undefined ? raw.buildingTenantNames : 'Not Applicable',
      buildingTenantPortions: raw.buildingTenantPortions !== undefined ? raw.buildingTenantPortions : 'Not Applicable',
      buildingMonthlyRent: raw.buildingMonthlyRent !== undefined ? raw.buildingMonthlyRent : 'Not Applicable',
      buildingGrossRent: raw.buildingGrossRent !== undefined ? raw.buildingGrossRent : 'Not Applicable',
      occupantsRelatedToOwner: raw.occupantsRelatedToOwner !== undefined ? raw.occupantsRelatedToOwner : 'Not Applicable',
      fixturesAmountRecovered: raw.fixturesAmountRecovered !== undefined ? raw.fixturesAmountRecovered : 'Borne by Owner',
      waterElectricityChargesBorneBy: raw.waterElectricityChargesBorneBy !== undefined ? raw.waterElectricityChargesBorneBy : 'Borne by Owner',
      isRentDisputePendingCourt: raw.isRentDisputePendingCourt !== undefined ? raw.isRentDisputePendingCourt : 'No',
      hasStandardRentFixed: raw.hasStandardRentFixed !== undefined ? raw.hasStandardRentFixed : 'Not Applicable',
      tenantBearMaintenance: raw.tenantBearMaintenance !== undefined ? raw.tenantBearMaintenance : 'Not Applicable',
      liftMaintenanceBorneBy: raw.liftMaintenanceBorneBy !== undefined ? raw.liftMaintenanceBorneBy : 'Not Applicable',
      pumpMaintenanceBorneBy: raw.pumpMaintenanceBorneBy !== undefined ? raw.pumpMaintenanceBorneBy : 'Borne by Owner',
      commonElectricityBorneBy: raw.commonElectricityBorneBy !== undefined ? raw.commonElectricityBorneBy : 'Borne by Owner',
      propertyTaxAmountBorneBy: raw.propertyTaxAmountBorneBy !== undefined ? raw.propertyTaxAmountBorneBy : 'No such document is verified',
      isBuildingInsuredDetails: raw.isBuildingInsuredDetails !== undefined ? raw.isBuildingInsuredDetails : 'No such document is verified',
      buildingFreeAccess: raw.buildingFreeAccess !== undefined ? raw.buildingFreeAccess : 'Yes',

      // 2. Technical Details
      buildingStoriesDescription: initialStories,
      buildingStandardHeight: initialStdHeight,
      numberOfFloorsAndHeight: initialSummaryStmt,
      floorDetails: defaultInitFloors,
      floorHeightGF: raw.floorHeightGF !== undefined ? raw.floorHeightGF : '',
      floorHeightFF: raw.floorHeightFF !== undefined ? raw.floorHeightFF : '',
      floorHeightSF: raw.floorHeightSF !== undefined ? raw.floorHeightSF : '',
      floorHeightTF: raw.floorHeightTF !== undefined ? raw.floorHeightTF : '',
      plinthAreaGF: raw.plinthAreaGF !== undefined ? raw.plinthAreaGF : '',
      plinthAreaFF: raw.plinthAreaFF !== undefined ? raw.plinthAreaFF : '',
      plinthAreaSF: raw.plinthAreaSF !== undefined ? raw.plinthAreaSF : '',
      plinthAreaTF: raw.plinthAreaTF !== undefined ? raw.plinthAreaTF : '',
      buildingConditionExterior: raw.buildingConditionExterior !== undefined ? raw.buildingConditionExterior : 'Good',
      buildingConditionInterior: raw.buildingConditionInterior !== undefined ? raw.buildingConditionInterior : 'Good',
      foundationType: raw.foundationType !== undefined ? raw.foundationType : 'Column Foundation',
      doorsWindowsGF: raw.doorsWindowsGF !== undefined ? raw.doorsWindowsGF : '',
      doorsWindowsFF: raw.doorsWindowsFF !== undefined ? raw.doorsWindowsFF : '',
      doorsWindowsSF: raw.doorsWindowsSF !== undefined ? raw.doorsWindowsSF : '',
      doorsWindowsTF: raw.doorsWindowsTF !== undefined ? raw.doorsWindowsTF : '',
      flooringGF: raw.flooringGF !== undefined ? raw.flooringGF : '',
      flooringFF: raw.flooringFF !== undefined ? raw.flooringFF : '',
      flooringSF: raw.flooringSF !== undefined ? raw.flooringSF : '',
      flooringTF: raw.flooringTF !== undefined ? raw.flooringTF : '',
      wallFinishingGF: raw.wallFinishingGF !== undefined ? raw.wallFinishingGF : '',
      wallFinishingFF: raw.wallFinishingFF !== undefined ? raw.wallFinishingFF : '',
      wallFinishingSF: raw.wallFinishingSF !== undefined ? raw.wallFinishingSF : '',
      wallFinishingTF: raw.wallFinishingTF !== undefined ? raw.wallFinishingTF : '',

      // 3. Construction Specifications
      specFoundation: raw.specFoundation !== undefined ? raw.specFoundation : 'Column Foundation',
      specBasement: raw.specBasement !== undefined ? raw.specBasement : 'No',
      specSuperstructure: raw.specSuperstructure !== undefined ? raw.specSuperstructure : 'Brick Masonry Super Structure',
      specJoineryDoorsWindows: raw.specJoineryDoorsWindows !== undefined ? raw.specJoineryDoorsWindows : 'Sal wood choukath with shutter',
      specRccWorks: raw.specRccWorks !== undefined ? raw.specRccWorks : 'Lintel, Chajja, Beam',
      specPlastering: raw.specPlastering !== undefined ? raw.specPlastering : 'Cement Plastering',
      specFlooringSkirting: raw.specFlooringSkirting !== undefined ? raw.specFlooringSkirting : '',
      specSpecialFinishing: raw.specSpecialFinishing !== undefined ? raw.specSpecialFinishing : 'Yes',
      specRoofing: raw.specRoofing !== undefined ? raw.specRoofing : 'RCC Roof',
      specDrainage: raw.specDrainage !== undefined ? raw.specDrainage : 'Surface Drainage',
      specDecorativeFeatures: raw.specDecorativeFeatures !== undefined ? raw.specDecorativeFeatures : '',
      specInternalWiring: raw.specInternalWiring !== undefined ? raw.specInternalWiring : 'Concealed',
      specWiringFittingsClass: raw.specWiringFittingsClass !== undefined ? raw.specWiringFittingsClass : 'Superior',
      specElectricalPoints: raw.specElectricalPoints !== undefined ? raw.specElectricalPoints : '',
      specEarthingMcb: raw.specEarthingMcb !== undefined ? raw.specEarthingMcb : 'Provided with MCB & Copper Earthing',
      specSanitaryInstallation: raw.specSanitaryInstallation !== undefined ? raw.specSanitaryInstallation : 'Yes',
      specNoOfGeysers: raw.specNoOfGeysers !== undefined ? raw.specNoOfGeysers : 'Not Verified',
      specSanitaryFittingsClass: raw.specSanitaryFittingsClass !== undefined ? raw.specSanitaryFittingsClass : 'Superior',
      specCompoundWall: raw.specCompoundWall !== undefined ? raw.specCompoundWall : 'Yes',
      specCompoundWallHeightLength: raw.specCompoundWallHeightLength !== undefined ? raw.specCompoundWallHeightLength : "Height: 5'-0\", Length: 150'-0\"",
      specCompoundWallType: raw.specCompoundWallType !== undefined ? raw.specCompoundWallType : 'Brick Masonry Wall with Iron Gate',
      specLiftsCapacity: raw.specLiftsCapacity !== undefined ? raw.specLiftsCapacity : 'No',
      specUndergroundSump: raw.specUndergroundSump !== undefined ? raw.specUndergroundSump : 'Not Available',
      specOverheadTank: raw.specOverheadTank !== undefined ? raw.specOverheadTank : 'Yes',
      specOverheadTankLocation: raw.specOverheadTankLocation !== undefined ? raw.specOverheadTankLocation : 'On the top of the roof',
      specOverheadTankCapacity: raw.specOverheadTankCapacity !== undefined ? raw.specOverheadTankCapacity : '2000 Liters',
      specPumpsHp: raw.specPumpsHp !== undefined ? raw.specPumpsHp : '1 Nos & 1 HP Pump',
      specRoadsPavingCompound: raw.specRoadsPavingCompound !== undefined ? raw.specRoadsPavingCompound : 'No',
      specSewageDisposal: raw.specSewageDisposal !== undefined ? raw.specSewageDisposal : 'Connected to Public Sewers',
      specQualityClassConstruction: raw.specQualityClassConstruction !== undefined ? raw.specQualityClassConstruction : 'Good',
      specWaterSupply: raw.specWaterSupply !== undefined ? raw.specWaterSupply : 'Borewell with Submersible Pump',
      specVentilationLighting: raw.specVentilationLighting !== undefined ? raw.specVentilationLighting : 'Good / Adequate',
      specFireSafetyArrangements: raw.specFireSafetyArrangements !== undefined ? raw.specFireSafetyArrangements : 'Not Applicable (Low Rise Building)',

      // 4. Details of Building Valuation Table
      buildingValuationRows: defaultBldgRows,

      // 5. Sub-Schedules
      isExtraItemsNA: false,
      extraItems: Array.isArray(raw.extraItems) ? raw.extraItems : [
        { name: 'Portico', cost: '' },
        { name: 'Ornamental Front Door', cost: '' },
        { name: 'Sit Out / Verandah with Steel Grills', cost: '' },
        { name: 'Overhead Water Tank', cost: '' },
        { name: 'Extra Steel / Collapsible Gates', cost: '' },
      ],
      extraItemsTotal: raw.extraItemsTotal !== undefined ? raw.extraItemsTotal : 'Rs. 0.00',

      isAmenitiesNA: false,
      amenities: Array.isArray(raw.amenities) ? raw.amenities : [
        { name: 'Wardrobes', cost: '' },
        { name: 'Glazed Tiles', cost: '' },
        { name: 'Extra Sinks and Bath Tub', cost: '' },
        { name: 'Marble / Ceramic Tiles Flooring', cost: '' },
        { name: 'Interior Decorations', cost: '' },
        { name: 'Architectural Elevation Works', cost: '' },
        { name: 'Paneling Works', cost: '' },
        { name: 'Aluminium Works', cost: '' },
        { name: 'Aluminium Hand Rails', cost: '' },
        { name: 'False Ceiling', cost: '' },
      ],
      amenitiesTotal: raw.amenitiesTotal !== undefined ? raw.amenitiesTotal : 'Rs. 0.00',

      isMiscNA: false,
      miscItems: Array.isArray(raw.miscItems) ? raw.miscItems : [
        { name: 'Separate Toilet Room', cost: '' },
        { name: 'Separate Lumber Room', cost: '' },
        { name: 'Separate Water Tank / Sump', cost: '' },
        { name: 'Trees, Gardening', cost: '' },
      ],
      miscItemsTotal: raw.miscItemsTotal !== undefined ? raw.miscItemsTotal : 'Rs. 0.00',

      isServicesNA: false,
      servicesItems: Array.isArray(raw.servicesItems) ? raw.servicesItems : [
        { name: 'Water Supply Arrangement', cost: '' },
        { name: 'Drainage Arrangement', cost: '' },
        { name: 'Compound Wall', cost: '' },
        { name: 'C.B Deposit, Fitting etc.', cost: '' },
        { name: 'Pavement', cost: '' },
      ],
      servicesItemsTotal: raw.servicesItemsTotal !== undefined ? raw.servicesItemsTotal : 'Rs. 0.00',

      // 6.0 Total Abstract of Entire Property
      abstractGovtLand: raw.abstractGovtLand !== undefined ? raw.abstractGovtLand : '',
      abstractMarketLand: raw.abstractMarketLand !== undefined ? raw.abstractMarketLand : '',
      abstractRealLand: raw.abstractRealLand !== undefined ? raw.abstractRealLand : '',
      abstractDistressLand: raw.abstractDistressLand !== undefined ? raw.abstractDistressLand : '',

      abstractGovtBuilding: raw.abstractGovtBuilding !== undefined ? raw.abstractGovtBuilding : 'Rs. 0.00',
      abstractMarketBuilding: raw.abstractMarketBuilding !== undefined ? raw.abstractMarketBuilding : '',
      abstractRealBuilding: raw.abstractRealBuilding !== undefined ? raw.abstractRealBuilding : '',
      abstractDistressBuilding: raw.abstractDistressBuilding !== undefined ? raw.abstractDistressBuilding : '',

      abstractGovtExtra: raw.abstractGovtExtra !== undefined ? raw.abstractGovtExtra : 'Rs. 0.00',
      abstractMarketExtra: raw.abstractMarketExtra !== undefined ? raw.abstractMarketExtra : 'Rs. 0.00',
      abstractRealExtra: raw.abstractRealExtra !== undefined ? raw.abstractRealExtra : 'Rs. 0.00',
      abstractDistressExtra: raw.abstractDistressExtra !== undefined ? raw.abstractDistressExtra : 'Rs. 0.00',

      abstractGovtAmenities: raw.abstractGovtAmenities !== undefined ? raw.abstractGovtAmenities : 'Rs. 0.00',
      abstractMarketAmenities: raw.abstractMarketAmenities !== undefined ? raw.abstractMarketAmenities : 'Rs. 0.00',
      abstractRealAmenities: raw.abstractRealAmenities !== undefined ? raw.abstractRealAmenities : 'Rs. 0.00',
      abstractDistressAmenities: raw.abstractDistressAmenities !== undefined ? raw.abstractDistressAmenities : 'Rs. 0.00',

      abstractGovtMisc: raw.abstractGovtMisc !== undefined ? raw.abstractGovtMisc : 'Rs. 0.00',
      abstractMarketMisc: raw.abstractMarketMisc !== undefined ? raw.abstractMarketMisc : 'Rs. 0.00',
      abstractRealMisc: raw.abstractRealMisc !== undefined ? raw.abstractRealMisc : 'Rs. 0.00',
      abstractDistressMisc: raw.abstractDistressMisc !== undefined ? raw.abstractDistressMisc : 'Rs. 0.00',

      abstractGovtServices: raw.abstractGovtServices !== undefined ? raw.abstractGovtServices : 'Rs. 0.00',
      abstractMarketServices: raw.abstractMarketServices !== undefined ? raw.abstractMarketServices : 'Rs. 0.00',
      abstractRealServices: raw.abstractRealServices !== undefined ? raw.abstractRealServices : 'Rs. 0.00',
      abstractDistressServices: raw.abstractDistressServices !== undefined ? raw.abstractDistressServices : 'Rs. 0.00',

      abstractGovtTotal: raw.abstractGovtTotal !== undefined ? raw.abstractGovtTotal : '',
      abstractMarketTotal: raw.abstractMarketTotal !== undefined ? raw.abstractMarketTotal : '',
      abstractRealTotal: raw.abstractRealTotal !== undefined ? raw.abstractRealTotal : '',
      abstractDistressTotal: raw.abstractDistressTotal !== undefined ? raw.abstractDistressTotal : '',

      abstractGovtSay: raw.abstractGovtSay !== undefined ? raw.abstractGovtSay : '',
      abstractMarketSay: raw.abstractMarketSay !== undefined ? raw.abstractMarketSay : '',
      abstractRealSay: raw.abstractRealSay !== undefined ? raw.abstractRealSay : '',
      abstractDistressSay: raw.abstractDistressSay !== undefined ? raw.abstractDistressSay : '',

      // Remarks, Basis & Valuation Opinion
      valuationRemarksBox: raw.valuationRemarksBox !== undefined ? raw.valuationRemarksBox : '',
      basisOfValuationStatement: raw.basisOfValuationStatement !== undefined ? raw.basisOfValuationStatement : '(LAND & BUILDING METHOD OF VALUATION HAS BEEN ADOPTED FOR FINDING THE FAIR MARKET VALUE OF THE PROPERTY)',
      fairMarketValue: raw.fairMarketValue !== undefined ? raw.fairMarketValue : '',
      fairMarketValueWords: raw.fairMarketValueWords !== undefined ? raw.fairMarketValueWords : '',
      realisableValue: raw.realisableValue !== undefined ? raw.realisableValue : '',
      realisableValueWords: raw.realisableValueWords !== undefined ? raw.realisableValueWords : '',
      bookValueOfLand: raw.bookValueOfLand !== undefined ? raw.bookValueOfLand : '',
      bookValueOfLandWords: raw.bookValueOfLandWords !== undefined ? raw.bookValueOfLandWords : '',
      distressValue: raw.distressValue !== undefined ? raw.distressValue : '',
      distressValueWords: raw.distressValueWords !== undefined ? raw.distressValueWords : '',
      insurableValueOfProperty: raw.insurableValueOfProperty !== undefined ? raw.insurableValueOfProperty : '',
      insurableValueOfPropertyWords: raw.insurableValueOfPropertyWords !== undefined ? raw.insurableValueOfPropertyWords : '',

      // Declaration & Sign-off
      declarationItems: raw.declarationItems || [],
      reportPagesCount: raw.reportPagesCountLocked ? (raw.reportPagesCount || '') : '',
      reportPagesCountLocked: Boolean(raw.reportPagesCountLocked),
      siteEngineerName: raw.siteEngineerName !== undefined ? raw.siteEngineerName : 'MR. SIBA BEHERA',
      empanelledValuerName: raw.empanelledValuerName !== undefined ? raw.empanelledValuerName : 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)',
      valuerQualifications: (!raw.valuerQualifications || raw.valuerQualifications === 'B.Tech (Civil), M.Val (RE)' || raw.valuerQualifications.includes('B.Tech (Civil)'))
        ? 'B.E. (Civil), M.Tech (Civil), M.Sc. (Real Estate Valuation), MBA (Finance), MBA (HR)'
        : raw.valuerQualifications,
      valuerIovRegNo: raw.valuerIovRegNo !== undefined ? raw.valuerIovRegNo : 'No. F-26377',
      valuerWealthTaxRegNo: raw.valuerWealthTaxRegNo !== undefined ? raw.valuerWealthTaxRegNo : 'Regd. No.-107/2016-17, Cat -I',
      declarationDate: raw.declarationDate || formatReportDate(new Date()),

      // Checklist
      checklist: defaultChecklist,

      // Enclosures
      rorImageUrl: raw.rorImageUrl || '',
      locationMapImageUrl: raw.locationMapImageUrl || '',
      bhuNakshaImageUrl: raw.bhuNakshaImageUrl || '',
      guidelineValueImageUrl: raw.guidelineValueImageUrl || '',
      propertyPhotos: Array.isArray(raw.propertyPhotos) ? raw.propertyPhotos : [],
    };
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [previewedPageCount, setPreviewedPageCount] = useState<number | null>(null);
  const isInitialMount = useRef(true);
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-Save Draft Effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isReadOnly) return;

    setAutoSaveStatus('saving');

    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);

    debouncedTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res && 'error' in res && res.error) {
          console.error('Autosave error:', res.error);
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (e) {
        console.error('Autosave network error:', e);
        setAutoSaveStatus('error');
      }
    }, 800);

    return () => {
      if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReadOnly) return;
      try {
        navigator.sendBeacon('/api/save-draft', JSON.stringify({ projectId, fields }));
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  // Field change handler
  const handleChange = useCallback((field: keyof BandhanSMEReportFields, value: any) => {
    setFields((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'reportDate') {
        if (!prev.dateOfValuation || prev.dateOfValuation === prev.reportDate) {
          next.dateOfValuation = value;
        }
        if (!prev.declarationDate || prev.declarationDate === prev.reportDate) {
          next.declarationDate = value;
        }
      }
      return next;
    });
  }, []);

  const handleAreaFieldChange = useCallback(
    (fieldKey: 'areaLandDoc' | 'areaLandRor' | 'areaLandPhysical', formatted: string, unit: string, numVal: string) => {
      const sqft = convertAreaToSqft(unit, numVal).sqft;
      setFields((prev) => {
        const next = {
          ...prev,
          [fieldKey]: formatted,
          landAreaUnit: unit,
          landAreaValue: numVal || prev.landAreaValue,
        };
        if (fieldKey === 'areaLandDoc' || !prev.extentOfSite) {
          next.extentOfSite = formatted;
          next.extentConsideredValuation = formatted;
          next.landAreaTotal = formatted;
          if (sqft > 0) {
            next.landAreaSqft = `${sqft} Sft`;
          }
        }
        return next;
      });
    },
    []
  );

  // Multi-Plot Boundary Handlers
  const handleAddPlotBoundary = () => {
    const nextIdx = (fields.documentPlotBoundaries?.length || 0) + 1;
    const defaultTitle = `Schedule ${nextIdx}`;
    setFields((prev) => {
      const docPlots = [...(prev.documentPlotBoundaries || [])];
      const physPlots = [...(prev.physicalPlotBoundaries || [])];
      docPlots.push({ plotNo: defaultTitle, east: '', west: '', north: '', south: '' });
      physPlots.push({ plotNo: defaultTitle, east: '', west: '', north: '', south: '' });
      return {
        ...prev,
        documentPlotBoundaries: docPlots,
        physicalPlotBoundaries: physPlots,
      };
    });
  };

  const handleRemovePlotBoundary = (index: number) => {
    setFields((prev) => ({
      ...prev,
      documentPlotBoundaries: prev.documentPlotBoundaries?.filter((_, i) => i !== index),
      physicalPlotBoundaries: prev.physicalPlotBoundaries?.filter((_, i) => i !== index),
    }));
  };

  const handleDocumentPlotBoundaryChange = (index: number, key: keyof BandhanSMEPlotBoundary, val: string) => {
    setFields((prev) => {
      const docUpdated = [...(prev.documentPlotBoundaries || [])];
      docUpdated[index] = { ...docUpdated[index], [key]: val };

      const physUpdated = [...(prev.physicalPlotBoundaries || [])];
      if (key === 'plotNo' && physUpdated[index]) {
        physUpdated[index] = { ...physUpdated[index], plotNo: val };
      }

      return {
        ...prev,
        documentPlotBoundaries: docUpdated,
        physicalPlotBoundaries: physUpdated.length > 0 ? physUpdated : undefined,
      };
    });
  };

  const handlePhysicalPlotBoundaryChange = (index: number, key: keyof BandhanSMEPlotBoundary, val: string) => {
    setFields((prev) => {
      const docPlots = prev.documentPlotBoundaries || [];
      const physUpdated = [...(prev.physicalPlotBoundaries || [])];
      while (physUpdated.length < docPlots.length) {
        const i = physUpdated.length;
        physUpdated.push({
          plotNo: docPlots[i]?.plotNo || `Schedule ${i + 1}`,
          east: i === 0 ? (prev.verifiedBoundaryEast || '') : '',
          west: i === 0 ? (prev.verifiedBoundaryWest || '') : '',
          north: i === 0 ? (prev.verifiedBoundaryNorth || '') : '',
          south: i === 0 ? (prev.verifiedBoundarySouth || '') : '',
        });
      }
      physUpdated[index] = { ...physUpdated[index], [key]: val };

      const legacySync: Partial<BandhanSMEReportFields> = {};
      if (index === 0) {
        if (key === 'east') legacySync.verifiedBoundaryEast = val;
        if (key === 'west') legacySync.verifiedBoundaryWest = val;
        if (key === 'north') legacySync.verifiedBoundaryNorth = val;
        if (key === 'south') legacySync.verifiedBoundarySouth = val;
      }

      return {
        ...prev,
        ...legacySync,
        physicalPlotBoundaries: physUpdated,
      };
    });
  };

  // Floor Details Handlers (Points A, B, E, F, G)
  const handleAddFloorDetail = () => {
    setFields((prev) => {
      const current = prev.floorDetails || [];
      const newFloorIdx = current.length;
      const defaultName = getFloorNameForIndex(newFloorIdx);
      const lastFloor = current[current.length - 1];
      const newHeight = newFloorIdx === 0 ? (prev.buildingStandardHeight || "10'-6\"") : (lastFloor?.height || 'Do');
      const newFloor: BandhanSMEFloorDetail = {
        floorName: defaultName,
        height: newHeight,
        plinthArea: '',
        doorsWindows: newFloorIdx === 0 ? 'Iron Shutter' : (lastFloor?.doorsWindows || 'Do'),
        flooring: newFloorIdx === 0 ? 'VT Flooring' : (lastFloor?.flooring || 'Do'),
        wallFinishing: newFloorIdx === 0 ? 'Cement Plastering, Putty, Painting' : (lastFloor?.wallFinishing || 'Do'),
      };
      const updatedFloors = [...current, newFloor];
      const derivedStories = deriveBuildingStories(updatedFloors);
      const standardHeight = prev.buildingStandardHeight || (updatedFloors[0]?.height || "10'-6\"");
      const summaryStmt = formatFloorSummaryStatement(derivedStories, standardHeight);
      const actualStmt = formatActualBuiltUpStatement(updatedFloors, prev.typeOfConstruction);

      return {
        ...prev,
        floorDetails: updatedFloors,
        buildingStoriesDescription: derivedStories,
        buildingStandardHeight: standardHeight,
        numberOfFloorsAndHeight: summaryStmt,
        builtUpAreaAsPerActual: actualStmt,
      };
    });
  };

  const handleRemoveFloorDetail = (index: number) => {
    setFields((prev) => {
      const current = prev.floorDetails || [];
      const updatedFloors = current.filter((_, idx) => idx !== index);
      const derivedStories = deriveBuildingStories(updatedFloors);
      const standardHeight = prev.buildingStandardHeight || (updatedFloors[0]?.height || "10'-6\"");
      const summaryStmt = updatedFloors.length > 0 ? formatFloorSummaryStatement(derivedStories, standardHeight) : '';
      const actualStmt = formatActualBuiltUpStatement(updatedFloors, prev.typeOfConstruction);

      return {
        ...prev,
        floorDetails: updatedFloors,
        buildingStoriesDescription: derivedStories,
        numberOfFloorsAndHeight: summaryStmt,
        builtUpAreaAsPerActual: actualStmt,
      };
    });
  };

  const handleFloorDetailChange = (index: number, key: keyof BandhanSMEFloorDetail, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.floorDetails || [])];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], [key]: val };
      const actualStmt = formatActualBuiltUpStatement(updated, prev.typeOfConstruction);
      return {
        ...prev,
        floorDetails: updated,
        builtUpAreaAsPerActual: actualStmt,
      };
    });
  };

  // Building Valuation Table Handlers
  const handleAddBuildingRow = () => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: [
        ...(prev.buildingValuationRows || []),
        {
          description: '',
          plinthArea: '',
          height: '',
          age: '',
          replacementRate: '',
          replacementCost: '',
          depreciation: '',
          valueAfterDepreciation: '',
        },
      ],
    }));
  };

  const handleRemoveBuildingRow = (index: number) => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: prev.buildingValuationRows?.filter((_, i) => i !== index),
    }));
  };

  const handleBuildingRowChange = (index: number, key: keyof BandhanSMEBuildingValuationRow, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.buildingValuationRows || [])];
      const row = { ...updated[index] };

      if (key === 'plinthArea' || key === 'replacementRate' || key === 'depreciation' || key === 'replacementCost' || key === 'valueAfterDepreciation') {
        row[key] = sanitizePositiveFloat(val);
      } else if (key === 'age') {
        row[key] = sanitizePositiveInt(val, 3);
      } else {
        row[key] = val;
      }

      // Auto calculate replacement cost & net value if plinth and rate exist
      const p = parseNum(key === 'plinthArea' ? val : row.plinthArea);
      const r = parseNum(key === 'replacementRate' ? val : row.replacementRate);
      let cost = parseNum(key === 'replacementCost' ? val : row.replacementCost);

      if (p > 0 && r > 0) {
        cost = Math.round((p * r + Number.EPSILON) * 100) / 100;
        row.replacementCost = `Rs. ${formatCurrencyINR(cost)}`;
      } else if (key === 'plinthArea' || key === 'replacementRate') {
        if (!p || !r) {
          row.replacementCost = '';
          cost = 0;
        }
      }

      const dep = parseNum(key === 'depreciation' ? val : row.depreciation);
      if (cost > 0) {
        const net = Math.max(0, Math.round((cost - dep + Number.EPSILON) * 100) / 100);
        row.valueAfterDepreciation = `Rs. ${formatCurrencyINR(net)}`;
      } else if (key === 'depreciation' || key === 'plinthArea' || key === 'replacementRate') {
        row.valueAfterDepreciation = '';
      }

      updated[index] = row;
      return { ...prev, buildingValuationRows: updated };
    });
  };

  // Checklist handler
  const handleChecklistChange = (index: number, answer: 'Yes' | 'No' | 'NA') => {
    setFields((prev) => {
      const updated = [...(prev.checklist || [])];
      updated[index] = { ...updated[index], answer };
      return { ...prev, checklist: updated };
    });
  };

  // Sub-Schedule items handler
  const handleSubScheduleChange = (
    scheduleKey: 'extraItems' | 'amenities' | 'miscItems' | 'servicesItems',
    index: number,
    costVal: string
  ) => {
    const cleanCost = sanitizePositiveFloat(costVal);
    setFields((prev) => {
      const updated = [...(prev[scheduleKey] || [])];
      updated[index] = { ...updated[index], cost: cleanCost };
      return { ...prev, [scheduleKey]: updated };
    });
  };

  // Photos state derivation
  const propertyImages: string[] = useMemo(() => {
    if (Array.isArray(fields.propertyPhotos) && fields.propertyPhotos.length > 0) {
      return fields.propertyPhotos.map((p: any) => (typeof p === 'string' ? p : p.url)).filter(Boolean);
    }
    if (Array.isArray(fields.propertyImages) && fields.propertyImages.length > 0) {
      return fields.propertyImages;
    }
    return [];
  }, [fields.propertyPhotos, fields.propertyImages]);

  const propertyImageNames: string[] = useMemo(() => {
    if (Array.isArray(fields.propertyImageNames) && fields.propertyImageNames.length > 0) {
      return fields.propertyImageNames;
    }
    if (Array.isArray(fields.propertyPhotos) && fields.propertyPhotos.length > 0) {
      return fields.propertyPhotos.map((p: any) => (typeof p === 'string' ? '' : (p.caption ?? '')));
    }
    return [];
  }, [fields.propertyImageNames, fields.propertyPhotos]);

  // Dynamic Total Pages Calculation (accounting for 2 maps per page & 2 photos per page)
  const dynamicTotalPages = useMemo(() => {
    const basePages = 8;
    const photoCount = propertyImages.length;
    const photoPages = photoCount > 0 ? Math.ceil(photoCount / 2) : 0;
    const rorCount = (fields.mouzaMapImages && fields.mouzaMapImages.length > 0) ? fields.mouzaMapImages.length : (fields.rorImageUrl ? 1 : 0);
    const locCount = (fields.locationMapImages && fields.locationMapImages.length > 0) ? fields.locationMapImages.length : (fields.locationMapImageUrl ? 1 : 0);
    const bhuCount = (fields.cadastralMapImages && fields.cadastralMapImages.length > 0) ? fields.cadastralMapImages.length : ((fields.bhuNakshaImages && fields.bhuNakshaImages.length > 0) ? fields.bhuNakshaImages.length : (fields.bhuNakshaImageUrl ? 1 : 0));
    const guideCount = (fields.sketchMapImages && fields.sketchMapImages.length > 0) ? fields.sketchMapImages.length : ((fields.guidelineRateImages && fields.guidelineRateImages.length > 0) ? fields.guidelineRateImages.length : (fields.guidelineValueImageUrl ? 1 : 0));
    const bdaCount = fields.bdaMapImages?.length || 0;
    const totalMaps = rorCount + locCount + bhuCount + guideCount + bdaCount;
    const mapPages = totalMaps > 0 ? Math.ceil(totalMaps / 2) : 0;

    return String(basePages + photoPages + mapPages);
  }, [
    propertyImages.length,
    fields.mouzaMapImages,
    fields.rorImageUrl,
    fields.locationMapImages,
    fields.locationMapImageUrl,
    fields.cadastralMapImages,
    fields.bhuNakshaImages,
    fields.bhuNakshaImageUrl,
    fields.sketchMapImages,
    fields.guidelineRateImages,
    fields.guidelineValueImageUrl,
    fields.bdaMapImages,
  ]);

  // Measure exact PDF page count in the background
  useEffect(() => {
    let cancelled = false;
    const calculateExactPages = async () => {
      try {
        const renderer = new PDFBandhanSMERenderer();
        const { pageCount } = await renderer.generateBandhanSMEReportWithCount(fields);
        if (!cancelled && pageCount > 0) {
          setPreviewedPageCount(pageCount);
        }
      } catch {
        // graceful fallback to dynamicTotalPages
      }
    };
    const timer = setTimeout(calculateExactPages, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    fields.propertyImages,
    fields.propertyPhotos,
    fields.mouzaMapImages,
    fields.rorImageUrl,
    fields.locationMapImages,
    fields.locationMapImageUrl,
    fields.cadastralMapImages,
    fields.bhuNakshaImages,
    fields.bhuNakshaImageUrl,
    fields.sketchMapImages,
    fields.guidelineRateImages,
    fields.guidelineValueImageUrl,
    fields.bdaMapImages,
    fields.buildingValuationRows,
    fields.propAt,
    fields.detailedAddressWithPin,
  ]);

  // Live Auto Calculation Engine (Valuation, Land, Building, Sub-schedules & Abstract)
  useEffect(() => {
    // 1. Land Calculations
    const pArea = parseSqftFromArea(fields.landAreaTotal || fields.extentOfSite || fields.areaLandDoc, fields.landAreaUnit, fields.landAreaValue);
    const lMktRate = parseNum(fields.landMarketRate);
    const lGovtRate = parseNum(fields.landGovtBenchmarkRate);
    const lGovtValNum = parseNum(fields.landGovtBenchmarkValue || fields.landGovtBenchmarkPerAcre);
    const lGovtFactor = getBenchmarkUnitFactor(fields.landGovtBenchmarkUnit || 'ACRE');
    const effectiveGovtSftRate = lGovtRate > 0 ? lGovtRate : (lGovtValNum > 0 ? (lGovtValNum / lGovtFactor) : 0);

    const landMarketVal = (pArea > 0 && lMktRate > 0) ? Math.round(pArea * lMktRate) : 0;
    const landGovtVal = (pArea > 0 && effectiveGovtSftRate > 0) ? Math.round(pArea * effectiveGovtSftRate) : 0;
    const distPct = (fields.distressSalePct !== undefined && fields.distressSalePct !== '') ? parseNum(fields.distressSalePct) : 100;
    const realPct = (fields.realisableValuePct !== undefined && fields.realisableValuePct !== '') ? parseNum(fields.realisableValuePct) : 100;
    const landDistVal = Math.round(landMarketVal * (distPct / 100));
    const landRealVal = Math.round(landMarketVal * (realPct / 100));

    // 2. Building Calculations
    let bldgNetVal = 0;
    (fields.buildingValuationRows || []).forEach((br) => {
      const v = parseNum(br.valueAfterDepreciation || br.replacementCost);
      bldgNetVal += v;
    });
    const bldgDistVal = Math.round(bldgNetVal * (distPct / 100));
    const bldgRealVal = Math.round(bldgNetVal * (realPct / 100));

    // 3. Sub-schedules summation
    const sumSched = (items?: BandhanSMESubScheduleItem[]) => {
      if (!items) return 0;
      return items.reduce((acc, it) => acc + parseNum(it.cost), 0);
    };

    const extraVal = sumSched(fields.extraItems);
    const amenitiesVal = sumSched(fields.amenities);
    const miscVal = sumSched(fields.miscItems);
    const servicesVal = sumSched(fields.servicesItems);

    // 4. Total Abstract Matrix
    const totalGovt = landGovtVal;
    const totalMarket = landMarketVal + bldgNetVal + extraVal + amenitiesVal + miscVal + servicesVal;
    const totalReal = Math.round(totalMarket * (realPct / 100));
    const totalDist = Math.round(totalMarket * (distPct / 100));

    const roundSay = (n: number) => Math.round(n / 1000) * 1000;

    setFields((prev) => {
      let changed = false;
      const next = { ...prev };

      // Sync Land Valuation Totals
      const landMktStr = (landMarketVal > 0 && lMktRate > 0)
        ? formatMarketValueStatement(pArea, lMktRate)
        : '';
      const landGovtStr = (landGovtVal > 0 && effectiveGovtSftRate > 0)
        ? formatGovtGuidelineStatement(pArea, effectiveGovtSftRate)
        : '';
      const landDistStr = landDistVal > 0 ? `Rs.${formatCurrencyINR(landDistVal)}/-` : '';
      const landRealStr = landRealVal > 0 ? `Rs.${formatCurrencyINR(landRealVal)}/-` : '';

      if (landMarketVal > 0) {
        if (prev.landMarketValueTotal !== landMktStr) {
          if (!prev.landMarketValueTotal || prev.landMarketValueTotal.startsWith('Total Market Value of Land:')) {
            next.landMarketValueTotal = landMktStr;
            changed = true;
          }
        }
        if (prev.landDistressValue !== landDistStr) {
          next.landDistressValue = landDistStr;
          changed = true;
        }
        if (prev.landRealisableValue !== landRealStr) {
          next.landRealisableValue = landRealStr;
          changed = true;
        }
      }
      if (landGovtVal > 0 && prev.landGovtValueTotal !== landGovtStr) {
        if (!prev.landGovtValueTotal || prev.landGovtValueTotal.startsWith('Guideline Value of Land=') || prev.landGovtValueTotal.startsWith('Govt. Benchmark Value:')) {
          next.landGovtValueTotal = landGovtStr;
          changed = true;
        }
      }

      // Sync Abstract Matrix
      if (landMarketVal > 0) {
        const agl = `Rs. ${formatCurrencyINR(landGovtVal)}`;
        const aml = `Rs. ${formatCurrencyINR(landMarketVal)}`;
        const arl = `Rs. ${formatCurrencyINR(landRealVal)}`;
        const adl = `Rs. ${formatCurrencyINR(landDistVal)}`;
        if (prev.abstractGovtLand !== agl || prev.abstractMarketLand !== aml) {
          next.abstractGovtLand = agl;
          next.abstractMarketLand = aml;
          next.abstractRealLand = arl;
          next.abstractDistressLand = adl;
          changed = true;
        }
      }
      if (bldgNetVal > 0) {
        const amb = `Rs. ${formatCurrencyINR(bldgNetVal)}`;
        const arb = `Rs. ${formatCurrencyINR(bldgRealVal)}`;
        const adb = `Rs. ${formatCurrencyINR(bldgDistVal)}`;
        if (prev.abstractMarketBuilding !== amb) {
          next.abstractMarketBuilding = amb;
          next.abstractRealBuilding = arb;
          next.abstractDistressBuilding = adb;
          changed = true;
        }
      }

      // Sub-schedules totals sync
      const exTotStr = extraVal > 0 ? `Rs. ${formatCurrencyINR(extraVal)}` : 'Rs. 0.00';
      const amTotStr = amenitiesVal > 0 ? `Rs. ${formatCurrencyINR(amenitiesVal)}` : 'Rs. 0.00';
      const miTotStr = miscVal > 0 ? `Rs. ${formatCurrencyINR(miscVal)}` : 'Rs. 0.00';
      const seTotStr = servicesVal > 0 ? `Rs. ${formatCurrencyINR(servicesVal)}` : 'Rs. 0.00';

      if (prev.extraItemsTotal !== exTotStr) { next.extraItemsTotal = exTotStr; changed = true; }
      if (prev.amenitiesTotal !== amTotStr) { next.amenitiesTotal = amTotStr; changed = true; }
      if (prev.miscItemsTotal !== miTotStr) { next.miscItemsTotal = miTotStr; changed = true; }
      if (prev.servicesItemsTotal !== seTotStr) { next.servicesItemsTotal = seTotStr; changed = true; }

      if (totalMarket > 0) {
        const agt = `Rs. ${formatCurrencyINR(totalGovt)}`;
        const amt = `Rs. ${formatCurrencyINR(totalMarket)}`;
        const art = `Rs. ${formatCurrencyINR(totalReal)}`;
        const adt = `Rs. ${formatCurrencyINR(totalDist)}`;

        const ags = `Rs. ${formatCurrencyINR(roundSay(totalGovt))}`;
        const ams = `Rs. ${formatCurrencyINR(roundSay(totalMarket))}`;
        const ars = `Rs. ${formatCurrencyINR(roundSay(totalReal))}`;
        const ads = `Rs. ${formatCurrencyINR(roundSay(totalDist))}`;

        const fmv = `Rs.${formatCurrencyINR(roundSay(totalMarket))}/-`;
        const fmw = formatIndianCurrency(roundSay(totalMarket));
        const rv = `Rs.${formatCurrencyINR(roundSay(totalReal))}/-`;
        const rvw = formatIndianCurrency(roundSay(totalReal));
        const bvl = `Rs.${formatCurrencyINR(roundSay(landGovtVal))}/-`;
        const bvw = formatIndianCurrency(roundSay(landGovtVal));
        const dv = `Rs.${formatCurrencyINR(roundSay(totalDist))}/-`;
        const dvw = formatIndianCurrency(roundSay(totalDist));
        const ipv = `Rs.${formatCurrencyINR(bldgDistVal)}/-`;
        const ipvw = formatIndianCurrency(bldgDistVal);

        if (prev.abstractMarketSay !== ams || prev.fairMarketValue !== fmv) {
          next.abstractGovtTotal = agt;
          next.abstractMarketTotal = amt;
          next.abstractRealTotal = art;
          next.abstractDistressTotal = adt;

          next.abstractGovtSay = ags;
          next.abstractMarketSay = ams;
          next.abstractRealSay = ars;
          next.abstractDistressSay = ads;

          next.fairMarketValue = fmv;
          next.fairMarketValueWords = fmw;
          next.realisableValue = rv;
          next.realisableValueWords = rvw;
          next.bookValueOfLand = bvl;
          next.bookValueOfLandWords = bvw;
          next.distressValue = dv;
          next.distressValueWords = dvw;
          next.insurableValueOfProperty = ipv;
          next.insurableValueOfPropertyWords = ipvw;
          changed = true;
        }
      }

      if (!prev.reportPagesCountLocked && prev.reportPagesCount !== dynamicTotalPages) {
        next.reportPagesCount = dynamicTotalPages;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    fields.landAreaUnit,
    fields.landAreaValue,
    fields.landAreaTotal,
    fields.extentOfSite,
    fields.areaLandDoc,
    fields.landMarketRate,
    fields.landMarketUnit,
    fields.landMarketRateInput,
    fields.landGovtBenchmarkUnit,
    fields.landGovtBenchmarkValue,
    fields.landGovtBenchmarkRate,
    fields.landGovtBenchmarkPerAcre,
    fields.distressSalePct,
    fields.realisableValuePct,
    fields.buildingValuationRows,
    fields.isExtraItemsNA,
    fields.extraItems,
    fields.isAmenitiesNA,
    fields.amenities,
    fields.isMiscNA,
    fields.miscItems,
    fields.isServicesNA,
    fields.servicesItems,
    dynamicTotalPages,
  ]);

  // Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, fields);
      setAutoSaveStatus('saved');
      setMessage({ text: 'Draft saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setAutoSaveStatus('error');
      setMessage({ text: 'Failed to save draft: ' + e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Preview PDF
  const handlePreviewPDF = async () => {
    try {
      const { pdfBytes, pageCount } = await generateBandhanSMEReportWithCount(fields);
      setPreviewedPageCount(pageCount);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e: any) {
      alert('Failed to generate PDF preview: ' + e.message);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      const { pdfBytes } = await generateBandhanSMEReportWithCount(fields);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Bandhan_Bank_SME_${projectCode || projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      alert('Failed to download PDF: ' + e.message);
    }
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for review?')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, fields);
      await submitReportForVerification(projectId);
      alert('Report submitted successfully!');
      router.refresh();
    } catch (e: any) {
      alert('Failed to submit report: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Multiple Photo Upload
  const handleUploadMultiplePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const newPhotos: BandhanSMEPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const caption = '';
        const { dataUrl, blob } = await compressImageFile(file, 1280, 1280, 0.8);
        let uploadedUrl = dataUrl;
        try {
          const ext = 'jpg';
          const fileName = `${projectId}-photo-${Date.now()}-${i}.${ext}`;
          const filePath = `temp-photos/${projectId}/${fileName}`;
          const { error: uploadErr } = await supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Supabase storage upload fallback to compressed base64:', storageErr);
        }

        newPhotos.push({ url: uploadedUrl, caption });
      }

      setFields((prev) => ({
        ...prev,
        propertyPhotos: [...(prev.propertyPhotos || []), ...newPhotos],
      }));
    } catch (err: any) {
      console.error('Photo upload error:', err);
      alert(`Photo upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handlePhotoRemove = (idx: number) => {
    const updatedPhotos = (fields.propertyPhotos || []).filter((_, i) => i !== idx);
    setFields((prev) => ({
      ...prev,
      propertyPhotos: updatedPhotos,
      propertyImages: Array.isArray(prev.propertyImages) ? prev.propertyImages.filter((_: any, i: number) => i !== idx) : undefined,
      propertyImageNames: Array.isArray(prev.propertyImageNames) ? prev.propertyImageNames.filter((_: any, i: number) => i !== idx) : undefined,
    }));
  };

  const handlePhotoRename = (idx: number, name: string) => {
    const updatedPhotos = [...(fields.propertyPhotos || [])];
    if (updatedPhotos[idx]) {
      updatedPhotos[idx] = { ...updatedPhotos[idx], caption: name };
    } else if (propertyImages[idx]) {
      updatedPhotos[idx] = { url: propertyImages[idx], caption: name };
    }
    const updatedNames = [...(Array.isArray(fields.propertyImageNames) ? fields.propertyImageNames : [])];
    while (updatedNames.length <= idx) {
      updatedNames.push('');
    }
    updatedNames[idx] = name;
    setFields((prev) => ({
      ...prev,
      propertyPhotos: updatedPhotos,
      propertyImageNames: updatedNames,
    }));
  };

  const handlePhotoReorder = (newImages: string[], newNames: string[]) => {
    const newPhotos: BandhanSMEPhoto[] = newImages.map((url, idx) => ({
      url,
      caption: newNames[idx] ?? '',
    }));
    setFields((prev) => ({
      ...prev,
      propertyPhotos: newPhotos,
      propertyImages: newImages,
      propertyImageNames: newNames,
    }));
  };

  // Map Handlers for BaseMapsSection
  const handleMapUpload = async (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { dataUrl, blob } = await compressImageFile(file, 1600, 1600, 0.85);
        let uploadedUrl = dataUrl;
        try {
          const ext = 'jpg';
          const fileName = `${projectId}-${fieldKey}-${Date.now()}-${i}.${ext}`;
          const filePath = `temp-photos/${projectId}/${fileName}`;
          const { error: uploadErr } = await supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Map upload storage fallback to base64:', storageErr);
        }
        uploadedUrls.push(uploadedUrl);
      }
      setFields(prev => {
        const curr = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : (prev[fieldKey] ? [prev[fieldKey]] : []);
        return {
          ...prev,
          [fieldKey]: [...curr, ...uploadedUrls],
        };
      });
    } catch (err: any) {
      console.error('Map upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleMapRemove = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages', idx?: number) => {
    if (idx === undefined) {
      setFields(prev => ({ ...prev, [fieldKey]: [] }));
      return;
    }
    setFields(prev => {
      const curr = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : (prev[fieldKey] ? [prev[fieldKey]] : []);
      return {
        ...prev,
        [fieldKey]: curr.filter((_, i) => i !== idx),
      };
    });
  };

  const handleMapReorder = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages', newImgs: string[]) => {
    setFields(prev => ({ ...prev, [fieldKey]: newImgs }));
  };

  // Document Handlers for BaseDocumentsSection
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { dataUrl, blob } = await compressImageFile(file, 1600, 1600, 0.85);
        let uploadedUrl = dataUrl;
        try {
          const ext = 'jpg';
          const fileName = `${projectId}-document-${Date.now()}-${i}.${ext}`;
          const filePath = `temp-photos/${projectId}/${fileName}`;
          const { error: uploadErr } = await supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Document upload storage fallback to base64:', storageErr);
        }
        uploadedUrls.push(uploadedUrl);
      }
      setFields(prev => {
        const currImgs = Array.isArray(prev.documentImages) ? prev.documentImages : [];
        const currNames = Array.isArray(prev.documentImageNames) ? prev.documentImageNames : [];
        const newNames = uploadedUrls.map(() => DEFAULT_DOCUMENT_LABEL);
        return {
          ...prev,
          documentImages: [...currImgs, ...uploadedUrls],
          documentImageNames: [...currNames, ...newNames],
        };
      });
    } catch (err: any) {
      console.error('Document upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleDocumentRemove = (idx: number) => {
    setFields(prev => {
      const currImgs = Array.isArray(prev.documentImages) ? prev.documentImages : [];
      const currNames = Array.isArray(prev.documentImageNames) ? prev.documentImageNames : [];
      return {
        ...prev,
        documentImages: currImgs.filter((_, i) => i !== idx),
        documentImageNames: currNames.filter((_, i) => i !== idx),
      };
    });
  };

  const handleDocumentRename = (idx: number, name: string) => {
    setFields(prev => {
      const currNames = [...(Array.isArray(prev.documentImageNames) ? prev.documentImageNames : [])];
      while (currNames.length <= idx) {
        currNames.push('');
      }
      currNames[idx] = name;
      return {
        ...prev,
        documentImageNames: currNames,
      };
    });
  };

  const handleDocumentReorder = (newImages: string[], newNames: string[]) => {
    setFields(prev => ({
      ...prev,
      documentImages: newImages,
      documentImageNames: newNames,
    }));
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900 font-sans">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Top Active Configuration Banner */}
        <ActiveConfigBanner
          clientType={(fields.clientType as 'organisation' | 'individual') || 'organisation'}
          category={fields.institutionCategory || 'Bank & FIS'}
          bankName={fields.bankName || fields.organisationTemplate || 'BANDHAN BANK'}
          subclass={fields.organisationSubTemplate || 'SME'}
          serviceType={fields.serviceType}
          subjectType={fields.subjectType}
          onResetWizard={onResetWizard}
        />

        {/* Rework Banner */}
        {fields.reworkNotes && status === 'REPORT_DRAFTING' && (
          <div className="card p-5 border-2 border-red-200 bg-red-50 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">Manager Rework Requested</h2>
            </div>
            <p className="text-sm text-red-700 bg-white/60 p-4 rounded-lg border border-red-100 whitespace-pre-wrap">
              {fields.reworkNotes}
            </p>
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold border shadow-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}



        {/* 1. BASIC INFORMATION */}
        <Section number={1} id="sec-basic" title="I. Basic Information (Points A–M)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="A. Name of the Bank Branch / CBO / Asset Centre:">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <div className="relative">
                      <input
                        type="text"
                        className={`${inputCls} bg-slate-100/90 text-slate-700 font-semibold cursor-not-allowed`}
                        value="Bandhan Bank"
                        readOnly
                        disabled
                      />
                      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                        <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Fixed</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.branchDetails || ''}
                      onChange={(e) => {
                        const bDetails = e.target.value;
                        const combined = bDetails ? `Bandhan Bank, ${bDetails}` : 'Bandhan Bank';
                        setFields((prev) => ({
                          ...prev,
                          branchDetails: bDetails,
                          branchName: combined,
                        }));
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="B. Bank Letter No. & Date Requesting Valuation:">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Letter No.:</label>
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="e.g. BL-1234/2026"
                      value={fields.bankLetterNo || ''}
                      onChange={(e) => {
                        const noVal = e.target.value;
                        const dtVal = fields.bankLetterDate || '';
                        const combined = [noVal ? `Bank Letter No.: ${noVal}` : '', dtVal ? `Date: ${dtVal}` : ''].filter(Boolean).join('\n');
                        setFields((prev) => ({
                          ...prev,
                          bankLetterNo: noVal,
                          letterNoAndDate: combined,
                        }));
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date:</label>
                    <BaseDateInput
                      value={fields.bankLetterDate || ''}
                      onChange={(dtVal) => {
                        const noVal = fields.bankLetterNo || '';
                        const combined = [noVal ? `Bank Letter No.: ${noVal}` : '', dtVal ? `Date: ${dtVal}` : ''].filter(Boolean).join('\n');
                        setFields((prev) => ({
                          ...prev,
                          bankLetterDate: dtVal,
                          letterNoAndDate: combined,
                        }));
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </Field>
            </div>
            <Field label="C. Valuation Made at Request of Borrower?:">
              <select
                className={selectCls}
                value={fields.valuationMadeAtBorrowerRequest || 'No'}
                onChange={(e) => handleChange('valuationMadeAtBorrowerRequest', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="D. Name of Manager / Officer who Accompanied:">
              <input
                type="text"
                className={inputCls}
                value={fields.managerAccompanied || ''}
                onChange={(e) => handleChange('managerAccompanied', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="E. Valuation Type:">
              <select
                className={selectCls}
                value={fields.valuationType || 'Fresh Valuation'}
                onChange={(e) => handleChange('valuationType', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Fresh Valuation">Fresh Valuation</option>
                <option value="Revaluation">Revaluation</option>
                <option value="Periodic Valuation">Periodic Valuation</option>
              </select>
            </Field>
            <Field label="F. Date of Earlier Valuation, if any:">
              <BaseDateInput
                value={fields.dateOfEarlierValuation || ''}
                onChange={(val) => handleChange('dateOfEarlierValuation', val)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="G. Name of Previous Valuer, if any:">
              <input
                type="text"
                className={inputCls}
                value={fields.previousValuerName || ''}
                onChange={(e) => handleChange('previousValuerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="H. Date of Visit to the Property:">
              <div className="space-y-1">
                <BaseDateInput
                  value={fields.dateOfVisit || ''}
                  onChange={(val) => handleChange('dateOfVisit', val)}
                  disabled={isReadOnly}
                />
                {firstFieldAgentVisit?.dateStr && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="truncate">
                      Earliest Field Visit: <span className="font-semibold text-slate-700">{firstFieldAgentVisit.dateStr}</span>
                      {firstFieldAgentVisit.agentName ? ` (${firstFieldAgentVisit.agentName})` : ''}
                    </span>
                    {!isReadOnly && fields.dateOfVisit !== firstFieldAgentVisit.dateStr && (
                      <button
                        type="button"
                        onClick={() => handleChange('dateOfVisit', firstFieldAgentVisit.dateStr)}
                        className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px] shrink-0 ml-2 cursor-pointer"
                      >
                        Use Field Date
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Field>
            <Field label="I. Date on which Valuation is Made:">
              <BaseDateInput
                value={fields.dateOfValuation || ''}
                onChange={(val) => handleChange('dateOfValuation', val)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="J. Person(s) in Presence of whom Valuation is Made:">
              <input
                type="text"
                className={inputCls}
                value={(fields.personsPresent || '').replace(/,\s*Mob-?\s*$/, '')}
                onChange={(e) => handleChange('personsPresent', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="K. List of Documents Produced for Verification:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.documentsProduced || ''}
                  onChange={(e) => handleChange('documentsProduced', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Borrower Sub-Block */}
            <div className="sm:col-span-2 p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3 shadow-2xs">
              <h4 className="font-bold text-blue-900 text-xs tracking-wide uppercase pb-1.5 border-b border-blue-200/60">
                L. Borrower / Borrowal Account Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Borrower Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerName || ''}
                    onChange={(e) => handleChange('borrowerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="At (Location):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerAt || ''}
                    onChange={(e) => handleChange('borrowerAt', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.O:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerPo || ''}
                    onChange={(e) => handleChange('borrowerPo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.S:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerPs || ''}
                    onChange={(e) => handleChange('borrowerPs', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Dist & State:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerDist || ''}
                    onChange={(e) => handleChange('borrowerDist', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Phone / Mobile No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerPhone || ''}
                    onChange={(e) => handleChange('borrowerPhone', sanitizePositiveInt(e.target.value, 15))}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Owner Sub-Block */}
            <div className="sm:col-span-2 p-4 bg-purple-50/60 border border-purple-200/80 rounded-xl space-y-3 shadow-2xs">
              <h4 className="font-bold text-purple-900 text-xs tracking-wide uppercase pb-1.5 border-b border-purple-200/60">
                M. Owner / Owner(s) of the Property
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Owner Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerName || ''}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="At (Location):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerAt || ''}
                    onChange={(e) => handleChange('ownerAt', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.O:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPo || ''}
                    onChange={(e) => handleChange('ownerPo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.S:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPs || ''}
                    onChange={(e) => handleChange('ownerPs', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="PIN Code:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPin || ''}
                    onChange={(e) => handleChange('ownerPin', sanitizePositiveInt(e.target.value, 6))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="District:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerDist || ''}
                    onChange={(e) => handleChange('ownerDist', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Phone / Mobile No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPhone || ''}
                    onChange={(e) => handleChange('ownerPhone', sanitizePositiveInt(e.target.value, 15))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Father's Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerFatherName || ''}
                    onChange={(e) => handleChange('ownerFatherName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 2. LAND DETAILS & MASTER AREA UNIT SELECTOR */}
        <Section number={2} id="sec-prop-details" title="II. Valuation of Land (1. Details of Property)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="A. Details of Property Offered as Secured:">
                {renderSelect(
                  fields.detailsPropertyOffered,
                  ['Land & Building', 'Vacant Land', 'Residential Land & Building', 'Commercial Land & Building', 'Residential Flat', 'Commercial Office / Shop', 'Industrial Land & Building'],
                  (v) => handleChange('detailsPropertyOffered', v),
                  isReadOnly,
                  'Land & Building'
                )}
              </Field>
              <Field label="B. Date of Acquisition / Purchase of Land:">
                <BaseDateInput
                  value={fields.dateAcquisitionLand || ''}
                  onChange={(val) => handleChange('dateAcquisitionLand', val)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="C. Value as per Registered Sale Deed:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valueAsPerSaleDeed || ''}
                  onChange={(e) => handleChange('valueAsPerSaleDeed', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="D. Sale Deed / Title Deed Document No:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.saleDeedDocNo || ''}
                  onChange={(e) => handleChange('saleDeedDocNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              {/* E. Area of Land (As per Title Deed) */}
              <div className="sm:col-span-2">
                <AreaOfLandField
                  label="E. Area of Land (As per Title Deed):"
                  fieldKey="areaLandDoc"
                  value={fields.areaLandDoc || ''}
                  onChange={(formatted, unit, numVal) => handleAreaFieldChange('areaLandDoc', formatted, unit, numVal)}
                  isReadOnly={isReadOnly}
                />
              </div>

              {/* F. Area of Land (As per ROR) */}
              <div className="sm:col-span-2">
                <AreaOfLandField
                  label="F. Area of Land (As per ROR):"
                  fieldKey="areaLandRor"
                  value={fields.areaLandRor || ''}
                  onChange={(formatted, unit, numVal) => handleAreaFieldChange('areaLandRor', formatted, unit, numVal)}
                  isReadOnly={isReadOnly}
                />
              </div>

              {/* G. Area of Land (As per Physical Measurement) */}
              <div className="sm:col-span-2">
                <AreaOfLandField
                  label="G. Area of Land (As per Physical Measurement):"
                  fieldKey="areaLandPhysical"
                  value={fields.areaLandPhysical || ''}
                  onChange={(formatted, unit, numVal) => handleAreaFieldChange('areaLandPhysical', formatted, unit, numVal)}
                  isReadOnly={isReadOnly}
                />
              </div>

              {/* Property Address & Postal Location H */}
              <div className="sm:col-span-2 p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3 shadow-2xs">
                <h4 className="font-bold text-amber-900 text-xs tracking-wide uppercase pb-1.5 border-b border-amber-200/60">
                  H. Location of Property & Postal Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Plot No(s):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.plotNo || ''}
                      onChange={(e) => handleChange('plotNo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Khata No / Dag No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.khataNo || ''}
                      onChange={(e) => handleChange('khataNo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="At:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propAt || ''}
                      onChange={(e) => handleChange('propAt', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="P.O:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propPo || ''}
                      onChange={(e) => handleChange('propPo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="P.S:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propPs || ''}
                      onChange={(e) => handleChange('propPs', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="PIN Code:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propPin || ''}
                      onChange={(e) => handleChange('propPin', sanitizePositiveInt(e.target.value, 6))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="District:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propDist || ''}
                      onChange={(e) => handleChange('propDist', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>

              <Field label="I. Urban / Semi Urban / Rural:">
                {renderSelect(
                  fields.urbanSemiUrbanRural,
                  ['Urban Area', 'Semi Urban Area', 'Rural Area'],
                  (v) => handleChange('urbanSemiUrbanRural', v),
                  isReadOnly,
                  'Urban Area'
                )}
              </Field>
              <Field label="J. Locality Zone:">
                {renderSelect(
                  fields.situatedAreaType,
                  ['Residential Area', 'Commercial Area', 'Residential cum Commercial Area', 'Industrial Area', 'Mixed Area'],
                  (v) => handleChange('situatedAreaType', v),
                  isReadOnly,
                  'Residential cum Commercial Area'
                )}
              </Field>
              <Field label="K. Locality Classification:">
                {renderSelect(
                  fields.classificationOfLocality,
                  ['High Class', 'Middle Class', 'Poor Class'],
                  (v) => handleChange('classificationOfLocality', v),
                  isReadOnly,
                  'Middle Class'
                )}
              </Field>
              {/* L. Type of Property with nested statutory classification */}
              <div className="sm:col-span-2 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-3.5 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-emerald-200/60">
                  <h4 className="font-bold text-emerald-900 text-xs tracking-wide uppercase">L. Type of Property (Points I to VI)</h4>
                  <div className="flex items-center gap-2">
                    <select
                      className="text-xs bg-white border border-emerald-300 rounded px-2.5 py-1 font-semibold text-emerald-900 focus:outline-none focus:border-emerald-500 shadow-xs"
                      value={fields.typeOfProperty || 'Land & building'}
                      onChange={(e) => handleChange('typeOfProperty', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="Land & building">Land & building</option>
                      <option value="Residential Land & Building">Residential Land & Building</option>
                      <option value="Commercial Land & Building">Commercial Land & Building</option>
                      <option value="Vacant Land">Vacant Land</option>
                      <option value="Industrial Property">Industrial Property</option>
                      <option value="Mixed Use Property">Mixed Use Property</option>
                    </select>
                  </div>
                </div>

                {/* Sub-container I: Agricultural */}
                <div className="p-3.5 bg-white/90 border border-emerald-200/90 rounded-lg space-y-2.5 shadow-2xs">
                  <div className="pb-1.5 border-b border-emerald-100">
                    <h5 className="font-bold text-emerald-950 text-xs tracking-wide uppercase">
                      I. Agricultural Classification
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <Field label="a. Agricultural:">
                      {renderSelect(
                        fields.isAgricultural,
                        ['No', 'Yes'],
                        (v) => handleChange('isAgricultural', v),
                        isReadOnly,
                        'No'
                      )}
                    </Field>
                    <Field label="b. Conversion to House Site Plots Contemplated:">
                      {renderSelect(
                        fields.agriculturalConversionContemplated,
                        ['Not Applicable', 'Conversion Permitted', 'Applied for Conversion', 'No', 'Yes'],
                        (v) => handleChange('agriculturalConversionContemplated', v),
                        isReadOnly,
                        'Not Applicable'
                      )}
                    </Field>
                  </div>
                </div>

                {/* Sub-container II: Industrial */}
                <div className="p-3.5 bg-white/90 border border-emerald-200/90 rounded-lg space-y-2.5 shadow-2xs">
                  <div className="pb-1.5 border-b border-emerald-100">
                    <h5 className="font-bold text-emerald-950 text-xs tracking-wide uppercase">
                      II. Industrial Classification &amp; Activity
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <Field label="a. Industrial:">
                      {renderSelect(
                        fields.isIndustrial,
                        ['No', 'Yes'],
                        (v) => handleChange('isIndustrial', v),
                        isReadOnly,
                        'No'
                      )}
                    </Field>
                    <Field label="b. Activity / Industry Suited:">
                      {renderSelect(
                        fields.industrialActivitySuited,
                        ['Not Applicable', 'Light Engineering / Fabrication', 'Warehousing / Logistics', 'Manufacturing Unit', 'Commercial Warehouse', 'Yes'],
                        (v) => handleChange('industrialActivitySuited', v),
                        isReadOnly,
                        'Not Applicable'
                      )}
                    </Field>
                  </div>
                </div>

                {/* Sub-container III to VI: Other Property Classifications */}
                <div className="p-3.5 bg-white/90 border border-emerald-200/90 rounded-lg space-y-2.5 shadow-2xs">
                  <div className="pb-1.5 border-b border-emerald-100">
                    <h5 className="font-bold text-emerald-950 text-xs tracking-wide uppercase">
                      III – VI. Other Property Classifications
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <Field label="III. Residential (Restrictive clauses):">
                      {renderSelect(
                        fields.isResidential,
                        ['Yes', 'No'],
                        (v) => handleChange('isResidential', v),
                        isReadOnly,
                        'Yes'
                      )}
                    </Field>
                    <Field label="IV. Commercial:">
                      {renderSelect(
                        fields.isCommercial,
                        ['Yes', 'No'],
                        (v) => handleChange('isCommercial', v),
                        isReadOnly,
                        'Yes'
                      )}
                    </Field>
                    <Field label="V. Institutional:">
                      {renderSelect(
                        fields.isInstitutional,
                        ['No', 'Yes'],
                        (v) => handleChange('isInstitutional', v),
                        isReadOnly,
                        'No'
                      )}
                    </Field>
                    <Field label="VI. Others (Specify):">
                      {renderSelect(
                        fields.isOthersSpecify,
                        ['No', 'Yes', 'Mixed Use', 'Not Applicable'],
                        (v) => handleChange('isOthersSpecify', v),
                        isReadOnly,
                        'No'
                      )}
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 3. TITLE, OWNERSHIP & RENT */}
        <Section number={3} id="sec-title-rent" title="II. Valuation of Land (2. Title, Ownership & Rent)">
          <div className="space-y-4">
            {/* 2.1 Title of Property Freehold / Leasehold */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-indigo-200/60">
                <h4 className="font-bold text-indigo-900 text-xs tracking-wide uppercase">2.1 Title of Property Free Hold / Lease Hold (Points A to F)</h4>
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs bg-white border border-indigo-300 rounded px-2.5 py-1 font-semibold text-indigo-900 focus:outline-none focus:border-indigo-500 shadow-xs"
                    value={fields.titleFreeholdLeasehold || 'It is a free hold land'}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('titleFreeholdLeasehold', val);
                      if (val.toLowerCase().includes('lease')) {
                        handleChange('isLeaseholdApplicable', 'Yes');
                      }
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="It is a free hold land">Freehold</option>
                    <option value="It is a lease hold land">Leasehold</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Field label="A. Ownership of Property:">
                  {renderSelect(
                    fields.ownershipOfProperty,
                    ['Single Ownership', 'Joint Ownership'],
                    (v) => handleChange('ownershipOfProperty', v),
                    isReadOnly,
                    'Single Ownership'
                  )}
                </Field>
                <Field label="B. Joint Ownership Share:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.jointOwnershipShare || ''}
                    onChange={(e) => handleChange('jointOwnershipShare', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Taxes Paid Up To:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.taxesPaidUpTo || ''}
                    onChange={(e) => handleChange('taxesPaidUpTo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="D. Land Revenue:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landRevenue || ''}
                    onChange={(e) => handleChange('landRevenue', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="E. Municipal Taxes:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landBuildingMunicipalTaxes || ''}
                    onChange={(e) => handleChange('landBuildingMunicipalTaxes', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="F. Wealth Tax Assessed / Paid:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.wealthTaxAssessedPaid || ''}
                    onChange={(e) => handleChange('wealthTaxAssessedPaid', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 2.2 If Leasehold */}
            <div className="sm:col-span-2 p-4 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-rose-200/60">
                <h4 className="font-bold text-rose-900 text-xs tracking-wide uppercase">2.2 If Lease Hold (Points A to M)</h4>
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs bg-white border border-rose-300 rounded px-2.5 py-1 font-semibold text-rose-900 focus:outline-none focus:border-rose-500 shadow-xs"
                    value={fields.isLeaseholdApplicable || 'No'}
                    onChange={(e) => handleChange('isLeaseholdApplicable', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="No">No (Not Applicable)</option>
                    <option value="Yes">Yes (Leasehold)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Field label="A. Name of the Lessor:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.lessorName || ''}
                    onChange={(e) => handleChange('lessorName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Name of the Lessee:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.lesseeName || ''}
                    onChange={(e) => handleChange('lesseeName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Nature of Lease:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.natureOfLease || ''}
                    onChange={(e) => handleChange('natureOfLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="D. Date of Commencement:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dateCommencementLease || ''}
                    onChange={(e) => handleChange('dateCommencementLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="E. Period of Lease:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.periodOfLease || ''}
                    onChange={(e) => handleChange('periodOfLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="G. Terms of Renewal:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.termsOfRenewal || ''}
                    onChange={(e) => handleChange('termsOfRenewal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="H. Lease Premium / Rent Per Annum:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.leasePremiumRentPerAnnum || ''}
                    onChange={(e) => handleChange('leasePremiumRentPerAnnum', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="I. Un-expired Period of Lease:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unexpiredPeriodOfLease || ''}
                    onChange={(e) => handleChange('unexpiredPeriodOfLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="J. Initial Premium:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.initialPremium || ''}
                    onChange={(e) => handleChange('initialPremium', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="K. Ground Rent Payable Per Annum:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.groundRentPerAnnum || ''}
                    onChange={(e) => handleChange('groundRentPerAnnum', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="L. Unearned Increase Payable to Lessor:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unearnedIncreasePayable || ''}
                    onChange={(e) => handleChange('unearnedIncreasePayable', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="M. Lease Agreement Permits Mortgage:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.leasePermitsMortgage || ''}
                    onChange={(e) => handleChange('leasePermitsMortgage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 2.3 Rent Details */}
            <div className="sm:col-span-2 p-4 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-teal-200/60">
                <h4 className="font-bold text-teal-900 text-xs tracking-wide uppercase">2.3 Rent Details (Points A to D)</h4>
                <div className="flex items-center gap-2">
                  <select
                    className="text-xs bg-white border border-teal-300 rounded px-2.5 py-1 font-semibold text-teal-900 focus:outline-none focus:border-teal-500 shadow-xs"
                    value={fields.rentOccupationStatus || 'The Plot is occupied by Owner'}
                    onChange={(e) => handleChange('rentOccupationStatus', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="The Plot is occupied by Owner">Owner Occupied</option>
                    <option value="Tenanted">Tenanted (Rented)</option>
                    <option value="Partly Owner Occupied & Partly Tenanted">Partly Owner Occupied & Partly Tenanted</option>
                    <option value="Vacant">Vacant</option>
                    <option value="Under Construction">Under Construction</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Field label="A. Tenant Names:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.tenantNames || ''}
                    onChange={(e) => handleChange('tenantNames', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Portion in Occupation:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.tenantPortionOccupied || ''}
                    onChange={(e) => handleChange('tenantPortionOccupied', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Monthly / Annual Rent:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.monthlyAnnualRentPaid || ''}
                    onChange={(e) => handleChange('monthlyAnnualRentPaid', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="D. Gross Rent Received:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.grossRentReceived || ''}
                    onChange={(e) => handleChange('grossRentReceived', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. BRIEF DESCRIPTION OF THE PROPERTY */}
        <Section number={4} id="sec-desc-boundaries" title="II. Valuation of Land (3. Brief Description of the Property)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-2 lg:col-span-3">
                <Field label="A. Detailed Postal Address (with PIN):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.detailedAddressWithPin || ''}
                    onChange={(e) => handleChange('detailedAddressWithPin', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
              <Field label="B. Ward No:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.municipalityWardNo || ''}
                  onChange={(e) => handleChange('municipalityWardNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="C. Street No.:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.streetNo || ''}
                  onChange={(e) => handleChange('streetNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="D. Survey / Plot No.:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.surveyPlotNo || ''}
                  onChange={(e) => handleChange('surveyPlotNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="E. Khata No.:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.briefKhataNo || ''}
                  onChange={(e) => handleChange('briefKhataNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="F. Mouza:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.mouza || ''}
                  onChange={(e) => handleChange('mouza', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="G. Thana No:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.thanaNo || ''}
                  onChange={(e) => handleChange('thanaNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="H. Tehasil No.:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.tehasilNo || ''}
                  onChange={(e) => handleChange('tehasilNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="I. Tehasil:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.tehasil || ''}
                  onChange={(e) => handleChange('tehasil', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="J. SRO:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sro || ''}
                  onChange={(e) => handleChange('sro', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="K. Police Station (P.S):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.policeStation || ''}
                  onChange={(e) => handleChange('policeStation', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="L. Village / Town / City:">
                {renderSelect(
                  fields.villageTownCity,
                  ['City', 'Town', 'Village'],
                  (v) => handleChange('villageTownCity', v),
                  isReadOnly,
                  'City'
                )}
              </Field>
              <Field label="M. District:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.district || ''}
                  onChange={(e) => handleChange('district', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="N. State:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* O. Dimensions & Extent */}
            <div className="p-4 bg-sky-50/60 border border-sky-200/80 rounded-xl space-y-3 shadow-2xs">
              <h4 className="font-bold text-sky-900 text-xs tracking-wide uppercase pb-1.5 border-b border-sky-200/60">
                O. Dimensions & Extent of Site (Points I to IV)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-sky-200/80 rounded-lg space-y-2 shadow-2xs">
                  <p className="font-semibold text-xs text-sky-950">(I) Dimensions as per Document</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="A) East to West:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionDocEastWest || ''}
                        onChange={(e) => handleChange('dimensionDocEastWest', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="B) North to South:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionDocNorthSouth || ''}
                        onChange={(e) => handleChange('dimensionDocNorthSouth', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <div className="p-3 bg-white border border-sky-200/80 rounded-lg space-y-2 shadow-2xs">
                  <p className="font-semibold text-xs text-sky-950">(II) Dimensions as per Measurement</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="A) East to West:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionMeasEastWest || ''}
                        onChange={(e) => handleChange('dimensionMeasEastWest', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="B) North to South:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionMeasNorthSouth || ''}
                        onChange={(e) => handleChange('dimensionMeasNorthSouth', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <div className="sm:col-span-1">
                  <ExtentOfLandField
                    label="(III) Extent of Site:"
                    subLabel="(Referred from E. Area of Land - Title Deed, Editable)"
                    value={fields.extentOfSite || fields.areaLandDoc || ''}
                    inheritedUnit={fields.landAreaUnit || 'ACRE_DEC'}
                    onChange={(formatted) => handleChange('extentOfSite', formatted)}
                    isReadOnly={isReadOnly}
                  />
                </div>

                <div className="sm:col-span-1">
                  <ExtentOfLandField
                    label="(IV) Extent Considered for Valuation:"
                    subLabel="(Referred from E. Area of Land - Title Deed, Editable)"
                    value={fields.extentConsideredValuation || fields.extentOfSite || fields.areaLandDoc || ''}
                    inheritedUnit={fields.landAreaUnit || 'ACRE_DEC'}
                    onChange={(formatted) => handleChange('extentConsideredValuation', formatted)}
                    isReadOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>

            {/* P. Boundaries of the Property (Unified Points 1 & 2) */}
            <div className="p-4 bg-slate-50/60 border border-slate-200/80 rounded-xl space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
                <h4 className="font-bold text-slate-800 text-xs tracking-wide uppercase">
                  P. Boundaries of the Property (Points 1 & 2)
                </h4>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddPlotBoundary}
                    className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
                  >
                    + Add Plot Boundary
                  </button>
                )}
              </div>

              {/* 1) Document Boundaries */}
              <div className="p-3.5 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-3 shadow-2xs">
                <div className="pb-1.5 border-b border-indigo-200/60">
                  <h5 className="font-bold text-xs text-indigo-900 tracking-wide uppercase">
                    1) Boundaries as per Document / Deed (Dynamic Multi-Plot Support)
                  </h5>
                </div>

                {(fields.documentPlotBoundaries || []).map((pb, idx) => (
                  <div key={idx} className="p-3 bg-white/90 border border-indigo-200/70 rounded-lg space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        className="font-medium text-xs text-slate-900 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-500 w-64 px-2.5 py-1"
                        value={pb.plotNo}
                        onChange={(e) => handleDocumentPlotBoundaryChange(idx, 'plotNo', e.target.value)}
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && (fields.documentPlotBoundaries || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlotBoundary(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer px-2 py-0.5"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Field label="I) East:">
                        <input
                          type="text"
                          className={inputCls}
                          value={pb.east}
                          onChange={(e) => handleDocumentPlotBoundaryChange(idx, 'east', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="II) West:">
                        <input
                          type="text"
                          className={inputCls}
                          value={pb.west}
                          onChange={(e) => handleDocumentPlotBoundaryChange(idx, 'west', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="III) North:">
                        <input
                          type="text"
                          className={inputCls}
                          value={pb.north}
                          onChange={(e) => handleDocumentPlotBoundaryChange(idx, 'north', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="IV) South:">
                        <input
                          type="text"
                          className={inputCls}
                          value={pb.south}
                          onChange={(e) => handleDocumentPlotBoundaryChange(idx, 'south', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2) Physical Boundaries */}
              <div className="p-3.5 bg-teal-50/50 border border-teal-200/80 rounded-xl space-y-3 shadow-2xs">
                <div className="pb-1.5 border-b border-teal-200/60">
                  <h5 className="font-bold text-xs text-teal-900 tracking-wide uppercase">
                    2) Boundaries as per Physical Verification on Site
                  </h5>
                </div>

                {(fields.documentPlotBoundaries || []).map((pb, idx) => (
                  <div key={idx} className="p-3 bg-white/90 border border-teal-200/70 rounded-lg space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          className="font-medium text-xs text-slate-700 bg-slate-100/90 border border-slate-200 rounded w-64 px-2.5 py-1 cursor-default select-all"
                          value={pb.plotNo || `Schedule ${idx + 1}`}
                          readOnly
                          disabled={isReadOnly}
                          tabIndex={-1}
                        />
                        <span className="text-[11px] text-slate-500 italic">
                          (Referenced from 1) Document Boundaries)
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Field label="I) East:">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.physicalPlotBoundaries?.[idx]?.east ?? (idx === 0 ? fields.verifiedBoundaryEast || '' : '')}
                          onChange={(e) => handlePhysicalPlotBoundaryChange(idx, 'east', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="II) West:">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.physicalPlotBoundaries?.[idx]?.west ?? (idx === 0 ? fields.verifiedBoundaryWest || '' : '')}
                          onChange={(e) => handlePhysicalPlotBoundaryChange(idx, 'west', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="III) North:">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.physicalPlotBoundaries?.[idx]?.north ?? (idx === 0 ? fields.verifiedBoundaryNorth || '' : '')}
                          onChange={(e) => handlePhysicalPlotBoundaryChange(idx, 'north', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="IV) South:">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.physicalPlotBoundaries?.[idx]?.south ?? (idx === 0 ? fields.verifiedBoundarySouth || '' : '')}
                          onChange={(e) => handlePhysicalPlotBoundaryChange(idx, 'south', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 5. CHARACTERISTICS OF THE SITE */}
        <Section number={5} id="sec-site-char" title="II. Valuation of Land (4. Characteristics of the Site)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="A. Level of Land / Topography:">
                {renderSelect(
                  fields.levelOfLand,
                  ['Leveled and Plain', 'Low Lying Land', 'Elevated / Sloping Land', 'Uneven / Undulated Land'],
                  (v) => handleChange('levelOfLand', v),
                  isReadOnly,
                  'Leveled and Plain'
                )}
              </Field>
              <Field label="B. Permitted Use:">
                {renderSelect(
                  fields.useToWhichCanBePut,
                  ['Residential cum Commercial Purpose', 'Residential Purpose', 'Commercial Purpose', 'Industrial Purpose', 'Institutional Purpose'],
                  (v) => handleChange('useToWhichCanBePut', v),
                  isReadOnly,
                  'Residential cum Commercial Purpose'
                )}
              </Field>
              <Field label="C. Agreement of Easements (Encroachments):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.easementAgreements || ''}
                  onChange={(e) => handleChange('easementAgreements', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="D. Restrictive Covenant:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.restrictiveCovenant || ''}
                  onChange={(e) => handleChange('restrictiveCovenant', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="E. Development Agency Approval Letter No. & Date:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.approvalLetterNoDateDevelopment || ''}
                  onChange={(e) => handleChange('approvalLetterNoDateDevelopment', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="F. Building Use Certificate Obtained?:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.buildingUseCertificateObtained || ''}
                  onChange={(e) => handleChange('buildingUseCertificateObtained', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="G. Town Planning Scheme / Development Plan Inclusion:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.townPlanningSchemeInclusion || ''}
                  onChange={(e) => handleChange('townPlanningSchemeInclusion', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="H. Corner / Intermittent Plot:">
                <select
                  className={selectCls}
                  value={fields.cornerOrIntermittentPlot || 'Intermittent Plot'}
                  onChange={(e) => handleChange('cornerOrIntermittentPlot', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Intermittent Plot">Intermittent Plot</option>
                  <option value="Corner Plot">Corner Plot</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
              </Field>
            </div>

            {/* I. Land Locked & Free Access */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3 shadow-2xs">
              <h4 className="font-bold text-xs text-amber-900 tracking-wide uppercase pb-1.5 border-b border-amber-200/60">
                I. Land Locked &amp; Free Access
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="1) Is a Land Locked Land?:">
                  <select
                    className={selectCls}
                    value={fields.isLandLocked || 'No'}
                    onChange={(e) => handleChange('isLandLocked', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
                <Field label="2) Whether the Land is Having Free Access:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.hasFreeAccess || ''}
                    placeholder="e.g. Yes (15 ft wide CC Road)"
                    onChange={(e) => handleChange('hasFreeAccess', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* J. Means and Proximity to Surface Communication */}
            <Field label="J. Means and Proximity to Surface Communication by Which the Locality is Served:">
              <input
                type="text"
                className={inputCls}
                value={fields.surfaceCommunicationProximity || ''}
                onChange={(e) => {
                  handleChange('surfaceCommunicationProximity', e.target.value);
                  handleChange('freeAccessAndProximity', e.target.value);
                }}
                disabled={isReadOnly}
              />
            </Field>

            {/* K & L Road Facilities and Width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="K. Road Facilities:">
                {renderSelect(
                  fields.roadFacilities,
                  ['Yes, Available at site', 'No, Not Available at site', 'Yes', 'No'],
                  (v) => handleChange('roadFacilities', v),
                  isReadOnly,
                  'Yes, Available at site'
                )}
              </Field>
              <Field label="L. Road Kind & Width:">
                {renderSelect(
                  fields.roadKindAndWidth,
                  ['15 ft wide BT Road', '20 ft wide BT Road', '25 ft wide BT Road', '30 ft wide BT Road', '40 ft wide BT Road', '15 ft wide CC Road', '20 ft wide CC Road', '10 ft wide Morrum Road', 'Earthen Road'],
                  (v) => handleChange('roadKindAndWidth', v),
                  isReadOnly,
                  '15 ft wide BT Road'
                )}
              </Field>
            </div>

            {/* M. Distance from Municipal Office / Limits */}
            <div className="p-3.5 bg-violet-50/60 border border-violet-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="pb-3 border-b border-violet-200/60 space-y-2">
                <h4 className="font-bold text-xs text-violet-900 tracking-wide uppercase">
                  M. IF THE PROPERTY IS NOT WITHIN CITY/TOWN/MUNICIPAL LIMIT (STATE DISTANCE FROM):
                </h4>
                <Field label="Status / Condition:">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Within Municipal Corporation / Not Applicable"
                    value={fields.distMunicipalLimitStatus || ''}
                    onChange={(e) => handleChange('distMunicipalLimitStatus', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="a. Municipal Office:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distMunicipalOffice || ''}
                    onChange={(e) => handleChange('distMunicipalOffice', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="b. Municipal Limits:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distMunicipalLimits || ''}
                    onChange={(e) => handleChange('distMunicipalLimits', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* N to S Environmental & Infrastructure Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="N. Water Potentialities:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.waterPotentialities || ''}
                  onChange={(e) => handleChange('waterPotentialities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="O. Possibility of Frequent Flooding:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.possibilityFlooding || ''}
                  onChange={(e) => handleChange('possibilityFlooding', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="P. Underground Sewerage System:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.undergroundSewerageAvailable || ''}
                  onChange={(e) => handleChange('undergroundSewerageAvailable', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Q. Drainage Systems Available:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.drainageSystemsAvailable || ''}
                  onChange={(e) => handleChange('drainageSystemsAvailable', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="R. Power Supply Available?:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.powerSupplyAvailable || ''}
                  onChange={(e) => handleChange('powerSupplyAvailable', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="S. Surrounding Area Development:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.surroundingDevelopment || ''}
                  onChange={(e) => handleChange('surroundingDevelopment', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Civic Proximities T */}
            <div className="p-3.5 bg-sky-50/60 border border-sky-200/80 rounded-xl space-y-3 shadow-2xs">
              <p className="text-xs font-bold text-sky-900 uppercase tracking-wide pb-1.5 border-b border-sky-200/60">
                T. PROXIMITY TO CIVIC AMENITIES:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                <Field label="(i) School:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximitySchool || ''}
                    onChange={(e) => handleChange('proximitySchool', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(ii) College:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityCollege || ''}
                    onChange={(e) => handleChange('proximityCollege', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(iii) Hospital:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityHospital || ''}
                    onChange={(e) => handleChange('proximityHospital', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(iv) Market:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityMarket || ''}
                    onChange={(e) => handleChange('proximityMarket', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(v) Bus Stand:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityBusStand || ''}
                    onChange={(e) => handleChange('proximityBusStand', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(vi) Railway Station:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityRailwayStation || ''}
                    onChange={(e) => handleChange('proximityRailwayStation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(vii) Other Place:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityOtherPlace || ''}
                    onChange={(e) => handleChange('proximityOtherPlace', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* U. Latitude / Longitude Coordinates */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
                <h4 className="font-bold text-xs text-emerald-900 tracking-wide uppercase">
                  U. Latitude / Longitude Coordinates
                </h4>
                {fields.latitude && fields.longitude && (
                  <span className="text-[11px] font-mono font-semibold text-emerald-800 bg-white border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                    📍 {deriveCoordinates(fields.latitude, fields.longitude) || `${fields.latitude}, ${fields.longitude}`}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <Field label="Latitude (DD):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.latitude || ''}
                    onChange={(e) => {
                      const lat = e.target.value;
                      const lng = fields.longitude || '';
                      const combined = deriveCoordinates(lat, lng);
                      setFields((prev) => ({
                        ...prev,
                        latitude: lat,
                        latitudeLongitude: combined,
                      }));
                    }}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Longitude (DD):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.longitude || ''}
                    onChange={(e) => {
                      const lng = e.target.value;
                      const lat = fields.latitude || '';
                      const combined = deriveCoordinates(lat, lng);
                      setFields((prev) => ({
                        ...prev,
                        longitude: lng,
                        latitudeLongitude: combined,
                      }));
                    }}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Coordinates:">
                  <input
                    type="text"
                    className={inputCls + ' bg-slate-100/90 text-slate-800 font-medium cursor-default select-all'}
                    value={deriveCoordinates(fields.latitude, fields.longitude) || fields.latitudeLongitude || ''}
                    readOnly
                    tabIndex={-1}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 6. LOCATION ADVANTAGES & DISADVANTAGES */}
        <Section number={6} id="sec-location-adv-disadv" title="II. Valuation of Land (5. Location Advantages & Disadvantages)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <BulletListField
                label="A. Location Advantages:"
                value={fields.locationAdvantages}
                onChange={(val) => handleChange('locationAdvantages', val)}
                isReadOnly={isReadOnly}
              />
              <BulletListField
                label="B. Location Disadvantages (Details):"
                value={fields.locationDisadvantages}
                onChange={(val) => handleChange('locationDisadvantages', val)}
                isReadOnly={isReadOnly}
              />
            </div>
          </div>
        </Section>

        {/* 7. OTHER ISSUES/POINTS */}
        <Section number={7} id="sec-other-issues" title="II. Valuation of Land (6. Other Issues/Points)">
          <div className="space-y-4">
            <Field label="A. Land Acquisition Notification:">
              <input
                type="text"
                className={inputCls}
                value={fields.landAcquisitionNotification || ''}
                onChange={(e) => handleChange('landAcquisitionNotification', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="B. Development Contribution Demanded:">
              <input
                type="text"
                className={inputCls}
                value={fields.developmentContributionDemanded || ''}
                onChange={(e) => handleChange('developmentContributionDemanded', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="C. Urban Land Ceiling / Statutory Enactments:">
              <input
                type="text"
                className={inputCls}
                value={fields.landCeilingEnactments || ''}
                onChange={(e) => handleChange('landCeilingEnactments', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* D. Sales */}
            <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-xl space-y-3 shadow-2xs">
              <h4 className="font-bold text-orange-900 text-xs tracking-wide uppercase pb-1.5 border-b border-orange-200/60">
                D. SALES:
              </h4>
              <Field label="a. Give instance of sales of immovable property in the locality, if available, indicating the name and address of the property, registration no. sale price and area of the land sold:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.salesInstancesInLocality || ''}
                  onChange={(e) => handleChange('salesInstancesInLocality', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="b. If sale instance are not available or not relied upon, please furnished the basis of arriving at the land rate:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.salesBasisArrivingLandRate || ''}
                  onChange={(e) => handleChange('salesBasisArrivingLandRate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="c. Land Rate Adopted in this Valuation:">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.adoptedLandRateRationale || ''}
                  onChange={(e) => handleChange('adoptedLandRateRationale', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* 8. VALUATION */}
        <Section number={8} id="sec-land-valuation" title="II. Valuation of Land (7. Valuation)">
          <div className="space-y-4">
            {/* A. Previous Valuation Details */}
            <Field label="A. Previous Valuation Details:">
              <input
                type="text"
                className={inputCls}
                value={fields.previousValuationDetails !== undefined ? fields.previousValuationDetails : 'Not Available'}
                onChange={(e) => handleChange('previousValuationDetails', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* B. Present Valuation Details */}
            <div className="p-4 bg-blue-50/40 border border-blue-200/70 rounded-xl space-y-4 shadow-2xs">
              <div className="pb-3.5 border-b border-blue-200/60 space-y-3">
                <div>
                  <h4 className="font-bold text-blue-900 text-xs tracking-wide uppercase">
                    B. PRESENT VALUATION DETAILS:
                  </h4>
                  <p className="text-xs text-blue-700/80 italic mt-0.5">
                    (HERE THE REGISTERED VALUER SHOULD DISCUSS IN DETAIL HIS APPROACH IN VALUATION OF THE PROPERTY AND INDICATE HOW THE VALUE HAS BEEN ARRIVED AT, SUPPORTED BY NECESSARY CALCULATIONS.)
                  </p>
                </div>
                <Field label="Approach in Valuation of the Property:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.presentValuationApproachDetails || ''}
                    onChange={(e) => handleChange('presentValuationApproachDetails', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* 1. Valuation of Land */}
              <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-xl space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-indigo-200/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-indigo-900 tracking-wide uppercase">1. VALUATION OF LAND:</span>
                    <span className="text-[11px] font-medium text-indigo-700 bg-white border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                      <span>↳ Referenced from:</span>
                      <span className="font-semibold">E. Area of Land (As per Title Deed)</span>
                    </span>
                  </div>
                  {fields.areaLandDoc && (fields.landAreaTotal || '') !== fields.areaLandDoc && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleChange('landAreaTotal', fields.areaLandDoc || '')}
                      className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-50 border border-indigo-300 px-2.5 py-1 rounded-md cursor-pointer transition-all shadow-2xs"
                      title="Reset value to match Section 2 Point E (Title Deed Area)"
                    >
                      ↻ Sync from Title Deed
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.landAreaTotal !== undefined ? fields.landAreaTotal : (fields.areaLandDoc || '')}
                    onChange={(e) => handleChange('landAreaTotal', e.target.value)}
                    disabled={isReadOnly}
                  />
                  <div className="text-[11px] text-indigo-700/80 px-0.5">
                    <span>Editable statement for statutory valuation calculation.</span>
                  </div>
                </div>
              </div>

              {/* 2. Govt. Value */}
              <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-blue-200/60">
                  <span className="text-xs font-bold text-blue-900 tracking-wide uppercase">2. GOVT. VALUE (Benchmark & Guideline Value):</span>
                  <span className="text-[11px] text-blue-800 bg-white border border-blue-200 px-2 py-0.5 rounded-md font-medium shadow-2xs">
                    Area: <span className="font-semibold text-blue-950">{parseSqftFromArea(fields.landAreaTotal || fields.areaLandDoc || fields.extentOfSite, fields.landAreaUnit, fields.landAreaValue).toFixed(2)} Sft</span>
                  </span>
                </div>

                {/* Referenced Area Box from Section 2 Point E */}
                <div className="p-3 bg-blue-100/50 border border-blue-200/90 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-blue-900">Area of Land (As per Title Deed):</span>
                    <span className="text-[11px] font-medium text-blue-700 bg-white border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
                      ↳ Referenced from E. Area of Land
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                    <div>
                      <span className="text-[11px] text-blue-800/80 block mb-0.5 font-medium">Deed Area Statement:</span>
                      <input
                        type="text"
                        className={inputCls + ' text-slate-800 font-medium cursor-not-allowed select-all'}
                        value={fields.areaLandDoc || fields.landAreaTotal || fields.extentOfSite || 'Not Available'}
                        readOnly
                        tabIndex={-1}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-blue-800/80 block mb-0.5 font-medium">Calculated Area in Sq.Ft (Read-Only):</span>
                      <input
                        type="text"
                        className={inputCls + ' text-slate-800 font-bold cursor-not-allowed select-all'}
                        value={`${parseSqftFromArea(fields.landAreaTotal || fields.areaLandDoc || fields.extentOfSite, fields.landAreaUnit, fields.landAreaValue).toFixed(2)} Sft`}
                        readOnly
                        tabIndex={-1}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <Field label="Govt. Benchmark Value Unit:">
                      <select
                        className={selectCls}
                        value={fields.landGovtBenchmarkUnit || 'ACRE'}
                        onChange={(e) => {
                          const newUnit = e.target.value;
                          const rawVal = fields.landGovtBenchmarkValue || fields.landGovtBenchmarkPerAcre || '';
                          const valNum = parseFloat(rawVal) || 0;
                          const factor = getBenchmarkUnitFactor(newUnit);
                          const sftRate = valNum > 0 ? (valNum / factor) : 0;
                          const roundedRate = sftRate > 0 ? (sftRate % 1 === 0 ? String(Math.round(sftRate)) : sftRate.toFixed(2)) : '';
                          const perAcreVal = newUnit === 'ACRE' ? rawVal : (valNum > 0 ? String(Math.round(sftRate * 43560)) : '');
                          const pArea = parseSqftFromArea(fields.landAreaTotal || fields.extentOfSite || fields.areaLandDoc, fields.landAreaUnit, fields.landAreaValue);
                          const derivedStmt = rawVal ? formatGovtGuidelineStatement(pArea, sftRate) : '';
                          setFields(prev => ({
                            ...prev,
                            landGovtBenchmarkUnit: newUnit,
                            landGovtBenchmarkPerAcre: perAcreVal,
                            landGovtBenchmarkRate: roundedRate,
                            landGovtValueTotal: derivedStmt,
                          }));
                        }}
                        disabled={isReadOnly}
                      >
                        <option value="ACRE">Per Acre</option>
                        <option value="DECIMAL">Per Decimal</option>
                        <option value="SQFT">Per Sq.Ft</option>
                        <option value="SQYD">Per Sq.Yards</option>
                        <option value="SQMT">Per Sq.Meters</option>
                        <option value="HECTARE">Per Hectare</option>
                        <option value="GUNTHA">Per Guntha</option>
                        <option value="CENT">Per Cent</option>
                        <option value="BIGHA">Per Bigha</option>
                      </select>
                    </Field>
                  </div>

                  <div className="sm:col-span-4">
                    <Field label="Govt. Benchmark Value:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.landGovtBenchmarkValue || fields.landGovtBenchmarkPerAcre || ''}
                        onChange={(e) => {
                          const clean = sanitizePositiveFloat(e.target.value);
                          const unit = fields.landGovtBenchmarkUnit || 'ACRE';
                          const factor = getBenchmarkUnitFactor(unit);
                          const valNum = parseFloat(clean) || 0;
                          const sftRate = valNum > 0 ? (valNum / factor) : 0;
                          const roundedRate = sftRate > 0 ? (sftRate % 1 === 0 ? String(Math.round(sftRate)) : sftRate.toFixed(2)) : '';
                          const perAcreVal = unit === 'ACRE' ? clean : (valNum > 0 ? String(Math.round(sftRate * 43560)) : '');
                          const pArea = parseSqftFromArea(fields.landAreaTotal || fields.extentOfSite || fields.areaLandDoc, fields.landAreaUnit, fields.landAreaValue);
                          const derivedStmt = clean ? formatGovtGuidelineStatement(pArea, sftRate) : '';
                          setFields(prev => ({
                            ...prev,
                            landGovtBenchmarkValue: clean,
                            landGovtBenchmarkPerAcre: perAcreVal,
                            landGovtBenchmarkRate: roundedRate,
                            landGovtValueTotal: derivedStmt,
                          }));
                        }}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-4">
                    <Field label="Govt. Benchmark Land Rate (Rs./Sq.ft):">
                      <input
                        type="text"
                        className={inputCls + ' text-slate-800 font-medium cursor-not-allowed select-all'}
                        value={fields.landGovtBenchmarkRate || ''}
                        readOnly
                        tabIndex={-1}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Guideline Value Statement:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.landGovtValueTotal !== undefined ? fields.landGovtValueTotal : ''}
                    onChange={(e) => handleChange('landGovtValueTotal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* 3. Market Value */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-3 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-emerald-200/60">
                  <span className="text-xs font-bold text-emerald-900 tracking-wide uppercase">3. MARKET VALUE:</span>
                  <span className="text-[11px] text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md font-medium shadow-2xs">
                    Area: <span className="font-semibold text-emerald-950">{parseSqftFromArea(fields.landAreaTotal || fields.areaLandDoc || fields.extentOfSite, fields.landAreaUnit, fields.landAreaValue).toFixed(2)} Sft</span>
                  </span>
                </div>

                {/* Referenced Area Box from Section 2 Point E */}
                <div className="p-3 bg-emerald-100/50 border border-emerald-200/90 rounded-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-900">Area of Land (As per Title Deed):</span>
                    <span className="text-[11px] font-medium text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
                      ↳ Referenced from E. Area of Land
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                    <div>
                      <span className="text-[11px] text-emerald-800/80 block mb-0.5 font-medium">Deed Area Statement:</span>
                      <input
                        type="text"
                        className={inputCls + ' text-slate-800 font-medium cursor-not-allowed select-all'}
                        value={fields.areaLandDoc || fields.landAreaTotal || fields.extentOfSite || 'Not Available'}
                        readOnly
                        tabIndex={-1}
                        disabled={isReadOnly}
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-emerald-800/80 block mb-0.5 font-medium">Calculated Area in Sq.Ft (Read-Only):</span>
                      <input
                        type="text"
                        className={inputCls + ' text-slate-800 font-bold cursor-not-allowed select-all'}
                        value={`${parseSqftFromArea(fields.landAreaTotal || fields.areaLandDoc || fields.extentOfSite, fields.landAreaUnit, fields.landAreaValue).toFixed(2)} Sft`}
                        readOnly
                        tabIndex={-1}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-4">
                    <Field label="Adopted Market Land Rate Unit:">
                      <select
                        className={selectCls}
                        value={fields.landMarketUnit || 'SQFT'}
                        onChange={(e) => {
                          const newUnit = e.target.value;
                          const rawVal = fields.landMarketRateInput !== undefined ? fields.landMarketRateInput : (fields.landMarketRate || '');
                          const valNum = parseFloat(rawVal) || 0;
                          const factor = getBenchmarkUnitFactor(newUnit);
                          const sftRate = valNum > 0 ? (valNum / factor) : 0;
                          const roundedRate = sftRate > 0 ? (sftRate % 1 === 0 ? String(Math.round(sftRate)) : sftRate.toFixed(2)) : '';
                          const pArea = parseSqftFromArea(fields.landAreaTotal || fields.extentOfSite || fields.areaLandDoc, fields.landAreaUnit, fields.landAreaValue);
                          const derivedStmt = rawVal ? formatMarketValueStatement(pArea, sftRate) : '';
                          setFields(prev => ({
                            ...prev,
                            landMarketUnit: newUnit,
                            landMarketRate: roundedRate,
                            landMarketValueTotal: derivedStmt,
                          }));
                        }}
                        disabled={isReadOnly}
                      >
                        <option value="SQFT">Per Sq.Ft</option>
                        <option value="DECIMAL">Per Decimal</option>
                        <option value="ACRE">Per Acre</option>
                        <option value="SQYD">Per Sq.Yards</option>
                        <option value="SQMT">Per Sq.Meters</option>
                        <option value="HECTARE">Per Hectare</option>
                        <option value="GUNTHA">Per Guntha</option>
                        <option value="CENT">Per Cent</option>
                        <option value="BIGHA">Per Bigha</option>
                      </select>
                    </Field>
                  </div>

                  <div className="sm:col-span-4">
                    <Field label="Adopted Market Land Rate:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.landMarketRateInput !== undefined ? fields.landMarketRateInput : (fields.landMarketRate || '')}
                        onChange={(e) => {
                          const clean = sanitizePositiveFloat(e.target.value);
                          const unit = fields.landMarketUnit || 'SQFT';
                          const factor = getBenchmarkUnitFactor(unit);
                          const valNum = parseFloat(clean) || 0;
                          const sftRate = valNum > 0 ? (valNum / factor) : 0;
                          const roundedRate = sftRate > 0 ? (sftRate % 1 === 0 ? String(Math.round(sftRate)) : sftRate.toFixed(2)) : '';
                          const pArea = parseSqftFromArea(fields.landAreaTotal || fields.extentOfSite || fields.areaLandDoc, fields.landAreaUnit, fields.landAreaValue);
                          const derivedStmt = clean ? formatMarketValueStatement(pArea, sftRate) : '';
                          setFields(prev => ({
                            ...prev,
                            landMarketRateInput: clean,
                            landMarketRate: roundedRate,
                            landMarketValueTotal: derivedStmt,
                          }));
                        }}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>

                  <div className="sm:col-span-4">
                    <Field label="Adopted Market Land Rate (Rs./Sq.ft):">
                      <input
                        type="text"
                        className={inputCls + ' text-slate-800 font-medium cursor-not-allowed select-all'}
                        value={fields.landMarketRate || ''}
                        readOnly
                        tabIndex={-1}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <Field label="Market Value:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.landMarketValueTotal !== undefined ? fields.landMarketValueTotal : ''}
                    onChange={(e) => handleChange('landMarketValueTotal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* 4 & 5. Distress Sale & Realisable Estimation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 4. Distress */}
                <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                    <span className="text-xs font-bold text-amber-900 tracking-wide uppercase">4. DISTRESS SALE VALUE</span>
                    <span className="text-[10px] font-semibold text-amber-800 bg-white border border-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <span>🔒 Read-Only (Auto-calculated)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Distress %:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.distressSalePct !== undefined ? fields.distressSalePct : '85'}
                        onChange={(e) => handleChange('distressSalePct', sanitizePercentage(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <div className="col-span-2">
                      <Field label={`4. Distress Sale Value (${fields.distressSalePct !== undefined && fields.distressSalePct !== '' ? fields.distressSalePct : '100'}%):`}>
                        <input
                          type="text"
                          className={`${inputCls} font-bold text-slate-800 cursor-not-allowed border-amber-200`}
                          value={fields.landDistressValue || ''}
                          readOnly
                          disabled
                        />
                      </Field>
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-800/80 italic">
                    Auto-calculated as {fields.distressSalePct !== undefined && fields.distressSalePct !== '' ? fields.distressSalePct : '100'}% of Total Market Value.
                  </p>
                </div>

                {/* 5. Realisable */}
                <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
                    <span className="text-xs font-bold text-purple-900 tracking-wide uppercase">5. REALISABLE ESTIMATION</span>
                    <span className="text-[10px] font-semibold text-purple-800 bg-white border border-purple-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <span>🔒 Read-Only (Auto-calculated)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Realisable %:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.realisableValuePct !== undefined ? fields.realisableValuePct : '95'}
                        onChange={(e) => handleChange('realisableValuePct', sanitizePercentage(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <div className="col-span-2">
                      <Field label={`5. Realisable Value (${fields.realisableValuePct !== undefined && fields.realisableValuePct !== '' ? fields.realisableValuePct : '100'}%):`}>
                        <input
                          type="text"
                          className={`${inputCls} font-bold text-slate-800 cursor-not-allowed border-purple-200`}
                          value={fields.landRealisableValue || ''}
                          readOnly
                          disabled
                        />
                      </Field>
                    </div>
                  </div>
                  <p className="text-[11px] text-purple-800/80 italic leading-snug">
                    Auto-calculated as {fields.realisableValuePct !== undefined && fields.realisableValuePct !== '' ? fields.realisableValuePct : '100'}% of Total Market Value (distress bank sale estimation).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. BASIC INFORMATION OF THE BUILDING */}
        <Section number={9} id="sec-bldg-basic" title="III. Valuation of Building (1. Basic Information of the Building)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="A. Type of Building:">
              {renderSelect(
                fields.buildingType,
                ['Residential Cum Commercial', 'Residential Building', 'Commercial Building', 'Industrial Building', 'Apartment / Residential Flat'],
                (v) => handleChange('buildingType', v),
                isReadOnly,
                'Residential Cum Commercial'
              )}
            </Field>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-800">
                B. Year of Commencement &amp; Completion:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[11px] font-medium text-slate-600 block mb-1">Year of Construction:</span>
                  <input
                    type="text"
                    maxLength={4}
                    className={inputCls}
                    value={fields.yearConstruction || ''}
                    onChange={(e) => {
                      const clean = sanitizePositiveInt(e.target.value, 4);
                      const combined = formatYearCommencementCompletion(clean, fields.yearCompletion);
                      setFields((prev) => ({
                        ...prev,
                        yearConstruction: clean,
                        yearCommencementCompletion: combined,
                      }));
                    }}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-600 block mb-1">Year of Completion:</span>
                  <input
                    type="text"
                    maxLength={4}
                    className={inputCls}
                    value={fields.yearCompletion || ''}
                    onChange={(e) => {
                      const clean = sanitizePositiveInt(e.target.value, 4);
                      const combined = formatYearCommencementCompletion(fields.yearConstruction, clean);
                      setFields((prev) => ({
                        ...prev,
                        yearCompletion: clean,
                        yearCommencementCompletion: combined,
                      }));
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
            <Field label="C. Construction Type:">
              {renderSelect(
                fields.typeOfConstruction,
                ['RCC Frames', 'Load Bearing Masonry', 'Steel Framed Structure', 'Aluform / Mivan Structure'],
                (v) => {
                  const actualStmt = formatActualBuiltUpStatement(fields.floorDetails, v);
                  setFields((prev) => ({
                    ...prev,
                    typeOfConstruction: v,
                    builtUpAreaAsPerActual: actualStmt,
                  }));
                },
                isReadOnly,
                'RCC Frames'
              )}
            </Field>
            <Field label="D. Estimated Future Life (Years):">
              <input
                type="text"
                className={inputCls}
                value={fields.estimatedFutureLife || ''}
                onChange={(e) => handleChange('estimatedFutureLife', sanitizePositiveInt(e.target.value, 3))}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="E. FAR / FSI Permissible & Utilized:">
              <input
                type="text"
                className={inputCls}
                value={fields.farFsiPermissibleUtilized || ''}
                onChange={(e) => handleChange('farFsiPermissibleUtilized', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="F. Approval Letter / Authority Details:">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingApprovalAuthorityDetails || ''}
                onChange={(e) => handleChange('buildingApprovalAuthorityDetails', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="G. Construction as per Approved Plan?:">
              {renderSelect(
                fields.constructionAsPerPlanDeviations,
                ['Yes', 'No', 'Minor Deviations', 'Deviations within permissible limits'],
                (v) => handleChange('constructionAsPerPlanDeviations', v),
                isReadOnly,
                'Yes'
              )}
            </Field>

            {/* H. Built up Area Details */}
            <div className="sm:col-span-2 p-4 bg-indigo-50/50 border border-indigo-200/80 rounded-xl space-y-4 shadow-2xs">
              <div className="pb-1.5 border-b border-indigo-200/60">
                <h4 className="font-bold text-xs text-indigo-950 tracking-wide uppercase">
                  H. BUILT UP AREA, CARPET AREA &amp; SALEABLE AREA
                </h4>
              </div>

              {/* 1). Built up area */}
              <div className="p-3.5 bg-white border border-indigo-200/70 rounded-lg space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-indigo-100">
                  <span className="font-bold text-xs text-indigo-900 uppercase tracking-wide">
                    1). Built up area
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* a) As per Assessment of Holding */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                      <span className="text-xs font-semibold text-slate-800">
                        a) As per Assessment of Holding:
                      </span>
                      {fields.assessmentResidentialArea || fields.assessmentCommercialArea ? (
                        <span className="text-[10px] font-bold text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded shadow-2xs">
                          Total: {((parseFloat(fields.assessmentResidentialArea || '0') || 0) + (parseFloat(fields.assessmentCommercialArea || '0') || 0)).toFixed(2)} Sft
                        </span>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[11px] font-medium text-slate-600 block mb-1">Residential Plinth Area (Sft):</span>
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.assessmentResidentialArea || ''}
                          onChange={(e) => {
                            const clean = sanitizePositiveFloat(e.target.value);
                            const stmt = formatAssessmentHoldingStatement(clean, fields.assessmentCommercialArea);
                            setFields((prev) => ({
                              ...prev,
                              assessmentResidentialArea: clean,
                              builtUpAreaAssessmentHolding: stmt,
                            }));
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-600 block mb-1">Commercial Plinth Area (Sft):</span>
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.assessmentCommercialArea || ''}
                          onChange={(e) => {
                            const clean = sanitizePositiveFloat(e.target.value);
                            const stmt = formatAssessmentHoldingStatement(fields.assessmentResidentialArea, clean);
                            setFields((prev) => ({
                              ...prev,
                              assessmentCommercialArea: clean,
                              builtUpAreaAssessmentHolding: stmt,
                            }));
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </div>

                  {/* b) As per Actual */}
                  <div className="p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-lg space-y-2.5">
                    <div className="flex items-center justify-between pb-1 border-b border-emerald-100">
                      <span className="text-xs font-semibold text-emerald-950">
                        b) As per Actual ({getStructurePrefix(fields.typeOfConstruction)} Structure):
                      </span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-white border border-emerald-300 px-2 py-0.5 rounded shadow-2xs">
                        Total: {(fields.floorDetails || []).reduce((acc, f) => acc + (parseFloat(String(f.plinthArea || '0').replace(/[^0-9.]/g, '')) || 0), 0).toFixed(2)} Sft
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {(fields.floorDetails || []).map((fl, idx) => {
                          const prefix = getStructurePrefix(fields.typeOfConstruction);
                          return (
                            <div key={idx} className="space-y-1">
                              <span className="text-[11px] font-medium text-emerald-900 block truncate">
                                {prefix} {fl.floorName} Area (Sft):
                              </span>
                              <input
                                type="text"
                                className={inputCls}
                                value={fl.plinthArea || ''}
                                onChange={(e) => {
                                  const clean = sanitizePositiveFloat(e.target.value);
                                  const updatedFloors = [...(fields.floorDetails || [])];
                                  updatedFloors[idx] = { ...updatedFloors[idx], plinthArea: clean };
                                  const actualStmt = formatActualBuiltUpStatement(updatedFloors, fields.typeOfConstruction);
                                  const totalActual = updatedFloors.reduce((acc, f) => acc + (parseFloat(String(f.plinthArea || '0').replace(/[^0-9.]/g, '')) || 0), 0);
                                  
                                  setFields((prev) => {
                                    const nextSaleable = !prev.saleableAreaValue || prev.saleableAreaValue === prev.saleableAreaTotal?.replace(/[^0-9.]/g, '')
                                      ? (totalActual > 0 ? totalActual.toFixed(2) : '')
                                      : prev.saleableAreaValue;
                                    return {
                                      ...prev,
                                      floorDetails: updatedFloors,
                                      builtUpAreaAsPerActual: actualStmt,
                                      saleableAreaValue: nextSaleable,
                                      saleableAreaTotal: nextSaleable ? formatSaleableAreaStatement(nextSaleable) : '',
                                    };
                                  });
                                }}
                                disabled={isReadOnly}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2). Carpet Area & 3). Saleable Area */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-indigo-200/70 rounded-lg space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800">2). Carpet Area (Sft):</label>
                    {fields.carpetAreaValue && (
                      <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                        {formatCarpetAreaStatement(fields.carpetAreaValue)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.carpetAreaValue || ''}
                    onChange={(e) => {
                      const clean = sanitizePositiveFloat(e.target.value);
                      const stmt = formatCarpetAreaStatement(clean);
                      setFields((prev) => ({
                        ...prev,
                        carpetAreaValue: clean,
                        carpetAreaTotal: stmt,
                      }));
                    }}
                    disabled={isReadOnly}
                  />
                </div>

                <div className="p-3 bg-white border border-indigo-200/70 rounded-lg space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800">3). Saleable Area (Sft):</label>
                    {fields.saleableAreaValue && (
                      <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                        {formatSaleableAreaStatement(fields.saleableAreaValue)}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.saleableAreaValue || ''}
                    onChange={(e) => {
                      const clean = sanitizePositiveFloat(e.target.value);
                      const stmt = formatSaleableAreaStatement(clean);
                      setFields((prev) => ({
                        ...prev,
                        saleableAreaValue: clean,
                        saleableAreaTotal: stmt,
                      }));
                    }}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>

            {/* Points I to AB: Direct continuation of 1. Basic Information */}
            <Field label="I. Occupancy Status:">
              {renderSelect(
                fields.buildingOwnerOccupiedTenanted,
                ['Owner Occupied', 'Tenanted', 'Both', 'Partly Owner Occupied and Partly Tenanted', 'Vacant'],
                (v) => handleChange('buildingOwnerOccupiedTenanted', v),
                isReadOnly,
                'Owner Occupied'
              )}
            </Field>

            <Field label="J. Owner-Occupied Portion & Extent:">
              <input
                type="text"
                className={inputCls}
                value={fields.ownerOccupiedPortion || ''}
                onChange={(e) => handleChange('ownerOccupiedPortion', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="K. Under Rent Control Act:">
              {renderSelect(
                fields.isUnderRentControlAct,
                ['No', 'Yes', 'Not Applicable'],
                (v) => handleChange('isUnderRentControlAct', v),
                isReadOnly,
                'No'
              )}
            </Field>

            <Field label="L. Names of Tenants / Lessees:">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingTenantNames || ''}
                onChange={(e) => handleChange('buildingTenantNames', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="M. Portions in Their Occupation:">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingTenantPortions || ''}
                onChange={(e) => handleChange('buildingTenantPortions', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="N. Monthly / Annual Rent Paid:">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingMonthlyRent || ''}
                onChange={(e) => handleChange('buildingMonthlyRent', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="O. Gross Rent Received (Whole Property):">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingGrossRent || ''}
                onChange={(e) => handleChange('buildingGrossRent', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="P. Occupants Related to Owner:">
              {renderSelect(
                fields.occupantsRelatedToOwner,
                ['Not Applicable', 'No', 'Yes', 'Owner Family Members'],
                (v) => handleChange('occupantsRelatedToOwner', v),
                isReadOnly,
                'Not Applicable'
              )}
            </Field>

            <Field label="Q. Fixtures Charges Borne By:">
              {renderSelect(
                fields.fixturesAmountRecovered,
                ['Borne by Owner', 'Borne by Tenant', 'Shared Equally', 'Not Applicable'],
                (v) => handleChange('fixturesAmountRecovered', v),
                isReadOnly,
                'Borne by Owner'
              )}
            </Field>

            <Field label="R. Water & Electricity Borne By:">
              {renderSelect(
                fields.waterElectricityChargesBorneBy,
                ['Borne by Owner', 'Borne by Tenant', 'Shared Equally', 'Not Applicable'],
                (v) => handleChange('waterElectricityChargesBorneBy', v),
                isReadOnly,
                'Borne by Owner'
              )}
            </Field>

            <Field label="S. Rent Dispute in Court:">
              {renderSelect(
                fields.isRentDisputePendingCourt,
                ['No', 'Yes', 'Not Applicable'],
                (v) => handleChange('isRentDisputePendingCourt', v),
                isReadOnly,
                'No'
              )}
            </Field>

            <Field label="T. Standard Rent Fixed:">
              {renderSelect(
                fields.hasStandardRentFixed,
                ['Not Applicable', 'No', 'Yes'],
                (v) => handleChange('hasStandardRentFixed', v),
                isReadOnly,
                'Not Applicable'
              )}
            </Field>

            <Field label="U. Tenant Bears Repairs Cost:">
              {renderSelect(
                fields.tenantBearMaintenance,
                ['Not Applicable', 'No', 'Yes', 'Partly Borne'],
                (v) => handleChange('tenantBearMaintenance', v),
                isReadOnly,
                'Not Applicable'
              )}
            </Field>

            <Field label="V. Lift Maintenance Borne By:">
              {renderSelect(
                fields.liftMaintenanceBorneBy,
                ['Not Applicable', 'Borne by Owner', 'Borne by Tenant', 'Shared by Society / Occupants'],
                (v) => handleChange('liftMaintenanceBorneBy', v),
                isReadOnly,
                'Not Applicable'
              )}
            </Field>

            <Field label="W. Pump Maintenance Borne By:">
              {renderSelect(
                fields.pumpMaintenanceBorneBy,
                ['Borne by Owner', 'Borne by Tenant', 'Commonly Shared', 'Not Applicable'],
                (v) => handleChange('pumpMaintenanceBorneBy', v),
                isReadOnly,
                'Borne by Owner'
              )}
            </Field>

            <Field label="X. Common Electricity Borne By:">
              {renderSelect(
                fields.commonElectricityBorneBy,
                ['Borne by Owner', 'Borne by Tenant', 'Commonly Shared', 'Not Applicable'],
                (v) => handleChange('commonElectricityBorneBy', v),
                isReadOnly,
                'Borne by Owner'
              )}
            </Field>

            <Field label="Y. Property Tax Amount & Borne By:">
              <input
                type="text"
                className={inputCls}
                value={fields.propertyTaxAmountBorneBy || ''}
                onChange={(e) => handleChange('propertyTaxAmountBorneBy', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Z. Building Insurance Details (Policy, Risk, Amount):">
              <input
                type="text"
                className={inputCls}
                value={fields.isBuildingInsuredDetails || ''}
                onChange={(e) => handleChange('isBuildingInsuredDetails', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="AA. Up to Date Statutory Dues Paid:">
              {renderSelect(
                fields.statutoryDuesPaid,
                ['No such document is verified', 'Yes, Verified & Paid', 'Paid up to date', 'Not Applicable'],
                (v) => handleChange('statutoryDuesPaid', v),
                isReadOnly,
                'No such document is verified'
              )}
            </Field>

            <Field label="AB. Building Free Access:">
              {renderSelect(
                fields.buildingFreeAccess,
                ['Yes', 'No', 'Yes, via Municipal Road', 'Yes, via 15 ft CC Road'],
                (v) => handleChange('buildingFreeAccess', v),
                isReadOnly,
                'Yes'
              )}
            </Field>
          </div>
        </Section>

        {/* 10. TECHNICAL DETAILS OF THE BUILDING */}
        <Section number={10} id="sec-bldg-tech" title="III. Valuation of Building (2. Technical Details of Building)">
          <div className="space-y-4">
            {/* A. Number of Floors & Height */}
            <div className="p-4 bg-sky-50/60 border border-sky-200/80 rounded-xl space-y-4 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-sky-200/60">
                <div>
                  <h4 className="font-bold text-sky-900 text-xs tracking-wide uppercase">
                    A. NUMBER OF FLOORS &amp; HEIGHT OF EACH FLOOR
                  </h4>
                  <p className="text-[11px] text-sky-800/80">
                    Define the floor schedule and heights below. The floor entries defined here dynamically populate Points B, E, F, and G.
                  </p>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddFloorDetail}
                    className="px-3 py-1.5 text-xs font-semibold text-sky-800 bg-white hover:bg-sky-100 border border-sky-300 rounded-lg cursor-pointer transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <span>+ Add Floor</span>
                  </button>
                )}
              </div>

              {/* Divided Building Structure & Height Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-white border border-sky-200/80 rounded-xl shadow-2xs">
                <Field label="Building Stories / Structure:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.buildingStoriesDescription !== undefined ? fields.buildingStoriesDescription : deriveBuildingStories(fields.floorDetails)}
                    onChange={(e) => {
                      const newStories = e.target.value;
                      const currentHeight = fields.buildingStandardHeight || (fields.floorDetails?.[0]?.height || "10'-6\"");
                      const stmt = formatFloorSummaryStatement(newStories, currentHeight);
                      setFields((prev) => ({
                        ...prev,
                        buildingStoriesDescription: newStories,
                        numberOfFloorsAndHeight: stmt,
                      }));
                    }}
                    placeholder="e.g. G+3 Storied Building"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Standard / Total Height:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.buildingStandardHeight || (fields.floorDetails?.[0]?.height || "10'-6\"")}
                    onChange={(e) => {
                      const newHeight = e.target.value;
                      const currentStories = fields.buildingStoriesDescription !== undefined ? fields.buildingStoriesDescription : deriveBuildingStories(fields.floorDetails);
                      const stmt = formatFloorSummaryStatement(currentStories, newHeight);
                      setFields((prev) => ({
                        ...prev,
                        buildingStandardHeight: newHeight,
                        numberOfFloorsAndHeight: stmt,
                      }));
                    }}
                    placeholder="e.g. 10'-6&quot;"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="A. Summary Statement (Stories & Height):">
                  <input
                    type="text"
                    className={`${inputCls} font-semibold text-slate-800`}
                    value={fields.numberOfFloorsAndHeight || ''}
                    onChange={(e) => handleChange('numberOfFloorsAndHeight', e.target.value)}
                    placeholder="e.g. G+3 Storied Building & Height: 10'-6&quot;"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Floor-Wise Height Details */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-sky-950 block uppercase tracking-wider">
                    Floor-Wise Height Details (Points A.i, A.ii...):
                  </span>
                  <span className="text-[11px] text-sky-800 font-semibold bg-white border border-sky-200 px-2 py-0.5 rounded-md shadow-2xs">
                    Total Floors: {(fields.floorDetails || []).length}
                  </span>
                </div>

                {(!fields.floorDetails || fields.floorDetails.length === 0) ? (
                  <div className="p-4 bg-white border border-dashed border-sky-300 rounded-lg text-center text-xs text-sky-700 space-y-2">
                    <p>No floors added. Click the button below to add floors in sequence (Ground, First, Second, etc.).</p>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleAddFloorDetail}
                        className="px-3 py-1 text-xs font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-300 rounded-md cursor-pointer transition-all"
                      >
                        + Add Ground Floor
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {fields.floorDetails.map((fl, idx) => {
                      const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)', '(xi)', '(xii)', '(xiii)', '(xiv)', '(xv)', '(xvi)', '(xvii)', '(xviii)', '(xix)', '(xx)'];
                      const rom = romans[idx] || `(${idx + 1})`;
                      return (
                        <div key={idx} className="p-3 bg-white border border-sky-200/80 rounded-lg space-y-2 shadow-2xs">
                          <div className="flex items-center justify-between pb-1.5 border-b border-sky-100">
                            <div className="flex items-center gap-1.5 flex-1 mr-2">
                              <span className="font-bold text-xs text-sky-800">{rom}</span>
                              <input
                                type="text"
                                className="font-semibold text-xs text-slate-900 border-b border-sky-200 focus:outline-none focus:border-sky-500 w-full px-1 py-0.5"
                                value={fl.floorName}
                                onChange={(e) => handleFloorDetailChange(idx, 'floorName', e.target.value)}
                                disabled={isReadOnly}
                              />
                            </div>
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleRemoveFloorDetail(idx)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs font-bold cursor-pointer px-1.5 py-0.5 rounded transition-all"
                                title="Delete floor"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          <Field label="Height:">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.height || ''}
                              onChange={(e) => handleFloorDetailChange(idx, 'height', e.target.value)}
                              disabled={isReadOnly}
                            />
                          </Field>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* B. Plinth Area Floor-Wise (Nested Schedule Container) */}
            <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-purple-200/60">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-purple-900 text-xs tracking-wide uppercase">
                    B. PLINTH AREA FLOOR-WISE
                  </h4>
                  <span className="text-[11px] font-medium text-purple-800 bg-white border border-purple-200 px-2 py-0.5 rounded-md shadow-2xs">
                    ↳ Referenced from Point A ({(fields.floorDetails || []).length} Floors)
                  </span>
                </div>
                <span className="text-xs font-semibold text-purple-900 bg-white border border-purple-200 px-2.5 py-1 rounded-md shadow-2xs">
                  Total Floor Plinth Area: {(fields.floorDetails || []).reduce((acc, f) => acc + (parseFloat(String(f.plinthArea).replace(/[^0-9.]/g, '')) || 0), 0).toFixed(2)} Sft
                </span>
              </div>

              {(!fields.floorDetails || fields.floorDetails.length === 0) ? (
                <div className="p-3 bg-white border border-dashed border-purple-300 rounded-lg text-xs text-purple-600 italic text-center">
                  No floors added in the schedule. Add floors in Point A above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {fields.floorDetails.map((fl, idx) => (
                    <div key={idx} className="p-3 bg-white border border-purple-200/80 rounded-lg space-y-1.5 shadow-2xs">
                      <span className="font-bold text-xs text-purple-900 block">
                        {idx + 1}. {fl.floorName}
                      </span>
                      <Field label="Plinth Area (Sft):">
                        <input
                          type="text"
                          className={inputCls}
                          value={fl.plinthArea || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'plinthArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* C. Condition of the Building (Nested Container) */}
            <div className="p-4 bg-teal-50/60 border border-teal-200/80 rounded-xl space-y-3 shadow-2xs">
              <h4 className="font-bold text-teal-900 text-xs tracking-wide uppercase pb-2 border-b border-teal-200/60">
                C. CONDITION OF THE BUILDING
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="1. Exterior Condition:">
                  {renderSelect(
                    fields.buildingConditionExterior,
                    ['Good', 'Very Good', 'Fair', 'Average', 'Poor'],
                    (v) => handleChange('buildingConditionExterior', v),
                    isReadOnly,
                    'Good'
                  )}
                </Field>
                <Field label="2. Interior Condition:">
                  {renderSelect(
                    fields.buildingConditionInterior,
                    ['Good', 'Very Good', 'Fair', 'Average', 'Poor'],
                    (v) => handleChange('buildingConditionInterior', v),
                    isReadOnly,
                    'Good'
                  )}
                </Field>
              </div>
            </div>

            {/* D. Type of Foundations (Standalone) */}
            <div className="max-w-md">
              <Field label="D. Type of Foundations:">
                {renderSelect(
                  fields.foundationType,
                  ['Column Foundation', 'Isolated Footing', 'Raft Foundation', 'Strip Footing', 'Pile Foundation', 'Under Reamed Pile'],
                  (v) => handleChange('foundationType', v),
                  isReadOnly,
                  'Column Foundation'
                )}
              </Field>
            </div>

            {/* E. Doors and Windows Floor-Wise (Nested Schedule Container) */}
            <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-amber-200/60">
                <h4 className="font-bold text-amber-900 text-xs tracking-wide uppercase">
                  E. DOORS AND WINDOWS (FLOOR-WISE)
                </h4>
                <span className="text-[11px] font-medium text-amber-800 bg-white border border-amber-200 px-2 py-0.5 rounded-md shadow-2xs">
                  ↳ Referenced from Point A ({(fields.floorDetails || []).length} Floors)
                </span>
              </div>

              {(!fields.floorDetails || fields.floorDetails.length === 0) ? (
                <div className="p-3 bg-white border border-dashed border-amber-300 rounded-lg text-xs text-amber-700 italic text-center">
                  No floors added in the schedule. Add floors in Point A above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {fields.floorDetails.map((fl, idx) => (
                    <div key={idx} className="p-3 bg-white border border-amber-200/80 rounded-lg space-y-1.5 shadow-2xs">
                      <span className="font-bold text-xs text-amber-900 block">
                        {idx + 1}. {fl.floorName}
                      </span>
                      <Field label="Doors &amp; Windows:">
                        <input
                          type="text"
                          className={inputCls}
                          value={fl.doorsWindows || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'doorsWindows', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* F. Flooring Floor-Wise (Nested Schedule Container) */}
            <div className="p-4 bg-rose-50/60 border border-rose-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-rose-200/60">
                <h4 className="font-bold text-rose-900 text-xs tracking-wide uppercase">
                  F. FLOORING (FLOOR-WISE)
                </h4>
                <span className="text-[11px] font-medium text-rose-800 bg-white border border-rose-200 px-2 py-0.5 rounded-md shadow-2xs">
                  ↳ Referenced from Point A ({(fields.floorDetails || []).length} Floors)
                </span>
              </div>

              {(!fields.floorDetails || fields.floorDetails.length === 0) ? (
                <div className="p-3 bg-white border border-dashed border-rose-300 rounded-lg text-xs text-rose-700 italic text-center">
                  No floors added in the schedule. Add floors in Point A above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {fields.floorDetails.map((fl, idx) => (
                    <div key={idx} className="p-3 bg-white border border-rose-200/80 rounded-lg space-y-1.5 shadow-2xs">
                      <span className="font-bold text-xs text-rose-900 block">
                        {idx + 1}. {fl.floorName}
                      </span>
                      <Field label="Flooring Type:">
                        <input
                          type="text"
                          className={inputCls}
                          value={fl.flooring || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'flooring', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* G. Wall Finishing Floor-Wise (Nested Schedule Container) */}
            <div className="p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-emerald-200/60">
                <h4 className="font-bold text-emerald-900 text-xs tracking-wide uppercase">
                  G. WALL FINISHING (FLOOR-WISE)
                </h4>
                <span className="text-[11px] font-medium text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md shadow-2xs">
                  ↳ Referenced from Point A ({(fields.floorDetails || []).length} Floors)
                </span>
              </div>

              {(!fields.floorDetails || fields.floorDetails.length === 0) ? (
                <div className="p-3 bg-white border border-dashed border-emerald-300 rounded-lg text-xs text-emerald-700 italic text-center">
                  No floors added in the schedule. Add floors in Point A above.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {fields.floorDetails.map((fl, idx) => (
                    <div key={idx} className="p-3 bg-white border border-emerald-200/80 rounded-lg space-y-1.5 shadow-2xs">
                      <span className="font-bold text-xs text-emerald-900 block">
                        {idx + 1}. {fl.floorName}
                      </span>
                      <Field label="Wall Finishing:">
                        <input
                          type="text"
                          className={inputCls}
                          value={fl.wallFinishing || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'wallFinishing', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        {/* 11. SPECIFICATIONS OF CONSTRUCTION */}
        <Section number={11} id="sec-bldg-specs" title="III. Valuation of Building (3. Specifications of Construction)">
          <div className="space-y-4">
            {/* Points A to K: Main Construction Specifications (Standalone Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Field label="A. Foundation:">
                {renderSelect(
                  fields.specFoundation,
                  ['Column Foundation', 'Isolated Footing', 'Raft Foundation', 'Strip Footing', 'Pile Foundation', 'Under Reamed Pile'],
                  (v) => handleChange('specFoundation', v),
                  isReadOnly,
                  'Column Foundation'
                )}
              </Field>

              <Field label="B. Basement:">
                {renderSelect(
                  fields.specBasement,
                  ['No', 'Yes', 'Partial Basement', 'Full Basement', 'Not Applicable'],
                  (v) => handleChange('specBasement', v),
                  isReadOnly,
                  'No'
                )}
              </Field>

              <Field label="C. Superstructure:">
                {renderSelect(
                  fields.specSuperstructure,
                  ['Brick Masonry Super Structure', 'RCC Framed Structure', 'Fly Ash Brick Masonry', 'AAC Block Masonry', 'Load Bearing Structure', 'Stone Masonry'],
                  (v) => handleChange('specSuperstructure', v),
                  isReadOnly,
                  'Brick Masonry Super Structure'
                )}
              </Field>

              <Field label="D. Joinery / Doors & Windows:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.specJoineryDoorsWindows || ''}
                  onChange={(e) => handleChange('specJoineryDoorsWindows', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="E. RCC Works:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.specRccWorks || ''}
                  onChange={(e) => handleChange('specRccWorks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="F. Plastering:">
                {renderSelect(
                  fields.specPlastering,
                  ['Cement Plastering', 'Cement Plastering (1:6 / 1:4)', 'Smooth Cement Plaster with POP/Putty finish', 'Double Coat Sand Faced Plaster', 'Gypsum Plaster'],
                  (v) => handleChange('specPlastering', v),
                  isReadOnly,
                  'Cement Plastering'
                )}
              </Field>

              <Field label="G. Flooring, Skirting, Dadoing:">
                {renderSelect(
                  fields.specFlooringSkirting,
                  ['VT Flooring', 'Vitrified Tiles', 'Ceramic Tiles', 'Marble Flooring', 'Granite Flooring', 'Kota Stone', 'IPS / Cement Concrete Flooring'],
                  (v) => handleChange('specFlooringSkirting', v),
                  isReadOnly,
                  'VT Flooring'
                )}
              </Field>

              <Field label="H. Special Finishing:">
                {renderSelect(
                  fields.specSpecialFinishing,
                  ['Yes', 'No', 'Wall Putty & Plastic Emulsion Paint', 'Weather Coat Exterior Paint', 'POP False Ceiling & Texture Paint', 'Not Applicable'],
                  (v) => handleChange('specSpecialFinishing', v),
                  isReadOnly,
                  'Yes'
                )}
              </Field>

              <Field label="I. Roofing (Weather Proof Course):">
                {renderSelect(
                  fields.specRoofing,
                  ['RCC Roof', 'ACC Sheet', 'GI Sheet', 'Tiles Roof', 'Madras Terrace', 'Pre-cast RCC Slab'],
                  (v) => handleChange('specRoofing', v),
                  isReadOnly,
                  'RCC Roof'
                )}
              </Field>

              <Field label="J. Drainage:">
                {renderSelect(
                  fields.specDrainage,
                  ['Surface Drainage', 'Underground Concealed Drainage', 'PVC Pipe Drainage System', 'Connected to Municipal Drain', 'Open Surface Drain'],
                  (v) => handleChange('specDrainage', v),
                  isReadOnly,
                  'Surface Drainage'
                )}
              </Field>

              <div className="sm:col-span-2">
                <Field label="K. Special Architectural / Decorative Features:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.specDecorativeFeatures || ''}
                    onChange={(e) => handleChange('specDecorativeFeatures', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Nested Subsection Container: L. Internal Wiring & Electrical Installations */}
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
                <span className="text-xs font-bold text-amber-900 tracking-wide uppercase">
                  L. Internal Wiring &amp; Electrical Installations
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="1. Wiring Type (Concealed / External):">
                  {renderSelect(
                    fields.specInternalWiring,
                    ['Concealed', 'External / Open Casing-Capping', 'Concealed Copper Wiring (ISI Mark)', 'Concealed Conduit Wiring', 'Surface Conduit Wiring'],
                    (v) => handleChange('specInternalWiring', v),
                    isReadOnly,
                    'Concealed'
                  )}
                </Field>

                <Field label="2. Class of Electrical Fittings:">
                  {renderSelect(
                    fields.specWiringFittingsClass,
                    ['Superior', 'Standard / Modular', 'Ordinary', 'Semi-Modular', 'Premium Modular (Anchor/Havells/Legrand)'],
                    (v) => handleChange('specWiringFittingsClass', v),
                    isReadOnly,
                    'Superior'
                  )}
                </Field>
              </div>
            </div>

            {/* Standalone Points M, N, O: Sanitary Installations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="M. Sanitary Installation:">
                {renderSelect(
                  fields.specSanitaryInstallation,
                  ['Yes', 'No', 'Modern CPVC/PVC Sanitary System', 'Standard Sanitary Line with CP Fittings', 'Not Applicable'],
                  (v) => handleChange('specSanitaryInstallation', v),
                  isReadOnly,
                  'Yes'
                )}
              </Field>

              <Field label="N. No. of Geysers:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.specNoOfGeysers || ''}
                  onChange={(e) => handleChange('specNoOfGeysers', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="O. Class of Fitting:">
                {renderSelect(
                  fields.specSanitaryFittingsClass,
                  ['Superior', 'Standard', 'Ordinary', 'Premium (Jaquar/Cera/Hindware)', 'Luxury / High End'],
                  (v) => handleChange('specSanitaryFittingsClass', v),
                  isReadOnly,
                  'Superior'
                )}
              </Field>
            </div>

            {/* Nested Subsection Container: P. Compound Wall */}
            <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-emerald-200/60">
                <span className="text-xs font-bold text-emerald-900 tracking-wide uppercase">
                  P. Compound Wall
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="1. Compound Wall (Yes / No / Partial):">
                  {renderSelect(
                    fields.specCompoundWall,
                    ['Yes', 'No', 'Partial', 'Not Applicable'],
                    (v) => handleChange('specCompoundWall', v),
                    isReadOnly,
                    'Yes'
                  )}
                </Field>

                <Field label="2. Height and Length:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.specCompoundWallHeightLength || ''}
                    onChange={(e) => handleChange('specCompoundWallHeightLength', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="3. Type of Construction:">
                  {renderSelect(
                    fields.specCompoundWallType,
                    ['Brick Masonry Wall with Iron Gate', 'Brick Masonry Wall with Plaster & Paint', 'RCC / Precast Compound Wall', 'Stone Masonry Wall', 'Barbed Wire Fencing with MS Gate', 'Not Applicable'],
                    (v) => handleChange('specCompoundWallType', v),
                    isReadOnly,
                    'Brick Masonry Wall with Iron Gate'
                  )}
                </Field>
              </div>
            </div>

            {/* Standalone Points Q & R: Lifts & Sump */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Q. No. of Lifts & Capacity:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.specLiftsCapacity || ''}
                  onChange={(e) => handleChange('specLiftsCapacity', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="R. Underground Sump (Capacity & Type):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.specUndergroundSump || ''}
                  onChange={(e) => handleChange('specUndergroundSump', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Nested Subsection Container: S. Overhead Tank */}
            <div className="p-3.5 bg-cyan-50/60 border border-cyan-200/80 rounded-xl space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-cyan-200/60">
                <span className="text-xs font-bold text-cyan-900 tracking-wide uppercase">
                  S. Overhead Tank
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="1. Overhead Tank (Yes / No):">
                  {renderSelect(
                    fields.specOverheadTank,
                    ['Yes', 'No', 'Not Applicable'],
                    (v) => handleChange('specOverheadTank', v),
                    isReadOnly,
                    'Yes'
                  )}
                </Field>

                <Field label="2. Where Located:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.specOverheadTankLocation || ''}
                    onChange={(e) => handleChange('specOverheadTankLocation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="3. Capacity:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.specOverheadTankCapacity || ''}
                    onChange={(e) => handleChange('specOverheadTankCapacity', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Standalone Points T to Z: Pumps, Roads, Sewage, Quality, Water Supply, Ventilation, Fire Safety */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Field label="T. Pumps (No. & HP):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.specPumpsHp || ''}
                  onChange={(e) => handleChange('specPumpsHp', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="U. Roads & Paving in Compound:">
                {renderSelect(
                  fields.specRoadsPavingCompound,
                  ['No', 'Yes (Interlocking Paver Blocks)', 'Yes (Concrete / CC Paving)', 'Yes (Stone Paving)', 'Not Applicable'],
                  (v) => handleChange('specRoadsPavingCompound', v),
                  isReadOnly,
                  'No'
                )}
              </Field>

              <Field label="V. Sewage Disposal (Sewers/Septic):">
                {renderSelect(
                  fields.specSewageDisposal,
                  ['Connected to Public Sewers', 'Septic Tank with Soak Pit', 'Septic Tank Only', 'Municipal Underground Sewerage System', 'Direct Open Drain'],
                  (v) => handleChange('specSewageDisposal', v),
                  isReadOnly,
                  'Connected to Public Sewers'
                )}
              </Field>

              <Field label="W. Quality / Class of Construction:">
                {renderSelect(
                  fields.specQualityClassConstruction,
                  ['Good', 'Very Good', 'Superior / First Class', 'Second Class / Average', 'Economy Class', 'Fair'],
                  (v) => handleChange('specQualityClassConstruction', v),
                  isReadOnly,
                  'Good'
                )}
              </Field>

              <Field label="X. Water Supply:">
                {renderSelect(
                  fields.specWaterSupply,
                  ['Borewell with Submersible Pump', 'Municipal Water Supply', 'Both Borewell & Municipal Supply', 'Open Well', 'Not Available'],
                  (v) => handleChange('specWaterSupply', v),
                  isReadOnly,
                  'Borewell with Submersible Pump'
                )}
              </Field>

              <Field label="Y. Ventilation & Natural Light:">
                {renderSelect(
                  fields.specVentilationLighting,
                  ['Good / Adequate', 'Very Good (Cross Ventilation)', 'Satisfactory', 'Poor / Inadequate'],
                  (v) => handleChange('specVentilationLighting', v),
                  isReadOnly,
                  'Good / Adequate'
                )}
              </Field>

              <div className="sm:col-span-2">
                <Field label="Z. Fire Safety / Arrangements:">
                  {renderSelect(
                    fields.specFireSafetyArrangements,
                    ['Not Applicable (Low Rise Building)', 'Fire Extinguishers Provided', 'Fire Hose Reel & Smoke Detectors', 'Not Available / Nil'],
                    (v) => handleChange('specFireSafetyArrangements', v),
                    isReadOnly,
                    'Not Applicable (Low Rise Building)'
                  )}
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 12. DETAILS OF BUILDING VALUATION (POINT 4) */}
        <Section number={12} id="sec-bldg-valuation" title="III. Valuation of Building (4. Valuation Details of Building)">
          <div className="space-y-4">
            {/* 8-Col Valuation Table */}
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-sm">4. Details of Building Valuation</h4>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddBuildingRow}
                  className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded cursor-pointer transition-colors shadow-2xs"
                >
                  + Add Valuation Row
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg shadow-2xs">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 text-left min-w-[220px]">Description of Items</th>
                    <th className="p-2.5 text-left min-w-[120px]">Plinth Area (Sq.Ft.)</th>
                    <th className="p-2.5 text-left min-w-[90px]">Height</th>
                    <th className="p-2.5 text-left min-w-[100px]">Age of Building (Years)</th>
                    <th className="p-2.5 text-left min-w-[140px]">Replacement Rate (Rs./Sq.Ft.)</th>
                    <th className="p-2.5 text-left min-w-[140px]">Replacement Cost (Rs.)</th>
                    <th className="p-2.5 text-left min-w-[140px]">Depreciation Amount (Rs.)</th>
                    <th className="p-2.5 text-left min-w-[150px]">Value After Depreciation (Rs.)</th>
                    {!isReadOnly && <th className="p-2.5 w-10 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(fields.buildingValuationRows || []).map((br, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.description}
                          onChange={(e) => handleBuildingRowChange(idx, 'description', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.plinthArea}
                          onChange={(e) => handleBuildingRowChange(idx, 'plinthArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.height}
                          onChange={(e) => handleBuildingRowChange(idx, 'height', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.age}
                          onChange={(e) => handleBuildingRowChange(idx, 'age', sanitizePositiveInt(e.target.value, 3))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.replacementRate}
                          onChange={(e) => handleBuildingRowChange(idx, 'replacementRate', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.replacementCost}
                          onChange={(e) => handleBuildingRowChange(idx, 'replacementCost', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.depreciation}
                          onChange={(e) => handleBuildingRowChange(idx, 'depreciation', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.valueAfterDepreciation}
                          onChange={(e) => handleBuildingRowChange(idx, 'valueAfterDepreciation', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="p-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBuildingRow(idx)}
                            className="text-red-500 hover:text-red-700 font-bold cursor-pointer text-base"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* 13. SUB-SCHEDULES: EXTRA ITEMS, AMENITIES, MISCELLANEOUS & SERVICES (POINT 5) */}
        <Section number={13} id="sec-bldg-subschedules" title="III. Valuation of Building (5. Sub-Schedules: Extra Items, Amenities, Misc & Services)">
          <div className="space-y-4">
            <p className="text-xs text-slate-500 italic">
              Itemized valuation sub-schedules for extra building items, amenities, miscellaneous additions, and site services. All fields are directly editable and included in the total valuation abstract.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 5.1 Extra Items */}
              <div className="p-4 bg-sky-50/70 border border-sky-200/80 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-sky-200/60">
                  <h5 className="font-bold text-xs text-sky-900 uppercase tracking-wide">5.1 Extra Items</h5>
                  <span className="text-xs font-bold text-sky-900 bg-white/80 border border-sky-200 px-2 py-0.5 rounded-md">
                    Total: {fields.extraItemsTotal || 'Rs. 0.00'}
                  </span>
                </div>
                <div className="space-y-2 pt-1">
                  {(fields.extraItems || []).map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs text-sky-950 font-medium w-48 shrink-0 truncate" title={it.name}>
                        {it.name}
                      </span>
                      <input
                        type="text"
                        placeholder="Cost in Rs."
                        className={`${inputCls} text-xs py-1 bg-white`}
                        value={it.cost}
                        onChange={(e) => handleSubScheduleChange('extraItems', idx, sanitizePositiveFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 5.2 Amenities */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                  <h5 className="font-bold text-xs text-amber-900 uppercase tracking-wide">5.2 Amenities</h5>
                  <span className="text-xs font-bold text-amber-900 bg-white/80 border border-amber-200 px-2 py-0.5 rounded-md">
                    Total: {fields.amenitiesTotal || 'Rs. 0.00'}
                  </span>
                </div>
                <div className="space-y-2 pt-1">
                  {(fields.amenities || []).map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs text-amber-950 font-medium w-48 shrink-0 truncate" title={it.name}>
                        {it.name}
                      </span>
                      <input
                        type="text"
                        placeholder="Cost in Rs."
                        className={`${inputCls} text-xs py-1 bg-white`}
                        value={it.cost}
                        onChange={(e) => handleSubScheduleChange('amenities', idx, sanitizePositiveFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 5.3 Misc Items */}
              <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-purple-200/60">
                  <h5 className="font-bold text-xs text-purple-900 uppercase tracking-wide">5.3 Miscellaneous Items</h5>
                  <span className="text-xs font-bold text-purple-900 bg-white/80 border border-purple-200 px-2 py-0.5 rounded-md">
                    Total: {fields.miscItemsTotal || 'Rs. 0.00'}
                  </span>
                </div>
                <div className="space-y-2 pt-1">
                  {(fields.miscItems || []).map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs text-purple-950 font-medium w-48 shrink-0 truncate" title={it.name}>
                        {it.name}
                      </span>
                      <input
                        type="text"
                        placeholder="Cost in Rs."
                        className={`${inputCls} text-xs py-1 bg-white`}
                        value={it.cost}
                        onChange={(e) => handleSubScheduleChange('miscItems', idx, sanitizePositiveFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* 5.4 Services Items */}
              <div className="p-4 bg-teal-50/70 border border-teal-200/80 rounded-xl space-y-3 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-teal-200/60">
                  <h5 className="font-bold text-xs text-teal-900 uppercase tracking-wide">5.4 Services Items</h5>
                  <span className="text-xs font-bold text-teal-900 bg-white/80 border border-teal-200 px-2 py-0.5 rounded-md">
                    Total: {fields.servicesItemsTotal || 'Rs. 0.00'}
                  </span>
                </div>
                <div className="space-y-2 pt-1">
                  {(fields.servicesItems || []).map((it, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="text-xs text-teal-950 font-medium w-48 shrink-0 truncate" title={it.name}>
                        {it.name}
                      </span>
                      <input
                        type="text"
                        placeholder="Cost in Rs."
                        className={`${inputCls} text-xs py-1 bg-white`}
                        value={it.cost}
                        onChange={(e) => handleSubScheduleChange('servicesItems', idx, sanitizePositiveFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 14. TOTAL ABSTRACT MATRIX (POINT 6) */}
        <Section number={14} id="sec-bldg-abstract-matrix" title="III. Valuation of Building (6. Total Abstract Valuation Matrix)">
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-4 shadow-2xs">
              <div className="pb-2 border-b border-emerald-200/60">
                <h4 className="font-bold text-emerald-950 text-sm tracking-wide">
                  6.0. TOTAL ABSTRACT OF THE ENTIRE PROPERTY:
                </h4>
                <p className="text-xs text-emerald-800/80 italic mt-0.5">
                  Consolidated valuation summary across Land, Building, Extra Items, Amenities, Miscellaneous, and Services.
                </p>
              </div>

              <div className="overflow-x-auto border border-emerald-200 rounded-lg shadow-2xs bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5 text-left min-w-[160px]">PARTICULARS</th>
                      <th className="p-2.5 text-center sm:text-right min-w-[150px]">GOVT. VALUE IN RS.</th>
                      <th className="p-2.5 text-center sm:text-right min-w-[150px]">MARKET VALUE IN RS.</th>
                      <th className="p-2.5 text-center sm:text-right min-w-[160px]">
                        REALIZABLE VALUE ({fields.realisableValuePct !== undefined && fields.realisableValuePct !== '' ? `${fields.realisableValuePct}%` : '95%'})
                      </th>
                      <th className="p-2.5 text-center sm:text-right min-w-[160px]">
                        DISTRESS VALUE ({fields.distressSalePct !== undefined && fields.distressSalePct !== '' ? `${fields.distressSalePct}%` : '85%'})
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {[
                      {
                        name: 'LAND',
                        govt: fields.abstractGovtLand || (fields.abstractGovtTotal ? fields.abstractGovtTotal : 'Rs. 0.00'),
                        mkt: fields.abstractMarketLand || (fields.landMarketValueTotal ? fields.landMarketValueTotal : 'Rs. 0.00'),
                        real: fields.abstractRealLand || (fields.landRealisableValue ? fields.landRealisableValue : 'Rs. 0.00'),
                        dist: fields.abstractDistressLand || (fields.landDistressValue ? fields.landDistressValue : 'Rs. 0.00'),
                      },
                      {
                        name: 'BUILDING',
                        govt: fields.abstractGovtBuilding || 'Rs. 0.00',
                        mkt: fields.abstractMarketBuilding || 'Rs. 0.00',
                        real: fields.abstractRealBuilding || 'Rs. 0.00',
                        dist: fields.abstractDistressBuilding || 'Rs. 0.00',
                      },
                      {
                        name: 'EXTRA ITEMS',
                        govt: fields.abstractGovtExtra || 'Rs. 0.00',
                        mkt: fields.abstractMarketExtra || fields.extraItemsTotal || 'Rs. 0.00',
                        real: fields.abstractRealExtra || 'Rs. 0.00',
                        dist: fields.abstractDistressExtra || 'Rs. 0.00',
                      },
                      {
                        name: 'AMENITIES',
                        govt: fields.abstractGovtAmenities || 'Rs. 0.00',
                        mkt: fields.abstractMarketAmenities || fields.amenitiesTotal || 'Rs. 0.00',
                        real: fields.abstractRealAmenities || 'Rs. 0.00',
                        dist: fields.abstractDistressAmenities || 'Rs. 0.00',
                      },
                      {
                        name: 'MISCELLANEOUS',
                        govt: fields.abstractGovtMisc || 'Rs. 0.00',
                        mkt: fields.abstractMarketMisc || fields.miscItemsTotal || 'Rs. 0.00',
                        real: fields.abstractRealMisc || 'Rs. 0.00',
                        dist: fields.abstractDistressMisc || 'Rs. 0.00',
                      },
                      {
                        name: 'SERVICES',
                        govt: fields.abstractGovtServices || 'Rs. 0.00',
                        mkt: fields.abstractMarketServices || fields.servicesItemsTotal || 'Rs. 0.00',
                        real: fields.abstractRealServices || 'Rs. 0.00',
                        dist: fields.abstractDistressServices || 'Rs. 0.00',
                      },
                      {
                        name: 'TOTAL',
                        govt: fields.abstractGovtTotal || 'Rs. 0.00',
                        mkt: fields.abstractMarketTotal || 'Rs. 0.00',
                        real: fields.abstractRealTotal || 'Rs. 0.00',
                        dist: fields.abstractDistressTotal || 'Rs. 0.00',
                        isTotal: true,
                      },
                      {
                        name: 'OR SAY',
                        govt: fields.abstractGovtSay || fields.abstractGovtTotal || 'Rs. 0.00',
                        mkt: fields.abstractMarketSay || fields.abstractMarketTotal || 'Rs. 0.00',
                        real: fields.abstractRealSay || fields.abstractRealTotal || 'Rs. 0.00',
                        dist: fields.abstractDistressSay || fields.abstractDistressTotal || 'Rs. 0.00',
                        isTotal: true,
                      },
                    ].map((row, idx) => (
                      <tr
                        key={idx}
                        className={row.isTotal ? 'bg-slate-100 font-bold border-t-2 border-slate-300' : 'hover:bg-slate-50/50'}
                      >
                        <td className={`p-2 ${row.isTotal ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {row.name}
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            className={`${inputCls} text-right ${row.isTotal ? 'font-bold text-slate-950' : 'font-medium'}`}
                            value={row.govt}
                            disabled
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            className={`${inputCls} text-right ${row.isTotal ? 'font-bold text-slate-950' : 'font-medium'}`}
                            value={row.mkt}
                            disabled
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            className={`${inputCls} text-right ${row.isTotal ? 'font-bold text-slate-950' : 'font-medium'}`}
                            value={row.real}
                            disabled
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="text"
                            className={`${inputCls} text-right ${row.isTotal ? 'font-bold text-slate-950' : 'font-medium'}`}
                            value={row.dist}
                            disabled
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Section>

        {/* 15. REMARKS & CERTIFICATE OF VALUATION / OPINION */}
        <Section number={15} id="sec-remarks-opinion" title="IV. General Remarks & Certificate of Valuation / Valuer Opinion">
          <div className="space-y-4">
            <Field label="General Remarks & Condition of the Property / Remarks:">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.valuationRemarksBox || ''}
                onChange={(e) => handleChange('valuationRemarksBox', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Basis of Valuation Statement:">
              <input
                type="text"
                className={inputCls}
                value={fields.basisOfValuationStatement || ''}
                onChange={(e) => handleChange('basisOfValuationStatement', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Field label={`Fair Market Value (in words) — ${fields.abstractMarketSay || fields.abstractMarketTotal || fields.fairMarketValue || 'Rs. 0.00'}:`}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.fairMarketValueWords || ''}
                    onChange={(e) => handleChange('fairMarketValueWords', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <p className="text-[11px] text-slate-500 font-medium italic">
                  Referenced from: Section 6.0 Total Abstract Matrix — Market Value ({fields.abstractMarketSay || fields.abstractMarketTotal || 'Rs. 0.00'})
                </p>
              </div>

              <div className="space-y-1.5">
                <Field label={`Realisable Value (in words) — ${fields.abstractRealSay || fields.abstractRealTotal || fields.realisableValue || 'Rs. 0.00'}:`}>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.realisableValueWords || ''}
                    onChange={(e) => handleChange('realisableValueWords', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <p className="text-[11px] text-slate-500 font-medium italic">
                  Referenced from: Section 6.0 Total Abstract Matrix — Realisable Value ({fields.abstractRealSay || fields.abstractRealTotal || 'Rs. 0.00'})
                </p>
              </div>
            </div>

            {/* Live Valuer Opinion Statement Preview */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-700 space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                📄 Certificate of Valuation Statement Live Preview
              </span>
              <p className="leading-relaxed italic">
                &ldquo;As a result of my appraisal and analysis, it is my considered opinion that the present Fair Market Value of the above property in the prevailing condition with aforesaid specifications is <strong className="text-slate-900 not-italic">{fields.fairMarketValue || fields.abstractMarketSay || 'Rs. 0/-'}</strong> (<span className="font-semibold text-slate-800 not-italic">{fields.fairMarketValueWords || 'Rupees Zero Only'}</span>). The Realizable Value is <strong className="text-slate-900 not-italic">{fields.realisableValue || fields.abstractRealSay || 'Rs. 0/-'}</strong> (<span className="font-semibold text-slate-800 not-italic">{fields.realisableValueWords || 'Rupees Zero Only'}</span>). The book value of the above property as of Land is <strong className="text-slate-900 not-italic">{fields.bookValueOfLand || fields.abstractGovtSay || 'Rs. 0/-'}</strong> (<span className="font-semibold text-slate-800 not-italic">{fields.bookValueOfLandWords || 'Rupees Zero Only'}</span>) and the Distress Value <strong className="text-slate-900 not-italic">{fields.distressValue || fields.abstractDistressSay || 'Rs. 0/-'}</strong> (<span className="font-semibold text-slate-800 not-italic">{fields.distressValueWords || 'Rupees Zero Only'}</span>) And Insurable Value of the Property is <strong className="text-slate-900 not-italic">{fields.insurableValueOfProperty || 'Rs. 0/-'}</strong>.&rdquo;
              </p>
            </div>
          </div>
        </Section>

        {/* 16. DECLARATION & VALUER CREDENTIALS */}
        <Section number={16} id="sec-declaration" title="V. Declaration & Valuer Credentials">
          <div className="space-y-6">
            {/* Valuer Credentials & Sign-Off */}
            <div className="p-4 bg-indigo-50/60 border border-indigo-200/80 rounded-lg space-y-3">
              <h4 className="font-bold text-indigo-950 text-sm tracking-wide">Valuer Credentials & Sign-Off Block</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Field label="Empanelled Valuer Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.empanelledValuerName || ''}
                    onChange={(e) => handleChange('empanelledValuerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Site Engineer Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.siteEngineerName || ''}
                    onChange={(e) => handleChange('siteEngineerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Valuer Qualifications:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerQualifications || ''}
                    onChange={(e) => handleChange('valuerQualifications', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="IOV Reg No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerIovRegNo || ''}
                    onChange={(e) => handleChange('valuerIovRegNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Wealth Tax Reg No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerWealthTaxRegNo || ''}
                    onChange={(e) => handleChange('valuerWealthTaxRegNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Declaration Date:">
                  <BaseDateInput
                    value={fields.declarationDate || ''}
                    onChange={(val) => handleChange('declarationDate', val)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Total Report Pages Count with Lock Toggle */}
                <div className="sm:col-span-2 pt-2 border-t border-indigo-200/70">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-indigo-950">
                      Total Report Pages (in Declaration Point O):
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-indigo-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!fields.reportPagesCountLocked}
                        onChange={(e) => {
                          const auto = e.target.checked;
                          setFields(prev => ({
                            ...prev,
                            reportPagesCountLocked: !auto,
                            reportPagesCount: auto ? dynamicTotalPages : prev.reportPagesCount,
                          }));
                        }}
                        disabled={isReadOnly}
                      />
                      <span>Auto calculate ({dynamicTotalPages} pages)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    className={`${inputCls} mt-1`}
                    value={fields.reportPagesCount || ''}
                    onChange={(e) => handleChange('reportPagesCount', sanitizePositiveInt(e.target.value, 3))}
                    disabled={isReadOnly || !fields.reportPagesCountLocked}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 17. VALUATION CHECKLIST */}
        <Section number={17} id="sec-checklist" title="VI. Valuation Report Check-List (10 Points)">
          <div className="space-y-4">
            <div className="p-4 bg-violet-50/60 border border-violet-200/80 rounded-xl space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-violet-200/60">
                <h4 className="font-bold text-violet-950 text-sm tracking-wide">
                  VI. Valuation Report Check-List (10 Points)
                </h4>
                <span className="text-xs text-violet-800 font-medium hidden sm:inline">
                  Select compliance status for each checkpoint
                </span>
              </div>
              <div className="space-y-2.5">
                {(fields.checklist || []).map((ci, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-violet-200/80 rounded-lg shadow-xs hover:border-violet-300 transition-colors"
                  >
                    <div className="space-y-0.5 pr-2">
                      <span className="text-xs text-slate-800 font-semibold leading-snug block">
                        {ci.pointNo}. {ci.question}
                      </span>
                      {ci.subText && (
                        <span className="text-[11px] text-slate-500 italic block">
                          {ci.subText}
                        </span>
                      )}
                    </div>
                    <div className="inline-flex rounded-lg p-0.5 bg-slate-100 border border-slate-200 shrink-0 self-start sm:self-center">
                      {(['Yes', 'No', 'NA'] as const).map((opt) => {
                        const isSelected = ci.answer === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            disabled={isReadOnly}
                            onClick={() => handleChecklistChange(idx, opt)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                              isSelected
                                ? opt === 'Yes'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : opt === 'No'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-700 text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                            } ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 18. Documents */}
        <BaseDocumentsSection
          title="Documents"
          sectionId="sec-documents"
          sectionNumber={18}
          documentImages={fields.documentImages || []}
          documentImageNames={fields.documentImageNames || []}
          isReadOnly={isReadOnly}
          uploading={saving}
          onUploadDocument={handleDocumentUpload}
          onRemoveDocument={handleDocumentRemove}
          onDocumentNameChange={handleDocumentRename}
          onReorderDocuments={handleDocumentReorder}
          defaultOpen={true}
        />

        {/* 19. Maps */}
        <BaseMapsSection
          title="Maps"
          sectionId="sec-maps"
          sectionNumber={19}
          locationMapImages={fields.locationMapImages || (fields.locationMapImageUrl ? [fields.locationMapImageUrl] : [])}
          mouzaMapImages={fields.mouzaMapImages || (fields.rorImageUrl ? [fields.rorImageUrl] : [])}
          sketchMapImages={fields.sketchMapImages || (fields.guidelineValueImageUrl ? [fields.guidelineValueImageUrl] : [])}
          cadastralMapImages={fields.cadastralMapImages || (fields.bhuNakshaImageUrl ? [fields.bhuNakshaImageUrl] : [])}
          bdaMapImages={fields.bdaMapImages || []}
          latitude={fields.latitude || ''}
          longitude={fields.longitude || ''}
          technicalAddress={fields.detailedAddressWithPin || ''}
          propertyAddress={fields.propAt || ''}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Section 5 (Point U. Latitude / Longitude Coordinates)"
          isReadOnly={isReadOnly}
          uploading={saving}
          onLatitudeChange={(val) => {
            const lng = fields.longitude || '';
            const combined = deriveCoordinates(val, lng);
            setFields((prev) => ({
              ...prev,
              latitude: val,
              latitudeLongitude: combined,
            }));
          }}
          onLongitudeChange={(val) => {
            const lat = fields.latitude || '';
            const combined = deriveCoordinates(lat, val);
            setFields((prev) => ({
              ...prev,
              longitude: val,
              latitudeLongitude: combined,
            }));
          }}
          onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={(idx) => handleMapRemove('locationMapImages', idx)}
          onReorderLocationMap={(imgs) => handleMapReorder('locationMapImages', imgs)}
          onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={(idx) => handleMapRemove('mouzaMapImages', idx)}
          onReorderMouzaMap={(imgs) => handleMapReorder('mouzaMapImages', imgs)}
          onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={(idx) => handleMapRemove('sketchMapImages', idx)}
          onReorderSketchMap={(imgs) => handleMapReorder('sketchMapImages', imgs)}
          onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
          onCadastralMapRemove={(idx) => handleMapRemove('cadastralMapImages', idx)}
          onReorderCadastralMap={(imgs) => handleMapReorder('cadastralMapImages', imgs)}
          onBdaMapUpload={(e) => handleMapUpload('bdaMapImages', e)}
          onBdaMapRemove={(idx) => handleMapRemove('bdaMapImages', idx)}
          onReorderBdaMap={(imgs) => handleMapReorder('bdaMapImages', imgs)}
          defaultOpen={true}
        />

        {/* 20. Property Photographs */}
        <BasePhotographsSection
          title="Property Photographs"
          sectionNumber={20}
          sectionId="sec-photos"
          propertyImages={propertyImages}
          propertyImageNames={propertyImageNames}
          isReadOnly={isReadOnly}
          uploading={saving}
          bucketCount={bucketImages?.length || 0}
          onOpenBucketPicker={() => setShowBucketModal(true)}
          onUploadImages={handleUploadMultiplePhotos}
          onRemoveImage={handlePhotoRemove}
          onImageNameChange={handlePhotoRename}
          onReorderImages={handlePhotoReorder}
          defaultOpen={true}
        />

        {/* STANDARDIZED ACTION BAR (DOCKED AT BOTTOM OF MAIN CONTENT) */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={saving || submitting}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>

      {/* Floating Section Navigator on the Right Side */}
      <FloatingNavigator sections={NAV_SECTIONS} />

      {/* Cloud Bucket Selection Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            const addedNames = selectedUrls.map((_, i) => `Photograph ${propertyImages.length + i + 1}`);
            const mergedImgs = [...propertyImages, ...selectedUrls];
            const mergedNames = [...propertyImageNames, ...addedNames];
            const mergedPhotos = mergedImgs.map((url, idx) => ({
              url,
              caption: mergedNames[idx] || `Photograph ${idx + 1}`,
            }));
            setFields((prev) => ({
              ...prev,
              propertyPhotos: mergedPhotos,
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
