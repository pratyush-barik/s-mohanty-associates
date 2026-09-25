import { PDFBankRenderer, CONTENT_W } from '../pdf-bank-renderer';

export class PDFCanFinHomesRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode: string;
  private isCanFinDrawing = false;
  private drawnCover = false;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.fields = fields || {};
    this.projectCode = projectCode || '';
  }

  private fv(key: string, defaultVal = 'NA'): string {
    const val = this.fields[key];
    if (val === undefined || val === null || val === '') return defaultVal;
    return String(val).replace(/[\t\n\r]+/g, ' ').trim();
  }

  private fvChoice(baseKey: string, customKey: string): string {
    const val = this.fv(baseKey, '');
    if (val === 'Custom') return this.fv(customKey);
    return val || 'NA';
  }

  private fvCheckbox(valKey: string, naKey: string): string {
    if (this.fields[naKey]) return 'NA';
    return this.fv(valKey);
  }

  override drawKeyValueRow(items: any[]): void { if (this.isCanFinDrawing) super.drawKeyValueRow(items); }
  override drawSimpleRow(label: string, value: string, highlight?: boolean, bold?: boolean): void {
    if (!this.isCanFinDrawing) return;
    const labelW = Math.round(CONTENT_W * 0.45);
    const valueW = CONTENT_W - labelW;
    super.drawKeyValueRow([{
      label,
      value: value || 'NA',
      labelWidth: labelW,
      valueWidth: valueW,
      highlight,
      labelBold: true,
      valueBold: !!bold,
    }]);
  }

  override drawCenteredTitle(title: string, fontSize?: number, underline?: boolean) {
    if (!this.drawnCover) {
      this.drawnCover = true;
      this.isCanFinDrawing = true;
      
      this.drawCanFinCover();
      this.drawSection2();
      this.drawSection3();
      this.drawSection4();
      this.drawSection5();
      this.drawSection6();
      this.drawSection7();
      this.drawSection8();
      this.drawSection9();
      
      this.isCanFinDrawing = false;
    }
  }

  private drawCanFinCover() {
    this.drawMainHeader('VALUATION REPORT');
    this.drawSectionHeader('1. COVER PAGE DETAILS');
    this.drawSimpleRow('Bank Name', 'CANFIN HOMES LTD', undefined, true);
    this.drawSimpleRow('Project Code', this.projectCode || 'NA');
    this.drawSimpleRow('To', this.fv('to'));
    this.drawSimpleRow('Date of valuation report', this.fv('dateOfValuation'));
    this.drawSimpleRow('Ref No.', this.fv('refNo'));
    this.drawSimpleRow('Property Owner', this.fv('ownerName'));
    this.drawSimpleRow('Applicant / Borrower Name', this.fv('applicantName'));
    this.drawSimpleRow('Address of the Property', this.fv('propertyAddress'));
    this.drawSimpleRow('Pin Code', this.fv('pincode'));
    this.drawSimpleRow('Plot Number', this.fv('plotNo'));
    this.advanceCursor(8);
  }

  private drawSection2() {
    this.drawSectionHeader('2. GENERAL');
    this.drawSimpleRow('Purpose Of Loan', this.fvChoice('canfinHomesPurposeOfLoanDropdown', 'canfinHomesPurposeOfLoanCustom'));
    this.drawSimpleRow('Name of the Customer', this.fv('canfinHomesNameOfCustomer'));
    this.drawSimpleRow('Name of Document holder as per legal docs', this.fv('canfinHomesNameOfDocumentHolderManual'));
    this.drawSimpleRow('Date of Technical Visit', this.fv('canfinHomesDateOfTechnicalVisit'));
    this.drawSimpleRow('Name of The Building/Society', this.fvCheckbox('canfinHomesNameOfTheBuildingSociety', 'canfinHomesNameOfTheBuildingSocietyNA'));
    this.drawSimpleRow('Name of the Builder/Seller', this.fvCheckbox('canfinHomesNameOfTheBuilderSeller', 'canfinHomesNameOfTheBuilderSellerNA'));
    this.drawSimpleRow('Person(s) Met [Name & Designation]', this.fv('canfinHomesPersonsMet'));
    this.advanceCursor(8);
  }

  private drawSection3() {
    this.drawSectionHeader('3. DETAILS OF THE PROPERTY');
    this.drawSimpleRow('Flat/House/Plot No.', this.fv('canfinHomesFlatHousePlotNoManual'));
    this.drawSimpleRow('Type of Property', this.fvChoice('canfinHomesTypeOfPropertyDropdown', 'canfinHomesTypeOfPropertyCustom'));
    this.drawSimpleRow('No. of Stories', this.fv('canfinHomesNoOfStories'));
    this.drawSimpleRow('For Multi storey building: Total no of units', this.fvCheckbox('canfinHomesMultiStoreyTotalUnits', 'canfinHomesMultiStoreyTotalUnitsNA'));
    this.drawSimpleRow('No of Units on each floor', this.fvCheckbox('canfinHomesNoOfUnitsOnEachFloor', 'canfinHomesNoOfUnitsOnEachFloorNA'));
    this.drawSimpleRow('Details of unit', this.fvCheckbox('canfinHomesDetailsOfUnit', 'canfinHomesDetailsOfUnitNA'));
    this.drawSimpleRow('Age Of The property', this.fv('canfinHomesAgeOfTheProperty'));
    this.drawSimpleRow('Residual age of the Property', this.fv('canfinHomesResidualAgeManual'));
    this.drawSimpleRow('Occupancy details', this.fv('canfinHomesOccupancyDetails'));
    if (this.fv('canfinHomesOccupancyDetails') !== 'Self occupied') {
        this.drawSimpleRow('Occupancy Remarks', this.fvCheckbox('canfinHomesOccupancyRemarks', 'canfinHomesOccupancyRemarksNA'));
    }
    this.drawSimpleRow('Technical Address', this.fv('canfinHomesTechnicalAddressManual'));
    this.drawSimpleRow('Legal Address', this.fv('canfinHomesLegalAddressManual'));
    this.drawSimpleRow('Pin Code', this.fv('canfinHomesPinCodeManual'));
    this.drawSimpleRow('Date of Valuation', this.fv('canfinHomesDateOfValuation'));
    this.advanceCursor(8);
  }

  private drawSection4() {
    this.drawSectionHeader('4. SURROUNDINGS, ACCESIBILITY & PROXIMITY TO CIVIL AMENETIES');
    this.drawSimpleRow('Nearest Railway Station', this.fv('canfinHomesNearestRailwayStation'));
    this.drawSimpleRow('Nearest Bus Stand', this.fv('canfinHomesNearestBusStand'));
    this.drawSimpleRow('Nearest Hospital', this.fv('canfinHomesNearestHospital'));
    this.drawSimpleRow('Conditions of Approach Road', this.fvChoice('canfinHomesConditionsOfApproachRoadDropdown', 'canfinHomesConditionsOfApproachRoadCustom'));
    this.drawSimpleRow('Access to property', this.fvChoice('canfinHomesAccessToPropertyDropdown', 'canfinHomesAccessToPropertyCustom'));
    this.drawSimpleRow('Nearby Land Mark', this.fvCheckbox('canfinHomesNearbyLandMark', 'canfinHomesNearbyLandMarkNA'));
    this.drawSimpleRow('Condition of The Locality', this.fvChoice('canfinHomesConditionOfTheLocalityDropdown', 'canfinHomesConditionOfTheLocalityCustom'));
    this.drawSimpleRow('Development of surrounding areas', this.fvChoice('canfinHomesDevelopmentOfSurroundingAreasDropdown', 'canfinHomesDevelopmentOfSurroundingAreasCustom'));
    this.drawSimpleRow('Any board indicating mortgage', this.fv('canfinHomesAnyBoardIndicatingMortgage'));
    if (this.fv('canfinHomesAnyBoardIndicatingMortgage') === 'Yes') {
        this.drawSimpleRow('Name of Bank/Finance Co.', this.fv('canfinHomesNameOfBankFinanceCo'));
    }
    this.drawSimpleRow('Plot/Property Demarcated at Site Mandatory', this.fv('canfinHomesPlotPropertyDemarcated'));
    this.drawSimpleRow('Property Identified through', this.fv('canfinHomesPropertyIdentifiedThrough'));
    
    this.drawSimpleRow('Surroundings as per site visit', `N: ${this.fv('canfinHomesSurroundingsAsPerSiteNorth')} | S: ${this.fv('canfinHomesSurroundingsAsPerSiteSouth')} | E: ${this.fv('canfinHomesSurroundingsAsPerSiteEast')} | W: ${this.fv('canfinHomesSurroundingsAsPerSiteWest')}`);
    this.drawSimpleRow('Surroundings as per Sale deed', `N: ${this.fv('canfinHomesSurroundingsAsPerDeedNorth')} | S: ${this.fv('canfinHomesSurroundingsAsPerDeedSouth')} | E: ${this.fv('canfinHomesSurroundingsAsPerDeedEast')} | W: ${this.fv('canfinHomesSurroundingsAsPerDeedWest')}`);
    
    this.drawSimpleRow('Whether Boundaries matching', this.fv('canfinHomesWhetherBoundariesMatching'));
    if (this.fv('canfinHomesWhetherBoundariesMatching') === 'No') {
        this.drawSimpleRow('Discrepancy found in Boundaries', this.fvCheckbox('canfinHomesDiscrepancyFoundInBoundaries', 'canfinHomesDiscrepancyFoundInBoundariesNA'));
    }
    this.advanceCursor(8);
  }

  private drawSection5() {
    this.drawSectionHeader('5. SURVEY OF CONSTRUCTION');
    this.drawSimpleRow('Nature of Soil', this.fvCheckbox('canfinHomesNatureOfSoil', 'canfinHomesNatureOfSoilNA'));
    this.drawSimpleRow('Type of Construction', this.fvChoice('canfinHomesTypeOfConstructionDropdown', 'canfinHomesTypeOfConstructionCustom'));
    this.drawSimpleRow('Quality of The Construction', this.fvChoice('canfinHomesQualityOfConstructionDropdown', 'canfinHomesQualityOfConstructionCustom'));
    this.drawSimpleRow('Exteriors', this.fvChoice('canfinHomesExteriorsDropdown', 'canfinHomesExteriorsCustom'));
    this.drawSimpleRow('Interiors', this.fvChoice('canfinHomesInteriorsDropdown', 'canfinHomesInteriorsCustom'));
    this.drawSimpleRow('Type of finishing (Paint)', this.fvCheckbox('canfinHomesTypeOfFinishing', 'canfinHomesTypeOfFinishingNA'));
    this.drawSimpleRow('Type of specification used', this.fvCheckbox('canfinHomesTypeOfSpecificationUsed', 'canfinHomesTypeOfSpecificationUsedNA'));
    this.drawSimpleRow('Amenities provided in building/society', this.fvCheckbox('canfinHomesAmenitiesProvided', 'canfinHomesAmenitiesProvidedNA'));
    this.drawSimpleRow('Construction progress up to', this.fvCheckbox('canfinHomesConstructionProgressUpTo', 'canfinHomesConstructionProgressUpToNA'));
    this.drawSimpleRow('Stage of construction in %', this.fv('canfinHomesStageOfConstruction'));
    this.drawSimpleRow('Projected Residual Life (Years)', this.fv('canfinHomesProjectedResidualLifeManual'));
    this.advanceCursor(8);
  }

  private drawSection6() {
    this.drawSectionHeader('6. DOCUMENTS VERIFIED');
    this.drawSimpleRow('Approved plans Details', this.fvCheckbox('canfinHomesApprovedPlansDetails', 'canfinHomesApprovedPlansDetailsNA'));
    this.drawSimpleRow('Commencement Certificate Details', this.fvCheckbox('canfinHomesCommencementCertificateDetails', 'canfinHomesCommencementCertificateDetailsNA'));
    this.drawSimpleRow('Occupation/Completion Details', this.fvCheckbox('canfinHomesOccupationCertificateDetails', 'canfinHomesOccupationCertificateDetailsNA'));
    this.drawSimpleRow('Ownership Documents', this.fvCheckbox('canfinHomesOwnershipDocumentsDetails', 'canfinHomesOwnershipDocumentsDetailsNA'));
    this.advanceCursor(8);
  }

  private drawSection7() {
    this.drawSectionHeader('7. VALUATION REPORT');
    this.drawSimpleRow('Date Of Visit', this.fv('canfinHomesDateOfVisitManual'));
    this.drawSimpleRow('Type of Locality', this.fvChoice('canfinHomesTypeOfLocalityDropdown', 'canfinHomesTypeOfLocalityCustom'));
    this.drawSimpleRow('Land Area (if applicable)(sqyd/sqmt)', this.fvCheckbox('canfinHomesLandArea', 'canfinHomesLandAreaNA'));
    this.drawSimpleRow('Carpet Area as per physical measurement', this.fvCheckbox('canfinHomesCarpetArea', 'canfinHomesCarpetAreaNA'));
    this.drawSimpleRow('Area as per', this.fvCheckbox('canfinHomesAreaAsPer', 'canfinHomesAreaAsPerNA'));
    this.drawSimpleRow('BUA (sq. ft.)', this.fvCheckbox('canfinHomesBUA', 'canfinHomesBUANA'));
    this.drawSimpleRow('Super BUA (sq. ft.)', this.fvCheckbox('canfinHomesSuperBUA', 'canfinHomesSuperBUANA'));
    this.drawSimpleRow('Encroachment on public land', this.fv('canfinHomesEncroachmentOnPublicLand'));
    this.advanceCursor(8);
  }

  private drawSection8() {
    this.drawSectionHeader('8. THE CONDITION OF STRUCTURE');
    this.drawSimpleRow('Major Structural Irregularities/Cracks', this.fv('canfinHomesStructuralIrregularities'));
    if (this.fv('canfinHomesStructuralIrregularities') === 'Yes') {
        this.drawSimpleRow('Structural Irregularities Details', this.fv('canfinHomesStructuralIrregularitiesDetails'));
    }
    
    this.drawSimpleRow('Improvement/Interior Decoration Done', this.fv('canfinHomesImprovementDone'));
    if (this.fv('canfinHomesImprovementDone') === 'Yes') {
        const opts = this.fields.canfinHomesImprovementOptions || {};
        let sel = [];
        if (opts.pop) sel.push('POP');
        if (opts.wallDecoration) sel.push('Wall Decoration');
        if (opts.wallTexture) sel.push('Wall Texture');
        if (opts.fixedFurniture) sel.push('Fixed Furniture');
        if (opts.custom) sel.push(this.fv('canfinHomesImprovementCustomDetails'));
        this.drawSimpleRow('Improvements', sel.length > 0 ? sel.join(', ') : 'NA');
    }
    
    this.drawSimpleRow('Nature of water Supply', this.fvCheckbox('canfinHomesNatureOfWaterSupply', 'canfinHomesNatureOfWaterSupplyNA'));
    this.drawSimpleRow('Govt. Assessed Value', this.fv('canfinHomesGovtAssessedValue'));
    this.drawSimpleRow('Current market land rate', this.fv('canfinHomesCurrentMarketLandRate'));
    this.drawSimpleRow('Construction Market Rate', this.fv('canfinHomesConstructionMarketRate'));
    this.drawSimpleRow('Depreciation % age', this.fv('canfinHomesDepreciationPercentage'));
    this.drawSimpleRow('Recommended/Fair Market Rate (i+ii)', this.fv('canfinHomesFairMarketRateManual'), true, true);
    this.drawSimpleRow('Total Fair Market Value (100%)', this.fv('canfinHomesTotalFairMarketValueManual'), true, true);
    this.drawSimpleRow('Distress Value (80%)', this.fv('canfinHomesDistressValueManual'), true, true);
    this.drawSimpleRow('Realizable Value (90%)', this.fv('canfinHomesRealizableValueManual'), true, true);
    this.advanceCursor(8);
  }

  private drawSection9() {
    this.drawSectionHeader('9. CONCLUDING DECLARATIONS');
    this.drawSimpleRow('Remarks / Note', this.fv('canfinHomesRemarks'));
    this.drawSimpleRow('Date', this.fv('canfinHomesDeclarationDateManual'));
    const decls = this.fields.canfinHomesDeclarations || {};
    const allAccepted = decls.pt1 && decls.pt2 && decls.pt3 && decls.pt4 && decls.pt5;
    this.drawSimpleRow('Declarations Accepted', allAccepted ? 'Yes (All 5 points accepted)' : 'No', undefined, true);
    this.advanceCursor(8);
  }
}
