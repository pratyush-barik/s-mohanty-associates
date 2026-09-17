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
} from '../pdf-bank-renderer';
import { BaseReportFields } from '../bank-fields';

export interface AxisHLLAPBUAFloor {
  floor: string;
  area: string;
}

export interface AxisHLLAPReportFields extends Partial<BaseReportFields> {
  // Header
  refNo: string;
  reportDate: string;

  // 1. Customer Details
  customerName: string;
  customerContactDetails: string;

  // 2. APP ID
  appId: string;

  // 3. Documents Provided
  documentsProvided: string;

  // 4. Property Details
  propertyDetailsHeader: string;
  plotNo: string;
  khataNo: string;
  locality: string;
  road: string;
  city: string;
  district: string;
  pinCode: string;
  nearbyLandMark: string;
  distanceFromCityCenter: string;
  availabilityOfLocalTransport: string;
  levelOfLand: string;
  classOfLocality: string;
  qualityOfInfrastructure: string;

  // 4n. Boundaries (Deed, Actual, and optional Sketch Map)
  boundaryEastDeed: string;
  boundaryEastActual: string;
  boundaryWestDeed: string;
  boundaryWestActual: string;
  boundaryNorthDeed: string;
  boundaryNorthActual: string;
  boundarySouthDeed: string;
  boundarySouthActual: string;

  boundaryEastSketch?: string;
  boundaryWestSketch?: string;
  boundaryNorthSketch?: string;
  boundarySouthSketch?: string;

  // 4o - 4z
  boundariesMatch: string;
  statusOfLand: string;
  typeOfProperty: string;
  approvedUsage: string;
  actualUsage: string;
  typeOfStructure: string;
  noOfFloors: string;
  occupancyDetails: string;
  hasElectricityWaterDrainage: string;
  proximityToCivicAmenities: string;
  developmentOfSurroundingArea: string;
  latitude: string;
  longitude: string;

  // 5. APPROVAL DETAILS
  approvedPlanDetails?: string;
  layoutApprovalNo: string;
  layoutApprovalDate: string;
  layoutExpiryDate: string;
  buildingPlanApprovalNo: string;
  buildingPlanApprovalDate: string;
  buildingPlanExpiryDate: string;
  constructionCommencementDate: string;
  expectedCompletionDate: string;

  // 6. CONSTRUCTION DETAILS
  plotOrFlat?: 'Plot' | 'Flat' | string;
  plotAreaDocs: string;
  demarcationAtSite: string;
  approvedBUATotal: string;
  approvedBUAFloors: AxisHLLAPBUAFloor[];
  measuredBUATotal: string;
  measuredBUAFloors: AxisHLLAPBUAFloor[];
  isConstructionAsPerPlan: string;
  detailsOfExtraConstruction: string;
  sideMarginFront: string;
  sideMarginRight: string;
  sideMarginLeft: string;
  sideMarginBack: string;
  qualityOfConstruction: string;
  maintenanceOfProperty: string;
  currentLifeOfStructure: string;
  projectedLifeOfStructure: string;

  // 7. Recommended Valuation of the Property
  recommendedRatePerSqft: string;
  plotAreaForValuation: string;
  plotRateForValuation: string;
  valueOfPlotFlat: string;
  constructionRatePerSqft?: string;
  proposedStructureType?: string;
  estimatedCostOfConstruction: string;
  totalCostOfConstruction: string;
  isUnderConstruction?: boolean;
  constructionCostAsOnDate?: string;
  stageOfConstruction: string;
  percentWorkCompleted: string;
  percentDisbursementRecommended: string;
  currentValueOfProperty: string;
  currentValueAsOnDate?: string;
  dateOfPropertyVisit: string;

  // 8 - 12
  valuationGovtReckonerRate: string;
  distressedPercentage?: string;
  distressedValuation: string;
  rentalValuePerMonth: string;
  photosAttached: string;
  locationSketchAttached: string;
  remarks: string;

  // Signatory
  valuerName?: string;
  valuerTitle?: string;
}

const TABLE_FONT_SIZE = FONT_SIZE; // Standardized to 12 pt
const TABLE_FONT_SIZE_HEADER = FONT_SIZE_HEADER; // Standardized to 14 pt
const TABLE_MIN_ROW_H = 16;

export class PDFAxisHLLAPRenderer extends PDFBankRenderer {
  private colSl = 36;
  private colLbl = 222;
  private colVal = CONTENT_W - 36 - 222; // 229.28 (Total = 487.28 = CONTENT_W)

  /**
   * Draw standard 3-column table row: [Sl.No | Label | Value]
   */
  private drawHLLAPRow(
    sl: string,
    label: string,
    val: string,
    isLabelBold: boolean = false,
    isValueBold: boolean = false,
    labelBg: string | undefined = LBL_BG,
    valBg: string | undefined = LBL_BG,
    fontSize: number = TABLE_FONT_SIZE
  ): void {
    const valText = val ?? '';
    const hSl = this.cellHeight(sl, this.colSl, { bold: isLabelBold, fontSize });
    const hLbl = this.cellHeight(label, this.colLbl, { bold: isLabelBold, fontSize });
    const hVal = this.cellHeight(valText, this.colVal, { bold: isValueBold, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hSl, hLbl, hVal);

    this.checkPageBreak(rowH);

    // 1. Sl.No cell
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, sl, {
      bold: isLabelBold,
      fontSize,
      fillColor: labelBg,
      bgOpacity: labelBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'middle',
    });

    // 2. Label cell
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rowH, label, {
      bold: isLabelBold,
      fontSize,
      fillColor: labelBg,
      bgOpacity: labelBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'middle',
    });

