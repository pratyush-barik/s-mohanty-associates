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

const parseNum = (v: any): number => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
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
    const id = projectCode || projectId || '';
    return id ? (id.toLowerCase().startsWith('axis/') ? id : `Axis/${id}`) : '';
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

  // ── Differentiate Property Area from Bank Initiating Area ──
  const derivedPropertyArea = useMemo(() => {
    if (prefill?.propertyAddress) {
      const parts = prefill.propertyAddress.split(',').map((s: string) => s.trim());
      if (parts.length >= 2) {
        return `${parts[0].replace(/^(At|Vill|Village|Plot)\s*[:\-]\s*/i, '')}, ${parts[1].replace(/^(Ps|Ts|Tahasil|Town)\s*[:\-]\s*/i, '')}`;
      }
      return prefill.propertyAddress;
    }
    return '';
  }, [prefill?.propertyAddress]);

  // ── Initial State Pre-fill ──
  const initialData: AxisAgriReportFields = useMemo(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : {};
    return {
      // Page 1: Header
      refNo: raw.refNo || defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || raw.dateOfReportSubmission || new Date()),
      reportTitle: raw.reportTitle || 'VALUATION REPORT FORMAT (NON-AGRI)',
      dateOfVisit: raw.dateOfVisit
        ? formatReportDate(raw.dateOfVisit)
        : (firstFieldAgentVisit?.dateStr || formatReportDate(raw.dateOfInspection || prefill?.inspectionDate || new Date())),
      reportInitiatedByArea: raw.reportInitiatedByArea || prefill?.serviceRequest?.branch || prefill?.branch || '',
      nameOfArea: (raw.nameOfArea && raw.nameOfArea !== raw.reportInitiatedByArea) ? raw.nameOfArea : derivedPropertyArea,
      ownerNameAndAddress: raw.ownerNameAndAddress || prefill?.contactName || '',
      borrowerNameAndAddress: raw.borrowerNameAndAddress || prefill?.contactName || '',
      proposalNo: raw.proposalNo || '',
      representativeNameMobile: raw.representativeNameMobile || '',

      // Page 1: Details of Property Being Valued
      locationOfProperty: raw.locationOfProperty || 'Rural',
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
      typeOfPropertyPlot: raw.typeOfPropertyPlot || 'Residential',
      levelOfLand: raw.levelOfLand || '',
      situatedInMunicipalLimit: raw.situatedInMunicipalLimit || 'No',
      municipalLimitDetails: raw.municipalLimitDetails || '',
      constructionObservedOnPlot: raw.constructionObservedOnPlot || 'Yes',
      residentialPropertyType: raw.residentialPropertyType || 'Residential',
      residentialPropertySubtype: raw.residentialPropertySubtype || 'Independent house',
      civicAmenities: raw.civicAmenities || 'Available within the radius of 2-3 Kms',
      commercialPropertyType: raw.commercialPropertyType || 'Commercial',
      commercialPropertySubtype: raw.commercialPropertySubtype || 'Godown',
      availabilityLocalTransport: raw.availabilityLocalTransport || [],
      distanceFromRailwayStation: raw.distanceFromRailwayStation || '',
      busStopTaxiStand: raw.busStopTaxiStand || '',
      independentApproachRoad: raw.independentApproachRoad || 'Yes',
      accommodateFireExtinguisher: raw.accommodateFireExtinguisher || 'Yes',
      landLockedArea: raw.landLockedArea || 'No',
      corneredOrIntermittent: raw.corneredOrIntermittent || '',
      corneredOrIntermittentVal: raw.corneredOrIntermittentVal || 'No',

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
      classOfLocality: raw.classOfLocality || 'Middle class',
      qualityOfInfrastructure: raw.qualityOfInfrastructure || 'Good',
      ownershipStatus: raw.ownershipStatus || 'Free Hold',
      approvedUsage: raw.approvedUsage || [],
      actualUsage: raw.actualUsage || [],
      restrictiveCovenants: raw.restrictiveCovenants || 'Not Applicable',
      typeOfStructure: raw.typeOfStructure || 'RCC',
      noOfFloors: raw.noOfFloors || '',
      occupancyDetails: raw.occupancyDetails || 'Self-Occupied',
      tenantName: raw.tenantName || 'NA',
      yearsInTenancy: raw.yearsInTenancy || 'NA',
      resistanceForValuation: raw.resistanceForValuation || 'No',
      resistanceFromOccupants: raw.resistanceFromOccupants || 'No',
      basicAmenities: raw.basicAmenities || ['Electricity', 'Water'],
      developmentSurroundingArea: raw.developmentSurroundingArea || 'Developing',

      // Page 2: Leasehold
      isLeasehold: raw.isLeasehold || 'The Property is Free Hold Land',
      lessorName: raw.lessorName || 'NA',
      natureOfLease: raw.natureOfLease || 'NA',
      totalPeriodOfLease: raw.totalPeriodOfLease || 'NA',
      leaseholdOccupantsResistance: raw.leaseholdOccupantsResistance || 'No',
      leaseholdBasicAmenities: raw.leaseholdBasicAmenities || ['Electricity', 'Water'],
      leaseholdDevelopment: raw.leaseholdDevelopment || 'Developing',

      // Page 2 & 3: Approvals
      reraRegNo: raw.reraRegNo || 'Not Applicable.',
      occupancyCertificate: raw.occupancyCertificate || 'Not Available',
      layoutApprovalNo: raw.layoutApprovalNo || 'Not Mentioned',
      layoutApprovalDate: raw.layoutApprovalDate || '',
      layoutExpiryDate: raw.layoutExpiryDate || '',
      buildingPlanApprovalNo: raw.buildingPlanApprovalNo || 'Not Available',
      buildingPlanApprovalDate: raw.buildingPlanApprovalDate || '',
      buildingPlanExpiryDate: raw.buildingPlanExpiryDate || '',

      // Page 3: Construction & Floors
      areaOfPlotRor: raw.areaOfPlotRor || '',
      areaOfPlotDoc: raw.areaOfPlotDoc || '',
      approvedBUA: raw.approvedBUA || '',
      actualBUA: raw.actualBUA || '',
      demarcationAtSite: raw.demarcationAtSite || 'Yes',
      floors: raw.floors || [],
      totalBUA: raw.totalBUA || '',
      totalCarpetArea: raw.totalCarpetArea || '',
      totalSaleableArea: raw.totalSaleableArea || '',
      amenitiesDetails: raw.amenitiesDetails || 'Nil',
      farPermissibleUtilized: raw.farPermissibleUtilized || '',
      constructionAsPerApprovedPlan: raw.constructionAsPerApprovedPlan || 'Plan is not Available',
      extraConstructionDetails: raw.extraConstructionDetails || 'Not Applicable',
      extraConstructionPercentage: raw.extraConstructionPercentage || 'Not Applicable',
      extraConstructionCompoundable: raw.extraConstructionCompoundable || 'Not Applicable',
      qualityOfConstruction: raw.qualityOfConstruction || 'Good',
      maintenanceOfProperty: raw.maintenanceOfProperty || 'Good',

      // Page 4: Building Condition, Life & Land Rate (Sec 9)
      conditionOfBuilding: raw.conditionOfBuilding || 'Good',
      currentLifeStructure: raw.currentLifeStructure || '',
      projectedLifeStructure: raw.projectedLifeStructure || '',
      landRevenueTaxesPaid: raw.landRevenueTaxesPaid || '',
      municipalTaxesPaid: raw.municipalTaxesPaid || '',
      govtBenchmarkRateAcre: raw.govtBenchmarkRateAcre || '',
      govtBenchmarkRateSft: raw.govtBenchmarkRateSft || '',
      totalLandAreaDec: raw.totalLandAreaDec || '',
      totalLandAreaSft: raw.totalLandAreaSft || '',
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
      distressValueLand: raw.distressValueLand || '',
      distressValueBuilding: raw.distressValueBuilding || '',
      distressValueAmenities: raw.distressValueAmenities || '-',
      distressValueTotal: raw.distressValueTotal || '',
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
      annexureARegardingLand: raw.annexureARegardingLand || '',
      annexureARegardingBuilding: raw.annexureARegardingBuilding || '',
      annexureABasisLandRate: raw.annexureABasisLandRate || '',

      // Signatory & Valuer
      authorizedSignatory: raw.authorizedSignatory || 'Er. Satyajit Mohanty',
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
  }, [initialFields, prefill, defaultRefNo, firstFieldAgentVisit, derivedPropertyArea]);

  const [fields, setFields] = useState<AxisAgriReportFields>(() => decodeHtmlEntitiesDeep(initialData));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Field change handler
  const handleChange = useCallback((key: keyof AxisAgriReportFields, value: any) => {
    setFields(prev => ({ ...prev, [key]: value }));
  }, []);

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

  // Floor manipulation
  const handleFloorChange = useCallback((index: number, field: keyof AxisAgriFloorItem, val: string) => {
    setFields(prev => {
      const updated = [...(prev.floors || [])];
      updated[index] = { ...updated[index], [field]: val };

      // Auto-calculate row estimatedCost, depreciation, netValue
      const plinth = parseNum(field === 'plinthArea' ? val : updated[index].plinthArea);
      const rate = parseNum(field === 'replacementRate' ? val : updated[index].replacementRate);
      const age = parseNum(field === 'ageYears' ? val : (updated[index].ageYears || '8'));
      if (plinth > 0 && rate > 0) {
        const estCost = plinth * rate;
        updated[index].estimatedCost = estCost.toFixed(2);
        // Default 1% per annum depreciation
        const depRate = (age * 0.01);
        const depAmt = estCost * depRate;
        updated[index].depreciationAmount = depAmt.toFixed(2);
        updated[index].netValue = (estCost - depAmt).toFixed(2);
      }
      return { ...prev, floors: updated };
    });
  }, []);

  const handleAddFloor = useCallback(() => {
    setFields(prev => ({
      ...prev,
      floors: [
        ...(prev.floors || []),
        { floorName: `Floor ${(prev.floors?.length || 0) + 1}`, plinthArea: '0.00', usage: 'Residential', roofHeight: "10'-6\"", ageYears: '8Yrs', replacementRate: '1300.00', estimatedCost: '0.00', depreciationAmount: '0.00', netValue: '0.00' },
      ],
    }));
  }, []);

  const handleRemoveFloor = useCallback((index: number) => {
    setFields(prev => ({
      ...prev,
      floors: (prev.floors || []).filter((_, i) => i !== index),
    }));
  }, []);

  // Format actual BUA summary string from floor table
  const handleAutoFormatBUA = useCallback(() => {
    if (!fields.floors || fields.floors.length === 0) return;
    const parts = fields.floors
      .filter(f => f.floorName && f.plinthArea)
      .map(f => `${f.floorName}: ${f.plinthArea} Sft`);
    const total = fields.floors.reduce((acc, f) => acc + parseNum(f.plinthArea), 0);
    const summary = `${parts.join(' ')} Total BUA: ${total.toFixed(2)} Sft`;
    handleChange('actualBUA', summary);
    handleChange('totalBUA', `${total.toFixed(2)} Sft`);
  }, [fields.floors, handleChange]);

  // Auto-sum Plinth Area into Total BUA & Total Basic Value of Building
  useEffect(() => {
    const sumPlinth = (fields.floors || []).reduce((acc, f) => acc + parseNum(f.plinthArea), 0);
    if (sumPlinth > 0) {
      handleChange('totalBUA', `${sumPlinth.toFixed(2)} Sft`);
    }

    const sumNetValue = (fields.floors || []).reduce((acc, f) => acc + parseNum(f.netValue), 0);
    if (sumNetValue > 0) {
      const formattedSum = sumNetValue.toFixed(2);
      const roundedVal = Math.round(sumNetValue / 1000) * 1000;
      const formattedSay = roundedVal.toFixed(2);
      handleChange('totalBasicValueBuilding', formattedSum);
      handleChange('totalBasicValueBuildingSay', formattedSay);
      handleChange('totalBasicValueBuildingWords', rupeesInWords(roundedVal));

      // Propagate to summary table
      handleChange('marketValueBuilding', formattedSum);
      handleChange('realisableValueBuilding', (sumNetValue * 0.95).toFixed(2));
      handleChange('distressValueBuilding', (sumNetValue * 0.85).toFixed(2));
      handleChange('insurableValueBuilding', (sumNetValue * 0.85).toFixed(2));
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
      handleChange('govtGuideTotal', govtVal);
    }

    if (areaSft > 0 && adoptedRate > 0) {
      const mktVal = (areaSft * adoptedRate).toFixed(2);
      handleChange('totalMarketValueLand', mktVal);
      handleChange('marketValueLand', mktVal);
      handleChange('realisableValueLand', (parseNum(mktVal) * 0.95).toFixed(2));
      handleChange('distressValueLand', (parseNum(mktVal) * 0.85).toFixed(2));
    }
  }, [fields.totalLandAreaSft, fields.govtBenchmarkRateSft, fields.adoptedMarketRateSft, handleChange]);

  // Auto-calculate Total Values across Land + Building
  useEffect(() => {
    const landMkt = parseNum(fields.marketValueLand);
    const bldgMkt = parseNum(fields.marketValueBuilding);
    const totalMkt = landMkt + bldgMkt;

    if (totalMkt > 0) {
      const roundedMkt = Math.round(totalMkt / 1000) * 1000;
      handleChange('marketValueTotal', totalMkt.toFixed(2));
      handleChange('marketValueSay', roundedMkt.toFixed(2));
      handleChange('marketValueWords', rupeesInWords(roundedMkt));

      const totalReal = totalMkt * 0.95;
      const roundedReal = Math.round(totalReal / 1000) * 1000;
      handleChange('realisableValueTotal', totalReal.toFixed(2));
      handleChange('realizableValueSay', roundedReal.toFixed(2));
      handleChange('realizableValueWords', rupeesInWords(roundedReal));

      const totalDist = totalMkt * 0.85;
      const roundedDist = Math.round(totalDist / 1000) * 1000;
      handleChange('distressValueTotal', totalDist.toFixed(2));
      handleChange('distressValueSay', roundedDist.toFixed(2));
      handleChange('distressValueWords', rupeesInWords(roundedDist));

      const bldgInsurable = parseNum(fields.insurableValueBuilding);
      handleChange('insurableValueTotal', bldgInsurable > 0 ? bldgInsurable.toFixed(2) : (bldgMkt * 0.85).toFixed(2));
    }
  }, [fields.marketValueLand, fields.marketValueBuilding, fields.insurableValueBuilding, handleChange]);

  // Photo upload & bucket handlers (Sec 13)
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
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
    setUploading(true);
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
      const existing = fields[key] || [];
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
    const updated = (fields[key] || []).filter((_, i) => i !== idx);
    handleChange(key, updated);
  };

  // Auto-save debounced
  useEffect(() => {
    if (isReadOnly) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        setAutoSaveStatus('saving');
        await saveReportDraft(projectId, fields);
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('error');
      }
    }, 2000);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [fields, projectId, isReadOnly]);

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
    const propImages = fields.propertyImages || [];
    const photoBytesList = await Promise.all(propImages.map(fetchBytes));
    const photos = propImages.map((url, idx) => ({
      bytes: photoBytesList[idx] as Uint8Array,
      label: fields.propertyImageNames?.[idx] || `Photograph ${idx + 1}`,
    })).filter(p => p.bytes && p.bytes.length > 0);

    // Fetch location maps
    const locImages = fields.locationMapImages || [];
    const locBytes = (await Promise.all(locImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // Fetch cadastral maps
    const cadImages = fields.cadastralMapImages || [];
    const cadBytes = (await Promise.all(cadImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // Fetch benchmark screenshots
    const benchImages = fields.benchmarkImages || [];
    const benchBytes = (await Promise.all(benchImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    const renderer = new PDFAxisAgriRenderer();
    await renderer.init();

    return renderer.generateAxisAgriReport(fields, {
      photos,
      locationMaps: locBytes,
      cadastralMaps: cadBytes,
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

  // ── Navigation Sections (All 16 Sections) ──
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
    { id: 'sec-12', title: '12. Remarks & Annexure A' },
    { id: 'sec-13', title: '13. Valuer Declaration & Undertaking' },
    { id: 'sec-14', title: '14. Valuation Report Checklist' },
    { id: 'sec-15', title: '15. Property Photographs' },
    { id: 'sec-16', title: '16. Maps & Cadastral Plans' },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900">
      {/* Main Container */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Top Header & Bank Banner */}
        <ActiveConfigBanner
          bankName="AXIS BANK"
          formatName="AGRI (NON-AGRI FORMAT)"
          category="Bank & FIS"
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
          {/* Top Reference & Report Date (Separated outside soft container) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
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
          </div>

          {/* Container 1A: Technical Initiation Details */}
          <div className="border border-sky-200 bg-sky-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-sky-800 mb-4 text-sm tracking-wide uppercase">Technical Initiation Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <input
                  type="text"
                  className={inputCls}
                  value={fields.villageTownCityMarket || ''}
                  onChange={e => handleChange('villageTownCityMarket', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
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
                  className={inputCls}
                  value={fields.pincode || ''}
                  onChange={e => handleChange('pincode', e.target.value)}
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
                  className={inputCls}
                  value={fields.latitude || ''}
                  onChange={e => handleChange('latitude', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Longitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.longitude || ''}
                  onChange={e => handleChange('longitude', e.target.value)}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="(A) Plot Classification">
                <select
                  className={selectCls}
                  value={fields.typeOfPropertyPlot || 'Residential'}
                  onChange={e => handleChange('typeOfPropertyPlot', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="NA">NA</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </Field>

              <Field label="Level of Land with Topographical Conditions">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.levelOfLand || 'Existing Road Level'}
                  onChange={e => handleChange('levelOfLand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Existing Road Level"
                />
              </Field>

              <Field label="Any Construction Observed on Plot">
                <select
                  className={selectCls}
                  value={fields.constructionObservedOnPlot || 'Yes'}
                  onChange={e => handleChange('constructionObservedOnPlot', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Whether Situated in Municipal / Corporation Limit">
                <select
                  className={selectCls}
                  value={fields.situatedInMunicipalLimit || 'No'}
                  onChange={e => handleChange('situatedInMunicipalLimit', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Municipal / Gram Panchayat Details">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.municipalLimitDetails || ''}
                  onChange={e => handleChange('municipalLimitDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Within Achhuli Gram Panchayat area limit"
                />
              </Field>
            </div>
          </div>

          {/* Card B: (B) Residential Property */}
          <div className="border border-purple-200 bg-purple-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-purple-800 mb-4 text-sm tracking-wide uppercase">(B) Residential Property Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Residential Property Subtype">
                <select
                  className={selectCls}
                  value={fields.residentialPropertySubtype || 'Independent house'}
                  onChange={e => handleChange('residentialPropertySubtype', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Residential">Residential</option>
                  <option value="Independent house">Independent house</option>
                  <option value="Bungalow">Bungalow</option>
                  <option value="Row House">Row House</option>
                  <option value="Flat">Flat</option>
                  <option value="Commercial">Commercial</option>
                </select>
              </Field>

              <Field label="Civic Amenities (School, Hospital, Market, etc.)">
                <select
                  className={selectCls}
                  value={fields.civicAmenities || 'Available within the radius of 2-3 Kms'}
                  onChange={e => handleChange('civicAmenities', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Available within the radius of 2-3 Kms">Available within the radius of 2-3 Kms</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </Field>
            </div>
          </div>

          {/* Card C: (C) Commercial / Industrial Property */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-blue-800 mb-4 text-sm tracking-wide uppercase">(C) Commercial / Industrial Property & Transport</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Commercial / Industrial Property Subtype">
                <select
                  className={selectCls}
                  value={fields.commercialPropertySubtype || 'Godown'}
                  onChange={e => handleChange('commercialPropertySubtype', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Independent house">Independent house</option>
                  <option value="Row House">Row House</option>
                  <option value="Unit in a mall">Unit in a mall</option>
                  <option value="Godown">Godown</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Shop">Shop</option>
                </select>
              </Field>

              <Field label="Availability of Local Transport">
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {['Metro', 'Local Train', 'Bus', 'Personal Transport'].map(item => {
                    const checked = (fields.availabilityLocalTransport || []).includes(item);
                    return (
                      <label key={item} className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleMulti('availabilityLocalTransport', item)}
                          disabled={isReadOnly}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{item}</span>
                      </label>
                    );
                  })}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Distance from Railway Station">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceFromRailwayStation || ''}
                  onChange={e => handleChange('distanceFromRailwayStation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 27 Km from Khallikote"
                />
              </Field>

              <Field label="Bus Stop / Taxi / Auto Stand">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.busStopTaxiStand || ''}
                  onChange={e => handleChange('busStopTaxiStand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Within 2-3 Kms"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Independent & Accessible Approach Road">
                <select
                  className={selectCls}
                  value={fields.independentApproachRoad || 'Yes'}
                  onChange={e => handleChange('independentApproachRoad', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Able to Accommodate Fire Extinguisher">
                <select
                  className={selectCls}
                  value={fields.accommodateFireExtinguisher || 'Yes'}
                  onChange={e => handleChange('accommodateFireExtinguisher', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Falls Under Land Locked Area">
                <select
                  className={selectCls}
                  value={fields.landLockedArea || 'No'}
                  onChange={e => handleChange('landLockedArea', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Cornered / Intermittent Plot">
                <div className="flex gap-2">
                  <input
                    type="text"
                    className={`${inputCls} w-2/3`}
                    value={fields.corneredOrIntermittent || 'Intermittent plot'}
                    onChange={e => handleChange('corneredOrIntermittent', e.target.value)}
                    disabled={isReadOnly}
                  />
                  <select
                    className={`${selectCls} w-1/3`}
                    value={fields.corneredOrIntermittentVal || 'No'}
                    onChange={e => handleChange('corneredOrIntermittentVal', e.target.value)}
                    disabled={isReadOnly}
                  >
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
                        placeholder="e.g. Vacant Land / Plot No."
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundaryEastDocument || ''}
                        onChange={e => handleChange('boundaryEastDocument', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Plot No. / Owner Name"
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
                        placeholder="e.g. Vacant Land / Plot No."
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundaryWestDocument || ''}
                        onChange={e => handleChange('boundaryWestDocument', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Plot No. / Owner Name"
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
                        placeholder="e.g. Vacant Land / Plot No."
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundaryNorthDocument || ''}
                        onChange={e => handleChange('boundaryNorthDocument', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Plot No. / Owner Name"
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
                        placeholder="e.g. Vacant Land / Plot No."
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.boundarySouthDocument || ''}
                        onChange={e => handleChange('boundarySouthDocument', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Plot No. / Owner Name"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5: LOCALITY, INFRASTRUCTURE & USAGE
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-5" title="Locality, Infrastructure & Usage Details" number={5} defaultOpen>
          {/* Container 1: Locality Class, Infrastructure & Ownership */}
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-indigo-800 mb-4 text-sm tracking-wide uppercase">Locality Class, Infrastructure & Ownership</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="Class of Locality">
                <select
                  className={selectCls}
                  value={fields.classOfLocality || 'Middle class'}
                  onChange={e => handleChange('classOfLocality', e.target.value)}
                  disabled={isReadOnly}
                >
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
                  value={fields.qualityOfInfrastructure || 'Good'}
                  onChange={e => handleChange('qualityOfInfrastructure', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="Ownership Status of the Property">
                <select
                  className={selectCls}
                  value={fields.ownershipStatus || 'Free Hold'}
                  onChange={e => handleChange('ownershipStatus', e.target.value)}
                  disabled={isReadOnly}
                >
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
              <Field label="Type of Structure (Bold in PDF)">
                <select
                  className={selectCls}
                  value={fields.typeOfStructure || 'RCC'}
                  onChange={e => handleChange('typeOfStructure', e.target.value)}
                  disabled={isReadOnly}
                >
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
                  value={fields.developmentSurroundingArea || 'Developing'}
                  onChange={e => handleChange('developmentSurroundingArea', e.target.value)}
                  disabled={isReadOnly}
                >
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
                      checked={(fields.occupancyDetails || 'Self-Occupied') === opt}
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
                  className={inputCls}
                  value={fields.yearsInTenancy || ''}
                  onChange={e => handleChange('yearsInTenancy', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Was there any resistance for valuation">
                <select
                  className={selectCls}
                  value={fields.resistanceForValuation || 'No'}
                  onChange={e => handleChange('resistanceForValuation', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="If yes, from the current occupants">
                <select
                  className={selectCls}
                  value={fields.resistanceFromOccupants || 'No'}
                  onChange={e => handleChange('resistanceFromOccupants', e.target.value)}
                  disabled={isReadOnly}
                >
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
                  value={fields.developmentSurroundingArea || 'Developing'}
                  onChange={e => handleChange('developmentSurroundingArea', e.target.value)}
                  disabled={isReadOnly}
                >
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
                If the property is Leasehold (The Property is Free Hold Land)
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
              <Field label="Total Period of Lease">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalPeriodOfLease || ''}
                  onChange={e => handleChange('totalPeriodOfLease', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="If yes, from the current occupants">
                <select
                  className={selectCls}
                  value={fields.leaseholdOccupantsResistance || 'No'}
                  onChange={e => handleChange('leaseholdOccupantsResistance', e.target.value)}
                  disabled={isReadOnly}
                >
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
                  value={fields.leaseholdDevelopment || fields.developmentSurroundingArea || 'Developing'}
                  onChange={e => handleChange('leaseholdDevelopment', e.target.value)}
                  disabled={isReadOnly}
                >
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
                  className={inputCls}
                  value={fields.approvedBUA || ''}
                  onChange={e => handleChange('approvedBUA', e.target.value)}
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

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700">Actual Built-Up Area Summary (In Sq.Ft.)</span>
                  {!isReadOnly && (fields.floors || []).length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoFormatBUA}
                      className="text-[10px] text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer"
                      title="Generate summary text from floor table"
                    >
                      Auto-Format from Floors
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  className={inputCls}
                  value={fields.actualBUA || ''}
                  onChange={e => handleChange('actualBUA', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </div>

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
                  className={inputCls}
                  value={fields.totalCarpetArea || ''}
                  onChange={e => handleChange('totalCarpetArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Total Saleable Area (In Sq.Ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalSaleableArea || ''}
                    onChange={e => handleChange('totalSaleableArea', e.target.value)}
                    disabled={isReadOnly}
                    placeholder=""
                  />
                </Field>
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
                    <th className="px-3 py-2.5 text-center font-normal text-xs uppercase tracking-wider w-12">#</th>
                    <th className="px-3 py-2.5 text-left font-normal text-xs uppercase tracking-wider">Floor Name / Level</th>
                    <th className="px-3 py-2.5 text-right font-normal text-xs uppercase tracking-wider w-40">Plinth Area (Sq.Ft.)</th>
                    <th className="px-3 py-2.5 text-left font-normal text-xs uppercase tracking-wider w-48">Current Usage</th>
                    {!isReadOnly && <th className="px-2 py-2.5 w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.floors || []).map((floor, idx) => (
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
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                          <option value="Office">Office</option>
                          <option value="Storage">Storage</option>
                          <option value="Parking">Parking</option>
                          <option value="Industrial">Industrial</option>
                        </select>
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveFloor(idx)}
                            disabled={(fields.floors || []).length <= 1}
                            className="text-red-400 hover:text-red-600 disabled:opacity-30 text-base leading-none cursor-pointer p-1 font-bold"
                            title="Remove Floor"
                          >
                            &times;
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
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
                  className={inputCls}
                  value={fields.extraConstructionPercentage || ''}
                  onChange={e => handleChange('extraConstructionPercentage', e.target.value)}
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
                  className={inputCls}
                  value={fields.currentLifeStructure || ''}
                  onChange={e => handleChange('currentLifeStructure', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Projected Life of the Structure">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.projectedLifeStructure || ''}
                  onChange={e => handleChange('projectedLifeStructure', e.target.value)}
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
                  className={inputCls}
                  value={fields.govtBenchmarkRateAcre || ''}
                  onChange={e => handleChange('govtBenchmarkRateAcre', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Govt. Benchmark Rate (Per Sft)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.govtBenchmarkRateSft || ''}
                  onChange={e => handleChange('govtBenchmarkRateSft', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Total Land Area (Decimal)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalLandAreaDec || ''}
                  onChange={e => handleChange('totalLandAreaDec', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Total Land Area (In Sft)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalLandAreaSft || ''}
                  onChange={e => handleChange('totalLandAreaSft', e.target.value)}
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
                  className={inputCls}
                  value={fields.prevailingMarketRateMin || ''}
                  onChange={e => handleChange('prevailingMarketRateMin', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Prevailing Market Rate Max (Rs./Sft)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.prevailingMarketRateMax || ''}
                  onChange={e => handleChange('prevailingMarketRateMax', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Adopted Market Rate (Rs./Sft)">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-emerald-700`}
                  value={fields.adoptedMarketRateSft || ''}
                  onChange={e => handleChange('adoptedMarketRateSft', e.target.value)}
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
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-emerald-100/70 text-emerald-900 font-bold uppercase">
                  <tr>
                    <th className="p-2 border-b border-r">Particulars of Items</th>
                    <th className="p-2 text-right w-24 border-b border-r">Plinth (Sft)</th>
                    <th className="p-2 text-center w-20 border-b border-r">Roof Ht</th>
                    <th className="p-2 text-center w-16 border-b border-r">Age</th>
                    <th className="p-2 text-right w-28 border-b border-r">Rate (Rs./Sft)</th>
                    <th className="p-2 text-right w-32 border-b border-r">Est. Cost (Rs.)</th>
                    <th className="p-2 text-right w-32 border-b border-r">Depreciation (Rs.)</th>
                    <th className="p-2 text-right w-32 border-b">Net Value (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {(fields.floors || []).map((floor, idx) => (
                    <tr key={idx} className="hover:bg-emerald-50/30">
                      <td className="p-2 border-r">
                        <input
                          type="text"
                          className={inputCls}
                          value={floor.floorName}
                          onChange={e => handleFloorChange(idx, 'floorName', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <input
                          type="text"
                          className={`${inputCls} text-right font-medium`}
                          value={floor.plinthArea}
                          onChange={e => handleFloorChange(idx, 'plinthArea', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <input
                          type="text"
                          className={`${inputCls} text-center`}
                          value={floor.roofHeight || "10'-6\""}
                          onChange={e => handleFloorChange(idx, 'roofHeight', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <input
                          type="text"
                          className={`${inputCls} text-center`}
                          value={floor.ageYears || '8Yrs'}
                          onChange={e => handleFloorChange(idx, 'ageYears', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <input
                          type="text"
                          className={`${inputCls} text-right`}
                          value={floor.replacementRate || '1300.00'}
                          onChange={e => handleFloorChange(idx, 'replacementRate', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <input
                          type="text"
                          className={`${inputCls} text-right font-medium`}
                          value={floor.estimatedCost || '0.00'}
                          onChange={e => handleFloorChange(idx, 'estimatedCost', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r">
                        <input
                          type="text"
                          className={`${inputCls} text-right text-rose-600 font-medium`}
                          value={floor.depreciationAmount || '0.00'}
                          onChange={e => handleFloorChange(idx, 'depreciationAmount', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          className={`${inputCls} text-right text-emerald-700 font-bold`}
                          value={floor.netValue || '0.00'}
                          onChange={e => handleFloorChange(idx, 'netValue', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-emerald-50/80 font-bold border-t border-emerald-200">
                  <tr>
                    <td colSpan={7} className="p-3 text-right text-slate-700">
                      Total Net Building Value:
                    </td>
                    <td className="p-3 text-right text-emerald-800 text-sm font-mono">
                      ₹ {fields.totalBasicValueBuilding || '0.00'}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <Field label="Total Basic Value of Building (Rounded / Say)">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-emerald-800`}
                  value={fields.totalBasicValueBuildingSay || ''}
                  onChange={e => handleChange('totalBasicValueBuildingSay', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>

              <Field label="Total Basic Value in Words">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalBasicValueBuildingWords || ''}
                  onChange={e => handleChange('totalBasicValueBuildingWords', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
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
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-indigo-100/70 text-indigo-900 font-bold uppercase">
                  <tr>
                    <th className="p-3 border-b border-r">Category</th>
                    <th className="p-3 text-right w-40 border-b border-r">Land (₹)</th>
                    <th className="p-3 text-right w-40 border-b border-r">Building (₹)</th>
                    <th className="p-3 text-right w-32 border-b border-r">Amenities (₹)</th>
                    <th className="p-3 text-right w-44 border-b">Total in Rs (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-3 font-bold text-slate-700 border-r">Govt. Guide Line Value</td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.govtGuideLand || ''} onChange={e => handleChange('govtGuideLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.govtGuideBuilding || '-'} onChange={e => handleChange('govtGuideBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.govtGuideAmenities || '-'} onChange={e => handleChange('govtGuideAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-slate-800`} value={fields.govtGuideTotal || ''} onChange={e => handleChange('govtGuideTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="p-3 font-bold text-emerald-800 border-r">Market Value in Rs</td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.marketValueLand || ''} onChange={e => handleChange('marketValueLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.marketValueBuilding || ''} onChange={e => handleChange('marketValueBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.marketValueAmenities || '-'} onChange={e => handleChange('marketValueAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-emerald-800`} value={fields.marketValueTotal || ''} onChange={e => handleChange('marketValueTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr className="bg-blue-50/50">
                    <td className="p-3 font-bold text-blue-800 border-r">Realisable Value (95%)</td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.realisableValueLand || ''} onChange={e => handleChange('realisableValueLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.realisableValueBuilding || ''} onChange={e => handleChange('realisableValueBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.realisableValueAmenities || '-'} onChange={e => handleChange('realisableValueAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-blue-800`} value={fields.realisableValueTotal || ''} onChange={e => handleChange('realisableValueTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="p-3 font-bold text-amber-800 border-r">Distress/Forced Sale Value (85%)</td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.distressValueLand || ''} onChange={e => handleChange('distressValueLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.distressValueBuilding || ''} onChange={e => handleChange('distressValueBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.distressValueAmenities || '-'} onChange={e => handleChange('distressValueAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-amber-800`} value={fields.distressValueTotal || ''} onChange={e => handleChange('distressValueTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr className="bg-indigo-50/50">
                    <td className="p-3 font-bold text-indigo-800 border-r">Insurable Value</td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.insurableValueLand || '-'} onChange={e => handleChange('insurableValueLand', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.insurableValueBuilding || ''} onChange={e => handleChange('insurableValueBuilding', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2 border-r"><input type="text" className={`${inputCls} text-right`} value={fields.insurableValueAmenities || '-'} onChange={e => handleChange('insurableValueAmenities', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="p-2"><input type="text" className={`${inputCls} text-right font-bold text-indigo-800`} value={fields.insurableValueTotal || ''} onChange={e => handleChange('insurableValueTotal', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Container 2: Adopted Rounded Figures & Words */}
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-amber-800 mb-4 text-sm tracking-wide uppercase">Adopted Valuation Figures & Words</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-emerald-200 bg-white">
                <Field label="Market Value (Say)">
                  <input type="text" className={`${inputCls} font-bold text-emerald-800`} value={fields.marketValueSay || ''} onChange={e => handleChange('marketValueSay', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Market Value in Words">
                  <input type="text" className={inputCls} value={fields.marketValueWords || ''} onChange={e => handleChange('marketValueWords', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-blue-200 bg-white">
                <Field label="Realizable Value (Say)">
                  <input type="text" className={`${inputCls} font-bold text-blue-800`} value={fields.realizableValueSay || ''} onChange={e => handleChange('realizableValueSay', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Realizable Value in Words">
                  <input type="text" className={inputCls} value={fields.realizableValueWords || ''} onChange={e => handleChange('realizableValueWords', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-amber-200 bg-white">
                <Field label="Distress Value (Say)">
                  <input type="text" className={`${inputCls} font-bold text-amber-800`} value={fields.distressValueSay || ''} onChange={e => handleChange('distressValueSay', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Distress Value in Words">
                  <input type="text" className={inputCls} value={fields.distressValueWords || ''} onChange={e => handleChange('distressValueWords', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 12: REMARKS & ANNEXURE A
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-12" title="Remarks, Opinions & Annexure 'A'" number={12} defaultOpen>
          {/* Container 1: Remarks & Opinions */}
          <div className="border border-yellow-200 bg-yellow-50/50 rounded-xl p-5 mb-5 shadow-xs">
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

              <Field label="Remarks (Including NB: Disclaimer)">
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

          {/* Container 2: Annexure A */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-blue-800 mb-4 text-sm tracking-wide uppercase">Annexure - &quot;A&quot; Details</h3>
            <div className="space-y-4">
              <Field label="Regarding Land">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.annexureARegardingLand || ''}
                  onChange={e => handleChange('annexureARegardingLand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
              </Field>
              <Field label="Regarding Building">
                <textarea
                  rows={2}
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
            SECTION 13: VALUER DECLARATION & UNDERTAKING (PART 1)
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-13" title="Valuer Declaration & Undertaking" number={13} defaultOpen>
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-blue-200/80 pb-3 mb-4 gap-2">
              <div>
                <h3 className="font-semibold text-blue-800 text-sm tracking-wide uppercase flex items-center gap-2">
                  <span>✍️</span> Valuer Declaration & Authorized Signatory
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Statutory certification, visiting engineer, report submission date, and declaration undertaking.
                </p>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                Statutory Certification
              </span>
            </div>

            <div className="space-y-5">
              {/* Certification Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Date of Visit">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black cursor-not-allowed font-semibold pr-8`}
                      value={fields.dateOfVisit || ''}
                      disabled
                      readOnly
                      placeholder=""
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Referenced from Section 1 Date of Site Visit">
                      🔒
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                    Referenced from Sec 1 (Date of Site Visit)
                  </span>
                </Field>

                <BaseDateInput
                  label="Date of Report Submission"
                  value={fields.dateOfReportSubmission || ''}
                  onChange={val => handleChange('dateOfReportSubmission', val)}
                  disabled={isReadOnly}
                />

                <Field label="Name of Engineer Visited the property">
                  <input
                    className={inputCls}
                    value={fields.visitingEngineer || ''}
                    onChange={e => handleChange('visitingEngineer', e.target.value)}
                    disabled={isReadOnly}
                    placeholder=""
                  />
                  <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                    Field inspection engineer who visited the site
                  </span>
                </Field>

                <Field label="Authorized Signatory Name & Signature">
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className={`${inputCls} bg-slate-100 text-black cursor-not-allowed font-semibold pr-8`}
                      value={fields.authorizedSignatory || 'Er. Satyajit Mohanty'}
                      disabled
                      readOnly
                      placeholder="Er. Satyajit Mohanty"
                    />
                    <span className="absolute right-2.5 text-xs text-black" title="Locked: Authorized Signatory">
                      🔒
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                    Statutory signatory locked
                  </span>
                </Field>
              </div>

              {/* Declaration Statement / Undertaking Text */}
              <Field label="Valuer Declaration & Undertaking Statement">
                <textarea
                  rows={7}
                  className={inputCls}
                  value={fields.undertakingText || ''}
                  onChange={e => handleChange('undertakingText', e.target.value)}
                  disabled={isReadOnly}
                  placeholder=""
                />
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Rendered as the statutory 7-point undertaking on Page 6 of the Axis Bank valuation report.
                </span>
              </Field>

              {/* Statutory Credentials Card */}
              <div className="p-4 bg-white rounded-xl border border-blue-200 text-xs text-slate-700 space-y-1.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1.5">
                  <p className="font-bold text-slate-900 text-sm">Prepared By: {fields.authorizedSignatory || 'Er. Satyajit Mohanty'} (B.E, Civil) FIV</p>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Empanelled Valuer
                  </span>
                </div>
                <p><strong className="text-slate-800">Registered Valuer:</strong> Govt. of India (Regd. No.-107/2016-17, Cat -I)</p>
                <p><strong className="text-slate-800">Chartered Engineer:</strong> Regd. No.-M-156096-9 • Empanelled Valuer of Axis Bank Limited</p>
                <p><strong className="text-slate-800">Institution Membership:</strong> Life, Fellow & Approved Valuer from Institution of Valuers (New Delhi), Membership No.F-26377 • Member in Institution of Engineers (India)</p>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 14: VALUATION REPORT CHECK LIST (PART 2)
        ═══════════════════════════════════════════════════════════════ */}
        <Section id="sec-14" title="Valuation Report Check List (12 Statutory Items)" number={14} defaultOpen>
          <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-indigo-800 mb-4 text-sm tracking-wide uppercase">Statutory Check List Items</h3>
            <div className="space-y-2.5">
              {[
                { id: 'q1', text: '1. Full names of all property owners are mentioned. Address of the property is mentioned and is same as latest title deed' },
                { id: 'q2', text: '2. Boundaries of the property are mentioned as per both, title deed and actual observations' },
                { id: 'q3', text: '3. Clearly mentioned that property has been identified by the borrower on his own based on the address' },
                { id: 'q4', text: '4. Type of property is clearly mentioned (amongst agricultural, residential, commercial, industrial etc.)' },
                { id: 'q5', text: '5. If land, clearly mentioned whether the land is land blocked plot or independent land (only YES or NO)' },
                { id: 'q6', text: '6. If vacant land, clearly mentioned that proper demarcation and fencing has been done' },
                { id: 'q7', text: '7. If building, clearly mentioned that construction has been done according to the building plan approval (if not, deviation specified)' },
                { id: 'q8', text: '8. If building, clearly mentioned that building use/completion certificate has been obtained from competent authority' },
                { id: 'q9', text: '9. Clearly mentioned whether access to the property is available (only YES or NO)' },
                { id: 'q10', text: '10. Basis for arriving at government value has been mentioned and necessary documents have been enclosed' },
                { id: 'q11', text: '11. Whether the site is situated above the water tank level (if below, negative effect specified)' },
                { id: 'q12', text: '12. Any high tension electricity wires are passing above the site (if so, negative effect specified)' },
              ].map(item => {
                const currentVal = fields.checklistResponses?.[item.id] || 'YES';
                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white rounded-lg border border-slate-200 text-xs shadow-xs">
                    <span className="font-medium text-slate-800 flex-1">{item.text}</span>
                    <div className="flex items-center gap-4 shrink-0">
                      {['YES', 'NO'].map(opt => (
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
                          <span className={opt === 'YES' ? 'text-emerald-700' : 'text-rose-700'}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 15: PROPERTY PHOTOGRAPHS (DUAL MODALITY: DEVICE + BUCKET)
        ═══════════════════════════════════════════════════════════════ */}
        <BasePhotographsSection
          title="Property Photographs"
          sectionNumber={15}
          sectionId="sec-15"
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
            SECTION 16: MAPS & SPATIAL DOCUMENTS (LOCAL DEVICE UPLOAD ONLY)
        ═══════════════════════════════════════════════════════════════ */}
        <BaseMapsSection
          title="Maps & Spatial Documents"
          sectionNumber={16}
          sectionId="sec-16"
          isReadOnly={isReadOnly}
          uploading={uploading}
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
                  disabled={uploading}
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
