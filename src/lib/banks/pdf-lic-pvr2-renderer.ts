import {
  PDFBankRenderer,
  MARGIN_L,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_CAPTION,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  VAL_BG,
  fetchBytes,
} from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';

export interface LICPVR2ReportFields {
  // Top Header Metadata
  fileNo?: string;
  nameOfValuer?: string;
  codeNo?: string;
  appointingAuthority?: string;
  dateOfValuation?: string;
  reraNo?: string;

  // A. GENERAL
  applicantName?: string;
  builderDeveloperName?: string;
  documentsProduced?: string;
  flatNoFloorNo?: string;
  blockNoDoorNoStreet?: string;
  apartmentName?: string;
  plotNoKhataNo?: string;
  villageTalukWard?: string;
  districtPin?: string;
  locationSketchVerified?: string;
  surroundingDevelopmentClass?: string;
  basicAmenitiesAvailable?: string;
  negativesToLocality?: string;
  favourableConsiderations?: string;
  otherFeaturesNotice?: string;

  // B. ENTIRE PROJECT
  totalExtentLandSqft?: string;
  boundaryNorth?: string;
  boundarySouth?: string;
  boundaryEast?: string;
  boundaryWest?: string;
  landDimensionsTallyPlan?: string;
  landDimensionsTallyDeed?: string;
  naPermissionObtained?: string;
  environmentClearanceObtained?: string;

  // C. DRAWING APPROVAL
  planningPermitNoDate?: string;
  validityUpto?: string;
  validityExpiredRenewed?: string;
  isPlanForResidential?: string;
  approvalAuthority?: string;

  // D. INSPECTION (18 Comparative rows)
  noOfBlocksApproved?: string;
  noOfBlocksActual?: string;
  noOfFloorsApproved?: string;
  noOfFloorsActual?: string;
  totalBuiltUpAreaApproved?: string;
  totalBuiltUpAreaActual?: string;
  totalCarpetAreaApproved?: string;
  totalCarpetAreaActual?: string;
  noOfDwellingUnitsApproved?: string;
  noOfDwellingUnitsActual?: string;
  plotCoverageApproved?: string;
  plotCoverageActual?: string;
  fsiApproved?: string;
  fsiActual?: string;
  tdrApproved?: string;
  tdrActual?: string;

  qualityOfConstruction?: string;
  costOfLandUnitRate?: string;
  costOfLandMarketValue?: string;
  costOfLandGuidelineRate?: string;
  costOfLandGuidelineValue?: string;
  costOfLandTdrPurchaseCost?: string;
  constructionCostOfProject?: string;
  totalCostOfProject?: string;
  unitRateForFlatMarket?: string;
  marketValueOfFlat?: string;
  guidelineRateForFlat?: string;
  guidelineValueOfFlat?: string;
  sourceForArrivingAtMarketValue?: string;
  ratePerSqftForConstruction?: string;
  waterResources?: string;
  sewerageSystem?: string;
  electricityConnection?: string;
  noOfLifts?: string;
  dateOfCommencement?: string;
  proposedDateOfCompletion?: string;
  isConstructionAsPerApprovedPlan?: string;
  deviationBetweenDrawingAndActual?: string;
  deviationMinorMajorNature?: string;
  deviationRevisedApprovalReqd?: string;
  progressEntireProject?: string;
  progressBlockFloorWise?: string;
  nbcAndNdmaAdhered?: string;
  highTensionLinePassing?: string;

  // E. FLAT UNDER CONSTRUCTION
  udsAsPerSaleDeed?: string;
  valueOfUds?: string;
  isUdsInProportionToBuiltUp?: string;
  correctUdsIfNotProportion?: string;
  specRoof?: string;
  specFlooring?: string;
  superBuiltUpAreaFlat?: string;
  carpetAreaFlat?: string;
  costOfFlatAgreement?: string;
  totalCostOfFlatTotal?: string;
  compositeRatePerSqft?: string;
  isRateGenuine?: string;
  genuineRateIfNot?: string;
  marketabilityOfProperty?: string;

  // F. VALUATION
  valStageWorksPct?: string;
  valStageWorksValue?: string;
  valUdsAsPerSaleDeed?: string;
  valTotalStageValueOfFlat?: string;
  valUsageOfBuilding?: string;

