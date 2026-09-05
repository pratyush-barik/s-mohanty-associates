/**
 * pdf-annapurna-micro-renderer.ts — Dedicated PDF renderer for Annapurna Micro Finance Ltd.
 * Extends PDFBankRenderer to replicate the exact reference format from sample images.
 */

import { rgb } from 'pdf-lib';
import {
  PDFBankRenderer,
  PAGE_W,
  PAGE_H,
  MARGIN_T,
  MARGIN_B,
  MARGIN_L,
  MARGIN_R,
  CONTENT_W,
  FONT_SIZE,
  FONT_SIZE_HEADER,
  FONT_SIZE_TITLE,
  FONT_SIZE_SMALL,
  FONT_SIZE_CAPTION,
  LINE_HEIGHT,
  BORDER_W,
  LBL_BG,
  OPT_BG,
  VAL_BG,
  BG_OPACITY,
  hexToRgb,
} from '../pdf-bank-renderer';

export interface AnnapurnaMicroReportFields {
  // Section 1: Application Details
  refNo?: string;
  reportDate?: string;
  fileNo?: string;
  dateOfVisit?: string;
  applicantName?: string;
  contactPerson?: string;
  loanType?: string;
  personMetOnSite?: string;
  ownerName?: string;
  documentsProvided?: string;

  // Section 2: Location Details
  propertyAddressSite?: string;
  locality?: string;
  landmark?: string;
  distanceFromBranch?: string;
  latitude?: string;
  longitude?: string;
  propertyAddressLegal?: string;
  floorNo?: string;
  propertyState?: string;
  propertyCity?: string;
  propertyPincode?: string;
  addressMatching?: string;
  jurisdiction?: string;
  holdingType?: string;
  marketability?: string;
  occupiedBy?: string;
  propertyType?: string;
  occupancyStatus?: string;

  // Section 3: Schedule of Property
  northLegal?: string;
  northSite?: string;
  northSketch?: string;
  eastLegal?: string;
  eastSite?: string;
  eastSketch?: string;
  westLegal?: string;
  westSite?: string;
  westSketch?: string;
  southLegal?: string;
  southSite?: string;
  southSketch?: string;
  boundariesMatching?: string;
  propertyIdentified?: string;
  approachRoadSize?: string;

  // Section 4: NDMA Parameters
  natureOfBuilding?: string;
  planAspectRatio?: string;
  structureType?: string;
  projectedParts?: string;
  masonryType?: string;
  expansionJoints?: string;
  roofType?: string;
  steelGrade?: string;
  mortarType?: string;
  concreteGrade?: string;
  environmentExposure?: string;
  footingType?: string;
  seismicZone?: string;
  soilLiquefiable?: string;
  coastalRegulatoryZone?: string;
  soilSlopeVulnerable?: string;
  floodProneArea?: string;
  groundSlopeMoreThan20?: string;
  fireExit?: string;

  // Section 5: Approved Plan Details
  sanctionedPlanProvided?: string;
  layoutPlanNo?: string;
  constructionPlanNo?: string;
  dateOfSanction?: string;
  planValidity?: string;
  approvingAuthority?: string;
  approvedUsages?: string;
  numberOfFloorsInBuilding?: string;

  // Section 6: Technical Details
  currentOccupant?: string;
  separateAccess?: string;
  accommodationDetails?: string;

  // Plot Area Details
  eastDocs?: string;
  eastSiteMeas?: string;
  eastPlan?: string;
  westDocs?: string;
  westSiteMeas?: string;
  westPlan?: string;
  northDocs?: string;
  northSiteMeas?: string;
  northPlan?: string;
  southDocs?: string;
  southSiteMeas?: string;
  southPlan?: string;
  landAreaDocs?: string;
  landAreaSite?: string;
  landAreaPlan?: string;

  // BAU Area Details (Floors)
  bauFloors?: Array<{
    floor: string;
    rooms: string;
    kitchens: string;
    bathrooms: string;
    sanctionedUsage: string;
    actualUsage: string;
  }>;

