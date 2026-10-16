import {
  PDFBankRenderer,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFVistaarFinanceRenderer extends PDFBankRenderer {
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
   * Section Header row with solid banner
   */
  private drawVistaarSectionHeader(title: string) {
    this.drawSectionHeader(title);
  }

  async drawContent(): Promise<void> {
    // NOTE: init() already adds page 1. Do NOT call this.addPage() here.

    // Top Header Row: Name of Valuation Agency & Date of Valuation
    const halfW = CONTENT_W / 2;
    this.drawKeyValueRow([
      {
        label: 'Name of Valuation Agency',
        value: this.getF('valuationAgency', 'M/S S MOHANTY ASSOCIATES'),
        labelWidth: 160,
        valueWidth: halfW - 160,
        labelBold: true,
      },
      {
        label: 'Date of Valuation',
        value: this.getF('valuationDate', ''),
        labelWidth: 120,
        valueWidth: halfW - 120,
        labelBold: true,
      },
    ]);

    // ==========================================
    // 1. TECHNICAL INITIATION REQUEST FORM DATA
    // ==========================================
    this.drawVistaarSectionHeader('Technical Initiation Request Form Data');

    this.drawKeyValueRow([
      { label: 'Proposal No', value: this.getF('proposalNo', this.projectCode || ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Case Type', value: this.getF('caseType', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Inspection / Site visit', value: this.getF('inspectionDate', ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Nearest Landmark', value: this.getF('nearestLandmark', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Name of the Customer/ Applicant & Contact Details',
        value: this.getF('applicantDetails', ''),
        labelWidth: 160,
        valueWidth: CONTENT_W - 160,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Name of Current Owner / Seller',
        value: this.getF('ownerSeller', ''),
        labelWidth: 160,
        valueWidth: CONTENT_W - 160,
      },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Name of the Person met at site & Contact No.',
        value: this.getF('personMetAtSite', ''),
        labelWidth: 160,
        valueWidth: CONTENT_W - 160,
      },
    ]);

    // Address of property being appraised (Multi-level rows)
    const addrSubLabelW = 90;
    const addrMainLabelW = 160;
    const addrValW = CONTENT_W - addrMainLabelW - addrSubLabelW;

    this.drawKeyValueRow([
      { label: 'Address of the property being appraised', value: '', labelWidth: addrMainLabelW, valueWidth: 0, labelBold: true },
      { label: 'As per TRF', value: this.getF('addressAsPerTRF', ''), labelWidth: addrSubLabelW, valueWidth: addrValW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: addrMainLabelW, valueWidth: 0 },
      { label: 'As per Document', value: this.getF('addressAsPerDoc', ''), labelWidth: addrSubLabelW, valueWidth: addrValW },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: addrMainLabelW, valueWidth: 0 },
      { label: 'As per Actual at site', value: this.getF('addressAtSite', ''), labelWidth: addrSubLabelW, valueWidth: addrValW },
    ]);

    this.drawKeyValueRow([
      {
        label: 'Documents Provided',
        value: this.getF('documentsProvided', ''),
        labelWidth: 160,
        valueWidth: CONTENT_W - 160,
        labelBold: true,
      },
    ]);

    // ==========================================
    // 2. LOCATIONAL & PROPERTY SPECIFIC DETAILS
    // ==========================================
    this.drawVistaarSectionHeader('Locational & Property Specific Details (based on site visit)');

    this.drawKeyValueRow([
      { label: 'Status of Land Holding', value: this.getF('landHoldingStatus', ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Developed By', value: this.getF('developedBy', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Type of Property', value: this.getF('typeOfProperty', ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Type of Locality', value: this.getF('typeOfLocality', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Inspection / Site visit', value: this.getF('inspectionDate', '04.03.2021'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Occupation Status', value: this.getF('occupationStatus', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Location/Zoning as per Master Plan', value: this.getF('zoningMasterPlan', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Property Usage', value: this.getF('propertyUsage', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Plot Demarcation', value: this.getF('plotDemarcation', ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Property Identifiable', value: this.getF('propertyIdentifiable', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Identified Through', value: this.getF('identifiedThrough', ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Within MC / GP Limit & Distance From Nearest M.C', value: this.getF('withinMCLimit', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Internal Finishing', value: this.getF('internalFinishing', ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Type of Structure', value: this.getF('typeOfStructure', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'No. of Floors in the building', value: this.getF('noOfFloors', ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Located on Floor No.', value: this.getF('locatedOnFloor', 'NA'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Total No. of Flats / Unit in building', value: this.getF('totalFlats', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'External Finishing', value: this.getF('externalFinishing', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Construction Stage of the Property (in 100%)', value: this.getF('constructionStage', '100%'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Year of Completion or Disbursement', value: this.getF('yearOfCompletion', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Age of the Property', value: this.getF('ageOfProperty', ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Future Physical Life of Property', value: this.getF('futurePhysicalLife', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    // ==========================================
    // 3. BOUNDARIES
    // ==========================================
    this.checkPageBreak(120);
    this.drawVistaarSectionHeader('Boundaries');

    const bndHeaders = ['Boundaries', 'North', 'South', 'East', 'West'];
    const bndRows = [
      [
        'As per Documents (Sale Deed)',
        this.getF('bndDocNorth', ''),
        this.getF('bndDocSouth', ''),
        this.getF('bndDocEast', ''),
        this.getF('bndDocWest', ''),
      ],
      [
        'As per Bhunaksha / Map',
        this.getF('bndBhunakshaNorth', ''),
        this.getF('bndBhunakshaSouth', ''),
        this.getF('bndBhunakshaEast', ''),
        this.getF('bndBhunakshaWest', ''),
      ],
      [
        'As per Site / Actual',
        this.getF('bndSiteNorth', ''),
        this.getF('bndSiteSouth', ''),
        this.getF('bndSiteEast', ''),
        this.getF('bndSiteWest', ''),
      ],
    ];
    this.drawDataTable(bndHeaders, bndRows, 9);

    this.drawKeyValueRow([
      { label: 'Boundaries Matching', value: this.getF('boundariesMatching', 'Yes'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'If No, then reason thereon', value: this.getF('boundariesMismatchReason', ''), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    // ==========================================
    // 4. SETBACKS / MARGIN NA & HEIGHT/STOREYS
    // ==========================================
    this.checkPageBreak(120);
    this.drawVistaarSectionHeader('Setbacks / Margin NA');

    const sbHeaders = ['Setbacks / Margin in the Building (in Ft)', 'Front', 'Rear', 'Left Side', 'Right Side'];
    const sbRows = [
      [
        'As per sanctioned/ permissible byelaws',
        this.getF('sbPermFront', 'NA'),
        this.getF('sbPermRear', 'NA'),
        this.getF('sbPermLeft', 'NA'),
        this.getF('sbPermRight', 'NA'),
      ],
      [
        'As per Site / Actual',
        this.getF('sbActualFront', 'NA'),
        this.getF('sbActualRear', 'NA'),
        this.getF('sbActualLeft', 'NA'),
        this.getF('sbActualRight', 'NA'),
      ],
    ];
    this.drawDataTable(sbHeaders, sbRows, 9);

    this.drawVistaarSectionHeader('Height / Storeys');
    this.drawKeyValueRow([
      { label: 'As per sanctioned/ permissible byelaws', value: this.getF('heightPermissible', 'NA'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'As per Site / Actual', value: this.getF('heightActual', ''), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);

    // ==========================================
    // 5. BUILT-UP AREA & ACCOMMODATION DETAILS
    // ==========================================
    this.checkPageBreak(140);
    this.drawVistaarSectionHeader('Built-up Area & Accommodation Details');

    const buaHeaders = [
      'Floor (Pl mention floor wise)',
      'Accommodation',
      'Carpet Area (Sft)',
      'Actual BUA / SBUA (Sft)',
      'Permissible BUA (Sft)',
      'Adopted Built-up area (Sft)',
    ];
    const buaRows = [
      [
        'Basement / Stilt',
        this.getF('buaBasementAccom', 'NA'),
        this.getF('buaBasementCarpet', 'NA'),
        this.getF('buaBasementActual', 'NA'),
        this.getF('buaBasementPerm', 'NA'),
        this.getF('buaBasementAdopted', 'NA'),
      ],
      [
        'Ground Floor',
        this.getF('buaGFAccom', ''),
        this.getF('buaGFCarpet', ''),
        this.getF('buaGFActual', ''),
        this.getF('buaGFPerm', ''),
        this.getF('buaGFAdopted', ''),
      ],
      [
        'Total',
        this.getF('buaTotalAccom', 'NA'),
        this.getF('buaTotalCarpet', ''),
        this.getF('buaTotalActual', ''),
        this.getF('buaTotalPerm', ''),
        this.getF('buaTotalAdopted', ''),
      ],
    ];
    this.drawDataTable(buaHeaders, buaRows, 9);

    this.drawKeyValueRow([
      { label: 'Violation observed if any', value: this.getF('violationObserved', 'NA'), labelWidth: 160, valueWidth: CONTENT_W - 160 },
    ]);

    // ==========================================
    // 6. PLAN APPROVALS & ESTIMATE ANALYSIS
    // ==========================================
    this.checkPageBreak(120);
    this.drawVistaarSectionHeader('Plan Approvals (BP not Provided)');

    this.drawKeyValueRow([
      { label: 'Construction as per approved/ sanctioned plans', value: this.getF('constructionAsPerPlan', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Details of approved plan with approval no and date', value: this.getF('planApprovalDetails', ''), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Construction permission Number and date', value: this.getF('constructionPermissionNo', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Violations Observed If Any', value: this.getF('approvalViolations', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'If plans not available then is the structure confirming to local byelaws', value: this.getF('confirmingByelaws', 'NA'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);

    this.drawVistaarSectionHeader('Estimate Analysis (Applicable only in Self Construction cases)');
    this.drawKeyValueRow([
      { label: 'Estimated Cost (In Rs)', value: this.getF('estimatedCostTotal', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Estimated Cost (in Rs per Sqft)', value: this.getF('estimatedCostRate', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Justified Estimated Cost (in Rs per Sqft)', value: this.getF('justifiedCostRate', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Adoptable / Justified Estimated Cost (In Rs)', value: this.getF('adoptableJustifiedCost', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
    ]);

    // ==========================================
    // 7. VALUATION OF PROPERTY
    // ==========================================
    this.checkPageBreak(200);
    this.drawVistaarSectionHeader('Valuation of Property (Fair Market Valuation / Distress Valuation)');

    const landArea = this.getF('landAreaSqft', '');
    const adoptableBUA = this.getF('adoptableBUASqft', '');
    const marketRateLandRange = this.getF('marketRateLandRange', '');
    const constructionRate = this.getF('constructionRatePerSqft', '');
    const recRateLand = this.getF('recRateLandPerSqft', '');
    const totalConstVal100 = this.getF('totalConstValue100', '');
    const totalLandValue = this.getF('totalLandValue', '');
    const totalConstValStage = this.getF('totalConstValueStage', '');
    const mv100 = this.getF('marketValue100', '');
    const mvStage = this.getF('marketValueStage', '');
    const distress100 = this.getF('distressValue100', '');
    const distressStage = this.getF('distressValueStage', '');

    this.drawKeyValueRow([
      { label: 'Land Area (In Sqft)', value: String(landArea), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Adoptable Built-up Area (in Sqft)', value: String(adoptableBUA), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Current Market Rate of land in locality (Range)', value: String(marketRateLandRange), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Construction Cost (Rs per sft)', value: String(constructionRate), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Recommended Rate of Land (Rs per sqft)', value: String(recRateLand), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Total Construction value for 100% complete building (in Rs)', value: formatIndianCurrency(totalConstVal100), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Total Land Value (in Rs)', value: formatIndianCurrency(totalLandValue), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Total Construction Value for present construction stage (in Rs) 100%', value: formatIndianCurrency(totalConstValStage), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Market Value of Land & Building for 100% complete property (in Rs)', value: formatIndianCurrency(mv100), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Market Value of Land & Building for present completed property 100% (in Rs)', value: formatIndianCurrency(mvStage), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Distress Value of 100% complete property @ 75% of MV', value: formatIndianCurrency(distress100), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Distress Value of present completed property @ 75% of MV (As on date)', value: formatIndianCurrency(distressStage), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Flat / Apartment / Shop / Office SBUA (in Sqft)', value: this.getF('commercialSBUA', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Composite sale rate (Rs per sqft)', value: this.getF('compositeRate', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Total Market Value of Apartment / Shop / Flat / Office (Rs per sqft)', value: this.getF('totalCommercialMV', 'NA'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Government Guideline/ Circle rate for Land (Rs per sqft)', value: this.getF('govtRateLand', ''), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Land Value as per Government Rate (Rs)', value: this.getF('landValueGovt', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Government Guideline/ Circle rate for Flats (Rs per sqft)', value: this.getF('govtRateFlats', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Flat / Apartment Value as per Government Rate (Rs)', value: this.getF('flatValueGovt', 'NA'), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      { label: 'Latitude (N)', value: this.getF('latitude', ''), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
      { label: 'Longitude (E)', value: this.getF('longitude', ''), labelWidth: 160, valueWidth: halfW - 160, labelBold: true },
    ]);

    // ==========================================
    // 8. PROPERTY SPECIFIC REMARKS & OBSERVATION
    // ==========================================
    this.checkPageBreak(120);
    this.drawVistaarSectionHeader('Property Specific Remarks & Observation');

    const defaultRemarks =
      'Subject property is a asbestos roofing house having land extent of 4356sqft (AC.0.100Decs, Homestead), having measured BUA 600sqft. Age of property is about 5-years. Copy of approved plan not provided. Property located within Bharatipur GP limit & surrounding areas are residential in nature. Property approaches 30-feet wide Road. This asbestos house is occupied by customer for resedential purpose. Valuation has been done for land component only. Asbestos roofing BUA value considered, as per internal policy of Vistar Finace. Note- As per sale deed, East & West side boundary are not mentioned';

    this.drawKeyValueRow([
      {
        label: 'Remarks / Observation',
        value: this.getF('remarks', defaultRemarks),
        labelWidth: 140,
        valueWidth: CONTENT_W - 140,
      },
    ]);

    // ==========================================
    // 9. VALUER CERTIFICATION
    // ==========================================
    this.checkPageBreak(100);
    this.drawVistaarSectionHeader('Valuer Certification');

    this.drawKeyValueRow([
      { label: 'Date of Visit', value: this.getF('inspectionDate', '04.03.2021'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Date of Report Submission', value: this.getF('reportSubmissionDate', ''), labelWidth: 160, valueWidth: halfW - 160 },
    ]);
    this.drawKeyValueRow([
      {
        label: 'Name of Engineer Visited the property',
        value: this.getF('visitingEngineer', 'M/S S MOHANTY ASSOCIATES'),
        labelWidth: 160,
        valueWidth: halfW - 160,
      },
      {
        label: 'Authorized Signatory Name & Signature',
        value: this.getF('authorizedSignatory', 'M/S S MOHANTY ASSOCIATES\nEr. S. Mohanty (Approved Valuer)'),
        labelWidth: 160,
        valueWidth: halfW - 160,
        labelBold: true,
      },
    ]);

    // ==========================================
    // 10. PROPERTY PHOTOGRAPHS
    // ==========================================
    const photos = this.fields.propertyImages || this.fields.photos || [];
    if (photos && photos.length > 0) {
      this.addPage();
      this.drawVistaarSectionHeader('PROPERTY PHOTOGRAPHS');
      this.advanceCursor(2);

      // Customer Meta Header Bar matching sample image 5
      this.drawKeyValueRow([
        {
          label: 'Name of the Customer/ Applicant',
          value: this.getF('applicantDetails', ''),
          labelWidth: 160,
          valueWidth: halfW - 160,
          labelBold: true,
        },
        {
          label: 'Proposal No.',
          value: this.getF('proposalNo', this.projectCode || ''),
          labelWidth: 120,
          valueWidth: halfW - 120,
          labelBold: true,
        },
      ]);
      this.drawKeyValueRow([
        {
          label: 'Address of the property being appraised',
          value: this.getF('addressAsPerDoc', 'Khata No-346,Plot No-1202(Area=AC.0.100Decs,Homested),Mouza-Bharati Pur,Tahasil-Pipili,PS-Pipili,Dist-Puri,Odisha,Pin-752104'),
          labelWidth: 160,
          valueWidth: CONTENT_W - 160,
        },
      ]);
      this.advanceCursor(6);

      await this.drawPhotoGrid(photos, 'PROPERTY PHOTOGRAPHS', 200, false);
    }

    // ==========================================
    // 11. LOCATION MAPS & SKETCHES
    // ==========================================
    const maps = [
      ...(this.fields.locationMapImages || []),
      ...(this.fields.mouzaMapImages || []),
      ...(this.fields.sketchMapImages || []),
      ...(this.fields.maps || []),
    ];
    if (maps && maps.length > 0) {
      await this.drawMapGallery(maps, 'LOCATION PLAN & SKETCH MAP');
    }

    // ==========================================
    // 12. VERIFIED DOCUMENTS
    // ==========================================
    const docs = this.fields.documentImages || this.fields.documents || [];
    if (docs && docs.length > 0) {
      await this.drawDocumentsGallery(docs);
    }
  }
}
