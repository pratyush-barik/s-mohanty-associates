'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ActiveConfigBanner,
  ReportActionBar,
  NavItem,
  formatReportDate,
  BaseDateInput,
  BasePhotoBucketModal,
  BasePhotographsSection,
  DEFAULT_PHOTO_LABEL,
} from '../BaseBankReportComponents';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { BankConfig } from '@/lib/bank-fields';
import {
  PDFBandhanHLLAPRenderer,
  BandhanHLLAPReportFields,
  BandhanHLLAPFloor,
  BandhanHLLAPDRCFloor,
  BandhanHLLAPPhoto,
  getConstructionDetailsForStructure,
  getNdmaStructureTypeForStructure,
  getWorkProgressStructureLabel,
  formatDateDisplay,
  formatCommencementCompletion,
  formatAreaOfLandStatement,
} from '@/lib/banks/pdf-bandhan-hllap-renderer';

export const BANDHAN_HLLAP_CONFIG: BankConfig = {
  bankId: 'BANDHAN BANK',
  subTemplateId: 'HL-LAP',
  displayName: 'Bandhan Bank — HL-LAP',
  defaultValues: {
    purpose: 'Home Loan / LAP Valuation',
  },
};

export interface BandhanHLLAPProps {
  projectId: string;
  projectCode?: string;
  initialFields?: any;
  initialData?: any;
  status?: string;
  userRole?: string;
  isReadOnly?: boolean;
  bucketImages?: any[];
  prefill?: any;
  onResetWizard?: () => void;
}

const parseNum = (v: any): number => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

const sanitizePositiveInt = (val: string, maxLen?: number): string => {
  const digits = val.replace(/[^0-9]/g, '');
  return maxLen ? digits.slice(0, maxLen) : digits;
};

const sanitizePositiveFloat = (val: string): string => {
  let clean = val.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  return clean;
};

const sanitizePercentage = (val: string): string => {
  const clean = sanitizePositiveFloat(val.replace(/%/g, ''));
  if (!clean) return '';
  const num = parseFloat(clean);
  if (num > 100) return '100';
  return clean;
};

const getNextFloorName = (existingFloors: BandhanHLLAPFloor[]): string => {
  const count = existingFloors.length;
  if (count === 0) return 'Ground Floor';
  const hasFloorNumberPattern = existingFloors.some(f => /^Floor\s*\d+/i.test(f.floor || ''));
  if (hasFloorNumberPattern) {
    return `Floor ${count}`;
  }
  const standardNames = [
    'Ground Floor',
    'First Floor',
    'Second Floor',
    'Third Floor',
    'Fourth Floor',
    'Fifth Floor',
    'Sixth Floor',
    'Seventh Floor',
    'Eighth Floor',
    'Ninth Floor',
    'Tenth Floor',
  ];
  if (count < standardNames.length) {
    return standardNames[count];
  }
  return `Floor ${count}`;
};

const formatCurrencyINR = (val: number): string => {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(val);
};

export const computeBandhanValuation = (
  fields: Partial<BandhanHLLAPReportFields>,
  calculatedLandVal: number = 0,
  totalBldgVal: number = 0
) => {
  const land = parseNum(fields.netValueLand) || calculatedLandVal;
  const bldg = parseNum(fields.netValueBuilding) || totalBldgVal;
  const netLandBldg = land + bldg;

  const flatRate = parseNum(fields.rateOfFlat);
  const flatArea = parseNum(fields.areaOfFlat);
  const flatVal = (flatRate > 0 && flatArea > 0) ? Math.round(flatRate * flatArea) : 0;

  const depRaw = (fields.depreciationOfConstruction || '').trim();
  let depAmount = 0;
  let depDescription = 'Nil';

  if (depRaw && !/^(nil|na|n\.a\.|none|0|0%)$/i.test(depRaw)) {
    const depNum = parseNum(depRaw);
    if (depRaw.includes('%') || (depNum <= 100 && bldg > 1000)) {
      depAmount = Math.round((bldg * depNum) / 100);
      depDescription = `${depNum}% on Building = Rs.${formatCurrencyINR(depAmount)}/-`;
    } else {
      depAmount = depNum;
      depDescription = `Rs.${formatCurrencyINR(depAmount)}/-`;
    }
  }

  // Exact Formula: Net Value of Property (Land + Building) + (Recommended Rate of Flat * Area of Flat) - Depreciation of Construction
  const recommendedValue = Math.max(0, netLandBldg + flatVal - depAmount);

  // Base Market Value for Distress / Realisable calculations
  const baseMarketValue = parseNum(fields.totalMarketValue) || (fields.recommendedValueOfProperty ? parseNum(fields.recommendedValueOfProperty) : recommendedValue);

  // Decimal percentage handling
  const distressPct = fields.distressSalePct !== undefined && fields.distressSalePct !== '' ? parseNum(fields.distressSalePct) : 90;
  const distressValue = Math.round((baseMarketValue * distressPct) / 100);

  const realisablePct = fields.realisableValuePct !== undefined && fields.realisableValuePct !== '' ? parseNum(fields.realisableValuePct) : 95;
  const realisableValue = Math.round((baseMarketValue * realisablePct) / 100);

  return {
    land,
    bldg,
    netLandBldg,
    flatRate,
    flatArea,
    flatVal,
    depAmount,
    depDescription,
    depRaw,
    recommendedValue,
    baseMarketValue,
    distressPct,
    distressValue,
    realisablePct,
    realisableValue,
    recommendedStr: recommendedValue > 0 ? `Rs.${formatCurrencyINR(recommendedValue)}/-` : '',
    distressStr: distressValue > 0 ? `Rs.${formatCurrencyINR(distressValue)}/-` : '',
    realisableStr: realisableValue > 0 ? `Rs.${formatCurrencyINR(realisableValue)}/-` : '',
  };
};

const NAV_SECTIONS: NavItem[] = [
  { id: 'sec-basic', title: '1. Basic & Loan Details (1–5)' },
  { id: 'sec-address', title: '2. Location & Address (6–14)' },
  { id: 'sec-boundaries', title: '3. Boundaries Verification (15–16)' },
  { id: 'sec-class', title: '4. Property Classification (17–23)' },
  { id: 'sec-approvals', title: '5. Approval & Plan Details (24–25)' },
  { id: 'sec-floors', title: '6. Floor Areas & Setbacks (26–29)' },
  { id: 'sec-valuation', title: '7. Valuation Computations (30–33)' },
  { id: 'sec-progress', title: '8. Progress of Work (34)' },
  { id: 'sec-final-valuation', title: '9. Final Valuation & Project (35–40)' },
  { id: 'sec-ndma', title: '10. NDMA Parameters (41)' },
  { id: 'sec-annexure-a', title: '11. Detailed DRC & Annexure' },
  { id: 'sec-docs', title: '12. Document Enclosures' },
  { id: 'sec-photos', title: '13. Property Photographs' },
];

