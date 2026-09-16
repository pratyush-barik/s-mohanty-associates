import { rgb } from 'pdf-lib';
import { 
  PDFBankRenderer, 
  PAGE_W, 
  PAGE_H, 
  MARGIN_L, 
  CONTENT_W, 
  FONT_SIZE, 
  FONT_SIZE_HEADER, 
  FONT_SIZE_TITLE, 
  hexToRgb 
} from '../pdf-bank-renderer';

export class PDFBajajHousingRenderer extends PDFBankRenderer {
  private fields: any;

  constructor(fields?: any) {
    super();
    this.fields = fields || {};
  }

  /** Force labels bold, values normal for all key-value rows */
  override drawKeyValueRow(cols: { label: string; value: string; labelWidth?: number; valueWidth?: number; highlight?: boolean; bold?: boolean; labelBold?: boolean; valueBold?: boolean; hideTop?: boolean; hideBottom?: boolean }[]): void {
    const newCols = cols.map(c => ({
      ...c,
      labelBold: true,
      valueBold: false
    }));
    super.drawKeyValueRow(newCols);
  }

  override drawSimpleRow(label: string, value: string, highlight?: boolean, bold?: boolean): void {
    const labelW = Math.round(CONTENT_W * 0.40);
    const valueW = CONTENT_W - labelW;
    super.drawKeyValueRow([{ 
      label, 
      value: value || 'NA', 
      labelWidth: labelW, 
      valueWidth: valueW, 
      highlight, 
      labelBold: true, 
      valueBold: false 
    }]);
  }

  override drawCenteredTitle(title: string, fontSize?: number, underline?: boolean) {
    const isValuationReport = title.trim().toLowerCase() === 'valuation report';
    const finalTitle = isValuationReport ? 'Valuation Report' : title;
    super.drawCenteredTitle(finalTitle, fontSize, isValuationReport ? true : underline);
  }

  override drawSectionHeader(title: string, addSpaceBefore?: boolean, preserveCase?: boolean) {
    super.drawSectionHeader(title, addSpaceBefore, preserveCase);
    if (title === 'APPLICATION DETAILS') {
      this.drawBajajSection1();
    } else if (title === 'LOCATION DETAILS') {
      this.drawBajajSection2();
    } else if (title === 'PROPERTY DETAILS') {
      this.drawBajajSection3();
    } else if (title === 'BOUNDARIES & SCHEDULE') {
      this.drawBajajSection4();
    } else if (title === 'NDMA PARAMETERS') {
      this.drawBajajSection5();
    } else if (title === 'APPROVED PLAN DETAILS') {
      this.drawBajajSection6();
    } else if (title === 'TECHNICAL DETAILS') {
      this.drawBajajSection7();
    } else if (title === 'PLOT & BAU AREA') {
      this.drawBajajSection8();
    } else if (title === 'VALUATION') {
      this.drawBajajSection9();
    } else if (title === 'REMARKS & PANCHAYAT') {
      this.drawBajajSection10();
    } else if (title === 'DECLARATION') {
      this.drawBajajSection11();
    }
  }

  // Helper to get field value with a default
  private fv(key: string, def = 'NA'): string {
    const val = this.fields[key];
    if (this.fields[`${key}_isCustom`]) {
      return String(val || def);
    }
    return val ? String(val) : def;
  }

