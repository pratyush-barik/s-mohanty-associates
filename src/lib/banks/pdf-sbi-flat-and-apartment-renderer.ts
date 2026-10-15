/**
 * pdf-sbi-flat-and-apartment-renderer.ts — Dedicated PDF Renderer for State Bank of India Flat & Apartment
 *
 * Supports dual modes via `propertyValuationType`:
 * 1. 'FLAT':
 *    - Title: VALUATION REPORT (IN RESPECT OF FLAT)
 *    - I. GENERAL (1-21 with Deed vs Actual Dimensions / Not Applicable)
 *    - II. APARTMENT BUILDING (1-11 with facilities)
 *    - III. FLAT (1-15 with construction specs, taxes, SBA, carpet, UDS)
 *    - IV. MARKETABILITY (1-3)
 *    - V. RATE (1-4)
 *    - VI. COMPOSITE RATE ADOPTED AFTER DEPRECIATION (Straight-line method)
 *    - Details of Valuation (10-Item Flat & LS amenities table)
 *    - TOTAL ABSTRACT FOR THE ENTIRE PROPERTY (TOTAL FLAT COST)
 * 2. 'LAND_AND_BUILDING':
 *    - Title: VALUATION REPORT (IN RESPECT OF LAND / SITE AND BUILDING)
 *    - I. GENERAL (1-17 with dimensions Deed vs Actual)
 *    - II. CHARACTERISTICS OF THE SITE (1-19: flooding, civic amenities, topography, shape, road, advantages, CRZ)
 *    - Part - A (Valuation of Land: size, extent, prevailing rate, guideline rate, adopted rate, estimated value)
 *    - Part - B (Valuation of Building: technical details, plinth area approval vs actual, condition, age, life)
 *    - Specifications of Construction (Floor-wise: Foundation, Superstructure, Joinery, RCC, Plastering, Flooring, etc.)
 *    - Parts C, D, E (Compound wall, electrical, plumbing, amenities, miscellaneous)
 *    - Details of Valuation (Plinth area floor-wise replacement & depreciation table)
 *    - TOTAL ABSTRACT FOR THE ENTIRE PROPERTY (LAND, BUILDING, EXTRA, AMENITIES, MISC, SERVICES)
 *
 * Both modes conclude with:
 * - Method of Valuation (Dual column container)
 * - REMARKS & FMV / RSV / DSV Opinion summary
 * - Valuer Sign-off & Branch Manager Joint Counter-Inspection Block
 * - DECLARATION FROM VALUERS (Clauses a to z)
 * - PARTICULARS / VALUERS COMMENT (11 Matrix items)
 * - MODEL CODE OF CONDUCT FOR VALUERS (Clauses 1 to 30)
 * - Valuer Association Membership & Declaration
 * - Justification Letter to Branch Head / AGM
 * - Enclosures: Photographs, Maps, Documents
 */

import { rgb } from 'pdf-lib';
import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_SMALL,
  FONT_SIZE_CAPTION,
  LBL_BG,
  OPT_BG,
  LINE_HEIGHT,
  fetchBytes,
} from '../pdf-bank-renderer';

export interface SBIFlatReportFields {
  // Mode toggle
  propertyValuationType?: 'FLAT' | 'LAND_AND_BUILDING';

  // Address to Bank
  toAuthority?: string;
  bankName?: string;
  rboOffice?: string;
  branchAddress?: string;
  districtState?: string;

  // Metadata
  refNo?: string;
  reportDate?: string;
  borrowerName?: string;

  // I. GENERAL
  purposeOfValuation?: string;
  inspectionDate?: string;
  valuationDate?: string;
  documentsProduced?: string[];
  ownerNameAndAddress?: string;
  propertyDescription?: string;

  // Location of property
  plotNo?: string;
  doorNo?: string;
  tsNoVillage?: string;
  wardTaluka?: string;
  mandalDistrict?: string;
  postalAddress?: string;

  // Area classification
  cityTown?: string;
  residentialArea?: string;
  commercialArea?: string;
  industrialArea?: string;
  classificationHighMiddlePoor?: string;
  classificationUrbanRural?: string;
  localBodyLimit?: string;
  govtEnactmentsCovered?: string;
  agriculturalConversion?: string;

  // Boundaries (Point 13)
  boundaryEastVerification?: string;
  boundaryEastDocument?: string;
  boundaryWestVerification?: string;
  boundaryWestDocument?: string;
  boundaryNorthVerification?: string;
  boundaryNorthDocument?: string;
  boundarySouthVerification?: string;
  boundarySouthDocument?: string;

  // Dimensions (Point 14.1 & 14.2)
  dimensionEastDeed?: string;
  dimensionEastActual?: string;
  dimensionWestDeed?: string;
  dimensionWestActual?: string;
  dimensionNorthDeed?: string;
  dimensionNorthActual?: string;
  dimensionSouthDeed?: string;
  dimensionSouthActual?: string;
  coordinatesText?: string;
  latitude?: string;
  longitude?: string;

  extentOfProjectSite?: string;
  extentConsideredValuation?: string;
  occupancyStatusOwnerTenant?: string;
  approvedPlanValidity?: string;
  approvedPlanAuthority?: string;
  approvedPlanAuthenticity?: string;
  valuerCommentsOnPlan?: string;

  // ── FLAT SPECIFIC FIELDS ──
  natureOfApartment?: string;
  aptLocationTsNo?: string;
  aptLocationBlockNo?: string;
  aptLocationWardNo?: string;
  aptLocationVillageCorp?: string;
  aptLocationDoorRoadPin?: string;
  localityDescription?: string;
  yearOfConstruction?: string;
  numberOfFloors?: string;
  typeOfStructure?: string;
  dwellingUnitsCount?: string;
  qualityOfConstruction?: string;
  appearanceOfBuilding?: string;
  maintenanceOfBuilding?: string;

  facilityLift?: string;
  facilityWaterSupply?: string;
  facilitySewerage?: string;
  facilityCarParking?: string;
  facilityCompoundWall?: string;
  facilityPavement?: string;

  flatFloorNumber?: string;
  flatDoorNumber?: string;
  specRoof?: string;
  specFlooring?: string;
  specDoors?: string;
  specWindows?: string;
  specFittings?: string;
  specFinishing?: string;

  assessmentNumber?: string;
  taxPaidName?: string;
  taxAmount?: string;
  electricityConnectionNo?: string;
  meterCardName?: string;
  flatMaintenanceCondition?: string;
  saleDeedExecutedName?: string;
  undividedLandArea?: string;
  superBuiltUpArea?: string;
  floorSpaceIndex?: string;
  carpetArea?: string;
  poshClassMediumOrdinary?: string;
  usageResidentialCommercial?: string;
  flatOccupancyOwnerTenant?: string;
  monthlyRentIfRented?: string;

  marketabilityRating?: string;
  factorsFavoringPotentialValue?: string;
  negativeFactorsObserved?: string;
  sbiFlatMarketabilityRating?: string;
  sbiFlatFactorsFavoringPotentialValue?: string;
  sbiFlatNegativeFactorsObserved?: string;

  comparableSaleInstancesRate?: string;
  adoptedBasicCompositeRate?: string;
  rateBreakupBuildingServices?: string;
  rateBreakupLandOthers?: string;
  guidelineRateLandText?: string;
  guidelineTotalUdsLandValue?: string;
  sbiFlatComparableSaleInstancesRate?: string;
  sbiFlatAdoptedBasicCompositeRate?: string;
  sbiFlatRateBreakupBuildingServices?: string;
  sbiFlatRateBreakupLandOthers?: string;
  sbiFlatGuidelineRateLandText?: string;

  depreciatedBuildingRateAnnualFormula?: string;
  replacementCostOfFlat?: string;
  buildingAge?: string;
  buildingLife?: string;
  depreciationSalvagePercentage?: string;
  depreciationRatio?: string;

  totalCompositeRateArrived?: string;
  finalDepreciatedBuildingRate?: string;
  finalRateLandOther?: string;
  finalTotalCompositeRate?: string;
  sbiFlatDepreciatedBuildingRate?: string;
  sbiFlatReplacementCostOfFlat?: string;
  sbiFlatBuildingAge?: string;
  sbiFlatBuildingLife?: string;
  sbiFlatDepreciationSalvagePercentage?: string;
  sbiFlatDepreciationRatio?: string;
  sbiFlatTotalCompositeRateArrived?: string;
  sbiFlatFinalDepreciatedBuildingRate?: string;
  sbiFlatFinalRateLandOther?: string;
  sbiFlatFinalTotalCompositeRate?: string;

  // Details of valuation (Flat LS items)
  valFlatPresentValue?: string;
  valCarParking?: string;
  valWardrobes?: string;
  valModularKitchen?: string;
  valCupboard?: string;
  valInteriorDecorations?: string;
  valElectricityDeposits?: string;
  valExtraGrillCollapsible?: string;
  valPotentialValue?: string;
  valOthers?: string;
  valTotalEstimated?: string;

  // ── LAND & BUILDING SPECIFIC FIELDS ──
  // Characteristics of the Site (19 Pts)
  siteClassificationLocality?: string;
  siteDevelopmentSurrounding?: string;
  siteFloodingPossibility?: string;
  siteCivicAmenities?: string;
  siteTopographicalLevel?: string;
  siteShapeOfLand?: string;
  siteTypePutUse?: string;
  siteUsageRestriction?: string;
  siteTownPlanningApproved?: string;
  siteCornerOrIntermittent?: string;
  siteRoadFacilities?: string;
  siteRoadTypeAvailable?: string;
  siteRoadWidth?: string;
  siteLandLocked?: string;
  siteWaterPotentiality?: string;
  siteUndergroundSewerage?: string;
  sitePowerSupply?: string;
  siteAdvantage?: string;
  siteSpecialRemarksCRZ?: string;

  // Part A (Valuation of Land)
  landSizeNorthSouth?: string;
  landSizeEastWest?: string;
  landTotalExtent?: string;
  landPrevailingMarketRate?: string;
  landGuidelineRate?: string;
  landGuidelineValue?: string;
  landAdoptedRate?: string;
  landEstimatedMarketValue?: string;

  // Part B (Valuation of Building)
  bldgType?: string;
  bldgTypeConstruction?: string;
  bldgYearConstruction?: string;
  bldgNumberFloorsHeight?: string;
  bldgPlinthApprovalText?: string;
  bldgPlinthActualText?: string;
  bldgConditionExterior?: string;
  bldgConditionInterior?: string;
  bldgApprovedPlanDateValidity?: string;
  bldgApprovedPlanAuthority?: string;
  bldgApprovedPlanGenuineness?: string;
  bldgValuerCommentsPlan?: string;
  bldgAge?: string;
  bldgResidualLife?: string;

  // Floor-wise specifications
  specFoundationGF?: string;
  specFoundationFF?: string;
  specBasementGF?: string;
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

  // Parts C-E (Installations & Amenities)
  compoundWallExist?: string;
  compoundWallHeight?: string;
  compoundWallLength?: string;
  compoundWallType?: string;
  elecWiringType?: string;
  elecClassFittings?: string;
  elecLightPoints?: string;
  elecFanPoints?: string;
  elecPlugPoints?: string;
  plumbingWaterClosets?: string;
  plumbingWashBasins?: string;
  plumbingUrinals?: string;
  plumbingBathTubs?: string;
  plumbingWaterMeterTaps?: string;

  valItems?: Array<{
    particulars: string;
    plinthArea: string;
    roofHeight: string;
    age: string;
    rate: string;
    cost: string;
    depreciation: string;
    netValue: string;
  }>;
  valTotalNetValue?: string;

  // Land & Bldg Abstract Matrix
  abstractGovtLand?: string;
  abstractMarketLand?: string;
  abstractRealizableLand?: string;
  abstractDistressLand?: string;
  abstractGovtBldg?: string;
  abstractMarketBldg?: string;
  abstractRealizableBldg?: string;
  abstractDistressBldg?: string;
  abstractGovtExtra?: string;
  abstractMarketExtra?: string;
  abstractRealizableExtra?: string;
  abstractDistressExtra?: string;
  abstractGovtAmenities?: string;
  abstractMarketAmenities?: string;
  abstractRealizableAmenities?: string;
  abstractDistressAmenities?: string;
  abstractGovtMisc?: string;
  abstractMarketMisc?: string;
  abstractRealizableMisc?: string;
  abstractDistressMisc?: string;
  abstractGovtServices?: string;
  abstractMarketServices?: string;
  abstractRealizableServices?: string;
  abstractDistressServices?: string;
  abstractGovtTotal?: string;
  abstractMarketTotal?: string;
  abstractRealizableTotal?: string;
  abstractDistressTotal?: string;
  abstractGovtOrSay?: string;
  abstractMarketOrSay?: string;
  abstractRealizableOrSay?: string;
  abstractDistressOrSay?: string;

