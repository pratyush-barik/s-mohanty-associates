/**
 * pdf-bandhan-sme-renderer.ts — Dedicated PDF Renderer for Bandhan Bank SME
 *
 * Implements:
 * - Full Times New Roman (Serif) typography with statutory table borders
 * - Section I: Basic Information (A to M with 6-row Borrower & Owner sub-tables)
 * - Section II: Valuation of Land (1. Details, 2.1 Freehold, 2.2 Leasehold, 2. Rent, 3. Description & multi-plot boundary schedule, 4. Characteristics & Proximities, 5. Other issues, 6. Land Valuation)
 * - Valuation of Building (1. Basic Info & Deviations, 1.H Plinth comparisons, 26-item checklist I to AB, 2. Technical Details, 3. Construction Specifications, 4. Building Valuation Table, 5.1-5.4 Sub-schedules)
 * - Section 6.0: Total Abstract Matrix (Land, Building, Extra Items, Amenities, Misc, Services across Govt, Market, Realisable 95%, Distress 85%, and OR SAY rounding)
 * - Remarks, Basis of Valuation, and Comprehensive Valuation Opinion Paragraph
 * - 17-point Valuer Declaration (A to Q) & Credentials Sign-Off Block
 * - 10-Point Valuation Report Check-List
 * - Enclosures: ROR, GPS Location Map, Property Photo Grid (with GPS stamps), Bhu Naksha Cadastral Map, and Guideline Value Proof.
 */

import { rgb, PDFImage } from 'pdf-lib';
import {
  PDFBankRenderer,
  PAGE_W,
  PAGE_H,
  MARGIN_T,
  MARGIN_B,
  MARGIN_L,
  MARGIN_R,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_SMALL,
  FONT_SIZE_CAPTION,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
  formatReportDate,
  fetchBytes,
} from '../pdf-bank-renderer';
import { formatIndianCurrency } from '@/lib/numberToWords';

export interface BandhanSMEPlotBoundary {
  plotNo: string;
  east: string;
  west: string;
  north: string;
  south: string;
}

export interface BandhanSMEBuildingValuationRow {
  description: string;
  plinthArea: string;
  height: string;
  age: string;
  replacementRate: string;
  replacementCost: string;
  depreciation: string;
  valueAfterDepreciation: string;
}

export interface BandhanSMESubScheduleItem {
  name: string;
  cost: string;
}

export interface BandhanSMEChecklistItem {
  pointNo: number;
  question: string;
  subText?: string;
  answer: 'Yes' | 'No' | 'NA';
}

export interface BandhanSMEPhoto {
  url: string;
  caption?: string;
  timestamp?: string;
  gps?: string;
}

export interface BandhanSMEReportFields {
  clientType?: string;
  institutionCategory?: string;
  organisationTemplate?: string;
  organisationSubTemplate?: string;
  bankName?: string;
  serviceType?: string;
  subjectType?: string;
  reworkNotes?: string;

  // Header
  refNo?: string;
  reportDate?: string;

  // Section I: Basic Information (A - M)
  branchName?: string;
  letterNoAndDate?: string;
  valuationMadeAtBorrowerRequest?: string;
  managerAccompanied?: string;
  valuationType?: string;
  dateOfEarlierValuation?: string;
  previousValuerName?: string;
  dateOfVisit?: string;
  dateOfValuation?: string;
  personsPresent?: string;
  documentsProduced?: string;

  // Borrower Details (L)
  borrowerName?: string;
  borrowerAt?: string;
  borrowerPo?: string;
  borrowerPs?: string;
  borrowerDist?: string;
  borrowerPhone?: string;
  borrowerNatureOfBusiness?: string;

  // Owner Details (M)
  ownerName?: string;
  ownerAt?: string;
  ownerPo?: string;
  ownerPs?: string;
  ownerPin?: string;
  ownerDist?: string;
  ownerPhone?: string;
  ownerFatherName?: string;

  // Section II: Valuation of Land
  // 1. Details of Property (A - L, I)
  detailsPropertyOffered?: string;
  dateAcquisitionLand?: string;
  valueAsPerSaleDeed?: string;
  saleDeedDocNo?: string;
  areaLandDoc?: string;
  areaLandRor?: string;
  areaLandPhysical?: string;

  // Location of Property & Postal Address (H)
  plotNo?: string;
  khataNo?: string;
  propAt?: string;
  propPo?: string;
  propPs?: string;
  propPin?: string;
  propDist?: string;

  urbanSemiUrbanRural?: string;
  situatedAreaType?: string;
  classificationOfLocality?: string;
  typeOfProperty?: string;
  isAgricultural?: string;
  agriculturalConversionContemplated?: string;
  isIndustrial?: string;
  industrialActivitySuited?: string;
  isResidential?: string;
  isCommercial?: string;
  isInstitutional?: string;
  isOthersSpecify?: string;

  // 2.1 Title of Property Freehold / Leasehold (A - F)
  titleFreeholdLeasehold?: string;
  ownershipOfProperty?: string;
  jointOwnershipShare?: string;
  taxesPaidUpTo?: string;
  landRevenue?: string;
  landBuildingMunicipalTaxes?: string;
  wealthTaxAssessedPaid?: string;

  // 2.2 If Leasehold (A - L)
  isLeaseholdApplicable?: string;
  lessorName?: string;
  lesseeName?: string;
  natureOfLease?: string;
  dateCommencementLease?: string;
  periodOfLease?: string;
  termsOfRenewal?: string;
  leasePremiumRentPerAnnum?: string;
  unexpiredPeriodOfLease?: string;
  initialPremium?: string;
  groundRentPerAnnum?: string;
  unearnedIncreasePayable?: string;
  leasePermitsMortgage?: string;

  // 2. Rent Details (A - D)
  rentOccupationStatus?: string;
  tenantNames?: string;
  tenantPortionOccupied?: string;
  monthlyAnnualRentPaid?: string;
  grossRentReceived?: string;

  // 3. Brief Description of the Property (A - N, I, II, III, IV, P.1, P.2)
  detailedAddressWithPin?: string;
  municipalityWardNo?: string;
  streetNo?: string;
  surveyPlotNo?: string;
  briefKhataNo?: string;
  mouza?: string;
  thanaNo?: string;
  tehasilNo?: string;
  tehasil?: string;
  sro?: string;
  policeStation?: string;
  villageTownCity?: string;
  district?: string;
  state?: string;

  dimensionDocEastWest?: string;
  dimensionDocNorthSouth?: string;
  dimensionMeasEastWest?: string;
  dimensionMeasNorthSouth?: string;
  extentOfSite?: string;
  extentConsideredValuation?: string;

  // Boundaries P.1 (Deed) & P.2 (Verification)
  documentPlotBoundaries?: BandhanSMEPlotBoundary[];
  verifiedBoundaryEast?: string;
  verifiedBoundaryWest?: string;
  verifiedBoundaryNorth?: string;
  verifiedBoundarySouth?: string;
  sketchEnclosed?: string;

  // 4. Characteristics of the Site (A - U, Location Adv/Disadv)
  levelOfLand?: string;
  useToWhichCanBePut?: string;
  easementAgreements?: string;
  restrictiveCovenant?: string;
  approvalLetterNoDateDevelopment?: string;
  buildingUseCertificateObtained?: string;
  townPlanningSchemeInclusion?: string;
  cornerOrIntermittentPlot?: string;
  isLandLocked?: string;
  freeAccessAndProximity?: string;
  roadFacilities?: string;
  roadKindAndWidth?: string;
  distMunicipalOffice?: string;
  distMunicipalLimits?: string;
  waterPotentialities?: string;
  possibilityFlooding?: string;
  undergroundSewerageAvailable?: string;
  drainageSystemsAvailable?: string;
  powerSupplyAvailable?: string;
  surroundingDevelopment?: string;

  // Proximity to Civic Amenities (T.i - T.vii)
  proximitySchool?: string;
  proximityCollege?: string;
  proximityHospital?: string;
  proximityMarket?: string;
  proximityBusStand?: string;
  proximityRailwayStation?: string;
  proximityOtherPlace?: string;
  latitudeLongitude?: string;
  locationAdvantages?: string;
  locationDisadvantages?: string;

  // 5. Other Issues / Points (A - D)
  landAcquisitionNotification?: string;
  developmentContributionDemanded?: string;
  landCeilingEnactments?: string;
  salesInstancesInLocality?: string;
  salesBasisArrivingLandRate?: string;
  adoptedLandRateRationale?: string;

  // 6. Valuation of Land
  previousValuationDetails?: string;
  presentValuationApproachDetails?: string;
  landAreaTotal?: string;
  landGovtBenchmarkRate?: string;
  landGovtValueTotal?: string;
  landMarketRate?: string;
  landMarketValueTotal?: string;
  landDistressValue?: string;
  landRealisableValue?: string;

  // Valuation of Building
  // 1. Basic Information of Building (A - F, G, H, I - AB)
  buildingType?: string;
  yearCommencementCompletion?: string;
  typeOfConstruction?: string;
  estimatedFutureLife?: string;
  farFsiPermissibleUtilized?: string;
  buildingApprovalAuthorityDetails?: string;
  constructionAsPerPlanDeviations?: string;

  // 1.H Built up Area
  builtUpAreaAssessmentHolding?: string;
  builtUpAreaAsPerActual?: string;
  carpetAreaTotal?: string;
  saleableAreaTotal?: string;

  // 1.I - 1.AB Occupancy & 26+ details
  buildingOwnerOccupiedTenanted?: string;
  ownerOccupiedPortion?: string;
  isUnderRentControlAct?: string;
  buildingTenantNames?: string;
  buildingTenantPortions?: string;
  buildingMonthlyRent?: string;
  buildingGrossRent?: string;
  occupantsRelatedToOwner?: string;
  fixturesAmountRecovered?: string;
  waterElectricityChargesBorneBy?: string;
  isRentDisputePendingCourt?: string;
  hasStandardRentFixed?: string;
  tenantBearMaintenance?: string;
  liftMaintenanceBorneBy?: string;
  pumpMaintenanceBorneBy?: string;
  commonElectricityBorneBy?: string;
  propertyTaxAmountBorneBy?: string;
  isBuildingInsuredDetails?: string;
  statutoryDuesPaid?: string;
  buildingFreeAccess?: string;

  // 2. Technical Details of Building (A - G)
  numberOfFloorsAndHeight?: string;
  floorHeightGF?: string;
  floorHeightFF?: string;
  floorHeightSF?: string;
  floorHeightTF?: string;
  plinthAreaGF?: string;
  plinthAreaFF?: string;
  plinthAreaSF?: string;
  plinthAreaTF?: string;
  buildingConditionExterior?: string;
  buildingConditionInterior?: string;
  foundationType?: string;
  doorsWindowsGF?: string;
  doorsWindowsFF?: string;
  doorsWindowsSF?: string;
  doorsWindowsTF?: string;
  flooringGF?: string;
  flooringFF?: string;
  flooringSF?: string;
  flooringTF?: string;
  wallFinishingGF?: string;
  wallFinishingFF?: string;
  wallFinishingSF?: string;
  wallFinishingTF?: string;