  // FSI & Construction Details
  permissibleAreaPlan?: string;
  landComponent?: string;
  permissibleFsi?: string;
  permissibleConstructionFsi?: string;
  actualConstructionBua?: string;
  considerConstructionBua?: string;
  riskOfDemolition?: string;
  propertyStatus?: string;
  isCompleted?: string;
  completedPct?: string;
  recommendedPct?: string;
  currentAge?: string;
  residualAge?: string;

  // Section 7: Valuation
  landAreaSqft?: string;
  landRateSqft?: string;
  landTotalValue?: string;
  buaAreaSqft?: string;
  buaRateSqft?: string;
  buaTotalValue?: string;
  marketValue?: string;
  distressedPct?: string;
  distressedValue?: string;
  govtRate?: string;
  inDemolitionList?: string;
  inNegativeArea?: string;
  remarks?: string;

  // Section 8: Additional Checks
  approachRoadType?: string;
  surroundingAreaDevelopment?: string;
  distanceFromCityCentre?: string;
  distanceFromCorpLimits?: string;
  electricity?: string;
  electricityDistributor?: string;
  waterSupply?: string;
  waterDistributor?: string;
  sewerProvision?: string;
  sewerConnected?: string;
  futureDemolitionThreat?: string;

  // Section 9: Declaration
  visitingEngineer?: string;
  place?: string;

  // Photos & Maps
  propertyImages?: string[];
  propertyImageNames?: string[];
  locationMapImages?: string[];
  locationMapImage?: string;
  mouzaMapImages?: string[];
  mouzaMapImage?: string;
  sketchMapImages?: string[];
  cadastralMapImages?: string[];
  cadastralMapImage?: string;

  // Annexures
  annexures?: any[];

  [key: string]: any;
}

