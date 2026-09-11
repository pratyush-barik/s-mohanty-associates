/**
 * pdf-axis-agri-renderer.ts — Dedicated PDF renderer and types for Axis Bank (AGRI).
 *
 * Implements the statutory VALUATION REPORT FORMAT (NON-AGRI) handled under Axis Agri:
 * - Ref No format: SMA/MM/YYYY/XX
 * - Strict DD/MM/YYYY dates via formatReportDate()
 * - Individual 8-box approval date cells [ D | D | M | M | Y | Y | Y | Y ]
 * - Dual boundary verification/document matrix
 * - Dynamic floor plinth area & usage table
 * - Auto-calculated depreciation and market value matrix
 * - 12-item valuation report checklist with signature block
 */

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
  formatReportDate,
} from '../pdf-bank-renderer';

export interface AxisAgriFloorItem {
  floorName: string; // e.g. 'Basement', 'Stilt', 'Ground Floor', 'First Floor', 'Second Floor'
  plinthArea: string; // sq.ft.
  usage: string; // e.g. 'Residential', 'Commercial', 'Parking', 'Storage'
  roofHeight?: string; // e.g. "10'-6\""
  ageYears?: string; // e.g. "8Yrs"
  replacementRate?: string; // e.g. "1500.00"
  estimatedCost?: string; // e.g. "787500.00"
  depreciationAmount?: string; // e.g. "63000.00"
  netValue?: string; // e.g. "724500.00"
}

export interface AxisAgriReportFields {
  // Page 1: Header & Technical Initiation
  refNo?: string; // e.g. SMA/08/2026/07
  reportDate?: string; // DD/MM/YYYY
  reportTitle?: string; // VALUATION REPORT FORMAT (NON-AGRI)
  dateOfVisit?: string; // DD/MM/YYYY
  reportInitiatedByArea?: string; // e.g. Purusottampur, Ganjam
  nameOfArea?: string; // e.g. Purusottampur, Ganjam
  ownerNameAndAddress?: string; // e.g. Mr. Babula Behera S/O...
  borrowerNameAndAddress?: string; // e.g. M/S. MAA TARINI ENTERPRISERS
  proposalNo?: string; // e.g. Not Available
  representativeNameMobile?: string; // e.g. Local People

  // Page 1: Details of Property Being Valued
  locationOfProperty?: string; // 'Rural' | 'Semi Urban' | 'Urban'
  documentsProvided?: string[]; // ['Copy of Sale Deed', 'Bhu-Naksha', 'Approved Plan', 'Commencement Certificate', 'Occupancy Certificate', 'ROR', 'Previous Valuation Report']
  plotKhataDetails?: string; // Khata No, Plot No, Kissam, Mouza, Ps, Ts, Dist
  roadFacilityAtSite?: string; // e.g. 20-ft wide Road
  colonyNagarSector?: string; // e.g. Purusottampur, Ganjam
  localityLandmark?: string; // e.g. The property is situated nearer to Purusottampur Achhuli chaka
  villageTownCityMarket?: string; // e.g. Village
  district?: string; // e.g. Ganjam
  state?: string; // e.g. Odisha
  pincode?: string; // e.g. 761018
  distanceFromAreaOffice?: string; // e.g. 2 Kms away from Purusottampur area office
  latitude?: string; // e.g. 19.511361
  longitude?: string; // e.g. 84.907833
  coordinates?: string; // e.g. 19°30'40.9"N 84°54'28.2"E

