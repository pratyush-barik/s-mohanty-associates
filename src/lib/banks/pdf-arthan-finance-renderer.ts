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

/**
 * Sanitize input to only accept positive floats (digits and at most one decimal point).
 * Strips negative signs and any invalid characters.
 */
export const sanitizePositiveFloat = (val: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.toUpperCase() === 'NA') return '';
  let cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

/**
 * Sanitize input to only accept positive floats or 'NA' (allows typing 'N' or 'NA').
 * Strips negative signs and invalid characters.
 */
export const sanitizePositiveFloatWithNA = (val: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  const upper = trimmed.toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  let cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

/**
 * Sanitize input to only accept positive integers.
 * Strips negative signs, decimals, and non-digit characters.
 */
export const sanitizePositiveInt = (val: string, maxLen?: number): string => {
  if (!val) return '';
  let cleaned = val.replace(/[^0-9]/g, '');
  if (maxLen && cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen);
  }
  return cleaned;
};

/**
 * Sanitize input to only accept positive integers or 'NA'.
 */
export const sanitizePositiveIntWithNA = (val: string, maxLen?: number): string => {
  if (!val) return '';
  const upper = val.trim().toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  let cleaned = val.replace(/[^0-9]/g, '');
  if (maxLen && cleaned.length > maxLen) {
    cleaned = cleaned.slice(0, maxLen);
  }
  return cleaned;
};

/**
 * Sanitize percentage values: positive float between 0 and 100, with optional '%' suffix.
 * No negative values allowed.
 */
export const sanitizePercentage = (val: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  const upper = trimmed.toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  const hasPercent = trimmed.includes('%');
  let cleaned = trimmed.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  if (!cleaned) return hasPercent ? '%' : '';
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 100) {
    cleaned = '100';
  }
  return hasPercent ? `${cleaned}%` : cleaned;
};

/**
 * Sanitize positive numerical range (e.g. "100-200" or "1500-2000").
 * Strips leading negative signs and ensures only positive numbers on both sides of hyphen.
 */
export const sanitizePositiveRange = (val: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  const upper = trimmed.toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  // Strip any leading minus signs or whitespace
  let cleaned = val.replace(/^[-\s]+/g, '');
  // Keep only digits, dots, spaces, and hyphens
  cleaned = cleaned.replace(/[^0-9.\s-]/g, '');
  // Keep at most one hyphen for the range separator
  const parts = cleaned.split('-');
  if (parts.length > 2) {
    cleaned = parts[0] + '-' + parts.slice(1).join('').replace(/-/g, '');
  }
  return cleaned;
};

/**
 * Sanitize age / future life fields (e.g. "7 Years", "53 Years", or "NA").
 * Eliminates leading negative signs and keeps clean alphanumeric and spaces.
 */
export const sanitizeYearsWithNA = (val: string): string => {
  if (!val) return '';
  const upper = val.trim().toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  // Strip leading minus signs
  let cleaned = val.replace(/^[-\s]+/g, '');
  // Replace symbols/hyphens with a space and keep alphanumeric
  cleaned = cleaned.replace(/[^0-9a-zA-Z\s]/g, ' ');
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  return cleaned;
};

/**
 * Sanitize height / storeys fields (e.g. "GF", "G+1", "10 ft", "NA").
 * Strictly prohibits negative values.
 */
export const sanitizePositiveHeight = (val: string): string => {
  if (!val) return '';
  const upper = val.trim().toUpperCase();
  if (upper === 'NA' || upper === 'N') return upper;
  let cleaned = val.replace(/^[-\s]+/g, '');
  cleaned = cleaned.replace(/[^0-9a-zA-Z\s+.]/g, '');
  return cleaned;
};

/**
 * Exact decimal addition to avoid floating point imprecision without premature roundoff.
 */
export const sumDecimals = (values: (string | undefined | null)[]): number => {
  let sum = 0;
  let maxDecimals = 0;
  for (const v of values) {
    if (!v) continue;
    const s = String(v).trim().replace(/[^0-9.]/g, '');
    if (!s) continue;
    const num = parseFloat(s);
    if (isNaN(num)) continue;
    if (s.includes('.')) {
      const dec = s.split('.')[1].length;
      if (dec > maxDecimals) maxDecimals = dec;
    }
    sum += num;
  }
  if (maxDecimals > 0) {
    const factor = Math.pow(10, Math.min(maxDecimals, 8));
    return Math.round(sum * factor) / factor;
  }
  return Math.round(sum);
};

export const formatExactDecimal = (n: number): string => {
  if (n <= 0) return '';
  return String(n);
};

/**
 * Exact decimal multiplication to avoid IEEE-754 floating point imprecision without roundoff.
 * Returns empty string if either value is missing, non-numeric, or <= 0.
 */
export const multiplyExactDecimals = (
  val1: string | number | undefined | null,
  val2: string | number | undefined | null
): string => {
  if (val1 === undefined || val1 === null || val2 === undefined || val2 === null) return '';
  const s1 = String(val1).trim().replace(/[^0-9.]/g, '');
  const s2 = String(val2).trim().replace(/[^0-9.]/g, '');
  if (!s1 || !s2) return '';
  const n1 = parseFloat(s1);
  const n2 = parseFloat(s2);
  if (isNaN(n1) || isNaN(n2) || n1 <= 0 || n2 <= 0) return '';

  const dec1 = s1.includes('.') ? s1.split('.')[1].length : 0;
  const dec2 = s2.includes('.') ? s2.split('.')[1].length : 0;
  const maxDec = Math.min(dec1 + dec2, 8);
  const raw = n1 * n2;
  const factor = Math.pow(10, maxDec);
  const clean = Math.round(raw * factor) / factor;
  return String(clean);
};

/**
 * Exact percentage calculation (baseValue * percentage / 100) without roundoff.
 * Accepts only positive float values (>= 0). Rejects negative numbers.
 */
