import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFSammunatiFinanceRenderer extends PDFBankRenderer {
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

  private drawSammunatiHeader(title: string) {
    this.drawSectionHeader(title);
  }

  private drawSammunatiRow(num: string, label: string, value: string, boldVal: boolean = false) {
    const numW = 24;
    const labelW = 210;
    const valW = CONTENT_W - numW - labelW;

    this.drawKeyValueRow([
      {
        label: num,
        value: '',
        labelWidth: numW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: label,
        value: value || 'NA',
        labelWidth: labelW,
        valueWidth: valW,
        labelBold: false,
        bold: boldVal,
      },
    ]);
  }

  async drawContent(): Promise<void> {
    // ══════════════════════════════════════════
    // TOP COVER / HEADER
    // ══════════════════════════════════════════
    this.drawCenteredTitle('ANNEXURE - II', 11, true);
    this.advanceCursor(2);
    this.drawCenteredTitle('VALUATION REPORT', 14, true);
    this.drawCenteredTitle('(SAMMUNATI FINANCIAL INTERMEDIATION & SERVICES PVT. LTD.)', 10, true);
    this.advanceCursor(4);

    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: 'REF. NO.:', value: this.getF('refNo', this.projectCode ? `SAM/${this.projectCode}` : 'NA'), labelWidth: 80, valueWidth: halfW - 80, labelBold: true, bold: true },
      { label: 'DATE OF VALUATION:', value: this.getF('valuationDate', 'NA'), labelWidth: 140, valueWidth: halfW - 140, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'NAME OF CUSTOMER:', value: this.getF('customerName', 'NA'), labelWidth: 140, valueWidth: halfW - 140, labelBold: true, bold: true },
      { label: 'DOCUMENT HOLDER:', value: this.getF('docHolderName', 'NA'), labelWidth: 140, valueWidth: halfW - 140, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'PROPERTY ADDRESS:', value: this.getF('propertyAddressDocs', 'NA'), labelWidth: 140, valueWidth: CONTENT_W - 140, labelBold: true },
    ]);

    const totalVal = this.getF('totalPropertyValue', '0');
    const distressVal = this.getF('forcedSaleValue', '0');
    this.drawKeyValueRow([
      { label: 'TOTAL MARKET VALUE:', value: `Rs. ${formatIndianCurrency(totalVal)}/-`, labelWidth: 150, valueWidth: halfW - 150, labelBold: true, bold: true },
      { label: 'DISTRESS SALE VALUE:', value: `Rs. ${formatIndianCurrency(distressVal)}/-`, labelWidth: 150, valueWidth: halfW - 150, labelBold: true, bold: true },
    ]);

    this.advanceCursor(5);

    // ══════════════════════════════════════════
    // SECTION 1: GENERAL DETAILS
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('1. GENERAL DETAILS');
    this.drawSammunatiRow('1.1', 'Name of the customer', this.getF('customerName', 'NA'), true);
    this.drawSammunatiRow('1.2', 'Request received from', this.getF('requestReceivedFrom', 'Sammunati Financial Intermediation & Services Pvt Ltd'));
    this.drawSammunatiRow('1.3', 'Name of document holder (as per sale deed)', this.getF('docHolderName', 'NA'), true);
    this.drawSammunatiRow('1.4', 'Property address (as per request)', this.getF('propertyAddressRequest', 'NA'));
    this.drawSammunatiRow('1.5', 'Property address (on inspection)', this.getF('propertyAddressInspection', 'NA'));
    this.drawSammunatiRow('1.6', 'Property address (as per docs)', this.getF('propertyAddressDocs', 'NA'));
    this.drawSammunatiRow('1.7', 'Landmark', this.getF('landmark', 'NA'));
    this.drawSammunatiRow('1.8', 'Date of inspection', this.getF('inspectionDate', 'NA'));
    this.drawSammunatiRow('1.9', 'Contact person / Representative met', this.getF('contactPersonMet', 'NA'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 2: SURROUNDING LOCALITY & BOUNDARIES
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('2. SURROUNDING LOCALITY & BOUNDARIES');
    this.drawSammunatiRow('2.1', 'Ward no. / Municipal / GP area', this.getF('wardNo', 'NA'));
    this.drawSammunatiRow('2.2', 'Vicinity / Area type', this.getF('vicinity', 'NA'));
    this.drawSammunatiRow('2.3', 'Classification of locality', this.getF('classificationOfLocality', 'NA'));
    this.drawSammunatiRow('2.4', 'Proximity to civic amenities', `Railway Station: ${this.getF('proximityRailway', 'NA')} | Bus Stop: ${this.getF('proximityBus', 'NA')} | Hospital: ${this.getF('proximityHospital', 'NA')}`);
    this.drawSammunatiRow('2.5', 'Condition & width of approach road', this.getF('approachRoadCondition', 'NA'));
    this.drawSammunatiRow('2.6', 'Plot demarcated at site', this.getF('plotDemarcated', 'NA'));
    this.drawSammunatiRow('2.7', 'Property identified through', this.getF('propertyIdentifiedThrough', 'NA'));

    this.advanceCursor(2);
    this.drawSammunatiHeader('Boundaries Schedule');
    const bColW = CONTENT_W / 3;
    this.drawKeyValueRow([
      { label: 'Direction', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true },
      { label: 'As per Sale Deed', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true },
      { label: 'Actual at Site', value: '', labelWidth: bColW, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'East by:', value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryEastDeed', 'NA'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryEastActual', 'NA'), value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'West by:', value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryWestDeed', 'NA'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryWestActual', 'NA'), value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'North by:', value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryNorthDeed', 'NA'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryNorthActual', 'NA'), value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'South by:', value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundarySouthDeed', 'NA'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundarySouthActual', 'NA'), value: '', labelWidth: bColW, valueWidth: 0 },
    ]);

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 3: PROPERTY DETAILS & USAGE
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('3. PROPERTY DETAILS & USAGE');
    this.drawSammunatiRow('3.1', 'Description of property', this.getF('propertyDescription', 'NA'));
    this.drawSammunatiRow('3.2', 'Type of property', this.getF('propertyType', 'NA'));
    this.drawSammunatiRow('3.3', 'Type of usage of entire property', this.getF('propertyUsage', 'NA'));
    this.drawSammunatiRow('3.4', 'Accommodation details', this.getF('accommodationDetails', 'NA'));
    this.drawSammunatiRow('3.5', 'Additional amenities', this.getF('additionalAmenities', 'NA'));
    this.drawSammunatiRow('3.6', 'Area of property (Actual at site)', `${this.getF('actualArea', 'NA')} Sq. ft`, true);
    this.drawSammunatiRow('3.7', 'Carpet area (approx)', `${this.getF('carpetArea', 'NA')} Sq. ft`);
    this.drawSammunatiRow('3.8', 'Built up / Saleable area', `${this.getF('builtUpArea', 'NA')} Sq. ft`);
    this.drawSammunatiRow('3.9', 'Permitted area as per byelaws', this.getF('permittedArea', 'NA'));
    this.drawSammunatiRow('3.10', 'Area as per sale agreement / deed', `${this.getF('areaAsPerDeed', 'NA')} Sq. ft`);
    this.drawSammunatiRow('3.11', 'Adherence to sanction plan', this.getF('adherenceSanction', 'NA'));
    this.drawSammunatiRow('3.12', 'Deviation from sanction plan / byelaws', this.getF('deviationDetails', 'NA'));
    this.drawSammunatiRow('3.13', 'Risk of demolition (Valuer’s view)', this.getF('demolitionRisk', 'NA'));
    this.drawSammunatiRow('3.14', 'Property occupied by', this.getF('occupiedBy', 'NA'));
    this.drawSammunatiRow('3.15', 'If self-occupied, then since when', this.getF('occupiedSince', 'NA'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 4: TENURE, LEGAL & SOCIETY DETAILS
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('4. TENURE, LEGAL & SOCIETY DETAILS');
    this.drawSammunatiRow('4.1', 'Land tenure (Freehold / Leasehold)', this.getF('landTenure', 'NA'), true);
    this.drawSammunatiRow('4.2', 'Approvals from Municipal / GP / OC / ULC', this.getF('approvalDetails', 'NA'));
    this.drawSammunatiRow('4.3', 'Name of Co-op Society / Company / FPO', this.getF('societyName', 'NA'));
    this.drawSammunatiRow('4.4', 'Registration No. / CIN of entity', this.getF('societyRegNo', 'NA'));
    this.drawSammunatiRow('4.5', 'No. of shares held & certificate details', this.getF('sharesDetails', 'NA'));
    this.drawSammunatiRow('4.6', 'Maintenance / Outgoes per month', this.getF('monthlyOutgoes', 'NA'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 5: STRUCTURAL & SPECIFICATIONS
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('5. STRUCTURAL & CONSTRUCTION DETAILS');
    this.drawSammunatiRow('5.1', 'Type of structure', this.getF('structureType', 'NA'));
    this.drawSammunatiRow('5.2', 'Number of floors / wings', this.getF('floorsWings', 'NA'));
    this.drawSammunatiRow('5.3', 'Flats / units on each floor', this.getF('flatsPerFloor', 'NA'));
    this.drawSammunatiRow('5.4', 'Age of the property / building', this.getF('buildingAge', 'NA'));
    this.drawSammunatiRow('5.5', 'Estimated future economic life', this.getF('futureLife', 'NA'));
    this.drawSammunatiRow('5.6', 'Quality of construction (Exterior / Interior)', this.getF('constructionQuality', 'NA'));
    this.drawSammunatiRow('5.7', 'Unit composition & fittings', this.getF('unitDetails', 'NA'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 6: VALUATION, COSTING & DECLARATIONS
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('6. VALUATION, COSTING & DECLARATIONS');
    this.drawSammunatiRow('6.1', 'Area considered for valuation', `${this.getF('areaConsidered', '0')} Sq. ft`, true);
    this.drawSammunatiRow('6.2', 'Market prevailing rate in locality', this.getF('prevailingMarketRate', 'NA'));
    this.drawSammunatiRow('6.3', 'Inquiries made from', this.getF('inquiriesSource', 'NA'));

    this.advanceCursor(2);
    this.drawSammunatiHeader('Valuation Computation Breakdown');

    const vColW = CONTENT_W / 4;
    this.drawKeyValueRow([
      { label: 'Component', value: 'Area (Sq.ft)', labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
      { label: 'Adopted Rate', value: 'Total Value (Rs.)', labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
    ]);

    const landArea = parseFloat(this.getF('landAreaVal', '0')) || 0;
    const landRate = parseFloat(this.getF('landRateVal', '0')) || 0;
    const landVal = landArea * landRate;

    const bldArea = parseFloat(this.getF('bldAreaVal', '0')) || 0;
    const bldRate = parseFloat(this.getF('bldRateVal', '0')) || 0;
    const bldVal = bldArea * bldRate;

    const totalValNum = landVal + bldVal;
    const distressValNum = Math.round(totalValNum * 0.8);
    const insuranceValNum = Math.round(totalValNum * 0.85);

    this.drawKeyValueRow([
      { label: 'Land Component', value: `${landArea} Sq.ft`, labelWidth: vColW, valueWidth: vColW, bold: true },
      { label: `Rs. ${landRate}/- sq.ft`, value: `Rs. ${formatIndianCurrency(landVal)}/-`, labelWidth: vColW, valueWidth: vColW, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Building Component (after dep.)', value: `${bldArea} Sq.ft`, labelWidth: vColW, valueWidth: vColW },
      { label: `Rs. ${bldRate}/- sq.ft`, value: `Rs. ${formatIndianCurrency(bldVal)}/-`, labelWidth: vColW, valueWidth: vColW },
    ]);
    this.drawKeyValueRow([
      { label: 'TOTAL FAIR MARKET VALUE (A + B)', value: `${landArea + bldArea} Sq.ft`, labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
      { label: '-', value: `Rs. ${formatIndianCurrency(totalValNum)}/-`, labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
    ]);

    this.advanceCursor(3);
    this.drawSammunatiRow('6.4', 'Fair Market Value (in words)', `Rupees ${rupeesInWords(totalValNum)} Only`, true);
    this.drawSammunatiRow('6.5', 'Realizable / Mortgage Value', `Rs. ${formatIndianCurrency(totalValNum)}/-`, true);
    this.drawSammunatiRow('6.6', 'Forced / Distress Sale Value (80%)', `Rs. ${formatIndianCurrency(distressValNum)}/- (Rupees ${rupeesInWords(distressValNum)} Only)`, true);
    this.drawSammunatiRow('6.7', 'Replacement Value for Insurance', `Rs. ${formatIndianCurrency(insuranceValNum)}/-`);

    this.advanceCursor(3);
    this.drawSammunatiHeader('Marketability Assessment');
    this.drawSammunatiRow('6.8', 'Marketability for sale', this.getF('marketabilitySale', 'NA'));
    this.drawSammunatiRow('6.9', 'Marketability for lease / rental', this.getF('marketabilityLease', 'NA'));
    this.drawSammunatiRow('6.10', 'Volatility of property prices', this.getF('priceVolatility', 'NA'));

    this.advanceCursor(3);
    this.drawSammunatiHeader('Disclosure Statement & Valuer Declaration');
    const inspectionDateStr = this.getF('inspectionDate', '');
    const declarations = [
      '1. Statements of facts presented in this report are true and correct to the best of our knowledge.',
      '2. We (valuer) have no direct or indirect interest in the property or transaction.',
      '3. Valuation is independent and compensation is not contingent upon reporting a predetermined value.',
      `4. Site inspection was carried out personally by qualified site engineer${inspectionDateStr ? ` on ${inspectionDateStr}` : ''}.`,
      '5. Title and legal ownership papers must be verified by the lending institution’s legal advocate.',
      '6. Validity of this report is 45 days from the date of issue.',
    ];
    declarations.forEach(dec => {
      this.drawKeyValueRow([
        { label: dec, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    this.advanceCursor(4);
    this.drawKeyValueRow([
      { label: 'PLACE:', value: 'Bhubaneswar, Odisha', labelWidth: 60, valueWidth: halfW - 60, labelBold: true },
      { label: 'DATE:', value: this.getF('inspectionDate', 'NA'), labelWidth: 60, valueWidth: halfW - 60, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'VALUER:', value: 'S. MOHANTY & ASSOCIATES (Approved Valuers & Chartered Engineers)', labelWidth: 60, valueWidth: CONTENT_W - 60, labelBold: true, bold: true },
    ]);

    // ══════════════════════════════════════════
    // ATTACHMENT SECTIONS (SECTIONS 7, 8, 9)
    // ══════════════════════════════════════════
    const docs = this.fields.documentImages || this.fields.documents || [];
    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }

    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.sketchMapImages || []),
      ...(this.fields.maps || []),
    ];
    if (maps && maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION MAP & SKETCH');
    }

    const photos = this.fields.propertyImages || this.fields.photographs || [];
    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PHOTOGRAPHS');
    }
  }
}