  // G. RECOMMENDATION
  recSno?: string;
  recStageOfConstruction?: string;
  recProgressPct?: string;

  // H. NARRATIVES
  narrativeBackground?: string;
  narrativeSources?: string;
  narrativeProcedures?: string;
  narrativeMethodology?: string;
  narrativeFactors?: string;

  // 9. CERTIFICATE
  certificateDate?: string;
  certificatePlace?: string;
  valuerSignatureName?: string;

  // Enclosures
  propertyImages?: string[];
  propertyImageNames?: string[];
  locationMapImages?: string[];
  locationMapImage?: string;
  mouzaMapImages?: string[];
  sketchMapImages?: string[];
  cadastralMapImages?: string[];
  bdaMapImages?: string[];
  documentImages?: any[];
  documentImageNames?: string[];

  [key: string]: any;
}

export class PDFLICPVR2Renderer extends PDFBankRenderer {
  private reportFields: LICPVR2ReportFields;
  private projectCode?: string;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.reportFields = fields || {};
    this.projectCode = projectCode;
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    // ── Page 1: Header + Section A. GENERAL ──
    this.drawCoverAndGeneral();

    // ── Page 2: Section B. ENTIRE PROJECT + C. DRAWING APPROVAL + D. INSPECTION (Table 1) ──
    this.drawEntireProjectAndApprovals();

    // ── Page 3: D. INSPECTION (Items 2 to 16) ──
    this.drawInspectionDetails();

    // ── Page 4: Section E. FLAT UNDER CONSTRUCTION + F. VALUATION + G. REC ──
    this.drawFlatValuationAndRec();

    // ── Page 5: H. NARRATIVES + 9. CERTIFICATE ──
    this.drawNarrativesAndCertificate();

    // ── Enclosures: Maps, Documents, Photographs ──
    await this.drawEnclosures();

