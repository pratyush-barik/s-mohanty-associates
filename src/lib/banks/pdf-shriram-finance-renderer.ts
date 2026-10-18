import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFShriramFinanceRenderer extends PDFBankRenderer {
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

  /**
   * Section Header row with solid dark banner
   */
  private drawShriramSectionHeader(title: string) {
    this.drawSectionHeader(title);
  }

  /**
   * Helper to draw a full row with optional number badge, label, and value
   */
  private drawShriramRow(num: string, label: string, value: string, boldVal: boolean = false) {
    const numW = 24;
    const labelW = 200;
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
    // NOTE: init() already adds page 1. Do NOT call this.addPage() here.

    // ══════════════════════════════════════════
    // TOP HEADER BANNER
    // ══════════════════════════════════════════
    this.drawCenteredTitle('VALUATION REPORT', 14, true);
    this.advanceCursor(4);

    // Meta Header Grid
    const colHalf = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: 'Branch Name', value: this.getF('branchName', 'Bhubaneswar'), labelWidth: 90, valueWidth: colHalf - 90, labelBold: true },
      { label: 'Type of Case', value: this.getF('typeOfCase', 'NPA'), labelWidth: 90, valueWidth: colHalf - 90, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Valuer Name', value: this.getF('valuerName', 'Er. Satyajit Mohanty'), labelWidth: 90, valueWidth: colHalf - 90, labelBold: true },
      { label: 'Date of Visit', value: this.getF('dateOfVisit', ''), labelWidth: 90, valueWidth: colHalf - 90, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Case Ref. No', value: this.getF('caseRefNo', this.projectCode || 'NA'), labelWidth: 90, valueWidth: colHalf - 90, labelBold: true },
      { label: 'Date of Report', value: this.getF('dateOfReport', ''), labelWidth: 90, valueWidth: colHalf - 90, labelBold: true },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Contacted Person for property inspection (Name/ Mobile)',
        value: this.getF('contactPersonInspection', ''),
        labelWidth: 260,
        valueWidth: CONTENT_W - 260,
        labelBold: true,
      },
    ]);

    this.advanceCursor(4);

    // ══════════════════════════════════════════
    // 1. BASIC DETAILS
    // ══════════════════════════════════════════
    this.drawShriramSectionHeader('BASIC DETAILS');
    this.drawShriramRow('1', "Applicant/s Name/s", this.getF('applicantName', ''), true);

    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: '2', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Type of property', value: this.getF('propertyType', 'Residential Flat'), labelWidth: 100, valueWidth: halfW - 124, bold: true },
      { label: 'Current Usage', value: this.getF('currentUsage', 'Vacant'), labelWidth: 90, valueWidth: halfW - 90, bold: true },
    ]);

    this.drawShriramRow('3', 'Address at site', this.getF('addressAtSite', ''));
    this.drawShriramRow('', 'Address as per document', this.getF('addressAsPerDocument', ''));
    this.drawShriramRow('4', 'Has the valuator done valuation of this property before this? If yes, when, for whom?', this.getF('previousValuation', 'No'));

    // ══════════════════════════════════════════
    // 2. SURROUNDING & LOCALITY DETAILS
    // ══════════════════════════════════════════
    this.drawShriramSectionHeader('SURROUNDING & LOCALITY DETAILS');
    this.drawShriramRow('5', 'Location Type (Comm., Res, Ind, Mix)', this.getF('localityType', 'Residential'));
    this.drawShriramRow('', 'Class of Locality', this.getF('localityClass', 'Middle Class'));
    this.drawShriramRow('', 'Site is (Dev, Under Dev)', this.getF('siteDevStatus', 'Developed'));
    this.drawShriramRow('', 'Proximity to civic amenities/public transport', this.getF('proximityCivicAmenities', ''));
    this.drawShriramRow('', 'Railway Station', this.getF('railwayStationDistance', ''));
    this.drawShriramRow('', 'Bus Stop', this.getF('busStopDistance', ''));
    this.drawShriramRow('6', 'Close Vicinity/Landmark', this.getF('vicinityLandmark', ''));
    this.drawShriramRow('7', 'Distance from City Center', this.getF('distanceFromCityCenter', ''));
    this.drawShriramRow('8', 'Condition and width of approach road', this.getF('approachRoad', ''));

    // ══════════════════════════════════════════
    // 3. PROPERTY DETAILS
    // ══════════════════════════════════════════
    this.drawShriramSectionHeader('PROPERTY DETAILS');
    this.drawShriramRow('9', 'Occupant (Vacant/Occupied)', this.getF('occupancyStatus', ''));
    this.drawShriramRow('', 'Name of Occupant', this.getF('occupantName', ''));
    this.drawShriramRow('', 'Relation with applicant', this.getF('occupantRelation', ''));
    this.drawShriramRow('', 'Property Demarcation', this.getF('propertyDemarcation', ''));
    this.drawShriramRow('', 'Property Identified through', this.getF('propertyIdentifiedThrough', ''));

    this.drawShriramRow('10', 'Type of structure', this.getF('structureType', ''));
    this.drawShriramRow('', 'Land/Plot Area(UDS)', this.getF('plotAreaUds', 'NA'));
    this.drawShriramRow('', 'No of Blocks', this.getF('noOfBlocks', ''));
    this.drawShriramRow('', 'No of Units', this.getF('noOfUnits', ''));
    this.drawShriramRow('', 'No. of Floors', this.getF('noOfFloors', ''));
    this.drawShriramRow('', 'No. of Lifts', this.getF('noOfLifts', ''));

    this.drawShriramRow('11', 'Unit details: Located on Floor No.', this.getF('floorNo', ''));
    this.drawShriramRow('', 'No. of rooms', this.getF('noOfRooms', ''));
    this.drawShriramRow('', 'Built up area (SBUA)', this.getF('builtUpAreaSbua', ''), true);
    this.drawShriramRow('', 'Carpet area (approx.)', this.getF('carpetArea', ''));
    this.drawShriramRow('', 'Remarks on view from property', this.getF('viewRemarks', 'NA'));

    this.drawKeyValueRow([
      { label: '12', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Quality of construction - Exteriors', value: this.getF('constructionQualityExterior', 'Good'), labelWidth: 160, valueWidth: halfW - 184 },
      { label: 'Interiors', value: this.getF('constructionQualityInterior', 'Good'), labelWidth: 80, valueWidth: halfW - 80 },
    ]);

    this.drawKeyValueRow([
      { label: '13', value: '', labelWidth: 24, valueWidth: 0, labelBold: true },
      { label: 'Age of the property', value: this.getF('propertyAge', 'Under construction'), labelWidth: 160, valueWidth: halfW - 184 },
      { label: 'Residual life', value: this.getF('residualLife', '60-Years'), labelWidth: 80, valueWidth: halfW - 80 },
    ]);

    // ══════════════════════════════════════════
    // 4. SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS
    // ══════════════════════════════════════════
    this.drawShriramSectionHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS');
    this.drawShriramRow('14', 'Sanctioned plans verified with approval no', this.getF('sanctionPlanNo', ''));
    this.drawShriramRow('15', 'Ownership type (Leasehold/ Freehold)', this.getF('ownershipType', 'Freehold'));
    this.drawShriramRow('16', 'Property documents verified', this.getF('documentsVerified', 'Copy of Agreement for sale & Allotment letter'));
    this.drawShriramRow('17', 'Is the property within Municipal Limits', this.getF('withinMunicipalLimits', 'No(Within BDA limit)'));
    this.drawShriramRow('18', 'Permissible usage allow as per master plan', this.getF('permissibleUsage', 'Residential'));

    // Setbacks Table
    this.drawShriramSectionHeader('19. Setbacks Details');
    const colWSetback = CONTENT_W / 4;
    this.drawKeyValueRow([
      { label: 'Setbacks', value: 'As per plan/ Bye laws', labelWidth: colWSetback, valueWidth: colWSetback, labelBold: true, bold: true },
      { label: 'Actual at site', value: 'Deviation / Remarks', labelWidth: colWSetback, valueWidth: colWSetback, labelBold: true, bold: true },
    ]);
    const setbacks = [
      { name: 'Front', plan: this.getF('setbackFrontPlan', 'N.A'), site: this.getF('setbackFrontSite', 'N.A'), dev: this.getF('setbackFrontDev', 'Nil'), rem: this.getF('setbackFrontRemarks', 'Plan not provided') },
      { name: 'Side1(Left)', plan: this.getF('setbackSide1Plan', 'N.A'), site: this.getF('setbackSide1Site', 'N.A'), dev: this.getF('setbackSide1Dev', 'Nil'), rem: this.getF('setbackSide1Remarks', '') },
      { name: 'Side2(Right)', plan: this.getF('setbackSide2Plan', 'N.A'), site: this.getF('setbackSide2Site', 'N.A'), dev: this.getF('setbackSide2Dev', 'Nil'), rem: this.getF('setbackSide2Remarks', '') },
      { name: 'Rear', plan: this.getF('setbackRearPlan', 'N.A'), site: this.getF('setbackRearSite', 'N.A'), dev: this.getF('setbackRearDev', 'Nil'), rem: this.getF('setbackRearRemarks', '') },
    ];
    setbacks.forEach(s => {
      this.drawKeyValueRow([
        { label: s.name, value: s.plan, labelWidth: colWSetback, valueWidth: colWSetback },
        { label: s.site, value: `${s.dev} ${s.rem ? `(${s.rem})` : ''}`.trim(), labelWidth: colWSetback, valueWidth: colWSetback },
      ]);
    });

    // Floor Wise Area Table
    this.drawShriramSectionHeader('20. Floor Wise Area (In Sft.)');
    const colFloorW = CONTENT_W / 7;
    this.drawKeyValueRow([
      { label: "Area's", value: 'Basement', labelWidth: colFloorW, valueWidth: colFloorW, labelBold: true, bold: true },
      { label: 'Ground', value: 'First', labelWidth: colFloorW, valueWidth: colFloorW, labelBold: true, bold: true },
      { label: 'Second', value: '4th Floor', labelWidth: colFloorW, valueWidth: colFloorW, labelBold: true, bold: true },
      { label: '7th Floor', value: '', labelWidth: colFloorW, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Permissible SBUA', value: this.getF('permBasement', 'NA'), labelWidth: colFloorW, valueWidth: colFloorW },
      { label: this.getF('permGround', 'NA'), value: this.getF('permFirst', 'NA'), labelWidth: colFloorW, valueWidth: colFloorW },
      { label: this.getF('permSecond', 'NA'), value: this.getF('perm4th', '1159sqft'), labelWidth: colFloorW, valueWidth: colFloorW },
      { label: this.getF('perm7th', 'NA'), value: '', labelWidth: colFloorW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'Constructed SBUA', value: this.getF('constBasement', 'NA'), labelWidth: colFloorW, valueWidth: colFloorW },
      { label: this.getF('constGround', 'NA'), value: this.getF('constFirst', 'NA'), labelWidth: colFloorW, valueWidth: colFloorW },
      { label: this.getF('constSecond', 'NA'), value: this.getF('const4th', '1159sqft'), labelWidth: colFloorW, valueWidth: colFloorW },
      { label: this.getF('const7th', 'NA'), value: '', labelWidth: colFloorW, valueWidth: 0 },
    ]);

    // ══════════════════════════════════════════
    // 5. VALUATION
    // ══════════════════════════════════════════
    this.drawShriramSectionHeader('VALUATION');
    this.drawShriramSectionHeader('(A) Description of Constructed Area and Rates');

    const colValW = CONTENT_W / 4;
    this.drawKeyValueRow([
      { label: 'Description', value: 'Area (Sft.)', labelWidth: colValW, valueWidth: colValW, labelBold: true, bold: true },
      { label: 'Rate (Rs/Sft.)', value: 'Amount (Rs.)', labelWidth: colValW, valueWidth: colValW, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Land', value: this.getF('landArea', 'NA'), labelWidth: colValW, valueWidth: colValW },
      { label: this.getF('landRate', 'NA'), value: this.getF('landAmount', 'NA'), labelWidth: colValW, valueWidth: colValW },
    ]);
    this.drawKeyValueRow([
      { label: '21. Construction on 100% completion', value: this.getF('area100', ''), labelWidth: colValW, valueWidth: colValW, bold: true },
      { label: this.getF('rate100', ''), value: this.getF('amount100', ''), labelWidth: colValW, valueWidth: colValW, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: `Construction As on date (${this.getF('completionStagePercent', '')}%)`, value: this.getF('areaAsOnDate', ''), labelWidth: colValW, valueWidth: colValW, bold: true },
      { label: this.getF('rateAsOnDate', ''), value: this.getF('amountAsOnDate', ''), labelWidth: colValW, valueWidth: colValW, bold: true },
    ]);

    this.drawShriramSectionHeader('(B) Value of Extra Amenities if applicable');
    this.drawKeyValueRow([
      { label: 'Car Parking', value: this.getF('amenityCarParking', 'Including'), labelWidth: 90, valueWidth: 80 },
      { label: 'PLC', value: this.getF('amenityPLC', 'NA'), labelWidth: 40, valueWidth: 50 },
      { label: 'IDC', value: this.getF('amenityIDC', 'NA'), labelWidth: 40, valueWidth: 50 },
      { label: 'EDC', value: this.getF('amenityEDC', 'NA'), labelWidth: 40, valueWidth: 50 },
      { label: 'Power Backup', value: this.getF('amenityPowerBackup', 'NA'), labelWidth: 80, valueWidth: CONTENT_W - 430 },
    ]);
    this.drawKeyValueRow([
      { label: 'Total Amenities charges', value: this.getF('totalAmenitiesCharges', 'Including'), labelWidth: 200, valueWidth: CONTENT_W - 200, labelBold: true, bold: true },
    ]);

    this.advanceCursor(2);
    this.drawKeyValueRow([
      { label: 'Total Market Value of Property (100%)', value: this.getF('marketValue100', ''), labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: `Total Market Value of Property As on date (${this.getF('completionStagePercent', '')}%)`, value: this.getF('marketValueAsOnDate', ''), labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Realizable value (85%)', value: this.getF('realizableValue', ''), labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Forced Sale Value / Distress Value (80%)', value: this.getF('distressValue', ''), labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true, bold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Approx. Rentals in case of 100% complete property', value: this.getF('rentalValue', ''), labelWidth: 280, valueWidth: CONTENT_W - 280, labelBold: true, bold: true },
    ]);

    // ══════════════════════════════════════════
    // 6. BOUNDARIES, REMARKS & DECLARATION
    // ══════════════════════════════════════════
    this.drawShriramSectionHeader('BOUNDARIES');
    const colBndW = CONTENT_W / 5;
    this.drawKeyValueRow([
      { label: '22. Boundaries', value: 'EAST', labelWidth: colBndW, valueWidth: colBndW, labelBold: true, bold: true },
      { label: 'WEST', value: 'NORTH', labelWidth: colBndW, valueWidth: colBndW, labelBold: true, bold: true },
      { label: 'SOUTH', value: '', labelWidth: colBndW, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'As per agreement to sale', value: this.getF('boundaryEastDoc', 'Not Mentioned'), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundaryWestDoc', 'Not Mentioned'), value: this.getF('boundaryNorthDoc', 'Not Mentioned'), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundarySouthDoc', 'Not Mentioned'), value: '', labelWidth: colBndW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'At site (Project Boundaries)', value: this.getF('boundaryEastSite', ''), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundaryWestSite', ''), value: this.getF('boundaryNorthSite', ''), labelWidth: colBndW, valueWidth: colBndW },
      { label: this.getF('boundarySouthSite', ''), value: '', labelWidth: colBndW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'Boundaries Matching', value: this.getF('boundariesMatching', 'NA(Not mentioned in agreement for sale)'), labelWidth: 160, valueWidth: CONTENT_W - 160, labelBold: true, bold: true },
    ]);

    this.advanceCursor(4);
    this.drawShriramSectionHeader('Remarks:-');
    const remarks = this.getF('remarks', '');
    this.drawKeyValueRow([
      { label: remarks, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
    ]);

    this.advanceCursor(4);
    this.drawShriramSectionHeader('Declaration:-');
    const declarations = [
      '1. I hereby declare that, I have no direct and indirect interest in the property valued and the information furnished in the report is true and correct to the best of my knowledge of belief.',
      '2. Any additions or alterations after the date of inspection shall not fall under the scope of this report.',
      '3. The legal aspects are not in the scope of evaluation of the property.',
      '4. The Property is identified by the owner before the valuer. This valuation report is prepared without any prejudice and bias to any person or institution.',
      '5. This report has been prepared on basis of verifications in the locality.',
      '6. I am not required to given testimony or appear in court by any reason of this appraisal report, with reference to the property in question.',
    ];
    declarations.forEach(dec => {
      this.drawKeyValueRow([
        { label: dec, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    this.advanceCursor(10);
    this.drawKeyValueRow([
      {
        label: `Name of Engineer who visited the property:- ${this.getF('visitingEngineer', 'Er. Satyajit Mohanty')}`,
        value: '(Authorized Signatory)',
        labelWidth: 340,
        valueWidth: CONTENT_W - 340,
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
    // 8. AMIN SKETCH-MAP & LOCATION MAPS
    // ══════════════════════════════════════════
    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.sketchMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.cadastralMapImages || []),
      ...(this.fields.maps || []),
    ];
    if (maps && maps.length > 0) {
      const lat = this.getF('latitude', '20.353400');
      const lng = this.getF('longitude', '85.841866');
      const mapTitle = `LOCATION MAP (Latitude-${lat}, Longitude-${lng})`;
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