export default function BandhanHLLAP({
  projectId,
  projectCode,
  initialFields,
  initialData,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill,
  onResetWizard,
}: BandhanHLLAPProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');

  // Default Ref No
  const defaultRefNo = useMemo(() => {
    const id = projectCode || projectId || '';
    return id ? (id.toLowerCase().startsWith('bandhan/') ? id : `Bandhan/${id}`) : '';
  }, [projectCode, projectId]);

  // ── Find First Field Engineer Visit Date (Earliest Visit Date) ──
  const firstFieldAgentVisit = useMemo(() => {
    if (bucketImages && bucketImages.length > 0) {
      const validImages = [...bucketImages]
        .filter(img => img.createdAt)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (validImages.length > 0) {
        return {
          dateStr: formatReportDate(validImages[0].createdAt),
          rawDate: validImages[0].createdAt,
          agentName: validImages[0].employee?.name || prefill?.firstFieldAgentName || '',
          agentId: validImages[0].employee?.employeeId || '',
        };
      }
    }
    const fallbackDate = prefill?.fieldVisitDate || prefill?.inspectionDate;
    if (fallbackDate) {
      return {
        dateStr: formatReportDate(fallbackDate),
        rawDate: fallbackDate,
        agentName: prefill?.firstFieldAgentName || prefill?.fieldEmployees?.[0]?.name || '',
        agentId: prefill?.fieldEmployees?.[0]?.employeeId || '',
      };
    }
    return null;
  }, [bucketImages, prefill]);

  // Initial State Setup
  const [fields, setFields] = useState<BandhanHLLAPReportFields>(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : (initialData?.reportFields || initialData || {});

    const defaultFloors: BandhanHLLAPFloor[] = Array.isArray(raw.floors) && raw.floors.length > 0
      ? raw.floors
      : [
          { floor: 'Ground Floor', measuredArea: '', sanctionedArea: '', deedArea: '', currentUsage: 'Residential', approvedUsage: 'Residential' },
          { floor: 'First Floor', measuredArea: '', sanctionedArea: '', deedArea: '', currentUsage: 'Residential', approvedUsage: 'Residential' },
        ];

    const defaultDRCFloors: BandhanHLLAPDRCFloor[] = Array.isArray(raw.drcFloors) && raw.drcFloors.length > 0
      ? raw.drcFloors
      : [
          { particulars: 'GF', area: '', yearOfConst: '', lifeInYrs: '10', costOfConst: '', gcrc: 'No', depreciation: '50', value: '' },
          { particulars: 'FF', area: '', yearOfConst: '', lifeInYrs: '10', costOfConst: '', gcrc: 'No', depreciation: '50', value: '' },
        ];

    // Parse branch details from raw data if branchDetails not explicitly stored
    let branchDetails = raw.branchDetails || '';
    let branchName = raw.branchName || '';
    if (!branchDetails && branchName) {
      branchDetails = branchName.replace(/^The\s+Bandhan\s+Bank,?\s*|^Bandhan\s+Bank,?\s*/i, '').trim();
    }
    if (!branchName) {
      branchName = branchDetails ? `Bandhan Bank, ${branchDetails}` : 'Bandhan Bank';
    }

    // Parse letter no and date from raw data if not explicitly set
    let bankLetterNo = raw.bankLetterNo || '';
    let bankLetterDate = raw.bankLetterDate ? formatReportDate(raw.bankLetterDate) : '';
    let letterNoAndDate = raw.letterNoAndDate || '';
    if (!bankLetterNo && !bankLetterDate && letterNoAndDate) {
      const dtMatch = letterNoAndDate.match(/^(.*?)(?:\s*(?:Dt\.?|Date:?|\/|,|-)\s*)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})$/i);
      if (dtMatch) {
        bankLetterNo = dtMatch[1].trim();
        bankLetterDate = formatReportDate(dtMatch[2].trim());
      } else {
        bankLetterNo = letterNoAndDate;
      }
    }
    if (!letterNoAndDate) {
      letterNoAndDate = [bankLetterNo, bankLetterDate ? `Dt. ${bankLetterDate}` : ''].filter(Boolean).join(' ');
    }

    return {
      ...raw,
      clientType: raw.clientType || 'organisation',
      institutionCategory: raw.institutionCategory || 'Bank & FIS',
      organisationTemplate: raw.organisationTemplate || 'BANDHAN BANK',
      organisationSubTemplate: raw.organisationSubTemplate || 'HL-LAP',
      bankName: raw.bankName || 'BANDHAN BANK',
      serviceType: raw.serviceType || prefill?.purpose || undefined,
      subjectType: raw.subjectType || prefill?.propertyType || undefined,
      reworkNotes: raw.reworkNotes || '',

      // Header
      refNo: raw.refNo || defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || new Date()),

      // 1. Basic & Loan Details (1 - 5)
      branchDetails,
      branchName,
      bankLetterNo,
      bankLetterDate,
      letterNoAndDate,
      customerName: raw.customerName || prefill?.contactName || prefill?.serviceRequest?.guestName || '',
      mortgagorName: raw.mortgagorName || prefill?.contactName || prefill?.serviceRequest?.guestName || '',
      ownerName: raw.ownerName || '',

      // 2. Location & Address (6 - 14)
      propertyAddress: raw.propertyAddress || prefill?.propertyAddress || '',
      pinCode: raw.pinCode || prefill?.serviceRequest?.pincode || '',
      legalAddress: raw.legalAddress || prefill?.propertyAddress || '',
      landmark: raw.landmark || '',
      distanceStation: raw.distanceStation || '',
      classOfLocality: raw.classOfLocality || 'Residential',
      valuationType: raw.valuationType || 'Fresh Valuation',
      dateOfVisit: raw.dateOfVisit
        ? formatReportDate(raw.dateOfVisit)
        : (firstFieldAgentVisit?.dateStr || (prefill?.fieldVisitDate ? formatReportDate(prefill.fieldVisitDate) : (prefill?.inspectionDate ? formatReportDate(prefill.inspectionDate) : formatReportDate(new Date())))),
      qualityOfInfrastructure: raw.qualityOfInfrastructure || 'Good',

      // 3. Boundaries (15 - 16)
      boundaryNorthActual: raw.boundaryNorthActual || '',
      boundaryNorthDeed: raw.boundaryNorthDeed || '',
      boundarySouthActual: raw.boundarySouthActual || '',
      boundarySouthDeed: raw.boundarySouthDeed || '',
      boundaryEastActual: raw.boundaryEastActual || '',
      boundaryEastDeed: raw.boundaryEastDeed || '',
      boundaryWestActual: raw.boundaryWestActual || '',
      boundaryWestDeed: raw.boundaryWestDeed || '',
      boundariesMatch: raw.boundariesMatch || 'Yes',

      // 4. Classification & Structure (17 - 23)
      statusOfLand: raw.statusOfLand || 'freehold',
      typeOfProperty: raw.typeOfProperty || 'Row house',
      approvedUsage: raw.approvedUsage || 'Residential',
      actualUsage: raw.actualUsage || 'Residential',
      typeOfStructure: raw.typeOfStructure || 'RCC',
      occupancyDetails: raw.occupancyDetails || 'Self-occupied',
      unitDetails: raw.unitDetails || '',

      // 5. Approval Details (24 - 25)
      approvalAuthority: raw.approvalAuthority || '',
      layoutApprovalNo: raw.layoutApprovalNo || '',
      layoutApprovalDate: raw.layoutApprovalDate ? formatReportDate(raw.layoutApprovalDate) : '',
      layoutExpiryDate: raw.layoutExpiryDate ? formatReportDate(raw.layoutExpiryDate) : '',
      buildingPlanApprovalNo: raw.buildingPlanApprovalNo || '',
      buildingPlanApprovalDate: raw.buildingPlanApprovalDate ? formatReportDate(raw.buildingPlanApprovalDate) : '',
      buildingPlanExpiryDate: raw.buildingPlanExpiryDate ? formatReportDate(raw.buildingPlanExpiryDate) : '',
      sanctionedPlanProvided: raw.sanctionedPlanProvided || '',
      planApprovedBy: raw.planApprovedBy || '',
      deedProvided: raw.deedProvided || 'NA',
      comments: raw.comments || '',
      constructionDetails: raw.constructionDetails || getConstructionDetailsForStructure(raw.typeOfStructure || 'RCC'),

      // 6. Area & Floor Details (26 - 29)
      propertyAreaUnit: raw.propertyAreaUnit || (raw.areaOfLandUnit || 'ACRE_DEC'),
      propertyAreaValue: raw.propertyAreaValue || (raw.propertyArea ? String(raw.propertyArea).replace(/[^0-9.]/g, '') : ''),
      propertyAreaLocked: raw.propertyAreaLocked !== undefined ? raw.propertyAreaLocked : true,
      propertyAreaAcres: raw.propertyAreaAcres || '',
      propertyAreaDecimals: raw.propertyAreaDecimals || '',
      propertyArea: raw.propertyArea || '',
      floors: defaultFloors,
      carpetAreaTotal: raw.carpetAreaTotal || '',
      builtUpAreaTotal: raw.builtUpAreaTotal || '',
      remarksOnConstruction: raw.remarksOnConstruction || 'Good',
      complianceWithPlan: raw.complianceWithPlan || 'Not Applicable',
      qualityOfConstruction: raw.qualityOfConstruction || 'Good',
      constructionAsPerPlan: raw.constructionAsPerPlan || 'NA',
      setbackFront: raw.setbackFront || '',
      setbackBack: raw.setbackBack || '',
      setbackSide1: raw.setbackSide1 || '',
      setbackSide2: raw.setbackSide2 || '',
      noOfFlatsPerFloor: raw.noOfFlatsPerFloor || 'NA',
      maintenanceOfProperty: raw.maintenanceOfProperty || '',
      presentLife: raw.presentLife || '',
      residualLife: raw.residualLife || '',

      // 7. Valuation Details (30 - 33, 35 - 40)
      recommendedValuationFormulaLocked: raw.recommendedValuationFormulaLocked !== undefined ? raw.recommendedValuationFormulaLocked : true,
      recommendedValuationFormula: raw.recommendedValuationFormula || '',
      plotRate: raw.plotRate || '',
      plotValueBreakdown: raw.plotValueBreakdown || '',
      rateOfCostOfConstruction: raw.rateOfCostOfConstruction || '',
      depreciationOfConstruction: raw.depreciationOfConstruction || '',
      netValueLand: raw.netValueLand || '',
      netValueBuilding: raw.netValueBuilding || '',
      netValueOfProperty: raw.netValueOfProperty || '',
      rateOfFlat: raw.rateOfFlat || '',
      areaOfFlat: raw.areaOfFlat || '',
      recommendedValueOfProperty: raw.recommendedValueOfProperty || '',
      totalMarketValue: raw.totalMarketValue || '',
      valuationAsOnDate: raw.valuationAsOnDate || '',
      govtRateLand: raw.govtRateLand || '',
      govtLandArea: raw.govtLandArea || raw.propertyArea || raw.areaOfLand || '',
      valuationGovtRate: raw.valuationGovtRate || '',
      valuationGovtRateLocked: raw.valuationGovtRateLocked !== undefined ? raw.valuationGovtRateLocked : true,
      distressSaleValue: raw.distressSaleValue || '',
      distressSalePct: raw.distressSalePct !== undefined ? raw.distressSalePct : '90',
      realisableValue: raw.realisableValue || '',
      realisableValuePct: raw.realisableValuePct !== undefined ? raw.realisableValuePct : '95',
      projectCommencementDate: raw.projectCommencementDate || '',
      expectedCompletionDate: raw.expectedCompletionDate || '',
      areaOfLand: raw.areaOfLand || '',
      areaOfLandUnit: raw.areaOfLandUnit || 'ACRE_DEC',
      areaOfLandValue: raw.areaOfLandValue || '',
      areaOfLandAcres: raw.areaOfLandAcres || '',
      areaOfLandDecimals: raw.areaOfLandDecimals || '',
      areaOfLandLocked: raw.areaOfLandLocked !== undefined ? raw.areaOfLandLocked : true,
      expectedCostOfProject: raw.expectedCostOfProject !== undefined ? raw.expectedCostOfProject : 'NA',
      expectedCostOfProjectRef: raw.expectedCostOfProjectRef || 'NA',
      expectedCostOfProjectLocked: raw.expectedCostOfProjectLocked !== undefined ? raw.expectedCostOfProjectLocked : true,

      // 8. Progress of Work (34)
      progressStructureHeader: raw.progressStructureHeader || '',
      progressFoundation: raw.progressFoundation !== undefined ? raw.progressFoundation : 'Completed',
      progressRCC: raw.progressRCC !== undefined ? raw.progressRCC : 'Completed',
      progressBR: raw.progressBR !== undefined ? raw.progressBR : 'Completed',
      progressPlastering: raw.progressPlastering !== undefined ? raw.progressPlastering : 'Completed',
      progressFlooring: raw.progressFlooring !== undefined ? raw.progressFlooring : 'Completed',
      progressDoorsWindows: raw.progressDoorsWindows !== undefined ? raw.progressDoorsWindows : 'Completed',
      progressElectricalSanitary: raw.progressElectricalSanitary !== undefined ? raw.progressElectricalSanitary : 'Completed',
      progressPainting: raw.progressPainting !== undefined ? raw.progressPainting : 'Completed',
      progressTotalPct: raw.progressTotalPct || '100%',
      progressRecommendationPct: raw.progressRecommendationPct || '100%',

      // 9. NDMA Parameters (41)
      ndmaConcreteGrade: raw.ndmaConcreteGrade !== undefined ? raw.ndmaConcreteGrade : 'M25',
      ndmaHorizontalFloorType: raw.ndmaHorizontalFloorType !== undefined ? raw.ndmaHorizontalFloorType : 'Beams and Slabs',
      ndmaSeismicZone: raw.ndmaSeismicZone !== undefined ? raw.ndmaSeismicZone : 'Zone-III',
      ndmaSteelGrade: raw.ndmaSteelGrade !== undefined ? raw.ndmaSteelGrade : 'FE - 450',
      ndmaFloodProne: raw.ndmaFloodProne !== undefined ? raw.ndmaFloodProne : 'NO',
      ndmaUrbanFloods: raw.ndmaUrbanFloods !== undefined ? raw.ndmaUrbanFloods : 'NO',
      ndmaEnvironmentExposure: raw.ndmaEnvironmentExposure !== undefined ? raw.ndmaEnvironmentExposure : 'Mild',
      ndmaSoilSlopeLandslide: raw.ndmaSoilSlopeLandslide !== undefined ? raw.ndmaSoilSlopeLandslide : 'Low Hazard Zone',
      ndmaWindCyclones: raw.ndmaWindCyclones !== undefined ? raw.ndmaWindCyclones : 'Low Damage Risk Zone',
      ndmaTsunami: raw.ndmaTsunami !== undefined ? raw.ndmaTsunami : 'NO',
      ndmaHeightAboveGround: raw.ndmaHeightAboveGround !== undefined ? raw.ndmaHeightAboveGround : 'Less Than 15m Tall',
      ndmaCRZ: raw.ndmaCRZ !== undefined ? raw.ndmaCRZ : 'NA',
      ndmaNatureOfBuilding: raw.ndmaNatureOfBuilding !== undefined ? raw.ndmaNatureOfBuilding : 'Standalone Structure',
      ndmaFunctionOfUse: raw.ndmaFunctionOfUse !== undefined ? raw.ndmaFunctionOfUse : (raw.propertyType || raw.approvedUsage || 'Residential'),
      ndmaFoundationType: raw.ndmaFoundationType !== undefined ? raw.ndmaFoundationType : 'Open Footing column',
      ndmaStructureType: raw.ndmaStructureType !== undefined ? raw.ndmaStructureType : getNdmaStructureTypeForStructure(raw.typeOfStructure || 'RCC'),

      // 10. Annexure-A
      annexureIntro: raw.annexureIntro || '',
      annexurePropertyDesc: raw.annexurePropertyDesc || '',
      annexureDocsVerified: raw.annexureDocsVerified || '',
      annexurePurpose: raw.annexurePurpose || 'Mortgage and Bank finance.',
      annexureGovtGuideline: raw.annexureGovtGuideline || '',
      annexureMarketEnquiry: raw.annexureMarketEnquiry || '',
      annexureCpwdBaseRate: raw.annexureCpwdBaseRate || '',
      annexureAdoptedStructures: Array.isArray(raw.annexureAdoptedStructures) ? raw.annexureAdoptedStructures : [
        { structure: 'RCC Roofing', cost: '' },
      ],
      annexureBasisOfValuation: raw.annexureBasisOfValuation || '',
      annexureMethodClassification: Array.isArray(raw.annexureMethodClassification) ? raw.annexureMethodClassification : [
        { description: 'Residential building', classification: 'Residential', ingredients: '', elements: '', approach: 'Market Approach', method: '' },
      ],
      annexureAdoptedLandRate: raw.annexureAdoptedLandRate || '',
      annexureLandArea: raw.annexureLandArea || '',
      annexureLandValue: raw.annexureLandValue || '',
      drcFloors: defaultDRCFloors,
      drcServicesCost: raw.drcServicesCost || '',
      drcServicesValue: raw.drcServicesValue || '',
      drcTotalBuildingValue: raw.drcTotalBuildingValue || '',
      summaryLandValue: raw.summaryLandValue || '',
      summaryBuildingValue: raw.summaryBuildingValue || '',
      summaryMarketValue: raw.summaryMarketValue || '',
      summaryMarketValueWords: raw.summaryMarketValueWords || '',
      opinionStatement: raw.opinionStatement || '',
      declarationItems: raw.declarationItems || [],

      // Valuer Sign-off
      valuerSignatureName: raw.valuerSignatureName || 'S. MOHANTY & ASSOCIATES',
      valuerQualification: raw.valuerQualification || 'B.Tech (Civil), M.Val (RE)',
      valuerIovRegNo: raw.valuerIovRegNo || '107/2016-17, CAT-1',
      valuerWealthTaxRegNo: raw.valuerWealthTaxRegNo || 'CCIT/BBSR/Tech-10/2017-18',
      valuerReportPagesCount: raw.valuerReportPagesCount || '12',
      declarationDate: raw.declarationDate || formatReportDate(new Date()),

      // Images / Enclosures
      rorImageUrl: raw.rorImageUrl || '',
      locationMapImageUrl: raw.locationMapImageUrl || '',
      bhuNakshaImageUrl: raw.bhuNakshaImageUrl || '',
      guidelineValueImageUrl: raw.guidelineValueImageUrl || '',
      propertyPhotos: Array.isArray(raw.propertyPhotos) ? raw.propertyPhotos : [],
    };
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const isInitialMount = useRef(true);
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-Save Draft Effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isReadOnly) return;

    setAutoSaveStatus('saving');

    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);

    debouncedTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res && 'error' in res && res.error) {
          console.error('Autosave error:', res.error);
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (e) {
        console.error('Autosave network error:', e);
        setAutoSaveStatus('error');
      }
    }, 800);

    return () => {
      if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReadOnly) return;
      try {
        navigator.sendBeacon('/api/save-draft', JSON.stringify({ projectId, fields }));
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  // Auto Calculations
  useEffect(() => {
    // 1. Calculate Land Value: area in sqft * land rate
    const pArea = parseNum(fields.propertyArea || fields.areaOfLand);
    const pRate = parseNum(fields.plotRate || fields.annexureAdoptedLandRate);
    const calculatedLandVal = pArea * pRate;

    // 2. Calculate DRC Building Total
    let totalBldgVal = 0;
    (fields.drcFloors || []).forEach(df => {
      const a = parseNum(df.area);
      const c = parseNum(df.costOfConst);
      let v = 0;
      if (a && c) {
        v = a * c;
      }
      totalBldgVal += (parseNum(df.value) || v);
    });

    const netVal = calculatedLandVal + totalBldgVal;
    const realisable = Math.round(netVal * 0.95);
    const distress = Math.round(netVal * 0.90);

    // 3. Calculate Floor BUA
    const totalFloorSanctioned = (fields.floors || []).reduce((acc, f) => acc + parseNum(f.sanctionedArea), 0);
    const totalFloorMeasured = (fields.floors || []).reduce((acc, f) => acc + parseNum(f.measuredArea), 0);
    const totalBUA = totalFloorSanctioned > 0 ? totalFloorSanctioned : totalFloorMeasured;
    const validFloors = (fields.floors || []).filter(f => parseNum(f.sanctionedArea) > 0 || parseNum(f.measuredArea) > 0);
    const floorPrefix = validFloors.length > 1 ? `G+${validFloors.length - 1} ` : (validFloors.length === 1 ? 'GF ' : '');
    const calculatedBUAStr = totalBUA > 0 ? `${floorPrefix}Total BUA = ${totalBUA}sqft.` : '';

    // Sync values
    setFields(prev => {
      let changed = false;
      const next = { ...prev };

      if (calculatedLandVal > 0 && !prev.annexureLandValue) {
        next.annexureLandValue = formatCurrencyINR(calculatedLandVal);
        next.summaryLandValue = formatCurrencyINR(calculatedLandVal);
        changed = true;
      }
      if (calculatedLandVal > 0 && !prev.netValueLand) {
        next.netValueLand = String(calculatedLandVal);
        changed = true;
      }
      if (totalBldgVal > 0 && !prev.drcTotalBuildingValue) {
        next.drcTotalBuildingValue = formatCurrencyINR(totalBldgVal);
        next.summaryBuildingValue = formatCurrencyINR(totalBldgVal);
        changed = true;
      }
      if (totalBldgVal > 0 && !prev.netValueBuilding) {
        next.netValueBuilding = String(totalBldgVal);
        changed = true;
      }
      const validNamedFloors = (fields.floors || []).filter(f => f.floor && f.floor.trim().length > 0);
      const autoStructure = validNamedFloors.length > 1
        ? `G+${validNamedFloors.length - 1} Storied Building`
        : (validNamedFloors.length === 1 ? 'Ground Floor Building' : '');
      if (autoStructure && !prev.progressStructureHeader) {
        next.progressStructureHeader = autoStructure;
        changed = true;
      }
      const valCalc = computeBandhanValuation(
        {
          ...prev,
          ...next,
          netValueLand: next.netValueLand || prev.netValueLand,
          netValueBuilding: next.netValueBuilding || prev.netValueBuilding,
          rateOfFlat: fields.rateOfFlat,
          areaOfFlat: fields.areaOfFlat,
          depreciationOfConstruction: fields.depreciationOfConstruction,
        },
        calculatedLandVal,
        totalBldgVal
      );

      if (valCalc.netLandBldg > 0) {
        const netPropStr = `Rs.${formatCurrencyINR(valCalc.netLandBldg)}/-`;
        if (prev.netValueOfProperty !== netPropStr) {
          next.netValueOfProperty = netPropStr;
          changed = true;
        }
      }

      if (valCalc.recommendedValue > 0) {
        const recStr = valCalc.recommendedStr;
        const distStr = valCalc.distressStr;
        const realStr = valCalc.realisableStr;
        const sumMktStr = formatCurrencyINR(valCalc.recommendedValue);
        const sumWords = formatIndianCurrency(valCalc.recommendedValue);

        if (!prev.recommendedValueOfProperty) {
          next.recommendedValueOfProperty = recStr;
          changed = true;
        }
        if (!prev.totalMarketValue) {
          next.totalMarketValue = recStr;
          changed = true;
        }
        if (!prev.valuationAsOnDate) {
          next.valuationAsOnDate = recStr;
          changed = true;
        }
        if (!prev.summaryMarketValue) {
          next.summaryMarketValue = sumMktStr;
          changed = true;
        }
        if (!prev.summaryMarketValueWords) {
          next.summaryMarketValueWords = sumWords;
          changed = true;
        }
        if (distStr && prev.distressSaleValue !== distStr) {
          next.distressSaleValue = distStr;
          changed = true;
        }

        if (realStr && prev.realisableValue !== realStr) {
          next.realisableValue = realStr;
          changed = true;
        }
      }
      if (prev.builtUpAreaTotal !== calculatedBUAStr) {
        next.builtUpAreaTotal = calculatedBUAStr;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    fields.propertyArea,
    fields.areaOfLand,
    fields.plotRate,
    fields.annexureAdoptedLandRate,
    fields.floors,
    fields.drcFloors,
    fields.netValueLand,
    fields.netValueBuilding,
    fields.rateOfFlat,
    fields.areaOfFlat,
    fields.depreciationOfConstruction,
    fields.distressSalePct,
    fields.realisableValuePct,
    fields.totalMarketValue,
  ]);

  // Handler for standard input changes
  const handleChange = (name: keyof BandhanHLLAPReportFields, val: any) => {
    setFields(prev => {
      const next = { ...prev, [name]: val };
      if (name === 'reportDate' && (!prev.declarationDate || prev.declarationDate === prev.reportDate)) {
        next.declarationDate = val;
      }
      if (name === 'typeOfStructure') {
        const prevDerivedConst = getConstructionDetailsForStructure(prev.typeOfStructure);
        const prevDerivedNdma = getNdmaStructureTypeForStructure(prev.typeOfStructure);
        
        // If constructionDetails was empty or matched previous auto-derived default, update to new derived default
        if (!prev.constructionDetails || prev.constructionDetails === prevDerivedConst) {
          next.constructionDetails = getConstructionDetailsForStructure(val);
        }
        
        // If ndmaStructureType was empty or matched previous auto-derived default, update to new derived default
        if (!prev.ndmaStructureType || prev.ndmaStructureType === prevDerivedNdma) {
          next.ndmaStructureType = getNdmaStructureTypeForStructure(val);
        }
      }
      return next;
    });
  };

  // Handler for dynamic floor rows (Section 6)
  const handleFloorChange = (index: number, key: keyof BandhanHLLAPFloor, val: string) => {
    const nextFloors = [...(fields.floors || [])];
    nextFloors[index] = { ...nextFloors[index], [key]: val };
    setFields(prev => ({ ...prev, floors: nextFloors }));
  };

  const addFloorRow = () => {
    setFields(prev => {
      const nextFloors = prev.floors || [];
      const nextName = getNextFloorName(nextFloors);
      return {
        ...prev,
        floors: [
          ...nextFloors,
          { floor: nextName, measuredArea: '', sanctionedArea: '', deedArea: '', currentUsage: 'Residential', approvedUsage: 'Residential' },
        ],
      };
    });
  };

  const removeFloorRow = (index: number) => {
    setFields(prev => ({
      ...prev,
      floors: (prev.floors || []).filter((_, i) => i !== index),
    }));
  };

  // Handler for DRC floor rows (Section 10)
  const handleDRCFloorChange = (index: number, key: keyof BandhanHLLAPDRCFloor, val: string) => {
    const nextDRC = [...(fields.drcFloors || [])];
    nextDRC[index] = { ...nextDRC[index], [key]: val };
    setFields(prev => ({ ...prev, drcFloors: nextDRC }));
  };

  const addDRCRow = () => {
    setFields(prev => ({
      ...prev,
      drcFloors: [
        ...(prev.drcFloors || []),
        { particulars: '', area: '', yearOfConst: '', lifeInYrs: '10', costOfConst: '', gcrc: 'No', depreciation: '50', value: '' },
      ],
    }));
  };

  const removeDRCRow = (index: number) => {
    setFields(prev => ({
      ...prev,
      drcFloors: (prev.drcFloors || []).filter((_, i) => i !== index),
    }));
  };

  // Photos state derivation
  const propertyImages: string[] = useMemo(() => {
    if (Array.isArray(fields.propertyImages) && fields.propertyImages.length > 0) {
      return fields.propertyImages;
    }
    if (Array.isArray(fields.propertyPhotos) && fields.propertyPhotos.length > 0) {
      return fields.propertyPhotos.map((p: any) => (typeof p === 'string' ? p : p.url)).filter(Boolean);
    }
    return [];
  }, [fields.propertyImages, fields.propertyPhotos]);

  const propertyImageNames: string[] = useMemo(() => {
    if (Array.isArray(fields.propertyImageNames) && fields.propertyImageNames.length > 0) {
      return fields.propertyImageNames;
    }
    if (Array.isArray(fields.propertyPhotos) && fields.propertyPhotos.length > 0) {
      return fields.propertyPhotos.map((p: any, i: number) => (typeof p === 'string' ? `Photograph ${i + 1}` : (p.caption || `Photograph ${i + 1}`)));
    }
    return [];
  }, [fields.propertyImageNames, fields.propertyPhotos]);

  // Handle Multiple Photo Upload
  const handleUploadMultiplePhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const newImgs: string[] = [];
    const newNames: string[] = [];
    let processed = 0;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        newImgs.push(dataUrl);
        newNames.push(file.name.replace(/\.[^/.]+$/, '') || `Photograph ${propertyImages.length + newImgs.length}`);
        processed++;
        if (processed === files.length) {
          const mergedImgs = [...propertyImages, ...newImgs];
          const mergedNames = [...propertyImageNames, ...newNames];
          const mergedPhotos = mergedImgs.map((url, idx) => ({
            url,
            caption: mergedNames[idx] || `Photograph ${idx + 1}`,
          }));
          setFields((prev) => ({
            ...prev,
            propertyImages: mergedImgs,
            propertyImageNames: mergedNames,
            propertyPhotos: mergedPhotos,
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoRemove = (idx: number) => {
    const updatedImgs = propertyImages.filter((_, i) => i !== idx);
    const updatedNames = propertyImageNames.filter((_, i) => i !== idx);
    const updatedPhotos = (fields.propertyPhotos || []).filter((_, i) => i !== idx);
    setFields((prev) => ({
      ...prev,
      propertyImages: updatedImgs,
      propertyImageNames: updatedNames,
      propertyPhotos: updatedPhotos.length > 0 ? updatedPhotos : updatedImgs.map((url, i) => ({ url, caption: updatedNames[i] || `Photograph ${i + 1}` })),
    }));
  };

  const handlePhotoRename = (idx: number, name: string) => {
    const updatedNames = [...propertyImageNames];
    while (updatedNames.length <= idx) {
      updatedNames.push(`Photograph ${updatedNames.length + 1}`);
    }
    updatedNames[idx] = name;
    const updatedPhotos = [...(fields.propertyPhotos || [])];
    if (updatedPhotos[idx]) {
      updatedPhotos[idx] = { ...updatedPhotos[idx], caption: name };
    } else if (propertyImages[idx]) {
      updatedPhotos[idx] = { url: propertyImages[idx], caption: name };
    }
    setFields((prev) => ({
      ...prev,
      propertyImageNames: updatedNames,
      propertyPhotos: updatedPhotos,
    }));
  };

  const handlePhotoReorder = (newImages: string[], newNames: string[]) => {
    const newPhotos = newImages.map((url, idx) => ({
      url,
      caption: newNames[idx] || `Photograph ${idx + 1}`,
    }));
    setFields((prev) => ({
      ...prev,
      propertyImages: newImages,
      propertyImageNames: newNames,
      propertyPhotos: newPhotos,
    }));
  };

  // Enclosure Document Upload Helper
  const handleEnclosureUpload = (fieldKey: 'rorImageUrl' | 'locationMapImageUrl' | 'bhuNakshaImageUrl' | 'guidelineValueImageUrl', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        handleChange(fieldKey, ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, fields);
      setAutoSaveStatus('saved');
      setMessage({ text: 'Draft saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setAutoSaveStatus('error');
      setMessage({ text: 'Failed to save draft: ' + e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // PDF Preview
  const handlePreviewPDF = async () => {
    try {
      const renderer = new PDFBandhanHLLAPRenderer();
      const pdfBytes = await renderer.generateBandhanHLLAPReport(fields);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e: any) {
      alert('Failed to generate PDF preview: ' + e.message);
    }
  };

  // PDF Download
  const handleDownloadPDF = async () => {
    try {
      const renderer = new PDFBandhanHLLAPRenderer();
      const pdfBytes = await renderer.generateBandhanHLLAPReport(fields);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Bandhan_Bank_HLLAP_${projectCode || projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      alert('Failed to download PDF: ' + e.message);
    }
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for review?')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, fields);
      await submitReportForVerification(projectId);
      alert('Report submitted successfully!');
      router.refresh();
    } catch (e: any) {
      alert('Failed to submit report: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Top Active Configuration Banner */}
        <ActiveConfigBanner
          clientType={(fields.clientType as 'organisation' | 'individual') || 'organisation'}
          category={fields.institutionCategory || 'Bank & FIS'}
          bankName={fields.bankName || fields.organisationTemplate || 'BANDHAN BANK'}
          subclass={fields.organisationSubTemplate || 'HL-LAP'}
          serviceType={fields.serviceType}
          subjectType={fields.subjectType}
          onResetWizard={onResetWizard}
        />

        {/* Rework Banner */}
        {fields.reworkNotes && status === 'REPORT_DRAFTING' && (
          <div className="card p-5 border-2 border-red-200 bg-red-50 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">Manager Rework Requested</h2>
            </div>
            <p className="text-sm text-red-700 bg-white/60 p-4 rounded-lg border border-red-100 whitespace-pre-wrap">
              {fields.reworkNotes}
            </p>
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold border shadow-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Header Block */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-200">
            Bandhan Bank — HL-LAP Valuation Report
          </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Ref. No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.refNo || ''}
                    onChange={(e) => handleChange('refNo', e.target.value)}
                    placeholder="e.g. BANDHAN/HL/2026/01"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Report Date:">
                  <BaseDateInput
                    value={fields.reportDate || ''}
                    onChange={(val) => handleChange('reportDate', val)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 1. Basic & Loan Details */}
            <Section number={1} id="sec-basic" title="Basic & Loan Details (Points 1–5)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="1. Name of the Bank Branch / Asset Centre / COD:">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <div className="relative">
                          <input
                            type="text"
                            className={`${inputCls} bg-slate-100/90 text-slate-700 font-semibold cursor-not-allowed`}
                            value="Bandhan Bank"
                            readOnly
                            disabled
                          />
                          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                            <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Fixed</span>
                          </div>
                        </div>
                      </div>
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.branchDetails || ''}
                          onChange={(e) => {
                            const bDetails = e.target.value;
                            const combined = bDetails ? `Bandhan Bank, ${bDetails}` : 'Bandhan Bank';
                            setFields((prev) => ({
                              ...prev,
                              branchDetails: bDetails,
                              branchName: combined,
                            }));
                          }}
                          placeholder="e.g. Borivali Branch, Mumbai"
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="2. Bank Letter No and Date for undertaking valuation:">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.bankLetterNo || ''}
                          onChange={(e) => {
                            const noVal = e.target.value;
                            const dtVal = fields.bankLetterDate || '';
                            const combined = [noVal, dtVal ? `Dt. ${dtVal}` : ''].filter(Boolean).join(' ');
                            setFields((prev) => ({
                              ...prev,
                              bankLetterNo: noVal,
                              letterNoAndDate: combined,
                            }));
                          }}
                          placeholder="e.g. BANDHAN/VAL/2026/102"
                          disabled={isReadOnly}
                        />
                      </div>
                      <div>
                        <BaseDateInput
                          value={fields.bankLetterDate || ''}
                          onChange={(dtVal) => {
                            const noVal = fields.bankLetterNo || '';
                            const combined = [noVal, dtVal ? `Dt. ${dtVal}` : ''].filter(Boolean).join(' ');
                            setFields((prev) => ({
                              ...prev,
                              bankLetterDate: dtVal,
                              letterNoAndDate: combined,
                            }));
                          }}
                          disabled={isReadOnly}
                        />
                      </div>
                    </div>
                  </Field>
                </div>
                <Field label="3. Customer's Name [Loan Applicant]:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.customerName || ''}
                    onChange={(e) => handleChange('customerName', e.target.value)}
                    placeholder="e.g. Applicant Full Name"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="4. Mortgagor's Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.mortgagorName || ''}
                    onChange={(e) => handleChange('mortgagorName', e.target.value)}
                    placeholder="e.g. Mortgagor Full Name"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="5. Name of Present Owner / Seller:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerName || ''}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    placeholder="e.g. Owner Full Name"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>

            {/* 2. Location & Address */}
            <Section number={2} id="sec-address" title="Location & Address Details (Points 6–14)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="6. Complete Property Address:">
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={fields.propertyAddress || ''}
                      onChange={(e) => handleChange('propertyAddress', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <Field label="7. Pin Code:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.pinCode || ''}
                    onChange={(e) => handleChange('pinCode', sanitizePositiveInt(e.target.value, 6))}
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="8. Legal Address:">
                    <textarea
                      rows={2}
                      className={inputCls}
                      value={fields.legalAddress || ''}
                      onChange={(e) => handleChange('legalAddress', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <Field label="9. Nearby Landmark:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landmark || ''}
                    onChange={(e) => handleChange('landmark', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="10. Distance from Rly Station / Bus Stop:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distanceStation || ''}
                    onChange={(e) => handleChange('distanceStation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="11. Class of Locality:">
                  <select
                    className={selectCls}
                    value={fields.classOfLocality || 'Residential'}
                    onChange={(e) => handleChange('classOfLocality', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Agricultural">Agricultural</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </Field>
                <Field label="12. Valuation Type:">
                  <select
                    className={selectCls}
                    value={fields.valuationType || 'Fresh Valuation'}
                    onChange={(e) => handleChange('valuationType', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Fresh Valuation">Fresh Valuation</option>
                    <option value="Revaluation">Revaluation</option>
                    <option value="Periodic Valuation">Periodic Valuation</option>
                  </select>
                </Field>
                <Field label="13. Date of Visit / Valuation Made:">
                  <div className="space-y-1">
                    <BaseDateInput
                      value={fields.dateOfVisit || ''}
                      onChange={(val) => handleChange('dateOfVisit', val)}
                      disabled={isReadOnly}
                    />
                    {firstFieldAgentVisit?.dateStr && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                        <span className="truncate">
                          Earliest Field Visit: <span className="font-semibold text-slate-700">{firstFieldAgentVisit.dateStr}</span>
                          {firstFieldAgentVisit.agentName ? ` (${firstFieldAgentVisit.agentName})` : ''}
                        </span>
                        {!isReadOnly && fields.dateOfVisit !== firstFieldAgentVisit.dateStr && (
                          <button
                            type="button"
                            onClick={() => handleChange('dateOfVisit', firstFieldAgentVisit.dateStr)}
                            className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px] shrink-0 ml-2 cursor-pointer"
                          >
                            Use Field Date
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </Field>
                <Field label="14. Quality of Infrastructure in Vicinity:">
                  <select
                    className={selectCls}
                    value={fields.qualityOfInfrastructure || 'Good'}
                    onChange={(e) => handleChange('qualityOfInfrastructure', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* 3. Boundaries */}
            <Section number={3} id="sec-boundaries" title="Boundaries & Physical Verification (Points 15–16)">
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  15. Boundaries of the Property (Actual vs Sale Deed)
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2.5 text-left font-semibold w-24">Direction</th>
                        <th className="p-2.5 text-left font-semibold">ACTUAL (At Site)</th>
                        <th className="p-2.5 text-left font-semibold">AS PER (Previous Sale Deed)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-medium text-slate-900">North</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryNorthActual || ''}
                            onChange={(e) => handleChange('boundaryNorthActual', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryNorthDeed || ''}
                            onChange={(e) => handleChange('boundaryNorthDeed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-900">South</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundarySouthActual || ''}
                            onChange={(e) => handleChange('boundarySouthActual', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundarySouthDeed || ''}
                            onChange={(e) => handleChange('boundarySouthDeed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-900">East</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryEastActual || ''}
                            onChange={(e) => handleChange('boundaryEastActual', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryEastDeed || ''}
                            onChange={(e) => handleChange('boundaryEastDeed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-medium text-slate-900">West</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryWestActual || ''}
                            onChange={(e) => handleChange('boundaryWestActual', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.boundaryWestDeed || ''}
                            onChange={(e) => handleChange('boundaryWestDeed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <Field label="16. Does the boundaries at site match, as mentioned in documentation?">
                  <select
                    className={selectCls}
                    value={fields.boundariesMatch || 'Yes'}
                    onChange={(e) => handleChange('boundariesMatch', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Partially Matching">Partially Matching</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* 4. Classification & Structure */}
            <Section number={4} id="sec-class" title="Property Classification & Structural Usage (Points 17–23)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="17. Status of Land/Flat:">
                  <select
                    className={selectCls}
                    value={fields.statusOfLand || 'freehold'}
                    onChange={(e) => handleChange('statusOfLand', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="freehold">Freehold</option>
                    <option value="leased">Leased</option>
                    <option value="development authority">Development Authority</option>
                  </select>
                </Field>
                <Field label="18. Type of Property:">
                  <select
                    className={selectCls}
                    value={fields.typeOfProperty || 'Row house'}
                    onChange={(e) => handleChange('typeOfProperty', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Row house">Row house</option>
                    <option value="Bungalow">Bungalow</option>
                    <option value="Plot">Plot</option>
                    <option value="Flat">Flat</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </Field>

                {/* 19 & 20. Usage Details (Soft Container - Multiple questions, no header) */}
                <div className="rounded-xl border border-sky-200/80 bg-sky-50/50 p-4 sm:p-5 shadow-xs sm:col-span-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="19. Approved Usage:">
                      <select
                        className={selectCls}
                        value={fields.approvedUsage || 'Residential'}
                        onChange={(e) => handleChange('approvedUsage', e.target.value)}
                        disabled={isReadOnly}
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Agricultural">Agricultural</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </Field>
                    <Field label="20. Actual Usage:">
                      <select
                        className={selectCls}
                        value={fields.actualUsage || 'Residential'}
                        onChange={(e) => handleChange('actualUsage', e.target.value)}
                        disabled={isReadOnly}
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Agricultural">Agricultural</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </Field>
                  </div>
                </div>

                <div>
                  <Field label="21. Type of Structure:">
                    <select
                      className={selectCls}
                      value={fields.typeOfStructure || 'RCC'}
                      onChange={(e) => handleChange('typeOfStructure', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="RCC">RCC</option>
                      <option value="Load bearing">Load bearing</option>
                      <option value="Aluform shuttering">Aluform shuttering</option>
                      <option value="Steel Structure">Steel Structure</option>
                    </select>
                  </Field>
                  <p className="text-[11px] text-indigo-700/80 mt-1 flex items-center gap-1 font-medium">
                    <span>⚡ Automatically sets default structure values in Pt 25, Pt 34, &amp; Pt 41</span>
                  </p>
                </div>
                <Field label="22. Occupancy Details:">
                  <select
                    className={selectCls}
                    value={fields.occupancyDetails || 'Self-occupied'}
                    onChange={(e) => handleChange('occupancyDetails', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Self-occupied">Self-occupied</option>
                    <option value="Rented">Rented</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="23. Unit Details (Rooms, Hall, Kitchen, Toilet breakdown):">
                    <textarea
                      rows={3}
                      className={inputCls}
                      value={fields.unitDetails || ''}
                      onChange={(e) => handleChange('unitDetails', e.target.value)}
                      placeholder="e.g. 2 BHK: 2 Bedrooms, 1 Living Hall, 1 Kitchen, 2 Toilets, 1 Balcony"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 5. Approval & Plan Details */}
            <Section number={5} id="sec-approvals" title="Approval & Plan Details (Points 24–25)">
              <div className="space-y-4">
                <Field label="24. Approval Authority Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.approvalAuthority || ''}
                    onChange={(e) => handleChange('approvalAuthority', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Container 1: Layout Approval */}
                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 sm:p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
                      <span className="font-sans font-semibold text-amber-900 text-xs sm:text-sm">Layout Approval</span>
                    </div>
                    <Field label="Layout Approval No:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.layoutApprovalNo || ''}
                        onChange={(e) => handleChange('layoutApprovalNo', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Layout Approval Date:">
                      <BaseDateInput
                        value={fields.layoutApprovalDate || ''}
                        onChange={(val) => handleChange('layoutApprovalDate', val)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Layout Expiry Date:">
                      <BaseDateInput
                        value={fields.layoutExpiryDate || ''}
                        onChange={(val) => handleChange('layoutExpiryDate', val)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>

                  {/* Container 2: Building Plan Approval */}
                  <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 sm:p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center gap-2 pb-2 border-b border-blue-200/60">
                      <span className="font-sans font-semibold text-blue-900 text-xs sm:text-sm">Building Plan Approval</span>
                    </div>
                    <Field label="Building Plan Approval No:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.buildingPlanApprovalNo || ''}
                        onChange={(e) => handleChange('buildingPlanApprovalNo', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Building Plan Approval Date:">
                      <BaseDateInput
                        value={fields.buildingPlanApprovalDate || ''}
                        onChange={(val) => handleChange('buildingPlanApprovalDate', val)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Building Plan Expiry Date:">
                      <BaseDateInput
                        value={fields.buildingPlanExpiryDate || ''}
                        onChange={(val) => handleChange('buildingPlanExpiryDate', val)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                {/* Container 3: Point 25 - Sanctioned Plan & Documentation Particulars */}
                <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-indigo-200/60">
                    <span className="font-sans font-semibold text-indigo-900 text-xs sm:text-sm">
                      25. Sanctioned Plan &amp; Documentation Particulars
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <Field label="Copy of sanctioned plan provided. Plan No:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.sanctionedPlanProvided || ''}
                        onChange={(e) => handleChange('sanctionedPlanProvided', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="And approved by:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.planApprovedBy || ''}
                        onChange={(e) => handleChange('planApprovedBy', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Copy of deed provided. Deed No:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.deedProvided || ''}
                        onChange={(e) => handleChange('deedProvided', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Comments, if any:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.comments || ''}
                        onChange={(e) => handleChange('comments', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <div className="sm:col-span-2 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Construction details:
                        </label>
                        <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                          <span>⚡ Auto-derived from <strong>Pt 21: Type of Structure ({fields.typeOfStructure || 'RCC'})</strong></span>
                          {!isReadOnly && fields.constructionDetails && fields.constructionDetails !== getConstructionDetailsForStructure(fields.typeOfStructure) && (
                            <button
                              type="button"
                              onClick={() => handleChange('constructionDetails', getConstructionDetailsForStructure(fields.typeOfStructure))}
                              className="ml-1 text-indigo-600 hover:text-indigo-900 underline font-medium cursor-pointer"
                              title="Sync with Point 21"
                            >
                              ↺ Sync with Pt 21
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.constructionDetails || getConstructionDetailsForStructure(fields.typeOfStructure)}
                        onChange={(e) => handleChange('constructionDetails', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* 6. Floor Areas & Setbacks */}
            <Section number={6} id="sec-floors" title="Area, Floor Breakdown & Setbacks (Points 26–29)">
              <div className="space-y-4">
                {/* 26. Total Land / Property Area */}
                <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-indigo-200/60 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-indigo-900 text-xs sm:text-sm">
                        26. Total Land / Property Area
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {fields.areaOfLand && (
                        <button
                          type="button"
                          onClick={() => {
                            setFields(prev => ({
                              ...prev,
                              propertyArea: prev.areaOfLand || prev.propertyArea,
                              propertyAreaLocked: false,
                            }));
                          }}
                          className="text-[11px] text-sky-700 hover:text-sky-900 font-medium flex items-center gap-1 bg-sky-100/70 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                          title="Sync from Pt 39 Area of Land"
                        >
                          ↺ Sync Pt 39: {fields.areaOfLand}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const nextLocked = fields.propertyAreaLocked === false;
                          if (nextLocked) {
                            const unit = fields.propertyAreaUnit || 'ACRE_DEC';
                            const val = fields.propertyAreaValue || '';
                            const formatted = formatAreaOfLandStatement(unit, val, fields.propertyAreaAcres, fields.propertyAreaDecimals, fields.propertyArea);
                            setFields(prev => ({
                              ...prev,
                              propertyAreaLocked: true,
                              propertyArea: formatted.statement || prev.propertyArea,
                            }));
                          } else {
                            setFields(prev => ({ ...prev, propertyAreaLocked: false }));
                          }
                        }}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                          fields.propertyAreaLocked !== false
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                        title={fields.propertyAreaLocked !== false ? 'Constrained & auto-converted to sqft. Click to unlock for manual custom text.' : 'Unlocked for custom entry. Click to lock back to auto-conversion.'}
                      >
                        {fields.propertyAreaLocked !== false ? '🔒 Locked (Auto-convert)' : '🔓 Unlocked (Manual)'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Choose Area Unit:">
                      <select
                        className={selectCls}
                        value={fields.propertyAreaUnit || 'ACRE_DEC'}
                        onChange={(e) => {
                          const unit = e.target.value as any;
                          const val = fields.propertyAreaValue || '';
                          const formatted = formatAreaOfLandStatement(unit, val, fields.propertyAreaAcres, fields.propertyAreaDecimals, fields.propertyArea);
                          setFields(prev => ({
                            ...prev,
                            propertyAreaUnit: unit,
                            propertyArea: prev.propertyAreaLocked !== false ? formatted.statement : prev.propertyArea,
                          }));
                        }}
                        disabled={isReadOnly}
                      >
                        <option value="ACRE_DEC">Acres &amp; Decimals (e.g. AC.0.250Decs)</option>
                        <option value="DECIMAL">Decimals / Cents (1 Dec = 435.6 sqft)</option>
                        <option value="SQFT">Square Feet (sqft - Direct / No conversion)</option>
                        <option value="SQYD">Square Yards / Gaj (1 Sq.Yd = 9 sqft)</option>
                        <option value="SQMT">Square Meters (1 Sq.M = 10.7639 sqft)</option>
                        <option value="GUNTHA">Guntha (1 Guntha = 1089 sqft)</option>
                      </select>
                    </Field>

                    {/* Float-only Numeric Input */}
                    <Field
                      label={
                        fields.propertyAreaUnit === 'ACRE_DEC'
                          ? 'Land Area in Acres (e.g. 0.250 or 0.25):'
                          : fields.propertyAreaUnit === 'DECIMAL'
                          ? 'Land Area in Decimals (e.g. 25):'
                          : fields.propertyAreaUnit === 'SQFT'
                          ? 'Land Area in Sq. Feet (e.g. 10890):'
                          : fields.propertyAreaUnit === 'SQYD'
                          ? 'Land Area in Sq. Yards (e.g. 200):'
                          : fields.propertyAreaUnit === 'SQMT'
                          ? 'Land Area in Sq. Meters (e.g. 100):'
                          : 'Land Area in Guntha (e.g. 10):'
                      }
                    >
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.propertyAreaValue || ''}
                        onChange={(e) => {
                          const val = sanitizePositiveFloat(e.target.value);
                          const unit = fields.propertyAreaUnit || 'ACRE_DEC';
                          const formatted = formatAreaOfLandStatement(unit, val, fields.propertyAreaAcres, fields.propertyAreaDecimals, fields.propertyArea);
                          setFields(prev => ({
                            ...prev,
                            propertyAreaValue: val,
                            propertyArea: prev.propertyAreaLocked !== false ? formatted.statement : prev.propertyArea,
                          }));
                        }}
                        placeholder={
                          fields.propertyAreaUnit === 'ACRE_DEC' ? '0.250' :
                          fields.propertyAreaUnit === 'DECIMAL' ? '25' :
                          fields.propertyAreaUnit === 'SQFT' ? '10890' : '100'
                        }
                        disabled={isReadOnly}
                      />
                    </Field>

                    {/* Result statement */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Resulting Total Land / Property Area Statement (Report &amp; PDF):
                        </label>
                        {fields.propertyAreaLocked === false && (
                          <span className="text-[10.5px] text-amber-700 font-semibold">
                            Manual Custom Text
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        className={`${inputCls} ${
                          fields.propertyAreaLocked !== false
                            ? 'bg-indigo-50/60 font-bold text-indigo-950 border-indigo-300'
                            : 'bg-white text-slate-900 border-amber-300'
                        }`}
                        value={fields.propertyArea || ''}
                        onChange={(e) => handleChange('propertyArea', e.target.value)}
                        readOnly={fields.propertyAreaLocked !== false}
                        disabled={isReadOnly}
                      />
                      <p className="text-[11px] text-slate-500">
                        {fields.propertyAreaLocked !== false
                          ? fields.propertyAreaUnit === 'ACRE_DEC'
                            ? 'Auto-converted using standard 1 Acre = 43,560 sqft. Formatted as (AC.0.250Decs) i.e. 10,890sqft.'
                            : fields.propertyAreaUnit === 'SQFT'
                            ? 'Direct Sq.Ft. input without conversion.'
                            : 'Auto-converted to equivalent square feet.'
                          : 'Unlocked: Type any custom property area statement directly.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="p-2 text-left">Floor Level</th>
                        <th className="p-2 text-left">As Measured (sqft)</th>
                        <th className="p-2 text-left">Sanctioned (sqft)</th>
                        <th className="p-2 text-left">Sale Deed (sqft)</th>
                        <th className="p-2 text-left">Current Usage</th>
                        <th className="p-2 text-left">Approved Usage</th>
                        {!isReadOnly && <th className="p-2 w-12 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {(fields.floors || []).map((fl, idx) => (
                        <tr key={idx}>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.floor || ''}
                              onChange={(e) => handleFloorChange(idx, 'floor', e.target.value)}
                              placeholder="e.g. Ground Floor"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.measuredArea || ''}
                              onChange={(e) => handleFloorChange(idx, 'measuredArea', sanitizePositiveFloat(e.target.value))}
                              placeholder="e.g. 850"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.sanctionedArea || ''}
                              onChange={(e) => handleFloorChange(idx, 'sanctionedArea', sanitizePositiveFloat(e.target.value))}
                              placeholder="e.g. 850"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1.5">
                            <input
                              type="text"
                              className={inputCls}
                              value={fl.deedArea || ''}
                              onChange={(e) => handleFloorChange(idx, 'deedArea', sanitizePositiveFloat(e.target.value))}
                              placeholder="e.g. 850"
                              disabled={isReadOnly}
                            />
                          </td>
                          <td className="p-1.5">
                            <select
                              className={selectCls}
                              value={fl.currentUsage || 'Residential'}
                              onChange={(e) => handleFloorChange(idx, 'currentUsage', e.target.value)}
                              disabled={isReadOnly}
                            >
                              <option value="Residential">Residential</option>
                              <option value="Commercial">Commercial</option>
                              <option value="Industrial">Industrial</option>
                              <option value="Agricultural">Agricultural</option>
                              <option value="Institutional">Institutional</option>
                              <option value="Mixed">Mixed</option>
                              <option value="Vacant">Vacant</option>
                              <option value="NA">NA</option>
                            </select>
                          </td>
                          <td className="p-1.5">
                            <select
                              className={selectCls}
                              value={fl.approvedUsage || 'Residential'}
                              onChange={(e) => handleFloorChange(idx, 'approvedUsage', e.target.value)}
                              disabled={isReadOnly}
                            >
                              <option value="Residential">Residential</option>
                              <option value="Commercial">Commercial</option>
                              <option value="Industrial">Industrial</option>
                              <option value="Agricultural">Agricultural</option>
                              <option value="Institutional">Institutional</option>
                              <option value="Mixed">Mixed</option>
                              <option value="Vacant">Vacant</option>
                              <option value="NA">NA</option>
                            </select>
                          </td>
                          {!isReadOnly && (
                            <td className="p-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => removeFloorRow(idx)}
                                className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
                              >
                                ×
                              </button>
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
                    onClick={addFloorRow}
                    className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded border border-slate-300"
                  >
                    + Add Floor Row
                  </button>
                )}

                {/* Soft Container: Supplementary Floor & Construction Details */}
                <div className="rounded-xl border border-teal-200/80 bg-teal-50/40 p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-teal-200/60">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-teal-900 text-xs sm:text-sm">
                        Floor Area Summary &amp; Construction Compliances
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Carpet Area: (Approx.) */}
                    <Field label="Carpet Area: (Approx.)">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.carpetAreaTotal || ''}
                        onChange={(e) => handleChange('carpetAreaTotal', sanitizePositiveFloat(e.target.value))}
                        placeholder="e.g. 720.00 sq.ft"
                        disabled={isReadOnly}
                      />
                    </Field>

                    {/* Built Up Area: */}
                    <Field label="Built Up Area: (Auto-summed from Sanctioned Area / Measured Area)">
                      <div className="relative">
                        <input
                          type="text"
                          className={`${inputCls} bg-slate-100/90 text-slate-700 font-semibold cursor-not-allowed`}
                          value={fields.builtUpAreaTotal || ''}
                          readOnly
                          disabled
                          placeholder="Auto-calculated from 'Sanctioned (sqft)' / 'Measured (sqft)' column"
                        />
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                          <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Auto: Sanctioned / Measured</span>
                        </div>
                      </div>
                    </Field>

                    {/* Remarks on construction:(Good / Bad) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Remarks on construction:(Good / Bad)
                        </label>
                        <div className="flex gap-1">
                          {['Good', 'Bad', 'Average', 'Satisfactory'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleChange('remarksOnConstruction', opt)}
                              disabled={isReadOnly}
                              className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                                (fields.remarksOnConstruction || '').toLowerCase() === opt.toLowerCase()
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.remarksOnConstruction || ''}
                        onChange={(e) => handleChange('remarksOnConstruction', e.target.value)}
                        placeholder="e.g. Good"
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Compliances with sanction plan:(Yes / No) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Compliances with sanction plan:(Yes / No)
                        </label>
                        <div className="flex gap-1">
                          {['Yes', 'No', 'Not Applicable', 'NA'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleChange('complianceWithPlan', opt)}
                              disabled={isReadOnly}
                              className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                                (fields.complianceWithPlan || '').toLowerCase() === opt.toLowerCase()
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.complianceWithPlan || ''}
                        onChange={(e) => handleChange('complianceWithPlan', e.target.value)}
                        placeholder="e.g. Yes"
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Quality of construction:(Good/ Bad) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Quality of construction:(Good/ Bad)
                        </label>
                        <div className="flex gap-1">
                          {['Good', 'Bad', 'Average', 'Excellent'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleChange('qualityOfConstruction', opt)}
                              disabled={isReadOnly}
                              className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                                (fields.qualityOfConstruction || '').toLowerCase() === opt.toLowerCase()
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.qualityOfConstruction || ''}
                        onChange={(e) => handleChange('qualityOfConstruction', e.target.value)}
                        placeholder="e.g. Good"
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Construction has been made as per Plan */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Construction has been made as per Plan
                        </label>
                        <div className="flex gap-1">
                          {['Yes', 'No', 'NA', 'Not Applicable'].map((opt) => (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => handleChange('constructionAsPerPlan', opt)}
                              disabled={isReadOnly}
                              className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                                (fields.constructionAsPerPlan || '').toLowerCase() === opt.toLowerCase()
                                  ? 'bg-blue-600 text-white font-bold'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              }`}
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.constructionAsPerPlan || ''}
                        onChange={(e) => handleChange('constructionAsPerPlan', e.target.value)}
                        placeholder="e.g. Yes"
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>

                {/* 27. Setback Around the Property */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 sm:p-5 shadow-xs space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-200/60">
                    <span className="font-sans font-semibold text-emerald-900 text-xs sm:text-sm">
                      27. Setback Around the Property
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                    <Field label="Front:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.setbackFront || ''}
                        onChange={(e) => handleChange('setbackFront', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Back-Side:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.setbackBack || ''}
                        onChange={(e) => handleChange('setbackBack', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Side 1:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.setbackSide1 || ''}
                        onChange={(e) => handleChange('setbackSide1', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Side 2:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.setbackSide2 || ''}
                        onChange={(e) => handleChange('setbackSide2', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="No. of Flats / Floor:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.noOfFlatsPerFloor || 'NA'}
                        onChange={(e) => handleChange('noOfFlatsPerFloor', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                {/* 28 & 29. Property Maintenance & Life */}
                <div className="rounded-xl border border-purple-200/80 bg-purple-50/40 p-4 sm:p-5 shadow-xs space-y-4">
                  <Field label="28. Maintenance of Property:">
                    <select
                      className={selectCls}
                      value={fields.maintenanceOfProperty || ''}
                      onChange={(e) => handleChange('maintenanceOfProperty', e.target.value)}
                      disabled={isReadOnly}
                    >
                      <option value="">-- Select --</option>
                      <option value="Good">Good</option>
                      <option value="Average">Average</option>
                      <option value="Poor">Poor</option>
                      <option value="Satisfactory">Satisfactory</option>
                    </select>
                  </Field>

                  {/* 29. Life of Property */}
                  <div className="rounded-lg border border-purple-200/60 bg-white/90 p-3.5 sm:p-4 shadow-2xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="29. Present Life (Years):">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.presentLife || ''}
                          onChange={(e) => handleChange('presentLife', sanitizePositiveInt(e.target.value, 3))}
                          placeholder="e.g. 5 Yrs"
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="Residual Life (Years):">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.residualLife || ''}
                          onChange={(e) => handleChange('residualLife', sanitizePositiveInt(e.target.value, 3))}
                          placeholder="e.g. 55 Yrs"
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* 7. Valuation & Computations */}
            <Section number={7} id="sec-valuation" title="Valuation Computations (Points 30–33)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 30. Recommended Valuation of the Property (Land Component Formula) */}
                <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4 sm:p-5 shadow-xs space-y-3.5 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-indigo-200/60 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-indigo-900 text-xs sm:text-sm">
                        30. Recommended Valuation of the Property (Land Component Formula)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const nextLocked = fields.recommendedValuationFormulaLocked === false;
                          if (nextLocked) {
                            const areaStr = fields.propertyArea || fields.areaOfLand || '';
                            const landArea = parseNum(areaStr);
                            const rate = parseNum(fields.plotRate);
                            const calcVal = (landArea > 0 && rate > 0) ? landArea * rate : 0;
                            const calcFormula = (areaStr && rate > 0)
                              ? `${areaStr} * Rs.${fields.plotRate}/- = Rs.${formatCurrencyINR(calcVal)}/-`
                              : '';
                            setFields(prev => ({
                              ...prev,
                              recommendedValuationFormulaLocked: true,
                              recommendedValuationFormula: calcFormula || prev.recommendedValuationFormula,
                              netValueLand: calcVal > 0 ? String(calcVal) : prev.netValueLand,
                              plotValueBreakdown: calcFormula || prev.plotValueBreakdown,
                            }));
                          } else {
                            setFields(prev => ({ ...prev, recommendedValuationFormulaLocked: false }));
                          }
                        }}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                          fields.recommendedValuationFormulaLocked !== false
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                        title={fields.recommendedValuationFormulaLocked !== false ? 'Auto-calculating formula from Pt 26 area & Pt 31 rate. Click to unlock for custom manual text.' : 'Unlocked for custom entry. Click to lock back to auto-calculation.'}
                      >
                        {fields.recommendedValuationFormulaLocked !== false ? '🔒 Locked (Auto-calculate)' : '🔓 Unlocked (Manual)'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* 26. Total Land / Property Area (Read-only Reference) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          26. Total Land / Property Area: (Read-only)
                        </label>
                        <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">
                          ⚡ Referenced from Pt 26
                        </span>
                      </div>
                      <input
                        type="text"
                        className={`${inputCls} bg-slate-100/90 text-slate-700 font-semibold cursor-not-allowed border-slate-300`}
                        value={fields.propertyArea || fields.areaOfLand || 'NA'}
                        readOnly
                        disabled
                      />
                      <p className="text-[11px] text-slate-500">
                        Automatically populated from Point 26 Total Land / Property Area.
                      </p>
                    </div>

                    {/* Rate per sq.ft (Float Input) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Rate of the Plot (Rs./sqft):
                        </label>
                        <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">
                          ⚡ Referenced from Pt 31
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.plotRate || ''}
                          onChange={(e) => {
                            const newRate = sanitizePositiveFloat(e.target.value);
                            const areaStr = fields.propertyArea || fields.areaOfLand || '';
                            const landArea = parseNum(areaStr);
                            const rateNum = parseNum(newRate);
                            const calcVal = (landArea > 0 && rateNum > 0) ? landArea * rateNum : 0;
                            const calcFormula = (areaStr && rateNum > 0)
                              ? `${areaStr} * Rs.${newRate}/- = Rs.${formatCurrencyINR(calcVal)}/-`
                              : '';
                            setFields(prev => ({
                              ...prev,
                              plotRate: newRate,
                              recommendedValuationFormula: prev.recommendedValuationFormulaLocked !== false ? (calcFormula || prev.recommendedValuationFormula) : prev.recommendedValuationFormula,
                              netValueLand: calcVal > 0 ? String(calcVal) : prev.netValueLand,
                              plotValueBreakdown: prev.recommendedValuationFormulaLocked !== false ? (calcFormula || prev.plotValueBreakdown) : prev.plotValueBreakdown,
                            }));
                          }}
                          placeholder="e.g. 1800"
                          disabled={isReadOnly}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Float rate per square foot used for land valuation.
                      </p>
                    </div>

                    {/* Resulting Formula */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Resulting Land Component Valuation Formula (Report &amp; PDF):
                        </label>
                        {fields.recommendedValuationFormulaLocked === false && (
                          <span className="text-[10.5px] text-amber-700 font-semibold">
                            Manual Custom Text
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        className={`${inputCls} ${
                          fields.recommendedValuationFormulaLocked !== false
                            ? 'bg-indigo-50/60 font-bold text-indigo-950 border-indigo-300'
                            : 'bg-white text-slate-900 border-amber-300'
                        }`}
                        value={fields.recommendedValuationFormula || ''}
                        onChange={(e) => handleChange('recommendedValuationFormula', e.target.value)}
                        readOnly={fields.recommendedValuationFormulaLocked !== false}
                        disabled={isReadOnly}
                        placeholder="e.g. Total Land Area: 10,890 sqft. * Rs.1800/- = Rs.1,96,02,000/-"
                      />
                      <p className="text-[11px] text-slate-500">
                        {fields.recommendedValuationFormulaLocked !== false
                          ? 'Auto-computed from Point 26 Land Area and Point 31 Rate.'
                          : 'Unlocked: Type any custom valuation formula statement directly.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 31. Recommended Rate & Value of Plot */}
                <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 sm:p-5 shadow-xs space-y-3.5 sm:col-span-2">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-200/60">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-blue-900 text-xs sm:text-sm">
                        31. Recommended Rate &amp; Value of the Plot
                      </span>
                    </div>
                    {(() => {
                      const landArea = parseNum(fields.propertyArea || fields.areaOfLand);
                      const rate = parseNum(fields.plotRate);
                      const calcVal = (landArea > 0 && rate > 0) ? landArea * rate : 0;
                      const calcText = calcVal > 0 
                        ? `Total Land Area: ${fields.propertyArea || fields.areaOfLand} sq.ft * Rs.${fields.plotRate}/- = Rs.${calcVal.toLocaleString('en-IN')}/-`
                        : '';
                      return calcText ? (
                        <button
                          type="button"
                          onClick={() => handleChange('plotValueBreakdown', calcText)}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 bg-blue-50 px-2.5 py-1 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                          title="Auto-calculate plot value"
                        >
                          ↻ Auto-calc Plot Value
                        </button>
                      ) : null;
                    })()}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <Field label="Recommended Rate of the Plot (Rs./sqft):">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.plotRate || ''}
                        onChange={(e) => handleChange('plotRate', sanitizePositiveFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="Recommended Value of the Plot:">
                        <textarea
                          rows={2}
                          className={inputCls}
                          value={fields.plotValueBreakdown || ''}
                          onChange={(e) => handleChange('plotValueBreakdown', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* 32. Cost of Construction */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 sm:p-5 shadow-xs space-y-3.5 sm:col-span-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
                    <span className="font-sans font-semibold text-amber-900 text-xs sm:text-sm">
                      32. Recommended Rate of Cost of Construction
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="sm:col-span-2">
                      <Field label="Rate of Cost of Construction (Rs./sqft):">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.rateOfCostOfConstruction || ''}
                          onChange={(e) => handleChange('rateOfCostOfConstruction', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* 33. Depreciation & Net Value of Property */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 sm:p-5 shadow-xs space-y-3.5 sm:col-span-2">
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-emerald-900 text-xs sm:text-sm">
                        33. Depreciation of Construction &amp; Valuation Breakdown
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div className="sm:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Depreciation of Construction (Amount in Rs.):
                        </label>
                        {parseNum(fields.depreciationOfConstruction) > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            ₹{formatCurrencyINR(parseNum(fields.depreciationOfConstruction))}
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.depreciationOfConstruction || ''}
                        onChange={(e) => handleChange('depreciationOfConstruction', sanitizePositiveFloat(e.target.value))}
                        placeholder="e.g. 0 or 250000 (Amount in Rs.)"
                        disabled={isReadOnly}
                      />
                      <p className="text-[11px] text-slate-500">
                        Direct depreciation amount in Rupees deducted from building valuation (enter 0 for Nil).
                      </p>
                    </div>

                    {/* Net Value of Property (Land + Building) - Divided into Land + Building = Total */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Net Value of Property (Land + Building):
                      </label>
                      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-3 sm:p-3.5 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                              Land Value (Rs.):
                            </label>
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.netValueLand || ''}
                              onChange={(e) => {
                                const val = sanitizePositiveFloat(e.target.value);
                                const land = parseNum(val);
                                const bldg = parseNum(fields.netValueBuilding);
                                const total = (land || 0) + (bldg || 0);
                                setFields(prev => ({
                                  ...prev,
                                  netValueLand: val,
                                  netValueOfProperty: total > 0 ? `Rs.${formatCurrencyINR(total)}/-` : '',
                                }));
                              }}
                              disabled={isReadOnly}
                            />
                          </div>

                          <div className="sm:col-span-1 flex items-center justify-center text-lg font-bold text-emerald-700 pt-1 sm:pt-4">
                            +
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                              Building Value (Rs.):
                            </label>
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.netValueBuilding || ''}
                              onChange={(e) => {
                                const val = sanitizePositiveFloat(e.target.value);
                                const land = parseNum(fields.netValueLand);
                                const bldg = parseNum(val);
                                const total = (land || 0) + (bldg || 0);
                                setFields(prev => ({
                                  ...prev,
                                  netValueBuilding: val,
                                  netValueOfProperty: total > 0 ? `Rs.${formatCurrencyINR(total)}/-` : '',
                                }));
                              }}
                              disabled={isReadOnly}
                            />
                          </div>

                          <div className="sm:col-span-1 flex items-center justify-center text-lg font-bold text-emerald-700 pt-1 sm:pt-4">
                            =
                          </div>

                          <div className="sm:col-span-4">
                            <label className="block text-[11px] font-semibold text-emerald-950 mb-1">
                              Total Net Value (Read-only):
                            </label>
                            <input
                              type="text"
                              className={`${inputCls} bg-white font-bold text-emerald-900 border-emerald-300 cursor-not-allowed`}
                              value={fields.netValueOfProperty || ''}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                        {(() => {
                          const land = parseNum(fields.netValueLand);
                          const bldg = parseNum(fields.netValueBuilding);
                          const sum = land + bldg;
                          return sum > 0 ? (
                            <div className="flex items-center justify-between text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60">
                              <span>Rs.{formatCurrencyINR(land)}/- + Rs.{formatCurrencyINR(bldg)}/-</span>
                              <span className="font-semibold">{formatIndianCurrency(sum)}</span>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    </div>
                    <Field label="Recommended Rate of the Flat:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.rateOfFlat || ''}
                        onChange={(e) => handleChange('rateOfFlat', sanitizePositiveFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Area of the Flat:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.areaOfFlat || ''}
                        onChange={(e) => handleChange('areaOfFlat', sanitizePositiveFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>

                    {/* Recommended Value of the Property */}
                    <div className="sm:col-span-2 space-y-2">
                      {(() => {
                        const valCalc = computeBandhanValuation(fields);
                        const recNum = parseNum(fields.recommendedValueOfProperty);
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-semibold text-slate-800">
                                Recommended Value of the Property (Float Amount in Rs.):
                              </label>
                              <div className="flex items-center gap-2">
                                {recNum > 0 && (
                                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ₹{formatCurrencyINR(recNum)}
                                  </span>
                                )}
                                {valCalc.recommendedValue > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleChange('recommendedValueOfProperty', String(valCalc.recommendedValue));
                                    }}
                                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 bg-emerald-100/70 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                                    title="Auto-calculate Recommended Value"
                                  >
                                    ↺ Auto: {formatCurrencyINR(valCalc.recommendedValue)}
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.recommendedValueOfProperty || ''}
                              onChange={(e) => handleChange('recommendedValueOfProperty', sanitizePositiveFloat(e.target.value))}
                              placeholder="e.g. 5000000 (Float amount in Rs.)"
                              disabled={isReadOnly}
                            />

                            {/* Formula breakdown explanation card */}
                            <div className="rounded-lg bg-emerald-50/90 border border-emerald-200/90 p-3 text-xs space-y-2 shadow-2xs">
                              <div className="flex flex-wrap items-center justify-between gap-1 text-emerald-900 font-semibold border-b border-emerald-200/70 pb-1.5">
                                <span className="flex items-center gap-1.5">
                                  <span>📐</span> Valuation Formula Applied:
                                </span>
                                <span className="font-mono text-[10.5px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                                  Recommended Value = Net Value (Land + Building) + (Flat Rate × Area) - Depreciation
                                </span>
                              </div>
                              <div className="text-slate-700 text-[11px] leading-relaxed">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 font-sans">
                                  <div>
                                    • <strong>Net Property (Land + Bldg):</strong> Rs.{formatCurrencyINR(valCalc.land)} + Rs.{formatCurrencyINR(valCalc.bldg)} = <span className="font-semibold text-emerald-950">Rs.{formatCurrencyINR(valCalc.netLandBldg)}/-</span>
                                  </div>
                                  <div>
                                    • <strong>Flat Component:</strong> {valCalc.flatVal > 0 ? `Rs.${fields.rateOfFlat}/sqft × ${fields.areaOfFlat} sqft = ` : ''}<span className={valCalc.flatVal > 0 ? 'font-semibold text-emerald-950' : 'text-slate-500'}>{valCalc.flatVal > 0 ? `Rs.${formatCurrencyINR(valCalc.flatVal)}/-` : 'Nil (Rs. 0)'}</span>
                                  </div>
                                  <div>
                                    • <strong>Depreciation:</strong> {valCalc.depAmount > 0 ? <span className="text-rose-700 font-semibold">- Rs.${formatCurrencyINR(valCalc.depAmount)}/- ({valCalc.depDescription})</span> : <span className="text-slate-500">Nil (Rs. 0)</span>}
                                  </div>
                                  <div>
                                    • <strong>Calculated Result:</strong> <span className="font-bold text-emerald-800 font-mono text-xs">Rs.{formatCurrencyINR(valCalc.recommendedValue)}/-</span> {valCalc.recommendedValue > 0 ? `(${formatIndianCurrency(valCalc.recommendedValue)})` : ''}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    {/* Total Market Value of Existing Property */}
                    <div className="sm:col-span-2 space-y-1.5">
                      {(() => {
                        const valCalc = computeBandhanValuation(fields);
                        const refNum = parseNum(fields.recommendedValueOfProperty) || valCalc.recommendedValue;
                        const mktNum = parseNum(fields.totalMarketValue);
                        return (
                          <>
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-semibold text-slate-800">
                                Total Market Value of Existing Property (Float Amount in Rs.):
                              </label>
                              <div className="flex items-center gap-2">
                                {mktNum > 0 && (
                                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ₹{formatCurrencyINR(mktNum)}
                                  </span>
                                )}
                                {refNum > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleChange('totalMarketValue', String(refNum))}
                                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1 bg-emerald-100/70 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 transition-colors cursor-pointer"
                                    title="Sync with Recommended Value"
                                  >
                                    ↺ Sync from Recommended: {formatCurrencyINR(refNum)}
                                  </button>
                                )}
                              </div>
                            </div>
                            <input
                              type="text"
                              className={inputCls}
                              value={fields.totalMarketValue || ''}
                              onChange={(e) => handleChange('totalMarketValue', sanitizePositiveFloat(e.target.value))}
                              placeholder="e.g. 5000000 (Float amount in Rs.)"
                              disabled={isReadOnly}
                            />
                            <p className="text-[11px] text-slate-500">
                              Auto-referenced from Recommended Value of the Property. Freely editable float amount for custom adjustments.
                            </p>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* 8. Progress of Work */}
            <Section number={8} id="sec-progress" title="Progress of Work (Point 34)">
              {/* 34. Progress of Work */}
              <div className="rounded-xl border border-indigo-200/80 bg-indigo-50/40 p-4 sm:p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-200/60">
                  <div className="flex items-center gap-2">
                    <span className="font-sans font-semibold text-indigo-900 text-xs sm:text-sm">
                      34. Progress of Work Stages &amp; Percentage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFields(prev => ({
                          ...prev,
                          progressFoundation: 'Completed',
                          progressRCC: 'Completed',
                          progressBR: 'Completed',
                          progressPlastering: 'Completed',
                          progressFlooring: 'Completed',
                          progressDoorsWindows: 'Completed',
                          progressElectricalSanitary: 'Completed',
                          progressPainting: 'Completed',
                          progressTotalPct: prev.progressTotalPct || '100%',
                          progressRecommendationPct: prev.progressRecommendationPct || '100%',
                        }));
                      }}
                      className="text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-1 bg-indigo-100/70 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200 transition-colors"
                      title="Set all progress stages to Completed"
                    >
                      ⚡ Set All Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFields(prev => ({
                          ...prev,
                          progressFoundation: '',
                          progressRCC: '',
                          progressBR: '',
                          progressPlastering: '',
                          progressFlooring: '',
                          progressDoorsWindows: '',
                          progressElectricalSanitary: '',
                          progressPainting: '',
                        }));
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 bg-white hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-200 transition-colors"
                      title="Clear all progress stages"
                    >
                      ✕ Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Floor Structure Level: (Auto-derived from Point 26 Floor Breakdown Table)">
                      <div className="relative">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.progressStructureHeader || ''}
                          onChange={(e) => handleChange('progressStructureHeader', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                          <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded border border-indigo-200">Auto: Pt 26 Floors</span>
                        </div>
                      </div>
                    </Field>
                  </div>

                  <Field label="Foundation:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressFoundation || ''}
                      onChange={(e) => handleChange('progressFoundation', e.target.value)}
                      placeholder="e.g. Completed or 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label={`${getWorkProgressStructureLabel(fields.typeOfStructure)}: (⚡ Auto-labeled from Pt 21)`}>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressRCC || ''}
                      onChange={(e) => handleChange('progressRCC', e.target.value)}
                      placeholder="e.g. Completed or 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Brick Work (BR):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressBR || ''}
                      onChange={(e) => handleChange('progressBR', e.target.value)}
                      placeholder="e.g. Completed or 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Plastering:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressPlastering || ''}
                      onChange={(e) => handleChange('progressPlastering', e.target.value)}
                      placeholder="e.g. Completed or 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Flooring:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressFlooring || ''}
                      onChange={(e) => handleChange('progressFlooring', e.target.value)}
                      placeholder="e.g. Completed or 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Doors & Windows:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressDoorsWindows || ''}
                      onChange={(e) => handleChange('progressDoorsWindows', e.target.value)}
                      placeholder="e.g. Completed or 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Electrical, Sanitary & Plumbing:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressElectricalSanitary || ''}
                      onChange={(e) => handleChange('progressElectricalSanitary', e.target.value)}
                      placeholder="e.g. Completed or 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Painting:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressPainting || ''}
                      onChange={(e) => handleChange('progressPainting', e.target.value)}
                      placeholder="e.g. Completed or 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Progress of Work (%):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressTotalPct || ''}
                      onChange={(e) => handleChange('progressTotalPct', e.target.value)}
                      placeholder="e.g. 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Recommendation (%):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressRecommendationPct || ''}
                      onChange={(e) => handleChange('progressRecommendationPct', e.target.value)}
                      placeholder="e.g. 100%"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 9. Final Valuation Summary & Project Details */}
            <Section number={9} id="sec-final-valuation" title="Final Valuation Summary & Project Details (Points 35–40)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-700">
                      35. Valuation of the property as on date:
                    </label>
                    {(() => {
                      const refVal = fields.totalMarketValue || fields.recommendedValueOfProperty;
                      return refVal ? (
                        <button
                          type="button"
                          onClick={() => handleChange('valuationAsOnDate', refVal)}
                          className="text-[11px] text-sky-700 hover:text-sky-900 font-medium flex items-center gap-1 bg-sky-100/70 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                          title="Sync with Market Value"
                        >
                          ↺ Sync: {refVal}
                        </button>
                      ) : null;
                    })()}
                  </div>
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuationAsOnDate || ''}
                    onChange={(e) => handleChange('valuationAsOnDate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>

                {/* 36. Valuation as per Govt. Rates (Land) */}
                <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4 sm:p-5 shadow-xs space-y-3.5 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-sky-200/60 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-sky-900 text-xs sm:text-sm">
                        36. Valuation as per Govt. Rates (Land)
                      </span>
                    </div>
                    {(() => {
                      const areaStr = fields.govtLandArea !== undefined ? fields.govtLandArea : (fields.propertyArea || fields.areaOfLand || '');
                      const areaNum = parseNum(areaStr);
                      const rateNum = parseNum(fields.govtRateLand);
                      const calcVal = (areaNum > 0 && rateNum > 0) ? areaNum * rateNum : 0;
                      return calcVal > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-sky-900 bg-white/90 px-2.5 py-0.5 rounded border border-sky-200 shadow-2xs">
                            ₹{formatCurrencyINR(calcVal)} ({formatIndianCurrency(calcVal)})
                          </span>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Horizontal Formula Row: _______ * ________ = ________ */}
                  <div className="rounded-lg border border-sky-200/90 bg-white/80 p-3.5 sm:p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-center">
                      {/* Box 1: Land Area (sqft) */}
                      <div className="sm:col-span-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-semibold text-slate-700">
                            Land Area (sqft):
                          </label>
                          <span className="text-[9.5px] font-medium text-sky-700 bg-sky-50 px-1 py-0.5 rounded border border-sky-200">
                            Pt 26 / 39
                          </span>
                        </div>
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.govtLandArea !== undefined ? fields.govtLandArea : (fields.propertyArea || fields.areaOfLand || '')}
                          onChange={(e) => {
                            const newArea = sanitizePositiveFloat(e.target.value);
                            const rateStr = fields.govtRateLand || '';
                            const areaNum = parseNum(newArea);
                            const rateNum = parseNum(rateStr);
                            const calcVal = (areaNum > 0 && rateNum > 0) ? areaNum * rateNum : 0;
                            const calcFormula = (newArea && rateNum > 0)
                              ? `${newArea} * Rs.${rateStr}/- = Rs.${formatCurrencyINR(calcVal)}/-`
                              : '';
                            setFields(prev => ({
                              ...prev,
                              govtLandArea: newArea,
                              valuationGovtRate: prev.valuationGovtRateLocked !== false ? (calcFormula || prev.valuationGovtRate) : prev.valuationGovtRate,
                            }));
                          }}
                          placeholder="e.g. 10890"
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Multiply sign * */}
                      <div className="sm:col-span-1 flex items-center justify-center text-xl font-black text-sky-700 pt-1 sm:pt-4">
                        *
                      </div>

                      {/* Box 2: Govt. Land Rate (Rs./sqft) */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          Govt. Rate (Rs./sqft):
                        </label>
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.govtRateLand || ''}
                          onChange={(e) => {
                            const newRate = sanitizePositiveFloat(e.target.value);
                            const areaStr = fields.govtLandArea !== undefined ? fields.govtLandArea : (fields.propertyArea || fields.areaOfLand || '');
                            const areaNum = parseNum(areaStr);
                            const rateNum = parseNum(newRate);
                            const calcVal = (areaNum > 0 && rateNum > 0) ? areaNum * rateNum : 0;
                            const calcFormula = (areaStr && rateNum > 0)
                              ? `${areaStr} * Rs.${newRate}/- = Rs.${formatCurrencyINR(calcVal)}/-`
                              : '';
                            setFields(prev => ({
                              ...prev,
                              govtRateLand: newRate,
                              valuationGovtRate: prev.valuationGovtRateLocked !== false ? (calcFormula || prev.valuationGovtRate) : prev.valuationGovtRate,
                            }));
                          }}
                          placeholder="e.g. 1800"
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Equal sign = */}
                      <div className="sm:col-span-1 flex items-center justify-center text-xl font-black text-sky-700 pt-1 sm:pt-4">
                        =
                      </div>

                      {/* Box 3: Valuation as per Govt. Rates (Locked Read-only) */}
                      <div className="sm:col-span-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-[11px] font-semibold text-sky-950">
                            Govt. Valuation (Locked Read-only):
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const nextLocked = fields.valuationGovtRateLocked === false;
                              if (nextLocked) {
                                const areaStr = fields.govtLandArea !== undefined ? fields.govtLandArea : (fields.propertyArea || fields.areaOfLand || '');
                                const areaNum = parseNum(areaStr);
                                const rateNum = parseNum(fields.govtRateLand);
                                const calcVal = (areaNum > 0 && rateNum > 0) ? areaNum * rateNum : 0;
                                const calcFormula = (areaStr && rateNum > 0)
                                  ? `${areaStr} * Rs.${fields.govtRateLand}/- = Rs.${formatCurrencyINR(calcVal)}/-`
                                  : '';
                                setFields(prev => ({
                                  ...prev,
                                  valuationGovtRateLocked: true,
                                  valuationGovtRate: calcFormula || prev.valuationGovtRate,
                                }));
                              } else {
                                setFields(prev => ({ ...prev, valuationGovtRateLocked: false }));
                              }
                            }}
                            disabled={isReadOnly}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium border flex items-center gap-1 cursor-pointer transition-colors ${
                              fields.valuationGovtRateLocked !== false
                                ? 'bg-sky-100 text-sky-800 border-sky-300 hover:bg-sky-200'
                                : 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200'
                            }`}
                            title={fields.valuationGovtRateLocked !== false ? 'Locked & auto-computed. Click to unlock for custom manual text.' : 'Unlocked for custom entry. Click to lock back to auto-calculation.'}
                          >
                            {fields.valuationGovtRateLocked !== false ? '🔒 Locked' : '🔓 Unlocked'}
                          </button>
                        </div>
                        <input
                          type="text"
                          className={`${inputCls} ${
                            fields.valuationGovtRateLocked !== false
                              ? 'bg-sky-50/70 font-bold text-sky-950 border-sky-300 cursor-not-allowed'
                              : 'bg-white text-slate-900 border-amber-300'
                          }`}
                          value={(() => {
                            if (fields.valuationGovtRateLocked !== false) {
                              if (fields.valuationGovtRate) return fields.valuationGovtRate;
                              const areaStr = fields.govtLandArea !== undefined ? fields.govtLandArea : (fields.propertyArea || fields.areaOfLand || '');
                              const areaNum = parseNum(areaStr);
                              const rateNum = parseNum(fields.govtRateLand);
                              const calcVal = (areaNum > 0 && rateNum > 0) ? areaNum * rateNum : 0;
                              if (areaStr && rateNum > 0) {
                                return `${areaStr} * Rs.${fields.govtRateLand}/- = Rs.${formatCurrencyINR(calcVal)}/-`;
                              }
                            }
                            return fields.valuationGovtRate || '';
                          })()}
                          onChange={(e) => handleChange('valuationGovtRate', e.target.value)}
                          readOnly={fields.valuationGovtRateLocked !== false}
                          disabled={isReadOnly}
                          placeholder="e.g. 10890 * Rs.1800/- = Rs.1,96,02,000/-"
                        />
                      </div>
                    </div>

                    {/* Formula helper message */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-sky-100">
                      <span>
                        {fields.valuationGovtRateLocked !== false
                          ? 'Auto-computed formula: Land Area (sqft) * Govt. Rate (Rs./sqft) = Resulting Valuation'
                          : 'Unlocked: Type any custom govt. valuation statement directly.'}
                      </span>
                      {(() => {
                        const areaStr = fields.govtLandArea !== undefined ? fields.govtLandArea : (fields.propertyArea || fields.areaOfLand || '');
                        const areaNum = parseNum(areaStr);
                        const rateNum = parseNum(fields.govtRateLand);
                        const calcVal = (areaNum > 0 && rateNum > 0) ? areaNum * rateNum : 0;
                        return calcVal > 0 ? (
                          <span className="font-semibold text-sky-900 font-sans">
                            {areaStr} sqft. × Rs.{fields.govtRateLand}/- = Rs.${formatCurrencyINR(calcVal)}/-
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>

                {/* 37. Distress Sale Value & Realizable Value (Percentage manual decimal input + presets, read-only auto-calculated value) */}
                <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4 sm:p-5 shadow-xs space-y-4 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-sky-200/60 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-sky-900 text-xs sm:text-sm">
                        37. Distress Sale Value &amp; Realizable Value
                      </span>
                    </div>
                    {(() => {
                      const baseNum = parseNum(fields.totalMarketValue || fields.recommendedValueOfProperty || fields.valuationAsOnDate);
                      return baseNum > 0 ? (
                        <span className="text-[11px] font-medium text-slate-700 bg-white/90 px-2.5 py-0.5 rounded border border-sky-200 shadow-2xs">
                          Base Market Value: <strong className="text-sky-950 font-mono">Rs.{formatCurrencyINR(baseNum)}/-</strong>
                        </span>
                      ) : null;
                    })()}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Card 1: Distress Sale Value */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Distress Sale Value
                        </label>
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium bg-sky-50 text-sky-700 border border-sky-200">
                          ⚡ Auto % of Market Value
                        </span>
                      </div>

                      {/* Percentage manual decimal input */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-600 block">
                          Distress Percentage (%):
                        </span>
                        <div className="relative">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.distressSalePct !== undefined ? fields.distressSalePct : '90'}
                            onChange={(e) => {
                              const cleanPct = sanitizePercentage(e.target.value);
                              const numPct = parseNum(cleanPct);
                              const baseNum = parseNum(fields.totalMarketValue || fields.recommendedValueOfProperty || fields.valuationAsOnDate);
                              const amt = (baseNum > 0 && numPct > 0) ? `Rs.${formatCurrencyINR(Math.round((baseNum * numPct) / 100))}/-` : '';
                              setFields(prev => ({
                                ...prev,
                                distressSalePct: cleanPct,
                                distressSaleValue: amt || prev.distressSaleValue,
                              }));
                            }}
                            disabled={isReadOnly}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-semibold text-slate-400">
                            %
                          </div>
                        </div>
                      </div>

                      {/* Read-only Distress Sale Value */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Resulting Distress Sale Value (Read-only):
                        </label>
                        <input
                          type="text"
                          className={`${inputCls} bg-sky-50/60 font-bold text-sky-950 border-sky-300 cursor-not-allowed`}
                          value={fields.distressSaleValue || ''}
                          readOnly
                          disabled
                        />
                        <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-0.5 font-sans">
                          {(() => {
                            const baseNum = parseNum(fields.totalMarketValue || fields.recommendedValueOfProperty || fields.valuationAsOnDate);
                            return (
                              <span>
                                {baseNum > 0 ? `Rs.${formatCurrencyINR(baseNum)} × ${fields.distressSalePct || '90'}%` : 'Set Market Value to calculate'}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Card 2: Realizable Value */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3.5 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                          Realizable Value
                        </label>
                        <span className="text-[10.5px] px-2 py-0.5 rounded-full font-medium bg-sky-50 text-sky-700 border border-sky-200">
                          ⚡ Auto % of Market Value
                        </span>
                      </div>

                      {/* Percentage manual decimal input */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-600 block">
                          Realizable Percentage (%):
                        </span>
                        <div className="relative">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.realisableValuePct !== undefined ? fields.realisableValuePct : '95'}
                            onChange={(e) => {
                              const cleanPct = sanitizePercentage(e.target.value);
                              const numPct = parseNum(cleanPct);
                              const baseNum = parseNum(fields.totalMarketValue || fields.recommendedValueOfProperty || fields.valuationAsOnDate);
                              const amt = (baseNum > 0 && numPct > 0) ? `Rs.${formatCurrencyINR(Math.round((baseNum * numPct) / 100))}/-` : '';
                              setFields(prev => ({
                                ...prev,
                                realisableValuePct: cleanPct,
                                realisableValue: amt || prev.realisableValue,
                              }));
                            }}
                            disabled={isReadOnly}
                          />
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-xs font-semibold text-slate-400">
                            %
                          </div>
                        </div>
                      </div>

                      {/* Read-only Realizable Value */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-600">
                          Resulting Realizable Value (Read-only):
                        </label>
                        <input
                          type="text"
                          className={`${inputCls} bg-sky-50/60 font-bold text-sky-950 border-sky-300 cursor-not-allowed`}
                          value={fields.realisableValue || ''}
                          readOnly
                          disabled
                        />
                        <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-0.5 font-sans">
                          {(() => {
                            const baseNum = parseNum(fields.totalMarketValue || fields.recommendedValueOfProperty || fields.valuationAsOnDate);
                            return (
                              <span>
                                {baseNum > 0 ? `Rs.${formatCurrencyINR(baseNum)} × ${fields.realisableValuePct || '95'}%` : 'Set Market Value to calculate'}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 38. Date of project commencement & date of expected project completion */}
                <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4 sm:p-5 shadow-xs space-y-3.5 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-sky-200/60 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-sky-900 text-xs sm:text-sm">
                        38. Date of Project Commencement &amp; Date of Expected Project Completion
                      </span>
                    </div>
                    {(fields.projectCommencementDate || fields.expectedCompletionDate || fields.dateCommencementCompletion) && (
                      <button
                        type="button"
                        onClick={() => {
                          setFields(prev => ({
                            ...prev,
                            projectCommencementDate: '',
                            expectedCompletionDate: '',
                            dateCommencementCompletion: 'NA',
                          }));
                        }}
                        className="text-xs text-slate-500 hover:text-rose-600 font-medium flex items-center gap-1 bg-white hover:bg-rose-50 px-2 py-0.5 rounded border border-slate-200 transition-colors cursor-pointer"
                        title="Reset dates to NA"
                      >
                        ✕ Clear Dates
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Date of Project Commencement:">
                      <input
                        type="date"
                        className={inputCls}
                        value={fields.projectCommencementDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const comp = fields.expectedCompletionDate || '';
                          const rendered = formatCommencementCompletion(val, comp);
                          setFields(prev => ({
                            ...prev,
                            projectCommencementDate: val,
                            dateCommencementCompletion: rendered,
                          }));
                        }}
                        disabled={isReadOnly}
                      />
                    </Field>

                    <Field label="Date of Expected Project Completion:">
                      <input
                        type="date"
                        className={inputCls}
                        value={fields.expectedCompletionDate || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          const comm = fields.projectCommencementDate || '';
                          const rendered = formatCommencementCompletion(comm, val);
                          setFields(prev => ({
                            ...prev,
                            expectedCompletionDate: val,
                            dateCommencementCompletion: rendered,
                          }));
                        }}
                        disabled={isReadOnly}
                      />
                    </Field>

                    <div className="sm:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Rendered Statement (Report &amp; PDF):
                        </label>
                        {(() => {
                          const autoFormatted = formatCommencementCompletion(fields.projectCommencementDate, fields.expectedCompletionDate);
                          return autoFormatted && autoFormatted !== fields.dateCommencementCompletion ? (
                            <button
                              type="button"
                              onClick={() => handleChange('dateCommencementCompletion', autoFormatted)}
                              className="text-[11px] text-sky-700 hover:text-sky-900 font-medium flex items-center gap-1 bg-sky-100/70 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                              title="Re-apply auto format from dates"
                            >
                              ↺ Auto-format: {autoFormatted}
                            </button>
                          ) : null;
                        })()}
                      </div>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dateCommencementCompletion !== undefined ? fields.dateCommencementCompletion : formatCommencementCompletion(fields.projectCommencementDate, fields.expectedCompletionDate)}
                        onChange={(e) => handleChange('dateCommencementCompletion', e.target.value)}
                        disabled={isReadOnly}
                      />
                      <p className="text-[11px] text-slate-500">
                        {fields.projectCommencementDate || fields.expectedCompletionDate
                          ? 'Auto-generated from selected dates. Rendered as Project Commencement - <date> and/or Expected Completion - <date>.'
                          : 'Displays "NA" when no dates are selected.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 39. Area of Land (Unit selector, auto-convert to sqft, and constrain lock) */}
                <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4 sm:p-5 shadow-xs space-y-4 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-sky-200/60 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-sky-900 text-xs sm:text-sm">
                        39. Area of Land
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {fields.propertyArea && (
                        <button
                          type="button"
                          onClick={() => {
                            const refVal = fields.propertyArea || '';
                            const num = parseNum(refVal);
                            const unit = fields.areaOfLandUnit || 'ACRE_DEC';
                            let valStr = refVal;
                            if (unit === 'ACRE_DEC' && num > 0) {
                              valStr = (num / 43560).toFixed(3);
                            }
                            const formatted = formatAreaOfLandStatement(unit, valStr, '', '', refVal);
                            setFields(prev => ({
                              ...prev,
                              areaOfLandValue: valStr,
                              areaOfLand: prev.areaOfLandLocked !== false ? formatted.statement : prev.areaOfLand,
                            }));
                          }}
                          className="text-[11px] text-sky-700 hover:text-sky-900 font-medium flex items-center gap-1 bg-sky-100/70 hover:bg-sky-100 px-2 py-0.5 rounded border border-sky-200 transition-colors cursor-pointer"
                          title="Sync from Pt 13 Property Area"
                        >
                          ↺ Sync Pt 13: {fields.propertyArea} sqft
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const nextLocked = fields.areaOfLandLocked === false;
                          if (nextLocked) {
                            const unit = fields.areaOfLandUnit || 'ACRE_DEC';
                            const val = fields.areaOfLandValue || fields.areaOfLandAcres || '';
                            const formatted = formatAreaOfLandStatement(unit, val, fields.areaOfLandAcres, fields.areaOfLandDecimals, fields.areaOfLand);
                            setFields(prev => ({
                              ...prev,
                              areaOfLandLocked: true,
                              areaOfLand: formatted.statement || prev.areaOfLand,
                            }));
                          } else {
                            setFields(prev => ({ ...prev, areaOfLandLocked: false }));
                          }
                        }}
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                          fields.areaOfLandLocked !== false
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                        }`}
                        title={fields.areaOfLandLocked !== false ? 'Constrained & auto-converted to sqft. Click to unlock for manual custom text.' : 'Unlocked for custom entry. Click to lock back to auto-conversion.'}
                      >
                        {fields.areaOfLandLocked !== false ? '🔒 Locked (Auto-convert)' : '🔓 Unlocked (Manual)'}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Choose Area Unit:">
                      <select
                        className={selectCls}
                        value={fields.areaOfLandUnit || 'ACRE_DEC'}
                        onChange={(e) => {
                          const unit = e.target.value as any;
                          const val = fields.areaOfLandValue || '';
                          const formatted = formatAreaOfLandStatement(unit, val, fields.areaOfLandAcres, fields.areaOfLandDecimals, fields.areaOfLand);
                          setFields(prev => ({
                            ...prev,
                            areaOfLandUnit: unit,
                            areaOfLand: prev.areaOfLandLocked !== false ? formatted.statement : prev.areaOfLand,
                          }));
                        }}
                        disabled={isReadOnly}
                      >
                        <option value="ACRE_DEC">Acres &amp; Decimals (e.g. AC.0.250Decs)</option>
                        <option value="DECIMAL">Decimals / Cents (1 Dec = 435.6 sqft)</option>
                        <option value="SQFT">Square Feet (sqft - Direct / No conversion)</option>
                        <option value="SQYD">Square Yards / Gaj (1 Sq.Yd = 9 sqft)</option>
                        <option value="SQMT">Square Meters (1 Sq.M = 10.7639 sqft)</option>
                        <option value="GUNTHA">Guntha (1 Guntha = 1089 sqft)</option>
                      </select>
                    </Field>

                    {/* Numeric Input */}
                    <Field
                      label={
                        fields.areaOfLandUnit === 'ACRE_DEC'
                          ? 'Land Area in Acres (e.g. 0.250 or 0.25):'
                          : fields.areaOfLandUnit === 'DECIMAL'
                          ? 'Land Area in Decimals (e.g. 25):'
                          : fields.areaOfLandUnit === 'SQFT'
                          ? 'Land Area in Sq. Feet (e.g. 10890):'
                          : fields.areaOfLandUnit === 'SQYD'
                          ? 'Land Area in Sq. Yards (e.g. 200):'
                          : fields.areaOfLandUnit === 'SQMT'
                          ? 'Land Area in Sq. Meters (e.g. 100):'
                          : 'Land Area in Guntha (e.g. 10):'
                      }
                    >
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.areaOfLandValue || ''}
                        onChange={(e) => {
                          const val = sanitizePositiveFloat(e.target.value);
                          const unit = fields.areaOfLandUnit || 'ACRE_DEC';
                          const formatted = formatAreaOfLandStatement(unit, val, fields.areaOfLandAcres, fields.areaOfLandDecimals, fields.areaOfLand);
                          setFields(prev => ({
                            ...prev,
                            areaOfLandValue: val,
                            areaOfLand: prev.areaOfLandLocked !== false ? formatted.statement : prev.areaOfLand,
                          }));
                        }}
                        disabled={isReadOnly}
                      />
                    </Field>

                    {/* Result statement */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Resulting Area of Land Statement (Report &amp; PDF):
                        </label>
                        {fields.areaOfLandLocked === false && (
                          <span className="text-[10.5px] text-amber-700 font-semibold">
                            Manual Custom Text
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        className={`${inputCls} ${
                          fields.areaOfLandLocked !== false
                            ? 'bg-sky-50/60 font-bold text-sky-950 border-sky-300'
                            : 'bg-white text-slate-900 border-amber-300'
                        }`}
                        value={fields.areaOfLand || ''}
                        onChange={(e) => handleChange('areaOfLand', e.target.value)}
                        readOnly={fields.areaOfLandLocked !== false}
                        disabled={isReadOnly}
                      />
                      <p className="text-[11px] text-slate-500">
                        {fields.areaOfLandLocked !== false
                          ? fields.areaOfLandUnit === 'ACRE_DEC'
                            ? 'Auto-converted using standard 1 Acre = 43,560 sqft. Formatted as (AC.0.250Decs) i.e. 10,890sqft.'
                            : fields.areaOfLandUnit === 'SQFT'
                            ? 'Direct Sq.Ft. input without conversion.'
                            : 'Auto-converted to equivalent square feet.'
                          : 'Unlocked: Type any custom land area statement directly.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 40. Expected Cost of the Project (Reference presets and constrain lock) */}
                <div className="rounded-xl border border-sky-200/80 bg-sky-50/40 p-4 sm:p-5 shadow-xs space-y-3.5 sm:col-span-2">
                  <div className="flex flex-wrap items-center justify-between pb-2 border-b border-sky-200/60 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-sans font-semibold text-sky-900 text-xs sm:text-sm">
                        40. Expected Cost of the Project
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const nextLocked = fields.expectedCostOfProjectLocked === false;
                        setFields(prev => ({
                          ...prev,
                          expectedCostOfProjectLocked: nextLocked,
                        }));
                      }}
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border transition-colors cursor-pointer ${
                        fields.expectedCostOfProjectLocked !== false
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                      }`}
                      title={fields.expectedCostOfProjectLocked !== false ? 'Locked to reference preset. Click to unlock for custom manual text.' : 'Unlocked. Click to lock back to preset.'}
                    >
                      {fields.expectedCostOfProjectLocked !== false ? '🔒 Locked (Auto-sync)' : '🔓 Unlocked (Manual)'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {/* Quick reference presets */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-600">
                        Quick Reference Presets:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setFields(prev => ({
                            ...prev,
                            expectedCostOfProjectRef: 'NA',
                            expectedCostOfProject: 'NA',
                          }));
                        }}
                        disabled={isReadOnly}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                          fields.expectedCostOfProject === 'NA' || fields.expectedCostOfProjectRef === 'NA'
                            ? 'bg-sky-700 text-white font-bold'
                            : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        ⚡ NA (Completed Property)
                      </button>

                      {fields.netValueBuilding && (
                        <button
                          type="button"
                          onClick={() => {
                            const bldgVal = (fields.netValueBuilding || '').startsWith('Rs.') ? fields.netValueBuilding! : `Rs.${fields.netValueBuilding}/-`;
                            setFields(prev => ({
                              ...prev,
                              expectedCostOfProjectRef: 'BUILDING',
                              expectedCostOfProject: bldgVal,
                            }));
                          }}
                          disabled={isReadOnly}
                          className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                            fields.expectedCostOfProjectRef === 'BUILDING'
                              ? 'bg-sky-700 text-white font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          🏢 Building Cost ({fields.netValueBuilding})
                        </button>
                      )}

                      {(fields.totalMarketValue || fields.recommendedValueOfProperty) && (
                        <button
                          type="button"
                          onClick={() => {
                            const mktVal = fields.totalMarketValue || fields.recommendedValueOfProperty || '';
                            setFields(prev => ({
                              ...prev,
                              expectedCostOfProjectRef: 'MARKET',
                              expectedCostOfProject: mktVal,
                            }));
                          }}
                          disabled={isReadOnly}
                          className={`text-xs px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                            fields.expectedCostOfProjectRef === 'MARKET'
                              ? 'bg-sky-700 text-white font-bold'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          🏠 Market Value ({fields.totalMarketValue || fields.recommendedValueOfProperty})
                        </button>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-slate-700">
                          Expected Cost of the Project (Statement in Report &amp; PDF):
                        </label>
                        {fields.expectedCostOfProjectLocked === false && (
                          <span className="text-[10.5px] text-amber-700 font-semibold">
                            Manual Custom Entry
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        className={`${inputCls} ${
                          fields.expectedCostOfProjectLocked !== false
                            ? 'bg-sky-50/60 font-bold text-sky-950 border-sky-300'
                            : 'bg-white text-slate-900 border-amber-300'
                        }`}
                        value={fields.expectedCostOfProject || ''}
                        onChange={(e) => handleChange('expectedCostOfProject', e.target.value)}
                        readOnly={fields.expectedCostOfProjectLocked !== false}
                        disabled={isReadOnly}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Section>

            {/* 10. NDMA Parameters */}
            <Section number={10} id="sec-ndma" title="NDMA Disaster Management Parameters (Point 41)">
              <div className="space-y-4">
                {/* Header action buttons */}
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs text-slate-500">
                    Click any option chip, sync from earlier sections, or type freely. Fields can also be left blank.
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFields(prev => ({
                          ...prev,
                          ndmaConcreteGrade: 'M25',
                          ndmaHorizontalFloorType: 'Beams and Slabs',
                          ndmaSeismicZone: 'Zone-III',
                          ndmaSteelGrade: 'FE - 450',
                          ndmaFloodProne: 'NO',
                          ndmaUrbanFloods: 'NO',
                          ndmaEnvironmentExposure: 'Mild',
                          ndmaSoilSlopeLandslide: 'Low Hazard Zone',
                          ndmaWindCyclones: 'Low Damage Risk Zone',
                          ndmaTsunami: 'NO',
                          ndmaHeightAboveGround: 'Less Than 15m Tall',
                          ndmaCRZ: 'NA',
                          ndmaNatureOfBuilding: 'Standalone Structure',
                          ndmaFunctionOfUse: prev.propertyType || prev.approvedUsage || 'Residential',
                          ndmaFoundationType: 'Open Footing column',
                          ndmaStructureType: getNdmaStructureTypeForStructure(prev.typeOfStructure),
                        }));
                      }}
                      className="text-xs text-indigo-700 hover:text-indigo-900 font-medium flex items-center gap-1 bg-indigo-100/70 hover:bg-indigo-100 px-2.5 py-1 rounded border border-indigo-200 transition-colors"
                      title="Set all NDMA parameters to recommended defaults"
                    >
                      ⚡ Set Recommended Defaults
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFields(prev => ({
                          ...prev,
                          ndmaConcreteGrade: '',
                          ndmaHorizontalFloorType: '',
                          ndmaSeismicZone: '',
                          ndmaSteelGrade: '',
                          ndmaFloodProne: '',
                          ndmaUrbanFloods: '',
                          ndmaEnvironmentExposure: '',
                          ndmaSoilSlopeLandslide: '',
                          ndmaWindCyclones: '',
                          ndmaTsunami: '',
                          ndmaHeightAboveGround: '',
                          ndmaCRZ: '',
                          ndmaNatureOfBuilding: '',
                          ndmaFunctionOfUse: '',
                          ndmaFoundationType: '',
                          ndmaStructureType: '',
                        }));
                      }}
                      className="text-xs text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1 bg-white hover:bg-slate-100 px-2.5 py-1 rounded border border-slate-200 transition-colors"
                      title="Clear all NDMA fields"
                    >
                      ✕ Clear All
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* 1. Concrete Grade */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Concrete Grade
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['M20', 'M25', 'M30', 'M15', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaConcreteGrade', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaConcreteGrade || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaConcreteGrade && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaConcreteGrade', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaConcreteGrade || ''}
                      onChange={(e) => handleChange('ndmaConcreteGrade', e.target.value)}
                      placeholder="e.g. M25"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 2. Horizontal floor type */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="block text-xs font-semibold text-slate-800">
                        Horizontal floor type
                      </label>
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                        <span>⚡ Ref: <strong>Pt 21 ({fields.typeOfStructure || 'RCC'})</strong></span>
                        {!isReadOnly && fields.ndmaHorizontalFloorType !== 'Beams and Slabs' && (
                          <button
                            type="button"
                            onClick={() => handleChange('ndmaHorizontalFloorType', 'Beams and Slabs')}
                            className="ml-1 text-indigo-600 hover:text-indigo-900 underline font-medium cursor-pointer"
                            title="Reset to Beams and Slabs"
                          >
                            ↺ Sync
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Beams and Slabs', 'Flat Slab', 'Precast Slab', 'Slab on Wall', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaHorizontalFloorType', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaHorizontalFloorType || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaHorizontalFloorType && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaHorizontalFloorType', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaHorizontalFloorType || ''}
                      onChange={(e) => handleChange('ndmaHorizontalFloorType', e.target.value)}
                      placeholder="e.g. Beams and Slabs"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 3. Seismic Zone */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Seismic Zone
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['Zone-II', 'Zone-III', 'Zone-IV', 'Zone-V', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaSeismicZone', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaSeismicZone || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaSeismicZone && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaSeismicZone', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaSeismicZone || ''}
                      onChange={(e) => handleChange('ndmaSeismicZone', e.target.value)}
                      placeholder="e.g. Zone-III"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 4. Steel Grade */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Steel Grade
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['FE - 415', 'FE - 450', 'FE - 500', 'FE - 550', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaSteelGrade', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaSteelGrade || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaSteelGrade && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaSteelGrade', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaSteelGrade || ''}
                      onChange={(e) => handleChange('ndmaSteelGrade', e.target.value)}
                      placeholder="e.g. FE - 450"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 5. Flood Prone Area */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Flood Prone Area
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['NO', 'YES', 'Low Risk', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaFloodProne', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaFloodProne || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaFloodProne && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaFloodProne', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaFloodProne || ''}
                      onChange={(e) => handleChange('ndmaFloodProne', e.target.value)}
                      placeholder="e.g. NO"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 6. Urban Floods */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Urban Floods
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['NO', 'YES', 'Low Risk', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaUrbanFloods', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaUrbanFloods || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaUrbanFloods && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaUrbanFloods', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaUrbanFloods || ''}
                      onChange={(e) => handleChange('ndmaUrbanFloods', e.target.value)}
                      placeholder="e.g. NO"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 7. Environment Exposure Condition */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Environment Exposure Condition
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['Mild', 'Moderate', 'Severe', 'Very Severe', 'Extreme'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaEnvironmentExposure', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaEnvironmentExposure || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaEnvironmentExposure && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaEnvironmentExposure', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaEnvironmentExposure || ''}
                      onChange={(e) => handleChange('ndmaEnvironmentExposure', e.target.value)}
                      placeholder="e.g. Mild"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 8. Soil Slope vulnerable to landslide */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Soil Slope vulnerable to landslide
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['Low Hazard Zone', 'Moderate Hazard', 'High Hazard', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaSoilSlopeLandslide', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaSoilSlopeLandslide || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaSoilSlopeLandslide && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaSoilSlopeLandslide', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaSoilSlopeLandslide || ''}
                      onChange={(e) => handleChange('ndmaSoilSlopeLandslide', e.target.value)}
                      placeholder="e.g. Low Hazard Zone"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 9. Wind / Cyclones */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Wind / Cyclones
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['Low Damage Risk Zone', 'Moderate Risk', 'High Damage Risk', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaWindCyclones', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaWindCyclones || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaWindCyclones && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaWindCyclones', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaWindCyclones || ''}
                      onChange={(e) => handleChange('ndmaWindCyclones', e.target.value)}
                      placeholder="e.g. Low Damage Risk Zone"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 10. Tsunami */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Tsunami
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['NO', 'YES', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaTsunami', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaTsunami || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaTsunami && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaTsunami', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaTsunami || ''}
                      onChange={(e) => handleChange('ndmaTsunami', e.target.value)}
                      placeholder="e.g. NO"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 11. Height of building above ground level */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="block text-xs font-semibold text-slate-800">
                        Height of building above ground level
                      </label>
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                        <span>⚡ Ref: <strong>Pt 26 Floor Levels</strong></span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleChange('ndmaHeightAboveGround', (fields.floors && fields.floors.length > 4) ? '15m - 30m' : 'Less Than 15m Tall')}
                            className="ml-1 text-indigo-600 hover:text-indigo-900 underline font-medium cursor-pointer"
                            title="Sync with Pt 26"
                          >
                            ↺ Sync
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Less Than 15m Tall', '15m - 30m', 'Above 30m', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaHeightAboveGround', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaHeightAboveGround || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaHeightAboveGround && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaHeightAboveGround', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaHeightAboveGround || ''}
                      onChange={(e) => handleChange('ndmaHeightAboveGround', e.target.value)}
                      placeholder="e.g. Less Than 15m Tall"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 12. Coastal Regulatory Zone (CRZ) */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Coastal Regulatory Zone (CRZ)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['NA', 'NO', 'YES', 'CRZ-I', 'CRZ-II', 'CRZ-III'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaCRZ', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaCRZ || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaCRZ && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaCRZ', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaCRZ || ''}
                      onChange={(e) => handleChange('ndmaCRZ', e.target.value)}
                      placeholder="e.g. NA"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 13. Nature of Building / Wing / Tower */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Nature of Building /Wing/Tower
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['Standalone Structure', 'Multi-Unit Building', 'Row House', 'Commercial Complex', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaNatureOfBuilding', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaNatureOfBuilding || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaNatureOfBuilding && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaNatureOfBuilding', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaNatureOfBuilding || ''}
                      onChange={(e) => handleChange('ndmaNatureOfBuilding', e.target.value)}
                      placeholder="e.g. Standalone Structure"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 14. Function of use */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="block text-xs font-semibold text-slate-800">
                        Function of use
                      </label>
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                        <span>⚡ Ref: <strong>Pt 1 ({fields.propertyType || fields.approvedUsage || 'Residential'})</strong></span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleChange('ndmaFunctionOfUse', fields.propertyType || fields.approvedUsage || 'Residential')}
                            className="ml-1 text-indigo-600 hover:text-indigo-900 underline font-medium cursor-pointer"
                            title="Sync with Pt 1"
                          >
                            ↺ Sync
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Residential', 'Commercial', 'Residential Cum Commercial', 'Industrial', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaFunctionOfUse', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaFunctionOfUse || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaFunctionOfUse && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaFunctionOfUse', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaFunctionOfUse || ''}
                      onChange={(e) => handleChange('ndmaFunctionOfUse', e.target.value)}
                      placeholder="e.g. Residential"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 15. Type of Foundation */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <label className="block text-xs font-semibold text-slate-800">
                      Type of Foundation
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {['Open Footing column', 'Isolated Footing', 'Raft Foundation', 'Pile Foundation', 'Strip Foundation', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaFoundationType', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaFoundationType || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaFoundationType && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaFoundationType', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaFoundationType || ''}
                      onChange={(e) => handleChange('ndmaFoundationType', e.target.value)}
                      placeholder="e.g. Open Footing column"
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* 16. Type of Structure */}
                  <div className="rounded-lg border border-slate-200/80 bg-slate-50/50 p-3 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <label className="block text-xs font-semibold text-slate-800">
                        Type of Structure
                      </label>
                      <div className="flex items-center gap-1.5 text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
                        <span>⚡ Ref: <strong>Pt 21 ({fields.typeOfStructure || 'RCC'})</strong></span>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleChange('ndmaStructureType', getNdmaStructureTypeForStructure(fields.typeOfStructure))}
                            className="ml-1 text-indigo-600 hover:text-indigo-900 underline font-medium cursor-pointer"
                            title="Sync with Pt 21"
                          >
                            ↺ Sync
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['RCC Framed Structure', 'Load Bearing Structure', 'Steel Structure', 'Composite Structure', 'NA'].map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('ndmaStructureType', opt)}
                          disabled={isReadOnly}
                          className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                            (fields.ndmaStructureType || '').toLowerCase() === opt.toLowerCase()
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      {!isReadOnly && fields.ndmaStructureType && (
                        <button
                          type="button"
                          onClick={() => handleChange('ndmaStructureType', '')}
                          className="text-[11px] px-1.5 py-0.5 rounded font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                          title="Clear value"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.ndmaStructureType || ''}
                      onChange={(e) => handleChange('ndmaStructureType', e.target.value)}
                      placeholder="e.g. RCC Framed Structure"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* 11. Annexure-A */}
            <Section number={11} id="sec-annexure-a" title="Annexure-A: Valuation Computation & Declaration">
              <div className="space-y-4">
                <Field label="Introduction Paragraph:">
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={fields.annexureIntro || ''}
                    onChange={(e) => handleChange('annexureIntro', e.target.value)}
                    placeholder="e.g. Based on inspection and documents submitted..."
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Description of Property:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.annexurePropertyDesc || ''}
                    onChange={(e) => handleChange('annexurePropertyDesc', e.target.value)}
                    placeholder="e.g. Residential Building over Plot No..."
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="List of Documents for Verification:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.annexureDocsVerified || ''}
                    onChange={(e) => handleChange('annexureDocsVerified', e.target.value)}
                    placeholder="e.g. Sale Deed, Approved Plan, ROR"
                    disabled={isReadOnly}
                  />
                </Field>

                {/* DRC Building Table */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    (B) Depreciated Replacement Cost (DRC) Table
                  </p>
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-xs">
                      <thead className="bg-slate-100 text-slate-700">
                        <tr>
                          <th className="p-2 text-left">Particulars</th>
                          <th className="p-2 text-left">Area (sqft)</th>
                          <th className="p-2 text-left">Year</th>
                          <th className="p-2 text-left">Life (Yrs)</th>
                          <th className="p-2 text-left">Cost (Rs.)</th>
                          <th className="p-2 text-left">GCRC</th>
                          <th className="p-2 text-left">Dep. %</th>
                          <th className="p-2 text-left">Value (Rs.)</th>
                          {!isReadOnly && <th className="p-2 w-10 text-center">Action</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {(fields.drcFloors || []).map((df, idx) => (
                          <tr key={idx}>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.particulars || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'particulars', e.target.value)}
                                placeholder="e.g. Ground Floor"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.area || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'area', sanitizePositiveFloat(e.target.value))}
                                placeholder="e.g. 850"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.yearOfConst || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'yearOfConst', sanitizePositiveInt(e.target.value, 4))}
                                placeholder="e.g. 2020"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.lifeInYrs || '10'}
                                onChange={(e) => handleDRCFloorChange(idx, 'lifeInYrs', sanitizePositiveInt(e.target.value, 3))}
                                placeholder="e.g. 10"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.costOfConst || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'costOfConst', sanitizePositiveFloat(e.target.value))}
                                placeholder="e.g. 1800"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.gcrc || 'No'}
                                onChange={(e) => handleDRCFloorChange(idx, 'gcrc', e.target.value)}
                                placeholder="e.g. No"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.depreciation || '50'}
                                onChange={(e) => handleDRCFloorChange(idx, 'depreciation', sanitizePercentage(e.target.value))}
                                placeholder="e.g. 50"
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="p-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={df.value || ''}
                                onChange={(e) => handleDRCFloorChange(idx, 'value', sanitizePositiveFloat(e.target.value))}
                                placeholder="Net Value"
                                disabled={isReadOnly}
                              />
                            </td>
                            {!isReadOnly && (
                              <td className="p-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeDRCRow(idx)}
                                  className="text-red-500 hover:text-red-700 font-bold px-2 py-1"
                                >
                                  ×
                                </button>
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
                      onClick={addDRCRow}
                      className="mt-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-3 py-1.5 rounded border border-slate-300"
                    >
                      + Add DRC Row
                    </button>
                  )}
                </div>

                {/* Valuer Credentials & Sign-off */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <Field label="Valuer Name:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.valuerSignatureName || 'S. MOHANTY & ASSOCIATES'}
                      onChange={(e) => handleChange('valuerSignatureName', e.target.value)}
                      placeholder="e.g. S. MOHANTY & ASSOCIATES"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Qualifications:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.valuerQualification || 'B.Tech (Civil), M.Val (RE)'}
                      onChange={(e) => handleChange('valuerQualification', e.target.value)}
                      placeholder="e.g. B.Tech (Civil), M.Val (RE)"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="IOV Reg. No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.valuerIovRegNo || '107/2016-17, CAT-1'}
                      onChange={(e) => handleChange('valuerIovRegNo', e.target.value)}
                      placeholder="e.g. 107/2016-17, CAT-1"
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Wealth Tax Reg. No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.valuerWealthTaxRegNo || 'CCIT/BBSR/Tech-10/2017-18'}
                      onChange={(e) => handleChange('valuerWealthTaxRegNo', e.target.value)}
                      placeholder="e.g. CCIT/BBSR/Tech-10/2017-18"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 12. Documents & Maps */}
            <Section number={12} id="sec-docs" title="Maps & Document Enclosures">
              <div className="space-y-6">
                {/* Enclosure 1: ROR Document */}
                <div className="space-y-3 p-4 border border-[#dee2e6] rounded-2xl bg-white shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📜</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                        Enclosure 1: ROR (Record of Rights) {fields.rorImageUrl ? '(Uploaded)' : ''}
                      </h4>
                    </div>
                    {!isReadOnly && (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent-500 text-accent-500 text-xs font-semibold cursor-pointer hover:bg-accent-500/10 transition-all shadow-2xs">
                        {fields.rorImageUrl ? '🔄 Replace ROR Document' : '+ Add ROR Document'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleEnclosureUpload('rorImageUrl', e)}
                          disabled={isReadOnly}
                        />
                      </label>
                    )}
                  </div>

                  {fields.rorImageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex flex-col items-center">
                      <img
                        src={fields.rorImageUrl}
                        alt="ROR Document"
                        className="max-h-80 w-auto object-contain rounded-lg border border-slate-200 shadow-xs"
                      />
                      {!isReadOnly && (
                        <div className="flex justify-end w-full pt-2">
                          <button
                            type="button"
                            onClick={() => handleChange('rorImageUrl', '')}
                            className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                          >
                            ✕ Remove ROR Document
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-accent-500/50 rounded-xl bg-slate-50/50 cursor-pointer transition-colors">
                      <span className="text-2xl mb-1">📄</span>
                      <span className="text-xs font-semibold text-slate-700">No ROR document uploaded</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Click to browse or drag and drop image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleEnclosureUpload('rorImageUrl', e)}
                        disabled={isReadOnly}
                      />
                    </label>
                  )}
                </div>

                {/* Enclosure 2: GPS Location Map */}
                <div className="space-y-4 p-4 border border-[#dee2e6] rounded-2xl bg-white shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🛰️</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                        Enclosure 2: GPS Location Map &amp; Satellite Preview
                      </h4>
                    </div>
                    {!isReadOnly && (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent-500 text-accent-500 text-xs font-semibold cursor-pointer hover:bg-accent-500/10 transition-all shadow-2xs">
                        {fields.locationMapImageUrl ? '🔄 Replace Map Screenshot' : '+ Add Map Screenshot'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleEnclosureUpload('locationMapImageUrl', e)}
                          disabled={isReadOnly}
                        />
                      </label>
                    )}
                  </div>

                  {/* Live Satellite Preview */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Live Satellite &amp; Coordinate Preview
                    </div>

                    {(() => {
                      const cleanLat = (fields.latitude || '').trim();
                      const cleanLng = (fields.longitude || '').trim();
                      const hasCoordinates = Boolean(cleanLat && cleanLng && !isNaN(Number(cleanLat)) && !isNaN(Number(cleanLng)));
                      const cleanTechnicalAddress = (fields.legalAddress || '').trim();
                      const cleanPropertyAddress = (fields.propertyAddress || '').trim();
                      const effectiveAddress = cleanTechnicalAddress || cleanPropertyAddress;
                      const queryParam = hasCoordinates ? `${cleanLat},${cleanLng}` : effectiveAddress;
                      const encodedQuery = encodeURIComponent(queryParam);
                      const hasQuery = hasCoordinates || effectiveAddress.length > 0;
                      const googleMapsUrl = hasCoordinates
                        ? `https://www.google.com/maps?q=${cleanLat},${cleanLng}&z=17&t=k`
                        : `https://www.google.com/maps/search/${encodeURIComponent(effectiveAddress)}`;

                      return hasQuery ? (
                        <div className="rounded-xl overflow-hidden border border-[#c8d6e5] shadow-xs">
                          <div className="bg-[#d5e8f5] px-3.5 py-1.5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider flex items-center gap-1.5">
                                📍 Live Pin {hasCoordinates ? `(${cleanLat}, ${cleanLng})` : `— ${cleanTechnicalAddress ? 'Legal Address' : 'Property Address'}`}
                              </span>
                            </div>
                            <a
                              href={googleMapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-accent-500 hover:underline"
                            >
                              Open in Google Maps ↗
                            </a>
                          </div>
                          <iframe
                            src={`https://maps.google.com/maps?q=${encodedQuery}&t=k&z=17&output=embed`}
                            width="100%"
                            height="260"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Property Location Map"
                          />
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                          Enter property address in section 2 or input GPS coordinates below to view live satellite map preview.
                        </div>
                      );
                    })()}

                    {/* Coordinates input block */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 space-y-2 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0f2038] flex items-center gap-1.5">
                          🧭 GPS Coordinates Entry
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Input latitude &amp; longitude to set precise map pin
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Field label="Latitude (DD):">
                          <input
                            type="text"
                            className={inputCls}
                            placeholder="e.g. 20.2961"
                            value={fields.latitude || ''}
                            onChange={(e) => handleChange('latitude', sanitizePositiveFloat(e.target.value))}
                            disabled={isReadOnly}
                          />
                        </Field>
                        <Field label="Longitude (DD):">
                          <input
                            type="text"
                            className={inputCls}
                            placeholder="e.g. 85.8245"
                            value={fields.longitude || ''}
                            onChange={(e) => handleChange('longitude', sanitizePositiveFloat(e.target.value))}
                            disabled={isReadOnly}
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Satellite Screenshot for PDF */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Screenshot for PDF Report
                    </div>
                    {fields.locationMapImageUrl ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex flex-col items-center">
                        <img
                          src={fields.locationMapImageUrl}
                          alt="GPS Location Map Screenshot"
                          className="max-h-72 w-auto object-contain rounded-lg border border-slate-200 shadow-xs"
                        />
                        {!isReadOnly && (
                          <div className="flex justify-end w-full pt-2">
                            <button
                              type="button"
                              onClick={() => handleChange('locationMapImageUrl', '')}
                              className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                            >
                              ✕ Remove Screenshot
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-200 hover:border-accent-500/50 rounded-xl bg-slate-50/50 cursor-pointer transition-colors">
                        <span className="text-xl mb-1">🛰️</span>
                        <span className="text-xs font-semibold text-slate-700">No static location map screenshot uploaded</span>
                        <span className="text-[11px] text-slate-400 mt-0.5">Capture or upload screenshot of Google Satellite Map for PDF</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleEnclosureUpload('locationMapImageUrl', e)}
                          disabled={isReadOnly}
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* Enclosure 4: Bhu Naksha / Cadastral Map */}
                <div className="space-y-3 p-4 border border-[#dee2e6] rounded-2xl bg-white shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🗺️</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                        Enclosure 4: Bhu Naksha / Cadastral Map {fields.bhuNakshaImageUrl ? '(Uploaded)' : ''}
                      </h4>
                    </div>
                    {!isReadOnly && (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent-500 text-accent-500 text-xs font-semibold cursor-pointer hover:bg-accent-500/10 transition-all shadow-2xs">
                        {fields.bhuNakshaImageUrl ? '🔄 Replace Bhu Naksha' : '+ Add Bhu Naksha Map'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleEnclosureUpload('bhuNakshaImageUrl', e)}
                          disabled={isReadOnly}
                        />
                      </label>
                    )}
                  </div>

                  {fields.bhuNakshaImageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex flex-col items-center">
                      <img
                        src={fields.bhuNakshaImageUrl}
                        alt="Bhu Naksha Map"
                        className="max-h-80 w-auto object-contain rounded-lg border border-slate-200 shadow-xs"
                      />
                      {!isReadOnly && (
                        <div className="flex justify-end w-full pt-2">
                          <button
                            type="button"
                            onClick={() => handleChange('bhuNakshaImageUrl', '')}
                            className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                          >
                            ✕ Remove Bhu Naksha
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-accent-500/50 rounded-xl bg-slate-50/50 cursor-pointer transition-colors">
                      <span className="text-2xl mb-1">🗺️</span>
                      <span className="text-xs font-semibold text-slate-700">No Bhu Naksha cadastral map uploaded</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Click to browse or drag and drop image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleEnclosureUpload('bhuNakshaImageUrl', e)}
                        disabled={isReadOnly}
                      />
                    </label>
                  )}
                </div>

                {/* Enclosure 5: Guideline Value Proof (Annexure-C) */}
                <div className="space-y-3 p-4 border border-[#dee2e6] rounded-2xl bg-white shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📑</span>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider font-sans">
                        Enclosure 5 / Annexure-C: Guideline Value Proof {fields.guidelineValueImageUrl ? '(Uploaded)' : ''}
                      </h4>
                    </div>
                    {!isReadOnly && (
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-accent-500 text-accent-500 text-xs font-semibold cursor-pointer hover:bg-accent-500/10 transition-all shadow-2xs">
                        {fields.guidelineValueImageUrl ? '🔄 Replace Guideline Proof' : '+ Add Guideline Proof'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleEnclosureUpload('guidelineValueImageUrl', e)}
                          disabled={isReadOnly}
                        />
                      </label>
                    )}
                  </div>

                  {fields.guidelineValueImageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 flex flex-col items-center">
                      <img
                        src={fields.guidelineValueImageUrl}
                        alt="Guideline Value Proof"
                        className="max-h-80 w-auto object-contain rounded-lg border border-slate-200 shadow-xs"
                      />
                      {!isReadOnly && (
                        <div className="flex justify-end w-full pt-2">
                          <button
                            type="button"
                            onClick={() => handleChange('guidelineValueImageUrl', '')}
                            className="px-3 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                          >
                            ✕ Remove Guideline Proof
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 hover:border-accent-500/50 rounded-xl bg-slate-50/50 cursor-pointer transition-colors">
                      <span className="text-2xl mb-1">📑</span>
                      <span className="text-xs font-semibold text-slate-700">No guideline value proof uploaded</span>
                      <span className="text-[11px] text-slate-400 mt-0.5">Click to browse or drag and drop image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleEnclosureUpload('guidelineValueImageUrl', e)}
                        disabled={isReadOnly}
                      />
                    </label>
                  )}
                </div>
              </div>
            </Section>

            {/* 13. Property Photographs */}
            <BasePhotographsSection
              title="Property Photographs"
              sectionNumber={13}
              sectionId="sec-photos"
              propertyImages={propertyImages}
              propertyImageNames={propertyImageNames}
              isReadOnly={isReadOnly}
              uploading={saving}
              bucketCount={bucketImages?.length || 0}
              onOpenBucketPicker={() => setShowBucketModal(true)}
              onUploadImages={handleUploadMultiplePhotos}
              onRemoveImage={handlePhotoRemove}
              onImageNameChange={handlePhotoRename}
              onReorderImages={handlePhotoReorder}
              defaultOpen={true}
            />

        {/* STANDARDIZED ACTION BAR (DOCKED AT BOTTOM OF MAIN CONTENT) */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={saving || submitting}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>

      {/* Floating Section Navigator on the Right Side */}
      <FloatingNavigator sections={NAV_SECTIONS} />

      {/* Cloud Bucket Selection Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            const addedNames = selectedUrls.map((_, i) => `Photograph ${propertyImages.length + i + 1}`);
            const mergedImgs = [...propertyImages, ...selectedUrls];
            const mergedNames = [...propertyImageNames, ...addedNames];
            const mergedPhotos = mergedImgs.map((url, idx) => ({
              url,
              caption: mergedNames[idx] || `Photograph ${idx + 1}`,
            }));
            setFields((prev) => ({
              ...prev,
              propertyImages: mergedImgs,
              propertyImageNames: mergedNames,
              propertyPhotos: mergedPhotos,
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
