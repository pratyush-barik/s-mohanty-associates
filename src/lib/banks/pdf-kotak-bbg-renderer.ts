import { PDFBankRenderer } from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import {
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';

export class PDFKotakBbgRenderer extends PDFBankRenderer {
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

  private stripHtml(html: string): string {
    return (html || '').replace(/<[^>]*>?/gm, '');
  }

  async drawContent(): Promise<void> {
    this.addPage();
    this.drawMainHeader('VALUATION REPORT');

    this.drawSectionHeader('1. GENERAL DETAILS');
    const bankBranch = this.getF('kotakBbgBankBranch') === 'Custom' ? this.getF('kotakBbgBankBranchCustom') : this.getF('kotakBbgBankBranch');
    this.drawKeyValueRow([
      { label: 'Bank Name', value: this.getF('kotakBbgBankName') || 'Kotak Mahindra Bank' },
      { label: 'Bank Branch / IFCS', value: bankBranch },
    ]);
    this.drawKeyValueRow([
      { label: 'Bank Reference / App No.', value: this.getF('kotakBbgBankRefNA') ? 'NA' : this.getF('kotakBbgBankRef') },
      { label: 'Purpose of Valuation', value: this.getF('kotakBbgPurpose') || 'Market Value Assessment' },
    ]);
    const siteEng = this.getF('kotakBbgSiteEngineerNA') ? 'NA' : (this.getF('kotakBbgSiteEngineer') === 'Custom' ? this.getF('kotakBbgSiteEngineerCustom') : this.getF('kotakBbgSiteEngineer'));
    this.drawKeyValueRow([
      { label: 'Date of Valuation', value: this.getF('kotakBbgDateOfValuation') },
      { label: 'Name of the Valuer', value: this.getF('kotakBbgValuerName') || 'Er. S. Mohanty' },
    ]);
    this.drawKeyValueRow([
      { label: 'Site Engineer Inspecting', value: siteEng },
      { label: 'Name of Customer / Borrower', value: this.getF('kotakBbgBorrowerName') },
    ]);
    
    let personMetStr = this.getF('kotakBbgPersonMet') || '';
    if (personMetStr) {
       const rel = this.getF('kotakBbgPersonMetRelation') === 'Custom' ? this.getF('kotakBbgPersonMetRelationCustom') : this.getF('kotakBbgPersonMetRelation');
       if (rel) personMetStr += ` (${rel})`;
       const phone = this.getF('kotakBbgPersonMetContactNA') ? 'NA' : this.getF('kotakBbgPersonMetContact');
       if (phone && phone !== 'NA') personMetStr += ` - Ph: ${phone}`;
    }
    
    this.drawKeyValueRow([
      { label: 'Name of Property Owner(s)', value: this.getF('kotakBbgOwnerSameAsBorrower') ? this.getF('kotakBbgBorrowerName') : this.getF('kotakBbgOwnerName') },
      { label: 'Date of Technical Site Visit', value: this.getF('kotakBbgDateOfSiteVisit') },
    ]);
    this.drawKeyValueRow([
      { label: 'Person Met at Site & Contact Details', value: personMetStr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    this.drawSectionHeader('2. NATURE & SCOPE OF PROPERTY');
    
    const nature = this.getF('kotakBbgNatureOfProperty') === 'Custom' ? this.getF('kotakBbgNatureOfPropertyCustom') : this.getF('kotakBbgNatureOfProperty');
    const occupancy = this.getF('kotakBbgOccupancyNA') ? 'NA' : (this.getF('kotakBbgOccupancy') === 'Custom' ? this.getF('kotakBbgOccupancyCustom') : this.getF('kotakBbgOccupancy'));
    this.drawKeyValueRow([
      { label: 'Nature of Property', value: nature },
      { label: 'Present Use / Occupancy Status', value: occupancy },
    ]);
    
    const tenureType = this.getF('kotakBbgTenure') === 'Custom' ? this.getF('kotakBbgTenureCustom') : this.getF('kotakBbgTenure');
    let tenureDetails = tenureType;
    if (this.getF('kotakBbgTenure') === 'Leasehold') {
      const remaining = this.getF('kotakBbgLeaseRemainingYears');
      const expiry = this.getF('kotakBbgLeaseExpiryDate');
      if (remaining || expiry) tenureDetails += ` (${remaining ? remaining + ' yrs left' : ''}${remaining && expiry ? ', ' : ''}${expiry ? 'Expiry: ' + expiry : ''})`;
    }
    
    this.drawKeyValueRow([
      { label: 'Type of Ownership', value: tenureDetails },
      { label: 'Scope of Valuation (Share %)', value: this.getF('kotakBbgScopeOfValuation') || '100%' },
    ]);
    
    this.drawKeyValueRow([
      { label: 'Brief Description of the Property', value: this.getF('kotakBbgPropertyDescriptionNA') ? 'NA' : this.getF('kotakBbgPropertyDescription'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    this.drawSectionHeader('3. SITE & SURROUNDING DETAILS');
    this.drawKeyValueRow([{ label: 'Property Boundaries Comparison', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true }]);
    this.drawKeyValueRow([
      { label: 'Direction', value: 'As Per Document', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2, bold: true, labelBold: true },
      { label: 'As Per Site', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0, bold: true, labelBold: true },
    ]);
    const b = this.getF('kotakBbgBoundariesTable') || {};
    this.drawKeyValueRow([
      { label: 'North', value: b.northDoc || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: b.northSite || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'South', value: b.southDoc || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: b.southSite || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'East', value: b.eastDoc || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: b.eastSite || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'West', value: b.westDoc || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: b.westSite || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'Boundaries Matching Verification', value: this.getF('kotakBbgBoundariesMatching') },
      { label: 'Discrepancy in Boundaries', value: this.getF('kotakBbgBoundariesDiscrepancyNA') ? 'NA' : this.getF('kotakBbgBoundariesDiscrepancy') },
    ]);
    this.drawKeyValueRow([
      { label: 'Document Basis for Property Identification', value: this.getF('kotakBbgDocumentBasis') === 'Custom' ? this.getF('kotakBbgDocumentBasisCustom') : this.getF('kotakBbgDocumentBasis') },
      { label: 'Valuer Confirmation', value: this.getF('kotakBbgValuerConfirmation') ? 'Confirmed' : 'Not Confirmed' },
    ]);
    this.drawKeyValueRow([
      { label: 'Plot Demarcated at Site', value: this.getF('kotakBbgPlotDemarcated') ? 'Yes' : 'No' },
      { label: 'Locality Type, Condition & Classification', value: this.getF('kotakBbgLocalityTypeNA') ? 'NA' : this.getF('kotakBbgLocalityType') },
    ]);
    const surrList = Array.isArray(this.getF('kotakBbgSurroundingDev')) ? [...this.getF('kotakBbgSurroundingDev')] : [];
    if (this.getF('kotakBbgSurroundingDevCustomChecked') && this.getF('kotakBbgSurroundingDevCustom')) {
      surrList.push(this.getF('kotakBbgSurroundingDevCustom'));
    }
    const surr = surrList.join(', ');
    this.drawKeyValueRow([
      { label: 'Development of Surrounding Areas', value: surr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Access to Property', value: this.getF('kotakBbgAccessNA') ? 'NA' : this.getF('kotakBbgAccess') },
      { label: 'Approach Road Name & Condition', value: this.getF('kotakBbgApproachRoadNA') ? 'NA' : this.getF('kotakBbgApproachRoad') },
    ]);
    this.drawKeyValueRow([
      { label: 'Proximity to Civic Amenities', value: this.getF('kotakBbgProximityNA') ? 'NA' : this.getF('kotakBbgProximity'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('4. TITLE, LEGAL & STATUTORY DETAILS');
    
    let natureOfTitleDeed = this.getF('kotakBbgTitleDeedNature');
    if (natureOfTitleDeed === 'Custom') natureOfTitleDeed = this.getF('kotakBbgTitleDeedNatureCustom');
    
    this.drawKeyValueRow([
      { label: 'Nature of Title Deed', value: natureOfTitleDeed },
      { label: 'Title Deed / Document Number', value: this.getF('kotakBbgTitleDeedNoNA') ? 'NA' : this.getF('kotakBbgTitleDeedNo') },
    ]);
    
    this.drawKeyValueRow([
      { label: 'Date of Execution', value: this.getF('kotakBbgExecutionDate') },
      { label: 'Registration Date', value: this.getF('kotakBbgRegistrationDate') },
    ]);
    
    let sro = this.getF('kotakBbgSro');
    if (sro === 'Custom') sro = this.getF('kotakBbgSroCustom');
    if (this.getF('kotakBbgSroNA')) sro = 'NA';

    let localAuthority = this.getF('kotakBbgLocalAuthority');
    if (localAuthority === 'Custom') localAuthority = this.getF('kotakBbgLocalAuthorityCustom');
    if (this.getF('kotakBbgLocalAuthorityNA')) localAuthority = 'NA';

    this.drawKeyValueRow([
      { label: 'Sub-Registrar Office (SRO)', value: sro },
      { label: 'Town Planning / Local Authority', value: localAuthority },
    ]);

    let approvedPlanStatus = this.getF('kotakBbgApprovedPlanStatus');
    let approvedPlanStr = approvedPlanStatus || '';
    if (approvedPlanStatus === 'Approved') {
        approvedPlanStr += ` (No: ${this.getF('kotakBbgApprovedPlanNo') || '-'}, Date: ${this.getF('kotakBbgApprovedPlanDate') || '-'})`;
    }
    
    let planDeviation = this.getF('kotakBbgPlanDeviation') || '';
    if (planDeviation === 'Minor Deviation' || planDeviation === 'Major Deviation') {
        planDeviation += ` (${this.getF('kotakBbgPlanDeviationPercent') || '0'}%)`;
    }
    
    this.drawKeyValueRow([
      { label: 'Approved Building Plan Details', value: approvedPlanStr },
      { label: 'Deviation from Approved Plan', value: planDeviation },
    ]);

    let propertyTaxStr = 'NA';
    if (!this.getF('kotakBbgPropertyTaxNA')) {
        let taxYear = this.getF('kotakBbgTaxPaidYear');
        if (taxYear === 'Custom') taxYear = this.getF('kotakBbgTaxPaidYearCustom');
        propertyTaxStr = `No: ${this.getF('kotakBbgPropertyTaxNo') || '-'} | Paid Up To: ${taxYear || '-'}`;
    }

    const isVacantOrIndependent = this.getF('kotakBbgNatureOfProperty') === 'Vacant Land' || this.getF('kotakBbgNatureOfProperty') === 'Independent House';
    const reraNA = this.getF('kotakBbgReraNA') !== undefined ? this.getF('kotakBbgReraNA') : isVacantOrIndependent;

    this.drawKeyValueRow([
      { label: 'Property Tax Assessment', value: propertyTaxStr },
      { label: 'RERA Registration Number', value: reraNA ? 'NA' : this.getF('kotakBbgReraNo') },
    ]);

    this.drawSectionHeader('5. BUILDING / STRUCTURAL DETAILS');
    if (this.getF('kotakBbgNatureOfProperty') === 'Vacant Land' && !this.getF('kotakBbgSection5Override')) {
      this.drawKeyValueRow([{ label: 'This section is auto-disabled because Nature of Property is "Vacant Land".', value: '', labelWidth: CONTENT_W, valueWidth: 0 }]);
    } else {
      this.drawKeyValueRow([
        { label: 'Year of Construction', value: this.getF('kotakBbgYearOfConstruction') || 'NA' },
        { label: 'Age of Building (Years)', value: this.getF('kotakBbgAgeOfBuilding') || 'NA' },
      ]);
      
      let elevation = this.getF('kotakBbgElevationProfile');
      if (elevation === 'Custom') elevation = this.getF('kotakBbgElevationProfileCustom');
      
      this.drawKeyValueRow([
        { label: 'Number of Floors', value: this.getF('kotakBbgNumberOfFloors') || 'NA' },
        { label: 'Elevation Profile', value: elevation || 'NA' },
      ]);

      let consType = this.getF('kotakBbgConstructionType');
      if (consType === 'Custom') consType = this.getF('kotakBbgConstructionTypeCustom');
      if (this.getF('kotakBbgConstructionTypeNA')) consType = 'NA';

      let roofSystem = this.getF('kotakBbgRoofingSystem');
      if (roofSystem === 'Custom') roofSystem = this.getF('kotakBbgRoofingSystemCustom');
      if (this.getF('kotakBbgRoofingSystemNA')) roofSystem = 'NA';

      this.drawKeyValueRow([
        { label: 'Type of Construction', value: consType || 'NA' },
        { label: 'Roofing System', value: roofSystem || 'NA' },
      ]);

      let flooring = 'NA';
      const floorList = Array.isArray(this.getF('kotakBbgFlooringSystem')) ? [...this.getF('kotakBbgFlooringSystem')] : [];
      if (this.getF('kotakBbgFlooringSystemCustomChecked') && this.getF('kotakBbgFlooringSystemCustom')) {
        floorList.push(this.getF('kotakBbgFlooringSystemCustom'));
      }
      if (floorList.length > 0) flooring = floorList.join(', ');

      this.drawKeyValueRow([
        { label: 'Flooring System', value: flooring, labelWidth: 200, valueWidth: CONTENT_W - 200 },
      ]);

      this.drawKeyValueRow([
        { label: 'Exterior / Interior Finishing', value: this.getF('kotakBbgExteriorInteriorFinishingNA') ? 'NA' : this.getF('kotakBbgExteriorInteriorFinishing'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
      ]);
      
      this.drawKeyValueRow([
        { label: 'Quality of Construction', value: this.getF('kotakBbgQualityOfConstructionNA') ? 'NA' : this.getF('kotakBbgQualityOfConstruction') },
        { label: 'Residual / Remaining Life', value: this.getF('kotakBbgResidualStructuralAge') || 'NA' },
      ]);
    }

    this.drawSectionHeader('6. AREA MEASUREMENT & CALCULATIONS');
    const landArea = this.getF('kotakBbgLandArea') || '0';
    const landUnit = this.getF('kotakBbgLandAreaUnit') || '';
    this.drawKeyValueRow([
      { label: 'Total Plot / Land Area', value: `${landArea} ${landUnit}`.trim(), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    const fsiVal = this.getF('kotakBbgFsiNA') ? 'NA' : this.getF('kotakBbgFsi');
    this.drawKeyValueRow([
      { label: 'Permissible Built-Up Area (FSI/FAR)', value: fsiVal || '-', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    const isVacantLand = this.getF('kotakBbgNatureOfProperty') === 'Vacant Land';
    const actualBuaNA = this.getF('kotakBbgActualBuaNA') || isVacantLand;
    const actualBuaVal = actualBuaNA ? 'NA' : `${this.getF('kotakBbgActualBua') || '0'} ${this.getF('kotakBbgActualBuaUnit') || ''}`.trim();
    this.drawKeyValueRow([
      { label: 'Actual Built-Up Area', value: actualBuaVal, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    const actualCarpetNA = this.getF('kotakBbgActualCarpetAreaNA');
    const actualCarpetVal = actualCarpetNA ? 'NA' : `${this.getF('kotakBbgActualCarpetArea') || '0'} ${this.getF('kotakBbgActualCarpetAreaUnit') || ''}`.trim();
    this.drawKeyValueRow([
      { label: 'Actual Carpet Area', value: actualCarpetVal, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('7. MARKET VALUE & REALIZABLE VALUE ASSESSMENT');
    this.drawKeyValueRow([
      { label: 'Prevailing Market Rate of Land (INR)', value: this.getF('kotakBbgPrevailingMarketRateLand') || '0' },
      { label: 'Estimated Fair Market Value of Land', value: this.getF('kotakBbgFmvLand') || '0' },
    ]);
    
    const repCost = this.getF('kotakBbgReplacementCostBuilding') || '0';
    const depPct = this.getF('kotakBbgDepreciationPercent') || '0';
    this.drawKeyValueRow([
      { label: 'Replacement Cost of Building & Depr.', value: `Rs ${repCost}/Sq.Ft | Depr: ${depPct}%`, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    const fmvBldgNA = this.getF('kotakBbgFmvBuildingNA') || isVacantLand;
    this.drawKeyValueRow([
      { label: 'Estimated Depreciated Value of Bldg', value: fmvBldgNA ? 'NA' : (this.getF('kotakBbgFmvBuilding') || '0') },
      { label: 'Total Estimated Fair Market Value', value: this.getF('kotakBbgTotalFmv') || '0' },
    ]);

    this.drawSectionHeader('8. DISTRESS / FORCED SALE VALUE');
    this.drawKeyValueRow([
      { label: 'Distress Sale Value Factor (%)', value: this.getF('kotakBbgDistressFactor') || '80' },
      { label: 'Assessed Forced Sale Value / RV', value: this.getF('kotakBbgFsv') || '0' },
    ]);

    this.drawSectionHeader('9. REMARKS / KEY OBSERVATIONS');
    this.drawKeyValueRow([
      { label: 'Standard Disclaimers & Assumptions', value: this.getF('kotakBbgStandardDisclaimers') || "The valuer assumes no responsibility for legal title. The valuation is strictly for bank internal use based on current market trends and visible site conditions.", labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    let risksStr = 'NA';
    if (!this.getF('kotakBbgRiskFactorsNA')) {
      const rList = Array.isArray(this.getF('kotakBbgRiskFactors')) ? this.getF('kotakBbgRiskFactors') : [];
      const mapped = rList.map((r: string) => r === 'Custom' ? this.getF('kotakBbgRiskFactorsCustom') : r).filter(Boolean);
      risksStr = mapped.length > 0 ? mapped.join(', ') : 'None selected';
    }
    this.drawKeyValueRow([
      { label: 'Key Risk Factors / Alerts', value: risksStr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    const rec = this.getF('kotakBbgFinalRecommendation') === 'Custom' ? this.getF('kotakBbgFinalRecommendationCustom') : this.getF('kotakBbgFinalRecommendation');
    this.drawKeyValueRow([
      { label: 'Final Recommendation', value: rec || '-', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawKeyValueRow([
      { label: 'Detailed Remarks & Addl Observations', value: this.getF('kotakBbgRemarksNA') ? 'NA' : this.getF('kotakBbgRemarks'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('10. VALUER DECLARATION & SIGNOFF');
    this.drawKeyValueRow([
      { label: 'Declaration Confirmed', value: this.getF('kotakBbgDeclarationConfirmed') ? 'Yes (Legally Bound)' : 'No', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Report Issue Date', value: this.getF('kotakBbgReportIssueDate') || new Date().toISOString().split('T')[0] },
      { label: 'Report Issue Place', value: this.getF('kotakBbgReportIssuePlace') === 'Custom' ? this.getF('kotakBbgReportIssuePlaceCustom') : (this.getF('kotakBbgReportIssuePlace') || 'Bhubaneswar') },
    ]);
    const defaultCredentials = "Name: Er. S. Mohanty\nQualifications: B.Tech (Civil), M.Tech (Structures), FIV\nIBBI Reg No: IBBI/RV/00/0000\nWealth Tax Reg No: CAT-I/000";
    this.drawKeyValueRow([
      { label: 'Valuer Credentials', value: this.getF('kotakBbgValuerCredentials') || defaultCredentials, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Signature Confirmed', value: this.getF('kotakBbgSignatureConfirmed') ? 'Yes (Verified)' : 'No', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
  }
}
