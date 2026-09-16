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
    } else if (title === 'APPROVAL DETAILS') {
      this.drawBajajSection5();
    } else if (title === 'TECHNICAL DETAILS') {
      this.drawBajajSection6();
    } else if (title === 'AREA & FLOOR DETAILS') {
      this.drawBajajSection7();
    } else if (title === 'VALUATION SUMMARY') {
      this.drawBajajSection8();
    } else if (title === 'REMARKS & DECLARATION') {
      this.drawBajajSection9();
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

    this.drawKeyValueRow([
      { label: 'File No./LAN No./System No.', value: fv('bajajFileNo') },
      { label: 'Date of Report', value: fv('bajajDateOfReport') }
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Applicant', value: fv('bajajNameOfApplicant') },
      { label: 'Contact Person Name & No.', value: fv('bajajContactPersonNameNo') }
    ]);
    this.drawKeyValueRow([
      { label: 'Loan Type (HL/LAP/BT)', value: fv('bajajLoanType') },
      { label: 'Person Met at Site', value: fv('bajajPersonMetAtSite') }
    ]);
    this.drawSimpleRow('Name of Property Owner as per Legal Document', fv('bajajPropertyOwnerName'));
    this.drawSimpleRow('Documents Provided', fv('bajajDocumentsProvided'));
  }

  // ── Section 2: Location Details ──
  private drawBajajSection2() {
    const fv = this.fv.bind(this);

    this.drawSimpleRow('Address as per Site', fv('bajajAddressAsPerSite'));

    this.drawKeyValueRow([
      { label: 'Locality Name', value: fv('bajajLocalityName') },
      { label: 'Landmark Near By', value: fv('bajajLandmarkNearBy') }
    ]);
    this.drawKeyValueRow([
      { label: 'Distance from City Centre', value: fv('bajajDistanceFromCityCentre') },
      { label: 'LAT/Long', value: `${fv('bajajLatitude', '')}, ${fv('bajajLongitude', '')}` }
    ]);
    this.drawSimpleRow('Address as per Initiation', fv('bajajAddressAsPerInitiation'));

    // Legal Address sub-section
    this.advanceCursor(6);
    this.drawSectionSubtitle('Legal Address of the Property: (As per Title Deed or Sanctioned Plan)');
    this.drawSimpleRow('Address of Property', fv('bajajLegalAddressOfProperty'));
    this.drawSimpleRow('Floor No. of Property', fv('bajajFloorNoOfProperty'));
    this.drawSimpleRow('Property State', fv('bajajPropertyState'));
    this.drawSimpleRow('Property City', fv('bajajPropertyCity'));
    this.drawSimpleRow('Property Pin code', fv('bajajPropertyPinCode'));

    this.advanceCursor(4);
    this.drawKeyValueRow([
      { label: 'Address Matching (Yes/No)', value: fv('bajajAddressMatching') },
      { label: 'Jurisdiction/Local Municipal Body', value: fv('bajajJurisdictionMunicipalBody') }
    ]);
    this.drawKeyValueRow([
      { label: 'Property Holding Type (Freehold/Leasehold)', value: fv('bajajPropertyHoldingType') },
      { label: 'Marketability (Poor/Fair/Good)', value: fv('bajajMarketability') }
    ]);
    this.drawSimpleRow('Property Occupied by (Self/Tenant/Vacant/Under Construction)', fv('bajajPropertyOccupiedBy'));
  }

  drawSectionSubtitle(title: string) {
    this.drawSectionHeader(title, false, false);
  }

  // ── Section 3: Property Details ──
  private drawBajajSection3() {
    const fv = this.fv.bind(this);

    this.drawSimpleRow('Type of the Property (Flat/Bungalow/Commercial Building/Commercial)', fv('bajajTypeOfProperty'));
    this.drawKeyValueRow([
      { label: 'Occupancy (Self/Owner/Rented/Vacant)', value: fv('bajajOccupancy') },
      { label: 'SOBP', value: fv('bajajSOBP') }
    ]);
    this.drawSimpleRow('Schedule of the Property', fv('bajajScheduleOfProperty'));
  }

  // ── Section 4: Boundaries & Schedule ──
  private drawBajajSection4() {
    const fv = this.fv.bind(this);

    // Boundaries table
    const bHeaders = ['Boundaries', 'As per sale deed', 'As per Actual'];
    const bRows = [
      ['North', fv('bajajBoundaryNorthDeed'), fv('bajajBoundaryNorthActual')],
      ['East', fv('bajajBoundaryEastDeed'), fv('bajajBoundaryEastActual')],
      ['South', fv('bajajBoundarySouthDeed'), fv('bajajBoundarySouthActual')],
      ['West', fv('bajajBoundaryWestDeed'), fv('bajajBoundaryWestActual')]
    ];
    const cw = CONTENT_W;
    this.drawTable(bHeaders, bRows, [cw * 0.2, cw * 0.4, cw * 0.4], [], [0]);

    this.advanceCursor(4);
    this.drawKeyValueRow([
      { label: 'Boundary Matching (Yes/No)', value: fv('bajajBoundaryMatching') },
      { label: 'Property Identifiable', value: fv('bajajPropertyIdentifiable') }
    ]);
    this.drawSimpleRow('Approach Road Size', fv('bajajApproachRoadSize'));
  }

  // ── Section 5: Approval Details ──
  private drawBajajSection5() {
    const fv = this.fv.bind(this);

    this.drawKeyValueRow([
      { label: 'Sanctioned Plan Provided (Yes/No)', value: fv('bajajSanctionedPlanProvided') },
      { label: 'Layout Plan (Udable Sanction of No./Permit) No', value: fv('bajajLayoutPlanNo') }
    ]);
    this.drawSimpleRow('Construction Plan Details: Sanctioned No/Permit No.', fv('bajajConstructionPlanNo'));
    this.drawSimpleRow('Date of Sanction', fv('bajajDateOfSanction'));
    this.drawSimpleRow('Plan Validity', fv('bajajPlanValidity'));
    this.drawSimpleRow('Approving Authority', fv('bajajApprovingAuthority'));
    this.drawSimpleRow('Approved Category (Residential/Industrial/Commercial/Mixed)', fv('bajajApprovedCategory'));
    this.drawSimpleRow('Number of Floors in Building', fv('bajajNumberOfFloorsBuilding'));
  }

  // ── Section 6: Technical Details ──
  private drawBajajSection6() {
    const fv = this.fv.bind(this);

    // NDMA Parameters
    this.advanceCursor(4);
    this.drawSectionSubtitle('NDMA Parameters');
    
    const ndmaFields = [
      ['Nature of Building/Wing', 'bajajNatureOfBuilding', 'Plan Aspect Ratio', 'bajajPlanAspectRatio'],
      ['Structure Type (Load Bearing, RCC, Composite Structure, Others)', 'bajajStructureType', '', ''],
      ['Projected Parts', 'bajajProjectedParts', 'Type of Masonry', 'bajajTypeOfMasonry'],
      ['Roof Type', 'bajajRoofType', 'Steel Grade', 'bajajSteelGrade'],
      ['Concrete Grade', 'bajajConcreteGrade', 'Environment Exposure Condition', 'bajajEnvironmentExposure'],
      ['Seismic Zone', 'bajajSeismicZone', 'Soil Liquefable', 'bajajSoilLiquefable'],
      ['Vulnerable to Landslide', 'bajajVulnerableToLandslide', 'Flood Prone Area', 'bajajFloodProneArea']
    ];

    for (const [l1, k1, l2, k2] of ndmaFields) {
      if (l2) {
        this.drawKeyValueRow([
          { label: l1, value: fv(k1) },
          { label: l2, value: fv(k2) }
        ]);
      } else {
        this.drawSimpleRow(l1, fv(k1));
      }
    }

    this.advanceCursor(6);
    // Technical Details - Construction Quality etc.
    this.drawSectionSubtitle('Technical Details');
    
    this.drawKeyValueRow([
      { label: 'Construction Quality (Good/Avg/Poor/Luxury)', value: fv('bajajConstructionQuality') },
      { label: 'Lift Available (Yes/No)', value: fv('bajajLiftAvailable') }
    ]);
    this.drawKeyValueRow([
      { label: 'No. of Lifts', value: fv('bajajNoOfLifts') },
      { label: 'Separate Independent Access (Yes/No)', value: fv('bajajSeparateAccess') }
    ]);
    this.drawKeyValueRow([
      { label: 'Current Occupant of Property (Owner/Tenant/Vacant)', value: fv('bajajCurrentOccupant') },
      { label: 'No. of Storeys', value: fv('bajajNoOfStoreys') }
    ]);
    this.drawSimpleRow('Accommodation details / Floor wise and Occupancy', fv('bajajAccommodationDetails'));
  }

  // ── Section 7: Area & Floor Details ──
  private drawBajajSection7() {
    const fv = this.fv.bind(this);

    // Plot Area Details table
    this.drawSectionSubtitle('Plot Area Details');
    const paHeaders = ['', 'As Per Documents', 'As Per Plan', 'As Per Site Visit'];
    const paRows = [
      ['North to South', fv('bajajPlotNSDoc'), fv('bajajPlotNSPlan'), fv('bajajPlotNSSite')],
      ['East to West', fv('bajajPlotEWDoc'), fv('bajajPlotEWPlan'), fv('bajajPlotEWSite')],
      ['Land Area (sq. ft.)', fv('bajajLandAreaDoc'), fv('bajajLandAreaPlan'), fv('bajajLandAreaSite')]
    ];
    const cw = CONTENT_W;
    this.drawTable(paHeaders, paRows, [cw * 0.25, cw * 0.25, cw * 0.25, cw * 0.25], [], [0]);

    this.advanceCursor(6);

    // Floor-wise Area Breakup table
    this.drawSectionSubtitle('Floor wise Area Breakup');
    const fHeaders = ['Floor / BHK Details', 'No. of Rooms', 'No. of Kitchen', 'No. of Bathrooms', 'Sanctioned Usage', 'Actual Usage (Residential/Industrial/Commercial/Mixed Usage)'];
    const floorKeys = ['Ground', '1stFloor', '2ndFloor', '3rdFloor'];
    const floorLabels = ['Ground Floor', '1st Floor', '2nd Floor', '3rd Floor'];
    const fRows = floorKeys.map((fk, i) => [
      floorLabels[i],
      fv(`bajajFloor${fk}Rooms`),
      fv(`bajajFloor${fk}Kitchen`),
      fv(`bajajFloor${fk}Bathrooms`),
      fv(`bajajFloor${fk}SanctionedUsage`),
      fv(`bajajFloor${fk}ActualUsage`)
    ]);
    this.drawTable(fHeaders, fRows, [cw * 0.2, cw * 0.12, cw * 0.12, cw * 0.14, cw * 0.18, cw * 0.24], [], [0]);

    this.advanceCursor(6);

    // Rooms / Permissible Area table
    this.drawSectionSubtitle('Rooms');
    const rHeaders = ['', 'Permissible plan (Sq. Ft)', 'Land Component (Sq. Ft)', 'Permissible Rsd', 'Permissible construction as per RBI (Sq Ft)', 'Carpet Area as Per Document (BUA) (In Sq. Ft)', 'Actual construction (BUA) (In Sq. Ft)'];
    const rRows = [
      ['', fv('bajajPermissiblePlan'), fv('bajajLandComponent'), fv('bajajPermissibleRsd'), fv('bajajPermissibleRBI'), fv('bajajCarpetAreaDoc'), fv('bajajActualConstruction')]
    ];
    this.drawTable(rHeaders, rRows, [cw * 0.1, cw * 0.14, cw * 0.12, cw * 0.12, cw * 0.18, cw * 0.18, cw * 0.16], [], [0]);

    this.advanceCursor(6);

    // Risk, Status, Age
    this.drawSimpleRow('Risk of Deviations (High / Medium / Low)', fv('bajajRiskOfDeviations'));
    this.drawKeyValueRow([
      { label: 'Status of the Property (Flat/Under Construction/Complete/Construction on plot)', value: fv('bajajStatusOfProperty') },
      { label: '% Completed', value: fv('bajajPercentCompleted') }
    ]);
    this.drawKeyValueRow([
      { label: '% Disbursement Recommended', value: fv('bajajDisbursementRecommended') },
      { label: '', value: '' }
    ]);
    this.drawKeyValueRow([
      { label: 'Current Age of Property (IN YEAR)', value: fv('bajajCurrentAge') },
      { label: 'Residual Age', value: fv('bajajResidualAge') }
    ]);
  }

  // ── Section 8: Valuation Summary ──
  private drawBajajSection8() {
    const fv = this.fv.bind(this);

    // Main valuation table
    const vHeaders = ['Items', 'Area Details In Sq. Ft.', 'Rate per Sq. Ft.', 'Total Value In Rupees'];
    const vRows = [
      ['Land Value (as per RORL)', fv('bajajLandAreaSqft'), fv('bajajLandRatePerSqft'), fv('bajajLandTotalValue')],
      ['BUA Value (Measured BUA)', fv('bajajBUAAreaSqft'), fv('bajajBUARatePerSqft'), fv('bajajBUATotalValue')],
      ['Car Parking Charges', fv('bajajCarParkingArea'), fv('bajajCarParkingRate'), fv('bajajCarParkingValue')]
    ];
    const cw = CONTENT_W;
    this.drawTable(vHeaders, vRows, [cw * 0.28, cw * 0.22, cw * 0.22, cw * 0.28], [], [0]);

    this.advanceCursor(6);

    // Amenities / Other charges
    this.drawSectionSubtitle('Amenities/Other charges');
    this.drawSimpleRow('Amenities/Other charges', fv('bajajAmenitiesOtherCharges'));
    this.drawSimpleRow('Realizable value as on date', fv('bajajRealizableValue'));
    this.drawSimpleRow('Government Rates', fv('bajajGovernmentRates'));
    this.drawSimpleRow('Distressed / Forced Value', fv('bajajDistressedForcedValue'));
    this.drawSimpleRow('Valuation (Floor Rate)', fv('bajajValuationFloorRate'));
    this.drawSimpleRow('Valuation Methodology', fv('bajajValuationMethodology'));
    this.drawSimpleRow('Is Municipal / Development Authority Demolition List (Yes/No)', fv('bajajMunicipalDemolitionList'));
    this.drawSimpleRow('Is Property in Negative Area', fv('bajajPropertyInNegativeArea'));

    this.advanceCursor(6);
    this.drawSimpleRow('% Work completed', fv('bajajWorkCompleted'));
    this.drawSimpleRow('% Disbursement Recommended', fv('bajajDisbursementRecommendedVal'));
    this.drawSimpleRow('Current Value of the Property (Plot + construction)', fv('bajajCurrentValueOfProperty'));
    this.drawSimpleRow('Date of Property Visit', fv('bajajDateOfPropertyVisit'));
    this.drawSimpleRow('Valuation as per Government reckoner rates', fv('bajajValuationGovtReckoner'));
    this.drawSimpleRow('Distressed valuation of the Property', fv('bajajDistressedValuation'));
    this.drawSimpleRow('Rental value per month', fv('bajajRentalValuePerMonth'));
  }

  // ── Section 9: Remarks & Declaration ──
  private drawBajajSection9() {
    const fv = this.fv.bind(this);

    // Attachments
    this.drawSectionSubtitle('Attachment');
    this.drawSimpleRow('a. 4 photos of the Property from inside/outside are attached', 'Attached');
    this.drawSimpleRow('b. Location sketch for the property', 'Attached');

    this.advanceCursor(6);

    // Remarks
    this.drawSectionSubtitle('Remarks');
    this.drawSimpleRow('(Comment on - resistance for valuation if any from the current occupants for rented property, if the property falls in a community dominated areas, if the approach road to the property is not motorable, etc.)', fv('bajajRemarks'));

    this.advanceCursor(6);

    // Additional checks for Panchayat properties
    this.drawSectionSubtitle('Additional checks for Panchayat properties');
    const panchayatFields = [
      'Any well / Pond in the vicinity',
      'Power supply of surrounding area to property',
      'Distance from City centre (kms)',
      'Distance from Corporater/District/Tehsil/Bus station in case where there is no municipal body',
      'Electricity / GPH Supply',
      'Water supply',
      'Water Distribution',
      'Sewer line (Nala) attached for individual septic tank',
      'Any encroachment found in Nagar/Development / expansion',
    ];
    for (const label of panchayatFields) {
      this.drawKeyValueRow([
        { label, value: fv(`bajajPanchayat_${label.replace(/[^a-zA-Z0-9]/g, '')}`) },
      ]);
    }

    this.advanceCursor(6);

    // Declaration
    this.drawSectionSubtitle('Declaration');
    const declarations = [
      'The final valuation has been done/decided basis Land & Building Method as approved per policy and rates are cross-referred with the rates prevalent in the nearby/similar properties.',
      'We have no direct/indirect interest in the property valued.',
      'The information furnished in the report is true and correct to the best of the knowledge.'
    ];
    for (let i = 0; i < declarations.length; i++) {
      this.drawSimpleRow(`${i + 1}.`, declarations[i]);
    }

    this.advanceCursor(10);

    // Signature block
    this.drawSimpleRow('For Seal with Signature', '');
    this.drawSimpleRow('Date', fv('bajajSignatureDate'));
    this.drawSimpleRow('Place', fv('bajajSignaturePlace'));
  }
}

export default PDFBajajHousingRenderer;
