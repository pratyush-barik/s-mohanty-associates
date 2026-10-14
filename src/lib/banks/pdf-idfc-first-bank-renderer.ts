import { PDFBankRenderer } from '../pdf-bank-renderer';
import { rgb } from 'pdf-lib';
import {
  MARGIN_L,
  CONTENT_W,
} from '../pdf-bank-renderer';
import { formatIndianCurrency, rupeesInWords } from '../numberToWords';

export class PDFIDFCFirstBankRenderer extends PDFBankRenderer {
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
  private drawIDFCSectionHeader(title: string) {
    this.drawSectionHeader(title);
  }

  /**
   * Standard 3-column row: [Col 1: Number (width 24)] | [Col 2: Label (width ~205)] | [Col 3: Value (rest)]
   */
  private drawIDFCRow(num: string, label: string, value: string, boldVal: boolean = false) {
    const numW = 24;
    const labelW = 205;
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
        value: '',
        labelWidth: labelW,
        valueWidth: 0,
        labelBold: false,
      },
      {
        label: value || 'NA',
        value: '',
        labelWidth: valW,
        valueWidth: 0,
        labelBold: boldVal,
      },
    ]);
  }

  async drawContent(): Promise<void> {
    this.addPage();

    // Document Title Banner
    this.drawCenteredTitle('TECHNICAL APPRAISAL REPORT', 14, true);
    this.advanceCursor(6);

    // Reference & Date Bar
    const refNo = this.getF('report_ref_no', 'SMA/IDFC/HL/07-26/01');
    const reportDate = this.getF('report_date', new Date().toLocaleDateString('en-GB'));
    const halfW = CONTENT_W / 2;

    this.drawKeyValueRow([
      {
        label: 'Ref No: ' + refNo,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
      {
        label: 'Date: ' + reportDate,
        value: '',
        labelWidth: halfW,
        valueWidth: 0,
        labelBold: true,
      },
    ]);

    // Meta Grid: Branch Name, Type of Case, Valuer Name, Date of Visit, Case Ref No, Contact Person
    this.drawKeyValueRow([
      { label: 'Branch Name:', value: this.getF('branch_name', ''), labelWidth: 85, valueWidth: halfW - 85 },
      { label: 'Type of Case:', value: this.getF('case_type', 'HL'), labelWidth: 85, valueWidth: halfW - 85 },
    ]);
    this.drawKeyValueRow([
      { label: 'Valuer Name:', value: this.getF('valuer_name', 'ER. SATYAJIT MOHANTY'), labelWidth: 85, valueWidth: halfW - 85 },
      { label: 'Date of Visit:', value: this.getF('inspection_date', ''), labelWidth: 85, valueWidth: halfW - 85 },
    ]);
    this.drawKeyValueRow([
      { label: 'Case Ref. No.:', value: this.getF('case_ref_no', ''), labelWidth: 85, valueWidth: halfW - 85 },
      { label: 'Contact Person:', value: `${this.getF('contact_person', '')} ${this.getF('contact_phone', '') ? '(' + this.getF('contact_phone', '') + ')' : ''}`, labelWidth: 85, valueWidth: halfW - 85 },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // BASIC DETAILS
    // ==========================================
    this.drawIDFCSectionHeader('BASIC DETAILS');
    this.drawIDFCRow('1', 'Applicant/s Name/s', this.getF('applicant_name', ''));
    this.drawIDFCRow('2', 'Type of property', `${this.getF('property_type_desc', '')} | Usage: ${this.getF('current_usage', 'Residential')}`);
    this.drawIDFCRow('3', 'Address at site', this.getF('property_address_site', ''));
    this.drawIDFCRow('', 'Address as per document', this.getF('property_address_doc', ''));
    this.drawIDFCRow('4', 'Has valuator done valuation of this property before? If yes, when/for whom?', this.getF('prior_valuation_done', 'No'));

    this.advanceCursor(4);

    // ==========================================
    // SURROUNDING & LOCALITY DETAILS
    // ==========================================
    this.drawIDFCSectionHeader('SURROUNDING & LOCALITY DETAILS');
    this.drawIDFCRow('5', 'Location - Approved Usage', this.getF('approved_usage', 'Residential'));
    this.drawIDFCRow('', 'Class of Locality', this.getF('class_of_locality', 'Middle'));
    this.drawIDFCRow('', 'Site Status (Dev./Under Dev.)', this.getF('site_status', 'Developing'));
    this.drawIDFCRow('', 'Proximity to civic amenities/public transport', this.getF('proximity_civic_amenities', 'Within 1-2Kms'));
    this.drawIDFCRow('', 'Railway Station / Bus Stop', `Railway: ${this.getF('proximity_railway', 'NA')} | Bus: ${this.getF('proximity_bus', 'NA')}`);
    this.drawIDFCRow('6', 'Close Vicinity / Landmark', this.getF('landmark', ''));
    this.drawIDFCRow('7', 'Distance from City Centre', this.getF('distance_city_centre', ''));
    this.drawIDFCRow('8', 'Condition and width of approach road', `${this.getF('approach_road_width', '')} wide ${this.getF('approach_road_condition', '')}`);

    this.advanceCursor(4);

    // ==========================================
    // PROPERTY & BUILDING DETAILS
    // ==========================================
    this.drawIDFCSectionHeader('PROPERTY DETAILS');
    this.drawIDFCRow('9', 'Occupant', this.getF('occupant_status', 'Vacant / Under construction'));
    this.drawIDFCRow('10', 'Building Details - Name of Occupant', this.getF('occupant_name', 'NA'));
    this.drawIDFCRow('', 'Relation with applicant', this.getF('relation_with_applicant', 'NA'));
    this.drawIDFCRow('', 'Property Demarcation', this.getF('property_demarcation', 'Yes'));
    this.drawIDFCRow('', 'Property Identified through', this.getF('property_identified_through', 'Identified by documents (Sale deed, ROR)'));
    this.drawIDFCRow('', 'Type of Structure', this.getF('type_of_structure', 'RCC'));
    this.drawIDFCRow('', 'Land / Plot Area', `${this.getF('land_area_sqft', '')} sqft (${this.getF('land_area_unit', '')}) [As per documents]`);
    this.drawIDFCRow('', 'No of Blocks / Wings / Units per floor', `Wings: ${this.getF('no_of_wings', 'NA')} | Units/Floor: ${this.getF('units_per_floor', 'NA')}`);
    this.drawIDFCRow('', 'No. of Floors / No. of Lifts', `Floors: ${this.getF('no_of_floors', '1 (GF)')} | Lifts: ${this.getF('no_of_lifts', 'NA')}`);

    this.drawIDFCRow('11', 'Unit Details - Located on Floor No.', this.getF('unit_floor_no', 'GF'));
    this.drawIDFCRow('', 'No. of rooms / Road Facing', `Rooms: ${this.getF('no_of_rooms', '')} | Facing: ${this.getF('road_facing', 'South')}`);
    this.drawIDFCRow('', 'Carpet Area / Built-up Area', `Carpet: ${this.getF('carpet_area_measured', '')} sqft | Built-up: ${this.getF('builtup_area_measured', '')} sqft`);

    this.drawIDFCRow('12', 'Quality of Construction', `Exteriors: ${this.getF('quality_exteriors', 'Under construction')} | Interiors: ${this.getF('quality_interiors', 'Under construction')}`);
    this.drawIDFCRow('13', 'Age of the property / Residual life', `Age: ${this.getF('age_of_property', '0 Years')} | Residual: ${this.getF('residual_life', '60 Years')}`);

    this.advanceCursor(4);

    // ==========================================
    // SANCTION PLAN APPROVAL & OTHER DOCUMENTS
    // ==========================================
    this.drawIDFCSectionHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS');
    this.drawIDFCRow('14', 'Sanctioned plans verified with approval no', this.getF('sanctioned_plan_approval_no', ''));
    this.drawIDFCRow('14A', 'Construction as per approved plan', this.getF('construction_as_per_plan', 'Yes'));
    this.drawIDFCRow('14B', 'Construction permission', this.getF('construction_permission', 'NA'));
    this.drawIDFCRow('14C', 'Number and Date', this.getF('permission_number_date', 'NA'));
    this.drawIDFCRow('14D', 'Nature of the Land as per online records', this.getF('nature_of_land', 'Homestead'));
    this.drawIDFCRow('14E', 'Checked measurement & ownership online', this.getF('checked_online_records', 'Yes'));
    this.drawIDFCRow('15', 'Ownership type', this.getF('ownership_type', 'Freehold'));
    this.drawIDFCRow('16', 'Property documents verified', this.getF('documents_verified_list', 'Copy of Sale deed, ROR, Approved plan, Estimate'));
    this.drawIDFCRow('17', 'Is property within Municipal Limits', this.getF('within_municipal_limits', 'No (Within GP limit)'));
    this.drawIDFCRow('18', 'Permissible usage as per master plan', this.getF('permissible_master_plan', 'No (Master plan is not published)'));
    this.drawIDFCRow('19', 'Surroundings Habitation', this.getF('surrounding_habitation', '30%'));

    this.advanceCursor(4);

    // ==========================================
    // 19A. SETBACKS & DEMOLITION RISK
    // ==========================================
    this.drawIDFCSectionHeader('19A. SETBACKS & DEMOLITION RISK');
    const setbackColW = [90, 130, 130, CONTENT_W - 350];
    this.drawKeyValueRow([
      { label: 'Setbacks', value: '', labelWidth: setbackColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As per plan / Bye laws', value: '', labelWidth: setbackColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual at site', value: '', labelWidth: setbackColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Remarks, if any', value: '', labelWidth: setbackColW[3], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const setbacks = [
      { name: 'Front', plan: this.getF('setback_front_plan', "0'0\""), site: this.getF('setback_front_site', "0'0\"") },
      { name: 'Side1 (Left)', plan: this.getF('setback_left_plan', "0'0\""), site: this.getF('setback_left_site', "0'0\"") },
      { name: 'Side2 (Right)', plan: this.getF('setback_right_plan', "0'0\""), site: this.getF('setback_right_site', "0'0\"") },
      { name: 'Rear', plan: this.getF('setback_rear_plan', "0'0\""), site: this.getF('setback_rear_site', "0'0\"") },
    ];
    setbacks.forEach((s, idx) => {
      this.drawKeyValueRow([
        { label: s.name, value: '', labelWidth: setbackColW[0], valueWidth: 0 },
        { label: s.plan, value: '', labelWidth: setbackColW[1], valueWidth: 0 },
        { label: s.site, value: '', labelWidth: setbackColW[2], valueWidth: 0 },
        { label: idx === 0 ? this.getF('setback_remarks', 'NA') : '', value: '', labelWidth: setbackColW[3], valueWidth: 0 },
      ]);
    });

    this.drawIDFCRow('', 'Demolition risk (if any to be highlighted)', this.getF('demolition_risk', 'NIL'));

    this.advanceCursor(4);

    // ==========================================
    // 19B. FLOOR WISE AREA
    // ==========================================
    this.drawIDFCSectionHeader('19B. FLOOR WISE AREA (In Sqft / Sqmtrs.)');
    const flrColW = [60, 95, 95, 95, 95, CONTENT_W - 440];
    this.drawKeyValueRow([
      { label: 'Floor No', value: '', labelWidth: flrColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As plan Sqft', value: '', labelWidth: flrColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'As plan SqMt', value: '', labelWidth: flrColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual Sqft', value: '', labelWidth: flrColW[3], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Actual SqMt', value: '', labelWidth: flrColW[4], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Deviation (%)', value: '', labelWidth: flrColW[5], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const floorRows = [
      {
        flr: 'GF',
        planSqft: this.getF('floor_gf_plan_sqft', '828sqft'),
        planSqmt: this.getF('floor_gf_plan_sqmt', '76.95sqmt'),
        siteSqft: this.getF('floor_gf_site_sqft', '828sqft'),
        siteSqmt: this.getF('floor_gf_site_sqmt', '76.95sqmt'),
        dev: this.getF('floor_gf_deviation', 'NA'),
      },
      {
        flr: 'FF',
        planSqft: this.getF('floor_ff_plan_sqft', 'NA'),
        planSqmt: this.getF('floor_ff_plan_sqmt', 'NA'),
        siteSqft: this.getF('floor_ff_site_sqft', 'NA'),
        siteSqmt: this.getF('floor_ff_site_sqmt', 'NA'),
        dev: 'NA',
      },
    ];

    floorRows.forEach(f => {
      this.drawKeyValueRow([
        { label: f.flr, value: '', labelWidth: flrColW[0], valueWidth: 0, labelBold: true },
        { label: f.planSqft, value: '', labelWidth: flrColW[1], valueWidth: 0 },
        { label: f.planSqmt, value: '', labelWidth: flrColW[2], valueWidth: 0 },
        { label: f.siteSqft, value: '', labelWidth: flrColW[3], valueWidth: 0 },
        { label: f.siteSqmt, value: '', labelWidth: flrColW[4], valueWidth: 0 },
        { label: f.dev, value: '', labelWidth: flrColW[5], valueWidth: 0 },
      ]);
    });

    this.drawIDFCRow('20', 'Carpet Area As Measured', `${this.getF('carpet_area_measured', '')} sqft`);
    this.drawIDFCRow('', 'Carpet Area as per Agreement / Plan', `Agreement: ${this.getF('carpet_area_agreement', 'NA')} | Plan: ${this.getF('carpet_area_plan', '')} sqft`);
    this.drawIDFCRow('', 'Area Considered For Valuation', `${this.getF('area_considered_valuation', '')} sqft`);
    this.drawIDFCRow('20A', 'Ready Reckoner Rate (Govt. approved)', `Rs. ${this.getF('ready_reckoner_rate', '')}/- per sqft (in IGR)`);

    this.advanceCursor(4);

    // ==========================================
    // 21. VALUATION ENGINE
    // ==========================================
    this.drawIDFCSectionHeader('21. VALUATION');

    const valGridW = [210, 80, 80, 85, CONTENT_W - 455];
    this.drawKeyValueRow([
      { label: 'Description', value: '', labelWidth: valGridW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Area (Sft)', value: '', labelWidth: valGridW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Area (Sqmt)', value: '', labelWidth: valGridW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Rate (Sft)', value: '', labelWidth: valGridW[3], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'Amount (in Rs.)', value: '', labelWidth: valGridW[4], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    const landArea = parseFloat(this.getF('land_area_sqft', '0')) || 0;
    const landRate = parseFloat(this.getF('land_rate_sft', '0')) || 0;
    const landAmount = parseFloat(this.getF('land_amount', '0')) || (landArea * landRate);

    const buaArea = parseFloat(this.getF('builtup_area_sqft', '0')) || 0;
    const constRate100 = parseFloat(this.getF('construction_rate_100', '0')) || 0;
    const constAmount100 = parseFloat(this.getF('construction_amount_100', '0')) || (buaArea * constRate100);

    const stagePct = parseFloat(this.getF('stage_of_construction_pct', '30')) || 0;
    const stageRate = constRate100 * (stagePct / 100);
    const stageAmount = parseFloat(this.getF('stage_construction_amount', '0')) || (constAmount100 * (stagePct / 100));

    // Land row
    this.drawKeyValueRow([
      { label: 'Land', value: '', labelWidth: valGridW[0], valueWidth: 0, labelBold: true },
      { label: `${landArea} sft`, value: '', labelWidth: valGridW[1], valueWidth: 0 },
      { label: `${(landArea * 0.0929).toFixed(2)} sqmt`, value: '', labelWidth: valGridW[2], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(landRate)}/-`, value: '', labelWidth: valGridW[3], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(landAmount)}/-`, value: '', labelWidth: valGridW[4], valueWidth: 0, labelBold: true },
    ]);

    // 100% completion row
    this.drawKeyValueRow([
      { label: 'Construction Area on 100% completion', value: '', labelWidth: valGridW[0], valueWidth: 0 },
      { label: `${buaArea} sft`, value: '', labelWidth: valGridW[1], valueWidth: 0 },
      { label: `${(buaArea * 0.0929).toFixed(2)} sqmt`, value: '', labelWidth: valGridW[2], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(constRate100)}/-`, value: '', labelWidth: valGridW[3], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(constAmount100)}/-`, value: '', labelWidth: valGridW[4], valueWidth: 0 },
    ]);

    // As on date stage row
    this.drawKeyValueRow([
      { label: `As on date ${stagePct}% completion`, value: '', labelWidth: valGridW[0], valueWidth: 0, labelBold: true },
      { label: `${buaArea} sft`, value: '', labelWidth: valGridW[1], valueWidth: 0 },
      { label: `${(buaArea * 0.0929).toFixed(2)} sqmt`, value: '', labelWidth: valGridW[2], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(stageRate)}/-`, value: '', labelWidth: valGridW[3], valueWidth: 0 },
      { label: `Rs.${formatIndianCurrency(stageAmount)}/-`, value: '', labelWidth: valGridW[4], valueWidth: 0, labelBold: true },
    ]);

    const total100 = landAmount + constAmount100;
    const totalCurrent = landAmount + stageAmount;
    const forcedSaleVal = parseFloat(this.getF('forced_sale_value', '0')) || (totalCurrent * 0.8);
    const insuranceCost = parseFloat(this.getF('reconstruction_cost_insurance', '0')) || (buaArea * (parseFloat(this.getF('reconstruction_rate_sqft', '1500')) || 1500));

    this.drawKeyValueRow([
      { label: 'Total Value by Land & Building (100% completion):', value: `Rs.${formatIndianCurrency(total100)}/- (Land: ${formatIndianCurrency(landAmount)} + Const: ${formatIndianCurrency(constAmount100)})`, labelWidth: 260, valueWidth: CONTENT_W - 260, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: `Total Value by Land & Building (As on date ${stagePct}%):`, value: `Rs.${formatIndianCurrency(totalCurrent)}/- (Land: ${formatIndianCurrency(landAmount)} + Const: ${formatIndianCurrency(stageAmount)})`, labelWidth: 260, valueWidth: CONTENT_W - 260, labelBold: true },
    ]);
    this.drawKeyValueRow([
      { label: 'Stage of Construction:', value: `${stagePct}%`, labelWidth: 160, valueWidth: halfW - 160 },
      { label: 'Recommended Const. Value:', value: `Rs.${formatIndianCurrency(stageAmount)}/-`, labelWidth: 160, valueWidth: halfW - 160, valueBold: true },
    ]);

    // Highlighted Market Value Box
    this.drawKeyValueRow([
      {
        label: 'Total Market Value of Property (in Amt.):',
        value: `Rs. ${formatIndianCurrency(totalCurrent)}/-`,
        labelWidth: 320,
        valueWidth: CONTENT_W - 320,
        labelBold: true,
        valueBold: true,
        highlight: true,
      },
    ]);

    this.drawKeyValueRow([
      {
        label: 'Rupees in words:',
        value: rupeesInWords(Math.round(totalCurrent)),
        labelWidth: 120,
        valueWidth: CONTENT_W - 120,
        labelBold: true,
        valueBold: true,
      },
    ]);

    this.drawKeyValueRow([
      { label: 'Forced Sale Value (80%):', value: `Rs.${formatIndianCurrency(forcedSaleVal)}/-`, labelWidth: 160, valueWidth: halfW - 160, valueBold: true },
      { label: 'Re-construction Cost (Insurance):', value: `Rs.${formatIndianCurrency(insuranceCost)}/-`, labelWidth: 170, valueWidth: halfW - 170, valueBold: true },
    ]);

    this.advanceCursor(4);

    // ==========================================
    // 22. BOUNDARIES
    // ==========================================
    this.drawIDFCSectionHeader('22. BOUNDARIES');

    const bndColW = [110, 110, 110, 110, CONTENT_W - 440];
    this.drawKeyValueRow([
      { label: 'Boundaries', value: '', labelWidth: bndColW[0], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'East', value: '', labelWidth: bndColW[1], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'West', value: '', labelWidth: bndColW[2], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'North', value: '', labelWidth: bndColW[3], valueWidth: 0, labelBold: true, highlight: true },
      { label: 'South', value: '', labelWidth: bndColW[4], valueWidth: 0, labelBold: true, highlight: true },
    ]);

    this.drawKeyValueRow([
      { label: 'As per Sale deed', value: '', labelWidth: bndColW[0], valueWidth: 0, labelBold: true },
      { label: this.getF('boundary_east_deed', ''), value: '', labelWidth: bndColW[1], valueWidth: 0 },
      { label: this.getF('boundary_west_deed', ''), value: '', labelWidth: bndColW[2], valueWidth: 0 },
      { label: this.getF('boundary_north_deed', ''), value: '', labelWidth: bndColW[3], valueWidth: 0 },
      { label: this.getF('boundary_south_deed', ''), value: '', labelWidth: bndColW[4], valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'As per Sketch map', value: '', labelWidth: bndColW[0], valueWidth: 0, labelBold: true },
      { label: this.getF('boundary_east_map', 'NA'), value: '', labelWidth: bndColW[1], valueWidth: 0 },
      { label: this.getF('boundary_west_map', 'NA'), value: '', labelWidth: bndColW[2], valueWidth: 0 },
      { label: this.getF('boundary_north_map', 'NA'), value: '', labelWidth: bndColW[3], valueWidth: 0 },
      { label: this.getF('boundary_south_map', 'NA'), value: '', labelWidth: bndColW[4], valueWidth: 0 },
    ]);

    this.drawKeyValueRow([
      { label: 'At site', value: '', labelWidth: bndColW[0], valueWidth: 0, labelBold: true },
      { label: this.getF('boundary_east_site', ''), value: '', labelWidth: bndColW[1], valueWidth: 0 },
      { label: this.getF('boundary_west_site', ''), value: '', labelWidth: bndColW[2], valueWidth: 0 },
      { label: this.getF('boundary_north_site', ''), value: '', labelWidth: bndColW[3], valueWidth: 0 },
      { label: this.getF('boundary_south_site', ''), value: '', labelWidth: bndColW[4], valueWidth: 0 },
    ]);

    this.drawIDFCRow('', 'Boundaries Matching', this.getF('boundaries_matching', 'Yes (Boundary is partly matching as per documents)'));

    // Remarks
    this.drawIDFCRow('', 'Remarks & Observations', this.getF('technical_remarks', 'Subject property is under construction building. Valuation has been done for land & approved BUA of GF only.'));

    // Flags & Coordinates
    this.drawKeyValueRow([
      { label: 'Caution Area (Y/N):', value: this.getF('property_caution_area', 'No'), labelWidth: 120, valueWidth: halfW - 120 },
      { label: 'Negative Area (Y/N):', value: this.getF('property_negative_area', 'No'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property in OGL (Y/N):', value: this.getF('property_ogl', 'No'), labelWidth: 120, valueWidth: halfW - 120 },
      { label: 'Verified Online Record:', value: this.getF('verified_online_record', 'Yes'), labelWidth: 120, valueWidth: halfW - 120 },
    ]);
    this.drawKeyValueRow([
      { label: 'Latitude:', value: this.getF('latitude', ''), labelWidth: 70, valueWidth: halfW - 70 },
      { label: 'Longitude:', value: this.getF('longitude', ''), labelWidth: 70, valueWidth: halfW - 70 },
    ]);

    this.advanceCursor(12);

    // Signatory
    this.drawKeyValueRow([
      { label: 'Authorized Signatory\nFor S MOHANTY ASSOCIATES', value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
      { label: `Valuer Name: ${this.getF('valuer_name', 'ER. SATYAJIT MOHANTY')}\nDate: ${reportDate}`, value: '', labelWidth: halfW, valueWidth: 0, labelBold: true },
    ]);

    // ==========================================
    // INHERITED ATTACHMENTS (DOCUMENTS, MAPS, PHOTOGRAPHS)
    // ==========================================
    if (this.fields.documents?.length > 0) {
      await this.drawDocumentsGallery(this.fields.documents);
    }
    if (this.fields.maps?.length > 0) {
      await this.drawMapGallery(this.fields.maps, 'LOCATION SKETCH / ROUTE MAP (GOOGLE & MAP IMAGES)');
    }
    if (this.fields.photographs?.length > 0) {
      await this.drawPhotoGrid(this.fields.photographs);
    }
  }
}
