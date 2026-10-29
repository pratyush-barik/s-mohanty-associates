import { formatReportDate, getEarliestFieldVisit } from '../BaseBankReportComponents';

export type KotakHLLAPCategory = 'FLAT' | 'IND' | 'L&B' | 'RES-COM' | 'VL';

export interface KotakAddressSubTable {
  plotOrFlatNo: string;
  floorNo: string;
  wingNo: string;
  buildingName: string;
  sectorLocality: string;
  landmark: string;
  city: string;
  pinCode: string;
}

export interface KotakTechnicalAddress {
  khataNo: string;
  plotNo: string;
  mouza: string;
  tahasil: string;
  district: string;
}

export interface KotakBoundaryVerificationRow {
  direction: 'North' | 'South' | 'East' | 'West';
  asPerSite: string;
  asPerDeed: string;
  asPerSketchMap: string;
}

export interface KotakFloorRow {
  floor: string;
  siteBua: string;
  planBua: string;
}

export interface KotakHLLAPFields {
  // Category Selector
  kotakHllapCategory?: KotakHLLAPCategory;

  // Header & Valuation Date
  reportFormatTitle?: string;
  subHeaderMethod?: string;
  dateOfValuation?: string; // DD/MM/YYYY

  // 1. GENERAL
  purposeOfLoan?: string;
  customerNameAndContact?: string;
  nameOfDocumentHolder?: string;
  dateOfTechnicalVisit?: string; // DD/MM/YYYY
  nameOfProjectSociety?: string;
  builderSellerNameAndRera?: string;
  personMetOnSite?: string;
  postalAddress?: string;

  // 2. PROPERTY
  flatHousePlotNo?: string;
  propertyType?: string;
  valuationMethod?: string;
  constructionStatus?: string;
  stageOfConstructionPct?: string;
  yearBuiltAge?: string;
  residualAge?: string;
  occupancyDetails?: string;
  vacancyTenantTenure?: string;
  noOfStories?: string;
  commentOnNoOfStories?: string;
  totalUnitsMultiStorey?: string;
  noOfUnitsEachFloor?: string;
  unitDetails?: string;
  amenitiesAvailable?: string; // Unique to VL (default: 'Roads')
  encroachmentOnPublicLand?: string; // in Sec 2 for VL, in Sec 4 for others

  // Physical & Technical Addresses
  physicalAddress?: KotakAddressSubTable;
  technicalAddress?: KotakTechnicalAddress;
  legalAddressOfProperty?: string;
  permissibleUseOfBuilding?: string;

  // 3. SURROUNDINGS
  nearestRailwayStation?: string;
  nearestBusStand?: string;
  nearestHospital?: string;
  nearestAirport?: string;
  conditionOfApproachRoad?: string;
  accessToProperty?: string;
  nearbyLandmark?: string;
  classificationOfArea?: string;
  conditionOfLocality?: string;
  classificationTypeOfLocality?: string;
  developmentOfSurroundingAreas?: string;
  withinMunicipalLimits?: string;
  boardOfOtherBankIndicatingMortgage?: string;
  plotDemarcatedAtSite?: string;
  propertyIdentifiedThrough?: string;
  surroundingsSiteNorth?: string;
  surroundingsSiteSouth?: string;
  surroundingsSiteEast?: string;
  surroundingsSiteWest?: string;
  boundaryComparison?: KotakBoundaryVerificationRow[];
  boundariesMatchingWithLegal?: string;
  discrepancyInBoundaries?: string;

  // 4. SURVEY OF CONSTRUCTION (Omitted in VL)
  natureOfSoil?: string;
  typeOfConstruction?: string;
  majorStructuralIrregularities?: string;
  improvementInteriorDecoration?: string;
  natureOfWaterSupply?: string;
  qualityOfConstruction?: string;
  exteriorsFinishing?: string;
  interiorsFinishing?: string;
  typeOfFinishingPaint?: string;
  typeOfSpecificationUsed?: string;
  amenitiesProvidedInBuilding?: string;
  constructionProgressUpTo?: string;
  projectedResidualLife?: string;

