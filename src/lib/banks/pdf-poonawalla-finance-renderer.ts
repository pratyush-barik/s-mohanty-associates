import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  fetchBytes,
} from '../pdf-bank-renderer';
import { formatIndianCurrency } from '../numberToWords';

export interface PoonawallaFinanceFields {
  // Header / Meta
  refNo?: string;
  dealNo?: string;
  valuerName?: string;
  vertical?: string;
  branchName?: string;
  typeOfCase?: string;
  dateOfInitiate?: string;
  dateOfVisit?: string;
  dateOfReport?: string;
  contactPerson?: string;

  // 1 to 4: Application & Identification
  applicantName?: string;
  propertyType?: string;
  currentUsage?: string;
  addressAsPerFiring?: string;
  addressAtSite?: string;
  addressAsPerDocument?: string;
  previousValuation?: string;

  // 5 to 10: Sanction Plan & Documents Details
  sanctionPlanDetails?: string;
  sanctionPlanNo?: string;
  sanctionStructure?: string;
  sanctionAuthority?: string;
  sanctionArea?: string;
  documentsVerified?: string;
  ownershipType?: string;
  constructionCompliance?: string;
  permissibleUsage?: string;
  demolitionList?: string;

  // 11 to 14: Boundaries & Building Details
  boundaryEastDoc?: string;
  boundaryWestDoc?: string;
  boundaryNorthDoc?: string;
  boundarySouthDoc?: string;
  boundaryEastSite?: string;
  boundaryWestSite?: string;
  boundaryNorthSite?: string;
  boundarySouthSite?: string;
  boundariesMatching?: string;

  occupancyStatus?: string;
  occupantName?: string;
  occupiedFrom?: string;
  occupantRelation?: string;

  propertyDemarcation?: string;
  identifiedThrough?: string;
  structureType?: string;
  plotArea?: string;
  noOfFloors?: string;
  floorValued?: string;
  unitsPerFloor?: string;
  liftsCount?: string;

  unitRooms?: string;
  sbuaPermissible?: string;
  carpetArea?: string;
  viewRemarks?: string;

  // 15 to 20: Locality & Physical Parameters
  constructionQuality?: string;
  interiorsExteriors?: string;
  propertyAge?: string;
  localityType?: string;
  localityClass?: string;
  siteDevStatus?: string;
  proximityAmenities?: string;
  landmark?: string;
  municipalLimits?: string;
  municipalCorporationName?: string;
  siteAccessRoad?: string;
  basicAmenitiesAvailable?: string;
  marketability?: string;
  electricityMeterNo?: string;

  // 21. Floor Wise Area Matrix
  actualBuaBase?: string;
  actualBuaStilt?: string;
  actualBuaGround?: string;
  actualBuaFirst?: string;
  actualBuaSecond?: string;
  actualBuaThird?: string;

  permissibleBuaBase?: string;
  permissibleBuaStilt?: string;
  permissibleBuaGround?: string;
  permissibleBuaFirst?: string;
  permissibleBuaSecond?: string;
  permissibleBuaThird?: string;

  extraCoverageBase?: string;
  extraCoverageStilt?: string;
  extraCoverageGround?: string;
  extraCoverageFirst?: string;
  extraCoverageSecond?: string;
  extraCoverageThird?: string;

  totalActualBua?: string;
  totalPermissibleBua?: string;
  saleableArea?: string;
  compositeExtraCoverage?: string;

  // 22. Valuation & Rates
  landArea?: string;
  landRate?: string;
  landValue?: string;
  constArea?: string;
  constRate?: string;
  buildingValue?: string;

  stageOfConstruction?: string;
  stagePercent?: string;
  recommendedPercent?: string;

  // Extra Amenities
  amenityCarParking?: string;
  amenityPlc?: string;
  amenityIdc?: string;
  amenityEdc?: string;
  amenityPowerBackup?: string;
  amenityClub?: string;
  amenityOther?: string;
  totalAmenitiesCharges?: string;

  marketValue?: string;
  distressValue?: string;
  circleRate?: string;
  approxRentals?: string;

