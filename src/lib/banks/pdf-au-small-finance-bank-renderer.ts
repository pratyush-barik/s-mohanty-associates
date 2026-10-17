import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFAUSmallFinanceBankRenderer extends PDFBankRenderer {
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

  private drawAUHeader(title: string) {
    this.drawSectionHeader(title);
  }

  private drawAURow(num: string, label: string, value: string, boldVal: boolean = false) {
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
    this.drawCenteredTitle('AU SMALL FINANCE BANK LIMITED', 12, true);
    this.advanceCursor(2);
    this.drawCenteredTitle('TECHNICAL VALUATION REPORT (RETAIL / SME ASSETS)', 14, true);
    this.advanceCursor(4);

    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: 'APPLICATION NO.:', value: this.getF('applicationNo', 'AU-VAL-2026-089'), labelWidth: 120, valueWidth: halfW - 120, labelBold: true, bold: true },
      { label: 'DATE OF TECHNICAL VISIT:', value: this.getF('dateOfTechnicalVisit', '18-07-2026'), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'NAME OF CUSTOMER:', value: this.getF('customerName', 'RAVI RENEWABLES PRIVATE LIMITED'), labelWidth: 140, valueWidth: halfW - 140, labelBold: true, bold: true },
      { label: 'PRODUCT CATEGORY:', value: this.getF('productCategory', 'SME / Commercial Mortgage'), labelWidth: 140, valueWidth: halfW - 140, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'PROPERTY ADDRESS:', value: this.getF('propertyAddressActual', 'Plot No-1680, Khata No-107, Mouza-Raghunathpali, Near Verma Eye Hospital, Dist-Sundargarh, Rourkela, Odisha, Pin-769001'), labelWidth: 140, valueWidth: CONTENT_W - 140, labelBold: true },
    ]);

    const marketVal = this.getF('marketValue', '43585400');
    const distressVal = this.getF('distressValue', '34868320');
    const conservativeVal = this.getF('conservativeValue', '39226860');
    const insurableVal = this.getF('insurableValue', '7660400');

    this.drawKeyValueRow([
      { label: 'FAIR MARKET VALUE:', value: `Rs. ${formatIndianCurrency(marketVal)}/-`, labelWidth: 140, valueWidth: halfW - 140, labelBold: true, bold: true },
      { label: 'QSV / DISTRESS VALUE (80%):', value: `Rs. ${formatIndianCurrency(distressVal)}/-`, labelWidth: 170, valueWidth: halfW - 170, labelBold: true, bold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'CONSERVATIVE VALUE (90%):', value: `Rs. ${formatIndianCurrency(conservativeVal)}/-`, labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'INSURABLE VALUE:', value: `Rs. ${formatIndianCurrency(insurableVal)}/-`, labelWidth: 140, valueWidth: halfW - 140, labelBold: true },
    ]);

    this.advanceCursor(5);

    // ══════════════════════════════════════════
    // SECTION 1: INFORMATION SHARED DURING ASSIGNMENT
    // ══════════════════════════════════════════
    this.drawAUHeader('1. INFORMATION SHARED DURING ASSIGNMENT OF VALUATION');
    this.drawAURow('1.1', 'Name of Customer / Co-Applicant', this.getF('customerName', 'RAVI RENEWABLES PRIVATE LIMITED'), true);
    this.drawAURow('1.2', 'Contact No. of Customer', this.getF('contactNo', '9937023855 / 9310163176'));
    this.drawAURow('1.3', 'Ownership as per Documents', this.getF('ownershipAsPerDocs', 'Ravi Renewables Private Limited, represented by Director'));
    this.drawAURow('1.4', 'Purpose of Valuation', this.getF('purposeOfValuation', 'Fair Market Value for SME Mortgage Credit'));
    this.drawAURow('1.5', 'Leasehold / Freehold Status', this.getF('leaseOrFreehold', 'Freehold'), true);
    this.drawAURow('1.6', 'Occupation Status', this.getF('occupationStatus', 'Occupied by Relative / Commercial Use'));
    this.drawAURow('1.7', 'Documents Provided for Valuation', this.getF('documentsProvided', 'Copy of Sale deed No -11712600556, DATED-09/04/2026, ROR, Approved Layout Plan, Bhu-Naksha'));
    this.drawAURow('1.8', 'Property Address (as per actual)', this.getF('propertyAddressActual', 'Plot No-1680, Khata No-107, Mouza-Raghunathpali, Near Verma Eye Hospital, Dist-Sundargarh, Rourkela, Odisha, Pin-769001'));
    this.drawAURow('1.9', 'Property Address (as per docs)', this.getF('propertyAddressDocs', 'Plot No-1680, Khata No-107, Mouza-Raghunathpali, Tahasil-Panposh, Dist-Sundargarh, Odisha'));
    this.drawAURow('1.10', 'Pincode & Sub Registrar Office', `PIN: ${this.getF('pincode', '769001')} | SRO: ${this.getF('subRegistrarOffice', 'Panposh / Rourkela')}`);
    this.drawAURow('1.11', 'Allocated by (RO / BM)', this.getF('allocatedBy', 'AU Small Finance Bank, Rourkela Branch'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 2: LOCALITY DETAILS
    // ══════════════════════════════════════════
    this.drawAUHeader('2. LOCALITY DETAILS');
    this.drawAURow('2.1', 'Type of Locality', this.getF('localityType', 'Commercial / Semi-Commercial Hub'));
    this.drawAURow('2.2', 'Locality Classification', this.getF('localityClass', 'Middle Class / Commercial Belt'));
    this.drawAURow('2.3', 'Total Development in Area / Locality', `${this.getF('developmentPercentage', '80')}% developed`);
    this.drawAURow('2.4', 'Distance from AU Base Branch', `${this.getF('distanceFromBranch', '0.9')} KM`);
    this.drawAURow('2.5', 'Nearest Civic Amenities', `Railway: ${this.getF('nearestRailway', 'Rourkela Railway Station (2.5 KM)')} | Bus Stand: ${this.getF('nearestBus', 'Panposh Bus Stand (1.0 KM)')} | Hospital: ${this.getF('nearestHospital', 'Verma Eye Hospital (0.1 KM)')}`);
    this.drawAURow('2.6', 'Approach Road Width & Surface', `${this.getF('approachRoadWidth', '40')} Feet Wide | Surface: ${this.getF('approachRoadType', 'Bitumen Road')}`);
    this.drawAURow('2.7', 'Nearby Landmark', this.getF('landmark', 'Near Verma Eye Hospital, Raghunathpali'));
    this.drawAURow('2.8', 'Hazard Zones (Seismic / Flood / Cyclone)', `Seismic: ${this.getF('seismicZone', 'Zone III')} | Flood: ${this.getF('floodZone', 'Safe / Non-flood')} | Cyclone: ${this.getF('cycloneZone', 'Moderate')}`);
    this.drawAURow('2.9', 'Any Negative to Locality', this.getF('negativesToLocality', 'None observed (No crematorium, slum, chemical hazard or high tension wire nearby)'));
    this.drawAURow('2.10', 'Basic Amenities Availability', this.getF('basicAmenitiesAvailable', 'Yes, water, electricity, cemented drainage and telecommunication available'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 3: PROPERTY DETAILS, BOUNDARIES & DIMENSIONS
    // ══════════════════════════════════════════
    this.drawAUHeader('3. PROPERTY DETAILS, DIMENSIONS & BOUNDARIES');
    this.drawAURow('3.1', 'Area of Land', `${this.getF('landAreaSqft', '2395')} Sq.ft (${this.getF('landAreaSqm', '222.5')} Sq.m / ${this.getF('landAreaSqyd', '266.11')} Sq.yd)`, true);
    this.drawAURow('3.2', 'Property Usage & Nature', `${this.getF('propertyUsage', 'Commercial Building')} | Nature: ${this.getF('natureOfConstruction', 'RCC Framed Structure (G+2)')}`);
    this.drawAURow('3.3', 'Age of Property & Residual Life', `Age: ${this.getF('propertyAge', '10')} Years | Residual Age: ${this.getF('residualAge', '50')} Years`);
    this.drawAURow('3.4', 'Occupancy Details', `Occupant: ${this.getF('occupantName', 'Relative of Director')} | Status: ${this.getF('occupancyStatusDetailed', 'Commercial / Warehouse cum Office')}`);
    this.drawAURow('3.5', 'Plot Demarcated at Site', this.getF('plotDemarcated', 'Yes, fully demarcated on all four boundaries'));
    this.drawAURow('3.6', 'Property Identified Through', this.getF('propertyIdentifiedThrough', 'Boundary verification, ROR, Sale Deed & Local enquiry'));

    this.advanceCursor(2);
    this.drawAUHeader('Dimension & Boundaries Schedule');
    const sColW = CONTENT_W / 4;
    this.drawKeyValueRow([
      { label: 'Side', value: 'Dimension (Doc)', labelWidth: sColW, valueWidth: sColW, labelBold: true },
      { label: 'Boundary (As per Deed)', value: 'Actual at Site', labelWidth: sColW, valueWidth: sColW, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'North:', value: `${this.getF('dimensionNorthDoc', '50')} ft`, labelWidth: sColW, valueWidth: sColW },
      { label: this.getF('boundaryNorthDeed', 'Plot No-1681'), value: this.getF('boundaryNorthActual', 'Plot No-1681'), labelWidth: sColW, valueWidth: sColW },
    ]);
    this.drawKeyValueRow([
      { label: 'South:', value: `${this.getF('dimensionSouthDoc', '50')} ft`, labelWidth: sColW, valueWidth: sColW },
      { label: this.getF('boundarySouthDeed', '40ft Wide Main Road'), value: this.getF('boundarySouthActual', '40ft Wide Main Road'), labelWidth: sColW, valueWidth: sColW },
    ]);
    this.drawKeyValueRow([
      { label: 'East:', value: `${this.getF('dimensionEastDoc', '48')} ft`, labelWidth: sColW, valueWidth: sColW },
      { label: this.getF('boundaryEastDeed', 'Plot No-1679'), value: this.getF('boundaryEastActual', 'Plot No-1679'), labelWidth: sColW, valueWidth: sColW },
    ]);
    this.drawKeyValueRow([
      { label: 'West:', value: `${this.getF('dimensionWestDoc', '48')} ft`, labelWidth: sColW, valueWidth: sColW },
      { label: this.getF('boundaryWestDeed', 'Plot No-1682'), value: this.getF('boundaryWestActual', 'Plot No-1682'), labelWidth: sColW, valueWidth: sColW },
    ]);

    this.advanceCursor(2);
    this.drawAURow('3.7', 'Stage of Construction & Progress', `Stage: ${this.getF('stageOfConstruction', '100% Completed')} | Work Complete: ${this.getF('workCompletePercentage', '100')}%`);
    this.drawAURow('3.8', 'Built-up Area Breakdown', `GF: ${this.getF('buaGF', '1200')} sqft | FF: ${this.getF('buaFF', '1200')} sqft | SF: ${this.getF('buaSF', '1082')} sqft | Total BUA: ${this.getF('totalBUA', '3482')} sqft`, true);

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 4: SPECIFICATION & MAINTENANCE
    // ══════════════════════════════════════════
    this.drawAUHeader('4. SPECIFICATION & MAINTENANCE');
    this.drawAURow('4.1', 'Type of Structure', this.getF('structureType', 'RCC Framed Structure (G+2 Floors)'), true);
    this.drawAURow('4.2', 'Foundation / Roof / Flooring', `Foundation: ${this.getF('foundationType', 'Column & Footing')} | Roof: ${this.getF('roofType', 'RCC Slab')} | Flooring: ${this.getF('flooringType', 'Vitrified Tiles & Kota Stone')}`);
    this.drawAURow('4.3', 'Quality of Construction', `Exterior: ${this.getF('qualityExterior', 'Good')} | Interior: ${this.getF('qualityInterior', 'Good')}`);
    this.drawAURow('4.4', 'Maintenance Levels', this.getF('maintenanceLevel', 'Well Maintained / Good'));
    this.drawAURow('4.5', 'Setbacks Observed', `Front: ${this.getF('setbackFront', '10 ft')} | Back: ${this.getF('setbackBack', '5 ft')} | Sides: ${this.getF('setbackSides', '3 ft / 3 ft')}`);
    this.drawAURow('4.6', 'Adherence to Local Authority Byelaws', this.getF('adherenceSanction', 'Constructed generally in adherence to local municipal building byelaws'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 5: POLICY CHECKS & NEGATIVE TRIGGERS
    // ══════════════════════════════════════════
    this.drawAUHeader('5. POLICY CHECKS & NEGATIVE TRIGGERS');
    this.drawAURow('5.1', 'Age > 45 Years Check', this.getF('checkAge45', 'No (Property age is ~10 years)'));
    this.drawAURow('5.2', 'Development < 30% Area Check', this.getF('checkDevelopment30', 'No (Area development is ~80%)'));
    this.drawAURow('5.3', 'Legal vs Actual Area Mismatch > 20%', this.getF('checkAreaMismatch20', 'No (Document area matches physical possession at site)'));
    this.drawAURow('5.4', 'Valuer Selfie with Property Available', this.getF('checkValuerSelfie', 'Yes (Attached in report annexure)'), true);
    this.drawAURow('5.5', 'Property Approach Road < 5 Ft', this.getF('checkRoadUnder5Ft', 'No (Road width is 40 ft)'));
    this.drawAURow('5.6', 'Direct Physical Access Available', this.getF('checkDirectAccess', 'Yes, direct approach from 40ft main road'));

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // SECTION 6: VALUATION COMPUTATION & COSTING
    // ══════════════════════════════════════════
    this.drawAUHeader('6. VALUATION COMPUTATION & COSTING');

    const vColW = CONTENT_W / 4;
    this.drawKeyValueRow([
      { label: 'Component', value: 'Area (Sq.ft)', labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
      { label: 'Adopted Rate (Rs.)', value: 'Total Value (Rs.)', labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
    ]);

    const landArea = parseFloat(this.getF('landAreaSqft', '2395')) || 0;
    const dlcRate = parseFloat(this.getF('dlcRate', '6887')) || 0;
    const marketLandRate = parseFloat(this.getF('marketLandRate', '15000')) || 0;
    const totalBUA = parseFloat(this.getF('totalBUA', '3482')) || 0;
    const constRate = parseFloat(this.getF('constructionRate', '2200')) || 0;

    const dlcLandVal = landArea * dlcRate;
    const marketLandVal = landArea * marketLandRate;
    const bldVal = totalBUA * constRate;
    const totalValNum = marketLandVal + bldVal;
    const distressValNum = Math.round(totalValNum * 0.80);
    const conservativeValNum = Math.round(totalValNum * 0.90);
    const insurableValNum = Math.round(bldVal);

    this.drawKeyValueRow([
      { label: 'Land (DLC Govt. Value)', value: `${landArea} Sq.ft`, labelWidth: vColW, valueWidth: vColW },
      { label: `Rs. ${dlcRate}/- sqft`, value: `Rs. ${formatIndianCurrency(dlcLandVal)}/-`, labelWidth: vColW, valueWidth: vColW },
    ]);
    this.drawKeyValueRow([
      { label: 'Land Component (Market Rate)', value: `${landArea} Sq.ft`, labelWidth: vColW, valueWidth: vColW, bold: true },
      { label: `Rs. ${marketLandRate}/- sqft`, value: `Rs. ${formatIndianCurrency(marketLandVal)}/-`, labelWidth: vColW, valueWidth: vColW, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Building Construction (G+2)', value: `${totalBUA} Sq.ft`, labelWidth: vColW, valueWidth: vColW, bold: true },
      { label: `Rs. ${constRate}/- sqft`, value: `Rs. ${formatIndianCurrency(bldVal)}/-`, labelWidth: vColW, valueWidth: vColW, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'TOTAL FAIR MARKET VALUE', value: `${landArea + totalBUA} Sq.ft`, labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
      { label: '-', value: `Rs. ${formatIndianCurrency(totalValNum)}/-`, labelWidth: vColW, valueWidth: vColW, labelBold: true, bold: true },
    ]);

    this.advanceCursor(3);
    this.drawAURow('6.1', 'Fair Market Value (in words)', `Rupees ${rupeesInWords(totalValNum)} Only`, true);
    this.drawAURow('6.2', 'Realizable / Mortgage Value', `Rs. ${formatIndianCurrency(totalValNum)}/-`, true);
    this.drawAURow('6.3', 'QSV / Distress Value (Sale within 60 days)', `Rs. ${formatIndianCurrency(distressValNum)}/- (Rupees ${rupeesInWords(distressValNum)} Only)`, true);
    this.drawAURow('6.4', 'Conservative Value (Sale within 90 days)', `Rs. ${formatIndianCurrency(conservativeValNum)}/-`);
    this.drawAURow('6.5', 'Insurable Value of Structure', `Rs. ${formatIndianCurrency(insurableValNum)}/-`);

    this.advanceCursor(2);
    this.drawAUHeader('Rates Confirmation & Marketability');
    this.drawAURow('6.6', 'Price Confirmed From', this.getF('priceConfirmFrom', 'Local dealers, shop owners and sub-registrar guideline rates'));
    this.drawAURow('6.7', 'Local Realtor / Dealer Contact', this.getF('dealerContact', 'M/s Sharma Estates, Rourkela'));
    this.drawAURow('6.8', 'Marketability Rating', this.getF('marketabilityRating', 'Good (Prime location near Verma Eye Hospital)'));

    this.advanceCursor(3);
    this.drawAUHeader('Valuer Declaration');
    const declarations = [
      '1. We have physically inspected the property on 18-07-2026.',
      '2. We have no direct or indirect interest in the property valued or the transaction.',
      '3. Information furnished above is true and correct to the best of our knowledge and belief.',
      '4. The fair market value indicated is an opinion of value prevailing on the inspection date.',
      '5. This report does not certify or confirm ownership or legal title of the property.',
    ];
    declarations.forEach(dec => {
      this.drawKeyValueRow([
        { label: dec, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    this.advanceCursor(4);
    this.drawKeyValueRow([
      { label: 'PLACE:', value: 'Rourkela / Bhubaneswar', labelWidth: 60, valueWidth: halfW - 60, labelBold: true },
      { label: 'DATE:', value: this.getF('dateOfTechnicalVisit', '18-07-2026'), labelWidth: 60, valueWidth: halfW - 60, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'VALUER:', value: 'S. MOHANTY & ASSOCIATES (Empanelled Valuers & Chartered Engineers)', labelWidth: 60, valueWidth: CONTENT_W - 60, labelBold: true, bold: true },
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
      const lat = this.getF('latitude', '22.227415');
      const lng = this.getF('longitude', '84.853612');
      const mapTitle = `LOCATION MAP (LAT: ${lat}, LONG: ${lng})`;
      await this.drawMapGallery(maps, mapTitle);
    }

    const photos = this.fields.propertyImages || this.fields.photographs || [];
    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PHOTOGRAPHS (INCLUDING VALUER SELFIE AT SITE)');
    }
  }
}
