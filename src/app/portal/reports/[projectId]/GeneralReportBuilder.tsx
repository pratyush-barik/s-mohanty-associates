'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification, getBucketImages, deleteBucketImage } from '@/app/actions/project';
import { SERVICES_LIST } from './constants';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import { PDFGeneralRenderer } from '@/lib/pdf-general-renderer';
import AiAssistPanel from '@/components/AiAssistPanel';
import type { Suggestion } from '@/lib/ai/predictor';
import { getFloorName, BasePhotographsSection, ActiveConfigBanner, formatReportDate } from './banks/BaseBankReportComponents';
import { reorderAndLabelAnnexures, type AnnexureItem } from '@/lib/bank-fields';
import { decodeHtmlEntities, decodeHtmlEntitiesDeep } from '@/lib/html-entities';
// @ts-ignore
import * as XLSX from 'xlsx';

const fmtDate = (d?: string | null) => formatReportDate(d, '________');

// ─── Types ─────────────────────────────────────────────────────────
interface FloorRow {
  id: string;
  name: string;
  area: string;
  rate: string;
  yearBuilt: string;
  lifeYears: string;
  ageYears: string;
  depreciationPct: string;
}

const cleanAddressForMap = (rawAddr: string): string => {
  if (!rawAddr || !rawAddr.trim()) return '';
  let str = decodeHtmlEntities(rawAddr.trim());

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
  return Math.round((totalValue + Number.EPSILON) * 100) / 100;
};

const blockNegativeKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault();
  }
};

