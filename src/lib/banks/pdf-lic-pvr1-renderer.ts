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

export interface LICPVR1ReportFields {
  // Top Header Metadata
  fileNo?: string;
  nameOfValuer?: string;
  codeNo?: string;
  appointingAuthority?: string;
  dateOfValuation?: string;
  reraNo?: string;

  // A. GENERAL
  applicantName?: string;
  ownerName?: string;
  documentsProduced?: string;
  locationPlotNo?: string;
  locationVillage?: string;
  locationDistrict?: string;
  addressTallies?: string;
  locationSketchVerified?: string;
  surroundingDevelopmentClass?: string;
  basicAmenitiesAvailable?: string;
  negativesToLocality?: string;
  favourableConsiderations?: string;
  nearbyLandmark?: string;
  otherFeaturesNotice?: string;

  // B. LAND
  boundaryNorth?: string;
  boundaryNorthDim?: string;
  boundarySouth?: string;
  boundarySouthDim?: string;
  boundaryEast?: string;
  boundaryEastDim?: string;
  boundaryWest?: string;
  boundaryWestDim?: string;
  totalExtentLandDecimal?: string;
  totalExtentLandSqft?: string;
  boundariesTallyWithApprovedDrawing?: string;
  natureOfLandUse?: string;
  landUseExistingBua?: string;
  landUseProposedBua?: string;
  naPermissionRequiredAndObtained?: string;

  // C. BUILDINGS
  buildingPlanApprovalNoDate?: string;
  buildingPlanValidity?: string;
  buildingPlanRenewal?: string;
  buildingPlanApprovalAuthority?: string;

  // Plinth / BUA Approved
  plinthApprovedGf?: string;
  plinthApprovedFf?: string;
  plinthApprovedSf?: string;
  plinthApprovedTotal?: string;

  // Plinth / BUA Actual
  plinthActualGf?: string;
  plinthActualFf?: string;
  plinthActualSf?: string;
  plinthActualTotal?: string;

  estimateCostApplicant?: string;
  estimateCostPerSqft?: string;
  isEstimateReasonable?: string;
  marketabilityOfProperty?: string;

  // D. INSPECTION
  inspectionBuaApproved?: string;
  inspectionBuaActual?: string;
  inspectionFsiApproved?: string;
  inspectionFsiActual?: string;
  inspectionDwellingUnitsApproved?: string;
  inspectionDwellingUnitsActual?: string;
  isConstructionAsPerApprovedPlan?: string;
  deviationBetweenDrawingAndActual?: string;
  deviationMinorMajorNature?: string;
  deviationRevisedApprovalNecessary?: string;
  totalWorksCompletedPct?: string;
  totalWorksCompletedValue?: string;
  nbcAndNdmaComplied?: string;
  highTensionLinePassing?: string;

  // E. TOTAL VALUE
  valLandApplication?: string;
  valLandGuideline?: string;
  valLandMarket?: string;
  valBldgStageApplication?: string;
  valBldgStageGuideline?: string;
  valBldgStageMarket?: string;
  valTotalExistingApplication?: string;
  valTotalExistingGuideline?: string;
  valTotalExistingMarket?: string;
  valBldgCompletionApplication?: string;
  valBldgCompletionGuideline?: string;
  valBldgCompletionMarket?: string;
  sourceForArrivingAtMarketValue?: string;
  usageOfBuilding?: string;

  // Narratives
  backgroundInformation?: string;
  sourcesOfInformation?: string;
  proceduresAdopted?: string;
  valuationMethodology?: string;
  majorFactorsInfluenced?: string;

  // F. RECOMMENDATION
  recommendationStageNo?: string;
  recommendationStageOfConstruction?: string;
  recommendationProgressPct?: string;

  // G. CERTIFICATE
  certificateDate?: string;
  certificatePlace?: string;
  valuerSignatureName?: string;