  // Page 1 & 2: Type of Property & Site Topography
  typeOfPropertyPlot?: string; // 'NA' | 'Residential' | 'Commercial' | 'Industrial'
  levelOfLand?: string; // e.g. Existing Road Level
  situatedInMunicipalLimit?: string; // 'Yes' | 'No'
  municipalLimitDetails?: string; // e.g. (Within Achhuli Gram Panchayat area limit)
  constructionObservedOnPlot?: string; // 'Yes' | 'No'
  residentialPropertyType?: string; // 'Residential'
  residentialPropertySubtype?: string; // 'Independent house' | 'Bungalow' | 'Row House' | 'Flat' | 'Commercial'
  civicAmenities?: string; // 'Available within the radius of 2-3 Kms' | 'Not Available'
  commercialPropertyType?: string; // 'Commercial'
  commercialPropertySubtype?: string; // 'Independent house' | 'Row House' | 'Unit in a mall' | 'Godown' | 'Industrial' | 'Shop'
  availabilityLocalTransport?: string[]; // ['Metro', 'Local Train', 'Bus', 'Personal Transport']
  distanceFromRailwayStation?: string; // e.g. 27 Km from Khallikote
  busStopTaxiStand?: string; // e.g. Within 2-3 Kms
  independentApproachRoad?: string; // 'Yes' | 'No'
  accommodateFireExtinguisher?: string; // 'Yes' | 'No'
  landLockedArea?: string; // 'Yes' | 'No'
  corneredOrIntermittent?: string; // 'Intermittent plot'
  corneredOrIntermittentVal?: string; // 'Yes' | 'No'

  // Page 2: Boundaries (As per Verification vs As per Document)
  boundaryEastVerification?: string;
  boundaryEastDocument?: string;
  boundaryWestVerification?: string;
  boundaryWestDocument?: string;
  boundaryNorthVerification?: string;
  boundaryNorthDocument?: string;
  boundarySouthVerification?: string;
  boundarySouthDocument?: string;

  // Page 2: Locality, Infrastructure & Usage
  classOfLocality?: string; // 'Posh' | 'Higher Middle Class' | 'Middle class' | 'Lower middle Class' | 'Poor'
  qualityOfInfrastructure?: string; // 'Excellent' | 'Good' | 'Average' | 'Poor'
  ownershipStatus?: string; // 'Free Hold' | 'Reg. Lease' | 'Govt. Authority'
  approvedUsage?: string[]; // ['Industrial', 'commercial', 'Residential', 'Mix']
  actualUsage?: string[]; // ['Industrial', 'Commercial', 'Residential', 'Mix']
  restrictiveCovenants?: string; // 'Not Applicable'
  typeOfStructure?: string; // 'Load Bearing/RCC/GCI/Aluform shuttering'
  noOfFloors?: string; // 'G+2 Storied building'
  occupancyDetails?: string; // 'Self-Occupied' | 'Rented' | 'Vacant'
  tenantName?: string; // 'NA'
  yearsInTenancy?: string; // 'NA'
  resistanceForValuation?: string; // 'No'
  resistanceFromOccupants?: string; // 'No'
  basicAmenities?: string[]; // ['Electricity', 'Water', 'Drainage connection']
  developmentSurroundingArea?: string; // 'Underdeveloped' | 'Developing' | 'Developed'

  // Page 2: Leasehold Details
  isLeasehold?: string; // 'The Property is Free Hold Land'
  lessorName?: string; // 'NA'
  natureOfLease?: string; // 'NA'
  totalPeriodOfLease?: string; // 'NA'
  leaseholdOccupantsResistance?: string; // 'No'
  leaseholdBasicAmenities?: string[];
  leaseholdDevelopment?: string;

  // Page 2 & 3: Statutory Approvals
  reraRegNo?: string; // 'Not Applicable.'
  occupancyCertificate?: string; // 'Not Available'
  layoutApprovalNo?: string; // 'Not Mentioned'
  layoutApprovalDate?: string; // DDMMYYYY (8 chars)
  layoutExpiryDate?: string; // DDMMYYYY (8 chars)
  buildingPlanApprovalNo?: string; // 'Not Available'
  buildingPlanApprovalDate?: string; // DDMMYYYY (8 chars)
  buildingPlanExpiryDate?: string; // DDMMYYYY (8 chars)