  // 5. DOCUMENTS VERIFIED
  approvedLayoutPlansDetails?: string;
  commencementCertificate?: string;
  occupationCompletionCertificate?: string;
  ownershipDocuments?: string;
  allotmentLetterBBA?: string;
  extendedUtilityBills?: string; // For Industrial leaseholds

  // 6. VALUATION REPORT - Land Sub-Table
  areaMeasuredOnSite?: string;
  areaMeasuredBasis?: string; // 'Built up Area' | 'Carpet Area' | 'Super Built up Area' | 'Plot Area'
  grossLandAreaSqFt?: string;
  netLandAreaSiteSqFt?: string;
  netLandAreaPlanSqFt?: string;
  netLandAreaDeedSqFt?: string;
  landAreaSqYdOrMt?: string; // L&B specific e.g. "435 sqft (AC.0.010Decs)"
  udsShare?: string; // Undivided share of land (Acres/Decs/Sqft)
  adoptedLandAreaBasis?: string;
  adoptedLandAreaSqFt?: string;
  adoptedLandRatePerSqFt?: string;
  govtGuidelineRateLand?: string;
  landValueI?: string; // Auto = adoptedLandArea * adoptedLandRate

  // Building Sub-Table (Omitted in VL)
  carpetAreaSiteSqFt?: string;
  carpetAreaPlanSqFt?: string;
  carpetAreaDeedSqFt?: string;
  buaSiteSqFt?: string;
  buaPlanSqFt?: string;
  buaDeedSqFt?: string;
  floorWiseRows?: KotakFloorRow[]; // For IND & L&B
  superBuaSqFt?: string;
  adoptedAreaBasis?: string;
  adoptedAreaSqFt?: string;
  finalAdoptedRatePerSqFt?: string; // For Flat, L&B, Res-Com
  adoptedConstructionMarketRate?: string; // For IND, L&B
  bldgValueGovtGuideline?: string; // For IND
  constructionValuePresentStage?: string; // For IND
  estimatedCostToComplete?: string; // For IND
  depreciationPctPerYear?: string; // L&B specific (e.g. 1.5% per year)
  depreciationTotalAmount?: string; // L&B
  constructionValueIi?: string; // Coupled Building Value (ii)
  marketValueWithoutAmenities?: string; // Adopted Area * Adopted Rate
  marketValuePresentStage?: string;

  // Amenities Sub-Table (Universal Across All 5)
  noOfCarParking?: string;
  valueOfParking?: string;
  valueOfOtherAmenities?: string;
  totalValueOfAmenities?: string; // Auto = Parking + Other Amenities

  // Method Valuation Total
  marketValueAsPerMethod?: string;

  // 7. FINAL VALUES & DECLARATION
  rationaleForValuation?: string;
  finalMarketValue?: string;
  guidelineValue?: string;
  distressedValue?: string; // 80%
  realizableValue?: string; // 90%
  insurableValue?: string; // Omitted in VL
  remarks?: string;

  // Declaration
  visitingEngineerName?: string;
  declarationConfirmed?: boolean;
  partnerStampFile?: any;
  reportDate?: string; // DD/MM/YYYY
  reportPlace?: string;

  // Universal Enclosures (Documents, Maps, Photographs)
  documents?: any[];
  mapImages?: any[];
  photos?: any[];
  selectedPhotos?: any[];
  propertyDocuments?: string[];
  propertyDocumentNames?: string[];
  locationMaps?: string[];
  latitude?: string;
  longitude?: string;
  propertyPhotos?: string[];
  propertyPhotoNames?: string[];
}

export const DEFAULT_BOUNDARY_COMPARISON: KotakBoundaryVerificationRow[] = [
  { direction: 'North', asPerSite: '', asPerDeed: '', asPerSketchMap: '' },
  { direction: 'South', asPerSite: '', asPerDeed: '', asPerSketchMap: '' },
  { direction: 'East', asPerSite: '', asPerDeed: '', asPerSketchMap: '' },
  { direction: 'West', asPerSite: '', asPerDeed: '', asPerSketchMap: '' },
];

