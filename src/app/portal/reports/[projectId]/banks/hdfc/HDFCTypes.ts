'use client';

import { formatReportDate } from '@/lib/pdf-bank-renderer';
import { getEarliestFieldVisit } from '../BaseBankReportComponents';
import { decodeHtmlEntitiesDeep, decodeHtmlEntities } from '@/lib/html-entities';

export interface HDFCFloorRow {
  id: string;
  name: string;
  basisOfValuation?: 'Carpet Area' | 'Built-up Area' | 'Super Built-up Area' | string;
  area: string;
  rate: string;
  yearBuilt: string;
  lifeYears: string;
  ageYears: string;
  depreciationPct: string;
}

export interface HDFCAnnexureItem {
  id: string;
  label: string;
  title?: string;
  category?: string;
  excelFileUrl: string;
  excelFileName: string;
  parsedData?: {
    headers: string[];
    rows: string[][];
    allRows?: string[][];
    merges?: { sr: number; sc: number; er: number; ec: number }[];
    colWidths?: number[];
  };
}

export interface HDFCReportFields {
  // Section 1 – General Details
  propertyType: string;
  propertyTypeOther?: string;
  ownerName: string;
  ownerAddress: string;
  city: string;
  pincode: string;
  landmark: string;
  loanApplicationType?: string;
  loanApplicationNo: string;
  documentHolderName: string;
  legalAddress: string;
  legalState: string;
  legalPincode: string;
  dateOfInspection: string;
  dateOfValuation: string;
  refNo: string;
  bankName: string;
  branchName: string;
  to: string;
  purpose: string;

  // Section 2 – Surrounding Locality Details
  wardNo: string;
  vicinity: string;
  classOfLocality: string;
  approachRoadWidth: string;
  approachRoadWidthActual: string;
  plotDemarcated: string;
  distanceRailwayStation: string;
  distanceBusStop: string;
  distanceHospital: string;
  railwayStationName: string;
  busStopName: string;
  hospitalName: string;
  propertyIdentification: string;
  propertyIdentificationRemarks: string;
  proximityToFacilities: string;
  landmarkRailway: string;
  landmarkBusStop: string;
  landmarkHospital: string;
  landmarkNearest: string;

  // Section 3 – Property Details
  usageType: string;
  usageTypeOther?: string;
  additionalAmenities: string;
  legalStatus: string;

  // Section 4 – Subject Property Details
  premisesType: string;
  premisesTypeOther?: string;
  occupiedBy: string;
  isPropertyRented: string;
  rentedOccupants: string;
  propertyTaxation: string;
  boundaryDocType?: string;
  boundaryNorth: string;
  boundarySouth: string;
  boundaryEast: string;
  boundaryWest: string;
  buildingBoundaryNorth: string;
  buildingBoundarySouth: string;
  buildingBoundaryEast: string;
  buildingBoundaryWest: string;

  // Section 5 – Structural Details
  structureType: string;
  numberOfFloors: string;
  numberOfWings: string;
  unitsPerFloor: string;
  internalComposition: string;
  numberOfLifts: string;
  ageOfProperty: string;
  ageOfPropertyActual: string;
  estimatedFutureLife: string;
  exteriors: string;
  qualityOfConstruction: string;
  maintenanceCondition: string;
  commonAreasRemarks: string;
  otherObservations: string;
  flooringType: string;
  roofType: string;
  qualityOfFixtures: string;
  foundation: string;
  superstructure: string;
  doorsWindows: string;
  plastering: string;
  sanitary: string;
  electrification: string;

  // Section 6 – Plan Approvals
  constructionApproved: string;
  approvalDetails: string;
  constructionPermission: string;
  violationsObserved: string;
  conformsToByelaws: string;
  documentsVerified: string;

  // Section 7 – Floor-wise
  floors: HDFCFloorRow[];
  floorAreaUnit: string;

