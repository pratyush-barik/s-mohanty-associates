/**
 * pdf-annapurna-micro-renderer.ts — Dedicated PDF renderer for Annapurna Micro Finance Ltd.
 *
 * Replicates the exact 5-page reference format verbatim:
 * - Clean black-bordered wireframe tables with white/transparent cells (NO colored fill banners)
 * - Exact vertical column spans: Address of Property, Approved Plan Details, Remarks, Declaration
 * - Strict 5-page layout:
 *   • Page 1: Application Details + Location Details (Address, Locality, Lat/Long, Legal Address, State)
 *   • Page 2: Location Details Continued (City, Pincode, Matching, Occupancy) + Schedule Table (4 sides) + NDMA Table (6 cols)
 *   • Page 3: Fire Exit + Approved Plan Details (6 approval sub-rows) + Technical Details + Plot Area Table + BAU Floor Area Table
 *   • Page 4: Permissible FSI & BUA Table + Status & Age + Valuation & Circle Rate Table + Remarks Box
 *   • Page 5: Additional Checks Table + Statutory Declaration (5 bullet clauses verbatim) + Date/Place + Appraiser Signatures
 *   • Pages 6+: Photographs of the Property -> Google Satellite Map -> Mouza Map -> Sketch Map -> Cadastral Map -> Annexures
 */

