import {
  PDFBankRenderer,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  BORDER_W,
} from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';
import {
  parseSafeFloat,
  multiplyExactDecimals,
  sumDecimals,
  calculatePercentageValue,
} from '../bank-input-constraints';

export class PDFSuryodayRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode?: string;

  constructor(opts: any = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode;
  }

  private getF(key: string, defaultVal: any = ''): any {
    const val = this.fields[key];
    if (val === undefined || val === null || val === '') return defaultVal;
    return val;
  }

  async render(): Promise<Uint8Array> {
    await this.init();
    await this.drawContent();
    return await this.save();
  }

  private drawSuryodaySectionHeader(code: string, title: string) {
    this.checkPageBreak(26);
    this.drawKeyValueRow([
      {
        label: `${code})`,
        value: title.toUpperCase(),
        labelWidth: 32,
        valueWidth: CONTENT_W - 32,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);
  }

  private drawSuryodayRow(num: string | number, label: string, val: string, labelW: number = 240) {
    this.checkPageBreak(20);
    const labelText = num ? `${num}  ${label}` : label;
    this.drawKeyValueRow([
      {
        label: labelText,
        value: val || 'NA',
        labelWidth: labelW,
        valueWidth: CONTENT_W - labelW,
      },
    ]);
  }

  async drawContent(): Promise<void> {
    // ═══════════════════════════════════════════════
    // HEADER BANNER & FIRM CREDENTIALS
    // ═══════════════════════════════════════════════
    this.drawCenteredTitle('Suryoday Small Finance Bank Limited', 14, true);
    this.drawCenteredTitle('Name of Organization & Register No.', 9, false);
    this.advanceCursor(4);

    this.drawCenteredTitle('S MOHANTY ASSOCIATES', 12, true);
    this.drawCenteredTitle('EMPANELLED VALUER & CHARTERED ENGINEER', 10, true);
    this.drawCenteredTitle(
      'Plot No-3183/3678(P),PP-56,Road no-3,Pandav Nagar, Tankapani Road,Bhubaneswar-751018 Regd No.1787/2016/BMC',
      8,
      false
    );
    this.advanceCursor(4);

    this.drawCenteredTitle('VALUATION REPORT', 13, true);
    this.advanceCursor(4);

    // Meta Row: Application No | Date of Inspection | Date of Report
    const appNo = this.getF('applicationNo', this.getF('refNo', this.projectCode || 'APP-2024-0529'));
    const inspDate = this.getF('dateOfInspection', this.getF('inspectionDate', '29.05.2024'));
    const repDate = this.getF('dateOfReport', this.getF('reportDate', '29.05.2024'));

    this.drawKeyValueRow([
      { label: 'Application. No. :', value: String(appNo), labelWidth: 100, valueWidth: 140, labelBold: true },
      { label: 'Date of inspection', value: String(inspDate), labelWidth: 100, valueWidth: 70 },
      { label: 'Date of Report', value: String(repDate), labelWidth: 90, valueWidth: CONTENT_W - 100 - 140 - 100 - 70 - 90 },
    ]);

    // ═══════════════════════════════════════════════
    // A) GENERAL DETAILS
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('A', 'General details');
    this.drawSuryodayRow('1', 'Name of the customer', this.getF('customerName', 'Samir Kumar Mohanty, Mob- 9437077899 / 9338011499'));
    this.drawSuryodayRow('2', 'Name of current owner', this.getF('currentOwner', 'Samir Kumar Mohanty, S/O- Hadibandhu Mohanty'));
    this.drawSuryodayRow('3', 'Name of Proposed owner', this.getF('proposedOwner', 'Samir Kumar Mohanty, S/O- Hadibandhu Mohanty'));
    this.drawSuryodayRow('4', 'Property address (as per docs)', this.getF('propertyAddressDocs', ''));
    this.drawSuryodayRow('5', 'Property address (on inspection) with Pin code', this.getF('propertyAddressInspection', ''));
    this.drawSuryodayRow('6', 'Landmark', this.getF('landmark', 'Near Kusuma Devi Owmens College, Kalyani Nagar'));
    this.drawSuryodayRow('7', 'Latitude & Longitude', this.getF('latLong', 'LAT:-20.449170, LONG- 85.905970'));
    this.drawSuryodayRow('8', 'Property identified through Along with Contact no & Relationship with the customer.', this.getF('propertyIdentifiedThrough', 'Mr. Samir Kumar Mohanty, Mob- 9437077899 / 9338011499'));
    this.drawSuryodayRow('9', 'Property currently occupied by (owner/self/tenant/vacant)', this.getF('occupiedBy', 'Tenants'));
    this.drawSuryodayRow('10', 'If occupied, then since when', this.getF('occupiedSince', '2012'));

    // ═══════════════════════════════════════════════
    // B) SURROUNDING LOCALITY DETAILS
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('B', 'Surrounding locality details');
    this.drawSuryodayRow('1', 'With in the Limitation of', this.getF('withinLimitationOf', 'Within CDA limit'));
    this.drawSuryodayRow('2', 'Habitation & Vicinity ( Surrounding Area )', this.getF('habitationVicinity', 'Residential'));
    this.drawSuryodayRow('3', 'Classification of locality.', this.getF('classificationLocality', 'Middle class'));
    this.drawSuryodayRow('4', 'Condition of approach road along with road width', this.getF('approachRoadCondition', '10-Feet wide Road'));
    this.drawSuryodayRow('5', 'Availability of Amenities such as Drinking water, Drainage Line, electricity, etc. and from.', this.getF('amenitiesAvailability', 'Within 1-2 Kms'));

    // ═══════════════════════════════════════════════
    // C) PROPERTY DETAILS & BOUNDARIES
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('C', 'Property details');
    this.drawSuryodayRow('1', 'Description of property', this.getF('propertyDescription', 'Subject property is a G+2 residential building'));
    this.drawSuryodayRow('2', 'Type of property', this.getF('propertyType', 'Residential'));
    this.drawSuryodayRow('3', 'Type of usage of entire property', this.getF('propertyUsage', 'Residential'));

    // Boundaries Table (Header row: Direction | As Per Site | As per Sale deed)
    this.checkPageBreak(80);
    this.drawKeyValueRow([
      { label: '4  Boundaries', value: '', labelWidth: 140, valueWidth: 0, labelBold: true },
      { label: 'As Per Site', value: '', labelWidth: (CONTENT_W - 140) / 2, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Sale deed', value: '', labelWidth: (CONTENT_W - 140) / 2, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const boundDirections = [
      { key: 'East', label: 'East', site: this.getF('boundaryEastSite', 'Others building(Plot no-667)'), deed: this.getF('boundaryEastDeed', 'Plot no-667') },
      { key: 'West', label: 'West', site: this.getF('boundaryWestSite', '10-Feet wide Road'), deed: this.getF('boundaryWestDeed', 'Passage Road') },
      { key: 'North', label: 'North', site: this.getF('boundaryNorthSite', 'Others building'), deed: this.getF('boundaryNorthDeed', 'Vijilance Colony') },
      { key: 'South', label: 'South', site: this.getF('boundarySouthSite', 'Others building(Manmath Mohanty & Plot no-233)'), deed: this.getF('boundarySouthDeed', 'Manmath Mohanty & Plot no-233') },
    ];

    boundDirections.forEach(b => {
      this.drawKeyValueRow([
        { label: b.label, value: '', labelWidth: 140, valueWidth: 0, labelBold: true },
        { label: b.site, value: '', labelWidth: (CONTENT_W - 140) / 2, valueWidth: 0 },
        { label: b.deed, value: '', labelWidth: (CONTENT_W - 140) / 2, valueWidth: 0 },
      ]);
    });

    this.drawKeyValueRow([
      { label: 'Any Remark on Boundaries', value: this.getF('boundaryRemark', 'Boundary matches as per sale deed'), labelWidth: 240, valueWidth: CONTENT_W - 240 },
    ]);

    this.drawKeyValueRow([
      { label: '5  Plot demarcated at site', value: `Yes / No : ${this.getF('plotDemarcated', 'No')}`, labelWidth: 240, valueWidth: CONTENT_W - 240 },
    ]);

    // ═══════════════════════════════════════════════
    // D) STRUCTURAL DETAILS
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('D', 'Structural details');
    this.drawSuryodayRow('1', 'Type of structure', this.getF('typeOfStructure', 'RCC framed structure'));
    this.drawSuryodayRow('2', 'No. of floors as per site and as per Plan', this.getF('noOfFloorsSiteAndPlan', 'Plan not provide'));
    this.drawSuryodayRow('3', 'No. of wings', this.getF('noOfWings', 'NA'));
    this.drawSuryodayRow('4', 'No. of flats on each floor & Position of Unit', this.getF('noOfFlatsPerFloor', 'NA'));
    this.drawSuryodayRow('5', 'No. of lifts in Building', this.getF('noOfLifts', 'NA'));

    // Stage of Construction (Progress % and Recommend %)
    const progressPct = this.getF('constructionProgress', '100%');
    const recommendPct = this.getF('constructionRecommend', '100%');
    this.checkPageBreak(24);
    this.drawKeyValueRow([
      { label: '6  Stage of Construction\n(For Details Please refer Schedule I )', value: '', labelWidth: 240, valueWidth: 0, labelBold: true },
      { label: 'Progress', value: String(progressPct), labelWidth: 60, valueWidth: 60, labelBold: true },
      { label: 'Recommend', value: String(recommendPct), labelWidth: 80, valueWidth: CONTENT_W - 240 - 120 - 80, labelBold: true },
    ]);

    this.drawSuryodayRow('7', 'Age of the property', this.getF('ageOfProperty', '12-Years'));
    this.drawSuryodayRow('8', 'Future life of the property', this.getF('futureLife', '48-Years'));
    this.drawSuryodayRow('9', 'Quality of construction', this.getF('qualityOfConstruction', 'Good'));

    // ═══════════════════════════════════════════════
    // E) DOCUMENTS DETAILS
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('E', 'Documents details (Complete Details is to be mentioned)');
    this.drawSuryodayRow('1', 'Sale Deed or Agreement for Sale or any other, Etc.\n( Input the details such as Agreement between, Dated,\nRegd. No., Sro No., Agreement Amount )', this.getF('saleDeedDetails', 'Copy of sale deed, ROR, Sketch map'));
    this.drawSuryodayRow('2', 'Construction Permission\n(with Authority name & Sanction No.)', this.getF('constructionPermission', 'Plan not provide'));
    this.drawSuryodayRow('3', 'Completion Certificate (with Authority name & Sanction No.)', this.getF('completionCertificate', 'NA'));
    this.drawSuryodayRow('4', 'Approved Building Plan ( with Sanction No & Date )', this.getF('approvedBuildingPlan', 'Plan not provide'));
    this.drawSuryodayRow('5', 'Land freehold or leasehold', this.getF('landTenure', 'Freehold'));
    this.drawSuryodayRow('6', 'Other Documents if any', this.getF('otherDocuments', 'NA'));

    // RERA row with sub-box
    const reraApp = this.getF('reraApplicable', 'Not applicable');
    const reraReg = this.getF('reraRegNo', 'REG No:-NA');
    this.checkPageBreak(22);
    this.drawKeyValueRow([
      { label: '7  RERA', value: '', labelWidth: 240, valueWidth: 0, labelBold: true },
      { label: 'Applicable /Not applicable', value: String(reraApp), labelWidth: 90, valueWidth: 60 },
      { label: 'REG No:', value: String(reraReg), labelWidth: 60, valueWidth: CONTENT_W - 240 - 150 - 60 },
    ]);

    // ═══════════════════════════════════════════════
    // F) VALUATION
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('F', 'Valuation');
    this.drawSuryodayRow('1', 'Ready Reckoner Rate', this.getF('readyReckonerRate', 'Not Available'));
    this.drawSuryodayRow('2', 'Market rates (Range) of properties in the vicinity and surrounding area', this.getF('marketRateVicinity', 'Rs.3000/- to Rs.3500/- per sqft of land'));
    this.drawSuryodayRow('3', 'Inquiries made from', this.getF('inquiriesFrom', 'Broker & Local Market'));

    this.advanceCursor(4);
    this.checkPageBreak(20);
    this.drawKeyValueRow([
      { label: 'The valuation of the property is as Follow ( Based on details available & provided ) :-', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);

    // ═══════════════════════════════════════════════
    // G) AREA DETAILS FOR LAND & BUILDING
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('G', 'Area details for Land & Building (Min. Area to be consider for Valuation )');
    this.drawSuryodayRow('1', 'Land Area & BUA as per Approved Plan (Sq. Ft.)', this.getF('areaApprovedPlan', 'Plan not provide'));
    this.drawSuryodayRow('2', 'Land Area & BUA as per Document. (Sq. Ft.)', this.getF('areaDocument', 'Land are=3484sqft'));
    this.drawSuryodayRow('3', 'Land Area & BUA as per Site Measurement (Sq. Ft.)', this.getF('areaSiteMeasurement', 'Land are=3484sqft, GF-1311sqft, FF-1311sqft, SF-1311sqft'));
    this.drawSuryodayRow('4', 'Area Considered for Valuation (Sq. Ft.)as per FAR=1.5', this.getF('areaConsideredFar', 'Land are=3484sqft, GF-1311sqft, FF-1311sqft, SF-1311sqft'));
    this.drawSuryodayRow('5', 'Deviation from sanction plan/building byelaws (if any)', this.getF('deviationSanctionPlan', 'NA'));
    this.drawSuryodayRow('6', 'Risk of demolition (valuers views) (Nil, Low/High/Medium)', this.getF('riskOfDemolition', 'Low'));

    // ═══════════════════════════════════════════════
    // H) VALUATION - BY LAND & BUILDING METHOD
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('H', 'Valuation - By Land & Building Method :');

    const landArea = parseSafeFloat(this.getF('landArea', 3484));
    const landRate = parseSafeFloat(this.getF('landRate', 3100));
    const landValue = multiplyExactDecimals(landArea, landRate);
    const landRemark = this.getF('landRemark', '');

    // Land Row Table Header
    this.checkPageBreak(50);
    this.drawKeyValueRow([
      { label: '1', value: 'Land area (Sq. Ft.)', labelWidth: 24, valueWidth: 120, labelBold: true, highlight: true },
      { label: 'Rate adopted / (Sq. Ft.)', value: 'Land value', labelWidth: 120, valueWidth: 110, labelBold: true, highlight: true },
      { label: 'Remark (If any)', value: '', labelWidth: CONTENT_W - 24 - 120 - 120 - 110, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: '', value: `${landArea}`, labelWidth: 24, valueWidth: 120 },
      { label: `Rs. ${landRate}`, value: `Rs. ${formatIndianCurrency(landValue)}`, labelWidth: 120, valueWidth: 110, valueBold: true },
      { label: landRemark, value: '', labelWidth: CONTENT_W - 24 - 120 - 120 - 110, valueWidth: 0 },
    ]);

    // Building Rows (RCC Roofing Only)
    this.checkPageBreak(70);
    this.drawKeyValueRow([
      { label: '2', value: 'Built up area (Sq. Ft.) RCC roofing Only', labelWidth: 24, valueWidth: 140, labelBold: true, highlight: true },
      { label: 'Rate adopted / (Sq. Ft.)', value: 'Stage of Construction', labelWidth: 120, valueWidth: 110, labelBold: true, highlight: true },
      { label: 'Building value', value: '', labelWidth: CONTENT_W - 24 - 140 - 120 - 110, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const bRows = this.fields.buildingRows || [
      { floor: 'G+2', area: 3933, rate: 1500, stage: 100 },
      { floor: 'SF', area: 0, rate: 0, stage: 100 },
      { floor: 'TF', area: 0, rate: 0, stage: 100 },
    ];

    let totalBuildingValue = 0;
    let totalCompletedBuildingValue = 0;

    bRows.forEach((row: any) => {
      const a = parseSafeFloat(row.area);
      const r = parseSafeFloat(row.rate);
      const s = parseSafeFloat(row.stage || 100);
      const fullVal = multiplyExactDecimals(a, r);
      const currVal = calculatePercentageValue(fullVal, s);
      totalBuildingValue = sumDecimals([totalBuildingValue, currVal]);
      totalCompletedBuildingValue = sumDecimals([totalCompletedBuildingValue, fullVal]);

      this.drawKeyValueRow([
        { label: row.floor || 'Floor', value: `${a}`, labelWidth: 50, valueWidth: 114 },
        { label: `Rs. ${r}`, value: `${s}%`, labelWidth: 120, valueWidth: 110 },
        { label: formatIndianCurrency(currVal), value: '', labelWidth: CONTENT_W - 50 - 114 - 120 - 110, valueWidth: 0, labelBold: true },
      ]);
    });

    // Total Building Value row
    this.drawKeyValueRow([
      { label: 'Total :', value: '', labelWidth: 284, valueWidth: 0, labelBold: true },
      { label: formatIndianCurrency(totalBuildingValue), value: '', labelWidth: CONTENT_W - 284, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    // Fair Market Value Present Stage (1+2)
    const presentFMV = sumDecimals([landValue, totalBuildingValue]);
    const completedFMV = sumDecimals([landValue, totalCompletedBuildingValue]);
    const distressValue = calculatePercentageValue(presentFMV, 80); // 80%

    this.drawKeyValueRow([
      { label: '3  Fair Market Value of the Property as on Present Stage of Construction (1+2)', value: formatIndianCurrency(presentFMV), labelWidth: 340, valueWidth: CONTENT_W - 340, valueBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: '4  Total value of Building after 100% Completed.', value: formatIndianCurrency(totalCompletedBuildingValue), labelWidth: 340, valueWidth: CONTENT_W - 340 },
    ]);

    this.drawKeyValueRow([
      { label: '5  Fair Market Value of the Property after 100% Completed (1+4)', value: formatIndianCurrency(completedFMV), labelWidth: 340, valueWidth: CONTENT_W - 340, valueBold: true },
    ]);

    this.drawKeyValueRow([
      { label: '6  Forced/Distress sale value (80%) on Present Fair Market Value.', value: formatIndianCurrency(distressValue), labelWidth: 340, valueWidth: CONTENT_W - 340, valueBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: '7  Replacement value for insurance purposes', value: `Rs. ${formatIndianCurrency(totalCompletedBuildingValue)}`, labelWidth: 340, valueWidth: CONTENT_W - 340 },
    ]);

    this.drawKeyValueRow([
      { label: 'I)  Construction estimate given by the customer', value: this.getF('constructionEstimateCustomer', 'NA'), labelWidth: 340, valueWidth: CONTENT_W - 340 },
    ]);

    this.drawKeyValueRow([
      { label: 'II) Justified Value of the Building', value: `Rs. ${formatIndianCurrency(totalCompletedBuildingValue)}`, labelWidth: 340, valueWidth: CONTENT_W - 340, valueBold: true },
    ]);

    // ═══════════════════════════════════════════════
    // I) AREA DETAILS FOR FLAT / SHOP / OFFICE / FLOOR
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('I', 'Area details for flat/shop/office/floor (Min. Area to be consider for Valuation )');
    this.drawSuryodayRow('1', 'Area as per Approved Plan (Carpet) (Sq. Ft.)', this.getF('flatAreaApprovedPlan', '3343'));
    this.drawSuryodayRow('2', 'Area as per Site Measurement (Carpet) (Sq. Ft.)', this.getF('flatAreaSiteMeasurement', 'NA'));
    this.drawSuryodayRow('3', 'Area as per Document (Capert/BUA/SBUA) (Sq. Ft.)', this.getF('flatAreaDocument', 'NA'));
    this.drawSuryodayRow('4', 'Super Built up Area (Sq. Ft.) based on ---- (Derive the calculation)', this.getF('flatSuperBuiltUpArea', 'NA'));
    this.drawSuryodayRow('5', 'Deviation from sanction plan/building byelaws (if any)', this.getF('flatDeviation', 'NA'));
    this.drawSuryodayRow('6', 'Risk of demolition (valuers views) (Nil, Low/High/Medium)', this.getF('flatRiskDemolition', 'No'));

    // ═══════════════════════════════════════════════
    // J) VALUATION - BY SALES COMPARISON APPROACH
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('J', 'Valuation - By Sales Comparison Approach');

    const salesSbua = parseSafeFloat(this.getF('salesSbua', 0));
    const salesRate = parseSafeFloat(this.getF('salesRate', 0));
    const salesAmenities = parseSafeFloat(this.getF('salesAmenities', 0));
    const salesMktVal = sumDecimals([multiplyExactDecimals(salesSbua, salesRate), salesAmenities]);

    this.checkPageBreak(50);
    this.drawKeyValueRow([
      { label: 'Super Built-Up Area (Sq. Ft.)', value: 'Rate adopted', labelWidth: 140, valueWidth: 110, labelBold: true, highlight: true },
      { label: 'Other Amenities', value: 'Present Market value', labelWidth: 120, valueWidth: CONTENT_W - 140 - 110 - 120, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: `${salesSbua}`, value: `Rs. ${salesRate}`, labelWidth: 140, valueWidth: 110 },
      { label: salesAmenities ? `Rs. ${salesAmenities}` : 'Rs. -', value: salesMktVal ? `Rs. ${formatIndianCurrency(salesMktVal)}` : 'Rs. -', labelWidth: 120, valueWidth: CONTENT_W - 140 - 110 - 120, valueBold: true },
    ]);

    this.drawSuryodayRow('1', 'Fair Market Value of the property after 100% Completed', this.getF('salesFmvCompleted', salesMktVal ? `Rs. ${formatIndianCurrency(salesMktVal)}` : ''));
    this.drawSuryodayRow('2', 'Stage of Construction', this.getF('salesStage', ''));
    this.drawSuryodayRow('3', 'Fair Market Value of the Property as on Present Stage of Construction.', this.getF('salesFmvPresent', salesMktVal ? `Rs. ${formatIndianCurrency(salesMktVal)}` : ''));
    this.drawSuryodayRow('4', 'Forced/distress sale value (80%) on Present Fair Market Value.', this.getF('salesDistressVal', salesMktVal ? `Rs. ${formatIndianCurrency(calculatePercentageValue(salesMktVal, 80))}` : ''));
    this.drawSuryodayRow('5', 'Replacement value for insurance purposes', this.getF('salesInsuranceVal', ''));

    // ═══════════════════════════════════════════════
    // K) OBSERVATION & L) REMARKS
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('K', 'Observation (if any)');
    const obs = this.getF('observations', 'Subject property is well situated in a developed residential neighborhood with good connectivity.');
    this.drawKeyValueRow([
      { label: obs, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
    ]);

    this.drawSuryodaySectionHeader('L', 'Remarks (if any)');
    const remarks = this.getF(
      'remarks',
      'Subject property is a residential premises having land extent of 3484Sqft, contains two buildng units. One G+2 RCC building having total measured BUA 3933sqft. Another asbestos roofing house having measured BUA 2000sqft. Age of the property is about 12-Years. Approved plan is not provided. Property is accessible with 10-feet wide Road. All civic amenities are present within 1-2 kms from the property. Entire building is used by multi tenants for residential purpose. Valuation has been done for land & measured BUA of G+2 RCC building, as actual BUA is coming within permissible FAR (FAR-1.5 as per CDA norms). Asbestos roofing BUA value is not considered, as it is temporary in nature.'
    );
    this.drawKeyValueRow([
      { label: remarks, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
    ]);

    // ═══════════════════════════════════════════════
    // M) MARKETABILITY
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('M', 'MARKETABILITY :');
    this.drawSuryodayRow('1', 'For sale (Mention the period)', this.getF('marketabilityForSale', 'Average marketability with selling period in range of 1 to 6 months'));
    this.drawSuryodayRow('2', 'For lease – estimated rental Income', this.getF('marketabilityForLease', 'NA-'));

    // ═══════════════════════════════════════════════
    // N) DECLARATION
    // ═══════════════════════════════════════════════
    this.drawSuryodaySectionHeader('N', 'Declaration');

    const engineerName = this.getF('inspectingEngineer', 'Deepak Bhoi');
    const inspDateDec = this.getF('inspectionDate', '29.05.2024');

    const declarations = [
      `1  Property was Inspected by our Engineer Mr. ${engineerName} who has personally inspected the property on dated-${inspDateDec}`,
      '2  I have no direct or indirect interest in the property valued.',
      '3  Information furnished in the report is true and correct to the best of my knowledge and belief.',
      '4  Documents to be verified at your end to ascertain the right title & areas.',
      '5  Fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. Client is free to obtain other independent opinions on the same. Fair, market value of such properties/localities may increase or decrease, depending on the future market conditions & scenarios. This report does not certify or confirm any ownership or title of the property that has been valued.',
      '6  Validity of this report is for 45 days from date.',
      '7  Area considered for valuation are as per Norms & ByLaws.',
    ];

    declarations.forEach(d => {
      this.checkPageBreak(20);
      this.drawKeyValueRow([
        { label: d, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    // Sign-off row
    this.checkPageBreak(50);
    this.advanceCursor(4);
    const rPlace = this.getF('reportPlace', 'Bhubaneswar');
    const rDateDec = this.getF('reportDate', '29.05.2024');

    this.drawKeyValueRow([
      { label: `Place : ${rPlace}\nDate : ${rDateDec}`, value: `Name of Valuer & Stamp\n\n\nS. MOHANTY ASSOCIATES\nEmpanelled Valuer & Chartered Engineer`, labelWidth: 200, valueWidth: CONTENT_W - 200, labelBold: true, valueBold: true },
    ]);

    // ═══════════════════════════════════════════════
    // SCHEDULE I — STAGE OF CONSTRUCTION
    // ═══════════════════════════════════════════════
    this.addPage();
    this.drawCenteredTitle('SCHEDULE I — STAGE OF CONSTRUCTION', 12, true);
    this.drawCenteredTitle('Construction stage is considered based on Building activity / work / Progress, not as per individual Floor / Flat', 8, false);
    this.advanceCursor(6);

    const defaultScheduleRows = [
      { activity: 'Plinth', proposed: '20%', completed: 'Completed', progress: '20%', recommend: '20%' },
      { activity: 'RCC', proposed: '40%', completed: 'Completed', progress: '40%', recommend: '40%' },
      { activity: 'B/W', proposed: '10%', completed: 'Completed', progress: '10%', recommend: '10%' },
      { activity: 'Plaster Internal', proposed: '5%', completed: 'Completed', progress: '5%', recommend: '5%' },
      { activity: 'Plaster External', proposed: '5%', completed: 'Completed', progress: '5%', recommend: '5%' },
      { activity: 'Flooring', proposed: '5%', completed: 'Completed', progress: '5%', recommend: '5%' },
      { activity: 'Electrification', proposed: '5%', completed: 'Completed', progress: '5%', recommend: '5%' },
      { activity: 'Plumbing', proposed: '5%', completed: 'Completed', progress: '5%', recommend: '5%' },
      { activity: 'Woodwork', proposed: '3%', completed: 'Completed', progress: '3%', recommend: '3%' },
      { activity: 'Painting Internal', proposed: '1%', completed: 'Completed', progress: '1%', recommend: '1%' },
      { activity: 'Painting External', proposed: '1%', completed: 'Completed', progress: '1%', recommend: '1%' },
    ];

    const schedRows = this.fields.scheduleIRows || defaultScheduleRows;
    const workDesc = this.getF('scheduleWorkDescription', '100% completed.');

    // Table Header
    this.drawKeyValueRow([
      { label: 'Activity / Work', value: 'Proposed work', labelWidth: 130, valueWidth: 70, labelBold: true, highlight: true },
      { label: 'Completed work on site', value: 'Progress', labelWidth: 95, valueWidth: 55, labelBold: true, highlight: true },
      { label: 'Recommend', value: 'Discription of the work', labelWidth: 65, valueWidth: CONTENT_W - 130 - 70 - 95 - 55 - 65, labelBold: true, highlight: true },
    ]);

    schedRows.forEach((sr: any, idx: number) => {
      this.drawKeyValueRow([
        { label: sr.activity, value: sr.proposed, labelWidth: 130, valueWidth: 70 },
        { label: sr.completed, value: sr.progress, labelWidth: 95, valueWidth: 55 },
        { label: sr.recommend, value: idx === 0 ? workDesc : '', labelWidth: 65, valueWidth: CONTENT_W - 130 - 70 - 95 - 55 - 65 },
      ]);
    });

    // Schedule Total Row
    this.drawKeyValueRow([
      { label: 'Total', value: '100%', labelWidth: 130, valueWidth: 70, labelBold: true, highlight: true },
      { label: '', value: String(progressPct), labelWidth: 95, valueWidth: 55, labelBold: true, highlight: true },
      { label: String(recommendPct), value: '', labelWidth: 65, valueWidth: CONTENT_W - 130 - 70 - 95 - 55 - 65, labelBold: true, highlight: true },
    ]);

    // ═══════════════════════════════════════════════
    // ANNEXURES: PHOTOGRAPHS, MAPS, DOCUMENTS
    // ═══════════════════════════════════════════════
    // Photo Cover Header & Grid
    if (this.fields.propertyImages && this.fields.propertyImages.length > 0) {
      this.addPage();
      this.drawCenteredTitle('PROPERTY PHOTOS', 13, true);
      this.advanceCursor(4);

      const photoList = this.getF('photoListNames', 'Approch road, Selfie of Engineer, Building, Name Board, Hall, Kitchen, Line Plan as per site.');
      const custPhoto = this.getF('customerName', 'Samir Kumar Mohanty, Mob- 9437077899 / 9338011499');
      const addrPhoto = this.getF('propertyAddressDocs', '');

      this.drawKeyValueRow([
        { label: 'List of Photographs', value: photoList, labelWidth: 130, valueWidth: CONTENT_W - 130, labelBold: true },
      ]);
      this.drawKeyValueRow([
        { label: 'Name of customer', value: custPhoto, labelWidth: 130, valueWidth: CONTENT_W - 130, labelBold: true },
      ]);
      this.drawKeyValueRow([
        { label: 'Address of property', value: addrPhoto, labelWidth: 130, valueWidth: CONTENT_W - 130, labelBold: true },
      ]);
      this.advanceCursor(8);

      await this.drawPhotoGrid(this.fields.propertyImages, 'Property Photos', 180, false);
    }

    // Maps Gallery
    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.sketchMapImages || []),
      ...(this.fields.cadastralMapImages || []),
      ...(this.fields.bdaMapImages || []),
    ];
    if (maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION & REVENUE MAPS', 230, true);
    }

    // Documents Gallery
    if (this.fields.documentImages && this.fields.documentImages.length > 0) {
      await this.drawDocumentsGallery(this.fields.documentImages);
    }
  }
}

export default PDFSuryodayRenderer;
