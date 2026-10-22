import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  FONT_SIZE,
  FONT_SIZE_TITLE,
  fetchBytes,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';
import { rgb } from 'pdf-lib';

export interface DCBHLLAPSMEFields {
  // Page 1: General Particulars
  refNo?: string;
  reportDate?: string;
  inspectionDate?: string;
  purposeOfValuation?: string;
  valuationRequestedBy?: string;
  suburbName?: string;
  caseNo?: string;
  typeOfLoan?: string;
  projectName?: string;
  borrowerName?: string;
  coBorrowerName?: string;
  propertyAddress?: string;
  pincode?: string;
  propertyOwner?: string;
  documentsSubmitted?: string;
  briefDescription?: string;
  typeOfProperty?: string;
  nameOfAccessRoad?: string;

  // Page 2: Surrounding Locality & Site Identification
  plotNoCtsNo?: string;
  classificationOfLocality?: string;
  distRailwayStation?: string;
  distBusStand?: string;
  distHospital?: string;
  modeOfTransport?: string;
  landTenure?: string;
  jurisdictionAuthority?: string;
  approvalsDrawings?: string;
  coopSocietyName?: string;

  // Boundary Details (As per Sale Deed)
  boundaryNorthDoc?: string;
  boundaryEastDoc?: string;
  boundaryWestDoc?: string;
  boundarySouthDoc?: string;

  // Boundary Details (Actual at Site)
  boundaryNorthSite?: string;
  boundaryEastSite?: string;
  boundaryWestSite?: string;
  boundarySouthSite?: string;

  // Verification & Checks
  unauthorizedPropertyList?: string;
  propertyIdentifiable?: string;
  propertyIdentifiedOnOwn?: string;
  accompaniedBy?: string;
  propertyDemarcated?: string;
  latitude?: string;
  longitude?: string;

  // Part II: Details of Structure and Specifications
  yearOfConstruction?: string;
  ageOfProperty?: string;
  estimatedFutureLife?: string;
  presentCondition?: string;
  immediateRepairsRequired?: string;
  typeOfConstruction?: string;
  permittedUse?: string;
  actualUse?: string;
  noOfFloors?: string;
  noOfLifts?: string;
  tanksPumps?: string;
  openSpaceFlooring?: string;
  compoundWallGate?: string;
  buildingElevation?: string;
  otherAmenities?: string;
  generalComments?: string;
  noOfFlatsEachFloor?: string;
  accBasement?: string;
  accGroundFloor?: string;
  accFirstFloor?: string;
  accSecondFloor?: string;

  // Part III: Details for Property Under Reference
  balconies?: string;
  wallsPlasterPaint?: string;
  doorsWindows?: string;
  typeOfFlooring?: string;
  toiletFlooringDado?: string;
  kitchenPlatformSink?: string;
  toiletsPlumbingFittings?: string;
  electricalInstallation?: string;
  riskOfDemolition?: string;
  mixedUseArea?: string;
  mixedUsePermitted?: string;
  occupiedBy?: string;
  selfOccupiedSince?: string;

  // Part IV: Assumptions & Valuation Basis
  drawingsApprovalsBasis?: string;
  plotAreaBasis?: string;
  marketRateVicinity?: string;

  // Part V: Valuation of Property
  areaBasementActual?: string;
  areaBasementPermissible?: string;
  areaGroundActual?: string;
  areaGroundPermissible?: string;
  areaFirstActual?: string;
  areaFirstPermissible?: string;
  areaSecondActual?: string;
  areaSecondPermissible?: string;
  areaThirdActual?: string;
  areaThirdPermissible?: string;
  totalActualArea?: string;
  totalPermissibleArea?: string;
  builtUpAreaSummary?: string;
  carpetAreaSummary?: string;
  landAreaAgreement?: string;
  adherenceByelaws?: string;
  deviationByelaws?: string;