  // Structural Specifications
  seismicZone?: string;
  footingType?: string;
  roofType?: string;
  masonryType?: string;
  soilType?: string;

  // Floorwise Usage
  floorwiseUsageRows?: {
    floor: string;
    usage: string;
    units: string;
    tenantedYear: string;
    rentalAssessment: string;
  }[];

  remarks?: string;

  // Attachments
  latitude?: string;
  longitude?: string;
  documentImages?: string[];
  documentImageNames?: string[];
  locationMapImages?: string[];
  mouzaMapImages?: string[];
  sketchMapImages?: string[];
  cadastralMapImages?: string[];
  bdaMapImages?: string[];
  propertyImages?: string[];
  propertyImageNames?: string[];

  projectCode?: string;
  [key: string]: any;
}

export class PDFPoonawallaFinanceRenderer extends PDFBankRenderer {
  private fields: PoonawallaFinanceFields;
  private projectCode?: string;

  constructor(opts: PoonawallaFinanceFields = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode || opts.refNo;
  }

  private getF(key: keyof PoonawallaFinanceFields, defaultVal: string = ''): string {
    const v = this.fields[key];
    if (v === undefined || v === null || v === '') return defaultVal;
    return String(v);
  }

  async render(): Promise<Uint8Array> {
    await this.init();
    await this.drawContent();
    return await this.save();
  }