  // Section 8 – Land Valuation
  landArea: string;
  landAreaUnit: string;
  landRatePerUnit: string;
  govtLandRate: string;
  recommendedRateBasis: string;
  buaAsPerApprovals: string;
  aptRecommendedRateAndBasis?: string;

  // Valuation extras
  marketability: string;
  valuationResult: string;
  replacementCost: string;
  deviations: string;

  // Abstract & Govt Guideline
  realizablePct: string;
  distressPct: string;
  guidelineValue: string;
  guidelineLandArea: string;
  guidelineLandRate: string;
  guidelineBuildingBua: string;
  guidelineBuildingRate: string;
  guidelineUdsArea: string;
  guidelineUdsRate: string;
  guidelineFlatBua: string;
  guidelineFlatRate: string;

  // Remarks & Declaration
  demarcation: string;
  possession: string;
  remarks: string;
  representativeName: string;
  representativeFatherName?: string;

  // Photos & Maps & Documents
  propertyImages: string[];
  propertyImageNames: string[];
  documentImages: string[];
  documentImageNames: string[];
  locationMapImage: string;
  locationMapImages?: string[];
  mouzaMapImage?: string | string[];
  mouzaMapImages: string[];
  sketchMapImages: string[];
  cadastralMapImage?: string | string[];
  cadastralMapImages: string[];
  bdaMapImages: string[];
  latitude: string;
  longitude: string;

  // Legacy / Routing fields
  localityType: string;
  khataNo: string;
  plotNo: string;
  mouza: string;
  tahasil: string;
  district: string;
  state: string;
  developmentStatus: string;
  civicAmenities: string[];
  civicAmenitiesOther: string;
  distanceMainRoad: string;
  distanceMainRoadUnit: string;
  distanceRailway: string;
  distanceRailwayUnit: string;
  nearbyLandmarks: string;
  reworkNotes?: string;
  clientType?: string;
  organisationTemplate?: string;
  organisationSubTemplate?: string;
  institutionCategory?: string;
  serviceType?: string;
  subjectType?: string;
  valuationLayout?: 'land_building' | 'apartment';

  // Annexure
  annexureEnabled: boolean;
  annexureRef: string;
  annexureRefShowAlso: boolean;
  legalAnnexureEnabled: boolean;
  legalAnnexureRef: string;
  legalAnnexureRefShowAlso: boolean;
  annexures: HDFCAnnexureItem[];
}

export const STRUCTURE_TYPE_OPTIONS = [
  'RCC',
  'Load Bearing',
  'Steel Structure',
  'Composite Structure',
  'Industrial Shed',
  'A/C Sheet',
  'G/I Sheet',
  'Asbestos Roofing',
  'NA',
];

export const PREDEFINED_AMENITIES = [
  'Garden',
  'Swimming Pool',
  'Gymnasium',
  'Club House',
  "Children's Play Area",
  'Community Hall',
  'Power Backup',
];

export const UNIT_SQFT_MAP: Record<string, number> = {
  'DEC': 435.6,
  'DECIMAL': 435.6,
  'ACRE': 43560,
  'ACRES': 43560,
  'SQFT': 1,
  'SQ.FT.': 1,
  'SQ FT': 1,
  'SFT': 1,
  'SQMT': 10.7639,
  'SQ.MTR.': 10.7639,
  'SQ.M.': 10.7639,
  'SMT': 10.7639,
  'GUNTHA': 1089,
  'CENT': 435.6,
};

export const getSqftFactor = (unitStr: string): number => {
  if (!unitStr) return 435.6;
  const u = unitStr.toUpperCase().trim();
  if (UNIT_SQFT_MAP[u]) return UNIT_SQFT_MAP[u];
  if (u.includes('ACRE')) return 43560;
  if (u.includes('SQFT') || u.includes('SQ.FT') || u.includes('SFT') || u === 'SF') return 1;
  if (u.includes('SQMT') || u.includes('SQ.M') || u.includes('SMT') || u === 'SM') return 10.7639;
  if (u.includes('GUNTHA')) return 1089;
  if (u.includes('CENT')) return 435.6;
  return 435.6;
};

