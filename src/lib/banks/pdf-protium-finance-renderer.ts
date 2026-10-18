import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  FONT_SIZE_TITLE,
  FONT_SIZE_HEADER,
  FONT_SIZE,
  hexToRgb,
  LBL_BG,
  BG_OPACITY,
  BORDER_W,
  fetchBytes,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';
import { rgb } from 'pdf-lib';

export interface ProtiumFinanceFields {
  // Header metadata
  leadIdLan?: string;
  reportDate?: string;
  valuerName?: string;
  projectCode?: string;

  // Section A: General Details
  applicantName?: string;
  propertyOwner?: string;
  propertyAddressSite?: string;
  legalAddress?: string;
  ownerContactNo?: string;
  tenantIfApplicable?: string;
  landmark?: string;
  latitude?: string;
  longitude?: string;
  dateOfTechnicalVisit?: string;
  propertyUsage?: string;
  propertyUsageDoc?: string;
  occupancy?: string;
  marketability?: string;
  frontRoadWidth?: string;

  // Section B: Surrounding Locality Details
  wardMunicipalNo?: string;
  typeOfLocality?: string;
  distanceBusStop?: string;
  distanceHospital?: string;
  distanceRailway?: string;
  siteAccess?: string;
  planProvidedStatus?: string;
  corporationLimit?: string;
  municipalityLimit?: string;
  panchayatUnion?: string;
  approachRoadCondition?: string;
  approachRoadWidth?: string;

  // Section C: Property Details
  noOfFloors?: string;
  floorWiseUsage?: string;
  ageOfProperty?: string;
  residualAge?: string;

  // Boundaries
  boundaryNorthDoc?: string;
  boundaryNorthSite?: string;
  boundaryNorthPlan?: string;
  boundarySouthDoc?: string;
  boundarySouthSite?: string;
  boundarySouthPlan?: string;
  boundaryEastDoc?: string;
  boundaryEastSite?: string;
  boundaryEastPlan?: string;
  boundaryWestDoc?: string;
  boundaryWestSite?: string;
  boundaryWestPlan?: string;
  boundariesMatching?: string;
  propertyIdentifiedThrough?: string;
  plotDemarcatedAtSite?: string;
  amenities?: string;

  // Land & Built-up Areas
  landPlotAreaDoc?: string;
  dimensionNorth?: string;
  dimensionSouth?: string;
  dimensionEast?: string;
  dimensionWest?: string;
  totalPlotArea?: string;
  reductionArea?: string;
  netTotalArea?: string;
  landPlotAreaPlan?: string;
  landPlotAreaSite?: string;
  builtUpAreaPlan?: string;

  // BUA itemized list
  buaItems?: {
    name: string;
    formula?: string;
    bua: string;
    structureType?: string;
  }[];
  totalMeasuredBua?: string;
  floorDetailsSummary?: string;
  propertyType?: string;
  occupancyStatus?: string;

  // Section D: Structural Details
  typeOfStructure?: string;
  structuralFloorsSummary?: string;
  noOfWings?: string;
  noOfUnitsPerFloor?: string;
  qualityOfConstruction?: string;
  structuralObservation?: string;
  configuration?: string;

  // Section E: Interiors
  flooringFinishing?: string;
  roofingTerracing?: string;
  qualityOfFixtures?: string;
  doorsWindows?: string;

  // Section F: Plan Approval Details
  constructionAsPerApprovedPlan?: string;
  detailsOfApprovedPlan?: string;
  constructionPermissionNoDate?: string;
  violationsRiskOfDemolition?: string;
  structureConfirmingToLocal?: string;

  // Section G: Deviation Details
  deviationRows?: {
    floor: string;
    asPerPlan: string;
    atSite: string;
    deviationSqft: string;
    deviationPct: string;
  }[];

  // Section H: Self Construction Case
  architectEstimateAvailable?: string;
  constructionAmountCertified?: string;
  selfConstructionOthers?: string;

  // Section I: Fair Market Value & Costing
  valuationMethodology?: string;
  landAreaSqft?: string;
  landRatePerSqft?: string;
  landValueManual?: string;
  calculatedLandValue?: number;

  buildingValuationRows?: {
    particulars: string;
    bua: string;
    ratePerUnit: string;
    replacementCost?: number;
    depreciationPct: string;
    lessDepreciation?: number;
    netDepreciatedValue?: number;
  }[];
  amenitiesValue?: string;
  totalBuildingValue?: number;

