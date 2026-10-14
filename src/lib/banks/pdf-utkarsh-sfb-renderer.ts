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
    this.addPage();

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
      { label: 'File Ref NO. / LAN No.', value: this.getF('fileRefNo', this.projectCode || '1537260505111947'), labelWidth: lblW, valueWidth: valW, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Report', value: this.getF('reportDate', '13/06/2026'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Loan Type', value: this.getF('loanType', 'LAP'), labelWidth: lblW, valueWidth: valW, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Applicant', value: this.getF('applicantName', 'Mahammada Imran'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Contact Persons/ Nos', value: this.getF('contactPersonsNos', 'Mahammada Imran: 9238305224/8260205224/9658715707'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Property Owner', value: this.getF('ownerName', 'Mahammad Ershad, S/O-Mahammad Ekram'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Area', value: this.getF('propertyArea', '(805sqft)'), labelWidth: lblW, valueWidth: valW, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Holding Type', value: this.getF('holdingType', 'Free Hold'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Usage', value: this.getF('propertyUsage', 'Residential / Commercial / Residential cum Commercial/Industrial / Mixed / Others (Specify) [Residential]'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Area Authorised as per TCP', value: this.getF('areaAuthorisedTCP', 'WithinBDA limit'), labelWidth: lblW, valueWidth: valW },
    ]);

    // ==========================================
    // 2. LOCATION DETAILS
    // ==========================================
    this.drawUtkarshSectionHeader('Location Details');

    const addrSubLblW = 120;
    const addrValW = CONTENT_W - lblW - addrSubLblW;

    this.drawKeyValueRow([
      { label: 'Address of Property', value: '', labelWidth: lblW, valueWidth: 0, labelBold: true },
      { label: 'As per firing', value: '', labelWidth: addrSubLblW, valueWidth: 0 },
      {
        label: this.getF(
          'addressAsPerFiring',
          'Hall Khata No-1611/309, Hall Plot No-4403/6312, Baragarh Housing Scheme and House No. EB-358, Plot No- 2405, (Area=805sqft) Mouza-Bhubaneswar Town Unit No-35 Baragarh, Tahasil/PS-Bhubaneswar, Dist-Khurda, Odisha, Pin-751018'
        ),
        value: '',
        labelWidth: addrValW,
        valueWidth: 0,
      },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: 'On Inspection (Postal)', value: '', labelWidth: addrSubLblW, valueWidth: 0 },
      {
        label: this.getF(
          'addressOnInspection',
          'Hall Khata No- 1611/309, Hall Plot No- 4403/6312, Baragarh Housing Scheme and House No. EB-358, Plot No- 2405, (Area=805sqft) Mouza-Bhubaneswar Town Unit No-35 Baragarh, Tahasil/PS-Bhubaneswar, Dist-Khurda, Odisha, Pin-751018'
        ),
        value: '',
        labelWidth: addrValW,
        valueWidth: 0,
      },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: 'As per Docs (Sanction & Legal)', value: '', labelWidth: addrSubLblW, valueWidth: 0 },
      {
        label: this.getF(
          'addressAsPerDocs',
          'Hall Khata No- 1611/309, Hall Plot No- 4403/6312, Baragarh Housing Scheme and House No. EB-358, Plot No- 2405, (Area=805sqft) Mouza-Bhubaneswar Town Unit No-35 Baragarh, Tahasil/PS-Bhubaneswar, Dist-Khurda, Odisha, Pin-751018'
        ),
        value: '',
        labelWidth: addrValW,
        valueWidth: 0,
      },
    ]);

    this.drawKeyValueRow([
      { label: 'Person Met/ Nos.', value: this.getF('personMetNos', 'Mahammada Imran: 9238305224/8260205224/9658715707'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Address Matching', value: this.getF('addressMatching', 'Yes'), labelWidth: lblW, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Landmark', value: this.getF('landmark', 'Near Shree Jagannath Temple'), labelWidth: lblW, valueWidth: halfW - lblW },
      { label: 'Zone as per City', value: this.getF('zoneAsPerCity', 'Residential'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Location of Plot / Property', value: this.getF('locationGPS', '20.248472, 85.853611'), labelWidth: lblW, valueWidth: valW, labelBold: true },
    ]);

    // Site Boundaries Comparison
    this.checkPageBreak(120);
    this.drawKeyValueRow([
      { label: 'Site Boundaries', value: '', labelWidth: lblW, valueWidth: 0, labelBold: true },
      { label: 'Site Boundaries (Actual as verified at time of site visit.)', value: '', labelWidth: (CONTENT_W - lblW) / 2, valueWidth: 0, labelBold: true },
      { label: 'Site Boundaries (As per Sale deed)', value: '', labelWidth: (CONTENT_W - lblW) / 2, valueWidth: 0, labelBold: true },
    ]);
    const bColW = (CONTENT_W - lblW) / 2;
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: `North : ${this.getF('bndActualNorth', "Other's Building")}`, value: '', labelWidth: bColW, valueWidth: 0 },
      { label: `North : ${this.getF('bndDocNorth', 'EB-557')}`, value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: `East  : ${this.getF('bndActualEast', "Other's Building")}`, value: '', labelWidth: bColW, valueWidth: 0 },
      { label: `East  : ${this.getF('bndDocEast', 'EB-347')}`, value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: `West  : ${this.getF('bndActualWest', 'Road')}`, value: '', labelWidth: bColW, valueWidth: 0 },
      { label: `West  : ${this.getF('bndDocWest', 'Road')}`, value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: lblW, valueWidth: 0 },
      { label: `South : ${this.getF('bndActualSouth', "Other's Building")}`, value: '', labelWidth: bColW, valueWidth: 0 },
      { label: `South : ${this.getF('bndDocSouth', 'EB-359')}`, value: '', labelWidth: bColW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'Site Boundaries tallied with Boundaries in Title Deed provided by Bank.', value: '', labelWidth: 200, valueWidth: 0, labelBold: true },
      { label: `Remark: ${this.getF('boundaryTalliedRemark', 'Boundary is matching as per documents')}`, value: '', labelWidth: CONTENT_W - 200, valueWidth: 0 },
    ]);

    // Accessibility & Demarcation
    this.drawKeyValueRow([
      { label: 'Neighbourhood Type', value: this.getF('neighbourhoodType', 'Lower / Middle / Upper / Posh [Middle]'), labelWidth: 140, valueWidth: halfW - 140 },
      { label: 'Marketability', value: this.getF('marketability', 'Poor / Average / Good [Good]'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Accessibility', value: '', labelWidth: 140, valueWidth: 0, labelBold: true },
      { label: 'Connectivity: By public & private transport', value: '', labelWidth: 180, valueWidth: 0 },
      { label: `Proximity to amenities: ${this.getF('proximityAmenities', '1-2 Kms')}`, value: '', labelWidth: CONTENT_W - 140 - 180, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: 140, valueWidth: 0 },
      { label: `Site Access: ${this.getF('siteAccess', "15-Feet wide Road")}`, value: '', labelWidth: 180, valueWidth: 0 },
      { label: `Within Municipal Limits: ${this.getF('withinMunicipalLimits', 'Yes')}`, value: '', labelWidth: CONTENT_W - 140 - 180, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Identified thru', value: `Site/ Plot demarcation – ${this.getF('plotDemarcation', 'Yes')}, Neighbours inquiry - ${this.getF('neighboursInquiry', 'Yes')}`, labelWidth: 160, valueWidth: CONTENT_W - 160 },
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
      { label: 'Sanctioning Authority', value: this.getF('sanctioningAuthority', 'Plan not provided'), labelWidth: 180, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Municipal / DA Compliance (Compliance to maximum permissible area)', value: this.getF('municipalCompliance', 'Municipal Limit'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Whether construction is as per the Local By-Laws, In case of Sanction Plan is not available', value: this.getF('localByLawsCompliance', 'WithinBDA limit'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Commencement Certificate Details', value: this.getF('commencementCertDetails', 'NA'), labelWidth: 180, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Legal Docs Provided: - Yes/No', value: this.getF('legalDocsProvided', 'Yes'), labelWidth: 180, valueWidth: halfW - 180 },
      { label: 'Details of the Legal Docs', value: this.getF('legalDocsDetails', 'Copy of Allotment deed, ROR'), labelWidth: 140, valueWidth: halfW - 140 },
    ]);

    // ==========================================
    // 4. TECHNICAL DETAILS & ACCOMMODATION
    // ==========================================
    this.checkPageBreak(140);
    this.drawUtkarshSectionHeader('Technical Details');

    this.drawKeyValueRow([
      { label: 'Type of property', value: this.getF('technicalPropertyType', 'Residential'), labelWidth: 120, valueWidth: 100 },
      { label: 'No. Of Stories', value: this.getF('noOfStories', 'G+2'), labelWidth: 100, valueWidth: 90 },
      { label: 'Tenement Position', value: this.getF('tenementPosition', 'Self occupied'), labelWidth: 110, valueWidth: CONTENT_W - 120 - 100 - 100 - 90 - 110 },
    ]);
    this.drawKeyValueRow([
      { label: 'Construction Type', value: this.getF('constructionType', 'RCC/ Load Bearing [RCC]'), labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'No. of lifts', value: this.getF('noOfLifts', 'Nil'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);

    // Accommodation details table
    const accoLblW = 160;
    const accoSubW = (CONTENT_W - accoLblW) / 2;
    this.drawKeyValueRow([
      { label: 'Accommodation Details to be mentioned As per actual(G+2)', value: '', labelWidth: accoLblW, valueWidth: 0, labelBold: true },
      { label: `B.F. – ${this.getF('accoBF', 'Nil')}`, value: '', labelWidth: accoSubW, valueWidth: 0 },
      { label: `Mezz F1 – ${this.getF('accoMezz', 'Nil')}`, value: '', labelWidth: accoSubW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: accoLblW, valueWidth: 0 },
      { label: `G.F. RCC – ${this.getF('accoGF', '805sqft')}`, value: '', labelWidth: accoSubW, valueWidth: 0 },
      { label: `SF: - ${this.getF('accoSF', '568sqft')}`, value: '', labelWidth: accoSubW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: accoLblW, valueWidth: 0 },
      { label: `F.F. RCC – ${this.getF('accoFF', '805sqft')}`, value: '', labelWidth: accoSubW, valueWidth: 0 },
      { label: `TF: - ${this.getF('accoTF', 'NA')}`, value: '', labelWidth: accoSubW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: accoLblW, valueWidth: 0 },
      { label: '', value: '', labelWidth: accoSubW, valueWidth: 0 },
      { label: `4th F:- ${this.getF('acco4thF', 'NA')}`, value: '', labelWidth: accoSubW, valueWidth: 0 },
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
      { label: 'Floor wise Occupancy', value: `Status: ${this.getF('occupancyStatus', 'Owner')}, Occupant: ${this.getF('occupantName', 'Mahammada Imran')}`, labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Building Finishes', value: `Exterior: ${this.getF('finishExterior', 'Good')}, Interior: ${this.getF('finishInterior', 'Good')}\nFlooring: ${this.getF('finishFlooring', 'Tiles')}, Woodwork: ${this.getF('finishWood', 'Wood')}`, labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Details of commercial usage if any', value: this.getF('commercialUsageDetails', 'NA'), labelWidth: 160, valueWidth: valW },
    ]);
    this.drawKeyValueRow([
      { label: 'Completion Status', value: this.getF('completionStatus', '100% Completed'), labelWidth: 140, valueWidth: 130 },
      { label: 'Current Age', value: this.getF('currentAge', '20-Years'), labelWidth: 90, valueWidth: 80 },
      { label: 'Residual Age', value: this.getF('residualAge', '40-Years'), labelWidth: 90, valueWidth: CONTENT_W - 140 - 130 - 90 - 80 - 90 },
    ]);

    // ==========================================
    // 5. MARKET VALUE TABLE & NET MORTGAGE VALUE
    // ==========================================
    this.checkPageBreak(180);
    this.drawUtkarshSectionHeader('Market Value of Plot / Ready House / Resale Flat / Completed Property');

    const mvHeaders = ['Items', 'Measured Area (In sq. Ft.)', 'Rate (Per Sq. Ft.)', 'Total Value (₹)'];
    const mvRows = [
      [
        'Construction Component measured BUA of G+2 RCC on 100% completion',
        this.getF('valConstArea', '2178sqft'),
        this.getF('valConstRate', 'Rs.2200/-'),
        this.getF('valConstTotal', 'Rs.47,91,600/-'),
      ],
      [
        'Total BUA value',
        '',
        '',
        this.getF('valTotalBUA', 'Rs.47,91,600/-'),
      ],
      [
        'Depreciation Rate for construction (If any)',
        this.getF('valDepDesc', '1.00% per years for 20-Years i.e. 20%'),
        'Deduct',
        this.getF('valDepAmount', 'Nil'),
      ],
      [
        'Construction Component value after depreciation',
        '',
        '',
        this.getF('valConstAfterDep', 'Rs.47,91,600/-'),
      ],
      [
        'Land Component (As per Documents)',
        this.getF('valLandArea', '805sqft'),
        this.getF('valLandRate', 'Rs.8000/-'),
        this.getF('valLandTotal', 'Rs.64,40,000/-'),
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
        value: `Rs.64,40,000/- + Rs.47,91,600/- =\n${this.getF('netMortgageValue', 'Rs.1,12,31,600/-')}`,
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
        labelBold: true,
      },
    ]);
    this.drawKeyValueRow([
      { label: 'Govt. value (Rs per sqft)', value: this.getF('govtRate', 'Rs.2048/-'), labelWidth: 180, valueWidth: halfW - 180 },
      { label: 'DISTRESSED / FORCED VALUE', value: this.getF('forcedValue', 'Rs.89,85,280/-'), labelWidth: 180, valueWidth: halfW - 180, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Valuation Done Earlier with date of Valuation', value: this.getF('valuationDoneEarlier', '13/05/2026'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'In Municipal / Development Authority Demolition List', value: this.getF('inDemolitionList', 'No (Within BDAlimit)'), labelWidth: 260, valueWidth: CONTENT_W - 260 },
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

    const defaultRemarks =
      'Remarks: Subject property is a G+2 storied residential building, having land extent of 805sqft, having measured BUA 2178sqft (GF-805sqft, FF-805sqft&SF-568sqft). Approved plan is not provided. It is accessible with 15-feet wide road & surrounding areas are residential in nature. Age of the property is about20-years. All civicamenities are present with 1-2 kms from the property. This plot is coming under BDA limit& Primary residential use zone. Entire building isused by the customer for residential purpose. Valuation has been done for land & measured BUA of G+2storied residential building.As approved plan is not provided, it is up to sole discretion of Utkarsh Bank to consider the BUA value or not.';

    this.drawKeyValueRow([
      { label: 'Remarks / Observations', value: this.getF('remarks', defaultRemarks), labelWidth: 140, valueWidth: CONTENT_W - 140 },
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
        label: `For Seal with Signature\n\n\nDate: ${this.getF('reportDate', '13/06/2026')}`,
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