export const calculateTotalLandValue = (
  areaStr: string,
  areaUnit: string,
  rateStr: string,
  rateUnit?: string
): number => {
  const areaNum = parseFloat(String(areaStr).replace(/[^0-9.]/g, '')) || 0;
  const rateNum = parseFloat(String(rateStr).replace(/[^0-9.]/g, '')) || 0;
  if (!areaNum || !rateNum) return 0;

  const areaSqft = areaNum * getSqftFactor(areaUnit);
  const rateSqftFactor = getSqftFactor(rateUnit || areaUnit);

  const totalValue = (areaSqft / rateSqftFactor) * rateNum;
  return Math.round((totalValue + Number.EPSILON) * 100) / 100;
};

export function deriveApproachRoadWidthRange(actualStr: string): string {
  if (!actualStr || !actualStr.trim()) return '';
  const numMatch = actualStr.match(/[\d.]+/);
  if (!numMatch) return '';
  let valInFeet = parseFloat(numMatch[0]);
  if (isNaN(valInFeet) || valInFeet <= 0) return '';
  if (/m|meter|mtr/i.test(actualStr)) {
    valInFeet = valInFeet * 3.28084;
  }
  if (valInFeet >= 60) return '>=60 Feet Road';
  if (valInFeet >= 40) return '60-40 Feet Road';
  if (valInFeet >= 20) return '40-20 Feet Road';
  return '<20 Feet Road';
}

export function deriveAgeOfPropertyRange(actualStr: string): string {
  if (!actualStr || !actualStr.trim()) return '';
  if (/new|under construction/i.test(actualStr.trim())) return '1-10 years';
  const numMatch = actualStr.match(/[\d.]+/);
  if (!numMatch) return '';
  const age = parseFloat(numMatch[0]);
  if (isNaN(age) || age < 0) return '';
  if (age <= 10) return '1-10 years';
  if (age <= 25) return '11-25 years';
  if (age <= 50) return '26-50 years';
  return '>50 years';
}

export const parseNum = (v: any): number => {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') return parseFloat(v.replace(/,/g, '') || '0') || 0;
  return 0;
};

export const formatNum = (val: any): string => {
  const n = parseNum(val);
  if (isNaN(n) || n === 0) return '';
  return Math.round(n).toLocaleString('en-IN');
};