  totalPropertyValue?: number;
  totalPropertyValueWords?: string;
  distressSalePct?: string;
  distressSaleValue?: number;
  guidelineRate?: string;
  guidelineLandValue?: string;

  floorwiseUsageRows?: {
    floor: string;
    usage: string;
    units: string;
    value: string;
    currentTenancy: string;
    rentalAssessment: string;
  }[];

  constructionProgressPct?: string;
  constructionRecommendedPct?: string;
  demolitionRisk?: string;
  naturalDisasterRisk?: string;

  remarks?: string;

  // Attachments
  propertyDocuments?: any[];
  locationMaps?: any[];
  propertyPhotos?: any[];
  [key: string]: any;
}

export class PDFProtiumFinanceRenderer extends PDFBankRenderer {
  private fields: ProtiumFinanceFields;
  private projectCode?: string;

  constructor(opts: ProtiumFinanceFields = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode || opts.leadIdLan;
  }

  private getF(key: keyof ProtiumFinanceFields, defaultVal: string = ''): string {
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

  private draw2Col(label: string, value: string, boldVal = false, highlight = false) {
    const labelW = 200;
    const valW = CONTENT_W - labelW;
    this.drawKeyValueRow([
      {
        label,
        value: value || 'NA',
        labelWidth: labelW,
        valueWidth: valW,
        labelBold: true,
        bold: boldVal,
        highlight,
      },
    ]);
  }

  private draw4Col(
    label1: string,
    value1: string,
    label2: string,
    value2: string,
    boldVal1 = false,
    boldVal2 = false
  ) {
    const halfW = CONTENT_W / 2;
    const lW = 110;
    const vW = halfW - lW;
    this.drawKeyValueRow([
      { label: label1, value: value1 || 'NA', labelWidth: lW, valueWidth: vW, labelBold: true, bold: boldVal1 },
      { label: label2, value: value2 || 'NA', labelWidth: lW, valueWidth: vW, labelBold: true, bold: boldVal2 },
    ]);
  }

  async drawContent(): Promise<void> {
    // ══════════════════════════════════════════════════════════════
    // PAGE 1: HEADER & GENERAL DETAILS & SURROUNDING LOCALITY
    // ══════════════════════════════════════════════════════════════
    this.drawCenteredTitle('VALUATION REPORT FOR PROTIUM FINANCE LIMITED', 13, true);
    this.advanceCursor(4);

    // Meta sub-header row (Lead ID / Date / Valuer Name)
    const thirdW = CONTENT_W / 3;
    this.drawKeyValueRow([
      {
        label: 'Lead ID / LAN:',
        value: this.getF('leadIdLan', this.projectCode || ''),
        labelWidth: 85,
        valueWidth: thirdW - 85,
        labelBold: true,
        bold: true,
      },
      {
        label: 'Date:',
        value: this.getF('reportDate'),
        labelWidth: 45,
        valueWidth: thirdW - 45,
        labelBold: true,
      },
      {
        label: 'Valuer Name:',
        value: this.getF('valuerName', 'M/S. S MOHANTY ASSOCIATES'),
        labelWidth: 75,
        valueWidth: thirdW - 75,
        labelBold: true,
        bold: true,
      },
    ]);

    // SECTION A: GENERAL DETAILS
    this.drawSectionHeader('A. GENERAL DETAILS');
    this.draw2Col('Name of the applicant/s', this.getF('applicantName'), true);
    this.draw2Col('Name of the property owner/s', this.getF('propertyOwner'), true);
    this.draw2Col('Site Address', this.getF('propertyAddressSite'));
    this.draw2Col('Legal Address', this.getF('legalAddress'));
    this.draw4Col(
      'Contact No. of Owner',
      this.getF('ownerContactNo'),
      'Tenant if Applicable',
      this.getF('tenantIfApplicable')
    );
    this.draw4Col(
      'Landmark',
      this.getF('landmark'),
      'Coordinates',
      `${this.getF('latitude')} , ${this.getF('longitude')}`
    );
    this.draw4Col(
      'Date of Technical Visit',
      this.getF('dateOfTechnicalVisit'),
      'Front Road Width',
      this.getF('frontRoadWidth'),
      true
    );
    this.draw4Col(
      'Property Usage (Site)',
      this.getF('propertyUsage'),
      'Property Usage (Doc)',
      this.getF('propertyUsageDoc')
    );
    this.draw4Col(
      'Occupancy',
      this.getF('occupancy'),
      'Marketability',
      this.getF('marketability')
    );

    // SECTION B: SURROUNDING LOCALITY DETAILS
    this.drawSectionHeader('B. SURROUNDING LOCALITY DETAILS');
    this.draw4Col(
      'Ward / Municipal No.',
      this.getF('wardMunicipalNo'),
      'Type of Locality',
      this.getF('typeOfLocality')
    );
    this.draw2Col('Distance from Bus Stop', this.getF('distanceBusStop'));
    this.draw2Col('Distance from Govt. Hospital', this.getF('distanceHospital'));
    this.draw2Col('Distance from Railway Station', this.getF('distanceRailway'));
    this.draw4Col(
      'Site Access',
      this.getF('siteAccess'),
      'Plan Provided Status',
      this.getF('planProvidedStatus'),
      false,
      true
    );
    this.draw4Col(
      'Corporation Limit',
      this.getF('corporationLimit'),
      'Municipality / GP Limit',
      this.getF('municipalityLimit')
    );
    this.draw4Col(
      'Panchayat Union',
      this.getF('panchayatUnion'),
      'Approach Road Condition',
      this.getF('approachRoadCondition')
    );
    this.draw2Col('Approach Road Width', this.getF('approachRoadWidth'));

    // SECTION C: PROPERTY DETAILS (PROPOSED / ACTUAL)
    this.drawSectionHeader('C. PROPERTY DETAILS (Proposed / Actual)');
    this.draw4Col(
      'No. of Floors',
      this.getF('noOfFloors'),
      'Floor Wise Usage',
      this.getF('floorWiseUsage')
    );
    this.draw4Col(
      'Age of the Property',
      this.getF('ageOfProperty'),
      'Residual Age',
      this.getF('residualAge')
    );

    // 4-Direction Boundaries Table
    const bHeaders = ['Direction', 'As per Document', 'At Site', 'As per Plan'];
    const bRows = [
      ['North', this.getF('boundaryNorthDoc'), this.getF('boundaryNorthSite'), this.getF('boundaryNorthPlan')],
      ['South', this.getF('boundarySouthDoc'), this.getF('boundarySouthSite'), this.getF('boundarySouthPlan')],
      ['East', this.getF('boundaryEastDoc'), this.getF('boundaryEastSite'), this.getF('boundaryEastPlan')],
      ['West', this.getF('boundaryWestDoc'), this.getF('boundaryWestSite'), this.getF('boundaryWestPlan')],
    ];
    const bColW = [CONTENT_W * 0.16, CONTENT_W * 0.28, CONTENT_W * 0.28, CONTENT_W * 0.28];
    this.drawTable(bHeaders, bRows, bColW, [], [0]);

    this.draw4Col(
      'Boundaries Matching',
      this.getF('boundariesMatching'),
      'Property Identified Through',
      this.getF('propertyIdentifiedThrough'),
      true
    );
    this.draw4Col(
      'Plot Demarcated at Site',
      this.getF('plotDemarcatedAtSite'),
      'Amenities',
      this.getF('amenities')
    );

    // Land Plot Areas & Measurements
    this.draw4Col(
      'Land/Plot Area (as per Doc)',
      `${this.getF('landPlotAreaDoc')} SqFt`,
      'Land/Plot Area (at Site)',
      `${this.getF('landPlotAreaSite')} SqFt`,
      true,
      true
    );
    this.draw4Col(
      'Total Plot Area',
      `${this.getF('totalPlotArea')} SqFt`,
      'Net Total Area',
      `${this.getF('netTotalArea')} SqFt`
    );
    this.draw4Col(
      'Land/Plot Area (as per Plan)',
      this.getF('landPlotAreaPlan'),
      'Built-up Area (as per Plan)',
      this.getF('builtUpAreaPlan')
    );

    // Itemized Measured Built-up Area Breakdown Table
    const buaHeaders = ['Building / Particulars', 'Formula / Dimensions', 'BUA (SqFt)', 'Structure Type'];
    const buaRowsData = (this.fields.buaItems && this.fields.buaItems.length > 0)
      ? this.fields.buaItems.map(item => [
          item.name || '',
          item.formula || '',
          item.bua ? `${item.bua} SqFt` : '',
          item.structureType || 'RCC',
        ])
      : [['-', '-', '-', '-']];

    if (this.fields.buaItems && this.fields.buaItems.length > 0) {
      buaRowsData.push([
        'Total Measured Built-up Area',
        '',
        this.getF('totalMeasuredBua') ? `${this.getF('totalMeasuredBua')} SqFt` : '-',
        '',
      ]);
    }

    const buaColW = [CONTENT_W * 0.42, CONTENT_W * 0.28, CONTENT_W * 0.16, CONTENT_W * 0.14];
    this.drawTable(
      buaHeaders,
      buaRowsData,
      buaColW,
      [],
      [],
      [0],
      [],
      buaRowsData.length > 1 ? [{ r: buaRowsData.length - 1, c: 0 }, { r: buaRowsData.length - 1, c: 2 }] : []
    );

    this.draw2Col('Floor Details Summary', this.getF('floorDetailsSummary'));
    this.draw4Col(
      'Property Type',
      this.getF('propertyType'),
      'Occupancy Status',
      this.getF('occupancyStatus')
    );

    // SECTION D: STRUCTURAL DETAILS
    this.drawSectionHeader('D. STRUCTURAL DETAILS');
    this.draw4Col(
      'Type of Structure',
      this.getF('typeOfStructure'),
      'Quality of Construction',
      this.getF('qualityOfConstruction')
    );
    this.draw2Col('Structural Floors Summary', this.getF('structuralFloorsSummary'));
    this.draw4Col(
      'No. of Wings',
      this.getF('noOfWings'),
      'No. of Units per Floor',
      this.getF('noOfUnitsPerFloor')
    );
    this.draw4Col(
      'Structural Observation',
      this.getF('structuralObservation'),
      'Configuration',
      this.getF('configuration')
    );

    // SECTION E: INTERIORS
    this.drawSectionHeader('E. INTERIORS');
    this.draw4Col(
      'Flooring & Finishing',
      this.getF('flooringFinishing'),
      'Roofing & Terracing',
      this.getF('roofingTerracing')
    );
    this.draw4Col(
      'Quality of Fixtures',
      this.getF('qualityOfFixtures'),
      'Doors & Windows',
      this.getF('doorsWindows')
    );

    // SECTION F: PLAN APPROVAL DETAILS
    this.drawSectionHeader('F. PLAN APPROVAL DETAILS');
    this.draw2Col('Construction as per Approved Plan', this.getF('constructionAsPerApprovedPlan'), true);
    this.draw4Col(
      'Details of Approved Plan',
      this.getF('detailsOfApprovedPlan'),
      'Permission No. & Date',
      this.getF('constructionPermissionNoDate')
    );
    this.draw4Col(
      'Violations / Risk of Demolition',
      this.getF('violationsRiskOfDemolition'),
      'Confirming to Local Bye-laws',
      this.getF('structureConfirmingToLocal')
    );

    // SECTION G: DEVIATION DETAILS
    this.drawSectionHeader('G. DEVIATION DETAILS');
    const devHeaders = ['Floor', 'As per Plan', 'At Site', 'Deviation (SqFt)', 'Deviation (%)'];
    const devRowsData = (this.fields.deviationRows && this.fields.deviationRows.length > 0)
      ? this.fields.deviationRows.map(r => [
          r.floor || '',
          r.asPerPlan || 'NA',
          r.atSite || '',
          r.deviationSqft || 'NA',
          r.deviationPct || 'NA',
        ])
      : [['G+3', 'NA', '22525 SqFt', 'NA', 'NA']];
    const devColW = [CONTENT_W * 0.16, CONTENT_W * 0.21, CONTENT_W * 0.21, CONTENT_W * 0.21, CONTENT_W * 0.21];
    this.drawTable(devHeaders, devRowsData, devColW, [], [0]);

    // SECTION H: SELF CONSTRUCTION CASE
    this.drawSectionHeader('H. SELF CONSTRUCTION CASE');
    this.draw4Col(
      'Architect Estimate Available',
      this.getF('architectEstimateAvailable'),
      'Construction Amount Certified',
      this.getF('constructionAmountCertified')
    );
    this.draw2Col('Self Construction Others', this.getF('selfConstructionOthers'));

    // SECTION I: FAIR MARKET VALUE & COSTING
    this.drawSectionHeader('I. FAIR MARKET VALUE & COSTING');
    this.draw2Col('Valuation Methodology', this.getF('valuationMethodology', 'Land & Building Method'), true);

    // Land Valuation Calculation
    const landArea = parseFloat(this.getF('landAreaSqft', '43560')) || 0;
    const landRate = parseFloat(this.getF('landRatePerSqft', '450')) || 0;
    const landVal = this.fields.calculatedLandValue ?? (this.fields.landValueManual ? Number(this.fields.landValueManual) : Math.round(landArea * landRate));

    this.drawKeyValueRow([
      {
        label: 'Land Valuation:',
        value: `${landArea.toLocaleString('en-IN')} SqFt  @  Rs. ${landRate.toLocaleString('en-IN')} / SqFt  =  Rs. ${formatIndianCurrency(landVal)}/-`,
        labelWidth: 150,
        valueWidth: CONTENT_W - 150,
        labelBold: true,
        bold: true,
        highlight: true,
      },
    ]);

    // Building Valuation Table
    const bldgHeaders = ['Particulars', 'BUA (SqFt)', 'Rate/SqFt', 'Replacement Cost', 'Dep %', 'Less Dep.', 'Net Value (Rs.)'];
    let sumRepl = 0;
    let sumLessDep = 0;
    let sumNet = 0;

    const bldgRows = (this.fields.buildingValuationRows && this.fields.buildingValuationRows.length > 0)
      ? this.fields.buildingValuationRows.map(row => {
          const bua = parseFloat(row.bua) || 0;
          const rate = parseFloat(row.ratePerUnit) || 0;
          const depPct = parseFloat(row.depreciationPct) || 0;
          const repl = row.replacementCost ?? Math.round(bua * rate);
          const lessDep = row.lessDepreciation ?? Math.round(repl * (depPct / 100));
          const net = row.netDepreciatedValue ?? (repl - lessDep);

          sumRepl += repl;
          sumLessDep += lessDep;
          sumNet += net;

          return [
            row.particulars || '',
            bua.toLocaleString('en-IN'),
            `Rs. ${rate.toLocaleString('en-IN')}`,
            `Rs. ${formatIndianCurrency(repl)}/-`,
            `${depPct}%`,
            `Rs. ${formatIndianCurrency(lessDep)}/-`,
            `Rs. ${formatIndianCurrency(net)}/-`,
          ];
        })
      : [
          [
            '4(G+3) Bldg. 1 Class/Office (16876 sqft) + Bldg. 2 Hostel (3240 sqft) Total 20116 SqFt (RCC)',
            '20116',
            'Rs. 1,600',
            'Rs. 3,21,85,600/-',
            '6%',
            'Rs. 19,31,136/-',
            'Rs. 3,02,54,464/-',
          ],
        ];

    if (bldgRows.length === 1 && sumNet === 0) {
      sumRepl = 32185600;
      sumLessDep = 1931136;
      sumNet = 30254464;
    }

    const amenitiesVal = parseFloat(this.getF('amenitiesValue', '0')) || 0;
    const grandBldgVal = this.fields.totalBuildingValue ?? (sumNet + amenitiesVal);

    bldgRows.push([
      'Total Building Net Depreciated Value (A)',
      '',
      '',
      `Rs. ${formatIndianCurrency(sumRepl)}/-`,
      '',
      `Rs. ${formatIndianCurrency(sumLessDep)}/-`,
      `Rs. ${formatIndianCurrency(sumNet)}/-`,
    ]);

    if (amenitiesVal > 0) {
      bldgRows.push([
        'Amenities & Extra Features Value (B)',
        '',
        '',
        '',
        '',
        '',
        `Rs. ${formatIndianCurrency(amenitiesVal)}/-`,
      ]);
    }

    const bldgColW = [
      CONTENT_W * 0.36,
      CONTENT_W * 0.09,
      CONTENT_W * 0.09,
      CONTENT_W * 0.14,
      CONTENT_W * 0.06,
      CONTENT_W * 0.12,
      CONTENT_W * 0.14,
    ];

    this.drawTable(
      bldgHeaders,
      bldgRows,
      bldgColW,
      [],
      [],
      [0],
      [],
      [{ r: bldgRows.length - 1, c: 0 }, { r: bldgRows.length - 1, c: 6 }]
    );

    // Overall Property Grand Totals
    const totPropVal = this.fields.totalPropertyValue ?? (landVal + grandBldgVal);
    const totWords = this.fields.totalPropertyValueWords || rupeesInWords(totPropVal);
    const distressPct = parseFloat(this.getF('distressSalePct', '80')) || 80;
    const distressVal = this.fields.distressSaleValue ?? Math.round(totPropVal * (distressPct / 100));

    this.advanceCursor(2);
    this.drawKeyValueRow([
      {
        label: 'Total Value of the Property (Land + Building):',
        value: `Rs. ${formatIndianCurrency(totPropVal)}/-`,
        labelWidth: 260,
        valueWidth: CONTENT_W - 260,
        labelBold: true,
        bold: true,
        highlight: true,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Total Property Value in Words:',
        value: totWords,
        labelWidth: 190,
        valueWidth: CONTENT_W - 190,
        labelBold: true,
        bold: true,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: `Distressed Sale Value (${distressPct}%):`,
        value: `Rs. ${formatIndianCurrency(distressVal)}/-`,
        labelWidth: 260,
        valueWidth: CONTENT_W - 260,
        labelBold: true,
        bold: true,
      },
    ]);
    this.draw4Col(
      'Govt. Guideline Rate',
      `Rs. ${this.getF('guidelineRate', '28')} / SqFt`,
      'Govt. Guideline Land Value',
      `Rs. ${formatIndianCurrency(this.getF('guidelineLandValue', '1219680'))}/-`,
      true,
      true
    );

    // Floorwise Usage Table
    this.drawSectionHeader('FLOORWISE DETAILS OF USAGE & RENTAL ASSESSMENT');
    const uHeaders = ['Floor', 'Usage', 'Units', 'Value / Type', 'Current Tenancy', 'Rental Assessment'];
    const uRowsData = (this.fields.floorwiseUsageRows && this.fields.floorwiseUsageRows.length > 0)
      ? this.fields.floorwiseUsageRows.map(r => [
          r.floor || '',
          r.usage || '',
          r.units || '1',
          r.value || 'Commercial',
          r.currentTenancy || 'Self Occupied',
          r.rentalAssessment || 'NA',
        ])
      : [
          ['Ground Floor', 'Class Room & Office', '1', 'Commercial', 'Self Occupied', 'NA'],
          ['First Floor', 'Class Room', '1', 'Commercial', 'Self Occupied', 'NA'],
          ['Second Floor', 'Class Room', '1', 'Commercial', 'Self Occupied', 'NA'],
          ['Third Floor', 'Class Room', '1', 'Commercial', 'Self Occupied', 'NA'],
        ];
    const uColW = [
      CONTENT_W * 0.16,
      CONTENT_W * 0.22,
      CONTENT_W * 0.08,
      CONTENT_W * 0.16,
      CONTENT_W * 0.20,
      CONTENT_W * 0.18,
    ];
    this.drawTable(uHeaders, uRowsData, uColW, [], [0]);

    this.draw4Col(
      'Stage of Construction',
      this.getF('constructionProgressPct', '100%'),
      'Disbursement Recommended',
      this.getF('constructionRecommendedPct', '100%'),
      true,
      true
    );
    this.draw4Col(
      'Risk of Demolition',
      this.getF('demolitionRisk', 'Low'),
      'Natural Disaster Risk',
      this.getF('naturalDisasterRisk', 'Low')
    );

    // REMARKS
    this.drawSectionHeader('REMARKS & VALUATION CERTIFICATE');
    const remarksText = this.getF(
      'remarks',
      'Subject property is an institutional premise having land extent of 43560 sqft & total measured built up area of 22525 sqft. Approved building plan not provided & age of the building is about 06-years & surrounding areas are residential cum commercial in nature. Property is coming under Kuradhamal GP limit. The building is used by the customer for institutional purpose named as Naidu +2 Science College. Valuation has been done for land & measured built up area of the RCC building only. Asbestos roofing BUA value is not considered as it is temporary in nature. As approved plan is not provided, it is upto the sole discretion of protium finance to consider the BUA value or not.'
    );
    this.drawWrappedTextAt(remarksText, MARGIN_L, this.cursorY, CONTENT_W, {
      align: 'justify',
    });
    this.advanceCursor(20);

    // Signatory
    this.checkPageBreak(50);
    this.drawKeyValueRow([
      {
        label: 'M/S. S MOHANTY ASSOCIATES (Empanelled Valuer)',
        value: '(Authorized Signatory)',
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
        labelBold: true,
        bold: true,
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // ATTACHMENTS: MAPS, DOCUMENTS, PHOTOGRAPHS
    // ══════════════════════════════════════════════════════════════
    const lat = this.getF('latitude');
    const lng = this.getF('longitude');
    const mapTitle = (lat && lng)
      ? `LOCATION MAP:- (LATITUDE- ${lat}, LONGITUDE- ${lng})`
      : 'LOCATION MAP';

    const maps = this.fields.locationMaps || [];
    if (maps && maps.length > 0) {
      await this.drawMapGallery(maps, mapTitle);
    }

    const docs = this.fields.propertyDocuments || [];
    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }

    const photos = this.fields.propertyPhotos || [];
    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PROPERTY SITE PHOTOGRAPHS');
    }
  }
}
