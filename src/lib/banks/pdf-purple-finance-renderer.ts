import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFPurpleFinanceRenderer extends PDFBankRenderer {
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

  private drawPurpleHeader(title: string) {
    this.drawSectionHeader(title);
  }

  private drawPurpleRow(num: string, label: string, value: string, boldVal: boolean = false) {
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
    // Top Ref No and Date
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      {
        label: 'Ref No:',
        value: this.getF('refNo', this.projectCode || ''),
        labelWidth: 60,
        valueWidth: halfW - 60,
        labelBold: true,
        bold: true,
      },
      {
        label: 'Date:',
        value: this.getF('valuationDate', ''),
        labelWidth: 50,
        valueWidth: halfW - 50,
        labelBold: true,
        bold: true,
      },
    ]);

    this.advanceCursor(4);
    this.drawCenteredTitle('Valuation Report Format for Bungalow/IndividualHouse/Resale', 12, true);
    this.advanceCursor(4);

    // Header Table Bar
    const numColW = 30;
    const fieldColW = 210;
    const valColW = CONTENT_W - numColW - fieldColW;

    this.drawKeyValueRow([
      { label: 'Sl.No', value: 'Field Description', labelWidth: numColW, valueWidth: fieldColW, labelBold: true, bold: true },
      { label: 'Details', value: '', labelWidth: valColW, valueWidth: 0, labelBold: true },
    ]);

    // 1. Customer & App Details
    this.drawPurpleHeader('1. CUSTOMER & APPLICATION DETAILS');
    this.drawPurpleRow('1.', 'Name of the Customer', this.getF('customerName', ''), true);
    this.drawPurpleRow('', 'Customer Contact Details', this.getF('customerContact', ''));
    this.drawPurpleRow('2.', 'APP ID', this.getF('appId', ''), true);
    this.drawPurpleRow('3.', 'Documents Provided: Approved Layout/Plan/ROR', this.getF('documentsProvided', 'Copy of Partition deed, ROR, sketch map'));

    // 2. Property Identification & Locality Details
    this.drawPurpleHeader('2. PROPERTY IDENTIFICATION & LOCALITY DETAILS');
    this.drawPurpleRow('4.', 'Property Details (Full Description)', this.getF('propertyDetails', ''));
    this.drawPurpleRow('a.', 'Plot No', this.getF('plotNo', ''));
    this.drawPurpleRow('b.', 'SNo/G.No/Khasra No/Khata No', this.getF('khataNo', ''));
    this.drawPurpleRow('c.', 'Locality', this.getF('locality', ''));
    this.drawPurpleRow('d.', 'Road', this.getF('roadWidth', ''));
    this.drawPurpleRow('e.', 'City', this.getF('city', ''));
    this.drawPurpleRow('f.', 'District', this.getF('district', ''));
    this.drawPurpleRow('g.', 'Pincode', this.getF('pincode', ''));
    this.drawPurpleRow('h.', 'Nearby Landmark', this.getF('nearbyLandmark', ''));
    this.drawPurpleRow('i.', 'Distance from City Center', this.getF('distanceFromCityCenter', ''));
    this.drawPurpleRow('j.', 'Availability of Local Transport: Metro/Train/Bus', this.getF('localTransport', 'Taxi, Auto'));
    this.drawPurpleRow('k.', 'Level of land with topographical conditions', this.getF('landLevelCondition', 'Regular level land'));
    this.drawPurpleRow('l.', 'Class of Locality', this.getF('classOfLocality', 'Middle Class'));
    this.drawPurpleRow('m.', 'Quality of Infrastructure in the vicinity', this.getF('qualityInfrastructure', 'Average'));

    // Boundaries Sub-table (n)
    this.drawPurpleHeader('n. Boundaries of Property (As per Sale Deed vs Actual at Site)');
    const bndColW = (CONTENT_W - 80) / 2;
    this.drawKeyValueRow([
      { label: 'Direction', value: 'Boundaries as per sale deed', labelWidth: 80, valueWidth: bndColW, labelBold: true, bold: true },
      { label: 'Boundaries as per Actual', value: '', labelWidth: bndColW, valueWidth: 0, labelBold: true },
    ]);
    const bndRows = [
      { dir: 'East', deed: this.getF('boundaryEastDeed', 'NA'), actual: this.getF('boundaryEastActual', 'NA') },
      { dir: 'West', deed: this.getF('boundaryWestDeed', 'NA'), actual: this.getF('boundaryWestActual', 'NA') },
      { dir: 'North', deed: this.getF('boundaryNorthDeed', 'NA'), actual: this.getF('boundaryNorthActual', 'NA') },
      { dir: 'South', deed: this.getF('boundarySouthDeed', 'NA'), actual: this.getF('boundarySouthActual', 'NA') },
    ];
    bndRows.forEach(r => {
      this.drawKeyValueRow([
        { label: r.dir, value: r.deed, labelWidth: 80, valueWidth: bndColW },
        { label: r.actual, value: '', labelWidth: bndColW, valueWidth: 0 },
      ]);
    });

    this.drawPurpleRow('o.', 'Does the Boundaries at Site match documentation?', this.getF('boundariesMatch', 'Boundary matching as per documents'), true);
    this.drawPurpleRow('p.', 'Status of the Land/Flat: FreeHold/Leased', this.getF('statusOfLand', 'FreeHold'));
    this.drawPurpleRow('q.', 'Type of Property: Bungalow/rowhouse/flat/etc.', this.getF('typeOfProperty', 'Rowhouse'));
    this.drawPurpleRow('r.', 'Approved usage of Property (Restrictive covenants)', this.getF('approvedUsage', 'NA'));
    this.drawPurpleRow('s.', 'Actual Usage of the Property', this.getF('actualUsage', 'Residential'));
    this.drawPurpleRow('t.', 'Type of Structure: LoadBearing/RCC/Aluform', this.getF('typeOfStructure', 'RCC'));
    this.drawPurpleRow('u.', 'No of Floors', this.getF('noOfFloors', ''));
    this.drawPurpleRow('v.', 'Occupancy Details: Self Occupied/Rented/Vacant', this.getF('occupancyDetails', 'Self-Occupied'));
    this.drawPurpleRow('w.', 'Does property have Electricity/Water/Drainage', this.getF('utilitiesConnection', 'Yes'));
    this.drawPurpleRow('x.', 'Proximity to civic amenities', this.getF('proximityAmenities', 'Within 1-2kms range'));
    this.drawPurpleRow('y.', 'Development of surrounding area', this.getF('developmentSurrounding', 'Residential development found in surrounding areas.'));
    this.drawPurpleRow('z.', 'Coordinates (Latitude / Longitude)', `Lat: ${this.getF('latitude', 'NA')}, Long: ${this.getF('longitude', 'NA')}`);

    // 3. Approval Details
    this.drawPurpleHeader('3. APPROVAL DETAILS');
    this.drawPurpleRow('5.a', 'Layout Approval No', this.getF('layoutApprovalNo', 'NA'));
    this.drawPurpleRow('b.', 'Date of Approval', this.getF('layoutDateApproval', 'NA'));
    this.drawPurpleRow('c.', 'Expiry Date', this.getF('layoutExpiryDate', 'NA'));
    this.drawPurpleRow('d.', 'Building Plan Approval No', this.getF('buildingPlanNo', 'Plan not provided'));
    this.drawPurpleRow('e.', 'Date of Approval', this.getF('buildingDateApproval', 'NA'));
    this.drawPurpleRow('f.', 'Expiry Date', this.getF('buildingExpiryDate', 'NA'));
    this.drawPurpleRow('g.', 'Date of Commencement of Construction', this.getF('commencementDate', 'Not known'));
    this.drawPurpleRow('h.', 'Expected Completion', this.getF('expectedCompletion', '100% Completed building'));

    // 4. Construction Details
    this.drawPurpleHeader('4. CONSTRUCTION DETAILS');
    this.drawPurpleRow('6.a', 'Area of the Plot/flat', this.getF('plotArea', ''), true);
    this.drawPurpleRow('b.', 'Demarcation at Site', this.getF('demarcationAtSite', 'No'));
    this.drawPurpleRow('c.', 'Approved Built up Area (Floorwise)', this.getF('approvedBua', ''));
    this.drawPurpleRow('d.', 'Measured Built up Area (Total)', this.getF('measuredBuaTotal', ''), true);
    this.drawPurpleRow('', 'Measured BUA Breakup (G.F.)', this.getF('measuredBuaGf', ''));
    this.drawPurpleRow('f.', 'Construction as per approved plan/byelaws', this.getF('constructionAsPerPlan', 'NA'));
    this.drawPurpleRow('g.', 'Details of Extra Construction', this.getF('extraConstructionDetails', 'NA'));
    this.drawPurpleRow('h.', 'Side Margins (Front, Right, Left, Back)', `Front: ${this.getF('marginFront', 'NA')} | Right: ${this.getF('marginRight', 'NA')} | Left: ${this.getF('marginLeft', 'NA')} | Back: ${this.getF('marginBack', 'NA')}`);
    this.drawPurpleRow('i.', 'Quality of construction', this.getF('qualityOfConstruction', 'Average'));
    this.drawPurpleRow('j.', 'Maintenance of the Property', this.getF('maintenanceOfProperty', 'Average'));
    this.drawPurpleRow('k.', 'Current Life of the structure', this.getF('currentLife', ''));
    this.drawPurpleRow('l.', 'Projected Life of the Structure', this.getF('projectedLife', ''));

    // 5. Valuation & Rates
    this.drawPurpleHeader('5. RECOMMENDED VALUATION OF THE PROPERTY');
    this.drawPurpleRow('7.a', 'Recommended rate of the Plot/Flat', this.getF('plotRate', ''), true);
    this.drawPurpleRow('b.', 'Value of the Plot/Flat (Approved)', this.getF('plotValue', ''), true);
    this.drawPurpleRow('d.', 'Total Cost of construction (Measured GF RCC)', this.getF('constructionValue', ''), true);
    this.drawPurpleRow('e.', 'Stage of Construction', this.getF('stageOfConstruction', '100%'));
    this.drawPurpleRow('f.', '% Work completed', this.getF('percentWorkCompleted', '100%'));
    this.drawPurpleRow('g.', '% Disbursement Recommended', this.getF('percentDisbursement', '100%'));
    this.drawPurpleRow('h.', 'Current Value of the Property (Plot + construction)', this.getF('currentTotalValue', ''), true);
    this.drawPurpleRow('i.', 'Date of Property Visit', this.getF('dateOfVisit', ''));
    this.drawPurpleRow('8.', 'Valuation as per Government reckoner rates', this.getF('govtReckonerRate', ''));
    this.drawPurpleRow('9.', 'Distressed valuation of the Property', this.getF('distressValue', ''), true);
    this.drawPurpleRow('10.', 'Rental value per month', this.getF('rentalValue', 'Not observed'));

    // 6. Remarks, Undertaking & Declaration
    this.drawPurpleHeader('6. REMARKS & UNDERTAKING');
    this.drawPurpleRow('11.a', '4 photos of the Property attached', this.getF('photosAttached', 'Attached'));
    this.drawPurpleRow('b.', 'Location sketch for the property', this.getF('locationSketchAttached', 'Attached'));

    this.advanceCursor(2);
    this.drawPurpleHeader('12. Remarks:');
    const remarks = this.getF('remarks', '');
    this.drawKeyValueRow([
      { label: remarks || 'NA', value: '', labelWidth: CONTENT_W, valueWidth: 0 },
    ]);

    this.advanceCursor(4);
    this.drawPurpleHeader('Undertaking:');
    const undertaking = 'I have personally visited the property & identified the same based on the documents provided. I/We have no direct or Indirect Interest in the property being valued. The information furnished above is true and correct to my/our knowledge.';
    this.drawKeyValueRow([
      { label: undertaking, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
    ]);

    this.advanceCursor(10);
    this.drawKeyValueRow([
      {
        label: `Er. Satyajit Mohanty Approved Panel Valuer`,
        value: 'Authorized Signatory / Name & Seal of the Agency',
        labelWidth: 280,
        valueWidth: CONTENT_W - 280,
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
      const lat = this.getF('latitude', '');
      const lng = this.getF('longitude', '');
      const mapTitle = lat && lng ? `LOCATION MAP (LAT:-${lat}, LONG-${lng})` : 'LOCATION MAP';
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