  // Page 3: Construction & Floor-Wise Breakdown
  areaOfPlotRor?: string; // Total Area = Ac.0.013 Dec i.e. 566.00 Sft
  areaOfPlotDoc?: string; // Total Area = Ac.0.013 Dec i.e. 566.00 Sft
  approvedBUA?: string; // 'Not Available'
  actualBUA?: string; // RCC GF: 525.00 Sft RCC FF: 525.00 Sft RCC SF: 204.00 Sft Total BUA: 1254.00 Sft
  demarcationAtSite?: string; // 'Yes' | 'No'
  floors?: AxisAgriFloorItem[];
  totalBUA?: string; // e.g. 1254.00 Sft
  totalCarpetArea?: string; // e.g. 1090.00 Sft (Approx.)
  totalSaleableArea?: string; // e.g. 566.00 Sft (Land) & 1254.00 Sft (Building)
  amenitiesDetails?: string; // 'Nil'
  farPermissibleUtilized?: string; // 'FAR:2.21'
  constructionAsPerApprovedPlan?: string; // 'Plan is not Available'
  extraConstructionDetails?: string; // 'Not Applicable'
  extraConstructionPercentage?: string; // 'Not Applicable'
  extraConstructionCompoundable?: string; // 'Not Applicable'
  qualityOfConstruction?: string; // 'Good' | 'Average' | 'Poor'
  maintenanceOfProperty?: string; // 'Good' | 'Average' | 'Poor'

  // Page 4: Building Condition, Life & Land Rate
  conditionOfBuilding?: string; // 'Good'
  currentLifeStructure?: string; // '8 Years'
  projectedLifeStructure?: string; // '52 Years'
  landRevenueTaxesPaid?: string; // 'Recent rent receipt is not provided'
  municipalTaxesPaid?: string; // 'Not Applicable'
  govtBenchmarkRateAcre?: string; // '86,55,000'
  govtBenchmarkRateSft?: string; // '199'
  totalLandAreaDec?: string; // '0.013'
  totalLandAreaSft?: string; // '566.00'
  totalGovtValueLand?: string; // '1,12,634.00'
  prevailingMarketRateMin?: string; // '500'
  prevailingMarketRateMax?: string; // '600'
  adoptedMarketRateSft?: string; // '550'
  totalMarketValueLand?: string; // '5,98,950.00'

  // Page 4: Building Basic Valuation
  totalBasicValueBuilding?: string; // '21,96,285.00'
  totalBasicValueBuildingSay?: string; // '21,96,000.00'
  totalBasicValueBuildingWords?: string; // 'RUPEES TWENTY ONE LAKHS NINETY SIX THOUSANDS ONLY'

  // Page 5: Value of Property Summary Table
  govtGuideLand?: string;
  govtGuideBuilding?: string;
  govtGuideAmenities?: string;
  govtGuideTotal?: string;
  marketValueLand?: string;
  marketValueBuilding?: string;
  marketValueAmenities?: string;
  marketValueTotal?: string;
  realisableValueLand?: string;
  realisableValueBuilding?: string;
  realisableValueAmenities?: string;
  realisableValueTotal?: string;
  distressValueLand?: string;
  distressValueBuilding?: string;
  distressValueAmenities?: string;
  distressValueTotal?: string;
  insurableValueLand?: string;
  insurableValueBuilding?: string;
  insurableValueAmenities?: string;
  insurableValueTotal?: string;

  // Page 5 & 6: Narratives & Remarks
  realizableEstimationText?: string;
  marketValueSay?: string;
  marketValueWords?: string;
  realizableValueSay?: string;
  realizableValueWords?: string;
  distressValueSay?: string;
  distressValueWords?: string;
  basisOfValuation?: string;
  opinionOfMarketValue?: string;
  remarksText?: string;
  undertakingText?: string;
  annexureARegardingLand?: string;
  annexureARegardingBuilding?: string;
  annexureABasisLandRate?: string;

  // Page 10: Check List & Images
  checklistResponses?: Record<string, string>;
  propertyPhotos?: any[];
  locationMapImages?: any[];
  cadastralMapImages?: any[];
}

export class PDFAxisAgriRenderer extends PDFBankRenderer {
  // Foundation class for Axis Bank AGRI PDF Renderer.
  // Full implementation will follow in 2nd half.
}