export const DEFAULT_FLOOR_ROWS_IND: KotakFloorRow[] = [
  { floor: 'Basement', siteBua: '', planBua: '' },
  { floor: 'Ground Floor', siteBua: '', planBua: '' },
  { floor: 'First Floor', siteBua: '', planBua: '' },
  { floor: 'Second Floor', siteBua: '', planBua: '' },
];

export const DEFAULT_FLOOR_ROWS_LB: KotakFloorRow[] = [
  { floor: 'Ground Floor', siteBua: '', planBua: '' },
  { floor: 'First Floor', siteBua: '', planBua: '' },
];

/**
 * Standard Kotak Declaration Clauses
 */
export const KOTAK_DECLARATION_CLAUSES = [
  '(I) I/We hereby declare that visiting engineer {ENGINEER_NAME} has personally inspected the property on {VISIT_DATE} and that the report has been prepared based on site observations and verification of copies of documents provided to us.',
  '(II) I/We have no direct or indirect interest in the property valued.',
  '(III) The information provided in this report is true and correct to the best of our knowledge and belief.',
  '(IV) The valuation has been carried out in accordance with standard valuation guidelines and bank parameters.',
  '(V) This report is confidential and issued solely for the purpose of credit assessment by Kotak Mahindra Bank.',
];

/**
 * Parses numeric value from a string (handles currency commas, etc.)
 */