  // ANNEXURE
  annexureLandArea?: string;
  annexureLandMarketRate?: string;
  annexureLandMarketValue?: string;
  annexureLandGuidelineRate?: string;
  annexureLandGuidelineValue?: string;

  annexureBldgArea?: string;
  annexureBldgMarketRate?: string;
  annexureBldgMarketValue?: string;
  annexureBldgGuidelineRate?: string;
  annexureBldgGuidelineValue?: string;

  annexureAmenitiesMarketValue?: string;
  annexureAmenitiesGuidelineValue?: string;

  annexureTotalMarketValue?: string;
  annexureTotalGuidelineValue?: string;

  annexureYearOfConstruction?: string;
  annexureAgeAndFutureLife?: string;

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

export class PDFLICPVR1Renderer extends PDFBankRenderer {
  private reportFields: LICPVR1ReportFields;
  private projectCode?: string;

  constructor(fields?: any, projectCode?: string) {
    super();
    this.reportFields = fields || {};
    this.projectCode = projectCode;
  }

  async render(): Promise<Uint8Array> {
    await this.init();

    // ── Page 1: Top Header + Section A. GENERAL ──
    this.drawCoverAndGeneral();

    // ── Page 2: Section B. LAND + Section C. BUILDINGS ──
    this.drawLandAndBuildings();

    // ── Page 3: Section D. INSPECTION ──
    this.drawInspection();

    // ── Page 4: Section E. TOTAL VALUE + Narratives + F. Rec + G. Certificate ──
    this.drawTotalValueAndCertificate();

    // ── Page 5: PVR-1 ANNEXURE (Valuation of Construction Building) ──
    this.drawAnnexure();

    // ── Enclosures: Maps, Documents, Photographs ──
    await this.drawEnclosures();

    return await this.save();
  }

