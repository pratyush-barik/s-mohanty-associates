import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFUnitySFBRenderer extends PDFBankRenderer {
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

  private drawUnitySectionHeader(title: string) {
    this.drawSectionHeader(title);
  }

  private drawUnityRow(num: string, label: string, value: string, boldVal: boolean = false) {
    const numW = 24;
    const labelW = 200;
    const valW = CONTENT_W - numW - labelW;

    this.drawKeyValueRow([
      { label: num, value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: label, value: value || 'NA', labelWidth: labelW, valueWidth: valW, labelBold: false, bold: boldVal },
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
    this.drawUnitySectionHeader('BASIC DETAILS');

    this.drawUnityRow('1', "Applicant/s Name/s", this.getF('applicantName', ''), true);

    const p2LabelW = 120;
    const p2RemW = CONTENT_W - 24 - p2LabelW;
    const p2SubW = p2RemW / 2;
    this.drawKeyValueRow([
      { label: '2', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Type of property', value: this.getF('propertyTypeDesc', ''), labelWidth: p2LabelW, valueWidth: p2SubW },
      { label: 'Current Usage', value: this.getF('currentUsage', 'Residential'), labelWidth: 80, valueWidth: p2SubW - 80 },
    ]);

    this.drawUnityRow('3', 'Address at site', this.getF('addressAtSite', ''));
    this.drawUnityRow('', 'Address as per document', this.getF('addressAsPerDoc', ''));
    this.drawUnityRow(
      '4',
      'Has the valuator done valuation of this property before this? If yes, when, for whom?',
      this.getF('priorValuation', 'No')
    );

    this.advanceCursor(4);

    // ==========================================
    // SURROUNDING & LOCALITY DETAILS
    // ==========================================
    this.drawUnitySectionHeader('SOURROUNDING & LOCALITY DETAILS');

    const locNumW = 24;
    const locCatW = 80;
    const locSubW = 120;
    const locValW = CONTENT_W - locNumW - locCatW - locSubW;

    const locRows = [
      { label: 'Type(Comm., Res, Ind, Mix)', val: this.getF('localityType', 'Mixed') },
      { label: 'Class of Locality', val: this.getF('localityClass', 'Middle Class') },
      { label: 'Site is (Dev, Under Dev)', val: this.getF('siteStatus', 'Developed') },
      { label: 'Proximity to civic amenities/public transport', val: this.getF('proximityAmenities', '') },
      { label: 'Railway Station', val: this.getF('railwayStation', '') },
      { label: 'Bus Stop', val: this.getF('busStop', '') },
    ];

    locRows.forEach((row, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '5' : '', value: '', labelWidth: locNumW, valueWidth: 0, labelBold: idx === 0 },
        { label: idx === 0 ? 'Location' : '', value: '', labelWidth: locCatW, valueWidth: 0, labelBold: idx === 0 },
        { label: row.label, value: row.val || 'NA', labelWidth: locSubW, valueWidth: locValW },
      ]);
    });

    this.drawUnityRow('6', 'Close Vicinity/Landmark', this.getF('landmark', ''));
    this.drawUnityRow('7', 'Distance from City Center', this.getF('distanceCityCenter', ''));
    this.drawUnityRow('8', 'Condition and width of approach road', this.getF('approachRoad', ''));

    this.advanceCursor(4);

    // ==========================================
    // PROPERTY DETAILS
    // ==========================================
    this.drawUnitySectionHeader('PROPERTY DETAILS');

    const pNumW = 24;
    const pCatW = 80;
    const pSubW = 120;
    const pValW = CONTENT_W - pNumW - pCatW - pSubW;

    const propRows = [
      { label: 'Vacant/Occupied', val: this.getF('occupancyStatus', 'Occupied') },
      { label: 'Name of Occupant', val: this.getF('occupantName', '') },
      { label: 'Relation with applicant', val: this.getF('occupantRelation', '') },
      { label: 'Property Demarcation', val: this.getF('propertyDemarcation', 'Yes') },
    ];

    propRows.forEach((row, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '9' : '', value: '', labelWidth: pNumW, valueWidth: 0, labelBold: idx === 0 },
        { label: idx === 0 ? 'Occupant' : '', value: '', labelWidth: pCatW, valueWidth: 0, labelBold: idx === 0 },
        { label: row.label, value: row.val || 'NA', labelWidth: pSubW, valueWidth: pValW },
      ]);
    });

    // 10. Building Details
    const bldgRows = [
      { label: 'Property Identified through', val: this.getF('propertyIdentifiedThrough', 'Documents & Site Inspection') },
      { label: 'Type of structure', val: this.getF('structureType', 'RCC') },
      { label: 'Land/Plot Area', val: this.getF('landPlotArea', '') },
      { label: 'No of Blocks', val: this.getF('noOfBlocks', 'NA') },
      { label: 'No of Units', val: this.getF('noOfUnits', 'NA') },
      { label: 'No. of Floors', val: this.getF('noOfFloors', '') },
      { label: 'No. of Lifts', val: this.getF('noOfLifts', 'NA') },
    ];

    bldgRows.forEach((row, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '10' : '', value: '', labelWidth: pNumW, valueWidth: 0, labelBold: idx === 0 },
        { label: idx === 0 ? 'Building details' : '', value: '', labelWidth: pCatW, valueWidth: 0, labelBold: idx === 0 },
        { label: row.label, value: row.val || 'NA', labelWidth: pSubW, valueWidth: pValW, bold: row.label === 'Land/Plot Area' },
      ]);
    });

    // 11. Unit Details
    this.checkPageBreak(120);
    const unitRows = [
      { label: 'Located on Floor No.', val: this.getF('unitFloorNo', 'NA') },
      { label: 'No. of rooms', val: this.getF('noOfRooms', 'NA') },
      { label: 'Measure Built up area', val: this.getF('measuredBUA', '') },
      { label: 'Carpet area', val: this.getF('carpetArea', '') },
      { label: 'Remarks on view from property', val: this.getF('viewRemarks', 'NA') },
    ];

    unitRows.forEach((row, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '11' : '', value: '', labelWidth: pNumW, valueWidth: 0, labelBold: idx === 0 },
        { label: idx === 0 ? 'Unit details' : '', value: '', labelWidth: pCatW, valueWidth: 0, labelBold: idx === 0 },
        { label: row.label, value: row.val || 'NA', labelWidth: pSubW, valueWidth: pValW, bold: row.label === 'Measure Built up area' },
      ]);
    });

    this.drawUnityRow('12', 'Quality of construction (Good /Avg./ Bad)', `Exteriors: ${this.getF('qualityExteriors', 'Good')} | Interiors: ${this.getF('qualityInteriors', 'Good')}`);
    this.drawUnityRow('13', 'Age of the property / Residual life', `Age: ${this.getF('ageOfProperty', '')} | Residual: ${this.getF('residualLife', '')}`);

    this.advanceCursor(4);

    // ==========================================
    // SANCTION PLAN APPROVAL & OTHER DOCUMENTS
    // ==========================================
    this.checkPageBreak(120);
    this.drawUnitySectionHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS');

    this.drawUnityRow('14', 'Sanctioned plans verified with approval no', this.getF('sanctionPlanVerified', 'Sanctioned plan not provided'));
    this.drawUnityRow('15', 'Ownership type (Leasehold/ Freehold)', this.getF('ownershipType', 'Freehold'));
    this.drawUnityRow('16', 'Property documents verified', this.getF('documentsVerified', 'Copy of Sale deed, ROR & Sketch map'));
    this.drawUnityRow('17', 'Is the property within Municipal Limits', this.getF('withinMunicipalLimits', 'Within GP limit'));
    this.drawUnityRow('18', 'Permissible usage allow as per master plan', this.getF('permissibleUsageMasterPlan', 'Master Plan not published'));

    // 19. Setbacks Table
    const sbNumW = 24;
    const sbSideLabelW = 90;
    const sbPlanW = 95;
    const sbSiteW = 95;
    const sbDevW = 75;
    const sbRemW = CONTENT_W - sbNumW - sbSideLabelW - sbPlanW - sbSiteW - sbDevW;

    this.drawKeyValueRow([
      { label: '19', value: '', labelWidth: sbNumW, valueWidth: 0, labelBold: true },
      { label: 'Setbacks', value: '', labelWidth: sbSideLabelW, valueWidth: 0, labelBold: true },
      { label: 'As per plan/ Bye laws', value: '', labelWidth: sbPlanW, valueWidth: 0, labelBold: true },
      { label: 'Actual at site', value: '', labelWidth: sbSiteW, valueWidth: 0, labelBold: true },
      { label: 'Deviation', value: '', labelWidth: sbDevW, valueWidth: 0, labelBold: true },
      { label: 'Remarks, if any', value: '', labelWidth: sbRemW, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: sbNumW, valueWidth: 0 },
      { label: 'Front', value: this.getF('sbPlanFront', 'NA'), labelWidth: sbSideLabelW, valueWidth: sbPlanW },
      { label: '', value: this.getF('sbSiteFront', 'NA'), labelWidth: 0, valueWidth: sbSiteW },
      { label: '', value: this.getF('sbDevFront', 'NA'), labelWidth: 0, valueWidth: sbDevW },
      { label: '', value: this.getF('sbRemarks', 'NA'), labelWidth: 0, valueWidth: sbRemW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: sbNumW, valueWidth: 0 },
      { label: 'Side1(Left)', value: this.getF('sbPlanLeft', 'NA'), labelWidth: sbSideLabelW, valueWidth: sbPlanW },
      { label: '', value: this.getF('sbSiteLeft', 'NA'), labelWidth: 0, valueWidth: sbSiteW },
      { label: '', value: this.getF('sbDevLeft', 'NA'), labelWidth: 0, valueWidth: sbDevW },
      { label: '', value: '', labelWidth: 0, valueWidth: sbRemW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: sbNumW, valueWidth: 0 },
      { label: 'Side2(Right)', value: this.getF('sbPlanRight', 'NA'), labelWidth: sbSideLabelW, valueWidth: sbPlanW },
      { label: '', value: this.getF('sbSiteRight', 'NA'), labelWidth: 0, valueWidth: sbSiteW },
      { label: '', value: this.getF('sbDevRight', 'NA'), labelWidth: 0, valueWidth: sbDevW },
      { label: '', value: '', labelWidth: 0, valueWidth: sbRemW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: sbNumW, valueWidth: 0 },
      { label: 'Rear', value: this.getF('sbPlanRear', 'NA'), labelWidth: sbSideLabelW, valueWidth: sbPlanW },
      { label: '', value: this.getF('sbSiteRear', 'NA'), labelWidth: 0, valueWidth: sbSiteW },
      { label: '', value: this.getF('sbDevRear', 'NA'), labelWidth: 0, valueWidth: sbDevW },
      { label: '', value: '', labelWidth: 0, valueWidth: sbRemW },
    ]);

    // 20. Floor Wise Area
    this.advanceCursor(4);
    const flrHdr = ["Area's", 'Basement', 'Stilt', 'Ground', 'First', 'Second', 'Third'];
    const flrRows = [
      [
        'Permissible area',
        this.getF('floorPermBasement', 'NA'),
        this.getF('floorPermStilt', ''),
        this.getF('floorPermGF', 'NA'),
        this.getF('floorPermFF', 'NA'),
        this.getF('floorPermSF', 'NA'),
        this.getF('floorPermTF', 'NA'),
      ],
      [
        'Total Constructed',
        this.getF('floorConstBasement', 'NA'),
        this.getF('floorConstStilt', 'NA'),
        this.getF('floorConstGF', ''),
        this.getF('floorConstFF', ''),
        this.getF('floorConstSF', 'NA'),
        this.getF('floorConstTF', 'NA'),
      ],
    ];
    this.drawDataTable(flrHdr, flrRows, 9);

    // ==========================================
    // 21. VALUATION
    // ==========================================
    this.checkPageBreak(180);
    this.drawUnitySectionHeader('VALUATION');

    this.drawCenteredTitle('(A)Description of Constructed Area and Rates', 11, true);
    const descColW = 160;
    const aColW = 90;
    const rColW = 90;
    const amtColW = CONTENT_W - 24 - descColW - aColW - rColW;

    this.drawKeyValueRow([
      { label: '21', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Description', value: '', labelWidth: descColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Area(Sft.)', value: '', labelWidth: aColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate (Sft.)', value: '', labelWidth: rColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Amount', value: '', labelWidth: amtColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const landArea = this.getF('valLandArea', '');
    const landRate = this.getF('valLandRate', '');
    const landAmt = this.getF('valLandAmount', '');

    const constArea = this.getF('valConstArea', '');
    const constRate = this.getF('valConstRate', '');
    const constAmt = this.getF('valConstAmount', '');

    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Land', value: landArea, labelWidth: descColW, valueWidth: aColW, labelBold: true },
      { label: '', value: landRate, labelWidth: 0, valueWidth: rColW },
      { label: '', value: landAmt, labelWidth: 0, valueWidth: amtColW, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Construction(Measured G+1)', value: constArea, labelWidth: descColW, valueWidth: aColW, labelBold: true },
      { label: '', value: constRate, labelWidth: 0, valueWidth: rColW },
      { label: '', value: constAmt, labelWidth: 0, valueWidth: amtColW, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Stage of construction', value: this.getF('stageOfConstruction', '100%'), labelWidth: descColW, valueWidth: CONTENT_W - 24 - descColW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Recommended Construction Value', value: this.getF('recConstValue', '100%'), labelWidth: descColW, valueWidth: CONTENT_W - 24 - descColW },
    ]);

    // Extra Amenities
    this.drawCenteredTitle('(B)Value of Extra Amenities if applicable', 11, true);
    const amColW = (CONTENT_W - 24) / 6;
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Car Parking', value: '', labelWidth: amColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'PLC', value: '', labelWidth: amColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'IDC', value: '', labelWidth: amColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'EDC', value: '', labelWidth: amColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Power Backup', value: '', labelWidth: amColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Other', value: '', labelWidth: CONTENT_W - 24 - 5 * amColW, valueWidth: 0, labelBold: true, highlight: true },
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
      { label: 'Total Amenities charges', value: this.getF('totalAmenitiesCharges', 'NA'), labelWidth: 220, valueWidth: CONTENT_W - 244, labelBold: true },
    ]);

    // Market Value Summary
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Market Value of Property (100%)', value: this.getF('totalMarketValue', 'Rs.0/-'), labelWidth: 270, valueWidth: CONTENT_W - 294, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Forced Sale Value(80%)', value: this.getF('forcedSaleValue', 'Rs.0/-'), labelWidth: 270, valueWidth: CONTENT_W - 294, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Approx. Rentals in case of 100% complete property', value: this.getF('approxRentals', 'NA'), labelWidth: 270, valueWidth: CONTENT_W - 294 },
    ]);

    // ==========================================
    // 22. BOUNDARIES
    // ==========================================
    this.checkPageBreak(120);
    this.drawUnitySectionHeader('BOUNDARIES');

    const bColW = (CONTENT_W - 24 - 110) / 4;
    this.drawKeyValueRow([
      { label: '22', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Boundaries', value: '', labelWidth: 110, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'EAST', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'WEST', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'NORTH', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'SOUTH', value: '', labelWidth: CONTENT_W - 24 - 110 - 3 * bColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'As per sale deed', value: this.getF('bndEastDeed', 'NA'), labelWidth: 110, valueWidth: bColW },
      { label: '', value: this.getF('bndWestDeed', 'NA'), labelWidth: 0, valueWidth: bColW },
      { label: '', value: this.getF('bndNorthDeed', 'NA'), labelWidth: 0, valueWidth: bColW },
      { label: '', value: this.getF('bndSouthDeed', 'NA'), labelWidth: 0, valueWidth: CONTENT_W - 24 - 110 - 3 * bColW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'As per Sketch map', value: this.getF('bndEastSketch', 'NA'), labelWidth: 110, valueWidth: bColW },
      { label: '', value: this.getF('bndWestSketch', 'NA'), labelWidth: 0, valueWidth: bColW },
      { label: '', value: this.getF('bndNorthSketch', 'NA'), labelWidth: 0, valueWidth: bColW },
      { label: '', value: this.getF('bndSouthSketch', 'NA'), labelWidth: 0, valueWidth: CONTENT_W - 24 - 110 - 3 * bColW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'At site', value: this.getF('bndEastSite', 'NA'), labelWidth: 110, valueWidth: bColW },
      { label: '', value: this.getF('bndWestSite', 'NA'), labelWidth: 0, valueWidth: bColW },
      { label: '', value: this.getF('bndNorthSite', 'NA'), labelWidth: 0, valueWidth: bColW },
      { label: '', value: this.getF('bndSouthSite', 'NA'), labelWidth: 0, valueWidth: CONTENT_W - 24 - 110 - 3 * bColW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Boundaries Matching', value: this.getF('boundariesMatching', 'Yes(Boundary matching as per document)'), labelWidth: 110, valueWidth: CONTENT_W - 134, labelBold: true },
    ]);

    // ==========================================
    // REMARKS & DECLARATION
    // ==========================================
    this.checkPageBreak(140);
    const defaultRemarks =
      'Remarks:- Subject property visited and inspected. Property boundaries are demarcated. Valuation done based on prevailing local market rates.';

    this.drawKeyValueRow([
      { label: 'Remarks / Observations', value: this.getF('remarks', defaultRemarks), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    this.advanceCursor(4);
    const declText =
      '1.  I hereby declare that, I have no direct and indirect interest in the property valued and the information furnished in the report is true and correct to the best of my knowledge of belief.\n' +
      '2.  Any additions or alterations after the date of inspection shall not fall under the scope of this report.\n' +
      '3.  The legal aspects are not in the scope of evaluation of the property.\n' +
      '4.  The Property is identified by the owner before the valuer. This valuation report is prepared without any prejudice and bias to any person or institution.\n' +
      '5.  This report has been prepared on basis of verifications in the locality.\n' +
      '6.  I am not required to give testimony or appear in court by reason of this appraisal report, with reference to the property in question.';

    this.drawKeyValueRow([
      { label: 'Declaration:-', value: declText, labelWidth: 100, valueWidth: CONTENT_W - 100 },
    ]);

    this.advanceCursor(8);
    this.drawKeyValueRow([
      {
        label: `Name of Engineer who visited the property: - ${this.getF('visitingEngineer', 'Er. Satyajit Mohanty')}`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: `(Authorized Signatory)`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
    ]);

    // ==========================================
    // ATTACHMENTS
    // ==========================================
    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.sketchMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.cadastralMapImages || []),
      ...(this.fields.maps || []),
    ];
    if (maps && maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION PLAN & SKETCH MAP');
    }

    const docs = this.fields.documentImages || this.fields.documents || [];
    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }

    const photos = this.fields.propertyImages || this.fields.photos || [];
    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PROPERTY SITE PHOTOGRAPHS');
    }
  }
}