  // ── Section 1: Application Details ──
  private drawBajajSection1() {
    const fv = this.fv.bind(this);

    // Helpers to build complex field strings
    const getContactPerson = () => {
      if (this.fields.bajajContactPerson_isNA) return 'NA';
      const name = this.fields.bajajContactPersonName || '';
      const phone = this.fields.bajajContactPersonPhone ? `+91 ${this.fields.bajajContactPersonPhone}` : '';
      return [name, phone].filter(Boolean).join(' - ') || 'NA';
    };

    const getLoanType = () => {
      if (this.fields.bajajLoanType === 'Custom') return this.fields.bajajLoanTypeCustom || 'NA';
      return fv('bajajLoanType');
    };

    const getPropertyOwner = () => {
      if (this.fields.bajajPropertyOwner_isNA) return 'NA';
      const name = this.fields.bajajPropertyOwnerName || '';
      let rel = this.fields.bajajPropertyOwnerRelation || '';
      if (rel === 'Custom') rel = this.fields.bajajPropertyOwnerRelationCustom || '';
      const relName = this.fields.bajajPropertyOwnerRelative || '';
      
      const relClause = rel && relName ? `${rel} ${relName}` : '';
      return [name, relClause].filter(Boolean).join(', ') || 'NA';
    };

    this.drawKeyValueRow([
      { label: 'File No./LAN No./System No.', value: this.fields.bajajFileNo_isNA ? 'NA' : fv('bajajFileNo') },
      { label: 'Date of Report', value: fv('bajajDateOfReport') }
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Applicant', value: fv('bajajNameOfApplicant') },
      { label: 'Contact Person Name & No.', value: getContactPerson() }
    ]);
    this.drawKeyValueRow([
      { label: 'Loan Type (HL/LAP/BT)', value: getLoanType() },
      { label: 'Person Met at Site', value: this.fields.bajajPersonMetAtSite_isNA ? 'NA' : fv('bajajPersonMetAtSite') }
    ]);
    this.drawSimpleRow('Name of Property Owner as per Legal Document', getPropertyOwner());
    this.drawSimpleRow('Documents Provided', this.fields.bajajDocumentsProvided_isNA ? 'NA' : fv('bajajDocumentsProvided'));
  }

  // ── Section 2: Location Details ──
  private drawBajajSection2() {
    const fv = this.fv.bind(this);

    this.drawSimpleRow('Address of Property (Address as per Site)', this.fields.bajajAddressAsPerSite_isNA ? 'NA' : fv('bajajAddressAsPerSite'));

    this.drawKeyValueRow([
      { label: 'Locality Name', value: this.fields.bajajLocalityName_isNA ? 'NA' : fv('bajajLocalityName') },
      { label: 'Landmark Near By', value: this.fields.bajajLandmarkNearBy_isNA ? 'NA' : fv('bajajLandmarkNearBy') }
    ]);

    const dist = this.fields.bajajDistanceFromCityCentre ? `${this.fields.bajajDistanceFromCityCentre} Kms` : '';
    const latStr = this.fields.bajajLatitude_isNA ? 'NA' : fv('bajajLatitude', '');
    const longStr = this.fields.bajajLongitude_isNA ? 'NA' : fv('bajajLongitude', '');
    let latLong = [latStr, longStr].filter(s => s && s !== 'NA').join(', ');
    if (this.fields.bajajLatitude_isNA && this.fields.bajajLongitude_isNA) {
      latLong = 'NA';
    } else if (!latLong) {
      latLong = 'NA';
    }

    this.drawKeyValueRow([
      { label: 'Distance from City Centre', value: this.fields.bajajDistanceFromCityCentre_isNA ? 'NA' : (dist || 'NA') },
      { label: 'LAT/Long', value: latLong }
    ]);
    this.drawSimpleRow('Address as per Initiation', this.fields.bajajAddressAsPerInitiation_isNA ? 'NA' : fv('bajajAddressAsPerInitiation'));
  }

  drawSectionSubtitle(title: string) {
    this.drawSectionHeader(title, false, false);
  }

  // ── Section 3: Legal Address & Property Details ──
  private drawBajajSection3() {
    const fv = this.fv.bind(this);
    const getVal = (field: string) => this.fields[`${field}_isNA`] ? 'NA' : fv(field);

    this.advanceCursor(6);
    this.drawSectionSubtitle('Legal Address of the Property: (As per Title Deed or Sanctioned Plan)');
    this.drawSimpleRow('Address of Property', getVal('bajajLegalAddressOfProperty'));
    this.drawSimpleRow('Floor No. of Property', getVal('bajajFloorNoOfProperty'));
    this.drawSimpleRow('Property State', getVal('bajajPropertyState'));
    this.drawSimpleRow('Property City', getVal('bajajPropertyCity'));
    this.drawSimpleRow('Property Pin code', getVal('bajajPropertyPinCode'));

    this.advanceCursor(4);
    this.drawKeyValueRow([
      { label: 'Address Matching (Yes/No)', value: getVal('bajajAddressMatching') },
      { label: 'Jurisdiction/Local Municipal Body', value: getVal('bajajJurisdictionMunicipalBody') }
    ]);

    this.advanceCursor(6);
    this.drawSectionSubtitle('Property Character & Occupancy');
    this.drawKeyValueRow([
      { label: 'Property Holding Type (Freehold/Lease hold)', value: getVal('bajajPropertyHoldingType') },
      { label: 'Marketability (Poor/Fair/Good)', value: getVal('bajajMarketability') }
    ]);
    this.drawSimpleRow('Property Occupied by (Self/Tenant/Vacant/Under Construction)', getVal('bajajPropertyOccupiedBy'));
    this.drawSimpleRow('Type of the Property (Flat/Bungalow/Commercial Building/Commercial Unit/Industrial/Plot)', getVal('bajajTypeOfProperty'));
    this.drawSimpleRow('Occupancy Status SORP/SOCP/Rented/Vacant (Please mentioned only one)', getVal('bajajOccupancy'));
  }

