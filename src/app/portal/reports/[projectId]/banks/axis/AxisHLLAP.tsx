'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  getFloorName,
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  fetchBytes,
  DEFAULT_PHOTO_LABEL,
} from '../BaseBankReportComponents';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { BankConfig } from '@/lib/bank-fields';
import {
  PDFAxisHLLAPRenderer,
  AxisHLLAPReportFields,
  AxisHLLAPBUAFloor,
  deriveStructureType,
} from '@/lib/banks/pdf-axis-hllap-renderer';
import {
  sanitizePositiveFloat,
  sumDecimals,
  formatExactDecimal,
} from '@/lib/banks/pdf-arthan-finance-renderer';

export const AXIS_HLLAP_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'HL-LAP',
  displayName: 'Axis Bank — HL-LAP',
  defaultValues: {
    purpose: 'Home Loan / LAP Valuation',
  },
};

export interface AxisHLLAPProps {
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

export default function AxisHLLAP({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: AxisHLLAPProps) {
  const router = useRouter();
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');

  // Helper to generate default ref no
  const defaultRefNo = useMemo(() => {
    const id = projectCode || projectId || '';
    return id ? (id.toLowerCase().startsWith('axis/') ? id : `Axis/${id}`) : '';
  }, [projectCode, projectId]);

  // Initial State Setup
  const [fields, setFields] = useState<AxisHLLAPReportFields>(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : {};

    const defaultApprovedFloors: AxisHLLAPBUAFloor[] = Array.isArray(raw.approvedBUAFloors) && raw.approvedBUAFloors.length > 0
      ? raw.approvedBUAFloors
      : [
          { floor: 'Ground Floor', area: '' },
        ];

    const defaultMeasuredFloors: AxisHLLAPBUAFloor[] = Array.isArray(raw.measuredBUAFloors) && raw.measuredBUAFloors.length > 0
      ? raw.measuredBUAFloors
      : [
          { floor: 'Ground Floor', area: '' },
        ];

    return {
      ...raw,
      clientType: raw.clientType || 'organisation',
      organisationTemplate: raw.organisationTemplate || 'AXIS BANK',
      organisationSubTemplate: raw.organisationSubTemplate || 'HL_LAP',
      bankName: raw.bankName || 'AXIS BANK',

      // Header
      refNo: raw.refNo || defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || new Date()),

      // 1. Customer Details
      customerName: raw.customerName || prefill?.contactName || prefill?.serviceRequest?.guestName || '',
      customerContactDetails: raw.customerContactDetails || prefill?.contactPhone || prefill?.serviceRequest?.guestPhone || '',

      // 2. APP ID
      appId: raw.appId || prefill?.serviceRequest?.enquiryId || '',

      // 3. Documents Provided
      documentsProvided: raw.documentsProvided || '',

      // 4. Property Details
      propertyDetailsHeader: raw.propertyDetailsHeader || prefill?.propertyAddress || '',
      plotNo: raw.plotNo || '',
      khataNo: raw.khataNo || '',
      locality: raw.locality || '',
      road: raw.road || '',
      city: raw.city || prefill?.serviceRequest?.city || '',
      district: raw.district || prefill?.serviceRequest?.district || '',
      pinCode: raw.pinCode || prefill?.serviceRequest?.pincode || '',
      nearbyLandMark: raw.nearbyLandMark || '',
      distanceFromCityCenter: raw.distanceFromCityCenter || '',
      availabilityOfLocalTransport: raw.availabilityOfLocalTransport || '',
      levelOfLand: raw.levelOfLand || 'Regular level land',
      classOfLocality: raw.classOfLocality || 'Middle Class',
      qualityOfInfrastructure: raw.qualityOfInfrastructure || 'Good',

      // 4n. Boundaries (Deed vs Actual vs Sketch Map)
      boundaryEastDeed: raw.boundaryEastDeed || '',
      boundaryEastActual: raw.boundaryEastActual || '',
      boundaryWestDeed: raw.boundaryWestDeed || '',
      boundaryWestActual: raw.boundaryWestActual || '',
      boundaryNorthDeed: raw.boundaryNorthDeed || '',
      boundaryNorthActual: raw.boundaryNorthActual || '',
      boundarySouthDeed: raw.boundarySouthDeed || '',
      boundarySouthActual: raw.boundarySouthActual || '',

      boundaryEastSketch: raw.boundaryEastSketch || '',
      boundaryWestSketch: raw.boundaryWestSketch || '',
      boundaryNorthSketch: raw.boundaryNorthSketch || '',
      boundarySouthSketch: raw.boundarySouthSketch || '',

      // 4o - 4y
      boundariesMatch: raw.boundariesMatch || 'Matching',
      statusOfLand: raw.statusOfLand || 'Free Hold',
      typeOfProperty: raw.typeOfProperty || 'Residential',
      approvedUsage: raw.approvedUsage || 'Residential',
      actualUsage: raw.actualUsage || 'Residential',
      typeOfStructure: raw.typeOfStructure || 'RCC',
      noOfFloors: raw.noOfFloors || '',
      occupancyDetails: raw.occupancyDetails || 'Self Occupied',
      hasElectricityWaterDrainage: raw.hasElectricityWaterDrainage || 'Yes',
      proximityToCivicAmenities: raw.proximityToCivicAmenities || 'Nearby',
      developmentOfSurroundingArea: raw.developmentOfSurroundingArea || 'Developing',

      // 4z. Longitude & Latitude
      longitude: raw.longitude || '',
      latitude: raw.latitude || '',

      // 5. Layout & Building Plan Approval Details
      approvedPlanDetails: raw.approvedPlanDetails || '',
      layoutApprovalNo: raw.layoutApprovalNo || '',
      layoutApprovalDate: raw.layoutApprovalDate ? formatReportDate(raw.layoutApprovalDate) : '',
      layoutExpiryDate: raw.layoutExpiryDate ? formatReportDate(raw.layoutExpiryDate) : '',
      buildingPlanApprovalNo: raw.buildingPlanApprovalNo || '',
      buildingPlanApprovalDate: raw.buildingPlanApprovalDate ? formatReportDate(raw.buildingPlanApprovalDate) : '',
      buildingPlanExpiryDate: raw.buildingPlanExpiryDate ? formatReportDate(raw.buildingPlanExpiryDate) : '',
      constructionCommencementDate: raw.constructionCommencementDate ? formatReportDate(raw.constructionCommencementDate) : '',
      expectedCompletionDate: raw.expectedCompletionDate ? formatReportDate(raw.expectedCompletionDate) : '',

      // 6. Area Details
      plotOrFlat: raw.plotOrFlat || 'Plot',
      plotAreaDocs: raw.plotAreaDocs || '',
      plotAreaActual: raw.plotAreaActual || '',
      demarcationAtSite: raw.demarcationAtSite || '',
      approvedBUAFloors: defaultApprovedFloors,
      approvedBUATotal: raw.approvedBUATotal || '',
      measuredBUAFloors: defaultMeasuredFloors,
      measuredBUATotal: raw.measuredBUATotal || '',
      carpetAreaMeasuredTotal: raw.carpetAreaMeasuredTotal || '',
      constructionAsPerPlan: raw.constructionAsPerPlan || 'Yes',
      qualityOfConstruction: raw.qualityOfConstruction || 'Good',
      maintenanceOfProperty: raw.maintenanceOfProperty || 'Good',
      currentLifeOfStructure: raw.currentLifeOfStructure || '',
      projectedLifeOfStructure: raw.projectedLifeOfStructure || '',

      // 7. Recommended Valuation of the Property
      recommendedRatePerSqft: raw.recommendedRatePerSqft || '',
      plotAreaForValuation: raw.plotAreaForValuation || '',
      plotRateForValuation: raw.plotRateForValuation || '',
      valueOfPlotFlat: raw.valueOfPlotFlat || '',
      constructionRatePerSqft: raw.constructionRatePerSqft || '',
      proposedStructureType: raw.proposedStructureType || '',
      estimatedCostOfConstruction: raw.estimatedCostOfConstruction || '',
      totalCostOfConstruction: raw.totalCostOfConstruction || '',
      isUnderConstruction: raw.isUnderConstruction !== undefined ? raw.isUnderConstruction : false,
      constructionCostAsOnDate: raw.constructionCostAsOnDate || '',
      stageOfConstruction: raw.stageOfConstruction || '',
      percentWorkCompleted: raw.percentWorkCompleted || '',
      percentDisbursementRecommended: raw.percentDisbursementRecommended || '',
      currentValueOfProperty: raw.currentValueOfProperty || '',
      currentValueAsOnDate: raw.currentValueAsOnDate || '',
      dateOfPropertyVisit: formatReportDate(raw.dateOfPropertyVisit || raw.reportDate || prefill?.fieldVisitDate || new Date()),

      // 8 - 12
      valuationGovtReckonerRate: raw.valuationGovtReckonerRate || '',
      distressedPercentage: raw.distressedPercentage !== undefined ? raw.distressedPercentage : '80',
      distressedValuation: raw.distressedValuation || '',
      rentalValuePerMonth: raw.rentalValuePerMonth || '',
      photosAttached: raw.photosAttached || 'Attached',
      locationSketchAttached: raw.locationSketchAttached || 'Attached',
      remarks: raw.remarks || '',
      valuerName: raw.valuerName || 'Er. Satyajit Mohanty',
      valuerTitle: raw.valuerTitle || 'Approved Panel Valuer',

      // Annexure Arrays
      propertyImages: raw.propertyImages || [],
      propertyImageNames: raw.propertyImageNames || [],
      locationMapImages: raw.locationMapImages || [],
      mouzaMapImages: raw.mouzaMapImages || [],
      sketchMapImages: raw.sketchMapImages || [],
      cadastralMapImages: raw.cadastralMapImages || [],
    };
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [showSketchBoundaries, setShowSketchBoundaries] = useState<boolean>(() => {
    return !!(fields.boundaryEastSketch || fields.boundaryWestSketch || fields.boundaryNorthSketch || fields.boundarySouthSketch);
  });

  const handleChange = (k: keyof AxisHLLAPReportFields, v: any) => {
    setFields(p => ({ ...p, [k]: v }));
  };

  // Dynamically derive structure type (e.g. 'Proposed G+2', 'approved G+1') from BUA floors
  const effectiveStructureType = useMemo(() => {
    return deriveStructureType(fields);
  }, [
    fields.measuredBUAFloors,
    fields.approvedBUAFloors,
    fields.isUnderConstruction,
    fields.proposedStructureType,
  ]);

  const isInitialMount = useRef(true);
  // Autosave setup (1.2s debounce)
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);
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

  // Floor array management for Approved BUA
  const handleAddApprovedFloor = () => {
    const current = fields.approvedBUAFloors || [];
    const nextLbl = getFloorName(current.length);
    const nextList = [...current, { floor: nextLbl, area: '' }];
    const total = sumDecimals(nextList.map(f => f.area));
    setFields(p => ({
      ...p,
      approvedBUAFloors: nextList,
      approvedBUATotal: total > 0 ? formatExactDecimal(total) : '',
    }));
  };

  const handleRemoveApprovedFloor = (idx: number) => {
    const nextList = (fields.approvedBUAFloors || []).filter((_, i) => i !== idx);
    const total = sumDecimals(nextList.map(f => f.area));
    setFields(p => ({
      ...p,
      approvedBUAFloors: nextList,
      approvedBUATotal: total > 0 ? formatExactDecimal(total) : '',
    }));
  };

  const handleApprovedFloorChange = (idx: number, field: 'floor' | 'area', val: string) => {
    const cleanVal = field === 'area' ? sanitizePositiveFloat(val) : val;
    const nextList = (fields.approvedBUAFloors || []).map((f, i) =>
      i === idx ? { ...f, [field]: cleanVal } : f
    );
    const total = sumDecimals(nextList.map(f => f.area));
    setFields(p => ({
      ...p,
      approvedBUAFloors: nextList,
      approvedBUATotal: total > 0 ? formatExactDecimal(total) : '',
    }));
  };

  // Floor array management for Measured BUA
  const handleAddMeasuredFloor = () => {
    const current = fields.measuredBUAFloors || [];
    const nextLbl = getFloorName(current.length);
    const nextList = [...current, { floor: nextLbl, area: '' }];
    const total = sumDecimals(nextList.map(f => f.area));
    setFields(p => ({
      ...p,
      measuredBUAFloors: nextList,
      measuredBUATotal: total > 0 ? formatExactDecimal(total) : '',
    }));
  };

  const handleRemoveMeasuredFloor = (idx: number) => {
    const nextList = (fields.measuredBUAFloors || []).filter((_, i) => i !== idx);
    const total = sumDecimals(nextList.map(f => f.area));
    setFields(p => ({
      ...p,
      measuredBUAFloors: nextList,
      measuredBUATotal: total > 0 ? formatExactDecimal(total) : '',
    }));
  };

  const handleMeasuredFloorChange = (idx: number, field: 'floor' | 'area', val: string) => {
    const cleanVal = field === 'area' ? sanitizePositiveFloat(val) : val;
    const nextList = (fields.measuredBUAFloors || []).map((f, i) =>
      i === idx ? { ...f, [field]: cleanVal } : f
    );
    const total = sumDecimals(nextList.map(f => f.area));
    setFields(p => ({
      ...p,
      measuredBUAFloors: nextList,
      measuredBUATotal: total > 0 ? formatExactDecimal(total) : '',
    }));
  };

  // Real-time auto-calculation for Section 7 Valuation fields
  useEffect(() => {
    const selectedUnit = fields.plotOrFlat || 'Plot';
    const pArea = parseNum(fields.plotAreaDocs) || parseNum(fields.plotAreaForValuation);
    const pRate = parseNum(fields.plotRateForValuation);
    const pVal = pArea > 0 && pRate > 0 ? pArea * pRate : 0;

    const buaTotal = parseNum(fields.approvedBUATotal) || parseNum(fields.measuredBUATotal);
    // Valuer assessed construction rate per sqft
    const cRate = parseNum(fields.constructionRatePerSqft);
    const cVal = buaTotal > 0 && cRate > 0 ? buaTotal * cRate : 0;

    const total100 = pVal + cVal;

    const hasPct = fields.percentWorkCompleted !== undefined && String(fields.percentWorkCompleted).trim() !== '';
    const pct = hasPct ? parseNum(fields.percentWorkCompleted) : (fields.isUnderConstruction ? 0 : 100);
    const isUnderConst = fields.isUnderConstruction || pct < 100;

    const cRateAsOnDate = cRate > 0 && isUnderConst ? Math.round(cRate * (pct / 100)) : 0;
    const cValAsOnDate = cVal > 0 && isUnderConst ? Math.round(cVal * (pct / 100)) : 0;
    const totalAsOnDate = pVal + cValAsOnDate;

    const distressedPct = fields.distressedPercentage !== undefined && fields.distressedPercentage !== ''
      ? parseNum(fields.distressedPercentage)
      : 80;
    const distressedVal = Math.round(total100 * (distressedPct / 100));

    const valPlotFlatStr = pArea > 0 && pRate > 0
      ? `Value of ${selectedUnit}-${pArea} sqft X Rs.${pRate}/- = Rs.${formatIndianCurrency(pVal)}/-`
      : '';

    const totalConstStr = buaTotal > 0 && cRate > 0
      ? `${buaTotal}sqft@ Rs.${cRate}/-=Rs.${formatIndianCurrency(cVal)}/-`
      : '';

    const constAsOnDateStr = buaTotal > 0 && isUnderConst && (cValAsOnDate > 0 || pct === 0)
      ? `${buaTotal}sqft@ Rs.${cRateAsOnDate}/-= Rs.${formatIndianCurrency(cValAsOnDate)}/-`
      : '';

    const currentValStr = pVal > 0 && cVal > 0
      ? `Rs.${formatIndianCurrency(pVal)}/- + Rs.${formatIndianCurrency(cVal)}/- =Rs.${formatIndianCurrency(total100)}/-`
      : pVal > 0
      ? `Rs.${formatIndianCurrency(pVal)}/-`
      : cVal > 0
      ? `Rs.${formatIndianCurrency(cVal)}/-`
      : '';

    const currentValAsOnDateStr = isUnderConst && (pVal > 0 || cValAsOnDate > 0)
      ? `Rs.${formatIndianCurrency(pVal)}/- + Rs.${formatIndianCurrency(cValAsOnDate)}/- =Rs.${formatIndianCurrency(totalAsOnDate)}/-`
      : '';

    const distressedStr = distressedVal > 0 && total100 > 0
      ? `Rs.${formatIndianCurrency(distressedVal)}/-`
      : '';

    setFields(prev => {
      let changed = false;
      const next = { ...prev };

      // Ensure plotAreaForValuation stays synced with 6a plotAreaDocs
      const syncAreaStr = pArea > 0 ? String(pArea) : '';
      if (syncAreaStr && next.plotAreaForValuation !== syncAreaStr) {
        next.plotAreaForValuation = syncAreaStr;
        changed = true;
      }

      if (next.valueOfPlotFlat !== valPlotFlatStr) {
        next.valueOfPlotFlat = valPlotFlatStr;
        changed = true;
      }
      if (next.totalCostOfConstruction !== totalConstStr) {
        next.totalCostOfConstruction = totalConstStr;
        changed = true;
      }
      if (next.constructionCostAsOnDate !== constAsOnDateStr) {
        next.constructionCostAsOnDate = constAsOnDateStr;
        changed = true;
      }
      if (next.currentValueOfProperty !== currentValStr) {
        next.currentValueOfProperty = currentValStr;
        changed = true;
      }
      if (next.currentValueAsOnDate !== currentValAsOnDateStr) {
        next.currentValueAsOnDate = currentValAsOnDateStr;
        changed = true;
      }
      if (next.distressedValuation !== distressedStr) {
        next.distressedValuation = distressedStr;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    fields.plotAreaForValuation,
    fields.plotAreaDocs,
    fields.plotRateForValuation,
    fields.approvedBUATotal,
    fields.measuredBUATotal,
    fields.constructionRatePerSqft,
    fields.percentWorkCompleted,
    fields.isUnderConstruction,
    fields.distressedPercentage,
    fields.plotOrFlat,
  ]);

  // File Upload Handlers for Maps
  const handleMapUpload = async (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(fieldKey);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${fieldKey}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const urls = await Promise.all(uploadPromises);
      setFields(p => ({
        ...p,
        [fieldKey]: [...(p[fieldKey] || []), ...urls],
      }));
    } catch (err: any) {
      alert(`Error uploading map: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMapRemove = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages', idx?: number) => {
    if (idx === undefined) {
      setFields(p => ({ ...p, [fieldKey]: [] }));
      return;
    }
    setFields(p => ({
      ...p,
      [fieldKey]: (p[fieldKey] || []).filter((_, i) => i !== idx),
    }));
  };

  const handleMapReorder = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages', reordered: string[]) => {
    setFields(p => ({
      ...p,
      [fieldKey]: reordered,
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading('photos');
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `prop_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;
        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);
        return urlData.publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      setFields(p => ({
        ...p,
        propertyImages: [...(p.propertyImages || []), ...urls],
        propertyImageNames: [
          ...(p.propertyImageNames || []),
          ...urls.map(() => DEFAULT_PHOTO_LABEL),
        ],
      }));
    } catch (err: any) {
      alert(`Error uploading photos: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoRemove = (idx: number) => {
    setFields(p => ({
      ...p,
      propertyImages: (p.propertyImages || []).filter((_, i) => i !== idx),
      propertyImageNames: (p.propertyImageNames || []).filter((_, i) => i !== idx),
    }));
  };

  const handlePhotoRename = (idx: number, name: string) => {
    const arr = [...(fields.propertyImageNames || [])];
    arr[idx] = name;
    setFields(p => ({ ...p, propertyImageNames: arr }));
  };

  const handlePhotoReorder = (newImages: string[], newNames: string[]) => {
    setFields(p => ({ ...p, propertyImages: newImages, propertyImageNames: newNames }));
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      setMessage({ type: 'success', text: 'Report draft saved successfully.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save draft' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for manager verification?')) return;
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      await submitReportForVerification(projectId);
      router.push(`/portal/projects/${projectId}`);
    } catch (err: any) {
      alert(`Submission error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // PDF Generator helper
  const buildPDF = async (): Promise<Uint8Array> => {
    const propImages = fields.propertyImages || [];
    const photoNames = fields.propertyImageNames || [];
    const photoBytesList: { bytes: Uint8Array; label?: string }[] = [];
    for (let i = 0; i < propImages.length; i++) {
      const b = await fetchBytes(propImages[i]);
      if (b) {
        photoBytesList.push({ bytes: b, label: photoNames[i] || DEFAULT_PHOTO_LABEL });
      }
    }

    const locMapBytes = (await Promise.all((fields.locationMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const mouzaMapBytes = (await Promise.all((fields.mouzaMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const sketchMapBytes = (await Promise.all((fields.sketchMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const cadastralMapBytes = (await Promise.all((fields.cadastralMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    const renderer = new PDFAxisHLLAPRenderer();
    return await renderer.generateAxisHLLAPReport(
      fields,
      {
        photos: photoBytesList,
        locationMaps: locMapBytes,
        mouzaMaps: mouzaMapBytes,
        sketchMaps: sketchMapBytes,
        cadastralMaps: cadastralMapBytes,
      }
    );
  };

  const handlePreviewPDF = async () => {
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Generating Axis Bank HL-LAP PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #97144d; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating Axis Bank HL-LAP PDF Preview...</p>
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
      const pdfBytes = await buildPDF();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
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
      alert('Error generating PDF preview: ' + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const pdfBytes = await buildPDF();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Axis_HL_LAP_${fields.customerName || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error downloading PDF: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const NAV_SECTIONS: NavItem[] = [
    { id: 'axis-sec1', title: 'Applicant & Application (1–3)' },
    { id: 'axis-sec2', title: 'Property Details & Boundaries (4)' },
    { id: 'axis-sec3', title: 'Approval Details (5)' },
    { id: 'axis-sec4', title: 'Construction & Built-Up Area (6)' },
    { id: 'axis-sec5', title: 'Recommended Valuation (7–10)' },
    { id: 'axis-sec6', title: 'Attachments & Remarks (11–12)' },
    { id: 'axis-sec7', title: 'Undertaking & Valuer Signatory' },
    { id: 'axis-photos', title: 'Property Photographs' },
    { id: 'axis-maps', title: 'Location & Sketch Maps' },
  ];

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Top Active Configuration Banner */}
        <ActiveConfigBanner
          clientType={(fields.clientType as 'organisation' | 'individual') || 'organisation'}
          category={fields.institutionCategory || 'Bank & FIS'}
          bankName={fields.bankName || fields.organisationTemplate || 'AXIS BANK'}
          subclass={fields.organisationSubTemplate || 'HL-LAP'}
          serviceType={fields.serviceType}
          subjectType={fields.subjectType}
          onResetWizard={onResetWizard}
        />

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

        {/* ════ SECTION 1: APPLICANT & APPLICATION DETAILS (POINTS 1–3) ════ */}
        <Section
          title="1. Applicant & Application Details (Points 1–3)"
          number={1}
          id="axis-sec1"
          defaultOpen={true}
        >
          {/* Header Metadata Container (Soft Amber) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-amber-200 bg-[#FFFBEB] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Reference Number (Auto-assigned)">
                  <input
                    type="text"
                    value={fields.refNo}
                    onChange={e => handleChange('refNo', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <BaseDateInput
                  label="Date of Report"
                  value={fields.reportDate || ''}
                  onChange={val => handleChange('reportDate', val)}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Point 1: Customer Details (Soft Container - Soft Indigo) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-indigo-200 bg-[#EEF2FF] rounded-xl p-4 sm:p-5 shadow-2xs">
              <div className="text-xs font-bold text-indigo-900 uppercase tracking-wider mb-3">
                1. Customer Details
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name of the Customer">
                  <input
                    type="text"
                    value={fields.customerName}
                    onChange={e => handleChange('customerName', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Customer Contact Details">
                  <input
                    type="text"
                    value={fields.customerContactDetails}
                    onChange={e => handleChange('customerContactDetails', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Point 2: APP ID (Separate Line) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <Field label="2. APP ID / Loan Account No">
              <input
                type="text"
                value={fields.appId}
                onChange={e => handleChange('appId', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* Point 3: Documents Provided (Separate Line - Full Question) */}
          <div className="pt-2">
            <Field label="3. Documents Provided: Approved Layout/ Approved Building Plan/ NA order/ Four Boundaries Details">
              <input
                type="text"
                value={fields.documentsProvided}
                onChange={e => handleChange('documentsProvided', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 2: Property Details & Boundaries (4) */}
        <Section id="axis-sec2" title="Property Details & Boundaries (4)" number={2} defaultOpen={true}>
          {/* 4. Full Property Description */}
          <div className="pb-4 border-b border-slate-200">
            <Field label="4. Property Details (Full Description / Header Summary)">
              <textarea
                rows={3}
                value={fields.propertyDetailsHeader}
                onChange={e => handleChange('propertyDetailsHeader', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* 4a - 4m: Locational & Infrastructure Details (Soft Container - Cool Slate) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-slate-200 bg-[#F8FAFC] rounded-xl p-4 sm:p-5 shadow-2xs">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                Locational &amp; Infrastructure Details (a – m)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="a. Plot No">
                  <input
                    type="text"
                    value={fields.plotNo}
                    onChange={e => handleChange('plotNo', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="b. S No / G. No / Khasra No / Khata No">
                  <input
                    type="text"
                    value={fields.khataNo}
                    onChange={e => handleChange('khataNo', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="c. Locality">
                  <input
                    type="text"
                    value={fields.locality}
                    onChange={e => handleChange('locality', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="d. Road (Width / Description)">
                  <input
                    type="text"
                    value={fields.road}
                    onChange={e => handleChange('road', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="e. City">
                  <input
                    type="text"
                    value={fields.city}
                    onChange={e => handleChange('city', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="f. District">
                  <input
                    type="text"
                    value={fields.district}
                    onChange={e => handleChange('district', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="g. Pin Code">
                  <input
                    type="text"
                    value={fields.pinCode}
                    onChange={e => handleChange('pinCode', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="h. Nearby Land Mark">
                  <input
                    type="text"
                    value={fields.nearbyLandMark}
                    onChange={e => handleChange('nearbyLandMark', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="i. Distance from City Center">
                  <input
                    type="text"
                    value={fields.distanceFromCityCenter}
                    onChange={e => handleChange('distanceFromCityCenter', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                    placeholder="e.g. 5"
                  />
                </Field>

                <Field label="j. Availability of Local Transport">
                  <input
                    type="text"
                    value={fields.availabilityOfLocalTransport}
                    onChange={e => handleChange('availabilityOfLocalTransport', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="k. Level of Land">
                  <select
                    value={fields.levelOfLand}
                    onChange={e => handleChange('levelOfLand', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Regular level land">Regular level land</option>
                    <option value="Low land">Low land</option>
                    <option value="Sloping land">Sloping land</option>
                    <option value="Elevated land">Elevated land</option>
                  </select>
                </Field>

                <Field label="l. Class of Locality">
                  <select
                    value={fields.classOfLocality}
                    onChange={e => handleChange('classOfLocality', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Middle Class">Middle Class</option>
                    <option value="Higher Middle Class">Higher Middle Class</option>
                    <option value="Posh">Posh</option>
                    <option value="Lower Middle Class">Lower Middle Class</option>
                    <option value="Poor">Poor</option>
                  </select>
                </Field>

                <Field span={3} label="m. Quality of Infrastructure in the Vicinity">
                  <select
                    value={fields.qualityOfInfrastructure}
                    onChange={e => handleChange('qualityOfInfrastructure', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Developing">Developing</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* n. Boundaries Comparison Table (Soft Container - Soft Purple) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-purple-200 bg-[#FAF5FF] rounded-xl p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-purple-900 text-sm tracking-wide uppercase">
                  n. Boundaries of Property (Deed vs Actual vs Sketch Map)
                </h3>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="sketchToggle"
                    checked={showSketchBoundaries}
                    onChange={e => setShowSketchBoundaries(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="sketchToggle" className="text-xs font-semibold text-purple-900 cursor-pointer">
                    Include Sketch Map Boundaries
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-2xs">
                <table className="w-full text-xs text-left">
                  <thead className="bg-purple-100/70 text-purple-900 font-bold uppercase">
                    <tr>
                      <th className="p-3 border-b border-r border-purple-200 w-24">Direction</th>
                      <th className="p-3 border-b border-r border-purple-200">As Per Documents / Sale Deed</th>
                      <th className="p-3 border-b border-r border-purple-200">As Per Actual (Site)</th>
                      {showSketchBoundaries && <th className="p-3 border-b border-purple-200">As Per Sketch Map</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 bg-slate-50 border-r border-slate-200">East</td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={fields.boundaryEastDeed}
                          onChange={e => handleChange('boundaryEastDeed', e.target.value)}
                          className={inputCls}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={fields.boundaryEastActual}
                          onChange={e => handleChange('boundaryEastActual', e.target.value)}
                          className={inputCls}
                          disabled={isReadOnly}
                        />
                      </td>
                      {showSketchBoundaries && (
                        <td className="p-2">
                          <input
                            type="text"
                            value={fields.boundaryEastSketch || ''}
                            onChange={e => handleChange('boundaryEastSketch', e.target.value)}
                            className={inputCls}
                            disabled={isReadOnly}
                          />
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 bg-slate-50 border-r border-slate-200">West</td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={fields.boundaryWestDeed}
                          onChange={e => handleChange('boundaryWestDeed', e.target.value)}
                          className={inputCls}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={fields.boundaryWestActual}
                          onChange={e => handleChange('boundaryWestActual', e.target.value)}
                          className={inputCls}
                          disabled={isReadOnly}
                        />
                      </td>
                      {showSketchBoundaries && (
                        <td className="p-2">
                          <input
                            type="text"
                            value={fields.boundaryWestSketch || ''}
                            onChange={e => handleChange('boundaryWestSketch', e.target.value)}
                            className={inputCls}
                            disabled={isReadOnly}
                          />
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 bg-slate-50 border-r border-slate-200">North</td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={fields.boundaryNorthDeed}
                          onChange={e => handleChange('boundaryNorthDeed', e.target.value)}
                          className={inputCls}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={fields.boundaryNorthActual}
                          onChange={e => handleChange('boundaryNorthActual', e.target.value)}
                          className={inputCls}
                          disabled={isReadOnly}
                        />
                      </td>
                      {showSketchBoundaries && (
                        <td className="p-2">
                          <input
                            type="text"
                            value={fields.boundaryNorthSketch || ''}
                            onChange={e => handleChange('boundaryNorthSketch', e.target.value)}
                            className={inputCls}
                            disabled={isReadOnly}
                          />
                        </td>
                      )}
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-700 bg-slate-50 border-r border-slate-200">South</td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={fields.boundarySouthDeed}
                          onChange={e => handleChange('boundarySouthDeed', e.target.value)}
                          className={inputCls}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={fields.boundarySouthActual}
                          onChange={e => handleChange('boundarySouthActual', e.target.value)}
                          className={inputCls}
                          disabled={isReadOnly}
                        />
                      </td>
                      {showSketchBoundaries && (
                        <td className="p-2">
                          <input
                            type="text"
                            value={fields.boundarySouthSketch || ''}
                            onChange={e => handleChange('boundarySouthSketch', e.target.value)}
                            className={inputCls}
                            disabled={isReadOnly}
                          />
                        </td>
                      )}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 4o - 4s: Property Attributes & Usage (Soft Container - Soft Emerald) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-emerald-200 bg-[#ECFDF5] rounded-xl p-4 sm:p-5 shadow-2xs">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="o. Boundaries Match Verification">
                  <select
                    value={fields.boundariesMatch}
                    onChange={e => handleChange('boundariesMatch', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Yes(Boundary is matching as per sketch map)">Yes(Boundary is matching as per sketch map)</option>
                    <option value="Yes(Boundary matching as per documents)">Yes(Boundary matching as per documents)</option>
                    <option value="No - Boundaries do not match">No - Boundaries do not match</option>
                    <option value="Partial match observed">Partial match observed</option>
                  </select>
                </Field>

                <Field label="p. Status of the Land">
                  <select
                    value={fields.statusOfLand}
                    onChange={e => handleChange('statusOfLand', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Free Hold">Free Hold</option>
                    <option value="Lease Hold">Lease Hold</option>
                    <option value="Development Authority">Development Authority</option>
                  </select>
                </Field>

                <Field label="q. Type of Property">
                  <select
                    value={fields.typeOfProperty}
                    onChange={e => handleChange('typeOfProperty', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Residential (Under construction)">Residential (Under construction)</option>
                    <option value="Residential">Residential</option>
                    <option value="Bungalow">Bungalow</option>
                    <option value="Row House">Row House</option>
                    <option value="Individual House">Individual House</option>
                    <option value="Plot">Plot</option>
                    <option value="Flat (1BHK/2BHK/3BHK)">Flat (1BHK/2BHK/3BHK)</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </Field>

                <Field label="r. Approved Usage">
                  <select
                    value={fields.approvedUsage}
                    onChange={e => handleChange('approvedUsage', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed">Mixed</option>
                    <option value="Industrial">Industrial</option>
                    <option value="Agricultural">Agricultural</option>
                  </select>
                </Field>

                <Field label="s. Actual Usage of Property">
                  <select
                    value={fields.actualUsage}
                    onChange={e => handleChange('actualUsage', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Under construction">Under construction</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* 4t - 4y: Structure, Occupancy & Utilities (Soft Container - Soft Teal) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-teal-200 bg-[#F0FDFA] rounded-xl p-4 sm:p-5 shadow-2xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="t. Type of Structure">
                  <input
                    type="text"
                    value={fields.typeOfStructure}
                    onChange={e => handleChange('typeOfStructure', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="u. No of Floors">
                  <input
                    type="text"
                    value={fields.noOfFloors}
                    onChange={e => handleChange('noOfFloors', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="v. Occupancy Details">
                  <select
                    value={fields.occupancyDetails}
                    onChange={e => handleChange('occupancyDetails', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Under construction">Under construction</option>
                    <option value="Self Occupied">Self Occupied</option>
                    <option value="Rented">Rented</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                </Field>

                <Field label="w. Electricity, Water & Drainage">
                  <select
                    value={fields.hasElectricityWaterDrainage}
                    onChange={e => handleChange('hasElectricityWaterDrainage', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                    <option value="Partial">Partial</option>
                  </select>
                </Field>

                <Field label="x. Proximity to Civic Amenities">
                  <input
                    type="text"
                    value={fields.proximityToCivicAmenities}
                    onChange={e => handleChange('proximityToCivicAmenities', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="y. Development of Surrounding Area">
                  <input
                    type="text"
                    value={fields.developmentOfSurroundingArea}
                    onChange={e => handleChange('developmentOfSurroundingArea', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* z. Longitude & Latitude Coordinates (Soft Container - Soft Cyan) */}
          <div className="pt-2">
            <div className="border border-cyan-200 bg-[#ECFEFF] rounded-xl p-5 shadow-2xs">
              <div className="mb-3">
                <h3 className="font-semibold text-cyan-900 text-sm tracking-wide uppercase">
                  z. Longitude &amp; Latitude Coordinates
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="i. Longitude">
                  <input
                    type="text"
                    value={fields.longitude}
                    onChange={e => handleChange('longitude', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="ii. Latitude">
                  <input
                    type="text"
                    value={fields.latitude}
                    onChange={e => handleChange('latitude', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION 3: Approval Details (5) */}
        <Section id="axis-sec3" title="Approval Details (5)" number={3} defaultOpen={true}>
          {/* 5. Header Summary Note */}
          <div className="pb-4 border-b border-slate-200">
            <Field label="5. Approval Details (Header Summary Note)">
              <textarea
                rows={2}
                value={fields.approvedPlanDetails}
                onChange={e => handleChange('approvedPlanDetails', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* 5a - 5c: Layout Approval Sub-Container (Soft Blue) with 5b-5c Sub-Subcontainer */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-blue-200 bg-[#F0F7FF] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <Field label="a. Layout Approval No">
                <input
                  type="text"
                  value={fields.layoutApprovalNo}
                  onChange={e => handleChange('layoutApprovalNo', e.target.value)}
                  className={inputCls}
                  disabled={isReadOnly}
                />
              </Field>

              {/* 5b - 5c Sub-Subcontainer */}
              <div className="border border-blue-200/80 bg-white rounded-lg p-3.5 sm:p-4 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <BaseDateInput
                    label="b. Date of Approval"
                    value={fields.layoutApprovalDate || ''}
                    onChange={val => handleChange('layoutApprovalDate', val)}
                    disabled={isReadOnly}
                  />
                  <BaseDateInput
                    label="c. Expiry Date"
                    value={fields.layoutExpiryDate || ''}
                    onChange={val => handleChange('layoutExpiryDate', val)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5d - 5f: Building Plan Approval Sub-Container (Soft Teal) with 5e-5f Sub-Subcontainer */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-teal-200 bg-[#F0FDFA] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <Field label="d. Building Plan Approval No">
                <input
                  type="text"
                  value={fields.buildingPlanApprovalNo}
                  onChange={e => handleChange('buildingPlanApprovalNo', e.target.value)}
                  className={inputCls}
                  disabled={isReadOnly}
                />
              </Field>

              {/* 5e - 5f Sub-Subcontainer */}
              <div className="border border-teal-200/80 bg-white rounded-lg p-3.5 sm:p-4 shadow-2xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <BaseDateInput
                    label="e. Date of Approval"
                    value={fields.buildingPlanApprovalDate || ''}
                    onChange={val => handleChange('buildingPlanApprovalDate', val)}
                    disabled={isReadOnly}
                  />
                  <BaseDateInput
                    label="f. Expiry Date"
                    value={fields.buildingPlanExpiryDate || ''}
                    onChange={val => handleChange('buildingPlanExpiryDate', val)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 5g - 5h: Construction Timeline Sub-Container (Soft Rose) */}
          <div className="pt-2">
            <div className="border border-rose-200 bg-[#FFF1F2] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <BaseDateInput
                  label="g. Date of Commencement of Construction"
                  value={fields.constructionCommencementDate || ''}
                  onChange={val => handleChange('constructionCommencementDate', val)}
                  disabled={isReadOnly}
                />

                <BaseDateInput
                  label="h. Expected Completion"
                  value={fields.expectedCompletionDate || ''}
                  onChange={val => handleChange('expectedCompletionDate', val)}
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION 4: Construction Details & Built-Up Area (6) */}
        <Section id="axis-sec4" title="Construction Details & Built-Up Area (6)" number={4} defaultOpen={true}>
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            6. Construction Details
          </div>

          {/* 6a - 6b: Plot / Flat Area & Demarcation (Soft Container - Soft Indigo) */}
          <div className="pb-4 border-b border-slate-200">
            <div className="border border-indigo-200 bg-[#EEF2FF] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <Field label="a. Area of the Plot / Flat (as per documents)">
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 p-1 bg-white rounded-lg w-fit border border-indigo-200 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleChange('plotOrFlat', 'Plot')}
                      disabled={isReadOnly}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        (fields.plotOrFlat || 'Plot') === 'Plot'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Plot
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('plotOrFlat', 'Flat')}
                      disabled={isReadOnly}
                      className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                        fields.plotOrFlat === 'Flat'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Flat
                    </button>
                  </div>
                  <input
                    type="text"
                    value={fields.plotAreaDocs}
                    onChange={e => handleChange('plotAreaDocs', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                    placeholder="e.g. 1500"
                  />
                </div>
              </Field>

              <Field label="b. Demarcation at Site">
                <select
                  value={fields.demarcationAtSite}
                  onChange={e => handleChange('demarcationAtSite', e.target.value)}
                  className={selectCls}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Partial">Partial</option>
                </select>
              </Field>
            </div>
          </div>

          {/* 6c: Approved Built Up Area (BUA) Floor Breakup (Arthan Visual Pattern) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  c. Approved Built Up Area (BUA) Floor Breakup
                </div>
                <div className="text-xs text-slate-500">
                  Approved Total: <strong className="font-mono text-slate-900">{fields.approvedBUATotal ? `${fields.approvedBUATotal} sqft` : '0 sqft'}</strong>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0a1628] text-white">
                      <th className="px-3 py-2.5 text-center font-normal text-xs uppercase tracking-wider w-12">#</th>
                      <th className="px-3 py-2.5 text-left font-normal text-xs uppercase tracking-wider">Floor Name / Description</th>
                      <th className="px-3 py-2.5 text-right font-normal text-xs uppercase tracking-wider w-48">Area (Sq.Ft.)</th>
                      {!isReadOnly && <th className="px-2 py-2.5 w-10 text-center"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(fields.approvedBUAFloors || []).length === 0 ? (
                      <tr>
                        <td colSpan={!isReadOnly ? 4 : 3} className="px-3 py-4 text-center text-xs text-slate-400 italic">
                          No floors added. Click &quot;+ Add Floor Details&quot; below to add a floor.
                        </td>
                      </tr>
                    ) : (
                      (fields.approvedBUAFloors || []).map((fl, idx) => (
                        <tr key={idx} className="bg-white hover:bg-neutral-50/50 transition-colors">
                          <td className="px-2 py-1.5 text-center text-slate-400 font-medium text-xs">{idx + 1}</td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={fl.floor || ''}
                              onChange={e => handleApprovedFloorChange(idx, 'floor', e.target.value)}
                              className={inputCls + ' py-1.5! text-xs font-normal text-[#0f2038]'}
                              disabled={isReadOnly}
                              placeholder="e.g. Ground Floor"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={fl.area || ''}
                              onChange={e => handleApprovedFloorChange(idx, 'area', e.target.value)}
                              className={inputCls + ' py-1.5! text-xs text-right font-medium'}
                              disabled={isReadOnly}
                              placeholder="0"
                            />
                          </td>
                          {!isReadOnly && (
                            <td className="px-2 py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveApprovedFloor(idx)}
                                className="text-red-400 hover:text-red-600 text-lg leading-none cursor-pointer p-1 font-bold transition-colors"
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
                      <td colSpan={2} className="px-3 py-2.5 text-slate-800 font-bold uppercase tracking-wider">
                        Approved BUA Total:
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-900 font-bold font-mono">
                        {fields.approvedBUATotal ? `${fields.approvedBUATotal} sqft` : '0 sqft'}
                      </td>
                      {!isReadOnly && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddApprovedFloor}
                  className="text-sm text-accent-500 hover:text-[#96700a] font-semibold flex items-center gap-1.5 pt-1 cursor-pointer transition-colors"
                >
                  <span className="text-lg leading-none font-bold">+</span> Add Floor Details
                </button>
              )}
            </div>
          </div>

          {/* 6d: Measured Built Up Area (BUA) Floor Breakup (Arthan Visual Pattern) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  d. Measured Built Up Area (BUA) Floor Breakup
                </div>
                <div className="text-xs text-slate-500">
                  Measured Total: <strong className="font-mono text-slate-900">{fields.measuredBUATotal ? `${fields.measuredBUATotal} sqft` : '0 sqft'}</strong>
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0a1628] text-white">
                      <th className="px-3 py-2.5 text-center font-normal text-xs uppercase tracking-wider w-12">#</th>
                      <th className="px-3 py-2.5 text-left font-normal text-xs uppercase tracking-wider">Floor Name / Description</th>
                      <th className="px-3 py-2.5 text-right font-normal text-xs uppercase tracking-wider w-48">Area (Sq.Ft.)</th>
                      {!isReadOnly && <th className="px-2 py-2.5 w-10 text-center"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(fields.measuredBUAFloors || []).length === 0 ? (
                      <tr>
                        <td colSpan={!isReadOnly ? 4 : 3} className="px-3 py-4 text-center text-xs text-slate-400 italic">
                          No floors added. Click &quot;+ Add Floor Details&quot; below to add a floor.
                        </td>
                      </tr>
                    ) : (
                      (fields.measuredBUAFloors || []).map((fl, idx) => (
                        <tr key={idx} className="bg-white hover:bg-neutral-50/50 transition-colors">
                          <td className="px-2 py-1.5 text-center text-slate-400 font-medium text-xs">{idx + 1}</td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              value={fl.floor || ''}
                              onChange={e => handleMeasuredFloorChange(idx, 'floor', e.target.value)}
                              className={inputCls + ' py-1.5! text-xs font-normal text-[#0f2038]'}
                              disabled={isReadOnly}
                              placeholder="e.g. Ground Floor"
                            />
                          </td>
                          <td className="px-2 py-1.5">
                            <input
                              type="text"
                              inputMode="decimal"
                              value={fl.area || ''}
                              onChange={e => handleMeasuredFloorChange(idx, 'area', e.target.value)}
                              className={inputCls + ' py-1.5! text-xs text-right font-medium'}
                              disabled={isReadOnly}
                              placeholder="0"
                            />
                          </td>
                          {!isReadOnly && (
                            <td className="px-2 py-1.5 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveMeasuredFloor(idx)}
                                className="text-red-400 hover:text-red-600 text-lg leading-none cursor-pointer p-1 font-bold transition-colors"
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
                      <td colSpan={2} className="px-3 py-2.5 text-slate-800 font-bold uppercase tracking-wider">
                        Measured BUA Total:
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-900 font-bold font-mono">
                        {fields.measuredBUATotal ? `${fields.measuredBUATotal} sqft` : '0 sqft'}
                      </td>
                      {!isReadOnly && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddMeasuredFloor}
                  className="text-sm text-accent-500 hover:text-[#96700a] font-semibold flex items-center gap-1.5 pt-1 cursor-pointer transition-colors"
                >
                  <span className="text-lg leading-none font-bold">+</span> Add Floor Details
                </button>
              )}
            </div>
          </div>

          {/* 6e - 6f: Plan Compliance & Extra Construction (Soft Container - Cool Slate) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-slate-200 bg-[#F8FAFC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="e. Construction as per Approved Building Plan">
                  <select
                    value={fields.isConstructionAsPerPlan}
                    onChange={e => handleChange('isConstructionAsPerPlan', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="Yes as per approved plan">Yes as per approved plan</option>
                    <option value="Not as per approved plan">Not as per approved plan</option>
                    <option value="Deviation observed">Deviation observed</option>
                    <option value="Unauthorized construction">Unauthorized construction</option>
                  </select>
                </Field>

                <Field label="f. Details of Extra Construction">
                  <input
                    type="text"
                    value={fields.detailsOfExtraConstruction}
                    onChange={e => handleChange('detailsOfExtraConstruction', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* g. Recommended / Available Side Margin (Soft Container - Soft Violet) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-violet-200 bg-[#FAF5FF] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
              <h3 className="font-semibold text-violet-900 text-sm tracking-wide">
                g. Recommended / Available Side Margin
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-violet-200/80 shadow-2xs">
                <Field label="Front (ft)">
                  <input
                    type="text"
                    value={fields.sideMarginFront}
                    onChange={e => handleChange('sideMarginFront', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                    placeholder="e.g. 5"
                  />
                </Field>
                <Field label="Right Side (ft)">
                  <input
                    type="text"
                    value={fields.sideMarginRight}
                    onChange={e => handleChange('sideMarginRight', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                    placeholder="e.g. 3"
                  />
                </Field>
                <Field label="Left Side (ft)">
                  <input
                    type="text"
                    value={fields.sideMarginLeft}
                    onChange={e => handleChange('sideMarginLeft', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                    placeholder="e.g. 3"
                  />
                </Field>
                <Field label="Back Side (ft)">
                  <input
                    type="text"
                    value={fields.sideMarginBack}
                    onChange={e => handleChange('sideMarginBack', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                    placeholder="e.g. 5"
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* 6h - 6i: Construction Quality & Maintenance (Soft Container - Soft Emerald) */}
          <div className="pt-2 pb-4 border-b border-slate-200">
            <div className="border border-emerald-200 bg-[#ECFDF5] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="h. Quality of Construction">
                  <select
                    value={fields.qualityOfConstruction || 'NA'}
                    onChange={e => handleChange('qualityOfConstruction', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="NA">NA</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </Field>

                <Field label="i. Maintenance of the Property">
                  <select
                    value={fields.maintenanceOfProperty || 'NA'}
                    onChange={e => handleChange('maintenanceOfProperty', e.target.value)}
                    className={selectCls}
                    disabled={isReadOnly}
                  >
                    <option value="NA">NA</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Very Good">Very Good</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                  </select>
                </Field>
              </div>
            </div>
          </div>

          {/* 6j - 6k: Structure Life Assessment (Soft Container - Sky Blue) */}
          <div className="pt-2">
            <div className="border border-sky-200 bg-[#F0F9FF] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="j. Current Life of Structure (years)">
                  <input
                    type="text"
                    value={fields.currentLifeOfStructure}
                    onChange={e => handleChange('currentLifeOfStructure', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                    placeholder="e.g. 5"
                  />
                </Field>

                <Field label="k. Projected Life of Structure (years)">
                  <input
                    type="text"
                    value={fields.projectedLifeOfStructure}
                    onChange={e => handleChange('projectedLifeOfStructure', sanitizePositiveFloat(e.target.value))}
                    className={inputCls}
                    disabled={isReadOnly}
                    placeholder="e.g. 55"
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* SECTION 5: Recommended Valuation & Statutory Rates (7 – 10) */}
        <Section id="axis-sec5" title="Recommended Valuation & Statutory Rates (7 – 10)" number={5} defaultOpen={true}>
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
            7. Recommended Valuation of the Property
          </div>

          {(() => {
            const selectedUnit = fields.plotOrFlat || 'Plot';
            const pArea = parseNum(fields.plotAreaForValuation) || parseNum(fields.plotAreaDocs);
            const pRate = parseNum(fields.plotRateForValuation);
            const pVal = pArea * pRate;
            const buaTotal = parseNum(fields.approvedBUATotal) || parseNum(fields.measuredBUATotal);
            const cRate = parseNum(fields.constructionRatePerSqft);
            const cVal = buaTotal * cRate;
            const total100 = pVal + cVal;
            const effectiveStructureType = deriveStructureType(fields);
            const hasPct = fields.percentWorkCompleted !== undefined && String(fields.percentWorkCompleted).trim() !== '';
            const pct = hasPct ? parseNum(fields.percentWorkCompleted) : (fields.isUnderConstruction ? 0 : 100);
            const isUnderConst = fields.isUnderConstruction || pct < 100;
            const pctDisplay = hasPct
              ? (String(fields.percentWorkCompleted).includes('%') ? fields.percentWorkCompleted : `${fields.percentWorkCompleted}%`)
              : `${pct}%`;
            const cValAsOnDate = Math.round(cVal * (pct / 100));
            const totalAsOnDate = pVal + cValAsOnDate;
            const distressedPct = fields.distressedPercentage !== undefined && fields.distressedPercentage !== ''
              ? parseNum(fields.distressedPercentage)
              : 80;
            const distressedVal = Math.round(total100 * (distressedPct / 100));

            return (
              <div className="space-y-5">
                {/* 1. Valuation Basis Inputs (Plot & Construction) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Card 1: Plot Valuation Basis */}
                  <div className="border border-blue-200 bg-[#F8FAFC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        {selectedUnit} Valuation Basis
                      </span>
                      {pVal > 0 && (
                        <span className="text-[11px] font-semibold bg-white text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200">
                          {pArea} sqft × Rs. {pRate}/sqft = <strong className="text-blue-950">Rs. {formatIndianCurrency(pVal)}/-</strong>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label={`${selectedUnit} Area for Valuation`}>
                        <input
                          type="text"
                          value={fields.plotAreaDocs ? `${parseNum(fields.plotAreaDocs)} sqft` : (fields.plotAreaDocs || '0 sqft')}
                          className={inputCls + ' bg-slate-100 text-slate-700 font-medium cursor-not-allowed border-slate-300'}
                          readOnly
                          disabled
                        />
                      </Field>

                      <Field label={`${selectedUnit} Rate (Rs. / sqft)`}>
                        <input
                          type="text"
                          value={fields.plotRateForValuation}
                          onChange={e => handleChange('plotRateForValuation', sanitizePositiveFloat(e.target.value))}
                          className={inputCls}
                          disabled={isReadOnly}
                          placeholder="e.g. 2200"
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Card 2: Construction Valuation Basis */}
                  <div className="border border-teal-200 bg-[#F0FDFA] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-bold text-teal-800 uppercase tracking-wide">
                        Structure Construction Valuation Basis
                      </span>
                      {cVal > 0 && (
                        <span className="text-[11px] font-semibold bg-white text-teal-800 px-2.5 py-0.5 rounded-full border border-teal-200">
                          {buaTotal} sqft × Rs. {cRate}/sqft = <strong className="text-teal-950">Rs. {formatIndianCurrency(cVal)}/-</strong>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="BUA for Valuation">
                        <input
                          type="text"
                          value={buaTotal > 0 ? `${buaTotal} sqft` : '0 sqft'}
                          className={inputCls + ' bg-slate-100 text-slate-700 font-medium cursor-not-allowed border-slate-300'}
                          readOnly
                          disabled
                        />
                      </Field>

                      <Field label="Construction Rate (Rs./sqft)">
                        <input
                          type="text"
                          value={fields.constructionRatePerSqft || ''}
                          onChange={e => handleChange('constructionRatePerSqft', sanitizePositiveFloat(e.target.value))}
                          className={inputCls}
                          disabled={isReadOnly}
                          placeholder="e.g. 2000"
                        />
                      </Field>
                    </div>
                  </div>
                </div>

                {/* a & b: Rate Description & Value of the Plot/Flat (Soft Container - Soft Blue) */}
                <div className="border border-blue-200 bg-[#F0F7FF] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label={`a. Recommended rate of the ${selectedUnit === 'Flat' ? 'Flat' : 'Plot/Flat'}`}>
                      <input
                        type="text"
                        value={fields.recommendedRatePerSqft || ''}
                        onChange={e => handleChange('recommendedRatePerSqft', e.target.value)}
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder={
                          selectedUnit === 'Flat'
                            ? 'e.g. Flat- Rs. 2200/-per sqft'
                            : 'e.g. Plot- Rs. 2200/-per sqft & Building Rs. 2000/-per sqft'
                        }
                      />
                    </Field>

                    <Field label={`b. Value of the ${selectedUnit === 'Flat' ? 'Flat' : 'Plot/Flat'}`}>
                      <input
                        type="text"
                        value={fields.valueOfPlotFlat}
                        onChange={e => handleChange('valueOfPlotFlat', e.target.value)}
                        className={inputCls + ' font-medium text-slate-900'}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                {/* c & d: Construction Valuation Fields (Soft Container - Soft Teal) */}
                <div className="border border-teal-200 bg-[#F0FDFA] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="c. Estimated Cost of Construction (Borrower's / Sanctioned Cost)">
                      <input
                        type="text"
                        value={fields.estimatedCostOfConstruction}
                        onChange={e => handleChange('estimatedCostOfConstruction', e.target.value)}
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="e.g. Rs.85,03,000/- for construction of G+2 only."
                      />
                    </Field>

                    <Field label={`d. Total Cost of Construction (${effectiveStructureType}) on 100% Completion`}>
                      <input
                        type="text"
                        value={fields.totalCostOfConstruction}
                        onChange={e => handleChange('totalCostOfConstruction', e.target.value)}
                        className={inputCls + ' font-medium text-slate-900'}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>

                  {isUnderConst && (
                    <div className="pt-2 border-t border-teal-200">
                      <Field label={`As on Date (${pctDisplay}) Construction Cost`}>
                        <input
                          type="text"
                          value={fields.constructionCostAsOnDate || ''}
                          onChange={e => handleChange('constructionCostAsOnDate', e.target.value)}
                          className={inputCls + ' font-medium text-teal-950 bg-teal-50/50'}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  )}
                </div>

                {/* e - g: Construction Progress (Soft Container - Soft Slate) */}
                <div className="border border-slate-200 bg-[#F8FAFC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Field label="e. Stage of Construction">
                      <input
                        type="text"
                        value={fields.stageOfConstruction}
                        onChange={e => handleChange('stageOfConstruction', e.target.value)}
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="e.g. GF RCC roof slab completed..."
                      />
                    </Field>

                    <Field label="f. % Work Completed">
                      <input
                        type="text"
                        value={fields.percentWorkCompleted}
                        onChange={e => handleChange('percentWorkCompleted', sanitizePositiveFloat(e.target.value))}
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="e.g. 35"
                      />
                    </Field>

                    <Field label="g. % Disbursement Recommended">
                      <input
                        type="text"
                        value={fields.percentDisbursementRecommended}
                        onChange={e => handleChange('percentDisbursementRecommended', sanitizePositiveFloat(e.target.value))}
                        className={inputCls}
                        disabled={isReadOnly}
                        placeholder="e.g. 45"
                      />
                    </Field>
                  </div>
                </div>

                {/* h - i: Final Property Value & Site Visit (Soft Container - Soft Indigo) */}
                <div className="border border-indigo-200 bg-[#EEF2FF] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
                  {total100 > 0 && (
                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">
                        h. Property Valuation Summary
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        <span className="text-[11px] font-semibold bg-white text-indigo-900 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          100% Total: <strong className="text-indigo-950">Rs. {formatIndianCurrency(total100)}/-</strong>
                        </span>
                        {isUnderConst && totalAsOnDate > 0 && (
                          <span className="text-[11px] font-semibold bg-white text-cyan-900 px-2.5 py-0.5 rounded-full border border-cyan-200">
                            As On Date ({pctDisplay}): <strong className="text-cyan-950">Rs. {formatIndianCurrency(totalAsOnDate)}/-</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label={`h. Current Value of Property (${selectedUnit} + Construction) on 100% Completion`}>
                      <input
                        type="text"
                        value={fields.currentValueOfProperty}
                        onChange={e => handleChange('currentValueOfProperty', e.target.value)}
                        className={inputCls + ' font-bold text-slate-900'}
                        disabled={isReadOnly}
                      />
                    </Field>

                    <BaseDateInput
                      label="i. Date of Property Visit"
                      value={fields.dateOfPropertyVisit || ''}
                      onChange={val => handleChange('dateOfPropertyVisit', val)}
                      disabled={isReadOnly}
                    />
                  </div>

                  {isUnderConst && (
                    <div className="pt-2 border-t border-indigo-200">
                      <Field label={`Current Value As On Date (${pctDisplay} Completion)`}>
                        <input
                          type="text"
                          value={fields.currentValueAsOnDate || ''}
                          onChange={e => handleChange('currentValueAsOnDate', e.target.value)}
                          className={inputCls + ' font-bold text-indigo-950 bg-white'}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  )}
                </div>

                {/* Point 8: Govt Reckoner Rates (Soft Container - Soft Emerald) */}
                <div className="border border-emerald-200 bg-[#ECFDF5] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <Field label="8. Valuation as per Government Reckoner Rates (Circle Rate / Benchmark Value)">
                    <input
                      type="text"
                      value={fields.valuationGovtReckonerRate}
                      onChange={e => handleChange('valuationGovtReckonerRate', e.target.value)}
                      className={inputCls}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                {/* Point 9: Distressed Valuation of Property (Soft Container - Soft Rose) */}
                <div className="border border-rose-200 bg-[#FFF1F2] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                      9. Distressed Valuation of Property
                    </span>
                    {distressedVal > 0 && (
                      <span className="text-[11px] font-semibold bg-white text-rose-900 px-2.5 py-0.5 rounded-full border border-rose-200">
                        {distressedPct}% of Total = <strong className="text-rose-950">Rs. {formatIndianCurrency(distressedVal)}/-</strong>
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Field label="Distressed % (Safety Margin)">
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={fields.distressedPercentage !== undefined ? fields.distressedPercentage : '80'}
                            onChange={e => handleChange('distressedPercentage', sanitizePositiveFloat(e.target.value))}
                            className={inputCls + ' font-bold pr-8 text-rose-950'}
                            disabled={isReadOnly}
                          />
                          <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold pointer-events-none">
                            %
                          </span>
                        </div>
                      </Field>
                    </div>

                    <div className="sm:col-span-2">
                      <Field label={`9. Distressed Valuation of Property (${fields.distressedPercentage || '80'}% of Total Valuation)`}>
                        <div className="relative">
                          <input
                            type="text"
                            value={fields.distressedValuation}
                            onChange={e => handleChange('distressedValuation', e.target.value)}
                            className={inputCls + ' font-bold text-rose-950'}
                            disabled={isReadOnly}
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                </div>

                {/* Point 10: Rental Value per Month (Soft Container - Soft Violet) */}
                <div className="border border-violet-200 bg-[#FAF5FF] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
                  <Field label="10. Rental Value per Month (Estimated / Prevailing Market Rent)">
                    <input
                      type="text"
                      value={fields.rentalValuePerMonth}
                      onChange={e => handleChange('rentalValuePerMonth', sanitizePositiveFloat(e.target.value))}
                      className={inputCls}
                      disabled={isReadOnly}
                      placeholder="e.g. 15000"
                    />
                  </Field>
                </div>
              </div>
            );
          })()}
        </Section>

        {/* SECTION 6: Attachments & Remarks (11 – 12) */}
        <Section id="axis-sec6" title="Attachments & Remarks (11 – 12)" number={6} defaultOpen={true}>
          {/* Point 11: Attachments Status (Soft Container - Cool Slate) */}
          <div className="pb-4 border-b border-slate-200">
            <div className="border border-slate-200 bg-[#F8FAFC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                11. Report Attachments
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="a. 4 photos of Property (inside/outside)">
                  <input
                    type="text"
                    value={fields.photosAttached}
                    onChange={e => handleChange('photosAttached', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="b. Location sketch for the property">
                  <input
                    type="text"
                    value={fields.locationSketchAttached}
                    onChange={e => handleChange('locationSketchAttached', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* Point 12: Remarks */}
          <div className="pt-2">
            <Field label="12. Remarks, Access Notes & Observations">
              <textarea
                rows={5}
                value={fields.remarks}
                onChange={e => handleChange('remarks', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
                placeholder="Comment on resistance for valuation if any, access road width, flood proneness, landlocked status, etc."
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 7: Undertaking & Valuer Signatory */}
        <Section id="axis-sec7" title="Undertaking & Valuer Signatory" number={7} defaultOpen={true}>
          <div className="border border-blue-200 bg-[#F0F7FF] rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-blue-900 text-sm tracking-wide uppercase">
                Valuer Undertaking &amp; Declaration
              </h3>
              <span className="text-[11px] font-bold text-blue-800 bg-white px-2.5 py-0.5 rounded-full border border-blue-200">
                Official Declaration
              </span>
            </div>

            <p className="text-xs text-slate-700 italic leading-relaxed bg-white/80 p-3.5 rounded-lg border border-blue-100">
              &ldquo;I have personally visited the property &amp; identified the same based on the documents provided.<br />
              I/We have no direct or Indirect Interest in the property being valued.<br />
              The information furnished above is true and correct to my/our knowledge.&rdquo;
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-200/80">
              <Field label="Valuer Name (Locked)">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={fields.valuerName || 'Er. Satyajit Mohanty'}
                    className={inputCls + ' bg-slate-100 font-bold text-slate-800 cursor-not-allowed pr-8'}
                    disabled={true}
                    readOnly
                  />
                  <span className="absolute right-2.5 text-slate-400 text-xs select-none" title="Locked by System">
                    🔒
                  </span>
                </div>
              </Field>

              <Field label="Designation / Authority">
                <input
                  type="text"
                  value={fields.valuerTitle || 'Approved Panel Valuer'}
                  onChange={e => handleChange('valuerTitle', e.target.value)}
                  className={inputCls}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION 8: Property Photographs */}
        <BasePhotographsSection
          title="Property Photographs"
          sectionId="axis-photos"
          sectionNumber={8}
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading}
          bucketCount={bucketImages?.length || 0}
          onOpenBucketPicker={() => setShowBucketModal(true)}
          onUploadImages={handlePhotoUpload}
          onRemoveImage={handlePhotoRemove}
          onImageNameChange={handlePhotoRename}
          onReorderImages={handlePhotoReorder}
        />

        {/* SECTION 9: Location and Sketch Maps */}
        <BaseMapsSection
          title="Location and Sketch Maps"
          sectionId="axis-maps"
          sectionNumber={9}
          locationMapImages={fields.locationMapImages || []}
          mouzaMapImages={fields.mouzaMapImages || []}
          sketchMapImages={fields.sketchMapImages || []}
          cadastralMapImages={fields.cadastralMapImages || []}
          latitude={fields.latitude}
          longitude={fields.longitude}
          technicalAddress={fields.propertyDetailsHeader || ''}
          propertyAddress={
            [fields.plotNo, fields.khataNo, fields.road, fields.locality, fields.city, fields.district, fields.pinCode]
              .filter(Boolean)
              .join(', ')
          }
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Section 4z (Longitude & Latitude Coordinates)"
          isReadOnly={isReadOnly}
          uploading={uploading}
          onLocationMapUpload={e => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={idx => handleMapRemove('locationMapImages', idx)}
          onMouzaMapUpload={e => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={idx => handleMapRemove('mouzaMapImages', idx)}
          onSketchMapUpload={e => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={idx => handleMapRemove('sketchMapImages', idx)}
          onCadastralMapUpload={e => handleMapUpload('cadastralMapImages', e)}
          onCadastralMapRemove={idx => handleMapRemove('cadastralMapImages', idx)}
          onReorderLocationMap={newImgs => handleMapReorder('locationMapImages', newImgs)}
          onReorderMouzaMap={newImgs => handleMapReorder('mouzaMapImages', newImgs)}
          onReorderSketchMap={newImgs => handleMapReorder('sketchMapImages', newImgs)}
          onReorderCadastralMap={newImgs => handleMapReorder('cadastralMapImages', newImgs)}
        />

        {/* STANDARDIZED ACTION BAR (DOCKED AT BOTTOM OF MAIN CONTENT) */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={loading || !!uploading}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>

      {/* Floating Section Navigator on the Right Side */}
      <FloatingNavigator sections={NAV_SECTIONS} />

      {/* Cloud Photo Bucket Picker Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            setFields(prev => ({
              ...prev,
              propertyImages: [...(prev.propertyImages || []), ...selectedUrls],
              propertyImageNames: [
                ...(prev.propertyImageNames || []),
                ...selectedUrls.map((_, i) => `Photograph ${(prev.propertyImages?.length || 0) + i + 1}`),
              ],
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