export const DEFAULT_HDFC_FIELDS: HDFCReportFields = {
  valuationLayout: 'land_building',
  propertyType: 'Residential',
  propertyTypeOther: '',
  ownerName: '',
  ownerAddress: '',
  city: '',
  pincode: '',
  landmark: '',
  loanApplicationType: 'Housing Loan / LAP',
  loanApplicationNo: '',
  documentHolderName: '',
  legalAddress: '',
  legalState: '',
  legalPincode: '',
  dateOfInspection: formatReportDate(new Date()),
  dateOfValuation: formatReportDate(new Date()),
  refNo: '',
  bankName: 'HDFC BANK',
  branchName: '',
  to: 'HDFC BANK LTD - HL-LAP-BLG',
  purpose: 'Home Loan / LAP / Business Loan Group',

  wardNo: '',
  vicinity: 'Residential',
  classOfLocality: 'Middle Class',
  approachRoadWidth: '',
  approachRoadWidthActual: '',
  plotDemarcated: 'Yes',
  distanceRailwayStation: '',
  distanceBusStop: '',
  distanceHospital: '',
  railwayStationName: '',
  busStopName: '',
  hospitalName: '',
  propertyIdentification: 'Easy to Identify',
  propertyIdentificationRemarks: '',
  proximityToFacilities: '1-3 Kms',
  landmarkRailway: '',
  landmarkBusStop: '',
  landmarkHospital: '',
  landmarkNearest: '',

  usageType: 'Residential',
  usageTypeOther: '',
  additionalAmenities: 'Not Applicable',
  legalStatus: 'Freehold',

  premisesType: 'Row House',
  premisesTypeOther: '',
  occupiedBy: 'Self Occupied',
  isPropertyRented: '',
  rentedOccupants: '',
  propertyTaxation: 'Average',
  boundaryDocType: '',
  boundaryNorth: '',
  boundarySouth: '',
  boundaryEast: '',
  boundaryWest: '',
  buildingBoundaryNorth: '',
  buildingBoundarySouth: '',
  buildingBoundaryEast: '',
  buildingBoundaryWest: '',

  structureType: 'RCC',
  numberOfFloors: '1',
  numberOfWings: '',
  unitsPerFloor: '',
  internalComposition: 'Good',
  numberOfLifts: '',
  ageOfProperty: '',
  ageOfPropertyActual: '',
  estimatedFutureLife: '',
  exteriors: 'Beam & Column Structure',
  qualityOfConstruction: 'Good',
  maintenanceCondition: 'Good',
  commonAreasRemarks: 'Normal',
  otherObservations: '',
  flooringType: 'Tile Flooring',
  roofType: 'RCC Roofing',
  qualityOfFixtures: 'Good Quality Fittings',
  foundation: 'RCC',
  superstructure: 'Brick Masonry',
  doorsWindows: 'Wooden/UPVC',
  plastering: 'Cement Plastering',
  sanitary: 'Standard',
  electrification: 'Concealed',

  constructionApproved: 'Yes',
  approvalDetails: '',
  constructionPermission: '',
  violationsObserved: 'Low',
  conformsToByelaws: '',
  documentsVerified: '',

  floors: [{ id: '1', name: 'Ground', basisOfValuation: 'Built-up Area', area: '', rate: '', yearBuilt: '', lifeYears: '60', ageYears: '', depreciationPct: '' }],
  floorAreaUnit: 'Sqft',

  landArea: '',
  landAreaUnit: 'Sqft',
  landRatePerUnit: '',
  govtLandRate: '',
  recommendedRateBasis: '',
  buaAsPerApprovals: '',

  marketability: 'Good',
  valuationResult: 'Positive',
  replacementCost: '',
  deviations: '',
  aptRecommendedRateAndBasis: 'NA',

  realizablePct: '90',
  distressPct: '80',
  guidelineValue: '',
  guidelineLandArea: '',
  guidelineLandRate: '',
  guidelineBuildingBua: '',
  guidelineBuildingRate: '',
  guidelineUdsArea: '',
  guidelineUdsRate: '',
  guidelineFlatBua: '',
  guidelineFlatRate: '',

  demarcation: 'Clear',
  possession: 'With Owner',
  remarks: '',
  representativeName: '',
  representativeFatherName: '',

  propertyImages: [],
  propertyImageNames: [],
  documentImages: [],
  documentImageNames: [],
  locationMapImage: '',
  locationMapImages: [],
  mouzaMapImage: '',
  mouzaMapImages: [],
  sketchMapImages: [],
  cadastralMapImage: '',
  cadastralMapImages: [],
  bdaMapImages: [],
  latitude: '',
  longitude: '',

  localityType: 'Residential',
  khataNo: '',
  plotNo: '',
  mouza: '',
  tahasil: '',
  district: '',
  state: '',
  developmentStatus: 'Developed',
  civicAmenities: [],
  civicAmenitiesOther: '',
  distanceMainRoad: '',
  distanceMainRoadUnit: 'Meters',
  distanceRailway: '',
  distanceRailwayUnit: 'Km',
  nearbyLandmarks: '',
  clientType: 'organisation',
  organisationTemplate: 'HDFC BANK',
  organisationSubTemplate: 'HL-LAP-BLG',
  institutionCategory: 'Bank & FIS',
  serviceType: '',
  subjectType: '',
  annexureEnabled: false,
  annexureRef: '',
  annexureRefShowAlso: false,
  legalAnnexureEnabled: false,
  legalAnnexureRef: '',
  legalAnnexureRefShowAlso: false,
  annexures: [],
};