export const calculatePercentageValue = (
  baseValue: string | number | undefined | null,
  percentage: string | number | undefined | null
): string => {
  if (baseValue === undefined || baseValue === null || percentage === undefined || percentage === null) return '';
  const bStr = String(baseValue).trim().replace(/[^0-9.]/g, '');
  const pStr = String(percentage).trim().replace(/[^0-9.]/g, '');
  if (!bStr || !pStr) return '';
  const b = parseFloat(bStr);
  const p = parseFloat(pStr);
  if (isNaN(b) || isNaN(p) || b <= 0 || p < 0) return '';
  if (p === 0) return '0';

  const bDec = bStr.includes('.') ? bStr.split('.')[1].length : 0;
  const pDec = pStr.includes('.') ? pStr.split('.')[1].length : 0;
  const maxDec = Math.min(bDec + pDec + 2, 8);
  const raw = (b * p) / 100;
  const factor = Math.pow(10, maxDec);
  const clean = Math.round(raw * factor) / factor;
  return String(clean);
};

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
  adoptableBUASpec?: string;
  currentMarketRateRange?: string;
  constructionCostPerSqft?: string;
  recommendedRateOfLand?: string;
  totalConstructionValue100?: string;
  totalLandValue?: string;
  totalConstructionValuePresent?: string;
  marketValueLandBuilding?: string;
  marketValueLandBuildingRight?: string;
  distressPct100?: string;
  distressPctPresent?: string;
  distressValue100?: string;
  distressValuePresent?: string;
  flatPropertyType?: 'Flat' | 'Apartment' | 'Shop' | 'Office' | 'NA';
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
    const isBold = options.bold === true;
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

    // Multi-segment text support (e.g. mixed regular and bold in the same cell with word wrapping)
    if (options.segments && options.segments.length > 0) {
      const padX = 4;
      const padY = 3;
      const maxTextW = Math.max(10, w - padX * 2);
      const lineH = fontSize * LINE_HEIGHT;

      interface FormattedToken {
        text: string;
        bold?: boolean;
        width: number;
        isSpace: boolean;
        isNewline?: boolean;
      }
      const tokens: FormattedToken[] = [];
      for (const seg of options.segments) {
        const segClean = this.sanitizeText(seg.text);
        if (!segClean) continue;
        const font = seg.bold ? this.fontBold : this.fontRegular;
        const rawParts = segClean.split(/(\n|\s+)/);
        for (const part of rawParts) {
          if (!part) continue;
          const isNewline = part === '\n';
          const isSpace = /^\s+$/.test(part);
          const tw = isNewline ? 0 : font.widthOfTextAtSize(part, fontSize);
          tokens.push({ text: part, bold: seg.bold, width: tw, isSpace, isNewline });
        }
      }

      const lines: FormattedToken[][] = [];
      let curLine: FormattedToken[] = [];
      let curLineW = 0;

      for (const token of tokens) {
        if (token.isNewline) {
          lines.push(curLine);
          curLine = [];
          curLineW = 0;
          continue;
        }
        if (curLine.length === 0 && token.isSpace) {
          continue; // skip leading spaces on a line
        }

        if (curLine.length > 0 && curLineW + token.width > maxTextW && !token.isSpace) {
          lines.push(curLine);
          curLine = [];
          curLineW = 0;
        }

        curLine.push(token);
        curLineW += token.width;
      }
      if (curLine.length > 0) {
        lines.push(curLine);
      }

      const totalTextH = Math.max(1, lines.length) * lineH;
      let startY: number;
      if (vAlign === 'middle' && h >= totalTextH + padY * 2) {
        startY = (y - h / 2) + (totalTextH / 2) - (fontSize * 0.82);
      } else {
        startY = y - padY - (fontSize * 0.82);
      }

      let lineY = startY;
      for (const line of lines) {
        let measuredW = 0;
        for (const tok of line) {
          measuredW += tok.width;
        }

        let lineX = x + padX;
        if (align === 'center') {
          lineX = x + (w - measuredW) / 2;
        } else if (align === 'right') {
          lineX = x + w - padX - measuredW;
        }

        for (const tok of line) {
          const tokFont = tok.bold ? this.fontBold : this.fontRegular;
          this.page.drawText(tok.text, {
            x: Math.max(x + 1, lineX),
            y: lineY,
            size: fontSize,
            font: tokFont,
            color: rgb(0, 0, 0),
          });
          lineX += tok.width;
        }
        lineY -= lineH;
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
      const isBold = col.bold === true;
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
   * Safely embed an image as PNG or JPG into pdf-lib document.
   */
  private async embedImageSafe(bytes: Uint8Array): Promise<any> {
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
   * Draw a full-width section header banner (standard #DDE9F6 in PDF).
   * Formatted with prominent section heading typography (13.5pt bold, 25pt+ height)
   * instead of regular cell text constraints.
   * Inserts proper spacing before sections and protects against orphan headers.
   */
  drawSectionBanner(title: string, options: { fontSize?: number; height?: number } = {}): void {
    if (this.cursorY > 10) {
      this.cursorY += 12;
    }
    const cleanTitle = this.sanitizeText(title).toUpperCase();
    const bannerFs = options.fontSize || FONT_SIZE_HEADER;
    const padX = 8;
    const padY = 4;
    const maxTextW = CONTENT_W - padX * 2;
    const lines = this.wrapText(cleanTitle, maxTextW, bannerFs, true);
    const lineH = bannerFs * LINE_HEIGHT;
    const totalTextH = lines.length * lineH;
    const bannerH = Math.max(options.height || 25, totalTextH + padY * 2);

    // Title and content should be together: ensure at least banner + 2 content rows fit
    this.checkPageBreak(bannerH + 50);
    const y = this.pdfY(this.cursorY);

    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - bannerH,
      width: CONTENT_W,
      height: bannerH,
      color: hexToRgb(OPT_BG),
      opacity: BG_OPACITY,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    let startY = (y - bannerH / 2) + (totalTextH / 2) - (bannerFs * 0.82);
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN_L + padX,
        y: startY,
        size: bannerFs,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      startY -= lineH;
    }

    this.cursorY += bannerH;
  }

  /**
   * Draw a 2-column Photograph Grid directly continuing below the address table.
   * Eliminates addPage() and drawSectionHeader() calls that cause blank page waste.
   */
  async drawArthanPhotoGrid(
    photos: (Uint8Array | { bytes: Uint8Array; label?: string })[]
  ): Promise<void> {
    const normalizedPhotos = (photos || []).map(p => {
      if (p instanceof Uint8Array || (p as any)?.byteLength !== undefined) {
        return { bytes: p as Uint8Array, label: '' };
      }
      return { bytes: (p as any)?.bytes as Uint8Array, label: (p as any)?.label || '' };
    }).filter(p => p.bytes && p.bytes.length > 0);

    if (normalizedPhotos.length === 0) return;

    const cellW = (CONTENT_W - 10) / 2;
    const cellH = 175;

    for (let i = 0; i < normalizedPhotos.length; i += 2) {
      this.checkPageBreak(cellH + 15);
      const rowPhotos = normalizedPhotos.slice(i, i + 2);
      const y = this.pdfY(this.cursorY);

      for (let j = 0; j < rowPhotos.length; j++) {
        const p = rowPhotos[j];
        const curX = MARGIN_L + j * (cellW + 10);

        try {
          const img = await this.embedImageSafe(p.bytes);
          if (img) {
            const hasLabel = !!(p.label && p.label.trim().length > 0);
            const labelReserve = hasLabel ? 20 : 6;
            const availH = cellH - labelReserve - 8;
            const availW = cellW - 8;
            const scale = Math.min(availW / img.width, availH / img.height, 1);
            const w = img.width * scale;
            const h = img.height * scale;
            const imgX = curX + (cellW - w) / 2;
            const imgY = y - cellH + labelReserve + (availH - h) / 2 + 4;

            // Cell border with white fill
            this.page.drawRectangle({
              x: curX,
              y: y - cellH,
              width: cellW,
              height: cellH,
              color: rgb(1, 1, 1),
              borderColor: rgb(0, 0, 0),
              borderWidth: BORDER_W,
            });

            this.page.drawImage(img, { x: imgX, y: imgY, width: w, height: h });

            // Label (Times-Italic, 10pt)
            if (hasLabel) {
              const text = this.sanitizeText(p.label!.trim());
              const tw = this.fontItalic.widthOfTextAtSize(text, FONT_SIZE_CAPTION);
              this.page.drawText(text, {
                x: curX + (cellW - tw) / 2,
                y: y - cellH + 6,
                size: FONT_SIZE_CAPTION,
                font: this.fontItalic,
                color: rgb(0, 0, 0),
              });
            }
          }
        } catch { /* ignore */ }
      }
      this.cursorY += cellH + 8;
    }
  }

  /**
   * Draw a single map card with clean outer border, centered scaling, and optional italic caption.
   */
  async drawArthanMapCard(
    mapBytes: Uint8Array,
    x: number,
    y: number,
    w: number,
    h: number,
    caption?: string
  ): Promise<void> {
    const img = await this.embedImageSafe(mapBytes);
    if (!img) return;

    const hasCaption = !!(caption && caption.trim().length > 0);
    const labelReserve = hasCaption ? 18 : 0;
    const availH = h - labelReserve - 8;
    const availW = w - 8;
    const scale = Math.min(availW / img.width, availH / img.height, 1);
    const imgW = img.width * scale;
    const imgH = img.height * scale;

    // Outer border with white fill
    this.page.drawRectangle({
      x,
      y: y - h,
      width: w,
      height: h,
      color: rgb(1, 1, 1),
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    // Image centered within upper area
    const imgX = x + (w - imgW) / 2;
    const imgY = y - h + labelReserve + (availH - imgH) / 2 + 4;
    this.page.drawImage(img, { x: imgX, y: imgY, width: imgW, height: imgH });

    // Caption below image (9.5pt Times-Italic)
    if (hasCaption) {
      const text = this.sanitizeText(caption!.trim());
      const tw = this.fontItalic.widthOfTextAtSize(text, FONT_SIZE_CAPTION);
      this.page.drawText(text, {
        x: x + (w - tw) / 2,
        y: y - h + 5,
        size: FONT_SIZE_CAPTION,
        font: this.fontItalic,
        color: rgb(0, 0, 0),
      });
    }
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
    this.drawSectionBanner('TECHNICAL INITIATION REQUEST FORM DATA');

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
      { text: 'Date of Inspection /\nSite visit', width: s1L, isLabel: true },
      { text: formatReportDate(fields.dateOfInspection, ''), width: s1V },
      { text: 'Nearest Landmark', width: s1L2, isLabel: true },
      { text: fields.nearestLandmark || '', width: s1V2 },
    ], 20, 4);

    // Row: Customer / Applicant Name & Contact (full width value)
    this.drawRow([
      { text: 'Name of the Customer/\nApplicant & Contact Details', width: s1L, isLabel: true },
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
      { text: 'Name of the Person met\nat site & Contact No.', width: s1L, isLabel: true },
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
      const linesL = this.wrapText(this.sanitizeText(r.sub), addrSubLabelW - 8, FONT_SIZE, false);
      const linesV = this.wrapText(this.sanitizeText(r.val), addrValW - 8, FONT_SIZE, false);
      return Math.max(20, Math.max(linesL.length, linesV.length) * FONT_SIZE * LINE_HEIGHT + 8);
    });
    const totalAddrH = addrRowHeights.reduce((s, h) => s + h, 0);

    this.checkPageBreak(totalAddrH);
    let curY = this.pdfY(this.cursorY);

    // Merged left label
    this.drawCell(MARGIN_L, curY, addrLabelW, totalAddrH, 'Address of the property\nbeing appraised', {
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
    this.drawSectionBanner('LOCATIONAL & PROPERTY SPECIFIC DETAILS (BASED ON SITE VISIT)');

    const s2L = 155;
    const s2V = CONTENT_W / 2 - s2L;
    const s2L2 = 155;
    const s2V2 = CONTENT_W - s2L - s2V - s2L2;

    this.drawRow([
      { text: 'Status of Land Holding', width: s2L, isLabel: true, bold: false },
      { text: fields.statusOfLandHolding || '', width: s2V },
      { text: 'Developed By', width: s2L2, isLabel: true, bold: false },
      { text: fields.developedBy || 'NA', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Type of Property', width: s2L, isLabel: true, bold: false },
      { text: fields.typeOfProperty || '', width: s2V },
      { text: 'Type of Locality', width: s2L2, isLabel: true, bold: false },
      { text: fields.typeOfLocality || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Date of Inspection /\nSite visit', width: s2L, isLabel: true, bold: false },
      { text: formatReportDate(fields.dateOfInspectionSite || fields.dateOfInspection, ''), width: s2V },
      { text: 'Occupation Status', width: s2L2, isLabel: true, bold: false },
      { text: fields.occupationStatus || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Location / Zoning as\nper Master Plan', width: s2L, isLabel: true, bold: false },
      { text: fields.locationZoningMasterPlan || 'NA', width: s2V },
      { text: 'Property Usage', width: s2L2, isLabel: true, bold: false },
      { text: fields.propertyUsage || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Plot Demarcation', width: s2L, isLabel: true, bold: false },
      { text: fields.plotDemarcation || 'NA', width: s2V },
      { text: 'Property Identifiable', width: s2L2, isLabel: true, bold: false },
      { text: fields.propertyIdentifiable || 'NA', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Identified Through', width: s2L, isLabel: true, bold: false },
      { text: fields.identifiedThrough || 'NA', width: s2V },
      { text: 'Within MC / GP Limit &\nDistance From Nearest M.C', width: s2L2, isLabel: true, bold: false },
      { text: fields.withinMCLimit || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Internal Finishing', width: s2L, isLabel: true, bold: false },
      { text: fields.internalFinishing || '', width: s2V },
      { text: 'Type of Structure', width: s2L2, isLabel: true, bold: false },
      { text: fields.typeOfStructure || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'No. of Floors in\nthe building', width: s2L, isLabel: true, bold: false },
      { text: fields.noOfFloors || '', width: s2V },
      { text: 'Located on Floor No.', width: s2L2, isLabel: true, bold: false },
      { text: fields.locatedOnFloorNo || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Total No. of Flats / Unit\nin building', width: s2L, isLabel: true, bold: false },
      { text: fields.totalFlatsUnits || '', width: s2V },
      { text: 'External Finishing', width: s2L2, isLabel: true, bold: false },
      { text: fields.externalFinishing || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'External Finishing', width: s2L, isLabel: true, bold: false },
      { text: fields.externalFinishingDetail || '', width: s2V },
      { text: 'Year of Completion\nof Property', width: s2L2, isLabel: true, bold: false },
      { text: fields.yearOfCompletion || '', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Construction Stage of\nthe Property (in 100%)', width: s2L, isLabel: true, bold: false },
      { text: fields.constructionStage || 'NA', width: s2V },
      { text: 'Disbursement\nRecommended (in %)', width: s2L2, isLabel: true, bold: false },
      { text: fields.disbursementRecommended || 'NA', width: s2V2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Age of the Property', width: s2L, isLabel: true, bold: false },
      { text: fields.ageOfProperty || '', width: s2V },
      { text: 'Future Physical Life\nof Property', width: s2L2, isLabel: true, bold: false },
      { text: fields.futurePhysicalLife || '', width: s2V2 },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 3 — Boundaries
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 22 * 5);
    this.drawSectionBanner('BOUNDARIES');

    const bW1 = 135; // "Boundaries" label
    const bW2 = Math.round((CONTENT_W - bW1) / 4); // 88 pt - North
    const bW3 = bW2; // 88 pt - South
    const bW4 = bW2; // 88 pt - East
    const bW5 = CONTENT_W - bW1 - bW2 - bW3 - bW4; // 88.28 pt - West

    this.drawRow([
      { text: 'Boundaries', width: bW1, isHeader: true, align: 'center', bold: true },
      { text: 'North', width: bW2, isHeader: true, align: 'center', bold: true },
      { text: 'South', width: bW3, isHeader: true, align: 'center', bold: true },
      { text: 'East', width: bW4, isHeader: true, align: 'center', bold: true },
      { text: 'West', width: bW5, isHeader: true, align: 'center', bold: true },
    ], 24, 4);

    this.drawRow([
      { text: 'As per Documents\n(Sale Deed)', width: bW1, isLabel: true, bold: false },
      { text: fields.boundaryNorthDocs || 'Not provided', width: bW2, align: 'center' },
      { text: fields.boundarySouthDocs || 'Not provided', width: bW3, align: 'center' },
      { text: fields.boundaryEastDocs || 'Not provided', width: bW4, align: 'center' },
      { text: fields.boundaryWestDocs || 'Not provided', width: bW5, align: 'center' },
    ], 20, 4);

    this.drawRow([
      { text: 'As per Sketch map', width: bW1, isLabel: true, bold: false },
      { text: fields.boundaryNorthSketch || '', width: bW2, align: 'center' },
      { text: fields.boundarySouthSketch || '', width: bW3, align: 'center' },
      { text: fields.boundaryEastSketch || '', width: bW4, align: 'center' },
      { text: fields.boundaryWestSketch || '', width: bW5, align: 'center' },
    ], 20, 4);

    this.drawRow([
      { text: 'As per Site / Actual', width: bW1, isLabel: true, bold: false },
      { text: fields.boundaryNorthSite || '', width: bW2, align: 'center' },
      { text: fields.boundarySouthSite || '', width: bW3, align: 'center' },
      { text: fields.boundaryEastSite || '', width: bW4, align: 'center' },
      { text: fields.boundaryWestSite || '', width: bW5, align: 'center' },
    ], 20, 4);

    // Boundaries Matching row:
    // Boundaries (bW1) | North (bW2: Yes/No) | South (bW3: "If No, then\nreason thereon") | East + West (bW4 + bW5: reasonText)
    const isMatching = (fields.boundariesMatching || 'Yes').trim().toLowerCase() === 'yes';
    const reasonText = isMatching
      ? 'Boundary is matching as per sketch map'
      : (fields.boundariesNotMatchingReason || 'Boundary is not matching');

    this.drawRow([
      { text: 'Boundaries Matching', width: bW1, isLabel: true, bold: false },
      { text: fields.boundariesMatching || 'Yes', width: bW2, align: 'center' },
      { text: 'If No, then\nreason thereon', width: bW3, isLabel: true, bold: false },
      { text: reasonText, width: bW4 + bW5, align: 'center' },
    ], 22, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 4 — Setbacks / Margin
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 26 * 2 + 20);
    this.drawSectionBanner('SETBACKS / MARGIN');

    const sbW1 = 185;
    const sbW2 = (CONTENT_W - sbW1) / 4;
    const sbW3 = (CONTENT_W - sbW1) / 4;
    const sbW4 = (CONTENT_W - sbW1) / 4;
    const sbW5 = CONTENT_W - sbW1 - sbW2 - sbW3 - sbW4;

    this.drawRow([
      { text: 'Setbacks / Margin in\nthe Building (in Ft)', width: sbW1, isHeader: true, align: 'center', bold: true },
      { text: 'Front', width: sbW2, isHeader: true, align: 'center', bold: true },
      { text: 'Rear', width: sbW3, isHeader: true, align: 'center', bold: true },
      { text: 'Left Side', width: sbW4, isHeader: true, align: 'center', bold: true },
      { text: 'Right Side', width: sbW5, isHeader: true, align: 'center', bold: true },
    ], 26, 4);

    this.drawRow([
      { text: 'As per sanctioned /\npermissible byelaws', width: sbW1, isLabel: true, bold: false },
      { text: fields.setbackFrontSanctioned || 'NA', width: sbW2, align: 'center' },
      { text: fields.setbackRearSanctioned || 'NA', width: sbW3, align: 'center' },
      { text: fields.setbackLeftSanctioned || 'NA', width: sbW4, align: 'center' },
      { text: fields.setbackRightSanctioned || 'NA', width: sbW5, align: 'center' },
    ], 26, 4);

    this.drawRow([
      { text: 'As per Site / Actual', width: sbW1, isLabel: true, bold: false },
      { text: fields.setbackFrontSite || '', width: sbW2, align: 'center' },
      { text: fields.setbackRearSite || '', width: sbW3, align: 'center' },
      { text: fields.setbackLeftSite || '', width: sbW4, align: 'center' },
      { text: fields.setbackRightSite || '', width: sbW5, align: 'center' },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 5 — Height / Storieys
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 26 + 20);
    this.drawSectionBanner('HEIGHT / STOREYS');

    const htW1 = sbW1;
    const htWRest = CONTENT_W - htW1;

    this.drawRow([
      { text: 'As per sanctioned /\npermissible byelaws', width: htW1, isLabel: true, bold: false },
      { text: fields.heightSanctioned || 'NA', width: htWRest, align: 'center' },
    ], 26, 4);

    this.drawRow([
      { text: 'As per Site / Actual', width: htW1, isLabel: true, bold: false },
      { text: fields.heightSite || '', width: htWRest, align: 'center' },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 6 — Built-up Area & Accommodation Details
    // ══════════════════════════════════════════════════════════════════
    const defaultBuaFloors: ArthanFinanceBUAFloor[] = [
      { floor: 'Basement / Stilt', accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: '', adoptedBUA: '' },
      { floor: 'Ground Floor', accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: '', adoptedBUA: '' },
      { floor: 'First Floor', accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: '', adoptedBUA: '' },
    ];
    const buaFloors = Array.isArray(fields.buaFloors) ? fields.buaFloors : defaultBuaFloors;

    this.checkPageBreak(buaFloors.length > 0 ? (26 + 22 * (buaFloors.length + 2)) : 65);
    this.drawSectionBanner('BUILT-UP AREA & ACCOMMODATION DETAILS');

    const buaW1 = 82;  // Floor
    const buaW2 = 88;  // Accommodation
    const buaW3 = 72;  // Carpet Area (Sft)
    const buaW4 = 92;  // Actual BUA / SBUA (Sft)
    const buaW5 = 76;  // Permissible BUA (Sft)
    const buaW6 = CONTENT_W - buaW1 - buaW2 - buaW3 - buaW4 - buaW5; // Adopted Built-up area

    this.drawRow([
      { text: 'Floor\n(Pl mention floor wise)', width: buaW1, isHeader: true, align: 'center', bold: false },
      { text: 'Accomodation', width: buaW2, isHeader: true, align: 'center', bold: false },
      { text: 'Carpet Area (Sft)', width: buaW3, isHeader: true, align: 'center', bold: false },
      { text: 'Actual BUA /\nSBUA (Sft)', width: buaW4, isHeader: true, align: 'center', bold: false },
      { text: 'Permissible\nBUA (Sft)', width: buaW5, isHeader: true, align: 'center', bold: false },
      { text: 'Adopted Built-up\narea (Sft)', width: buaW6, isHeader: true, align: 'center', bold: true },
    ], 36, 4);

    if (buaFloors.length > 0) {
      // Calculate exact totals without floating point roundoff
      const totalAdoptedBUA = sumDecimals(buaFloors.map(fl => fl.adoptedBUA));
      const totalActualBUA = sumDecimals(buaFloors.map(fl => fl.actualBUA));
      const totalCarpetArea = sumDecimals(buaFloors.map(fl => fl.carpetArea));
      const totalPermissibleBUA = sumDecimals(buaFloors.map(fl => fl.permissibleBUA));

      for (const fl of buaFloors) {
        this.drawRow([
          { text: fl.floor, width: buaW1, isLabel: true, bold: false },
          { text: fl.accommodation || 'NA', width: buaW2, align: 'center' },
          { text: fl.carpetArea ? (fl.carpetArea === 'NA' ? 'NA' : `${fl.carpetArea}`) : 'NA', width: buaW3, align: 'center' },
          { text: fl.actualBUA ? (fl.actualBUA === 'NA' ? 'NA' : `${fl.actualBUA}`) : 'NA', width: buaW4, align: 'center' },
          { text: fl.permissibleBUA ? (fl.permissibleBUA === 'NA' ? 'NA' : `${fl.permissibleBUA}`) : 'NA', width: buaW5, align: 'center' },
          { text: fl.adoptedBUA ? (fl.adoptedBUA === 'NA' ? 'NA' : `${fl.adoptedBUA}`) : 'NA', width: buaW6, align: 'center' },
        ], 20, 4);
      }

      // Total row - no bold
      this.drawRow([
        { text: 'Total', width: buaW1, isLabel: true, bold: false },
        { text: 'NA', width: buaW2, align: 'center' },
        { text: totalCarpetArea > 0 ? formatExactDecimal(totalCarpetArea) : 'NA', width: buaW3, align: 'center' },
        { text: totalActualBUA > 0 ? `${formatExactDecimal(totalActualBUA)}sqft` : 'NA', width: buaW4, align: 'center' },
        { text: totalPermissibleBUA > 0 ? `${formatExactDecimal(totalPermissibleBUA)}sqft` : 'NA', width: buaW5, align: 'center' },
        { text: totalAdoptedBUA > 0 ? `${formatExactDecimal(totalAdoptedBUA)}sqft` : 'NA', width: buaW6, align: 'center' },
      ], 20, 4);
    }

    // Violation observed
    this.drawRow([
      { text: 'Violation observed if any', width: buaW1 + buaW2, isLabel: true, bold: false },
      { text: fields.violationObserved || 'NA', width: CONTENT_W - buaW1 - buaW2, align: 'center' },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 7 — Plan Approvals
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 24 * 3 + 10);
    this.drawSectionBanner('PLAN APPROVALS BP NOT PROVIDED');

    const paW1 = 175;
    const paW2 = (CONTENT_W / 2) - paW1;
    const paW3 = 175;
    const paW4 = CONTENT_W - paW1 - paW2 - paW3;

    // Row 1: Construction as per approved/ sanctioned plans | NA | Details of approved plan with approval no and date | NA
    this.drawRow([
      { text: 'Construction as per approved /\nsanctioned plans', width: paW1, isLabel: true, bold: false },
      { text: fields.constructionAsPerPlan || 'NA', width: paW2, align: 'center' },
      { text: 'Details of approved plan with\napproval no and date', width: paW3, isLabel: true, bold: false },
      { text: fields.approvedPlanDetails || 'NA', width: paW4, align: 'center' },
    ], 20, 4);

    // Row 2: Construction permission Number and date | NA | Violations Observed if Any | NA
    this.drawRow([
      { text: 'Construction permission\nNumber and date', width: paW1, isLabel: true, bold: false },
      { text: fields.constructionPermissionNumberDate || 'NA', width: paW2, align: 'center' },
      { text: 'Violations Observed if Any', width: paW3, isLabel: true, bold: false },
      { text: fields.violationsObserved || 'NA', width: paW4, align: 'center' },
    ], 20, 4);

    // Row 3: If plans not available then is the structure confirming to the local byelaws. | NA (spans 2 columns each)
    this.drawRow([
      { text: 'If plans not available then is the structure\nconfirming to the local byelaws.', width: paW1 + paW2, isLabel: true, bold: false },
      { text: fields.structureConfirmingByelaws || 'NA', width: CONTENT_W - (paW1 + paW2), align: 'center' },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 8 — Estimate Analysis
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 22 * 3);
    this.drawSectionBanner('ESTIMATE ANALYSIS (APPLICABLE ONLY IN SELF CONSTRUCTION CASES)');

    const eaW1 = 160;
    const eaV = CONTENT_W / 2 - eaW1;
    const eaW2 = 160;
    const eaV2 = CONTENT_W - eaW1 - eaV - eaW2;

    this.drawRow([
      { text: 'Estimated Cost (In Rs)', width: eaW1, isLabel: true, bold: false },
      { text: fields.estimatedCostTotal || 'NA', width: eaV },
      { text: 'Estimated Cost (in Rs per Sqft)', width: eaW2, isLabel: true, bold: false },
      { text: fields.estimatedCostPerSqft || 'NA', width: eaV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Justified Estimated Cost\n(in Rs per Sqft)', width: eaW1, isLabel: true, bold: false },
      { text: fields.justifiedEstimatedCostPerSqft || 'NA', width: eaV },
      { text: 'Adoptable / Justified\nEstimated Cost (In Rs)', width: eaW2, isLabel: true, bold: false },
      { text: fields.adoptableJustifiedEstimatedCost || 'NA', width: eaV2 },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 9 — Valuation of Property (Fair Market / Distress)
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 22 * 12);
    this.drawSectionBanner('VALUATION OF PROPERTY\n(FAIR MARKET VALUATION / DISTRESS VALUATION)');

    const vlW1 = 165;
    const vlV = CONTENT_W / 2 - vlW1;
    const vlW2 = 165;
    const vlV2 = CONTENT_W - vlW1 - vlV - vlW2;

    const buaSpec = (fields.adoptableBUASpec !== undefined && fields.adoptableBUASpec !== null ? fields.adoptableBUASpec : '').trim();
    const buaLabel = buaSpec
      ? `Adoptable Built-up Area (in Sqft) ${buaSpec}`
      : 'Adoptable Built-up Area (in Sqft)';

    this.drawRow([
      { text: 'Land Area (In Sqft)', width: vlW1, isLabel: true, bold: false },
      { text: fields.landAreaSqft || '', width: vlV },
      { text: buaLabel, width: vlW2, isLabel: true, bold: false },
      { text: fields.adoptableBuiltUpArea || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Current Market Rate of land in\nthe locality (Range) in Rs Per Sqft', width: vlW1, isLabel: true, bold: false },
      { text: fields.currentMarketRateRange || '', width: vlV },
      { text: 'Construction Cost (Rs per sft)', width: vlW2, isLabel: true, bold: false },
      { text: fields.constructionCostPerSqft || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Recommended Rate of Land\n(Rs per sqft)', width: vlW1, isLabel: true, bold: false },
      { text: fields.recommendedRateOfLand || '', width: vlV },
      { text: 'Total Construction Value for\n100% complete building (in Rs)', width: vlW2, isLabel: true, bold: false },
      { text: fields.totalConstructionValue100 || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Total Land Value (in Rs)', width: vlW1, isLabel: true, bold: true },
      { text: fields.totalLandValue || '', width: vlV, bold: true },
      { text: 'Total Construction Value for\npresent construction stage (in Rs)', width: vlW2, isLabel: true, bold: false },
      { text: fields.totalConstructionValuePresent || '', width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Market Value of Land &\nBuilding Only (in Rs)', width: vlW1, isLabel: true, bold: true },
      { text: fields.marketValueLandBuilding || '', width: vlV, highlight: true, bold: true },
      { text: 'Market Value of Land &\nBuilding Only (in Rs)', width: vlW2, isLabel: true, bold: true },
      { text: fields.marketValueLandBuildingRight || '', width: vlV2, highlight: true, bold: true },
    ], 20, 4);

    const pct100 = (fields.distressPct100 !== undefined && fields.distressPct100 !== null && fields.distressPct100 !== '')
      ? fields.distressPct100
      : '0';
    const pctPresent = (fields.distressPctPresent !== undefined && fields.distressPctPresent !== null && fields.distressPctPresent !== '')
      ? fields.distressPctPresent
      : '0';

    this.drawRow([
      { text: `Distress Value of 100% complete\nproperty @ ${pct100}% of MV`, width: vlW1, isLabel: true, bold: true },
      { text: fields.distressValue100 || '', width: vlV, bold: true },
      { text: `Distress Value of present completed\nproperty @ ${pctPresent}% of MV`, width: vlW2, isLabel: true, bold: false },
      { text: fields.distressValuePresent || '', width: vlV2 },
    ], 20, 4);

    const flatType = fields.flatPropertyType || (fields.flatSBUA === 'NA' || !fields.flatSBUA ? 'NA' : 'Flat');
    const isFlatNA = flatType === 'NA' || fields.flatSBUA === 'NA';

    const flatSegments = isFlatNA
      ? undefined
      : [
          { text: 'Flat', bold: flatType === 'Flat' },
          { text: ' / ', bold: false },
          { text: 'Apartment', bold: flatType === 'Apartment' },
          { text: ' / ', bold: false },
          { text: 'Shop', bold: flatType === 'Shop' },
          { text: ' / ', bold: false },
          { text: 'Office', bold: flatType === 'Office' },
          { text: ' SBUA (in Sqft)', bold: false },
        ];

    this.drawRow([
      {
        text: 'Flat / Apartment / Shop / Office\nSBUA (in Sqft)',
        segments: flatSegments,
        width: vlW1,
        isLabel: true,
        bold: false,
      },
      { text: fields.flatSBUA || 'NA', width: vlV },
      { text: 'Composite sale rate (Rs per\nsqft)', width: vlW2, isLabel: true, bold: false },
      { text: fields.compositeSaleRate || 'NA', width: vlV2 },
    ], 20, 4);

    const tmvSegments = isFlatNA
      ? undefined
      : [
          { text: 'Total Market Value of ', bold: false },
          { text: 'Apartment', bold: flatType === 'Apartment' },
          { text: ' / ', bold: false },
          { text: 'Shop', bold: flatType === 'Shop' },
          { text: ' / ', bold: false },
          { text: 'Flat', bold: flatType === 'Flat' },
          { text: ' / ', bold: false },
          { text: 'Office', bold: flatType === 'Office' },
          { text: '\n(Rs per sqft)', bold: false },
        ];

    this.drawRow([
      {
        text: 'Total Market Value of Apartment / Shop / Flat / Office\n(Rs per sqft)',
        segments: tmvSegments,
        width: vlW1 + vlV,
        isLabel: true,
        bold: false,
      },
      { text: fields.totalMarketValueApartment || 'NA', width: CONTENT_W - (vlW1 + vlV), align: 'center' },
    ], 20, 4);

    const landGovtVal = fields.landValueGovtRate || (
      fields.landAreaSqft && fields.govtGuidelineRateLand && fields.govtGuidelineRateLand !== 'NA'
        ? multiplyExactDecimals(fields.landAreaSqft, fields.govtGuidelineRateLand)
        : ''
    );

    const flatGovtVal = fields.flatValueGovtRate || (
      fields.govtGuidelineRateFlats === 'NA' || !fields.govtGuidelineRateFlats
        ? 'NA'
        : (
          (fields.adoptableBuiltUpArea || fields.flatSBUA)
            ? multiplyExactDecimals(fields.adoptableBuiltUpArea || fields.flatSBUA, fields.govtGuidelineRateFlats)
            : 'NA'
        )
    );

    this.drawRow([
      { text: 'Government Guideline /
Circle rate for Land (Rs/sqft)', width: vlW1, isLabel: true, bold: false },
      { text: fields.govtGuidelineRateLand || '', width: vlV },
      { text: 'Land Value as per\nGovernment Rate (Rs)', width: vlW2, isLabel: true, bold: false },
      { text: landGovtVal, width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Government Guideline /
Circle rate for Flats (Rs/sqft)', width: vlW1, isLabel: true, bold: false },
      { text: fields.govtGuidelineRateFlats || 'NA', width: vlV },
      { text: 'Flat / Apartment Value as\nper Government Rate (Rs)', width: vlW2, isLabel: true, bold: false },
      { text: flatGovtVal, width: vlV2 },
    ], 20, 4);

    this.drawRow([
      { text: 'Latitude(N)', width: vlW1, isLabel: true, bold: false },
      { text: fields.latitude || '', width: vlV },
      { text: 'Longitude(E)', width: vlW2, isLabel: true, bold: false },
      { text: fields.longitude || '', width: vlV2 },
    ], 20, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 10 — Property Specific Remarks & Observation
    // ══════════════════════════════════════════════════════════════════
    this.checkPageBreak(26 + 50);
    this.drawSectionBanner('PROPERTY SPECIFIC REMARKS & OBSERVATION');

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
    this.drawSectionBanner('VALUER CERTIFICATION');

    const vcW1 = 135;
    const vcV = CONTENT_W / 2 - vcW1;
    const vcW2 = 135;
    const vcV2 = CONTENT_W / 2 - vcW2;

    this.drawRow([
      { text: 'Date of Visit', width: vcW1, isLabel: true, bold: false },
      { text: formatReportDate(fields.dateOfInspection || fields.dateOfVisit, ''), width: vcV },
      { text: 'Date of Report\nSubmission', width: vcW2, isLabel: true, bold: false },
      { text: formatReportDate(fields.dateOfReportSubmission || fields.dateOfValuation, ''), width: vcV2 },
    ], 24, 4);

    this.drawRow([
      { text: 'Name of Engineer\nVisted the property', width: vcW1, isLabel: true, bold: true },
      { text: fields.visitingEngineer || '', width: vcV },
      { text: 'Authorized Signatory\nName & Signature', width: vcW2, isLabel: true, bold: true },
      { text: fields.authorizedSignatory || 'Er. Satyajit Mohanty', width: vcV2 },
    ], 24, 4);

    // ══════════════════════════════════════════════════════════════════
    // SECTION 12 — Property Photographs
    // ══════════════════════════════════════════════════════════════════
    if (images.photos && images.photos.length > 0) {
      const phW1 = 115; // Uniform column width matching Engineer (115 pt)
      const phV = CONTENT_W / 2 - phW1; // 128.64 pt
      const phW2 = 115; // Uniform column width matching Authorized Signatory (115 pt)
      const phV2 = CONTENT_W / 2 - phW2; // 128.64 pt

      // Address row height calculation
      const phAddrText = fields.addressAsPerActualSite || fields.addressAsPerDocument || '';
      const phAddrLines = this.wrapText(phAddrText, CONTENT_W - phW1 - 8, FONT_SIZE);
      const phAddrH = Math.max(26, phAddrLines.length * FONT_SIZE * LINE_HEIGHT + 10);

      // Section header + customer row + address row + at least 1 row of photos MUST start together
      // to prevent orphaned headers or address alone on a page:
      const neededForSection12 = 25 + 24 + phAddrH + 180;
      if (this.availableHeight < neededForSection12) {
        this.addPage();
      }

      this.drawSectionBanner('PROPERTY PHOTOGRAPHS');

      // Customer & Proposal row
      this.drawRow([
        { text: 'Name of the\nCustomer/Applicant', width: phW1, isLabel: true, bold: false },
        { text: fields.customerName || '', width: phV },
        { text: 'Proposal No.', width: phW2, isLabel: true, bold: false },
        { text: fields.proposalNo || '', width: phV2 },
      ], 24, 4);

      // Address row
      curY = this.pdfY(this.cursorY);
      this.drawCell(MARGIN_L, curY, phW1, phAddrH, 'Address of the property\nbeing appraised', { isLabel: true, align: 'center', vAlign: 'middle', bold: false });
      this.drawCell(MARGIN_L + phW1, curY, CONTENT_W - phW1, phAddrH, phAddrText, { align: 'center', vAlign: 'middle' });
      this.cursorY += phAddrH + 6;

      // Photo grid — renders immediately continuing below address row without empty page gaps or empty headers
      await this.drawArthanPhotoGrid(images.photos);

      // Engineer row after photos
      const engW1 = 135;
      const engV1 = CONTENT_W / 2 - engW1;
      const engW2 = 135;
      const engV2 = CONTENT_W / 2 - engW2;

      this.checkPageBreak(26);
      this.drawRow([
        { text: 'Name of Engineer\nVisted the property', width: engW1, isLabel: true, bold: true },
        { text: fields.visitingEngineer || '', width: engV1 },
        { text: 'Authorized Signatory\nName & Signature', width: engW2, isLabel: true, bold: true },
        { text: fields.authorizedSignatory || 'Er. Satyajit Mohanty', width: engV2 },
      ], 24, 4);
    }

    // ══════════════════════════════════════════════════════════════════
    // SECTION 13 — Location cum Route Map showing property Boundaries
    // ══════════════════════════════════════════════════════════════════
    const locImgs = images.locationMaps || [];
    const cadImgs = images.cadastralMaps || [];
    const hasMaps = locImgs.length > 0 || cadImgs.length > 0;

    if (hasMaps) {
      const mpW1 = 115;
      const mpV = CONTENT_W / 2 - mpW1; // 128.64 pt
      const mpW2 = 115; // Uniform column width matching Authorized Signatory (115 pt)
      const mpV2 = CONTENT_W / 2 - mpW2; // 128.64 pt

      const mpAddrText = fields.addressAsPerActualSite || fields.addressAsPerDocument || '';
      const mpAddrLines = this.wrapText(mpAddrText, CONTENT_W - mpW1 - 8, FONT_SIZE);
      const mpAddrH = Math.max(26, mpAddrLines.length * FONT_SIZE * LINE_HEIGHT + 10);

      // Ensure banner + customer row + address row + at least 1 map fit together
      const neededForSection13 = 25 + 24 + mpAddrH + 190;
      if (this.availableHeight < neededForSection13) {
        this.addPage();
      }

      this.drawSectionBanner('LOCATION CUM ROUTE MAP SHOWING PROPERTY BOUNDARIES');

      this.drawRow([
        { text: 'Name of the\nCustomer/Applicant', width: mpW1, isLabel: true, bold: false },
        { text: fields.customerName || '', width: mpV },
        { text: 'Proposal No.', width: mpW2, isLabel: true, bold: false },
        { text: fields.proposalNo || '', width: mpV2 },
      ], 24, 4);

      curY = this.pdfY(this.cursorY);
      this.drawCell(MARGIN_L, curY, mpW1, mpAddrH, 'Address of the property\nbeing appraised', { isLabel: true, align: 'center', vAlign: 'middle', bold: false });
      this.drawCell(MARGIN_L + mpW1, curY, CONTENT_W - mpW1, mpAddrH, mpAddrText, { align: 'center', vAlign: 'middle' });
      this.cursorY += mpAddrH + 8;

      // Maps rendered standalone, placed one by one (no caption, no box)
      const allMapBytes: Uint8Array[] = [...locImgs, ...cadImgs];

      for (const mapBytes of allMapBytes) {
        const img = await this.embedImageSafe(mapBytes);
        if (!img) continue;

        const maxW = CONTENT_W;
        const maxH = 340;
        const scale = Math.min(maxW / img.width, maxH / img.height);
        const imgW = img.width * scale;
        const imgH = img.height * scale;

        this.checkPageBreak(imgH + 15);
        curY = this.pdfY(this.cursorY);

        const imgX = MARGIN_L + (CONTENT_W - imgW) / 2;
        this.page.drawImage(img, {
          x: imgX,
          y: curY - imgH,
          width: imgW,
          height: imgH,
        });

        this.cursorY += imgH + 15;
      }

      // Engineer row after maps
      const engW1 = 135;
      const engV1 = CONTENT_W / 2 - engW1;
      const engW2 = 135;
      const engV2 = CONTENT_W / 2 - engW2;

      this.checkPageBreak(26);
      this.drawRow([
        { text: 'Name of Engineer\nVisted the property', width: engW1, isLabel: true, bold: true },
        { text: fields.visitingEngineer || '', width: engV1 },
        { text: 'Authorized Signatory\nName & Signature', width: engW2, isLabel: true, bold: true },
        { text: fields.authorizedSignatory || 'Er. Satyajit Mohanty', width: engV2 },
      ], 24, 4);
    }

    // Base save() stamps page numbers on every page via this.drawPageNumbers()
    return await this.save();
  }
}

export default PDFArthanFinanceRenderer;
