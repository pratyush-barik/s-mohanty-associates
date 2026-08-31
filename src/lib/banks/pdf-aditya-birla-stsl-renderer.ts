/**
 * pdf-aditya-birla-stsl-renderer.ts — Dedicated PDF renderer for Aditya Birla Capital Ltd (STSL).
 * Extends PDFBankRenderer to replicate the exact 7-page reference format.
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
  propertyType?: string; // Residential // Commercial // Industrial // Institutional // Agriculture // Residential cum commercial
  propertySubType?: string; // Row House / Bungalow / etc.
  localityDevelopment?: string; // Well Developed // Developed // Developing // Under Develop // Slum
  propertyJurisdiction?: string; // Municipal Corporation // Gram Panchayat // Town Planning Authority // Development Authority // Municipality // NAC
  surroundingOccupancy?: string; // Densely Populated // Moderately Populated // Low Population density
  conditionOfSite?: string; // Well Developed // Developing // Under Developed
  distanceRailwayStation?: string;
  distanceBusStop?: string;
  distanceFromMainRoad?: string; // Not Applicable (Prop on Concrete Road) // Less than 200 m // 200 to 500 m // above 500 m
  distanceFromCityCenter?: string;
  distanceFromBranch?: string;
  approachRoadWidth?: string;
  dimensionWidth?: string;
  dimensionDepth?: string;
  physicalApproach?: string; // Clear // Partially Clear // Not Clear
  legalApproach?: string; // Clear // Partially Clear // Not Clear
  otherEncumbranceFeatures?: string; // Yes // No

  // Section 3: Property Details
  occupiedBy?: string;
  occupantName?: string;
  occupiedSince?: string;
  plotDemarcated?: string;
  propertyIdentification?: string;
  identificationThrough?: string;
  projectCategory?: string; // A // B // C // D // A+ // Not Applicable
  flatType?: string; // Normal // Duplex // Not applicable
  flatConfiguration?: string;
  propertyHolding?: string; // Freehold // Leasehold
  structureType?: string; // RCC / Load Bearing
  areaOfFlat?: string;
  totalNoOfFloors?: string;
  liftFacility?: string; // Yes / No
  amenities?: string; // Average // Excellent // Good // Low // NA
  marketability?: string; // Average // Excellent // Good // Low
  viewOfProperty?: string;
  parkingFacility?: string; // Yes // No
  qualityOfConstruction?: string; // Class A // Class B // Class C // Class D
  typeOfParking?: string; // Open CP // Dependent CP // Covered CP // Mechanical CP // Semi-Covered
  shapeOfProperty?: string; // Regular // Irregular
  placementOfProperty?: string; // NE Facing Corner Plot // Corner Plot // Intermittent Property // South Facing
  exteriors?: string; // Average // Poor // Excellent // Good // Low
  interiors?: string; // Average // Poor // Excellent // Good // Low
  ageOfPropertyActual?: string;
  estimatedFutureLife?: string;
  sourceOfAge?: string;
  maintenanceCondition?: string; // Average // Excellent // Good // Low
  cautiousLocations?: string; // Yes / No

  // Section 4: Accommodation / Unit Details
  unitTypeHeader?: string; // Building
  accommodationDetails?: string; // Ground Floor: 3(G+2)
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
  carpetAreaPlan?: string;
  carpetAreaMeasurement?: string;
  buaNorms?: string;
  buaMeasurementLabel?: string;
  buaMeasurementArea?: string;
  buaMeasurementRate?: string;
  buaMeasurementValue?: string;
  superBua?: string;
  superBuaRate?: string;
  superBuaValue?: string;
  carParkValue?: string;
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
  /**
   * Draw a multi-option row where all choices are shown with `//` separators,
   * and the chosen option is bolded/underlined or enclosed in brackets.
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

    const lLines = this.wrapText(label, labelWidth - pad * 2, fontSize, true);

    // Build option text segments
    const cleanSelected = (selected || '').trim().toLowerCase();
    const joinedText = options.join(' // ');
    const vLines = this.wrapText(joinedText, valueWidth - pad * 2, fontSize, false);

    const maxLines = Math.max(lLines.length, vLines.length);
    const rowH = Math.max(18, maxLines * fontSize * LINE_HEIGHT + pad * 2);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    // Draw Label
    this.page.drawRectangle({
      x: curX,
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
        x: curX + pad,
        y: lineY,
        size: fontSize,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      lineY -= fontSize * LINE_HEIGHT;
    }
    curX += labelWidth;

    // Draw Value box
    this.page.drawRectangle({
      x: curX,
      y: y - rowH,
      width: valueWidth,
      height: rowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    // Draw rich text with selected option bolded
    let valY = y - pad - fontSize * 0.85;
    let lineX = curX + pad;

    for (let i = 0; i < options.length; i++) {
      const opt = options[i];
      const isSelected = cleanSelected.length > 0 && opt.toLowerCase().includes(cleanSelected);
      const optFont = isSelected ? this.fontBold : this.fontRegular;
      const optText = opt;

      const optW = optFont.widthOfTextAtSize(optText, fontSize);

      if (lineX + optW > curX + valueWidth - pad && lineX > curX + pad) {
        valY -= fontSize * LINE_HEIGHT;
        lineX = curX + pad;
      }

      this.page.drawText(optText, {
        x: lineX,
        y: valY,
        size: fontSize,
        font: optFont,
        color: isSelected ? rgb(0, 0, 0) : rgb(0.2, 0.2, 0.2),
      });
      lineX += optW;

      if (i < options.length - 1) {
        const sep = ' // ';
        const sepW = this.fontRegular.widthOfTextAtSize(sep, fontSize);
        if (lineX + sepW > curX + valueWidth - pad) {
          valY -= fontSize * LINE_HEIGHT;
          lineX = curX + pad;
        }
        this.page.drawText(sep, {
          x: lineX,
          y: valY,
          size: fontSize,
          font: this.fontRegular,
          color: rgb(0.4, 0.4, 0.4),
        });
        lineX += sepW;
      }
    }

    this.cursorY += rowH;
  }

  /**
   * Draw the Documentation Details 8-item checklist table
   */
  drawDocChecklistTable(
    items: {
      name: string;
      status: string;
      details: string;
    }[]
  ): void {
    const colWidths = [120, 195, 50, 137.28];
    const statusOptions = ['Fully Available', 'Partially Available', 'Not Available', 'Not Applicable'];

    for (const item of items) {
      const cleanStatus = (item.status || 'Not Available').trim().toLowerCase();
      const statusText = statusOptions.join('//');

      const nameLines = this.wrapText(item.name, colWidths[0] - 6, FONT_SIZE, true);
      const statusLines = this.wrapText(statusText, colWidths[1] - 6, FONT_SIZE, false);
      const detailsLines = this.wrapText(item.details || 'NA', colWidths[3] - 6, FONT_SIZE, false);

      const maxLines = Math.max(nameLines.length, statusLines.length, detailsLines.length, 1);
      const rowH = Math.max(20, maxLines * FONT_SIZE * LINE_HEIGHT + 6);
      this.checkPageBreak(rowH);

      const y = this.pdfY(this.cursorY);
      let curX = MARGIN_L;

      // Col 1: Document Name (Soft Blue background)
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
      let lineY = y - 3 - FONT_SIZE * 0.85;
      for (const line of nameLines) {
        this.page.drawText(line, { x: curX + 3, y: lineY, size: FONT_SIZE, font: this.fontBold, color: rgb(0, 0, 0) });
        lineY -= FONT_SIZE * LINE_HEIGHT;
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
      let stY = y - 3 - FONT_SIZE * 0.85;
      let stX = curX + 3;
      for (let s = 0; s < statusOptions.length; s++) {
        const sOpt = statusOptions[s];
        const isSel = cleanStatus.includes(sOpt.toLowerCase());
        const sFont = isSel ? this.fontBold : this.fontRegular;
        const sW = sFont.widthOfTextAtSize(sOpt, FONT_SIZE);

        if (stX + sW > curX + colWidths[1] - 3 && stX > curX + 3) {
          stY -= FONT_SIZE * LINE_HEIGHT;
          stX = curX + 3;
        }

        this.page.drawText(sOpt, {
          x: stX,
          y: stY,
          size: FONT_SIZE,
          font: sFont,
          color: isSel ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3),
        });
        stX += sW;

        if (s < statusOptions.length - 1) {
          const sep = '//';
          const sepW = this.fontRegular.widthOfTextAtSize(sep, FONT_SIZE);
          if (stX + sepW > curX + colWidths[1] - 3) {
            stY -= FONT_SIZE * LINE_HEIGHT;
            stX = curX + 3;
          }
          this.page.drawText(sep, { x: stX, y: stY, size: FONT_SIZE, font: this.fontRegular, color: rgb(0.5, 0.5, 0.5) });
          stX += sepW;
        }
      }
      curX += colWidths[1];

      // Col 3: "Details" label
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
        x: curX + 3,
        y: y - 3 - FONT_SIZE * 0.85,
        size: FONT_SIZE,
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
      lineY = y - 3 - FONT_SIZE * 0.85;
      for (const line of detailsLines) {
        this.page.drawText(line, { x: curX + 3, y: lineY, size: FONT_SIZE, font: this.fontRegular, color: rgb(0, 0, 0) });
        lineY -= FONT_SIZE * LINE_HEIGHT;
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
    const colWidths = [110, 85, 85, 100, 122.28];
    this.drawTable(
      ['Setbacks', 'As per plan/ Bye laws', 'Actual at site', 'Deviation', 'Remarks, if any'],
      [],
      colWidths
    );

    // Calculate total height needed for the 4 setback rows
    const numRows = setbacks.length;
    const rowH = 18;
    const totalSetbackH = numRows * rowH;
    this.checkPageBreak(totalSetbackH);

    const y = this.pdfY(this.cursorY);

    // Draw individual setback rows for col 0, 1, 2
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

    // Col 3: Usage Deviation (Spanning all setback rows)
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

    // Col 4: Remarks (Spanning all setback rows)
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
    const colWidths = [102.28, 100, 100, 100, 100];
    this.drawTable(
      ['Detailing', 'North', 'South', 'East', 'West'],
      [
        ['As per Sale deed', saleDeed.north || '', saleDeed.south || '', saleDeed.east || '', saleDeed.west || ''],
        ['Bhulekh map', bhulekh.north || '', bhulekh.south || '', bhulekh.east || '', bhulekh.west || ''],
        ['As per Actual', actual.north || '', actual.south || '', actual.east || '', actual.west || ''],
      ],
      colWidths
    );

    // Boundary Matching row
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
    this.page.drawText(`Name of Appraiser: ${appraiserName || ''}`, {
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
      x: MARGIN_L,
      y: yLine,
      x2: MARGIN_L + CONTENT_W,
      y2: yLine,
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
      x: MARGIN_L,
      y: yDec - 14,
      x2: MARGIN_L + decW,
      y2: yDec - 14,
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
      x: MARGIN_L + 20,
      y: yBottomLine,
      x2: MARGIN_L + CONTENT_W,
      y2: yBottomLine,
      color: rgb(0.7, 0.7, 0.7),
      thickness: 0.5,
    });
    this.cursorY += 45;
  }
}

export default PDFAdityaBirlaSTSLRenderer;