  // Land & Building Valuation
  landArea?: string;
  landRate?: string;
  landValue?: string;
  bua100Desc?: string;
  bua100Rate?: string;
  bua100Value?: string;
  buaActualDesc?: string;
  buaActualRate?: string;
  buaActualValue?: string;
  totalValueOfBuilding?: string;
  forcedDistressValue?: string;

  // Stage of Construction
  stageOfConstructionDetails?: string;
  percentageCompletion?: string;
  percentageRecommended?: string;

  remarks?: string;

  // Part VI: Marketability
  marketabilitySale?: string;
  marketabilityLease?: string;

  // Part VII: Declaration & Signatures
  representativeName?: string;
  place?: string;

  // Attachments
  documentImages?: string[];
  documentImageNames?: string[];
  locationMapImages?: string[];
  propertyImages?: string[];
  propertyImageNames?: string[];
  projectCode?: string;
  [key: string]: any;
}

export class PDFDcbHlLapSmeRenderer extends PDFBankRenderer {
  private dcb: DCBHLLAPSMEFields;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.dcb = fields || {};
    if (projectCode && !this.dcb.projectCode) {
      this.dcb.projectCode = projectCode;
    }
  }

  async render(): Promise<Uint8Array> {
    await this.init();
    await this.drawContent();
    return await this.save();
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

  private draw2Col(label: string, value: string, boldVal = false, highlight = false) {
    const labelW = 210;
    const valW = CONTENT_W - labelW;
    this.drawKeyValueRow([
      {
        label,
        value: value || 'NA',
        labelWidth: labelW,
        valueWidth: valW,
        labelBold: true,
        bold: boldVal,
        highlight,
      },
    ]);
  }

  private async drawContent(): Promise<void> {
    // ── Main Header ─────────────────────────────────────────────────────────
    this.drawCenteredTitle('Valuation report', 14, true);
    this.advanceCursor(4);

    const refNoStr = `Ref. No.: ${this.dcb.caseNo || this.dcb.refNo || 'APPL01832712'}`;
    const dateStr = `Dated: ${this.dcb.reportDate || '17/07/2026'}`;
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: refNoStr, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
      { label: dateStr, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
    ]);
    this.advanceCursor(6);

    // ── I. General Particulars ───────────────────────────────────────────────
    this.drawSectionHeader('I. GENERAL PARTICULARS (VALUATION REPORT)');
    this.draw2Col('1. Purpose of valuation', this.dcb.purposeOfValuation || 'To assess fair market value for collateral security');
    this.draw2Col('2. Date of inspection and valuation', this.dcb.inspectionDate || '17/07/2026');
    this.draw2Col('3. Valuation requested by', this.dcb.valuationRequestedBy || 'DCB Bank Limited');
    this.draw2Col('4. Suburb name', this.dcb.suburbName || 'NA');
    this.draw2Col('5. Case no.', this.dcb.caseNo || 'APPL01832712');
    this.draw2Col('6. Type of loan', this.dcb.typeOfLoan || 'Home Loan / Business loan');
    this.draw2Col('7. Project name (if any)', this.dcb.projectName || 'NA');
    this.draw2Col('8. Name of the Borrower / Applicant', this.dcb.borrowerName || 'Aditya Narayan Jana', true);
    this.draw2Col('9. Name of the Co-Borrowers / Co applicant', this.dcb.coBorrowerName || 'NA');
    this.draw2Col('10. Property address', this.dcb.propertyAddress || 'Khata No-248/1290, Plot No-125/1795 (AC.0.049.5Decs, Homestead), Mouza-Gotalagram, Tahasil/PS-Balianta, Dist- Khordha, Odisha');
    this.draw2Col('11. Property Pincode', this.dcb.pincode || '752100');
    this.draw2Col('12. Property owner (as per doc.)', this.dcb.propertyOwner || 'Snehalata Jana, W/O-Asish Kumar Jana', true);
    this.draw2Col('13. Documents submitted', this.dcb.documentsSubmitted || 'Copy of Sale deed, ROR');
    this.draw2Col('14. Brief description of the property', this.dcb.briefDescription || 'Subject property is a G+1 storied under construction building, having land extent area 2156sqft. The total measured BUA 2706sqft, (GF-1353sqft and FF-1353sqft). Plan has been approved by BDA vide letter no- BP/BDA/024951 dated-16/01/2026 for G+1 residential building.');
    this.draw2Col('15. Type of the property', this.dcb.typeOfProperty || 'Under Construction');
    this.draw2Col('16. Name of access road', this.dcb.nameOfAccessRoad || '20ft wide Road');
    this.advanceCursor(8);

    // ── II. Locality & Site Identification ───────────────────────────────────
    this.drawSectionHeader('II. SURROUNDING LOCALITY & SITE IDENTIFICATION');
    this.draw2Col('17. S. No. , Plot No. and C.T.S. No.', this.dcb.plotNoCtsNo || 'Plot No-125/1795');
    this.draw2Col('18. Classification of locality', this.dcb.classificationOfLocality || 'Middle class');
    this.draw2Col(
      '19. Proximity to civic amenities',
      `Railway station: ${this.dcb.distRailwayStation || '15-Kms'} | Bus stand: ${this.dcb.distBusStand || '5-Kms'} | Hospital: ${this.dcb.distHospital || '10-Kms'}`
    );
    this.draw2Col('20. Mode of transport to the property', this.dcb.modeOfTransport || 'Road transport');
    this.draw2Col('21. Land freehold or leasehold', this.dcb.landTenure || 'Freehold');
    this.draw2Col('22. Jurisdiction / Local Municipal Body', this.dcb.jurisdictionAuthority || 'BDA');
    this.draw2Col('23. Approvals for drawings from authorities', this.dcb.approvalsDrawings || 'Plan has been approved by BDA vide letter no- BP/BDA/024951 dated-16/01/2026 for G+1 residential building');
    this.draw2Col('24. Name of Co-op Housing Society', this.dcb.coopSocietyName || 'NA');

    // 25. Boundaries Comparison Table
    this.advanceCursor(6);
    this.drawSubTitle('25. Boundary Details Comparison');
    const bHeaders = ['Direction', 'As per Sale Deed', 'Actual at Site'];
    const bColW = [90, (CONTENT_W - 90) / 2, (CONTENT_W - 90) / 2];
    const bRows = [
      ['North', this.dcb.boundaryNorthDoc || 'Road', this.dcb.boundaryNorthSite || 'Road'],
      ['East', this.dcb.boundaryEastDoc || 'Plot no-389', this.dcb.boundaryEastSite || 'Canal'],
      ['West', this.dcb.boundaryWestDoc || 'Plot no-125/1740', this.dcb.boundaryWestSite || 'Vacant plot'],
      ['South', this.dcb.boundarySouthDoc || 'Plot no-126', this.dcb.boundarySouthSite || 'Vacant plot'],
    ];
    this.drawTable(bHeaders, bRows, bColW);
    this.advanceCursor(6);

    this.draw2Col('26. Whether property in unauthorized list', this.dcb.unauthorizedPropertyList || 'NA');
    this.draw2Col('27. Property is easily identifiable', this.dcb.propertyIdentifiable || 'Yes(Identified by customer&Documents)');
    this.draw2Col('28. Whether property identified on own', this.dcb.propertyIdentifiedOnOwn || 'Yes(Identified by Documents)');
    this.draw2Col('29. Representative accompanied with', this.dcb.accompaniedBy || 'Customer');
    this.draw2Col('30. Property is demarcated', this.dcb.propertyDemarcated || 'Yes');
    this.draw2Col('31. Geo positioning (Latitude & Longitude)', `Latitude- ${this.dcb.latitude || '20.246750'}, Longitude: ${this.dcb.longitude || '-85.899194'}`);
    this.advanceCursor(8);

    // ── III. Structure and Specifications ────────────────────────────────────
    this.drawSectionHeader('III. DETAILS OF STRUCTURE AND SPECIFICATIONS (PART II)');
    this.draw2Col('1. Year of construction of building', this.dcb.yearOfConstruction || 'Under construction');
    this.draw2Col('2. Age of the property', this.dcb.ageOfProperty || '0-Years');
    this.draw2Col('3. Estimated future life', this.dcb.estimatedFutureLife || '60-years');
    this.draw2Col('4. Present condition of building', this.dcb.presentCondition || 'Good');
    this.draw2Col('5. Any immediate repairs required', this.dcb.immediateRepairsRequired || 'No');
    this.draw2Col('6. Type of construction', this.dcb.typeOfConstruction || 'RCC framed structure');
    this.draw2Col('7. Permitted use of the property', this.dcb.permittedUse || 'Residential');
    this.draw2Col('8. Actual use of the property', this.dcb.actualUse || 'Residential');
    this.draw2Col('9. No. of floors for building', this.dcb.noOfFloors || 'G+1');
    this.draw2Col('10. No. of lifts with capacity and type', this.dcb.noOfLifts || 'Nil');
    this.draw2Col('11. Type of underground/overhead tanks', this.dcb.tanksPumps || 'NA');
    this.draw2Col('12. Flooring in open spaces / stilts', this.dcb.openSpaceFlooring || 'NA');
    this.draw2Col('13. Compound wall and gated', this.dcb.compoundWallGate || 'NA');
    this.draw2Col('14. Building elevation', this.dcb.buildingElevation || 'G+1');
    this.draw2Col('15. Other amenities and special features', this.dcb.otherAmenities || 'NA');
    this.draw2Col('16. General comments on specifications', this.dcb.generalComments || 'NA');
    this.draw2Col('17. No. of floors', this.dcb.noOfFloors || '2');
    this.draw2Col('18. No. of flats on each floor', this.dcb.noOfFlatsEachFloor || 'NA');
    this.draw2Col('19. G. Floor Accommodation', this.dcb.accGroundFloor || '3 Rooms, 1 Hall, 1 Kitchen');
    this.draw2Col('19. F. Floor Accommodation', this.dcb.accFirstFloor || '4 Rooms, 1 Hall, 1 Kitchen');
    this.advanceCursor(8);

    // ── IV. Property Under Reference ─────────────────────────────────────────
    this.drawSectionHeader('IV. DETAILS FOR THE PROPERTY UNDER REFERENCE (PART III)');
    this.draw2Col('1. Balconies to rooms separate or merged', this.dcb.balconies || 'NA');
    this.draw2Col('2. Walls, plaster and painting', this.dcb.wallsPlasterPaint || 'completed');
    this.draw2Col('3. Doors and windows', this.dcb.doorsWindows || 'NA');
    this.draw2Col('4. Type of flooring', this.dcb.typeOfFlooring || 'Note done');
    this.draw2Col('5. Flooring in toilets / W.C. / bath, dado', this.dcb.toiletFlooringDado || 'Note done');
    this.draw2Col('6. Kitchen platform type and sink', this.dcb.kitchenPlatformSink || 'Note done');
    this.draw2Col('7. Toilets plumbing lines and sanitary fittings', this.dcb.toiletsPlumbingFittings || 'Note done');
    this.draw2Col('8. Electrical installation & concealed wiring', this.dcb.electricalInstallation || 'Note done');
    this.draw2Col('9. Risk of demolition (Valuers views)', this.dcb.riskOfDemolition || 'Low');
    this.draw2Col('10. Mixed use area details (if any)', this.dcb.mixedUseArea || 'NA');
    this.draw2Col('11. Mixed use permitted or unauthorized', this.dcb.mixedUsePermitted || 'NA');
    this.draw2Col('12. Property currently occupied by', this.dcb.occupiedBy || 'under construction');
    this.draw2Col('13. If self-occupied, then since when', this.dcb.selfOccupiedSince || 'NA');
    this.advanceCursor(8);

    // ── V. Assumptions & Valuation Basis ─────────────────────────────────────
    this.drawSectionHeader('V. ASSUMPTIONS, DATA AVAILABLE AND BASIS (PART IV)');
    this.draw2Col('1. Drawings and approvals', this.dcb.drawingsApprovalsBasis || 'Plan has been approved by BDA vide letter no- BP/BDA/024951 dated-16/01/2026');
    this.draw2Col('2. Plot area', `${this.dcb.plotAreaBasis || this.dcb.landArea || '2156'}sqft`);
    this.draw2Col('3. Age of the property', this.dcb.ageOfProperty || '0-Years');
    this.draw2Col('4. Estimated future Life', this.dcb.estimatedFutureLife || '60-years');
    this.draw2Col('5. Present condition of property and structure', this.dcb.presentCondition || 'Good');
    this.draw2Col('6. Comments on specifications and amenities', 'Good');
    this.draw2Col('7. Market rates of land in vicinity', this.dcb.marketRateVicinity || 'Rs.1000/- to Rs.1200/- Per Sq. ft');
    this.advanceCursor(8);

    // ── VI. Valuation of Property ───────────────────────────────────────────
    this.drawSectionHeader('VI. VALUATION OF THE PROPERTY (PART V)');
    this.drawSubTitle('(a) Area of Property (Permitted as per FSI / Byelaws vs Actual)');

    const fHeaders = ['Floor', 'Actual Area (approx.)', 'Permissible Area (as per byelaws/plan)'];
    const fColW = [140, (CONTENT_W - 140) / 2, (CONTENT_W - 140) / 2];
    const fRows = [
      ['Ground Floor', `${this.dcb.areaGroundActual || '1353'} sq. ft.`, `${this.dcb.areaGroundPermissible || '1339'} sq. ft.`],
      ['First Floor', `${this.dcb.areaFirstActual || '1353'} sq. ft.`, `${this.dcb.areaFirstPermissible || '1258'} sq. ft.`],
      ['TOTAL', `${this.dcb.totalActualArea || '2706'} sq. ft.`, `${this.dcb.totalPermissibleArea || '2597'} sq. ft.`],
    ];
    this.drawTable(fHeaders, fRows, fColW);
    this.advanceCursor(6);

    this.draw2Col('Built up / Saleable area (G+1)RCC', this.dcb.builtUpAreaSummary || '2706Sq. ft');
    this.draw2Col('Carpet area (approx.)', this.dcb.carpetAreaSummary || '2300Sq. ft');
    this.draw2Col('Adherence to building byelaws / FSI', this.dcb.adherenceByelaws || 'Yes / Approved by BDA');
    this.draw2Col('Deviation from building byelaws (if any)', this.dcb.deviationByelaws || 'Plot coverage/FSI / byelaws 100 %/2.0');
    this.advanceCursor(8);

    // Land and Building Valuation Grid
    this.drawSubTitle('(i) For Land & Building (Valuation Computation)');
    const vHeaders = ['Item', 'Description / Extent', 'Rate Adopted', 'Value (INR)'];
    const vColW = [35, 175, 120, CONTENT_W - 330];

    const landAreaNum = parseFloat(String(this.dcb.landArea || '2156').replace(/,/g, '')) || 2156;
    const landRateNum = parseFloat(String(this.dcb.landRate || '1200').replace(/,/g, '')) || 1200;
    const landValNum = landAreaNum * landRateNum;

    const bua100RateNum = parseFloat(String(this.dcb.bua100Rate || '1800').replace(/,/g, '')) || 1800;
    const buaPermNum = 2597;
    const bua100ValNum = buaPermNum * bua100RateNum;

    const completionPct = parseFloat(String(this.dcb.percentageCompletion || '80').replace(/%/g, '')) / 100 || 0.8;
    const buaActualRateNum = bua100RateNum * completionPct;
    const buaActualValNum = buaPermNum * buaActualRateNum;

    const totalValNum = landValNum + buaActualValNum;
    const distressValNum = Math.round(totalValNum * 0.8);

    const vRows = [
      ['A', `Land Area (${formatIndianCurrency(landAreaNum)} sq.ft)`, `Rs. ${formatIndianCurrency(landRateNum)}/-`, `Rs. ${formatIndianCurrency(landValNum)}/-`],
      ['B', `BUA @ 100% completion (2,597 sq.ft)`, `Rs. ${formatIndianCurrency(bua100RateNum)}/-`, `Rs. ${formatIndianCurrency(bua100ValNum)}/-`],
      ['C', `BUA as on date (${(completionPct * 100).toFixed(0)}% completion)`, `Rs. ${formatIndianCurrency(buaActualRateNum)}/-`, `Rs. ${formatIndianCurrency(buaActualValNum)}/-`],
      ['D', 'Total Value of Building (A + C) As on Date', 'Composite Valuation', `Rs. ${formatIndianCurrency(totalValNum)}/-`],
      ['-', 'Forced / Distress Sale Value (80%)', 'Distress Benchmark', `Rs. ${formatIndianCurrency(distressValNum)}/-`],
    ];
    this.drawTable(vHeaders, vRows, vColW, [3, 4]);
    this.advanceCursor(8);

    // Stage of Construction & Summary
    this.drawSubTitle('Stage of Construction & Final Valuation Summary');
    this.draw2Col('Details of Stage of Construction', this.dcb.stageOfConstructionDetails || '80% (Plastering & wall putty completed)');
    this.draw2Col('Percentage of completion (%)', `${this.dcb.percentageCompletion || '80'}%`);
    this.draw2Col('Percentage Recommended', `${this.dcb.percentageRecommended || '85'}%`);
    this.draw2Col('Total Fair Market Value', `Rs. ${formatIndianCurrency(totalValNum)}/- (${rupeesInWords(totalValNum)})`, true, true);
    this.draw2Col('Forced / Distress Sale Value (80%)', `Rs. ${formatIndianCurrency(distressValNum)}/- (${rupeesInWords(distressValNum)})`, true);
    this.advanceCursor(8);

    if (this.dcb.remarks) {
      this.drawRemarksBox('Remarks (If any)', this.dcb.remarks);
      this.advanceCursor(6);
    }

    // ── VII. Marketability & Declaration ─────────────────────────────────────
    this.drawSectionHeader('VII. MARKETABILITY & DECLARATION (PARTS VI & VII)');
    this.draw2Col('1. Marketability For Sale', this.dcb.marketabilitySale || 'Good');
    this.draw2Col('2. Marketability For Lease - Estimated Rental', this.dcb.marketabilityLease || 'Good');
    this.advanceCursor(8);

    this.drawSubTitle('Declaration');
    const declStatements = [
      '1. I have no direct or indirect interest in the property valued.',
      '2. Information furnished in the report is true and correct to the best of my knowledge and belief.',
      '3. Ownership papers / Sale deed may please be verified at your end to ascertain the right title & areas.',
      '4. Fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. Client is free to obtain other independent opinions on the same. Fair, market value of such properties / localities may increase or decrease, depending on the future market conditions & scenarios. Report does not certify or confirm any ownership or title of the property that has been valued.',
      '5. No structural survey was conducted by us.',
      '6. Validity of this report is for 90 days from date.',
      `7. I have deputed my representative Mr. ${this.dcb.representativeName || 'Sibato'} inspect the property, who has personally inspected the property on ${this.dcb.inspectionDate || '17/07/2026'}.`,
    ];

    for (const stmt of declStatements) {
      this.drawRemarksBox('', stmt, false);
      this.advanceCursor(2);
    }
    this.advanceCursor(10);

    // Signature Block
    this.checkPageBreak(50);
    const startY = this.pdfY(this.cursorY);
    const placeStr = `Place: ${this.dcb.place || 'Bhubaneswar'}`;
    const dateStr2 = `Date: ${this.dcb.reportDate || this.dcb.inspectionDate || '17/07/2026'}`;

    this.page.drawText(placeStr, {
      x: MARGIN_L,
      y: startY - FONT_SIZE,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    this.page.drawText(dateStr2, {
      x: MARGIN_L,
      y: startY - (FONT_SIZE * 2.2),
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    const rightText1 = 'for M/s S MOHANTY ASSOCIATES';
    const tw1 = this.fontBold.widthOfTextAtSize(rightText1, FONT_SIZE);
    this.page.drawText(rightText1, {
      x: MARGIN_L + CONTENT_W - tw1,
      y: startY - FONT_SIZE,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    const rightText2 = '(AUTHORIZED SIGNATORY)';
    const tw2 = this.fontRegular.widthOfTextAtSize(rightText2, FONT_SIZE - 1);
    this.page.drawText(rightText2, {
      x: MARGIN_L + CONTENT_W - tw2,
      y: startY - (FONT_SIZE * 2.2),
      size: FONT_SIZE - 1,
      font: this.fontRegular,
      color: rgb(0.2, 0.2, 0.2),
    });

    this.advanceCursor(40);

    // ── Attachments: Documents, Maps, Photographs ────────────────────────────
    await this.drawAttachmentPages();
  }

  private drawSubTitle(title: string) {
    this.checkPageBreak(18);
    const y = this.pdfY(this.cursorY);
    this.page.drawText(title, {
      x: MARGIN_L,
      y: y - 10,
      size: 9.5,
      font: this.fontBold,
      color: rgb(0.12, 0.22, 0.4),
    });
    this.advanceCursor(16);
  }

  private async drawAttachmentPages(): Promise<void> {
    // 1. Documents
    const docs = this.dcb.documentImages || [];
    const docNames = this.dcb.documentImageNames || [];
    if (docs.length > 0) {
      this.addNewPage();
      this.drawSectionHeader('ANNEXURE: VERIFIED PROPERTY DOCUMENTS');
      for (let i = 0; i < docs.length; i++) {
        const bytes = await fetchBytes(docs[i]);
        if (bytes) {
          await this.drawImageSection(bytes, docNames[i] || `Document ${i + 1}`, 220);
        }
      }
    }

    // 2. Maps
    const maps = this.dcb.locationMapImages || [];
    if (maps.length > 0) {
      this.addNewPage();
      this.drawSectionHeader(`ANNEXURE: LOCATION & MASTER PLAN MAPS (LAT: ${this.dcb.latitude || '20.246750'}, LONG: ${this.dcb.longitude || '-85.899194'})`);
      for (let i = 0; i < maps.length; i++) {
        const bytes = await fetchBytes(maps[i]);
        if (bytes) {
          await this.drawImageSection(bytes, `Site Location & Approvals Map ${i + 1}`, 240);
        }
      }
    }

    // 3. Photographs
    const photos = this.dcb.propertyImages || [];
    const photoNames = this.dcb.propertyImageNames || [];
    if (photos.length > 0) {
      this.addNewPage();
      this.drawSectionHeader('ANNEXURE: PROPERTY PHOTOGRAPHS (ACTUAL SITE INSPECTION)');
      const photoObjects: { bytes: Uint8Array; label?: string }[] = [];
      for (let i = 0; i < photos.length; i++) {
        const bytes = await fetchBytes(photos[i]);
        if (bytes) {
          photoObjects.push({
            bytes,
            label: photoNames[i] || `Photo ${i + 1}`,
          });
        }
      }
      if (photoObjects.length > 0) {
        await this.drawPhotoGrid(photoObjects, 'Property Photographs', 180, false);
      }
    }
  }
}

export default PDFDcbHlLapSmeRenderer;
