'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import * as XLSX from 'xlsx';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { PDFAdityaBirlaSTSLRenderer, STSLReportFields } from '@/lib/banks/pdf-aditya-birla-stsl-renderer';
import { CONTENT_W } from '@/lib/pdf-bank-renderer';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ActiveConfigBanner,
  ReportActionBar,
  NavItem,
  getFloorName,
  formatAssignedEngineers,
  formatReportDate,
  BaseDateInput,
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  AnnexureRefSelector,
  BaseAnnexureSection,
  fetchBytes,
} from '../BaseBankReportComponents';
import { reorderAndLabelAnnexures, AnnexureItem, decodeHtmlEntities, decodeHtmlEntitiesDeep } from '@/lib/bank-fields';

export interface AdityaBirlaCapitalSTSLProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole: string;
  bucketImages?: any[];
  prefill?: any;
  onResetWizard?: () => void;
}

interface BuaRow {
  floor: string;
  asPerSite: string;
  asPerPlan: string;
  deviations: string;
  remarks: string;
}

interface AccomRow {
  floor: string;
  unitDetails: string;
}

const DEFAULT_BUA_ROWS: BuaRow[] = [
  { floor: 'Ground Floor', asPerSite: '', asPerPlan: 'NA', deviations: 'No', remarks: '' },
  { floor: 'Total', asPerSite: '', asPerPlan: 'NA', deviations: 'No', remarks: '' },
];

const isLegacyMockBua = (rows?: BuaRow[]) => {
  if (!Array.isArray(rows) || rows.length < 4) return false;
  return rows[0]?.asPerSite === '1080sqft' && rows.some(r => r.asPerSite === '2226sqft');
};

const DEFAULT_ACCOM_ROWS: AccomRow[] = [
  { floor: 'Ground Floor', unitDetails: '' },
];

const blockNegativeKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault();
  }
};

const sanitizePositiveDecimal = (val: string): string => {
  if (!val) return '';
  let cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

interface AreaValueOrNACellProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  placeholder?: string;
  defaultVal?: string;
}

