/**
 * PDFAdityaBirlaHousingRenderer — Dedicated PDF renderer for Aditya Birla Housing Finance Ltd (HL-LAP).
 * Extends PDFBankRenderer to inherit base margins, typography, transparent color palette,
 * Form XObject letterhead watermark, and key-value/table rendering primitives.
 *
 * Architecture: Two-file pattern (same as MLAP, STSL, Annapurna):
 *   1. This renderer class in src/lib/banks/
 *   2. Self-contained .tsx component in banks/aditya-birla-housing/
 */

import { PDFBankRenderer } from '../pdf-bank-renderer';

export interface HLLAPReportFields {
  // Header Details
  dealNumber?: string;
  assetId?: string;
  branchName?: string;
  typeOfCase?: string;
  valuerName?: string;
  productType?: string;
  valuerRefNo?: string;
  refNo?: string;
  dateOfVisit?: string;
  valuerFeedback?: string;
  dateOfReport?: string;
  contactedPerson?: string;
  relationWithCustomer?: string;
  contactNo?: string;

  // Basic Details
  ownerName?: string;
  ownerAddress?: string;
  loanApplicationNo?: string;
  originallyTypeOfProperty?: string;
  currentUsage?: string;
  addressAsPerRequest?: string;
  addressAsPerDocument?: string;
  addressAsPerSite?: string;
  projectColonyLayoutName?: string;
  unitFlatBungalowPlotHouseNo?: string;
  floorNo?: string;
  buildingName?: string;
  wingName?: string;
  khasraNo?: string;
  closeVicinityLandmark?: string;
  streetName?: string;
  villageName?: string;
  city?: string;
  stateName?: string;
  state?: string;
  mainLocalityOfProperty?: string;
  subLocality?: string;
  pinCodeOfProperty?: string;
  latitude?: string;
  longitude?: string;
  valuedBefore?: string;
  valuedBeforeDetails?: string;

  // Surrounding & Locality Details
  locationType?: string;
  localityLevel?: string;
  siteDevStatus?: string;
  proximityToCivicAmenities?: string;
  railwayStationDistance?: string;
  busStopDistance?: string;
  distanceFromCityCentre?: string;
  natureOfApproachRoad?: string;
  approachRoadWidth?: string;
  approachAsPerSite?: string;
  approachAsPerDocs?: string;
  securityObservation?: string;

  // Property Details
  occupiedBy?: string;
  nameOfOccupant?: string;
  noOfTenants?: string;
  relationWithApplicant?: string;
  propertyDemarcation?: string;
  propertyIdentifiedYN?: string;
  propertyIdentifiedThrough?: string;
  typeOfStructure?: string;
  landPlotAreaUDS?: string;
  noOfBlocks?: string;
  noOfUnitsOnEachFloor?: string;
  noOfFloors?: string;
  noOfLifts?: string;
  amenitiesAvailable?: string;
  deliveryAgency?: string;
  propertyLocatedOnFloor?: string;
  unitConfiguration?: string;
  carpetArea?: string;
  sbuaOf?: string;
  viewFromProperty?: string;
  constructionQualityExteriors?: string;
  constructionQualityInteriors?: string;
  ageOfProperty?: string;
  residualAge?: string;

  // Sanction Plan & Documents
  sanctionPlanAvailable?: string;
  layoutPlanApprovalNo?: string;
  layoutPlanDateOfApproval?: string;
  layoutPlanExpiryDate?: string;
  layoutPlanSanctioningAuthority?: string;
  buildingPlanApprovalNo?: string;
  buildingPlanDateOfApproval?: string;
  buildingPlanExpiryDate?: string;
  buildingPlanSanctioningAuthority?: string;
  constructionPermissionApprovalNo?: string;
  constructionPermissionDateOfApproval?: string;
  constructionPermissionExpiryDate?: string;
  constructionPermissionSanctioningAuthority?: string;
  constructionCertificateApprovalNo?: string;
  constructionCertificateDateOfApproval?: string;
  constructionCertificateExpiryDate?: string;
  constructionCertificateSanctioningAuthority?: string;
  constructionCommencementDate?: string;
  expectedCompletionDate?: string;
  ownershipType?: string;
  propertyDocsVerification?: string;
  propertyJurisdiction?: string;
  permissibleZoning?: string;
  usageAsPerSite?: string;

  // Setbacks & BUA
  demolitionList?: string;
  setbackFrontPlan?: string;
  setbackFrontSite?: string;
  setbackSide1Plan?: string;
  setbackSide1Site?: string;
  setbackSide2Plan?: string;
  setbackSide2Site?: string;
  setbackRearPlan?: string;
  setbackRearSite?: string;
  buaFloor1Name?: string;
  buaFloor1Plan?: string;
  buaFloor1Site?: string;
  buaFloor2Name?: string;
  buaFloor2Plan?: string;
  buaFloor2Site?: string;
  buaFloor3Name?: string;
  buaFloor3Plan?: string;
  buaFloor3Site?: string;
  totalBuaPlan?: string;
  totalBuaSite?: string;

  // Valuation Details
  propertyTypeBungalow?: string;
  landAreaMeasurement?: string;
  landAreaValue?: string;
  landAreaRatePerUnit?: string;
  landAreaAmount?: string;
  parkingStiltBuaUnit?: string;
  parkingStiltBuaArea?: string;
  parkingStiltBuaRate?: string;
  parkingStiltBuaAmount?: string;
  buaSbuaUnit?: string;
  buaSbuaArea?: string;
  buaSbuaRate?: string;
  buaSbuaAmount?: string;
  constructionProgress?: string;
  percentCompletion?: string;
  percentRecommendation?: string;
  noOfCarParks?: string;
  carParkingCharges?: string;
  edcIdcLumpsum?: string;
  plcChargesLumpsum?: string;
  powerBackup?: string;
  interiorsAmenities?: string;
  interiorsPercentCompletion?: string;
  totalComponentA?: string;
  totalComponentB?: string;
  totalMarketValueOnCompletion?: string;
  totalMarketValueOnCompletionWords?: string;
  totalMarketValueAsOnDate?: string;
  guidelineValueOfProperty?: string;
  distressSaleValue?: string;
  approxRentals?: string;

  // Boundaries
  boundaryDocsNorth?: string;
  boundaryDocsEast?: string;
  boundaryDocsSouth?: string;
  boundaryDocsWest?: string;
  boundaryApprovedNorth?: string;
  boundaryApprovedEast?: string;
  boundaryApprovedSouth?: string;
  boundaryApprovedWest?: string;
  boundaryAtSiteNorth?: string;
  boundaryAtSiteEast?: string;
  boundaryAtSiteSouth?: string;
  boundaryAtSiteWest?: string;
  boundariesMatching?: string;

  // Remarks & Declaration
  remarks?: string;
  remarksText?: string;
  declarationText?: string;

  // Photos & Maps
  propertyImages?: string[];
  propertyImageNames?: string[];
  locationMapImage?: string;

  [key: string]: any;
}

export class PDFAdityaBirlaHousingRenderer extends PDFBankRenderer {
  // Inherits all core bank report methods from PDFBankRenderer:
  // - init(letterheadBytes)
  // - drawMainHeader(title)
  // - drawSectionHeader(title)
  // - drawKeyValueRow(cols)
  // - drawSimpleRow(label, value)
  // - drawTable(headers, rows, colWidths, highlightedCols, labelCols)
  // - drawRemarksBox(label, text)
  // - drawImageSection(imageBytes, caption, maxH)
  // - drawPhotoGrid(photos)
  // - save() / toBlob()
}

export default PDFAdityaBirlaHousingRenderer;