  async generateAndDownload(fileName: string): Promise<void> {
    const pdfBytes = await this.render();
    if (typeof window !== 'undefined') {
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  private drawPoonawallaHeader(title: string) {
    this.drawSectionHeader(title);
  }

  private drawPoonawallaRow(num: string, label: string, value: string, boldVal: boolean = false) {
    if (!num) {
      this.drawKeyValueRow([
        {
          label: label,
          value: value || 'NA',
          labelWidth: 200,
          valueWidth: CONTENT_W - 200,
          labelBold: false,
          bold: boldVal,
        },
      ]);
      return;
    }

    const numW = 24;
    const labelW = 190;
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
    const halfW = CONTENT_W / 2;
    const thirdW = CONTENT_W / 3;

    // ══════════════════════════════════════════════════════════════
    // PAGE 1: VALUATION REPORT (META & ITEMS 1 TO 14)
    // ══════════════════════════════════════════════════════════════
    this.drawCenteredTitle('VALUATION REPORT', 13, true);
    this.advanceCursor(2);

    // Meta Header Lines
    this.drawKeyValueRow([
      { label: 'Ref :', value: this.getF('refNo', this.projectCode || ''), labelWidth: 45, valueWidth: halfW - 45, labelBold: true },
      { label: 'Valuer Name:', value: this.getF('valuerName', 'S MOHANTY ASSOCIATES'), labelWidth: 90, valueWidth: halfW - 90, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Deal No :', value: this.getF('dealNo', ''), labelWidth: 60, valueWidth: CONTENT_W - 60, labelBold: true },
    ]);

    // Top Metadata Table (6-column format)
    const colMetaL = 78;
    const colMetaV = thirdW - colMetaL;
    this.drawKeyValueRow([
      { label: 'Vertical', value: this.getF('vertical', 'NA'), labelWidth: colMetaL, valueWidth: colMetaV, labelBold: true },
      { label: 'Branch Name', value: this.getF('branchName', ''), labelWidth: colMetaL, valueWidth: colMetaV, labelBold: true },
      { label: 'Type of Case', value: this.getF('typeOfCase', 'LAP'), labelWidth: colMetaL, valueWidth: colMetaV, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Initiate', value: this.getF('dateOfInitiate', ''), labelWidth: colMetaL, valueWidth: colMetaV, labelBold: true },
      { label: 'Date of visit', value: this.getF('dateOfVisit', ''), labelWidth: colMetaL, valueWidth: colMetaV, labelBold: true },
      { label: 'Date of Report', value: this.getF('dateOfReport', ''), labelWidth: colMetaL, valueWidth: colMetaV, labelBold: true },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Contacted Person at site (ID proof details):',
        value: this.getF('contactPerson', ''),
        labelWidth: 240,
        valueWidth: CONTENT_W - 240,
        labelBold: true,
      },
    ]);

    // 1. Name/s of the applicant/s
    this.drawPoonawallaRow('1.', 'Name/s of the applicant/s', this.getF('applicantName', ''), true);

    // 2. Type of property & Current Usage
    this.drawKeyValueRow([
      { label: '2.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Type of property', value: this.getF('propertyType', 'G+2 storied commercial building'), labelWidth: 100, valueWidth: halfW - 124, bold: true },
      { label: 'Current Usage', value: this.getF('currentUsage', 'Commercial'), labelWidth: 90, valueWidth: halfW - 90, bold: true },
    ]);

    // 3. Addresses
    const addrH = 3;
    this.drawKeyValueRow([
      { label: '3.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true, hideBottom: true },
      { label: 'Address as per firing', value: this.getF('addressAsPerFiring', ''), labelWidth: 140, valueWidth: CONTENT_W - 24 - 140 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0, hideTop: true, hideBottom: true },
      { label: 'Address at site', value: this.getF('addressAtSite', ''), labelWidth: 140, valueWidth: CONTENT_W - 24 - 140 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0, hideTop: true },
      { label: 'Address as per document', value: this.getF('addressAsPerDocument', ''), labelWidth: 140, valueWidth: CONTENT_W - 24 - 140 },
    ]);

    // 4. Prior valuation
    this.drawPoonawallaRow('4.', 'Has the valuator done valuation of this property before this? If yes, when, for whom?', this.getF('previousValuation', 'No'));

    // SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS (Items 5 to 10)
    this.drawPoonawallaHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS:');

    // 5. Sanctioned plans verified
    const planDetailStr = this.getF('sanctionPlanDetails') ||
      `Plan no. ${this.getF('sanctionPlanNo', 'NA')}\nStructure : ${this.getF('sanctionStructure', 'NA')}\nAuthority: ${this.getF('sanctionAuthority', 'CDA')}\nArea: ${this.getF('sanctionArea', 'NA')}`;
    this.drawPoonawallaRow('5.', 'Sanctioned plans verified with approval no', planDetailStr);

    // 6. Property Documents verified
    this.drawPoonawallaRow('6.', 'Property Documents verified', this.getF('documentsVerified', 'Copy of Sale Deed, Gift deed, ROR, Approved plan'));

    // 7. Ownership type
    this.drawPoonawallaRow('7.', 'Ownership type', this.getF('ownershipType', 'Freehold'));

    // 8. Construction compliance
    this.drawPoonawallaRow('8.', 'Construction as per approved Building plan/Bye Laws', this.getF('constructionCompliance', 'Bye Laws'));

    // 9. Permissible usage
    this.drawPoonawallaRow('9.', 'Permissible usage allows as per master plan', this.getF('permissibleUsage', 'Master Plan not publish'));

    // 10. Demolition list
    this.drawPoonawallaRow('10.', 'Is the property in demolition list, if yes Details', this.getF('demolitionList', 'Not observed'));

    // 11. Boundaries as Per Documents & Site
    this.drawPoonawallaHeader('11. Boundaries as Per Documents & Site:');
    const colBW = CONTENT_W / 5;
    this.drawTable(
      ['Boundaries', 'EAST', 'WEST', 'NORTH', 'SOUTH'],
      [
        [
          'As per Sale deed',
          this.getF('boundaryEastDoc', 'NA'),
          this.getF('boundaryWestDoc', 'NA'),
          this.getF('boundaryNorthDoc', 'NA'),
          this.getF('boundarySouthDoc', 'NA'),
        ],
        [
          'At site',
          this.getF('boundaryEastSite', 'NA'),
          this.getF('boundaryWestSite', 'NA'),
          this.getF('boundaryNorthSite', 'NA'),
          this.getF('boundarySouthSite', 'NA'),
        ],
      ],
      [colBW * 1.1, colBW * 1.0, colBW * 0.95, colBW * 0.95, colBW * 1.0],
      [],
      [0]
    );
    this.drawSMFGSubRow('', 'Boundaries Matching', this.getF('boundariesMatching', 'Partly matching'), true);

    // 12. Occupant
    this.drawPoonawallaHeader('12. Occupant Details');
    this.drawKeyValueRow([
      { label: 'Vacant/Occupied/Tenant', value: this.getF('occupancyStatus', 'Occupied'), labelWidth: 150, valueWidth: halfW - 150, labelBold: true },
      { label: 'Name of Occupant', value: this.getF('occupantName', 'Partly self occupied & Partly rented'), labelWidth: 130, valueWidth: halfW - 130, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Occupied from', value: this.getF('occupiedFrom', 'NA'), labelWidth: 150, valueWidth: halfW - 150, labelBold: true },
      { label: 'Relation with applicant', value: this.getF('occupantRelation', 'NA'), labelWidth: 130, valueWidth: halfW - 130, labelBold: true },
    ]);

    // 13. Building details
    this.drawPoonawallaHeader('13. Building Details');
    this.drawKeyValueRow([
      { label: 'Property Demarcation', value: this.getF('propertyDemarcation', 'Yes'), labelWidth: 150, valueWidth: halfW - 150, labelBold: true },
      { label: 'Property Identified through', value: this.getF('identifiedThrough', 'Customer'), labelWidth: 150, valueWidth: halfW - 150, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Type of structure', value: this.getF('structureType', 'RCC'), labelWidth: 110, valueWidth: halfW - 110, labelBold: true },
      { label: 'Plot Area', value: this.getF('plotArea', '') ? `${this.getF('plotArea')} sqft` : '', labelWidth: 80, valueWidth: halfW - 80, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'No. of Floors', value: this.getF('noOfFloors', 'G+2'), labelWidth: 110, valueWidth: halfW - 110, labelBold: true },
      { label: 'Floor Valued', value: this.getF('floorValued', 'G+2'), labelWidth: 80, valueWidth: halfW - 80, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'No. of unit per floor', value: this.getF('unitsPerFloor', 'NA'), labelWidth: 130, valueWidth: halfW - 130, labelBold: true },
      { label: 'No. of lifts', value: this.getF('liftsCount', 'Nil'), labelWidth: 80, valueWidth: halfW - 80, labelBold: true },
    ]);

    // 14. Unit details
    this.drawPoonawallaHeader('14. Unit Details');
    this.drawPoonawallaRow('', 'No. of rooms', this.getF('unitRooms', 'GF--Godown, 2-Toilets, FF-- 1-Office (The new India assurance co. Ltd.)'));
    this.drawKeyValueRow([
      { label: 'Super Built up area (Permissible Area)', value: this.getF('sbuaPermissible', 'NA'), labelWidth: 220, valueWidth: halfW - 220 + 20, labelBold: true },
      { label: 'Carpet area (Of Actual Area)', value: this.getF('carpetArea', '') ? `${this.getF('carpetArea')} (Actual)` : 'NA', labelWidth: 170, valueWidth: halfW - 170 - 20, labelBold: true },
    ]);
    this.drawPoonawallaRow('', 'Remarks on view from property', this.getF('viewRemarks', 'NA'));

    // ── End of Page 1 ──
    this.addPage();

    // ══════════════════════════════════════════════════════════════
    // PAGE 2: ITEMS 15 TO 22 & SPECIFICATIONS
    // ══════════════════════════════════════════════════════════════

    // 15. Quality of construction & Interiors/Exteriors
    this.drawKeyValueRow([
      { label: '15.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Quality of construction', value: this.getF('constructionQuality', 'Average'), labelWidth: 140, valueWidth: halfW - 164, labelBold: true },
      { label: 'Interiors/Exteriors', value: this.getF('interiorsExteriors', 'Average'), labelWidth: 110, valueWidth: halfW - 110, labelBold: true },
    ]);

    // 16. Age of the property & Location
    this.drawKeyValueRow([
      { label: '16.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Age of the property', value: this.getF('propertyAge', '30-Years'), labelWidth: 140, valueWidth: CONTENT_W - 24 - 140, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Location: Type (Comm., Res, Ind, Mix)', value: this.getF('localityType', 'Commercial'), labelWidth: 220, valueWidth: halfW - 244 + 40, labelBold: true },
      { label: 'Class of Locality', value: this.getF('localityClass', 'High class'), labelWidth: 110, valueWidth: halfW - 110 - 40, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Site is (Dev, Under Dev)', value: this.getF('siteDevStatus', 'Developed'), labelWidth: 170, valueWidth: halfW - 194 + 40, labelBold: true },
      { label: 'Proximity to civic amenities', value: this.getF('proximityAmenities', 'All civic amenities are within 1-2Kms'), labelWidth: 150, valueWidth: halfW - 150 - 40, labelBold: true },
    ]);

    // 17. Close Vicinity / Landmark
    this.drawPoonawallaRow('17.', 'Close Vicinity / Landmark', this.getF('landmark', ''));

    // 18. Property within Municipal Limits
    this.drawKeyValueRow([
      { label: '18.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Property within Municipal Limits', value: this.getF('municipalLimits', 'Yes (Within CDA limit)'), labelWidth: 180, valueWidth: halfW - 204 + 30, labelBold: true },
      { label: 'Name of Municipal Corp.', value: this.getF('municipalCorporationName', 'Cuttack Municipal Corporation'), labelWidth: 140, valueWidth: halfW - 140 - 30, labelBold: true },
    ]);

    // 19. Site Access & Basic amenities
    this.drawKeyValueRow([
      { label: '19.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Site Access', value: this.getF('siteAccessRoad', '15-ft wide WBM road'), labelWidth: 90, valueWidth: halfW - 114, labelBold: true },
      { label: 'Basic amenities (Water, Sewer, Elec, Road)', value: this.getF('basicAmenitiesAvailable', 'Yes'), labelWidth: 210, valueWidth: halfW - 210, labelBold: true },
    ]);

    // 20. Marketability & Electricity Meter No.
    this.drawKeyValueRow([
      { label: '20.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Marketability', value: this.getF('marketability', 'Good'), labelWidth: 90, valueWidth: halfW - 114, labelBold: true },
      { label: 'Electricity Meter No.', value: this.getF('electricityMeterNo', 'Not seen'), labelWidth: 130, valueWidth: halfW - 130, labelBold: true },
    ]);

    // 21. Floor Wise Area (In SqFt) Table
    this.drawPoonawallaHeader('21. Floor Wise Area (In SqFt.)');
    const colFAW = CONTENT_W / 7;
    const faHeaders = ["Area's", 'Base.', 'Stilt', 'Ground', 'First', 'Second', 'Third/above'];
    const faRows = [
      [
        'Actual',
        this.getF('actualBuaBase', 'Nil'),
        this.getF('actualBuaStilt', 'Nil'),
        this.getF('actualBuaGround', ''),
        this.getF('actualBuaFirst', ''),
        this.getF('actualBuaSecond', ''),
        this.getF('actualBuaThird', 'Nil'),
      ],
      [
        'Permissible',
        this.getF('permissibleBuaBase', 'Nil'),
        this.getF('permissibleBuaStilt', 'Nil'),
        this.getF('permissibleBuaGround', 'NA'),
        this.getF('permissibleBuaFirst', 'NA'),
        this.getF('permissibleBuaSecond', 'NA'),
        this.getF('permissibleBuaThird', 'Nil'),
      ],
      [
        'Extra Coverage (in %)',
        this.getF('extraCoverageBase', 'NA'),
        this.getF('extraCoverageStilt', 'NA'),
        this.getF('extraCoverageGround', 'NA'),
        this.getF('extraCoverageFirst', 'NA'),
        this.getF('extraCoverageSecond', 'NA'),
        this.getF('extraCoverageThird', 'NA'),
      ],
    ];
    this.drawTable(
      faHeaders,
      faRows,
      [colFAW * 1.3, colFAW * 0.95, colFAW * 0.95, colFAW * 0.95, colFAW * 0.95, colFAW * 0.95, colFAW * 0.95],
      [],
      [0]
    );

    this.drawKeyValueRow([
      { label: 'Total Actual (In SqFt):', value: this.getF('totalActualBua', '') ? `${this.getF('totalActualBua')} sqft` : '', labelWidth: 160, valueWidth: halfW - 160, labelBold: true, bold: true },
      { label: 'Total Permissible (In SqFt):', value: this.getF('totalPermissibleBua', 'NA'), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Saleable (In SqFt):', value: this.getF('saleableArea', 'NA'), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: "Composite Extra Coverage's:", value: this.getF('compositeExtraCoverage', 'NA'), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
    ]);

    // 22. Valuation & Rates (A & B)
    this.drawPoonawallaHeader('22. Valuation Details & Extra Amenities');

    // (A) Description of Constructed Area and Rates
    const colValW = CONTENT_W / 4;
    const vHeaders = ['Description', 'Area', 'Rate (in Rs.)', 'Amount (in Rs.)'];
    const landAmt = this.getF('landValue', '');
    const bldgAmt = this.getF('buildingValue', '');
    const landAmtFormatted = landAmt ? `Rs. ${formatIndianCurrency(landAmt)}/-` : 'Rs. 0/-';
    const bldgAmtFormatted = bldgAmt ? `Rs. ${formatIndianCurrency(bldgAmt)}/-` : 'Rs. 0/-';

    const vRows = [
      [
        'Land (sqyds/sqft) (As per sale deed)',
        this.getF('landArea', '') ? `${this.getF('landArea')} sqft` : '',
        this.getF('landRate', '') ? `Rs. ${this.getF('landRate')}/-` : 'Rs. 0/-',
        landAmtFormatted,
      ],
      [
        'Construction/Composite Rate (sqft) Actual',
        this.getF('constArea', '') ? `${this.getF('constArea')} sqft` : '',
        this.getF('constRate', '') ? `Rs. ${this.getF('constRate')}/-` : 'Rs. 0/-',
        bldgAmtFormatted,
      ],
    ];
    this.drawTable(
      vHeaders,
      vRows,
      [colValW * 1.5, colValW * 0.8, colValW * 0.8, colValW * 0.9],
      [],
      [0]
    );

    this.drawKeyValueRow([
      { label: 'Stage of construction', value: this.getF('stageOfConstruction', '100%'), labelWidth: 140, valueWidth: thirdW - 140, labelBold: true },
      { label: 'Stage %', value: this.getF('stagePercent', '100%'), labelWidth: 60, valueWidth: thirdW - 60, labelBold: true },
      { label: 'Recommended %', value: this.getF('recommendedPercent', '100%'), labelWidth: 100, valueWidth: thirdW - 100, labelBold: true },
    ]);
    this.drawSMFGSubRow('', 'Total Building Value (A+B)', bldgAmtFormatted, true);

    // (B) Value of Extra Amenities
    const colAmenW = CONTENT_W / 7;
    this.drawTable(
      ['Car Parking', 'PLC', 'IDC', 'EDC', 'Power Backup', 'Club Membership', 'Other'],
      [
        [
          this.getF('amenityCarParking', 'NA'),
          this.getF('amenityPlc', 'NA'),
          this.getF('amenityIdc', 'NA'),
          this.getF('amenityEdc', 'NA'),
          this.getF('amenityPowerBackup', 'NA'),
          this.getF('amenityClub', 'NA'),
          this.getF('amenityOther', 'NA'),
        ],
      ],
      [colAmenW, colAmenW, colAmenW, colAmenW, colAmenW, colAmenW, colAmenW],
      [],
      [],
      []
    );
    this.drawPoonawallaRow('', 'Total Amenities charges (in Rs.)', this.getF('totalAmenitiesCharges', 'Nil'), false);

    // Valuation Grand Totals
    const mVal = this.getF('marketValue', '');
    const dVal = this.getF('distressValue', '');
    this.drawKeyValueRow([
      {
        label: 'Market Value of Property as on date of Valuation (in Rs.) (I+II):',
        value: mVal ? `Rs. ${formatIndianCurrency(mVal)}/-` : '',
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
        labelBold: true,
        bold: true,
        highlight: true,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Forced Sale Value (80%):',
        value: dVal ? `Rs. ${formatIndianCurrency(dVal)}/-` : '',
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
        labelBold: true,
        bold: true,
      },
    ]);
    this.drawKeyValueRow([
      { label: 'Circle Rate (in Rs.):', value: this.getF('circleRate', '') ? `Rs. ${this.getF('circleRate', '')}/-` : 'NA', labelWidth: 320, valueWidth: CONTENT_W - 320, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Approx. Rentals in case of 100% complete property (in Rs.):', value: this.getF('approxRentals', '-'), labelWidth: 320, valueWidth: CONTENT_W - 320, labelBold: true },
    ]);

    // Structural & Engineering Specifications Table
    this.drawPoonawallaHeader('Structural & Engineering Specifications');
    this.drawKeyValueRow([
      { label: 'Seismic zone (I/II/III/IV/V)', value: this.getF('seismicZone', 'III'), labelWidth: 150, valueWidth: 55, labelBold: true },
      { label: 'Structure type', value: this.getF('structureType', 'RCC'), labelWidth: 85, valueWidth: 55, labelBold: true },
      { label: 'Footing type', value: this.getF('footingType', 'Independent Footing'), labelWidth: 70, valueWidth: CONTENT_W - (150 + 55 + 85 + 55 + 70), labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Roof type', value: this.getF('roofType', 'RCC slab'), labelWidth: 80, valueWidth: 90, labelBold: true },
      { label: 'Type of masonry', value: this.getF('masonryType', 'Brick'), labelWidth: 100, valueWidth: 65, labelBold: true },
      { label: 'Type of soil', value: this.getF('soilType', 'Red soil'), labelWidth: 75, valueWidth: CONTENT_W - (80 + 90 + 100 + 65 + 75), labelBold: true },
    ]);

    // ── End of Page 2 ──
    this.addPage();

    // ══════════════════════════════════════════════════════════════
    // PAGE 3: FLOORWISE USAGE, REMARKS, DECLARATION & SIGNATORY
    // ══════════════════════════════════════════════════════════════
    this.drawPoonawallaHeader('FLOORWISE DETAILS OF USAGE OF PROPERTY:');
    const defaultFloorRows = [
      ['Basement', 'NA', '', '', ''],
      ['Ground', 'Commercial', '', 'Self', 'NA'],
      ['First', 'NA', '', 'NA', 'NA'],
      ['Second', 'NA', '', 'NA', 'NA'],
      ['Third', 'NA', '', '', ''],
      ['4th/above', 'NA', '', '', ''],
    ];
    const usageRows = (this.fields.floorwiseUsageRows && this.fields.floorwiseUsageRows.length > 0)
      ? this.fields.floorwiseUsageRows.map(r => [
          r.floor || '',
          r.usage || '',
          r.units || '',
          r.tenantedYear || '',
          r.rentalAssessment || '',
        ])
      : defaultFloorRows;

    const colUW = CONTENT_W / 5;
    this.drawTable(
      ['FLOOR', 'USAGE', 'UNITS', 'IF TENANTED, YR OF CURRENT TENANCY', 'RENTAL ASSESSMENT'],
      usageRows,
      [colUW * 0.8, colUW * 1.05, colUW * 0.65, colUW * 1.3, colUW * 1.2],
      [],
      [0]
    );

    // Remarks
    this.advanceCursor(4);
    this.drawPoonawallaHeader('REMARKS & VALUATION CERTIFICATE:');
    const remarks = this.getF('remarks', '');
    if (remarks) {
      this.drawWrappedTextAt(remarks, MARGIN_L, this.cursorY, CONTENT_W, {
        align: 'justify',
      });
      this.advanceCursor(16);
    }

    // Declaration
    this.checkPageBreak(80);
    this.drawPoonawallaHeader('Declaration:');
    const declarations = [
      '1. The property is physically inspected by our Engineer/Representative.',
      '2. We have no direct/indirect interest in the property valued.',
      '3. The information furnished above is true & correct to the best of our knowledge and belief and takes account information and or document submitted or shown to us by the client.',
      '4. The ownership papers/sale deeds may please be verified at your end to ascertain the right title & area.',
      '5. The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same. The fair market value of such properties/localities may increase or decrease depending on the future market conditions and scenarios. This report does not certify or confirm any ownership or title of the property that has been valued.',
    ];
    declarations.forEach(dec => {
      this.drawWrappedTextAt(dec, MARGIN_L, this.cursorY, CONTENT_W, {
        align: 'justify',
      });
      this.advanceCursor(4);
    });

    // Authorized Signatory
    this.checkPageBreak(50);
    this.advanceCursor(14);
    this.drawKeyValueRow([
      {
        label: 'M/s. S MOHANTY ASSOCIATES (Empanelled Valuer)',
        value: '(Authorized Signatory)',
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
        labelBold: true,
        bold: true,
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // ANNEXURES: DOCUMENTS, MAPS, PHOTOGRAPHS
    // ══════════════════════════════════════════════════════════════
    const rawDocs: string[] = this.fields.documentImages || [];
    const validDocs = rawDocs.filter(d => Boolean(d && typeof d === 'string' && d.trim()));
    const docNames: string[] = this.fields.documentImageNames || [];

    if (validDocs.length > 0) {
      const docBytesList: { bytes: Uint8Array; name?: string }[] = [];
      for (let i = 0; i < validDocs.length; i++) {
        const b = await fetchBytes(validDocs[i]);
        if (b && b.length > 0) {
          const rawName = docNames[i];
          const name = (rawName !== undefined && rawName !== null && rawName.trim() !== '')
            ? rawName.trim()
            : `DOCUMENT ${i + 1}`;
          docBytesList.push({ bytes: b, name });
        }
      }

      if (docBytesList.length > 0) {
        await this.drawDocumentsGallery(docBytesList, 'VERIFIED PROPERTY DOCUMENTS', 240, true);
      }
    }

    const lat = this.getF('latitude', '');
    const lng = this.getF('longitude', '');
    const locMapTitle = lat && lng ? `LOCATION MAP (LAT: ${lat}, LONG: ${lng})` : 'LOCATION MAP';

    const mapCategories: { title: string; urls: string[] }[] = [
      { title: locMapTitle, urls: this.fields.locationMapImages || [] },
      { title: 'MOUZA MAP', urls: this.fields.mouzaMapImages || [] },
      { title: 'SKETCH MAP', urls: this.fields.sketchMapImages || [] },
      { title: 'CADASTRAL MAP', urls: this.fields.cadastralMapImages || [] },
      { title: 'BDA MAP', urls: this.fields.bdaMapImages || [] },
    ];

    let isFirstMap = true;
    for (const cat of mapCategories) {
      const validUrls = (cat.urls || []).filter((u: string) => Boolean(u && typeof u === 'string' && u.trim()));
      if (validUrls.length === 0) continue;

      const imgBytesList: { bytes: Uint8Array; caption?: string }[] = [];
      for (const u of validUrls) {
        const b = await fetchBytes(u);
        if (b && b.length > 0) {
          imgBytesList.push({ bytes: b });
        }
      }

      if (imgBytesList.length > 0) {
        await this.drawMapGallery(imgBytesList, cat.title, 230, isFirstMap && validDocs.length === 0);
        isFirstMap = false;
      }
    }

    const rawPhotos: string[] = this.fields.propertyImages || [];
    const validPhotos = rawPhotos.filter(p => Boolean(p && typeof p === 'string' && p.trim()));
    const photoNames: string[] = this.fields.propertyImageNames || [];

    if (validPhotos.length > 0) {
      const photoBytesList: { bytes: Uint8Array; label?: string }[] = [];
      for (let i = 0; i < validPhotos.length; i++) {
        const b = await fetchBytes(validPhotos[i]);
        if (b && b.length > 0) {
          const label = photoNames[i] || `Photograph ${i + 1}`;
          photoBytesList.push({ bytes: b, label });
        }
      }

      if (photoBytesList.length > 0) {
        await this.drawPhotoGrid(photoBytesList, 'PROPERTY SITE PHOTOGRAPHS', 180, true);
      }
    }
  }

  private drawSMFGSubRow(num: string, label: string, value: string, boldVal: boolean = false) {
    this.drawPoonawallaRow(num, label, value, boldVal);
  }
}
