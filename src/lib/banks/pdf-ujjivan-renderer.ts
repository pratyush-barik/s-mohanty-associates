import {
  PDFBankRenderer,
  CONTENT_W,
  MARGIN_L,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  hexToRgb,
  BORDER_W,
} from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';
import {
  parseSafeFloat,
  multiplyExactDecimals,
  sumDecimals,
} from '../bank-input-constraints';

export class PDFUjjivanRenderer extends PDFBankRenderer {
  private fields: any;
  private projectCode?: string;

  constructor(opts: any = {}) {
    super();
    this.fields = opts || {};
    this.projectCode = opts.projectCode;
  }

  private getF(key: string, defaultVal: any = ''): any {
    const val = this.fields[key];
    if (val === undefined || val === null || val === '') return defaultVal;
    return val;
  }

  async render(): Promise<Uint8Array> {
    await this.init();
    await this.drawContent();
    return await this.save();
  }

  private drawUjjivanSectionHeader(title: string) {
    this.drawSectionHeader(title.toUpperCase());
  }

  private drawUjjivanSubHeader(title: string) {
    this.checkPageBreak(28);
    this.drawKeyValueRow([
      {
        label: title.toUpperCase(),
        value: '',
        labelWidth: CONTENT_W,
        valueWidth: 0,
        labelBold: true,
        highlight: true,
      },
    ]);
  }

  private drawUjjivanRow(num: string | number, label: string, val: string, labelW: number = 220) {
    const fullLabel = num ? `${num}. ${label}` : label;
    this.drawKeyValueRow([
      {
        label: fullLabel,
        value: val || 'NA',
        labelWidth: labelW,
        valueWidth: CONTENT_W - labelW,
      },
    ]);
  }

