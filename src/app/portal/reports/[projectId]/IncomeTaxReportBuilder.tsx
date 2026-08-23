'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification, getBucketImages, deleteBucketImage } from '@/app/actions/project';
import { SERVICES_LIST } from './constants';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { generateIncomeTaxPDF } from '@/lib/pdf-it-renderer';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import * as XLSX from 'xlsx';

// ─── Types ─────────────────────────────────────────────────────────
interface ValuationFloorRow {
  id: string;
  name: string;          // e.g. "GROUND FLOOR"
  plinthArea: string;    // sqft
  roofHeight: string;    // e.g. "10'-6\""
  age: string;           // e.g. "New", "5 Years"
  ratePerSqft: string;   // RS.X/-
  replacementCost: string; // auto-calculated
  depreciationAmt: string; // auto-calculated
  netValue: string;        // auto-calculated
}

interface ExtraItem {
  id: string;
  description: string;
  amount: string;
}

interface AnnexureItem {
  id: string;
  label: string;       // 'A', 'B', 'C', ...
  title?: string;
  excelFileUrl: string;
  excelFileName: string;
  parsedData?: {
    headers: string[];         // row 0 (kept for compat)
    rows: string[][];          // rows 1+ (kept for compat)
    allRows: string[][];       // ALL rows including row 0 (used for merged rendering)
    merges: { sr: number; sc: number; er: number; ec: number }[]; // 0-indexed merge ranges
    colWidths: number[];       // normalised 0-1 column widths from workbook
  };
}

const UNIT_SQFT_MAP: Record<string, number> = {
  'DEC': 435.6,
  'DECIMAL': 435.6,
  'ACRE': 43560,
  'ACRES': 43560,
  'SQFT': 1,
  'SQ.FT.': 1,
  'SQ FT': 1,
  'SFT': 1,
  'SQMT': 10.7639,
  'SQ.MTR.': 10.7639,
  'SQ.M.': 10.7639,
  'SMT': 10.7639,
  'GUNTHA': 1089,
  'CENT': 435.6,
};

const getSqftFactor = (unitStr: string): number => {
  if (!unitStr) return 435.6;
  const u = unitStr.toUpperCase().trim();
  if (UNIT_SQFT_MAP[u]) return UNIT_SQFT_MAP[u];
  if (u.includes('ACRE')) return 43560;
  if (u.includes('SQFT') || u.includes('SQ.FT') || u.includes('SFT') || u === 'SF') return 1;
  if (u.includes('SQMT') || u.includes('SQ.M') || u.includes('SMT') || u === 'SM') return 10.7639;
  if (u.includes('GUNTHA')) return 1089;
  if (u.includes('CENT')) return 435.6;
  return 435.6;
};

const convertLandRate = (rateVal: string | number, fromUnit: string, toUnit: string): string => {
  const rate = typeof rateVal === 'number' ? rateVal : parseFloat(rateVal);
  if (!rate || isNaN(rate)) return '';
  const fromArea = getSqftFactor(fromUnit);
  const toArea = getSqftFactor(toUnit);
  const converted = Math.round((rate / fromArea) * toArea);
  return converted > 0 ? String(converted) : '';
};

const calculateTotalLandValue = (
  areaStr: string,
  areaUnit: string,
  rateStr: string,
  rateUnit?: string
): number => {
  const areaNum = parseFloat(String(areaStr).replace(/[^0-9.]/g, '')) || 0;
  const rateNum = parseFloat(String(rateStr).replace(/[^0-9.]/g, '')) || 0;
  if (!areaNum || !rateNum) return 0;

  const areaSqft = areaNum * getSqftFactor(areaUnit);
  const rateSqftFactor = getSqftFactor(rateUnit || areaUnit);

  const totalValue = (areaSqft / rateSqftFactor) * rateNum;
  return Math.round(totalValue);
};

const formatLandAreaWithSqft = (rawLine: string): string => {
  if (!rawLine || !rawLine.trim()) return '';
  let str = rawLine.trim();

  if (/\bI\.E\.\s*\d+(?:\.\d+)?\s*SFT/i.test(str)) {
    return str;
  }

  const match = str.match(/^(?:AC\.)?(\d+(?:\.\d+)?)\s*(ACRE|ACRES|DEC|DECIMAL|SQMT|SQ\.MTR\.|SQFT|SQ\.FT\.|SFT)?(.*)$/i);
  if (!match) return str;

  const numVal = parseFloat(match[1]);
  if (isNaN(numVal) || numVal <= 0) return str;

  let unit = (match[2] || 'DEC').toUpperCase();
  const restStr = match[3] ? match[3].trim() : '';

  let sqftVal = 0;
  if (unit.includes('ACRE') || str.toUpperCase().startsWith('AC.')) {
    sqftVal = numVal * 43560;
  } else if (unit.includes('SQMT') || unit.includes('SQ.M')) {
    sqftVal = numVal * 10.7639;
  } else if (unit.includes('SQFT') || unit.includes('SQ.FT') || unit === 'SFT') {
    sqftVal = numVal;
  } else {
    sqftVal = numVal * 435.6;
  }

  const formattedSqft = sqftVal.toFixed(2);

  if (restStr) {
    if (/^\(AS PER [^)]+\)$/i.test(restStr)) {
      const mainPart = match[0].replace(restStr, '').trim();
      return `${mainPart} I.E. ${formattedSqft} SFT ${restStr}`;
    }
    return `${str} I.E. ${formattedSqft} SFT`;
  }

  return `${str} I.E. ${formattedSqft} SFT`;
};