  // Shared Total Abstract (Flat)
  abstractGovtValueLand?: string;
  abstractMarketValue?: string;
  abstractRealizablePct?: string;
  abstractRealizableValue?: string;
  abstractDistressPct?: string;
  abstractDistressValue?: string;
  abstractOrSayGovtLand?: string;
  abstractOrSayMarket?: string;
  abstractOrSayRealizable?: string;
  abstractOrSayDistress?: string;

  // Method of Valuation (Dual container)
  methodOfValuationProcedure?: string;
  methodOfValuationText?: string;

  // Remarks & Opinions
  remarksText?: string;
  opinionMarketValueWords?: string;
  opinionRealizableValueWords?: string;
  opinionGovtLandValueWords?: string;
  opinionDistressValueWords?: string;

  // Valuer & Branch Manager
  valuerName?: string;
  valuerFatherName?: string;
  valuerPan?: string;
  valuerAddress?: string;
  valuerAssociationName?: string;
  valuerMembershipNumber?: string;
  valuerPhone?: string;
  valuerMobile?: string;
  valuerEmail?: string;
  signaturePlace?: string;
  signatureDate?: string;

  bmInspectionDate?: string;
  bmSatisfiedValue?: string;
  bmSatisfiedWords?: string;
  bmSignatureDate?: string;

  particularsItems?: string[];
  justificationLetterSubject?: string;
  justificationLetterBody?: string;

  // Enclosures
  documentImages?: string[];
  documentImageNames?: string[];
  locationMapImages?: string[];
  mouzaMapImages?: string[];
  sketchMapImages?: string[];
  cadastralMapImages?: string[];
  bdaMapImages?: string[];
  propertyImages?: string[];
  propertyImageNames?: string[];

  [key: string]: any;
}

export class PDFSBIFlatAndApartmentRenderer extends PDFBankRenderer {
  private reportFields: SBIFlatReportFields;
  private projectCode?: string;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.reportFields = fields || {};
    this.projectCode = projectCode;
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    const isLandAndBldg = this.reportFields.propertyValuationType === 'LAND_AND_BUILDING';

    // 1. Main Cover & Questionnaire
    if (isLandAndBldg) {
      this.drawLandAndBuildingQuestionnaire();
    } else {
      this.drawFlatQuestionnaire();
    }

    // 2. Method of Valuation Box
    this.drawMethodOfValuation();

    // 3. Valuer Declaration (Clauses a to z)
    this.drawValuerDeclaration();

    // 4. Particulars / Valuers Comment (11-point matrix)
    this.drawParticularsMatrix();

    // 5. Model Code of Conduct for Valuers (Points 1 to 30)
    this.drawCodeOfConduct();

    // 6. Justification Letter to AGM / Branch Head
    this.drawJustificationLetter();

    // 7. Inherited Attachments: Photographs, Maps, Documents
    await this.drawEnclosures();

    return await this.save();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1A. FLAT QUESTIONNAIRE
  // ──────────────────────────────────────────────────────────────────────────
  private drawFlatQuestionnaire(): void {
    const d = this.reportFields;

    this.cursorY = 20;
    const toLines = [
      'TO,',
      d.toAuthority || 'THE ASST. GENERAL MANAGER,',
      d.bankName || 'STATE BANK OF INDIA,',
      d.rboOffice || 'RBO, PURI, DIST: PURI, ODISHA',
    ];

    for (const line of toLines) {
      this.drawTextAt(line, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 1 });
      this.cursorY += 13;
    }
    this.cursorY += 8;

    this.drawCenteredTitle('(VALUATION REPORT IN RESPECT OF FLAT)', FONT_SIZE_TITLE);
    this.cursorY += 8;

