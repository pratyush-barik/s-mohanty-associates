/**
 * AdityaBirlaHousingPDF.ts -- Custom PDF generator for Aditya Birla Housing Finance Ltd (HL-LAP)
 *
 * Produces a bordered-cell, table-driven PDF layout matching
 * the bank's exact sample document format.
 */

import PDFBankRenderer, { CONTENT_W } from '@/lib/pdf-bank-renderer';

// Column width constants
const NUM_W = 30;
const LABEL_W = 150;

/** Helper: get field value with fallback */
function fv(fields: any, key: string, fallback = ''): string {
  const val = fields[key];
  if (val === undefined || val === null || val === '') return fallback;
  return String(val);
}

/**
 * Generate the complete custom PDF for Aditya Birla Housing Finance Ltd.
 */
export async function generateAdityaBirlaHousingPDF(
  fields: any,
  _letterheadBytes: Uint8Array | null,
  imageResults: (Uint8Array | null)[],
  fmtDate: (d: string) => string
): Promise<Uint8Array> {
  const r = new PDFBankRenderer();
  await r.init();

  // ====== TITLE BANNER ======
  r.drawSectionHeader('VALUATION REPORT FOR ADITYA BIRLA HOUSING FINANCE LTD');

  // ====== HEADER DETAILS TABLE ======
  const headerRows: [string, string, string, string][] = [
    ['Deal Number', fv(fields, 'dealNumber', fv(fields, 'loanApplicationNo')), 'Asset id', fv(fields, 'assetId', 'NA')],
    ['Branch Name', fv(fields, 'branchName', 'Bhubaneswar'), 'Type of Case', fv(fields, 'typeOfCase', 'Home Loan')],
    ['Valuer Name', fv(fields, 'valuerName', 'S Mohanty Associates'), 'Product Type', fv(fields, 'productType', 'Home Loan')],
    ['Valuer Ref No', fv(fields, 'valuerRefNo', fv(fields, 'refNo')), 'Date of Visit', fmtDate(fv(fields, 'dateOfVisit'))],
    ['Valuer Feedback', fv(fields, 'valuerFeedback', 'Positive'), 'Date of Report', fmtDate(fv(fields, 'dateOfReport'))],
  ];

  const labelW1 = 95;
  const colonW = 10;
  const valW1 = (CONTENT_W / 2) - labelW1 - colonW;
  const labelW2 = 90;
  const valW2 = (CONTENT_W / 2) - labelW2 - colonW;

  for (const [l1, v1, l2, v2] of headerRows) {
    r.drawKeyValueRow([
      { label: l1, value: ': ' + v1, labelWidth: labelW1, valueWidth: valW1 + colonW },
      { label: l2, value: ': ' + v2, labelWidth: labelW2, valueWidth: valW2 + colonW },
    ]);
  }

  // Contacted Person row (6 cells)
  r.drawKeyValueRow([
    { label: 'Contacted Person', value: fv(fields, 'contactedPerson', 'NA'), labelWidth: 95, valueWidth: 100 },
    { label: 'Relation with', value: fv(fields, 'relationWithCustomer', 'Customer'), labelWidth: 95, valueWidth: 55 },
    { label: 'Contact No', value: fv(fields, 'contactNo', 'NA'), labelWidth: 60, valueWidth: CONTENT_W - 95 - 100 - 95 - 55 - 60 },
  ]);

  // ====== BASIC DETAILS ======
  r.drawSectionHeader('BASIC DETAILS');

  // Field 1: Applicant Name(s)
  r.drawKeyValueRow([
    { label: '1', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Applicant Name(s)', value: fv(fields, 'ownerName', 'NA'), labelWidth: LABEL_W, valueWidth: CONTENT_W - NUM_W - LABEL_W },
  ]);

  // Field 2: Originally type of property + Current Usage
  const halfValW = (CONTENT_W - NUM_W - LABEL_W) / 2;
  const curUsageLblW = 90;
  const curUsageValW = halfValW - curUsageLblW;

  r.drawKeyValueRow([
    { label: '2', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Originally type of property', value: fv(fields, 'originallyTypeOfProperty', 'Residential'), labelWidth: LABEL_W, valueWidth: halfValW },
    { label: 'Current Usage', value: fv(fields, 'currentUsage', 'Residential Flat'), labelWidth: curUsageLblW, valueWidth: curUsageValW },
  ]);

  // Field 3: Address fields
  r.drawKeyValueRow([
    { label: '3', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Address as per request', value: fv(fields, 'addressAsPerRequest', fv(fields, 'ownerAddress', 'NA')), labelWidth: LABEL_W, valueWidth: CONTENT_W - NUM_W - LABEL_W },
  ]);

  r.drawSimpleRow('Address as per document', fv(fields, 'addressAsPerDocument', 'NA'));
  r.drawSimpleRow('Address as per Site', fv(fields, 'addressAsPerSite', ''));
  r.drawSimpleRow('Project/Colony/Layout Name', fv(fields, 'projectColonyLayoutName', ''));

  // Unit/Flat no with Floor No
  const unitLblW = Math.round(CONTENT_W * 0.30);
  const unitValW2 = Math.round(CONTENT_W * 0.20);
  const floorLblW = Math.round(CONTENT_W * 0.15);
  const floorValW = CONTENT_W - unitLblW - unitValW2 - floorLblW;

  r.drawKeyValueRow([
    { label: 'Unit/Flat no/ Bungalow/Plot/House no.', value: fv(fields, 'unitFlatBungalowPlotHouseNo', ''), labelWidth: unitLblW, valueWidth: unitValW2 },
    { label: 'Floor No', value: fv(fields, 'floorNo', ''), labelWidth: floorLblW, valueWidth: floorValW },
  ]);

  // Building Name + Wing Name
  const qW = Math.round(CONTENT_W * 0.25);
  r.drawKeyValueRow([
    { label: 'Building Name', value: fv(fields, 'buildingName', ''), labelWidth: qW, valueWidth: qW },
    { label: 'Wing Name', value: fv(fields, 'wingName', ''), labelWidth: qW, valueWidth: CONTENT_W - qW * 3 },
  ]);

  r.drawSimpleRow('S.No/G.No/Khasra No', fv(fields, 'khasraNo', ''));
  r.drawSimpleRow('Close Vicinity/Landmark', fv(fields, 'closeVicinityLandmark', ''));

  r.drawKeyValueRow([
    { label: 'Street Name', value: fv(fields, 'streetName', ''), labelWidth: qW, valueWidth: qW },
    { label: 'Village Name', value: fv(fields, 'villageName', ''), labelWidth: qW, valueWidth: CONTENT_W - qW * 3 },
  ]);

  r.drawKeyValueRow([
    { label: 'City', value: fv(fields, 'city', ''), labelWidth: qW, valueWidth: qW },
    { label: 'State', value: fv(fields, 'stateName', fv(fields, 'state', 'Odisha')), labelWidth: qW, valueWidth: CONTENT_W - qW * 3 },
  ]);

  r.drawKeyValueRow([
    { label: 'Main Locality of the Property', value: fv(fields, 'mainLocalityOfProperty', ''), labelWidth: Math.round(CONTENT_W * 0.30), valueWidth: Math.round(CONTENT_W * 0.20) },
    { label: 'Sub Locality', value: fv(fields, 'subLocality', ''), labelWidth: Math.round(CONTENT_W * 0.20), valueWidth: CONTENT_W - Math.round(CONTENT_W * 0.70) },
  ]);

  r.drawSimpleRow('Pin code of the Property', fv(fields, 'pinCodeOfProperty', ''));

  r.drawKeyValueRow([
    { label: 'Latitude', value: fv(fields, 'latitude', ''), labelWidth: qW, valueWidth: qW },
    { label: 'Longitude', value: fv(fields, 'longitude', ''), labelWidth: qW, valueWidth: CONTENT_W - qW * 3 },
  ]);

  // Field 4
  r.drawKeyValueRow([
    { label: '4', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Has the valuator valued this property before, If yes, when, for whom', value: fv(fields, 'valuedBefore', 'No'), labelWidth: CONTENT_W - NUM_W - 60, valueWidth: 60 },
  ]);

  if (fv(fields, 'valuedBefore') === 'Yes' && fv(fields, 'valuedBeforeDetails')) {
    r.drawSimpleRow('Details', fv(fields, 'valuedBeforeDetails'));
  }

  // ====== SURROUNDING & LOCALITY DETAILS ======
  r.drawSectionHeader('SURROUNDING & LOCALITY DETAILS');

  const locLblW = Math.round(CONTENT_W * 0.15);
  const locSubLblW = Math.round(CONTENT_W * 0.45);
  const locValW = CONTENT_W - locLblW - locSubLblW;

  r.drawKeyValueRow([
    { label: '5', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Location', value: '', labelWidth: locLblW - NUM_W, valueWidth: 0 },
    { label: 'Type (Comm, Res, Ind, Mix)', value: fv(fields, 'locationType', 'Residential'), labelWidth: locSubLblW, valueWidth: locValW },
  ]);

  for (const [label, value] of [
    ['Locality (Low, Medium, Posh)', fv(fields, 'localityLevel', 'Medium')],
    ['Site is (Dev, Under Dev, Developing)', fv(fields, 'siteDevStatus', 'Developed')],
    ['Proximity to civic amenities/public transport', fv(fields, 'proximityToCivicAmenities', 'Good')],
    ['Railway Station', fv(fields, 'railwayStationDistance', '')],
    ['Bus Stop', fv(fields, 'busStopDistance', '')],
  ]) {
    r.drawKeyValueRow([
      { label: '', value: '', labelWidth: locLblW, valueWidth: 0 },
      { label, value, labelWidth: locSubLblW, valueWidth: locValW },
    ]);
  }

  const wideLabel = LABEL_W + 80;
  const wideVal = CONTENT_W - NUM_W - wideLabel;

  r.drawKeyValueRow([
    { label: '6', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Distance from City Centre', value: fv(fields, 'distanceFromCityCentre', ''), labelWidth: wideLabel, valueWidth: wideVal - 40 },
    { label: 'Km', value: '', labelWidth: 40, valueWidth: 0 },
  ]);

  r.drawKeyValueRow([
    { label: '7', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Nature of approach Road', value: fv(fields, 'natureOfApproachRoad', 'Bitumen Road'), labelWidth: wideLabel, valueWidth: wideVal },
  ]);

  r.drawKeyValueRow([
    { label: '8', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Approach Road width', value: fv(fields, 'approachRoadWidth', ''), labelWidth: wideLabel, valueWidth: wideVal - 40 },
    { label: 'Feet', value: '', labelWidth: 40, valueWidth: 0 },
  ]);

  r.drawKeyValueRow([
    { label: '9', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Approach to the property as per Site', value: fv(fields, 'approachAsPerSite', 'Clear'), labelWidth: wideLabel, valueWidth: wideVal },
  ]);

  r.drawKeyValueRow([
    { label: '10', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Approach to the property as per Docs', value: fv(fields, 'approachAsPerDocs', 'Clear'), labelWidth: wideLabel, valueWidth: wideVal },
  ]);

  r.drawKeyValueRow([
    { label: '11', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Any observation which affects the security', value: fv(fields, 'securityObservation', 'NA'), labelWidth: wideLabel, valueWidth: wideVal },
  ]);

  // ====== PROPERTY DETAILS ======
  r.drawSectionHeader('PROPERTY DETAILS');

  const propNumW = NUM_W;
  const propLblW = 120;
  const propSubLblW = 150;
  const propValW = CONTENT_W - propNumW - propLblW - propSubLblW;

  // Field 12: Occupant
  r.drawKeyValueRow([
    { label: '12', value: '', labelWidth: propNumW, valueWidth: 0 },
    { label: 'Occupant', value: '', labelWidth: propLblW, valueWidth: 0 },
    { label: 'Occupied By', value: fv(fields, 'occupiedBy', 'Vacant'), labelWidth: propSubLblW, valueWidth: propValW },
  ]);

  for (const [lbl, key, def] of [['Name of Occupant', 'nameOfOccupant', 'NA'], ['No of Tenants', 'noOfTenants', 'NA'], ['Relation with applicant', 'relationWithApplicant', 'NA']] as [string, string, string][]) {
    r.drawKeyValueRow([
      { label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 },
      { label: lbl, value: fv(fields, key, def), labelWidth: propSubLblW, valueWidth: propValW },
    ]);
  }

  // Field 13: Building details
  r.drawKeyValueRow([
    { label: '13', value: '', labelWidth: propNumW, valueWidth: 0 },
    { label: 'Building details', value: '', labelWidth: propLblW, valueWidth: 0 },
    { label: 'Property Demarcation', value: fv(fields, 'propertyDemarcation', 'Yes'), labelWidth: propSubLblW, valueWidth: propValW },
  ]);

  for (const [lbl, key, def] of [['Property Identified (Y/N)', 'propertyIdentifiedYN', 'Yes'], ['Property Identified through', 'propertyIdentifiedThrough', ''], ['Type of structure', 'typeOfStructure', 'R.C.C']] as [string, string, string][]) {
    r.drawKeyValueRow([
      { label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 },
      { label: lbl, value: fv(fields, key, def), labelWidth: propSubLblW, valueWidth: propValW },
    ]);
  }

  const areaValW2 = propValW / 2;
  r.drawKeyValueRow([
    { label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 },
    { label: 'Land/Plot Area -UDS', value: fv(fields, 'landPlotAreaUDS', ''), labelWidth: propSubLblW, valueWidth: areaValW2 },
    { label: 'Sqft', value: '', labelWidth: areaValW2, valueWidth: 0 },
  ]);

  for (const [lbl, key, def] of [['No of Blocks', 'noOfBlocks', '0'], ['No of Units on each floor', 'noOfUnitsOnEachFloor', '0'], ['No. of Floors', 'noOfFloors', ''], ['No. of Lifts', 'noOfLifts', ''], ['Amenities Available', 'amenitiesAvailable', 'Yes'], ['Delivery Agency', 'deliveryAgency', '']] as [string, string, string][]) {
    r.drawKeyValueRow([
      { label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 },
      { label: lbl, value: fv(fields, key, def), labelWidth: propSubLblW, valueWidth: propValW },
    ]);
  }

  // Field 14: Unit details
  r.drawKeyValueRow([
    { label: '14', value: '', labelWidth: propNumW, valueWidth: 0 },
    { label: 'Unit details', value: '', labelWidth: propLblW, valueWidth: 0 },
    { label: 'Property located on Floor', value: fv(fields, 'propertyLocatedOnFloor', ''), labelWidth: propSubLblW, valueWidth: propValW },
  ]);

  r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: 'Unit Configuration', value: fv(fields, 'unitConfiguration', ''), labelWidth: propSubLblW, valueWidth: propValW }]);
  r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: 'Carpet area', value: fv(fields, 'carpetArea', ''), labelWidth: propSubLblW, valueWidth: areaValW2 }, { label: 'Sqft', value: '', labelWidth: areaValW2, valueWidth: 0 }]);
  r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: 'SBUA of', value: fv(fields, 'sbuaOf', ''), labelWidth: propSubLblW, valueWidth: areaValW2 }, { label: 'Sqft', value: '', labelWidth: areaValW2, valueWidth: 0 }]);
  r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: 'View from property', value: fv(fields, 'viewFromProperty', 'Good'), labelWidth: propSubLblW, valueWidth: propValW }]);

  // Field 15: Construction Quality
  r.drawKeyValueRow([
    { label: '15', value: '', labelWidth: propNumW, valueWidth: 0 },
    { label: 'Construction Quality (Good/Avg/Bad)', value: '', labelWidth: 200, valueWidth: 0 },
    { label: 'Exteriors', value: fv(fields, 'constructionQualityExteriors', 'Good'), labelWidth: 60, valueWidth: (CONTENT_W - propNumW - 200 - 120) / 2 },
    { label: 'Interiors', value: fv(fields, 'constructionQualityInteriors', 'Good'), labelWidth: 60, valueWidth: (CONTENT_W - propNumW - 200 - 120) / 2 },
  ]);

  // Field 16: Age
  r.drawKeyValueRow([
    { label: '16', value: '', labelWidth: propNumW, valueWidth: 0 },
    { label: 'Age of the property (Yrs)', value: fv(fields, 'ageOfProperty', ''), labelWidth: 200, valueWidth: 60 },
    { label: 'Residual age (Yrs)', value: fv(fields, 'residualAge', ''), labelWidth: 110, valueWidth: CONTENT_W - propNumW - 200 - 60 - 110 },
  ]);

  // ====== SANCTION PLAN APPROVAL ======
  r.drawSectionHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS');

  r.drawKeyValueRow([{ label: '17', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Sanction Plan Available', value: fv(fields, 'sanctionPlanAvailable', 'NA'), labelWidth: wideLabel, valueWidth: wideVal }]);

  // Field 18: Documents table
  const descW = 100;
  const approvalNoW = 75;
  const dateApprovalW = 90;
  const expiryW = 75;
  const sanctAuthW = CONTENT_W - NUM_W - descW - approvalNoW - dateApprovalW - expiryW;

  r.drawTable(
    ['18', 'Description', 'Approval No', 'Date of Approval', 'Expiry Date', 'Sanctioning Authority'],
    [
      ['', 'Layout Plan', fv(fields, 'layoutPlanApprovalNo', 'N.A'), fv(fields, 'layoutPlanDateOfApproval', 'N.A'), fv(fields, 'layoutPlanExpiryDate', 'N.A'), fv(fields, 'layoutPlanSanctioningAuthority', 'N.A')],
      ['', 'Building Plan', fv(fields, 'buildingPlanApprovalNo', ''), fv(fields, 'buildingPlanDateOfApproval', ''), fv(fields, 'buildingPlanExpiryDate', 'N.A'), fv(fields, 'buildingPlanSanctioningAuthority', '')],
      ['', 'Construction Permission', fv(fields, 'constructionPermissionApprovalNo', 'N.A'), fv(fields, 'constructionPermissionDateOfApproval', 'N.A'), fv(fields, 'constructionPermissionExpiryDate', 'N.A'), fv(fields, 'constructionPermissionSanctioningAuthority', 'N.A')],
      ['', 'Construction Certificate', fv(fields, 'constructionCertificateApprovalNo', 'N.A'), fv(fields, 'constructionCertificateDateOfApproval', 'N.A'), fv(fields, 'constructionCertificateExpiryDate', 'N.A'), fv(fields, 'constructionCertificateSanctioningAuthority', '')],
    ],
    [NUM_W, descW, approvalNoW, dateApprovalW, expiryW, sanctAuthW],
    [],
    [0, 1]
  );

  r.drawKeyValueRow([{ label: '19', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Construction commencement date', value: fv(fields, 'constructionCommencementDate', ''), labelWidth: 200, valueWidth: 60 }, { label: 'Expected Completion Date', value: fv(fields, 'expectedCompletionDate', ''), labelWidth: 110, valueWidth: CONTENT_W - NUM_W - 200 - 60 - 110 }]);
  r.drawKeyValueRow([{ label: '20', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Ownership Type (Free / Lease Hold)', value: fv(fields, 'ownershipType', 'FREEHOLD'), labelWidth: wideLabel, valueWidth: wideVal }]);
  r.drawKeyValueRow([{ label: '21', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Property documents verification details', value: fv(fields, 'propertyDocsVerification', ''), labelWidth: wideLabel, valueWidth: wideVal }]);
  r.drawKeyValueRow([{ label: '22', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Property Jurisdiction', value: fv(fields, 'propertyJurisdiction', ''), labelWidth: wideLabel, valueWidth: wideVal }]);
  r.drawKeyValueRow([{ label: '23', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Permissible zoning as per master plan', value: fv(fields, 'permissibleZoning', ''), labelWidth: 200, valueWidth: 80 }, { label: 'Usage As per Site', value: fv(fields, 'usageAsPerSite', ''), labelWidth: 100, valueWidth: CONTENT_W - NUM_W - 200 - 80 - 100 }]);

  // ====== SETBACKS & BUA ======
  r.drawKeyValueRow([{ label: '24', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Whether property under demolition list as per authority (Y/N)', value: fv(fields, 'demolitionList', 'No'), labelWidth: CONTENT_W - NUM_W - 60, valueWidth: 60 }]);

  const setbackCol1 = 120;
  const setbackCol2 = (CONTENT_W - NUM_W - setbackCol1) / 2;
  const setbackCol3 = CONTENT_W - NUM_W - setbackCol1 - setbackCol2;

  r.drawTable(['', 'Setbacks (Fts)', 'As per plan/ Byelaws (Fts)', 'As per site (Fts)'],
    [['', 'Front', fv(fields, 'setbackFrontPlan', 'N.A'), fv(fields, 'setbackFrontSite', 'N.A')], ['', 'Side1(Left)', fv(fields, 'setbackSide1Plan', 'N.A'), fv(fields, 'setbackSide1Site', 'N.A')], ['25', 'Side2(Right)', fv(fields, 'setbackSide2Plan', 'N.A'), fv(fields, 'setbackSide2Site', 'N.A')], ['', 'Rear', fv(fields, 'setbackRearPlan', 'N.A'), fv(fields, 'setbackRearSite', 'N.A')]],
    [NUM_W, setbackCol1, setbackCol2, setbackCol3], [], [0, 1]);

  r.drawSimpleRow('BUA Area (In Sqft.)', '');

  const buaCol1 = 120;
  const buaCol2 = (CONTENT_W - NUM_W - buaCol1) / 2;
  const buaCol3 = CONTENT_W - NUM_W - buaCol1 - buaCol2;
  const buaRows: string[][] = [];
  const f1Name = fv(fields, 'buaFloor1Name', 'First');
  if (f1Name) buaRows.push(['', f1Name, fv(fields, 'buaFloor1Plan', 'N.A'), fv(fields, 'buaFloor1Site', 'N.A')]);
  const f2Name = fv(fields, 'buaFloor2Name', '');
  if (f2Name) buaRows.push(['', f2Name, fv(fields, 'buaFloor2Plan', 'N.A'), fv(fields, 'buaFloor2Site', 'N.A')]);
  const f3Name = fv(fields, 'buaFloor3Name', '');
  if (f3Name) buaRows.push(['', f3Name, fv(fields, 'buaFloor3Plan', 'N.A'), fv(fields, 'buaFloor3Site', 'N.A')]);
  buaRows.push(['', 'Total BUA (In Sft.)', fv(fields, 'totalBuaPlan', 'N.A'), fv(fields, 'totalBuaSite', 'N.A')]);

  r.drawTable(['26', 'Floor', 'As per plan/ Byelaws (Sft)', 'As per site (Sft)'], buaRows, [NUM_W, buaCol1, buaCol2, buaCol3], [], [0, 1]);

  // ====== VALUATION DETAILS ======
  r.drawSectionHeader('VALUATION DETAILS');
  r.drawSimpleRow('(A)Description of Land & Constructed Area and Rates', '');
  r.drawSimpleRow('Property Type: ' + fv(fields, 'propertyTypeBungalow', 'Bungalow'), '');

  const valDescW2 = 100; const valUnitW = 90; const valAreaW = 60; const valRateW = 70;
  const valAmtW = CONTENT_W - valDescW2 - valUnitW - valAreaW - valRateW;

  r.drawTable(['Description', 'Unit of Measurement', 'Area', 'Rate/unit', 'Amount'],
    [['Land Area', fv(fields, 'landAreaMeasurement', 'Sqft'), fv(fields, 'landAreaValue', '0'), fv(fields, 'landAreaRatePerUnit', '0'), fv(fields, 'landAreaAmount', '0')],
     ['Parking/Stilt BUA', fv(fields, 'parkingStiltBuaUnit', 'Sqft'), fv(fields, 'parkingStiltBuaArea', '0'), fv(fields, 'parkingStiltBuaRate', '0'), fv(fields, 'parkingStiltBuaAmount', '0')],
     ['BUA/SBUA', fv(fields, 'buaSbuaUnit', 'Sqft'), fv(fields, 'buaSbuaArea', ''), fv(fields, 'buaSbuaRate', ''), fv(fields, 'buaSbuaAmount', '')]],
    [valDescW2, valUnitW, valAreaW, valRateW, valAmtW], [4], [0]);

  r.drawSimpleRow('Construction Progress', fv(fields, 'constructionProgress', 'Complete in all respect'));

  r.drawKeyValueRow([{ label: '27', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: '% Completion', value: fv(fields, 'percentCompletion', '100'), labelWidth: 130, valueWidth: 40 }, { label: '% Recommendation', value: fv(fields, 'percentRecommendation', '100'), labelWidth: 130, valueWidth: CONTENT_W - NUM_W - 130 - 40 - 130 }]);

  r.drawSimpleRow('(B)Value of Extra Amenities if applicable', '');

  for (const [label, value] of [['No of Car Parks', fv(fields, 'noOfCarParks', '0')], ['Car Parking Charges Lumpsum (INR)', fv(fields, 'carParkingCharges', '0')], ['EDC,IDC Lumpsum(INR)', fv(fields, 'edcIdcLumpsum', '0')], ['PLC Charges Lumpsum(INR)', fv(fields, 'plcChargesLumpsum', '0')], ['Power Backup', fv(fields, 'powerBackup', '0')], ['Interiors/Amenities', fv(fields, 'interiorsAmenities', '0')], ['Interiors % completion', fv(fields, 'interiorsPercentCompletion', '0')]]) {
    r.drawSimpleRow(label, value);
  }

  for (const [label, value] of [['Total of Component A on Completion', fv(fields, 'totalComponentA', '')], ['Total of Component B on Completion', fv(fields, 'totalComponentB', '0')], ['Total Market Value of Property on Completion (A+B) 100%', fv(fields, 'totalMarketValueOnCompletion', '')], ['Total Market Value of Property on Completion in Words 100%', fv(fields, 'totalMarketValueOnCompletionWords', '')], ['Total Market Value of Property as on Date (95%)', fv(fields, 'totalMarketValueAsOnDate', '')], ['Guideline Value of The Property', fv(fields, 'guidelineValueOfProperty', 'NA')], ['Distress Sale Value as on date', fv(fields, 'distressSaleValue', '')], ['Approx. Rentals in case of 100% complete property', fv(fields, 'approxRentals', '')]]) {
    r.drawKeyValueRow([{ label, value, labelWidth: Math.round(CONTENT_W * 0.65), valueWidth: Math.round(CONTENT_W * 0.35), bold: true }]);
  }

  // ====== BOUNDARIES ======
  r.drawSectionHeader('BOUNDARIES');
  const bndCol1 = 120; const bndDirW = (CONTENT_W - bndCol1) / 4;

  r.drawTable(['Boundaries', 'North', 'East', 'South', 'West'],
    [['As per Docs', fv(fields, 'boundaryDocsNorth', 'NA'), fv(fields, 'boundaryDocsEast', 'NA'), fv(fields, 'boundaryDocsSouth', 'NA'), fv(fields, 'boundaryDocsWest', 'NA')],
     ['As per Approved plan key map', fv(fields, 'boundaryApprovedNorth', ''), fv(fields, 'boundaryApprovedEast', ''), fv(fields, 'boundaryApprovedSouth', ''), fv(fields, 'boundaryApprovedWest', '')]],
    [bndCol1, bndDirW, bndDirW, bndDirW, bndDirW], [], [0]);

  r.drawTable([], [['28', 'At site', fv(fields, 'boundaryAtSiteNorth', ''), fv(fields, 'boundaryAtSiteEast', ''), fv(fields, 'boundaryAtSiteSouth', ''), fv(fields, 'boundaryAtSiteWest', '')]],
    [NUM_W, bndCol1 - NUM_W, bndDirW, bndDirW, bndDirW, bndDirW], [], [0, 1]);

  r.drawSimpleRow('Boundaries Matching', fv(fields, 'boundariesMatching', 'Yes as per Approved plan key map.'));

  // ====== REMARKS & DECLARATION ======
  r.drawRemarksBox('Remarks-:', fv(fields, 'remarksText', fv(fields, 'remarks', '')));
  r.drawRemarksBox('Declaration-:', fv(fields, 'declarationText', 'We hereby declare that we have no direct or indirect interest in the valued and the information furnished in the report is true and correct to the best of my knowledge of belief.'));

  r.drawKeyValueRow([{ label: 'Name of Engineer who visited the property-:', value: '(Authorized Signatory)', labelWidth: Math.round(CONTENT_W * 0.60), valueWidth: Math.round(CONTENT_W * 0.40) }]);

  // ====== PROPERTY PHOTOGRAPHS ======
  if (imageResults && imageResults.length > 0) {
    const validPhotos = imageResults
      .map((bytes, idx) => ({ bytes: bytes!, label: (fields.propertyImageNames && fields.propertyImageNames[idx]) || '' }))
      .filter(p => p.bytes && p.bytes.length > 0);
    if (validPhotos.length > 0) {
      await r.drawPhotoGrid(validPhotos, 'Property Photographs');
    }
  }

  // ====== FINALIZE ======
  return await r.save();
}