export function parseNum(val: any): number {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number to Indian currency string without currency sign
 */
export function formatNum(val: number): string {
  if (!val || isNaN(val)) return '';
  return Math.round(val).toLocaleString('en-IN');
}

/**
 * Extracts and sanitizes default prefill values for Kotak HL-LAP
 */
export function getKotakInitialFields(
  category: KotakHLLAPCategory,
  initialFields: any = {},
  prefill: any = {},
  bucketImages: any[] = [],
  projectCode?: string
): KotakHLLAPFields {
  const earliestVisit = getEarliestFieldVisit(bucketImages, prefill);
  const visitDate = earliestVisit?.date ? formatReportDate(earliestVisit.date) : formatReportDate(new Date());
  const reportDate = formatReportDate(new Date());

  const engName = earliestVisit?.engineerName || prefill?.visitingEngineer || prefill?.assignedEngineerName || '';

  // Extract customer and document holder
  const customerName = prefill?.customerName || prefill?.applicantName || prefill?.clientName || '';
  const customerContact = prefill?.contactNumber || prefill?.applicantPhone || prefill?.mobile || '';
  const customerFull = customerContact ? `${customerName} (${customerContact})` : customerName;

  const docHolder = prefill?.ownerName || prefill?.nameOfDocumentHolder || customerName || '';

  // Address assembly
  const p = prefill || {};
  const physicalAddr: KotakAddressSubTable = {
    plotOrFlatNo: p.flatNo || p.plotNo || '',
    floorNo: p.floorNo || '',
    wingNo: p.wingNo || '',
    buildingName: p.buildingName || p.societyName || '',
    sectorLocality: p.locality || p.sector || '',
    landmark: p.landmark || '',
    city: p.city || 'Bhubaneswar',
    pinCode: p.pinCode || p.pincode || '',
  };

  const technicalAddr: KotakTechnicalAddress = {
    khataNo: p.khataNo || '',
    plotNo: p.plotNo || '',
    mouza: p.mouza || '',
    tahasil: p.tahasil || '',
    district: p.district || 'Khordha',
  };

  const defaultMethodNames: Record<KotakHLLAPCategory, string> = {
    FLAT: 'Flat / Apartment Method',
    IND: 'Industrial Property Method',
    'L&B': 'Land and Building Method',
    'RES-COM': 'Residential cum Commercial Method',
    VL: 'Land Only Method',
  };

  return {
    kotakHllapCategory: category,
    reportFormatTitle: 'REPORT FORMAT (KOTAK MAHINDRA BANK)',
    subHeaderMethod: defaultMethodNames[category] || 'Flat / Apartment Method',
    dateOfValuation: initialFields.dateOfValuation || visitDate,
    purposeOfLoan: initialFields.purposeOfLoan || 'Housing Loan / LAP',
    customerNameAndContact: initialFields.customerNameAndContact || customerFull,
    nameOfDocumentHolder: initialFields.nameOfDocumentHolder || docHolder,
    dateOfTechnicalVisit: initialFields.dateOfTechnicalVisit || visitDate,
    nameOfProjectSociety: initialFields.nameOfProjectSociety || (category === 'VL' ? '' : p.buildingName || p.societyName || ''),
    builderSellerNameAndRera: initialFields.builderSellerNameAndRera || '',
    personMetOnSite: initialFields.personMetOnSite || '',
    postalAddress: initialFields.postalAddress || p.address || p.propertyAddress || '',

    flatHousePlotNo: initialFields.flatHousePlotNo || p.plotNo || p.flatNo || '',
    propertyType: initialFields.propertyType || (category === 'FLAT' ? 'Residential Flat' : category === 'IND' ? 'Industrial Shed / Plot' : category === 'L&B' ? 'Residential Land and Building' : category === 'RES-COM' ? 'Residential cum Commercial' : 'Vacant Land'),
    valuationMethod: initialFields.valuationMethod || defaultMethodNames[category],
    constructionStatus: initialFields.constructionStatus || 'Completed',
    stageOfConstructionPct: initialFields.stageOfConstructionPct || '100%',
    yearBuiltAge: initialFields.yearBuiltAge || '5 Years',
    residualAge: initialFields.residualAge || '55 Years',
    occupancyDetails: initialFields.occupancyDetails || 'Self Occupied',
    vacancyTenantTenure: initialFields.vacancyTenantTenure || 'NA',
    noOfStories: initialFields.noOfStories || (category === 'FLAT' ? 'B+G+4' : 'G+1'),
    commentOnNoOfStories: initialFields.commentOnNoOfStories || 'Within permissible height limit',
    totalUnitsMultiStorey: initialFields.totalUnitsMultiStorey || (category === 'FLAT' ? '20 Units' : 'NA'),
    noOfUnitsEachFloor: initialFields.noOfUnitsEachFloor || (category === 'FLAT' ? '4 Units' : 'NA'),
    unitDetails: initialFields.unitDetails || (category === 'FLAT' ? '3 BHK Flat' : 'NA'),
    amenitiesAvailable: initialFields.amenitiesAvailable || (category === 'VL' ? 'Roads' : ''),
    encroachmentOnPublicLand: initialFields.encroachmentOnPublicLand || 'No',

    physicalAddress: { ...physicalAddr, ...(initialFields.physicalAddress || {}) },
    technicalAddress: { ...technicalAddr, ...(initialFields.technicalAddress || {}) },
    legalAddressOfProperty: initialFields.legalAddressOfProperty || p.legalAddress || p.address || '',
    permissibleUseOfBuilding: initialFields.permissibleUseOfBuilding || (category === 'IND' ? 'Industrial' : category === 'RES-COM' ? 'Residential cum Commercial' : 'Residential'),

    nearestRailwayStation: initialFields.nearestRailwayStation || 'Bhubaneswar Railway Station (~6.5 km)',
    nearestBusStand: initialFields.nearestBusStand || 'Baramunda Bus Stand (~4.0 km)',
    nearestHospital: initialFields.nearestHospital || 'AIIMS Bhubaneswar (~3.5 km)',
    nearestAirport: initialFields.nearestAirport || 'Biju Patnaik International Airport (~7.0 km)',
    conditionOfApproachRoad: initialFields.conditionOfApproachRoad || 'Good BT Road',
    accessToProperty: initialFields.accessToProperty || 'Direct access from 30 ft wide road',
    nearbyLandmark: initialFields.nearbyLandmark || p.landmark || '',
    classificationOfArea: initialFields.classificationOfArea || 'Middle Class / Residential',
    conditionOfLocality: initialFields.conditionOfLocality || 'Developing',
    classificationTypeOfLocality: initialFields.classificationTypeOfLocality || 'Residential / Urban',
    developmentOfSurroundingAreas: initialFields.developmentOfSurroundingAreas || 'More than 70% developed',
    withinMunicipalLimits: initialFields.withinMunicipalLimits || 'Yes (BMC Limits)',
    boardOfOtherBankIndicatingMortgage: initialFields.boardOfOtherBankIndicatingMortgage || 'No',
    plotDemarcatedAtSite: initialFields.plotDemarcatedAtSite || 'Yes, bounded by boundary walls',
    propertyIdentifiedThrough: initialFields.propertyIdentifiedThrough || 'Boundaries matching site inspection & deed',
    surroundingsSiteNorth: initialFields.surroundingsSiteNorth || '',
    surroundingsSiteSouth: initialFields.surroundingsSiteSouth || '',
    surroundingsSiteEast: initialFields.surroundingsSiteEast || '',
    surroundingsSiteWest: initialFields.surroundingsSiteWest || '',
    boundaryComparison: initialFields.boundaryComparison || DEFAULT_BOUNDARY_COMPARISON,
    boundariesMatchingWithLegal: initialFields.boundariesMatchingWithLegal || 'Yes',
    discrepancyInBoundaries: initialFields.discrepancyInBoundaries || 'No discrepancy noticed',

    natureOfSoil: initialFields.natureOfSoil || 'Ordinary Soil',
    typeOfConstruction: initialFields.typeOfConstruction || 'RCC Framed Structure',
    majorStructuralIrregularities: initialFields.majorStructuralIrregularities || 'No structural cracks or irregularities observed',
    improvementInteriorDecoration: initialFields.improvementInteriorDecoration || 'No / Standard interior works done',
    natureOfWaterSupply: initialFields.natureOfWaterSupply || 'Overhead tank & pump / Borewell & Municipal',
    qualityOfConstruction: initialFields.qualityOfConstruction || 'Good',
    exteriorsFinishing: initialFields.exteriorsFinishing || 'Weather coat paint',
    interiorsFinishing: initialFields.interiorsFinishing || 'Plastic emulsion paint with vitrified tiles',
    typeOfFinishingPaint: initialFields.typeOfFinishingPaint || 'Premium Acrylic Emulsion',
    typeOfSpecificationUsed: initialFields.typeOfSpecificationUsed || 'First class building specifications',
    amenitiesProvidedInBuilding: initialFields.amenitiesProvidedInBuilding || 'Lift, 24x7 Power Backup, Security',
    constructionProgressUpTo: initialFields.constructionProgressUpTo || '100% Complete',
    projectedResidualLife: initialFields.projectedResidualLife || '55 Years',

    approvedLayoutPlansDetails: initialFields.approvedLayoutPlansDetails || 'Approved plan copy verified',
    commencementCertificate: initialFields.commencementCertificate || 'Verified',
    occupationCompletionCertificate: initialFields.occupationCompletionCertificate || 'Available / Verified',
    ownershipDocuments: initialFields.ownershipDocuments || 'Registered Sale Deed / Title Deed',
    allotmentLetterBBA: initialFields.allotmentLetterBBA || 'Verified',
    extendedUtilityBills: initialFields.extendedUtilityBills || 'Electricity Bill & Khata Verified',

    areaMeasuredOnSite: initialFields.areaMeasuredOnSite || '',
    areaMeasuredBasis: initialFields.areaMeasuredBasis || (category === 'VL' ? 'Plot Area' : 'Built up Area'),
    grossLandAreaSqFt: initialFields.grossLandAreaSqFt || '',
    netLandAreaSiteSqFt: initialFields.netLandAreaSiteSqFt || '',
    netLandAreaPlanSqFt: initialFields.netLandAreaPlanSqFt || '',
    netLandAreaDeedSqFt: initialFields.netLandAreaDeedSqFt || '',
    landAreaSqYdOrMt: initialFields.landAreaSqYdOrMt || '',
    udsShare: initialFields.udsShare || (category === 'IND' || category === 'VL' ? 'NA' : ''),
    adoptedLandAreaBasis: initialFields.adoptedLandAreaBasis || 'Net Land Area As per Legal Doc',
    adoptedLandAreaSqFt: initialFields.adoptedLandAreaSqFt || '',
    adoptedLandRatePerSqFt: initialFields.adoptedLandRatePerSqFt || '',
    govtGuidelineRateLand: initialFields.govtGuidelineRateLand || '',
    landValueI: initialFields.landValueI || '',

    carpetAreaSiteSqFt: initialFields.carpetAreaSiteSqFt || '',
    carpetAreaPlanSqFt: initialFields.carpetAreaPlanSqFt || '',
    carpetAreaDeedSqFt: initialFields.carpetAreaDeedSqFt || '',
    buaSiteSqFt: initialFields.buaSiteSqFt || '',
    buaPlanSqFt: initialFields.buaPlanSqFt || '',
    buaDeedSqFt: initialFields.buaDeedSqFt || '',
    floorWiseRows: initialFields.floorWiseRows || (category === 'IND' ? DEFAULT_FLOOR_ROWS_IND : DEFAULT_FLOOR_ROWS_LB),
    superBuaSqFt: initialFields.superBuaSqFt || '',
    adoptedAreaBasis: initialFields.adoptedAreaBasis || 'Built Up Area As per Legal Doc',
    adoptedAreaSqFt: initialFields.adoptedAreaSqFt || '',
    finalAdoptedRatePerSqFt: initialFields.finalAdoptedRatePerSqFt || '',
    adoptedConstructionMarketRate: initialFields.adoptedConstructionMarketRate || '',
    bldgValueGovtGuideline: initialFields.bldgValueGovtGuideline || '',
    constructionValuePresentStage: initialFields.constructionValuePresentStage || '',
    estimatedCostToComplete: initialFields.estimatedCostToComplete || '',
    depreciationPctPerYear: initialFields.depreciationPctPerYear || '1.5% per year',
    depreciationTotalAmount: initialFields.depreciationTotalAmount || '0',
    constructionValueIi: initialFields.constructionValueIi || '',
    marketValueWithoutAmenities: initialFields.marketValueWithoutAmenities || '',
    marketValuePresentStage: initialFields.marketValuePresentStage || '',

    noOfCarParking: initialFields.noOfCarParking || '1 Covered Car Parking',
    valueOfParking: initialFields.valueOfParking || '200000',
    valueOfOtherAmenities: initialFields.valueOfOtherAmenities || '50000',
    totalValueOfAmenities: initialFields.totalValueOfAmenities || '250000',

    marketValueAsPerMethod: initialFields.marketValueAsPerMethod || '',

    rationaleForValuation: initialFields.rationaleForValuation || 'Valuation is carried out considering the location, physical inspection, locality rates, and market inquiries.',
    finalMarketValue: initialFields.finalMarketValue || '',
    guidelineValue: initialFields.guidelineValue || '',
    distressedValue: initialFields.distressedValue || '',
    realizableValue: initialFields.realizableValue || '',
    insurableValue: initialFields.insurableValue || '',
    remarks: initialFields.remarks || '1. The property is accessible and demarcated on site.\n2. Boundaries physically inspected match with legal documents provided.\n3. Valuation has been assessed based on current market dynamics and site conditions.',

    visitingEngineerName: initialFields.visitingEngineerName || engName || 'Site Engineer',
    declarationConfirmed: initialFields.declarationConfirmed !== false,
    partnerStampFile: initialFields.partnerStampFile || null,
    reportDate: initialFields.reportDate || reportDate,
    reportPlace: initialFields.reportPlace || 'Bhubaneswar',

    documents: initialFields.documents || [],
    mapImages: initialFields.mapImages || [],
    photos: initialFields.photos || [],
    selectedPhotos: initialFields.selectedPhotos || [],
    propertyDocuments: initialFields.propertyDocuments || [],
    propertyDocumentNames: initialFields.propertyDocumentNames || [],
    locationMaps: initialFields.locationMaps || [],
    latitude: initialFields.latitude || p.latitude || '',
    longitude: initialFields.longitude || p.longitude || '',
    propertyPhotos: initialFields.propertyPhotos || [],
    propertyPhotoNames: initialFields.propertyPhotoNames || [],
    ...initialFields,
  };
}
