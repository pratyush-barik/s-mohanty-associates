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
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

const formatCurrencyINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
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

export function formatAreaOfLandStatement(
  unit: string = 'ACRE_DEC',
  primaryVal: string = '',
  acresVal: string = '',
  decsVal: string = '',
  rawResult: string = ''
): { statement: string; sqft: number } {
  const pNum = parseFloat(String(primaryVal).replace(/[^0-9.]/g, '')) || 0;
  const aNum = parseFloat(String(acresVal).replace(/[^0-9.]/g, '')) || 0;
  const dNum = parseFloat(String(decsVal).replace(/[^0-9.]/g, '')) || 0;

  if (unit === 'SQFT') {
    if (pNum > 0) {
      return { statement: `${formatCurrencyINR(pNum)} sqft.`, sqft: pNum };
    }
    return { statement: primaryVal ? `${primaryVal} sqft.` : (rawResult || ''), sqft: 0 };
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
      const sqft = Math.round(totalAcres * 43560);
      const decsStr = totalAcres.toFixed(3);
      return {
        statement: `(AC.${decsStr}Decs) i.e. ${formatCurrencyINR(sqft)}sqft.`,
        sqft,
      };
    }
    return { statement: rawResult || '', sqft: 0 };
  }

  if (unit === 'DECIMAL') {
    if (pNum > 0) {
      const sqft = Math.round(pNum * 435.6);
      return {
        statement: `(${pNum} Decs) i.e. ${formatCurrencyINR(sqft)}sqft.`,
        sqft,
      };
    }
    return { statement: rawResult || '', sqft: 0 };
  }

  if (unit === 'SQYD') {
    if (pNum > 0) {
      const sqft = Math.round(pNum * 9);
      return {
        statement: `(${formatCurrencyINR(pNum)} Sq.Yds) i.e. ${formatCurrencyINR(sqft)}sqft.`,
        sqft,
      };
    }
    return { statement: rawResult || '', sqft: 0 };
  }

  if (unit === 'SQMT') {
    if (pNum > 0) {
      const sqft = Math.round(pNum * 10.7639);
      return {
        statement: `(${formatCurrencyINR(pNum)} Sq.Mtr) i.e. ${formatCurrencyINR(sqft)}sqft.`,
        sqft,
      };
    }
    return { statement: rawResult || '', sqft: 0 };
  }

  if (unit === 'GUNTHA') {
    if (pNum > 0) {
      const sqft = Math.round(pNum * 1089);
      return {
        statement: `(${pNum} Guntha) i.e. ${formatCurrencyINR(sqft)}sqft.`,
        sqft,
      };
    }
    return { statement: rawResult || '', sqft: 0 };
  }

  return { statement: rawResult || '', sqft: 0 };
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
  plotRate?: string;
  plotValueBreakdown?: string;
  rateOfCostOfConstruction?: string;
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
  annexureMarketEnquiry?: string;
  annexureCpwdBaseRate?: string;
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
  declarationDate?: string;

  // Documents & Enclosures
  rorImageUrl?: string;
  locationMapImageUrl?: string;
  bhuNakshaImageUrl?: string;
  guidelineValueImageUrl?: string;
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
   * Draws the main 41-Point statutory questionnaire
   */
  private drawMainQuestionnaire(fields: BandhanHLLAPReportFields): void {
    // Table Header
    const rowH = TABLE_MIN_ROW_H;
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

    // 15. Boundaries subtable
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

    // 24. Approval Details subtable
    this.drawApprovalDetailsSection(fields);

    // 25. Sanction Plan provided & Deed info
    this.drawSanctionPlanDeedSection(fields);

    // 26. Area & Floor-wise details table
    this.drawFloorwiseAreaSection(fields);

    // 27. Setback subtable
    this.drawSetbackSection(fields);

    // 28 to 33
    this.drawBandhanRow('28.', 'Maintenance of the property', fields.maintenanceOfProperty || '');
    const presentStr = fields.presentLife ? `${fields.presentLife} - Years` : '';
    const residualStr = fields.residualLife ? `${fields.residualLife} – Years` : '';
    const lifeStr = (presentStr && residualStr)
      ? `${presentStr}, ${residualStr}`
      : (presentStr || residualStr || '');
    this.drawBandhanRow('29.', 'Present life &residual life', lifeStr);
    this.drawBandhanRow('30.', 'Recommended valuation of the property', fields.recommendedValuationFormula || '');
    this.drawBandhanRow('31.', 'Recommended rate of the plot', fields.plotRate ? `Rs.${fields.plotRate}/-` : '');
    this.drawBandhanRow('', 'Recommended value of the plot', fields.plotValueBreakdown || '');
    this.drawBandhanRow('32.', 'Recommended rate of cost of construction', fields.rateOfCostOfConstruction || '');
    this.drawBandhanRow('33.', 'Depreciation of the construction', fields.depreciationOfConstruction || '');
    this.drawBandhanRow('', 'Net value of the property (Land + Building)', fields.netValueOfProperty || '');
    this.drawBandhanRow('', 'Recommended rate of the flat', fields.rateOfFlat || '');
    this.drawBandhanRow('', 'Area of the flat', fields.areaOfFlat || '');
    this.drawBandhanRow('', 'Recommended value of the property', fields.recommendedValueOfProperty || '');
    this.drawBandhanRow('', 'Total Market Value of existing property', fields.totalMarketValue || '');

    // 34. Progress of work checklist
    this.drawProgressOfWorkSection(fields);

    // 35 to 40
    this.drawBandhanRow('35.', 'Valuation of the property as on date', fields.valuationAsOnDate || '');
    this.drawBandhanRow('36.', 'Valuation as per govt. rates (Land)', fields.valuationGovtRate || '');
    this.drawBandhanRow('37.', 'Distress sale value', fields.distressSaleValue || '');
    this.drawBandhanRow('', 'Realisable Value', fields.realisableValue || '');
    const val38 = formatCommencementCompletion(fields.projectCommencementDate, fields.expectedCompletionDate, fields.dateCommencementCompletion);
    this.drawBandhanRow('38.', 'Date of project commencement & date of expected project completion', val38);
    let val39 = fields.areaOfLand;
    if (!val39) {
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
    this.drawBandhanRow('40.', 'Expected cost of the project', fields.expectedCostOfProject || 'NA');
  }

  /**
   * Row 15: Boundaries sub-table (Actual vs As per previous sale deed)
   */
  private drawBoundariesSection(fields: BandhanHLLAPReportFields): void {
    const colSl = this.colSl;
    const colDir = 50;
    const colHalf = (CONTENT_W - colSl - colDir) / 2; // ~202.64 pt

    // Header row for Boundaries
    const headerH = TABLE_MIN_ROW_H;
    this.checkPageBreak(headerH * 3);

    this.drawCell(MARGIN_L, this.cursorY, colSl, headerH, '15.', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center' });
    this.drawCell(MARGIN_L + colSl, this.cursorY, CONTENT_W - colSl, headerH, 'Boundaries  of the property:', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left' });
    this.cursorY += headerH;

    // Subheader row
    this.drawCell(MARGIN_L, this.cursorY, colSl + colDir, headerH, '', { align: 'center' });
    this.drawCell(MARGIN_L + colSl + colDir, this.cursorY, colHalf, headerH, 'ACTUAL', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center' });
    this.drawCell(MARGIN_L + colSl + colDir + colHalf, this.cursorY, colHalf, headerH, 'AS PER\n(Previous Sale Deed)', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center' });
    this.cursorY += headerH;

    const directions = [
      { dir: 'North', act: fields.boundaryNorthActual, deed: fields.boundaryNorthDeed },
      { dir: 'South', act: fields.boundarySouthActual, deed: fields.boundarySouthDeed },
      { dir: 'East', act: fields.boundaryEastActual, deed: fields.boundaryEastDeed },
      { dir: 'West', act: fields.boundaryWestActual, deed: fields.boundaryWestDeed },
    ];

    for (const d of directions) {
      const hAct = this.cellHeight(d.act || '', colHalf, { fontSize: TABLE_FONT_SIZE });
      const hDeed = this.cellHeight(d.deed || '', colHalf, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, hAct, hDeed);

      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, colSl, rowH, '', { align: 'center' });
      this.drawCell(MARGIN_L + colSl, this.cursorY, colDir, rowH, `${d.dir}   :`, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'right' });
      this.drawCell(MARGIN_L + colSl + colDir, this.cursorY, colHalf, rowH, d.act || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'left' });
      this.drawCell(MARGIN_L + colSl + colDir + colHalf, this.cursorY, colHalf, rowH, d.deed || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'left' });
      this.cursorY += rowH;
    }
  }

  /**
   * Row 24: Approval Details sub-table (Layout vs Building Plan)
   */
  private drawApprovalDetailsSection(fields: BandhanHLLAPReportFields): void {
    const colSl = this.colSl;
    const remW = CONTENT_W - colSl;

    // Header row
    const headerH = TABLE_MIN_ROW_H;
    this.checkPageBreak(headerH * 4);

    this.drawCell(MARGIN_L, this.cursorY, colSl, headerH, '24.', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center' });
    this.drawCell(MARGIN_L + colSl, this.cursorY, this.colPts, headerH, 'Approval details:', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left' });
    this.drawCell(MARGIN_L + colSl + this.colPts, this.cursorY, this.colRem, headerH, fields.approvalAuthority || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'left' });
    this.cursorY += headerH;

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

    for (const r of rows) {
      const h1 = this.cellHeight(r.l1, colW1, { bold: true, fontSize: TABLE_FONT_SIZE });
      const h2 = this.cellHeight(r.v1, colW2, { fontSize: TABLE_FONT_SIZE });
      const h3 = this.cellHeight(r.l2, colW3, { bold: true, fontSize: TABLE_FONT_SIZE });
      const h4 = this.cellHeight(r.v2, colW4, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, h1, h2, h3, h4);

      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, colSl, rowH, '', { align: 'center' });
      this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, rowH, r.l1, { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left' });
      this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, rowH, r.v1, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2, this.cursorY, colW3, rowH, r.l2, { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3, this.cursorY, colW4, rowH, r.v2, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center' });
      this.cursorY += rowH;
    }
  }

  /**
   * Row 25: Copy of sanctioned plan provided & deed info
   */
  private drawSanctionPlanDeedSection(fields: BandhanHLLAPReportFields): void {
    const defaultConstDetails = getConstructionDetailsForStructure(fields.typeOfStructure);
    const items = [
      { sl: '25.', pts: 'Copy of sanctioned plan provided. Plan No:', rem: fields.sanctionedPlanProvided || '' },
      { sl: '', pts: 'And approved by', rem: fields.planApprovedBy || fields.approvalAuthority || '' },
      { sl: '', pts: 'Copy of deed provided. Deed No:', rem: fields.deedProvided || 'NA' },
      { sl: '', pts: 'Comments, if any:', rem: fields.comments || '' },
      { sl: '', pts: 'Construction details:', rem: fields.constructionDetails || defaultConstDetails },
    ];

    for (const item of items) {
      this.drawBandhanRow(item.sl, item.pts, item.rem);
    }
  }

  /**
   * Row 26: Floor-wise Area Details (6 Columns)
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
    this.drawBandhanRow('26.', 'Area of the property:', val26);

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

    this.checkPageBreak(headerH + TABLE_MIN_ROW_H * 2);

    this.drawCell(MARGIN_L, this.cursorY, colSl, headerH, '', { align: 'center' });
    this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, headerH, 'Floor level', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, headerH, 'As measured\n(In sqft.)', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 + colW2, this.cursorY, colW3, headerH, 'Built-up area\nAs per sanctioned\nplan (in sqft)', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3, this.cursorY, colW4, headerH, 'Built-up area\nAs per sale deed\n(In sqft.)', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3 + colW4, this.cursorY, colW5, headerH, 'Current\nusage', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3 + colW4 + colW5, this.cursorY, colW6, headerH, 'Approved\nusage', { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
    this.cursorY += headerH;

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

    for (const f of floors) {
      const rh1 = this.cellHeight(f.floor || '', colW1, { fontSize: FONT_SIZE_SMALL });
      const rh2 = this.cellHeight(f.measuredArea || '', colW2, { fontSize: FONT_SIZE_SMALL });
      const rh3 = this.cellHeight(f.sanctionedArea || '', colW3, { fontSize: FONT_SIZE_SMALL });
      const rh4 = this.cellHeight(f.deedArea || '', colW4, { fontSize: FONT_SIZE_SMALL });
      const rh5 = this.cellHeight(f.currentUsage || '', colW5, { fontSize: FONT_SIZE_SMALL });
      const rh6 = this.cellHeight(f.approvedUsage || '', colW6, { fontSize: FONT_SIZE_SMALL });
      const rowH = Math.max(TABLE_MIN_ROW_H, rh1, rh2, rh3, rh4, rh5, rh6);

      this.checkPageBreak(rowH);

      this.drawCell(MARGIN_L, this.cursorY, colSl, rowH, '', { align: 'center' });
      this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, rowH, f.floor || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, rowH, f.measuredArea || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2, this.cursorY, colW3, rowH, f.sanctionedArea || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3, this.cursorY, colW4, rowH, f.deedArea || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3 + colW4, this.cursorY, colW5, rowH, f.currentUsage || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colW1 + colW2 + colW3 + colW4 + colW5, this.cursorY, colW6, rowH, f.approvedUsage || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.cursorY += rowH;
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

    for (const r of suppRows) {
      const sh1 = this.cellHeight(r.l, colHalf, { bold: true, fontSize: TABLE_FONT_SIZE });
      const sh2 = this.cellHeight(r.v, colHalf, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, sh1, sh2);

      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, colSl, rowH, '', { align: 'center' });
      this.drawCell(MARGIN_L + colSl, this.cursorY, colHalf, rowH, r.l, { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colSl + colHalf, this.cursorY, colHalf, rowH, r.v, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'left', vAlign: 'middle' });
      this.cursorY += rowH;
    }
  }

  /**
   * Row 27: Setback around the property
   */
  private drawSetbackSection(fields: BandhanHLLAPReportFields): void {
    const colSl = this.colSl;
    const remW = CONTENT_W - colSl;

    // Header row
    const h = TABLE_MIN_ROW_H;
    this.checkPageBreak(h * 3);

    this.drawCell(MARGIN_L, this.cursorY, colSl, h, '27.', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center' });
    this.drawCell(MARGIN_L + colSl, this.cursorY, remW, h, 'Setback around the property', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left' });
    this.cursorY += h;

    // 5 column sub-table aligned with colSl
    const colW1 = 78;
    const colW2 = 78;
    const colW3 = 78;
    const colW4 = 78;
    const colW5 = remW - colW1 * 4; // ~217.28 pt

    const h5 = this.cellHeight('No. of Flat at each floor', colW5, { bold: true, fontSize: TABLE_FONT_SIZE });
    const subHeaderH = Math.max(TABLE_MIN_ROW_H, h5);

    this.checkPageBreak(subHeaderH + TABLE_MIN_ROW_H);
    this.drawCell(MARGIN_L, this.cursorY, colSl, subHeaderH, '', { align: 'center' });
    this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, subHeaderH, 'Front', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, subHeaderH, 'Back-Side', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 2, this.cursorY, colW3, subHeaderH, 'Side1', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 3, this.cursorY, colW4, subHeaderH, 'Side2', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 4, this.cursorY, colW5, subHeaderH, 'No. of Flat at each floor', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.cursorY += subHeaderH;

    const valH1 = this.cellHeight(fields.setbackFront || '', colW1, { fontSize: TABLE_FONT_SIZE });
    const valH2 = this.cellHeight(fields.setbackBack || '', colW2, { fontSize: TABLE_FONT_SIZE });
    const valH3 = this.cellHeight(fields.setbackSide1 || '', colW3, { fontSize: TABLE_FONT_SIZE });
    const valH4 = this.cellHeight(fields.setbackSide2 || '', colW4, { fontSize: TABLE_FONT_SIZE });
    const valH5 = this.cellHeight(fields.noOfFlatsPerFloor || 'NA', colW5, { fontSize: TABLE_FONT_SIZE });
    const dataRowH = Math.max(TABLE_MIN_ROW_H, valH1, valH2, valH3, valH4, valH5);

    this.checkPageBreak(dataRowH);
    this.drawCell(MARGIN_L, this.cursorY, colSl, dataRowH, '', { align: 'center' });
    this.drawCell(MARGIN_L + colSl, this.cursorY, colW1, dataRowH, fields.setbackFront || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1, this.cursorY, colW2, dataRowH, fields.setbackBack || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 2, this.cursorY, colW3, dataRowH, fields.setbackSide1 || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 3, this.cursorY, colW4, dataRowH, fields.setbackSide2 || '', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + colSl + colW1 * 4, this.cursorY, colW5, dataRowH, fields.noOfFlatsPerFloor || 'NA', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.cursorY += dataRowH;
  }

  /**
   * Row 34: Progress of work checklist table
   */
  private drawProgressOfWorkSection(fields: BandhanHLLAPReportFields): void {
    const colSl = this.colSl;
    const colPts = this.colPts;
    const colRem = this.colRem;

    const headerH = TABLE_MIN_ROW_H;
    this.checkPageBreak(headerH * 10);

    // Main header row
    this.drawCell(MARGIN_L, this.cursorY, colSl, headerH, '34.', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center' });
    this.drawCell(MARGIN_L + colSl, this.cursorY, colPts, headerH, 'Progress of work:', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'left' });
    this.drawCell(MARGIN_L + colSl + colPts, this.cursorY, colRem, headerH, fields.progressStructureHeader || '', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center' });
    this.cursorY += headerH;

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

    for (const item of items) {
      const h = this.cellHeight(item.label, colWorkName, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, h);
      this.checkPageBreak(rowH);

      this.drawCell(MARGIN_L, this.cursorY, colSl, rowH, '', { align: 'center' });
      this.drawCell(MARGIN_L + colSl, this.cursorY, colWorkName, rowH, item.label, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'left' });
      this.drawCell(MARGIN_L + colSl + colWorkName, this.cursorY, colColon, rowH, ':', { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center' });
      this.drawCell(MARGIN_L + colSl + colPts, this.cursorY, colRem, rowH, item.val, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center' });
      this.cursorY += rowH;
    }
  }

  /**
   * Section 41: NDMA Parameters Matrix (4-column table)
   */
  private drawNDMAParameters(fields: BandhanHLLAPReportFields): void {
    const h = TABLE_MIN_ROW_H;
    this.checkPageBreak(h * 10);

    // Section Title
    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, h + 2, '41. NDMA Parameters', {
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

    const defaultNdmaStructure = getNdmaStructureTypeForStructure(fields.typeOfStructure);
    const ndmaRows = [
      { l1: 'Concrete Grade', v1: fields.ndmaConcreteGrade ?? 'M25', l2: 'Horizontal floor type', v2: fields.ndmaHorizontalFloorType ?? 'Beams and Slabs' },
      { l1: 'Seismic Zone', v1: fields.ndmaSeismicZone ?? 'Zone-III', l2: 'Steel Grade', v2: fields.ndmaSteelGrade ?? 'FE - 450' },
      { l1: 'Flood Prone Area', v1: fields.ndmaFloodProne ?? 'NO', l2: 'Urban Floods', v2: fields.ndmaUrbanFloods ?? 'NO' },
      { l1: 'Environment Exposure\nCondition', v1: fields.ndmaEnvironmentExposure ?? 'Mild', l2: 'Soil Slope vulnerable to\nlandslide', v2: fields.ndmaSoilSlopeLandslide ?? 'Low Hazard Zone' },
      { l1: 'Wind / Cyclones', v1: fields.ndmaWindCyclones ?? 'Low Damage Risk Zone', l2: 'Tsunami', v2: fields.ndmaTsunami ?? 'NO' },
      { l1: 'Height of building above\nground level', v1: fields.ndmaHeightAboveGround ?? 'Less Than 15m Tall', l2: 'Coastal Regulatory Zone\n(CRZ)', v2: fields.ndmaCRZ ?? 'NA' },
      { l1: 'Nature of Building\n/Wing/Tower', v1: fields.ndmaNatureOfBuilding ?? 'Standalone Structure', l2: 'Function of use', v2: fields.ndmaFunctionOfUse ?? 'Residential' },
      { l1: 'Type of Foundation', v1: fields.ndmaFoundationType ?? 'Open Footing column', l2: 'Type of Structure', v2: fields.ndmaStructureType ?? defaultNdmaStructure },
    ];

    for (const r of ndmaRows) {
      const h1 = this.cellHeight(r.l1, col1, { fontSize: FONT_SIZE_SMALL });
      const h2 = this.cellHeight(r.v1, col2, { bold: true, fontSize: FONT_SIZE_SMALL });
      const h3 = this.cellHeight(r.l2, col3, { fontSize: FONT_SIZE_SMALL });
      const h4 = this.cellHeight(r.v2, col4, { bold: true, fontSize: FONT_SIZE_SMALL });
      const rowH = Math.max(TABLE_MIN_ROW_H, h1, h2, h3, h4);

      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, col1, rowH, r.l1, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + col1, this.cursorY, col2, rowH, r.v1, { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + col1 + col2, this.cursorY, col3, rowH, r.l2, { bold: false, fontSize: FONT_SIZE_SMALL, align: 'left', vAlign: 'middle' });
      this.drawCell(MARGIN_L + col1 + col2 + col3, this.cursorY, col4, rowH, r.v2, { bold: true, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
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

    const relPoints = [
      { prefix: 'i) PURPOSE OF VALUATION: ', text: fields.annexurePurpose || 'Mortgage and Bank finance.' },
      { prefix: 'ii) Govt. guideline value of land: ', text: fields.annexureGovtGuideline || `Rs.${fields.valuationGovtRate ? fields.valuationGovtRate.split('*')[0].trim() : '286/- per sqft'} (As per IGR, Odisha Govt. Website)` },
      { prefix: 'iii) ', text: fields.annexureMarketEnquiry || `From local enquiry and market investigation it reveals that the rate for vacant, developed BASTU land in-and-around the site varies between @Rs. 1700per sqft to @ Rs. 1900per sqft, depending upon, location, sites, width of the abutting road, shape, size, neighbourhood area and other factors. Thus @Rs. ${fields.plotRate || '1800'} per sqft decimal reasonably be taken as land value for the above stated case for the purpose of valuation.` },
      { prefix: 'iv) ', text: fields.annexureCpwdBaseRate || `The base rate of construction has been considered at ₹1,300 per sq. ft. for ${structPhrase} for the location. An additional ₹500 per sq. ft. has been accounted for towards extra amenities such as interior improvement works, fixed furniture, false ceiling, cupboards, modular kitchen, and premium quality electrical, sanitary fittings, and fixtures. Accordingly, the overall cost of the building is assessed at ₹${fields.rateOfCostOfConstruction || '1,800'} per sq. ft. of Super built-up area (SBUA).` },
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

    const adopted = (fields.annexureAdoptedStructures && fields.annexureAdoptedStructures.length > 0)
      ? fields.annexureAdoptedStructures
      : [{ structure: `${structName} Roofing Ground Floor`, cost: fields.rateOfCostOfConstruction ? `GF- Rs.${fields.rateOfCostOfConstruction}/-` : 'GF- Rs.1,600/- & FF- Rs.1,800/-' }];

    for (const a of adopted) {
      const rh1 = this.cellHeight(a.structure, colStruc, { fontSize: TABLE_FONT_SIZE });
      const rh2 = this.cellHeight(a.cost, colCost, { fontSize: TABLE_FONT_SIZE });
      const rowH = Math.max(TABLE_MIN_ROW_H, rh1, rh2);
      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, colStruc, rowH, a.structure, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + colStruc, this.cursorY, colCost, rowH, a.cost, { bold: false, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
      this.cursorY += rowH;
    }
    this.cursorY += 10;

    // Basis & Method of Valuation
    this.drawHeadingText('BASIS OF VALUATION:', TABLE_FONT_SIZE, 'left');
    this.drawParagraph(fields.annexureBasisOfValuation || 'HERE THE APPROVED VALUER SHOULD DISCUSS IN DETAIL HIS APPROACH TO VALUATION OF PROPERTY AND INDICATE HOW THE VALUE HAS BEEN ARRIVED AT, SUPPORTED BY NECESSARY CALCULATIONS. ALSO, SUCH ASPECTS AS I.) SALE ABILITY. II.) LIKELY RENTAL VALUES IN FUTURE AND. ii.) ANY LIKELY INCOME IT MAY GENERATE MAY BE DISCUSSED.');
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

    const methodRows = (fields.annexureMethodClassification && fields.annexureMethodClassification.length > 0)
      ? fields.annexureMethodClassification
      : [{ description: 'Residential building', classification: 'Residential', ingredients: '', elements: '', approach: 'Market Approach', method: '' }];

    for (const mr of methodRows) {
      const rh1 = this.cellHeight(mr.description || '', mcW, { fontSize: FONT_SIZE_SMALL });
      const rh2 = this.cellHeight(mr.classification || '', mcW, { fontSize: FONT_SIZE_SMALL });
      const rh3 = this.cellHeight(mr.ingredients || '', mcW, { fontSize: FONT_SIZE_SMALL });
      const rh4 = this.cellHeight(mr.elements || '', mcW, { fontSize: FONT_SIZE_SMALL });
      const rh5 = this.cellHeight(mr.approach || '', mcW, { fontSize: FONT_SIZE_SMALL });
      const rh6 = this.cellHeight(mr.method || '', mcW, { fontSize: FONT_SIZE_SMALL });
      const rowH = Math.max(TABLE_MIN_ROW_H, rh1, rh2, rh3, rh4, rh5, rh6);
      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, mcW, rowH, mr.description || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW, this.cursorY, mcW, rowH, mr.classification || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW * 2, this.cursorY, mcW, rowH, mr.ingredients || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW * 3, this.cursorY, mcW, rowH, mr.elements || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW * 4, this.cursorY, mcW, rowH, mr.approach || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mcW * 5, this.cursorY, mcW, rowH, mr.method || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.cursorY += rowH;
    }
    this.cursorY += 10;

    // Valuation Computation
    this.drawHeadingText('VALUATION COMPUTATION: -', TABLE_FONT_SIZE, 'left');

    // (A) Land Component
    this.drawHeadingText('(A) VALUATION OF LAND COMPONENT: -', TABLE_FONT_SIZE, 'left');
    this.drawParagraph(`Adopted land rate for this case as on date                              = Rs.${fields.annexureAdoptedLandRate || fields.plotRate || '1800'}/-`);
    this.cursorY += 3;

    const landCalc = `Multiplying by the area of the land Component ${fields.annexureLandArea || fields.propertyArea || '10,890 sqft.'} (x) Rs.${fields.annexureAdoptedLandRate || fields.plotRate || '1800'}/- = Rs.${fields.annexureLandValue || '1,96,02,000'}/-`;
    this.drawParagraph(landCalc, { bold: true });
    this.cursorY += 3;

    this.drawParagraph(`Value of the land component as on date          =   Rs.${fields.annexureLandValue || '1,96,02,000'} /- ...............(A)`, { bold: true });
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
      : [
          { particulars: 'GF', area: '1225 Sqft.', yearOfConst: '2016', lifeInYrs: '10', costOfConst: 'Rs.1600/-', gcrc: 'No', depreciation: '50', value: 'Rs.19,60,000/-' },
          { particulars: 'FF & SF', area: '2450sqft', yearOfConst: '2016', lifeInYrs: '10', costOfConst: 'Rs.1800/-', gcrc: 'No', depreciation: '50', value: 'Rs.44,10,000/-' },
        ];

    for (const df of drcFloors) {
      const rh1 = this.cellHeight(df.particulars || '', drcW1, { fontSize: FONT_SIZE_SMALL });
      const rh2 = this.cellHeight(df.area || '', drcW2, { fontSize: FONT_SIZE_SMALL });
      const rh3 = this.cellHeight(df.yearOfConst || '', drcW3, { fontSize: FONT_SIZE_SMALL });
      const rh4 = this.cellHeight(df.lifeInYrs || '', drcW4, { fontSize: FONT_SIZE_SMALL });
      const rh5 = this.cellHeight(df.costOfConst || '', drcW5, { fontSize: FONT_SIZE_SMALL });
      const rh6 = this.cellHeight(df.gcrc || '', drcW6, { fontSize: FONT_SIZE_SMALL });
      const rh7 = this.cellHeight(df.depreciation || '', drcW7, { fontSize: FONT_SIZE_SMALL });
      const rh8 = this.cellHeight(df.value || '', drcW8, { fontSize: FONT_SIZE_SMALL });
      const rowH = Math.max(TABLE_MIN_ROW_H, rh1, rh2, rh3, rh4, rh5, rh6, rh7, rh8);
      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, drcW1, rowH, df.particulars || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1, this.cursorY, drcW2, rowH, df.area || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2, this.cursorY, drcW3, rowH, df.yearOfConst || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3, this.cursorY, drcW4, rowH, df.lifeInYrs || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4, this.cursorY, drcW5, rowH, df.costOfConst || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4 + drcW5, this.cursorY, drcW6, rowH, df.gcrc || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4 + drcW5 + drcW6, this.cursorY, drcW7, rowH, df.depreciation || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + drcW1 + drcW2 + drcW3 + drcW4 + drcW5 + drcW6 + drcW7, this.cursorY, drcW8, rowH, df.value || '', { bold: false, fontSize: FONT_SIZE_SMALL, align: 'center', vAlign: 'middle' });
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
    const finalMktValStr = `Rs.${rawMktVal}/-`;
    const mktNum = parseNum(rawMktVal);
    const finalRealVal = fields.realisableValue || (mktNum > 0 ? `Rs.${formatCurrencyINR(Math.round(mktNum * 0.95))}/-` : 'Rs.2,46,73,400/-');
    const finalDistVal = fields.distressSaleValue || (mktNum > 0 ? `Rs.${formatCurrencyINR(Math.round(mktNum * 0.90))}/-` : 'Rs.2,33,74,800/-');

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
    const opinion = fields.opinionStatement || `AS A RESULT OF MY / OUR APPRAISAL AND ANALYSIS IT IS MY/OUR CONSIDERED OPINION THAT THE PRESENT MARKET VALUE OF THE ABOVE PROPERTY IN THE PREVAILING CONDITION WITH AFORESAID SPECIFICATIONS IS ${finalMktValStr} AND INSURABLE VALUE OF THE PROPERTY IS NOT IN OUR SCOPE.`;
    this.drawParagraph(opinion, { bold: true, fontSize: TABLE_FONT_SIZE });
    this.cursorY += 10;

    // Declaration
    this.drawHeadingText('DECLARATION:', TABLE_FONT_SIZE, 'left');
    this.drawParagraph('I /WE HEREBY DECLARE THAT:');
    this.cursorY += 4;

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
      `O. THIS VALUATION REPORT CONTAINS ${fields.valuerReportPagesCount || '12'} PAGES ONLY.`,
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
    this.drawHeadingText(`NAME OF THE EMPANELLED VALUER: ${fields.valuerSignatureName || 'S. MOHANTY & ASSOCIATES'}`, TABLE_FONT_SIZE, 'left');
    this.drawHeadingText(`EDUCATIONAL/ PROFESSIONAL QUALIFICATION: ${fields.valuerQualification || 'B.Tech (Civil), M.Val (RE)'}`, TABLE_FONT_SIZE, 'left');
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
    // 1. ROR Document Page
    if (fields.rorImageUrl) {
      this.addPage();
      this.drawHeadingText('ROR', FONT_SIZE_TITLE, 'left');
      await this.drawDocImage(fields.rorImageUrl, CONTENT_W, 600);
    }

    // 2. GPS Location Map Page
    if (fields.locationMapImageUrl) {
      this.addPage();
      this.drawHeadingText('GPS LOCATION OF THE PROPERTY:', FONT_SIZE_HEADER, 'left');
      await this.drawDocImage(fields.locationMapImageUrl, CONTENT_W, 260);
      this.cursorY += 15;
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
    if (fields.bhuNakshaImageUrl) {
      this.addPage();
      this.drawHeadingText('Bhu Naksha: -', FONT_SIZE_HEADER, 'left');
      await this.drawDocImage(fields.bhuNakshaImageUrl, CONTENT_W, 580);
    }

    // 5. Guideline Value Proof Document (Annexure-C)
    if (fields.guidelineValueImageUrl) {
      this.addPage();
      this.drawHeadingText('Annexure-C - Guide line value of the land', FONT_SIZE_HEADER, 'left');
      await this.drawDocImage(fields.guidelineValueImageUrl, CONTENT_W, 600);
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
