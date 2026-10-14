import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFYesBankRenderer extends PDFBankRenderer {
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
   * Section Header row with solid banner
   */
  private drawYesSectionHeader(title: string) {
    this.drawSectionHeader(title);
  }

  async drawContent(): Promise<void> {
    this.addPage();

    // Top Header Banner
    this.drawCenteredTitle('VALUATION REPORT', 14, true);
    this.advanceCursor(2);
    this.drawKeyValueRow([
      {
        label: 'On the request of the Manager of YES Bank Limited, subject property was inspected to assess its value and the details are as furnished below: -',
        value: '',
        labelWidth: CONTENT_W,
        valueWidth: 0,
      },
    ]);
    this.advanceCursor(4);

    // ==========================================
    // TOP META TABLE
    // ==========================================
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: 'Branch Name', value: this.getF('branchName', 'Bhubaneswar'), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Type of case', value: this.getF('typeOfCase', 'NA'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: "Valuer's Name", value: this.getF('valuerName', 'M/s. S Mohanty Associates'), labelWidth: 100, valueWidth: halfW - 100, labelBold: true },
      { label: 'Date of visit', value: this.getF('dateOfVisit', '18/06/2026'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Visiting Engg Name', value: this.getF('visitingEnggName', 'Mr. Biswa Ranjan Biswal'), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Time of visit', value: this.getF('timeOfVisit', '07.55AM'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Case Ref. No', value: this.getF('caseRefNo', this.projectCode || 'R260610/269'), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Date of report', value: this.getF('reportDate', '18/06/2026'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Person contacted for property inspection with contact details',
        value: this.getF('contactPerson', 'Farzana Kashmi, Mob-8338944892'),
        labelWidth: 180,
        valueWidth: CONTENT_W - 180,
      },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // 1. BASIC DETAILS
    // ==========================================
    this.drawYesSectionHeader('1. Basic Details');

    this.drawKeyValueRow([
      { label: 'Applicants Name', value: this.getF('applicantName', 'M/S.Saimah Enterprises'), labelWidth: 100, valueWidth: halfW - 100, labelBold: true },
      { label: 'Name of Owners', value: this.getF('ownerName', 'Farzana Kashmi'), labelWidth: 100, valueWidth: halfW - 100, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Type of property', value: this.getF('propertyTypeDesc', 'G+2 storied Commercial building'), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Current usage', value: this.getF('currentUsage', 'Residential'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property / Site Address', value: this.getF('addressAtSite', ''), labelWidth: 100, valueWidth: CONTENT_W - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Address as per Docs', value: this.getF('addressAsPerDoc', ''), labelWidth: 100, valueWidth: CONTENT_W - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Has the valuer done valuation of this property before? If yes, for whom & when: -', value: this.getF('priorValuation', 'No'), labelWidth: 320, valueWidth: CONTENT_W - 320 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // 2. SURROUNDINGS & LOCALITY DETAILS
    // ==========================================
    this.drawYesSectionHeader('2. Surroundings & Locality Details');

    this.drawKeyValueRow([
      { label: 'Zoning as per Master Plan / Development plan', value: this.getF('zoningMasterPlan', 'Master Plan not Published'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Proximity from civic amenities / public transport', value: this.getF('proximityAmenities', 'All civic amenities are within 1-2Kms from the property.'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Class of locality (High / Middle Class / Lower / Negative)', value: this.getF('localityClass', 'Middle Class'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Nearest Railway Station', value: this.getF('railwayStation', '2-Kms from Rajgangpur Railway Station'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Site (Developed / under-developed)', value: this.getF('siteStatus', 'Developing'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Nearest Bus Stop', value: this.getF('busStop', '1.5-Km from Rajgangpur Bus Stop'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Nearest Landmark', value: this.getF('landmark', 'Near Jaika Motors, Rajgangpur'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Distance from City Centre', value: this.getF('distanceCityCenter', '3-Kms from Rajgangpur city center'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Condition and width of approach road: -', value: this.getF('approachRoad', '20-feet wide Road'), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // 3. PROPERTY DETAILS
    // ==========================================
    this.drawYesSectionHeader('3. Property Details');

    this.drawKeyValueRow([
      { label: 'Brief description of the property', value: this.getF('briefDescription', ''), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Internal visit done', value: this.getF('internalVisitDone', 'NA'), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    // Occupant breakdown
    this.drawKeyValueRow([
      { label: 'Occupant', value: '', labelWidth: 80, valueWidth: 0, labelBold: true },
      { label: 'Vacant/Occupied', value: this.getF('occupantStatus', 'Occupied'), labelWidth: 100, valueWidth: 80 },
      { label: 'Name of Occupant', value: this.getF('occupantName', 'Self Occupied'), labelWidth: 100, valueWidth: CONTENT_W - 360 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 80, valueWidth: 0 },
      { label: 'Relation with applicant', value: this.getF('occupantRelation', 'Self/ Tenant / any other'), labelWidth: 100, valueWidth: CONTENT_W - 180 },
    ]);

    // Building details
    this.drawKeyValueRow([
      { label: 'Building details', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'Property Demarcated (Yes/ No)', value: this.getF('propertyDemarcated', 'Yes'), labelWidth: 140, valueWidth: 60 },
      { label: 'Property Identified through', value: this.getF('propertyIdentifiedThrough', 'Customer (Farzana Kashmi, Mob- 8338944892)'), labelWidth: 110, valueWidth: CONTENT_W - 410 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 100, valueWidth: 0 },
      { label: 'Type of structure', value: this.getF('structureType', 'RCC/ Load Bearing'), labelWidth: 140, valueWidth: 60 },
      { label: 'Land/Plot Area (SFT)', value: this.getF('landPlotAreaDesc', '1742.4sqft'), labelWidth: 110, valueWidth: CONTENT_W - 410 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 100, valueWidth: 0 },
      { label: 'No of Blocks/Wings', value: this.getF('noOfBlocks', 'NA'), labelWidth: 140, valueWidth: 60 },
      { label: 'No. of Floors', value: this.getF('noOfFloors', 'G+2'), labelWidth: 110, valueWidth: CONTENT_W - 410 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 100, valueWidth: 0 },
      { label: 'No of Units per floor', value: this.getF('noOfUnitsPerFloor', 'NA'), labelWidth: 140, valueWidth: 60 },
      { label: 'No. of Lifts', value: this.getF('noOfLifts', 'NA'), labelWidth: 110, valueWidth: CONTENT_W - 410 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 100, valueWidth: 0 },
      { label: 'Amenities', value: this.getF('amenitiesDesc', 'All civic amenities is present within 1-2Kms.'), labelWidth: 140, valueWidth: CONTENT_W - 240 },
    ]);

    // Unit details
    this.drawKeyValueRow([
      { label: 'Unit details', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'Located on Floor No.', value: this.getF('unitFloorNo', 'NA'), labelWidth: 140, valueWidth: 60 },
      { label: 'No. of rooms / Unit configuration', value: this.getF('unitRooms', 'G+2= 10 rooms'), labelWidth: 110, valueWidth: CONTENT_W - 410 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 100, valueWidth: 0 },
      { label: 'Remarks on view from property', value: this.getF('remarksView', 'No'), labelWidth: 140, valueWidth: CONTENT_W - 240 },
    ]);

    // Present condition & Age
    this.drawKeyValueRow([
      { label: 'Present condition of the property:', value: `Exterior:- ${this.getF('qualityExteriors', 'Good')} | Interior:- ${this.getF('qualityInteriors', 'Good')}`, labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Age (Yrs)', value: this.getF('ageOfProperty', '10-Years'), labelWidth: 120, valueWidth: halfW - 120 },
      { label: 'Residual life (Yrs)', value: this.getF('residualLife', '50-Years'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    // Boundaries Schedule
    const bColW = (CONTENT_W - 140) / 4;
    this.drawKeyValueRow([
      { label: 'Boundaries', value: '', labelWidth: 140, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'North', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'South', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'East', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'West', value: '', labelWidth: CONTENT_W - 140 - 3 * bColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Actual on site', value: '', labelWidth: 140, valueWidth: 0 },
      { label: this.getF('boundaryNorthSite', 'Plot No-611(P)'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundarySouthSite', 'Road'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryEastSite', 'Plot No-611(P)'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryWestSite', 'Plot No-611(P)'), value: '', labelWidth: CONTENT_W - 140 - 3 * bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'As per Title document Sale deed', value: '', labelWidth: 140, valueWidth: 0 },
      { label: this.getF('boundaryNorthDoc', 'Plot No-611(P)'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundarySouthDoc', 'Road'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryEastDoc', 'Plot No-611(P)'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryWestDoc', 'Plot No-611(P)'), value: '', labelWidth: CONTENT_W - 140 - 3 * bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'Boundaries matching with Sale Certificate(Yes / No)', value: this.getF('boundariesMatching', 'No'), labelWidth: 260, valueWidth: CONTENT_W - 260, labelBold: true },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // 4. SANCTION PLAN APPROVAL & OTHER DOCUMENT DETAILS
    // ==========================================
    this.drawYesSectionHeader('4. Sanction Plan Approval & Other Document details');

    this.drawKeyValueRow([
      { label: 'Sanctioned plans details', value: this.getF('sanctionApprovalNo', 'Approved plan is not provided'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Construction permission / Commencement Certificate / OC / BCC', value: this.getF('commencementCert', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Ownership type', value: this.getF('ownershipType', 'Freehold'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property documents verified (Any others)', value: this.getF('documentsVerified', 'Copy of Sale deed, ROR'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Is the property within Municipal Limits', value: this.getF('municipalLimits', 'Yes / No(Within Rajgangpur municipality)'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Permissible usage as per sanctioned/approved plan', value: this.getF('permissibleUsageMasterPlan', 'NA'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    // Setbacks Table
    const setColW = (CONTENT_W - 100) / 4;
    this.drawKeyValueRow([
      { label: 'Setbacks', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'As per plan', value: '', labelWidth: setColW, valueWidth: 0, highlight: true },
      { label: 'As per Bye-Laws', value: '', labelWidth: setColW, valueWidth: 0, highlight: true },
      { label: 'Actual at site', value: '', labelWidth: setColW, valueWidth: 0, highlight: true },
      { label: 'Extra Coverage deviation', value: '', labelWidth: CONTENT_W - 100 - 3 * setColW, valueWidth: 0, highlight: true },
    ]);
    ['Front', 'Side 1 (Right)', 'Side 2 (Left)', 'Rear'].forEach(side => {
      this.drawKeyValueRow([
        { label: side, value: '', labelWidth: 100, valueWidth: 0 },
        { label: this.getF(`setback${side.split(' ')[0]}Plan`, 'NA'), value: '', labelWidth: setColW, valueWidth: 0 },
        { label: this.getF(`setback${side.split(' ')[0]}Bye`, 'NA'), value: '', labelWidth: setColW, valueWidth: 0 },
        { label: this.getF(`setback${side.split(' ')[0]}Site`, 'NA'), value: '', labelWidth: setColW, valueWidth: 0 },
        { label: this.getF(`setback${side.split(' ')[0]}Dev`, 'NA'), value: '', labelWidth: CONTENT_W - 100 - 3 * setColW, valueWidth: 0 },
      ]);
    });
    this.drawKeyValueRow([
      { label: 'Deviations if any', value: this.getF('deviations', 'NA'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Demolition Risk', value: this.getF('demolitionRisk', 'High / Medium / Low / Nil.'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // 5. VALUATION (Area Details & Rates)
    // ==========================================
    this.drawYesSectionHeader('5. Valuation - Area Details & Rates');

    // Area Details Breakdown
    const areaRows = [
      { type: 'As per Agreement / Sale Deed', carpet: this.getF('areaDeedCarpet', 'NA'), sft: this.getF('areaDeedSft', 'Sft'), tag: 'Carpet / BUA / SBUA' },
      { type: 'As per Plan', carpet: this.getF('areaPlanCarpet', 'NA'), sft: this.getF('areaPlanSft', 'NA'), tag: 'Carpet / BUA' },
      { type: 'As per Measurement(G+2)', carpet: this.getF('areaMeasureCarpet', '{G+2}: -3 X 1742sqft=5226sqft'), sft: this.getF('areaMeasureSft', 'NA'), tag: 'Carpet / BUA' },
    ];
    areaRows.forEach(r => {
      this.drawKeyValueRow([
        { label: r.type, value: '', labelWidth: 160, valueWidth: 0 },
        { label: r.carpet, value: '', labelWidth: 160, valueWidth: 0 },
        { label: r.sft, value: '', labelWidth: 50, valueWidth: 0 },
        { label: r.tag, value: '', labelWidth: CONTENT_W - 370, valueWidth: 0 },
      ]);
    });

    // A1: Land + Construction Method
    this.drawKeyValueRow([
      { label: 'A1 : Land + Construction Method (Applicable for Villa / Bunglow / Row House / Industrial)', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Description', value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
      { label: 'Area in Sft', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'Rate per Sft', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'Realizable Value in Rs.', value: '', labelWidth: CONTENT_W - 350, valueWidth: 0, labelBold: true },
    ]);

    const landArea = this.getF('landAreaSqft', '1742.4');
    const landRate = this.getF('landRateSqft', '2000');
    const landVal = Number(this.getF('landValuationVal', 3484800));
    this.drawKeyValueRow([
      { label: 'Land area', value: '', labelWidth: 150, valueWidth: 0 },
      { label: `${landArea}Sqft`, value: '', labelWidth: 100, valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(Number(landRate))}/-`, value: '', labelWidth: 100, valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(landVal)}/-`, value: '', labelWidth: CONTENT_W - 350, valueWidth: 0, labelBold: true },
    ]);

    const constrArea = this.getF('constructionAreaSqft', '5226');
    const constrRate = this.getF('constructionRateSqft', '1800');
    const constrVal = Number(this.getF('constructionValuationVal', 9406800));
    this.drawKeyValueRow([
      { label: 'Construction area RCC (G+2)', value: '', labelWidth: 150, valueWidth: 0 },
      { label: `${constrArea}sqft`, value: '', labelWidth: 100, valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(Number(constrRate))}/-`, value: '', labelWidth: 100, valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(constrVal)}/-`, value: '', labelWidth: CONTENT_W - 350, valueWidth: 0, labelBold: true },
    ]);

    const totalPropVal = landVal + constrVal;
    this.drawKeyValueRow([
      { label: '(Value of Property(Land & Building), (on 100% completion):-', value: `Rs.${formatIndianCurrency(landVal)}/-+ Rs.${formatIndianCurrency(constrVal)}/-= Rs.${formatIndianCurrency(totalPropVal)}/-`, labelWidth: 260, valueWidth: CONTENT_W - 260, labelBold: true },
    ]);

    // A2: Comparison Method
    this.drawKeyValueRow([
      { label: 'A2. Comparison Method', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Carpet Area', value: this.getF('comparisonCarpetArea', 'NA'), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Loading in %', value: this.getF('comparisonLoading', 'NA'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Saleable area', value: this.getF('comparisonSaleableArea', 'NA'), labelWidth: 100, valueWidth: halfW - 100 },
      { label: 'Rate per Sft', value: this.getF('comparisonRateSft', 'NA'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Realizable Value of property as per comparison method (A2)', value: this.getF('realizableComparison', 'NA'), labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true },
    ]);

    // Value of Amenities
    this.drawKeyValueRow([
      { label: 'Value of Amenities if applicable', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: 'No of car parks', value: this.getF('noOfCarParks', 'NA.....Nos'), labelWidth: 120, valueWidth: 60 },
      { label: 'Rate per car parking', value: this.getF('rateCarParking', 'NA'), labelWidth: 120, valueWidth: 60 },
      { label: 'Value of car park', value: this.getF('valCarPark', 'NA'), labelWidth: 100, valueWidth: CONTENT_W - 460 },
    ]);
    this.drawKeyValueRow([
      { label: 'Total Amenities charges (B)', value: this.getF('totalAmenitiesB', 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // Realizable Summary
    const grandRealizable = Number(this.getF('totalRealizableValue', totalPropVal));
    const forcedVal = Number(this.getF('forcedSaleValue', Math.round(grandRealizable * 0.75)));
    this.drawKeyValueRow([
      { label: 'Total Realizable Value of the property: - A1 or (A2 + B) on 100%', value: `Rs.${formatIndianCurrency(grandRealizable)}/-`, labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Forced Sale Value / Distress Value (75%)', value: `Rs.${formatIndianCurrency(forcedVal)}/-`, labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Ready Reckoner rate / Circle rate', value: this.getF('readyReckonerRate', 'Rs.362/-Per sqft of land'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Value as per Ready Reckoner/Circle Rate', value: `Rs.${formatIndianCurrency(Number(this.getF('readyReckonerTotal', 630748)))}/-`, labelWidth: 260, valueWidth: CONTENT_W - 260, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Insurance value / Re-construction cost', value: this.getF('insuranceValue', 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Approx. Rentals in case of 100% complete property', value: this.getF('approxRentals', 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Supporting explanation in case difference between FMV and Reckoner Rate is >20%',
        value: this.getF('fmvReckonerDiffExplanation', 'FMV is 0.18 times more than Circle rate.The difference is due to the reason that the circle rate of that area has not been revised since a long time.'),
        labelWidth: 220,
        valueWidth: CONTENT_W - 220,
      },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // 6. MARKET COMPARISON
    // ==========================================
    this.drawYesSectionHeader('6. Market Comparison');
    this.drawKeyValueRow([
      { label: 'Sr No', value: '', labelWidth: 40, valueWidth: 0, labelBold: true },
      { label: 'Property Details', value: '', labelWidth: 200, valueWidth: 0, labelBold: true },
      { label: 'Value', value: '', labelWidth: 100, valueWidth: 0, labelBold: true },
      { label: 'Date of Transaction', value: '', labelWidth: CONTENT_W - 340, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '1.', value: '', labelWidth: 40, valueWidth: 0 },
      { label: this.getF('comp1Prop', 'Independent residential building'), value: '', labelWidth: 200, valueWidth: 0 },
      { label: this.getF('comp1Val', 'Rs. 2,000/sqft'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('comp1Date', 'Recent local enquiry'), value: '', labelWidth: CONTENT_W - 340, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '2.', value: '', labelWidth: 40, valueWidth: 0 },
      { label: this.getF('comp2Prop', 'Nearby commercial land'), value: '', labelWidth: 200, valueWidth: 0 },
      { label: this.getF('comp2Val', 'Rs. 2,200/sqft'), value: '', labelWidth: 100, valueWidth: 0 },
      { label: this.getF('comp2Date', 'Recent local enquiry'), value: '', labelWidth: CONTENT_W - 340, valueWidth: 0 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // 7. STAGE OF CONSTRUCTION & 8. REMARKS
    // ==========================================
    this.drawYesSectionHeader('7. Stage of Construction & 8. Remarks');
    this.drawKeyValueRow([
      { label: 'Details: Completed building', value: '', labelWidth: 180, valueWidth: 0 },
      { label: `% Progress: ${this.getF('stageProgress', '100%')}`, value: '', labelWidth: 140, valueWidth: 0 },
      { label: `% Recommendation: ${this.getF('stageReco', '100%')}`, value: '', labelWidth: CONTENT_W - 320, valueWidth: 0 },
    ]);

    // Remarks table
    this.drawKeyValueRow([
      { label: 'Negative Remarks', value: '', labelWidth: halfW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Positive Remarks', value: '', labelWidth: halfW, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: this.getF('negativeRemarks', 'Property Sketch map is not provided.'), value: '', labelWidth: halfW, valueWidth: 0 },
      { label: this.getF('positiveRemarks', 'Property located in a developed area of Barbil Municipality & all civic amenities are within present 1-2Kms.'), value: '', labelWidth: halfW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: `Latitude: ${this.getF('latitude', '22.209611')}`, value: `Longitude: ${this.getF('longitude', '84.591222')}`, labelWidth: halfW, valueWidth: halfW, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Tentative Completion Date (For Construction Only): -', value: this.getF('tentativeCompletion', 'NA'), labelWidth: 240, valueWidth: CONTENT_W - 240 },
    ]);

    this.advanceCursor(8);

    // ==========================================
    // DECLARATION (11 Clauses)
    // ==========================================
    this.drawYesSectionHeader('Declaration');
    this.drawKeyValueRow([
      { label: 'I/We hereby declare that:', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);

    const declarations = [
      '1.   Our representative physically inspected the property.',
      '2.   We have no direct/indirect interest in the property valued.',
      '3.   Report is prepared based on the information furnished to us or documents submitted or shown to us by the client.',
      '4.   The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties.',
      '5.   The client is free to obtain other independent opinions on the same. The fair market value of such properties/localities may increase or decrease depending on the future market conditions and scenarios.',
      '6.   This report does not certify of confirm any ownership or title of the property that has been valued. The ownership papers/sale deeds may please be verified at your end to ascertain the right title & area.',
      '7.   The services provided by YES Bank to the Client will be limited to their use. The Report should not be used for any other purpose.',
      '8.   The Report will reflect matters, as they currently exist. Changes may materially affect the information contained in the Report.',
      '9.   It should be noted that report would be based upon the facts and evidence available at the date of assessment. Periodical review of the same may be required. Changes in socio-economic, economic policy and political conditions could result in a substantially different situation than those presented at the stated effective date.YES Bank assumes no responsibility for changes in such external conditions.',
      '10. We do not possess legal expertise and hence recommend you to take opinion of legal expert in order to ensure that there are no elements, restriction or charges contained which are likely to have detrimental effect upon the value or marketability of property.',
      '11. In the preparation of the Report, we have relied on the following information:\n       a.  Information provided to us by the client and its affiliates and subsidiaries and third parties;\n       b.  Other relevant information provided to us by the Client and its affiliates and subsidiaries at request;\n       c.  Other relevant information available to us or publicly available.',
    ];

    declarations.forEach(dec => {
      this.drawKeyValueRow([
        { label: dec, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    this.advanceCursor(12);

    this.drawKeyValueRow([
      { label: 'For : M/s. S Mohanty Associates\n\nSign & Stamp', value: `Date: ${this.getF('reportDate', '18/06/2026')}   Place: ${this.getF('place', 'Bhubaneswar')}`, labelWidth: halfW, valueWidth: halfW, labelBold: true },
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
