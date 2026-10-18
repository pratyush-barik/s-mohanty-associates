import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFNeoGrowthRenderer extends PDFBankRenderer {
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
   * Section Header row with solid banner
   */
  private drawNeoSectionHeader(title: string) {
    this.drawSectionHeader(title);
  }

  /**
   * Standard 3-column row: [Col 1: Number (width 24)] | [Col 2: Label (width ~200)] | [Col 3: Value (rest)]
   */
  private drawNeoRow(num: string, label: string, value: string, boldVal: boolean = false) {
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
        value: value || 'NA',
        labelWidth: labelW,
        valueWidth: valW,
        labelBold: false,
        bold: boldVal,
      },
    ]);
  }

  async drawContent(): Promise<void> {
    // NOTE: init() already adds page 1. Do NOT call this.addPage() here.

    // Top Header Title
    this.drawCenteredTitle('VALUATION REPORT', 14, true);
    this.advanceCursor(4);

    // ==========================================
    // TOP META TABLE
    // ==========================================
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: 'Branch Name', value: this.getF('branchName', ''), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Type of Case', value: this.getF('typeOfCase', ''), labelWidth: 100, valueWidth: halfW - 100 },
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
        labelWidth: 180,
        valueWidth: CONTENT_W - 180,
      },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // BASIC DETAILS
    // ==========================================
    this.drawNeoSectionHeader('BASIC DETAILS');

    this.drawNeoRow('1', "Applicant/s Name/s", this.getF('applicantName', ''), true);

    // Row 2: Type of property & Current Usage
    const p2LabelW = 120;
    const p2ValW = 120;
    const p2SubLabelW = 90;
    const p2SubValW = CONTENT_W - 24 - p2LabelW - p2ValW - p2SubLabelW;
    this.drawKeyValueRow([
      { label: '2', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Type of property', value: this.getF('propertyTypeDesc', ''), labelWidth: p2LabelW, valueWidth: p2ValW },
      { label: 'Current Usage', value: this.getF('currentUsage', ''), labelWidth: p2SubLabelW, valueWidth: p2SubValW },
    ]);

    this.drawNeoRow('3', 'Address at site', this.getF('addressAtSite', ''));
    this.drawNeoRow('', 'Address as per document', this.getF('addressAsPerDoc', ''));
    this.drawNeoRow(
      '4',
      'Has the valuator done valuation of this property before this? If yes, when, for whom?',
      this.getF('priorValuation', 'No')
    );

    this.advanceCursor(4);

    // ==========================================
    // SURROUNDING & LOCALITY DETAILS
    // ==========================================
    this.drawNeoSectionHeader('SURROUNDING & LOCALITY DETAILS');

    // Row 5: Location sub-breakdown
    const locRows = [
      { label: 'Type(Comm., Res, Ind, Mix)', val: this.getF('localityType', '') },
      { label: 'Class of Locality', val: this.getF('localityClass', '') },
      { label: 'Site is (Dev, Under Dev)', val: this.getF('siteStatus', '') },
      { label: 'Proximity to civic amenities/public transport', val: this.getF('proximityAmenities', '') },
      { label: 'Railway Station', val: this.getF('railwayStation', '') },
      { label: 'Bus Stop', val: this.getF('busStop', '') },
    ];

    locRows.forEach((r, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '5' : '', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
        { label: idx === 0 ? 'Location' : '', value: '', labelWidth: 130, valueWidth: 0, labelBold: idx === 0 },
        { label: r.label, value: r.val || 'NA', labelWidth: 170, valueWidth: CONTENT_W - 24 - 130 - 170 },
      ]);
    });

    this.drawNeoRow('6', 'Close Vicinity/Landmark', this.getF('landmark', ''));
    this.drawNeoRow('7', 'Distance from City Center', this.getF('distanceCityCenter', ''));
    this.drawNeoRow('8', 'Condition and width of approach road', this.getF('approachRoad', ''));

    this.advanceCursor(4);

    // ==========================================
    // PROPERTY DETAILS
    // ==========================================
    this.drawNeoSectionHeader('PROPERTY DETAILS');

    // 9. Occupant
    this.drawKeyValueRow([
      { label: '9', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Occupant', value: '', labelWidth: 130, valueWidth: 0, labelBold: true },
      { label: 'Vacant/Occupied', value: this.getF('occupantStatus', ''), labelWidth: 170, valueWidth: CONTENT_W - 24 - 130 - 170 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: '', value: '', labelWidth: 130, valueWidth: 0 },
      { label: 'Name of Occupant', value: this.getF('occupantName', ''), labelWidth: 170, valueWidth: CONTENT_W - 24 - 130 - 170 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: '', value: '', labelWidth: 130, valueWidth: 0 },
      { label: 'Relation with applicant', value: this.getF('occupantRelation', ''), labelWidth: 170, valueWidth: CONTENT_W - 24 - 130 - 170 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: '', value: '', labelWidth: 130, valueWidth: 0 },
      { label: 'Property Demarcation', value: this.getF('propertyDemarcation', ''), labelWidth: 170, valueWidth: CONTENT_W - 24 - 130 - 170 },
    ]);

    // 10. Building details
    const bldRows = [
      { label: 'Property Identified through', val: this.getF('propertyIdentifiedThrough', '') },
      { label: 'Type of structure', val: this.getF('structureType', '') },
      { label: 'Land', val: this.getF('landPlotAreaDesc', '') },
      { label: 'No of Blocks', val: this.getF('noOfBlocks', 'NA') },
      { label: 'No of Units', val: this.getF('noOfUnits', 'NA') },
      { label: 'No. of Floors', val: this.getF('noOfFloors', '') },
      { label: 'No. of Lifts', val: this.getF('noOfLifts', 'Nil') },
    ];
    bldRows.forEach((r, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '10' : '', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
        { label: idx === 0 ? 'Building details' : '', value: '', labelWidth: 130, valueWidth: 0, labelBold: idx === 0 },
        { label: r.label, value: r.val || 'NA', labelWidth: 170, valueWidth: CONTENT_W - 24 - 130 - 170 },
      ]);
    });

    // 11. Unit details
    const unitRows = [
      { label: 'Located on Floor No.', val: this.getF('unitFloorNo', 'NA') },
      { label: 'No. of rooms', val: this.getF('unitRooms', 'GF-(3-Bed Room,2-Toilet,1-Kitchen)') },
      { label: 'Built up area', val: this.getF('unitBuaMeasured', '1315sqft (GF) Actual\n2X1306sqft (G+1) Approval') },
      { label: 'Carpet area(approx.)', val: this.getF('unitCarpetArea', '1110Sqft (Actual)') },
      { label: 'Land freehold or leasehold', val: this.getF('landFreeholdLeasehold', 'Freehold') },
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
      { label: 'Quality of construction (Good /Avg / Bad)', value: '', labelWidth: 200, valueWidth: 0 },
      { label: 'Exteriors', value: this.getF('qualityExteriors', ''), labelWidth: 60, valueWidth: (CONTENT_W - 224) / 2 - 60 },
      { label: 'Interiors', value: this.getF('qualityInteriors', ''), labelWidth: 60, valueWidth: (CONTENT_W - 224) / 2 - 60 },
    ]);

    // 13. Age of property & Residual life
    const halfRowW = (CONTENT_W - 24 - 200) / 2;
    this.drawKeyValueRow([
      { label: '13', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Age of the property', value: this.getF('ageOfProperty', ''), labelWidth: 200, valueWidth: halfRowW },
      { label: 'Residual life', value: this.getF('residualLife', ''), labelWidth: 70, valueWidth: halfRowW - 70 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS
    // ==========================================
    this.drawNeoSectionHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS');

    this.drawNeoRow('14', 'Sanctioned plans verified with approval no', this.getF('sanctionApprovalNo', ''));
    this.drawNeoRow('15', 'Ownership type (Leasehold/ Freehold)', this.getF('ownershipType', ''));
    this.drawNeoRow('16', 'Property documents verified', this.getF('documentsVerified', ''));
    this.drawNeoRow('17', 'Is the property within Municipal Limits', this.getF('municipalLimits', ''));
    this.drawNeoRow('18', 'Permissible usage allow as per master plan', this.getF('permissibleUsageMasterPlan', 'Residential'));

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
      { name: 'Front', plan: this.getF('setbackFrontPlan', 'NA'), site: this.getF('setbackFrontSite', 'NA'), dev: this.getF('setbackFrontDev', 'Nil'), rem: this.getF('setbackFrontRem', 'NA') },
      { name: 'Side1(Left)', plan: this.getF('setbackSide1Plan', 'NA'), site: this.getF('setbackSide1Site', 'NA'), dev: this.getF('setbackSide1Dev', ''), rem: this.getF('setbackSide1Rem', '') },
      { name: 'Side2(Right)', plan: this.getF('setbackSide2Plan', 'NA'), site: this.getF('setbackSide2Site', 'NA'), dev: this.getF('setbackSide2Dev', ''), rem: this.getF('setbackSide2Rem', '') },
      { name: 'Rear', plan: this.getF('setbackRearPlan', 'NA'), site: this.getF('setbackRearSite', 'NA'), dev: this.getF('setbackRearDev', ''), rem: this.getF('setbackRearRem', '') },
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
      { label: 'Floor Wise Area (In Sft.)', value: '', labelWidth: 130, valueWidth: 0, labelBold: true },
      { label: 'Basement', value: '', labelWidth: 50, valueWidth: 0, highlight: true },
      { label: 'Stilt', value: '', labelWidth: 50, valueWidth: 0, highlight: true },
      { label: 'Ground', value: '', labelWidth: 60, valueWidth: 0, highlight: true },
      { label: 'First', value: '', labelWidth: 60, valueWidth: 0, highlight: true },
      { label: 'Second', value: '', labelWidth: 55, valueWidth: 0, highlight: true },
      { label: 'Third', value: '', labelWidth: CONTENT_W - 379, valueWidth: 0, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Permissible area', value: '', labelWidth: 130, valueWidth: 0 },
      { label: '', value: this.getF('permBasement', 'NA'), labelWidth: 0, valueWidth: 50 },
      { label: '', value: this.getF('permStilt', 'NA'), labelWidth: 0, valueWidth: 50 },
      { label: '', value: this.getF('permGround', ''), labelWidth: 0, valueWidth: 60 },
      { label: '', value: this.getF('permFirst', ''), labelWidth: 0, valueWidth: 60 },
      { label: '', value: this.getF('permSecond', 'Nil'), labelWidth: 0, valueWidth: 55 },
      { label: '', value: this.getF('permThird', 'Nil'), labelWidth: 0, valueWidth: CONTENT_W - 379 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Constructed', value: '', labelWidth: 130, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('constBasement', 'NA'), labelWidth: 0, valueWidth: 50 },
      { label: '', value: this.getF('constStilt', 'NA'), labelWidth: 0, valueWidth: 50 },
      { label: '', value: this.getF('constGround', ''), labelWidth: 0, valueWidth: 60 },
      { label: '', value: this.getF('constFirst', 'NA'), labelWidth: 0, valueWidth: 60 },
      { label: '', value: this.getF('constSecond', 'NA'), labelWidth: 0, valueWidth: 55 },
      { label: '', value: this.getF('constThird', 'Nil'), labelWidth: 0, valueWidth: CONTENT_W - 379 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // VALUATION (Point 21)
    // ==========================================
    this.drawNeoSectionHeader('VALUATION');

    this.drawKeyValueRow([
      { label: '21', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: '(A)Description of Constructed Area and Rates', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: 'Area(Sft.)', value: '', labelWidth: 70, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate/(Sft.)', value: '', labelWidth: 75, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Amount (Rs.)', value: '', labelWidth: CONTENT_W - 389, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    // Land row
    const landArea = this.getF('landAreaSqft', '');
    const landRate = this.getF('landRateSqft', '');
    const landVal = Number(this.getF('landValuationVal', 1828800));
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Land', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: `${landArea}sqft`, value: '', labelWidth: 70, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(Number(landRate))}/-`, value: '', labelWidth: 75, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(landVal)}/-`, value: '', labelWidth: CONTENT_W - 389, valueWidth: 0, labelBold: true },
    ]);

    // Construction row
    const constrDesc = this.getF('constructionDesc', 'Construction');
    const constrArea = this.getF('constructionAreaSqft', '');
    const constrRate = this.getF('constructionRateSqft', '');
    const constrVal = Number(this.getF('constructionValuationVal', 2612000));
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: constrDesc, value: '', labelWidth: 220, valueWidth: 0 },
      { label: `${constrArea}sqft`, value: '', labelWidth: 70, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(Number(constrRate))}/-`, value: '', labelWidth: 75, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(constrVal)}/-`, value: '', labelWidth: CONTENT_W - 389, valueWidth: 0 },
    ]);

    // Present stage of construction & Total
    const stage = this.getF('stageOfConstruction', '100%');
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Present stage of construction', value: '', labelWidth: 220, valueWidth: 0 },
      { label: stage, value: '', labelWidth: 70, valueWidth: 0 },
      { label: '', value: '', labelWidth: 75, valueWidth: 0 },
      { label: '', value: '', labelWidth: CONTENT_W - 389, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: '', value: '', labelWidth: 145, valueWidth: 0 },
      { label: `Rs. ${formatIndianCurrency(landVal + constrVal)}/-`, value: '', labelWidth: CONTENT_W - 389, valueWidth: 0, labelBold: true },
    ]);

    // Extra Amenities
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: '(B)Value of Extra Amenities if applicable', value: '', labelWidth: CONTENT_W - 24, valueWidth: 0, labelBold: true, highlight: true },
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
      { label: '', value: this.getF('amenityCarParking', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityPlc', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityIdc', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityEdc', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityPowerBackup', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityOther', 'NA'), labelWidth: 0, valueWidth: CONTENT_W - 24 - 5 * amColW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Amenities charges', value: this.getF('totalAmenitiesCharges', 'Nil'), labelWidth: 220, valueWidth: CONTENT_W - 244, labelBold: true },
    ]);

    // Market Value Summary
    const totalMarketVal = Number(this.getF('totalMarketValue', landVal + constrVal));
    const forcedSalePct = Number(this.getF('forcedSalePercent', 80));
    const forcedSaleVal = Number(this.getF('forcedSaleValue', Math.round((totalMarketVal * forcedSalePct) / 100)));
    const approxRentals = this.getF('approxRentals', 'NA');

    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Market Value of Property (A+B) as on date', value: totalMarketVal ? `Rs. ${formatIndianCurrency(totalMarketVal)}/-` : '', labelWidth: 290, valueWidth: CONTENT_W - 314, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: `Forced Sale Value(${forcedSalePct}%)`, value: forcedSaleVal ? `Rs. ${formatIndianCurrency(forcedSaleVal)}/-` : '', labelWidth: 290, valueWidth: CONTENT_W - 314, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Approx. Rentals in case of 100% complete property', value: approxRentals, labelWidth: 290, valueWidth: CONTENT_W - 314 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // BOUNDARIES (Point 22) & RISK OF DEMOLITION (Point 23)
    // ==========================================
    this.drawNeoSectionHeader('BOUNDARIES');

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
      this.getF('boundaryEastDeed', ''),
      this.getF('boundaryWestDeed', ''),
      this.getF('boundaryNorthDeed', ''),
      this.getF('boundarySouthDeed', ''),
    ];
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'As per Sale Deed', value: '', labelWidth: 110, valueWidth: 0 },
      { label: '', value: bDeed[0], labelWidth: 0, valueWidth: bColW },
      { label: '', value: bDeed[1], labelWidth: 0, valueWidth: bColW },
      { label: '', value: bDeed[2], labelWidth: 0, valueWidth: bColW },
      { label: '', value: bDeed[3], labelWidth: 0, valueWidth: CONTENT_W - 24 - 110 - 3 * bColW },
    ]);

    const bSite = [
      this.getF('boundaryEastSite', ''),
      this.getF('boundaryWestSite', ''),
      this.getF('boundaryNorthSite', ''),
      this.getF('boundarySouthSite', ''),
    ];
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'At site', value: '', labelWidth: 110, valueWidth: 0 },
      { label: '', value: bSite[0], labelWidth: 0, valueWidth: bColW },
      { label: '', value: bSite[1], labelWidth: 0, valueWidth: bColW },
      { label: '', value: bSite[2], labelWidth: 0, valueWidth: bColW },
      { label: '', value: bSite[3], labelWidth: 0, valueWidth: CONTENT_W - 24 - 110 - 3 * bColW },
    ]);

    this.drawNeoRow(
      '',
      'Boundaries Matching',
      this.getF('boundariesMatching', 'Yes'),
      true
    );

    // 23. Risk of demolition
    this.drawNeoRow(
      '23',
      'Risk of demolition (High/Medium/Low/Nil)',
      this.getF('riskOfDemolition', 'Nil'),
      true
    );

    // Remarks
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      {
        label: 'Remarks: -',
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
    this.drawNeoSectionHeader('Declaration: -');

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
        label: `Name of Engineer who visited the property: - ${this.getF('engineerName', 'Satyajit Mohanty')}`,
        value: '(Authorized Signature)',
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
