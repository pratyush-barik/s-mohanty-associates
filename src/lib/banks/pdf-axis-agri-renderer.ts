/**
 * pdf-axis-agri-renderer.ts — Dedicated PDF renderer and types for Axis Bank (AGRI).
 *
 * Implements the statutory VALUATION REPORT FORMAT (NON-AGRI) handled under Axis Agri:
 * - Page 1: Header banner, Technical Initiation table, Property Details, Type of Property
 * - Page 2: Boundaries (Verification vs Document), Locality, Infrastructure, Occupancy, Tenancy, Leasehold, RERA
 * - Page 3: Statutory Approvals (8-box individual date cells), Construction Details & Floor Plinth Area Table
 * - Page 4: Building Condition, Life, Land Rate Adopted, Floor-wise Cost Breakdown Table (8 cols), Basic Value Building
 * - Page 5: Value of Property Summary Table (5x5 matrix), Realizable/Distress/Market values, Remarks with NB notice
 * - Page 6: Top bank data notice, Undertaking bullet points, Authorized Signatory, Annexure "A"
 * - Page 7: Property Photographs (2x2 photo grid with captions)
 * - Page 8: Locational Diagram with GPS Co-ordinates & Benchmark Valuation screenshot
 * - Page 9: Cadastral Map (Bhulekh screenshot)
 * - Page 10: Valuation Report Checklist (12 items) & Signature Block ("Er. Satyajit Mohanty (B.E,Civil) FIV")
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

export interface AxisAgriFloorItem {
  floorName: string; // e.g. 'Basement', 'Stilt', 'Ground Floor', 'First Floor', 'Second Floor'
  plinthArea: string; // sq.ft.
  usage: string; // e.g. 'Residential', 'Commercial', 'Parking', 'Storage'
  roofHeight?: string; // e.g. "10'-6\""
  ageYears?: string; // e.g. "8Yrs"
  replacementRate?: string; // e.g. "1500.00"
  estimatedCost?: string; // e.g. "787500.00"
  depreciationAmount?: string; // e.g. "63000.00"
  netValue?: string; // e.g. "724500.00"
}

export interface AxisAgriReportFields {
  clientType?: string;
  organisationTemplate?: string;
  organisationSubTemplate?: string;
  bankName?: string;
  [key: string]: any;

  // Page 1: Header & Technical Initiation
  refNo?: string; // e.g. SMA/08/2026/07
  reportDate?: string; // DD/MM/YYYY
  reportTitle?: string; // VALUATION REPORT FORMAT (NON-AGRI)
  dateOfVisit?: string; // DD/MM/YYYY
  reportInitiatedByArea?: string; // e.g. Purusottampur, Ganjam
  nameOfArea?: string; // e.g. Purusottampur, Ganjam
  ownerNameAndAddress?: string; // e.g. Mr. Babula Behera S/O...
  borrowerNameAndAddress?: string; // e.g. M/S. MAA TARINI ENTERPRISERS
  proposalNo?: string; // e.g. Not Available
  representativeNameMobile?: string; // e.g. Local People

  // Page 1: Details of Property Being Valued
  locationOfProperty?: string; // 'Rural' | 'Semi Urban' | 'Urban'
  documentsProvided?: string[]; // ['Copy of Sale Deed', 'Bhu-Naksha', 'Approved Plan', 'Commencement Certificate', 'Occupancy Certificate', 'ROR', 'Previous Valuation Report']
  plotKhataDetails?: string; // Khata No, Plot No, Kissam, Mouza, Ps, Ts, Dist
  roadFacilityAtSite?: string; // e.g. 20-ft wide Road
  colonyNagarSector?: string; // e.g. Purusottampur, Ganjam
  localityLandmark?: string; // e.g. The property is situated nearer to Purusottampur Achhuli chaka
  villageTownCityMarket?: string; // e.g. Village
  district?: string; // e.g. Ganjam
  state?: string; // e.g. Odisha
  pincode?: string; // e.g. 761018
  distanceFromAreaOffice?: string; // e.g. 2 Kms away from Purusottampur area office
  latitude?: string; // e.g. 19.511361
  longitude?: string; // e.g. 84.907833
  coordinates?: string; // e.g. 19°30'40.9"N 84°54'28.2"E

  // Page 1 & 2: Type of Property & Site Topography
  typeOfPropertyPlot?: string; // 'NA' | 'Residential' | 'Commercial' | 'Industrial'
  levelOfLand?: string; // e.g. Existing Road Level
  situatedInMunicipalLimit?: string; // 'Yes' | 'No'
  municipalLimitDetails?: string; // e.g. (Within Achhuli Gram Panchayat area limit)
  constructionObservedOnPlot?: string; // 'Yes' | 'No'
  residentialPropertyType?: string; // 'Residential'
  residentialPropertySubtype?: string; // 'Independent house' | 'Bungalow' | 'Row House' | 'Flat' | 'Commercial'
  civicAmenities?: string; // 'Available within the radius of 2-3 Kms' | 'Not Available'
  commercialPropertyType?: string; // 'Commercial'
  commercialPropertySubtype?: string; // 'Independent house' | 'Row House' | 'Unit in a mall' | 'Godown' | 'Industrial' | 'Shop'
  availabilityLocalTransport?: string[]; // ['Metro', 'Local Train', 'Bus', 'Personal Transport']
  distanceFromRailwayStation?: string; // e.g. 27 Km from Khallikote
  busStopTaxiStand?: string; // e.g. Within 2-3 Kms
  independentApproachRoad?: string; // 'Yes' | 'No'
  accommodateFireExtinguisher?: string; // 'Yes' | 'No'
  landLockedArea?: string; // 'Yes' | 'No'
  corneredOrIntermittent?: string; // 'Intermittent plot'
  corneredOrIntermittentVal?: string; // 'Yes' | 'No'

  // Page 2: Boundaries (As per Verification vs As per Document)
  boundaryEastVerification?: string;
  boundaryEastDocument?: string;
  boundaryWestVerification?: string;
  boundaryWestDocument?: string;
  boundaryNorthVerification?: string;
  boundaryNorthDocument?: string;
  boundarySouthVerification?: string;
  boundarySouthDocument?: string;

  // Page 2: Locality, Infrastructure & Usage
  classOfLocality?: string; // 'Posh' | 'Higher Middle Class' | 'Middle class' | 'Lower middle Class' | 'Poor'
  qualityOfInfrastructure?: string; // 'Excellent' | 'Good' | 'Average' | 'Poor'
  ownershipStatus?: string; // 'Free Hold' | 'Reg. Lease' | 'Govt. Authority'
  approvedUsage?: string[]; // ['Industrial', 'commercial', 'Residential', 'Mix']
  actualUsage?: string[]; // ['Industrial', 'Commercial', 'Residential', 'Mix']
  restrictiveCovenants?: string; // 'Not Applicable'
  typeOfStructure?: string; // 'Load Bearing/RCC/GCI/Aluform shuttering'
  noOfFloors?: string; // 'G+2 Storied building'
  occupancyDetails?: string; // 'Self-Occupied' | 'Rented' | 'Vacant'
  tenantName?: string; // 'NA'
  yearsInTenancy?: string; // 'NA'
  resistanceForValuation?: string; // 'No'
  resistanceFromOccupants?: string; // 'No'
  basicAmenities?: string[]; // ['Electricity', 'Water', 'Drainage connection']
  developmentSurroundingArea?: string; // 'Underdeveloped' | 'Developing' | 'Developed'

  // Page 2: Leasehold Details
  isLeasehold?: string; // 'The Property is Free Hold Land'
  lessorName?: string; // 'NA'
  natureOfLease?: string; // 'NA'
  totalPeriodOfLease?: string; // 'NA'
  leaseholdOccupantsResistance?: string; // 'No'
  leaseholdBasicAmenities?: string[];
  leaseholdDevelopment?: string;

  // Page 2 & 3: Statutory Approvals
  reraRegNo?: string; // 'Not Applicable.'
  occupancyCertificate?: string; // 'Not Available'
  layoutApprovalNo?: string; // 'Not Mentioned'
  layoutApprovalDate?: string; // DDMMYYYY (8 chars)
  layoutExpiryDate?: string; // DDMMYYYY (8 chars)
  buildingPlanApprovalNo?: string; // 'Not Available'
  buildingPlanApprovalDate?: string; // DDMMYYYY (8 chars)
  buildingPlanExpiryDate?: string; // DDMMYYYY (8 chars)

  // Page 3: Construction & Floor-Wise Breakdown
  areaOfPlotRor?: string; // Total Area = Ac.0.013 Dec i.e. 566.00 Sft
  areaOfPlotDoc?: string; // Total Area = Ac.0.013 Dec i.e. 566.00 Sft
  approvedBUA?: string; // 'Not Available'
  actualBUA?: string; // RCC GF: 525.00 Sft RCC FF: 525.00 Sft RCC SF: 204.00 Sft Total BUA: 1254.00 Sft
  demarcationAtSite?: string; // 'Yes' | 'No'
  basementArea?: string;
  stiltArea?: string;
  floors?: AxisAgriFloorItem[];
  totalBUA?: string; // e.g. 1254.00 Sft
  totalCarpetArea?: string; // e.g. 1090.00 Sft (Approx.)
  totalSaleableArea?: string; // e.g. 566.00 Sft (Land) & 1254.00 Sft (Building)
  amenitiesDetails?: string; // 'Nil'
  farPermissibleUtilized?: string; // 'FAR:2.21'
  constructionAsPerApprovedPlan?: string; // 'Plan is not Available'
  extraConstructionDetails?: string; // 'Not Applicable'
  extraConstructionPercentage?: string; // 'Not Applicable'
  extraConstructionCompoundable?: string; // 'Not Applicable'
  qualityOfConstruction?: string; // 'Good' | 'Average' | 'Poor'
  maintenanceOfProperty?: string; // 'Good' | 'Average' | 'Poor'

  // Page 4: Building Condition, Life & Land Rate
  conditionOfBuilding?: string; // 'Good'
  currentLifeStructure?: string; // '8 Years'
  projectedLifeStructure?: string; // '52 Years'
  landRevenueTaxesPaid?: string; // 'Recent rent receipt is not provided'
  municipalTaxesPaid?: string; // 'Not Applicable'
  govtBenchmarkRateAcre?: string; // '86,55,000'
  govtBenchmarkRateSft?: string; // '199'
  totalLandAreaDec?: string; // '0.013'
  totalLandAreaAcre?: string; // '0.013'
  totalLandAreaSft?: string; // '566.00'
  totalGovtValueLand?: string; // '1,12,634.00'
  prevailingMarketRateMin?: string; // '500'
  prevailingMarketRateMax?: string; // '600'
  adoptedMarketRateSft?: string; // '550'
  totalMarketValueLand?: string; // '5,98,950.00'

  // Page 4: Building Basic Valuation
  totalBasicValueBuilding?: string; // '21,96,285.00'
  totalBasicValueBuildingSay?: string; // '21,96,000.00'
  totalBasicValueBuildingWords?: string; // 'RUPEES TWENTY ONE LAKHS NINETY SIX THOUSANDS ONLY'

  // Page 5: Value of Property Summary Table
  govtGuideLand?: string;
  govtGuideBuilding?: string;
  govtGuideAmenities?: string;
  govtGuideTotal?: string;
  marketValueLand?: string;
  marketValueBuilding?: string;
  marketValueAmenities?: string;
  marketValueTotal?: string;
  realisableValueLand?: string;
  realisableValueBuilding?: string;
  realisableValueAmenities?: string;
  realisableValueTotal?: string;
  realisableValuePct?: string;
  distressValueLand?: string;
  distressValueBuilding?: string;
  distressValueAmenities?: string;
  distressValueTotal?: string;
  distressValuePct?: string;
  insurableValueLand?: string;
  insurableValueBuilding?: string;
  insurableValueAmenities?: string;
  insurableValueTotal?: string;

  // Page 5 & 6: Narratives & Remarks
  realizableEstimationText?: string;
  marketValueSay?: string;
  marketValueWords?: string;
  realizableValueSay?: string;
  realizableValueWords?: string;
  distressValueSay?: string;
  distressValueWords?: string;
  basisOfValuation?: string;
  opinionOfMarketValue?: string;
  remarksText?: string;
  undertakingText?: string;
  annexureAMethodOfValuation?: string;
  annexureABasisBuildingValue?: string;
  annexureARegardingLand?: string;
  annexureARegardingBuilding?: string;
  annexureABasisLandRate?: string;

  // Signatory & Valuer
  authorizedSignatory?: string;
  visitingEngineer?: string;
  dateOfReportSubmission?: string;

  // Page 10: Check List & Images
  checklistResponses?: Record<string, string>;
  propertyPhotos?: any[];
  propertyImages?: string[];
  propertyImageNames?: string[];
  locationMapImages?: string[];
  cadastralMapImages?: string[];
  benchmarkImages?: string[];
  sketchMapImages?: string[];
}

export class PDFAxisAgriRenderer extends PDFBankRenderer {
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
    } = {}
  ): void {
    const fontSize = options.fontSize || (options.isHeader && w >= CONTENT_W * 0.9 ? FONT_SIZE_HEADER : FONT_SIZE);
    const font = options.italic
      ? this.fontItalic
      : options.bold || options.isHeader || options.isLabel || options.highlight
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

    const cleanText = this.sanitizeText(text);
    if (!cleanText) return;

    const padX = 4;
    const padY = 3;
    const maxTextW = Math.max(10, w - padX * 2);
    const lines = this.wrapText(
      cleanText,
      maxTextW,
      fontSize,
      !!(options.bold || options.isHeader || options.isLabel || options.highlight)
    );
    const lineH = fontSize * LINE_HEIGHT;
    const totalTextH = lines.length * lineH;

    let startY: number;
    if (vAlign === 'middle' && h >= totalTextH + padY * 2) {
      startY = y - h / 2 + totalTextH / 2 - fontSize * 0.82;
    } else {
      startY = y - padY - fontSize * 0.82;
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
      const fs = col.fontSize || (col.isHeader && col.width >= CONTENT_W * 0.9 ? FONT_SIZE_HEADER : FONT_SIZE);
      const isBold = !!(col.bold || col.isHeader || col.isLabel || col.highlight);
      const lines = this.wrapText(this.sanitizeText(col.text), Math.max(10, col.width - 8), fs, isBold);
      if (lines.length > maxLines) maxLines = lines.length;
    }

    const maxFs = Math.max(...cols.map(c => c.fontSize || (c.isHeader && c.width >= CONTENT_W * 0.9 ? FONT_SIZE_HEADER : FONT_SIZE)));
    const actualMinH = cols.some(c => c.isHeader && c.width >= CONTENT_W * 0.9) ? Math.max(minH, 22) : minH;
    const rowH = Math.max(actualMinH, maxLines * maxFs * LINE_HEIGHT + rowPad);
    this.checkPageBreak(rowH);

    const y = this.pdfY(this.cursorY);
    let curX = MARGIN_L;

    for (const col of cols) {
      const colFs = col.fontSize || (col.isHeader && col.width >= CONTENT_W * 0.9 ? FONT_SIZE_HEADER : FONT_SIZE);
      this.drawCell(curX, y, col.width, rowH, col.text, { ...col, fontSize: colFs });
      curX += col.width;
    }

    this.cursorY += rowH;
    return rowH;
  }

  /**
   * Draw the 8-box date grid [ D | D | M | M | Y | Y | Y | Y ]
   */
  draw8BoxDate(x: number, y: number, dateStr: string = '', cellW: number = 13, cellH: number = 16): void {
    // Sanitize string to get digits or characters
    const clean = String(dateStr || '').replace(/[^0-9A-Za-z]/g, '');
    const chars = clean.padEnd(8, ' ').split('').slice(0, 8);
    const headers = ['D', 'D', 'M', 'M', 'Y', 'Y', 'Y', 'Y'];

    for (let i = 0; i < 8; i++) {
      const cellX = x + i * cellW;
      const char = chars[i].trim() || headers[i];
      const isFilled = chars[i].trim().length > 0;

      this.page.drawRectangle({
        x: cellX,
        y: y - cellH,
        width: cellW,
        height: cellH,
        borderColor: rgb(0, 0, 0),
        borderWidth: BORDER_W,
        color: isFilled ? hexToRgb(VAL_BG) : undefined,
        opacity: isFilled ? BG_OPACITY : undefined,
      });

      const font = isFilled ? this.fontBold : this.fontRegular;
      const fs = 8.5;
      const tw = font.widthOfTextAtSize(char, fs);
      this.page.drawText(char, {
        x: cellX + (cellW - tw) / 2,
        y: y - cellH + (cellH - fs) / 2,
        size: fs,
        font,
        color: isFilled ? rgb(0, 0, 0) : rgb(0.4, 0.4, 0.4),
      });
    }
  }

  /**
   * Insert a visual section break/line break in the PDF if there is enough vertical space
   */
  addSectionBreak(gap: number = 8): void {
    if (this.pdfY(this.cursorY + gap + 25) > MARGIN_B) {
      this.cursorY += gap;
    }
  }

  /**
   * Main 10-Page Generator for Axis Bank AGRI (Non-Agri Format)
   */
  async generateAxisAgriReport(
    fields: AxisAgriReportFields,
    images: {
      photos?: { bytes: Uint8Array; label?: string }[];
      locationMaps?: Uint8Array[];
      cadastralMaps?: Uint8Array[];
      sketchMaps?: Uint8Array[];
      benchmarkImages?: Uint8Array[];
    } = {}
  ): Promise<Uint8Array> {
    const W = CONTENT_W; // 487.28pt
    const check = (val: boolean) => (val ? '[X]' : '[ ]');

    // =========================================================================
    // PAGE 1: HEADER, TECHNICAL INITIATION, DETAILS OF PROPERTY, TOPOGRAPHY
    // =========================================================================
    this.cursorY = 0;

    // Ref No & Date
    const refDateH = 18;
    const refDateY = this.pdfY(this.cursorY);
    const refText = fields.refNo ? `REF NO - ${fields.refNo}` : '';
    const dateText = fields.reportDate ? `DATE - ${formatReportDate(fields.reportDate)}` : '';

    this.page.drawText(this.sanitizeText(refText), {
      x: MARGIN_L,
      y: refDateY - 12,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    const dateTw = this.fontBold.widthOfTextAtSize(this.sanitizeText(dateText), FONT_SIZE);
    this.page.drawText(this.sanitizeText(dateText), {
      x: MARGIN_L + W - dateTw,
      y: refDateY - 12,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += refDateH + 4;    // Header Banner: VALUATION REPORT FORMAT (NON-AGRI) | DATE OF VISIT
    const visitDate = fields.dateOfVisit ? formatReportDate(fields.dateOfVisit) : '';
    this.drawRow([
      {
        text: fields.reportTitle || 'VALUATION REPORT FORMAT (NON-AGRI)',
        width: W * 0.65,
        isHeader: true,
        bold: true,
      },
      {
        text: visitDate ? `DATE OF VISIT: ${visitDate}` : 'DATE OF VISIT:',
        width: W * 0.35,
        isHeader: true,
        bold: true,
        align: 'right',
      },
    ], 20, 4);

    // Section 1 — Technical Initiation Details (4 Columns)
    const col4_w1 = W * 0.25;
    const col4_w2 = W * 0.25;
    const col4_w3 = W * 0.25;
    const col4_w4 = W * 0.25;

    this.drawRow([
      { text: 'Report Initiated by Area', width: col4_w1, isLabel: true },
      { text: fields.reportInitiatedByArea || '', width: col4_w2 },
      { text: 'Name of Area', width: col4_w3, isLabel: true },
      { text: fields.nameOfArea || '', width: col4_w4 },
    ], 20, 4);

    this.drawRow([
      { text: 'Name of Owner & Address:', width: col4_w1, isLabel: true },
      { text: fields.ownerNameAndAddress || '', width: col4_w2, bold: true },
      { text: 'Name of Borrower & Address', width: col4_w3, isLabel: true },
      { text: fields.borrowerNameAndAddress || '', width: col4_w4, bold: true },
    ], 28, 4);

    this.drawRow([
      { text: 'Proposal No', width: col4_w1, isLabel: true },
      { text: fields.proposalNo || '', width: col4_w2 },
      { text: 'Name of the Representative & Mobile No.', width: col4_w3, isLabel: true },
      { text: fields.representativeNameMobile || '', width: col4_w4 },
    ], 20, 4);

    this.addSectionBreak(8);

    // Section Banner: Details of the Property Being Valued
    this.drawRow([{ text: 'Details of the Property Being Valued', width: W, isHeader: true, bold: true }], 18, 4);

    // Location of Property: Rural / Semi Urban / Urban
    const loc = String(fields.locationOfProperty || 'Rural').toLowerCase();
    const locText = `${check(loc.includes('rural'))} Rural   ${check(loc.includes('semi'))} Semi Urban   ${check(loc.includes('urban') && !loc.includes('semi'))} Urban`;
    this.drawRow([
      { text: 'Location of Property', width: col4_w1 * 2, isLabel: true },
      { text: locText, width: col4_w1 * 2, bold: true },
    ], 20, 4);

    // Documents Provided
    const rawDocs = fields.documentsProvided;
    const docs = Array.isArray(rawDocs)
      ? rawDocs
      : typeof rawDocs === 'string' && rawDocs
      ? (rawDocs as string).split(',').map(s => s.trim())
      : [];
    const hasDoc = (d: string) => docs.some(item => String(item || '').toLowerCase().includes(d.toLowerCase()));
    const docStr = `Documents Provided: ${check(hasDoc('sale deed'))} Copy of Sale Deed   ${check(hasDoc('naksha'))} Bhu-Naksha   ${check(hasDoc('approved plan'))} Approved Plan   ${check(hasDoc('commencement'))} Commencement Certificate   ${check(hasDoc('occupancy'))} Occupancy Certificate   ${check(hasDoc('ror'))} ROR   ${check(hasDoc('previous'))} Previous Valuation Report`;
    this.drawRow([{ text: docStr, width: W, bold: true }], 20, 4);

    // Plot No / Khata & Road Facility
    this.drawRow([
      { text: 'Plot No / S.NO/ G. No/ Khasra No:', width: col4_w1, isLabel: true },
      { text: fields.plotKhataDetails || '', width: col4_w2, bold: true },
      { text: 'Road Facility at the site', width: col4_w3, isLabel: true },
      { text: fields.roadFacilityAtSite || '', width: col4_w4, bold: true },
    ], 36, 4);

    // Colony & Locality/Landmark
    this.drawRow([
      { text: 'Colony/Nagar/Sector', width: col4_w1, isLabel: true },
      { text: fields.colonyNagarSector || '', width: col4_w2 },
      { text: 'Locality/ Landmark :', width: col4_w3, isLabel: true },
      { text: fields.localityLandmark || '', width: col4_w4 },
    ], 24, 4);

    // Village & District
    this.drawRow([
      { text: 'Village/Town/City/Market', width: col4_w1, isLabel: true },
      { text: fields.villageTownCityMarket || '', width: col4_w2 },
      { text: 'District', width: col4_w3, isLabel: true },
      { text: fields.district || '', width: col4_w4 },
    ], 20, 4);

    // State & Pincode
    this.drawRow([
      { text: 'State', width: col4_w1, isLabel: true },
      { text: fields.state || '', width: col4_w2 },
      { text: 'Pincode', width: col4_w3, isLabel: true },
      { text: fields.pincode || '', width: col4_w4 },
    ], 20, 4);

    // Distance from Area Office
    this.drawRow([
      { text: 'Distance from Area Office', width: col4_w1 * 2, isLabel: true },
      { text: fields.distanceFromAreaOffice || '', width: col4_w1 * 2 },
    ], 20, 4);

    // Latitude, Longitude and Coordinates
    const coordsFull = `Latitude: ${fields.latitude || ''}, Longitude: ${fields.longitude || ''}\nCoordinates: ${fields.coordinates || ''}`;
    this.drawRow([
      { text: 'Latitude, Longitude and Coordinates of the site', width: col4_w1 * 2, isLabel: true },
      { text: coordsFull, width: col4_w1 * 2, bold: true },
    ], 24, 4);

    this.addSectionBreak(8);

    // Section Banner: Type of Property
    this.drawRow([{ text: 'Type of Property', width: W, isHeader: true, bold: true }], 18, 4);

    // (A) Plot
    const plotType = String(fields.typeOfPropertyPlot || (fields as any).classificationOfPlot || '').toLowerCase();
    const plotText = `${check(plotType.includes('na'))} NA   ${check(plotType.includes('residential'))} Residential   ${check(plotType.includes('commercial'))} Commercial   ${check(plotType.includes('industrial'))} Industrial`;
    this.drawRow([
      { text: '(A) Plot:', width: col4_w1 * 2, isLabel: true },
      { text: plotText, width: col4_w1 * 2, bold: true },
    ], 20, 4);

    // Level of Land
    this.drawRow([
      { text: 'Level of land with topographical conditions', width: col4_w1 * 2, isLabel: true },
      { text: fields.levelOfLand || '', width: col4_w1 * 2 },
    ], 20, 4);

    // Municipal Limit
    const isMuni = String(fields.situatedInMunicipalLimit || '').toLowerCase();
    const muniText = `${check(isMuni === 'yes')} Yes   ${check(isMuni === 'no')} No`;
    this.drawRow([
      { text: 'Whether situated in Municipal/Corporation Limit:', width: col4_w1 * 2, isLabel: true },
      { text: muniText, width: col4_w1 * 2 },
    ], 20, 4);

    // Any construction observed on plot
    this.drawRow([
      { text: 'Any construction observed on plot', width: col4_w1 * 2, isLabel: true },
      { text: fields.constructionObservedOnPlot || '', width: col4_w1 * 2, bold: true },
    ], 20, 4);

    // (B) Residential Property options
    const isResSelected = Boolean(fields.residentialPropertyType || fields.residentialPropertySubtype || (fields as any).residentialSubClass || (fields.typeOfPropertyPlot && String(fields.typeOfPropertyPlot).toLowerCase().includes('residential')));
    const resSub = String(fields.residentialPropertySubtype || (fields as any).residentialSubClass || '').toLowerCase();
    const resText = `${check(resSub.includes('independent'))} Independent house   ${check(resSub.includes('bungalow'))} Bungalow   ${check(resSub.includes('row'))} Row House`;
    this.drawRow([
      { text: `(B) Residential Property: ${check(isResSelected)} Residential`, width: col4_w1 * 2, isLabel: true },
      { text: resText, width: col4_w1 * 2, bold: true },
    ], 20, 4);

    // =========================================================================
    // PAGE 2: BOUNDARIES, LOCALITY, INFRASTRUCTURE, OCCUPANCY, LEASEHOLD, RERA
    // =========================================================================
    this.addPage();

    // Completing residential subtypes & Civic amenities
    const resText2 = `${check(resSub.includes('flat'))} Flat   ${check(resSub.includes('commercial'))} Commercial`;
    this.drawRow([
      { text: '', width: col4_w1 * 2, isLabel: true },
      { text: resText2, width: col4_w1 * 2, bold: true },
    ], 18, 4);

    const civVal = String(fields.civicAmenities || '').toLowerCase();
    const civText = `${check(civVal.includes('available') && !civVal.includes('not'))} Available within the radius of 2-3 Kms\n${check(civVal.includes('not available'))} Not Available`;
    this.drawRow([
      { text: 'Civic Amenities like school, hospital, market, etc.', width: col4_w1 * 2, isLabel: true },
      { text: civText, width: col4_w1 * 2 },
    ], 24, 4);

    // (C) Commercial/Industrial Property
    const commSub = String(fields.commercialPropertySubtype || (fields as any).commercialSubClass || '').toLowerCase();
    const commText = `${check(commSub.includes('independent'))} Independent house   ${check(commSub.includes('row'))} Row House   ${check(commSub.includes('mall'))} Unit in a mall   ${check(commSub.includes('godown'))} Godown   ${check(commSub.includes('industrial'))} Industrial   ${check(commSub.includes('shop'))} Shop`;
    const commTypeStr = String(fields.commercialPropertyType || '').toLowerCase();
    const plotTypeStr = String(fields.typeOfPropertyPlot || '').toLowerCase();
    const isComm = commTypeStr.includes('commercial') || plotTypeStr.includes('commercial');
    const isIndType = commTypeStr.includes('industrial') || plotTypeStr.includes('industrial');

    let commLabel = '(C) Commercial/Industrial Property:';
    if (isComm && !isIndType) {
      commLabel = `(C) Commercial/Industrial Property: ${check(true)} Commercial`;
    } else if (isIndType && !isComm) {
      commLabel = `(C) Commercial/Industrial Property: ${check(true)} Industrial`;
    }
    this.drawRow([
      { text: commLabel, width: col4_w1 * 2, isLabel: true },
      { text: commText, width: col4_w1 * 2, bold: true },
    ], 22, 4);

    // Availability of local transport
    const rawTrans = fields.availabilityLocalTransport;
    const trans = Array.isArray(rawTrans)
      ? rawTrans
      : typeof rawTrans === 'string' && rawTrans
      ? (rawTrans as string).split(',').map(s => s.trim())
      : [];
    const hasTrans = (t: string) => trans.some(item => String(item || '').toLowerCase().includes(t.toLowerCase()));
    const transText = `${check(hasTrans('metro'))} Metro   ${check(hasTrans('train'))} Local Train   ${check(hasTrans('bus'))} Bus   ${check(hasTrans('personal'))} Personal Transport`;
    this.drawRow([
      { text: 'Availability of local transport', width: col4_w1 * 2, isLabel: true },
      { text: transText, width: col4_w1 * 2, bold: true },
    ], 20, 4);

    // Distance from Railway Station & Bus Stop
    this.drawRow([
      { text: `Distance from Railway Station: ${fields.distanceFromRailwayStation || ''}`, width: col4_w1 * 2 },
      { text: `Bus stop/ Taxi/ Auto Stand: ${fields.busStopTaxiStand || ''}`, width: col4_w1 * 2 },
    ], 20, 4);

    // Approach road & Fire extinguisher
    const isAppr = String(fields.independentApproachRoad || '').toLowerCase();
    const isFire = String(fields.accommodateFireExtinguisher || '').toLowerCase();
    this.drawRow([
      { text: 'Does the approach road to the Property / Building is independent and accessible', width: col4_w1 * 1.5, isLabel: true },
      { text: `${check(isAppr === 'yes')} Yes   ${check(isAppr === 'no')} No`, width: col4_w1 * 0.5, bold: true },
      { text: 'Will it be able to accommodate a fire extinguisher', width: col4_w1 * 1.5, isLabel: true },
      { text: `${check(isFire === 'yes')} Yes   ${check(isFire === 'no')} No`, width: col4_w1 * 0.5, bold: true },
    ], 24, 4);

    // Landlocked area
    const isLocked = String(fields.landLockedArea || '').toLowerCase();
    this.drawRow([
      { text: 'Does the property falls under land locked area', width: col4_w1 * 1.5, isLabel: true },
      { text: `${check(isLocked === 'yes')} Yes   ${check(isLocked === 'no')} No`, width: col4_w1 * 0.5, bold: true },
      { text: '', width: col4_w1 * 2 },
    ], 20, 4);

    // Cornered/Intermittent
    const isCorner = String(fields.corneredOrIntermittentVal || '').toLowerCase();
    this.drawRow([
      { text: `Cornered/Intermittent Plot - ${fields.corneredOrIntermittent || ''}`, width: col4_w1 * 2, isLabel: true },
      { text: `${check(isCorner === 'yes')} Yes   ${check(isCorner === 'no')} No`, width: col4_w1 * 2, bold: true },
    ], 20, 4);

    this.addSectionBreak(8);

    // Boundaries Table (3 Columns)
    const bW1 = W * 0.2;
    const bW2 = W * 0.4;
    const bW3 = W * 0.4;

    this.drawRow([
      { text: 'Boundaries', width: bW1, isHeader: true, bold: true },
      { text: 'As per Verification', width: bW2, isHeader: true, bold: true },
      { text: 'As per Document', width: bW3, isHeader: true, bold: true },
    ], 18, 4);

    this.drawRow([
      { text: 'East', width: bW1, isLabel: true, bold: true },
      { text: fields.boundaryEastVerification || '-', width: bW2 },
      { text: fields.boundaryEastDocument || '-', width: bW3 },
    ], 18, 4);

    this.drawRow([
      { text: 'West', width: bW1, isLabel: true, bold: true },
      { text: fields.boundaryWestVerification || '-', width: bW2 },
      { text: fields.boundaryWestDocument || '-', width: bW3 },
    ], 18, 4);

    this.drawRow([
      { text: 'North', width: bW1, isLabel: true, bold: true },
      { text: fields.boundaryNorthVerification || '-', width: bW2 },
      { text: fields.boundaryNorthDocument || '-', width: bW3 },
    ], 18, 4);

    this.drawRow([
      { text: 'South', width: bW1, isLabel: true, bold: true },
      { text: fields.boundarySouthVerification || '-', width: bW2 },
      { text: fields.boundarySouthDocument || '-', width: bW3 },
    ], 18, 4);

    this.addSectionBreak(8);

    // Class of locality
    const locClass = String(fields.classOfLocality || (fields as any).classificationOfLocality || '').toLowerCase();
    const locClassText = `${check(locClass.includes('posh'))} Posh   ${check(locClass.includes('higher'))} Higher Middle Class   ${check(locClass.includes('middle') && !locClass.includes('higher') && !locClass.includes('lower'))} Middle class   ${check(locClass.includes('lower'))} Lower middle Class   ${check(locClass.includes('poor'))} Poor`;
    this.drawRow([
      { text: 'Class of locality', width: col4_w1 * 1.5, isLabel: true },
      { text: locClassText, width: W - col4_w1 * 1.5, bold: true },
    ], 20, 4);

    // Quality of Infrastructure & Ownership Status
    const infra = String(fields.qualityOfInfrastructure || (fields as any).infrastructureCondition || '').toLowerCase();
    const infraText = `${check(infra.includes('excellent'))} Excellent   ${check(infra.includes('good'))} Good   ${check(infra.includes('average'))} Average   ${check(infra.includes('poor'))} Poor`;
    this.drawRow([
      { text: 'Quality of Infrastructure in the vicinity', width: col4_w1 * 1.5, isLabel: true },
      { text: infraText, width: W - col4_w1 * 1.5, bold: true },
    ], 20, 4);

    const own = String(fields.ownershipStatus || (fields as any).ownershipType || '').toLowerCase();
    const ownText = `${check(own.includes('free'))} Free Hold   ${check(own.includes('lease'))} Reg. Lease   ${check(own.includes('govt'))} Govt. Authority`;
    this.drawRow([
      { text: 'Ownership Status of the Property', width: col4_w1 * 1.5, isLabel: true },
      { text: ownText, width: W - col4_w1 * 1.5, bold: true },
    ], 20, 4);

    // Approved & Actual Usage
    const rawApp = fields.approvedUsage;
    const appUsage = Array.isArray(rawApp)
      ? rawApp
      : typeof rawApp === 'string' && rawApp
      ? (rawApp as string).split(',').map(s => s.trim())
      : [];
    const rawAct = fields.actualUsage;
    const actUsage = Array.isArray(rawAct)
      ? rawAct
      : typeof rawAct === 'string' && rawAct
      ? (rawAct as string).split(',').map(s => s.trim())
      : [];
    const hasApp = (u: string) => appUsage.some(item => String(item || '').toLowerCase().includes(u.toLowerCase()));
    const hasAct = (u: string) => actUsage.some(item => String(item || '').toLowerCase().includes(u.toLowerCase()));

    const appUsageText = `${check(hasApp('industrial'))} Industrial   ${check(hasApp('commercial'))} Commercial   ${check(hasApp('residential'))} Residential   ${check(hasApp('mix'))} Mix`;
    const actUsageText = `${check(hasAct('industrial'))} Industrial   ${check(hasAct('commercial'))} Commercial   ${check(hasAct('residential'))} Residential   ${check(hasAct('mix'))} Mix`;

    this.drawRow([
      { text: 'Approved usage of property', width: col4_w1, isLabel: true },
      { text: appUsageText, width: col4_w2, bold: true },
      { text: 'Actual usage of property', width: col4_w3, isLabel: true },
      { text: actUsageText, width: col4_w4, bold: true },
    ], 22, 4);

    // Restrictive Covenants
    this.drawRow([
      { text: 'Restrictive covenants in regards to Land Use, (if any)', width: col4_w1 * 2, isLabel: true },
      { text: fields.restrictiveCovenants || '', width: col4_w1 * 2 },
    ], 20, 4);

    // Structure & No of Floors
    const structType = fields.typeOfStructure || '';
    const floorDesc = fields.noOfFloors || '-';
    this.drawRow([
      { text: 'Type of Structure\nNo of Floors:', width: col4_w1 * 2, isLabel: true },
      { text: `${structType}\n${floorDesc}`, width: col4_w1 * 2, bold: true },
    ], 24, 4);

    this.addSectionBreak(8);

    // Occupancy Details
    const occ = String(fields.occupancyDetails || (fields as any).occupancyStatus || '').toLowerCase();
    const occText = `${check(occ.includes('self'))} Self-Occupied   ${check(occ.includes('rent'))} Rented   ${check(occ.includes('vacant'))} Vacant`;
    this.drawRow([
      { text: 'Occupancy Details', width: col4_w1 * 2, isLabel: true },
      { text: occText, width: col4_w1 * 2, bold: true },
    ], 20, 4);

    // Tenancy Details
    this.drawRow([{ text: 'If the property is on rent:', width: W, isHeader: true, bold: true }], 18, 4);
    this.drawRow([
      { text: `Name of tenant/leasee: ${fields.tenantName || 'NA'}`, width: W * 0.5 },
      { text: `Number of years in tenancy: ${fields.yearsInTenancy || 'NA'}`, width: W * 0.5 },
    ], 20, 4);

    // Resistance
    const hasResVal = String(fields.resistanceForValuation || '').toLowerCase();
    const hasResOcc = String(fields.resistanceFromOccupants || '').toLowerCase();
    this.drawRow([
      { text: `Was there any resistance for valuation: ${check(hasResVal === 'yes')} Yes  ${check(hasResVal === 'no')} No`, width: W * 0.5 },
      { text: `If yes, from the current occupants: ${check(hasResOcc === 'yes')} Yes  ${check(hasResOcc === 'no')} No`, width: W * 0.5 },
    ], 20, 4);

    // Basic Amenities & Development
    const rawAm = fields.basicAmenities;
    const am = Array.isArray(rawAm)
      ? rawAm
      : typeof rawAm === 'string' && rawAm
      ? (rawAm as string).split(',').map(s => s.trim())
      : [];
    const hasAm = (a: string) => am.some(item => String(item || '').toLowerCase().includes(a.toLowerCase()));
    const amText = `${check(hasAm('electricity'))} Electricity   ${check(hasAm('water'))} Water   ${check(hasAm('drainage'))} Drainage connection`;
    const dev = String(fields.developmentSurroundingArea || (fields as any).surroundingDevelopment || '').toLowerCase();
    const devText = `${check(dev.includes('under'))} Underdeveloped   ${check(dev.includes('developing'))} Developing   ${check(dev.includes('developed') && !dev.includes('under'))} Developed`;

    this.drawRow([
      { text: 'Does property have basic amenities', width: col4_w1, isLabel: true },
      { text: amText, width: col4_w2, bold: true },
      { text: 'Development of surrounding area', width: col4_w3, isLabel: true },
      { text: devText, width: col4_w4, bold: true },
    ], 22, 4);

    this.addSectionBreak(8);

    // Leasehold Details
    this.drawRow([
      { text: `If the property is Leasehold (${fields.isLeasehold || 'The Property is Free Hold Land'})`, width: W, isHeader: true, bold: true },
    ], 18, 4);

    this.drawRow([
      { text: `Name of Lesser: ${fields.lessorName || 'NA'}`, width: W * 0.5 },
      { text: `Nature of Lease: ${fields.natureOfLease || 'NA'}`, width: W * 0.5 },
    ], 20, 4);

    const lRes = String(fields.leaseholdOccupantsResistance || '').toLowerCase();
    this.drawRow([
      { text: `Total Period of Lease: ${fields.totalPeriodOfLease || 'NA'}`, width: W * 0.5 },
      { text: `If yes, from the current occupants: ${check(lRes === 'yes')} Yes  ${check(lRes === 'no')} No`, width: W * 0.5 },
    ], 20, 4);

    // Leasehold basic amenities & development (matching UI screenshot)
    const leaseAm = fields.leaseholdBasicAmenities || fields.basicAmenities;
    const lAm = Array.isArray(leaseAm)
      ? leaseAm
      : typeof leaseAm === 'string' && leaseAm
      ? (leaseAm as string).split(',').map(s => s.trim())
      : [];
    const hasLAm = (a: string) => lAm.some(item => String(item || '').toLowerCase().includes(a.toLowerCase()));
    const lAmText = `${check(hasLAm('electricity'))} Electricity   ${check(hasLAm('water'))} Water   ${check(hasLAm('drainage'))} Drainage connection`;
    const lDev = String(fields.leaseholdDevelopment || fields.developmentSurroundingArea || '').toLowerCase();
    const lDevText = `${check(lDev.includes('under'))} Under developed   ${check(lDev.includes('developing'))} Developing   ${check(lDev.includes('developed') && !lDev.includes('under'))} Developed`;

    this.drawRow([
      { text: 'Does property have basic amenities', width: col4_w1, isLabel: true },
      { text: lAmText, width: col4_w2, bold: true },
      { text: 'Development of surrounding area', width: col4_w3, isLabel: true },
      { text: lDevText, width: col4_w4, bold: true },
    ], 22, 4);

    this.addSectionBreak(8);

    // RERA & Occupancy Certificate
    this.drawRow([{ text: 'Approval Details:-', width: W, isHeader: true, bold: true }], 18, 4);
    this.drawRow([
      { text: `RERA Registration Number: ${fields.reraRegNo || 'Not Applicable.'}`, width: W * 0.5 },
      { text: `Occupancy Certificate: ${fields.occupancyCertificate || 'Not Available'}`, width: W * 0.5 },
    ], 20, 4);

    // =========================================================================
    // PAGE 3: STATUTORY APPROVALS (8-BOX CELLS) & CONSTRUCTION DETAILS
    // =========================================================================
    this.addPage();

    // Layout Approval Row
    this.drawRow([
      { text: `Layout Approval Number : ${fields.layoutApprovalNo || 'Not Mentioned'}`, width: W * 0.5, isLabel: true },
      { text: '', width: W * 0.5 },
    ], 20, 4);

    // Layout Date Box Row
    const boxRowH = 22;
    const boxY = this.pdfY(this.cursorY);
    this.drawCell(MARGIN_L, boxY, W * 0.25, boxRowH, 'Date of Approval', { isLabel: true, align: 'center', vAlign: 'middle' });
    this.draw8BoxDate(MARGIN_L + W * 0.25 + 4, boxY - 3, fields.layoutApprovalDate || '');
    this.drawCell(MARGIN_L + W * 0.5, boxY, W * 0.25, boxRowH, 'Expiry Date', { isLabel: true, align: 'center', vAlign: 'middle' });
    this.draw8BoxDate(MARGIN_L + W * 0.75 + 4, boxY - 3, fields.layoutExpiryDate || '');
    this.cursorY += boxRowH;

    this.addSectionBreak(8);

    // Building Plan Approval Row
    this.drawRow([
      { text: `Building Plan Approval Number: ${fields.buildingPlanApprovalNo || 'Not Available'}`, width: W * 0.5, isLabel: true },
      { text: '', width: W * 0.5 },
    ], 20, 4);

    // Building Plan Date Box Row
    const boxY2 = this.pdfY(this.cursorY);
    this.drawCell(MARGIN_L, boxY2, W * 0.25, boxRowH, 'Date of Approval', { isLabel: true, align: 'center', vAlign: 'middle' });
    this.draw8BoxDate(MARGIN_L + W * 0.25 + 4, boxY2 - 3, fields.buildingPlanApprovalDate || '');
    this.drawCell(MARGIN_L + W * 0.5, boxY2, W * 0.25, boxRowH, 'Expiry Date', { isLabel: true, align: 'center', vAlign: 'middle' });
    this.draw8BoxDate(MARGIN_L + W * 0.75 + 4, boxY2 - 3, fields.buildingPlanExpiryDate || '');
    this.cursorY += boxRowH;

    this.addSectionBreak(8);

    // Construction Details Header
    this.drawRow([{ text: 'Construction Details', width: W, isHeader: true, bold: true }], 18, 4);

    this.drawRow([
      { text: 'Area of the Plot As per ROR', width: col4_w1, isLabel: true },
      { text: fields.areaOfPlotRor || 'Not Available', width: col4_w2, bold: true },
      { text: 'Approved Built Up Area (In Sq.Ft.)', width: col4_w3, isLabel: true },
      { text: fields.approvedBUA || 'Not Available', width: col4_w4 },
    ], 28, 4);

    this.drawRow([
      { text: 'Area of the Plot As per Document', width: col4_w1, isLabel: true },
      { text: fields.areaOfPlotDoc || 'Not Available', width: col4_w2, bold: true },
      { text: 'Actual Built Up Area (In Sq.Ft.)', width: col4_w3, isLabel: true },
      { text: fields.actualBUA || 'Not Available', width: col4_w4 },
    ], 28, 4);

    this.drawRow([
      { text: 'Demarcation at site', width: col4_w1 * 2, isLabel: true },
      { text: fields.demarcationAtSite || '', width: col4_w1 * 2, bold: true },
    ], 20, 4);

    this.addSectionBreak(8);

    // Floor Wise Break up Table
    this.drawRow([
      { text: 'Floor wise break up as follows', width: W * 0.5, isHeader: true, bold: true },
      { text: 'Current Usage', width: W * 0.5, isHeader: true, bold: true },
    ], 18, 4);

    // Basement & Stilt
    this.drawRow([
      { text: 'Basement (in Sq.Ft.)', width: W * 0.3, isLabel: true },
      { text: fields.basementArea || 'Not Applicable', width: W * 0.2 },
      { text: `${check(false)} Storage  ${check(false)} Parking  ${check(false)} Commercial  ${check(false)} Residential`, width: W * 0.5 },
    ], 18, 4);

    this.drawRow([
      { text: 'Stilt (in Sq.Ft.)', width: W * 0.3, isLabel: true },
      { text: fields.stiltArea || 'Not Applicable', width: W * 0.2 },
      { text: `${check(false)} Storage  ${check(false)} Parking  ${check(false)} Commercial  ${check(false)} Residential`, width: W * 0.5 },
    ], 18, 4);

    // Floor rows
    const floors = fields.floors && fields.floors.length > 0 ? fields.floors : [];

    for (const fl of floors) {
      const u = String(fl.usage || '').toLowerCase();
      const uText = `${check(u.includes('office') || u.includes('industrial'))} ${u.includes('industrial') ? 'Industrial' : 'Office'}   ${check(u.includes('parking'))} Parking   ${check(u.includes('commercial'))} Commercial   ${check(u.includes('residential'))} Residential`;
      const pArea = String(fl.plinthArea ?? (fl as any).area ?? '0.00');
      const pAreaFormatted = pArea.includes('Sft') ? pArea : `${pArea} Sft`;
      const flName = String(fl.floorName || (fl as any).name || 'Floor');
      this.drawRow([
        { text: `${flName} (in Sq.Ft.) Measured (RCC)`, width: W * 0.3, isLabel: true, bold: true },
        { text: pAreaFormatted, width: W * 0.2, bold: true },
        { text: uText, width: W * 0.5, bold: true },
      ], 18, 4);
    }

    // Totals
    this.drawRow([
      { text: 'Total Built Up area (in Sq.Ft.)', width: col4_w1, isLabel: true, bold: true },
      { text: fields.totalBUA ? `${fields.totalBUA} Sft` : '', width: col4_w2, bold: true, highlight: true },
      { text: 'Total Carpet area (in Sq.Ft.)', width: col4_w3, isLabel: true },
      { text: fields.totalCarpetArea ? `${fields.totalCarpetArea}` : '', width: col4_w4 },
    ], 20, 4);

    this.drawRow([
      { text: 'Total Saleable area (in Sq.Ft.)', width: col4_w1 * 2, isLabel: true },
      { text: fields.totalSaleableArea || '', width: col4_w1 * 2, bold: true },
    ], 20, 4);

    this.drawRow([
      { text: 'Amenities Details (if any):', width: col4_w1 * 2, isLabel: true },
      { text: fields.amenitiesDetails || '', width: col4_w1 * 2 },
    ], 18, 4);

    this.drawRow([
      { text: 'Floor Space Index permissible and percentage actually utilized:', width: col4_w1 * 2, isLabel: true },
      { text: fields.farPermissibleUtilized || '', width: col4_w1 * 2 },
    ], 18, 4);

    this.drawRow([
      { text: 'Whether the construction is as per approved building plan and / or local building bye laws:', width: col4_w1 * 2, isLabel: true },
      { text: fields.constructionAsPerApprovedPlan || '', width: col4_w1 * 2 },
    ], 18, 4);

    this.drawRow([
      { text: 'Details of Extra Construction', width: col4_w1 * 2, isLabel: true },
      { text: fields.extraConstructionDetails || '', width: col4_w1 * 2 },
    ], 18, 4);

    this.drawRow([
      { text: 'Percentage of Extra Construction', width: col4_w1 * 2, isLabel: true },
      { text: fields.extraConstructionPercentage || '', width: col4_w1 * 2 },
    ], 18, 4);

    this.drawRow([
      { text: 'Whether the extra construction is Compoundable OR Non-Compoundable?', width: col4_w1 * 2, isLabel: true },
      { text: fields.extraConstructionCompoundable || '', width: col4_w1 * 2 },
    ], 18, 4);

    this.drawRow([
      { text: 'Quality of construction', width: col4_w1 * 2, isLabel: true },
      { text: fields.qualityOfConstruction || '', width: col4_w1 * 2 },
    ], 18, 4);

    this.drawRow([
      { text: 'Maintenance of the Property', width: col4_w1 * 2, isLabel: true },
      { text: fields.maintenanceOfProperty || '', width: col4_w1 * 2 },
    ], 18, 4);

    // =========================================================================
    // PAGE 4: BUILDING CONDITION, LIFE, LAND RATE ADOPTED & COST BREAKDOWN
    // =========================================================================
    this.addPage();

    this.drawRow([
      { text: 'Condition Of Building', width: W * 0.5, isLabel: true },
      { text: fields.conditionOfBuilding || '', width: W * 0.5, bold: true },
    ], 20, 4);

    this.drawRow([
      { text: 'Current Life of the structure', width: col4_w1, isLabel: true },
      { text: fields.currentLifeStructure || '', width: col4_w2 },
      { text: 'Projected Life of the Structure', width: col4_w3, isLabel: true },
      { text: fields.projectedLifeStructure || '', width: col4_w4 },
    ], 20, 4);

    this.drawRow([
      { text: 'Land Revenue/Taxes Paid upto (for Land)', width: col4_w1, isLabel: true },
      { text: fields.landRevenueTaxesPaid || '', width: col4_w2 },
      { text: 'Municipal Taxes Paid upto (for Building)', width: col4_w3, isLabel: true },
      { text: fields.municipalTaxesPaid || '', width: col4_w4 },
    ], 22, 4);

    this.addSectionBreak(8);

    // Land Rate Adopted narrative
    const landHeader = 'THE LAND RATE ADOPTED IN THIS VALUATION:';
    this.page.drawText(landHeader, {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY) - 10,
      size: FONT_SIZE_SMALL + 1,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 16;

    const benchAcre = fields.govtBenchmarkRateAcre || 'Not Available';
    const benchSft = fields.govtBenchmarkRateSft || 'Not Available';
    const landDec = fields.totalLandAreaDec || '';
    const landAcre = fields.totalLandAreaAcre || (fields.totalLandAreaDec && !isNaN(parseFloat(fields.totalLandAreaDec)) ? (parseFloat(fields.totalLandAreaDec) / 100).toString() : '');
    const landSft = fields.totalLandAreaSft || 'Not Available';
    const govtVal = fields.totalGovtValueLand || 'Not Available';
    const mktMin = fields.prevailingMarketRateMin || 'Not Available';
    const mktMax = fields.prevailingMarketRateMax || 'Not Available';
    const adoptedRate = fields.adoptedMarketRateSft || 'Not Available';
    const totalMktVal = fields.totalMarketValueLand || 'Not Available';

    const landAreaDisplay = landAcre && landDec
      ? `AC. ${landAcre} (${landDec} DEC)`
      : landDec
      ? `AC. ${landDec} DEC`
      : 'NOT AVAILABLE';

    const landBullets = [
      `THE GOVT. BENCHMARK VALUE: ${benchAcre !== 'Not Available' ? `RS.${benchAcre}/- PER ACRE` : 'NOT AVAILABLE'} ${benchSft !== 'Not Available' ? `I.E. RS.${benchSft}/- PER SFT` : ''}`.trim(),
      `TOTAL LAND AREA: ${landAreaDisplay} ${landSft !== 'Not Available' ? `I.E. ${landSft} SFT` : ''}`.trim(),
      `TOTAL GOVT. VALUE OF LAND: ${landSft !== 'Not Available' && benchSft !== 'Not Available' ? `${landSft} SFT X RS.${benchSft}/- PER SFT = ` : ''}${govtVal !== 'Not Available' ? `RS.${govtVal}/-` : 'NOT AVAILABLE'}`,
      `THE PREVAILING MARKET RATE OF THE LAND IS ${mktMin !== 'Not Available' ? `RS.${mktMin}/-` : ''} TO ${mktMax !== 'Not Available' ? `RS.${mktMax}/- PER SFT.` : 'NOT AVAILABLE.'}`,
      `THE ADOPTED MARKET RATE OF THE LAND IS ${adoptedRate !== 'Not Available' ? `RS.${adoptedRate}/- PER SFT FOR VALUATION PURPOSE.` : 'NOT AVAILABLE.'}`,
      `TOTAL MARKET VALUE: ${landSft !== 'Not Available' && adoptedRate !== 'Not Available' ? `${landSft} SFT X RS.${adoptedRate}/- PER SFT = ` : ''}${totalMktVal !== 'Not Available' ? `RS.${totalMktVal}/-` : 'NOT AVAILABLE'}`,
    ];

    for (const b of landBullets) {
      const bY = this.pdfY(this.cursorY) - 9;
      this.page.drawText('•', { x: MARGIN_L + 10, y: bY, size: FONT_SIZE_SMALL, font: this.fontBold, color: rgb(0, 0, 0) });
      this.page.drawText(this.sanitizeText(b), {
        x: MARGIN_L + 24,
        y: bY,
        size: FONT_SIZE_SMALL,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      this.cursorY += 14;
    }

    this.addSectionBreak(8);

    // Details of Valuation Table (8 columns)
    const valTitle = 'Details of Valuation:-';
    this.page.drawText(valTitle, {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY) - 10,
      size: FONT_SIZE_SMALL + 1,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 16;

    const tW = [
      W * 0.18, // PERTICULARS OF ITEMS
      W * 0.10, // PLINTH AREA
      W * 0.10, // ROOF HEIGHT
      W * 0.10, // AGE OF BUILDING
      W * 0.13, // REPLACEMENT RATE
      W * 0.14, // ESTIMATED COST
      W * 0.12, // DEPRECIATION
      W * 0.13, // NET VALUE
    ];

    this.drawRow([
      { text: 'PERTICULARS OF ITEMS', width: tW[0], isHeader: true, bold: true, fontSize: 8 },
      { text: 'PLINTH AREA IN SQFT', width: tW[1], isHeader: true, bold: true, fontSize: 8 },
      { text: 'ROOF HEIGHT', width: tW[2], isHeader: true, bold: true, fontSize: 8 },
      { text: 'AGE OF THE BUILDING IN YEARS', width: tW[3], isHeader: true, bold: true, fontSize: 8 },
      { text: 'REPLACEMENT RATE OF CONSTRUCTION', width: tW[4], isHeader: true, bold: true, fontSize: 8 },
      { text: 'ESTIMATED REPLACEMENT COST OF CONSTRUCTION', width: tW[5], isHeader: true, bold: true, fontSize: 8 },
      { text: 'DEPRECIATION AMOUNT IN RS. (1% per Anm)', width: tW[6], isHeader: true, bold: true, fontSize: 8 },
      { text: 'NET VALUE AFTER DEPRECIATION', width: tW[7], isHeader: true, bold: true, fontSize: 8 },
    ], 26, 4);

    const costFloors = fields.floors && fields.floors.length > 0 ? fields.floors : [];

    if (costFloors.length === 0) {
      this.drawRow([
        { text: 'No construction/floor data provided', width: W, align: 'center', fontSize: 8.5 },
      ], 18, 4);
    } else {
      for (const cf of costFloors) {
        const cfName = String(cf.floorName || (cf as any).name || 'Floor').toUpperCase();
        const cfPlinth = String(cf.plinthArea ?? (cf as any).area ?? '0.00');
        this.drawRow([
          { text: cfName, width: tW[0], bold: true, fontSize: 8.5 },
          { text: cfPlinth, width: tW[1], align: 'right', fontSize: 8.5 },
          { text: String(cf.roofHeight || '-'), width: tW[2], align: 'center', fontSize: 8.5 },
          { text: String(cf.ageYears || '-'), width: tW[3], align: 'center', fontSize: 8.5 },
          { text: cf.replacementRate ? `Rs. ${cf.replacementRate}` : '-', width: tW[4], align: 'right', fontSize: 8.5 },
          { text: cf.estimatedCost ? `Rs. ${cf.estimatedCost}` : '-', width: tW[5], align: 'right', fontSize: 8.5 },
          { text: cf.depreciationAmount ? `Rs. ${cf.depreciationAmount}` : '-', width: tW[6], align: 'right', fontSize: 8.5 },
          { text: cf.netValue ? `Rs. ${cf.netValue}` : '-', width: tW[7], align: 'right', bold: true, fontSize: 8.5 },
        ], 18, 4);
      }
    }

    // Total Row
    const nonNetWidth = tW.slice(0, 7).reduce((a, b) => a + b, 0);
    this.drawRow([
      { text: 'Total', width: nonNetWidth, align: 'right', bold: true, isLabel: true },
      { text: fields.totalBasicValueBuilding ? `Rs. ${fields.totalBasicValueBuilding}` : 'Rs. 0.00', width: tW[7], align: 'right', bold: true, highlight: true },
    ], 20, 4);

    this.addSectionBreak(8);

    // Total Basic Value statement
    const bldgValSummary = fields.totalBasicValueBuilding
      ? `TOTAL BASIC VALUE OF THE BUILDING- Rs.${fields.totalBasicValueBuilding}/- OR SAY Rs.${fields.totalBasicValueBuildingSay || fields.totalBasicValueBuilding}/- (${fields.totalBasicValueBuildingWords || ''}).`
      : 'TOTAL BASIC VALUE OF THE BUILDING: Not Available';
    this.drawRow([{ text: bldgValSummary, width: W, bold: true, highlight: true }], 24, 6);

    // =========================================================================
    // PAGE 5: VALUE OF PROPERTY SUMMARY MATRIX, ESTIMATIONS, REMARKS
    // =========================================================================
    this.addPage();

    this.drawRow([{ text: 'VALUE OF THE PROPERTY', width: W, isHeader: true, bold: true }], 20, 4);

    const mColW = [W * 0.34, W * 0.17, W * 0.17, W * 0.15, W * 0.17];
    this.drawRow([
      { text: '', width: mColW[0], isHeader: true },
      { text: 'LAND', width: mColW[1], isHeader: true, bold: true, align: 'center' },
      { text: 'BUILDING', width: mColW[2], isHeader: true, bold: true, align: 'center' },
      { text: 'AMENITIES', width: mColW[3], isHeader: true, bold: true, align: 'center' },
      { text: 'TOTAL IN RS', width: mColW[4], isHeader: true, bold: true, align: 'center' },
    ], 18, 4);

    this.drawRow([
      { text: 'GOVT. GUIDE LINE VALUE', width: mColW[0], isLabel: true, bold: true },
      { text: fields.govtGuideLand ? `Rs. ${fields.govtGuideLand}` : (fields.totalGovtValueLand ? `Rs. ${fields.totalGovtValueLand}` : '-'), width: mColW[1], align: 'right' },
      { text: fields.govtGuideBuilding ? `Rs. ${fields.govtGuideBuilding}` : '-', width: mColW[2], align: 'right' },
      { text: fields.govtGuideAmenities || '-', width: mColW[3], align: 'center' },
      { text: fields.govtGuideTotal ? `Rs. ${fields.govtGuideTotal}` : (fields.totalGovtValueLand ? `Rs. ${fields.totalGovtValueLand}` : '-'), width: mColW[4], align: 'right', bold: true },
    ], 18, 4);

    this.drawRow([
      { text: 'MARKET VALUE IN RS', width: mColW[0], isLabel: true, bold: true },
      { text: fields.marketValueLand || fields.totalMarketValueLand ? `Rs. ${fields.marketValueLand || fields.totalMarketValueLand}` : '-', width: mColW[1], align: 'right' },
      { text: fields.marketValueBuilding || fields.totalBasicValueBuilding ? `Rs. ${fields.marketValueBuilding || fields.totalBasicValueBuilding}` : '-', width: mColW[2], align: 'right' },
      { text: fields.marketValueAmenities || '-', width: mColW[3], align: 'center' },
      { text: fields.marketValueTotal ? `Rs. ${fields.marketValueTotal}` : '-', width: mColW[4], align: 'right', bold: true, highlight: true },
    ], 18, 4);

    const realPctDisplay = fields.realisableValuePct !== undefined && fields.realisableValuePct !== '' ? fields.realisableValuePct : '95';
    this.drawRow([
      { text: `REALISABLE VALUE (${realPctDisplay}%)`, width: mColW[0], isLabel: true, bold: true },
      { text: fields.realisableValueLand ? `Rs. ${fields.realisableValueLand}` : '-', width: mColW[1], align: 'right' },
      { text: fields.realisableValueBuilding ? `Rs. ${fields.realisableValueBuilding}` : '-', width: mColW[2], align: 'right' },
      { text: fields.realisableValueAmenities || '-', width: mColW[3], align: 'center' },
      { text: fields.realisableValueTotal ? `Rs. ${fields.realisableValueTotal}` : '-', width: mColW[4], align: 'right', bold: true },
    ], 18, 4);

    const distPctDisplay = fields.distressValuePct !== undefined && fields.distressValuePct !== '' ? fields.distressValuePct : '85';
    this.drawRow([
      { text: `DISTRESS/FORCED SALE VALUE (${distPctDisplay}%)`, width: mColW[0], isLabel: true, bold: true },
      { text: fields.distressValueLand ? `Rs. ${fields.distressValueLand}` : '-', width: mColW[1], align: 'right' },
      { text: fields.distressValueBuilding ? `Rs. ${fields.distressValueBuilding}` : '-', width: mColW[2], align: 'right' },
      { text: fields.distressValueAmenities || '-', width: mColW[3], align: 'center' },
      { text: fields.distressValueTotal ? `Rs. ${fields.distressValueTotal}` : '-', width: mColW[4], align: 'right', bold: true },
    ], 18, 4);

    this.drawRow([
      { text: 'INSURABLE VALUE', width: mColW[0], isLabel: true, bold: true },
      { text: fields.insurableValueLand || '-', width: mColW[1], align: 'center' },
      { text: fields.insurableValueBuilding ? `Rs. ${fields.insurableValueBuilding}` : '-', width: mColW[2], align: 'right' },
      { text: fields.insurableValueAmenities || '-', width: mColW[3], align: 'center' },
      { text: fields.insurableValueTotal ? `Rs. ${fields.insurableValueTotal}` : '-', width: mColW[4], align: 'right', bold: true },
    ], 18, 4);

    this.addSectionBreak(8);

    // Narrative statements
    const text1 = fields.realizableEstimationText || 'REALIZABLE ESTIMATION OF THE PROPERTY IN CASE OF DISTRESS SALE, IN CASE, THE BANK WILL SELL THE PROPERTY THROUGH PROCEEDINGS.';
    this.drawRow([{ text: text1, width: W, fontSize: 8.5 }], 16, 2);

    const mvLine = fields.marketValueTotal
      ? `MARKET VALUE OF THE PROPERTY: Rs.${fields.marketValueTotal}/- OR SAY Rs.${fields.marketValueSay || fields.marketValueTotal}/- (${fields.marketValueWords || ''}).`
      : 'MARKET VALUE OF THE PROPERTY: Not Available';
    this.drawRow([{ text: mvLine, width: W, bold: true, fontSize: 8.5 }], 16, 2);

    const rvLine = fields.realisableValueTotal
      ? `REALIZABLE VALUE OF THE PROPERTY: Rs.${fields.realisableValueTotal}/- OR SAY Rs.${fields.realizableValueSay || fields.realisableValueTotal}/- (${fields.realizableValueWords || ''}).`
      : 'REALIZABLE VALUE OF THE PROPERTY: Not Available';
    this.drawRow([{ text: rvLine, width: W, bold: true, fontSize: 8.5 }], 16, 2);

    const dvLine = fields.distressValueTotal
      ? `DISTRESS SALE VALUE OF THE PROPERTY WILL BE: Rs.${fields.distressValueTotal}/- OR SAY Rs.${fields.distressValueSay || fields.distressValueTotal}/- (${fields.distressValueWords || ''}).`
      : 'DISTRESS SALE VALUE OF THE PROPERTY: Not Available';
    this.drawRow([{ text: dvLine, width: W, bold: true, fontSize: 8.5 }], 16, 2);

    const basisLine = `BASIS OF VALUATION:- ${fields.basisOfValuation || 'As per local market feedback and property analysis.'}`;
    this.drawRow([{ text: basisLine, width: W, fontSize: 8.5 }], 28, 4);

    const opLine = fields.opinionOfMarketValue || (fields.marketValueSay ? `AS A RESULT OF MY / OUR APPRAISAL AND ANALYSIS IT IS MY/OUR CONSIDERED OPINION THAT THE PRESENT MARKET VALUE OF THE ABOVE PROPERTY IN THE PREVAILING CONDITION WITH AFORESAID SPECIFICATIONS IS SAY : Rs.${fields.marketValueSay}/- (${fields.marketValueWords || ''}).` : 'Not Available');
    this.drawRow([{ text: opLine, width: W, bold: true, fontSize: 8.5 }], 24, 4);

    // Remarks Box
    const remHeader = 'REMARKS:-';
    const remBody = fields.remarksText || 'The property has been inspected and valued based on available documents, site measurements and current market conditions.';
    const remNB = 'NB: WE HAVE NOT VERIFIED ANY SALE DEED, ROR, SKETCH MAP, AND APPROVAL PLAN. ALL THE DATA';

    this.drawRow([
      { text: `${remHeader}\n${remBody}\n\n${remNB}`, width: W, fontSize: 8.5 },
    ], 90, 6);

    // =========================================================================
    // PAGE 6: TOP NOTICE, UNDERTAKING, SIGNATURE, ANNEXURE "A"
    // =========================================================================
    this.addPage();

    // Top Notice Box
    const topNotice = 'LIKE KHATA NO, PLOT NO, PLOT AREA, BUILT UP AREA, BOUNDARIES DETAILS ARE SHARED BY AXIS BANK LIMITED. REPORT IS RELEASED BASING UPON THE DATA SHARED BY AXIS BANK LIMITED.';
    this.drawRow([{ text: topNotice, width: W, bold: true, fontSize: 8.5, isLabel: true }], 24, 4);

    this.addSectionBreak(8);

    // Undertaking
    this.page.drawText('Undertaking:', {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY) - 10,
      size: FONT_SIZE_SMALL + 1,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 16;

    const rawUndertakings = fields.undertakingText
      ? fields.undertakingText
          .split('\n')
          .map(s => s.trim().replace(/^[•\-\*]\s*/, ''))
          .filter(Boolean)
      : [];

    const defaultUndertakings = [
      'I have personally visited the property & identified the same based on the documents provided.',
      'I/We have no direct or indirect interest in the property being valued.',
      'The information furnished above is true and correct to my/our knowledge.',
      'I/ we have not been dismissed or removed from govt. Service or convicted of an offence connected with any proceedings of income tax act, wealth tax act or gift tax act or have been blacklisted by any bank/ financial institution/ govt. Department/ public sector enterprise/ body corporate etc.',
      'This valuation is prepared without any prejudice or bias to any person or institution',
      'The value of land is taken into account by making due enquires in the locality and ascertaining the sales value of the properties in the locality',
      'Any additions/alterations made to the property after the date of valuations shall not fall under the scope of this report',
    ];

    const undertakings = rawUndertakings.length > 0 ? rawUndertakings : defaultUndertakings;

    for (const u of undertakings) {
      const uY = this.pdfY(this.cursorY) - 9;
      this.page.drawText('•', { x: MARGIN_L + 8, y: uY, size: FONT_SIZE_SMALL, font: this.fontBold, color: rgb(0, 0, 0) });
      const uLines = this.wrapText(this.sanitizeText(u), W - 28, FONT_SIZE_SMALL, false);
      let lineOff = 0;
      for (const ul of uLines) {
        this.page.drawText(ul, {
          x: MARGIN_L + 22,
          y: uY - lineOff,
          size: FONT_SIZE_SMALL,
          font: this.fontRegular,
          color: rgb(0, 0, 0),
        });
        lineOff += FONT_SIZE_SMALL * LINE_HEIGHT;
      }
      this.cursorY += Math.max(14, uLines.length * FONT_SIZE_SMALL * LINE_HEIGHT + 2);
    }

    this.addSectionBreak(8);

    // Authorized Signatory block (right aligned)
    const sigY = this.pdfY(this.cursorY);
    const signatoryTitle = fields.authorizedSignatory || 'Authorized Signatory';
    const sigLines = [
      signatoryTitle,
      '(Name and Seal of the Agency)',
      `Date: ${formatReportDate(fields.dateOfReportSubmission || fields.reportDate, '06.08.2026')}`,
    ];
    let sigCurY = sigY - 10;
    for (const sl of sigLines) {
      const slTw = this.fontBold.widthOfTextAtSize(sl, FONT_SIZE_SMALL);
      this.page.drawText(sl, {
        x: MARGIN_L + W - slTw - 10,
        y: sigCurY,
        size: FONT_SIZE_SMALL,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      sigCurY -= 13;
    }
    this.cursorY += 50;

    this.addSectionBreak(8);

    // ANNEXURE - "A"
    const annTitle = 'ANNEXURE - "A"';
    const annTw = this.fontBold.widthOfTextAtSize(annTitle, FONT_SIZE_HEADER);
    this.page.drawText(annTitle, {
      x: MARGIN_L + (W - annTw) / 2,
      y: this.pdfY(this.cursorY) - 10,
      size: FONT_SIZE_HEADER,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 18;

    const methodValText = fields.annexureAMethodOfValuation || '"LAND AND BUILDING" METHOD OF VALUATION HAS BEEN ADOPTED.';
    const methodLines = this.wrapText(this.sanitizeText(methodValText), W - 20, FONT_SIZE_SMALL, false);
    this.page.drawText('•', { x: MARGIN_L, y: this.pdfY(this.cursorY) - 9, size: FONT_SIZE_SMALL, font: this.fontBold, color: rgb(0, 0, 0) });
    let mvOff = 0;
    for (const ml of methodLines) {
      this.page.drawText(ml, {
        x: MARGIN_L + 12,
        y: this.pdfY(this.cursorY) - 9 - mvOff,
        size: FONT_SIZE_SMALL,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      mvOff += FONT_SIZE_SMALL * LINE_HEIGHT;
    }
    this.cursorY += Math.max(14, methodLines.length * FONT_SIZE_SMALL * LINE_HEIGHT + 2);

    const basisBldgText = fields.annexureABasisBuildingValue || 'THE BUILDING VALUE HAS BEEN CONSIDERED AS PER MEASURED BUA AREA OF THE STRUCTURES.';
    const basisBldgLines = this.wrapText(this.sanitizeText(basisBldgText), W - 20, FONT_SIZE_SMALL, false);
    this.page.drawText('•', { x: MARGIN_L, y: this.pdfY(this.cursorY) - 9, size: FONT_SIZE_SMALL, font: this.fontBold, color: rgb(0, 0, 0) });
    let bbOff = 0;
    for (const bbl of basisBldgLines) {
      this.page.drawText(bbl, {
        x: MARGIN_L + 12,
        y: this.pdfY(this.cursorY) - 9 - bbOff,
        size: FONT_SIZE_SMALL,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      bbOff += FONT_SIZE_SMALL * LINE_HEIGHT;
    }
    this.cursorY += Math.max(16, basisBldgLines.length * FONT_SIZE_SMALL * LINE_HEIGHT + 4);

    // Regarding Land
    this.page.drawText('REGARDING LAND:', {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY) - 9,
      size: FONT_SIZE_SMALL,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 14;

    const landText = fields.annexureARegardingLand || 'Market value is established considering local enquiries, location advantages and prevailing transaction trends.';
    const landLines = this.wrapText(this.sanitizeText(landText), W - 28, FONT_SIZE_SMALL, false);
    this.page.drawText('•', { x: MARGIN_L + 8, y: this.pdfY(this.cursorY) - 9, size: FONT_SIZE_SMALL, font: this.fontBold, color: rgb(0, 0, 0) });
    let lOff = 0;
    for (const ll of landLines) {
      this.page.drawText(ll, {
        x: MARGIN_L + 22,
        y: this.pdfY(this.cursorY) - 9 - lOff,
        size: FONT_SIZE_SMALL,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });
      lOff += FONT_SIZE_SMALL * LINE_HEIGHT;
    }
    this.cursorY += Math.max(16, landLines.length * FONT_SIZE_SMALL * LINE_HEIGHT + 6);

    // Regarding Building
    this.page.drawText('REGARDING BUILDING:', {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY) - 9,
      size: FONT_SIZE_SMALL,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 14;

    const bldgText = fields.annexureARegardingBuilding || 'Building value is calculated by analyzing construction specifications, material and labour rates with prevailing depreciation.';
    const bldgLines = this.wrapText(this.sanitizeText(bldgText), W - 28, FONT_SIZE_SMALL, false);
    this.page.drawText('•', { x: MARGIN_L + 8, y: this.pdfY(this.cursorY) - 9, size: FONT_SIZE_SMALL, font: this.fontBold, color: rgb(0, 0, 0) });
    let bOff = 0;
    for (const bl of bldgLines) {
      this.page.drawText(bl, {
        x: MARGIN_L + 22,
        y: this.pdfY(this.cursorY) - 9 - bOff,
        size: FONT_SIZE_SMALL,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });
      bOff += FONT_SIZE_SMALL * LINE_HEIGHT;
    }
    this.cursorY += Math.max(16, bldgLines.length * FONT_SIZE_SMALL * LINE_HEIGHT + 6);

    // Basis of arriving at the land rate
    this.page.drawText('BASIS OF ARRIVING AT THE LAND RATE:', {
      x: MARGIN_L,
      y: this.pdfY(this.cursorY) - 9,
      size: FONT_SIZE_SMALL,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 14;

    const basisRateText = fields.annexureABasisLandRate || 'Land rate is arrived at through verified market enquiries and approaching road access in the immediate vicinity.';
    const basisRateLines = this.wrapText(this.sanitizeText(basisRateText), W, FONT_SIZE_SMALL, false);
    let brOff = 0;
    for (const brl of basisRateLines) {
      this.page.drawText(brl, {
        x: MARGIN_L,
        y: this.pdfY(this.cursorY) - 9 - brOff,
        size: FONT_SIZE_SMALL,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });
      brOff += FONT_SIZE_SMALL * LINE_HEIGHT;
    }
    this.cursorY += basisRateLines.length * FONT_SIZE_SMALL * LINE_HEIGHT + 6;

    // =========================================================================
    // PAGE 7+: PROPERTY PHOTOGRAPHS (2x2 PHOTO GRID, ALL PHOTOS, NEW PAGE PER 4)
    // =========================================================================
    const photoList = images.photos || [];
    const cellW = (W - 10) / 2;
    const cellH = 260;
    const photosPerPage = 4;
    const totalPages = Math.max(1, Math.ceil(photoList.length / photosPerPage));

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      this.addPage();
      this.drawRow([{ text: 'PHOTOGRAPHS', width: W, isHeader: true, bold: true }], 20, 4);
      this.cursorY += 10;

      for (let row = 0; row < 2; row++) {
        const rowY = this.pdfY(this.cursorY);
        for (let col = 0; col < 2; col++) {
          const pIdx = pageIdx * photosPerPage + row * 2 + col;
          const curX = MARGIN_L + col * (cellW + 10);

          // Border rectangle
          this.page.drawRectangle({
            x: curX,
            y: rowY - cellH,
            width: cellW,
            height: cellH,
            borderColor: rgb(0, 0, 0),
            borderWidth: BORDER_W,
          });

          if (pIdx < photoList.length && photoList[pIdx].bytes) {
            try {
              const pBytes = photoList[pIdx].bytes;
              let pImg: any = null;
              try { pImg = await this.doc.embedJpg(pBytes); } catch { /* ignore */ }
              if (!pImg) {
                try { pImg = await this.doc.embedPng(pBytes); } catch { /* ignore */ }
              }
              if (pImg) {
                const maxImgW = cellW - 6;
                const maxImgH = cellH - 24;
                const scale = Math.min(maxImgW / pImg.width, maxImgH / pImg.height);
                const imgW = pImg.width * scale;
                const imgH = pImg.height * scale;
                const imgX = curX + (cellW - imgW) / 2;
                const imgY = rowY - cellH + 20 + (maxImgH - imgH) / 2;
                this.page.drawImage(pImg, { x: imgX, y: imgY, width: imgW, height: imgH });
                // Label
                const pLabel = photoList[pIdx].label || `Photograph ${pIdx + 1}`;
                const tw = this.fontItalic.widthOfTextAtSize(pLabel, FONT_SIZE_CAPTION);
                this.page.drawText(this.sanitizeText(pLabel), {
                  x: curX + (cellW - tw) / 2,
                  y: rowY - cellH + 6,
                  size: FONT_SIZE_CAPTION,
                  font: this.fontItalic,
                  color: rgb(0, 0, 0),
                });
              }
            } catch {}
          }
        }
        this.cursorY += cellH + 10;
      }
    }

    // =========================================================================
    // PAGE 8: LOCATIONAL DIAGRAM — one per page
    // =========================================================================

    // --- Location Maps ---
    const allLocMaps = images.locationMaps || [];
    for (let mi = 0; mi < Math.max(allLocMaps.length, 1); mi++) {
      this.addPage();
      this.drawRow([{ text: 'LOCATIONAL DIAGRAM WITH GPS CO-ORDINATES', width: W, isHeader: true, bold: true }], 20, 4);
      this.cursorY += 8;
      const locMapBytes = allLocMaps[mi];
      const locMapH = 520;
      const locMapY = this.pdfY(this.cursorY);
      this.page.drawRectangle({ x: MARGIN_L, y: locMapY - locMapH, width: W, height: locMapH, borderColor: rgb(0, 0, 0), borderWidth: BORDER_W });
      if (locMapBytes) {
        try {
          let lmImg: any = null;
          try { lmImg = await this.doc.embedJpg(locMapBytes); } catch { /* ignore */ }
          if (!lmImg) { try { lmImg = await this.doc.embedPng(locMapBytes); } catch { /* ignore */ } }
          if (lmImg) {
            const scale = Math.min(W / lmImg.width, locMapH / lmImg.height);
            const iW = lmImg.width * scale; const iH = lmImg.height * scale;
            this.page.drawImage(lmImg, { x: MARGIN_L + (W - iW) / 2, y: locMapY - locMapH + (locMapH - iH) / 2, width: iW, height: iH });
          }
        } catch {}
      }
      this.cursorY += locMapH;
    }

    // =========================================================================
    // PAGE 9: CADASTRAL MAP — one per page
    // =========================================================================
    const allCadMaps = images.cadastralMaps || [];
    for (let ci = 0; ci < Math.max(allCadMaps.length, 1); ci++) {
      this.addPage();
      this.drawRow([{ text: 'CADASTRAL MAP', width: W, isHeader: true, bold: true }], 20, 4);
      this.cursorY += 10;
      const cadMapBytes = allCadMaps[ci];
      const cadMapH = 520;
      const cadMapY = this.pdfY(this.cursorY);
      this.page.drawRectangle({ x: MARGIN_L, y: cadMapY - cadMapH, width: W, height: cadMapH, borderColor: rgb(0, 0, 0), borderWidth: BORDER_W });
      if (cadMapBytes) {
        try {
          let cmImg: any = null;
          try { cmImg = await this.doc.embedJpg(cadMapBytes); } catch { /* ignore */ }
          if (!cmImg) { try { cmImg = await this.doc.embedPng(cadMapBytes); } catch { /* ignore */ } }
          if (cmImg) {
            const scale = Math.min(W / cmImg.width, cadMapH / cmImg.height);
            const iW = cmImg.width * scale; const iH = cmImg.height * scale;
            this.page.drawImage(cmImg, { x: MARGIN_L + (W - iW) / 2, y: cadMapY - cadMapH + (cadMapH - iH) / 2, width: iW, height: iH });
          }
        } catch {}
      }
      this.cursorY += cadMapH;
    }

    // --- Sketch Maps — one per page ---
    const allSketchMaps = images.sketchMaps || [];
    for (let si = 0; si < allSketchMaps.length; si++) {
      this.addPage();
      this.drawRow([{ text: 'SKETCH MAP', width: W, isHeader: true, bold: true }], 20, 4);
      this.cursorY += 10;
      const sketchBytes = allSketchMaps[si];
      const sketchH = 520;
      const sketchY = this.pdfY(this.cursorY);
      this.page.drawRectangle({ x: MARGIN_L, y: sketchY - sketchH, width: W, height: sketchH, borderColor: rgb(0, 0, 0), borderWidth: BORDER_W });
      if (sketchBytes) {
        try {
          let smImg: any = null;
          try { smImg = await this.doc.embedJpg(sketchBytes); } catch { /* ignore */ }
          if (!smImg) { try { smImg = await this.doc.embedPng(sketchBytes); } catch { /* ignore */ } }
          if (smImg) {
            const scale = Math.min(W / smImg.width, sketchH / smImg.height);
            const iW = smImg.width * scale; const iH = smImg.height * scale;
            this.page.drawImage(smImg, { x: MARGIN_L + (W - iW) / 2, y: sketchY - sketchH + (sketchH - iH) / 2, width: iW, height: iH });
          }
        } catch {}
      }
      this.cursorY += sketchH;
    }

    // --- Benchmark Valuation — last, one per page, before Checklist ---
    const allBenchImages = images.benchmarkImages || [];
    for (let bi = 0; bi < Math.max(allBenchImages.length, 1); bi++) {
      this.addPage();
      this.drawRow([{ text: 'BENCHMARK VALUATION', width: W, isHeader: true, bold: true }], 20, 4);
      this.cursorY += 8;
      const benchBytes = allBenchImages[bi];
      const benchH = 520;
      const benchY = this.pdfY(this.cursorY);
      this.page.drawRectangle({ x: MARGIN_L, y: benchY - benchH, width: W, height: benchH, borderColor: rgb(0, 0, 0), borderWidth: BORDER_W });
      if (benchBytes) {
        try {
          let bmImg: any = null;
          try { bmImg = await this.doc.embedJpg(benchBytes); } catch { /* ignore */ }
          if (!bmImg) { try { bmImg = await this.doc.embedPng(benchBytes); } catch { /* ignore */ } }
          if (bmImg) {
            const scale = Math.min(W / bmImg.width, benchH / bmImg.height);
            const iW = bmImg.width * scale; const iH = bmImg.height * scale;
            this.page.drawImage(bmImg, { x: MARGIN_L + (W - iW) / 2, y: benchY - benchH + (benchH - iH) / 2, width: iW, height: iH });
          }
        } catch {}
      }
      this.cursorY += benchH;
    }

    // =========================================================================
    // PAGE 10: VALUATION REPORT CHECKLIST & SIGNATURE BLOCK
    // =========================================================================
    this.addPage();

    const chkTitle = 'VALUATION REPORT CHECK LIST';
    const chkTw = this.fontBold.widthOfTextAtSize(chkTitle, FONT_SIZE_TITLE);
    this.page.drawText(chkTitle, {
      x: MARGIN_L + (W - chkTw) / 2,
      y: this.pdfY(this.cursorY) - 10,
      size: FONT_SIZE_TITLE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 16;

    // Subtitle
    const chkSub = `(FOR THE PROPERTY VALUATION OF LAND & BUILDING BEARING KHATA NO: 405/107, PLOT NO: 191/1095, TOTAL AREA AC.0.013 DEC I.E. 566.00 SFT, KISSAM: GHARABARI, MOUZA: ACHHULI, PS- PURUSOTTAMPUR, NO-223, TS: PURUSOTTAMPUR NO-139, DIST- GANJAM, ODISHA.`;
    const chkSubLines = this.wrapText(this.sanitizeText(chkSub), W, 7.5, false);
    let csOff = 0;
    for (const csl of chkSubLines) {
      const cslTw = this.fontRegular.widthOfTextAtSize(csl, 7.5);
      this.page.drawText(csl, {
        x: MARGIN_L + (W - cslTw) / 2,
        y: this.pdfY(this.cursorY) - 8 - csOff,
        size: 7.5,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });
      csOff += 7.5 * LINE_HEIGHT;
    }
    this.cursorY += chkSubLines.length * 7.5 * LINE_HEIGHT + 4;

    const noticeText = 'Please ensure that the following important points are in order in the submitted report.';
    const nTw = this.fontItalic.widthOfTextAtSize(noticeText, 8.5);
    this.page.drawText(noticeText, {
      x: MARGIN_L + (W - nTw) / 2,
      y: this.pdfY(this.cursorY) - 8,
      size: 8.5,
      font: this.fontItalic,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 14;

    // 12 Checklist Items
    const checklistItems = [
      {
        id: '1',
        title: 'FULL NAMES OF ALL PROPERTY OWNERS ARE MENTIONED. ADDRESS OF THE PROPERTY IS MENTIONED AND IS SAME AS LATEST TITLE DEED :',
        defaultResp: 'YES.',
      },
      {
        id: '2',
        title: 'BOUNDARIES OF THE PROPERTY ARE MENTIONED AS PER BOTH, TITLE DEED AND ACTUAL OBSERVATIONS :',
        defaultResp: 'YES.',
      },
      {
        id: '3',
        title: 'CLEARLY MENTIONED THAT PROPERTY HAS BEEN IDENTIFIED BY THE BORROWER ON HIS OWN BASED ON THE ADDRESS :',
        defaultResp: 'YES.',
      },
      {
        id: '4',
        title: 'TYPE OF PROPERTY IS CLEARLY MENTIONED (AMONGEST AGRICULTURAL, RESIDENTIAL, COMMERCIAL, INDUSTRIAL ETC.):',
        defaultResp: 'YES.',
      },
      {
        id: '5',
        title: 'IF LAND, CLEARLY MENTIONED WHETHER THE LAND IS LAND BLOCKED PLOT OR INDEPENDENT LAND :\n• ONLY "YES" OR "NO" SHOULD BE MENTIONED. "NOT APPLICABLE" SHOULD NOT BE MENTIONED HERE.',
        defaultResp: 'YES.',
      },
      {
        id: '6',
        title: 'IF VACANT LAND, CLEARLY MENTIONED THAT PROPER DEMARCATION AND FENCING HAS BEEN DONE:',
        defaultResp: 'YES.',
      },
      {
        id: '7',
        title: 'IF BUILDING, CLEARLY MENTIONED THAT CONSTRUCTION HAS BEEN DONE ACCORDING TO THE BUILDING PLAN APPROVAL:\n• IF NOT, DEVIATION SHOULD BE CLEARLY SPECIFIED:',
        defaultResp: 'NO',
      },
      {
        id: '8',
        title: 'IF BUILDING, CLEARLY MENTIONED THAT BUILDING USE/COMPLETION CERTIFICATE HAS BEEN OBTAINED FROM COMPETENT AUTHORITY',
        defaultResp: 'NO.',
      },
      {
        id: '9',
        title: 'CLEARLY MENTIONED WHETHER ACCESS TO THE PROPERTY IS AVAILABLE\n• ONLY "YES" OR "NO" SHOULD BE MENTIONED. "NOT APPLICABLE" SHOULD NOT BE MENTIONED HERE :',
        defaultResp: 'YES.',
      },
      {
        id: '10',
        title: 'BASIS FOR ARRIVING AT GOVERNMENT VALUE HAS BEEN MENTIONED AND NECESSARY DOCUMENTS HAVE BEEN ENCLOSED :',
        defaultResp: 'YES.',
      },
      {
        id: '11',
        title: 'WHETHER THE SITE IS SITUATED ABOVE THE WATER TANK LEVEL. IF THE SAME IS BELOW THE WATER TANK LEVEL, THEN THE NEGATIVE EFFECT ON THE VALUATION OF THE SITE BE MENTIONED.',
        defaultResp: 'NO.',
      },
      {
        id: '12',
        title: 'ANY HIGH TENSION ELECTRICITY WIRES ARE PASSING ABOVE THE SITE. IF SO, WHAT SHALL BE THE NEGATIVE EFFECT ON THE VALUATION OF THE SITE',
        defaultResp: 'NO.',
      },
    ];

    const responses = fields.checklistResponses || {};

    for (const item of checklistItems) {
      const resp = responses[item.id] || responses[`q${item.id}`] || item.defaultResp;
      const tLines = this.wrapText(this.sanitizeText(`${item.id}.  ${item.title}`), W - 15, 7.5, false);

      let off = 0;
      for (const tl of tLines) {
        this.page.drawText(tl, {
          x: MARGIN_L + 6,
          y: this.pdfY(this.cursorY) - 7 - off,
          size: 7.5,
          font: this.fontRegular,
          color: rgb(0, 0, 0),
        });
        off += 7.5 * LINE_HEIGHT;
      }
      this.cursorY += tLines.length * 7.5 * LINE_HEIGHT + 1;

      // Bullet Response
      this.page.drawText('•', {
        x: MARGIN_L + 20,
        y: this.pdfY(this.cursorY) - 7,
        size: 7.5,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      this.page.drawText(this.sanitizeText(resp), {
        x: MARGIN_L + 30,
        y: this.pdfY(this.cursorY) - 7,
        size: 7.5,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      this.cursorY += 12;
    }

    this.cursorY += 10;

    // Signature Block at Bottom
    const prepBy = 'Prepared By';
    const pbTw = this.fontBold.widthOfTextAtSize(prepBy, 9);
    this.page.drawText(prepBy, {
      x: MARGIN_L + (W - pbTw) / 2,
      y: this.pdfY(this.cursorY) - 8,
      size: 9,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 14;

    const sigDetails = [
      { text: 'Er. Satyajit Mohanty', bold: true, size: 9.5 },
      { text: 'Founder & Chief Executive | Registered Valuer | Chartered Engineer', bold: true, size: 8 },
      { text: 'Registered Valuer (Land & Building) — IBBI (Regd. No: IBBI/RV/02/2019/10594)', bold: true, size: 8 },
      { text: 'Registered Valuer (Wealth Tax Act) — Income Tax Department (Regd. No: 107/2016-17)', bold: true, size: 8 },
      { text: 'Corporate Member & Chartered Engineer — Institution of Engineers (India), Civil Division (M-1560969)', bold: false, size: 7.5 },
      { text: 'Fellow Member — Institution of Valuers (IOV), Delhi (F-26377) & IIV, Pune (F-4443)', bold: false, size: 7.5 },
      { text: 'B.E. (Civil) Utkal University | M.Tech (Civil) | M.Sc. (Real Estate Valuation) | MBA (HR)', bold: false, size: 7.5 },
      { text: 'Empanelled Valuer of Axis Bank', bold: true, size: 8.5 },
    ];

    for (const sd of sigDetails) {
      const sFont = sd.bold ? this.fontBold : this.fontRegular;
      const sTw = sFont.widthOfTextAtSize(sd.text, sd.size);
      this.page.drawText(sd.text, {
        x: MARGIN_L + (W - sTw) / 2,
        y: this.pdfY(this.cursorY) - 8,
        size: sd.size,
        font: sFont,
        color: rgb(0, 0, 0),
      });
      this.cursorY += 11;
    }

    return await this.save();
  }
}

export default PDFAxisAgriRenderer;