    return await this.save();
  }

  private drawCoverAndGeneral(): void {
    const d = this.reportFields;
    this.cursorY = 20;

    // Header Banner
    this.drawCenteredReportTitle('PVR-2', FONT_SIZE_TITLE, true);
    this.cursorY += 2;
    this.drawCenteredReportTitle('LIC HOUSING FINANCE LIMITED', FONT_SIZE_HEADER, true);
    this.cursorY += 2;
    this.drawCenteredReportTitle('Area Office: Bhubaneswar.', FONT_SIZE_CAPTION, false);
    this.cursorY += 2;
    this.drawCenteredReportTitle('FLAT UNDER CONSTRUCTION', FONT_SIZE, true, true);
    this.cursorY += 10;

    // Boxed Title
    this.drawBorderedBoxTitle('VALUATION REPORT BY PANEL VALUER FOR HOME LOAN');
    this.cursorY += 12;

    // Metadata block
    const metaH = 14;
    const metaRows = [
      { label: '* File No.', val: `: ${d.fileNo || '9002050007125'}` },
      { label: '* Name of the Valuer', val: `: ${d.nameOfValuer || 'Er. Satyajit Mohanty'}` },
      { label: '* Code No.', val: `: ${d.codeNo || 'BH-AOV0078'}` },
      { label: '*Appointing Authority:', val: `: ${d.appointingAuthority || 'LIC HFL(Br-I)'}` },
      { label: '*Date of Valuation', val: `: ${d.dateOfValuation || '30/07/2025'}` },
      { label: '*RERA No.(For Flats)', val: `: ${d.reraNo || 'NA'}` },
    ];

    for (const r of metaRows) {
      this.drawTextAt(r.label, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
      this.drawTextAt(r.val, MARGIN_L + 120, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
      this.cursorY += metaH;
    }
    this.cursorY += 10;

    // A. GENERAL Title
    this.drawLeftSectionTitle('A. GENERAL');

    const wNum = 24;
    const wTitle = 160;
    const wVal = CONTENT_W - wNum - wTitle;

    const rowsA = [
      { n: '1.', t: '*File No.', v: d.fileNo || '9002050007125' },
      { n: '2.', t: '*Name of the Applicant', v: d.applicantName || 'Mrs. Suchitra Moharana ,W/o:-Mr. Ranjan Kumar Sahoo' },
      { n: '3.', t: 'Name of the Builder/Developer', v: d.builderDeveloperName || 'M/s. Ajjiban Construction Pvt. Ltd.' },
      { n: '4.', t: 'Documents produced for perusal', v: d.documentsProduced || 'Copy of Agreement for sale & Allotment letter' },
      { n: '5.', t: '*Location of the property\nFlat No/ Floor No.\nBlock No./Door No. /Street\nName of the apartment\nPlot No. /S.F. No./T.S.No. /R.S.No.\nVillage/Block No./Taluk/Ward No.\nDistrict/Corporation/Municipality', v: `Flat no-402,3-BHK\n4th Floor\n"${d.apartmentName || 'Subhadra Palace'}"\n${d.plotNoKhataNo || 'Plot No-1236/2887,1236/2897 & 1236/4503,Khata No-1057/702 & 1057/2428'}\n${d.villageTalukWard || 'Mouza-Bhubaneswar Sahar Unit-32,Gobindparsad,PS-New Capital(46), TS-Bhubaneswar(244)'}\n${d.districtPin || 'Dist-Khurda,Odisha Pin-751007'}` },
      { n: '6.', t: 'Location Sketch Verified (Yes/No)', v: d.locationSketchVerified || 'Yes' },
      { n: '7.', t: 'Development of surrounding area with\nSpecial reference to population\n(Lower class/ Middle/ Upper Middle/Posh)', v: d.surroundingDevelopmentClass || 'Middle Class' },
      { n: '8.', t: 'Whether basic amenities like water,\nelectricity, roads, sewerage, telephone\nare available', v: d.basicAmenitiesAvailable || 'Yes' },
      { n: '9.', t: 'Any negatives to the locality/ property\n(Crematoriums, slums, riot prone, gases\nChemical hazards, nagbana etc)', v: d.negativesToLocality || 'No' },
      { n: '10.', t: 'Any favorable considerations for addl.\nvalue', v: d.favourableConsiderations || 'All civic amenities like school,hospital,\nmarket area are within 3-5Kms.' },
      { n: '11.', t: 'Any other features like board of other\nfinancier indicating mortgage, notice of\nCourt/any authority which may affect the\nsecurity.', v: d.otherFeaturesNotice || 'Not Observed' },
    ];

    for (const r of rowsA) {
      this.draw3ColTableRow(wNum, wTitle, wVal, r.n, r.t, r.v);
    }
  }

  private drawEntireProjectAndApprovals(): void {
    this.addPage();
    this.cursorY = 20;

    const d = this.reportFields;

    // B. ENTIRE PROJECT
    this.drawLeftSectionTitle('B. ENTIRE PROJECT');

    const wItem = 24;
    const wDesc = 200;
    const wVal = CONTENT_W - wItem - wDesc;

    // 1. Total extent of land
    this.draw3ColTableRow(wItem, wDesc, wVal, '1.', 'Total extent of the land as per actual', d.totalExtentLandSqft || '5401sqft');

    // 2. Boundaries
    this.drawSubHeaderBox('2. Boundaries');
    const wDir = 120;
    const wBound = CONTENT_W - wDir;
    this.drawCell(MARGIN_L, this.cursorY, wDir, 18, 'North/Front', { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDir, this.cursorY, wBound, 18, d.boundaryNorth || 'Flat No-401', { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 18;

    this.drawCell(MARGIN_L, this.cursorY, wDir, 18, 'South/Rear', { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDir, this.cursorY, wBound, 18, d.boundarySouth || 'Plot No-1234(Part) & 1234/6', { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 18;

    this.drawCell(MARGIN_L, this.cursorY, wDir, 18, 'East/Left (side 1)', { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDir, this.cursorY, wBound, 18, d.boundaryEast || 'Revenue Plot No-1237/22', { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 18;

    this.drawCell(MARGIN_L, this.cursorY, wDir, 18, 'West/Right (side 2)', { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDir, this.cursorY, wBound, 18, d.boundaryWest || 'Road', { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 18;

    // 3. Do land dimensions tally
    this.drawSubHeaderBox('3. Do the land dimensions at site tally with');
    this.drawSimple2ColRow('a) Approved plan?', d.landDimensionsTallyPlan || 'Yes');
    this.drawSimple2ColRow('b) Sale deed/Sale agreement', d.landDimensionsTallyDeed || 'Sale agreement');

    // 4 & 5
    this.drawSimple2ColRow('4. Whether N.A. Permission obtained', d.naPermissionObtained || 'Yes');
    this.drawSimple2ColRow('5. Whether Environment Clearance Required, If\nyes, whether obtained (Yes/No)', d.environmentClearanceObtained || 'No');
    this.cursorY += 10;

    // C. DRAWING APPROVAL
    this.drawLeftSectionTitle('C. DRAWING APPROVAL');
    this.draw3ColTableRow(wItem, wDesc, wVal, '1.', 'Layout planning approval no./Planning\npermit no./Building permission No.', d.planningPermitNoDate || 'Plan has been approved by BMC, vide\nLetter No-BP/BMC/003510,Dated-17/06/2023)');
    this.draw3ColTableRow(wItem, wDesc, wVal, '2.', 'Validity is up to', d.validityUpto || 'Dt-16/06/2027');
    this.draw3ColTableRow(wItem, wDesc, wVal, '3.', 'If validity is expired, whether it is renewed?\nPlinth certificate/C.C./O.C. is obtained', `${d.validityExpiredRenewed || 'NA'}\nNot received till date`);
    this.draw3ColTableRow(wItem, wDesc, wVal, '4.', 'Is plan for residential purpose?', d.isPlanForResidential || 'Yes');
    this.draw3ColTableRow(wItem, wDesc, wVal, '5.', 'Approval was given by (Authority)', d.approvalAuthority || 'BMC,Bhubaneswar');
    this.cursorY += 10;

    // D. INSPECTION: 1. Construction details table
    this.drawLeftSectionTitle('D. INSPECTION');
    this.drawSubHeaderBox('1. Construction details');

    const wSl = 30;
    const wPart = 190;
    const wAppr = 130;
    const wAct = CONTENT_W - wSl - wPart - wAppr;

    // Table Header
    const hdrH = 22;
    this.drawCell(MARGIN_L, this.cursorY, wSl, hdrH, 'Sl.No.', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl, this.cursorY, wPart, hdrH, 'Particulars', { bold: true, fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl + wPart, this.cursorY, wAppr, hdrH, 'As per approved plan/as\nper rules', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wSl + wPart + wAppr, this.cursorY, wAct, hdrH, 'As at site at the time of\ninspection', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.cursorY += hdrH;

    const inspRows = [
      { sl: 'i)', p: 'No. of Blocks/Building', app: d.noOfBlocksApproved || '1', act: d.noOfBlocksActual || '1' },
      { sl: 'ii)', p: 'No. of storey/ Floors', app: d.noOfFloorsApproved || 'S+4', act: d.noOfFloorsActual || 'S+4' },
      { sl: 'iii)', p: 'Total built up area (sq.ft)', app: d.totalBuiltUpAreaApproved || '13410sqft.', act: d.totalBuiltUpAreaActual || '13410sqft.' },
      { sl: 'iv)', p: 'Total Carpet area (approx..)', app: d.totalCarpetAreaApproved || 'NA', act: d.totalCarpetAreaActual || 'NA' },
      { sl: 'v)', p: 'No. of dwelling units', app: d.noOfDwellingUnitsApproved || '8 Units', act: d.noOfDwellingUnitsActual || '8 Units' },
      { sl: 'vi)', p: 'Plot coverage', app: d.plotCoverageApproved || '60%', act: d.plotCoverageActual || '60%' },
      { sl: 'vii)', p: 'Floor space Index (FSI)', app: d.fsiApproved || '1.992', act: d.fsiActual || '1.992' },
      { sl: 'viii)', p: 'TDR', app: d.tdrApproved || 'NA', act: d.tdrActual || 'NA' },
    ];

    for (const r of inspRows) {
      this.drawCell(MARGIN_L, this.cursorY, wSl, 18, r.sl, { align: 'center', fontSize: FONT_SIZE_CAPTION });
      this.drawCell(MARGIN_L + wSl, this.cursorY, wPart, 18, r.p, { fontSize: FONT_SIZE_CAPTION });
      this.drawCell(MARGIN_L + wSl + wPart, this.cursorY, wAppr, 18, r.app, { align: 'center', fontSize: FONT_SIZE_CAPTION });
      this.drawCell(MARGIN_L + wSl + wPart + wAppr, this.cursorY, wAct, 18, r.act, { align: 'center', fontSize: FONT_SIZE_CAPTION });
      this.cursorY += 18;
    }
  }

  private drawInspectionDetails(): void {
    this.addPage();
    this.cursorY = 20;

    const d = this.reportFields;
    const wNum = 24;
    const wTitle = 180;
    const wVal = CONTENT_W - wNum - wTitle;

    const inspItems = [
      { n: '2.', t: 'Overall Quality of Construction\n(Excellent / Good / Average / Poor)', v: d.qualityOfConstruction || 'Good' },
      { n: '3.', t: 'Cost of land (Entire Project)\ni) Unit Rate\nii) Market Value\niii) Guideline Rate\niv) Guideline Value', v: `Unit Rate: ${d.costOfLandUnitRate || 'Not Provided by the Developer'}\nMarket Value: ${d.costOfLandMarketValue || 'Not Provided by the Developer'}\nGuideline Rate: ${d.costOfLandGuidelineRate || 'Not Provided by the Developer'}\nGuideline Value: ${d.costOfLandGuidelineValue || 'Not Provided by the Developer'}` },
      { n: '4.', t: 'Cost of Land+TDR(Purchase cost)', v: d.costOfLandTdrPurchaseCost || 'Rs.0' },
      { n: '5.', t: 'Construction Cost of the project', v: d.constructionCostOfProject || 'Rs.30843000.00' },
      { n: '6.', t: 'Total Cost of the Project\n(Land + Const.+ all other Charges)\ni) Unit Rate for flat\nii) Market Value of flat\niii) Guideline Rate of flat\niv) Guideline Value of flat', v: `Unit Rate for flat: ${d.unitRateForFlatMarket || 'Rs.7700/sqft.'}\nMarket Value of flat: ${d.marketValueOfFlat || 'Rs.70,00,000/-'}\nGuideline Rate: ${d.guidelineRateForFlat || 'Rs.2342/sqft.'}\nGuideline Value: ${d.guidelineValueOfFlat || 'Rs.53,86,600/-'}` },
      { n: '7.', t: 'State the Source for arriving at Market Value', v: d.sourceForArrivingAtMarketValue || 'By local market feedback & transaction of similar properties' },
      { n: '8.', t: 'Rate per sqft for construction', v: d.ratePerSqftForConstruction || 'Flat@Rs.2300.00/sqft' },
      { n: '9.', t: 'Water resources:-', v: d.waterResources || 'Yes(Bore Well)' },
      { n: '10.', t: 'Sewerage System', v: d.sewerageSystem || 'Yes' },
      { n: '11.', t: 'Electricity Connection', v: d.electricityConnection || 'Yes' },
      { n: '12.', t: 'No. of Lifts', v: d.noOfLifts || 'Yes(Provision for lift)' },
      { n: '13.', t: 'Date of Commencement of project', v: d.dateOfCommencement || '10th August 2024' },
      { n: '14.', t: 'Proposed date of Completion', v: d.proposedDateOfCompletion || '6th June 2026' },
      { n: '15.', t: 'Whether construction is as per approved plan (Yes/No):', v: d.isConstructionAsPerApprovedPlan || 'Yes' },
      { n: '16.', t: 'Deviations\ni) What are the deviations between approved drawing & actual?\nii) Whether deviations are minor/major nature?\niii) Whether revised approval is reqd.', v: `i) ${d.deviationBetweenDrawingAndActual || 'NA'}\nii) ${d.deviationMinorMajorNature || 'NA'}\niii) ${d.deviationRevisedApprovalReqd || 'No'}` },
      { n: '17.', t: 'Progress of work\ni) Entire project\nBlock wise progress and floor wise progress', v: `${d.progressEntireProject || 'S+4 RCC,Brickworks & Plastering Completed.'}\n${d.progressBlockFloorWise || ''}` },
      { n: '18.', t: 'a) Adheres to Safety Specs in National Building Code 2005 & NDMA?\nb) High Tension Wire Lines passing through property?', v: `a) ${d.nbcAndNdmaAdhered || 'Yes'}\nb) ${d.highTensionLinePassing || 'No'}` },
    ];

    for (const item of inspItems) {
      this.draw3ColTableRow(wNum, wTitle, wVal, item.n, item.t, item.v);
    }
  }

  private drawFlatValuationAndRec(): void {
    this.addPage();
    this.cursorY = 20;

    const d = this.reportFields;

    // E. FLAT UNDER CONSTRUCTION
    this.drawLeftSectionTitle('E. FLAT UNDER CONSTRUCTION');
    const wNum = 24;
    const wTitle = 180;
    const wVal = CONTENT_W - wNum - wTitle;

    const flatRows = [
      { n: '1.', t: 'Sale deed\ni) Undivided share of land as per sale deed\nii) Value of undivided share of land\niii) Applicant UDS in proportion to BUA\niv) If no, what should be correct UDS', v: `i) ${d.udsAsPerSaleDeed || 'NA'}\nii) ${d.valueOfUds || 'NA'}\niii) ${d.isUdsInProportionToBuiltUp || 'NA'}\niv) ${d.correctUdsIfNotProportion || 'NA'}` },
      { n: '2.', t: 'Construction agreement\ni) Specification of flat: Roof / Flooring\nii) Super Built-up area of the flat\niii) Carpet area of the flat\niv) Cost of flat as per agreement', v: `Roof: ${d.specRoof || 'R.C.C'}\nFlooring: ${d.specFlooring || 'Not done(Proposed)'}\nSuper BUA: ${d.superBuiltUpAreaFlat || '1651sqft'}\nCarpet: ${d.carpetAreaFlat || 'Not mentioned'}\nCost: ${d.costOfFlatAgreement || 'Rs.70,00,000/- (Including Car Parking)'}` },
      { n: '3.', t: 'Genuineness of rate\ni) Total cost of flat (1(ii) + 2(iv))\nii) Composite rate per Sft.\niii) Is rate genuine?\niv) If no, genuine rate?\nv) Marketability of Property', v: `Total: ${d.totalCostOfFlatTotal || 'Rs.70,00,000/-'}\nComposite rate: ${d.compositeRatePerSqft || 'Rs.4240/-'}\nGenuine: ${d.isRateGenuine || 'Yes'}\n${d.genuineRateIfNot ? `Genuine rate: ${d.genuineRateIfNot}\n` : ''}Marketability: ${d.marketabilityOfProperty || 'Good'}` },
    ];

    for (const r of flatRows) {
      this.draw3ColTableRow(wNum, wTitle, wVal, r.n, r.t, r.v);
    }
    this.cursorY += 10;

    // F. VALUATION
    this.drawLeftSectionTitle('F. VALUATION');
    const wS = 24;
    const wL = 220;
    const wV = CONTENT_W - wS - wL;

    this.draw3ColTableRow(wS, wL, wV, '1.', 'Stage of Works Completed', `Percentage: ${d.valStageWorksPct || '75%'}\nValue: ${d.valStageWorksValue || 'Rs.52,50,000/-'}`);
    this.draw3ColTableRow(wS, wL, wV, '2.', 'Value of undivided share of Land as per sale deed (if applicable)', d.valUdsAsPerSaleDeed || 'NA');
    this.draw3ColTableRow(wS, wL, wV, '3.', 'Total stage value of flat as on date', d.valTotalStageValueOfFlat || 'Rs.52,50,000/-');
    this.draw3ColTableRow(wS, wL, wV, '4.', 'Usage of the Building (Residential / Commercial- if commercial- ratio)', d.valUsageOfBuilding || 'Residential');
    this.cursorY += 10;

    // G. RECOMMENDATION
    this.drawLeftSectionTitle('G. RECOMMENDATION:');
    const wSno = 40;
    const wStage = 260;
    const wProg = CONTENT_W - wSno - wStage;

    this.draw3CellHeader(wSno, 'S.No.', wStage, 'Stage of Construction', wProg, '% Progress');
    this.draw3CellRow(wSno, d.recSno || '1', wStage, d.recStageOfConstruction || 'S+4 RCC,Brickworks & Plastering Completed.', wProg, d.recProgressPct || '75%');
  }

  private drawNarrativesAndCertificate(): void {
    this.addPage();
    this.cursorY = 20;

    const d = this.reportFields;

    // H. Background information
    this.drawLeftSectionTitle('H. Background information of the asset being valued:-');
    const introText = d.narrativeBackground || 'Subject property is a 3-BHK residential flat. There is a very high difference between Govt. value and market value. Govt. benchmark value not revised for that locality recently and to avoid high stamp duty/registration charges sale deed executed in under-valued Rate.';
    this.drawTextWrapped(introText, CONTENT_W);
    this.cursorY += 10;

    const bullets = [
      { t: 'Sources of information used for valuation of property:-', b: d.narrativeSources || 'Recent transactions, Property brokers, local market feedback & web-sites.' },
      { t: 'Procedures adopted in carrying out the valuation:-', b: d.narrativeProcedures || 'Sales comparison method adopted by comparing the per Sqft CA rate of similar flats in that locality.' },
      { t: 'Valuation methodology:-', b: d.narrativeMethodology || 'Composite method adopted.' },
      { t: 'Major factors that influenced the valuation:-', b: d.narrativeFactors || 'Location & Accessibility to civic amenities' },
    ];

    for (const b of bullets) {
      this.drawBulletPoint(b.t, b.b);
      this.cursorY += 6;
    }
    this.cursorY += 14;

    // 9. CERTIFICATE
    this.drawLeftSectionTitle('9.      CERTIFICATE');
    const certText = `I declare that I am not associated with the builder or with any of his associate companies or with the borrower directly or indirectly in the past or in the present and this report has been prepared by me with highest professional integrity.\n\nI further declare that I have personally inspected the site and building on ${d.certificateDate || '30/07/2025'}.\n\nI further declare that all the above particulars and information given in this report are true to the best of my knowledge and belief.`;
    this.drawTextWrapped(certText, CONTENT_W);
    this.cursorY += 40;

    // Signature Block
    this.drawTextAt(`Station: ${d.certificatePlace || 'Bhubaneswar.'}`, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    const sigValuer = 'SIGNATURE OF THE VALUER';
    const firmName = '(M/s. S MOHANTY ASSOCIATES)';
    const sW = this.fontBold.widthOfTextAtSize(sigValuer, FONT_SIZE_CAPTION);
    const fW = this.fontBold.widthOfTextAtSize(firmName, FONT_SIZE_CAPTION);
    const rightX = MARGIN_L + CONTENT_W - Math.max(sW, fW);

    this.drawTextAt(sigValuer, rightX, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 14;
    this.drawTextAt(`Date: ${d.certificateDate || '30/07/2025'}`, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.drawTextAt(firmName, rightX, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
  }

  private async drawEnclosures(): Promise<void> {
    const d = this.reportFields;

    if (d.propertyImages && d.propertyImages.length > 0) {
      this.addPage();
      this.cursorY = 20;
      this.drawCenteredReportTitle('PROPERTY PHOTOGRAPHS', FONT_SIZE_HEADER, true);
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
      { title: 'LAYOUT / LOCATION MAP', imgs: d.locationMapImages || (d.locationMapImage ? [d.locationMapImage] : []) },
      { title: 'MOUZA MAP', imgs: d.mouzaMapImages },
      { title: 'SKETCH MAP', imgs: d.sketchMapImages },
      { title: 'CADASTRAL / BHU NAKSHA MAP', imgs: d.cadastralMapImages },
      { title: 'APPROVED BUILDING PLAN', imgs: d.bdaMapImages },
    ];

    for (const m of mapList) {
      if (m.imgs && m.imgs.length > 0) {
        this.addPage();
        this.cursorY = 20;
        this.drawCenteredReportTitle(m.title, FONT_SIZE_HEADER, true);
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
        const label = (d.documentImageNames && d.documentImageNames[i]) || `DOCUMENT ATTACHMENT ${i + 1}`;
        if (url) {
          this.addPage();
          this.cursorY = 20;
          this.drawCenteredReportTitle(label, FONT_SIZE_HEADER, true);
          this.cursorY += 16;
          await this.drawImageSafely(url, MARGIN_L, this.cursorY, CONTENT_W, 600);
          this.cursorY += 610;
        }
      }
    }
  }

  // Helper primitives
  private drawBorderedBoxTitle(title: string): void {
    const font = this.fontBold;
    const tw = font.widthOfTextAtSize(title, FONT_SIZE);
    const boxW = tw + 24;
    const boxH = 20;
    const x = MARGIN_L + (CONTENT_W - boxW) / 2;
    this.drawCell(x, this.cursorY, boxW, boxH, title, { bold: true, align: 'center', fontSize: FONT_SIZE });
    this.cursorY += boxH;
  }

  private drawLeftSectionTitle(title: string): void {
    this.drawTextAt(title, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 12;
  }

  private drawSubHeaderBox(title: string): void {
    const lines = this.wrapText(title, CONTENT_W - 8, FONT_SIZE_CAPTION);
    const rowH = Math.max(18, lines.length * 12 + 6);
    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, rowH, title, { bold: true, fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.cursorY += rowH;
  }

  private draw3ColTableRow(wNum: number, wTitle: number, wVal: number, n: string, t: string, v: string): void {
    const tLines = this.wrapText(t, wTitle - 8, FONT_SIZE_CAPTION);
    const vLines = this.wrapText(v, wVal - 8, FONT_SIZE_CAPTION);
    const maxLines = Math.max(tLines.length, vLines.length, 1);
    const rowH = Math.max(18, maxLines * 12 + 6);

    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, wNum, rowH, n, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wNum, this.cursorY, wTitle, rowH, t, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wNum + wTitle, this.cursorY, wVal, rowH, v, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private drawSimple2ColRow(label: string, val: string): void {
    const wLabel = 220;
    const wVal = CONTENT_W - wLabel;
    const lLines = this.wrapText(label, wLabel - 8, FONT_SIZE_CAPTION);
    const vLines = this.wrapText(val, wVal - 8, FONT_SIZE_CAPTION);
    const maxLines = Math.max(lLines.length, vLines.length, 1);
    const rowH = Math.max(18, maxLines * 12 + 6);

    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, wLabel, rowH, label, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLabel, this.cursorY, wVal, rowH, val, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private draw3CellHeader(w1: number, t1: string, w2: number, t2: string, w3: number, t3: string): void {
    const rowH = 18;
    this.drawCell(MARGIN_L, this.cursorY, w1, rowH, t1, { bold: true, fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + w1, this.cursorY, w2, rowH, t2, { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + w1 + w2, this.cursorY, w3, rowH, t3, { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.cursorY += rowH;
  }

  private draw3CellRow(w1: number, t1: string, w2: number, t2: string, w3: number, t3: string): void {
    const lLines = this.wrapText(t2, w2 - 8, FONT_SIZE_CAPTION);
    const rowH = Math.max(18, lLines.length * 12 + 6);
    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, w1, rowH, t1, { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + w1, this.cursorY, w2, rowH, t2, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + w1 + w2, this.cursorY, w3, rowH, t3, { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;
  }

  private drawTextWrapped(text: string, width: number): void {
    const lines = this.wrapText(text, width, FONT_SIZE_CAPTION);
    for (const l of lines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
      this.cursorY += 12;
    }
  }

  private drawBulletPoint(title: string, body: string): void {
    const full = `•  ${title} ${body}`;
    const lines = this.wrapText(full, CONTENT_W, FONT_SIZE_CAPTION);
    for (const l of lines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
      this.cursorY += 12;
    }
  }

  private drawCenteredReportTitle(text: string, size = FONT_SIZE, isBold = true, isUnderline = false): void {
    const font = isBold ? this.fontBold : this.fontRegular;
    const tw = font.widthOfTextAtSize(text, size);
    const x = MARGIN_L + (CONTENT_W - tw) / 2;
    this.drawTextAt(text, x, this.cursorY, { bold: isBold, fontSize: size });
    if (isUnderline) {
      const y = this.pdfY(this.cursorY) - 2;
      this.page.drawLine({
        start: { x, y },
        end: { x: x + tw, y },
        thickness: 0.8,
        color: rgb(0, 0, 0),
      });
    }
    this.cursorY += size + 4;
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
