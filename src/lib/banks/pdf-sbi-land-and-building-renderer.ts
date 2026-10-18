/**
 * pdf-sbi-land-and-building-renderer.ts — Dedicated PDF Renderer for State Bank of India & IDBI Land & Building (Below 5CR)
 *
 * Implements:
 * - TO: THE CHIEF MANAGER / BRANCH HEAD, Bank Name, Branch, Dist...
 * - REF. NO & DATE Banner
 * - Section 1: Customer Details (Name of Owner, Appl. No., Case Type, Identified by & Mob No)
 * - Section 2: Property Details (Address, Nearby Landmark/Google Map Independent access)
 * - Section 3: Document Details (Layout plan, Building plan, Construction permission, Legal documents, Approving authority, Approval No & Date, List of documents)
 * - Section 4: Physical Details (Boundaries as per Agreement vs Sketch Map, Matching, Demarcated, Land use, Type of property, Rooms, Plinth areas, Life, Structure)
 * - Section 5: Tenure/ Occupancy Details (Status of tenure, Number of years of occupancy, Relationship of tenant to owner)
 * - Section 6: Stage of construction (Stage of construction, extent of completion)
 * - Section 7: Violations, if any, observed (Nature and extent of violations e.g. Horizontal Deviation-93%)
 * - Section 8: Area details of the property (Site Area, Carpet Area, Saleable Area, Plinth Area per Approval Block-1 & 2 vs Actual)
 * - Section 9: Valuation (THE LAND RATE ADOPTED IN THIS VALUATION breakdown)
 * - Section 10: Assumptions or remarks (REMARKS block)
 * - Section 11: Declaration (Clauses 1 to 3)
 * - Section 12: Name, Address and signature of the valuer
 * - Section 13: List of documents enclosed
 * - Section 14: List of photos enclosed
 * - Section 15: Marketability of the property (Standard procedural perception & Land/Building methodology narrative)
 * - DETAILS OF VALUATION (Floor-wise / Block-wise Plinth Area, Roof Height, Age, Replacement Rate, Cost, Depreciation, Net Value)
 * - VALUE OF THE PROPERTY (4-Row x 4-Column Table: Govt Guideline Value, Market Value, Realisable Value 95%, Distress Value 85% for Land, Building, Total, Or Say)
 * - Enclosures Checklist (a to i)
 * - Valuation Opinion Paragraph & Official Signatures
 * - DECLARATION CUM UNDERTAKING FROM VALUERS (Clauses a to z)
 * - MODEL CODE OF CONDUCT FOR VALUERS (Clauses 1 to 17+)
 * - Justification Letter to Chief Manager / Branch Head
 * - Inherited Enclosures: Photographs, Maps, Documents
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
  caseType?: string;
  identifiedByAndMobNo?: string;

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

  // 5. Tenure / Occupancy Details
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

  // 9. Valuation
  landRateAdoptedText?: string;

  // 10. Remarks
  generalRemarksText?: string;

  // 11. Declaration
  declarationText?: string;

  // 12. Valuer Details
  valuerNameAndAddress?: string;
  valuerWealthTaxReg?: string;
  signaturePlace?: string;
  signatureDate?: string;

  // 13 & 14 Enclosed lists
  listDocumentsEnclosed?: string;
  listPhotosEnclosed?: string;

  // 15 Marketability
  marketabilityNarrative?: string;

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

  // Final Value of Property Abstract (4 Rows x 4 Cols)
  abstractGovtLand?: string;
  abstractGovtBldg?: string;
  abstractGovtTotal?: string;
  abstractGovtOrSay?: string;

  abstractMarketLand?: string;
  abstractMarketBldg?: string;
  abstractMarketTotal?: string;
  abstractMarketOrSay?: string;

  abstractRealizablePct?: string;
  abstractRealizableLand?: string;
  abstractRealizableBldg?: string;
  abstractRealizableTotal?: string;
  abstractRealizableOrSay?: string;

  abstractDistressPct?: string;
  abstractDistressLand?: string;
  abstractDistressBldg?: string;
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

  // Opinion Words
  opinionMarketWords?: string;
  opinionRealizableWords?: string;
  opinionGovtLandWords?: string;
  opinionDistressWords?: string;

  // Valuer PAN & Justification
  valuerPan?: string;
  justificationLetterSubject?: string;
  justificationLetterBody?: string;

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

const SECTION_BANNER_BG = '#C26B2B'; // Standard warm reddish-brown matching the reference sample

export class PDFSBILandAndBuildingRenderer extends PDFBankRenderer {
  private reportFields: SBIBelow5CRFields;
  private projectCode?: string;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.reportFields = fields || {};
    this.projectCode = projectCode;
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    // 1. Cover & Main Technical Schedule (Pages 1 & 2: Points 1 to 15)
    this.drawCoverAndTechnicalSchedule();

    // 2. Details of Valuation, Value of Property Table & Enclosures (Page 3)
    this.drawValuationAbstractAndEnclosures();

    // 3. Declaration Cum Undertaking From Valuers (Clauses a to z)
    this.drawDeclarationCumUndertaking();

    // 4. Model Code of Conduct For Valuers (Clauses 1 to 17+)
    this.drawCodeOfConduct();

    // 5. Justification Letter
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

    // Ref No & Date Header Banner
    const refNo = d.refNo || this.projectCode || 'SMA/IDBI/07-2026/09';
    const repDate = d.reportDate || '24.07.2026';
    const refText = `REF. NO: ${refNo}`;
    const dateText = `DATE: ${repDate}`;
    this.drawTextAt(refText, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    const dtW = this.fontBold.widthOfTextAtSize(dateText, FONT_SIZE);
    this.drawTextAt(dateText, MARGIN_L + CONTENT_W - dtW, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 16;

    // ── SECTION 1: Customer Details ──
    this.drawBrownSectionHeader('1', 'Customer Details');
    this.drawSection1CustomerDetails(d);

    // ── SECTION 2: Property Details ──
    this.drawBrownSectionHeader('2', 'Property Details');
    this.draw2ColRowCustom(120, 'Address', d.propertyAddress || 'NA');
    const lm = d.nearbyLandmark || 'The subject property is situated nearer to landmark.';
    const coords = d.coordinatesText || (d.latitude && d.longitude ? `Latitude: ${d.latitude}, Longitude: ${d.longitude}` : '');
    const fullLm = coords ? `${lm}\n\n${coords}` : lm;
    this.draw2ColRowCustom(120, 'Nearby landmark', fullLm);

    // ── SECTION 3: Document Details ──
    this.drawBrownSectionHeader('3', 'Document Details');
    this.drawDocumentDetailsTable(d);
    this.draw2ColRowCustom(120, 'List of documents', d.listOfDocuments || 'Xerox copy of Agreement for Sale, Sketch Map, Patta, Approval Letter');

    // ── SECTION 4: Physical Details ──
    this.drawBrownSectionHeader('4', 'Physical Details');
    this.drawBoundariesTable(d);
    this.drawMatchingAndDemarcatedRow(d);
    this.drawRoomsMatrix(d);
    this.drawFloorsAndStructureMatrix(d);

    // Check page break for continuation
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
    this.draw2ColRowCustom(140, 'Stage of construction', d.stageOfConstruction || 'Ground Floor Completed (85%), First Floor Completed (80%)');

    // ── SECTION 7: Violations, if any, observed ──
    this.drawBrownSectionHeader('7', 'Violations, if any, observed');
    this.draw2ColRowCustom(140, 'Nature and extent of violations', d.natureExtentViolations || 'Horizontal Deviation-93%');

    // ── SECTION 8: Area details of the property ──
    this.drawBrownSectionHeader('8', 'Area details of the property');
    this.drawAreaDetailsTable(d);

    // ── SECTION 9: Valuation ──
    this.drawBrownSectionHeader('9', 'Valuation');
    this.drawValuationNarrativeRow(d);

    // ── SECTION 10: Assumptions or remarks ──
    this.drawBrownSectionHeader('10', 'Assumptions or remarks');
    this.drawFullRemarksBlock(d);

    // ── SECTION 11: Declaration ──
    this.drawBrownSectionHeader('11', 'Declaration');
    this.drawDeclaration3Points(d);

    // ── SECTION 12: Name, Address and signature of the valuer ──
    this.drawBrownSectionHeader('12', 'Name, Address and signature of the valuer');
    this.drawValuerSignatureRow(d);

    // ── SECTION 13: List of documents enclosed ──
    this.drawBrownSectionHeader('13', 'List of documents enclosed');
    this.drawTextBlockRow(d.listDocumentsEnclosed || 'Valuation Report, Benchmark Valuation, GPS Map, Photographs');

    // ── SECTION 14: List of photos enclosed ──
    this.drawBrownSectionHeader('14', 'List of photos enclosed');
    this.drawTextBlockRow(d.listPhotosEnclosed || 'Bed Room, Dinning, Drawing, Kitchen, Building with Road');

    // ── SECTION 15: Marketability of the property ──
    this.drawBrownSectionHeader('15', 'Marketability of the property');
    this.drawTextBlockRow(d.marketabilityNarrative || 'Valuation of the assets under consideration is carried out on the basis of our perception about the macro & micro economic factors presently governing the real estate industry, location of property, existing market conditions, degree of development of infrastructure in the area, Demand-supply conditions, internal amenities, common amenities etc.\n\nLand & building method of valuation has been adopted for finding the fair market value of the property.');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sub-table: Section 1 Customer Details (4-box layout)
  // ──────────────────────────────────────────────────────────────────────────
  private drawSection1CustomerDetails(d: SBIBelow5CRFields): void {
    const rowH = 34;
    this.checkPageBreak(rowH * 2 + 10);

    const wLbl1 = 110;
    const wVal1 = 195;
    const wLbl2 = 90;
    const wVal2 = CONTENT_W - wLbl1 - wVal1 - wLbl2;

    // Row 1: Name of the Owner & Appl. No.
    this.drawCell(MARGIN_L, this.cursorY, wLbl1, rowH, 'Name of the Owner', { bold: true });
    this.drawCell(MARGIN_L + wLbl1, this.cursorY, wVal1, rowH, d.ownerNameAndAddress || 'NA');
    this.drawCell(MARGIN_L + wLbl1 + wVal1, this.cursorY, wLbl2, rowH, 'Appl. No.', { bold: true });
    this.drawCell(MARGIN_L + wLbl1 + wVal1 + wLbl2, this.cursorY, wVal2, rowH, d.applicationNo || 'Not Available');
    this.cursorY += rowH;

    // Row 2: Case Type & Identified by & Mob No
    this.drawCell(MARGIN_L, this.cursorY, wLbl1, rowH, 'Case Type', { bold: true });
    this.drawCell(MARGIN_L + wLbl1, this.cursorY, wVal1, rowH, d.caseType || 'Fresh Valuation');
    this.drawCell(MARGIN_L + wLbl1 + wVal1, this.cursorY, wLbl2, rowH, 'Identified by & Mob No:', { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLbl1 + wVal1 + wLbl2, this.cursorY, wVal2, rowH, d.identifiedByAndMobNo || 'NA', { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sub-table: Document Details (Section 3)
  // ──────────────────────────────────────────────────────────────────────────
  private drawDocumentDetailsTable(d: SBIBelow5CRFields): void {
    const rows = [
      {
        item: 'Layout plan',
        avail: d.layoutPlanAvailable || 'Yes/ No',
        auth: d.layoutPlanAuthority || 'Bhubaneswar Development Authority',
        appNo: d.layoutPlanApprovalNo || 'Vide Letter No: BP/BDA/009678 on dated 07.05.2024 for construction of a G+2 storied (Block-1 & 2) Residential Building',
      },
      {
        item: 'Building plan',
        avail: d.buildingPlanAvailable || 'Yes/ No',
        auth: d.buildingPlanAuthority || 'Bhubaneswar Development Authority',
        appNo: d.buildingPlanApprovalNo || 'BP/BDA/009678',
      },
      {
        item: 'Construction permission',
        avail: d.constructionPermissionAvailable || 'Yes/ No',
        auth: d.constructionPermissionAuthority || 'Bhubaneswar Development Authority',
        appNo: d.constructionPermissionApprovalNo || 'BP/BDA/009678',
      },
      {
        item: 'Legal documents',
        avail: d.legalDocumentsAvailable || 'Yes/ No',
        auth: d.legalDocumentsAuthority || '',
        appNo: d.legalDocumentsApprovalNo || '',
      },
    ];

    const wItem = 110;
    const wAvail = 60;
    const wAuth = 135;
    const wAppNo = CONTENT_W - wItem - wAvail - wAuth;
    const rowH = 26;

    this.checkPageBreak(rowH * 4 + 10);

    for (const r of rows) {
      this.drawCell(MARGIN_L, this.cursorY, wItem, rowH, r.item, { bold: false, fillColor: LBL_BG });
      this.drawCell(MARGIN_L + wItem, this.cursorY, wAvail, rowH, r.avail, { align: 'center', fillColor: OPT_BG });
      this.drawCell(MARGIN_L + wItem + wAvail, this.cursorY, wAuth, rowH, r.auth, { align: 'left', fontSize: FONT_SIZE_CAPTION });
      this.drawCell(MARGIN_L + wItem + wAvail + wAuth, this.cursorY, wAppNo, rowH, r.appNo, { align: 'left', fontSize: FONT_SIZE_CAPTION });
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

    this.drawCell(MARGIN_L, this.cursorY, wHalf, rowH, 'Boundaries as per Agreement', { bold: true, align: 'center', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wHalf, this.cursorY, wHalf, rowH, 'Boundaries as per Sketch Map', { bold: true, align: 'center', fillColor: OPT_BG });
    this.cursorY += rowH;

    const dirs = [
      { dir: 'East:', doc: d.boundaryEastDoc || 'Sub Plot No-1153', verif: d.boundaryEastVerif || 'Sub Plot No-1153' },
      { dir: 'West:', doc: d.boundaryWestDoc || 'Road', verif: d.boundaryWestVerif || 'Road' },
      { dir: 'North:', doc: d.boundaryNorthDoc || 'Revenue Plot No-767', verif: d.boundaryNorthVerif || 'Revenue Plot No-767' },
      { dir: 'South:', doc: d.boundarySouthDoc || 'Road', verif: d.boundarySouthVerif || 'Road' },
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
    this.drawCell(MARGIN_L + w1 + w2 + w3 + w4 + w5 + w6, this.cursorY, w7, rowH, d.typeOfProperty || 'Land & Building', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private drawRoomsMatrix(d: SBIBelow5CRFields): void {
    const rowH = 20;
    this.checkPageBreak(rowH + 10);
    const colW = CONTENT_W / 5;

    this.drawCell(MARGIN_L, this.cursorY, colW, rowH, 'Number of rooms', { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW, this.cursorY, colW, rowH, `Living/ Dining: ${d.numberOfRoomsLiving || '2 Nos'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 2, this.cursorY, colW, rowH, `Bed rooms: ${d.numberOfRoomsBed || '5 Nos'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 3, this.cursorY, colW, rowH, `Toilets: ${d.numberOfRoomsToilets || '3 Nos'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 4, this.cursorY, colW, rowH, `Kitchens: ${d.numberOfRoomsKitchens || '1 Nos'}`, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private drawFloorsAndStructureMatrix(d: SBIBelow5CRFields): void {
    const rowH = 22;
    this.checkPageBreak(rowH + 10);
    const colW = CONTENT_W / 5;

    this.drawCell(MARGIN_L, this.cursorY, colW, rowH, `Total number of floors: ${d.totalNumberOfFloors || 'G+1 Storied'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW, this.cursorY, colW, rowH, `Area on which located: ${d.areaPropertyLocated || 'Kalyani Vihar Scheme'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 2, this.cursorY, colW, rowH, `Approx. age: ${d.approxAgeProperty || 'New'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 3, this.cursorY, colW, rowH, `Residential age: ${d.residualLifeProperty || '65 Yrs'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + colW * 4, this.cursorY, colW, rowH, `Type of structure: ${d.typeOfStructure || 'RCC Frame'}`, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Sub-table: Area details (Section 8 with Multi-Block Approval Support)
  // ──────────────────────────────────────────────────────────────────────────
  private drawAreaDetailsTable(d: SBIBelow5CRFields): void {
    const rowH1 = 68;
    const rowH2 = 42;
    const rowH3 = 22;
    this.checkPageBreak(rowH1 + rowH2 + rowH3 + 10);

    const wLbl = 100;
    const wVal1 = 140;
    const wLbl2 = 100;
    const wVal2 = CONTENT_W - wLbl - wVal1 - wLbl2;

    // Row 1: Site Area vs Plinth Area (As per Approval)
    this.drawCell(MARGIN_L, this.cursorY, wLbl, rowH1, 'Site Area', { bold: true });
    this.drawCell(MARGIN_L + wLbl, this.cursorY, wVal1, rowH1, d.siteAreaText || 'Ac.0.055 Dec i.e. 2400.00 Sft');
    this.drawCell(MARGIN_L + wLbl + wVal1, this.cursorY, wLbl2, rowH1, 'Plinth Area (As per Approval)', { bold: true, fontSize: FONT_SIZE_CAPTION });
    const appText = d.plinthAreaApprovalText || 'Block-1: Ground: 746 Sft, First: 746 Sft, Second: 746 Sft\nBlock-2: Ground: 746 Sft, First: 746 Sft, Second: 746 Sft';
    this.drawCell(MARGIN_L + wLbl + wVal1 + wLbl2, this.cursorY, wVal2, rowH1, appText, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH1;

    // Row 2: Carpet Area vs Plinth Area (As per Actual)
    this.drawCell(MARGIN_L, this.cursorY, wLbl, rowH2, 'Carpet Area', { bold: true });
    this.drawCell(MARGIN_L + wLbl, this.cursorY, wVal1, rowH2, d.carpetAreaText || '2440.00 Sft (Approx.)');
    this.drawCell(MARGIN_L + wLbl + wVal1, this.cursorY, wLbl2, rowH2, 'Plinth Area (As per Actual)', { bold: true, fontSize: FONT_SIZE_CAPTION });
    const actText = d.plinthAreaActualText || 'Block-1: Ground: 1440.00 Sft, First: 1440.00 Sft\nTotal: 2880.00 Sft';
    this.drawCell(MARGIN_L + wLbl + wVal1 + wLbl2, this.cursorY, wVal2, rowH2, actText, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH2;

    // Row 3: Saleable Area
    this.drawCell(MARGIN_L, this.cursorY, wLbl, rowH3, 'Saleable Area', { bold: true });
    this.drawCell(MARGIN_L + wLbl, this.cursorY, CONTENT_W - wLbl, rowH3, d.saleableAreaText || '2400.00 Sft (Land) & 2880.00 Sft (Building)');
    this.cursorY += rowH3;
  }

  private drawValuationNarrativeRow(d: SBIBelow5CRFields): void {
    const text = d.landRateAdoptedText || `THE LAND RATE ADOPTED IN THIS VALUATION:\n• GOVT. BENCHMARK VALUE: RS.1,69,65,000/- PER ACRE I.E. RS.389/- PER SFT\n• TOTAL LAND AREA: AC.0.055 DEC I.E. 2400.00 SFT\n• GUIDELINE VALUE OF LAND= 2400.00 SFT X RS.389/- PER SFT =RS.9,33,600/-\n• THE PREVAILING MARKET RATE OF THE LAND IS RS.2400/- TO RS.2600/- PER SFT.\n• THE ADOPTED MARKET RATE OF THE LAND IS RS.2500/- PER SFT FOR VALUATION PURPOSE.\n• TOTAL MARKET VALUE: 2400.00 SFT X RS.2500/- PER SFT = RS.60,00,000/-`;
    this.drawTextBlockRow(text);
  }

  private drawFullRemarksBlock(d: SBIBelow5CRFields): void {
    const text = d.generalRemarksText || `REMARKS:\nSUBJECT PROPERTY IS AN UNDER CONSTRUCTED G+1 STORIED BUILDING, LAND EXTENT OF AC.0.055 DEC I.E. 2400.00 SFT. PROPERTY LOCATED IN A GOOD DEVELOPED RESIDENTIAL AREA OF KALYANI VIHAR, KANTILO, BHUBANESWAR. THIS PROPERTY IS COMING UNDER BHUBANESWAR DEVELOPMENT AUTHORITY AREA LIMIT. ALL CIVIC AMENITIES ARE PRESENT 2-3 KM FROM THE PROPERTY. VALUATION HAS BEEN DONE FOR LAND & APPROVED BUA OF THE G+1 STORIED BUILDING (BLOCK-1).`;
    this.drawTextBlockRow(text);
  }

  private drawDeclaration3Points(d: SBIBelow5CRFields): void {
    const text = d.declarationText || `1) The property was inspected by the undersigned on ${d.signatureDate || '24.07.2026'}\n2) The undersigned does not have any direct/indirect interest in the above property.\n3) The information furnished herein is true and correct to the best of our knowledge.`;
    this.drawTextBlockRow(text);
  }

  private drawValuerSignatureRow(d: SBIBelow5CRFields): void {
    const rowH = 46;
    this.checkPageBreak(rowH + 10);

    const wLbl = 100;
    const wVal = CONTENT_W - wLbl - 130;
    const wSig = 130;

    this.drawCell(MARGIN_L, this.cursorY, wLbl, rowH, 'Name and Address', { bold: true });
    const valuerDetails = d.valuerNameAndAddress || 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)\nPlot No: 858 (P) & 859 (P), Near Astha Binodini Apartment, Siba Nagar, Rajarani, Tankapani Road, Bhubaneswar-751018';
    this.drawCell(MARGIN_L + wLbl, this.cursorY, wVal, rowH, valuerDetails, { fontSize: FONT_SIZE_CAPTION });

    this.drawCell(MARGIN_L + wLbl + wVal, this.cursorY, wSig, rowH / 2, 'Signature', { bold: true, align: 'center' });
    this.drawCell(MARGIN_L + wLbl + wVal, this.cursorY + rowH / 2, wSig, rowH / 2, `Date: ${d.signatureDate || '24.07.2026'}`, { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Details of Valuation, Value of Property Table & Enclosures (Page 3)
  // ──────────────────────────────────────────────────────────────────────────
  private drawValuationAbstractAndEnclosures(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 20;

    // Top Title: DETAILS OF VALUATION
    this.drawCenteredTitle('DETAILS OF VALUATION', FONT_SIZE_HEADER);
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
      ['RCC GROUND FLOOR (BLOCK-1)', '746.00', "10'-6\"", 'New', 'Rs. 2,000.00', 'Rs. 1,492,000.00', 'Rs. 0.00', 'Rs. 1,492,000.00'],
      ['RCC FIRST FLOOR (BLOCK-1)', '746.00', "10'-6\"", 'New', 'Rs. 1,500.00', 'Rs. 1,119,000.00', 'Rs. 0.00', 'Rs. 1,119,000.00'],
    ];

    const rows = d.valItems && d.valItems.length > 0
      ? d.valItems.map(it => [it.particulars, it.plinthArea, it.roofHeight, it.age, it.rate, it.cost, it.depreciation, it.netValue])
      : defaultItems;

    this.drawTable(headers, rows, colW, [0], [0, 1], [], [], [], ['left', 'right', 'center', 'center', 'right', 'right', 'right', 'right'], ['center', 'center', 'center', 'center', 'center', 'center', 'center', 'center']);

    // Total Row
    const rowH = 18;
    const totW = colW[0] + colW[1] + colW[2] + colW[3] + colW[4];
    this.drawCell(MARGIN_L, this.cursorY, totW, rowH, 'TOTAL :', { bold: true, align: 'right', fillColor: LBL_BG });
    this.drawCell(MARGIN_L + totW, this.cursorY, colW[5] + colW[6] + colW[7], rowH, d.valTotalNetValue || 'Rs. 2,611,000.00', { bold: true, align: 'right', fillColor: OPT_BG });
    this.cursorY += rowH + 20;

    // ── VALUE OF THE PROPERTY (4-Row x 4-Column Table) ──
    this.drawCenteredTitle('VALUE OF THE PROPERTY', FONT_SIZE_HEADER);
    this.cursorY += 8;

    const rPct = d.abstractRealizablePct || '95';
    const dPct = d.abstractDistressPct || '85';

    const valHeaders = ['', 'LAND', 'BUILDING', 'TOTAL IN RS', 'OR SAY'];
    const valColW = [140, 85, 85, 87.28, 90];

    const valRows = [
      [
        'GOVT. GUIDE LINE VALUE',
        d.abstractGovtLand || 'Rs. 933,600.00',
        d.abstractGovtBldg || 'Rs. 1,958,250.00',
        d.abstractGovtTotal || 'Rs. 2,891,850.00',
        d.abstractGovtOrSay || 'Rs. 2,892,000.00',
      ],
      [
        'MARKET VALUE IN RS',
        d.abstractMarketLand || 'Rs. 6,000,000.00',
        d.abstractMarketBldg || 'Rs. 2,611,000.00',
        d.abstractMarketTotal || 'Rs. 8,611,000.00',
        d.abstractMarketOrSay || 'Rs. 8,611,000.00',
      ],
      [
        `REALISABLE VALUE (${rPct}%)`,
        d.abstractRealizableLand || 'Rs. 5,700,000.00',
        d.abstractRealizableBldg || 'Rs. 2,480,450.00',
        d.abstractRealizableTotal || 'Rs. 8,180,450.00',
        d.abstractRealizableOrSay || 'Rs. 8,180,000.00',
      ],
      [
        `DISTRESS/FORCED SALE VALUE (${dPct}%)`,
        d.abstractDistressLand || 'Rs. 5,100,000.00',
        d.abstractDistressBldg || 'Rs. 2,219,350.00',
        d.abstractDistressTotal || 'Rs. 7,319,350.00',
        d.abstractDistressOrSay || 'Rs. 7,319,000.00',
      ],
    ];

    this.drawTable(valHeaders, valRows, valColW, [0, 1, 2, 3], [0], [], [], [], ['left', 'right', 'right', 'right', 'right'], ['center', 'center', 'center', 'center', 'center']);
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

    const mVal = d.abstractMarketOrSay || d.abstractMarketTotal || 'Rs.8,611,000/-';
    const mWords = d.opinionMarketWords || 'Eighty Six Lakhs Eleven Thousand only';
    const rVal = d.abstractRealizableOrSay || d.abstractRealizableTotal || 'Rs.8,180,000/-';
    const rWords = d.opinionRealizableWords || 'Eighty One Lakhs Eighty Thousand only';
    const gVal = d.abstractGovtOrSay || d.abstractGovtTotal || 'Rs.2,892,000/-';
    const gWords = d.opinionGovtLandWords || 'Twenty Eight Lakhs Ninety Two Thousand only';
    const dVal = d.abstractDistressOrSay || d.abstractDistressTotal || 'Rs.7,319,000/-';
    const dWords = d.opinionDistressWords || 'Seventy Three Lakhs Nineteen Thousand only';

    const opP = `As a result of my appraisal and analysis, it is my considered opinion that the present Fair Market Value of the above property in the prevailing condition with aforesaid specifications is ${mVal} (Rupees ${mWords}). The Realizable Value of the above Property is ${rVal} (Rupees ${rWords}). The book value of the above property as of Land is ${gVal} (Rupees ${gWords}) and the distress value ${dVal} (Rupees ${dWords}).`;

    const lines = this.wrapText(opP, CONTENT_W, FONT_SIZE_SMALL);
    for (const l of lines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_SMALL });
      this.cursorY += 12;
    }
    this.cursorY += 24;

    const valuerSig = 'Signature of the Approved Valuer and Seal';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: ${d.signatureDate || '24.07.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
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
      { id: 'c.', text: `The information furnished in my valuation report dated ${d.reportDate || '24.07.2026'} is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.` },
      { id: 'd.', text: `I have personally inspected the property on ${d.signatureDate || '24.07.2026'} & I have valued the property which is identified by documents & help of customer. The work is not sub-contracted to any other valuer & carried out by myself.` },
      { id: 'e.', text: 'Valuation report is submitted in the format as prescribed by the bank.' },
      { id: 'f.', text: 'I have not been depanelled by any other bank and in case any such depanelment by other banks during my empanelment with you, I will inform you within three days of such depanelment.' },
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
    const startY = this.cursorY;

    let y1 = startY;
    for (let i = 0; i < 13; i++) {
      const c = clauses[i];
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
    for (let i = 13; i < clauses.length; i++) {
      const c = clauses[i];
      this.drawTextAt(c.id, col2X, y2, { bold: true, fontSize: FONT_SIZE_CAPTION });
      const lines = this.wrapText(c.text, colW - 14, FONT_SIZE_CAPTION);
      for (const l of lines) {
        this.drawTextAt(l, col2X + 14, y2, { fontSize: FONT_SIZE_CAPTION });
        y2 += 9.5;
      }
      y2 += 4;
    }

    this.cursorY = Math.max(y1, y2) + 20;

    const valuerSig = 'Signature of the Approved Valuer and Seal';
    const sigW = this.fontBold.widthOfTextAtSize(valuerSig, FONT_SIZE_SMALL);
    this.drawTextAt(`Date: ${d.signatureDate || '24.07.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Model Code of Conduct (Points 1 to 17+)
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
        ],
      },
    ];

    const col2Sections = [
      {
        header: 'Independence and Disclosure of Interest',
        items: [
          '10. A Valuer shall not carry out any instruction of the client insofar as they are incompatible with the requirements of integrity, objectivity and independence.',
          '11. A Valuer shall act with objectivity in his/its professional dealings by ensuring that his/its decisions are made without the presence of any bias, conflict of interest, coercion, or undue influence of any party.',
          '12. A Valuer shall not take up an assignment if he/it or any of his/its relatives or associates is not independent.',
          '13. A Valuer shall maintain complete independence in his/its professional relationships and shall conduct the valuation independent of external influences.',
          '14. A Valuer shall wherever necessary disclose to the clients, possible sources of conflicts of duties and interests.',
          '15. A Valuer shall not deal in securities of any subject company after any time when he/it first becomes aware of the possibility of his/its association with the valuation.',
          '16. A Valuer shall not indulge in "mandate snatching" or offering "convenience valuations" in order to cater to a company or client\'s needs.',
          '17. As an independent Valuer, the Valuer shall not charge success fee.',
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
    this.drawTextAt(`Date: ${d.signatureDate || '24.07.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt('Signature', MARGIN_L + CONTENT_W - sigW, this.cursorY - 14, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.drawTextAt(valuerSig, MARGIN_L + CONTENT_W - sigW, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 12;
    this.drawTextAt(`Place: ${d.signaturePlace || 'Bhubaneswar'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Justification Letter
  // ──────────────────────────────────────────────────────────────────────────
  private drawJustificationLetter(): void {
    const d = this.reportFields;
    this.addPage();
    this.cursorY = 25;

    const toLines = [
      'TO,',
      d.toAuthority || 'THE CHIEF MANAGER / BRANCH HEAD,',
      d.bankName || 'STATE BANK OF INDIA,',
      d.branchAddress || 'JHARSUGUDA BRANCH, DIST: JHARSUGUDA, ODISHA',
    ];

    for (const line of toLines) {
      this.drawTextAt(line, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL + 1 });
      this.cursorY += 13;
    }
    this.cursorY += 14;

    const sub = d.justificationLetterSubject || `Sub: - Justification of valuation Report of ${d.borrowerName || d.ownerNameAndAddress || 'Customer'}.`;
    this.drawTextAt(sub, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_SMALL });
    this.cursorY += 20;

    this.drawTextAt('Dear Sir,', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
    this.cursorY += 16;

    const defaultBody = d.justificationLetterBody || `The subject property is located in a developed residential area. There is variation between Market value and Guideline value because Guideline rates are not revised regularly and to avoid high stamp duty/registration charges sale deeds are executed at under-valued rates.\n\nSo, the value given by us is justified considering the present market scenario.`;

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
    this.drawTextAt(`Date: ${d.signatureDate || '24.07.2026'}`, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE });
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
  private drawBrownSectionHeader(secNum: string, title: string): void {
    const rowH = 18;
    this.checkPageBreak(rowH + 10);
    const wNum = 20;
    const wTitle = CONTENT_W - wNum;

    this.drawCell(MARGIN_L, this.cursorY, wNum, rowH, secNum, { bold: true, align: 'center', fillColor: SECTION_BANNER_BG, textColor: '#FFFFFF' });
    this.drawCell(MARGIN_L + wNum, this.cursorY, wTitle, rowH, title, { bold: true, fillColor: SECTION_BANNER_BG, textColor: '#FFFFFF' });
    this.cursorY += rowH;
  }

  private draw2ColRowCustom(wTitle: number, title: string, value: string, boldTitle = false): void {
    const wVal = CONTENT_W - wTitle;
    const titleLines = this.wrapText(title, wTitle - 8, FONT_SIZE_CAPTION);
    const valLines = this.wrapText(value || 'NA', wVal - 8, FONT_SIZE_CAPTION);
    const maxL = Math.max(titleLines.length, valLines.length);
    const rowH = Math.max(18, maxL * FONT_SIZE_CAPTION * LINE_HEIGHT + 6);

    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, wTitle, rowH, title, { bold: boldTitle, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wTitle, this.cursorY, wVal, rowH, value || 'NA');
    this.cursorY += rowH;
  }

  private draw3ColRow(col1: { label: string; val: string }, col2: { label: string; val: string }, col3: { label: string; val: string }): void {
    const rowH = 28;
    this.checkPageBreak(rowH + 10);

    const wLbl1 = 80;
    const wVal1 = 110;
    const wLbl2 = 90;
    const wVal2 = 50;
    const wLbl3 = 90;
    const wVal3 = CONTENT_W - wLbl1 - wVal1 - wLbl2 - wVal2 - wLbl3;

    this.drawCell(MARGIN_L, this.cursorY, wLbl1, rowH, col1.label, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLbl1, this.cursorY, wVal1, rowH, col1.val, { fontSize: FONT_SIZE_CAPTION });

    this.drawCell(MARGIN_L + wLbl1 + wVal1, this.cursorY, wLbl2, rowH, col2.label, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLbl1 + wVal1 + wLbl2, this.cursorY, wVal2, rowH, col2.val, { align: 'center', fontSize: FONT_SIZE_CAPTION });

    this.drawCell(MARGIN_L + wLbl1 + wVal1 + wLbl2 + wVal2, this.cursorY, wLbl3, rowH, col3.label, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLbl1 + wVal1 + wLbl2 + wVal2 + wLbl3, this.cursorY, wVal3, rowH, col3.val, { align: 'center', fontSize: FONT_SIZE_CAPTION });

    this.cursorY += rowH;
  }

  private drawTextBlockRow(text: string): void {
    const lines = this.wrapText(text, CONTENT_W - 12, FONT_SIZE_CAPTION);
    const rowH = Math.max(22, lines.length * FONT_SIZE_CAPTION * LINE_HEIGHT + 8);
    this.checkPageBreak(rowH + 6);

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

// Backwards compatibility alias
export { PDFSBILandAndBuildingRenderer as PDFSBIBelow5CRRenderer };
