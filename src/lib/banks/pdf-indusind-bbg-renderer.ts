import { PDFBankRenderer } from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import {
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFIndusIndBBGRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode?: string;

  constructor(opts: any = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode;
  }

  private getF(key: string, defaultVal: any = ''): any {
    return this.fields[key] ?? defaultVal;
  }

  async render(): Promise<Uint8Array> {
    await this.init();
    await this.drawContent();
    return await this.save();
  }

  /** Section header matching the blue-banner styling of IndusInd BBG */
  private drawBBGSectionHeader(code: string, title: string) {
    const codeW = 28;
    const titleW = CONTENT_W - codeW;

    this.drawKeyValueRow([
      {
        label: code,
        value: '',
        labelWidth: codeW,
        valueWidth: 0,
        labelBold: true,
        highlight: true,
      },
      {
        label: title,
        value: '',
        labelWidth: titleW,
        valueWidth: 0,
        labelBold: true,
        highlight: true,
      },
    ]);
  }

  /** Standard numbered row under section */
  private drawBBGRow(num: string | number, label: string, value: string) {
    const numW = 28;
    const labelW = 220;
    const valW = CONTENT_W - numW - labelW;

    this.drawKeyValueRow([
      { label: String(num), value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label, value: '', labelWidth: labelW, valueWidth: 0 },
      { label: '', value: value || 'NA', labelWidth: 0, valueWidth: valW },
    ]);
  }

  async drawContent(): Promise<void> {
    // NOTE: init() already adds page 1. Do NOT call this.addPage() here.

    // Top Main Title
    this.drawCenteredTitle('VALUATION REPORT', 14, true);
    this.advanceCursor(4);
    this.drawCenteredTitle(
      'Subject : Valuation of property for ABG/BBG/CBG - IndusInd Bank',
      11,
      false
    );
    this.advanceCursor(6);

    // Ref No & Dated Row
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      {
        label: `Ref. No. : ${this.getF('indusBBGRefNo', this.projectCode || '')}`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: `DATED : ${this.getF('indusBBGReportDate', this.getF('valuationDate', ''))}`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
    ]);

    // ─────────────────────────────────────────────────────────────
    // A. GENERAL DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawBBGSectionHeader('A', 'GENERAL DETAILS');
    this.drawBBGRow(1, 'Name of the customer', this.getF('indusBBGCustomerName', this.getF('applicantName', '')));
    this.drawBBGRow(2, 'Request received from', this.getF('indusBBGRequestFrom', 'IndusInd Bank Ltd.'));
    this.drawBBGRow(3, 'Name of document holder (as per sale deed)', this.getF('indusBBGDocHolderName', this.getF('ownerName', '')));
    this.drawBBGRow(4, 'Property address (as per request)', this.getF('indusBBGAddressRequest', ''));
    this.drawBBGRow(5, 'Property address (on-site inspection)', this.getF('indusBBGAddressSite', this.getF('propertyAddress', '')));
    this.drawBBGRow(6, 'Property Legal address (as per docs)', this.getF('indusBBGAddressLegal', ''));
    this.drawBBGRow(7, 'Google Coordinates', this.getF('indusBBGCoordinates', ''));
    this.drawBBGRow('7b', 'Landmark', this.getF('indusBBGLandmark', this.getF('landmark', '')));
    this.drawBBGRow(8, 'Date of inspection', this.getF('indusBBGInspectionDate', this.getF('inspectionDate', '')));

    // ─────────────────────────────────────────────────────────────
    // B. SURROUNDING LOCALITY DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawBBGSectionHeader('B', 'SURROUNDING LOCALITY DETAILS');
    this.drawBBGRow(1, 'Ward no./Municipal land no.', this.getF('indusBBGWardNo', ''));
    this.drawBBGRow(2, 'Vicinity', this.getF('indusBBGVicinity', ''));
    this.drawBBGRow(3, 'Classification of locality', this.getF('indusBBGLocalityClass', 'Middle Class'));

    // 4. Proximity to civic amenities table
    const numW = 28;
    const labelW = 220;
    const valW = CONTENT_W - numW - labelW;
    const amenities = this.getF('indusBBGAmenitiesList', ['Railway Station / Bus Stand', 'Hospital / Clinic', 'School / College', 'Market / Commercial Hub']);
    for (let i = 0; i < amenities.length; i++) {
      this.drawKeyValueRow([
        { label: i === 0 ? '4' : '', value: '', labelWidth: numW, valueWidth: 0, labelBold: i === 0 },
        { label: i === 0 ? 'Proximity to civic amenities' : '', value: '', labelWidth: labelW, valueWidth: 0 },
        { label: '', value: `: ${amenities[i]}`, labelWidth: 0, valueWidth: valW },
      ]);
    }

    this.drawBBGRow(5, 'Condition of approach road', this.getF('indusBBGApproachRoad', 'Good & Motorable'));
    this.drawBBGRow(6, 'Plot demarcated at site (Yes/No)', this.getF('indusBBGPlotDemarcated', 'Yes'));

    // Boundaries Grid
    const bSubW = (CONTENT_W - numW - labelW) / 2;
    this.drawKeyValueRow([
      { label: '7', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Boundaries as per document', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: '', value: `North: ${this.getF('indusBBGBoundaryDocNorth', '')}`, labelWidth: 0, valueWidth: bSubW, highlight: true },
      { label: '', value: `South: ${this.getF('indusBBGBoundaryDocSouth', '')}`, labelWidth: 0, valueWidth: bSubW, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: '', value: `East: ${this.getF('indusBBGBoundaryDocEast', '')}`, labelWidth: 0, valueWidth: bSubW, highlight: true },
      { label: '', value: `West: ${this.getF('indusBBGBoundaryDocWest', '')}`, labelWidth: 0, valueWidth: bSubW, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: '8', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Boundaries as per site', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: '', value: `North: ${this.getF('indusBBGBoundarySiteNorth', '')}`, labelWidth: 0, valueWidth: bSubW, highlight: true },
      { label: '', value: `South: ${this.getF('indusBBGBoundarySiteSouth', '')}`, labelWidth: 0, valueWidth: bSubW, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: '', value: `East: ${this.getF('indusBBGBoundarySiteEast', '')}`, labelWidth: 0, valueWidth: bSubW, highlight: true },
      { label: '', value: `West: ${this.getF('indusBBGBoundarySiteWest', '')}`, labelWidth: 0, valueWidth: bSubW, highlight: true },
    ]);

    this.drawBBGRow(9, 'Boundaries Matching (Yes/No)', this.getF('indusBBGBoundariesMatching', 'Yes'));
    this.drawBBGRow(10, 'Property identified through', this.getF('indusBBGPropertyIdentified', 'Surrounding boundaries and customer presence'));

    // ─────────────────────────────────────────────────────────────
    // C. PROPERTY DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawBBGSectionHeader('C', 'PROPERTY DETAILS');
    this.drawBBGRow(1, 'Description of property', this.getF('indusBBGPropertyDesc', ''));
    this.drawBBGRow(2, 'Type of property', this.getF('indusBBGTypeOfProperty', 'Residential / Commercial'));

    // 3. Usage & 4. Accommodation sub-tables
    const floorList = [
      { name: 'Basement', usageKey: 'indusBBGUsage_BF', accKey: 'indusBBGAcc_BF' },
      { name: 'GF', usageKey: 'indusBBGUsage_GF', accKey: 'indusBBGAcc_GF' },
      { name: 'FF', usageKey: 'indusBBGUsage_FF', accKey: 'indusBBGAcc_FF' },
      { name: 'SF', usageKey: 'indusBBGUsage_SF', accKey: 'indusBBGAcc_SF' },
    ];

    for (let i = 0; i < floorList.length; i++) {
      this.drawKeyValueRow([
        { label: i === 0 ? '3' : '', value: '', labelWidth: numW, valueWidth: 0, labelBold: i === 0 },
        { label: i === 0 ? 'Type of usage of entire property' : '', value: '', labelWidth: labelW, valueWidth: 0 },
        { label: floorList[i].name, value: '', labelWidth: 70, valueWidth: 0, highlight: true },
        { label: '', value: `: ${this.getF(floorList[i].usageKey, '')}`, labelWidth: 0, valueWidth: valW - 70 },
      ]);
    }

    for (let i = 0; i < floorList.length; i++) {
      this.drawKeyValueRow([
        { label: i === 0 ? '4' : '', value: '', labelWidth: numW, valueWidth: 0, labelBold: i === 0 },
        { label: i === 0 ? 'Accommodation details' : '', value: '', labelWidth: labelW, valueWidth: 0 },
        { label: floorList[i].name, value: '', labelWidth: 70, valueWidth: 0, highlight: true },
        { label: '', value: `: ${this.getF(floorList[i].accKey, '')}`, labelWidth: 0, valueWidth: valW - 70 },
      ]);
    }

    this.drawBBGRow(5, 'Additional amenities', this.getF('indusBBGAdditionalAmenities', ''));
    this.drawBBGRow(6, 'Area of property (actual)', this.getF('indusBBGAreaActual', ''));
    this.drawBBGRow(7, 'Carpet area (approx..)', this.getF('indusBBGCarpetArea', ''));
    this.drawBBGRow(8, 'Built up / saleable area', this.getF('indusBBGBuiltUpSaleableArea', ''));

    // 9. Permitted Area sub-table
    const permFloors = [
      { name: 'Basement', key: 'indusBBGPerm_BF' },
      { name: 'GF', key: 'indusBBGPerm_GF' },
      { name: 'FF', key: 'indusBBGPerm_FF' },
      { name: 'SF', key: 'indusBBGPerm_SF' },
      { name: 'TF', key: 'indusBBGPerm_TF' },
    ];
    for (let i = 0; i < permFloors.length; i++) {
      this.drawKeyValueRow([
        { label: i === 0 ? '9' : '', value: '', labelWidth: numW, valueWidth: 0, labelBold: i === 0 },
        { label: i === 0 ? 'Area of property (permitted as per approved plan/building byelaws)' : '', value: '', labelWidth: labelW, valueWidth: 0 },
        { label: permFloors[i].name, value: '', labelWidth: 70, valueWidth: 0, highlight: true },
        { label: '', value: `: ${this.getF(permFloors[i].key, '0.00 sqft')}`, labelWidth: 0, valueWidth: valW - 70 },
      ]);
    }
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: 'Total', value: '', labelWidth: 70, valueWidth: 0, labelBold: true, highlight: true },
      { label: '', value: `: ${this.getF('indusBBGPerm_Total', '0.00 sqft')}`, labelWidth: 0, valueWidth: valW - 70, valueBold: true },
    ]);

    this.drawBBGRow(10, 'Area as per sale Deed/Sale agreement', this.getF('indusBBGAreaSaleDeed', ''));
    this.drawBBGRow(11, 'Adherence to sanction plan', this.getF('indusBBGAdherenceSanctionPlan', 'Yes / Deviated'));

    // 12. Deviations Table
    this.drawKeyValueRow([
      { label: '12', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Deviation from sanction plan/building byelaws (if any)', value: '', labelWidth: CONTENT_W - numW, valueWidth: 0, labelBold: true },
    ]);

    const devH1 = 50;
    const devColW = (CONTENT_W - devH1) / 6;
    this.drawKeyValueRow([
      { label: 'Floor', value: '', labelWidth: devH1, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual area', value: '', labelWidth: devColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: '%', value: '', labelWidth: devColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Permissible area', value: '', labelWidth: devColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: '%', value: '', labelWidth: devColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Excess coverage', value: '', labelWidth: devColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: '%', value: '', labelWidth: devColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const devRows = this.getF('indusBBGDeviationRows', [
      { floor: 'BF', actual: '', actPct: '', perm: '', permPct: '', excess: '', excessPct: '' },
      { floor: 'GF', actual: '', actPct: '', perm: '', permPct: '', excess: '', excessPct: '' },
      { floor: 'FF', actual: '', actPct: '', perm: '', permPct: '', excess: '', excessPct: '' },
      { floor: 'SF', actual: '', actPct: '', perm: '', permPct: '', excess: '', excessPct: '' },
      { floor: 'TF', actual: '', actPct: '', perm: '', permPct: '', excess: '', excessPct: '' },
    ]);

    for (const dr of devRows) {
      this.drawKeyValueRow([
        { label: dr.floor, value: '', labelWidth: devH1, valueWidth: 0, labelBold: true },
        { label: '', value: dr.actual || '-', labelWidth: 0, valueWidth: devColW },
        { label: '', value: dr.actPct || '-', labelWidth: 0, valueWidth: devColW },
        { label: '', value: dr.perm || '-', labelWidth: 0, valueWidth: devColW },
        { label: '', value: dr.permPct || '-', labelWidth: 0, valueWidth: devColW },
        { label: '', value: dr.excess || '-', labelWidth: 0, valueWidth: devColW },
        { label: '', value: dr.excessPct || '-', labelWidth: 0, valueWidth: devColW },
      ]);
    }

    this.drawBBGRow(13, 'Risk of demolition (valuers views) (Low/High/Medium)', this.getF('indusBBGRiskDemolition', 'Low'));
    this.drawBBGRow(14, 'Property currently occupied by (owner/self/tenant/vacant)', this.getF('indusBBGOccupiedBy', 'Owner'));
    this.drawBBGRow(15, 'If occupied, then since ___ yrs', this.getF('indusBBGOccupiedSince', ''));

    // ─────────────────────────────────────────────────────────────
    // D. SUBJECT PROPERTY DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawBBGSectionHeader('D', 'SUBJECT PROPERTY DETAILS');
    this.drawBBGRow(1, 'Land freehold or leasehold', this.getF('indusBBGLandTenure', 'Freehold'));
    this.drawBBGRow(2, 'Approval for drawings / OC / ULC / FSI / TDR', this.getF('indusBBGDrawingApprovals', 'Approved as per BDA norms'));
    this.drawBBGRow(3, 'Name of the co-operative housing society:', this.getF('indusBBGSocietyName', 'NA'));
    this.drawBBGRow(4, 'Registration no. of society:', this.getF('indusBBGSocietyRegNo', 'NA'));
    this.drawBBGRow(5, 'No. of shares held and certificate no.:', this.getF('indusBBGSharesCertificateNo', 'NA'));
    this.drawBBGRow(6, 'Outgoes per month :', this.getF('indusBBGOutgoesPerMonth', 'NA'));

    // ─────────────────────────────────────────────────────────────
    // E. STRUCTURAL DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawBBGSectionHeader('E', 'STRUCTURAL DETAILS');
    this.drawBBGRow(1, 'Type of structure', this.getF('indusBBGStructureType', 'RCC Framed'));
    this.drawBBGRow(2, 'No. of floors', this.getF('indusBBGNoOfFloors', 'G+2'));
    this.drawBBGRow(3, 'No. of wings', this.getF('indusBBGNoOfWings', '1'));
    this.drawBBGRow(4, 'No. of flats on each floor', this.getF('indusBBGFlatsPerFloor', '2'));
    this.drawBBGRow(5, 'No. of lifts in each wing', this.getF('indusBBGLiftsPerWing', 'NA'));
    this.drawBBGRow(6, 'Age of the property', this.getF('indusBBGAgeOfProperty', '10 Years'));
    this.drawBBGRow(7, 'Estimated future life (considering 60 yrs Building life)', this.getF('indusBBGFutureLife', '50 Years'));

    // Quality of construction
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: 'Quality of construction', value: '', labelWidth: CONTENT_W - numW, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawBBGRow('A.1', 'Beam & column structure', this.getF('indusBBGBeamColumn', 'Sound & Stable'));
    this.drawBBGRow('A.2', 'Appearance of the building', this.getF('indusBBGAppearance', 'Good'));
    this.drawBBGRow('A.3', 'Maintenance of the building', this.getF('indusBBGMaintenance', 'Well Maintained'));

    // Common areas remarks
    const caList = [
      { name: 'Reception', key: 'indusBBG_CA_Reception' },
      { name: 'Staircase', key: 'indusBBG_CA_Staircase' },
      { name: 'O/h water tank', key: 'indusBBG_CA_WaterTank' },
      { name: 'Sanitation', key: 'indusBBG_CA_Sanitation' },
    ];
    for (let i = 0; i < caList.length; i++) {
      this.drawKeyValueRow([
        { label: i === 0 ? 'A.4' : '', value: '', labelWidth: numW, valueWidth: 0, labelBold: i === 0 },
        { label: i === 0 ? 'Common areas remarks' : '', value: '', labelWidth: labelW, valueWidth: 0 },
        { label: caList[i].name, value: '', labelWidth: 90, valueWidth: 0, highlight: true },
        { label: '', value: `: ${this.getF(caList[i].key, 'Good')}`, labelWidth: 0, valueWidth: valW - 90 },
      ]);
    }

    this.drawBBGRow('B.1', 'Flooring (Interiors)', this.getF('indusBBGFlooringInteriors', 'Vitrified Tiles'));
    this.drawBBGRow('B.2', 'Finishing (Interiors)', this.getF('indusBBGFinishingInteriors', 'Plastic Paint / Putty'));
    this.drawBBGRow('B.3', 'Roofing & terracing', this.getF('indusBBGRoofingTerracing', 'RCC Slab with waterproofing'));

    // ─────────────────────────────────────────────────────────────
    // F. UNIT DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawBBGSectionHeader('F', 'UNIT DETAILS');
    this.drawBBGRow(1, 'Situated on floor no.', this.getF('indusBBGUnitFloorNo', 'GF & FF'));
    this.drawBBGRow(2, 'Internal composition', this.getF('indusBBGInternalComposition', 'Hall, Bedrooms, Kitchen, Bathrooms'));
    this.drawBBGRow(3, 'Flooring', this.getF('indusBBGUnitFlooring', 'Vitrified Tiles'));
    this.drawBBGRow(4, 'Quality of fittings', this.getF('indusBBGFittingsQuality', 'Standard Concealed'));
    this.drawBBGRow(5, 'Woodwork', this.getF('indusBBGWoodwork', 'Flush doors & Sal wood frames'));

    // ─────────────────────────────────────────────────────────────
    // G. VALUATION
    // ─────────────────────────────────────────────────────────────
    this.drawBBGSectionHeader('G', 'VALUATION');
    this.drawBBGRow(1, 'Drawings and approvals', this.getF('indusBBGValDrawingsApprovals', 'Approved'));
    this.drawBBGRow(2, 'Area considered for the purpose of valuation', this.getF('indusBBGValAreaConsidered', ''));

    // Age & Future Life 2-cell split
    const ageHalfW = (CONTENT_W - numW - labelW) / 2;
    this.drawKeyValueRow([
      { label: '3', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Age of the building & future life', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: 'Age (Yrs)', value: '', labelWidth: ageHalfW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Future Life (Yrs)', value: '', labelWidth: ageHalfW, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: numW, valueWidth: 0 },
      { label: '', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: '', value: this.getF('indusBBGAgeYrs', ''), labelWidth: 0, valueWidth: ageHalfW },
      { label: '', value: this.getF('indusBBGFutureLifeYrs', ''), labelWidth: 0, valueWidth: ageHalfW },
    ]);

    this.drawBBGRow(4, 'Present condition of property and structure', this.getF('indusBBGPresentCondition', 'Good & Sound'));
    this.drawBBGRow(6, 'Comments on specifications & amenities', this.getF('indusBBGCommentsSpecs', 'All basic civic amenities available'));
    this.drawBBGRow(7, 'Market rates of properties in the vicinity and surrounding area', this.getF('indusBBGMarketRatesVicinity', ''));
    this.drawBBGRow(8, 'Inquiries made from', this.getF('indusBBGInquiriesFrom', 'Local realtors and residents'));
    this.drawBBGRow(9, 'Remarks (if any)', this.getF('indusBBGValRemarks', 'Valuation based on actual site observation'));
    this.drawBBGRow(10, 'Govt. Guideline value (Ready Reckoner/Circle Rate/ Jantri rate as for Stamp Duty', this.getF('indusBBGGovtGuidelineValue', ''));

    // (I) For Land & Building Table
    this.drawKeyValueRow([
      {
        label: 'In view of the data available and basis for valuation, the valuation of the property under reference will as under :-',
        value: '',
        labelWidth: CONTENT_W,
        valueWidth: 0,
        highlight: true,
        labelBold: true,
      },
    ]);
    this.drawKeyValueRow([
      { label: '(I) For land & building', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);

    const lbCol1W = 120;
    const lbCol2W = 160;
    const lbCol3W = CONTENT_W - lbCol1W - lbCol2W;

    this.drawKeyValueRow([
      { label: 'A', value: '', labelWidth: 20, valueWidth: 0, labelBold: true },
      { label: 'Land area (Sqft)', value: '', labelWidth: lbCol1W - 20, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate adopted', value: '', labelWidth: lbCol2W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Land value (In Rs.)', value: '', labelWidth: lbCol3W, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 20, valueWidth: 0 },
      { label: '', value: this.getF('indusBBGLandAreaSqft', '0.00'), labelWidth: 0, valueWidth: lbCol1W - 20 },
      { label: '', value: this.getF('indusBBGLandRate', '0.00'), labelWidth: 0, valueWidth: lbCol2W },
      { label: '', value: `Rs.${formatIndianCurrency(parseFloat(this.getF('indusBBGLandValue', '0')) || 0)}/-`, labelWidth: 0, valueWidth: lbCol3W, valueBold: true },
    ]);

    const b4W = (CONTENT_W - 20) / 4;
    this.drawKeyValueRow([
      { label: 'B', value: '', labelWidth: 20, valueWidth: 0, labelBold: true },
      { label: 'Built up area(Sqft)', value: '', labelWidth: b4W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate adopted (after dep.)', value: '', labelWidth: b4W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Less for repairs (if any)', value: '', labelWidth: b4W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Building value (In Rs.)', value: '', labelWidth: b4W, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 20, valueWidth: 0 },
      { label: '', value: this.getF('indusBBGBuiltUpAreaSqft', '0.00'), labelWidth: 0, valueWidth: b4W },
      { label: '', value: this.getF('indusBBGBldgRateDep', '0.00'), labelWidth: 0, valueWidth: b4W },
      { label: '', value: this.getF('indusBBGLessRepairs', '0.00'), labelWidth: 0, valueWidth: b4W },
      { label: '', value: `Rs.${formatIndianCurrency(parseFloat(this.getF('indusBBGBuildingValue', '0')) || 0)}/-`, labelWidth: 0, valueWidth: b4W, valueBold: true },
    ]);

    const totalVal = (parseFloat(this.getF('indusBBGLandValue', '0')) || 0) + (parseFloat(this.getF('indusBBGBuildingValue', '0')) || 0);
    this.drawKeyValueRow([
      { label: 'C', value: '', labelWidth: 20, valueWidth: 0, labelBold: true },
      { label: 'Total value of property (A + B ) (In Rs.)', value: '', labelWidth: 220, valueWidth: 0, labelBold: true },
      { label: '', value: `Rs.${formatIndianCurrency(totalVal)}/-`, labelWidth: 0, valueWidth: CONTENT_W - 240, valueBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 20, valueWidth: 0 },
      { label: 'Valuation in words :', value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
      { label: '', value: `(${rupeesInWords(totalVal)})`, labelWidth: 0, valueWidth: CONTENT_W - 170, valueBold: true },
    ]);

    // (II) For Flat/Shop/Floor
    this.drawKeyValueRow([
      { label: '(II) For flat/shop/floor', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);
    const f3W = CONTENT_W / 3;
    this.drawKeyValueRow([
      { label: 'Built up area', value: '', labelWidth: f3W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate adopted', value: '', labelWidth: f3W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Present value', value: '', labelWidth: f3W, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: `${this.getF('indusBBGFlatBUA', '0.00')} Sq. ft`, labelWidth: 0, valueWidth: f3W },
      { label: '', value: `Rs. ${this.getF('indusBBGFlatRate', '0.00')}`, labelWidth: 0, valueWidth: f3W },
      { label: '', value: `Rs. ${formatIndianCurrency(parseFloat(this.getF('indusBBGFlatPresentValue', '0')) || 0)}`, labelWidth: 0, valueWidth: f3W, valueBold: true },
    ]);

    this.drawBBGRow(11, 'Construction estimate given by the customer', this.getF('indusBBGConstructionEstimate', ''));
    this.drawBBGRow(12, 'Is the estimate given by the customer valid', this.getF('indusBBGEstimateValid', 'Yes'));
    this.drawBBGRow(13, 'Value of the property (i.e mortgage value)(as on date) (In Rs.)', `Rs.${formatIndianCurrency(parseFloat(this.getF('indusBBGMortgageValue', String(totalVal))) || 0)}/-`);
    this.drawBBGRow(14, 'Forced/distress sale value (In Rs.)', `Rs.${formatIndianCurrency(parseFloat(this.getF('indusBBGDistressValue', '0')) || 0)}/-`);
    this.drawBBGRow(15, 'Replacement value for insurance purposes (In Rs.)', `Rs.${formatIndianCurrency(parseFloat(this.getF('indusBBGInsuranceValue', '0')) || 0)}/-`);

    this.drawBBGRow('1', 'For sale', this.getF('indusBBGForSale', 'Good Demand'));
    this.drawBBGRow('2', 'For lease – estimated rental Income', this.getF('indusBBGForLeaseRental', 'Rs. 25,000/- per month'));
    this.drawBBGRow('3', 'Volatility of property prices', this.getF('indusBBGVolatility', 'Stable'));

    // ─────────────────────────────────────────────────────────────
    // VII) Disclosure Statement
    // ─────────────────────────────────────────────────────────────
    this.drawSectionHeader('VII) Disclosure Statement');
    const disclosures = [
      'Statements of facts are true and correct.',
      'Limiting conditions have been disclosed.',
      'We (valuer) have no interest (present or future) in the transaction or property.',
      'Compensation is not contingent upon rendering a specified value.',
      'We have complied with all of the real estate appraisal program requirements.',
      'An inspection of the property was performed by our site engineer.',
      'No support received.',
    ];
    for (let i = 0; i < disclosures.length; i++) {
      this.drawKeyValueRow([
        { label: String(i + 1), value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
        { label: disclosures[i], value: '', labelWidth: CONTENT_W - numW, valueWidth: 0 },
      ]);
    }

    // ─────────────────────────────────────────────────────────────
    // VIII) Declaration
    // ─────────────────────────────────────────────────────────────
    this.drawSectionHeader('VIII) Declaration');
    const declarations = [
      `I have deputed my engineer to inspect the property, who has personally inspected the property on ${this.getF('indusBBGInspectionDate', this.getF('inspectionDate', ''))}`,
      'I have no direct or indirect interest in the property valued.',
      'Information furnished in the report is true and correct to the best of my knowledge and belief.',
      'This report does not certify of confirm any ownership or title of the property that has been valued. The ownership papers/sale deeds may please be verified at your end to ascertain the right title & area.',
      'Fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. Client is free to obtain other independent opinions on the same. Fair, market value of such properties/localities may increase or decrease, depending on the future market conditions & scenarios. This report does not certify or confirm any ownership or title of the property that has been valued.',
      'No structural survey was conducted by us.',
      'Validity of this report is for 45 days from date.',
      'Permissible area considered for valuation are as per byelaws',
      'The Report will reflect matters, as they currently exist. Changes may materially affect the information contained in the Report.',
      'We do not take any responsibility of unauthorized use of said report.',
      'We do not possess legal expertise and hence recommend you to take opinion of legal expert in order to ensure that there are no elements, restriction or charges contained which are likely to have detrimental effect upon the value or marketability of property.',
      'The Report will reflect matters, as they currently exist. Changes may materially affect the information contained in the Report.',
      'The Report will reflect matters, as they currently exist. Changes may materially affect the information contained in the Report.',
      'Report is prepared based on the information furnished to us or documents submitted or shown to us by the client.',
    ];

    for (let i = 0; i < declarations.length; i++) {
      this.drawKeyValueRow([
        { label: String(i + 1), value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
        { label: declarations[i], value: '', labelWidth: CONTENT_W - numW, valueWidth: 0 },
      ]);
    }

    // ─────────────────────────────────────────────────────────────
    // Sign-off Block
    // ─────────────────────────────────────────────────────────────
    this.advanceCursor(10);
    const signW = CONTENT_W / 2;
    this.drawKeyValueRow([
      {
        label: `Place : ${this.getF('indusBBGPlace', 'Bhubaneswar')}\nDate : ${this.getF('indusBBGReportDate', this.getF('valuationDate', ''))}`,
        value: '',
        labelWidth: signW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: 'Sign & Stamp\n\n\n\nS MOHANTY ASSOCIATES\nValuer & Chartered Engineer',
        value: '',
        labelWidth: signW,
        valueWidth: 0,
        labelBold: true,
      },
    ]);

    // ─────────────────────────────────────────────────────────────
    // Inherited Galleries
    // ─────────────────────────────────────────────────────────────
    if (this.fields.documents?.length > 0) {
      await this.drawDocumentsGallery(this.fields.documents);
    }
    if (this.fields.maps?.length > 0) {
      await this.drawMapGallery(this.fields.maps, 'PROPERTY MAPS');
    }
    if (this.fields.photos?.length > 0) {
      await this.drawPhotoGrid(this.fields.photos);
    }
  }
}
