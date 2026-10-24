import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  LINE_HEIGHT,
} from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';

export interface AyeBoundaryRow {
  direction: string;
  asPerSaleDeed: string;
  asPerSketchMap: string;
  asPerActualSite: string;
}

export interface AyeAreaRow {
  floor: string;
  measuredCarpetArea: string;
  buaAsPerDocuments: string;
  carpetAreaAsPerPlan: string;
}

export interface AyeFinanceFields {
  // Top Reference & Header
  refNo?: string;
  dateOfSiteVisit?: string;
  dateOfReport?: string;
  purposeOfValuation?: string;
  ascCode?: string;
  valuerName?: string;

  // I. General Details
  applicationNo?: string;
  valuationRequestedByBranch?: string;
  typeOfLoan?: string;
  nameOfCustomer?: string;
  propertyAddressFiring?: string;
  propertyAddressLegal?: string;
  propertyAddressSite?: string;
  nameAsPerBoardPlate?: string;
  nameOfPropertyOwner?: string;
  approvalAuthorityDetails?: string;
  contactPersonDetails?: string;
  briefDescriptionOfProperty?: string;
  nearbyLandmark?: string;
  classificationOfLocality?: string;
  natureOfLocality?: string;
  anyNegativeToLocality?: string;

  proximityCivicAmenities?: string;
  nearestRailwayStation?: string;
  nearestBusStop?: string;
  nearestHospital?: string;
  distanceFromCityCenter?: string;
  modeOfTransportAccessibility?: string;
  landTenure?: string;
  approvedPlanDetails?: string;

  // Boundaries
  boundaries?: AyeBoundaryRow[];
  boundariesMatching?: string;
  propertyFallsInMcdList?: string;
  propertyEasilyIdentifiable?: string;
  identifiedOnOurOwn?: string;
  propertyDemarcated?: string;
  hasElectricWaterDrainage?: string;
  accessRoadWidth?: string;

  // II. Details of Structure and Specifications
  typeOfConstruction?: string;
  yearOfConstruction?: string;
  ageOfProperty?: string;
  estimatedFutureLife?: string;
  presentConditionOfBuilding?: string;
  noOfFloors?: string;
  permittedUseOfProperty?: string;
  onSiteActualUse?: string;
  stageOfConstruction?: string;
  noOfUnitsPerFloor?: string;
  accommodationDetails?: string;

  // Setback details
  setbackFrontByeLaws?: string;
  setbackLhsByeLaws?: string;
  setbackRhsByeLaws?: string;
  setbackRearByeLaws?: string;
  setbackFrontActual?: string;
  setbackLhsActual?: string;
  setbackRhsActual?: string;
  setbackRearActual?: string;

  // III. Details of Property Under Reference
  unitConfiguration?: string;
  typeOfRoofing?: string;
  typeOfFlooring?: string;
  doorsWindows?: string;
  kitchenPlatformSink?: string;
  plumbingType?: string;
  electricalInstallation?: string;
  anyOtherAmenities?: string;

  areaRows?: AyeAreaRow[];
  finalCarpetAreaConsidered?: string;
  consideredBuaSbua?: string;
  structureConfirmingToByeLaws?: string;

  deviationFromByeLaws?: string;
  deviationCriticalNonCritical?: string;
  riskOfDemolition?: string;
  mixedUseDetails?: string;
  propertyCurrentlyOccupiedBy?: string;
  occupiedSinceWhen?: string;
  structureConcernsEarthquake?: string;
  estimateGivenByCustomer?: string;
  estimateValidOrNot?: string;

  // IV. Valuation of the Property
  // A. Land + Building
  landAreaSqft?: string;
  landRatePerSqft?: string;
  landValueTotal?: string;
  consideredBuaGf?: string;
  rateConstructionBuilding?: string;
  depreciationRatePastAge?: string;
  lessImmediateRepairs?: string;
  constructionValueBuilding?: string;
  presentMarketValueCombined?: string;
  marketValue100Percent?: string;

