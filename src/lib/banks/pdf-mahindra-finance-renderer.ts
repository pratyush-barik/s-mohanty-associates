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
      { label: 'Type of Case', value: this.getF('typeOfCase', 'LAP'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Valuer Name', value: this.getF('valuerName', 'Er. Satyajit Mohanty'), labelWidth: 100, valueWidth: halfW - 100, labelBold: true },
      { label: 'Date of Visit', value: this.getF('dateOfVisit', ''), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Case Ref. No', value: this.getF('refNo', this.projectCode || ''), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Date of Report', value: this.getF('reportDate', new Date().toLocaleDateString('en-GB')), labelWidth: 100, valueWidth: halfW - 100 },
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
    const p2LabelW = 120;
    const p2RemW = CONTENT_W - 24 - p2LabelW;
    const p2SubW = p2RemW / 2;
    this.drawKeyValueRow([
      { label: '2', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Type of property', value: this.getF('propertyTypeDesc', ''), labelWidth: p2LabelW, valueWidth: p2SubW },
      { label: 'Current Usage', value: this.getF('currentUsage', 'Commercial'), labelWidth: 80, valueWidth: p2SubW - 80 },
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
    const locNumW = 24;
    const locCatW = 80;
    const locSubW = 120;
    const locValW = CONTENT_W - locNumW - locCatW - locSubW;

    const locRows = [
      { label: 'Type (Comm., Res, Ind, Mix)', val: this.getF('localityType', 'Commercial') },
      { label: 'Class of Locality', val: this.getF('localityClass', 'Middle Class') },
      { label: 'Site is (Dev, Under Dev)', val: this.getF('siteStatus', 'Developing') },
      { label: 'Proximity to civic amenities/public transport', val: this.getF('proximityAmenities', '') },
      { label: 'Railway Station', val: this.getF('railwayStation', '') },
      { label: 'Bus Stop', val: this.getF('busStop', '') },
    ];

    locRows.forEach((r, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '5' : '', value: '', labelWidth: locNumW, valueWidth: 0, labelBold: true },
        { label: idx === 0 ? 'Location' : '', value: '', labelWidth: locCatW, valueWidth: 0, labelBold: idx === 0 },
        { label: r.label, value: r.val || 'NA', labelWidth: locSubW, valueWidth: locValW },
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

    const pNumW = 24;
    const pCatW = 80;
    const pSubW = 120;
    const pValW = CONTENT_W - pNumW - pCatW - pSubW;

    // 9. Occupant
    const occRows = [
      { label: 'Vacant/Occupied', val: this.getF('occupantStatus', 'Tenant') },
      { label: 'Name of Occupant', val: this.getF('occupantName', '') },
      { label: 'Relation with applicant', val: this.getF('occupantRelation', '') },
    ];
    occRows.forEach((r, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '9' : '', value: '', labelWidth: pNumW, valueWidth: 0, labelBold: true },
        { label: idx === 0 ? 'Occupant' : '', value: '', labelWidth: pCatW, valueWidth: 0, labelBold: idx === 0 },
        { label: r.label, value: r.val || 'NA', labelWidth: pSubW, valueWidth: pValW },
      ]);
    });

    // 10. Building details
    const bldRows = [
      { label: 'Property Demarcation', val: this.getF('propertyDemarcation', 'No') },
      { label: 'Property Identified through', val: this.getF('propertyIdentifiedThrough', '') },
      { label: 'Type of structure', val: this.getF('structureType', 'Load Bearing structure') },
      { label: 'Land/Plot Area', val: this.getF('landPlotAreaDesc', '') },
      { label: 'No of Blocks', val: this.getF('noOfBlocks', 'NA') },
      { label: 'No of Units', val: this.getF('noOfUnits', 'NA') },
      { label: 'No. of Floors', val: this.getF('noOfFloors', '') },
      { label: 'No. of Lifts', val: this.getF('noOfLifts', 'NA') },
    ];
    bldRows.forEach((r, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '10' : '', value: '', labelWidth: pNumW, valueWidth: 0, labelBold: true },
        { label: idx === 0 ? 'Building details' : '', value: '', labelWidth: pCatW, valueWidth: 0, labelBold: idx === 0 },
        { label: r.label, value: r.val || 'NA', labelWidth: pSubW, valueWidth: pValW },
      ]);
    });

    // 11. Unit details
    const unitRows = [
      { label: 'Located on Floor No.', val: this.getF('unitFloorNo', 'NA') },
      { label: 'No. of rooms', val: this.getF('unitRooms', 'NA') },
      { label: 'Built up area Measured', val: this.getF('unitBuaMeasured', '') },
      { label: 'Carpet area', val: this.getF('unitCarpetArea', '') },
      { label: 'Remarks on view from property', val: this.getF('unitRemarksView', 'NA') },
    ];
    unitRows.forEach((r, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '11' : '', value: '', labelWidth: pNumW, valueWidth: 0, labelBold: true },
        { label: idx === 0 ? 'Unit details' : '', value: '', labelWidth: pCatW, valueWidth: 0, labelBold: idx === 0 },
        { label: r.label, value: r.val || 'NA', labelWidth: pSubW, valueWidth: pValW },
      ]);
    });

    // 12. Quality of construction
    this.drawMahindraRow('12', 'Quality of construction (Good /Avg./ Bad)', `Exteriors: ${this.getF('qualityExteriors', 'Good')} | Interiors: ${this.getF('qualityInteriors', 'Good')}`);

    // 13. Age of property & Residual life
    this.drawMahindraRow('13', 'Age of the property / Residual life', `Age: ${this.getF('ageOfProperty', '')} | Residual: ${this.getF('residualLife', '')}`);

    this.advanceCursor(4);

    this.advanceCursor(4);

    // ==========================================
    // SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS
    // ==========================================
    this.drawMahindraSectionHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS');

    this.drawMahindraRow('14', 'Sanctioned plans verified with approval no', this.getF('sanctionApprovalNo', 'Plan not provided'));
    this.drawMahindraRow('15', 'Ownership type (Leasehold/ Freehold)', this.getF('ownershipType', 'Freehold'));
    this.drawMahindraRow('16', 'Property documents verified', this.getF('documentsVerified', 'Copy of Sale deed, ROR & Sketch map'));
    this.drawMahindraRow('17', 'Is the property within Municipal Limits', this.getF('municipalLimits', 'Yes'));
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
        { label: '', value: s.plan, labelWidth: 0, valueWidth: 100 },
        { label: '', value: s.site, labelWidth: 0, valueWidth: 80 },
        { label: '', value: s.dev, labelWidth: 0, valueWidth: 60 },
        { label: '', value: s.rem, labelWidth: 0, valueWidth: CONTENT_W - 364 },
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
      { label: '', value: this.getF('permBasement', 'NA'), labelWidth: 0, valueWidth: 50 },
      { label: '', value: this.getF('permStilt', 'NA'), labelWidth: 0, valueWidth: 50 },
      { label: '', value: this.getF('permGround', 'NA'), labelWidth: 0, valueWidth: 60 },
      { label: '', value: this.getF('permFirst', 'NA'), labelWidth: 0, valueWidth: 60 },
      { label: '', value: this.getF('permSecond', 'NA'), labelWidth: 0, valueWidth: 55 },
      { label: '', value: this.getF('permThird', 'NA'), labelWidth: 0, valueWidth: CONTENT_W - 399 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Constructed', value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('constBasement', 'NA'), labelWidth: 0, valueWidth: 50 },
      { label: '', value: this.getF('constStilt', 'NA'), labelWidth: 0, valueWidth: 50 },
      { label: '', value: this.getF('constGround', ''), labelWidth: 0, valueWidth: 60 },
      { label: '', value: this.getF('constFirst', ''), labelWidth: 0, valueWidth: 60 },
      { label: '', value: this.getF('constSecond', 'NA'), labelWidth: 0, valueWidth: 55 },
      { label: '', value: this.getF('constThird', 'NA'), labelWidth: 0, valueWidth: CONTENT_W - 399 },
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
    const landArea = this.getF('landAreaSqft', '');
    const landRate = this.getF('landRateSqft', '');
    const landVal = Number(this.getF('landValuationVal', 0));
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Land', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: '', value: landArea ? `${landArea} sq.ft` : '', labelWidth: 0, valueWidth: 70 },
      { label: '', value: landRate ? `Rs. ${formatIndianCurrency(Number(landRate))}/-` : '', labelWidth: 0, valueWidth: 75 },
      { label: '', value: landVal ? `Rs. ${formatIndianCurrency(landVal)}/- (A)` : '', labelWidth: 0, valueWidth: CONTENT_W - 389, valueBold: true },
    ]);

    // Construction row
    const constrDesc = this.getF('constructionDesc', 'Construction');
    const constrArea = this.getF('constructionAreaSqft', '');
    const constrRate = this.getF('constructionRateSqft', '');
    const constrVal = Number(this.getF('constructionValuationVal', 0));
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: constrDesc, value: '', labelWidth: 220, valueWidth: 0 },
      { label: '', value: constrArea ? `${constrArea} sqft` : '', labelWidth: 0, valueWidth: 70 },
      { label: '', value: constrRate ? `Rs. ${formatIndianCurrency(Number(constrRate))}/-` : '', labelWidth: 0, valueWidth: 75 },
      { label: '', value: constrVal ? `Rs. ${formatIndianCurrency(constrVal)}/-` : '', labelWidth: 0, valueWidth: CONTENT_W - 389 },
    ]);

    // Stage of construction & Recommended Construction Value
    const stage = this.getF('stageOfConstruction', '100%');
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Stage of construction', value: '', labelWidth: 220, valueWidth: 0 },
      { label: '', value: stage, labelWidth: 0, valueWidth: 70 },
      { label: '', value: stage, labelWidth: 0, valueWidth: 75 },
      { label: '', value: stage, labelWidth: 0, valueWidth: CONTENT_W - 389 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Recommended Construction Value', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: '', value: '', labelWidth: 145, valueWidth: 0 },
      { label: '', value: constrVal ? `Rs. ${formatIndianCurrency(constrVal)}/- (B)` : '', labelWidth: 0, valueWidth: CONTENT_W - 389, valueBold: true },
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
      { label: '', value: this.getF('amenityCarParking', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityPlc', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityIdc', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityEdc', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityPowerBackup', 'NA'), labelWidth: 0, valueWidth: amColW },
      { label: '', value: this.getF('amenityOther', 'NA'), labelWidth: 0, valueWidth: CONTENT_W - 24 - 5 * amColW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Amenities charges', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('totalAmenitiesCharges', 'Nil'), labelWidth: 0, valueWidth: CONTENT_W - 244 },
    ]);

    // Market Value Summary
    const totalMarketVal = Number(this.getF('totalMarketValue', landVal + constrVal));
    const forcedSalePct = Number(this.getF('forcedSalePercent', 80));
    const forcedSaleVal = Number(this.getF('forcedSaleValue', Math.round((totalMarketVal * forcedSalePct) / 100)));
    const approxRentals = this.getF('approxRentals', '');

    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Market Value of Property (A+B)', value: '', labelWidth: 270, valueWidth: 0, labelBold: true },
      { label: '', value: totalMarketVal ? `Rs. ${formatIndianCurrency(totalMarketVal)}/-` : '', labelWidth: 0, valueWidth: CONTENT_W - 294, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: `Forced Sale Value (${forcedSalePct}%)`, value: '', labelWidth: 270, valueWidth: 0, labelBold: true },
      { label: '', value: forcedSaleVal ? `Rs. ${formatIndianCurrency(forcedSaleVal)}/-` : '', labelWidth: 0, valueWidth: CONTENT_W - 294, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Approx. Rentals in case of 100% complete property', value: '', labelWidth: 270, valueWidth: 0 },
      { label: '', value: approxRentals || 'NA', labelWidth: 0, valueWidth: CONTENT_W - 294 },
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
      this.getF('boundaryEastDeed', ''),
      this.getF('boundaryWestDeed', ''),
      this.getF('boundaryNorthDeed', ''),
      this.getF('boundarySouthDeed', ''),
    ];
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'As per deed/Sale deed', value: '', labelWidth: 110, valueWidth: 0 },
      { label: '', value: bDeed[0] || 'Not Mentioned', labelWidth: 0, valueWidth: bColW },
      { label: '', value: bDeed[1] || 'Not Mentioned', labelWidth: 0, valueWidth: bColW },
      { label: '', value: bDeed[2] || 'Not Mentioned', labelWidth: 0, valueWidth: bColW },
      { label: '', value: bDeed[3] || 'Not Mentioned', labelWidth: 0, valueWidth: CONTENT_W - 24 - 110 - 3 * bColW },
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
      { label: '', value: bSite[0] || 'NA', labelWidth: 0, valueWidth: bColW },
      { label: '', value: bSite[1] || 'NA', labelWidth: 0, valueWidth: bColW },
      { label: '', value: bSite[2] || 'NA', labelWidth: 0, valueWidth: bColW },
      { label: '', value: bSite[3] || 'NA', labelWidth: 0, valueWidth: CONTENT_W - 24 - 110 - 3 * bColW },
    ]);

    const bSketch = [
      this.getF('boundaryEastSketch', ''),
      this.getF('boundaryWestSketch', ''),
      this.getF('boundaryNorthSketch', ''),
      this.getF('boundarySouthSketch', ''),
    ];
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'As per sketch map', value: '', labelWidth: 110, valueWidth: 0 },
      { label: '', value: bSketch[0] || 'NA', labelWidth: 0, valueWidth: bColW },
      { label: '', value: bSketch[1] || 'NA', labelWidth: 0, valueWidth: bColW },
      { label: '', value: bSketch[2] || 'NA', labelWidth: 0, valueWidth: bColW },
      { label: '', value: bSketch[3] || 'NA', labelWidth: 0, valueWidth: CONTENT_W - 24 - 110 - 3 * bColW },
    ]);

    this.drawMahindraRow(
      '',
      'Boundaries Matching',
      this.getF('boundariesMatching', 'Yes'),
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
