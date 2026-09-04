/**
 * pdf-aditya-birla-stsl-renderer.ts — Dedicated PDF renderer for Aditya Birla Capital Ltd (STSL).
 * Extends PDFBankRenderer to replicate the exact reference format.
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

export interface STSLReportFields {
  // Section 1: Basic Details
  valuerName?: string;
  clientName?: string;
  ownerName?: string;
  initiationDate?: string;
  vertical?: string;
  dateOfInspection?: string;
  caseReferenceNumber?: string;
  dateOfValuation?: string;
  propertyOwnerName?: string;

  // Section 2: Location Details
  propertyAddressAsTRF?: string;
  propertyAddressAsVisit?: string;
  propertyAddressAsDocs?: string;
  mainLocality?: string;
  subLocality?: string;
  microLocation?: string;
  landmark?: string;
  latitude?: string;
  longitude?: string;
  typeOfProperty?: string;
  currentUsage?: string;
  valuedBefore?: string;
  valuedBeforeDate?: string;
  propertyType?: string;
  propertySubType?: string;
  localityDevelopment?: string;
  propertyJurisdiction?: string;
  surroundingOccupancy?: string;
  conditionOfSite?: string;
  distanceRailwayStation?: string;
  distanceBusStop?: string;
  distanceFromMainRoad?: string;
  distanceFromCityCenter?: string;
  distanceFromBranch?: string;
  approachRoadWidth?: string;
  dimensionWidth?: string;
  dimensionDepth?: string;
  physicalApproach?: string;
  legalApproach?: string;
  otherEncumbranceFeatures?: string;

  // Section 3: Property Details
  occupiedBy?: string;
  occupantName?: string;
  occupiedSince?: string;
  plotDemarcated?: string;
  propertyIdentification?: string;
  identificationThrough?: string;
  projectCategory?: string;
  flatType?: string;
  flatConfiguration?: string;
  propertyHolding?: string;
  structureType?: string;
  areaOfFlat?: string;
  totalNoOfFloors?: string;
  liftFacility?: string;
  amenities?: string;
  marketability?: string;
  viewOfProperty?: string;
  parkingFacility?: string;
  qualityOfConstruction?: string;
  typeOfParking?: string;
  shapeOfProperty?: string;
  placementOfProperty?: string;
  exteriors?: string;
  interiors?: string;
  ageOfPropertyActual?: string;
  estimatedFutureLife?: string;
  sourceOfAge?: string;
  maintenanceCondition?: string;
  cautiousLocations?: string;

  // Section 4: Accommodation / Unit Details
  unitTypeHeader?: string;
  accommodationDetails?: string;
  accommodationRows?: { floor: string; unitDetails: string }[];

  // Section 5: Documentation Details (8-item checklist)
  docSaleDeedStatus?: string;
  docSaleDeedDetails?: string;
  docSanctionPlanStatus?: string;
  docSanctionPlanDetails?: string;
  docCCOCStatus?: string;
  docCCOCDetails?: string;
  docAgreementSaleStatus?: string;
  docAgreementSaleDetails?: string;
  docMutationStatus?: string;
  docMutationDetails?: string;
  docTaxReceiptStatus?: string;
  docTaxReceiptDetails?: string;
  docElectricityBillStatus?: string;
  docElectricityBillDetails?: string;
  docConversionStatus?: string;
  docConversionDetails?: string;

  // Section 6: Built-Up Area Table
  buaRows?: {
    floor: string;
    asPerSite: string;
    asPerPlan: string;
    deviations: string;
    remarks: string;
  }[];

  // Section 7: Valuation Table
  plotAreaDocs?: string;
  plotAreaDocsRate?: string;
  plotAreaDocsValue?: string;
  plotAreaPhysical?: string;
  plotAreaPhysicalRate?: string;
  plotAreaPhysicalValue?: string;
  carpetAreaPlan?: string;
  carpetAreaPlanRate?: string;
  carpetAreaPlanValue?: string;
  carpetAreaMeasurement?: string;
  carpetAreaMeasurementRate?: string;
  carpetAreaMeasurementValue?: string;
  buaNorms?: string;
  buaNormsRate?: string;
  buaNormsValue?: string;
  buaMeasurementLabel?: string;
  buaStructureSuffix?: string;
  buaMeasurementArea?: string;
  buaMeasurementRate?: string;
  buaMeasurementValue?: string;
  superBua?: string;
  superBuaRate?: string;
  superBuaValue?: string;
  carParkArea?: string;
  carParkRate?: string;
  carParkValue?: string;
  amenitiesArea?: string;
  amenitiesRate?: string;
  amenitiesValue?: string;

  // Section 8: Setbacks & Other Valuation Summary
  setbackFrontPlan?: string;
  setbackFrontActual?: string;
  setbackSide1Plan?: string;
  setbackSide1Actual?: string;
  setbackSide2Plan?: string;
  setbackSide2Actual?: string;
  setbackRearPlan?: string;
  setbackRearActual?: string;
  setbackUsageDeviation?: string;
  setbackRemarks?: string;

  totalValuationFormula?: string;
  totalPropertyValuation?: string;
  distressValue?: string;
  distressPct?: string;
  insuranceValue?: string;
  govtLandRate?: string;
  percentageCompletion?: string;
  percentageRecommendation?: string;

  // Section 9: Boundary Detailing Table
  boundaryDeedNorth?: string;
  boundaryDeedSouth?: string;
  boundaryDeedEast?: string;
  boundaryDeedWest?: string;
  boundaryMouzaNorth?: string;
  boundaryMouzaSouth?: string;
  boundaryMouzaEast?: string;
  boundaryMouzaWest?: string;
  boundaryActualNorth?: string;
  boundaryActualSouth?: string;
  boundaryActualEast?: string;
  boundaryActualWest?: string;
  boundariesMatching?: string;

  // Section 10: Remarks & Sign-off
  remarks?: string;
  engineerVisitedName?: string;
  appraiserName?: string;
  preparedBy?: string;
  finalizedBy?: string;

  // Section 11 & 12: Maps & Photos
  propertyImages?: string[];
  propertyImageNames?: string[];
  locationMapImage?: string;
  mouzaMapImage?: string;
  cadastralMapImage?: string;

  // Annexures
  annexureEnabled?: boolean;
  annexureRef?: string;
  annexureRefShowAlso?: boolean;
  legalAnnexureEnabled?: boolean;
  legalAnnexureRef?: string;
  legalAnnexureRefShowAlso?: boolean;
  annexures?: any[];

  [key: string]: any;
}

export class PDFAdityaBirlaSTSLRenderer extends PDFBankRenderer {
  private _renderSlashOptionBox(
    startX: number,
    y: number,
    rowH: number,
    label: string,
    options: string[],
    selected: string | undefined,
    labelWidth: number,
    valueWidth: number,
    fontSize: number,
    pad: number,
    alwaysBreak = false
  ): void {
    const lLines = this.wrapText(label, labelWidth - pad * 2, fontSize, true);
    const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSelectedNorm = norm(selected || '');
    const isLocality = label.trim().toLowerCase() === 'locality';
    const shouldAlwaysBreak = alwaysBreak || isLocality;

    const mapAlias = (val: string): string => {
      if (!val) return '';
      // Ratings / Quality / Exterior / Interior
      if (['classa', 'a', 'aplus', 'excellent', 'superior', 'verygood'].includes(val)) return 'excellent';
      if (['classb', 'b', 'good', 'wellmaintained'].includes(val)) return 'good';
      if (['classc', 'c', 'average', 'normal', 'satisfactory', 'fair', 'standard', 'moderate', 'beamandcolumnstructure', 'beamcolumnstructure', 'framedstructure', 'rcc'].includes(val)) return 'average';
      if (['classd', 'd', 'poor', 'bad', 'dilapidated', 'loadbearing'].includes(val)) return 'poor';
      if (['low', 'lowclass', 'inferior'].includes(val)) return 'low';

      // Yes / No / Demarcated / Approach
      if (['yes', 'easytoidentify', 'fullyavailable', 'clear', 'true', 'available', 'identified', 'demarcated'].includes(val)) return 'yes';
      if (['no', 'difficulttoidentify', 'notavailable', 'notclear', 'false', 'unidentified', 'notdemarcated'].includes(val)) return 'no';
      if (['partially', 'partiallyavailable', 'partiallyclear', 'part', 'partial'].includes(val)) return 'partially';
      if (['notapplicable', 'na', 'none'].includes(val)) return 'na';

      return val;
    };

    // Priority 1: Exact match (case-insensitive and whitespace-trimmed)
    let selectedIdx = options.findIndex(opt => norm(opt) === cleanSelectedNorm);

    // Priority 2: Alias match (only when exact match fails)
    if (selectedIdx === -1 && cleanSelectedNorm) {
      const selAlias = mapAlias(cleanSelectedNorm);
      selectedIdx = options.findIndex(opt => mapAlias(norm(opt)) === selAlias);
    }

    // Priority 3: Substring / Prefix match (min 3 chars)
    if (selectedIdx === -1 && cleanSelectedNorm) {
      selectedIdx = options.findIndex(opt => {
        const optNorm = norm(opt);
        return (optNorm.startsWith(cleanSelectedNorm) || cleanSelectedNorm.startsWith(optNorm) || optNorm.includes(cleanSelectedNorm) || cleanSelectedNorm.includes(optNorm)) && Math.min(optNorm.length, cleanSelectedNorm.length) >= 3;
      });
    }

    // Priority 4: Default fallback
    if (selectedIdx === -1 && options.length > 0) {
      selectedIdx = 0;
    }

    // Draw Label Box
    this.page.drawRectangle({
      x: startX,
      y: y - rowH,
      width: labelWidth,
      height: rowH,
      color: hexToRgb(LBL_BG),
      opacity: BG_OPACITY,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    let lineY = y - pad - fontSize * 0.85;
    for (const line of lLines) {
      this.page.drawText(line, {
        x: startX + pad,
        y: lineY,
        size: fontSize,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      lineY -= fontSize * LINE_HEIGHT;
    }

    const valX = startX + labelWidth;

    // Draw Value Box
    this.page.drawRectangle({
      x: valX,
      y: y - rowH,
      width: valueWidth,
      height: rowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    const optFontSize = fontSize;
    let valY = y - pad - optFontSize * 0.85;
    let curLineX = valX + pad;
    const maxLineX = valX + valueWidth - pad;
    const sep = ' //';
    const sepW = this.fontRegular.widthOfTextAtSize(sep, optFontSize);
    const spaceW = this.fontRegular.widthOfTextAtSize(' ', optFontSize);

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const isSelected = (i === selectedIdx);
      const optFont = isSelected ? this.fontBold : this.fontRegular;
      const optW = optFont.widthOfTextAtSize(opt, optFontSize);

      // Wrap if this option itself doesn't fit on the current line
      if (curLineX + optW > maxLineX && curLineX > valX + pad) {
        valY -= optFontSize * LINE_HEIGHT;
        curLineX = valX + pad;
      }

      this.page.drawText(opt, {
        x: curLineX,
        y: valY,
        size: optFontSize,
        font: optFont,
        color: isSelected ? rgb(0, 0, 0) : rgb(0.2, 0.2, 0.2),
      });
      curLineX += optW;

      if (i < options.length - 1) {
        this.page.drawText(sep, {
          x: curLineX,
          y: valY,
          size: optFontSize,
          font: this.fontRegular,
          color: rgb(0.4, 0.4, 0.4),
        });
        curLineX += sepW;

        if (shouldAlwaysBreak) {
          // Break after every single //
          valY -= optFontSize * LINE_HEIGHT;
          curLineX = valX + pad;
        } else {
          const nextOpt = options[i + 1];
          const nextIsSelected = (i + 1 === selectedIdx);
          const nextFont = nextIsSelected ? this.fontBold : this.fontRegular;
          const nextOptW = nextFont.widthOfTextAtSize(nextOpt, optFontSize);

          if (curLineX + spaceW + nextOptW > maxLineX) {
            // Next option won't fit → break to next line
            valY -= optFontSize * LINE_HEIGHT;
            curLineX = valX + pad;
          } else {
            // Fits → continue on same line with a space
            curLineX += spaceW;
          }
        }
      }
    }
  }

  private _calcSlashOptionLines(
    label: string,
    options: string[],
    labelWidth: number,
    valueWidth: number,
    fontSize: number,
    pad: number,
    alwaysBreak = false
  ): number {
    const lLines = this.wrapText(label, labelWidth - pad * 2, fontSize, true);
    const isLocality = label.trim().toLowerCase() === 'locality';
    const shouldAlwaysBreak = alwaysBreak || isLocality;

    if (shouldAlwaysBreak) {
      const valLineCount = Math.max(options.length, 1);
      return Math.max(lLines.length, valLineCount);
    }

    const optFontSize = fontSize;
    const maxValW = valueWidth - pad * 2;
    const sepW = this.fontRegular.widthOfTextAtSize(' //', optFontSize);
    const spaceW = this.fontRegular.widthOfTextAtSize(' ', optFontSize);

    let valLineCount = 1;
    let curX = 0;

    for (let i = 0; i < options.length; i++) {
      const optW = this.fontBold.widthOfTextAtSize(options[i], optFontSize);
      if (curX + optW > maxValW && curX > 0) {
        valLineCount++;
        curX = 0;
      }
      curX += optW;

      if (i < options.length - 1) {
        curX += sepW;
        const nextW = this.fontBold.widthOfTextAtSize(options[i + 1], optFontSize);
        if (curX + spaceW + nextW > maxValW) {
          valLineCount++;
          curX = 0;
        } else {
          curX += spaceW;
        }
      }
    }

    return Math.max(lLines.length, valLineCount, 1);
  }

  /**
   * Draw a full-width multi-option row where all choices are shown with `//` separators,
   * and the chosen option is bolded.
   */
  drawSlashOptionRow(
    label: string,
    options: string[],
    selected: string | undefined,
    labelWidth = 140,
    valueWidth?: number,
    alwaysBreak = false
  ): void {
    const vWidth = valueWidth !== undefined ? valueWidth : (CONTENT_W - labelWidth);
    const fontSize = FONT_SIZE;
    const pad = 3;

    const maxLines = this._calcSlashOptionLines(label, options, labelWidth, vWidth, fontSize, pad, alwaysBreak);
    const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    this._renderSlashOptionBox(MARGIN_L, y, rowH, label, options, selected, labelWidth, vWidth, fontSize, pad, alwaysBreak);
    this.cursorY += rowH;
  }

  /**
   * Draw two slash option fields side-by-side on the same row (parallel 4-column layout).
   */
  drawTwoSlashOptionRows(
    left: { label: string; options: string[]; selected?: string; labelWidth?: number; valueWidth?: number; alwaysBreak?: boolean },
    right: { label: string; options: string[]; selected?: string; labelWidth?: number; valueWidth?: number; alwaysBreak?: boolean }
  ): void {
    const fontSize = FONT_SIZE;
    const pad = 3;
    const halfTotalW = CONTENT_W / 2; // 272.64

    const lbl1W = left.labelWidth || 105;
    const val1W = left.valueWidth || (halfTotalW - lbl1W);

    const lbl2W = right.labelWidth || 105;
    const val2W = right.valueWidth || (CONTENT_W - (lbl1W + val1W + lbl2W));

    const lines1 = this._calcSlashOptionLines(left.label, left.options, lbl1W, val1W, fontSize, pad, left.alwaysBreak);
    const lines2 = this._calcSlashOptionLines(right.label, right.options, lbl2W, val2W, fontSize, pad, right.alwaysBreak);

    const maxLines = Math.max(lines1, lines2, 1);
    const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);

    // Render left box
    this._renderSlashOptionBox(MARGIN_L, y, rowH, left.label, left.options, left.selected, lbl1W, val1W, fontSize, pad, left.alwaysBreak);

    // Render right box
    this._renderSlashOptionBox(MARGIN_L + lbl1W + val1W, y, rowH, right.label, right.options, right.selected, lbl2W, val2W, fontSize, pad, right.alwaysBreak);

    this.cursorY += rowH;
  }

  /**
   * Draw a 4-column row where the left side is a standard Key-Value pair
   * and the right side is a multi-choice Slash Option pair.
   */
  drawKVAndSlashRow(
    kv: { label: string; value: string; labelWidth?: number; valueWidth?: number; bold?: boolean },
    slash: { label: string; options: string[]; selected?: string; labelWidth?: number; valueWidth?: number; alwaysBreak?: boolean }
  ): void {
    const fontSize = FONT_SIZE;
    const pad = 3;
    const halfTotalW = CONTENT_W / 2; // 272.64

    const lbl1W = kv.labelWidth || 115;
    const val1W = kv.valueWidth || (halfTotalW - lbl1W);

    const lbl2W = slash.labelWidth || 115;
    const val2W = slash.valueWidth || (CONTENT_W - (lbl1W + val1W + lbl2W));

    const lLines1 = this.wrapText(kv.label, lbl1W - pad * 2, fontSize, true);
    const vLines1 = this.wrapText(kv.value, val1W - pad * 2, fontSize, !!kv.bold);
    const lines1 = Math.max(lLines1.length, vLines1.length);
    const lines2 = this._calcSlashOptionLines(slash.label, slash.options, lbl2W, val2W, fontSize, pad, slash.alwaysBreak);

    const maxLines = Math.max(lines1, lines2, 1);
    const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);

    // ── Render Left KV ──
    this.page.drawRectangle({
      x: MARGIN_L,
      y: y - rowH,
      width: lbl1W,
      height: rowH,
      color: hexToRgb(LBL_BG),
      opacity: BG_OPACITY,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });
    let lineY = y - pad - fontSize * 0.85;
    for (const line of lLines1) {
      this.page.drawText(line, {
        x: MARGIN_L + pad,
        y: lineY,
        size: fontSize,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      lineY -= fontSize * LINE_HEIGHT;
    }

    this.page.drawRectangle({
      x: MARGIN_L + lbl1W,
      y: y - rowH,
      width: val1W,
      height: rowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });
    lineY = y - pad - fontSize * 0.85;
    for (const line of vLines1) {
      this.page.drawText(line, {
        x: MARGIN_L + lbl1W + pad,
        y: lineY,
        size: fontSize,
        font: kv.bold ? this.fontBold : this.fontRegular,
        color: rgb(0, 0, 0),
      });
      lineY -= fontSize * LINE_HEIGHT;
    }

    // ── Render Right Slash Option ──
    this._renderSlashOptionBox(MARGIN_L + lbl1W + val1W, y, rowH, slash.label, slash.options, slash.selected, lbl2W, val2W, fontSize, pad, slash.alwaysBreak);

    this.cursorY += rowH;
  }

  /**
   * Draw a 4-column row where the left side is a Slash Option pair
   * and the right side is a Key-Value pair.
   */
  drawSlashAndKVRow(
    slash: { label: string; options: string[]; selected?: string; labelWidth?: number; valueWidth?: number },
    kv: { label: string; value: string; labelWidth?: number; valueWidth?: number; bold?: boolean }
  ): void {
    const fontSize = FONT_SIZE;
    const pad = 3;
    const halfTotalW = CONTENT_W / 2; // 272.64

    const lbl1W = slash.labelWidth || 115;
    const val1W = slash.valueWidth || (halfTotalW - lbl1W);

    const lbl2W = kv.labelWidth || 115;
    const val2W = kv.valueWidth || (CONTENT_W - (lbl1W + val1W + lbl2W));

    const lines1 = this._calcSlashOptionLines(slash.label, slash.options, lbl1W, val1W, fontSize, pad);
    const lLines2 = this.wrapText(kv.label, lbl2W - pad * 2, fontSize, true);
    const vLines2 = this.wrapText(kv.value, val2W - pad * 2, fontSize, !!kv.bold);
    const lines2 = Math.max(lLines2.length, vLines2.length);

    const maxLines = Math.max(lines1, lines2, 1);
    const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);

    // ── Render Left Slash Option ──
    this._renderSlashOptionBox(MARGIN_L, y, rowH, slash.label, slash.options, slash.selected, lbl1W, val1W, fontSize, pad);

    // ── Render Right KV ──
    const rightX = MARGIN_L + lbl1W + val1W;
    this.page.drawRectangle({
      x: rightX,
      y: y - rowH,
      width: lbl2W,
      height: rowH,
      color: hexToRgb(LBL_BG),
      opacity: BG_OPACITY,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });
    let lineY = y - pad - fontSize * 0.85;
    for (const line of lLines2) {
      this.page.drawText(line, {
        x: rightX + pad,
        y: lineY,
        size: fontSize,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      lineY -= fontSize * LINE_HEIGHT;
    }

    this.page.drawRectangle({
      x: rightX + lbl2W,
      y: y - rowH,
      width: val2W,
      height: rowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });
    lineY = y - pad - fontSize * 0.85;
    for (const line of vLines2) {
      this.page.drawText(line, {
        x: rightX + lbl2W + pad,
        y: lineY,
        size: fontSize,
        font: kv.bold ? this.fontBold : this.fontRegular,
        color: rgb(0, 0, 0),
      });
      lineY -= fontSize * LINE_HEIGHT;
    }

    this.cursorY += rowH;
  }

  /**
   * Draw Documentation Checklist Table
   */
  drawDocChecklistTable(
    items: {
      name: string;
      status?: string;
      details?: string;
    }[]
  ): void {
    // Exact coincidence with BUA table: [100, 185, 60, 142.28]
    // 100 + 185 = 285 (same X as Details label & Deviations!)
    // Details label width = 60 (same width as Deviations!)
    // Details content width = 142.28 (same width as Remarks!)
    const colWidths = [100, 185, 60, CONTENT_W - (100 + 185 + 60)];
    const statusOptions = ['Fully Available', 'Partially Available', 'Not Available', 'Not Applicable'];
    const pad = 3;
    const fontSize = FONT_SIZE;
    const stFontSize = FONT_SIZE;
    const sep = '//';
    const sepW = this.fontRegular.widthOfTextAtSize(sep, stFontSize);
    const spaceW = this.fontRegular.widthOfTextAtSize(' ', stFontSize);

    const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const item of items) {
      const cleanSelectedNorm = norm(item.status || 'Not Available');
      let selectedIdx = statusOptions.findIndex(opt => norm(opt) === cleanSelectedNorm);
      if (selectedIdx === -1) {
        if (['available', 'fullyavailable', 'full', 'yes', 'provided', 'copyavailable'].includes(cleanSelectedNorm)) selectedIdx = 0;
        else if (['partiallyavailable', 'partially', 'part', 'partial'].includes(cleanSelectedNorm)) selectedIdx = 1;
        else if (['notapplicable', 'na', 'none'].includes(cleanSelectedNorm)) selectedIdx = 3;
        else selectedIdx = 2; // Not Available
      }

      const nameLines = this.wrapText(item.name, colWidths[0] - pad * 2, fontSize, true);
      // 2 options on each line → 2 lines total
      const lines2 = 2;
      const detailsLines = this.wrapText(item.details || 'NA', colWidths[3] - pad * 2, fontSize, false);

      const maxLines = Math.max(nameLines.length, lines2, detailsLines.length, 1);
      const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
      this.checkPageBreak(rowH);

      const y = this.pdfY(this.cursorY);
      let curX = MARGIN_L;

      // Col 1: Document Name (Soft Blue background, bold)
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[0],
        height: rowH,
        color: hexToRgb(LBL_BG),
        opacity: BG_OPACITY,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      let lineY = y - pad - fontSize * 0.85;
      for (const line of nameLines) {
        this.page.drawText(line, { x: curX + pad, y: lineY, size: fontSize, font: this.fontBold, color: rgb(0, 0, 0) });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += colWidths[0];

      // Col 2: Status Options — 2 on each line
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[1],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      let stY = y - pad - stFontSize * 0.85;
      let stX = curX + pad;

      for (let s = 0; s < statusOptions.length; s++) {
        const sOpt = statusOptions[s];
        const isSel = (s === selectedIdx);
        const sFont = isSel ? this.fontBold : this.fontRegular;
        const sW = sFont.widthOfTextAtSize(sOpt, stFontSize);

        this.page.drawText(sOpt, {
          x: stX,
          y: stY,
          size: stFontSize,
          font: sFont,
          color: isSel ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3),
        });
        stX += sW;

        if (s < statusOptions.length - 1) {
          this.page.drawText(sep, {
            x: stX,
            y: stY,
            size: stFontSize,
            font: this.fontRegular,
            color: rgb(0.4, 0.4, 0.4),
          });
          stX += sepW;

          // Break after option 1 (end of line 1: Fully Available// Partially Available//)
          if (s === 1) {
            stY -= stFontSize * LINE_HEIGHT;
            stX = curX + pad;
          } else {
            stX += spaceW;
          }
        }
      }
      curX += colWidths[1];

      // Col 3: "Details" Label (Soft Blue background, bold, centred — coincides with Deviations)
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[2],
        height: rowH,
        color: hexToRgb(LBL_BG),
        opacity: BG_OPACITY,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      const detailsLblW = this.fontBold.widthOfTextAtSize('Details', fontSize);
      const detailsLblX = curX + Math.max(1, (colWidths[2] - detailsLblW) / 2);
      this.page.drawText('Details', {
        x: detailsLblX,
        y: y - pad - fontSize * 0.85,
        size: fontSize,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      curX += colWidths[2];

      // Col 4: Details content (coincides with Remarks)
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[3],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      lineY = y - pad - fontSize * 0.85;
      for (const line of detailsLines) {
        this.page.drawText(line, { x: curX + pad, y: lineY, size: fontSize, font: this.fontRegular, color: rgb(0, 0, 0) });
        lineY -= fontSize * LINE_HEIGHT;
      }

      this.cursorY += rowH;
    }
  }

  /**
   * Draw the Built-Up Area Table directly under Documentation Details
   */
  drawBuaTable(
    rows: {
      floor: string;
      asPerSite?: string;
      asPerPlan?: string;
      deviations?: string;
      remarks?: string;
    }[]
  ): void {
    // Coincides with Doc Details: [100, 92.5, 92.5, 60, 142.28]
    // 100 + 92.5 + 92.5 = 285 (same X as Details label & Deviations!)
    // Deviations width = 60 (same width as Details label!)
    // Remarks width = 142.28 (same width as Details content!)
    const colWidths = [100, 92.5, 92.5, 60, CONTENT_W - (100 + 92.5 + 92.5 + 60)];
    const headerCols = [
      ['Built up area'],
      ['As per Site'],
      ['As per', 'Plan/FAR'],
      ['Deviations'],
      ['Remarks'],
    ];
    const pad = 3;
    const fontSize = FONT_SIZE;
    const headerH = 24;

    this.checkPageBreak(headerH);
    let y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    // Draw Table Header Row (Soft blue background, bold)
    for (let i = 0; i < headerCols.length; i++) {
      this.page.drawRectangle({
        x: curX,
        y: y - headerH,
        width: colWidths[i],
        height: headerH,
        color: hexToRgb(LBL_BG),
        opacity: BG_OPACITY,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });

      const lines = headerCols[i];
      const totalTextH = (lines.length - 1) * (fontSize * 1.1) + fontSize * 0.85;
      let lineY = y - (headerH - totalTextH) / 2 - fontSize * 0.85;

      for (const line of lines) {
        const hW = this.fontBold.widthOfTextAtSize(line, fontSize);
        const hX = curX + Math.max(pad, (colWidths[i] - hW) / 2);
        this.page.drawText(line, {
          x: hX,
          y: lineY,
          size: fontSize,
          font: this.fontBold,
          color: rgb(0, 0, 0),
        });
        lineY -= fontSize * 1.1;
      }
      curX += colWidths[i];
    }
    this.cursorY += headerH;

    // Draw Data Rows
    for (const row of rows) {
      const isTotal = row.floor.toLowerCase().includes('total');
      const rowFont = isTotal ? this.fontBold : this.fontRegular;

      const floorLines = this.wrapText(row.floor, colWidths[0] - pad * 2, fontSize, isTotal);
      const siteLines = this.wrapText(row.asPerSite || 'NA', colWidths[1] - pad * 2, fontSize, isTotal);
      const planLines = this.wrapText(row.asPerPlan || 'NA', colWidths[2] - pad * 2, fontSize, isTotal);
      const devLines = 1;
      const remarksLines = this.wrapText(row.remarks || '', colWidths[4] - pad * 2, fontSize, false);

      const maxLines = Math.max(floorLines.length, siteLines.length, planLines.length, devLines, remarksLines.length, 1);
      const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
      this.checkPageBreak(rowH);

      y = this.pdfY(this.cursorY);
      curX = MARGIN_L;

      // Col 1: Floor
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[0],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      let lineY = y - pad - fontSize * 0.85;
      for (const line of floorLines) {
        this.page.drawText(line, { x: curX + pad, y: lineY, size: fontSize, font: rowFont, color: rgb(0, 0, 0) });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += colWidths[0];

      // Col 2: As per Site
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[1],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      lineY = y - pad - fontSize * 0.85;
      for (const line of siteLines) {
        this.page.drawText(line, { x: curX + pad, y: lineY, size: fontSize, font: rowFont, color: rgb(0, 0, 0) });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += colWidths[1];

      // Col 3: As per Plan/FAR
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[2],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      lineY = y - pad - fontSize * 0.85;
      for (const line of planLines) {
        this.page.drawText(line, { x: curX + pad, y: lineY, size: fontSize, font: rowFont, color: rgb(0, 0, 0) });
        lineY -= fontSize * LINE_HEIGHT;
      }
      curX += colWidths[2];

      // Col 4: Deviations (Yes // No with selected bold, centered)
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[3],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      const devSelected = row.deviations || 'No';
      const devNorm = devSelected.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const isYes = devNorm === 'yes' || devNorm.startsWith('yes');
      const isNo = devNorm === 'no' || devNorm.endsWith('no') || devNorm === 'yesno';

      lineY = y - pad - fontSize * 0.85;

      const yesW = this.fontRegular.widthOfTextAtSize('Yes', fontSize);
      const sepStrW = this.fontRegular.widthOfTextAtSize(' // ', fontSize);
      const noW = this.fontRegular.widthOfTextAtSize('No', fontSize);
      const devTotalW = yesW + sepStrW + noW;
      let devX = curX + Math.max(pad, (colWidths[3] - devTotalW) / 2);

      // Draw "Yes"
      this.page.drawText('Yes', { x: devX, y: lineY, size: fontSize, font: this.fontRegular, color: isYes && !isNo ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3) });
      devX += yesW;

      // Draw " // "
      this.page.drawText(' // ', { x: devX, y: lineY, size: fontSize, font: this.fontRegular, color: rgb(0.4, 0.4, 0.4) });
      devX += sepStrW;

      // Draw "No"
      this.page.drawText('No', { x: devX, y: lineY, size: fontSize, font: this.fontRegular, color: isNo ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3) });

      curX += colWidths[3];

      // Col 5: Remarks
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[4],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      lineY = y - pad - fontSize * 0.85;
      for (const line of remarksLines) {
        this.page.drawText(line, { x: curX + pad, y: lineY, size: fontSize, font: this.fontRegular, color: rgb(0, 0, 0) });
        lineY -= fontSize * LINE_HEIGHT;
      }

      this.cursorY += rowH;
    }
  }

  /**
   * Draw the Setbacks and Other Details table
   */
  drawSetbacksTable(
    setbacks: { position: string; plan: string; site: string }[],
    usageDeviation: string,
    remarks: string
  ): void {
    // Exact sum to CONTENT_W (487.28): [115, 90, 90, 90, 102.28]
    const colWidths = [115, 90, 90, 90, CONTENT_W - (115 + 90 + 90 + 90)];
    this.drawTable(
      ['Setbacks', 'As per plan/ Bye laws', 'Actual at site', 'Deviation', 'Remarks, if any'],
      [],
      colWidths
    );

    const numRows = setbacks.length;
    const rowH = 18;
    const totalSetbackH = numRows * rowH;
    this.checkPageBreak(totalSetbackH);

    const y = this.pdfY(this.cursorY);

    for (let r = 0; r < numRows; r++) {
      const sb = setbacks[r];
      const curY = y - r * rowH;

      // Col 0: Position
      this.page.drawRectangle({
        x: MARGIN_L,
        y: curY - rowH,
        width: colWidths[0],
        height: rowH,
        color: hexToRgb(LBL_BG),
        opacity: BG_OPACITY,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      this.page.drawText(sb.position, {
        x: MARGIN_L + 3,
        y: curY - 3 - FONT_SIZE * 0.85,
        size: FONT_SIZE,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });

      // Col 1: Plan
      this.page.drawRectangle({
        x: MARGIN_L + colWidths[0],
        y: curY - rowH,
        width: colWidths[1],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      this.page.drawText(sb.plan || 'M', {
        x: MARGIN_L + colWidths[0] + (colWidths[1] - this.fontRegular.widthOfTextAtSize(sb.plan || 'M', FONT_SIZE)) / 2,
        y: curY - 3 - FONT_SIZE * 0.85,
        size: FONT_SIZE,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });

      // Col 2: Site
      this.page.drawRectangle({
        x: MARGIN_L + colWidths[0] + colWidths[1],
        y: curY - rowH,
        width: colWidths[2],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      this.page.drawText(sb.site || 'M', {
        x: MARGIN_L + colWidths[0] + colWidths[1] + (colWidths[2] - this.fontRegular.widthOfTextAtSize(sb.site || 'M', FONT_SIZE)) / 2,
        y: curY - 3 - FONT_SIZE * 0.85,
        size: FONT_SIZE,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });
    }

    // Col 3: Usage Deviation
    const x3 = MARGIN_L + colWidths[0] + colWidths[1] + colWidths[2];
    this.page.drawRectangle({
      x: x3,
      y: y - totalSetbackH,
      width: colWidths[3],
      height: totalSetbackH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });
    const uDevLines = this.wrapText(usageDeviation || 'Usage Deviation', colWidths[3] - 6, FONT_SIZE, false);
    let uDevY = y - totalSetbackH / 2 + (uDevLines.length * FONT_SIZE * LINE_HEIGHT) / 2 - FONT_SIZE * 0.85;
    for (const line of uDevLines) {
      const tw = this.fontRegular.widthOfTextAtSize(line, FONT_SIZE);
      this.page.drawText(line, {
        x: x3 + (colWidths[3] - tw) / 2,
        y: uDevY,
        size: FONT_SIZE,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });
      uDevY -= FONT_SIZE * LINE_HEIGHT;
    }

    // Col 4: Remarks
    const x4 = x3 + colWidths[3];
    this.page.drawRectangle({
      x: x4,
      y: y - totalSetbackH,
      width: colWidths[4],
      height: totalSetbackH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });
    const remLines = this.wrapText(remarks || 'Plan not provided', colWidths[4] - 6, FONT_SIZE, false);
    let remY = y - totalSetbackH / 2 + (remLines.length * FONT_SIZE * LINE_HEIGHT) / 2 - FONT_SIZE * 0.85;
    for (const line of remLines) {
      const tw = this.fontRegular.widthOfTextAtSize(line, FONT_SIZE);
      this.page.drawText(line, {
        x: x4 + (colWidths[4] - tw) / 2,
        y: remY,
        size: FONT_SIZE,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });
      remY -= FONT_SIZE * LINE_HEIGHT;
    }

    this.cursorY += totalSetbackH;
  }

  /**
   * Draw the 4-side Boundary Detailing Table (Sale deed vs Bhulekh map vs Actual)
   */
  drawBoundaryDetailingTable(
    saleDeed: { north: string; south: string; east: string; west: string },
    bhulekh: { north: string; south: string; east: string; west: string },
    actual: { north: string; south: string; east: string; west: string },
    matching: string
  ): void {
    // Exact sum to CONTENT_W (487.28): [107.28, 95, 95, 95, 95]
    const colWidths = [107.28, 95, 95, 95, 95];
    this.drawTable(
      ['Detailing', 'North', 'South', 'East', 'West'],
      [
        ['As per Sale deed', saleDeed.north || '', saleDeed.south || '', saleDeed.east || '', saleDeed.west || ''],
        ['Bhulekh map', bhulekh.north || '', bhulekh.south || '', bhulekh.east || '', bhulekh.west || ''],
        ['As per Actual', actual.north || '', actual.south || '', actual.east || '', actual.west || ''],
      ],
      colWidths
    );

    this.drawKeyValueRow([
      { label: 'Boundary Matching (Yes)', value: matching || 'Boundary matching as per documents', labelWidth: 150, valueWidth: CONTENT_W - 150 },
    ]);
  }

  /**
   * Draw the 5 Declaration Points and Sign-off block
   */
  drawDeclarationSection(appraiserName: string, preparedBy: string, finalizedBy: string): void {
    this.checkPageBreak(180);

    const fontSize = FONT_SIZE;
    const y0 = this.pdfY(this.cursorY);

    // Name of Appraiser
    this.page.drawText(`Name of Appraiser: ${appraiserName || 'Er. Satyajit Mohanty'}`, {
      x: MARGIN_L,
      y: y0 - 12,
      size: fontSize,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 24;

    // Dividing line
    const yLine = this.pdfY(this.cursorY);
    this.page.drawLine({
      start: { x: MARGIN_L, y: yLine },
      end: { x: MARGIN_L + CONTENT_W, y: yLine },
      color: rgb(0.7, 0.7, 0.7),
      thickness: 0.5,
    });
    this.cursorY += 10;

    // Declaration Header
    const yDec = this.pdfY(this.cursorY);
    this.page.drawText('Declaration', {
      x: MARGIN_L,
      y: yDec - 12,
      size: fontSize,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    // underline Declaration
    const decW = this.fontBold.widthOfTextAtSize('Declaration', fontSize);
    this.page.drawLine({
      start: { x: MARGIN_L, y: yDec - 14 },
      end: { x: MARGIN_L + decW, y: yDec - 14 },
      color: rgb(0, 0, 0),
      thickness: 1,
    });
    this.cursorY += 22;

    const points = [
      '1.   I hereby declare that, I have no direct and indirect interest in the property valued and the information furnished in the report is true and correct to the best of my knowledge of belief.',
      '2.   Any additions or alterations after the date of inspection shall not fall under the scope of this report.',
      '3.   The legal aspects are not in the scope of evaluation of the property.',
      '4.   The Property is identified by the owner before the valuer. This valuation report is prepared without any prejudice and bias to any person or institution.',
      '5.   This report has been prepared on basis of verifications in the locality.',
    ];

    for (const pt of points) {
      const lines = this.wrapText(pt, CONTENT_W - 10, fontSize, false);
      for (const line of lines) {
        this.checkPageBreak(15);
        const yPt = this.pdfY(this.cursorY);
        this.page.drawText(line, {
          x: MARGIN_L,
          y: yPt - 10,
          size: fontSize,
          font: this.fontRegular,
          color: rgb(0, 0, 0),
        });
        this.cursorY += 14;
      }
      this.cursorY += 4;
    }

    this.cursorY += 10;
    this.checkPageBreak(50);

    // Sign-off block
    const ySign = this.pdfY(this.cursorY);
    this.page.drawText(`•    Report Prepared by – ${preparedBy || 'Trupti Dash'}`, {
      x: MARGIN_L + 20,
      y: ySign - 12,
      size: fontSize,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(`•    Report Finalized by – ${finalizedBy || 'Trupti Dash'}`, {
      x: MARGIN_L + 20,
      y: ySign - 28,
      size: fontSize,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    const yBottomLine = ySign - 34;
    this.page.drawLine({
      start: { x: MARGIN_L + 20, y: yBottomLine },
      end: { x: MARGIN_L + CONTENT_W, y: yBottomLine },
      color: rgb(0.7, 0.7, 0.7),
      thickness: 0.5,
    });
    this.cursorY += 45;
  }
}

export default PDFAdityaBirlaSTSLRenderer;