const sanitizePositiveDecimal = (val: string): string => {
  if (!val) return '';
  let cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

interface ReportFields {
  // Section 1 – General Details
  propertyType: string;
  ownerName: string;
  ownerAddress: string;
  city: string;
  pincode: string;
  landmark: string;
  loanApplicationType?: string;
  loanApplicationNo: string;
  documentHolderName: string;
  legalAddress: string;
  legalState: string;
  legalPincode: string;
  dateOfInspection: string;
  dateOfValuation: string;
  refNo: string;
  bankName: string;
  branchName: string;
  to: string;
  purpose: string;

  // Section 2 – Surrounding Locality Details
  wardNo: string;
  vicinity: string;
  classOfLocality: string;
  approachRoadWidth: string;
  plotDemarcated: string;
  distanceRailwayStation: string;
  distanceBusStop: string;
  distanceHospital: string;
  railwayStationName: string;
  busStopName: string;
  hospitalName: string;
  propertyIdentification: string;
  propertyIdentificationRemarks: string;
  proximityToFacilities: string;
  landmarkRailway: string;
  landmarkBusStop: string;
  landmarkHospital: string;
  landmarkNearest: string;

  // Section 3 – Property Details
  usageType: string;
  additionalAmenities: string;
  legalStatus: string;

  // Section 4 – Subject Property Details
  premisesType: string;
  occupiedBy: string;
  isPropertyRented: string;
  rentedOccupants: string;
  propertyTaxation: string;
  boundaryNorth: string;
  boundarySouth: string;
  boundaryEast: string;
  boundaryWest: string;
  buildingBoundaryNorth: string;
  buildingBoundarySouth: string;
  buildingBoundaryEast: string;
  buildingBoundaryWest: string;

  // Section 5 – Structural Details
  structureType: string;
  numberOfFloors: string;
  numberOfWings: string;
  unitsPerFloor: string;
  internalComposition: string;
  numberOfLifts: string;
  ageOfProperty: string;
  ageOfPropertyActual: string;
  estimatedFutureLife: string;
  exteriors: string;
  qualityOfConstruction: string;
  maintenanceCondition: string;
  commonAreasRemarks: string;
  otherObservations: string;
  flooringType: string;
  roofType: string;
  qualityOfFixtures: string;
  foundation: string;
  superstructure: string;
  doorsWindows: string;
  plastering: string;
  sanitary: string;
  electrification: string;

  // Section 6 – Plan Approvals
  constructionApproved: string;
  approvalDetails: string;
  constructionPermission: string;
  violationsObserved: string;
  conformsToByelaws: string;
  documentsVerified: string;

  // Section 7 – Floor-wise
  floors: FloorRow[];
  floorAreaUnit: string;

  // Section 8 – Land Valuation
  landArea: string;
  landAreaUnit: string;
  landRatePerUnit: string;
  govtLandRate: string;
  recommendedRateBasis: string;
  buaAsPerApprovals: string;

  // Valuation extras
  marketability: string;
  valuationResult: string;
  replacementCost: string;
  deviations: string;

  // Abstract
  realizablePct: string;
  distressPct: string;
  guidelineValue: string;

  // Remarks & Declaration
  demarcation: string;
  possession: string;
  remarks: string;
  representativeName: string;
  representativeFatherName: string;

  // Photos & Maps
  propertyImages: string[];
  propertyImageNames: string[];
  sketchMapImages: string[];
  locationMapImage: string;
  latitude: string;
  longitude: string;

  // Legacy backward-compat fields
  localityType: string;
  khataNo: string;
  plotNo: string;
  mouza: string;
  tahasil: string;
  district: string;
  state: string;
  developmentStatus: string;
  civicAmenities: string[];
  civicAmenitiesOther: string;
  distanceMainRoad: string;
  distanceMainRoadUnit: string;
  distanceRailway: string;
  distanceRailwayUnit: string;
  nearbyLandmarks: string;
  reworkNotes?: string;
  clientType?: string;
  organisationTemplate?: string;
  organisationSubTemplate?: string;
  institutionCategory?: string;
  serviceType?: string;
  subjectType?: string;
  valuationLayout?: 'land_building' | 'apartment';

  // Annexure
  annexureEnabled: boolean;
  annexureRef: string;          // Which annexure ID the technical address refers to
  annexureRefShowAlso: boolean; // Also show address field alongside annexure ref
  legalAnnexureEnabled: boolean;
  legalAnnexureRef: string;          // Which annexure ID the legal address refers to
  legalAnnexureRefShowAlso: boolean; // Also show legal address field alongside annexure ref
  annexures: AnnexureItem[];
}

const DEFAULT_FIELDS: ReportFields = {
  valuationLayout: 'land_building',
  propertyType: 'Residential',
  ownerName: '',
  ownerAddress: '',
  city: '',
  pincode: '',
  landmark: '',
  loanApplicationType: '',
  loanApplicationNo: '',
  documentHolderName: '',
  legalAddress: '',
  legalState: '',
  legalPincode: '',
  dateOfInspection: new Date().toISOString().split('T')[0],
  dateOfValuation: new Date().toISOString().split('T')[0],
  refNo: '',
  bankName: '',
  branchName: '',
  to: '',
  purpose: 'Home Loan',

  wardNo: '',
  vicinity: 'Residential',
  classOfLocality: 'Middle Class',
  approachRoadWidth: '40-20 Feet Road',
  plotDemarcated: 'Yes',
  distanceRailwayStation: '',
  distanceBusStop: '',
  distanceHospital: '',
  railwayStationName: '',
  busStopName: '',
  hospitalName: '',
  propertyIdentification: 'Easy to Identify',
  propertyIdentificationRemarks: '',
  proximityToFacilities: '1-3 Kms',
  landmarkRailway: '',
  landmarkBusStop: '',
  landmarkHospital: '',
  landmarkNearest: '',

  usageType: 'Residential',
  additionalAmenities: 'Not Applicable',
  legalStatus: 'Freehold',

  premisesType: 'Row House',
  occupiedBy: 'Self Occupied',
  isPropertyRented: '',
  rentedOccupants: '',
  propertyTaxation: 'Average',
  boundaryNorth: '',
  boundarySouth: '',
  boundaryEast: '',
  boundaryWest: '',
  buildingBoundaryNorth: '',
  buildingBoundarySouth: '',
  buildingBoundaryEast: '',
  buildingBoundaryWest: '',

  structureType: 'RCC',
  numberOfFloors: '1',
  numberOfWings: '',
  unitsPerFloor: '',
  internalComposition: 'Good',
  numberOfLifts: '',
  ageOfProperty: '',
  ageOfPropertyActual: '',
  estimatedFutureLife: '',
  exteriors: 'Beam & Column Structure',
  qualityOfConstruction: 'Good',
  maintenanceCondition: 'Good',
  commonAreasRemarks: 'Normal',
  otherObservations: '',
  flooringType: 'Tile Flooring',
  roofType: 'RCC Roofing',
  qualityOfFixtures: 'Good Quality Fittings',
  foundation: 'RCC',
  superstructure: 'Brick Masonry',
  doorsWindows: 'Wooden/UPVC',
  plastering: 'Cement Plastering',
  sanitary: 'Standard',
  electrification: 'Concealed',

  constructionApproved: 'Yes',
  approvalDetails: '',
  constructionPermission: '',
  violationsObserved: 'Low',
  conformsToByelaws: '',
  documentsVerified: '',

  floors: [{ id: '1', name: 'Ground', area: '', rate: '', yearBuilt: '', lifeYears: '60', ageYears: '', depreciationPct: '' }],
  floorAreaUnit: 'Sqft',

  landArea: '',
  landAreaUnit: 'Sqft',
  landRatePerUnit: '',
  govtLandRate: '',
  recommendedRateBasis: '',
  buaAsPerApprovals: '',

  marketability: 'Good',
  valuationResult: 'Positive',
  replacementCost: '',
  deviations: '',

  realizablePct: '90',
  distressPct: '80',
  guidelineValue: '',

  demarcation: 'Clear',
  possession: 'With Owner',
  remarks: '',
  representativeName: '',
  representativeFatherName: '',

  propertyImages: [],
  propertyImageNames: [],
  sketchMapImages: [],
  locationMapImage: '',
  latitude: '',
  longitude: '',

  localityType: 'Residential',
  khataNo: '',
  plotNo: '',
  mouza: '',
  tahasil: '',
  district: '',
  state: '',
  developmentStatus: 'Developed',
  civicAmenities: [],
  civicAmenitiesOther: '',
  distanceMainRoad: '',
  distanceMainRoadUnit: 'Meters',
  distanceRailway: '',
  distanceRailwayUnit: 'Km',
  nearbyLandmarks: '',
  clientType: '',
  organisationTemplate: '',
  organisationSubTemplate: '',
  institutionCategory: '',
  serviceType: '',
  subjectType: '',
  annexureEnabled: false,
  annexureRef: '',
  annexureRefShowAlso: false,
  legalAnnexureEnabled: false,
  legalAnnexureRef: '',
  legalAnnexureRefShowAlso: false,
  annexures: [],
};

const parseNum = (v: any): number => {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') return parseFloat(v.replace(/,/g, '') || '0') || 0;
  return 0;
};

function computeDepreciation(lifeYears: number, ageYears: number): number {
  if (lifeYears <= 0 || ageYears < 0) return 0;
  return Math.min(Math.round((ageYears / lifeYears) * 100), 90);
}

// ─── UI Components ─────────────────────────────────────────────────
function Section({ title, number, children, defaultOpen = true }: { title: string; number: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={`section-${number}`} className="card border border-[#e9ecef] overflow-hidden scroll-mt-24">
      <button
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

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] disabled:bg-[#f1f3f5] disabled:text-[#6c757d]";
const selectCls = inputCls;

/** 3-Column Option Field matching sample report format:
 * Col1 = Label | Col2 = All Options (clickable) | Col3 = Selected Value */
function OptionField({ label, options, value, onChange, disabled, customValue, onCustomChange, showCustomInput = false }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean;
  customValue?: string; onCustomChange?: (v: string) => void; showCustomInput?: boolean;
}) {
  return (
    <div className="border border-[#c8d6e5] rounded-lg overflow-hidden">
      <div className="flex min-h-[40px]">
        {/* Col 1: Label */}
        <div className="w-44 md:w-52 shrink-0 bg-[#d5e8f5] px-3 py-2 text-[10px] font-bold text-[#1a3a5c] uppercase tracking-wider border-r border-[#c8d6e5] flex items-start pt-2.5">
          {label}
        </div>
        {/* Col 2: Options List */}
        <div className="w-48 md:w-56 shrink-0 border-r border-[#c8d6e5]">
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => !disabled && onChange(opt)}
              className={`px-3 py-1.5 text-xs border-b border-[#c8d6e5] last:border-b-0 transition-colors
                ${value === opt ? 'bg-[#a8cce0] font-bold text-[#0f2038]' : 'bg-[#e8f0f8] text-[#333]'}
                ${disabled ? 'cursor-default opacity-70' : 'cursor-pointer hover:bg-[#c5ddf0]'}`}
            >
              {opt}
            </div>
          ))}
        </div>
        {/* Col 3: Selected Value */}
        <div className="flex-1 flex items-center px-4 py-2 bg-white min-w-0">
          {showCustomInput ? (
            <div className="w-full space-y-1.5">
              <span className="text-sm font-semibold text-[#0f2038] block">{value || '\u2014'}</span>
              <input
                className="w-full px-2 py-1.5 rounded border border-[#dee2e6] bg-white text-[#212529] text-xs focus:outline-none focus:ring-1 focus:ring-[#b8860b]/30 disabled:bg-[#f1f3f5]"
                value={customValue || ''}
                onChange={e => onCustomChange?.(e.target.value)}
                disabled={disabled}
                placeholder="Additional remarks..."
              />
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#0f2038]">{value || '\u2014'}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Landmark/Distance field: Label | Sub-labels | Input values */
function LandmarkField({ label, rows, disabled }: {
  label: string;
  rows: { subLabel: string; value: string; onChange: (v: string) => void }[];
  disabled?: boolean;
}) {
  return (
    <div className="border border-[#c8d6e5] rounded-lg overflow-hidden">
      <div className="flex min-h-[40px]">
        <div className="w-44 md:w-52 shrink-0 bg-[#d5e8f5] px-3 py-2 text-[10px] font-bold text-[#1a3a5c] uppercase tracking-wider border-r border-[#c8d6e5] flex items-start pt-2.5">
          {label}
        </div>
        <div className="w-48 md:w-56 shrink-0 border-r border-[#c8d6e5]">
          {rows.map((r, i) => (
            <div key={i} className="px-3 py-1.5 text-xs border-b border-[#c8d6e5] last:border-b-0 bg-[#e8f0f8] font-semibold text-[#333]">
              {r.subLabel}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          {rows.map((r, i) => (
            <div key={i} className="border-b border-[#c8d6e5] last:border-b-0">
              <input
                className="w-full px-3 py-1.5 text-xs bg-white text-[#212529] focus:outline-none focus:bg-[#fffbf0] disabled:bg-[#f1f3f5] disabled:text-[#6c757d]"
                value={r.value}
                onChange={e => r.onChange(e.target.value)}
                disabled={disabled}
                placeholder="Enter details..."
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



const BANK_FIS_LIST = [
  'ADITYA BIRLA CAPITAL LTD','ADITYA BIRLA HOUSING FINANCE LTD','ANNAPURNA MICRO FINANCE LTD',
  'ARKA FINANCE LTD','ARTHAN FINANCE','AU SMALL FINANCE BANK','AVE FINANCE LTD',
  'AXIS BANK','AXIS FINANCE LTD','BAJAJ HOUSING FINANCE LTD','BANDHAN BANK',
  'BANK OF BARODA-BOB','BANK OF INDIA-BOI','BANK OF MAHARASHTRA-BOM','CANARA BANK',
  'CANFIN HOMES LTD','CHOLAMANDALAM INVESTMENT COMPANY LTD','CLIX CAPITAL LTD',
  'DCB BANK','GIC HOUSING FINANCE','GRIHAM HOUSING FINANCE','HDB FINANCIAL SERVICES',
  'HDFC BANK','ICICI BANK','IDBI BANK','IDFC FIRST BANK','IKF FINANCE',
  'INDIAN BANK','INDUSIND BANK','ISFC','JANA SMALL FINANCE BANK','KOTAK MAHINDRA BANK',
  'L&T FINANCIAL SERVICES','LIC HOUSING FINANCE LTD','MAHINDRA FINANCE LTD',
  'MANAPPURAM HOUSING FINANCE','NAVDHAN FINANCE','NEO GROWTH','PNB HOUSING FINANCE LTD',
  'POONAWALLA FINANCE','PROTEUM FINANCE','PUNJAB & SIND BANK','PUNJAB NATIONAL BANK',
  'PURPLE FINANCE','SAMMUNATI FINANCE','SMFG INDIA-FULLERTON','SHRIRAM FINANCE',
  'STATE BANK OF INDIA-SBI','SURYODAY SMALL FINANCE BANK','SWARNA FINANCE',
  'TATA CAPITAL LTD','TATA HOUSING FINANCE LTD','UCO BANK','UJJIVAN SMALL FINANCE BANK',
  'UNION BANK OF INDIA-UBI','UNITY SMALL FINANCE BANK','UTKARSH SMALL FINANCE BANK',
  'VARTHANA FINANCE','VISTAAR FINANCE','YES BANK',
];

const APF_LIST = [
  'AXIS BANK','IDBI BANK','IDFC FIRST BANK','KOTAK MAHINDRA BANK',
  'LIC HOUSING FINANCE LTD','PNB HOUSING FINANCE LTD','STATE BANK OF INDIA',
  'YES BANK','OTHER PSU BANKS',
];

const CF_LIST = [
  'FOR UNSOLD STOCKS FLAT UNITS OF PROJECT',
  'TOTAL FLAT UNITS OF PROJECT',
  'LIC HOUSING FINANCE LTD FORMAT',
];

const INSTITUTE_CATEGORIES = [
  { id: 'bank_fis', label: 'Bank & FIS', icon: '🏦', list: BANK_FIS_LIST },
  { id: 'apf', label: 'Advance Processing Facility', icon: '💼', list: APF_LIST },
  { id: 'cf', label: 'Construction Funding', icon: '🏗️', list: CF_LIST },
  { id: 'income_tax', label: 'Income Tax Capital Gain', icon: '📊', direct: true },
  { id: 'ibbi', label: 'IBBI - IVS', icon: '⚖️', direct: true },
];

const BANK_SUB_TEMPLATES: Record<string, string[]> = {
  'ADITYA BIRLA CAPITAL LTD': ['MLAP', 'STSL'],
  'ADITYA BIRLA HOUSING FINANCE LTD': ['HL-LAP'],
  'AXIS BANK': ['AGRI', 'HL-LAP', 'SBB', 'SME'],
  'BAJAJ HOUSING FINANCE LTD': ['HL-LAP'],
  'BANDHAN BANK': ['HL-LAP', 'SME'],
  'DCB BANK': ['Desktop valuation format', 'HL-LAP-SME'],
  'HDFC BANK': ['HL-LAP-BLG'],
  'ICICI BANK': ['HL-LAP-BBG', 'NPA'],
  'KOTAK MAHINDRA BANK': ['BUSINESS BANKING GROUP', 'HL-LAP'],
  'LIC HOUSING FINANCE LTD': [
    'NPA-DEFAULT CASES',
    'PVR-1(SELF CONSTRUCTIONLA-L & B)',
    'PVR-2(FLAT-UNDERCONSTRUCTION)',
    'PVR-3(LAP-RENNOVATION-BOTH L&B-FLAT)',
    'PVR-4(LAND PURCHSASE ONLY)',
    'PVR-5 (SUBSEQUENT VALUATION REPORT)'
  ],
  'TATA CAPITAL LTD': ['SME-BLG'],
};

const FloatingNavigator = ({ isApartmentFlat, annexureEnabled }: { isApartmentFlat: boolean; annexureEnabled: boolean }) => {
  const [activeId, setActiveId] = useState<string>('');

  const NAV_SECTIONS = [
    { id: 'section-1', title: 'General Details' },
    { id: 'section-2', title: 'Locality Details' },
    { id: 'section-3', title: 'Property Details' },
    { id: 'section-4', title: 'Subject Property' },
    { id: 'section-5', title: 'Structural Details' },
    { id: 'section-6', title: 'Plan Approvals' },
    { id: 'layout-config', title: 'Layout Structure', special: true },
    { id: 'section-7', title: 'Area Valuation' },
    ...(isApartmentFlat ? [] : [{ id: 'section-8', title: 'Land Valuation' }]),
    { id: `section-${isApartmentFlat ? 8 : 9}`, title: 'Valuation Abstract' },
    { id: `section-${isApartmentFlat ? 9 : 10}`, title: 'Remarks' },
    { id: `section-${isApartmentFlat ? 10 : 11}`, title: 'Certificate' },
    { id: `section-${isApartmentFlat ? 11 : 12}`, title: 'Photographs' },
    { id: `section-${isApartmentFlat ? 12 : 13}`, title: 'Sketch Maps' },
    { id: `section-${isApartmentFlat ? 13 : 14}`, title: 'Location Map' },
    { id: `section-${isApartmentFlat ? 14 : 15}`, title: 'Annexures' },
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
  }, [isApartmentFlat, annexureEnabled]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="hidden xl:flex flex-col gap-0 bg-white/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-[#e9ecef] p-2 rounded-2xl w-[160px] sticky top-24 shrink-0 z-40">
      <div className="text-[10px] font-black text-neutral-400 mb-1 px-2 uppercase tracking-widest">Sections</div>
      {NAV_SECTIONS.map((sec: any) => {
        const isActive = activeId === sec.id;
        const isSpecial = sec.special;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            className={`text-left py-1 px-2.5 rounded-lg transition-all flex flex-col justify-center ${
              isSpecial
                ? isActive ? 'bg-red-500 text-black font-extrabold shadow-md border border-red-600 my-1' : 'bg-red-500 text-black font-bold hover:bg-red-600 hover:text-black border border-red-600 my-1'
                : !sec.indent
                  ? 'my-1 font-extrabold bg-indigo-50 text-indigo-800 border border-indigo-100 shadow-sm'
                  : 'pl-3.5 text-slate-600 hover:bg-[#b8860b]/10 hover:text-[#b8860b]'
            } ${
              !isSpecial && isActive
                ? '!bg-[#b8860b] !text-white !border-[#b8860b] shadow-md'
                : ''
            }`}
          >
            <span className={`leading-tight truncate w-full ${sec.indent ? 'text-[11px] font-bold' : 'text-[11.5px]'}`}>
              {sec.title}
            </span>
            {sec.sub && (
              <span className={`text-[9px] font-semibold tracking-wider mt-0.5 ${isActive && !isSpecial ? 'text-amber-100' : 'text-slate-400'}`}>
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

interface GeneralReportBuilderProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole?: string;
  bucketImages?: BucketImageItem[];
  prefill?: {
    ownerName?: string;
    ownerAddress?: string;
    propertyAddress?: string;
    propertyType?: string;
    purpose?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  onWizardComplete?: () => void;
  onNavigateToBuilder?: (target: 'ibbi' | 'income_tax' | 'bank', updatedFields: any) => void;
  onResetWizard?: () => void;
}

export default function GeneralReportBuilder({ projectId, projectCode, initialFields, status, userRole = 'REPORT_EMPLOYEE', bucketImages = [], prefill, onWizardComplete, onNavigateToBuilder, onResetWizard }: GeneralReportBuilderProps) {
  const mappedServiceId = prefill?.propertyType
    ? SERVICES_LIST.find(s => s.title.toLowerCase() === prefill.propertyType?.toLowerCase())?.id
    : undefined;

  const initialServiceType = initialFields?.serviceType;
  const isValidServiceType = initialServiceType && SERVICES_LIST.some(s => s.id === initialServiceType);

  const finalServiceType = isValidServiceType
    ? initialServiceType
    : (mappedServiceId || DEFAULT_FIELDS.serviceType);

  const finalSubjectType = initialFields?.subjectType || prefill?.purpose || DEFAULT_FIELDS.subjectType;
  const finalValuationLayout = initialFields?.valuationLayout ||
    (/apartment|flat/i.test(finalSubjectType || '') ? 'apartment' : 'land_building');

  const merged = {
    ...DEFAULT_FIELDS,
    ...(typeof initialFields === 'object' && initialFields !== null ? initialFields : {}),
    refNo: initialFields?.refNo || projectCode || DEFAULT_FIELDS.refNo,
    to: initialFields?.to || DEFAULT_FIELDS.to,
    city: initialFields?.city || DEFAULT_FIELDS.city,
    pincode: initialFields?.pincode || DEFAULT_FIELDS.pincode,
    serviceType: finalServiceType,
    subjectType: finalSubjectType,
    ownerName: initialFields?.ownerName || prefill?.contactName || DEFAULT_FIELDS.ownerName,
    ownerAddress: initialFields?.ownerAddress || prefill?.propertyAddress || DEFAULT_FIELDS.ownerAddress,
    propertyImages: Array.isArray(initialFields?.propertyImages) ? initialFields.propertyImages : (typeof initialFields?.propertyImages === 'string' && initialFields.propertyImages ? [initialFields.propertyImages] : DEFAULT_FIELDS.propertyImages),
    propertyImageNames: Array.isArray(initialFields?.propertyImageNames) ? initialFields.propertyImageNames : DEFAULT_FIELDS.propertyImageNames,
    sketchMapImages: Array.isArray(initialFields?.sketchMapImages) 
      ? initialFields.sketchMapImages 
      : (typeof initialFields?.sketchMapImage === 'string' && initialFields.sketchMapImage ? [initialFields.sketchMapImage] : DEFAULT_FIELDS.sketchMapImages),
    civicAmenities: Array.isArray(initialFields?.civicAmenities) ? initialFields.civicAmenities : DEFAULT_FIELDS.civicAmenities,
    ageOfPropertyActual: typeof initialFields?.ageOfPropertyActual === 'string' ? initialFields.ageOfPropertyActual : DEFAULT_FIELDS.ageOfPropertyActual,
    valuationLayout: finalValuationLayout,
  };
  if (!Array.isArray(merged.floors) || merged.floors.length === 0) {
    merged.floors = DEFAULT_FIELDS.floors;
  }

  const [fields, setFields] = useState<ReportFields>(() => decodeHtmlEntitiesDeep(merged));
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Bucket Picker State (Property Photographs only)
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
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

  const openBucketPicker = async () => {
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

    const newUrls = [...(fields.propertyImages || []), ...selectedImages.map(img => img.url)];
    handleChange('propertyImages', newUrls);

    setBucketPickerOpen(false);
    setBucketSelected(new Set());
    setMessage({ type: 'success', text: `${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} added from bucket!` });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleBucketImage = (id: string) => {
    setBucketSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  
  // Rework Modal State
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkComment, setReworkComment] = useState('');

  // Additional Amenities Checkbox States
  const PREDEFINED_AMENITIES = [
    "Garden",
    "Swimming Pool",
    "Gymnasium",
    "Club House",
    "Children's Play Area",
    "Community Hall",
    "Power Backup"
  ];

  const [isOtherChecked, setIsOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    const val = initialFields?.additionalAmenities || merged.additionalAmenities || '';
    if (typeof val === 'string' && val && val !== 'Not Applicable' && val !== 'N/A') {
      const selected = val.split(', ').map(s => s.trim()).filter(Boolean);
      const hasOther = selected.some(item => !PREDEFINED_AMENITIES.includes(item));
      setIsOtherChecked(hasOther);
      const others = selected.filter(item => !PREDEFINED_AMENITIES.includes(item));
      setOtherText(others.join(', '));
    } else {
      setIsOtherChecked(false);
      setOtherText('');
    }
  }, [projectId]);

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

  const reportRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // If clientType was already set to 'organisation' but no bank was chosen,
  // skip straight to the org-selector panel when wizard opens
  const [selectingOrg, setSelectingOrg] = useState(
    initialFields?.clientType === 'organisation' && !initialFields?.organisationTemplate
  );
  const isWizardComplete =
    initialFields?.clientType === 'individual' ||
    (initialFields?.clientType === 'organisation' && !!initialFields?.organisationTemplate);
  const [wizardStep, setWizardStep] = useState<'setup' | 'completed'>(isWizardComplete ? 'completed' : 'setup');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showBankList, setShowBankList] = useState(false);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [showSubList, setShowSubList] = useState(false);

  const completeWizardAndSave = async (updates: Partial<typeof fields>) => {
    const updatedFields = { ...fields, ...updates };
    
    const isSpecialTemplate = ['INCOME_TAX', 'IBBI_IVS'].includes(updatedFields.organisationTemplate || '');
    const isBankTemplate = updatedFields.clientType === 'organisation' && updatedFields.organisationTemplate && !isSpecialTemplate;
    
    if (isSpecialTemplate) {
      if (onNavigateToBuilder) {
        onNavigateToBuilder(updatedFields.organisationTemplate === 'IBBI_IVS' ? 'ibbi' : 'income_tax', updatedFields);
      } else {
        saveReportDraft(projectId, updatedFields).catch(e => console.error("Auto-save draft failed:", e));
        const builderParam = updatedFields.organisationTemplate === 'IBBI_IVS' ? 'IBBI_IVS' : 'INCOME_TAX';
        bypassUnloadRef.current = true;
        window.location.href = `${window.location.pathname}?builder=${builderParam}`;
      }
    } else if (isBankTemplate && onNavigateToBuilder) {
      onNavigateToBuilder('bank', updatedFields);
    } else {
      // For general templates, update local state and show the form
      setFields(updatedFields);
      setWizardStep('completed');
      saveReportDraft(projectId, updatedFields).catch(e => console.error("Auto-save draft failed:", e));
    }
  };
  const handleSelectClientType = (type: 'individual' | 'organisation') => {
    if (type === 'individual') {
      completeWizardAndSave({ clientType: 'individual', organisationTemplate: '' });
    } else {
      setSelectingOrg(true);
    }
  };

  const handleSelectOrganisation = (value: string) => {
    // Normalize or match spelling to BANK_SUB_TEMPLATES key
    const normalizedKey = Object.keys(BANK_SUB_TEMPLATES).find(k => k.replace(/\s+/g, ' ').trim() === value.replace(/\s+/g, ' ').trim());
    if (normalizedKey && BANK_SUB_TEMPLATES[normalizedKey]) {
      setSelectedBank(normalizedKey);
      setShowBankList(false);
      setShowSubList(true);
    } else {
      completeWizardAndSave({
        clientType: 'organisation',
        organisationTemplate: value,
        organisationSubTemplate: '',
        bankName: value,
        to: fields.to || value,
      });
      setSelectingOrg(false);
      setSelectedCategory(null);
      setShowBankList(false);
    }
  };

  const handleSelectSubTemplate = (subOpt: string) => {
    const fullBankName = `${selectedBank} - ${subOpt}`;
    completeWizardAndSave({
      clientType: 'organisation',
      organisationTemplate: selectedBank || '',
      organisationSubTemplate: subOpt,
      bankName: selectedBank || '',
      to: fields.to || fullBankName,
    });
    setSelectingOrg(false);
    setSelectedCategory(null);
    setShowBankList(false);
    setShowSubList(false);
    setSelectedBank(null);
  };

  const handleCategoryClick = (category: string) => {
    const categoryLabel = INSTITUTE_CATEGORIES.find(c => c.id === category)?.label || category;
    if (category === 'income_tax' || category === 'ibbi') {
      completeWizardAndSave({
        clientType: 'organisation',
        organisationTemplate: category === 'income_tax' ? 'INCOME_TAX' : 'IBBI_IVS',
        institutionCategory: categoryLabel,
      });
    } else {
      setFields(prev => ({
        ...prev,
        institutionCategory: categoryLabel,
      }));
      setSelectedCategory(category);
      setShowBankList(true);
    }
  };

  const handleBackFromBanks = () => {
    setShowBankList(false);
    setSelectedCategory(null);
  };

  const handleWizardBack = () => {
    if (showSubList) {
      setShowSubList(false);
      setSelectedBank(null);
    } else if (showBankList) {
      setShowBankList(false);
      setSelectedCategory(null);
    } else if (selectingOrg) {
      setSelectingOrg(false);
    }
  };

  const getSelectedAmenities = () => {
    const valStr = fields.additionalAmenities || '';
    if (typeof valStr !== 'string' || !valStr || valStr === 'Not Applicable' || valStr === 'N/A') return [];
    return valStr.split(', ').map(s => s.trim()).filter(Boolean);
  };

  const handleAmenityCheckboxChange = (amenity: string, checked: boolean) => {
    const selected = getSelectedAmenities();
    let next = selected.filter(item => item !== 'Not Applicable');
    if (checked) {
      if (!next.includes(amenity)) next.push(amenity);
    } else {
      next = next.filter(item => item !== amenity);
    }
    // Append otherText if other is checked and has text
    if (isOtherChecked && otherText.trim()) {
      // Remove previous other values first to avoid duplication
      next = next.filter(item => PREDEFINED_AMENITIES.includes(item));
      next.push(otherText.trim());
    }
    handleChange('additionalAmenities', next.length > 0 ? next.join(', ') : 'Not Applicable');
  };

  const handleOtherCheckboxChange = (checked: boolean) => {
    setIsOtherChecked(checked);
    if (!checked) {
      setOtherText('');
      const selected = getSelectedAmenities();
      const next = selected.filter(item => PREDEFINED_AMENITIES.includes(item));
      handleChange('additionalAmenities', next.length > 0 ? next.join(', ') : 'Not Applicable');
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    const selected = getSelectedAmenities();
    const next = selected.filter(item => PREDEFINED_AMENITIES.includes(item));
    if (text.trim()) {
      next.push(text.trim());
    }
    handleChange('additionalAmenities', next.length > 0 ? next.join(', ') : 'Not Applicable');
  };

  const handleResetWizard = async () => {
    if (confirm("Are you sure you want to change report parameters? This will permanently clear all your typed data and reset the report.")) {
      if (onResetWizard) {
        onResetWizard();
      }
    }
  };
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  const handleChange = useCallback((field: keyof ReportFields, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
  }, []);

  const getFullAddress = useCallback(() => {
    const parts = [
      fields.ownerAddress,
      fields.state,
      fields.pincode ? `PIN: ${fields.pincode}` : ''
    ].filter(Boolean);
    return parts.join(', ');
  }, [fields.ownerAddress, fields.state, fields.pincode]);

  const getLegalFullAddress = useCallback(() => {
    const parts = [
      fields.legalAddress,
      fields.legalState,
      fields.legalPincode ? `PIN: ${fields.legalPincode}` : ''
    ].filter(Boolean);
    return parts.join(', ');
  }, [fields.legalAddress, fields.legalState, fields.legalPincode]);

  // ── Floor helpers ──
  const addFloor = () => {
    handleChange('floors', [...fields.floors, {
      id: String(Date.now()), name: getFloorName(fields.floors.length), area: '', rate: '',
      yearBuilt: '', lifeYears: '60', ageYears: '', depreciationPct: '',
    }]);
  };
  const removeFloor = (id: string) => {
    if (fields.floors.length <= 1) return;
    handleChange('floors', fields.floors.filter(f => f.id !== id));
  };
  const updateFloor = (id: string, key: keyof FloorRow, value: string) => {
    handleChange('floors', fields.floors.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  // ── Annexure helpers (Strictly ordered: 1. Technical, 2. Legal, 3+. Custom) ──
  const addAnnexure = () => {
    const newAnnexure = {
      id: String(Date.now()),
      label: 'A',
      title: '',
      excelFileUrl: '',
      excelFileName: '',
    };
    const updated = [...fields.annexures, newAnnexure];
    handleChange('annexures', reorderAndLabelAnnexures(
      updated,
      fields.annexureRef,
      fields.legalAnnexureRef,
      fields.annexureEnabled,
      fields.legalAnnexureEnabled
    ));
  };

  const removeAnnexure = (id: string) => {
    const isTech = fields.annexureRef === id;
    const isLegal = fields.legalAnnexureRef === id;
    const remaining = fields.annexures.filter(a => a.id !== id);
    const nextTechEnabled = isTech ? false : fields.annexureEnabled;
    const nextTechRef = isTech ? '' : fields.annexureRef;
    const nextLegalEnabled = isLegal ? false : fields.legalAnnexureEnabled;
    const nextLegalRef = isLegal ? '' : fields.legalAnnexureRef;

    setFields(prev => ({
      ...prev,
      annexureEnabled: nextTechEnabled,
      annexureRef: nextTechRef,
      annexureRefShowAlso: isTech ? false : prev.annexureRefShowAlso,
      legalAnnexureEnabled: nextLegalEnabled,
      legalAnnexureRef: nextLegalRef,
      legalAnnexureRefShowAlso: isLegal ? false : prev.legalAnnexureRefShowAlso,
      annexures: reorderAndLabelAnnexures(
        remaining,
        nextTechRef,
        nextLegalRef,
        nextTechEnabled,
        nextLegalEnabled
      ),
    }));
  };

  const updateAnnexureTitle = (id: string, title: string) => {
    handleChange('annexures', fields.annexures.map(a => a.id === id ? { ...a, title } : a));
  };
  const handleAnnexureUpload = async (annexureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUploadError('File exceeds 10MB limit.'); return; }

    setUploading(true);
    setUploadError(null);

    // Parse Excel/CSV — cell-by-cell to preserve merge info and column widths
    let parsedData: AnnexureItem['parsedData'] | undefined;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const ref = ws['!ref'];
      if (ref) {
        const range = XLSX.utils.decode_range(ref);
        // Read every cell into a 2-D array
        let rawAllRows: string[][] = [];
        for (let r = range.s.r; r <= range.e.r; r++) {
          const row: string[] = [];
          for (let c = range.s.c; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[addr];
            row.push(cell ? String(XLSX.utils.format_cell(cell)) : '');
          }
          rawAllRows.push(row);
        }
        const rawMerges = ((ws['!merges'] || []) as any[]).map((m: any) => ({
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

        // Trim leading/trailing blank columns and rows
        let minCol = 0;
        while (minCol < numCols) {
          if (!rawAllRows.every(row => !row[minCol] || row[minCol].trim() === '')) break;
          minCol++;
        }
        let maxCol = numCols - 1;
        while (maxCol >= minCol) {
          if (!rawAllRows.every(row => !row[maxCol] || row[maxCol].trim() === '')) break;
          maxCol--;
        }
        let minRow = 0;
        while (minRow < rawAllRows.length) {
          if (!rawAllRows[minRow].every(cell => !cell || cell.trim() === '')) break;
          minRow++;
        }
        let maxRow = rawAllRows.length - 1;
        while (maxRow >= minRow) {
          if (!rawAllRows[maxRow].every(cell => !cell || cell.trim() === '')) break;
          maxRow--;
        }

        if (minCol <= maxCol && minRow <= maxRow) {
          const allRows = rawAllRows.slice(minRow, maxRow + 1).map(row => row.slice(minCol, maxCol + 1));
          const trimmedRawW = rawW.slice(minCol, maxCol + 1);
          const totalW = trimmedRawW.reduce((s, w) => s + w, 0) || (maxCol - minCol + 1) * 64;
          const colWidths = trimmedRawW.map(w => w / totalW);

          const newNumRows = maxRow - minRow + 1;
          const newNumCols = maxCol - minCol + 1;
          const merges: { sr: number; sc: number; er: number; ec: number }[] = [];

          for (const m of rawMerges) {
            const sr = m.sr - minRow;
            const er = m.er - minRow;
            const sc = m.sc - minCol;
            const ec = m.ec - minCol;
            if (er < 0 || sr >= newNumRows || ec < 0 || sc >= newNumCols) continue;
            merges.push({
              sr: Math.max(0, sr),
              sc: Math.max(0, sc),
              er: Math.min(newNumRows - 1, er),
              ec: Math.min(newNumCols - 1, ec),
            });
          }

          // Auto-detect horizontal row merges for single-entry rows (e.g. section titles)
          for (let r = 0; r < allRows.length; r++) {
            const row = allRows[r];
            const nonEmpties = row.map((cell, c) => ({ cell: cell.trim(), c })).filter(item => item.cell !== '');
            if (nonEmpties.length === 1 && newNumCols > 1) {
              const firstCol = nonEmpties[0].c;
              const existing = merges.find(m => m.sr === r && m.sc === firstCol);
              if (!existing) {
                merges.push({ sr: r, sc: firstCol, er: r, ec: newNumCols - 1 });
              }
            }
          }

          parsedData = {
            headers: allRows[0]?.map(h => String(h)) || [],
            rows: allRows.slice(1).map(row => row.map(c => String(c))),
            allRows,
            merges,
            colWidths,
          };
        }
      }
    } catch (parseErr) {
      console.warn('Could not parse Excel/CSV file:', parseErr);
    }

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

  // ── AI Assist handlers ──
  const handleAiAcceptSuggestion = useCallback((fieldKey: string, value: string) => {
    handleChange(fieldKey as keyof ReportFields, value);
  }, [handleChange]);

  const handleAiAcceptFloorSuggestion = useCallback((floorId: string, fieldName: string, value: string) => {
    handleChange('floors', fields.floors.map(f => f.id === floorId ? { ...f, [fieldName]: value } : f));
  }, [handleChange, fields.floors]);

  const handleAiAcceptAll = useCallback((suggestions: Record<string, Suggestion>) => {
    setFields(prev => {
      const updated = { ...prev };
      const floorUpdates: Record<string, Record<string, string>> = {};

      for (const [key, suggestion] of Object.entries(suggestions)) {
        const floorMatch = key.match(/^floor_(.+)_(rate|lifeYears|depreciationPct|ageYears)$/);
        if (floorMatch) {
          const [, floorId, fieldName] = floorMatch;
          if (!floorUpdates[floorId]) floorUpdates[floorId] = {};
          floorUpdates[floorId][fieldName] = suggestion.value;
        } else {
          (updated as any)[key] = suggestion.value;
        }
      }

      if (Object.keys(floorUpdates).length > 0 && Array.isArray(updated.floors)) {
        updated.floors = updated.floors.map(f => {
          if (floorUpdates[f.id]) {
            return { ...f, ...floorUpdates[f.id] };
          }
          return f;
        });
      }

      return updated;
    });
  }, []);

  // ── Computed values ──
  const totalPlinthArea = fields.floors.reduce((sum, f) => sum + parseNum(f.area), 0);
  const landValue = calculateTotalLandValue(fields.landArea, fields.landAreaUnit, fields.landRatePerUnit);

  const floorValuations = fields.floors.map(f => {
    const area = parseNum(f.area);
    const rate = parseNum(f.rate);
    const estimated = area * rate;
    const life = parseNum(f.lifeYears);
    const age = parseNum(f.ageYears);
    const depPct = f.depreciationPct ? parseNum(f.depreciationPct) : computeDepreciation(life, age);
    const depAmount = estimated * depPct / 100;
    const netValue = estimated - depAmount;
    return { ...f, area, rate, estimated, depPct, depAmount, netValue };
  });

  const totalBuildingValue = floorValuations.reduce((sum, f) => sum + f.netValue, 0);

  // UI derived states
  const isApartmentFlat = fields.valuationLayout === 'apartment';

  const totalPropertyValue = isApartmentFlat ? totalBuildingValue : landValue + totalBuildingValue;
  const realizableValue = totalPropertyValue * (parseNum(fields.realizablePct || '90') / 100);
  const distressValue = totalPropertyValue * (parseNum(fields.distressPct || '80') / 100);

  // ── File upload (photos + maps) ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'propertyImages' | 'sketchMapImages' | 'locationMapImage') => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError(null);

    if (fieldName === 'propertyImages' || fieldName === 'sketchMapImages') {
      const newUrls = [...(fields[fieldName] || [])];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 5 * 1024 * 1024) { setUploadError(`${file.name}: exceeds 5MB.`); continue; }
        const ext = file.name.split('.').pop();
        const fileName = `${projectId}-${Math.random().toString(36).substring(2)}.${ext}`;
        const filePath = `temp-photos/${projectId}/${fileName}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) { setUploadError(`Failed: ${error.message}`); continue; }
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }
      handleChange(fieldName, newUrls);
    } else {
      const file = fileList[0];
      if (file.size > 5 * 1024 * 1024) { setUploadError(`${file.name}: exceeds 5MB.`); setUploading(false); return; }
      const ext = file.name.split('.').pop();
      const fileName = `${projectId}-${fieldName}-${Date.now()}.${ext}`;
      const filePath = `temp-photos/${projectId}/${fileName}`;
      const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
      if (error) { setUploadError(`Failed: ${error.message}`); }
      else {
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        handleChange(fieldName, data.publicUrl);
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

  // ── Save / Submit / Finalize ──
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

  const handleGeneratePDF = async () => {
    try {
      // ── Fetch images safely (handling missing ones correctly) ──
      const fetchBytes = async (url: string | undefined): Promise<Uint8Array | null> => {
        if (!url) return null;
        try {
          const resp = await fetch(url);
          const buf = await resp.arrayBuffer();
          return new Uint8Array(buf);
        } catch { return null; }
      };

      const propertyImgs = Array.isArray(fields.propertyImages) ? fields.propertyImages.filter(img => typeof img === 'string' && img.length > 0) : [];

      const imageResults = await Promise.all([
        ...propertyImgs.map(url => fetchBytes(url)),
        ...(fields.sketchMapImages && fields.sketchMapImages.length > 0 ? fields.sketchMapImages.map(u => fetchBytes(u)) : []),
        ...(fields.locationMapImage ? [fetchBytes(fields.locationMapImage)] : []),
      ]);

      const propImageBytes: Uint8Array[] = imageResults.slice(0, propertyImgs.length).filter(Boolean) as Uint8Array[];
      let imgIdx = propertyImgs.length;
      const sketchBytesList = fields.sketchMapImages?.length ? imageResults.slice(imgIdx, imgIdx + fields.sketchMapImages.length) : null;
      if (fields.sketchMapImages?.length) imgIdx += fields.sketchMapImages.length;
      const locationBytes = fields.locationMapImage ? imageResults[imgIdx++] : null;

      // ── Initialize the renderer (automatically defaults letterhead) ──
      const r = new PDFGeneralRenderer();
      await r.init();

      // Date formatter: YYYY-MM-DD → DD/MM/YYYY
      const fmtDate = (d: string) => {
        if (!d || !d.trim()) return '________';
        const t = d.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(t)) { const [y,m,dd] = t.split('-'); return `${dd}/${m}/${y}`; }
        return t;
      };

      // ── Title block ──
      let titleText = 'VALUATION REPORT';

      r.drawTextBlock('To', { bold: true });
      r.drawTextBlock(fields.to || '________', { bold: true });
      r.drawRichTextBlock([{ text: 'Date of valuation report: ' }, { text: fmtDate(fields.dateOfValuation), bold: true }]);
      r.drawRichTextBlock([{ text: 'Ref: ' }, { text: fields.refNo || '________', bold: true }]);
      r.advanceCursor(6);
      r.drawCenteredTitle(titleText);
      r.advanceCursor(8);

      // ── General Details ──
      r.drawSectionHeader('GENERAL DETAILS');
      r.drawOptionRow('Type of property', ['Residential', 'Commercial', 'Residential cum Commercial', 'Industrial', 'Vacant Plot'], fields.propertyType);
      r.drawSimpleRow('Name of the Customer(s)', `"${fields.ownerName || 'N/A'}"`);
      // Property Address & Landmark — show annexure reference if enabled
      if (fields.annexureEnabled && fields.annexures.length > 0 && !fields.annexureRefShowAlso) {
        // Annexure only — single row pointing to the annexure
        const linkedAnn = fields.annexureRef
          ? fields.annexures.find(a => a.id === fields.annexureRef)
          : (fields.annexures.find(a => a.parsedData) || fields.annexures[0]);
        const annexureTitle = linkedAnn ? (linkedAnn.title || `Annexure ${linkedAnn.label}`) : 'Annexure';
        r.drawSimpleRow('Property Address', `Refer to annexure ${annexureTitle}`);
      } else {
        // No annexure, or annexure + also-show-address: single plain address row
        r.drawSimpleRow('Property Address', getFullAddress());
        r.drawSimpleRow('Landmark', fields.landmark || '');
      }
      const loanAppLabel = fields.loanApplicationType ? `${fields.loanApplicationType} Application number` : 'Application number';
      r.drawSimpleRow(loanAppLabel, fields.loanApplicationNo);
      r.drawSimpleRow('Name of Document holder', fields.documentHolderName || fields.ownerName);

      if (fields.legalAnnexureEnabled && fields.annexures.length > 0 && !fields.legalAnnexureRefShowAlso) {
        // Annexure only — single row pointing to the annexure
        const linkedAnn = fields.legalAnnexureRef
          ? fields.annexures.find(a => a.id === fields.legalAnnexureRef)
          : (fields.annexures.find(a => a.parsedData) || fields.annexures[0]);
        const annexureTitle = linkedAnn ? (linkedAnn.title || `Annexure ${linkedAnn.label}`) : 'Annexure';
        r.drawSimpleRow('Legal address of property ( Hissa No / Survey no / khasra No : - )', `Refer to annexure ${annexureTitle}`);
      } else {
        r.drawSimpleRow('Legal address of property ( Hissa No / Survey no / khasra No : - )', getLegalFullAddress() || '');
      }

      r.drawSimpleRow('Date of Inspection', fmtDate(fields.dateOfInspection));
      r.drawSimpleRow('Date of Valuation Report', fmtDate(fields.dateOfValuation));
      if (fields.clientType === 'organisation') {
        const fullBankText = fields.organisationSubTemplate ? `${fields.bankName || fields.organisationTemplate} (${fields.organisationSubTemplate})` : (fields.bankName || fields.organisationTemplate);
        r.drawSimpleRow('Name of Bank / Institution', fullBankText || 'N/A');
        r.drawSimpleRow('Branch Name', fields.branchName || 'N/A');
      }
      r.advanceCursor(8);

      // ── Surrounding Locality Details ──
      r.drawSectionHeader('SURROUNDING LOCALITY DETAILS');
      r.drawSimpleRow('Ward No / Municipal Land No', fields.wardNo);
      r.drawOptionRow('Vicinity', ['Slum', 'Residential', 'Commercial', 'Mixed', 'Industrial'], fields.vicinity);
      r.drawOptionRow('Locality Type', ['Elite/Posh/High Class', 'Upper Middle Class', 'Middle Class', 'Lower Middle Class'], fields.classOfLocality);
      r.drawOptionRow('Approach Road Width', ['>=60 Feet Road', '60-40 Feet Road', '40-20 Feet Road', '<20 Feet Road'], fields.approachRoadWidth);
      r.drawOptionRow('Plot Demarcated at Site', ['Yes', 'No'], fields.plotDemarcated);
      r.drawProximityRow('Proximity to Civic Amenities',
        ['Nearest Railway Station', 'Nearest Bus Stop', 'Nearest Hospital'],
        [`1. ${fields.railwayStationName || 'Railway Station'}${fields.distanceRailwayStation ? ' — ' + fields.distanceRailwayStation + ' km' : ''}`, `2. ${fields.busStopName || 'Bus Stop'}${fields.distanceBusStop ? ' — ' + fields.distanceBusStop + ' km' : ''}`, `3. ${fields.hospitalName || 'Hospital'}${fields.distanceHospital ? ' — ' + fields.distanceHospital + ' km' : ''}`]
      );
      r.drawOptionRow('Property Identification', ['Easy to Identify', 'Identification by documents', 'Additional documents required', 'Difficult to identify'], fields.propertyIdentification);
      r.drawOptionRow('Proximity to Facilities', ['<1 Km', '1-3 Kms', '3-5 Kms', '>5 Kms'], fields.proximityToFacilities);
      r.drawProximityRow('Landmark Details',
        ['Nearest Railway Station', 'Nearest Bus Stop', 'Nearest Hospital', 'Nearest Landmark'],
        [`1. ${fields.landmarkRailway || 'N/A'}`, `2. ${fields.landmarkBusStop || 'N/A'}`, `3. ${fields.landmarkHospital || 'N/A'}`, `4. ${fields.landmarkNearest || fields.landmark || 'N/A'}`]
      );
      r.advanceCursor(8);

      // ── Property Details ──
      r.drawSectionHeader('PROPERTY DETAILS');
      r.drawSimpleRow('Type of Usage of Entire Property', fields.usageType);
      r.drawSimpleRow('Additional Amenities', fields.additionalAmenities || 'N/A');
      r.drawOptionRow('Legal Status of Property', ['Freehold', 'Lease hold >30 yrs.', 'Lease hold 15-30 yrs.', 'Lease hold <15 yrs.'], fields.legalStatus);
      r.advanceCursor(8);

      // ── Subject Property Details ──
      r.drawSectionHeader('SUBJECT PROPERTY DETAILS');
      r.drawSimpleRow('Type of Premises', fields.premisesType);
      r.drawSimpleRow('Occupied by / Vacant', fields.occupiedBy);
      r.drawSimpleRow('Is Property Rented', fields.isPropertyRented);
      r.drawSimpleRow('If Rented, List of Occupants', fields.rentedOccupants);
      r.drawOptionRow('Property Taxation / Maintenance', ['Low', 'Average', 'High', 'Very High'], fields.propertyTaxation);
      r.drawSimpleRow('Boundary (As per Sketch Map)', `N: ${fields.boundaryNorth || '-'}  |  E: ${fields.boundaryEast || '-'}  |  S: ${fields.boundarySouth || '-'}  |  W: ${fields.boundaryWest || '-'}`);
      r.drawSimpleRow('Boundary (At Site)', `N: ${fields.buildingBoundaryNorth || '-'}  |  E: ${fields.buildingBoundaryEast || '-'}  |  S: ${fields.buildingBoundarySouth || '-'}  |  W: ${fields.buildingBoundaryWest || '-'}`);
      r.advanceCursor(8);

      // ── Structural Details ──
      r.drawSectionHeader('STRUCTURAL DETAILS');
      r.drawOptionRow('Type of Structure', ['RCC', 'Load Bearing', 'Steel Structure', 'Composite Structure', 'Industrial Shed', 'A/C Sheet', 'G/I Sheet', 'Asbestos Roofing'], fields.structureType);
      r.drawSimpleRow('No. of Floors', fields.numberOfFloors);
      r.drawSimpleRow('No. of Wings', fields.numberOfWings);
      r.drawSimpleRow('No. of Units on Each Floor', fields.unitsPerFloor);
      r.drawSimpleRow('Internal Composition', fields.internalComposition);
      r.drawSimpleRow('No. of Lifts', fields.numberOfLifts);
      r.drawAgeOptionRow('Age of Property', ['1-10 years', '11-25 years', '26-50 years', '>50 years'], fields.ageOfProperty, fields.ageOfPropertyActual);
      r.drawSimpleRow('Estimated Future Life', fields.estimatedFutureLife);
      r.drawSimpleRow('Exteriors', fields.exteriors);
      r.drawOptionRow('Quality of Construction', ['Very Good', 'Good', 'Average', 'Poor'], fields.qualityOfConstruction);
      r.drawSimpleRow('Common Areas Remarks', fields.commonAreasRemarks);
      r.drawSimpleRow('Other Observations', fields.otherObservations);
      r.drawSimpleRow('Flooring & Finishing', fields.flooringType);
      r.drawSimpleRow('Roofing & Terracing', fields.roofType);
      r.drawSimpleRow('Quality of Fixtures', fields.qualityOfFixtures);
      r.advanceCursor(8);

      // ── Plan Approvals ──
      r.drawSectionHeader('PLAN APPROVALS');
      r.drawOptionRow('Construction as per Approved Plans', ['Yes', 'No'], fields.constructionApproved);
      r.drawSimpleRow('Details of Approved Plan', fields.approvalDetails);
      r.drawSimpleRow('Construction Permission No. & Date', fields.constructionPermission || 'Not mentioned');
      r.drawSimpleRow('Violations / Risk of Demolition', fields.violationsObserved);
      r.drawSimpleRow('Conforms to Local Byelaws', fields.conformsToByelaws);
      r.drawSimpleRow('Other Documents Verified', fields.documentsVerified);
      r.advanceCursor(8);

      // ── Land Valuation (skip for Apartment/Flat) ──
      if (!isApartmentFlat) {
        r.drawSectionHeader('VALUATION \u2014 Land');
        r.drawSimpleRow('Land Area', `${fields.landArea || '0'} ${fields.landAreaUnit}`);
        r.drawSimpleRow('Current Govt. Approved Rates for Land', `Rs.${fields.govtLandRate || fields.guidelineValue || 'N/A'}/- Per ${fields.landAreaUnit}`);
        r.drawSimpleRow('Recommended Rate & Basis', `Rs.${fields.landRatePerUnit || 'N/A'}/- Per ${fields.landAreaUnit} ${fields.recommendedRateBasis ? '(' + fields.recommendedRateBasis + ')' : ''}`);
        r.drawSimpleRow('Land Value', `${fields.landArea || '0'} ${fields.landAreaUnit} \u00D7 Rs.${fields.landRatePerUnit || '0'}/- = Rs.${formatIndianCurrency(landValue)}/-`);
        r.drawSimpleRow('Actual BUA of Premises', `${formatIndianCurrency(totalPlinthArea)} ${fields.floorAreaUnit || 'Sqft'}`);
        if (fields.buaAsPerApprovals) r.drawSimpleRow('BUA as per Approvals', fields.buaAsPerApprovals);
        r.advanceCursor(8);
      }

      // ── Building / Apartment Valuation Table ──
      r.drawCenteredTitle(isApartmentFlat ? 'VALUATION OF APARTMENT/FLAT (After Depreciation)' : 'VALUATION OF BUILDING (After Depreciation)');
      r.advanceCursor(4);
      const unit = fields.floorAreaUnit || fields.landAreaUnit || 'Sqft';
      r.drawFloorTable(
        ['Floor', `Area (${unit})`, `Rate (Rs./${unit})`, 'Estimated (Rs.)', 'Life (Yr)', 'Age (Yr)', 'Dep%', 'Net Value (Rs.)'],
        floorValuations.map(f => ({
          name: f.name,
          area: formatIndianCurrency(f.area),
          rate: `Rs.${formatIndianCurrency(f.rate)}`,
          estimated: `Rs.${formatIndianCurrency(f.estimated)}`,
          life: String(f.lifeYears),
          age: String(f.ageYears),
          dep: `${f.depPct}%`,
          netValue: `Rs.${formatIndianCurrency(f.netValue)}`,
        })),
        'Total Building Value',
        `Rs.${formatIndianCurrency(totalBuildingValue)}`,
      );
      r.advanceCursor(8);

      // ── Abstract of Valuation ──
      r.drawSectionHeader('ABSTRACT OF VALUATION');
      r.drawSimpleRow(
        isApartmentFlat ? 'Market Value (Apartment/Flat)' : 'Market Value (Land + Building)',
        `Rs.${formatIndianCurrency(totalPropertyValue)}/- (${rupeesInWords(totalPropertyValue)})`
      );
      r.drawSimpleRow(`Realizable Value (${fields.realizablePct || '90'}%)`, `Rs.${formatIndianCurrency(realizableValue)}/-`);
      r.drawSimpleRow(`Forced Sale / Distress Value (${fields.distressPct || '80'}%)`, `Rs.${formatIndianCurrency(distressValue)}/- (${rupeesInWords(distressValue)})`);
      r.drawOptionRow('Marketability', ['Excellent', 'Very Good', 'Good', 'Difficult'], fields.marketability);
      r.drawOptionRow('Valuation Result', ['Positive', 'Negative'], fields.valuationResult);
      r.drawSimpleRow('Replacement Cost / Insurance Value', fields.replacementCost ? `Rs.${formatIndianCurrency(fields.replacementCost)}/-` : 'N/A');
      r.drawSimpleRow('Deviations in Property', fields.deviations);
      if (fields.guidelineValue) r.drawSimpleRow('Govt./Guideline Value', `Rs.${formatIndianCurrency(fields.guidelineValue)}/-`);
      r.advanceCursor(8);

      // ── Remarks ──
      r.drawSectionHeader('REMARKS, DEMARCATION & POSSESSION');
      r.drawSimpleRow('Demarcation', fields.demarcation);
      r.drawSimpleRow('Possession', fields.possession);
      r.drawSimpleRow('Remarks / Observations', fields.remarks);
      r.advanceCursor(8);

      // ── Declaration ──
      r.drawTextBlock('Declaration:', { bold: true, fontSize: 14 });
      r.advanceCursor(2);
      r.drawTextBlock('I hereby declare that:');
      r.advanceCursor(2);
      r.drawTextBlock(`\u2022 I have deputed my representative ${fields.representativeName ? 'Mr. ' + fields.representativeName : '______'}${fields.representativeFatherName ? ', S/o: ' + fields.representativeFatherName : ''} to inspect the property on ${fmtDate(fields.dateOfInspection)}.`);
      r.drawTextBlock('\u2022 I have no direct or indirect interest in the property valued.');
      r.drawTextBlock('\u2022 The information furnished is true and correct to the best of my knowledge and belief.');
      r.advanceCursor(10);

      // ── Valuation Certificate ──
      r.checkPageBreak(200);
      r.drawCenteredTitle('VALUATION CERTIFICATE', undefined, true);
      r.advanceCursor(6);
      r.drawCertificateBox([
        {
          segments: [
            { text: 'This is to certify that the undersigned has personally inspected the property belonging to ' },
            { text: fields.ownerName, bold: true },
            { text: ' situated at ' },
            { text: fields.annexureEnabled && fields.annexures.length > 0 ? `address as provided in Annexure ${(fields.annexures.find(a => a.parsedData) || fields.annexures[0]).label}` : getFullAddress(), bold: true },
            { text: ' on ' },
            { text: fmtDate(fields.dateOfInspection), bold: true },
            { text: ' and after careful examination and consideration of all relevant factors, the Fair Market Value of the said property is assessed as under:' },
          ],
        },
        { segments: [{ text: `Fair Market Value: Rs. ${formatIndianCurrency(totalPropertyValue)} (${rupeesInWords(totalPropertyValue)})`, bold: true }] },
        { segments: [{ text: `Realizable Value (${fields.realizablePct || '90'}%): Rs. ${formatIndianCurrency(realizableValue)} (${rupeesInWords(realizableValue)})`, bold: true }] },
        { segments: [{ text: `Distress Sale Value (${fields.distressPct || '80'}%): Rs. ${formatIndianCurrency(distressValue)} (${rupeesInWords(distressValue)})`, bold: true }] },
      ]);

      // ── Signature ──
      r.drawSignatureBlock([
        { text: '_______________________________' },
        { text: 'Satyajit Mohanty', bold: true, fontSize: 14 },
        { text: 'B.E.(Civil), M.Tech (Structural)', italic: true },
        { text: 'Registered Valuer \u2014 IBBI/RV/02/2019/10594', italic: true },
        { text: 'S Mohanty & Associates, Bhubaneswar', italic: true },
      ]);

      // ── Property Photographs ──
      if (propImageBytes.length > 0) {
        r.newPage();
        r.drawCenteredTitle('PROPERTY PHOTOGRAPHS');
        r.advanceCursor(8);

        for (let i = 0; i < propImageBytes.length; i += 2) {
          const caption1 = fields.propertyImageNames?.[i] !== undefined
            ? fields.propertyImageNames[i]
            : 'Site Picture';
          const img2 = i + 1 < propImageBytes.length ? propImageBytes[i + 1] : null;
          const caption2 = (i + 1 < propImageBytes.length)
            ? (fields.propertyImageNames?.[i + 1] !== undefined ? fields.propertyImageNames[i + 1] : 'Site Picture')
            : '';

          await r.drawImagePair(propImageBytes[i], caption1, img2, caption2);
          r.advanceCursor(4);
        }
      }

      // ── Sketch Map ──
      if (sketchBytesList && sketchBytesList.length > 0) {
        for (let i = 0; i < sketchBytesList.length; i++) {
          const sBytes = sketchBytesList[i];
          if (sBytes) {
            r.newPage();
            r.drawCenteredTitle(`SKETCH MAP${sketchBytesList.length > 1 ? ` ${i + 1}` : ''}`);
            r.advanceCursor(8);
            await r.drawImageBlock(sBytes, {
              maxWidth: 450, maxHeight: 500, centered: true,
            });
          }
        }
      }

      // ── Location Map ──
      if (locationBytes && locationBytes.length > 0) {
        r.newPage();
        r.drawCenteredTitle('LOCATION MAP');
        r.advanceCursor(8);
        await r.drawImageBlock(locationBytes, {
          maxWidth: 450, maxHeight: 500, centered: true,
        });
        if (fields.latitude || fields.longitude) {
          r.drawTextBlock(`Lat: ${fields.latitude || 'N/A'}, Long: ${fields.longitude || 'N/A'}`, { bold: true, align: 'center' });
        }
      }
      // ── Annexure Sections ──
      if (fields.annexures && fields.annexures.length > 0) {
        for (const annexure of fields.annexures) {
          if (annexure.parsedData && annexure.parsedData.headers.length > 0) {
            r.newPage();
            r.drawCenteredTitle(annexure.title ? `ANNEXURE ${annexure.label} - ${annexure.title.toUpperCase()}` : `ANNEXURE ${annexure.label}`);
            r.advanceCursor(8);
            // Use merged-cell renderer when full data available, fall back to flat table
            if (annexure.parsedData.allRows && annexure.parsedData.merges && annexure.parsedData.colWidths) {
              r.drawMergedTable(
                annexure.parsedData.allRows,
                annexure.parsedData.merges,
                annexure.parsedData.colWidths,
              );
            } else {
              r.drawDataTable(annexure.parsedData.headers, annexure.parsedData.rows);
            }
          }
        }
      }

      // ── Generate PDF blob ──
      return await r.toBlob();
    } catch (err) {
      console.error('PDF generation failed:', err);
      throw err;
    }
  };

  const handlePreviewPDF = async () => {
    // Open a blank tab synchronously in the click handler to bypass browser pop-up blockers
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
      const blob = await handleGeneratePDF();
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

  const handleDownloadPDF = async () => {
    setMessage({ type: 'success', text: 'Generating PDF for download...' });
    try {
      const blob = await handleGeneratePDF();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fields.ownerName ? fields.ownerName.replace(/\s+/g, '_') : 'Valuation'}_Report_${projectId}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      }
      setMessage(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    }
  };

  const handleFinalize = async () => {
    if (!Array.isArray(fields.propertyImages) || fields.propertyImages.length < 2) {
      setMessage({ type: 'error', text: 'Please upload at least 2 property photographs before finalizing.' });
      return;
    }
    if (!confirm('Finalize this report and share it with the client? This will generate the official PDF and delete temporary draft images.')) return;
    setLoading(true);
    setMessage({ type: 'success', text: 'Generating final PDF...' });
    try {
      await saveReportDraft(projectId, fields);
      const pdfBlob = await handleGeneratePDF();
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
          else { setFields(finalFields); setMessage({ type: 'success', text: 'Project Finalized Successfully! PDF is now available to the client.' }); }
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

  const handleReworkClick = () => {
    setShowReworkModal(true);
  };

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

  // ── PDF Content Blocks (dynamically paginated) ──
  function generatePDFBlocks(): string[] {
    const ff = "'Times New Roman', serif";
    const ts = `width:100%;border-collapse:collapse;font-family:${ff};`;
    const cellBorder = '1px solid #000';
    const cellPad = '4px 6px 4px 6px';
    const lblBg = 'rgba(219, 230, 240, 0.45)';
    const optLblBg = 'rgba(221, 233, 246, 0.45)';

    // ── Row helpers ──
    // Simple inline row: full-width "Label: - Value"
    const simpleRow = (label: string, val: string) => {
      return `<tr><td colspan="3" style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">${label}: - <b>${val || 'N/A'}</b></td></tr>`;
    };

    // Option row: 3 columns — Label | Options list | Selected value
    const optionRow = (label: string, opts: string[], val: string) => {
      const n = opts.length;
      const innerDivs = opts.map((o, i) =>
        `<div style="border-bottom:${i === n - 1 ? 'none' : '1px solid #000'};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;background:${optLblBg};word-break:break-word;word-wrap:break-word;overflow:visible;">${o}</div>`
      ).join('');
      return `<tr>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;background:${lblBg};line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="28%">${label}</td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="35%">${innerDivs}</td>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;text-align:center;background:${optLblBg};line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="37%">${val || 'N/A'}</td>
      </tr>`;
    };

    // Age option row: 3 columns — Label | Options list (selected range is bolded) | Actual age value
    const ageOptionRow = (label: string, opts: string[], selectedOpt: string, actualVal: string) => {
      const n = opts.length;
      const innerDivs = opts.map((o, i) => {
        const isSelected = o === selectedOpt;
        const fontStyle = isSelected ? 'font-weight:bold;' : '';
        return `<div style="border-bottom:${i === n - 1 ? 'none' : '1px solid #000'};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;background:${optLblBg};word-break:break-word;word-wrap:break-word;overflow:visible;${fontStyle}">${o}</div>`;
      }).join('');
      return `<tr>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;background:${lblBg};line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="28%">${label}</td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="35%">${innerDivs}</td>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;text-align:center;background:${optLblBg};line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="37%">${actualVal || 'N/A'}</td>
      </tr>`;
    };

    // Section header row
    const sectionHeader = (title: string) => {
      return `<tr><td colspan="3" style="border:${cellBorder};padding:4px 8px 4px 8px;font-family:${ff};font-size:14pt;font-weight:bold;background:${lblBg};vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">${title}</td></tr>`;
    };

    // Wrap rows in a table
    const wrapTable = (rows: string) => `<table style="${ts};margin-bottom:10px;">${rows}</table>`;

    // ═══════════════════════════════════════════════════════════════════
    // Build content blocks — each block is an independently measurable chunk
    // ═══════════════════════════════════════════════════════════════════
    const allBlocks: string[] = [];

    let titleText = '• &nbsp;VALUATION REPORT';

    // ── BLOCK: "To" block + Title (always page 1 start) ──
    allBlocks.push(`<div style="font-family:${ff};font-size:12pt;margin-bottom:10px;line-height:0.5em;">
      <p style="margin:0;"><b>To</b></p>
      <p style="margin:0;"><b>${fields.to || '________'}</b></p>
      <p style="margin:0;">Date of valuation report: <b>${fields.dateOfValuation ? (() => { const t = fields.dateOfValuation.trim(); if (/^\\d{4}-\\d{2}-\\d{2}$/.test(t)) { const [y,m,d] = t.split('-'); return d+'/'+m+'/'+y; } return t; })() : '________'}</b></p>
      <p style="margin:0;">Ref: <b>${fields.refNo || '________'}</b></p>
    </div>
    <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin:6px 0 12px;">${titleText}</p>`);

    // ── BLOCK: General Details ──
    const loanAppLabel = fields.loanApplicationType ? `${fields.loanApplicationType} Application number` : 'Application number';
    allBlocks.push(wrapTable(`
      ${sectionHeader('GENERAL DETAILS')}
      ${optionRow('Type of property', ['Residential', 'Commercial', 'Residential cum Commercial', 'Industrial', 'Vacant Plot'], fields.propertyType)}
      ${simpleRow('Name of the Customer(s)', `"${fields.ownerName || 'N/A'}"`)}
      ${fields.annexureEnabled && fields.annexures.length > 0 && !fields.annexureRefShowAlso
        ? (() => {
            const linkedAnn = fields.annexureRef
              ? fields.annexures.find(a => a.id === fields.annexureRef)
              : (fields.annexures.find(a => a.parsedData) || fields.annexures[0]);
            const annexureTitle = linkedAnn ? (linkedAnn.title || `Annexure ${linkedAnn.label}`) : 'Annexure';
            return simpleRow('Property Address', `Refer to annexure ${annexureTitle}`);
          })()
        : `${simpleRow('Property Address', getFullAddress())}
           ${simpleRow('Landmark', fields.landmark || '')}`
      }
      ${simpleRow(loanAppLabel, fields.loanApplicationNo)}
      ${simpleRow('Name of Document holder', fields.documentHolderName || fields.ownerName)}
      ${simpleRow('Date of Inspection', fmtDate(fields.dateOfInspection))}
      ${simpleRow('Date of Valuation Report', fmtDate(fields.dateOfValuation))}
      ${fields.clientType === 'organisation'
        ? `${simpleRow('Name of Bank / Institution', fields.organisationSubTemplate ? `${fields.bankName || fields.organisationTemplate || 'N/A'} (${fields.organisationSubTemplate})` : (fields.bankName || fields.organisationTemplate || 'N/A'))}
           ${simpleRow('Branch Name', fields.branchName || 'N/A')}`
        : ''
      }
    `));

    // ── BLOCK: Surrounding Locality Details ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('SURROUNDING LOCALITY DETAILS')}
      ${simpleRow('Ward No / Municipal Land No', fields.wardNo)}
      ${optionRow('Vicinity', ['Slum', 'Residential', 'Commercial', 'Mixed', 'Industrial'], fields.vicinity)}
      ${optionRow('Locality Type', ['Elite/Posh/High Class', 'Upper Middle Class', 'Middle Class', 'Lower Middle Class'], fields.classOfLocality)}
      ${optionRow('Approach Road Width', ['>=60 Feet Road', '60-40 Feet Road', '40-20 Feet Road', '<20 Feet Road'], fields.approachRoadWidth)}
      ${optionRow('Plot Demarcated at Site', ['Yes', 'No'], fields.plotDemarcated)}
      <tr>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;background:${lblBg};line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="28%">Proximity to Civic Amenities</td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="35%">
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Railway Station</div>
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Bus Stop</div>
          <div style="padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Hospital</div>
        </td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="37%">
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">1. ${fields.railwayStationName || 'Railway Station'}${fields.distanceRailwayStation ? ' — ' + fields.distanceRailwayStation + ' km' : ''}</div>
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">2. ${fields.busStopName || 'Bus Stop'}${fields.distanceBusStop ? ' — ' + fields.distanceBusStop + ' km' : ''}</div>
          <div style="padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">3. ${fields.hospitalName || 'Hospital'}${fields.distanceHospital ? ' — ' + fields.distanceHospital + ' km' : ''}</div>
        </td>
      </tr>
      ${optionRow('Property Identification', ['Easy to Identify', 'Identification by documents', 'Additional documents required', 'Difficult to identify'], fields.propertyIdentification)}
      ${optionRow('Proximity to Facilities', ['<1 Km', '1-3 Kms', '3-5 Kms', '>5 Kms'], fields.proximityToFacilities)}
      <tr>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;background:${lblBg};line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="28%">Landmark Details</td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="35%">
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Railway Station</div>
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Bus Stop</div>
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Hospital</div>
          <div style="padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Landmark</div>
        </td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="37%">
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">1. ${fields.landmarkRailway || 'N/A'}</div>
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">2. ${fields.landmarkBusStop || 'N/A'}</div>
          <div style="border-bottom:1px solid #000;padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">3. ${fields.landmarkHospital || 'N/A'}</div>
          <div style="padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;line-height:0.5em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">4. ${fields.landmarkNearest || fields.landmark || 'N/A'}</div>
        </td>
      </tr>
    `));

    // ── BLOCK: Property Details ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('PROPERTY DETAILS')}
      ${simpleRow('Type of Usage of Entire Property', fields.usageType)}
      ${simpleRow('Additional Amenities', fields.additionalAmenities || 'N/A')}
      ${optionRow('Legal Status of Property', ['Freehold', 'Lease hold >30 yrs.', 'Lease hold 15-30 yrs.', 'Lease hold <15 yrs.'], fields.legalStatus)}
    `));

    // ── BLOCK: Subject Property Details ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('SUBJECT PROPERTY DETAILS')}
      ${simpleRow('Type of Premises', fields.premisesType)}
      ${simpleRow('Occupied by / Vacant', fields.occupiedBy)}
      ${simpleRow('Is Property Rented', fields.isPropertyRented)}
      ${simpleRow('If Rented, List of Occupants', fields.rentedOccupants)}
      ${optionRow('Property Taxation / Maintenance', ['Low', 'Average', 'High', 'Very High'], fields.propertyTaxation)}
      ${simpleRow('Boundary (As per Sketch Map)', `N: ${fields.boundaryNorth || '-'} &nbsp;|&nbsp; E: ${fields.boundaryEast || '-'} &nbsp;|&nbsp; S: ${fields.boundarySouth || '-'} &nbsp;|&nbsp; W: ${fields.boundaryWest || '-'}`)}
      ${simpleRow('Boundary (At Site)', `N: ${fields.buildingBoundaryNorth || '-'} &nbsp;|&nbsp; E: ${fields.buildingBoundaryEast || '-'} &nbsp;|&nbsp; S: ${fields.buildingBoundarySouth || '-'} &nbsp;|&nbsp; W: ${fields.buildingBoundaryWest || '-'}`)}
    `));

    // ── BLOCK: Structural Details ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('STRUCTURAL DETAILS')}
      ${optionRow('Type of Structure', ['RCC', 'Load Bearing', 'Steel Structure', 'Composite Structure', 'Industrial Shed', 'A/C Sheet', 'G/I Sheet', 'Asbestos Roofing'], fields.structureType)}
      ${simpleRow('No. of Floors', fields.numberOfFloors)}
      ${simpleRow('No. of Wings', fields.numberOfWings)}
      ${simpleRow('No. of Units on Each Floor', fields.unitsPerFloor)}
      ${simpleRow('Internal Composition', fields.internalComposition)}
      ${simpleRow('No. of Lifts', fields.numberOfLifts)}
      ${ageOptionRow('Age of Property', ['1-10 years', '11-25 years', '26-50 years', '>50 years'], fields.ageOfProperty, fields.ageOfPropertyActual)}
      ${simpleRow('Estimated Future Life', fields.estimatedFutureLife)}
      ${simpleRow('Exteriors', fields.exteriors)}
      ${optionRow('Quality of Construction', ['Very Good', 'Good', 'Average', 'Poor'], fields.qualityOfConstruction)}
      ${simpleRow('Common Areas Remarks', fields.commonAreasRemarks)}
      ${simpleRow('Other Observations', fields.otherObservations)}
      ${simpleRow('Flooring &amp; Finishing', fields.flooringType)}
      ${simpleRow('Roofing &amp; Terracing', fields.roofType)}
      ${simpleRow('Quality of Fixtures', fields.qualityOfFixtures)}
    `));

    // ── BLOCK: Plan Approvals ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('PLAN APPROVALS')}
      ${optionRow('Construction as per Approved Plans', ['Yes', 'No'], fields.constructionApproved)}
      ${simpleRow('Details of Approved Plan', fields.approvalDetails)}
      ${simpleRow('Construction Permission No. &amp; Date', fields.constructionPermission || 'Not mentioned')}
      ${simpleRow('Violations / Risk of Demolition', fields.violationsObserved)}
      ${simpleRow('Conforms to Local Byelaws', fields.conformsToByelaws)}
      ${simpleRow('Other Documents Verified', fields.documentsVerified)}
    `));

    // ── BLOCK: Land Valuation (skip for Apartment/Flat) ──
    if (!isApartmentFlat) {
      allBlocks.push(wrapTable(`
        ${sectionHeader('VALUATION \u2014 Land')}
        ${simpleRow('Land Area', `${fields.landArea || '0'} ${fields.landAreaUnit}`)}
        ${simpleRow('Current Govt. Approved Rates for Land', `Rs.${fields.govtLandRate || fields.guidelineValue || 'N/A'}/- Per ${fields.landAreaUnit}`)}
        ${simpleRow('Recommended Rate &amp; Basis', `Rs.${fields.landRatePerUnit || 'N/A'}/- Per ${fields.landAreaUnit} ${fields.recommendedRateBasis ? '(' + fields.recommendedRateBasis + ')' : ''}`)}
        ${simpleRow('Land Value', `${fields.landArea || '0'} ${fields.landAreaUnit} \u00D7 Rs.${fields.landRatePerUnit || '0'}/- = Rs.${formatIndianCurrency(landValue)}/-`)}
        ${simpleRow('Actual BUA of Premises', `${formatIndianCurrency(totalPlinthArea)} ${fields.floorAreaUnit || 'Sqft'}`)}
        ${fields.buaAsPerApprovals ? simpleRow('BUA as per Approvals', fields.buaAsPerApprovals) : ''}
      `));
    }

    // ── BLOCK: Building Valuation ──
    const floorRowsHTML = floorValuations.map((f, idx) => {
      const bg = idx % 2 === 0 ? '#FFF' : '#F5F5F5';
      return `<tr style="background:${bg};">
        <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">${f.name}</td>
        <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;text-align:right;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">${formatIndianCurrency(f.area)}</td>
        <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;text-align:right;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">\u20B9${formatIndianCurrency(f.rate)}</td>
        <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;text-align:right;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">\u20B9${formatIndianCurrency(f.estimated)}</td>
        <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;text-align:center;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">${f.lifeYears}</td>
        <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;text-align:center;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">${f.ageYears}</td>
        <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;text-align:center;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">${f.depPct}%</td>
        <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;text-align:right;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">\u20B9${formatIndianCurrency(f.netValue)}</td>
      </tr>`;
    }).join('');

    allBlocks.push(`
      <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin:8px 0 6px;">${isApartmentFlat ? 'VALUATION OF APARTMENT/FLAT (After Depreciation)' : 'VALUATION OF BUILDING (After Depreciation)'}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-family:${ff};font-size:12pt;">
        <tr style="background:#000;">
          <th style="border:${cellBorder};padding:4px 6px 4px 6px;color:#FFF;font-weight:bold;text-align:center;font-family:${ff};vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">Floor</th>
          <th style="border:${cellBorder};padding:4px 6px 4px 6px;color:#FFF;font-weight:bold;text-align:right;font-family:${ff};vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">Area</th>
          <th style="border:${cellBorder};padding:4px 6px 4px 6px;color:#FFF;font-weight:bold;text-align:right;font-family:${ff};vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">Rate (\u20B9)</th>
          <th style="border:${cellBorder};padding:4px 6px 4px 6px;color:#FFF;font-weight:bold;text-align:right;font-family:${ff};vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">Estimated (\u20B9)</th>
          <th style="border:${cellBorder};padding:4px 6px 4px 6px;color:#FFF;font-weight:bold;text-align:center;font-family:${ff};vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">Life</th>
          <th style="border:${cellBorder};padding:4px 6px 4px 6px;color:#FFF;font-weight:bold;text-align:center;font-family:${ff};vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">Age</th>
          <th style="border:${cellBorder};padding:4px 6px 4px 6px;color:#FFF;font-weight:bold;text-align:center;font-family:${ff};vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">Dep%</th>
          <th style="border:${cellBorder};padding:4px 6px 4px 6px;color:#FFF;font-weight:bold;text-align:right;font-family:${ff};vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;">Net Value (\u20B9)</th>
        </tr>
        ${floorRowsHTML}
        <tr style="font-weight:bold;">
          <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;" colspan="7"><b>Total Building Value</b></td>
          <td style="border:${cellBorder};padding:4px 6px 4px 6px;font-family:${ff};font-size:12pt;text-align:right;vertical-align:middle;line-height:0.5em;word-break:break-word;word-wrap:break-word;overflow:visible;"><b>\u20B9${formatIndianCurrency(totalBuildingValue)}</b></td>
        </tr>
      </table>
    `);

    // ── BLOCK: Abstract of Valuation ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('ABSTRACT OF VALUATION')}
      ${simpleRow(isApartmentFlat ? 'Market Value (Apartment/Flat)' : 'Market Value (Land + Building)', `Rs.${formatIndianCurrency(totalPropertyValue)}/- (${rupeesInWords(totalPropertyValue)})`)}
      ${simpleRow(`Realizable Value (${fields.realizablePct || '90'}%)`, `Rs.${formatIndianCurrency(realizableValue)}/-`)}
      ${simpleRow(`Forced Sale / Distress Value (${fields.distressPct || '80'}%)`, `Rs.${formatIndianCurrency(distressValue)}/- (${rupeesInWords(distressValue)})`)}
      ${optionRow('Marketability', ['Excellent', 'Very Good', 'Good', 'Difficult'], fields.marketability)}
      ${optionRow('Valuation Result', ['Positive', 'Negative'], fields.valuationResult)}
      ${simpleRow('Replacement Cost / Insurance Value', fields.replacementCost ? `Rs.${formatIndianCurrency(fields.replacementCost)}/-` : 'N/A')}
      ${simpleRow('Deviations in Property', fields.deviations)}
      ${fields.guidelineValue ? simpleRow('Govt./Guideline Value', `Rs.${formatIndianCurrency(fields.guidelineValue)}/-`) : ''}
    `));

    // ── BLOCK: Remarks, Demarcation & Possession ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('REMARKS, DEMARCATION & POSSESSION')}
      ${simpleRow('Demarcation', fields.demarcation)}
      ${simpleRow('Possession', fields.possession)}
      ${simpleRow('Remarks / Observations', fields.remarks)}
    `));

    // ── BLOCK: Declaration ──
    allBlocks.push(`<div style="margin-top:10px;font-family:${ff};font-size:12pt;line-height:0.5em;">
      <p style="font-weight:bold;font-size:14pt;margin-bottom:4px;">Declaration:</p>
      <p style="margin-bottom:3px;">I hereby declare that:</p>
      <p style="margin-bottom:3px;">\u2022 I have deputed my representative <b>${fields.representativeName ? 'Mr. ' + fields.representativeName : '______'}${fields.representativeFatherName ? ', S/o: ' + fields.representativeFatherName : ''}</b> to inspect the property on <b>${fmtDate(fields.dateOfInspection) || '______'}</b>.</p>
      <p style="margin-bottom:3px;">\u2022 I have no direct or indirect interest in the property valued.</p>
      <p style="margin-bottom:3px;">\u2022 The information furnished is true and correct to the best of my knowledge and belief.</p>
    </div>`);

    // ── BLOCK: Valuation Certificate + Signature ──
    allBlocks.push(`
      <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin:14px 0 8px;">VALUATION CERTIFICATE</p>
      <div style="border:1.5px solid #000;padding:12px;font-family:${ff};font-size:12pt;line-height:0.5em;">
        <p style="margin-top:0;">This is to certify that the undersigned has personally inspected the property belonging to
        <b>${fields.ownerName}</b> situated at <b>${fields.annexureEnabled && fields.annexures.length > 0 ? `address as provided in Annexure ${(fields.annexures.find(a => a.parsedData) || fields.annexures[0]).label}` : (getFullAddress() || '________')}</b> on
        <b>${fmtDate(fields.dateOfInspection)}</b> and after careful examination and consideration of all relevant factors,
        the Fair Market Value of the said property is assessed as under:</p>
        <p style="padding:4px 0;margin:4px 0;"><b>Fair Market Value: \u20B9 ${formatIndianCurrency(totalPropertyValue)} (${rupeesInWords(totalPropertyValue)})</b></p>
        <p style="padding:4px 0;margin:2px 0;"><b>Realizable Value (${fields.realizablePct || '90'}%): \u20B9 ${formatIndianCurrency(realizableValue)} (${rupeesInWords(realizableValue)})</b></p>
        <p style="padding:4px 0;margin:2px 0;"><b>Distress Sale Value (${fields.distressPct || '80'}%): \u20B9 ${formatIndianCurrency(distressValue)} (${rupeesInWords(distressValue)})</b></p>
      </div>
      <div style="margin-top:28px;text-align:right;font-family:${ff};font-size:12pt;line-height:0.5em;">
        <p style="margin:0;">_______________________________</p>
        <p style="font-weight:bold;margin:3px 0;font-size:14pt;">Satyajit Mohanty</p>
        <p style="margin:2px 0;font-style:italic;font-size:12pt;">B.E.(Civil), M.Tech (Structural)</p>
        <p style="margin:2px 0;font-style:italic;font-size:12pt;">Registered Valuer \u2014 IBBI/RV/02/2019/10594</p>
        <p style="margin:2px 0;font-style:italic;font-size:12pt;">S Mohanty &amp; Associates, Bhubaneswar</p>
      </div>
    `);

    // ── BLOCKS: Property Photographs (6 per page) ──
    if (Array.isArray(fields.propertyImages) && fields.propertyImages.length > 0) {
      const IMGS_PER_PAGE = 6;
      const totalImages = fields.propertyImages.length;
      const totalPhotoPages = Math.ceil(totalImages / IMGS_PER_PAGE);

      for (let pg = 0; pg < totalPhotoPages; pg++) {
        const startIdx = pg * IMGS_PER_PAGE;
        const pageImages = fields.propertyImages.slice(startIdx, startIdx + IMGS_PER_PAGE);
        const imgCount = pageImages.length;
        const rows = Math.ceil(imgCount / 2);
        const availableH = 680;
        const gapBetweenRows = rows > 1 ? Math.min(16, Math.floor((availableH - rows * 160) / (rows + 1))) : 20;
        const imgH = Math.min(220, Math.max(140, Math.floor((availableH - (rows + 1) * gapBetweenRows - rows * 22) / rows)));

        const title = pg === 0
          ? `<p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin-bottom:${gapBetweenRows}px;">PROPERTY PHOTOGRAPHS</p>`
          : `<p style="font-family:${ff};font-size:12pt;font-weight:bold;text-align:center;margin-bottom:${gapBetweenRows}px;font-style:italic;">Property Photographs (Contd.)</p>`;

        let gridHTML = '';
        for (let r = 0; r < rows; r++) {
          const img1 = pageImages[r * 2];
          const img2 = pageImages[r * 2 + 1];
          const gIdx1 = startIdx + r * 2;
          const gIdx2 = startIdx + r * 2 + 1;
          const caption1 = fields.propertyImageNames?.[gIdx1] !== undefined ? fields.propertyImageNames[gIdx1] : 'Site Picture';
          const caption2 = fields.propertyImageNames?.[gIdx2] !== undefined ? fields.propertyImageNames[gIdx2] : 'Site Picture';

          gridHTML += `<tr>`;
          gridHTML += `<td style="width:50%;padding:${r === 0 ? 0 : gapBetweenRows}px 4px 0 0;vertical-align:top;"><div style="border:1px solid #000;padding:4px;text-align:center;"><img src="${img1}" style="width:100%;height:${imgH}px;object-fit:cover;" crossOrigin="anonymous" /><p style="font-family:${ff};font-size:10pt;margin:4px 0 0;font-style:italic;">${caption1}</p></div></td>`;
          if (img2) {
            gridHTML += `<td style="width:50%;padding:${r === 0 ? 0 : gapBetweenRows}px 0 0 4px;vertical-align:top;"><div style="border:1px solid #000;padding:4px;text-align:center;"><img src="${img2}" style="width:100%;height:${imgH}px;object-fit:cover;" crossOrigin="anonymous" /><p style="font-family:${ff};font-size:10pt;margin:4px 0 0;font-style:italic;">${caption2}</p></div></td>`;
          } else {
            gridHTML += `<td style="width:50%;padding:0;"></td>`;
          }
          gridHTML += `</tr>`;
        }

        allBlocks.push(`<div style="font-family:${ff};color:#000;">
          ${title}
          <table style="width:100%;border-collapse:collapse;">${gridHTML}</table>
        </div>`);
      }
    }

    // ── BLOCK: Sketch Map ──
    // ── BLOCK: Sketch Map ──
    if (fields.sketchMapImages && fields.sketchMapImages.length > 0) {
      fields.sketchMapImages.forEach((imgUrl, idx) => {
        allBlocks.push(`<div style="font-family:${ff};color:#000;">
          <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin-bottom:12px;">SKETCH MAP${fields.sketchMapImages.length > 1 ? ` ${idx + 1}` : ''}</p>
          <div style="text-align:center;border:1px solid #000;padding:6px;">
            <img src="${imgUrl}" style="max-width:100%;max-height:680px;" crossOrigin="anonymous" />
          </div>
          <p style="font-family:${ff};font-size:12pt;font-style:italic;text-align:center;margin-top:4px;">Source: Site Visit dated ${fmtDate(fields.dateOfInspection) || 'N/A'}</p>
        </div>`);
      });
    }

    // ── BLOCK: Location Map ──
    if (fields.locationMapImage) {
      allBlocks.push(`<div style="font-family:${ff};color:#000;">
        <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin-bottom:12px;">LOCATION MAP</p>
        <div style="text-align:center;border:1px solid #000;padding:6px;">
          <img src="${fields.locationMapImage}" style="max-width:100%;max-height:630px;" crossOrigin="anonymous" />
        </div>
        ${fields.latitude || fields.longitude ? `<p style="text-align:center;font-family:${ff};font-size:12pt;margin-top:6px;font-weight:bold;">Lat: ${fields.latitude || 'N/A'}, Long: ${fields.longitude || 'N/A'}</p>` : ''}
        <p style="font-family:${ff};font-size:12pt;font-style:italic;text-align:center;margin-top:2px;">Source: Site Visit dated ${fmtDate(fields.dateOfInspection) || 'N/A'}</p>
      </div>`);
    }

    // ── BLOCKS: Annexure Sections ──
    if ((fields.annexureEnabled || fields.legalAnnexureEnabled) && fields.annexures.length > 0) {
      for (const annexure of fields.annexures) {
        if (annexure.parsedData && annexure.parsedData.headers.length > 0) {
          const numCols = annexure.parsedData.headers.length;
          const isFullWidth = (row: string[]) => row.length > 0 && row[0].trim() !== '' && (row.slice(1).every(c => !c || c.trim() === ''));
          
          let headerCells = '';
          if (isFullWidth(annexure.parsedData.headers)) {
            headerCells = `<th colspan="${numCols}" style="border:1px solid #000;padding:4px 6px;font-family:${ff};font-size:10pt;font-weight:bold;background:${lblBg};text-align:left;">${annexure.parsedData.headers[0]}</th>`;
          } else {
            headerCells = annexure.parsedData.headers.map(h =>
              `<th style="border:1px solid #000;padding:4px 6px;font-family:${ff};font-size:10pt;font-weight:bold;background:${lblBg};text-align:left;">${h}</th>`
            ).join('');
          }

          const dataRows = annexure.parsedData.rows.map(row => {
            if (isFullWidth(row)) {
              return `<tr><td colspan="${numCols}" style="border:1px solid #000;padding:3px 6px;font-family:${ff};font-size:10pt;">${row[0]}</td></tr>`;
            } else {
              return `<tr>${row.map(cell =>
                `<td style="border:1px solid #000;padding:3px 6px;font-family:${ff};font-size:10pt;">${cell}</td>`
              ).join('')}</tr>`;
            }
          }).join('');
          allBlocks.push(`<div style="font-family:${ff};color:#000;">
            <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin-bottom:8px;">ANNEXURE ${annexure.label}${annexure.title ? ` - ${annexure.title.toUpperCase()}` : ''}</p>
            <table style="width:100%;border-collapse:collapse;">
              <thead><tr>${headerCells}</tr></thead>
              <tbody>${dataRows}</tbody>
            </table>
          </div>`);
        }
      }
    }

    return allBlocks;
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-2xl border border-neutral-200 shadow-md">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#b8860b] border-t-transparent"></div>
        <p className="mt-4 text-sm font-bold text-[#0f2038]">{loadingText}</p>
      </div>
    );
  }

  if (wizardStep === 'setup') {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-8 rounded-2xl border border-neutral-200">
        <div className={`${selectingOrg ? 'max-w-5xl' : 'max-w-2xl'} w-full text-center space-y-8 transition-all duration-300`}>
          <div>
            <h2 className="text-3xl font-extrabold text-[#0f2038] tracking-tight">
              Draft New Valuation Report
            </h2>
            <p className="text-[#6c757d] mt-2 text-base">
              Set up the report parameters for Project <span className="font-mono font-bold text-[#b8860b]">{projectCode}</span>
            </p>
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className={`w-2.5 h-2.5 rounded-full ${!fields.clientType ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}`}></span>
              <span className={`w-8 h-[2px] ${fields.clientType ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full ${fields.clientType ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}`}></span>
            </div>
          </div>

          {/* Step 1: Choose client type — only when clientType not yet decided */}
          {!fields.clientType && !selectingOrg && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Individual Card */}
              <button
                type="button"
                onClick={() => handleSelectClientType('individual')}
                className="flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent hover:border-[#b8860b] shadow-lg hover:shadow-xl transition-all duration-300 group text-center w-full"
              >
                <div className="w-16 h-16 rounded-full bg-[#fcf8ee] flex items-center justify-center mb-5 text-[#b8860b] group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0f2038] mb-2">Individual Client</h3>
                <p className="text-sm text-[#6c757d]">
                  Generate a standard valuation report formatted for individual owners and standard purposes.
                </p>
              </button>

              {/* Organisation Card */}
              <button
                type="button"
                onClick={() => handleSelectClientType('organisation')}
                className="flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent hover:border-[#b8860b] shadow-lg hover:shadow-xl transition-all duration-300 group text-center w-full"
              >
                <div className="w-16 h-16 rounded-full bg-[#e8f0f8] flex items-center justify-center mb-5 text-[#0f2038] group-hover:scale-110 transition-transform">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#0f2038] mb-2">Organisation / Bank</h3>
                <p className="text-sm text-[#6c757d]">
                  Select an institutional layout mapped to specific banking and credit organisation requirements.
                </p>
              </button>
            </div>
          )}

          {/* Step 2: Org/bank selector — shown when organisation chosen but no bank yet */}
          {(selectingOrg || (fields.clientType === 'organisation' && !fields.organisationTemplate)) && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#e9ecef] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e9ecef]">
                <h3 className="text-lg font-bold text-[#0f2038]">
                  {showSubList ? `Select Format for ${selectedBank}` : showBankList ? 'Select Bank / Institution' : 'Select Institution Category'}
                </h3>
                <button
                  type="button"
                  onClick={handleWizardBack}
                  className="text-sm text-[#b8860b] hover:text-[#8a6507] font-medium"
                >
                  ← Back
                </button>
              </div>

              {showSubList && selectedBank ? (
                <div className="flex flex-wrap gap-3 max-h-[420px] overflow-y-auto p-3 border border-[#dee2e6] rounded-xl bg-neutral-50/50 justify-center">
                  {BANK_SUB_TEMPLATES[selectedBank]?.map((subOpt) => (
                    <button
                      key={subOpt}
                      type="button"
                      onClick={() => handleSelectSubTemplate(subOpt)}
                      className="flex-1 min-w-[200px] max-w-[280px] p-3 min-h-[84px] rounded-xl border border-[#dee2e6] bg-white hover:border-[#b8860b] hover:bg-[#fffbf0] hover:shadow-md text-center transition-all duration-200 flex items-center justify-center text-xs sm:text-sm font-semibold text-[#0f2038] shadow-sm break-words leading-tight"
                    >
                      <span className="w-full line-clamp-3 hyphens-auto">{subOpt}</span>
                    </button>
                  ))}
                </div>
              ) : showBankList && selectedCategory ? (
                <div className="flex flex-wrap gap-3 max-h-[420px] overflow-y-auto p-3 border border-[#dee2e6] rounded-xl bg-neutral-50/50 justify-center">
                  {INSTITUTE_CATEGORIES.find(c => c.id === selectedCategory)?.list?.map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => handleSelectOrganisation(bank)}
                      className="flex-1 min-w-[200px] max-w-[280px] p-3 min-h-[84px] rounded-xl border border-[#dee2e6] bg-white hover:border-[#b8860b] hover:bg-[#fffbf0] hover:shadow-md text-center transition-all duration-200 flex items-center justify-center text-xs sm:text-sm font-semibold text-[#0f2038] shadow-sm break-words leading-tight"
                    >
                      <span className="w-full line-clamp-3 hyphens-auto">{bank}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-4 justify-center">
                  {INSTITUTE_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => handleCategoryClick(cat.id)}
                      className="flex-1 min-w-[140px] max-w-[180px] p-4 min-h-[100px] rounded-xl border border-[#dee2e6] bg-white hover:border-[#b8860b] hover:bg-[#fffbf0] hover:shadow-md text-center transition-all duration-200 flex flex-col items-center justify-center gap-2 shadow-sm"
                    >
                      <span className="text-2xl">{cat.icon}</span>
                      <span className="text-xs font-bold text-[#0f2038] leading-tight break-words max-w-full">{cat.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Feature flag: AI Assist panel visibility
  const aiAssistEnabled = process.env.NEXT_PUBLIC_AI_ASSIST_ENABLED === 'true';

  return (
    <div className={`flex ${aiAssistEnabled ? 'gap-4' : 'gap-6'} items-start w-full`} ref={reportRef}>
      {/* ── Main Form Column ── */}
      <div className="flex-1 min-w-0 space-y-4">
      {/* Template Info Banner */}
      {fields.clientType === 'organisation' && !['INCOME_TAX', 'IBBI_IVS'].includes(fields.organisationTemplate || '') ? (
        <ActiveConfigBanner
          bankName={fields.organisationTemplate || ''}
          formatName={fields.organisationSubTemplate || undefined}
          category={fields.institutionCategory || undefined}
          serviceType={SERVICES_LIST.find(s => s.id === fields.serviceType)?.title || fields.serviceType}
          subjectType={fields.subjectType}
          onResetWizard={onResetWizard}
        />
      ) : (
      <div className="p-4 bg-white border border-[#dee2e6] flex flex-row items-center justify-between gap-4 shadow-md rounded-2xl sticky top-2 z-50">
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight min-w-[90px] select-none">
            Active<br />Configuration
          </div>
          <div className="flex flex-wrap gap-2">
             <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
               <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
               Individual
             </span>
             <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
               Service: {(SERVICES_LIST.find(s => s.id === fields.serviceType)?.title || fields.serviceType || '').replace(/_/g, ' ')}
             </span>
             <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
               Subject: {(fields.subjectType || '').replace(/_/g, ' ')}
             </span>
              {fields.valuationLayout && (
                <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                  <span className={`w-1.5 h-1.5 rounded-full ${fields.valuationLayout === 'apartment' ? 'bg-purple-500' : 'bg-green-500'}`}></span>
                  {fields.valuationLayout === 'apartment' ? 'Flat / Apartment' : 'Land & Building'}
                </span>
              )}
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
      )}

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

      {/* ── Section 1: General Details ── */}
      <Section title="General Details" number={1}>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 bg-amber-50/30 p-4 rounded-xl border border-amber-200/50 mb-2">
            <Field label="To (Recipient / Bank)" span={2}>
              <input className={inputCls} value={fields.to} onChange={e => handleChange('to', e.target.value)} disabled={isReadOnly} placeholder="e.g. HDFC BANK LTD., Bhubaneswar" />
            </Field>
            <Field label="Date of Valuation Report">
              <input type="date" className={inputCls} value={fields.dateOfValuation} onChange={e => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Ref No. (Locked)">
              <input className={inputCls} value={fields.refNo} disabled={true} readOnly={true} placeholder="Project ID" />
            </Field>
            <Field label="Name of Bank / Institution">
              <input className={inputCls} value={fields.bankName} onChange={e => handleChange('bankName', e.target.value)} disabled={isReadOnly} placeholder="e.g. State Bank of India" />
            </Field>
            <Field label="Branch Name">
              <input className={inputCls} value={fields.branchName} onChange={e => handleChange('branchName', e.target.value)} disabled={isReadOnly} placeholder="e.g. Commercial Branch, Cuttack" />
            </Field>
          </div>

          <Field label="Type of Property">
            <select className={selectCls} value={fields.propertyType} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly}>
              <option>Residential</option><option>Commercial</option><option>Residential cum Commercial</option><option>Industrial</option><option>Vacant Plot</option>
            </select>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Name of Customer(s)">
              <input className={inputCls} value={fields.ownerName} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} placeholder="Full name of property owner" />
            </Field>
            {/* Technical Address Container */}
            <div className="md:col-span-2 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-sm font-bold text-[#0f2038]">Technical Address</h3>
                {!isReadOnly && (
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wide">Use Annexure</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFields(prev => {
                          if (prev.annexureEnabled) {
                            const remaining = (prev.annexures || []).filter(a => a.id !== prev.annexureRef);
                            return {
                              ...prev,
                              annexureEnabled: false,
                              annexureRef: '',
                              annexureRefShowAlso: false,
                              annexures: reorderAndLabelAnnexures(
                                remaining,
                                '',
                                prev.legalAnnexureRef,
                                false,
                                prev.legalAnnexureEnabled
                              ),
                            };
                          } else {
                            const newId = String(Date.now());
                            const newAnnexure: AnnexureItem = {
                              id: newId,
                              label: 'A',
                              title: 'Technical Address',
                              excelFileUrl: '',
                              excelFileName: '',
                            };
                            const updated = [...(prev.annexures || []), newAnnexure];
                            return {
                              ...prev,
                              annexureEnabled: true,
                              annexureRef: newId,
                              annexures: reorderAndLabelAnnexures(
                                updated,
                                newId,
                                prev.legalAnnexureRef,
                                true,
                                prev.legalAnnexureEnabled
                              ),
                            };
                          }
                        });
                      }}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fields.annexureEnabled ? 'bg-[#b8860b]' : 'bg-[#ccc]'}`}
                      title={fields.annexureEnabled ? 'Disable Annexure' : 'Enable Annexure'}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${fields.annexureEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    {fields.annexureEnabled && (
                      <>
                        <span className="w-px h-4 bg-neutral-200" />
                        <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wide">Also show address</span>
                        <button
                          type="button"
                          onClick={() => handleChange('annexureRefShowAlso', !fields.annexureRefShowAlso)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fields.annexureRefShowAlso ? 'bg-emerald-500' : 'bg-[#ccc]'}`}
                          title={fields.annexureRefShowAlso ? 'Hide address field' : 'Also show address field'}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${fields.annexureRefShowAlso ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {(!fields.annexureEnabled || fields.annexureRefShowAlso) && (
                <>
                  <Field label="Address Line 1">
                    <input className={inputCls} value={fields.ownerAddress} onChange={e => handleChange('ownerAddress', e.target.value)} disabled={isReadOnly} placeholder="Plot/Building No, Street/Locality" />
                  </Field>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="State">
                      <input list="states-list" className={inputCls} value={fields.state || ''} onChange={e => handleChange('state', e.target.value)} disabled={isReadOnly} placeholder="Search or enter state..." />
                      <datalist id="states-list">
                        <option value="Andhra Pradesh" /><option value="Arunachal Pradesh" /><option value="Assam" /><option value="Bihar" /><option value="Chhattisgarh" /><option value="Goa" /><option value="Gujarat" /><option value="Haryana" /><option value="Himachal Pradesh" /><option value="Jharkhand" /><option value="Karnataka" /><option value="Kerala" /><option value="Madhya Pradesh" /><option value="Maharashtra" /><option value="Manipur" /><option value="Meghalaya" /><option value="Mizoram" /><option value="Nagaland" /><option value="Odisha" /><option value="Punjab" /><option value="Rajasthan" /><option value="Sikkim" /><option value="Tamil Nadu" /><option value="Telangana" /><option value="Tripura" /><option value="Uttar Pradesh" /><option value="Uttarakhand" /><option value="West Bengal" /><option value="Andaman and Nicobar Islands" /><option value="Chandigarh" /><option value="Dadra and Nagar Haveli and Daman and Diu" /><option value="Delhi" /><option value="Jammu and Kashmir" /><option value="Ladakh" /><option value="Lakshadweep" /><option value="Puducherry" />
                      </datalist>
                    </Field>
                    <Field label="Pincode">
                      <input className={inputCls} value={fields.pincode || ''} onChange={e => handleChange('pincode', e.target.value)} disabled={isReadOnly} placeholder="e.g. 751001" maxLength={6} />
                    </Field>
                  </div>
                </>
              )}

              {fields.annexureEnabled && (
                <div className="space-y-2">
                  {/* Chip selector — only when 2+ annexures */}
                  {fields.annexures.length > 1 && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#6c757d] uppercase tracking-wider">Select Annexure</label>
                      <div className="flex flex-wrap gap-2">
                        {fields.annexures.map(ann => {
                          const isSelected = fields.annexureRef === ann.id;
                          const displayTitle = ann.title || `Annexure ${ann.label}`;
                          return (
                            <button
                              key={ann.id}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => handleChange('annexureRef', isSelected ? '' : ann.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'bg-[#b8860b] text-white border-[#b8860b] shadow-sm'
                                  : 'bg-white text-[#6c757d] border-[#dee2e6] hover:border-[#b8860b] hover:text-[#b8860b]'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/30' : 'bg-[#f0ead6] text-[#b8860b]'}`}>{ann.label}</span>
                              {displayTitle}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Linked confirmation pill */}
                  {(() => {
                    const linked = fields.annexures.find(a => a.id === fields.annexureRef);
                    if (!linked) return null;
                    const displayTitle = linked.title || `Annexure ${linked.label}`;
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fff8e1] border border-[#ffe082] text-xs text-[#7b6b2e]">
                        <svg className="w-3.5 h-3.5 shrink-0 text-[#b8860b]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>In report: <strong>Property Address — Refer to annexure {displayTitle}</strong></span>
                        <span className="ml-auto text-[10px] text-[#b8860b]/60">Edit title &amp; file in Annexure section ↓</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <Field label="Landmark">
              <input className={inputCls} value={fields.landmark || ''} onChange={e => handleChange('landmark', e.target.value)} disabled={isReadOnly} placeholder="e.g. Near UP School" />
            </Field>
            <div className="hidden md:block"></div>

            <div className="md:col-span-2 grid md:grid-cols-2 gap-4 bg-neutral-50/50 p-4 rounded-xl border border-neutral-200/60">
              <Field label="Application Type (Optional)">
                <input className={inputCls} value={fields.loanApplicationType || ''} onChange={e => handleChange('loanApplicationType', e.target.value)} disabled={isReadOnly} placeholder="e.g. Housing Loan, LAP, SME" />
              </Field>
              <Field label="Application Number">
                <input className={inputCls} value={fields.loanApplicationNo || ''} onChange={e => handleChange('loanApplicationNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. 123456" />
              </Field>
            </div>
            <Field label="Name of Document Holder">
              <input className={inputCls} value={fields.documentHolderName || ''} onChange={e => handleChange('documentHolderName', e.target.value)} disabled={isReadOnly} />
            </Field>
            <div className="hidden md:block"></div>

            {/* Legal Address Container */}
            <div className="md:col-span-2 bg-white p-4 rounded-xl border border-neutral-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                <h3 className="text-sm font-bold text-[#0f2038]">Legal Address <span className="text-[10px] font-normal text-[#6c757d] normal-case">(Hissa / Survey / Khasra No)</span></h3>
                {!isReadOnly && (
                  <div className="flex items-center gap-3 flex-wrap justify-end">
                    <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wide">Use Annexure</span>
                    <button
                      type="button"
                      onClick={() => {
                        setFields(prev => {
                          if (prev.legalAnnexureEnabled) {
                            const remaining = (prev.annexures || []).filter(a => a.id !== prev.legalAnnexureRef);
                            return {
                              ...prev,
                              legalAnnexureEnabled: false,
                              legalAnnexureRef: '',
                              legalAnnexureRefShowAlso: false,
                              annexures: reorderAndLabelAnnexures(
                                remaining,
                                prev.annexureRef,
                                '',
                                prev.annexureEnabled,
                                false
                              ),
                            };
                          } else {
                            const newId = String(Date.now());
                            const newAnnexure: AnnexureItem = {
                              id: newId,
                              label: 'B',
                              title: 'Legal Address',
                              excelFileUrl: '',
                              excelFileName: '',
                            };
                            const updated = [...(prev.annexures || []), newAnnexure];
                            return {
                              ...prev,
                              legalAnnexureEnabled: true,
                              legalAnnexureRef: newId,
                              annexures: reorderAndLabelAnnexures(
                                updated,
                                prev.annexureRef,
                                newId,
                                prev.annexureEnabled,
                                true
                              ),
                            };
                          }
                        });
                      }}
                      className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fields.legalAnnexureEnabled ? 'bg-[#b8860b]' : 'bg-[#ccc]'}`}
                      title={fields.legalAnnexureEnabled ? 'Disable Annexure' : 'Enable Annexure'}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${fields.legalAnnexureEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                    {fields.legalAnnexureEnabled && (
                      <>
                        <span className="w-px h-4 bg-neutral-200" />
                        <span className="text-[10px] font-bold text-[#6c757d] uppercase tracking-wide">Also show address</span>
                        <button
                          type="button"
                          onClick={() => handleChange('legalAnnexureRefShowAlso', !fields.legalAnnexureRefShowAlso)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${fields.legalAnnexureRefShowAlso ? 'bg-emerald-500' : 'bg-[#ccc]'}`}
                          title={fields.legalAnnexureRefShowAlso ? 'Hide address field' : 'Also show address field'}
                        >
                          <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${fields.legalAnnexureRefShowAlso ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {(!fields.legalAnnexureEnabled || fields.legalAnnexureRefShowAlso) && (
                <>
                  <Field label="Address Line 1">
                    <input className={inputCls} value={fields.legalAddress || ''} onChange={e => handleChange('legalAddress', e.target.value)} disabled={isReadOnly} placeholder="Plot/Building No, Street/Locality" />
                  </Field>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Field label="State">
                      <input list="states-list" className={inputCls} value={fields.legalState || ''} onChange={e => handleChange('legalState', e.target.value)} disabled={isReadOnly} placeholder="Search or enter state..." />
                    </Field>
                    <Field label="Pincode">
                      <input className={inputCls} value={fields.legalPincode || ''} onChange={e => handleChange('legalPincode', e.target.value)} disabled={isReadOnly} placeholder="e.g. 751001" maxLength={6} />
                    </Field>
                  </div>
                </>
              )}

              {fields.legalAnnexureEnabled && (
                <div className="space-y-2">
                  {/* Chip selector — only when 2+ annexures */}
                  {fields.annexures.length > 1 && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#6c757d] uppercase tracking-wider">Select Annexure</label>
                      <div className="flex flex-wrap gap-2">
                        {fields.annexures.map(ann => {
                          const isSelected = fields.legalAnnexureRef === ann.id;
                          const displayTitle = ann.title || `Annexure ${ann.label}`;
                          return (
                            <button
                              key={ann.id}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => handleChange('legalAnnexureRef', isSelected ? '' : ann.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'bg-[#b8860b] text-white border-[#b8860b] shadow-sm'
                                  : 'bg-white text-[#6c757d] border-[#dee2e6] hover:border-[#b8860b] hover:text-[#b8860b]'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/30' : 'bg-[#f0ead6] text-[#b8860b]'}`}>{ann.label}</span>
                              {displayTitle}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {/* Linked confirmation pill */}
                  {(() => {
                    const linked = fields.annexures.find(a => a.id === fields.legalAnnexureRef);
                    if (!linked) return null;
                    const displayTitle = linked.title || `Annexure ${linked.label}`;
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fff8e1] border border-[#ffe082] text-xs text-[#7b6b2e]">
                        <svg className="w-3.5 h-3.5 shrink-0 text-[#b8860b]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>In report: <strong>Legal Address — Refer to annexure {displayTitle}</strong></span>
                        <span className="ml-auto text-[10px] text-[#b8860b]/60">Edit title &amp; file in Annexure section ↓</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <Field label="Date of Inspection">
              <input type="date" className={inputCls} value={fields.dateOfInspection} onChange={e => handleChange('dateOfInspection', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Surrounding Locality Details ── */}
      <Section title="Surrounding Locality Details" number={2} defaultOpen={false}>
        <div className="space-y-3">
          <Field label="Ward No / Municipal Land No" span={2}>
            <input className={inputCls} value={fields.wardNo} onChange={e => handleChange('wardNo', e.target.value)} disabled={isReadOnly} />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Vicinity">
              <select className={selectCls} value={fields.vicinity} onChange={e => handleChange('vicinity', e.target.value)} disabled={isReadOnly}>
                <option>Slum</option><option>Residential</option><option>Commercial</option><option>Mixed</option><option>Industrial</option>
              </select>
            </Field>
            <Field label="Locality Type">
              <select className={selectCls} value={fields.classOfLocality} onChange={e => handleChange('classOfLocality', e.target.value)} disabled={isReadOnly}>
                <option>Elite/Posh/High Class</option><option>Upper Middle Class</option><option>Middle Class</option><option>Lower Middle Class</option>
              </select>
            </Field>
            <Field label="Approach Road Width">
              <select className={selectCls} value={fields.approachRoadWidth} onChange={e => handleChange('approachRoadWidth', e.target.value)} disabled={isReadOnly}>
                <option>{'>'}=60 Feet Road</option><option>60-40 Feet Road</option><option>40-20 Feet Road</option><option>{'<'}20 Feet Road</option>
              </select>
            </Field>
            <Field label="Plot Demarcated at Site">
              <select className={selectCls} value={fields.plotDemarcated} onChange={e => handleChange('plotDemarcated', e.target.value)} disabled={isReadOnly}>
                <option>Yes</option><option>No</option>
              </select>
            </Field>
          </div>
          <div className="p-4 bg-[#f0faf4] rounded-xl border border-[#dcfce7]">
            <p className="text-xs font-semibold text-[#166534] uppercase tracking-wider mb-3">Proximity to Civic Amenities</p>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Nearest Railway Station Name"><input className={inputCls} value={fields.railwayStationName} onChange={e => handleChange('railwayStationName', e.target.value)} disabled={isReadOnly} placeholder="e.g. Bhubaneswar Railway Station" /></Field>
                <Field label="Distance (in Km)"><input type="number" min="0" step="any" className={inputCls} value={fields.distanceRailwayStation} onChange={e => handleChange('distanceRailwayStation', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="e.g. 2" /></Field>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Nearest Bus Stop Name"><input className={inputCls} value={fields.busStopName} onChange={e => handleChange('busStopName', e.target.value)} disabled={isReadOnly} placeholder="e.g. Rajarani Bus Stop" /></Field>
                <Field label="Distance (in Km)"><input type="number" min="0" step="any" className={inputCls} value={fields.distanceBusStop} onChange={e => handleChange('distanceBusStop', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="e.g. 1" /></Field>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Nearest Hospital Name"><input className={inputCls} value={fields.hospitalName} onChange={e => handleChange('hospitalName', e.target.value)} disabled={isReadOnly} placeholder="e.g. Apollo Hospital" /></Field>
                <Field label="Distance (in Km)"><input type="number" min="0" step="any" className={inputCls} value={fields.distanceHospital} onChange={e => handleChange('distanceHospital', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="e.g. 3" /></Field>
              </div>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Property Identification">
              <select className={selectCls} value={fields.propertyIdentification} onChange={e => handleChange('propertyIdentification', e.target.value)} disabled={isReadOnly}>
                <option>Easy to Identify</option><option>Identification by documents</option><option>Additional documents required</option><option>Difficult to identify</option>
              </select>
            </Field>
            <Field label="Identification Remarks"><input className={inputCls} value={fields.propertyIdentificationRemarks} onChange={e => handleChange('propertyIdentificationRemarks', e.target.value)} disabled={isReadOnly} placeholder="Additional remarks..." /></Field>
            <Field label="Proximity to Facilities (Educational, Recreational)">
              <select className={selectCls} value={fields.proximityToFacilities} onChange={e => handleChange('proximityToFacilities', e.target.value)} disabled={isReadOnly}>
                <option>{'<'}1 Km</option><option>1-3 Kms</option><option>3-5 Kms</option><option>{'>'}5 Kms</option>
              </select>
            </Field>
          </div>
          <div className="p-4 bg-[#f0faf4] rounded-xl border border-[#dcfce7]">
            <p className="text-xs font-semibold text-[#166534] uppercase tracking-wider mb-3">Landmark Details</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nearest Railway Station"><input className={inputCls} value={fields.landmarkRailway} onChange={e => handleChange('landmarkRailway', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Nearest Bus Stop"><input className={inputCls} value={fields.landmarkBusStop} onChange={e => handleChange('landmarkBusStop', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Nearest Hospital"><input className={inputCls} value={fields.landmarkHospital} onChange={e => handleChange('landmarkHospital', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Nearest Landmark"><input className={inputCls} value={fields.landmarkNearest} onChange={e => handleChange('landmarkNearest', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Property Details ── */}
      <Section title="Property Details" number={3} defaultOpen={false}>
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Type of Usage of Entire Property">
              <select className={selectCls} value={fields.usageType} onChange={e => handleChange('usageType', e.target.value)} disabled={isReadOnly}>
                <option>Residential</option><option>Commercial</option><option>Residential cum Commercial</option><option>Industrial</option><option>Vacant Plot</option>
              </select>
            </Field>
            <Field label="Additional Amenities" span={2}>
              <div className="p-4 bg-[#f8f9fa] border border-[#dee2e6] rounded-xl space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PREDEFINED_AMENITIES.map(amenity => {
                    const isChecked = getSelectedAmenities().includes(amenity);
                    return (
                      <label key={amenity} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isReadOnly}
                          onChange={(e) => handleAmenityCheckboxChange(amenity, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        {amenity}
                      </label>
                    );
                  })}
                  
                  {/* Other Checkbox */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isOtherChecked}
                      disabled={isReadOnly}
                      onChange={(e) => handleOtherCheckboxChange(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    Other
                  </label>

                  {/* Not Applicable Checkbox */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={getSelectedAmenities().length === 0 || getSelectedAmenities().includes('Not Applicable')}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIsOtherChecked(false);
                          setOtherText('');
                          handleChange('additionalAmenities', 'Not Applicable');
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    Not Applicable
                  </label>
                </div>

                {/* Show other text input when "Other" is checked */}
                {isOtherChecked && (
                  <div className="pt-2 border-t border-[#dee2e6] mt-2">
                    <input
                      type="text"
                      value={otherText}
                      onChange={(e) => handleOtherTextChange(e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Specify other amenities (comma separated)..."
                      className={`${inputCls} text-xs`}
                    />
                  </div>
                )}
              </div>
            </Field>
            <Field label="Legal Status of Property">
              <select className={selectCls} value={fields.legalStatus} onChange={e => handleChange('legalStatus', e.target.value)} disabled={isReadOnly}>
                <option>Freehold</option><option>Lease hold {'>'}30 yrs.</option><option>Lease hold 15-30 yrs.</option><option>Lease hold {'<'}15 yrs.</option>
              </select>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 4: Subject Property Details ── */}
      <Section title="Subject Property Details" number={4} defaultOpen={false}>
        <div className="space-y-3">
          <Field label="Type of Premises">
            <select className={selectCls} value={fields.premisesType} onChange={e => handleChange('premisesType', e.target.value)} disabled={isReadOnly}>
              <option>Residential Flat</option><option>Gala</option><option>Shop</option><option>Bungalow</option><option>Row House</option><option>Office</option><option>Chawl</option><option>Open Plot</option><option>Showroom</option><option>Duplex Flat</option><option>Pent House</option>
            </select>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Occupied by / Is Property Vacant">
              <input className={inputCls} value={fields.occupiedBy} onChange={e => handleChange('occupiedBy', e.target.value)} disabled={isReadOnly} placeholder="e.g. Self Occupied" />
            </Field>
            <Field label="Is Property Rented">
              <input className={inputCls} value={fields.isPropertyRented} onChange={e => handleChange('isPropertyRented', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="If Rented, List of Occupants" span={2}>
              <input className={inputCls} value={fields.rentedOccupants} onChange={e => handleChange('rentedOccupants', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
          </div>
          <Field label="Property Taxation / Maintenance Cost">
            <select className={selectCls} value={fields.propertyTaxation} onChange={e => handleChange('propertyTaxation', e.target.value)} disabled={isReadOnly}>
              <option>Low</option><option>Average</option><option>High</option><option>Very High</option>
            </select>
          </Field>
          <div className="p-4 bg-[#f0faf4] rounded-xl border border-[#dcfce7]">
            <p className="text-xs font-semibold text-[#166534] uppercase tracking-wider mb-3">Boundary Details: As per Sketch Map</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="North"><input className={inputCls} value={fields.boundaryNorth} onChange={e => handleChange('boundaryNorth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="East"><input className={inputCls} value={fields.boundaryEast} onChange={e => handleChange('boundaryEast', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="South"><input className={inputCls} value={fields.boundarySouth} onChange={e => handleChange('boundarySouth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="West"><input className={inputCls} value={fields.boundaryWest} onChange={e => handleChange('boundaryWest', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
          </div>
          <div className="p-4 bg-[#f0faf4] rounded-xl border border-[#dcfce7]">
            <p className="text-xs font-semibold text-[#166534] uppercase tracking-wider mb-3">Boundary Details: At Site</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="North"><input className={inputCls} value={fields.buildingBoundaryNorth} onChange={e => handleChange('buildingBoundaryNorth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="East"><input className={inputCls} value={fields.buildingBoundaryEast} onChange={e => handleChange('buildingBoundaryEast', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="South"><input className={inputCls} value={fields.buildingBoundarySouth} onChange={e => handleChange('buildingBoundarySouth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="West"><input className={inputCls} value={fields.buildingBoundaryWest} onChange={e => handleChange('buildingBoundaryWest', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 5: Structural Details ── */}
      <Section title="Structural Details" number={5} defaultOpen={false}>
        <div className="space-y-3">
          <Field label="Type of Structure">
            <select className={selectCls} value={fields.structureType} onChange={e => handleChange('structureType', e.target.value)} disabled={isReadOnly}>
              <option>RCC</option><option>Load Bearing</option><option>Steel Structure</option><option>Composite Structure</option><option>Industrial Shed</option><option>A/C Sheet</option><option>G/I Sheet</option><option>Asbestos Roofing</option>
            </select>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="No. of Floors"><input className={inputCls} value={fields.numberOfFloors} onChange={e => handleChange('numberOfFloors', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="No. of Wings"><input className={inputCls} value={fields.numberOfWings} onChange={e => handleChange('numberOfWings', e.target.value)} disabled={isReadOnly} placeholder="NA" /></Field>
            <Field label="No. of Units on Each Floor"><input className={inputCls} value={fields.unitsPerFloor} onChange={e => handleChange('unitsPerFloor', e.target.value)} disabled={isReadOnly} placeholder="NA" /></Field>
            <Field label="Internal Composition"><input className={inputCls} value={fields.internalComposition} onChange={e => handleChange('internalComposition', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="No. of Lifts"><input className={inputCls} value={fields.numberOfLifts} onChange={e => handleChange('numberOfLifts', e.target.value)} disabled={isReadOnly} placeholder="NA" /></Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Age of the Property (Range)">
              <select className={selectCls} value={fields.ageOfProperty} onChange={e => handleChange('ageOfProperty', e.target.value)} disabled={isReadOnly}>
                <option value="">Select...</option><option>1-10 years</option><option>11-25 years</option><option>26-50 years</option><option>{'>'}50 years</option>
              </select>
            </Field>
            <Field label="Age of the Property (Actual Value)">
              <input className={inputCls} value={fields.ageOfPropertyActual || ''} onChange={e => handleChange('ageOfPropertyActual', e.target.value)} disabled={isReadOnly} placeholder="e.g. 5 Years" />
            </Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Estimated Future Life"><input className={inputCls} value={fields.estimatedFutureLife} onChange={e => handleChange('estimatedFutureLife', e.target.value)} disabled={isReadOnly} placeholder="e.g. 52 Years" /></Field>
            <Field label="Exteriors"><input className={inputCls} value={fields.exteriors} onChange={e => handleChange('exteriors', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
          <Field label="Quality of Construction, Appearance & Maintenance">
            <select className={selectCls} value={fields.qualityOfConstruction} onChange={e => handleChange('qualityOfConstruction', e.target.value)} disabled={isReadOnly}>
              <option>Very Good</option><option>Good</option><option>Average</option><option>Poor</option>
            </select>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Common Areas Remarks"><input className={inputCls} value={fields.commonAreasRemarks} onChange={e => handleChange('commonAreasRemarks', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Other Observations" span={2}>
              <textarea className={inputCls + ' resize-none'} rows={2} value={fields.otherObservations} onChange={e => handleChange('otherObservations', e.target.value)} disabled={isReadOnly} placeholder="e.g. No appearance of cracks or major defects observed" />
            </Field>
          </div>
          <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mt-4">Interiors</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Flooring & Finishing"><input className={inputCls} value={fields.flooringType} onChange={e => handleChange('flooringType', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Roofing & Terracing"><input className={inputCls} value={fields.roofType} onChange={e => handleChange('roofType', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Quality of Fixtures & Fittings"><input className={inputCls} value={fields.qualityOfFixtures} onChange={e => handleChange('qualityOfFixtures', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </div>
      </Section>

      {/* ── Section 6: Plan Approvals ── */}
      <Section title="Plan Approvals" number={6} defaultOpen={false}>
        <div className="space-y-3">
          <Field label="Construction as per Approved Plans">
            <select className={selectCls} value={fields.constructionApproved} onChange={e => handleChange('constructionApproved', e.target.value)} disabled={isReadOnly}>
              <option>Yes</option><option>No</option>
            </select>
          </Field>
          <div className="space-y-4">
            <Field label="Details of Approved Plan (Approval No. & Date)" span={2}>
              <textarea className={inputCls + ' resize-none'} rows={2} value={fields.approvalDetails} onChange={e => handleChange('approvalDetails', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Construction Permission No. & Date">
              <input className={inputCls} value={fields.constructionPermission} onChange={e => handleChange('constructionPermission', e.target.value)} disabled={isReadOnly} placeholder="Not mentioned" />
            </Field>
            <Field label="Violations Observed / Risk of Demolition">
              <input className={inputCls} value={fields.violationsObserved} onChange={e => handleChange('violationsObserved', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="If Plans Not Available, Does Structure Conform to Local Byelaws">
              <input className={inputCls} value={fields.conformsToByelaws} onChange={e => handleChange('conformsToByelaws', e.target.value)} disabled={isReadOnly} placeholder="NA (Plan available)" />
            </Field>
            <Field label="Other Documents Verified" span={2}>
              <textarea className={inputCls + ' resize-none'} rows={2} value={fields.documentsVerified} onChange={e => handleChange('documentsVerified', e.target.value)} disabled={isReadOnly} placeholder="e.g. Xerox copy of Sale deed, ROR, Sketch map & approved plan verified" />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Valuation Layout Selection (after Section 6) ── */}
      <div id="layout-config" className="card p-5 bg-white border border-[#dee2e6] rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 my-6 scroll-mt-24">
        <div>
          <h4 className="text-sm font-bold text-[#0f2038] uppercase tracking-wider">Property Layout Structure</h4>
          <p className="text-xs text-[#6c757d] mt-1">Select the structural layout to configure the corresponding valuation sections.</p>
        </div>
        <div className="flex bg-[#f1f3f5] p-1 rounded-lg border border-[#dee2e6] shrink-0">
          <button
            type="button"
            onClick={() => handleChange('valuationLayout', 'land_building')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
              fields.valuationLayout === 'land_building' || !fields.valuationLayout
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'text-[#6c757d] hover:text-[#0f2038]'
            }`}
          >
            Land & Building
          </button>
          <button
            type="button"
            onClick={() => handleChange('valuationLayout', 'apartment')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase transition-all ${
              fields.valuationLayout === 'apartment'
                ? 'bg-[#1e3a5f] text-white shadow-sm'
                : 'text-[#6c757d] hover:text-[#0f2038]'
            }`}
          >
            Flat / Apartment
          </button>
        </div>
      </div>

      {/* ── Sections 7+ only visible after layout is chosen ── */}
      {fields.valuationLayout && (<>

      {/* ── Section 7: Floor-wise Area & Building/Apartment Valuation ── */}
      <Section title={isApartmentFlat ? 'Apartment/Flat Valuation' : 'Floor-wise Area & Building Valuation'} number={7}>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-semibold text-[#0f2038]">{isApartmentFlat ? 'Apartment/Flat Valuation Details' : 'Building Valuation Details'}</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6c757d] font-bold uppercase tracking-wide">Floor Unit:</span>
            <select
              className={selectCls + ' !py-1 !text-xs w-28'}
              value={fields.floorAreaUnit || fields.landAreaUnit || 'Sqft'}
              onChange={e => handleChange('floorAreaUnit', e.target.value)}
              disabled={isReadOnly}
            >
              <option>Sqft</option><option>Decimal</option><option>Acre</option><option>Sqm</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#0a1628] text-white">
                <th className="px-3 py-2.5 text-left font-semibold text-xs">Floor</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Area ({fields.floorAreaUnit || fields.landAreaUnit || 'Sqft'})</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Rate (&#8377;/{fields.floorAreaUnit || fields.landAreaUnit || 'Sqft'})</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Estimated (&#8377;)</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs">Life (Yr)</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs">Age (Yr)</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs">Dep %</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Net Value (&#8377;)</th>
                {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {floorValuations.map((f, idx) => (
                <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input className={inputCls + ' !py-1.5 text-xs'} value={f.name || ''} onChange={e => updateFloor(f.id, 'name', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" step="any" className={inputCls + ' !py-1.5 text-xs text-right'} value={f.area || ''} onChange={e => updateFloor(f.id, 'area', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" step="any" className={inputCls + ' !py-1.5 text-xs text-right'} value={f.rate || ''} onChange={e => updateFloor(f.id, 'rate', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef] text-right text-xs font-medium text-[#0f2038]">
                    &#8377;{formatIndianCurrency(f.estimated)}
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" className={inputCls + ' !py-1.5 text-xs text-center'} value={f.lifeYears || ''} onChange={e => updateFloor(f.id, 'lifeYears', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" className={inputCls + ' !py-1.5 text-xs text-center'} value={f.ageYears || ''} onChange={e => updateFloor(f.id, 'ageYears', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input
                      type="number" min="0"
                      className={inputCls + ' !py-1.5 text-xs text-center font-bold text-[#b8860b]'}
                      value={f.depreciationPct !== undefined && f.depreciationPct !== null ? f.depreciationPct : ''}
                      onChange={e => updateFloor(f.id, 'depreciationPct', e.target.value)}
                      onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                      disabled={isReadOnly}
                      placeholder={`${computeDepreciation(parseNum(f.lifeYears), parseNum(f.ageYears))}`}
                    />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef] text-right text-xs font-bold text-[#0f2038]">
                    &#8377;{formatIndianCurrency(f.netValue)}
                  </td>
                  {!isReadOnly && (
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <button onClick={() => removeFloor(f.id)} className="text-red-400 hover:text-red-600 text-lg" title="Remove floor">&times;</button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="bg-[#f0ead6] font-bold">
                <td className="px-3 py-2.5 text-xs">TOTAL</td>
                <td className="px-3 py-2.5 text-right text-xs">{formatIndianCurrency(totalPlinthArea)} {fields.floorAreaUnit || fields.landAreaUnit || 'Sqft'}</td>
                <td className="px-3 py-2.5" colSpan={5}></td>
                <td className="px-3 py-2.5 text-right text-xs text-[#0f2038]">&#8377;{formatIndianCurrency(totalBuildingValue)}</td>
                {!isReadOnly && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
        {!isReadOnly && (
          <button onClick={addFloor} className="mt-3 text-sm text-[#b8860b] hover:text-[#96700a] font-medium flex items-center gap-1">
            <span className="text-lg">+</span> Add Floor
          </button>
        )}
      </Section>

      {/* ── Section 8: Valuation of Land (hidden for Apartment/Flat) ── */}
      {!isApartmentFlat && (
        <Section title="Valuation of Land" number={8} defaultOpen={false}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Land Area">
                <input
                  className={inputCls}
                  type="text"
                  value={fields.landArea}
                  onKeyDown={blockNegativeKeys}
                  onChange={e => handleChange('landArea', sanitizePositiveDecimal(e.target.value))}
                  disabled={isReadOnly}
                  placeholder="e.g. 13068"
                />
              </Field>
              <Field label="Land Area Unit">
                <select className={selectCls} value={fields.landAreaUnit} onChange={e => handleChange('landAreaUnit', e.target.value)} disabled={isReadOnly}>
                  <option>Sqft</option><option>Decimal</option><option>Acre</option><option>Sqm</option>
                </select>
              </Field>
              <Field label="Current Govt. Approved Rate (₹)">
                <input
                  className={inputCls}
                  type="text"
                  value={fields.govtLandRate}
                  onKeyDown={blockNegativeKeys}
                  onChange={e => handleChange('govtLandRate', sanitizePositiveDecimal(e.target.value))}
                  disabled={isReadOnly}
                  placeholder="e.g. 23"
                />
              </Field>
              <Field label={`Recommended Rate per ${fields.landAreaUnit} (₹)`}>
                <input
                  type="text"
                  className={inputCls}
                  value={fields.landRatePerUnit}
                  onKeyDown={blockNegativeKeys}
                  onChange={e => handleChange('landRatePerUnit', sanitizePositiveDecimal(e.target.value))}
                  disabled={isReadOnly}
                  placeholder="e.g. 450"
                />
              </Field>
              <Field label="Basis for Recommendation" span={2}>
                <input className={inputCls} value={fields.recommendedRateBasis} onChange={e => handleChange('recommendedRateBasis', e.target.value)} disabled={isReadOnly} placeholder="e.g. As per local feedback and market survey" />
              </Field>
            </div>
            <div className="px-4 py-3 rounded-lg bg-[#f0ead6] border border-[#d4c5a9] text-sm font-bold text-[#0f2038]">
              Total Land Value: &#8377; {formatIndianCurrency(landValue)}
            </div>
            <Field label="BUA as per Approvals">
              <input className={inputCls} value={fields.buaAsPerApprovals} onChange={e => handleChange('buaAsPerApprovals', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2 X 1600sqft = 3200sqft" />
            </Field>
          </div>
        </Section>
      )}

      {/* ── Section 9: Abstract of Valuation ── */}
      <Section title="Abstract of Valuation" number={isApartmentFlat ? 8 : 9}>
        <div className="space-y-3">
          {isApartmentFlat ? (
            /* Apartment/Flat: single value row */
            <div className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
              <span className="text-sm text-[#495057]">Value of Apartment/Flat (After Depreciation)</span>
              <span className="text-sm font-semibold text-[#0f2038]">&#8377; {formatIndianCurrency(totalBuildingValue)}</span>
            </div>
          ) : (
            /* Land & Building: two value rows */
            [
              { label: 'A. Value of Land', value: landValue },
              { label: 'B. Value of Building (After Depreciation)', value: totalBuildingValue },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
                <span className="text-sm text-[#495057]">{item.label}</span>
                <span className="text-sm font-semibold text-[#0f2038]">&#8377; {formatIndianCurrency(item.value)}</span>
              </div>
            ))
          )}
          <div className="flex items-center justify-between py-3 bg-gradient-to-r from-[#f0ead6] to-[#f8f4eb] px-4 rounded-lg border border-[#d4c5a9]">
            <span className="text-sm font-bold text-[#0f2038]">{isApartmentFlat ? 'TOTAL FAIR MARKET VALUE' : 'TOTAL FAIR MARKET VALUE (A + B)'}</span>
            <span className="text-lg font-bold text-[#b8860b]">&#8377; {formatIndianCurrency(totalPropertyValue)}</span>
          </div>
          <p className="text-xs text-[#6c757d] italic pl-1">{rupeesInWords(totalPropertyValue)}</p>

          <div className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#495057]">Realizable Value</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#495057]">(</span>
                <input type="number" min="0" className={inputCls + ' !py-1 !px-2 text-xs w-16 text-center'} value={fields.realizablePct} onChange={e => handleChange('realizablePct', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="90" />
                <span className="text-sm text-[#495057]">%)</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-green-700">&#8377; {formatIndianCurrency(realizableValue)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#495057]">Distress / Forced Sale Value</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#495057]">(</span>
                <input type="number" min="0" className={inputCls + ' !py-1 !px-2 text-xs w-16 text-center'} value={fields.distressPct} onChange={e => handleChange('distressPct', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="80" />
                <span className="text-sm text-[#495057]">%)</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-orange-700">&#8377; {formatIndianCurrency(distressValue)}</span>
          </div>

          <div className="mt-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              <Field label="Marketability">
                <select className={selectCls} value={fields.marketability} onChange={e => handleChange('marketability', e.target.value)} disabled={isReadOnly}>
                  <option>Excellent</option><option>Very Good</option><option>Good</option><option>Difficult</option>
                </select>
              </Field>
              <Field label="Valuation Result">
                <select className={selectCls} value={fields.valuationResult} onChange={e => handleChange('valuationResult', e.target.value)} disabled={isReadOnly}>
                  <option>Positive</option><option>Negative</option>
                </select>
              </Field>
              <Field label="Replacement Cost / Insurance Value (&#8377;)">
                <input className={inputCls} value={fields.replacementCost} onChange={e => handleChange('replacementCost', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Deviations in Property">
                <input className={inputCls} value={fields.deviations} onChange={e => handleChange('deviations', e.target.value)} disabled={isReadOnly} placeholder="NA" />
              </Field>
              <Field label="Govt. / Guideline Value (&#8377;)" span={2}>
                <input className={inputCls} value={fields.guidelineValue} onChange={e => handleChange('guidelineValue', e.target.value)} disabled={isReadOnly} placeholder="As per Govt. record (optional)" />
              </Field>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 10: Remarks & Declaration ── */}
      <Section title="Remarks & Declaration" number={isApartmentFlat ? 9 : 10} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Demarcation" span={2}>
            <textarea className={inputCls + ' resize-none'} rows={2} value={fields.demarcation} onChange={e => handleChange('demarcation', e.target.value)} disabled={isReadOnly} placeholder="Demarcation details..." />
          </Field>
          <Field label="Possession" span={2}>
            <input className={inputCls} value={fields.possession} onChange={e => handleChange('possession', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Remarks / Observations" span={2}>
            <textarea className={inputCls + ' resize-none'} rows={4} value={fields.remarks} onChange={e => handleChange('remarks', e.target.value)} disabled={isReadOnly} placeholder="Detailed remarks about the property..." />
          </Field>
          <Field label="Name of Representative who Inspected">
            <input className={inputCls} value={fields.representativeName} onChange={e => handleChange('representativeName', e.target.value)} disabled={isReadOnly} placeholder="e.g. Dinesh Das" />
          </Field>
          <Field label="Representative's Father's Name">
            <input className={inputCls} value={fields.representativeFatherName} onChange={e => handleChange('representativeFatherName', e.target.value)} disabled={isReadOnly} placeholder="Father's name of representative" />
          </Field>
        </div>
      </Section>

      {/* ── Section 11: Valuation Certificate (Auto-generated) ── */}
      <Section title="Valuation Certificate (Auto-generated)" number={isApartmentFlat ? 10 : 11} defaultOpen={false}>
        <div className="bg-[#fdfcf8] border border-[#d4c5a9] rounded-xl p-6 text-sm leading-relaxed text-[#333]">
          <p className="text-center font-bold text-base mb-4 underline">VALUATION CERTIFICATE</p>
          <p className="mb-3">
            This is to certify that the undersigned has personally inspected the property belonging to
            <strong> {fields.ownerName || '________'}</strong> situated at
            <strong> {fields.annexureEnabled && fields.annexures.length > 0 ? `address as provided in Annexure ${(fields.annexures.find(a => a.parsedData) || fields.annexures[0]).label}` : (getFullAddress() || '________')}</strong> on
            <strong> {fmtDate(fields.dateOfInspection) || '________'}</strong> and after careful examination and consideration
            of all relevant factors, the Fair Market Value of the said property is assessed as under:
          </p>
          <div className="space-y-2 my-4 pl-4 border-l-4 border-[#b8860b]">
            <p><strong>Fair Market Value:</strong> &#8377; {formatIndianCurrency(totalPropertyValue)} ({rupeesInWords(totalPropertyValue)})</p>
            <p><strong>Realizable Value ({fields.realizablePct || '90'}%):</strong> &#8377; {formatIndianCurrency(realizableValue)} ({rupeesInWords(realizableValue)})</p>
            <p><strong>Distress Sale Value ({fields.distressPct || '80'}%):</strong> &#8377; {formatIndianCurrency(distressValue)} ({rupeesInWords(distressValue)})</p>
          </div>
          <div className="text-right mt-8">
            <p className="font-bold">Satyajit Mohanty</p>
            <p className="text-xs text-[#6c757d]">B.E.(Civil), M.Tech (Structural)</p>
            <p className="text-xs text-[#6c757d]">Registered Valuer &mdash; IBBI/RV/02/2019/10594</p>
          </div>
        </div>
      </Section>

      {(!isReadOnly || (Array.isArray(fields.propertyImages) && fields.propertyImages.length > 0)) && (
        <BasePhotographsSection
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading}
          bucketCount={bucketImages?.length || 0}
          onImageNameChange={(idx, name) => {
            const updatedNames = [...(fields.propertyImageNames || [])];
            while (updatedNames.length <= idx) {
              updatedNames.push('');
            }
            updatedNames[idx] = name;
            handleChange('propertyImageNames', updatedNames);
          }}
          onRemoveImage={removeImage}
          onReorderImages={(newImages, newNames) => {
            handleChange('propertyImages', newImages);
            handleChange('propertyImageNames', newNames);
          }}
          onUploadImages={(e) => handleFileUpload(e, 'propertyImages')}
          onOpenBucketPicker={openBucketPicker}
          sectionNumber={isApartmentFlat ? 11 : 12}
          sectionId="section-12"
        />
      )}

      {/* ── Section 13: Sketch Maps ── */}
      <Section title="Sketch Maps" number={isApartmentFlat ? 12 : 13} defaultOpen={false}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-[#495057] uppercase tracking-wider">Sketch Maps</p>
        </div>
        {!isReadOnly && (
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#b8860b] text-[#b8860b] text-sm font-semibold cursor-pointer hover:bg-[#b8860b]/10 transition-all shadow-xs">
              {uploading ? '⏳ Uploading...' : '📷 Upload Sketch Maps'}
              <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'sketchMapImages')} disabled={uploading} />
            </label>
          </div>
        )}
        {fields.sketchMapImages && fields.sketchMapImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {fields.sketchMapImages.map((url: string, idx: number) => (
              <div key={idx} className="relative group rounded-lg overflow-hidden border border-[#e9ecef]">
                <img src={url} alt={`Sketch Map ${idx + 1}`} className="w-full h-32 object-contain bg-[#f8f9fa]" />
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
      </Section>

      {/* ── Section 14: Location Map ── */}
      <Section title="Location Map" number={isApartmentFlat ? 13 : 14} defaultOpen={false}>
        <div className="space-y-4">
          {/* Live Google Maps Embed — auto-reads from property address */}
          {(() => {
            const latStr = (fields.latitude || '').trim();
            const lngStr = (fields.longitude || '').trim();
            const hasCoordinates = Boolean(latStr && lngStr && !isNaN(Number(latStr)) && !isNaN(Number(lngStr)));

            const mainAreaLocation = cleanAddressForMap(getFullAddress());
            const hasQuery = hasCoordinates || mainAreaLocation.length > 0;

            const queryParam = hasCoordinates
              ? `loc:${latStr},${lngStr}`
              : mainAreaLocation;

            const encodedQuery = encodeURIComponent(queryParam);
            const googleMapsUrl = hasCoordinates
              ? `https://www.google.com/maps?q=loc:${latStr},${lngStr}&z=17&t=k`
              : `https://www.google.com/maps/search/${encodeURIComponent(mainAreaLocation)}`;

            return (
              <div className="space-y-3">
                {hasQuery ? (
                  <div className="rounded-xl overflow-hidden border border-[#c8d6e5] shadow-sm">
                    <div className="bg-[#d5e8f5] px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider flex items-center gap-1.5">
                        📍 Live Map Preview {hasCoordinates ? `(Pinned at ${latStr}, ${lngStr})` : '— Auto-loaded from Property Address'}
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
                      src={`https://maps.google.com/maps?q=${encodedQuery}&t=k&z=17&output=embed`}
                      width="100%"
                      height="400"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Property Location Map"
                    />
                    {hasCoordinates ? (
                      <div className="bg-emerald-50 border-t border-emerald-200 px-4 py-2.5 text-xs text-slate-800 space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="font-bold text-emerald-950">📍 Map Referenced From:</span>
                            <span className="font-semibold text-emerald-800 font-mono bg-emerald-100/80 px-1.5 py-0.5 rounded">
                              GPS Coordinates ({latStr}, {lngStr})
                            </span>
                            <span className="text-[11px] font-medium text-emerald-700">
                              (Coordinates override from inputs below)
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wide">
                            Coordinates Override Active
                          </span>
                        </div>
                        {mainAreaLocation && (
                          <div className="text-[11px] text-slate-600 pl-4 truncate" title={mainAreaLocation}>
                            <span className="font-medium text-slate-700">Overridden Technical Address:</span> {mainAreaLocation}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-blue-50 border-t border-blue-200 px-4 py-2.5 text-xs text-slate-800 space-y-1">
                        <div className="flex items-center justify-between flex-wrap gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="font-bold text-blue-950">📍 Map Referenced From:</span>
                            <span className="font-semibold text-blue-800 bg-blue-100/80 px-1.5 py-0.5 rounded">
                              Technical Address
                            </span>
                            <span className="text-[11px] text-blue-700 font-medium">
                              (Default Address Input)
                            </span>
                          </div>
                          <span className="text-[10px] font-medium text-slate-600 bg-white/80 px-2 py-0.5 rounded border border-blue-200">
                            Enter coordinates below to override for higher accuracy
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-700 pl-4 font-normal truncate" title={mainAreaLocation}>
                          <span className="font-semibold text-blue-900">Address text:</span> {mainAreaLocation}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] text-center text-sm text-[#6c757d]">
                    <p className="font-semibold mb-1">No address found.</p>
                    <p>Fill in the <strong>Property Address</strong> in Section 1 (General Details) or enter Lat/Long below to auto-load the map.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Screenshot upload for PDF (iframe can't be captured by html2canvas) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider">
              Screenshot for PDF Report
            </p>
            <p className="text-xs text-[#6c757d]">
              The live map above is for reference. To include a map in the PDF, open Google Maps via the link above, take a satellite screenshot with the pin visible, and upload it below.
            </p>
            {fields.locationMapImage ? (
              <div className="relative group rounded-xl overflow-hidden border border-[#e9ecef] max-w-lg">
                <img src={fields.locationMapImage} alt="Location Map Screenshot" className="w-full object-contain" />
                {!isReadOnly && (
                  <button onClick={() => handleChange('locationMapImage', '')} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-center text-xs py-1 font-semibold">
                  Screenshot uploaded — will appear in PDF
                </div>
              </div>
            ) : (
              !isReadOnly && (
                <div className="flex items-center gap-3 flex-wrap">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#b8860b] text-[#b8860b] text-sm font-semibold cursor-pointer hover:bg-[#b8860b]/10 transition-all shadow-xs">
                    {uploading ? '⏳ Uploading...' : '📷 Upload Map Screenshot for PDF'}
                    <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'locationMapImage')} disabled={uploading} />
                  </label>
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
      </Section>

      {/* ── Section 15: Annexure (Always available) ── */}
      <Section title="Annexures & Schedules" number={isApartmentFlat ? 14 : 15} defaultOpen={true}>
        <div className="space-y-4">
          {/* Info banner */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0a1628]/5 to-[#b8860b]/5 border border-[#b8860b]/20">
            <svg className="w-5 h-5 text-[#b8860b] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <p className="text-xs text-[#495057]">
              Upload detailed property address schedules, khasra details, or other annexure data in Excel format (.xlsx, .xls, .csv).
            </p>
          </div>

          {/* Annexure Cards */}
          {fields.annexures.map((annexure) => (
            <div key={annexure.id} className="rounded-xl border border-[#dee2e6] overflow-hidden">
              {/* Annexure header */}
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
              {/* Annexure body */}
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5">Annexure Title / Heading</label>
                  <input
                    type="text"
                    value={annexure.title || ''}
                    onChange={e => updateAnnexureTitle(annexure.id, e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Schedule of Property Details"
                    className={inputCls}
                  />
                </div>
                <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider">Excel Upload</label>
                {annexure.excelFileUrl ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
                    <svg className="w-8 h-8 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-green-800 truncate">{annexure.excelFileName}</p>
                      <a href={annexure.excelFileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 hover:underline">
                        Download / View file &#x2197;
                      </a>
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
                        {uploading ? 'Uploading...' : 'Click to upload Excel file'}
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
      </Section>

      </>)}

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

      {/* ── Action Buttons ── */}
      <div className="p-5 bg-[#556B2F] border-2 border-[#3F5021] rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-40">
        {status === 'COMPLETED' && (
          <div className="w-full p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 font-bold flex items-center gap-2">
            <span>&#x2705;</span> Verified and Completed (Pushed to storage for client download)
          </div>
        )}

        {status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE' && (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold mb-2">
            <span>&#x23F3; Currently Under Manager Review.</span>
            <button
              onClick={handleCancelSubmission}
              disabled={loading}
              className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
            >
              &#x21A9;&#xFE0F; Cancel Submission (Pull back to Draft)
            </button>
          </div>
        )}

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
              <button
                onClick={handleSaveDraft}
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-white border-2 border-[#b8860b] text-[#b8860b] font-bold text-sm hover:bg-amber-50 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
              >
                {loading ? '\u23F3 Saving...' : '\uD83D\uDCBE Save Draft'}
              </button>
              {userRole === 'REPORT_EMPLOYEE' && (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-[#1e3a5f] text-white font-bold text-sm hover:bg-[#0f2038] shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {loading ? '\u23F3 Submitting...' : '\uD83D\uDCE4 Submit to Manager'}
                </button>
              )}
            </>
          )}

          <button
            onClick={handlePreviewPDF}
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-white border border-gray-300 text-gray-800 font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            &#x1F441;&#xFE0F; Preview PDF
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={loading}
            className="px-6 py-2.5 rounded-full bg-white border border-gray-300 text-gray-800 font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            &#x1F4E5; Download PDF
          </button>

          {status === 'MANAGER_REVIEW' && isManagerOrOwner && (
            <>
              <button
                onClick={handleReworkClick}
                disabled={loading}
                className="px-6 py-2.5 rounded-full border-2 border-red-500 text-red-600 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                &#x274C; Send for Rework
              </button>
              <button
                onClick={handleFinalize}
                disabled={loading}
                className="px-6 py-2.5 rounded-full bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                &#x2705; Finalize & Share to Client
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rework Modal */}
      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#e9ecef] bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
                Send for Rework
              </h2>
              <p className="text-xs text-[#6c757d] mt-1">Please provide specific feedback for the report analyst.</p>
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

      {/* Bucket Picker Modal */}
      {bucketPickerOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
            <div className="p-5 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f2038] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                  📸 Pick from Photo Bucket
                </h2>
                <p className="text-xs text-[#6c757d] mt-1">
                  Select one or more inspection photos to add to the valuation report
                </p>
              </div>
              <button
                onClick={() => setBucketPickerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {localBucketImages && localBucketImages.length > 0 ? (
                (() => {
                  const uniqueAgentIds = Array.from(new Set(localBucketImages.map(img => img.employee?.employeeId || img.employee?.name || 'Agent').filter(Boolean)));
                  const displayedImages = bucketPickerAgent
                    ? localBucketImages.filter(img => (img.employee?.employeeId === bucketPickerAgent || img.employee?.name === bucketPickerAgent))
                    : localBucketImages;

                  return (
                    <div className="space-y-4">
                      {/* Agent Filter Header (if multiple agents exist) */}
                      {uniqueAgentIds.length > 1 && (
                        <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-gray-200">
                          <button
                            type="button"
                            onClick={() => setBucketPickerAgent(null)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              bucketPickerAgent === null
                                ? 'bg-[#1e3a5f] text-white shadow-xs'
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            All Photos ({localBucketImages.length})
                          </button>
                          {uniqueAgentIds.map(agentId => {
                            const agentImgs = localBucketImages.filter(img => (img.employee?.employeeId === agentId || img.employee?.name === agentId));
                            const agentName = agentImgs[0]?.employee?.name || agentId;
                            const isSelected = bucketPickerAgent === agentId;
                            return (
                              <button
                                key={agentId}
                                type="button"
                                onClick={() => setBucketPickerAgent(agentId)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  isSelected
                                    ? 'bg-[#1e3a5f] text-white shadow-xs'
                                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <span>👤 {agentName}</span>
                                <span className="text-[10px] opacity-75">({agentImgs.length})</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Photo Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {displayedImages.map((img) => {
                          const isSelected = bucketSelected.has(img.id);
                          return (
                            <div
                              key={img.id}
                              onClick={() => toggleBucketImage(img.id)}
                              className={`relative group bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                                isSelected ? 'border-[#1e3a5f] shadow-md scale-[0.98]' : 'border-gray-200 hover:border-gray-300 shadow-xs'
                              }`}
                            >
                              <div className="aspect-square bg-gray-100 flex flex-col items-center justify-center overflow-hidden relative">
                                <img
                                  src={img.url || ''}
                                  alt={img.fileName || 'Bucket image'}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={() => {
                                    // Automatically remove dead photo from state & purge from DB silently
                                    setLocalBucketImages(prev => prev.filter(i => i.id !== img.id));
                                    deleteBucketImage(img.id).catch(() => {});
                                  }}
                                />
                              </div>
                              <div className="p-2 border-t border-gray-100 bg-white">
                                <p className="text-[10px] font-bold text-[#0f2038] truncate">{img.employee?.name || 'Field Agent'}</p>
                                <p className="text-[9px] text-[#6c757d]">
                                  {img.createdAt ? new Date(img.createdAt).toLocaleDateString() : ''}
                                </p>
                              </div>
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center shadow-sm text-xs font-bold">
                                  ✓
                                </div>
                              )}
                              {!isSelected && (
                                <div className="absolute top-2 right-2 w-6 h-6 bg-black/20 border-2 border-white/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity animate-fade-in" />
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteBucketImage(img);
                                }}
                                className="absolute top-2 left-2 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-sm"
                                title="Delete from bucket"
                              >
                                🗑️
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-sm font-medium text-[#6c757d]">No photos in the bucket yet.</p>
                  <p className="text-xs text-[#adb5bd] mt-1">Field engineers or editors can upload photos to this project bucket.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#e9ecef] bg-white flex justify-end gap-3">
              <button
                onClick={() => setBucketPickerOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#dee2e6] text-sm font-semibold text-[#495057] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBucketConfirm}
                disabled={bucketSelected.size === 0}
                className="px-5 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-bold hover:bg-[#0f2038] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                Add Selected ({bucketSelected.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

    {!aiAssistEnabled && <FloatingNavigator isApartmentFlat={isApartmentFlat} annexureEnabled={fields.annexureEnabled || fields.legalAnnexureEnabled} />}

    {/* ── AI Assist Sidebar (hidden until NEXT_PUBLIC_AI_ASSIST_ENABLED=true) ── */}
    {aiAssistEnabled && (
      <>
        <div className="hidden lg:block w-[340px] shrink-0">
          <AiAssistPanel
            fields={fields}
            onAcceptSuggestion={handleAiAcceptSuggestion}
            onAcceptFloorSuggestion={handleAiAcceptFloorSuggestion}
            onAcceptAll={handleAiAcceptAll}
            isReadOnly={isReadOnly}
          />
        </div>
        <div className="lg:hidden">
          <AiAssistPanel
            fields={fields}
            onAcceptSuggestion={handleAiAcceptSuggestion}
            onAcceptFloorSuggestion={handleAiAcceptFloorSuggestion}
            onAcceptAll={handleAiAcceptAll}
            isReadOnly={isReadOnly}
          />
        </div>
      </>
    )}
    </div>
  );
}

