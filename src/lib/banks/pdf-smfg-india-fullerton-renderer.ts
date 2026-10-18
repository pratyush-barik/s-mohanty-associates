import {
  PDFBankRenderer,
  CONTENT_W,
  fetchBytes,
} from '../pdf-bank-renderer';
import { formatIndianCurrency } from '../numberToWords';

export class PDFSMFGIndiaFullertonRenderer extends PDFBankRenderer {
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

  private drawSMFGHeader(title: string) {
    this.drawSectionHeader(title);
  }

  private drawSMFGRow(num: string, label: string, value: string, boldVal: boolean = false) {
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
      { label: 'Valuer Name:', value: this.getF('valuerName', 'M/s. S MOHANTY ASSOCIATES'), labelWidth: 90, valueWidth: halfW - 90, labelBold: true },
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
      { label: 'Type of Case', value: this.getF('typeOfCase', 'Mass LAP'), labelWidth: colMetaL, valueWidth: colMetaV, labelBold: true },
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
    this.drawSMFGRow('1.', 'Name/s of the applicant/s', this.getF('applicantName', ''), true);

    // 2. Type of property & Current Usage
    this.drawKeyValueRow([
      { label: '2.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Type of property', value: this.getF('propertyType', 'Single storied Residential building'), labelWidth: 100, valueWidth: halfW - 124, bold: true },
      { label: 'Current Usage', value: this.getF('currentUsage', 'Residential'), labelWidth: 90, valueWidth: halfW - 90, bold: true },
    ]);

    // 3. Address details
    this.drawSMFGRow('3.', 'Address as per firing', this.getF('addressAsPerFiring', this.getF('addressAtSite', '')));
    this.drawSMFGRow('', 'Address at site', this.getF('addressAtSite', ''));
    this.drawSMFGRow('', 'Address as per document', this.getF('addressAsPerDocument', this.getF('addressAtSite', '')));

    // 4. Prior valuation
    this.drawSMFGRow('4.', 'Has valuator done valuation of this property before this? If yes, when, for whom?', this.getF('previousValuation', 'No'));

    // SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS
    this.drawSMFGHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS:');
    this.drawSMFGRow('5.', 'Sanctioned plans verified with approval no', this.getF('sanctionPlanDetails', 'Plan no. NA, Structure: NA, Authority: NA, Area: NA'));
    this.drawSMFGRow('6.', 'Property Documents verified', this.getF('documentsVerified', 'Copy of Sale Deed, ROR & Sketch map'));
    this.drawSMFGRow('7.', 'Ownership type', this.getF('ownershipType', 'Freehold'));
    this.drawSMFGRow('8.', 'Construction as per approved Building plan/Bye Laws', this.getF('constructionCompliance', 'Bye Laws'));
    this.drawSMFGRow('9.', 'Permissible usage allows as per master plan', this.getF('permissibleUsage', 'Master Plan not Publish'));
    this.drawSMFGRow('10.', 'Is the property in demolition list, if yes Details', this.getF('demolitionList', 'Not observed'));

    // 11. Boundaries
    this.drawSMFGHeader('11. Boundaries as Per Documents & Site:');
    const colBndW = (CONTENT_W - 120) / 4;
    this.drawKeyValueRow([
      { label: 'Schedule', value: 'EAST', labelWidth: 120, valueWidth: colBndW, labelBold: true, bold: true },
      { label: 'WEST', value: 'NORTH', labelWidth: colBndW, valueWidth: colBndW, labelBold: true, bold: true },
      { label: 'SOUTH', value: '', labelWidth: colBndW, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'As per Documents', value: this.getF('boundaryEastDoc', ''), labelWidth: 120, valueWidth: colBndW },
      { label: this.getF('boundaryWestDoc', ''), value: this.getF('boundaryNorthDoc', ''), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundarySouthDoc', ''), value: '', labelWidth: colBndW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'As per Sketch map', value: this.getF('boundaryEastSketch', 'NA'), labelWidth: 120, valueWidth: colBndW },
      { label: this.getF('boundaryWestSketch', 'NA'), value: this.getF('boundaryNorthSketch', 'NA'), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundarySouthSketch', 'NA'), value: '', labelWidth: colBndW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'At site', value: this.getF('boundaryEastSite', ''), labelWidth: 120, valueWidth: colBndW },
      { label: this.getF('boundaryWestSite', ''), value: this.getF('boundaryNorthSite', ''), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundarySouthSite', ''), value: '', labelWidth: colBndW, valueWidth: 0 },
    ]);
    this.drawSMFGRow('', 'Boundaries Matching', this.getF('boundariesMatching', 'Yes (Boundary is matching as per documents)'), true);

    // 12. Occupant
    this.drawKeyValueRow([
      { label: '12.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Occupant Details', value: this.getF('occupancyStatus', 'Occupied'), labelWidth: 110, valueWidth: halfW - 134, labelBold: true },
      { label: 'Name of Occupant', value: this.getF('occupantName', 'Self occupied'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Occupied from', value: this.getF('occupiedFrom', 'Self occupied'), labelWidth: 110, valueWidth: halfW - 134 },
      { label: 'Relation with applicant', value: this.getF('occupantRelation', 'Customer'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);

    // 13. Building details
    this.drawKeyValueRow([
      { label: '13.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Property Demarcation', value: this.getF('propertyDemarcation', 'Yes'), labelWidth: 110, valueWidth: halfW - 134 },
      { label: 'Identified through', value: this.getF('identifiedThrough', 'Customer'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Type of structure', value: this.getF('structureType', 'RCC'), labelWidth: 110, valueWidth: halfW - 134 },
      { label: 'Plot Area', value: this.getF('plotArea', '') ? `${this.getF('plotArea', '')} sqft` : '', labelWidth: 110, valueWidth: halfW - 110, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'No. of Floors', value: this.getF('noOfFloors', 'GF'), labelWidth: 110, valueWidth: halfW - 134 },
      { label: 'Floor Valued', value: this.getF('floorValued', 'GF'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);

    // 14. Unit details
    this.drawKeyValueRow([
      { label: '14.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'No of unit per floor', value: this.getF('unitsPerFloor', 'NA'), labelWidth: 110, valueWidth: halfW - 134 },
      { label: 'No. of lifts', value: this.getF('liftsCount', 'Nil'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);
    this.drawSMFGRow('', 'No. of rooms', this.getF('unitRooms', ''));
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Super Built-up area (Permissible)', value: this.getF('sbuaPermissible', 'NA'), labelWidth: 145, valueWidth: halfW - 169 },
      { label: 'Carpet area (Actual Measured)', value: this.getF('carpetArea', '') ? `${this.getF('carpetArea', '')} sqft` : '', labelWidth: 145, valueWidth: halfW - 145, bold: true },
    ]);

    // ── End of Page 1 ──
    this.addPage();

    // ══════════════════════════════════════════════════════════════
    // PAGE 2: ITEMS 15 TO 22, VALUATION & STRUCTURAL SPECS
    // ══════════════════════════════════════════════════════════════
    // 15. Quality of construction
    this.drawKeyValueRow([
      { label: '15.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Quality of construction', value: this.getF('constructionQuality', 'Good'), labelWidth: 110, valueWidth: halfW - 134 },
      { label: 'Remarks on view', value: this.getF('viewRemarks', 'NA'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);

    // 16. Age & Locality
    this.drawKeyValueRow([
      { label: '16.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Age of the property', value: this.getF('propertyAge', ''), labelWidth: 110, valueWidth: halfW - 134 },
      { label: 'Location Type', value: this.getF('localityType', 'Residential'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 24, valueWidth: 0 },
      { label: 'Class of Locality', value: this.getF('localityClass', 'Middle class'), labelWidth: 110, valueWidth: halfW - 134 },
      { label: 'Site is', value: this.getF('siteDevStatus', 'Developing'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);
    this.drawSMFGRow('', 'Proximity to civic amenities', this.getF('proximityAmenities', ''));

    // 17. Landmark
    this.drawSMFGRow('17.', 'Close Vicinity / Landmark', this.getF('landmark', ''));

    // 18. Municipal Limits
    this.drawKeyValueRow([
      { label: '18.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Property within municipal Limits', value: this.getF('municipalLimits', ''), labelWidth: 145, valueWidth: halfW - 169 },
      { label: 'Name of Municipality/GP', value: this.getF('municipalityName', this.getF('municipalLimits', '')), labelWidth: 130, valueWidth: halfW - 130 },
    ]);

    // 19. Site Access & basic amenities
    this.drawKeyValueRow([
      { label: '19.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Site Access (Road Width)', value: this.getF('siteAccessRoad', ''), labelWidth: 145, valueWidth: halfW - 169 },
      { label: 'Availability of basic amenities', value: this.getF('basicAmenitiesAvailable', 'Yes'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    // 20. Marketability
    this.drawKeyValueRow([
      { label: '20.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Marketability', value: this.getF('marketability', 'Good'), labelWidth: 110, valueWidth: halfW - 134 },
      { label: 'Electricity Meter No.', value: this.getF('electricityMeterNo', 'Not seen'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    // 21. Floor Wise Area (In Sqft.) Table
    this.drawSMFGHeader('21. Floor Wise Area (In Sqft.)');
    const colFloorW = CONTENT_W / 7;
    const actualGF = this.getF('actualBuaGround', '') || (this.getF('constArea', '') ? `${this.getF('constArea', '')} sqft` : '');
    this.drawTable(
      ["Area's", 'Base.', 'Stilt', 'Ground', 'First', 'Second', 'Third/above'],
      [
        [
          'Actual BUA',
          this.getF('actualBuaBase', 'NA'),
          this.getF('actualBuaStilt', 'NA'),
          actualGF,
          this.getF('actualBuaFirst', 'NA'),
          this.getF('actualBuaSecond', 'NA'),
          this.getF('actualBuaThird', 'NA'),
        ],
        [
          'Permissible',
          this.getF('permissibleBuaBase', 'NA'),
          this.getF('permissibleBuaStilt', 'NA'),
          this.getF('permissibleBuaGround', 'NA'),
          this.getF('permissibleBuaFirst', 'NA'),
          this.getF('permissibleBuaSecond', 'NA'),
          this.getF('permissibleBuaThird', 'Nil'),
        ],
        [
          'Extra Coverage (%)',
          this.getF('extraCoverageBase', 'NA'),
          this.getF('extraCoverageStilt', 'NA'),
          this.getF('extraCoverageGround', 'NA'),
          this.getF('extraCoverageFirst', 'NA'),
          this.getF('extraCoverageSecond', 'NA'),
          this.getF('extraCoverageThird', 'NA'),
        ],
      ],
      [colFloorW * 1.3, colFloorW * 0.95, colFloorW * 0.95, colFloorW * 0.95, colFloorW * 0.95, colFloorW * 0.95, colFloorW * 0.95],
      [],
      [0],
      [3]
    );

    this.drawKeyValueRow([
      { label: 'Total Actual (In Sqft):', value: this.getF('totalActualBua', actualGF), labelWidth: 125, valueWidth: halfW - 125, labelBold: true, bold: true },
      { label: 'Total Permissible (In Sqft):', value: this.getF('totalPermissibleBua', 'NA'), labelWidth: 135, valueWidth: halfW - 135, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Saleable (In Sqft):', value: this.getF('saleableArea', 'NA'), labelWidth: 125, valueWidth: halfW - 125, labelBold: true },
      { label: "Composite Extra Coverage's:", value: this.getF('compositeExtraCoverage', 'NA'), labelWidth: 135, valueWidth: halfW - 135, labelBold: true },
    ]);

    // 22. Valuation & Rates
    this.drawSMFGHeader('22. (A) Description of Constructed Area and Rates');
    const colValW = CONTENT_W / 4;
    this.drawTable(
      ['Description', 'Area', 'Rate (in Rs.)', 'Amount (in Rs.)'],
      [
        [
          'Land (sqyds)...../(As per Sale deed)',
          this.getF('landArea', '') ? `${this.getF('landArea', '')} sqft` : '',
          this.getF('landRate', '') ? `Rs. ${this.getF('landRate', '')}/-` : '',
          this.getF('landValue', '') ? `Rs. ${formatIndianCurrency(this.getF('landValue', ''))}/-` : '',
        ],
        [
          'Construction /Composite Rate (sqft) - Measured BUA .....(A) (RCC GF)',
          this.getF('constArea', '') ? `${this.getF('constArea', '')} sqft` : '',
          this.getF('constRate', '') ? `Rs. ${this.getF('constRate', '')}/-` : '',
          this.getF('buildingValue', '') ? `Rs. ${formatIndianCurrency(this.getF('buildingValue', ''))}/-` : '',
        ],
      ],
      [colValW * 1.5, colValW * 0.75, colValW * 0.75, colValW],
      [],
      [],
      [0, 3]
    );

    this.drawKeyValueRow([
      { label: 'Stage of construction:', value: this.getF('stageOfConstruction', '100%'), labelWidth: 120, valueWidth: 70, labelBold: true },
      { label: 'Stage %:', value: this.getF('stagePercent', '100%'), labelWidth: 65, valueWidth: 55, labelBold: true },
      { label: 'Recommended %:', value: this.getF('recommendedPercent', '100%'), labelWidth: 95, valueWidth: CONTENT_W - (120 + 70 + 65 + 55 + 95), labelBold: true },
    ]);
    this.drawSMFGRow('', 'Total Building Value', this.getF('buildingValue', '') ? `Rs. ${formatIndianCurrency(this.getF('buildingValue', ''))}/-` : '', true);

    // (B) Extra Amenities
    this.drawSMFGHeader('(B) Value of Extra Amenities:');
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
    this.drawSMFGRow('', 'Total Amenities charges (in Rs.)', this.getF('totalAmenitiesCharges', 'Nil'), false);

    this.drawKeyValueRow([
      { label: 'Market Value of Property as on date of Valuation (in Rs.) (I+II):', value: this.getF('marketValue', '') ? `Rs. ${formatIndianCurrency(this.getF('marketValue', ''))}/-` : '', labelWidth: 320, valueWidth: CONTENT_W - 320, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Forced Sale Value (80%):', value: this.getF('distressValue', '') ? `Rs. ${formatIndianCurrency(this.getF('distressValue', ''))}/-` : '', labelWidth: 320, valueWidth: CONTENT_W - 320, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Circle Rate (in Rs.):', value: this.getF('circleRate', '') ? `Rs. ${this.getF('circleRate', '')}/-` : '', labelWidth: 320, valueWidth: CONTENT_W - 320, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Approx. Rentals in case of 100% complete property (in Rs.):', value: this.getF('approxRentals', '-'), labelWidth: 320, valueWidth: CONTENT_W - 320, labelBold: true },
    ]);

    // Structural & Engineering Specifications
    this.drawSMFGHeader('Structural & Engineering Specifications');
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
    this.drawSMFGHeader('FLOORWISE DETAILS OF USAGE OF PROPERTY:');
    const defaultFloorRows = [
      ['Basement', 'NA', '', '', ''],
      ['Ground', 'Residential', '', 'Self', 'NA'],
      ['First', 'NA', '', 'NA', 'NA'],
      ['Second', 'NA', '', 'NA', 'NA'],
      ['Third', 'NA', '', '', ''],
      ['4th/above', 'NA', '', '', ''],
    ];
    const usageRows = Array.isArray(this.fields.floorwiseUsageRows) && this.fields.floorwiseUsageRows.length > 0
      ? this.fields.floorwiseUsageRows.map((r: any) => [
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
    this.drawSMFGHeader('REMARKS:');
    const remarks = this.getF('remarks', '');
    if (remarks) {
      this.drawKeyValueRow([
        { label: remarks, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    }

    // Declaration
    this.advanceCursor(4);
    this.drawSMFGHeader('Declaration:');
    const declarations = [
      '1. The property is physically inspected by our Engineer/Representative.',
      '2. We have no direct/indirect interest in the property valued.',
      '3. The information furnished above is true & correct to the best of our knowledge and belief and takes account information and or document submitted or shown to us by the client.',
      '4. The ownership papers/sale deeds may please be verified at your end to ascertain the right title & area.',
      '5. The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same. The fair market value of such properties/localities may increase or decrease depending on the future market conditions and scenarios. This report does not certify or confirm any ownership or title of the property that has been valued.',
    ];
    declarations.forEach(dec => {
      this.drawKeyValueRow([
        { label: dec, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    // Authorized Signatory
    this.advanceCursor(16);
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
    // ANNEXURES: SECTION 7 (DOCUMENTS), SECTION 8 (MAPS), SECTION 9 (PHOTOGRAPHS)
    // ══════════════════════════════════════════════════════════════

    // ── 7. Verified Documents Gallery ──
    const rawDocs: string[] = this.fields.documentImages || this.fields.documents || [];
    const validDocs = rawDocs.filter(d => Boolean(d && typeof d === 'string' && d.trim()));
    const docNames: string[] = this.fields.documentImageNames || [];

    if (validDocs.length > 0) {
      const docBytesList: { bytes: Uint8Array; name?: string }[] = [];
      for (let i = 0; i < validDocs.length; i++) {
        const b = await fetchBytes(validDocs[i]);
        if (b && b.length > 0) {
          const rawName = docNames[i];
          const name = (rawName !== undefined && rawName !== null && rawName.trim() !== '') ? rawName.trim() : `DOCUMENT ${i + 1}`;
          docBytesList.push({ bytes: b, name });
        }
      }

      if (docBytesList.length > 0) {
        // Starts on a fresh page (Page 4)
        await this.drawDocumentsGallery(docBytesList, undefined, 240, true);
      }
    }

    // ── 8. Location Sketch & Maps Gallery ──
    const lat = this.getF('latitude', '');
    const lng = this.getF('longitude', '');
    const locMapTitle = lat && lng ? `LOCATION MAP (LAT: ${lat}, LONG: ${lng})` : 'LOCATION MAP';

    const mapCategories: { title: string; urls: string[] }[] = [
      {
        title: locMapTitle,
        urls: this.fields.locationMapImages || [],
      },
      {
        title: 'MOUZA MAP',
        urls: this.fields.mouzaMapImages || [],
      },
      {
        title: 'SKETCH MAP',
        urls: this.fields.sketchMapImages || [],
      },
      {
        title: 'CADASTRAL MAP',
        urls: this.fields.cadastralMapImages || [],
      },
      {
        title: 'BDA MAP',
        urls: this.fields.bdaMapImages || [],
      },
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
        // Starts on a fresh page if no documents were rendered, or cleanly breaks
        await this.drawMapGallery(imgBytesList, cat.title, 230, isFirstMap && validDocs.length === 0);
        isFirstMap = false;
      }
    }

    // ── 9. Site Photographs Grid ──
    const rawPhotos: string[] = this.fields.propertyImages || this.fields.photos || [];
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
        // drawPhotoGrid always starts with addPage()
        await this.drawPhotoGrid(photoBytesList, 'PHOTOGRAPHS', 180, true);
      }
    }

    // Custom Annexures (spreadsheets) if populated
    if (this.fields.annexures) {
      this.renderAnnexures(this.fields.annexures);
    }
  }
}

export default PDFSMFGIndiaFullertonRenderer;
