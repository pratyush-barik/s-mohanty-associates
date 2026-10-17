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

export class PDFKarurVysyaRenderer extends PDFBankRenderer {
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

  private drawKVBSectionHeader(num: string | number, title: string) {
    this.checkPageBreak(26);
    this.drawKeyValueRow([
      {
        label: `${num}.`,
        value: title.toUpperCase(),
        labelWidth: 32,
        valueWidth: CONTENT_W - 32,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);
  }

  private drawKVBRow(label: string, val: string, labelW: number = 230) {
    this.checkPageBreak(20);
    this.drawKeyValueRow([
      {
        label,
        value: val || 'N.A.',
        labelWidth: labelW,
        valueWidth: CONTENT_W - labelW,
      },
    ]);
  }

  async drawContent(): Promise<void> {
    // ═══════════════════════════════════════════════
    // HEADER & REPORT METADATA
    // ═══════════════════════════════════════════════
    this.drawCenteredTitle('Valuation Report for Karur Vysya Bank Limited', 14, true);
    this.advanceCursor(2);
    this.drawCenteredTitle('S. MOHANTY ASSOCIATES — EMPANELLED VALUER & CHARTERED ENGINEER', 9, false);
    this.advanceCursor(4);

    const reportNo = this.getF('reportNumber', this.getF('refNo', this.projectCode || 'VIP/KVB/558'));
    const reportDate = this.getF('dateOfReport', this.getF('reportDate', '24.09.2026'));

    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: `Report Number: ${reportNo}`, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
      { label: `Date of Report: ${reportDate}`, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
    ]);

    // ═══════════════════════════════════════════════
    // 1. GENERAL
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('1', 'GENERAL');
    this.drawKVBRow('Name of the Applicant', this.getF('applicantName', 'C&B Ecogen Pvt Ltd'));
    this.drawKVBRow('Application Number (If Any)', this.getF('applicationNumber', 'N.A.'));
    this.drawKVBRow('Name of Owner (As per legal docs)', this.getF('ownerName', 'M/S C & B Ecogen Pvt. Ltd. (Purchaser)'));
    this.drawKVBRow('Date of Technical Visit', this.getF('dateOfTechnicalVisit', this.getF('inspectionDate', '10.08.2026')));
    this.drawKVBRow('Name of The Building/Society', this.getF('buildingSocietyName', 'N.A.'));
    this.drawKVBRow('Name of the Builder/Seller', this.getF('builderSellerName', 'Sanjay Kumar Roy, Sabina Bibi and others (Seller)'));
    this.drawKVBRow('Person Met at site and contact number', this.getF('personMetAtSite', 'Goutam Bag (Workshop In Charge), Contact No.- Not shared'));

    // ═══════════════════════════════════════════════
    // 2. DETAILS OF THE PROPERTY
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('2', 'DETAILS OF THE PROPERTY');
    this.drawKVBRow('Electric Meter Number', this.getF('electricMeterNumber', 'N.A.'));

    this.checkPageBreak(20);
    this.drawKeyValueRow([
      { label: 'Type of Property', value: this.getF('propertyType', 'Industrial'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Basement:', value: this.getF('basement', 'Nil'), labelWidth: 90, valueWidth: halfW - 90 },
    ]);

    this.checkPageBreak(20);
    this.drawKeyValueRow([
      { label: 'No. of Stories', value: this.getF('noOfStories', 'Single Storied Shed Structures and 1 Storied RCC structure'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Property located on:', value: this.getF('propertyLocatedOn', 'Entire Property'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);

    this.checkPageBreak(20);
    this.drawKeyValueRow([
      { label: 'Total no of units', value: this.getF('totalNoOfUnits', 'Do'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Lift:', value: this.getF('lift', 'Nil'), labelWidth: 90, valueWidth: halfW - 90 },
    ]);

    this.checkPageBreak(28);
    this.drawKeyValueRow([
      { label: 'Property Configuration', value: this.getF('propertyConfiguration', 'GF- 2 Toilet, 2 Office Room, 1st Floor- 1 Room. Rest In CGI Shed Factory Area, Some Vacant Land'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'No of Bathrooms:', value: this.getF('noOfBathrooms', '2'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);

    this.checkPageBreak(20);
    this.drawKeyValueRow([
      { label: 'Age of The property', value: `${this.getF('ageOfProperty', '5')} Years`, labelWidth: 200, valueWidth: halfW - 200 },
      { label: 'Residual age of the Property', value: `${this.getF('residualAge', '75')} Years`, labelWidth: 170, valueWidth: halfW - 170 },
    ]);

    this.drawKVBRow('Occupancy Status', this.getF('occupancyStatus', 'Occupied by Owner'));
    this.drawKVBRow('If Vacant then from how long', this.getF('vacantDuration', 'N.A.'));
    this.drawKVBRow('If Self Occupied then from how long', this.getF('selfOccupiedDuration', 'For 3 years'));
    this.drawKVBRow('If Tenant then from how long', this.getF('tenantDuration', 'Not Known'));

    this.drawKVBRow('Property Address as per Initiation', this.getF('propertyAddressInitiation', 'Mouza Joyenpur, JL No : 66 RS : Khatian No: 310R S Dag No : 507,517 PS Sonarpur Now Narendrapur Dist : South 24 Parganas Under Bonhoogly-1 Gram Panchayat'));
    this.drawKVBRow('Property Address as per Site', this.getF('propertyAddressSite', 'Vill- Jayenpur, P.O. Jayenpur, P.S. Narendrapur, Dist- South 24 Parganas, Pin Code- 700155, Under Bonhoogly I No Gram Panchayat'));
    this.drawKVBRow('Property Address as per Documents', this.getF('propertyAddressDocs', 'Mouza- Jayenpur, JL No- 66, Dag No- RS 507,517, 520, 518, 521, L.R 532, 543, 546, 544, 547, Khatian No- R.S 349, 310, 344, 364, 245, L.R 1693, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat'));
    this.drawKVBRow('Pin Code', this.getF('pinCode', 'Kolkata-700 155'));
    this.drawKVBRow('Approved Building Usage', this.getF('approvedBuildingUsage', 'Commercial'));
    this.drawKVBRow('On site Building Usage', this.getF('onSiteBuildingUsage', 'Industrial (Factory)'));
    this.drawKVBRow('Zoning as per Master plan', this.getF('zoningMasterPlan', 'Bonhooghly 1 No. Gram Panchayat'));
    this.drawKVBRow('Classification of land as per IGRS/Regnet, Patta etc.', this.getF('landClassification', 'Do'));
    this.drawKVBRow('CRZ/ASI regulations If any', this.getF('crzAsiRegulations', 'N.A.'));

    // ═══════════════════════════════════════════════
    // 3. SURROUNDINGS, ACCESIBILITY & PROXIMITY
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('3', 'SURROUNDINGS, ACCESIBILITY & PROXIMITY TO CIVIL AMENETIES');
    this.drawKVBRow('Distance from City Center', this.getF('distanceCityCenter', '28 Km. approx.'));
    this.drawKVBRow('Nearest Railway Station', this.getF('nearestRailwayStation', 'Narendrapur Halt (Approx. 9.4 K.M)'));
    this.drawKVBRow('Nearest Bus Stand', this.getF('nearestBusStand', 'Nepalgunge Bus Stop (Approx. 3.2 K.M)'));
    this.drawKVBRow('Nearest Hospital', this.getF('nearestHospital', 'Apollo Hospital (6.5 kms. approx.)'));
    this.drawKVBRow('Width of Approach Road', this.getF('widthOfApproachRoad', '22ft. wide Kuchha Road'));
    this.drawKVBRow('Nearby Land Mark', this.getF('nearbyLandmark', 'Near Jayenpur More Industrial Area'));
    this.drawKVBRow('Type of Locality', this.getF('typeOfLocality', 'Mixed'));
    this.drawKVBRow('Occupancy ratio in Project / Location', this.getF('occupancyRatio', 'N.A.'));
    this.drawKVBRow('Development of surrounding areas', this.getF('developmentSurroundings', 'Developing'));
    this.drawKVBRow('Plot/ Property Demarcated at Site', this.getF('plotDemarcatedAtSite', 'The subject property is demarcated by boundary wall from all sides.'));
    this.drawKVBRow('Demolition Risk', this.getF('demolitionRisk', 'N.A.'));
    this.drawKVBRow('Property Identified through', this.getF('propertyIdentifiedThrough', 'The property is identified through an identifier & provided document received from bank only.'));
    this.drawKVBRow('Property falls under Corporation limit/ Municipality/ Village Panchayat', this.getF('municipalLimit', 'Bonhooghly 1 No. Gram Panchayat'));

    // Schedule boundaries table
    this.checkPageBreak(80);
    this.drawKeyValueRow([
      { label: 'Schedule boundaries (Along with dimensions)', value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
      { label: 'As per Site', value: '', labelWidth: (CONTENT_W - 150) / 2, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Site Plan', value: '', labelWidth: (CONTENT_W - 150) / 2, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const boundDirections = [
      { label: 'North', site: this.getF('boundNorthSite', 'Partly Road Partly Vacant Land'), plan: this.getF('boundNorthPlan', '20ft wide Common Passage') },
      { label: 'South', site: this.getF('boundSouthSite', "22' Wide Road"), plan: this.getF('boundSouthPlan', '20ft wide Common Passage') },
      { label: 'East', site: this.getF('boundEastSite', 'Pond Partly Vacant Low Land'), plan: this.getF('boundEastPlan', 'Not mentioned') },
      { label: 'West', site: this.getF('boundWestSite', "22' Wide Road"), plan: this.getF('boundWestPlan', '20ft wide Common Passage') },
    ];

    boundDirections.forEach(b => {
      this.drawKeyValueRow([
        { label: b.label, value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
        { label: b.site, value: '', labelWidth: (CONTENT_W - 150) / 2, valueWidth: 0 },
        { label: b.plan, value: '', labelWidth: (CONTENT_W - 150) / 2, valueWidth: 0 },
      ]);
    });

    this.drawKVBRow('Whether Boundaries matching', this.getF('boundariesMatching', 'Partly'));
    this.drawKVBRow('Discrepancy found in Boundaries,if any please specify', this.getF('boundariesDiscrepancy', 'East side boundary not mentioned in Site Plan'));

    // ═══════════════════════════════════════════════
    // 4. SURVEY OF CONSTRUCTION
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('4', 'SURVEY OF CONSTRUCTION');
    this.drawKVBRow('Type of Construction', this.getF('typeOfConstruction', 'RCC Structure & CGI Shed Structure'));
    this.drawKVBRow('Quality of The Construction', this.getF('qualityOfConstruction', 'Good'));
    this.drawKVBRow('Exteriors', this.getF('exteriors', 'Do'));
    this.drawKVBRow('Interiors', this.getF('interiors', 'Do'));
    this.drawKVBRow('Amenities provided', this.getF('amenitiesProvided', 'Water, Overhead Tank, Drainage, Electricity etc.'));
    this.drawKVBRow('Construction progress', this.getF('constructionProgress', '100% completed'));

    this.checkPageBreak(22);
    this.drawKeyValueRow([
      { label: 'Completion Stage of construction in %', value: this.getF('completionStagePct', '100%'), labelWidth: 190, valueWidth: 70, labelBold: true },
      { label: 'Recommended stage of construction in %', value: this.getF('recommendedStagePct', '100%'), labelWidth: 190, valueWidth: CONTENT_W - 190 - 70 - 190, labelBold: true },
    ]);

    // ═══════════════════════════════════════════════
    // 5. DOCUMENTS VERIFIED
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('5', 'DOCUMENTS VERIFIED');
    this.drawKVBRow('Approved Layout Plans Details:', this.getF('approvedLayoutPlans', 'Not available'));
    this.drawKVBRow('Approved Building Plans Details:', this.getF('approvedBuildingPlans', 'Sanctioned Plan received for proposed two storied commercial building, approved by Pradhan of Bonhooghly 1 Gram Panchayat, Plan Number & Date is Unclear.\nSanction Plan for Tin Shed structure, approved by Bonhooghly 1 Gram Panchayat vide Regd No. Bon-IGP/1865/2022-23 dated 30.08.2022\nDraft Plan for Single storied commercial building with truss of area 7405 sqft'));
    this.drawKVBRow('Commencement Certificate:', this.getF('commencementCertificate', 'Not available'));
    this.drawKVBRow('BU Permission Details:', this.getF('buPermissionDetails', 'Not available'));
    this.drawKVBRow('RERA No.', this.getF('reraNo', 'Not available'));

    // Ownership Proof List
    const defaultOwnership = [
      '1. Deed of Conveyance No. I-5158, dated- 16th June 2022, between Sri Gosta Bihari Das (Vendor), M/S C & B Ecogen Pvt. Ltd. (Purchaser), mentioning total shali land area 24.75 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 507, 517, L.R Dag No- 532, 543, R.S Khatian No- 349, 310, L.R Khatian No- 1639, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.22,50,000/-',
      '2. Sale Deed No. I-7555, dated- 15th September 2023, between M/S C & B Ecogen Pvt. Ltd. (Donee), Sanjay Kumar Ray (Donor), mentioning total shali land area 3.3 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 517, L.R Dag No- 543, R.S Khatian No- 310, L.R Khatian No- 819,820,821,822,823, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.4,00,000/-',
      '3. Sale Deed No. I-7559, dated- 15th September 2023, between M/S C & B Ecogen Pvt. Ltd. (Donee), Sanjay Kumar Ray (Donor), mentioning total shali land area 3.3 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 517, L.R Dag No- 543, R.S Khatian No- 310, L.R Khatian No- 819,820,821,822,823, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.4,00,000/-',
      '4. Sale Deed No. I-7564, dated- 15th September 2023, between M/S C & B Ecogen Pvt. Ltd. (Donee), Sanjay Kumar Ray (Donor), mentioning total shali land area 3.3 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 517, L.R Dag No- 543, R.S Khatian No- 310, L.R Khatian No- 819,820,821,822,823, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.4,00,000/-',
      '5. Sale Deed No. I-7558, dated- 15th September 2023, between M/S C & B Ecogen Pvt. Ltd. (Donee), Sanjay Kumar Ray (Donor), mentioning total shali land area 3.3 Dec. situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 517, L.R Dag No- 543, R.S Khatian No- 310, L.R Khatian No- 819,820,821,822,823, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.4,00,000/-',
      '6. Sale Deed I-9200/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sanjay Kumar Ray (Seller) mentioning Shali Land 1 Katha 5 Chatak 09 sqft situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 520, L.R Dag No- 546, R.S Khatian No- 364, L.R Khatian No- 1855, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.2,63,000/-',
      '7. Sale Deed I-9201/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sanjay Kumar Ray (Seller) mentioning Shali Land 2 Katha 3 Chatak 28 sqft situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 521, L.R Dag No- 547, R.S Khatian No- 245, L.R Khatian No- 1855, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.5,00,000/-',
      '8. Sale Deed I-9202/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sabina Bibi (Seller) mentioning Shali Land 3 Katha 10 Chatak situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 520, L.R Dag No- 546, R.S Khatian No- 364, L.R Khatian No- 1864, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.7,25,000/-',
      '9. Sale Deed I-9203/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sanjay Kumar Roy (Seller) mentioning Shali Land 2 Katha 4 Chatak situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 521, L.R Dag No- 547, R.S Khatian No- 245, L.R Khatian No- 1855, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.7,25,000/-',
      '10. Sale Deed I-9199/2023 dated 24.11.2023 between M/S C & B Ecogen Pvt. Ltd. (Purchaser) and Sanjay Kumar Roy (Seller) mentioning Shali Land 1 Katha 3 Chatak 11 sqft situated at Mouza- Jayenpur, JL No- 66, R.S Dag No- 518, L.R Dag No- 544, R.S Khatian No- 344, L.R Khatian No- 1863, P.S- Sonarpur now Narendrapur, Dist- South 24 Parganas, Under Bonhooghly 1 No. Gram Panchayat. Having total consideration amount of Rs.2,37,000/-',
    ];

    const rawOwnership = this.getF('ownershipProof', defaultOwnership.join('\n\n'));
    this.drawKVBRow('Ownership Proof', String(rawOwnership), 140);

    const defaultOtherDocs = 'Land Conversion vide case no. CN/2023/1615/1929 Dated 11.05.2023 in the name of M/s. Ecogen Pvt Ltd of land area 5 decimal at Dag No. 532 & 19 Decimal land at Dag No. 543\nLand Conversion vide case no. CN/2023/1615/9912 Dated 21.02.2024 in the name of M/s. Ecogen Pvt Ltd of land area 12 decimal at Dag No. 543\nLand Conversion vide case no. CN/2024/1615/2662 Dated 01.03.2024 in the name of M/s. Ecogen Pvt Ltd of land area 2 decimal at Dag No. 544, land area 8 Decimal at Dag No. 546 & 7 Decimal land at Dag No. 547\nSanctioned Plan received for proposed two storied commercial building, Approved by Pradhan of Bonhooghly 1 Gram Panchayat, Plan Number & Date is Unclear\nSanction Plan for Tin Shed structure, approved by Bonhooghly 1 Gram Panchayat vide Regd No. Bon-IGP/1865/2022-23 dated 30.08.2022\nDraft Plan for Single storied commercial building with truss of area 7405 sqft\nAmalgamated Site Plan for 33K 10CH 3 SQFT land drawn by Imtiaz Ali Mondal (Surveyor & Planner)';
    this.drawKVBRow('Other documents', this.getF('otherDocuments', defaultOtherDocs), 140);

    // ═══════════════════════════════════════════════
    // 6. LAND AREA & BUILDING AREA DETAILS
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('6', 'LAND AREA DETAILS');

    const colW = (CONTENT_W - 120) / 3;
    this.checkPageBreak(50);
    this.drawKeyValueRow([
      { label: '', value: 'As per Site', labelWidth: 120, valueWidth: colW, labelBold: true, highlight: true },
      { label: 'As per Plan', value: 'As per Document', labelWidth: colW, valueWidth: colW, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Land', value: this.getF('landAreaSite', '25,612 Sq. ft.'), labelWidth: 120, valueWidth: colW, labelBold: true },
      { label: this.getF('landAreaPlan', '31 Katha 12 sqft or 22,332 Sq. ft.'), value: this.getF('landAreaDocs', 'As per Deed 24,213 Sq. ft., as per Conversion 23,086 sqft'), labelWidth: colW, valueWidth: colW },
    ]);

    this.advanceCursor(4);
    this.drawCenteredTitle('BUILDING AREA DETAILS', 10, true);

    this.drawKeyValueRow([
      { label: '', value: 'As per Site', labelWidth: 120, valueWidth: colW, labelBold: true, highlight: true },
      { label: 'As per Plan', value: 'As per Document', labelWidth: colW, valueWidth: colW, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Shed area', value: this.getF('shedAreaSite', '11,245 Sq. ft.'), labelWidth: 120, valueWidth: colW, labelBold: true },
      { label: this.getF('shedAreaPlan', '8600 Sq. ft.'), value: this.getF('shedAreaDocs', 'NA'), labelWidth: colW, valueWidth: colW },
    ]);

    this.drawKeyValueRow([
      { label: 'RCC area', value: this.getF('rccAreaSite', '1,117 Sq. ft.'), labelWidth: 120, valueWidth: colW, labelBold: true },
      { label: this.getF('rccAreaPlan', '816 Sq.ft.'), value: this.getF('rccAreaDocs', 'NA'), labelWidth: colW, valueWidth: colW },
    ]);

    this.drawKVBRow('Violation Details if any', this.getF('violationDetails', 'Horizontal deviation found'), 120);

    // ═══════════════════════════════════════════════
    // 7. VALUATION DETAILS
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('7', 'VALUATION DETAILS');

    const landAreaVal = parseSafeFloat(this.getF('valLandArea', 23086));
    const landRateVal = parseSafeFloat(this.getF('valLandRate', 972));
    const landVal = multiplyExactDecimals(landAreaVal, landRateVal);

    const shedAreaVal = parseSafeFloat(this.getF('valShedArea', 8600));
    const shedRateVal = parseSafeFloat(this.getF('valShedRate', 1200));
    const shedVal = multiplyExactDecimals(shedAreaVal, shedRateVal);

    const rccAreaVal = parseSafeFloat(this.getF('valRccArea', 816));
    const rccRateVal = parseSafeFloat(this.getF('valRccRate', 1600));
    const rccVal = multiplyExactDecimals(rccAreaVal, rccRateVal);

    const otherLsVal = parseSafeFloat(this.getF('valOtherLs', 0));
    const exactTotal = sumDecimals([landVal, shedVal, rccVal, otherLsVal]);
    const sayTotal = this.getF('valSayTotal', exactTotal);
    const sayTotalNum = parseSafeFloat(sayTotal, exactTotal);

    this.checkPageBreak(80);
    this.drawKeyValueRow([
      { label: 'Item', value: 'Area', labelWidth: 140, valueWidth: 100, labelBold: true, highlight: true },
      { label: 'Rate in Rs/unit', value: 'Value in Rs', labelWidth: 130, valueWidth: CONTENT_W - 140 - 100 - 130, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Land', value: `${landAreaVal} Sq. ft.`, labelWidth: 140, valueWidth: 100, labelBold: true },
      { label: `972.00/ Sq. ft. (including land development)`, value: formatIndianCurrency(landVal), labelWidth: 130, valueWidth: CONTENT_W - 140 - 100 - 130 },
    ]);

    this.drawKeyValueRow([
      { label: 'Construction-Shed', value: `${shedAreaVal} Sq. ft.`, labelWidth: 140, valueWidth: 100, labelBold: true },
      { label: `1,200.00/ Sq. ft.`, value: formatIndianCurrency(shedVal), labelWidth: 130, valueWidth: CONTENT_W - 140 - 100 - 130 },
    ]);

    this.drawKeyValueRow([
      { label: 'Construction-RCC', value: `${rccAreaVal} Sq.ft.`, labelWidth: 140, valueWidth: 100, labelBold: true },
      { label: `1,600.00/ Sq.ft.`, value: formatIndianCurrency(rccVal), labelWidth: 130, valueWidth: CONTENT_W - 140 - 100 - 130 },
    ]);

    this.drawKeyValueRow([
      { label: 'Other LS cost if any', value: '', labelWidth: 140, valueWidth: 100 },
      { label: '', value: otherLsVal ? formatIndianCurrency(otherLsVal) : '', labelWidth: 130, valueWidth: CONTENT_W - 140 - 100 - 130 },
    ]);

    this.drawKeyValueRow([
      { label: 'Total', value: '', labelWidth: 240, valueWidth: 0, labelBold: true },
      { label: `Rs. ${formatIndianCurrency(exactTotal)}\nSay Rs. ${formatIndianCurrency(sayTotalNum)}`, value: '', labelWidth: CONTENT_W - 240, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    // ═══════════════════════════════════════════════
    // 8. GOVERNMENT VALUE
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('8', 'GOVERNMENT VALUE');

    this.checkPageBreak(50);
    this.drawKeyValueRow([
      { label: 'Item', value: 'Area', labelWidth: 160, valueWidth: 90, labelBold: true, highlight: true },
      { label: 'Rate in Rs/unit', value: 'Value', labelWidth: 140, valueWidth: CONTENT_W - 160 - 90 - 140, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Govt. Assessed Value (Land)', value: this.getF('govtLandArea', `${landAreaVal} Sq. ft.`), labelWidth: 160, valueWidth: 90 },
      { label: this.getF('govtLandRate', 'Rs. 515.00 per Sq. ft. for Karkhana/Industrial Land'), value: this.getF('govtLandVal', formatIndianCurrency(multiplyExactDecimals(landAreaVal, 515))), labelWidth: 140, valueWidth: CONTENT_W - 160 - 90 - 140 },
    ]);

    this.drawKeyValueRow([
      { label: 'Govt. Assessed Value (Construction)', value: this.getF('govtConstArea', ''), labelWidth: 160, valueWidth: 90 },
      { label: this.getF('govtConstRate', ''), value: this.getF('govtConstVal', ''), labelWidth: 140, valueWidth: CONTENT_W - 160 - 90 - 140 },
    ]);

    this.drawKeyValueRow([
      { label: 'Total Govt. Assessed Value', value: '', labelWidth: 250, valueWidth: 0, labelBold: true },
      { label: this.getF('govtTotalVal', ''), value: '', labelWidth: CONTENT_W - 250, valueWidth: 0, labelBold: true },
    ]);

    // ═══════════════════════════════════════════════
    // 9. FINAL VALUATION & INSURABLE VALUE
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('9', 'FINAL VALUATION');

    const fmv = sayTotalNum;
    const realizableVal = calculatePercentageValue(fmv, 90); // 90%
    const distressVal = calculatePercentageValue(fmv, 80); // 80%
    const insurableVal = sumDecimals([shedVal, rccVal]); // 1,16,25,600

    this.checkPageBreak(80);
    this.drawKeyValueRow([
      { label: 'Total Fair Market Value (FMV)', value: `Rs. ${formatIndianCurrency(fmv)}`, labelWidth: 160, valueWidth: 110, labelBold: true, highlight: true },
      { label: rupeesInWords(fmv), value: '', labelWidth: CONTENT_W - 160 - 110, valueWidth: 0, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Total Realizable Value', value: `Rs. ${formatIndianCurrency(realizableVal)}`, labelWidth: 160, valueWidth: 110, labelBold: true },
      { label: rupeesInWords(realizableVal), value: '', labelWidth: CONTENT_W - 160 - 110, valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'Distress Value/ Force sale Value', value: `Rs. ${formatIndianCurrency(distressVal)}`, labelWidth: 160, valueWidth: 110, labelBold: true, highlight: true },
      { label: rupeesInWords(distressVal), value: '', labelWidth: CONTENT_W - 160 - 110, valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'Insurable Value of Building', value: `Rs. ${formatIndianCurrency(insurableVal)}`, labelWidth: 160, valueWidth: 110, labelBold: true },
      { label: rupeesInWords(insurableVal), value: '', labelWidth: CONTENT_W - 160 - 110, valueWidth: 0 },
    ]);

    // ═══════════════════════════════════════════════
    // 10. REMARKS
    // ═══════════════════════════════════════════════
    this.checkPageBreak(30);
    this.drawSectionHeader('REMARKS:');

    const defaultRemarks = [
      '1  Legal aspects are out of scope of valuation.',
      '2  Genuineness of original documents to be verified by the bank authorities before disbursement.',
      '3  All the documents received by us are soft copies only. The bank should verify the authenticity for the documents.',
      '4  The valuer is not responsible for any legal implications such as Any Court Cases, Land Acquisition Proceedings, Encroaches, Encumbrances, Defects in titles and any such other legal claims on the property.',
      '5  This report is prepared on the basis of the copies of the limited documents as mentioned in the report.',
      '6  The property is identified through an identifier & provided document received from bank only. Actual measured land area is more or less matched with Deed land area.',
      '7  The subject property is well demarcated with boundary walls on all side.',
      '8  This valuation report may give a completely different result if any of the assumptions mentioned above are found to be not true. Lenders should check and think of necessary mitigate, as may found suitable, in case of adverse situation, WRT future sale-ability in the open market, at this existing condition.',
      '10 As per Deed Total land area 24,213 sqft i.e. 55.58 Decimal & as per measured 25,612 sqft but as per Land Conversion total land area 53 Decimal. We have considered land area as per Land conversion.',
      '11 Out of the three building plans provided, two are approved by the Gram Panchayat Pradhan and comply with building bye-laws. The third is a draft plan pending approval from the Zilla Parishad. As aligned during discussions with bank officials, the total construction area has been considered based on all three plans, subject to the final approval of the draft plan.',
      '12 The basic civic amenities are all available within a minimum distance of approx. 2-8 Kms. from the subject property.',
      '13 Thus, based on the above stated facts the Valuation of the subject property is recommended. Futuristic Complications will not be complying this report.',
      '14 This valuation report may give a completely different result if any of the assumptions mentioned above are found to be not true. Lenders should check and think of necessary mitigate, as may found suitable, in case of adverse situation, WRT future sale-ability in the open market, at this existing condition.',
    ];

    const rawRemarks = this.getF('remarks', defaultRemarks.join('\n'));
    const remarksList = Array.isArray(rawRemarks) ? rawRemarks : String(rawRemarks).split('\n').filter(Boolean);

    remarksList.forEach((rem: string) => {
      this.checkPageBreak(22);
      this.drawKeyValueRow([
        { label: rem, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    // ═══════════════════════════════════════════════
    // 11. DECLARATION
    // ═══════════════════════════════════════════════
    this.checkPageBreak(30);
    this.drawSectionHeader('DECLARATION:');
    this.drawKeyValueRow([
      { label: 'We declare that', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);

    const defaultDeclarations = [
      '1  The information furnished in our valuation report is true and correct to best of my knowledge and belief and in an impartial and true valuation of the property.',
      '2  We have no direct or indirect interest in the property valued.',
      '3  Information furnished in the report is true and correct to the best of our knowledge and belief.',
      '4  Fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same. The fair, market value of such properties/localities may increase or decrease, depending on the future market conditions & scenarios. This report does not certify or confirm any ownership or title of the property that has been valued.',
      '5  No structural survey was conducted by us.',
      `6  We have deputed our representative ${this.getF('visitedPersonName', 'Sougata Sanfui')} to Inspect the property. Our representative has personally inspected the property.`,
      '7  We are not required to give testimony or appear in court by any reason of this appraisal report, with reference to the property in question.',
      '8  We have also taken into consideration the slump in the market and the oversupply condition in the market. The demand for quality construction and maintenance for properties is also considered.',
      '9  We have compared other comparable properties on the basis of many factors and as far as possible tried to remove/ account for the differences in type, location and quality of the properties.',
      '10 Ownership papers may please be verified by the legal adviser at your end to ascertain the right title & area.',
    ];

    const rawDecs = this.getF('declarations', defaultDeclarations.join('\n'));
    const decList = Array.isArray(rawDecs) ? rawDecs : String(rawDecs).split('\n').filter(Boolean);

    decList.forEach((dec: string) => {
      this.checkPageBreak(22);
      this.drawKeyValueRow([
        { label: dec, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    // Sign-off block
    this.checkPageBreak(60);
    this.advanceCursor(6);
    this.drawKeyValueRow([
      { label: 'Visited Person Name', value: this.getF('visitedPersonName', 'Sougata Sanfui'), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Authorized Signatory (Name and Signature)\n\n\nS. MOHANTY ASSOCIATES\nEmpanelled Valuer & Chartered Engineer', value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
    ]);

    // ═══════════════════════════════════════════════
    // ANNEXURES: PHOTOGRAPHS, MAPS, DOCUMENTS
    // ═══════════════════════════════════════════════
    if (this.fields.propertyImages && this.fields.propertyImages.length > 0) {
      await this.drawPhotoGrid(this.fields.propertyImages, 'PROPERTY PHOTOGRAPHS', 180, true);
    }

    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.sketchMapImages || []),
      ...(this.fields.cadastralMapImages || []),
      ...(this.fields.bdaMapImages || []),
    ];
    if (maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION & SITE MAPS', 230, true);
    }

    if (this.fields.documentImages && this.fields.documentImages.length > 0) {
      await this.drawDocumentsGallery(this.fields.documentImages);
    }
  }
}

export default PDFKarurVysyaRenderer;
