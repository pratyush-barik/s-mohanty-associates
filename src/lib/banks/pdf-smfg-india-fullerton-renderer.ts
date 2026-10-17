import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFSMFGIndiaFullertonRenderer extends PDFBankRenderer {
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

  private drawSMFGHeader(title: string) {
    this.drawSectionHeader(title);
  }

  private drawSMFGRow(num: string, label: string, value: string, boldVal: boolean = false) {
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
    // TOP COVER / SUMMARY BANNER
    // ══════════════════════════════════════════
    this.drawCenteredTitle('VALUATION OF IMMOVABLE PROPERTY', 14, true);
    this.advanceCursor(4);

    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: 'PROPERTY OWNER:', value: this.getF('propertyOwner', 'Biswajit Mishra, S/O-Kailash Chandra Mishra'), labelWidth: 140, valueWidth: halfW - 140, labelBold: true, bold: true },
      { label: 'PURPOSE OF VALUATION:', value: this.getF('purposeOfValuation', 'FAIR MARKET VALUE OF COLLATERAL SECURITY'), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'ADDRESS OF PROPERTY:', value: this.getF('addressAtSite', 'Khata No-521/4110, Plot No-1124/4159, (AC.0.092Decs, Homestead), Mouza-Balukhanda, Tahasil-Puri, PS-Puri Sadar, Dist-Puri, Odisha, Pin-752004'), labelWidth: 140, valueWidth: CONTENT_W - 140, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'PRESENT MARKET VALUE:', value: `Rs. ${formatIndianCurrency(this.getF('marketValue', '10582600'))}/-`, labelWidth: 160, valueWidth: halfW - 160, labelBold: true, bold: true },
      { label: 'DISTRESS SALE VALUE:', value: `Rs. ${formatIndianCurrency(this.getF('distressValue', '8466080'))}/-`, labelWidth: 150, valueWidth: halfW - 150, labelBold: true, bold: true },
    ]);

    this.advanceCursor(4);
    this.drawCenteredTitle('VALUATION REPORT', 12, true);
    this.advanceCursor(3);

    // Meta Header Grid
    this.drawKeyValueRow([
      { label: 'Ref:', value: this.getF('refNo', this.projectCode || '9793169'), labelWidth: 60, valueWidth: halfW - 60, labelBold: true },
      { label: 'Valuer Name:', value: this.getF('valuerName', 'M/s. S MOHANTY ASSOCIATES'), labelWidth: 90, valueWidth: halfW - 90, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Deal No:', value: this.getF('dealNo', 'VAL/FEB/2026/03'), labelWidth: 60, valueWidth: halfW - 60, labelBold: true },
      { label: 'Branch Name:', value: this.getF('branchName', 'SMFG Odisha'), labelWidth: 90, valueWidth: halfW - 90, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Type of Case:', value: this.getF('typeOfCase', 'Mass LAP'), labelWidth: 80, valueWidth: halfW - 80, labelBold: true },
      { label: 'Date of Visit:', value: this.getF('dateOfVisit', '07/02/2026'), labelWidth: 80, valueWidth: halfW - 80, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Initiate:', value: this.getF('dateOfInitiate', '05/02/2025'), labelWidth: 90, valueWidth: halfW - 90, labelBold: true },
      { label: 'Date of Report:', value: this.getF('dateOfReport', '09/02/2026'), labelWidth: 90, valueWidth: halfW - 90, labelBold: true },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Contacted Person at site (ID proof details):',
        value: this.getF('contactPerson', 'Biswajit Mishra, Mob:- 9437254704 / 9438252283'),
        labelWidth: 260,
        valueWidth: CONTENT_W - 260,
        labelBold: true,
      },
    ]);

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // 1. APPLICATION & APPLICANT DETAILS
    // ══════════════════════════════════════════
    this.drawSMFGHeader('1. APPLICATION & APPLICANT DETAILS');
    this.drawSMFGRow('1.', "Name/s of the applicant/s", this.getF('applicantName', 'ARPITA TOUR AND TRAVELS'), true);

    this.drawKeyValueRow([
      { label: '2.', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Type of property', value: this.getF('propertyType', 'Single storied Residential building'), labelWidth: 110, valueWidth: halfW - 134, bold: true },
      { label: 'Current Usage', value: this.getF('currentUsage', 'Residential'), labelWidth: 90, valueWidth: halfW - 90, bold: true },
    ]);

    this.drawSMFGRow('3.', 'Address as per firing', this.getF('addressAsPerFiring', 'Khata No-521/4110, Plot No-1124/4159, (AC.0.092Decs, Homestead), Mouza-Balukhanda, Tahasil-Puri, PS-Puri Sadar, Dist-Puri, Odisha, Pin-752004'));
    this.drawSMFGRow('', 'Address at site', this.getF('addressAtSite', 'Khata No-521/4110, Plot No-1124/4159, (AC.0.092Decs, Homestead), Mouza-Balukhanda, Tahasil-Puri, PS-Puri Sadar, Dist-Puri, Odisha, Pin-752004'));
    this.drawSMFGRow('', 'Address as per document', this.getF('addressAsPerDocument', 'Khata No-521/4110, Plot No-1124/4159, (AC.0.092Decs, Homestead), Mouza-Balukhanda, Tahasil-Puri, PS-Puri Sadar, Dist-Puri, Odisha, Pin-752004'));
    this.drawSMFGRow('4.', 'Has valuator done valuation of this property before this?', this.getF('previousValuation', 'No'));

    // ══════════════════════════════════════════
    // 2. SANCTION PLAN & DOCUMENTS DETAILS
    // ══════════════════════════════════════════
    this.drawSMFGHeader('2. SANCTION PLAN & DOCUMENTS DETAILS');
    this.drawSMFGRow('5.', 'Sanctioned plans verified with approval no', this.getF('sanctionPlanDetails', 'Plan no. NA, Structure: NA, Authority: NA, Area: NA'));
    this.drawSMFGRow('6.', 'Property Documents verified', this.getF('documentsVerified', 'Copy of Sale Deed, ROR & Sketch map'));
    this.drawSMFGRow('7.', 'Ownership type', this.getF('ownershipType', 'Freehold'));
    this.drawSMFGRow('8.', 'Construction as per approved Building plan/Bye Laws', this.getF('constructionCompliance', 'Bye Laws'));
    this.drawSMFGRow('9.', 'Permissible usage allows as per master plan', this.getF('permissibleUsage', 'Master Plan not Publish'));
    this.drawSMFGRow('10.', 'Is the property in demolition list', this.getF('demolitionList', 'Not observed'));

    // ══════════════════════════════════════════
    // 3. BOUNDARIES & OCCUPANCY DETAILS
    // ══════════════════════════════════════════
    this.drawSMFGHeader('3. BOUNDARIES & OCCUPANCY DETAILS');
    this.drawSMFGHeader('11. Boundaries as Per Documents & Site');
    const colBndW = (CONTENT_W - 120) / 4;
    this.drawKeyValueRow([
      { label: 'Schedule', value: 'EAST', labelWidth: 120, valueWidth: colBndW, labelBold: true, bold: true },
      { label: 'WEST', value: 'NORTH', labelWidth: colBndW, valueWidth: colBndW, labelBold: true, bold: true },
      { label: 'SOUTH', value: '', labelWidth: colBndW, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'As per Documents', value: this.getF('boundaryEastDoc', 'Maheswar Baral'), labelWidth: 120, valueWidth: colBndW },
      { label: this.getF('boundaryWestDoc', 'Keshab Pradhan'), value: this.getF('boundaryNorthDoc', '20-ft wide Road'), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundarySouthDoc', 'Hata Pradhan'), value: '', labelWidth: colBndW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'As per Sketch map', value: this.getF('boundaryEastSketch', 'NA'), labelWidth: 120, valueWidth: colBndW },
      { label: this.getF('boundaryWestSketch', 'NA'), value: this.getF('boundaryNorthSketch', 'NA'), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundarySouthSketch', 'NA'), value: '', labelWidth: colBndW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'At site', value: this.getF('boundaryEastSite', 'Vacant Land'), labelWidth: 120, valueWidth: colBndW },
      { label: this.getF('boundaryWestSite', 'Vacant Land'), value: this.getF('boundaryNorthSite', '20-ft wide Road'), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundarySouthSite', "Other's Under Cons. Building"), value: '', labelWidth: colBndW, valueWidth: 0 },
    ]);
    this.drawSMFGRow('', 'Boundaries Matching', this.getF('boundariesMatching', 'Yes (Boundary is matching as per documents)'), true);

    this.drawSMFGRow('12.', 'Occupant Details: Vacant/Occupied/Tenant', this.getF('occupancyStatus', 'Occupied'));
    this.drawSMFGRow('', 'Name of Occupant & Relation with applicant', `${this.getF('occupantName', 'Self occupied')} (${this.getF('occupantRelation', 'Customer')})`);
    this.drawSMFGRow('13.', 'Property Demarcation & Identified Through', `Demarcated: ${this.getF('propertyDemarcation', 'Yes')} | Identified via: ${this.getF('identifiedThrough', 'Customer (Biswajit Mishra)')}`);

    // ══════════════════════════════════════════
    // 4. BUILDING & LOCALITY SPECIFICATIONS
    // ══════════════════════════════════════════
    this.drawSMFGHeader('4. BUILDING & LOCALITY SPECIFICATIONS');
    this.drawSMFGRow('13.', 'Structure Type, Floors & Plot Area', `Structure: ${this.getF('structureType', 'RCC')} | Floors: ${this.getF('noOfFloors', 'GF')} | Plot Area: ${this.getF('plotArea', '4007sqft')}`, true);
    this.drawSMFGRow('14.', 'Unit Details: Rooms, BUA, Carpet Area', `Rooms: ${this.getF('unitRooms', 'GF:- 3-Room, 1-Toilets, 1-Hall, 1-Kitchen')} | Carpet: ${this.getF('carpetArea', '1212sqft')}`);
    this.drawSMFGRow('15.', 'Quality of Construction (Interiors & Exteriors)', this.getF('constructionQuality', 'Good'));
    this.drawSMFGRow('16.', 'Age of Property, Location Class & Proximity', `Age: ${this.getF('propertyAge', '7-Years')} | Locality: ${this.getF('localityClass', 'Middle class')} | Proximity: ${this.getF('proximityAmenities', 'Within 1-2Kms')}`);
    this.drawSMFGRow('17.', 'Close Vicinity / Landmark', this.getF('landmark', 'Near Bharat Petroleum Petrol Pump (CNG), Pujapanda Filling Station, Balukhanda'));
    this.drawSMFGRow('18.', 'Within Municipal Limits / GP', this.getF('municipalLimits', 'No (Baliguali GP limit)'));
    this.drawSMFGRow('19.', 'Site Access & Basic Amenities', `Road: ${this.getF('siteAccessRoad', '20-Feet Wide Road')} | Basic Amenities: ${this.getF('basicAmenitiesAvailable', 'Yes')}`);
    this.drawSMFGRow('20.', 'Marketability & Meter No', `Marketability: ${this.getF('marketability', 'Good')} | Meter No: ${this.getF('electricityMeterNo', 'Not seen')}`);

    // ══════════════════════════════════════════
    // 5. FLOOR WISE AREA TABLE
    // ══════════════════════════════════════════
    this.drawSMFGHeader('21. Floor Wise Area (In Sqft.)');
    const colFloorW = CONTENT_W / 6;
    this.drawKeyValueRow([
      { label: "Area's", value: 'Base.', labelWidth: colFloorW, valueWidth: colFloorW, labelBold: true, bold: true },
      { label: 'Stilt', value: 'Ground', labelWidth: colFloorW, valueWidth: colFloorW, labelBold: true, bold: true },
      { label: 'First', value: 'Second', labelWidth: colFloorW, valueWidth: colFloorW, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Actual BUA', value: this.getF('actualBuaBase', 'NA'), labelWidth: colFloorW, valueWidth: colFloorW },
      { label: this.getF('actualBuaStilt', 'NA'), value: this.getF('actualBuaGround', '1427sqft'), labelWidth: colFloorW, valueWidth: colFloorW, bold: true },
      { label: this.getF('actualBuaFirst', 'NA'), value: this.getF('actualBuaSecond', 'NA'), labelWidth: colFloorW, valueWidth: colFloorW },
    ]);
    this.drawSMFGRow('', 'Total Actual Measured BUA (GF)', this.getF('totalActualBua', '1427sqft'), true);

    // ══════════════════════════════════════════
    // 6. VALUATION & RATES
    // ══════════════════════════════════════════
    this.drawSMFGHeader('22. (A) Description of Constructed Area and Rates');
    const colValW = CONTENT_W / 4;
    this.drawKeyValueRow([
      { label: 'Description', value: 'Area', labelWidth: colValW, valueWidth: colValW, labelBold: true, bold: true },
      { label: 'Rate (in Rs.)', value: 'Amount (in Rs.)', labelWidth: colValW, valueWidth: colValW, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Land (As per Sale deed)', value: `${this.getF('landArea', '4007')} sqft`, labelWidth: colValW, valueWidth: colValW, bold: true },
      { label: `Rs. ${this.getF('landRate', '2000')}/-`, value: `Rs. ${formatIndianCurrency(this.getF('landValue', '8014000'))}/-`, labelWidth: colValW, valueWidth: colValW, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Construction BUA (RCC GF)', value: `${this.getF('constArea', '1427')} sqft`, labelWidth: colValW, valueWidth: colValW, bold: true },
      { label: `Rs. ${this.getF('constRate', '1800')}/-`, value: `Rs. ${formatIndianCurrency(this.getF('buildingValue', '2568600'))}/-`, labelWidth: colValW, valueWidth: colValW, bold: true },
    ]);
    this.drawSMFGRow('', 'Total Building Value (100% stage)', `Rs. ${formatIndianCurrency(this.getF('buildingValue', '2568600'))}/-`, true);

    this.advanceCursor(2);
    this.drawKeyValueRow([
      { label: 'Market Value of Property (Land + Building):', value: `Rs. ${formatIndianCurrency(this.getF('marketValue', '10582600'))}/-`, labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Forced Sale / Distress Value (80%):', value: `Rs. ${formatIndianCurrency(this.getF('distressValue', '8466080'))}/-`, labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Govt. Circle Rate (in Rs.):', value: `Rs. ${this.getF('circleRate', '1377')}/-`, labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true },
    ]);

    // Engineering & Structural Specifications
    this.drawSMFGHeader('Structural & Engineering Specifications');
    this.drawSMFGRow('', 'Seismic Zone & Structure Type', `Zone: ${this.getF('seismicZone', 'III')} | Structure: ${this.getF('structureType', 'RCC')}`);
    this.drawSMFGRow('', 'Footing, Roof & Masonry', `Footing: ${this.getF('footingType', 'Independent Footing')} | Roof: ${this.getF('roofType', 'RCC slab')} | Masonry: ${this.getF('masonryType', 'Brick')}`);
    this.drawSMFGRow('', 'Type of Soil', this.getF('soilType', 'Red soil'));

    // Remarks & Declaration
    this.advanceCursor(4);
    this.drawSMFGHeader('REMARKS:');
    const remarks = this.getF('remarks', 'Subject property is a single storied residential building having land extent of 4007sqft, having measured BUA 1427sqft. Approved plan is not provided & age of the building about 7-years. Property is coming under Baliguali GP limit & surrounding areas are residential in nature. This building is occupied by the customer for residential purpose. Valuation has been done for land & measured BUA of single storied residential building. As approved is not provided, it is upto the sole discretion of SMFG India to considered the BUA value or not.');
    this.drawKeyValueRow([
      { label: remarks, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
    ]);

    this.advanceCursor(4);
    this.drawSMFGHeader('Declaration:');
    const declarations = [
      '1. The property is physically inspected by our Engineer/Representative.',
      '2. We have no direct/indirect interest in the property valued.',
      '3. The information furnished above is true & correct to the best of our knowledge and belief and takes account information and or document submitted or shown to us by the client.',
      '4. The ownership papers/sale deeds may please be verified at your end to ascertain the right title & area.',
      '5. The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same. This report does not certify or confirm any ownership or title of the property that has been valued.',
    ];
    declarations.forEach(dec => {
      this.drawKeyValueRow([
        { label: dec, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    this.advanceCursor(10);
    this.drawKeyValueRow([
      {
        label: `M/s. S MOHANTY ASSOCIATES (Empanelled Valuer)`,
        value: '(Authorized Signatory)',
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
        labelBold: true,
      },
    ]);

    // ══════════════════════════════════════════
    // 7. VERIFIED DOCUMENTS
    // ══════════════════════════════════════════
    const docs = this.fields.documentImages || this.fields.documents || [];
    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }

    // ══════════════════════════════════════════
    // 8. LOCATION SKETCH & MAPS
    // ══════════════════════════════════════════
    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.sketchMapImages || []),
      ...(this.fields.maps || []),
    ];
    if (maps && maps.length > 0) {
      const lat = this.getF('latitude', '19.829417');
      const lng = this.getF('longitude', '85.866694');
      const mapTitle = `LOCATION MAP (LAT: - ${lat}, LONG: - ${lng})`;
      await this.drawMapGallery(maps, mapTitle);
    }

    // ══════════════════════════════════════════
    // 9. SITE PHOTOGRAPHS
    // ══════════════════════════════════════════
    const photos = this.fields.propertyImages || this.fields.photos || [];
    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PHOTOGRAPHS');
    }
  }
}