const cleanAddressForMap = (rawAddr: string): string => {
  if (!rawAddr || !rawAddr.trim()) return '';
  let str = rawAddr.trim();

  // 1. Remove parenthetical notes like "(AS PER ROR)", "(AS PER SALE DEED)", "(AS PER ACTUAL)"
  str = str.replace(/\([^)]*\)/gi, '');

  // 2. Remove technical ROR/Deed keywords & specs: AREA-..., KISSAM:..., KHATA..., PLOT...
  str = str.replace(/\bAREA-?[^,]+/gi, '');
  str = str.replace(/\bKISSAM:?[^,]+/gi, '');
  str = str.replace(/\b(KHATA|PLOT|SURVEY|STREET|WARD)\s*NO:?[^,]+/gi, '');

  // 3. Remove owner name prefixes (MR., MRS., DR., M/S, & OTHERS)
  str = str.replace(/^(MR|MRS|DR|MS|M\/S)\.?[^,]+,?\s*/gi, '');
  str = str.replace(/^[A-Z\s.&]+\s*&\s*OTHERS,?\s*/gi, '');

  // 4. Remove labels like AT/PO:, PS:, DIST:, THANA:, TAHASIL:, MOUZA:
  str = str.replace(/\b(AT\/PO|PS|DIST|THANA|TAHASIL|MOUZA):?\s*/gi, '');

  // 5. Remove standalone numbers and fractions like "211/386", "909", "30", "360/428"
  str = str.replace(/\b\d+([\/\-]\d+)*\b/g, '');

  // 6. Clean up trailing commas, periods, double spaces
  str = str
    .replace(/["';]/g, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(,\s*)+/g, ', ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();

  return str;
};

const getIncomeTaxLocationAddress = (fields: IncomeTaxFields): string => {
  if (fields.locationDetailsLines && fields.locationDetailsLines.length > 0) {
    const joined = fields.locationDetailsLines.filter(Boolean).join(', ');
    const cleaned = cleanAddressForMap(joined);
    if (cleaned) return cleaned;
  }
  if (fields.propertyDescription && fields.propertyDescription.trim()) {
    const cleaned = cleanAddressForMap(fields.propertyDescription);
    if (cleaned) return cleaned;
  }
  if (fields.ownerAddress && fields.ownerAddress.trim()) {
    const cleaned = cleanAddressForMap(fields.ownerAddress);
    if (cleaned) return cleaned;
  }
  return '';
};

interface IncomeTaxFields {
  // ── Title Block ──
  propertyType: string; // RESIDENTIAL LAND & BUILDING, RESIDENTIAL LAND, etc.
  ownerName: string;
  propertyDescription: string; // Full legal address
  refNo: string;

  // ── General (Q01-Q11) ──
  purposeOfValuation: string;  // Q01 — locked by default
  valuationDate: string;       // Q02A — text (historical date like 01.04.2001)
  inspectionDate: string;      // Q02B
  reportDate: string;          // Q02C
  identifiedBy: string;        // Q02D
  ownerAddress: string;        // Q03
  ownershipType: string;       // Q04
  briefDescriptionLines: string[]; // Q05 — merged into single bullet editor
  locationDetailsLines: string[];   // Q06
  surveyPlotNoLines: string[];      // Q07
  areaType: string;            // Q08
  classOfLocality: string;     // Q09
  civicAmenitiesDistance: string; // Q10
  meansCommunication: string;  // Q11

  // ── Land (Q12-Q24) ──
  landArea: string;
  landAreaUnit: string;
  landShape: string;
  landLevel: string;
  roadAccess: string;
  landTenure: string;
  leaseDetails: string;
  restrictiveCovenant: string;
  easements: string;              // Q17
  developmentContribution: string; // Q18
  acquisitionNotification: string; // Q19
  sitePlanAttached: string;         // Q20
  plansAttached: string;
  technicalDetails: string;
  tenancyStatus: string;          // Q23 (I)
  tenancyPortionDetails: string;   // Q23 (II)
  fsi: string;

  // ── Rent & Sales (Q25-Q37) ──
  tenantName: string;           // Q25 (I)
  tenantPortion: string;        // Q25 (II)
  tenantRent: string;           // Q25 (III)
  tenantGrossAmount: string;    // Q25 (IV)
  relatedOccupants: string;     // Q26
  fixtures: string;             // Q27
  waterElectricCharges: string; // Q28
  pumpMaintenance: string;      // Q29
  commonElectricity: string;    // Q30
  propertyTax: string;          // Q31
  buildingInsured: string;      // Q32
  landlordTenantDispute: string;// Q33
  standardRent: string;         // Q34
  saleInstances: string;        // Q35

  // ── Cost of Construction (Q36-Q42) ──
  landRatePerUnit: string;      // Q36 — value per unit
  landRateUnit: string;         // Q36 — unit (DEC/ACRE/SQFT)
  landRateSecondaryPerUnit?: string;
  landRateSecondaryUnit?: string;
  landRateMode?: 'auto' | 'custom';
  landRateCustomText?: string;
  landRate: string;             // Q36 — legacy/full text
  totalLandValue: string;
  landRateBasis: string;        // Q37
  constructionStartYear: string;// Q38 (I)
  constructionEndYear: string;  // Q38 (II)
  constructionMethod: string;   // Q39
  contractAgreements: string;   // Q40
  materialRates: string;        // Q41
  buildingApproval: string;     // Q42

  // ── Part II: Valuation ──
  valuationYear: string;
  completionYear: string;
  valuationBullets: string[];
  isReverseCalculation: boolean;
  ciiBaseYear: string;
  ciiBaseValue: string;
  ciiTargetYear: string;
  ciiTargetValue: string;

  // ── Annexure: Technical Details (items 01-20) ──
  techFloors: string;
  techFloorHeight: string;
  techPlinthAreaActual: string;
  techPlinthAreaApproved: string;
  showPlinthActual: boolean;
  showPlinthApproved: boolean;
  techYearConstruction: string;
  techYearCompletion?: string;
  techFutureLife: string;
  techConstructionType: string;
  techFoundation: string;
  techWallsBasement: string;
  techWallsGround: string;
  annexMainBuilding: string;
  annexAnnexes: string;
  annexServantsQuarters: string;
  annexGarage: string;
  annexPumpHouse: string;
  plinthAreaConsidered: string;
  techPartitions: string;
  techDoorsWindows: string;
  techFlooring: string;
  techFinishing: string;
  techRoofing: string;
  techArchitecturalFeatures: string;
  techWiring: string;
  techFittings: string;
  techSanitary?: string;
  techSanitaryLines: string[];
  techCompoundWall: string;
  techCompoundWallType?: string;
  techLifts: string;
  techOverheadTank: string;
  techPump: string;
  techUndergroundSump: string;
  techRoadsPaving: string;
  techSewageDisposal: string;

  // ── Annexure: Valuation Calculation (Table I) ──
  valuationCalcDate: string;
  depreciationRatePerAnnum: string;
  depreciationPct: string;
  floorRows: ValuationFloorRow[];

  // ── Extra Items & Abstract ──
  extraItems: ExtraItem[];
  totalBuildingValue: string;
  totalExtraValue: string;
  totalPropertyValue: string;

  // ── Appendices ──
  propertyImages: string[];
  propertyImageNames: string[];
  locationMapImage: string;
  locationSearchQuery?: string;
  latitude: string;
  longitude: string;
  ciiTableImage: string;
  bdaMapImage: string;
  benchmarkImage: string;
  sketchMapImages: string[];
  annexures: AnnexureItem[];
  annexureEnabled: boolean;
  isValuationDateReverseCalc?: boolean;
  plotAreaLines?: string[];
  landDimension?: string;
  easementAttached?: boolean;
  easementImages?: string[];
  fsiPermissible?: string;
  fsiUtilized?: string;
  saleInstancesLines?: string[];

  // ── Remarks ──
  hasRemarks: boolean;
  remarks: string;

  // ── Meta ──
  clientType: string;
  organisationTemplate: string;
  institutionCategory?: string;
  serviceType?: string;
  subjectType?: string;
  valuationLayout?: string;
  reworkNotes?: string;
  [key: string]: any;
}

const PROPERTY_TYPES = [
  'RESIDENTIAL LAND & BUILDING',
  'RESIDENTIAL LAND',
  'NON RESIDENTIAL LAND & BUILDING',
  'COMMERCIAL LAND & BUILDING',
  'COMMERCIAL LAND',
  'AGRICULTURAL LAND',
];

const DEFAULT_FIELDS: IncomeTaxFields = {
  propertyType: 'RESIDENTIAL LAND & BUILDING',
  ownerName: '',
  propertyDescription: '',
  refNo: '',

  purposeOfValuation: 'TO ASSESS OF CAPITAL GAIN FOR INCOME TAX',
  valuationDate: '',
  inspectionDate: new Date().toISOString().split('T')[0],
  reportDate: new Date().toISOString().split('T')[0],
  identifiedBy: '',
  ownerAddress: '',
  ownershipType: 'SINGLE OWNERSHIP LAND & FREE HOLD IN NATURE',
  briefDescriptionLines: [],
  locationDetailsLines: [],
  surveyPlotNoLines: [],
  areaType: 'RESIDENTIAL AREA',
  classOfLocality: 'MIDDLE',
  civicAmenitiesDistance: '2',

  landArea: '',
  landAreaUnit: 'DEC',
  landShape: 'RECTANGULAR SHAPE',
  landLevel: 'FLAT AND HIGH LEVEL LAND',
  roadAccess: '',
  landTenure: 'IT IS FREE HOLD LAND',
  leaseDetails: 'NOT APPLICABLE',
  restrictiveCovenant: '',
  meansCommunication: 'THE LOCALITY IS SERVED BY MEANS OF PUBLIC AND PRIVATE TRANSPORT SYSTEM.',
  easements: 'NOT APPLICABLE',
  developmentContribution: 'NOT APPLICABLE',
  acquisitionNotification: 'NO SUCH PARTICULARS ARE OBSERVED BY US',
  sitePlanAttached: 'SITE PLAN IS ATTACHED (GPS LOCATION MAP ATTACHED)',
  plansAttached: 'NOT APPLICABLE',
  technicalDetails: 'NOT APPLICABLE',
  tenancyStatus: 'NOT APPLICABLE',
  tenancyPortionDetails: 'NOT APPLICABLE',
  fsi: 'NOT APPLICABLE',

  tenantName: 'NOT APPLICABLE',
  tenantPortion: 'NOT APPLICABLE',
  tenantRent: 'NOT APPLICABLE',
  tenantGrossAmount: 'NOT APPLICABLE',
  relatedOccupants: 'NOT APPLICABLE',
  fixtures: 'NOT APPLICABLE',
  waterElectricCharges: 'NOT APPLICABLE',
  pumpMaintenance: 'NOT APPLICABLE',
  commonElectricity: 'NOT APPLICABLE',
  propertyTax: '',
  buildingInsured: 'NOT APPLICABLE',
  landlordTenantDispute: 'NOT APPLICABLE',
  standardRent: 'NOT APPLICABLE',
  saleInstances: '',

  landRatePerUnit: '',
  landRateUnit: 'DEC',
  landRateSecondaryPerUnit: '',
  landRateSecondaryUnit: 'ACRE',
  landRateMode: 'auto',
  landRateCustomText: '',
  landRate: '',
  totalLandValue: '',
  landRateBasis: 'NOT APPLICABLE',
  constructionStartYear: '',
  constructionEndYear: '',
  constructionMethod: 'NOT APPLICABLE',
  contractAgreements: 'NOT APPLICABLE',
  materialRates: 'NOT APPLICABLE',
  buildingApproval: '',

  valuationYear: '',
  completionYear: '',
  valuationBullets: [],
  isReverseCalculation: false,
  isValuationDateReverseCalc: false,
  plotAreaLines: [],
  landDimension: '',
  easementAttached: false,
  easementImages: [],
  fsiPermissible: '',
  fsiUtilized: '',
  saleInstancesLines: [],
  ciiBaseYear: '',
  ciiBaseValue: '',
  ciiTargetYear: '',
  ciiTargetValue: '',

  techFloors: 'NOT APPLICABLE',
  techFloorHeight: 'NOT APPLICABLE',
  techPlinthAreaActual: 'NOT APPLICABLE',
  techPlinthAreaApproved: '',
  showPlinthActual: true,
  showPlinthApproved: true,
  techYearConstruction: 'NOT APPLICABLE',
  techYearCompletion: '',
  techFutureLife: 'NOT APPLICABLE',
  techConstructionType: 'NOT APPLICABLE',
  techFoundation: 'NOT APPLICABLE',
  techWallsBasement: 'NOT APPLICABLE',
  techWallsGround: 'NOT APPLICABLE',
  annexMainBuilding: '1 NOS',
  annexAnnexes: 'NIL',
  annexServantsQuarters: 'NIL',
  annexGarage: 'NIL',
  annexPumpHouse: 'NIL',
  plinthAreaConsidered: 'APPROVED',
  techPartitions: 'NOT APPLICABLE',
  techDoorsWindows: 'NOT APPLICABLE',
  techFlooring: 'NOT APPLICABLE',
  techFinishing: 'NOT APPLICABLE',
  techRoofing: 'NOT APPLICABLE',
  techArchitecturalFeatures: 'NOT APPLICABLE',
  techWiring: 'NOT APPLICABLE',
  techFittings: 'SUPERIOR',
  techSanitary: 'NOT APPLICABLE',
  techSanitaryLines: [],
  techCompoundWall: 'NOT APPLICABLE',
  techCompoundWallType: '',
  techLifts: 'NOT APPLICABLE',
  techOverheadTank: 'NOT APPLICABLE',
  techPump: 'NOT APPLICABLE',
  techUndergroundSump: 'NOT APPLICABLE',
  techRoadsPaving: 'NOT APPLICABLE',
  techSewageDisposal: 'NOT APPLICABLE',

  valuationCalcDate: '',
  depreciationRatePerAnnum: '1.5',
  depreciationPct: '0',
  floorRows: [],

  extraItems: [{ id: '1', description: '', amount: '0' }],
  totalBuildingValue: '0',
  totalExtraValue: '0',
  totalPropertyValue: '0',

  propertyImages: [],
  propertyImageNames: [],
  locationMapImage: '',
  latitude: '',
  longitude: '',
  ciiTableImage: '',
  bdaMapImage: '',
  benchmarkImage: '',
  sketchMapImages: [],
  annexures: [],
  annexureEnabled: false,

  hasRemarks: false,
  remarks: '',

  clientType: 'organisation',
  organisationTemplate: 'INCOME_TAX',
};

// ─── Helpers ────────────────────────────────────────────────────────
const parseNum = (v: any): number => {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') return parseFloat(v.replace(/,/g, '') || '0') || 0;
  return 0;
};

// ─── UI Sub-Components ──────────────────────────────────────────────
function Section({ title, number, children, defaultOpen = true }: { title: string; number: number | string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={`section-${number}`} className="card border border-[#e9ecef] overflow-hidden scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0a1628] to-[#162d4a] text-white hover:from-[#0f1e35] hover:to-[#1e3a5f] transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#b8860b] flex items-center justify-center text-sm font-bold">{number}</span>
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <svg className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-6 space-y-5">{children}</div>}
    </div>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SubSection({ id, title, children, defaultOpen = true }: { id: string; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={id} className="border border-[#dee2e6] rounded-xl overflow-hidden scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between px-5 py-3 bg-[#4b5320] text-white hover:bg-[#3f471b] transition-all ${open ? 'border-b border-[#3f471b]' : ''}`}
      >
        <span className="font-bold text-xs uppercase tracking-wider">{title}</span>
        <svg className={`w-4 h-4 text-white/80 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-5 space-y-4 bg-[#fafbfc]">{children}</div>}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] disabled:bg-[#f1f3f5] disabled:text-[#6c757d]";
const selectCls = inputCls;
const textareaCls = `${inputCls} min-h-[80px] resize-y`;

// ── Bullet Editor ─────────────────────────────────────────────────────
function BulletEditor({ label, lines, onChange, disabled, placeholder, span = 2 }: {
  label: string;
  lines: string[];
  onChange: (lines: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  span?: number;
}) {
  const safeLines = Array.isArray(lines) ? lines : [];
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);

  const updateLine = (idx: number, val: string) => {
    const next = [...safeLines];
    next[idx] = val;
    onChange(next);
  };

  const addLine = () => onChange([...safeLines, '']);

  const removeLine = (idx: number) => {
    const next = safeLines.filter((_, i) => i !== idx);
    onChange(next);
  };

  const moveLine = (from: number, to: number) => {
    if (from === null || from === to || from < 0 || to < 0 || from >= safeLines.length || to >= safeLines.length) return;
    const next = [...safeLines];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const showBullets = safeLines.filter(l => l.trim()).length > 1;

  return (
    <div className={`${span === 2 ? 'md:col-span-2' : ''} p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3`}>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-bold text-[#b8860b] uppercase tracking-wider">{label}</label>
        {showBullets && (
          <span className="text-[10px] text-[#b8860b] font-semibold italic">Bullets active ({safeLines.filter(l => l.trim()).length} entries — drag to reorder)</span>
        )}
      </div>
      {safeLines.length > 0 ? (
        <div className="space-y-1.5">
          {safeLines.map((line, idx) => (
            <div
              key={idx}
              draggable={!disabled && safeLines.length > 1}
              onDragStart={() => setDraggedIdx(idx)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (draggedIdx !== null) {
                  moveLine(draggedIdx, idx);
                  setDraggedIdx(null);
                }
              }}
              className={`flex items-start gap-2 p-1 rounded-lg transition-colors ${
                draggedIdx === idx ? 'bg-amber-100/60 border border-dashed border-[#b8860b]' : ''
              }`}
            >
              {!disabled && safeLines.length > 1 && (
                <div className="flex flex-col gap-0.5 mt-2 text-gray-400 shrink-0 cursor-grab active:cursor-grabbing hover:text-[#b8860b]" title="Drag or use arrows to reorder">
                  <button
                    type="button"
                    onClick={() => moveLine(idx, idx - 1)}
                    disabled={idx === 0}
                    className="disabled:opacity-30 p-0.5 hover:bg-black/5 rounded text-[10px] leading-none"
                    title="Move up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => moveLine(idx, idx + 1)}
                    disabled={idx === safeLines.length - 1}
                    className="disabled:opacity-30 p-0.5 hover:bg-black/5 rounded text-[10px] leading-none"
                    title="Move down"
                  >
                    ▼
                  </button>
                </div>
              )}
              {showBullets && (
                <span className="mt-2.5 text-[#b8860b] font-bold text-sm shrink-0">•</span>
              )}
              <textarea
                className={`${textareaCls} flex-1 min-h-[52px]`}
                value={line}
                onChange={e => updateLine(idx, e.target.value)}
                disabled={disabled}
                placeholder={idx === 0 ? placeholder : 'Continue...'}
                rows={2}
              />
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeLine(idx)}
                  className="mt-1.5 p-1.5 rounded-lg text-[#dc3545] hover:bg-[#dc3545]/10 transition-colors"
                  title="Remove entry"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-gray-400 italic py-1 mb-1">
          {disabled ? 'N/A' : 'None added (renders as NOT APPLICABLE in PDF)'}
        </div>
      )}
      {!disabled && (
        <button
          type="button"
          onClick={addLine}
          className="mt-1.5 flex items-center gap-1.5 text-xs text-[#b8860b] hover:text-[#9a7209] font-semibold transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add bullet point
        </button>
      )}
    </div>
  );
}

const FloatingNavigator = ({ isLandOnly, showLandAnnexure }: { isLandOnly: boolean; showLandAnnexure: boolean }) => {
  const [activeId, setActiveId] = useState<string>('');

  const NAV_SECTIONS: { id: string; title: string; sub?: string; indent: boolean }[] = [
    { id: 'section-1', title: '1. Title & Cover', indent: false },
    { id: 'section-2', title: '2. Part I – Questionnaire', indent: false },
    { id: 'subsection-general', title: '↳ General', sub: '01–11', indent: true },
    { id: 'subsection-land', title: '↳ Land', sub: '12–20', indent: true },
    { id: 'subsection-improvement', title: '↳ Improvement', sub: '21–24', indent: true },
    { id: 'subsection-rent', title: '↳ Rent', sub: '25–34', indent: true },
    { id: 'subsection-sales', title: '↳ Sales', sub: '35–37', indent: true },
    { id: 'subsection-construction', title: '↳ Construction', sub: '38–42', indent: true },
    { id: 'section-3', title: '3. Part II – Valuation', indent: false },
    { id: 'subsection-valuation-disc', title: '↳ Valuation Discussion', indent: true },
    
    { id: 'section-4', title: '4. Part III – Declaration', indent: false },
    { id: 'subsection-declaration', title: '↳ Declaration', indent: true },

    { id: 'section-5', title: '5. Annexures & Appendices', indent: false },
    ...(!isLandOnly ? [{ id: 'subsection-tech-details', title: '↳ i) Technical Details', sub: '(Items 01-20)', indent: true }] : []),
    { id: 'subsection-calc-table', title: '↳ ii) MODIFICATION', indent: true },
    { id: 'subsection-extra-items', title: '↳ iii) Extra Items', indent: true },
    { id: 'subsection-total-abstract', title: '↳ iv) Total Abstract', indent: true },
    { id: 'subsection-remarks', title: '↳ v) Remarks', indent: true },
    { id: 'subsection-certificate', title: '↳ vi) Valuation Certificate', sub: '(Preview)', indent: true },
    { id: 'subsection-photos', title: '↳ vii) Appendices: Photos & Maps', indent: true },
    { id: 'subsection-land-annexure', title: '↳ viii) Land Annexure', sub: '(Multi-Plot)', indent: true },
  ];

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

    NAV_SECTIONS.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [NAV_SECTIONS]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="hidden xl:flex flex-col gap-0.5 bg-white/90 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-[#e9ecef] p-2.5 rounded-2xl w-[210px] sticky top-24 shrink-0 z-40">
      <div className="text-[10px] font-black text-neutral-400 mb-1 px-2 uppercase tracking-widest">Report Sections</div>
      {NAV_SECTIONS.map((sec) => {
        const isActive = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            className={`text-left py-1 px-2.5 rounded-lg transition-all flex flex-col justify-center ${
              !sec.indent 
                ? 'my-1 font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-100 shadow-sm' 
                : 'pl-3.5 text-slate-600 hover:bg-[#b8860b]/10 hover:text-[#b8860b]'
            } ${
              isActive
                ? '!bg-[#b8860b] !text-white !border-[#b8860b] shadow-md'
                : ''
            }`}
          >
            <span className={`leading-tight ${sec.indent ? 'text-[11px] font-bold' : 'text-[11.5px]'}`}>
              {sec.title}
            </span>
            {sec.sub && (
              <span className={`text-[9px] font-semibold tracking-wider mt-0.5 ${isActive ? 'text-amber-100' : 'text-slate-400'}`}>
                {sec.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────
interface BucketImageItem {
  id: string;
  url: string;
  fileName: string;
  size: number;
  createdAt: string;
  employee: { name: string; employeeId: string };
}

interface IncomeTaxReportBuilderProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole?: string;
  bucketImages?: BucketImageItem[];
  prefill?: {
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    propertyAddress?: string;
    propertyType?: string;
    purpose?: string;
  };
  onReset?: () => void;
}

export default function IncomeTaxReportBuilder({ projectId, projectCode, initialFields, status, userRole = 'REPORT_EMPLOYEE', bucketImages = [], prefill, onReset }: IncomeTaxReportBuilderProps) {
  const router = useRouter();

  const reportRef = useRef<HTMLDivElement>(null);

  const merged: IncomeTaxFields = {
    ...DEFAULT_FIELDS,
    ...(typeof initialFields === 'object' && initialFields !== null ? initialFields : {}),
    propertyType: initialFields?.propertyType
      ? (PROPERTY_TYPES.includes(initialFields.propertyType.toUpperCase()) ? initialFields.propertyType.toUpperCase() : 'RESIDENTIAL LAND & BUILDING')
      : (prefill?.propertyType && PROPERTY_TYPES.includes(prefill.propertyType.toUpperCase()) ? prefill.propertyType.toUpperCase() : DEFAULT_FIELDS.propertyType),
    refNo: initialFields?.refNo || projectCode || DEFAULT_FIELDS.refNo,
    ownerName: initialFields?.ownerName || prefill?.contactName || DEFAULT_FIELDS.ownerName,
    ownerAddress: initialFields?.ownerAddress || prefill?.propertyAddress || DEFAULT_FIELDS.ownerAddress,
    propertyImages: Array.isArray(initialFields?.propertyImages) ? initialFields.propertyImages : DEFAULT_FIELDS.propertyImages,
    propertyImageNames: Array.isArray(initialFields?.propertyImageNames) ? initialFields.propertyImageNames : DEFAULT_FIELDS.propertyImageNames,
    sketchMapImages: Array.isArray(initialFields?.sketchMapImages) 
      ? initialFields.sketchMapImages 
      : (typeof initialFields?.sketchMapImage === 'string' && initialFields.sketchMapImage ? [initialFields.sketchMapImage] : DEFAULT_FIELDS.sketchMapImages),
    floorRows: Array.isArray(initialFields?.floorRows) ? initialFields.floorRows : DEFAULT_FIELDS.floorRows,
    extraItems: Array.isArray(initialFields?.extraItems) ? initialFields.extraItems : DEFAULT_FIELDS.extraItems,
    valuationBullets: Array.isArray(initialFields?.valuationBullets) ? initialFields.valuationBullets : DEFAULT_FIELDS.valuationBullets,
    annexures: Array.isArray(initialFields?.annexures) ? initialFields.annexures : DEFAULT_FIELDS.annexures,
    annexureEnabled: initialFields?.annexureEnabled ?? DEFAULT_FIELDS.annexureEnabled,
    showPlinthActual: initialFields?.showPlinthActual !== undefined ? initialFields.showPlinthActual : true,
    showPlinthApproved: initialFields?.showPlinthApproved !== undefined ? initialFields.showPlinthApproved : true,
    techFittings: initialFields?.techFittings !== undefined ? initialFields.techFittings : DEFAULT_FIELDS.techFittings,
    latitude: initialFields?.latitude || '',
    longitude: initialFields?.longitude || '',
    // Migration: convert old string fields to string[] for bullet editors
    briefDescriptionLines: Array.isArray(initialFields?.briefDescriptionLines)
      ? initialFields.briefDescriptionLines
      : (() => {
          const parts: string[] = [];
          if (typeof initialFields?.briefDescription === 'string' && initialFields.briefDescription) parts.push(initialFields.briefDescription);
          if (typeof initialFields?.briefDescriptionCont === 'string' && initialFields.briefDescriptionCont) parts.push(initialFields.briefDescriptionCont);
          return parts.length > 0 ? parts : [];
        })(),
    locationDetailsLines: Array.isArray(initialFields?.locationDetailsLines)
      ? initialFields.locationDetailsLines
      : (typeof initialFields?.locationDetails === 'string' && initialFields.locationDetails ? [initialFields.locationDetails] : []),
    techSanitaryLines: Array.isArray(initialFields?.techSanitaryLines)
      ? initialFields.techSanitaryLines
      : (typeof initialFields?.techSanitary === 'string' && initialFields.techSanitary && initialFields.techSanitary !== 'NOT APPLICABLE'
          ? initialFields.techSanitary.split('\n').filter(Boolean)
          : []),
    surveyPlotNoLines: Array.isArray(initialFields?.surveyPlotNoLines)
      ? initialFields.surveyPlotNoLines
      : (typeof initialFields?.surveyPlotNo === 'string' && initialFields.surveyPlotNo ? [initialFields.surveyPlotNo] : []),
    // Migration: Q25 — old single tenantDetails splits into 4 fields
    tenantName: initialFields?.tenantName || (initialFields?.tenantDetails && initialFields.tenantDetails !== 'NOT APPLICABLE' ? initialFields.tenantDetails : 'NOT APPLICABLE'),
    tenantPortion: initialFields?.tenantPortion || 'NOT APPLICABLE',
    tenantRent: initialFields?.tenantRent || 'NOT APPLICABLE',
    tenantGrossAmount: initialFields?.tenantGrossAmount || 'NOT APPLICABLE',
    // Migration: Q39 — old landRate string preserved; new structured fields
    landRatePerUnit: initialFields?.landRatePerUnit || '',
    landRateUnit: initialFields?.landRateUnit || 'DEC',
    clientType: initialFields?.clientType || 'organisation',
    organisationTemplate: initialFields?.organisationTemplate || 'INCOME_TAX',
    institutionCategory: initialFields?.institutionCategory || 'Income Tax Department',
    serviceType: initialFields?.serviceType || 'Income Tax Valuation',
    subjectType: initialFields?.subjectType || prefill?.propertyType || 'Residential Property',
    valuationLayout: initialFields?.valuationLayout || 'land_building',
  };

  const [fields, setFields] = useState<IncomeTaxFields>(merged);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Bucket Picker State
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [bucketPickerMode, setBucketPickerMode] = useState<'propertyImages' | 'sketchMapImages' | 'locationMapImage' | 'benchmarkImage' | 'ciiTableImage' | 'bdaMapImage'>('propertyImages');
  const [bucketSelected, setBucketSelected] = useState<Set<string>>(new Set());
  const [bucketPickerAgent, setBucketPickerAgent] = useState<string | null>(null);

  const [localBucketImages, setLocalBucketImages] = useState<any[]>(bucketImages);

  const handleDeleteBucketImage = async (img: any) => {
    if (!confirm('Delete this photo from the bucket?')) return;
    try {
      await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .remove([img.storagePath]);

      const res = await deleteBucketImage(img.id);
      if (res.error) {
        alert(res.error);
      } else {
        setLocalBucketImages(prev => prev.filter(i => i.id !== img.id));
        setBucketSelected(prev => {
          const next = new Set(prev);
          next.delete(img.id);
          return next;
        });
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete photo.');
    }
  };

  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const bypassUnloadRef = useRef(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isInitialMount = useRef(true);
  const debouncedSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isReadOnly) return;

    setAutoSaveStatus('saving');

    if (debouncedSaveTimer.current) {
      clearTimeout(debouncedSaveTimer.current);
    }

    debouncedSaveTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res?.error) {
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('error');
      }
    }, 1200);

    return () => {
      if (debouncedSaveTimer.current) {
        clearTimeout(debouncedSaveTimer.current);
      }
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypassUnloadRef.current || isReadOnly) return;
      saveReportDraft(projectId, fields).catch(e => console.error(e));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  // Rework Modal State
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkComment, setReworkComment] = useState('');
  // Q01 Purpose field lock/unlock
  const [purposeUnlocked, setPurposeUnlocked] = useState(false);
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';
  const isLandOnly = !fields.propertyType.includes('BUILDING');

  const handleResetWizard = async () => {
    if (confirm("Are you sure you want to change report parameters? This will permanently clear all your typed data and reset the report.")) {
      if (onReset) {
        onReset();
      }
    }
  };
  const handleChange = useCallback((field: keyof IncomeTaxFields, value: any) => {
    setFields(prev => {
      const next = { ...prev, [field]: value };
      if (['landArea', 'landAreaUnit', 'landRatePerUnit', 'landRateUnit', 'landRateSecondaryUnit'].includes(field as string)) {
        const rateVal = next.landRatePerUnit;
        const pUnit = next.landRateUnit || 'DEC';
        const sUnit = next.landRateSecondaryUnit || 'ACRE';
        if (rateVal) {
          next.landRateSecondaryPerUnit = convertLandRate(rateVal, pUnit, sUnit);
        }
        if (next.landArea && rateVal) {
          const totalVal = calculateTotalLandValue(
            next.landArea,
            next.landAreaUnit || pUnit,
            rateVal,
            pUnit
          );
          if (totalVal > 0) {
            next.totalLandValue = String(totalVal);
          }
        }
      }
      return next;
    });
  }, []);

  // ── Bucket Picker Handlers ──
  const openBucketPicker = async (mode: typeof bucketPickerMode) => {
    setBucketPickerMode(mode);
    setBucketSelected(new Set());
    setBucketPickerAgent(null);
    setBucketPickerOpen(true);
    // Auto-fetch latest DB records each time the picker opens
    try {
      const res = await getBucketImages(projectId);
      if (res.images) {
        setLocalBucketImages(res.images.map((img: any) => ({
          ...img,
          createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : String(img.createdAt)
        })));
      }
    } catch (e) {
      console.error('Bucket fetch error:', e);
    }
  };

  const handleBucketConfirm = () => {
    const selectedImages = localBucketImages.filter(img => bucketSelected.has(img.id));
    if (selectedImages.length === 0) { setBucketPickerOpen(false); return; }

    if (bucketPickerMode === 'propertyImages') {
      const newUrls = [...(fields.propertyImages || []), ...selectedImages.map(img => img.url)];
      handleChange('propertyImages', newUrls);
    } else if (bucketPickerMode === 'sketchMapImages') {
      const newUrls = [...(fields.sketchMapImages || []), ...selectedImages.map(img => img.url)];
      handleChange('sketchMapImages', newUrls);
    } else {
      handleChange(bucketPickerMode, selectedImages[0].url);
    }

    setBucketPickerOpen(false);
    setBucketSelected(new Set());
    setMessage({ type: 'success', text: `${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} added from bucket!` });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleBucketImage = (id: string) => {
    setBucketSelected(prev => {
      const next = new Set(prev);
      if (bucketPickerMode !== 'propertyImages' && bucketPickerMode !== 'sketchMapImages') {
        next.clear();
        next.add(id);
      } else {
        if (next.has(id)) next.delete(id); else next.add(id);
      }
      return next;
    });
  };

  // ── Floor Row Helpers ──
  const addFloorRow = () => {
    handleChange('floorRows', [...fields.floorRows, {
      id: String(Date.now()),
      name: `FLOOR ${fields.floorRows.length + 1}`,
      plinthArea: '',
      roofHeight: '',
      age: '',
      ratePerSqft: '',
      replacementCost: '0',
      depreciationAmt: '0',
      netValue: '0',
    }]);
  };
  const removeFloorRow = (id: string) => {
    handleChange('floorRows', fields.floorRows.filter(f => f.id !== id));
  };
  const updateFloorRow = (id: string, key: keyof ValuationFloorRow, value: string) => {
    handleChange('floorRows', fields.floorRows.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  // ── Extra Item Helpers ──
  const addExtraItem = () => {
    handleChange('extraItems', [...fields.extraItems, {
      id: String(Date.now()),
      description: '',
      amount: '0',
    }]);
  };
  const removeExtraItem = (id: string) => {
    handleChange('extraItems', fields.extraItems.filter(e => e.id !== id));
  };
  const updateExtraItem = (id: string, key: keyof ExtraItem, value: string) => {
    handleChange('extraItems', fields.extraItems.map(e => e.id === id ? { ...e, [key]: value } : e));
  };

  // ── Annexure helpers (mirrors GeneralReportBuilder) ──
  const addAnnexure = () => {
    const nextIndex = fields.annexures.length;
    const label = String.fromCharCode(65 + nextIndex); // A, B, C, ...
    handleChange('annexures', [...fields.annexures, {
      id: String(Date.now()),
      label,
      title: '',
      excelFileUrl: '',
      excelFileName: '',
    }]);
  };
  const removeAnnexure = (id: string) => {
    handleChange('annexures', fields.annexures.filter(a => a.id !== id));
  };
  const updateAnnexureTitle = (id: string, title: string) => {
    handleChange('annexures', fields.annexures.map(a => a.id === id ? { ...a, title } : a));
  };
  const handleAnnexureUpload = async (annexureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUploadError('File exceeds 10MB limit.'); return; }
    e.target.value = '';
    setUploading(true);
    setUploadError(null);
    // Parse client-side — cell-by-cell to preserve merge info and column widths
    let parsedData: AnnexureItem['parsedData'] | undefined;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const ref = ws['!ref'];
      if (ref) {
        const range = XLSX.utils.decode_range(ref);
        // Parse client-side — cell-by-cell to preserve merge info and column widths
        let allRows: string[][] = [];
        for (let r = range.s.r; r <= range.e.r; r++) {
          const row: string[] = [];
          for (let c = range.s.c; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[addr];
            row.push(cell ? String(XLSX.utils.format_cell(cell)) : '');
          }
          allRows.push(row);
        }
        const merges = ((ws['!merges'] || []) as any[]).map((m: any) => ({
          sr: m.s.r - range.s.r, sc: m.s.c - range.s.c,
          er: m.e.r - range.s.r, ec: m.e.c - range.s.c,
        }));
        const wsCols: any[] = ws['!cols'] || [];
        const numCols = range.e.c - range.s.c + 1;
        const rawW: number[] = [];
        for (let c = 0; c < numCols; c++) {
          const col = wsCols[range.s.c + c];
          rawW.push(col?.wpx || (col?.wch ? col.wch * 7 : 0) || 64);
        }
        const totalW = rawW.reduce((s, w) => s + w, 0) || numCols * 64;
        const colWidths = rawW.map(w => w / totalW);
        parsedData = {
          headers: allRows[0]?.map(h => String(h)) || [],
          rows: allRows.slice(1).map(row => row.map(c => String(c))),
          allRows,
          merges,
          colWidths,
        };
      }
    } catch (parseErr) {
      console.warn('Could not parse Excel/CSV file:', parseErr);
    }
    // Upload to Supabase storage
    const ext = file.name.split('.').pop();
    const fileName = `annexure-${annexureId}-${Date.now()}.${ext}`;
    const filePath = `annexures/${projectId}/${fileName}`;
    const { error } = await supabaseBrowser.storage
      .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
      .upload(filePath, file);
    if (error) {
      setUploadError(`Upload failed: ${error.message}`);
    } else {
      const { data } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);
      handleChange('annexures', fields.annexures.map(a =>
        a.id === annexureId ? { ...a, excelFileUrl: data.publicUrl, excelFileName: file.name, parsedData } : a
      ));
    }
    setUploading(false);
  };
  const removeAnnexureFile = (annexureId: string) => {
    handleChange('annexures', fields.annexures.map(a =>
      a.id === annexureId ? { ...a, excelFileUrl: '', excelFileName: '', parsedData: undefined } : a
    ));
  };

  // ── Valuation Bullet Helpers ──
  const addBullet = () => {
    handleChange('valuationBullets', [...fields.valuationBullets, '']);
  };
  const removeBullet = (idx: number) => {
    handleChange('valuationBullets', fields.valuationBullets.filter((_, i) => i !== idx));
  };
  const updateBullet = (idx: number, value: string) => {
    handleChange('valuationBullets', fields.valuationBullets.map((b, i) => i === idx ? value : b));
  };

  // ── Computed Values ──
  const computedLandValue = parseNum(fields.totalLandValue);

  const computedFloorRows = fields.floorRows.map(f => {
    const area = parseNum(f.plinthArea);
    const rate = parseNum(f.ratePerSqft);
    const replacementCost = area * rate;
    const depPct = parseNum(fields.depreciationPct);
    const depAmt = replacementCost * depPct / 100;
    const netValue = replacementCost - depAmt;
    return { ...f, replacementCost, depAmt, netValue };
  });

  const computedBuildingValue = computedFloorRows.reduce((sum, f) => sum + f.netValue, 0);
  const computedExtraTotal = fields.extraItems.reduce((sum, e) => sum + parseNum(e.amount), 0);
  const computedTotalProperty = computedLandValue + computedBuildingValue + computedExtraTotal;

  // ── File upload ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'propertyImages' | 'sketchMapImages' | 'easementImages' | 'locationMapImage' | 'benchmarkImage' | 'ciiTableImage' | 'bdaMapImage') => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError(null);

    const uploadedUrls: string[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 5 * 1024 * 1024) { setUploadError(`${file.name}: exceeds 5MB.`); continue; }
      const ext = file.name.split('.').pop();
      const fileName = `${projectId}-${fieldName}-${Date.now()}-${i}.${ext}`;
      const filePath = `temp-photos/${projectId}/${fileName}`;
      const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
      if (error) { setUploadError(`Failed: ${error.message}`); }
      else {
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        uploadedUrls.push(data.publicUrl);
      }
    }

    if (uploadedUrls.length > 0) {
      if (fieldName === 'propertyImages') {
        handleChange('propertyImages', [...(fields.propertyImages || []), ...uploadedUrls]);
      } else if (fieldName === 'sketchMapImages') {
        handleChange('sketchMapImages', [...(fields.sketchMapImages || []), ...uploadedUrls]);
      } else if (fieldName === 'easementImages') {
        handleChange('easementImages', [...(fields.easementImages || []), ...uploadedUrls]);
      } else {
        handleChange(fieldName, uploadedUrls[0]);
      }
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    handleChange('propertyImages', fields.propertyImages.filter((_, i) => i !== index));
    if (fields.propertyImageNames) {
      handleChange('propertyImageNames', fields.propertyImageNames.filter((_, i) => i !== index));
    }
  };

  const removeSketchMap = (index: number) => {
    handleChange('sketchMapImages', (fields.sketchMapImages || []).filter((_, i) => i !== index));
  };

  // ── Save / Submit / Finalize / Rework ──
  const handleSaveDraft = async () => {
    setLoading(true); setMessage(null);
    const result = await saveReportDraft(projectId, fields);
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Draft saved successfully!' });
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!Array.isArray(fields.propertyImages) || fields.propertyImages.length < 2) {
      setMessage({ type: 'error', text: 'Please upload at least 2 property photographs before submitting.' });
      return;
    }
    if (!confirm('Submit this report for manager verification? You cannot edit it until the manager returns it.')) return;
    setLoading(true); setMessage(null);
    await saveReportDraft(projectId, fields);
    const result = await submitReportForVerification(projectId);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else {
      setMessage({ type: 'success', text: 'Report submitted for verification!' });
      router.refresh();
    }
    setLoading(false);
  };

  const handleFinalize = async () => {
    if (!Array.isArray(fields.propertyImages) || fields.propertyImages.length < 2) {
      setMessage({ type: 'error', text: 'Please upload at least 2 property photographs before finalizing.' });
      return;
    }
    if (!confirm('Finalize this report and share it with the client? This will generate the official PDF.')) return;
    setLoading(true);
    setMessage({ type: 'success', text: 'Generating final PDF...' });
    try {
      await saveReportDraft(projectId, fields);
      const pdfBlob = await generateIncomeTaxPDF(
        fields,
        computedLandValue,
        computedFloorRows,
        computedBuildingValue,
        computedExtraTotal,
        computedTotalProperty,
        isLandOnly
      );
      if (pdfBlob) {
        const pdfFileName = `${projectId}-report-${Date.now()}.pdf`;
        const pdfPath = `reports/pdfs/${pdfFileName}`;
        const { error: uploadErr } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });
        if (!uploadErr) {
          const { data: urlData } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(pdfPath);
          try {
            const { data: files } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).list(`temp-photos/${projectId}`);
            if (files && files.length > 0) {
              const paths = files.map(f => `temp-photos/${projectId}/${f.name}`);
              await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).remove(paths);
            }
          } catch (err) { console.error('Failed to cleanup temp photos:', err); }
          const finalFields = { ...fields, propertyImages: [] };
          await saveReportDraft(projectId, finalFields);
          const { finalizeReport } = await import('@/app/actions/project');
          const res = await finalizeReport(projectId, urlData.publicUrl);
          if (res.error) setMessage({ type: 'error', text: res.error });
          else { setFields(finalFields); setMessage({ type: 'success', text: 'Project Finalized! PDF is now available.' }); }
        } else {
          setMessage({ type: 'error', text: 'Failed to upload PDF.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    } finally {
      setLoading(false);
    }
  };

  const handleReworkClick = () => setShowReworkModal(true);

  const submitRework = async () => {
    if (!reworkComment.trim()) {
      setMessage({ type: 'error', text: 'Please provide a comment for rework.' });
      return;
    }
    setLoading(true);
    const { sendReportForRework } = await import('@/app/actions/project');
    const res = await sendReportForRework(projectId, reworkComment);
    if (res.error) setMessage({ type: 'error', text: res.error });
    else {
      setMessage({ type: 'success', text: 'Report sent for rework.' });
      setShowReworkModal(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleCancelSubmission = async () => {
    if (!confirm('Cancel this submission and return to drafting?')) return;
    setLoading(true);
    const { cancelReportSubmission } = await import('@/app/actions/project');
    const res = await cancelReportSubmission(projectId);
    if (res.error) setMessage({ type: 'error', text: res.error });
    else {
      setMessage({ type: 'success', text: 'Submission cancelled. You can now edit the report.' });
      router.refresh();
    }
    setLoading(false);
  };

  // ── PDF Preview ──
  const handlePreviewPDF = async () => {
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Generating PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #b8860b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating PDF Preview...</p>
              <p style="font-size: 12px; color: #6c757d; margin: 8px 0 0;">Please wait while the document compiles.</p>
            </div>
            <style>
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }

    try {
      const blob = await generateIncomeTaxPDF(
        fields,
        computedLandValue,
        computedFloorRows,
        computedBuildingValue,
        computedExtraTotal,
        computedTotalProperty,
        isLandOnly
      );
      if (blob && previewWindow) {
        const url = URL.createObjectURL(blob);
        previewWindow.location.href = url;
      } else if (previewWindow) {
        previewWindow.close();
        setMessage({ type: 'error', text: 'Failed to generate PDF preview.' });
      }
    } catch (err: any) {
      if (previewWindow) previewWindow.close();
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    }
  };

  // ── PDF Download ──
  const handleDownloadPDF = async () => {
    setMessage({ type: 'success', text: 'Generating PDF for download...' });
    try {
      const blob = await generateIncomeTaxPDF(
        fields,
        computedLandValue,
        computedFloorRows,
        computedBuildingValue,
        computedExtraTotal,
        computedTotalProperty,
        isLandOnly
      );
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `IT-ValuationReport-${fields.ownerName ? fields.ownerName.replace(/\s+/g, '_') : projectCode}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      }
      setMessage(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    }
  };

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-2xl border border-neutral-200 shadow-md w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#b8860b] border-t-transparent"></div>
        <p className="mt-4 text-sm font-bold text-[#0f2038]">{loadingText}</p>
      </div>
    );
  }

  return (
    <div className="flex gap-6 items-start w-full" ref={reportRef}>
      {/* Main Form Column */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Template Info Banner */}
        <div className="p-4 bg-white border border-[#dee2e6] flex flex-row items-center justify-between gap-4 shadow-md rounded-2xl sticky top-2 z-50">
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight min-w-[90px] select-none">
              Active<br />Configuration
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {fields.clientType === 'organisation' ? 'Organisation / Bank' : 'Individual'}
              </span>
              {fields.clientType === 'organisation' && (
                <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  {fields.institutionCategory || 'Income Tax'}
                </span>
              )}
              <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                Service: {(SERVICES_LIST.find(s => s.id === fields.serviceType)?.title || fields.serviceType || 'Income Tax Valuation').replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                Subject: {(fields.subjectType || 'Property').replace(/_/g, ' ')}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetWizard}
            className="text-xs text-[#b8860b] hover:text-[#8a6507] hover:underline font-bold transition-colors shrink-0 pr-2 uppercase"
          >
            Change Parameters
          </button>
        </div>

        {/* Rework Banner */}
        {fields.reworkNotes && status === 'REPORT_DRAFTING' && (
          <div className="card p-5 border-2 border-red-200 bg-red-50 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">Manager Rework Requested</h2>
            </div>
            <p className="text-sm font-medium text-red-900 leading-relaxed whitespace-pre-wrap">{fields.reworkNotes}</p>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* ═══ SECTION 1: TITLE & COVER ═══ */}
        <Section title="Title & Cover Page" number={1}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Property Type">
              <select className={selectCls} value={fields.propertyType} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly}>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="REF NO">
              <input className={inputCls} value={fields.refNo} onChange={e => handleChange('refNo', e.target.value)} disabled={isReadOnly} placeholder="SMA/V-01/IT/BBSR-XX/YY" />
            </Field>
            <Field label="Date of Valuation Report">
              <input type="date" className={inputCls} value={fields.reportDate} onChange={e => handleChange('reportDate', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Owner Name (ALL CAPS)">
              <input className={inputCls} value={fields.ownerName} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} placeholder="MR. JAYANTA KUMAR DAS & OTHERS" />
            </Field>
            <Field label="Full Legal Property Description" span={2}>
              <textarea className={textareaCls} value={fields.propertyDescription} onChange={e => handleChange('propertyDescription', e.target.value)} disabled={isReadOnly}
                placeholder="BEARING KHATA NO: XX, PLOT NO: XX, MOUZA: XX, PS: XX, TAHASIL: XX, DIST: XX, ODISHA" rows={4} />
            </Field>
          </div>
        </Section>

        {/* ═══ SECTION 2: PART I – QUESTIONNAIRE (all sub-parts) ═══ */}
        <Section title="PART I – QUESTIONNAIRE" number={2}>
          <div className="space-y-3">

          {/* ── Sub-section: GENERAL ── */}
          <SubSection id="subsection-general" title="General (01–11)">
            <div className="grid md:grid-cols-2 gap-4">

              {/* Q01 — Purpose locked with change button */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5">01 — Purpose for Which the Valuation is Made</label>
                <div className="flex items-center gap-2">
                  <input
                    className={`${inputCls} flex-1 bg-[#f8f9fa] font-semibold`}
                    value={fields.purposeOfValuation}
                    onChange={e => handleChange('purposeOfValuation', e.target.value)}
                    disabled={!purposeUnlocked || isReadOnly}
                    placeholder="TO ASSESS OF CAPITAL GAIN FOR INCOME TAX"
                  />
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => setPurposeUnlocked(v => !v)}
                      className={`shrink-0 text-xs font-bold px-3 py-2 rounded-lg border transition-all ${
                        purposeUnlocked
                          ? 'bg-[#b8860b] text-white border-[#b8860b] hover:bg-[#8a6507]'
                          : 'bg-white text-[#b8860b] border-[#b8860b] hover:bg-[#fffbf0]'
                      }`}
                    >
                      {purposeUnlocked ? '🔓 Lock' : '✏️ Change'}
                    </button>
                  )}
                </div>
                {purposeUnlocked && !isReadOnly && (
                  <p className="mt-1 text-xs text-amber-600 font-medium">Field is now editable. Lock it when done.</p>
                )}
              </div>

              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">02 — Dates & Identification</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Field label="Part A — Valuation Date">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.valuationDate || ''}
                        onChange={e => handleChange('valuationDate', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. 01.04.2001 or 13-08-2026"
                      />
                    </Field>
                    <label className="flex items-center gap-2 text-xs font-medium text-[#495057] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!fields.isValuationDateReverseCalc}
                        onChange={e => handleChange('isValuationDateReverseCalc', e.target.checked)}
                        disabled={isReadOnly}
                        className="rounded border-gray-300 text-[#b8860b] focus:ring-[#b8860b]"
                      />
                      <span>(VALUATION AT THAT TIME BY REVERSE CALCULATION METHOD)</span>
                    </label>
                  </div>
                  <Field label="Part B — Date of Inspection">
                    <input type="date" className={inputCls} value={fields.inspectionDate} onChange={e => handleChange('inspectionDate', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="Part C — Date of Valuation Report">
                    <input type="date" className={inputCls} value={fields.reportDate} onChange={e => handleChange('reportDate', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="Part D — Identified By Whom">
                    <input className={inputCls} value={fields.identifiedBy} onChange={e => handleChange('identifiedBy', e.target.value)} disabled={isReadOnly} placeholder="MR. TRILOCHAN NAYAK" />
                  </Field>
                </div>
              </div>
              <Field label="03 — Name of the Owner/Owners" span={2}>
                <input className={inputCls} value={fields.ownerAddress} onChange={e => handleChange('ownerAddress', e.target.value)} disabled={isReadOnly}
                  placeholder="MR. TRILOCHAN NAYAK, S/O: JATINDRA NATH NAYAK" />
              </Field>
              <Field label="04 — Joint/Co-Ownership & Share" span={2}>
                <select className={selectCls} value={fields.ownershipType} onChange={e => handleChange('ownershipType', e.target.value)} disabled={isReadOnly}>
                  <option value="SINGLE OWNERSHIP LAND & FREE HOLD IN NATURE">SINGLE OWNERSHIP LAND & FREE HOLD IN NATURE</option>
                  <option value="JOINT OWNERSHIP LAND & FREE HOLD IN NATURE">JOINT OWNERSHIP LAND & FREE HOLD IN NATURE</option>
                  <option value="CO-OWNERSHIP LAND & FREE HOLD IN NATURE">CO-OWNERSHIP LAND & FREE HOLD IN NATURE</option>
                </select>
              </Field>
              <BulletEditor
                label="05 — Brief Description of the Property"
                lines={fields.briefDescriptionLines}
                onChange={lines => handleChange('briefDescriptionLines', lines)}
                disabled={isReadOnly}
                placeholder="THIS IMMOVABLE PROPERTY CONSISTS OF A LAND SITUATED BEARING KHATA NO: ..."
              />
              <BulletEditor
                label="06 — Location, Street, Ward No."
                lines={fields.locationDetailsLines}
                onChange={lines => handleChange('locationDetailsLines', lines)}
                disabled={isReadOnly}
                placeholder="KHATA NO: XX, PLOT NO: XX&#10;MOUZA- ...&#10;THANA– ...&#10;TAHASIL– ..."
              />
              <BulletEditor
                label="07 — Survey/Plot No. of Land"
                lines={fields.surveyPlotNoLines}
                onChange={lines => handleChange('surveyPlotNoLines', lines)}
                disabled={isReadOnly}
                placeholder="KHATA NO: XX, PLOT NO: XX, XX, XX..."
              />
              <Field label="08 — Property Area Classification">
                <select className={selectCls} value={fields.areaType} onChange={e => handleChange('areaType', e.target.value)} disabled={isReadOnly}>
                  <option value="RESIDENTIAL AREA">RESIDENTIAL AREA</option>
                  <option value="COMMERCIAL AREA">COMMERCIAL AREA</option>
                  <option value="MIXED AREA">MIXED AREA</option>
                  <option value="INDUSTRIAL AREA">INDUSTRIAL AREA</option>
                </select>
              </Field>
              <Field label="09 — Classification of Locality">
                <select className={selectCls} value={fields.classOfLocality} onChange={e => handleChange('classOfLocality', e.target.value)} disabled={isReadOnly}>
                  <option value="HIGH">HIGH</option>
                  <option value="MIDDLE">MIDDLE</option>
                  <option value="POOR">POOR</option>
                </select>
              </Field>
              <Field label="10 — Proximity to Civic Amenities (KMS)" span={2}>
                <input className={inputCls} value={fields.civicAmenitiesDistance} onChange={e => handleChange('civicAmenitiesDistance', e.target.value)} disabled={isReadOnly}
                  placeholder="4-5 KMS" />
              </Field>
              <Field label="11 — Means & Proximity to Surface Communication" span={2}>
                <input className={inputCls} value={fields.meansCommunication} onChange={e => handleChange('meansCommunication', e.target.value)} disabled={isReadOnly}
                  placeholder="THE LOCALITY IS SERVED BY MEANS OF PUBLIC AND PRIVATE TRANSPORT SYSTEM." />
              </Field>

            </div>
          </SubSection>

          {/* ── Sub-section: LAND ── */}
          <SubSection id="subsection-land" title="Land (12–20)">
            <div className="grid md:grid-cols-2 gap-4">

              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">12 — Area, Shape, Dimensions & Physical Features</span>
                <BulletEditor
                  label="Area of the Plot (e.g. ROR / Sale Deed Entries)"
                  lines={
                    fields.plotAreaLines && fields.plotAreaLines.length > 0 && fields.plotAreaLines.some(l => l.trim().length > 0)
                      ? fields.plotAreaLines
                      : (fields.landArea ? [formatLandAreaWithSqft(`${fields.landArea} ${fields.landAreaUnit || 'DEC'}`)] : [])
                  }
                  onChange={lines => handleChange('plotAreaLines', lines)}
                  disabled={isReadOnly}
                  placeholder="e.g. AC.0.050 DEC I.E. 2178.00 SFT (AS PER ROR)"
                />
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Primary Land Area & Unit">
                    <div className="flex gap-2">
                      <input className={inputCls} value={fields.landArea} onChange={e => handleChange('landArea', e.target.value)} disabled={isReadOnly} placeholder="AC.0.050" />
                      <select className="w-28 px-2 py-2 rounded-lg border border-[#dee2e6] text-sm" value={fields.landAreaUnit} onChange={e => handleChange('landAreaUnit', e.target.value)} disabled={isReadOnly}>
                        <option value="DEC">DEC</option>
                        <option value="ACRE">ACRE</option>
                        <option value="SQFT">SQFT</option>
                        <option value="SQMT">SQMT</option>
                      </select>
                    </div>
                  </Field>
                  <Field label="Shape of the Land">
                    <input className={inputCls} value={fields.landShape} onChange={e => handleChange('landShape', e.target.value)} disabled={isReadOnly} placeholder="RECTANGULAR SHAPE" />
                  </Field>
                  <Field label="Dimension of the Plot (if any)">
                    <input className={inputCls} value={fields.landDimension || ''} onChange={e => handleChange('landDimension', e.target.value)} disabled={isReadOnly} placeholder="e.g. NORTH: 50', SOUTH: 50'..." />
                  </Field>
                  <Field label="Physical Features & Level">
                    <input className={inputCls} value={fields.landLevel} onChange={e => handleChange('landLevel', e.target.value)} disabled={isReadOnly} placeholder="FLAT AND HIGH LEVEL LAND" />
                  </Field>
                </div>
              </div>
              <Field label="13 — Roads/Streets the Land is Abutting" span={2}>
                <input className={inputCls} value={fields.roadAccess} onChange={e => handleChange('roadAccess', e.target.value)} disabled={isReadOnly}
                  placeholder='THE LAND IS ABUTTING BY 20&apos;-0" WIDE CC ROAD' />
              </Field>
              <Field label="14 — Freehold or Leasehold">
                <input className={inputCls} value={fields.landTenure} onChange={e => handleChange('landTenure', e.target.value)} disabled={isReadOnly} placeholder="IT IS FREE HOLD LAND" />
              </Field>
              <Field label="15 — Lease Details (if Leasehold)">
                <input className={inputCls} value={fields.leaseDetails} onChange={e => handleChange('leaseDetails', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <Field label="16 — Restrictive Covenant on Land Use" span={2}>
                <input className={inputCls} value={fields.restrictiveCovenant} onChange={e => handleChange('restrictiveCovenant', e.target.value)} disabled={isReadOnly}
                  placeholder="AS PER BDA CDP MAP, IT IS COMING UNDER AGRICULTURE USE ZONE" />
              </Field>

              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#b8860b] uppercase tracking-wider">17 — AGREEMENT OF EASEMENTS? IF SO, ATTACH COPIES.</label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-[#b8860b] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!fields.easementAttached}
                      onChange={e => handleChange('easementAttached', e.target.checked)}
                      disabled={isReadOnly}
                      className="rounded border-gray-300 text-[#b8860b] focus:ring-[#b8860b]"
                    />
                    <span>Attach Copies in Annexure</span>
                  </label>
                </div>
                <Field label="Easement Details / Description">
                  <input className={inputCls} value={fields.easements} onChange={e => handleChange('easements', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
                </Field>
                {fields.easementAttached && (
                  <div className="p-3 bg-white border border-[#d1e7dd] rounded-lg space-y-2">
                    <span className="text-xs font-semibold text-gray-700 block">Easement Agreement Documents (Images / Scans)</span>
                    {!isReadOnly && (
                      <label className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-[#dee2e6] rounded-lg text-xs font-bold text-[#b8860b] hover:bg-[#fffbf0] cursor-pointer">
                        <span>📤 Upload Easement Copy Image(s)</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={e => handleFileUpload(e, 'easementImages')}
                          disabled={uploading}
                        />
                      </label>
                    )}
                    {fields.easementImages && fields.easementImages.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {fields.easementImages.map((imgUrl: string, idx: number) => (
                          <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                            <img src={imgUrl} alt={`Easement Copy ${idx + 1}`} className="w-full h-full object-cover" />
                            {!isReadOnly && (
                              <button
                                type="button"
                                onClick={() => handleChange('easementImages', fields.easementImages?.filter((_, i) => i !== idx))}
                                className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-80 hover:opacity-100 text-[10px] leading-none"
                                title="Remove image"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-emerald-700 italic">Attached copies will be displayed at the end of the report in Annexure.</p>
                  </div>
                )}
              </div>

              <Field label="18 — Development Contribution">
                <input className={inputCls} value={fields.developmentContribution} onChange={e => handleChange('developmentContribution', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <Field label="19 — Notified for Govt. Acquisition?" span={2}>
                <input className={inputCls} value={fields.acquisitionNotification} onChange={e => handleChange('acquisitionNotification', e.target.value)} disabled={isReadOnly}
                  placeholder="NO SUCH PARTICULARS ARE OBSERVED BY US" />
              </Field>
              <Field label="20 — Dimension Site Plan" span={2}>
                <input className={inputCls} value={fields.sitePlanAttached} onChange={e => handleChange('sitePlanAttached', e.target.value)} disabled={isReadOnly}
                  placeholder="SITE PLAN IS ATTACHED (GPS LOCATION MAP ATTACHED)" />
              </Field>

            </div>
          </SubSection>

          {/* ── Sub-section: IMPROVEMENT ── */}
          <SubSection id="subsection-improvement" title="Improvement (21–24)" defaultOpen={false}>
            <div className="grid md:grid-cols-2 gap-4">

              <Field label="21 — Plans & Elevations of all Structures">
                <input className={inputCls} value={fields.plansAttached} onChange={e => handleChange('plansAttached', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <Field label="22 — Technical Details of Buildings">
                <input className={inputCls} value={fields.technicalDetails} onChange={e => handleChange('technicalDetails', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">23 — Tenancy Details</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="(I) Occupancy Status">
                    <select className={selectCls} value={fields.tenancyStatus} onChange={e => handleChange('tenancyStatus', e.target.value)} disabled={isReadOnly}>
                      <option value="OWNER OCCUPIED">OWNER OCCUPIED</option>
                      <option value="TENANTED">TENANTED</option>
                      <option value="BOTH (OWNER-OCCUPIED AND TENANTED)">BOTH (OWNER-OCCUPIED AND TENANTED)</option>
                      <option value="NOT APPLICABLE">NOT APPLICABLE</option>
                    </select>
                  </Field>
                  <Field label="(II) If Partly Owner-Occupied — Portion & Extent">
                    <input
                      className={inputCls}
                      value={fields.tenancyPortionDetails}
                      onChange={e => handleChange('tenancyPortionDetails', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Specify portion and area under owner occupation"
                    />
                  </Field>
                </div>
              </div>
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">24 — Floor Space Index (FSI) & Utilized Percentage</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Floor Space Index Permissible">
                    <input className={inputCls} value={fields.fsiPermissible || fields.fsi || ''} onChange={e => handleChange('fsiPermissible', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1.99" />
                  </Field>
                  <Field label="Percentage Actually Utilized">
                    <input className={inputCls} value={fields.fsiUtilized || ''} onChange={e => handleChange('fsiUtilized', e.target.value)} disabled={isReadOnly} placeholder="e.g. 66% OF THE TOTAL FSI PERMITTED" />
                  </Field>
                </div>
              </div>

            </div>
          </SubSection>

          {/* ── Sub-section: RENT ── */}
          <SubSection id="subsection-rent" title="Rent & Charges (25–34)" defaultOpen={false}>
            <div className="grid md:grid-cols-2 gap-4">

              {/* Q25 — split into 4 sub-entries */}
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">25 — Tenant / Lessees / Licensees Details</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="(I) Name of Tenant / Lessees / Licensees, etc.">
                    <input className={inputCls} value={fields.tenantName} onChange={e => handleChange('tenantName', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
                  </Field>
                  <Field label="(II) Portion in their Occupation">
                    <input className={inputCls} value={fields.tenantPortion} onChange={e => handleChange('tenantPortion', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
                  </Field>
                  <Field label="(III) Monthly / Annual Rent / Compensation, etc.">
                    <input className={inputCls} value={fields.tenantRent} onChange={e => handleChange('tenantRent', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
                  </Field>
                  <Field label="(IV) Gross Amount received for the whole property">
                    <input className={inputCls} value={fields.tenantGrossAmount} onChange={e => handleChange('tenantGrossAmount', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
                  </Field>
                </div>
              </div>
              <Field label="26 — Related Occupants">
                <input className={inputCls} value={fields.relatedOccupants} onChange={e => handleChange('relatedOccupants', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <Field label="27 — Fixtures">
                <input className={inputCls} value={fields.fixtures} onChange={e => handleChange('fixtures', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <Field label="28 — DETAILS OF WATER AND ELECTRICITY CHARGES TO BE BORNE BY THE OWNER" span={2}>
                <input className={inputCls} value={fields.waterElectricCharges} onChange={e => handleChange('waterElectricCharges', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <Field label="29 — Pump Maintenance Cost Bearer">
                <select className={selectCls} value={fields.pumpMaintenance} onChange={e => handleChange('pumpMaintenance', e.target.value)} disabled={isReadOnly}>
                  <option value="TENANT">TENANT</option>
                  <option value="OWNER">OWNER</option>
                  <option value="NOT APPLICABLE">NOT APPLICABLE</option>
                </select>
              </Field>
              <Field label="30 — Electricity Charges Bearer for Common Spaces">
                <select className={selectCls} value={fields.commonElectricity} onChange={e => handleChange('commonElectricity', e.target.value)} disabled={isReadOnly}>
                  <option value="TENANT">TENANT</option>
                  <option value="OWNER">OWNER</option>
                  <option value="SHARED / PRO-RATA">SHARED / PRO-RATA</option>
                  <option value="NOT APPLICABLE">NOT APPLICABLE</option>
                </select>
              </Field>
              <Field label="31 — Amount of Property Tax & Who Bears It (Details with Proof)">
                <input className={inputCls} value={fields.propertyTax} onChange={e => handleChange('propertyTax', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <Field label="32 — Building Insurance Details (Policy No, Insured Amount, Annual Premium)">
                <input className={inputCls} value={fields.buildingInsured} onChange={e => handleChange('buildingInsured', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <Field label="33 — Landlord-Tenant Rent Dispute Pending in Court?">
                <input className={inputCls} value={fields.landlordTenantDispute} onChange={e => handleChange('landlordTenantDispute', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>
              <Field label="34 — Standard Rent Fixed Under Rent Control Law?">
                <input className={inputCls} value={fields.standardRent} onChange={e => handleChange('standardRent', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>

            </div>
          </SubSection>

          {/* ── Sub-section: SALES ── */}
          <SubSection id="subsection-sales" title="Sales (35–37)" defaultOpen={false}>
            <div className="grid md:grid-cols-2 gap-4">

              <BulletEditor
                label="35 — Give Instances of Sales of Immovable Property in the Locality (with Registration No, Sale Price, Area Sold)"
                lines={fields.saleInstancesLines && fields.saleInstancesLines.length > 0 ? fields.saleInstancesLines : (fields.saleInstances ? [fields.saleInstances] : [])}
                onChange={lines => {
                  handleChange('saleInstancesLines', lines);
                  handleChange('saleInstances', lines.join('\n'));
                }}
                disabled={isReadOnly}
                placeholder="DATA COLLECTED FROM SRO, PURI VIDE APPLICATION NO: 32700/7349 ON DATED 16.10.2025 (LETTER ATTACHED FOR REFERENCES)"
              />
              {/* Q36 — Land Rate Adopted in this Valuation */}
              <div className="md:col-span-2 p-5 bg-[#f0fdf4] border border-[#d1e7dd] rounded-2xl shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#d1e7dd] pb-3">
                  <div>
                    <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">36 — Land Rate Adopted in this Valuation</span>
                    <p className="text-[11px] text-[#6c757d]">Specify rate per unit or switch to custom text mode</p>
                  </div>
                  <div className="inline-flex p-1 bg-white border border-gray-200 rounded-xl shrink-0 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleChange('landRateMode', 'auto')}
                      disabled={isReadOnly}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        (fields.landRateMode || 'auto') === 'auto'
                          ? 'bg-[#b8860b] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ⚡ Auto Builder
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('landRateMode', 'custom')}
                      disabled={isReadOnly}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                        fields.landRateMode === 'custom'
                          ? 'bg-[#b8860b] text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      ✏️ Custom Text
                    </button>
                  </div>
                </div>

                {(fields.landRateMode || 'auto') === 'auto' ? (
                  <div className="space-y-4">
                    {/* Derived Area Notice */}
                    <div className="text-xs font-semibold text-emerald-800 bg-[#e6f4ea] border border-[#ceead6] rounded-xl p-3 shadow-sm">
                      📍 Primary Land Area derived from Q12: <span className="font-bold text-[#137333]">{fields.landArea || '0'} {fields.landAreaUnit || 'DEC'}</span> (defined under Q12 — Land Area).
                    </div>

                    {/* Primary Rate & Unit */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <Field label="Primary Rate per Unit (RS.)">
                        <input
                          className={inputCls}
                          type="number"
                          value={fields.landRatePerUnit}
                          onChange={e => {
                            const newRate = e.target.value;
                            handleChange('landRatePerUnit', newRate);

                            // Auto-convert secondary rate
                            const pUnit = fields.landRateUnit || 'DEC';
                            const sUnit = fields.landRateSecondaryUnit || 'ACRE';
                            if (newRate) {
                              const autoSec = convertLandRate(newRate, pUnit, sUnit);
                              handleChange('landRateSecondaryPerUnit', autoSec);
                            }

                            // Auto-calculate total land value using derived Q12 land area with unit conversion
                            if (fields.landArea && newRate) {
                              const pArea = parseFloat(fields.landArea.replace(/[^0-9.]/g, '')) || 0;
                              const pAreaUnit = fields.landAreaUnit || pUnit;
                              const areaSqft = pArea * (pAreaUnit === 'ACRE' ? 43560 : pAreaUnit === 'SQFT' || pAreaUnit === 'SQ.FT.' ? 1 : pAreaUnit === 'SQMT' || pAreaUnit === 'SQ.MTR.' ? 10.7639 : 435.6);
                              const rateSqft = pUnit === 'ACRE' ? 43560 : pUnit === 'SQFT' || pUnit === 'SQ.FT.' ? 1 : pUnit === 'SQMT' || pUnit === 'SQ.MTR.' ? 10.7639 : 435.6;
                              const areaInRateUnits = areaSqft / rateSqft;
                              const rateNum = parseFloat(newRate) || 0;
                              if (areaInRateUnits > 0 && rateNum > 0) {
                                handleChange('totalLandValue', String(Math.round(areaInRateUnits * rateNum)));
                              }
                            }
                          }}
                          disabled={isReadOnly}
                          placeholder="e.g. 50000"
                        />
                      </Field>
                      <Field label="Primary Unit">
                        <select
                          className={selectCls}
                          value={fields.landRateUnit || 'DEC'}
                          onChange={e => {
                            const newPUnit = e.target.value;
                            handleChange('landRateUnit', newPUnit);
                            const sUnit = fields.landRateSecondaryUnit || 'ACRE';
                            if (fields.landRatePerUnit) {
                              const autoSec = convertLandRate(fields.landRatePerUnit, newPUnit, sUnit);
                              handleChange('landRateSecondaryPerUnit', autoSec);
                            }
                          }}
                          disabled={isReadOnly}
                        >
                          <option value="DEC">DEC</option>
                          <option value="ACRE">ACRE</option>
                          <option value="SQ.FT.">SQ.FT.</option>
                          <option value="SQ.MTR.">SQ.MTR.</option>
                          <option value="GUNTHA">GUNTHA</option>
                          <option value="CENT">CENT</option>
                        </select>
                      </Field>
                      <Field label="Total Land Value (RS.)">
                        <input
                          className={inputCls}
                          value={fields.totalLandValue}
                          onChange={e => handleChange('totalLandValue', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="e.g. 250000"
                        />
                      </Field>
                    </div>

                    {/* Secondary Rate (100% Auto-Converted) */}
                    <div className="p-3 bg-white/70 border border-[#d1e7dd] rounded-xl space-y-2">
                      <span className="text-[11px] font-bold text-[#6c757d] uppercase tracking-wider block">Equivalent Rate Expression (Auto-Converted)</span>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Field label="Secondary Rate (RS. - Auto-Converted)">
                          <input
                            className={`${inputCls} bg-emerald-50/50 text-emerald-900 font-semibold`}
                            type="number"
                            value={fields.landRatePerUnit ? convertLandRate(fields.landRatePerUnit, fields.landRateUnit || 'DEC', fields.landRateSecondaryUnit || 'ACRE') : (fields.landRateSecondaryPerUnit || '')}
                            readOnly
                            disabled={isReadOnly}
                            placeholder="Auto-converted from primary rate..."
                          />
                        </Field>
                        <Field label="Secondary Unit">
                          <select
                            className={selectCls}
                            value={fields.landRateSecondaryUnit || 'ACRE'}
                            onChange={e => {
                              const newSUnit = e.target.value;
                              handleChange('landRateSecondaryUnit', newSUnit);
                              const pUnit = fields.landRateUnit || 'DEC';
                              if (fields.landRatePerUnit) {
                                const autoSec = convertLandRate(fields.landRatePerUnit, pUnit, newSUnit);
                                handleChange('landRateSecondaryPerUnit', autoSec);
                              }
                            }}
                            disabled={isReadOnly}
                          >
                            <option value="ACRE">ACRE</option>
                            <option value="DEC">DEC</option>
                            <option value="SQ.FT.">SQ.FT.</option>
                            <option value="SQ.MTR.">SQ.MTR.</option>
                            <option value="GUNTHA">GUNTHA</option>
                            <option value="CENT">CENT</option>
                          </select>
                        </Field>
                      </div>
                    </div>

                    {/* PDF Sentence Live Preview */}
                    <div className="rounded-xl bg-[#fffbee] border border-[#b8860b]/30 p-3.5 text-xs text-[#6c4a00] font-mono leading-5 shadow-inner">
                      <span className="text-[10px] font-black text-[#b8860b] uppercase tracking-widest block mb-1">📄 Live PDF Statement Preview</span>
                      {fields.landRatePerUnit ? (
                        <>
                          {`THE RATE IS ABOUT RS.${Number(fields.landRatePerUnit).toLocaleString('en-IN')}/- PER ${fields.landRateUnit || 'DEC'}`}
                          {(convertLandRate(fields.landRatePerUnit, fields.landRateUnit || 'DEC', fields.landRateSecondaryUnit || 'ACRE') || fields.landRateSecondaryPerUnit) && ` I.E. RS.${Number(convertLandRate(fields.landRatePerUnit, fields.landRateUnit || 'DEC', fields.landRateSecondaryUnit || 'ACRE') || fields.landRateSecondaryPerUnit).toLocaleString('en-IN')}/- PER ${fields.landRateSecondaryUnit || 'ACRE'}`}
                          {`. HENCE TOTAL VALUE OF THE LAND AS APPEARING IN THE ROR = ${fields.landArea || '...'} ${fields.landAreaUnit || fields.landRateUnit || 'DEC'} @ RS.${Number(fields.landRatePerUnit).toLocaleString('en-IN')}/- PER ${fields.landRateUnit || 'DEC'} = RS.${fields.totalLandValue ? Number(fields.totalLandValue).toLocaleString('en-IN') + '/-' : '...'}`}
                        </>
                      ) : (
                        <span className="text-gray-400 italic">Enter Primary Rate per Unit above to generate statement...</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Field label="Custom Land Rate Statement / Paragraph">
                      <textarea
                        className={textareaCls}
                        rows={4}
                        value={fields.landRateCustomText || ''}
                        onChange={e => handleChange('landRateCustomText', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="Type or paste exact custom statement for Question 36..."
                      />
                    </Field>
                    <Field label="Total Land Value (RS.)">
                      <input
                        className={inputCls}
                        value={fields.totalLandValue}
                        onChange={e => handleChange('totalLandValue', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. 250000"
                      />
                    </Field>
                  </div>
                )}
              </div>
              <Field label="37 — Land Rate Basis (if Sale Instances Not Available/Relied Upon)">
                <input className={inputCls} value={fields.landRateBasis} onChange={e => handleChange('landRateBasis', e.target.value)} disabled={isReadOnly} placeholder="NOT APPLICABLE" />
              </Field>

            </div>
          </SubSection>

          {/* ── Sub-section: COST OF CONSTRUCTION ── */}
          <SubSection id="subsection-construction" title="Cost of Construction (38–42)" defaultOpen={false}>
            <div className="grid md:grid-cols-2 gap-4">

              {/* Q38 — split into 2 sub-entries */}
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">38 — Year of Commencement of Construction and Year of Completion</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="(I) Year of Commencement of Construction">
                    <input className={inputCls} value={fields.constructionStartYear} onChange={e => handleChange('constructionStartYear', e.target.value.replace(/[^0-9-]/g, ''))} disabled={isReadOnly} placeholder="2006" />
                  </Field>
                  <Field label="(II) Year of Completion">
                    <input className={inputCls} value={fields.constructionEndYear} onChange={e => handleChange('constructionEndYear', e.target.value.replace(/[^0-9-]/g, ''))} disabled={isReadOnly} placeholder="2008" />
                  </Field>
                </div>
              </div>
              <Field label="39 — Construction Method" span={2}>
                <select className={selectCls} value={fields.constructionMethod} onChange={e => handleChange('constructionMethod', e.target.value)} disabled={isReadOnly}>
                  <option value="BY CONTRACT">BY CONTRACT</option>
                  <option value="BY EMPLOYING LABOUR DIRECTLY">BY EMPLOYING LABOUR DIRECTLY</option>
                  <option value="BY BOTH">BY BOTH</option>
                  <option value="NOT APPLICABLE">NOT APPLICABLE</option>
                </select>
              </Field>
              <Field label="40 — Contract Agreements Details" span={2}>
                <input className={inputCls} value={fields.contractAgreements} onChange={e => handleChange('contractAgreements', e.target.value)} disabled={isReadOnly} placeholder="DOCUMENTS ARE NOT PROVIDED" />
              </Field>
              <Field label="41 — Material Rates & Proof (Work Done Directly)" span={2}>
                <input className={inputCls} value={fields.materialRates} onChange={e => handleChange('materialRates', e.target.value)} disabled={isReadOnly} placeholder="DOCUMENTS ARE NOT PROVIDED" />
              </Field>
              <Field label="42 — Building Approval Plan Details" span={2}>
                <textarea className={textareaCls} value={fields.buildingApproval} onChange={e => handleChange('buildingApproval', e.target.value)} disabled={isReadOnly} rows={3}
                  placeholder="THE BUILDING IS APPROVED BY PURI KONARK DEVELOPMENT AUTHORITY..." />
              </Field>

            </div>
          </SubSection>

          </div>
        </Section>

        {/* ═══ SECTION 3: PART II – VALUATION ═══ */}
                {/* ═══ SECTION 3: PART II – VALUATION ═══ */}
        <Section title="PART II – VALUATION" number={3}>
          <div className="space-y-3">
<SubSection id="subsection-valuation-disc" title="Valuation Discussion">
          <div className="mb-6 p-5 bg-[#f8f9fa] rounded-xl border border-[#e9ecef] space-y-3 shadow-sm">
            <p className="text-sm font-bold text-[#0f2038] uppercase tracking-wide">
              HERE THE REGISTERED VALUER SHOULD DISCUSS IN DETAIL HIS APPROACH TO VALUATION OF THE PROPERTY AND INDICATE HOW THE VALUE HAS BEEN ARRIVED AT, SUPPORTED BY NECESSARY CALCULATION.
            </p>
            <p className="text-sm text-[#212529] leading-relaxed uppercase">
              VALUATION HAS BEEN PROVIDED FOR THE YEAR <strong>{fields.valuationYear || '________'}</strong> AT THE REQUEST OF THE CUSTOMER IN ORDER TO ACCESS THE VALUE OF PROPERTY POST COMPLETION OF CONSTRUCTION IN THE YEAR <strong>{fields.completionYear || '________'}</strong>.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Valuation Year">
              <input className={inputCls} value={fields.valuationYear} onChange={e => handleChange('valuationYear', e.target.value.replace(/[^0-9-]/g, ''))} disabled={isReadOnly} placeholder="2008-2009" />
            </Field>
            <Field label="Completion Year">
              <input className={inputCls} value={fields.completionYear} onChange={e => handleChange('completionYear', e.target.value.replace(/[^0-9-]/g, ''))} disabled={isReadOnly} placeholder="2008" />
            </Field>
            <div className="md:col-span-2">
              <label className="flex items-center gap-2 mb-3 cursor-pointer">
                <input type="checkbox" checked={fields.isReverseCalculation} onChange={e => handleChange('isReverseCalculation', e.target.checked)} disabled={isReadOnly}
                  className="w-4 h-4 rounded border-[#dee2e6] text-[#b8860b] focus:ring-[#b8860b]/30" />
                <span className="text-xs font-bold text-[#495057] uppercase tracking-wider">Reverse CII Calculation Method</span>
              </label>
            </div>
            {fields.isReverseCalculation && (
              <>
                <Field label="CII Base Year">
                  <input className={inputCls} value={fields.ciiBaseYear} onChange={e => handleChange('ciiBaseYear', e.target.value.replace(/[^0-9-]/g, ''))} disabled={isReadOnly} placeholder="2001-02" />
                </Field>
                <Field label="CII Base Value">
                  <input className={inputCls} value={fields.ciiBaseValue} onChange={e => handleChange('ciiBaseValue', e.target.value.replace(/[^0-9.]/g, ''))} disabled={isReadOnly} placeholder="100" />
                </Field>
                <Field label="CII Target Year">
                  <input className={inputCls} value={fields.ciiTargetYear} onChange={e => handleChange('ciiTargetYear', e.target.value.replace(/[^0-9-]/g, ''))} disabled={isReadOnly} placeholder="2008-09" />
                </Field>
                <Field label="CII Target Value">
                  <input className={inputCls} value={fields.ciiTargetValue} onChange={e => handleChange('ciiTargetValue', e.target.value.replace(/[^0-9.]/g, ''))} disabled={isReadOnly} placeholder="137" />
                </Field>
              </>
            )}
          </div>

          {/* Bullet Points Editor with Drag and Drop */}
          <div className="mt-4">
            <BulletEditor
              label="Valuation Approach Bullet Points"
              lines={fields.valuationBullets}
              onChange={lines => handleChange('valuationBullets', lines)}
              disabled={isReadOnly}
              placeholder="Enter valuation approach detail..."
            />
          </div>
          </SubSection>
          </div>
        </Section>

        {/* ═══ SECTION 4: PART III – DECLARATION ═══ */}
        <Section title="PART III – DECLARATION" number={4}>
          <div className="space-y-3">
<SubSection id="subsection-declaration" title="Declaration">
            <div className="space-y-4">
              <div className="p-4 bg-[#f8f9fa] rounded-xl border border-[#dee2e6]">
                <p className="text-sm font-bold text-[#0f2038] mb-3 uppercase tracking-wide">I HEREBY DECLARE THAT —</p>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <span className="font-bold text-[#b8860b] text-sm shrink-0">(A)</span>
                    <p className="text-sm text-[#212529] leading-relaxed">THE INFORMATION FURNISHED IN PART I IS TRUE TO THE BEST OF MY KNOWLEDGE AND BELIEF.</p>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-bold text-[#b8860b] text-sm shrink-0">(B)</span>
                    <p className="text-sm text-[#212529] leading-relaxed">I HAVE NO DIRECT OR INDIRECT INTEREST IN THE PROPERTY VALUED.</p>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Date">
                  <input type="date" className={inputCls} value={fields.declarationDate ?? ''} onChange={e => handleChange('declarationDate', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>

              <div className="mt-6 p-5 bg-white rounded-xl border border-[#e9ecef] flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 shadow-sm">
                <div className="space-y-1.5">
                  <p className="text-sm font-bold text-[#0f2038] tracking-wide">
                    DATE–{fields.declarationDate ? fields.declarationDate.split('-').reverse().join('/') : 'DD/MM/YYYY'}
                  </p>
                  <p className="text-sm font-bold text-[#0f2038] tracking-wide">PLACE–BHUBANESWAR</p>
                </div>
                <div className="sm:text-right space-y-1.5">
                  <p className="text-sm font-bold text-[#0f2038] tracking-wide">ER. SATYAJIT MOHANTY</p>
                  <p className="text-sm font-bold text-[#0f2038] tracking-wide">SIGNATURE OF REGISTERED VALUER</p>
                </div>
              </div>
            </div>
          </SubSection>
          </div>
        </Section>

        ﻿        {/* ÔòÉÔòÉÔòÉ SECTION 5: ANNEXURES & APPENDICES ÔòÉÔòÉÔòÉ */}
        <Section title="ANNEXURES & APPENDICES" number={5}>
          <div className="space-y-3">
{!isLandOnly && (
          <SubSection id="subsection-tech-details" title="Annexure: Technical Details (Items 01-20)" defaultOpen={false}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2 p-4 bg-[#faf5ff] border border-[#e8d5ff] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">Annexure to Form O-1 (No. of Units)</span>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Field label="Main Building">
                    <input className={inputCls} value={fields.annexMainBuilding} onChange={e => handleChange('annexMainBuilding', e.target.value)} disabled={isReadOnly} placeholder="1 NOS" />
                  </Field>
                  <Field label="Annexes">
                    <input className={inputCls} value={fields.annexAnnexes} onChange={e => handleChange('annexAnnexes', e.target.value)} disabled={isReadOnly} placeholder="NIL" />
                  </Field>
                  <Field label="Servants Quarters">
                    <input className={inputCls} value={fields.annexServantsQuarters} onChange={e => handleChange('annexServantsQuarters', e.target.value)} disabled={isReadOnly} placeholder="NIL" />
                  </Field>
                  <Field label="Garage">
                    <input className={inputCls} value={fields.annexGarage} onChange={e => handleChange('annexGarage', e.target.value)} disabled={isReadOnly} placeholder="NIL" />
                  </Field>
                  <Field label="Pump House">
                    <input className={inputCls} value={fields.annexPumpHouse} onChange={e => handleChange('annexPumpHouse', e.target.value)} disabled={isReadOnly} placeholder="NIL" />
                  </Field>
                </div>
              </div>

              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">01. No. of Floors & Height</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="No. of Floors">
                    <input className={inputCls} value={fields.techFloors} onChange={e => handleChange('techFloors', e.target.value)} disabled={isReadOnly} placeholder="B+G+2 STORIED BUILDING" />
                  </Field>
                  <Field label="Floor Height">
                    <input className={inputCls} value={fields.techFloorHeight} onChange={e => handleChange('techFloorHeight', e.target.value)} disabled={isReadOnly} placeholder='HEIGHT-10-6"' />
                  </Field>
                </div>
              </div>
              {/* Question 02 Card Container */}
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <div className="flex flex-wrap justify-between items-center border-b border-[#d1e7dd] pb-2.5 gap-2">
                  <span className="text-xs font-black text-[#b8860b] uppercase tracking-wider block">
                    02. PLINTH AREA FLOOR-WISE (AS PER ISI3861-1966)
                  </span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fields.showPlinthActual}
                        onChange={e => handleChange('showPlinthActual', e.target.checked)}
                        disabled={isReadOnly}
                        className="w-4 h-4 rounded border-[#dee2e6] text-[#b8860b] focus:ring-[#b8860b]/30"
                      />
                      <span className="text-xs font-bold text-[#495057] uppercase tracking-wider">As Per Actual</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={fields.showPlinthApproved}
                        onChange={e => handleChange('showPlinthApproved', e.target.checked)}
                        disabled={isReadOnly}
                        className="w-4 h-4 rounded border-[#dee2e6] text-[#b8860b] focus:ring-[#b8860b]/30"
                      />
                      <span className="text-xs font-bold text-[#495057] uppercase tracking-wider">As Per Approved Plan</span>
                    </label>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 pt-1">
                  {fields.showPlinthActual && (
                    <div className={fields.showPlinthApproved ? "col-span-1" : "col-span-2"}>
                      <BulletEditor
                        label="Plinth Area (As Per Actual)"
                        lines={fields.techPlinthAreaActual ? fields.techPlinthAreaActual.split('\n') : []}
                        onChange={lines => handleChange('techPlinthAreaActual', lines.join('\n'))}
                        disabled={isReadOnly}
                        placeholder="BASEMENT FLOOR AREA-2166 SFT&#10;GROUND FLOOR AREA-1596 SFT&#10;FIRST FLOOR AREA-1596 SQFT..."
                      />
                    </div>
                  )}
                  {fields.showPlinthApproved && (
                    <div className={fields.showPlinthActual ? "col-span-1" : "col-span-2"}>
                      <BulletEditor
                        label="Plinth Area (As Per Approved Plan)"
                        lines={fields.techPlinthAreaApproved ? fields.techPlinthAreaApproved.split('\n') : []}
                        onChange={lines => handleChange('techPlinthAreaApproved', lines.join('\n'))}
                        disabled={isReadOnly}
                        placeholder="GROUND FLOOR AREA-791 SFT&#10;FIRST FLOOR AREA-791 SQFT..."
                      />
                    </div>
                  )}
                  {!fields.showPlinthActual && !fields.showPlinthApproved && (
                    <p className="col-span-2 text-xs italic text-gray-500 py-2">
                      Check &quot;As Per Actual&quot; or &quot;As Per Approved Plan&quot; toggle box above to enter plinth area floor details.
                    </p>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">03. Year of Construction & Completion</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="03 (A). Year of Construction">
                    <input className={inputCls} value={fields.techYearConstruction} onChange={e => handleChange('techYearConstruction', e.target.value)} disabled={isReadOnly} placeholder="2006" />
                  </Field>
                  <Field label="03 (B). Year of Completion">
                    <input className={inputCls} value={fields.techYearCompletion || ''} onChange={e => handleChange('techYearCompletion', e.target.value)} disabled={isReadOnly} placeholder="2008" />
                  </Field>
                </div>
              </div>
              <Field label="04. Estimated Future Life">
                <input className={inputCls} value={fields.techFutureLife} onChange={e => handleChange('techFutureLife', e.target.value)} disabled={isReadOnly} placeholder="48-YEARS" />
              </Field>
              <Field label="05. Construction Type">
                <input className={inputCls} value={fields.techConstructionType} onChange={e => handleChange('techConstructionType', e.target.value)} disabled={isReadOnly} placeholder="RCC FRAMED" />
              </Field>
              <Field label="06. Foundation Type">
                <input className={inputCls} value={fields.techFoundation} onChange={e => handleChange('techFoundation', e.target.value)} disabled={isReadOnly} placeholder="COLUMN FOUNDATION" />
              </Field>
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">07. Walls</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="(A) Basement & Plinth">
                    <input className={inputCls} value={fields.techWallsBasement} onChange={e => handleChange('techWallsBasement', e.target.value)} disabled={isReadOnly} placeholder='PLINTH WALL IS 10" WIDE BRICK WALL' />
                  </Field>
                  <Field label="(B) Ground Floor">
                    <input className={inputCls} value={fields.techWallsGround} onChange={e => handleChange('techWallsGround', e.target.value)} disabled={isReadOnly} placeholder='10" WIDE BRICK WALL' />
                  </Field>
                </div>
              </div>
              <Field label="08. Partitions">
                <input className={inputCls} value={fields.techPartitions} onChange={e => handleChange('techPartitions', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="09. Doors & Windows">
                <input className={inputCls} value={fields.techDoorsWindows} onChange={e => handleChange('techDoorsWindows', e.target.value)} disabled={isReadOnly} placeholder="FIRST CLASS HARD WOOD SHUTTER WITH TEAK WOOD FRAME" />
              </Field>
              <Field label="10. Flooring">
                <input className={inputCls} value={fields.techFlooring} onChange={e => handleChange('techFlooring', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="11. Finishing (Internal/External)">
                <input className={inputCls} value={fields.techFinishing} onChange={e => handleChange('techFinishing', e.target.value)} disabled={isReadOnly} />
              </Field>
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">12. Roofing & Terracing & Architectural Features</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="12 (A). Roofing & Terracing">
                    <input className={inputCls} value={fields.techRoofing} onChange={e => handleChange('techRoofing', e.target.value)} disabled={isReadOnly} />
                  </Field>
                  <Field label="12 (B). Special Architectural or Decorative Features">
                    <input className={inputCls} value={fields.techArchitecturalFeatures} onChange={e => handleChange('techArchitecturalFeatures', e.target.value)} disabled={isReadOnly} />
                  </Field>
                </div>
              </div>
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">13. Wiring Details</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="13 (A). Type of Wiring (Surface or Conduit)">
                    <input className={inputCls} value={fields.techWiring} onChange={e => handleChange('techWiring', e.target.value)} disabled={isReadOnly} placeholder="CONCEALED COPPER WIRING" />
                  </Field>
                  <Field label="13 (B). Class of Fittings (Superior/Ordinary/Poor)">
                    <input className={inputCls} value={fields.techFittings} onChange={e => handleChange('techFittings', e.target.value)} disabled={isReadOnly} placeholder="SUPERIOR" />
                  </Field>
                </div>
              </div>
              <BulletEditor
                label="14. Sanitary Installation"
                lines={fields.techSanitaryLines}
                onChange={lines => handleChange('techSanitaryLines', lines)}
                disabled={isReadOnly}
                placeholder="NO. OF WATER CLOSETS-X NOS. / NO. OF WASH BASINS-X NOS...."
              />
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">15. Compound Wall</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Compound Wall (Height & Length)">
                    <input className={inputCls} value={fields.techCompoundWall} onChange={e => handleChange('techCompoundWall', e.target.value)} disabled={isReadOnly} placeholder="HEIGHT: 5 FT, LENGTH: 120 FT" />
                  </Field>
                  <Field label="Type of Construction">
                    <input className={inputCls} value={fields.techCompoundWallType || ''} onChange={e => handleChange('techCompoundWallType', e.target.value)} disabled={isReadOnly} placeholder="BRICK MASONRY WALL" />
                  </Field>
                </div>
              </div>
              <Field label="16. Lifts">
                <input className={inputCls} value={fields.techLifts} onChange={e => handleChange('techLifts', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="17. Overhead Water Tank">
                <input className={inputCls} value={fields.techOverheadTank} onChange={e => handleChange('techOverheadTank', e.target.value)} disabled={isReadOnly} />
              </Field>
              <div className="md:col-span-2 p-4 bg-[#f0fdf4] border border-[#d1e7dd] rounded-xl shadow-sm space-y-3">
                <span className="text-xs font-bold text-[#b8860b] uppercase tracking-wider block">18. Pump & Underground Sump</span>
                <div className="grid md:grid-cols-2 gap-4">
                  <Field label="Pump No. and Their Horse Power">
                    <input className={inputCls} value={fields.techPump} onChange={e => handleChange('techPump', e.target.value)} disabled={isReadOnly} placeholder="1 HP SUBMERSIBLE PUMP" />
                  </Field>
                  <Field label="Underground Sump - Capacity & Type of Construction">
                    <input className={inputCls} value={fields.techUndergroundSump} onChange={e => handleChange('techUndergroundSump', e.target.value)} disabled={isReadOnly} placeholder="5000 LTRS RCC SUMP" />
                  </Field>
                </div>
              </div>
              <Field label="19. Roads & Paving">
                <input className={inputCls} value={fields.techRoadsPaving} onChange={e => handleChange('techRoadsPaving', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="20. Sewage Disposal">
                <input className={inputCls} value={fields.techSewageDisposal} onChange={e => handleChange('techSewageDisposal', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </SubSection>
          )}

<SubSection id="subsection-calc-table" title="MODIFICATION IN THE ANNEXURE TO FORM NO –01">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <Field label="Valuation Date (for table header)">
              <input type="date" className={inputCls} value={fields.valuationCalcDate} onChange={e => handleChange('valuationCalcDate', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Depreciation % (1.5% × age)">
              <input className={inputCls} value={fields.depreciationPct} onChange={e => handleChange('depreciationPct', e.target.value)} disabled={isReadOnly} placeholder="7.5" />
            </Field>
          </div>

          {/* Floor Rows */}
          <div className="space-y-3">
            <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest">Floor / Building Component Rows</p>
            {fields.floorRows.map((row, idx) => (
              <div key={row.id} className="grid grid-cols-6 gap-2 p-3 bg-[#f8f9fa] rounded-lg border border-[#e9ecef]">
                <div className="col-span-6 flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-[#0f2038]">Row {idx + 1}</span>
                  {!isReadOnly && (
                    <button type="button" onClick={() => removeFloorRow(row.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                  )}
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6c757d] uppercase">Name</label>
                  <input className={inputCls} value={row.name} onChange={e => updateFloorRow(row.id, 'name', e.target.value)} disabled={isReadOnly} placeholder="GROUND FLOOR" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6c757d] uppercase">Plinth Area (SQFT)</label>
                  <input className={inputCls} value={row.plinthArea} onChange={e => updateFloorRow(row.id, 'plinthArea', e.target.value)} disabled={isReadOnly} placeholder="791" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6c757d] uppercase">Roof Height</label>
                  <input className={inputCls} value={row.roofHeight} onChange={e => updateFloorRow(row.id, 'roofHeight', e.target.value)} disabled={isReadOnly} placeholder='10-6"' />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6c757d] uppercase">Age</label>
                  <input className={inputCls} value={row.age} onChange={e => updateFloorRow(row.id, 'age', e.target.value)} disabled={isReadOnly} placeholder="New / 5 Years" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6c757d] uppercase">Rate/SQFT</label>
                  <input className={inputCls} value={row.ratePerSqft} onChange={e => updateFloorRow(row.id, 'ratePerSqft', e.target.value)} disabled={isReadOnly} placeholder="1077.12" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-[#6c757d] uppercase">Net Value (auto)</label>
                  <div className="px-3 py-2.5 rounded-lg bg-green-50 border border-green-200 text-sm font-bold text-green-800">
                    RS.{formatIndianCurrency(computedFloorRows[idx]?.netValue || 0)}/-
                  </div>
                </div>
              </div>
            ))}
            {!isReadOnly && (
              <button type="button" onClick={addFloorRow} className="w-full py-2.5 rounded-lg border-2 border-dashed border-[#b8860b]/40 text-[#b8860b] font-bold text-xs hover:bg-[#b8860b]/5 transition-colors">
                + Add Floor / Component Row
              </button>
            )}
          </div>

          {/* Computed Building Total */}
          <div className="mt-4 flex items-center justify-between gap-4 p-4 rounded-xl border border-[#dee2e6] bg-[#f8f9fa]">
            <div>
              <p className="text-xs font-bold text-[#495057] uppercase tracking-wider">Total Building Value</p>
              <p className="text-[10px] text-[#6c757d] font-medium">Auto-calculated from floor rows</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-[#212529] tabular-nums">RS.{formatIndianCurrency(computedBuildingValue)}/-</p>
            </div>
          </div>
          </SubSection>

<SubSection id="subsection-extra-items" title="Extra Items">
          {/* Extra Items */}
          <div className="mb-6">
            <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest mb-3">Extra Items</p>
            {fields.extraItems.map((item, idx) => (
              <div key={item.id} className="flex gap-3 mb-2 items-end">
                <div className="flex-1">
                  {idx === 0 && <label className="text-[9px] font-semibold text-[#6c757d] uppercase">Description</label>}
                  <input className={inputCls} value={item.description} onChange={e => updateExtraItem(item.id, 'description', e.target.value)} disabled={isReadOnly}
                    placeholder="COMPOUND WALL WITH IRON GRILL GATE IN LS" />
                </div>
                <div className="w-40">
                  {idx === 0 && <label className="text-[9px] font-semibold text-[#6c757d] uppercase">Amount (RS.)</label>}
                  <input className={inputCls} value={item.amount} onChange={e => updateExtraItem(item.id, 'amount', e.target.value)} disabled={isReadOnly} placeholder="150000" />
                </div>
                {!isReadOnly && (
                  <button type="button" onClick={() => removeExtraItem(item.id)} className="text-red-400 hover:text-red-600 text-sm pb-2.5">×</button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <button type="button" onClick={addExtraItem} className="text-xs font-bold text-[#b8860b] hover:text-[#8b6914] transition-colors">
                + Add Extra Item
              </button>
            )}
          </div>


          </SubSection>

          <SubSection id="subsection-total-abstract" title="Total Abstract for the Entire Property">
          {/* Total Abstract Table K Preview */}
          <div className="border border-[#e9ecef] rounded-xl overflow-hidden">
            <div className="bg-[#0a1628] text-white px-5 py-3 text-sm font-bold">TOTAL ABSTRACT FOR THE ENTIRE PROPERTY</div>
            <div className="divide-y divide-[#e9ecef]">
              {[
                { label: 'LAND', value: computedLandValue },
                { label: 'BUILDING', value: computedBuildingValue },
                { label: 'EXTRA ITEMS', value: computedExtraTotal },
              ].map(row => (
                <div key={row.label} className="flex justify-between px-5 py-3">
                  <span className="text-sm font-bold text-[#0f2038]">{row.label}</span>
                  <span className="text-sm font-bold text-[#0f2038]">RS.{formatIndianCurrency(row.value)}/-</span>
                </div>
              ))}
              <div className="flex justify-between px-5 py-4 bg-gradient-to-r from-amber-50 to-amber-100">
                <span className="text-base font-black text-[#0f2038]">TOTAL</span>
                <span className="text-base font-black text-[#b8860b]">RS.{formatIndianCurrency(computedTotalProperty)}/-</span>
              </div>
              <div className="px-5 py-3 bg-[#f8f9fa]">
                <span className="text-xs text-[#6c757d]">In words: </span>
                <span className="text-xs font-bold text-[#0f2038]">{rupeesInWords(computedTotalProperty).toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          </SubSection>

<SubSection id="subsection-remarks" title="Remarks" defaultOpen={false}>
          <label className="flex items-center gap-2 mb-3 cursor-pointer">
            <input type="checkbox" checked={fields.hasRemarks} onChange={e => handleChange('hasRemarks', e.target.checked)} disabled={isReadOnly}
              className="w-4 h-4 rounded border-[#dee2e6] text-[#b8860b] focus:ring-[#b8860b]/30" />
            <span className="text-xs font-bold text-[#495057] uppercase tracking-wider">Include Remarks Section in Report</span>
          </label>
          {fields.hasRemarks && (
            <Field label="Remarks Text" span={2}>
              <textarea className={textareaCls} value={fields.remarks} onChange={e => handleChange('remarks', e.target.value)} disabled={isReadOnly}
                placeholder="AS CONFIRMED BY THE CUSTOMER, THE SECOND FLOOR AND THE EXTENSION..." rows={4} />
            </Field>
          )}
          </SubSection>

<SubSection id="subsection-certificate" title="Valuation Certificate (Preview)" defaultOpen={false}>
          <div className="p-5 bg-[#f8f9fa] rounded-xl border border-[#e9ecef] space-y-3">
            <p className="text-sm font-bold text-[#0f2038]">VALUATION CERTIFICATE</p>
            <p className="text-sm text-[#212529] leading-relaxed">
              AS A RESULT OF MY APPRAISAL AND ANALYSIS IT IS MY CONSIDERED OPINION THAT THE ESTIMATED FAIR MARKET VALUE OF THE PROPERTY
              (<strong>{fields.propertyType}</strong>) BY <strong>{fields.ownerName.toUpperCase() || '________'}</strong> BEARING{' '}
              <strong>{fields.propertyDescription ? fields.propertyDescription.toUpperCase().substring(0, 150) + '...' : '________'}</strong>{' '}
              AS ON <strong>{fields.valuationDate || '________'}</strong> IS{' '}
              <strong>RS.{formatIndianCurrency(computedTotalProperty)}/-</strong>{' '}
              ({rupeesInWords(computedTotalProperty).toUpperCase()})
            </p>
          </div>
          </SubSection>

          <SubSection id="subsection-photos" title="Appendices: Photos & Maps" defaultOpen={false}>
{/* Property Photographs */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest">Property Photographs</p>
              {bucketImages.length > 0 && !isReadOnly && (
                <button type="button" onClick={() => openBucketPicker('propertyImages')} className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                  Pick from Bucket ({bucketImages.length})
                </button>
              )}
            </div>
            {!isReadOnly && (
              <input type="file" accept="image/*" multiple onChange={e => handleFileUpload(e, 'propertyImages')} disabled={uploading}
                className="block w-full text-sm text-[#6c757d] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#b8860b]/10 file:text-[#b8860b] hover:file:bg-[#b8860b]/20 mb-3" />
            )}
            {fields.propertyImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fields.propertyImages.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#e9ecef]">
                    <img src={url ? encodeURI(url) : ''} alt={`Photo ${idx + 1}`} className="w-full h-32 object-cover" />
                    {!isReadOnly && (
                      <button type="button" onClick={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

{/* Location Map */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest">Location Map with GPS Co-ordinate</p>
            </div>
            {/* Live Google Maps Embed */}
            {(() => {
              const defaultAddr = getIncomeTaxLocationAddress(fields);
              const activeAddr = fields.locationSearchQuery !== undefined ? fields.locationSearchQuery : defaultAddr;
              const mapQuery = fields.latitude && fields.longitude
                ? `${fields.latitude.trim()},${fields.longitude.trim()}`
                : activeAddr;
              const encodedQuery = encodeURIComponent(mapQuery);
              const hasQuery = mapQuery.trim().length > 0;
              const googleMapsUrl = fields.latitude && fields.longitude
                ? `https://www.google.com/maps?q=${fields.latitude.trim()},${fields.longitude.trim()}&z=15&t=k`
                : `https://www.google.com/maps/search/${encodedQuery}`;
              return (
                <div className="space-y-3">
                  <Field label="Google Maps Location Address / Search Query (Auto-derived from Q06 Location Details & Legal Address)">
                    <input
                      className={inputCls}
                      value={activeAddr}
                      onChange={e => handleChange('locationSearchQuery', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. KALYANPUR, BINJHARPUR, JAJPUR, ODISHA"
                    />
                  </Field>
                  {hasQuery ? (
                    <div className="rounded-xl overflow-hidden border border-[#c8d6e5] shadow-sm">
                      <div className="bg-[#d5e8f5] px-4 py-2 flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider">
                          Live Map Preview (Property Legal Location)
                        </span>
                        <a
                          href={googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#b8860b] hover:underline"
                        >
                          Open in Google Maps ↗
                        </a>
                      </div>
                      <iframe
                        src={`https://maps.google.com/maps?q=${encodedQuery}&t=k&z=16&output=embed`}
                        width="100%"
                        height="300"
                        style={{ border: 0 }}
                        allowFullScreen
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Property Location Map"
                      />
                      {fields.latitude && fields.longitude && (
                        <div className="bg-[#0a1628] text-[#f0c040] px-4 py-2 text-xs font-bold text-center">
                          Latitude: {fields.latitude}, Longitude: {fields.longitude}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-6 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] text-center text-sm text-[#6c757d]">
                      <p className="font-semibold mb-1">No address found.</p>
                      <p>Type the location address above or enter Lat/Long to load the live map.</p>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Screenshot upload for PDF */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider">
                Screenshot for PDF Report
              </p>
              <p className="text-xs text-[#6c757d]">
                To include a map in the PDF, open Google Maps via the link above, take a satellite screenshot with the pin visible, and upload it below.
              </p>
              {fields.locationMapImage ? (
                <div className="relative group rounded-xl overflow-hidden border border-[#e9ecef] max-w-lg">
                  <img src={fields.locationMapImage ? encodeURI(fields.locationMapImage) : ''} alt="Location Map Screenshot" className="w-full object-contain" />
                  {!isReadOnly && (
                    <button type="button" onClick={() => handleChange('locationMapImage', '')} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-center text-xs py-1 font-semibold">
                    ✅ Screenshot uploaded — will appear in PDF
                  </div>
                </div>
              ) : (
                !isReadOnly && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                      {uploading ? 'Uploading...' : 'Upload Map Screenshot for PDF'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'locationMapImage')} disabled={uploading} />
                    </label>
                    {/* Pick from Bucket removed */}
                  </div>
                )
              )}
            </div>

            {/* Lat/Long inputs */}
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Latitude">
                <input className={inputCls} value={fields.latitude} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 19.976652" />
              </Field>
              <Field label="Longitude">
                <input className={inputCls} value={fields.longitude} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 86.240795" />
              </Field>
            </div>
          </div>

{/* CII Table Image */}
          <div className="mb-6">
            <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest mb-2">CII Table Image (optional - for reverse calc)</p>
            {!isReadOnly && <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'ciiTableImage')} disabled={uploading} className="block w-full text-sm text-[#6c757d] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#b8860b]/10 file:text-[#b8860b] hover:file:bg-[#b8860b]/20 mb-2" />}
            {fields.ciiTableImage && <img src={fields.ciiTableImage ? encodeURI(fields.ciiTableImage) : ''} alt="CII Table" className="max-h-48 rounded-lg border border-[#e9ecef]" />}
          </div>

{/* BDA Map Image */}
          <div className="mb-6">
            <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest mb-2">BDA / Jurisdiction Map Image (optional)</p>
            {!isReadOnly && <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'bdaMapImage')} disabled={uploading} className="block w-full text-sm text-[#6c757d] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#b8860b]/10 file:text-[#b8860b] hover:file:bg-[#b8860b]/20 mb-2" />}
            {fields.bdaMapImage && <img src={fields.bdaMapImage ? encodeURI(fields.bdaMapImage) : ''} alt="BDA Map" className="max-h-48 rounded-lg border border-[#e9ecef]" />}
          </div>

{/* Benchmark Value Image */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest">Benchmark Value Document</p>
            </div>
            {!isReadOnly && <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'benchmarkImage')} disabled={uploading} className="block w-full text-sm text-[#6c757d] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#b8860b]/10 file:text-[#b8860b] hover:file:bg-[#b8860b]/20 mb-2" />}
            {fields.benchmarkImage && <img src={fields.benchmarkImage ? encodeURI(fields.benchmarkImage) : ''} alt="Benchmark" className="max-h-48 rounded-lg border border-[#e9ecef]" />}
          </div>

{/* Sketch Maps */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-[#b8860b] uppercase tracking-widest">Sketch Maps</p>
            </div>
            {!isReadOnly && <input type="file" multiple accept="image/*" onChange={e => handleFileUpload(e, 'sketchMapImages')} disabled={uploading} className="block w-full text-sm text-[#6c757d] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#b8860b]/10 file:text-[#b8860b] hover:file:bg-[#b8860b]/20 mb-2" />}
            
            {fields.sketchMapImages && fields.sketchMapImages.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {fields.sketchMapImages.map((url, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#e9ecef]">
                    <img src={url ? encodeURI(url) : ''} alt={`Sketch Map ${idx + 1}`} className="w-full h-32 object-contain bg-[#f8f9fa]" />
                    {!isReadOnly && (
                      <button onClick={() => removeSketchMap(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 border border-dashed rounded-lg text-gray-500 text-sm">
                No sketch maps added
              </div>
            )}
          </div>
          </SubSection>

          {/* Sub-section: ANNEXURE */}
          <SubSection id="subsection-land-annexure" title="Annexure (Multi-Plot / Schedule)" defaultOpen={false}>
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0a1628]/5 to-[#b8860b]/5 border border-[#b8860b]/20">
              <svg className="w-5 h-5 text-[#b8860b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              <p className="text-xs text-[#495057]">
                Upload Excel / CSV schedules (plot details, land schedule, etc.). Row 1 becomes headers; all subsequent rows become data. Each annexure renders as a full table page in the PDF.
              </p>
            </div>

            {/* Annexure Cards */}
            {fields.annexures.map((annexure) => (
              <div key={annexure.id} className="rounded-xl border border-[#dee2e6] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[#162d4a] to-[#1e3a5f]">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-[#b8860b] flex items-center justify-center text-xs font-bold text-white">{annexure.label}</span>
                    <span className="text-sm font-semibold text-white">Annexure {annexure.label}</span>
                  </div>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={() => removeAnnexure(annexure.id)}
                      className="text-red-300 hover:text-red-100 hover:bg-red-500/20 p-1 rounded-lg transition-colors"
                      title="Remove this annexure"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  )}
                </div>
                {/* Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5">Annexure Title / Heading</label>
                    <input
                      type="text"
                      value={annexure.title || ''}
                      onChange={e => updateAnnexureTitle(annexure.id, e.target.value)}
                      disabled={isReadOnly}
                      placeholder="e.g. Schedule of Land Details"
                      className={inputCls}
                    />
                  </div>
                  <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider">Excel / CSV Upload</label>
                  {annexure.excelFileUrl ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
                      <svg className="w-8 h-8 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-green-800 truncate">{annexure.excelFileName}</p>
                        <a href={annexure.excelFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                          Download / View file ↗
                        </a>
                        {annexure.parsedData && (
                          <p className="text-xs text-green-600 mt-0.5">{annexure.parsedData.rows.length} rows, {annexure.parsedData.headers.length} columns — will render as table in PDF</p>
                        )}
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => removeAnnexureFile(annexure.id)}
                          className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ) : (
                    !isReadOnly && (
                      <label className="flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed border-[#b8860b]/30 bg-[#fffaf0] cursor-pointer hover:bg-[#fff5e0] hover:border-[#b8860b]/50 transition-all group">
                        <svg className="w-10 h-10 text-[#b8860b]/40 group-hover:text-[#b8860b]/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <span className="text-sm font-medium text-[#b8860b]">
                          {uploading ? 'Uploading...' : 'Click to upload Excel / CSV'}
                        </span>
                        <span className="text-[10px] text-[#999]">Supports .xlsx, .xls, .csv (max 10MB)</span>
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                          className="hidden"
                          onChange={e => handleAnnexureUpload(annexure.id, e)}
                          disabled={uploading}
                        />
                      </label>
                    )
                  )}
                </div>
              </div>
            ))}

            {/* Add Annexure button */}
            {!isReadOnly && (
              <button onClick={addAnnexure} className="mt-1 text-sm text-[#b8860b] hover:text-[#96700a] font-medium flex items-center gap-1">
                <span className="text-lg">+</span> Add Annexure
              </button>
            )}
          </div>
          </SubSection>
          </div>
        </Section>



{/* ═══ ACTION BUTTONS ═══ */}
        <div className="flex flex-wrap gap-4 pt-4 items-center w-full pb-6">
          {status === 'COMPLETED' && (
            <div className="w-full p-4 rounded-full bg-green-50 border border-green-200 text-green-800 font-bold flex items-center gap-2">
              <span>✅</span> Verified and Completed (Pushed to storage for client download)
            </div>
          )}

          {status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE' && (
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-full bg-blue-50 border border-blue-200 text-blue-800 font-semibold mb-2">
              <span>⏳ Currently Under Manager Review.</span>
              <button
                onClick={handleCancelSubmission}
                disabled={loading}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-full text-xs font-bold transition-colors flex items-center gap-2"
              >
                ↩️ Cancel Submission (Pull back to Draft)
              </button>
            </div>
          )}

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
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="px-6 py-2.5 rounded-full border-2 border-yellow-600 text-yellow-600 font-bold text-sm hover:bg-yellow-50 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? '⏳ Saving...' : '💾 Save Draft'}
              </button>
              {userRole === 'REPORT_EMPLOYEE' && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? '⏳ Submitting...' : '📤 Submit to Manager'}
                </button>
              )}
            </>
          )}

          <button
            onClick={handlePreviewPDF}
            disabled={loading}
            className="px-6 py-2.5 rounded-full border border-gray-400 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            👁️ Preview PDF
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={loading}
            className="px-6 py-2.5 rounded-full border border-gray-400 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            📥 Download PDF
          </button>

          {status === 'MANAGER_REVIEW' && isManagerOrOwner && (
            <>
              <button
                onClick={handleReworkClick}
                disabled={loading}
                className="px-6 py-2.5 rounded-full border-2 border-red-500 text-red-600 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                ❌ Send for Rework
              </button>
              <button
                onClick={handleFinalize}
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                ✅ Finalize & Share to Client
              </button>
            </>
          )}
        </div>

      </div>{/* End Main Form Column */}

      <FloatingNavigator isLandOnly={isLandOnly} showLandAnnexure={fields.showLandAnnexure} />

      {/* ═══ BUCKET PICKER MODAL ═══ */}
      {bucketPickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0f2038]">📸 Pick from Field Agent Bucket</h2>
                <p className="text-xs text-[#6c757d] mt-1">
                  {bucketPickerMode === 'propertyImages' 
                    ? 'Select multiple photos' 
                    : bucketPickerMode === 'sketchMapImages'
                    ? 'Select one or more photos to use as Sketch Maps'
                    : 'Select one image'}
                </p>
              </div>
              <button onClick={() => setBucketPickerOpen(false)} className="text-[#6c757d] hover:text-[#0f2038] text-xl font-bold">✕</button>
            </div>

            {/* Agent Filter */}
            <div className="px-5 py-3 border-b border-[#e9ecef] flex gap-2 flex-wrap">
              <button onClick={() => setBucketPickerAgent(null)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${!bucketPickerAgent ? 'bg-[#b8860b] text-white' : 'bg-[#f1f3f5] text-[#495057] hover:bg-[#e9ecef]'}`}>All</button>
              {[...new Set(localBucketImages.map(i => i.employee.name))].map(name => (
                <button key={name} onClick={() => setBucketPickerAgent(name)} className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${bucketPickerAgent === name ? 'bg-[#b8860b] text-white' : 'bg-[#f1f3f5] text-[#495057] hover:bg-[#e9ecef]'}`}>
                  {name}
                </button>
              ))}
            </div>

            {/* Image Grid */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {localBucketImages.filter(img => !bucketPickerAgent || img.employee.name === bucketPickerAgent).map(img => (
                  <div
                    key={img.id}
                    data-bucket-card
                    onClick={() => toggleBucketImage(img.id)}
                    className={`relative group rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${bucketSelected.has(img.id) ? 'border-[#b8860b] ring-2 ring-[#b8860b]/30 scale-[0.97]' : 'border-transparent hover:border-[#dee2e6]'}`}
                  >
                    <img
                      src={img.url ? encodeURI(img.url) : ''}
                      alt={img.fileName}
                      className="w-full h-28 object-cover"
                      onError={(e) => {
                        const card = (e.target as HTMLImageElement).closest('[data-bucket-card]') as HTMLElement | null;
                        if (card) card.style.display = 'none';
                      }}
                    />
                    {bucketSelected.has(img.id) && (
                      <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-[#b8860b] rounded-full flex items-center justify-center text-white text-xs font-bold">✓</div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBucketImage(img);
                      }}
                      className="absolute top-1.5 left-1.5 w-6 h-6 bg-red-600/90 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                      title="Delete from bucket"
                    >
                      🗑️
                    </button>
                    <div className="px-2 py-1.5 bg-white">
                      <p className="text-[9px] font-semibold text-[#495057] truncate">{img.employee.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#e9ecef] bg-[#f8f9fa] flex justify-between items-center">
              <span className="text-xs font-semibold text-[#6c757d]">{bucketSelected.size} selected</span>
              <div className="flex gap-3">
                <button onClick={() => setBucketPickerOpen(false)} className="px-5 py-2 rounded-xl border border-[#dee2e6] text-sm font-semibold text-[#495057] hover:bg-white transition-colors">Cancel</button>
                <button onClick={handleBucketConfirm} disabled={bucketSelected.size === 0} className="px-5 py-2 rounded-xl bg-[#b8860b] text-white text-sm font-bold hover:bg-[#8b6914] transition-colors disabled:opacity-50">
                  Confirm Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ REWORK MODAL ═══ */}
      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#e9ecef] bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#0f2038]">Send for Rework</h2>
              <p className="text-xs text-[#6c757d] mt-1">Please provide specific feedback for the report agent.</p>
            </div>
            <div className="p-6">
              <textarea
                value={reworkComment}
                onChange={(e) => setReworkComment(e.target.value)}
                placeholder="List the changes required..."
                className="w-full min-h-[150px] p-4 text-sm rounded-xl border border-[#dee2e6] bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-y"
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-[#e9ecef] bg-[#f8f9fa] flex justify-end gap-3">
              <button
                onClick={() => { setShowReworkModal(false); setReworkComment(''); }}
                className="px-5 py-2.5 rounded-xl border border-[#dee2e6] text-sm font-semibold text-[#495057] hover:bg-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={submitRework}
                disabled={loading || !reworkComment.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Confirm Rework'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
