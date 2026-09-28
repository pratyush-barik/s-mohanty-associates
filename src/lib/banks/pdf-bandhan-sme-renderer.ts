/**
 * pdf-bandhan-sme-renderer.ts — Dedicated PDF Renderer for Bandhan Bank SME
 *
 * Implements:
 * - Full Times New Roman (Serif) typography with statutory table borders
 * - Section I: Basic Information (A to M with 6-row Borrower & Owner sub-tables)
 * - Section II: Valuation of Land (1. Details, 2.1 Freehold, 2.2 Leasehold, 2. Rent, 3. Description & multi-plot boundary schedule, 4. Characteristics & Proximities, 5. Other issues, 6. Land Valuation)
 * - Valuation of Building (1. Basic Info & Deviations, 1.H Plinth comparisons, 26-item checklist I to AB, 2. Technical Details, 3. Construction Specifications, 4. Building Valuation Table, 5.1-5.4 Sub-schedules)
 * - Section 6.0: Total Abstract Matrix (Land, Building, Extra Items, Amenities, Misc, Services across Govt, Market, Realisable 95%, Distress 85%, and OR SAY rounding)
 * - Remarks, Basis of Valuation, and Comprehensive Valuation Opinion Paragraph
 * - 17-point Valuer Declaration (A to Q) & Credentials Sign-Off Block
 * - 10-Point Valuation Report Check-List
 * - Enclosures: ROR, GPS Location Map, Property Photo Grid (with GPS stamps), Bhu Naksha Cadastral Map, and Guideline Value Proof.
 */

import { rgb, PDFImage } from 'pdf-lib';
import {
  PDFBankRenderer,
  PAGE_W,
  PAGE_H,
  MARGIN_T,
  MARGIN_B,
  MARGIN_L,
  MARGIN_R,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_SMALL,
  FONT_SIZE_CAPTION,
  LINE_HEIGHT,
  BORDER_W,
  CELL_PAD_X,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
  formatReportDate,
  fetchBytes,
} from '../pdf-bank-renderer';
import { formatIndianCurrency } from '@/lib/numberToWords';

export const parseNum = (v: any): number => {
  if (v === undefined || v === null || v === '') return 0;
  let s = String(v).trim();
  if (s.includes('=')) {
    const parts = s.split('=');
    s = parts[parts.length - 1];
  }
  s = s
    .replace(/Rs\.?/gi, '')
    .replace(/₹/g, '')
    .replace(/\/-/g, '')
    .replace(/,/g, '')
    .trim();
  let clean = s.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  const n = parseFloat(clean);
  return isNaN(n) || n < 0 ? 0 : n;
};

export const formatCurrencyINR = (val: number): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
};

export function getConstructionDetailsForStructure(structureType?: string): string {
  const st = (structureType || 'RCC').trim().toLowerCase();
  if (st.includes('aluform') || st.includes('mivan')) return 'Aluform (Mivan) RCC shuttering structure';
  if (st.includes('load bearing') || st.includes('loadbearing')) return 'Load bearing wall structure';
  if (st.includes('steel')) return 'Steel framed structure';
  if (st.includes('rcc')) return 'RCC Framed structure';
  return `${structureType || 'RCC'} structure`;
}

export function getNdmaStructureTypeForStructure(structureType?: string): string {
  const st = (structureType || 'RCC').trim().toLowerCase();
  if (st.includes('aluform') || st.includes('mivan')) return 'Aluform Shuttering Structure';
  if (st.includes('load bearing') || st.includes('loadbearing')) return 'Load Bearing Structure';
  if (st.includes('steel')) return 'Steel Structure';
  if (st.includes('rcc')) return 'RCC Framed Structure';
  return `${structureType || 'RCC'} Structure`;
}

export function getWorkProgressStructureLabel(structureType?: string): string {
  const st = (structureType || 'RCC').trim();
  return `${st} work`;
}

export function formatDateDisplay(d?: string): string {
  if (!d || !d.trim()) return '';
  const trimmed = d.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [y, m, day] = trimmed.split('-');
    return `${day}/${m}/${y}`;
  }
  return trimmed;
}

export function formatCommencementCompletion(
  commencement?: string,
  completion?: string,
  rawCombined?: string
): string {
  const c = commencement ? formatDateDisplay(commencement) : '';
  const e = completion ? formatDateDisplay(completion) : '';

  if (c && e) {
    return `Project Commencement - ${c}, Expected Completion - ${e}`;
  }
  if (c) {
    return `Project Commencement - ${c}`;
  }
  if (e) {
    return `Expected Completion - ${e}`;
  }
  if (rawCombined && rawCombined.trim() && rawCombined.trim() !== 'NA') {
    return rawCombined.trim();
  }
  return 'NA';
}

export function convertAreaToSqft(
  unit: string = 'ACRE_DEC',
  valStr: string = ''
): { sqft: number; sqftStr: string } {
  const num = parseFloat(String(valStr).replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) {
    return { sqft: 0, sqftStr: '' };
  }
  let sqft = 0;
  if (unit === 'ACRE_DEC') {
    sqft = num * 43560;
  } else if (unit === 'DECIMAL') {
    sqft = num * 435.6;
  } else if (unit === 'SQFT') {
    sqft = num;
  } else if (unit === 'SQYD') {
    sqft = num * 9;
  } else if (unit === 'SQMT') {
    sqft = num * 10.7639;
  } else if (unit === 'GUNTHA') {
    sqft = num * 1089;
  }
  const rounded = Math.round((sqft + Number.EPSILON) * 100) / 100;
  const formatted = rounded % 1 === 0
    ? formatCurrencyINR(rounded)
    : rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return {
    sqft: rounded,
    sqftStr: `${formatted} sqft.`,
  };
}

export function getFloorNameForIndex(index: number): string {
  const ordinalNames = [
    'Ground Floor',
    'First Floor',
    'Second Floor',
    'Third Floor',
    'Fourth Floor',
    'Fifth Floor',
    'Sixth Floor',
    'Seventh Floor',
    'Eighth Floor',
    'Ninth Floor',
    'Tenth Floor',
    'Eleventh Floor',
    'Twelfth Floor',
    'Thirteenth Floor',
    'Fourteenth Floor',
    'Fifteenth Floor',
    'Sixteenth Floor',
    'Seventeenth Floor',
    'Eighteenth Floor',
    'Nineteenth Floor',
    'Twentieth Floor',
  ];
  if (index >= 0 && index < ordinalNames.length) {
    return ordinalNames[index];
  }
  return `${index + 1}th Floor`;
}

export function deriveBuildingStories(floors?: BandhanSMEFloorDetail[]): string {
  if (!floors || floors.length === 0) return '';
  const count = floors.length;
  if (count === 1) {
    const fn = (floors[0].floorName || '').toLowerCase();
    if (fn.includes('ground')) return 'Ground Floor Building';
    return 'Single Storied Building';
  }
  const hasBasement = floors.some((f) => (f.floorName || '').toLowerCase().includes('basement'));
  if (hasBasement) {
    const nonBasement = floors.filter((f) => !(f.floorName || '').toLowerCase().includes('basement')).length;
    return `B+G+${Math.max(0, nonBasement - 1)} Storied Building`;
  }
  return `G+${count - 1} Storied Building`;
}

export function formatFloorSummaryStatement(stories?: string, height?: string): string {
  const s = (stories || '').trim();
  const h = (height || '').trim();
  if (!s && !h) return '';
  if (!s) return h.startsWith('Height:') ? h : `Height: ${h}`;
  if (!h) return s;
  const hFormatted = h.startsWith('Height:') ? h : `Height: ${h}`;
  return `${s} & ${hFormatted}`;
}

export function getStructurePrefix(constructionType?: string): string {
  if (!constructionType) return 'RCC';
  if (constructionType.toLowerCase().includes('load bearing')) return 'Load Bearing';
  if (constructionType.toLowerCase().includes('steel')) return 'Steel';
  if (constructionType.toLowerCase().includes('mivan') || constructionType.toLowerCase().includes('aluform')) return 'Mivan';
  return 'RCC';
}

export function formatAssessmentHoldingStatement(residential?: string, commercial?: string): string {
  const resNum = parseFloat(residential || '0') || 0;
  const commNum = parseFloat(commercial || '0') || 0;
  if (resNum <= 0 && commNum <= 0) return '';
  const lines: string[] = [];
  if (resNum > 0) lines.push(`Residential Plinth Area: ${resNum.toFixed(2)} Sft`);
  if (commNum > 0) lines.push(`Commercial Plinth Area: ${commNum.toFixed(2)} Sft`);
  const total = resNum + commNum;
  if (lines.length > 0) {
    lines.push(`Total: ${total.toFixed(2)} Sft`);
  }
  return lines.join('\n');
}

export function formatActualBuiltUpStatement(
  floors?: BandhanSMEFloorDetail[],
  constructionType?: string
): string {
  if (!floors || floors.length === 0) return '';
  const prefix = getStructurePrefix(constructionType);
  const lines: string[] = [];
  let total = 0;
  floors.forEach((fl) => {
    const areaNum = parseFloat(String(fl.plinthArea || '0').replace(/[^0-9.]/g, '')) || 0;
    if (areaNum > 0) {
      lines.push(`${prefix} ${fl.floorName} Area: ${areaNum.toFixed(2)} Sft`);
      total += areaNum;
    } else if (fl.floorName) {
      lines.push(`${prefix} ${fl.floorName} Area: 0.00 Sft`);
    }
  });
  if (lines.length > 0) {
    lines.push(`Total: ${total.toFixed(2)} Sft`);
  }
  return lines.join('\n');
}

export function formatCarpetAreaStatement(val?: string): string {
  if (!val) return '';
  const clean = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num) || num <= 0) return val;
  return `${num.toFixed(2)} Sft (Approx.)`;
}

export function formatSaleableAreaStatement(val?: string): string {
  if (!val) return '';
  const clean = val.replace(/[^0-9.]/g, '');
  const num = parseFloat(clean);
  if (isNaN(num) || num <= 0) return val;
  return `${num.toFixed(2)} Sft`;
}

export function parseSqftFromArea(
  valStr?: string,
  unit?: string,
  numVal?: string
): number {
  if (numVal && unit) {
    const conv = convertAreaToSqft(unit, numVal);
    if (conv.sqft > 0) return conv.sqft;
  }
  if (!valStr) return 0;
  const s = String(valStr).trim();

  // 1. Look for 'i.e. <digits> Sft' or 'i.e. <digits> sqft'
  const ieMatch = s.match(/i\.e\.?\s*([\d,]+(?:\.\d+)?)\s*(?:Sft|Sq\.?\s*Ft|sqft)/i);
  if (ieMatch && ieMatch[1]) {
    const n = parseFloat(ieMatch[1].replace(/,/g, ''));
    if (!isNaN(n) && n > 0) return n;
  }

  // 2. Look for '<digits> Sft' or '<digits> sqft'
  const sqftMatch = s.match(/([\d,]+(?:\.\d+)?)\s*(?:Sft|Sq\.?\s*Ft|sqft)/i);
  if (sqftMatch && sqftMatch[1]) {
    const n = parseFloat(sqftMatch[1].replace(/,/g, ''));
    if (!isNaN(n) && n > 0) return n;
  }

  // 3. Look for 'Ac.<digits> Dec' -> convert to sqft (1 Acre = 43560 sqft)
  const acMatch = s.match(/Ac\.?\s*(\d+(?:\.\d+)?)\s*Dec/i);
  if (acMatch && acMatch[1]) {
    const ac = parseFloat(acMatch[1]);
    if (!isNaN(ac) && ac > 0) return Math.round(ac * 43560);
  }

  // 4. Look for '<digits> Dec' -> convert to sqft (1 Dec = 435.6 sqft)
  const decMatch = s.match(/(\d+(?:\.\d+)?)\s*Dec/i);
  if (decMatch && decMatch[1]) {
    const dec = parseFloat(decMatch[1]);
    if (!isNaN(dec) && dec > 0) return Math.round(dec * 435.6);
  }

  // 5. Plain number
  const plain = parseFloat(s.replace(/,/g, '').replace(/[^0-9.]/g, ''));
  return isNaN(plain) ? 0 : plain;
}

export function parseAreaValueAndUnit(
  rawStr?: string,
  defaultUnit: string = 'ACRE_DEC'
): { unit: string; value: string } {
  if (!rawStr || !rawStr.trim()) {
    return { unit: defaultUnit, value: '' };
  }
  const s = rawStr.trim();

  // Match Acre: Total Area: Ac.0.069 Dec or Ac.0.069 or (AC.0.069Decs)
  const acMatch = s.match(/(?:Ac\.?|Acre\s*:?)\s*(\d+(?:\.\d+)?)/i);
  if (acMatch && acMatch[1]) {
    return { unit: 'ACRE_DEC', value: acMatch[1] };
  }

  // Match Sq.Yds
  const ydMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:Sq\.?\s*Yds|Sq\.?\s*Yards|sqyd)/i);
  if (ydMatch && ydMatch[1]) {
    return { unit: 'SQYD', value: ydMatch[1] };
  }

  // Match Sq.Mtr
  const mtMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:Sq\.?\s*Mtr|Sq\.?\s*Meters|sqmt)/i);
  if (mtMatch && mtMatch[1]) {
    return { unit: 'SQMT', value: mtMatch[1] };
  }

  // Match Guntha
  const gMatch = s.match(/(\d+(?:\.\d+)?)\s*Guntha/i);
  if (gMatch && gMatch[1]) {
    return { unit: 'GUNTHA', value: gMatch[1] };
  }

  // Match Decimal
  const decMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:Dec|Decimal|Decs)/i);
  if (decMatch && decMatch[1]) {
    return { unit: 'DECIMAL', value: decMatch[1] };
  }

  // Match Sqft / Sft
  const sftMatch = s.match(/(\d+(?:\.\d+)?)\s*(?:Sft|Sq\.?\s*Ft|sqft)/i);
  if (sftMatch && sftMatch[1]) {
    return { unit: 'SQFT', value: sftMatch[1] };
  }

  // Plain number
  const numMatch = s.match(/^(\d+(?:\.\d+)?)$/);
  if (numMatch && numMatch[1]) {
    return { unit: defaultUnit, value: numMatch[1] };
  }

  return { unit: defaultUnit, value: '' };
}

