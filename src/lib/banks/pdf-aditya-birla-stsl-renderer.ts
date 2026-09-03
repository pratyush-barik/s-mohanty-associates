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
    pad: number
  ): void {
    const lLines = this.wrapText(label, labelWidth - pad * 2, fontSize, true);
    const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSelectedNorm = norm(selected || '');

    const normalizeClass = (val: string) => {
      if (val === 'classa' || val === 'a' || val === 'excellent') return 'classa';
      if (val === 'classb' || val === 'b' || val === 'good') return 'classb';
      if (val === 'classc' || val === 'c' || val === 'average') return 'classc';
      if (val === 'classd' || val === 'd' || val === 'poor' || val === 'low') return 'classd';
      return val;
    };

    const isSelectedMatch = (opt: string) => {
      const optNorm = norm(opt);
      if (!optNorm || !cleanSelectedNorm) return false;
      if (optNorm === cleanSelectedNorm) return true;
      if (normalizeClass(optNorm) === normalizeClass(cleanSelectedNorm)) return true;
      if ((selected || '').includes('/') || (selected || '').includes('//')) {
        const parts = (selected || '').split(/[\/\\]+/).map(p => norm(p)).filter(Boolean);
        if (parts.length > 0) {
          if (parts[0] === optNorm || normalizeClass(parts[0]) === normalizeClass(optNorm)) return true;
        }
      }
      if (optNorm.startsWith(cleanSelectedNorm) || cleanSelectedNorm.startsWith(optNorm)) {
        if (Math.min(optNorm.length, cleanSelectedNorm.length) >= 3) return true;
      }
      return false;
    };

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

    // Draw options text with bold selected
    let valY = y - pad - fontSize * 0.85;
    let curLineX = valX + pad;
    const maxLineX = valX + valueWidth - pad;
    const sep = ' // ';
    const sepW = this.fontRegular.widthOfTextAtSize(sep, fontSize);

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const isSelected = isSelectedMatch(opt);
      const optFont = isSelected ? this.fontBold : this.fontRegular;
      const optText = opt;
      const optW = optFont.widthOfTextAtSize(optText, fontSize);

      if (curLineX + optW > maxLineX && curLineX > valX + pad) {
        valY -= fontSize * LINE_HEIGHT;
        curLineX = valX + pad;
      }

      this.page.drawText(optText, {
        x: curLineX,
        y: valY,
        size: fontSize,
        font: optFont,
        color: isSelected ? rgb(0, 0, 0) : rgb(0.2, 0.2, 0.2),
      });
      curLineX += optW;

      if (i < options.length - 1) {
        this.page.drawText(sep, {
          x: curLineX,
          y: valY,
          size: fontSize,
          font: this.fontRegular,
          color: rgb(0.4, 0.4, 0.4),
        });
        curLineX += sepW;

        const nextOpt = options[i + 1];
        const nextIsSelected = cleanSelected.length > 0 && nextOpt.trim().toLowerCase() === cleanSelected;
        const nextFont = nextIsSelected ? this.fontBold : this.fontRegular;
        const nextOptW = nextFont.widthOfTextAtSize(nextOpt, fontSize);

        if (curLineX + nextOptW > maxLineX) {
          valY -= fontSize * LINE_HEIGHT;
          curLineX = valX + pad;
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
    pad: number
  ): number {
    const lLines = this.wrapText(label, labelWidth - pad * 2, fontSize, true);
    let lineCount = 1;
    let curLineX = pad;
    const maxValW = valueWidth - pad * 2;
    const sep = ' // ';
    const sepW = this.fontRegular.widthOfTextAtSize(sep, fontSize);

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const optW = this.fontBold.widthOfTextAtSize(opt, fontSize);
      if (curLineX + optW > maxValW && curLineX > pad) {
        lineCount++;
        curLineX = pad;
      }
      curLineX += optW;

      if (i < options.length - 1) {
        curLineX += sepW;
        const nextOpt = options[i + 1];
        const nextOptW = this.fontBold.widthOfTextAtSize(nextOpt, fontSize);

        if (curLineX + nextOptW > maxValW) {
          lineCount++;
          curLineX = pad;
        }
      }
    }

    return Math.max(lLines.length, lineCount);
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
    valueWidth = CONTENT_W - 140
  ): void {
    const fontSize = FONT_SIZE;
    const pad = 3;

    const maxLines = this._calcSlashOptionLines(label, options, labelWidth, valueWidth, fontSize, pad);
    const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    this._renderSlashOptionBox(MARGIN_L, y, rowH, label, options, selected, labelWidth, valueWidth, fontSize, pad);
    this.cursorY += rowH;
  }

  /**
   * Draw two slash option fields side-by-side on the same row (parallel 4-column layout).
   */
  drawTwoSlashOptionRows(
    left: { label: string; options: string[]; selected?: string; labelWidth?: number; valueWidth?: number },
    right: { label: string; options: string[]; selected?: string; labelWidth?: number; valueWidth?: number }
  ): void {
    const fontSize = FONT_SIZE;
    const pad = 3;
    const halfTotalW = CONTENT_W / 2; // 272.64

    const lbl1W = left.labelWidth || 105;
    const val1W = left.valueWidth || (halfTotalW - lbl1W);

    const lbl2W = right.labelWidth || 105;
    const val2W = right.valueWidth || (CONTENT_W - (lbl1W + val1W + lbl2W));

    const lines1 = this._calcSlashOptionLines(left.label, left.options, lbl1W, val1W, fontSize, pad);
    const lines2 = this._calcSlashOptionLines(right.label, right.options, lbl2W, val2W, fontSize, pad);

    const maxLines = Math.max(lines1, lines2, 1);
    const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);

    // Render left box
    this._renderSlashOptionBox(MARGIN_L, y, rowH, left.label, left.options, left.selected, lbl1W, val1W, fontSize, pad);

    // Render right box
    this._renderSlashOptionBox(MARGIN_L + lbl1W + val1W, y, rowH, right.label, right.options, right.selected, lbl2W, val2W, fontSize, pad);

    this.cursorY += rowH;
  }

  /**
   * Draw a 4-column row where the left side is a standard Key-Value pair
   * and the right side is a multi-choice Slash Option pair.
   */
  drawKVAndSlashRow(
    kv: { label: string; value: string; labelWidth?: number; valueWidth?: number; bold?: boolean },
    slash: { label: string; options: string[]; selected?: string; labelWidth?: number; valueWidth?: number }
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
    const lines2 = this._calcSlashOptionLines(slash.label, slash.options, lbl2W, val2W, fontSize, pad);

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
    this._renderSlashOptionBox(MARGIN_L + lbl1W + val1W, y, rowH, slash.label, slash.options, slash.selected, lbl2W, val2W, fontSize, pad);

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
  drawDocChecklistTable(
    items: {
      name: string;
      status: string;
      details: string;
    }[]
  ): void {
    const colWidths = [130, 215, 55, 145.28];
    const statusOptions = ['Fully Available', 'Partially Available', 'Not Available', 'Not Applicable'];
    const pad = 3;
    const fontSize = FONT_SIZE;
    const sep = ' // ';
    const sepW = this.fontRegular.widthOfTextAtSize(sep, fontSize);

    const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    for (const item of items) {
      const cleanSelectedNorm = norm(item.status || 'Not Available');
      const isStatusMatch = (opt: string) => {
        const optNorm = norm(opt);
        if (!optNorm || !cleanSelectedNorm) return false;
        if (optNorm === cleanSelectedNorm) return true;
        if (cleanSelectedNorm.includes(optNorm) && optNorm.length >= 8) return true;
        return false;
      };

      const nameLines = this.wrapText(item.name, colWidths[0] - pad * 2, fontSize, true);
      const lines2 = this._calcSlashOptionLines('', statusOptions, 0, colWidths[1], fontSize, pad);
      const detailsLines = this.wrapText(item.details || 'NA', colWidths[3] - pad * 2, fontSize, false);

      const maxLines = Math.max(nameLines.length, lines2, detailsLines.length, 1);
      const rowH = Math.max(20, maxLines * fontSize * LINE_HEIGHT + pad * 2);
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

      // Col 2: Status Options with Bold Selected
      this.page.drawRectangle({
        x: curX,
        y: y - rowH,
        width: colWidths[1],
        height: rowH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
      });
      let stY = y - pad - fontSize * 0.85;
      let stX = curX + pad;
      const maxCol2X = curX + colWidths[1] - pad;

      for (let s = 0; s < statusOptions.length; s++) {
        const sOpt = statusOptions[s];
        const isSel = isStatusMatch(sOpt);
        const sFont = isSel ? this.fontBold : this.fontRegular;
        const sW = sFont.widthOfTextAtSize(sOpt, fontSize);

        if (stX + sW > maxCol2X && stX > curX + pad) {
          stY -= fontSize * LINE_HEIGHT;
          stX = curX + pad;
        }

        this.page.drawText(sOpt, {
          x: stX,
          y: stY,
          size: fontSize,
          font: sFont,
          color: isSel ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3),
        });
        stX += sW;

        if (s < statusOptions.length - 1) {
          this.page.drawText(sep, {
            x: stX,
            y: stY,
            size: fontSize,
            font: this.fontRegular,
            color: rgb(0.4, 0.4, 0.4),
          });
          stX += sepW;

          const nextOpt = statusOptions[s + 1];
          const nextIsSel = isStatusMatch(nextOpt);
          const nextFont = nextIsSel ? this.fontBold : this.fontRegular;
          const nextOptW = nextFont.widthOfTextAtSize(nextOpt, fontSize);

          if (stX + nextOptW > maxCol2X) {
            stY -= fontSize * LINE_HEIGHT;
            stX = curX + pad;
          }
        }
      }
      curX += colWidths[1];

      // Col 3: "Details" Label (Soft Blue background, bold)
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
      this.page.drawText('Details', {
        x: curX + pad,
        y: y - pad - fontSize * 0.85,
        size: fontSize,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      curX += colWidths[2];

      // Col 4: Details content
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
    const colWidths = [125, 95, 95, 100, 130.28];
    const headers = ['Built up area', 'As per Site', 'As per Plan/FAR', 'Deviations', 'Remarks'];
    const pad = 3;
    const fontSize = FONT_SIZE;
    const headerH = 18;

    this.checkPageBreak(headerH);
    let y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    // Draw Table Header Row (Soft blue background, bold)
    for (let i = 0; i < headers.length; i++) {
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

      const lineY = y - pad - fontSize * 0.85;
      this.page.drawText(headers[i], {
        x: curX + pad,
        y: lineY,
        size: fontSize,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
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

      // Col 4: Deviations (Yes // No with selected bold)
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
      let devX = curX + pad;

      // Draw "Yes"
      const yesFont = isYes && !isNo ? this.fontBold : this.fontRegular;
      this.page.drawText('Yes', { x: devX, y: lineY, size: fontSize, font: yesFont, color: isYes && !isNo ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3) });
      devX += yesFont.widthOfTextAtSize('Yes', fontSize);

      // Draw " // "
      this.page.drawText(' // ', { x: devX, y: lineY, size: fontSize, font: this.fontRegular, color: rgb(0.4, 0.4, 0.4) });
      devX += this.fontRegular.widthOfTextAtSize(' // ', fontSize);

      // Draw "No"
      const noFont = isNo ? this.fontBold : this.fontRegular;
      this.page.drawText('No', { x: devX, y: lineY, size: fontSize, font: noFont, color: isNo ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3) });

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
    const colWidths = [115, 95, 95, 115, 125.28];
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
    const uDevLines = this.wrapText(usageDeviation || 'Usage Deviation', colWidths[3] - 6, FONT_SIZE, true);
    let uDevY = y - totalSetbackH / 2 + (uDevLines.length * FONT_SIZE * LINE_HEIGHT) / 2 - FONT_SIZE * 0.85;
    for (const line of uDevLines) {
      const tw = this.fontBold.widthOfTextAtSize(line, FONT_SIZE);
      this.page.drawText(line, {
        x: x3 + (colWidths[3] - tw) / 2,
        y: uDevY,
        size: FONT_SIZE,
        font: this.fontBold,
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
    const colWidths = [105.28, 110, 110, 110, 110];
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
      const lines = this.wrapText(pt, CONTENT_W - 10, fontSize - 1, false);
      for (const line of lines) {
        this.checkPageBreak(14);
        const yPt = this.pdfY(this.cursorY);
        this.page.drawText(line, {
          x: MARGIN_L,
          y: yPt - 10,
          size: fontSize - 1,
          font: this.fontRegular,
          color: rgb(0, 0, 0),
        });
        this.cursorY += 13;
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
      size: fontSize - 0.5,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(`•    Report Finalized by – ${finalizedBy || 'Trupti Dash'}`, {
      x: MARGIN_L + 20,
      y: ySign - 26,
      size: fontSize - 0.5,
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