import { rgb, PDFFont } from 'pdf-lib';
import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_SMALL,
  LINE_HEIGHT,
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

  // Page 3: Approved Plan Details
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

  // Plot Area Details (East, West, North, South, Land Area)
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

  // BAU Area Details (Floors)
  bauFloors?: {
    floor: string;
    rooms: string;
    kitchens: string;
    bathrooms: string;
    sanctionedUsage: string;
    actualUsage: string;
  }[];

  // Page 4: FSI & Valuation Details
  permissibleAreaPlan?: string;
  landComponent?: string;
  permissibleFsi?: string;
  permissibleConstructionFsi?: string;
  actualConstructionBua?: string;
  considerConstructionBua?: string;

  riskOfDemolition?: string;
  propertyStatus?: string;
  completedPct?: string;
  recommendedPct?: string;
  currentAge?: string;
  residualAge?: string;

  landAreaSqft?: string;
  landRateSqft?: string;
  landTotalValue?: string;
  buaAreaSqft?: string;
  buaRateSqft?: string;
  buaTotalValue?: string;
  marketValue?: string;
  distressedValue?: string;
  distressedPct?: string;
  govtRate?: string;
  inDemolitionList?: string;
  inNegativeArea?: string;
  remarks?: string;

  // Page 5: Additional Checks
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

  // Signatures
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
  // Exact fonts and metric properties
  protected borderCol = rgb(0, 0, 0);
  protected borderThick = 0.6;
  protected padX = 4;
  protected padY = 3;

  /**
   * Draw a single rectangular cell with solid black border, pure transparent background,
   * vertically centered / top-aligned text with word wrapping.
   */
  drawCleanCell(
    x: number,
    y: number,
    w: number,
    h: number,
    text: string,
    options: {
      bold?: boolean;
      fontSize?: number;
      align?: 'left' | 'center' | 'right';
      vAlign?: 'top' | 'middle';
    } = {}
  ): void {
    const fontSize = options.fontSize || 8.5;
    const font = options.bold ? this.fontBold : this.fontRegular;
    const vAlign = options.vAlign || 'middle';
    const align = options.align || 'left';

    // Draw bounding rectangle with clean border and no background fill
    this.page.drawRectangle({
      x,
      y: y - h,
      width: w,
      height: h,
      borderColor: this.borderCol,
      borderWidth: this.borderThick,
    });

    const cleanText = this.sanitizeText(text);
    if (!cleanText) return;

    const maxTextW = Math.max(10, w - this.padX * 2);
    const lines = this.wrapText(cleanText, maxTextW, fontSize, options.bold);
    const lineH = fontSize * LINE_HEIGHT;
    const totalTextH = lines.length * lineH;

    let startY = vAlign === 'middle'
      ? (y - h / 2) + (totalTextH / 2) - (fontSize * 0.82)
      : (y - this.padY - fontSize * 0.82);

    for (const line of lines) {
      let lineX = x + this.padX;
      if (align === 'center') {
        const tw = font.widthOfTextAtSize(line, fontSize);
        lineX = x + (w - tw) / 2;
      } else if (align === 'right') {
        const tw = font.widthOfTextAtSize(line, fontSize);
        lineX = x + w - this.padX - tw;
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
   * Draw a row of cells whose height dynamically accommodates the maximum wrapped line height.
   */
  drawCleanRow(
    cols: {
      text: string;
      width: number;
      bold?: boolean;
      fontSize?: number;
      align?: 'left' | 'center' | 'right';
      vAlign?: 'top' | 'middle';
    }[],
    minH: number = 17
  ): number {
    let maxLines = 1;
    for (const col of cols) {
      const fontSize = col.fontSize || 8.5;
      const lines = this.wrapText(this.sanitizeText(col.text), Math.max(10, col.width - this.padX * 2), fontSize, col.bold);
      if (lines.length > maxLines) {
        maxLines = lines.length;
      }
    }

    const rowH = Math.max(minH, maxLines * 8.5 * LINE_HEIGHT + this.padY * 2 + 1);
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
   * Draw an underlined centered or left-aligned section header matching the exact sample style:
   * Bold text with a clean horizontal underline underneath.
   */
  drawCleanSectionHeader(title: string, centered: boolean = true, addSpaceBefore: number = 8): void {
    if (this.cursorY > 0 && addSpaceBefore > 0) {
      this.cursorY += addSpaceBefore;
    }

    const font = this.fontBold;
    const fontSize = 10.5;
    const text = this.sanitizeText(title);
    const tw = font.widthOfTextAtSize(text, fontSize);
    const y = this.pdfY(this.cursorY);

    const x = centered ? MARGIN_L + (CONTENT_W - tw) / 2 : MARGIN_L;

    this.page.drawText(text, {
      x,
      y: y - fontSize,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });

    // Underline
    this.page.drawLine({
      start: { x, y: y - fontSize - 2.5 },
      end: { x: x + tw, y: y - fontSize - 2.5 },
      thickness: 0.8,
      color: rgb(0, 0, 0),
    });

    this.cursorY += fontSize + 8;
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

    // 1. Ref No & Date
    const yHead = this.pdfY(this.cursorY);
    const fontB = this.fontBold;
    const refText = `Ref No: ${this.sanitizeText(fields.refNo || 'AFPL/...')}`;
    this.page.drawText(refText, {
      x: MARGIN_L,
      y: yHead - 10,
      size: 10,
      font: fontB,
      color: rgb(0, 0, 0),
    });

    const dateText = `Date: ${this.sanitizeText(fields.reportDate || '')}`;
    const dateW = fontB.widthOfTextAtSize(dateText, 10);
    this.page.drawText(dateText, {
      x: MARGIN_L + CONTENT_W - dateW,
      y: yHead - 10,
      size: 10,
      font: fontB,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 22;

    // 2. Centered "Valuation Report" with underline
    const valRepTitle = 'Valuation Report';
    const vrW = fontB.widthOfTextAtSize(valRepTitle, 13);
    const vrX = MARGIN_L + (CONTENT_W - vrW) / 2;
    const vrY = this.pdfY(this.cursorY);
    this.page.drawText(valRepTitle, {
      x: vrX,
      y: vrY - 13,
      size: 13,
      font: fontB,
      color: rgb(0, 0, 0),
    });
    this.page.drawLine({
      start: { x: vrX, y: vrY - 15.5 },
      end: { x: vrX + vrW, y: vrY - 15.5 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 24;

    // 3. Application Details Section Header (left-aligned)
    this.drawCleanSectionHeader('Application Details:', false, 0);

    // 4. Application Details Table (width = CONTENT_W = 487.28)
    const appCol1 = 120;
    const appCol2 = 120;
    const appCol3 = 115;
    const appCol4 = CONTENT_W - (appCol1 + appCol2 + appCol3); // ~132.28

    this.drawCleanRow([
      { text: 'File No. / LAN No. / Lead No.', width: appCol1, bold: true },
      { text: fields.fileNo || 'NA', width: appCol2 },
      { text: 'Date of Visit', width: appCol3, bold: true },
      { text: fields.dateOfVisit || 'NA', width: appCol4 },
    ]);
    this.drawCleanRow([
      { text: 'Name of Applicant & No.', width: appCol1, bold: true },
      { text: fields.applicantName || 'NA', width: appCol2 },
      { text: 'Contact Person Name & No.', width: appCol3, bold: true },
      { text: fields.contactPerson || 'NA', width: appCol4 },
    ]);
    this.drawCleanRow([
      { text: 'Loan Type (HL/LAP/BT)', width: appCol1, bold: true },
      { text: fields.loanType || 'LAP', width: appCol2 },
      { text: 'Person Met on Site & Contact number', width: appCol3, bold: true },
      { text: fields.personMetOnSite || fields.contactPerson || 'NA', width: appCol4 },
    ]);
    this.drawCleanRow([
      { text: 'Name of Property Owner as per Legal Document & No.', width: appCol1 + appCol2, bold: true },
      { text: fields.propertyOwner || 'NA', width: appCol3 + appCol4 },
    ]);
    this.drawCleanRow([
      { text: 'Documents Provided', width: appCol1, bold: true },
      { text: fields.documentsProvided || 'COPY OF Sale deed, ROR & Sketch map', width: appCol2 + appCol3 + appCol4 },
    ]);

    // 5. Location Details Section Header (centered)
    this.drawCleanSectionHeader('Location Details:', true, 10);

    // 6. Location Details Table (Page 1 part with vertical merged column "Address of Property")
    const locSideW = 125;
    const locSubW = CONTENT_W - locSideW; // ~362.28

    // Measure sub-rows for Address of Property block
    const addrText = fields.addressAsPerSite || 'NA';
    const linesAddr = this.wrapText(addrText, locSubW - 110 - this.padX * 2, 8.5);
    const subH1 = Math.max(22, linesAddr.length * 8.5 * LINE_HEIGHT + this.padY * 2);
    const subH2 = 18;
    const subH3 = 18;
    const totalBlock1H = subH1 + subH2 + subH3;

    let curY = this.pdfY(this.cursorY);
    // Left vertical cell: Address of Property
    this.drawCleanCell(MARGIN_L, curY, locSideW, totalBlock1H, 'Address of Property', { bold: true, align: 'center', vAlign: 'middle' });

    // Sub-row 1: Address as per Site
    this.drawCleanCell(MARGIN_L + locSideW, curY, 110, subH1, 'Address as per Site:', { bold: true });
    this.drawCleanCell(MARGIN_L + locSideW + 110, curY, locSubW - 110, subH1, addrText);

    // Sub-row 2: Locality & Landmark
    const sub2ColW = Math.floor((locSubW) / 4);
    const sub2Col4 = locSubW - sub2ColW * 3;
    this.drawCleanCell(MARGIN_L + locSideW, curY - subH1, sub2ColW, subH2, 'Locality (Urban, semi Urban, Rural)', { bold: true });
    this.drawCleanCell(MARGIN_L + locSideW + sub2ColW, curY - subH1, sub2ColW, subH2, fields.locality || 'RURAL');
    this.drawCleanCell(MARGIN_L + locSideW + sub2ColW * 2, curY - subH1, sub2ColW, subH2, 'Landmark Near By', { bold: true });
    this.drawCleanCell(MARGIN_L + locSideW + sub2ColW * 3, curY - subH1, sub2Col4, subH2, fields.landmarkNearBy || 'NA');

    // Sub-row 3: Distance from branch & Lat/Long
    this.drawCleanCell(MARGIN_L + locSideW, curY - subH1 - subH2, sub2ColW, subH3, 'Distance from Branch in km', { bold: true });
    this.drawCleanCell(MARGIN_L + locSideW + sub2ColW, curY - subH1 - subH2, sub2ColW, subH3, fields.distanceFromBranch || 'NA');
    this.drawCleanCell(MARGIN_L + locSideW + sub2ColW * 2, curY - subH1 - subH2, sub2ColW, subH3, 'LAT/LONG', { bold: true });
    this.drawCleanCell(MARGIN_L + locSideW + sub2ColW * 3, curY - subH1 - subH2, sub2Col4, subH3, fields.latLong || 'NA');

    this.cursorY += totalBlock1H;

    // Block 2: Legal Address of the Property (vertical merged column spanning 3 sub-rows)
    const legalAddrText = fields.addressAsPerLegal || fields.addressAsPerSite || 'NA';
    const linesLegal = this.wrapText(legalAddrText, locSubW - 110 - this.padX * 2, 8.5);
    const subLegalH1 = Math.max(22, linesLegal.length * 8.5 * LINE_HEIGHT + this.padY * 2);
    const subLegalH2 = 17;
    const subLegalH3 = 17;
    const totalBlock2H = subLegalH1 + subLegalH2 + subLegalH3;

    curY = this.pdfY(this.cursorY);
    // Left vertical cell: Legal Address of the Property: (As per Title Deed)
    this.drawCleanCell(MARGIN_L, curY, locSideW, totalBlock2H, 'Legal Address of the Property: (As per Title Deed)', { bold: true, align: 'center', vAlign: 'middle' });

    // Sub-row 2a: Address of Property as per Legal
    this.drawCleanCell(MARGIN_L + locSideW, curY, 110, subLegalH1, 'Address of Property as per Legal', { bold: true });
    this.drawCleanCell(MARGIN_L + locSideW + 110, curY, locSubW - 110, subLegalH1, legalAddrText);

    // Sub-row 2b: Floor No. of Property
    this.drawCleanCell(MARGIN_L + locSideW, curY - subLegalH1, 110, subLegalH2, 'Floor No. of Property', { bold: true });
    this.drawCleanCell(MARGIN_L + locSideW + 110, curY - subLegalH1, locSubW - 110, subLegalH2, fields.floorNo || 'NA');

    // Sub-row 2c: Property State
    this.drawCleanCell(MARGIN_L + locSideW, curY - subLegalH1 - subLegalH2, 110, subLegalH3, 'Property State', { bold: true });
    this.drawCleanCell(MARGIN_L + locSideW + 110, curY - subLegalH1 - subLegalH2, locSubW - 110, subLegalH3, fields.propertyState || 'Odisha');

    this.cursorY += totalBlock2H;

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 2: Location Details Continued + Schedule Table + NDMA Parameters
    // ══════════════════════════════════════════════════════════════════════
    this.addPage();

    // Location details continued table at top of Page 2
    const p2LabelW = 140;
    const p2ValW = CONTENT_W - p2LabelW;
    this.drawCleanRow([
      { text: 'Property City', width: p2LabelW, bold: true },
      { text: fields.propertyCity || 'NA', width: p2ValW },
    ]);
    this.drawCleanRow([
      { text: 'Property Pincode', width: p2LabelW, bold: true },
      { text: fields.propertyPincode || 'NA', width: p2ValW },
    ]);
    this.drawCleanRow([
      { text: 'Address Matching (Yes/No)', width: 130, bold: true },
      { text: fields.addressMatching || 'YES', width: 50 },
      { text: 'Jurisdiction / Local Municipal Body / Development Authority', width: 160, bold: true },
      { text: fields.jurisdiction || 'NA', width: CONTENT_W - 340 },
    ]);
    this.drawCleanRow([
      { text: 'Property Holding Type (Freehold/Leasehold)', width: 180, bold: true },
      { text: fields.holdingType || 'FREE HOLD', width: 70 },
      { text: 'Marketability (POOR/FAIR/GOOD)', width: 130, bold: true },
      { text: fields.marketability || 'FAIR', width: CONTENT_W - 380 },
    ]);
    this.drawCleanRow([
      { text: 'Property Occupied by (Self/Tenant/Vacant/Under Construction)', width: 210, bold: true },
      { text: fields.propertyOccupiedBy || 'Self', width: CONTENT_W - 210 },
    ]);
    this.drawCleanRow([
      { text: 'Type of the Property (Flat/Independent House/Commercial Building/Commercial Unit/Industrial/Vacant Plot (Agricultural/Homestead)', width: 210, bold: true },
      { text: fields.propertyTypeCategory || 'Commercial Building', width: CONTENT_W - 210 },
    ]);
    this.drawCleanRow([
      { text: 'Occupancy Status SORP/SOCP/Rented/Vacant (Please mention only one)', width: 210, bold: true },
      { text: fields.occupancyStatus || 'SORP', width: CONTENT_W - 210 },
    ]);

    // Schedule of Property (4-side comparison table)
    this.cursorY += 8;
    const schW1 = 115;
    const schW2 = 120;
    const schW3 = 125;
    const schW4 = CONTENT_W - (schW1 + schW2 + schW3);

    this.drawCleanRow([
      { text: 'Schedule of the Property', width: schW1, bold: true, align: 'center' },
      { text: 'As per legal documents', width: schW2, bold: true, align: 'center' },
      { text: 'As per site visit', width: schW3, bold: true, align: 'center' },
      { text: 'As Per Sketch Map', width: schW4, bold: true, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'North', width: schW1, bold: true },
      { text: fields.northLegal || 'Not mentioned', width: schW2 },
      { text: fields.northSite || 'NA', width: schW3 },
      { text: fields.northSketch || 'NA', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'East', width: schW1, bold: true },
      { text: fields.eastLegal || 'Not mentioned', width: schW2 },
      { text: fields.eastSite || 'NA', width: schW3 },
      { text: fields.eastSketch || 'NA', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'West', width: schW1, bold: true },
      { text: fields.westLegal || 'Not mentioned', width: schW2 },
      { text: fields.westSite || 'NA', width: schW3 },
      { text: fields.westSketch || 'NA', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'South', width: schW1, bold: true },
      { text: fields.southLegal || 'Not mentioned', width: schW2 },
      { text: fields.southSite || 'NA', width: schW3 },
      { text: fields.southSketch || 'NA', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'Boundaries Matching (Yes/No)', width: schW1, bold: true },
      { text: fields.boundariesMatching || 'Boundary is matching', width: schW2 },
      { text: 'Property Identified (Yes/No)', width: schW3, bold: true },
      { text: fields.propertyIdentified || 'Yes', width: schW4 },
    ]);
    this.drawCleanRow([
      { text: 'Approach Road Size (<5ft/5-10ft/10-15ft/>15ft)', width: schW1 + schW2, bold: true },
      { text: fields.approachRoadSize || '>20 FT', width: schW3 + schW4 },
    ]);

    // Section: NDMA Parameters (centered, bold, underlined)
    this.drawCleanSectionHeader('NDMA Parameters', true, 10);

    // NDMA Table (6 columns: Label, Value, Label, Value, Label, Value)
    const ndmaL1 = 85;
    const ndmaV1 = 70;
    const ndmaL2 = 85;
    const ndmaV2 = 70;
    const ndmaL3 = 95;
    const ndmaV3 = CONTENT_W - (ndmaL1 + ndmaV1 + ndmaL2 + ndmaV2 + ndmaL3); // ~82.28

    this.drawCleanRow([
      { text: 'Nature of Building/Wing', width: ndmaL1, bold: true },
      { text: fields.natureOfBuilding || 'RCC', width: ndmaV1 },
      { text: 'Plan Aspect Ratio', width: ndmaL2, bold: true },
      { text: fields.planAspectRatio || 'NA', width: ndmaV2 },
      { text: 'Structure Type (Load Bearing, RCC, Composite Structure, Others)', width: ndmaL3, bold: true },
      { text: fields.structureType || 'RCC', width: ndmaV3 },
    ]);
    this.drawCleanRow([
      { text: 'Projected Parts Available', width: ndmaL1, bold: true },
      { text: fields.projectedParts || 'NA', width: ndmaV1 },
      { text: 'Type of Masonry', width: ndmaL2, bold: true },
      { text: fields.masonryType || 'BRICK', width: ndmaV2 },
      { text: 'Expansion Joints Available', width: ndmaL3, bold: true },
      { text: fields.expansionJoints || 'No', width: ndmaV3 },
    ]);
    this.drawCleanRow([
      { text: 'Roof Type', width: ndmaL1, bold: true },
      { text: fields.roofType || 'RCC', width: ndmaV1 },
      { text: 'Steel Grade', width: ndmaL2, bold: true },
      { text: fields.steelGrade || 'FE 450', width: ndmaV2 },
      { text: 'Mortar Type', width: ndmaL3, bold: true },
      { text: fields.mortarType || 'NA', width: ndmaV3 },
    ]);
    this.drawCleanRow([
      { text: 'Concrete Grade', width: ndmaL1, bold: true },
      { text: fields.concreteGrade || 'NA', width: ndmaV1 },
      { text: 'Environment Exposure Condition', width: ndmaL2, bold: true },
      { text: fields.environmentExposure || 'Mild', width: ndmaV2 },
      { text: 'Footing Type', width: ndmaL3, bold: true },
      { text: fields.footingType || 'NA', width: ndmaV3 },
    ]);
    this.drawCleanRow([
      { text: 'Seismic Zone', width: ndmaL1, bold: true },
      { text: fields.seismicZone || 'II&III', width: ndmaV1 },
      { text: 'Soil liquefiable', width: ndmaL2, bold: true },
      { text: fields.soilLiquefiable || 'No', width: ndmaV2 },
      { text: 'Coastal Regulatory Zone (Yes/No)', width: ndmaL3, bold: true },
      { text: fields.coastalRegulatoryZone || 'NO', width: ndmaV3 },
    ]);
    this.drawCleanRow([
      { text: 'Soil Slope Vulnerable to Landslide', width: ndmaL1, bold: true },
      { text: fields.soilSlopeVulnerable || 'NA', width: ndmaV1 },
      { text: 'Flood Prone Area', width: ndmaL2, bold: true },
      { text: fields.floodProneArea || 'No', width: ndmaV2 },
      { text: 'Ground Slope More than 20%', width: ndmaL3, bold: true },
      { text: fields.groundSlopeMoreThan20 || 'No', width: ndmaV3 },
    ]);

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 3: Fire Exit + Approved Plan Details + Technical Details + Area Tables
    // ══════════════════════════════════════════════════════════════════════
    this.addPage();

    // Top row on Page 3: Fire Exit
    const feCol1 = CONTENT_W - 130;
    this.drawCleanRow([
      { text: '', width: feCol1 },
      { text: 'Fire Exit', width: 70, bold: true },
      { text: fields.fireExit || 'NA', width: 60 },
    ], 16);

    this.cursorY += 8;

    // Approved Plan Details if self-construction case (Left merged column spanning 6 subrows)
    const planSideW = 135;
    const planRightW = CONTENT_W - planSideW;
    const planLabelW = 200;
    const planValW = planRightW - planLabelW;
    const subH = 17;
    const totalPlanH = subH * 6;

    curY = this.pdfY(this.cursorY);
    // Left vertical cell
    this.drawCleanCell(MARGIN_L, curY, planSideW, totalPlanH, 'Approved Plan Details if self-construction case', { bold: true, align: 'center', vAlign: 'middle' });

    // 6 Subrows on the right
    const planItems = [
      { l: 'Sanctioned Plan Provided (Yes/No)', v: fields.sanctionedPlanProvided || 'NO' },
      { l: 'Layout Plan Details: Sanctioned No./Permit No.', v: fields.layoutPlanNo || 'NA' },
      { l: 'Construction Plan Details: Sanctioned No/Permit No.', v: fields.constructionPlanNo || 'NA' },
      { l: 'Date of Sanction', v: fields.dateOfSanction || 'NA' },
      { l: 'Plan Validity', v: fields.planValidity || 'NA' },
      { l: 'Approving Authority', v: fields.approvingAuthority || 'NA' },
    ];

    for (let i = 0; i < planItems.length; i++) {
      const rowTop = curY - (i * subH);
      this.drawCleanCell(MARGIN_L + planSideW, rowTop, planLabelW, subH, planItems[i].l, { bold: true });
      this.drawCleanCell(MARGIN_L + planSideW + planLabelW, rowTop, planValW, subH, planItems[i].v);
    }
    this.cursorY += totalPlanH;

    // Full width rows below
    this.drawCleanRow([
      { text: 'Approved Usages (Residential/Industrial/Commercial/Mixed Usages)', width: 320, bold: true },
      { text: fields.approvedUsages || 'NA', width: CONTENT_W - 320 },
    ]);
    this.drawCleanRow([
      { text: 'Number of Floor in Building', width: 320, bold: true },
      { text: fields.numberOfFloorsInBuilding || 'NA', width: CONTENT_W - 320 },
    ]);

    // Technical Details Section Header (centered, bold, underlined)
    this.drawCleanSectionHeader('Technical Details:', true, 10);

    this.drawCleanRow([
      { text: 'Current Occupant of Property (Owner/Tenant/Vacant)', width: 175, bold: true },
      { text: fields.currentOccupant || 'Owner', width: 75 },
      { text: 'Separate Independent Access (Yes/No)', width: 155, bold: true },
      { text: fields.separateAccess || 'NA', width: CONTENT_W - 405 },
    ]);
    this.drawCleanRow([
      { text: 'Accommodation details: Floor wise and Occupancy', width: 175, bold: true },
      { text: fields.accommodationDetails || 'G+1', width: CONTENT_W - 175 },
    ]);

    // Plot Area Details Table
    this.cursorY += 6;
    const plotW1 = 120;
    const plotW2 = 120;
    const plotW3 = 120;
    const plotW4 = CONTENT_W - 360;

    this.drawCleanRow([
      { text: 'Plot Area Details', width: plotW1, bold: true, align: 'center' },
      { text: 'As Per Documents', width: plotW2, bold: true, align: 'center' },
      { text: 'As Per Site Visit', width: plotW3, bold: true, align: 'center' },
      { text: 'As Per Plan/Sketch map', width: plotW4, bold: true, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'East', width: plotW1, bold: true },
      { text: fields.eastDocs || 'NA', width: plotW2 },
      { text: fields.eastSiteMeas || 'NA', width: plotW3 },
      { text: fields.eastPlan || 'NA', width: plotW4 },
    ]);
    this.drawCleanRow([
      { text: 'West', width: plotW1, bold: true },
      { text: fields.westDocs || 'NA', width: plotW2 },
      { text: fields.westSiteMeas || 'NA', width: plotW3 },
      { text: fields.westPlan || 'NA', width: plotW4 },
    ]);
    this.drawCleanRow([
      { text: 'North', width: plotW1, bold: true },
      { text: fields.northDocs || 'NA', width: plotW2 },
      { text: fields.northSiteMeas || 'NA', width: plotW3 },
      { text: fields.northPlan || 'NA', width: plotW4 },
    ]);
    this.drawCleanRow([
      { text: 'South', width: plotW1, bold: true },
      { text: fields.southDocs || 'NA', width: plotW2 },
      { text: fields.southSiteMeas || 'NA', width: plotW3 },
      { text: fields.southPlan || 'NA', width: plotW4 },
    ]);
    this.drawCleanRow([
      { text: 'Land Area (In Sqft.)', width: plotW1, bold: true },
      { text: fields.landAreaDocs || fields.landAreaSqft || 'NA', width: plotW2 },
      { text: fields.landAreaSite || fields.landAreaSqft || 'NA', width: plotW3 },
      { text: fields.landAreaPlan || 'NA', width: plotW4 },
    ]);

    // BAU Area Details Table
    this.cursorY += 6;
    const bauW1 = 80;
    const bauW2 = 50;
    const bauW3 = 50;
    const bauW4 = 50;
    const bauW5 = 75;
    const bauW6 = CONTENT_W - (bauW1 + bauW2 + bauW3 + bauW4 + bauW5); // ~182.28

    this.drawCleanRow([
      { text: 'BAU Area Details', width: bauW1, bold: true, align: 'center' },
      { text: 'No. of Rooms', width: bauW2, bold: true, align: 'center' },
      { text: 'No. of Kitchens', width: bauW3, bold: true, align: 'center' },
      { text: 'No. of Bathroom', width: bauW4, bold: true, align: 'center' },
      { text: 'Sanctioned Usages', width: bauW5, bold: true, align: 'center' },
      { text: 'Actual Usage (Residential/Industrial/Commercial/Mixed Usage)', width: bauW6, bold: true, align: 'center' },
    ]);

    const floorsData = fields.bauFloors && fields.bauFloors.length > 0 ? fields.bauFloors : [
      { floor: 'Basement/Stilt Floor', rooms: 'NA', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
      { floor: 'GROUND FLOOR', rooms: '2', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
      { floor: 'First Floor', rooms: 'NA', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
    ];

    for (const fl of floorsData) {
      this.drawCleanRow([
        { text: fl.floor, width: bauW1, bold: true },
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
    this.addPage();

    // 1. FSI Details Table
    const fsiW1 = 55;
    const fsiW2 = 75;
    const fsiW3 = 75;
    const fsiW4 = 55;
    const fsiW5 = 75;
    const fsiW6 = 80;
    const fsiW7 = CONTENT_W - (fsiW1 + fsiW2 + fsiW3 + fsiW4 + fsiW5 + fsiW6); // ~72.28

    this.drawCleanRow([
      { text: 'Items', width: fsiW1, bold: true, align: 'center' },
      { text: 'Permissible area as per plan (In Sq. Ft)', width: fsiW2, bold: true, align: 'center' },
      { text: 'Land Component (In Sq. Ft)', width: fsiW3, bold: true, align: 'center' },
      { text: 'Permissible FSI', width: fsiW4, bold: true, align: 'center' },
      { text: 'Permissible construction as per FSI (In Sq. Ft)', width: fsiW5, bold: true, align: 'center' },
      { text: 'Actual construction (BUA) (In Sq. Ft)', width: fsiW6, bold: true, align: 'center' },
      { text: 'Consider construction (BUA) (In Sq. Ft)', width: fsiW7, bold: true, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: '', width: fsiW1 },
      { text: fields.permissibleAreaPlan || 'NA', width: fsiW2, align: 'center' },
      { text: fields.landComponent || fields.landAreaSqft || 'NA', width: fsiW3, align: 'center' },
      { text: fields.permissibleFsi || 'NA', width: fsiW4, align: 'center' },
      { text: fields.permissibleConstructionFsi || 'NA', width: fsiW5, align: 'center' },
      { text: fields.actualConstructionBua || 'NA', width: fsiW6, align: 'center' },
      { text: fields.considerConstructionBua || 'NA', width: fsiW7, align: 'center' },
    ]);

    // Status, Risk of Demolition, Age
    this.drawCleanRow([
      { text: 'Risk of Demolition (High/Medium/Low)', width: 280, bold: true },
      { text: fields.riskOfDemolition || 'LOW', width: CONTENT_W - 280 },
    ]);
    this.drawCleanRow([
      { text: 'Status of the Property (Plot/Under Construction/ Completed/ Construction on Hold)', width: 170, bold: true },
      { text: 'COMPLETED (Y/N)', width: 100, bold: true, align: 'center' },
      { text: '100% Completed', width: 105, bold: true, align: 'center' },
      { text: '100% Recommended', width: CONTENT_W - 375, bold: true, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: '', width: 170 },
      { text: fields.propertyStatus || 'NA', width: 100, align: 'center' },
      { text: fields.completedPct || 'NA', width: 105, align: 'center' },
      { text: fields.recommendedPct || 'NA', width: CONTENT_W - 375, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'Current Age of Property', width: 145, bold: true },
      { text: fields.currentAge || 'NA', width: 95 },
      { text: 'Residual Age', width: 110, bold: true },
      { text: fields.residualAge || 'NA', width: CONTENT_W - 350 },
    ]);

    // Valuation Table Header (Items | Area Details in Sq. Ft. | Rate per Sq. Ft. | Total Values in Rupees)
    this.cursorY += 8;
    const valW1 = 160;
    const valW2 = 110;
    const valW3 = 100;
    const valW4 = CONTENT_W - (valW1 + valW2 + valW3); // ~117.28

    this.drawCleanRow([
      { text: 'Items', width: valW1, bold: true, align: 'center' },
      { text: 'Area Details in Sq. Ft.', width: valW2, bold: true, align: 'center' },
      { text: 'Rate per Sq. Ft.', width: valW3, bold: true, align: 'center' },
      { text: 'Total Values in Rupees', width: valW4, bold: true, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'Land Value', width: valW1, bold: true },
      { text: fields.landAreaSqft ? `${fields.landAreaSqft} SQFT` : 'NA', width: valW2, align: 'center' },
      { text: fields.landRateSqft ? `Rs.${fields.landRateSqft}/-` : 'NA', width: valW3, align: 'center' },
      { text: fields.landTotalValue ? `Rs.${fields.landTotalValue}/-` : 'NA', width: valW4, align: 'center', bold: true },
    ]);
    this.drawCleanRow([
      { text: 'BUA Value RCC GF', width: valW1, bold: true },
      { text: fields.buaAreaSqft ? `${fields.buaAreaSqft} SQFT` : 'NA', width: valW2, align: 'center' },
      { text: fields.buaRateSqft ? `Rs.${fields.buaRateSqft}/-` : 'Rs.0/-', width: valW3, align: 'center' },
      { text: fields.buaTotalValue ? `Rs.${fields.buaTotalValue}/-` : 'Rs.0/-', width: valW4, align: 'center', bold: true },
    ]);
    this.drawCleanRow([
      { text: 'Market Value After Completion (In Rs.)', width: valW1 + valW2 + valW3, bold: true },
      { text: fields.marketValue ? `Rs.${fields.marketValue}/-` : 'NA', width: valW4, align: 'center', bold: true },
    ]);
    this.drawCleanRow([
      { text: `Distressed/Force Value (${fields.distressedPct || '80'}%) (In Rs.)`, width: valW1 + valW2 + valW3, bold: true },
      { text: fields.distressedValue ? `Rs.${fields.distressedValue}/-` : 'NA', width: valW4, align: 'center', bold: true },
    ]);
    this.drawCleanRow([
      { text: 'Government/Circle Rate Value', width: valW1 + valW2 + valW3, bold: true },
      { text: fields.govtRate ? `Rs.${fields.govtRate}/- PER SQFT` : 'NA', width: valW4, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'In Municipal/Development Authority Demolition list (Yes/No)', width: valW1 + valW2 + valW3, bold: true },
      { text: fields.inDemolitionList || 'NO', width: valW4, align: 'center' },
    ]);
    this.drawCleanRow([
      { text: 'Is Property in Negative Area (Yes/No)', width: valW1 + valW2 + valW3, bold: true },
      { text: fields.inNegativeArea || 'NO', width: valW4, align: 'center' },
    ]);

    // Remarks Box (Left cell: "Remarks", Right cell: detailed descriptive text)
    this.cursorY += 8;
    const remSideW = 120;
    const remContentW = CONTENT_W - remSideW;
    const remarksText = fields.remarks || 'Subject property has been physically inspected. Boundary details match the title deed/ROR. Clear access available.';
    const remLines = this.wrapText(remarksText, remContentW - this.padX * 2, 8.5);
    const remH = Math.max(90, remLines.length * 8.5 * LINE_HEIGHT + this.padY * 2 + 4);

    curY = this.pdfY(this.cursorY);
    this.drawCleanCell(MARGIN_L, curY, remSideW, remH, 'Remarks', { bold: true, align: 'center', vAlign: 'middle' });
    this.drawCleanCell(MARGIN_L + remSideW, curY, remContentW, remH, remarksText, { vAlign: 'top' });
    this.cursorY += remH;

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 5: Additional Checks + Statutory Declaration + Signatures
    // ══════════════════════════════════════════════════════════════════════
    this.addPage();

    // Header: Additional checks of properties: (centered, bold, underlined)
    this.drawCleanSectionHeader('Additional checks of properties:', true, 0);

    const chkCol1 = 250;
    const chkCol2 = CONTENT_W - chkCol1;

    this.drawCleanRow([
      { text: 'Approach Road to the property (Single lane/Double lane/Four lane)', width: chkCol1, bold: true },
      { text: fields.approachRoadType || 'SINGLE LANE', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Development of surrounding areas to property {Developed (Over 80% units occupied) / Underdeveloped (Less than 80% units occupied)}', width: chkCol1, bold: true },
      { text: fields.developmentSurroundingArea || 'SURROUNDING 30%-40% DEVELOPING', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Distance from city centre in Kms', width: chkCol1, bold: true },
      { text: fields.distanceFromCityCentre || '50 KMS', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Distance from corporation limits in Kms/Bus stop in case where there is no Municipal body', width: chkCol1, bold: true },
      { text: fields.distanceFromCorporationLimits || '5KMS', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Electricity (Available/Not available)', width: chkCol1, bold: true },
      { text: fields.electricity || 'YES', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Electricity Distributor (Govt./Semi-Govt./Private)', width: chkCol1, bold: true },
      { text: fields.electricityDistributor || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Water supply (Available/Not Available)', width: chkCol1, bold: true },
      { text: fields.waterSupply || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Water Distributor (Govt./Self/Boring water)', width: chkCol1, bold: true },
      { text: fields.waterDistributor || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Sewer provision (Yes/No)', width: chkCol1, bold: true },
      { text: fields.sewerProvision || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Sewer line connected to main sewer (Yes/No)', width: chkCol1, bold: true },
      { text: fields.sewerLineConnected || 'NA', width: chkCol2 },
    ]);
    this.drawCleanRow([
      { text: 'Any demolition threat in future development/expansion (Yes/No)', width: chkCol1, bold: true },
      { text: fields.demolitionThreat || 'NA', width: chkCol2 },
    ]);

    // Statutory Declaration Row (Left cell: Declaration, Right cell: 5 bullet clauses)
    const engineerName = fields.declarationSiteEngineer || (fields.assignedEngineers && fields.assignedEngineers[0]?.name) || 'Mr. Engineer';
    const inspDate = fields.declarationInspectionDate || fields.dateOfVisit || fields.reportDate || '12/07/2026';

    const declBullets = [
      'The final valuation has been concluded basis Land & Building valuation approach and rates are cross verified with the rates Prevalent in the nearby localities.',
      'We have no direct/indirect interest in the property valued.',
      'The information furnished in the report is true and correct to the best of my knowledge.',
      `${engineerName} has visited the property on dated ${inspDate} & provide the data as collected during site inspection.`,
      'I have not been convicted of any offence and sentenced to a term of Imprisonment.',
    ];

    const declFormatted = declBullets.map(b => `\u2022  ${b}`).join('\n\n');
    const declLines = this.wrapText(declFormatted, chkCol2 - this.padX * 2, 8.5);
    const declH = Math.max(105, declLines.length * 8.5 * LINE_HEIGHT + this.padY * 2 + 10);

    curY = this.pdfY(this.cursorY);
    this.drawCleanCell(MARGIN_L, curY, chkCol1, declH, 'Declaration (I hereby declare that)', { bold: true, align: 'center', vAlign: 'middle' });
    this.drawCleanCell(MARGIN_L + chkCol1, curY, chkCol2, declH, declFormatted, { vAlign: 'middle' });
    this.cursorY += declH + 16;

    // Date & Place
    const yFooter = this.pdfY(this.cursorY);
    this.page.drawText(`Date: ${this.sanitizeText(fields.reportDate || fields.dateOfVisit || '')}`, {
      x: MARGIN_L,
      y: yFooter,
      size: 10,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(`Place: ${this.sanitizeText(fields.place || 'Bhubaneswar')}`, {
      x: MARGIN_L,
      y: yFooter - 16,
      size: 10,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    this.cursorY += 40;

    // Official Appraiser Signature Block
    const engineers = fields.assignedEngineers && fields.assignedEngineers.length > 0 ? fields.assignedEngineers : [
      { name: 'Er. S. Mohanty', designation: 'Chartered Engineer & Approved Valuer', role: 'Chief Valuer' }
    ];

    const sigY = this.pdfY(this.cursorY);
    const sigBoxW = 200;
    const sigStartX = MARGIN_L + CONTENT_W - sigBoxW;

    this.page.drawText('For S MOHANTY ASSOCIATES', {
      x: sigStartX,
      y: sigY,
      size: 9.5,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    let currentSigY = sigY - 36;
    for (const eng of engineers) {
      this.page.drawText(eng.name, {
        x: sigStartX,
        y: currentSigY,
        size: 9.5,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      currentSigY -= 12;
      if (eng.designation) {
        this.page.drawText(eng.designation, {
          x: sigStartX,
          y: currentSigY,
          size: 8,
          font: this.fontRegular,
          color: rgb(0, 0, 0),
        });
        currentSigY -= 11;
      }
    }

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
      this.drawCleanSectionHeader('PHOTOGRAPHS OF THE PROPERTY', true, 0);
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
      this.renderAnnexureSheets(fields.annexures);
    }

    return await this.doc.save();
  }
}

export const PDFAnnapurnaMicroRenderer = PDFAnnapurnaMicroFinanceRenderer;
export default PDFAnnapurnaMicroFinanceRenderer;