    // 3. Value cell (uniform background color applied across all answer cells)
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, rowH, valText, {
      bold: isValueBold,
      fontSize,
      fillColor: valBg,
      bgOpacity: valBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'middle',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw a row with rich text segments in the label cell (e.g. bolding "Plot" or "Flat")
   */
  private drawHLLAPRichLabelRow(
    sl: string,
    labelSegments: { text: string; bold?: boolean; italic?: boolean }[],
    val: string,
    isValueBold: boolean = false,
    labelBg: string | undefined = LBL_BG,
    valBg: string | undefined = LBL_BG,
    fontSize: number = TABLE_FONT_SIZE
  ): void {
    const fullLabelText = labelSegments.map(s => s.text).join('');
    const valText = val ?? '';
    const hSl = this.cellHeight(sl, this.colSl, { bold: false, fontSize });
    const hLbl = this.cellHeight(fullLabelText, this.colLbl, { bold: false, fontSize });
    const hVal = this.cellHeight(valText, this.colVal, { bold: isValueBold, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hSl, hLbl, hVal);

    this.checkPageBreak(rowH);

    // 1. Sl.No cell
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, sl, {
      bold: false,
      fontSize,
      fillColor: labelBg,
      bgOpacity: labelBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'middle',
    });

    // 2. Rich Label cell
    if (labelBg) {
      this.drawRect(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rowH, labelBg, undefined, undefined, 0.5);
    }
    this.drawRect(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rowH, undefined, '#000000', 0.5);

    const pad = 4;
    const textX = MARGIN_L + this.colSl + pad;
    const textMaxWidth = this.colLbl - pad * 2;
    const lineH = fontSize * LINE_HEIGHT;
    const linesCount = Math.max(1, this.wrapText(fullLabelText, textMaxWidth, fontSize, false).length);
    const textTotalH = linesCount * lineH;
    const textTopY = rowH > textTotalH + pad ? this.cursorY + (rowH - textTotalH) / 2 : this.cursorY + pad;
    this.drawRichTextAt(labelSegments, textX, textTopY, textMaxWidth, fontSize);

    // 3. Value cell
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, rowH, valText, {
      bold: isValueBold,
      fontSize,
      fillColor: valBg,
      bgOpacity: valBg ? 0.5 : undefined,
      align: 'left',
      vAlign: 'middle',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw a sub-item row where Sl.No is blank (preserves 3-column grid alignment)
   */
  private drawSubItemRow(
    label: string,
    val: string,
    isLabelBold: boolean = false,
    isValueBold: boolean = false,
    labelBg: string | undefined = LBL_BG,
    valBg: string | undefined = LBL_BG,
    fontSize: number = TABLE_FONT_SIZE
  ): void {
    this.drawHLLAPRow('', label, val, isLabelBold, isValueBold, labelBg, valBg, fontSize);
  }

  /**
   * Draw boundary sub-row with 3 columns: [empty Sl | Deed | Actual]
   */
  private drawBoundaryRow(
    direction: string,
    deedVal: string,
    actualVal: string,
    fontSize: number = TABLE_FONT_SIZE
  ): void {
    const leftText = deedVal ? `${direction}:- ${deedVal}` : `${direction}:-`;
    const rightText = actualVal ? `${direction}:- ${actualVal}` : `${direction}:-`;

    const hLeft = this.cellHeight(leftText, this.colLbl, { bold: false, fontSize });
    const hRight = this.cellHeight(rightText, this.colVal, { bold: false, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hLeft, hRight);

    this.checkPageBreak(rowH);

    // 1. Sl col (empty)
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, '', {
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    // 2. Deed col (colLbl)
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rowH, leftText, {
      bold: false,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    // 3. Actual col (colVal)
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, rowH, rightText, {
      bold: false,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw single sketch boundary direction row [empty Sl | Sketch Direction | empty Val]
   */
  private drawSketchBoundaryDirection(direction: string, val: string, fontSize: number = TABLE_FONT_SIZE): void {
    const text = val ? `${direction}:- ${val}` : `${direction}:-`;
    const h = Math.max(TABLE_MIN_ROW_H, this.cellHeight(text, this.colLbl, { bold: false, fontSize }));

    this.checkPageBreak(h);

    // 1. Sl col (empty)
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, h, '', {
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    // 2. Sketch direction text (colLbl)
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, h, text, {
      bold: false,
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    // 3. Value cell (empty)
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, h, '', {
      fontSize,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    this.cursorY += h;
  }

  /**
   * Safe image embed helper (tries PNG then JPG)
   */
  private async embedImgSafe(bytes: Uint8Array | null): Promise<any | null> {
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
   * Main PDF Generation orchestration for Axis Bank HL-LAP
   */
  public async generateAxisHLLAPReport(
    fields: AxisHLLAPReportFields,
    images: {
      photos: { bytes: Uint8Array; label?: string }[];
      locationMaps: Uint8Array[];
      mouzaMaps: Uint8Array[];
      sketchMaps?: Uint8Array[];
      cadastralMaps?: Uint8Array[];
    },
    letterheadBytes?: Uint8Array | null
  ): Promise<Uint8Array> {
    await this.init(letterheadBytes);

    // --- Page 1: Header ---
    const refText = fields.refNo ? `Ref No: ${fields.refNo}` : 'Ref No: ';
    const dateText = `Date: ${formatReportDate(fields.reportDate || new Date().toISOString())}`;
    const titleText = 'Valuation Report Format for Bungalow/Individual House/Resale';

    // Top line with Ref No and Date
    const headerH = 14;
    const yTop = this.pdfY(this.cursorY);
    this.page.drawText(this.sanitizeText(refText), {
      x: MARGIN_L,
      y: yTop - 10,
      size: FONT_SIZE_SMALL,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    const dateW = this.fontBold.widthOfTextAtSize(this.sanitizeText(dateText), FONT_SIZE_SMALL);
    this.page.drawText(this.sanitizeText(dateText), {
      x: MARGIN_L + CONTENT_W - dateW,
      y: yTop - 10,
      size: FONT_SIZE_SMALL,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += headerH + 4;

    // Centered Title Banner (Underlined)
    const titleY = this.pdfY(this.cursorY);
    const titleW = this.fontBold.widthOfTextAtSize(titleText, FONT_SIZE_TITLE);
    const titleX = MARGIN_L + (CONTENT_W - titleW) / 2;
    this.page.drawText(titleText, {
      x: titleX,
      y: titleY - 10,
      size: FONT_SIZE_TITLE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    // Underline
    this.page.drawLine({
      start: { x: titleX, y: titleY - 12 },
      end: { x: titleX + titleW, y: titleY - 12 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 18;

    // --- Table Header: [Sl. No | (empty) | (empty)] ---
    const thH = Math.max(18, this.cellHeight('Sl. No', this.colSl, { bold: true, fontSize: 11 }));
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, thH, 'Sl. No', {
      bold: true,
      fontSize: 11,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, thH, '', {
      bold: true,
      fontSize: 11,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, thH, '', {
      bold: true,
      fontSize: 11,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += thH;

    // --- Row 1: Customer Details ---
    const custH1 = Math.max(TABLE_MIN_ROW_H, this.cellHeight(fields.customerName || '', this.colVal, { fontSize: TABLE_FONT_SIZE }));
    const custH2 = Math.max(TABLE_MIN_ROW_H, this.cellHeight(fields.customerContactDetails || '', this.colVal, { fontSize: TABLE_FONT_SIZE }));
    const totalCustH = custH1 + custH2;

    this.checkPageBreak(totalCustH);

    // Left Sl cell spanning both sub-rows
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, totalCustH, '1.', {
      bold: true,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    // Sub-row 1: Name
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, custH1, 'Name of the Customer', {
      bold: false,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, custH1, fields.customerName || '', {
      bold: false,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    // Sub-row 2: Contact
    this.drawCell(MARGIN_L + this.colSl, this.cursorY + custH1, this.colLbl, custH2, 'Customer Contact Details', {
      bold: false,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY + custH1, this.colVal, custH2, fields.customerContactDetails || '', {
      bold: false,
      fontSize: TABLE_FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += totalCustH;

    // --- Row 2: APP ID ---
    this.drawHLLAPRow('2.', 'APP ID', fields.appId || '');

    // --- Row 3: Documents Provided ---
    this.drawHLLAPRow(
      '3.',
      'Documents Provided: Approved Layout/\nApproved Building Plan/ NA order/\nFour Boundaries Details',
      fields.documentsProvided || ''
    );

    // --- Row 4: Property Details ---
    this.drawHLLAPRow('4.', 'Property Details', fields.propertyDetailsHeader || '');
    this.drawHLLAPRow('a.', 'Plot  No', fields.plotNo || '');
    this.drawHLLAPRow('b.', 'S No/G. No/Khasra No/Khata No', fields.khataNo || '');
    this.drawHLLAPRow('c.', 'Locality', fields.locality || '');
    this.drawHLLAPRow('d.', 'Road', fields.road || '');
    this.drawHLLAPRow('e.', 'City', fields.city || '');
    this.drawHLLAPRow('f.', 'District', fields.district || '');
    this.drawHLLAPRow('g.', 'Pin code', fields.pinCode || '');
    this.drawHLLAPRow('h.', 'Nearby Land Mark', fields.nearbyLandMark || '');
    this.drawHLLAPRow('i.', 'Distance from City Center', fields.distanceFromCityCenter || '');
    this.drawHLLAPRow('j.', 'Availability of Local Transport : Metro/ Local Train/ Bus', fields.availabilityOfLocalTransport || '');
    this.drawHLLAPRow('k.', 'Level of land with topographical conditions', fields.levelOfLand || '');
    this.drawHLLAPRow('l.', 'Class Of Locality :  Posh/ Higher Middle Class/Middle class/Lower middle Class/ Poor', fields.classOfLocality || '');
    this.drawHLLAPRow('m.', 'Quality of Infrastructure in the vicinity', fields.qualityOfInfrastructure || '');

    // 4n. Boundaries (Header row + 4 direction rows)
    const bLbl = 'Boundaries of Property as per documents';
    const bVal = 'Boundaries of Property as per Actual';
    const hSl = this.cellHeight('n.', this.colSl, { bold: true, fontSize: TABLE_FONT_SIZE });
    const hLbl = this.cellHeight(bLbl, this.colLbl, { bold: true, fontSize: TABLE_FONT_SIZE });
    const hVal = this.cellHeight(bVal, this.colVal, { bold: true, fontSize: TABLE_FONT_SIZE });
    const bHeaderH = Math.max(TABLE_MIN_ROW_H, hSl, hLbl, hVal);

    // Lookahead: ensure header + at least 2 direction rows fit
    this.checkPageBreak(bHeaderH + 32);

    this.drawHLLAPRow('n.', bLbl, bVal, true, true, LBL_BG, LBL_BG);

    this.drawBoundaryRow('East', fields.boundaryEastDeed || '', fields.boundaryEastActual || '');
    this.drawBoundaryRow('West', fields.boundaryWestDeed || '', fields.boundaryWestActual || '');
    this.drawBoundaryRow('North', fields.boundaryNorthDeed || '', fields.boundaryNorthActual || '');
    this.drawBoundaryRow('South', fields.boundarySouthDeed || '', fields.boundarySouthActual || '');

    // Optional: Boundaries of Property as per sketch map
    const hasSketchBoundaries = !!(
      fields.boundaryEastSketch ||
      fields.boundaryWestSketch ||
      fields.boundaryNorthSketch ||
      fields.boundarySouthSketch
    );
    if (hasSketchBoundaries) {
      this.checkPageBreak(65);
      const sketchHdrH = Math.max(
        TABLE_MIN_ROW_H,
        this.cellHeight('Boundaries of Property as per sketch map', this.colLbl, { bold: true, fontSize: TABLE_FONT_SIZE })
      );
      this.drawCell(MARGIN_L, this.cursorY, this.colSl, sketchHdrH, '', {
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, sketchHdrH, 'Boundaries of Property as per sketch map', {
        bold: true,
        fontSize: TABLE_FONT_SIZE,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, sketchHdrH, '', {
        fontSize: TABLE_FONT_SIZE,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'middle',
      });
      this.cursorY += sketchHdrH;

      this.drawSketchBoundaryDirection('East', fields.boundaryEastSketch || '');
      this.drawSketchBoundaryDirection('West', fields.boundaryWestSketch || '');
      this.drawSketchBoundaryDirection('North', fields.boundaryNorthSketch || '');
      this.drawSketchBoundaryDirection('South', fields.boundarySouthSketch || '');
    }

    // 4o - 4y
    this.drawHLLAPRow('o.', 'Does the Boundaries at Site match, as mentioned in documentation?', fields.boundariesMatch || '');
    this.drawHLLAPRow('p.', 'Status of the Land/ Flat : Free Hold/Leased / Development Authority', fields.statusOfLand || '');
    this.drawHLLAPRow('q.', 'Type of Property : Bungalow/row house/Plot/ flat (1BHK/2BHK/3BHK)/Residential', fields.typeOfProperty || '');
    this.drawHLLAPRow('r.', 'Approved usage of Property: Agri/ Mix /Industrial/commercial/Residential (Restrictive covenants in regards to Land Use, if any)', fields.approvedUsage || '');
    this.drawHLLAPRow('s.', 'Actual Usage of the Property :Agri/Industrial/commercial/Residential/Mix', fields.actualUsage || '');
    this.drawHLLAPRow('t.', 'Type of Structure : Load Bearing/RCC/Aluform shuttering', fields.typeOfStructure || '');
    this.drawHLLAPRow('u.', 'No of Floors', fields.noOfFloors || '');
    this.drawHLLAPRow('v.', 'Occupancy Details: Self Occupied/Rented/ Vacant', fields.occupancyDetails || '');
    this.drawHLLAPRow('w.', 'Does property have Electricity / Water / Drainage connection', fields.hasElectricityWaterDrainage || '');
    this.drawHLLAPRow('x.', 'Proximity to civic amenities like school, hospital, market, etc', fields.proximityToCivicAmenities || '');
    this.drawHLLAPRow('y.', 'Development of surrounding area', fields.developmentOfSurroundingArea || '');

    // 4z. Longitude & Latitude
    this.checkPageBreak(45);
    this.drawHLLAPRow('z.', 'Longitude & latitude of the property', '');
    this.drawHLLAPRow('i.', 'Longitude', fields.longitude || '', false, true);
    this.drawHLLAPRow('ii.', 'Latitude', fields.latitude || '', false, true);

    // --- Row 5: APPROVAL DETAILS ---
    this.checkPageBreak(65);
    this.drawHLLAPRow('5.', 'APPROVAL DETAILS', fields.approvedPlanDetails || fields.buildingPlanApprovalNo || '', true, true);
    this.drawHLLAPRow('a.', 'Layout Approval No', fields.layoutApprovalNo || '');
    this.drawHLLAPRow('b.', 'Date of Approval', fields.layoutApprovalDate ? formatReportDate(fields.layoutApprovalDate) : '');
    this.drawHLLAPRow('c.', 'Expiry Date', fields.layoutExpiryDate ? formatReportDate(fields.layoutExpiryDate) : '');
    this.drawHLLAPRow('d.', 'Building Plan Approval No', fields.buildingPlanApprovalNo || '');
    this.drawHLLAPRow('e.', 'Date of Approval', fields.buildingPlanApprovalDate ? formatReportDate(fields.buildingPlanApprovalDate) : '');
    this.drawHLLAPRow('f.', 'Expiry Date', fields.buildingPlanExpiryDate ? formatReportDate(fields.buildingPlanExpiryDate) : '');
    this.drawHLLAPRow('g.', 'Date of Commencement of Construction', fields.constructionCommencementDate ? formatReportDate(fields.constructionCommencementDate) : '');
    this.drawHLLAPRow('h.', 'Expected Completion', fields.expectedCompletionDate ? formatReportDate(fields.expectedCompletionDate) : '');

    // --- Row 6: CONSTRUCTION DETAILS ---
    this.checkPageBreak(55);
    this.drawHLLAPRow('6.', 'CONSTRUCTION DETAILS', '', true, true);
    
    const isFlat = (fields.plotOrFlat || '').toLowerCase() === 'flat';
    const areaSegments = isFlat
      ? [
          { text: 'Area of the Plot/' },
          { text: 'flat', bold: true },
        ]
      : [
          { text: 'Area of the ' },
          { text: 'Plot', bold: true },
          { text: '/flat' },
        ];
    this.drawHLLAPRichLabelRow('a.', areaSegments, fields.plotAreaDocs || '', true);
    this.drawHLLAPRow('b.', 'Demarcation at Site', fields.demarcationAtSite || '');

    // 6c. Approved Built up Area & Floor-wise break up
    this.checkPageBreak(35);
    const appBUALabel = 'Approved Built up Area:_____sqft floor wise break up (for Bungalow/Twin /Row-house) as follows';
    const appBUAVal = fields.approvedBUATotal ? `Approved BUA-${fields.approvedBUATotal}sqft` : '';
    this.drawHLLAPRow('c.', appBUALabel, appBUAVal, true, true);
    if (fields.approvedBUAFloors && fields.approvedBUAFloors.length > 0) {
      for (const fl of fields.approvedBUAFloors) {
        if (fl.floor || fl.area) {
          this.drawSubItemRow(fl.floor || 'Floor', fl.area ? `${fl.area}sqft` : '', false, true);
        }
      }
    }

    // 6d. Measured Built up Area & Floor-wise break up
    this.checkPageBreak(35);
    const measBUALabel = 'Measured Built up Area:_____sqft floor wise break up (for Bungalow/Twin /Row-house) as follows';
    const measBUAVal = fields.measuredBUATotal ? `Measured BUA-${fields.measuredBUATotal}sqft` : '';
    this.drawHLLAPRow('d.', measBUALabel, measBUAVal, true, true);
    if (fields.measuredBUAFloors && fields.measuredBUAFloors.length > 0) {
      for (const fl of fields.measuredBUAFloors) {
        if (fl.floor || fl.area) {
          this.drawSubItemRow(fl.floor || 'Floor', fl.area ? `${fl.area}sqft` : '', false, true);
        }
      }
    }

    this.drawHLLAPRow('e.', 'Whether the construction is as per approved building plan and / or local building bye laws', fields.isConstructionAsPerPlan || '');
    this.drawHLLAPRow('f.', 'Details of Extra Construction', fields.detailsOfExtraConstruction || '');

    // 6g. Recommended / Available Side Margin
    this.checkPageBreak(65);
    this.drawHLLAPRow('g.', 'Recommended / Available Side Margin', '');
    this.drawSubItemRow('Front', fields.sideMarginFront || '');
    this.drawSubItemRow('Right Side', fields.sideMarginRight || '');
    this.drawSubItemRow('Left Side', fields.sideMarginLeft || '');
    this.drawSubItemRow('Back Side', fields.sideMarginBack || '');

    this.drawHLLAPRow('h.', 'Quality of construction', fields.qualityOfConstruction || '');
    this.drawHLLAPRow('i.', 'Maintenance of the Property: excellent/very good/average/poor', fields.maintenanceOfProperty || '');
    this.drawHLLAPRow('j.', 'Current Life of the structure', fields.currentLifeOfStructure || '');
    this.drawHLLAPRow('k.', 'Projected Life of the Structure', fields.projectedLifeOfStructure || '');

    // --- Row 7: Recommended Valuation of the Property ---
    this.checkPageBreak(55);
    this.drawHLLAPRow('7.', 'Recommended Valuation of the Property', '', true, true);

    const rateSegments = isFlat
      ? [
          { text: 'Recommended rate of the Plot/' },
          { text: 'Flat', bold: true },
        ]
      : [
          { text: 'Recommended rate of the ' },
          { text: 'Plot', bold: true },
          { text: '/Flat' },
        ];
    this.drawHLLAPRichLabelRow('a.', rateSegments, fields.recommendedRatePerSqft || '', false);

    const valSegments = isFlat
      ? [
          { text: 'Value of the Plot/' },
          { text: 'Flat', bold: true },
        ]
      : [
          { text: 'Value of the ' },
          { text: 'Plot', bold: true },
          { text: '/Flat' },
        ];
    this.drawHLLAPRichLabelRow('b.', valSegments, fields.valueOfPlotFlat || '', true);
    this.drawHLLAPRow('c.', 'Estimated Cost of construction', fields.estimatedCostOfConstruction || '', false, true);
    
    const structType = (fields.proposedStructureType || '').trim() || (fields.isUnderConstruction ? 'Proposed G+2' : 'approved G+1');
    this.drawHLLAPRow(
      'd.',
      `Total Cost of construction(${structType}) on 100% completion`,
      fields.totalCostOfConstruction || '',
      false,
      true
    );

    // If Under-Construction or percentWorkCompleted < 100, show "As on date (X%)" construction cost
    const pctNum = parseFloat(String(fields.percentWorkCompleted || '100').replace(/[^\d.]/g, '')) || 100;
    if ((fields.isUnderConstruction || pctNum < 100) && fields.constructionCostAsOnDate) {
      this.drawSubItemRow(
        `As on date (${fields.percentWorkCompleted ? (fields.percentWorkCompleted.includes('%') ? fields.percentWorkCompleted : `${fields.percentWorkCompleted}%`) : '0%'})`,
        fields.constructionCostAsOnDate,
        false,
        true
      );
    }

    this.drawHLLAPRow('e.', 'Stage of Construction', fields.stageOfConstruction || '');
    this.drawHLLAPRow('f.', '% Work completed', fields.percentWorkCompleted ? (fields.percentWorkCompleted.includes('%') ? fields.percentWorkCompleted : `${fields.percentWorkCompleted}%`) : '');
    this.drawHLLAPRow('g.', '% Disbursement Recommended', fields.percentDisbursementRecommended ? (fields.percentDisbursementRecommended.includes('%') ? fields.percentDisbursementRecommended : `${fields.percentDisbursementRecommended}%`) : '');

    // 7h. Current Value 100% completion (uniform LBL_BG cell color)
    this.drawHLLAPRow(
      'h.',
      'Current Value of the Property (Plot + construction)on 100% completion',
      fields.currentValueOfProperty || '',
      false,
      true,
      LBL_BG,
      LBL_BG
    );

    // If Under-Construction or percentWorkCompleted < 100, show "As on date X% completion" Current Value (uniform LBL_BG cell color)
    if ((fields.isUnderConstruction || pctNum < 100) && fields.currentValueAsOnDate) {
      const pctDisplay = fields.percentWorkCompleted ? (fields.percentWorkCompleted.includes('%') ? fields.percentWorkCompleted : `${fields.percentWorkCompleted}%`) : '';
      this.drawSubItemRow(
        `As on date ${pctDisplay} completion`,
        fields.currentValueAsOnDate,
        false,
        true,
        LBL_BG,
        LBL_BG
      );
    }

    this.drawHLLAPRow('i.', 'Date of Property Visit', fields.dateOfPropertyVisit || fields.reportDate ? formatReportDate(fields.dateOfPropertyVisit || fields.reportDate) : '');

    // --- Row 8: Govt Reckoner Rates ---
    this.drawHLLAPRow('8.', 'Valuation as per Government reckoner rates', fields.valuationGovtReckonerRate || '');

    // --- Row 9: Distressed Valuation (uniform LBL_BG cell color) ---
    this.drawHLLAPRow('9.', 'Distressed valuation of the Property', fields.distressedValuation || '', true, true, LBL_BG, LBL_BG);

    // --- Row 10: Rental Value ---
    this.drawHLLAPRow('10.', 'Rental value per month', fields.rentalValuePerMonth || '');

    // --- Row 11: Attachment ---
    this.drawHLLAPRow('11.', 'Attachment', '');
    this.drawHLLAPRow('a.', '4 photos of the Property from inside/outside are attached', fields.photosAttached || '');
    this.drawHLLAPRow('b.', 'Location sketch for the property', fields.locationSketchAttached || '');

    // --- Row 12: Remarks ---
    const remarksPrompt =
      '(Comment on - resistance for valuation if any from the current occupants for rented property, if the property falls in a community dominated areas, if the approach road to the building is small and will not be able to accommodate a fire extinguisher, does the property falls under land locked area or is prone to frequent floods & any other critical observation.)';

    const hPrompt = this.cellHeight(remarksPrompt, this.colLbl, { fontSize: FONT_SIZE });
    const hRemarks = this.cellHeight(fields.remarks || '', this.colVal, { fontSize: FONT_SIZE });
    const remarksRowH = Math.max(45, hPrompt, hRemarks);

    this.checkPageBreak(16 + remarksRowH);

    // Draw row 12 header
    this.drawHLLAPRow('12.', 'Remarks :', '', true, true);

    // Draw remarks content (Left: Prompt in colLbl, Right: Valuer remarks in colVal)
    // 1. Sl col (empty)
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, remarksRowH, '', {
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    // 2. Prompt in colLbl
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, remarksRowH, remarksPrompt, {
      bold: false,
      fontSize: FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    // 3. Valuer Remarks in colVal
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, remarksRowH, fields.remarks || '', {
      bold: false,
      fontSize: FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    this.cursorY += remarksRowH;

    // --- Undertaking Block (Full width across page) ---
    this.cursorY += 12;
    const undertakingH = 120;
    this.checkPageBreak(undertakingH);

    // Section title "Undertaking:"
    this.drawTextAt('Undertaking:', MARGIN_L, this.cursorY, {
      bold: true,
      fontSize: FONT_SIZE_HEADER,
    });
    this.cursorY += 16;

    const undertakingClauses = [
      'I have personally visited the property & identified the same based on the documents provided.',
      'I/We have no direct or Indirect Interest in the property being valued.',
      'The information furnished above is true and correct to my/our knowledge.',
    ];

    for (const clause of undertakingClauses) {
      const wrapped = this.wrapText(clause, CONTENT_W, FONT_SIZE, false);
      for (const wLine of wrapped) {
        this.drawTextAt(wLine, MARGIN_L, this.cursorY, {
          bold: false,
          fontSize: FONT_SIZE,
        });
        this.cursorY += FONT_SIZE * LINE_HEIGHT;
      }
    }

    this.cursorY += 16;

    // Authorized Signatory Block (Right-aligned matching base bank format)
    const sigLines = [
      { text: 'Authorized Signatory', bold: true, fontSize: FONT_SIZE },
      { text: 'Name & Seal of the Agency', bold: false, fontSize: FONT_SIZE },
      { text: fields.valuerName || 'Er. Satyajit Mohanty', bold: true, fontSize: FONT_SIZE },
      { text: fields.valuerTitle || 'Approved Panel Valuer', bold: false, fontSize: FONT_SIZE },
    ];

    for (const s of sigLines) {
      this.drawTextAt(s.text, MARGIN_L, this.cursorY, {
        bold: s.bold,
        fontSize: s.fontSize,
        align: 'right',
        maxWidth: CONTENT_W,
      });
      this.cursorY += s.fontSize * 1.25;
    }

    // --- Page 3+: Photographs & Maps Pages (Only if media exists) ---
    await this.drawPhotosAndMaps(fields, images);

    return await this.save();
  }

  /**
   * Draw an embedded image inside a bounding box while preserving its natural aspect ratio.
   * Prevents stretching or distortion, and centers the image within the container.
   */
  private drawImageContained(
    img: PDFImage,
    boxX: number,
    boxY: number,
    boxW: number,
    boxH: number,
    drawBorder: boolean = true
  ) {
    if (drawBorder) {
      this.page.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxW,
        height: boxH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });
    }

    const availW = Math.max(10, boxW - 2);
    const availH = Math.max(10, boxH - 2);
    const imgRatio = img.width / img.height;
    const boxRatio = availW / availH;
    let drawW = availW;
    let drawH = availH;

    if (imgRatio > boxRatio) {
      // Image is wider than container: constrain by width
      drawW = availW;
      drawH = drawW / imgRatio;
    } else {
      // Image is taller than container: constrain by height
      drawH = availH;
      drawW = drawH * imgRatio;
    }

    const drawX = boxX + 1 + (availW - drawW) / 2;
    const drawY = boxY + 1 + (availH - drawH) / 2;

    this.page.drawImage(img, {
      x: drawX,
      y: drawY,
      width: drawW,
      height: drawH,
    });
  }

  /**
   * Draw the Photographs and Maps annexures seamlessly without wasting vertical space:
   * Continues on the current page if sufficient space exists under Undertaking,
   * otherwise neatly flows across dedicated pages while strictly preserving image aspect ratios.
   */
  private async drawPhotosAndMaps(
    fields: AxisHLLAPReportFields,
    images: {
      photos: { bytes: Uint8Array; label?: string }[];
      locationMaps: Uint8Array[];
      mouzaMaps: Uint8Array[];
      sketchMaps?: Uint8Array[];
      cadastralMaps?: Uint8Array[];
    }
  ) {
    const validPhotos = (images.photos || []).filter(p => p.bytes && p.bytes.length > 0);
    const validLocMaps = (images.locationMaps || []).filter(m => m && m.length > 0);
    const allMouzaCadMaps = [...(images.mouzaMaps || []), ...(images.cadastralMaps || [])];
    const validMouzaMaps = allMouzaCadMaps.filter(m => m && m.length > 0);
    const validSketchMaps = (images.sketchMaps || []).filter(s => s && s.length > 0);

    const hasPhotos = validPhotos.length > 0;
    const hasLocMap = validLocMaps.length > 0;
    const hasMouzaMap = validMouzaMaps.length > 0;
    const hasSketchMap = validSketchMaps.length > 0;

    const totalImages = validPhotos.length + validLocMaps.length + validMouzaMaps.length + validSketchMaps.length;

    // If NO photos and NO maps are attached, do NOT generate any empty blank page!
    if (totalImages === 0) {
      return;
    }

    // Check remaining vertical height on current page after Undertaking + Signatory
    const remainingOnCurrent = PAGE_H - MARGIN_B - this.cursorY;
    const canFitOnCurrentPage = remainingOnCurrent >= 240;

    if (hasSketchMap || validPhotos.length > 4) {
      // ═════════════════════════════════════════════════════════════════
      // MODE A: MULTI-PAGE DEDICATED ANNEXURES
      // ═════════════════════════════════════════════════════════════════

      // 1. Page of Photographs
      if (hasPhotos) {
        let startY: number;
        let availablePhotoH: number;

        if (canFitOnCurrentPage) {
          // Continue on current page directly below signatory
          startY = this.pdfY(this.cursorY + 16);
          availablePhotoH = remainingOnCurrent - 30;
        } else {
          this.addPage();
          this.cursorY = MARGIN_T;
          startY = this.pdfY(this.cursorY);
          availablePhotoH = PAGE_H - MARGIN_T - MARGIN_B - 25;
        }

        const photoHeading = 'PHOTOGRAPHS';
        const photoHw = this.fontBold.widthOfTextAtSize(photoHeading, FONT_SIZE_CAPTION);
        this.page.drawText(photoHeading, { x: MARGIN_L, y: startY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0,0,0) });
        this.page.drawLine({ start: { x: MARGIN_L, y: startY - 12 }, end: { x: MARGIN_L + photoHw, y: startY - 12 }, thickness: 1, color: rgb(0,0,0) });

        const photoStartY = startY - 22;
        const pGridCols = 2;
        const pGridRows = Math.min(4, Math.ceil(validPhotos.length / pGridCols));
        const pGap = 8;
        const pW = (CONTENT_W - pGap * (pGridCols - 1)) / pGridCols;
        const pH = Math.min(180, (availablePhotoH - pGap * (pGridRows - 1)) / pGridRows);

        for (let i = 0; i < Math.min(8, validPhotos.length); i++) {
          const colIdx = i % pGridCols;
          const rowIdx = Math.floor(i / pGridCols);
          const px = MARGIN_L + colIdx * (pW + pGap);
          const py = photoStartY - rowIdx * (pH + pGap) - pH;

          const photoItem = validPhotos[i];
          const embeddedImg = await this.embedImgSafe(photoItem.bytes);

          if (embeddedImg) {
            this.drawImageContained(embeddedImg, px, py, pW, pH, true);
          } else {
            this.page.drawRectangle({
              x: px,
              y: py,
              width: pW,
              height: pH,
              borderColor: rgb(0, 0, 0),
              borderWidth: 0.5,
            });
          }
        }
      }

      // 2. Dedicated Maps Page: Mouza Map & Location Map
      if (hasMouzaMap || hasLocMap) {
        this.addPage();
        this.cursorY = MARGIN_T;
        const mapPageStartY = this.pdfY(this.cursorY);

        if (hasMouzaMap && hasLocMap) {
          const halfH = (PAGE_H - MARGIN_T - MARGIN_B - 65) / 2;

          // Top: Mouza Map
          this.page.drawText('MOUZA MAP', { x: MARGIN_L, y: mapPageStartY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0,0,0) });
          const mouzaBoxY = mapPageStartY - 20 - halfH;
          const mImg = await this.embedImgSafe(validMouzaMaps[0]);
          if (mImg) {
            this.drawImageContained(mImg, MARGIN_L, mouzaBoxY, CONTENT_W, halfH, true);
          } else {
            this.page.drawRectangle({ x: MARGIN_L, y: mouzaBoxY, width: CONTENT_W, height: halfH, borderColor: rgb(0,0,0), borderWidth: 0.5 });
          }

          // Bottom: Location Map
          const latLongStr = (fields.latitude || fields.longitude)
            ? ` (LAT: ${fields.latitude || ''}, LONG: ${fields.longitude || ''})`
            : '';
          const locHeadingText = `LOCATION MAP${latLongStr}`;
          const locBoxTop = mouzaBoxY - 20;
          this.page.drawText(this.sanitizeText(locHeadingText), { x: MARGIN_L, y: locBoxTop, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0,0,0) });
          const locBoxY = locBoxTop - 10 - halfH;
          const lImg = await this.embedImgSafe(validLocMaps[0]);
          if (lImg) {
            this.drawImageContained(lImg, MARGIN_L, locBoxY, CONTENT_W, halfH, true);
          } else {
            this.page.drawRectangle({ x: MARGIN_L, y: locBoxY, width: CONTENT_W, height: halfH, borderColor: rgb(0,0,0), borderWidth: 0.5 });
          }
        } else {
          // Single map full page height
          const fullMapH = PAGE_H - MARGIN_T - MARGIN_B - 35;
          const isMouza = hasMouzaMap;
          const heading = isMouza ? 'MOUZA MAP' : `LOCATION MAP${(fields.latitude || fields.longitude) ? ` (LAT: ${fields.latitude || ''}, LONG: ${fields.longitude || ''})` : ''}`;
          this.page.drawText(this.sanitizeText(heading), { x: MARGIN_L, y: mapPageStartY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0,0,0) });
          const boxY = mapPageStartY - 20 - fullMapH;
          const singleImg = await this.embedImgSafe(isMouza ? validMouzaMaps[0] : validLocMaps[0]);
          if (singleImg) {
            this.drawImageContained(singleImg, MARGIN_L, boxY, CONTENT_W, fullMapH, true);
          } else {
            this.page.drawRectangle({ x: MARGIN_L, y: boxY, width: CONTENT_W, height: fullMapH, borderColor: rgb(0,0,0), borderWidth: 0.5 });
          }
        }
      }

      // 3. Dedicated Sketch Map Page
      if (hasSketchMap) {
        this.addPage();
        this.cursorY = MARGIN_T;
        const sketchStartY = this.pdfY(this.cursorY);
        this.page.drawText('SKETCH MAP', { x: MARGIN_L, y: sketchStartY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0,0,0) });
        const sketchBoxH = PAGE_H - MARGIN_T - MARGIN_B - 30;
        const sketchBoxY = sketchStartY - 20 - sketchBoxH;
        const sImg = await this.embedImgSafe(validSketchMaps[0]);
        if (sImg) {
          this.drawImageContained(sImg, MARGIN_L, sketchBoxY, CONTENT_W, sketchBoxH, true);
        } else {
          this.page.drawRectangle({ x: MARGIN_L, y: sketchBoxY, width: CONTENT_W, height: sketchBoxH, borderColor: rgb(0,0,0), borderWidth: 0.5 });
        }
      }
    } else {
      // ═════════════════════════════════════════════════════════════════
      // MODE B: COMPACT ANNEXURE LAYOUT
      // ═════════════════════════════════════════════════════════════════
      let startY: number;
      let availableH: number;

      if (canFitOnCurrentPage) {
        // Continue on current page directly below signatory
        startY = this.pdfY(this.cursorY + 16);
        availableH = remainingOnCurrent - 30;
      } else {
        this.addPage();
        this.cursorY = MARGIN_T;
        startY = this.pdfY(this.cursorY);
        availableH = PAGE_H - MARGIN_T - MARGIN_B - 25;
      }

      if (hasPhotos && (hasLocMap || hasMouzaMap)) {
        // Both photos and map(s) present: 2-column layout
        const leftColW = CONTENT_W * 0.56;
        const rightColW = CONTENT_W * 0.42;
        const gap = CONTENT_W - leftColW - rightColW;
        const leftX = MARGIN_L;
        const rightX = MARGIN_L + leftColW + gap;

        // 1. LEFT COLUMN: PHOTOGRAPHS
        const photoHeading = 'PHOTOGRAPHS';
        const photoHw = this.fontBold.widthOfTextAtSize(photoHeading, FONT_SIZE_CAPTION);
        this.page.drawText(photoHeading, { x: leftX, y: startY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0, 0, 0) });
        this.page.drawLine({ start: { x: leftX, y: startY - 12 }, end: { x: leftX + photoHw, y: startY - 12 }, thickness: 1, color: rgb(0, 0, 0) });

        const photoStartY = startY - 20;
        const numPhotos = Math.min(4, validPhotos.length);
        const pGridCols = 2;
        const pGridRows = Math.min(2, Math.ceil(numPhotos / pGridCols));
        const pGap = 6;
        const pW = (leftColW - pGap * (pGridCols - 1)) / pGridCols;
        const pH = Math.min(180, (availableH - pGap * (pGridRows - 1)) / pGridRows);

        for (let i = 0; i < numPhotos; i++) {
          const colIdx = i % pGridCols;
          const rowIdx = Math.floor(i / pGridCols);
          const px = leftX + colIdx * (pW + pGap);
          const py = photoStartY - rowIdx * (pH + pGap) - pH;

          const photoItem = validPhotos[i];
          const embeddedImg = await this.embedImgSafe(photoItem.bytes);

          if (embeddedImg) {
            this.drawImageContained(embeddedImg, px, py, pW, pH, true);
          } else {
            this.page.drawRectangle({
              x: px,
              y: py,
              width: pW,
              height: pH,
              borderColor: rgb(0, 0, 0),
              borderWidth: 0.5,
            });
          }
        }

        // 2. RIGHT COLUMN: MAPS
        if (hasLocMap && hasMouzaMap) {
          const mapH = (availableH - 45) / 2;

          // Top: Location Map
          const latLongStrCompact = (fields.latitude || fields.longitude)
            ? ` (LAT: ${fields.latitude || ''}, LONG: ${fields.longitude || ''})`
            : '';
          const locHeading = `LOCATION MAP${latLongStrCompact}`;
          this.page.drawText(this.sanitizeText(locHeading), { x: rightX, y: startY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0, 0, 0) });
          const locY = startY - 20 - mapH;
          const locImg = await this.embedImgSafe(validLocMaps[0]);
          if (locImg) {
            this.drawImageContained(locImg, rightX, locY, rightColW, mapH, true);
          } else {
            this.page.drawRectangle({ x: rightX, y: locY, width: rightColW, height: mapH, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
          }

          // Bottom: Mouza Map
          const mouzaHeadingY = locY - 16;
          this.page.drawText('MOUZA MAP', { x: rightX, y: mouzaHeadingY, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0, 0, 0) });
          const mouzaY = mouzaHeadingY - 8 - mapH;
          const mouzaImg = await this.embedImgSafe(validMouzaMaps[0]);
          if (mouzaImg) {
            this.drawImageContained(mouzaImg, rightX, mouzaY, rightColW, mapH, true);
          } else {
            this.page.drawRectangle({ x: rightX, y: mouzaY, width: rightColW, height: mapH, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
          }
        } else {
          // Single map on right column
          const singleMapH = availableH - 25;
          const isMouza = hasMouzaMap;
          const heading = isMouza ? 'MOUZA MAP' : `LOCATION MAP${(fields.latitude || fields.longitude) ? ` (LAT: ${fields.latitude || ''}, LONG: ${fields.longitude || ''})` : ''}`;
          this.page.drawText(this.sanitizeText(heading), { x: rightX, y: startY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0, 0, 0) });
          const mapY = startY - 20 - singleMapH;
          const singleMapImg = await this.embedImgSafe(isMouza ? validMouzaMaps[0] : validLocMaps[0]);
          if (singleMapImg) {
            this.drawImageContained(singleMapImg, rightX, mapY, rightColW, singleMapH, true);
          } else {
            this.page.drawRectangle({ x: rightX, y: mapY, width: rightColW, height: singleMapH, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
          }
        }
      } else if (hasPhotos) {
        // ONLY Photos present: Full-width grid (2 columns across CONTENT_W)
        const photoHeading = 'PHOTOGRAPHS';
        const photoHw = this.fontBold.widthOfTextAtSize(photoHeading, FONT_SIZE_CAPTION);
        this.page.drawText(photoHeading, { x: MARGIN_L, y: startY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0, 0, 0) });
        this.page.drawLine({ start: { x: MARGIN_L, y: startY - 12 }, end: { x: MARGIN_L + photoHw, y: startY - 12 }, thickness: 1, color: rgb(0, 0, 0) });

        const photoStartY = startY - 22;
        const pGridCols = 2;
        const pGridRows = Math.min(2, Math.ceil(validPhotos.length / pGridCols));
        const pGap = 12;
        const pW = (CONTENT_W - pGap * (pGridCols - 1)) / pGridCols;
        const pH = Math.min(220, (availableH - pGap * (pGridRows - 1)) / pGridRows);

        for (let i = 0; i < Math.min(4, validPhotos.length); i++) {
          const colIdx = i % pGridCols;
          const rowIdx = Math.floor(i / pGridCols);
          const px = MARGIN_L + colIdx * (pW + pGap);
          const py = photoStartY - rowIdx * (pH + pGap) - pH;

          const photoItem = validPhotos[i];
          const embeddedImg = await this.embedImgSafe(photoItem.bytes);

          if (embeddedImg) {
            this.drawImageContained(embeddedImg, px, py, pW, pH, true);
          } else {
            this.page.drawRectangle({
              x: px,
              y: py,
              width: pW,
              height: pH,
              borderColor: rgb(0, 0, 0),
              borderWidth: 0.5,
            });
          }
        }
      } else if (hasLocMap || hasMouzaMap) {
        // ONLY Map(s) present: Full-width layout
        if (hasLocMap && hasMouzaMap) {
          const halfH = (availableH - 45) / 2;

          // Top: Location Map
          const latLongStr = (fields.latitude || fields.longitude)
            ? ` (LAT: ${fields.latitude || ''}, LONG: ${fields.longitude || ''})`
            : '';
          const locHeading = `LOCATION MAP${latLongStr}`;
          this.page.drawText(this.sanitizeText(locHeading), { x: MARGIN_L, y: startY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0, 0, 0) });
          const locY = startY - 20 - halfH;
          const locImg = await this.embedImgSafe(validLocMaps[0]);
          if (locImg) {
            this.drawImageContained(locImg, MARGIN_L, locY, CONTENT_W, halfH, true);
          } else {
            this.page.drawRectangle({ x: MARGIN_L, y: locY, width: CONTENT_W, height: halfH, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
          }

          // Bottom: Mouza Map
          const mouzaHeadingY = locY - 16;
          this.page.drawText('MOUZA MAP', { x: MARGIN_L, y: mouzaHeadingY, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0, 0, 0) });
          const mouzaY = mouzaHeadingY - 8 - halfH;
          const mouzaImg = await this.embedImgSafe(validMouzaMaps[0]);
          if (mouzaImg) {
            this.drawImageContained(mouzaImg, MARGIN_L, mouzaY, CONTENT_W, halfH, true);
          } else {
            this.page.drawRectangle({ x: MARGIN_L, y: mouzaY, width: CONTENT_W, height: halfH, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
          }
        } else {
          // Single map full width
          const singleMapH = availableH - 30;
          const isMouza = hasMouzaMap;
          const heading = isMouza ? 'MOUZA MAP' : `LOCATION MAP${(fields.latitude || fields.longitude) ? ` (LAT: ${fields.latitude || ''}, LONG: ${fields.longitude || ''})` : ''}`;
          this.page.drawText(this.sanitizeText(heading), { x: MARGIN_L, y: startY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0, 0, 0) });
          const mapY = startY - 20 - singleMapH;
          const singleMapImg = await this.embedImgSafe(isMouza ? validMouzaMaps[0] : validLocMaps[0]);
          if (singleMapImg) {
            this.drawImageContained(singleMapImg, MARGIN_L, mapY, CONTENT_W, singleMapH, true);
          } else {
            this.page.drawRectangle({ x: MARGIN_L, y: mapY, width: CONTENT_W, height: singleMapH, borderColor: rgb(0, 0, 0), borderWidth: 0.5 });
          }
        }
      }
    }
  }
}
