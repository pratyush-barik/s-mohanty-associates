/**
 * pdf-arthan-finance-renderer.ts — Dedicated PDF renderer for Arthan Finance.
 *
 * Translates the XLSX-style Arthan Finance valuation report format into a
 * clean pdf-lib rendered format, structured as:
 *
 * 1. Header: Date of Valuation (top-right), letterhead watermark
 * 2. Section 1 — Technical Initiation Request Form Data
 * 3. Section 2 — Locational & Property Specific Details
 * 4. Section 3 — Boundaries (4 directions × 3 sources + Matching)
 * 5. Section 4 — Setbacks / Margin
 * 6. Section 5 — Height / Storieys
 * 7. Section 6 — Built-up Area & Accommodation Details (dynamic BUA table)
 * 8. Section 7 — Plan Approvals
 * 9. Section 8 — Estimate Analysis
 * 10. Section 9 — Valuation of Property (auto-calculated fields)
 * 11. Section 10 — Property Specific Remarks & Observation
 * 12. Section 11 — Valuer Certification
 * 13. Section 12 — Property Photographs (bucket-based)
 * 14. Section 13 — Location cum Route Map (device-upload maps)
 *
 * Standard bank palette:
 * - Section header banners: #DDE9F6 at 50% opacity
 * - Label cells: #DBE6F0 at 50% opacity
 * - Highlighted totals: #FEF9E7 at 50% opacity
 * - Margins: MARGIN_T = 108pt, MARGIN_B = 80pt, CONTENT_W = 487.28pt
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
  formatReportDate,
} from '../pdf-bank-renderer';
import { formatAssignedEngineers } from '@/app/portal/reports/[projectId]/banks/BaseBankReportComponents';

export interface ArthanFinanceBUAFloor {
  floor: string;
  accommodation: string;
  carpetArea: string;
  actualBUA: string;
  permissibleBUA: string;
  adoptedBUA: string;
}

export interface ArthanFinanceReportFields {
  // Header
  dateOfValuation?: string;

  // Section 1 — Technical Initiation Request Form Data
  proposalNo?: string;
  caseType?: string;
  dateOfInspection?: string;
  nearestLandmark?: string;
  customerName?: string;       // Name of Customer/Applicant & Contact Details
  ownerName?: string;          // Name of Current Owner / Seller
  ownerOrSeller?: 'Owner' | 'Seller'; // Choice between Owner and Seller
  personMetOnSite?: string;    // Name of Person met at site & Contact No.
  addressAsPerTRF?: string;
  addressAsPerDocument?: string;
  addressAsPerActualSite?: string;
  documentsProvided?: string;

  // Section 2 — Locational & Property Specific Details
  statusOfLandHolding?: string;
  developedBy?: string;
  typeOfProperty?: string;
  typeOfLocality?: string;
  dateOfInspectionSite?: string; // repeat from sec1
  occupationStatus?: string;
  locationZoningMasterPlan?: string;
  propertyUsage?: string;
  plotDemarcation?: string;
  propertyIdentifiable?: string;
  identifiedThrough?: string;
  withinMCLimit?: string;
  internalFinishing?: string;
  typeOfStructure?: string;
  noOfFloors?: string;
  locatedOnFloorNo?: string;
  totalFlatsUnits?: string;
  externalFinishing?: string;
  externalFinishingDetail?: string;
  yearOfCompletion?: string;
  constructionStage?: string;
  disbursementRecommended?: string;
  ageOfProperty?: string;
  futurePhysicalLife?: string;

  // Section 3 — Boundaries
  boundaryNorthDocs?: string;
  boundarySouthDocs?: string;
  boundaryEastDocs?: string;
  boundaryWestDocs?: string;
  boundaryNorthSketch?: string;
  boundarySouthSketch?: string;
  boundaryEastSketch?: string;
  boundaryWestSketch?: string;
  boundaryNorthSite?: string;
  boundarySouthSite?: string;
  boundaryEastSite?: string;
  boundaryWestSite?: string;
  boundariesMatching?: string;
  boundariesNotMatchingReason?: string;

  // Section 4 — Setbacks / Margin
  setbackFrontSanctioned?: string;
  setbackRearSanctioned?: string;
  setbackLeftSanctioned?: string;
  setbackRightSanctioned?: string;
  setbackFrontSite?: string;
  setbackRearSite?: string;
  setbackLeftSite?: string;
  setbackRightSite?: string;

  // Section 5 — Height / Storieys
  heightSanctioned?: string;
  heightSite?: string;

  // Section 6 — Built-up Area & Accommodation Details (dynamic floor rows)
  buaFloors?: ArthanFinanceBUAFloor[];
  violationObserved?: string;

  // Section 7 — Plan Approvals
  constructionAsPerPlan?: string;
  approvedPlanDetails?: string;
  constructionPermissionNumberDate?: string;
  violationsObserved?: string;
  structureConfirmingByelaws?: string;

  // Section 8 — Estimate Analysis (Self Construction cases)
  estimatedCostTotal?: string;
  estimatedCostPerSqft?: string;
  justifiedEstimatedCostPerSqft?: string;
  adoptableJustifiedEstimatedCost?: string;

  // Section 9 — Valuation of Property
  landAreaSqft?: string;
  adoptableBuiltUpArea?: string;
  currentMarketRateRange?: string;
  constructionCostPerSqft?: string;
  recommendedRateOfLand?: string;
  totalConstructionValue100?: string;
  totalLandValue?: string;
  totalConstructionValuePresent?: string;
  marketValueLandBuilding?: string;
  marketValueLandBuildingRight?: string;
  distressValue100?: string;
  distressValuePresent?: string;
  flatSBUA?: string;
  compositeSaleRate?: string;
  totalMarketValueApartment?: string;
  govtGuidelineRateLand?: string;
  landValueGovtRate?: string;
  govtGuidelineRateFlats?: string;
  flatValueGovtRate?: string;
  latitude?: string;
  longitude?: string;

  // Section 10 — Remarks
  remarks?: string;

  // Section 11 — Valuer Certification
  dateOfVisit?: string;
  dateOfReportSubmission?: string;
  visitingEngineer?: string;
  authorizedSignatory?: string;

  // Photos & Maps
  propertyImages?: string[];
  propertyImageNames?: string[];
  locationMapImages?: string[];
  cadastralMapImages?: string[];
}

export type ArthanFinanceFields = ArthanFinanceReportFields;

export class PDFArthanFinanceRenderer extends PDFBankRenderer {
  /**
   * Strip/replace characters that WinAnsi (Helvetica) cannot encode while preserving \n for manual line breaks.
   */
  protected override sanitizeText(text: string): string {
    let clean = String(text ?? '');

    // Decode HTML entities
    clean = clean
      .replace(/&amp;/g, '&')
      .replace(/&amp/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&lt/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&gt/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&quot/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&#39;/g, "'");

    return clean
      .replace(/[\r\t]/g, ' ')             // carriage returns/tabs -> space (preserve \n for wrapText)
      .replace(/[\u2018\u2019]/g, "'")     // smart single quotes
      .replace(/[\u201C\u201D]/g, '"')     // smart double quotes
      .replace(/\u2013/g, '-')             // en-dash
      .replace(/\u2014/g, '--')            // em-dash
      .replace(/\u2026/g, '...')           // ellipsis
      .replace(/\u20B9/g, 'Rs.')           // rupee sign
      .replace(/[^\x20-\x7E\n\u2022]/g, ''); // allow ASCII + newline + bullet •
  }

  /**
   * Draw a styled rectangular cell using the standard bank palette.
   */
  drawCell(
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
      segments?: { text: string; bold?: boolean }[];
    } = {}
  ): void {
    const fontSize = options.fontSize || FONT_SIZE;
    const isBold = options.bold !== undefined
      ? options.bold
      : !!(options.isHeader || options.isLabel || options.highlight);
    const font = options.italic
      ? this.fontItalic
      : isBold
      ? this.fontBold
      : this.fontRegular;
    const vAlign = options.vAlign || 'middle';
    const align = options.align || 'left';

    let bgColor: string | null = options.bg || null;
    if (!bgColor) {
      if (options.isHeader) bgColor = OPT_BG;
      else if (options.isLabel) bgColor = LBL_BG;
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

    // Multi-segment text support (e.g. mixed regular and bold in the same cell)
    if (options.segments && options.segments.length > 0) {
      const padX = 4;
      const padY = 3;
      const lineH = fontSize * LINE_HEIGHT;
      let startY: number;
      if (vAlign === 'middle' && h >= lineH + padY * 2) {
        startY = (y - h / 2) + (lineH / 2) - (fontSize * 0.82);
      } else {
        startY = y - padY - (fontSize * 0.82);
      }

      let lineX = x + padX;
      for (const seg of options.segments) {
        const segClean = this.sanitizeText(seg.text);
        if (!segClean) continue;
        const segFont = seg.bold ? this.fontBold : this.fontRegular;
        this.page.drawText(segClean, {
          x: Math.max(x + 1, lineX),
          y: startY,
          size: fontSize,
          font: segFont,
          color: rgb(0, 0, 0),
        });
        lineX += segFont.widthOfTextAtSize(segClean, fontSize);
      }
      return;
    }

    const cleanText = this.sanitizeText(text);
    if (!cleanText) return;

    const padX = 4;
    const padY = 3;
    const maxTextW = Math.max(10, w - padX * 2);
    const lines = this.wrapText(cleanText, maxTextW, fontSize, isBold);
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
   * Draw a row of cells with dynamic height to accommodate wrapped text.
   */
  drawRow(
    cols: {
      text: string;
      segments?: { text: string; bold?: boolean }[];
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
      const isBold = col.bold !== undefined
        ? col.bold
        : !!(col.isHeader || col.isLabel || col.highlight);
      const lines = this.wrapText(this.sanitizeText(col.text), Math.max(10, col.width - 8), fs, isBold);
      if (lines.length > maxLines) maxLines = lines.length;
    }

    const maxFs = Math.max(...cols.map(c => c.fontSize || FONT_SIZE));
    const rowH = Math.max(minH, maxLines * maxFs * LINE_HEIGHT + rowPad);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    for (const col of cols) {
      this.drawCell(curX, y, col.width, rowH, col.text, col);
      curX += col.width;
    }

    this.cursorY += rowH;
    return rowH;
  }

  /**
   * Draw a full-width section header banner (salmon-pink in XLSX, standard #DDE9F6 in PDF).
   * Inserts a line break after preceding sections (when not at the top of a page)
   * and ensures title + content fit together without being orphaned.
   */
  drawSectionBanner(title: string): void {
    // Line break after each section (when not at the very top of a new page)
    if (this.cursorY > MARGIN_T + 5) {
      this.cursorY += 10;
    }
    // Title and content should be together: ensure at least banner + 2 content rows fit
    this.checkPageBreak(64);
    const y = this.pdfY(this.cursorY);
    this.drawCell(MARGIN_L, y, CONTENT_W, 22, title, {
      isHeader: true,
      bold: true,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += 22;
  }

  /**
   * Main PDF generation method for Arthan Finance valuation reports.
   */
  async generateArthanReport(
    fields: ArthanFinanceReportFields,
    images: {
      photos: { bytes: Uint8Array; label?: string }[];
      locationMaps: Uint8Array[];
      cadastralMaps: Uint8Array[];
    }
  ): Promise<Uint8Array> {

    // ══════════════════════════════════════════════════════════════════
    // DATE OF VALUATION — Top-right, above content area (page 1 only)
    // ══════════════════════════════════════════════════════════════════
    const dovText = formatReportDate(fields.dateOfValuation, '');
    if (dovText) {
      const dovLabel = `Date of Valuation:  ${this.sanitizeText(dovText)}`;
      const dovW = this.fontBold.widthOfTextAtSize(dovLabel, FONT_SIZE);
      const yDov = this.pdfY(this.cursorY) - FONT_SIZE;
      this.page.drawText(dovLabel, {
        x: MARGIN_L + CONTENT_W - dovW,
        y: yDov,
        size: FONT_SIZE,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      this.cursorY += FONT_SIZE + 8;
    }

    // ══════════════════════════════════════════════════════════════════
    // SECTION 1 — Technical Initiation Request Form Data
    // ══════════════════════════════════════════════════════════════════
    this.drawSectionBanner('Technical Initiation Request Form Data');

    const s1L = 155; // label col width
    const s1V = CONTENT_W / 2 - s1L; // value col width (left half)
    const s1L2 = 155; // right label col width
    const s1V2 = CONTENT_W - s1L - s1V - s1L2; // right value col width

    // Row: Proposal No | Case Type
    this.drawRow([
      { text: 'Proposal No', width: s1L, isLabel: true },
      { text: fields.proposalNo || '', width: s1V },
      { text: 'Case Type', width: s1L2, isLabel: true },
      { text: fields.caseType || '', width: s1V2 },
    ], 20, 4);

    // Row: Date of Inspection / Site visit | Nearest Landmark
    this.drawRow([
      { text: 'Date of Inspection / Site visit', width: s1L, isLabel: true },
      { text: formatReportDate(fields.dateOfInspection, ''), width: s1V },
      { text: 'Nearest Landmark', width: s1L2, isLabel: true },
      { text: fields.nearestLandmark || '', width: s1V2 },
    ], 20, 4);

    // Row: Customer / Applicant Name & Contact (full width value)
    this.drawRow([
      { text: 'Name of the Customer/ Applicant & Contact Details', width: s1L, isLabel: true },
      { text: fields.customerName || '', width: CONTENT_W - s1L },
    ], 20, 4);

    // Row: Name of Current Owner / Seller (bold whichever was chosen: Owner or Seller)
    const isSeller = fields.ownerOrSeller === 'Seller';
    this.drawRow([
      {
        text: 'Name of Current Owner / Seller',
        segments: isSeller
          ? [
              { text: 'Name of Current Owner / ', bold: false },
              { text: 'Seller', bold: true },
            ]
          : [
              { text: 'Name of Current ', bold: false },
              { text: 'Owner', bold: true },
              { text: ' / Seller', bold: false },
            ],
        width: s1L,
        isLabel: true,
      },
      { text: fields.ownerName || '', width: CONTENT_W - s1L },
    ], 20, 4);

    // Row: Person met at site & Contact No.
    this.drawRow([
      { text: 'Name of the Person met at site & Contact No.', width: s1L, isLabel: true },
      { text: fields.personMetOnSite || '', width: CONTENT_W - s1L },
    ], 20, 4);

    // Address of the property being appraised — 3 sub-rows with merged left label
    const addrLabelW = s1L;
    const addrSubLabelW = 110;
    const addrValW = CONTENT_W - addrLabelW - addrSubLabelW;

    const addrRows = [
      { sub: 'As per TRF', val: fields.addressAsPerTRF || '' },
      { sub: 'As per Document', val: fields.addressAsPerDocument || '' },
      { sub: 'As per Actual at site', val: fields.addressAsPerActualSite || '' },
    ];

    const addrRowHeights = addrRows.map(r => {
      const linesL = this.wrapText(this.sanitizeText(r.sub), addrSubLabelW - 8, FONT_SIZE, true);
      const linesV = this.wrapText(this.sanitizeText(r.val), addrValW - 8, FONT_SIZE, false);
      return Math.max(22, Math.max(linesL.length, linesV.length) * FONT_SIZE * LINE_HEIGHT + 8);
    });
    const totalAddrH = addrRowHeights.reduce((s, h) => s + h, 0);

    this.checkPageBreak(totalAddrH);
    let curY = this.pdfY(this.cursorY);

    // Merged left label
    this.drawCell(MARGIN_L, curY, addrLabelW, totalAddrH, 'Address of the property being appraised', {
      isLabel: true, align: 'center', vAlign: 'middle',
    });

    let subY = curY;
    for (let i = 0; i < addrRows.length; i++) {
      const rh = addrRowHeights[i];
      this.drawCell(MARGIN_L + addrLabelW, subY, addrSubLabelW, rh, addrRows[i].sub, { isLabel: true });
      this.drawCell(MARGIN_L + addrLabelW + addrSubLabelW, subY, addrValW, rh, addrRows[i].val);
      subY -= rh;
    }
    this.cursorY += totalAddrH;

    // Documents Provided
    this.drawRow([
      { text: 'Documents Provided', width: s1L, isLabel: true },
      { text: fields.documentsProvided || '', width: CONTENT_W - s1L, align: 'center' },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 2 — Locational & Property Specific Details
    // ══════════════════════════════════════════════════════════════════
    this.drawSectionBanner('Locational & Property Specific Details (based on site visit)');

    const s2L = 155;
    const s2V = CONTENT_W / 2 - s2L;
    const s2L2 = 155;
    const s2V2 = CONTENT_W - s2L - s2V - s2L2;

    this.drawRow([
      { text: 'Status of Land Holding', width: s2L, isLabel: true },
      { text: fields.statusOfLandHolding || '', width: s2V, bold: true },
      { text: 'Developed By', width: s2L2, isLabel: true },
      { text: fields.developedBy || 'NA', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Type of Property', width: s2L, isLabel: true },
      { text: fields.typeOfProperty || '', width: s2V },
      { text: 'Type of Locality', width: s2L2, isLabel: true },
      { text: fields.typeOfLocality || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Date of Inspection / Site visit', width: s2L, isLabel: true },
      { text: formatReportDate(fields.dateOfInspectionSite || fields.dateOfInspection, ''), width: s2V },
      { text: 'Occupation Status', width: s2L2, isLabel: true },
      { text: fields.occupationStatus || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Location/Zoning as per Master Plan', width: s2L, isLabel: true },
      { text: fields.locationZoningMasterPlan || 'NA', width: s2V },
      { text: 'Property Usage', width: s2L2, isLabel: true },
      { text: fields.propertyUsage || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Plot Demarcation', width: s2L, isLabel: true },
      { text: fields.plotDemarcation || 'NA', width: s2V },
      { text: 'Property Identifiable', width: s2L2, isLabel: true },
      { text: fields.propertyIdentifiable || 'NA', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Identified Through', width: s2L, isLabel: true },
      { text: fields.identifiedThrough || 'NA', width: s2V },
      { text: 'Within MC / GP Limit & Distance From Nearest M.C', width: s2L2, isLabel: true },
      { text: fields.withinMCLimit || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Internal Finishing', width: s2L, isLabel: true },
      { text: fields.internalFinishing || '', width: s2V },
      { text: 'Type of Structure', width: s2L2, isLabel: true },
      { text: fields.typeOfStructure || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'No. of Floors in the building', width: s2L, isLabel: true },
      { text: fields.noOfFloors || '', width: s2V },
      { text: 'Located on Floor No.', width: s2L2, isLabel: true },
      { text: fields.locatedOnFloorNo || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Total No. of Flats / Unit in building', width: s2L, isLabel: true },
      { text: fields.totalFlatsUnits || '', width: s2V },
      { text: 'External Finishing', width: s2L2, isLabel: true },
      { text: fields.externalFinishing || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'External Finishing', width: s2L, isLabel: true },
      { text: fields.externalFinishingDetail || '', width: s2V },
      { text: 'Year of Completion of Property', width: s2L2, isLabel: true },
      { text: fields.yearOfCompletion || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Construction Stage of the Property (in 100%)', width: s2L, isLabel: true },
      { text: fields.constructionStage || 'NA', width: s2V },
      { text: 'Disbursement Recommended (in %)', width: s2L2, isLabel: true },
      { text: fields.disbursementRecommended || 'NA', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Age of the Property', width: s2L, isLabel: true },
      { text: fields.ageOfProperty || '', width: s2V },
      { text: 'Future Physical Life of Property', width: s2L2, isLabel: true },
      { text: fields.futurePhysicalLife || '', width: s2V2 },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 3 — Boundaries
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 22 * 5);
    this.drawSectionBanner('Boundaries');

    const bW1 = 140; // "Boundaries" label
    const bW2 = (CONTENT_W - bW1) / 4; // North
    const bW3 = (CONTENT_W - bW1) / 4; // South
    const bW4 = (CONTENT_W - bW1) / 4; // East
    const bW5 = CONTENT_W - bW1 - bW2 - bW3 - bW4; // West

    this.drawRow([
      { text: 'Boundaries', width: bW1, isHeader: true, align: 'center' },
      { text: 'North', width: bW2, isHeader: true, align: 'center' },
      { text: 'South', width: bW3, isHeader: true, align: 'center' },
      { text: 'East', width: bW4, isHeader: true, align: 'center' },
      { text: 'West', width: bW5, isHeader: true, align: 'center' },
    ], 22, 4);

    this.drawRow([
      { text: 'As per Documents(Sale Deed)', width: bW1, isLabel: true },
      { text: fields.boundaryNorthDocs || 'Not provided', width: bW2, align: 'center' },
      { text: fields.boundarySouthDocs || 'Not provided', width: bW3, align: 'center' },
      { text: fields.boundaryEastDocs || 'Not provided', width: bW4, align: 'center' },
      { text: fields.boundaryWestDocs || 'Not provided', width: bW5, align: 'center' },
    ], 22, 4);

    this.drawRow([
      { text: 'As per Sketch map', width: bW1, isLabel: true },
      { text: fields.boundaryNorthSketch || '', width: bW2, align: 'center' },
      { text: fields.boundarySouthSketch || '', width: bW3, align: 'center' },
      { text: fields.boundaryEastSketch || '', width: bW4, align: 'center' },
      { text: fields.boundaryWestSketch || '', width: bW5, align: 'center' },
    ], 22, 4);

    this.drawRow([
      { text: 'As per Site / Actual', width: bW1, isLabel: true },
      { text: fields.boundaryNorthSite || '', width: bW2, align: 'center' },
      { text: fields.boundarySouthSite || '', width: bW3, align: 'center' },
      { text: fields.boundaryEastSite || '', width: bW4, align: 'center' },
      { text: fields.boundaryWestSite || '', width: bW5, align: 'center' },
    ], 22, 4);

    // Boundaries Matching row (Aligned to table columns: Boundaries | North+South | East | West)
    const isMatching = (fields.boundariesMatching || 'Yes').trim().toLowerCase() === 'yes';
    const reasonText = isMatching
      ? 'Boundary is matching as per sketch map'
      : (fields.boundariesNotMatchingReason || 'Boundary is not matching');

    this.drawRow([
      { text: 'Boundaries Matching', width: bW1, isLabel: true },
      { text: fields.boundariesMatching || 'Yes', width: bW2 + bW3, align: 'center' },
      { text: 'If No, then reason thereon', width: bW4, isLabel: true, fontSize: 7 },
      { text: reasonText, width: bW5, align: 'center', fontSize: 7 },
    ], 26, 3);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 4 — Setbacks / Margin
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 26 * 2 + 20);
    this.drawSectionBanner('Setbacks / Margin');

    const sbW1 = 185;
    const sbW2 = (CONTENT_W - sbW1) / 4;
    const sbW3 = (CONTENT_W - sbW1) / 4;
    const sbW4 = (CONTENT_W - sbW1) / 4;
    const sbW5 = CONTENT_W - sbW1 - sbW2 - sbW3 - sbW4;

    this.drawRow([
      { text: 'Setbacks / Margin in\nthe Building (in Ft)', width: sbW1, isHeader: true, align: 'center' },
      { text: 'Front', width: sbW2, isHeader: true, align: 'center' },
      { text: 'Rear', width: sbW3, isHeader: true, align: 'center' },
      { text: 'Left Side', width: sbW4, isHeader: true, align: 'center' },
      { text: 'Right Side', width: sbW5, isHeader: true, align: 'center' },
    ], 26, 4);

    this.drawRow([
      { text: 'As per sanctioned/\npermissible byelaws', width: sbW1, isLabel: true },
      { text: fields.setbackFrontSanctioned || 'NA', width: sbW2, align: 'center' },
      { text: fields.setbackRearSanctioned || 'NA', width: sbW3, align: 'center' },
      { text: fields.setbackLeftSanctioned || 'NA', width: sbW4, align: 'center' },
      { text: fields.setbackRightSanctioned || 'NA', width: sbW5, align: 'center' },
    ], 26, 4);

    this.drawRow([
      { text: 'As per Site / Actual', width: sbW1, isLabel: true },
      { text: fields.setbackFrontSite || '', width: sbW2, align: 'center' },
      { text: fields.setbackRearSite || '', width: sbW3, align: 'center' },
      { text: fields.setbackLeftSite || '', width: sbW4, align: 'center' },
      { text: fields.setbackRightSite || '', width: sbW5, align: 'center' },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 5 — Height / Storieys
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 26 + 20);
    this.drawSectionBanner('Height/Storieys');

    const htW1 = sbW1;
    const htWRest = CONTENT_W - htW1;

    this.drawRow([
      { text: 'As per sanctioned/\npermissible byelaws', width: htW1, isLabel: true },
      { text: fields.heightSanctioned || 'NA', width: htWRest, align: 'center' },
    ], 26, 4);

    this.drawRow([
      { text: 'As per Site / Actual', width: htW1, isLabel: true },
      { text: fields.heightSite || '', width: htWRest, align: 'center' },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 6 — Built-up Area & Accommodation Details
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 22 * 6);
    this.drawSectionBanner('Built-up Area & Accommodation Details');

    const buaW1 = 90;  // Floor
    const buaW2 = 80;  // Accommodation
    const buaW3 = 75;  // Carpet Area (Sft)
    const buaW4 = 100; // Actual BUA / SBUA (Sft)
    const buaW5 = 72;  // Permissible BUA (Sft)
    const buaW6 = CONTENT_W - buaW1 - buaW2 - buaW3 - buaW4 - buaW5; // Adopted Built-up area

    this.drawRow([
      { text: 'Floor\n(Pl mention floor wise)', width: buaW1, isHeader: true, align: 'center' },
      { text: 'Accomodation', width: buaW2, isHeader: true, align: 'center' },
      { text: 'Carpet Area (Sft)', width: buaW3, isHeader: true, align: 'center' },
      { text: 'Actual BUA / SBUA (Sft)', width: buaW4, isHeader: true, align: 'center' },
      { text: 'Permissible BUA (Sft)', width: buaW5, isHeader: true, align: 'center' },
      { text: 'Adopted Built-up area (Sft)', width: buaW6, isHeader: true, align: 'center' },
    ], 36, 4);

    const defaultBuaFloors: ArthanFinanceBUAFloor[] = [
      { floor: 'Basement / Stilt', accommodation: 'NA', carpetArea: 'NA', actualBUA: 'NA', permissibleBUA: 'NA', adoptedBUA: 'NA' },
      { floor: 'Ground Floor', accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: 'NA', adoptedBUA: '' },
      { floor: 'First Floor', accommodation: 'NA', carpetArea: 'NA', actualBUA: 'NA', permissibleBUA: 'NA', adoptedBUA: 'NA' },
    ];
    const buaFloors = (fields.buaFloors && fields.buaFloors.length > 0) ? fields.buaFloors : defaultBuaFloors;

    // Calculate total adopted BUA for Total row
    let totalAdoptedBUA = 0;
    let totalCarpetArea = 0;
    for (const fl of buaFloors) {
      const a = parseFloat((fl.adoptedBUA || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(a)) totalAdoptedBUA += a;
      const c = parseFloat((fl.carpetArea || '').replace(/[^0-9.]/g, ''));
      if (!isNaN(c)) totalCarpetArea += c;
    }

    for (const fl of buaFloors) {
      this.drawRow([
        { text: fl.floor, width: buaW1, isLabel: true },
        { text: fl.accommodation || 'NA', width: buaW2, align: 'center' },
        { text: fl.carpetArea || 'NA', width: buaW3, align: 'center' },
        { text: fl.actualBUA || 'NA', width: buaW4, align: 'center' },
        { text: fl.permissibleBUA || 'NA', width: buaW5, align: 'center' },
        { text: fl.adoptedBUA || 'NA', width: buaW6, align: 'center' },
      ], 22, 4);
    }

    // Total row - no bold (regular font for all cells)
    this.drawRow([
      { text: 'Total', width: buaW1, isLabel: true, bold: false },
      { text: 'NA', width: buaW2, align: 'center', bold: false },
      { text: totalCarpetArea > 0 ? String(totalCarpetArea) : 'NA', width: buaW3, align: 'center', bold: false },
      { text: totalAdoptedBUA > 0 ? `${totalAdoptedBUA}sqft` : 'NA', width: buaW4, align: 'center', bold: false },
      { text: 'NA', width: buaW5, align: 'center', bold: false },
      { text: totalAdoptedBUA > 0 ? `${totalAdoptedBUA}sqft` : 'NA', width: buaW6, align: 'center', bold: false },
    ], 22, 4);

    // Violation observed
    this.drawRow([
      { text: 'Violation observed if any', width: buaW1 + buaW2, isLabel: true },
      { text: fields.violationObserved || 'NA', width: CONTENT_W - buaW1 - buaW2, align: 'center' },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 7 — Plan Approvals
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 24 * 3 + 10);
    this.drawSectionBanner('Plan Approvals BP not Provided');

    const paW1 = 175;
    const paW2 = (CONTENT_W / 2) - paW1;
    const paW3 = 175;
    const paW4 = CONTENT_W - paW1 - paW2 - paW3;

    // Row 1: Construction as per approved/ sanctioned plans | NA | Details of approved plan with approval no and date | NA
    this.drawRow([
      { text: 'Construction as per approved/ sanctioned plans', width: paW1, isLabel: true },
      { text: fields.constructionAsPerPlan || 'NA', width: paW2, align: 'center' },
      { text: 'Details of approved plan with approval no and date', width: paW3, isLabel: true },
      { text: fields.approvedPlanDetails || 'NA', width: paW4, align: 'center' },
    ], 24, 4);

    // Row 2: Construction permission Number and date | NA | Violations Observed if Any | NA
    this.drawRow([
      { text: 'Construction permission Number and date', width: paW1, isLabel: true },
      { text: fields.constructionPermissionNumberDate || 'NA', width: paW2, align: 'center' },
      { text: 'Violations Observed if Any', width: paW3, isLabel: true },
      { text: fields.violationsObserved || 'NA', width: paW4, align: 'center' },
    ], 24, 4);

    // Row 3: If plans not available then is the structure confirming to the local byelaws. | NA (spans remaining width)
    this.drawRow([
      { text: 'If plans not available then is the structure confirming to the local byelaws.', width: paW1, isLabel: true },
      { text: fields.structureConfirmingByelaws || 'NA', width: CONTENT_W - paW1, align: 'center' },
    ], 24, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 8 — Estimate Analysis
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 22 * 3);
    this.drawSectionBanner('Estimate Analysis (Applicable only in Self Construction cases)');

    const eaW1 = 185;
    const eaV = CONTENT_W / 2 - eaW1;
    const eaW2 = 185;
    const eaV2 = CONTENT_W - eaW1 - eaV - eaW2;

    this.drawRow([
      { text: 'Estimated Cost (In Rs)', width: eaW1, isLabel: true },
      { text: fields.estimatedCostTotal || 'NA', width: eaV },
      { text: 'Estimated Cost (in Rs per Sqft)', width: eaW2, isLabel: true },
      { text: fields.estimatedCostPerSqft || 'NA', width: eaV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Justified Estimated Cost (in Rs per Sqft)', width: eaW1, isLabel: true },
      { text: fields.justifiedEstimatedCostPerSqft || 'NA', width: eaV },
      { text: 'Adoptable / Justified Estimated Cost (In Rs)', width: eaW2, isLabel: true },
      { text: fields.adoptableJustifiedEstimatedCost || 'NA', width: eaV2 },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 9 — Valuation of Property (Fair Market / Distress)
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 22 * 12);
    this.drawSectionBanner('Valuation of Property (Fair Market Valuation / Distress Valuation)');

    const vlW1 = 185;
    const vlV = CONTENT_W / 2 - vlW1;
    const vlW2 = 185;
    const vlV2 = CONTENT_W - vlW1 - vlV - vlW2;

    this.drawRow([
      { text: 'Land Area (In Sqft)', width: vlW1, isLabel: true },
      { text: fields.landAreaSqft || '', width: vlV },
      { text: 'Adoptable Built-up Area (in Sqft) GF RCC', width: vlW2, isLabel: true },
      { text: fields.adoptableBuiltUpArea || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Current Market Rate of land in the locality (Range) in Rs Per Sqft', width: vlW1, isLabel: true },
      { text: fields.currentMarketRateRange || '', width: vlV },
      { text: 'Construction Cost (Rs per sft)', width: vlW2, isLabel: true },
      { text: fields.constructionCostPerSqft || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Recommended Rate of Land (Rs per sqft)', width: vlW1, isLabel: true },
      { text: fields.recommendedRateOfLand || '', width: vlV },
      { text: 'Total Construction Value for 100% complete building (in Rs)', width: vlW2, isLabel: true },
      { text: fields.totalConstructionValue100 || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Total Land Value (in Rs)', width: vlW1, isLabel: true },
      { text: fields.totalLandValue || '', width: vlV },
      { text: 'Total Construction Value for present construction stage (in Rs)', width: vlW2, isLabel: true },
      { text: fields.totalConstructionValuePresent || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Market Value of Land & Building Only (in Rs)', width: vlW1, isLabel: true },
      { text: fields.marketValueLandBuilding || '', width: vlV, highlight: true },
      { text: 'Market Value of Land & Building Only (in Rs)', width: vlW2, isLabel: true },
      { text: fields.marketValueLandBuildingRight || '', width: vlV2, highlight: true },
    ], 20, 4);

    this.drawRow([
      { text: 'Distress Value of 100% complete property @ 80% of MV', width: vlW1, isLabel: true },
      { text: fields.distressValue100 || '', width: vlV },
      { text: 'Distress Value of present completed property @ 80% of MV', width: vlW2, isLabel: true },
      { text: fields.distressValuePresent || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Flat / Apartment / Shop / Office SBUA (in Sqft)', width: vlW1, isLabel: true },
      { text: fields.flatSBUA || 'NA', width: vlV },
      { text: 'Composite sale rate (Rs per sqft)', width: vlW2, isLabel: true },
      { text: fields.compositeSaleRate || 'NA', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Total Market Value of Apartment / Shop / Flat / Office (Rs per sqft)', width: vlW1, isLabel: true },
      { text: fields.totalMarketValueApartment || 'NA', width: CONTENT_W - vlW1, align: 'center' },
    ], 20, 4);

    this.drawRow([
      { text: 'Government Guideline/ Circle rate for Land (Rs per sqft)', width: vlW1, isLabel: true },
      { text: fields.govtGuidelineRateLand || '', width: vlV },
      { text: 'Land Value as per Government Rate (Rs)', width: vlW2, isLabel: true },
      { text: fields.landValueGovtRate || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Government Guideline/ Circle rate for Flats (Rs per sqft)', width: vlW1, isLabel: true },
      { text: fields.govtGuidelineRateFlats || 'NA', width: vlV },
      { text: 'Flat / Apartment Value as per Government Rate (Rs)', width: vlW2, isLabel: true },
      { text: fields.flatValueGovtRate || 'NA', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Latitude(N)', width: vlW1, isLabel: true },
      { text: fields.latitude || '', width: vlV },
      { text: 'Longitude(E)', width: vlW2, isLabel: true },
      { text: fields.longitude || '', width: vlV2 },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 10 — Property Specific Remarks & Observation
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 50);
    this.drawSectionBanner('Property Specific Remarks & Observation');

    const remLabelW = 120;
    const remValW = CONTENT_W - remLabelW;
    const remarksText = fields.remarks || '';
    const remLines = this.wrapText(remarksText, remValW - 8, FONT_SIZE);
    const remH = Math.max(60, remLines.length * FONT_SIZE * LINE_HEIGHT + 14);

    this.checkPageBreak(remH);
    curY = this.pdfY(this.cursorY);
    this.drawCell(MARGIN_L, curY, remLabelW, remH, 'Remarks / Observation', { isLabel: true, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + remLabelW, curY, remValW, remH, remarksText, { vAlign: 'top' });
    this.cursorY += remH;

    // ══════════════════════════════════════════════════════════════════
    // SECTION 11 — Valuer Certification
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 22 * 3);
    this.drawSectionBanner('Valuer Certification');

    const vcW1 = vlW1;
    const vcV = vlV;
    const vcW2 = vlW2;
    const vcV2 = vlV2;

    this.drawRow([
      { text: 'Date of Visit', width: vcW1, isLabel: true },
      { text: formatReportDate(fields.dateOfInspection || fields.dateOfVisit, ''), width: vcV },
      { text: 'Date of Report Submission', width: vcW2, isLabel: true },
      { text: formatReportDate(fields.dateOfReportSubmission || fields.dateOfValuation, ''), width: vcV2 },
    ], 22, 4);

    this.drawRow([
      { text: 'Name of Engineer Visted the property', width: vcW1, isLabel: true },
      { text: fields.visitingEngineer || '', width: vcV },
      { text: 'Authorized Signatory Name & Signature', width: vcW2, isLabel: true },
      { text: fields.authorizedSignatory || 'Er. Satyajit Mohanty', width: vcV2 },
    ], 22, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 12 — Property Photographs
    // ══════════════════════════════════════════════════════════════════
    if (images.photos && images.photos.length > 0) {
      // Header info rows before photo grid (Arthan XLSX format)
      const phPageMinH = 26 + 22 * 3 + 200;
      this.checkPageBreak(phPageMinH);

      this.drawSectionBanner('PROPERTY PHOTOGRAPHS');

      // Customer & Proposal row
      const phW1 = vlW1;
      const phV = vlV;
      const phW2 = vlW2;
      const phV2 = vlV2;

      this.drawRow([
        { text: 'Name of the Customer/ Applicant', width: phW1, isLabel: true },
        { text: fields.customerName || '', width: phV },
        { text: 'Proposal No.', width: phW2, isLabel: true },
        { text: fields.proposalNo || '', width: phV2 },
      ], 22, 4);

      // Address
      const phAddrLines = this.wrapText(fields.addressAsPerActualSite || fields.addressAsPerDocument || '', CONTENT_W - phW1 - 8, FONT_SIZE);
      const phAddrH = Math.max(24, phAddrLines.length * FONT_SIZE * LINE_HEIGHT + 10);
      this.checkPageBreak(phAddrH);
      curY = this.pdfY(this.cursorY);
      this.drawCell(MARGIN_L, curY, phW1, phAddrH, 'Address of the property being appraised', { isLabel: true, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + phW1, curY, CONTENT_W - phW1, phAddrH, fields.addressAsPerActualSite || fields.addressAsPerDocument || '', { align: 'center', vAlign: 'middle' });
      this.cursorY += phAddrH;

      // Photo grid
      await this.drawPhotoGrid(images.photos, '');

      // Engineer row after photos
      this.checkPageBreak(24);
      this.drawRow([
        { text: 'Name of Engineer Visted the property', width: phW1, isLabel: true },
        { text: fields.visitingEngineer || '', width: phV },
        { text: 'Authorized Signatory Name & Signature', width: phW2, isLabel: true },
        { text: fields.authorizedSignatory || 'Er. Satyajit Mohanty', width: phV2 },
      ], 22, 4);
    }

    // ══════════════════════════════════════════════════════════════════
    // SECTION 13 — Location cum Route Map showing property Boundaries
    // ══════════════════════════════════════════════════════════════════
    const hasMaps = (images.locationMaps && images.locationMaps.length > 0) ||
                    (images.cadastralMaps && images.cadastralMaps.length > 0);

    if (hasMaps) {
      this.checkPageBreak(26 + 22 * 2 + 200);

      this.drawSectionBanner('Location cum Route map showing property Boundaries');

      const mpW1 = vlW1;
      const mpV = vlV;
      const mpW2 = vlW2;
      const mpV2 = vlV2;

      this.drawRow([
        { text: 'Name of the Customer/ Applicant', width: mpW1, isLabel: true },
        { text: fields.customerName || '', width: mpV },
        { text: 'Proposal No.', width: mpW2, isLabel: true },
        { text: fields.proposalNo || '', width: mpV2 },
      ], 22, 4);

      const mpAddrLines = this.wrapText(fields.addressAsPerActualSite || fields.addressAsPerDocument || '', CONTENT_W - mpW1 - 8, FONT_SIZE);
      const mpAddrH = Math.max(24, mpAddrLines.length * FONT_SIZE * LINE_HEIGHT + 10);
      this.checkPageBreak(mpAddrH);
      curY = this.pdfY(this.cursorY);
      this.drawCell(MARGIN_L, curY, mpW1, mpAddrH, 'Address of the property being appraised', { isLabel: true, align: 'center', vAlign: 'middle' });
      this.drawCell(MARGIN_L + mpW1, curY, CONTENT_W - mpW1, mpAddrH, fields.addressAsPerActualSite || fields.addressAsPerDocument || '', { align: 'center', vAlign: 'middle' });
      this.cursorY += mpAddrH;

      // Draw Location & Cadastral maps side-by-side on same page when both present
      const locImgs = images.locationMaps || [];
      const cadImgs = images.cadastralMaps || [];

      if (locImgs.length > 0 && cadImgs.length > 0) {
        // Side-by-side layout: loc map left half, cadastral map right half
        const mapW = (CONTENT_W / 2) - 4;
        const mapH = 200;
        this.checkPageBreak(mapH + 20);
        curY = this.pdfY(this.cursorY);

        try {
          const locImg = await this.doc.embedJpg(locImgs[0]).catch(() => this.doc.embedPng(locImgs[0]));
          this.page.drawImage(locImg, {
            x: MARGIN_L,
            y: curY - mapH,
            width: mapW,
            height: mapH,
          });
        } catch {}

        try {
          const cadImg = await this.doc.embedJpg(cadImgs[0]).catch(() => this.doc.embedPng(cadImgs[0]));
          this.page.drawImage(cadImg, {
            x: MARGIN_L + mapW + 8,
            y: curY - mapH,
            width: mapW,
            height: mapH,
          });
        } catch {}

        this.cursorY += mapH + 8;

        // Additional location maps
        for (let i = 1; i < locImgs.length; i++) {
          await this.drawMapGallery([locImgs[i]], 'LOCATION MAP', 220, false);
        }
        for (let i = 1; i < cadImgs.length; i++) {
          await this.drawMapGallery([cadImgs[i]], 'CADASTRAL MAP', 220, false);
        }
      } else {
        // Single map type only — full width
        if (locImgs.length > 0) {
          await this.drawMapGallery(locImgs, 'LOCATION MAP', 220, false);
        }
        if (cadImgs.length > 0) {
          await this.drawMapGallery(cadImgs, 'CADASTRAL MAP', 220, false);
        }
      }

      // Engineer row after maps
      this.checkPageBreak(24);
      this.drawRow([
        { text: 'Name of Engineer Visted the property', width: mpW1, isLabel: true },
        { text: fields.visitingEngineer || '', width: mpV },
        { text: 'Authorized Signatory Name & Signature', width: mpW2, isLabel: true },
        { text: fields.authorizedSignatory || 'Er. Satyajit Mohanty', width: mpV2 },
      ], 22, 4);
    }

    // Base save() stamps page numbers on every page via this.drawPageNumbers()
    return await this.save();
  }
}

export default PDFArthanFinanceRenderer;
