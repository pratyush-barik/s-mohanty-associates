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
      { label: label, value: '', labelWidth: labelW, valueWidth: 0, labelBold: false },
      { label: value || 'NA', value: '', labelWidth: valW, valueWidth: 0, labelBold: boldVal },
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
      { label: 'Type of Case', value: this.getF('typeOfCase', 'LAP'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Valuer Name', value: this.getF('valuerName', 'Er. Satyajit Mohanty'), labelWidth: 100, valueWidth: halfW - 100, labelBold: true },
      { label: 'Date of Visit', value: this.getF('dateOfVisit', '14/07/2022'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Case Ref. No', value: this.getF('caseRefNo', this.projectCode || 'APPL00013925'), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Date of Report', value: this.getF('reportDate', '15/07/2022'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Contacted Person for property inspection (Name/ Mobile)',
        value: this.getF('contactPerson', 'Mrs. Sanjukta Behera, Mob:- 9437021846'),
        labelWidth: 175,
        valueWidth: CONTENT_W - 175,
      },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // BASIC DETAILS
    // ==========================================
    this.drawUnitySectionHeader('BASIC DETAILS');

    this.drawUnityRow('1', "Applicant/s Name/s", this.getF('applicantName', 'MAA CHANDI TRADERS'), true);

    const p2LabelW = 200;
    const p2RemW = CONTENT_W - 24 - p2LabelW;
    const p2SubW = p2RemW / 2;
    this.drawKeyValueRow([
      { label: '2', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Type of property', value: '', labelWidth: p2LabelW, valueWidth: 0 },
      { label: this.getF('propertyTypeDesc', 'G+1 storied commercial cum residential building'), value: '', labelWidth: p2SubW - 60, valueWidth: 0 },
      { label: 'Current Usage', value: this.getF('currentUsage', 'Mixed'), labelWidth: 60, valueWidth: p2SubW },
    ]);

    this.drawUnityRow('3', 'Address at site', this.getF('addressAtSite', 'Khata no- 723/237, Plot No- 739/1539, (area=AC.0.237Decs, Homestead), Mouza-Bahadulpatna, Tahasil-Salipur, PS-Salipur, Dist-Cuttack, Odisha, Pin-754200'));
    this.drawUnityRow('', 'Address as per document', this.getF('addressAsPerDoc', 'Khata no- 723/237, Plot No- 739/1539, (area=AC.0.237Decs, Homestead), Mouza-Bahadulpatna, Tahasil-Salipur, PS-Salipur, Dist-Cuttack, Odisha, Pin-754200'));
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

    const locRows = [
      { label: 'Type(Comm., Res, Ind, Mix)', val: this.getF('localityType', 'Mixed') },
      { label: 'Class of Locality', val: this.getF('localityClass', 'Middle Class') },
      { label: 'Site is (Dev, Under Dev)', val: this.getF('siteStatus', 'Developed') },
      { label: 'Proximity to civic amenities/public transport', val: this.getF('proximityAmenities', 'Within 1-2 Kms') },
      { label: 'Railway Station', val: this.getF('railwayStation', '15Kms (Cuttack Railway Station)') },
      { label: 'Bus Stop', val: this.getF('busStop', '100Mtr (Bahadulpatna Square Bus Stop)') },
    ];

    const locColW = 200;
    const locValW = CONTENT_W - 24 - locColW;

    locRows.forEach((row, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '5' : '', value: '', labelWidth: 24, valueWidth: 0, labelBold: idx === 0 },
        { label: idx === 0 ? 'Location' : '', value: '', labelWidth: 100, valueWidth: 0, labelBold: idx === 0 },
        { label: row.label, value: '', labelWidth: locColW - 100, valueWidth: 0 },
        { label: row.val || 'NA', value: '', labelWidth: locValW, valueWidth: 0 },
      ]);
    });

    this.drawUnityRow('6', 'Close Vicinity/Landmark', this.getF('landmark', 'Near Paga Bus Stop'));
    this.drawUnityRow('7', 'Distance from City Center', this.getF('distanceCityCenter', '15 Kms from Cuttack city center'));
    this.drawUnityRow('8', 'Condition and width of approach road', this.getF('approachRoad', '60 ft wide Road'));

    this.advanceCursor(4);

    // ==========================================
    // PROPERTY DETAILS
    // ==========================================
    this.drawUnitySectionHeader('PROPERTY DETAILS');

    const pColW = 200;
    const pValW = CONTENT_W - 24 - pColW;

    const propRows = [
      { label: 'Vacant/Occupied', val: this.getF('occupancyStatus', 'Rented') },
      { label: 'Name of Occupant', val: this.getF('occupantName', 'NA') },
      { label: 'Relation with applicant', val: this.getF('occupantRelation', 'NA') },
      { label: 'Property Demarcation', val: this.getF('propertyDemarcation', 'Yes') },
    ];

    propRows.forEach((row, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '9' : '', value: '', labelWidth: 24, valueWidth: 0, labelBold: idx === 0 },
        { label: idx === 0 ? 'Occupant' : '', value: '', labelWidth: 100, valueWidth: 0, labelBold: idx === 0 },
        { label: row.label, value: '', labelWidth: pColW - 100, valueWidth: 0 },
        { label: row.val || 'NA', value: '', labelWidth: pValW, valueWidth: 0 },
      ]);
    });

    // 10. Building Details
    const bldgRows = [
      { label: 'Property Identified through', val: this.getF('propertyIdentifiedThrough', 'Documents & help of Customer') },
      { label: 'Type of structure', val: this.getF('structureType', 'RCC') },
      { label: 'Land/Plot Area', val: this.getF('landPlotArea', '10323sqft') },
      { label: 'No of Blocks', val: this.getF('noOfBlocks', 'NA') },
      { label: 'No of Units', val: this.getF('noOfUnits', 'NA') },
      { label: 'No. of Floors', val: this.getF('noOfFloors', '2(G+1)') },
      { label: 'No. of Lifts', val: this.getF('noOfLifts', 'N.A') },
    ];

    bldgRows.forEach((row, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '10' : '', value: '', labelWidth: 24, valueWidth: 0, labelBold: idx === 0 },
        { label: idx === 0 ? 'Building details' : '', value: '', labelWidth: 100, valueWidth: 0, labelBold: idx === 0 },
        { label: row.label, value: '', labelWidth: pColW - 100, valueWidth: 0 },
        { label: row.val || 'NA', value: '', labelWidth: pValW, valueWidth: 0, labelBold: row.label === 'Land/Plot Area' },
      ]);
    });

    // 11. Unit Details
    this.checkPageBreak(120);
    const unitRows = [
      { label: 'Located on Floor No.', val: this.getF('unitFloorNo', 'N.A') },
      { label: 'No. of rooms', val: this.getF('noOfRooms', 'NA') },
      { label: 'Measure Built up area', val: this.getF('measuredBUA', 'GF:-1728sqft, FF:-1728sqft\nTotal=3456sqft, (G+1)') },
      { label: 'Carpet area', val: this.getF('carpetArea', '2937sqft') },
      { label: 'Remarks on view from property', val: this.getF('viewRemarks', 'NA') },
    ];

    unitRows.forEach((row, idx) => {
      this.drawKeyValueRow([
        { label: idx === 0 ? '11' : '', value: '', labelWidth: 24, valueWidth: 0, labelBold: idx === 0 },
        { label: idx === 0 ? 'Unit details' : '', value: '', labelWidth: 100, valueWidth: 0, labelBold: idx === 0 },
        { label: row.label, value: '', labelWidth: pColW - 100, valueWidth: 0 },
        { label: row.val || 'NA', value: '', labelWidth: pValW, valueWidth: 0, labelBold: row.label === 'Measure Built up area' },
      ]);
    });

    this.drawUnityRow('12', 'Quality of construction (Good /Avg./ Bad)', `Exteriors: ${this.getF('qualityExteriors', 'Good')} | Interiors: ${this.getF('qualityInteriors', 'Good')}`);
    this.drawUnityRow('13', 'Age of the property / Residual life', `Age: ${this.getF('ageOfProperty', '06-Years')} | Residual: ${this.getF('residualLife', '54-Years')}`);

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
    this.drawKeyValueRow([
      { label: '19', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Setbacks', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'As per plan/ Bye laws', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'Actual at site', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'Deviation', value: '', labelWidth: 80, valueWidth: 0, labelBold: true },
      { label: 'Remarks, if any', value: '', labelWidth: CONTENT_W - 24 - 100 - 100 - 100 - 80, valueWidth: 0, labelBold: true },
    ]);
    const sbSideW = CONTENT_W - 24 - 100 - 100 - 100 - 80;
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Front', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('sbPlanFront', 'NA'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('sbSiteFront', 'NA'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('sbDevFront', 'NA'), value: '', labelWidth: 80, valueWidth: 0 },
      { label: this.getF('sbRemarks', 'Not mentioned in plan'), value: '', labelWidth: sbSideW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Side1(Left)', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('sbPlanLeft', 'NA'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('sbSiteLeft', 'NA'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: 'NA', value: '', labelWidth: 80, valueWidth: 0 },
      { label: '', value: '', labelWidth: sbSideW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Side2(Right)', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('sbPlanRight', 'NA'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('sbSiteRight', 'NA'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: 'NA', value: '', labelWidth: 80, valueWidth: 0 },
      { label: '', value: '', labelWidth: sbSideW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Rear', value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('sbPlanRear', 'NA'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('sbSiteRear', 'NA'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: 'NA', value: '', labelWidth: 80, valueWidth: 0 },
      { label: '', value: '', labelWidth: sbSideW, valueWidth: 0 },
    ]);

    // 20. Floor Wise Area
    this.advanceCursor(4);
    const flrHdr = ["Area's", 'Basement', 'Stilt', 'Ground', 'First', 'Second', 'Third'];
    const flrColW = (CONTENT_W - 24) / 7;
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
        this.getF('floorConstGF', '1728sqft'),
        this.getF('floorConstFF', '1728sqft'),
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

    const landArea = this.getF('valLandArea', '10323Sqft');
    const landRate = this.getF('valLandRate', 'Rs.0/-');
    const landAmt = this.getF('valLandAmount', 'Rs.0/-');

    const constArea = this.getF('valConstArea', '3456sqft');
    const constRate = this.getF('valConstRate', 'Rs.0/-');
    const constAmt = this.getF('valConstAmount', 'Rs.0/-');

    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Land', value: '', labelWidth: descColW, valueWidth: 0, labelBold: true },
      { label: landArea, value: '', labelWidth: aColW, valueWidth: 0 },
      { label: landRate, value: '', labelWidth: rColW, valueWidth: 0 },
      { label: landAmt, value: '', labelWidth: amtColW, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Construction(Measured G+1)', value: '', labelWidth: descColW, valueWidth: 0, labelBold: true },
      { label: constArea, value: '', labelWidth: aColW, valueWidth: 0 },
      { label: constRate, value: '', labelWidth: rColW, valueWidth: 0 },
      { label: constAmt, value: '', labelWidth: amtColW, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Stage of construction', value: '', labelWidth: descColW, valueWidth: 0 },
      { label: this.getF('stageOfConstruction', '100%'), value: '', labelWidth: CONTENT_W - 24 - descColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Recommended Construction Value', value: '', labelWidth: descColW, valueWidth: 0 },
      { label: this.getF('recConstValue', '100%'), value: '', labelWidth: CONTENT_W - 24 - descColW, valueWidth: 0 },
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
      { label: this.getF('totalAmenitiesCharges', 'NA'), value: '', labelWidth: CONTENT_W - 244, valueWidth: 0 },
    ]);

    // Market Value Summary
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Total Market Value of Property (100%)', value: '', labelWidth: 270, valueWidth: 0, labelBold: true },
      { label: this.getF('totalMarketValue', 'Rs.0/-'), value: '', labelWidth: CONTENT_W - 294, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Forced Sale Value(80%)', value: '', labelWidth: 270, valueWidth: 0, labelBold: true },
      { label: this.getF('forcedSaleValue', 'Rs.0/-'), value: '', labelWidth: CONTENT_W - 294, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Approx. Rentals in case of 100% complete property', value: '', labelWidth: 270, valueWidth: 0 },
      { label: this.getF('approxRentals', 'NA'), value: '', labelWidth: CONTENT_W - 294, valueWidth: 0 },
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
      { label: 'As per sale deed', value: '', labelWidth: 110, valueWidth: 0 },
      { label: this.getF('bndEastDeed', 'Seller'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('bndWestDeed', 'Banamali Maharana'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('bndNorthDeed', 'Chirakal'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('bndSouthDeed', 'Jadumani Behera'), value: '', labelWidth: CONTENT_W - 24 - 110 - 3 * bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'As per Sketch map', value: '', labelWidth: 110, valueWidth: 0 },
      { label: this.getF('bndEastSketch', 'Part of Plot no-739'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('bndWestSketch', '20 Feet Wide Road'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('bndNorthSketch', 'Cuttack Chandabali Road'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('bndSouthSketch', 'Sarhad Mouza Bahugram'), value: '', labelWidth: CONTENT_W - 24 - 110 - 3 * bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'At site', value: '', labelWidth: 110, valueWidth: 0 },
      { label: this.getF('bndEastSite', 'Building Of Birakishor Menta'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('bndWestSite', '20 Feet Wide Road'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('bndNorthSite', 'N.H-9(A)'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('bndSouthSite', 'Vacant land'), value: '', labelWidth: CONTENT_W - 24 - 110 - 3 * bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Boundaries Matching', value: '', labelWidth: 110, valueWidth: 0, labelBold: true },
      { label: this.getF('boundariesMatching', 'Yes(Boundary matching as per document)'), value: '', labelWidth: CONTENT_W - 134, valueWidth: 0 },
    ]);

    // ==========================================
    // REMARKS & DECLARATION
    // ==========================================
    this.checkPageBreak(140);
    const defaultRemarks =
      'Remarks:- Subject property is a G+1 storied commercial cum residential building having land extent of 10323sqft, total measured BUA 3456sqft. Approved plan not provided. Age of the building is about 6-years. It is located in developing area of Cuttack & accessible with 60-feet wide road. Property is near about 15 Kms from Cuttack city centre. All civic amenities are present within 1-2Kms. This plot is coming under Bahugram GP limit & surrounding areas are commercial cum residential in nature. Entire building is used by multi tenants for commercial cum residential purpose. Note- As per ROR the property is stand in name of Sri Radha Raman God. Hence, this case is not recommended.';

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