export function formatAreaOfLandStatement(
  unit: string = 'ACRE_DEC',
  primaryVal: string = '',
  acresVal: string = '',
  decsVal: string = '',
  rawResult: string = ''
): { statement: string; sqft: number; sqftStr: string } {
  const pNum = parseFloat(String(primaryVal).replace(/[^0-9.]/g, '')) || 0;
  const aNum = parseFloat(String(acresVal).replace(/[^0-9.]/g, '')) || 0;
  const dNum = parseFloat(String(decsVal).replace(/[^0-9.]/g, '')) || 0;

  if (unit === 'SQFT') {
    if (pNum > 0) {
      const rounded = Math.round((pNum + Number.EPSILON) * 100) / 100;
      const f = rounded % 1 === 0 ? formatCurrencyINR(rounded) + '.00' : rounded.toFixed(2);
      return { statement: `Total Area: ${f} Sft`, sqft: rounded, sqftStr: `${f} Sft` };
    }
    return { statement: primaryVal ? `Total Area: ${primaryVal} Sft` : (rawResult || ''), sqft: 0, sqftStr: '' };
  }

  if (unit === 'ACRE_DEC') {
    let totalAcres = 0;
    if (acresVal || decsVal) {
      const decsPart = dNum >= 1 ? dNum / 100 : dNum;
      totalAcres = aNum + decsPart;
    } else if (pNum > 0) {
      totalAcres = pNum;
    }
    if (totalAcres > 0) {
      const rawSqft = totalAcres * 43560;
      const sqft = Math.round((rawSqft + Number.EPSILON) * 100) / 100;
      const cleanSqft = Math.abs(sqft - Math.round(sqft)) < 0.5 ? Math.round(sqft) : sqft;
      const f = cleanSqft % 1 === 0 ? formatCurrencyINR(cleanSqft) + '.00' : cleanSqft.toFixed(2);
      const decsStr = primaryVal ? primaryVal : totalAcres.toString();
      return {
        statement: `Total Area: Ac.${decsStr} Dec i.e. ${f} Sft`,
        sqft: cleanSqft,
        sqftStr: `${f} Sft`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  if (unit === 'DECIMAL') {
    if (pNum > 0) {
      const rawSqft = pNum * 435.6;
      const sqft = Math.round((rawSqft + Number.EPSILON) * 100) / 100;
      const cleanSqft = Math.abs(sqft - Math.round(sqft)) < 0.5 ? Math.round(sqft) : sqft;
      const f = cleanSqft % 1 === 0 ? formatCurrencyINR(cleanSqft) + '.00' : cleanSqft.toFixed(2);
      return {
        statement: `Total Area: ${primaryVal || pNum} Dec i.e. ${f} Sft`,
        sqft: cleanSqft,
        sqftStr: `${f} Sft`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  if (unit === 'SQYD') {
    if (pNum > 0) {
      const sqft = Math.round(((pNum * 9) + Number.EPSILON) * 100) / 100;
      const f = sqft % 1 === 0 ? formatCurrencyINR(sqft) + '.00' : sqft.toFixed(2);
      return {
        statement: `Total Area: ${primaryVal || pNum} Sq.Yds i.e. ${f} Sft`,
        sqft,
        sqftStr: `${f} Sft`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  if (unit === 'SQMT') {
    if (pNum > 0) {
      const sqft = Math.round(((pNum * 10.7639) + Number.EPSILON) * 100) / 100;
      const f = sqft % 1 === 0 ? formatCurrencyINR(sqft) + '.00' : sqft.toFixed(2);
      return {
        statement: `Total Area: ${primaryVal || pNum} Sq.Mtr i.e. ${f} Sft`,
        sqft,
        sqftStr: `${f} Sft`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  if (unit === 'GUNTHA') {
    if (pNum > 0) {
      const sqft = Math.round(((pNum * 1089) + Number.EPSILON) * 100) / 100;
      const f = sqft % 1 === 0 ? formatCurrencyINR(sqft) + '.00' : sqft.toFixed(2);
      return {
        statement: `Total Area: ${primaryVal || pNum} Guntha i.e. ${f} Sft`,
        sqft,
        sqftStr: `${f} Sft`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  return { statement: rawResult || primaryVal || '', sqft: pNum, sqftStr: `${pNum} Sft` };
}

export interface BandhanSMEFloorDetail {
  floorName: string;
  height?: string;
  plinthArea?: string;
  doorsWindows?: string;
  flooring?: string;
  wallFinishing?: string;
}

export interface BandhanSMEPlotBoundary {
  plotNo: string;
  east: string;
  west: string;
  north: string;
  south: string;
}

export interface BandhanSMEBuildingValuationRow {
  description: string;
  plinthArea: string;
  height: string;
  age: string;
  replacementRate: string;
  replacementCost: string;
  depreciation: string;
  valueAfterDepreciation: string;
}

export interface BandhanSMESubScheduleItem {
  name: string;
  cost: string;
}

export interface BandhanSMEChecklistItem {
  pointNo: number;
  question: string;
  subText?: string;
  answer: 'Yes' | 'No' | 'NA';
}

export interface BandhanSMEPhoto {
  url: string;
  caption?: string;
  timestamp?: string;
  gps?: string;
}

export interface BandhanSMEReportFields {
  clientType?: string;
  institutionCategory?: string;
  organisationTemplate?: string;
  organisationSubTemplate?: string;
  bankName?: string;
  serviceType?: string;
  subjectType?: string;
  reworkNotes?: string;

  // Header
  refNo?: string;
  reportDate?: string;

  // Section I: Basic Information (A - M)
  branchDetails?: string;
  branchName?: string;
  bankLetterNo?: string;
  bankLetterDate?: string;
  letterNoAndDate?: string;
  valuationMadeAtBorrowerRequest?: string;
  managerAccompanied?: string;
  valuationType?: string;
  dateOfEarlierValuation?: string;
  previousValuerName?: string;
  dateOfVisit?: string;
  dateOfValuation?: string;
  personsPresent?: string;
  documentsProduced?: string;

  // Borrower Details (L)
  borrowerName?: string;
  borrowerAt?: string;
  borrowerPo?: string;
  borrowerPs?: string;
  borrowerDist?: string;
  borrowerPhone?: string;
  borrowerNatureOfBusiness?: string;

  // Owner Details (M)
  ownerName?: string;
  ownerAt?: string;
  ownerPo?: string;
  ownerPs?: string;
  ownerPin?: string;
  ownerDist?: string;
  ownerPhone?: string;
  ownerFatherName?: string;

  // Section II: Valuation of Land
  // 1. Details of Property (A - L, I)
  detailsPropertyOffered?: string;
  dateAcquisitionLand?: string;
  valueAsPerSaleDeed?: string;
  saleDeedDocNo?: string;
  areaLandDoc?: string;
  areaLandRor?: string;
  areaLandPhysical?: string;
  landAreaUnit?: string;
  landAreaValue?: string;
  landAreaSqft?: string;

  // Location of Property & Postal Address (H)
  plotNo?: string;
  khataNo?: string;
  propAt?: string;
  propPo?: string;
  propPs?: string;
  propPin?: string;
  propDist?: string;

  urbanSemiUrbanRural?: string;
  situatedAreaType?: string;
  classificationOfLocality?: string;
  typeOfProperty?: string;
  isAgricultural?: string;
  agriculturalConversionContemplated?: string;
  isIndustrial?: string;
  industrialActivitySuited?: string;
  isResidential?: string;
  isCommercial?: string;
  isInstitutional?: string;
  isOthersSpecify?: string;

  // 2.1 Title of Property Freehold / Leasehold (A - F)
  titleFreeholdLeasehold?: string;
  ownershipOfProperty?: string;
  jointOwnershipShare?: string;
  taxesPaidUpTo?: string;
  landRevenue?: string;
  landBuildingMunicipalTaxes?: string;
  wealthTaxAssessedPaid?: string;

  // 2.2 If Leasehold (A - L)
  isLeaseholdApplicable?: string;
  lessorName?: string;
  lesseeName?: string;
  natureOfLease?: string;
  dateCommencementLease?: string;
  periodOfLease?: string;
  termsOfRenewal?: string;
  leasePremiumRentPerAnnum?: string;
  unexpiredPeriodOfLease?: string;
  initialPremium?: string;
  groundRentPerAnnum?: string;
  unearnedIncreasePayable?: string;
  leasePermitsMortgage?: string;

  // 2. Rent Details (A - D)
  rentOccupationStatus?: string;
  tenantNames?: string;
  tenantPortionOccupied?: string;
  monthlyAnnualRentPaid?: string;
  grossRentReceived?: string;

  // 3. Brief Description of the Property (A - N, I, II, III, IV, P.1, P.2)
  detailedAddressWithPin?: string;
  municipalityWardNo?: string;
  streetNo?: string;
  surveyPlotNo?: string;
  briefKhataNo?: string;
  mouza?: string;
  thanaNo?: string;
  tehasilNo?: string;
  tehasil?: string;
  sro?: string;
  policeStation?: string;
  villageTownCity?: string;
  district?: string;
  state?: string;

  dimensionDocEastWest?: string;
  dimensionDocNorthSouth?: string;
  dimensionMeasEastWest?: string;
  dimensionMeasNorthSouth?: string;
  extentOfSite?: string;
  extentConsideredValuation?: string;

  // Boundaries P.1 (Deed) & P.2 (Verification)
  documentPlotBoundaries?: BandhanSMEPlotBoundary[];
  physicalPlotBoundaries?: BandhanSMEPlotBoundary[];
  verifiedBoundaryEast?: string;
  verifiedBoundaryWest?: string;
  verifiedBoundaryNorth?: string;
  verifiedBoundarySouth?: string;
  sketchEnclosed?: string;

  // 4. Characteristics of the Site (A - U, Location Adv/Disadv)
  levelOfLand?: string;
  useToWhichCanBePut?: string;
  easementAgreements?: string;
  restrictiveCovenant?: string;
  approvalLetterNoDateDevelopment?: string;
  buildingUseCertificateObtained?: string;
  townPlanningSchemeInclusion?: string;
  cornerOrIntermittentPlot?: string;
  isLandLocked?: string;
  hasFreeAccess?: string;
  surfaceCommunicationProximity?: string;
  freeAccessAndProximity?: string;
  roadFacilities?: string;
  roadKindAndWidth?: string;
  distMunicipalLimitStatus?: string;
  distMunicipalOffice?: string;
  distMunicipalLimits?: string;
  waterPotentialities?: string;
  possibilityFlooding?: string;
  undergroundSewerageAvailable?: string;
  drainageSystemsAvailable?: string;
  powerSupplyAvailable?: string;
  surroundingDevelopment?: string;

  // Proximity to Civic Amenities (T.i - T.vii)
  proximitySchool?: string;
  proximityCollege?: string;
  proximityHospital?: string;
  proximityMarket?: string;
  proximityBusStand?: string;
  proximityRailwayStation?: string;
  proximityOtherPlace?: string;
  latitudeLongitude?: string;
  latitude?: string;
  longitude?: string;
  locationAdvantages?: string;
  locationDisadvantages?: string;

  // 5. Other Issues / Points (A - D)
  landAcquisitionNotification?: string;
  developmentContributionDemanded?: string;
  landCeilingEnactments?: string;
  salesInstancesInLocality?: string;
  salesBasisArrivingLandRate?: string;
  adoptedLandRateRationale?: string;

  // 6. Valuation of Land
  previousValuationDetails?: string;
  presentValuationApproachDetails?: string;
  landAreaTotal?: string;
  landGovtBenchmarkUnit?: string;
  landGovtBenchmarkValue?: string;
  landGovtBenchmarkPerAcre?: string;
  landGovtBenchmarkRate?: string;
  landGovtValueTotal?: string;
  landMarketUnit?: string;
  landMarketRateInput?: string;
  landMarketRate?: string;
  landMarketValueTotal?: string;
  landDistressValue?: string;
  landRealisableValue?: string;
  distressSalePct?: string;
  realisableValuePct?: string;

  // Valuation of Building
  // 1. Basic Information of Building (A - F, G, H, I - AB)
  buildingType?: string;
  yearConstruction?: string;
  yearCompletion?: string;
  yearCommencementCompletion?: string;
  typeOfConstruction?: string;
  estimatedFutureLife?: string;
  farFsiPermissibleUtilized?: string;
  buildingApprovalAuthorityDetails?: string;
  constructionAsPerPlanDeviations?: string;

  // 1.H Built up Area
  assessmentResidentialArea?: string;
  assessmentCommercialArea?: string;
  carpetAreaValue?: string;
  saleableAreaValue?: string;
  builtUpAreaAssessmentHolding?: string;
  builtUpAreaAsPerActual?: string;
  carpetAreaTotal?: string;
  saleableAreaTotal?: string;

  // 1.I - 1.AB Occupancy & 26+ details
  buildingOwnerOccupiedTenanted?: string;
  ownerOccupiedPortion?: string;
  isUnderRentControlAct?: string;
  buildingTenantNames?: string;
  buildingTenantPortions?: string;
  buildingMonthlyRent?: string;
  buildingGrossRent?: string;
  occupantsRelatedToOwner?: string;
  fixturesAmountRecovered?: string;
  waterElectricityChargesBorneBy?: string;
  isRentDisputePendingCourt?: string;
  hasStandardRentFixed?: string;
  tenantBearMaintenance?: string;
  liftMaintenanceBorneBy?: string;
  pumpMaintenanceBorneBy?: string;
  commonElectricityBorneBy?: string;
  propertyTaxAmountBorneBy?: string;
  isBuildingInsuredDetails?: string;
  statutoryDuesPaid?: string;
  buildingFreeAccess?: string;

  // 2. Technical Details of Building (A - G)
  numberOfFloorsAndHeight?: string;
  buildingStoriesDescription?: string;
  buildingStandardHeight?: string;
  floorDetails?: BandhanSMEFloorDetail[];
  floorHeightGF?: string;
  floorHeightFF?: string;
  floorHeightSF?: string;
  floorHeightTF?: string;
  plinthAreaGF?: string;
  plinthAreaFF?: string;
  plinthAreaSF?: string;
  plinthAreaTF?: string;
  buildingConditionExterior?: string;
  buildingConditionInterior?: string;
  foundationType?: string;
  doorsWindowsGF?: string;
  doorsWindowsFF?: string;
  doorsWindowsSF?: string;
  doorsWindowsTF?: string;
  flooringGF?: string;
  flooringFF?: string;
  flooringSF?: string;
  flooringTF?: string;
  wallFinishingGF?: string;
  wallFinishingFF?: string;
  wallFinishingSF?: string;
  wallFinishingTF?: string;

  // 3. Construction Specifications (A - Z)
  specFoundation?: string;
  specBasement?: string;
  specSuperstructure?: string;
  specJoineryDoorsWindows?: string;
  specRccWorks?: string;
  specPlastering?: string;
  specFlooringSkirting?: string;
  specSpecialFinishing?: string;
  specRoofing?: string;
  specDrainage?: string;
  specDecorativeFeatures?: string;
  specInternalWiring?: string;
  specWiringFittingsClass?: string;
  specElectricalPoints?: string;
  specEarthingMcb?: string;
  specSanitaryInstallation?: string;
  specNoOfGeysers?: string;
  specSanitaryFittingsClass?: string;
  specCompoundWall?: string;
  specCompoundWallHeightLength?: string;
  specCompoundWallType?: string;
  specCompoundGateDetails?: string;
  specLiftsCapacity?: string;
  specUndergroundSump?: string;
  specOverheadTank?: string;
  specOverheadTankLocation?: string;
  specOverheadTankCapacity?: string;
  specPumpsHp?: string;
  specRoadsPavingCompound?: string;
  specSewageDisposal?: string;
  specQualityClassConstruction?: string;
  specWaterSupply?: string;
  specVentilationLighting?: string;
  specFireSafetyArrangements?: string;

  // 4. Details of Building Valuation Table
  buildingValuationRows?: BandhanSMEBuildingValuationRow[];

  // 5. Sub-Schedules (5.1 Extra Items, 5.2 Amenities, 5.3 Misc, 5.4 Services)
  isExtraItemsNA?: boolean;
  extraItems?: BandhanSMESubScheduleItem[];
  extraItemsTotal?: string;

  isAmenitiesNA?: boolean;
  amenities?: BandhanSMESubScheduleItem[];
  amenitiesTotal?: string;

  isMiscNA?: boolean;
  miscItems?: BandhanSMESubScheduleItem[];
  miscItemsTotal?: string;

  isServicesNA?: boolean;
  servicesItems?: BandhanSMESubScheduleItem[];
  servicesItemsTotal?: string;

  // 6.0 Total Abstract of Entire Property
  abstractGovtLand?: string;
  abstractMarketLand?: string;
  abstractRealLand?: string;
  abstractDistressLand?: string;

  abstractGovtBuilding?: string;
  abstractMarketBuilding?: string;
  abstractRealBuilding?: string;
  abstractDistressBuilding?: string;

  abstractGovtExtra?: string;
  abstractMarketExtra?: string;
  abstractRealExtra?: string;
  abstractDistressExtra?: string;

  abstractGovtAmenities?: string;
  abstractMarketAmenities?: string;
  abstractRealAmenities?: string;
  abstractDistressAmenities?: string;

  abstractGovtMisc?: string;
  abstractMarketMisc?: string;
  abstractRealMisc?: string;
  abstractDistressMisc?: string;

  abstractGovtServices?: string;
  abstractMarketServices?: string;
  abstractRealServices?: string;
  abstractDistressServices?: string;

  abstractGovtTotal?: string;
  abstractMarketTotal?: string;
  abstractRealTotal?: string;
  abstractDistressTotal?: string;

  abstractGovtSay?: string;
  abstractMarketSay?: string;
  abstractRealSay?: string;
  abstractDistressSay?: string;

  // Remarks, Basis of Valuation & Valuation Opinion
  valuationRemarksBox?: string;
  basisOfValuationStatement?: string;
  fairMarketValue?: string;
  fairMarketValueWords?: string;
  realisableValue?: string;
  realisableValueWords?: string;
  bookValueOfLand?: string;
  bookValueOfLandWords?: string;
  distressValue?: string;
  distressValueWords?: string;
  insurableValueOfProperty?: string;
  insurableValueOfPropertyWords?: string;

  // Declaration & Sign-off
  declarationItems?: string[];
  reportPagesCount?: string;
  reportPagesCountLocked?: boolean;
  siteEngineerName?: string;
  empanelledValuerName?: string;
  valuerQualifications?: string;
  valuerIovRegNo?: string;
  valuerWealthTaxRegNo?: string;
  declarationDate?: string;

  // 10-Point Checklist
  checklist?: BandhanSMEChecklistItem[];

  // Enclosures
  rorImageUrl?: string;
  locationMapImageUrl?: string;
  bhuNakshaImageUrl?: string;
  guidelineValueImageUrl?: string;
  propertyPhotos?: BandhanSMEPhoto[];
  documentImages?: string[];
  documentImageNames?: string[];
  locationMapImages?: string[];
  mouzaMapImages?: string[];
  sketchMapImages?: string[];
  cadastralMapImages?: string[];
  bdaMapImages?: string[];
  [key: string]: any;
}

const TABLE_FONT_SIZE = FONT_SIZE; // 12pt
const TABLE_MIN_ROW_H = 18;

export class PDFBandhanSMERenderer extends PDFBankRenderer {
  private colSl = 48;
  private colPts = 202;
  private colRem = CONTENT_W - 48 - 202; // ~237.28 pt

  private colLbl2 = 250;
  private colVal2 = CONTENT_W - 250; // 237.28 pt

  /**
   * Helper to safely embed image from URL or data URI
   */
  private async embedImgFromUrl(url?: string | null): Promise<PDFImage | null> {
    if (!url || !url.trim()) return null;
    const bytes = await fetchBytes(url);
    if (!bytes || bytes.length === 0) return null;
    try {
      return await this.doc.embedPng(bytes);
    } catch {
      try {
        return await this.doc.embedJpg(bytes);
      } catch {
        return null;
      }
    }
  }

  /**
   * Standard 3-column row: [Sl.No | POINTS | REMARKS:]
   * Dynamically formats and scales nested serial numbers (e.g. 'II. A)', 'O. (I)', 'A. (i)', 'L. 1')
   * so they never wrap to multiple lines or waste vertical row height.
   */
  private drawBandhanRow(
    sl: string,
    points: string,
    remarks: string,
    isBoldPts: boolean = true,
    isBoldRem: boolean = false,
    fontSize: number = TABLE_FONT_SIZE,
    bgHex?: string
  ): void {
    const remText = remarks ?? '';
    const rawSl = (sl ?? '').trim();

    // Dynamically calculate font size for Serial Number to guarantee it fits cleanly on 1 line
    let slFs = fontSize;
    if (rawSl) {
      const font = this.getFont(isBoldPts, false);
      const maxSlW = this.colSl - CELL_PAD_X * 2;
      while (slFs > 8.5 && font.widthOfTextAtSize(this.sanitizeText(rawSl), slFs) > maxSlW) {
        slFs -= 0.5;
      }
    }

    const hSl = rawSl ? this.cellHeight(rawSl, this.colSl, { bold: isBoldPts, fontSize: slFs }) : TABLE_MIN_ROW_H;
    const hPts = this.cellHeight(points, this.colPts, { bold: isBoldPts, fontSize });
    const hRem = this.cellHeight(remText, this.colRem, { bold: isBoldRem, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hSl, hPts, hRem);

    this.checkPageBreak(rowH);

    // 1. Sl No
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, rawSl, {
      bold: isBoldPts,
      fontSize: slFs,
      align: 'center',
      vAlign: 'top',
      fillColor: bgHex,
    });

    // 2. POINTS
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colPts, rowH, points, {
      bold: isBoldPts,
      fontSize,
      align: 'left',
      vAlign: 'top',
      fillColor: bgHex,
    });

    // 3. REMARKS
    this.drawCell(MARGIN_L + this.colSl + this.colPts, this.cursorY, this.colRem, rowH, remText, {
      bold: isBoldRem,
      fontSize,
      align: 'left',
      vAlign: 'top',
      fillColor: bgHex,
    });

    this.cursorY += rowH;
  }

  /**
   * Standard 2-column row: [LABEL | VALUE]
   */
  private draw2ColRow(
    label: string,
    val: string,
    isBoldLbl: boolean = true,
    isBoldVal: boolean = false,
    bgHex?: string,
    fontSize: number = TABLE_FONT_SIZE
  ): void {
    const vText = val ?? '';
    const hLbl = this.cellHeight(label, this.colLbl2, { bold: isBoldLbl, fontSize });
    const hVal = this.cellHeight(vText, this.colVal2, { bold: isBoldVal, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hLbl, hVal);

    this.checkPageBreak(rowH);

    this.drawCell(MARGIN_L, this.cursorY, this.colLbl2, rowH, label, {
      bold: isBoldLbl,
      fontSize,
      align: 'left',
      vAlign: 'top',
      fillColor: bgHex,
    });

    this.drawCell(MARGIN_L + this.colLbl2, this.cursorY, this.colVal2, rowH, vText, {
      bold: isBoldVal,
      fontSize,
      align: 'left',
      vAlign: 'top',
      fillColor: bgHex,
    });

    this.cursorY += rowH;
  }

  /**
   * Draw section spanner banner using regular table text size (just bold)
   */
  private drawSectionSpanner(title: string, subTitle?: string, fontSize: number = TABLE_FONT_SIZE, fillColor?: string): void {
    const fullTitle = subTitle ? `${title}\n${subTitle}` : title;
    const h = this.cellHeight(fullTitle, CONTENT_W, { bold: true, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, h);

    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, rowH, fullTitle, {
      bold: true,
      fontSize,
      align: 'left',
      vAlign: 'middle',
      fillColor,
    });
    this.cursorY += rowH;
  }

  /**
   * Internal pass to render all sections sequentially with optional explicit reportPagesCount
   */
  public async renderAllSections(fields: BandhanSMEReportFields, explicitPageCount?: string): Promise<void> {
    // 1. Cover Letterhead & Basic Information (Section I)
    this.renderBasicInformationSection(fields);

    // 2. Valuation of Land (Section II)
    this.renderValuationOfLandSection(fields);

    // 3. Valuation of Building (Section III - Parts 1 to 5 + 6.0 Total Abstract Matrix)
    this.renderValuationOfBuildingSection(fields);

    // 4. Standalone: Remarks & Certificate of Valuation / Valuer Opinion
    this.renderRemarksAndOpinionSection(fields);

    // 5. Standalone: Valuer Declaration & Credentials Sign-Off Block
    this.renderDeclarationAndSignoffSection(fields, explicitPageCount);

    // 6. Standalone: Valuation Report Check-List
    this.renderChecklistSection(fields);

    // 7. Standalone: Enclosures (Documents, Maps, Photos)
    await this.renderEnclosures(fields);
  }

  /**
   * Main PDF Generation Entrance with Two-Pass Page Count Guarantee
   */
  public async generateBandhanSMEReport(fields: BandhanSMEReportFields): Promise<Uint8Array> {
    const res = await this.generateBandhanSMEReportWithCount(fields);
    return res.pdfBytes;
  }

  /**
   * Generates PDF with exact Two-Pass Page Count guarantee and returns both bytes & exact page count
   */
  public async generateBandhanSMEReportWithCount(fields: BandhanSMEReportFields): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
    // If locked by user, render single pass with user's custom count
    if (fields.reportPagesCountLocked && fields.reportPagesCount) {
      await this.init();
      await this.renderAllSections(fields, fields.reportPagesCount);
      const exactCount = this.doc.getPageCount();
      const bytes = await this.save();
      return { pdfBytes: bytes, pageCount: exactCount };
    }

    // Auto Mode: Two-Pass Rendering
    const photoCount = (fields.propertyPhotos && fields.propertyPhotos.length > 0)
      ? fields.propertyPhotos.length
      : (fields.propertyImages?.length || 0);
    const photoPages = photoCount > 0 ? Math.ceil(photoCount / 2) : 0;
    const rorCount = (fields.mouzaMapImages && fields.mouzaMapImages.length > 0) ? fields.mouzaMapImages.length : (fields.rorImageUrl ? 1 : 0);
    const locCount = (fields.locationMapImages && fields.locationMapImages.length > 0) ? fields.locationMapImages.length : (fields.locationMapImageUrl ? 1 : 0);
    const bhuCount = (fields.cadastralMapImages && fields.cadastralMapImages.length > 0) ? fields.cadastralMapImages.length : ((fields.bhuNakshaImages && fields.bhuNakshaImages.length > 0) ? fields.bhuNakshaImages.length : (fields.bhuNakshaImageUrl ? 1 : 0));
    const guideCount = (fields.sketchMapImages && fields.sketchMapImages.length > 0) ? fields.sketchMapImages.length : ((fields.guidelineRateImages && fields.guidelineRateImages.length > 0) ? fields.guidelineRateImages.length : (fields.guidelineValueImageUrl ? 1 : 0));
    const bdaCount = fields.bdaMapImages?.length || 0;
    const totalMaps = rorCount + locCount + bhuCount + guideCount + bdaCount;
    const mapPages = totalMaps > 0 ? Math.ceil(totalMaps / 2) : 0;
    const initialEstimate = String(8 + photoPages + mapPages);

    await this.init();
    await this.renderAllSections(fields, initialEstimate);
    const pass1Count = this.doc.getPageCount();

    if (String(pass1Count) === initialEstimate) {
      const bytes = await this.save();
      return { pdfBytes: bytes, pageCount: pass1Count };
    }

    // Pass 2: Re-render with the exact page count measured from Pass 1
    const pass2Renderer = new PDFBandhanSMERenderer();
    await pass2Renderer.init();
    await pass2Renderer.renderAllSections(fields, String(pass1Count));
    const finalCount = pass2Renderer.doc.getPageCount();
    const finalBytes = await pass2Renderer.save();
    return { pdfBytes: finalBytes, pageCount: finalCount };
  }

  // ==========================================================================
  // 1. SECTION I: BASIC INFORMATION
  // ==========================================================================
  private renderBasicInformationSection(fields: BandhanSMEReportFields): void {
    this.drawSectionSpanner('I. BASIC INFORMATION:', undefined, TABLE_FONT_SIZE, LBL_BG);

    this.drawBandhanRow('A.', 'NAME OF THE BANK BRANCH / CBO / Asset Centre:', fields.branchName || '');

    const hasLetterNo = Boolean(fields.bankLetterNo && fields.bankLetterNo.trim() && fields.bankLetterNo.trim() !== 'NA' && fields.bankLetterNo.trim() !== 'N/A');
    const hasLetterDate = Boolean(fields.bankLetterDate && fields.bankLetterDate.trim() && fields.bankLetterDate.trim() !== 'NA' && fields.bankLetterDate.trim() !== 'N/A');

    let bankLetterFormatted = '';
    if (hasLetterNo || hasLetterDate) {
      const parts: string[] = [];
      if (hasLetterNo) parts.push(`Bank Letter No.: ${fields.bankLetterNo!.trim()}`);
      if (hasLetterDate) parts.push(`Date: ${fields.bankLetterDate!.trim()}`);
      bankLetterFormatted = parts.join('\n');
    } else if (fields.letterNoAndDate && fields.letterNoAndDate.trim() && fields.letterNoAndDate.trim() !== 'NA' && fields.letterNoAndDate.trim() !== 'N/A') {
      const cleanedLines = fields.letterNoAndDate.trim().split('\n').map(l => l.trim()).filter(l => {
        if (l === 'Bank Letter No.:' || l === 'Bank Letter No.' || l === 'Bank Letter No:' || l === 'Date:' || l === 'Date.:') return false;
        return Boolean(l);
      });
      bankLetterFormatted = cleanedLines.join('\n');
    }

    this.drawBandhanRow('B.', 'BANK LETTER NO. & DATE-REQUESTING FOR UNDERTAKING VALUATION:', bankLetterFormatted);
    this.drawBandhanRow('C.', 'WHETHER VALUATION WAS MADE AT THE REQUEST OF THE BORROWER? :', fields.valuationMadeAtBorrowerRequest || 'No');
    this.drawBandhanRow('D.', 'NAME OF THE MANAGER/OFFICER WHO ACCOMPANIED THE VALUER:', fields.managerAccompanied || '');
    this.drawBandhanRow('E.', 'VALUATION: WHETHER FRESH/REVALUATION/PERIODIC VALUATION:', fields.valuationType || 'Fresh Valuation');
    this.drawBandhanRow('F.', 'DATE OF EARLIER VALUATION, IF ANY:', fields.dateOfEarlierValuation || '');
    this.drawBandhanRow('G.', 'NAME OF THE PREVIOUS VALUER, IF ANY:', fields.previousValuerName || '');
    this.drawBandhanRow('H.', 'DATE OF VISIT TO THE PROPERTY:', fields.dateOfVisit || '');
    this.drawBandhanRow('I.', 'DATE ON WHICH VALUATION IS MADE:', fields.dateOfValuation || fields.reportDate || '');
    this.drawBandhanRow('J.', 'PERSON(S) IN PRESENCE OF WHOM VALUATION IS MADE:', fields.personsPresent || '');
    this.drawBandhanRow('K.', 'LIST OF DOCUMENTS PRODUCED FOR VERIFICATION:', fields.documentsProduced || '');

    // L. Borrower Details sub-block
    this.drawBandhanRow('L.', 'NAME OF THE BORROWER / BORROWAL ACCOUNT WITH ADDRESS, TELEPHONE NOS.& NATURE OF BUSINESS:', '', true, true);
    this.drawBandhanRow('', 'NAME:', fields.borrowerName || '', true, false);
    this.drawBandhanRow('', 'AT:', fields.borrowerAt || '', true, false);
    this.drawBandhanRow('', 'P.O:', fields.borrowerPo || '', true, false);
    this.drawBandhanRow('', 'PS:', fields.borrowerPs || '', true, false);
    this.drawBandhanRow('', 'DIST:', fields.borrowerDist || '', true, false);
    this.drawBandhanRow('', 'PHONE NO:', fields.borrowerPhone || '', true, false);

    // M. Owner Details sub-block
    this.drawBandhanRow('M.', 'NAME / ADDRESS / TELEPHONE NO. OF THE OWNER/OWNER(S) OF THE PROPERTY:', '', true, true);
    this.drawBandhanRow('', 'NAME:', fields.ownerName || '', true, false);
    this.drawBandhanRow('', 'AT:', fields.ownerAt || '', true, false);
    this.drawBandhanRow('', 'P.O:', fields.ownerPo || '', true, false);
    this.drawBandhanRow('', 'P.S:', fields.ownerPs || '', true, false);
    this.drawBandhanRow('', 'PIN:', fields.ownerPin || '', true, false);
    this.drawBandhanRow('', 'DIST:', fields.ownerDist || '', true, false);
    this.drawBandhanRow('', 'PHONE NO:', fields.ownerPhone || '', true, false);
    this.drawBandhanRow('', "FATHER'S NAME (In case Property in Name of Individual):", fields.ownerFatherName || '', true, false);
  }

  // ==========================================================================
  // 2. SECTION II: VALUATION OF LAND
  // ==========================================================================
  private renderValuationOfLandSection(fields: BandhanSMEReportFields): void {
    this.cursorY += 8;
    this.drawSectionSpanner('II. VALUATION OF LAND:', undefined, TABLE_FONT_SIZE, LBL_BG);

    // 1. Details of Property
    this.drawSectionSpanner('1. DETAILS OF PROPERTY:');
    this.drawBandhanRow('A.', 'DETAILS OF PROPERTY OFFERED AS SECURED:', fields.detailsPropertyOffered || 'Land & Building');
    this.drawBandhanRow('B.', 'DATE OF ACQUISITION/PURCHASE OF LAND:', fields.dateAcquisitionLand || '');
    this.drawBandhanRow('C.', 'VALUE OF THE PROPERTY AS PER REGD. SALE DEED:', fields.valueAsPerSaleDeed || '');
    this.drawBandhanRow('D.', 'SALE DEED / TITLE DEED DOCUMENT NO:', fields.saleDeedDocNo || '');
    this.drawBandhanRow('E.', 'AREA OF LAND (AS PER DOCUMENT/TITLE DEED):', fields.areaLandDoc || '');
    this.drawBandhanRow('F.', 'AREA OF LAND (AS PER ROR):', fields.areaLandRor || '');
    this.drawBandhanRow('G.', 'AREA OF LAND (AS PER PHYSICAL MEASUREMENT):', fields.areaLandPhysical || '');

    // H. Location of Property & Postal Address sub-block
    this.drawBandhanRow('H.', 'LOCATION OF THE PROPERTY AND POSTAL ADDRESS:', '', true, true);
    this.drawBandhanRow('', 'PLOT NO:', fields.plotNo || '', true, false);
    this.drawBandhanRow('', 'DAG NO/KHATIAN NO/RS NO:', fields.khataNo || '', true, false);
    this.drawBandhanRow('', 'AT:', fields.propAt || '', true, false);
    this.drawBandhanRow('', 'PO:', fields.propPo || '', true, false);
    this.drawBandhanRow('', 'P.S:', fields.propPs || '', true, false);
    this.drawBandhanRow('', 'PIN:', fields.propPin || '', true, false);
    this.drawBandhanRow('', 'DIST:', fields.propDist || '', true, false);

    this.drawBandhanRow('I.', 'URBAN/SEMI URBAN/RURAL:', fields.urbanSemiUrbanRural || 'Urban Area');
    this.drawBandhanRow('J.', 'WHETHER THE PROPERTY IS SITUATED IN RESIDENTIAL/COMMERCIAL / MIXED / INDUSTRIAL AREA:', fields.situatedAreaType || 'Residential cum Commercial Area');
    this.drawBandhanRow('K.', 'CLASSIFICATION OF LOCALITY- I.E KIND OF PEOPLE STAYING (HIGH / MIDDLE / POOR CLASS):', fields.classificationOfLocality || 'Middle Class');
    this.drawBandhanRow('L.', 'TYPE OF PROPERTY:', fields.typeOfProperty || 'Land & building');
    this.drawBandhanRow('(I)', 'AGRICULTURAL:', fields.isAgricultural || 'No');
    this.drawBandhanRow('A)', 'IN CASE IT IS AN AGRICULTURAL LAND, ANY CONVERSION TO HOUSE SITE PLOTS IS CONTEMPLATED:', fields.agriculturalConversionContemplated || 'Not Applicable');
    this.drawBandhanRow('(II)', 'INDUSTRIAL:', fields.isIndustrial || 'No');
    this.drawBandhanRow('A)', 'IF THE PROPERTY IS INDUSTRIAL-STATE FOR WHAT TYPE OF ACTIVITY/INDUSTRY THE PROPERTY IS WELL SUITED:', fields.isIndustrial === 'Yes' ? fields.industrialActivitySuited || 'Yes' : 'Not Applicable');
    this.drawBandhanRow('(III)', 'RESIDENTIAL: (ANY RESTRICTIVE CLAUSES FOR SALE ETC. TO BE FURNISHED).', fields.isResidential || 'Yes');
    this.drawBandhanRow('(IV)', 'COMMERCIAL:', fields.isCommercial || 'Yes');
    this.drawBandhanRow('(V)', 'INSTITUTIONAL:', fields.isInstitutional || 'No');
    this.drawBandhanRow('(VI)', 'OTHERS (SPECIFY):', fields.isOthersSpecify || 'No');

    // 2. Title, Ownership & Rent
    this.drawBandhanRow('2.1', 'TITLE OF THE PROPERTY FREE HOLD / LEASE HOLD:', fields.titleFreeholdLeasehold || 'It is a free hold land');
    this.drawBandhanRow('A.', 'OWNERSHIP OF THE PROPERTY:', fields.ownershipOfProperty || 'Single Ownership');
    this.drawBandhanRow('B.', 'IN CASE OF JOINT OWNERSHIP WHETHER SHARE IS UNDIVIDED/DIVIDED. IF UNDIVIDED, SHARE OF EACH OWNER:', fields.jointOwnershipShare || 'Not Applicable');
    this.drawBandhanRow('C.', 'TAXES PAID UP TO:', fields.taxesPaidUpTo || 'We have not verified any recent rent receipt');
    this.drawBandhanRow('D.', 'LAND REVENUE:', fields.landRevenue || 'We have not verified any recent rent receipt');
    this.drawBandhanRow('E.', 'LAND/BUILDING MUNICIPAL TAXES:', fields.landBuildingMunicipalTaxes || 'We have not verified any recent rent receipt');
    this.drawBandhanRow('F.', 'WEALTH TAX ASSESSED/PAID, IF ANY:', fields.wealthTaxAssessedPaid || 'Not Applicable');

    // 2.2 If Leasehold
    this.drawBandhanRow('2.2', 'IF LEASE HOLD:', '', true, true);
    this.drawBandhanRow('A.', 'NAME OF THE LESSOR:', fields.lessorName || 'Not Applicable');
    this.drawBandhanRow('B.', 'NAME OF THE LESSEE:', fields.lesseeName || 'Not Applicable');
    this.drawBandhanRow('C.', 'NATURE OF LEASE:', fields.natureOfLease || 'Not Applicable');
    this.drawBandhanRow('D.', 'DATE OF COMMENCEMENT OF LEASE:', fields.dateCommencementLease || 'Not Applicable');
    this.drawBandhanRow('E.', 'PERIOD OF LEASE:', fields.periodOfLease || 'Not Applicable');
    this.drawBandhanRow('G.', 'TERMS OF RENEWAL:', fields.termsOfRenewal || 'Not Applicable');
    this.drawBandhanRow('H.', 'LEASE PREMIUM / RENT PER ANNUM:', fields.leasePremiumRentPerAnnum || 'Not Applicable');
    this.drawBandhanRow('I.', 'UN-EXPIRED PERIOD OF LEASE:', fields.unexpiredPeriodOfLease || 'Not Applicable');
    this.drawBandhanRow('J.', 'INITIAL PREMIUM:', fields.initialPremium || 'Not Applicable');
    this.drawBandhanRow('K.', 'GROUND RENT PAYABLE PER ANNUM:', fields.groundRentPerAnnum || 'Not Applicable');
    this.drawBandhanRow('L.', 'UNEARNED INCREASE PAYABLE TO THE LESSOR IN THE EVENT OF SALE OR TRANSFER:', fields.unearnedIncreasePayable || 'Not Applicable');
    this.drawBandhanRow('M.', 'WHETHER LEASE AGREEMENT PERMITS CREATION OF MORTGAGE:', fields.leasePermitsMortgage || 'Not Applicable');

    // 2.3 Rent Details
    this.drawBandhanRow('2.3', 'RENT:', fields.rentOccupationStatus || 'The Plot is occupied by Owner');
    this.drawBandhanRow('A.', 'NAMES OF TENANTS/LESSEES / LICENSEES, ETC.:', fields.tenantNames || 'Not Applicable');
    this.drawBandhanRow('B.', 'PORTION IN THEIR OCCUPATION:', fields.tenantPortionOccupied || 'Not Applicable');
    this.drawBandhanRow('C.', 'MONTHLY OR ANNUAL RENT / COMPENSATION / LICENSE FEE, ETC. PAID BY EACH:', fields.monthlyAnnualRentPaid || 'Not Applicable');
    this.drawBandhanRow('D.', 'GROSS AMOUNT RECEIVE FOR THE WHOLE PROPERTY:', fields.grossRentReceived || 'Not Applicable');

    // 3. Brief Description of Property
    this.drawSectionSpanner('3. BRIEF DESCRIPTION OF THE PROPERTY:');
    this.drawBandhanRow('A.', 'ADDRESS OF THE PROPERTY IN DETAIL (PIN NO. TO BE CAPTURED MANDATORILY):', fields.detailedAddressWithPin || '');
    this.drawBandhanRow('B.', 'MUNICIPALITY WARD NO:', fields.municipalityWardNo || '');
    this.drawBandhanRow('C.', 'STREET NO.:', fields.streetNo || '');
    this.drawBandhanRow('D.', 'SURVEY/PLOT NO.:', fields.surveyPlotNo || '');
    this.drawBandhanRow('E.', 'KHATA NO.:', fields.briefKhataNo || '');
    this.drawBandhanRow('F.', 'MOUZA:', fields.mouza || '');
    this.drawBandhanRow('G.', 'THANA NO:', fields.thanaNo || '');
    this.drawBandhanRow('H.', 'TEHASIL NO.:', fields.tehasilNo || '');
    this.drawBandhanRow('I.', 'TEHASIL:', fields.tehasil || '');
    this.drawBandhanRow('J.', 'SRO:', fields.sro || '');
    this.drawBandhanRow('K.', 'POLICE STATION (P.S):', fields.policeStation || '');
    this.drawBandhanRow('L.', 'VILLAGE/TOWN/CITY:', fields.villageTownCity || 'City');
    this.drawBandhanRow('M.', 'DISTRICT:', fields.district || '');
    this.drawBandhanRow('N.', 'STATE:', fields.state || 'Odisha');

    // O. Dimensions & Extent
    this.drawBandhanRow('O.', 'DIMENSIONS & EXTENT OF THE SITE:', '', true, true);
    this.drawBandhanRow('(I)', 'DIMENSIONS OF THE SITE AS PER DOCUMENT:', '', true, true);
    this.drawBandhanRow('A)', 'EAST TO WEST:', fields.dimensionDocEastWest || 'As per Sketch Map');
    this.drawBandhanRow('B)', 'NORTH TO SOUTH:', fields.dimensionDocNorthSouth || 'As per Sketch Map');
    this.drawBandhanRow('(II)', 'DIMENSIONS OF THE SITE AS PER MEASUREMENT:', '', true, true);
    this.drawBandhanRow('A)', 'EAST TO WEST:', fields.dimensionMeasEastWest || 'As per Sketch Map');
    this.drawBandhanRow('B)', 'NORTH TO SOUTH:', fields.dimensionMeasNorthSouth || 'As per Sketch Map');
    this.drawBandhanRow('(III)', 'EXTENT OF SITE:', fields.extentOfSite || '');
    this.drawBandhanRow('(IV)', 'EXTENT OF SITE CONSIDERED FOR VALUATION PURPOSE:', fields.extentConsideredValuation || '');

    // Boundaries P) 1) & 2)
    this.renderBoundarySchedules(fields);

    // 3. Characteristics of the Site
    this.drawSectionSpanner('3. CHARACTERISTICS OF THE SITE:');
    this.drawBandhanRow('A.', 'LEVEL OF LAND WITH TOPOGRAPHICAL CONDITION:', fields.levelOfLand || 'Leveled and Plain');
    this.drawBandhanRow('B.', 'USE TO WHICH IT CAN BE PUT:', fields.useToWhichCanBePut || 'Residential cum Commercial Purpose');
    this.drawBandhanRow('C.', 'IS THERE ANY AGREEMENT OF EASEMENTS (ENCROACHMENTS)? IF SO, DETAILS:', fields.easementAgreements || 'No such agreement verified');
    this.drawBandhanRow('D.', 'IS THERE ANY RESTRICTIVE COVENANT IN REGARD TO USE OF LAND? IF SO, ATTACH A COPY OF THE COVENANT:', fields.restrictiveCovenant || 'No');
    this.drawBandhanRow('E.', 'APPROVAL LETTER NO.& DATE OF DEVELOPMENT AGENCIES / MUNICIPALITY ETC. AUTHORIZING CONSTRUCTION:', fields.approvalLetterNoDateDevelopment || 'Not Applicable');
    this.drawBandhanRow('F.', 'WHETHER BUILDING USE CERTIFICATE FROM THE DEVELOPMENT AUTHORITIES / MUNICIPALITY ETC. HAS BEEN OBTAINED:', fields.buildingUseCertificateObtained || 'Not Applicable');
    this.drawBandhanRow('G.', 'DOES THE LAND FALL IN AN AREA INCLUDED IN ANY TOWN PLANNING SCHEME OR DEVELOPMENT PLAN OF GOVERNMENT/STATUTORY BODY?:', fields.townPlanningSchemeInclusion || '');
    this.drawBandhanRow('H.', 'CORNER OR INTERMITTENT PLOT:', fields.cornerOrIntermittentPlot || 'Intermittent Plot');
    this.drawBandhanRow('I.', 'IS A LAND LOCKED LAND?:', fields.isLandLocked || 'No');
    this.drawBandhanRow('', 'WHETHER THE LAND IS HAVING FREE ACCESS:', fields.hasFreeAccess || 'Yes (15 ft wide CC Road)');
    this.drawBandhanRow('J.', 'MEANS AND PROXIMITY TO SURFACE COMMUNICATION BY WHICH THE LOCALITY IS SERVED:', fields.surfaceCommunicationProximity || fields.freeAccessAndProximity || 'Bike, Car, Auto, Bus');
    this.drawBandhanRow('K.', 'ROAD FACILITIES:', fields.roadFacilities || 'Yes, Available at site');
    this.drawBandhanRow('L.', 'ROAD (KIND OF ROAD AND WIDTH):', fields.roadKindAndWidth || '15 ft wide BT Road');
    this.drawBandhanRow('M.', 'IF THE PROPERTY IS NOT WITHIN THE CITY/TOWN/MUNICIPAL LIMIT THEN STATE THE DISTANCE OF THE PROPERTY FROM THE:', fields.distMunicipalLimitStatus || '');
    this.drawBandhanRow('a.', 'MUNICIPAL OFFICE:', fields.distMunicipalOffice || 'Bhubaneswar');
    this.drawBandhanRow('b.', 'MUNICIPAL LIMITS:', fields.distMunicipalLimits || 'Bhubaneswar Municipal Corporation');
    this.drawBandhanRow('N.', 'WATER POTENTIALITIES:', fields.waterPotentialities || 'Good');
    this.drawBandhanRow('O.', 'POSSIBILITY OF FREQUENT FLOODING:', fields.possibilityFlooding || 'No');
    this.drawBandhanRow('P.', 'UNDERGROUND SEWERAGE SYSTEM AVAILABILITY:', fields.undergroundSewerageAvailable || 'No');
    this.drawBandhanRow('Q.', 'DRAINAGE SYSTEMS AVAILABLE:', fields.drainageSystemsAvailable || 'Surface Drainage');
    this.drawBandhanRow('R.', 'IS POWER SUPPLY AVAILABLE IN THE SITE?:', fields.powerSupplyAvailable || 'Yes');
    this.drawBandhanRow('S.', 'DEVELOPMENT OF SURROUNDING AREAS:', fields.surroundingDevelopment || 'Residential Buildings');

    // Proximity to Civic Amenities
    this.drawBandhanRow('T.', 'PROXIMITY TO CIVIC AMENITIES:', '', true, true);
    this.drawBandhanRow('(i)', 'SCHOOL:', fields.proximitySchool || '');
    this.drawBandhanRow('(ii)', 'COLLEGE:', fields.proximityCollege || '');
    this.drawBandhanRow('(iii)', 'HOSPITAL:', fields.proximityHospital || '');
    this.drawBandhanRow('(iv)', 'MARKET:', fields.proximityMarket || '');
    this.drawBandhanRow('(v)', 'BUS STAND:', fields.proximityBusStand || '');
    this.drawBandhanRow('(vi)', 'RAILWAY STATION:', fields.proximityRailwayStation || '');
    this.drawBandhanRow('(vii)', 'ANY OTHER IMPORTANT PLACE:', fields.proximityOtherPlace || '');
    this.drawBandhanRow('U.', 'LATITUDE/LONGITUDE:', fields.latitudeLongitude || '');

    // 4. Location Advantages & Disadvantages
    this.drawSectionSpanner('4. LOCATION ADVANTAGES & DISADVANTAGES:');
    this.drawBandhanRow('A.', 'LOCATION ADVANTAGES:', fields.locationAdvantages || '');
    this.drawBandhanRow('B.', 'LOCATION DISADVANTAGES (DETAILS):', fields.locationDisadvantages || 'Nothing Observed');

    // 5. Other Issues / Points
    this.drawSectionSpanner('5. OTHER ISSUES/POINTS:');
    this.drawBandhanRow('A.', 'HAS THE WHOLE OR PART OF THE LAND BEEN NOTIFIED FOR ACQUISITION BY GOVERNMENT OR ANY STATUTORY BODY?:', fields.landAcquisitionNotification || 'No such documents verified');
    this.drawBandhanRow('B.', 'HAS ANY CONTRIBUTION BEEN MADE TOWARDS DEVELOPMENT OR IS ANY DEMAND FOR SUCH CONTRIBUTION STILL OUT STANDING:', fields.developmentContributionDemanded || 'No such documents verified');
    this.drawBandhanRow('C.', 'WHETHER COVERED UNDER ANY STATE/CENTRAL GOVT ENACTMENTS (E.G URBAN LAND CEILING ACT) OR NOTIFIED UNDER AGENCY/CANTONMENT AREA:', fields.landCeilingEnactments || 'No such documents verified');
    this.drawBandhanRow('D.', 'SALES:', '', true, true);
    this.drawBandhanRow('a.', 'GIVE INSTANCE OF SALES OF IMMOVABLE PROPERTY IN THE LOCALITY, IF AVAILABLE, INDICATING THE NAME AND ADDRESS OF THE PROPERTY, REGISTRATION NO. SALE PRICE AND AREA OF THE LAND SOLD:', fields.salesInstancesInLocality || 'Transactions of the property are not available in the locality');
    this.drawBandhanRow('b.', 'IF SALE INSTANCE ARE NOT AVAILABLE OR NOT RELIED UPON, PLEASE FURNISHED THE BASIS OF ARRIVING AT THE LAND RATE:', fields.salesBasisArrivingLandRate || 'The present market rate of land confirmed through local enquiry and property dealers and found to be acceptable.');
    this.drawBandhanRow('c.', 'LAND RATE ADOPTED IN THIS VALUATION:', fields.adoptedLandRateRationale || '');

    // 6. Valuation of Land
    this.drawSectionSpanner('6. VALUATION:');
    this.drawBandhanRow('A.', 'PREVIOUS VALUATION DETAILS:', fields.previousValuationDetails || 'Not Available');
    this.drawBandhanRow('B.', 'PRESENT VALUATION DETAILS:', '', true, true);
    this.drawBandhanRow('', '(HERE THE REGISTERED VALUE SHOULD DISCUSS IN DETAIL HIS APPROACH IN VALUATION OF THE PROPERTY AND INDICATE HOW THE VALUE HAS BEEN ARRIVED AT, SUPPORTED BY NECESSARY CALCULATIONS.):', fields.presentValuationApproachDetails || 'Land & Building Method has been adopted for valuation purpose.');
    this.drawBandhanRow('1', 'VALUATION OF LAND:', fields.landAreaTotal || fields.extentOfSite || '');
    this.drawBandhanRow('2', 'GOVT. VALUE:', fields.landGovtValueTotal || '', true, true);
    this.drawBandhanRow('3', 'MARKET VALUE:', fields.landMarketValueTotal || '', true, true);

    const distPctDisplay = (fields.distressSalePct !== undefined && fields.distressSalePct !== '') ? `${fields.distressSalePct}%` : '100%';
    const realPctDisplay = (fields.realisableValuePct !== undefined && fields.realisableValuePct !== '') ? `${fields.realisableValuePct}%` : '100%';

    this.drawBandhanRow('4', `DISTRESS SALE VALUE (${distPctDisplay}):`, fields.landDistressValue || '', true, true);
    this.drawBandhanRow('5', `REALISABLE ESTIMATION OF THE PROPERTY IN CASE OF DISTRESS SALE, IN CASE, THE BANK WILL SELL THE PROPERTY THROUGH PROCEEDINGS. (${realPctDisplay}):`, fields.landRealisableValue || '', true, true);
  }

  // --------------------------------------------------------------------------
  // Helper: Multi-Plot Boundaries Schedule
  // --------------------------------------------------------------------------
  private renderBoundarySchedules(fields: BandhanSMEReportFields): void {
    const deedPlots = (fields.documentPlotBoundaries && fields.documentPlotBoundaries.length > 0)
      ? fields.documentPlotBoundaries
      : [
          { plotNo: fields.plotNo || 'Schedule 1', east: 'As per deed', west: 'As per deed', north: 'Road', south: 'As per deed' }
        ];

    this.drawBandhanRow('P.', 'BOUNDARIES OF THE PROPERTY:', '', true, true);
    this.drawBandhanRow('1)', 'BOUNDARIES (AS PER DOCUMENT):', '', true, true);

    for (const dp of deedPlots) {
      if (deedPlots.length > 1) {
        this.drawBandhanRow('', `SCHEDULE FOR PLOT / TITLE: ${dp.plotNo || 'Deed Schedule'}`, '', true, true);
      }
      this.drawBandhanRow('(i)', 'EAST:', dp.east || '', true, false);
      this.drawBandhanRow('(ii)', 'WEST:', dp.west || '', true, false);
      this.drawBandhanRow('(iii)', 'NORTH:', dp.north || '', true, false);
      this.drawBandhanRow('(iv)', 'SOUTH:', dp.south || '', true, false);
    }

    this.drawBandhanRow('2)', 'BOUNDARIES (AS PER VERIFICATION):', '', true, true);
    const physPlots = fields.physicalPlotBoundaries || [];

    for (let i = 0; i < deedPlots.length; i++) {
      const dp = deedPlots[i];
      const pp = physPlots[i];
      if (deedPlots.length > 1) {
        this.drawBandhanRow('', `SCHEDULE FOR PLOT / TITLE: ${dp.plotNo || `Schedule ${i + 1}`}`, '', true, true);
      }
      const east = pp?.east || (i === 0 ? fields.verifiedBoundaryEast || '' : '');
      const west = pp?.west || (i === 0 ? fields.verifiedBoundaryWest || '' : '');
      const north = pp?.north || (i === 0 ? fields.verifiedBoundaryNorth || '' : '');
      const south = pp?.south || (i === 0 ? fields.verifiedBoundarySouth || '' : '');
      this.drawBandhanRow('(i)', 'EAST:', east, true, false);
      this.drawBandhanRow('(ii)', 'WEST:', west, true, false);
      this.drawBandhanRow('(iii)', 'NORTH:', north, true, false);
      this.drawBandhanRow('(iv)', 'SOUTH:', south, true, false);
    }

    this.drawBandhanRow('3)', '(SKETCH FOR LOCATION OF THE PROPERTY ENCLOSED):', fields.sketchEnclosed || 'Yes, Enclosed', true, false);
  }

  // ==========================================================================
  // 3. VALUATION OF BUILDING
  // ==========================================================================
  private renderValuationOfBuildingSection(fields: BandhanSMEReportFields): void {
    this.cursorY += 8;
    this.drawSectionSpanner('III. VALUATION OF BUILDING:', undefined, TABLE_FONT_SIZE, LBL_BG);

    // 1. Basic Info
    this.drawSectionSpanner('1. BASIC INFORMATION OF THE BUILDING:');
    this.drawBandhanRow('A.', 'TYPE OF BUILDING (RESIDENTIAL/COMMERCIAL/INDUSTRIAL):', fields.buildingType || 'Residential Cum Commercial');
    const derivedYears = (fields.yearConstruction || fields.yearCompletion)
      ? [
          fields.yearConstruction ? `Year of Construction- ${fields.yearConstruction}` : '',
          fields.yearCompletion ? `Year of Completion- ${fields.yearCompletion}` : '',
        ].filter(Boolean).join('                                                     ')
      : fields.yearCommencementCompletion;
    this.drawBandhanRow('B.', 'YEAR OF COMMENCEMENT OF CONSTRUCTION AND YEAR OF COMPLETION:', derivedYears || fields.yearCommencementCompletion || '');
    this.drawBandhanRow('C.', 'TYPE OF CONSTRUCTION-LOAD BEARING WALLS/RCC FRAMES/STEEL FRAME:', fields.typeOfConstruction || 'RCC Frames');
    this.drawBandhanRow('D.', 'ESTIMATED FUTURE LIFE:', fields.estimatedFutureLife ? (fields.estimatedFutureLife.toLowerCase().includes('yr') ? fields.estimatedFutureLife : `${fields.estimatedFutureLife} Yrs`) : '60 Yrs');
    this.drawBandhanRow('E.', 'WHAT IS THE FLOOR SPACE INDEX PERMISSIBLE AND PERCENTAGE ACTUALLY UTILIZED?:', fields.farFsiPermissibleUtilized || 'FAR: 3.46');
    this.drawBandhanRow('F.', 'APPROVAL LETTER NO & DATE OF DEVELOPMENT AUTHORITY/MUNICIPALITY/LOCAL BODY AUTHORISING CONSTRUCTION:', fields.buildingApprovalAuthorityDetails || '');
    this.drawBandhanRow('G.', 'WHETHER THE CONSTRUCTION HAS BEEN MADE AS PER APPROVED PLAN? (DEVIATIONS IF ANY):', fields.constructionAsPerPlanDeviations || 'Yes');

    const defaultFloors: BandhanSMEFloorDetail[] = [
      { floorName: 'Ground Floor', height: fields.floorHeightGF || "10'-6\"", plinthArea: fields.plinthAreaGF || '', doorsWindows: fields.doorsWindowsGF || 'Iron Shutter', flooring: fields.flooringGF || 'VT Flooring', wallFinishing: fields.wallFinishingGF || 'Cement Plastering, Putty, Painting' },
      { floorName: 'First Floor', height: fields.floorHeightFF || 'Do', plinthArea: fields.plinthAreaFF || '', doorsWindows: fields.doorsWindowsFF || 'Sal wood choukath with non sal wood shutter', flooring: fields.flooringFF || 'Do', wallFinishing: fields.wallFinishingFF || 'Do' },
      { floorName: 'Second Floor', height: fields.floorHeightSF || 'Do', plinthArea: fields.plinthAreaSF || '', doorsWindows: fields.doorsWindowsSF || 'Do', flooring: fields.flooringSF || 'Do', wallFinishing: fields.wallFinishingSF || 'Do' },
      { floorName: 'Third Floor', height: fields.floorHeightTF || 'Do', plinthArea: fields.plinthAreaTF || '', doorsWindows: fields.doorsWindowsTF || 'Do', flooring: fields.flooringTF || 'Do', wallFinishing: fields.wallFinishingTF || 'Do' },
    ];

    const floors = Array.isArray(fields.floorDetails) ? fields.floorDetails : defaultFloors;

    // H. Built up Area Details
    const assessmentText = fields.builtUpAreaAssessmentHolding
      ? `As per Assessment of Holding\n${fields.builtUpAreaAssessmentHolding}`
      : (fields.assessmentResidentialArea || fields.assessmentCommercialArea
          ? `As per Assessment of Holding\n${formatAssessmentHoldingStatement(fields.assessmentResidentialArea, fields.assessmentCommercialArea)}`
          : '');

    const actualFloorsText = fields.builtUpAreaAsPerActual
      ? `As per Actual\n${fields.builtUpAreaAsPerActual}`
      : (floors.length > 0 ? `As per Actual\n${formatActualBuiltUpStatement(floors, fields.typeOfConstruction)}` : '');

    const combinedBuiltUp = [assessmentText, actualFloorsText].filter(Boolean).join('\n');

    this.drawBandhanRow('H.', 'BUILT UP AREA DETAILS:', '', true, true);
    this.drawBandhanRow('(I)', 'BUILT UP AREA:', combinedBuiltUp || 'Not Verified');
    this.drawBandhanRow('(II)', 'CARPET AREA:', fields.carpetAreaTotal ? (fields.carpetAreaTotal.includes('Sft') ? fields.carpetAreaTotal : `${parseFloat(fields.carpetAreaTotal).toFixed(2)} Sft (Approx.)`) : (fields.carpetAreaValue ? formatCarpetAreaStatement(fields.carpetAreaValue) : ''));
    this.drawBandhanRow('(III)', 'SALEABLE AREA:', fields.saleableAreaTotal ? (fields.saleableAreaTotal.includes('Sft') ? fields.saleableAreaTotal : `${parseFloat(fields.saleableAreaTotal).toFixed(2)} Sft`) : (fields.saleableAreaValue ? formatSaleableAreaStatement(fields.saleableAreaValue) : ''));

    // Points I to AB (Occupancy & Statutory details)
    this.drawBandhanRow('I.', 'IS THE BUILDING OWNER-OCCUPIED / TENANTED / BOTH?:', fields.buildingOwnerOccupiedTenanted || 'Owner Occupied');
    this.drawBandhanRow('J.', 'IF THE PARTLY OWNER - OCCUPIED SPECIFY PORTION AND EXTENT OF AREA UNDER OWNERS -OCCUPATION:', fields.ownerOccupiedPortion || 'Not Applicable');
    this.drawBandhanRow('K.', 'WHETHER THE PROPERTY IS UNDER RENT CONTROL ACT:', fields.isUnderRentControlAct || 'No');
    this.drawBandhanRow('L.', 'NAMES OF TENANTS / LESSEE / LICENSEES, ETC:', fields.buildingTenantNames || 'Not Applicable');
    this.drawBandhanRow('M.', 'PORTIONS IN THEIR OCCUPATION:', fields.buildingTenantPortions || 'Not Applicable');
    this.drawBandhanRow('N.', 'MONTHLY OR ANNUAL RENT/COMPENSATION /LICENSE FEE, ETC. PAID BY EACH:', fields.buildingMonthlyRent || 'Not Applicable');
    this.drawBandhanRow('O.', 'GROSS AMOUNT RECEIVED FOR THE WHOLE PROPERTY:', fields.buildingGrossRent || 'Not Applicable');
    this.drawBandhanRow('P.', 'ARE ANY OF THE OCCUPANTS RELATED TO, OR CLOSE BUSINESS ASSOCIATES OF THE OWNER?:', fields.occupantsRelatedToOwner || 'Not Applicable');
    this.drawBandhanRow('Q.', 'FIXTURES (FANS, GEYSERS, COOKING RANGES) CHARGES BORNE BY OWNER:', fields.fixturesAmountRecovered || 'Borne by Owner');
    this.drawBandhanRow('R.', 'DETAILS OF WATER AND ELECTRICITY CHARGES BORNE BY OWNER:', fields.waterElectricityChargesBorneBy || 'Borne by Owner');
    this.drawBandhanRow('S.', 'IS ANY DISPUTE BETWEEN LANDLORD AND TENANT REGARDING RENT PENDING IN A COURT OF LAW?:', fields.isRentDisputePendingCourt || 'No');
    this.drawBandhanRow('T.', 'HAS ANY STANDARD RENT BEEN FIXED FOR THE PREMISES UNDER ANY LAW RELATING TO CONTROL OF RENT:', fields.hasStandardRentFixed || 'Not Applicable');
    this.drawBandhanRow('U.', 'HAS THE TENANT TO BEAR THE WHOLE OR PART OF THE COST OF REPAIRS AND MAINTENANCE?:', fields.tenantBearMaintenance || 'Not Applicable');
    this.drawBandhanRow('V.', 'IF A LIFT IS INSTALLED, WHO IS TO BEAR THE COST OF MAINTENANCE AND OPERATIONS-OWNER OR TENANT?:', fields.liftMaintenanceBorneBy || 'Not Applicable');
    this.drawBandhanRow('W.', 'IF A PUMP IS INSTALLED, WHO IS TO BEAR THE COST OF MAINTENANCE AND OPERATIONS-OWNER OR TENANT?:', fields.pumpMaintenanceBorneBy || 'Borne by Owner');
    this.drawBandhanRow('X.', 'WHO HAS TO BEAR THE COST OF ELECTRICITY CHARGES FOR LIGHTING OF COMMON SPACE?:', fields.commonElectricityBorneBy || 'Borne by Owner');
    this.drawBandhanRow('Y.', 'WHAT IS THE AMOUNT OF PROPERTY TAX? WHO IS TO BEAR IT?:', fields.propertyTaxAmountBorneBy || 'No such document is verified');
    this.drawBandhanRow('Z.', 'IS THE BUILDING INSURED? (POLICY NO., AMOUNT, RISKS, PREMIUM):', fields.isBuildingInsuredDetails || 'No such document is verified');
    this.drawBandhanRow('AA.', 'WHETHER UP TO DATE STATUTORY DUES SUCH AS PROPERTY TAX HAVE BEEN PAID:', fields.statutoryDuesPaid || 'No such document is verified');
    this.drawBandhanRow('AB.', 'WHETHER THE BUILDING IS HAVING FREE ACCESS:', fields.buildingFreeAccess || 'Yes');

    // 2. Technical Details of Building
    this.drawSectionSpanner('2. TECHNICAL DETAILS OF THE BUILDING:');
    this.drawBandhanRow('A.', 'NUMBER OF FLOORS & HEIGHT OF EACH FLOOR INCLUDING BASEMENTS, IF ANY:', fields.numberOfFloorsAndHeight || "G+3 Storied Building & Height: 10'-6\"");

    const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)', '(xi)', '(xii)', '(xiii)', '(xiv)', '(xv)', '(xvi)', '(xvii)', '(xviii)', '(xix)', '(xx)'];

    // A. Floor Heights (i, ii, etc.)
    if (floors.length > 0) {
      floors.forEach((fl, idx) => {
        const rom = romans[idx] || `(${idx + 1})`;
        this.drawBandhanRow(rom, `${fl.floorName.toUpperCase()} HEIGHT:`, fl.height || "10'-6\"");
      });
    }

    // B. Plinth Area Floor-Wise
    if (floors.length > 0) {
      this.drawBandhanRow('B.', 'PLINTH AREA FLOOR-WISE:', '', true, true);
      floors.forEach((fl, idx) => {
        const rom = romans[idx] || `(${idx + 1})`;
        this.drawBandhanRow(rom, `PLINTH AREA (${fl.floorName.toUpperCase()}):`, fl.plinthArea ? `${fl.plinthArea} Sft.` : '');
      });
    } else {
      this.drawBandhanRow('B.', 'PLINTH AREA FLOOR-WISE:', 'Not Applicable');
    }

    // C. Condition of Building
    this.drawBandhanRow('C.', 'CONDITION OF THE BUILDING:', '', true, true);
    this.drawBandhanRow('(i)', 'CONDITION OF THE BUILDING (EXTERIOR):', fields.buildingConditionExterior || 'Good');
    this.drawBandhanRow('(ii)', 'CONDITION OF THE BUILDING (INTERIOR):', fields.buildingConditionInterior || 'Good');
    this.drawBandhanRow('D.', 'TYPE OF FOUNDATIONS:', fields.foundationType || 'Column Foundation');

    // E. Doors and Windows Floor-Wise
    if (floors.length > 0) {
      this.drawBandhanRow('E.', 'DOORS AND WINDOWS (FLOOR-WISE):', '', true, true);
      floors.forEach((fl, idx) => {
        const rom = romans[idx] || `(${idx + 1})`;
        this.drawBandhanRow(rom, `DOORS AND WINDOWS (${fl.floorName.toUpperCase()}):`, fl.doorsWindows || 'Sal wood choukath with non sal wood shutter');
      });
    } else {
      this.drawBandhanRow('E.', 'DOORS AND WINDOWS (FLOOR-WISE):', 'Not Applicable');
    }

    // F. Flooring Floor-Wise
    if (floors.length > 0) {
      this.drawBandhanRow('F.', 'FLOORING (FLOOR-WISE):', '', true, true);
      floors.forEach((fl, idx) => {
        const rom = romans[idx] || `(${idx + 1})`;
        this.drawBandhanRow(rom, `FLOORING (${fl.floorName.toUpperCase()}):`, fl.flooring || 'VT Flooring');
      });
    } else {
      this.drawBandhanRow('F.', 'FLOORING (FLOOR-WISE):', 'Not Applicable');
    }

    // G. Wall Finishing Floor-Wise
    if (floors.length > 0) {
      this.drawBandhanRow('G.', 'WALL FINISHING (FLOOR-WISE):', '', true, true);
      floors.forEach((fl, idx) => {
        const rom = romans[idx] || `(${idx + 1})`;
        this.drawBandhanRow(rom, `WALL FINISHING (${fl.floorName.toUpperCase()}):`, fl.wallFinishing || 'Cement Plastering, Putty, Painting');
      });
    } else {
      this.drawBandhanRow('G.', 'WALL FINISHING (FLOOR-WISE):', 'Not Applicable');
    }

    // 3. Construction Specifications
    this.drawSectionSpanner('3. SPECIFICATIONS OF CONSTRUCTION (FLOOR-WISE) IN RESPECT OF:');
    this.drawBandhanRow('A.', 'FOUNDATION:', fields.specFoundation || 'Column Foundation');
    this.drawBandhanRow('B.', 'BASEMENT:', fields.specBasement || 'No');
    this.drawBandhanRow('C.', 'SUPERSTRUCTURE:', fields.specSuperstructure || 'Brick Masonry Super Structure');
    this.drawBandhanRow('D.', 'JOINERY/DOORS & WINDOWS:', fields.specJoineryDoorsWindows || 'Sal wood choukath with non sal wood shutter');
    this.drawBandhanRow('E.', 'RCC WORKS:', fields.specRccWorks || 'Lintel, Chajja, Beam');
    this.drawBandhanRow('F.', 'PLASTERING:', fields.specPlastering || 'Cement Plastering');
    this.drawBandhanRow('G.', 'FLOORING, SKIRTING, DADOING:', fields.specFlooringSkirting || 'VT Flooring');
    this.drawBandhanRow('H.', 'SPECIAL FINISHING (MARBLE, GRANITE, WOODEN PANELING, GRILLS):', fields.specSpecialFinishing || 'Yes');
    this.drawBandhanRow('I.', 'ROOFING INCLUDING WEATHER PROOF COURSE:', fields.specRoofing || 'RCC Roof');
    this.drawBandhanRow('J.', 'DRAINAGE:', fields.specDrainage || 'Surface Drainage');
    this.drawBandhanRow('K.', 'SPECIAL ARCHITECTURAL OR DECORATIVE FEATURES:', fields.specDecorativeFeatures || 'Interior work is done on Second & Third Floor');

    // L. Internal Wiring & Electrical Installations
    this.drawBandhanRow('L.', 'INTERNAL WIRING & ELECTRICAL INSTALLATIONS:', '', true, true);
    this.drawBandhanRow('1', 'INTERNAL WIRING - (CONCEALED / EXTERNAL):', fields.specInternalWiring || 'Concealed');
    this.drawBandhanRow('2', 'CLASS OF FITTINGS: SUPERIOR/ORDINARY:', fields.specWiringFittingsClass || 'Superior');

    this.drawBandhanRow('M.', 'SANITARY INSTALLATION:', fields.specSanitaryInstallation || 'Yes');
    this.drawBandhanRow('N.', 'NO. OF GEYSERS:', fields.specNoOfGeysers || 'Not Verified');
    this.drawBandhanRow('O.', 'CLASS OF FITTING: SUPERIOR / ORDINARY:', fields.specSanitaryFittingsClass || 'Superior');

    // P. Compound Wall
    this.drawBandhanRow('P.', 'COMPOUND WALL DETAILS:', '', true, true);
    this.drawBandhanRow('1', 'COMPOUND WALL:', fields.specCompoundWall || 'Yes');
    this.drawBandhanRow('2', 'HEIGHT AND LENGTH:', fields.specCompoundWallHeightLength || "Height: 5'-0\", Length: 150'-0\"");
    this.drawBandhanRow('3', 'TYPE OF CONSTRUCTION:', fields.specCompoundWallType || 'Brick Masonry Wall with Iron Gate');

    this.drawBandhanRow('Q.', 'NO OF LIFTS AND CAPACITY:', fields.specLiftsCapacity || 'No');
    this.drawBandhanRow('R.', 'UNDERGROUND SUMP -CAPACITY AND TYPE OF CONSTRUCTION:', fields.specUndergroundSump || 'Not Available');

    // S. Overhead Tank
    this.drawBandhanRow('S.', 'OVERHEAD TANK DETAILS:', '', true, true);
    this.drawBandhanRow('1', 'OVERHEAD TANK:', fields.specOverheadTank || 'Yes');
    this.drawBandhanRow('2', 'WHERE LOCATED:', fields.specOverheadTankLocation || 'On the top of the roof');
    this.drawBandhanRow('3', 'CAPACITY:', fields.specOverheadTankCapacity || '2000 Liters');

    this.drawBandhanRow('T.', 'PUMPS - NO. AND THEIR HORSE POWER:', fields.specPumpsHp || '1 Nos & 1 HP Pump');
    this.drawBandhanRow('U.', 'ROADS AND PAVING WITHIN THE COMPOUND:', fields.specRoadsPavingCompound || 'No');
    this.drawBandhanRow('V.', 'SEWAGE DISPOSAL (PUBLIC SEWERS / SEPTIC TANK):', fields.specSewageDisposal || 'Connected to Public Sewers');
    this.drawBandhanRow('W.', 'QUALITY / CLASS OF CONSTRUCTION:', fields.specQualityClassConstruction || 'Good');
    if (fields.specWaterSupply) {
      this.drawBandhanRow('X.', 'WATER SUPPLY (BOREWELL / MUNICIPAL):', fields.specWaterSupply);
    }
    if (fields.specVentilationLighting) {
      this.drawBandhanRow('Y.', 'VENTILATION & NATURAL LIGHTING:', fields.specVentilationLighting);
    }
    if (fields.specFireSafetyArrangements) {
      this.drawBandhanRow('Z.', 'FIRE FIGHTING / SAFETY ARRANGEMENTS:', fields.specFireSafetyArrangements);
    }

    // 4. Details of Building Valuation Table
    this.renderBuildingValuationTable(fields);

    // 5. Sub-Schedules (5.1 Extra Items, 5.2 Amenities, 5.3 Misc, 5.4 Services)
    this.renderSubSchedules(fields);

    // 6.0 Total Abstract Matrix (Land + Building + Sub-Schedules)
    this.renderTotalAbstractMatrix(fields);
  }

  // --------------------------------------------------------------------------
  // Helper: Building Valuation Table (8 columns)
  // --------------------------------------------------------------------------
  private renderBuildingValuationTable(fields: BandhanSMEReportFields): void {
    const rows = (fields.buildingValuationRows && fields.buildingValuationRows.length > 0)
      ? fields.buildingValuationRows
      : [
          {
            description: 'RESIDENTIAL & COMMERCIAL G+3 BUILDING',
            plinthArea: '8624.00',
            height: "10'-6\"",
            age: '3 Yrs',
            replacementRate: 'Rs. 2,500.00',
            replacementCost: 'Rs. 2,15,60,000.00',
            depreciation: 'Rs. 10,78,000.00',
            valueAfterDepreciation: 'Rs. 2,04,82,000.00',
          },
        ];

    this.drawSectionSpanner('4. DETAILS OF BUILDING VALUATION:');

    // 8-Col Header matching exact bank template:
    // Particulars (85) | Plinth (48) | Roof Ht (42) | Age (50) | Repl Rate (62) | Repl Cost (68) | Dep Amt (66) | Net Val (66.28) = 487.28
    const colW = [85, 48, 42, 50, 62, 68, 66, 66.28];
    const headers = [
      'PERTICULARS OF ITEMS',
      'PLINTH AREA IN SQFT',
      'ROOF HEIGHT',
      'AGE OF THE BUILDING IN YEARS',
      'REPLACEMENT RATE OF CONSTRUCTION',
      'ESTIMATED REPLACEMENT COST OF CONSTRUCTION',
      'DEPRECIATION AMOUNT IN RS. (1% per Anm)',
      'NET VALUE AFTER DEPRECIATION',
    ];

    const headerHeights = headers.map((h, i) => this.cellHeight(h, colW[i], { bold: true, fontSize: TABLE_FONT_SIZE }));
    const headerH = Math.max(30, ...headerHeights);
    this.checkPageBreak(headerH);

    let curX = MARGIN_L;
    for (let i = 0; i < headers.length; i++) {
      this.drawCell(curX, this.cursorY, colW[i], headerH, headers[i], {
        bold: true,
        fontSize: TABLE_FONT_SIZE,
        align: 'center',
        vAlign: 'middle',
        fillColor: LBL_BG,
      });
      curX += colW[i];
    }
    this.cursorY += headerH;

    // Data rows
    for (const r of rows) {
      const values = [r.description, r.plinthArea, r.height, r.age, r.replacementRate, r.replacementCost, r.depreciation, r.valueAfterDepreciation];
      const rHeights = values.map((v, i) => this.cellHeight(v || '-', colW[i], { fontSize: TABLE_FONT_SIZE }));
      const rH = Math.max(20, ...rHeights);
      this.checkPageBreak(rH);

      let rx = MARGIN_L;
      for (let i = 0; i < values.length; i++) {
        this.drawCell(rx, this.cursorY, colW[i], rH, values[i] || '-', {
          bold: i === 7,
          fontSize: TABLE_FONT_SIZE,
          align: i === 0 ? 'left' : 'center',
          vAlign: 'middle',
        });
        rx += colW[i];
      }
      this.cursorY += rH;
    }
  }

  // --------------------------------------------------------------------------
  // Helper: 4 Building Sub-Schedules (5.1 Extra Items, 5.2 Amenities, 5.3 Misc, 5.4 Services)
  // --------------------------------------------------------------------------
  private renderSubSchedules(fields: BandhanSMEReportFields): void {
    const renderSchedule = (title: string, items: BandhanSMESubScheduleItem[] | undefined, total: string | undefined) => {
      this.drawSectionSpanner(title);

      if (!items || items.length === 0) {
        this.draw2ColRow('TOTAL:', total || 'Rs. 0.00', true, true);
        return;
      }

      for (const it of items) {
        const costStr = it.cost ? `Rs. ${formatCurrencyINR(parseNum(it.cost))}` : 'Rs. 0.00';
        this.draw2ColRow(it.name, costStr, true, false);
      }
      this.draw2ColRow('TOTAL:', total || 'Rs. 0.00', true, true);
    };

    renderSchedule('5.1 EXTRA ITEMS', fields.extraItems, fields.extraItemsTotal);
    renderSchedule('5.2 AMENITIES', fields.amenities, fields.amenitiesTotal);
    renderSchedule('5.3 MISCELLANEOUS', fields.miscItems, fields.miscItemsTotal);
    renderSchedule('5.4 SERVICES', fields.servicesItems, fields.servicesItemsTotal);
  }

  // --------------------------------------------------------------------------
  // Helper: 6.0 TOTAL ABSTRACT MATRIX (Land + Building + Sub-Schedules)
  // --------------------------------------------------------------------------
  private renderTotalAbstractMatrix(fields: BandhanSMEReportFields): void {
    this.drawSectionSpanner('6.0. TOTAL ABSTRACT OF THE ENTIRE PROPERTY:');

    const distPctDisplay = (fields.distressSalePct !== undefined && fields.distressSalePct !== '') ? `${fields.distressSalePct}%` : '85%';
    const realPctDisplay = (fields.realisableValuePct !== undefined && fields.realisableValuePct !== '') ? `${fields.realisableValuePct}%` : '95%';

    // 5-Col Table: Particulars (115.28) | Govt Value (93) | Market Value (93) | Realizable (93) | Distress (93) = 487.28
    const colW = [115.28, 93, 93, 93, 93];
    const headers = [
      'PERTICULARS',
      'GOVT. VALUE IN RS.',
      'MARKET VALUE IN RS.',
      `REALIZABLE VALUE (${realPctDisplay})`,
      `DISTRESS VALUE (${distPctDisplay})`,
    ];

    const headerHeights = headers.map((h, i) => this.cellHeight(h, colW[i], { bold: true, fontSize: TABLE_FONT_SIZE }));
    const headerH = Math.max(24, ...headerHeights);
    this.checkPageBreak(headerH);

    let curX = MARGIN_L;
    for (let i = 0; i < headers.length; i++) {
      this.drawCell(curX, this.cursorY, colW[i], headerH, headers[i], {
        bold: true,
        fontSize: TABLE_FONT_SIZE,
        align: 'center',
        vAlign: 'middle',
        fillColor: LBL_BG,
      });
      curX += colW[i];
    }
    this.cursorY += headerH;

    // Abstract rows
    const abstractRows = [
      { name: 'LAND', govt: fields.abstractGovtLand, mkt: fields.abstractMarketLand, real: fields.abstractRealLand, dist: fields.abstractDistressLand },
      { name: 'BUILDING', govt: fields.abstractGovtBuilding || 'Rs. 0.00', mkt: fields.abstractMarketBuilding, real: fields.abstractRealBuilding, dist: fields.abstractDistressBuilding },
      { name: 'EXTRA ITEMS', govt: fields.abstractGovtExtra || 'Rs. 0.00', mkt: fields.abstractMarketExtra || 'Rs. 0.00', real: fields.abstractRealExtra || 'Rs. 0.00', dist: fields.abstractDistressExtra || 'Rs. 0.00' },
      { name: 'AMENITIES', govt: fields.abstractGovtAmenities || 'Rs. 0.00', mkt: fields.abstractMarketAmenities || 'Rs. 0.00', real: fields.abstractRealAmenities || 'Rs. 0.00', dist: fields.abstractDistressAmenities || 'Rs. 0.00' },
      { name: 'MISCELLANEOUS', govt: fields.abstractGovtMisc || 'Rs. 0.00', mkt: fields.abstractMarketMisc || 'Rs. 0.00', real: fields.abstractRealMisc || 'Rs. 0.00', dist: fields.abstractDistressMisc || 'Rs. 0.00' },
      { name: 'SERVICES', govt: fields.abstractGovtServices || 'Rs. 0.00', mkt: fields.abstractMarketServices || 'Rs. 0.00', real: fields.abstractRealServices || 'Rs. 0.00', dist: fields.abstractDistressServices || 'Rs. 0.00' },
      { name: 'TOTAL', govt: fields.abstractGovtTotal, mkt: fields.abstractMarketTotal, real: fields.abstractRealTotal, dist: fields.abstractDistressTotal, isTotal: true },
      { name: 'OR SAY', govt: fields.abstractGovtSay, mkt: fields.abstractMarketSay, real: fields.abstractRealSay, dist: fields.abstractDistressSay, isTotal: true },
    ];

    for (const ar of abstractRows) {
      const values = [ar.name, ar.govt || 'Rs. 0.00', ar.mkt || 'Rs. 0.00', ar.real || 'Rs. 0.00', ar.dist || 'Rs. 0.00'];
      const rHeights = values.map((v, i) => this.cellHeight(v, colW[i], { bold: ar.isTotal, fontSize: TABLE_FONT_SIZE }));
      const rH = Math.max(20, ...rHeights);
      this.checkPageBreak(rH);

      let rx = MARGIN_L;
      for (let i = 0; i < values.length; i++) {
        this.drawCell(rx, this.cursorY, colW[i], rH, values[i], {
          bold: ar.isTotal,
          fontSize: TABLE_FONT_SIZE,
          align: i === 0 ? 'left' : 'center',
          vAlign: 'middle',
          fillColor: ar.isTotal ? LBL_BG : undefined,
        });
        rx += colW[i];
      }
      this.cursorY += rH;
    }
  }

  // ==========================================================================
  // STANDALONE: GENERAL REMARKS & CERTIFICATE OF VALUATION / OPINION
  // ==========================================================================
  private renderRemarksAndOpinionSection(fields: BandhanSMEReportFields): void {
    // Remarks Box
    if (fields.valuationRemarksBox) {
      this.drawSectionSpanner('GENERAL REMARKS & CONDITION OF THE PROPERTY / REMARKS:', undefined, TABLE_FONT_SIZE, LBL_BG);
      const rH = this.cellHeight(fields.valuationRemarksBox, CONTENT_W, { fontSize: TABLE_FONT_SIZE });
      const boxH = Math.max(26, rH + 6);
      this.checkPageBreak(boxH);

      this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, boxH, fields.valuationRemarksBox, {
        fontSize: TABLE_FONT_SIZE,
        align: 'left',
        vAlign: 'top',
      });
      this.cursorY += boxH;
    }

    // Basis of Valuation & Certificate of Valuation / Valuer Opinion
    this.drawSectionSpanner('CERTIFICATE OF VALUATION & VALUER OPINION:', fields.basisOfValuationStatement || '(LAND & BUILDING METHOD OF VALUATION HAS BEEN ADOPTED FOR FINDING THE FAIR MARKET VALUE OF THE PROPERTY)', TABLE_FONT_SIZE, LBL_BG);

    const opinionPara = `As a result of my appraisal and analysis, it is my considered opinion that the present Fair Market Value of the above property in the prevailing condition with aforesaid specifications is ${fields.fairMarketValue || 'Rs. 0/-'} (${fields.fairMarketValueWords || 'Rupees Zero Only'}). The Realizable Value is ${fields.realisableValue || 'Rs. 0/-'} (${fields.realisableValueWords || 'Rupees Zero Only'}). The book value of the above property as of Land is ${fields.bookValueOfLand || 'Rs. 0/-'} (${fields.bookValueOfLandWords || 'Rupees Zero Only'}) and the Distress Value ${fields.distressValue || 'Rs. 0/-'} (${fields.distressValueWords || 'Rupees Zero Only'}) And Insurable Value of the Property is ${fields.insurableValueOfProperty || 'Rs. 0/-'}.`;

    const opH = this.cellHeight(opinionPara, CONTENT_W, { fontSize: TABLE_FONT_SIZE });
    const fullOpH = Math.max(32, opH + 8);
    this.checkPageBreak(fullOpH);

    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, fullOpH, opinionPara, {
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'top',
      fillColor: OPT_BG,
    });
    this.cursorY += fullOpH;
  }

  // ==========================================================================
  // 5. DECLARATION & SIGN-OFF BLOCK
  // ==========================================================================
  private renderDeclarationAndSignoffSection(fields: BandhanSMEReportFields, explicitPageCount?: string): void {
    this.addPage();
    this.drawSectionSpanner('DECLARATION:', undefined, TABLE_FONT_SIZE, LBL_BG);

    // Intro line: I / WE HEREBY DECLARE THAT:
    const introText = 'I / WE HEREBY DECLARE THAT:';
    const introH = this.cellHeight(introText, CONTENT_W, { bold: true, fontSize: TABLE_FONT_SIZE });
    this.checkPageBreak(introH);
    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, introH, introText, {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'middle',
      hideBorder: { top: true, bottom: true, left: true, right: true },
    });
    this.cursorY += introH;

    const computedPages = explicitPageCount || fields.reportPagesCount || '26';
    const reportPagesCount = fields.reportPagesCountLocked ? (fields.reportPagesCount || computedPages) : computedPages;

    const defaultDeclarations = [
      'A. THE INFORMATION FURNISHED ABOVE IS TRUE TO THE BEST OF MY / OUR KNOWLEDGE AND BELIEF.',
      'B. NEITHER ME/WE NOR MY/ OUR ASSOCIATE HAVE ANY DIRECT OR INDIRECT INTEREST IN THE ADVANCE OR ASSETS VALUED.',
      'C. I/WE ARE NEITHER RELATED TO THE OWNER OF THE PROPERTY WHICH IS BEING VALUED NOR THE OFFICIALS OF THE BRANCH FROM WHICH THE BORROWER PROPOSES TO MORTGAGE THE PROPERTY BEING VALUED / ALREADY MORTGAGED TO THE BRANCH.',
      `D. THE PROPERTY WAS PHYSICALLY INSPECTED BY ME/US ON ${fields.dateOfVisit || fields.reportDate || 'THE INSPECTION DATE'} ALONG WITH (NAME OF THE BANK OFFICIAL ACCOMPANIED, IF ANY).`,
      'E. THE TITLE DEED (S) OF THE PROPERTY UNDER VALUATION IS AVAILABLE WITH THE BANK.',
      'F. THE PROPERTY IS IDENTIFIED BY DOCUMENTS & HELP OF CUSTOMER.',
      'G. THIS VALUATION IS PREPARED WITHOUT ANY PREJUDICE OR BIAS TO ANY PERSON OR INSTITUTION.',
      'H. THIS REPORT IS PREPARED BASED ON AVAILABLE DOCUMENTS DURING MY/OUR VISIT TO THE SITE AND DISCUSSIONS MADE WITH THE OWNER OF THE PROPERTY.',
      'I. THE LEGAL ASPECTS ARE NOT CONSIDERED IN THIS VALUATION.',
      'J. THE VALUE OF LAND IS TAKEN INTO ACCOUNT BY MAKING DUE ENQUIRIES IN THE LOCALITY AND ASCERTAINING THE SALES VALUE OF THE PROPERTIES IN THE LOCALITY.',
      'K. ANY ADDITIONS / ALTERATIONS MADE TO THE PROPERTY AFTER THE DATE OF VALUATIONS SHALL NOT FALL UNDER THE SCOPE OF THIS REPORT.',
      'L. WE ARE NEITHER THE AUDITORS TO THE OWNER OF THE PROPERTY (IES) NOR THEIR FIRMS, ASSOCIATES NOR ARE WE THE STATUTORY AUDITORS TO THE BRANCH FROM WHICH THE LOAN IS PROPOSED TO BE AVAILED / ALREADY AVAILED.',
      `M. IT IS HEREBY CERTIFIED THAT THE PRESENT MARKET VALUE OF THE ABOVE PROPERTY IS, IN MY OPINION/OUR OPINION ${fields.fairMarketValue || 'Rs.0/-'} AND THE ESTIMATED REALIZABLE VALUE UNDER DISTRESS SALE WILL BE ${fields.distressValue || 'Rs.0/-'}.`,
      'N. I HAVE NOT BEEN DISMISSED OR REMOVED FROM GOVT. SERVICE OR CONVICTED OF AN OFFENCE CONNECTED WITH ANY PROCEEDINGS OF INCOME TAX ACT, WEALTH TAX ACT OR GIFT TAX ACT OR HAVE BEEN BLACKLISTED BY ANY BANK/FINANCIAL INSTITUTION/ GOVT. DEPARTMENT/PUBLIC SECTOR ENTERPRISE/BODY CORPORATE ETC.',
      `O. THIS VALUATION REPORT CONTAINS ${reportPagesCount} PAGES ONLY.`,
      `P. NAME OF SITE ENGINEER: ${fields.siteEngineerName || 'MR. SIBA BEHERA'}`,
      'Q. PHOTOGRAPHS OF THE ASSET VALUED ENCLOSED.',
    ];

    let decls = (fields.declarationItems && fields.declarationItems.length > 0) ? fields.declarationItems : defaultDeclarations;
    if (fields.declarationItems && fields.declarationItems.length > 0) {
      decls = decls.map(d => {
        if (/^O\.\s*THIS\s*VALUATION\s*REPORT\s*CONTAINS/i.test(d)) {
          return `O. THIS VALUATION REPORT CONTAINS ${reportPagesCount} PAGES ONLY.`;
        }
        return d;
      });
    }

    for (const d of decls) {
      const dH = this.cellHeight(d, CONTENT_W, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(18, dH);
      this.checkPageBreak(rowH);

      this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, rowH, d, {
        fontSize: TABLE_FONT_SIZE,
        align: 'left',
        vAlign: 'middle',
        hideBorder: { top: true, bottom: true, left: true, right: true },
      });
      this.cursorY += rowH;
    }

    // Valuer Sign-off Box
    this.cursorY += 10;
    const signBoxH = 120;
    this.checkPageBreak(signBoxH + 10);

    const sY = this.pdfY(this.cursorY);
    this.page.drawRectangle({
      x: MARGIN_L,
      y: sY - signBoxH,
      width: CONTENT_W,
      height: signBoxH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    const valuerQual = (!fields.valuerQualifications || fields.valuerQualifications === 'B.Tech (Civil), M.Val (RE)' || fields.valuerQualifications.includes('B.Tech (Civil)'))
      ? 'B.E. (Civil), M.Tech (Civil), M.Sc. (Real Estate Valuation), MBA (Finance), MBA (HR)'
      : fields.valuerQualifications;

    this.page.drawText('SIGNATURE OF EMPANELLED VALUER:', { x: MARGIN_L + 8, y: sY - 18, size: TABLE_FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });
    this.page.drawText(`NAME OF THE EMPANELLED VALUER: ${fields.empanelledValuerName || 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)'}`, { x: MARGIN_L + 8, y: sY - 36, size: TABLE_FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });
    this.page.drawText(`EDUCATIONAL / PROFESSIONAL QUALIFICATION: ${valuerQual}`, { x: MARGIN_L + 8, y: sY - 54, size: TABLE_FONT_SIZE, font: this.fontRegular, color: rgb(0, 0, 0) });
    this.page.drawText(`REGD. VALUER OF INSTITUTION OF VALUERS: ${fields.valuerIovRegNo || 'No. F-26377'}`, { x: MARGIN_L + 8, y: sY - 72, size: TABLE_FONT_SIZE, font: this.fontRegular, color: rgb(0, 0, 0) });
    this.page.drawText(`REGD. VALUER UNDER SECTION 34AB OF WEALTH TAX ACT: ${fields.valuerWealthTaxRegNo || 'Regd. No.-107/2016-17, Cat -I'}`, { x: MARGIN_L + 8, y: sY - 90, size: TABLE_FONT_SIZE, font: this.fontRegular, color: rgb(0, 0, 0) });
    this.page.drawText(`DATE: ${fields.declarationDate || fields.reportDate || formatReportDate(new Date())}`, { x: MARGIN_L + 8, y: sY - 108, size: TABLE_FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });

    this.cursorY += signBoxH;
  }

  // ==========================================================================
  // 6. VALUATION REPORT CHECK-LIST
  // ==========================================================================
  private renderChecklistSection(fields: BandhanSMEReportFields): void {
    this.addPage();

    // 1. Valuation report check-list (centered and underlined)
    const titleText = 'Valuation report check-list';
    const textW = this.fontBold.widthOfTextAtSize(titleText, FONT_SIZE_TITLE);
    const titleX = MARGIN_L + (CONTENT_W - textW) / 2;
    const titleY = this.pdfY(this.cursorY);

    this.page.drawText(titleText, {
      x: titleX,
      y: titleY - 14,
      size: FONT_SIZE_TITLE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    this.page.drawLine({
      start: { x: titleX, y: titleY - 16 },
      end: { x: titleX + textW, y: titleY - 16 },
      thickness: 0.75,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 24;

    // 2. Subtitle line after line break
    const subText = 'Please ensure that the following important points are in order in the submitted report. [Put tick/cross]';
    const subH = this.cellHeight(subText, CONTENT_W, { fontSize: TABLE_FONT_SIZE });
    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, subH, subText, {
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'middle',
      hideBorder: { top: true, bottom: true, left: true, right: true },
    });
    this.cursorY += subH + 6;

    const defaultChecklist: BandhanSMEChecklistItem[] = [
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

    const items = (fields.checklist && fields.checklist.length > 0) ? fields.checklist : defaultChecklist;
    const qW = CONTENT_W - 60;
    const ansW = 60;

    for (const item of items) {
      const qText = `${item.pointNo}. ${item.question} ${item.subText ? item.subText : ''}`;
      const hQ = this.cellHeight(qText, qW, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(24, hQ + 4);

      this.checkPageBreak(rowH);

      this.drawCell(MARGIN_L, this.cursorY, qW, rowH, qText, {
        fontSize: TABLE_FONT_SIZE,
        align: 'left',
        vAlign: 'middle',
      });

      this.drawCell(MARGIN_L + qW, this.cursorY, ansW, rowH, item.answer || 'Yes', {
        bold: true,
        fontSize: TABLE_FONT_SIZE,
        align: 'center',
        vAlign: 'middle',
      });

      this.cursorY += rowH;
    }
  }

  // ==========================================================================
  // 7. ENCLOSURES ENGINE
  // Order: Documents -> Maps (line break, no page break) -> Photos (fresh page)
  // ==========================================================================
  private async renderEnclosures(fields: BandhanSMEReportFields): Promise<void> {
    let docOrMapPageStarted = false;

    // ── 1. Section: Documents (Unified Document Uploads - Fresh Page) ──
    const docImages: string[] = fields.documentImages || [];
    const docNames: string[] = fields.documentImageNames || [];
    const validDocs = docImages.filter(u => Boolean(u && u.trim()));

    if (validDocs.length > 0) {
      const docBytesList: { bytes: Uint8Array; caption?: string }[] = [];
      for (let i = 0; i < validDocs.length; i++) {
        const b = await fetchBytes(validDocs[i]);
        if (b && b.length > 0) {
          const rawName = docNames[i];
          const caption = (rawName !== undefined && rawName !== null && rawName.trim() !== '') ? rawName.trim() : '';
          docBytesList.push({ bytes: b, caption });
        }
      }

      if (docBytesList.length > 0) {
        if (!docOrMapPageStarted) {
          this.addPage();
          docOrMapPageStarted = true;
        }
        await this.drawDocumentsGallery(docBytesList, 'ENCLOSURE: DOCUMENTS', 240, false);
      }
    }

    // ── 2. Section: Maps (Combined with Documents flow, no extra page break) ──
    const mapCategories: { title: string; urls: string[] }[] = [
      {
        title: 'Google Satellite Map',
        urls: (fields.locationMapImages && fields.locationMapImages.length > 0)
          ? fields.locationMapImages
          : (fields.locationMapImageUrl ? [fields.locationMapImageUrl] : []),
      },
      {
        title: 'Mouza Map',
        urls: (fields.mouzaMapImages && fields.mouzaMapImages.length > 0)
          ? fields.mouzaMapImages
          : (fields.rorImageUrl ? [fields.rorImageUrl] : []),
      },
      {
        title: 'Sketch Map',
        urls: (fields.sketchMapImages && fields.sketchMapImages.length > 0)
          ? fields.sketchMapImages
          : (fields.guidelineValueImageUrl ? [fields.guidelineValueImageUrl] : []),
      },
      {
        title: 'Cadastral Map',
        urls: (fields.cadastralMapImages && fields.cadastralMapImages.length > 0)
          ? fields.cadastralMapImages
          : (fields.bhuNakshaImageUrl ? [fields.bhuNakshaImageUrl] : []),
      },
      {
        title: 'BDA Map',
        urls: fields.bdaMapImages || [],
      },
    ];

    for (const cat of mapCategories) {
      const validUrls = cat.urls.filter(u => Boolean(u && u.trim()));
      if (validUrls.length === 0) continue;

      const imgBytesList: { bytes: Uint8Array; caption?: string }[] = [];
      for (const u of validUrls) {
        const b = await fetchBytes(u);
        if (b && b.length > 0) {
          imgBytesList.push({ bytes: b });
        }
      }

      if (imgBytesList.length > 0) {
        if (!docOrMapPageStarted) {
          this.addPage();
          docOrMapPageStarted = true;
        }
        await this.drawMapGallery(imgBytesList, cat.title, 240, false);
      }
    }

    // ── 3. Section: Property Photographs (Fresh Page via base drawPhotoGrid) ──
    const photos: BandhanSMEPhoto[] = (fields.propertyPhotos && fields.propertyPhotos.length > 0)
      ? fields.propertyPhotos
      : (fields.propertyImages || []).map((url: string, i: number) => ({
          url,
          caption: fields.propertyImageNames?.[i] || `Photograph ${i + 1}`,
        }));

    const validPhotos = photos.filter(p => Boolean(p.url && p.url.trim()));
    if (validPhotos.length > 0) {
      const photoItems: { bytes: Uint8Array; label?: string }[] = [];
      for (let i = 0; i < validPhotos.length; i++) {
        const p = validPhotos[i];
        const b = await fetchBytes(p.url);
        if (b && b.length > 0) {
          photoItems.push({
            bytes: b,
            label: p.caption || (p as any).gps || (p as any).timestamp || `Photograph ${i + 1}`,
          });
        }
      }

      if (photoItems.length > 0) {
        await this.drawPhotoGrid(photoItems, 'PHOTOGRAPHS OF THE ASSET VALUED', 180, true);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Helper: Draw full-width single image
  // --------------------------------------------------------------------------
  private async drawDocImage(url: string, maxW: number, maxH: number): Promise<void> {
    const img = await this.embedImgFromUrl(url);
    if (!img) return;

    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const drawW = img.width * scale;
    const drawH = img.height * scale;

    this.checkPageBreak(drawH);
    const yPos = this.pdfY(this.cursorY);
    this.page.drawImage(img, {
      x: MARGIN_L + (maxW - drawW) / 2,
      y: yPos - drawH,
      width: drawW,
      height: drawH,
    });
    this.cursorY += drawH + 10;
  }
}

/**
 * Factory functions for Bandhan Bank SME PDF Generation
 */
export async function generateBandhanSMEReport(fields: BandhanSMEReportFields): Promise<Uint8Array> {
  const renderer = new PDFBandhanSMERenderer();
  return await renderer.generateBandhanSMEReport(fields);
}

export async function generateBandhanSMEReportWithCount(fields: BandhanSMEReportFields): Promise<{ pdfBytes: Uint8Array; pageCount: number }> {
  const renderer = new PDFBandhanSMERenderer();
  return await renderer.generateBandhanSMEReportWithCount(fields);
}