export function getHDFCInitialFields(
  initialFields: any,
  prefill?: any,
  bucketImages: any[] = [],
  projectCode?: string
): HDFCReportFields {
  const earliestVisit = getEarliestFieldVisit(bucketImages, prefill);

  const merged: HDFCReportFields = {
    ...DEFAULT_HDFC_FIELDS,
    ...(initialFields || {}),
    bankName: 'HDFC BANK',
    organisationTemplate: 'HDFC BANK',
    organisationSubTemplate: 'HL-LAP-BLG',
    to: initialFields?.to || 'HDFC BANK LTD - HL-LAP-BLG',
    purpose: initialFields?.purpose || prefill?.purpose || 'Home Loan / LAP / Business Loan Group',
    refNo: initialFields?.refNo || projectCode || '',
    dateOfInspection: initialFields?.dateOfInspection
      ? formatReportDate(initialFields.dateOfInspection)
      : (earliestVisit.dateStr || DEFAULT_HDFC_FIELDS.dateOfInspection),
    dateOfValuation: initialFields?.dateOfValuation
      ? formatReportDate(initialFields.dateOfValuation)
      : (earliestVisit.dateStr || DEFAULT_HDFC_FIELDS.dateOfValuation),
    ownerName: initialFields?.ownerName || prefill?.contactName || '',
    ownerAddress: initialFields?.ownerAddress || prefill?.propertyAddress || '',
    representativeName: initialFields?.representativeName || earliestVisit.engineerName || '',
    propertyImages: Array.isArray(initialFields?.propertyImages)
      ? initialFields.propertyImages
      : (typeof initialFields?.propertyImages === 'string' && initialFields.propertyImages ? [initialFields.propertyImages] : []),
    propertyImageNames: Array.isArray(initialFields?.propertyImageNames) ? initialFields.propertyImageNames : [],
    documentImages: Array.isArray(initialFields?.documentImages)
      ? initialFields.documentImages
      : (typeof initialFields?.documentImages === 'string' && initialFields.documentImages ? [initialFields.documentImages] : []),
    documentImageNames: Array.isArray(initialFields?.documentImageNames) ? initialFields.documentImageNames : [],
    locationMapImages: Array.isArray(initialFields?.locationMapImages)
      ? initialFields.locationMapImages
      : (Array.isArray(initialFields?.locationMapImage) ? initialFields.locationMapImage : (typeof initialFields?.locationMapImage === 'string' && initialFields.locationMapImage ? [initialFields.locationMapImage] : [])),
    mouzaMapImages: Array.isArray(initialFields?.mouzaMapImages)
      ? initialFields.mouzaMapImages
      : (Array.isArray(initialFields?.mouzaMapImage) ? initialFields.mouzaMapImage : (typeof initialFields?.mouzaMapImage === 'string' && initialFields.mouzaMapImage ? [initialFields.mouzaMapImage] : [])),
    sketchMapImages: Array.isArray(initialFields?.sketchMapImages)
      ? initialFields.sketchMapImages
      : (typeof initialFields?.sketchMapImage === 'string' && initialFields.sketchMapImage ? [initialFields.sketchMapImage] : []),
    cadastralMapImages: Array.isArray(initialFields?.cadastralMapImages)
      ? initialFields.cadastralMapImages
      : (Array.isArray(initialFields?.cadastralMapImage) ? initialFields.cadastralMapImage : (typeof initialFields?.cadastralMapImage === 'string' && initialFields.cadastralMapImage ? [initialFields.cadastralMapImage] : [])),
    bdaMapImages: Array.isArray(initialFields?.bdaMapImages)
      ? initialFields.bdaMapImages
      : (typeof initialFields?.bdaMapImage === 'string' && initialFields.bdaMapImage ? [initialFields.bdaMapImage] : []),
  };

  if (!Array.isArray(merged.floors) || merged.floors.length === 0) {
    merged.floors = DEFAULT_HDFC_FIELDS.floors;
  }

  return decodeHtmlEntitiesDeep(merged);
}
