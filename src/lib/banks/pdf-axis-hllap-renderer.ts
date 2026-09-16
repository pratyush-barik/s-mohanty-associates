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
  private colSl = 24;
  private colLbl = 210;
  private colVal = CONTENT_W - 24 - 210; // 253.28

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
    valBg: string | undefined = undefined,
    fontSize: number = 8.5
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
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    // 2. Label cell
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, rowH, label, {
      bold: isLabelBold,
      fontSize,
      fillColor: labelBg,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    // 3. Value cell
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
   * Draw a row where the label spans across the first two columns (Sl + Label)
   */
  private drawMergedLabelRow(
    label: string,
    val: string,
    isLabelBold: boolean = false,
    isValueBold: boolean = false,
    labelBg: string | undefined = LBL_BG,
    valBg: string | undefined = undefined,
    fontSize: number = 8.5
  ): void {
    const totalLblW = this.colSl + this.colLbl;
    const hLbl = this.cellHeight(label, totalLblW, { bold: isLabelBold, fontSize });
    const hVal = this.cellHeight(val || 'NA', this.colVal, { bold: isValueBold, fontSize });
    const rowH = Math.max(16, hLbl, hVal);

    this.checkPageBreak(rowH);

    this.drawCell(MARGIN_L, this.cursorY, totalLblW, rowH, label, {
      bold: isLabelBold,
      fontSize,
      fillColor: labelBg,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    this.drawCell(MARGIN_L + totalLblW, this.cursorY, this.colVal, rowH, val || 'NA', {
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
   * Introduce a line break / spacing gap after each section to prevent joining sections directly
   */
  private addSectionBreak(gap: number = 8): void {
    if (this.availableHeight > gap + 25) {
      this.cursorY += gap;
    }
  }

  /**
   * Draw section header banner spanning all 3 columns
   */
  private drawSectionBanner(sl: string, title: string, fontSize: number = 9): void {
    const fullText = sl ? `${sl} ${title}` : title;
    const rowH = Math.max(18, this.cellHeight(fullText, CONTENT_W, { bold: true, fontSize }));

    this.checkPageBreak(rowH + 20);

    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, rowH, fullText, {
      bold: true,
      fontSize,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw boundary sub-row with 2 columns inside the table (Deed vs Actual)
   */
  private drawBoundaryRow(
    direction: string,
    deedVal: string,
    actualVal: string,
    fontSize: number = 8.5
  ): void {
    const totalLblW = this.colSl + this.colLbl;
    const leftText = `${direction}: - ${deedVal || 'NA'}`;
    const rightText = `${direction}: - ${actualVal || 'NA'}`;

    const hLeft = this.cellHeight(leftText, totalLblW, { bold: false, fontSize });
    const hRight = this.cellHeight(rightText, this.colVal, { bold: false, fontSize });
    const rowH = Math.max(16, hLeft, hRight);

    this.checkPageBreak(rowH);

    this.drawCell(MARGIN_L, this.cursorY, totalLblW, rowH, leftText, {
      bold: false,
      fontSize,
      align: 'left',
      vAlign: 'middle',
    });

    this.drawCell(MARGIN_L + totalLblW, this.cursorY, this.colVal, rowH, rightText, {
      bold: false,
      fontSize,
      align: 'left',
      vAlign: 'middle',
    });

    this.cursorY += rowH;
  }

  /**
   * Draw single sketch boundary direction row spanning columns
   */
  private drawSketchBoundaryDirection(direction: string, val: string, fontSize: number = 8.5): void {
    const totalLblW = this.colSl + this.colLbl;
    const text = `${direction}: - ${val || 'NA'}`;
    const h = Math.max(16, this.cellHeight(text, totalLblW, { bold: false, fontSize }));

    this.checkPageBreak(h);

    this.drawCell(MARGIN_L, this.cursorY, totalLblW, h, text, {
      bold: false,
      fontSize,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + totalLblW, this.cursorY, this.colVal, h, '', {
      fontSize,
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
    const refText = `Ref No: ${fields.refNo || 'Axis/SMA/07-26/19'}`;
    const dateText = `Date:${formatReportDate(fields.reportDate || new Date().toISOString())}`;
    const titleText = 'Valuation Report Format for Bungalow/Individual House/Resale';

    // Top line with Ref No and Date
    const headerH = 14;
    const yTop = this.pdfY(this.cursorY);
    this.page.drawText(this.sanitizeText(refText), {
      x: MARGIN_L,
      y: yTop - 10,
      size: 9,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    const dateW = this.fontBold.widthOfTextAtSize(this.sanitizeText(dateText), 9);
    this.page.drawText(this.sanitizeText(dateText), {
      x: MARGIN_L + CONTENT_W - dateW,
      y: yTop - 10,
      size: 9,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.cursorY += headerH + 6;

    // Centered Title Banner (Underlined)
    const titleY = this.pdfY(this.cursorY);
    const titleW = this.fontBold.widthOfTextAtSize(titleText, 10.5);
    const titleX = MARGIN_L + (CONTENT_W - titleW) / 2;
    this.page.drawText(titleText, {
      x: titleX,
      y: titleY - 10,
      size: 10.5,
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
    this.cursorY += 22;

    // --- Table Header: [Sl. No | Label | Value] ---
    const thH = 16;
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, thH, 'Sl. No', {
      bold: true,
      fontSize: 8.5,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'center',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, thH, '', {
      bold: true,
      fontSize: 8.5,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'center',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, thH, '', {
      bold: true,
      fontSize: 8.5,
      fillColor: OPT_BG,
      bgOpacity: 0.5,
      align: 'center',
      vAlign: 'middle',
    });
    this.cursorY += thH;

    // --- Section 1: Customer Details (Merged Sl.No) ---
    const custH1 = Math.max(16, this.cellHeight(fields.customerName || 'NA', this.colVal, { fontSize: 8.5 }));
    const custH2 = Math.max(16, this.cellHeight(fields.customerContactDetails || 'NA', this.colVal, { fontSize: 8.5 }));
    const totalCustH = custH1 + custH2;

    this.checkPageBreak(totalCustH);

    // Left Sl cell spanning both sub-rows
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, totalCustH, '1.', {
      bold: true,
      fontSize: 8.5,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    // Sub-row 1: Name
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colLbl, custH1, 'Name of the Customer', {
      bold: false,
      fontSize: 8.5,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY, this.colVal, custH1, fields.customerName || 'NA', {
      bold: false,
      fontSize: 8.5,
      align: 'left',
      vAlign: 'middle',
    });
    // Sub-row 2: Contact
    this.drawCell(MARGIN_L + this.colSl, this.cursorY + custH1, this.colLbl, custH2, 'Customer Contact Details', {
      bold: false,
      fontSize: 8.5,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + this.colSl + this.colLbl, this.cursorY + custH1, this.colVal, custH2, fields.customerContactDetails || 'NA', {
      bold: false,
      fontSize: 8.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += totalCustH;
    this.addSectionBreak();

    // --- Section 2: APP ID ---
    this.drawHLLAPRow('2.', 'APP ID', fields.appId || 'NA');
    this.addSectionBreak();

    // --- Section 3: Documents Provided ---
    this.drawHLLAPRow(
      '3.',
      'Documents Provided: Approved Layout/\nApproved Building Plan/ NA order/ Four\nBoundaries Details',
      fields.documentsProvided || 'Copy of Sale deed, ROR, Approved plan'
    );
    this.addSectionBreak();

    // --- Section 4: Property Details ---
    this.drawHLLAPRow('4.', 'Property Details', fields.propertyDetailsHeader || 'NA');
    this.drawHLLAPRow('a.', 'Plot No', fields.plotNo || 'NA');
    this.drawHLLAPRow('b.', 'S No/G. No/Khasra No/Khata No', fields.khataNo || 'NA');
    this.drawHLLAPRow('c.', 'Locality', fields.locality || 'NA');
    this.drawHLLAPRow('d.', 'Road', fields.road || 'NA');
    this.drawHLLAPRow('e.', 'City', fields.city || 'NA');
    this.drawHLLAPRow('f.', 'District', fields.district || 'NA');
    this.drawHLLAPRow('g.', 'Pin code', fields.pinCode || 'NA');
    this.drawHLLAPRow('h.', 'Nearby Land Mark', fields.nearbyLandMark || 'NA');
    this.drawHLLAPRow('i.', 'Distance from City Center', fields.distanceFromCityCenter || 'NA');
    this.drawHLLAPRow('j.', 'Availability of Local Transport : Metro/ Local Train/ Bus', fields.availabilityOfLocalTransport || 'Taxi, Auto');
    this.drawHLLAPRow('k.', 'Level of land with topographical conditions', fields.levelOfLand || 'Regular level land');
    this.drawHLLAPRow('l.', 'Class Of Locality : Posh/ Higher Middle Class/Middle class/Lower middle Class/ Poor', fields.classOfLocality || 'Middle Class');
    this.drawHLLAPRow('m.', 'Quality of Infrastructure in the vicinity', fields.qualityOfInfrastructure || 'Good');

    // 4n. Boundaries (Header sub-row + 4 direction rows)
    const bHeaderW1 = this.colSl + this.colLbl;
    const bHeaderW2 = this.colVal;
    const bHeaderH = 16;
    this.checkPageBreak(bHeaderH);

    this.drawCell(MARGIN_L, this.cursorY, bHeaderW1, bHeaderH, 'n. Boundaries of Property as per sale deed', {
      bold: false,
      fontSize: 8.5,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.drawCell(MARGIN_L + bHeaderW1, this.cursorY, bHeaderW2, bHeaderH, 'Boundaries of Property as per Actual', {
      bold: false,
      fontSize: 8.5,
      fillColor: LBL_BG,
      bgOpacity: 0.5,
      align: 'left',
      vAlign: 'middle',
    });
    this.cursorY += bHeaderH;

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
      this.checkPageBreak(16);
      this.drawCell(MARGIN_L, this.cursorY, bHeaderW1, 16, 'Boundaries of Property as per sketch map', {
        bold: false,
        fontSize: 8.5,
        fillColor: LBL_BG,
        bgOpacity: 0.5,
        align: 'left',
        vAlign: 'middle',
      });
      this.drawCell(MARGIN_L + bHeaderW1, this.cursorY, bHeaderW2, 16, '', {
        fontSize: 8.5,
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
    this.drawHLLAPRow('o.', 'Does the Boundaries at Site match, as mentioned in documentation?', fields.boundariesMatch || 'Yes(Boundary matching as per documents)');
    this.drawHLLAPRow('p.', 'Status of the Land/ Flat : Free Hold/Leased / Development Authority', fields.statusOfLand || 'Free Hold');
    this.drawHLLAPRow('q.', 'Type of Property : Bungalow/row house/Plot/ flat (1BHK/2BHK/3BHK)/Residential', fields.typeOfProperty || 'Residential');
    this.drawHLLAPRow('r.', 'Approved usage of Property: Agri/ Mix /Industrial/commercial/Residential (Restrictive covenants in regards to Land Use, if any)', fields.approvedUsage || 'Residential');
    this.drawHLLAPRow('s.', 'Actual Usage of the Property', fields.actualUsage || 'Residential');
    this.drawHLLAPRow('t.', 'Type of Structure : Load Bearing/RCC/Aluform shuttering', fields.typeOfStructure || 'RCC Framed Structure');
    this.drawHLLAPRow('u.', 'No of Floors', fields.noOfFloors || 'G+1 storied Residential building');
    this.drawHLLAPRow('v.', 'Occupancy Details: Self Occupied/Rented/ Vacant', fields.occupancyDetails || 'Self');
    this.drawHLLAPRow('w.', 'Does property have Electricity / Water / Drainage connection', fields.hasElectricityWaterDrainage || 'Yes');
    this.drawHLLAPRow('x.', 'Proximity to civic amenities like school, hospital, market, etc', fields.proximityToCivicAmenities || 'Within 2-3 kms range');
    this.drawHLLAPRow('y.', 'Development of surrounding area', fields.developmentOfSurroundingArea || 'Developing in surrounding area');

    // 4z. Longitude & Latitude
    this.drawHLLAPRow('z.', 'Longitude & latitude of the property', '');
    this.drawHLLAPRow('i.', 'Longitude', fields.longitude || 'NA');
    this.drawHLLAPRow('ii.', 'Latitude', fields.latitude || 'NA');
    this.addSectionBreak();

    // --- Section 5: APPROVAL DETAILS ---
    this.drawSectionBanner('5.', 'APPROVAL DETAILS');
    this.drawHLLAPRow('a.', 'Layout Approval No', fields.layoutApprovalNo || 'NA');
    this.drawHLLAPRow('b.', 'Date of Approval', fields.layoutApprovalDate || 'NA');
    this.drawHLLAPRow('c.', 'Expiry Date', fields.layoutExpiryDate || 'NA');
    this.drawHLLAPRow('d.', 'Building Plan Approval No', fields.buildingPlanApprovalNo || 'NA');
    this.drawHLLAPRow('e.', 'Date of Approval', fields.buildingPlanApprovalDate || 'NA');
    this.drawHLLAPRow('f.', 'Expiry Date', fields.buildingPlanExpiryDate || 'NA');
    this.drawHLLAPRow('g.', 'Date of Commencement of Construction', fields.constructionCommencementDate || '100% Completed');
    this.drawHLLAPRow('h.', 'Expected Completion', fields.expectedCompletionDate || 'NA');
    this.addSectionBreak();

    // --- Section 6: CONSTRUCTION DETAILS ---
    this.drawSectionBanner('6.', 'CONSTRUCTION DETAILS');
    this.drawHLLAPRow('a.', 'Area of the Plot/flat', fields.plotAreaDocs || 'NA');
    this.drawHLLAPRow('b.', 'Demarcation at Site', fields.demarcationAtSite || 'Yes');

    // 6c. Approved Built up Area & Floor-wise break up
    this.drawHLLAPRow(
      'c.',
      'Approved Built up Area: _____sqft floor wise break up (for Bungalow/Twin /Row-house) as follows',
      fields.approvedBUATotal || 'NA'
    );
    if (fields.approvedBUAFloors && fields.approvedBUAFloors.length > 0) {
      for (const fl of fields.approvedBUAFloors) {
        this.drawMergedLabelRow(`${fl.floor} - Sq Ft Description`, fl.area || 'NA');
      }
    }

    // 6d. Measured Built up Area & Floor-wise break up
    this.drawHLLAPRow(
      'd.',
      'Measured Built up Area: _____sqft floor wise break up (for Bungalow/Twin /Row-house) as follows',
      fields.measuredBUATotal || 'NA'
    );
    if (fields.measuredBUAFloors && fields.measuredBUAFloors.length > 0) {
      for (const fl of fields.measuredBUAFloors) {
        this.drawMergedLabelRow(`${fl.floor} - Sq Ft Description`, fl.area || 'NA');
      }
    }

    this.drawHLLAPRow('f.', 'Whether the construction is as per approved building plan and / or local building bye laws', fields.isConstructionAsPerPlan || 'As per plan');
    this.drawHLLAPRow('g.', 'Details of Extra Construction', fields.detailsOfExtraConstruction || 'NA');

    // 6h. Recommended / Available Side Margin
    this.drawHLLAPRow('h.', 'Recommended / Available Side Margin', '');
    this.drawMergedLabelRow('Front', fields.sideMarginFront || 'NA');
    this.drawMergedLabelRow('Right Side', fields.sideMarginRight || 'NA');
    this.drawMergedLabelRow('Left Side', fields.sideMarginLeft || 'NA');
    this.drawMergedLabelRow('Back Side', fields.sideMarginBack || 'NA');

    this.drawHLLAPRow('i.', 'Quality of construction', fields.qualityOfConstruction || 'Good');
    this.drawHLLAPRow('j.', 'Maintenance of the Property: excellent/very good/average/poor', fields.maintenanceOfProperty || 'Good');
    this.drawHLLAPRow('k.', 'Current Life of the structure', fields.currentLifeOfStructure || '2-Years');
    this.drawHLLAPRow('l.', 'Projected Life of the Structure', fields.projectedLifeOfStructure || '58-Years');
    this.addSectionBreak();

    // --- Section 7: Recommended Valuation of the Property ---
    this.drawSectionBanner('7.', 'Recommended Valuation of the Property');
    this.drawHLLAPRow('a.', 'Recommended rate of the Plot/Flat', fields.recommendedRatePerSqft || 'NA');
    this.drawHLLAPRow('b.', 'Value of the Plot/Flat', fields.valueOfPlotFlat || 'NA');
    this.drawHLLAPRow('c.', 'Estimated Cost of construction', fields.estimatedCostOfConstruction || 'NA');
    this.drawHLLAPRow(
      'd.',
      fields.isUnderConstruction
        ? 'Total Cost of construction(Proposed G+2) on 100% completion'
        : 'Total Cost of construction(approved G+1)',
      fields.totalCostOfConstruction || 'NA'
    );

    // If Under-Construction, show "As on date (X%)" construction cost
    if (fields.isUnderConstruction && fields.constructionCostAsOnDate) {
      this.drawMergedLabelRow(
        `As on date (${fields.percentWorkCompleted || '0%'})`,
        fields.constructionCostAsOnDate
      );
    }

    this.drawHLLAPRow('e.', 'Stage of Construction', fields.stageOfConstruction || '100%');
    this.drawHLLAPRow('f.', '% Work completed', fields.percentWorkCompleted || '100%');
    this.drawHLLAPRow('g.', '% Disbursement Recommended', fields.percentDisbursementRecommended || '100%');

    // Current Value 100% completion
    this.drawMergedLabelRow(
      fields.isUnderConstruction
        ? 'Current Value of the Property (Plot + construction) on 100% completion'
        : 'Current Value of the Property (Plot + construction) on 100% completion',
      fields.currentValueOfProperty || 'NA',
      true,
      true
    );

    // If Under-Construction, show "As on date X% completion" Current Value
    if (fields.isUnderConstruction && fields.currentValueAsOnDate) {
      this.drawMergedLabelRow(
        `As on date ${fields.percentWorkCompleted || ''} completion`,
        fields.currentValueAsOnDate,
        true,
        true
      );
    }

    this.drawHLLAPRow('i.', 'Date of Property Visit', formatReportDate(fields.dateOfPropertyVisit || fields.reportDate));
    this.addSectionBreak();

    // --- Section 8 - 11 ---
    this.drawHLLAPRow('8.', 'Valuation as per Government reckoner rates', fields.valuationGovtReckonerRate || 'NA');
    this.addSectionBreak();
    this.drawHLLAPRow('9.', 'Distressed valuation of the Property', fields.distressedValuation || 'NA', true, true);
    this.addSectionBreak();
    this.drawHLLAPRow('10.', 'Rental value per month', fields.rentalValuePerMonth || 'NA');
    this.addSectionBreak();

    this.drawSectionBanner('11.', 'Attachment');
    this.drawHLLAPRow('a.', '4 photos of the Property from inside/outside are attached', fields.photosAttached || 'Attached');
    this.drawHLLAPRow('b.', 'Location sketch for the property', fields.locationSketchAttached || 'Attached');
    this.addSectionBreak();

    // --- Section 12: Remarks ---
    const remarksPrompt =
      'Remarks :\n(Comment on - resistance for valuation if any from the current occupants for rented property, if the property falls in a community dominated areas, if the approach road to the building is small and will not be able to accommodate a fire extinguisher, does the property falls under land locked area or is prone to frequent floods & any other critical observation.)';
    this.drawHLLAPRow('12.', remarksPrompt, fields.remarks || 'NA', false, false, LBL_BG, undefined, 8);
    this.addSectionBreak(10);

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
      const wrapped = this.wrapText(line, underW, 8.5, isBold);
      for (const wLine of wrapped) {
        this.page.drawText(wLine, {
          x: underX,
          y: curUnderY,
          size: 8.5,
          font,
          color: rgb(0, 0, 0),
        });
        curUnderY -= 11;
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
        const photoHw = this.fontBold.widthOfTextAtSize(photoHeading, 10);
        this.page.drawText(photoHeading, { x: MARGIN_L, y: startY - 10, size: 10, font: this.fontBold, color: rgb(0,0,0) });
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
        this.page.drawText('MOUZA MAP', { x: MARGIN_L, y: mapPageStartY - 10, size: 9, font: this.fontBold, color: rgb(0,0,0) });
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
        this.page.drawText(this.sanitizeText(locHeadingText), { x: MARGIN_L, y: locBoxTop, size: 9, font: this.fontBold, color: rgb(0,0,0) });
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
        this.page.drawText('SKETCH MAP', { x: MARGIN_L, y: sketchStartY - 10, size: 10, font: this.fontBold, color: rgb(0,0,0) });
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
      const photoHw = this.fontBold.widthOfTextAtSize(photoHeading, 10);
      this.page.drawText(photoHeading, {
        x: leftX,
        y: startY - 10,
        size: 10,
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
        size: 8.5,
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
        size: 8.5,
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
