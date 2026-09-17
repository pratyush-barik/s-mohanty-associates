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
  distressedValuation: string;
  rentalValuePerMonth: string;
  photosAttached: string;
  locationSketchAttached: string;
  remarks: string;

  // Signatory
  valuerName?: string;
  valuerTitle?: string;
}

export class PDFAxisHLLAPRenderer extends PDFBankRenderer {
  private colSl = 42;
  private colLbl = 200;
  private colVal = CONTENT_W - 42 - 200; // 245.28 (Total = 487.28 = CONTENT_W)

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
    fontSize: number = FONT_SIZE
  ): void {
    const hSl = this.cellHeight(sl, this.colSl, { bold: isLabelBold, fontSize });
    const hLbl = this.cellHeight(label, this.colLbl, { bold: isLabelBold, fontSize });
    const hVal = this.cellHeight(val || 'NA', this.colVal, { bold: isValueBold, fontSize });
    const rowH = Math.max(16, hSl, hLbl, hVal);

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

    // 3. Value cell (uniform background color applied)
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, rowH, val || 'NA', {
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
    fontSize: number = FONT_SIZE
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
    fontSize: number = FONT_SIZE
  ): void {
    const leftText = `${direction}:- ${deedVal || 'NA'}`;
    const rightText = `${direction}:- ${actualVal || 'NA'}`;

    const hLeft = this.cellHeight(leftText, this.colLbl, { bold: false, fontSize });
    const hRight = this.cellHeight(rightText, this.colVal, { bold: false, fontSize });
    const rowH = Math.max(16, hLeft, hRight);

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
  private drawSketchBoundaryDirection(direction: string, val: string, fontSize: number = FONT_SIZE): void {
    const text = `${direction}:- ${val || 'NA'}`;
    const h = Math.max(16, this.cellHeight(text, this.colLbl, { bold: false, fontSize }));

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
    },
    letterheadBytes?: Uint8Array | null
  ): Promise<Uint8Array> {
    await this.init(letterheadBytes);

    // --- Page 1: Header ---
    const refText = fields.refNo ? `Ref No: ${fields.refNo}` : 'Ref No: ';
    const dateText = `Date: ${formatReportDate(fields.reportDate || new Date().toISOString())}`;
    const titleText = 'Valuation Report Format for Bungalow/Individual House/Resale';

    // Top line with Ref No and Date
    const headerH = 16;
    const yTop = this.pdfY(this.cursorY);
    this.page.drawText(this.sanitizeText(refText), {
      x: MARGIN_L,
      y: yTop - 12,
      size: FONT_SIZE_SMALL,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    const dateW = this.fontBold.widthOfTextAtSize(this.sanitizeText(dateText), FONT_SIZE_SMALL);
    this.page.drawText(this.sanitizeText(dateText), {
      x: MARGIN_L + CONTENT_W - dateW,
      y: yTop - 12,
      size: FONT_SIZE_SMALL,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += headerH + 6;

    // Centered Title Banner (Underlined)
    const titleY = this.pdfY(this.cursorY);
    const titleW = this.fontBold.widthOfTextAtSize(titleText, FONT_SIZE_TITLE);
    const titleX = MARGIN_L + (CONTENT_W - titleW) / 2;
    this.page.drawText(titleText, {
      x: titleX,
      y: titleY - 12,
      size: FONT_SIZE_TITLE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    // Underline
    this.page.drawLine({
      start: { x: titleX, y: titleY - 14 },
      end: { x: titleX + titleW, y: titleY - 14 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });
    this.cursorY += 24;

    // --- Table Header: [Sl. No | (empty) | (empty)] ---
    const thH = 18;
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, thH, 'Sl. No', {
      bold: true,
      fontSize: FONT_SIZE,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, thH, '', {
      bold: true,
      fontSize: FONT_SIZE,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, thH, '', {
      bold: true,
      fontSize: FONT_SIZE,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += thH;

    // --- Row 1: Customer Details ---
    const custH1 = Math.max(16, this.cellHeight(fields.customerName || 'NA', this.colVal, { fontSize: FONT_SIZE }));
    const custH2 = Math.max(16, this.cellHeight(fields.customerContactDetails || 'NA', this.colVal, { fontSize: FONT_SIZE }));
    const totalCustH = custH1 + custH2;

    this.checkPageBreak(totalCustH);

    // Left Sl cell spanning both sub-rows
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, totalCustH, '1.', {
      bold: true,
      fontSize: FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    // Sub-row 1: Name
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, custH1, 'Name of the Customer', {
      bold: false,
      fontSize: FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, custH1, fields.customerName || 'NA', {
      bold: false,
      fontSize: FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    // Sub-row 2: Contact
    this.drawCell(MARGIN_L + this.colSl, this.cursorY + custH1, this.colLbl, custH2, 'Customer Contact Details', {
      bold: false,
      fontSize: FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY + custH1, this.colVal, custH2, fields.customerContactDetails || 'NA', {
      bold: false,
      fontSize: FONT_SIZE,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += totalCustH;

    // --- Row 2: APP ID ---
    this.drawHLLAPRow('2.', 'APP ID', fields.appId || 'NA');

    // --- Row 3: Documents Provided ---
    this.drawHLLAPRow(
      '3.',
      'Documents Provided: Approved Layout/\nApproved Building Plan/ NA order/ Four\nBoundaries Details',
      fields.documentsProvided || 'NA'
    );

    // --- Row 4: Property Details ---
    this.drawHLLAPRow('4.', 'Property Details', fields.propertyDetailsHeader || 'NA');
    this.drawHLLAPRow('a.', 'Plot  No', fields.plotNo || 'NA');
    this.drawHLLAPRow('b.', 'S No/G. No/Khasra No/Khata No', fields.khataNo || 'NA');
    this.drawHLLAPRow('c.', 'Locality', fields.locality || 'NA');
    this.drawHLLAPRow('d.', 'Road', fields.road || 'NA');
    this.drawHLLAPRow('e.', 'City', fields.city || 'NA');
    this.drawHLLAPRow('f.', 'District', fields.district || 'NA');
    this.drawHLLAPRow('g.', 'Pin code', fields.pinCode || 'NA');
    this.drawHLLAPRow('h.', 'Nearby Land Mark', fields.nearbyLandMark || 'NA');
    this.drawHLLAPRow('i.', 'Distance from City Center', fields.distanceFromCityCenter || 'NA');
    this.drawHLLAPRow('j.', 'Availability of Local Transport : Metro/ Local Train/ Bus', fields.availabilityOfLocalTransport || 'NA');
    this.drawHLLAPRow('k.', 'Level of land with topographical conditions', fields.levelOfLand || 'NA');
    this.drawHLLAPRow('l.', 'Class Of Locality :  Posh/ Higher Middle Class/Middle class/Lower middle Class/ Poor', fields.classOfLocality || 'NA');
    this.drawHLLAPRow('m.', 'Quality of Infrastructure in the vicinity', fields.qualityOfInfrastructure || 'NA');

    // 4n. Boundaries (Header row + 4 direction rows)
    const bLbl = 'Boundaries of Property as per documents';
    const bVal = 'Boundaries of Property as per Actual';
    const hSl = this.cellHeight('n.', this.colSl, { bold: true, fontSize: FONT_SIZE });
    const hLbl = this.cellHeight(bLbl, this.colLbl, { bold: true, fontSize: FONT_SIZE });
    const hVal = this.cellHeight(bVal, this.colVal, { bold: true, fontSize: FONT_SIZE });
    const bHeaderH = Math.max(16, hSl, hLbl, hVal);

    // Lookahead: ensure header + at least 2 direction rows fit (~36 + 2 * 18 = 72pt) to avoid orphan header
    this.checkPageBreak(bHeaderH + 36);

    this.drawHLLAPRow('n.', bLbl, bVal, true, true, LBL_BG, LBL_BG);

    this.drawBoundaryRow('East', fields.boundaryEastDeed, fields.boundaryEastActual);
    this.drawBoundaryRow('West', fields.boundaryWestDeed, fields.boundaryWestActual);
    this.drawBoundaryRow('North', fields.boundaryNorthDeed, fields.boundaryNorthActual);
    this.drawBoundaryRow('South', fields.boundarySouthDeed, fields.boundarySouthActual);

    // Optional: Boundaries of Property as per sketch map
    const hasSketchBoundaries = !!(
      fields.boundaryEastSketch ||
      fields.boundaryWestSketch ||
      fields.boundaryNorthSketch ||
      fields.boundarySouthSketch
    );
    if (hasSketchBoundaries) {
      this.checkPageBreak(70);
      this.drawCell(MARGIN_L, this.cursorY, this.colSl, 16, '', {
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, 16, 'Boundaries of Property as per sketch map', {
        bold: true,
        fontSize: FONT_SIZE,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, 16, '', {
        fontSize: FONT_SIZE,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'middle',
      });
      this.cursorY += 16;

      this.drawSketchBoundaryDirection('East', fields.boundaryEastSketch || '');
      this.drawSketchBoundaryDirection('West', fields.boundaryWestSketch || '');
      this.drawSketchBoundaryDirection('North', fields.boundaryNorthSketch || '');
      this.drawSketchBoundaryDirection('South', fields.boundarySouthSketch || '');
    }

    // 4o - 4y
    this.drawHLLAPRow('o.', 'Does the Boundaries at Site match, as mentioned in documentation?', fields.boundariesMatch || 'NA');
    this.drawHLLAPRow('p.', 'Status of the Land/ Flat : Free Hold/Leased / Development Authority', fields.statusOfLand || 'NA');
    this.drawHLLAPRow('q.', 'Type of Property : Bungalow/row house/Plot/ flat (1BHK/2BHK/3BHK)/Residential', fields.typeOfProperty || 'NA');
    this.drawHLLAPRow('r.', 'Approved usage of Property: Agri/ Mix /Industrial/commercial/Residential (Restrictive covenants in regards to Land Use, if any)', fields.approvedUsage || 'NA');
    this.drawHLLAPRow('s.', 'Actual Usage of the Property :Agri/Industrial/commercial/Residential/Mix', fields.actualUsage || 'NA');
    this.drawHLLAPRow('t.', 'Type of Structure : Load Bearing/RCC/Aluform shuttering', fields.typeOfStructure || 'NA');
    this.drawHLLAPRow('u.', 'No of Floors', fields.noOfFloors || 'NA');
    this.drawHLLAPRow('v.', 'Occupancy Details: Self Occupied/Rented/ Vacant', fields.occupancyDetails || 'NA');
    this.drawHLLAPRow('w.', 'Does property have Electricity / Water / Drainage connection', fields.hasElectricityWaterDrainage || 'NA');
    this.drawHLLAPRow('x.', 'Proximity to civic amenities like school, hospital, market, etc', fields.proximityToCivicAmenities || 'NA');
    this.drawHLLAPRow('y.', 'Development of surrounding area', fields.developmentOfSurroundingArea || 'NA');

    // 4z. Longitude & Latitude
    this.checkPageBreak(50);
    this.drawHLLAPRow('z.', 'Longitude & latitude of the property', '');
    this.drawHLLAPRow('i.', 'Longitude', fields.longitude || 'NA', false, true);
    this.drawHLLAPRow('ii.', 'Latitude', fields.latitude || 'NA', false, true);

    // --- Row 5: APPROVAL DETAILS ---
    this.checkPageBreak(70);
    this.drawHLLAPRow('5.', 'APPROVAL DETAILS', fields.approvedPlanDetails || fields.buildingPlanApprovalNo || 'NA', true, true);
    this.drawHLLAPRow('a.', 'Layout Approval No', fields.layoutApprovalNo || 'NA');
    this.drawHLLAPRow('b.', 'Date of Approval', formatReportDate(fields.layoutApprovalDate));
    this.drawHLLAPRow('c.', 'Expiry Date', formatReportDate(fields.layoutExpiryDate));
    this.drawHLLAPRow('d.', 'Building Plan Approval No', fields.buildingPlanApprovalNo || 'NA');
    this.drawHLLAPRow('e.', 'Date of Approval', formatReportDate(fields.buildingPlanApprovalDate));
    this.drawHLLAPRow('f.', 'Expiry Date', formatReportDate(fields.buildingPlanExpiryDate));
    this.drawHLLAPRow('g.', 'Date of Commencement of Construction', formatReportDate(fields.constructionCommencementDate));
    this.drawHLLAPRow('h.', 'Expected Completion', formatReportDate(fields.expectedCompletionDate));

    // --- Row 6: CONSTRUCTION DETAILS ---
    this.checkPageBreak(60);
    this.drawHLLAPRow('6.', 'CONSTRUCTION DETAILS', '', true, true);
    this.drawHLLAPRow('a.', 'Area of the Plot/flat', fields.plotAreaDocs || 'NA', false, true);
    this.drawHLLAPRow('b.', 'Demarcation at Site', fields.demarcationAtSite || 'NA');

    // 6c. Approved Built up Area & Floor-wise break up
    this.checkPageBreak(40);
    const appBUALabel = 'Approved Built up Area:_____sqft floor wise break up (for Bungalow/Twin /Row-house) as follows';
    const appBUAVal = fields.approvedBUATotal ? `Approved BUA-${fields.approvedBUATotal}sqft` : 'NA';
    this.drawHLLAPRow('c.', appBUALabel, appBUAVal, true, true);
    if (fields.approvedBUAFloors && fields.approvedBUAFloors.length > 0) {
      for (const fl of fields.approvedBUAFloors) {
        if (fl.floor || fl.area) {
          this.drawSubItemRow(fl.floor || 'Floor', fl.area ? `${fl.area}sqft` : 'NA', false, true);
        }
      }
    }

    // 6d. Measured Built up Area & Floor-wise break up
    this.checkPageBreak(40);
    const measBUALabel = 'Measured Built up Area:_____sqft floor wise break up (for Bungalow/Twin /Row-house) as follows';
    const measBUAVal = fields.measuredBUATotal ? `Measured BUA-${fields.measuredBUATotal}sqft` : 'NA';
    this.drawHLLAPRow('d.', measBUALabel, measBUAVal, true, true);
    if (fields.measuredBUAFloors && fields.measuredBUAFloors.length > 0) {
      for (const fl of fields.measuredBUAFloors) {
        if (fl.floor || fl.area) {
          this.drawSubItemRow(fl.floor || 'Floor', fl.area ? `${fl.area}sqft` : 'NA', false, true);
        }
      }
    }

    this.drawHLLAPRow('f.', 'Whether the construction is as per approved building plan and / or local building bye laws', fields.isConstructionAsPerPlan || 'NA');
    this.drawHLLAPRow('g.', 'Details of Extra Construction', fields.detailsOfExtraConstruction || 'NA');

    // 6h. Recommended / Available Side Margin
    this.checkPageBreak(75);
    this.drawHLLAPRow('h.', 'Recommended / Available Side Margin', '');
    this.drawSubItemRow('Front', fields.sideMarginFront || 'NA');
    this.drawSubItemRow('Right Side', fields.sideMarginRight || 'NA');
    this.drawSubItemRow('Left Side', fields.sideMarginLeft || 'NA');
    this.drawSubItemRow('Back Side', fields.sideMarginBack || 'NA');

    this.drawHLLAPRow('i.', 'Quality of construction', fields.qualityOfConstruction || 'NA');
    this.drawHLLAPRow('j.', 'Maintenance of the Property: excellent/very good/average/poor', fields.maintenanceOfProperty || 'NA');
    this.drawHLLAPRow('k.', 'Current Life of the structure', fields.currentLifeOfStructure || 'NA');
    this.drawHLLAPRow('l.', 'Projected Life of the Structure', fields.projectedLifeOfStructure || 'NA');

    // --- Row 7: Recommended Valuation of the Property ---
    this.checkPageBreak(60);
    this.drawHLLAPRow('7.', 'Recommended Valuation of the Property', '', true, true);
    this.drawHLLAPRow('a.', 'Recommended rate of the Plot/Flat', fields.recommendedRatePerSqft || 'NA');
    this.drawHLLAPRow('b.', 'Value of the Plot/Flat', fields.valueOfPlotFlat || 'NA', false, true);
    this.drawHLLAPRow('c.', 'Estimated Cost of construction', fields.estimatedCostOfConstruction || 'NA', false, true);
    this.drawHLLAPRow(
      'd.',
      fields.isUnderConstruction
        ? 'Total Cost of construction(Proposed G+2) on 100% completion'
        : 'Total Cost of construction(approved G+1)',
      fields.totalCostOfConstruction || 'NA',
      false,
      true
    );

    // If Under-Construction, show "As on date (X%)" construction cost
    if (fields.isUnderConstruction && fields.constructionCostAsOnDate) {
      this.drawSubItemRow(
        `As on date (${fields.percentWorkCompleted || '0%'})`,
        fields.constructionCostAsOnDate,
        false,
        true
      );
    }

    this.drawHLLAPRow('e.', 'Stage of Construction', fields.stageOfConstruction || '100%');
    this.drawHLLAPRow('f.', '% Work completed', fields.percentWorkCompleted || '100%');
    this.drawHLLAPRow('g.', '% Disbursement Recommended', fields.percentDisbursementRecommended || '100%');

    // 7h. Current Value 100% completion
    this.drawHLLAPRow(
      'h.',
      'Current Value of the Property (Plot + construction)on 100% completion',
      fields.currentValueOfProperty || 'NA',
      false,
      true,
      LBL_BG,
      VAL_BG
    );

    // If Under-Construction, show "As on date X% completion" Current Value
    if (fields.isUnderConstruction && fields.currentValueAsOnDate) {
      this.drawSubItemRow(
        `As on date ${fields.percentWorkCompleted || ''} completion`,
        fields.currentValueAsOnDate,
        false,
        true,
        LBL_BG,
        VAL_BG
      );
    }

    this.drawHLLAPRow('i.', 'Date of Property Visit', formatReportDate(fields.dateOfPropertyVisit || fields.reportDate));

    // --- Row 8: Govt Reckoner Rates ---
    this.drawHLLAPRow('8.', 'Valuation as per Government reckoner rates', fields.valuationGovtReckonerRate || 'NA');

    // --- Row 9: Distressed Valuation ---
    this.drawHLLAPRow('9.', 'Distressed valuation of the Property', fields.distressedValuation || 'NA', true, true, LBL_BG, VAL_BG);

    // --- Row 10: Rental Value ---
    this.drawHLLAPRow('10.', 'Rental value per month', fields.rentalValuePerMonth || 'NA');

    // --- Row 11: Attachment ---
    this.drawHLLAPRow('11.', 'Attachment', '');
    this.drawHLLAPRow('a.', '4 photos of the Property from inside/outside are attached', fields.photosAttached || 'Attached');
    this.drawHLLAPRow('b.', 'Location sketch for the property', fields.locationSketchAttached || 'Attached');

    // --- Row 12: Remarks ---
    const remarksPrompt =
      '(Comment on - resistance for valuation if any from the current occupants for rented property, if the property falls in a community dominated areas, if the approach road to the building is small and will not be able to accommodate a fire extinguisher, does the property falls under land locked area or is prone to frequent floods & any other critical observation.)';

    const hPrompt = this.cellHeight(remarksPrompt, this.colLbl, { fontSize: 10 });
    const hRemarks = this.cellHeight(fields.remarks || 'NA', this.colVal, { fontSize: 10 });
    const remarksRowH = Math.max(80, hPrompt, hRemarks);

    this.checkPageBreak(18 + remarksRowH);

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
      fontSize: 10,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    // 3. Valuer Remarks in colVal
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, remarksRowH, fields.remarks || 'NA', {
      bold: false,
      fontSize: 10,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'top',
    });

    this.cursorY += remarksRowH;

    // --- Undertaking Block (Below table, aligned to right side) ---
    this.cursorY += 15;
    const undertakingH = 120;
    this.checkPageBreak(undertakingH);
    const underY = this.pdfY(this.cursorY);
    const underX = MARGIN_L + this.colSl + this.colLbl + 10;
    const underW = CONTENT_W - (this.colSl + this.colLbl + 10);

    const underLines = [
      'Undertaking:',
      'I have personally visited the property & identified the same based on the documents provided.',
      'I/We have no direct or Indirect Interest in the property being valued.',
      'The information furnished above is true and correct to my/our knowledge.',
      '',
      'Authorized Signatory',
      'Name & Seal of the Agency',
      '',
      fields.valuerName || 'Er. Satyajit Mohanty',
      fields.valuerTitle || 'Approved Panel Valuer',
    ];

    let curUnderY = underY;
    for (const line of underLines) {
      if (!line) {
        curUnderY -= 10;
        continue;
      }
      const isBold = line === 'Undertaking:' || line.includes('Satyajit') || line.includes('Signatory');
      const font = isBold ? this.fontBold : this.fontRegular;
      const wrapped = this.wrapText(line, underW, FONT_SIZE_SMALL, isBold);
      for (const wLine of wrapped) {
        this.page.drawText(wLine, {
          x: underX,
          y: curUnderY,
          size: FONT_SIZE_SMALL,
          font,
          color: rgb(0, 0, 0),
        });
        curUnderY -= FONT_SIZE_SMALL * 1.25;
      }
    }
    this.cursorY += undertakingH;

    // --- Page 3+: Photographs & Maps Pages ---
    await this.drawPhotosAndMaps(fields, images);

    return await this.save();
  }

  /**
   * Draw the Photographs and Maps annexure pages:
   * Multi-page dedicated layout matching Report 2 if sketch map is present or photos > 4;
   * Otherwise compact 2-column layout matching Report 1.
   */
  private async drawPhotosAndMaps(
    fields: AxisHLLAPReportFields,
    images: {
      photos: { bytes: Uint8Array; label?: string }[];
      locationMaps: Uint8Array[];
      mouzaMaps: Uint8Array[];
      sketchMaps?: Uint8Array[];
    }
  ) {
    const hasSketchMap = (images.sketchMaps && images.sketchMaps.length > 0) || false;
    const photoCount = images.photos.length;

    if (hasSketchMap || photoCount > 4) {
      // ═════════════════════════════════════════════════════════════════
      // MODE A: MULTI-PAGE DEDICATED ANNEXURES (Matching Report 2)
      // ═════════════════════════════════════════════════════════════════

      // 1. Page of Photographs
      if (photoCount > 0) {
        this.addPage();
        this.cursorY = MARGIN_T;
        const startY = this.pdfY(this.cursorY);

        const photoHeading = 'PHOTOGRAPHS';
        const photoHw = this.fontBold.widthOfTextAtSize(photoHeading, FONT_SIZE_CAPTION);
        this.page.drawText(photoHeading, { x: MARGIN_L, y: startY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0,0,0) });
        this.page.drawLine({ start: { x: MARGIN_L, y: startY - 12 }, end: { x: MARGIN_L + photoHw, y: startY - 12 }, thickness: 1, color: rgb(0,0,0) });

        const photoStartY = startY - 22;
        const availablePhotoH = PAGE_H - MARGIN_T - MARGIN_B - 25;
        const pGridCols = 2;
        const pGridRows = Math.min(4, Math.ceil(photoCount / pGridCols));
        const pGap = 8;
        const pW = (CONTENT_W - pGap * (pGridCols - 1)) / pGridCols;
        const pH = Math.min(160, (availablePhotoH - pGap * (pGridRows - 1)) / pGridRows);

        for (let i = 0; i < Math.min(8, photoCount); i++) {
          const colIdx = i % pGridCols;
          const rowIdx = Math.floor(i / pGridCols);
          const px = MARGIN_L + colIdx * (pW + pGap);
          const py = photoStartY - rowIdx * (pH + pGap) - pH;

          const photoItem = images.photos[i];
          const embeddedImg = await this.embedImgSafe(photoItem.bytes);

          this.page.drawRectangle({
            x: px,
            y: py,
            width: pW,
            height: pH,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5,
          });

          if (embeddedImg) {
            this.page.drawImage(embeddedImg, {
              x: px + 1,
              y: py + 1,
              width: pW - 2,
              height: pH - 2,
            });
          }
        }
      }

      // 2. Dedicated Maps Page: Mouza Map (top) & Location Map (bottom)
      if (images.mouzaMaps.length > 0 || images.locationMaps.length > 0) {
        this.addPage();
        this.cursorY = MARGIN_T;
        const mapPageStartY = this.pdfY(this.cursorY);
        const halfH = (PAGE_H - MARGIN_T - MARGIN_B - 65) / 2;

        // Top: Mouza Map
        this.page.drawText('MOUZA MAP', { x: MARGIN_L, y: mapPageStartY - 10, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0,0,0) });
        const mouzaBoxY = mapPageStartY - 20 - halfH;
        this.page.drawRectangle({
          x: MARGIN_L,
          y: mouzaBoxY,
          width: CONTENT_W,
          height: halfH,
          borderColor: rgb(0,0,0),
          borderWidth: 0.5,
        });
        if (images.mouzaMaps.length > 0) {
          const mImg = await this.embedImgSafe(images.mouzaMaps[0]);
          if (mImg) {
            this.page.drawImage(mImg, {
              x: MARGIN_L + 1,
              y: mouzaBoxY + 1,
              width: CONTENT_W - 2,
              height: halfH - 2,
            });
          }
        }

        // Bottom: Location Map
        const locHeadingText = `LOCATION MAP (LAT: ${fields.latitude || 'NA'}, LONG: ${fields.longitude || 'NA'})`;
        const locBoxTop = mouzaBoxY - 20;
        this.page.drawText(this.sanitizeText(locHeadingText), { x: MARGIN_L, y: locBoxTop, size: FONT_SIZE_CAPTION, font: this.fontBold, color: rgb(0,0,0) });
        const locBoxY = locBoxTop - 10 - halfH;
        this.page.drawRectangle({
          x: MARGIN_L,
          y: locBoxY,
          width: CONTENT_W,
          height: halfH,
          borderColor: rgb(0,0,0),
          borderWidth: 0.5,
        });
        if (images.locationMaps.length > 0) {
          const lImg = await this.embedImgSafe(images.locationMaps[0]);
          if (lImg) {
            this.page.drawImage(lImg, {
              x: MARGIN_L + 1,
              y: locBoxY + 1,
              width: CONTENT_W - 2,
              height: halfH - 2,
            });
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
        this.page.drawRectangle({
          x: MARGIN_L,
          y: sketchBoxY,
          width: CONTENT_W,
          height: sketchBoxH,
          borderColor: rgb(0,0,0),
          borderWidth: 0.5,
        });
        const sImg = await this.embedImgSafe(images.sketchMaps![0]);
        if (sImg) {
          this.page.drawImage(sImg, {
            x: MARGIN_L + 1,
            y: sketchBoxY + 1,
            width: CONTENT_W - 2,
            height: sketchBoxH - 2,
          });
        }
      }
    } else {
      // ═════════════════════════════════════════════════════════════════
      // MODE B: COMPACT 2-COLUMN FINAL PAGE (Matching Report 1)
      // ═════════════════════════════════════════════════════════════════
      this.addPage();
      this.cursorY = MARGIN_T;

      const leftColW = CONTENT_W * 0.56;  // ~272pt
      const rightColW = CONTENT_W * 0.42; // ~204pt
      const gap = CONTENT_W - leftColW - rightColW; // ~11pt

      const leftX = MARGIN_L;
      const rightX = MARGIN_L + leftColW + gap;
      const startY = this.pdfY(this.cursorY);

      // 1. LEFT COLUMN: PHOTOGRAPHS
      const photoHeading = 'PHOTOGRAPHS';
      const photoHw = this.fontBold.widthOfTextAtSize(photoHeading, FONT_SIZE_CAPTION);
      this.page.drawText(photoHeading, {
        x: leftX,
        y: startY - 10,
        size: FONT_SIZE_CAPTION,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      this.page.drawLine({
        start: { x: leftX, y: startY - 12 },
        end: { x: leftX + photoHw, y: startY - 12 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      const photoStartY = startY - 20;
      const availablePhotoH = PAGE_H - MARGIN_T - MARGIN_B - 25;

      const numPhotos = Math.min(8, images.photos.length);
      if (numPhotos > 0) {
        const pGridCols = 2;
        const pGridRows = Math.min(4, Math.ceil(numPhotos / pGridCols));
        const pGap = 6;
        const pW = (leftColW - pGap * (pGridCols - 1)) / pGridCols;
        const pH = Math.min(135, (availablePhotoH - pGap * (pGridRows - 1)) / pGridRows);

        for (let i = 0; i < numPhotos; i++) {
          const colIdx = i % pGridCols;
          const rowIdx = Math.floor(i / pGridCols);
          const px = leftX + colIdx * (pW + pGap);
          const py = photoStartY - rowIdx * (pH + pGap) - pH;

          const photoItem = images.photos[i];
          const embeddedImg = await this.embedImgSafe(photoItem.bytes);

          this.page.drawRectangle({
            x: px,
            y: py,
            width: pW,
            height: pH,
            borderColor: rgb(0, 0, 0),
            borderWidth: 0.5,
          });

          if (embeddedImg) {
            this.page.drawImage(embeddedImg, {
              x: px + 1,
              y: py + 1,
              width: pW - 2,
              height: pH - 2,
            });
          }
        }
      }

      // 2. RIGHT COLUMN: LOCATION MAP & MOUZA MAP
      const mapH = (availablePhotoH - 45) / 2;

      // Top: Location Map
      const locHeading = `LOCATION MAP (LAT: ${fields.latitude || 'NA'}, LONG: ${fields.longitude || 'NA'})`;
      this.page.drawText(this.sanitizeText(locHeading), {
        x: rightX,
        y: startY - 10,
        size: FONT_SIZE_CAPTION,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      const locY = startY - 20 - mapH;
      this.page.drawRectangle({
        x: rightX,
        y: locY,
        width: rightColW,
        height: mapH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });
      if (images.locationMaps.length > 0) {
        const locImg = await this.embedImgSafe(images.locationMaps[0]);
        if (locImg) {
          this.page.drawImage(locImg, {
            x: rightX + 1,
            y: locY + 1,
            width: rightColW - 2,
            height: mapH - 2,
          });
        }
      }

      // Bottom: Mouza Map
      const mouzaHeadingY = locY - 16;
      this.page.drawText('MOUZA MAP', {
        x: rightX,
        y: mouzaHeadingY,
        size: FONT_SIZE_CAPTION,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });
      const mouzaY = mouzaHeadingY - 8 - mapH;
      this.page.drawRectangle({
        x: rightX,
        y: mouzaY,
        width: rightColW,
        height: mapH,
        borderColor: rgb(0, 0, 0),
        borderWidth: 0.5,
      });
      if (images.mouzaMaps.length > 0) {
        const mouzaImg = await this.embedImgSafe(images.mouzaMaps[0]);
        if (mouzaImg) {
          this.page.drawImage(mouzaImg, {
            x: rightX + 1,
            y: mouzaY + 1,
            width: rightColW - 2,
            height: mapH - 2,
          });
        }
      }
    }
  }
}
