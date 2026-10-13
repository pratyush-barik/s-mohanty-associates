/**
 * pdf-sbi-below-5cr-renderer.ts — Dedicated PDF Renderer for State Bank of India (SBI) — BELOW 5CR
 *
 * Implements:
 * - TO: THE CHIEF MANAGER, STATE BANK OF INDIA, Branch, Dist...
 * - REF. NO & DATE Banner
 * - Name of Customer(s)/Borrowal Unit
 * - Section 1: Customer Details (Name of Owner, Appl. No.)
 * - Section 2: Property Details (Address, Nearby Landmark/Google Map Independent access)
 * - Section 3: Document Details (Layout plan, Building plan, Construction permission, Legal documents, List of documents)
 * - Section 4: Physical Details (Boundaries as per Document vs Verification, Matching, Demarcated, Land use, Type of property, Rooms, Plinth areas, Life, Structure)
 * - Section 5: Tenure/ Occupancy Details (Status of tenure, Number of years of occupancy, Relationship of tenant)
 * - Section 6: Stage of construction (Stage of construction, extent of completion)
 * - Section 7: Violations, if any, observed (Nature and extent of violations)
 * - Section 8: Area details of the property (Site Area, Carpet Area, Saleable Area, Plinth Area per Approval & Actual)
 * - Section 9: Valuation (THE LAND RATE ADOPTED IN THIS VALUATION breakdown)
 * - Assumptions or remarks (Points i to vii with detailed marketability / variation notes)
 * - Section 11: Declaration
 * - Section 12: Name, Address and signature of the valuer
 * - DETAILS OF VALUATION (Table with Plinth Area, Roof Height, Age, Replacement Rate, Estimated Replacement Cost, Depreciation, Net Value)
 * - TOTAL ABSTRACT FOR THE ENTIRE PROPERTY Table (Land, Building, Extra Items, Amenities, Misc, Services, Total, Or Say)
 * - Enclosures Checklist (a to i)
 * - Opinion Paragraph & Date/Place Sign-off
 * - DECLARATION CUM UNDERTAKING FROM VALUERS (Clauses a to z)
 * - MODEL CODE OF CONDUCT FOR VALUERS (Clauses 1 to 17+)
 * - Inherited Attachments: Photographs, Maps, Documents
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

export interface SBIBelow5CRFields {
  // Top Header
  toAuthority?: string;
  bankName?: string;
  branchAddress?: string;
  refNo?: string;
  reportDate?: string;
  borrowerName?: string;

  // 1. Customer Details
  ownerNameAndAddress?: string;
  applicationNo?: string;

  // 2. Property Details
  propertyAddress?: string;
  nearbyLandmark?: string;
  coordinatesText?: string;
  latitude?: string;
  longitude?: string;

  // 3. Document Details
  layoutPlanAvailable?: string;
  layoutPlanAuthority?: string;
  layoutPlanApprovalNo?: string;
  buildingPlanAvailable?: string;
  buildingPlanAuthority?: string;
  buildingPlanApprovalNo?: string;
  constructionPermissionAvailable?: string;
  constructionPermissionAuthority?: string;
  constructionPermissionApprovalNo?: string;
  legalDocumentsAvailable?: string;
  legalDocumentsAuthority?: string;
  legalDocumentsApprovalNo?: string;
  listOfDocuments?: string;

  // 4. Physical Details
  boundaryEastDoc?: string;
  boundaryEastVerif?: string;
  boundaryWestDoc?: string;
  boundaryWestVerif?: string;
  boundaryNorthDoc?: string;
  boundaryNorthVerif?: string;
  boundarySouthDoc?: string;
  boundarySouthVerif?: string;

  matchingBoundaries?: string;
  plotDemarcated?: string;
  approvedLandUse?: string;
  typeOfProperty?: string;
  numberOfRoomsLiving?: string;
  numberOfRoomsBed?: string;
  numberOfRoomsToilets?: string;
  numberOfRoomsKitchens?: string;
  totalNumberOfFloors?: string;
  areaPropertyLocated?: string;
  approxAgeProperty?: string;
  residualLifeProperty?: string;
  typeOfStructure?: string;

  // 5. Tenure / Occupancy
  statusOfTenure?: string;
  numberOfYearsOccupancy?: string;
  relationshipTenantOwner?: string;

  // 6. Stage of construction
  stageOfConstruction?: string;
  underConstructionExtent?: string;

  // 7. Violations
  natureExtentViolations?: string;

  // 8. Area details
  siteAreaText?: string;
  carpetAreaText?: string;
  saleableAreaText?: string;
  plinthAreaApprovalText?: string;
  plinthAreaActualText?: string;

  // 9. Valuation (Land Rate Adopted)
  landRateAdoptedText?: string;

  // Assumptions or remarks (i to vii)
  remarkQualificationsTIR?: string;
  remarkSarfaesiCompliant?: string;
  remarkSocialInfrastructure?: string;
  remarkEntirePieceMortgaged?: string;
  remarkLastTwoTransactions?: string;
  remarkVariationJustification?: string;
  remarkMarketabilityAnyOther?: string;
  generalRemarksText?: string;

  // 11. Declaration text
  declarationText?: string;

  // 12. Valuer Details
  valuerNameAndAddress?: string;
  valuerWealthTaxReg?: string;
  signaturePlace?: string;
  signatureDate?: string;

  // Valuation Computation Table
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
  valTotalCost?: string;
  valTotalDepreciation?: string;
  valTotalNetValue?: string;

  // Total Abstract Table
  abstractGovtLand?: string;
  abstractGovtBldg?: string;
  abstractGovtExtra?: string;
  abstractGovtAmenities?: string;
  abstractGovtMisc?: string;
  abstractGovtServices?: string;
  abstractGovtTotal?: string;
  abstractGovtOrSay?: string;

  abstractMarketLand?: string;
  abstractMarketBldg?: string;
  abstractMarketExtra?: string;
  abstractMarketAmenities?: string;
  abstractMarketMisc?: string;
  abstractMarketServices?: string;
  abstractMarketTotal?: string;
  abstractMarketOrSay?: string;

  abstractRealizableLand?: string;
  abstractRealizableBldg?: string;
  abstractRealizableExtra?: string;
  abstractRealizableAmenities?: string;
  abstractRealizableMisc?: string;
  abstractRealizableServices?: string;
  abstractRealizableTotal?: string;
  abstractRealizableOrSay?: string;

  abstractDistressLand?: string;
  abstractDistressBldg?: string;
  abstractDistressExtra?: string;
  abstractDistressAmenities?: string;
  abstractDistressMisc?: string;
  abstractDistressServices?: string;
  abstractDistressTotal?: string;
  abstractDistressOrSay?: string;

  // Enclosures Checklist (a to i)
  encLayoutSketch?: string;
  encBuildingPlan?: string;
  encFloorPlan?: string;
  encPhotographGeo?: string;
  encCertifiedApprovedPlan?: string;
  encGoogleMapCoords?: string;
  encPriceTrendPortals?: string;
  encGuidelineRateEvidence?: string;
  encOtherDocuments?: string;

  // Final Opinion Paragraph Words
  opinionMarketWords?: string;
  opinionRealizableWords?: string;
  opinionGovtLandWords?: string;
  opinionDistressWords?: string;

  // Valuer Declaration PAN
  valuerPan?: string;

  // Images
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

const SECTION_BANNER_BG = '#8B4500'; // Dark golden-brown matching the reference format headers

export class PDFSBIBelow5CRRenderer extends PDFBankRenderer {
  private reportFields: SBIBelow5CRFields;
  private projectCode?: string;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.reportFields = fields || {};
    this.projectCode = projectCode;
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    // 1. Cover & Main Technical Schedule (Pages 1 & 2)
    this.drawCoverAndTechnicalSchedule();

    // 2. Details of Valuation, Abstract & Enclosures Checklist (Page 3)
    this.drawValuationAbstractAndEnclosures();

    // 3. Declaration Cum Undertaking From Valuers (Clauses a to z)
    this.drawDeclarationCumUndertaking();

    // 4. Model Code of Conduct For Valuers (Clauses 1 to 17+)
    this.drawCodeOfConduct();

    // 5. Justification Letter to Chief Manager
    this.drawJustificationLetter();

    // 6. Inherited Attachments: Photographs, Maps, Documents
    await this.drawEnclosures();

    return await this.save();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Cover & Main Technical Schedule
  // ──────────────────────────────────────────────────────────────────────────
  private drawCoverAndTechnicalSchedule(): void {
    const d = this.reportFields;
    this.cursorY = 20;

    // Top To Address
    const toLines = [
      'TO,',
      d.toAuthority || 'THE CHIEF MANAGER,',
      d.bankName || 'STATE BANK OF INDIA,',
      d.branchAddress || 'BALUGAON BRANCH, DIST: KHURDA, ODISHA',
    ];
    for (const line of toLines) {
      this.drawTextAt(line, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 0.5 });
      this.cursorY += 13;
    }
    this.cursorY += 8;

    // Ref No & Date
    const refNo = d.refNo || this.projectCode || 'SMA/03/2026/10';
    const repDate = d.reportDate || '20.03.2026';
    const refText = `REF. NO: ${refNo}`;
    const dateText = `DATE: ${repDate}`;
    this.drawTextAt(refText, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    const dtW = this.fontBold.widthOfTextAtSize(dateText, FONT_SIZE);
    this.drawTextAt(dateText, MARGIN_L + CONTENT_W - dtW, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 18;

    // Borrower Name
    const bName = `Name of Customer(s)/Borrowal Unit: ${d.borrowerName || 'Mrs. Sunita Kumari Nahak & Mr. Brundabana Nayak'}`;
    this.drawTextAt(bName, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 1 });
    this.cursorY += 18;

    // ── SECTION 1: Customer Details ──
    this.drawBrownSectionHeader('1', 'Customer Details');
    this.draw2ColRowCustom(120, 'Name of the Owner', d.ownerNameAndAddress || 'NA', true);
    this.draw2ColRowCustom(120, 'Appl. No.', d.applicationNo || 'Not Available');

    // ── SECTION 2: Property Details ──
    this.drawBrownSectionHeader('2', 'Property Details');
    this.draw2ColRowCustom(120, 'Address', d.propertyAddress || 'NA');
    const lm = d.nearbyLandmark || 'The subject property is situated nearer to landmark.';
    const coords = d.coordinatesText || (d.latitude && d.longitude ? `Latitude: ${d.latitude}, Longitude: ${d.longitude}` : '');
    const fullLm = coords ? `${lm}\n\n${coords}` : lm;
    this.draw2ColRowCustom(120, 'Nearby Landmark/ Google Map Independent access to the property', fullLm);

    // ── SECTION 3: Document Details ──
    this.drawBrownSectionHeader('3', 'Document Details');
    this.drawDocumentDetailsTable(d);
    this.draw2ColRowCustom(120, 'List of documents', d.listOfDocuments || 'Xerox copy of Sale Deed, ROR, Approval Plan & Sketch Map');

    // ── SECTION 4: Physical Details ──
    this.drawBrownSectionHeader('4', 'Physical Details');
    this.drawBoundariesTable(d);
    this.drawMatchingAndDemarcatedRow(d);
    this.drawRoomsMatrix(d);
    this.drawFloorsAndStructureMatrix(d);

    // Page Break for Page 2 continuation if needed
    this.checkPageBreak(120);

    // ── SECTION 5: Tenure/ Occupancy Details ──
    this.drawBrownSectionHeader('5', 'Tenure/ Occupancy Details');
    this.draw3ColRow(
      { label: 'Status of tenure', val: d.statusOfTenure || 'Owned/ Rented (Under Construction)' },
      { label: 'Number of years of occupancy', val: d.numberOfYearsOccupancy || 'NA' },
      { label: 'Relationship of tenant to owner', val: d.relationshipTenantOwner || 'NA' }
    );

    // ── SECTION 6: Stage of construction ──
    this.drawBrownSectionHeader('6', 'Stage of construction');
    this.draw2ColRowCustom(140, 'Stage of construction', d.stageOfConstruction || 'Completed (45%)');
    this.draw2ColRowCustom(140, 'If under construction, extent of completion:', d.underConstructionExtent || 'Not Applicable');

    // ── SECTION 7: Violations, if any, observed ──
    this.drawBrownSectionHeader('7', 'Violations, if any, observed');
    this.draw2ColRowCustom(140, 'Nature and extent of violations', d.natureExtentViolations || 'Nothing Observed');

    // ── SECTION 8: Area details of the property ──
    this.drawBrownSectionHeader('8', 'Area details of the property');
    this.drawAreaDetailsTable(d);

    // ── SECTION 9: Valuation ──
    this.drawBrownSectionHeader('9', 'Valuation');
    const landRateDesc = d.landRateAdoptedText || `THE LAND RATE ADOPTED IN THIS VALUATION:\n• GOVT. BENCHMARK VALUE: RS.3,44,30,000/- PER ACRE I.E. RS.790/- PER SFT\n• TOTAL LAND AREA: AC.0.031 DEC I.E. 1350.00 SFT\n• GUIDELINE VALUE OF LAND= 1350.00 SFT X RS.790/- PER SFT = RS.10,66,500/-\n• THE PREVAILING MARKET RATE OF THE LAND IS RS.1700/- TO RS.1900/- PER SFT.\n• THE ADOPTED MARKET RATE OF THE LAND IS RS.1800/- PER SFT FOR VALUATION PURPOSE.\n• TOTAL MARKET VALUE: 1350.00 SFT X RS.1800/- PER SFT = RS.24,30,000/-`;
    this.drawTextBlockRow(landRateDesc);

    // Assumptions or remarks (i to vii)
    this.drawBrownSectionHeader('', 'Assumptions or remarks');
    this.drawAssumptionsList(d);

    // Remarks box
    this.drawFullRemarksBlock(d);

    // ── SECTION 11: Declaration ──
    this.drawBrownSectionHeader('11', 'Declaration');
    const declText = d.declarationText || `1) The property was inspected by the under signed on ${d.signatureDate || '19.02.2026'}\n2) The undersigned does not have any direct/indirect interest in the above property.\n3) The information furnished herein is true and correct to the best of our knowledge.\n4) I have submitted Valuation report directly to the Bank`;
    this.drawTextBlockRow(declText);

    // ── SECTION 12: Valuer Details & Signature ──
    this.drawBrownSectionHeader('12', 'Name, Address and signature of the valuer');
    this.drawValuerSignatureRow(d);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sub-table: Document Details (Section 3)
  // ──────────────────────────────────────────────────────────────────────────
  private drawDocumentDetailsTable(d: SBIBelow5CRFields): void {
    const rows = [
      {
        item: 'Layout plan',
        avail: d.layoutPlanAvailable || 'Yes/ No',
        auth: d.layoutPlanAuthority || 'Sarapanch Kanamana Gram Panchayat',
        appNo: d.layoutPlanApprovalNo || 'Vide Letter No: 115/26 on dated 02.03.2026 for construction of a G+2 Storied Residential Building.',
      },
      {
        item: 'Building plan',
        avail: d.buildingPlanAvailable || 'Yes/ No',
        auth: d.buildingPlanAuthority || '',
        appNo: d.buildingPlanApprovalNo || '',
      },
      {
        item: 'Construction permission',
        avail: d.constructionPermissionAvailable || 'Yes/ No',
        auth: d.constructionPermissionAuthority || '',
        appNo: d.constructionPermissionApprovalNo || '',
      },
      {
        item: 'Legal documents',
        avail: d.legalDocumentsAvailable || 'Yes/No',
        auth: d.legalDocumentsAuthority || '',
        appNo: d.legalDocumentsApprovalNo || '',
      },
    ];

    const wItem = 110;
    const wAvail = 60;
    const wAuth = 150;
    const wAppNo = CONTENT_W - wItem - wAvail - wAuth;
    const rowH = 18;

    this.checkPageBreak(rowH * 4 + 10);

    for (const r of rows) {
      this.drawCell(MARGIN_L, this.cursorY, wItem, rowH, r.item, { bold: false, fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wItem, this.cursorY, wAvail, rowH, r.avail, { align: 'center', fillColor: OPT_BG });
      this.drawCell(MARGIN_L + wItem + wAvail, this.cursorY, wAuth, rowH, r.auth, { align: 'left' });
      this.drawCell(MARGIN_L + wItem + wAvail + wAuth, this.cursorY, wAppNo, rowH, r.appNo, { align: 'left' });
      this.cursorY += rowH;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sub-table: Boundaries (Section 4)
  // ──────────────────────────────────────────────────────────────────────────
  private drawBoundariesTable(d: SBIBelow5CRFields): void {
    const rowH = 18;
    this.checkPageBreak(rowH * 5 + 10);

    const wHalf = CONTENT_W / 2;
    const wDir = 45;
    const wVal = wHalf - wDir;

    // Header row
    this.drawCell(MARGIN_L, this.cursorY, wHalf, rowH, 'Boundaries as per Document', { bold: true, align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wHalf, this.cursorY, wHalf, rowH, 'Boundaries as per Verification', { bold: true, align: 'center', fillColor: OPT_BG });
    this.cursorY += rowH;

    const dirs = [
      { dir: 'East:', doc: d.boundaryEastDoc || 'Road', verif: d.boundaryEastVerif || 'Road' },
      { dir: 'West:', doc: d.boundaryWestDoc || 'Part of Plot No-338', verif: d.boundaryWestVerif || 'Vacant Plot' },
      { dir: 'North:', doc: d.boundaryNorthDoc || 'Land of Asha Kumari & Santosh Kumar Choudhury', verif: d.boundaryNorthVerif || 'Building of Asha Kumari & Santosh Kumar Choudhury' },
      { dir: 'South:', doc: d.boundarySouthDoc || 'Land of Rajeswari Nahak & Mithun Kumar Nahak', verif: d.boundarySouthVerif || 'Building of Rajeswari Nahak & Mithun Kumar Nahak' },
    ];

    for (const r of dirs) {
      this.drawCell(MARGIN_L, this.cursorY, wDir, rowH, r.dir, { bold: true });
      this.drawCell(MARGIN_L + wDir, this.cursorY, wVal, rowH, r.doc);
      this.drawCell(MARGIN_L + wHalf, this.cursorY, wDir, rowH, r.dir, { bold: true });
      this.drawCell(MARGIN_L + wHalf + wDir, this.cursorY, wVal, rowH, r.verif);
      this.cursorY += rowH;
    }
  }

  private drawMatchingAndDemarcatedRow(d: SBIBelow5CRFields): void {
    const rowH = 22;
    this.checkPageBreak(rowH + 10);

    const w1 = 110;
    const w2 = 45;
    const w3 = 80;
    const w4 = 40;
    const w5 = 75;
    const w6 = 65;
    const w7 = CONTENT_W - w1 - w2 - w3 - w4 - w5 - w6;

    this.drawCell(MARGIN_L, this.cursorY, w1, rowH, 'Matching of boundaries', { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + w1, this.cursorY, w2, rowH, d.matchingBoundaries || 'Yes/ No', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + w1 + w2, this.cursorY, w3, rowH, 'Plot demarcated', { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + w1 + w2 + w3, this.cursorY, w4, rowH, d.plotDemarcated || 'Yes/ No', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + w1 + w2 + w3 + w4, this.cursorY, w5, rowH, 'Approved land use', { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + w1 + w2 + w3 + w4 + w5, this.cursorY, w6, rowH, d.approvedLandUse || 'Residential', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + w1 + w2 + w3 + w4 + w5 + w6, this.cursorY, w7, rowH, d.typeOfProperty || 'Plotted / Flat', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private drawRoomsMatrix(d: SBIBelow5CRFields): void {
    const rowH = 20;
    this.checkPageBreak(rowH + 10);
    const colW = CONTENT_W / 5;

    this.drawCell(MARGIN_L, this.cursorY, colW, rowH, 'Number of rooms', { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW, this.cursorY, colW, rowH, `Living/Dining: ${d.numberOfRoomsLiving || '1 Nos'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 2, this.cursorY, colW, rowH, `Bed rooms: ${d.numberOfRoomsBed || '3 Nos'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 3, this.cursorY, colW, rowH, `Toilets: ${d.numberOfRoomsToilets || '1 Nos'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 4, this.cursorY, colW, rowH, `Kitchens: ${d.numberOfRoomsKitchens || '1 Nos'}`, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private drawFloorsAndStructureMatrix(d: SBIBelow5CRFields): void {
    const rowH = 24;
    this.checkPageBreak(rowH + 10);
    const colW = CONTENT_W / 5;

    this.drawCell(MARGIN_L, this.cursorY, colW, rowH, `Total number of floors: ${d.totalNumberOfFloors || 'Ground Floor'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW, this.cursorY, colW, rowH, `Area on which located: ${d.areaPropertyLocated || 'Palia, Chhatrapur'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 2, this.cursorY, colW, rowH, `Approx. age: ${d.approxAgeProperty || 'New'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 3, this.cursorY, colW, rowH, `Residual life: ${d.residualLifeProperty || '65 Yrs'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 4, this.cursorY, colW, rowH, `Type of structure: ${d.typeOfStructure || 'RCC Frame'}`, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private drawAreaDetailsTable(d: SBIBelow5CRFields): void {
    const rowH = 22;
    this.checkPageBreak(rowH * 3 + 10);

    const wLbl = 100;
    const wVal1 = 140;
    const wLbl2 = 100;
    const wVal2 = CONTENT_W - wLbl - wVal1 - wLbl2;

    // Row 1
    this.drawCell(MARGIN_L, this.cursorY, wLbl, rowH, 'Site Area', { bold: true });
    this.drawCell(MARGIN_L + wLbl, this.cursorY, wVal1, rowH, d.siteAreaText || 'Ac.0.031 Dec i.e. 1350.00 Sft');
    this.drawCell(MARGIN_L + wLbl + wVal1, this.cursorY, wLbl2, rowH, 'Plinth Area (As per Approval)', { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLbl + wVal1 + wLbl2, this.cursorY, wVal2, rowH, d.plinthAreaApprovalText || 'GF: 1275 Sft | FF: 1275 Sft | SF: 1275 Sft (Total= 3825 Sft)', { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // Row 2
    this.drawCell(MARGIN_L, this.cursorY, wLbl, rowH, 'Carpet Area', { bold: true });
    this.drawCell(MARGIN_L + wLbl, this.cursorY, wVal1, rowH, d.carpetAreaText || '1142.00 Sft (Approx.)');
    this.drawCell(MARGIN_L + wLbl + wVal1, this.cursorY, wLbl2, rowH, 'Plinth Area (As per Actual)', { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLbl + wVal1 + wLbl2, this.cursorY, wVal2, rowH, d.plinthAreaActualText || 'Ground Floor Plinth Area: 1313.00 Sft', { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // Row 3
    this.drawCell(MARGIN_L, this.cursorY, wLbl, rowH, 'Saleable Area', { bold: true });
    this.drawCell(MARGIN_L + wLbl, this.cursorY, CONTENT_W - wLbl, rowH, d.saleableAreaText || '1350.00 Sft (Land) & 1313.00 Sft (Building)');
    this.cursorY += rowH;
  }

  private drawAssumptionsList(d: SBIBelow5CRFields): void {
    const items = [
      { id: 'i)', q: 'Qualifications in TIR/Mitigation suggested, if any', a: d.remarkQualificationsTIR || 'Not Applicable' },
      { id: 'ii)', q: 'Property is SARFAESI compliant', a: d.remarkSarfaesiCompliant || 'Yes' },
      { id: 'iii)', q: 'Whether property belongs to social infrastructure like hospital, school, old age home etc.', a: d.remarkSocialInfrastructure || 'No' },
      { id: 'iv)', q: 'Whether entire piece of land on which the unit is set up / property is situated has been mortgaged or to be mortgaged', a: d.remarkEntirePieceMortgaged || 'Not Applicable' },
      { id: 'v)', q: 'Details of last two transactions in the locality/area to be provided, if available', a: d.remarkLastTwoTransactions || 'The two transactions of the property are not available in the locality. But the present market rate of land confirmed through local enquiry and property dealers and found to be acceptable' },
      { id: 'vi)', q: 'In case of variation of 20% or more in the valuation proposed by the valuer and the Guideline value provided in the State Govt. notification or Income Tax Gazette justification on variation has to be given', a: d.remarkVariationJustification || 'There is variation between Market value and Guideline value because Guideline rates are not revised regularly and to avoid high stamp duty/registration charges sale deed executed in under-valued rate. Generally Guideline rates are fixed for an area whereas actual market rate of specific land in same area are different as per size, location, approach road, landmarks, surrounding developments, site developments Etc. The market is higher due to the property is situated in a Residential area of Palia, Chhatrapur, Ganjam' },
      { id: 'vii)', q: 'Any other aspect which has relevance on the value or marketability of the property', a: d.remarkMarketabilityAnyOther || 'Not Observed' },
    ];

    const wQ = 230;
    const wA = CONTENT_W - wQ;

    for (const it of items) {
      const qText = `${it.id} ${it.q}`;
      const qLines = this.wrapText(qText, wQ - 8, FONT_SIZE_CAPTION);
      const aLines = this.wrapText(it.a, wA - 8, FONT_SIZE_CAPTION);
      const maxL = Math.max(qLines.length, aLines.length);
      const rowH = Math.max(16, maxL * FONT_SIZE_CAPTION * LINE_HEIGHT + 4);

      this.checkPageBreak(rowH);
      this.drawCell(MARGIN_L, this.cursorY, wQ, rowH, qText, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wQ, this.cursorY, wA, rowH, it.a, { fontSize: FONT_SIZE_CAPTION });
      this.cursorY += rowH;
    }
  }

  private drawFullRemarksBlock(d: SBIBelow5CRFields): void {
    const text = d.generalRemarksText || `REMARKS:\nSUBJECT PROPERTY IS AN UNDER CONSTRUCTED GROUND FLOOR RESIDENTIAL BUILDING, LAND EXTENT OF (AC.0.031 DEC I.E. 1350.00 SFT). PROPERTY LOCATED IN A DEVELOPED RESIDENTIAL AREA OF PALIA, CHHATRAPUR, GANJAM. THIS PROPERTY IS COMING UNDER KANAMANA GRAM PANCHAYAT AREA LIMIT. ALL CIVIC AMENITIES ARE PRESENT WITHIN 2-3 KMS FROM THE PROPERTY. VALUATION HAS BEEN DONE FOR LAND & APPROVED BUA OF THE GROUND FLOOR BUILDING.`;
    this.drawTextBlockRow(text);
  }

  private drawValuerSignatureRow(d: SBIBelow5CRFields): void {
    const rowH = 60;
    this.checkPageBreak(rowH + 10);

    const wLeft = CONTENT_W - 140;
    const wRight = 140;

    const valuerDetails = `Name: ${d.valuerNameAndAddress || 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)\nPlot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018'}\n\nWealth Tax Registration No: ${d.valuerWealthTaxReg || '107/2016-17 of Category-I'}`;
    this.drawCell(MARGIN_L, this.cursorY, wLeft, rowH, valuerDetails, { fontSize: FONT_SIZE_CAPTION });

    this.drawCell(MARGIN_L + wLeft, this.cursorY, wRight, rowH / 2, 'Signature', { bold: true, align: 'center' });
    this.drawCell(MARGIN_L + wLeft, this.cursorY + rowH / 2, wRight, rowH / 2, `Date: ${d.signatureDate || '21.03.2026'}`, { align: 'center' });
    this.cursorY += rowH;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Details of Valuation, Abstract & Enclosures Checklist (Page 3)
  // ──────────────────────────────────────────────────────────────────────────
  private drawValuationAbstractAndEnclosures(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 20;

    // Top Title: DETAILS OF VALUATION
    this.drawCenteredTitle('DETAILS OF VALUATION', FONT_SIZE_HEADER);
    this.cursorY += 10;

    // Valuation breakdown table
    const headers = [
      'PARTICULARS OF ITEMS',
      'PLINTH AREA IN SQFT',
      'ROOF HEIGHT',
      'AGE OF THE BUILDING IN YEARS',
      'REPLACEMENT RATE OF CONSTRUCTION',
      'ESTIMATED REPLACEMENT COST OF CONSTRUCTION',
      'DEPRECIATION AMOUNT IN RS. (1.5% per Anm)',
      'NET VALUE AFTER DEPRECIATION',
    ];
    const colW = [75, 45, 40, 45, 65, 75, 65, 77.28];

    const defaultItems = [
      ['RCC GROUND FLOOR', '1,275.00', '10\' 6"', 'New', 'Rs. 900.00', 'Rs. 11,47,500.00', 'Rs. 0.00', 'Rs. 11,47,500.00'],
    ];

    const rows = d.valItems && d.valItems.length > 0
      ? d.valItems.map(it => [it.particulars, it.plinthArea, it.roofHeight, it.age, it.rate, it.cost, it.depreciation, it.netValue])
      : defaultItems;

    this.drawTable(headers, rows, colW, [0], [0, 1], [], [], [], ['left', 'right', 'center', 'center', 'right', 'right', 'right', 'right'], ['center', 'center', 'center', 'center', 'center', 'center', 'center', 'center']);

    // Total Row
    const rowH = 18;
    const totW = colW[0] + colW[1] + colW[2] + colW[3] + colW[4];
    this.drawCell(MARGIN_L, this.cursorY, totW, rowH, 'TOTAL :', { bold: true, align: 'right', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + totW, this.cursorY, colW[5] + colW[6] + colW[7], rowH, d.valTotalNetValue || 'Rs. 11,47,500.00', { bold: true, align: 'right', fillColor: OPT_BG });
    this.cursorY += rowH + 16;

    // ── TOTAL ABSTRACT FOR THE ENTIRE PROPERTY ──
    this.drawCenteredTitle('TOTAL ABSTRACT FOR THE ENTIRE PROPERTY', FONT_SIZE_HEADER);
    this.cursorY += 8;

    const absHeaders = [
      'PARTICULARS',
      'GOVT. VALUE IN RS.',
      'MARKET VALUE IN RS.',
      'REALIZABLE VALUE (95%)',
      'DISTRESS VALUE (85%)',
    ];
    const absColW = [105, 96, 96, 95.28, 95];

    const absRows = [
      ['LAND', d.abstractGovtLand || 'Rs. 10,66,500.00', d.abstractMarketLand || 'Rs. 24,30,000.00', d.abstractRealizableLand || 'Rs. 23,08,500.00', d.abstractDistressLand || 'Rs. 20,65,500.00'],
      ['BUILDING', d.abstractGovtBldg || 'Rs. 0.00', d.abstractMarketBldg || 'Rs. 11,47,500.00', d.abstractRealizableBldg || 'Rs. 10,90,125.00', d.abstractDistressBldg || 'Rs. 9,75,375.00'],
      ['EXTRA ITEMS', d.abstractGovtExtra || 'Rs. 0.00', d.abstractMarketExtra || 'Rs. 0.00', d.abstractRealizableExtra || 'Rs. 0.00', d.abstractDistressExtra || 'Rs. 0.00'],
      ['AMENITIES', d.abstractGovtAmenities || 'Rs. 0.00', d.abstractMarketAmenities || 'Rs. 0.00', d.abstractRealizableAmenities || 'Rs. 0.00', d.abstractDistressAmenities || 'Rs. 0.00'],
      ['MISCELLANEOUS', d.abstractGovtMisc || 'Rs. 0.00', d.abstractMarketMisc || 'Rs. 0.00', d.abstractRealizableMisc || 'Rs. 0.00', d.abstractDistressMisc || 'Rs. 0.00'],
      ['SERVICES', d.abstractGovtServices || 'Rs. 0.00', d.abstractMarketServices || 'Rs. 0.00', d.abstractRealizableServices || 'Rs. 0.00', d.abstractDistressServices || 'Rs. 0.00'],
      ['TOTAL', d.abstractGovtTotal || 'Rs. 10,66,500.00', d.abstractMarketTotal || 'Rs. 35,77,500.00', d.abstractRealizableTotal || 'Rs. 33,98,625.00', d.abstractDistressTotal || 'Rs. 30,40,875.00'],
      ['OR SAY', d.abstractGovtOrSay || 'Rs. 10,67,000.00', d.abstractMarketOrSay || 'Rs. 35,78,000.00', d.abstractRealizableOrSay || 'Rs. 33,99,000.00', d.abstractDistressOrSay || 'Rs. 30,41,000.00'],
    ];

    this.drawTable(absHeaders, absRows, absColW, [0, 6, 7], [0, 1], [], [], [], ['left', 'right', 'right', 'right', 'right'], ['center', 'center', 'center', 'center', 'center']);
    this.cursorY += 16;

    // ── Enclosures Checklist Table ──
    this.drawEnclosuresChecklist(d);

    // ── Opinion Paragraph & Signatures ──
    this.drawOpinionAndSignatures(d);
  }

  private drawEnclosuresChecklist(d: SBIBelow5CRFields): void {
    const list = [
      { id: 'a)', item: 'Layout plan sketch of the area in which the property is located with latitude and longitude', status: d.encLayoutSketch || 'Enclosed' },
      { id: 'b)', item: 'Building Plan', status: d.encBuildingPlan || 'Enclosed' },
      { id: 'c)', item: 'Floor Plan', status: d.encFloorPlan || 'Enclosed' },
      { id: 'd)', item: "Photograph of the property (including geo-stamping with date) and owner (in case of housing loans, if borrower is available) including a 'Selfie' of the Valuer at the site", status: d.encPhotographGeo || 'Enclosed' },
      { id: 'e)', item: 'Certified copy of the approved / sanctioned plan wherever applicable from the concerned office', status: d.encCertifiedApprovedPlan || 'Enclosed' },
      { id: 'f)', item: 'Google Map location of the property and Longitude/Latitude and co-ordinates of the property', status: d.encGoogleMapCoords || 'Enclosed' },
      { id: 'g)', item: 'Price trend of the Property in the locality/city from property search sites viz Magickbricks.com, 99Acres.com, Makan.com etc', status: d.encPriceTrendPortals || 'Enclosed' },
      { id: 'h)', item: 'Guideline rate mentioned in the valuation report must be supported by documentary evidence i.e. latest guideline rate published in district website, Registrar Office etc should be printed and signed by the concerned valuer as an evidence of authenticity', status: d.encGuidelineRateEvidence || 'Enclosed' },
      { id: 'i)', item: 'Any other relevant documents/ extracts', status: d.encOtherDocuments || 'No' },
    ];

    const wItem = CONTENT_W - 80;
    const wStatus = 80;
    const rowH = 18;

    this.checkPageBreak(rowH * list.length + 10);

    for (const it of list) {
      this.drawCell(MARGIN_L, this.cursorY, wItem, rowH, `${it.id} ${it.item}`, { fontSize: FONT_SIZE_CAPTION });
      this.drawCell(MARGIN_L + wItem, this.cursorY, wStatus, rowH, it.status, { align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: OPT_BG });
      this.cursorY += rowH;
    }
    this.cursorY += 12;
  }

  private drawOpinionAndSignatures(d: SBIBelow5CRFields): void {
    this.checkPageBreak(120);

    const mVal = d.abstractMarketOrSay || d.abstractMarketTotal || 'Rs.35,78,000/-';
    const mWords = d.opinionMarketWords || 'Thirty Five Lakhs Seventy Eight Thousand only';
    const rVal = d.abstractRealizableOrSay || d.abstractRealizableTotal || 'Rs.33,99,000/-';
    const rWords = d.opinionRealizableWords || 'Thirty Three Lakhs Ninety Nine Thousand only';
    const gVal = d.abstractGovtOrSay || d.abstractGovtTotal || 'Rs.10,67,000/-';
    const gWords = d.opinionGovtLandWords || 'Ten Lakhs Sixty Seven Thousand only';
    const dVal = d.abstractDistressOrSay || d.abstractDistressTotal || 'Rs.30,41,000/-';
    const dWords = d.opinionDistressWords || 'Thirty Lakhs Forty One Thousand only';

    const opP = `As a result of my appraisal and analysis, it is my considered opinion that the present Fair Market Value of the above property in the prevailing condition with aforesaid specifications is ${mVal} (Rupees ${mWords}). The Realizable Value of the above Property is ${rVal} (Rupees ${rWords}). The book value of the above property as of Land is ${gVal} (Rupees ${gWords}) and the distress value ${dVal} (Rupees ${dWords}).`;

    const lines = this.wrapText(opP, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of lines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 12;
    }
    this.cursorY += 24;

    // Date/Place and Signature
    const valuerSig = 'Signature of the Approved Valuer and Seal';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: ${d.signatureDate || '21.03.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Declaration Cum Undertaking From Valuers (Clauses a to z)
  // ──────────────────────────────────────────────────────────────────────────
  private drawDeclarationCumUndertaking(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 20;

    this.drawCenteredTitle('DECLARATION CUM UNDERTAKING FROM VALUERS', FONT_SIZE_HEADER);
    this.cursorY += 12;

    const intro = 'I Mr. Satyajit Mohanty, S/o: Mr Nityananda Mohanty do hereby solemnly affirm and state that:';
    this.drawTextAt(intro, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 16;

    const panNo = d.valuerPan || 'AONPM6997B';

    const clauses = [
      { id: 'a.', text: 'I am citizen of India.' },
      { id: 'b.', text: 'I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointments as valuer or three years after the valuation of assets was conducted by me.' },
      { id: 'c.', text: `The information furnished in my valuation report dated ${d.reportDate || '21.03.2026'} is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.` },
      { id: 'd.', text: `I have personally inspected the property on ${d.signatureDate || '19.02.2026'} & I have valued the property which is identified by documents& help of customer. The work is not sub-contracted to any other valuer& carried out by myself.` },
      { id: 'e.', text: 'Valuation report is submitted in the format as prescribed by the bank.' },
      { id: 'f.', text: 'I have not been depanelled by any other bank and in case any such depanelment by other banks during my empanelment with you, I will inform you within three days of such depanelment.' },
      { id: 'g.', text: 'I have not been removed from service earlier.' },
      { id: 'h.', text: 'I have not been convicted of any offence & sentenced to a term of imprisonment' },
      { id: 'i.', text: 'I have not been declared to be unsound mind.' },
      { id: 'j.', text: 'I have not been found guilty of misconduct in my professional capacity.' },
      { id: 'k.', text: 'I am not an undischarged bankrupt, or have not applied to be adjudicated as a bankrupt.' },
      { id: 'l.', text: 'I have not undischarged insolvent.' },
      { id: 'm.', text: 'I have not been levied a penalty under section 271J of Income-Tax Act,1961 (43 of 1961) and time limit for filing appeal before commissioner of Income Tax (Appeals) or Income-Tax Appellate Tribunal, as the case may be has expired, or such penalty has been confirmed by Income-Tax Appellate Tribunal, and five years have not elapsed after levy of such penalty.' },
      { id: 'n.', text: 'I have not been convicted of an offence connected with any proceeding under the Income-Tax Act 1961, wealth Tax Act 1957 or Gift Tax Act 1958.' },
      { id: 'o.', text: `My PAN Card number as applicable is ${panNo}.` },
      { id: 'p.', text: 'I undertake to keep you informed of any events or happenings which would make me ineligible for empanelment as a valuer.' },
      { id: 'q.', text: 'I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure' },
      { id: 'r.', text: 'I have read the hand book on policy, standards & procedure for real Estate valuation,2011 of the IBA & this report is in conformity to the "Standards" enshrined for valuation in the part -B of the above handbook to the best of my knowledge.' },
      { id: 's.', text: 'I have read the International Valuation Standards (IVS) & the report submitted to the Bank for the respective asset class is in conformity to the "Standards" enshrined for valuation in the IVS in "General Standards" & "Asset Standards" as applicable.' },
      { id: 't.', text: 'I abide by the Model Code of Conduct for empanelment of valuer in the Bank.' },
      { id: 'u.', text: 'I am registered under Section 34 AB of the Wealth Tax Act,1957.' },
      { id: 'v.', text: 'I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI)' },
      { id: 'w.', text: "My CIBIL Score and credit worthiness is as per Bank's guidelines." },
      { id: 'x.', text: 'I am the authorized official of the firm who is competent to sign this valuation report' },
      { id: 'y.', text: 'I will undertake the valuation work on receipt of letter of Engagement generated from the System. (i.e. LLMS/LOS) only' },
      { id: 'z.', text: 'Further, I hereby provide the following information.' },
    ];

    for (const c of clauses) {
      const cLines = this.wrapText(c.text, CONTENT_W - 20, FONT_SIZE_CAPTION);
      const rowH = Math.max(14, cLines.length * FONT_SIZE_CAPTION * LINE_HEIGHT + 2);
      this.checkPageBreak(rowH);
      this.drawTextAt(c.id, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
      for (let i = 0; i < cLines.length; i++) {
        this.drawTextAt(cLines[i], MARGIN_L + 18, this.cursorY + i * FONT_SIZE_CAPTION * LINE_HEIGHT, { fontSize: FONT_SIZE_CAPTION });
      }
      this.cursorY += rowH;
    }

    this.cursorY += 20;

    // Sign-off
    const valuerSig = '(Name and Official seal of the Approved Valuer)';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date:${d.signatureDate || '21.03.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Model Code of Conduct For Valuers (Clauses 1 to 17+)
  // ──────────────────────────────────────────────────────────────────────────
  private drawCodeOfConduct(): void {
    this.addPage();
    this.cursorY = 20;

    this.drawCenteredTitle('MODEL CODE OF CONDUCT FOR VALUERS', FONT_SIZE_HEADER);
    this.cursorY += 4;
    this.drawCenteredTitle('{Adopted in line with Companies (Registered Valuers and Valuation Rules, 2017)}', FONT_SIZE_CAPTION);
    this.cursorY += 8;

    const sub = 'All Valuers empanelled with bank shall strictly adhere to the following code of conduct:';
    this.drawTextAt(sub, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 12;

    const sections = [
      {
        title: 'Integrity and Fairness',
        items: [
          '1. A Valuer shall, in the conduct of his/its business, follow high standards of integrity and fairness in all his/its dealings with his/its clients and other Valuers.',
          '2. A Valuer shall maintain integrity by being honest, straightforward, and forthright in all professional relationships.',
          '3. A Valuer shall endeavor to ensure that he/it provides true and adequate information and shall not misrepresent any facts or situations.',
          '4. A Valuer shall refrain from being involved in any action that would bring disrepute to the profession.',
          '5 A Valuer shall keep public interest foremost while delivering his services.',
        ],
      },
      {
        title: 'Professional Competence and Due Care',
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
        title: 'Independence and Disclosure of Interest',
        items: [
          '12. A Valuer shall act with objectivity in his/its professional dealings by ensuring that his/its decisions are made without the presence of any bias, conflict of interest, coercion, or undue influence of any party, whether directly connected to the valuation assignment or not.',
          '13. A Valuer shall not take up an assignment if he/it or any of his/its relatives or associates is not independent in terms of association to the company.',
          '14. A Valuer shall maintain complete independence in his/its professional relationships and shall conduct the valuation independent of external influences.',
          '15. A Valuer shall wherever necessary disclose to the clients, possible sources of conflicts of duties and interests, while providing unbiased services.',
          '16. A Valuer shall not deal in securities of any subject company after any time when he/it first becomes aware of the possibility of his/its association with the valuation, and in accordance with the Securities and Exchange Board of India (Prohibition of Insider Trading) Regulations, 2015 or till the time the valuation report becomes public, whichever is earlier.',
          '17. A Valuer shall not indulge in "mandate snatching" or offering "convenience valuations" in order to cater to a company or client\'s needs.',
          '18. As an independent Valuer, the Valuer shall not charge success fee (Success fees may be defined as a compensation / incentive paid to any third party for successful closure of transaction. In this case, approval of credit proposals).',
          '19. In any fairness opinion or independent expert opinion submitted by a Valuer, if there has been a prior engagement in an unconnected transaction, the Valuer shall declare the association with the company during the last five years.',
        ],
      },
      {
        title: 'Confidentiality',
        items: [
          '20. A Valuer shall not use or divulge to other clients or any other party any confidential information about the subject company, which has come to his/its knowledge without proper and specific authority or unless there is a legal or professional right or duty to disclose.',
          '21. A Valuer shall ensure that he/ it maintains written contemporaneous records for any decision taken, the reasons for taking the decision, and the information and evidence in support of such decision. This shall be maintained so as to sufficiently enable a reasonable person to take a view on the appropriateness of his/its decisions and actions.',
          '22. A Valuer shall appear, co-operate and be available for inspections and investigations carried out by the authority, any person authorized by the authority, the registered values\' organization with which he/it is registered or any other statutory regulatory body.',
          '23. A Valuer shall provide all information and records as may be required by the authority, the Tribunal, Appellate Tribunal, the registered valuers organization with which he/it is registered, or any other statutory regulatory body.',
          '24. A Valuer while respecting the confidentiality of information acquired during the course of performing professional services, shall maintain proper working papers for a period of three years or such longer period as required in its contract for a specific valuation, for production before a regulatory authority or for a peer review. In the event of a pending case before the Tribunal or Appellate Tribunal, the record shall be maintained till the disposal of the case.',
        ],
      },
      {
        title: 'Gifts and hospitality:',
        items: [
          '25. A Valuer or his/its relative shall not accept gifts or hospitality which undermines or affects his independence as a Valuer.\nExplanation — For the purposes of this code the term "relative" shall have the same meaning as Defined in clause (77) of Section 2 of the Companies Act, 2013 (18 of 2013).',
          '26. A Valuer shall not offer gifts or hospitality or a financial or any other advantage to a public servant or any other person with a view to obtain or retain work for himself/ itself, or to obtain or retain an advantage in the conduct of profession for himself/ itself.',
        ],
      },
      {
        title: 'Remuneration and Costs.',
        items: [
          '27. A Valuer shall provide services for remuneration which is charged in a transparent manner, is a reasonable reflection of the work necessarily and properly undertaken, and is not inconsistent with the applicable rules.',
          '28. A Valuer shall not accept any fees or charges other than those which are disclosed in a written contract with the person to whom he would be rendering service.',
        ],
      },
      {
        title: 'Occupation, employability and restrictions.',
        items: [
          '29. A Valuer shall refrain from accepting too many assignments, if he/it is unlikely to be able to devote adequate time to each of his/ its assignments.',
          '30. A Valuer shall not conduct business which in the opinion of the authority or the registered Valuer organization discredits the profession.',
        ],
      },
    ];

    for (const sec of sections) {
      this.drawTextAt(sec.title, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION + 0.5 });
      this.cursorY += 12;

      for (const it of sec.items) {
        const lines = this.wrapText(it, CONTENT_W, FONT_SIZE_CAPTION);
        const rowH = lines.length * FONT_SIZE_CAPTION * LINE_HEIGHT + 2;
        this.checkPageBreak(rowH);
        for (let i = 0; i < lines.length; i++) {
          this.drawTextAt(lines[i], MARGIN_L, this.cursorY + i * FONT_SIZE_CAPTION * LINE_HEIGHT, { fontSize: FONT_SIZE_CAPTION });
        }
        this.cursorY += rowH;
      }
      this.cursorY += 4;
    }

    this.cursorY += 14;

    // Code of conduct sign-off
    const valuerSig = 'Signature of the Approved Valuer and Seal';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: 21.03.2026`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Place: Bhubaneswar`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
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
      d.toAuthority || 'THE CHIEF MANAGER,',
      d.bankName || 'STATE BANK OF INDIA,',
      d.branchAddress || 'BALUGAON BRANCH, DIST: KHURDA, ODISHA',
    ];

    for (const line of toLines) {
      this.drawTextAt(line, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 1 });
      this.cursorY += 14;
    }
    this.cursorY += 14;

    const sub = `Sub: - Justification of valuation Report of ${d.borrowerName || 'Mrs. Sunita Kumari Nahak, W/o: Mr. Brundabana Nayak & Mr. Brundabana Nayak'}`;
    this.drawTextAt(sub, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 20;

    this.drawTextAt('Dear Sir,', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 16;

    const p1 = `The subject property bearing ${d.propertyAddress || 'Khata No: 441/7666, Plot No: 338/7776, Total Area: Ac.0.031 Dec i.e. 1350.00 Sft, Kissam: Gharabari in Mz: Chhatrapur, Ps: Chhatrapur No-52, Ts: Chhatrapur No-184, Dist: Ganjam, Odisha.'} We consider the Market Value Rs.1800/- Per Sft & Govt. Value Rs.790/- Per Sft.`;
    const p1Lines = this.wrapText(p1, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of p1Lines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 14;
    }
    this.cursorY += 12;

    const p2 = 'There is a very high difference between Govt. Value and market Value. Govt. Benchmark Value is not revised for that locality recently and to avoid high stamp Duty/Registration Charges Sale Deed are generally executed in under-valued rate.';
    const p2Lines = this.wrapText(p2, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of p2Lines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 14;
    }
    this.cursorY += 12;

    const p3 = 'The property is situated within a developed Residential area of Palia, Chhatrapur, Ganjam, Khurda. All the civic amenities like Bus Stop, Hotel, School, College, Market Place and Hospital are located within 2-3 Km radious from the property. So, it has a good force sale value. Some web screenshot attach for your reference.';
    const p3Lines = this.wrapText(p3, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of p3Lines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 14;
    }
    this.cursorY += 12;

    const p4 = 'So, the value given by us is justified considering the present market scenario.';
    const p4Lines = this.wrapText(p4, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of p4Lines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 14;
    }
    this.cursorY += 40;

    // Bottom Sign-off
    const valuerSig = 'Er. Satyajit Mohanty';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE);
    this.drawTextAt(`Date: ${d.signatureDate || '21.03.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.drawTextAt('Valuer', MARGIN_L + CONTENT_W - sigW, this.cursorY - 18, { bold: true, fontSize: FONT_SIZE });
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
  private drawBrownSectionHeader(num: string, title: string): void {
    const rowH = 18;
    this.checkPageBreak(rowH + 10);

    const wNum = num ? 24 : 0;
    const wTitle = CONTENT_W - wNum;

    if (num) {
      this.drawCell(MARGIN_L, this.cursorY, wNum, rowH, num, { bold: true, align: 'center', fillColor: SECTION_BANNER_BG, textColor: '#FFFFFF' });
    }
    this.drawCell(MARGIN_L + wNum, this.cursorY, wTitle, rowH, title, { bold: true, fillColor: SECTION_BANNER_BG, textColor: '#FFFFFF' });
    this.cursorY += rowH;
  }

  private draw2ColRowCustom(wLbl: number, label: string, value: string, boldValue = false): void {
    const wVal = CONTENT_W - wLbl;
    const lblLines = this.wrapText(label, wLbl - 6, FONT_SIZE_SMALL);
    const valLines = this.wrapText(value || 'NA', wVal - 6, FONT_SIZE_SMALL);
    const maxL = Math.max(lblLines.length, valLines.length, 1);
    const rowH = Math.max(18, maxL * FONT_SIZE_SMALL * LINE_HEIGHT + 6);

    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, wLbl, rowH, label, { bold: false, fillColor: LBL_BG, fontSize: FONT_SIZE_SMALL });
    this.drawCell(MARGIN_L + wLbl, this.cursorY, wVal, rowH, value || 'NA', { bold: boldValue, fontSize: FONT_SIZE_SMALL });
    this.cursorY += rowH;
  }

  private draw3ColRow(
    c1: { label: string; val: string },
    c2: { label: string; val: string },
    c3: { label: string; val: string }
  ): void {
    const colW = CONTENT_W / 3;
    const rowH = 28;
    this.checkPageBreak(rowH + 10);

    const renderBlock = (x: number, c: { label: string; val: string }) => {
      this.drawCell(x, this.cursorY, colW, rowH, `${c.label}:\n${c.val}`, { fontSize: FONT_SIZE_CAPTION });
    };

    renderBlock(MARGIN_L, c1);
    renderBlock(MARGIN_L + colW, c2);
    renderBlock(MARGIN_L + colW * 2, c3);
    this.cursorY += rowH;
  }

  private drawTextBlockRow(text: string): void {
    const lines = this.wrapText(text, CONTENT_W - 10, FONT_SIZE_CAPTION);
    const rowH = Math.max(20, lines.length * FONT_SIZE_CAPTION * LINE_HEIGHT + 8);
    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, rowH, text, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
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
