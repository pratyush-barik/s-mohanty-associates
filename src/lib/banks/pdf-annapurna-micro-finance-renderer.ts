/**
 * pdf-annapurna-micro-finance-renderer.ts — Dedicated PDF renderer for Annapurna Micro Finance Ltd.
 *
 * Strictly adheres to standard Bank Report typography, font shapes, styles, and sizes from PDFBankRenderer:
 * - Font Shape: Times-Roman, Times-Bold, Times-Italic (StandardFonts.TimesRoman family)
 * - Font Sizes:
 *   • Titles & Main Headers: FONT_SIZE_TITLE (14pt Bold)
 *   • Section Headers: FONT_SIZE_HEADER (14pt Bold Uppercase)
 *   • Tables & Key-Value Body: FONT_SIZE (12pt Bold labels / Regular values)
 *   • Dense Data Grids: FONT_SIZE_SMALL (10.5-12pt)
 *   • Captions & Notes: FONT_SIZE_CAPTION (10pt Italic)
 * - Styling & Color Definitions:
 *   • Section Header Banners: #DDE9F6 at 50% opacity with BORDER_W (0.5pt) solid black border
 *   • Table & Field Labels: #DBE6F0 at 50% opacity with BORDER_W (0.5pt) solid black border
 *   • Highlighted Values & Totals: #FEF9E7 at 50% opacity with BORDER_W (0.5pt) solid black border
 *   • Cell Padding: CELL_PAD_X (4pt), CELL_PAD_Y (3pt)
 *   • Margins: MARGIN_T = 108pt (clearing letterhead header), MARGIN_B = 80pt, CONTENT_W = 487.28pt
 */

import { rgb } from 'pdf-lib';
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
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
} from '../pdf-bank-renderer';

export interface AnnapurnaMicroFinanceReportFields {
  // Application Details
  refNo?: string;
  reportDate?: string;
  fileNo?: string;
  dateOfVisit?: string;
  applicantName?: string;
  contactPerson?: string;
  loanType?: string;
  personMetOnSite?: string;
  propertyOwner?: string;
  documentsProvided?: string;

  // Location Details
  addressAsPerSite?: string;
  locality?: string;
  landmarkNearBy?: string;
  distanceFromBranch?: string;
  latLong?: string;
  addressAsPerLegal?: string;
  floorNo?: string;
  propertyState?: string;
  propertyCity?: string;
  propertyPincode?: string;
  addressMatching?: string;
  jurisdiction?: string;
  holdingType?: string;
  marketability?: string;
  propertyOccupiedBy?: string;
  propertyTypeCategory?: string;
  occupancyStatus?: string;

  // Schedule of Property (4-side comparison)
  northLegal?: string;
  northSite?: string;
  northSketch?: string;
  eastLegal?: string;
  eastSite?: string;
  eastSketch?: string;
  westLegal?: string;
  westSite?: string;
  westSketch?: string;
  southLegal?: string;
  southSite?: string;
  southSketch?: string;
  boundariesMatching?: string;
  propertyIdentified?: string;
  approachRoadSize?: string;

  // NDMA Parameters
  natureOfBuilding?: string;
  planAspectRatio?: string;
  structureType?: string;
  projectedParts?: string;
  masonryType?: string;
  expansionJoints?: string;
  roofType?: string;
  steelGrade?: string;
  mortarType?: string;
  concreteGrade?: string;
  environmentExposure?: string;
  footingType?: string;
  seismicZone?: string;
  soilLiquefiable?: string;
  coastalRegulatoryZone?: string;
  soilSlopeVulnerable?: string;
  floodProneArea?: string;
  groundSlopeMoreThan20?: string;

  // Approved Plan Details
  fireExit?: string;
  sanctionedPlanProvided?: string;
  layoutPlanNo?: string;
  constructionPlanNo?: string;
  dateOfSanction?: string;
  planValidity?: string;
  approvingAuthority?: string;
  approvedUsages?: string;
  numberOfFloorsInBuilding?: string;

  // Technical Details
  currentOccupant?: string;
  separateAccess?: string;
  accommodationDetails?: string;

  // Plot Area Details
  eastDocs?: string;
  eastSiteMeas?: string;
  eastPlan?: string;
  westDocs?: string;
  westSiteMeas?: string;
  westPlan?: string;
  northDocs?: string;
  northSiteMeas?: string;
  northPlan?: string;
  southDocs?: string;
  southSiteMeas?: string;
  southPlan?: string;
  landAreaDocs?: string;
  landAreaSite?: string;
  landAreaPlan?: string;

  // BAU Area Details
  bauFloors?: {
    floor: string;
    rooms: string;
    kitchens: string;
    bathrooms: string;
    sanctionedUsage: string;
    actualUsage: string;
  }[];

  // FSI & Demolition Details
  permissibleAreaPlan?: string;
  landComponent?: string;
  permissibleFsi?: string;
  permissibleConstructionFsi?: string;
  actualConstructionBua?: string;
  considerConstructionBua?: string;
  riskOfDemolition?: string;
  propertyStatus?: string;
  isCompleted?: string;
  completedPct?: string;
  recommendedPct?: string;
  currentAge?: string;
  residualAge?: string;

  // Valuation Details
  landAreaSqft?: string;
  landRateSqft?: string;
  landTotalValue?: string;
  buaAreaSqft?: string;
  buaRateSqft?: string;
  buaTotalValue?: string;
  marketValue?: string;
  distressedPct?: string;
  distressedValue?: string;
  govtRate?: string;
  inDemolitionList?: string;
  inNegativeArea?: string;
  remarks?: string;

  // Additional Checks
  approachRoadType?: string;
  developmentSurroundingArea?: string;
  distanceFromCityCentre?: string;
  distanceFromCorporationLimits?: string;
  electricity?: string;
  electricityDistributor?: string;
  waterSupply?: string;
  waterDistributor?: string;
  sewerProvision?: string;
  sewerLineConnected?: string;
  demolitionThreat?: string;

  // Declaration
  declarationSiteEngineer?: string;
  declarationInspectionDate?: string;
  place?: string;
  assignedEngineers?: { name: string; designation?: string; role?: string }[];

  // Photos & Maps
  propertyImages?: string[];
  propertyImageNames?: string[];
  locationMapImage?: string;
  locationMapImages?: string[];
  mouzaMapImage?: string;
  mouzaMapImages?: string[];
  sketchMapImages?: string[];
  cadastralMapImage?: string;
  cadastralMapImages?: string[];

  // Annexures
  annexures?: any[];

  [key: string]: any;
}
export type AnnapurnaMicroReportFields = AnnapurnaMicroFinanceReportFields;

