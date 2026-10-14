import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFLTFinancialServicesRenderer extends PDFBankRenderer {
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

  private drawLTRow(col1Label: string, col1Val: string, col2Label: string, col2Val: string, col1W?: number) {
    const halfW = CONTENT_W / 2;
    const l1W = col1W ?? 110;
    const v1W = halfW - l1W;
    const l2W = 110;
    const v2W = halfW - l2W;

    this.drawKeyValueRow([
      { label: col1Label, value: col1Val || 'NA', labelWidth: l1W, valueWidth: v1W },
      { label: col2Label, value: col2Val || 'NA', labelWidth: l2W, valueWidth: v2W },
    ]);
  }

  async drawContent(): Promise<void> {
    this.addPage();

    // Top Header Banner
    this.drawCenteredTitle('L&T Finance Services/DELHI/', 13, true);
    this.advanceCursor(4);

    // ==========================================
    // I. HEADER METADATA
    // ==========================================
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      { label: 'Name of Customer:', value: this.getF('customerName', ''), labelWidth: 110, valueWidth: halfW - 110, labelBold: true },
      { label: 'Product:', value: this.getF('productType', 'LAP - TOPUP'), labelWidth: 100, valueWidth: halfW - 100, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'LAN No.:', value: this.getF('lanNo', ''), labelWidth: 110, valueWidth: halfW - 110 },
      { label: 'Initiated by:', value: this.getF('initiatedBy', 'L&T Finance'), labelWidth: 100, valueWidth: halfW - 100 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // II. PROPERTY & BOUNDARIES
    // ==========================================
    this.drawSectionHeader('II. PROPERTY & LEGAL ADDRESS');
    this.drawKeyValueRow([
      { label: this.getF('propertyShortAddress', ''), value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Legal Address:', value: this.getF('legalAddress', ''), labelWidth: 90, valueWidth: 220 },
      { label: `City: ${this.getF('city', 'Bhubaneswar')}\nState: ${this.getF('state', 'Odisha')}\nPincode: ${this.getF('pincode', '751024')}\nLandmark: ${this.getF('landmark', '')}\nProject: ${this.getF('projectName', 'NA')}`, value: '', labelWidth: CONTENT_W - 310, valueWidth: 0 },
    ]);

    // Boundary Schedule
    this.drawSectionHeader('Boundary Schedule :');
    const bColW = [110, 195, CONTENT_W - 305];
    this.drawKeyValueRow([
      { label: 'Boundary', value: '', labelWidth: bColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Document', value: '', labelWidth: bColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Site', value: '', labelWidth: bColW[2], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const boundaries = [
      { name: 'North', doc: this.getF('boundaryNorthDoc', ''), site: this.getF('boundaryNorthSite', '') },
      { name: 'South', doc: this.getF('boundarySouthDoc', ''), site: this.getF('boundarySouthSite', '') },
      { name: 'East', doc: this.getF('boundaryEastDoc', ''), site: this.getF('boundaryEastSite', '') },
      { name: 'West', doc: this.getF('boundaryWestDoc', ''), site: this.getF('boundaryWestSite', '') },
    ];
    boundaries.forEach(b => {
      this.drawKeyValueRow([
        { label: b.name, value: '', labelWidth: bColW[0], valueWidth: 0, labelBold: true },
        { label: b.doc || 'NA', value: '', labelWidth: bColW[1], valueWidth: 0 },
        { label: b.site || 'NA', value: '', labelWidth: bColW[2], valueWidth: 0 },
      ]);
    });

    this.drawKeyValueRow([
      { label: 'Plot boundaries matching (Y/N):', value: this.getF('boundariesMatching', 'Boundary is matching as per documents'), labelWidth: 180, valueWidth: CONTENT_W - 180, labelBold: true },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // III. DOCUMENTS RECEIVED
    // ==========================================
    this.drawSectionHeader('III. DOCUMENTS RECEIVED');
    const dColW = [150, 140, 95, CONTENT_W - 385];
    this.drawKeyValueRow([
      { label: 'Property Documents', value: '', labelWidth: dColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Issued by (Authority)', value: '', labelWidth: dColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Date of Issue', value: '', labelWidth: dColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Doc Reference', value: '', labelWidth: dColW[3], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const docs = [
      { name: 'Lease cum Sale deed', auth: this.getF('docDeedAuth', 'Registering officer'), date: this.getF('docDeedDate', '21-Jan-02'), ref: this.getF('docDeedRef', 'NA') },
      { name: 'Approved Plan', auth: this.getF('docPlanAuth', 'BDA, Bhubaneswar'), date: this.getF('docPlanDate', '25-Jan-19'), ref: this.getF('docPlanRef', '2282') },
      { name: 'Occupancy certificate', auth: this.getF('docOccAuth', 'NA'), date: this.getF('docOccDate', 'NA'), ref: this.getF('docOccRef', 'NA') },
    ];
    docs.forEach(d => {
      this.drawKeyValueRow([
        { label: d.name, value: '', labelWidth: dColW[0], valueWidth: 0 },
        { label: d.auth, value: '', labelWidth: dColW[1], valueWidth: 0 },
        { label: d.date, value: '', labelWidth: dColW[2], valueWidth: 0 },
        { label: d.ref, value: '', labelWidth: dColW[3], valueWidth: 0 },
      ]);
    });

    this.drawKeyValueRow([
      { label: 'Ownership as per the document:', value: this.getF('ownershipAsPerDoc', ''), labelWidth: 180, valueWidth: CONTENT_W - 180, labelBold: true },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // IV. LOCATION & INFRASTRUCTURE
    // ==========================================
    this.drawSectionHeader('IV. LOCATION & INFRASTRUCTURE');
    this.drawLTRow('Nature of locality:', this.getF('natureOfLocality', 'Developed'), 'Vicinity:', this.getF('vicinity', 'Mixed'));
    this.drawLTRow('Class of locality:', this.getF('classOfLocality', 'Middle class'), 'Quality of Infrastructure:', this.getF('qualityInfrastructure', 'Good'));
    this.drawLTRow('Public transportation:', this.getF('publicTransport', 'Good'), 'Proximity to Civic Amenities:', this.getF('proximityCivicAmenities', 'Good'));

    this.advanceCursor(4);

    // ==========================================
    // V. PROPERTY SPECIFICATIONS & CONFIGURATION
    // ==========================================
    this.drawSectionHeader('V. PROPERTY SPECIFICATIONS');
    this.drawLTRow('Approved use:', this.getF('approvedUse', 'Residential'), 'Property type:', this.getF('propertyType', 'Row House'));
    this.drawLTRow('Structure type:', this.getF('structureType', 'RCC'), 'No. of Floors:', this.getF('noOfFloors', '3(G+2) (As per Actual), 2(G+1) (As per Plan)'));
    this.drawLTRow('Property holding:', this.getF('propertyHolding', 'Freehold'), 'Property Residual Age:', `${this.getF('residualAge', '49')} Years`);
    this.drawLTRow('Property Age:', `${this.getF('propertyAge', '11')} Years`, 'Floor No.:', this.getF('floorNo', '3'));
    this.drawLTRow('Building Structure:', this.getF('buildingStructure', 'RCC'), 'No. of Lifts:', this.getF('noOfLifts', 'NA'));
    this.drawLTRow('No. of wings:', this.getF('noOfWings', 'NA'), 'External Appearance:', this.getF('externalAppearance', 'Good'));
    this.drawLTRow('Maintenance:', this.getF('maintenance', 'Excellent'), '', '');

    // Configuration Schedule
    this.drawSectionHeader('Configuration Schedule :');
    const cColW = [60, 80, 80, 80, 80, CONTENT_W - 380];
    this.drawKeyValueRow([
      { label: 'Floor', value: '', labelWidth: cColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Bedroom', value: '', labelWidth: cColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Kitchen', value: '', labelWidth: cColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Hall', value: '', labelWidth: cColW[3], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Bathroom', value: '', labelWidth: cColW[4], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Usage Remarks', value: '', labelWidth: cColW[5], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const configs = [
      { flr: 'GF', bed: this.getF('cfgGfBed', '3'), kit: this.getF('cfgGfKit', '1'), hall: this.getF('cfgGfHall', '1'), bath: this.getF('cfgGfBath', '1'), rem: this.getF('cfgGfRem', 'Garage') },
      { flr: 'FF', bed: this.getF('cfgFfBed', '3'), kit: this.getF('cfgFfKit', '1'), hall: this.getF('cfgFfHall', '1'), bath: this.getF('cfgFfBath', '1'), rem: this.getF('cfgFfRem', 'Balcony') },
      { flr: 'SF', bed: this.getF('cfgSfBed', '1'), kit: this.getF('cfgSfKit', ''), hall: this.getF('cfgSfHall', ''), bath: this.getF('cfgSfBath', ''), rem: this.getF('cfgSfRem', '') },
    ];
    configs.forEach(c => {
      this.drawKeyValueRow([
        { label: c.flr, value: '', labelWidth: cColW[0], valueWidth: 0, labelBold: true },
        { label: c.bed || '-', value: '', labelWidth: cColW[1], valueWidth: 0 },
        { label: c.kit || '-', value: '', labelWidth: cColW[2], valueWidth: 0 },
        { label: c.hall || '-', value: '', labelWidth: cColW[3], valueWidth: 0 },
        { label: c.bath || '-', value: '', labelWidth: cColW[4], valueWidth: 0 },
        { label: c.rem || '-', value: '', labelWidth: cColW[5], valueWidth: 0 },
      ]);
    });

    this.advanceCursor(4);

    // ==========================================
    // VI. ADDITIONAL DUE DILIGENCE & OCCUPANCY
    // ==========================================
    this.drawSectionHeader('VI. ADDITIONAL DUE DILIGENCE');
    this.drawLTRow('Name of FPR met at site:', this.getF('fprName', 'Customer Prabuddha Das'), 'Relationship with Applicant:', this.getF('fprRelation', 'Customer'));
    this.drawLTRow('Contact Number:', this.getF('fprContact', '9861080254'), 'KYC Reference:', this.getF('fprKyc', 'Aadhar'));
    this.drawLTRow('Society board verified:', this.getF('societyBoardVerified', 'NA'), 'Owner name matching:', this.getF('ownerNameMatching', 'NA'));
    this.drawLTRow('Discrepancies if any:', this.getF('discrepancies', 'No'), 'Occupancy status:', this.getF('occupancyStatus', 'Occupied'));
    this.drawLTRow('Occupied by:', this.getF('occupiedBy', 'Self occupied'), 'Residing since:', `${this.getF('residingSince', '11')} Years`);

    this.advanceCursor(4);

    // ==========================================
    // VII. VALUATION ENGINE
    // ==========================================
    this.drawSectionHeader('VII. VALUATION');
    const vColW = [230, 85, 85, CONTENT_W - 400];
    this.drawKeyValueRow([
      { label: 'Description', value: '', labelWidth: vColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Area in sft', value: '', labelWidth: vColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate /sft', value: '', labelWidth: vColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Value INR', value: '', labelWidth: vColW[3], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const plotArea = parseFloat(this.getF('plotAreaSqft', '0')) || 0;
    const plotRate = parseFloat(this.getF('plotRateSft', '0')) || 0;
    const plotVal = Math.round(plotArea * plotRate);

    const bldgPlanBua = parseFloat(this.getF('planBuaSqft', '0')) || 0;
    const bldgRate = parseFloat(this.getF('bldgRateSft', '0')) || 0;
    const bldgVal = Math.round(bldgPlanBua * bldgRate);

    const amenitiesVal = parseFloat(this.getF('amenitiesValue', '0')) || 0;
    const grandTotal = plotVal + bldgVal + amenitiesVal;
    const distressVal = parseFloat(this.getF('distressValue', '0')) || Math.round(grandTotal * 0.8);

    // Plot Area row
    this.drawKeyValueRow([
      { label: 'Plot Area', value: '', labelWidth: vColW[0], valueWidth: 0, labelBold: true },
      { label: String(plotArea), value: '', labelWidth: vColW[1], valueWidth: 0 },
      { label: formatIndianCurrency(plotRate), value: '', labelWidth: vColW[2], valueWidth: 0 },
      { label: formatIndianCurrency(plotVal), value: '', labelWidth: vColW[3], valueWidth: 0, labelBold: true },
    ]);

    // Measured BUA
    this.drawKeyValueRow([
      { label: `Built up Area Measured (${this.getF('measuredBuaDesc', 'G+2 RCC GF & FF, Shed SF')})`, value: '', labelWidth: vColW[0], valueWidth: 0 },
      { label: this.getF('measuredBuaSqft', '3462'), value: '', labelWidth: vColW[1], valueWidth: 0 },
      { label: '-', value: '', labelWidth: vColW[2], valueWidth: 0 },
      { label: '-', value: '', labelWidth: vColW[3], valueWidth: 0 },
    ]);

    // Plan BUA
    this.drawKeyValueRow([
      { label: `Built up Area as per Plan (${this.getF('planBuaDesc', 'G+1 RCC GF-1332sqft, FF-1332sqft')})`, value: '', labelWidth: vColW[0], valueWidth: 0, labelBold: true },
      { label: String(bldgPlanBua), value: '', labelWidth: vColW[1], valueWidth: 0 },
      { label: formatIndianCurrency(bldgRate), value: '', labelWidth: vColW[2], valueWidth: 0 },
      { label: formatIndianCurrency(bldgVal), value: '', labelWidth: vColW[3], valueWidth: 0, labelBold: true },
    ]);

    // Extra Amenities
    this.drawKeyValueRow([
      { label: 'Amenities (Fixed furniture, Modular kitchen, False Ceiling)', value: '', labelWidth: vColW[0], valueWidth: 0 },
      { label: '-', value: '', labelWidth: vColW[1], valueWidth: 0 },
      { label: '-', value: '', labelWidth: vColW[2], valueWidth: 0 },
      { label: formatIndianCurrency(amenitiesVal), value: '', labelWidth: vColW[3], valueWidth: 0 },
    ]);

    // Grand Total Box
    this.drawKeyValueRow([
      { label: 'Grand Total Market Value:', value: `Rs. ${formatIndianCurrency(grandTotal)}/-`, labelWidth: 260, valueWidth: CONTENT_W - 260, labelBold: true, highlight: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Distress Value (80%):', value: `Rs. ${formatIndianCurrency(distressVal)}/-`, labelWidth: 260, valueWidth: CONTENT_W - 260, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Rupees in words:', value: rupeesInWords(grandTotal), labelWidth: 110, valueWidth: CONTENT_W - 110, labelBold: true },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // VIII & IX. PROGRESS, DEVIATIONS & REMARKS
    // ==========================================
    this.drawSectionHeader('VIII. PROGRESS ASSESSMENT & IX. REMARKS');
    this.drawLTRow('Property Construction Stage:', this.getF('stageProperty', '100%'), '% Progress / Reco:', `${this.getF('progressProperty', '100%')} / ${this.getF('recoProperty', '100%')}`);
    this.drawLTRow('Deviations if any:', this.getF('deviations', 'NA'), '', '');

    this.drawKeyValueRow([
      { label: 'Valuer Detailed Remarks:', value: this.getF('remarks', ''), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // X & XI. COORDINATES & SIGN-OFF
    // ==========================================
    this.drawSectionHeader('X. COORDINATES & XI. INSPECTION DETAILS');
    this.drawLTRow('Latitude:', this.getF('latitude', '20.352472'), 'Longitude:', this.getF('longitude', '85.837694'));
    this.drawLTRow('Date of Visit:', this.getF('dateOfVisit', '26 March 2026'), 'Visited by:', this.getF('visitedBy', 'Er. Satyajit Mohanty'));
    this.drawLTRow('Date of Report:', this.getF('dateOfReport', '27 March 2026'), 'Approved by:', this.getF('approvedBy', 'NA'));

    this.advanceCursor(4);

    // ==========================================
    // REQUIREMENT DETAILS CHECKLIST
    // ==========================================
    this.drawSectionHeader('Requirement Details in Report Format :');
    const reqs = [
      '1. Setback as per measured / Permissible Bye Laws / Sanctioned Plan: ' + this.getF('reqSetbacks', 'As per site front 5ft, rear 3ft, left 3ft, right 3ft'),
      '2. Setback Deviation: ' + this.getF('reqSetbackDeviation', 'NIL / Minor within permissible limits'),
      '3. Each Floor BUA as per Measured / Bye Laws / Plan: ' + this.getF('reqFloorBua', 'GF-1332sqft, FF-1332sqft (Plan) | GF-1731sqft, FF-1731sqft (Site)'),
      '4. Extra Coverage Area on each Floor / Deviation: ' + this.getF('reqExtraCoverage', 'Extra coverage of 399sqft on GF & FF'),
      '5. Property Address as per Site / Documents: ' + this.getF('reqAddressCheck', 'Matching with physical boundaries at site'),
      '6. Property Boundaries Mismatch: ' + this.getF('reqBoundariesMismatch', 'No (Mismatch: NA)'),
    ];
    reqs.forEach(r => {
      this.drawKeyValueRow([
        { label: r, value: '', labelWidth: CONTENT_W, valueWidth: 0 },
      ]);
    });

    this.advanceCursor(12);

    this.drawKeyValueRow([
      { label: `Date: ${this.getF('dateOfReport', '27 March 2026')}`, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
      { label: 'SIGNATURE OF THE VALUER\n(M/s. S MOHANTY ASSOCIATES)', value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
    ]);

    // Attachments
    if (this.fields.documentImages?.length > 0) {
      await this.drawDocumentsGallery(this.fields.documentImages);
    }
    if (this.fields.locationMapImages?.length > 0 || this.fields.mouzaMapImages?.length > 0) {
      await this.drawMapGallery([...(this.fields.locationMapImages || []), ...(this.fields.mouzaMapImages || [])], 'LOCATION SKETCH / ROUTE MAP');
    }
    if (this.fields.propertyImages?.length > 0) {
      await this.drawPhotoGrid(this.fields.propertyImages);
    }
  }
}
