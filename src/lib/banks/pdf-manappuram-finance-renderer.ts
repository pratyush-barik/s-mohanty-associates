import { rgb } from 'pdf-lib';
import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  BORDER_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  fetchBytes,
} from '../pdf-bank-renderer';
import { sanitizeFilenameCode } from '@/lib/utils';

export interface ManappuramBuildingValRow {
  slNo: string;
  item: string;
  plinthArea: string;
  roofHeight: string;
  age: string;
  rate: string;
  replacementCost: string;
  depreciation: string;
  netValue: string;
}

export interface ManappuramWorkEstimateRow {
  slNo: string;
  description: string;
  estimatedCost: string;
}

export interface ManappuramFinanceFields {
  // Top Reference
  refNo?: string;
  projectCode?: string;

  // 1. Customer Details
  branchName?: string;
  applicationNo?: string;
  dateOfTechnicalRequest?: string;
  dateOfReport?: string;
  purposeOfLoan?: string;
  purposeOfValuation?: string;
  nameOfCustomer?: string;
  contactNumberOfCustomer?: string;

  // 2. Property Details
  propertyAddressWithPin?: string;
  legalAddress?: string;
  landMark?: string;
  propertyDetailsSummary?: string;
  ownerName?: string;
  typeOfProperty?: string;
  approvedUsageOfProperty?: string;
  actualUseOfProperty?: string;
  propertyOccupancyDetails?: string;
  withinMunicipalGpLimit?: string;
  occupantName?: string;
  tenantNameAndRent?: string;
  rentReceived?: string;
  occupantRelationship?: string;
  personMetSiteDetails?: string;
  houseDoorSocietyBoard?: string;

  // Proximities
  proximitySchool?: string;
  proximityHospital?: string;
  proximityCollege?: string;

  // Distances
  distanceFromMahofinBranch?: string;
  distanceFromPanchayatRoad?: string;
  distanceFromNearestStateHighway?: string;
  distanceFromNearestNationalHighway?: string;

  // Documents checklist
  documentsProvidedForValuation?: string;
  docTitleDeedWithSro?: string;
  docLandTaxReceipt?: string;
  docPossessionCertificate?: string;
  docEncumbranceCertificate?: string;
  docBuildingTaxReceipt?: string;
  docLocationSketch?: string;

  // 3. Others (How to reach)
  locationHowToReach?: string;
  plotSurveyNo?: string;
  reSurveyNo?: string;
  doorNo?: string;
  villageTsNo?: string;
  wardTaluka?: string;
  mandalDistrict?: string;

  // 4. Land and Building Approval Details
  approvedPlanProvided?: string;
  approvedPlanNoAndDate?: string;
  commencementCertProvided?: string;
  commencementCertNoAndDate?: string;
  occupancyCertAvailable?: string;
  occupancyCertNoAndDate?: string;
  approvingAuthorityName?: string;
  layoutPlanApproved?: string;
  authorityAuthorizedUnderTpAct?: string;
  propertyNonAgricultural?: string;
  nonAgriPermissionGivenBy?: string;
  docsCollectedForNonAgriPermission?: string;

  // Boundaries Sale Deed
  boundNorthSaleDeed?: string;
  boundSouthSaleDeed?: string;
  boundEastSaleDeed?: string;
  boundWestSaleDeed?: string;

  // Boundaries Sketch Map
  boundNorthSketchMap?: string;
  boundSouthSketchMap?: string;
  boundEastSketchMap?: string;
  boundWestSketchMap?: string;

  // Boundaries Site Visit
  boundNorthSiteVisit?: string;
  boundSouthSiteVisit?: string;
  boundEastSiteVisit?: string;
  boundWestSiteVisit?: string;

  // Approval details continued
  dateAndValidityOfApprovedPlan?: string;
  approvedPlanIssuingAuthority?: string;
  planGenuinenessVerified?: string;
  commentsOnAuthenticOfPlan?: string;
  stageOfConstruction?: string;
  stageOfConstructionRecommended?: string;

  // 5. Dimensions & Extent
  dimNorthSite?: string;
  dimNorthDeed?: string;
  dimSouthSite?: string;
  dimSouthDeed?: string;
  dimEastSite?: string;
  dimEastDeed?: string;
  dimWestSite?: string;
  dimWestDeed?: string;
  extentOfPropertyConsidered?: string;

