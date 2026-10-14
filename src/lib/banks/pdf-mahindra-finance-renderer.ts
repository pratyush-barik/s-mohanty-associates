import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFMahindraFinanceRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode?: string;

  constructor(opts: any = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode;
  }

  private getF(key: string, defaultVal: any = ''): any {
    return this.fields[key] ?? defaultVal;
  }

  async render(): Promise<Uint8Array> {
    await this.init();
    await this.drawContent();
    return await this.save();
  }

  /**
   * Section Header row with solid dark banner
   */
  private drawMahindraSectionHeader(title: string) {
    this.drawSectionHeader(title);
  }

  /**
   * Helper to draw a full row with optional number badge, label, and value
   */
  private drawMahindraRow(num: string, label: string, value: string, boldVal: boolean = false) {
    const numW = 24;
    const labelW = 200;
    const valW = CONTENT_W - numW - labelW;

    this.drawKeyValueRow([
      {
        label: num,
        value: '',
        labelWidth: numW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: label,
        value: '',
        labelWidth: labelW,
        valueWidth: 0,
        labelBold: false,
      },
      {
        label: value || 'NA',
        value: '',
        labelWidth: valW,
        valueWidth: 0,
        labelBold: boldVal,
      },
    ]);
  }

  async drawContent(): Promise<void> {
    this.addPage();

    // Top Header Title
    this.drawCenteredTitle('VALUATION REPORT', 14, true);
    this.advanceCursor(4);

    // ==========================================
    // TOP META TABLE
    // ==========================================
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: 'Branch Name', value: this.getF('branchName', 'Bhubaneswar'), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Type of Case', value: this.getF('typeOfCase', 'NA'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Valuer Name', value: this.getF('valuerName', 'Er. Satyajit Mohanty'), labelWidth: 100, valueWidth: halfW - 100, labelBold: true },
      { label: 'Date of Visit', value: this.getF('dateOfVisit', ''), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Case Ref. No', value: this.getF('caseRefNo', this.projectCode || ''), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Date of Report', value: this.getF('reportDate', ''), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Contacted Person for property inspection (Name/ Mobile)',
        value: this.getF('contactPerson', ''),
        labelWidth: 175,
        valueWidth: CONTENT_W - 175,
      },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // BASIC DETAILS
    // ==========================================
    this.drawMahindraSectionHeader('BASIC DETAILS');

    this.drawMahindraRow('1', "Applicant/s Name/s", this.getF('applicantName', ''), true);

    // Row 2: Type of property & Current Usage
    const p2LabelW = 200;
    const p2RemW = CONTENT_W - 24 - p2LabelW;
    const p2SubW = p2RemW / 2;
    this.drawKeyValueRow([
      { label: '2', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Type of property', value: '', labelWidth: p2LabelW, valueWidth: 0 },
      { label: this.getF('propertyTypeDesc', 'G+1 storied Commercial building'), value: '', labelWidth: p2SubW - 60, valueWidth: 0 },
      { label: 'Current Usage', value: this.getF('currentUsage', 'Commercial'), labelWidth: 60, valueWidth: p2SubW },
    ]);

    this.drawMahindraRow('3', 'Address at site', this.getF('addressAtSite', ''));
    this.drawMahindraRow('', 'Address as per document', this.getF('addressAsPerDoc', ''));
    this.drawMahindraRow(
      '4',
      'Has the valuator done valuation of this property before this? If yes, when, for whom?',
      this.getF('priorValuation', 'No')
    );

    this.advanceCursor(4);

    // ==========================================
    // SURROUNDING & LOCALITY DETAILS
    // ==========================================
    this.drawMahindraSectionHeader('SURROUNDING & LOCALITY DETAILS');

    // Row 5: Location sub-breakdown
    const locRows = [
      { label: 'Type (Comm., Res, Ind, Mix)', val: this.getF('localityType', 'Commercial') },
      { label: 'Class of Locality', val: this.getF('localityClass', 'Middle Class') },
      { label: 'Site is (Dev, Under Dev)', val: this.getF('siteStatus', 'Developing') },
      { label: 'Proximity to civic amenities/public transport', val: this.getF('proximityAmenities', 'Within 1-2 Kms') },
      { label: 'Railway Station', val: this.getF('railwayStation', '') },
      { label: 'Bus Stop', val: this.getF('busStop', '') },
    ];

    locRows.forEach((r, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '5' : '', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
        { label: idx === 0 ? 'Location' : '', value: '', labelWidth: 130, valueWidth: 0, labelBold: idx === 0 },
        { label: r.label, value: '', labelWidth: 170, valueWidth: 0 },
        { label: r.val || 'NA', value: '', labelWidth: CONTENT_W - 24 - 130 - 170, valueWidth: 0 },
      ]);
    });

    this.drawMahindraRow('6', 'Close Vicinity / Landmark', this.getF('landmark', ''));
    this.drawMahindraRow('7', 'Distance from City Center', this.getF('distanceCityCenter', ''));
    this.drawMahindraRow('8', 'Condition and width of approach road', this.getF('approachRoad', ''));

    this.advanceCursor(4);

    // ==========================================
    // PROPERTY DETAILS
    // ==========================================
    this.drawMahindraSectionHeader('PROPERTY DETAILS');

    // 9. Occupant
    this.drawKeyValueRow([
      { label: '9', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Occupant', value: '', labelWidth: 130, valueWidth: 0, labelBold: true },
      { label: 'Vacant/Occupied', value: this.getF('occupantStatus', 'Tenant'), labelWidth: 170, valueWidth: CONTENT_W - 24 - 130 - 170 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: '', value: '', labelWidth: 130, valueWidth: 0 },
      { label: 'Name of Occupant', value: this.getF('occupantName', 'NA'), labelWidth: 170, valueWidth: CONTENT_W - 24 - 130 - 170 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: '', value: '', labelWidth: 130, valueWidth: 0 },
      { label: 'Relation with applicant', value: this.getF('occupantRelation', 'NA'), labelWidth: 170, valueWidth: CONTENT_W - 24 - 130 - 170 },
    ]);

    // 10. Building details
    const bldRows = [
      { label: 'Property Demarcation', val: this.getF('propertyDemarcation', 'No') },
      { label: 'Property Identified through', val: this.getF('propertyIdentifiedThrough', '') },
      { label: 'Type of structure', val: this.getF('structureType', 'Load Bearing structure') },
      { label: 'Land/Plot Area', val: this.getF('landPlotAreaDesc', '') },
      { label: 'No of Blocks', val: this.getF('noOfBlocks', 'N.A') },
      { label: 'No of Units', val: this.getF('noOfUnits', 'N.A') },
      { label: 'No. of Floors', val: this.getF('noOfFloors', 'GF') },
      { label: 'No. of Lifts', val: this.getF('noOfLifts', 'N.A') },
    ];
    bldRows.forEach((r, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '10' : '', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
        { label: idx === 0 ? 'Building details' : '', value: '', labelWidth: 130, valueWidth: 0, labelBold: idx === 0 },
        { label: r.label, value: '', labelWidth: 170, valueWidth: 0 },
        { label: r.val || 'NA', value: '', labelWidth: CONTENT_W - 24 - 130 - 170, valueWidth: 0 },
      ]);
    });

    // 11. Unit details
    const unitRows = [
      { label: 'Located on Floor No.', val: this.getF('unitFloorNo', 'N.A') },
      { label: 'No. of rooms', val: this.getF('unitRooms', 'NA') },
      { label: 'Built up area Measured', val: this.getF('unitBuaMeasured', '') },
      { label: 'Carpet area', val: this.getF('unitCarpetArea', '') },
      { label: 'Remarks on view from property', val: this.getF('unitRemarksView', 'NA') },
    ];
    unitRows.forEach((r, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '11' : '', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
        { label: idx === 0 ? 'Unit details' : '', value: '', labelWidth: 130, valueWidth: 0, labelBold: idx === 0 },
        { label: r.label, value: '', labelWidth: 170, valueWidth: 0 },
        { label: r.val || 'NA', value: '', labelWidth: CONTENT_W - 24 - 130 - 170, valueWidth: 0 },
      ]);
    });

    // 12. Quality of construction
    this.drawKeyValueRow([
      { label: '12', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Quality of construction (Good /Avg./ Bad)', value: '', labelWidth: 200, valueWidth: 0 },
      { label: 'Exteriors', value: this.getF('qualityExteriors', 'Average'), labelWidth: 60, valueWidth: (CONTENT_W - 224) / 2 - 60 },
      { label: 'Interiors', value: this.getF('qualityInteriors', 'Average'), labelWidth: 60, valueWidth: (CONTENT_W - 224) / 2 - 60 },
    ]);

    // 13. Age of property & Residual life
    const halfRowW = (CONTENT_W - 24 - 200) / 2;
    this.drawKeyValueRow([
      { label: '13', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Age of the property', value: this.getF('ageOfProperty', '16-Years'), labelWidth: 200, valueWidth: halfRowW },
      { label: 'Residual life', value: this.getF('residualLife', '44-Years'), labelWidth: 70, valueWidth: halfRowW - 70 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS
    // ==========================================
    this.drawMahindraSectionHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS');

    this.drawMahindraRow('14', 'Sanctioned plans verified with approval no', this.getF('sanctionApprovalNo', 'Plan not provided'));
    this.drawMahindraRow('15', 'Ownership type (Leasehold/ Freehold)', this.getF('ownershipType', 'Freehold'));
    this.drawMahindraRow('16', 'Property documents verified', this.getF('documentsVerified', 'Copy of Sale deed, ROR & Sketch map'));
    this.drawMahindraRow('17', 'Is the property within Municipal Limits', this.getF('municipalLimits', 'Within Mutarifa GP limit'));
    this.drawMahindraRow('18', 'Permissible usage allow as per master plan', this.getF('permissibleUsageMasterPlan', 'NA'));

    // 19. Setbacks Table
    this.drawKeyValueRow([
      { label: '19', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Setbacks', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'As per plan/ Bye laws', value: '', labelWidth: 100, valueWidth: 0, highlight: true },
      { label: 'Actual at site', value: '', labelWidth: 80, valueWidth: 0, highlight: true },
      { label: 'Deviation', value: '', labelWidth: 60, valueWidth: 0, highlight: true },
      { label: 'Remarks, if any', value: '', labelWidth: CONTENT_W - 364, valueWidth: 0, highlight: true },
    ]);

    const setbackSides = [
      { name: 'Front', plan: this.getF('setbackFrontPlan', 'NA'), site: this.getF('setbackFrontSite', 'NA'), dev: this.getF('setbackFrontDev', 'NA'), rem: this.getF('setbackFrontRem', 'NA') },
      { name: 'Side1(Left)', plan: this.getF('setbackSide1Plan', 'NA'), site: this.getF('setbackSide1Site', 'NA'), dev: this.getF('setbackSide1Dev', 'NA'), rem: this.getF('setbackSide1Rem', 'NA') },
      { name: 'Side2(Right)', plan: this.getF('setbackSide2Plan', 'NA'), site: this.getF('setbackSide2Site', 'NA'), dev: this.getF('setbackSide2Dev', 'NA'), rem: this.getF('setbackSide2Rem', 'NA') },
      { name: 'Rear', plan: this.getF('setbackRearPlan', 'NA'), site: this.getF('setbackRearSite', 'NA'), dev: this.getF('setbackRearDev', 'NA'), rem: this.getF('setbackRearRem', 'NA') },
    ];
    setbackSides.forEach(s => {
      this.drawKeyValueRow([
        { label: '', value: '', labelWidth: 24, valueWidth: 0 },
        { label: s.name, value: '', labelWidth: 100, valueWidth: 0 },
        { label: s.plan, value: '', labelWidth: 100, valueWidth: 0 },
        { label: s.site, value: '', labelWidth: 80, valueWidth: 0 },
        { label: s.dev, value: '', labelWidth: 60, valueWidth: 0 },
        { label: s.rem, value: '', labelWidth: CONTENT_W - 364, valueWidth: 0 },
      ]);
    });

    // 20. Floor Wise Area (In Sft.)
    this.drawKeyValueRow([
      { label: '20', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Floor Wise Area (In Sft.)', value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
      { label: 'Basement', value: '', labelWidth: 50, valueWidth: 0, highlight: true },
      { label: 'Stilt', value: '', labelWidth: 50, valueWidth: 0, highlight: true },
      { label: 'Ground', value: '', labelWidth: 60, valueWidth: 0, highlight: true },
      { label: 'First', value: '', labelWidth: 60, valueWidth: 0, highlight: true },
      { label: 'Second', value: '', labelWidth: 55, valueWidth: 0, highlight: true },
      { label: 'Third', value: '', labelWidth: CONTENT_W - 399, valueWidth: 0, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Permissible area', value: '', labelWidth: 150, valueWidth: 0 },
      { label: this.getF('permBasement', 'NA'), value: '', labelWidth: 50, valueWidth: 0 },
      { label: this.getF('permStilt', 'NA'), value: '', labelWidth: 50, valueWidth: 0 },
      { label: this.getF('permGround', 'NA'), value: '', labelWidth: 60, valueWidth: 0 },
      { label: this.getF('permFirst', 'NA'), value: '', labelWidth: 60, valueWidth: 0 },
      { label: this.getF('permSecond', 'NA'), value: '', labelWidth: 55, valueWidth: 0 },
      { label: this.getF('permThird', 'NA'), value: '', labelWidth: CONTENT_W - 399, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Constructed', value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
      { label: this.getF('constBasement', 'NA'), value: '', labelWidth: 50, valueWidth: 0 },
      { label: this.getF('constStilt', 'NA'), value: '', labelWidth: 50, valueWidth: 0 },
      { label: this.getF('constGround', '2850sqft'), value: '', labelWidth: 60, valueWidth: 0 },
      { label: this.getF('constFirst', '840sqft'), value: '', labelWidth: 60, valueWidth: 0 },
      { label: this.getF('constSecond', 'NA'), value: '', labelWidth: 55, valueWidth: 0 },
      { label: this.getF('constThird', 'NA'), value: '', labelWidth: CONTENT_W - 399, valueWidth: 0 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // VALUATION (Point 21)
    // ==========================================
    this.drawMahindraSectionHeader('VALUATION');

    this.drawKeyValueRow([
      { label: '21', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: '(A) Description of Constructed Area and Rates', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: 'Area (Sft.)', value: '', labelWidth: 70, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate (Sft.)', value: '', labelWidth: 75, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Amount', value: '', labelWidth: CONTENT_W - 389, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    // Land row
    const landArea = this.getF('landAreaSqft', '3920');
    const landRate = this.getF('landRateSqft', '2200');
    const landVal = Number(this.getF('landValuationVal', 8624000));
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Land', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: `${landArea} sq.ft`, value: '', labelWidth: 70, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(Number(landRate))}/-`, value: '', labelWidth: 75, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(landVal)}/- (A)`, value: '', labelWidth: CONTENT_W - 389, valueWidth: 0, labelBold: true },
    ]);

    // Construction row
    const constrDesc = this.getF('constructionDesc', 'Construction (G+1) {GF-2850sqft, FF-840sqft}, Total BUA-3690sqft');
    const constrArea = this.getF('constructionAreaSqft', '3690');
    const constrRate = this.getF('constructionRateSqft', '1200');
    const constrVal = Number(this.getF('constructionValuationVal', 4428000));
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: constrDesc, value: '', labelWidth: 220, valueWidth: 0 },
      { label: `${constrArea} sqft`, value: '', labelWidth: 70, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(Number(constrRate))}/-`, value: '', labelWidth: 75, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(constrVal)}/-`, value: '', labelWidth: CONTENT_W - 389, valueWidth: 0 },
    ]);

    // Stage of construction & Recommended Construction Value
    const stage = this.getF('stageOfConstruction', '100%');
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Stage of construction', value: '', labelWidth: 220, valueWidth: 0 },
      { label: stage, value: '', labelWidth: 70, valueWidth: 0 },
      { label: stage, value: '', labelWidth: 75, valueWidth: 0 },
      { label: stage, value: '', labelWidth: CONTENT_W - 389, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Recommended Construction Value', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: '', value: '', labelWidth: 145, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(constrVal)}/- (B)`, value: '', labelWidth: CONTENT_W - 389, valueWidth: 0, labelBold: true },
    ]);

    // Extra Amenities
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: '(B) Value of Extra Amenities if applicable', value: '', labelWidth: CONTENT_W - 24, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    const amColW = (CONTENT_W - 24) / 6;
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Car Parking', value: '', labelWidth: amColW, valueWidth: 0 },
      { label: 'PLC', value: '', labelWidth: amColW, valueWidth: 0 },
      { label: 'IDC', value: '', labelWidth: amColW, valueWidth: 0 },
      { label: 'EDC', value: '', labelWidth: amColW, valueWidth: 0 },
      { label: 'Power Backup', value: '', labelWidth: amColW, valueWidth: 0 },
      { label: 'Other', value: '', labelWidth: CONTENT_W - 24 - 5 * amColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: this.getF('amenityCarParking', 'NA'), value: '', labelWidth: amColW, valueWidth: 0 },
      { label: this.getF('amenityPlc', 'NA'), value: '', labelWidth: amColW, valueWidth: 0 },
      { label: this.getF('amenityIdc', 'NA'), value: '', labelWidth: amColW, valueWidth: 0 },
      { label: this.getF('amenityEdc', 'NA'), value: '', labelWidth: amColW, valueWidth: 0 },
      { label: this.getF('amenityPowerBackup', 'NA'), value: '', labelWidth: amColW, valueWidth: 0 },
      { label: this.getF('amenityOther', 'NA'), value: '', labelWidth: CONTENT_W - 24 - 5 * amColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Amenities charges', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: this.getF('totalAmenitiesCharges', 'Nil'), value: '', labelWidth: CONTENT_W - 244, valueWidth: 0 },
    ]);

    // Market Value Summary
    const totalMarketVal = Number(this.getF('totalMarketValue', landVal + constrVal));
    const forcedSalePct = Number(this.getF('forcedSalePercent', 80));
    const forcedSaleVal = Number(this.getF('forcedSaleValue', Math.round((totalMarketVal * forcedSalePct) / 100)));
    const approxRentals = this.getF('approxRentals', 'Rs. 25,000/-');

    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Market Value of Property (A+B)', value: '', labelWidth: 270, valueWidth: 0, labelBold: true },
      { label: `Rs. ${formatIndianCurrency(totalMarketVal)}/-`, value: '', labelWidth: CONTENT_W - 294, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: `Forced Sale Value (${forcedSalePct}%)`, value: '', labelWidth: 270, valueWidth: 0, labelBold: true },
      { label: `Rs. ${formatIndianCurrency(forcedSaleVal)}/-`, value: '', labelWidth: CONTENT_W - 294, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Approx. Rentals in case of 100% complete property', value: '', labelWidth: 270, valueWidth: 0 },
      { label: approxRentals, value: '', labelWidth: CONTENT_W - 294, valueWidth: 0 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // BOUNDARIES (Point 22)
    // ==========================================
    this.drawMahindraSectionHeader('BOUNDARIES');

    const bColW = (CONTENT_W - 24 - 110) / 4;
    this.drawKeyValueRow([
      { label: '22', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Boundaries', value: '', labelWidth: 110, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'EAST', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'WEST', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'NORTH', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'SOUTH', value: '', labelWidth: CONTENT_W - 24 - 110 - 3 * bColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const bDeed = [
      this.getF('boundaryEastDeed', 'Not Mentioned'),
      this.getF('boundaryWestDeed', 'Not Mentioned'),
      this.getF('boundaryNorthDeed', 'Not Mentioned'),
      this.getF('boundarySouthDeed', 'Not Mentioned'),
    ];
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'As per deed/Sale deed', value: '', labelWidth: 110, valueWidth: 0 },
      { label: bDeed[0], value: '', labelWidth: bColW, valueWidth: 0 },
      { label: bDeed[1], value: '', labelWidth: bColW, valueWidth: 0 },
      { label: bDeed[2], value: '', labelWidth: bColW, valueWidth: 0 },
      { label: bDeed[3], value: '', labelWidth: CONTENT_W - 24 - 110 - 3 * bColW, valueWidth: 0 },
    ]);

    const bSite = [
      this.getF('boundaryEastSite', "Other's Building"),
      this.getF('boundaryWestSite', "Other's Building"),
      this.getF('boundaryNorthSite', '30-ft wide Road'),
      this.getF('boundarySouthSite', "Other's Building"),
    ];
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'At site', value: '', labelWidth: 110, valueWidth: 0 },
      { label: bSite[0], value: '', labelWidth: bColW, valueWidth: 0 },
      { label: bSite[1], value: '', labelWidth: bColW, valueWidth: 0 },
      { label: bSite[2], value: '', labelWidth: bColW, valueWidth: 0 },
      { label: bSite[3], value: '', labelWidth: CONTENT_W - 24 - 110 - 3 * bColW, valueWidth: 0 },
    ]);

    const bSketch = [
      this.getF('boundaryEastSketch', 'Plot No-757 (Gani Das)'),
      this.getF('boundaryWestSketch', 'Plot No-752 (Govt.)'),
      this.getF('boundaryNorthSketch', 'Plot No-755 (Govt.) & Plot No-707 (Govt. Road)'),
      this.getF('boundarySouthSketch', 'Plot No-761/3058 (Sumitra Sahoo)'),
    ];
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'As per sketch map', value: '', labelWidth: 110, valueWidth: 0 },
      { label: bSketch[0], value: '', labelWidth: bColW, valueWidth: 0 },
      { label: bSketch[1], value: '', labelWidth: bColW, valueWidth: 0 },
      { label: bSketch[2], value: '', labelWidth: bColW, valueWidth: 0 },
      { label: bSketch[3], value: '', labelWidth: CONTENT_W - 24 - 110 - 3 * bColW, valueWidth: 0 },
    ]);

    this.drawMahindraRow(
      '',
      'Boundaries Matching',
      this.getF('boundariesMatching', 'Yes (Boundary matching as per sketch map)'),
      true
    );

    // Remarks
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      {
        label: 'Remarks:-',
        value: this.getF('remarks', ''),
        labelWidth: 80,
        valueWidth: CONTENT_W - 104,
        labelBold: true,
      },
    ]);

    this.advanceCursor(8);

    // ==========================================
    // DECLARATION & SIGN OFF
    // ==========================================
    this.drawMahindraSectionHeader('Declaration:-');

    const declarations = [
      '1.  I hereby declare that; I have no direct and indirect interest in the property valued and the information furnished in the report is true and correct to the best of my knowledge of belief.',
      '2.  Any additions or alterations after the date of inspection shall not fall under the scope of this report.',
      '3.  The legal aspects are not in the scope of evaluation of the property.',
      '4.  The Property is identified by the owner before the valuer. This valuation report is prepared without any prejudice and bias to any person or institution.',
      '5.  This report has been prepared on basis of verifications in the locality.',
      '6.  I am not required to given testimony or appear in court by any reason of this appraisal report, with reference to the property in question.',
    ];

    declarations.forEach(dec => {
      this.drawKeyValueRow([
        { label: dec, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    this.advanceCursor(12);

    this.drawKeyValueRow([
      {
        label: `Name of Engineer who visited the property: -${this.getF('engineerName', 'Er. Satyajit Mohanty')}`,
        value: '(Authorized Signatory)',
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
        labelBold: true,
      },
    ]);

    // Attachments
    if (this.fields.documentImages?.length > 0) {
      await this.drawDocumentsGallery(this.fields.documentImages);
    }
    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.sketchMapImages || []),
    ];
    if (maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION SKETCH / ROUTE MAP');
    }
    if (this.fields.propertyImages?.length > 0) {
      await this.drawPhotoGrid(this.fields.propertyImages);
    }
  }
}
