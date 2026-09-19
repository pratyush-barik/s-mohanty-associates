'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  fetchBytes,
  getFloorName,
} from '../BaseBankReportComponents';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import { BankConfig } from '@/lib/bank-fields';
import { decodeHtmlEntitiesDeep } from '@/lib/html-entities';
import {
  PDFAxisAgriRenderer,
  AxisAgriReportFields,
  AxisAgriFloorItem,
} from '@/lib/banks/pdf-axis-agri-renderer';

export const AXIS_AGRI_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'AGRI',
  displayName: 'Axis Bank — AGRI (Non-Agri Format)',
  defaultValues: {
    purpose: 'Valuation of Property for Credit Facilities',
  },
};

export interface AxisAgriProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole: string;
  bucketImages?: any[];
  prefill?: any;
  onResetWizard?: () => void;
}

const sanitizePositiveFloat = (val: string): string => {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.toUpperCase() === 'NA') return '';
  let cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

const sanitizePositiveInt = (val: string): string => {
  if (!val) return '';
  return val.replace(/[^0-9]/g, '');
};

const sanitizePincode = (val: string): string => {
  if (!val) return '';
  return val.replace(/[^0-9]/g, '').slice(0, 6);
};

const parseNum = (v: any): number => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

const formatSaleableArea = (land?: string, bldg?: string, raw?: string): string => {
  const lNum = parseNum(land);
  const bNum = parseNum(bldg);

  const parts: string[] = [];
  if (land && land.trim() && lNum > 0) {
    const lStr = lNum.toFixed(2);
    parts.push(`${lStr} Sft (Land)`);
  }
  if (bldg && bldg.trim() && bNum > 0) {
    const bStr = bNum.toFixed(2);
    parts.push(`${bStr} Sft (Building)`);
  }

  if (parts.length > 0) {
    return parts.join(' & ');
  }
  return raw || '';
};