  // 6. Part - A (Valuation of Land)
  sizeOfPlotShape?: string;
  sizeOfPlotSqft?: string;
  sizeNorthSouth?: string;
  sizeEastWest?: string;
  totalExtentOfPlot?: string;
  prevailingMarketRateDetails?: string;
  guidelineRateFromRegistrar?: string;
  glrComparisonJustification?: string;
  assessedAdoptedRateLand?: string;
  estimatedValueOfLand?: string;

  // 7. Part - B (Technical details of the building)
  bldgType?: string;
  bldgConstructionType?: string;
  bldgYearOfConstruction?: string;
  bldgResidualAge?: string;
  bldgFloorsAndHeight?: string;
  bldgPlinthAreaMeasured?: string;
  bldgConditionExterior?: string;
  bldgConditionInterior?: string;

  // Specifications GF / FF
  specFoundationGF?: string;
  specFoundationFF?: string;
  specBasementGF?: string;
  specBasementFF?: string;
  specSuperstructureGF?: string;
  specSuperstructureFF?: string;
  specJoineryGF?: string;
  specJoineryFF?: string;
  specRccWorksGF?: string;
  specRccWorksFF?: string;
  specPlasteringGF?: string;
  specPlasteringFF?: string;
  specFlooringGF?: string;
  specFlooringFF?: string;
  specSpecialFinishGF?: string;
  specSpecialFinishFF?: string;
  specRoofingGF?: string;
  specRoofingFF?: string;
  specDrainageGF?: string;
  specDrainageFF?: string;

  // Compound wall & Electrical (Ground Floor / Other floors)
  specCompoundWallGF?: string;
  specCompoundWallOther?: string;
  specCompoundWallHeightGF?: string;
  specCompoundWallHeightOther?: string;
  specCompoundWallLengthGF?: string;
  specCompoundWallLengthOther?: string;
  specCompoundWallTypeGF?: string;
  specCompoundWallTypeOther?: string;
  specElectricalInstallationGF?: string;
  specElectricalInstallationOther?: string;
  specTypeOfWiringGF?: string;
  specTypeOfWiringOther?: string;

  // Class of fittings
  specClassOfFittingsGF?: string;
  specClassOfFittingsOther?: string;
  specLightPointsGF?: string;
  specLightPointsOther?: string;
  specFanPointsGF?: string;
  specFanPointsOther?: string;
  specSparePlugPointsGF?: string;
  specSparePlugPointsOther?: string;
  specAnyOtherElectricalGF?: string;
  specAnyOtherElectricalOther?: string;

  // Plumbing installation
  specWaterClosetsGF?: string;
  specWaterClosetsOther?: string;
  specWashBasinsGF?: string;
  specWashBasinsOther?: string;
  specUrinalsGF?: string;
  specUrinalsOther?: string;
  specBathTubsGF?: string;
  specBathTubsOther?: string;
  specWaterMeterTapsGF?: string;
  specWaterMeterTapsOther?: string;
  specAnyOtherPlumbingGF?: string;
  specAnyOtherPlumbingOther?: string;

  // Building Valuation Items
  buildingValuationRows?: ManappuramBuildingValRow[];
  totalBuildingValuationCost?: string;

  // Part C - Extra Items
  partCPortico?: string;
  partCOrnamentalDoor?: string;
  partCVerandah?: string;
  partCOverheadWaterTank?: string;
  partCCollapsibleGates?: string;
  partCTotal?: string;

  // Part D - Amenities
  partDWardrobes?: string;
  partDGlazedTiles?: string;
  partDExtraSinksBathTub?: string;
  partDMarbleCeramicFlooring?: string;
  partDInteriorDecorations?: string;
  partDElevationWorks?: string;
  partDPanelingWorks?: string;
  partDAluminumWorks?: string;
  partDAluminumHandRails?: string;
  partDFalseCeiling?: string;
  partDTotal?: string;

  // Part E - Miscellaneous
  partESeparateToilet?: string;
  partELumberRoom?: string;
  partEWaterTankSump?: string;
  partETreesGardening?: string;
  partETotal?: string;

  // Part F - Services
  partFWaterSupply?: string;
  partFDrainage?: string;
  partFCompoundWall?: string;
  partFCbDeposits?: string;
  partFPavement?: string;
  partFTotal?: string;