  // ── Section 4: Schedule of the Property ──
  private drawBajajSection4() {
    const fv = this.fv.bind(this);
    const getVal = (field: string) => this.fields[`${field}_isNA`] ? 'NA' : fv(field);

    // Boundaries table
    const bHeaders = ['Boundaries', 'As per legal documents (Sub Plot No-J & Sub plot no-K-1(Part))', 'As per site visit'];
    const bRows = [
      ['North', getVal('bajajBoundaryNorthDeed'), getVal('bajajBoundaryNorthActual')],
      ['East', getVal('bajajBoundaryEastDeed'), getVal('bajajBoundaryEastActual')],
      ['West', getVal('bajajBoundaryWestDeed'), getVal('bajajBoundaryWestActual')],
      ['South', getVal('bajajBoundarySouthDeed'), getVal('bajajBoundarySouthActual')]
    ];
    const cw = CONTENT_W;
    this.drawTable(bHeaders, bRows, [cw * 0.15, cw * 0.425, cw * 0.425], [], [0]);

    this.advanceCursor(4);
    this.drawKeyValueRow([
      { label: 'Boundaries Matching (Yes/No)', value: getVal('bajajBoundaryMatching') },
      { label: 'Property Identified (Yes/No)', value: getVal('bajajPropertyIdentifiable') }
    ]);
    this.drawSimpleRow('Approach Road Size (<5 ft/5-10 ft/ 10-15 ft/ 15ft)', getVal('bajajApproachRoadSize'));
  }

  // ── Section 5: NDMA Parameters ──
  private drawBajajSection5() {
    const fv = this.fv.bind(this);
    const getVal = (field: string) => this.fields[`${field}_isNA`] ? 'NA' : fv(field);

    const ndmaFields = [
      ['Nature of Building/Wing', 'bajajNatureOfBuilding', 'Plan Aspect Ratio', 'bajajPlanAspectRatio'],
      ['Structure Type', 'bajajStructureType', 'Projected Parts', 'bajajProjectedParts'],
      ['Type of Masonry', 'bajajTypeOfMasonry', 'Expansion Joints Available', 'bajajExpansionJointsAvailable'],
      ['Roof Type', 'bajajRoofType', 'Steel Grade', 'bajajSteelGrade'],
      ['Mortar Type', 'bajajMortarType', 'Concrete Grade', 'bajajConcreteGrade'],
      ['Environment Exposure Condition', 'bajajEnvironmentExposureCondition', 'Footing Type', 'bajajFootingType'],
      ['Seismic Zone', 'bajajSeismicZone', 'Soil Liquefiable', 'bajajSoilLiquefiable'],
      ['Coastal Regulatory Zone', 'bajajCoastalRegulatoryZone', 'Vulnerable to Landslide', 'bajajSoilSlopeVulnerableToLandslide'],
      ['Flood Prone Area', 'bajajFloodProneArea', 'Ground Slope > 20%', 'bajajGroundSlopeMoreThan20']
    ];

    for (const [l1, k1, l2, k2] of ndmaFields) {
      this.drawKeyValueRow([
        { label: l1, value: getVal(k1) },
        { label: l2, value: getVal(k2) }
      ]);
    }
    this.drawSimpleRow('Fire Exit (Yes/No)', getVal('bajajFireExit'));
  }