  // B. For Apartment / Flat
  apartmentConsideredArea?: string;
  apartmentMarketRate?: string;
  apartmentFairMarketValue?: string;
  apartmentPresentWorkStageValue?: string;

  // C. Related Values
  governmentCircleValue?: string;
  insuranceValue?: string;
  forcedSaleValue?: string;
  conservativeValue?: string;

  // V. Marketability
  marketabilitySale?: string;
  marketabilityLease?: string;
  marketabilityVolatility?: string;

  // VI. Documents Submitted
  documentsSubmitted?: string[];

  // VII. Remarks & Observations
  remarks?: string;
  valuationNote?: string;

  // VIII. Declaration
  inspectingEngineerName?: string;
  inspectionDateDeclaration?: string;
  declarationDate?: string;
  declarationPlace?: string;

  // Attachments
  latitude?: string;
  longitude?: string;
  locationMaps?: any[];
  propertyDocuments?: any[];
  propertyPhotos?: any[];
  projectCode?: string;
}

export class PDFAyeFinanceRenderer extends PDFBankRenderer {
  private f: AyeFinanceFields;

  constructor(fields: AyeFinanceFields) {
    super();
    this.f = fields || {};
  }

  private getF(key: keyof AyeFinanceFields, fallback: string = '-'): string {
    const val = this.f[key];
    if (val === undefined || val === null || String(val).trim() === '') {
      return fallback;
    }
    return String(val).trim();
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

  private draw2Col(label: string, value: string, boldVal: boolean = false, labelW = 180) {
    this.drawKeyValueRow([
      {
        label,
        value: value || '-',
        labelWidth: labelW,
        valueWidth: CONTENT_W - labelW,
        labelBold: true,
        bold: boldVal,
      },
    ]);
  }

  private draw4Col(l1: string, v1: string, l2: string, v2: string, bold2: boolean = false, lw = 120) {
    const halfW = CONTENT_W / 2;
    const valW = halfW - lw;
    this.drawKeyValueRow([
      { label: l1, value: v1 || '-', labelWidth: lw, valueWidth: valW, labelBold: true },
      { label: l2, value: v2 || '-', labelWidth: lw, valueWidth: valW, labelBold: true, bold: bold2 },
    ]);
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    // ══════════════════════════════════════════════════════════════
    // PAGE 1: HEADER & SECTION I (GENERAL DETAILS)
    // ══════════════════════════════════════════════════════════════

    // Top Title & Subtitle Banner
    this.drawSectionHeader('TECHNICAL REPORT', false);
    this.drawSectionHeader('AYE [आय] AYE FINANCE PVT. LTD.', false);

    // ASC & Valuer Info Row
    const valuer = this.getF('valuerName', 'M/S. S MOHANTY ASSOCIATES');
    const asc = this.getF('ascCode', 'ASC -');
    this.drawKeyValueRow([
      { label: 'VALUER NAME', value: valuer, labelWidth: 100, valueWidth: 220, labelBold: true, bold: true },
      { label: 'ASC CODE', value: asc, labelWidth: 80, valueWidth: CONTENT_W - 400, labelBold: true },
    ]);

    // Ref No, Site Visit Date, Report Date
    const refNo = this.getF('refNo', 'AYE/03-26/05');
    const visitDate = this.getF('dateOfSiteVisit', '24/03/2026');
    const repDate = this.getF('dateOfReport', '24/03/2026');

    const colW3 = CONTENT_W / 3;
    this.drawKeyValueRow([
      { label: 'REF. NO.', value: refNo, labelWidth: 70, valueWidth: colW3 - 70, labelBold: true, bold: true },
      { label: 'DATE OF VISIT', value: visitDate, labelWidth: 90, valueWidth: colW3 - 90, labelBold: true },
      { label: 'DATE OF REPORT', value: repDate, labelWidth: 95, valueWidth: colW3 - 95, labelBold: true },
    ]);

    // Purpose of Valuation
    this.draw2Col(
      'PURPOSE OF VALUATION',
      this.getF('purposeOfValuation', 'To Assess Fair Market Value for collateral security'),
      true,
      160
    );

    // SECTION I: GENERAL DETAILS
    this.drawSectionHeader('I. GENERAL DETAILS :', true);
    this.draw2Col('1. APPLICATION NO.', this.getF('applicationNo', 'AYE-000003491226-LOS'), true, 200);
    this.draw4Col(
      '2. VALUATION REQUESTED BY BRANCH',
      this.getF('valuationRequestedByBranch', 'SAMBALPUR 6021'),
      '3. TYPE OF LOAN',
      this.getF('typeOfLoan', 'ML GOLD PLUS FRESH'),
      false,
      160
    );
    this.draw2Col(
      '4. NAME OF THE CUSTOMER / APPLICANT',
      this.getF('nameOfCustomer', 'BHUBANESWAR KANTA'),
      true,
      200
    );

    // Property Address Variants
    this.draw2Col(
      '5.A. PROPERTY ADDRESS AS PER INITIATION / FIRING',
      this.getF('propertyAddressFiring'),
      false,
      200
    );
    this.draw2Col(
      '5.B. PROPERTY ADDRESS AS PER LEGAL DOCUMENTS',
      this.getF('propertyAddressLegal'),
      false,
      200
    );
    this.draw2Col(
      '5.C. PROPERTY ADDRESS AS PER SITE VISIT',
      this.getF('propertyAddressSite'),
      false,
      200
    );

    this.draw2Col('6. NAME AS PER SOCIETY BOARD & NAME PLATE', this.getF('nameAsPerBoardPlate', 'NA'), false, 200);
    this.draw2Col(
      '7. NAME OF PROPERTY OWNER / HOLDER (AS PER TITLE DOCUMENTS)',
      this.getF('nameOfPropertyOwner', 'Bhubaneswar Kanta, S/O- Rama Chandra Kanta'),
      true,
      200
    );
    this.draw2Col(
      '8. APPROVAL AUTHORITY DETAILS (GP/ZP/MUNICIPALITY)',
      this.getF('approvalAuthorityDetails', 'Within Sambalpur Municipality Limit'),
      false,
      200
    );
    this.draw2Col('9. CONTACT PERSON DETAILS', this.getF('contactPersonDetails', 'BHUBANESWAR KANTA, Mob No- 9337838276'), false, 200);
    this.draw4Col('10. BRIEF DESCRIPTION OF PROPERTY', this.getF('briefDescriptionOfProperty', 'NA'), '11. NEARBY LANDMARK', this.getF('nearbyLandmark', 'Near Gopalji Temple, Naksapali'), false, 150);
    this.draw4Col(
      '12. CLASSIFICATION OF LOCALITY',
      this.getF('classificationOfLocality', 'Middle Class'),
      '13. NATURE / DEVELOPMENT (%)',
      this.getF('natureOfLocality', '50% Developing Locality'),
      false,
      150
    );
    this.draw2Col(
      '14. ANY NEGATIVE TO LOCALITY (Slums, Hazards, HT Line, etc.)',
      this.getF('anyNegativeToLocality', 'NA'),
      false,
      200
    );

    // ══════════════════════════════════════════════════════════════
    // PAGE 2: GENERAL DETAILS (CONTD) & STRUCTURE DETAILS
    // ══════════════════════════════════════════════════════════════
    this.addNewPage();
    this.drawSectionHeader('I. GENERAL DETAILS (CONTD.)', false);

    this.draw2Col('15. PROXIMITY TO CIVIC AMENITIES', this.getF('proximityCivicAmenities', 'Yes'), true, 200);
    this.draw2Col('   A. NEAREST RAILWAY STATION', this.getF('nearestRailwayStation', '4-Kms from Maneswar Railway Station'), false, 200);
    this.draw2Col('   B. NEAREST BUS STOP', this.getF('nearestBusStop', '500-Mtrs from Naksapali Bus Stop'), false, 200);
    this.draw2Col('   C. NEAREST HOSPITAL', this.getF('nearestHospital', '3-Kms from Dhanupali Govt. Hospital'), false, 200);
    this.draw4Col('16. DISTANCE FROM CITY CENTER', this.getF('distanceFromCityCenter', '8-Kms from Sambalpur city centre'), '17. MODE OF TRANSPORT', this.getF('modeOfTransportAccessibility', '1-2 Kms'), false, 150);
    this.draw4Col('18. LAND TENURE', this.getF('landTenure', 'Freehold'), '19. APPROVED PLAN & OC DETAILS', this.getF('approvedPlanDetails', 'Plan not provided'), false, 150);

    // 20. Boundaries Details Table
    this.drawSectionHeader('20. BOUNDARIES DETAILS', true);
    const bHeaders = ['DIRECTION', 'AS PER SALE DEED', 'AS PER SKETCH MAP', 'AS PER ACTUAL SITE'];
    const defaultBoundaries: AyeBoundaryRow[] = [
      { direction: 'East', asPerSaleDeed: 'Plot No- 1892', asPerSketchMap: 'Plot no- 1796 Road', asPerActualSite: '20-ft wide Road' },
      { direction: 'West', asPerSaleDeed: 'Plot No- 1882', asPerSketchMap: 'Plot No- 1892/4552', asPerActualSite: 'Vacant Land' },
      { direction: 'North', asPerSaleDeed: 'Plot No- 1895', asPerSketchMap: 'Plot No- 1893 & 1894', asPerActualSite: 'Land of Binod Suhula' },
      { direction: 'South', asPerSaleDeed: 'Plot No- 1891', asPerSketchMap: 'Plot No- 1891', asPerActualSite: 'Building of Sachin Bag' },
    ];
    const bData = this.f.boundaries && this.f.boundaries.length > 0 ? this.f.boundaries : defaultBoundaries;
    const bRows = bData.map(b => [b.direction, b.asPerSaleDeed, b.asPerSketchMap, b.asPerActualSite]);
    const bColW = [CONTENT_W * 0.16, CONTENT_W * 0.28, CONTENT_W * 0.28, CONTENT_W * 0.28];
    this.drawTable(bHeaders, bRows, bColW, [], [0]);

    this.draw2Col(
      'ARE BOUNDARIES MATCHING (YES/NO)',
      this.getF('boundariesMatching', 'Yes (Boundary is matching as per sketch map)'),
      true,
      200
    );

    this.draw4Col('21. FALLS IN MCD UNAUTHORIZED LIST', this.getF('propertyFallsInMcdList', 'NA'), '22. EASILY IDENTIFIABLE', this.getF('propertyEasilyIdentifiable', 'Yes (Identify by sketch map)'), false, 160);
    this.draw4Col('23. IDENTIFIED ON OUR OWN', this.getF('identifiedOnOurOwn', 'Identified by the customer'), '24. PROPERTY IS DEMARCATED', this.getF('propertyDemarcated', 'No'), false, 160);
    this.draw4Col('25. ELECTRIC / WATER / DRAINAGE', this.getF('hasElectricWaterDrainage', 'Yes'), '26. ACCESS ROAD WIDTH', this.getF('accessRoadWidth', '20-feet wide Road'), false, 160);

    // SECTION II: DETAILS OF STRUCTURE AND SPECIFICATIONS (START)
    this.drawSectionHeader('II. DETAILS OF STRUCTURE AND SPECIFICATIONS :', true);
    this.draw4Col('1. TYPE OF CONSTRUCTION', this.getF('typeOfConstruction', 'RCC Frame'), '2. YEAR OF CONSTRUCTION', this.getF('yearOfConstruction', '2017'), false, 150);
    this.draw4Col('3. AGE OF THE PROPERTY', this.getF('ageOfProperty', '9-Years'), '4. ESTIMATED FUTURE LIFE', this.getF('estimatedFutureLife', '51-Years'), false, 150);

    // ══════════════════════════════════════════════════════════════
    // PAGE 3: STRUCTURE DETAILS (CONTD) & PROPERTY UNDER REFERENCE
    // ══════════════════════════════════════════════════════════════
    this.addNewPage();
    this.drawSectionHeader('II. DETAILS OF STRUCTURE AND SPECIFICATIONS (CONTD.)', false);

    this.draw4Col('5. PRESENT CONDITION OF BUILDING', this.getF('presentConditionOfBuilding', 'Good'), '6. NO. OF FLOORS', this.getF('noOfFloors', '1 (GF)'), false, 160);
    this.draw4Col('7. PERMITTED USE AS PER PLAN', this.getF('permittedUseOfProperty', 'Plan not provided'), '8. ON SITE ACTUAL USE', this.getF('onSiteActualUse', 'Residential'), false, 160);
    this.draw4Col('9. STAGE OF CONSTRUCTION (%)', this.getF('stageOfConstruction', '100%'), '10. NO. OF UNITS PER FLOOR', this.getF('noOfUnitsPerFloor', 'NA'), false, 160);
    this.draw2Col('11. ACCOMMODATION DETAILS (FLOOR-WISE)', this.getF('accommodationDetails', 'NA'), false, 200);

    // 12. Setback Details Table
    this.drawSectionHeader('12. SETBACK DETAILS (IN FT.)', true);
    const sbHeaders = ['DETAILS', 'FRONT', 'LHS', 'RHS', 'REAR'];
    const sbRows = [
      [
        'AS PER BYE LAWS',
        this.getF('setbackFrontByeLaws', 'NA'),
        this.getF('setbackLhsByeLaws', 'NA'),
        this.getF('setbackRhsByeLaws', 'NA'),
        this.getF('setbackRearByeLaws', 'NA'),
      ],
      [
        'ON SITE / ACTUAL',
        this.getF('setbackFrontActual', 'NA'),
        this.getF('setbackLhsActual', 'NA'),
        this.getF('setbackRhsActual', 'NA'),
        this.getF('setbackRearActual', 'NA'),
      ],
    ];
    const sbColW = [CONTENT_W * 0.32, CONTENT_W * 0.17, CONTENT_W * 0.17, CONTENT_W * 0.17, CONTENT_W * 0.17];
    this.drawTable(sbHeaders, sbRows, sbColW, [], [0]);

    // SECTION III: DETAILS OF PROPERTY UNDER REFERENCE
    this.drawSectionHeader('III. DETAILS OF THE PROPERTY UNDER REFERENCE :', true);
    this.draw4Col('1. UNIT CONFIGURATION', this.getF('unitConfiguration', 'NA'), '2. TYPE OF ROOFING', this.getF('typeOfRoofing', 'RCC'), false, 150);
    this.draw4Col('3. TYPE OF FLOORING', this.getF('typeOfFlooring', 'As Flooring'), '4. DOORS & WINDOWS', this.getF('doorsWindows', 'Hard wood door'), false, 150);
    this.draw4Col('5. KITCHEN PLATFORM & SINK', this.getF('kitchenPlatformSink', 'AS Platform & Stile sink'), '6. PLUMBING', this.getF('plumbingType', 'Concealed'), false, 150);
    this.draw4Col('7. ELECTRICAL INSTALLATION', this.getF('electricalInstallation', 'Concealed'), '8. ANY OTHER AMENITIES', this.getF('anyOtherAmenities', 'NA'), false, 150);

    // 9. Area of Property Table
    this.drawSectionHeader('9. AREA OF PROPERTY (PERMITTED AS PER APPROVED PLAN / BYELAWS)', true);
    const aHeaders = [
      'FLOOR',
      'MEASURED CARPET AREA (SQFT)',
      'BUA AS PER DOCUMENTS (SQFT)',
      'CARPET AREA AS PER PLAN / BYE LAWS',
    ];
    const defaultAreaRows: AyeAreaRow[] = [
      { floor: 'Ground', measuredCarpetArea: '357 sqft', buaAsPerDocuments: '420 sqft', carpetAreaAsPerPlan: 'NA' },
      { floor: 'First', measuredCarpetArea: 'NA', buaAsPerDocuments: 'NA', carpetAreaAsPerPlan: 'NA' },
      { floor: 'Second', measuredCarpetArea: 'NA', buaAsPerDocuments: 'NA', carpetAreaAsPerPlan: 'NA' },
      { floor: 'Total', measuredCarpetArea: '357 sqft', buaAsPerDocuments: '420 sqft', carpetAreaAsPerPlan: 'NA' },
    ];
    const aData = this.f.areaRows && this.f.areaRows.length > 0 ? this.f.areaRows : defaultAreaRows;
    const aRows = aData.map(r => [r.floor, r.measuredCarpetArea, r.buaAsPerDocuments, r.carpetAreaAsPerPlan]);
    const aColW = [CONTENT_W * 0.22, CONTENT_W * 0.26, CONTENT_W * 0.26, CONTENT_W * 0.26];
    this.drawTable(aHeaders, aRows, aColW, [aRows.length - 1], [0]);

    this.draw4Col('10. FINAL CARPET AREA FOR VALUATION', this.getF('finalCarpetAreaConsidered', '357 sqft'), '10.A. CONSIDERED BUA / SBUA', this.getF('consideredBuaSbua', '420 sqft'), true, 160);
    this.draw2Col('11. IF PLANS NOT AVAILABLE, CONFIRMING TO LOCAL BYELAWS', this.getF('structureConfirmingToByeLaws', 'Local bye laws'), false, 240);

    // ══════════════════════════════════════════════════════════════
    // PAGE 4: PROPERTY DETAILS (CONTD) & SECTION IV (VALUATION)
    // ══════════════════════════════════════════════════════════════
    this.addNewPage();
    this.drawSectionHeader('III. PROPERTY DETAILS (CONTD.)', false);

    this.draw4Col('12. DEVIATION FROM BYELAWS', this.getF('deviationFromByeLaws', 'NA'), '13. DEVIATION CRITICAL / NON-CRITICAL', this.getF('deviationCriticalNonCritical', 'NA'), false, 150);
    this.draw4Col('14. RISK OF DEMOLITION', this.getF('riskOfDemolition', 'Low'), '15. MIXED USE DETAILS', this.getF('mixedUseDetails', 'Residential'), true, 150);
    this.draw4Col('16. OCCUPIED BY', this.getF('propertyCurrentlyOccupiedBy', 'Self'), '17. OCCUPIED SINCE WHEN', this.getF('occupiedSinceWhen', 'Yes'), false, 150);
    this.draw4Col('18. STRUCTURE CONCERNS (EARTHQUAKE)', this.getF('structureConcernsEarthquake', 'NA'), '19. ESTIMATE GIVEN BY CUSTOMER', this.getF('estimateGivenByCustomer', 'NA'), false, 150);
    this.draw2Col('20. IS THE ESTIMATE GIVEN VALID OR NOT', this.getF('estimateValidOrNot', 'NA'), false, 200);

    // SECTION IV: VALUATION OF THE PROPERTY
    this.drawSectionHeader('IV. VALUATION OF THE PROPERTY :', true);
    this.drawSectionHeader('A. FOR LAND + BUILDING (ROW HOUSES / BUNGALOW / VILLA) :', true);

    this.draw2Col('1. LAND AREA / PLOT AREA (SQ.FT.)', this.getF('landAreaSqft', '3049 sqft'), false, 240);
    this.draw2Col('2. LAND RATE ADOPTED FOR VALUATION (PER SQ.FT.)', this.getF('landRatePerSqft', 'Rs. 600/-'), false, 240);
    this.draw2Col('3. LAND VALUE (1 * 2)', this.getF('landValueTotal', 'Rs. 18,29,400/-'), true, 240);
    this.draw2Col('4. CONSIDERED BUA (SQ.FT.) (GF)', this.getF('consideredBuaGf', '420 sqft'), false, 240);
    this.draw2Col('5. RATE FOR CONSTRUCTION OF BUILDING', this.getF('rateConstructionBuilding', 'Rs. 1600/-'), false, 240);
    this.draw2Col('6. LESS: DEPRECIATION FOR PAST AGE @ 1.0% P.A (9%)', this.getF('depreciationRatePastAge', 'Rs. 1440/- (Net Rate)'), false, 240);
    this.draw2Col('R. LESS: IMMEDIATE REPAIRS / PAINTING / STRUCTURAL', this.getF('lessImmediateRepairs', 'NA'), false, 240);
    this.draw2Col('8. CONSTRUCTION VALUE OF BUILDING', this.getF('constructionValueBuilding', 'Rs. 6,04,800/-'), true, 240);
    this.draw2Col(
      '9. PRESENT MARKET VALUE OF BUILDING / HOUSE (3 + 8)',
      this.getF('presentMarketValueCombined', 'Rs. 18,29,400/- + Rs. 6,04,800/- = Rs. 24,34,200/-'),
      true,
      240
    );
    this.draw2Col(
      '10. MARKET VALUE OF PROPERTY AFTER 100% COMPLETION',
      this.getF('marketValue100Percent', 'Rs. 24,34,200/-'),
      true,
      240
    );

    // B. For Apartment / Flat
    this.drawSectionHeader('B. FOR APARTMENT / FLAT / READY PROPERTIES :', true);
    this.draw4Col('1. CONSIDERED AREA (CARPET/BUA/SBUA)', this.getF('apartmentConsideredArea', 'NA'), '2. MARKET RATE INCL. DEPRECIATION', this.getF('apartmentMarketRate', 'NA'), false, 150);
    this.draw4Col('3. FAIR MARKET VALUE (1 * 2)', this.getF('apartmentFairMarketValue', 'NA'), '4. PRESENT VALUE W.R.T STAGE', this.getF('apartmentPresentWorkStageValue', 'NA'), false, 150);

    // C. Related Values
    this.drawSectionHeader('C. RELATED VALUES :', true);
    this.draw2Col('1. GOVERNMENT VALUE / CIRCLE VALUE', this.getF('governmentCircleValue', 'Rs. 528/- per sqft'), true, 240);

    // ══════════════════════════════════════════════════════════════
    // PAGE 5: VALUES (CONTD), MARKETABILITY, DOCS, REMARKS, DECLARATION
    // ══════════════════════════════════════════════════════════════
    this.addNewPage();
    this.drawSectionHeader('IV. VALUATION SUMMARY & BENCHMARKS (CONTD.)', false);

    this.draw2Col('2. INSURANCE VALUE', this.getF('insuranceValue', 'NA'), false, 240);
    this.draw2Col('3. FORCED SALE VALUE (80% OF FMV)', this.getF('forcedSaleValue', 'Rs. 19,47,360/-'), true, 240);
    this.draw2Col('4. CONSERVATIVE VALUE (90% OF FMV)', this.getF('conservativeValue', 'Rs. 21,90,780/-'), true, 240);

    // SECTION V: MARKETABILITY
    this.drawSectionHeader('V. MARKETABILITY :', true);
    const mHeaders = ['PARAMETER', 'RATING', 'MIN', 'MAX'];
    const mRows = [
      ['1. FOR SALE', this.getF('marketabilitySale', 'Average'), '---', '---'],
      ['2. FOR LEASE - ESTIMATED RENTAL INCOME', this.getF('marketabilityLease', 'Average'), '---', '---'],
      ['3. VOLATILITY OF PROPERTY PRICES', this.getF('marketabilityVolatility', 'Medium'), '---', '---'],
    ];
    const mColW = [CONTENT_W * 0.46, CONTENT_W * 0.20, CONTENT_W * 0.17, CONTENT_W * 0.17];
    this.drawTable(mHeaders, mRows, mColW, [], [0]);

    // SECTION VI: DOCUMENTS SUBMITTED
    this.drawSectionHeader('VI. PROPERTY DOCUMENTS SUBMITTED IN DETAILS :', true);
    const defaultDocsList = ['1. Sale deed', '2. ROR', '3. Sketch map'];
    const docsList = this.f.documentsSubmitted && this.f.documentsSubmitted.length > 0
      ? this.f.documentsSubmitted
      : defaultDocsList;
    for (const d of docsList) {
      this.drawWrappedTextAt(d, MARGIN_L + 10, this.cursorY, CONTENT_W - 20);
      this.advanceCursor(14);
    }

    // SECTION VII: REMARKS
    this.drawSectionHeader('VII. REMARKS & OBSERVATIONS :', true);
    const defaultRemarks =
      'Subject property is a single storied residential building, having land extent of 3049sqft, having measured BUA 420sqft. Approved plan is not provided. Property is located in developing area of Naksapali mouza & approaches 20-feet wide road. It is coming under Sambalpur municipality limit & surrounding areas are residential in nature. This building is occupied by the customer for residential purpose. Valuation has been done for land & measured BUA of GF only.';
    const remText = this.getF('remarks', defaultRemarks);
    this.drawWrappedTextAt(remText, MARGIN_L, this.cursorY, CONTENT_W, { align: 'justify' });
    this.advanceCursor(20);

    const defaultNote =
      'Note:- There is no provision for road in sale deed boundary & sketch map. The land is not converted to homestead & the present nature is Agri. Customer has submitted property sketch map for the identification & access road. Report is released basing upon the sketch map & the internal policy of Aye Finance.';
    const noteText = this.getF('valuationNote', defaultNote);
    this.drawWrappedTextAt(noteText, MARGIN_L, this.cursorY, CONTENT_W, { align: 'justify', bold: true });
    this.advanceCursor(22);

    // SECTION VIII: DECLARATION
    this.drawSectionHeader('VIII. DECLARATION :', true);
    const engName = this.getF('inspectingEngineerName', 'Mr. Subhransu Sekhar Sa');
    const inspDate = this.getF('inspectionDateDeclaration', visitDate);

    const declarationPoints = [
      `1. The property was inspected by ${engName} on dated ${inspDate}.`,
      '2. I/We have no direct/indirect interest in the property value.',
      '3. The information furnished above is true and correct to my/our knowledge.',
      '4. The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same.',
      '5. The fair market value of such properties / localities may increase or decrease, depending on the future market conditions and scenarios.',
      '6. This report does not certify or confirm any ownership or title of the property that has been valued.',
    ];
    for (const pt of declarationPoints) {
      this.drawWrappedTextAt(pt, MARGIN_L, this.cursorY, CONTENT_W, { align: 'justify' });
      this.advanceCursor(13);
    }

    this.advanceCursor(10);
    this.checkPageBreak(50);
    const decDate = this.getF('declarationDate', repDate);
    const decPlace = this.getF('declarationPlace', 'Bhubaneswar');

    this.drawKeyValueRow([
      {
        label: `DATE: ${decDate}\nPLACE: ${decPlace}`,
        value: `FOR ${valuer}\n\n(AUTHORISED SIGNATORY)`,
        labelWidth: 260,
        valueWidth: CONTENT_W - 260,
        labelBold: true,
        bold: true,
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // ATTACHMENTS: MAPS, DOCUMENTS, PHOTOGRAPHS
    // ══════════════════════════════════════════════════════════════
    const lat = this.getF('latitude');
    const lng = this.getF('longitude');
    const mapTitle = lat && lng ? `LOCATION MAP:- (LATITUDE- ${lat}, LONGITUDE- ${lng})` : 'LOCATION MAP';

    const maps = this.f.locationMaps || [];
    const docs = this.f.propertyDocuments || [];
    const photos = this.f.propertyPhotos || [];

    if (maps.length > 0 || docs.length > 0 || photos.length > 0) {
      this.addNewPage();
    }

    if (maps && maps.length > 0) {
      await this.drawMapGallery(maps, mapTitle);
    }

    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }

    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PROPERTY SITE PHOTOGRAPHS');
    }

    return await this.save();
  }
}