  // Total Abstract & Summaries
  partATotal?: string;
  partBTotal?: string;
  totalMarketValue?: string;
  realizableValue?: string;
  govtGuidelineValue?: string;
  distressValue?: string;

  // NDMA Parameters
  ndmaSeismicZone?: string;
  ndmaStructureType?: string;
  ndmaFoundationType?: string;
  ndmaRoofType?: string;
  ndmaMasonryType?: string;
  ndmaSoilType?: string;
  ndmaDemolitionRisk?: string;

  // Additional Details if Any
  addlCourtOrderPublicNotices?: string;
  addlSensitiveConcentratedArea?: string;
  addlConstructionWorkStopped?: string;
  addlLongitudeLatitude?: string;
  addlProperFencingDone?: string;
  addlSeparateEntranceAvailable?: string;
  addlMinRoadWidthRequirement?: string;
  addlTypeOfRoadAvailable?: string;
  addlLandLocked?: string;
  addlSpecialRemarks?: string;

  // Acknowledgment
  ackStageOfConstruction?: string;
  ackCompletedWorks?: string;
  remainingWorksRows?: ManappuramWorkEstimateRow[];
  ackTotalRemainingCost?: string;

  // Remarks & Note
  remarks?: string;
  note1?: string;
  note2?: string;

  // Sign-off & Declaration
  declarationPlace?: string;
  declarationDate?: string;
  valuerName?: string;
  valuerSignatory?: string;

  // Attachments
  latitude?: string;
  longitude?: string;
  propertyDocuments?: any[];
  propertyDocumentNames?: string[];
  locationMaps?: any[];
  propertyPhotos?: any[];
  propertyPhotoNames?: string[];
  annexures?: any[];
}

export class PDFManappuramFinanceRenderer extends PDFBankRenderer {
  private f: ManappuramFinanceFields;

  constructor(fields: ManappuramFinanceFields) {
    super();
    this.f = fields || {};
  }