  // 3. Construction Specifications (A - W)
  specFoundation?: string;
  specBasement?: string;
  specSuperstructure?: string;
  specJoineryDoorsWindows?: string;
  specRccWorks?: string;
  specPlastering?: string;
  specFlooringSkirting?: string;
  specSpecialFinishing?: string;
  specRoofing?: string;
  specDrainage?: string;
  specDecorativeFeatures?: string;
  specInternalWiring?: string;
  specWiringFittingsClass?: string;
  specSanitaryInstallation?: string;
  specNoOfGeysers?: string;
  specSanitaryFittingsClass?: string;
  specCompoundWall?: string;
  specLiftsCapacity?: string;
  specUndergroundSump?: string;
  specOverheadTank?: string;
  specPumpsHp?: string;
  specRoadsPavingCompound?: string;
  specSewageDisposal?: string;
  specQualityClassConstruction?: string;

  // 4. Details of Building Valuation Table
  buildingValuationRows?: BandhanSMEBuildingValuationRow[];

  // 5. Sub-Schedules (5.1 Extra Items, 5.2 Amenities, 5.3 Misc, 5.4 Services)
  isExtraItemsNA?: boolean;
  extraItems?: BandhanSMESubScheduleItem[];
  extraItemsTotal?: string;

  isAmenitiesNA?: boolean;
  amenities?: BandhanSMESubScheduleItem[];
  amenitiesTotal?: string;

  isMiscNA?: boolean;
  miscItems?: BandhanSMESubScheduleItem[];
  miscItemsTotal?: string;

  isServicesNA?: boolean;
  servicesItems?: BandhanSMESubScheduleItem[];
  servicesItemsTotal?: string;

  // 6.0 Total Abstract of Entire Property
  abstractGovtLand?: string;
  abstractMarketLand?: string;
  abstractRealLand?: string;
  abstractDistressLand?: string;

  abstractGovtBuilding?: string;
  abstractMarketBuilding?: string;
  abstractRealBuilding?: string;
  abstractDistressBuilding?: string;

  abstractGovtExtra?: string;
  abstractMarketExtra?: string;
  abstractRealExtra?: string;
  abstractDistressExtra?: string;

  abstractGovtAmenities?: string;
  abstractMarketAmenities?: string;
  abstractRealAmenities?: string;
  abstractDistressAmenities?: string;

  abstractGovtMisc?: string;
  abstractMarketMisc?: string;
  abstractRealMisc?: string;
  abstractDistressMisc?: string;

  abstractGovtServices?: string;
  abstractMarketServices?: string;
  abstractRealServices?: string;
  abstractDistressServices?: string;

  abstractGovtTotal?: string;
  abstractMarketTotal?: string;
  abstractRealTotal?: string;
  abstractDistressTotal?: string;

  abstractGovtSay?: string;
  abstractMarketSay?: string;
  abstractRealSay?: string;
  abstractDistressSay?: string;

  // Remarks, Basis of Valuation & Valuation Opinion
  valuationRemarksBox?: string;
  basisOfValuationStatement?: string;
  fairMarketValue?: string;
  fairMarketValueWords?: string;
  realisableValue?: string;
  realisableValueWords?: string;
  bookValueOfLand?: string;
  bookValueOfLandWords?: string;
  distressValue?: string;
  distressValueWords?: string;
  insurableValueOfProperty?: string;
  insurableValueOfPropertyWords?: string;

  // Declaration & Sign-off
  declarationItems?: string[];
  reportPagesCount?: string;
  siteEngineerName?: string;
  empanelledValuerName?: string;
  valuerQualifications?: string;
  valuerIovRegNo?: string;
  valuerWealthTaxRegNo?: string;
  declarationDate?: string;

  // 10-Point Checklist
  checklist?: BandhanSMEChecklistItem[];

  // Enclosures
  rorImageUrl?: string;
  locationMapImageUrl?: string;
  bhuNakshaImageUrl?: string;
  guidelineValueImageUrl?: string;
  propertyPhotos?: BandhanSMEPhoto[];
  documentImages?: string[];
  documentImageNames?: string[];
  locationMapImages?: string[];
  mouzaMapImages?: string[];
  sketchMapImages?: string[];
  cadastralMapImages?: string[];
  bdaMapImages?: string[];
  benchmarkMapImages?: string[];
  [key: string]: any;
}

const TABLE_FONT_SIZE = FONT_SIZE; // 12pt
const TABLE_MIN_ROW_H = 18;

export class PDFBandhanSMERenderer extends PDFBankRenderer {
  private colSl = 32;
  private colPts = 210;
  private colRem = CONTENT_W - 32 - 210; // ~245.28 pt

  private colLbl2 = 240;
  private colVal2 = CONTENT_W - 240;

  /**
   * Helper to safely embed image from URL or data URI
   */
  private async embedImgFromUrl(url?: string | null): Promise<PDFImage | null> {
    if (!url || !url.trim()) return null;
    const bytes = await fetchBytes(url);
    if (!bytes || bytes.length === 0) return null;
    try {
      return await this.doc.embedPng(bytes);
    } catch {
      try {
        return await this.doc.embedJpg(bytes);
      } catch {
        return null;
      }
    }
  }

  /**
   * Standard 3-column row: [Sl.No | POINTS | REMARKS:]
   */
  private drawBandhanRow(
    sl: string,
    points: string,
    remarks: string,
    isBoldPts: boolean = true,
    isBoldRem: boolean = false,
    fontSize: number = TABLE_FONT_SIZE
  ): void {
    const remText = remarks ?? '';
    const hSl = sl ? this.cellHeight(sl, this.colSl, { bold: isBoldPts, fontSize }) : TABLE_MIN_ROW_H;
    const hPts = this.cellHeight(points, this.colPts, { bold: isBoldPts, fontSize });
    const hRem = this.cellHeight(remText, this.colRem, { bold: isBoldRem, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hSl, hPts, hRem);

    this.checkPageBreak(rowH);

    // 1. Sl No
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, sl, {
      bold: isBoldPts,
      fontSize,
      align: 'center',
      vAlign: 'top',
    });

    // 2. POINTS
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colPts, rowH, points, {
      bold: isBoldPts,
      fontSize,
      align: 'left',
      vAlign: 'top',
    });

    // 3. REMARKS
    this.drawCell(MARGIN_L + this.colSl + this.colPts, this.cursorY, this.colRem, rowH, remText, {
      bold: isBoldRem,
      fontSize,
      align: 'left',
      vAlign: 'top',
    });

