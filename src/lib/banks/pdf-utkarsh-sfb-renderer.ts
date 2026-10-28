import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFUtkarshSFBRenderer extends PDFBankRenderer {
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

  private drawUtkarshSectionHeader(title: string) {
    this.drawSectionHeader(title);
  }

  async drawContent(): Promise<void> {
    // NOTE: init() already adds page 1. Do NOT call this.addPage() here.

    // Centered Title Header
    this.drawCenteredTitle('Valuation Report Format', 14, true);
    this.advanceCursor(4);

    // ==========================================
    // 1. APPLICATION DETAILS
    // ==========================================
    this.drawUtkarshSectionHeader('Application Details');

    const halfW = CONTENT_W / 2;
    const lblW = 160;
    const valW = CONTENT_W - lblW;

    this.drawKeyValueRow([
      { label: 'File Ref NO. / LAN No.', value: this.getF('refNo', this.projectCode || ''), labelWidth: lblW, valueWidth: valW, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Report', value: this.getF('reportDate', ''), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Loan Type', value: this.getF('loanType', 'LAP'), labelWidth: lblW, valueWidth: valW, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Applicant', value: this.getF('applicantName', ''), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Contact Persons/ Nos', value: this.getF('contactPersonsNos', ''), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Property Owner', value: this.getF('ownerName', ''), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Area', value: this.getF('propertyArea', ''), labelWidth: lblW, valueWidth: valW, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Holding Type', value: this.getF('holdingType', 'Free Hold'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Usage', value: this.getF('propertyUsage', 'Residential'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Area Authorised as per TCP', value: this.getF('areaAuthorisedTCP', ''), labelWidth: lblW, valueWidth: valW },
    ]);

    // ==========================================
    // 2. LOCATION DETAILS
    // ==========================================
    this.drawUtkarshSectionHeader('Location Details');

    const addrSubLblW = 120;
    const addrValW = CONTENT_W - lblW - addrSubLblW;

    this.drawKeyValueRow([
      { label: 'Address of Property', value: '', labelWidth: lblW, valueWidth: 0, labelBold: true },
      { label: 'As per firing', value: this.getF('addressAsPerFiring', ''), labelWidth: addrSubLblW, valueWidth: addrValW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: 'On Inspection (Postal)', value: this.getF('addressOnInspection', ''), labelWidth: addrSubLblW, valueWidth: addrValW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: 'As per Docs (Sanction & Legal)', value: this.getF('addressAsPerDocs', ''), labelWidth: addrSubLblW, valueWidth: addrValW },
    ]);

    this.drawKeyValueRow([
      { label: 'Person Met/ Nos.', value: this.getF('personMetNos', ''), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Address Matching', value: this.getF('addressMatching', 'Yes'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Landmark', value: this.getF('landmark', ''), labelWidth: lblW, valueWidth: halfW - lblW },
      { label: 'Zone as per City', value: this.getF('zoneAsPerCity', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Location of Plot / Property', value: this.getF('locationGPS', ''), labelWidth: lblW, valueWidth: valW, labelBold: true },
    ]);

    // Site Boundaries Comparison
    this.checkPageBreak(120);
    this.drawKeyValueRow([
      { label: 'Site Boundaries', value: '', labelWidth: lblW, valueWidth: 0, labelBold: true },
      { label: 'Actual as verified at site', value: '', labelWidth: (CONTENT_W - lblW) / 2, valueWidth: 0, labelBold: true },
      { label: 'As per Sale deed', value: '', labelWidth: (CONTENT_W - lblW) / 2, valueWidth: 0, labelBold: true },
    ]);
    const bColW = (CONTENT_W - lblW) / 2;
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: 'North', value: this.getF('bndActualNorth', ''), labelWidth: 50, valueWidth: bColW - 50 },
      { label: 'North', value: this.getF('bndDocNorth', ''), labelWidth: 50, valueWidth: bColW - 50 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: 'East', value: this.getF('bndActualEast', ''), labelWidth: 50, valueWidth: bColW - 50 },
      { label: 'East', value: this.getF('bndDocEast', ''), labelWidth: 50, valueWidth: bColW - 50 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: 'West', value: this.getF('bndActualWest', ''), labelWidth: 50, valueWidth: bColW - 50 },
      { label: 'West', value: this.getF('bndDocWest', ''), labelWidth: 50, valueWidth: bColW - 50 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: 'South', value: this.getF('bndActualSouth', ''), labelWidth: 50, valueWidth: bColW - 50 },
      { label: 'South', value: this.getF('bndDocSouth', ''), labelWidth: 50, valueWidth: bColW - 50 },
    ]);
    this.drawKeyValueRow([
      { label: 'Site Boundaries tallied with Title Deed', value: this.getF('boundaryTalliedRemark', ''), labelWidth: 240, valueWidth: CONTENT_W - 240 },
    ]);

    // Accessibility & Demarcation
    this.drawKeyValueRow([
      { label: 'Neighbourhood Type', value: this.getF('neighbourhoodType', 'Middle'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Marketability', value: this.getF('marketability', 'Good'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Accessibility', value: this.getF('siteAccess', ''), labelWidth: 140, valueWidth: halfW - 140, labelBold: true },
      { label: 'Proximity to amenities', value: this.getF('proximityAmenities', ''), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Within Municipal Limits', value: this.getF('withinMunicipalLimits', 'Yes'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Demarcation / Inquiries', value: `Demarcated: ${this.getF('plotDemarcation', 'Yes')}, Inquiry: ${this.getF('neighboursInquiry', 'Yes')}`, labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    // ==========================================
    // 3. DOCUMENT DETAILS & MUNICIPAL DETAILS
    // ==========================================
    this.checkPageBreak(140);
    this.drawUtkarshSectionHeader('Document Details / Municipal Details');

    this.drawKeyValueRow([
      { label: 'Sanction plan provided – Yes/No', value: this.getF('sanctionPlanProvided', 'No'), labelWidth: 180, valueWidth: halfW - 180 },
      { label: 'Sanction/ Permit No.', value: this.getF('sanctionPermitNo', 'NA'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Sanction', value: this.getF('sanctionDate', 'NA'), labelWidth: 180, valueWidth: halfW - 180 },
      { label: 'Valid Till', value: this.getF('validTill', 'NA'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'No. of Floors sanctioned', value: this.getF('floorsSanctioned', 'NA'), labelWidth: 180, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Sanctioned Areas', value: this.getF('sanctionedAreas', 'NA'), labelWidth: 180, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Sanctioning Authority', value: this.getF('sanctioningAuthority', ''), labelWidth: 180, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Municipal / DA Compliance (Compliance to maximum permissible area)', value: this.getF('municipalCompliance', ''), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Whether construction is as per the Local By-Laws, In case of Sanction Plan is not available', value: this.getF('localByLawsCompliance', ''), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Commencement Certificate Details', value: this.getF('commencementCertDetails', 'NA'), labelWidth: 180, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Legal Docs Provided: - Yes/No', value: this.getF('legalDocsProvided', 'Yes'), labelWidth: 180, valueWidth: halfW - 180 },
      { label: 'Details of the Legal Docs', value: this.getF('legalDocsDetails', ''), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    // ==========================================
    // 4. TECHNICAL DETAILS & ACCOMMODATION
    // ==========================================
    this.checkPageBreak(140);
    this.drawUtkarshSectionHeader('Technical Details');

    this.drawKeyValueRow([
      { label: 'Type of property', value: this.getF('technicalPropertyType', 'Residential'), labelWidth: 120, valueWidth: 100 },
      { label: 'No. Of Stories', value: this.getF('noOfStories', ''), labelWidth: 100, valueWidth: 90 },
      { label: 'Tenement Position', value: this.getF('tenementPosition', 'Self occupied'), labelWidth: 110, valueWidth: CONTENT_W - 120 - 100 - 100 - 90 - 110 },
    ]);
    this.drawKeyValueRow([
      { label: 'Construction Type', value: this.getF('constructionType', 'RCC'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'No. of lifts', value: this.getF('noOfLifts', 'Nil'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    // Accommodation details table
    const accoLblW = 160;
    const accoSubW = (CONTENT_W - accoLblW) / 2;
    this.drawKeyValueRow([
      { label: 'Accommodation Details (As per actual)', value: '', labelWidth: accoLblW, valueWidth: 0, labelBold: true },
      { label: 'B.F.', value: this.getF('accoBF', 'Nil'), labelWidth: 50, valueWidth: accoSubW - 50 },
      { label: 'Mezz F1', value: this.getF('accoMezz', 'Nil'), labelWidth: 50, valueWidth: accoSubW - 50 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: accoLblW, valueWidth: 0 },
      { label: 'G.F. RCC', value: this.getF('accoGF', ''), labelWidth: 60, valueWidth: accoSubW - 60 },
      { label: 'SF', value: this.getF('accoSF', ''), labelWidth: 50, valueWidth: accoSubW - 50 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: accoLblW, valueWidth: 0 },
      { label: 'F.F. RCC', value: this.getF('accoFF', ''), labelWidth: 60, valueWidth: accoSubW - 60 },
      { label: 'TF', value: this.getF('accoTF', 'NA'), labelWidth: 50, valueWidth: accoSubW - 50 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: accoLblW, valueWidth: 0 },
      { label: '', value: '', labelWidth: accoSubW, valueWidth: 0 },
      { label: '4th F', value: this.getF('acco4thF', 'NA'), labelWidth: 50, valueWidth: accoSubW - 50 },
    ]);

    this.drawKeyValueRow([
      { label: 'Floor No in case of Flat', value: this.getF('flatFloorNo', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Accommodation of Flat', value: this.getF('flatAccommodation', 'NA'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Is property has independent unit & independent access', value: this.getF('independentAccessUnit', 'Yes'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);

    // Finishes and Occupancy
    this.drawKeyValueRow([
      { label: 'Floor wise Occupancy', value: `Status: ${this.getF('occupancyStatus', '')}, Occupant: ${this.getF('occupantName', '')}`, labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Building Finishes', value: `Exterior: ${this.getF('finishExterior', '')}, Interior: ${this.getF('finishInterior', '')}\nFlooring: ${this.getF('finishFlooring', '')}, Woodwork: ${this.getF('finishWood', '')}`, labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Details of commercial usage if any', value: this.getF('commercialUsageDetails', 'NA'), labelWidth: 160, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Completion Status', value: this.getF('completionStatus', '100% Completed'), labelWidth: 140, valueWidth: 130 },
      { label: 'Current Age', value: this.getF('currentAge', ''), labelWidth: 90, valueWidth: 80 },
      { label: 'Residual Age', value: this.getF('residualAge', ''), labelWidth: 90, valueWidth: CONTENT_W - 140 - 130 - 90 - 80 - 90 },
    ]);

    // ==========================================
    // 5. MARKET VALUE TABLE & NET MORTGAGE VALUE
    // ==========================================
    this.checkPageBreak(180);
    this.drawUtkarshSectionHeader('Market Value of Plot / Ready House / Resale Flat / Completed Property');

    const mvHeaders = ['Items', 'Measured Area (In sq. Ft.)', 'Rate (Per Sq. Ft.)', 'Total Value (₹)'];
    const mvRows = [
      [
        'Construction Component measured BUA of RCC on 100% completion',
        this.getF('valConstArea', ''),
        this.getF('valConstRate', ''),
        this.getF('valConstTotal', ''),
      ],
      [
        'Total BUA value',
        '',
        '',
        this.getF('valTotalBUA', ''),
      ],
      [
        'Depreciation Rate for construction (If any)',
        this.getF('valDepDesc', ''),
        'Deduct',
        this.getF('valDepAmount', 'Nil'),
      ],
      [
        'Construction Component value after depreciation',
        '',
        '',
        this.getF('valConstAfterDep', ''),
      ],
      [
        'Land Component (As per Documents)',
        this.getF('valLandArea', ''),
        this.getF('valLandRate', ''),
        this.getF('valLandTotal', ''),
      ],
    ];
    this.drawDataTable(mvHeaders, mvRows, 9);

    // Net Mortgage Table & Risk Factors
    this.advanceCursor(4);
    this.drawKeyValueRow([
      { label: 'Covered Car Parking', value: `Nos: ${this.getF('carParkingNos', 'NA')}   @ ₹ = ${this.getF('carParkingRate', 'NA')}`, labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Total Parking Value', value: this.getF('carParkingTotal', 'NA'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Other One Time Cost (society charge, taxes etc.)', value: this.getF('otherOneTimeCost', 'NA'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      {
        label: 'NET MORTGAGE VALUE (Permissible Construction Value + Land Value/Share for Bungalow / Row House/Flats + Amenities Cost + Parking + Others – Depreciation Value) (In ₹)',
        value: this.getF('netMortgageValue', ''),
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
        labelBold: true,
      },
    ]);
    this.drawKeyValueRow([
      { label: 'Govt. value (Rs per sqft)', value: this.getF('govtRate', ''), labelWidth: 180, valueWidth: halfW - 180 },
      { label: 'DISTRESSED / FORCED VALUE', value: this.getF('forcedValue', ''), labelWidth: 180, valueWidth: halfW - 180, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Valuation Done Earlier with date of Valuation', value: this.getF('valuationDoneEarlier', 'No'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'In Municipal / Development Authority Demolition List', value: this.getF('inDemolitionList', 'No'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Is the property in negative area', value: this.getF('inNegativeArea', 'NO'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Any litigation observed on the property', value: this.getF('litigationObserved', 'NO'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property related Deviations accepted under LAP Advantage / BL Advantage Program', value: this.getF('deviationsAccepted', 'NA'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);

    // ==========================================
    // 6. REMARKS & DECLARATION
    // ==========================================
    this.checkPageBreak(120);
    this.drawUtkarshSectionHeader('Remarks & Declaration');

    this.drawKeyValueRow([
      { label: 'Remarks / Observations', value: this.getF('remarks', ''), labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    this.advanceCursor(4);
    const declText =
      'I hereby declare that:\n• We have no direct interest in the property valued.\n• The information furnished in the report is true and correct to the best of my knowledge.';
    this.drawKeyValueRow([
      { label: 'Declaration', value: declText, labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    this.advanceCursor(10);
    this.drawKeyValueRow([
      {
        label: `For Seal with Signature\n\n\nDate: ${this.getF('reportDate', '')}`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: `Place: ${this.getF('place', 'Bhubaneswar')}\n\nM/S S MOHANTY ASSOCIATES`,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
    ]);

    // ==========================================
    // 7. LOCATION MAPS & SKETCHES
    // ==========================================
    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.sketchMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.cadastralMapImages || []),
      ...(this.fields.maps || []),
    ];
    if (maps && maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION PLAN & SKETCH MAP');
    }

    // ==========================================
    // 8. VERIFIED DOCUMENTS
    // ==========================================
    const docs = this.fields.documentImages || this.fields.documents || [];
    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }

    // ==========================================
    // 9. SITE PHOTOGRAPHS
    // ==========================================
    const photos = this.fields.propertyImages || this.fields.photos || [];
    if (photos && photos.length > 0) {
      await this.drawPhotoGrid(photos, 'PROPERTY SITE PHOTOGRAPHS');
    }
  }
}
