import {
  PDFBankRenderer,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  BORDER_W,
} from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';
import {
  parseSafeFloat,
  multiplyExactDecimals,
  sumDecimals,
  calculatePercentageValue,
} from '../bank-input-constraints';

export class PDFTataHousingFinanceRenderer extends PDFBankRenderer {
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

  private drawTataSectionHeader(title: string) {
    this.drawSectionHeader(title.toUpperCase());
  }

  private drawTataSubHeader(title: string) {
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

  async drawContent(): Promise<void> {
    // ═══════════════════════════════════════════════
    // HEADER & BASIC IDENTIFICATION
    // ═══════════════════════════════════════════════
    this.drawCenteredTitle('VALUATION REPORT', 14, true);
    this.advanceCursor(2);
    this.drawCenteredTitle('TATA HOUSING FINANCE LTD', 11, true);
    this.advanceCursor(2);
    this.drawCenteredTitle(
      this.getF('caseType', 'Valuation Report - Self Construction/HEL/HIL'),
      9,
      false
    );
    this.advanceCursor(6);

    const halfW = CONTENT_W / 2;

    this.drawKeyValueRow([
      { label: 'WebTop Application No.', value: this.getF('webTopNo', this.projectCode || ''), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Date of Valuation', value: this.getF('reportDate', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    this.drawKeyValueRow([
      { label: 'Name of the Customer', value: this.getF('customerName', ''), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Name of Co-Owners', value: this.getF('coOwners', 'NA'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    this.drawKeyValueRow([
      { label: 'Property Address', value: this.getF('propertyAddress', ''), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    const col3W = CONTENT_W / 3;
    this.drawKeyValueRow([
      { label: 'City', value: this.getF('city', ''), labelWidth: 60, valueWidth: col3W - 60 },
      { label: 'State', value: this.getF('state', 'Odisha'), labelWidth: 60, valueWidth: col3W - 60 },
      { label: 'Pin Code', value: this.getF('pinCode', ''), labelWidth: 70, valueWidth: col3W - 70 },
    ]);

    this.drawKeyValueRow([
      { label: 'Nearby Landmark', value: this.getF('nearbyLandmark', ''), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Distance from City Center', value: this.getF('distanceCityCenter', ''), labelWidth: 150, valueWidth: halfW - 150 },
    ]);

    this.drawKeyValueRow([
      { label: 'Class of Locality', value: this.getF('classOfLocality', 'Middle'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Occupancy Details', value: this.getF('occupancyDetails', 'Vacant'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    this.drawKeyValueRow([
      { label: 'Monthly Rentals', value: this.getF('monthlyRentals', 'Rs.(NA) Under construction'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Name of Lease', value: this.getF('nameOfLease', 'NA'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    this.drawKeyValueRow([
      { label: 'Type of Property', value: this.getF('typeOfProperty', 'Bungalow'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Status of Property', value: this.getF('statusOfProperty', 'Free Hold'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    this.drawKeyValueRow([
      { label: 'Actual Usage', value: this.getF('actualUsage', 'Residential (Under-construction)'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Approved Usage', value: this.getF('approvedUsage', 'Residential'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    this.drawKeyValueRow([
      { label: 'Demarcation at Site', value: this.getF('demarcationAtSite', 'Not Available'), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 2: BOUNDARIES & ROAD
    // ═══════════════════════════════════════════════
    this.drawTataSectionHeader('Boundaries & Road Details');

    const bDirW = 80;
    const bDocW = (CONTENT_W - bDirW) * 0.5;
    const bActW = (CONTENT_W - bDirW) * 0.5;

    this.drawKeyValueRow([
      { label: 'Direction', value: '', labelWidth: bDirW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Submitted Document', value: '', labelWidth: bDocW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual as per Site', value: '', labelWidth: bActW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const bounds = [
      { dir: 'East', doc: this.getF('boundDocEast', ''), act: this.getF('boundActEast', '') },
      { dir: 'West', doc: this.getF('boundDocWest', ''), act: this.getF('boundActWest', '') },
      { dir: 'North', doc: this.getF('boundDocNorth', ''), act: this.getF('boundActNorth', '') },
      { dir: 'South', doc: this.getF('boundDocSouth', ''), act: this.getF('boundActSouth', '') },
    ];

    bounds.forEach(b => {
      this.drawKeyValueRow([
        { label: b.dir, value: '', labelWidth: bDirW, valueWidth: 0, labelBold: true },
        { label: '', value: b.doc || 'NA', labelWidth: 0, valueWidth: bDocW },
        { label: '', value: b.act || 'NA', labelWidth: 0, valueWidth: bActW },
      ]);
    });

    this.drawKeyValueRow([
      { label: 'Abutting Road Width 1', value: this.getF('roadWidth1', "12'-0\""), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Abutting Road Width 2', value: this.getF('roadWidth2', 'NA'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    this.drawKeyValueRow([
      { label: 'GPS Latitude', value: this.getF('latitude', ''), labelWidth: 120, valueWidth: halfW - 120 },
      { label: 'GPS Longitude', value: this.getF('longitude', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    this.drawKeyValueRow([
      { label: 'Urban / Rural Classification', value: this.getF('urbanRuralClassification', 'Rural'), labelWidth: 170, valueWidth: CONTENT_W - 170 },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 3: TECHNICAL & FLOOR AREAS
    // ═══════════════════════════════════════════════
    this.drawTataSectionHeader('Technical & Floor Areas');

    this.drawKeyValueRow([
      { label: 'Approval Details', value: this.getF('approvalDetailsText', ''), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    this.drawKeyValueRow([
      { label: 'Approval Plan Date', value: this.getF('approvalPlanDate', ''), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Approval No.', value: this.getF('approvalNo', 'Not Mentioned'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    this.drawKeyValueRow([
      { label: 'Commencement Cert. Date', value: this.getF('commencementCertDate', 'NA'), labelWidth: 150, valueWidth: halfW - 150 },
      { label: 'Commencement Cert. No.', value: this.getF('commencementCertNo', 'NA'), labelWidth: 150, valueWidth: halfW - 150 },
    ]);

    this.drawKeyValueRow([
      { label: 'Occupancy Cert. Date', value: this.getF('occupancyCertDate', 'NA'), labelWidth: 150, valueWidth: halfW - 150 },
      { label: 'Occupancy Cert. No.', value: this.getF('occupancyCertNo', 'NA'), labelWidth: 150, valueWidth: halfW - 150 },
    ]);

    this.drawKeyValueRow([
      { label: 'Date of Starting Const.', value: this.getF('dateStartingConstruction', 'Under-construction'), labelWidth: 150, valueWidth: halfW - 150 },
      { label: 'Expected Life of Structure', value: this.getF('expectedLifeOfStructure', '60-Years'), labelWidth: 150, valueWidth: halfW - 150 },
    ]);

    this.drawKeyValueRow([
      { label: 'Type of Structure', value: this.getF('typeOfStructure', 'RCC'), labelWidth: 130, valueWidth: halfW - 130 },
      { label: 'Number of Floors', value: this.getF('noOfFloors', ''), labelWidth: 130, valueWidth: halfW - 130 },
    ]);

    this.drawKeyValueRow([
      { label: 'Plot Area as per Deed/ROR', value: this.getF('plotAreaSqft', '') ? `${this.getF('plotAreaSqft', '')} Sqft` : '', labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Quality of Construction', value: this.getF('qualityOfConstruction', 'Good'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    // Floorwise BUA Table
    this.advanceCursor(4);
    this.drawTataSubHeader('FLOORWISE BUILT-UP AREA (BUA) COMPARISON');

    const buaColW = CONTENT_W / 4;
    this.drawKeyValueRow([
      { label: 'Floor Level', value: '', labelWidth: buaColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Approved BUA (Sqft)', value: '', labelWidth: buaColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual BUA (Sqft)', value: '', labelWidth: buaColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Deviation (Sqft)', value: '', labelWidth: buaColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const floors = [
      { name: 'Ground Floor', app: this.getF('buaGfApp', ''), act: this.getF('buaGfAct', '') },
      { name: 'First Floor', app: this.getF('buaFfApp', 'NA'), act: this.getF('buaFfAct', 'NA') },
      { name: 'Total BUA', app: this.getF('buaTotalApp', ''), act: this.getF('buaTotalAct', ''), isTotal: true },
    ];

    floors.forEach(f => {
      const appNum = parseSafeFloat(f.app);
      const actNum = parseSafeFloat(f.act);
      const dev = f.app === 'NA' || f.act === 'NA' ? 'NA' : String(actNum - appNum);
      this.drawKeyValueRow([
        { label: f.name, value: '', labelWidth: buaColW, valueWidth: 0, labelBold: !!f.isTotal },
        { label: '', value: f.app, labelWidth: 0, valueWidth: buaColW, valueBold: !!f.isTotal },
        { label: '', value: f.act, labelWidth: 0, valueWidth: buaColW, valueBold: !!f.isTotal },
        { label: '', value: dev, labelWidth: 0, valueWidth: buaColW, valueBold: !!f.isTotal },
      ]);
    });

    // Side Margins Table
    this.advanceCursor(4);
    this.drawTataSubHeader('SIDE MARGINS / SETBACKS');

    const smColW = CONTENT_W / 5;
    this.drawKeyValueRow([
      { label: 'Description', value: '', labelWidth: smColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Front', value: '', labelWidth: smColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Left', value: '', labelWidth: smColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Right', value: '', labelWidth: smColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rear', value: '', labelWidth: smColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Actual at Site', value: '', labelWidth: smColW, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('marginFront', ''), labelWidth: 0, valueWidth: smColW },
      { label: '', value: this.getF('marginLeft', ''), labelWidth: 0, valueWidth: smColW },
      { label: '', value: this.getF('marginRight', ''), labelWidth: 0, valueWidth: smColW },
      { label: '', value: this.getF('marginRear', ''), labelWidth: 0, valueWidth: smColW },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 4: VALUATION & CALCULATIONS
    // ═══════════════════════════════════════════════
    this.drawTataSectionHeader('Valuation & Financial Computations');

    const landArea = parseSafeFloat(this.getF('landAreaSqft', 0));
    const landRate = parseSafeFloat(this.getF('landMarketRate', 0));
    const landVal = multiplyExactDecimals(landArea, landRate);

    const constrArea = parseSafeFloat(this.getF('leastBuaConsidered', 0));
    const constrRate = parseSafeFloat(this.getF('recommendedConstructionRate', 0));
    const constrVal = multiplyExactDecimals(constrArea, constrRate);

    const completionVal = sumDecimals([landVal, constrVal]);

    const stagePct = parseSafeFloat(this.getF('percentWorkCompleted', '0'));
    const stageConstVal = calculatePercentageValue(constrVal, stagePct);
    const currentVal = sumDecimals([landVal, stageConstVal]);

    const govtLandRate = parseSafeFloat(this.getF('govtLandRatePerSqft', 0));
    const govtLandVal = multiplyExactDecimals(landArea, govtLandRate);

    const govtConstrRate = parseSafeFloat(this.getF('govtConstructionRate', 0));
    const govtConstrVal = multiplyExactDecimals(constrArea, govtConstrRate);

    const govtTotalVal = sumDecimals([govtLandVal, govtConstrVal]);

    this.drawTataSubHeader('A. LAND MARKET VALUATION');
    this.drawKeyValueRow([
      { label: 'Land Area (Sqft)', value: `${landArea.toLocaleString('en-IN')} Sqft`, labelWidth: 150, valueWidth: halfW - 150 },
      { label: 'Adopted Land Rate', value: `Rs. ${landRate.toLocaleString('en-IN')}/- per Sqft`, labelWidth: 150, valueWidth: halfW - 150 },
    ]);
    this.drawKeyValueRow([
      { label: 'Total Land Value (A)', value: `Rs. ${formatIndianCurrency(landVal)}/-`, labelWidth: 180, valueWidth: CONTENT_W - 180, labelBold: true, valueBold: true },
    ]);

    this.advanceCursor(4);
    this.drawTataSubHeader('B. CONSTRUCTION VALUATION & STAGE COMPLETION');
    this.drawKeyValueRow([
      { label: 'Least BUA Considered (Sqft)', value: `${constrArea.toLocaleString('en-IN')} Sqft`, labelWidth: 170, valueWidth: halfW - 170 },
      { label: 'Recommended Cost/Sqft', value: `Rs. ${constrRate.toLocaleString('en-IN')}/-`, labelWidth: 150, valueWidth: halfW - 150 },
    ]);
    this.drawKeyValueRow([
      { label: 'Recommended Construction Cost (B)', value: `Rs. ${formatIndianCurrency(constrVal)}/-`, labelWidth: 200, valueWidth: CONTENT_W - 200, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Material & Finishing Details', value: this.getF('materialFinishingDetails', 'Marble flooring, Flush door, Aluminum Panel window, Distempering, weather coat, Bore well etc.'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Total Value on 100% Completion (A + B)', value: `Rs. ${formatIndianCurrency(completionVal)}/-`, labelWidth: 240, valueWidth: CONTENT_W - 240, labelBold: true, valueBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Percentage of Work Completed', value: `${stagePct}%`, labelWidth: 170, valueWidth: halfW - 170 },
      { label: 'Disbursement Recommended', value: `${this.getF('percentDisbursementRecommended', '55')}%`, labelWidth: 170, valueWidth: halfW - 170, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'CURRENT VALUE OF PROPERTY (Land + Stage Constr)', value: `Rs. ${formatIndianCurrency(currentVal)}/-`, labelWidth: 260, valueWidth: CONTENT_W - 260, labelBold: true, valueBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Current Value in Words', value: rupeesInWords(currentVal), labelWidth: 150, valueWidth: CONTENT_W - 150, labelBold: true },
    ]);

    this.advanceCursor(4);
    this.drawTataSubHeader('C. GOVERNMENT VALUATION');
    this.drawKeyValueRow([
      { label: 'Govt. Land Value', value: `Rs. ${formatIndianCurrency(govtLandVal)}/-  (@ Rs. ${govtLandRate}/Sqft)`, labelWidth: 150, valueWidth: halfW - 150 },
      { label: 'Govt. Construction Cost', value: `Rs. ${formatIndianCurrency(govtConstrVal)}/-  (@ Rs. ${govtConstrRate}/Sqft)`, labelWidth: 150, valueWidth: halfW - 150 },
    ]);
    this.drawKeyValueRow([
      { label: 'Total Government Value', value: `Rs. ${formatIndianCurrency(govtTotalVal)}/-`, labelWidth: 180, valueWidth: CONTENT_W - 180, labelBold: true, valueBold: true },
    ]);

    this.advanceCursor(6);

    // ═══════════════════════════════════════════════
    // SECTION 5: REMARKS & DUE DILIGENCE
    // ═══════════════════════════════════════════════
    this.drawTataSectionHeader('Remarks & Due Diligence');

    this.drawKeyValueRow([
      { label: 'Valuation Synthesis Remarks', value: this.getF('synthesisRemarks', ''), labelWidth: 160, valueWidth: CONTENT_W - 160, labelBold: true },
    ]);

    this.advanceCursor(4);
    this.drawTataSubHeader('DUE DILIGENCE CHECKLIST');

    const ddItems = [
      { num: '1', q: 'Copy of approved Plans by Appropriate authority', val: this.getF('ddApprovedPlans', 'Available') },
      { num: '2', q: 'Property identification possible with available documents', val: this.getF('ddIdentificationPossible', 'Available') },
      { num: '3', q: 'Ownership Matrix for property, share of ownership & identification', val: this.getF('ddOwnershipMatrix', 'Available') },
      { num: '4', q: 'Conversion of Land by District Collector for current use', val: this.getF('ddLandConversion', 'Available') },
      { num: '5', q: 'Does property fall in Negative Property List?', val: this.getF('ddNegativeList', 'No') },
      { num: '6', q: 'Property constructed as per local Bye Laws', val: this.getF('ddLocalByeLaws', 'Yes') },
      { num: '7', q: 'Risk of Demolition', val: this.getF('ddDemolitionRisk', 'Low') },
    ];

    ddItems.forEach(item => {
      this.drawKeyValueRow([
        { label: `${item.num}. ${item.q}`, value: item.val, labelWidth: CONTENT_W - 100, valueWidth: 100, valueBold: true },
      ]);
    });

    this.advanceCursor(8);
    this.checkPageBreak(50);

    this.drawKeyValueRow([
      {
        label: `Person Visited Site: ${this.getF('personVisitedSite', 'Er. Satyajit Mohanty')}\nDate of Inspection: ${this.getF('dateOfInspection', '')}`,
        value: `For: ${this.getF('valuationAgency', 'M/s. S Mohanty Associates')}\n\n\n\nEr. Satyajit Mohanty\nApproved Valuer / Chartered Engineer`,
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
      await this.drawMapGallery(maps, 'LOCATION ROUTE & REVENUE MOUZA MAPS');
    }

    if (this.fields.propertyImages && this.fields.propertyImages.length > 0) {
      await this.drawPhotoGrid(this.fields.propertyImages);
    }
  }
}

export default PDFTataHousingFinanceRenderer;