    this.cursorY += rowH;
  }

  /**
   * Standard 2-column row: [LABEL | VALUE]
   */
  private draw2ColRow(
    label: string,
    val: string,
    isBoldLbl: boolean = true,
    isBoldVal: boolean = false,
    bgHex?: string,
    fontSize: number = TABLE_FONT_SIZE
  ): void {
    const vText = val ?? '';
    const hLbl = this.cellHeight(label, this.colLbl2, { bold: isBoldLbl, fontSize });
    const hVal = this.cellHeight(vText, this.colVal2, { bold: isBoldVal, fontSize });
    const rowH = Math.max(TABLE_MIN_ROW_H, hLbl, hVal);

    this.checkPageBreak(rowH);

    this.drawCell(MARGIN_L, this.cursorY, this.colLbl2, rowH, label, {
      bold: isBoldLbl,
      fontSize,
      align: 'left',
      vAlign: 'top',
      fillColor: bgHex,
    });

    this.drawCell(MARGIN_L + this.colLbl2, this.cursorY, this.colVal2, rowH, vText, {
      bold: isBoldVal,
      fontSize,
      align: 'left',
      vAlign: 'top',
      fillColor: bgHex,
    });

    this.cursorY += rowH;
  }

  /**
   * Draw section spanner banner
   */
  private drawSectionSpanner(title: string, subTitle?: string): void {
    const fullTitle = subTitle ? `${title}\n${subTitle}` : title;
    const h = this.cellHeight(fullTitle, CONTENT_W, { bold: true, fontSize: FONT_SIZE_HEADER });
    const rowH = Math.max(22, h);

    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, rowH, fullTitle, {
      bold: true,
      fontSize: FONT_SIZE_HEADER,
      align: 'left',
      vAlign: 'middle',
      fillColor: LBL_BG,
    });
    this.cursorY += rowH;
  }

  /**
   * Main PDF Generation Entrance
   */
  public async generateBandhanSMEReport(fields: BandhanSMEReportFields): Promise<Uint8Array> {
    await this.init();

    // 1. Cover Letterhead & Basic Information
    this.renderBasicInformationSection(fields);

    // 2. Section II: Valuation of Land
    this.renderValuationOfLandSection(fields);

    // 3. Valuation of Building
    this.renderValuationOfBuildingSection(fields);

    // 4. Section 6.0: Total Abstract Matrix & Valuation Opinion
    this.renderTotalAbstractAndOpinionSection(fields);

    // 5. Valuer Declaration & Credentials Sign-Off Block
    this.renderDeclarationAndSignoffSection(fields);

    // 6. Valuation Report Check-List
    this.renderChecklistSection(fields);

    // 7. Enclosures (ROR, Location Map, Photos, Bhu Naksha, Guideline Value)
    await this.renderEnclosures(fields);

    // Finalize and save
    return await this.save();
  }

  // ==========================================================================
  // 1. SECTION I: BASIC INFORMATION
  // ==========================================================================
  private renderBasicInformationSection(fields: BandhanSMEReportFields): void {
    // Header space
    this.cursorY += 6;

    this.drawSectionSpanner('I. BASIC INFORMATION:');

    // Table Header
    const rowH = TABLE_MIN_ROW_H;
    this.checkPageBreak(rowH);
    this.drawCell(MARGIN_L, this.cursorY, this.colSl, rowH, 'Sl.', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + this.colSl, this.cursorY, this.colPts, rowH, 'BASIC INFORMATION', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.drawCell(MARGIN_L + this.colSl + this.colPts, this.cursorY, this.colRem, rowH, 'DETAILS:', { bold: true, fontSize: TABLE_FONT_SIZE, align: 'center', vAlign: 'middle' });
    this.cursorY += rowH;

    this.drawBandhanRow('A.', 'NAME OF THE BANK BRANCH / CBO / Asset Centre:', fields.branchName || '');
    this.drawBandhanRow('B.', 'BANK LETTER NO. & DATE-REQUESTING FOR UNDERTAKING VALUATION:', fields.letterNoAndDate || '');
    this.drawBandhanRow('C.', 'WHETHER VALUATION WAS MADE AT THE REQUEST OF THE BORROWER? :', fields.valuationMadeAtBorrowerRequest || 'No');
    this.drawBandhanRow('D.', 'NAME OF THE MANAGER/OFFICER WHO ACCOMPANIED THE VALUER:', fields.managerAccompanied || 'No');
    this.drawBandhanRow('E.', 'VALUATION: WHETHER FRESH/REVALUATION/PERIODIC VALUATION:', fields.valuationType || 'Fresh Valuation');
    this.drawBandhanRow('F.', 'DATE OF EARLIER VALUATION, IF ANY:', fields.dateOfEarlierValuation || 'No');
    this.drawBandhanRow('G.', 'NAME OF THE PREVIOUS VALUER, IF ANY:', fields.previousValuerName || 'Not Applicable');
    this.drawBandhanRow('H.', 'DATE OF VISIT TO THE PROPERTY:', fields.dateOfVisit || '');
    this.drawBandhanRow('I.', 'DATE ON WHICH VALUATION IS MADE:', fields.dateOfValuation || fields.reportDate || '');
    this.drawBandhanRow('J.', 'PERSON(S) IN PRESENCE OF WHOM VALUATION IS MADE:', fields.personsPresent || '');
    this.drawBandhanRow('K.', 'LIST OF DOCUMENTS PRODUCED FOR VERIFICATION:', fields.documentsProduced || '');

    // L. Borrower Details sub-block
    this.drawBandhanRow('L.', 'NAME OF THE BORROWER / BORROWAL ACCOUNT WITH ADDRESS, TELEPHONE NOS.& NATURE OF BUSINESS:', '', true, true);
    this.draw2ColRow('NAME:', fields.borrowerName || '', true, true);
    this.draw2ColRow('AT:', fields.borrowerAt || '', true, false);
    this.draw2ColRow('P.O:', fields.borrowerPo || '', true, false);
    this.draw2ColRow('PS:', fields.borrowerPs || '', true, false);
    this.draw2ColRow('DIST:', fields.borrowerDist || '', true, false);
    this.draw2ColRow('PHONE NO:', fields.borrowerPhone || '', true, false);
    if (fields.borrowerNatureOfBusiness) {
      this.draw2ColRow('NATURE OF BUSINESS:', fields.borrowerNatureOfBusiness || '', true, false);
    }

    // M. Owner Details sub-block
    this.drawBandhanRow('M.', 'NAME / ADDRESS / TELEPHONE NO. OF THE OWNER/OWNER(S) OF THE PROPERTY:', '', true, true);
    this.draw2ColRow('NAME:', fields.ownerName || '', true, true);
    this.draw2ColRow('AT:', fields.ownerAt || '', true, false);
    this.draw2ColRow('P.O:', fields.ownerPo || '', true, false);
    this.draw2ColRow('P.S:', fields.ownerPs || '', true, false);
    this.draw2ColRow('PIN:', fields.ownerPin || '', true, false);
    this.draw2ColRow('DIST:', fields.ownerDist || '', true, false);
    this.draw2ColRow('PHONE NO:', fields.ownerPhone || '', true, false);
    this.draw2ColRow("FATHER'S NAME (In case Property in Name of Individual):", fields.ownerFatherName || 'NA', true, false);
  }

  // ==========================================================================
  // 2. SECTION II: VALUATION OF LAND
  // ==========================================================================
  private renderValuationOfLandSection(fields: BandhanSMEReportFields): void {
    this.cursorY += 8;
    this.drawSectionSpanner('II. VALUATION OF LAND:');

    // 1. Details of Property
    this.drawSectionSpanner('1. DETAILS OF PROPERTY:');
    this.drawBandhanRow('A.', 'DETAILS OF PROPERTY OFFERED AS SECURED:', fields.detailsPropertyOffered || 'Land & Building');
    this.drawBandhanRow('B.', 'DATE OF ACQUISITION/PURCHASE OF LAND:', fields.dateAcquisitionLand || '');
    this.drawBandhanRow('C.', 'VALUE OF THE PROPERTY AS PER REGD. SALE DEED:', fields.valueAsPerSaleDeed || '');
    this.drawBandhanRow('D.', 'SALE DEED / TITLE DEED DOCUMENT NO:', fields.saleDeedDocNo || '');
    this.drawBandhanRow('E.', 'AREA OF LAND (AS PER DOCUMENT/TITLE DEED):', fields.areaLandDoc || '');
    this.drawBandhanRow('F.', 'AREA OF LAND (AS PER ROR):', fields.areaLandRor || '');
    this.drawBandhanRow('G.', 'AREA OF LAND (AS PER PHYSICAL MEASUREMENT):', fields.areaLandPhysical || '');

    // H. Location of Property & Postal Address sub-block
    this.drawBandhanRow('H.', 'LOCATION OF THE PROPERTY AND POSTAL ADDRESS:', '', true, true);
    this.draw2ColRow('PLOT NO:', fields.plotNo || '', true, false);
    this.draw2ColRow('DAG NO/KHATIAN NO/RS NO:', fields.khataNo || '', true, false);
    this.draw2ColRow('AT:', fields.propAt || '', true, false);
    this.draw2ColRow('PO:', fields.propPo || '', true, false);
    this.draw2ColRow('P.S:', fields.propPs || '', true, false);
    this.draw2ColRow('PIN:', fields.propPin || '', true, false);
    this.draw2ColRow('DIST:', fields.propDist || '', true, false);

    this.drawBandhanRow('I.', 'URBAN/SEMI URBAN/RURAL:', fields.urbanSemiUrbanRural || 'Urban Area');
    this.drawBandhanRow('J.', 'WHETHER THE PROPERTY IS SITUATED IN RESIDENTIAL/COMMERCIAL / MIXED / INDUSTRIAL AREA:', fields.situatedAreaType || 'Residential cum Commercial Area');
    this.drawBandhanRow('K.', 'CLASSIFICATION OF LOCALITY- I.E KIND OF PEOPLE STAYING (HIGH / MIDDLE / POOR CLASS):', fields.classificationOfLocality || 'Middle Class');
    this.drawBandhanRow('L.', 'TYPE OF PROPERTY:', fields.typeOfProperty || 'Land & building');
    this.drawBandhanRow('I.', 'AGRICULTURAL:', fields.isAgricultural || 'No');
    this.drawBandhanRow('II.', 'IN CASE IT IS AN AGRICULTURAL LAND, ANY CONVERSION TO HOUSE SITE PLOTS IS CONTEMPLATED:', fields.agriculturalConversionContemplated || 'Not Applicable');
    this.drawBandhanRow('III.', 'INDUSTRIAL / ACTIVITY SUITED:', fields.isIndustrial === 'Yes' ? fields.industrialActivitySuited || 'Yes' : 'No');
    this.drawBandhanRow('IV.', 'RESIDENTIAL (ANY RESTRICTIVE CLAUSES FOR SALE ETC. TO BE FURNISHED):', fields.isResidential || 'Yes');
    this.drawBandhanRow('V.', 'COMMERCIAL:', fields.isCommercial || 'Yes');
    this.drawBandhanRow('VI.', 'INSTITUTIONAL:', fields.isInstitutional || 'No');
    this.drawBandhanRow('VII.', 'OTHERS (SPECIFY):', fields.isOthersSpecify || 'No');

    // 2.1 Title of Property Freehold / Leasehold
    this.drawSectionSpanner('2.1 TITLE OF THE PROPERTY FREE HOLD / LEASE HOLD:', fields.titleFreeholdLeasehold || 'It is a free hold land');
    this.drawBandhanRow('A.', 'OWNERSHIP OF THE PROPERTY:', fields.ownershipOfProperty || 'Single Ownership');
    this.drawBandhanRow('B.', 'IN CASE OF JOINT OWNERSHIP WHETHER SHARE IS UNDIVIDED/DIVIDED. IF UNDIVIDED, SHARE OF EACH OWNER:', fields.jointOwnershipShare || 'Not Applicable');
    this.drawBandhanRow('C.', 'TAXES PAID UP TO:', fields.taxesPaidUpTo || 'We have not verified any recent rent receipt');
    this.drawBandhanRow('D.', 'LAND REVENUE:', fields.landRevenue || 'We have not verified any recent rent receipt');
    this.drawBandhanRow('E.', 'LAND/BUILDING MUNICIPAL TAXES:', fields.landBuildingMunicipalTaxes || 'We have not verified any recent rent receipt');
    this.drawBandhanRow('F.', 'WEALTH TAX ASSESSED/PAID, IF ANY:', fields.wealthTaxAssessedPaid || 'Not Applicable');

    // 2.2 If Leasehold
    if (fields.isLeaseholdApplicable === 'Yes') {
      this.drawSectionSpanner('2.2 IF LEASE HOLD:');
      this.drawBandhanRow('A.', 'NAME OF THE LESSOR:', fields.lessorName || 'Not Applicable');
      this.drawBandhanRow('B.', 'NAME OF THE LESSEE:', fields.lesseeName || 'Not Applicable');
      this.drawBandhanRow('C.', 'NATURE OF LEASE:', fields.natureOfLease || 'Not Applicable');
      this.drawBandhanRow('D.', 'DATE OF COMMENCEMENT OF LEASE:', fields.dateCommencementLease || 'Not Applicable');
      this.drawBandhanRow('E.', 'PERIOD OF LEASE:', fields.periodOfLease || 'Not Applicable');
      this.drawBandhanRow('F.', 'TERMS OF RENEWAL:', fields.termsOfRenewal || 'Not Applicable');
      this.drawBandhanRow('G.', 'LEASE PREMIUM / RENT PER ANNUM:', fields.leasePremiumRentPerAnnum || 'Not Applicable');
      this.drawBandhanRow('H.', 'UN-EXPIRED PERIOD OF LEASE:', fields.unexpiredPeriodOfLease || 'Not Applicable');
      this.drawBandhanRow('I.', 'INITIAL PREMIUM:', fields.initialPremium || 'Not Applicable');
      this.drawBandhanRow('J.', 'GROUND RENT PAYABLE PER ANNUM:', fields.groundRentPerAnnum || 'Not Applicable');
      this.drawBandhanRow('K.', 'UNEARNED INCREASE PAYABLE TO THE LESSOR IN THE EVENT OF SALE OR TRANSFER:', fields.unearnedIncreasePayable || 'Not Applicable');
      this.drawBandhanRow('L.', 'WHETHER LEASE AGREEMENT PERMITS CREATION OF MORTGAGE:', fields.leasePermitsMortgage || 'Not Applicable');
    }

    // 2. Rent Details
    this.drawSectionSpanner('2. RENT:', fields.rentOccupationStatus || 'The Plot is occupied by Owner');
    this.drawBandhanRow('A.', 'NAMES OF TENANTS/LESSEES / LICENSEES, ETC.:', fields.tenantNames || 'Not Applicable');
    this.drawBandhanRow('B.', 'PORTION IN THEIR OCCUPATION:', fields.tenantPortionOccupied || 'Not Applicable');
    this.drawBandhanRow('C.', 'MONTHLY OR ANNUAL RENT / COMPENSATION / LICENSE FEE, ETC. PAID BY EACH:', fields.monthlyAnnualRentPaid || 'Not Applicable');
    this.drawBandhanRow('D.', 'GROSS AMOUNT RECEIVE FOR THE WHOLE PROPERTY:', fields.grossRentReceived || 'Not Applicable');

    // 3. Brief Description of Property
    this.drawSectionSpanner('3. BRIEF DESCRIPTION OF THE PROPERTY:');
    this.drawBandhanRow('A.', 'ADDRESS OF THE PROPERTY IN DETAIL (PIN NO. TO BE CAPTURED MANDATORILY):', fields.detailedAddressWithPin || '');
    this.drawBandhanRow('B.', 'MUNICIPALITY WARD NO:', fields.municipalityWardNo || '');
    this.drawBandhanRow('C.', 'STREET NO.:', fields.streetNo || '');
    this.drawBandhanRow('D.', 'SURVEY/PLOT NO.:', fields.surveyPlotNo || '');
    this.drawBandhanRow('E.', 'KHATA NO.:', fields.briefKhataNo || '');
    this.drawBandhanRow('F.', 'MOUZA:', fields.mouza || '');
    this.drawBandhanRow('G.', 'THANA NO:', fields.thanaNo || '');
    this.drawBandhanRow('H.', 'TEHASIL NO.:', fields.tehasilNo || '');
    this.drawBandhanRow('I.', 'TEHASIL:', fields.tehasil || '');
    this.drawBandhanRow('J.', 'SRO:', fields.sro || '');
    this.drawBandhanRow('K.', 'POLICE STATION (P.S):', fields.policeStation || '');
    this.drawBandhanRow('L.', 'VILLAGE/TOWN/CITY:', fields.villageTownCity || 'City');
    this.drawBandhanRow('M.', 'DISTRICT:', fields.district || '');
    this.drawBandhanRow('N.', 'STATE:', fields.state || 'Odisha');

    this.drawBandhanRow('(I) a.', 'DIMENSIONS OF THE SITE AS PER DOCUMENT: EAST TO WEST:', fields.dimensionDocEastWest || 'As per Sketch Map');
    this.drawBandhanRow('(I) b.', 'DIMENSIONS OF THE SITE AS PER DOCUMENT: NORTH TO SOUTH:', fields.dimensionDocNorthSouth || 'As per Sketch Map');
    this.drawBandhanRow('(II) a.', 'DIMENSIONS OF THE SITE AS PER MEASUREMENT: EAST TO WEST:', fields.dimensionMeasEastWest || 'As per Sketch Map');
    this.drawBandhanRow('(II) b.', 'DIMENSIONS OF THE SITE AS PER MEASUREMENT: NORTH TO SOUTH:', fields.dimensionMeasNorthSouth || 'As per Sketch Map');
    this.drawBandhanRow('(III)', 'EXTENT OF SITE:', fields.extentOfSite || '');
    this.drawBandhanRow('(IV)', 'EXTENT OF SITE CONSIDERED FOR VALUATION PURPOSE:', fields.extentConsideredValuation || '');

    // Boundaries P.1 & P.2
    this.renderBoundarySchedules(fields);

    // 4. Characteristics of the Site
    this.drawSectionSpanner('4. CHARACTERISTICS OF THE SITE:');
    this.drawBandhanRow('A.', 'LEVEL OF LAND WITH TOPOGRAPHICAL CONDITION:', fields.levelOfLand || 'Leveled and Plain');
    this.drawBandhanRow('B.', 'USE TO WHICH IT CAN BE PUT:', fields.useToWhichCanBePut || 'Residential cum Commercial Purpose');
    this.drawBandhanRow('C.', 'IS THERE ANY AGREEMENT OF EASEMENTS (ENCROACHMENTS)? IF SO, DETAILS:', fields.easementAgreements || 'No such agreement verified');
    this.drawBandhanRow('D.', 'IS THERE ANY RESTRICTIVE COVENANT IN REGARD TO USE OF LAND? IF SO, ATTACH A COPY OF THE COVENANT:', fields.restrictiveCovenant || 'No');
    this.drawBandhanRow('E.', 'APPROVAL LETTER NO.& DATE OF DEVELOPMENT AGENCIES / MUNICIPALITY ETC. AUTHORIZING CONSTRUCTION:', fields.approvalLetterNoDateDevelopment || 'Not Applicable');
    this.drawBandhanRow('F.', 'WHETHER BUILDING USE CERTIFICATE FROM THE DEVELOPMENT AUTHORITIES / MUNICIPALITY ETC. HAS BEEN OBTAINED:', fields.buildingUseCertificateObtained || 'Not Applicable');
    this.drawBandhanRow('G.', 'DOES THE LAND FALL IN AN AREA INCLUDED IN ANY TOWN PLANNING SCHEME OR DEVELOPMENT PLAN OF GOVERNMENT/STATUTORY BODY?:', fields.townPlanningSchemeInclusion || '');
    this.drawBandhanRow('H.', 'CORNER OR INTERMITTENT PLOT:', fields.cornerOrIntermittentPlot || 'Intermittent Plot');
    this.drawBandhanRow('I.', 'IS A LAND LOCKED LAND?:', fields.isLandLocked || 'No');
    this.drawBandhanRow('J.', 'WHETHER THE LAND IS HAVING FREE ACCESS MEANS AND PROXIMITY TO SURFACE COMMUNICATION BY WHICH THE LOCALITY IS SERVED:', fields.freeAccessAndProximity || 'Yes (15 ft wide CC Road) / Bike, Car, Bus');
    this.drawBandhanRow('K.', 'ROAD FACILITIES:', fields.roadFacilities || 'Yes, Available at site');
    this.drawBandhanRow('L.', 'ROAD (KIND OF ROAD AND WIDTH):', fields.roadKindAndWidth || '15 ft wide BT Road');
    this.drawBandhanRow('M. a.', 'DISTANCE OF THE PROPERTY FROM MUNICIPAL OFFICE:', fields.distMunicipalOffice || 'Bhubaneswar');
    this.drawBandhanRow('M. b.', 'DISTANCE OF THE PROPERTY FROM MUNICIPAL LIMITS:', fields.distMunicipalLimits || 'Bhubaneswar Municipal Corporation');
    this.drawBandhanRow('N.', 'WATER POTENTIALITIES:', fields.waterPotentialities || 'Good');
    this.drawBandhanRow('O.', 'POSSIBILITY OF FREQUENT FLOODING:', fields.possibilityFlooding || 'No');
    this.drawBandhanRow('P.', 'UNDERGROUND SEWERAGE SYSTEM AVAILABILITY:', fields.undergroundSewerageAvailable || 'No');
    this.drawBandhanRow('Q.', 'DRAINAGE SYSTEMS AVAILABLE:', fields.drainageSystemsAvailable || 'Surface Drainage');
    this.drawBandhanRow('R.', 'IS POWER SUPPLY AVAILABLE IN THE SITE?:', fields.powerSupplyAvailable || 'Yes');
    this.drawBandhanRow('S.', 'DEVELOPMENT OF SURROUNDING AREAS:', fields.surroundingDevelopment || 'Residential Buildings');

    // Proximity to Civic Amenities
    this.drawBandhanRow('T. (i)', 'PROXIMITY: SCHOOL:', fields.proximitySchool || '');
    this.drawBandhanRow('T. (ii)', 'PROXIMITY: COLLEGE:', fields.proximityCollege || '');
    this.drawBandhanRow('T. (iii)', 'PROXIMITY: HOSPITAL:', fields.proximityHospital || '');
    this.drawBandhanRow('T. (iv)', 'PROXIMITY: MARKET:', fields.proximityMarket || '');
    this.drawBandhanRow('T. (v)', 'PROXIMITY: BUS STAND:', fields.proximityBusStand || '');
    this.drawBandhanRow('T. (vi)', 'PROXIMITY: RAILWAY STATION:', fields.proximityRailwayStation || '');
    this.drawBandhanRow('T. (vii)', 'PROXIMITY: ANY OTHER IMPORTANT PLACE:', fields.proximityOtherPlace || '');
    this.drawBandhanRow('U.', 'LATITUDE/LONGITUDE:', fields.latitudeLongitude || '');

    this.drawBandhanRow('4.', 'LOCATION ADVANTAGES:', fields.locationAdvantages || '');
    this.drawBandhanRow('', 'LOCATION DISADVANTAGES (DETAILS):', fields.locationDisadvantages || 'Nothing Observed');

    // 5. Other Issues / Points
    this.drawSectionSpanner('5. OTHER ISSUES/POINTS:');
    this.drawBandhanRow('A.', 'HAS THE WHOLE OR PART OF THE LAND BEEN NOTIFIED FOR ACQUISITION BY GOVERNMENT OR ANY STATUTORY BODY?:', fields.landAcquisitionNotification || 'No such documents verified');
    this.drawBandhanRow('B.', 'HAS ANY CONTRIBUTION BEEN MADE TOWARDS DEVELOPMENT OR IS ANY DEMAND FOR SUCH CONTRIBUTION STILL OUT STANDING:', fields.developmentContributionDemanded || 'No such documents verified');
    this.drawBandhanRow('C.', 'WHETHER COVERED UNDER ANY STATE/CENTRAL GOVT ENACTMENTS (E.G URBAN LAND CEILING ACT) OR NOTIFIED UNDER AGENCY/CANTONMENT AREA:', fields.landCeilingEnactments || 'No such documents verified');
    this.drawBandhanRow('D. a.', 'GIVE INSTANCE OF SALES OF IMMOVABLE PROPERTY IN THE LOCALITY:', fields.salesInstancesInLocality || 'Transactions of the property are not available in the locality');
    this.drawBandhanRow('D. b.', 'IF SALE INSTANCE ARE NOT AVAILABLE OR NOT RELIED UPON, PLEASE FURNISHED THE BASIS OF ARRIVING AT THE LAND RATE:', fields.salesBasisArrivingLandRate || 'The present market rate of land confirmed through local enquiry and property dealers and found to be acceptable.');
    this.drawBandhanRow('D. c.', 'LAND RATE ADOPTED IN THIS VALUATION:', fields.adoptedLandRateRationale || '');

    // 6. Valuation of Land
    this.drawSectionSpanner('6. VALUATION:');
    this.drawBandhanRow('A.', 'PREVIOUS VALUATION DETAILS:', fields.previousValuationDetails || 'Not Available / Not Applicable');
    this.drawBandhanRow('B.', 'PRESENT VALUATION DETAILS & APPROACH:', fields.presentValuationApproachDetails || '');
    this.drawBandhanRow('', 'TOTAL LAND AREA:', fields.landAreaTotal || fields.extentOfSite || '');
    this.drawBandhanRow('', 'GOVT. BENCHMARK VALUE OF LAND:', fields.landGovtValueTotal || '', true, true);
    this.drawBandhanRow('', 'TOTAL MARKET VALUE OF LAND:', fields.landMarketValueTotal || '', true, true);
    this.drawBandhanRow('', 'DISTRESS SALE VALUE (85%):', fields.landDistressValue || '', true, true);
    this.drawBandhanRow('', 'REALISABLE ESTIMATION (95%):', fields.landRealisableValue || '', true, true);
  }

  // --------------------------------------------------------------------------
  // Helper: Multi-Plot Boundaries Schedule
  // --------------------------------------------------------------------------
  private renderBoundarySchedules(fields: BandhanSMEReportFields): void {
    const deedPlots = (fields.documentPlotBoundaries && fields.documentPlotBoundaries.length > 0)
      ? fields.documentPlotBoundaries
      : [
          { plotNo: 'Plot No: ' + (fields.plotNo || 'Deed Plot'), east: 'As per deed', west: 'As per deed', north: 'Road', south: 'As per deed' }
        ];

    this.drawSectionSpanner('P.1 BOUNDARIES (AS PER DOCUMENT)');

    for (const dp of deedPlots) {
      this.draw2ColRow('SCHEDULE FOR PLOT / TITLE:', dp.plotNo || 'Deed Schedule', true, true, '#f1f5f9');
      this.draw2ColRow('EAST:', dp.east || '', true, false);
      this.draw2ColRow('WEST:', dp.west || '', true, false);
      this.draw2ColRow('NORTH:', dp.north || '', true, false);
      this.draw2ColRow('SOUTH:', dp.south || '', true, false);
    }

    this.drawSectionSpanner('P.2 BOUNDARIES (AS PER VERIFICATION)');
    this.draw2ColRow('EAST:', fields.verifiedBoundaryEast || '', true, false);
    this.draw2ColRow('WEST:', fields.verifiedBoundaryWest || '', true, false);
    this.draw2ColRow('NORTH:', fields.verifiedBoundaryNorth || '', true, false);
    this.draw2ColRow('SOUTH:', fields.verifiedBoundarySouth || '', true, false);
    this.draw2ColRow('(SKETCH FOR LOCATION OF THE PROPERTY ENCLOSED):', fields.sketchEnclosed || 'Yes, Enclosed', true, false);
  }

  // ==========================================================================
  // 3. VALUATION OF BUILDING
  // ==========================================================================
  private renderValuationOfBuildingSection(fields: BandhanSMEReportFields): void {
    this.cursorY += 8;
    this.drawSectionSpanner('VALUATION OF BUILDING');

    // 1. Basic Info
    this.drawSectionSpanner('1. BASIC INFORMATION OF THE BUILDING (LAND DETAILS IN PART A)');
    this.drawBandhanRow('A.', 'TYPE OF BUILDING (RESIDENTIAL/COMMERCIAL/INDUSTRIAL):', fields.buildingType || 'Residential Cum Commercial');
    this.drawBandhanRow('B.', 'YEAR OF COMMENCEMENT OF CONSTRUCTION AND YEAR OF COMPLETION:', fields.yearCommencementCompletion || '');
    this.drawBandhanRow('C.', 'TYPE OF CONSTRUCTION-LOAD BEARING WALLS/RCC FRAMES/STEEL FRAME:', fields.typeOfConstruction || 'RCC Frames');
    this.drawBandhanRow('D.', 'ESTIMATED FUTURE LIFE:', fields.estimatedFutureLife || '60 Yrs');
    this.drawBandhanRow('E.', 'WHAT IS THE FLOOR SPACE INDEX PERMISSIBLE AND PERCENTAGE ACTUALLY UTILIZED?:', fields.farFsiPermissibleUtilized || 'FAR: 3.46');
    this.drawBandhanRow('F.', 'APPROVAL LETTER NO & DATE OF DEVELOPMENT AUTHORITY/MUNICIPALITY/LOCAL BODY AUTHORISING CONSTRUCTION:', fields.buildingApprovalAuthorityDetails || '');
    this.drawBandhanRow('G.', 'WHETHER THE CONSTRUCTION HAS BEEN MADE AS PER APPROVED PLAN? (DEVIATIONS IF ANY):', fields.constructionAsPerPlanDeviations || 'Yes');

    // 1.H Built up Area
    this.drawSectionSpanner('1.H BUILT UP AREA DETAILS:');
    this.drawBandhanRow('(i)', 'BUILT UP AREA (AS PER ASSESSMENT OF HOLDING):', fields.builtUpAreaAssessmentHolding || '');
    this.drawBandhanRow('(i) b', 'BUILT UP AREA (AS PER ACTUAL):', fields.builtUpAreaAsPerActual || '');
    this.drawBandhanRow('(ii)', 'CARPET AREA (APPROX):', fields.carpetAreaTotal || '');
    this.drawBandhanRow('(iii)', 'SALEABLE AREA:', fields.saleableAreaTotal || '');

    // 26-Item Checklist (I to AB)
    this.drawSectionSpanner('OCCUPANCY & STATUTORY CHECKLIST (POINTS I TO AB)');
    this.drawBandhanRow('I.', 'IS THE BUILDING OWNER-OCCUPIED / TENANTED / BOTH?:', fields.buildingOwnerOccupiedTenanted || 'Owner Occupied');
    this.drawBandhanRow('J.', 'IF THE PARTLY OWNER - OCCUPIED SPECIFY PORTION AND EXTENT OF AREA UNDER OWNERS -OCCUPATION:', fields.ownerOccupiedPortion || 'Not Applicable');
    this.drawBandhanRow('K.', 'WHETHER THE PROPERTY IS UNDER RENT CONTROL ACT:', fields.isUnderRentControlAct || 'No');
    this.drawBandhanRow('L.', 'NAMES OF TENANTS / LESSEES / LICENSEES, ETC:', fields.buildingTenantNames || 'Not Applicable');
    this.drawBandhanRow('M.', 'PORTIONS IN THEIR OCCUPATION:', fields.buildingTenantPortions || 'Not Applicable');
    this.drawBandhanRow('N.', 'MONTHLY OR ANNUAL RENT/COMPENSATION /LICENSE FEE, ETC. PAID BY EACH:', fields.buildingMonthlyRent || 'Not Applicable');
    this.drawBandhanRow('O.', 'GROSS AMOUNT RECEIVED FOR THE WHOLE PROPERTY:', fields.buildingGrossRent || 'Not Applicable');
    this.drawBandhanRow('P.', 'ARE ANY OF THE OCCUPANTS RELATED TO, OR CLOSE BUSINESS ASSOCIATES OF THE OWNER?:', fields.occupantsRelatedToOwner || 'Not Applicable');
    this.drawBandhanRow('Q.', 'FIXTURES (FANS, GEYSERS, COOKING RANGES) CHARGES BORNE BY OWNER:', fields.fixturesAmountRecovered || 'Borne by Owner');
    this.drawBandhanRow('R.', 'DETAILS OF WATER AND ELECTRICITY CHARGES BORNE BY OWNER:', fields.waterElectricityChargesBorneBy || 'Borne by Owner');
    this.drawBandhanRow('S.', 'IS ANY DISPUTE BETWEEN LANDLORD AND TENANT REGARDING RENT PENDING IN A COURT OF LAW?:', fields.isRentDisputePendingCourt || 'No');
    this.drawBandhanRow('T.', 'HAS ANY STANDARD RENT BEEN FIXED FOR THE PREMISES UNDER ANY LAW RELATING TO CONTROL OF RENT:', fields.hasStandardRentFixed || 'Not Applicable');
    this.drawBandhanRow('U.', 'HAS THE TENANT TO BEAR THE WHOLE OR PART OF THE COST OF REPAIRS AND MAINTENANCE?:', fields.tenantBearMaintenance || 'Not Applicable');
    this.drawBandhanRow('V.', 'IF A LIFT IS INSTALLED, WHO IS TO BEAR THE COST OF MAINTENANCE AND OPERATIONS-OWNER OR TENANT?:', fields.liftMaintenanceBorneBy || 'Not Applicable');
    this.drawBandhanRow('W.', 'IF A PUMP IS INSTALLED, WHO IS TO BEAR THE COST OF MAINTENANCE AND OPERATIONS-OWNER OR TENANT?:', fields.pumpMaintenanceBorneBy || 'Borne by Owner');
    this.drawBandhanRow('X.', 'WHO HAS TO BEAR THE COST OF ELECTRICITY CHARGES FOR LIGHTING OF COMMON SPACE?:', fields.commonElectricityBorneBy || 'Borne by Owner');
    this.drawBandhanRow('Y.', 'WHAT IS THE AMOUNT OF PROPERTY TAX? WHO IS TO BEAR IT?:', fields.propertyTaxAmountBorneBy || 'No such document is verified');
    this.drawBandhanRow('Z.', 'IS THE BUILDING INSURED? (POLICY NO., AMOUNT, RISKS, PREMIUM):', fields.isBuildingInsuredDetails || 'No such document is verified');
    this.drawBandhanRow('AA.', 'WHETHER UP TO DATE STATUTORY DUES SUCH AS PROPERTY TAX HAVE BEEN PAID:', fields.statutoryDuesPaid || 'No such document is verified');
    this.drawBandhanRow('AB.', 'WHETHER THE BUILDING IS HAVING FREE ACCESS:', fields.buildingFreeAccess || 'Yes');

    // 2. Technical Details of Building
    this.drawSectionSpanner('2. TECHNICAL DETAILS OF THE BUILDING:');
    this.drawBandhanRow('A.', 'NUMBER OF FLOORS & HEIGHT OF EACH FLOOR INCLUDING BASEMENTS, IF ANY:', fields.numberOfFloorsAndHeight || "G+3 Storied Building & Height: 10'-6\"");
    this.drawBandhanRow('A. (i)', 'GROUND FLOOR HEIGHT:', fields.floorHeightGF || "10'-6\"");
    this.drawBandhanRow('A. (ii)', 'FIRST FLOOR HEIGHT:', fields.floorHeightFF || 'Do');
    this.drawBandhanRow('A. (iii)', 'SECOND FLOOR HEIGHT:', fields.floorHeightSF || 'Do');
    this.drawBandhanRow('A. (iv)', 'THIRD FLOOR HEIGHT:', fields.floorHeightTF || 'Do');

    this.drawBandhanRow('B. (i)', 'PLINTH AREA FLOOR-WISE (GROUND FLOOR):', fields.plinthAreaGF || '');
    this.drawBandhanRow('B. (ii)', 'PLINTH AREA FLOOR-WISE (FIRST FLOOR):', fields.plinthAreaFF || '');
    this.drawBandhanRow('B. (iii)', 'PLINTH AREA FLOOR-WISE (SECOND FLOOR):', fields.plinthAreaSF || '');
    this.drawBandhanRow('B. (iv)', 'PLINTH AREA FLOOR-WISE (THIRD FLOOR):', fields.plinthAreaTF || '');

    this.drawBandhanRow('C. (i)', 'CONDITION OF THE BUILDING (EXTERIOR):', fields.buildingConditionExterior || 'Good');
    this.drawBandhanRow('C. (ii)', 'CONDITION OF THE BUILDING (INTERIOR):', fields.buildingConditionInterior || 'Good');
    this.drawBandhanRow('D.', 'TYPE OF FOUNDATIONS:', fields.foundationType || 'Column Foundation');

    this.drawBandhanRow('E. (i)', 'DOORS AND WINDOWS (GROUND FLOOR):', fields.doorsWindowsGF || 'Iron Shutter');
    this.drawBandhanRow('E. (ii)', 'DOORS AND WINDOWS (FIRST FLOOR):', fields.doorsWindowsFF || 'Sal wood choukath with non sal wood shutter');
    this.drawBandhanRow('E. (iii)', 'DOORS AND WINDOWS (SECOND FLOOR):', fields.doorsWindowsSF || 'Do');
    this.drawBandhanRow('E. (iv)', 'DOORS AND WINDOWS (THIRD FLOOR):', fields.doorsWindowsTF || 'Do');

    this.drawBandhanRow('F. (i)', 'FLOORING (GROUND FLOOR):', fields.flooringGF || 'VT Flooring');
    this.drawBandhanRow('F. (ii)', 'FLOORING (FIRST FLOOR):', fields.flooringFF || 'Do');
    this.drawBandhanRow('F. (iii)', 'FLOORING (SECOND FLOOR):', fields.flooringSF || 'Do');
    this.drawBandhanRow('F. (iv)', 'FLOORING (THIRD FLOOR):', fields.flooringTF || 'Do');

    this.drawBandhanRow('G. (i)', 'WALL FINISHING (GROUND FLOOR):', fields.wallFinishingGF || 'Cement Plastering, Putty, Painting');
    this.drawBandhanRow('G. (ii)', 'WALL FINISHING (FIRST FLOOR):', fields.wallFinishingFF || 'Do');
    this.drawBandhanRow('G. (iii)', 'WALL FINISHING (SECOND FLOOR):', fields.wallFinishingSF || 'Do');
    this.drawBandhanRow('G. (iv)', 'WALL FINISHING (THIRD FLOOR):', fields.wallFinishingTF || 'Do');

    // 3. Construction Specifications
    this.drawSectionSpanner('3. SPECIFICATIONS OF CONSTRUCTION (FLOOR-WISE) IN RESPECT OF:');
    this.drawBandhanRow('A.', 'FOUNDATION:', fields.specFoundation || 'Column Foundation');
    this.drawBandhanRow('B.', 'BASEMENT:', fields.specBasement || 'No');
    this.drawBandhanRow('C.', 'SUPERSTRUCTURE:', fields.specSuperstructure || 'Brick Masonry Super Structure');
    this.drawBandhanRow('D.', 'JOINERY/DOORS & WINDOWS:', fields.specJoineryDoorsWindows || 'Sal wood choukath with non sal wood shutter');
    this.drawBandhanRow('E.', 'RCC WORKS:', fields.specRccWorks || 'Lintel, Chajja, Beam');
    this.drawBandhanRow('F.', 'PLASTERING:', fields.specPlastering || 'Cement Plastering');
    this.drawBandhanRow('G.', 'FLOORING, SKIRTING, DADOING:', fields.specFlooringSkirting || 'VT Flooring');
    this.drawBandhanRow('H.', 'SPECIAL FINISHING (MARBLE, GRANITE, WOODEN PANELING, GRILLS):', fields.specSpecialFinishing || 'Yes');
    this.drawBandhanRow('I.', 'ROOFING INCLUDING WEATHER PROOF COURSE:', fields.specRoofing || 'RCC Roof');
    this.drawBandhanRow('J.', 'DRAINAGE:', fields.specDrainage || 'Surface Drainage');
    this.drawBandhanRow('K.', 'SPECIAL ARCHITECTURAL OR DECORATIVE FEATURES:', fields.specDecorativeFeatures || 'Interior work is done on Second & Third Floor');
    this.drawBandhanRow('L.', 'INTERNAL WIRING - (CONCEALED / EXTERNAL):', fields.specInternalWiring || 'Concealed');
    this.drawBandhanRow('L. (i)', 'CLASS OF FITTINGS: SUPERIOR/ORDINARY:', fields.specWiringFittingsClass || 'Superior');
    this.drawBandhanRow('M.', 'SANITARY INSTALLATION:', fields.specSanitaryInstallation || 'Yes');
    this.drawBandhanRow('N.', 'NO. OF GEYSERS:', fields.specNoOfGeysers || 'Not Verified');
    this.drawBandhanRow('O.', 'CLASS OF FITTING: SUPERIOR / ORDINARY:', fields.specSanitaryFittingsClass || 'Superior');
    this.drawBandhanRow('P.', 'COMPOUND WALL (HEIGHT, LENGTH, TYPE):', fields.specCompoundWall || 'No');
    this.drawBandhanRow('Q.', 'NO OF LIFTS AND CAPACITY:', fields.specLiftsCapacity || 'No');
    this.drawBandhanRow('R.', 'UNDERGROUND SUMP -CAPACITY AND TYPE OF CONSTRUCTION:', fields.specUndergroundSump || 'Not Available');
    this.drawBandhanRow('S.', 'OVERHEAD TANK (LOCATION & CAPACITY):', fields.specOverheadTank || 'Yes, On the top of the roof, 2000 Liters');
    this.drawBandhanRow('T.', 'PUMPS - NO. AND THEIR HORSE POWER:', fields.specPumpsHp || '1 Nos & 1 HP Pump');
    this.drawBandhanRow('U.', 'ROADS AND PAVING WITHIN THE COMPOUND:', fields.specRoadsPavingCompound || 'No');
    this.drawBandhanRow('V.', 'SEWAGE DISPOSAL (PUBLIC SEWERS / SEPTIC TANK):', fields.specSewageDisposal || 'Connected to Public Sewers');
    this.drawBandhanRow('W.', 'QUALITY / CLASS OF CONSTRUCTION:', fields.specQualityClassConstruction || 'Good');

    // 4. Details of Building Valuation Table
    this.renderBuildingValuationTable(fields);

    // 5. Sub-Schedules (5.1 Extra Items, 5.2 Amenities, 5.3 Misc, 5.4 Services)
    this.renderSubSchedules(fields);
  }

  // --------------------------------------------------------------------------
  // Helper: Building Valuation Table (8 columns)
  // --------------------------------------------------------------------------
  private renderBuildingValuationTable(fields: BandhanSMEReportFields): void {
    const rows = (fields.buildingValuationRows && fields.buildingValuationRows.length > 0)
      ? fields.buildingValuationRows
      : [
          {
            description: 'RESIDENTIAL & COMMERCIAL G+3 BUILDING',
            plinthArea: '8624.00',
            height: "10'-6\"",
            age: '3 Yrs',
            replacementRate: 'Rs. 2,500.00',
            replacementCost: 'Rs. 2,15,60,000.00',
            depreciation: 'Rs. 10,78,000.00',
            valueAfterDepreciation: 'Rs. 2,04,82,000.00',
          },
        ];

    this.cursorY += 8;
    this.drawSectionSpanner('3. DETAILS OF VALUATION:');

    // 8-Col Header: Desc (125) | Plinth (48) | Ht (40) | Age (35) | Rate (55) | Cost (72) | Dep (68) | Net (77) = 520
    const colW = [125, 48, 40, 35, 55, 72, 68, 77];
    const headers = ['DESCRIPTION OF ITEMS', 'PLINTH (SFT)', 'HEIGHT', 'AGE (YRS)', 'REPL. RATE', 'REPL. COST', 'DEP. AMT', 'VALUE AFTER DEP.'];

    const rowH = 22;
    this.checkPageBreak(rowH);

    let curX = MARGIN_L;
    for (let i = 0; i < headers.length; i++) {
      this.drawCell(curX, this.cursorY, colW[i], rowH, headers[i], {
        bold: true,
        fontSize: 7,
        align: 'center',
        vAlign: 'middle',
        fillColor: LBL_BG,
      });
      curX += colW[i];
    }
    this.cursorY += rowH;

    // Data rows
    for (const r of rows) {
      const rH = 20;
      this.checkPageBreak(rH);

      const values = [r.description, r.plinthArea, r.height, r.age, r.replacementRate, r.replacementCost, r.depreciation, r.valueAfterDepreciation];
      let rx = MARGIN_L;

      for (let i = 0; i < values.length; i++) {
        this.drawCell(rx, this.cursorY, colW[i], rH, values[i] || '-', {
          bold: i === 7,
          fontSize: 7.5,
          align: i === 0 ? 'left' : 'center',
          vAlign: 'middle',
        });
        rx += colW[i];
      }
      this.cursorY += rH;
    }
  }

  // --------------------------------------------------------------------------
  // Helper: 4 Building Sub-Schedules (5.1 Extra Items, 5.2 Amenities, 5.3 Misc, 5.4 Services)
  // --------------------------------------------------------------------------
  private renderSubSchedules(fields: BandhanSMEReportFields): void {
    const renderSchedule = (title: string, isNA: boolean | undefined, items: BandhanSMESubScheduleItem[] | undefined, total: string | undefined) => {
      this.cursorY += 4;
      this.drawSectionSpanner(title, isNA ? 'Status: Not Applicable' : undefined);

      if (isNA || !items || items.length === 0) {
        this.draw2ColRow('TOTAL:', total || 'Rs. 0.00', true, true, '#f8fafc');
        return;
      }

      for (const it of items) {
        this.draw2ColRow(it.name, it.cost || 'Rs. 0.00', true, false);
      }
      this.draw2ColRow('TOTAL:', total || 'Rs. 0.00', true, true, '#f1f5f9');
    };

    renderSchedule('5.1 EXTRA ITEMS', fields.isExtraItemsNA, fields.extraItems, fields.extraItemsTotal);
    renderSchedule('5.2 AMENITIES', fields.isAmenitiesNA, fields.amenities, fields.amenitiesTotal);
    renderSchedule('5.3 MISCELLANEOUS', fields.isMiscNA, fields.miscItems, fields.miscItemsTotal);
    renderSchedule('5.4 SERVICES', fields.isServicesNA, fields.servicesItems, fields.servicesItemsTotal);
  }

  // ==========================================================================
  // 4. SECTION 6.0: TOTAL ABSTRACT OF THE ENTIRE PROPERTY & OPINION
  // ==========================================================================
  private renderTotalAbstractAndOpinionSection(fields: BandhanSMEReportFields): void {
    this.cursorY += 8;
    this.drawSectionSpanner('6.0. TOTAL ABSTRACT OF THE ENTIRE PROPERTY:');

    // 5-Col Table: Particulars (140) | Govt Value (95) | Market Value (95) | Realizable 95% (95) | Distress 85% (95) = 520
    const colW = [140, 95, 95, 95, 95];
    const headers = ['PARTICULARS', 'GOVT. VALUE IN RS.', 'MARKET VALUE IN RS.', 'REALIZABLE VALUE (95%)', 'DISTRESS VALUE (85%)'];

    const rowH = 22;
    this.checkPageBreak(rowH);

    let curX = MARGIN_L;
    for (let i = 0; i < headers.length; i++) {
      this.drawCell(curX, this.cursorY, colW[i], rowH, headers[i], {
        bold: true,
        fontSize: 7.5,
        align: 'center',
        vAlign: 'middle',
        fillColor: LBL_BG,
      });
      curX += colW[i];
    }
    this.cursorY += rowH;

    // Abstract rows
    const abstractRows = [
      { name: 'LAND', govt: fields.abstractGovtLand, mkt: fields.abstractMarketLand, real: fields.abstractRealLand, dist: fields.abstractDistressLand },
      { name: 'BUILDING', govt: fields.abstractGovtBuilding || 'Rs. 0.00', mkt: fields.abstractMarketBuilding, real: fields.abstractRealBuilding, dist: fields.abstractDistressBuilding },
      { name: 'EXTRA ITEMS', govt: fields.abstractGovtExtra || 'Rs. 0.00', mkt: fields.abstractMarketExtra || 'Rs. 0.00', real: fields.abstractRealExtra || 'Rs. 0.00', dist: fields.abstractDistressExtra || 'Rs. 0.00' },
      { name: 'AMENITIES', govt: fields.abstractGovtAmenities || 'Rs. 0.00', mkt: fields.abstractMarketAmenities || 'Rs. 0.00', real: fields.abstractRealAmenities || 'Rs. 0.00', dist: fields.abstractDistressAmenities || 'Rs. 0.00' },
      { name: 'MISCELLANEOUS', govt: fields.abstractGovtMisc || 'Rs. 0.00', mkt: fields.abstractMarketMisc || 'Rs. 0.00', real: fields.abstractRealMisc || 'Rs. 0.00', dist: fields.abstractDistressMisc || 'Rs. 0.00' },
      { name: 'SERVICES', govt: fields.abstractGovtServices || 'Rs. 0.00', mkt: fields.abstractMarketServices || 'Rs. 0.00', real: fields.abstractRealServices || 'Rs. 0.00', dist: fields.abstractDistressServices || 'Rs. 0.00' },
      { name: 'TOTAL', govt: fields.abstractGovtTotal, mkt: fields.abstractMarketTotal, real: fields.abstractRealTotal, dist: fields.abstractDistressTotal, isTotal: true },
      { name: 'OR SAY', govt: fields.abstractGovtSay, mkt: fields.abstractMarketSay, real: fields.abstractRealSay, dist: fields.abstractDistressSay, isTotal: true },
    ];

    for (const ar of abstractRows) {
      const rH = 18;
      this.checkPageBreak(rH);

      let rx = MARGIN_L;
      const values = [ar.name, ar.govt || 'Rs. 0.00', ar.mkt || 'Rs. 0.00', ar.real || 'Rs. 0.00', ar.dist || 'Rs. 0.00'];

      for (let i = 0; i < values.length; i++) {
        this.drawCell(rx, this.cursorY, colW[i], rH, values[i], {
          bold: ar.isTotal,
          fontSize: 8,
          align: i === 0 ? 'left' : 'center',
          vAlign: 'middle',
          fillColor: ar.isTotal ? LBL_BG : undefined,
        });
        rx += colW[i];
      }
      this.cursorY += rH;
    }

    // Remarks Box
    if (fields.valuationRemarksBox) {
      this.cursorY += 8;
      this.drawSectionSpanner('REMARKS:');
      const rH = this.cellHeight(fields.valuationRemarksBox, CONTENT_W, { fontSize: 8.5 });
      const boxH = Math.max(24, rH + 6);
      this.checkPageBreak(boxH);

      this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, boxH, fields.valuationRemarksBox, {
        fontSize: 8.5,
        align: 'left',
        vAlign: 'top',
      });
      this.cursorY += boxH;
    }

    // Basis of Valuation & Opinion Paragraph
    this.cursorY += 8;
    this.drawSectionSpanner('BASIS OF VALUATION:', fields.basisOfValuationStatement || '(LAND & BUILDING METHOD OF VALUATION HAS BEEN ADOPTED FOR FINDING THE FAIR MARKET VALUE OF THE PROPERTY)');

    const opinionPara = `As a result of my appraisal and analysis, it is my considered opinion that the present Fair Market Value of the above property in the prevailing condition with aforesaid specifications is ${fields.fairMarketValue || 'Rs. 0/-'} (${fields.fairMarketValueWords || 'Rupees Zero Only'}). The Realizable Value is ${fields.realisableValue || 'Rs. 0/-'} (${fields.realisableValueWords || 'Rupees Zero Only'}). The book value of the above property as of Land is ${fields.bookValueOfLand || 'Rs. 0/-'} (${fields.bookValueOfLandWords || 'Rupees Zero Only'}) and the Distress Value ${fields.distressValue || 'Rs. 0/-'} (${fields.distressValueWords || 'Rupees Zero Only'}) And Insurable Value of the Property is ${fields.insurableValueOfProperty || 'Rs. 0/-'}.`;

    const opH = this.cellHeight(opinionPara, CONTENT_W, { fontSize: 9 });
    const fullOpH = Math.max(30, opH + 8);
    this.checkPageBreak(fullOpH);

    this.drawCell(MARGIN_L, this.cursorY, CONTENT_W, fullOpH, opinionPara, {
      fontSize: 9,
      align: 'left',
      vAlign: 'top',
      fillColor: OPT_BG,
    });
    this.cursorY += fullOpH;
  }

  // ==========================================================================
  // 5. DECLARATION & SIGN-OFF BLOCK
  // ==========================================================================
  private renderDeclarationAndSignoffSection(fields: BandhanSMEReportFields): void {
    this.cursorY += 8;
    this.drawSectionSpanner('DECLARATION: I / WE HEREBY DECLARE THAT:');

    const defaultDeclarations = [
      'A. THE INFORMATION FURNISHED ABOVE IS TRUE TO THE BEST OF MY / OUR KNOWLEDGE AND BELIEF.',
      'B. NEITHER ME/WE NOR MY/ OUR ASSOCIATE HAVE ANY DIRECT OR INDIRECT INTEREST IN THE ADVANCE OR ASSETS VALUED.',
      'C. I/WE ARE NEITHER RELATED TO THE OWNER OF THE PROPERTY WHICH IS BEING VALUED NOR THE OFFICIALS OF THE BRANCH FROM WHICH THE BORROWER PROPOSES TO MORTGAGE THE PROPERTY BEING VALUED / ALREADY MORTGAGED TO THE BRANCH.',
      `D. THE PROPERTY WAS PHYSICALLY INSPECTED BY ME/US ON ${fields.dateOfVisit || fields.reportDate || 'THE INSPECTION DATE'} ALONG WITH (NAME OF THE BANK OFFICIAL ACCOMPANIED, IF ANY).`,
      'E. THE TITLE DEED (S) OF THE PROPERTY UNDER VALUATION IS AVAILABLE WITH THE BANK.',
      'F. THE PROPERTY IS IDENTIFIED BY DOCUMENTS & HELP OF CUSTOMER.',
      'G. THIS VALUATION IS PREPARED WITHOUT ANY PREJUDICE OR BIAS TO ANY PERSON OR INSTITUTION.',
      'H. THIS REPORT IS PREPARED BASED ON AVAILABLE DOCUMENTS DURING MY/OUR VISIT TO THE SITE AND DISCUSSIONS MADE WITH THE OWNER OF THE PROPERTY.',
      'I. THE LEGAL ASPECTS ARE NOT CONSIDERED IN THIS VALUATION.',
      'J. THE VALUE OF LAND IS TAKEN INTO ACCOUNT BY MAKING DUE ENQUIRIES IN THE LOCALITY AND ASCERTAINING THE SALES VALUE OF THE PROPERTIES IN THE LOCALITY.',
      'K. ANY ADDITIONS / ALTERATIONS MADE TO THE PROPERTY AFTER THE DATE OF VALUATIONS SHALL NOT FALL UNDER THE SCOPE OF THIS REPORT.',
      'L. WE ARE NEITHER THE AUDITORS TO THE OWNER OF THE PROPERTY (IES) NOR THEIR FIRMS, ASSOCIATES NOR ARE WE THE STATUTORY AUDITORS TO THE BRANCH FROM WHICH THE LOAN IS PROPOSED TO BE AVAILED / ALREADY AVAILED.',
      `M. IT IS HEREBY CERTIFIED THAT THE PRESENT MARKET VALUE OF THE ABOVE PROPERTY IS, IN MY OPINION/OUR OPINION ${fields.fairMarketValue || 'Rs.0/-'} AND THE ESTIMATED REALIZABLE VALUE UNDER DISTRESS SALE WILL BE ${fields.distressValue || 'Rs.0/-'}.`,
      'N. I HAVE NOT BEEN DISMISSED OR REMOVED FROM GOVT. SERVICE OR CONVICTED OF AN OFFENCE CONNECTED WITH ANY PROCEEDINGS OF INCOME TAX ACT, WEALTH TAX ACT OR GIFT TAX ACT OR HAVE BEEN BLACKLISTED BY ANY BANK/FINANCIAL INSTITUTION/ GOVT. DEPARTMENT/PUBLIC SECTOR ENTERPRISE/BODY CORPORATE ETC.',
      `O. THIS VALUATION REPORT CONTAINS ${fields.reportPagesCount || '26'} PAGES ONLY.`,
      `P. NAME OF SITE ENGINEER: ${fields.siteEngineerName || 'MR. SIBA BEHERA'}`,
      'Q. PHOTOGRAPHS OF THE ASSET VALUED ENCLOSED.',
    ];

    const decls = (fields.declarationItems && fields.declarationItems.length > 0) ? fields.declarationItems : defaultDeclarations;

    for (const d of decls) {
      const dH = this.cellHeight(d, CONTENT_W - 12, { fontSize: 8 });
      const rowH = Math.max(14, dH + 2);
      this.checkPageBreak(rowH);

      const y = this.pdfY(this.cursorY);
      this.page.drawText(this.sanitizeText(d), {
        x: MARGIN_L + 6,
        y: y - 10,
        size: 8,
        font: this.fontRegular,
        color: rgb(0, 0, 0),
      });
      this.cursorY += rowH;
    }

    // Valuer Sign-off Box
    this.cursorY += 12;
    const signBoxH = 80;
    this.checkPageBreak(signBoxH + 10);

    const sY = this.pdfY(this.cursorY);
    this.page.drawRectangle({
      x: MARGIN_L,
      y: sY - signBoxH,
      width: CONTENT_W,
      height: signBoxH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    this.page.drawText('SIGNATURE OF EMPANELLED VALUER:', { x: MARGIN_L + 8, y: sY - 14, size: 8.5, font: this.fontBold, color: rgb(0, 0, 0) });
    this.page.drawText(`NAME OF THE EMPANELLED VALUER: ${fields.empanelledValuerName || 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)'}`, { x: MARGIN_L + 8, y: sY - 26, size: 8, font: this.fontBold, color: rgb(0, 0, 0) });
    this.page.drawText(`EDUCATIONAL / PROFESSIONAL QUALIFICATION: ${fields.valuerQualifications || 'B.Tech (Civil), M.Val (RE)'}`, { x: MARGIN_L + 8, y: sY - 38, size: 7.5, font: this.fontRegular, color: rgb(0, 0, 0) });
    this.page.drawText(`REGD. VALUER OF INSTITUTION OF VALUERS: ${fields.valuerIovRegNo || 'No. F-26377'}`, { x: MARGIN_L + 8, y: sY - 50, size: 7.5, font: this.fontRegular, color: rgb(0, 0, 0) });
    this.page.drawText(`REGD. VALUER UNDER SECTION 34AB OF WEALTH TAX ACT: ${fields.valuerWealthTaxRegNo || 'Regd. No.-107/2016-17, Cat -I'}`, { x: MARGIN_L + 8, y: sY - 62, size: 7.5, font: this.fontRegular, color: rgb(0, 0, 0) });
    this.page.drawText(`DATE: ${fields.declarationDate || fields.reportDate || formatReportDate(new Date())}`, { x: MARGIN_L + 8, y: sY - 74, size: 7.5, font: this.fontBold, color: rgb(0, 0, 0) });

    this.cursorY += signBoxH;
  }

  // ==========================================================================
  // 6. VALUATION REPORT CHECK-LIST
  // ==========================================================================
  private renderChecklistSection(fields: BandhanSMEReportFields): void {
    this.cursorY += 10;
    this.drawSectionSpanner('Valuation report check-list', 'Please ensure that the following important points are in order in the submitted report. [Put tick/cross]');

    const defaultChecklist: BandhanSMEChecklistItem[] = [
      { pointNo: 1, question: 'Full names of all property owners are mentioned. Address of the property is mentioned and is same as latest title deed', answer: 'Yes' },
      { pointNo: 2, question: 'Boundaries of the property are mentioned as per both, title deed and actual observations', answer: 'Yes' },
      { pointNo: 3, question: 'Clearly mentioned that property has been identified by the valuer on his own based on the address', answer: 'Yes' },
      { pointNo: 4, question: 'Type of property is clearly mentioned (amongst agricultural, residential, commercial, industrial etc.)', answer: 'Yes' },
      { pointNo: 5, question: 'If land, clearly mentioned whether the land is land locked plot or independent land', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
      { pointNo: 6, question: 'If vacant land, clearly mentioned that proper demarcation and fencing has been done', answer: 'Yes' },
      { pointNo: 7, question: 'If building, clearly mentioned that construction has been done according to the building plan approval', subText: '(If not, deviation should be clearly specified)', answer: 'No' },
      { pointNo: 8, question: 'If building, clearly mentioned that building use / completion certificate has been obtained from competent authority', answer: 'No' },
      { pointNo: 9, question: 'Clearly mentioned whether access to the property is available', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
      { pointNo: 10, question: 'Basis for arriving at government value has been mentioned and necessary documents have been enclosed', answer: 'Yes' },
    ];

    const items = (fields.checklist && fields.checklist.length > 0) ? fields.checklist : defaultChecklist;

    for (const item of items) {
      const qText = `${item.pointNo}. ${item.question} ${item.subText ? item.subText : ''}`;
      const qW = CONTENT_W - 50;
      const hQ = this.cellHeight(qText, qW, { fontSize: 8 });
      const rowH = Math.max(20, hQ + 4);

      this.checkPageBreak(rowH);

      this.drawCell(MARGIN_L, this.cursorY, qW, rowH, qText, {
        fontSize: 8,
        align: 'left',
        vAlign: 'middle',
      });

      this.drawCell(MARGIN_L + qW, this.cursorY, 50, rowH, item.answer || 'Yes', {
        bold: true,
        fontSize: 8.5,
        align: 'center',
        vAlign: 'middle',
      });

      this.cursorY += rowH;
    }
  }

  // ==========================================================================
  // 7. ENCLOSURES ENGINE
  // Order: Documents -> Maps (line break, no page break) -> Photos (fresh page)
  // ==========================================================================
  private async renderEnclosures(fields: BandhanSMEReportFields): Promise<void> {
    // ── 1. Section: Documents (Unified Document Uploads) ──
    const docImages: string[] = fields.documentImages || [];
    const docNames: string[] = fields.documentImageNames || [];
    const validDocs = docImages.filter(u => Boolean(u && u.trim()));

    if (validDocs.length > 0) {
      const docBytesList: { bytes: Uint8Array; caption?: string }[] = [];
      for (let i = 0; i < validDocs.length; i++) {
        const b = await fetchBytes(validDocs[i]);
        if (b && b.length > 0) {
          const rawName = docNames[i];
          const caption = (rawName !== undefined && rawName !== null && rawName.trim() !== '') ? rawName.trim() : '';
          docBytesList.push({ bytes: b, caption });
        }
      }

      if (docBytesList.length > 0) {
        await this.drawDocumentsGallery(docBytesList, 'ENCLOSURE: DOCUMENTS', 240, false);
      }
    }

    // ── 2. Section: Maps & Documents (Chronological Order) ──
    // Continues with line break, no page break after documents
    const mapCategories: { title: string; urls: string[] }[] = [
      {
        title: 'Google Satellite Map',
        urls: (fields.locationMapImages && fields.locationMapImages.length > 0)
          ? fields.locationMapImages
          : (fields.locationMapImageUrl ? [fields.locationMapImageUrl] : []),
      },
      {
        title: 'Mouza Map (Bhulekh / Revenue Map)',
        urls: (fields.mouzaMapImages && fields.mouzaMapImages.length > 0)
          ? fields.mouzaMapImages
          : (fields.rorImageUrl ? [fields.rorImageUrl] : []),
      },
      {
        title: 'Sketch Map (Demarcation / Hand-Drawn)',
        urls: (fields.sketchMapImages && fields.sketchMapImages.length > 0)
          ? fields.sketchMapImages
          : (fields.guidelineValueImageUrl ? [fields.guidelineValueImageUrl] : []),
      },
      {
        title: 'Cadastral Map (Bhu Naksha)',
        urls: (fields.cadastralMapImages && fields.cadastralMapImages.length > 0)
          ? fields.cadastralMapImages
          : (fields.bhuNakshaImageUrl ? [fields.bhuNakshaImageUrl] : []),
      },
      {
        title: 'BDA MAP',
        urls: fields.bdaMapImages || [],
      },
      {
        title: 'BENCHMARK VALUATION',
        urls: fields.benchmarkMapImages || [],
      },
    ];

    for (const cat of mapCategories) {
      const validUrls = cat.urls.filter(u => Boolean(u && u.trim()));
      if (validUrls.length === 0) continue;

      const imgBytesList: { bytes: Uint8Array; caption?: string }[] = [];
      for (const u of validUrls) {
        const b = await fetchBytes(u);
        if (b && b.length > 0) {
          imgBytesList.push({ bytes: b });
        }
      }

      if (imgBytesList.length > 0) {
        await this.drawMapGallery(imgBytesList, cat.title, 240, false);
      }
    }

    // ── 3. Section: Property Photographs (Fresh Page) ──
    const photos: BandhanSMEPhoto[] = (fields.propertyPhotos && fields.propertyPhotos.length > 0)
      ? fields.propertyPhotos
      : (fields.propertyImages || []).map((url: string, i: number) => ({
          url,
          caption: fields.propertyImageNames?.[i] || `Photograph ${i + 1}`,
        }));

    const validPhotos = photos.filter(p => Boolean(p.url && p.url.trim()));
    if (validPhotos.length > 0) {
      this.addPage();
      this.drawSectionSpanner('PHOTOGRAPHS OF THE ASSET VALUED');
      await this.drawBandhanPhotoGrid(validPhotos);
    }
  }

  // --------------------------------------------------------------------------
  // Helper: Draw full-width single image
  // --------------------------------------------------------------------------
  private async drawDocImage(url: string, maxW: number, maxH: number): Promise<void> {
    const img = await this.embedImgFromUrl(url);
    if (!img) return;

    const scale = Math.min(maxW / img.width, maxH / img.height, 1);
    const drawW = img.width * scale;
    const drawH = img.height * scale;

    this.checkPageBreak(drawH);
    const yPos = this.pdfY(this.cursorY);
    this.page.drawImage(img, {
      x: MARGIN_L + (maxW - drawW) / 2,
      y: yPos - drawH,
      width: drawW,
      height: drawH,
    });
    this.cursorY += drawH + 10;
  }

  // --------------------------------------------------------------------------
  // Helper: Draw 2-column photo grid with GPS badges
  // --------------------------------------------------------------------------
  private async drawBandhanPhotoGrid(photos: BandhanSMEPhoto[]): Promise<void> {
    const photoW = (CONTENT_W - 12) / 2; // ~237.64 pt
    const photoH = 170;

    for (let i = 0; i < photos.length; i += 2) {
      this.checkPageBreak(photoH + 20);

      const p1 = photos[i];
      const p2 = photos[i + 1];

      await this.drawSinglePhotoWithGPS(p1, MARGIN_L, this.cursorY, photoW, photoH);

      if (p2) {
        await this.drawSinglePhotoWithGPS(p2, MARGIN_L + photoW + 12, this.cursorY, photoW, photoH);
      }

      this.cursorY += photoH + 12;
    }
  }

  private async drawSinglePhotoWithGPS(
    photo: BandhanSMEPhoto,
    x: number,
    y: number,
    w: number,
    h: number
  ): Promise<void> {
    if (!photo || !photo.url) return;
    const img = await this.embedImgFromUrl(photo.url);
    if (!img) return;

    const yPos = this.pdfY(y);

    this.page.drawImage(img, {
      x,
      y: yPos - h,
      width: w,
      height: h,
    });

    const stampText = photo.caption || photo.gps || photo.timestamp || '';
    if (stampText) {
      const badgeH = 18;
      this.page.drawRectangle({
        x,
        y: yPos - h,
        width: w,
        height: badgeH,
        color: rgb(0, 0, 0),
        opacity: 0.65,
      });

      this.page.drawText(this.sanitizeText(stampText), {
        x: x + 4,
        y: yPos - h + 5,
        size: 8,
        font: this.fontRegular,
        color: rgb(1, 1, 1),
      });
    }
  }
}

/**
 * Factory function for Bandhan Bank SME PDF Generation
 */
export async function generateBandhanSMEReport(fields: BandhanSMEReportFields): Promise<Uint8Array> {
  const renderer = new PDFBandhanSMERenderer();
  return await renderer.generateBandhanSMEReport(fields);
}