export class PDFAnnapurnaMicroRenderer extends PDFBankRenderer {
  /**
   * Draw Document Header matching the exact Annapurna Reference:
   * Ref No (Left) | Date (Right)
   * Followed by bold centered Title: "Valuation Report"
   */
  drawAnnapurnaHeader(refNo: string, reportDate: string): void {
    const y = this.pdfY(this.cursorY);
    const fontB = this.fontBold;

    // Ref No on left
    const refText = `Ref No: ${this.sanitizeText(refNo || 'AFPL/...')}`;
    this.page.drawText(refText, {
      x: MARGIN_L,
      y: y - 10,
      size: FONT_SIZE_SMALL + 1,
      font: fontB,
      color: rgb(0, 0, 0),
    });

    // Date on right
    const dateText = `Date: ${this.sanitizeText(reportDate || '...')}`;
    const dateW = fontB.widthOfTextAtSize(dateText, FONT_SIZE_SMALL + 1);
    this.page.drawText(dateText, {
      x: MARGIN_L + CONTENT_W - dateW,
      y: y - 10,
      size: FONT_SIZE_SMALL + 1,
      font: fontB,
      color: rgb(0, 0, 0),
    });

    this.cursorY += 24;

    // Centered Title "Valuation Report"
    const title = 'Valuation Report';
    const tw = fontB.widthOfTextAtSize(title, FONT_SIZE_TITLE + 1);
    this.page.drawText(title, {
      x: MARGIN_L + (CONTENT_W - tw) / 2,
      y: this.pdfY(this.cursorY) - 12,
      size: FONT_SIZE_TITLE + 1,
      font: fontB,
      color: rgb(0, 0, 0),
    });

    // Underline
    this.page.drawLine({
      start: { x: MARGIN_L + (CONTENT_W - tw) / 2, y: this.pdfY(this.cursorY) - 15 },
      end: { x: MARGIN_L + (CONTENT_W + tw) / 2, y: this.pdfY(this.cursorY) - 15 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    this.cursorY += 26;
  }

  /**
   * Section Header with small underline matching sample style
   */
  drawUnderlinedSectionHeader(title: string): void {
    if (this.cursorY > 10) {
      this.cursorY += 8;
    }
    this.checkPageBreak(50);

    const text = this.sanitizeText(title);
    const y = this.pdfY(this.cursorY);
    this.page.drawText(text, {
      x: MARGIN_L,
      y: y - 11,
      size: FONT_SIZE_HEADER,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    const tw = this.fontBold.widthOfTextAtSize(text, FONT_SIZE_HEADER);
    this.page.drawLine({
      start: { x: MARGIN_L, y: y - 14 },
      end: { x: MARGIN_L + tw, y: y - 14 },
      thickness: 1,
      color: rgb(0, 0, 0),
    });

    this.cursorY += 20;
  }

  /**
   * Main PDF Generation orchestration for Annapurna Micro Finance Ltd
   */
  async generateAnnapurnaReport(
    fields: AnnapurnaMicroReportFields,
    images: {
      photos: { bytes: Uint8Array; label?: string }[];
      locationMaps: Uint8Array[];
      mouzaMaps: Uint8Array[];
      sketchMaps: Uint8Array[];
      cadastralMaps: Uint8Array[];
    }
  ): Promise<Uint8Array> {
    // ══════════════════════════════════════════════════════════════════════
    // PAGE 1: Header + Application Details + Location Details (Part 1)
    // ══════════════════════════════════════════════════════════════════════
    this.drawAnnapurnaHeader(fields.refNo || '', fields.reportDate || '');

    // Section 1: Application Details
    this.drawUnderlinedSectionHeader('Application Details:');
    this.drawKeyValueRow([
      { label: 'File No. / LAN No. / Lead No.', value: fields.fileNo || 'NA', labelWidth: 140, valueWidth: 110 },
      { label: 'Date of Visit', value: fields.dateOfVisit || 'NA', labelWidth: 110, valueWidth: CONTENT_W - 360 },
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Applicant & No.', value: fields.applicantName || 'NA', labelWidth: 140, valueWidth: 110 },
      { label: 'Contact Person Name & No.', value: fields.contactPerson || 'NA', labelWidth: 110, valueWidth: CONTENT_W - 360 },
    ]);
    this.drawKeyValueRow([
      { label: 'Loan Type (HL/LAP/BT)', value: fields.loanType || 'LAP', labelWidth: 140, valueWidth: 110 },
      { label: 'Person Met on Site & Contact number', value: fields.personMetOnSite || 'NA', labelWidth: 110, valueWidth: CONTENT_W - 360 },
    ]);
    this.drawKeyValueRow([
      { label: 'Name of Property Owner as per Legal Document & No.', value: fields.ownerName || 'NA', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Documents Provided', value: fields.documentsProvided || 'NA', labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    // Section 2: Location Details
    this.drawUnderlinedSectionHeader('Location Details:');
    this.drawKeyValueRow([
      { label: 'Address of Property\n(Address as per Site:)', value: fields.propertyAddressSite || 'NA', labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Locality (Urban, semi-Urban, Rural)', value: fields.locality || 'RURAL', labelWidth: 140, valueWidth: 110 },
      { label: 'Landmark Near By', value: fields.landmark || 'NA', labelWidth: 110, valueWidth: CONTENT_W - 360 },
    ]);
    this.drawKeyValueRow([
      { label: 'Distance from Branch in km', value: fields.distanceFromBranch || 'NA', labelWidth: 140, valueWidth: 110 },
      {
        label: 'LAT/LONG',
        value: `Lat: ${fields.latitude || 'NA'}\nLong: ${fields.longitude || 'NA'}`,
        labelWidth: 110,
        valueWidth: CONTENT_W - 360,
      },
    ]);
    this.drawKeyValueRow([
      { label: 'Legal Address of the Property:\n(As per Title Deed)', value: fields.propertyAddressLegal || 'NA', labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);
    this.drawKeyValueRow([
      { label: 'Floor No. of Property', value: fields.floorNo || 'NA', labelWidth: 140, valueWidth: 110 },
      { label: 'Property State', value: fields.propertyState || 'Odisha', labelWidth: 110, valueWidth: CONTENT_W - 360 },
    ]);

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 2: Location Details (Part 2) + Schedule + NDMA Parameters
    // ══════════════════════════════════════════════════════════════════════
    this.addPage();
    this.drawKeyValueRow([
      { label: 'Property City', value: fields.propertyCity || 'NA', labelWidth: 140, valueWidth: 110 },
      { label: 'Property Pincode', value: fields.propertyPincode || 'NA', labelWidth: 110, valueWidth: CONTENT_W - 360 },
    ]);
    this.drawKeyValueRow([
      { label: 'Address Matching (Yes/No)', value: fields.addressMatching || 'YES', labelWidth: 140, valueWidth: 110 },
      { label: 'Jurisdiction/Local Municipal Body/Development Authority', value: fields.jurisdiction || 'NA', labelWidth: 150, valueWidth: CONTENT_W - 400 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Holding Type (Freehold/Leasehold)', value: fields.holdingType || 'FREE HOLD', labelWidth: 140, valueWidth: 110 },
      { label: 'Marketability (POOR/FAIR/GOOD)', value: fields.marketability || 'FAIR', labelWidth: 110, valueWidth: CONTENT_W - 360 },
    ]);
    this.drawKeyValueRow([
      { label: 'Property Occupied by (Self/Tenant/Vacant/Under Construction)', value: fields.occupiedBy || 'Self', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Type of the Property (Flat/Independent House/Commercial Building/Commercial Unit/Industrial/Vacant Plot)', value: fields.propertyType || 'Commercial Building', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Occupancy Status SORP/SOCP/Rented/Vacant (Please mention only one)', value: fields.occupancyStatus || 'SORP', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);

    // Section 3: Schedule of the Property
    this.drawUnderlinedSectionHeader('Schedule of the Property:');
    this.drawDataTable(
      ['Schedule of the Property', 'As per legal documents', 'As per site visit', 'As Per Sketch Map'],
      [
        ['North', fields.northLegal || 'Not mentioned', fields.northSite || 'NA', fields.northSketch || 'NA'],
        ['East', fields.eastLegal || 'Not mentioned', fields.eastSite || 'NA', fields.eastSketch || 'NA'],
        ['West', fields.westLegal || 'Not mentioned', fields.westSite || 'NA', fields.westSketch || 'NA'],
        ['South', fields.southLegal || 'Not mentioned', fields.southSite || 'NA', fields.southSketch || 'NA'],
      ],
      [120, 125, 125, CONTENT_W - 370]
    );
    this.drawKeyValueRow([
      { label: 'Boundaries Matching (Yes/No)', value: fields.boundariesMatching || 'Boundary is matching', labelWidth: 140, valueWidth: 110 },
      { label: 'Property Identified (Yes/No)', value: fields.propertyIdentified || 'Yes', labelWidth: 110, valueWidth: CONTENT_W - 360 },
    ]);
    this.drawKeyValueRow([
      { label: 'Approach Road Size (<5ft/5-10ft/10-15ft/>15ft)', value: fields.approachRoadSize || '>20 FT', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);

    // Section 4: NDMA Parameters
    this.drawUnderlinedSectionHeader('NDMA Parameters:');
    const cW = Math.floor(CONTENT_W / 3);
    const lW = 85;
    const vW = cW - lW;
    const lastW = CONTENT_W - (cW * 2);

    this.drawKeyValueRow([
      { label: 'Nature of Building/Wing', value: fields.natureOfBuilding || 'RCC', labelWidth: lW, valueWidth: vW },
      { label: 'Plan Aspect Ratio', value: fields.planAspectRatio || 'NA', labelWidth: lW, valueWidth: vW },
      { label: 'Structure Type', value: fields.structureType || 'RCC', labelWidth: lW, valueWidth: lastW - lW },
    ]);
    this.drawKeyValueRow([
      { label: 'Projected Parts Available', value: fields.projectedParts || 'NA', labelWidth: lW, valueWidth: vW },
      { label: 'Type of Masonry', value: fields.masonryType || 'BRICK', labelWidth: lW, valueWidth: vW },
      { label: 'Expansion Joints Available', value: fields.expansionJoints || 'No', labelWidth: lW, valueWidth: lastW - lW },
    ]);
    this.drawKeyValueRow([
      { label: 'Roof Type', value: fields.roofType || 'RCC', labelWidth: lW, valueWidth: vW },
      { label: 'Steel Grade', value: fields.steelGrade || 'FE 450', labelWidth: lW, valueWidth: vW },
      { label: 'Mortar Type', value: fields.mortarType || 'NA', labelWidth: lW, valueWidth: lastW - lW },
    ]);
    this.drawKeyValueRow([
      { label: 'Concrete Grade', value: fields.concreteGrade || 'NA', labelWidth: lW, valueWidth: vW },
      { label: 'Environment Exposure', value: fields.environmentExposure || 'Mild', labelWidth: lW, valueWidth: vW },
      { label: 'Footing Type', value: fields.footingType || 'NA', labelWidth: lW, valueWidth: lastW - lW },
    ]);
    this.drawKeyValueRow([
      { label: 'Seismic Zone', value: fields.seismicZone || 'II&III', labelWidth: lW, valueWidth: vW },
      { label: 'Soil liquefiable', value: fields.soilLiquefiable || 'No', labelWidth: lW, valueWidth: vW },
      { label: 'Coastal Reg. Zone', value: fields.coastalRegulatoryZone || 'NO', labelWidth: lW, valueWidth: lastW - lW },
    ]);
    this.drawKeyValueRow([
      { label: 'Soil Slope Vulnerable', value: fields.soilSlopeVulnerable || 'NA', labelWidth: lW, valueWidth: vW },
      { label: 'Flood Prone Area', value: fields.floodProneArea || 'No', labelWidth: lW, valueWidth: vW },
      { label: 'Ground Slope >20%', value: fields.groundSlopeMoreThan20 || 'No', labelWidth: lW, valueWidth: lastW - lW },
    ]);

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 3: NDMA (Fire exit) + Approved Plan + Technical Details
    // ══════════════════════════════════════════════════════════════════════
    this.addPage();
    this.drawKeyValueRow([
      { label: 'Fire Exit', value: fields.fireExit || 'NA', labelWidth: 140, valueWidth: CONTENT_W - 140 },
    ]);

    // Section 5: Approved Plan Details
    this.drawUnderlinedSectionHeader('Approved Plan Details if self-construction case:');
    this.drawKeyValueRow([
      { label: 'Sanctioned Plan Provided (Yes/No)', value: fields.sanctionedPlanProvided || 'NO', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Layout Plan Details: Sanctioned No./Permit No.', value: fields.layoutPlanNo || 'NA', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Construction Plan Details: Sanctioned No/Permit No.', value: fields.constructionPlanNo || 'NA', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Date of Sanction', value: fields.dateOfSanction || 'NA', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Plan Validity', value: fields.planValidity || 'NA', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Approving Authority', value: fields.approvingAuthority || 'NA', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Approved Usages (Residential/Industrial/Commercial/Mixed Usages)', value: fields.approvedUsages || 'NA', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Number of Floor in Building', value: fields.numberOfFloorsInBuilding || 'NA', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);

    // Section 6: Technical Details
    this.drawUnderlinedSectionHeader('Technical Details:');
    this.drawKeyValueRow([
      { label: 'Current Occupant of Property (Owner/Tenant/Vacant)', value: fields.currentOccupant || 'Owner', labelWidth: 180, valueWidth: 90 },
      { label: 'Separate Independent Access (Yes/No)', value: fields.separateAccess || 'NA', labelWidth: 140, valueWidth: CONTENT_W - 410 },
    ]);
    this.drawKeyValueRow([
      { label: 'Accommodation details: Floor wise and Occupancy', value: fields.accommodationDetails || 'G+1', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);

    // Plot Area Details Table
    this.drawDataTable(
      ['Plot Area Details', 'As Per Documents', 'As Per Site Visit', 'As Per Plan/Sketch map'],
      [
        ['East', fields.eastDocs || 'NA', fields.eastSiteMeas || 'NA', fields.eastPlan || 'NA'],
        ['West', fields.westDocs || 'NA', fields.westSiteMeas || 'NA', fields.westPlan || 'NA'],
        ['North', fields.northDocs || 'NA', fields.northSiteMeas || 'NA', fields.northPlan || 'NA'],
        ['South', fields.southDocs || 'NA', fields.southSiteMeas || 'NA', fields.southPlan || 'NA'],
        ['Land Area (In Sqft.)', fields.landAreaDocs || 'NA', fields.landAreaSite || 'NA', fields.landAreaPlan || 'NA'],
      ],
      [120, 125, 125, CONTENT_W - 370]
    );

    // BAU Area Details Table
    const floorsData = fields.bauFloors && fields.bauFloors.length > 0 ? fields.bauFloors : [
      { floor: 'Basement/Stilt Floor', rooms: 'NA', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
      { floor: 'GROUND FLOOR', rooms: '2', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
      { floor: 'First Floor', rooms: 'NA', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
    ];
    this.drawDataTable(
      ['BAU Area Details', 'No. of Rooms', 'No. of Kitchens', 'No. of Bathroom', 'Sanctioned Usages', 'Actual Usage'],
      floorsData.map(f => [f.floor, f.rooms, f.kitchens, f.bathrooms, f.sanctionedUsage, f.actualUsage]),
      [110, 70, 75, 75, 85, CONTENT_W - 415]
    );

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 4: FSI Details + Valuation Table + Remarks
    // ══════════════════════════════════════════════════════════════════════
    this.addPage();
    this.drawDataTable(
      ['Items', 'Permissible area as per plan', 'Land Component', 'Permissible FSI', 'Permissible constr. FSI', 'Actual constr. (BUA)', 'Consider constr. (BUA)'],
      [[
        'Building Area',
        fields.permissibleAreaPlan || 'NA',
        fields.landComponent || 'NA',
        fields.permissibleFsi || 'NA',
        fields.permissibleConstructionFsi || 'NA',
        fields.actualConstructionBua || 'NA',
        fields.considerConstructionBua || 'NA',
      ]],
      [70, 75, 75, 65, 75, 75, CONTENT_W - 435]
    );
    this.drawKeyValueRow([
      { label: 'Risk of Demolition (High/Medium/Low)', value: fields.riskOfDemolition || 'LOW', labelWidth: 250, valueWidth: CONTENT_W - 250 },
    ]);
    this.drawKeyValueRow([
      { label: 'Status of the Property (Plot/Under Construction/ Completed/ Construction on Hold)', value: fields.propertyStatus || 'COMPLETED', labelWidth: 200, valueWidth: 90 },
      { label: '100% Completed', value: fields.completedPct || 'NA', labelWidth: 80, valueWidth: 40 },
      { label: '100% Recommended', value: fields.recommendedPct || 'NA', labelWidth: 80, valueWidth: CONTENT_W - 490 },
    ]);
    this.drawKeyValueRow([
      { label: 'Current Age of Property', value: fields.currentAge || 'NA', labelWidth: 140, valueWidth: 110 },
      { label: 'Residual Age', value: fields.residualAge || 'NA', labelWidth: 110, valueWidth: CONTENT_W - 360 },
    ]);

    // Section 7: Valuation
    this.drawUnderlinedSectionHeader('Valuation:');
    this.drawDataTable(
      ['Items', 'Area Details in Sq. Ft.', 'Rate per Sq. Ft.', 'Total Values in Rupees'],
      [
        ['Land Value', fields.landAreaSqft || 'NA', fields.landRateSqft ? `Rs. ${fields.landRateSqft}/-` : 'NA', fields.landTotalValue ? `Rs. ${fields.landTotalValue}/-` : 'NA'],
        ['BUA Value RCC GF', fields.buaAreaSqft || 'NA', fields.buaRateSqft ? `Rs. ${fields.buaRateSqft}/-` : 'NA', fields.buaTotalValue ? `Rs. ${fields.buaTotalValue}/-` : 'NA'],
        ['Market Value After Completion (In Rs.)', '', '', fields.marketValue ? `Rs. ${fields.marketValue}/-` : 'NA'],
        [`Distressed/Force Value (${fields.distressedPct || '80'}%) (In Rs.)`, '', '', fields.distressedValue ? `Rs. ${fields.distressedValue}/-` : 'NA'],
        ['Government/Circle Rate Value', '', '', fields.govtRate ? `Rs. ${fields.govtRate}/- PER SQFT` : 'NA'],
      ],
      [160, 110, 110, CONTENT_W - 380]
    );

    this.drawKeyValueRow([
      { label: 'In Municipal/Development Authority Demolition list (Yes/No)', value: fields.inDemolitionList || 'NO', labelWidth: 280, valueWidth: CONTENT_W - 280 },
    ]);
    this.drawKeyValueRow([
      { label: 'Is Property in Negative Area (Yes/No)', value: fields.inNegativeArea || 'NO', labelWidth: 280, valueWidth: CONTENT_W - 280 },
    ]);

    // Remarks box
    this.drawRemarksBox('Remarks', fields.remarks || 'No specific remarks.');

    // ══════════════════════════════════════════════════════════════════════
    // PAGE 5: Additional Checks + Declaration + Signatures
    // ══════════════════════════════════════════════════════════════════════
    this.addPage();
    this.drawUnderlinedSectionHeader('Additional checks of properties:');
    this.drawKeyValueRow([
      { label: 'Approach Road to the property (Single lane/Double lane/Four lane)', value: fields.approachRoadType || 'SINGLE LANE', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Development of surrounding area as to property {Developed(Over 80% units occupied)/ (Underdeveloped(Less than 80% units occupied)}', value: fields.surroundingAreaDevelopment || 'SURROUNDING 30%-40% DEVELOPING', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Distance from city centre in Kms', value: fields.distanceFromCityCentre || 'NA', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Distance from corporation limits in Kms/Bus stop in case where there is no Municipal body', value: fields.distanceFromCorpLimits || 'NA', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Electricity (Available/Not available)', value: fields.electricity || 'YES', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Electricity Distributor (Govt./Semi-Govt./Private)', value: fields.electricityDistributor || 'NA', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Water supply (Available/Not Available)', value: fields.waterSupply || 'NA', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Water Distributor (Govt./ Self/ Boring water)', value: fields.waterDistributor || 'NA', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Sewer provision (Yes/No)', value: fields.sewerProvision || 'NA', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Sewer line connected to main sewer (Yes/No)', value: fields.sewerConnected || 'NA', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);
    this.drawKeyValueRow([
      { label: 'Any demolition threat in future development/expansion (Yes/No)', value: fields.futureDemolitionThreat || 'NA', labelWidth: 260, valueWidth: CONTENT_W - 260 },
    ]);

    // Section 9: Declaration
    this.cursorY += 12;
    this.checkPageBreak(120);

    const declY = this.pdfY(this.cursorY);
    const declW = CONTENT_W;
    const declH = 140;

    // Outer border
    this.page.drawRectangle({
      x: MARGIN_L,
      y: declY - declH,
      width: declW,
      height: declH,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    // Left label cell
    this.page.drawRectangle({
      x: MARGIN_L,
      y: declY - declH,
      width: 120,
      height: declH,
      color: hexToRgb(LBL_BG),
      opacity: BG_OPACITY,
      borderColor: rgb(0, 0, 0),
      borderWidth: BORDER_W,
    });

    this.page.drawText('Declaration\n(I hereby\ndeclare that)', {
      x: MARGIN_L + 6,
      y: declY - 24,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
      lineHeight: 14,
    });

    // Declaration 5 Clauses
    const clauses = [
      'The final valuation has been concluded basis Land & Building valuation approach and rates are cross verified with the rates Prevalent in the nearby localities.',
      'We have no direct/indirect interest in the property valued.',
      'The information furnished in the report is true and correct to the best of my knowledge.',
      `Mr. ${fields.visitingEngineer || 'Visiting Engineer'} has visited the property on dated ${fields.dateOfVisit || '...'} & provide the data as collected during site inspection.`,
      'I have not been convicted of any offence and sentenced to a term of Imprisonment.',
    ];

    let bulletY = declY - 14;
    for (const clause of clauses) {
      const wrapped = this.wrapText(clause, declW - 145, FONT_SIZE_SMALL, false);
      this.page.drawText('•', {
        x: MARGIN_L + 128,
        y: bulletY,
        size: FONT_SIZE_SMALL,
        font: this.fontBold,
        color: rgb(0, 0, 0),
      });

      let lineY = bulletY;
      for (const line of wrapped) {
        this.page.drawText(line, {
          x: MARGIN_L + 138,
          y: lineY,
          size: FONT_SIZE_SMALL,
          font: this.fontRegular,
          color: rgb(0, 0, 0),
        });
        lineY -= FONT_SIZE_SMALL * 1.25;
      }
      bulletY = lineY - 3;
    }

    this.cursorY += declH + 16;

    // Date & Place & Signature Block
    const signY = this.pdfY(this.cursorY);
    this.page.drawText(`Date: ${this.sanitizeText(fields.reportDate || '...')}`, {
      x: MARGIN_L,
      y: signY - 10,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    this.page.drawText(`Place: ${this.sanitizeText(fields.place || 'Bhubaneswar')}`, {
      x: MARGIN_L,
      y: signY - 26,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });

    // Valuer signature on right
    const sigTitle = 'S MOHANTY ASSOCIATES';
    const sigSub = 'VALUER & CHARTERED ENGINEER';
    const sigW = this.fontBold.widthOfTextAtSize(sigTitle, FONT_SIZE);
    this.page.drawText(sigTitle, {
      x: MARGIN_L + CONTENT_W - sigW,
      y: signY - 10,
      size: FONT_SIZE,
      font: this.fontBold,
      color: rgb(0, 0, 0),
    });
    const sigSubW = this.fontRegular.widthOfTextAtSize(sigSub, FONT_SIZE_SMALL);
    this.page.drawText(sigSub, {
      x: MARGIN_L + CONTENT_W - sigSubW,
      y: signY - 24,
      size: FONT_SIZE_SMALL,
      font: this.fontRegular,
      color: rgb(0, 0, 0),
    });

    this.cursorY += 40;

    // ══════════════════════════════════════════════════════════════════════
    // PAGES 6+: MAPS & PHOTOGRAPHS IN THE STRICT ORDER REQUESTED:
    // 1. PHOTOGRAPHS OF THE PROPERTY
    // 2. GOOGLE SATELLITE MAP
    // 3. MOUZA MAP
    // 4. SKETCH MAP
    // 5. CADASTRAL MAP
    // ══════════════════════════════════════════════════════════════════════

    // 1. PHOTOGRAPHS OF THE PROPERTY
    if (images.photos && images.photos.length > 0) {
      await this.drawPhotoGrid(images.photos, 'PHOTOGRAPHS OF PROPERTY');
    }

    // 2. GOOGLE SATELLITE MAP
    if (images.locationMaps && images.locationMaps.length > 0) {
      await this.drawMapGallery(images.locationMaps, 'GOOGLE SATELLITE MAP', 260);
    }

    // 3. MOUZA MAP
    if (images.mouzaMaps && images.mouzaMaps.length > 0) {
      await this.drawMapGallery(images.mouzaMaps, 'MOUZA MAP', 260);
    }

    // 4. SKETCH MAP
    if (images.sketchMaps && images.sketchMaps.length > 0) {
      await this.drawMapGallery(images.sketchMaps, 'SKETCH MAP', 260);
    }

    // 5. CADASTRAL MAP
    if (images.cadastralMaps && images.cadastralMaps.length > 0) {
      await this.drawMapGallery(images.cadastralMaps, 'CADASTRAL MAP', 260);
    }

    // 6. ANNEXURES (if any)
    if (fields.annexures && fields.annexures.length > 0) {
      this.renderAnnexures(fields.annexures);
    }

    return this.save();
  }
}