  private getF(key: keyof ManappuramFinanceFields, fallback: string = '-'): string {
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

  private draw2Col(label: string, value: string, boldVal = false, labelW = 200) {
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

  private draw4Col(l1: string, v1: string, l2: string, v2: string, bold2 = false) {
    const halfW = CONTENT_W / 2;
    const labelW = 125;
    const valW = halfW - labelW;
    this.drawKeyValueRow([
      { label: l1, value: v1 || '-', labelWidth: labelW, valueWidth: valW, labelBold: true },
      { label: l2, value: v2 || '-', labelWidth: labelW, valueWidth: valW, labelBold: true, bold: bold2 },
    ]);
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    // ══════════════════════════════════════════════════════════════
    // HEADER & METADATA
    // ══════════════════════════════════════════════════════════════
    this.drawMainHeader('PROPERTY VALUATION REPORT — MANAPPURAM HOME FINANCE LTD.');
    this.advanceCursor(8);

    const refNo = this.getF('refNo', this.f.projectCode || '');
    const repDate = this.getF('dateOfReport', '');

    this.drawKeyValueRow([
      { label: 'Ref. No', value: refNo, labelWidth: 100, valueWidth: 200, labelBold: true, bold: true },
      { label: 'Date of Report', value: repDate, labelWidth: 100, valueWidth: CONTENT_W - 400, labelBold: true },
    ]);
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 1. CUSTOMER DETAILS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Customer Details');
    this.draw2Col('1. MAHOFIN Branch Name', this.getF('branchName'));
    this.draw2Col('2. Application Number', this.getF('applicationNo'));
    this.draw2Col('3. Date of technical request received', this.getF('dateOfTechnicalRequest'));
    this.draw2Col('4. Date of Report', this.getF('dateOfReport'));
    this.draw2Col('5. Purpose of Loan', this.getF('purposeOfLoan'));
    this.draw2Col('6. Purpose of Valuation', this.getF('purposeOfValuation'));
    this.draw2Col('7. Name of Customer', this.getF('nameOfCustomer'), true);
    this.draw2Col('8. Contact number of the customer', this.getF('contactNumberOfCustomer'));
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 2. PROPERTY DETAILS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Property Details');
    this.draw2Col('1. Property Address with Pin code', this.getF('propertyAddressWithPin'));
    this.draw2Col('2. Legal address', this.getF('legalAddress'));
    this.draw2Col('3. Land mark', this.getF('landMark'));
    this.draw2Col('4. Property Details', this.getF('propertyDetailsSummary'));
    this.draw2Col('5. Owner Name', this.getF('ownerName'), true);
    this.draw4Col('6. Type of Property', this.getF('typeOfProperty'), '7. Approved Usage', this.getF('approvedUsageOfProperty'));
    this.draw4Col('8. Actual Use', this.getF('actualUseOfProperty'), '9. Occupancy Details', this.getF('propertyOccupancyDetails'));
    this.draw4Col('10. Within Municipal/GP limit', this.getF('withinMunicipalGpLimit'), 'Person Occupying', this.getF('occupantName'));
    this.draw4Col('11. Tenant Name & Rent', this.getF('tenantNameAndRent'), '12. Expected/Rent Received', this.getF('rentReceived'));
    this.draw4Col('13. Occupant Relationship', this.getF('occupantRelationship'), '14. Person met at site', this.getF('personMetSiteDetails'));
    this.draw2Col('15. Name of House/Door/Society Board', this.getF('houseDoorSocietyBoard'));

    this.advanceCursor(4);
    this.drawSectionHeader('Proximity to Important Civic Amenities & Distances');
    this.draw4Col('a) SCHOOL', this.getF('proximitySchool'), 'a. Distance from MAHOFIN Branch', this.getF('distanceFromMahofinBranch'));
    this.draw4Col('b) HOSPITAL', this.getF('proximityHospital'), 'b. Distance from Panchayat/PWD Road', this.getF('distanceFromPanchayatRoad'));
    this.draw4Col('c) COLLEGE', this.getF('proximityCollege'), 'c. Distance from nearest State Highway', this.getF('distanceFromNearestStateHighway'));
    this.draw2Col('d. Distance from Nearest National Highway', this.getF('distanceFromNearestNationalHighway'));
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // DOCUMENTS PROVIDED & OTHERS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Documents Provided for Valuation & Location Identification');
    this.draw2Col('18. Documents provided for valuation', this.getF('documentsProvidedForValuation'));
    this.draw4Col('Title Deed with SRO', this.getF('docTitleDeedWithSro', 'NA'), 'Land Tax receipt', this.getF('docLandTaxReceipt', 'NA'));
    this.draw4Col('Possession certificate', this.getF('docPossessionCertificate', 'NA'), 'Encumbrance certificate', this.getF('docEncumbranceCertificate', 'NA'));
    this.draw4Col('Building Tax Receipt', this.getF('docBuildingTaxReceipt', 'NA'), 'Location sketch', this.getF('docLocationSketch', 'NA'));

    this.advanceCursor(4);
    this.drawSectionHeader('Others — Location of Property (How to reach)');
    this.draw2Col('19. Location of property (How to reach)', this.getF('locationHowToReach'));
    this.draw4Col('a) Plot No. / Survey No.', this.getF('plotSurveyNo'), 'b) Re. Sy. No.', this.getF('reSurveyNo', 'NA'));
    this.draw4Col('c) Door No.', this.getF('doorNo', 'NA'), 'd) T. S. No. / Village', this.getF('villageTsNo'));
    this.draw4Col('e) Ward / Taluka', this.getF('wardTaluka'), 'f) Mandal / District', this.getF('mandalDistrict'));
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 3. LAND AND BUILDING APPROVAL DETAILS & BOUNDARIES
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Land and Building Approval Details');
    this.draw4Col('1. Approved plan provided Y/N', this.getF('approvedPlanProvided', 'No'), '2. Approved plan number & Date', this.getF('approvedPlanNoAndDate', 'NA'));
    this.draw4Col('3. Commencement Cert. provided', this.getF('commencementCertProvided', 'No'), '4. Commencement Cert. number & Date', this.getF('commencementCertNoAndDate', 'NA'));
    this.draw4Col('5. Occupancy Cert. available', this.getF('occupancyCertAvailable', 'No'), '6. Occupancy Cert. number & Date', this.getF('occupancyCertNoAndDate', 'NA'));
    this.draw2Col('7. Approving Authority Name', this.getF('approvingAuthorityName', 'NA'));
    this.draw4Col('8. Whether layout plan approved', this.getF('layoutPlanApproved', 'No'), '9. Authority authorized under TP Act', this.getF('authorityAuthorizedUnderTpAct', 'No'));
    this.draw2Col('10. Whether property is non-Agricultural land', this.getF('propertyNonAgricultural', 'Homestead'));
    this.draw4Col('11. Non-Agri permission given by', this.getF('nonAgriPermissionGivenBy', 'NA'), '12. Docs for Non-Agri Permission', this.getF('docsCollectedForNonAgriPermission', 'NA'));

    this.advanceCursor(4);
    this.drawSectionHeader('Boundaries Comparison');
    const boundHeaders = ['Direction', 'As per Sale Deed', 'As per Sketch Map', 'As per Site Visit'];
    const boundRows = [
      ['North', this.getF('boundNorthSaleDeed'), this.getF('boundNorthSketchMap'), this.getF('boundNorthSiteVisit')],
      ['South', this.getF('boundSouthSaleDeed'), this.getF('boundSouthSketchMap'), this.getF('boundSouthSiteVisit')],
      ['East', this.getF('boundEastSaleDeed'), this.getF('boundEastSketchMap'), this.getF('boundEastSiteVisit')],
      ['West', this.getF('boundWestSaleDeed'), this.getF('boundWestSketchMap'), this.getF('boundWestSiteVisit')],
    ];
    this.drawTable(boundHeaders, boundRows, [75, 140, 140, 140]);

    this.advanceCursor(6);
    this.drawSectionHeader('Approval Details (Continued) & Work Stage');
    this.draw4Col('g) Date of issue & validity of layout', this.getF('dateAndValidityOfApprovedPlan', 'No'), 'h) Approved plan issuing authority', this.getF('approvedPlanIssuingAuthority', 'NA'));
    this.draw4Col('i) Genuineness verified', this.getF('planGenuinenessVerified', 'NA'), 'j) Valuer comments on authenticity', this.getF('commentsOnAuthenticOfPlan', 'NA'));
    this.draw4Col('k) Stage of Construction', this.getF('stageOfConstruction', '100%'), 'l) Stage of Construction - Recommended', this.getF('stageOfConstructionRecommended', '100%'), true);
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 4. DIMENSIONS & EXTENT
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('15. Dimensions of the Site');
    const dimHeaders = ['Direction', 'At Site (A)', 'As per the Deed (B)'];
    const dimRows = [
      ['North', this.getF('dimNorthSite'), this.getF('dimNorthDeed')],
      ['South', this.getF('dimSouthSite'), this.getF('dimSouthDeed')],
      ['East', this.getF('dimEastSite'), this.getF('dimEastDeed')],
      ['West', this.getF('dimWestSite'), this.getF('dimWestDeed')],
    ];
    this.drawTable(dimHeaders, dimRows, [100, 195, 200]);
    this.draw2Col('16. Extent of Property Considered for Valuation', this.getF('extentOfPropertyConsidered'), true);
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 5. PART - A (VALUATION OF LAND)
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Part - A (Valuation of Land)');
    this.draw4Col('1. Shape of plot', this.getF('sizeOfPlotShape', 'Rectangular'), 'Size of plot (Sqft)', this.getF('sizeOfPlotSqft'));
    this.draw4Col('North & South', this.getF('sizeNorthSouth', 'NA'), 'East & West', this.getF('sizeEastWest', 'NA'));
    this.draw2Col('2. Total extent of the plot', this.getF('totalExtentOfPlot'));
    this.draw2Col('3. Prevailing market rate (details of 2 latest deals in area)', this.getF('prevailingMarketRateDetails', 'NA'));
    this.draw2Col('4. Guideline rate obtained from Registrar’s Office', this.getF('guidelineRateFromRegistrar', 'NA'));
    this.draw2Col('4 a. Variation 20% or more justification with GLR', this.getF('glrComparisonJustification', 'NA'));
    this.draw2Col('5. Assessed / adopted rate of valuation', this.getF('assessedAdoptedRateLand'), true);
    this.draw2Col('6. Estimated value of land', this.getF('estimatedValueOfLand'), true);
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 6. PART - B (TECHNICAL DETAILS OF THE BUILDING & SPECS)
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Part - B (Valuation of Building) — Technical Details');
    this.draw4Col('a) Type of Building', this.getF('bldgType', 'Residential'), 'b) Type of construction', this.getF('bldgConstructionType', 'Load bearing Structure'));
    this.draw4Col('c) Year of construction', this.getF('bldgYearOfConstruction', '07 – Years'), 'Residual age', this.getF('bldgResidualAge', '53– Years'));
    this.draw2Col('d) Number of floors & height including basement', this.getF('bldgFloorsAndHeight', 'Single Storied 10\'6" Height'));
    this.draw2Col('e) Plinth area floor-wise (Measured BUA)', this.getF('bldgPlinthAreaMeasured'));
    this.draw4Col('f) i) Condition Exterior', this.getF('bldgConditionExterior', 'Good'), 'ii) Condition Interior', this.getF('bldgConditionInterior', 'Good'));

    this.advanceCursor(4);
    this.drawSectionHeader('Specifications of Construction (Floor-wise)');
    const specHeaders = ['S.No.', 'Description', 'GF', 'FF'];
    const specRows = [
      ['1.', 'Foundation', this.getF('specFoundationGF', 'Column Structure'), this.getF('specFoundationFF', '')],
      ['2.', 'Basement', this.getF('specBasementGF', 'No'), this.getF('specBasementFF', '')],
      ['3.', 'Superstructure', this.getF('specSuperstructureGF', 'K.B Bricks'), this.getF('specSuperstructureFF', '')],
      ['4.', 'Joinery / Doors & Windows', this.getF('specJoineryGF', 'Country Wood'), this.getF('specJoineryFF', '')],
      ['5.', 'RCC Works', this.getF('specRccWorksGF', 'Column, Lintel, Slab'), this.getF('specRccWorksFF', '')],
      ['6.', 'Plastering', this.getF('specPlasteringGF', 'Cement Plastering'), this.getF('specPlasteringFF', '')],
      ['7.', 'Flooring, Skirting, dadoing', this.getF('specFlooringGF', 'Tile Flooring'), this.getF('specFlooringFF', '')],
      ['8.', 'Special finish (marble, granite, wooden paneling)', this.getF('specSpecialFinishGF', 'marble'), this.getF('specSpecialFinishFF', '')],
      ['9.', 'Roofing including weather proof course', this.getF('specRoofingGF', 'RCC'), this.getF('specRoofingFF', '')],
      ['10.', 'Drainage', this.getF('specDrainageGF', 'No'), this.getF('specDrainageFF', '')],
    ];
    this.drawTable(specHeaders, specRows, [35, 230, 115, 115]);

    this.advanceCursor(4);
    this.drawSectionHeader('Compound Wall & Electrical / Plumbing Installation');
    this.draw4Col('Compound wall', this.getF('specCompoundWallGF', 'No'), 'Height & Length', `${this.getF('specCompoundWallHeightGF', '10.6"')}, ${this.getF('specCompoundWallLengthGF', '-')}`);
    this.draw4Col('Type of construction', this.getF('specCompoundWallTypeGF', 'RCC'), 'Type of wiring', this.getF('specTypeOfWiringGF', 'Yes'));
    this.draw4Col('Class of fittings', this.getF('specClassOfFittingsGF', 'Ordinary'), 'Light & Fan points', `Light: ${this.getF('specLightPointsGF', 'NA')}, Fan: ${this.getF('specFanPointsGF', 'NA')}`);
    this.draw4Col('Water closets & type', this.getF('specWaterClosetsGF', 'YES'), 'Wash basins & Urinals', `Basins: ${this.getF('specWashBasinsGF', '—')}, Urinals: ${this.getF('specUrinalsGF', '—')}`);
    this.draw4Col('Bath tubs', this.getF('specBathTubsGF', '—'), 'Water meter, taps etc.', this.getF('specWaterMeterTapsGF', 'Yes'));
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 7. DETAILS OF VALUATION (AFTER 100% COMPLETION)
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Details of Valuation: (After 100% completion of building)');
    const bldgValHeaders = ['Sl.', 'Item', 'Plinth (Sqft)', 'Roof Ht', 'Age', 'Rate Rs./sqft', 'Replacement Cost', 'Deprec.', 'Net Value'];
    const rows = (this.f.buildingValuationRows && this.f.buildingValuationRows.length > 0)
      ? this.f.buildingValuationRows.map((r, i) => [
          String(i + 1),
          r.item || '-',
          r.plinthArea || '-',
          r.roofHeight || '-',
          r.age || '-',
          r.rate || '-',
          r.replacementCost || '-',
          r.depreciation || '-',
          r.netValue || '-',
        ])
      : [
          ['1', 'GF', '1276', '10\'6"', '7-Year', 'Rs.1700/-', 'Rs.21,69,200/-', '-', 'Rs.21,69,200/-'],
        ];
    this.drawTable(bldgValHeaders, rows, [25, 45, 65, 50, 50, 75, 75, 50, 60]);
    this.draw2Col('Total Net Building Valuation', this.getF('totalBuildingValuationCost'), true);
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 8. PARTS C, D, E, F (EXTRA ITEMS, AMENITIES, MISC, SERVICES)
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Parts C, D, E & F — Extra Items, Amenities, Misc & Services');
    this.draw4Col('Part C - Extra Items Total', this.getF('partCTotal', 'Nil'), 'Part D - Amenities Total', this.getF('partDTotal', 'Nil'));
    this.draw4Col('Part E - Miscellaneous Total', this.getF('partETotal', 'Nil'), 'Part F - Services Total', this.getF('partFTotal', 'Nil'));
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 9. TOTAL ABSTRACT OF THE ENTIRE PROPERTY & VALUATION SUMMARY
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Total Abstract of the Entire Property');
    const absHeaders = ['Part', 'Description', 'Value'];
    const absRows = [
      ['Part- A', 'Land value', this.getF('partATotal')],
      ['Part- B', 'Value of building (On 100% completion)', this.getF('partBTotal')],
      ['Part- C', 'Extra Items', this.getF('partCTotal', 'NA')],
      ['Part- D', 'Amenities', this.getF('partDTotal', 'NA')],
      ['Part- E', 'Miscellaneous', this.getF('partETotal', 'NA')],
      ['Part- F', 'Services', this.getF('partFTotal', 'YES')],
      ['Total', 'Total Market Value', this.getF('totalMarketValue')],
    ];
    this.drawTable(absHeaders, absRows, [60, 275, 160]);

    this.advanceCursor(4);
    this.drawSectionHeader('Valuation Summary');
    const valSumHeaders = ['Sl. No.', 'Description', 'Total Value'];
    const valSumRows = [
      ['1', 'Market Value', this.getF('totalMarketValue')],
      ['2', 'Realizable Value', this.getF('realizableValue')],
      ['3', 'Govt Guideline Value', this.getF('govtGuidelineValue', 'Not Showing')],
      ['4', 'Distress Value', this.getF('distressValue')],
    ];
    this.drawTable(valSumHeaders, valSumRows, [45, 290, 160]);
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 10. NDMA PARAMETERS & ADDITIONAL DETAILS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('NDMA (National Disaster Management Authority) Parameters');
    this.draw2Col('1. Seismic Zone Details', this.getF('ndmaSeismicZone', 'NA'));
    this.draw2Col('2. Structure Type with flooring', this.getF('ndmaStructureType', 'Load Bearing structure GF Building- Tile Flooring'));
    this.draw4Col('3. Foundation Type', this.getF('ndmaFoundationType', 'Concrete'), '4. Roof Type', this.getF('ndmaRoofType', 'RCC'));
    this.draw4Col('5. Type of Masonry', this.getF('ndmaMasonryType', 'K.B Bricks'), '6. Soil Type', this.getF('ndmaSoilType', 'Red Soil'));
    this.draw2Col('7. Demolition Risk if any with reasons', this.getF('ndmaDemolitionRisk', 'NO'));

    this.advanceCursor(4);
    this.drawSectionHeader('Additional Details if Any');
    this.draw4Col('1. Court order / Public Notices', this.getF('addlCourtOrderPublicNotices', 'No'), '2. Sensitive / Concentrated area', this.getF('addlSensitiveConcentratedArea', 'No'));
    this.draw4Col('3. Construction work stopped', this.getF('addlConstructionWorkStopped', 'No'), '4. Fencing of Plot done', this.getF('addlProperFencingDone', 'No'));
    this.draw4Col('5. Separate entrance available', this.getF('addlSeparateEntranceAvailable', 'Yes'), '6. Minimum road width 10 ft', this.getF('addlMinRoadWidthRequirement', 'Yes'));
    this.draw4Col('7. Type of Road at present', this.getF('addlTypeOfRoadAvailable', '10 ft wide CC Road'), '8. Is it land-locked land?', this.getF('addlLandLocked', 'No'));
    this.draw2Col('9. Special remarks (acquisition / CRZ / HT line)', this.getF('addlSpecialRemarks', 'NA'));
    this.advanceCursor(6);

    // ══════════════════════════════════════════════════════════════
    // 11. ACKNOWLEDGMENT & REMAINING WORKS
    // ══════════════════════════════════════════════════════════════
    this.drawSectionHeader('Acknowledgment & Stage of Construction');
    const ackText = `I/here by acknowledge that this structure is (${this.getF('ackStageOfConstruction', '100%')} stage of construction) completed and the works like (${this.getF('ackCompletedWorks', 'RCC Roof, Brick Masonry, Plastering, Flooring')}) are completed till now and remaining works to be completed are mentioned below:`;
    this.drawWrappedTextAt(ackText, MARGIN_L, this.cursorY, CONTENT_W, { align: 'justify' });
    this.advanceCursor(24);

    const remWorkHeaders = ['Sl. No.', 'Description of Works', 'Estimated Cost'];
    const remWorkRows = (this.f.remainingWorksRows && this.f.remainingWorksRows.length > 0)
      ? this.f.remainingWorksRows.map(r => [r.slNo, r.description, r.estimatedCost])
      : [
          ['1', 'Estimated Cost After completion of the building', this.getF('ackTotalRemainingCost', 'Rs.0/-')],
        ];
    this.drawTable(remWorkHeaders, remWorkRows, [50, 315, 130]);
    this.advanceCursor(4);
    this.drawWrappedTextAt('Accordingly the total cost of construction is estimated and finalized.', MARGIN_L, this.cursorY, CONTENT_W, { align: 'left', italic: true });
    this.advanceCursor(16);

    // ══════════════════════════════════════════════════════════════
    // 12. REMARKS, NOTES & SIGN-OFF
    // ══════════════════════════════════════════════════════════════
    this.checkPageBreak(120);
    this.drawSectionHeader('Remarks');
    const remarksText = this.getF('remarks', 'Subject property is a single storied residential building.');
    this.drawWrappedTextAt(remarksText, MARGIN_L, this.cursorY, CONTENT_W, { align: 'justify' });
    this.advanceCursor(24);

    this.drawSectionHeader('Note:-');
    if (this.f.note1) {
      this.drawWrappedTextAt(`1. ${this.f.note1}`, MARGIN_L, this.cursorY, CONTENT_W, { align: 'justify' });
      this.advanceCursor(18);
    }
    if (this.f.note2) {
      this.drawWrappedTextAt(`2. ${this.f.note2}`, MARGIN_L, this.cursorY, CONTENT_W, { align: 'justify' });
      this.advanceCursor(18);
    }

    this.checkPageBreak(80);
    this.advanceCursor(12);
    const decDate = this.getF('declarationDate', repDate);
    const decPlace = this.getF('declarationPlace', 'Bhubaneswar');
    const valuer = this.getF('valuerName', 'M/s S. Mohanty & Associates');
    const signatory = this.getF('valuerSignatory', 'Er. Satyajit Mohanty');

    this.drawKeyValueRow([
      {
        label: `Authorized Signatory:\n${signatory}\nName & Seal`,
        value: `For ${valuer}\nPlace: ${decPlace}\nDate: ${decDate}`,
        labelWidth: 240,
        valueWidth: CONTENT_W - 240,
        labelBold: true,
        bold: true,
      },
    ]);

    // ══════════════════════════════════════════════════════════════
    // 13. UNIVERSAL ENCLOSURES: DOCUMENTS -> MAPS -> PHOTOGRAPHS
    // ══════════════════════════════════════════════════════════════
    const docs = this.f.propertyDocuments || [];
    const maps = this.f.locationMaps || [];
    const photos = this.f.propertyPhotos || [];

    // 1. Documents Gallery
    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }

    // 2. Location & Sketch Maps
    if (maps && maps.length > 0) {
      const lat = this.getF('latitude');
      const lng = this.getF('longitude');
      const mapTitle = lat && lng ? `LOCATION MAP (LAT: ${lat}, LNG: ${lng})` : 'LOCATION MAP';
      await this.drawMapGallery(maps, mapTitle);
    }

    // 3. Site Photographs (Always on a fresh page)
    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PROPERTY SITE PHOTOGRAPHS', 180, true);
    }

    return await this.save();
  }
}
