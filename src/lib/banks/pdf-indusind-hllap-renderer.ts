import { PDFBankRenderer } from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import {
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFIndusIndHLLAPRenderer extends PDFBankRenderer {
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
   * Helper to draw a section row with numbering (e.g. "1", "GENERAL DETAILS")
   */
  private drawIndusSectionHeader(num: string, title: string) {
    const numW = 28;
    const titleW = CONTENT_W - numW;

    this.drawKeyValueRow([
      {
        label: num,
        value: '',
        labelWidth: numW,
        valueWidth: 0,
        labelBold: true,
        highlight: true,
        hideBottom: false,
      },
      {
        label: title,
        value: '',
        labelWidth: titleW,
        valueWidth: 0,
        labelBold: true,
        highlight: true,
        hideBottom: false,
      },
    ]);
  }

  /**
   * Helper to draw a labeled row under a section with sub-bullet letter (A, B, C...)
   */
  private drawIndusRow(letter: string, label: string, value: string, valCol2?: string, valCol2Width?: number) {
    const numW = 28;
    const val2W = valCol2Width ?? (valCol2 !== undefined ? 110 : 0);
    const labelW = 210;
    const val1W = CONTENT_W - numW - labelW - val2W;

    const cols: any[] = [
      {
        label: letter,
        value: '',
        labelWidth: numW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: label,
        value: '',
        labelWidth: labelW,
        valueWidth: 0,
        labelBold: false,
      },
      {
        label: value || 'NA',
        value: '',
        labelWidth: val1W,
        valueWidth: 0,
        labelBold: false,
      },
    ];

    if (valCol2 !== undefined) {
      cols.push({
        label: valCol2 || 'NA',
        value: '',
        labelWidth: val2W,
        valueWidth: 0,
        labelBold: false,
      });
    }

    this.drawKeyValueRow(cols);
  }

  async drawContent(): Promise<void> {
    this.addPage();

    // Main Title Banner
    this.drawCenteredTitle('Valuation Report for LAP – INDUSIND BANK LTD.', 14, true);
    this.advanceCursor(6);

    // ─────────────────────────────────────────────────────────────
    // 1 GENERAL DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawIndusSectionHeader('1', 'GENERAL DETAILS');
    this.drawIndusRow('A', 'Valuation request given by', this.getF('indusValuationRequestedBy', 'Indusind Bank Ltd.'));
    this.drawIndusRow('B', 'The property is occupied by', this.getF('indusPropertyOccupiedBy', 'Vacant'));
    this.drawIndusRow('C', 'Purpose of valuation', this.getF('indusPurposeOfValuation', 'To assess fair market value for collateral security'));
    this.drawIndusRow('D', 'Date of Valuation report', this.getF('indusDateOfReport', this.getF('valuationDate', '')));
    this.drawIndusRow(
      'E',
      'Valuation done by (Name of field engineer) & date of visit',
      this.getF('indusFieldEngineerName', 'Mr. Mantu Das'),
      this.getF('indusDateOfVisit', ''),
      110
    );
    this.drawIndusRow(
      'F',
      'Name of the person who has done assessment of FMV & vetted field investigation report & signed the report',
      this.getF('indusVettedByName', 'Er. Satyajit Mohanty')
    );

    // ─────────────────────────────────────────────────────────────
    // 2 CUSTOMER DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawIndusSectionHeader('2', 'CUSTOMER DETAILS');
    this.drawIndusRow('A', 'Name of Customer/Applicant', this.getF('indusCustomerName', this.getF('applicantName', '')));
    this.drawIndusRow('B', 'Application Number (of file)', this.getF('indusApplicationNumber', this.getF('applicationNo', '')));
    this.drawIndusRow('C', 'Property Owner Name (as reported)', this.getF('indusPropertyOwnerName', this.getF('ownerName', '')));
    this.drawIndusRow('D', 'Name of the person met (With phone no)', this.getF('indusPersonMetAtSite', ''));

    // ─────────────────────────────────────────────────────────────
    // 3 PROPERTY DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawIndusSectionHeader('3', 'PROPERTY DETAILS');
    this.drawIndusRow(
      'A',
      'Address of Property (at site) i.e. Postal address with Pin-code & Phone no of customer',
      this.getF('indusPropertyAddressSite', this.getF('propertyAddress', ''))
    );
    this.drawIndusRow(
      'B',
      'Address as per Legal document (Sur.no/ Kh. no / Plot no)',
      this.getF('indusPropertyAddressLegal', '')
    );
    this.drawIndusRow('C', 'Nearby landmark', this.getF('indusNearbyLandmark', ''));

    // ─────────────────────────────────────────────────────────────
    // 4 DOCUMENT DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawIndusSectionHeader('4', 'DOCUMENT DETAILS');

    const numW = 28;
    const labelW = 160;
    const ynW = 60;
    const authW = 110;
    const dateNumW = CONTENT_W - numW - labelW - ynW - authW;

    const drawDocRow = (
      letter: string,
      docTitle: string,
      provided: string,
      auth: string,
      dateNum: string
    ) => {
      this.drawKeyValueRow([
        { label: letter, value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
        { label: docTitle, value: '', labelWidth: labelW, valueWidth: 0 },
        { label: provided || 'NA', value: '', labelWidth: ynW, valueWidth: 0, labelBold: true },
        { label: auth || 'NA', value: '', labelWidth: authW, valueWidth: 0 },
        { label: dateNum || 'NA', value: '', labelWidth: dateNumW, valueWidth: 0 },
      ]);
    };

    drawDocRow(
      'A',
      'Layout Plan Provided',
      this.getF('indusLayoutPlanProvided', 'Yes/No'),
      `Approving Authority: ${this.getF('indusLayoutAuthority', '')}`,
      `Approval date & No: ${this.getF('indusLayoutDateNumber', '')}`
    );
    drawDocRow(
      'B',
      'Building Plan Provided',
      this.getF('indusBuildingPlanProvided', 'Yes/No'),
      `Approving Authority: ${this.getF('indusBuildingAuthority', '')}`,
      `Approval date & No: ${this.getF('indusBuildingDateNumber', '')}`
    );
    drawDocRow(
      'C',
      'Construction permission',
      this.getF('indusConstPermissionProvided', 'Yes/No'),
      `Approving Authority: ${this.getF('indusConstAuthority', '')}`,
      `Approval date & No: ${this.getF('indusConstDateNumber', '')}`
    );

    this.drawIndusRow('D', 'Type of approved usage as per plan', this.getF('indusApprovedUsage', 'Residential'));
    this.drawIndusRow('E', 'Type of Usage at site', this.getF('indusUsageAtSite', 'Residential'));
    this.drawIndusRow('F', 'List of property document produced for perusal', this.getF('indusDocListPerusal', 'Copy of Sale deed & Approved plan'));

    // ─────────────────────────────────────────────────────────────
    // 5 PHYSICAL DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawIndusSectionHeader('5', 'PHYSICAL DETAILS');

    // 5.A Boundaries
    const bNumW = 28;
    const bTitleW = 100;
    const bDirW = 60;
    const bDocW = 150;
    const bSiteW = CONTENT_W - bNumW - bTitleW - bDirW - bDocW;

    const drawBoundaryRow = (dir: string, docVal: string, siteVal: string, isFirst: boolean) => {
      this.drawKeyValueRow([
        { label: isFirst ? 'A' : '', value: '', labelWidth: bNumW, valueWidth: 0, labelBold: true },
        { label: isFirst ? 'Boundaries on Site' : '', value: '', labelWidth: bTitleW, valueWidth: 0, labelBold: isFirst },
        { label: dir, value: '', labelWidth: bDirW, valueWidth: 0 },
        { label: docVal || 'NA', value: '', labelWidth: bDocW, valueWidth: 0 },
        { label: siteVal || 'NA', value: '', labelWidth: bSiteW, valueWidth: 0 },
      ]);
    };

    // Header subrow for boundaries
    this.drawKeyValueRow([
      { label: 'A', value: '', labelWidth: bNumW, valueWidth: 0, labelBold: true },
      { label: 'Boundaries on Site', value: '', labelWidth: bTitleW, valueWidth: 0, labelBold: true },
      { label: 'Directions', value: '', labelWidth: bDirW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per documents', value: '', labelWidth: bDocW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual at site', value: '', labelWidth: bSiteW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    drawBoundaryRow('East', this.getF('indusBoundaryEastDoc', ''), this.getF('indusBoundaryEastSite', ''), false);
    drawBoundaryRow('West', this.getF('indusBoundaryWestDoc', ''), this.getF('indusBoundaryWestSite', ''), false);
    drawBoundaryRow('North', this.getF('indusBoundaryNorthDoc', ''), this.getF('indusBoundaryNorthSite', ''), false);
    drawBoundaryRow('South', this.getF('indusBoundarySouthDoc', ''), this.getF('indusBoundarySouthSite', ''), false);

    // 5.B Boundaries Matching
    const bMatchW = 80;
    const bRemLabelW = 70;
    const bRemValW = CONTENT_W - numW - labelW - bMatchW - bRemLabelW;
    this.drawKeyValueRow([
      { label: 'B', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Boundaries Matching', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: this.getF('indusBoundariesMatching', 'Yes / No'), value: '', labelWidth: bMatchW, valueWidth: 0, labelBold: true },
      { label: 'Remarks', value: '', labelWidth: bRemLabelW, valueWidth: 0, labelBold: true },
      { label: this.getF('indusBoundariesRemarks', 'Boundary matching as per document'), value: '', labelWidth: bRemValW, valueWidth: 0 },
    ]);

    this.drawIndusRow('C', 'Plot details as per document', this.getF('indusPlotDetailsDoc', ''));
    this.drawIndusRow('D', 'Flat / Plot demarcated at site', this.getF('indusPlotDemarcated', 'Yes / No'));
    this.drawIndusRow('E', 'Approved Land/Building Use', this.getF('indusApprovedLandUse', 'Residential/ Commercial / Industrial/ Agriculture/NA'));
    this.drawIndusRow('F', 'Infrastructure of the surrounding area', this.getF('indusSurroundingInfrastructure', 'Residential-developed / Commercial-developed / Mixed-developed'));
    this.drawIndusRow('G', 'Nature of Locality', this.getF('indusNatureOfLocality', 'Developed/ Developing / Under Developed'));
    this.drawIndusRow('H', 'Class of Locality', this.getF('indusClassOfLocality', 'Posh / Upper Middle Class / Middle Class / Lower Middle Class'));
    this.drawIndusRow('I', 'Property Location', this.getF('indusPropertyLocationLimit', 'B.D.A. Limit/ Nagar Nigam/ Municipal Limit / Gram Panchayat'));
    this.drawIndusRow('J', 'Distance from Indusind office (Km)', this.getF('indusDistanceFromOffice', '1-2 Kms'));
    this.drawIndusRow('K', 'Electricity service connection', this.getF('indusElectricityConnection', 'Residential / Commercial'));
    this.drawIndusRow('L', 'Type of Property', this.getF('indusTypeOfProperty', 'Residential / Commercial / Industrial / Land'));

    // 5.M Property description (Floor-wise) Table
    const fTitleW = 120;
    const fColW = (CONTENT_W - numW - fTitleW) / 5;

    this.drawKeyValueRow([
      { label: 'M', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Property description (Floor-wise)', value: '', labelWidth: fTitleW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'No. of Rooms', value: '', labelWidth: fColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'No. of Kitchens', value: '', labelWidth: fColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'No. of Bathrooms', value: '', labelWidth: fColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'No. of Hall', value: '', labelWidth: fColW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Usage & Remarks', value: '', labelWidth: fColW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const floorItems = this.getF('indusFloorDescriptionItems', [
      { floor: 'Basement', rooms: '', kitchens: '', bathrooms: '', halls: '', usage: '' },
      { floor: 'Ground Floor', rooms: '2', kitchens: '1', bathrooms: '1', halls: '-', usage: 'Residential' },
      { floor: 'First Floor', rooms: '2', kitchens: '1', bathrooms: '1', halls: '', usage: 'Residential' },
      { floor: '2nd Floor', rooms: '2', kitchens: '1', bathrooms: '1', halls: '-', usage: 'Residential' },
    ]);

    for (const item of floorItems) {
      this.drawKeyValueRow([
        { label: '', value: '', labelWidth: numW, valueWidth: 0 },
        { label: item.floor, value: '', labelWidth: fTitleW, valueWidth: 0 },
        { label: item.rooms || '-', value: '', labelWidth: fColW, valueWidth: 0 },
        { label: item.kitchens || '-', value: '', labelWidth: fColW, valueWidth: 0 },
        { label: item.bathrooms || '-', value: '', labelWidth: fColW, valueWidth: 0 },
        { label: item.halls || '-', value: '', labelWidth: fColW, valueWidth: 0 },
        { label: item.usage || '-', value: '', labelWidth: fColW, valueWidth: 0 },
      ]);
    }

    this.drawIndusRow('N', 'Type of Structure', this.getF('indusTypeOfStructure', 'RCC Framed / Load Bearing / Mixed'));

    // 5.O Interiors and Exteriors
    const intLabelW = 90;
    const intValW = 130;
    const extLabelW = 80;
    const extValW = CONTENT_W - numW - intLabelW - intValW - extLabelW;
    this.drawKeyValueRow([
      { label: 'O', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Interiors finishing', value: '', labelWidth: intLabelW, valueWidth: 0 },
      { label: this.getF('indusInteriorsFinishing', 'Good / Fair/ Average / Poor'), value: '', labelWidth: intValW, valueWidth: 0, labelBold: true },
      { label: 'Exteriors', value: '', labelWidth: extLabelW, valueWidth: 0 },
      { label: this.getF('indusExteriorsFinishing', 'Good /Fair/ Average / Poor'), value: '', labelWidth: extValW, valueWidth: 0, labelBold: true },
    ]);

    this.drawIndusRow('P', 'Maintenance level', this.getF('indusMaintenanceLevel', 'Good / Fair/ Average / Poor'));

    // 5.Q Age and Residual Age
    const ageW = 140;
    const resW = 120;
    const resValW = CONTENT_W - numW - labelW - ageW - resW;
    this.drawKeyValueRow([
      { label: 'Q', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Age of Property', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: this.getF('indusAgeOfProperty', '13-Years'), value: '', labelWidth: ageW, valueWidth: 0 },
      { label: 'Residual age (in years):', value: '', labelWidth: resW, valueWidth: 0 },
      { label: this.getF('indusResidualAge', '47-Years'), value: '', labelWidth: resValW, valueWidth: 0 },
    ]);

    this.drawIndusRow('R', 'Amenities', this.getF('indusAmenities', ''));

    // ─────────────────────────────────────────────────────────────
    // 6 OCCUPANCY DETAILS
    // ─────────────────────────────────────────────────────────────
    this.drawIndusSectionHeader('6', 'OCCUPANCY DETAILS');

    const occCol1W = 170;
    const occVal1W = 90;
    const occCol2W = 100;
    const occVal2W = CONTENT_W - occCol1W - occVal1W - occCol2W;

    this.drawKeyValueRow([
      { label: 'Status of Occupancy (Mention floor wise)', value: '', labelWidth: occCol1W, valueWidth: 0 },
      { label: this.getF('indusOccupancyStatus', 'Occupied'), value: '', labelWidth: occVal1W, valueWidth: 0 },
      { label: 'Occupied by', value: '', labelWidth: occCol2W, valueWidth: 0 },
      { label: this.getF('indusOccupiedBy', 'Owner'), value: '', labelWidth: occVal2W, valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'Relationship of Occupant with customer', value: '', labelWidth: occCol1W, valueWidth: 0 },
      { label: this.getF('indusRelationshipOccupant', 'NA'), value: '', labelWidth: occVal1W, valueWidth: 0 },
      { label: 'Since', value: '', labelWidth: occCol2W, valueWidth: 0 },
      { label: this.getF('indusOccupantSince', 'N.A.'), value: '', labelWidth: occVal2W, valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'Completion Status of building / property', value: '', labelWidth: occCol1W, valueWidth: 0 },
      { label: this.getF('indusCompletionStatus', '100%'), value: '', labelWidth: occVal1W, valueWidth: 0 },
      { label: 'Rental value', value: '', labelWidth: occCol2W, valueWidth: 0 },
      { label: this.getF('indusRentalValue', 'N.A.'), value: '', labelWidth: occVal2W, valueWidth: 0 },
    ]);

    // ─────────────────────────────────────────────────────────────
    // 7 SPECIFIC COMMENTS ON PROPERTY
    // ─────────────────────────────────────────────────────────────
    this.drawIndusSectionHeader('7', 'SPECIFIC COMMENTS ON PROPERTY');
    this.drawKeyValueRow([
      {
        label: 'Specific comments on property :-',
        value: this.getF('indusSpecificComments', 'Subject property is a G+2 residential apartments.'),
        labelWidth: 170,
        valueWidth: CONTENT_W - 170,
      },
    ]);

    // ─────────────────────────────────────────────────────────────
    // 8 VALUATION
    // ─────────────────────────────────────────────────────────────
    this.drawIndusSectionHeader('8', 'VALUATION');

    // 8.a Row House / Bungalow / Kothi (Land & Building)
    this.drawKeyValueRow([
      {
        label: 'a',
        value: '',
        labelWidth: 20,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: 'Area details & deviations ( Row house / Bungalow / Kothi )',
        value: '',
        labelWidth: CONTENT_W - 20,
        valueWidth: 0,
        labelBold: true,
        highlight: true,
      },
    ]);

    const vCol1W = 160;
    const vCol2W = (CONTENT_W - vCol1W) / 2;

    this.drawKeyValueRow([
      { label: 'Description', value: '', labelWidth: vCol1W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Approved Area (As per Bylaws/Plan)', value: '', labelWidth: vCol2W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual area (as per measured)', value: '', labelWidth: vCol2W, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const valuationAreaRows = this.getF('indusValuationAreaRows', [
      { desc: 'Land area', app: '875.00 sqft', act: '875.00 sqft' },
      { desc: 'Basement Floor', app: '0.00 sqft', act: '0.00 sqft' },
      { desc: 'Ground Floor', app: '875.00 sqft', act: '792.00 sqft' },
      { desc: 'First Floor', app: '875.00 sqft', act: '792.00 sqft' },
      { desc: 'Second Floor', app: '0.00 sqft', act: '0.00 sqft' },
    ]);

    for (const r of valuationAreaRows) {
      this.drawKeyValueRow([
        { label: r.desc, value: '', labelWidth: vCol1W, valueWidth: 0 },
        { label: r.app || '0.00 sqft', value: '', labelWidth: vCol2W, valueWidth: 0 },
        { label: r.act || '0.00 sqft', value: '', labelWidth: vCol2W, valueWidth: 0 },
      ]);
    }

    // Total Built-up Area
    this.drawKeyValueRow([
      { label: 'Total Built-up Area', value: '', labelWidth: vCol1W, valueWidth: 0, labelBold: true },
      { label: this.getF('indusTotalAppBUA', '1750.00 sqft'), value: '', labelWidth: vCol2W, valueWidth: 0, labelBold: true },
      { label: this.getF('indusTotalActBUA', '1584.00 sqft'), value: '', labelWidth: vCol2W, valueWidth: 0, labelBold: true },
    ]);

    // Land rates
    const lrLabelW = 230;
    const lrValW = CONTENT_W - lrLabelW;
    this.drawKeyValueRow([
      { label: 'Prevailing Market Range/ Rate of Land in the locality', value: '', labelWidth: lrLabelW, valueWidth: 0 },
      { label: this.getF('indusPrevailingLandRange', 'Rs.6,000/- to @ Rs. 6,500 /- Per Sqft'), value: '', labelWidth: lrValW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'Land Rate adopted in Rs. (In Per Sqyds)', value: '', labelWidth: lrLabelW, valueWidth: 0 },
      { label: this.getF('indusLandRateAdopted', 'Rs.6,500/- Per sqyds'), value: '', labelWidth: lrValW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'Total Land value:', value: '', labelWidth: lrLabelW, valueWidth: 0, labelBold: true },
      { label: this.getF('indusTotalLandValue', 'Rs.56,87,500/-'), value: '', labelWidth: lrValW, valueWidth: 0, labelBold: true },
    ]);

    // Building value rows
    const bvLabelW = 180;
    const bvAreaW = 80;
    const bvRateW = 120;
    const bvTotW = CONTENT_W - bvLabelW - bvAreaW - bvRateW;

    this.drawKeyValueRow([
      { label: 'Building value (as per approved area)', value: '', labelWidth: bvLabelW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Area', value: '', labelWidth: bvAreaW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate (Per sqft)', value: '', labelWidth: bvRateW, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Total', value: '', labelWidth: bvTotW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const bldgRows = this.getF('indusBldgValueRows', [
      { desc: 'Basement Floor', area: '', rate: '', total: '' },
      { desc: 'Ground Floor', area: '792.00 sqft', rate: '@ Rs.1,700/- Per Sqft', total: 'Rs.13,46,400/-' },
      { desc: 'Second Floor', area: '792.00 sqft', rate: '@ Rs.1,700/- Per Sqft', total: 'Rs.13,46,400/-' },
    ]);

    for (const b of bldgRows) {
      this.drawKeyValueRow([
        { label: b.desc, value: '', labelWidth: bvLabelW, valueWidth: 0 },
        { label: b.area || '', value: '', labelWidth: bvAreaW, valueWidth: 0 },
        { label: b.rate || '', value: '', labelWidth: bvRateW, valueWidth: 0 },
        { label: b.total || '', value: '', labelWidth: bvTotW, valueWidth: 0 },
      ]);
    }

    // Total Construction & Depreciated value
    this.drawKeyValueRow([
      { label: 'Total Construction:', value: '', labelWidth: CONTENT_W - bvTotW, valueWidth: 0, labelBold: true },
      { label: this.getF('indusTotalConstructionVal', 'Rs.26,92,800/-'), value: '', labelWidth: bvTotW, valueWidth: 0, labelBold: true },
    ]);

    const depLabelW = 230;
    const depPctW = 120;
    const depTotW = CONTENT_W - depLabelW - depPctW;
    this.drawKeyValueRow([
      { label: 'Depreciation considered (on building value)', value: '', labelWidth: depLabelW, valueWidth: 0 },
      { label: this.getF('indusDepreciationPctText', '12% (average cost)'), value: '', labelWidth: depPctW, valueWidth: 0 },
      { label: this.getF('indusDepreciatedConstVal', 'Rs.23,69,664/-'), value: '', labelWidth: depTotW, valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'Total value of construction (after depreciated)', value: '', labelWidth: depLabelW + depPctW, valueWidth: 0, labelBold: true },
      { label: this.getF('indusDepreciatedConstVal', 'Rs.23,69,664/-'), value: '', labelWidth: depTotW, valueWidth: 0, labelBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Fair market value of the property (Land & Building):', value: '', labelWidth: depLabelW + depPctW, valueWidth: 0, labelBold: true, highlight: true },
      { label: this.getF('indusTotalFMVLandBldg', 'Rs.80,57,164/-'), value: '', labelWidth: depTotW, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    // 8.b Flat / Shop
    this.drawKeyValueRow([
      { label: 'b', value: '', labelWidth: 20, valueWidth: 0, labelBold: true },
      { label: 'Area details & deviations (Flat /Shop)', value: '', labelWidth: CONTENT_W - 20, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const f8Col1W = 170;
    const f8Col2W = (CONTENT_W - f8Col1W) / 2;

    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: f8Col1W, valueWidth: 0 },
      { label: 'As per approved Plan', value: '', labelWidth: f8Col2W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual area (as observed/measured)', value: '', labelWidth: f8Col2W, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const flatRows = [
      { label: 'Land Area/UDS (wherever possible)', app: 'N.A.', act: 'N.A.' },
      { label: 'Built up area (mandatory as per actual measurement)', app: 'N.A.', act: 'N.A.' },
      { label: 'Terrace Area', app: 'N.A.', act: 'N.A.' },
      { label: 'Super Built up/Saleable area', app: 'NA', act: 'NA' },
      { label: 'Prevailing Market rate', app: 'NA', act: 'N.A.' },
      { label: 'Flat/Shop/ value (as per approved area)', app: 'N.A.', act: 'N.A.' },
      { label: 'Terrace', app: 'N.A.', act: 'N.A.' },
      { label: 'Amenities cost', app: 'N.A.', act: 'N.A.' },
      { label: 'Depreciation considered (on building value)', app: 'N.A.', act: 'N.A.' },
    ];

    for (const fr of flatRows) {
      this.drawKeyValueRow([
        { label: fr.label, value: '', labelWidth: f8Col1W, valueWidth: 0 },
        { label: this.getF(`indusFlatApp_${fr.label}`, fr.app), value: '', labelWidth: f8Col2W, valueWidth: 0 },
        { label: this.getF(`indusFlatAct_${fr.label}`, fr.act), value: '', labelWidth: f8Col2W, valueWidth: 0 },
      ]);
    }

    this.drawKeyValueRow([
      { label: 'Fair market value of the Flat Rs.', value: '', labelWidth: f8Col1W, valueWidth: 0, labelBold: true },
      { label: this.getF('indusFlatFMV', 'NA'), value: '', labelWidth: f8Col2W, valueWidth: 0, labelBold: true },
      { label: '', value: '', labelWidth: f8Col2W, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'Fair market value of the Terrace Rs.', value: '', labelWidth: f8Col1W, valueWidth: 0 },
      { label: this.getF('indusTerraceFMV', 'NA'), value: '', labelWidth: f8Col2W, valueWidth: 0 },
      { label: '', value: '', labelWidth: f8Col2W, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: 'Fair market value of the property Rs.', value: '', labelWidth: f8Col1W, valueWidth: 0, labelBold: true },
      { label: this.getF('indusPropertyFMVFlat', 'NA'), value: '', labelWidth: f8Col2W, valueWidth: 0, labelBold: true },
      { label: '', value: '', labelWidth: f8Col2W, valueWidth: 0 },
    ]);

    // 8.c Remarks
    this.drawKeyValueRow([
      { label: 'c', value: '', labelWidth: 20, valueWidth: 0, labelBold: true },
      { label: 'Remarks', value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
      { label: this.getF('indusValuationRemarks', 'NA'), value: '', labelWidth: CONTENT_W - 170, valueWidth: 0 },
    ]);

    // ─────────────────────────────────────────────────────────────
    // SPECIFIC DETAILS OF DEVIATION AT SITE
    // ─────────────────────────────────────────────────────────────
    this.drawCenteredTitle('SPECIFIC DETAILS OF DEVIATION AT SITE', 12, true);

    const devCol1W = 130;
    const devCol2W = 75;
    const devCol3W = 75;
    const devCol4W = 90;
    const devCol5W = CONTENT_W - devCol1W - devCol2W - devCol3W - devCol4W;

    this.drawKeyValueRow([
      { label: 'Detail', value: '', labelWidth: devCol1W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As Per Approved', value: '', labelWidth: devCol2W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per Site', value: '', labelWidth: devCol3W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Deviation in Sqft', value: '', labelWidth: devCol4W, valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Percentage of deviation', value: '', labelWidth: devCol5W, valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const deviationRows = this.getF('indusDeviationRows', [
      { detail: 'Total Plot area (sq.ft)', app: '0.00 sqft', site: '0.00 sqft', dev: '0.00 sqft', pct: 'NA' },
      { detail: 'No. of Floors', app: '0', site: '0', dev: '-', pct: 'NA' },
      { detail: 'No. Of Units', app: '0', site: '0', dev: '-', pct: 'NA' },
      { detail: 'Total Built-up area (sqft)', app: '1750.00 sqft', site: '1584.00 sqft', dev: '-166.00 sqft', pct: 'NA' },
      { detail: 'Basement', app: '0.00 sqft', site: '0.00 sqft', dev: '0.00 sqft', pct: 'NA' },
      { detail: 'Ground Floor', app: '875.00 sqft', site: '792.00 sqft', dev: '-83.00 sqft', pct: 'NA' },
      { detail: 'First Floor', app: '875.00 sqft', site: '792.00 sqft', dev: '-83.00 sqft', pct: 'NA' },
      { detail: 'Second Floor', app: '0.00 sqft', site: '0.00 sqft', dev: '0.00 sqft', pct: 'NA' },
      { detail: 'FSI', app: 'N.A.', site: '', dev: 'N.A.', pct: 'N.A.' },
      { detail: 'Plot Coverage', app: 'N.A.', site: '', dev: 'N.A.', pct: 'N.A.' },
    ]);

    for (const dr of deviationRows) {
      this.drawKeyValueRow([
        { label: dr.detail, value: '', labelWidth: devCol1W, valueWidth: 0 },
        { label: dr.app || '-', value: '', labelWidth: devCol2W, valueWidth: 0 },
        { label: dr.site || '-', value: '', labelWidth: devCol3W, valueWidth: 0 },
        { label: dr.dev || '-', value: '', labelWidth: devCol4W, valueWidth: 0 },
        { label: dr.pct || '-', value: '', labelWidth: devCol5W, valueWidth: 0 },
      ]);
    }

    // Setbacks sub-header & rows
    this.drawKeyValueRow([
      { label: 'Setbacks:', value: '', labelWidth: devCol1W, valueWidth: 0, labelBold: true },
      { label: this.getF('indusSetbackPlanNote', 'Plan details not provided'), value: '', labelWidth: CONTENT_W - devCol1W, valueWidth: 0 },
    ]);

    const setbackRows = [
      { side: 'Front', app: 'N.A.', site: '', dev: 'N.A.', pct: 'N.A.' },
      { side: 'Rear', app: 'N.A.', site: '', dev: 'N.A.', pct: 'N.A.' },
      { side: 'Left', app: 'N.A.', site: '', dev: 'N.A.', pct: 'N.A.' },
      { side: 'Right', app: 'N.A.', site: '', dev: 'N.A.', pct: 'N.A.' },
    ];

    for (const sb of setbackRows) {
      this.drawKeyValueRow([
        { label: sb.side, value: '', labelWidth: devCol1W, valueWidth: 0 },
        { label: this.getF(`indusSetbackApp_${sb.side}`, sb.app), value: '', labelWidth: devCol2W, valueWidth: 0 },
        { label: this.getF(`indusSetbackSite_${sb.side}`, sb.site), value: '', labelWidth: devCol3W, valueWidth: 0 },
        { label: this.getF(`indusSetbackDev_${sb.side}`, sb.dev), value: '', labelWidth: devCol4W, valueWidth: 0 },
        { label: this.getF(`indusSetbackPct_${sb.side}`, sb.pct), value: '', labelWidth: devCol5W, valueWidth: 0 },
      ]);
    }

    // ─────────────────────────────────────────────────────────────
    // SYNTHESIZED REMARKS
    // ─────────────────────────────────────────────────────────────
    this.drawKeyValueRow([
      {
        label: 'Remarks : ',
        value: this.getF(
          'indusSynthesizedRemarks',
          'Subject property is a G+2 residential building having land extend 875sqft, having measured BUA 1884sqft(RCC GF & FF-792 X 2=1584sqft & SF ACC roofing-300sqft). Plan has been approved by Bhubaneswar Development Authority, Vide letter no-738/ BP, BDA, Dated- 07-03-2009. All civic amenities are present within 1-2 Kms from the property & accessible with 60-feet wide Road. This building is vacant at the time of technical visit. Valuation has been done for land & least BUA of G+1 residential building.'
        ),
        labelWidth: 80,
        valueWidth: CONTENT_W - 80,
        labelBold: true,
      },
    ]);

    // ─────────────────────────────────────────────────────────────
    // DECLARATION
    // ─────────────────────────────────────────────────────────────
    this.drawSectionHeader('Declaration :');
    this.drawKeyValueRow([
      { label: 'I/We hereby declare that :', value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: '(1) The property was inspected by me/us', value: '', labelWidth: CONTENT_W, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '(2) I/We have no direct or Indirect Interest in the property valued', value: '', labelWidth: CONTENT_W, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '(3) The information furnished above is true and correct to my/our knowledge', value: '', labelWidth: CONTENT_W, valueWidth: 0 },
    ]);

    const fmvVal = this.getF('indusTotalFMVLandBldg', 'Rs.80,57,164/-');
    const fmvWords = this.getF(
      'indusFMVWords',
      '(Rupees Eighty Lakhs Fifty Seven Thousand & One hundred Sixty Four Only)'
    );

    this.drawKeyValueRow([
      { label: '(4) Total Fair Market Value of the property is', value: '', labelWidth: 230, valueWidth: 0, labelBold: true },
      { label: fmvVal, value: '', labelWidth: CONTENT_W - 230, valueWidth: 0, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: fmvWords, value: '', labelWidth: CONTENT_W, valueWidth: 0, labelBold: true },
    ]);

    // ─────────────────────────────────────────────────────────────
    // SIGNATURE & SEAL BLOCK
    // ─────────────────────────────────────────────────────────────
    const sigLabelW = 240;
    const dateLabelW = 60;
    const dateValW = CONTENT_W - sigLabelW - dateLabelW;

    this.drawKeyValueRow([
      { label: 'Signature & Seal of Valuer(S MOHANTY ASSOCIATES)', value: '', labelWidth: sigLabelW, valueWidth: 0, labelBold: true },
      { label: 'Date:', value: '', labelWidth: dateLabelW, valueWidth: 0 },
      { label: this.getF('indusDateOfReport', this.getF('valuationDate', '12-11-2024')), value: '', labelWidth: dateValW, valueWidth: 0 },
    ]);
    this.drawKeyValueRow([
      { label: '', value: '', labelWidth: sigLabelW, valueWidth: 0 },
      { label: 'Place:', value: '', labelWidth: dateLabelW, valueWidth: 0 },
      { label: this.getF('indusValuationPlace', 'Bhubaneswar'), value: '', labelWidth: dateValW, valueWidth: 0 },
    ]);

    // ─────────────────────────────────────────────────────────────
    // INHERITED ATTACHMENTS (DOCUMENTS, MAPS, PHOTOGRAPHS)
    // ─────────────────────────────────────────────────────────────
    if (this.fields.documents?.length > 0) {
      await this.drawDocumentsGallery(this.fields.documents);
    }
    if (this.fields.maps?.length > 0) {
      await this.drawMapGallery(this.fields.maps, 'PROPERTY MAPS');
    }
    if (this.fields.photos?.length > 0) {
      await this.drawPhotoGrid(this.fields.photos);
    }
  }
}