  // ── Section 6: Approved Plan Details ──
  private drawBajajSection6() {
    const fv = this.fv.bind(this);
    const getVal = (field: string) => this.fields[`${field}_isNA`] ? 'NA' : fv(field);

    this.drawKeyValueRow([
      { label: 'Sanctioned Plan Provided (Yes/No)', value: getVal('bajajSanctionedPlanProvided') },
      { label: 'Layout Plan Details: Sanctioned No./Permit No.', value: getVal('bajajLayoutPlanNo') }
    ]);
    this.drawKeyValueRow([
      { label: 'Construction Plan Details: Sanctioned No/Permit No.', value: getVal('bajajConstructionPlanNo') },
      { label: 'Date of Sanction', value: getVal('bajajDateOfSanction') }
    ]);
    this.drawKeyValueRow([
      { label: 'Plan Validity', value: getVal('bajajPlanValidity') },
      { label: 'Approving Authority', value: getVal('bajajApprovingAuthority') }
    ]);
    this.drawKeyValueRow([
      { label: 'Approved Usages (Residential/Industrial/Commercial/Mixed Usages)', value: getVal('bajajApprovedCategory') },
      { label: 'Number of Floor in Building', value: getVal('bajajNumberOfFloorsBuilding') }
    ]);
  }

  // ── Section 7: Technical Details ──
  private drawBajajSection7() {
    const fv = this.fv.bind(this);
    const getVal = (field: string) => this.fields[`${field}_isNA`] ? 'NA' : fv(field);

    this.drawKeyValueRow([
      { label: 'Construction Quality (Good/Average/Poor)', value: getVal('bajajConstructionQuality') },
      { label: 'Lift Available (Yes/No)', value: getVal('bajajLiftAvailable') }
    ]);
    this.drawKeyValueRow([
      { label: 'No. of Lifts', value: getVal('bajajNoOfLifts') },
      { label: 'Separate Independent Access (Yes/No)', value: getVal('bajajSeparateAccess') }
    ]);
    this.drawSimpleRow('Current Occupant of Property (Owner/Tenant/Vacant)', getVal('bajajCurrentOccupant'));
    this.drawSimpleRow('Accommodation details: Floor wise and Occupancy', getVal('bajajAccommodationDetails'));
  }