  private drawCoverAndGeneral(): void {
    const d = this.reportFields;
    this.cursorY = 20;

    // Header Banner
    this.drawCenteredReportTitle('PVR-1', FONT_SIZE_TITLE, true);
    this.cursorY += 2;
    this.drawCenteredReportTitle('LIC HOUSING FINANCE LIMITED', FONT_SIZE_HEADER, true);
    this.cursorY += 2;
    this.drawCenteredReportTitle('Area Office: Bhubaneswar.', FONT_SIZE_CAPTION, false);
    this.cursorY += 2;
    this.drawCenteredReportTitle('HOUSE CONSTRUCTION', FONT_SIZE, true, true);
    this.cursorY += 10;

    // Boxed Title: VALUATION REPORT BY PANEL VALUER FOR HOME LOAN
    this.drawBorderedBoxTitle('VALUATION REPORT BY PANEL VALUER FOR HOME LOAN');
    this.cursorY += 12;

    // Header Metadata block
    const metaH = 14;
    const metaRows = [
      { label: '* File No.', val: `: ${d.fileNo || '2201003673'}` },
      { label: '* Name of the Valuer', val: `: ${d.nameOfValuer || 'Er. Satyajit Mohanty'}` },
      { label: '* Code No.', val: `: ${d.codeNo || 'BH-AOV0078'}` },
      { label: '*Appointing Authority:', val: `: ${d.appointingAuthority || 'LIC HFL(Br-II)'}` },
      { label: '*Date of Valuation', val: `: ${d.dateOfValuation || '06/11/2020'}` },
      { label: '*RERA No.(For Flats)', val: `: ${d.reraNo || 'NA'}` },
    ];

    for (const r of metaRows) {
      this.drawTextAt(r.label, MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
      this.drawTextAt(r.val, MARGIN_L + 120, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
      this.cursorY += metaH;
    }
    this.cursorY += 10;

    // A. GENERAL Title
    this.drawLeftSectionTitle('A.GENERAL');

    // Section A Table (1 to 13)
    const wNum = 24;
    const wTitle = 160;
    const wVal = CONTENT_W - wNum - wTitle;

    const rowsA = [
      { n: '1.', t: '* File No.', v: d.fileNo || '2201003673' },
      { n: '2.', t: '* Name of the Applicant', v: d.applicantName || 'Mrs. Bijaylaxmi Sahoo,D/o:-Mr. Gangadhar Sahoo' },
      { n: '3.', t: 'Name of the owner', v: d.ownerName || 'Mrs. Bijaylaxmi Sahoo,D/o:-Mr. Gangadhar Sahoo' },
      { n: '4.', t: 'Documents produced for perusal', v: d.documentsProduced || 'Copy of Sale Deed,ROR,Approved Plan & Estimate' },
      { n: '5.', t: '* Location of the property\nPlot No./ S. No./C.T.S.No. /R.S.No.\nVillage/Block No./Taluk/Ward.\nDistrict/Corporation/Municipality', v: `Plot no-${d.locationPlotNo || '632,Khata no-529/993'}\nMouza- ${d.locationVillage || 'Mattia Pada-II,PS-Pipili(45),Tahasil-Pipili(199)'}\n${d.locationDistrict || 'Dist-Puri,Odisha, Pin-752104'}` },
      { n: '6.', t: 'Whether address of the site tallies with\naddress at point number "5"', v: d.addressTallies || 'Yes' },
      { n: '7.', t: 'Location Sketch Verified', v: d.locationSketchVerified || 'Yes/No' },
      { n: '8.', t: 'Development of surrounding area with\nSpecial reference to population', v: d.surroundingDevelopmentClass || 'Lower class/ Middle/ Upper Middle/Posh' },
      { n: '9..', t: 'Whether basic amenities like water,\nelectricity, sewerage, roads, telephone\nare available', v: d.basicAmenitiesAvailable || 'Yes' },
      { n: '10.', t: 'Any negatives to the locality/property\n(Crematoriums, slums, riot prone ,\ngases, chemical hazards, nagbanaetc)', v: d.negativesToLocality || 'No' },
      { n: '11.', t: 'Any favourable consideration for\nadditional cost/value', v: d.favourableConsiderations || 'All civic amenities like school,hospital,market\narea arewithin 1-2Kms.' },
      { n: '12.', t: 'Details of the Nearby Landmark', v: d.nearbyLandmark || 'Opposite to Sai Temple,Gudiapokhari' },
      { n: '13.', t: 'Any other features like board of other\nfinancier indicating mortgage, notice of\nCourt/any authority which may effect\nthe security.', v: d.otherFeaturesNotice || 'Not Observed' },
    ];

    for (const r of rowsA) {
      this.draw3ColTableRow(wNum, wTitle, wVal, r.n, r.t, r.v);
    }
  }

  private drawLandAndBuildings(): void {
    this.addPage();
    this.cursorY = 20;

    // B. LAND Title
    this.drawLeftSectionTitle('B.LAND');

    // 1. Boundaries & dimensions of the plot
    this.drawSubHeaderBox('1. Boundaries & dimensions of the plot');

    const wDir = 80;
    const wBound = 260;
    const wDim = CONTENT_W - wDir - wBound;
    const d = this.reportFields;

    this.draw3CellHeader(wDir, 'Directions', wBound, 'Boundaries', wDim, 'Dimensions');
    this.draw3CellRow(wDir, 'North/Front', wBound, d.boundaryNorth || 'Proposed Road/20-Feet Wide Road', wDim, d.boundaryNorthDim || 'NA');
    this.draw3CellRow(wDir, 'South/Rear', wBound, d.boundarySouth || 'Revenue Plot No-628/Vacant Plot', wDim, d.boundarySouthDim || 'NA');
    this.draw3CellRow(wDir, 'East/Left (side 1)', wBound, d.boundaryEast || 'Rest Part of Revenue Plot No-632/Vacant Plot', wDim, d.boundaryEastDim || 'NA');
    this.draw3CellRow(wDir, 'West/Right (Side 2)', wBound, d.boundaryWest || 'Proposed Road/20-Feet Wide Road', wDim, d.boundaryWestDim || 'NA');

    // Extent of land row
    const rowH = 18;
    this.drawCell(MARGIN_L, this.cursorY, wDir, rowH, 'Total extent of land', { bold: true, fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDir, this.cursorY, wBound, rowH, d.totalExtentLandDecimal || 'Ac.0.021 decimal', { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDir + wBound, this.cursorY, wDim, rowH, d.totalExtentLandSqft || '915sqft', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // 2. Do these boundaries & dimensions
    this.drawSimple2ColRow('2. Do these boundaries & dimensions\nTally with the approved drawing? If not furnish details -Yes', d.boundariesTallyWithApprovedDrawing || 'Yes');

    // 3. Nature of land use
    this.drawSubHeaderBox('3. Nature of land use\nResidential/Commercial/Industrial/Agricultural -Residential');
    this.drawSimple2ColRow('a. Existing', d.landUseExistingBua || 'G.F.-850sqft(Under Construction)');
    this.drawSimple2ColRow('b. Proposed', d.landUseProposedBua || 'G.F.-850sqft,F.F.-850sqft(Approved)');

    // 4. Whether N.A. Permission Required
    this.drawSimple2ColRow('4. Whether N.A. Permission Required\n(If required, whether obtained):Yes(Obtained)', d.naPermissionRequiredAndObtained || 'Yes(Obtained)');
    this.cursorY += 10;

    // C. BUILDINGS Title
    this.drawLeftSectionTitle('C.BUILDINGS');

    // 1. Building Plan Approval
    this.drawSubHeaderBox('1. Building Plan Approval');
    const wRom = 24;
    const wBldgLbl = 220;
    const wBldgVal = CONTENT_W - wRom - wBldgLbl;

    this.draw3ColTableRow(wRom, wBldgLbl, wBldgVal, 'i)', 'Layout planning approval No./ Planning permit No./\nBuilding permission No.', d.buildingPlanApprovalNoDate || 'Yes, letter no-645/20,dated-28/09/2020');
    this.draw3ColTableRow(wRom, wBldgLbl, wBldgVal, 'ii)', 'Period of validity', d.buildingPlanValidity || 'NA');
    this.draw3ColTableRow(wRom, wBldgLbl, wBldgVal, 'iii)', 'If validity is expired, whether it is renewed', d.buildingPlanRenewal || 'NA');
    this.draw3ColTableRow(wRom, wBldgLbl, wBldgVal, 'iv)', 'Approval was given by (authority)', d.buildingPlanApprovalAuthority || 'Sarapanch, Orakal Grama Panchayat');

    // 2. Plinth/Built Up Area
    this.drawSubHeaderBox('2. Plinth/Built Up Area:');
    this.drawSimple2ColRow('i) As per approved drawing\nG.F.:\nF.F.:\nS.F.:\nTotal:', `${d.plinthApprovedGf || '850sqft'}\n${d.plinthApprovedFf || '850sqft'}\n${d.plinthApprovedSf || 'NA'}\n${d.plinthApprovedTotal || '1700sqft'}`);
    this.drawSimple2ColRow('ii) Actual\nG.F.:\nF.F.:\nS.F.:\nTotal:', `${d.plinthActualGf || '850sqft(Under Construction)'}\n${d.plinthActualFf || 'NA'}\n${d.plinthActualSf || 'NA'}\n${d.plinthActualTotal || '850sqft'}`);

    // 3. Estimate
    this.drawSubHeaderBox('3. Estimate');
    this.draw3ColTableRow(wRom, wBldgLbl, wBldgVal, 'i)', "Cost as per Estimate provided by the Applicant (Rs.)", d.estimateCostApplicant || 'Rs.20,00,000/- (For GF only)');
    this.draw3ColTableRow(wRom, wBldgLbl, wBldgVal, 'ii)', "Cost per Sqft as per Applicant's estimate (Rs. per sqft.)", d.estimateCostPerSqft || 'Rs.2352.94/sqft');
    this.draw3ColTableRow(wRom, wBldgLbl, wBldgVal, 'iii)', 'Is estimate reasonable, if not give remarks', d.isEstimateReasonable || 'Yes');

    // 4. Marketability
    this.drawSimple2ColRow('4. Marketability of the Property\nExcellent/Good/Average/Poor', d.marketabilityOfProperty || 'Good');
  }

  private drawInspection(): void {
    this.addPage();
    this.cursorY = 20;

    const d = this.reportFields;

    // D. INSPECTION Title
    this.drawLeftSectionTitle('D.INSPECTION');

    // 1. Construction Details comparative table
    this.drawSubHeaderBox('1. Construction Details');
    const wDesc = 180;
    const wAppr = 140;
    const wAct = CONTENT_W - wDesc - wAppr;

    this.draw3CellHeader(wDesc, 'Description', wAppr, 'As per approved plan', wAct, 'As per actual');
    this.draw3CellRow(wDesc, 'i) Plinth/ Built Up Area', wAppr, d.inspectionBuaApproved || '850sqft / Floor', wAct, d.inspectionBuaActual || '850sqft / Floor');
    this.draw3CellRow(wDesc, 'ii) F.S.I.', wAppr, d.inspectionFsiApproved || '1.85', wAct, d.inspectionFsiActual || '0.92');
    this.draw3CellRow(wDesc, 'iii) No. Of dwelling units', wAppr, d.inspectionDwellingUnitsApproved || '1/ Floor', wAct, d.inspectionDwellingUnitsActual || '1/Floor');

    // 2. Construction as per plan
    this.drawSimple2ColRow('2. Whether the construction is as per approved plan? (Yes/No) :Yes', d.isConstructionAsPerApprovedPlan || 'Yes');

    // 3. Deviations
    this.drawSubHeaderBox('3. Whether there are any Deviations? (Please mention in detail)');
    const wRom = 24;
    const wDevLbl = 200;
    const wDevVal = CONTENT_W - wRom - wDevLbl;
    this.draw3ColTableRow(wRom, wDevLbl, wDevVal, 'i)', 'What are the deviations between approved\ndrawing & actual?', d.deviationBetweenDrawingAndActual || 'NA');
    this.draw3ColTableRow(wRom, wDevLbl, wDevVal, 'ii)', 'Whether deviation are minor/ major nature', d.deviationMinorMajorNature || 'NA');
    this.draw3ColTableRow(wRom, wDevLbl, wDevVal, 'iii)', 'Whether revised approval is necessary', d.deviationRevisedApprovalNecessary || 'NA');

    // 4. Total works completed
    const wLbl4 = 180;
    const wPct4 = 140;
    const wVal4 = CONTENT_W - wLbl4 - wPct4;
    const h4 = 24;
    this.drawCell(MARGIN_L, this.cursorY, wLbl4, h4, "4. Total works completed as per applicant's estimate", { fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wLbl4, this.cursorY, wPct4, h4, `Percentage: ${d.totalWorksCompletedPct || '90%'}`, { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wLbl4 + wPct4, this.cursorY, wVal4, h4, `Value:${d.totalWorksCompletedValue || 'Rs.18,00,000/-(For GF only)'}`, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += h4;

    // 5. NBC and NDMA
    this.drawSimple2ColRow('5. a)Whether the Construction carried out / being carried out adheres to the Safety Specifications prescribed in the National Building Code of India 2005?\nAnd\nb)Guidelines issued by the National Disaster Management Authority (NDMA)?', d.nbcAndNdmaComplied || 'Yes');

    // 6. High Tension line
    this.drawSimple2ColRow('6. Whether any High Tension Wire Lines are passing through the property and if there is any adverse impact due to this?', d.highTensionLinePassing || 'No');
  }

  private drawTotalValueAndCertificate(): void {
    this.addPage();
    this.cursorY = 20;

    const d = this.reportFields;

    // E. TOTAL VALUE Title
    this.drawLeftSectionTitle('E.TOTAL VALUE');

    // Grid: As per Application | Guideline Value | Market Value
    const wItem = 24;
    const wDesc = 200;
    const wApp = 75;
    const wGuide = 85;
    const wMkt = CONTENT_W - wItem - wDesc - wApp - wGuide;

    // Table Header
    const hdrH = 20;
    this.drawCell(MARGIN_L, this.cursorY, wItem + wDesc, hdrH, '', { fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wItem + wDesc, this.cursorY, wApp, hdrH, 'As per Application', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wItem + wDesc + wApp, this.cursorY, wGuide, hdrH, 'Guideline Value', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wItem + wDesc + wApp + wGuide, this.cursorY, wMkt, hdrH, 'Market Value', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.cursorY += hdrH;

    const valRows = [
      { n: '1.', t: `Value of land :${d.totalExtentLandDecimal || 'Ac.0.021 decimal'}`, app: d.valLandApplication || 'NA', guide: d.valLandGuideline || 'Rs.3,15,080/-', mkt: d.valLandMarket || 'Rs.5,49,000/-' },
      { n: '2.', t: `Stage value of the building as per applicant's estimate(Present stage of construction is ${d.totalWorksCompletedPct || '90%'})`, app: d.valBldgStageApplication || 'Rs.18,00,000/-', guide: d.valBldgStageGuideline || 'Rs.10,05,210/-', mkt: d.valBldgStageMarket || 'Rs.15,30,000/-' },
      { n: '3.', t: 'Total value of existing building (1 + 2)', app: d.valTotalExistingApplication || '', guide: d.valTotalExistingGuideline || 'Rs.13,20,290/-', mkt: d.valTotalExistingMarket || 'Rs.20,79,000/-' },
      { n: '4.', t: 'Value of building on completion', app: d.valBldgCompletionApplication || '', guide: d.valBldgCompletionGuideline || 'Rs.14,31,980/-', mkt: d.valBldgCompletionMarket || 'Rs.22,49,000/-' },
    ];

    for (const r of valRows) {
      const lLines = this.wrapText(r.t, wDesc - 8, FONT_SIZE_CAPTION);
      const rowH = Math.max(18, lLines.length * 12 + 6);
      this.drawCell(MARGIN_L, this.cursorY, wItem, rowH, r.n, { align: 'center', fontSize: FONT_SIZE_CAPTION });
      this.drawCell(MARGIN_L + wItem, this.cursorY, wDesc, rowH, r.t, { fontSize: FONT_SIZE_CAPTION });
      this.drawCell(MARGIN_L + wItem + wDesc, this.cursorY, wApp, rowH, r.app, { align: 'center', fontSize: FONT_SIZE_CAPTION });
      this.drawCell(MARGIN_L + wItem + wDesc + wApp, this.cursorY, wGuide, rowH, r.guide, { align: 'center', fontSize: FONT_SIZE_CAPTION });
      this.drawCell(MARGIN_L + wItem + wDesc + wApp + wGuide, this.cursorY, wMkt, rowH, r.mkt, { align: 'center', fontSize: FONT_SIZE_CAPTION });
      this.cursorY += rowH;
    }

    // 5. Source for arriving at Market Value
    this.drawSimple2ColRow('5. State the source for arriving at Market Value', d.sourceForArrivingAtMarketValue || 'By analysis of rates of material, labour etc &\nfrom local market data of similar properties');

    // 6. Usage of building
    this.drawSimple2ColRow('6. Usage of building- Residential/ Commercial. If commercial, ratio of B/U area (commercial to residential )', d.usageOfBuilding || 'Residential');
    this.cursorY += 14;

    // Narrative Bullet Points
    const bullets = [
      { t: 'Background information of the asset being valued:-', b: d.backgroundInformation || 'Subject property is a proposed single storied residential building, located in a developed Mattia Pada-II mouza. Property is accessible with 20-ft earthen road.' },
      { t: 'Sources of information used for valuation of property:-', b: d.sourcesOfInformation || 'Recent transactions, Property Brokers, local market feedback.' },
      { t: 'Procedures adopted in carrying out the valuation:-', b: d.proceduresAdopted || 'Land value arrived by comparing similar land parcels in that locality while building value arrived by cost incurred to construct a similar house as on date.' },
      { t: 'Valuation methodology:-', b: d.valuationMethodology || 'Land & Building method of valuation adopted' },
      { t: 'Major factors that influenced the valuation:-', b: d.majorFactorsInfluenced || 'Location & accessibility to civic amenities etc.' },
    ];

    for (const b of bullets) {
      this.drawBulletPoint(b.t, b.b);
      this.cursorY += 6;
    }
    this.cursorY += 10;

    // F. RECOMMENDATION Title
    this.drawLeftSectionTitle('F.RECOMMENDATION:');
    const wSno = 40;
    const wStage = 260;
    const wProg = CONTENT_W - wSno - wStage;

    this.draw3CellHeader(wSno, 'S.No.', wStage, 'Stage of Construction', wProg, '% Progress');
    this.draw3CellRow(wSno, d.recommendationStageNo || '01', wStage, d.recommendationStageOfConstruction || 'GF inside & outside plastering work completed.Flooring work is under progress.', wProg, d.recommendationProgressPct || 'Present stage of construction is 90%');
    this.cursorY += 14;

    // G. CERTIFICATE Title
    this.drawLeftSectionTitle('G.CERTIFICATE');
    const certText = `I declare that I am not associated with the builder or with any of his associate companies or with the borrower directly or indirectly in the past or in the present and this report has been prepared by me with highest professional integrity.\n\nI further declare that I have personally inspected the site and building on ${d.certificateDate || '04/11/2020'}\n\nI further declare that all the above particulars and information given in this report are true to the best of my knowledge and belief.`;
    const cLines = this.wrapText(certText, CONTENT_W, FONT_SIZE_CAPTION);
    for (const l of cLines) {
      this.drawTextAt(l, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
      this.cursorY += 12;
    }
  }

  private drawAnnexure(): void {
    this.addPage();
    this.cursorY = 20;

    const d = this.reportFields;

    this.drawCenteredReportTitle('PVR-1', FONT_SIZE_TITLE, true);
    this.cursorY += 2;
    this.drawCenteredReportTitle('ANNEXURE', FONT_SIZE_HEADER, true);
    this.cursorY += 2;
    this.drawCenteredReportTitle('Valuation of Construction Building', FONT_SIZE, true);
    this.cursorY += 16;

    this.drawTextAt('1.Valuation of Building', MARGIN_L, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 8;

    // Table: Description | Area | Unit Rate | Estimated market value | Unit Rate | Guide line Value
    const wDesc = 90;
    const wArea = 55;
    const wRateMkt = 65;
    const wValMkt = 90;
    const wRateG = 75;
    const wValG = CONTENT_W - wDesc - wArea - wRateMkt - wValMkt - wRateG;

    const hdrH = 26;
    this.drawCell(MARGIN_L, this.cursorY, wDesc, hdrH, 'Description', { bold: true, fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDesc, this.cursorY, wArea, hdrH, 'Area', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDesc + wArea, this.cursorY, wRateMkt, hdrH, 'Unit Rate', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt, this.cursorY, wValMkt, hdrH, 'Estimated market\nvalue', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt, this.cursorY, wRateG, hdrH, 'Unit Rate', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt + wRateG, this.cursorY, wValG, hdrH, 'Guide line Value', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.cursorY += hdrH;

    const rowH = 20;

    // Land row
    this.drawCell(MARGIN_L, this.cursorY, wDesc, rowH, 'Land', { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc, this.cursorY, wArea, rowH, d.annexureLandArea || '915sqft', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea, this.cursorY, wRateMkt, rowH, d.annexureLandMarketRate || 'Rs.600/-', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt, this.cursorY, wValMkt, rowH, d.annexureLandMarketValue || 'Rs.5,49,000/-', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt, this.cursorY, wRateG, rowH, d.annexureLandGuidelineRate || 'Rs.344.35/-', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt + wRateG, this.cursorY, wValG, rowH, d.annexureLandGuidelineValue || 'Rs.3,15,080/-', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // Building GF row
    this.drawCell(MARGIN_L, this.cursorY, wDesc, rowH, 'Building\nGF', { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc, this.cursorY, wArea, rowH, d.annexureBldgArea || '850sqft', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea, this.cursorY, wRateMkt, rowH, d.annexureBldgMarketRate || 'Rs.2000/-', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt, this.cursorY, wValMkt, rowH, d.annexureBldgMarketValue || 'Rs.17,00,000/-', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt, this.cursorY, wRateG, rowH, d.annexureBldgGuidelineRate || 'Rs.1314.00', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt + wRateG, this.cursorY, wValG, rowH, d.annexureBldgGuidelineValue || 'Rs.11,16,900/-', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // Amenities row
    this.drawCell(MARGIN_L, this.cursorY, wDesc, rowH, 'Amenities if any', { fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc, this.cursorY, wArea, rowH, '', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea, this.cursorY, wRateMkt, rowH, '', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt, this.cursorY, wValMkt, rowH, d.annexureAmenitiesMarketValue || 'Included', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt, this.cursorY, wRateG, rowH, '', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt + wRateG, this.cursorY, wValG, rowH, d.annexureAmenitiesGuidelineValue || '---', { align: 'center', fontSize: FONT_SIZE_CAPTION });
    this.cursorY += rowH;

    // Total Value row
    this.drawCell(MARGIN_L, this.cursorY, wDesc + wArea + wRateMkt, rowH, 'Total Value', { bold: true, fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt, this.cursorY, wValMkt, rowH, d.annexureTotalMarketValue || 'Rs.22,49,000/-', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt, this.cursorY, wRateG, rowH, '', { fillColor: LBL_BG });
    this.drawCell(MARGIN_L + wDesc + wArea + wRateMkt + wValMkt + wRateG, this.cursorY, wValG, rowH, d.annexureTotalGuidelineValue || 'Rs.14,31,980/-', { bold: true, align: 'center', fontSize: FONT_SIZE_CAPTION, fillColor: LBL_BG });
    this.cursorY += rowH + 16;

    // Age / Life Points
    this.drawTextAt('1.      Year of Construction', MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.drawTextAt(`: ${d.annexureYearOfConstruction || 'Under Construction'}`, MARGIN_L + 180, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 14;

    this.drawTextAt('2.      Age of the Building and future life', MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.drawTextAt(`: ${d.annexureAgeAndFutureLife || '60-Years'}`, MARGIN_L + 180, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 60;

    // Sign off
    this.drawTextAt(`Station: ${d.certificatePlace || 'Bhubaneswar.'}`, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    const sigValuer = 'SIGNATURE OF THE VALUER';
    const firmName = '(M/s. S MOHANTY ASSOCIATES)';
    const sW = this.fontBold.widthOfTextAtSize(sigValuer, FONT_SIZE_CAPTION);
    const fW = this.fontBold.widthOfTextAtSize(firmName, FONT_SIZE_CAPTION);
    const rightX = MARGIN_L + CONTENT_W - Math.max(sW, fW);

    this.drawTextAt(sigValuer, rightX, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
    this.cursorY += 14;
    this.drawTextAt(`Date: ${d.certificateDate || '06/11/2020'}`, MARGIN_L, this.cursorY, { fontSize: FONT_SIZE_CAPTION });
    this.drawTextAt(firmName, rightX, this.cursorY, { bold: true, fontSize: FONT_SIZE_CAPTION });
  }

  private async drawEnclosures(): Promise<void> {
    const d = this.reportFields;

    // Property Photographs
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

    // Maps
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

    // Documents
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
