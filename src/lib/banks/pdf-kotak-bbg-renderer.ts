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
    
    // Ensure legacy pre-fills are overwritten with new text
    const oldBankName = 'Kotak Mahindra Bank';
    const newBankName = 'Kotak Mahindra Bank Limited (KMBL)';
    const bankNameField = this.getF('kotakBbgBankName');
    const bankNameVal = (!bankNameField || bankNameField === oldBankName) ? newBankName : bankNameField;

    const oldPurpose = 'To ascertain Market value, Realizable value & Distress value for bank decision-making';
    const newPurpose = 'To ascertain Market value, Realizable value & Distress value of the property for assisting Kotak Mahindra Bank Limited in making prudent banking decision';
    const purposeField = this.getF('kotakBbgPurpose');
    const purposeVal = (!purposeField || purposeField === oldPurpose || purposeField === 'Market Value Assessment') ? newPurpose : purposeField;

    this.drawKeyValueRow([
      { label: 'Bank Name', value: bankNameVal },
      { label: 'Reference / Application No.', value: this.getF('projectCode') || '' },
    ]);
    this.drawKeyValueRow([
      { label: 'a. Purpose of Valuation', value: purposeVal, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    const siteEng = this.getF('kotakBbgSiteEngineerNA') ? 'NA' : (this.getF('kotakBbgSiteEngineer') === 'Custom' ? this.getF('kotakBbgSiteEngineerCustom') : this.getF('kotakBbgSiteEngineer'));
    this.drawKeyValueRow([
      { label: 'b. Date of valuation', value: this.getF('kotakBbgDateOfValuation') },
      { label: 'c. Name of the Valuer', value: this.getF('kotakBbgValuerName') || 'Er. S. Mohanty' },
    ]);
    this.drawKeyValueRow([
      { label: 'd. Name of the qualified/ experienced Site engineer inspecting the property', value: siteEng, labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'e. Name of the customer', value: this.getF('kotakBbgBorrowerName'), labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    
    let personMetStr = this.getF('kotakBbgPersonMet') || '';
    if (personMetStr) {
       const rel = this.getF('kotakBbgPersonMetRelation') === 'Custom' ? this.getF('kotakBbgPersonMetRelationCustom') : this.getF('kotakBbgPersonMetRelation');
       if (rel) personMetStr += ` (${rel})`;
       const phone = this.getF('kotakBbgPersonMetContactNA') ? 'NA' : this.getF('kotakBbgPersonMetContact');
       if (phone && phone !== 'NA') personMetStr += ` - Ph: ${phone}`;
    }
    
    this.drawKeyValueRow([
      { label: 'f. Name of the property owner/owners as per legal docs', value: this.getF('kotakBbgOwnerSameAsBorrower') ? this.getF('kotakBbgBorrowerName') : this.getF('kotakBbgOwnerName'), labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'g. Date of Technical Visit', value: this.getF('kotakBbgDateOfSiteVisit'), labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'h. Person met at the time of site visit', value: personMetStr, labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    
    this.drawSectionHeader('2. DETAILS OF THE PROPERTY BEING APPRAISED');
    
    const techAddress = this.getF('kotakBbgTechnicalAddress') || 'NA';
    
    this.drawKeyValueRow([
      { label: 'a. Technical Address of the Property (Please be descriptive mentioning landmark, road, post code etc)', value: techAddress, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    let legalAddress = this.getF('kotakBbgLegalAddress');
    if (legalAddress === undefined || legalAddress === null || legalAddress === '') {
        legalAddress = this.getF('kotakBbgTechnicalAddress') || 'NA';
    }

    this.drawKeyValueRow([
      { label: 'b. Legal Address of the Property', value: legalAddress || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    const lat = this.getF('latitude');
    const lng = this.getF('longitude');
    const coords = (lat && lng) ? `Latitude : ${lat},Longitude: ${lng}` : 'NA';

    const nature = this.getF('kotakBbgNatureOfProperty') === 'Custom' ? this.getF('kotakBbgNatureOfPropertyCustom') : this.getF('kotakBbgNatureOfProperty');
    
    this.drawKeyValueRow([
      { label: 'c. Google Coordinates', value: coords },
      { label: 'd. Nature of the property', value: nature || 'NA' },
    ]);
    
    const tenureType = this.getF('kotakBbgTenure') === 'Custom' ? this.getF('kotakBbgTenureCustom') : this.getF('kotakBbgTenure');
    const isFreehold = tenureType === 'Freehold';
    
    this.drawKeyValueRow([
      { label: 'e. Tenure of the property (Freehold/leasehold)', value: tenureType || 'NA' },
      { label: 'f. If leasehold please stipulate important lease terms', value: isFreehold ? 'NA' : (this.getF('kotakBbgLeaseTermsNA') ? 'NA' : this.getF('kotakBbgLeaseTerms')) },
    ]);

    this.drawKeyValueRow([
      { label: 'g. Are the leasehold rights transferable?', value: isFreehold ? 'NA' : (this.getF('kotakBbgLeaseTransferableNA') ? 'NA' : (this.getF('kotakBbgLeaseTransferable') === 'Custom' ? this.getF('kotakBbgLeaseTransferableCustom') : this.getF('kotakBbgLeaseTransferable'))), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    const occupancy = this.getF('kotakBbgOccupancyNA') ? 'NA' : (this.getF('kotakBbgOccupancy') === 'Custom' ? this.getF('kotakBbgOccupancyCustom') : this.getF('kotakBbgOccupancy'));
    this.drawKeyValueRow([
      { label: 'h. Occupancy details (Details if rented)', value: occupancy || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    this.drawSectionHeader('3. SITE & SURROUNDING DETAILS');
    this.drawKeyValueRow([{ label: 'a. Property Boundaries Comparison', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true }]);
    this.drawKeyValueRow([
      { label: 'Direction', value: 'As Per Document', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2, bold: true, labelBold: true },
      { label: 'As Per Site', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0, bold: true, labelBold: true },
    ]);
    const bDoc = this.getF('kotakBbgBoundariesDoc') || {};
    const bSite = this.getF('kotakBbgBoundariesSiteSameAsDoc') ? bDoc : (this.getF('kotakBbgBoundariesSite') || {});
    this.drawKeyValueRow([
      { label: 'North', value: bDoc.north || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: bSite.north || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'South', value: bDoc.south || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: bSite.south || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'East', value: bDoc.east || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: bSite.east || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'West', value: bDoc.west || '', labelWidth: 80, valueWidth: (CONTENT_W - 80) / 2 },
      { label: bSite.west || '', value: '', labelWidth: (CONTENT_W - 80) / 2, valueWidth: 0 },
    ]);

    const matchingVal = this.getF('kotakBbgBoundariesMatching');
    const isDiscrepancyNA = matchingVal === 'Yes' || this.getF('kotakBbgBoundariesDiscrepancyNA');

    this.drawKeyValueRow([
      { label: 'b. Boundaries Matching Verification', value: matchingVal || 'NA' },
      { label: 'c. Discrepancy in Boundaries', value: isDiscrepancyNA ? 'NA' : (this.getF('kotakBbgBoundariesDiscrepancy') || 'NA') },
    ]);

    this.drawKeyValueRow([
      { label: 'd. Document Basis for Property Identification', value: this.getF('kotakBbgDocumentsIdentified') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawKeyValueRow([
      { label: 'e. Confirmation from the valuer', value: this.getF('kotakBbgValuerConfirmationNA') ? 'NA' : (this.getF('kotakBbgValuerConfirmation') || 'NA') },
      { label: 'f. Property Demarcated at Site', value: this.getF('kotakBbgDemarcatedNA') ? 'NA' : (this.getF('kotakBbgDemarcated') || 'NA') },
    ]);

    let localityStr = this.getF('kotakBbgLocalityClassification');

    this.drawKeyValueRow([
      { label: 'g. Type, Condition, Classification of the Locality', value: localityStr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    let surrDev = this.getF('kotakBbgSurroundingDev') === 'Custom' ? this.getF('kotakBbgSurroundingDevCustom') : this.getF('kotakBbgSurroundingDev');
    this.drawKeyValueRow([
      { label: 'h. Development of surrounding areas', value: surrDev || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    let accessStr = this.getF('kotakBbgAccessType');
    
    let approachName = this.getF('kotakBbgApproachRoadName');
    let approachCond = this.getF('kotakBbgApproachRoadCondition') === 'Custom' ? this.getF('kotakBbgApproachRoadConditionCustom') : this.getF('kotakBbgApproachRoadCondition');
    let approachStr = [approachName, approachCond].filter(Boolean).join(' - ');

    this.drawKeyValueRow([
      { label: 'i. Access to Property', value: accessStr || 'NA' },
      { label: 'j. Name and condition of Approach Road', value: approachStr || 'NA' },
    ]);

    this.drawKeyValueRow([
      { label: 'k. Proximity to Civic Amenities', value: this.getF('kotakBbgCivicAmenities') || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('4. DETAILS OF APPROVALS VERIFIED');
    
    // a. Land Non Agricultural/ conversion permission
    let landConv = this.getF('kotakBbgLandConversionNA') ? 'NA' : (this.getF('kotakBbgLandConversion') === 'Custom' ? this.getF('kotakBbgLandConversionCustom') : this.getF('kotakBbgLandConversion'));
    
    // b. Land Zoning/ Restrictions
    let landZoning = this.getF('kotakBbgLandZoningNA') ? 'NA' : (this.getF('kotakBbgLandZoning') === 'Custom' ? this.getF('kotakBbgLandZoningCustom') : this.getF('kotakBbgLandZoning'));

    this.drawKeyValueRow([
      { label: 'a. Land Non Agricultural/ conversion permission', value: landConv || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'b. Land Zoning/ Restrictions (if any)', value: landZoning || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // c. Approved plans Details
    let planStatus = this.getF('kotakBbgApprovedPlanStatus');
    let planNotAvail = planStatus === 'Approved Plan not available';
    let planDetails = planNotAvail ? 'NA' : this.getF('kotakBbgApprovedPlanDetails');
    let planStr = [planStatus, planDetails].filter(Boolean).join(' - ');
    this.drawKeyValueRow([
      { label: 'c. Approved plans Details', value: planStr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // d. Name of the Authority granting approvals
    let auth = this.getF('kotakBbgAuthorityApprovalsNA') ? 'NA' : (this.getF('kotakBbgAuthorityApprovals') === 'Custom' ? this.getF('kotakBbgAuthorityApprovalsCustom') : this.getF('kotakBbgAuthorityApprovals'));
    
    // e. Are the plans approved from competent authority?
    let plansApproved = (planNotAvail || this.getF('kotakBbgPlansApprovedNA')) ? 'NA' : this.getF('kotakBbgPlansApproved');

    this.drawKeyValueRow([
      { label: 'd. Name of the Authority granting approvals', value: auth || 'NA' },
      { label: 'e. Are the plans approved?', value: plansApproved || 'NA' },
    ]);

    // f. Commencement Certificate
    let commencementStatus = this.getF('kotakBbgCommencementStatus');
    let commencementStr = commencementStatus === 'Provided' ? `No: ${this.getF('kotakBbgCommencementNo') || '-'}, Date: ${this.getF('kotakBbgCommencementDate') || '-'}` : (commencementStatus || 'NA');

    // g. Occupation Certificate
    let occupationStatus = this.getF('kotakBbgOccupationStatus');
    let occupationStr = occupationStatus === 'Provided' ? `No: ${this.getF('kotakBbgOccupationNo') || '-'}, Date: ${this.getF('kotakBbgOccupationDate') || '-'}` : (occupationStatus || 'NA');

    this.drawKeyValueRow([
      { label: 'f. Commencement Certificate', value: commencementStr },
      { label: 'g. Occupation/Completion certificate', value: occupationStr },
    ]);

    // h. Sale/lease deed details
    let deedType = this.getF('kotakBbgDeedTypeNA') ? 'NA' : (this.getF('kotakBbgDeedType') === 'Custom' ? this.getF('kotakBbgDeedTypeCustom') : this.getF('kotakBbgDeedType'));
    let deedNo = this.getF('kotakBbgDeedNoNA') ? 'NA' : this.getF('kotakBbgDeedNo');
    let deedDate = this.getF('kotakBbgDeedDateNA') ? 'NA' : this.getF('kotakBbgDeedDate');
    let deedSale = this.getF('kotakBbgDeedSaleConsiderationNA') ? 'NA' : this.getF('kotakBbgDeedSaleConsideration');
    
    let deedParts = [];
    if (deedType) deedParts.push(deedType);
    if (deedNo) deedParts.push(deedNo === 'NA' ? 'No: NA' : `No: ${deedNo}`);
    if (deedDate) deedParts.push(deedDate === 'NA' ? 'Date: NA' : `Date: ${deedDate}`);
    if (deedSale) deedParts.push(deedSale === 'NA' ? 'Sale Consideration: NA' : `INR ${deedSale}`);
    let deedStr = deedParts.length > 0 ? deedParts.join(', ') : '';

    this.drawKeyValueRow([
      { label: 'h. Sale/lease deed details', value: deedStr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // i. Details of other documents perused
    let otherDocs = this.getF('kotakBbgOtherDocsNA') ? 'NA' : [
      ...(this.getF('kotakBbgOtherDocsList') || []),
      this.getF('kotakBbgOtherDocsCustomChecked') ? this.getF('kotakBbgOtherDocsCustom') : null
    ].filter(Boolean).join(', ');

    this.drawKeyValueRow([
      { label: 'i. Details of other documents perused', value: otherDocs || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('5. BUILDING/ FLAT/ OFFICE/ SHOP DETAILS');
    if (this.getF('kotakBbgNatureOfProperty') === 'Vacant Land' && !this.getF('kotakBbgSection5Override')) {
      this.drawKeyValueRow([{ label: 'This section is auto-disabled because Nature of Property is "Vacant Land".', value: '', labelWidth: CONTENT_W, valueWidth: 0 }]);
    } else {
      // a. Type of Construction/ Roofing/ Special architectural features
      let consType = this.getF('kotakBbgConstructionTypeNA') ? 'NA' : (this.getF('kotakBbgConstructionType') === 'Custom' ? this.getF('kotakBbgConstructionTypeCustom') : this.getF('kotakBbgConstructionType'));
      let roofSystem = this.getF('kotakBbgRoofingSystemNA') ? 'NA' : (this.getF('kotakBbgRoofingSystem') === 'Custom' ? this.getF('kotakBbgRoofingSystemCustom') : this.getF('kotakBbgRoofingSystem'));
      let specialFeatures = this.getF('kotakBbgSpecialFeaturesNA') ? 'NA' : this.getF('kotakBbgSpecialFeatures');
      
      let constrParts = [];
      if (consType) constrParts.push(consType);
      if (roofSystem) constrParts.push(roofSystem === 'NA' ? 'Roof: NA' : `Roof: ${roofSystem}`);
      if (specialFeatures) constrParts.push(specialFeatures === 'NA' ? 'Features: NA' : `Features: ${specialFeatures}`);
      let constrStr = constrParts.length > 0 ? constrParts.join(', ') : '';

      this.drawKeyValueRow([
        { label: 'a. Type of Construction / Roofing', value: constrStr || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
      ]);

      // b. Year of construction
      let yearConst = this.getF('kotakBbgYearOfConstructionNA') ? 'NA' : this.getF('kotakBbgYearOfConstruction');

      // c. Stage of construction in %
      let stage = this.getF('kotakBbgStageOfConstructionNA') ? 'NA' : `${this.getF('kotakBbgStageOfConstruction') || '100'}%`;

      this.drawKeyValueRow([
        { label: 'b. Year of construction', value: yearConst || 'NA' },
        { label: 'c. Stage of construction', value: stage },
      ]);

      // d. Residual age of the Property
      let residual = this.getF('kotakBbgResidualStructuralAge');

      // e. No of Floors
      let floors = this.getF('kotakBbgNumberOfFloors');
      let elevation = this.getF('kotakBbgElevationProfile') === 'Custom' ? this.getF('kotakBbgElevationProfileCustom') : this.getF('kotakBbgElevationProfile');
      let floorsStr = [floors ? `${floors} Floors` : null, elevation].filter(Boolean).join(' (');
      if (floorsStr && elevation) floorsStr += ')';

      this.drawKeyValueRow([
        { label: 'd. Residual age of the Property', value: residual || 'NA' },
        { label: 'e. No of Floors', value: floorsStr || 'NA' },
      ]);

      // f. Quality of The Construction
      let quality = this.getF('kotakBbgQualityOfConstructionNA') ? 'NA' : (this.getF('kotakBbgQualityOfConstruction') === 'Custom' ? this.getF('kotakBbgQualityOfConstructionCustom') : this.getF('kotakBbgQualityOfConstruction'));

      // g. Technical details (Finishing, interiors)
      let flooring = 'NA';
      const floorList = Array.isArray(this.getF('kotakBbgFlooringSystem')) ? [...this.getF('kotakBbgFlooringSystem')] : [];
      if (this.getF('kotakBbgFlooringSystemCustomChecked') && this.getF('kotakBbgFlooringSystemCustom')) {
        floorList.push(this.getF('kotakBbgFlooringSystemCustom'));
      }
      if (floorList.length > 0) flooring = floorList.join(', ');

      let fittings = this.getF('kotakBbgFittingsFixtures') === 'Custom' ? this.getF('kotakBbgFittingsFixturesCustom') : this.getF('kotakBbgFittingsFixtures');
      let interiorStr = [flooring !== 'NA' ? `Flooring: ${flooring}` : null, fittings ? `Fittings: ${fittings}` : null, this.getF('kotakBbgExteriorInteriorFinishing')].filter(Boolean).join(' | ');

      this.drawKeyValueRow([
        { label: 'f. Quality of Construction', value: quality || 'NA' },
        { label: 'g. Technical details', value: interiorStr || 'NA' },
      ]);

      // h. Amenities provided in building/ Complex
      let amenitiesList = this.getF('kotakBbgAmenitiesNA') ? 'NA' : [
        ...(Array.isArray(this.getF('kotakBbgAmenities')) ? this.getF('kotakBbgAmenities') : []),
        this.getF('kotakBbgAmenitiesCustomChecked') ? this.getF('kotakBbgAmenitiesCustom') : null
      ].filter(Boolean).join(', ');

      // i. Usage of the property
      let usage = this.getF('kotakBbgUsageOfProperty') === 'Custom' ? this.getF('kotakBbgUsageOfPropertyCustom') : this.getF('kotakBbgUsageOfProperty');

      this.drawKeyValueRow([
        { label: 'h. Amenities provided', value: amenitiesList || 'NA' },
        { label: 'i. Usage of the property', value: usage || 'NA' },
      ]);
    }

    this.drawSectionHeader('6. DETAILS OF MEASUREMENTS');
    
    // a. Area of land
    const docArea = this.getF('kotakBbgLandAreaAcres');
    const autoSqFt = this.getF('kotakBbgLandAreaSqFt');
    const shape = this.getF('kotakBbgShapePhysicalFeaturesNA') ? 'NA' : this.getF('kotakBbgShapePhysicalFeatures');
    const fsi = this.getF('kotakBbgFsiNA') ? 'NA' : `Permissible: ${this.getF('kotakBbgFsiPermissible') || '-'}, Utilized: ${this.getF('kotakBbgFsiUtilized') || '-'}, Balance: ${this.getF('kotakBbgFsiBalance') || '-'}`;
    
    this.drawKeyValueRow([
      { label: 'Documentary Land Area (Acres/Decs)', value: docArea || 'NA' },
      { label: 'Auto-Converted Land Area (Sq.Ft)', value: autoSqFt || 'NA' },
    ]);
    this.drawKeyValueRow([
      { label: 'Shape & Physical Features', value: shape || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'FSI Details (Permissible/Utilized/Balance)', value: fsi, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    // b. Building/ flat/ office/ shop/ unit/ showroom area
    const isVacantLand6 = this.getF('kotakBbgNatureOfProperty') === 'Vacant Land';
    if (isVacantLand6) {
      this.drawKeyValueRow([{ label: 'b. Building Area (Disabled: Nature of Property is Vacant Land)', value: '', labelWidth: CONTENT_W, valueWidth: 0 }]);
    } else {
      const bUnit = this.getF('kotakBbgBuildingUnit') || 'Sq.Ft';
      this.drawKeyValueRow([
        { label: `Total Measured Built-Up Area (${bUnit})`, value: this.getF('kotakBbgTotalBua') || 'NA' },
        { label: `Carpet Area (${bUnit})`, value: this.getF('kotakBbgCarpetAreaNA') ? 'NA' : this.getF('kotakBbgCarpetArea') },
      ]);
      this.drawKeyValueRow([
        { label: `Super Built-Up Area (${bUnit})`, value: this.getF('kotakBbgSbaNA') ? 'NA' : this.getF('kotakBbgSba') },
        { label: 'Basis of building area', value: this.getF('kotakBbgBasisOfBuildingArea') || 'NA' },
      ]);
    }
    
    // c. Deviations/ violations
    const devs = this.getF('kotakBbgDeviationsNA') ? 'NA' : (this.getF('kotakBbgDeviations') === 'Custom' ? this.getF('kotakBbgDeviationsCustom') : this.getF('kotakBbgDeviations'));
    this.drawKeyValueRow([
      { label: 'c. Deviations / Violations', value: devs || 'NA', labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('7. VALUATION CALCULATIONS & RATE ANALYSIS');
    const meth = this.getF('kotakBbgValuationMethodology') === 'Custom' ? this.getF('kotakBbgValuationMethodologyCustom') : this.getF('kotakBbgValuationMethodology');
    this.drawKeyValueRow([
      { label: 'Valuation Methodology Adopted', value: meth, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Source of Rate Selection', value: this.getF('kotakBbgSourceOfRateSelection'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Comparables Relied Upon', value: this.getF('kotakBbgComparablesReliedNA') ? 'NA' : this.getF('kotakBbgComparablesRelied'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    
    let analysisStr = 'NA';
    if (!this.getF('kotakBbgAnalysisComparablesNA')) {
      const br = this.getF('kotakBbgBaseMarketRate');
      const dp = this.getF('kotakBbgDiscountPremium');
      const jn = this.getF('kotakBbgJustificationNarrative');
      analysisStr = `Base Rate: Rs ${br || '0'} | Adj: ${dp || '0'}%\nJustification: ${jn || '-'}`;
    }
    this.drawKeyValueRow([
      { label: 'Analysis of Comparables & Justification', value: analysisStr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawKeyValueRow([
      { label: 'Adopted Land Rate (Rs / sq. ft.)', value: this.getF('kotakBbgAdoptedLandRate'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    let bldgRateStr = 'NA';
    if (!this.getF('kotakBbgAdoptedBuildingRateNA')) {
      const bRates = Array.isArray(this.getF('kotakBbgAdoptedBuildingRateTable')) ? this.getF('kotakBbgAdoptedBuildingRateTable') : [];
      if (bRates.length > 0) {
        bldgRateStr = bRates.map((r: { floor?: string; rate?: string }) => `${r.floor || 'Unknown'}: Rs ${r.rate || '0'}`).join('\n');
      } else {
        bldgRateStr = 'No rates defined';
      }
    }
    this.drawKeyValueRow([
      { label: 'Adopted Building Rate(s) (Rs / sq. ft.)', value: bldgRateStr, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawKeyValueRow([
      { label: 'Valuation Calculations Breakdown', value: this.getF('kotakBbgValuationBreakdown'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: 'Guideline / Circle Rate (Rs / sq. ft.)', value: this.getF('kotakBbgGuidelineRateNA') ? 'NA' : this.getF('kotakBbgGuidelineRate') },
      { label: 'Guideline Valuation', value: this.getF('kotakBbgGuidelineValuation') },
    ]);

    this.drawSectionHeader('8. VALUATION FINANCIAL SUMMARY');
    this.drawKeyValueRow([
      { label: 'Exact Fair Market Value (FMV)', value: this.getF('kotakBbgFmvExact') },
      { label: 'Rounded Fair Market Value (Say Value)', value: this.getF('kotakBbgFmvRounded') },
    ]);
    const rvPct = this.getF('kotakBbgRvPercent') !== undefined ? this.getF('kotakBbgRvPercent') : '90';
    const dvPct = this.getF('kotakBbgDvPercent') !== undefined ? this.getF('kotakBbgDvPercent') : '80';
    this.drawKeyValueRow([
      { label: `Realizable Value (RV) @ ${rvPct}%`, value: this.getF('kotakBbgRv') },
      { label: `Distress Value (DV) @ ${dvPct}%`, value: this.getF('kotakBbgDv') },
    ]);
    const isVacantLand = this.getF('kotakBbgNatureOfProperty') === 'Vacant Land';
    const isIvNA = this.getF('kotakBbgIvNA') !== undefined ? this.getF('kotakBbgIvNA') : isVacantLand;
    this.drawKeyValueRow([
      { label: 'Insurable Value (IV)', value: isIvNA ? 'NA' : this.getF('kotakBbgIv'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawSectionHeader('9. REMARKS / KEY OBSERVATIONS');
    this.drawKeyValueRow([
      { label: 'Standard Disclaimers', value: this.getF('kotakBbgStandardDisclaimers') || "The valuer assumes no responsibility for legal title. The valuation is strictly for bank internal use based on current market trends and visible site conditions.", labelWidth: 200, valueWidth: CONTENT_W - 200 },
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
      { label: 'Final Recommendation', value: rec, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.drawKeyValueRow([
      { label: 'Detailed Remarks & Additional Observations', value: this.getF('kotakBbgRemarksNA') ? 'NA' : this.getF('kotakBbgRemarks'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
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
