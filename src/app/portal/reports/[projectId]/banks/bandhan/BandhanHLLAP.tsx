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

const NAV_SECTIONS: NavItem[] = [
  { id: 'sec-basic', title: '1. Basic & Loan Details' },
  { id: 'sec-address', title: '2. Location & Address' },
  { id: 'sec-boundaries', title: '3. Boundaries Verification' },
  { id: 'sec-class', title: '4. Property Classification' },
  { id: 'sec-approvals', title: '5. Approval & Plan Details' },
  { id: 'sec-floors', title: '6. Floor Areas & Setbacks' },
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
      valuationGovtRate: raw.valuationGovtRate || '',
      distressSaleValue: raw.distressSaleValue || '',
      realisableValue: raw.realisableValue || '',
      dateCommencementCompletion: raw.dateCommencementCompletion || '',
      areaOfLand: raw.areaOfLand || '',
      expectedCostOfProject: raw.expectedCostOfProject || '',

      // 8. Progress of Work (34)
      progressStructureHeader: raw.progressStructureHeader || '',
      progressFoundation: raw.progressFoundation || '',
      progressRCC: raw.progressRCC || '',
      progressBR: raw.progressBR || '',
      progressPlastering: raw.progressPlastering || '',
      progressFlooring: raw.progressFlooring || '',
      progressDoorsWindows: raw.progressDoorsWindows || '',
      progressElectricalSanitary: raw.progressElectricalSanitary || '',
      progressPainting: raw.progressPainting || '',
      progressTotalPct: raw.progressTotalPct || '',
      progressRecommendationPct: raw.progressRecommendationPct || '',

      // 9. NDMA Parameters (41)
      ndmaConcreteGrade: raw.ndmaConcreteGrade || 'M25',
      ndmaHorizontalFloorType: raw.ndmaHorizontalFloorType || 'Beams and Slabs',
      ndmaSeismicZone: raw.ndmaSeismicZone || 'Zone-III',
      ndmaSteelGrade: raw.ndmaSteelGrade || 'FE - 450',
      ndmaFloodProne: raw.ndmaFloodProne || 'NO',
      ndmaUrbanFloods: raw.ndmaUrbanFloods || 'NO',
      ndmaEnvironmentExposure: raw.ndmaEnvironmentExposure || 'Mild',
      ndmaSoilSlopeLandslide: raw.ndmaSoilSlopeLandslide || 'Low Hazard Zone',
      ndmaWindCyclones: raw.ndmaWindCyclones || 'Low Damage Risk Zone',
      ndmaTsunami: raw.ndmaTsunami || 'NO',
      ndmaHeightAboveGround: raw.ndmaHeightAboveGround || 'Less Than 15m Tall',
      ndmaCRZ: raw.ndmaCRZ || 'NA',
      ndmaNatureOfBuilding: raw.ndmaNatureOfBuilding || 'Standalone Structure',
      ndmaFunctionOfUse: raw.ndmaFunctionOfUse || 'Residential',
      ndmaFoundationType: raw.ndmaFoundationType || 'Open Footing column',
      ndmaStructureType: raw.ndmaStructureType || getNdmaStructureTypeForStructure(raw.typeOfStructure || 'RCC'),

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
      const curLand = parseNum(next.netValueLand || prev.netValueLand) || calculatedLandVal;
      const curBldg = parseNum(next.netValueBuilding || prev.netValueBuilding) || totalBldgVal;
      const curSum = curLand + curBldg;
      const flatAreaVal = (parseNum(fields.rateOfFlat) > 0 && parseNum(fields.areaOfFlat) > 0)
        ? (parseNum(fields.rateOfFlat) * parseNum(fields.areaOfFlat))
        : 0;
      const finalPropertyValue = flatAreaVal > 0 ? flatAreaVal : curSum;

      if (curSum > 0) {
        const netPropStr = `Rs.${formatCurrencyINR(curSum)}/-`;
        if (prev.netValueOfProperty !== netPropStr) {
          next.netValueOfProperty = netPropStr;
          changed = true;
        }
      }

      if (finalPropertyValue > 0) {
        const finalStr = `Rs.${formatCurrencyINR(finalPropertyValue)}/-`;
        const distStr = `Rs.${formatCurrencyINR(Math.round(finalPropertyValue * 0.90))}/-`;
        const realStr = `Rs.${formatCurrencyINR(Math.round(finalPropertyValue * 0.95))}/-`;
        const sumMktStr = formatCurrencyINR(finalPropertyValue);
        const sumWords = formatIndianCurrency(finalPropertyValue);

        if (prev.recommendedValueOfProperty !== finalStr) {
          next.recommendedValueOfProperty = finalStr;
          changed = true;
        }
        if (prev.totalMarketValue !== finalStr) {
          next.totalMarketValue = finalStr;
          changed = true;
        }
        if (prev.valuationAsOnDate !== finalStr) {
          next.valuationAsOnDate = finalStr;
          changed = true;
        }
        if (prev.summaryMarketValue !== sumMktStr) {
          next.summaryMarketValue = sumMktStr;
          changed = true;
        }
        if (prev.summaryMarketValueWords !== sumWords) {
          next.summaryMarketValueWords = sumWords;
          changed = true;
        }
        if (prev.distressSaleValue !== distStr) {
          next.distressSaleValue = distStr;
          changed = true;
        }
        if (prev.realisableValue !== realStr) {
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
                    <Field label="25. Copy of sanctioned plan provided. Plan No:">
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
                <Field label="26. Total Land / Property Area:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyArea || ''}
                    onChange={(e) => handleChange('propertyArea', e.target.value)}
                    placeholder="e.g. 1500.00 sq.ft"
                    disabled={isReadOnly}
                  />
                </Field>

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
                <div className="sm:col-span-2">
                  <Field label="30. Recommended Valuation of the Property (Land Component Formula):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.recommendedValuationFormula || ''}
                      onChange={(e) => handleChange('recommendedValuationFormula', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
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

                {/* 32. Cost of Construction & Depreciation */}
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 sm:p-5 shadow-xs space-y-3.5 sm:col-span-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
                    <span className="font-sans font-semibold text-amber-900 text-xs sm:text-sm">
                      32. Recommended Rate of Cost of Construction &amp; Depreciation
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <Field label="Rate of Cost of Construction (Rs./sqft):">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.rateOfCostOfConstruction || ''}
                        onChange={(e) => handleChange('rateOfCostOfConstruction', sanitizePositiveFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="Depreciation of Construction:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.depreciationOfConstruction || ''}
                        onChange={(e) => handleChange('depreciationOfConstruction', sanitizePercentage(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                {/* 33. Net Value of Property & Flat Valuation */}
                <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 sm:p-5 shadow-xs space-y-3.5 sm:col-span-2">
                  <div className="flex items-center gap-2 pb-2 border-b border-emerald-200/60">
                    <span className="font-sans font-semibold text-emerald-900 text-xs sm:text-sm">
                      33. Net Value of Property &amp; Valuation Breakdown
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Net Value of Property (Land + Building) - Divided into Land + Building = Total */}
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Net Value of Property (Land + Building):
                      </label>
                      <div className="rounded-lg border border-emerald-200/80 bg-emerald-50/50 p-3 sm:p-3.5 space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-11 gap-2 items-center">
                          <div className="sm:col-span-4">
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

                          <div className="sm:col-span-2">
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
                    <Field label="Recommended Value of the Property:">
                      <div className="relative">
                        <input
                          type="text"
                          className={`${inputCls} bg-slate-100/90 text-slate-800 font-bold cursor-not-allowed`}
                          value={fields.recommendedValueOfProperty || ''}
                          readOnly
                          disabled
                        />
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">Auto Rs.</span>
                        </div>
                      </div>
                    </Field>
                    <Field label="Total Market Value of Existing Property:">
                      <div className="relative">
                        <input
                          type="text"
                          className={`${inputCls} bg-slate-100/90 text-slate-800 font-bold cursor-not-allowed`}
                          value={fields.totalMarketValue || ''}
                          readOnly
                          disabled
                        />
                        <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                          <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded border border-emerald-200">Auto Rs.</span>
                        </div>
                      </div>
                    </Field>
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
                      onChange={(e) => handleChange('progressFoundation', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label={`${getWorkProgressStructureLabel(fields.typeOfStructure)}: (⚡ Auto-labeled from Pt 21)`}>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressRCC || ''}
                      onChange={(e) => handleChange('progressRCC', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Brick Work (BR):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressBR || ''}
                      onChange={(e) => handleChange('progressBR', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Plastering:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressPlastering || ''}
                      onChange={(e) => handleChange('progressPlastering', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Flooring:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressFlooring || ''}
                      onChange={(e) => handleChange('progressFlooring', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Doors & Windows:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressDoorsWindows || ''}
                      onChange={(e) => handleChange('progressDoorsWindows', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Electrical, Sanitary & Plumbing:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressElectricalSanitary || ''}
                      onChange={(e) => handleChange('progressElectricalSanitary', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Painting:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressPainting || ''}
                      onChange={(e) => handleChange('progressPainting', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Progress of Work (%):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressTotalPct || ''}
                      onChange={(e) => handleChange('progressTotalPct', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Recommendation (%):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.progressRecommendationPct || ''}
                      onChange={(e) => handleChange('progressRecommendationPct', sanitizePercentage(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 9. Final Valuation Summary & Project Details */}
            <Section number={9} id="sec-final-valuation" title="Final Valuation Summary & Project Details (Points 35–40)">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="35. Valuation of the property as on date:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuationAsOnDate || ''}
                    onChange={(e) => handleChange('valuationAsOnDate', e.target.value)}
                    placeholder="e.g. Rs.2,59,72,000/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="36. Valuation as per govt. rates (Land):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuationGovtRate || ''}
                    onChange={(e) => handleChange('valuationGovtRate', e.target.value)}
                    placeholder="e.g. Rs.286/- Per sqft * 10,890sqft. = Rs.31,14,540/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="37. Distress sale value:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distressSaleValue || ''}
                    onChange={(e) => handleChange('distressSaleValue', e.target.value)}
                    placeholder="e.g. Rs.2,33,74,800/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Realizable Value:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.realisableValue || ''}
                    onChange={(e) => handleChange('realisableValue', e.target.value)}
                    placeholder="e.g. Rs.2,46,73,400/-"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="38. Date of project commencement & date of expected project completion:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dateCommencementCompletion || ''}
                    onChange={(e) => handleChange('dateCommencementCompletion', e.target.value)}
                    placeholder="e.g. NA or Started: 2020, Completed: 2022"
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="39. Area of land:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.areaOfLand || fields.propertyArea || ''}
                    onChange={(e) => handleChange('areaOfLand', e.target.value)}
                    placeholder="e.g. (AC.0.250Decs) i.e. 10,890sqft."
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="40. Expected cost of the project:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.expectedCostOfProject || ''}
                      onChange={(e) => handleChange('expectedCostOfProject', e.target.value)}
                      placeholder="e.g. NA or Rs. 25,00,000/-"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 10. NDMA Parameters */}
            <Section number={10} id="sec-ndma" title="NDMA Disaster Management Parameters (Point 41)">
              <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs bg-white">
                <table className="w-full text-xs border-collapse">
                  <tbody className="divide-y divide-slate-200">
                    {/* Row 1 */}
                    <tr className="divide-x divide-slate-200">
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Concrete Grade
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaConcreteGrade || 'M25'}
                          onChange={(e) => handleChange('ndmaConcreteGrade', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Horizontal floor type
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaHorizontalFloorType || 'Beams and Slabs'}
                          onChange={(e) => handleChange('ndmaHorizontalFloorType', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    {/* Row 2 */}
                    <tr className="divide-x divide-slate-200">
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Seismic Zone
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaSeismicZone || 'Zone-III'}
                          onChange={(e) => handleChange('ndmaSeismicZone', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Steel Grade
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaSteelGrade || 'FE - 450'}
                          onChange={(e) => handleChange('ndmaSteelGrade', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    {/* Row 3 */}
                    <tr className="divide-x divide-slate-200">
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Flood Prone Area
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaFloodProne || 'NO'}
                          onChange={(e) => handleChange('ndmaFloodProne', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Urban Floods
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaUrbanFloods || 'NO'}
                          onChange={(e) => handleChange('ndmaUrbanFloods', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    {/* Row 4 */}
                    <tr className="divide-x divide-slate-200">
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Environment Exposure Condition
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaEnvironmentExposure || 'Mild'}
                          onChange={(e) => handleChange('ndmaEnvironmentExposure', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Soil Slope vulnerable to landslide
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaSoilSlopeLandslide || 'Low Hazard Zone'}
                          onChange={(e) => handleChange('ndmaSoilSlopeLandslide', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    {/* Row 5 */}
                    <tr className="divide-x divide-slate-200">
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Wind / Cyclones
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaWindCyclones || 'Low Damage Risk Zone'}
                          onChange={(e) => handleChange('ndmaWindCyclones', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Tsunami
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaTsunami || 'NO'}
                          onChange={(e) => handleChange('ndmaTsunami', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    {/* Row 6 */}
                    <tr className="divide-x divide-slate-200">
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Height of building above ground level
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaHeightAboveGround || 'Less Than 15m Tall'}
                          onChange={(e) => handleChange('ndmaHeightAboveGround', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Coastal Regulatory Zone (CRZ)
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaCRZ || 'NA'}
                          onChange={(e) => handleChange('ndmaCRZ', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    {/* Row 7 */}
                    <tr className="divide-x divide-slate-200">
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Nature of Building /Wing/Tower
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaNatureOfBuilding || 'Standalone Structure'}
                          onChange={(e) => handleChange('ndmaNatureOfBuilding', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Function of use
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaFunctionOfUse || 'Residential'}
                          onChange={(e) => handleChange('ndmaFunctionOfUse', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    {/* Row 8 */}
                    <tr className="divide-x divide-slate-200">
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        Type of Foundation
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.ndmaFoundationType || 'Open Footing column'}
                          onChange={(e) => handleChange('ndmaFoundationType', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="w-1/4 p-2.5 bg-slate-50/90 font-medium text-slate-800 align-middle">
                        <div className="space-y-0.5">
                          <div>Type of Structure</div>
                          <div className="text-[10px] text-indigo-600 font-normal">
                            (⚡ Auto-derived from Pt 21: {fields.typeOfStructure || 'RCC'})
                          </div>
                        </div>
                      </td>
                      <td className="w-1/4 p-2 align-middle">
                        <div className="space-y-1">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields.ndmaStructureType || getNdmaStructureTypeForStructure(fields.typeOfStructure)}
                            onChange={(e) => handleChange('ndmaStructureType', e.target.value)}
                            disabled={isReadOnly}
                          />
                          {!isReadOnly && fields.ndmaStructureType && fields.ndmaStructureType !== getNdmaStructureTypeForStructure(fields.typeOfStructure) && (
                            <button
                              type="button"
                              onClick={() => handleChange('ndmaStructureType', getNdmaStructureTypeForStructure(fields.typeOfStructure))}
                              className="text-[10px] text-indigo-600 hover:text-indigo-900 underline font-medium cursor-pointer"
                              title="Sync with Point 21"
                            >
                              ↺ Sync with Pt 21 ({getNdmaStructureTypeForStructure(fields.typeOfStructure)})
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
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
