/**
 * pdf-sbi-renderer.ts — Dedicated PDF Renderer for IDBI BANK (SBI)
 *
 * Implements:
 * - Official Header addressed to Asst. General Manager, SBI
 * - Centered Title: VALUATION REPORT
 * - Reference & Date metadata banner
 * - I. GENERAL (Points 1 to 21 with dual-column sub-tables for boundaries and dimensions)
 * - II. APARTMENT BUILDING (Points 1 to 11 with construction, facilities, lift, parking, compound wall)
 * - III. FLAT (Points 1 to 15 with construction specifications, tax, areas, carpet/SBA/UDS)
 * - IV. MARKETABILITY (Points 1 to 3)
 * - V. RATE (Points 1 to 4 with building + services, land + others, and guideline rates)
 * - VI. COMPOSITE RATE ADOPTED AFTER DEPRECIATION (Points 1 & 2 with breakdown)
 * - Details of Valuation Table (10 items breakdown)
 * - TOTAL ABSTRACT FOR THE ENTIRE PROPERTY Table (Govt. Value, Market Value, Realizable, Distress, Or Say)
 * - Remarks & Official Signatures (Approved Valuer & Branch Manager acceptance)
 * - DECLARATION FROM VALUERS (Clauses a to z)
 * - PARTICULARS / VALUERS COMMENT (11 Matrix items)
 * - MODEL CODE OF CONDUCT FOR VALUERS (Clauses 1 to 30)
 * - Justification Letter to AGM
 * - Inherited Documents, Maps, and Photographs pages
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

export interface IDBIFlatReportFields {
  // Address to Bank
  toAuthority?: string;
  bankName?: string;
  rboOffice?: string;
  districtState?: string;

  // Metadata
  refNo?: string;
  reportDate?: string;

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

  // II. APARTMENT BUILDING
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

  // Facilities
  facilityLift?: string;
  facilityWaterSupply?: string;
  facilitySewerage?: string;
  facilityCarParking?: string;
  facilityCompoundWall?: string;
  facilityPavement?: string;

  // III. FLAT
  flatFloorNumber?: string;
  flatDoorNumber?: string;

  // Specifications
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

  // IV. MARKETABILITY
  marketabilityRating?: string;
  factorsFavoringPotentialValue?: string;
  negativeFactorsObserved?: string;

  // V. RATE
  comparableSaleInstancesRate?: string;
  adoptedBasicCompositeRate?: string;
  rateBreakupBuildingServices?: string;
  rateBreakupLandOthers?: string;
  guidelineRateLandText?: string;
  guidelineTotalUdsLandValue?: string;

  // VI. COMPOSITE RATE ADOPTED AFTER DEPRECIATION
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

  // DETAILS OF VALUATION
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

  // TOTAL ABSTRACT
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

  // REMARKS & SIGNATURES
  remarksText?: string;
  opinionMarketValueWords?: string;
  opinionRealizableValueWords?: string;
  opinionGovtLandValueWords?: string;
  opinionDistressValueWords?: string;

  valuerName?: string;
  valuerFatherName?: string;
  valuerPan?: string;
  signaturePlace?: string;
  signatureDate?: string;

  // Branch Manager Inspection Block
  bmInspectionDate?: string;
  bmSatisfiedValue?: string;
  bmSatisfiedWords?: string;
  bmSignatureDate?: string;

  // PARTICULARS 11-Matrix items
  particularsItems?: string[];

  // JUSTIFICATION LETTER
  justificationLetterSubject?: string;
  justificationLetterBody?: string;

  // Base inherited attachments
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

export class PDFIDBIAbove5CRRenderer extends PDFBankRenderer {
  private reportFields: IDBIFlatReportFields;
  private projectCode?: string;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.reportFields = fields || {};
    this.projectCode = projectCode;
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    // 1. Main Valuation Questionnaire (Pages 1-4)
    this.drawCoverAndQuestionnaire();

    // 2. Declaration from Valuers (Clauses a to z)
    this.drawValuerDeclaration();

    // 3. Particulars / Valuers Comment (11-point matrix)
    this.drawParticularsMatrix();

    // 4. Model Code of Conduct for Valuers (Points 1 to 30)
    this.drawCodeOfConduct();

    // 5. Justification Letter to AGM
    this.drawJustificationLetter();

    // 6. Inherited Attachments: Photographs, Maps, Documents
    await this.drawEnclosures();

    return await this.save();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Main Questionnaire
  // ──────────────────────────────────────────────────────────────────────────
  private drawCoverAndQuestionnaire(): void {
    const d = this.reportFields;

    // Header Address
    this.cursorY = 20;
    const toLines = [
      'TO,',
      d.toAuthority || 'THE ASST. GENERAL MANAGER,',
      d.bankName || 'IDBI BANK,',
      d.rboOffice || 'RBO, PURI, DIST: PURI, ODISHA',
    ];

    for (const line of toLines) {
      this.drawTextAt(line, MARGIN_L, this.cursorY, {
        bold: true,
        fontSize: FONT_SIZE_SMALL + 1,
      });
      this.cursorY += 13;
    }

    this.cursorY += 10;

    // Report Title: strictly "VALUATION REPORT"
    this.drawCenteredTitle('VALUATION REPORT', FONT_SIZE_TITLE);
    this.cursorY += 8;

    // Reference & Date Banner
    const refNo = d.refNo || d.reportRefNo || this.projectCode || 'SMA/08/2026/01';
    const repDate = d.reportDate || d.dateOfValuation || '06.08.2026';
    const refText = `REF. NO: ${refNo}`;
    const dateText = `DATE: ${repDate}`;

    this.drawTextAt(refText, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    const dtW = this.fontBold.widthOfTextAtSize(dateText, FONT_SIZE);
    this.drawTextAt(dateText, MARGIN_L + CONTENT_W - dtW, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 18;

    // ── SECTION I. GENERAL ──
    this.drawSectionHeaderRow('I.', 'GENERAL');

    this.draw2ColRow('1.', 'Purpose for which the valuation is made', d.purposeOfValuation || 'To assess the present Market Value of the Property for Loan purpose');

    // 2. Inspection & Valuation Dates
    this.drawSubTableRow('2.', [
      { label: 'a) Date of inspection', value: d.inspectionDate || d.dateOfInspection || 'NA' },
      { label: 'b) Date on which the valuation is made', value: d.valuationDate || d.reportDate || 'NA' },
    ]);

    // 3. List of Documents Produced
    const docs = d.documentsProduced && d.documentsProduced.length > 0 ? d.documentsProduced : ['Sale Deed', '', ''];
    this.drawSubTableRow('3.', [
      { label: 'i)', value: docs[0] || 'NA' },
      { label: 'ii)', value: docs[1] || '' },
      { label: 'iii)', value: docs[2] || '' },
    ], 'List of documents produced for perusal');

    this.draw2ColRow('4.', 'Name of the Owner and his / their address (es) with Phone no. (details of share of each owner incase of joint ownership)', d.ownerNameAndAddress || 'NA');
    this.draw2ColRow('5.', 'Brief description of the property (Including leasehold / freehold etc)', d.propertyDescription || 'NA');

    // 6. Location of Property
    this.drawSubTableRow('6.', [
      { label: 'a) Plot No. / Survey No.', value: d.plotNo || 'NA' },
      { label: 'b) Door No.', value: d.doorNo || 'NA' },
      { label: 'c) T. S. No. / Village', value: d.tsNoVillage || 'NA' },
      { label: 'd) Ward / Taluka', value: d.wardTaluka || 'NA' },
      { label: 'e) Mandal / District', value: d.mandalDistrict || 'NA' },
    ], 'Location of property');

    this.draw2ColRow('7.', 'Postal address of the property', d.postalAddress || 'NA');

    // 8. City / Town
    this.drawSubTableRow('8.', [
      { label: 'City / Town', value: d.cityTown || 'City' },
      { label: 'Residential Area', value: d.residentialArea || 'Residential Area' },
      { label: 'Commercial Area', value: d.commercialArea || 'Not Applicable' },
      { label: 'Industrial Area', value: d.industrialArea || 'Not Applicable' },
    ]);

    // 9. Classification of the area
    this.drawSubTableRow('9.', [
      { label: 'i) High / Middle / Poor', value: d.classificationHighMiddlePoor || 'Middle Class' },
      { label: 'ii) Urban / Semi Urban / Rural', value: d.classificationUrbanRural || 'Urban Area' },
    ], 'Classification of the area');

    this.draw2ColRow('10.', 'Coming under Corporation limit/ Village Panchayat / Municipality', d.localBodyLimit || 'NA');
    this.draw2ColRow('11.', 'Whether covered under any State / Central Govt. enactments (e.g. Urban Land Ceiling Act) or notified under agency area / scheduled area / cantonment area', d.govtEnactmentsCovered || 'No');
    this.draw2ColRow('12.', 'In case it is an agricultural land, any conversion to house site plots is contemplated', d.agriculturalConversion || 'The Plot is already converted to Homestead');

    // 13. Boundaries of the Property (Verification vs Document)
    this.drawBoundariesTable(d);

    // 14.1 Dimensions of the site (Deed vs Actual)
    this.drawDimensionsTable(d);

    // 14.2 Coordinates
    const coordsStr = d.coordinatesText || (d.latitude && d.longitude ? `Latitude: ${d.latitude}, Longitude: ${d.longitude}` : 'NA');
    this.draw2ColRow('14.2', 'Latitude, Longitude and Coordinates of the site', coordsStr);

    this.draw2ColRow('15.', 'Extent of the site of the Project', d.extentOfProjectSite || 'NA');
    this.draw2ColRow('16.', 'Extent of the site considered for valuation (least of 14 A & 14 B)', d.extentConsideredValuation || 'Not Applicable');
    this.draw2ColRow('17.', 'Whether occupied by the owner / tenant? If occupied by tenant, since how long? Rent Received per month.', d.occupancyStatusOwnerTenant || 'The Flat is occupied by Owner');
    this.draw2ColRow('18.', 'Date of issue and validity of layout of approved map / plan', d.approvedPlanValidity || 'NA');
    this.draw2ColRow('19.', 'Approved map / plan issuing authority', d.approvedPlanAuthority || 'NA');
    this.draw2ColRow('20.', 'Whether genuineness or authenticity of approved map / plan is verified', d.approvedPlanAuthenticity || 'Yes, Verified from the authenticated authority');
    this.draw2ColRow('21.', 'Any other comments by our empanelled valuers on authentic of approved plan', d.valuerCommentsOnPlan || 'Yes, The approval plan is authenticated');

    // ── SECTION II. APARTMENT BUILDING ──
    this.drawSectionHeaderRow('II.', 'APARTMENT BUILDING');
    this.draw2ColRow('1.', 'Nature of the Apartment', d.natureOfApartment || 'Residential Apartment');

    this.drawSubTableRow('2.', [
      { label: 'T.S. No', value: d.aptLocationTsNo || 'NA' },
      { label: 'Block No', value: d.aptLocationBlockNo || 'NA' },
      { label: 'Ward No', value: d.aptLocationWardNo || 'Not Applicable' },
      { label: 'Village/Municipality/Corporation', value: d.aptLocationVillageCorp || 'NA' },
      { label: 'Door No., Street or Road (Pin Code)', value: d.aptLocationDoorRoadPin || 'NA' },
    ], 'Location');

    this.draw2ColRow('3.', 'Description of the locality Residential / Commercial / Mixed', d.localityDescription || 'Residential');
    this.draw2ColRow('4.', 'Year of Construction', d.yearOfConstruction || 'NA');
    this.draw2ColRow('5.', 'Number of Floors', d.numberOfFloors || 'NA');
    this.draw2ColRow('6.', 'Type of Structure', d.typeOfStructure || 'RCC Frame Structure');
    this.draw2ColRow('7.', 'Number of Dwelling units in the building', d.dwellingUnitsCount || 'Not Verified');
    this.draw2ColRow('8.', 'Quality of Construction', d.qualityOfConstruction || 'Good');
    this.draw2ColRow('9.', 'Appearance of the Building', d.appearanceOfBuilding || 'Good');
    this.draw2ColRow('10.', 'Maintenance of the Building', d.maintenanceOfBuilding || 'Good');

    this.drawSubTableRow('11.', [
      { label: 'Lift', value: d.facilityLift || 'Yes' },
      { label: 'Protected Water Supply', value: d.facilityWaterSupply || 'Yes' },
      { label: 'Under Ground Sewerage', value: d.facilitySewerage || 'Yes' },
      { label: 'Car Parking-Open/Covered', value: d.facilityCarParking || 'Covered parking' },
      { label: 'Does compound wall exist?', value: d.facilityCompoundWall || 'Yes' },
      { label: 'Is pavement laid around the building?', value: d.facilityPavement || 'Yes' },
    ], 'Facilities Available');

    // ── SECTION III. FLAT ──
    this.drawSectionHeaderRow('III.', 'FLAT');
    this.draw2ColRow('1', 'The floor on which the flat is situated', d.flatFloorNumber || 'NA');
    this.draw2ColRow('2', 'Door No of the Flat', d.flatDoorNumber || 'NA');

    this.drawSubTableRow('3', [
      { label: 'Roof', value: d.specRoof || 'RCC Roof' },
      { label: 'Flooring', value: d.specFlooring || 'VT Flooring' },
      { label: 'Doors', value: d.specDoors || 'Hard Ply wood doors' },
      { label: 'Windows', value: d.specWindows || 'Aluminum frame with glass fitting windows' },
      { label: 'Fittings', value: d.specFittings || 'Superior' },
      { label: 'Finishing', value: d.specFinishing || 'Cement Plastering, Putty, Modular Kitchen, Roof Ceiling, Cupboard, Wardrobes' },
    ], 'Specifications of the flat');

    this.drawSubTableRow('4', [
      { label: 'Assessment No', value: d.assessmentNumber || 'Not Verified' },
      { label: 'Tax paid in name of', value: d.taxPaidName || 'Not Verified' },
      { label: 'Tax Amount', value: d.taxAmount || 'Not Verified' },
    ]);

    this.drawSubTableRow('5', [
      { label: 'Electricity Service Connection No', value: d.electricityConnectionNo || 'Not Verified' },
      { label: 'Meter Card in name of', value: d.meterCardName || 'Not Verified' },
    ]);

    this.draw2ColRow('6', 'How is the maintenance of the flat?', d.flatMaintenanceCondition || 'Good');
    this.draw2ColRow('7', 'Sale Deed executed in the name of', d.saleDeedExecutedName || 'NA');
    this.draw2ColRow('8', 'What is the undivided area of land as per Sale Deed?', d.undividedLandArea || 'NA');
    this.draw2ColRow('9', 'What is the Super Built up Area of the flat?', d.superBuiltUpArea || 'NA');
    this.draw2ColRow('10', 'What is the floor space index (app.)', d.floorSpaceIndex || 'As per approval plan');
    this.draw2ColRow('11', 'What is the Carpet Area of the flat?', d.carpetArea || 'NA');
    this.draw2ColRow('12', 'Is it Posh/ I class / Medium / Ordinary?', d.poshClassMediumOrdinary || 'I Class');
    this.draw2ColRow('13', 'Is it being used for Residential or Commercial purpose?', d.usageResidentialCommercial || 'Residential Purpose');
    this.draw2ColRow('14', 'Is it Owner-occupied or let out?', d.flatOccupancyOwnerTenant || 'The Flat is occupied by Owner');
    this.draw2ColRow('15', 'If rented, what is the monthly rent?', d.monthlyRentIfRented || 'Not Applicable');

    // ── SECTION IV. MARKETABILITY ──
    this.drawSectionHeaderRow('IV.', 'MARKETABILITY');
    this.draw2ColRow('1', 'How is the marketability?', d.marketabilityRating || 'Good');
    this.draw2ColRow('2', 'What are the factors favoring for an extra Potential Value?', d.factorsFavoringPotentialValue || 'The subject property is located in a developed residential area with good connectivity.');
    this.draw2ColRow('3', 'Any negative factors are observed which affect the market value in general?', d.negativeFactorsObserved || 'Nothing Observed');

    // ── SECTION V. RATE ──
    this.drawSectionHeaderRow('V.', 'RATE');
    this.draw2ColRow('1', 'After analyzing the comparable sale instances, what is the composite rate for a similar flat with same specifications in the adjoining locality? - (Along with details /reference of at-least two latest deals /transactions with respect to adjacent properties in the areas)', d.comparableSaleInstancesRate || 'NA');
    this.draw2ColRow('2', 'Assuming it is a new construction, what is the adopted basic composite rate of the flat under valuation after comparing with the specifications and other factors with the flat under comparison (give details).', d.adoptedBasicCompositeRate || 'NA');

    this.drawSubTableRow('3.', [
      { label: 'i Building + Services', value: d.rateBreakupBuildingServices || 'NA' },
      { label: 'ii Land + Others', value: d.rateBreakupLandOthers || 'NA' },
    ], 'Break - up for the rate');

    this.draw2ColRow('4.', "Guideline rate obtained from the Registrar's office (an evidence thereof to be enclosed)", d.guidelineRateLandText || 'NA');

    // ── SECTION VI. COMPOSITE RATE ADOPTED AFTER DEPRECIATION ──
    this.drawSectionHeaderRow('VI', 'COMPOSITE RATE ADOPTED AFTER DEPRECIATION');
    this.drawSubTableRow('1', [
      { label: 'a) Depreciated building rate', value: d.depreciatedBuildingRateAnnualFormula || '1.5% Per Annum' },
      { label: 'b) Replacement cost of flat with Services', value: d.replacementCostOfFlat || 'NA' },
      { label: 'c) Age of the building', value: d.buildingAge ? `${d.buildingAge} Yrs` : 'NA' },
      { label: 'd) Life of the building estimated', value: d.buildingLife ? `${d.buildingLife} Yrs` : '50 Yrs' },
      { label: 'e) Depreciation percentage assuming the salvage value as 10%', value: d.depreciationSalvagePercentage || 'Considering straight-line method of depreciation.' },
      { label: 'f) Depreciated Ratio of the building', value: d.depreciationRatio || '1.5% Per Annum' },
    ]);

    this.drawSubTableRow('2', [
      { label: 'a) Total composite rate arrived for valuation', value: '' },
      { label: 'b) Depreciated building rate', value: d.finalDepreciatedBuildingRate || 'NA' },
      { label: 'c) Rate for Land & other', value: d.finalRateLandOther || 'NA' },
      { label: 'd) Total Composite Rate', value: d.finalTotalCompositeRate || 'NA' },
    ]);

    // ── DETAILS OF VALUATION TABLE ──
    this.drawDetailsOfValuationTable(d);

    // ── TOTAL ABSTRACT FOR THE ENTIRE PROPERTY ──
    this.drawTotalAbstractTable(d);

    // ── REMARKS & VALUER SIGNATURES ──
    this.drawRemarksAndSignatures(d);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sub-table: Boundaries of the property
  // ──────────────────────────────────────────────────────────────────────────
  private drawBoundariesTable(d: IDBIFlatReportFields): void {
    const rowH = 18;
    this.checkPageBreak(rowH * 5 + 10);

    const wSl = 24;
    const wTitle = 171;
    const wVerif = 135;
    const wDoc = CONTENT_W - wSl - wTitle - wVerif;

    // Header row
    this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '13.', { bold: true, align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, 'Boundaries of the property', { bold: true, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wVerif, rowH, 'As per Verification', { bold: true, align: 'center', fillColor: OPT_BG });
    this.drawCell(MARGIN_L + wSl + wTitle + wVerif, this.cursorY, wDoc, rowH, 'As per Document', { bold: true, align: 'center', fillColor: OPT_BG });
    this.cursorY += rowH;

    const rows = [
      { dir: 'East', verif: d.boundaryEastVerification || 'NA', doc: d.boundaryEastDocument || 'NA' },
      { dir: 'West', verif: d.boundaryWestVerification || 'NA', doc: d.boundaryWestDocument || 'NA' },
      { dir: 'North', verif: d.boundaryNorthVerification || 'NA', doc: d.boundaryNorthDocument || 'NA' },
      { dir: 'South', verif: d.boundarySouthVerification || 'NA', doc: d.boundarySouthDocument || 'NA' },
    ];

    for (const r of rows) {
      this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '', { fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, r.dir, { bold: false });
      this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wVerif, rowH, r.verif, { align: 'left' });
      this.drawCell(MARGIN_L + wSl + wTitle + wVerif, this.cursorY, wDoc, rowH, r.doc, { align: 'left' });
      this.cursorY += rowH;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sub-table: Dimensions of the site
  // ──────────────────────────────────────────────────────────────────────────
  private drawDimensionsTable(d: IDBIFlatReportFields): void {
    const rowH = 18;
    this.checkPageBreak(rowH * 6 + 10);

    const wSl = 24;
    const wTitle = 171;
    const wDeed = 135;
    const wAct = CONTENT_W - wSl - wTitle - wDeed;

    // Header 1: Letters A and B
    this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '14.1', { bold: true, align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, 'Dimensions of the site', { bold: true, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wDeed, rowH, 'A', { bold: true, align: 'center', fillColor: OPT_BG });
    this.drawCell(MARGIN_L + wSl + wTitle + wDeed, this.cursorY, wAct, rowH, 'B', { bold: true, align: 'center', fillColor: OPT_BG });
    this.cursorY += rowH;

    // Header 2: Subtitles
    this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '', { fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, '', { fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wDeed, rowH, 'As per the Deed', { bold: true, align: 'center', fillColor: OPT_BG });
    this.drawCell(MARGIN_L + wSl + wTitle + wDeed, this.cursorY, wAct, rowH, 'Actual', { bold: true, align: 'center', fillColor: OPT_BG });
    this.cursorY += rowH;

    const rows = [
      { dir: 'East', deed: d.dimensionEastDeed || 'Not Applicable (Flat)', act: d.dimensionEastActual || '' },
      { dir: 'West', deed: d.dimensionWestDeed || 'Not Applicable (Flat)', act: d.dimensionWestActual || '' },
      { dir: 'North', deed: d.dimensionNorthDeed || 'Not Applicable (Flat)', act: d.dimensionNorthActual || '' },
      { dir: 'South', deed: d.dimensionSouthDeed || 'Not Applicable (Flat)', act: d.dimensionSouthActual || '' },
    ];

    for (const r of rows) {
      this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, '', { fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wSl, this.cursorY, wTitle, rowH, r.dir, { bold: false });
      this.drawCell(MARGIN_L + wSl + wTitle, this.cursorY, wDeed, rowH, r.deed, { align: 'left' });
      this.drawCell(MARGIN_L + wSl + wTitle + wDeed, this.cursorY, wAct, rowH, r.act, { align: 'left' });
      this.cursorY += rowH;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Table: Details of Valuation
  // ──────────────────────────────────────────────────────────────────────────
  private drawDetailsOfValuationTable(d: IDBIFlatReportFields): void {
    this.cursorY += 10;
    this.drawTextAt('Details of valuation', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE + 1 });
    this.cursorY += 16;

    const headers = ['Sl. No', 'Description', 'Area', 'Rate per unit in Rs.', 'Estimated Value in Rs'];
    const colW = [36, 180, 75, 95, 101.28];
    const rows = [
      ['1', 'Present value of the flat', d.superBuiltUpArea || 'NA', d.finalTotalCompositeRate || 'NA', d.valFlatPresentValue || 'NA'],
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

    // Total Row
    const rowH = 18;
    const totalW = colW[0] + colW[1] + colW[2] + colW[3];
    this.drawCell(MARGIN_L, this.cursorY, totalW, rowH, 'Total', { bold: true, align: 'right', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + totalW, this.cursorY, colW[4], rowH, d.valTotalEstimated || 'Rs. 0.00', { bold: true, align: 'right', fillColor: OPT_BG });
    this.cursorY += rowH + 10;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Table: Total Abstract For The Entire Property
  // ──────────────────────────────────────────────────────────────────────────
  private drawTotalAbstractTable(d: IDBIFlatReportFields): void {
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
        d.abstractGovtValueLand || 'NA',
        d.abstractMarketValue || 'NA',
        d.abstractRealizableValue || 'NA',
        d.abstractDistressValue || 'NA',
      ],
      [
        'OR SAY',
        d.abstractOrSayGovtLand || d.abstractGovtValueLand || 'NA',
        d.abstractOrSayMarket || d.abstractMarketValue || 'NA',
        d.abstractOrSayRealizable || d.abstractRealizableValue || 'NA',
        d.abstractOrSayDistress || d.abstractDistressValue || 'NA',
      ],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
    ];

    this.drawTable(headers, rows, colW, [], [0], [0], [], [], ['left', 'right', 'right', 'right', 'right'], ['center', 'center', 'center', 'center', 'center']);
    this.cursorY += 14;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Remarks & Official Signatures
  // ──────────────────────────────────────────────────────────────────────────
  private drawRemarksAndSignatures(d: IDBIFlatReportFields): void {
    this.checkPageBreak(220);

    // Remarks Header
    this.drawTextAt('REMARKS', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 1 });
    this.cursorY += 12;

    const remarks = d.remarksText || `SUBJECT PROPERTY IS A 2 BHK FLAT, HAVING SUPER BUILT UP AREA: ${d.superBuiltUpArea || 'NA'}. PROPERTY LOCATED IN A DEVELOPED RESIDENTIAL AREA. ALL CIVIC AMENITIES ARE PRESENT WITHIN 2-3 KMS FROM THE PROPERTY. VALUATION HAS BEEN DONE FOR FLAT ONLY.`;
    const rLines = this.wrapText(remarks, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of rLines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 11;
    }
    this.cursorY += 8;

    // Opinion paragraph bullet
    const opP = `• As a result of my appraisal and analysis, it is my considered opinion that the present Fair Market Value of the above property in the prevailing condition with aforesaid specifications is ${d.abstractOrSayMarket || d.abstractMarketValue || 'NA'} (${d.opinionMarketValueWords || 'Rupees ...'}). The Realizable Value of the above Property is ${d.abstractOrSayRealizable || d.abstractRealizableValue || 'NA'} (${d.opinionRealizableValueWords || 'Rupees ...'}). The book value of the above property as of Land is ${d.abstractOrSayGovtLand || d.abstractGovtValueLand || 'NA'} (${d.opinionGovtLandValueWords || 'Rupees ...'}) and the distress value ${d.abstractOrSayDistress || d.abstractDistressValue || 'NA'} (${d.opinionDistressValueWords || 'Rupees ...'}).`;
    const opLines = this.wrapText(opP, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of opLines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 11;
    }
    this.cursorY += 24;

    // Signature Block 1: Approved Valuer
    const valuerSig = '(Name and Official seal of the Approved Valuer)';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Date: ${d.signatureDate || d.reportDate || '06.08.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });

    this.cursorY += 40;

    // Signature Block 2: Branch Manager Acceptance
    const bmP = `The undersigned has inspected the property detailed in the Valuation Report on dated ${d.bmInspectionDate || '___________'}. We are satisfied that the fair and reasonable market value of the property is Rs.${d.bmSatisfiedValue || '___________'} (Rupees ${d.bmSatisfiedWords || '__________________________________________________'}).`;
    const bmL = this.wrapText(bmP, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of bmL) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 11;
    }
    this.cursorY += 20;

    const bmSig = '(Name of the Branch Manager with Official seal)';
    const bmSigW = this.fontBold.widthOfTextAtSize(bmSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: ${d.bmSignatureDate || '__________'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - bmSigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(bmSig, MARGIN_L + CONTENT_W - bmSigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 30;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Declaration from Valuers (Clauses a to z)
  // ──────────────────────────────────────────────────────────────────────────
  private drawValuerDeclaration(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 20;

    this.drawCenteredTitle('DECLARATION FROM VALUERS', FONT_SIZE_HEADER);
    this.cursorY += 12;

    const vName = d.valuerName || 'Mr. Satyajit Mohanty';
    const vFather = d.valuerFatherName || 'Mr. Nityananda Mohanty';
    const intro = `I ${vName}, S/o: ${vFather} do hereby solemnly affirm and state that:`;
    this.drawTextAt(intro, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 16;

    const panNo = d.valuerPan || 'AONPM6997B';

    const clauses = [
      { id: 'a.', text: 'I am citizen of India.' },
      { id: 'b.', text: 'I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointments as valuer or three years after the valuation of assets was conducted by me.' },
      { id: 'c.', text: `The information furnished in my valuation report dated ${d.reportDate || '06.08.2026'} is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.` },
      { id: 'd.', text: `I have personally inspected the property ${d.inspectionDate || '03.08.2026'} & I have valued the property which is identified by customer. The work is not sub-contracted to any other valuer & carried out by myself.` },
      { id: 'e.', text: 'Valuation report is submitted in the format as prescribed by the bank.' },
      { id: 'f.', text: 'I have not been depannelled by any other bank and in case any such depanelment by other banks during my empanelment with you, I will inform you within three days of such depanelment.' },
      { id: 'g.', text: 'I have not been removed from service earlier.' },
      { id: 'h.', text: 'I have not been convicted of any offence & sentenced to a term of imprisonment' },
      { id: 'i.', text: 'I have not been declared to be unsound mind.' },
      { id: 'j.', text: 'I have not been found guilty of misconduct in my professional capacity.' },
      { id: 'k.', text: 'I am not an undischarged bankrupt, or have not applied to be adjudicated as a bankrupt.' },
      { id: 'l.', text: 'I have not undischarged insolvent.' },
      { id: 'm.', text: 'I have not been levied a penalty under section 271J of Income-Tax Act, 1961 (43 of 1961) and time limit for filing appeal before commissioner of Income Tax (Appeals) or Income-Tax Appellate Tribunal, as the case may be has expired, or such penalty has been confirmed by Income-Tax Appellate Tribunal, and five years have not elapsed after levy of such penalty.' },
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

    // We render in 2 balanced columns
    const half = Math.ceil(clauses.length / 2);
    const col1 = clauses.slice(0, half);
    const col2 = clauses.slice(half);

    const startY = this.cursorY;
    let y1 = startY;

    // Col 1
    for (const c of col1) {
      this.drawTextAt(c.id, MARGIN_L, y1, { bold: true, fontSize: FONT_SIZE_CAPTION });
      const lines = this.wrapText(c.text, colW - 14, FONT_SIZE_CAPTION);
      for (const l of lines) {
        this.drawTextAt(l, MARGIN_L + 14, y1, { fontSize: FONT_SIZE_CAPTION });
        y1 += 9.5;
      }
      y1 += 4;
    }

    // Col 2
    let y2 = startY;
    const col2X = MARGIN_L + colW + 20;
    for (const c of col2) {
      this.drawTextAt(c.id, col2X, y2, { bold: true, fontSize: FONT_SIZE_CAPTION });
      const lines = this.wrapText(c.text, colW - 14, FONT_SIZE_CAPTION);
      for (const l of lines) {
        this.drawTextAt(l, col2X + 14, y2, { fontSize: FONT_SIZE_CAPTION });
        y2 += 9.5;
      }
      y2 += 4;
    }

    this.cursorY = Math.max(y1, y2) + 20;

    // Valuer Sign-off
    const valuerSig = '(Name and Official seal of the Approved Valuer)';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: ${d.signatureDate || d.reportDate || '06.08.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Particulars / Valuers Comment (11-point matrix)
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
  // 4. Model Code of Conduct for Valuers (Clauses 1 to 30)
  // ──────────────────────────────────────────────────────────────────────────
  private drawCodeOfConduct(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 20;

    this.drawCenteredTitle('MODEL CODE OF CONDUCT FOR VALUERS', FONT_SIZE_HEADER);
    this.cursorY += 4;
    this.drawCenteredTitle('{Adopted in line with Companies (Registered Valuers and Valuation Rules, 2017)}', FONT_SIZE_CAPTION);
    this.cursorY += 10;

    const sub = 'All Valuers empanelled with bank shall strictly adhere to the following code of conduct:';
    this.drawTextAt(sub, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
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
          '24. A Valuer while respecting the confidentiality of information acquired during the course of performing professional services, shall maintain proper working papers for a period of three years or such longer period as required in its contract for a specific valuation, for production before a regulatory authority or for a peer review.',
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

    // Render Col 1
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

    // Render Col 2
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

    // Sign off
    const valuerSig = 'Signature of the Approved Valuer and Seal';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: ${d.signatureDate || d.reportDate || '06.08.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Justification of Valuation Report Letter
  // ──────────────────────────────────────────────────────────────────────────
  private drawJustificationLetter(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 25;

    const toLines = [
      'TO,',
      d.toAuthority || 'THE ASST. GENERAL MANAGER,',
      d.bankName || 'IDBI BANK,',
      d.rboOffice || 'RBO, PURI, DIST: PURI, ODISHA',
    ];

    for (const line of toLines) {
      this.drawTextAt(line, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 1 });
      this.cursorY += 14;
    }

    this.cursorY += 14;

    const sub = d.justificationLetterSubject || `Sub: - Justification of valuation Report of ${d.ownerNameAndAddress ? d.ownerNameAndAddress.split(',')[0] : 'Borrower'}.`;
    this.drawTextAt(sub, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 22;

    this.drawTextAt('Dear Sir,', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 18;

    const bodyP1 = `The subject property bearing ${d.propertyDescription || 'Khata No: ... Plot No: ...'} having Super Built up Area: ${d.superBuiltUpArea || 'NA'} in Mouza: ${d.tsNoVillage || 'NA'}, Ts: Bhubaneswar, Dist-Khurda, Odisha.`;
    const p1Lines = this.wrapText(bodyP1, CONTENT_W, FONT_SIZE);
    for (const l of p1Lines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE });
      this.cursorY += 16;
    }
    this.cursorY += 12;

    const bodyP2 = d.justificationLetterBody || 'There is a very high difference between Govt. Value and market Value. Govt. Benchmark Value is not revised for that locality recently and to avoid high stamp Duty/Registration Charges Sale Deed are generally executed in under-valued rate.\n\nSo, the value given by us is justified considering the present market scenario.';
    const p2Paragraphs = bodyP2.split('\n\n');
    for (const p of p2Paragraphs) {
      const lines = this.wrapText(p, CONTENT_W, FONT_SIZE);
      for (const l of lines) {
        this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE });
        this.cursorY += 16;
      }
      this.cursorY += 10;
    }

    this.cursorY += 40;

    // Bottom Sign-off
    const valuerSig = 'Er. Satyajit Mohanty';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE);
    this.drawTextAt(`Date: ${d.signatureDate || d.reportDate || '06.08.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.drawTextAt('Valuer', MARGIN_L + CONTENT_W - sigW, this.cursorY - 20, { bold: true, fontSize: FONT_SIZE });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 14;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Inherited Enclosures: Photographs, Maps, Documents
  // ──────────────────────────────────────────────────────────────────────────
  private async drawEnclosures(): Promise<void> {
    const d = this.reportFields;

    // Property Photographs
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

    // Maps (Location, Mouza, Sketch, Cadastral, BDA)
    const mapList = [
      { title: 'LOCATION MAP', imgs: d.locationMapImages },
      { title: 'MOUZA MAP', imgs: d.mouzaMapImages },
      { title: 'SKETCH MAP', imgs: d.sketchMapImages },
      { title: 'CADASTRAL / BHU NAKSHA MAP', imgs: d.cadastralMapImages },
      { title: 'APPROVED BDA / LOCAL PLAN', imgs: d.bdaMapImages },
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

    // Legal Documents (Sale Deed, ROR, etc.)
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
  // Grid / Row Drawing Helpers
  // ──────────────────────────────────────────────────────────────────────────
  private drawSectionHeaderRow(roman: string, title: string): void {
    const rowH = 18;
    this.checkPageBreak(rowH + 20);
    this.drawCell(MARGIN_L, this.cursorY, 24, rowH, roman, { bold: true, align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + 24, this.cursorY, CONTENT_W - 24, rowH, title, { bold: true, fillColor: LBL_BG });
    this.cursorY += rowH;
  }

  private draw2ColRow(slNo: string, label: string, value: string): void {
    const wSl = 24;
    const wLbl = 171;
    const wVal = CONTENT_W - wSl - wLbl;

    const lblLines = this.wrapText(label, wLbl - 6, FONT_SIZE);
    const valLines = this.wrapText(value || 'NA', wVal - 6, FONT_SIZE);
    const maxL = Math.max(lblLines.length, valLines.length, 1);
    const rowH = Math.max(18, maxL * FONT_SIZE * LINE_HEIGHT + 6);

    this.checkPageBreak(rowH);

    this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, slNo, { bold: true, align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl, this.cursorY, wLbl, rowH, label, { bold: false, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl + wLbl, this.cursorY, wVal, rowH, value || 'NA', { bold: false });

    this.cursorY += rowH;
  }

  private drawSubTableRow(
    slNo: string,
    items: { label: string; value: string }[],
    mainLabel?: string
  ): void {
    const wSl = 24;
    const wLbl = 171;
    const wVal = CONTENT_W - wSl - wLbl;

    if (mainLabel) {
      const rowH = 18;
      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, slNo, { bold: true, align: 'center', fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wSl, this.cursorY, wLbl, rowH, mainLabel, { bold: true, fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wSl + wLbl, this.cursorY, wVal, rowH, '', { fillColor: LBL_BG });
      this.cursorY += rowH;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const lblLines = this.wrapText(it.label, wLbl - 6, FONT_SIZE);
      const valLines = this.wrapText(it.value || 'NA', wVal - 6, FONT_SIZE);
      const maxL = Math.max(lblLines.length, valLines.length, 1);
      const rowH = Math.max(18, maxL * FONT_SIZE * LINE_HEIGHT + 6);

      this.checkPageBreak(rowH);

      const slText = !mainLabel && i === 0 ? slNo : '';
      this.drawCell(MARGIN_L, this.cursorY, wSl, rowH, slText, { bold: true, align: 'center', fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wSl, this.cursorY, wLbl, rowH, it.label, { bold: false, fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wSl + wLbl, this.cursorY, wVal, rowH, it.value || 'NA', { bold: false });

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
