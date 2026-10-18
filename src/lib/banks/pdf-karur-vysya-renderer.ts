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

    const reportNo = this.getF('reportNumber', this.getF('refNo', this.projectCode || ''));
    const reportDate = this.getF('dateOfReport', this.getF('reportDate', ''));

    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: `Report Number: ${reportNo}`, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
      { label: `Date of Report: ${reportDate}`, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
    ]);

    // ═══════════════════════════════════════════════
    // 1. GENERAL
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('1', 'GENERAL');
    this.drawKVBRow('Name of the Applicant', this.getF('applicantName', ''));
    this.drawKVBRow('Application Number (If Any)', this.getF('applicationNumber', ''));
    this.drawKVBRow('Name of Owner (As per legal docs)', this.getF('ownerName', ''));
    this.drawKVBRow('Date of Technical Visit', this.getF('dateOfTechnicalVisit', this.getF('inspectionDate', '')));
    this.drawKVBRow('Name of The Building/Society', this.getF('buildingSocietyName', ''));
    this.drawKVBRow('Name of the Builder/Seller', this.getF('builderSellerName', ''));
    this.drawKVBRow('Person Met at site and contact number', this.getF('personMetAtSite', ''));

    // ═══════════════════════════════════════════════
    // 2. DETAILS OF THE PROPERTY
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('2', 'DETAILS OF THE PROPERTY');
    this.drawKVBRow('Electric Meter Number', this.getF('electricMeterNumber', ''));

    this.checkPageBreak(20);
    this.drawKeyValueRow([
      { label: 'Type of Property', value: this.getF('propertyType', ''), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Basement:', value: this.getF('basement', ''), labelWidth: 90, valueWidth: halfW - 90 },
    ]);

    this.checkPageBreak(20);
    this.drawKeyValueRow([
      { label: 'No. of Stories', value: this.getF('noOfStories', ''), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Property located on:', value: this.getF('propertyLocatedOn', ''), labelWidth: 110, valueWidth: halfW - 110 },
    ]);

    this.checkPageBreak(20);
    this.drawKeyValueRow([
      { label: 'Total no of units', value: this.getF('totalNoOfUnits', ''), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Lift:', value: this.getF('lift', ''), labelWidth: 90, valueWidth: halfW - 90 },
    ]);

    this.checkPageBreak(28);
    this.drawKeyValueRow([
      { label: 'Property Configuration', value: this.getF('propertyConfiguration', ''), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'No of Bathrooms:', value: this.getF('noOfBathrooms', ''), labelWidth: 110, valueWidth: halfW - 110 },
    ]);

    this.checkPageBreak(20);
    const ageVal = this.getF('ageOfProperty', '');
    const resAgeVal = this.getF('residualAge', '');
    this.drawKeyValueRow([
      { label: 'Age of The property', value: ageVal ? `${ageVal} Years` : '', labelWidth: 200, valueWidth: halfW - 200 },
      { label: 'Residual age of the Property', value: resAgeVal ? `${resAgeVal} Years` : '', labelWidth: 170, valueWidth: halfW - 170 },
    ]);

    this.drawKVBRow('Occupancy Status', this.getF('occupancyStatus', ''));
    this.drawKVBRow('If Vacant then from how long', this.getF('vacantDuration', ''));
    this.drawKVBRow('If Self Occupied then from how long', this.getF('selfOccupiedDuration', ''));
    this.drawKVBRow('If Tenant then from how long', this.getF('tenantDuration', ''));

    this.drawKVBRow('Property Address as per Initiation', this.getF('propertyAddressInitiation', ''));
    this.drawKVBRow('Property Address as per Site', this.getF('propertyAddressSite', ''));
    this.drawKVBRow('Property Address as per Documents', this.getF('propertyAddressDocs', ''));
    this.drawKVBRow('Pin Code', this.getF('pinCode', ''));
    this.drawKVBRow('Approved Building Usage', this.getF('approvedBuildingUsage', ''));
    this.drawKVBRow('On site Building Usage', this.getF('onSiteBuildingUsage', ''));
    this.drawKVBRow('Zoning as per Master plan', this.getF('zoningMasterPlan', ''));
    this.drawKVBRow('Classification of land as per IGRS/Regnet, Patta etc.', this.getF('landClassification', ''));
    this.drawKVBRow('CRZ/ASI regulations If any', this.getF('crzAsiRegulations', ''));

    // ═══════════════════════════════════════════════
    // 3. SURROUNDINGS, ACCESIBILITY & PROXIMITY
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('3', 'SURROUNDINGS, ACCESIBILITY & PROXIMITY TO CIVIL AMENETIES');
    this.drawKVBRow('Distance from City Center', this.getF('distanceCityCenter', ''));
    this.drawKVBRow('Nearest Railway Station', this.getF('nearestRailwayStation', ''));
    this.drawKVBRow('Nearest Bus Stand', this.getF('nearestBusStand', ''));
    this.drawKVBRow('Nearest Hospital', this.getF('nearestHospital', ''));
    this.drawKVBRow('Width of Approach Road', this.getF('widthOfApproachRoad', ''));
    this.drawKVBRow('Nearby Land Mark', this.getF('nearbyLandmark', ''));
    this.drawKVBRow('Type of Locality', this.getF('typeOfLocality', ''));
    this.drawKVBRow('Occupancy ratio in Project / Location', this.getF('occupancyRatio', ''));
    this.drawKVBRow('Development of surrounding areas', this.getF('developmentSurroundings', ''));
    this.drawKVBRow('Plot/ Property Demarcated at Site', this.getF('plotDemarcatedAtSite', ''));
    this.drawKVBRow('Demolition Risk', this.getF('demolitionRisk', ''));
    this.drawKVBRow('Property Identified through', this.getF('propertyIdentifiedThrough', ''));
    this.drawKVBRow('Property falls under Corporation limit/ Municipality/ Village Panchayat', this.getF('municipalLimit', ''));

    // Schedule boundaries table
    this.checkPageBreak(80);
    this.drawKeyValueRow([
      { label: 'Schedule boundaries (Along with dimensions)', value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
      { label: 'As per Site', value: '', labelWidth: (CONTENT_W - 150) / 2, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Site Plan', value: '', labelWidth: (CONTENT_W - 150) / 2, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const boundDirections = [
      { label: 'North', site: this.getF('boundNorthSite', ''), plan: this.getF('boundNorthPlan', '') },
      { label: 'South', site: this.getF('boundSouthSite', ''), plan: this.getF('boundSouthPlan', '') },
      { label: 'East', site: this.getF('boundEastSite', ''), plan: this.getF('boundEastPlan', '') },
      { label: 'West', site: this.getF('boundWestSite', ''), plan: this.getF('boundWestPlan', '') },
    ];

    boundDirections.forEach(b => {
      this.drawKeyValueRow([
        { label: b.label, value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
        { label: b.site, value: '', labelWidth: (CONTENT_W - 150) / 2, valueWidth: 0 },
        { label: b.plan, value: '', labelWidth: (CONTENT_W - 150) / 2, valueWidth: 0 },
      ]);
    });

    this.drawKVBRow('Whether Boundaries matching', this.getF('boundariesMatching', ''));
    this.drawKVBRow('Discrepancy found in Boundaries,if any please specify', this.getF('boundariesDiscrepancy', ''));

    // ═══════════════════════════════════════════════
    // 4. SURVEY OF CONSTRUCTION
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('4', 'SURVEY OF CONSTRUCTION');
    this.drawKVBRow('Type of Construction', this.getF('typeOfConstruction', ''));
    this.drawKVBRow('Quality of The Construction', this.getF('qualityOfConstruction', ''));
    this.drawKVBRow('Exteriors', this.getF('exteriors', ''));
    this.drawKVBRow('Interiors', this.getF('interiors', ''));
    this.drawKVBRow('Amenities provided', this.getF('amenitiesProvided', ''));
    this.drawKVBRow('Construction progress', this.getF('constructionProgress', ''));

    this.checkPageBreak(22);
    this.drawKeyValueRow([
      { label: 'Completion Stage of construction in %', value: this.getF('completionStagePct', ''), labelWidth: 190, valueWidth: 70, labelBold: true },
      { label: 'Recommended stage of construction in %', value: this.getF('recommendedStagePct', ''), labelWidth: 190, valueWidth: CONTENT_W - 190 - 70 - 190, labelBold: true },
    ]);

    // ═══════════════════════════════════════════════
    // 5. DOCUMENTS VERIFIED
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('5', 'DOCUMENTS VERIFIED');
    this.drawKVBRow('Approved Layout Plans Details:', this.getF('approvedLayoutPlans', ''));
    this.drawKVBRow('Approved Building Plans Details:', this.getF('approvedBuildingPlans', ''));
    this.drawKVBRow('Commencement Certificate:', this.getF('commencementCertificate', ''));
    this.drawKVBRow('BU Permission Details:', this.getF('buPermissionDetails', ''));
    this.drawKVBRow('RERA No.', this.getF('reraNo', ''));

    // Ownership Proof List
    const rawOwnership = this.getF('ownershipProof', '');
    this.drawKVBRow('Ownership Proof', String(rawOwnership), 140);

    const rawOtherDocs = this.getF('otherDocuments', '');
    this.drawKVBRow('Other documents', String(rawOtherDocs), 140);

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
      { label: 'Land', value: this.getF('landAreaSite', ''), labelWidth: 120, valueWidth: colW, labelBold: true },
      { label: this.getF('landAreaPlan', ''), value: this.getF('landAreaDocs', ''), labelWidth: colW, valueWidth: colW },
    ]);

    this.advanceCursor(4);
    this.drawCenteredTitle('BUILDING AREA DETAILS', 10, true);

    this.drawKeyValueRow([
      { label: '', value: 'As per Site', labelWidth: 120, valueWidth: colW, labelBold: true, highlight: true },
      { label: 'As per Plan', value: 'As per Document', labelWidth: colW, valueWidth: colW, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Shed area', value: this.getF('shedAreaSite', ''), labelWidth: 120, valueWidth: colW, labelBold: true },
      { label: this.getF('shedAreaPlan', ''), value: this.getF('shedAreaDocs', ''), labelWidth: colW, valueWidth: colW },
    ]);

    this.drawKeyValueRow([
      { label: 'RCC area', value: this.getF('rccAreaSite', ''), labelWidth: 120, valueWidth: colW, labelBold: true },
      { label: this.getF('rccAreaPlan', ''), value: this.getF('rccAreaDocs', ''), labelWidth: colW, valueWidth: colW },
    ]);

    this.drawKVBRow('Violation Details if any', this.getF('violationDetails', ''), 120);

    // ═══════════════════════════════════════════════
    // 7. VALUATION DETAILS
    // ═══════════════════════════════════════════════
    this.drawKVBSectionHeader('7', 'VALUATION DETAILS');

    const landAreaVal = parseSafeFloat(this.getF('valLandArea', 0));
    const landRateVal = parseSafeFloat(this.getF('valLandRate', 0));
    const landVal = multiplyExactDecimals(landAreaVal, landRateVal);

    const shedAreaVal = parseSafeFloat(this.getF('valShedArea', 0));
    const shedRateVal = parseSafeFloat(this.getF('valShedRate', 0));
    const shedVal = multiplyExactDecimals(shedAreaVal, shedRateVal);

    const rccAreaVal = parseSafeFloat(this.getF('valRccArea', 0));
    const rccRateVal = parseSafeFloat(this.getF('valRccRate', 0));
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
      { label: 'Land', value: landAreaVal ? `${landAreaVal} Sq. ft.` : '', labelWidth: 140, valueWidth: 100, labelBold: true },
      { label: landRateVal ? `${formatIndianCurrency(landRateVal)}/ Sq. ft.` : '', value: landVal ? formatIndianCurrency(landVal) : '', labelWidth: 130, valueWidth: CONTENT_W - 140 - 100 - 130 },
    ]);

    this.drawKeyValueRow([
      { label: 'Construction-Shed', value: shedAreaVal ? `${shedAreaVal} Sq. ft.` : '', labelWidth: 140, valueWidth: 100, labelBold: true },
      { label: shedRateVal ? `${formatIndianCurrency(shedRateVal)}/ Sq. ft.` : '', value: shedVal ? formatIndianCurrency(shedVal) : '', labelWidth: 130, valueWidth: CONTENT_W - 140 - 100 - 130 },
    ]);

    this.drawKeyValueRow([
      { label: 'Construction-RCC', value: rccAreaVal ? `${rccAreaVal} Sq.ft.` : '', labelWidth: 140, valueWidth: 100, labelBold: true },
      { label: rccRateVal ? `${formatIndianCurrency(rccRateVal)}/ Sq.ft.` : '', value: rccVal ? formatIndianCurrency(rccVal) : '', labelWidth: 130, valueWidth: CONTENT_W - 140 - 100 - 130 },
    ]);

    this.drawKeyValueRow([
      { label: 'Other LS cost if any', value: '', labelWidth: 140, valueWidth: 100 },
      { label: '', value: otherLsVal ? formatIndianCurrency(otherLsVal) : '', labelWidth: 130, valueWidth: CONTENT_W - 140 - 100 - 130 },
    ]);

    this.drawKeyValueRow([
      { label: 'Total', value: '', labelWidth: 240, valueWidth: 0, labelBold: true },
      { label: exactTotal ? `Rs. ${formatIndianCurrency(exactTotal)}\nSay Rs. ${formatIndianCurrency(sayTotalNum)}` : '', value: '', labelWidth: CONTENT_W - 240, valueWidth: 0, labelBold: true, highlight: true },
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
      { label: 'Govt. Assessed Value (Land)', value: this.getF('govtLandArea', landAreaVal ? `${landAreaVal} Sq. ft.` : ''), labelWidth: 160, valueWidth: 90 },
      { label: this.getF('govtLandRate', ''), value: this.getF('govtLandVal', ''), labelWidth: 140, valueWidth: CONTENT_W - 160 - 90 - 140 },
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
    const realizableVal = fmv ? calculatePercentageValue(fmv, 90) : 0; // 90%
    const distressVal = fmv ? calculatePercentageValue(fmv, 80) : 0; // 80%
    const insurableVal = sumDecimals([shedVal, rccVal]);

    this.checkPageBreak(80);
    this.drawKeyValueRow([
      { label: 'Total Fair Market Value (FMV)', value: fmv ? `Rs. ${formatIndianCurrency(fmv)}` : '', labelWidth: 160, valueWidth: 110, labelBold: true, highlight: true },
      { label: fmv ? rupeesInWords(fmv) : '', value: '', labelWidth: CONTENT_W - 160 - 110, valueWidth: 0, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Total Realizable Value', value: realizableVal ? `Rs. ${formatIndianCurrency(realizableVal)}` : '', labelWidth: 160, valueWidth: 110, labelBold: true },
      { label: realizableVal ? rupeesInWords(realizableVal) : '', value: '', labelWidth: CONTENT_W - 160 - 110, valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'Distress Value/ Force sale Value', value: distressVal ? `Rs. ${formatIndianCurrency(distressVal)}` : '', labelWidth: 160, valueWidth: 110, labelBold: true, highlight: true },
      { label: distressVal ? rupeesInWords(distressVal) : '', value: '', labelWidth: CONTENT_W - 160 - 110, valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'Insurable Value of Building', value: insurableVal ? `Rs. ${formatIndianCurrency(insurableVal)}` : '', labelWidth: 160, valueWidth: 110, labelBold: true },
      { label: insurableVal ? rupeesInWords(insurableVal) : '', value: '', labelWidth: CONTENT_W - 160 - 110, valueWidth: 0 },
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
      '9  The basic civic amenities are all available within a minimum distance of approx. 2-8 Kms. from the subject property.',
      '10 Thus, based on the above stated facts the Valuation of the subject property is recommended. Futuristic Complications will not be complying this report.',
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

    const visitedPerson = this.getF('visitedPersonName', '');
    const defaultDeclarations = [
      '1  The information furnished in our valuation report is true and correct to best of my knowledge and belief and in an impartial and true valuation of the property.',
      '2  We have no direct or indirect interest in the property valued.',
      '3  Information furnished in the report is true and correct to the best of our knowledge and belief.',
      '4  Fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same. The fair, market value of such properties/localities may increase or decrease, depending on the future market conditions & scenarios. This report does not certify or confirm any ownership or title of the property that has been valued.',
      '5  No structural survey was conducted by us.',
      `6  We have deputed our representative ${visitedPerson || 'Engineer'} to Inspect the property. Our representative has personally inspected the property.`,
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
      { label: 'Visited Person Name', value: visitedPerson, labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
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