  // ── Section 8: Plot & BAU Area Details ──
  private drawBajajSection8() {
    const fv = this.fv.bind(this);
    const cw = CONTENT_W;

    // 1. Plot Area Dimension Matrix
    this.drawSectionSubtitle('Plot Area Details');
    const paHeaders = ['Plot Area Dimension', 'As Per Documents', 'As Per Plan', 'As Per Site Visit'];
    const paRows = [
      ['East to West', fv('bajajPlotEWDoc'), fv('bajajPlotEWPlan'), fv('bajajPlotEWSite')],
      ['North to South', fv('bajajPlotNSDoc'), fv('bajajPlotNSPlan'), fv('bajajPlotNSSite')],
      ['Land Area (In Sq. Ft.)', fv('bajajLandAreaDoc'), fv('bajajLandAreaPlan'), fv('bajajLandAreaSite')]
    ];
    this.drawTable(paHeaders, paRows, [cw * 0.25, cw * 0.25, cw * 0.25, cw * 0.25], [], [0]);

    this.advanceCursor(6);

    // 2. BAU Area Details
    this.drawSectionSubtitle('BAU Area Details');
    const bauHeaders = ['BAU Area Details', 'No. of Rooms', 'No. of Kitchens', 'No. of Bathrooms', 'Sanctioned Usages', 'Actual Usage'];
    const bauFloors = this.fields.bajajBAUAreaFloors || [];
    const bauRows = Array.isArray(bauFloors) && bauFloors.length > 0 
      ? bauFloors.map((f: any) => [
          f.floor || '',
          f.rooms || '',
          f.kitchens || '',
          f.bathrooms || '',
          f.sanctionedUsage === 'Custom' ? f.sanctionedUsageCustom || '' : f.sanctionedUsage || '',
          f.actualUsage === 'Custom' ? f.actualUsageCustom || '' : f.actualUsage || ''
        ])
      : [['', '', '', '', '', '']];
    this.drawTable(bauHeaders, bauRows, [cw * 0.2, cw * 0.12, cw * 0.12, cw * 0.12, cw * 0.22, cw * 0.22], [], [0]);

    this.advanceCursor(6);

    // 3. Items (FSI & Construction Area)
    this.drawSectionSubtitle('Items (FSI & Construction Area)');
    this.drawKeyValueRow([
      { label: 'Permissible area as per plan (In Sq. Ft)', value: fv('bajajPermissiblePlan') },
      { label: 'Land Component (in Sq. Ft)', value: fv('bajajLandComponent') }
    ]);
    this.drawKeyValueRow([
      { label: 'Permissible FSI', value: fv('bajajPermissibleFSI') },
      { label: 'Permissible construction as per FSI (In Sq. Ft)', value: fv('bajajPermissibleConstruction') }
    ]);
    this.drawKeyValueRow([
      { label: 'Carpet Area as Per Document', value: fv('bajajCarpetAreaDoc') }
    ]);
    
    // Custom multiline draw for Actual construction (BUA) (In Sq. Ft)
    this.drawSimpleRow('Actual construction (BUA) (In Sq. Ft)', fv('bajajActualConstruction'));
    
    this.advanceCursor(4);
    
    // Risk, Status & Age Assessment
    this.drawSectionSubtitle('Risk, Status & Age Assessment');
    this.drawKeyValueRow([
      { label: 'Risk of Demolition', value: fv('bajajRiskOfDemolition') === 'Custom' ? fv('bajajRiskOfDemolitionCustom') : fv('bajajRiskOfDemolition') },
      { label: 'Status of the Property', value: fv('bajajStatusOfProperty') === 'Custom' ? fv('bajajStatusOfPropertyCustom') : fv('bajajStatusOfProperty') }
    ]);
    this.drawKeyValueRow([
      { label: '% Completed', value: fv('bajajPropertyCompletedPercent') ? `${fv('bajajPropertyCompletedPercent')}%` : '' },
      { label: '% Recommended', value: fv('bajajPropertyRecommendedPercent') ? `${fv('bajajPropertyRecommendedPercent')}%` : '' }
    ]);
    this.drawKeyValueRow([
      { label: 'Current Age of Property', value: fv('bajajCurrentAgeInYear') ? `${fv('bajajCurrentAgeInYear')} Years` : '' },
      { label: 'Residual Age', value: fv('bajajResidualAge') ? `${fv('bajajResidualAge')} Years` : '' }
    ]);

  }

  // ── Section 9: Valuation & Calculation ──
  private drawBajajSection9() {
    const fv = this.fv.bind(this);
    const cw = CONTENT_W;

    this.drawSectionSubtitle('Valuation Breakdown by Items');
    const vHeaders = ['Items', 'Area Details in Sq. Ft.', 'Rate per Sq. Ft.', 'Total Values in Rupees'];
    
    // Calculate totals for the PDF
    const landArea = parseFloat(fv('bajajValuationLandArea')) || 0;
    const landRate = parseFloat(fv('bajajValuationLandRate')) || 0;
    const landVal = landArea * landRate;

    const buaArea = parseFloat(fv('bajajValuationBUAArea')) || 0;
    const buaRate = parseFloat(fv('bajajValuationBUARate')) || 0;
    const buaVal = buaArea * buaRate;

    const formatINR = (num: number) => {
      return new Intl.NumberFormat('en-IN').format(num);
    };
    
    const vRows = [
      ['Land Value(As per ROR)', fv('bajajValuationLandArea'), fv('bajajValuationLandRate'), landVal ? formatINR(landVal) : ''],
      ['BUA Value (Measured BUA G+3)', fv('bajajValuationBUAArea'), fv('bajajValuationBUARate'), buaVal ? formatINR(buaVal) : ''],
      ['Car Parking Charges', fv('bajajValuationCarParkingArea'), fv('bajajValuationCarParkingRate'), fv('bajajValuationCarParkingTotal')]
    ];
    this.drawTable(vHeaders, vRows, [cw * 0.35, cw * 0.25, cw * 0.20, cw * 0.20], [], [0]);

    this.advanceCursor(6);

    this.drawSectionSubtitle('Valuation Summary & Statutory Checks');
    this.drawKeyValueRow([
      { label: 'Amenities/Other charges (Lumpsum)', value: fv('bajajAmenitiesOtherCharges') },
      { label: 'Realizable value as on date', value: fv('bajajRealizableValue') }
    ]);
    this.drawKeyValueRow([
      { label: 'Government Value', value: fv('bajajGovernmentValue') },
      { label: 'Distressed/ Force Value', value: fv('bajajDistressedValue') }
    ]);
    
    const valuationDoneEarlier = fv('bajajValuationDoneEarlier') === 'Custom' ? fv('bajajValuationDoneEarlierCustom') : fv('bajajValuationDoneEarlier');
    this.drawSimpleRow('Valuation Done Earlier', valuationDoneEarlier);
    
    const methodology = fv('bajajValuationMethodology') === 'Custom' ? fv('bajajValuationMethodologyCustom') : fv('bajajValuationMethodology');
    this.drawSimpleRow('Valuation Methodology', methodology);

    const demolitionList = fv('bajajMunicipalDemolitionList') === 'Custom' ? fv('bajajMunicipalDemolitionListCustom') : fv('bajajMunicipalDemolitionList');
    this.drawSimpleRow('In Municipal/ Development Authority Demolition List', demolitionList);

    const negativeArea = fv('bajajPropertyInNegativeArea') === 'Custom' ? fv('bajajPropertyInNegativeAreaCustom') : fv('bajajPropertyInNegativeArea');
    this.drawSimpleRow('Is Property in Negative Area', negativeArea);

  }

