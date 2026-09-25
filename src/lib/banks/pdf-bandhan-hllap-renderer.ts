/**
 * pdf-bandhan-hllap-renderer.ts — Dedicated PDF Renderer for Bandhan Bank HL-LAP
 *
 * Implements:
 * - 41-Point Statutory Questionnaire (Sl. No. | POINTS | REMARKS:)
 * - Subtables: Boundaries (Actual vs Deed), Approval Details (Layout vs Building Plan),
 *   Floor-wise Area Breakdown (6 cols), Setbacks (5 cols), Stage of Construction Checklist
 * - 4-Column NDMA Disaster Management Parameters Matrix
 * - Annexure-A: Details of Valuation & Computation (Clauses i to v, Method of Valuation table,
 *   Land Component, DRC Building Table with Services, 16-point Valuer Declaration A to P, Sign-off)
 * - ROR Document, GPS Location Map, Property Photo Grid (with GPS stamps), Bhu Naksha Cadastral Map,
 *   and Guideline Value Proof.
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
  LBL_BG,
  OPT_BG,
  BG_OPACITY,
  hexToRgb,
  formatReportDate,
  fetchBytes,
} from '../pdf-bank-renderer';
import { formatIndianCurrency } from '@/lib/numberToWords';

const parseNum = (v: any): number => {
  if (!v) return 0;
  const s = String(v)
    .replace(/Rs\.?/gi, '')
    .replace(/₹/g, '')
    .replace(/,/g, '')
    .trim();
  const n = parseFloat(s.replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

const formatCurrencyINR = (val: number): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rounded);
};

export interface BandhanHLLAPFloor {
  floor: string;
  measuredArea: string;
  sanctionedArea: string;
  deedArea: string;
  currentUsage: string;
  approvedUsage: string;
}

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
  const s = String(valStr);
  const ieMatch = s.match(/i\.e\.\s*([\d,]+(?:\.\d+)?)\s*sqft/i);
  if (ieMatch && ieMatch[1]) {
    const n = parseFloat(ieMatch[1].replace(/,/g, ''));
    if (!isNaN(n) && n > 0) return n;
  }
  const sqftMatch = s.match(/([\d,]+(?:\.\d+)?)\s*sqft/i);
  if (sqftMatch && sqftMatch[1]) {
    const n = parseFloat(sqftMatch[1].replace(/,/g, ''));
    if (!isNaN(n) && n > 0) return n;
  }
  const plain = parseFloat(s.replace(/[^0-9.]/g, ''));
  return isNaN(plain) ? 0 : plain;
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
      const f = rounded % 1 === 0 ? formatCurrencyINR(rounded) : rounded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return { statement: `${f} sqft.`, sqft: rounded, sqftStr: `${f} sqft.` };
    }
    return { statement: primaryVal ? `${primaryVal} sqft.` : (rawResult || ''), sqft: 0, sqftStr: '' };
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
      const sqft = Math.round(((totalAcres * 43560) + Number.EPSILON) * 100) / 100;
      const f = sqft % 1 === 0 ? formatCurrencyINR(sqft) : sqft.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const decsStr = totalAcres.toFixed(3);
      return {
        statement: `(AC.${decsStr}Decs) i.e. ${f} sqft.`,
        sqft,
        sqftStr: `${f} sqft.`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  if (unit === 'DECIMAL') {
    if (pNum > 0) {
      const sqft = Math.round(((pNum * 435.6) + Number.EPSILON) * 100) / 100;
      const f = sqft % 1 === 0 ? formatCurrencyINR(sqft) : sqft.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return {
        statement: `(${pNum} Decs) i.e. ${f} sqft.`,
        sqft,
        sqftStr: `${f} sqft.`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  if (unit === 'SQYD') {
    if (pNum > 0) {
      const sqft = Math.round(((pNum * 9) + Number.EPSILON) * 100) / 100;
      const f = sqft % 1 === 0 ? formatCurrencyINR(sqft) : sqft.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fNum = pNum % 1 === 0 ? formatCurrencyINR(pNum) : pNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return {
        statement: `(${fNum} Sq.Yds) i.e. ${f} sqft.`,
        sqft,
        sqftStr: `${f} sqft.`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  if (unit === 'SQMT') {
    if (pNum > 0) {
      const sqft = Math.round(((pNum * 10.7639) + Number.EPSILON) * 100) / 100;
      const f = sqft % 1 === 0 ? formatCurrencyINR(sqft) : sqft.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fNum = pNum % 1 === 0 ? formatCurrencyINR(pNum) : pNum.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return {
        statement: `(${fNum} Sq.Mtr) i.e. ${f} sqft.`,
        sqft,
        sqftStr: `${f} sqft.`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  if (unit === 'GUNTHA') {
    if (pNum > 0) {
      const sqft = Math.round(((pNum * 1089) + Number.EPSILON) * 100) / 100;
      const f = sqft % 1 === 0 ? formatCurrencyINR(sqft) : sqft.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return {
        statement: `(${pNum} Guntha) i.e. ${f} sqft.`,
        sqft,
        sqftStr: `${f} sqft.`,
      };
    }
    return { statement: rawResult || '', sqft: 0, sqftStr: '' };
  }

  return { statement: rawResult || '', sqft: 0, sqftStr: '' };
}

export interface BandhanHLLAPDRCFloor {
  particulars: string;
  area: string;
  yearOfConst: string;
  lifeInYrs: string;
  costOfConst: string;
  gcrc: string;
  depreciation: string;
  value: string;
}

export interface BandhanHLLAPPhoto {
  url: string;
  caption?: string;
  timestamp?: string;
  gps?: string;
  latitude?: string;
  longitude?: string;
}

export interface BandhanHLLAPReportFields {
  // Identity
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

  // Basic & Loan Details (1 - 5)
  branchName?: string;
  branchDetails?: string;
  letterNoAndDate?: string;
  bankLetterNo?: string;
  bankLetterDate?: string;
  customerName?: string;
  mortgagorName?: string;
  ownerName?: string;

  // Location & Address (6 - 14)
  propertyAddress?: string;
  pinCode?: string;
  legalAddress?: string;
  landmark?: string;
  distanceStation?: string;
  classOfLocality?: string;
  valuationType?: string;
  dateOfVisit?: string;
  qualityOfInfrastructure?: string;

  // Boundaries (15 - 16)
  boundaryNorthActual?: string;
  boundaryNorthDeed?: string;
  boundarySouthActual?: string;
  boundarySouthDeed?: string;
  boundaryEastActual?: string;
  boundaryEastDeed?: string;
  boundaryWestActual?: string;
  boundaryWestDeed?: string;
  boundariesMatch?: string;

  // Property Classification & Structure (17 - 23)
  statusOfLand?: string;
  typeOfProperty?: string;
  approvedUsage?: string;
  actualUsage?: string;
  typeOfStructure?: string;
  occupancyDetails?: string;
  unitDetails?: string;

  // Approval & Sanction Details (24 - 25)
  approvalAuthority?: string;
  layoutApprovalNo?: string;
  layoutApprovalDate?: string;
  layoutExpiryDate?: string;
  buildingPlanApprovalNo?: string;
  buildingPlanApprovalDate?: string;
  buildingPlanExpiryDate?: string;
  sanctionedPlanProvided?: string;
  planApprovedBy?: string;
  deedProvided?: string;
  comments?: string;
  constructionDetails?: string;

  // Area & Floor-wise Specifications (26 - 29)
  propertyArea?: string;
  propertyAreaUnit?: string;
  propertyAreaValue?: string;
  propertyAreaSqft?: string;
  propertyAreaAcres?: string;
  propertyAreaDecimals?: string;
  propertyAreaLocked?: boolean;
  floors?: BandhanHLLAPFloor[];
  carpetAreaTotal?: string;
  builtUpAreaTotal?: string;
  remarksOnConstruction?: string;
  complianceWithPlan?: string;
  qualityOfConstruction?: string;
  constructionAsPerPlan?: string;
  setbackFront?: string;
  setbackBack?: string;
  setbackSide1?: string;
  setbackSide2?: string;
  noOfFlatsPerFloor?: string;
  maintenanceOfProperty?: string;
  presentLife?: string;
  residualLife?: string;

  // Valuation Computation & Summary (30 - 33, 35 - 40)
  recommendedValuationFormula?: string;
  recommendedValuationFormulaLocked?: boolean;
  plotRate?: string;
  plotValueBreakdown?: string;
  rateOfCostOfConstruction?: string;
  rateOfCostOfConstructionMin?: string;
  rateOfCostOfConstructionMax?: string;
  depreciationOfConstruction?: string;
  netValueLand?: string;
  netValueBuilding?: string;
  netValueOfProperty?: string;
  rateOfFlat?: string;
  areaOfFlat?: string;
  recommendedValueOfProperty?: string;
  totalMarketValue?: string;
  valuationAsOnDate?: string;
  govtRateLand?: string;
  govtLandArea?: string;
  valuationGovtRate?: string;
  valuationGovtRateLocked?: boolean;
  distressSaleValue?: string;
  distressSalePct?: string;
  distressSaleLocked?: boolean;
  realisableValue?: string;
  realisableValuePct?: string;
  realisableValueLocked?: boolean;
  projectCommencementDate?: string;
  expectedCompletionDate?: string;
  dateCommencementCompletion?: string;
  areaOfLand?: string;
  areaOfLandUnit?: 'ACRE_DEC' | 'DECIMAL' | 'SQFT' | 'SQYD' | 'SQMT' | 'GUNTHA';
  areaOfLandValue?: string;
  areaOfLandSqft?: string;
  areaOfLandAcres?: string;
  areaOfLandDecimals?: string;
  areaOfLandLocked?: boolean;
  expectedCostOfProject?: string;
  expectedCostOfProjectRef?: 'BUILDING' | 'MARKET' | 'NA' | 'MANUAL';
  expectedCostOfProjectLocked?: boolean;

  // Progress of Work (34)
  progressStructureHeader?: string;
  progressFoundation?: string;
  progressRCC?: string;
  progressBR?: string;
  progressPlastering?: string;
  progressFlooring?: string;
  progressDoorsWindows?: string;
  progressElectricalSanitary?: string;
  progressPainting?: string;
  progressTotalPct?: string;
  progressRecommendationPct?: string;

  // NDMA Parameters (41)
  ndmaConcreteGrade?: string;
  ndmaHorizontalFloorType?: string;
  ndmaSeismicZone?: string;
  ndmaSteelGrade?: string;
  ndmaFloodProne?: string;
  ndmaUrbanFloods?: string;
  ndmaEnvironmentExposure?: string;
  ndmaSoilSlopeLandslide?: string;
  ndmaWindCyclones?: string;
  ndmaTsunami?: string;
  ndmaHeightAboveGround?: string;
  ndmaCRZ?: string;
  ndmaNatureOfBuilding?: string;
  ndmaFunctionOfUse?: string;
  ndmaFoundationType?: string;
  ndmaStructureType?: string;

  // Annexure-A: Details & Notes
  annexureIntro?: string;
  annexurePropertyDesc?: string;
  annexureDocsVerified?: string;
  annexurePurpose?: string;
  annexureGovtGuideline?: string;
  annexureGovtGuidelineRate?: string;
  annexureMarketEnquiry?: string;
  annexureMarketEnquiryMinRate?: string;
  annexureMarketEnquiryMaxRate?: string;
  annexureCpwdBaseRate?: string;
  annexureCpwdBaseRateNum?: string;
  annexureExtraAmenitiesRate?: string;
  annexureLocationCity?: string;
  annexureAdoptedStructures?: { structure: string; cost: string }[];
  annexureBasisOfValuation?: string;
  annexureMethodClassification?: {
    description: string;
    classification: string;
    ingredients: string;
    elements: string;
    approach: string;
    method: string;
  }[];
  annexureAdoptedLandRate?: string;
  annexureLandArea?: string;
  annexureLandValue?: string;
  drcFloors?: BandhanHLLAPDRCFloor[];
  drcServicesCost?: string;
  drcServicesValue?: string;
  drcTotalBuildingValue?: string;
  summaryLandValue?: string;
  summaryBuildingValue?: string;
  summaryMarketValue?: string;
  summaryMarketValueWords?: string;
  opinionStatement?: string;
  declarationItems?: string[];

  // Valuer Sign-off
  valuerSignatureName?: string;
  valuerQualification?: string;
  valuerIovRegNo?: string;
  valuerWealthTaxRegNo?: string;
  valuerReportPagesCount?: string;
  valuerReportPagesCountLocked?: boolean;
  declarationDate?: string;

  // Documents & Enclosures
  rorImageUrl?: string;
  locationMapImageUrl?: string;
  bhuNakshaImageUrl?: string;
  guidelineValueImageUrl?: string;
  locationMapImages?: string[];
  mouzaMapImages?: string[];
  sketchMapImages?: string[];
  cadastralMapImages?: string[];
  propertyPhotos?: BandhanHLLAPPhoto[];
  propertyImages?: string[];
  propertyImageNames?: string[];

  [key: string]: any;
}

const TABLE_FONT_SIZE = FONT_SIZE; // 12pt
const TABLE_MIN_ROW_H = 18;

export class PDFBandhanHLLAPRenderer extends PDFBankRenderer {
  private colSl = 32;
  private colPts = 210;
  private colRem = CONTENT_W - 32 - 210; // 245.28 pt

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
   */
  private drawBandhanRow(
    sl: string,
    points: string,
    remarks: string,
    isBoldPts: boolean = true,
    isBoldRem: boolean = false,
    fontSize: number = TABLE_FONT_SIZE
  ): void {
    const remText = remarks ?? '';
    const hSl = sl ? this.cellHeight(sl, this.colSl, { bold: isBoldPts, fontSize }) : TABLE_MIN_ROW_H;
    const hPts = this.cellHeight(points, this.colPts, { bold: isBoldPts, fontSize });
    const hRem = this.cellHeight(remText, this.colRem, { bold: isBoldRem, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hSl, hPts, hRem);

    this.checkPageBreak(rowH);

    // 1. Sl No
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, sl, {
      bold: isBoldPts,
      fontSize,
      align: 'center',
      vAlign: 'top',
    });

    // 2. POINTS
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colPts, rowH, points, {
      bold: isBoldPts,
      fontSize,
      align: 'left',
      vAlign: 'top',
    });

    // 3. REMARKS
    this.drawCell(MARGIN_L + this.colSl + this.colPts, this.cursorY, this.colRem, rowH, remText, {
      bold: isBoldRem,
      fontSize,
      align: 'left',
      vAlign: 'top',
    });

    this.cursorY += rowH;
  }

  /**
   * Main PDF Generation Entrance
   */
  public async generateBandhanHLLAPReport(fields: BandhanHLLAPReportFields): Promise<Uint8Array> {
    await this.init();

    // 1. Cover Header (Ref No & Date)
    this.drawHeaderBlock(fields);

    // 2. Main 41-Point Questionnaire Table
    this.drawMainQuestionnaire(fields);

    // 3. NDMA Parameters Matrix (Point 41)
    this.drawNDMAParameters(fields);

    // 4. Annexure-A: Details of Valuation & Computation
    this.drawAnnexureA(fields);

    // 5. Enclosures: ROR, Location Map, Photos, Bhu Naksha, Guideline Value
    await this.drawEnclosures(fields);

    // Finalize and save
    return await this.save();
  }

  /**
   * Top Header block: Ref. No. (Left) and Date: - DD/MM/YYYY (Right)
   */
  private drawHeaderBlock(fields: BandhanHLLAPReportFields): void {
    const refText = `Ref. No: ${fields.refNo || ''}`;
    const dateText = `Date: - ${fields.reportDate || formatReportDate(new Date())}`;

    this.checkPageBreak(24);
    const yHeader = this.pdfY(this.cursorY);
    this.page.drawText(refText, {
      x: MARGIN_L + 40,
      y: yHeader - 14,
      size: FONT_SIZE_HEADER,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    this.page.drawText(dateText, {
      x: MARGIN_L + CONTENT_W - 160,
      y: yHeader - 14,
      size: FONT_SIZE_HEADER,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    this.cursorY += 26;
  }

  /**
   * Draws a multi-row question where all sub-rows share a single unified Sl. No cell.
   */
  private drawMultiRowQuestion(
    sl: string,
    items: {
      pts: string;
      rem: string;
      isBoldPts?: boolean;
      isBoldRem?: boolean;
      fontSize?: number;
    }[]
  ): void {
    if (!items || items.length === 0) return;

    const rowHeights: number[] = [];
    let totalH = 0;

    for (const item of items) {
      const fs = item.fontSize || TABLE_FONT_SIZE;
      const isBoldPts = item.isBoldPts ?? true;
      const isBoldRem = item.isBoldRem ?? false;
      const hPts = this.cellHeight(item.pts, this.colPts, { bold: isBoldPts, fontSize: fs });
      const hRem = this.cellHeight(item.rem ?? '', this.colRem, { bold: isBoldRem, fontSize: fs });
      const rowH = Math.max(TABLE_MIN_ROW_H, hPts, hRem);
      rowHeights.push(rowH);
      totalH += rowH;
    }

    this.checkPageBreak(totalH);

    // 1. Single unified Sl. No cell spanning all items
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, totalH, sl, {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });

    // 2. Sub-rows (POINTS and REMARKS only, starting at MARGIN_L + colSl)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowH = rowHeights[i];
      const fs = item.fontSize || TABLE_FONT_SIZE;
      const isBoldPts = item.isBoldPts ?? true;
      const isBoldRem = item.isBoldRem ?? false;

      this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colPts, rowH, item.pts, {
        bold: isBoldPts,
        fontSize: fs,
        align: 'left',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + this.colSl + this.colPts, this.cursorY, this.colRem, rowH, item.rem ?? '', {
        bold: isBoldRem,
        fontSize: fs,
        align: 'left',
        vAlign: 'middle',
      });
      this.cursorY += rowH;
    }
  }

  /**
   * Draws the main 41-Point statutory questionnaire
   */
  private drawMainQuestionnaire(fields: BandhanHLLAPReportFields): void {
    // Table Header
    const rowH = Math.max(24, this.cellHeight('Sl.\nNo.', this.colSl, { bold: true, fontSize: TABLE_FONT_SIZE }));
    this.checkPageBreak(rowH);

    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, 'Sl.\nNo.', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colPts, rowH, 'POINTS', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colPts, this.cursorY, this.colRem, rowH, 'REMARKS:', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });
    this.cursorY += rowH;

    // 1 to 5
    const fullBranch = fields.branchDetails
      ? `Bandhan Bank, ${fields.branchDetails}`
      : (fields.branchName || '');
    this.drawBandhanRow('1.', 'Name of the Bank Branch/Asset Centre/COD', fullBranch);

    let formattedLetterNoAndDate = fields.letterNoAndDate || '';
    if (fields.bankLetterNo || fields.bankLetterDate) {
      if (fields.bankLetterNo && fields.bankLetterDate) {
        formattedLetterNoAndDate = `${fields.bankLetterNo} Dt. ${formatReportDate(fields.bankLetterDate)}`;
      } else if (fields.bankLetterNo) {
        formattedLetterNoAndDate = fields.bankLetterNo;
      } else if (fields.bankLetterDate) {
        formattedLetterNoAndDate = `Dt. ${formatReportDate(fields.bankLetterDate)}`;
      }
    }
    this.drawBandhanRow('2.', 'Bank Letter No and date for undertaking valuation', formattedLetterNoAndDate);
    this.drawBandhanRow('3.', "Customer's name [ loan applicant]", fields.customerName || '');
    this.drawBandhanRow('4.', "Mortgagor`s name", fields.mortgagorName || '');
    this.drawBandhanRow('5.', 'Name of the present owner / seller', fields.ownerName || '');

    // 6 to 14
    this.drawBandhanRow('6.', 'Complete property address', fields.propertyAddress || '');
    this.drawBandhanRow('7.', 'Pin Code', fields.pinCode || '');
    this.drawBandhanRow('8.', 'Legal address', fields.legalAddress || '');
    this.drawBandhanRow('9.', 'Nearby landmark', fields.landmark || '');
    this.drawBandhanRow('10.', 'Distance from rly station / bus stop', fields.distanceStation || '');
    this.drawBandhanRow('11.', 'Class of locality', fields.classOfLocality || '');
    this.drawBandhanRow('12.', 'Valuation: Whether fresh/revaluation/periodic valuation', fields.valuationType || 'Fresh Valuation');
    this.drawBandhanRow('13.', 'Date of Visit/Date of which valuation is made', fields.dateOfVisit || '');
    this.drawBandhanRow('14.', 'Quality of infrastructure in the vicinity', fields.qualityOfInfrastructure || 'Good');

    // 15. Boundaries subtable (unified Sl. No.)
    this.drawBoundariesSection(fields);

    // 16 to 23
    this.drawBandhanRow('16.', 'Does the boundaries at site match, as mentioned in documentation?', fields.boundariesMatch || 'Yes');
    this.drawBandhanRow('17.', 'Status of the land/flat:\nfreehold / leased / development authority', fields.statusOfLand || 'freehold');
    this.drawBandhanRow('18.', 'Type of property:\nBungalow / row house / plot / flat / commercial', fields.typeOfProperty || 'Row house');
    this.drawBandhanRow('19.', 'Approved usages of property:\nAgri / industrial / commercial / residential / mixed', fields.approvedUsage || 'Residential');
    this.drawBandhanRow('20.', 'Actual usage of the property:\nAgri / industrial / commercial / residential / mixed', fields.actualUsage || 'Residential');
    this.drawBandhanRow('21.', 'Type of structure:\nLoad bearing / RCC/ Aluform shuttering', fields.typeOfStructure || 'RCC');
    this.drawBandhanRow('22.', 'Occupancy details:\nSelf-occupied / rented/vacant', fields.occupancyDetails || 'Self-occupied');
    this.drawBandhanRow('23.', 'Unit details: (no. of rooms, hall, pantry & toilet)', fields.unitDetails || '');

    // 24. Approval Details subtable (unified Sl. No.)
    this.drawApprovalDetailsSection(fields);

    // 25. Sanction Plan provided & Deed info (unified Sl. No.)
    this.drawSanctionPlanDeedSection(fields);

    // 26. Area & Floor-wise details table (unified Sl. No.)
    this.drawFloorwiseAreaSection(fields);

    // 27. Setback subtable (unified Sl. No.)
    this.drawSetbackSection(fields);

    // 28 to 30
    this.drawBandhanRow('28.', 'Maintenance of the property', fields.maintenanceOfProperty || '');
    const presentStr = fields.presentLife ? `${fields.presentLife} - Years` : '';
    const residualStr = fields.residualLife ? `${fields.residualLife} – Years` : '';
    const lifeStr = (presentStr && residualStr)
      ? `${presentStr}, ${residualStr}`
      : (presentStr || residualStr || '');
    let val30 = (fields.recommendedValuationFormula || '').trim();
    const areaStr30 = fields.propertyArea || fields.areaOfLand || '';
    const landArea30 = parseSqftFromArea(areaStr30, fields.propertyAreaUnit, fields.propertyAreaValue);
    const rate30 = parseNum(fields.plotRate);
    const calcVal30 = (landArea30 > 0 && rate30 > 0) ? Math.round(((landArea30 * rate30) + Number.EPSILON) * 100) / 100 : 0;

    if (fields.recommendedValuationFormulaLocked !== false || !val30) {
      if (landArea30 > 0 && rate30 > 0 && calcVal30 > 0) {
        val30 = `Rs.${fields.plotRate || rate30}/- * ${formatCurrencyINR(landArea30)} sqft = Rs.${formatCurrencyINR(calcVal30)}/-`;
      } else if (calcVal30 > 0) {
        val30 = `Rs.${formatCurrencyINR(calcVal30)}/-`;
      } else if (fields.recommendedValueOfProperty) {
        const recNum = parseNum(fields.recommendedValueOfProperty);
        if (recNum > 0) val30 = `Rs.${formatCurrencyINR(recNum)}/-`;
      }
    }
    this.drawBandhanRow('30.', 'Recommended valuation of the property', val30);

    // 31. Recommended rate & value of plot (unified Sl. No.)
    const cleanPlotValue31 = (landArea30 > 0 && rate30 > 0 && calcVal30 > 0)
      ? `Rs.${fields.plotRate || rate30}/- * ${formatCurrencyINR(landArea30)} sqft = Rs.${formatCurrencyINR(calcVal30)}/-`
      : (fields.plotValueBreakdown || '');

    this.drawMultiRowQuestion('31.', [
      { pts: 'Recommended rate of the plot', rem: fields.plotRate ? `Rs.${fields.plotRate}/-` : '' },
      { pts: 'Recommended value of the plot', rem: cleanPlotValue31 },
    ]);

    // 32
    let val32 = (fields.rateOfCostOfConstruction || '').trim();
    if (!val32 || fields.rateOfCostOfConstructionLocked !== false) {
      const minNum = parseNum(fields.rateOfCostOfConstructionMin || fields.annexureMarketEnquiryMinRate || '1700');
      const maxNum = parseNum(fields.rateOfCostOfConstructionMax || fields.annexureMarketEnquiryMaxRate || '1900');
      if (minNum > 0 && maxNum > 0 && minNum !== maxNum) {
        val32 = `Rs.${formatCurrencyINR(minNum)}/- to Rs.${formatCurrencyINR(maxNum)}/- per sqft`;
      } else if (minNum > 0 || maxNum > 0) {
        val32 = `Rs.${formatCurrencyINR(minNum || maxNum)}/- per sqft`;
      }
    }
    this.drawBandhanRow('32.', 'Recommended rate of cost of construction', val32);

    // 33. Depreciation & Flat/Property Value Breakdown (unified Sl. No.)
    let val33 = (fields.depreciationOfConstruction || '').trim();
    if (val33) {
      if (val33.startsWith('Rs.') || val33.startsWith('₹') || val33.toLowerCase() === 'nil') {
        // already formatted or Nil
      } else {
        const num = parseNum(val33);
        if (num > 0) {
          val33 = `Rs.${formatCurrencyINR(num)}/-`;
        } else if (num === 0 && (val33 === '0' || val33.toLowerCase() === 'nil')) {
          val33 = 'Nil';
        }
      }
    }

    let valRec = (fields.recommendedValueOfProperty || '').trim();
    if (valRec) {
      if (valRec.startsWith('Rs.') || valRec.startsWith('₹')) {
        // already formatted
      } else {
        const num = parseNum(valRec);
        if (num > 0) valRec = `Rs.${formatCurrencyINR(num)}/-`;
      }
    }

    let valMkt = (fields.totalMarketValue || '').trim();
    if (valMkt) {
      if (valMkt.startsWith('Rs.') || valMkt.startsWith('₹')) {
        // already formatted
      } else {
        const num = parseNum(valMkt);
        if (num > 0) valMkt = `Rs.${formatCurrencyINR(num)}/-`;
      }
    }

    this.drawMultiRowQuestion('33.', [
      { pts: 'Depreciation of the construction', rem: val33 },
      { pts: 'Net value of the property (Land + Building)', rem: fields.netValueOfProperty || '' },
      { pts: 'Recommended rate of the flat', rem: fields.rateOfFlat || '' },
      { pts: 'Area of the flat', rem: fields.areaOfFlat || '' },
      { pts: 'Recommended value of the property', rem: valRec },
      { pts: 'Total Market Value of existing property', rem: valMkt },
    ]);

    // 34. Progress of work checklist (unified Sl. No.)
    this.drawProgressOfWorkSection(fields);

    // 35 to 36
    let val35 = (fields.valuationAsOnDate || '').trim();
    if (val35) {
      if (val35.startsWith('Rs.') || val35.startsWith('₹')) {
        // already formatted
      } else {
        const num = parseNum(val35);
        if (num > 0) val35 = `Rs.${formatCurrencyINR(num)}/-`;
      }
    }
    this.drawBandhanRow('35.', 'Valuation as on date', val35 || '');

    let val36 = (fields.valuationGovtRate || '').trim();
    const areaGovtStr = fields.govtLandArea !== undefined ? fields.govtLandArea : (fields.propertyArea || fields.areaOfLand || '');
    const areaGovtNum = parseSqftFromArea(areaGovtStr, fields.propertyAreaUnit, fields.propertyAreaValue);
    const rateGovtNum = parseNum(fields.govtRateLand);
    const calcGovtVal = (areaGovtNum > 0 && rateGovtNum > 0) ? Math.round(((areaGovtNum * rateGovtNum) + Number.EPSILON) * 100) / 100 : 0;

    if (fields.valuationGovtRateLocked !== false || !val36) {
      if (rateGovtNum > 0 && areaGovtNum > 0 && calcGovtVal > 0) {
        val36 = `Rs.${formatCurrencyINR(rateGovtNum)}/- Per sqft * ${formatCurrencyINR(areaGovtNum)}sqft. = Rs.${formatCurrencyINR(calcGovtVal)}/-`;
      }
    }
    this.drawBandhanRow('36.', 'Valuation according to Govt. rate', val36 || '');

    // 37. Distress & Realisable Values (unified Sl. No.)
    let val37 = (fields.distressSaleValue || '').trim();
    if (!val37 || fields.distressSaleLocked !== false) {
      const baseNum = parseNum(fields.totalMarketValue || fields.recommendedValueOfProperty || fields.valuationAsOnDate);
      const pctStr = fields.distressSalePct !== undefined && fields.distressSalePct !== '' ? fields.distressSalePct : '100';
      const pctNum = parseFloat(pctStr);
      if (baseNum > 0 && !isNaN(pctNum)) {
        const amt = Math.round((baseNum * pctNum) / 100);
        val37 = amt === 0 ? 'Rs.0/-' : `Rs.${formatCurrencyINR(amt)}/-`;
      }
    }

    let valRealisable = (fields.realisableValue || '').trim();
    if (!valRealisable || fields.realisableValueLocked !== false) {
      const baseNum = parseNum(fields.totalMarketValue || fields.recommendedValueOfProperty || fields.valuationAsOnDate);
      const pctStr = fields.realisableValuePct !== undefined && fields.realisableValuePct !== '' ? fields.realisableValuePct : '100';
      const pctNum = parseFloat(pctStr);
      if (baseNum > 0 && !isNaN(pctNum)) {
        const amt = Math.round((baseNum * pctNum) / 100);
        valRealisable = amt === 0 ? 'Rs.0/-' : `Rs.${formatCurrencyINR(amt)}/-`;
      }
    }

    this.drawMultiRowQuestion('37.', [
      { pts: 'Distress sale value', rem: val37 || '' },
      { pts: 'Realisable Value', rem: valRealisable || '' },
    ]);

    // 38 to 40
    const val38 = formatCommencementCompletion(fields.projectCommencementDate, fields.expectedCompletionDate, fields.dateCommencementCompletion);
    this.drawBandhanRow('38.', 'Date of project commencement & date of expected project completion', val38);
    let val39 = fields.areaOfLand;
    if (!val39 || fields.areaOfLandLocked !== false) {
      if (fields.areaOfLandValue || fields.areaOfLandAcres) {
        val39 = formatAreaOfLandStatement(
          fields.areaOfLandUnit || 'ACRE_DEC',
          fields.areaOfLandValue || '',
          fields.areaOfLandAcres || '',
          fields.areaOfLandDecimals || '',
          fields.propertyArea || ''
        ).statement;
      } else if (fields.propertyArea) {
        val39 = `${fields.propertyArea} sqft.`;
      }
    }
    this.drawBandhanRow('39.', 'Area of land', val39 || '');

    let val40 = (fields.expectedCostOfProject || '').trim();
    if (!val40 || val40 === 'NA') {
      val40 = 'NA';
    } else if (val40.startsWith('Rs.') || val40.startsWith('₹')) {
      // already currency formatted
    } else {
      const num40 = parseNum(val40);
      if (num40 > 0) {
        val40 = `Rs.${formatCurrencyINR(num40)}/-`;
      }
    }
    this.drawBandhanRow('40.', 'Expected cost of the project', val40 || 'NA');
  }

  /**
   * Row 15: Boundaries sub-table (Actual vs As per previous sale deed) with unified Sl. No.
   */
  private drawBoundariesSection(fields: BandhanHLLAPReportFields): void {
    const colSl = this.colSl;
    const colDir = 50;
    const colHalf = (CONTENT_W - colSl - colDir) / 2; // ~202.64 pt

    // 1. Title row height
    const hTitle = Math.max(TABLE_MIN_ROW_H, this.cellHeight('Boundaries  of the property:', CONTENT_W - colSl, { bold: true, fontSize: TABLE_FONT_SIZE }));

    // 2. Subheader row height (dynamic height to avoid "AS PER\n(Previous Sale Deed)" overlap)
    const hSub1 = this.cellHeight('ACTUAL', colHalf, { bold: true, fontSize: TABLE_FONT_SIZE });
    const hSub2 = this.cellHeight('AS PER\n(Previous Sale Deed)', colHalf, { bold: true, fontSize: TABLE_FONT_SIZE });
    const hSubHeader = Math.max(TABLE_MIN_ROW_H, hSub1, hSub2);

    // 3. Direction rows heights
    const directions = [
      { dir: 'North', act: fields.boundaryNorthActual, deed: fields.boundaryNorthDeed },
      { dir: 'South', act: fields.boundarySouthActual, deed: fields.boundarySouthDeed },
      { dir: 'East', act: fields.boundaryEastActual, deed: fields.boundaryEastDeed },
      { dir: 'West', act: fields.boundaryWestActual, deed: fields.boundaryWestDeed },
    ];

    const dirHeights: number[] = [];
    let totalDirH = 0;
    for (const d of directions) {
      const hAct = this.cellHeight(d.act || '', colHalf, { fontSize: TABLE_FONT_SIZE });
      const hDeed = this.cellHeight(d.deed || '', colHalf, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, hAct, hDeed);
      dirHeights.push(rowH);
      totalDirH += rowH;
    }

    const totalH = hTitle + hSubHeader + totalDirH;
    this.checkPageBreak(totalH);

    // Draw single unified Sl. No cell spanning all rows of 15.
    this.drawCell(MARGIN_L, this.cursorY, colSl, totalH, '15.', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });

    // Row 1: Header title
    this.drawCell(MARGIN_L + colSl, this.cursorY, CONTENT_W - colSl, hTitle, 'Boundaries  of the property:', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += hTitle;

    // Row 2: Subheader
    this.drawCell(MARGIN_L + colSl, this.cursorY, colDir, hSubHeader, '', { align: 'center' });
    this.drawCell(MARGIN_L + colSl + colDir, this.cursorY, colHalf, hSubHeader, 'ACTUAL', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + colSl + colDir + colHalf, this.cursorY, colHalf, hSubHeader, 'AS PER\n(Previous Sale Deed)', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });
    this.cursorY += hSubHeader;

    // Rows 3-6: 4 directions
    for (let i = 0; i < directions.length; i++) {
      const d = directions[i];
      const rowH = dirHeights[i];
      this.drawCell(MARGIN_L + colSl, this.cursorY, colDir, rowH, `${d.dir}   :`, {
        bold: false,
        fontSize: TABLE_FONT_SIZE,
        align: 'right',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + colSl + colDir, this.cursorY, colHalf, rowH, d.act || '', {
        bold: false,
        fontSize: TABLE_FONT_SIZE,
        align: 'left',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + colSl + colDir + colHalf, this.cursorY, colHalf, rowH, d.deed || '', {
        bold: false,
        fontSize: TABLE_FONT_SIZE,
        align: 'left',
        vAlign: 'middle',
      });
      this.cursorY += rowH;
    }
  }

  /**
   * Row 24: Approval Details sub-table (Layout vs Building Plan) with unified Sl. No.
   */
  private drawApprovalDetailsSection(fields: BandhanHLLAPReportFields): void {
    const colSl = this.colSl;
    const remW = CONTENT_W - colSl;

    // Header row height
    const hHeaderPts = this.cellHeight('Approval details:', this.colPts, { bold: true, fontSize: TABLE_FONT_SIZE });
    const hHeaderRem = this.cellHeight(fields.approvalAuthority || '', this.colRem, { bold: false, fontSize: TABLE_FONT_SIZE });
    const headerH = Math.max(TABLE_MIN_ROW_H, hHeaderPts, hHeaderRem);

    // 4-column layout
    const colW1 = 130;
    const colW2 = (remW - colW1 * 2) / 2; // ~98.64 pt
    const colW3 = colW1;
    const colW4 = colW2;

    const rows = [
      { l1: 'Layout approval No.', v1: fields.layoutApprovalNo || 'NA', l2: 'Building plan approval No.', v2: fields.buildingPlanApprovalNo || 'NA' },
      { l1: 'Date of approval', v1: fields.layoutApprovalDate || 'NA', l2: 'Date of approval', v2: fields.buildingPlanApprovalDate || 'NA' },
      { l1: 'Expiry date', v1: fields.layoutExpiryDate || 'NA', l2: 'Expiry date', v2: fields.buildingPlanExpiryDate || 'NA' },
    ];

    const rowHeights: number[] = [];
    let totalSubH = 0;
    for (const r of rows) {
      const h1 = this.cellHeight(r.l1, colW1, { bold: true, fontSize: TABLE_FONT_SIZE });
      const h2 = this.cellHeight(r.v1, colW2, { fontSize: TABLE_FONT_SIZE });
      const h3 = this.cellHeight(r.l2, colW3, { bold: true, fontSize: TABLE_FONT_SIZE });
      const h4 = this.cellHeight(r.v2, colW4, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, h1, h2, h3, h4);
      rowHeights.push(rowH);
      totalSubH += rowH;
    }

    const totalH = headerH + totalSubH;
    this.checkPageBreak(totalH);

    // Draw single unified Sl. No cell for 24.
    this.drawCell(MARGIN_L, this.cursorY, colSl, totalH, '24.', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });

    // Header row
    this.drawCell(MARGIN_L + colSl, this.cursorY, this.colPts, headerH, 'Approval details:', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + colSl + this.colPts, this.cursorY, this.colRem, headerH, fields.approvalAuthority || '', {
      bold: false,
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += headerH;

    // 3 sub-rows
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const rowH = rowHeights[i];
      this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, rowH, r.l1, { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, rowH, r.v1, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2, this.cursorY, colW3, rowH, r.l2, { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3, this.cursorY, colW4, rowH, r.v2, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
      this.cursorY += rowH;
    }
  }

  /**
   * Row 25: Copy of sanctioned plan provided & deed info with unified Sl. No.
   */
  private drawSanctionPlanDeedSection(fields: BandhanHLLAPReportFields): void {
    const defaultConstDetails = getConstructionDetailsForStructure(fields.typeOfStructure);
    const items = [
      { pts: 'Copy of sanctioned plan provided. Plan No:', rem: fields.sanctionedPlanProvided || '' },
      { pts: 'And approved by', rem: fields.planApprovedBy || fields.approvalAuthority || '' },
      { pts: 'Copy of deed provided. Deed No:', rem: fields.deedProvided || 'NA' },
      { pts: 'Comments, if any:', rem: fields.comments || '' },
      { pts: 'Construction details:', rem: fields.constructionDetails || defaultConstDetails },
    ];

    this.drawMultiRowQuestion('25.', items);
  }

  /**
   * Row 26: Floor-wise Area Details (6 Columns) with unified Sl. No.
   */
  private drawFloorwiseAreaSection(fields: BandhanHLLAPReportFields): void {
    const colSl = this.colSl;
    const remW = CONTENT_W - colSl;

    // Row 26 main title
    let val26 = fields.propertyArea || '';
    if (fields.propertyAreaUnit && fields.propertyAreaValue && fields.propertyAreaLocked !== false) {
      const formatted26 = formatAreaOfLandStatement(
        fields.propertyAreaUnit,
        fields.propertyAreaValue,
        fields.propertyAreaAcres,
        fields.propertyAreaDecimals,
        fields.propertyArea
      );
      if (formatted26.statement) {
        val26 = formatted26.statement;
      }
    }

    const hTitlePts = this.cellHeight('Area of the property:', this.colPts, { bold: true, fontSize: TABLE_FONT_SIZE });
    const hTitleRem = this.cellHeight(val26, this.colRem, { bold: false, fontSize: TABLE_FONT_SIZE });
    const titleH = Math.max(TABLE_MIN_ROW_H, hTitlePts, hTitleRem);

    // 6-column floor breakdown table
    const colW1 = 74;  // Floor level
    const colW2 = 78;  // As measured
    const colW3 = 96;  // As per sanctioned plan
    const colW4 = 88;  // As per sale deed
    const colW5 = 75;  // Current usage
    const colW6 = remW - colW1 - colW2 - colW3 - colW4 - colW5; // Approved usage

    // Calculate dynamic header height to prevent text overflow
    const h1 = this.cellHeight('Floor level', colW1, { bold: true, fontSize: FONT_SIZE_SMALL });
    const h2 = this.cellHeight('As measured\n(In sqft.)', colW2, { bold: true, fontSize: FONT_SIZE_SMALL });
    const h3 = this.cellHeight('Built-up area\nAs per sanctioned\nplan (in sqft)', colW3, { bold: true, fontSize: FONT_SIZE_SMALL });
    const h4 = this.cellHeight('Built-up area\nAs per sale deed\n(In sqft.)', colW4, { bold: true, fontSize: FONT_SIZE_SMALL });
    const h5 = this.cellHeight('Current\nusage', colW5, { bold: true, fontSize: FONT_SIZE_SMALL });
    const h6 = this.cellHeight('Approved\nusage', colW6, { bold: true, fontSize: FONT_SIZE_SMALL });
    const headerH = Math.max(34, h1, h2, h3, h4, h5, h6);

    const rawFloors = fields.floors || [];
    const floors = rawFloors.length > 0
      ? rawFloors.filter(f => {
          if (/^Basement/i.test(f.floor || '') && !f.measuredArea && !f.sanctionedArea && (!f.deedArea || f.deedArea === 'NA')) {
            return false;
          }
          return true;
        })
      : [
          { floor: 'Ground Floor', measuredArea: '', sanctionedArea: '', deedArea: '', currentUsage: 'Residential', approvedUsage: 'Residential' },
        ];

    const floorHeights: number[] = [];
    let totalFloorH = 0;
    for (const f of floors) {
      const rh1 = this.cellHeight(f.floor || '', colW1, { fontSize: FONT_SIZE_SMALL });
      const rh2 = this.cellHeight(f.measuredArea || '', colW2, { fontSize: FONT_SIZE_SMALL });
      const rh3 = this.cellHeight(f.sanctionedArea || '', colW3, { fontSize: FONT_SIZE_SMALL });
      const rh4 = this.cellHeight(f.deedArea || '', colW4, { fontSize: FONT_SIZE_SMALL });
      const rh5 = this.cellHeight(f.currentUsage || '', colW5, { fontSize: FONT_SIZE_SMALL });
      const rh6 = this.cellHeight(f.approvedUsage || '', colW6, { fontSize: FONT_SIZE_SMALL });
      const rowH = Math.max(TABLE_MIN_ROW_H, rh1, rh2, rh3, rh4, rh5, rh6);
      floorHeights.push(rowH);
      totalFloorH += rowH;
    }

    // Supplementary summary rows under floor table
    const colHalf = remW / 2;
    let buaDisplay = fields.builtUpAreaTotal || '';
    if (!buaDisplay && fields.floors && fields.floors.length > 0) {
      const totalSanctioned = fields.floors.reduce((acc, f) => acc + (parseFloat(String(f.sanctionedArea).replace(/[^0-9.-]/g, '')) || 0), 0);
      const totalMeasured = fields.floors.reduce((acc, f) => acc + (parseFloat(String(f.measuredArea).replace(/[^0-9.-]/g, '')) || 0), 0);
      const bVal = totalSanctioned > 0 ? totalSanctioned : totalMeasured;
      const validFloors = fields.floors.filter(f => (parseFloat(String(f.sanctionedArea).replace(/[^0-9.-]/g, '')) || 0) > 0 || (parseFloat(String(f.measuredArea).replace(/[^0-9.-]/g, '')) || 0) > 0);
      const prefix = validFloors.length > 1 ? `G+${validFloors.length - 1} ` : (validFloors.length === 1 ? 'GF ' : '');
      if (bVal > 0) {
        buaDisplay = `${prefix}Total BUA = ${bVal}sqft.`;
      }
    }

    const suppRows = [
      { l: 'Carpet Area: (Approx.)', v: fields.carpetAreaTotal || '' },
      { l: 'Built Up Area:', v: buaDisplay },
      { l: 'Remarks on construction:(Good / Bad)', v: fields.remarksOnConstruction || 'Good' },
      { l: 'Compliances with sanction plan:(Yes / No)', v: fields.complianceWithPlan || 'Not Applicable' },
      { l: 'Quality of construction:(Good/ Bad)', v: fields.qualityOfConstruction || 'Good' },
      { l: 'Construction has been made as per Plan', v: fields.constructionAsPerPlan || 'NA' },
    ];

    const suppHeights: number[] = [];
    let totalSuppH = 0;
    for (const r of suppRows) {
      const sh1 = this.cellHeight(r.l, colHalf, { bold: true, fontSize: TABLE_FONT_SIZE });
      const sh2 = this.cellHeight(r.v, colHalf, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, sh1, sh2);
      suppHeights.push(rowH);
      totalSuppH += rowH;
    }

    const totalH = titleH + headerH + totalFloorH + totalSuppH;
    this.checkPageBreak(totalH);

    // Unified Sl. No. cell for 26.
    this.drawCell(MARGIN_L, this.cursorY, colSl, totalH, '26.', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });

    // Row 26 title
    this.drawCell(MARGIN_L + colSl, this.cursorY, this.colPts, titleH, 'Area of the property:', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + colSl + this.colPts, this.cursorY, this.colRem, titleH, val26, {
      bold: false,
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += titleH;

    // 6-col header
    this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, headerH, 'Floor level', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, headerH, 'As measured\n(In sqft.)', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 + colW2, this.cursorY, colW3, headerH, 'Built-up area\nAs per sanctioned\nplan (in sqft)', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3, this.cursorY, colW4, headerH, 'Built-up area\nAs per sale deed\n(In sqft.)', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3 + colW4, this.cursorY, colW5, headerH, 'Current\nusage', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3 + colW4 + colW5, this.cursorY, colW6, headerH, 'Approved\nusage', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.cursorY += headerH;

    // Floor rows
    for (let i = 0; i < floors.length; i++) {
      const f = floors[i];
      const rowH = floorHeights[i];
      this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, rowH, f.floor || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, rowH, f.measuredArea || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2, this.cursorY, colW3, rowH, f.sanctionedArea || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3, this.cursorY, colW4, rowH, f.deedArea || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3 + colW4, this.cursorY, colW5, rowH, f.currentUsage || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3 + colW4 + colW5, this.cursorY, colW6, rowH, f.approvedUsage || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.cursorY += rowH;
    }

    // Supplementary summary rows
    for (let i = 0; i < suppRows.length; i++) {
      const r = suppRows[i];
      const rowH = suppHeights[i];
      this.drawCell(MARGIN_L + colSl, this.cursorY, colHalf, rowH, r.l, { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colHalf, this.cursorY, colHalf, rowH, r.v, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'left', vAlign: 'middle' });
      this.cursorY += rowH;
    }
  }

  /**
   * Row 27: Setback around the property with unified Sl. No.
   */
  private drawSetbackSection(fields: BandhanHLLAPReportFields): void {
    const colSl = this.colSl;
    const remW = CONTENT_W - colSl;

    // Header row height
    const hHeader = Math.max(TABLE_MIN_ROW_H, this.cellHeight('Setback around the property', remW, { bold: true, fontSize: TABLE_FONT_SIZE }));

    // 5 column sub-table aligned with colSl
    const colW1 = 78;
    const colW2 = 78;
    const colW3 = 78;
    const colW4 = 78;
    const colW5 = remW - colW1 * 4; // ~217.28 pt

    const h5 = this.cellHeight('No. of Flat at each floor', colW5, { bold: true, fontSize: TABLE_FONT_SIZE });
    const subHeaderH = Math.max(TABLE_MIN_ROW_H, h5);

    const valH1 = this.cellHeight(fields.setbackFront || '', colW1, { fontSize: TABLE_FONT_SIZE });
    const valH2 = this.cellHeight(fields.setbackBack || '', colW2, { fontSize: TABLE_FONT_SIZE });
    const valH3 = this.cellHeight(fields.setbackSide1 || '', colW3, { fontSize: TABLE_FONT_SIZE });
    const valH4 = this.cellHeight(fields.setbackSide2 || '', colW4, { fontSize: TABLE_FONT_SIZE });
    const valH5 = this.cellHeight(fields.noOfFlatsPerFloor || 'NA', colW5, { fontSize: TABLE_FONT_SIZE });
    const dataRowH = Math.max(TABLE_MIN_ROW_H, valH1, valH2, valH3, valH4, valH5);

    const totalH = hHeader + subHeaderH + dataRowH;
    this.checkPageBreak(totalH);

    // Draw single unified Sl. No. cell for 27.
    this.drawCell(MARGIN_L, this.cursorY, colSl, totalH, '27.', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });

    // Row 1: Header
    this.drawCell(MARGIN_L + colSl, this.cursorY, remW, hHeader, 'Setback around the property', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += hHeader;

    // Row 2: Subheader
    this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, subHeaderH, 'Front', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, subHeaderH, 'Back-Side', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 2, this.cursorY, colW3, subHeaderH, 'Side1', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 3, this.cursorY, colW4, subHeaderH, 'Side2', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 4, this.cursorY, colW5, subHeaderH, 'No. of Flat at each floor', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.cursorY += subHeaderH;

    // Row 3: Data row
    this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, dataRowH, fields.setbackFront || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, dataRowH, fields.setbackBack || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 2, this.cursorY, colW3, dataRowH, fields.setbackSide1 || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 3, this.cursorY, colW4, dataRowH, fields.setbackSide2 || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 4, this.cursorY, colW5, dataRowH, fields.noOfFlatsPerFloor || 'NA', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.cursorY += dataRowH;
  }

  /**
   * Row 34: Progress of work checklist table with unified Sl. No.
   */
  private drawProgressOfWorkSection(fields: BandhanHLLAPReportFields): void {
    const colSl = this.colSl;
    const colPts = this.colPts;
    const colRem = this.colRem;

    const hHdrPts = this.cellHeight('Progress of work:', colPts, { bold: true, fontSize: TABLE_FONT_SIZE });
    const hHdrRem = this.cellHeight(fields.progressStructureHeader || '', colRem, { bold: true, fontSize: TABLE_FONT_SIZE });
    const headerH = Math.max(TABLE_MIN_ROW_H, hHdrPts, hHdrRem);

    const structWorkLabel = getWorkProgressStructureLabel(fields.typeOfStructure);
    const items = [
      { label: 'Foundation', val: fields.progressFoundation || '' },
      { label: structWorkLabel, val: fields.progressRCC || '' },
      { label: 'BR work', val: fields.progressBR || '' },
      { label: 'Plastering -', val: fields.progressPlastering || '' },
      { label: 'Flooring', val: fields.progressFlooring || '' },
      { label: 'Doors & windows -', val: fields.progressDoorsWindows || '' },
      { label: 'Electrical, sanitary &\nplumbing', val: fields.progressElectricalSanitary || '' },
      { label: 'Painting', val: fields.progressPainting || '' },
      { label: 'Progress of work:', val: fields.progressTotalPct || '' },
      { label: 'Recommendation -', val: fields.progressRecommendationPct || '' },
    ];

    const colColon = 30;
    const colWorkName = colPts - colColon;

    const rowHeights: number[] = [];
    let totalSubH = 0;
    for (const item of items) {
      const hL = this.cellHeight(item.label, colWorkName, { fontSize: TABLE_FONT_SIZE });
      const hV = this.cellHeight(item.val || '', colRem, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, hL, hV);
      rowHeights.push(rowH);
      totalSubH += rowH;
    }

    const totalH = headerH + totalSubH;
    this.checkPageBreak(totalH);

    // Draw single unified Sl. No. cell for 34.
    this.drawCell(MARGIN_L, this.cursorY, colSl, totalH, '34.', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });

    // Main header row
    this.drawCell(MARGIN_L + colSl, this.cursorY, colPts, headerH, 'Progress of work:', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + colSl + colPts, this.cursorY, colRem, headerH, fields.progressStructureHeader || '', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });
    this.cursorY += headerH;

    // 10 checklist sub-rows
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowH = rowHeights[i];
      this.drawCell(MARGIN_L + colSl, this.cursorY, colWorkName, rowH, item.label, {
        bold: false,
        fontSize: TABLE_FONT_SIZE,
        align: 'left',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + colSl + colWorkName, this.cursorY, colColon, rowH, ':', {
        bold: false,
        fontSize: TABLE_FONT_SIZE,
        align: 'center',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + colSl + colPts, this.cursorY, colRem, rowH, item.val, {
        bold: false,
        fontSize: TABLE_FONT_SIZE,
        align: 'center',
        vAlign: 'middle',
      });
      this.cursorY += rowH;
    }
  }

  /**
   * Section 41: NDMA Disaster Management Parameters (4-column table)
   */
  private drawNDMAParameters(fields: BandhanHLLAPReportFields): void {
    const h = TABLE_MIN_ROW_H;
    this.checkPageBreak(h * 10);

    // Section Title
    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, h + 2, '41. NDMA Disaster Management Parameters', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      align: 'center',
      vAlign: 'middle',
    });
    this.cursorY += h + 2;

    const col1 = 125;
    const col2 = 118;
    const col3 = 125;
    const col4 = CONTENT_W - col1 - col2 - col3; // ~119.28 pt

    const defaultNdmaStructure = fields.typeOfStructure ? getNdmaStructureTypeForStructure(fields.typeOfStructure) : 'NA';
    const ndmaRows = [
      { l1: 'Concrete Grade', v1: fields.ndmaConcreteGrade || 'NA', l2: 'Horizontal floor type', v2: fields.ndmaHorizontalFloorType || 'NA' },
      { l1: 'Seismic Zone', v1: fields.ndmaSeismicZone || 'NA', l2: 'Steel Grade', v2: fields.ndmaSteelGrade || 'NA' },
      { l1: 'Flood Prone Area', v1: fields.ndmaFloodProne || 'NA', l2: 'Urban Floods', v2: fields.ndmaUrbanFloods || 'NA' },
      { l1: 'Environment Exposure\nCondition', v1: fields.ndmaEnvironmentExposure || 'NA', l2: 'Soil Slope vulnerable to\nlandslide', v2: fields.ndmaSoilSlopeLandslide || 'NA' },
      { l1: 'Wind / Cyclones', v1: fields.ndmaWindCyclones || 'NA', l2: 'Tsunami', v2: fields.ndmaTsunami || 'NA' },
      { l1: 'Height of building above\nground level', v1: fields.ndmaHeightAboveGround || 'NA', l2: 'Coastal Regulatory Zone\n(CRZ)', v2: fields.ndmaCRZ || 'NA' },
      { l1: 'Nature of Building\n/Wing/Tower', v1: fields.ndmaNatureOfBuilding || 'NA', l2: 'Function of use', v2: fields.ndmaFunctionOfUse || fields.actualUsage || fields.approvedUsage || 'Residential' },
      { l1: 'Type of Foundation', v1: fields.ndmaFoundationType || 'NA', l2: 'Type of Structure', v2: fields.ndmaStructureType || defaultNdmaStructure },
    ];

    for (const r of ndmaRows) {
      const h1 = this.cellHeight(r.l1, col1, { bold: true, fontSize: FONT_SIZE_SMALL });
      const h2 = this.cellHeight(r.v1, col2, { bold: false, fontSize: FONT_SIZE_SMALL });
      const h3 = this.cellHeight(r.l2, col3, { bold: true, fontSize: FONT_SIZE_SMALL });
      const h4 = this.cellHeight(r.v2, col4, { bold: false, fontSize: FONT_SIZE_SMALL });
      const rowH = Math.max(TABLE_MIN_ROW_H, h1, h2, h3, h4);

      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, col1, rowH, r.l1, { bold: true, fontSize: FONT_SIZE_SMALL, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + col1, this.cursorY, col2, rowH, r.v1, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + col1 + col2, this.cursorY, col3, rowH, r.l2, { bold: true, fontSize: FONT_SIZE_SMALL, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + col1 + col2 + col3, this.cursorY, col4, rowH, r.v2, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.cursorY += rowH;
    }

    this.cursorY += 15;
  }

  /**
   * Annexure-A: Details of Valuation and Valuation Computation
   */
  private drawAnnexureA(fields: BandhanHLLAPReportFields): void {
    this.addPage();

    // Titles
    this.drawHeadingText('ANNEXURE-A', FONT_SIZE_TITLE, 'center');
    this.drawHeadingText('DETAILS OF VALUATION AND VALUATION COMPUTATION', FONT_SIZE_HEADER, 'center');
    this.cursorY += 4;

    // Introduction
    this.drawHeadingText('INTRODUCTION: -', TABLE_FONT_SIZE, 'left');

    const branchDisplay = fields.branchDetails || (fields.branchName ? fields.branchName.replace(/^The\s+Bandhan\s+Bank,?\s*|^Bandhan\s+Bank,?\s*/i, '').trim() : 'Bhubaneswar Branch');
    const introText = fields.annexureIntro ||
      `Pursuant to the instructions received from Bandhan Bank, ${branchDisplay || 'Bhubaneswar Branch'}, to ascertain 'MARKET VALUE' (MV) of the above property, in favour of ${fields.customerName || 'Loan Applicant'} (Applicant Name), the site and its neighbourhood area had been inspected on ${fields.dateOfVisit || ''} in presence of the owner and the property had been identified by us with the help of available documents.`;
    this.drawParagraph(introText);
    this.cursorY += 8;

    // Description of Property
    this.drawHeadingText('DESCRIPTION OF THE PROPERTY:', TABLE_FONT_SIZE, 'left');
    this.drawParagraph(fields.annexurePropertyDesc || fields.propertyAddress || '');
    this.cursorY += 8;

    // List of Documents for Verification
    const docText = `LIST OF DOCUMENTS FOR VERIFICATION: ${fields.annexureDocsVerified || 'ROR, Copy of Sale deed & approved Plan'}`;
    this.drawHeadingText(docText, TABLE_FONT_SIZE, 'left');
    this.cursorY += 8;

    // Relevant Data / Information Points
    this.drawHeadingText('RELEVANT DATA/ INFORMATION IN RESPECT OF THE PROPERTY UNDER REFERENCE:', TABLE_FONT_SIZE, 'left');

    const structName = (fields.typeOfStructure || 'RCC').trim();
    const structPhrase = structName.toLowerCase().includes('load')
      ? 'a load bearing structure'
      : structName.toLowerCase().includes('aluform')
      ? 'an Aluform (Mivan) shuttering structure'
      : structName.toLowerCase().includes('steel')
      ? 'a steel framed structure'
      : `an ${structName} framed structure`;

    const gRate = fields.annexureGovtGuidelineRate || fields.govtRateLand || '286';
    const minMkt = fields.annexureMarketEnquiryMinRate || fields.rateOfCostOfConstructionMin || '1700';
    const maxMkt = fields.annexureMarketEnquiryMaxRate || fields.rateOfCostOfConstructionMax || '1900';
    const cpwdBase = fields.annexureCpwdBaseRateNum || '1,300';
    const locCity = fields.annexureLocationCity || 'Bhubaneswar';
    const extraAmenities = fields.annexureExtraAmenitiesRate || '500';

    const relPoints = [
      { prefix: 'i) PURPOSE OF VALUATION: ', text: fields.annexurePurpose || fields.purpose || 'Mortgage and Bank finance.' },
      { prefix: 'ii) Govt. guideline value of land: ', text: fields.annexureGovtGuideline || `Rs.${gRate}/- per sqft (As per IGR, Odisha Govt. Website)` },
      { prefix: 'iii) ', text: fields.annexureMarketEnquiry || `From local enquiry and market investigation it reveals that the rate for vacant, developed BASTU land in-and-around the site varies between @Rs. ${minMkt} per sqft to @ Rs. ${maxMkt} per sqft, depending upon, location, sites, width of the abutting road, shape, size, neighbourhood area and other factors. Thus @Rs. ${fields.plotRate || '1800'} per sqft decimal reasonably be taken as land value for the above stated case for the purpose of valuation.` },
      { prefix: 'iv) ', text: fields.annexureCpwdBaseRate || `The base rate of construction has been considered at ₹${cpwdBase} per sq. ft. for ${structPhrase} for the ${locCity} location. An additional ₹${extraAmenities} per sq. ft. has been accounted for towards extra amenities such as interior improvement works, fixed furniture, false ceiling, cupboards, modular kitchen, and premium quality electrical, sanitary fittings, and fixtures. Accordingly, the overall cost of the building is assessed at ₹${fields.rateOfCostOfConstruction || '1,800'} per sq. ft. of Super built-up area (SBUA).` },
      { prefix: 'v) ', text: 'Considering the above CPWD rate, CPWD specification and the specification of the house under consideration, cost of construction for the above building may reasonably be taken as under: -' },
    ];

    for (const p of relPoints) {
      this.checkPageBreak(30);
      this.drawParagraph(`${p.prefix}${p.text}`);
      this.cursorY += 4;
    }

    // Adopted Cost of Construction Table
    const colStruc = CONTENT_W / 2;
    const colCost = CONTENT_W / 2;
    const h1 = this.cellHeight('Structures', colStruc, { bold: true, fontSize: TABLE_FONT_SIZE });
    const h2 = this.cellHeight('Adopted Cost of Construction Rs. /Sqft. of BUA', colCost, { bold: true, fontSize: TABLE_FONT_SIZE });
    const headerH = Math.max(TABLE_MIN_ROW_H, h1, h2);

    this.checkPageBreak(headerH + TABLE_MIN_ROW_H * 2);
    this.drawCell(MARGIN_L, this.cursorY, colStruc, headerH, 'Structures', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colStruc, this.cursorY, colCost, headerH, 'Adopted Cost of Construction Rs. /Sqft. of BUA', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.cursorY += headerH;

    const rawRate = (fields.rateOfCostOfConstruction || '').trim();
    let defaultCost = 'GF- Rs.1,600/- & FF- Rs.1,800/-';
    if (rawRate) {
      if (/^Rs\./i.test(rawRate) || rawRate.includes('per sqft') || rawRate.includes('/-')) {
        defaultCost = rawRate;
      } else {
        defaultCost = `Rs.${rawRate}/- per sqft.`;
      }
    }
    const defaultStruct = `${structName} Roofing ${fields.floors && fields.floors.length > 1 ? 'All Floors' : 'Ground Floor'}`;

    const adopted = (fields.annexureAdoptedStructures && fields.annexureAdoptedStructures.length > 0)
      ? fields.annexureAdoptedStructures
      : [{ structure: defaultStruct, cost: defaultCost }];

    for (const a of adopted) {
      const sText = a.structure || defaultStruct;
      let cText = a.cost || defaultCost;
      cText = cText.replace(/^Rs\.Rs\./i, 'Rs.').replace(/\/-\s*per\s*sqft\/?-\s*per\s*sqft\.?/i, '/- per sqft.');

      const rh1 = this.cellHeight(sText, colStruc, { fontSize: TABLE_FONT_SIZE });
      const rh2 = this.cellHeight(cText, colCost, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, rh1, rh2);
      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, colStruc, rowH, sText, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colStruc, this.cursorY, colCost, rowH, cText, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
      this.cursorY += rowH;
    }
    this.cursorY += 10;

    // Basis & Method of Valuation
    this.drawHeadingText('BASIS OF VALUATION:', TABLE_FONT_SIZE, 'left');
    this.drawParagraph(
      fields.annexureBasisOfValuation?.trim()
        ? fields.annexureBasisOfValuation
        : 'Here, the approved valuer should discuss in detail the approach to valuation of the property and indicate how the value has been arrived at, supported by necessary calculations. Also, such aspects as: (i) Saleability, (ii) Likely rental values in future, and (iii) Any likely income it may generate may be discussed.'
    );
    this.cursorY += 8;

    this.drawHeadingText('METHOD OF VALUATION: -', TABLE_FONT_SIZE, 'left');
    this.drawHeadingText('CLASSIFICATION OF PROPERTIES, VALUE INGREDIENTS, VALUE ELEMENTS, APPROACH AND METHOD OF VALUATION: -', FONT_SIZE_SMALL, 'left');

    // Method Classification 6-col table
    const mcW = CONTENT_W / 6;
    const mcH1 = this.cellHeight('DESCRIPTION\nOF PROPERTY', mcW, { bold: true, fontSize: FONT_SIZE_SMALL });
    const mcH2 = this.cellHeight('PROPERTY\nCLASSIFICATION', mcW, { bold: true, fontSize: FONT_SIZE_SMALL });
    const mcH3 = this.cellHeight('VALUE\nINGREDIENTS', mcW, { bold: true, fontSize: FONT_SIZE_SMALL });
    const mcH4 = this.cellHeight('VALUE\nELEMENTS', mcW, { bold: true, fontSize: FONT_SIZE_SMALL });
    const mcH5 = this.cellHeight('APPROACH\nTO\nVALUATION', mcW, { bold: true, fontSize: FONT_SIZE_SMALL });
    const mcH6 = this.cellHeight('METHOD OF\nVALUATION', mcW, { bold: true, fontSize: FONT_SIZE_SMALL });
    const mcHeaderH = Math.max(TABLE_MIN_ROW_H, mcH1, mcH2, mcH3, mcH4, mcH5, mcH6);

    this.checkPageBreak(mcHeaderH + TABLE_MIN_ROW_H);
    this.drawCell(MARGIN_L, this.cursorY, mcW, mcHeaderH, 'DESCRIPTION\nOF PROPERTY', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + mcW, this.cursorY, mcW, mcHeaderH, 'PROPERTY\nCLASSIFICATION', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + mcW * 2, this.cursorY, mcW, mcHeaderH, 'VALUE\nINGREDIENTS', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + mcW * 3, this.cursorY, mcW, mcHeaderH, 'VALUE\nELEMENTS', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + mcW * 4, this.cursorY, mcW, mcHeaderH, 'APPROACH\nTO\nVALUATION', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + mcW * 5, this.cursorY, mcW, mcHeaderH, 'METHOD OF\nVALUATION', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.cursorY += mcHeaderH;

    const defaultPropType = fields.propertyType || fields.actualUsage || 'Residential';
    const methodRows = (fields.annexureMethodClassification && fields.annexureMethodClassification.length > 0)
      ? fields.annexureMethodClassification
      : [{
          description: `${defaultPropType} building`,
          classification: defaultPropType,
          ingredients: 'Land & Building',
          elements: 'Land & Structure',
          approach: 'Market Approach',
          method: 'Land & Building Method',
        }];

    for (const mr of methodRows) {
      const desc = mr.description || `${defaultPropType} building`;
      const clas = mr.classification || defaultPropType;
      const ingr = mr.ingredients || 'Land & Building';
      const elem = mr.elements || 'Land & Structure';
      const appr = mr.approach || 'Market Approach';
      const meth = mr.method || 'Land & Building Method';

      const rh1 = this.cellHeight(desc, mcW, { fontSize: FONT_SIZE_SMALL });
      const rh2 = this.cellHeight(clas, mcW, { fontSize: FONT_SIZE_SMALL });
      const rh3 = this.cellHeight(ingr, mcW, { fontSize: FONT_SIZE_SMALL });
      const rh4 = this.cellHeight(elem, mcW, { fontSize: FONT_SIZE_SMALL });
      const rh5 = this.cellHeight(appr, mcW, { fontSize: FONT_SIZE_SMALL });
      const rh6 = this.cellHeight(meth, mcW, { fontSize: FONT_SIZE_SMALL });
      const rowH = Math.max(TABLE_MIN_ROW_H, rh1, rh2, rh3, rh4, rh5, rh6);
      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, mcW, rowH, desc, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW, this.cursorY, mcW, rowH, clas, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW * 2, this.cursorY, mcW, rowH, ingr, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW * 3, this.cursorY, mcW, rowH, elem, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW * 4, this.cursorY, mcW, rowH, appr, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW * 5, this.cursorY, mcW, rowH, meth, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.cursorY += rowH;
    }
    this.cursorY += 10;

    // Valuation Computation
    this.drawHeadingText('VALUATION COMPUTATION: -', TABLE_FONT_SIZE, 'left');

    // (A) Land Component
    this.drawHeadingText('(A) VALUATION OF LAND COMPONENT: -', TABLE_FONT_SIZE, 'left');
    const adoptedRate = fields.annexureAdoptedLandRate || fields.plotRate || '1800';
    this.drawParagraph(`Adopted land rate for this case as on date                              = Rs.${adoptedRate}/-`);
    this.cursorY += 3;

    const rawLandArea = fields.annexureLandArea || fields.propertyArea || fields.areaOfLand || '';
    const parsedSqft = parseSqftFromArea(rawLandArea, fields.propertyAreaUnit, fields.propertyAreaValue);
    const cleanAreaStr = parsedSqft > 0
      ? `${formatCurrencyINR(parsedSqft)} sqft.`
      : (rawLandArea ? (rawLandArea.includes('i.e.') ? rawLandArea.split('i.e.')[1].trim() : rawLandArea) : '10,890 sqft.');

    const rateNum = parseNum(adoptedRate);
    const calcValNum = (parsedSqft > 0 && rateNum > 0) ? Math.round(parsedSqft * rateNum) : parseNum(fields.annexureLandValue || fields.netValueLand);
    const cleanLandVal = calcValNum > 0 ? formatCurrencyINR(calcValNum) : (fields.annexureLandValue || '1,96,02,000');

    const landCalc = `Multiplying by the area of the land Component ${cleanAreaStr} (x) Rs.${adoptedRate}/- = Rs.${cleanLandVal}/-`;
    this.drawParagraph(landCalc, { bold: true });
    this.cursorY += 3;

    this.drawParagraph(`Value of the land component as on date          =   Rs.${cleanLandVal} /- ...............(A)`, { bold: true });
    this.cursorY += 8;

    // (B) DRC Building Table
    this.drawHeadingText('(B) TO ASCERTAIN THE DEPRECIATED REPLACEMENT COST (D.R.C.) OF THE EXISTING BUILDING AS ON DATE: -', FONT_SIZE_SMALL, 'left');

    // DRC 8-col table
    const drcW1 = 50;  // Particulars
    const drcW2 = 64;  // Area in Sqft
    const drcW3 = 45;  // Year
    const drcW4 = 45;  // Life
    const drcW5 = 62;  // Cost
    const drcW6 = 45;  // GCRC
    const drcW7 = 76;  // Dep %
    const drcW8 = CONTENT_W - drcW1 - drcW2 - drcW3 - drcW4 - drcW5 - drcW6 - drcW7; // ~100.28 pt Value

    const drcH1 = this.cellHeight('Particulars', drcW1, { bold: true, fontSize: FONT_SIZE_SMALL });
    const drcH2 = this.cellHeight('Area\nin Sqft.', drcW2, { bold: true, fontSize: FONT_SIZE_SMALL });
    const drcH3 = this.cellHeight('Year\nof\nConst.', drcW3, { bold: true, fontSize: FONT_SIZE_SMALL });
    const drcH4 = this.cellHeight('Life\nin\nYrs.', drcW4, { bold: true, fontSize: FONT_SIZE_SMALL });
    const drcH5 = this.cellHeight('Cost of\nconstructi\non', drcW5, { bold: true, fontSize: FONT_SIZE_SMALL });
    const drcH6 = this.cellHeight('G.C.R.\nC.', drcW6, { bold: true, fontSize: FONT_SIZE_SMALL });
    const drcH7 = this.cellHeight('Depreciation.\nAge (100-10) %\nlife', drcW7, { bold: true, fontSize: FONT_SIZE_SMALL });
    const drcH8 = this.cellHeight('Value\nIn Rs.', drcW8, { bold: true, fontSize: FONT_SIZE_SMALL });
    const drcHeaderH = Math.max(TABLE_MIN_ROW_H, drcH1, drcH2, drcH3, drcH4, drcH5, drcH6, drcH7, drcH8);

    this.checkPageBreak(drcHeaderH + TABLE_MIN_ROW_H * 3);
    this.drawCell(MARGIN_L, this.cursorY, drcW1, drcHeaderH, 'Particulars', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + drcW1, this.cursorY, drcW2, drcHeaderH, 'Area\nin Sqft.', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + drcW1 + drcW2, this.cursorY, drcW3, drcHeaderH, 'Year\nof\nConst.', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3, this.cursorY, drcW4, drcHeaderH, 'Life\nin\nYrs.', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4, this.cursorY, drcW5, drcHeaderH, 'Cost of\nconstructi\non', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4 + drcW5, this.cursorY, drcW6, drcHeaderH, 'G.C.R.\nC.', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4 + drcW5 + drcW6, this.cursorY, drcW7, drcHeaderH, 'Depreciation.\nAge (100-10) %\nlife', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4 + drcW5 + drcW6 + drcW7, this.cursorY, drcW8, drcHeaderH, 'Value\nIn Rs.', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.cursorY += drcHeaderH;

    const drcFloors = (fields.drcFloors && fields.drcFloors.length > 0)
      ? fields.drcFloors
      : (fields.floors && fields.floors.length > 0
          ? fields.floors.map(f => ({
              particulars: f.floor || '',
              area: f.sanctionedArea || '',
              yearOfConst: '',
              lifeInYrs: '',
              costOfConst: fields.rateOfCostOfConstruction || '',
              gcrc: '',
              depreciation: '',
              value: '',
            }))
          : [{ particulars: 'Ground Floor', area: '', yearOfConst: '', lifeInYrs: '', costOfConst: fields.rateOfCostOfConstruction || '', gcrc: '', depreciation: '', value: '' }]
        );

    for (let idx = 0; idx < drcFloors.length; idx++) {
      const df = drcFloors[idx];
      const pText = df.particulars || fields.floors?.[idx]?.floor || (idx === 0 ? 'Ground Floor' : `Floor ${idx}`);
      const aText = df.area || fields.floors?.[idx]?.sanctionedArea || '';
      const cText = df.costOfConst || fields.rateOfCostOfConstruction || '';
      
      const aNum = parseNum(aText);
      const cNum = parseNum(cText);
      const autoGcrc = (aNum > 0 && cNum > 0) ? Math.round(aNum * cNum) : 0;
      const gcrcText = df.gcrc ? (parseNum(df.gcrc) > 0 ? formatCurrencyINR(parseNum(df.gcrc)) : df.gcrc) : (autoGcrc > 0 ? formatCurrencyINR(autoGcrc) : '');
      
      const depNum = parseNum(df.depreciation);
      const factor = (depNum > 0 && depNum <= 100) ? (1 - depNum / 100) : 1;
      const baseGcrcNum = parseNum(df.gcrc) || autoGcrc;
      const autoNetVal = baseGcrcNum > 0 ? Math.round(baseGcrcNum * factor) : 0;
      const vText = df.value ? (parseNum(df.value) > 0 ? formatCurrencyINR(parseNum(df.value)) : df.value) : (autoNetVal > 0 ? formatCurrencyINR(autoNetVal) : '');

      const rh1 = this.cellHeight(pText, drcW1, { fontSize: FONT_SIZE_SMALL });
      const rh2 = this.cellHeight(aText, drcW2, { fontSize: FONT_SIZE_SMALL });
      const rh3 = this.cellHeight(df.yearOfConst || '', drcW3, { fontSize: FONT_SIZE_SMALL });
      const rh4 = this.cellHeight(df.lifeInYrs || '', drcW4, { fontSize: FONT_SIZE_SMALL });
      const rh5 = this.cellHeight(cText, drcW5, { fontSize: FONT_SIZE_SMALL });
      const rh6 = this.cellHeight(gcrcText, drcW6, { fontSize: FONT_SIZE_SMALL });
      const rh7 = this.cellHeight(df.depreciation || '', drcW7, { fontSize: FONT_SIZE_SMALL });
      const rh8 = this.cellHeight(vText, drcW8, { fontSize: FONT_SIZE_SMALL });
      const rowH = Math.max(TABLE_MIN_ROW_H, rh1, rh2, rh3, rh4, rh5, rh6, rh7, rh8);
      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, drcW1, rowH, pText, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1, this.cursorY, drcW2, rowH, aText, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2, this.cursorY, drcW3, rowH, df.yearOfConst || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3, this.cursorY, drcW4, rowH, df.lifeInYrs || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4, this.cursorY, drcW5, rowH, cText, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4 + drcW5, this.cursorY, drcW6, rowH, gcrcText, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4 + drcW5 + drcW6, this.cursorY, drcW7, rowH, df.depreciation || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4 + drcW5 + drcW6 + drcW7, this.cursorY, drcW8, rowH, vText, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.cursorY += rowH;
    }

    // Add Services row
    const spanW = drcW1 + drcW2 + drcW3 + drcW4 + drcW5;
    const servText = 'ADD: - Depreciated Replacement Cost (DRC) of the water\narrangement, electrification & other building services etc.';
    const servH1 = this.cellHeight(servText, spanW, { bold: true, fontSize: FONT_SIZE_SMALL });
    const servH2 = this.cellHeight(fields.drcServicesCost || 'Rs.0/-', drcW6 + drcW7, { fontSize: FONT_SIZE_SMALL });
    const servH3 = this.cellHeight(fields.drcServicesValue || 'Rs.0/-', drcW8, { fontSize: FONT_SIZE_SMALL });
    const servRowH = Math.max(TABLE_MIN_ROW_H * 2, servH1, servH2, servH3);

    this.checkPageBreak(servRowH + TABLE_MIN_ROW_H);
    this.drawCell(MARGIN_L, this.cursorY, spanW, servRowH, servText, { bold: true, fontSize: FONT_SIZE_SMALL, align: 'left', vAlign: 'middle' });
    this.drawCell(MARGIN_L + spanW, this.cursorY, drcW6 + drcW7, servRowH, fields.drcServicesCost || 'Rs.0/-', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + spanW + drcW6 + drcW7, this.cursorY, drcW8, servRowH, fields.drcServicesValue || 'Rs.0/-', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.cursorY += servRowH;

    // DRC Total Row
    this.drawCell(MARGIN_L, this.cursorY, spanW, TABLE_MIN_ROW_H, 'TOTAL', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + spanW, this.cursorY, drcW6 + drcW7, TABLE_MIN_ROW_H, fields.drcTotalBuildingValue ? `Rs.${fields.drcTotalBuildingValue}/-` : 'Rs.63,70,000/-', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + spanW + drcW6 + drcW7, this.cursorY, drcW8, TABLE_MIN_ROW_H, '............ (B)', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.cursorY += TABLE_MIN_ROW_H + 10;

    // Summary Land + Building
    this.checkPageBreak(80);
    this.drawParagraph("Thus, the 'MARKET VALUE' (M.V.) of the property comprises of its land component and the building erected upon it comes to: -");
    this.cursorY += 4;

    const rawMktVal = fields.summaryMarketValue || (fields.totalMarketValue ? fields.totalMarketValue.replace(/^Rs\./i, '').replace(/\/-$/i, '') : '') || (fields.recommendedValueOfProperty ? fields.recommendedValueOfProperty.replace(/^Rs\./i, '').replace(/\/-$/i, '') : '') || '2,59,72,000';
    const mktNum = parseNum(rawMktVal);
    const finalMktValStr = mktNum > 0 ? `Rs.${formatCurrencyINR(mktNum)}/-` : `Rs.${rawMktVal}/-`;
    const realPct = (fields.realisableValuePct !== undefined && fields.realisableValuePct !== '') ? parseFloat(fields.realisableValuePct) : 100;
    const distPct = (fields.distressSalePct !== undefined && fields.distressSalePct !== '') ? parseFloat(fields.distressSalePct) : 100;
    const finalRealVal = fields.realisableValue || (mktNum > 0 ? `Rs.${formatCurrencyINR(Math.round((mktNum * (!isNaN(realPct) ? realPct : 100)) / 100))}/-` : 'Rs.2,46,73,400/-');
    const finalDistVal = fields.distressSaleValue || (mktNum > 0 ? `Rs.${formatCurrencyINR(Math.round((mktNum * (!isNaN(distPct) ? distPct : 100)) / 100))}/-` : 'Rs.2,33,74,800/-');

    this.drawParagraph(`Land Value:                                                          Rs.${fields.summaryLandValue || fields.annexureLandValue || '1,96,02,000'} /- ......(A)`, { bold: true });
    this.drawParagraph(`Value of the Building:                                                Rs.${fields.summaryBuildingValue || fields.drcTotalBuildingValue || '63,70,000'}/-.........(B)`, { bold: true });
    this.cursorY += 4;

    this.drawParagraph(`So, MARKET VALUE (M.V) of the property as on date    ${finalMktValStr}`, { bold: true });

    const rawWords = fields.summaryMarketValueWords || (mktNum > 0 ? formatIndianCurrency(mktNum) : 'Two Crore Fifty-Nine Lakhs Seventy-Two Thousand');
    const words = rawWords.startsWith('(') ? rawWords : `(Rupees ${rawWords} Only)`;
    this.drawParagraph(words, { bold: true });
    this.cursorY += 12;

    // Opinion Statement
    this.checkPageBreak(50);
    const opinionVal = fields.opinionMarketValue || finalMktValStr;
    const opinion = fields.opinionStatement || `AS A RESULT OF MY / OUR APPRAISAL AND ANALYSIS IT IS MY/OUR CONSIDERED OPINION THAT THE PRESENT MARKET VALUE OF THE ABOVE PROPERTY IN THE PREVAILING CONDITION WITH AFORESAID SPECIFICATIONS IS ${opinionVal} AND INSURABLE VALUE OF THE PROPERTY IS NOT IN OUR SCOPE.`;
    this.drawParagraph(opinion, { bold: true, fontSize: TABLE_FONT_SIZE });
    this.cursorY += 10;

    // Declaration
    this.drawHeadingText('DECLARATION:', TABLE_FONT_SIZE, 'left');
    this.drawParagraph('I /WE HEREBY DECLARE THAT:');
    this.cursorY += 4;

    const photoCount = (fields.propertyPhotos && fields.propertyPhotos.length > 0)
      ? fields.propertyPhotos.length
      : (fields.propertyImages?.length || 0);
    const photoPages = photoCount > 0 ? Math.ceil(photoCount / 2) : 0;
    const rorPages = (fields.mouzaMapImages && fields.mouzaMapImages.length > 0) ? fields.mouzaMapImages.length : (fields.rorImageUrl ? 1 : 0);
    const locPages = (fields.locationMapImages && fields.locationMapImages.length > 0) ? fields.locationMapImages.length : (fields.locationMapImageUrl ? 1 : 0);
    const bhuPages = (fields.cadastralMapImages && fields.cadastralMapImages.length > 0) ? fields.cadastralMapImages.length : ((fields.bhuNakshaImages && fields.bhuNakshaImages.length > 0) ? fields.bhuNakshaImages.length : (fields.bhuNakshaImageUrl ? 1 : 0));
    const guidePages = (fields.sketchMapImages && fields.sketchMapImages.length > 0) ? fields.sketchMapImages.length : ((fields.guidelineRateImages && fields.guidelineRateImages.length > 0) ? fields.guidelineRateImages.length : (fields.guidelineValueImageUrl ? 1 : 0));
    const computedPages = String(9 + photoPages + rorPages + locPages + bhuPages + guidePages);
    const reportPagesCount = fields.valuerReportPagesCountLocked ? (fields.valuerReportPagesCount || computedPages) : computedPages;

    const defaultDeclarations = [
      'A. THE INFORMATION FURNISHED ABOVE IS TRUE TO THE BEST OF MY / OUR KNOWLEDGE AND BELIEF.',
      'B. NEITHER ME/WE NOR MY/ OUR ASSOCIATE HAVE ANY DIRECT OR INDIRECT INTEREST IN THE ADVANCE OR ASSETS VALUED.',
      'C. I/WE ARE NEITHER RELATED TO THE OWNER OF THE PROPERTY WHICH IS BEING VALUED NOR THE OFFICIALS OF THE BRANCH FROM WHICH THE BORROWER PROPOSES TO MORTGAGE THE PROPERTY BEING VALUED / ALREADY MORTGAGED TO THE BRANCH.',
      `D. THE PROPERTY WAS PHYSICALLY INSPECTED BY ME/US ON ${fields.dateOfVisit || fields.reportDate || ''} ALONG WITH CUSTOMER.`,
      'E. THE TITLE DEED (S) OF THE PROPERTY UNDER VALUATION IS AVAILABLE WITH THE BANK.',
      'F. THE PROPERTY IS IDENTIFIED BY THE REPERESNTIVE OF THE BANK.',
      'G. THIS VALUATION IS PREPARED WITHOUT ANY PREJUDICE OR BIAS TO ANY PERSON OR INSTITUTION.',
      'H. THIS REPORT IS PREPARED BASED ON AVAILABLE DOCUMENTS DURING OUR VISIT TO THE SITE AND DISCUSSIONS MADE WITH THE OWNER OF THE PROPERTY.',
      'I. THE LEGAL ASPECTS ARE NOT CONSIDERED IN THIS VALUATION.',
      'J. THE VALUE OF LAND IS TAKEN INTO ACCOUNT BY MAKING DUE ENQUIRES IN THE LOCALITY AND ASCERTAINING THE SALES VALUE OF THE PROPERTIES IN THE LOCALITY.',
      'K. ANY ADDITIONS / ALTERATIONS MADE TO THE PROPERTY AFTER THE DATE OF VALUATIONS SHALL NOT FALL UNDER THE SCOPE OF THIS REPORT.',
      'L. WE ARE NEITHER THE AUDITORS TO THE OWNER OF THE PROPERTY (IES) NOR THEIR FIRMS, ASSOCIATES NOR ARE WE THE STATUTORY AUDITORS TO THE BRANCH FROM WHICH THE LOAN IS PROPOSED TO BE AVAILED / ALREADY AVAILED.',
      `M. IT IS HEREBY CERTIFIED THAT THE PRESENT MARKET VALUE OF THE ABOVE PROPERTY IS, IN MY OPINION/OUR OPINION ${finalMktValStr} AND THE ESTIMATED REALIZABLE VALUE ${finalRealVal} UNDER DISTRESS SALE WILL BE ${finalDistVal} -VALUE VARIES WITH THE PURPOSE AND DATE. THIS REPORT IS NOT TO BE REFERRED FOR THE PURPOSE IS DIFFERENT OTHER THAN VALUATION OF THE MORTGAGED PROPERTY.`,
      'N. I HAVE NOT BEEN DISMISSED OR REMOVED FROM GOVT, SERVICE OR CONVICTED OF AN OFFENCE CONNECTED WITH ANY PROCEEDINGS OF INCOME TAX ACT, WEALTH TAX ACT OR GIFT TAX ACT OR HAVE BEEN BLACKLISTED BY ANY BANK/FINANCIAL INSTITUTION/ GOVT. DEPARTMENT/PUBLIC SECTORE ENTEREPRISE/BODY CORPORATE ETC.',
      `O. THIS VALUATION REPORT CONTAINS ${reportPagesCount} PAGES ONLY.`,
      'P. PHOTOGRAPHS OF THE ASSET VALUED ENCLOSED.',
    ];

    const decls = (fields.declarationItems && fields.declarationItems.length > 0) ? fields.declarationItems : defaultDeclarations;

    for (const d of decls) {
      this.checkPageBreak(25);
      this.drawParagraph(d, { bold: false, fontSize: TABLE_FONT_SIZE });
      this.cursorY += 4;
    }

    // Valuer Sign-off block
    this.checkPageBreak(120);
    this.cursorY += 8;
    this.drawHeadingText('SIGNATURE OF EMPANELLED VALUER', TABLE_FONT_SIZE, 'left');
    this.drawHeadingText(`NAME OF THE EMPANELLED VALUER: ${fields.valuerSignatureName || 'SATYAJIT MOHANTY'}`, TABLE_FONT_SIZE, 'left');
    const displayQual = (!fields.valuerQualification || fields.valuerQualification === 'B.Tech (Civil), M.Val (RE)' || fields.valuerQualification.includes('B.Tech (Civil)'))
      ? 'B.E. (Civil), M.Tech (Civil), M.Sc. (Real Estate Valuation), MBA (Finance), MBA (HR)'
      : fields.valuerQualification;
    this.drawHeadingText(`EDUCATIONAL/ PROFESSIONAL QUALIFICATION: ${displayQual}`, TABLE_FONT_SIZE, 'left');
    this.drawHeadingText(`REGD. VALUER OF INSTITUTION OF VALUERS (No- ${fields.valuerIovRegNo || '107/2016-17, CAT-1'})`, TABLE_FONT_SIZE, 'left');
    this.drawHeadingText(`REGD. VALUER UNDER SECTION 34AB OF WEALTH TAX ACT (No. ${fields.valuerWealthTaxRegNo || 'CCIT/BBSR/Tech-10/2017-18'})`, TABLE_FONT_SIZE, 'left');
    this.drawHeadingText(`DATE: ${fields.declarationDate || fields.reportDate || formatReportDate(new Date())}`, TABLE_FONT_SIZE, 'left');
    this.cursorY += 4;
    this.drawParagraph('N.B THE EXTENT OF THE PROPERTY – VALUED MAY BE VERIFIED WHILE CONSIDERING THIS REPORT.', { fontSize: FONT_SIZE_SMALL });
    this.cursorY += 4;
    this.drawHeadingText('#ENCL.:', TABLE_FONT_SIZE, 'left');
    this.drawParagraph('q. Annexure-A- Details of Valuation and Valuation Computation');
    this.drawParagraph('r. Annexure-B-Photographs of the property');
    this.drawParagraph('s. Annexure-C - Guide line value of the land');
    this.cursorY += 12;
  }

  /**
   * Enclosures: ROR, Location Map, Photos, Bhu Naksha, Guideline Value Proof
   */
  private async drawEnclosures(fields: BandhanHLLAPReportFields): Promise<void> {
    // 1. ROR / Mouza Document Pages
    const rorList = (fields.mouzaMapImages && fields.mouzaMapImages.length > 0)
      ? fields.mouzaMapImages
      : (fields.rorImageUrl ? [fields.rorImageUrl] : []);
    for (const imgUrl of rorList) {
      if (imgUrl) {
        this.addPage();
        this.drawHeadingText('ROR / MOUZA MAP', FONT_SIZE_TITLE, 'left');
        await this.drawDocImage(imgUrl, CONTENT_W, 600);
      }
    }

    // 2. GPS Location Map Page
    const locList = (fields.locationMapImages && fields.locationMapImages.length > 0)
      ? fields.locationMapImages
      : (fields.locationMapImageUrl ? [fields.locationMapImageUrl] : []);
    for (const imgUrl of locList) {
      if (imgUrl) {
        this.addPage();
        this.drawHeadingText('GPS LOCATION OF THE PROPERTY:', FONT_SIZE_HEADER, 'left');
        await this.drawDocImage(imgUrl, CONTENT_W, 260);
        this.cursorY += 15;
      }
    }

    // 3. Property Photographs Grid (with GPS stamps)
    const photos = (fields.propertyPhotos && fields.propertyPhotos.length > 0)
      ? fields.propertyPhotos
      : (fields.propertyImages || []).map((url, i) => ({
          url,
          caption: fields.propertyImageNames?.[i] || 'Property Photograph',
        }));

    if (photos.length > 0) {
      // If we did not create a new page for GPS location or ran out of room, add page
      if (this.cursorY > 300) {
        this.addPage();
      }

      this.drawHeadingText('PROPERTY PHOTO: -', FONT_SIZE_HEADER, 'left');
      await this.drawBandhanPhotoGrid(photos);
    }

    // 4. Bhu Naksha / Cadastral Map
    const cadastralList = (fields.cadastralMapImages && fields.cadastralMapImages.length > 0)
      ? fields.cadastralMapImages
      : (fields.bhuNakshaImageUrl ? [fields.bhuNakshaImageUrl] : []);
    for (const imgUrl of cadastralList) {
      if (imgUrl) {
        this.addPage();
        this.drawHeadingText('Bhu Naksha / Cadastral Map: -', FONT_SIZE_HEADER, 'left');
        await this.drawDocImage(imgUrl, CONTENT_W, 580);
      }
    }

    // 5. Guideline Value Proof Document / Sketch Map (Annexure-C)
    const sketchList = (fields.sketchMapImages && fields.sketchMapImages.length > 0)
      ? fields.sketchMapImages
      : (fields.guidelineValueImageUrl ? [fields.guidelineValueImageUrl] : []);
    for (const imgUrl of sketchList) {
      if (imgUrl) {
        this.addPage();
        this.drawHeadingText('Annexure-C - Guide line value of the land / Sketch Map', FONT_SIZE_HEADER, 'left');
        await this.drawDocImage(imgUrl, CONTENT_W, 600);
      }
    }
  }

  /**
   * Helper to draw a heading line with font & spacing
   */
  private drawHeadingText(text: string, fontSize: number, align: 'left' | 'center' | 'right' = 'left'): void {
    const clean = this.sanitizeText(text);
    const lineH = Math.round(fontSize * 1.3);
    const lines = this.wrapText(clean, CONTENT_W, fontSize, true);

    for (const line of lines) {
      this.checkPageBreak(lineH);
      const textW = this.fontBold.widthOfTextAtSize(line, fontSize);
      let x = MARGIN_L;
      if (align === 'center') {
        x = MARGIN_L + (CONTENT_W - textW) / 2;
      } else if (align === 'right') {
        x = MARGIN_L + CONTENT_W - textW;
      }
      this.drawTextAt(line, x, this.cursorY, { fontSize, bold: true });
      this.cursorY += lineH;
    }
    this.cursorY += 4;
  }

  /**
   * Helper to draw a single document / map image preserving aspect ratio
   */
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

  /**
   * Helper to draw 2-column photo grid with GPS badges
   */
  private async drawBandhanPhotoGrid(photos: BandhanHLLAPPhoto[]): Promise<void> {
    const photoW = (CONTENT_W - 12) / 2; // ~237.64 pt
    const photoH = 170;

    for (let i = 0; i < photos.length; i += 2) {
      this.checkPageBreak(photoH + 20);

      const p1 = photos[i];
      const p2 = photos[i + 1];

      // Draw Left Photo
      await this.drawSinglePhotoWithGPS(p1, MARGIN_L, this.cursorY, photoW, photoH);

      // Draw Right Photo if present
      if (p2) {
        await this.drawSinglePhotoWithGPS(p2, MARGIN_L + photoW + 12, this.cursorY, photoW, photoH);
      }

      this.cursorY += photoH + 12;
    }
  }

  private async drawSinglePhotoWithGPS(
    photo: BandhanHLLAPPhoto,
    x: number,
    y: number,
    w: number,
    h: number
  ): Promise<void> {
    if (!photo || !photo.url) return;
    const img = await this.embedImgFromUrl(photo.url);
    if (!img) return;

    const yPos = this.pdfY(y);

    // Draw Image
    this.page.drawImage(img, {
      x,
      y: yPos - h,
      width: w,
      height: h,
    });

    // Draw GPS / Timestamp overlay badge at bottom if available
    const stampText = photo.caption || photo.gps || (photo.latitude && photo.longitude ? `Lat ${photo.latitude}° Long ${photo.longitude}°` : '');
    if (stampText) {
      const badgeH = 18;
      this.page.drawRectangle({
        x,
        y: yPos - h,
        width: w,
        height: badgeH,
        color: rgb(0, 0, 0),
        opacity: 0.65,
      });

      this.page.drawText(this.sanitizeText(stampText), {
        x: x + 4,
        y: yPos - h + 5,
        size: 8,
        font: this.fontRegular,
        color: rgb(1, 1, 1),
      });
    }
  }

  /**
   * Helper to draw text with paragraph word wrapping
   */
  private drawParagraph(
    text: string,
    options: { bold?: boolean; fontSize?: number; align?: 'left' | 'center' | 'right' } = {}
  ): void {
    const fontSize = options.fontSize || TABLE_FONT_SIZE;
    const isBold = options.bold || false;
    const lineH = Math.round(fontSize * 1.35);
    const lines = this.wrapText(text, CONTENT_W, fontSize, isBold);

    for (const line of lines) {
      this.checkPageBreak(lineH);
      let x = MARGIN_L;
      if (options.align === 'center') {
        const textW = (isBold ? this.fontBold : this.fontRegular).widthOfTextAtSize(this.sanitizeText(line), fontSize);
        x = MARGIN_L + (CONTENT_W - textW) / 2;
      } else if (options.align === 'right') {
        const textW = (isBold ? this.fontBold : this.fontRegular).widthOfTextAtSize(this.sanitizeText(line), fontSize);
        x = MARGIN_L + CONTENT_W - textW;
      }
      this.drawTextAt(line, x, this.cursorY, { fontSize, bold: isBold });
      this.cursorY += lineH;
    }
  }
}