export class PDFAnnapurnaMicroFinanceRenderer extends PDFBankRenderer {
  /**
   * Draw a styled rectangular cell adhering to base bank definitions:
   * - Times-Bold for labels/headers, Times-Roman for regular values, Times-Italic for captions
   * - 50% opacity #DBE6F0 for labels, #DDE9F6 for table headers, #FEF9E7 for highlighted totals
   * - Standard 0.5pt black border, standard 4pt horizontal / 3pt vertical padding
   */
  drawCleanCell(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    options: {
      bold?: boolean;
      italic?: boolean;
      fontSize?: number;
      align?: 'left' | 'center' | 'right';
      vAlign?: 'top' | 'middle';
      bg?: string;
      opacity?: number;
      highlight?: boolean;
      isHeader?: boolean;
      isLabel?: boolean;
    } = {}
  ): void {
    const fontSize = options.fontSize || FONT_SIZE;
    const font = options.italic
      ? this.fontItalic
      : (options.bold || options.isHeader || options.isLabel || options.highlight)
      ? this.fontBold
      : this.fontRegular;
    const vAlign = options.vAlign || 'middle';
    const align = options.align || 'left';

    let bgColor: string | null = options.bg || null;
    if (!bgColor) {
      if (options.isHeader) bgColor = OPT_BG;
      else if (options.isLabel || options.bold) bgColor = LBL_BG;
      else if (options.highlight) bgColor = VAL_BG;
    }

    const rectOpts: any = {
      x,
      y: y - h,
      width: w,
      height: h,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    };

    if (bgColor) {
      rectOpts.color = hexToRgb(bgColor);
      rectOpts.opacity = options.opacity !== undefined ? options.opacity : BG_OPACITY;
    }

    this.page.drawRectangle(rectOpts);

    const cleanText = this.sanitizeText(text);
    if (!cleanText) return;

    const padX = 4;
    const padY = 3;
    const maxTextW = Math.max(10, w - padX * 2);
    const lines = this.wrapText(cleanText, maxTextW, fontSize, !!(options.bold || options.isHeader || options.isLabel || options.highlight));
    const lineH = fontSize * LINE_HEIGHT;
    const totalTextH = lines.length * lineH;

    let startY: number;
    if (vAlign === 'middle' && h >= totalTextH + padY * 2) {
      startY = (y - h / 2) + (totalTextH / 2) - (fontSize * 0.82);
    } else {
      startY = y - padY - (fontSize * 0.82);
    }

    for (const line of lines) {
      let lineX = x + padX;
      if (align === 'center') {
        const tw = font.widthOfTextAtSize(line, fontSize);
        lineX = x + (w - tw) / 2;
      } else if (align === 'right') {
        const tw = font.widthOfTextAtSize(line, fontSize);
        lineX = x + w - padX - tw;
      }

      this.page.drawText(line, {
        x: Math.max(x + 1, lineX),
        y: startY,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      startY -= lineH;
    }
  }

  /**
   * Draw a row of cells whose height dynamically accommodates the maximum wrapped line height,
   * automatically checking page breaks to prevent overflowing bottom margin.
   */
  drawCleanRow(
    cols: {
      text: string;
      width: number;
      bold?: boolean;
      italic?: boolean;
      fontSize?: number;
      align?: 'left' | 'center' | 'right';
      vAlign?: 'top' | 'middle';
      bg?: string;
      highlight?: boolean;
      isHeader?: boolean;
      isLabel?: boolean;
    }[],
    minH: number = 20,
    rowPad: number = 6
  ): number {
    let maxLines = 1;
    for (const col of cols) {
      const fs = col.fontSize || FONT_SIZE;
      const isBold = !!(col.bold || col.isHeader || col.isLabel || col.highlight);
      const lines = this.wrapText(this.sanitizeText(col.text), Math.max(10, col.width - 8), fs, isBold);
      if (lines.length > maxLines) {
        maxLines = lines.length;
      }
    }

    const maxFs = Math.max(...cols.map(c => c.fontSize || FONT_SIZE));
    const rowH = Math.max(minH, maxLines * maxFs * LINE_HEIGHT + rowPad);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    for (const col of cols) {
      this.drawCleanCell(curX, y, col.width, rowH, col.text, col);
      curX += col.width;
    }

    this.cursorY += rowH;
    return rowH;
  }

  /**
   * Main PDF Generation orchestration for Annapurna Micro Finance Ltd
   */
  async generateAnnapurnaReport(
    fields: AnnapurnaMicroReportFields,
    images: {
      photos: { bytes: Uint8Array; label?: string }[];
      locationMaps: Uint8Array[];
      mouzaMaps: Uint8Array[];
      sketchMaps: Uint8Array[];
      cadastralMaps: Uint8Array[];
    }
  ): Promise<Uint8Array> {
    // ══════════════════════════════════════════════════════════════════════
    // PAGE 1: Header + Application Details + Location Details (Part 1)
    // ══════════════════════════════════════════════════════════════════════

    // 1. Ref No & Date (Times-Bold, 12pt)
    const yHead = this.pdfY(this.cursorY);
    const fontB = this.fontBold;
    const refText = `Ref No: ${this.sanitizeText(fields.refNo || 'AFPL/07-26/02')}`;
    this.page.drawText(refText, {
      x: MARGIN_L,
      y: yHead - FONT_SIZE,
      size: FONT_SIZE,
      font: fontB,
      color: rgb(0, 0, 0),
    });

    const dateText = `Date: ${this.sanitizeText(fields.reportDate || fields.dateOfVisit || '')}`;
    const dateW = fontB.widthOfTextAtSize(dateText, FONT_SIZE);
    this.page.drawText(dateText, {
      x: MARGIN_L + CONTENT_W - dateW,
      y: yHead - FONT_SIZE,
      size: FONT_SIZE,
      font: fontB,
      color: rgb(0, 0, 0),
    });
    this.cursorY += FONT_SIZE + 10;

    // 2. Main Title Banner (Standard 14pt Bold Banner in #DBE6F0)
    this.drawMainHeader('VALUATION REPORT — ANNAPURNA FINANCE');

    // 3. Application Details Section (14pt Bold Banner in #DDE9F6)
    this.drawSectionHeader('Application Details');

    // 4. Application Details Table (width = CONTENT_W = 487.28pt, 12pt typography)
    const appCol1 = 125;
    const appCol2 = 120;
    const appCol3 = 120;
    const appCol4 = CONTENT_W - (appCol1 + appCol2 + appCol3);

    this.drawCleanRow([
      { text: 'File No. / LAN No. / Lead No.', width: appCol1, isLabel: true },
      { text: fields.fileNo || 'NA', width: appCol2 },
      { text: 'Date of Visit', width: appCol3, isLabel: true },
      { text: fields.dateOfVisit || 'NA', width: appCol4 },
    ]);
    this.drawCleanRow([
      { text: 'Name of Applicant & No.', width: appCol1, isLabel: true },
      { text: fields.applicantName || 'NA', width: appCol2 },
      { text: 'Contact Person Name & No.', width: appCol3, isLabel: true },
      { text: fields.contactPerson || 'NA', width: appCol4 },
    ]);
    this.drawCleanRow([
      { text: 'Loan Type (HL/LAP/BT)', width: appCol1, isLabel: true },
      { text: fields.loanType || 'LAP', width: appCol2 },
      { text: 'Person Met on Site & Contact number', width: appCol3, isLabel: true },
      { text: fields.personMetOnSite || fields.contactPerson || 'NA', width: appCol4 },
    ]);
    this.drawCleanRow([
      { text: 'Name of Property Owner as per Legal Document & No.', width: appCol1 + appCol2, isLabel: true },
      { text: fields.propertyOwner || 'NA', width: appCol3 + appCol4 },
    ]);
    this.drawCleanRow([
      { text: 'Documents Provided', width: appCol1, isLabel: true },
      { text: fields.documentsProvided || 'COPY OF Sale deed, ROR & Sketch map', width: appCol2 + appCol3 + appCol4 },
    ]);

    // 5. Location Details Section (Exactly matches reference layout with dynamic height)
    this.drawSectionHeader('Location Details');

    const locSideW = 135;
    const locSubW = CONTENT_W - locSideW;
    const subCol1 = 110;
    const subCol2 = 65;
    const subCol3 = 95;
    const subCol4 = locSubW - (subCol1 + subCol2 + subCol3); // 82.28
    const subColFull = locSubW - subCol1; // 242.28

    const calcSubH = (items: { text: string; width: number; isLabel?: boolean }[], minH = 22): number => {
      let maxLines = 1;
      for (const it of items) {
        const lines = this.wrapText(this.sanitizeText(it.text), Math.max(10, it.width - 8), FONT_SIZE, !!it.isLabel);
        if (lines.length > maxLines) maxLines = lines.length;
      }
      return Math.max(minH, maxLines * FONT_SIZE * LINE_HEIGHT + 8);
    };

    // Block 1: Address as per Site
    const addrText = fields.addressAsPerSite || 'NA';
    const latLongVal = fields.latLong
      ? fields.latLong
      : (fields.latitude && fields.longitude)
      ? `Lat:- ${fields.latitude} Long:- ${fields.longitude}`
      : (fields.latitude || fields.longitude || 'NA');

    const subH1 = calcSubH([
      { text: 'Address as per Site:', width: subCol1, isLabel: true },
      { text: addrText, width: subColFull },
    ]);
    const subH2 = calcSubH([
      { text: 'Locality (Urban, semi Urban, Rural)', width: subCol1, isLabel: true },
      { text: fields.locality || 'RURAL', width: subCol2 },
      { text: 'Landmark Near By', width: subCol3, isLabel: true },
      { text: fields.landmarkNearBy || 'NA', width: subCol4 },
    ]);
    const subH3 = calcSubH([
      { text: 'Distance from Branch in km', width: subCol1, isLabel: true },
      { text: fields.distanceFromBranch || 'NA', width: subCol2 },
      { text: 'LAT/LONG', width: subCol3, isLabel: true },
      { text: latLongVal, width: subCol4 },
    ]);
    const totalBlock1H = subH1 + subH2 + subH3;

    this.checkPageBreak(totalBlock1H);
    let curY = this.pdfY(this.cursorY);

    this.drawCleanCell(MARGIN_L, curY, locSideW, totalBlock1H, 'Address of Property', { isLabel: true, align: 'center', vAlign: 'middle' });

    // Sub-row 1: Address as per Site
    this.drawCleanCell(MARGIN_L + locSideW, curY, subCol1, subH1, 'Address as per Site:', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1, curY, subColFull, subH1, addrText);

    // Sub-row 2: Locality & Landmark
    const top2 = curY - subH1;
    this.drawCleanCell(MARGIN_L + locSideW, top2, subCol1, subH2, 'Locality (Urban, semi Urban, Rural)', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1, top2, subCol2, subH2, fields.locality || 'RURAL', { align: 'center' });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1 + subCol2, top2, subCol3, subH2, 'Landmark Near By', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1 + subCol2 + subCol3, top2, subCol4, subH2, fields.landmarkNearBy || 'NA');

    // Sub-row 3: Distance from branch & Lat/Long
    const top3 = curY - subH1 - subH2;
    this.drawCleanCell(MARGIN_L + locSideW, top3, subCol1, subH3, 'Distance from Branch in km', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1, top3, subCol2, subH3, fields.distanceFromBranch || 'NA', { align: 'center' });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1 + subCol2, top3, subCol3, subH3, 'LAT/LONG', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1 + subCol2 + subCol3, top3, subCol4, subH3, latLongVal);

    this.cursorY += totalBlock1H;

    // Block 2: Legal Address of the Property
    const legalAddrText = fields.addressAsPerLegal || fields.addressAsPerSite || 'NA';
    const subLegalH1 = calcSubH([
      { text: 'Address of Property as per Legal', width: subCol1, isLabel: true },
      { text: legalAddrText, width: subColFull },
    ]);
    const subLegalH2 = calcSubH([
      { text: 'Floor No. of Property', width: subCol1, isLabel: true },
      { text: fields.floorNo || 'NA', width: subColFull },
    ]);
    const subLegalH3 = calcSubH([
      { text: 'Property State', width: subCol1, isLabel: true },
      { text: fields.propertyState || 'Odisha', width: subColFull },
    ]);
    const totalBlock2H = subLegalH1 + subLegalH2 + subLegalH3;

    this.checkPageBreak(totalBlock2H);
    curY = this.pdfY(this.cursorY);

    this.drawCleanCell(MARGIN_L, curY, locSideW, totalBlock2H, 'Legal Address of the Property:\n(As per Title Deed)', { isLabel: true, align: 'center', vAlign: 'middle' });

    // Sub-row 4: Address as per Legal
    this.drawCleanCell(MARGIN_L + locSideW, curY, subCol1, subLegalH1, 'Address of Property as per Legal', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1, curY, subColFull, subLegalH1, legalAddrText);

    // Sub-row 5: Floor No.
    const top5 = curY - subLegalH1;
    this.drawCleanCell(MARGIN_L + locSideW, top5, subCol1, subLegalH2, 'Floor No. of Property', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1, top5, subColFull, subLegalH2, fields.floorNo || 'NA');

    // Sub-row 6: Property State
    const top6 = curY - subLegalH1 - subLegalH2;
    this.drawCleanCell(MARGIN_L + locSideW, top6, subCol1, subLegalH3, 'Property State', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1, top6, subColFull, subLegalH3, fields.propertyState || 'Odisha');

    this.cursorY += totalBlock2H;

    // Block 3: Property City & Pincode (Empty left cell, matching Image 2)
    const hCity = calcSubH([
      { text: 'Property City', width: subCol1, isLabel: true },
      { text: fields.propertyCity || 'NA', width: subColFull },
    ]);
    const hPincode = calcSubH([
      { text: 'Property Pincode', width: subCol1, isLabel: true },
      { text: fields.propertyPincode || 'NA', width: subColFull },
    ]);
    const totalBlock3H = hCity + hPincode;

    this.checkPageBreak(totalBlock3H);
    curY = this.pdfY(this.cursorY);

    this.drawCleanCell(MARGIN_L, curY, locSideW, totalBlock3H, '', {});

    // Row 7: Property City
    this.drawCleanCell(MARGIN_L + locSideW, curY, subCol1, hCity, 'Property City', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1, curY, subColFull, hCity, fields.propertyCity || 'NA');

    // Row 8: Property Pincode
    const top8 = curY - hCity;
    this.drawCleanCell(MARGIN_L + locSideW, top8, subCol1, hPincode, 'Property Pincode', { isLabel: true });
    this.drawCleanCell(MARGIN_L + locSideW + subCol1, top8, subColFull, hPincode, fields.propertyPincode || 'NA');

    this.cursorY += totalBlock3H;

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 2: Location Details Continued + Schedule Table + NDMA Parameters
    // ══════════════════════════════════════════════════════════════════════
    this.checkPageBreak(120);

    // Row 9: Address Matching & Jurisdiction
    this.drawCleanRow([
      { text: 'Address Matching (Yes/No)', width: 140, isLabel: true },
      { text: fields.addressMatching || 'YES', width: 55, align: 'center' },
      { text: 'Jurisdiction/Local Municipal Body/Development Authority', width: 180, isLabel: true },
      { text: fields.jurisdiction || 'NA', width: CONTENT_W - 375 },
    ]);

    // Row 10: Property Holding Type & Marketability
    this.drawCleanRow([
      { text: 'Property Holding Type (Freehold/Leasehold)', width: 170, isLabel: true },
      { text: fields.holdingType || 'FREE HOLD', width: 70, align: 'center' },
      { text: 'Marketability (POOR/FAIR/GOOD)', width: 140, isLabel: true },
      { text: (fields.marketability || 'FAIR').toUpperCase(), width: CONTENT_W - 380, align: 'center' },
    ]);

    // Row 11: Property Occupied By
    this.drawCleanRow([
      { text: 'Property Occupied by (Self/Tenant/Vacant/Under Construction)', width: 230, isLabel: true },
      { text: fields.propertyOccupiedBy || 'Self', width: CONTENT_W - 230 },
    ]);

    // Row 12: Type of the Property
    this.drawCleanRow([
      { text: 'Type of the Property (Flat/Commercial/Plot/etc.)', width: 230, isLabel: true },
      { text: fields.propertyTypeCategory || 'Commercial Building', width: CONTENT_W - 230 },
    ]);

    // Row 13: Occupancy Status
    this.drawCleanRow([
      { text: 'Occupancy Status (SORP/SOCP/Rented/Vacant)\n(Please mention only one)', width: 230, isLabel: true },
      { text: fields.occupancyStatus || 'SORP', width: CONTENT_W - 230 },
    ]);

    // Schedule of Property (seamlessly continues with no space or section banner)
    const schW1 = 120;
    const schW2 = 122;
    const schW3 = 122;
    const schW4 = CONTENT_W - (schW1 + schW2 + schW3);

    this.drawCleanRow([
      { text: 'Schedule of the Property', width: schW1, isHeader: true, align: 'center' },
      { text: 'As per legal documents', width: schW2, isHeader: true, align: 'center' },
      { text: 'As per site visit', width: schW3, isHeader: true, align: 'center' },
      { text: 'As Per Sketch Map', width: schW4, isHeader: true, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'North', width: schW1, isLabel: true },
      { text: fields.northLegal || 'Not mentioned', width: schW2 },
      { text: fields.northSite || 'NA', width: schW3 },
      { text: fields.northSketch || 'NA', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'East', width: schW1, isLabel: true },
      { text: fields.eastLegal || 'Not mentioned', width: schW2 },
      { text: fields.eastSite || 'NA', width: schW3 },
      { text: fields.eastSketch || 'NA', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'West', width: schW1, isLabel: true },
      { text: fields.westLegal || 'Not mentioned', width: schW2 },
      { text: fields.westSite || 'NA', width: schW3 },
      { text: fields.westSketch || 'NA', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'South', width: schW1, isLabel: true },
      { text: fields.southLegal || 'Not mentioned', width: schW2 },
      { text: fields.southSite || 'NA', width: schW3 },
      { text: fields.southSketch || 'NA', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'Boundaries Matching (Yes/No)', width: schW1, isLabel: true },
      { text: fields.boundariesMatching || 'Boundary is matching', width: schW2 },
      { text: 'Property Identified (Yes/No)', width: schW3, isLabel: true },
      { text: fields.propertyIdentified || 'Yes', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'Approach Road Size (<5ft/5-10ft/10-15ft/>15ft)', width: schW1 + schW2, isLabel: true },
      { text: fields.approachRoadSize || '>20 FT', width: schW3 + schW4 },
    ]);

    // NDMA Parameters Section (Standard FONT_SIZE = 12 typography)
    this.drawSectionHeader('NDMA Parameters');

    const ndmaL1 = 130;
    const ndmaV1 = 113.64;
    const ndmaL2 = 130;
    const ndmaV2 = 113.64;

    this.drawCleanRow([
      { text: 'Nature of Building/Wing', width: ndmaL1, isLabel: true },
      { text: fields.natureOfBuilding || 'RCC', width: ndmaV1 },
      { text: 'Plan Aspect Ratio', width: ndmaL2, isLabel: true },
      { text: fields.planAspectRatio || 'NA', width: ndmaV2 },
    ]);
    this.drawCleanRow([
      { text: 'Structure Type', width: ndmaL1, isLabel: true },
      { text: fields.structureType || 'RCC', width: ndmaV1 },
      { text: 'Projected Parts Available', width: ndmaL2, isLabel: true },
      { text: fields.projectedParts || 'NA', width: ndmaV2 },
    ]);
    this.drawCleanRow([
      { text: 'Type of Masonry', width: ndmaL1, isLabel: true },
      { text: fields.masonryType || 'BRICK', width: ndmaV1 },
      { text: 'Expansion Joints Available', width: ndmaL2, isLabel: true },
      { text: fields.expansionJoints || 'No', width: ndmaV2 },
    ]);
    this.drawCleanRow([
      { text: 'Roof Type', width: ndmaL1, isLabel: true },
      { text: fields.roofType || 'RCC', width: ndmaV1 },
      { text: 'Steel Grade', width: ndmaL2, isLabel: true },
      { text: fields.steelGrade || 'FE 450', width: ndmaV2 },
    ]);
    this.drawCleanRow([
      { text: 'Mortar Type', width: ndmaL1, isLabel: true },
      { text: fields.mortarType || 'NA', width: ndmaV1 },
      { text: 'Concrete Grade', width: ndmaL2, isLabel: true },
      { text: fields.concreteGrade || 'NA', width: ndmaV2 },
    ]);
    this.drawCleanRow([
      { text: 'Environment Exposure', width: ndmaL1, isLabel: true },
      { text: fields.environmentExposure || 'Mild', width: ndmaV1 },
      { text: 'Footing Type', width: ndmaL2, isLabel: true },
      { text: fields.footingType || 'NA', width: ndmaV2 },
    ]);
    this.drawCleanRow([
      { text: 'Seismic Zone', width: ndmaL1, isLabel: true },
      { text: fields.seismicZone || 'II&III', width: ndmaV1 },
      { text: 'Soil liquefiable', width: ndmaL2, isLabel: true },
      { text: fields.soilLiquefiable || 'No', width: ndmaV2 },
    ]);
    this.drawCleanRow([
      { text: 'Coastal Regulatory Zone', width: ndmaL1, isLabel: true },
      { text: fields.coastalRegulatoryZone || 'NO', width: ndmaV1 },
      { text: 'Soil Slope Vulnerable', width: ndmaL2, isLabel: true },
      { text: fields.soilSlopeVulnerable || 'NA', width: ndmaV2 },
    ]);
    this.drawCleanRow([
      { text: 'Flood Prone Area', width: ndmaL1, isLabel: true },
      { text: fields.floodProneArea || 'No', width: ndmaV1 },
      { text: 'Ground Slope > 20%', width: ndmaL2, isLabel: true },
      { text: fields.groundSlopeMoreThan20 || 'No', width: ndmaV2 },
    ]);

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 3: Fire Exit + Approved Plan Details + Technical Details + Area Tables
    // ══════════════════════════════════════════════════════════════════════
    this.checkPageBreak(120);

    // Fire Exit row
    const feCol1 = CONTENT_W - 150;
    this.drawCleanRow([
      { text: '', width: feCol1 },
      { text: 'Fire Exit', width: 75, isLabel: true },
      { text: fields.fireExit || 'NA', width: 75 },
    ], 20);

    // Section: Approved Plan & Technical Details
    this.drawSectionHeader('Approved Plan Details');

    const planSideW = 140;
    const planRightW = CONTENT_W - planSideW;
    const planLabelW = 210;
    const planValW = planRightW - planLabelW;

    const planItems = [
      { l: 'Sanctioned Plan Provided (Yes/No)', v: fields.sanctionedPlanProvided || 'NO' },
      { l: 'Layout Plan Details: Sanctioned No./Permit No.', v: fields.layoutPlanNo || 'NA' },
      { l: 'Construction Plan Details: Sanctioned No/Permit No.', v: fields.constructionPlanNo || 'NA' },
      { l: 'Date of Sanction', v: fields.dateOfSanction || 'NA' },
      { l: 'Plan Validity', v: fields.planValidity || 'NA' },
      { l: 'Approving Authority', v: fields.approvingAuthority || 'NA' },
    ];

    // Dynamically calculate row heights so wrapped titles never collide or overlap
    const planRowHeights = planItems.map(item => {
      const linesL = this.wrapText(this.sanitizeText(item.l), Math.max(10, planLabelW - 8), FONT_SIZE, true);
      const linesV = this.wrapText(this.sanitizeText(item.v), Math.max(10, planValW - 8), FONT_SIZE, false);
      const maxLines = Math.max(linesL.length, linesV.length);
      return Math.max(22, maxLines * FONT_SIZE * LINE_HEIGHT + 8);
    });
    const totalPlanH = planRowHeights.reduce((sum, h) => sum + h, 0);

    this.checkPageBreak(totalPlanH + 50);
    curY = this.pdfY(this.cursorY);

    this.drawCleanCell(MARGIN_L, curY, planSideW, totalPlanH, 'Approved Plan Details if self-construction case', {
      isLabel: true,
      align: 'center',
      vAlign: 'middle',
    });

    let currentPlanY = curY;
    for (let i = 0; i < planItems.length; i++) {
      const rH = planRowHeights[i];
      this.drawCleanCell(MARGIN_L + planSideW, currentPlanY, planLabelW, rH, planItems[i].l, { isLabel: true });
      this.drawCleanCell(MARGIN_L + planSideW + planLabelW, currentPlanY, planValW, rH, planItems[i].v);
      currentPlanY -= rH;
    }
    this.cursorY += totalPlanH;

    const fullPlanLabelW = planSideW + planLabelW;
    const fullPlanValW = CONTENT_W - fullPlanLabelW;
    this.drawCleanRow([
      { text: 'Approved Usages (Residential/Industrial/Commercial/Mixed Usages)', width: fullPlanLabelW, isLabel: true },
      { text: fields.approvedUsages || 'NA', width: fullPlanValW },
    ]);
    this.drawCleanRow([
      { text: 'Number of Floor in Building', width: fullPlanLabelW, isLabel: true },
      { text: fields.numberOfFloorsInBuilding || 'NA', width: fullPlanValW },
    ]);

    // Technical Details Section Header
    this.drawSectionHeader('Technical Details');

    this.drawCleanRow([
      { text: 'Current Occupant of Property (Owner/Tenant/Vacant)', width: 185, isLabel: true },
      { text: fields.currentOccupant || 'Owner', width: 75 },
      { text: 'Separate Independent Access (Yes/No)', width: 155, isLabel: true },
      { text: fields.separateAccess || 'NA', width: CONTENT_W - 415 },
    ]);
    this.drawCleanRow([
      { text: 'Accommodation details: Floor wise and Occupancy', width: 185, isLabel: true },
      { text: fields.accommodationDetails || 'G+1', width: CONTENT_W - 185 },
    ]);

    // Plot Area Details Table
    const plotW1 = 120;
    const plotW2 = 122;
    const plotW3 = 122;
    const plotW4 = CONTENT_W - 364;

    this.drawCleanRow([
      { text: 'Plot Area Details', width: plotW1, isHeader: true, align: 'center' },
      { text: 'As Per Documents', width: plotW2, isHeader: true, align: 'center' },
      { text: 'As Per Site Visit', width: plotW3, isHeader: true, align: 'center' },
      { text: 'As Per Plan/Sketch map', width: plotW4, isHeader: true, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'East', width: plotW1, isLabel: true },
      { text: fields.eastDocs || 'NA', width: plotW2 },
      { text: fields.eastSiteMeas || 'NA', width: plotW3 },
      { text: fields.eastPlan || 'NA', width: plotW4 },
    ]);
    this.drawCleanRow([
      { text: 'West', width: plotW1, isLabel: true },
      { text: fields.westDocs || 'NA', width: plotW2 },
      { text: fields.westSiteMeas || 'NA', width: plotW3 },
      { text: fields.westPlan || 'NA', width: plotW4 },
    ]);
    this.drawCleanRow([
      { text: 'North', width: plotW1, isLabel: true },
      { text: fields.northDocs || 'NA', width: plotW2 },
      { text: fields.northSiteMeas || 'NA', width: plotW3 },
      { text: fields.northPlan || 'NA', width: plotW4 },
    ]);
    this.drawCleanRow([
      { text: 'South', width: plotW1, isLabel: true },
      { text: fields.southDocs || 'NA', width: plotW2 },
      { text: fields.southSiteMeas || 'NA', width: plotW3 },
      { text: fields.southPlan || 'NA', width: plotW4 },
    ]);
    this.drawCleanRow([
      { text: 'Land Area (In Sqft.)', width: plotW1, isLabel: true },
      { text: fields.landAreaDocs || fields.landAreaSqft || 'NA', width: plotW2, bold: true },
      { text: fields.landAreaSite || fields.landAreaSqft || 'NA', width: plotW3, bold: true },
      { text: fields.landAreaPlan || 'NA', width: plotW4, bold: true },
    ]);

    // BAU Area Details Table (Standard FONT_SIZE = 12 typography)
    const bauW1 = 110;
    const bauW2 = 60;
    const bauW3 = 60;
    const bauW4 = 65;
    const bauW5 = 85;
    const bauW6 = CONTENT_W - (bauW1 + bauW2 + bauW3 + bauW4 + bauW5);

    this.drawCleanRow([
      { text: 'BAU Area Details', width: bauW1, isHeader: true, align: 'center' },
      { text: 'No. of Rooms', width: bauW2, isHeader: true, align: 'center' },
      { text: 'No. of Kitchens', width: bauW3, isHeader: true, align: 'center' },
      { text: 'No. of Bathrooms', width: bauW4, isHeader: true, align: 'center' },
      { text: 'Sanctioned Usages', width: bauW5, isHeader: true, align: 'center' },
      { text: 'Actual Usage (Residential/Commercial)', width: bauW6, isHeader: true, align: 'center' },
    ]);

    const floorsData = fields.bauFloors && fields.bauFloors.length > 0 ? fields.bauFloors : [
      { floor: 'Basement/Stilt Floor', rooms: 'NA', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
      { floor: 'GROUND FLOOR', rooms: '2', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
      { floor: 'First Floor', rooms: 'NA', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
    ];

    for (const fl of floorsData) {
      this.drawCleanRow([
        { text: fl.floor, width: bauW1, isLabel: true },
        { text: fl.rooms || 'NA', width: bauW2, align: 'center' },
        { text: fl.kitchens || 'NA', width: bauW3, align: 'center' },
        { text: fl.bathrooms || 'NA', width: bauW4, align: 'center' },
        { text: fl.sanctionedUsage || 'NA', width: bauW5, align: 'center' },
        { text: fl.actualUsage || 'NA', width: bauW6, align: 'center' },
      ]);
    }

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 4: FSI Details + Valuation Table + Remarks Box
    // ══════════════════════════════════════════════════════════════════════
    this.checkPageBreak(120);

    // FSI Details Section Header (Standard FONT_SIZE = 12 typography)
    this.drawSectionHeader('FSI & Building Details');

    const fsiW1 = 60;
    const fsiW2 = 72;
    const fsiW3 = 72;
    const fsiW4 = 60;
    const fsiW5 = 72;
    const fsiW6 = 75;
    const fsiW7 = CONTENT_W - (fsiW1 + fsiW2 + fsiW3 + fsiW4 + fsiW5 + fsiW6);

    this.drawCleanRow([
      { text: 'Items', width: fsiW1, isHeader: true, align: 'center' },
      { text: 'Permissible area as per plan (In Sq. Ft)', width: fsiW2, isHeader: true, align: 'center' },
      { text: 'Land Component (In Sq. Ft)', width: fsiW3, isHeader: true, align: 'center' },
      { text: 'Permissible FSI', width: fsiW4, isHeader: true, align: 'center' },
      { text: 'Permissible construction as per FSI', width: fsiW5, isHeader: true, align: 'center' },
      { text: 'Actual construction (BUA) (In Sq. Ft)', width: fsiW6, isHeader: true, align: 'center' },
      { text: 'Consider construction (BUA)', width: fsiW7, isHeader: true, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'Values', width: fsiW1, isLabel: true, align: 'center' },
      { text: fields.permissibleAreaPlan || 'NA', width: fsiW2, align: 'center' },
      { text: fields.landComponent || fields.landAreaSqft || 'NA', width: fsiW3, align: 'center' },
      { text: fields.permissibleFsi || 'NA', width: fsiW4, align: 'center' },
      { text: fields.permissibleConstructionFsi || 'NA', width: fsiW5, align: 'center' },
      { text: fields.actualConstructionBua || 'NA', width: fsiW6, align: 'center' },
      { text: fields.considerConstructionBua || 'NA', width: fsiW7, align: 'center' },
    ]);

    // Status, Risk of Demolition, Age
    this.drawCleanRow([
      { text: 'Risk of Demolition (High/Medium/Low)', width: 280, isLabel: true },
      { text: fields.riskOfDemolition || 'LOW', width: CONTENT_W - 280 },
    ]);

    // Status of the Property: single left cell vertically merged spanning both rows
    const statusW1 = 175;
    const statusW2 = 100;
    const statusW3 = 105;
    const statusW4 = CONTENT_W - (statusW1 + statusW2 + statusW3);

    const statusTextL = 'Status of the Property (Plot/Under Construction/ Completed/ Construction on Hold)';
    const statusLinesL = this.wrapText(this.sanitizeText(statusTextL), Math.max(10, statusW1 - 8), FONT_SIZE, true);
    const minLeftH = Math.max(50, statusLinesL.length * FONT_SIZE * LINE_HEIGHT + 10);

    const hRow1 = Math.max(26, Math.floor(minLeftH / 2));
    const hRow2 = Math.max(24, minLeftH - hRow1);
    const totalStatusH = hRow1 + hRow2;

    this.checkPageBreak(totalStatusH + 30);
    curY = this.pdfY(this.cursorY);

    // Left merged cell spanning both rows
    this.drawCleanCell(MARGIN_L, curY, statusW1, totalStatusH, statusTextL, {
      isLabel: true,
      align: 'left',
      vAlign: 'middle',
    });

    // Row 1 (Headers)
    this.drawCleanCell(MARGIN_L + statusW1, curY, statusW2, hRow1, 'COMPLETED (Y/N)', { isHeader: true, align: 'center', vAlign: 'middle' });
    this.drawCleanCell(MARGIN_L + statusW1 + statusW2, curY, statusW3, hRow1, '100% Completed', { isHeader: true, align: 'center', vAlign: 'middle' });
    this.drawCleanCell(MARGIN_L + statusW1 + statusW2 + statusW3, curY, statusW4, hRow1, '100% Recommended', { isHeader: true, align: 'center', vAlign: 'middle' });

    // Row 2 (Values)
    const yRow2 = curY - hRow1;
    this.drawCleanCell(MARGIN_L + statusW1, yRow2, statusW2, hRow2, fields.propertyStatus || 'NA', { align: 'center', vAlign: 'middle' });
    this.drawCleanCell(MARGIN_L + statusW1 + statusW2, yRow2, statusW3, hRow2, fields.completedPct || 'NA', { align: 'center', vAlign: 'middle' });
    this.drawCleanCell(MARGIN_L + statusW1 + statusW2 + statusW3, yRow2, statusW4, hRow2, fields.recommendedPct || 'NA', { align: 'center', vAlign: 'middle' });

    this.cursorY += totalStatusH;

    this.drawCleanRow([
      { text: 'Current Age of Property', width: 145, isLabel: true },
      { text: fields.currentAge || 'NA', width: 95 },
      { text: 'Residual Age', width: 110, isLabel: true },
      { text: fields.residualAge || 'NA', width: CONTENT_W - 350 },
    ]);

    // ══════════════════════════════════════════════════════════════════════
    // Section break after Current Age of Property / Residual Age:
    // Valuation Table starts on the next page
    // ══════════════════════════════════════════════════════════════════════
    this.addPage();
    this.drawSectionHeader('Valuation Details', false);

    // Valuation Table
    const valW1 = 160;
    const valW2 = 110;
    const valW3 = 100;
    const valW4 = CONTENT_W - (valW1 + valW2 + valW3);

    this.drawCleanRow([
      { text: 'Items', width: valW1, isHeader: true, align: 'center' },
      { text: 'Area Details in Sq. Ft.', width: valW2, isHeader: true, align: 'center' },
      { text: 'Rate per Sq. Ft.', width: valW3, isHeader: true, align: 'center' },
      { text: 'Total Values in Rupees', width: valW4, isHeader: true, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'Land Value', width: valW1, isLabel: true },
      { text: fields.landAreaSqft ? `${fields.landAreaSqft} SQFT` : 'NA', width: valW2, align: 'center' },
      { text: fields.landRateSqft ? `Rs.${fields.landRateSqft}/-` : 'NA', width: valW3, align: 'center' },
      { text: fields.landTotalValue ? `Rs.${fields.landTotalValue}/-` : 'NA', width: valW4, align: 'center', bold: true },
    ]);
    this.drawCleanRow([
      { text: 'BUA Value RCC GF', width: valW1, isLabel: true },
      { text: fields.buaAreaSqft ? `${fields.buaAreaSqft} SQFT` : 'NA', width: valW2, align: 'center' },
      { text: fields.buaRateSqft ? `Rs.${fields.buaRateSqft}/-` : 'Rs.0/-', width: valW3, align: 'center' },
      { text: fields.buaTotalValue ? `Rs.${fields.buaTotalValue}/-` : 'Rs.0/-', width: valW4, align: 'center', bold: true },
    ]);
    this.drawCleanRow([
      { text: 'Market Value After Completion (In Rs.)', width: valW1 + valW2 + valW3, isLabel: true },
      { text: fields.marketValue ? `Rs.${fields.marketValue}/-` : 'NA', width: valW4, align: 'center', highlight: true },
    ]);
    this.drawCleanRow([
      { text: `Distressed/Force Value (${fields.distressedPct || '80'}%) (In Rs.)`, width: valW1 + valW2 + valW3, isLabel: true },
      { text: fields.distressedValue ? `Rs.${fields.distressedValue}/-` : 'NA', width: valW4, align: 'center', highlight: true },
    ]);
    this.drawCleanRow([
      { text: 'Government/Circle Rate Value', width: valW1 + valW2 + valW3, isLabel: true },
      { text: fields.govtRate ? `Rs.${fields.govtRate}/- PER SQFT` : 'NA', width: valW4, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'In Municipal/Development Authority Demolition list (Yes/No)', width: valW1 + valW2 + valW3, isLabel: true },
      { text: fields.inDemolitionList || 'NO', width: valW4, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'Is Property in Negative Area (Yes/No)', width: valW1 + valW2 + valW3, isLabel: true },
      { text: fields.inNegativeArea || 'NO', width: valW4, align: 'center' },
    ]);

    // Remarks Box
    const remSideW = 120;
    const remContentW = CONTENT_W - remSideW;
    const remarksText = fields.remarks || 'Subject property has been physically inspected. Boundary details match the title deed/ROR. Clear access available.';
    const remLines = this.wrapText(remarksText, remContentW - 8, FONT_SIZE);
    const remH = Math.max(90, remLines.length * FONT_SIZE * LINE_HEIGHT + 10);

    this.checkPageBreak(remH);
    curY = this.pdfY(this.cursorY);
    this.drawCleanCell(MARGIN_L, curY, remSideW, remH, 'Remarks', { isLabel: true, align: 'center', vAlign: 'middle' });
    this.drawCleanCell(MARGIN_L + remSideW, curY, remContentW, remH, remarksText, { vAlign: 'top' });
    this.cursorY += remH;

    // ══════════════════════════════════════════════════════════════════════
    // Additional Checks & Statutory Declaration (Intact on dedicated page)
    // ══════════════════════════════════════════════════════════════════════
    this.addPage();
    this.drawSectionHeader('Additional Checks & Statutory Declaration', false);

    const chkCol1 = 210;
    const chkCol2 = CONTENT_W - chkCol1;

    this.drawCleanRow([
      { text: 'Approach Road to the property (Single lane/Double lane/Four lane)', width: chkCol1, isLabel: true },
      { text: fields.approachRoadType || 'SINGLE LANE', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Development of surrounding areas to property', width: chkCol1, isLabel: true },
      { text: fields.developmentSurroundingArea || 'SURROUNDING 30%-40% DEVELOPING', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Distance from city centre in Kms', width: chkCol1, isLabel: true },
      { text: fields.distanceFromCityCentre || '50 KMS', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Distance from corporation limits in Kms/Bus stop', width: chkCol1, isLabel: true },
      { text: fields.distanceFromCorporationLimits || '5KMS', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Electricity (Available/Not available)', width: chkCol1, isLabel: true },
      { text: fields.electricity || 'YES', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Electricity Distributor (Govt./Semi-Govt./Private)', width: chkCol1, isLabel: true },
      { text: fields.electricityDistributor || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Water supply (Available/Not Available)', width: chkCol1, isLabel: true },
      { text: fields.waterSupply || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Water Distributor (Govt./Self/Boring water)', width: chkCol1, isLabel: true },
      { text: fields.waterDistributor || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Sewer provision (Yes/No)', width: chkCol1, isLabel: true },
      { text: fields.sewerProvision || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Sewer line connected to main sewer (Yes/No)', width: chkCol1, isLabel: true },
      { text: fields.sewerLineConnected || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Any demolition threat in future development/expansion (Yes/No)', width: chkCol1, isLabel: true },
      { text: fields.demolitionThreat || 'NA', width: chkCol2 },
    ]);

    // Statutory Declaration Row
    const engineerName = fields.declarationSiteEngineer || (fields.assignedEngineers && fields.assignedEngineers[0]?.name) || fields.personMetOnSite || 'Mr. Engineer';
    const inspDate = fields.declarationInspectionDate || fields.dateOfVisit || fields.reportDate || '12/07/2026';

    const declBullets = [
      'The final valuation has been concluded basis Land & Building valuation approach and rates are cross verified with the rates Prevalent in the nearby localities.',
      'We have no direct/indirect interest in the property valued.',
      'The information furnished in the report is true and correct to the best of my knowledge.',
      `${engineerName} has visited the property on dated ${inspDate} & provide the data as collected during site inspection`,
      fields.declarationConviction || 'I have not been convicted of any offence and sentenced to a team of Imprisonment',
    ];

    const declPadX = 6;
    const declPadY = 5;
    const declBulletGap = 4;
    const declIndent = 14;
    const bulletTextW = chkCol2 - declPadX * 2 - declIndent;

    const bulletLinesArr = declBullets.map(b => this.wrapText(this.sanitizeText(b), bulletTextW, FONT_SIZE));
    const totalTextLines = bulletLinesArr.reduce((sum, l) => sum + l.length, 0);
    const totalTextH = totalTextLines * (FONT_SIZE * LINE_HEIGHT) + (declBullets.length - 1) * declBulletGap;
    const declH = Math.max(130, totalTextH + declPadY * 2);

    this.checkPageBreak(declH + 20);
    curY = this.pdfY(this.cursorY);

    // 1. Left cell: Declaration (I hereby declare that)
    this.drawCleanCell(MARGIN_L, curY, chkCol1, declH, 'Declaration (I hereby declare that)', {
      isLabel: true,
      align: 'center',
      vAlign: 'middle',
    });

    // 2. Right cell: Border & background
    this.page.drawRectangle({
      x: MARGIN_L + chkCol1,
      y: curY - declH,
      width: chkCol2,
      height: declH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    // 3. Draw each bullet with bullet symbol '•', hanging indent & bullet gap
    let textY = curY - declPadY - (FONT_SIZE * 0.82);
    const lineH = FONT_SIZE * LINE_HEIGHT;
    const fontReg = this.fontRegular;

    for (let bIdx = 0; bIdx < bulletLinesArr.length; bIdx++) {
      const lines = bulletLinesArr[bIdx];

      // Draw bullet symbol '•' on the first line
      this.page.drawText('•', {
        x: MARGIN_L + chkCol1 + declPadX + 2,
        y: textY,
        size: FONT_SIZE,
        font: fontReg,
        color: rgb(0, 0, 0),
      });

      // Draw lines of bullet text indented
      for (const line of lines) {
        this.page.drawText(line, {
          x: MARGIN_L + chkCol1 + declPadX + declIndent,
          y: textY,
          size: FONT_SIZE,
          font: fontReg,
          color: rgb(0, 0, 0),
        });
        textY -= lineH;
      }

      // Spacing between bullets
      if (bIdx < bulletLinesArr.length - 1) {
        textY -= declBulletGap;
      }
    }

    this.cursorY += declH + 10;

    // Date & Place
    this.checkPageBreak(65);
    const yFooter = this.pdfY(this.cursorY);
    this.page.drawText(`Date: ${this.sanitizeText(fields.reportDate || fields.dateOfVisit || '')}`, {
      x: MARGIN_L,
      y: yFooter,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(`Place: ${this.sanitizeText(fields.place || 'Bhubaneswar')}`, {
      x: MARGIN_L,
      y: yFooter - 18,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    // Official Appraiser Signature Block
    const engineers = fields.assignedEngineers && fields.assignedEngineers.length > 0 ? fields.assignedEngineers : [
      { name: 'Er. S. Mohanty', designation: 'Chartered Engineer & Approved Valuer', role: 'Chief Valuer' }
    ];

    const sigY = yFooter;
    const sigBoxW = 220;
    const sigStartX = MARGIN_L + CONTENT_W - sigBoxW;

    this.page.drawText('For S MOHANTY ASSOCIATES', {
      x: sigStartX,
      y: sigY,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    let currentSigY = sigY - 36;
    for (const eng of engineers) {
      this.page.drawText(eng.name, {
        x: sigStartX,
        y: currentSigY,
        size: FONT_SIZE,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      currentSigY -= 14;
      if (eng.designation) {
        this.page.drawText(eng.designation, {
          x: sigStartX,
          y: currentSigY,
          size: FONT_SIZE_CAPTION,
          font: this.fontItalic,
          color: rgb(0, 0, 0),
        });
        currentSigY -= 12;
      }
    }
    this.cursorY += 60;

    // ══════════════════════════════════════════════════════════════════════
    // PAGES 6+: Photographs -> Maps -> Annexures
    // Strictly in requested sequence:
    // 1. Photographs of the Property
    // 2. Google Satellite Map
    // 3. Mouza Map
    // 4. Sketch Map
    // 5. Cadastral Map
    // 6. Annexures
    // ══════════════════════════════════════════════════════════════════════

    // 1. Photographs of the Property
    if (images.photos && images.photos.length > 0) {
      this.addPage();
      this.drawSectionHeader('PHOTOGRAPHS OF THE PROPERTY');
      await this.drawPhotoGrid(images.photos);
    }

    // 2. Google Satellite Map (supports multiple photos)
    if (images.locationMaps && images.locationMaps.length > 0) {
      await this.drawMapGallery(images.locationMaps, 'GOOGLE SATELLITE MAP');
    }

    // 3. Mouza Map (supports multiple photos)
    if (images.mouzaMaps && images.mouzaMaps.length > 0) {
      await this.drawMapGallery(images.mouzaMaps, 'MOUZA MAP');
    }

    // 4. Sketch Map (supports multiple photos)
    if (images.sketchMaps && images.sketchMaps.length > 0) {
      await this.drawMapGallery(images.sketchMaps, 'SKETCH MAP');
    }

    // 5. Cadastral Map (supports multiple photos)
    if (images.cadastralMaps && images.cadastralMaps.length > 0) {
      await this.drawMapGallery(images.cadastralMaps, 'CADASTRAL MAP');
    }

    // 6. Annexures
    if (fields.annexures && fields.annexures.length > 0) {
      this.renderAnnexures(fields.annexures);
    }

    return await this.doc.save();
  }
}

export const PDFAnnapurnaMicroRenderer = PDFAnnapurnaMicroFinanceRenderer;
export default PDFAnnapurnaMicroFinanceRenderer;