function AreaValueOrNACell({
  value,
  onChange,
  disabled,
  placeholder = 'e.g. 1892',
  defaultVal = '',
}: AreaValueOrNACellProps) {
  const isNA = Boolean(value && String(value).trim().toUpperCase() === 'NA');

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={isNA ? 'NA' : 'Val'}
        onChange={e => {
          if (e.target.value === 'NA') {
            onChange('NA');
          } else {
            onChange(defaultVal || '');
          }
        }}
        disabled={disabled}
        className="w-16 shrink-0 bg-neutral-100 border border-neutral-300 rounded px-1.5 py-1 text-[11px] font-semibold text-neutral-700 focus:ring-1 focus:ring-[#0f2038] outline-hidden cursor-pointer"
        title="Choose numeric value or NA"
      >
        <option value="Val">Value</option>
        <option value="NA">NA</option>
      </select>

      {isNA ? (
        <div className="w-full bg-neutral-100 text-neutral-400 border border-neutral-200 rounded px-2.5 py-1.5 text-xs text-center font-bold select-none">
          NA
        </div>
      ) : (
        <input
          type="text"
          value={value === 'NA' ? '' : (value ?? '')}
          onKeyDown={blockNegativeKeys}
          onChange={e => onChange(sanitizePositiveDecimal(e.target.value))}
          disabled={disabled}
          className={inputCls + ' !py-1.5 text-xs text-right font-medium'}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

export const STSL_OPTIONS = {
  propertyType: ['Residential', 'Commercial', 'Industrial', 'Institutional', 'Agriculture', 'Residential cum commercial'],
  localityDevelopment: ['Well Developed', 'Developed', 'Developing', 'Under Develop', 'Slum'],
  propertyJurisdiction: ['Municipal Corporation', 'Gram Panchayat', 'Town Planning Authority', 'Development Authority', 'Municipality', 'NAC'],
  surroundingOccupancy: ['Densely Populated', 'Moderately Populated', 'Low Population density'],
  conditionOfSite: ['Well Developed', 'Developing', 'Under Developed'],
  distanceFromMainRoad: ['Not Applicable (Prop on Concrete Road)', 'Less than 200 m', '200 to 500 m', 'above 500 m'],
  approachRoadWidth: ['Width', 'Width is >40 ft.', 'Width 20 to 40 ft.', 'Clear width<15ft', 'Concrete Road', 'Illegal Road (Without document)'],
  physicalApproach: ['Clear', 'Partially Clear', 'Not Clear'],
  legalApproach: ['Clear', 'Partially Clear', 'Not Clear'],
  otherEncumbranceFeatures: ['No', 'Yes'],
  occupiedBy: ['Self-occupied', 'Tenant', 'Vacant'],
  plotDemarcated: ['Yes', 'Partially', 'No'],
  propertyIdentification: ['Yes', 'No'],
  projectCategory: ['Not Applicable', 'A', 'B', 'C', 'D', 'A+'],
  flatType: ['Not applicable', 'Normal', 'Duplex'],
  propertyHolding: ['Freehold', 'Leasehold'],
  structureType: ['RCC', 'Load Bearing', 'Steel Structure'],
  liftFacility: ['No', 'Yes'],
  amenities: ['Average', 'Excellent', 'Good', 'Low', 'NA'],
  marketability: ['Average', 'Excellent', 'Good', 'Low'],
  parkingFacility: ['Yes', 'No'],
  qualityOfConstruction: ['Class A', 'Class B', 'Class C', 'Class D'],
  typeOfParking: ['Open CP', 'Dependent CP', 'Covered CP', 'Mechanical CP', 'Semi-Covered'],
  shapeOfProperty: ['Regular', 'Irregular'],
  placementOfProperty: ['NE Facing Corner Plot', 'Corner Plot', 'Intermittent Property', 'South Facing'],
  exteriors: ['Average', 'Poor', 'Excellent', 'Good', 'Low'],
  interiors: ['Average', 'Poor', 'Excellent', 'Good', 'Low'],
  maintenanceCondition: ['Average', 'Excellent', 'Good', 'Low'],
  cautiousLocations: ['No', 'Yes'],
  docStatus: ['Fully Available', 'Partially Available', 'Not Available', 'Not Applicable'],
};

export function normalizeOption(val: string | undefined, validOptions: string[], defaultVal: string): string {
  if (!val || typeof val !== 'string' || !val.trim()) return defaultVal;
  const norm = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const vNorm = norm(val);

  // 1. Exact match
  const exact = validOptions.find(opt => norm(opt) === vNorm);
  if (exact) return exact;

  // 2. Specialized Aliases
  if (validOptions.includes('Class A') && validOptions.includes('Class B')) {
    if (['classa', 'a', 'firstclass', 'superior', 'excellent', 'aplus'].includes(vNorm)) return 'Class A';
    if (['classb', 'b', 'secondclass', 'good', 'wellmaintained', 'rcc'].includes(vNorm)) return 'Class B';
    if (['classc', 'c', 'thirdclass', 'average', 'normal', 'satisfactory'].includes(vNorm)) return 'Class C';
    if (['classd', 'd', 'fourthclass', 'poor', 'bad', 'dilapidated', 'loadbearing'].includes(vNorm)) return 'Class D';
  }

  if (validOptions.includes('Average') && validOptions.includes('Poor')) {
    if (['excellent', 'superior', 'verygood', 'classa', 'a', 'aplus'].includes(vNorm)) return 'Excellent';
    if (['good', 'wellmaintained', 'classb', 'b'].includes(vNorm)) return 'Good';
    if (['average', 'normal', 'satisfactory', 'fair', 'standard', 'moderate', 'beamandcolumnstructure', 'beamcolumnstructure', 'framedstructure', 'rcc'].includes(vNorm)) return 'Average';
    if (['poor', 'bad', 'dilapidated', 'classd', 'd', 'loadbearing'].includes(vNorm)) return 'Poor';
    if (['low', 'lowclass', 'inferior'].includes(vNorm)) return 'Low';
    if (validOptions.includes('NA') && ['na', 'notapplicable', 'none'].includes(vNorm)) return 'NA';
  }

  if (validOptions.includes('Yes') && validOptions.includes('No')) {
    if (['yes', 'true', 'available', 'demarcated', 'clear', 'easytoidentify', 'identified'].includes(vNorm)) return 'Yes';
    if (['no', 'false', 'notavailable', 'notdemarcated', 'notclear', 'difficulttoidentify', 'unidentified'].includes(vNorm)) return 'No';
    if (validOptions.includes('Partially') && ['partially', 'part', 'partial', 'partiallyclear'].includes(vNorm)) return 'Partially';
  }

  if (validOptions.includes('Fully Available') && validOptions.includes('Not Available')) {
    if (['fullyavailable', 'available', 'yes', 'provided', 'copyavailable', 'full'].includes(vNorm)) return 'Fully Available';
    if (['partiallyavailable', 'partially', 'part', 'partial'].includes(vNorm)) return 'Partially Available';
    if (['notapplicable', 'na', 'none'].includes(vNorm)) return 'Not Applicable';
    if (['notavailable', 'no', 'notprovided', 'nil'].includes(vNorm)) return 'Not Available';
  }

  if (validOptions.includes('Open CP') && validOptions.includes('Covered CP')) {
    if (vNorm.includes('open')) return 'Open CP';
    if (vNorm.includes('covered')) return 'Covered CP';
    if (vNorm.includes('semi')) return 'Semi-Covered';
    if (vNorm.includes('mech')) return 'Mechanical CP';
    if (vNorm.includes('dep')) return 'Dependent CP';
  }

  // 3. Substring / Prefix match
  const sub = validOptions.find(opt => {
    const oNorm = norm(opt);
    return (oNorm.startsWith(vNorm) || vNorm.startsWith(oNorm) || oNorm.includes(vNorm) || vNorm.includes(oNorm)) && Math.min(oNorm.length, vNorm.length) >= 3;
  });
  if (sub) return sub;

  return defaultVal;
}

export const NAV_SECTIONS: NavItem[] = [
  { id: 'section-1', title: 'Basic Details' },
  { id: 'section-2', title: 'Location Details' },
  { id: 'section-3', title: 'Property Details' },
  { id: 'section-4', title: 'Accommodation' },
  { id: 'section-5', title: 'Documentation & Built-Up Area' },
  { id: 'section-6', title: 'Valuation' },
  { id: 'section-7', title: 'Setbacks & Summary' },
  { id: 'section-8', title: 'Boundaries' },
  { id: 'section-9', title: 'Remarks' },
  { id: 'section-10', title: 'Photographs' },
  { id: 'section-11', title: 'Location Map & Mouza Map' },
  { id: 'section-12', title: 'Declaration & Sign-off' },
  { id: 'section-13-annexure', title: 'Annexures' },
];

export default function AdityaBirlaCapitalSTSL({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: AdityaBirlaCapitalSTSLProps) {
  const router = useRouter();
  const isReadOnly = status === 'submitted' || status === 'verified' || status === 'completed' || userRole === 'client';

  const [fields, setFields] = useState<STSLReportFields>(() => decodeHtmlEntitiesDeep<STSLReportFields>({
    // Basic Details
    valuerName: initialFields?.valuerName || 'Er. Satyajit Mohanty',
    clientName: initialFields?.clientName || initialFields?.ownerName || prefill?.contactName || '',
    ownerName: initialFields?.ownerName || prefill?.contactName || '',
    initiationDate: initialFields?.initiationDate ? formatReportDate(initialFields.initiationDate) : (prefill?.initiationDate ? formatReportDate(prefill.initiationDate) : formatReportDate(new Date())),
    vertical: 'STSL',
    dateOfInspection: initialFields?.dateOfInspection ? formatReportDate(initialFields.dateOfInspection) : (prefill?.inspectionDate ? formatReportDate(prefill.inspectionDate) : formatReportDate(new Date())),
    caseReferenceNumber: initialFields?.caseReferenceNumber || initialFields?.loanApplicationNo || '',
    dateOfValuation: initialFields?.dateOfValuation ? formatReportDate(initialFields.dateOfValuation) : formatReportDate(new Date()),
    propertyOwnerName: initialFields?.propertyOwnerName || prefill?.contactName || '',

    // Location Details
    propertyAddressAsTRF: initialFields?.propertyAddressAsTRF || initialFields?.ownerAddress || prefill?.propertyAddress || '',
    propertyAddressAsVisit: initialFields?.propertyAddressAsVisit || initialFields?.ownerAddress || prefill?.propertyAddress || '',
    propertyAddressAsDocs: initialFields?.propertyAddressAsDocs || initialFields?.legalAddress || prefill?.propertyAddress || '',
    mainLocality: initialFields?.mainLocality || '',
    subLocality: initialFields?.subLocality || '',
    microLocation: initialFields?.microLocation || '',
    landmark: initialFields?.landmark || '',
    latitude: initialFields?.latitude || '',
    longitude: initialFields?.longitude || '',
    typeOfProperty: normalizeOption(initialFields?.typeOfProperty || initialFields?.propertyType, STSL_OPTIONS.propertyType, 'Residential'),
    currentUsage: initialFields?.currentUsage || 'Residential',
    valuedBefore: normalizeOption(initialFields?.valuedBefore, ['No', 'Yes'], 'No'),
    valuedBeforeDate: initialFields?.valuedBeforeDate || '',
    propertyType: normalizeOption(initialFields?.propertyType || initialFields?.typeOfProperty, STSL_OPTIONS.propertyType, 'Residential'),
    propertySubType: initialFields?.propertySubType || 'Row House',
    localityDevelopment: normalizeOption(initialFields?.localityDevelopment, STSL_OPTIONS.localityDevelopment, 'Developing'),
    propertyJurisdiction: normalizeOption(initialFields?.propertyJurisdiction, STSL_OPTIONS.propertyJurisdiction, 'Gram Panchayat'),
    surroundingOccupancy: normalizeOption(initialFields?.surroundingOccupancy, STSL_OPTIONS.surroundingOccupancy, 'Densely Populated'),
    conditionOfSite: normalizeOption(initialFields?.conditionOfSite, STSL_OPTIONS.conditionOfSite, 'Developing'),
    distanceRailwayStation: initialFields?.distanceRailwayStation || '',
    distanceBusStop: initialFields?.distanceBusStop || '',
    distanceFromMainRoad: normalizeOption(initialFields?.distanceFromMainRoad, STSL_OPTIONS.distanceFromMainRoad, 'Not Applicable (Prop on Concrete Road)'),
    distanceFromCityCenter: initialFields?.distanceFromCityCenter || '',
    distanceFromBranch: initialFields?.distanceFromBranch || '',
    approachRoadWidth: normalizeOption(initialFields?.approachRoadWidth, STSL_OPTIONS.approachRoadWidth, 'Concrete Road'),
    dimensionWidth: initialFields?.dimensionWidth || '',
    dimensionDepth: initialFields?.dimensionDepth || '',
    physicalApproach: normalizeOption(initialFields?.physicalApproach, STSL_OPTIONS.physicalApproach, 'Clear'),
    legalApproach: normalizeOption(initialFields?.legalApproach, STSL_OPTIONS.legalApproach, 'Clear'),
    otherEncumbranceFeatures: normalizeOption(initialFields?.otherEncumbranceFeatures, STSL_OPTIONS.otherEncumbranceFeatures, 'No'),

    // Property Details
    occupiedBy: normalizeOption(initialFields?.occupiedBy, STSL_OPTIONS.occupiedBy, 'Self-occupied'),
    occupiedByText: initialFields?.occupiedByText || initialFields?.occupiedBy || 'Self-occupied',
    occupantName: initialFields?.occupantName || '',
    occupiedSince: initialFields?.occupiedSince || '',
    plotDemarcated: normalizeOption(initialFields?.plotDemarcated, STSL_OPTIONS.plotDemarcated, 'Yes'),
    propertyIdentification: normalizeOption(initialFields?.propertyIdentification, STSL_OPTIONS.propertyIdentification, 'Yes'),
    identificationThrough: initialFields?.identificationThrough || '',
    projectCategory: normalizeOption(initialFields?.projectCategory, STSL_OPTIONS.projectCategory, 'Not Applicable'),
    flatType: normalizeOption(initialFields?.flatType, STSL_OPTIONS.flatType, 'Not applicable'),
    flatConfiguration: initialFields?.flatConfiguration || '',
    propertyHolding: normalizeOption(initialFields?.propertyHolding, STSL_OPTIONS.propertyHolding, 'Freehold'),
    structureType: normalizeOption(initialFields?.structureType, STSL_OPTIONS.structureType, 'RCC'),
    areaOfFlat: initialFields?.areaOfFlat || '',
    totalNoOfFloors: initialFields?.totalNoOfFloors || '',
    liftFacility: normalizeOption(initialFields?.liftFacility, STSL_OPTIONS.liftFacility, 'No'),
    amenities: normalizeOption(initialFields?.amenities, STSL_OPTIONS.amenities, 'Good'),
    marketability: normalizeOption(initialFields?.marketability, STSL_OPTIONS.marketability, 'Average'),
    viewOfProperty: initialFields?.viewOfProperty || 'Residential',
    parkingFacility: normalizeOption(initialFields?.parkingFacility, STSL_OPTIONS.parkingFacility, 'Yes'),
    qualityOfConstruction: normalizeOption(initialFields?.qualityOfConstruction, STSL_OPTIONS.qualityOfConstruction, 'Class B'),
    typeOfParking: normalizeOption(initialFields?.typeOfParking, STSL_OPTIONS.typeOfParking, 'Open CP'),
    shapeOfProperty: normalizeOption(initialFields?.shapeOfProperty, STSL_OPTIONS.shapeOfProperty, 'Regular'),
    placementOfProperty: normalizeOption(initialFields?.placementOfProperty, STSL_OPTIONS.placementOfProperty, 'South Facing'),
    exteriors: normalizeOption(initialFields?.exteriors, STSL_OPTIONS.exteriors, 'Average'),
    interiors: normalizeOption(initialFields?.interiors, STSL_OPTIONS.interiors, 'Average'),
    ageOfPropertyActual: initialFields?.ageOfPropertyActual || '',
    estimatedFutureLife: initialFields?.estimatedFutureLife || '',
    sourceOfAge: initialFields?.sourceOfAge || '',
    maintenanceCondition: normalizeOption(initialFields?.maintenanceCondition, STSL_OPTIONS.maintenanceCondition, 'Good'),
    cautiousLocations: normalizeOption(initialFields?.cautiousLocations, STSL_OPTIONS.cautiousLocations, 'No'),

    // Accommodation
    unitTypeHeader: initialFields?.unitTypeHeader || 'Building',
    accommodationDetails: initialFields?.accommodationDetails || '',
    accommodationRows: initialFields?.accommodationRows || DEFAULT_ACCOM_ROWS,

    // Documentation Details
    docSaleDeedStatus: normalizeOption(initialFields?.docSaleDeedStatus, STSL_OPTIONS.docStatus, 'Fully Available'),
    docSaleDeedDetails: initialFields?.docSaleDeedDetails || 'Copy of Sale deed, ROR',
    docSanctionPlanStatus: normalizeOption(initialFields?.docSanctionPlanStatus, STSL_OPTIONS.docStatus, 'Not Available'),
    docSanctionPlanDetails: initialFields?.docSanctionPlanDetails || 'NA',
    docCCOCStatus: normalizeOption(initialFields?.docCCOCStatus, STSL_OPTIONS.docStatus, 'Not Available'),
    docCCOCDetails: initialFields?.docCCOCDetails || 'NA',
    docAgreementSaleStatus: normalizeOption(initialFields?.docAgreementSaleStatus, STSL_OPTIONS.docStatus, 'Not Available'),
    docAgreementSaleDetails: initialFields?.docAgreementSaleDetails || 'NA',
    docMutationStatus: normalizeOption(initialFields?.docMutationStatus, STSL_OPTIONS.docStatus, 'Not Available'),
    docMutationDetails: initialFields?.docMutationDetails || 'NA',
    docTaxReceiptStatus: normalizeOption(initialFields?.docTaxReceiptStatus, STSL_OPTIONS.docStatus, 'Not Available'),
    docTaxReceiptDetails: initialFields?.docTaxReceiptDetails || 'NA',
    docElectricityBillStatus: normalizeOption(initialFields?.docElectricityBillStatus, STSL_OPTIONS.docStatus, 'Not Available'),
    docElectricityBillDetails: initialFields?.docElectricityBillDetails || 'NA',
    docConversionStatus: normalizeOption(initialFields?.docConversionStatus, STSL_OPTIONS.docStatus, 'Not Available'),
    docConversionDetails: initialFields?.docConversionDetails || 'NA',

    // Built-Up Area
    buaRows: (initialFields?.buaRows && !isLegacyMockBua(initialFields.buaRows)) ? initialFields.buaRows : DEFAULT_BUA_ROWS,

    // Valuation Table
    plotAreaDocs: initialFields?.plotAreaDocs !== undefined ? initialFields.plotAreaDocs : '',
    plotAreaDocsRate: initialFields?.plotAreaDocsRate || '',
    plotAreaDocsValue: initialFields?.plotAreaDocsValue || '',
    plotAreaPhysical: initialFields?.plotAreaPhysical !== undefined ? initialFields.plotAreaPhysical : '',
    plotAreaPhysicalRate: initialFields?.plotAreaPhysicalRate || '',
    plotAreaPhysicalValue: initialFields?.plotAreaPhysicalValue || '',
    carpetAreaPlan: initialFields?.carpetAreaPlan !== undefined ? initialFields.carpetAreaPlan : 'NA',
    carpetAreaPlanRate: initialFields?.carpetAreaPlanRate || '',
    carpetAreaPlanValue: initialFields?.carpetAreaPlanValue || '',
    carpetAreaMeasurement: initialFields?.carpetAreaMeasurement !== undefined ? initialFields.carpetAreaMeasurement : '',
    carpetAreaMeasurementRate: initialFields?.carpetAreaMeasurementRate || '',
    carpetAreaMeasurementValue: initialFields?.carpetAreaMeasurementValue || '',
    buaNorms: initialFields?.buaNorms !== undefined ? initialFields.buaNorms : 'NA',
    buaNormsRate: initialFields?.buaNormsRate || '',
    buaNormsValue: initialFields?.buaNormsValue || '',
    buaMeasurementLabel: initialFields?.buaMeasurementLabel || 'Built Up Area (as per measurement)',
    buaStructureSuffix: initialFields?.buaStructureSuffix ?? '',
    buaMeasurementArea: initialFields?.buaMeasurementArea !== undefined ? initialFields.buaMeasurementArea : '',
    buaMeasurementRate: initialFields?.buaMeasurementRate || '',
    buaMeasurementValue: initialFields?.buaMeasurementValue || '',
    superBua: initialFields?.superBua !== undefined ? initialFields.superBua : '',
    superBuaRate: initialFields?.superBuaRate || '0',
    superBuaValue: initialFields?.superBuaValue || '0',
    carParkArea: initialFields?.carParkArea !== undefined ? initialFields.carParkArea : '0',
    carParkRate: initialFields?.carParkRate || '0',
    carParkValue: initialFields?.carParkValue || '0',
    amenitiesArea: initialFields?.amenitiesArea !== undefined ? initialFields.amenitiesArea : '0',
    amenitiesRate: initialFields?.amenitiesRate || '0',
    amenitiesValue: initialFields?.amenitiesValue || '0',

    // Setbacks & Other Valuation Summary
    setbackFrontPlan: initialFields?.setbackFrontPlan || 'M',
    setbackFrontActual: initialFields?.setbackFrontActual || 'M',
    setbackSide1Plan: initialFields?.setbackSide1Plan || 'M',
    setbackSide1Actual: initialFields?.setbackSide1Actual || 'M',
    setbackSide2Plan: initialFields?.setbackSide2Plan || 'M',
    setbackSide2Actual: initialFields?.setbackSide2Actual || 'M',
    setbackRearPlan: initialFields?.setbackRearPlan || 'M',
    setbackRearActual: initialFields?.setbackRearActual || 'M',
    setbackUsageDeviation: initialFields?.setbackUsageDeviation || 'Usage Deviation',
    setbackRemarks: initialFields?.setbackRemarks || 'Plan not provided',

    totalValuationFormula: initialFields?.totalValuationFormula || '',
    totalPropertyValuation: initialFields?.totalPropertyValuation || '',
    distressValue: initialFields?.distressValue || '',
    distressPct: initialFields?.distressPct || '80',
    insuranceValue: initialFields?.insuranceValue || '',
    govtLandRate: initialFields?.govtLandRate || '',
    percentageCompletion: initialFields?.percentageCompletion || '100%',
    percentageRecommendation: initialFields?.percentageRecommendation || '100%',

    // Boundary Details
    boundaryDeedNorth: initialFields?.boundaryDeedNorth || '',
    boundaryDeedSouth: initialFields?.boundaryDeedSouth || '',
    boundaryDeedEast: initialFields?.boundaryDeedEast || '',
    boundaryDeedWest: initialFields?.boundaryDeedWest || '',
    boundaryMouzaNorth: initialFields?.boundaryMouzaNorth || '',
    boundaryMouzaSouth: initialFields?.boundaryMouzaSouth || '',
    boundaryMouzaEast: initialFields?.boundaryMouzaEast || '',
    boundaryMouzaWest: initialFields?.boundaryMouzaWest || '',
    boundaryActualNorth: initialFields?.boundaryActualNorth || '',
    boundaryActualSouth: initialFields?.boundaryActualSouth || '',
    boundaryActualEast: initialFields?.boundaryActualEast || '',
    boundaryActualWest: initialFields?.boundaryActualWest || '',
    boundariesMatching: initialFields?.boundariesMatching || 'Boundary matching as per documents',

    // Remarks & Sign-off
    remarks: initialFields?.remarks || '',
    engineerVisitedName: initialFields?.engineerVisitedName || formatAssignedEngineers(prefill?.fieldEmployees) || '',
    appraiserName: initialFields?.appraiserName || 'Er. Satyajit Mohanty',
    preparedBy: initialFields?.preparedBy || prefill?.reportEmployeeName || '',
    finalizedBy: initialFields?.finalizedBy || prefill?.reportEmployeeName || '',

    // Organisation metadata (for ActiveConfigBanner)
    organisationTemplate: initialFields?.organisationTemplate || 'ADITYA BIRLA CAPITAL LTD',
    organisationSubTemplate: initialFields?.organisationSubTemplate || 'STSL',
    institutionCategory: initialFields?.institutionCategory || 'Bank & FIS',
    serviceType: initialFields?.serviceType || '',
    subjectType: initialFields?.subjectType || '',

    // Photographs & Maps
    sketchMapImages: initialFields?.sketchMapImages || [],
    propertyImages: initialFields?.propertyImages || [],
    propertyImageNames: initialFields?.propertyImageNames || [],
    locationMapImage: initialFields?.locationMapImage || '',
    mouzaMapImage: initialFields?.mouzaMapImage || '',
    cadastralMapImage: initialFields?.cadastralMapImage || '',

    // Annexures
    annexureEnabled: initialFields?.annexureEnabled ?? false,
    annexureRef: initialFields?.annexureRef || '',
    annexureRefShowAlso: initialFields?.annexureRefShowAlso ?? false,
    legalAnnexureEnabled: initialFields?.legalAnnexureEnabled ?? false,
    legalAnnexureRef: initialFields?.legalAnnexureRef || '',
    legalAnnexureRefShowAlso: initialFields?.legalAnnexureRefShowAlso ?? false,
    annexures: initialFields?.annexures || [],
  }));

  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [activeSection, setActiveSection] = useState('section-1');
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  // ─── Auto-Save Debounced Effect ───
  useEffect(() => {
    if (isReadOnly) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setAutoSaveStatus('saving');
    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);

    debouncedTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res && 'error' in res && res.error) {
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('error');
      }
    }, 1200);

    return () => {
      if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReadOnly) return;
      saveReportDraft(projectId, fields).catch(e => console.error(e));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  const handleChange = (key: keyof STSLReportFields, value: any) => {
    setFields(prev => ({ ...prev, [key]: value }));
  };

  // Helper for area multiplier: if area is left blank in Value mode but rate is entered, treat as 1
  const getAreaMultiplier = (val: string | undefined, hasRate: boolean): number => {
    if (val !== undefined && String(val).trim().toUpperCase() === 'NA') return 0;
    const trimmed = String(val || '').trim();
    if (trimmed === '') return hasRate ? 1 : 0;
    const parsed = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? (hasRate ? 1 : 0) : parsed;
  };

  // Helper for 2-decimal precision without integer truncation
  const round2 = (num: number): number => {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  };

  // ─── Dynamic Auto Calculations ───
  const plotDeedVal = useMemo(() => {
    if (String(fields.plotAreaDocs || '').trim().toUpperCase() === 'NA') return 0;
    const rate = parseFloat(String(fields.plotAreaDocsRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const area = getAreaMultiplier(fields.plotAreaDocs, rate > 0);
    return round2(area * rate);
  }, [fields.plotAreaDocs, fields.plotAreaDocsRate]);

  const plotPhysicalVal = useMemo(() => {
    if (String(fields.plotAreaPhysical || '').trim().toUpperCase() === 'NA') return 0;
    const rate = parseFloat(String(fields.plotAreaPhysicalRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const area = getAreaMultiplier(fields.plotAreaPhysical, rate > 0);
    return round2(area * rate);
  }, [fields.plotAreaPhysical, fields.plotAreaPhysicalRate]);

  const carpetPlanVal = useMemo(() => {
    if (String(fields.carpetAreaPlan || '').trim().toUpperCase() === 'NA') return 0;
    const rate = parseFloat(String(fields.carpetAreaPlanRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const area = getAreaMultiplier(fields.carpetAreaPlan, rate > 0);
    return round2(area * rate);
  }, [fields.carpetAreaPlan, fields.carpetAreaPlanRate]);

  const carpetMeasurementVal = useMemo(() => {
    if (String(fields.carpetAreaMeasurement || '').trim().toUpperCase() === 'NA') return 0;
    const rate = parseFloat(String(fields.carpetAreaMeasurementRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const area = getAreaMultiplier(fields.carpetAreaMeasurement, rate > 0);
    return round2(area * rate);
  }, [fields.carpetAreaMeasurement, fields.carpetAreaMeasurementRate]);

  const buaNormsVal = useMemo(() => {
    if (String(fields.buaNorms || '').trim().toUpperCase() === 'NA') return 0;
    const rate = parseFloat(String(fields.buaNormsRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const area = getAreaMultiplier(fields.buaNorms, rate > 0);
    return round2(area * rate);
  }, [fields.buaNorms, fields.buaNormsRate]);

  const buaTotalVal = useMemo(() => {
    if (String(fields.buaMeasurementArea || '').trim().toUpperCase() === 'NA') return 0;
    const rate = parseFloat(String(fields.buaMeasurementRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const area = getAreaMultiplier(fields.buaMeasurementArea, rate > 0);
    return round2(area * rate);
  }, [fields.buaMeasurementArea, fields.buaMeasurementRate]);

  const superBuaVal = useMemo(() => {
    if (String(fields.superBua || '').trim().toUpperCase() === 'NA') return 0;
    const rate = parseFloat(String(fields.superBuaRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const area = getAreaMultiplier(fields.superBua, rate > 0);
    return round2(area * rate);
  }, [fields.superBua, fields.superBuaRate]);

  const carParkVal = useMemo(() => {
    if (String(fields.carParkArea || '').trim().toUpperCase() === 'NA') return 0;
    const rate = parseFloat(String(fields.carParkRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const area = getAreaMultiplier(fields.carParkArea, rate > 0);
    return round2(area * rate);
  }, [fields.carParkArea, fields.carParkRate]);

  const amenitiesVal = useMemo(() => {
    if (String(fields.amenitiesArea || '').trim().toUpperCase() === 'NA') return 0;
    const rate = parseFloat(String(fields.amenitiesRate || '0').replace(/[^0-9.]/g, '')) || 0;
    const area = getAreaMultiplier(fields.amenitiesArea, rate > 0);
    return round2(area * rate);
  }, [fields.amenitiesArea, fields.amenitiesRate]);

  const totalCalculatedVal = useMemo(() => {
    return round2(plotDeedVal + plotPhysicalVal + carpetPlanVal + carpetMeasurementVal + buaNormsVal + buaTotalVal + superBuaVal + carParkVal + amenitiesVal);
  }, [plotDeedVal, plotPhysicalVal, carpetPlanVal, carpetMeasurementVal, buaNormsVal, buaTotalVal, superBuaVal, carParkVal, amenitiesVal]);

  const distressVal = useMemo(() => {
    const pct = fields.distressPct !== '' && fields.distressPct != null
      ? (parseFloat(String(fields.distressPct).replace(/[^0-9.]/g, '')) || 0)
      : 0;
    return round2(totalCalculatedVal * (pct / 100));
  }, [totalCalculatedVal, fields.distressPct]);

  const valItemsBreakdown = useMemo(() => {
    return [
      plotDeedVal > 0 ? `Rs.${formatIndianCurrency(plotDeedVal)}/-` : '',
      plotPhysicalVal > 0 ? `Rs.${formatIndianCurrency(plotPhysicalVal)}/-` : '',
      carpetPlanVal > 0 ? `Rs.${formatIndianCurrency(carpetPlanVal)}/-` : '',
      carpetMeasurementVal > 0 ? `Rs.${formatIndianCurrency(carpetMeasurementVal)}/-` : '',
      buaNormsVal > 0 ? `Rs.${formatIndianCurrency(buaNormsVal)}/-` : '',
      buaTotalVal > 0 ? `Rs.${formatIndianCurrency(buaTotalVal)}/-` : '',
      superBuaVal > 0 ? `Rs.${formatIndianCurrency(superBuaVal)}/-` : '',
      carParkVal > 0 ? `Rs.${formatIndianCurrency(carParkVal)}/-` : '',
      amenitiesVal > 0 ? `Rs.${formatIndianCurrency(amenitiesVal)}/-` : '',
    ].filter(Boolean);
  }, [plotDeedVal, plotPhysicalVal, carpetPlanVal, carpetMeasurementVal, buaNormsVal, buaTotalVal, superBuaVal, carParkVal, amenitiesVal]);

  // ─── Annexure State Handlers (Strictly ordered: 1. Technical, 2. Legal, 3+. Custom) ───
  const addAnnexure = () => {
    const newAnnexure: AnnexureItem = {
      id: String(Date.now()),
      label: 'A',
      title: '',
      excelFileUrl: '',
      excelFileName: '',
    };
    const updated = [...(fields.annexures || []), newAnnexure];
    handleChange('annexures', reorderAndLabelAnnexures(
      updated,
      fields.annexureRef,
      fields.legalAnnexureRef,
      fields.annexureEnabled,
      fields.legalAnnexureEnabled
    ));
  };

  const removeAnnexure = (id: string) => {
    const isTech = fields.annexureRef === id;
    const isLegal = fields.legalAnnexureRef === id;
    const remaining = (fields.annexures || []).filter(a => a.id !== id);
    const nextTechEnabled = isTech ? false : fields.annexureEnabled;
    const nextTechRef = isTech ? '' : fields.annexureRef;
    const nextLegalEnabled = isLegal ? false : fields.legalAnnexureEnabled;
    const nextLegalRef = isLegal ? '' : fields.legalAnnexureRef;

    setFields(prev => ({
      ...prev,
      annexureEnabled: nextTechEnabled,
      annexureRef: nextTechRef,
      annexureRefShowAlso: isTech ? false : prev.annexureRefShowAlso,
      legalAnnexureEnabled: nextLegalEnabled,
      legalAnnexureRef: nextLegalRef,
      legalAnnexureRefShowAlso: isLegal ? false : prev.legalAnnexureRefShowAlso,
      annexures: reorderAndLabelAnnexures(
        remaining,
        nextTechRef,
        nextLegalRef,
        nextTechEnabled,
        nextLegalEnabled
      ),
    }));
  };

  const updateAnnexureTitle = (id: string, title: string) => {
    handleChange('annexures', (fields.annexures || []).map(a => a.id === id ? { ...a, title } : a));
  };

  const handleAnnexureUpload = async (annexureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget(annexureId);
    let parsedData: any = undefined;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheetName];

      const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
      if (rawRows.length > 0) {
        const headers = (rawRows[0] || []).map((h: any) => String(h ?? '').trim());
        const rows = rawRows.slice(1).map(row => (row || []).map((cell: any) => String(cell ?? '').trim()));

        const rawMerges = (sheet['!merges'] || []).map(m => ({
          sr: m.s.r,
          sc: m.s.c,
          er: m.e.r,
          ec: m.e.c,
        }));

        const colWidths = sheet['!cols'] ? sheet['!cols'].map(c => c?.wpx || c?.wch || 10) : undefined;

        parsedData = {
          headers,
          rows,
          allRows: rawRows.map(row => (row || []).map((cell: any) => String(cell ?? '').trim())),
          merges: rawMerges,
          colWidths,
        };
      }

      const ext = file.name.split('.').pop() || 'xlsx';
      const fileName = `annexure-${annexureId}-${Date.now()}.${ext}`;
      const filePath = `annexures/${projectId}/${fileName}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(filePath, file, { contentType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      if (uploadError) throw uploadError;

      const { data } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);

      setFields(prev => ({
        ...prev,
        annexures: (prev.annexures || []).map(a =>
          a.id === annexureId
            ? { ...a, excelFileUrl: data.publicUrl, excelFileName: file.name, parsedData }
            : a
        ),
      }));
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  const removeAnnexureFile = (annexureId: string) => {
    setFields(prev => ({
      ...prev,
      annexures: (prev.annexures || []).map(a =>
        a.id === annexureId
          ? { ...a, excelFileUrl: '', excelFileName: '', parsedData: undefined }
          : a
      ),
    }));
  };

  // ─── Built Up Area Handlers ───
  const addBuaRow = () => {
    const current = fields.buaRows || DEFAULT_BUA_ROWS;
    const floorNames = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor', 'Sixth Floor', 'Seventh Floor'];
    const nonTotalRows = current.filter(r => !r.floor.toLowerCase().includes('total'));
    const totalRow = current.find(r => r.floor.toLowerCase().includes('total'));
    const nextFloorName = floorNames[nonTotalRows.length] || `Floor ${nonTotalRows.length + 1}`;
    const newRow: BuaRow = { floor: nextFloorName, asPerSite: '', asPerPlan: 'NA', deviations: 'No', remarks: '' };

    if (totalRow) {
      handleChange('buaRows', [...nonTotalRows, newRow, totalRow]);
    } else {
      handleChange('buaRows', [...current, newRow]);
    }
  };

  const removeBuaRow = (index: number) => {
    const current = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
    if (current.length <= 1) return;
    current.splice(index, 1);
    handleChange('buaRows', current);
  };

  // ─── Image Upload Helpers ───
  const handleMapUpload = async (
    key: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadingTarget(key);
    try {
      const newUrls: string[] = [...(fields[key] || [])];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 10 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${projectId}-${key}-${Date.now()}-${i}.${ext}`;
        const filePath = `reports/${projectId}/${fileName}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (!error) {
          const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
          newUrls.push(data.publicUrl);
        }
      }
      handleChange(key, newUrls);
      if (key === 'locationMapImages' && newUrls.length > 0) handleChange('locationMapImage', newUrls[0]);
      if (key === 'mouzaMapImages' && newUrls.length > 0) handleChange('mouzaMapImage', newUrls[0]);
      if (key === 'cadastralMapImages' && newUrls.length > 0) handleChange('cadastralMapImage', newUrls[0]);
    } catch (err: any) {
      alert(`Map upload failed: ${err.message}`);
    } finally {
      e.target.value = '';
      setUploadingTarget(null);
    }
  };

  const handleMapRemove = (
    key: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages',
    idx?: number
  ) => {
    if (idx === undefined) {
      handleChange(key, []);
      if (key === 'locationMapImages') handleChange('locationMapImage', '');
      if (key === 'mouzaMapImages') handleChange('mouzaMapImage', '');
      if (key === 'cadastralMapImages') handleChange('cadastralMapImage', '');
      return;
    }
    const current = (fields[key] || []) as string[];
    const updated = current.filter((_, i) => i !== idx);
    handleChange(key, updated);
    if (key === 'locationMapImages') handleChange('locationMapImage', updated[0] || '');
    if (key === 'mouzaMapImages') handleChange('mouzaMapImage', updated[0] || '');
    if (key === 'cadastralMapImages') handleChange('cadastralMapImage', updated[0] || '');
  };

  const handleReorderMap = (
    key: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages',
    newImages: string[]
  ) => {
    handleChange(key, newImages);
    if (key === 'locationMapImages') handleChange('locationMapImage', newImages[0] || '');
    if (key === 'mouzaMapImages') handleChange('mouzaMapImage', newImages[0] || '');
    if (key === 'cadastralMapImages') handleChange('cadastralMapImage', newImages[0] || '');
  };

  const handleUploadMultiplePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadingTarget('photos');
    try {
      const newUrls: string[] = [...(fields.propertyImages || [])];
      const newNames: string[] = [...(fields.propertyImageNames || [])];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} exceeds 5MB size limit.`);
          continue;
        }
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `${projectId}-photo-${Date.now()}-${i}.${ext}`;
        const filePath = `reports/${projectId}/${fileName}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) {
          console.error(`Upload error for ${file.name}:`, error);
          alert(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
        newNames.push(file.name.replace(/\.[^/.]+$/, '') || 'Site Picture');
      }
      handleChange('propertyImages', newUrls);
      handleChange('propertyImageNames', newNames);
    } catch (err: any) {
      alert(`Photo upload failed: ${err.message}`);
    } finally {
      e.target.value = '';
      setUploadingTarget(null);
    }
  };

  // ─── PDF Generation Pipeline (Exact 7 Pages) ───
  const generatePDFBytes = async (): Promise<Uint8Array> => {
    const propImgs = fields.propertyImages || [];
    const sketchImgs = fields.sketchMapImages || [];
    const [locMapBytes, mouzaMapBytes, cadMapBytes, ...restBytes] = await Promise.all([
      fetchBytes(fields.locationMapImage),
      fetchBytes(fields.mouzaMapImage),
      fetchBytes(fields.cadastralMapImage),
      ...propImgs.map(url => fetchBytes(url)),
      ...sketchImgs.map(url => fetchBytes(url)),
    ]);

    const propImageBytesList = restBytes.slice(0, propImgs.length);
    const sketchBytesList = restBytes.slice(propImgs.length);

    const photos = propImgs.map((imgUrl: string, idx: number) => ({
      bytes: propImageBytesList[idx],
      label: fields.propertyImageNames?.[idx] !== undefined && fields.propertyImageNames[idx].trim().length > 0
        ? fields.propertyImageNames[idx]
        : 'Site Picture',
    })).filter((p): p is { bytes: Uint8Array; label: string } => Boolean(p.bytes && p.bytes.length > 0));

    const r = new PDFAdityaBirlaSTSLRenderer();
    await r.init();

    const fmtDate = (d: string) => {
      if (!d || !d.trim()) return 'NA';
      const t = d.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
        const [y, m, dd] = t.split('-');
        return `${dd}/${m}/${y}`;
      }
      return t;
    };

    const W_LABEL_2COL = 115;
    const W_VAL_2COL = CONTENT_W - W_LABEL_2COL; // 430.28
    const W_LABEL_4COL = 115;
    const W_VAL_4COL = (CONTENT_W / 2) - W_LABEL_4COL; // 157.64

    // ═══ PAGE 1: BASIC DETAILS & LOCATION DETAILS ═══
    r.drawMainHeader('Aditya Birla Capital Limited Valuation Report');
    r.drawSectionHeader('Basic Details', true);

    r.drawKeyValueRow([
      { label: 'Name of the Valuer', value: fields.valuerName || 'Er. Satyajit Mohanty', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Name of the Client', value: fields.clientName || fields.ownerName || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Initiation Date', value: fmtDate(fields.initiationDate || ''), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Vertical', value: fields.vertical || 'STSL', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Visit Date', value: fmtDate(fields.dateOfInspection || ''), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Case Reference Number', value: fields.caseReferenceNumber || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Report Date', value: fmtDate(fields.dateOfValuation || ''), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Name of the Property Owner', value: fields.propertyOwnerName || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL },
    ]);

    // Location Details
    r.drawSectionHeader('Location Details');

    let trfAddressText = fields.propertyAddressAsTRF || 'N/A';
    if (fields.annexureEnabled && fields.annexures && fields.annexures.length > 0) {
      const linked = fields.annexures.find(a => a.id === fields.annexureRef) || fields.annexures[0];
      const annTitle = linked ? (linked.title || `Annexure ${linked.label}`) : 'Annexure';
      if (!fields.annexureRefShowAlso) {
        trfAddressText = `Refer to ${annTitle}`;
      } else if (fields.propertyAddressAsTRF) {
        trfAddressText = `${fields.propertyAddressAsTRF} (Refer to ${annTitle})`;
      }
    }
    r.drawKeyValueRow([{ label: 'Property Address as Per TRF', value: trfAddressText, labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Property Address as Per Visit', value: fields.propertyAddressAsVisit || trfAddressText, labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Property Address as Per "Docs"', value: fields.propertyAddressAsDocs || trfAddressText, labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    r.drawKeyValueRow([
      { label: 'Main Locality', value: fields.mainLocality || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Sub Locality', value: fields.subLocality || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Micro Location', value: fields.microLocation || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Landmark', value: fields.landmark || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Latitude', value: fields.latitude || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Longitude', value: fields.longitude || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Type of Property', value: fields.typeOfProperty || fields.propertyType || 'Residential', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Current Usage', value: fields.currentUsage || 'Residential', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    const whenVal = fields.valuedBefore === 'Yes'
      ? (fmtDate(fields.valuedBeforeDate || '') || 'NA')
      : 'NA';
    const valuedBeforeVal = fields.valuedBefore === 'Yes' ? 'Yes' : 'No';
    r.drawKeyValueRow([
      { label: 'Has the Valuator Done Valuation for this property before?', value: valuedBeforeVal, labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'If yes, when', value: whenVal, labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);

    r.drawSlashOptionRow('Property Type', ['Residential', 'Commercial', 'Industrial', 'Institutional', 'Agriculture', 'Residential cum commercial'], fields.typeOfProperty || fields.propertyType || 'Residential', W_LABEL_2COL, W_VAL_2COL);
    r.drawKeyValueRow([{ label: 'Property Sub Type', value: fields.propertySubType || 'Row House', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, bold: true }]);

    r.drawTwoSlashOptionRows(
      { label: 'Locality', options: ['Well Developed', 'Developed', 'Developing', 'Under Develop', 'Slum'], selected: fields.localityDevelopment || 'Developing', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Property Falling Within', options: ['Municipal Corporation', 'Gram Panchayat', 'Town Planning Authority', 'Development Authority', 'Municipality', 'NAC'], selected: fields.propertyJurisdiction || 'Gram Panchayat', labelWidth: 80, valueWidth: (CONTENT_W / 2) - 80 }
    );

    r.drawSlashOptionRow('Occupancy Level of the Surrounding', ['Densely Populated', 'Moderately Populated', 'Low Population density'], fields.surroundingOccupancy || 'Densely Populated', W_LABEL_2COL, W_VAL_2COL);
    r.drawSlashOptionRow('Condition of the Site of the Property', ['Well Developed', 'Developing', 'Under Developed'], fields.conditionOfSite || 'Developing', W_LABEL_2COL, W_VAL_2COL);

    r.drawKeyValueRow([{ label: 'Distance to Railway/Metro Station', value: fields.distanceRailwayStation || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, bold: true }]);
    r.drawKeyValueRow([{ label: 'Distance to Bus Stop', value: fields.distanceBusStop || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, bold: true }]);
    r.drawSlashOptionRow('Distance of Plot from Main Road', ['Not Applicable (Prop on Concrete Road)', 'Less than 200 m', '200 to 500 m', 'above 500 m'], fields.distanceFromMainRoad || 'Not Applicable (Prop on Concrete Road)', W_LABEL_2COL, W_VAL_2COL);
    r.drawKeyValueRow([{ label: 'Distance from City Centre', value: fields.distanceFromCityCenter || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, bold: true }]);
    r.drawKeyValueRow([{ label: 'Distance from ABCL Branch', value: fields.distanceFromBranch || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, bold: true }]);

    // ═══ PAGE 2: PROPERTY DETAILS, ACCOMMODATION & DOCUMENTATION ═══
    r.drawSlashOptionRow('Width of the Approach Road', ['Width', 'Width is >40 ft.', 'Width 20 to 40 ft.', 'Clear width<15ft', 'Concrete Road', 'Illegal Road (Without document)'], fields.approachRoadWidth || 'Concrete Road', W_LABEL_2COL, W_VAL_2COL);
    r.drawKeyValueRow([
      { label: 'Dimensions of the Property (Width)', value: fields.dimensionWidth || 'NA', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
      { label: 'Depth in Feet', value: fields.dimensionDepth || 'NA', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
    ]);
    r.drawTwoSlashOptionRows(
      { label: 'Physical Approach to the Property', options: ['Clear', 'Partially Clear', 'Not Clear'], selected: fields.physicalApproach || 'Clear', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Legal Approach to the Property', options: ['Clear', 'Partially Clear', 'Not Clear'], selected: fields.legalApproach || 'Clear', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawSlashOptionRow('Any other features like board of other financier indicating mortgage, notice of Court/any authority which may affect the security', ['Yes', 'No'], fields.otherEncumbranceFeatures || 'No', 387.64, CONTENT_W - 387.64);

    // Property Details
    r.drawSectionHeader('Property Details');
    r.drawKeyValueRow([
      { label: 'Occupancy', value: fields.occupiedBy || 'Self-occupied', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
      { label: 'Occupied By', value: fields.occupiedByText || fields.occupiedBy || 'Self-occupied', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
    ]);
    r.drawKeyValueRow([
      { label: 'Occupied Since', value: fields.occupiedSince || 'NA', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: false },
      { label: 'Name of the Occupant', value: fields.occupantName || 'NA', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
    ]);
    r.drawTwoSlashOptionRows(
      { label: 'Property Demarcated', options: ['Yes', 'Partially', 'No'], selected: fields.plotDemarcated || 'Yes', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Property Identification', options: ['Yes', 'No'], selected: (fields.propertyIdentification?.toLowerCase() === 'no' || fields.propertyIdentification === 'Difficult to identify') ? 'No' : 'Yes', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawKeyValueRow([{ label: 'Identification through', value: fields.identificationThrough || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, bold: true }]);
    r.drawTwoSlashOptionRows(
      { label: 'Project Category', options: ['A', 'B', 'C', 'D', 'A+', 'Not Applicable'], selected: fields.projectCategory || 'Not Applicable', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Flat Type', options: ['Normal', 'Duplex', 'Not applicable'], selected: fields.flatType || 'Not applicable', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawKVAndSlashRow(
      { label: 'Flat Configuration', value: fields.flatConfiguration || 'NA', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
      { label: 'Property Holding', options: ['Freehold', 'Leasehold'], selected: fields.propertyHolding || 'Freehold', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawKeyValueRow([
      { label: 'Type of Structure', value: fields.structureType || 'RCC', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
      { label: 'Area of Flat', value: fields.areaOfFlat || 'NA', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
    ]);
    r.drawKVAndSlashRow(
      { label: 'Total No of Floors', value: fields.totalNoOfFloors || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
      { label: 'Lift Facility', options: ['No', 'Yes'], selected: fields.liftFacility || 'No', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawTwoSlashOptionRows(
      { label: 'Amenities', options: ['Average', 'Excellent', 'Good', 'Low', 'NA'], selected: fields.amenities || 'Good', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Marketability', options: ['Average', 'Excellent', 'Good', 'Low'], selected: fields.marketability || 'Average', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawKVAndSlashRow(
      { label: 'View of the Property', value: fields.viewOfProperty || 'Residential', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
      { label: 'Parking Facility', options: ['Yes', 'No'], selected: fields.parkingFacility || 'Yes', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawTwoSlashOptionRows(
      { label: 'Quality of Construction', options: ['Class A', 'Class B', 'Class C', 'Class D'], selected: fields.qualityOfConstruction || 'Class B', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Type of Parking', options: ['Open CP', 'Dependent CP', 'Covered CP', 'Mechanical CP', 'Semi-Covered'], selected: fields.typeOfParking || 'Open CP', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawTwoSlashOptionRows(
      { label: 'Shape of the Property', options: ['Regular', 'Irregular'], selected: fields.shapeOfProperty || 'Regular', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Placement of the Property', options: ['NE Facing Corner Plot', 'Corner Plot', 'Intermittent Property', 'South Facing'], selected: fields.placementOfProperty || 'South Facing', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawTwoSlashOptionRows(
      { label: 'Exteriors of the Property', options: ['Average', 'Poor', 'Excellent', 'Good', 'Low'], selected: fields.exteriors || 'Average', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Interiors of the Property', options: ['Average', 'Poor', 'Excellent', 'Good', 'Low'], selected: fields.interiors || 'Average', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );
    r.drawKeyValueRow([
      { label: 'Age of the Property', value: fields.ageOfPropertyActual || 'NA', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
      { label: 'Residual Age', value: fields.estimatedFutureLife || 'NA', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, bold: true },
    ]);
    r.drawKeyValueRow([{ label: 'Source of age of Property', value: fields.sourceOfAge || 'NA', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, bold: true }]);
    r.drawTwoSlashOptionRows(
      { label: 'Maintenance of the Property', options: ['Average', 'Excellent', 'Good', 'Low'], selected: fields.maintenanceCondition || 'Good', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Cautious Location', options: ['No', 'Yes'], selected: fields.cautiousLocations || 'No', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL }
    );

    // Accommodation Details
    r.drawSectionHeader('Accommodation/Unit Details');
    r.drawKeyValueRow([{ label: 'Unit Category', value: fields.unitTypeHeader || 'Building', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Ground Floor Details', value: fields.accommodationDetails || '3(G+2)', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // Documentation Details
    r.drawSectionHeader('Documentation Details');
    const docItems = [
      { name: 'Sale deed/\nAllotment letter', status: fields.docSaleDeedStatus || 'Fully Available', details: fields.docSaleDeedDetails || 'Copy of Sale deed, ROR' },
      { name: 'Sanctioned Plan', status: fields.docSanctionPlanStatus || 'Not Available', details: fields.docSanctionPlanDetails || 'NA' },
      { name: 'CC/OC', status: fields.docCCOCStatus || 'Not Available', details: fields.docCCOCDetails || 'NA' },
      { name: 'Agreement to Sale', status: fields.docAgreementSaleStatus || 'Not Available', details: fields.docAgreementSaleDetails || 'NA' },
      { name: 'Mutation/\nPossession Letter', status: fields.docMutationStatus || 'Not Available', details: fields.docMutationDetails || 'NA' },
      { name: 'Tax Receipt', status: fields.docTaxReceiptStatus || 'Not Available', details: fields.docTaxReceiptDetails || 'NA' },
      { name: 'Electricity Bill', status: fields.docElectricityBillStatus || 'Not Available', details: fields.docElectricityBillDetails || 'NA' },
      { name: 'Conversion', status: fields.docConversionStatus || 'Not Available', details: fields.docConversionDetails || 'NA' },
    ];
    r.drawDocChecklistTable(docItems);

    // Built-Up Area Table (directly underneath Documentation Details)
    const buaRowsData = fields.buaRows && fields.buaRows.length > 0 ? fields.buaRows : DEFAULT_BUA_ROWS;
    r.drawBuaTable(buaRowsData);

    // Valuation Table
    r.drawSectionHeader('Valuation');
    const valCols = [215, 110, 110, 110.28];
    const fmtArea = (val: any) => {
      if (val === null || val === undefined) return '';
      const s = String(val).trim();
      if (s.toUpperCase() === 'NA') return 'NA';
      if (s === '-' || s === '') return '';
      return s.toLowerCase().endsWith('sqft') ? s : `${s}sqft`;
    };
    const buaFullLabel = fields.buaStructureSuffix && fields.buaStructureSuffix.trim()
      ? `Built Up Area (as per measurement) ${fields.buaStructureSuffix.trim().startsWith('(') ? fields.buaStructureSuffix.trim() : `(${fields.buaStructureSuffix.trim()})`}`
      : 'Built Up Area (as per measurement)';

    const fmtRate = (rate: any, isNA: boolean) => {
      if (isNA) return 'NA';
      if (!rate || rate === '0' || rate === '-') return '';
      return `Rs.${rate}/-`;
    };
    const fmtVal = (val: number, isNA: boolean) => {
      if (isNA) return 'NA';
      return val > 0 ? `Rs.${formatIndianCurrency(val)}/-` : '-';
    };

    r.drawTable(
      ['Detailing', 'Area in Sqft', 'Rate per Sqft', 'Value'],
      [
        ['Plot Area (in Deed)', fmtArea(fields.plotAreaDocs), fmtRate(fields.plotAreaDocsRate, fields.plotAreaDocs === 'NA'), fmtVal(plotDeedVal, fields.plotAreaDocs === 'NA')],
        ['Plot Area (as per physical)', fmtArea(fields.plotAreaPhysical), fmtRate(fields.plotAreaPhysicalRate, fields.plotAreaPhysical === 'NA'), fmtVal(plotPhysicalVal, fields.plotAreaPhysical === 'NA')],
        ['Carpet Area (as per plan)', fmtArea(fields.carpetAreaPlan), fmtRate(fields.carpetAreaPlanRate, fields.carpetAreaPlan === 'NA'), fmtVal(carpetPlanVal, fields.carpetAreaPlan === 'NA')],
        ['Carpet Area (as per measurement)', fmtArea(fields.carpetAreaMeasurement), fmtRate(fields.carpetAreaMeasurementRate, fields.carpetAreaMeasurement === 'NA'), fmtVal(carpetMeasurementVal, fields.carpetAreaMeasurement === 'NA')],
        ['Built Up Area (as per Norms)', fmtArea(fields.buaNorms), fmtRate(fields.buaNormsRate, fields.buaNorms === 'NA'), fmtVal(buaNormsVal, fields.buaNorms === 'NA')],
        [buaFullLabel, fmtArea(fields.buaMeasurementArea), fmtRate(fields.buaMeasurementRate, fields.buaMeasurementArea === 'NA'), fmtVal(buaTotalVal, fields.buaMeasurementArea === 'NA')],
        ['Super Built-Up Area', fields.superBua && String(fields.superBua).toUpperCase() !== 'NA' ? fmtArea(fields.superBua) : '0', fields.superBuaRate ? String(fields.superBuaRate) : '0', superBuaVal > 0 ? `Rs.${formatIndianCurrency(superBuaVal)}/-` : '0'],
        ['Car Park', String(fields.carParkArea || '0'), String(fields.carParkRate || '0'), carParkVal > 0 ? `Rs.${formatIndianCurrency(carParkVal)}/-` : '0'],
        ['Amenities', String(fields.amenitiesArea || '0'), String(fields.amenitiesRate || '0'), amenitiesVal > 0 ? `Rs.${formatIndianCurrency(amenitiesVal)}/-` : '0'],
      ],
      valCols,
      [],
      [0]
    );

    // Other Details / Setbacks Table
    r.drawSectionHeader('Other Details');
    r.drawSetbacksTable(
      [
        { position: 'Front', plan: fields.setbackFrontPlan || 'M', site: fields.setbackFrontActual || 'M' },
        { position: 'Side1(Left)', plan: fields.setbackSide1Plan || 'M', site: fields.setbackSide1Actual || 'M' },
        { position: 'Side2(Right)', plan: fields.setbackSide2Plan || 'M', site: fields.setbackSide2Actual || 'M' },
        { position: 'Rear', plan: fields.setbackRearPlan || 'M', site: fields.setbackRearActual || 'M' },
      ],
      fields.setbackUsageDeviation || 'Usage Deviation',
      fields.setbackRemarks || 'Plan not provided'
    );

    // Valuation Summary
    const valItemsBreakdown: string[] = [
      plotDeedVal > 0 ? `Rs.${formatIndianCurrency(plotDeedVal)}/-` : '',
      plotPhysicalVal > 0 ? `Rs.${formatIndianCurrency(plotPhysicalVal)}/-` : '',
      carpetPlanVal > 0 ? `Rs.${formatIndianCurrency(carpetPlanVal)}/-` : '',
      carpetMeasurementVal > 0 ? `Rs.${formatIndianCurrency(carpetMeasurementVal)}/-` : '',
      buaNormsVal > 0 ? `Rs.${formatIndianCurrency(buaNormsVal)}/-` : '',
      buaTotalVal > 0 ? `Rs.${formatIndianCurrency(buaTotalVal)}/-` : '',
      superBuaVal > 0 ? `Rs.${formatIndianCurrency(superBuaVal)}/-` : '',
      carParkVal > 0 ? `Rs.${formatIndianCurrency(carParkVal)}/-` : '',
      amenitiesVal > 0 ? `Rs.${formatIndianCurrency(amenitiesVal)}/-` : '',
    ].filter(Boolean);

    const formulaText = totalCalculatedVal > 0
      ? (valItemsBreakdown.length > 1
          ? `${valItemsBreakdown.join(' + ')} = Rs.${formatIndianCurrency(totalCalculatedVal)}/-`
          : `Rs.${formatIndianCurrency(totalCalculatedVal)}/-`)
      : 'NA';
    const distressPctStr = (fields.distressPct !== '' && fields.distressPct != null) ? fields.distressPct : '0';
    r.drawKeyValueRow([{ label: 'Total Value', value: formulaText, labelWidth: 140, valueWidth: CONTENT_W - 140 }]);
    r.drawKeyValueRow([{ label: `Distress Value (${distressPctStr}%)`, value: distressVal > 0 ? `Rs.${formatIndianCurrency(distressVal)}/-` : 'NA', labelWidth: 140, valueWidth: CONTENT_W - 140 }]);
    r.drawKeyValueRow([{ label: 'Insurance Value', value: totalCalculatedVal > 0 ? `Rs.${formatIndianCurrency(totalCalculatedVal)}/-` : 'NA', labelWidth: 140, valueWidth: CONTENT_W - 140 }]);
    r.drawKeyValueRow([{ label: 'Government Value', value: fields.govtLandRate ? `Rs.${fields.govtLandRate}/-` : 'NA', labelWidth: 140, valueWidth: CONTENT_W - 140 }]);
    const W_PCT_LABEL = 140;
    const W_PCT_VAL = (CONTENT_W / 2) - W_PCT_LABEL; // 103.64
    r.drawKeyValueRow([
      { label: 'Percentage Completion', value: fields.percentageCompletion || '100%', labelWidth: W_PCT_LABEL, valueWidth: W_PCT_VAL },
      { label: 'Percentage Recommendation', value: fields.percentageRecommendation || '100%', labelWidth: W_PCT_LABEL, valueWidth: W_PCT_VAL },
    ]);

    // Boundary Detailing
    r.drawSectionHeader('Boundary Detailing');
    r.drawBoundaryDetailingTable(
      { north: fields.boundaryDeedNorth || '', south: fields.boundaryDeedSouth || '', east: fields.boundaryDeedEast || '', west: fields.boundaryDeedWest || '' },
      { north: fields.boundaryMouzaNorth || '', south: fields.boundaryMouzaSouth || '', east: fields.boundaryMouzaEast || '', west: fields.boundaryMouzaWest || '' },
      { north: fields.boundaryActualNorth || '', south: fields.boundaryActualSouth || '', east: fields.boundaryActualEast || '', west: fields.boundaryActualWest || '' },
      fields.boundariesMatching || 'Boundary matching as per documents'
    );

    // Remarks & Visited Engineer
    r.drawRemarksBox('Remarks', fields.remarks || '');
    r.drawKeyValueRow([{ label: 'Name of the Engineer visited', value: fields.engineerVisitedName || '', labelWidth: 180, valueWidth: CONTENT_W - 180 }]);

    // ═══ PAGE 5: PHOTOGRAPHS OF PROPERTY ═══
    if (photos.length > 0) {
      await r.drawPhotoGrid(photos);
    }

    // ═══ PAGE 6: LOCATION MAP & BHULEKH MOUZA MAP ═══
    if (locMapBytes || mouzaMapBytes) {
      r.newPage();
      r.drawSectionHeader('Location Map', false);
      if (locMapBytes && mouzaMapBytes) {
        await r.drawImageSection(locMapBytes, '', 310);
        await r.drawImageSection(mouzaMapBytes, '', 310);
      } else if (locMapBytes) {
        await r.drawImageSection(locMapBytes, '', 600);
      } else if (mouzaMapBytes) {
        await r.drawImageSection(mouzaMapBytes, '', 600);
      }
    }

    // ═══ PAGE 7: SUPERIMPOSED CADASTRAL MAP & DECLARATION ═══
    r.newPage();
    if (cadMapBytes) {
      r.drawSectionHeader('CADASTRAL MAP', false);
      await r.drawImageSection(cadMapBytes, '', 280);
    }
    r.drawDeclarationSection(
      fields.appraiserName || 'Er. Satyajit Mohanty',
      fields.preparedBy || '',
      fields.finalizedBy || ''
    );

    // ═══ PAGE 8+: STANDARDIZED ANNEXURES & SCHEDULES ═══
    if (fields.annexures && fields.annexures.length > 0) {
      await r.renderAnnexures(fields.annexures);
    }

    return await r.save();
  };

  const handlePreviewPDF = async () => {
    // Open a blank tab synchronously in the click handler to bypass browser pop-up blockers
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Generating Aditya Birla STSL PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #c0392b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating Aditya Birla STSL PDF Preview...</p>
              <p style="font-size: 12px; color: #6c757d; margin: 8px 0 0;">Please wait while the document compiles.</p>
            </div>
            <style>
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }

    setLoading(true);
    try {
      const pdfBytes = await generatePDFBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = url;
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      if (previewWindow && !previewWindow.closed) previewWindow.close();
      alert(`PDF Preview Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const pdfBytes = await generatePDFBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Aditya_Birla_STSL_Valuation_${projectCode || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`PDF Download Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const res = await saveReportDraft(projectId, fields);
      if (res && 'error' in res && res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        setMessage({ text: 'Draft saved successfully!', type: 'success' });
        setAutoSaveStatus('saved');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save draft.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for Manager verification?')) return;
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      const res = await submitReportForVerification(projectId);
      if (res && 'error' in res && res.error) {
        alert(res.error);
      } else {
        alert('Report submitted for Manager Review!');
        router.refresh();
      }
    } catch (err: any) {
      alert(`Submit failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 items-start w-full">
      {/* ── Main Form Column ── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Active Configuration Banner */}
        <ActiveConfigBanner
          clientType={fields.clientType || 'organisation'}
          category={fields.institutionCategory || 'Bank & FIS'}
          bankName={fields.organisationTemplate || fields.bankName || 'ADITYA BIRLA CAPITAL LTD'}
          subclass={fields.organisationSubTemplate || 'STSL'}
          serviceType={fields.serviceType || prefill?.purpose || undefined}
          subjectType={fields.subjectType || prefill?.propertyType || undefined}
          onResetWizard={onResetWizard}
        />

        {/* ═══ SECTION 1: BASIC DETAILS ═══ */}
        <Section title="Basic Details" number={1}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Client Name">
              <input type="text" value={fields.clientName || ''} onChange={e => handleChange('clientName', e.target.value)} disabled={isReadOnly} className={inputCls} />
            </Field>
            <BaseDateInput
              label="Initiation Date"
              value={fields.initiationDate || ''}
              onChange={val => handleChange('initiationDate', val)}
              disabled={isReadOnly}
            />
            <Field label="Vertical">
              <input type="text" value="STSL" disabled className={`${inputCls} bg-neutral-100 font-bold text-[#0f2038]`} />
            </Field>
            <BaseDateInput
              label="Visit Date (Inspection Date)"
              value={fields.dateOfInspection || ''}
              onChange={val => handleChange('dateOfInspection', val)}
              disabled={isReadOnly}
            />
            <Field label="Case Reference Number">
              <input type="text" value={fields.caseReferenceNumber || ''} onChange={e => handleChange('caseReferenceNumber', e.target.value)} disabled={isReadOnly} className={inputCls} />
            </Field>
            <BaseDateInput
              label="Report Date (Valuation Date)"
              value={fields.dateOfValuation || ''}
              onChange={val => handleChange('dateOfValuation', val)}
              disabled={isReadOnly}
            />
            <Field label="Name of the Property Owner" span={2}>
              <input type="text" value={fields.propertyOwnerName || ''} onChange={e => handleChange('propertyOwnerName', e.target.value)} disabled={isReadOnly} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* ═══ SECTION 2: LOCATION DETAILS ═══ */}
        <Section title="Location Details & Distance Matrix" number={2}>
          <div className="space-y-4">
            {/* Property Address Card with Annexure Toggle */}
            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-blue-200/80 pb-3 flex-wrap gap-2">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Property Address <span className="text-[10px] font-normal text-blue-700/80 normal-case">(TRF, Site Visit & Document Address)</span>
                </h3>
                <AnnexureRefSelector
                  label="Property Address"
                  annexureEnabled={fields.annexureEnabled}
                  annexureRef={fields.annexureRef}
                  annexureRefShowAlso={fields.annexureRefShowAlso}
                  annexures={fields.annexures || []}
                  isReadOnly={isReadOnly}
                  onToggleEnabled={() => {
                    setFields(prev => {
                      if (prev.annexureEnabled) {
                        const remaining = (prev.annexures || []).filter(a => a.id !== prev.annexureRef);
                        return {
                          ...prev,
                          annexureEnabled: false,
                          annexureRef: '',
                          annexureRefShowAlso: false,
                          annexures: reorderAndLabelAnnexures(
                            remaining,
                            '',
                            prev.legalAnnexureRef,
                            false,
                            prev.legalAnnexureEnabled
                          ),
                        };
                      } else {
                        const newId = String(Date.now());
                        const newAnnexure: AnnexureItem = {
                          id: newId,
                          label: 'A',
                          title: 'Property Address Schedule',
                          excelFileUrl: '',
                          excelFileName: '',
                        };
                        const updated = [...(prev.annexures || []), newAnnexure];
                        return {
                          ...prev,
                          annexureEnabled: true,
                          annexureRef: newId,
                          annexures: reorderAndLabelAnnexures(
                            updated,
                            newId,
                            prev.legalAnnexureRef,
                            true,
                            prev.legalAnnexureEnabled
                          ),
                        };
                      }
                    });
                  }}
                  onToggleShowAlso={() => handleChange('annexureRefShowAlso', !fields.annexureRefShowAlso)}
                  onSelectRef={id => handleChange('annexureRef', id)}
                  reportRefText="Address as per Document"
                />
              </div>

              {(!fields.annexureEnabled || fields.annexureRefShowAlso) && (
                <div className="space-y-3">
                  <Field label="Property Address as Per TRF">
                    <textarea rows={2} value={fields.propertyAddressAsTRF || ''} onChange={e => handleChange('propertyAddressAsTRF', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="Khata No, Plot No, Mouza, Tahasil, Dist, Pin..." />
                  </Field>
                  <Field label="Property Address as Per Visit (Physical Site Inspection)">
                    <textarea rows={2} value={fields.propertyAddressAsVisit || ''} onChange={e => handleChange('propertyAddressAsVisit', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="As verified on ground..." />
                  </Field>
                  <Field label='Property Address as Per "Docs" (Title Deeds)'>
                    <textarea rows={2} value={fields.propertyAddressAsDocs || ''} onChange={e => handleChange('propertyAddressAsDocs', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="As written in registered deed..." />
                  </Field>
                </div>
              )}
            </div>

            {/* 1. Locality Breakdown Container */}
            <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="border-b border-slate-200/80 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Locality Breakdown
                </h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="Main Locality">
                  <input type="text" value={fields.mainLocality || ''} onChange={e => handleChange('mainLocality', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Nayagarh Town" />
                </Field>
                <Field label="Sub Locality">
                  <input type="text" value={fields.subLocality || ''} onChange={e => handleChange('subLocality', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Ward No 5" />
                </Field>
                <Field label="Micro Location">
                  <input type="text" value={fields.microLocation || ''} onChange={e => handleChange('microLocation', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Near Market Complex" />
                </Field>
                <Field label="Landmark">
                  <input type="text" value={fields.landmark || ''} onChange={e => handleChange('landmark', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Near SND High School" />
                </Field>
              </div>
            </div>

            {/* 2. Geographic Coordinates Container */}
            <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-200 shadow-xs space-y-3">
              <div className="border-b border-sky-200/80 pb-2">
                <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                  Geographic Coordinates
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Latitude">
                  <input type="text" value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} className={inputCls} />
                </Field>
                <Field label="Longitude">
                  <input type="text" value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} className={inputCls} />
                </Field>
              </div>
            </div>

            {/* 3. Type of Property & Usage Container */}
            <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 shadow-xs space-y-3">
              <div className="border-b border-indigo-200/80 pb-2">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                  Type of Property & Usage
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Type of Property">
                  <select
                    value={fields.typeOfProperty || fields.propertyType || 'Residential'}
                    onChange={e => {
                      const val = e.target.value;
                      handleChange('typeOfProperty', val);
                      handleChange('propertyType', val);
                    }}
                    disabled={isReadOnly}
                    className={selectCls}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Institutional">Institutional</option>
                    <option value="Agriculture">Agriculture</option>
                    <option value="Residential cum commercial">Residential cum commercial</option>
                  </select>
                </Field>
                <Field label="Current Usage">
                  <input type="text" value={fields.currentUsage || 'Residential'} onChange={e => handleChange('currentUsage', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Residential" />
                </Field>
              </div>
            </div>

            {/* 4. Prior Valuation with ABCL Container */}
            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-xs space-y-3">
              <div className="border-b border-amber-200/80 pb-2">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Valuation History with ABCL
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Valued for ABCL Before?">
                  <select
                    value={fields.valuedBefore || 'No'}
                    onChange={e => {
                      const val = e.target.value;
                      handleChange('valuedBefore', val);
                      if (val === 'No') {
                        handleChange('valuedBeforeDate', '');
                      }
                    }}
                    disabled={isReadOnly}
                    className={selectCls}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
                {fields.valuedBefore === 'Yes' ? (
                  <BaseDateInput
                    label="If Yes When? (Date of Prior Valuation)"
                    value={fields.valuedBeforeDate || ''}
                    onChange={val => handleChange('valuedBeforeDate', val)}
                    disabled={isReadOnly}
                  />
                ) : (
                  <div className="flex items-center text-xs text-neutral-500 italic pt-6">
                    No prior valuation recorded for ABCL.
                  </div>
                )}
              </div>
            </div>

            {/* 5. Property Classification Container (Property Type & Sub Type) */}
            <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 shadow-xs space-y-3">
              <div className="border-b border-purple-200/80 pb-2">
                <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                  Property Classification
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Property Type (Auto-synced)">
                  <div className="relative">
                    <input
                      type="text"
                      value={fields.typeOfProperty || fields.propertyType || 'Residential'}
                      disabled
                      className={`${inputCls} bg-white/90 text-neutral-700 font-medium cursor-not-allowed`}
                      title="Locked: Automatically synced with Type of Property"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1 font-medium">
                    <span>ℹ️</span> Note: This value is referenced from Type of Property
                  </p>
                </Field>
                <Field label="Property Sub Type">
                  <input type="text" value={fields.propertySubType || 'Row House'} onChange={e => handleChange('propertySubType', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Row House / Bungalow / Flat" />
                </Field>
              </div>
            </div>

            {/* 6. Locality Nature & Municipal Jurisdiction Container */}
            <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 shadow-xs space-y-3">
              <div className="border-b border-emerald-200/80 pb-2">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Locality & Municipal Jurisdiction
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Locality Development">
                  <select value={fields.localityDevelopment || 'Developing'} onChange={e => handleChange('localityDevelopment', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Well Developed">Well Developed</option>
                    <option value="Developed">Developed</option>
                    <option value="Developing">Developing</option>
                    <option value="Under Develop">Under Develop</option>
                    <option value="Slum">Slum</option>
                  </select>
                </Field>
                <Field label="Property Falling Within Limits Of">
                  <select value={fields.propertyJurisdiction || 'Gram Panchayat'} onChange={e => handleChange('propertyJurisdiction', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Municipal Corporation">Municipal Corporation</option>
                    <option value="Gram Panchayat">Gram Panchayat</option>
                    <option value="Town Planning Authority">Town Planning Authority</option>
                    <option value="Development Authority">Development Authority</option>
                    <option value="Municipality">Municipality</option>
                    <option value="NAC">NAC</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* 7. Surroundings & Site Condition Container */}
            <div className="bg-teal-50/80 p-4 rounded-xl border border-teal-200 shadow-xs space-y-3">
              <div className="border-b border-teal-200/80 pb-2">
                <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                  Surroundings & Site Condition
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Occupancy Level of Surrounding">
                  <select value={fields.surroundingOccupancy || 'Densely Populated'} onChange={e => handleChange('surroundingOccupancy', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Densely Populated">Densely Populated</option>
                    <option value="Moderately Populated">Moderately Populated</option>
                    <option value="Low Population density">Low Population density</option>
                  </select>
                </Field>
                <Field label="Condition of Property Site">
                  <select value={fields.conditionOfSite || 'Developing'} onChange={e => handleChange('conditionOfSite', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Well Developed">Well Developed</option>
                    <option value="Developing">Developing</option>
                    <option value="Under Developed">Under Developed</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* 8. Distances & Connectivity Container */}
            <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 shadow-xs space-y-3">
              <div className="border-b border-blue-200/80 pb-2">
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                  Distances & Connectivity
                </h3>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Distance to Railway/Metro Station">
                  <input type="text" value={fields.distanceRailwayStation || ''} onChange={e => handleChange('distanceRailwayStation', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 5-Kms from Railway Station" />
                </Field>
                <Field label="Distance to Bus Stop">
                  <input type="text" value={fields.distanceBusStop || ''} onChange={e => handleChange('distanceBusStop', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 1-Km from Bus Stop" />
                </Field>
                <Field label="Distance from Main Road">
                  <select value={fields.distanceFromMainRoad || 'Not Applicable (Prop on Concrete Road)'} onChange={e => handleChange('distanceFromMainRoad', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not Applicable (Prop on Concrete Road)">Not Applicable (Prop on Concrete Road)</option>
                    <option value="Less than 200 m">Less than 200 m</option>
                    <option value="200 to 500 m">200 to 500 m</option>
                    <option value="above 500 m">above 500 m</option>
                  </select>
                </Field>
                <Field label="Distance from City Centre">
                  <input type="text" value={fields.distanceFromCityCenter || ''} onChange={e => handleChange('distanceFromCityCenter', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 10-Kms from City Centre" />
                </Field>
                <Field label="Distance from ABCL Branch">
                  <input type="text" value={fields.distanceFromBranch || ''} onChange={e => handleChange('distanceFromBranch', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 8-Kms from Branch" />
                </Field>
                <Field label="Width of the Approach Road">
                  <select value={fields.approachRoadWidth || 'Concrete Road'} onChange={e => handleChange('approachRoadWidth', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Width">Width</option>
                    <option value="Width is >40 ft.">Width is &gt;40 ft.</option>
                    <option value="Width 20 to 40 ft.">Width 20 to 40 ft.</option>
                    <option value="Clear width<15ft">Clear width&lt;15ft</option>
                    <option value="Concrete Road">Concrete Road</option>
                    <option value="Illegal Road (Without document)">Illegal Road (Without document)</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* 9. Dimensions of the Property Container */}
            <div className="bg-cyan-50/80 p-4 rounded-xl border border-cyan-200 shadow-xs space-y-3">
              <div className="border-b border-cyan-200/80 pb-2">
                <h3 className="text-xs font-bold text-cyan-900 uppercase tracking-wide">
                  Dimensions of the Property
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Width (Facing Road Side) in Feet">
                  <input type="text" value={fields.dimensionWidth || ''} onChange={e => handleChange('dimensionWidth', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 30 feet or NA" />
                </Field>
                <Field label="Depth (in Feet)">
                  <input type="text" value={fields.dimensionDepth || ''} onChange={e => handleChange('dimensionDepth', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 45 feet or NA" />
                </Field>
              </div>
            </div>

            {/* 10. Approach & Encumbrance Status Container */}
            <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-xs space-y-3">
              <div className="border-b border-rose-200/80 pb-2">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  Approach & Encumbrance Status
                </h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Physical Approach">
                  <select value={fields.physicalApproach || 'Clear'} onChange={e => handleChange('physicalApproach', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Clear">Clear</option>
                    <option value="Partially Clear">Partially Clear</option>
                    <option value="Not Clear">Not Clear</option>
                  </select>
                </Field>
                <Field label="Legal Approach">
                  <select value={fields.legalApproach || 'Clear'} onChange={e => handleChange('legalApproach', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Clear">Clear</option>
                    <option value="Partially Clear">Partially Clear</option>
                    <option value="Not Clear">Not Clear</option>
                  </select>
                </Field>
                <Field label="Other Encumbrance / Security Notice">
                  <select value={fields.otherEncumbranceFeatures || 'No'} onChange={e => handleChange('otherEncumbranceFeatures', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 3: PROPERTY DETAILS ═══ */}
        <Section title="Property Details" number={3}>
          <div className="space-y-4">
            {/* 1. Occupancy Details Container */}
            <div className="bg-slate-50/90 p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="border-b border-slate-200/80 pb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Occupancy Details
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Occupancy">
                  <select value={fields.occupiedBy || 'Self-occupied'} onChange={e => handleChange('occupiedBy', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Self-occupied">Self-occupied</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                </Field>
                <Field label="Occupied By">
                  <input type="text" value={fields.occupiedByText || fields.occupiedBy || 'Self-occupied'} onChange={e => handleChange('occupiedByText', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Self-occupied / Tenant" />
                </Field>
                <Field label="Occupied Since">
                  <input type="text" value={fields.occupiedSince || ''} onChange={e => handleChange('occupiedSince', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 5 Years or NA" />
                </Field>
                <Field label="Name of the Occupant">
                  <input type="text" value={fields.occupantName || ''} onChange={e => handleChange('occupantName', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Self / Name of occupant" />
                </Field>
              </div>
            </div>

            {/* 2. Property Demarcation & Identification Container */}
            <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-200 shadow-xs space-y-3">
              <div className="border-b border-sky-200/80 pb-2">
                <h3 className="text-xs font-bold text-sky-900 uppercase tracking-wide">
                  Property Demarcation & Identification
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Property Demarcated">
                  <select value={fields.plotDemarcated || 'Yes'} onChange={e => handleChange('plotDemarcated', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Yes">Yes</option>
                    <option value="Partially">Partially</option>
                    <option value="No">No</option>
                  </select>
                </Field>
                <Field label="Property Identification">
                  <select value={(fields.propertyIdentification === 'NO' || fields.propertyIdentification === 'No' || fields.propertyIdentification === 'Difficult to identify') ? 'No' : 'Yes'} onChange={e => handleChange('propertyIdentification', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>
                <Field label="Identification Through" span={2}>
                  <input type="text" value={fields.identificationThrough || ''} onChange={e => handleChange('identificationThrough', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Identified by document & help of customer" />
                </Field>
              </div>
            </div>

            {/* 3. Classification, Structure & Holding Container */}
            <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 shadow-xs space-y-3">
              <div className="border-b border-indigo-200/80 pb-2">
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                  Classification, Structure & Holding
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Project Category">
                  <select value={fields.projectCategory || 'Not Applicable'} onChange={e => handleChange('projectCategory', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not Applicable">Not Applicable</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="A+">A+</option>
                  </select>
                </Field>
                <Field label="Flat Type">
                  <select value={fields.flatType || 'Not applicable'} onChange={e => handleChange('flatType', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not applicable">Not applicable</option>
                    <option value="Normal">Normal</option>
                    <option value="Duplex">Duplex</option>
                  </select>
                </Field>
                <Field label="Flat Configuration">
                  <input type="text" value={fields.flatConfiguration || ''} onChange={e => handleChange('flatConfiguration', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 2 BHK / 3 BHK or NA" />
                </Field>
                <Field label="Property Holding">
                  <select value={fields.propertyHolding || 'Freehold'} onChange={e => handleChange('propertyHolding', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Freehold">Freehold</option>
                    <option value="Leasehold">Leasehold</option>
                  </select>
                </Field>
                <Field label="Type of Structure">
                  <select value={fields.structureType || 'RCC'} onChange={e => handleChange('structureType', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="RCC">RCC</option>
                    <option value="Load Bearing">Load Bearing</option>
                    <option value="Steel Structure">Steel Structure</option>
                  </select>
                </Field>
                <Field label="Area of Flat">
                  <input type="text" value={fields.areaOfFlat || ''} onChange={e => handleChange('areaOfFlat', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 1200 Sqft or NA" />
                </Field>
              </div>
            </div>

            {/* 4. Building Features, Amenities & View Container */}
            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-xs space-y-3">
              <div className="border-b border-amber-200/80 pb-2">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                  Building Features, Amenities & View
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Total No of Floors">
                  <input type="text" value={fields.totalNoOfFloors || ''} onChange={e => handleChange('totalNoOfFloors', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. G+2 or 3" />
                </Field>
                <Field label="Lift Facility">
                  <select value={fields.liftFacility || 'No'} onChange={e => handleChange('liftFacility', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
                <Field label="Amenities">
                  <select value={fields.amenities || 'Good'} onChange={e => handleChange('amenities', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Average">Average</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Low">Low</option>
                    <option value="NA">NA</option>
                  </select>
                </Field>
                <Field label="Marketability">
                  <select value={fields.marketability || 'Average'} onChange={e => handleChange('marketability', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Average">Average</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Low">Low</option>
                  </select>
                </Field>
                <Field label="View of the Property" span={2}>
                  <input type="text" value={fields.viewOfProperty || 'Residential'} onChange={e => handleChange('viewOfProperty', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Residential / Road View" />
                </Field>
              </div>
            </div>

            {/* 5. Quality of Construction & Parking Container */}
            <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 shadow-xs space-y-3">
              <div className="border-b border-purple-200/80 pb-2">
                <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wide">
                  Quality of Construction & Parking
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Quality of Construction" span={2}>
                  <select value={fields.qualityOfConstruction || 'Class B'} onChange={e => handleChange('qualityOfConstruction', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                    <option value="Class C">Class C</option>
                    <option value="Class D">Class D</option>
                  </select>
                </Field>
                <Field label="Parking Facility">
                  <select value={fields.parkingFacility || 'Yes'} onChange={e => handleChange('parkingFacility', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>
                <Field label="Type of Parking">
                  <select value={fields.typeOfParking || 'Open CP'} onChange={e => handleChange('typeOfParking', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Open CP">Open CP</option>
                    <option value="Dependent CP">Dependent CP</option>
                    <option value="Covered CP">Covered CP</option>
                    <option value="Mechanical CP">Mechanical CP</option>
                    <option value="Semi-Covered">Semi-Covered</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* 6. Shape, Placement & Aesthetics Container */}
            <div className="bg-teal-50/80 p-4 rounded-xl border border-teal-200 shadow-xs space-y-3">
              <div className="border-b border-teal-200/80 pb-2">
                <h3 className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                  Shape, Placement & Aesthetics
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Shape of Property">
                  <select value={fields.shapeOfProperty || 'Regular'} onChange={e => handleChange('shapeOfProperty', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Regular">Regular</option>
                    <option value="Irregular">Irregular</option>
                  </select>
                </Field>
                <Field label="Placement of Property">
                  <select value={fields.placementOfProperty || 'South Facing'} onChange={e => handleChange('placementOfProperty', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="NE Facing Corner Plot">NE Facing Corner Plot</option>
                    <option value="Corner Plot">Corner Plot</option>
                    <option value="Intermittent Property">Intermittent Property</option>
                    <option value="South Facing">South Facing</option>
                  </select>
                </Field>
                <Field label="Exteriors">
                  <select value={fields.exteriors || 'Average'} onChange={e => handleChange('exteriors', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Low">Low</option>
                  </select>
                </Field>
                <Field label="Interiors">
                  <select value={fields.interiors || 'Average'} onChange={e => handleChange('interiors', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Low">Low</option>
                  </select>
                </Field>
              </div>
            </div>

            {/* 7. Property Age & Residual Life Container */}
            <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 shadow-xs space-y-3">
              <div className="border-b border-emerald-200/80 pb-2">
                <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wide">
                  Property Age & Residual Life
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Age of Property (Actual)">
                  <input type="text" value={fields.ageOfPropertyActual || ''} onChange={e => handleChange('ageOfPropertyActual', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 7-Years or 5 Years" />
                </Field>
                <Field label="Residual Age / Life">
                  <input type="text" value={fields.estimatedFutureLife || ''} onChange={e => handleChange('estimatedFutureLife', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 53-Years or 55 Years" />
                </Field>
              </div>
            </div>

            {/* 8. Source of Age, Maintenance & Risk Container */}
            <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 shadow-xs space-y-3">
              <div className="border-b border-rose-200/80 pb-2">
                <h3 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  Source of Age, Maintenance & Risk
                </h3>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Source of Age of Property">
                  <input type="text" value={fields.sourceOfAge || 'NA'} onChange={e => handleChange('sourceOfAge', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA / Customer / Document" />
                </Field>
                <Field label="Maintenance of the Property">
                  <select value={fields.maintenanceCondition || 'Good'} onChange={e => handleChange('maintenanceCondition', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Average">Average</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Low">Low</option>
                  </select>
                </Field>
                <Field label="Cautious Location">
                  <select value={fields.cautiousLocations || 'No'} onChange={e => handleChange('cautiousLocations', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 4: ACCOMMODATION DETAILS ═══ */}
        <Section title="Accommodation Details" number={4}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Unit Header Category">
              <input type="text" value={fields.unitTypeHeader || 'Building'} onChange={e => handleChange('unitTypeHeader', e.target.value)} disabled={isReadOnly} className={inputCls} />
            </Field>
            <Field label="Ground Floor Accommodation Summary">
              <input type="text" value={fields.accommodationDetails || ''} onChange={e => handleChange('accommodationDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 1 Hall, 2 Bedrooms, Kitchen" />
            </Field>
          </div>
        </Section>

        {/* ═══ SECTION 5: DOCUMENTATION DETAILS (CHECKLIST) & BUILT-UP AREA ═══ */}
        <Section title="Documentation Details & Built-Up Area" number={5}>
          <div className="space-y-4">
            {/* 1. Sale Deed / Allotment Letter (Blue) */}
            <div className="bg-blue-50/80 p-4 rounded-xl border border-blue-200 shadow-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Sale Deed / Allotment Letter">
                  <select value={fields.docSaleDeedStatus || 'Fully Available'} onChange={e => handleChange('docSaleDeedStatus', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Fully Available">Fully Available</option>
                    <option value="Partially Available">Partially Available</option>
                    <option value="Not Available">Not Available</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </Field>
                <Field label="Details">
                  <input type="text" value={fields.docSaleDeedDetails || 'Copy of Sale deed, ROR'} onChange={e => handleChange('docSaleDeedDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Copy of Sale deed, ROR" />
                </Field>
              </div>
            </div>

            {/* 2. Sanctioned Plan (Indigo) */}
            <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 shadow-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Sanctioned Plan">
                  <select value={fields.docSanctionPlanStatus || 'Not Available'} onChange={e => handleChange('docSanctionPlanStatus', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not Available">Not Available</option>
                    <option value="Fully Available">Fully Available</option>
                    <option value="Partially Available">Partially Available</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </Field>
                <Field label="Details">
                  <input type="text" value={fields.docSanctionPlanDetails || 'NA'} onChange={e => handleChange('docSanctionPlanDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA / Sanction Plan Number" />
                </Field>
              </div>
            </div>

            {/* 3. CC / OC (Emerald) */}
            <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="CC / OC">
                  <select value={fields.docCCOCStatus || 'Not Available'} onChange={e => handleChange('docCCOCStatus', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not Available">Not Available</option>
                    <option value="Fully Available">Fully Available</option>
                    <option value="Partially Available">Partially Available</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </Field>
                <Field label="Details">
                  <input type="text" value={fields.docCCOCDetails || 'NA'} onChange={e => handleChange('docCCOCDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA / Certificate Details" />
                </Field>
              </div>
            </div>

            {/* 4. Agreement to Sale (Amber) */}
            <div className="bg-amber-50/80 p-4 rounded-xl border border-amber-200 shadow-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Agreement to Sale">
                  <select value={fields.docAgreementSaleStatus || 'Not Available'} onChange={e => handleChange('docAgreementSaleStatus', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not Available">Not Available</option>
                    <option value="Fully Available">Fully Available</option>
                    <option value="Partially Available">Partially Available</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </Field>
                <Field label="Details">
                  <input type="text" value={fields.docAgreementSaleDetails || 'NA'} onChange={e => handleChange('docAgreementSaleDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA / Agreement Details" />
                </Field>
              </div>
            </div>

            {/* 5. Mutation / Possession Letter (Purple) */}
            <div className="bg-purple-50/80 p-4 rounded-xl border border-purple-200 shadow-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Mutation / Possession Letter">
                  <select value={fields.docMutationStatus || 'Not Available'} onChange={e => handleChange('docMutationStatus', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not Available">Not Available</option>
                    <option value="Fully Available">Fully Available</option>
                    <option value="Partially Available">Partially Available</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </Field>
                <Field label="Details">
                  <input type="text" value={fields.docMutationDetails || 'NA'} onChange={e => handleChange('docMutationDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA / Mutation Details" />
                </Field>
              </div>
            </div>

            {/* 6. Tax Receipt (Teal) */}
            <div className="bg-teal-50/80 p-4 rounded-xl border border-teal-200 shadow-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Tax Receipt">
                  <select value={fields.docTaxReceiptStatus || 'Not Available'} onChange={e => handleChange('docTaxReceiptStatus', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not Available">Not Available</option>
                    <option value="Fully Available">Fully Available</option>
                    <option value="Partially Available">Partially Available</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </Field>
                <Field label="Details">
                  <input type="text" value={fields.docTaxReceiptDetails || 'NA'} onChange={e => handleChange('docTaxReceiptDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA / Holding Tax Details" />
                </Field>
              </div>
            </div>

            {/* 7. Electricity Bill (Sky) */}
            <div className="bg-sky-50/80 p-4 rounded-xl border border-sky-200 shadow-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Electricity Bill">
                  <select value={fields.docElectricityBillStatus || 'Not Available'} onChange={e => handleChange('docElectricityBillStatus', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not Available">Not Available</option>
                    <option value="Fully Available">Fully Available</option>
                    <option value="Partially Available">Partially Available</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </Field>
                <Field label="Details">
                  <input type="text" value={fields.docElectricityBillDetails || 'NA'} onChange={e => handleChange('docElectricityBillDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA / Consumer No" />
                </Field>
              </div>
            </div>

            {/* 8. Conversion (Rose) */}
            <div className="bg-rose-50/75 p-4 rounded-xl border border-rose-200 shadow-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Conversion">
                  <select value={fields.docConversionStatus || 'Not Available'} onChange={e => handleChange('docConversionStatus', e.target.value)} disabled={isReadOnly} className={selectCls}>
                    <option value="Not Available">Not Available</option>
                    <option value="Fully Available">Fully Available</option>
                    <option value="Partially Available">Partially Available</option>
                    <option value="Not Applicable">Not Applicable</option>
                  </select>
                </Field>
                <Field label="Details">
                  <input type="text" value={fields.docConversionDetails || 'NA'} onChange={e => handleChange('docConversionDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA / Order No" />
                </Field>
              </div>
            </div>

            {/* Built Up Area Table Container */}
            <div className="space-y-3 pt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0a1628] text-white">
                      <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Built up area</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">As per Site</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">As per Plan/FAR</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Deviations</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Remarks</th>
                      {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(fields.buaRows || DEFAULT_BUA_ROWS).map((row, idx) => (
                      <tr key={idx} className="bg-white hover:bg-neutral-50/50 transition-colors">
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input
                            className={inputCls + ' !py-1.5 text-xs font-bold text-[#0f2038]'}
                            value={row.floor || ''}
                            onChange={e => {
                              const updated = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
                              updated[idx] = { ...updated[idx], floor: e.target.value };
                              handleChange('buaRows', updated);
                            }}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input
                            type="text"
                            value={row.asPerSite || ''}
                            disabled={isReadOnly}
                            onChange={e => {
                              const updated = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
                              updated[idx] = { ...updated[idx], asPerSite: e.target.value };
                              handleChange('buaRows', updated);
                            }}
                            className={inputCls + ' !py-1.5 text-xs text-right'}
                            placeholder="e.g. 1000 sqft"
                          />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input
                            type="text"
                            value={row.asPerPlan || ''}
                            disabled={isReadOnly}
                            onChange={e => {
                              const updated = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
                              updated[idx] = { ...updated[idx], asPerPlan: e.target.value };
                              handleChange('buaRows', updated);
                            }}
                            className={inputCls + ' !py-1.5 text-xs text-right'}
                            placeholder="NA"
                          />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <select
                            value={row.deviations || 'No'}
                            disabled={isReadOnly}
                            onChange={e => {
                              const updated = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
                              updated[idx] = { ...updated[idx], deviations: e.target.value };
                              handleChange('buaRows', updated);
                            }}
                            className={selectCls + ' !py-1.5 text-xs'}
                          >
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                            <option value="Yes // No">Yes // No</option>
                          </select>
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input
                            type="text"
                            value={row.remarks || ''}
                            disabled={isReadOnly}
                            onChange={e => {
                              const updated = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
                              updated[idx] = { ...updated[idx], remarks: e.target.value };
                              handleChange('buaRows', updated);
                            }}
                            className={inputCls + ' !py-1.5 text-xs'}
                            placeholder="Remarks..."
                          />
                        </td>
                        {!isReadOnly && (
                          <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center">
                            {(fields.buaRows || DEFAULT_BUA_ROWS).length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeBuaRow(idx)}
                                className="text-red-400 hover:text-red-600 text-lg leading-none cursor-pointer"
                                title="Remove Floor"
                              >
                                &times;
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={addBuaRow}
                  className="text-sm text-[#b8860b] hover:text-[#96700a] font-semibold flex items-center gap-1.5 pt-1 cursor-pointer"
                >
                  <span className="text-lg leading-none">+</span> Add Floor Details
                </button>
              )}
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 6: VALUATION TABLE ═══ */}
        <Section title="Valuation Details" number={6}>
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Detailing</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Area in Sqft</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Rate per Sqft</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row 1: Plot Area (in Deed) */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs text-[#0f2038]">
                      Plot Area (in Deed)
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <AreaValueOrNACell
                        value={fields.plotAreaDocs ?? ''}
                        onChange={val => handleChange('plotAreaDocs', val)}
                        disabled={isReadOnly}
                        placeholder="e.g. 3920"
                        defaultVal="3920"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.plotAreaDocsRate || ''}
                        onKeyDown={blockNegativeKeys}
                        onChange={e => handleChange('plotAreaDocsRate', sanitizePositiveDecimal(e.target.value))}
                        disabled={isReadOnly || String(fields.plotAreaDocs).trim().toUpperCase() === 'NA'}
                         className={inputCls + ' !py-1.5 text-xs text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-normal text-xs bg-amber-50/50 text-[#0f2038]">
                      {plotDeedVal > 0 ? `Rs.${formatIndianCurrency(plotDeedVal)}/-` : (String(fields.plotAreaDocs).trim().toUpperCase() === 'NA' ? 'NA' : '-')}
                    </td>
                  </tr>

                  {/* Row 2: Plot Area (as per physical) */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs text-[#0f2038]">
                      Plot Area (as per physical)
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <AreaValueOrNACell
                        value={fields.plotAreaPhysical ?? ''}
                        onChange={val => handleChange('plotAreaPhysical', val)}
                        disabled={isReadOnly}
                        placeholder="e.g. 3920"
                        defaultVal="3920"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.plotAreaPhysicalRate || ''}
                        onKeyDown={blockNegativeKeys}
                        onChange={e => handleChange('plotAreaPhysicalRate', sanitizePositiveDecimal(e.target.value))}
                        disabled={isReadOnly || String(fields.plotAreaPhysical).trim().toUpperCase() === 'NA'}
                        className={inputCls + ' !py-1.5 text-xs text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-normal text-xs text-[#0f2038]">
                      {plotPhysicalVal > 0 ? `Rs.${formatIndianCurrency(plotPhysicalVal)}/-` : (String(fields.plotAreaPhysical).trim().toUpperCase() === 'NA' ? 'NA' : '-')}
                    </td>
                  </tr>

                  {/* Row 3: Carpet Area (as per plan) */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs text-[#0f2038]">
                      Carpet Area (as per plan)
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <AreaValueOrNACell
                        value={fields.carpetAreaPlan ?? 'NA'}
                        onChange={val => handleChange('carpetAreaPlan', val)}
                        disabled={isReadOnly}
                        placeholder="e.g. 1892"
                        defaultVal=""
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.carpetAreaPlanRate || ''}
                        onKeyDown={blockNegativeKeys}
                        onChange={e => handleChange('carpetAreaPlanRate', sanitizePositiveDecimal(e.target.value))}
                        disabled={isReadOnly || String(fields.carpetAreaPlan).trim().toUpperCase() === 'NA'}
                        className={inputCls + ' !py-1.5 text-xs text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-normal text-xs text-[#0f2038]">
                      {carpetPlanVal > 0 ? `Rs.${formatIndianCurrency(carpetPlanVal)}/-` : (String(fields.carpetAreaPlan).trim().toUpperCase() === 'NA' ? 'NA' : '-')}
                    </td>
                  </tr>

                  {/* Row 4: Carpet Area (as per measurement) */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs text-[#0f2038]">
                      Carpet Area (as per measurement)
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <AreaValueOrNACell
                        value={fields.carpetAreaMeasurement ?? ''}
                        onChange={val => handleChange('carpetAreaMeasurement', val)}
                        disabled={isReadOnly}
                        placeholder="e.g. 1892"
                        defaultVal="1892"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.carpetAreaMeasurementRate || ''}
                        onKeyDown={blockNegativeKeys}
                        onChange={e => handleChange('carpetAreaMeasurementRate', sanitizePositiveDecimal(e.target.value))}
                        disabled={isReadOnly || String(fields.carpetAreaMeasurement).trim().toUpperCase() === 'NA'}
                        className={inputCls + ' !py-1.5 text-xs text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-normal text-xs text-[#0f2038]">
                      {carpetMeasurementVal > 0 ? `Rs.${formatIndianCurrency(carpetMeasurementVal)}/-` : (String(fields.carpetAreaMeasurement).trim().toUpperCase() === 'NA' ? 'NA' : '-')}
                    </td>
                  </tr>

                  {/* Row 5: Built Up Area (as per Norms) */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs text-[#0f2038]">
                      Built Up Area (as per Norms)
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <AreaValueOrNACell
                        value={fields.buaNorms ?? 'NA'}
                        onChange={val => handleChange('buaNorms', val)}
                        disabled={isReadOnly}
                        placeholder="e.g. 2000"
                        defaultVal=""
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.buaNormsRate || ''}
                        onKeyDown={blockNegativeKeys}
                        onChange={e => handleChange('buaNormsRate', sanitizePositiveDecimal(e.target.value))}
                        disabled={isReadOnly || String(fields.buaNorms).trim().toUpperCase() === 'NA'}
                        className={inputCls + ' !py-1.5 text-xs text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-normal text-xs text-[#0f2038]">
                      {buaNormsVal > 0 ? `Rs.${formatIndianCurrency(buaNormsVal)}/-` : (String(fields.buaNorms).trim().toUpperCase() === 'NA' ? 'NA' : '-')}
                    </td>
                  </tr>

                  {/* Row 6: Built Up Area (as per measurement) */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef]">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-xs text-[#0f2038] whitespace-nowrap">
                          Built Up Area (as per measurement)
                        </span>
                        <input
                          type="text"
                          value={fields.buaStructureSuffix || ''}
                          onChange={e => handleChange('buaStructureSuffix', e.target.value)}
                          disabled={isReadOnly}
                          className="w-16 px-1.5 py-0.5 text-xs border border-neutral-300 rounded bg-white text-center font-bold text-[#0f2038] focus:ring-1 focus:ring-[#0f2038] shadow-2xs"
                          placeholder="(G+2)"
                          title="Structure / Floor configuration (e.g. (G+2), (G+1), Ground Floor)"
                        />
                      </div>
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <AreaValueOrNACell
                        value={fields.buaMeasurementArea ?? ''}
                        onChange={val => handleChange('buaMeasurementArea', val)}
                        disabled={isReadOnly}
                        placeholder="e.g. 2000"
                        defaultVal=""
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.buaMeasurementRate || ''}
                        onKeyDown={blockNegativeKeys}
                        onChange={e => handleChange('buaMeasurementRate', sanitizePositiveDecimal(e.target.value))}
                        disabled={isReadOnly || String(fields.buaMeasurementArea).trim().toUpperCase() === 'NA'}
                        className={inputCls + ' !py-1.5 text-xs text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-normal text-xs bg-amber-50/50 text-[#0f2038]">
                      {buaTotalVal > 0 ? `Rs.${formatIndianCurrency(buaTotalVal)}/-` : (String(fields.buaMeasurementArea).trim().toUpperCase() === 'NA' ? 'NA' : '-')}
                    </td>
                  </tr>

                  {/* Row 7: Super Built-Up Area */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs text-[#0f2038]">
                      Super Built-Up Area
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <AreaValueOrNACell
                        value={fields.superBua ?? ''}
                        onChange={val => handleChange('superBua', val)}
                        disabled={isReadOnly}
                        placeholder="e.g. Area"
                        defaultVal=""
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.superBuaRate ?? ''}
                        onKeyDown={blockNegativeKeys}
                        onChange={e => handleChange('superBuaRate', sanitizePositiveDecimal(e.target.value))}
                        disabled={isReadOnly || String(fields.superBua).trim().toUpperCase() === 'NA'}
                        className={inputCls + ' !py-1.5 text-xs text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-normal text-xs text-[#0f2038]">
                      {superBuaVal > 0 ? `Rs.${formatIndianCurrency(superBuaVal)}/-` : (String(fields.superBua).trim().toUpperCase() === 'NA' ? 'NA' : '-')}
                    </td>
                  </tr>

                  {/* Row 8: Car Park */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs text-[#0f2038]">
                      Car Park
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <AreaValueOrNACell
                        value={fields.carParkArea ?? ''}
                        onChange={val => handleChange('carParkArea', val)}
                        disabled={isReadOnly}
                        placeholder="e.g. Area"
                        defaultVal=""
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.carParkRate ?? ''}
                        onKeyDown={blockNegativeKeys}
                        onChange={e => handleChange('carParkRate', sanitizePositiveDecimal(e.target.value))}
                        disabled={isReadOnly || String(fields.carParkArea).trim().toUpperCase() === 'NA'}
                        className={inputCls + ' !py-1.5 text-xs text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-normal text-xs text-[#0f2038]">
                      {carParkVal > 0 ? `Rs.${formatIndianCurrency(carParkVal)}/-` : (String(fields.carParkArea).trim().toUpperCase() === 'NA' ? 'NA' : '-')}
                    </td>
                  </tr>

                  {/* Row 9: Amenities */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs text-[#0f2038]">
                      Amenities
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <AreaValueOrNACell
                        value={fields.amenitiesArea ?? ''}
                        onChange={val => handleChange('amenitiesArea', val)}
                        disabled={isReadOnly}
                        placeholder="e.g. Area"
                        defaultVal=""
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.amenitiesRate ?? ''}
                        onKeyDown={blockNegativeKeys}
                        onChange={e => handleChange('amenitiesRate', sanitizePositiveDecimal(e.target.value))}
                        disabled={isReadOnly || String(fields.amenitiesArea).trim().toUpperCase() === 'NA'}
                        className={inputCls + ' !py-1.5 text-xs text-right'}
                      />
                    </td>
                    <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-normal text-xs text-[#0f2038]">
                      {amenitiesVal > 0 ? `Rs.${formatIndianCurrency(amenitiesVal)}/-` : (String(fields.amenitiesArea).trim().toUpperCase() === 'NA' ? 'NA' : '-')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Compact Live Total Bar in Section 6 */}
            <div className="bg-[#0f2038] px-4 py-3 rounded-xl text-white flex justify-between items-center flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-neutral-300 font-medium">Calculated Total Valuation:</span>
                <span className="text-base font-black text-amber-300">Rs. {formatIndianCurrency(totalCalculatedVal)}</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Detailed breakdowns & distress parameters are managed in <span className="text-neutral-200 font-semibold">Section 7 (Other Details)</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 7: OTHER DETAILS (SETBACKS & VALUATION SUMMARY) ═══ */}
        <Section title="Other Details" number={7}>
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th colSpan={5} className="px-3 py-2.5 text-center font-bold text-xs uppercase tracking-wider border-b border-[#1e3a5f]">
                      Other Details
                    </th>
                  </tr>
                  <tr className="bg-[#0f2038] text-white text-xs">
                    <th className="px-3 py-2 text-left font-semibold border-b border-neutral-300 w-[20%]">Setbacks</th>
                    <th className="px-3 py-2 text-center font-semibold border-b border-neutral-300 w-[20%]">As per plan/ Bye laws</th>
                    <th className="px-3 py-2 text-center font-semibold border-b border-neutral-300 w-[20%]">Actual at site</th>
                    <th className="px-3 py-2 text-center font-semibold border-b border-neutral-300 w-[20%]">Deviation</th>
                    <th className="px-3 py-2 text-left font-semibold border-b border-neutral-300 w-[20%]">Remarks, if any</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-xs text-[#0f2038]">
                  {/* Row 1: Front */}
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-semibold">Front</td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.setbackFrontPlan || 'M'}
                        onChange={e => handleChange('setbackFrontPlan', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center'}
                        placeholder="M"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.setbackFrontActual || 'M'}
                        onChange={e => handleChange('setbackFrontActual', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center'}
                        placeholder="M"
                      />
                    </td>
                    <td rowSpan={4} className="px-2 py-2 border-b border-[#e9ecef] bg-neutral-50/40 align-middle">
                      <textarea
                        rows={5}
                        value={fields.setbackUsageDeviation || 'Usage Deviation'}
                        onChange={e => handleChange('setbackUsageDeviation', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1.5 text-xs resize-none text-center font-medium'}
                        placeholder="Usage Deviation"
                      />
                    </td>
                    <td rowSpan={4} className="px-2 py-2 border-b border-[#e9ecef] bg-neutral-50/40 align-middle">
                      <textarea
                        rows={5}
                        value={fields.setbackRemarks || 'Plan not provided'}
                        onChange={e => handleChange('setbackRemarks', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1.5 text-xs resize-none font-medium'}
                        placeholder="Plan not provided"
                      />
                    </td>
                  </tr>

                  {/* Row 2: Side1(Left) */}
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-semibold">Side1(Left)</td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.setbackSide1Plan || 'M'}
                        onChange={e => handleChange('setbackSide1Plan', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center'}
                        placeholder="M"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.setbackSide1Actual || 'M'}
                        onChange={e => handleChange('setbackSide1Actual', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center'}
                        placeholder="M"
                      />
                    </td>
                  </tr>

                  {/* Row 3: Side2(Right) */}
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-semibold">Side2(Right)</td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.setbackSide2Plan || 'M'}
                        onChange={e => handleChange('setbackSide2Plan', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center'}
                        placeholder="M"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.setbackSide2Actual || 'M'}
                        onChange={e => handleChange('setbackSide2Actual', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center'}
                        placeholder="M"
                      />
                    </td>
                  </tr>

                  {/* Row 4: Rear */}
                  <tr className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2 border-b-2 border-neutral-300 font-semibold">Rear</td>
                    <td className="px-2 py-1.5 border-b-2 border-neutral-300">
                      <input
                        type="text"
                        value={fields.setbackRearPlan || 'M'}
                        onChange={e => handleChange('setbackRearPlan', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center'}
                        placeholder="M"
                      />
                    </td>
                    <td className="px-2 py-1.5 border-b-2 border-neutral-300">
                      <input
                        type="text"
                        value={fields.setbackRearActual || 'M'}
                        onChange={e => handleChange('setbackRearActual', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center'}
                        placeholder="M"
                      />
                    </td>
                  </tr>

                  {/* Valuation Summary Rows in Tabular Form */}
                  {/* Total Value */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2.5 border-b border-[#e9ecef] font-bold text-xs bg-neutral-50/80">
                      Total Value
                    </td>
                    <td colSpan={4} className="px-3 py-2.5 border-b border-[#e9ecef]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-xs text-[#0f2038]">
                          {totalCalculatedVal > 0 ? (
                            valItemsBreakdown.length > 1
                              ? `${valItemsBreakdown.join(' + ')} = Rs.${formatIndianCurrency(totalCalculatedVal)}/-`
                              : `Rs.${formatIndianCurrency(totalCalculatedVal)}/-`
                          ) : 'NA'}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          Auto-sum from Section 6 Valuation Table
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Distress Value (with editable percentage) */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2.5 border-b border-[#e9ecef] font-bold text-xs bg-neutral-50/80">
                      <div className="flex items-center gap-1.5">
                        <span>Distress Value (</span>
                        <input
                          type="text"
                          value={fields.distressPct}
                          onKeyDown={blockNegativeKeys}
                          onChange={e => handleChange('distressPct', sanitizePositiveDecimal(e.target.value))}
                          disabled={isReadOnly}
                          className="w-12 text-center text-xs font-black text-amber-900 bg-amber-50 border border-amber-300 rounded px-0.5 py-0.5"
                          title="Click to edit Distress percentage"
                        />
                        <span>%)</span>
                      </div>
                    </td>
                    <td colSpan={4} className="px-3 py-2.5 border-b border-[#e9ecef]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-xs text-[#0f2038]">
                          {distressVal > 0 ? `Rs.${formatIndianCurrency(distressVal)}/-` : 'NA'}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          Calculated as {(fields.distressPct !== '' && fields.distressPct != null) ? fields.distressPct : '0'}% of Total Property Value
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Insurance Value */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2.5 border-b border-[#e9ecef] font-bold text-xs bg-neutral-50/80">
                      Insurance Value
                    </td>
                    <td colSpan={4} className="px-3 py-2.5 border-b border-[#e9ecef]">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-xs text-[#0f2038]">
                          {totalCalculatedVal > 0 ? `Rs.${formatIndianCurrency(totalCalculatedVal)}/-` : 'NA'}
                        </span>
                        <span className="text-[11px] text-neutral-500 font-medium">
                          Structure Reinstatement Value
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Government Value */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2.5 border-b border-[#e9ecef] font-bold text-xs bg-neutral-50/80">
                      Government Value
                    </td>
                    <td colSpan={4} className="px-3 py-2 border-b border-[#e9ecef]">
                      <div className="flex items-center gap-1.5 max-w-xs">
                        <span className="text-xs font-medium text-neutral-600">Rs.</span>
                        <input
                          type="text"
                          value={fields.govtLandRate || ''}
                          onKeyDown={blockNegativeKeys}
                          onChange={e => handleChange('govtLandRate', sanitizePositiveDecimal(e.target.value))}
                          disabled={isReadOnly}
                          className={inputCls + ' !py-1 text-xs font-semibold text-left'}
                          placeholder="e.g. 500"
                        />
                        <span className="text-xs font-medium text-neutral-600">/-</span>
                      </div>
                    </td>
                  </tr>

                  {/* Percentage Completion & Recommendation */}
                  <tr className="bg-white hover:bg-neutral-50/50 transition-colors">
                    <td className="px-3 py-2.5 border-b border-[#e9ecef] font-bold text-xs bg-neutral-50/80">
                      Percentage Completion
                    </td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.percentageCompletion ?? ''}
                        onChange={e => handleChange('percentageCompletion', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center font-semibold'}
                        placeholder="100%"
                      />
                    </td>
                    <td className="px-3 py-2.5 border-b border-[#e9ecef] font-bold text-xs bg-neutral-50/80 text-left">
                      Percentage Recommendation
                    </td>
                    <td colSpan={2} className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <input
                        type="text"
                        value={fields.percentageRecommendation ?? ''}
                        onChange={e => handleChange('percentageRecommendation', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls + ' !py-1 text-xs text-center font-semibold'}
                        placeholder="100%"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 8: BOUNDARY DETAILS ═══ */}
        <Section title="Boundary Detailing Table" number={8}>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0f2038] text-white">
                    <th className="p-2.5 text-left text-xs uppercase">Detailing</th>
                    <th className="p-2.5 text-left text-xs uppercase">North</th>
                    <th className="p-2.5 text-left text-xs uppercase">South</th>
                    <th className="p-2.5 text-left text-xs uppercase">East</th>
                    <th className="p-2.5 text-left text-xs uppercase">West</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white border-b border-neutral-200">
                    <td className="p-2 font-bold text-xs">As per Sale deed</td>
                    <td className="p-2"><input type="text" value={fields.boundaryDeedNorth || ''} onChange={e => handleChange('boundaryDeedNorth', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                    <td className="p-2"><input type="text" value={fields.boundaryDeedSouth || ''} onChange={e => handleChange('boundaryDeedSouth', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                    <td className="p-2"><input type="text" value={fields.boundaryDeedEast || ''} onChange={e => handleChange('boundaryDeedEast', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                    <td className="p-2"><input type="text" value={fields.boundaryDeedWest || ''} onChange={e => handleChange('boundaryDeedWest', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                  </tr>
                  <tr className="bg-neutral-50 border-b border-neutral-200">
                    <td className="p-2 font-bold text-xs">Bhulekh map</td>
                    <td className="p-2"><input type="text" value={fields.boundaryMouzaNorth || ''} onChange={e => handleChange('boundaryMouzaNorth', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                    <td className="p-2"><input type="text" value={fields.boundaryMouzaSouth || ''} onChange={e => handleChange('boundaryMouzaSouth', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                    <td className="p-2"><input type="text" value={fields.boundaryMouzaEast || ''} onChange={e => handleChange('boundaryMouzaEast', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                    <td className="p-2"><input type="text" value={fields.boundaryMouzaWest || ''} onChange={e => handleChange('boundaryMouzaWest', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                  </tr>
                  <tr className="bg-white border-b border-neutral-200">
                    <td className="p-2 font-bold text-xs">As per Actual</td>
                    <td className="p-2"><input type="text" value={fields.boundaryActualNorth || ''} onChange={e => handleChange('boundaryActualNorth', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                    <td className="p-2"><input type="text" value={fields.boundaryActualSouth || ''} onChange={e => handleChange('boundaryActualSouth', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                    <td className="p-2"><input type="text" value={fields.boundaryActualEast || ''} onChange={e => handleChange('boundaryActualEast', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                    <td className="p-2"><input type="text" value={fields.boundaryActualWest || ''} onChange={e => handleChange('boundaryActualWest', e.target.value)} disabled={isReadOnly} className={inputCls} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Field label="Boundary Matching (Status)">
              <input type="text" value={fields.boundariesMatching || 'Boundary matching as per documents'} onChange={e => handleChange('boundariesMatching', e.target.value)} disabled={isReadOnly} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* ═══ SECTION 9: REMARKS & SIGN-OFF ═══ */}
        <Section title="Remarks & Sign-off" number={9}>
          <div className="space-y-4">
            <Field label="General Remarks / Valuer Observations">
              <textarea rows={5} value={fields.remarks || ''} onChange={e => handleChange('remarks', e.target.value)} disabled={isReadOnly} className={inputCls} />
            </Field>
            <Field label="Name of the Engineer Visited">
              <input type="text" value={fields.engineerVisitedName || ''} onChange={e => handleChange('engineerVisitedName', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Dinesh Das" />
            </Field>
          </div>
        </Section>

        {/* ═══ SECTION 10: PHOTOGRAPHS ═══ */}
        <BasePhotographsSection
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploadingTarget === 'photos'}
          bucketCount={bucketImages?.length || 0}
          onImageNameChange={(idx, name) => {
            const updatedNames = [...(fields.propertyImageNames || [])];
            while (updatedNames.length <= idx) {
              updatedNames.push('');
            }
            updatedNames[idx] = name;
            handleChange('propertyImageNames', updatedNames);
          }}
          onRemoveImage={idx => {
            const updatedImgs = (fields.propertyImages || []).filter((_, i) => i !== idx);
            const updatedNames = (fields.propertyImageNames || []).filter((_, i) => i !== idx);
            handleChange('propertyImages', updatedImgs);
            handleChange('propertyImageNames', updatedNames);
          }}
          onReorderImages={(newImages, newNames) => {
            handleChange('propertyImages', newImages);
            handleChange('propertyImageNames', newNames);
          }}
          onUploadImages={handleUploadMultiplePhotos}
          onOpenBucketPicker={() => setBucketPickerOpen(true)}
          sectionNumber={10}
          sectionId="section-10"
        />

        {/* ═══ SECTION 11: MAPS & DOCUMENTS ═══ */}
        <BaseMapsSection
          locationMapImages={fields.locationMapImages || (fields.locationMapImage ? [fields.locationMapImage] : [])}
          mouzaMapImages={fields.mouzaMapImages || (fields.mouzaMapImage ? [fields.mouzaMapImage] : [])}
          sketchMapImages={fields.sketchMapImages || []}
          cadastralMapImages={fields.cadastralMapImages || (fields.cadastralMapImage ? [fields.cadastralMapImage] : [])}
          latitude={fields.latitude}
          longitude={fields.longitude}
          technicalAddress={fields.propertyAddressAsVisit || fields.propertyAddressAsDocs || ''}
          propertyAddress={fields.propertyAddressAsTRF || fields.propertyAddressAsVisit || ''}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Section 4 (Location Details)"
          isReadOnly={isReadOnly}
          uploading={uploadingTarget !== null}
          onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={(idx) => handleMapRemove('locationMapImages', idx)}
          onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={(idx) => handleMapRemove('mouzaMapImages', idx)}
          onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={(idx) => handleMapRemove('sketchMapImages', idx)}
          onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
          onCadastralMapRemove={(idx) => handleMapRemove('cadastralMapImages', idx)}
          onReorderLocationMap={(newImgs) => handleReorderMap('locationMapImages', newImgs)}
          onReorderMouzaMap={(newImgs) => handleReorderMap('mouzaMapImages', newImgs)}
          onReorderSketchMap={(newImgs) => handleReorderMap('sketchMapImages', newImgs)}
          onReorderCadastralMap={(newImgs) => handleReorderMap('cadastralMapImages', newImgs)}
          sectionNumber={11}
          sectionId="section-11"
          title="Location Map & Bhulekh Cadastral Map"
        />

        {/* ═══ SECTION 12: DECLARATION & SIGN-OFF ═══ */}
        <Section title="Declaration & Sign-off" number={12} id="section-12">
          <div className="space-y-6">
            {/* Declaration & Sign-off Fields */}
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Name of Appraiser">
                <div className="relative">
                  <input
                    type="text"
                    value={fields.appraiserName || 'Er. Satyajit Mohanty'}
                    disabled={true}
                    className={`${inputCls} bg-gray-50 text-gray-700 font-semibold cursor-not-allowed`}
                  />
                  <Lock className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </Field>
              <Field label="Report Prepared By">
                <input
                  type="text"
                  value={fields.preparedBy || ''}
                  onChange={e => handleChange('preparedBy', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                />
              </Field>
              <Field label="Report Finalized By">
                <input
                  type="text"
                  value={fields.finalizedBy || ''}
                  onChange={e => handleChange('finalizedBy', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 13: ANNEXURES & SCHEDULES ═══ */}
        <BaseAnnexureSection
          annexures={fields.annexures || []}
          isReadOnly={isReadOnly}
          uploading={uploadingTarget !== null}
          onAddAnnexure={addAnnexure}
          onRemoveAnnexure={removeAnnexure}
          onUpdateTitle={updateAnnexureTitle}
          onUploadExcel={handleAnnexureUpload}
          onRemoveFile={removeAnnexureFile}
          sectionNumber={13}
          sectionId="section-13-annexure"
        />

        {/* Standard Action Bar */}
        <ReportActionBar
          loading={loading}
          autoSaveStatus={autoSaveStatus}
          message={message}
          isReadOnly={isReadOnly}
          userRole={userRole}
          onSaveDraft={handleSaveDraft}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
          onSubmit={handleSubmit}
        />
      </div>

      {/* ── Floating Navigator Side Column ── */}
      <FloatingNavigator sections={NAV_SECTIONS} />

      {/* Base Photo Bucket Picker Modal */}
      <BasePhotoBucketModal
        isOpen={bucketPickerOpen}
        bucketImages={bucketImages || []}
        mode="propertyImages"
        onClose={() => setBucketPickerOpen(false)}
        onConfirm={selectedUrls => {
          const currentImages = fields.propertyImages || [];
          const currentNames = fields.propertyImageNames || [];
          const newImages = [...currentImages];
          const newNames = [...currentNames];
          selectedUrls.forEach((url, i) => {
            if (!newImages.includes(url)) {
              newImages.push(url);
              newNames.push(`Inspection Photo ${currentImages.length + i + 1}`);
            }
          });
          handleChange('propertyImages', newImages);
          handleChange('propertyImageNames', newNames);
        }}
      />
    </div>
  );
}