    const refNo = d.refNo || d.reportRefNo || this.projectCode || 'SMA/08/2026/01';
    const repDate = d.reportDate || d.dateOfValuation || '06.08.2026';
    this.drawTextAt(`REF. NO: ${refNo}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    const dtW = this.fontBold.widthOfTextAtSize(`DATE: ${repDate}`, FONT_SIZE);
    this.drawTextAt(`DATE: ${repDate}`, MARGIN_L + CONTENT_W - dtW, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 18;

    // ── SECTION I. GENERAL ──
    this.drawSectionHeaderRow('I.', 'GENERAL');
    this.draw2ColRow('1.', 'Purpose for which the valuation is made', d.sbiFlatPurposeOfValuation || d.purposeOfValuation || d.purpose || 'To assess the present Market Value of the Property for Loan purpose');

    this.drawSubTableRow('2.', [
      { label: 'a) Date of inspection', value: d.sbiFlatInspectionDate || d.inspectionDate || '03.08.2026' },
      { label: 'b) Date on which the valuation is made', value: d.sbiFlatValuationDate || d.valuationDate || d.reportDate || '06.08.2026' },
    ]);

    const docs = (d.sbiFlatDocumentsProduced && d.sbiFlatDocumentsProduced.length > 0)
      ? d.sbiFlatDocumentsProduced
      : ((d.documentsProduced && d.documentsProduced.length > 0) ? d.documentsProduced : ['Sale Deed', '', '']);
    this.drawSubTableRow('3.', [
      { label: 'i)', value: docs[0] || 'Sale Deed' },
      { label: 'ii)', value: docs[1] || '' },
      { label: 'iii)', value: docs[2] || '' },
    ], 'List of documents produced for perusal');

    this.draw2ColRow('4.', 'Name of the Owner and his / their address (es) with Phone no. (details of share of each owner incase of joint ownership)', d.sbiFlatOwnerNameAndAddress || d.ownerNameAndAddress || 'NA');
    this.draw2ColRow('5.', 'Brief description of the property (Including leasehold / freehold etc)', d.sbiFlatPropertyDescription || d.propertyDescription || 'NA');

    this.drawSubTableRow('6.', [
      { label: 'a) Plot No. / Survey No.', value: d.sbiFlatPlotNo || d.plotNo || 'NA' },
      { label: 'b) Door No.', value: d.sbiFlatDoorNo || d.doorNo || 'NA' },
      { label: 'c) T. S. No. / Village', value: d.sbiFlatTsNo || d.tsNoVillage || 'NA' },
      { label: 'd) Ward / Taluka', value: d.sbiFlatWard || d.wardTaluka || 'NA' },
      { label: 'e) Mandal / District', value: d.sbiFlatDistrict || d.mandalDistrict || 'NA' },
    ], 'Location of property');

    this.draw2ColRow('7.', 'Postal address of the property', d.sbiFlatPostalAddress || d.postalAddress || 'NA');

    this.drawSubTableRow('8.', [
      { label: 'City', value: d.cityTown || 'City' },
      { label: 'Residential Area', value: d.sbiFlatCityTownType || d.residentialArea || 'Residential Area' },
      { label: 'Commercial Area', value: d.commercialArea || 'Not Applicable' },
      { label: 'Industrial Area', value: d.industrialArea || 'Not Applicable' },
    ], 'City / Town');

    this.drawSubTableRow('9.', [
      { label: 'i) High / Middle / Poor', value: d.sbiFlatClassOfLocality || d.classificationHighMiddlePoor || 'Middle Class' },
      { label: 'ii) Urban / Semi Urban / Rural', value: d.sbiFlatUrbanRural || d.classificationUrbanRural || 'Urban Area' },
    ], 'Classification of the area');

    this.draw2ColRow('10', 'Coming under Corporation limit/ Village Panchayat / Municipality', d.sbiFlatLocalBodyLimit || d.localBodyLimit || 'Bhubaneswar Municipal Corporation area limit');
    const govtEnactText = d.sbiFlatGovtEnactmentsCovered !== undefined
      ? (d.sbiFlatGovtEnactmentsCovered ? `Yes${d.sbiFlatGovtEnactmentsDetails ? ` (${d.sbiFlatGovtEnactmentsDetails})` : ''}` : 'No')
      : (d.govtEnactmentsCovered || 'No');
    this.draw2ColRow('11', 'Whether covered under any State / Central Govt. enactments (e.g. Urban Land Ceiling Act) or notified under agency area / scheduled area / cantonment area', govtEnactText);
    this.draw2ColRow('12', 'In case it is an agricultural land, any conversion to house site plots is contemplated', d.sbiFlatAgriculturalConversion || d.agriculturalConversion || 'The Plot is already converted to Homestead');

    this.drawBoundariesTable(d);
    this.drawDimensionsTable(d, true);

    const coordsStr = d.sbiFlatCoordinates || d.coordinatesText || ((d.sbiFlatLatitude || d.latitude) && (d.sbiFlatLongitude || d.longitude) ? `Latitude: ${d.sbiFlatLatitude || d.latitude}, Longitude: ${d.sbiFlatLongitude || d.longitude}` : 'NA');
    this.draw2ColRow('14.2', 'Latitude, Longitude and Coordinates of the site', coordsStr);

    this.draw2ColRow('15', 'Extent of the site of the Project', d.sbiFlatExtentOfSiteProject || d.extentOfProjectSite || 'NA');
    this.draw2ColRow('16', 'Extent of the site considered for valuation (least of 14 A & 14 B)', d.sbiFlatExtentOfSiteValuation || d.extentConsideredValuation || 'Not Applicable');
    this.draw2ColRow('17', 'Whether occupied by the owner / tenant? If occupied by tenant, since how long? Rent Received per month.', d.sbiFlatOccupancyStatus || d.occupancyStatusOwnerTenant || 'The Flat is occupied by Owner');
    this.draw2ColRow('18', 'Date of issue and validity of layout of approved map / plan', d.sbiFlatApprovedPlanDateValidity || d.approvedPlanValidity || 'Date of Issue: 29.07.2010\nValidity: 3 Yrs from the approval');
    this.draw2ColRow('19', 'Approved map / plan issuing authority', d.sbiFlatApprovedPlanAuthority || d.approvedPlanAuthority || 'Plan has been approved by BDA');
    const planAuthVerified = d.sbiFlatPlanAuthenticityVerified !== undefined
      ? (d.sbiFlatPlanAuthenticityVerified ? 'Yes, Verified from the authenticated authority' : 'No')
      : (d.approvedPlanAuthenticity || 'Yes, Verified from the authenticated authority');
    this.draw2ColRow('20', 'Whether genuineness or authenticity of approved map / plan is verified', planAuthVerified);
    this.draw2ColRow('21', 'Any other comments by our empanelled valuers on authentic of approved plan', d.sbiFlatValuerCommentsOnPlan || d.valuerCommentsOnPlan || 'Yes, The approval plan is authenticated');

    // ── SECTION II. APARTMENT BUILDING ──
    this.drawSectionHeaderRow('II.', 'APARTMENT BUILDING');
    this.draw2ColRow('1.', 'Nature of the Apartment', d.sbiFlatNatureOfApartment || d.natureOfApartment || 'Residential Apartment');

    this.drawSubTableRow('2.', [
      { label: 'T.S. No', value: d.sbiFlatAptLocationTsNo || d.aptLocationTsNo || 'NA' },
      { label: 'Block No', value: d.sbiFlatAptLocationBlockNo || d.aptLocationBlockNo || 'Tower-A' },
      { label: 'Ward No', value: d.sbiFlatAptLocationWardNo || d.aptLocationWardNo || 'Not Applicable' },
      { label: 'Village/Municipality/Corporation', value: d.sbiFlatAptLocationVillageCorp || d.aptLocationVillageCorp || 'Within Municipal Corporation area limit' },
      { label: 'Door No., Street or Road (Pin Code)', value: d.sbiFlatAptLocationDoorRoadPin || d.aptLocationDoorRoadPin || 'NA' },
    ], 'Location');

    this.draw2ColRow('3.', 'Description of the locality Residential / Commercial / Mixed', d.sbiFlatLocalityDescription || d.localityDescription || 'Residential');
    this.draw2ColRow('4.', 'Year of Construction', d.sbiFlatYearOfConstruction || d.yearOfConstruction || '2010');
    this.draw2ColRow('5.', 'Number of Floors', d.sbiFlatNumberOfFloors || d.numberOfFloors || 'B+G+16 Storied');
    this.draw2ColRow('6.', 'Type of Structure', d.sbiFlatTypeOfStructure || d.typeOfStructure || 'RCC Frame Structure');
    this.draw2ColRow('7.', 'Number of Dwelling units in the building', d.sbiFlatDwellingUnitsCount || d.dwellingUnitsCount || 'Not Verified');
    this.draw2ColRow('8.', 'Quality of Construction', d.sbiFlatQualityOfConstruction || d.qualityOfConstruction || 'Good');
    this.draw2ColRow('9.', 'Appearance of the Building', d.sbiFlatAppearanceOfBuilding || d.appearanceOfBuilding || 'Good');
    this.draw2ColRow('10.', 'Maintenance of the Building', d.sbiFlatMaintenanceOfBuilding || d.maintenanceOfBuilding || 'Good');

    this.drawSubTableRow('11.', [
      { label: 'Lift', value: d.facilityLift || (d.hasLift ? 'Yes' : 'No') },
      { label: 'Protected Water Supply', value: d.facilityWaterSupply || (d.hasWaterSupply ? 'Yes' : 'No') },
      { label: 'Under Ground Sewerage', value: d.facilitySewerage || (d.hasSewerage ? 'Yes' : 'No') },
      { label: 'Car Parking-Open/Covered', value: d.facilityCarParking || (d.hasCarParking ? 'Covered parking' : 'No') },
      { label: 'Does compound wall exist?', value: d.facilityCompoundWall || (d.hasCompoundWall ? 'Yes' : 'No') },
      { label: 'Is pavement laid around the building?', value: d.facilityPavement || (d.hasPavement ? 'Yes' : 'No') },
    ], 'Facilities Available');

    // ── SECTION III. FLAT ──
    this.drawSectionHeaderRow('III.', 'FLAT');
    this.draw2ColRow('1', 'The floor on which the flat is situated', d.sbiFlatFloorNumber || d.flatFloorNumber || '4th Floor');
    this.draw2ColRow('2', 'Door No of the Flat', d.sbiFlatDoorNumber || d.flatDoorNumber || 'Flat No: A-041, Tower-A');

    this.drawSubTableRow('3', [
      { label: 'Roof', value: d.sbiFlatSpecRoof || d.specRoof || 'RCC Roof' },
      { label: 'Flooring', value: d.sbiFlatSpecFlooring || d.specFlooring || 'VT Flooring' },
      { label: 'Doors', value: d.sbiFlatSpecDoors || d.specDoors || 'Hard Ply wood doors' },
      { label: 'Windows', value: d.sbiFlatSpecWindows || d.specWindows || 'Aluminum frame with glass fitting windows' },
      { label: 'Fittings', value: d.sbiFlatSpecFittings || d.specFittings || 'Superior' },
      { label: 'Finishing', value: d.sbiFlatSpecFinishing || d.specFinishing || 'Cement Plastering, Putty, Modular Kitchen, Roof Ceiling with Decorative Light, Cupboard, Wardrobes' },
    ], 'Specifications of the flat');

    this.drawSubTableRow('4', [
      { label: 'Assessment No', value: d.sbiFlatAssessmentNumber || d.assessmentNumber || 'Not Verified' },
      { label: 'Tax paid in name of', value: d.sbiFlatTaxPaidName || d.taxPaidName || 'Not Verified' },
      { label: 'Tax Amount', value: d.sbiFlatTaxAmount || d.taxAmount || 'Not Verified' },
    ]);

    this.drawSubTableRow('5', [
      { label: 'Electricity Service Connection No', value: d.sbiFlatElectricityConnectionNo || d.electricityConnectionNo || 'Not Verified' },
      { label: 'Meter Card in name of', value: d.sbiFlatMeterCardName || d.meterCardName || 'Not Verified' },
    ]);

    this.draw2ColRow('6', 'How is the maintenance of the flat?', d.sbiFlatMaintenanceCondition || d.flatMaintenanceCondition || 'Good');
    this.draw2ColRow('7', 'Sale Deed executed in the name of', d.sbiFlatSaleDeedExecutedName || d.saleDeedExecutedName || 'NA');
    this.draw2ColRow('8', 'What is the undivided area of land as per Sale Deed?', d.sbiFlatUndividedLandArea || d.undividedLandArea || 'Ac.0.012 Dec i.e. 523.00 Sft');
    this.draw2ColRow('9', 'What is the Super Built up Area of the flat?', d.sbiFlatSuperBuiltUpArea || d.superBuiltUpArea || 'Super Built up Area: 1375.00 Sft');
    this.draw2ColRow('10', 'What is the floor space index (app.)', d.sbiFlatFloorSpaceIndex || d.floorSpaceIndex || 'As per approval plan');
    this.draw2ColRow('11', 'What is the Carpet Area of the flat?', d.sbiFlatCarpetArea || d.carpetArea || '948.00 Sft (Approx.)');
    this.draw2ColRow('12', 'Is it Posh/ I class / Medium / Ordinary?', d.sbiFlatPoshClassMediumOrdinary || d.poshClassMediumOrdinary || 'I Class');
    this.draw2ColRow('13', 'Is it being used for Residential or Commercial purpose?', d.sbiFlatUsageResidentialCommercial || d.usageResidentialCommercial || 'Residential Purpose');
    this.draw2ColRow('14', 'Is it Owner-occupied or let out?', d.sbiFlatOccupancyOwnerTenant || d.flatOccupancyOwnerTenant || 'The Flat is occupied by Owner');
    this.draw2ColRow('15', 'If rented, what is the monthly rent?', d.sbiFlatMonthlyRentIfRented || d.monthlyRentIfRented || 'Not Applicable');

    // ── SECTION IV. MARKETABILITY ──
    this.drawSectionHeaderRow('IV.', 'MARKETABILITY');
    this.draw2ColRow('1', 'How is the marketability?', d.sbiFlatMarketabilityRating || d.marketabilityRating || 'Good');
    this.draw2ColRow('2', 'What are the factors favoring for an extra Potential Value?', d.sbiFlatFactorsFavoringPotentialValue || d.factorsFavoringPotentialValue || 'The subject property located in a developed Residential area. All civic amenities are located within 2-3 Km radious.');
    this.draw2ColRow('3', 'Any negative factors are observed which affect the market value in general?', d.sbiFlatNegativeFactorsObserved || d.negativeFactorsObserved || 'Nothing Observed');

    // ── SECTION V. RATE ──
    this.drawSectionHeaderRow('V.', 'RATE');
    this.draw2ColRow('1', 'After analyzing the comparable sale instances, what is the composite rate for a similar flat with same specifications in the adjoining locality?', d.sbiFlatComparableSaleInstancesRate || d.comparableSaleInstancesRate || 'Similar flats getting transacted in range of Rs.9800/- to Rs.10200/- Per Sft of SBA.');
    this.draw2ColRow('2', 'Assuming it is a new construction, what is the adopted basic composite rate of the flat under valuation after comparing with specifications and other factors', d.sbiFlatAdoptedBasicCompositeRate || d.adoptedBasicCompositeRate || 'We have considered the market value as Rs.10000/- Per Sft of SBA.');

    this.drawSubTableRow('3.', [
      { label: 'i Building + Services', value: d.sbiFlatRateBreakupBuildingServices || d.rateBreakupBuildingServices || 'Rs.2500/- Per Sft' },
      { label: 'ii Land + Others', value: d.sbiFlatRateBreakupLandOthers || d.rateBreakupLandOthers || 'Rs.7500/- Per Sft' },
    ], 'Break - up for the rate');

    this.draw2ColRow('4.', "Guideline rate obtained from the Registrar's office (an evidence thereof to be enclosed)", d.sbiFlatGuidelineRateLandText || d.guidelineRateLandText || 'Rs.11,56,32,000/- Per Acre i.e. Rs.2655/- Per Sft\nTotal Value of UDS: 523.00 Sft X Rs.2655/- = Rs.13,88,565/-');

    // ── SECTION VI. COMPOSITE RATE ADOPTED AFTER DEPRECIATION ──
    this.drawSectionHeaderRow('VI', 'COMPOSITE RATE ADOPTED AFTER DEPRECIATION');
    this.drawSubTableRow('1', [
      { label: 'a) Depreciated building rate', value: d.sbiFlatDepreciatedBuildingRate ? `Rs.${d.sbiFlatDepreciatedBuildingRate}/- Per Sft` : (d.depreciatedBuildingRateAnnualFormula || '1.5% Per Annum (1.5% X 10 Yrs = 15%)') },
      { label: 'b) Replacement cost of flat with Services', value: d.sbiFlatReplacementCostOfFlat ? `Rs.${d.sbiFlatReplacementCostOfFlat}/- Per Sft` : (d.replacementCostOfFlat || 'Rs.2500/- X 15% = Rs.375/-\nRs.2500.00 - Rs.375/- = Rs.2125/- Per Sft') },
      { label: 'c) Age of the building', value: d.sbiFlatBuildingAge ? `${d.sbiFlatBuildingAge} Yrs` : (d.buildingAge ? `${d.buildingAge} Yrs` : '10 Yrs') },
      { label: 'd) Life of the building estimated', value: d.sbiFlatBuildingLife ? `${d.sbiFlatBuildingLife} Yrs` : (d.buildingLife ? `${d.buildingLife} Yrs` : '60 Yrs') },
      { label: 'e) Depreciation percentage assuming salvage value as 10%', value: d.sbiFlatDepreciationSalvagePercentage || d.depreciationSalvagePercentage || 'Age: 10 Yrs, Useful Life: 60 Yrs. Salvage Value: 10%. Considering straight-line method of depreciation.' },
      { label: 'f) Depreciated Ratio of the building', value: d.sbiFlatDepreciationRatio || d.depreciationRatio || '1.5% Per Annum' },
    ]);

    this.drawSubTableRow('2', [
      { label: 'a) Total composite rate arrived for valuation', value: d.sbiFlatTotalCompositeRateArrived ? `Rs.${d.sbiFlatTotalCompositeRateArrived}/- Per Sft` : (d.totalCompositeRateArrived || (d.finalTotalCompositeRate ? `Rs.${d.finalTotalCompositeRate}/- Per Sft` : 'Rs.9625/- Per Sft')) },
      { label: 'b) Depreciated building rate', value: d.sbiFlatFinalDepreciatedBuildingRate ? `Rs.${d.sbiFlatFinalDepreciatedBuildingRate}/- Per Sft` : (d.finalDepreciatedBuildingRate ? `Rs.${d.finalDepreciatedBuildingRate}/- Per Sft` : 'Rs.2125/- Per Sft') },
      { label: 'c) Rate for Land & other', value: d.sbiFlatFinalRateLandOther ? `Rs.${d.sbiFlatFinalRateLandOther}/- Per Sft` : (d.finalRateLandOther ? `Rs.${d.finalRateLandOther}/- Per Sft` : 'Rs.7500/- Per Sft') },
      { label: 'd) Total Composite Rate', value: d.sbiFlatFinalTotalCompositeRate ? `Rs.${d.sbiFlatFinalTotalCompositeRate}/- Per Sft` : (d.finalTotalCompositeRate ? `Rs.${d.finalTotalCompositeRate}/- Per Sft` : 'Rs.9625/- Per Sft') },
    ]);

    // Details of Valuation Table (Flat)
    this.drawFlatValuationTable(d);

    // Total Abstract Table (Flat)
    this.drawFlatTotalAbstractTable(d);

    // Remarks & Signatures
    this.drawRemarksAndSignatures(d, true);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1B. LAND & BUILDING QUESTIONNAIRE
  // ──────────────────────────────────────────────────────────────────────────
  private drawLandAndBuildingQuestionnaire(): void {
    const d = this.reportFields;

    this.cursorY = 20;
    const toLines = [
      'TO,',
      d.toAuthority || 'THE BRANCH HEAD,',
      d.bankName || 'IDBI BANK, JHARSUGUDA BRANCH,',
      d.branchAddress || 'DIST: JHARSUGUDA, ODISHA',
    ];

    for (const line of toLines) {
      this.drawTextAt(line, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 1 });
      this.cursorY += 13;
    }
    this.cursorY += 8;

    this.drawCenteredTitle('VALUATION REPORT (IN RESPECT OF LAND / SITE AND BUILDING)', FONT_SIZE_TITLE);
    this.cursorY += 8;

    const refNo = d.refNo || d.reportRefNo || this.projectCode || 'SMA/06/2026/06';
    const repDate = d.reportDate || d.dateOfValuation || '26.06.2026';
    this.drawTextAt(`REF. NO: ${refNo}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    const dtW = this.fontBold.widthOfTextAtSize(`DATE: ${repDate}`, FONT_SIZE);
    this.drawTextAt(`DATE: ${repDate}`, MARGIN_L + CONTENT_W - dtW, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 18;

    // ── SECTION I. GENERAL ──
    this.drawSectionHeaderRow('I.', 'GENERAL');
    this.draw2ColRow('1.', 'Purpose for which the valuation is made', d.purposeOfValuation || 'To assess the present Market Value of the Property');

    this.drawSubTableRow('2.', [
      { label: 'a) Date of inspection', value: d.inspectionDate || '24.06.2026' },
      { label: 'b) Date on which the valuation is made', value: d.valuationDate || d.reportDate || '26.06.2026' },
    ]);

    const docs = d.documentsProduced && d.documentsProduced.length > 0 ? d.documentsProduced : ['ROR, Sale Deed', 'Previous Valuation Report, Approval Letter', 'Sketch Map, Conversion Fees Deposit Receipt'];
    this.drawSubTableRow('3.', [
      { label: 'i)', value: docs[0] || 'ROR, Sale Deed' },
      { label: 'ii)', value: docs[1] || 'Previous Valuation Report, Approval Letter' },
      { label: 'iii)', value: docs[2] || 'Sketch Map, Conversion Fees Deposit Receipt' },
    ], 'List of documents produced for perusal');

    this.draw2ColRow('4.', 'Name of the owner(s) and his / their address (es) with Phone no.', d.ownerNameAndAddress || 'NA');
    this.draw2ColRow('5.', 'Brief description of the property (Including leasehold / freehold etc)', d.propertyDescription || 'NA');

    this.drawSubTableRow('6.', [
      { label: 'a) Plot No. / Survey No.', value: d.plotNo || 'NA' },
      { label: 'b) Door No.', value: d.doorNo || '' },
      { label: 'c) T. S. No. / Village', value: d.tsNoVillage || 'NA' },
      { label: 'd) Ward / Taluka', value: d.wardTaluka || 'NA' },
      { label: 'e) Mandal / District', value: d.mandalDistrict || 'NA' },
    ], 'Location of property');

    this.draw2ColRow('7.', 'Postal address of the property', d.postalAddress || 'NA');

    this.drawSubTableRow('8.', [
      { label: 'Town', value: d.cityTown || 'Town' },
      { label: 'Residential Area', value: d.residentialArea || 'Residential Area' },
      { label: 'Commercial Area', value: d.commercialArea || 'Commercial Area' },
      { label: 'Industrial Area', value: d.industrialArea || 'Not Applicable' },
    ], 'City / Town');

    this.drawSubTableRow('9.', [
      { label: 'i) High / Middle / Poor', value: d.classificationHighMiddlePoor || 'Middle Class' },
      { label: 'ii) Urban / Semi Urban / Rural', value: d.classificationUrbanRural || 'Urban Area' },
    ], 'Classification of the area');

    this.draw2ColRow('10', 'Coming under Corporation limit/ Village Panchayat / Municipality', d.localBodyLimit || 'Jharsuguda Municipality Area Limit');
    this.draw2ColRow('11', 'Whether covered under any State / Central Govt. enactments or notified under agency area / scheduled area / cantonment area', d.govtEnactmentsCovered || 'No');
    this.draw2ColRow('12', 'In case it is an agricultural land, any conversion to house site plots is contemplated', d.agriculturalConversion || 'The Plot is already converted to Homestead,');

    this.drawBoundariesTable(d);
    this.drawDimensionsTable(d, false);

    const coordsStr = d.coordinatesText || (d.latitude && d.longitude ? `Latitude: ${d.latitude}, Longitude: ${d.longitude}` : 'NA');
    this.draw2ColRow('14.2', 'Latitude, Longitude and Coordinates of the site', coordsStr);

    this.draw2ColRow('15', 'Extent of the site', d.extentOfProjectSite || 'Total Area: Ac.0.115 Dec i.e. 5009.00 Sft');
    this.draw2ColRow('16', 'Extent of the site considered for valuation (least of 14 A & 14 B)', d.extentConsideredValuation || 'Total Area: Ac.0.115 Dec i.e. 5009.00 Sft');
    this.draw2ColRow('17', 'Whether occupied by the owner / tenant? Ifoccupied by tenant, since how long? Rent Received per month.', d.occupancyStatusOwnerTenant || 'The Building is occupied by Owner');

    // ── SECTION II. CHARACTERISTICS OF THE SITE (19 Pts) ──
    this.drawSectionHeaderRow('II.', 'CHARACTERISTICS OF THE SITE');
    this.draw2ColRow('1.', 'Classification of locality', d.siteClassificationLocality || 'Developed');
    this.draw2ColRow('2.', 'Development of surrounding areas', d.siteDevelopmentSurrounding || 'The surrounding area has been developed with Residential cum Commercial buildings.');
    this.draw2ColRow('3.', 'Possibility of frequent flooding / sub-merging', d.siteFloodingPossibility || 'No');
    this.draw2ColRow('4.', 'Feasibility to the Civic amenities like school, hospital, bus stop, market etc.', d.siteCivicAmenities || 'All the civic amenities are within 2-3 km radious from the site.');
    this.draw2ColRow('5.', 'Level of land with topographical Conditions', d.siteTopographicalLevel || 'Leveled and Plain');
    this.draw2ColRow('6.', 'Shape of land', d.siteShapeOfLand || 'Regular in Size.');
    this.draw2ColRow('7.', 'Type of use to which it can be put', d.siteTypePutUse || 'Residential Purpose');
    this.draw2ColRow('8.', 'Any usage restriction', d.siteUsageRestriction || 'Industrial');
    this.draw2ColRow('9.', 'Is plot in town planning approved layout?', d.siteTownPlanningApproved || 'No');
    this.draw2ColRow('10.', 'Corner plot or intermittent plot?', d.siteCornerOrIntermittent || 'Intermittent Plot');
    this.draw2ColRow('11.', 'Road facilities', d.siteRoadFacilities || 'Yes, Available at the site');
    this.draw2ColRow('12.', 'Type of road available at present', d.siteRoadTypeAvailable || 'CC Road');
    this.draw2ColRow('13.', 'Width of road – is it below 20 ft. or more than 20 ft.', d.siteRoadWidth || '15 ft Wide Road');
    this.draw2ColRow('14.', 'Is it a land – locked land?', d.siteLandLocked || 'No, It is free land');
    this.draw2ColRow('15.', 'Water potentiality', d.siteWaterPotentiality || 'Good');
    this.draw2ColRow('16.', 'Underground sewerage system', d.siteUndergroundSewerage || 'Yes, Available at the site');
    this.draw2ColRow('17.', 'Is power supply available at the site?', d.sitePowerSupply || 'Yes, Available at the site');
    this.draw2ColRow('18.', 'Advantage of the site', d.siteAdvantage || 'The subject property is situated within a developed Residential cum Commercial Area. All civic amenities are within 2-3 Km radious. Good force sale value.');
    this.draw2ColRow('19.', 'Special remarks, if any, like threat of acquisition of land for public service purposes, road widening etc.', d.siteSpecialRemarksCRZ || 'On enquiry at site, we have not observed or inspected any such type of information like public acquisition and road widening');

    // ── Part – A (Valuation of land) ──
    this.drawSectionHeaderRow('Part – A', 'Valuation of land');
    this.drawSubTableRow('1.', [
      { label: 'North & South', value: d.landSizeNorthSouth || "N: 85'-0\", S: 60'-0\"" },
      { label: 'East & West', value: d.landSizeEastWest || "E: 73'-0\", W: 70'-0\"" },
    ], 'Size of plot');
    this.draw2ColRow('2.', 'Total extent of the plot', d.landTotalExtent || 'Total Area: Ac.0.115 Dec i.e. 5009.00 Sft');
    this.draw2ColRow('3.', 'Prevailing market rate', d.landPrevailingMarketRate || 'Rs.3400/- to Rs.3600/- Per Sft including all developmental charges');
    this.draw2ColRow('4.', "Guideline rate obtained from Registrar's Office", d.landGuidelineRate || 'Govt. Benchmark Value: Rs.6,00,00,000/- Per Acre i.e. Rs.1377/- Per Sft\nGuideline Value of Land= 5009.00 Sft X Rs.1377/- Per Sft =Rs.68,97,393/-');
    this.draw2ColRow('5.', 'Assessed / adopted rate of valuation', d.landAdoptedRate || 'Adopted market rate of the land is Rs.3500/- Per Sft for valuation purpose');
    this.draw2ColRow('6.', 'Estimated value of land', d.landEstimatedMarketValue || 'Total Market Value of Land: 5009.00 Sft X Rs.3500/- Per Sft = Rs.1,75,31,500/-');

    // ── Part – B (Valuation of Building) ──
    this.drawSectionHeaderRow('Part – B', 'Valuation of Building');
    this.drawSubTableRow('1.', [
      { label: 'a) Type of Building (Residential / Commercial/ Industrial)', value: d.bldgType || 'Residential Building' },
      { label: 'b) Type of construction (Load bearing / RCC/ Steel Framed)', value: d.bldgTypeConstruction || 'RCC Frame' },
      { label: 'c) Year of construction', value: d.bldgYearConstruction || 'Year of construction- 2010\nYear of complete - 2015' },
      { label: 'd) Number of floors and height of each floor', value: d.bldgNumberFloorsHeight || "G+3 Storied Building & Height: 10'-6\" each" },
      { label: 'e) Plinth area floor-wise', value: d.bldgPlinthActualText || 'As per Actual:\nRCC Ground Floor Area: 4149.00 Sft\nRCC First Floor Area: 4149.00 Sft\nRCC Second Floor Area: 4149.00 Sft\nRCC Third Floor Area: 1500.00 Sft (Approx.)\nTotal= 13947.00 Sft' },
      { label: 'f) Condition of the building', value: `Exterior: ${d.bldgConditionExterior || 'Good'}\nInterior: ${d.bldgConditionInterior || 'Good'}` },
      { label: 'g) Date of issue and validity of approved plan', value: d.bldgApprovedPlanDateValidity || 'Date of Issue: 02.09.2010\nValidity: 5 Yrs from the approval' },
      { label: 'h) Approved map / plan issuing authority', value: d.bldgApprovedPlanAuthority || 'Approved by Regional Improvement Trust' },
      { label: 'i) Genuineness of approved plan verified', value: d.bldgApprovedPlanGenuineness || 'No such verification done' },
      { label: 'j) Empanelled valuers comment on plan', value: d.bldgValuerCommentsPlan || 'Not Applicable' },
      { label: 'k) Age of the Building', value: d.bldgAge || '11 Yrs' },
      { label: 'l) Residual life of the building', value: d.bldgResidualLife || '54 Yrs' },
    ], 'Technical details of the building');

    // Floor-wise construction specifications table
    this.drawFloorWiseSpecsTable(d);

    // Parts C-E (Installations & Amenities)
    this.drawPartsCDE(d);

    // Details of Valuation Table (Floor-wise building plinth area)
    this.drawBuildingValuationTable(d);

    // Total Abstract Table (Land, Building, Extra, Amenities, Misc, Services)
    this.drawLandAndBldgTotalAbstractTable(d);

    // Remarks & Signatures
    this.drawRemarksAndSignatures(d, false);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sub-table: Boundaries
  // ──────────────────────────────────────────────────────────────────────────
  private drawBoundariesTable(d: SBIFlatReportFields): void {
    const rowH = 18;
    this.checkPageBreak(rowH * 5 + 10);

    const wSl = 24;
    const wTitle = 171;
    const wVerif = 135;
    const wDoc = CONTENT_W - wSl - wTitle - wVerif;

    this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '3.', { bold: true, align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, 'Boundaries of the property', { bold: true, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wVerif, rowH, 'As per Document', { bold: true, align: 'center', fillColor: OPT_BG });
    this.drawCell(MARGIN_L + wSl + wTitle + wVerif, this.cursorY, wDoc, rowH, 'As per Verification', { bold: true, align: 'center', fillColor: OPT_BG });
    this.cursorY += rowH;

    const rows = [
      { dir: 'East', doc: d.sbiFlatBoundaryEastDoc || d.boundaryEastDocument || 'Plot No-4254(Part)', verif: d.sbiFlatBoundaryEastVerif || d.boundaryEastVerification || 'Vacant Land' },
      { dir: 'West', doc: d.sbiFlatBoundaryWestDoc || d.boundaryWestDocument || 'Plot No-4254(Part)', verif: d.sbiFlatBoundaryWestVerif || d.boundaryWestVerification || 'Vacant Land' },
      { dir: 'North', doc: d.sbiFlatBoundaryNorthDoc || d.boundaryNorthDocument || 'Plot No-6940', verif: d.sbiFlatBoundaryNorthVerif || d.boundaryNorthVerification || 'Others Building' },
      { dir: 'South', doc: d.sbiFlatBoundarySouthDoc || d.boundarySouthDocument || 'Road', verif: d.sbiFlatBoundarySouthVerif || d.boundarySouthVerification || 'Road' },
    ];

    for (const r of rows) {
      this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '', { fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, r.dir, { bold: false });
      this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wVerif, rowH, r.doc, { align: 'left' });
      this.drawCell(MARGIN_L + wSl + wTitle + wVerif, this.cursorY, wDoc, rowH, r.verif, { align: 'left' });
      this.cursorY += rowH;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sub-table: Dimensions
  // ──────────────────────────────────────────────────────────────────────────
  private drawDimensionsTable(d: SBIFlatReportFields, isFlat: boolean): void {
    const rowH = 18;
    this.checkPageBreak(rowH * 6 + 10);

    const wSl = 24;
    const wTitle = 171;
    const wDeed = 135;
    const wAct = CONTENT_W - wSl - wTitle - wDeed;

    this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '14.1', { bold: true, align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, 'Dimensions of the site', { bold: true, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wDeed, rowH, 'A', { bold: true, align: 'center', fillColor: OPT_BG });
    this.drawCell(MARGIN_L + wSl + wTitle + wDeed, this.cursorY, wAct, rowH, 'B', { bold: true, align: 'center', fillColor: OPT_BG });
    this.cursorY += rowH;

    this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '', { fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, '', { fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wDeed, rowH, 'As per the Deed', { bold: true, align: 'center', fillColor: OPT_BG });
    this.drawCell(MARGIN_L + wSl + wTitle + wDeed, this.cursorY, wAct, rowH, 'Actual', { bold: true, align: 'center', fillColor: OPT_BG });
    this.cursorY += rowH;

    if (isFlat) {
      const rows = [
        { dir: 'East', deed: d.sbiFlatDimEastDeed || d.dimensionEastDeed || 'Not Applicable (Flat)', act: d.sbiFlatDimEastActual || d.dimensionEastActual || '' },
        { dir: 'West', deed: d.sbiFlatDimWestDeed || d.dimensionWestDeed || 'Not Applicable (Flat)', act: d.sbiFlatDimWestActual || d.dimensionWestActual || '' },
        { dir: 'North', deed: d.sbiFlatDimNorthDeed || d.dimensionNorthDeed || 'Not Applicable (Flat)', act: d.sbiFlatDimNorthActual || d.dimensionNorthActual || '' },
        { dir: 'South', deed: d.sbiFlatDimSouthDeed || d.dimensionSouthDeed || 'Not Applicable (Flat)', act: d.sbiFlatDimSouthActual || d.dimensionSouthActual || '' },
      ];
      for (const r of rows) {
        this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '', { fillColor: LBL_BG });
        this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, r.dir, { bold: false });
        this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wDeed, rowH, r.deed, { align: 'left' });
        this.drawCell(MARGIN_L + wSl + wTitle + wDeed, this.cursorY, wAct, rowH, r.act, { align: 'left' });
        this.cursorY += rowH;
      }
    } else {
      const rows = [
        { dir: 'East', deed: d.dimensionEastDeed || "73'-0\"", act: d.dimensionEastActual || '' },
        { dir: 'West', deed: d.dimensionWestDeed || "70'-0\"", act: d.dimensionWestActual || '' },
        { dir: 'North', deed: d.dimensionNorthDeed || "85'-0\"", act: d.dimensionNorthActual || '' },
        { dir: 'South', deed: d.dimensionSouthDeed || "60'-0\"", act: d.dimensionSouthActual || '' },
      ];
      for (const r of rows) {
        this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '', { fillColor: LBL_BG });
        this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, r.dir, { bold: false });
        this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wDeed, rowH, r.deed, { align: 'left' });
        this.drawCell(MARGIN_L + wSl + wTitle + wDeed, this.cursorY, wAct, rowH, r.act, { align: 'left' });
        this.cursorY += rowH;
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Floor-Wise Construction Specifications Table
  // ──────────────────────────────────────────────────────────────────────────
  private drawFloorWiseSpecsTable(d: SBIFlatReportFields): void {
    this.checkPageBreak(180);
    this.drawTextAt('Specifications of construction (floor-wise) in respect of', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 14;

    const headers = ['SL. No.', 'Description', 'Ground floor', 'First floors'];
    const colW = [40, 215, 120, 126.28];
    const rows = [
      ['1.', 'Foundation', d.specFoundationGF || 'Column Foundation', d.specFoundationFF || 'Column Foundation'],
      ['2.', 'Basement', d.specBasementGF || 'No', ''],
      ['3.', 'Superstructure', d.specSuperstructureGF || 'Brick Masonary Wall', d.specSuperstructureFF || 'Brick Masonary Wall'],
      ['4.', 'Joinery / Doors & Windows', d.specJoineryGF || 'Wooden Penal With Doors & Windows', d.specJoineryFF || 'Wooden Penal With Doors & Windows'],
      ['5.', 'RCC works', d.specRccWorksGF || 'Lintel, Chajja, Beam', d.specRccWorksFF || 'Lintel, Chajja, Beam'],
      ['6.', 'Plastering', d.specPlasteringGF || 'Cement Plastering', d.specPlasteringFF || 'Cement Plastering'],
      ['7.', 'Flooring, Skirting, dadoing', d.specFlooringGF || 'Plain Flooring', d.specFlooringFF || 'VT Flooring'],
      ['8.', 'Special finish as marble, granite etc.', d.specSpecialFinishGF || 'No', d.specSpecialFinishFF || 'No'],
      ['9.', 'Roofing including weather proof course', d.specRoofingGF || 'RCC', d.specRoofingFF || 'RCC'],
      ['10.', 'Drainage', d.specDrainageGF || 'Surface Drainage', ''],
    ];

    this.drawTable(headers, rows, colW, [0], [0, 1], [], [], [], ['center', 'left', 'left', 'left'], ['center', 'center', 'center', 'center']);
    this.cursorY += 12;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Parts C, D, E (Installations & Amenities)
  // ──────────────────────────────────────────────────────────────────────────
  private drawPartsCDE(d: SBIFlatReportFields): void {
    this.checkPageBreak(180);

    // Part C - Electrical & Plumbing
    const headersC = ['SL.', 'PARTICULARS', 'STATUS / DETAILS'];
    const colWC = [35, 230, CONTENT_W - 35 - 230];
    const rowsC = [
      ['1', 'Compound wall exist?', d.compoundWallExist || 'Yes'],
      ['2', 'Electrical installation wiring type', d.elecWiringType || 'Concealed'],
      ['3', 'Class of electrical fittings', d.elecClassFittings || 'Superior'],
      ['4', 'Plumbing installation', 'Yes'],
    ];
    this.drawTable(headersC, rowsC, colWC, [0], [0, 1], [], [], [], ['center', 'left', 'left'], ['center', 'center', 'center']);
    this.cursorY += 14;

    // Part D - Amenities
    this.drawTextAt('Part D- (Amenities)', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    const headersD = ['SL NO.', 'PARTICULARS OF ITEM', 'AMOUNT'];
    const colWD = [45, 320, CONTENT_W - 45 - 320];
    const rowsD = [
      ['1', 'Wardrobes & Cupboard', '-'],
      ['2', 'Modular Kitchen', '-'],
      ['3', 'Extra sinks and bath tub', '-'],
      ['4', 'Marble / Ceramic tiles flooring', '-'],
      ['5', 'Interior decorations', '-'],
      ['6', 'Architectural elevation works', '-'],
      ['7', 'Panelling works', '-'],
      ['8', 'Aluminium works', '-'],
      ['9', 'Aluminium hand rails', '-'],
      ['10', 'False ceiling', '-'],
      ['', 'TOTAL :', '-'],
    ];
    this.drawTable(headersD, rowsD, colWD, [0, 10], [0, 1], [], [], [], ['center', 'left', 'right'], ['center', 'center', 'center']);
    this.cursorY += 14;

    // Part E - Miscellaneous
    this.drawTextAt('Part E- (Miscellaneous)', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    const headersE = ['SL NO.', 'PARTICULARS OF ITEM', 'AMOUNT'];
    const colWE = [45, 320, CONTENT_W - 45 - 320];
    const rowsE = [
      ['1', 'Separate toilet room', '-'],
      ['2', 'Separate lumber room', '-'],
      ['3', 'Separate water tank/ sump', '-'],
      ['4', 'Trees, gardening', '-'],
      ['', 'TOTAL :', '-'],
    ];
    this.drawTable(headersE, rowsE, colWE, [0, 4], [0, 1], [], [], [], ['center', 'left', 'right'], ['center', 'center', 'center']);
    this.cursorY += 14;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Flat Valuation Table (10 items)
  // ──────────────────────────────────────────────────────────────────────────
  private drawFlatValuationTable(d: SBIFlatReportFields): void {
    this.checkPageBreak(150);
    this.drawTextAt('Details of valuation', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE + 1 });
    this.cursorY += 14;

    const headers = ['Sl. No', 'Description', 'Area', 'Rate per unit in Rs.', 'Estimated Value in Rs'];
    const colW = [36, 180, 75, 95, 101.28];
    const rows = [
      ['1', 'Present value of the flat', d.superBuiltUpArea || '1375.00', d.finalTotalCompositeRate || 'Rs. 9,625.00', d.valFlatPresentValue || 'Rs. 13,234,375.00'],
      ['2', 'Car Parking Space in LS', '', '', d.valCarParking || 'Rs. 0.00'],
      ['3', 'Wardrobes in LS', '', '', d.valWardrobes || 'Rs. 0.00'],
      ['4', 'Modular Kitchen Arrangements in LS', '', '', d.valModularKitchen || 'Rs. 0.00'],
      ['5', 'Cupboard in LS', '', '', d.valCupboard || 'Rs. 0.00'],
      ['6', 'Interior Decorations in LS', '', '', d.valInteriorDecorations || 'Rs. 0.00'],
      ['7', 'Electricity deposits / electrical fittings, etc.,', '', '', d.valElectricityDeposits || 'Rs. 0.00'],
      ['8', 'Extra collapsible gates / grill works etc.', '', '', d.valExtraGrillCollapsible || 'Rs. 0.00'],
      ['9', 'Potential value, if any', '', '', d.valPotentialValue || 'Rs. 0.00'],
      ['10', 'Others', '', '', d.valOthers || 'Rs. 0.00'],
    ];

    this.drawTable(headers, rows, colW, [0], [0, 1], [], [], [], ['center', 'left', 'right', 'right', 'right'], ['center', 'left', 'center', 'center', 'center']);

    const rowH = 18;
    const totalW = colW[0] + colW[1] + colW[2] + colW[3];
    this.drawCell(MARGIN_L, this.cursorY, totalW, rowH, 'Total', { bold: true, align: 'right', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + totalW, this.cursorY, colW[4], rowH, d.valTotalEstimated || 'Rs. 13,234,375.00', { bold: true, align: 'right', fillColor: OPT_BG });
    this.cursorY += rowH + 12;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Building Plinth Area Valuation Table (Land & Bldg)
  // ──────────────────────────────────────────────────────────────────────────
  private drawBuildingValuationTable(d: SBIFlatReportFields): void {
    this.checkPageBreak(160);
    this.drawCenteredTitle('Details of valuation', FONT_SIZE_HEADER);
    this.cursorY += 10;

    const headers = [
      'PARTICULARS OF ITEMS',
      'PLINTH AREA IN SQFT',
      'ROOF HEIGHT',
      'AGE OF THE BUILDING IN YEARS',
      'REPLACEMENT RATE OF CONSTRUCTION',
      'ESTIMATED REPLACEMENT COST OF CONSTRUCTION',
      'DEPRECIATION AMOUNT IN RS. (1% per Anm)',
      'NET VALUE AFTER DEPRECIATION',
    ];
    const colW = [75, 45, 40, 45, 65, 75, 65, 77.28];

    const defaultItems = [
      ['GROUND FLOOR (RCC)', '2,504.00', "10'-6\"", '11 YRS', 'Rs. 2,000.00', 'Rs. 50,08,000.00', 'Rs. 5,50,880.00', 'Rs. 44,57,120.00'],
      ['FIRST FLOOR(RCC)', '2,504.00', "10'-6\"", '11 YRS', 'Rs. 1,800.00', 'Rs. 45,07,200.00', 'Rs. 4,95,792.00', 'Rs. 40,11,408.00'],
      ['SECOND FLOOR(RCC)', '2,504.00', "10'-6\"", '11 YRS', 'Rs. 1,900.00', 'Rs. 47,57,600.00', 'Rs. 5,23,336.00', 'Rs. 42,34,264.00'],
    ];

    const rows = d.valItems && d.valItems.length > 0
      ? d.valItems.map(it => [it.particulars, it.plinthArea, it.roofHeight, it.age, it.rate, it.cost, it.depreciation, it.netValue])
      : defaultItems;

    this.drawTable(headers, rows, colW, [0], [0, 1], [], [], [], ['left', 'right', 'center', 'center', 'right', 'right', 'right', 'right'], ['center', 'center', 'center', 'center', 'center', 'center', 'center', 'center']);

    const rowH = 18;
    const totW = colW[0] + colW[1] + colW[2] + colW[3] + colW[4];
    this.drawCell(MARGIN_L, this.cursorY, totW, rowH, 'TOTAL :', { bold: true, align: 'right', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + totW, this.cursorY, colW[5] + colW[6] + colW[7], rowH, d.valTotalNetValue || 'Rs. 1,27,02,792.00', { bold: true, align: 'right', fillColor: OPT_BG });
    this.cursorY += rowH + 16;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Flat Total Abstract Table
  // ──────────────────────────────────────────────────────────────────────────
  private drawFlatTotalAbstractTable(d: SBIFlatReportFields): void {
    this.checkPageBreak(100);
    this.drawCenteredTitle('TOTAL ABSTRACT FOR THE ENTIRE PROPERTY', FONT_SIZE_HEADER);
    this.cursorY += 8;

    const rPct = d.abstractRealizablePct || '95';
    const dPct = d.abstractDistressPct || '85';

    const headers = [
      'PARTICULARS',
      'GOVT. VALUE IN RS OF LAND',
      'MARKET VALUE IN RS.',
      `REALIZABLE VALUE (${rPct}%)`,
      `DISTRESS VALUE (${dPct}%)`,
    ];
    const colW = [105, 96, 96, 95.28, 95];

    const rows = [
      [
        'TOTAL FLAT COST',
        d.abstractGovtValueLand || 'Rs. 1,388,565.00',
        d.abstractMarketValue || 'Rs. 13,234,375.00',
        d.abstractRealizableValue || 'Rs. 12,572,656.25',
        d.abstractDistressValue || 'Rs. 11,249,218.75',
      ],
      [
        'OR SAY',
        d.abstractOrSayGovtLand || 'Rs. 1,389,000.00',
        d.abstractOrSayMarket || 'Rs. 13,234,000.00',
        d.abstractOrSayRealizable || 'Rs. 12,573,000.00',
        d.abstractOrSayDistress || 'Rs. 11,249,000.00',
      ],
    ];

    this.drawTable(headers, rows, colW, [0, 1], [0, 1], [], [], [], ['left', 'right', 'right', 'right', 'right'], ['center', 'center', 'center', 'center', 'center']);
    this.cursorY += 14;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Land & Bldg Total Abstract Table
  // ──────────────────────────────────────────────────────────────────────────
  private drawLandAndBldgTotalAbstractTable(d: SBIFlatReportFields): void {
    this.checkPageBreak(120);
    this.drawCenteredTitle('TOTAL ABSTRACT FOR THE ENTIRE PROPERTY', FONT_SIZE_HEADER);
    this.cursorY += 8;

    const rPct = d.abstractRealizablePct || '95';
    const dPct = d.abstractDistressPct || '85';

    const headers = [
      'PARTICULARS',
      'GOVT. VALUE IN RS.',
      'MARKET VALUE IN RS.',
      `REALIZABLE VALUE (${rPct}%)`,
      `DISTRESS VALUE (${dPct}%)`,
    ];
    const colW = [105, 96, 96, 95.28, 95];

    const rows = [
      ['LAND', d.abstractGovtLand || 'Rs. 68,97,393.00', d.abstractMarketLand || 'Rs. 1,75,31,500.00', d.abstractRealizableLand || 'Rs. 1,66,54,925.00', d.abstractDistressLand || 'Rs. 1,49,01,775.00'],
      ['BUILDING', d.abstractGovtBldg || 'Rs. 0.00', d.abstractMarketBldg || 'Rs. 1,27,02,792.00', d.abstractRealizableBldg || 'Rs. 1,20,67,652.40', d.abstractDistressBldg || 'Rs. 1,07,97,373.20'],
      ['EXTRA ITEMS', d.abstractGovtExtra || 'Rs. 0.00', d.abstractMarketExtra || 'Rs. 0.00', d.abstractRealizableExtra || 'Rs. 0.00', d.abstractDistressExtra || 'Rs. 0.00'],
      ['AMENITIES', d.abstractGovtAmenities || 'Rs. 0.00', d.abstractMarketAmenities || 'Rs. 0.00', d.abstractRealizableAmenities || 'Rs. 0.00', d.abstractDistressAmenities || 'Rs. 0.00'],
      ['MISCELLANEOUS', d.abstractGovtMisc || 'Rs. 0.00', d.abstractMarketMisc || 'Rs. 0.00', d.abstractRealizableMisc || 'Rs. 0.00', d.abstractDistressMisc || 'Rs. 0.00'],
      ['SERVICES', d.abstractGovtServices || 'Rs. 0.00', d.abstractMarketServices || 'Rs. 0.00', d.abstractRealizableServices || 'Rs. 0.00', d.abstractDistressServices || 'Rs. 0.00'],
      ['TOTAL', d.abstractGovtTotal || 'Rs. 68,97,393.00', d.abstractMarketTotal || 'Rs. 3,02,34,292.00', d.abstractRealizableTotal || 'Rs. 2,87,22,577.40', d.abstractDistressTotal || 'Rs. 2,56,99,148.20'],
      ['OR SAY', d.abstractGovtOrSay || 'Rs. 68,97,000.00', d.abstractMarketOrSay || 'Rs. 3,02,34,000.00', d.abstractRealizableOrSay || 'Rs. 2,87,23,000.00', d.abstractDistressOrSay || 'Rs. 2,56,99,000.00'],
    ];

    this.drawTable(headers, rows, colW, [0, 6, 7], [0, 1], [], [], [], ['left', 'right', 'right', 'right', 'right'], ['center', 'center', 'center', 'center', 'center']);
    this.cursorY += 14;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Method of Valuation (Dual Column Container)
  // ──────────────────────────────────────────────────────────────────────────
  private drawMethodOfValuation(): void {
    const d = this.reportFields;
    this.checkPageBreak(120);

    this.drawTextAt('Method of Valuation:', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 12;

    const colW = (CONTENT_W - 10) / 2;
    const defaultGuidance = 'Here, the procedure adopted for arriving at the valuation has to be highlighted. The valuer may consider various approaches of property valuation and state explicitly the reasons for adoption of a particular approach and the basis on which the final valuation judgment is arrived at. A detailed analysis and descriptive account of the approaches, assumptions made, basis adopted, supporting data (in terms of comparable sales), reconciliation of various factors, departures, final valuation arrived at has to be presented here';
    const defaultText = d.methodOfValuationText || 'Valuation of the assets under consideration is carried out on the basis of our perception about the macro & micro economic factors presently governing the real estate industry, location of property, existing market conditions, degree of development of infrastructure in the area, Demand-supply conditions, internal amenities, common amenities etc.\n\nLand & Building method of valuation has been adopted for finding the fair market value of the Property';

    const linesL = this.wrapText(d.methodOfValuationProcedure || defaultGuidance, colW - 12, FONT_SIZE_CAPTION);
    const linesR = this.wrapText(defaultText, colW - 12, FONT_SIZE_CAPTION);
    const maxL = Math.max(linesL.length, linesR.length);
    const boxH = Math.max(90, maxL * FONT_SIZE_CAPTION * LINE_HEIGHT + 14);

    this.checkPageBreak(boxH + 10);
    this.drawCell(MARGIN_L, this.cursorY, colW, boxH, d.methodOfValuationProcedure || defaultGuidance, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + colW, this.cursorY, colW, boxH, defaultText, { fontSize: FONT_SIZE_CAPTION, fillColor: OPT_BG });
    this.cursorY += boxH + 16;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Remarks & Signatures
  // ──────────────────────────────────────────────────────────────────────────
  private drawRemarksAndSignatures(d: SBIFlatReportFields, isFlat: boolean): void {
    this.checkPageBreak(240);

    this.drawTextAt('REMARKS', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 1 });
    this.cursorY += 12;

    const defaultRemarks = isFlat
      ? `SUBJECT PROPERTY IS A 2 BHK FLAT, HAVING SUPER BUILT UP AREA: ${d.superBuiltUpArea || '1375.00 SFT'}. PROPERTY LOCATED IN A DEVELOPED RESIDENTIAL AREA. ALL CIVIC AMENITIES ARE PRESENT WITHIN 2-3 KMS FROM THE PROPERTY. VALUATION HAS BEEN DONE FOR FLAT ONLY.`
      : `THIS IS AN NPA CASE. THE SUBJECT PROPERTY IS A G+3 STORIED RESIDENTIAL BUILDING, LAND EXTENT OF (AC.0.115 DEC I.E. 5009.00 SFT). THE PROPERTY IS LOCATED IN A WELL-DEVELOPED RESIDENTIAL-CUM-COMMERCIAL LOCALITY. ALL CIVIC AMENITIES ARE WITHIN 2-3 KM RADIUS. VALUATION HAS BEEN CARRIED OUT CONSIDERING THE LAND COMPONENT AND APPROVED BUA OF G+2 STORIED BUILDING.`;

    const remarks = d.remarksText || defaultRemarks;
    const rLines = this.wrapText(remarks, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of rLines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 11;
    }
    this.cursorY += 8;

    // Bullets summary
    const fmv = d.abstractOrSayMarket || d.abstractMarketValue || d.abstractMarketTotal || 'Rs. 1,32,34,000/-';
    const rsv = d.abstractOrSayRealizable || d.abstractRealizableValue || d.abstractRealizableTotal || 'Rs. 1,25,73,000/-';
    const dsv = d.abstractOrSayDistress || d.abstractDistressValue || d.abstractDistressTotal || 'Rs. 1,12,49,000/-';
    const bookLand = d.abstractOrSayGovtLand || d.abstractGovtValueLand || d.abstractGovtTotal || 'Rs. 13,89,000/-';

    const bullets = [
      `• The Fair Market value of the Property (FMV): ${fmv}`,
      `• The Realizable Sale Value of the Property (RSV): ${rsv}`,
      `• The Distress Sale value of the Property (DSV): ${dsv}`,
      `• As a result of my appraisal and analysis, it is my considered opinion that the present Fair Market Value of the above property in the prevailing condition with aforesaid specifications is ${fmv} (${d.opinionMarketValueWords || 'Rupees ...'}). The Realizable Value is ${rsv} (${d.opinionRealizableValueWords || 'Rupees ...'}). The book value as of Land is ${bookLand} (${d.opinionGovtLandValueWords || 'Rupees ...'}) and the distress value is ${dsv} (${d.opinionDistressValueWords || 'Rupees ...'}).`,
    ];

    for (const b of bullets) {
      const bLines = this.wrapText(b, CONTENT_W, FONT_SIZE_SMALL);
      for (const bl of bLines) {
        this.drawTextAt(bl, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
        this.cursorY += 11;
      }
      this.cursorY += 3;
    }
    this.cursorY += 20;

    // Approved Valuer Signature
    const valuerSig = '(Name and Official seal of the Approved Valuer)';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Date: ${d.signatureDate || d.reportDate || '06.08.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 35;

    // Branch Manager Counter-Inspection Box
    const bmP = `The undersigned has inspected the property detailed in the Valuation Report on dated ${d.bmInspectionDate || '___________'}. We are satisfied that the fair and reasonable market value of the property is Rs.${d.bmSatisfiedValue || '___________'} (Rupees ${d.bmSatisfiedWords || '__________________________________________________'}).`;
    const bmL = this.wrapText(bmP, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of bmL) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 11;
    }
    this.cursorY += 16;

    const bmSig = '(Name of the Branch Manager with Official seal)';
    const bmSigW = this.fontBold.widthOfTextAtSize(bmSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: ${d.bmSignatureDate || '__________'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - bmSigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(bmSig, MARGIN_L + CONTENT_W - bmSigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 24;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Declaration From Valuers (Clauses a to z)
  // ──────────────────────────────────────────────────────────────────────────
  private drawValuerDeclaration(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 20;

    this.drawCenteredTitle('DECLARATION FROM VALUERS', FONT_SIZE_HEADER);
    this.cursorY += 12;

    const vName = d.valuerName || 'Mr. Satyajit Mohanty';
    const vFather = d.valuerFatherName || 'Mr. Nityananda Mohanty';
    this.drawTextAt(`I ${vName}, S/o: ${vFather} do hereby solemnly affirm and state that:`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 16;

    const panNo = d.valuerPan || 'AONPM6997B';

    const col1Sections = [
      { id: 'a.', text: 'I am citizen of India.' },
      { id: 'b.', text: 'I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointments as valuer or three years after the valuation of assets was conducted by me.' },
      { id: 'c.', text: `The information furnished in my valuation report dated ${d.reportDate || '06.08.2026'} is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.` },
      { id: 'd.', text: `I have personally inspected the property ${d.inspectionDate || '03.08.2026'} & I have valued the property which is identified by customer. The work is not sub-contracted to any other valuer & carried out by myself.` },
      { id: 'e.', text: 'Valuation report is submitted in the format as prescribed by the bank.' },
      { id: 'f.', text: 'I have not been depanelled by any other bank and in case any such depanelment by other banks during my empanelment with you, I will inform you within three days of such depanelment.' },
      { id: 'g.', text: 'I have not been removed from service earlier.' },
      { id: 'h.', text: 'I have not been convicted of any offence & sentenced to a term of imprisonment.' },
      { id: 'i.', text: 'I have not been declared to be unsound mind.' },
      { id: 'j.', text: 'I have not been found guilty of misconduct in my professional capacity.' },
      { id: 'k.', text: 'I am not an undischarged bankrupt, or have not applied to be adjudicated as a bankrupt.' },
      { id: 'l.', text: 'I have not undischarged insolvent.' },
      { id: 'm.', text: 'I have not been levied a penalty under section 271J of Income-Tax Act, 1961 (43 of 1961) and time limit for filing appeal before commissioner of Income Tax (Appeals) or Income-Tax Appellate Tribunal, as the case may be has expired, or such penalty has been confirmed by Income-Tax Appellate Tribunal, and five years have not elapsed after levy of such penalty.' },
    ];

    const col2Sections = [
      { id: 'n.', text: 'I have not been convicted of an offence connected with any proceeding under the Income-Tax Act 1961, wealth Tax Act 1957 or Gift Tax Act 1958.' },
      { id: 'o.', text: `My PAN Card number as applicable is ${panNo}.` },
      { id: 'p.', text: 'I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer.' },
      { id: 'q.', text: 'I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure.' },
      { id: 'r.', text: 'I have read the hand book on policy, standards & procedure for real Estate valuation, 2011 of the IBA & this report is in conformity to the "Standards" enshrined for valuation in the part -B of the above handbook to the best of my knowledge.' },
      { id: 's.', text: 'I have read the International Valuation Standards (IVS) & the report submitted to the Bank for the respective asset class is in conformity to the "Standards" enshrined for valuation in the IVS in "General Standards" & "Asset Standards" as applicable.' },
      { id: 't.', text: 'I abide by the Model Code of Conduct for empanelment of valuer in the Bank.' },
      { id: 'u.', text: 'I am registered under Section 34 AB of the Wealth Tax Act, 1957.' },
      { id: 'v.', text: 'I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI)' },
      { id: 'w.', text: "My CIBIL Score and credit worthiness is as per Bank's guidelines." },
      { id: 'x.', text: 'I am the authorized official of the firm who is competent to sign this valuation report' },
      { id: 'y.', text: 'I will undertake the valuation work on receipt of letter of Engagement generated from the System. (i.e. LLMS/LOS) only' },
      { id: 'z.', text: 'Further, I hereby provide the following information.' },
    ];

    const colW = (CONTENT_W - 20) / 2;
    const startY = this.cursorY;

    let y1 = startY;
    for (const c of col1Sections) {
      this.drawTextAt(c.id, MARGIN_L, y1, { bold: true, fontSize: FONT_SIZE_CAPTION });
      const lines = this.wrapText(c.text, colW - 14, FONT_SIZE_CAPTION);
      for (const l of lines) {
        this.drawTextAt(l, MARGIN_L + 14, y1, { fontSize: FONT_SIZE_CAPTION });
        y1 += 9.5;
      }
      y1 += 4;
    }

    let y2 = startY;
    const col2X = MARGIN_L + colW + 20;
    for (const c of col2Sections) {
      this.drawTextAt(c.id, col2X, y2, { bold: true, fontSize: FONT_SIZE_CAPTION });
      const lines = this.wrapText(c.text, colW - 14, FONT_SIZE_CAPTION);
      for (const l of lines) {
        this.drawTextAt(l, col2X + 14, y2, { fontSize: FONT_SIZE_CAPTION });
        y2 += 9.5;
      }
      y2 += 4;
    }

    this.cursorY = Math.max(y1, y2) + 16;

    // Bottom Valuer Sign-off with membership details
    const valuerSig = '(Name and Official seal of the Approved Valuer)';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: ${d.signatureDate || d.reportDate || '06.08.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 18;

    // Valuer Association credentials
    this.drawTextAt(`Name and address of the Valuer: ${d.valuerAddress || 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)\nPlot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018'}`, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 24;
    this.drawTextAt(`Name of Valuer Association: ${d.valuerAssociationName || 'Approved Valuer from Institution of Valuers (New Delhi), Membership Number: F-26377'}`, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 14;
    this.drawTextAt(`Tel. No: ${d.valuerPhone || '0674-3598459'}, Mobile: ${d.valuerMobile || '99370-23855'}, Email: ${d.valuerEmail || 'Smohantyassociates@gmail.com'}`, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Particulars / Valuers Comment (11-point matrix)
  // ──────────────────────────────────────────────────────────────────────────
  private drawParticularsMatrix(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 20;

    const headers = ['Sl No', 'Particulars', 'Valuers comment'];
    const colW = [30, 225, CONTENT_W - 30 - 225];

    const defaultComments = [
      d.propertyDescription || 'The property is situated in a good developed Residential area of Dumuduma, Bhubaneswar.',
      `To assess the present market value of the property for loan purpose. The Manager of above said bank is the Appointing authority.`,
      `As it is a land & building valuation (We are authorized Valuers for L& B). So, there is no need to appoint an expert for this valuation.`,
      `No such interest is involved`,
      `Date of Appointment: ${d.inspectionDate || '03.08.2026'}\nValuation Date: ${d.inspectionDate || '03.08.2026'}\nDate of Report: ${d.reportDate || '06.08.2026'}`,
      `We Identify the property by customer`,
      `Market transaction values are collected from nearby Builder, Brokers, Local People regarding land value & cost of construction of the building has been derived on basis of CPWD/OPWD rate & Contractors information.`,
      `Land & Building Method. Land value arrived by comparing similar land parcels in that locality while building value arrived by cost incurred to construct a similar house as on date`,
      `No such restrictions founds`,
      `The identification of the property, topography, surrounding development, road development etc`,
      `No such Caveats and limitation.`,
    ];

    const particularsTitles = [
      'Background information of the asset being valued;',
      'Purpose of valuation and appointing authority',
      'Identity of the Valuers and any other experts involved in the valuation;',
      'Disclosure of Valuers interest or conflict, if any;',
      'Date of appointment, valuation date and date of report;',
      'Inspections and/or investigations undertaken;',
      'Nature and sources of the information used or relied upon;',
      'Procedures adopted in carrying out the valuation and valuation standards followed;',
      'Restrictions on use of the report, if any;',
      'Major factors that were taken into account during the valuation;',
      'Caveats, limitations and disclaimers to the extent they explain or elucidate the limitations faced by valuers, which shall not be for the purpose of limiting his responsibility for the valuation report.',
    ];

    const rows = particularsTitles.map((title, i) => [
      String(i + 1),
      title,
      d.particularsItems && d.particularsItems[i] ? d.particularsItems[i] : defaultComments[i],
    ]);

    this.drawTable(headers, rows, colW, [0], [0, 1], [], [], [], ['center', 'left', 'left'], ['center', 'center', 'center']);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Model Code of Conduct (30 clauses)
  // ──────────────────────────────────────────────────────────────────────────
  private drawCodeOfConduct(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 20;

    this.drawCenteredTitle('MODEL CODE OF CONDUCT FOR VALUERS', FONT_SIZE_HEADER);
    this.cursorY += 4;
    this.drawCenteredTitle('{Adopted in line with Companies (Registered Valuers and Valuation Rules, 2017)}', FONT_SIZE_CAPTION);
    this.cursorY += 10;

    this.drawTextAt('All Valuers empanelled with bank shall strictly adhere to the following code of conduct:', MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 12;

    const colW = (CONTENT_W - 20) / 2;

    const col1Sections = [
      {
        header: 'Integrity and Fairness',
        items: [
          '1. A Valuer shall, in the conduct of his/its business, follow high standards of integrity and fairness in all his/its dealings with his/its clients and other Valuers.',
          '2. A Valuer shall maintain integrity by being honest, straightforward, and forthright in all professional relationships.',
          '3. A Valuer shall endeavor to ensure that he/it provides true and adequate information and shall not misrepresent any facts or situations.',
          '4. A Valuer shall refrain from being involved in any action that would bring disrepute to the profession.',
          '5. A Valuer shall keep public interest foremost while delivering his services.',
        ],
      },
      {
        header: 'Professional Competence and Due Care',
        items: [
          '6. A Valuer shall render at all times high standards of service, exercise due diligence, ensure proper care and exercise independent professional judgment.',
          '7. A Valuer shall carry out professional services in accordance with the relevant technical and professional standards that may be specified from time to time',
          '8. A Valuer shall continuously maintain professional knowledge and skill to provide competent professional service based on up-to-date developments in practice, prevailing regulations/guidelines and techniques.',
          '9. In the preparation of a valuation report, the Valuer shall not disclaim liability for his/its expertise or deny his/its duty of care, except to the extent that the assumptions are based on statements of fact provided by the company or its auditors or consultants or information available in public domain and not generated by the Valuer.',
          '10. A Valuer shall not carry out any instruction of the client insofar as they are incompatible with the requirements of integrity, objectivity and independence.',
          '11. A Valuer shall clearly state to his client the services that he would be competent to provide and the services for which he would be relying on other Valuers or professionals or for which the client can have a separate arrangement with other Valuers.',
        ],
      },
      {
        header: 'Independence and Disclosure of Interest',
        items: [
          '12. A Valuer shall act with objectivity in his/its professional dealings by ensuring that his/its decisions are made without the presence of any bias, conflict of interest, coercion, or undue influence of any party, whether directly connected to the valuation assignment or not.',
          '13. A Valuer shall not take up an assignment if he/it or any of his/its relatives or associates is not independent in terms of association to the company.',
          '14. A Valuer shall maintain complete independence in his/its professional relationships and shall conduct the valuation independent of external influences.',
        ],
      },
    ];

    const col2Sections = [
      {
        header: '',
        items: [
          '15. A Valuer shall wherever necessary disclose to the clients, possible sources of conflicts of duties and interests, while providing unbiased services.',
          '16. A Valuer shall not deal in securities of any subject company after any time when he/it first becomes aware of the possibility of his/its association with the valuation, and in accordance with the Securities and Exchange Board of India (Prohibition of Insider Trading) Regulations, 2015 or till the time the valuation report becomes public, whichever is earlier.',
          '17. A Valuer shall not indulge in "mandate snatching" or offering "convenience valuations" in order to cater to a company or client\'s needs.',
          '18. As an independent Valuer, the Valuer shall not charge success fee (Success fees may be defined as a compensation / incentive paid to any third party for successful closure of transaction. In this case, approval of credit proposals).',
          '19. In any fairness opinion or independent expert opinion submitted by a Valuer, if there has been a prior engagement in an unconnected transaction, the Valuer shall declare the association with the company during the last five years.',
        ],
      },
      {
        header: 'Confidentiality',
        items: [
          '20. A Valuer shall not use or divulge to other clients or any other party any confidential information about the subject company, which has come to his/its knowledge without proper and specific authority or unless there is a legal or professional right or duty to disclose.',
          '21. A Valuer shall ensure that he/ it maintains written contemporaneous records for any decision taken, the reasons for taking the decision, and the information and evidence in support of such decision. This shall be maintained so as to sufficiently enable a reasonable person to take a view on the appropriateness of his/its decisions and actions.',
          '22. A Valuer shall appear, co-operate and be available for inspections and investigations carried out by the authority, any person authorized by the authority, the registered values\' organization with which he/it is registered or any other statutory regulatory body.',
          '23. A Valuer shall provide all information and records as may be required by the authority, the Tribunal, Appellate Tribunal, the registered valuers organization with which he/it is registered, or any other statutory regulatory body.',
          '24. A Valuer while respecting the confidentiality of information acquired during the course of performing professional services, shall maintain proper working papers for a period of three years or such longer period as required in its contract for a specific valuation, for production before a regulatory authority or for a peer review. In the event of a pending case before the Tribunal or Appellate Tribunal, the record shall be maintained till the disposal of the case.',
        ],
      },
      {
        header: 'Gifts and hospitality:',
        items: [
          '25. A Valuer or his/its relative shall not accept gifts or hospitality which undermines or affects his independence as a Valuer.\nExplanation — For the purposes of this code the term "relative" shall have the same meaning as Defined in clause (77) of Section 2 of the Companies Act, 2013 (18 of 2013).',
          '26. A Valuer shall not offer gifts or hospitality or a financial or any other advantage to a public servant or any other person with a view to obtain or retain work for himself/ itself, or to obtain or retain an advantage in the conduct of profession for himself/ itself.',
        ],
      },
      {
        header: 'Remuneration and Costs.',
        items: [
          '27. A Valuer shall provide services for remuneration which is charged in a transparent manner, is a reasonable reflection of the work necessarily and properly undertaken, and is not inconsistent with the applicable rules.',
          '28. A Valuer shall not accept any fees or charges other than those which are disclosed in a written contract with the person to whom he would be rendering service.',
        ],
      },
      {
        header: 'Occupation, employability and restrictions.',
        items: [
          '29. A Valuer shall refrain from accepting too many assignments, if he/it is unlikely to be able to devote adequate time to each of his/ its assignments.',
          '30. A Valuer shall not conduct business which in the opinion of the authority or the registered Valuer organization discredits the profession.',
        ],
      },
    ];

    const startY = this.cursorY;
    let y1 = startY;
    for (const sec of col1Sections) {
      if (sec.header) {
        this.drawTextAt(sec.header, MARGIN_L, y1, { bold: true, fontSize: FONT_SIZE_CAPTION + 0.5 });
        y1 += 12;
      }
      for (const it of sec.items) {
        const lines = this.wrapText(it, colW, FONT_SIZE_CAPTION);
        for (const l of lines) {
          this.drawTextAt(l, MARGIN_L, y1, { fontSize: FONT_SIZE_CAPTION });
          y1 += 9.5;
        }
        y1 += 4;
      }
      y1 += 4;
    }

    let y2 = startY;
    const col2X = MARGIN_L + colW + 20;
    for (const sec of col2Sections) {
      if (sec.header) {
        this.drawTextAt(sec.header, col2X, y2, { bold: true, fontSize: FONT_SIZE_CAPTION + 0.5 });
        y2 += 12;
      }
      for (const it of sec.items) {
        const lines = this.wrapText(it, colW, FONT_SIZE_CAPTION);
        for (const l of lines) {
          this.drawTextAt(l, col2X, y2, { fontSize: FONT_SIZE_CAPTION });
          y2 += 9.5;
        }
        y2 += 4;
      }
      y2 += 4;
    }

    this.cursorY = Math.max(y1, y2) + 20;

    const valuerSig = 'Signature of the Approved Valuer and Seal';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: ${d.signatureDate || d.reportDate || '06.08.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Justification Letter
  // ──────────────────────────────────────────────────────────────────────────
  private drawJustificationLetter(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 25;

    const isLandAndBldg = d.propertyValuationType === 'LAND_AND_BUILDING';

    const toLines = isLandAndBldg
      ? [
          'TO,',
          d.toAuthority || 'THE BRANCH HEAD,',
          d.bankName || 'IDBI BANK, JHARSUGUDA BRANCH,',
          d.branchAddress || 'DIST: JHARSUGUDA, ODISHA',
        ]
      : [
          'TO,',
          d.toAuthority || 'THE ASST. GENERAL MANAGER,',
          d.bankName || 'STATE BANK OF INDIA,',
          d.rboOffice || 'RBO, PURI, DIST: PURI, ODISHA',
        ];

    for (const line of toLines) {
      this.drawTextAt(line, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 1 });
      this.cursorY += 13;
    }
    this.cursorY += 14;

    const sub = d.justificationLetterSubject || `Sub: - Justification of valuation Report of ${d.borrowerName || 'Mr. Srijit Mishra, S/o: Mr. Gopinath Mishra'}.`;
    this.drawTextAt(sub, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 20;

    this.drawTextAt('Dear Sir,', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 16;

    const defaultBody = d.justificationLetterBody || (
      isLandAndBldg
        ? `The subject property bearing Khata No: 1212/2894, Plot No: 4254/8796 & 4254/9148, Total Area: Ac.0.115 Dec i.e. 5009.00 Sft, Kissam: Gharabari in Mz: Jharsuguda Unit No- 5 Jharsuguda, Dist: Jharsuguda, Odisha.\n\nThere is a very high difference between Govt. Value and market Value. Govt. Benchmark Value is not revised for that locality recently and to avoid high stamp Duty/Registration Charges Sale Deed are generally executed in under-valued rate.\n\nSo, the value given by us is justified considering the present market scenario.`
        : `The subject property bearing Khata No:432/1656, 432/1661, Flat No: A-041, 4th Floor, Tower-A, 2BHK in name & style Apartment "THE COSMOPOLIS" having Super Built up Area: 1375.00 Sft in Mouza: Dumuduma, Ps- Khandagiri No-4, Ts: Bhubaneswar, Dist-Khurda, Odisha.\n\nThere is a very high difference between Govt. Value and market Value. Govt. Benchmark Value is not revised for that locality recently and to avoid high stamp Duty/Registration Charges Sale Deed are generally executed in under-valued rate.\n\nSo, the value given by us is justified considering the present market scenario.`
    );

    const bodyParagraphs = defaultBody.split('\n\n');
    for (const para of bodyParagraphs) {
      const pLines = this.wrapText(para, CONTENT_W, FONT_SIZE_SMALL);
      for (const l of pLines) {
        this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
        this.cursorY += 13;
      }
      this.cursorY += 10;
    }

    this.cursorY += 30;

    const valuerSig = 'Er. Satyajit Mohanty';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE);
    this.drawTextAt(`Date: ${d.signatureDate || d.reportDate || '06.08.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.drawTextAt('Valuer', MARGIN_L + CONTENT_W - sigW, this.cursorY - 18, { bold: true, fontSize: FONT_SIZE });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 14;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 7. Inherited Enclosures: Photographs, Maps, Documents
  // ──────────────────────────────────────────────────────────────────────────
  private async drawEnclosures(): Promise<void> {
    const d = this.reportFields;

    if (d.propertyImages && d.propertyImages.length > 0) {
      this.addPage();
      this.cursorY = 20;
      this.drawCenteredTitle('PROPERTY PHOTOGRAPHS', FONT_SIZE_HEADER);
      this.cursorY += 16;

      const imgs = d.propertyImages;
      const names = d.propertyImageNames || [];
      const imgW = (CONTENT_W - 20) / 2;
      const imgH = 160;

      for (let i = 0; i < imgs.length; i += 2) {
        this.checkPageBreak(imgH + 30);
        await this.drawImageSafely(imgs[i], MARGIN_L, this.cursorY, imgW, imgH);
        this.drawTextAt(names[i] || `Photo ${i + 1}`, MARGIN_L, this.cursorY + imgH + 10, { fontSize: FONT_SIZE_CAPTION });

        if (i + 1 < imgs.length) {
          await this.drawImageSafely(imgs[i + 1], MARGIN_L + imgW + 20, this.cursorY, imgW, imgH);
          this.drawTextAt(names[i + 1] || `Photo ${i + 2}`, MARGIN_L + imgW + 20, this.cursorY + imgH + 10, { fontSize: FONT_SIZE_CAPTION });
        }
        this.cursorY += imgH + 25;
      }
    }

    const mapList = [
      { title: 'LAYOUT / LOCATION MAP', imgs: d.locationMapImages },
      { title: 'MOUZA MAP', imgs: d.mouzaMapImages },
      { title: 'SKETCH MAP', imgs: d.sketchMapImages },
      { title: 'CADASTRAL / BHU NAKSHA MAP', imgs: d.cadastralMapImages },
      { title: 'APPROVED BUILDING PLAN', imgs: d.bdaMapImages },
    ];

    for (const m of mapList) {
      if (m.imgs && m.imgs.length > 0) {
        this.addPage();
        this.cursorY = 20;
        this.drawCenteredTitle(m.title, FONT_SIZE_HEADER);
        this.cursorY += 16;
        for (const imgUrl of m.imgs) {
          this.checkPageBreak(320);
          await this.drawImageSafely(imgUrl, MARGIN_L, this.cursorY, CONTENT_W, 300);
          this.cursorY += 315;
        }
      }
    }

    if (d.documentImages && d.documentImages.length > 0) {
      for (let i = 0; i < d.documentImages.length; i++) {
        const url = d.documentImages[i];
        const label = (d.documentImageNames && d.documentImageNames[i]) || 'DOCUMENT ATTACHMENT';
        if (url) {
          this.addPage();
          this.cursorY = 20;
          this.drawCenteredTitle(label, FONT_SIZE_HEADER);
          this.cursorY += 16;
          await this.drawImageSafely(url, MARGIN_L, this.cursorY, CONTENT_W, 600);
          this.cursorY += 610;
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Helper Table & Cell Drawing
  // ──────────────────────────────────────────────────────────────────────────
  private drawSectionHeaderRow(secNum: string, title: string): void {
    const rowH = 18;
    this.checkPageBreak(rowH + 10);
    const wNum = 24;
    const wTitle = CONTENT_W - wNum;
    this.drawCell(MARGIN_L, this.cursorY, wNum, rowH, secNum, { bold: true, align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wNum, this.cursorY, wTitle, rowH, title, { bold: true, fillColor: LBL_BG });
    this.cursorY += rowH;
  }

  private draw2ColRow(slNo: string, title: string, value: string): void {
    const wSl = 24;
    const wTitle = 171;
    const wVal = CONTENT_W - wSl - wTitle;

    const titleLines = this.wrapText(title, wTitle - 8, FONT_SIZE_CAPTION);
    const valLines = this.wrapText(value || 'NA', wVal - 8, FONT_SIZE_CAPTION);
    const maxL = Math.max(titleLines.length, valLines.length);
    const rowH = Math.max(18, maxL * FONT_SIZE_CAPTION * LINE_HEIGHT + 6);

    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, slNo, { align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, title);
    this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wVal, rowH, value || 'NA');
    this.cursorY += rowH;
  }

  private drawSubTableRow(slNo: string, items: Array<{ label: string; value: string }>, groupTitle?: string): void {
    const wSl = 24;
    const wTitle = 171;
    const wVal = CONTENT_W - wSl - wTitle;

    if (groupTitle) {
      const gLines = this.wrapText(groupTitle, wTitle - 8, FONT_SIZE_CAPTION);
      const rowH = Math.max(18, gLines.length * FONT_SIZE_CAPTION * LINE_HEIGHT + 6);
      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, slNo, { align: 'center', fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle + wVal, rowH, groupTitle, { bold: true, fillColor: LBL_BG });
      this.cursorY += rowH;
      slNo = '';
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const lblLines = this.wrapText(it.label, wTitle - 8, FONT_SIZE_CAPTION);
      const valLines = this.wrapText(it.value || 'NA', wVal - 8, FONT_SIZE_CAPTION);
      const maxL = Math.max(lblLines.length, valLines.length);
      const rowH = Math.max(18, maxL * FONT_SIZE_CAPTION * LINE_HEIGHT + 6);

      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, i === 0 && !groupTitle ? slNo : '', { align: 'center', fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, it.label);
      this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wVal, rowH, it.value || 'NA');
      this.cursorY += rowH;
    }
  }

  private async drawImageSafely(url: string, x: number, y: number, w: number, h: number): Promise<void> {
    try {
      if (!url) return;
      const bytes = await fetchBytes(url);
      if (!bytes || bytes.length === 0) return;
      const img = await this.embedImgSafe(bytes);
      if (img) {
        this.page.drawImage(img, {
          x,
          y: this.pdfY(y) - h,
          width: w,
          height: h,
        });
      }
    } catch (e) {
      console.warn('Could not embed image:', url, e);
    }
  }
}

// Backwards compatibility alias
export { PDFSBIFlatAndApartmentRenderer as PDFSBIRenderer };
