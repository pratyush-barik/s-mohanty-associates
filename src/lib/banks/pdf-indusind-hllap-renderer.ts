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
        label: '',
        value: value || 'NA',
        labelWidth: 0,
        valueWidth: val1W,
        valueBold: false,
      },
    ];

    if (valCol2 !== undefined) {
      cols.push({
        label: '',
        value: valCol2 || 'NA',
        labelWidth: 0,
        valueWidth: val2W,
        valueBold: false,
      });
    }

    this.drawKeyValueRow(cols);
  }

  async drawContent(): Promise<void> {
    // NOTE: init() already adds page 1. Do NOT call this.addPage() here.

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
      this.getF('indusFieldEngineerName', ''),
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
        { label: '', value: provided || 'NA', labelWidth: 0, valueWidth: ynW, valueBold: true },
        { label: '', value: auth || 'NA', labelWidth: 0, valueWidth: authW },
        { label: '', value: dateNum || 'NA', labelWidth: 0, valueWidth: dateNumW },
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
        { label: '', value: docVal || 'NA', labelWidth: 0, valueWidth: bDocW },
        { label: '', value: siteVal || 'NA', labelWidth: 0, valueWidth: bSiteW },
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
      { label: '', value: this.getF('indusBoundariesMatching', 'Yes'), labelWidth: 0, valueWidth: bMatchW, valueBold: true },
      { label: 'Remarks', value: '', labelWidth: bRemLabelW, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('indusBoundariesRemarks', 'Boundary matching as per document'), labelWidth: 0, valueWidth: bRemValW },
    ]);

    this.drawIndusRow('C', 'Plot details as per document', this.getF('indusPlotDetailsDoc', ''));
    this.drawIndusRow('D', 'Flat / Plot demarcated at site', this.getF('indusPlotDemarcated', 'Yes / No'));
    this.drawIndusRow('E', 'Approved Land/Building Use', this.getF('indusApprovedLandUse', 'Residential/ Commercial / Industrial/ Agriculture/NA'));
    this.drawIndusRow('F', 'Infrastructure of the surrounding area', this.getF('indusSurroundingInfrastructure', 'Residential-developed / Commercial-developed / Mixed-developed'));
    this.drawIndusRow('G', 'Nature of Locality', this.getF('indusNatureOfLocality', 'Developed/ Developing / Under Developed'));
    this.drawIndusRow('H', 'Class of Locality', this.getF('indusClassOfLocality', 'Posh / Upper Middle Class / Middle Class / Lower Middle Class'));
    this.drawIndusRow('I', 'Property Location', this.getF('indusPropertyLocationLimit', 'B.D.A. Limit/ Nagar Nigam/ Municipal Limit / Gram Panchayat'));
    this.drawIndusRow('J', 'Distance from Indusind office (Km)', this.getF('indusDistanceFromOffice', ''));
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
      { floor: 'Ground Floor', rooms: '', kitchens: '', bathrooms: '', halls: '', usage: 'Residential' },
    ]);

    for (const item of floorItems) {
      this.drawKeyValueRow([
        { label: '', value: '', labelWidth: numW, valueWidth: 0 },
        { label: item.floor, value: '', labelWidth: fTitleW, valueWidth: 0 },
        { label: '', value: item.rooms || '-', labelWidth: 0, valueWidth: fColW },
        { label: '', value: item.kitchens || '-', labelWidth: 0, valueWidth: fColW },
        { label: '', value: item.bathrooms || '-', labelWidth: 0, valueWidth: fColW },
        { label: '', value: item.halls || '-', labelWidth: 0, valueWidth: fColW },
        { label: '', value: item.usage || '-', labelWidth: 0, valueWidth: fColW },
      ]);
    }

    this.drawIndusRow('N', 'Type of Structure', this.getF('indusTypeOfStructure', 'RCC Framed'));

    // 5.O Interiors and Exteriors
    const intLabelW = 90;
    const intValW = 130;
    const extLabelW = 80;
    const extValW = CONTENT_W - numW - intLabelW - intValW - extLabelW;
    this.drawKeyValueRow([
      { label: 'O', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Interiors finishing', value: '', labelWidth: intLabelW, valueWidth: 0 },
      { label: '', value: this.getF('indusInteriorsFinishing', 'Good'), labelWidth: 0, valueWidth: intValW, valueBold: true },
      { label: 'Exteriors', value: '', labelWidth: extLabelW, valueWidth: 0 },
      { label: '', value: this.getF('indusExteriorsFinishing', 'Good'), labelWidth: 0, valueWidth: extValW, valueBold: true },
    ]);

    this.drawIndusRow('P', 'Maintenance level', this.getF('indusMaintenanceLevel', 'Good'));

    // 5.Q Age and Residual Age
    const ageW = 140;
    const resW = 120;
    const resValW = CONTENT_W - numW - labelW - ageW - resW;
    this.drawKeyValueRow([
      { label: 'Q', value: '', labelWidth: numW, valueWidth: 0, labelBold: true },
      { label: 'Age of Property', value: '', labelWidth: labelW, valueWidth: 0 },
      { label: '', value: this.getF('indusAgeOfProperty', ''), labelWidth: 0, valueWidth: ageW },
      { label: 'Residual age (in years):', value: '', labelWidth: resW, valueWidth: 0 },
      { label: '', value: this.getF('indusResidualAge', ''), labelWidth: 0, valueWidth: resValW },
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
      { label: '', value: this.getF('indusOccupancyStatus', 'Occupied'), labelWidth: 0, valueWidth: occVal1W },
      { label: 'Occupied by', value: '', labelWidth: occCol2W, valueWidth: 0 },
      { label: '', value: this.getF('indusOccupiedBy', 'Owner'), labelWidth: 0, valueWidth: occVal2W },
    ]);

    this.drawKeyValueRow([
      { label: 'Relationship of Occupant with customer', value: '', labelWidth: occCol1W, valueWidth: 0 },
      { label: '', value: this.getF('indusRelationshipOccupant', 'Self'), labelWidth: 0, valueWidth: occVal1W },
      { label: 'Since', value: '', labelWidth: occCol2W, valueWidth: 0 },
      { label: '', value: this.getF('indusOccupantSince', 'NA'), labelWidth: 0, valueWidth: occVal2W },
    ]);

    this.drawKeyValueRow([
      { label: 'Completion Status of building / property', value: '', labelWidth: occCol1W, valueWidth: 0 },
      { label: '', value: this.getF('indusCompletionStatus', '100%'), labelWidth: 0, valueWidth: occVal1W },
      { label: 'Rental value', value: '', labelWidth: occCol2W, valueWidth: 0 },
      { label: '', value: this.getF('indusRentalValue', 'NA'), labelWidth: 0, valueWidth: occVal2W },
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
      { desc: 'Land area', app: '', act: '' },
      { desc: 'Ground Floor', app: '', act: '' },
    ]);

    for (const r of valuationAreaRows) {
      this.drawKeyValueRow([
        { label: r.desc, value: '', labelWidth: vCol1W, valueWidth: 0 },
        { label: '', value: r.app || '-', labelWidth: 0, valueWidth: vCol2W },
        { label: '', value: r.act || '-', labelWidth: 0, valueWidth: vCol2W },
      ]);
    }

    // Total Built-up Area
    this.drawKeyValueRow([
      { label: 'Total Built-up Area', value: '', labelWidth: vCol1W, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('indusTotalAppBUA', ''), labelWidth: 0, valueWidth: vCol2W, valueBold: true },
      { label: '', value: this.getF('indusTotalActBUA', ''), labelWidth: 0, valueWidth: vCol2W, valueBold: true },
    ]);

    // Land rates
    const lrLabelW = 230;
    const lrValW = CONTENT_W - lrLabelW;
    this.drawKeyValueRow([
      { label: 'Prevailing Market Range/ Rate of Land in the locality', value: '', labelWidth: lrLabelW, valueWidth: 0 },
      { label: '', value: this.getF('indusPrevailingLandRange', ''), labelWidth: 0, valueWidth: lrValW },
    ]);
    this.drawKeyValueRow([
      { label: 'Land Rate adopted in Rs. (In Per Sqyds)', value: '', labelWidth: lrLabelW, valueWidth: 0 },
      { label: '', value: this.getF('indusLandRateAdopted', ''), labelWidth: 0, valueWidth: lrValW },
    ]);
    this.drawKeyValueRow([
      { label: 'Total Land value:', value: '', labelWidth: lrLabelW, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('indusTotalLandValue', ''), labelWidth: 0, valueWidth: lrValW, valueBold: true },
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
      { desc: 'Ground Floor', area: '', rate: '', total: '' },
    ]);

    for (const b of bldgRows) {
      this.drawKeyValueRow([
        { label: b.desc, value: '', labelWidth: bvLabelW, valueWidth: 0 },
        { label: '', value: b.area || '', labelWidth: 0, valueWidth: bvAreaW },
        { label: '', value: b.rate || '', labelWidth: 0, valueWidth: bvRateW },
        { label: '', value: b.total || '', labelWidth: 0, valueWidth: bvTotW },
      ]);
    }

    // Total Construction & Depreciated value
    this.drawKeyValueRow([
      { label: 'Total Construction:', value: '', labelWidth: CONTENT_W - bvTotW, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('indusTotalConstructionVal', ''), labelWidth: 0, valueWidth: bvTotW, valueBold: true },
    ]);

    const depLabelW = 230;
    const depPctW = 120;
    const depTotW = CONTENT_W - depLabelW - depPctW;
    this.drawKeyValueRow([
      { label: 'Depreciation considered (on building value)', value: '', labelWidth: depLabelW, valueWidth: 0 },
      { label: '', value: this.getF('indusDepreciationPctText', ''), labelWidth: 0, valueWidth: depPctW },
      { label: '', value: this.getF('indusDepreciatedConstVal', ''), labelWidth: 0, valueWidth: depTotW },
    ]);

    this.drawKeyValueRow([
      { label: 'Total value of construction (after depreciated)', value: '', labelWidth: depLabelW + depPctW, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('indusDepreciatedConstVal', ''), labelWidth: 0, valueWidth: depTotW, valueBold: true },
    ]);

    this.drawKeyValueRow([
      { label: 'Fair market value of the property (Land & Building):', value: '', labelWidth: depLabelW + depPctW, valueWidth: 0, labelBold: true, highlight: true },
      { label: '', value: this.getF('indusTotalFMVLandBldg', ''), labelWidth: 0, valueWidth: depTotW, valueBold: true, highlight: true },
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
        { label: '', value: this.getF(`indusFlatApp_${fr.label}`, fr.app), labelWidth: 0, valueWidth: f8Col2W },
        { label: '', value: this.getF(`indusFlatAct_${fr.label}`, fr.act), labelWidth: 0, valueWidth: f8Col2W },
      ]);
    }

    this.drawKeyValueRow([
      { label: 'Fair market value of the Flat Rs.', value: '', labelWidth: f8Col1W, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('indusFlatFMV', 'NA'), labelWidth: 0, valueWidth: f8Col2W, valueBold: true },
      { label: '', value: '', labelWidth: 0, valueWidth: f8Col2W },
    ]);
    this.drawKeyValueRow([
      { label: 'Fair market value of the Terrace Rs.', value: '', labelWidth: f8Col1W, valueWidth: 0 },
      { label: '', value: this.getF('indusTerraceFMV', 'NA'), labelWidth: 0, valueWidth: f8Col2W },
      { label: '', value: '', labelWidth: 0, valueWidth: f8Col2W },
    ]);
    this.drawKeyValueRow([
      { label: 'Fair market value of the property Rs.', value: '', labelWidth: f8Col1W, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('indusPropertyFMVFlat', 'NA'), labelWidth: 0, valueWidth: f8Col2W, valueBold: true },
      { label: '', value: '', labelWidth: 0, valueWidth: f8Col2W },
    ]);

    // 8.c Remarks
    this.drawKeyValueRow([
      { label: 'c', value: '', labelWidth: 20, valueWidth: 0, labelBold: true },
      { label: 'Remarks', value: '', labelWidth: 150, valueWidth: 0, labelBold: true },
      { label: '', value: this.getF('indusValuationRemarks', 'NA'), labelWidth: 0, valueWidth: CONTENT_W - 170 },
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
      { detail: 'Total Plot area (sq.ft)', app: '', site: '', dev: '', pct: 'NA' },
      { detail: 'No. of Floors', app: '', site: '', dev: '-', pct: 'NA' },
      { detail: 'Total Built-up area (sqft)', app: '', site: '', dev: '', pct: 'NA' },
      { detail: 'Ground Floor', app: '', site: '', dev: '', pct: 'NA' },
      { detail: 'First Floor', app: '', site: '', dev: '', pct: 'NA' },
    ]);

    for (const dr of deviationRows) {
      this.drawKeyValueRow([
        { label: dr.detail, value: '', labelWidth: devCol1W, valueWidth: 0 },
        { label: '', value: dr.app || '-', labelWidth: 0, valueWidth: devCol2W },
        { label: '', value: dr.site || '-', labelWidth: 0, valueWidth: devCol3W },
        { label: '', value: dr.dev || '-', labelWidth: 0, valueWidth: devCol4W },
        { label: '', value: dr.pct || '-', labelWidth: 0, valueWidth: devCol5W },
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
        { label: '', value: this.getF(`indusSetbackApp_${sb.side}`, sb.app), labelWidth: 0, valueWidth: devCol2W },
        { label: '', value: this.getF(`indusSetbackSite_${sb.side}`, sb.site), labelWidth: 0, valueWidth: devCol3W },
        { label: '', value: this.getF(`indusSetbackDev_${sb.side}`, sb.dev), labelWidth: 0, valueWidth: devCol4W },
        { label: '', value: this.getF(`indusSetbackPct_${sb.side}`, sb.pct), labelWidth: 0, valueWidth: devCol5W },
      ]);
    }

    // ─────────────────────────────────────────────────────────────
    // SYNTHESIZED REMARKS
    // ─────────────────────────────────────────────────────────────
    this.drawKeyValueRow([
      {
        label: 'Remarks : ',
        value: this.getF('indusSynthesizedRemarks', ''),
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

    const fmvVal = this.getF('indusTotalFMVLandBldg', '');
    const fmvWords = this.getF('indusFMVWords', '');

    this.drawKeyValueRow([
      { label: '(4) Total Fair Market Value of the property is', value: '', labelWidth: 230, valueWidth: 0, labelBold: true },
      { label: '', value: fmvVal, labelWidth: 0, valueWidth: CONTENT_W - 230, valueBold: true },
    ]);
    if (fmvWords) {
      this.drawKeyValueRow([
        { label: '', value: fmvWords, labelWidth: 0, valueWidth: CONTENT_W, valueBold: true },
      ]);
    }

    // ─────────────────────────────────────────────────────────────
    // SIGNATURE & SEAL BLOCK
    // ─────────────────────────────────────────────────────────────
    const sigLabelW = 240;
    const dateLabelW = 60;
    const dateValW = CONTENT_W - sigLabelW - dateLabelW;

    this.drawKeyValueRow([
      { label: 'Signature & Seal of Valuer(S MOHANTY ASSOCIATES)', value: '', labelWidth: sigLabelW, valueWidth: 0, labelBold: true },
      { label: 'Date:', value: '', labelWidth: dateLabelW, valueWidth: 0 },
      { label: this.getF('indusDateOfReport', this.getF('valuationDate', '')), value: '', labelWidth: dateValW, valueWidth: 0 },
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
