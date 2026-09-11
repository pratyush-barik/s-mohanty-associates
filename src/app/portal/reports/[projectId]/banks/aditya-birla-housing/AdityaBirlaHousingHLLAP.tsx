'use client';

import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig, normalizeMapImages } from '@/lib/bank-fields';
import { PDFAdityaBirlaHousingRenderer, HLLAPReportFields } from '@/lib/banks/pdf-aditya-birla-housing-renderer';
import { rgb } from 'pdf-lib';
import { CONTENT_W, MARGIN_L, fetchBytes } from '@/lib/pdf-bank-renderer';


/** Helper: get field value with fallback */
function fv(fields: any, key: string, fallback = ''): string {
  const val = fields[key];
  if (val === undefined || val === null || val === '') return fallback;
  return String(val);
}

// Column width constants for PDF layout
const NUM_W = 30;
const LABEL_W = 150;

/**
 * Generate the complete custom PDF for Aditya Birla Housing Finance Ltd.
 * Uses PDFAdityaBirlaHousingRenderer (extends PDFBankRenderer).
 * Architecture: Same two-file pattern as MLAP, STSL, Annapurna.
 */
async function generateHLLAPPDF(
  fields: any,
  _letterheadBytes: Uint8Array | null,
  imageResults: (Uint8Array | null)[],
  fmtDate: (d: string) => string
): Promise<Uint8Array> {
  const r = new PDFAdityaBirlaHousingRenderer();
  await r.init();

  // ====== TITLE BANNER ======
  r.drawCustomTitleBanner('VALUATION REPORT FOR ADITYA BIRLA HOUSING FINANCE LTD');

  // ====== HEADER DETAILS TABLE ======
  const headerRows: [string, string, string, string][] = [
    ['Deal Number', fv(fields, 'dealNumber', fv(fields, 'loanApplicationNo')), 'Asset id', fv(fields, 'assetId', 'NA')],
    ['Branch Name', fv(fields, 'branchName', 'Bhubaneswar'), 'Type of Case', fv(fields, 'typeOfCase', 'Home Loan')],
    ['Valuer Name', fv(fields, 'valuerName', 'S Mohanty Associates'), 'Product Type', fv(fields, 'productType', 'Home Loan')],
    ['Valuer Ref No', fv(fields, 'valuerRefNo', fv(fields, 'refNo')), 'Date of Visit', fmtDate(fv(fields, 'dateOfVisit'))],
    ['Valuer Feedback', fv(fields, 'valuerFeedback', 'Positive'), 'Date of Report', fmtDate(fv(fields, 'dateOfReport'))],
  ];

  const labelW1 = 95;
  const valW1 = (CONTENT_W / 2) - labelW1;
  const labelW2 = 90;
  const valW2 = (CONTENT_W / 2) - labelW2;

  for (const [l1, v1, l2, v2] of headerRows) {
    r.drawKeyValueRow([
      { label: l1, value: v1, labelWidth: labelW1, valueWidth: valW1 },
      { label: l2, value: v2, labelWidth: labelW2, valueWidth: valW2 },
    ]);
  }

  // Contacted Person row
  r.drawKeyValueRow([
    { label: 'Contacted Person', value: fv(fields, 'contactedPerson', 'NA'), labelWidth: 95, valueWidth: 100 },
    { label: 'Relation with', value: fv(fields, 'relationWithCustomer', 'Customer'), labelWidth: 95, valueWidth: 55 },
    { label: 'Contact No', value: fv(fields, 'contactNo', 'NA'), labelWidth: 60, valueWidth: CONTENT_W - 95 - 100 - 95 - 55 - 60 },
  ]);

  // ====== BASIC DETAILS ======
  r.drawSectionHeader('BASIC DETAILS');

  const vW = CONTENT_W - NUM_W - LABEL_W; // Full value width
  const halfVW = vW / 2; // Half value width
  const subLblW = 80; // Fixed width for right-side sub-labels

  r.drawKeyValueRow([
    { label: '1', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Applicant Name(s)', value: fv(fields, 'ownerName', 'NA'), labelWidth: LABEL_W, valueWidth: vW },
  ]);

  r.drawKeyValueRow([
    { label: '2', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Originally type of property', value: fv(fields, 'originallyTypeOfProperty', 'Residential'), labelWidth: LABEL_W, valueWidth: halfVW },
    { label: 'Current Usage', value: fv(fields, 'currentUsage', 'Residential Flat'), labelWidth: subLblW, valueWidth: halfVW - subLblW },
  ]);

  r.drawKeyValueRow([
    { label: '3', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Address as per request', value: fv(fields, 'addressAsPerRequest', fv(fields, 'ownerAddress', 'NA')), labelWidth: LABEL_W, valueWidth: vW },
  ]);

  for (const [lbl, key] of [
    ['Address as per document', 'addressAsPerDocument'],
    ['Address as per Site', 'addressAsPerSite'],
    ['Project/Colony/Layout Name', 'projectColonyLayoutName']
  ]) {
    r.drawKeyValueRow([
      { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
      { label: lbl, value: fv(fields, key, key === 'addressAsPerDocument' ? 'NA' : ''), labelWidth: LABEL_W, valueWidth: vW },
    ]);
  }

  r.drawKeyValueRow([
    { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Unit/Flat no/ Bungalow/Plot/House no.', value: fv(fields, 'unitFlatBungalowPlotHouseNo', ''), labelWidth: LABEL_W, valueWidth: halfVW },
    { label: 'Floor No', value: fv(fields, 'floorNo', ''), labelWidth: subLblW, valueWidth: halfVW - subLblW },
  ]);

  r.drawKeyValueRow([
    { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Building Name', value: fv(fields, 'buildingName', ''), labelWidth: LABEL_W, valueWidth: halfVW },
    { label: 'Wing Name', value: fv(fields, 'wingName', ''), labelWidth: subLblW, valueWidth: halfVW - subLblW },
  ]);

  for (const [lbl, key] of [
    ['S.No/G.No/Khasra No', 'khasraNo'],
    ['Close Vicinity/Landmark', 'closeVicinityLandmark']
  ]) {
    r.drawKeyValueRow([
      { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
      { label: lbl, value: fv(fields, key, ''), labelWidth: LABEL_W, valueWidth: vW },
    ]);
  }

  r.drawKeyValueRow([
    { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Street Name', value: fv(fields, 'streetName', ''), labelWidth: LABEL_W, valueWidth: halfVW },
    { label: 'Village Name', value: fv(fields, 'villageName', ''), labelWidth: subLblW, valueWidth: halfVW - subLblW },
  ]);

  r.drawKeyValueRow([
    { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'City', value: fv(fields, 'city', ''), labelWidth: LABEL_W, valueWidth: halfVW },
    { label: 'State', value: fv(fields, 'stateName', fv(fields, 'state', 'Odisha')), labelWidth: subLblW, valueWidth: halfVW - subLblW },
  ]);

  r.drawKeyValueRow([
    { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Main Locality of the Property', value: fv(fields, 'mainLocalityOfProperty', ''), labelWidth: LABEL_W, valueWidth: halfVW },
    { label: 'Sub Locality', value: fv(fields, 'subLocality', ''), labelWidth: subLblW, valueWidth: halfVW - subLblW },
  ]);

  r.drawKeyValueRow([
    { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Pin code of the Property', value: fv(fields, 'pinCodeOfProperty', ''), labelWidth: LABEL_W, valueWidth: vW },
  ]);

  r.drawKeyValueRow([
    { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Latitude', value: fv(fields, 'latitude', ''), labelWidth: LABEL_W, valueWidth: halfVW },
    { label: 'Longitude', value: fv(fields, 'longitude', ''), labelWidth: subLblW, valueWidth: halfVW - subLblW },
  ]);

  r.drawKeyValueRow([
    { label: '4', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Has the valuator valued this property before, If yes, when, for whom', value: fv(fields, 'valuedBefore', 'No'), labelWidth: CONTENT_W - NUM_W - 60, valueWidth: 60 },
  ]);

  if (fv(fields, 'valuedBefore') === 'Yes' && fv(fields, 'valuedBeforeDetails')) {
    r.drawKeyValueRow([
      { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
      { label: 'Details', value: fv(fields, 'valuedBeforeDetails'), labelWidth: LABEL_W, valueWidth: vW },
    ]);
  }

  // ====== SURROUNDING & LOCALITY DETAILS ======
  r.drawSectionHeader('SURROUNDING & LOCALITY DETAILS');

  const locSubLblW = (CONTENT_W - NUM_W - LABEL_W) / 2 + 50;
  const locValW = CONTENT_W - NUM_W - LABEL_W - locSubLblW;

  r.drawKeyValueRow([
    { label: '5', value: '', labelWidth: NUM_W, valueWidth: 0 },
    { label: 'Location', value: '', labelWidth: LABEL_W, valueWidth: 0 },
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
      { label: '', value: '', labelWidth: NUM_W, valueWidth: 0 },
      { label: '', value: '', labelWidth: LABEL_W, valueWidth: 0 },
      { label, value, labelWidth: locSubLblW, valueWidth: locValW },
    ]);
  }

  r.drawKeyValueRow([{ label: '6', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Distance from City Centre', value: fv(fields, 'distanceFromCityCentre', ''), labelWidth: LABEL_W, valueWidth: vW }]);
  r.drawKeyValueRow([{ label: '7', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Nature of approach Road', value: fv(fields, 'natureOfApproachRoad', 'Bitumen Road'), labelWidth: LABEL_W, valueWidth: vW }]);
  r.drawKeyValueRow([{ label: '8', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Approach Road width', value: fv(fields, 'customApproachRoadWidth', ''), labelWidth: LABEL_W, valueWidth: vW }]);
  r.drawKeyValueRow([{ label: '9', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Approach to the property as per Site', value: fv(fields, 'approachAsPerSite', 'Clear'), labelWidth: LABEL_W, valueWidth: vW }]);
  r.drawKeyValueRow([{ label: '10', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Approach to the property as per Docs', value: fv(fields, 'approachAsPerDocs', 'Clear'), labelWidth: LABEL_W, valueWidth: vW }]);
  r.drawKeyValueRow([{ label: '11', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Any observation which affects the security', value: fv(fields, 'securityObservation', 'NA'), labelWidth: LABEL_W, valueWidth: vW }]);

  // ====== PROPERTY DETAILS ======
  r.drawSectionHeader('PROPERTY DETAILS');

  const propNumW = NUM_W;
  const propLblW = 120;
  const propSubLblW = 150;
  const propValW = CONTENT_W - propNumW - propLblW - propSubLblW;

  r.drawKeyValueRow([{ label: '12', value: '', labelWidth: propNumW, valueWidth: 0 }, { label: 'Occupant', value: '', labelWidth: propLblW, valueWidth: 0 }, { label: 'Name of Occupant', value: fv(fields, 'nameOfOccupant', 'NA'), labelWidth: propSubLblW, valueWidth: propValW }]);

  for (const [lbl, key, def] of [['No of Tenants', 'noOfTenants', 'NA'], ['Relation with applicant', 'relationWithApplicant', 'NA']] as [string, string, string][]) {
    r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: lbl, value: fv(fields, key, def), labelWidth: propSubLblW, valueWidth: propValW }]);
  }

  r.drawKeyValueRow([{ label: '13', value: '', labelWidth: propNumW, valueWidth: 0 }, { label: 'Building details', value: '', labelWidth: propLblW, valueWidth: 0 }, { label: 'Property Demarcation', value: fv(fields, 'propertyDemarcation', 'Yes'), labelWidth: propSubLblW, valueWidth: propValW }]);

  for (const [lbl, key, def] of [['Property Identified (Y/N)', 'propertyIdentifiedYN', 'Yes'], ['Property Identified through', 'propertyIdentifiedThrough', ''], ['Type of structure', 'typeOfStructure', 'R.C.C']] as [string, string, string][]) {
    r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: lbl, value: fv(fields, key, def), labelWidth: propSubLblW, valueWidth: propValW }]);
  }

  const areaValW2 = propValW / 2;
  r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: 'Land/Plot Area -UDS', value: fv(fields, 'landPlotAreaUDS', ''), labelWidth: propSubLblW, valueWidth: propValW }]);

  for (const [lbl, key, def] of [['No of Blocks', 'noOfBlocks', '0'], ['No of Units on each floor', 'noOfUnitsOnEachFloor', '0'], ['No. of Floors', 'noOfFloors', ''], ['No. of Lifts', 'noOfLifts', ''], ['Amenities Available', 'amenitiesAvailable', 'Yes'], ['Delivery Agency', 'deliveryAgency', '']] as [string, string, string][]) {
    r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: lbl, value: fv(fields, key, def), labelWidth: propSubLblW, valueWidth: propValW }]);
  }

  r.drawKeyValueRow([{ label: '14', value: '', labelWidth: propNumW, valueWidth: 0 }, { label: 'Unit details', value: '', labelWidth: propLblW, valueWidth: 0 }, { label: 'Property located on Floor', value: fv(fields, 'propertyLocatedOnFloor', ''), labelWidth: propSubLblW, valueWidth: propValW }]);
  r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: 'Unit Configuration', value: fv(fields, 'unitConfiguration', ''), labelWidth: propSubLblW, valueWidth: propValW }]);
  r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: 'Carpet area', value: fv(fields, 'carpetArea', ''), labelWidth: propSubLblW, valueWidth: propValW }]);
  r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: 'SBUA of', value: fv(fields, 'sbuaOf', ''), labelWidth: propSubLblW, valueWidth: propValW }]);
  r.drawKeyValueRow([{ label: '', value: '', labelWidth: propNumW + propLblW, valueWidth: 0 }, { label: 'View from property', value: fv(fields, 'viewFromProperty', 'Good'), labelWidth: propSubLblW, valueWidth: propValW }]);

  r.drawKeyValueRow([
    { label: '15', value: '', labelWidth: propNumW, valueWidth: 0 },
    { label: 'Construction Quality (Good/Avg/Bad)', value: '', labelWidth: 200, valueWidth: 0 },
    { label: 'Exteriors', value: fv(fields, 'constructionQualityExteriors', 'Good'), labelWidth: 60, valueWidth: (CONTENT_W - propNumW - 200 - 120) / 2 },
    { label: 'Interiors', value: fv(fields, 'constructionQualityInteriors', 'Good'), labelWidth: 60, valueWidth: (CONTENT_W - propNumW - 200 - 120) / 2 },
  ]);

  r.drawKeyValueRow([
    { label: '16', value: '', labelWidth: propNumW, valueWidth: 0 },
    { label: 'Age of the property (Yrs)', value: fv(fields, 'ageOfProperty', ''), labelWidth: 200, valueWidth: 60 },
    { label: 'Residual age (Yrs)', value: fv(fields, 'residualAge', ''), labelWidth: 110, valueWidth: CONTENT_W - propNumW - 200 - 60 - 110 },
  ]);

  // ====== SANCTION PLAN APPROVAL ======
  r.drawSectionHeader('SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS');

  const wideLabel = LABEL_W;
  const wideVal = vW;

  r.drawKeyValueRow([{ label: '17', value: '', labelWidth: NUM_W, valueWidth: 0 }, { label: 'Sanction Plan Available', value: fv(fields, 'sanctionPlanAvailable', 'NA'), labelWidth: wideLabel, valueWidth: wideVal }]);

  const descW = 100; const approvalNoW = 75; const dateApprovalW = 90; const expiryW = 75;
  const sanctAuthW = CONTENT_W - NUM_W - descW - approvalNoW - dateApprovalW - expiryW;

  r.drawTable(
    ['18', 'Description', 'Approval No', 'Date of Approval', 'Expiry Date', 'Sanctioning Authority'],
    [
      ['', 'Layout Plan', fv(fields, 'layoutPlanApprovalNo', 'N.A'), fv(fields, 'layoutPlanDateOfApproval', 'N.A'), fv(fields, 'layoutPlanExpiryDate', 'N.A'), fv(fields, 'layoutPlanSanctioningAuthority', 'N.A')],
      ['', 'Building Plan', fv(fields, 'buildingPlanApprovalNo', ''), fv(fields, 'buildingPlanDateOfApproval', ''), fv(fields, 'buildingPlanExpiryDate', 'N.A'), fv(fields, 'buildingPlanSanctioningAuthority', '')],
      ['', 'Construction Permission', fv(fields, 'constructionPermissionApprovalNo', 'N.A'), fv(fields, 'constructionPermissionDateOfApproval', 'N.A'), fv(fields, 'constructionPermissionExpiryDate', 'N.A'), fv(fields, 'constructionPermissionSanctioningAuthority', 'N.A')],
      ['', 'Construction Certificate', fv(fields, 'constructionCertificateApprovalNo', 'N.A'), fv(fields, 'constructionCertificateDateOfApproval', 'N.A'), fv(fields, 'constructionCertificateExpiryDate', 'N.A'), fv(fields, 'constructionCertificateSanctioningAuthority', '')],
    ],
    [NUM_W, descW, approvalNoW, dateApprovalW, expiryW, sanctAuthW], [], [0, 1]
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

  const engName = fv(fields, 'nameOfEngineerVisitingProperty', '');
  r.drawKeyValueRow([{ label: 'Name of Engineer who visited the property-:', value: engName, labelWidth: Math.round(CONTENT_W * 0.60), valueWidth: Math.round(CONTENT_W * 0.40) }]);



  // ====== PROPERTY PHOTOGRAPHS & MAPS ======
  if (imageResults && imageResults.length > 0) {
    const propertyImgs = Array.isArray(fields.propertyImages) ? fields.propertyImages.filter((img: any) => typeof img === 'string' && img.length > 0) : [];
    const propCount = propertyImgs.length;
    
    const validPhotos = imageResults.slice(0, propCount)
      .map((bytes, idx) => ({ bytes: bytes!, label: (fields.propertyImageNames && fields.propertyImageNames[idx]) || '' }))
      .filter(p => p.bytes && p.bytes.length > 0);
      
    if (validPhotos.length > 0) {
      await r.drawPhotoGrid(validPhotos, 'Property Photographs');
    }

    let imgIdx = propCount;
    const sketchCount = fields.sketchMapImages?.length || 0;
    const sketchBytesList = sketchCount > 0 ? imageResults.slice(imgIdx, imgIdx + sketchCount).map(b => ({ bytes: b!, caption: '' })).filter(p => p.bytes) : [];
    imgIdx += sketchCount;

    const locationBytes = fields.locationMapImage ? imageResults[imgIdx] : null;
    if (fields.locationMapImage) imgIdx++;
    
    const normMouzaImages = fields.mouzaMapImages || normalizeMapImages(fields.mouzaMapImage);
    const mouzaCount = normMouzaImages.length;
    const mouzaBytesList = mouzaCount > 0 ? imageResults.slice(imgIdx, imgIdx + mouzaCount).map(b => ({ bytes: b!, caption: '' })).filter(p => p.bytes) : [];
    imgIdx += mouzaCount;

    const normCadastralImages = fields.cadastralMapImages || normalizeMapImages(fields.cadastralMapImage);
    const cadastralCount = normCadastralImages.length;
    const cadastralBytesList = cadastralCount > 0 ? imageResults.slice(imgIdx, imgIdx + cadastralCount).map(b => ({ bytes: b!, caption: '' })).filter(p => p.bytes) : [];
    imgIdx += cadastralCount;

    if (mouzaBytesList.length > 0) {
      await r.drawMapGallery(mouzaBytesList, 'Mouza Map (Bhulekh / Revenue Map) (1)');
    }
    if (sketchBytesList.length > 0) {
      await r.drawMapGallery(sketchBytesList, 'Sketch Map (Demarcation / Hand-Drawn) (1)');
    }
    if (cadastralBytesList.length > 0) {
      await r.drawMapGallery(cadastralBytesList, 'Cadastral Map (1)');
    }

    if (locationBytes) {
      r.addPage();
      const lat = fields.latitude || '';
      const lng = fields.longitude || '';
      r.drawSectionHeader(`Location Map(Latitude-${lat}, Longitude-${lng})`, false);
      r.advanceCursor(8);

      const maxH = 400;
      
      let img = null;
      try { img = await r.doc.embedPng(locationBytes); } catch { /* ignore */ }
      if (!img) {
        try { img = await r.doc.embedJpg(locationBytes); } catch { /* ignore */ }
      }
      
      if (img) {
        const scale = Math.min(CONTENT_W / img.width, maxH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        const x = MARGIN_L + (CONTENT_W - w) / 2;
        const y = r.pdfY(r.cursorY) - h;

        r.page.drawRectangle({
          x: MARGIN_L,
          y: r.pdfY(r.cursorY) - h,
          width: CONTENT_W,
          height: h,
          borderColor: rgb(0, 0, 0),
          borderWidth: 1,
        });

        r.page.drawImage(img, { x, y, width: w, height: h });

        r.page.drawText(`Latitude:- ${lat}`, { x: x + w - 170, y: y + 30, size: 14, font: r.fontBold, color: rgb(1, 1, 0) });
        r.page.drawText(`Longitude:- ${lng}`, { x: x + w - 170, y: y + 10, size: 14, font: r.fontBold, color: rgb(1, 1, 0) });

        r.cursorY += h + 20;
      }
    }
  }

  // ====== DEVIATIONS / OBSERVATIONS ======
  r.addPage();
  r.drawSectionHeader('DEVIATIONS / OBSERVATIONS');
  const devC1 = 110;
  const devC2 = 10;
  const devC3 = (CONTENT_W - devC1 * 2 - devC2 * 2) / 2;
  
  r.drawTable([], [
    ['Deal Number', ':', fv(fields, 'dealNumber', ''), 'Asset id', ':', fv(fields, 'assetId', '')],
    ['Branch Name', ':', fv(fields, 'branchName', ''), 'Type of Case', ':', fv(fields, 'typeOfCase', '')],
    ['Valuer Name', ':', fv(fields, 'valuerName', ''), 'Product Type', ':', fv(fields, 'productType', '')],
    ['Valuer Ref No', ':', fv(fields, 'valuerRefNo', ''), 'Date of Visit', ':', fv(fields, 'dateOfVisit', '')],
    ['Valuer Feedback', ':', fv(fields, 'valuerFeedback', ''), 'Date of Report', ':', fv(fields, 'dateOfReport', '')],
  ], [devC1, devC2, devC3, devC1, devC2, devC3], [], [0, 1, 3, 4]);

  r.drawTable([], [
    ['Property Address', fv(fields, 'addressAsPerDocument', '')]
  ], [devC1 + devC2, CONTENT_W - devC1 - devC2], [], [0]);

  r.drawTable([], [
    [`Deviations/Observations:\n\n${fv(fields, 'deviationsObservations', '')}\n`]
  ], [CONTENT_W], [], []);

  // ====== FINALIZE ======
  return await r.save();
}

export const ADITYA_BIRLA_HOUSING_HLLAP_CONFIG: BankConfig = {
  bankId: 'ADITYA BIRLA HOUSING FINANCE LTD',
  subTemplateId: 'HL-LAP',
  displayName: 'Aditya Birla Housing Finance Ltd',
  navSections: [
    { id: 'section-1', title: 'Header Details' },
    { id: 'section-1a', title: 'Basic Details' },
    { id: 'section-2', title: 'Surrounding & Locality' },
    { id: 'section-3', title: 'Property Details' },
    { id: 'section-4', title: 'Sanction Plan & Documents' },
    { id: 'section-6', title: 'Valuation Details' },
    { id: 'section-7', title: 'Boundaries' },
    { id: 'section-8', title: 'Remarks & Declaration' },
    { id: 'section-11', title: '9. Photographs' },
    { id: 'section-12', title: '10. Maps & Documents' },
    { id: 'section-deviations', title: '11. DEVIATIONS / OBSERVATIONS' },
  ],
  fieldLabels: {
    loanApplicationNo: 'Deal Number',
    ownerName: 'Applicant Name(s)',
    ownerAddress: 'Address as per request',
  },
  // Hide base fields that are not in the Aditya Birla Housing Finance sample
  // (these are replaced by the extraFields below in the exact sample order)
  hiddenFields: [
    'to',
    'refNo',
    'dateOfValuation',
    'purpose',
    'bankName',
    'branchName',
    'ownerName',
    'propertyType',
    'ownerAddress',
    'legalAddress',
    'landmark',
    'loanApplicationNo',
    'documentHolderName',
    'dateOfInspection',
    // Base locality fields to hide
    'wardNo',
    'vicinity',
    'classOfLocality',
    'approachRoadWidth',
    'plotDemarcated',
    'proximityToFacilities',
    'premisesType',
    'occupiedBy',
    'boundaries',
    'structureType',
    'numberOfFloors',
    'ageOfPropertyActual',
    'estimatedFutureLife',
    'qualityOfConstruction',
    'maintenanceCondition',
    'constructionApproved',
    'approvalDetails',
    'violationsObserved',
    'conformsToByelaws',
    'floorValuations',
    'demarcation',
    'possession',
    'remarks',
  ],
  // Hide default BankReportBuilder sections not used by Aditya Birla Housing
  // (their content is replaced by bank-specific extraFields in the correct sections)
  hiddenSections: [
    'section-5',   // Setbacks & BUA (removed per user request, fields moved to section-4)
    'section-7b',  // Land Valuation (covered by section-6 Valuation Details)
    'section-7c',  // Valuation Abstract (covered by section-6 Valuation Details)
    'section-9',   // Default Abstract of Valuation
    'section-10',  // Default Deviations
    'section-14',  // Annexures (Apartment/Flat)
    'section-15',  // Annexures (Bungalow/Land)
  ],
  extraSectionsEnd: [
    {
      id: 'section-deviations',
      title: 'DEVIATIONS / OBSERVATIONS',
      number: 11,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const inputCls = "w-full text-sm p-2 rounded-full border border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500 bg-white shadow-sm";
        const tdLabelCls = "p-2 border border-slate-300 text-sm font-medium text-slate-800 bg-white whitespace-nowrap w-[20%]";
        const tdInputCls = "p-2 border border-slate-300 bg-white w-[30%]";

        return (
          <div className="w-full font-sans mb-4">
            <div className="md:col-span-2 border border-blue-200 bg-[#f8fafc] rounded-xl p-4 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <tbody>
                  <tr>
                    <td className={tdLabelCls}>Deal Number</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.dealNumber || ''} /></td>
                    <td className={tdLabelCls}>Asset id</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.assetId || ''} /></td>
                  </tr>
                  <tr>
                    <td className={tdLabelCls}>Branch Name</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.branchName || ''} /></td>
                    <td className={tdLabelCls}>Type of Case</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.typeOfCase || ''} /></td>
                  </tr>
                  <tr>
                    <td className={tdLabelCls}>Valuer Name</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.valuerName || ''} /></td>
                    <td className={tdLabelCls}>Product Type</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.productType || ''} /></td>
                  </tr>
                  <tr>
                    <td className={tdLabelCls}>Valuer Ref No</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.valuerRefNo || ''} /></td>
                    <td className={tdLabelCls}>Date of Visit</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.dateOfVisit || ''} /></td>
                  </tr>
                  <tr>
                    <td className={tdLabelCls}>Valuer Feedback</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.valuerFeedback || ''} /></td>
                    <td className={tdLabelCls}>Date of Report</td>
                    <td className={tdInputCls}><input className={inputCls} disabled value={fields.dateOfReport || ''} /></td>
                  </tr>
                  <tr>
                    <td className={tdLabelCls}>Property Address</td>
                    <td colSpan={3} className={tdInputCls}>
                      <textarea className={`${inputCls} !rounded-xl min-h-[60px] resize-y`} disabled value={fields.addressAsPerDocument || ''} />
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-2 border border-slate-300 bg-white">
                      <div className="flex flex-col gap-2 p-1">
                        <label className="text-slate-800 text-sm font-bold ml-1">Deviations/Observations:</label>
                        <textarea 
                          className={`${inputCls} !rounded-xl min-h-[150px] resize-y`}
                          value={fields.deviationsObservations || ''}
                          onChange={e => handleChange('deviationsObservations', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      }
    }
  ],
  extraFields: {
    // ── SECTION 1: HEADER & BASIC DETAILS ──
    // Order matches the sample image exactly:
    // Header banner → Deal Number, Asset ID, Branch Name, Type of Case,
    // Valuer Name, Product Type, Valuer Ref No, Date of Visit,
    // Valuer Feedback, Date of Report, Contacted Person, Relation with Customer,
    // Seller, Contact No
    // Then BASIC DETAILS → 1. Applicant Name(s), 2. Originally type of property,
    // 3. Address as per request, Address as per document, Address as per Site,
    // Project/Colony/Layout Name, Unit/Flat no, Floor No, Building Name, Wing Name,
    // S.No/G.No/Khasra No, Close Vicinity/Landmark, Street Name, Village Name,
    // City, State, Main Locality, Sub Locality, Pin code, Latitude, Longitude,
    // 4. Has the valuator valued...
    'section-1': [
      // ── Header Banner Fields ──
      { key: 'dealNumber', label: 'Deal Number' },
      { key: 'assetId', label: 'Asset ID' },
      { key: 'branchName', label: 'Branch Name' },
      { key: 'typeOfCase', label: 'Type of Case' },
      { key: 'valuerName', label: 'Valuer Name' },
      { key: 'productType', label: 'Product Type' },
      { key: 'valuerRefNo', label: 'Valuer Ref No' },
      { key: 'dateOfVisit', label: 'Date of Visit', type: 'date' },
      { key: 'valuerFeedback', label: 'Valuer Feedback' },
      { key: 'dateOfReport', label: 'Date of Report', type: 'date' },
      { key: 'contactedPerson', label: 'Contacted Person' },
      { key: 'relationWithCustomer', label: 'Relation with Customer', default: 'Seller' },
      { key: 'contactNo', label: 'Contact No' },
    ],

    // ── SECTION 1a: BASIC DETAILS ──
    'section-1a': [
      // ── BASIC DETAILS (1-4) ──
      { key: 'ownerName', label: '1. Applicant Name(s)', span: 2 },
      { key: 'originallyTypeOfProperty', label: '2.1 Originally type of property' },
      { key: 'currentUsage', label: '2.2 Current Usage', default: 'Residential Flat' },
      { key: 'addressAsPerRequest', label: '3.1 Address as per request', type: 'textarea', span: 2 },
      { key: 'addressAsPerDocument', label: '3.2 Address as per document', type: 'textarea', span: 2 },
      { key: 'addressAsPerSite', label: '3.3 Address as per Site', type: 'textarea', span: 2 },
      { key: 'projectColonyLayoutName', label: '3.4 Project/Colony/Layout Name' },
      { key: 'unitFlatBungalowPlotHouseNo', label: '3.5 Unit/Flat no/ Bungalow/Plot/House no.' },
      { key: 'floorNo', label: '3.6 Floor No' },
      { key: 'buildingName', label: '3.7 Building Name' },
      { key: 'wingName', label: '3.8 Wing Name' },
      { key: 'khasraNo', label: '3.9 S.No/G.No/Khasra No', type: 'textarea' },
      { key: 'closeVicinityLandmark', label: '3.10 Close Vicinity/Landmark' },
      { key: 'streetName', label: '3.11 Street Name' },
      { key: 'villageName', label: '3.12 Village Name' },
      { key: 'city', label: '3.13 City' },
      { key: 'stateName', label: '3.14 State', default: 'Odisha' },
      { key: 'mainLocalityOfProperty', label: '3.15 Main Locality of the Property' },
      { key: 'subLocality', label: '3.16 Sub Locality' },
      { key: 'pinCodeOfProperty', label: '3.17 Pin code of the Property' },
      { key: 'latitude', label: '3.18 Latitude' },
      { key: 'longitude', label: '3.19 Longitude' },
      { key: 'valuedBefore', label: '4. Has the valuator valued this property before, If yes, when, for whom', type: 'yesno', default: 'No' },
      { key: 'valuedBeforeDetails', label: 'When and for whom', type: 'textarea', span: 2, dependsOn: { field: 'valuedBefore', value: 'Yes' } },
    ],

    // ── SECTION 2: SURROUNDING & LOCALITY DETAILS (5-11) ──
    'section-2': [
      {
        key: 'locationFieldset',
        label: '5. Location',
        type: 'fieldset',
        fields: [
          { key: 'locationType', label: 'Type (Comm, Res, Ind, Mix)', type: 'select', options: ['Commercial', 'Residential', 'Industrial', 'Mixed'], default: 'Residential' },
          { key: 'localityLevel', label: 'Locality (Low, Medium, Posh)', type: 'select', options: ['Low', 'Medium', 'Posh'], default: 'Medium' },
          { key: 'siteDevStatus', label: 'Site is (Dev, Under Dev, Developing)', type: 'select', options: ['Developed', 'Under Development', 'Developing'], default: 'Developed' },
          { key: 'proximityToCivicAmenities', label: 'Proximity to civic amenities/public transport', default: 'Good' },
          { key: 'railwayStationDistance', label: 'Railway Station' },
          { key: 'busStopDistance', label: 'Bus Stop' }
        ]
      },
      { key: 'distanceFromCityCentre', label: '6. Distance from City Centre' },
      { key: 'natureOfApproachRoad', label: '7. Nature of approach Road', default: 'Bitumen Road' },
      { key: 'customApproachRoadWidth', label: '8. Approach Road width' },
      { key: 'approachAsPerSite', label: '9. Approach to the property as per Site', default: 'Clear' },
      { key: 'approachAsPerDocs', label: '10. Approach to the property as per Docs', default: 'Clear' },
      { key: 'securityObservation', label: '11. Any observation which affects the security', default: 'NA' },
    ],

    // ── SECTION 3: PROPERTY DETAILS (12-16) ──
    'section-3': [
      {
        key: 'occupantFieldset',
        label: '12. Occupant',
        type: 'fieldset',
        fields: [
          { key: 'nameOfOccupant', label: 'Name of Occupant', default: 'NA' },
          { key: 'noOfTenants', label: 'No of Tenants', default: 'NA' },
          { key: 'relationWithApplicant', label: 'Relation with applicant', default: 'NA' }
        ]
      },
      {
        key: 'buildingDetailsFieldset',
        label: '13. Building details',
        type: 'fieldset',
        color: 'red',
        fields: [
          { key: 'propertyDemarcation', label: 'Property Demarcation', default: 'Yes' },
          { key: 'propertyIdentifiedYN', label: 'Property Identified (Y/N)', type: 'yesno', default: 'Yes' },
          { key: 'propertyIdentifiedThrough', label: 'Property Identified through' },
          { key: 'typeOfStructure', label: 'Type of structure', default: 'R.C.C' },
          { key: 'landPlotAreaUDS', label: 'Land/Plot Area -UDS' },
          { key: 'noOfBlocks', label: 'No of Blocks' },
          { key: 'noOfUnitsOnEachFloor', label: 'No of Units on each floor' },
          { key: 'noOfFloors', label: 'No. of Floors' },
          { key: 'noOfLifts', label: 'No. of Lifts' },
          { key: 'amenitiesAvailable', label: 'Amenities Available', type: 'select', options: ['Yes', 'NA'], default: 'Yes' },
          { key: 'deliveryAgency', label: 'Delivery Agency' }
        ]
      },
      {
        key: 'unitDetailsFieldset',
        label: '14. Unit details',
        type: 'fieldset',
        color: 'green',
        fields: [
          { key: 'propertyLocatedOnFloor', label: 'Property located on Floor' },
          { key: 'unitConfiguration', label: 'Unit Configuration' },
          { key: 'carpetArea', label: 'Carpet area' },
          { key: 'sbuaOf', label: 'SBUA of' },
          { key: 'viewFromProperty', label: 'View from property', default: 'Good' }
        ]
      },
      {
        key: 'constructionQualityFieldset',
        label: '15. Construction Quality',
        type: 'fieldset',
        color: 'red',
        fields: [
          { key: 'constructionQualityExteriors', label: 'Exteriors', type: 'select', options: ['Good', 'Average', 'Bad', 'NA'], default: 'NA' },
          { key: 'constructionQualityInteriors', label: 'Interiors', type: 'select', options: ['Good', 'Average', 'Bad', 'NA'], default: 'NA' }
        ]
      },
      { key: 'ageOfProperty', label: '16.1 Age of the property (Yrs)' },
      { key: 'residualAge', label: '16.2 Residual age (Yrs)' },
    ],

    // ── SECTION 4: SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS (17-23) ──
    'section-4': [
      { key: 'sanctionPlanAvailable', label: '17. Sanction Plan Available', type: 'select', options: ['Yes', 'NA'], default: 'NA' },
      {
        key: 'sanctionPlanDetailsTable',
        label: '18. Approval Details',
        type: 'table',
        columns: ['Approval No', 'Date of Approval', 'Expiry Date', 'Sanctioning Authority'],
        rows: [
          {
            label: 'Layout Plan',
            fields: [
              { key: 'layoutPlanApprovalNo', default: 'N.A' },
              { key: 'layoutPlanDateOfApproval', default: 'N.A' },
              { key: 'layoutPlanExpiryDate', default: 'N.A' },
              { key: 'layoutPlanSanctioningAuthority', default: 'N.A' }
            ]
          },
          {
            label: 'Building Plan',
            fields: [
              { key: 'buildingPlanApprovalNo', placeholder: 'Enter building plan - approval no...' },
              { key: 'buildingPlanDateOfApproval', placeholder: 'Enter building plan - date of approval...' },
              { key: 'buildingPlanExpiryDate', default: 'N.A' },
              { key: 'buildingPlanSanctioningAuthority', placeholder: 'Enter building plan - sanctioning authority...' }
            ]
          },
          {
            label: 'Construction Permission',
            fields: [
              { key: 'constructionPermissionApprovalNo', default: 'N.A' },
              { key: 'constructionPermissionDateOfApproval', default: 'N.A' },
              { key: 'constructionPermissionExpiryDate', default: 'N.A' },
              { key: 'constructionPermissionSanctioningAuthority', default: 'N.A' }
            ]
          },
          {
            label: 'Construction Certificate',
            fields: [
              { key: 'constructionCertificateApprovalNo', default: 'N.A' },
              { key: 'constructionCertificateDateOfApproval', default: 'N.A' },
              { key: 'constructionCertificateExpiryDate', default: 'N.A' },
              { key: 'constructionCertificateSanctioningAuthority', default: 'N.A' }
            ]
          }
        ]
      },
      {
        key: 'commencementCompletionFieldset',
        label: '19. Commencement / Completion Dates',
        type: 'fieldset',
        color: 'red',
        fields: [
          { key: 'constructionCommencementDate', label: 'Construction commencement date', type: 'yearPicker', default: 'NA' },
          { key: 'expectedCompletionDate', label: 'Expected Completion Date', type: 'yearPicker', default: 'NA', constrainedByYear: 'constructionCommencementDate' }
        ]
      },
      { key: 'ownershipType', label: '20. Ownership Type (Free Hold / Lease Hold)', type: 'select', options: ['Freehold', 'Leasehold'], default: 'Freehold' },
      { key: 'propertyDocsVerification', label: '21. Property documents verification details' },
      { key: 'propertyJurisdiction', label: '22. Property Jurisdiction', span: 2 },
      { key: 'permissibleZoning', label: '23.1 Permissible zoning as per master plan' },
      { key: 'usageAsPerSite', label: '23.2 Usage As per Site' },
      { key: 'underDemolitionList', label: '24. Whether property under demolition list as per authority (Y/N)', type: 'select', options: ['Yes', 'No'], default: 'No', span: 2 },
      {
        key: 'setbacksTable',
        label: '25. Setbacks',
        type: 'table',
        firstColumnHeader: 'Setbacks (Fts)',
        columns: ['As per plan/ Byelaws (Fts)', 'As per site (Fts)'],
        rows: [
          {
            label: 'Front',
            fields: [
              { key: 'setbackFrontPlan', default: 'N.A' },
              { key: 'setbackFrontSite', default: 'N.A' }
            ]
          },
          {
            label: 'Side1(Left)',
            fields: [
              { key: 'setbackSide1Plan', default: 'N.A' },
              { key: 'setbackSide1Site', default: 'N.A' }
            ]
          },
          {
            label: 'Side2(Right)',
            fields: [
              { key: 'setbackSide2Plan', default: 'N.A' },
              { key: 'setbackSide2Site', default: 'N.A' }
            ]
          },
          {
            label: 'Rear',
            fields: [
              { key: 'setbackRearPlan', default: 'N.A' },
              { key: 'setbackRearSite', default: 'N.A' }
            ]
          }
        ]
      },
      {
        key: 'buaAreaTable',
        label: '26. BUA Area (In Sqft.)',
        type: 'table',
        color: 'red',
        firstColumnHeader: 'Floor',
        columns: ['As per plan/ Byelaws (sqft)', 'As per site (Sqft)'],
        rows: [
          {
            label: 'Ground Floor',
            fields: [
              { key: 'buaGroundPlan', default: 'N.A' },
              { key: 'buaGroundSite', default: 'N.A' }
            ]
          },
          {
            label: 'First Floor',
            fields: [
              { key: 'buaFirstPlan', default: 'N.A' },
              { key: 'buaFirstSite', default: 'N.A' }
            ]
          },
          {
            label: 'Second Floor',
            fields: [
              { key: 'buaSecondPlan', default: 'N.A' },
              { key: 'buaSecondSite', default: 'N.A' }
            ]
          },
          {
            label: 'Total BUA (In sqft.)',
            fields: [
              { key: 'buaTotalPlan', default: 'N.A' },
              { key: 'buaTotalSite', default: 'N.A' }
            ]
          }
        ]
      }
    ],


    // ── SECTION 6: VALUATION DETAILS (27) ──
    'section-6': [
      {
        key: 'descLandConstructedAreaRatesTable',
        label: '27. (A) Description of Land &Constructed Area and Rates',
        type: 'table',
        firstColumnHeader: 'Description',
        tableTopField: { key: 'propertyTypeBungalow', label: 'Property Type' },
        columns: ['Unit of Measurement', 'Area', 'Rate/unit', 'Amount'],
        rows: [
          {
            label: 'Land Area',
            fields: [
              { key: 'valLandUnit' },
              { key: 'valLandArea' },
              { key: 'valLandRate' },
              { key: 'valLandAmount', inputType: 'number' }
            ]
          },
          {
            label: 'Parking/Stilt BUA',
            fields: [
              { key: 'valParkingUnit' },
              { key: 'valParkingArea' },
              { key: 'valParkingRate' },
              { key: 'valParkingAmount', inputType: 'number' }
            ]
          },
          {
            label: 'BUA/SBUA',
            fields: [
              { key: 'valBuaUnit' },
              { key: 'valBuaArea' },
              { key: 'valBuaRate' },
              { key: 'valBuaAmount', inputType: 'number' }
            ]
          },
          {
            fields: [
              { isLabel: true, label: 'Construction Progress', colSpan: 2 },
              { key: 'valConstructionProgress', colSpan: 3 }
            ]
          },
          {
            fields: [
              { isLabel: true, label: '% Completion', colSpan: 1 },
              { key: 'valPercentCompletion', colSpan: 1 },
              { isLabel: true, label: '% Recommendation', colSpan: 1 },
              { key: 'valPercentRecommendation', colSpan: 2 }
            ]
          }
        ]
      },
      {
        key: 'extraAmenitiesTable',
        label: '27. (B) Value of Extra Amenities (if applicable)',
        type: 'table',
        color: 'red',
        hideHeaders: true,
        columns: [''], // 1 column for input
        rows: [
          { label: 'No of Car Parks', fields: [{ key: 'noOfCarParks', inputType: 'number' }] },
          { label: 'Car Parking Charges Lumpsum (INR)', fields: [{ key: 'carParkingCharges', inputType: 'number' }] },
          { label: 'EDC,IDC Lumpsum(INR)', fields: [{ key: 'edcIdcLumpsum', inputType: 'number' }] },
          { label: 'PLC Charges Lumpsum(INR)', fields: [{ key: 'plcChargesLumpsum', inputType: 'number' }] },
          { label: 'Power Backup', fields: [{ key: 'powerBackup' }] },
          { label: 'Interiors/Amenities', fields: [{ key: 'interiorsAmenities' }] },
          { label: 'Interiors % completion', fields: [{ key: 'interiorsPercentCompletion' }] },
          { label: 'Total of Component A on Completion', fields: [{ key: 'totalComponentA', editToggle: true, computedSumOf: ['valLandAmount', 'valParkingAmount', 'valBuaAmount'] }] },
          { label: 'Total of Component B on Completion', fields: [{ key: 'totalComponentB', inputType: 'number', editToggle: true, computedSumOf: ['noOfCarParks', 'carParkingCharges', 'edcIdcLumpsum', 'plcChargesLumpsum', 'powerBackup', 'interiorsAmenities', 'interiorsPercentCompletion'] }] },
          { label: 'Total Market Value of Property on Completion (100% of A+B)', fields: [{ key: 'totalMarketValueOnCompletion', inputType: 'number', editToggle: true, computedSumOf: ['totalComponentA', 'totalComponentB'] }] },
          { label: 'Total Market Value of Property on Completion in Words', fields: [{ key: 'totalMarketValueOnCompletionWords', computedWordsOf: 'totalMarketValueOnCompletion', readOnly: true }] },
          { dynamicLabelTemplate: 'Total Market Value of Property as on Date ({valPercentCompletion}% of A+B)', fields: [{ key: 'totalMarketValueAsOnDate', inputType: 'number', editToggle: true, computedPercentOf: { percentField: 'valPercentCompletion', totalField: 'totalMarketValueOnCompletion' } }] },
          { label: 'Guideline Value of The Property', fields: [{ key: 'guidelineValueOfProperty' }] },
          { label: 'Distress Sale Value as on date', fields: [{ key: 'distressSaleValue' }] },
          { label: 'Approx. Rentals in case of 100% complete property', fields: [{ key: 'approxRentals' }] },
        ]
      },
    ],

    // ── SECTION 7: BOUNDARIES (28) ──
    'section-7': [
      {
        key: 'boundaryDetailsTable',
        label: '28. Boundary Details',
        type: 'table',
        firstColumnHeader: 'Boundaries',
        columns: ['North', 'East', 'South', 'West'],
        rows: [
          {
            label: 'As per Docs',
            fields: [
              { key: 'boundaryDocsNorth' },
              { key: 'boundaryDocsEast' },
              { key: 'boundaryDocsSouth' },
              { key: 'boundaryDocsWest' }
            ]
          },
          {
            label: 'At site',
            fields: [
              { key: 'boundaryAtSiteNorth' },
              { key: 'boundaryAtSiteEast' },
              { key: 'boundaryAtSiteSouth' },
              { key: 'boundaryAtSiteWest' }
            ]
          },
          {
            fields: [
              { isLabel: true, label: 'Boundaries Matching', colSpan: 2 },
              { key: 'boundariesMatching', colSpan: 3 }
            ]
          }
        ]
      }
    ],

    // ── SECTION 8: REMARKS & DECLARATION ──
    'section-8': [
      { key: 'remarksText', label: 'Remarks', type: 'textarea', span: 2 },
      { key: 'declarationText', label: 'Declaration', type: 'textarea', span: 2 },
      { key: 'nameOfEngineerVisitingProperty', label: 'Name of Engineer who visited the property', type: 'text', span: 2 },
    ],

    // ── SECTION 11: DEVIATIONS / OBSERVATIONS ──
    'section-11': [
      { key: 'deviationPropertyAddress', label: 'Property Address (for Deviation page)', type: 'textarea', span: 2 },
      { key: 'deviationsObservations', label: 'Deviations/Observations', type: 'textarea', span: 2 },
    ],
  },
  // Custom PDF generator — uses PDFAdityaBirlaHousingRenderer (two-file pattern)
  generateCustomPDF: generateHLLAPPDF,
  defaultValues: {
    to: 'ADITYA BIRLA HOUSING FINANCE LTD',
    purpose: 'Home Loan / LAP',
    branchName: 'Bhubaneswar',
    state: 'Odisha',
  },
};

export default function AdityaBirlaHousingHLLAP(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ADITYA_BIRLA_HOUSING_HLLAP_CONFIG} {...props} />;
}
