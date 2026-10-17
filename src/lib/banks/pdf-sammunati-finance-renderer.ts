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
      { label: 'REF. NO.:', value: this.getF('refNo', 'SAM/07-26/01'), labelWidth: 80, valueWidth: halfW - 80, labelBold: true, bold: true },
      { label: 'DATE OF VALUATION:', value: this.getF('valuationDate', '13-07-2026'), labelWidth: 140, valueWidth: halfW - 140, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'NAME OF CUSTOMER:', value: this.getF('customerName', 'Deepak Kumar Nayak'), labelWidth: 140, valueWidth: halfW - 140, labelBold: true, bold: true },
      { label: 'DOCUMENT HOLDER:', value: this.getF('docHolderName', 'Hengula Farmers & Producer Company Limited (Director-Deepak Kumar Nayak)'), labelWidth: 140, valueWidth: halfW - 140, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'PROPERTY ADDRESS:', value: this.getF('propertyAddressDocs', 'Khata no-799/1101, Plot no-692/2391, Mouza-Brahmagiri, Tahasil/PS-Brahmagiri, Dist-Puri, Odisha, Pin-752011'), labelWidth: 140, valueWidth: CONTENT_W - 140, labelBold: true },
    ]);

    const totalVal = this.getF('totalPropertyValue', '10454400');
    const distressVal = this.getF('forcedSaleValue', '8363520');
    this.drawKeyValueRow([
      { label: 'TOTAL MARKET VALUE:', value: `Rs. ${formatIndianCurrency(totalVal)}/-`, labelWidth: 150, valueWidth: halfW - 150, labelBold: true, bold: true },
      { label: 'DISTRESS SALE VALUE:', value: `Rs. ${formatIndianCurrency(distressVal)}/-`, labelWidth: 150, valueWidth: halfW - 150, labelBold: true, bold: true },
    ]);

    this.advanceCursor(5);

    // ══════════════════════════════════════════
    // SECTION 1: GENERAL DETAILS
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('1. GENERAL DETAILS');
    this.drawSammunatiRow('1.1', 'Name of the customer', this.getF('customerName', 'Deepak Kumar Nayak'), true);
    this.drawSammunatiRow('1.2', 'Request received from', this.getF('requestReceivedFrom', 'Samunnati Financial Intermediation & Services Pvt Ltd, through Mr. Satyajit Mohanty'));
    this.drawSammunatiRow('1.3', 'Name of document holder (as per sale deed)', this.getF('docHolderName', 'Hengula Farmers & Producer Company Limited (Director-Deepak Kumar Nayak)'), true);
    this.drawSammunatiRow('1.4', 'Property address (as per request)', this.getF('propertyAddressRequest', 'Khata no-799/1101, Plot no-692/2391, Mouza-Brahmagiri, Tahasil/PS-Brahmagiri, Dist-Puri, Odisha, Pin-752011'));
    this.drawSammunatiRow('1.5', 'Property address (on inspection)', this.getF('propertyAddressInspection', 'Khata no-799/1101, Plot no-692/2391, Mouza-Brahmagiri, Tahasil/PS-Brahmagiri, Dist-Puri, Odisha, Pin-752011'));
    this.drawSammunatiRow('1.6', 'Property address (as per docs)', this.getF('propertyAddressDocs', 'Khata no-799/1101, Plot no-692/2391 (AC.0.200 Decs, Homestead), Mouza-Brahmagiri, Tahasil/PS-Brahmagiri, Dist-Puri, Odisha, Pin-752011'));
    this.drawSammunatiRow('1.7', 'Landmark', this.getF('landmark', 'Near Brahmagiri Bus Stop'));
    this.drawSammunatiRow('1.8', 'Date of inspection', this.getF('inspectionDate', '13-07-2026'));
    this.drawSammunatiRow('1.9', 'Contact person / Representative met', this.getF('contactPersonMet', 'Deepak Kumar Nayak / Representative'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 2: SURROUNDING LOCALITY & BOUNDARIES
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('2. SURROUNDING LOCALITY & BOUNDARIES');
    this.drawSammunatiRow('2.1', 'Ward no. / Municipal / GP area', this.getF('wardNo', 'Brahmagiri GP'));
    this.drawSammunatiRow('2.2', 'Vicinity / Area type', this.getF('vicinity', 'Residential / Commercial / Industrial'));
    this.drawSammunatiRow('2.3', 'Classification of locality', this.getF('classificationOfLocality', 'Middle class'));
    this.drawSammunatiRow('2.4', 'Proximity to civic amenities', `Railway Station: ${this.getF('proximityRailway', 'Puri Railway Station (20 KM)')} | Bus Stop: ${this.getF('proximityBus', 'Brahmagiri Bus Stop (0.5 KM)')} | Hospital: ${this.getF('proximityHospital', 'Brahmagiri CHC (1.0 KM)')}`);
    this.drawSammunatiRow('2.5', 'Condition & width of approach road', this.getF('approachRoadCondition', '20 feet wide paved road'));
    this.drawSammunatiRow('2.6', 'Plot demarcated at site', this.getF('plotDemarcated', 'Yes, clearly demarcated with boundary pillars'));
    this.drawSammunatiRow('2.7', 'Property identified through', this.getF('propertyIdentifiedThrough', 'Sale deed, ROR, site demarcation & neighbor inquiry'));

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
      { label: this.getF('boundaryEastDeed', 'Purnachandra Sahoo & Others'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryEastActual', 'Purnachandra Sahoo & Others'), value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'West by:', value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryWestDeed', '20ft Wide Road'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryWestActual', '20ft Wide Road'), value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'North by:', value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryNorthDeed', 'Pankaj Kumar Nayak'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundaryNorthActual', 'Pankaj Kumar Nayak'), value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'South by:', value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundarySouthDeed', 'Rankanath Nayak'), value: '', labelWidth: bColW, valueWidth: 0 },
      { label: this.getF('boundarySouthActual', 'Rankanath Nayak'), value: '', labelWidth: bColW, valueWidth: 0 },
    ]);

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 3: PROPERTY DETAILS & USAGE
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('3. PROPERTY DETAILS & USAGE');
    this.drawSammunatiRow('3.1', 'Description of property', this.getF('propertyDescription', 'Vacant plot demarcated at site for agro-commercial development'));
    this.drawSammunatiRow('3.2', 'Type of property', this.getF('propertyType', 'Residential / Commercial / Agro-Industrial'));
    this.drawSammunatiRow('3.3', 'Type of usage of entire property', this.getF('propertyUsage', 'Vacant Plot'));
    this.drawSammunatiRow('3.4', 'Accommodation details', this.getF('accommodationDetails', 'NA (Vacant Land)'));
    this.drawSammunatiRow('3.5', 'Additional amenities', this.getF('additionalAmenities', 'Paved access road, electrical line available nearby, clear title'));
    this.drawSammunatiRow('3.6', 'Area of property (Actual at site)', `${this.getF('actualArea', '8712')} Sq. ft (AC. 0.200 Decs)`, true);
    this.drawSammunatiRow('3.7', 'Carpet area (approx)', `${this.getF('carpetArea', 'NA')} Sq. ft`);
    this.drawSammunatiRow('3.8', 'Built up / Saleable area', `${this.getF('builtUpArea', 'NA')} Sq. ft`);
    this.drawSammunatiRow('3.9', 'Permitted area as per byelaws', this.getF('permittedArea', 'As per local building bye-laws'));
    this.drawSammunatiRow('3.10', 'Area as per sale agreement / deed', `${this.getF('areaAsPerDeed', '8712')} Sq. ft`);
    this.drawSammunatiRow('3.11', 'Adherence to sanction plan', this.getF('adherenceSanction', 'Yes / NA (Vacant Land)'));
    this.drawSammunatiRow('3.12', 'Deviation from sanction plan / byelaws', this.getF('deviationDetails', 'Nil / NA'));
    this.drawSammunatiRow('3.13', 'Risk of demolition (Valuer’s view)', this.getF('demolitionRisk', 'Low'));
    this.drawSammunatiRow('3.14', 'Property occupied by', this.getF('occupiedBy', 'Vacant Land (Under possession of customer)'));
    this.drawSammunatiRow('3.15', 'If self-occupied, then since when', this.getF('occupiedSince', 'NA'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 4: TENURE, LEGAL & SOCIETY DETAILS
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('4. TENURE, LEGAL & SOCIETY DETAILS');
    this.drawSammunatiRow('4.1', 'Land tenure (Freehold / Leasehold)', this.getF('landTenure', 'Freehold (Sthitiban / Homestead)'), true);
    this.drawSammunatiRow('4.2', 'Approvals from Municipal / GP / OC / ULC', this.getF('approvalDetails', 'Brahmagiri Gram Panchayat jurisdiction, ROR mutated in record'));
    this.drawSammunatiRow('4.3', 'Name of Co-op Society / Company / FPO', this.getF('societyName', 'Hengula Farmers & Producer Company Limited'));
    this.drawSammunatiRow('4.4', 'Registration No. / CIN of entity', this.getF('societyRegNo', 'U01110OR2020PTC033456'));
    this.drawSammunatiRow('4.5', 'No. of shares held & certificate details', this.getF('sharesDetails', 'NA'));
    this.drawSammunatiRow('4.6', 'Maintenance / Outgoes per month', this.getF('monthlyOutgoes', 'Nil'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 5: STRUCTURAL & SPECIFICATIONS
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('5. STRUCTURAL & CONSTRUCTION DETAILS');
    this.drawSammunatiRow('5.1', 'Type of structure', this.getF('structureType', 'NA (Vacant Land)'));
    this.drawSammunatiRow('5.2', 'Number of floors / wings', this.getF('floorsWings', 'NA'));
    this.drawSammunatiRow('5.3', 'Flats / units on each floor', this.getF('flatsPerFloor', 'NA'));
    this.drawSammunatiRow('5.4', 'Age of the property / building', this.getF('buildingAge', 'NA'));
    this.drawSammunatiRow('5.5', 'Estimated future economic life', this.getF('futureLife', 'NA'));
    this.drawSammunatiRow('5.6', 'Quality of construction (Exterior / Interior)', this.getF('constructionQuality', 'NA (Vacant Plot)'));
    this.drawSammunatiRow('5.7', 'Unit composition & fittings', this.getF('unitDetails', 'NA'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 6: VALUATION, COSTING & DECLARATIONS
    // ══════════════════════════════════════════
    this.drawSammunatiHeader('6. VALUATION, COSTING & DECLARATIONS');
    this.drawSammunatiRow('6.1', 'Area considered for valuation', `${this.getF('areaConsidered', '8712')} Sq. ft`, true);
    this.drawSammunatiRow('6.2', 'Market prevailing rate in locality', this.getF('prevailingMarketRate', 'Rs. 1,000/- to Rs. 1,200/- per Sq. ft'));
    this.drawSammunatiRow('6.3', 'Inquiries made from', this.getF('inquiriesSource', 'Local realtors, property owners and Sub-Registrar guideline value'));

    this.advanceCursor(2);
    this.drawSammunatiHeader('Valuation Computation Breakdown');

    const vColW = CONTENT_W / 4;
    this.drawKeyValueRow([
      { label: 'Component', value: 'Area (Sq.ft)', labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
      { label: 'Adopted Rate', value: 'Total Value (Rs.)', labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
    ]);

    const landArea = parseFloat(this.getF('landAreaVal', '8712')) || 0;
    const landRate = parseFloat(this.getF('landRateVal', '1200')) || 0;
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
    this.drawSammunatiRow('6.8', 'Marketability for sale', this.getF('marketabilitySale', 'Good / High demand for agro-commercial & residential'));
    this.drawSammunatiRow('6.9', 'Marketability for lease / rental', this.getF('marketabilityLease', 'Good / Commercial demand in Brahmagiri'));
    this.drawSammunatiRow('6.10', 'Volatility of property prices', this.getF('priceVolatility', 'Low to Medium'));

    this.advanceCursor(3);
    this.drawSammunatiHeader('Disclosure Statement & Valuer Declaration');
    const declarations = [
      '1. Statements of facts presented in this report are true and correct to the best of our knowledge.',
      '2. We (valuer) have no direct or indirect interest in the property or transaction.',
      '3. Valuation is independent and compensation is not contingent upon reporting a predetermined value.',
      '4. Site inspection was carried out personally by qualified site engineer on 13-07-2026.',
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
      { label: 'DATE:', value: this.getF('inspectionDate', '13-07-2026'), labelWidth: 60, valueWidth: halfW - 60, labelBold: true },
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