  // ── Section 10: Remarks & Additional Checks for Panchayat Properties ──
  private drawBajajSection10() {
    const fv = this.fv.bind(this);
    const cw = CONTENT_W;

    this.drawSectionSubtitle('General Observations & Remarks');
    this.drawTextBlock(fv('bajajRemarksIfAny'));
    this.advanceCursor(6);

    if (fv('bajajLocationJurisdiction') === 'Gram Panchayat') {
      this.drawSectionSubtitle('Additional checks for Panchayat properties');
      const getPanchayatValue = (field: string) => fv(`${field}`) === 'Custom' ? fv(`${field}Custom`) : fv(`${field}`);

      this.drawKeyValueRow([
        { label: 'Approach Road to the property', value: getPanchayatValue('bajajPanchayatApproachRoad') },
        { label: 'Development of surrounding areas', value: getPanchayatValue('bajajPanchayatDevelopment') }
      ]);
      this.drawKeyValueRow([
        { label: 'Distance from city centre (Kms)', value: fv('bajajPanchayatDistanceCityCentre') },
        { label: 'Distance from corp limits (Kms)', value: fv('bajajPanchayatDistanceCorp') }
      ]);
      this.drawKeyValueRow([
        { label: 'Electricity', value: getPanchayatValue('bajajPanchayatElectricity') },
        { label: 'Electricity Distributor', value: getPanchayatValue('bajajPanchayatElectricityDistributor') }
      ]);
      this.drawKeyValueRow([
        { label: 'Water supply', value: getPanchayatValue('bajajPanchayatWaterSupply') },
        { label: 'Water Distributor', value: fv('bajajPanchayatWaterDistributor') }
      ]);
      this.drawKeyValueRow([
        { label: 'Sewer provision', value: getPanchayatValue('bajajPanchayatSewerProvision') },
        { label: 'Sewer connected to main sewer', value: getPanchayatValue('bajajPanchayatSewerMainConnected') }
      ]);
      this.drawSimpleRow('Any demolition threat in future development/ expansion', getPanchayatValue('bajajPanchayatDemolitionThreat'));
      this.advanceCursor(6);
    }
  }

  // ── Section 11: Declaration & Verification ──
  private drawBajajSection11() {
    const fv = this.fv.bind(this);

    this.drawSectionSubtitle('Declaration (I hereby declare that)');
    const declarationText = fv('bajajDeclarationText');
    if (declarationText) {
      const lines = declarationText.split('\n');
      for (const line of lines) {
        if (line.trim()) {
          this.drawTextBlock(`\u2022 ${line.trim()}`);
        }
      }
    }
    this.advanceCursor(10);

    // Signature block
    this.drawSimpleRow('For Seal with Signature', '');
    this.drawSimpleRow('Date', fv('bajajSignatureDate'));
    this.drawSimpleRow('Place', fv('bajajSignaturePlace'));
  }
}

export default PDFBajajHousingRenderer;