  async drawContent(): Promise<void> {
    // ═══════════════════════════════════════════════
    // HEADER & BASIC IDENTIFICATION
    // ═══════════════════════════════════════════════
    this.drawCenteredTitle('TECHNICAL REPORT ON IMMOVABLE PROPERTY', 14, true);
    this.advanceCursor(2);
    this.drawCenteredTitle('UJJIVAN SMALL FINANCE BANK', 11, true);
    this.advanceCursor(6);

    const halfW = CONTENT_W / 2;

    this.drawKeyValueRow([
      { label: 'Name Of The Applicant', value: this.getF('applicantName', ''), labelWidth: 160, valueWidth: CONTENT_W - 160, labelBold: true, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Purpose of Valuation', value: this.getF('purposeOfValuation', 'To Ascertain fair market value of the property as on date'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);

    this.drawKeyValueRow([
      { label: '1. Name of Valuer', value: this.getF('nameOfValuer', 'M/s. S. Mohanty Associates'), labelWidth: 130, valueWidth: halfW - 130 },
      { label: 'Date', value: this.getF('valuationDate', ''), labelWidth: 80, valueWidth: halfW - 80 },
    ]);
    this.drawKeyValueRow([
      { label: '2. Client Id', value: this.getF('clientId', ''), labelWidth: 130, valueWidth: halfW - 130 },
      { label: 'Case Type', value: this.getF('caseType', 'HEL'), labelWidth: 80, valueWidth: halfW - 80 },
    ]);
    this.drawKeyValueRow([
      { label: '3. Contact Person & Number', value: this.getF('contactPersonAndNumber', ''), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: '4. Date of Inspection', value: this.getF('inspectionDate', ''), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: '5. Owner as per Document', value: this.getF('ownerNameAsPerDoc', ''), labelWidth: 160, valueWidth: CONTENT_W - 160, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '6. Provided Documents for Valuation', value: this.getF('providedDocuments', 'Copy of Sale deed, ROR'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: '7. Site No. / Door No / Property No.', value: this.getF('siteNoDoorNo', ''), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);

    // Property Address comparison
    this.drawKeyValueRow([
      { label: 'Property Address (Document)', value: '', labelWidth: halfW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Property Address (Actual at Site)', value: '', labelWidth: halfW, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: '', value: this.getF('propertyAddressDoc', ''), labelWidth: 0, valueWidth: halfW },
      { label: '', value: this.getF('propertyAddressActual', ''), labelWidth: 0, valueWidth: halfW },
    ]);

    this.drawKeyValueRow([
      { label: '9. Property Demarcated?', value: this.getF('isDemarcated', 'Yes'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Place', value: this.getF('place', 'Puri'), labelWidth: 80, valueWidth: halfW - 80 },
    ]);
    this.drawKeyValueRow([
      { label: '10. Nearest Landmark', value: this.getF('nearestLandmark', ''), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: '11. Distance From City Centre', value: this.getF('distanceCityCentre', ''), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: '12. Road Name / Width for Access', value: this.getF('accessRoadName', '10-feet wide Road'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: '13. Type of Property', value: this.getF('typeOfProperty', 'Residential'), labelWidth: 130, valueWidth: halfW - 130 },
      { label: 'Jurisdiction', value: this.getF('jurisdiction', 'Puri Municipality limit'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);
    this.drawKeyValueRow([
      { label: 'Shape of the Plot', value: this.getF('shapeOfPlot', 'Rectangular'), labelWidth: 130, valueWidth: halfW - 130 },
      { label: '14. Zonal Classification', value: this.getF('zonalClassification', 'Residential'), labelWidth: 130, valueWidth: halfW - 130 },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 2: BASIC LAYOUT AMENITIES
    // ═══════════════════════════════════════════════
    this.drawUjjivanSectionHeader('Basic Layout Amenities');

    const col4W = CONTENT_W / 4;
    this.drawKeyValueRow([
      { label: 'Water Facility', value: this.getF('waterFacility', 'Yes'), labelWidth: 90, valueWidth: col4W - 90 },
      { label: 'Underground Drainage', value: this.getF('undergroundDrainage', 'No'), labelWidth: 110, valueWidth: col4W - 110 },
      { label: 'Type of Road', value: this.getF('typeOfRoad', 'Road'), labelWidth: 80, valueWidth: col4W - 80 },
      { label: 'Electricity', value: this.getF('electricity', 'Yes'), labelWidth: 80, valueWidth: col4W - 80 },
    ]);

    this.drawKeyValueRow([
      { label: 'Class of Locality', value: this.getF('classOfLocality', 'Middle Class'), labelWidth: 130, valueWidth: halfW - 130 },
      { label: 'Marketability', value: this.getF('marketability', 'GOOD'), labelWidth: 110, valueWidth: halfW - 110 },
    ]);
    this.drawKeyValueRow([
      { label: 'Surrounding Locality', value: this.getF('surroundingLocality', 'Developed'), labelWidth: 130, valueWidth: halfW - 130 },
      { label: 'Surrounding Habitation (200m)', value: this.getF('surroundingHabitation', 'Yes(80%)'), labelWidth: 150, valueWidth: halfW - 150 },
    ]);
    this.drawKeyValueRow([
      { label: 'Nearby Civic Amenities', value: this.getF('nearbyCivicAmenities', 'School, ATM, Bank, Market (within 1-2 kms)'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 3: SCHEDULE OF PROPERTY (BOUNDARIES & DIMENSIONS)
    // ═══════════════════════════════════════════════
    this.drawUjjivanSectionHeader('Schedule of Property & Dimensions');

    const bDirW = 80;
    const bDocW = (CONTENT_W - bDirW) * 0.35;
    const bActW = (CONTENT_W - bDirW) * 0.35;
    const bRemW = (CONTENT_W - bDirW) * 0.30;

    this.drawKeyValueRow([
      { label: 'Direction', value: '', labelWidth: bDirW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Document', value: '', labelWidth: bDocW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Actual', value: '', labelWidth: bActW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Remarks', value: '', labelWidth: bRemW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const bounds = [
      { dir: 'East By', doc: this.getF('boundDocEast', 'Road'), act: this.getF('boundActEast', 'Road'), rem: this.getF('boundRemarksEast', '') },
      { dir: 'West By', doc: this.getF('boundDocWest', 'Hadigohiri'), act: this.getF('boundActWest', 'Building of Bapi Mohapatra'), rem: this.getF('boundRemarksWest', 'Boundary is matching as per documents') },
      { dir: 'North By', doc: this.getF('boundDocNorth', 'Benu Singhari'), act: this.getF('boundActNorth', 'Building of Benu Singhari'), rem: this.getF('boundRemarksNorth', '') },
      { dir: 'South By', doc: this.getF('boundDocSouth', 'Dasarathi Panda'), act: this.getF('boundActSouth', 'Building of Dasarathi Panda'), rem: this.getF('boundRemarksSouth', '') },
    ];

    bounds.forEach(b => {
      this.drawKeyValueRow([
        { label: b.dir, value: '', labelWidth: bDirW, valueWidth: 0, labelBold: true },
        { label: '', value: b.doc || 'NA', labelWidth: 0, valueWidth: bDocW },
        { label: '', value: b.act || 'NA', labelWidth: 0, valueWidth: bActW },
        { label: '', value: b.rem || '', labelWidth: 0, valueWidth: bRemW },
      ]);
    });

    this.advanceCursor(4);
    this.drawUjjivanSubHeader('SCHEDULE AS PER AMIN SKETCH MAP');
    this.drawKeyValueRow([
      { label: 'East By', value: this.getF('boundAminEast', 'NA'), labelWidth: 70, valueWidth: col4W - 70 },
      { label: 'West By', value: this.getF('boundAminWest', 'NA'), labelWidth: 70, valueWidth: col4W - 70 },
      { label: 'North By', value: this.getF('boundAminNorth', 'NA'), labelWidth: 70, valueWidth: col4W - 70 },
      { label: 'South By', value: this.getF('boundAminSouth', 'NA'), labelWidth: 70, valueWidth: col4W - 70 },
    ]);

    this.advanceCursor(4);
    this.drawUjjivanSubHeader('SITE DIMENSIONS');
    this.drawKeyValueRow([
      { label: 'Amin Sketch (E-W)', value: this.getF('dimAminEW', 'NA'), labelWidth: 110, valueWidth: col4W - 110 },
      { label: 'Amin Sketch (N-S)', value: this.getF('dimAminNS', 'NA'), labelWidth: 110, valueWidth: col4W - 110 },
      { label: 'Actual (E-W)', value: this.getF('dimActEW', '90\'-0"'), labelWidth: 90, valueWidth: col4W - 90 },
      { label: 'Actual (N-S)', value: this.getF('dimActNS', '13\'-0"'), labelWidth: 90, valueWidth: col4W - 90 },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 4: TECHNICAL & STRUCTURAL DETAILS
    // ═══════════════════════════════════════════════
    this.drawUjjivanSectionHeader('Technical & Structural Details');

    this.drawKeyValueRow([
      { label: '1. Type of Construction', value: this.getF('typeOfConstruction', 'RCC Framed'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: '2. Quality of Construction', value: this.getF('qualityOfConstruction', 'Average'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: '3. Electrical Fittings', value: this.getF('electricalFittings', 'Standard'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Sanitary Fittings', value: this.getF('sanitaryFittings', 'Standard'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: '4. Lifts', value: this.getF('lifts', 'No'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Compound Wall', value: this.getF('compoundWall', 'No'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: '5. Super Structure', value: this.getF('superStructure', 'RCC Framed structure'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: '6. Roof', value: this.getF('roofType', 'RCC Roof'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: '7. Doors & Windows', value: this.getF('doorsWindows', 'grilled door & window'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: '8. Flooring', value: this.getF('flooring', 'Tile'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: '9. Year of Construction', value: this.getF('yearOfConstruction', '2026'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: '10. Age of Building', value: `${this.getF('ageOfBuilding', '0')} Years`, labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Future Life (RCC)', value: `${this.getF('futureLifeRcc', '60')} Years`, labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Future Life (AC Sheet)', value: `${this.getF('futureLifeAcSheet', '0')} Years`, labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 5: STATUTORY & FLOOR AREAS
    // ═══════════════════════════════════════════════
    this.drawUjjivanSectionHeader('Statutory & Floor Areas');

    this.drawKeyValueRow([
      { label: '1. Site Area as per Schedule', value: this.getF('siteAreaSchedule', '1176sqft (As per ROR)'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: '2. Site Area as per Plan', value: this.getF('siteAreaPlan', 'NA'), labelWidth: 130, valueWidth: halfW - 130 },
    ]);
    this.drawKeyValueRow([
      { label: '3. Site Area as per Actual', value: this.getF('siteAreaActual', '1176sqft (As per Actual)'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: '4. Statutory Approval Details', value: this.getF('statutoryApprovalDetails', 'Approval Plan not Provided'), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: '5. Approval Number & Date', value: this.getF('approvalNumberAndDate', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: '6. F.S.I / FAR Permitted', value: this.getF('fsiFarPermitted', 'NA'), labelWidth: 130, valueWidth: halfW - 130 },
    ]);
    this.drawKeyValueRow([
      { label: '7. Permitted Use', value: this.getF('permittedUse', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: '8. Actual Use', value: this.getF('actualUse', 'Under construction (Residential)'), labelWidth: 130, valueWidth: halfW - 130 },
    ]);
    this.drawKeyValueRow([
      { label: '9. Approved No. of Floors', value: this.getF('approvedFloors', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: '10. As Built No. of Floors', value: this.getF('asBuiltFloors', 'G+3'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: '11. Adheres to NBC / BIS Code?', value: this.getF('adheresToNbcBis', 'Yes'), labelWidth: 170, valueWidth: halfW - 170 },
      { label: 'Adheres to NDMA Guidelines?', value: this.getF('adheresToNdma', 'Yes'), labelWidth: 170, valueWidth: halfW - 170 },
    ]);

    // Floorwise BUA Table
    this.advanceCursor(4);
    this.drawUjjivanSubHeader('12. FLOORWISE BUILT-UP AREA BREAKDOWN');

    const flColW = CONTENT_W / 3;
    this.drawKeyValueRow([
      { label: 'Floor Level', value: '', labelWidth: flColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Permissible BUA (Sft)', value: '', labelWidth: flColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual Gross BUA (Sft)', value: '', labelWidth: flColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const floors = [
      { name: 'Ground Floor', perm: this.getF('buaGfPerm', 'NA'), act: this.getF('buaGfAct', '1,162') },
      { name: 'First Floor', perm: this.getF('buaFfPerm', 'NA'), act: this.getF('buaFfAct', '1,162') },
      { name: 'Second Floor', perm: this.getF('buaSfPerm', 'NA'), act: this.getF('buaSfAct', '1,162') },
      { name: 'Third Floor', perm: this.getF('buaTfPerm', 'NA'), act: this.getF('buaTfAct', '1,162') },
      { name: 'Total Built-up Area', perm: this.getF('buaTotalPerm', 'NA'), act: this.getF('buaTotalAct', '4,648') },
    ];

    floors.forEach((f, idx) => {
      const isTotal = idx === floors.length - 1;
      this.drawKeyValueRow([
        { label: f.name, value: '', labelWidth: flColW, valueWidth: 0, labelBold: isTotal },
        { label: '', value: f.perm, labelWidth: 0, valueWidth: flColW, valueBold: isTotal },
        { label: '', value: `${f.act} Sft`, labelWidth: 0, valueWidth: flColW, valueBold: isTotal },
      ]);
    });

    this.drawKeyValueRow([
      { label: 'Carpet Area', value: `${this.getF('carpetArea', '3950.8')} Sft`, labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: '13. Adherence to Sanction Plan', value: this.getF('adherenceSanctionPlan', 'NA'), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);
    this.drawKeyValueRow([
      { label: '14. Horizontal Deviation %', value: this.getF('devHorizontal', 'NA'), labelWidth: 140, valueWidth: col4W - 140 },
      { label: 'Vertical Deviation %', value: this.getF('devVertical', 'NA'), labelWidth: 130, valueWidth: col4W - 130 },
      { label: 'Setback Deviation %', value: this.getF('devSetback', 'NA'), labelWidth: 130, valueWidth: col4W - 130 },
      { label: '15. Demolition Risk', value: this.getF('riskOfDemolition', 'LOW'), labelWidth: 120, valueWidth: col4W - 120, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '16. Property Tenure', value: this.getF('propertyTenure', 'Free Hold'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: '17. Internal Composition', value: this.getF('internalComposition', 'Good'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: '18. Present Occupancy', value: this.getF('presentOccupancy', 'Vacant (Under construction)'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 6: VALUATION & CALCULATIONS (TABLE 22)
    // ═══════════════════════════════════════════════
    this.drawUjjivanSectionHeader('Valuation & Calculations');

    this.drawKeyValueRow([
      { label: '19. Present Market Rates in Vicinity', value: `Rs. ${this.getF('vicinityMarketRateMin', '6,000')} to Rs. ${this.getF('vicinityMarketRateMax', '8,000')} per Sft`, labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);
    this.drawKeyValueRow([
      { label: '20. Sales / Rate Adopted for Land', value: `Rs. ${this.getF('adoptedSalesRate', '8,000')}/- per Sft`, labelWidth: 200, valueWidth: CONTENT_W - 200, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '21. Customer Construction Estimate', value: this.getF('constructionEstimateCustomer', 'NA'), labelWidth: 200, valueWidth: CONTENT_W - 200 },
    ]);

    this.advanceCursor(4);
    this.drawUjjivanSubHeader('22. VALUE OF THE PROPERTY AS ON DATE (DOCUMENT AREA CONSIDERED)');

    const landArea = parseSafeFloat(this.getF('landAreaSqft', 1176));
    const landRate = parseSafeFloat(this.getF('adoptedSalesRate', 8000));
    const landValue = multiplyExactDecimals(landArea, landRate);

    const bua100 = parseSafeFloat(this.getF('buaFar100', 1764));
    const rate100 = parseSafeFloat(this.getF('rateFar100', 2000));
    const val100 = multiplyExactDecimals(bua100, rate100);

    const buaStage = parseSafeFloat(this.getF('buaFarStage', 1764));
    const rateStage = parseSafeFloat(this.getF('rateFarStage', 1600));
    const valStage = multiplyExactDecimals(buaStage, rateStage);

    const presentValue = sumDecimals([landValue, valStage]);
    const forcedSaleValue = Math.round(presentValue * 0.8);
    const afterCompletionValue = sumDecimals([landValue, val100]);

    const vItemW = CONTENT_W * 0.45;
    const vAreaW = CONTENT_W * 0.15;
    const vRateW = CONTENT_W * 0.15;
    const vAmtW = CONTENT_W * 0.25;

    this.drawKeyValueRow([
      { label: 'Particulars', value: '', labelWidth: vItemW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Area', value: '', labelWidth: vAreaW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate (₹)', value: '', labelWidth: vRateW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Amount in INR', value: '', labelWidth: vAmtW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: 'a. Land Value', value: '', labelWidth: vItemW, valueWidth: 0, labelBold: true },
      { label: '', value: `${landArea.toLocaleString('en-IN')} Sft`, labelWidth: 0, valueWidth: vAreaW },
      { label: '', value: `Rs. ${landRate.toLocaleString('en-IN')}`, labelWidth: 0, valueWidth: vRateW },
      { label: '', value: `Rs. ${formatIndianCurrency(landValue)}/-`, labelWidth: 0, valueWidth: vAmtW, valueBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'b. Measured BUA FAR 1.5 (On 100% completion)', value: '', labelWidth: vItemW, valueWidth: 0 },
      { label: '', value: `${bua100.toLocaleString('en-IN')} Sft`, labelWidth: 0, valueWidth: vAreaW },
      { label: '', value: `Rs. ${rate100.toLocaleString('en-IN')}`, labelWidth: 0, valueWidth: vRateW },
      { label: '', value: `Rs. ${formatIndianCurrency(val100)}/-`, labelWidth: 0, valueWidth: vAmtW },
    ]);

    this.drawKeyValueRow([
      { label: 'c. Measured BUA FAR 1.5 (As on date stage %)', value: '', labelWidth: vItemW, valueWidth: 0 },
      { label: '', value: `${buaStage.toLocaleString('en-IN')} Sft`, labelWidth: 0, valueWidth: vAreaW },
      { label: '', value: `Rs. ${rateStage.toLocaleString('en-IN')}`, labelWidth: 0, valueWidth: vRateW },
      { label: '', value: `Rs. ${formatIndianCurrency(valStage)}/-`, labelWidth: 0, valueWidth: vAmtW, valueBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'e. Others (Sump, Parapet, OHT)', value: this.getF('valOthers', 'Rs. 0/-'), labelWidth: vItemW + vAreaW + vRateW, valueWidth: vAmtW },
    ]);
    this.drawKeyValueRow([
      { label: 'f. Elevation Treatment', value: this.getF('valElevation', 'Rs. 0/-'), labelWidth: vItemW + vAreaW + vRateW, valueWidth: vAmtW },
    ]);
    this.drawKeyValueRow([
      { label: 'g. Interiors', value: this.getF('valInteriors', 'Rs. 0/-'), labelWidth: vItemW + vAreaW + vRateW, valueWidth: vAmtW },
    ]);
    this.drawKeyValueRow([
      { label: 'h. Gross Construction Value in Rs.', value: `Rs. ${formatIndianCurrency(valStage)}/-`, labelWidth: vItemW + vAreaW + vRateW, valueWidth: vAmtW },
    ]);
    this.drawKeyValueRow([
      { label: 'i. Less for Depreciation @ 1% P.A.', value: 'Rs. 0/-', labelWidth: vItemW + vAreaW + vRateW, valueWidth: vAmtW },
    ]);
    this.drawKeyValueRow([
      { label: 'j. Net Construction Value in Rs.', value: `Rs. ${formatIndianCurrency(valStage)}/-`, labelWidth: vItemW + vAreaW + vRateW, valueWidth: vAmtW, valueBold: true },
    ]);

    // Financial Highlights
    this.advanceCursor(2);
    this.drawKeyValueRow([
      {
        label: 'm. PRESENT VALUE OF PROPERTY (Land + Current Stage Constr)',
        value: `Rs. ${formatIndianCurrency(presentValue)}/-`,
        labelWidth: CONTENT_W - 180,
        valueWidth: 180,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: 'n. FORCED SALE VALUE (80% of Present Value)',
        value: `Rs. ${formatIndianCurrency(forcedSaleValue)}/-`,
        labelWidth: CONTENT_W - 180,
        valueWidth: 180,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: 'o. AFTER COMPLETION VALUE (100% Completion)',
        value: `Rs. ${formatIndianCurrency(afterCompletionValue)}/-`,
        labelWidth: CONTENT_W - 180,
        valueWidth: 180,
        labelBold: true,
        valueBold: true,
      },
    ]);

    this.drawKeyValueRow([
      { label: 'Present Value in Words', value: rupeesInWords(presentValue), labelWidth: 150, valueWidth: CONTENT_W - 150, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Forced Sale Value in Words', value: rupeesInWords(forcedSaleValue), labelWidth: 150, valueWidth: CONTENT_W - 150, labelBold: true },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 7: WORK STATUS & RECOMMENDATIONS
    // ═══════════════════════════════════════════════
    this.drawUjjivanSectionHeader('Work Status & Recommendation');

    this.drawKeyValueRow([
      { label: 'Geographical Location / GEO TAG', value: `Latitude: ${this.getF('geoTagLatitude', '19.804528')}   Longitude: ${this.getF('geoTagLongitude', '85.822250')}`, labelWidth: 180, valueWidth: CONTENT_W - 180, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Description of Present Work Status', value: this.getF('workStatusDescription', 'G+3=plastering work completed.'), labelWidth: 180, valueWidth: CONTENT_W - 180 },
    ]);

    this.advanceCursor(4);
    this.drawUjjivanSubHeader('PRESENT STATUS OF WORK & RECOMMENDATION');
    const wsColW = CONTENT_W / 3;
    this.drawKeyValueRow([
      { label: 'Work Component', value: '', labelWidth: wsColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Progress (%)', value: '', labelWidth: wsColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Recommended (%)', value: '', labelWidth: wsColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Civil Work', value: '', labelWidth: wsColW, valueWidth: 0 },
      { label: '', value: `${this.getF('progressCivil', '80')}%`, labelWidth: 0, valueWidth: wsColW },
      { label: '', value: `${this.getF('recommendedCivil', '85')}%`, labelWidth: 0, valueWidth: wsColW, valueBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Interiors', value: '', labelWidth: wsColW, valueWidth: 0 },
      { label: '', value: `${this.getF('progressInteriors', '80')}%`, labelWidth: 0, valueWidth: wsColW },
      { label: '', value: `${this.getF('recommendedInteriors', '85')}%`, labelWidth: 0, valueWidth: wsColW, valueBold: true },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 8: REMARKS & DECLARATION
    // ═══════════════════════════════════════════════
    this.drawUjjivanSectionHeader('Remarks & Declaration');

    this.drawKeyValueRow([
      { label: 'Remarks / Comments', value: this.getF('synthesisRemarks', ''), labelWidth: 140, valueWidth: CONTENT_W - 140, labelBold: true },
    ]);

    this.advanceCursor(4);
    this.drawUjjivanSubHeader('DECLARATION');

    const defaultDeclarations = [
      '1. I have no direct or indirect interest in the property valued; The information furnished in the report is true and correct to the best of my knowledge and belief for the property shown by the client and details furnished / provided by the client at site. The provided fair market value is as on date and varies with time to time.',
      '2. The ownership, all original documents / Gift deeds may please be verified at your end to ascertain the right title & area, subject to legal clearance and free from all encumbrances only.',
      '3. Property is clearly demarcated, and clear road access is available physically as per site visit.',
      '4. Please Contact us for any Clarifications Required on this Valuation Report before Conclusion.',
    ];

    const rawDecs = this.getF('statutoryDeclarations', defaultDeclarations.join('\n'));
    const decList = Array.isArray(rawDecs)
      ? rawDecs
      : String(rawDecs).split('\n').map(s => s.trim()).filter(Boolean);

    decList.forEach((dec: string) => {
      this.drawKeyValueRow([
        { label: dec, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    this.advanceCursor(10);
    this.checkPageBreak(60);

    const rDate = this.getF('reportDate', this.getF('valuationDate', '07/05/2026'));
    const rPlace = this.getF('reportPlace', 'Bhubaneswar');

    this.drawKeyValueRow([
      {
        label: `Date: ${rDate}\nPlace: ${rPlace}`,
        value: `For: S. Mohanty Associates\n\n\n\nEr. Satyajit Mohanty\nApproved Valuer / Chartered Engineer`,
        labelWidth: halfW,
        valueWidth: halfW,
        labelBold: true,
        valueBold: true,
      },
    ]);

    // ═══════════════════════════════════════════════
    // ATTACHMENTS (DOCUMENTS, MAPS, PHOTOGRAPHS)
    // ═══════════════════════════════════════════════
    if (this.fields.documentImages && this.fields.documentImages.length > 0) {
      await this.drawDocumentsGallery(this.fields.documentImages);
    }

    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.sketchMapImages || []),
    ];
    if (maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION SKETCH / ROUTE MAPS');
    }

    if (this.fields.propertyImages && this.fields.propertyImages.length > 0) {
      await this.drawPhotoGrid(this.fields.propertyImages);
    }
  }
}

export default PDFUjjivanRenderer;