export default function AxisAGRI({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: AxisAgriProps) {
  const router = useRouter();
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');

  // ── Auto-derive default REF NO: from projectCode or projectId ──
  const defaultRefNo = useMemo(() => {
    return projectCode || projectId || '';
  }, [projectCode, projectId]);

  // ── Find First Field Engineer Visit Date (Earliest Initiation) ──
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

  // ── Initial State Pre-fill ──
  const initialData: AxisAgriReportFields = useMemo(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : {};
    return {
      ...raw,
      clientType: raw.clientType || 'organisation',
      organisationTemplate: raw.organisationTemplate || 'AXIS BANK',
      organisationSubTemplate: raw.organisationSubTemplate || 'AGRI',
      bankName: raw.bankName || 'AXIS BANK',

      // Page 1: Header
      refNo: raw.refNo || defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || raw.dateOfReportSubmission || new Date()),
      reportTitle: raw.reportTitle || 'VALUATION REPORT FORMAT (NON-AGRI)',
      dateOfVisit: raw.dateOfVisit
        ? formatReportDate(raw.dateOfVisit)
        : (firstFieldAgentVisit?.dateStr || formatReportDate(raw.dateOfInspection || prefill?.inspectionDate || new Date())),
      reportInitiatedByArea: raw.reportInitiatedByArea || prefill?.serviceRequest?.branch || prefill?.branch || '',
      nameOfArea: raw.nameOfArea || '',
      ownerNameAndAddress: raw.ownerNameAndAddress || prefill?.contactName || '',
      borrowerNameAndAddress: raw.borrowerNameAndAddress || '',
      proposalNo: raw.proposalNo || '',
      representativeNameMobile: raw.representativeNameMobile || '',

      // Page 1: Details of Property Being Valued
      locationOfProperty: raw.locationOfProperty || '',
      documentsProvided: raw.documentsProvided || [],
      plotKhataDetails: raw.plotKhataDetails || prefill?.propertyAddress || '',
      roadFacilityAtSite: raw.roadFacilityAtSite || '',
      colonyNagarSector: raw.colonyNagarSector || '',
      localityLandmark: raw.localityLandmark || '',
      villageTownCityMarket: raw.villageTownCityMarket || '',
      district: raw.district || '',
      state: raw.state || '',
      pincode: raw.pincode || '',
      distanceFromAreaOffice: raw.distanceFromAreaOffice || '',
      latitude: raw.latitude || '',
      longitude: raw.longitude || '',
      coordinates: raw.coordinates || '',

      // Page 1 & 2: Classification & Site Topography
      typeOfPropertyPlot: raw.typeOfPropertyPlot || '',
      levelOfLand: raw.levelOfLand || '',
      situatedInMunicipalLimit: raw.situatedInMunicipalLimit || '',
      municipalLimitDetails: raw.municipalLimitDetails || '',
      constructionObservedOnPlot: raw.constructionObservedOnPlot || '',
      residentialPropertyType: raw.residentialPropertyType || '',
      residentialPropertySubtype: raw.residentialPropertySubtype || '',
      civicAmenities: raw.civicAmenities || '',
      commercialPropertyType: raw.commercialPropertyType || '',
      commercialPropertySubtype: raw.commercialPropertySubtype || '',
      availabilityLocalTransport: raw.availabilityLocalTransport || [],
      distanceFromRailwayStation: raw.distanceFromRailwayStation || '',
      busStopTaxiStand: raw.busStopTaxiStand || '',
      independentApproachRoad: raw.independentApproachRoad || '',
      accommodateFireExtinguisher: raw.accommodateFireExtinguisher || '',
      landLockedArea: raw.landLockedArea || '',
      corneredOrIntermittent: raw.corneredOrIntermittent || '',
      corneredOrIntermittentVal: raw.corneredOrIntermittentVal || '',

      // Page 2: Boundaries
      boundaryEastVerification: raw.boundaryEastVerification || '',
      boundaryEastDocument: raw.boundaryEastDocument || '',
      boundaryWestVerification: raw.boundaryWestVerification || '',
      boundaryWestDocument: raw.boundaryWestDocument || '',
      boundaryNorthVerification: raw.boundaryNorthVerification || '',
      boundaryNorthDocument: raw.boundaryNorthDocument || '',
      boundarySouthVerification: raw.boundarySouthVerification || '',
      boundarySouthDocument: raw.boundarySouthDocument || '',

      // Page 2: Locality & Usage
      classOfLocality: raw.classOfLocality || '',
      qualityOfInfrastructure: raw.qualityOfInfrastructure || '',
      ownershipStatus: raw.ownershipStatus || '',
      approvedUsage: raw.approvedUsage || [],
      actualUsage: raw.actualUsage || [],
      restrictiveCovenants: raw.restrictiveCovenants || '',
      typeOfStructure: raw.typeOfStructure || '',
      noOfFloors: raw.noOfFloors || '',
      occupancyDetails: raw.occupancyDetails || '',
      tenantName: raw.tenantName || '',
      yearsInTenancy: raw.yearsInTenancy || '',
      resistanceForValuation: raw.resistanceForValuation || '',
      resistanceFromOccupants: raw.resistanceFromOccupants || '',
      basicAmenities: raw.basicAmenities || [],
      developmentSurroundingArea: raw.developmentSurroundingArea || '',

      // Page 2: Leasehold
      isLeasehold: raw.isLeasehold || '',
      lessorName: raw.lessorName || '',
      natureOfLease: raw.natureOfLease || '',
      totalPeriodOfLease: raw.totalPeriodOfLease || '',
      leaseholdOccupantsResistance: raw.leaseholdOccupantsResistance || '',
      leaseholdBasicAmenities: raw.leaseholdBasicAmenities || [],
      leaseholdDevelopment: raw.leaseholdDevelopment || '',

      // Page 2 & 3: Approvals
      reraRegNo: raw.reraRegNo || '',
      occupancyCertificate: raw.occupancyCertificate || '',
      layoutApprovalNo: raw.layoutApprovalNo || '',
      layoutApprovalDate: raw.layoutApprovalDate || '',
      layoutExpiryDate: raw.layoutExpiryDate || '',
      buildingPlanApprovalNo: raw.buildingPlanApprovalNo || '',
      buildingPlanApprovalDate: raw.buildingPlanApprovalDate || '',
      buildingPlanExpiryDate: raw.buildingPlanExpiryDate || '',

      // Page 3: Construction & Floors
      areaOfPlotRor: raw.areaOfPlotRor || '',
      areaOfPlotDoc: raw.areaOfPlotDoc || '',
      approvedBUA: raw.approvedBUA || '',
      actualBUA: raw.actualBUA || '',
      demarcationAtSite: raw.demarcationAtSite || '',
      floors: raw.floors || [],
      totalBUA: raw.totalBUA || '',
      totalCarpetArea: raw.totalCarpetArea || '',
      totalSaleableAreaLand: raw.totalSaleableAreaLand || (raw.totalSaleableArea ? (raw.totalSaleableArea.match(/([0-9.]+)\s*Sft\s*\(Land\)/i)?.[1] || '') : ''),
      totalSaleableAreaBuilding: raw.totalSaleableAreaBuilding || (raw.totalSaleableArea ? (raw.totalSaleableArea.match(/([0-9.]+)\s*Sft\s*\(Building\)/i)?.[1] || '') : ''),
      totalSaleableArea: raw.totalSaleableArea || '',
      amenitiesDetails: raw.amenitiesDetails || '',
      farPermissibleUtilized: raw.farPermissibleUtilized || '',
      constructionAsPerApprovedPlan: raw.constructionAsPerApprovedPlan || '',
      extraConstructionDetails: raw.extraConstructionDetails || '',
      extraConstructionPercentage: raw.extraConstructionPercentage || '',
      extraConstructionCompoundable: raw.extraConstructionCompoundable || '',
      qualityOfConstruction: raw.qualityOfConstruction || '',
      maintenanceOfProperty: raw.maintenanceOfProperty || '',

      // Page 4: Building Condition, Life & Land Rate (Sec 9)
      conditionOfBuilding: raw.conditionOfBuilding || '',
      currentLifeStructure: raw.currentLifeStructure || '',
      projectedLifeStructure: raw.projectedLifeStructure || '',
      landRevenueTaxesPaid: raw.landRevenueTaxesPaid || '',
      municipalTaxesPaid: raw.municipalTaxesPaid || '',
      govtBenchmarkRateAcre: raw.govtBenchmarkRateAcre || '',
      govtBenchmarkRateSft: raw.govtBenchmarkRateSft || (raw.govtBenchmarkRateAcre && !isNaN(parseFloat(raw.govtBenchmarkRateAcre)) ? (parseFloat(raw.govtBenchmarkRateAcre) / 43560).toFixed(2) : ''),
      totalLandAreaDec: raw.totalLandAreaDec || '',
      totalLandAreaAcre: raw.totalLandAreaAcre || (raw.totalLandAreaDec && !isNaN(parseFloat(raw.totalLandAreaDec)) ? (parseFloat(raw.totalLandAreaDec) / 100).toString() : ''),
      totalLandAreaSft: raw.totalLandAreaSft || (raw.totalLandAreaDec && !isNaN(parseFloat(raw.totalLandAreaDec)) ? (parseFloat(raw.totalLandAreaDec) * 435.6).toFixed(2) : ''),
      totalGovtValueLand: raw.totalGovtValueLand || '',
      prevailingMarketRateMin: raw.prevailingMarketRateMin || '',
      prevailingMarketRateMax: raw.prevailingMarketRateMax || '',
      adoptedMarketRateSft: raw.adoptedMarketRateSft || '',
      totalMarketValueLand: raw.totalMarketValueLand || '',

      // Page 4: Building Basic Valuation (Sec 9)
      totalBasicValueBuilding: raw.totalBasicValueBuilding || '',
      totalBasicValueBuildingSay: raw.totalBasicValueBuildingSay || '',
      totalBasicValueBuildingWords: raw.totalBasicValueBuildingWords || '',

      // Page 5: Value of Property Summary Table (Sec 10)
      govtGuideLand: raw.govtGuideLand || '',
      govtGuideBuilding: raw.govtGuideBuilding || '-',
      govtGuideAmenities: raw.govtGuideAmenities || '-',
      govtGuideTotal: raw.govtGuideTotal || '',
      marketValueLand: raw.marketValueLand || '',
      marketValueBuilding: raw.marketValueBuilding || '',
      marketValueAmenities: raw.marketValueAmenities || '-',
      marketValueTotal: raw.marketValueTotal || '',
      realisableValueLand: raw.realisableValueLand || '',
      realisableValueBuilding: raw.realisableValueBuilding || '',
      realisableValueAmenities: raw.realisableValueAmenities || '-',
      realisableValueTotal: raw.realisableValueTotal || '',
      realisableValuePct: raw.realisableValuePct !== undefined && raw.realisableValuePct !== '' ? raw.realisableValuePct : '95',
      distressValueLand: raw.distressValueLand || '',
      distressValueBuilding: raw.distressValueBuilding || '',
      distressValueAmenities: raw.distressValueAmenities || '-',
      distressValueTotal: raw.distressValueTotal || '',
      distressValuePct: raw.distressValuePct !== undefined && raw.distressValuePct !== '' ? raw.distressValuePct : '85',
      insurableValueLand: raw.insurableValueLand || '-',
      insurableValueBuilding: raw.insurableValueBuilding || '',
      insurableValueAmenities: raw.insurableValueAmenities || '-',
      insurableValueTotal: raw.insurableValueTotal || '',

      // Page 5 & 6: Narratives & Remarks (Sec 11)
      realizableEstimationText: raw.realizableEstimationText || 'REALIZABLE ESTIMATION OF THE PROPERTY IN CASE OF DISTRESS SALE, IN CASE, THE BANK WILL SELL THE PROPERTY THROUGH PROCEEDINGS.',
      marketValueSay: raw.marketValueSay || '',
      marketValueWords: raw.marketValueWords || '',
      realizableValueSay: raw.realizableValueSay || '',
      realizableValueWords: raw.realizableValueWords || '',
      distressValueSay: raw.distressValueSay || '',
      distressValueWords: raw.distressValueWords || '',
      basisOfValuation: raw.basisOfValuation || '',
      opinionOfMarketValue: raw.opinionOfMarketValue || '',
      remarksText: raw.remarksText || '',
      undertakingText: raw.undertakingText || '• I have personally visited the property & identified the same based on the documents provided.\n• I/We have no direct or indirect interest in the property being valued.\n• The information furnished above is true and correct to my/our knowledge.\n• I/ we have not been dismissed or removed from govt. Service or convicted of an offence connected with any proceedings of income tax act, wealth tax act or gift tax act or have been blacklisted by any bank/ financial institution/ govt. Department/ public sector enterprise/ body corporate etc.\n• This valuation is prepared without any prejudice or bias to any person or institution\n• The value of land is taken into account by making due enquires in the locality and ascertaining the sales value of the properties in the locality\n• Any additions/alterations made to the property after the date of valuations shall not fall under the scope of this report',
      annexureAMethodOfValuation: raw.annexureAMethodOfValuation || '',
      annexureABasisBuildingValue: raw.annexureABasisBuildingValue || '',
      annexureARegardingLand: raw.annexureARegardingLand || '',
      annexureARegardingBuilding: raw.annexureARegardingBuilding || '',
      annexureABasisLandRate: raw.annexureABasisLandRate || '',

      // Signatory & Valuer
      authorizedSignatory: raw.authorizedSignatory || 'Authorized Signatory',
      visitingEngineer: raw.visitingEngineer || prefill?.firstFieldAgentName || prefill?.fieldEmployees?.[0]?.name || '',
      dateOfReportSubmission: formatReportDate(raw.dateOfReportSubmission || raw.reportDate || new Date()),

      // Page 10: Checklist (Sec 12)
      checklistResponses: raw.checklistResponses || {
        q1: 'YES',
        q2: 'YES',
        q3: 'YES',
        q4: 'YES',
        q5: 'YES',
        q6: 'YES',
        q7: 'NO',
        q8: 'NO',
        q9: 'YES',
        q10: 'YES',
        q11: 'NO',
        q12: 'NO',
      },

      // Photographs & Maps (Sec 13 & 14)
      propertyImages: raw.propertyImages || raw.propertyPhotos || [],
      propertyImageNames: raw.propertyImageNames || [],
      locationMapImages: raw.locationMapImages || [],
      cadastralMapImages: raw.cadastralMapImages || [],
      benchmarkImages: raw.benchmarkImages || [],
      sketchMapImages: raw.sketchMapImages || [],
    };
  }, [initialFields, prefill, defaultRefNo, firstFieldAgentVisit]);

  const [fields, setFields] = useState<AxisAgriReportFields>(() => decodeHtmlEntitiesDeep(initialData));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | boolean>(false);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const isInitialMount = useRef(true);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Field change handler
  const handleChange = useCallback((key: keyof AxisAgriReportFields, value: any) => {
    setFields(prev => ({ ...prev, [key]: value }));
  }, []);

  // ── Handlers for Non-Negative Decimal Input & Conversions (Sec 9 & Matrix) ──
  const handlePositiveDecimalChange = useCallback((key: keyof AxisAgriReportFields, val: string) => {
    const cleaned = sanitizePositiveFloat(val);
    handleChange(key, cleaned);
  }, [handleChange]);

  const handleMatrixCellChange = useCallback((key: keyof AxisAgriReportFields, val: string) => {
    if (val.trim() === '-') {
      handleChange(key, '-');
      return;
    }
    const cleaned = sanitizePositiveFloat(val);
    handleChange(key, cleaned);
  }, [handleChange]);

  const handleBenchmarkAcreChange = useCallback((val: string) => {
    let cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    handleChange('govtBenchmarkRateAcre', cleaned);
    if (!cleaned || isNaN(parseFloat(cleaned))) {
      handleChange('govtBenchmarkRateSft', '');
    } else {
      const perAcre = parseFloat(cleaned);
      if (perAcre > 0) {
        handleChange('govtBenchmarkRateSft', (perAcre / 43560).toFixed(2));
      } else {
        handleChange('govtBenchmarkRateSft', '0.00');
      }
    }
  }, [handleChange]);

  const handleTotalLandAreaDecChange = useCallback((val: string) => {
    let cleaned = val.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    handleChange('totalLandAreaDec', cleaned);
    if (!cleaned || isNaN(parseFloat(cleaned))) {
      handleChange('totalLandAreaAcre', '');
      handleChange('totalLandAreaSft', '');
    } else {
      const dec = parseFloat(cleaned);
      if (dec > 0) {
        // 1 Acre = 100 Decimals
        const acreVal = (dec / 100).toString();
        // 1 Decimal = 435.6 Sft
        const sftVal = (dec * 435.6).toFixed(2);
        handleChange('totalLandAreaAcre', acreVal);
        handleChange('totalLandAreaSft', sftVal);
      } else {
        handleChange('totalLandAreaAcre', '0');
        handleChange('totalLandAreaSft', '0.00');
      }
    }
  }, [handleChange]);

  // Multi-select toggle handler
  const handleToggleMulti = useCallback((key: keyof AxisAgriReportFields, item: string) => {
    setFields(prev => {
      const current = (prev[key] as string[]) || [];
      const updated = current.includes(item)
        ? current.filter(x => x !== item)
        : [...current, item];
      return { ...prev, [key]: updated };
    });
  }, []);

  // Section 3 derived active states & toggle handler
  const plotClassificationList = (() => {
    const val = fields.typeOfPropertyPlot;
    if (Array.isArray(val)) return val;
    if (typeof val === 'string' && val.trim()) {
      return val.split(',').map(s => s.trim());
    }
    return [];
  })();

  const isResidentialActive = plotClassificationList.some(item => item.toLowerCase() === 'residential');
  const isCommercialInPlot = plotClassificationList.some(item => item.toLowerCase() === 'commercial');
  const isIndustrialInPlot = plotClassificationList.some(item => item.toLowerCase() === 'industrial');
  const isCommercialOrIndustrialActive = isCommercialInPlot || isIndustrialInPlot;

  const derivedCommCategory = (() => {
    if (isCommercialInPlot && isIndustrialInPlot) return 'Commercial & Industrial';
    if (isCommercialInPlot) return 'Commercial';
    if (isIndustrialInPlot) return 'Industrial';
    return '';
  })();

  const handlePlotToggle = useCallback((option: string) => {
    if (isReadOnly) return;
    const currentList = (() => {
      const val = fields.typeOfPropertyPlot;
      if (Array.isArray(val)) return [...val];
      if (typeof val === 'string' && val.trim()) {
        return val.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    })();

    let nextList: string[];
    if (currentList.some(item => item.toLowerCase() === option.toLowerCase())) {
      nextList = currentList.filter(item => item.toLowerCase() !== option.toLowerCase());
    } else {
      if (option === 'NA') {
        nextList = ['NA'];
      } else {
        nextList = [...currentList.filter(item => item.toLowerCase() !== 'na'), option];
      }
    }

    const nextResActive = nextList.some(item => item.toLowerCase() === 'residential');
    const nextCommActive = nextList.some(item => item.toLowerCase() === 'commercial');
    const nextIndActive = nextList.some(item => item.toLowerCase() === 'industrial');

    let nextCommType = '';
    if (nextCommActive && nextIndActive) {
      nextCommType = 'Commercial, Industrial';
    } else if (nextCommActive) {
      nextCommType = 'Commercial';
    } else if (nextIndActive) {
      nextCommType = 'Industrial';
    }

    setFields(prev => {
      const updated = { ...prev, typeOfPropertyPlot: nextList.join(', ') };
      if (!nextResActive) {
        updated.residentialPropertySubtype = '';
        updated.civicAmenities = '';
      }
      updated.commercialPropertyType = nextCommType;
      if (!nextCommActive && !nextIndActive) {
        updated.commercialPropertySubtype = '';
      }
      return updated;
    });
  }, [isReadOnly, fields.typeOfPropertyPlot]);

  // Floor manipulation
  const handleFloorChange = useCallback((index: number, field: keyof AxisAgriFloorItem, val: string) => {
    setFields(prev => {
      const updated = [...(prev.floors || [])];
      let cleanVal = val;
      if (field === 'ageYears') {
        // Enforce strictly positive integer (no letters, no decimals, only digits)
        cleanVal = val.replace(/[^0-9]/g, '');
      } else if (field === 'plinthArea' || field === 'replacementRate') {
        cleanVal = sanitizePositiveFloat(val);
      }
      updated[index] = { ...updated[index], [field]: cleanVal };

      // Auto-calculate row estimatedCost, depreciation, netValue
      const plinth = parseNum(field === 'plinthArea' ? cleanVal : updated[index].plinthArea);
      const rate = parseNum(field === 'replacementRate' ? cleanVal : updated[index].replacementRate);
      const age = parseInt(field === 'ageYears' ? cleanVal : (updated[index].ageYears || '0'), 10) || 0;
      if (plinth > 0 && rate > 0) {
        const estCost = plinth * rate;
        updated[index].estimatedCost = estCost.toFixed(2);
        // Default 1% per annum depreciation
        const depRate = (age * 0.01);
        const depAmt = estCost * depRate;
        updated[index].depreciationAmount = depAmt.toFixed(2);
        updated[index].netValue = (estCost - depAmt).toFixed(2);
      } else if (plinth === 0 || rate === 0) {
        updated[index].estimatedCost = '';
        updated[index].depreciationAmount = '';
        updated[index].netValue = '';
      }
      return { ...prev, floors: updated };
    });
  }, []);

  const handleAddFloor = useCallback(() => {
    setFields(prev => {
      const current = prev.floors || [];
      const nextName = getFloorName(current.length);
      return {
        ...prev,
        floors: [
          ...current,
          {
            floorName: nextName,
            plinthArea: '',
            usage: 'Residential',
            roofHeight: '',
            ageYears: '',
            replacementRate: '',
            estimatedCost: '',
            depreciationAmount: '',
            netValue: '',
          },
        ],
      };
    });
  }, []);

  const handleRemoveFloor = useCallback((index: number) => {
    setFields(prev => ({
      ...prev,
      floors: (prev.floors || []).filter((_, i) => i !== index),
    }));
  }, []);

  // Percentage change handler for Realisable & Distress
  const handlePercentageChange = useCallback((key: 'realisableValuePct' | 'distressValuePct', val: string) => {
    const cleaned = sanitizePositiveFloat(val);
    handleChange(key, cleaned);
  }, [handleChange]);

  // Total Saleable Area change handler for 2 components (Land & Building)
  const handleSaleableAreaChange = useCallback((type: 'land' | 'bldg', val: string) => {
    const cleaned = sanitizePositiveFloat(val);
    setFields(prev => {
      const newLand = type === 'land' ? cleaned : (prev.totalSaleableAreaLand || '');
      const newBldg = type === 'bldg' ? cleaned : (prev.totalSaleableAreaBuilding || '');
      const formatted = formatSaleableArea(newLand, newBldg);
      return {
        ...prev,
        [type === 'land' ? 'totalSaleableAreaLand' : 'totalSaleableAreaBuilding']: cleaned,
        totalSaleableArea: formatted,
      };
    });
  }, []);

  // Handler for Say figures (strictly positive integer, auto-derives words)
  const handleSayChange = useCallback((
    sayKey: 'totalBasicValueBuildingSay' | 'marketValueSay' | 'realizableValueSay' | 'distressValueSay',
    wordsKey: 'totalBasicValueBuildingWords' | 'marketValueWords' | 'realizableValueWords' | 'distressValueWords',
    val: string
  ) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    const intVal = parseInt(cleaned, 10);
    const words = intVal > 0 ? rupeesInWords(intVal) : '';
    setFields(prev => ({
      ...prev,
      [sayKey]: cleaned,
      [wordsKey]: words,
    }));
  }, []);

  // Auto-sum Plinth Area into Total BUA & Total Basic Value of Building & Auto-format actualBUA
  useEffect(() => {
    const currentFloors = fields.floors || [];
    const sumPlinth = currentFloors.reduce((acc, f) => acc + parseNum(f.plinthArea), 0);
    handleChange('totalBUA', sumPlinth > 0 ? `${sumPlinth.toFixed(2)} Sft` : '0.00 Sft');

    // Auto-derive Actual BUA summary string for PDF / backend
    const parts = currentFloors
      .filter(f => f.floorName && f.plinthArea && parseNum(f.plinthArea) > 0)
      .map(f => {
        const p = parseNum(f.plinthArea).toFixed(2);
        return `${f.floorName}: ${p} Sft`;
      });
    const autoSummary = parts.length > 0
      ? `${parts.join(' ')} Total BUA: ${sumPlinth.toFixed(2)} Sft`
      : '';
    handleChange('actualBUA', autoSummary);

    const sumNetValue = currentFloors.reduce((acc, f) => acc + parseNum(f.netValue), 0);
    if (sumNetValue > 0) {
      const formattedSum = sumNetValue.toFixed(2);
      const roundedVal = Math.round(sumNetValue / 1000) * 1000;
      const formattedSay = roundedVal.toString();
      handleChange('totalBasicValueBuilding', formattedSum);
      handleChange('totalBasicValueBuildingSay', formattedSay);
      handleChange('totalBasicValueBuildingWords', rupeesInWords(roundedVal));

      // Propagate to summary table
      handleChange('marketValueBuilding', formattedSum);
    } else {
      handleChange('totalBasicValueBuilding', '');
      handleChange('totalBasicValueBuildingSay', '');
      handleChange('totalBasicValueBuildingWords', '');
      handleChange('marketValueBuilding', '');
    }
  }, [fields.floors, handleChange]);

  // Auto-calculate Land Values when benchmark or market rate changes
  useEffect(() => {
    const areaSft = parseNum(fields.totalLandAreaSft);
    const benchRate = parseNum(fields.govtBenchmarkRateSft);
    const adoptedRate = parseNum(fields.adoptedMarketRateSft);

    if (areaSft > 0 && benchRate > 0) {
      const govtVal = (areaSft * benchRate).toFixed(2);
      handleChange('totalGovtValueLand', govtVal);
      handleChange('govtGuideLand', govtVal);
    } else {
      handleChange('totalGovtValueLand', '');
      handleChange('govtGuideLand', '');
    }

    if (areaSft > 0 && adoptedRate > 0) {
      const mktVal = (areaSft * adoptedRate).toFixed(2);
      handleChange('totalMarketValueLand', mktVal);
      handleChange('marketValueLand', mktVal);
    } else {
      handleChange('totalMarketValueLand', '');
      handleChange('marketValueLand', '');
    }
  }, [fields.totalLandAreaSft, fields.govtBenchmarkRateSft, fields.adoptedMarketRateSft, handleChange]);

  // Auto-calculate Total Values across Land + Building + Amenities using dynamic editable percentages
  useEffect(() => {
    const landMkt = parseNum(fields.marketValueLand);
    const bldgMkt = parseNum(fields.marketValueBuilding);
    const amenMkt = parseNum(fields.marketValueAmenities);
    const totalMkt = landMkt + bldgMkt + amenMkt;

    // Percentages: default to 95 and 85 if undefined; if user made them empty/null, consider as 0%
    const realPctStr = fields.realisableValuePct !== undefined ? fields.realisableValuePct : '95';
    const distPctStr = fields.distressValuePct !== undefined ? fields.distressValuePct : '85';
    const realRatio = (realPctStr === '' ? 0 : parseNum(realPctStr)) / 100;
    const distRatio = (distPctStr === '' ? 0 : parseNum(distPctStr)) / 100;

    // Realisable: Land, Building, Amenities breakdown + Total (sum of all three)
    const realLand = parseFloat((landMkt * realRatio).toFixed(2));
    const realBldg = parseFloat((bldgMkt * realRatio).toFixed(2));
    const realAmen = parseFloat((amenMkt * realRatio).toFixed(2));
    const totalReal = realLand + realBldg + realAmen;
    handleChange('realisableValueLand', landMkt > 0 ? realLand.toFixed(2) : '');
    handleChange('realisableValueBuilding', bldgMkt > 0 ? realBldg.toFixed(2) : '');
    handleChange('realisableValueAmenities', amenMkt > 0 ? realAmen.toFixed(2) : '');

    // Distress: Land, Building, Amenities breakdown + Total (sum of all three)
    const distLand = parseFloat((landMkt * distRatio).toFixed(2));
    const distBldg = parseFloat((bldgMkt * distRatio).toFixed(2));
    const distAmen = parseFloat((amenMkt * distRatio).toFixed(2));
    const totalDist = distLand + distBldg + distAmen;
    handleChange('distressValueLand', landMkt > 0 ? distLand.toFixed(2) : '');
    handleChange('distressValueBuilding', bldgMkt > 0 ? distBldg.toFixed(2) : '');
    handleChange('distressValueAmenities', amenMkt > 0 ? distAmen.toFixed(2) : '');

    // Govt Guide Total = Land + Building + Amenities
    const govtLand = parseNum(fields.govtGuideLand);
    const govtBldg = parseNum(fields.govtGuideBuilding);
    const govtAmen = parseNum(fields.govtGuideAmenities);
    const totalGovt = govtLand + govtBldg + govtAmen;
    handleChange('govtGuideTotal', totalGovt > 0 ? totalGovt.toFixed(2) : '');

    if (totalMkt > 0) {
      const roundedMkt = Math.round(totalMkt / 1000) * 1000;
      // Market Value Total = Land + Building + Amenities
      handleChange('marketValueTotal', totalMkt.toFixed(2));
      handleChange('marketValueSay', roundedMkt.toString());
      handleChange('marketValueWords', rupeesInWords(roundedMkt));

      const roundedReal = Math.round(totalReal / 1000) * 1000;
      handleChange('realisableValueTotal', totalReal.toFixed(2));
      handleChange('realizableValueSay', roundedReal.toString());
      handleChange('realizableValueWords', rupeesInWords(roundedReal));

      const roundedDist = Math.round(totalDist / 1000) * 1000;
      handleChange('distressValueTotal', totalDist.toFixed(2));
      handleChange('distressValueSay', roundedDist.toString());
      handleChange('distressValueWords', rupeesInWords(roundedDist));
    } else {
      handleChange('marketValueTotal', '');
      handleChange('marketValueSay', '');
      handleChange('marketValueWords', '');
      handleChange('realisableValueTotal', '');
      handleChange('realizableValueSay', '');
      handleChange('realizableValueWords', '');
      handleChange('distressValueTotal', '');
      handleChange('distressValueSay', '');
      handleChange('distressValueWords', '');
    }

    // Insurable Value = Distress Building + Distress Amenities (same as distress, no land)
    const insBuilding = bldgMkt > 0 ? distBldg : 0;
    const insAmenities = amenMkt > 0 ? distAmen : 0;
    const totalInsurable = insBuilding + insAmenities;
    handleChange('insurableValueBuilding', insBuilding > 0 ? insBuilding.toFixed(2) : '');
    handleChange('insurableValueAmenities', insAmenities > 0 ? insAmenities.toFixed(2) : '');
    handleChange('insurableValueTotal', totalInsurable > 0 ? totalInsurable.toFixed(2) : '');
  }, [
    fields.marketValueLand,
    fields.marketValueBuilding,
    fields.marketValueAmenities,
    fields.govtGuideLand,
    fields.govtGuideBuilding,
    fields.govtGuideAmenities,
    fields.realisableValuePct,
    fields.distressValuePct,
    handleChange,
  ]);

  // Photo upload & bucket handlers (Sec 13)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading('photos');
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `temp-photos/${projectId}/property-${Date.now()}-${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(path, file);
        if (!error) {
          const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }
      const existing = fields.propertyImages || [];
      const newImages = [...existing, ...uploadedUrls];
      const existingNames = fields.propertyImageNames || [];
      const newNames = [...existingNames, ...uploadedUrls.map(() => 'Site Picture')];
      handleChange('propertyImages', newImages);
      handleChange('propertyImageNames', newNames);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoRemove = (idx: number) => {
    const updated = (fields.propertyImages || []).filter((_, i) => i !== idx);
    const updatedNames = (fields.propertyImageNames || []).filter((_, i) => i !== idx);
    handleChange('propertyImages', updated);
    handleChange('propertyImageNames', updatedNames);
  };

  const handleReorderPhotos = (newImgs: string[], newNames: string[]) => {
    handleChange('propertyImages', newImgs);
    handleChange('propertyImageNames', newNames);
  };

  const handleBucketConfirm = (selectedUrls: string[]) => {
    const existing = fields.propertyImages || [];
    const newImages = [...existing, ...selectedUrls];
    const existingNames = fields.propertyImageNames || [];
    const newNames = [...existingNames, ...selectedUrls.map(() => 'Site Picture')];
    handleChange('propertyImages', newImages);
    handleChange('propertyImageNames', newNames);
    setBucketPickerOpen(false);
  };

  // Local map upload handlers (Sec 14 — device upload only)
  const handleMultiMapUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: 'locationMapImages' | 'cadastralMapImages' | 'sketchMapImages' | 'benchmarkImages') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(key);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `temp-photos/${projectId}/${key}-${Date.now()}-${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(path, file);
        if (!error) {
          const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }
      const existing = (fields[key] as string[]) || [];
      handleChange(key, [...existing, ...uploadedUrls]);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMapRemove = (key: 'locationMapImages' | 'cadastralMapImages' | 'sketchMapImages' | 'benchmarkImages', idx?: number) => {
    if (idx === undefined) {
      handleChange(key, []);
      return;
    }
    const updated = ((fields[key] as string[]) || []).filter((_: any, i: number) => i !== idx);
    handleChange(key, updated);
  };

  // Auto-save debounced
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isReadOnly) return;

    setAutoSaveStatus('saving');

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res && 'error' in res && res.error) {
          console.error('Auto-save error:', res.error);
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (err) {
        console.error('Auto-save network error:', err);
        setAutoSaveStatus('error');
      }
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
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

  // Manual save
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const res = await saveReportDraft(projectId, fields);
      if (res && 'error' in res && res.error) {
        setMessage({ text: res.error, type: 'error' });
        setAutoSaveStatus('error');
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

  // PDF Generation
  const generatePDFBytes = async (): Promise<Uint8Array> => {
    // Fetch property photos
    const propImages = (fields.propertyImages && fields.propertyImages.length > 0)
      ? fields.propertyImages
      : (fields.propertyPhotos || fields.property_images || []);
    const photoBytesList = await Promise.all(propImages.map(fetchBytes));
    const photos = propImages.map((url, idx) => ({
      bytes: photoBytesList[idx] as Uint8Array,
      label: fields.propertyImageNames?.[idx] || `Photograph ${idx + 1}`,
    })).filter(p => p.bytes && p.bytes.length > 0);

    // Fetch location maps
    const locImages = (fields.locationMapImages && fields.locationMapImages.length > 0)
      ? fields.locationMapImages
      : (fields.locationMapImage ? [fields.locationMapImage] : []);
    const locBytes = (await Promise.all(locImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null && b.length > 0);

    // Fetch cadastral maps
    const cadImages = (fields.cadastralMapImages && fields.cadastralMapImages.length > 0)
      ? fields.cadastralMapImages
      : (fields.cadastralMapImage ? [fields.cadastralMapImage] : (fields.mouzaMapImages || (fields.mouzaMapImage ? [fields.mouzaMapImage] : [])));
    const cadBytes = (await Promise.all(cadImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null && b.length > 0);

    // Fetch sketch maps
    const sketchImages = (fields.sketchMapImages && fields.sketchMapImages.length > 0)
      ? fields.sketchMapImages
      : (fields.sketchMapImage ? [fields.sketchMapImage] : []);
    const sketchBytes = (await Promise.all(sketchImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null && b.length > 0);

    // Fetch benchmark screenshots
    const benchImages = (fields.benchmarkImages && fields.benchmarkImages.length > 0)
      ? fields.benchmarkImages
      : (fields.benchmarkImage ? [fields.benchmarkImage] : (fields.benchmarkValuationImage ? [fields.benchmarkValuationImage] : []));
    const benchBytes = (await Promise.all(benchImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null && b.length > 0);

    const renderer = new PDFAxisAgriRenderer();
    await renderer.init();

    return renderer.generateAxisAgriReport(fields, {
      photos,
      locationMaps: locBytes,
      cadastralMaps: cadBytes,
      sketchMaps: sketchBytes,
      benchmarkImages: benchBytes,
    });
  };

  const handlePreviewPDF = async () => {
    // Open a blank tab synchronously in the click handler to bypass browser pop-up blockers
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Generating Axis AGRI PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #97144d; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating Axis AGRI PDF Preview...</p>
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
      const bytes = await generatePDFBytes();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
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
      const bytes = await generatePDFBytes();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Axis_Agri_Valuation_${projectCode || 'Report'}.pdf`;
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

  // ── Navigation Sections (All 17 Sections) ──
  const navSections: NavItem[] = [
    { id: 'sec-1', title: '1. Header & Initiation' },
    { id: 'sec-2', title: '2. Property Location & Details' },
    { id: 'sec-3', title: '3. Type of Property' },
    { id: 'sec-4', title: '4. Boundaries' },
    { id: 'sec-5', title: '5. Locality & Structure' },
    { id: 'sec-6', title: '6. Tenancy & Leasehold' },
    { id: 'sec-7', title: '7. Statutory Approvals' },
    { id: 'sec-8', title: '8. Construction & Building Details' },
    { id: 'sec-9', title: '9. Land Rate Adopted' },
    { id: 'sec-10', title: '10. Building Valuation Breakdown' },
    { id: 'sec-11', title: '11. Value of Property Summary' },
    { id: 'sec-12', title: '12. Basis of Valuation & Remarks' },
    { id: 'sec-13', title: '13. Valuer Declaration & Undertaking' },
    { id: 'sec-14', title: '14. Annexure "A"' },
    { id: 'sec-15', title: '15. Valuation Report Checklist' },
    { id: 'sec-16', title: '16. Property Photographs' },
    { id: 'sec-17', title: '17. Maps & Cadastral Plans' },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900">
      {/* Main Container */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Top Header & Bank Banner */}
        <ActiveConfigBanner
          clientType={fields.clientType || 'organisation'}
          category={fields.institutionCategory || 'Bank & FIS'}
          bankName={fields.bankName || fields.organisationTemplate || 'AXIS BANK'}
          subclass={fields.organisationSubTemplate || 'AGRI'}
          serviceType={fields.serviceType}
          subjectType={fields.subjectType}
          onResetWizard={onResetWizard}
        />

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-bold shadow-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: HEADER & TECHNICAL INITIATION
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-1" title="Header & Technical Initiation" number={1} defaultOpen>
          {/* Top Reference, Report Date & Date of Visit (Standalone outside soft container) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <Field label="Reference Number">
              <input
                type="text"
                className={inputCls}
                value={fields.refNo || ''}
                onChange={e => handleChange('refNo', e.target.value)}
                disabled={isReadOnly}
                placeholder=""
              />
            </Field>

            <BaseDateInput
              label="Date of Report"
              value={fields.reportDate || ''}
              onChange={val => handleChange('reportDate', val)}
              disabled={isReadOnly}
            />

            <div className="space-y-1">
              <BaseDateInput
                label="Date of Visit"
                value={fields.dateOfVisit || ''}
                onChange={val => handleChange('dateOfVisit', val)}
                disabled={isReadOnly}
              />
              {firstFieldAgentVisit && (
                <div className="flex items-center justify-between text-[11px] bg-blue-100/70 border border-blue-200 text-blue-800 px-2 py-0.5 rounded">
                  <span>
                    Visited: <strong>{firstFieldAgentVisit.agentName}</strong> ({firstFieldAgentVisit.dateStr})
                  </span>
                  {!isReadOnly && fields.dateOfVisit !== firstFieldAgentVisit.dateStr && (
                    <button
                      type="button"
                      onClick={() => handleChange('dateOfVisit', firstFieldAgentVisit.dateStr)}
                      className="text-[10px] underline font-bold hover:text-blue-900 cursor-pointer ml-1"
                    >
                      Reset to Visit
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Container 1A: Technical Initiation Details */}
          <div className="border border-sky-200 bg-sky-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-sky-800 mb-4 text-sm tracking-wide uppercase">Technical Initiation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Report Initiated by Area">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.reportInitiatedByArea || ''}
                  onChange={e => handleChange('reportInitiatedByArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Name of Area">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nameOfArea || ''}
                  onChange={e => handleChange('nameOfArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>
          </div>

          {/* Container 2: Parties Involved & Representative */}
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-indigo-800 mb-4 text-sm tracking-wide uppercase">Parties Involved & Representative Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name of Owner & Address">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.ownerNameAndAddress || ''}
                  onChange={e => handleChange('ownerNameAndAddress', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Name of Borrower & Address">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.borrowerNameAndAddress || ''}
                  onChange={e => handleChange('borrowerNameAndAddress', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Proposal Number">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.proposalNo || ''}
                  onChange={e => handleChange('proposalNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Representative Name & Mobile No.">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.representativeNameMobile || ''}
                  onChange={e => handleChange('representativeNameMobile', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: DETAILS OF PROPERTY BEING VALUED
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-2" title="Details of the Property Being Valued" number={2} defaultOpen>
          {/* Container 1: Location of Property & Documents */}
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-emerald-800 mb-4 text-sm tracking-wide uppercase">Property Classification & Documents</h3>
            <div className="grid grid-cols-1 gap-4 mb-4">
              <Field label="Location of Property">
                <div className="flex gap-6 items-center pt-1">
                  {['Rural', 'Semi Urban', 'Urban'].map(loc => (
                    <label key={loc} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input
                        type="radio"
                        name="locationOfProperty"
                        value={loc}
                        checked={fields.locationOfProperty === loc}
                        onChange={e => handleChange('locationOfProperty', e.target.value)}
                        disabled={isReadOnly}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{loc}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>

            {/* Documents Provided Checkbox Group */}
            <Field label="Documents Provided">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                {[
                  'Copy of Sale Deed',
                  'Bhu-Naksha',
                  'Approved Plan',
                  'Commencement Certificate',
                  'Occupancy Certificate',
                  'ROR',
                  'Previous Valuation Report',
                ].map(doc => {
                  const checked = (fields.documentsProvided || []).includes(doc);
                  return (
                    <label
                      key={doc}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                        checked
                          ? 'bg-emerald-100/80 border-emerald-400 text-emerald-900'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleMulti('documentsProvided', doc)}
                        disabled={isReadOnly}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{doc}</span>
                    </label>
                  );
                })}
              </div>
            </Field>
          </div>

          {/* Container 2: Address & Geographic Position */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-blue-800 mb-4 text-sm tracking-wide uppercase">Address & Geographic Position</h3>

            {/* Plot Khata Description */}
            <div className="mb-4">
              <Field label="Plot No / S.No / G.No / Khasra No & Property Specifics">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.plotKhataDetails || ''}
                  onChange={e => handleChange('plotKhataDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            {/* Road Facility moved here after plot.no */}
            <div className="mb-4">
              <Field label="Road Facility at the Site">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.roadFacilityAtSite || ''}
                  onChange={e => handleChange('roadFacilityAtSite', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            {/* 2 Fields Per Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Colony / Nagar / Sector">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.colonyNagarSector || ''}
                  onChange={e => handleChange('colonyNagarSector', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Locality / Landmark">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.localityLandmark || ''}
                  onChange={e => handleChange('localityLandmark', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Village / Town / City / Market">
                <select
                  className={selectCls}
                  value={fields.villageTownCityMarket || ''}
                  onChange={e => handleChange('villageTownCityMarket', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Option</option>
                  <option value="Village">Village</option>
                  <option value="Town">Town</option>
                  <option value="City">City</option>
                  <option value="Market">Market</option>
                </select>
              </Field>

              <Field label="District">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.district || ''}
                  onChange={e => handleChange('district', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="State">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.state || ''}
                  onChange={e => handleChange('state', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Pincode">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  className={inputCls}
                  value={fields.pincode || ''}
                  onChange={e => handleChange('pincode', sanitizePincode(e.target.value))}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Distance from Area Office">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceFromAreaOffice || ''}
                  onChange={e => handleChange('distanceFromAreaOffice', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Coordinates (Deg Min Sec)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.coordinates || ''}
                  onChange={e => handleChange('coordinates', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Latitude">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.latitude || ''}
                  onChange={e => handlePositiveDecimalChange('latitude', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Longitude">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.longitude || ''}
                  onChange={e => handlePositiveDecimalChange('longitude', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: TYPE OF PROPERTY
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-3" title="Type of Property" number={3} defaultOpen>
          {/* Card A: (A) Plot */}
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-indigo-800 mb-4 text-sm tracking-wide uppercase">(A) Plot Characteristics</h3>
            
            {/* Dedicated Line: Plot Classification Multiple Choice Box */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Plot Classification
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {['NA', 'Residential', 'Commercial', 'Industrial'].map((option) => {
                  const selected = (() => {
                    const val = fields.typeOfPropertyPlot;
                    if (Array.isArray(val)) return val.includes(option);
                    if (typeof val === 'string' && val.trim()) {
                      const parts = val.split(',').map(s => s.trim().toLowerCase());
                      return parts.includes(option.toLowerCase());
                    }
                    return false;
                  })();
                  return (
                    <button
                      key={option}
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => handlePlotToggle(option)}
                      className={`flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer select-none ${
                        selected
                          ? 'bg-indigo-600 text-white border-indigo-600 ring-2 ring-indigo-200 shadow-xs scale-[1.01]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700'
                      } ${isReadOnly ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] font-black ${
                        selected ? 'border-white bg-white text-indigo-700' : 'border-gray-400 bg-white text-transparent'
                      }`}>
                        ✓
                      </span>
                      <span>{option}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next 3 fields on the same line */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Level of Land with Topographical Conditions">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.levelOfLand || ''}
                  onChange={e => handleChange('levelOfLand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Any Construction Observed on Plot">
                <select
                  className={selectCls}
                  value={fields.constructionObservedOnPlot || ''}
                  onChange={e => handleChange('constructionObservedOnPlot', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Whether Situated in Municipal / Corporation Limit">
                <select
                  className={selectCls}
                  value={fields.situatedInMunicipalLimit || ''}
                  onChange={e => handleChange('situatedInMunicipalLimit', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Card B: (B) Residential Property */}
          <div className={`border rounded-xl p-5 mb-5 shadow-xs transition-all ${
            isResidentialActive 
              ? 'border-purple-200 bg-purple-50/50' 
              : 'border-slate-200 bg-slate-50/60 opacity-60'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className={`font-semibold text-sm tracking-wide uppercase ${isResidentialActive ? 'text-purple-800' : 'text-slate-500'}`}>
                (B) Residential Property Classification
              </h3>
              {!isResidentialActive && (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-full border border-slate-300">
                  Locked (Select 'Residential' in Plot Characteristics above)
                </span>
              )}
            </div>

            {/* Residential Property Subtype (Checkboxes) */}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Residential Property Subtype
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {[
                  'Independent house',
                  'Bungalow',
                  'Row House',
                  'Flat',
                  'Commercial',
                ].map((opt) => {
                  const selected = (() => {
                    const val = fields.residentialPropertySubtype;
                    if (Array.isArray(val)) return val.includes(opt);
                    if (typeof val === 'string' && val.trim()) {
                      const parts = val.split(',').map(s => s.trim().toLowerCase());
                      return parts.includes(opt.toLowerCase());
                    }
                    return false;
                  })();
                  const disabled = isReadOnly || !isResidentialActive;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        const currentList = (() => {
                          const val = fields.residentialPropertySubtype;
                          if (Array.isArray(val)) return [...val];
                          if (typeof val === 'string' && val.trim()) {
                            return val.split(',').map(s => s.trim()).filter(Boolean);
                          }
                          return [];
                        })();
                        const nextList = currentList.some(item => item.toLowerCase() === opt.toLowerCase())
                          ? currentList.filter(item => item.toLowerCase() !== opt.toLowerCase())
                          : [...currentList, opt];
                        handleChange('residentialPropertySubtype', nextList.join(', '));
                      }}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer select-none ${
                        selected
                          ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-200 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50/40 hover:text-purple-700'
                      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] font-black ${
                        selected ? 'border-white bg-white text-purple-700' : 'border-gray-400 bg-white text-transparent'
                      }`}>
                        ✓
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Civic Amenities (School, Hospital, Market, etc.) (Checkboxes) */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Civic Amenities (School, Hospital, Market, etc.)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  'Available within the radius of 2-3 Kms',
                  'Not Available',
                ].map((opt) => {
                  const selected = (() => {
                    const val = fields.civicAmenities;
                    if (Array.isArray(val)) return val.includes(opt);
                    if (typeof val === 'string' && val.trim()) {
                      return val.trim().toLowerCase() === opt.toLowerCase();
                    }
                    return false;
                  })();
                  const disabled = isReadOnly || !isResidentialActive;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        const current = String(fields.civicAmenities || '').trim();
                        const next = current.toLowerCase() === opt.toLowerCase() ? '' : opt;
                        handleChange('civicAmenities', next);
                      }}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer select-none ${
                        selected
                          ? 'bg-purple-600 text-white border-purple-600 ring-2 ring-purple-200 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-purple-300 hover:bg-purple-50/40 hover:text-purple-700'
                      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] font-black ${
                        selected ? 'border-white bg-white text-purple-700' : 'border-gray-400 bg-white text-transparent'
                      }`}>
                        ✓
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card C: (C) Commercial / Industrial Property */}
          <div className={`border rounded-xl p-5 mb-5 shadow-xs transition-all ${
            isCommercialOrIndustrialActive
              ? 'border-blue-200 bg-blue-50/50'
              : 'border-slate-200 bg-slate-50/60 opacity-60'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h3 className={`font-semibold text-sm tracking-wide uppercase ${isCommercialOrIndustrialActive ? 'text-blue-800' : 'text-slate-500'}`}>
                (C) Commercial / Industrial Property
              </h3>
              {/* Category: Locked Display */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase">Category:</span>
                {isCommercialOrIndustrialActive ? (
                  <span className="px-3 py-1 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-xs">
                    {derivedCommCategory}
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/80 px-2.5 py-0.5 rounded-full border border-slate-300">
                    Locked (Select Commercial/Industrial in Plot Characteristics above)
                  </span>
                )}
              </div>
            </div>

            {/* Dedicated Line: Commercial / Industrial Property Subtype multi-select */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Commercial / Industrial Property Subtype
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {[
                  'Independent house',
                  'Row House',
                  'Unit in a mall',
                  'Godown',
                  'Industrial',
                  'Shop',
                ].map((opt) => {
                  const selected = (() => {
                    const val = fields.commercialPropertySubtype;
                    if (Array.isArray(val)) return val.includes(opt);
                    if (typeof val === 'string' && val.trim()) {
                      const parts = val.split(',').map(s => s.trim().toLowerCase());
                      return parts.includes(opt.toLowerCase());
                    }
                    return false;
                  })();
                  const disabled = isReadOnly || !isCommercialOrIndustrialActive;
                  return (
                    <button
                      key={opt}
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        if (disabled) return;
                        const currentList = (() => {
                          const val = fields.commercialPropertySubtype;
                          if (Array.isArray(val)) return [...val];
                          if (typeof val === 'string' && val.trim()) {
                            return val.split(',').map(s => s.trim()).filter(Boolean);
                          }
                          return [];
                        })();
                        const nextList = currentList.some(item => item.toLowerCase() === opt.toLowerCase())
                          ? currentList.filter(item => item.toLowerCase() !== opt.toLowerCase())
                          : [...currentList, opt];
                        handleChange('commercialPropertySubtype', nextList.join(', '));
                      }}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer select-none ${
                        selected
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700'
                      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] font-black ${
                        selected ? 'border-white bg-white text-blue-700' : 'border-gray-400 bg-white text-transparent'
                      }`}>
                        ✓
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Availability of Local Transport */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">
                Availability of Local Transport
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {['Metro', 'Local Train', 'Bus', 'Personal Transport'].map(item => {
                  const checked = (fields.availabilityLocalTransport || []).includes(item);
                  const disabled = isReadOnly || !isCommercialOrIndustrialActive;
                  return (
                    <button
                      key={item}
                      type="button"
                      disabled={disabled}
                      onClick={() => !disabled && handleToggleMulti('availabilityLocalTransport', item)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold tracking-wide transition-all duration-150 cursor-pointer select-none ${
                        checked
                          ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-200 shadow-xs'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700'
                      } ${disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                    >
                      <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] font-black ${
                        checked ? 'border-white bg-white text-blue-700' : 'border-gray-400 bg-white text-transparent'
                      }`}>
                        ✓
                      </span>
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Additional Topography & Accessibility Details (Directly under Section 3 following A, B, C) */}
          <div className="border border-gray-200 bg-white rounded-xl p-5 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Distance from Railway Station">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceFromRailwayStation || ''}
                  onChange={e => handleChange('distanceFromRailwayStation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Bus Stop / Taxi / Auto Stand (Distance)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.busStopTaxiStand || ''}
                  onChange={e => handleChange('busStopTaxiStand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Does the approach road to the Property / Building is independent and accessible">
                <select
                  className={selectCls}
                  value={fields.independentApproachRoad || ''}
                  onChange={e => handleChange('independentApproachRoad', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Will it be able to accommodate a fire extinguisher">
                <select
                  className={selectCls}
                  value={fields.accommodateFireExtinguisher || ''}
                  onChange={e => handleChange('accommodateFireExtinguisher', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Does the property falls under land locked area">
                <select
                  className={selectCls}
                  value={fields.landLockedArea || ''}
                  onChange={e => handleChange('landLockedArea', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Option</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Cornered / Intermittent Plot">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`${inputCls} w-2/3`}
                    value={fields.corneredOrIntermittent || ''}
                    onChange={e => handleChange('corneredOrIntermittent', e.target.value)}
                    disabled={isReadOnly}
                    placeholder=""
                  />
                  <select
                    className={`${selectCls} w-1/3`}
                    value={fields.corneredOrIntermittentVal || ''}
                    onChange={e => handleChange('corneredOrIntermittentVal', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: BOUNDARIES
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-4" title="Boundaries (Dual Matrix)" number={4} defaultOpen>
          <div className="border border-purple-200 bg-purple-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-purple-800 mb-4 text-sm tracking-wide uppercase">Dual Boundary Verification Matrix</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-purple-100/70 text-purple-900 font-bold uppercase">
                  <tr>
                    <th className="p-3 border-b border-r w-24">Direction</th>
                    <th className="p-3 border-b border-r">As per Verification (Site)</th>
                    <th className="p-3 border-b">As per Document (Deed/ROR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border-r">East</td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundaryEastVerification || ''}
                        onChange={e => handleChange('boundaryEastVerification', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundaryEastDocument || ''}
                        onChange={e => handleChange('boundaryEastDocument', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border-r">West</td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundaryWestVerification || ''}
                        onChange={e => handleChange('boundaryWestVerification', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundaryWestDocument || ''}
                        onChange={e => handleChange('boundaryWestDocument', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border-r">North</td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundaryNorthVerification || ''}
                        onChange={e => handleChange('boundaryNorthVerification', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundaryNorthDocument || ''}
                        onChange={e => handleChange('boundaryNorthDocument', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </td>
                  </tr>

                  <tr>
                    <td className="p-3 font-semibold text-slate-700 bg-slate-50 border-r">South</td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundarySouthVerification || ''}
                        onChange={e => handleChange('boundarySouthVerification', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundarySouthDocument || ''}
                        onChange={e => handleChange('boundarySouthDocument', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>
        <Section id="sec-5" title="Locality, Infrastructure & Usage Details" number={5} defaultOpen>
          {/* Container 1: Locality Class, Infrastructure & Ownership */}
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-indigo-800 mb-4 text-sm tracking-wide uppercase">Locality Class, Infrastructure & Ownership</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="Class of Locality">
                <select
                  className={selectCls}
                  value={fields.classOfLocality || ''}
                  onChange={e => handleChange('classOfLocality', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Class</option>
                  <option value="Posh">Posh</option>
                  <option value="Higher Middle Class">Higher Middle Class</option>
                  <option value="Middle class">Middle class</option>
                  <option value="Lower middle Class">Lower middle Class</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="Quality of Infrastructure in Vicinity">
                <select
                  className={selectCls}
                  value={fields.qualityOfInfrastructure || ''}
                  onChange={e => handleChange('qualityOfInfrastructure', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Infrastructure</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="Ownership Status of the Property">
                <select
                  className={selectCls}
                  value={fields.ownershipStatus || ''}
                  onChange={e => handleChange('ownershipStatus', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Ownership Status</option>
                  <option value="Free Hold">Free Hold</option>
                  <option value="Reg. Lease">Reg. Lease</option>
                  <option value="Govt. Authority">Govt. Authority</option>
                </select>
              </Field>
            </div>

            {/* Approved vs Actual Usage Multi-Select */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Approved Usage of Property">
                <div className="flex flex-col gap-2 pt-1">
                  {['Industrial', 'commercial', 'Residential', 'Mix'].map(item => (
                    <label key={item} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1.5 rounded hover:bg-indigo-100/50">
                      <input
                        type="checkbox"
                        checked={(fields.approvedUsage || []).includes(item)}
                        onChange={() => handleToggleMulti('approvedUsage', item)}
                        disabled={isReadOnly}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-800">{item}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Actual Usage of Property">
                <div className="flex flex-col gap-2 pt-1">
                  {['Industrial', 'Commercial', 'Residential', 'Mix'].map(item => (
                    <label key={item} className="flex items-center gap-2 text-xs font-medium cursor-pointer p-1.5 rounded hover:bg-indigo-100/50">
                      <input
                        type="checkbox"
                        checked={(fields.actualUsage || []).includes(item)}
                        onChange={() => handleToggleMulti('actualUsage', item)}
                        disabled={isReadOnly}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="font-semibold text-slate-800">{item}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          {/* Container 2: Structure & Surroundings */}
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-emerald-800 mb-4 text-sm tracking-wide uppercase">Structure & Surroundings</h3>
            
            {/* Restrictive covenants full width before structure type */}
            <div className="mb-4">
              <Field label="Restrictive Covenants Regards Land Use">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.restrictiveCovenants || ''}
                  onChange={e => handleChange('restrictiveCovenants', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Type of Structure">
                <select
                  className={selectCls}
                  value={fields.typeOfStructure || ''}
                  onChange={e => handleChange('typeOfStructure', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Structure Type</option>
                  <option value="Load Bearing">Load Bearing</option>
                  <option value="RCC">RCC</option>
                  <option value="GCI">GCI</option>
                  <option value="Aluform shuttering">Aluform shuttering</option>
                </select>
              </Field>

              <Field label="No of Floors">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={e => handleChange('noOfFloors', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Development of Surrounding Area">
                <select
                  className={selectCls}
                  value={fields.developmentSurroundingArea || ''}
                  onChange={e => handleChange('developmentSurroundingArea', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Development Status</option>
                  <option value="Underdeveloped">Underdeveloped</option>
                  <option value="Developing">Developing</option>
                  <option value="Developed">Developed</option>
                </select>
              </Field>

              <Field label="Basic Amenities">
                <div className="flex gap-3 pt-2">
                  {['Electricity', 'Water', 'Drainage connection'].map(item => (
                    <label key={item} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(fields.basicAmenities || []).includes(item)}
                        onChange={() => handleToggleMulti('basicAmenities', item)}
                        disabled={isReadOnly}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6: TENANCY, OCCUPANCY & LEASEHOLD DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-6" title="Tenancy, Occupancy & Leasehold Details" number={6} defaultOpen>
          {/* Standalone Occupancy Details */}
          <div className="border border-slate-200 bg-white rounded-xl p-5 mb-5 shadow-xs">
            <Field label="Occupancy Details">
              <div className="flex gap-6 items-center pt-1">
                {['Self-Occupied', 'Rented', 'Vacant'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
                    <input
                      type="radio"
                      name="occupancyDetails"
                      value={opt}
                      checked={fields.occupancyDetails === opt}
                      onChange={e => handleChange('occupancyDetails', e.target.value)}
                      disabled={isReadOnly}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {/* Soft Container 1: If the property is on rent */}
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-indigo-800 mb-4 text-sm tracking-wide uppercase">If the property is on rent:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Name of tenant/leasee">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.tenantName || ''}
                  onChange={e => handleChange('tenantName', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Number of years in tenancy">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={inputCls}
                  value={fields.yearsInTenancy || ''}
                  onChange={e => handleChange('yearsInTenancy', sanitizePositiveInt(e.target.value))}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Was there any resistance for valuation">
                <select
                  className={selectCls}
                  value={fields.resistanceForValuation || ''}
                  onChange={e => handleChange('resistanceForValuation', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="If yes, from the current occupants">
                <select
                  className={selectCls}
                  value={fields.resistanceFromOccupants || ''}
                  onChange={e => handleChange('resistanceFromOccupants', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Does property have basic amenities">
                <div className="flex gap-3 pt-2">
                  {['Electricity', 'Water', 'Drainage connection'].map(item => (
                    <label key={item} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(fields.basicAmenities || []).includes(item)}
                        onChange={() => handleToggleMulti('basicAmenities', item)}
                        disabled={isReadOnly}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Development of surrounding area">
                <select
                  className={selectCls}
                  value={fields.developmentSurroundingArea || ''}
                  onChange={e => handleChange('developmentSurroundingArea', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Development Status</option>
                  <option value="Underdeveloped">Underdeveloped</option>
                  <option value="Developing">Developing</option>
                  <option value="Developed">Developed</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Soft Container 2: If the property is Leasehold */}
          <div className="border border-teal-200 bg-teal-50/50 rounded-xl p-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-teal-800 text-sm tracking-wide uppercase">
                If the property is Leasehold
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Name of Lesser">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.lessorName || ''}
                  onChange={e => handleChange('lessorName', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Nature of Lease">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.natureOfLease || ''}
                  onChange={e => handleChange('natureOfLease', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Total Period of Lease (Years)">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={inputCls}
                  value={fields.totalPeriodOfLease || ''}
                  onChange={e => handleChange('totalPeriodOfLease', sanitizePositiveInt(e.target.value))}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="If yes, from the current occupants">
                <select
                  className={selectCls}
                  value={fields.leaseholdOccupantsResistance || ''}
                  onChange={e => handleChange('leaseholdOccupantsResistance', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Does property have basic amenities">
                <div className="flex gap-3 pt-2">
                  {['Electricity', 'Water', 'Drainage connection'].map(item => (
                    <label key={item} className="flex items-center gap-1.5 text-xs font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(fields.leaseholdBasicAmenities || fields.basicAmenities || []).includes(item)}
                        onChange={() => handleToggleMulti('leaseholdBasicAmenities', item)}
                        disabled={isReadOnly}
                        className="rounded text-teal-600 focus:ring-teal-500"
                      />
                      <span>{item}</span>
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="Development of surrounding area">
                <select
                  className={selectCls}
                  value={fields.leaseholdDevelopment || fields.developmentSurroundingArea || ''}
                  onChange={e => handleChange('leaseholdDevelopment', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Development Status</option>
                  <option value="Underdeveloped">Underdeveloped</option>
                  <option value="Developing">Developing</option>
                  <option value="Developed">Developed</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 7: STATUTORY APPROVAL DETAILS (APPROVAL DETAILS:-)
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-7" title="Approval Details:- (Statutory Approvals)" number={7} defaultOpen>
          {/* Container 1: RERA & Certificates */}
          <div className="border border-teal-200 bg-teal-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-teal-800 mb-4 text-sm tracking-wide uppercase">RERA & Statutory Certificates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="RERA Registration Number">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.reraRegNo || ''}
                  onChange={e => handleChange('reraRegNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Occupancy Certificate">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.occupancyCertificate || ''}
                  onChange={e => handleChange('occupancyCertificate', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>
          </div>

          {/* Container 2: Layout Approval */}
          <div className="border border-cyan-200 bg-cyan-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-cyan-800 mb-4 text-sm tracking-wide uppercase">Layout Approval Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Layout Approval Number">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.layoutApprovalNo || ''}
                  onChange={e => handleChange('layoutApprovalNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <BaseDateInput
                label="Date of Approval"
                value={fields.layoutApprovalDate || ''}
                onChange={val => handleChange('layoutApprovalDate', val)}
                disabled={isReadOnly}
              />
              <BaseDateInput
                label="Expiry Date"
                value={fields.layoutExpiryDate || ''}
                onChange={val => handleChange('layoutExpiryDate', val)}
                disabled={isReadOnly}
              />
            </div>
          </div>

          {/* Container 3: Building Plan Approval */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-blue-800 mb-4 text-sm tracking-wide uppercase">Building Plan Approval Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Building Plan Approval Number">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.buildingPlanApprovalNo || ''}
                  onChange={e => handleChange('buildingPlanApprovalNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <BaseDateInput
                label="Date of Approval"
                value={fields.buildingPlanApprovalDate || ''}
                onChange={val => handleChange('buildingPlanApprovalDate', val)}
                disabled={isReadOnly}
              />
              <BaseDateInput
                label="Expiry Date"
                value={fields.buildingPlanExpiryDate || ''}
                onChange={val => handleChange('buildingPlanExpiryDate', val)}
                disabled={isReadOnly}
              />
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 8: CONSTRUCTION & FLOOR-WISE BREAKUP
        ═══════════════════════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════
            SECTION 8: CONSTRUCTION DETAILS & BUILDING SPECIFICATIONS
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-8" title="Construction Details & Building Specifications" number={8} defaultOpen>
          {/* Container 1: Plot Extents & Demarcation */}
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-amber-800 mb-4 text-sm tracking-wide uppercase">Plot Extents & Demarcation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Area of Plot as per ROR">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.areaOfPlotRor || ''}
                  onChange={e => handleChange('areaOfPlotRor', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Approved Built-Up Area (In Sq.Ft.)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.approvedBUA || ''}
                  onChange={e => handlePositiveDecimalChange('approvedBUA', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Area of Plot as per Document">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.areaOfPlotDoc || ''}
                  onChange={e => handleChange('areaOfPlotDoc', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Actual Built-Up Area Summary (In Sq.Ft.)">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    className={`${inputCls} bg-slate-50 text-slate-500 font-medium cursor-not-allowed`}
                    value="[Auto-calculated from Floor-Wise Break Up & Usage Details]"
                    disabled
                    readOnly
                    title="Auto-calculated from Floor-Wise Break Up & Usage Details below"
                  />
                  <span className="absolute right-2 text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 pointer-events-none">
                    Auto-Derived
                  </span>
                </div>
              </Field>

              <Field label="Demarcation at Site">
                <select
                  className={selectCls}
                  value={fields.demarcationAtSite || 'Yes'}
                  onChange={e => handleChange('demarcationAtSite', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Total Carpet Area (In Sq.Ft.)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.totalCarpetArea || ''}
                  onChange={e => handlePositiveDecimalChange('totalCarpetArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              {/* Subcontainer for Total Saleable Area (In 2 parts: Land & Building) */}
              <div className="md:col-span-2 border border-slate-200 bg-slate-50/80 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">
                    Total Saleable Area (In Sq.Ft.)
                  </span>
                  <span className="text-[10px] font-medium text-slate-500">
                    Dual Component (Land & Building)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <Field label="Land Saleable Area (Sq.Ft.)">
                    <input
                      type="text"
                      inputMode="decimal"
                      className={inputCls + ' bg-white font-medium'}
                      value={fields.totalSaleableAreaLand || ''}
                      onChange={e => handleSaleableAreaChange('land', e.target.value)}
                      disabled={isReadOnly}
                      placeholder=""
                    />
                  </Field>

                  <Field label="Building Saleable Area (Sq.Ft.)">
                    <input
                      type="text"
                      inputMode="decimal"
                      className={inputCls + ' bg-white font-medium'}
                      value={fields.totalSaleableAreaBuilding || ''}
                      onChange={e => handleSaleableAreaChange('bldg', e.target.value)}
                      disabled={isReadOnly}
                      placeholder=""
                    />
                  </Field>
                </div>

                {/* Final Rendered Preview Box */}
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shadow-2xs">
                  <span className="text-[11px] font-semibold text-slate-600">
                    Final Rendered in Report:
                  </span>
                  <span className="text-xs font-bold text-[#0a1628] font-mono bg-slate-100/90 px-2.5 py-1 rounded border border-slate-200/80">
                    {fields.totalSaleableArea || formatSaleableArea(fields.totalSaleableAreaLand, fields.totalSaleableAreaBuilding) || (
                      <span className="text-slate-400 font-normal italic">Enter Land or Building area above</span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Container 2: Dynamic Floor-Wise BUA Table (Arthan Styled UI) */}
          <div className="border border-slate-200 bg-white rounded-xl p-5 mb-5 shadow-xs">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-[#0a1628] text-sm tracking-wide uppercase">Floor-Wise Break Up & Usage Details</h3>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddFloor}
                  className="px-3 py-1 bg-[#0a1628] hover:bg-[#12233f] text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs transition-colors"
                >
                  + Add Floor
                </button>
              )}
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider w-12">#</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider w-5/12 min-w-[140px]">Floor Name / Level</th>
                    <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider w-3/12 min-w-[130px]">Plinth Area (Sq.Ft.)</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider w-3/12 min-w-[130px]">Current Usage</th>
                    {!isReadOnly && <th className="px-2 py-2.5 w-10 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(!fields.floors || fields.floors.length === 0) ? (
                    <tr>
                      <td colSpan={!isReadOnly ? 5 : 4} className="px-4 py-6 text-center text-slate-400 italic">
                        No floors added yet. Click &quot;+ Add Floor&quot; to add a floor.
                      </td>
                    </tr>
                  ) : (
                    fields.floors.map((floor, idx) => (
                      <tr key={idx} className="bg-white hover:bg-neutral-50/50 transition-colors">
                        <td className="px-2 py-1.5 text-center text-slate-400 font-medium border-b border-[#e9ecef]">{idx + 1}</td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input
                            type="text"
                            className={inputCls + ' py-1.5! text-xs font-normal text-[#0f2038]'}
                            value={floor.floorName}
                            onChange={e => handleFloorChange(idx, 'floorName', e.target.value)}
                            disabled={isReadOnly}
                            placeholder="e.g. Ground Floor"
                          />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={inputCls + ' py-1.5! text-xs text-right font-medium'}
                            value={floor.plinthArea}
                            onChange={e => handleFloorChange(idx, 'plinthArea', e.target.value)}
                            disabled={isReadOnly}
                            placeholder=""
                          />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <select
                            className={selectCls + ' py-1.5! text-xs'}
                            value={floor.usage}
                            onChange={e => handleFloorChange(idx, 'usage', e.target.value)}
                            disabled={isReadOnly}
                          >
                            <option value="Storage">Storage</option>
                            <option value="Office">Office</option>
                            <option value="Parking">Parking</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Residential">Residential</option>
                          </select>
                        </td>
                        {!isReadOnly && (
                          <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveFloor(idx)}
                              className="text-red-400 hover:text-red-600 text-base leading-none cursor-pointer p-1 font-bold"
                              title="Remove Floor"
                            >
                              &times;
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-300 text-xs">
                  <tr>
                    <td colSpan={2} className="px-3 py-2.5 text-right text-slate-800 font-bold uppercase tracking-wider">
                      Total Built Up Area (Auto-summed):
                    </td>
                    <td className="px-3 py-2.5 text-right text-emerald-800 font-bold font-mono">
                      {fields.totalBUA || '0.00 Sft'}
                    </td>
                    <td colSpan={!isReadOnly ? 2 : 1}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Container 3: Building Specifications & Construction Quality */}
          <div className="border border-slate-200 bg-slate-50/70 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-slate-800 mb-4 text-sm tracking-wide uppercase">Building Specifications & Construction Quality</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Amenities Details (if any)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.amenitiesDetails || ''}
                  onChange={e => handleChange('amenitiesDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Floor Space Index permissible and percentage actually utilized">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.farPermissibleUtilized || ''}
                  onChange={e => handleChange('farPermissibleUtilized', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Whether the construction is as per approved building plan and / or local building bye laws">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionAsPerApprovedPlan || ''}
                  onChange={e => handleChange('constructionAsPerApprovedPlan', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Details of Extra Construction">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.extraConstructionDetails || ''}
                  onChange={e => handleChange('extraConstructionDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Percentage of Extra Construction">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.extraConstructionPercentage || ''}
                  onChange={e => handlePositiveDecimalChange('extraConstructionPercentage', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Whether the extra construction is Compoundable OR Non-Compoundable?">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.extraConstructionCompoundable || ''}
                  onChange={e => handleChange('extraConstructionCompoundable', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Quality of construction">
                <select
                  className={selectCls}
                  value={fields.qualityOfConstruction || 'Good'}
                  onChange={e => handleChange('qualityOfConstruction', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="Maintenance of the Property">
                <select
                  className={selectCls}
                  value={fields.maintenanceOfProperty || 'Good'}
                  onChange={e => handleChange('maintenanceOfProperty', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="Condition Of Building">
                <select
                  className={selectCls}
                  value={fields.conditionOfBuilding || 'Good'}
                  onChange={e => handleChange('conditionOfBuilding', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Container 4: Structure Life & Durability */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-blue-800 mb-4 text-sm tracking-wide uppercase">Structure Life & Durability</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Current Life of the structure">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={inputCls}
                  value={fields.currentLifeStructure || ''}
                  onChange={e => handleChange('currentLifeStructure', sanitizePositiveInt(e.target.value))}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Projected Life of the Structure">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className={inputCls}
                  value={fields.projectedLifeStructure || ''}
                  onChange={e => handleChange('projectedLifeStructure', sanitizePositiveInt(e.target.value))}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>
          </div>

          {/* Container 5: Revenue & Municipal Taxes */}
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-indigo-800 mb-4 text-sm tracking-wide uppercase">Revenue & Municipal Taxes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Land Revenue/Taxes Paid upto (for Land)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.landRevenueTaxesPaid || ''}
                  onChange={e => handleChange('landRevenueTaxesPaid', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Municipal Taxes Paid upto (for Building)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.municipalTaxesPaid || ''}
                  onChange={e => handleChange('municipalTaxesPaid', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 9: THE LAND RATE ADOPTED IN THIS VALUATION
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-9" title="THE LAND RATE ADOPTED IN THIS VALUATION:" number={9} defaultOpen>
          <div className="border border-lime-200 bg-lime-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-lime-800 mb-4 text-sm tracking-wide uppercase">Adopted Land Rate & Valuation</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Govt. Benchmark Rate (Per Acre)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.govtBenchmarkRateAcre || ''}
                  onChange={e => handleBenchmarkAcreChange(e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Govt. Benchmark Rate (Per Sft)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.govtBenchmarkRateSft || ''}
                  onChange={e => handlePositiveDecimalChange('govtBenchmarkRateSft', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Total Land Area (Decimal)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.totalLandAreaDec || ''}
                  onChange={e => handleTotalLandAreaDecChange(e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Total Land Area (In Sft)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.totalLandAreaSft || ''}
                  onChange={e => handlePositiveDecimalChange('totalLandAreaSft', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="p-3 bg-white rounded-lg border border-lime-200 flex justify-between items-center text-xs font-bold mb-4 shadow-xs">
              <span className="text-slate-700">Total Govt. Value of Land:</span>
              <span className="text-lime-700 font-mono text-sm">
                ₹ {fields.totalGovtValueLand || '0.00'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="Prevailing Market Rate Min (Rs./Sft)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.prevailingMarketRateMin || ''}
                  onChange={e => handlePositiveDecimalChange('prevailingMarketRateMin', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Prevailing Market Rate Max (Rs./Sft)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={inputCls}
                  value={fields.prevailingMarketRateMax || ''}
                  onChange={e => handlePositiveDecimalChange('prevailingMarketRateMax', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Adopted Market Rate (Rs./Sft)">
                <input
                  type="text"
                  inputMode="decimal"
                  className={`${inputCls} font-bold text-emerald-700`}
                  value={fields.adoptedMarketRateSft || ''}
                  onChange={e => handlePositiveDecimalChange('adoptedMarketRateSft', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="p-3 bg-emerald-100/70 rounded-lg border border-emerald-300 flex justify-between items-center text-xs font-bold shadow-xs">
              <span className="text-emerald-900">Total Market Value of Land:</span>
              <span className="text-emerald-800 font-mono text-sm">
                ₹ {fields.totalMarketValueLand || '0.00'}
              </span>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 10: BUILDING VALUATION BREAKDOWN
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-10" title="Building Valuation Breakdown & Cost Analysis" number={10} defaultOpen>
          <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-emerald-800 mb-4 text-sm tracking-wide uppercase">Floor-Wise Replacement Cost & Depreciation Breakdown</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
              <table className="min-w-full text-xs text-left border-collapse">
                <thead className="bg-emerald-100/80 text-emerald-950 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3 py-2.5 border-b border-r border-emerald-200 min-w-[180px] whitespace-nowrap">Particulars of Items</th>
                    <th className="px-3 py-2.5 text-right border-b border-r border-emerald-200 min-w-[150px] whitespace-nowrap">Plinth Area in Sqft</th>
                    <th className="px-3 py-2.5 text-center border-b border-r border-emerald-200 min-w-[120px] whitespace-nowrap">Roof Height</th>
                    <th className="px-3 py-2.5 text-center border-b border-r border-emerald-200 min-w-[140px] whitespace-nowrap">Age of the Building in Years</th>
                    <th className="px-3 py-2.5 text-right border-b border-r border-emerald-200 min-w-[180px] whitespace-nowrap">Replacement Rate of Construction</th>
                    <th className="px-3 py-2.5 text-right border-b border-r border-emerald-200 min-w-[200px] whitespace-nowrap">Estimated Replacement Cost of Construction</th>
                    <th className="px-3 py-2.5 text-right border-b border-r border-emerald-200 min-w-[200px] whitespace-nowrap">Depreciation Amount in Rs. (1% per Anm)</th>
                    <th className="px-3 py-2.5 text-right border-b border-emerald-200 min-w-[180px] whitespace-nowrap">Net Value After Depreciation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(!fields.floors || fields.floors.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                        No floor breakdown available. Add floors in Section 8 above.
                      </td>
                    </tr>
                  ) : (
                    fields.floors.map((floor, idx) => (
                      <tr key={idx} className="hover:bg-emerald-50/30">
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            className={inputCls + ' text-xs font-medium'}
                            value={floor.floorName}
                            onChange={e => handleFloorChange(idx, 'floorName', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`${inputCls} text-right font-medium text-xs`}
                            value={floor.plinthArea}
                            onChange={e => handleFloorChange(idx, 'plinthArea', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            className={`${inputCls} text-center text-xs`}
                            value={floor.roofHeight || ''}
                            onChange={e => handleFloorChange(idx, 'roofHeight', e.target.value)}
                            disabled={isReadOnly}
                            placeholder=""
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className={`${inputCls} text-center text-xs`}
                            value={floor.ageYears || ''}
                            onChange={e => handleFloorChange(idx, 'ageYears', e.target.value)}
                            disabled={isReadOnly}
                            placeholder=""
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            inputMode="decimal"
                            className={`${inputCls} text-right text-xs`}
                            value={floor.replacementRate || ''}
                            onChange={e => handleFloorChange(idx, 'replacementRate', e.target.value)}
                            disabled={isReadOnly}
                            placeholder=""
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            className={`${inputCls} text-right font-medium text-xs bg-slate-50`}
                            value={floor.estimatedCost || ''}
                            onChange={e => handleFloorChange(idx, 'estimatedCost', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100">
                          <input
                            type="text"
                            className={`${inputCls} text-right text-rose-600 font-medium text-xs bg-slate-50`}
                            value={floor.depreciationAmount || ''}
                            onChange={e => handleFloorChange(idx, 'depreciationAmount', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={`${inputCls} text-right text-emerald-700 font-bold text-xs bg-emerald-50/50`}
                            value={floor.netValue || ''}
                            onChange={e => handleFloorChange(idx, 'netValue', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-emerald-50/80 font-bold border-t border-emerald-200 text-xs">
                  <tr>
                    <td colSpan={7} className="px-3 py-2.5 text-right text-slate-700 font-semibold uppercase">
                      Total Net Building Value:
                    </td>
                    <td className="px-3 py-2.5 text-right text-emerald-800 text-sm font-mono font-bold whitespace-nowrap">
                      ₹ {fields.totalBasicValueBuilding || '0.00'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-5 p-4 rounded-xl border border-emerald-200 bg-white space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                  Total Basic Value of Building
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  Actual Net Value: <span className="text-emerald-700 font-bold">₹ {fields.totalBasicValueBuilding || '0.00'}</span>
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Total Basic Value of Building (Say / Rounded Int)">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    className={`${inputCls} font-bold text-emerald-800 font-mono`}
                    value={fields.totalBasicValueBuildingSay || ''}
                    onChange={e => handleSayChange('totalBasicValueBuildingSay', 'totalBasicValueBuildingWords', e.target.value)}
                    disabled={isReadOnly}
                    placeholder=""
                  />
                </Field>

                <Field label="Total Basic Value in Words (Locked / Auto-derived from Say)">
                  <input
                    type="text"
                    className={`${inputCls} bg-slate-100 dark:bg-slate-800 text-slate-700 font-medium cursor-not-allowed`}
                    value={fields.totalBasicValueBuildingWords || ''}
                    readOnly
                    disabled
                    placeholder=""
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 11: VALUE OF PROPERTY SUMMARY MATRIX
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-11" title="Value of the Property (Summary Matrix)" number={11} defaultOpen>
          {/* Container 1: Five-Tier Valuation Matrix */}
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-indigo-800 mb-4 text-sm tracking-wide uppercase">Five-Tier Valuation Matrix</h3>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-xs">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-indigo-100/80 text-indigo-950 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 border-b border-r border-indigo-200 min-w-[240px]">VALUE OF THE PROPERTY</th>
                    <th className="p-3 text-center w-1/5 min-w-[130px] border-b border-r border-indigo-200">LAND</th>
                    <th className="p-3 text-center w-1/5 min-w-[130px] border-b border-r border-indigo-200">BUILDING</th>
                    <th className="p-3 text-center w-1/6 min-w-[110px] border-b border-r border-indigo-200">AMENITIES</th>
                    <th className="p-3 text-center w-1/5 min-w-[140px] border-b border-indigo-200">TOTAL IN RS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-3 font-bold text-slate-800 border-r">GOVT. GUIDE LINE VALUE</td>
                    <td className="p-2 border-r"><input type="text" inputMode="decimal" className={`${inputCls} text-right text-xs font-mono`} value={fields.govtGuideLand || ''} onChange={e => handleMatrixCellChange('govtGuideLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" inputMode="decimal" className={`${inputCls} text-right text-xs font-mono`} value={fields.govtGuideBuilding || ''} onChange={e => handleMatrixCellChange('govtGuideBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" inputMode="decimal" className={`${inputCls} text-right text-xs font-mono`} value={fields.govtGuideAmenities || ''} onChange={e => handleMatrixCellChange('govtGuideAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-slate-900 text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.govtGuideTotal || ''} readOnly disabled /></td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="p-3 font-bold text-emerald-900 border-r">MARKET VALUE IN RS</td>
                    <td className="p-2 border-r"><input type="text" inputMode="decimal" className={`${inputCls} text-right text-xs font-mono`} value={fields.marketValueLand || ''} onChange={e => handleMatrixCellChange('marketValueLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" inputMode="decimal" className={`${inputCls} text-right text-xs font-mono`} value={fields.marketValueBuilding || ''} onChange={e => handleMatrixCellChange('marketValueBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" inputMode="decimal" className={`${inputCls} text-right text-xs font-mono`} value={fields.marketValueAmenities || ''} onChange={e => handleMatrixCellChange('marketValueAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-emerald-900 text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.marketValueTotal || ''} readOnly disabled /></td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="p-3 font-bold text-blue-900 border-r">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>REALISABLE VALUE (</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-14 px-1.5 py-0.5 text-center font-bold text-blue-900 bg-white border border-blue-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          value={fields.realisableValuePct !== undefined ? fields.realisableValuePct : '95'}
                          onChange={e => handlePercentageChange('realisableValuePct', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span>%)</span>
                      </div>
                    </td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.realisableValueLand || ''} readOnly disabled /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.realisableValueBuilding || ''} readOnly disabled /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.realisableValueAmenities || ''} readOnly disabled /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-blue-900 text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.realisableValueTotal || ''} readOnly disabled /></td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="p-3 font-bold text-amber-900 border-r">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span>DISTRESS/FORCED SALE VALUE (</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          className="w-14 px-1.5 py-0.5 text-center font-bold text-amber-900 bg-white border border-amber-300 rounded text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                          value={fields.distressValuePct !== undefined ? fields.distressValuePct : '85'}
                          onChange={e => handlePercentageChange('distressValuePct', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span>%)</span>
                      </div>
                    </td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.distressValueLand || ''} readOnly disabled /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.distressValueBuilding || ''} readOnly disabled /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.distressValueAmenities || ''} readOnly disabled /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-amber-900 text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.distressValueTotal || ''} readOnly disabled /></td>
                  </tr>
                  <tr className="bg-indigo-50/50">
                    <td className="p-3 font-bold text-indigo-900 border-r">INSURABLE VALUE</td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed`} value="-" readOnly disabled /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.insurableValueBuilding || ''} readOnly disabled /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.insurableValueAmenities || ''} readOnly disabled /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-indigo-900 text-xs font-mono bg-slate-100 dark:bg-slate-800 cursor-not-allowed`} value={fields.insurableValueTotal || ''} readOnly disabled /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Container 2: Adopted Rounded Figures & Words */}
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <h3 className="font-semibold text-amber-800 text-sm tracking-wide uppercase">Adopted Valuation Figures & Words</h3>
              <span className="text-[11px] text-amber-900 bg-amber-100/80 px-2.5 py-1 rounded-md border border-amber-300 font-medium">
                💡 Say values auto-round to nearest ₹1,000 based on the hundredth digit of Actual Total. Editable (Positive Int).
              </span>
            </div>

            <div className="space-y-4">
              {/* Market Value Card */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-white space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Market Value
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Field label="Market Value (Say / Rounded Int)">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`${inputCls} font-bold text-emerald-800 font-mono`}
                        value={fields.marketValueSay || ''}
                        onChange={e => handleSayChange('marketValueSay', 'marketValueWords', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </Field>
                    {fields.marketValueTotal && (
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-slate-500">Actual Total:</span>
                        <span className="text-emerald-700 font-bold">₹ {fields.marketValueTotal}</span>
                        {fields.marketValueSay && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            Math.abs(parseFloat(fields.marketValueSay) - parseFloat(fields.marketValueTotal)) < 1
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            Δ ₹{(parseFloat(fields.marketValueSay || '0') - parseFloat(fields.marketValueTotal || '0')).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Field label="Market Value in Words (Locked / Auto-derived from Say)">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 dark:bg-slate-800 text-slate-700 font-medium cursor-not-allowed`}
                      value={fields.marketValueWords || ''}
                      readOnly
                      disabled
                      placeholder=""
                    />
                  </Field>
                </div>
              </div>

              {/* Realizable Value Card */}
              <div className="p-4 rounded-xl border border-blue-200 bg-white space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900">
                    Realizable Value ({fields.realisableValuePct !== undefined && fields.realisableValuePct !== '' ? fields.realisableValuePct : '95'}%)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Field label="Realizable Value (Say / Rounded Int)">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`${inputCls} font-bold text-blue-800 font-mono`}
                        value={fields.realizableValueSay || ''}
                        onChange={e => handleSayChange('realizableValueSay', 'realizableValueWords', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </Field>
                    {fields.realisableValueTotal && (
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-slate-500">Actual Total:</span>
                        <span className="text-blue-700 font-bold">₹ {fields.realisableValueTotal}</span>
                        {fields.realizableValueSay && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            Math.abs(parseFloat(fields.realizableValueSay) - parseFloat(fields.realisableValueTotal)) < 1
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            Δ ₹{(parseFloat(fields.realizableValueSay || '0') - parseFloat(fields.realisableValueTotal || '0')).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Field label="Realizable Value in Words (Locked / Auto-derived from Say)">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 dark:bg-slate-800 text-slate-700 font-medium cursor-not-allowed`}
                      value={fields.realizableValueWords || ''}
                      readOnly
                      disabled
                      placeholder=""
                    />
                  </Field>
                </div>
              </div>

              {/* Distress Value Card */}
              <div className="p-4 rounded-xl border border-amber-200 bg-white space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                    Distress/Forced Sale Value ({fields.distressValuePct !== undefined && fields.distressValuePct !== '' ? fields.distressValuePct : '85'}%)
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Field label="Distress Value (Say / Rounded Int)">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`${inputCls} font-bold text-amber-800 font-mono`}
                        value={fields.distressValueSay || ''}
                        onChange={e => handleSayChange('distressValueSay', 'distressValueWords', e.target.value)}
                        disabled={isReadOnly}
                        placeholder=""
                      />
                    </Field>
                    {fields.distressValueTotal && (
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-slate-500">Actual Total:</span>
                        <span className="text-amber-700 font-bold">₹ {fields.distressValueTotal}</span>
                        {fields.distressValueSay && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            Math.abs(parseFloat(fields.distressValueSay) - parseFloat(fields.distressValueTotal)) < 1
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            Δ ₹{(parseFloat(fields.distressValueSay || '0') - parseFloat(fields.distressValueTotal || '0')).toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <Field label="Distress Value in Words (Locked / Auto-derived from Say)">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 dark:bg-slate-800 text-slate-700 font-medium cursor-not-allowed`}
                      value={fields.distressValueWords || ''}
                      readOnly
                      disabled
                      placeholder=""
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 12: BASIS OF VALUATION & VALUER REMARKS
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-12" title="Basis of Valuation & Valuer Remarks" number={12} defaultOpen>
          <div className="border border-yellow-200 bg-yellow-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-amber-800 mb-4 text-sm tracking-wide uppercase">Valuer Remarks & Market Opinions</h3>
            <div className="space-y-4">
              <Field label="Basis of Valuation">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.basisOfValuation || ''}
                  onChange={e => handleChange('basisOfValuation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Opinion of Market Value">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.opinionOfMarketValue || ''}
                  onChange={e => handleChange('opinionOfMarketValue', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Remark">
                <textarea
                  rows={6}
                  className={inputCls}
                  value={fields.remarksText || ''}
                  onChange={e => handleChange('remarksText', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 13: UNDERTAKING
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-13" title="Undertaking" number={13} defaultOpen>
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 shadow-xs space-y-5">

            {/* Static Undertaking Points */}
            <div className="bg-white rounded-xl p-4 border border-blue-200 shadow-xs space-y-2.5 text-xs text-slate-700">
              <span className="font-bold text-slate-900 block mb-1 text-xs uppercase tracking-wider">
                Undertaking Points:
              </span>
              {[
                'I have personally visited the property & identified the same based on the documents provided.',
                'I/We have no direct or indirect interest in the property being valued.',
                'The information furnished above is true and correct to my/our knowledge.',
                'I/ we have not been dismissed or removed from govt. Service or convicted of an offence connected with any proceedings of income tax act, wealth tax act or gift tax act or have been blacklisted by any bank/ financial institution/ govt. Department/ public sector enterprise/ body corporate etc.',
                'This valuation is prepared without any prejudice or bias to any person or institution',
                'The value of land is taken into account by making due enquires in the locality and ascertaining the sales value of the properties in the locality',
                'Any additions/alterations made to the property after the date of valuations shall not fall under the scope of this report',
              ].map((point, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold leading-relaxed">•</span>
                  <span className="leading-relaxed">{point}</span>
                </div>
              ))}
            </div>

            {/* Authorized Signatory & Date */}
            <div className="pt-3 border-t border-blue-200/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl ml-auto">
                <Field label="Authorized Signatory (Locked)">
                  <input
                    type="text"
                    className={`${inputCls} bg-slate-100 dark:bg-slate-800 text-slate-800 font-semibold cursor-not-allowed`}
                    value={fields.authorizedSignatory || 'Authorized Signatory'}
                    readOnly
                    disabled
                  />
                  <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                    (Name and Seal of the Agency)
                  </span>
                </Field>

                <BaseDateInput
                  label="Date"
                  value={fields.dateOfReportSubmission || ''}
                  onChange={val => handleChange('dateOfReportSubmission', val)}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 14: ANNEXURE "A"
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-14" title="Annexure 'A' (Methodology & Qualitative Analysis)" number={14} defaultOpen>
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-200/80 pb-3 mb-4 gap-2">
              <div>
                <h3 className="font-semibold text-blue-800 text-sm tracking-wide uppercase">
                  ANNEXURE - &quot;A&quot;
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Method of valuation adopted, qualitative analysis regarding land, building and adopted rates.
                </p>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                Valuation Annexure
              </span>
            </div>

            <div className="space-y-4">
              <Field label="Method of Valuation Adopted">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.annexureAMethodOfValuation || ''}
                  onChange={e => handleChange('annexureAMethodOfValuation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder={'"LAND AND BUILDING" METHOD OF VALUATION HAS BEEN ADOPTED.'}
                />
              </Field>

              <Field label="Basis of Building Value">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.annexureABasisBuildingValue || ''}
                  onChange={e => handleChange('annexureABasisBuildingValue', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="THE BUILDING VALUE HAS BEEN CONSIDERED AS PER MEASURED BUA AREA OF THE STRUCTURES."
                />
              </Field>

              <Field label="Regarding Land">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.annexureARegardingLand || ''}
                  onChange={e => handleChange('annexureARegardingLand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
              <Field label="Regarding Building">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.annexureARegardingBuilding || ''}
                  onChange={e => handleChange('annexureARegardingBuilding', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
              <Field label="Basis of Arriving at the Land Rate">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.annexureABasisLandRate || ''}
                  onChange={e => handleChange('annexureABasisLandRate', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 15: VALUATION REPORT CHECK LIST (PART 2)
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-15" title="Valuation Report Check List (12 Statutory Items)" number={15} defaultOpen>
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-5 shadow-xs">
            {/* Header Title with underline and line break */}
            <div className="text-center mb-3">
              <h3 className="font-bold text-sm text-indigo-950 uppercase inline-block border-b-2 border-indigo-950 pb-0.5 tracking-wider">
                VALUATION REPORT CHECK LIST
              </h3>
            </div>

            {/* Checklist Property Header Reference (Address with line break after) */}
            <div className="p-3 mb-3 rounded-lg bg-indigo-100/70 border border-indigo-200 text-xs text-indigo-950 font-medium text-center">
              <span className="font-bold text-indigo-900 uppercase">Valuation Property Reference: </span>
              {fields.plotKhataDetails ? `(FOR THE PROPERTY VALUATION OF ${fields.plotKhataDetails})` : <span className="text-indigo-600 italic">Auto-referenced from Plot No / S.No / G.No / Khasra No &amp; Property Specifics (Section 1)</span>}
            </div>

            {/* Notice text with underline and line break */}
            <div className="text-center mb-4">
              <p className="italic text-xs text-slate-700 font-medium inline-block border-b border-slate-600 pb-0.5">
                Please ensure that the following important points are in order in the submitted report.
              </p>
            </div>

            <div className="space-y-2.5">
              {[
                { id: 'q1', text: '1. Full names of all property owners are mentioned. Address of the property is mentioned and is same as latest title deed', options: ['YES', 'NO', 'NA'] },
                { id: 'q2', text: '2. Boundaries of the property are mentioned as per both, title deed and actual observations', options: ['YES', 'NO', 'NA'] },
                { id: 'q3', text: '3. Clearly mentioned that property has been identified by the borrower on his own based on the address', options: ['YES', 'NO', 'NA'] },
                { id: 'q4', text: '4. Type of property is clearly mentioned (amongst agricultural, residential, commercial, industrial etc.)', options: ['YES', 'NO', 'NA'] },
                { id: 'q5', text: '5. If land, clearly mentioned whether the land is land blocked plot or independent land (only YES or NO)', options: ['YES', 'NO'] },
                { id: 'q6', text: '6. If vacant land, clearly mentioned that proper demarcation and fencing has been done', options: ['YES', 'NO', 'NA'] },
                { id: 'q7', text: '7. If building, clearly mentioned that construction has been done according to the building plan approval (if not, deviation specified)', options: ['YES', 'NO', 'NA'] },
                { id: 'q8', text: '8. If building, clearly mentioned that building use/completion certificate has been obtained from competent authority', options: ['YES', 'NO', 'NA'] },
                { id: 'q9', text: '9. Clearly mentioned whether access to the property is available (only YES or NO)', options: ['YES', 'NO'] },
                { id: 'q10', text: '10. Basis for arriving at government value has been mentioned and necessary documents have been enclosed', options: ['YES', 'NO', 'NA'] },
                { id: 'q11', text: '11. Whether the site is situated above the water tank level (if below, negative effect specified)', options: ['YES', 'NO', 'NA'] },
                { id: 'q12', text: '12. Any high tension electricity wires are passing above the site (if so, negative effect specified)', options: ['YES', 'NO', 'NA'] },
              ].map(item => {
                const currentVal = fields.checklistResponses?.[item.id] || 'YES';
                const opts = item.options || ['YES', 'NO', 'NA'];
                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200 text-xs shadow-xs">
                    <span className="font-medium text-slate-800 flex-1">{item.text}</span>
                    <div className="flex items-center gap-4 shrink-0">
                      {opts.map(opt => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer font-bold">
                          <input
                            type="radio"
                            name={`check-${item.id}`}
                            value={opt}
                            checked={currentVal === opt}
                            onChange={() => {
                              const updated = { ...(fields.checklistResponses || {}), [item.id]: opt };
                              handleChange('checklistResponses', updated);
                            }}
                            disabled={isReadOnly}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className={opt === 'YES' ? 'text-emerald-700' : opt === 'NO' ? 'text-rose-700' : 'text-slate-700'}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Prepared By Block */}
            <div className="mt-5 p-4 bg-white rounded-xl border border-indigo-200 text-xs text-slate-700 space-y-1 shadow-xs text-center">
              <p className="font-bold text-sm text-slate-900 mb-1.5">Prepared By</p>
              <p className="font-bold text-slate-900 text-sm">Er. Satyajit Mohanty</p>
              <p className="font-bold text-slate-800 text-[10px]">Registered Valuer (Land &amp; Building) — IBBI (Regd. No: IBBI/RV/02/2019/10594)</p>
              <p className="font-bold text-slate-800 text-[10px]">Registered Valuer (Wealth Tax Act) — Income Tax Department (Regd. No: 107/2016-17)</p>
              <p className="font-bold text-slate-800 text-[10px]">Corporate Member &amp; Chartered Engineer — Institution of Engineers (India), Civil Division (M-1560969)</p>
              <p className="font-bold text-slate-800 text-[10px]">Fellow Member — Institution of Valuers (IOV), Delhi (F-26377) &amp; IIV, Pune (F-4443)</p>
              <p className="font-bold text-slate-800 text-[10px]">B.E. (Civil) Utkal University | M.Tech (Civil) | M.Sc. (Real Estate Valuation) | MBA (HR)</p>
              <p className="font-bold text-indigo-700 text-[10px]">Empanelled Valuer of Axis Bank</p>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 16: PROPERTY PHOTOGRAPHS (DUAL MODALITY: DEVICE + BUCKET)
        ═══════════════════════════════════════════════════════════════ */}
        <BasePhotographsSection
          title="Property Photographs"
          sectionNumber={16}
          sectionId="sec-16"
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading}
          bucketCount={bucketImages?.length || 0}
          onImageNameChange={(idx, name) => {
            const next = [...(fields.propertyImageNames || [])];
            next[idx] = name;
            handleChange('propertyImageNames', next);
          }}
          onRemoveImage={handlePhotoRemove}
          onReorderImages={handleReorderPhotos}
          onUploadImages={handlePhotoUpload}
          onOpenBucketPicker={() => setBucketPickerOpen(true)}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 17: MAPS & SPATIAL DOCUMENTS (LOCAL DEVICE UPLOAD ONLY)
        ═══════════════════════════════════════════════════════════════ */}
        <BaseMapsSection
          title="Maps & Spatial Documents"
          sectionNumber={17}
          sectionId="sec-17"
          isReadOnly={isReadOnly}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Section 2 (Address & Geographic Position)"
          technicalAddress={fields.plotKhataDetails || ''}
          propertyAddress={fields.localityLandmark || fields.colonyNagarSector || ''}
          latitude={fields.latitude}
          longitude={fields.longitude}
          locationMapImages={fields.locationMapImages}
          cadastralMapImages={fields.cadastralMapImages}
          sketchMapImages={fields.sketchMapImages}
          mapOrder={['location', 'cadastral', 'sketch']}
          onLocationMapUpload={(e) => handleMultiMapUpload(e, 'locationMapImages')}
          onLocationMapRemove={(idx) => handleMapRemove('locationMapImages', idx)}
          onCadastralMapUpload={(e) => handleMultiMapUpload(e, 'cadastralMapImages')}
          onCadastralMapRemove={(idx) => handleMapRemove('cadastralMapImages', idx)}
          onSketchMapUpload={(e) => handleMultiMapUpload(e, 'sketchMapImages')}
          onSketchMapRemove={(idx) => handleMapRemove('sketchMapImages', idx)}
          onReorderLocationMap={(imgs) => handleChange('locationMapImages', imgs)}
          onReorderCadastralMap={(imgs) => handleChange('cadastralMapImages', imgs)}
          onReorderSketchMap={(imgs) => handleChange('sketchMapImages', imgs)}
        />

        {/* Benchmark Screenshot Upload inside Sec 16 */}
        <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-amber-800 text-sm tracking-wide uppercase">
              📊 Benchmark Valuation Screenshot (Page 8)
            </h3>
            {!isReadOnly && (
              <label className="px-3 py-1.5 rounded-lg border border-amber-600 text-amber-700 bg-white text-xs font-semibold hover:bg-amber-100/50 cursor-pointer transition-colors shadow-xs">
                {uploading ? 'Uploading...' : '+ Upload Benchmark Screenshot'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => handleMultiMapUpload(e, 'benchmarkImages')}
                  disabled={!!uploading}
                />
              </label>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(fields.benchmarkImages || []).map((img, idx) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-amber-200 aspect-video bg-white shadow-xs">
                <img src={img} alt={`Benchmark ${idx + 1}`} className="w-full h-full object-cover" />
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => handleMapRemove('benchmarkImages', idx)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Global Action Bar (Sticky Bottom) */}
        <ReportActionBar
          loading={loading}
          autoSaveStatus={autoSaveStatus}
          isReadOnly={isReadOnly}
          userRole={userRole}
          message={message}
          onSaveDraft={handleSaveDraft}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
        />

        {/* Cloud Photo Bucket Picker Modal */}
        <BasePhotoBucketModal
          isOpen={bucketPickerOpen}
          bucketImages={bucketImages || []}
          onClose={() => setBucketPickerOpen(false)}
          onConfirm={handleBucketConfirm}
        />
      </div>

      {/* Floating Section Navigator on Right Side */}
      <FloatingNavigator sections={navSections} />
    </div>
  );
}
