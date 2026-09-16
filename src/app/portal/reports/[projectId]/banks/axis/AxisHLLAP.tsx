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
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  fetchBytes,
} from '../BaseBankReportComponents';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { BankConfig } from '@/lib/bank-fields';
import {
  PDFAxisHLLAPRenderer,
  AxisHLLAPReportFields,
  AxisHLLAPBUAFloor,
} from '@/lib/banks/pdf-axis-hllap-renderer';

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
      // Header
      refNo: raw.refNo || defaultRefNo,
      reportDate: raw.reportDate || new Date().toISOString().split('T')[0],

      // 1. Customer
      customerName: raw.customerName || prefill?.contactName || prefill?.serviceRequest?.guestName || '',
      customerContactDetails: raw.customerContactDetails || prefill?.contactPhone || prefill?.serviceRequest?.guestPhone || '',

      // 2. APP ID
      appId: raw.appId || prefill?.serviceRequest?.enquiryId || '',

      // 3. Documents Provided
      documentsProvided: raw.documentsProvided || 'Copy of Sale deed, ROR, Approved plan',

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
      levelOfLand: raw.levelOfLand || '',
      classOfLocality: raw.classOfLocality || '',
      qualityOfInfrastructure: raw.qualityOfInfrastructure || '',

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

      // 4o - 4z
      boundariesMatch: raw.boundariesMatch || 'Yes(Boundary matching as per documents)',
      statusOfLand: raw.statusOfLand || 'Free Hold',
      typeOfProperty: raw.typeOfProperty || 'Residential',
      approvedUsage: raw.approvedUsage || 'Residential',
      actualUsage: raw.actualUsage || 'Residential',
      typeOfStructure: raw.typeOfStructure || 'RCC Framed Structure',
      noOfFloors: raw.noOfFloors || '',
      occupancyDetails: raw.occupancyDetails || 'Self Occupied',
      hasElectricityWaterDrainage: raw.hasElectricityWaterDrainage || 'Yes',
      proximityToCivicAmenities: raw.proximityToCivicAmenities || '',
      developmentOfSurroundingArea: raw.developmentOfSurroundingArea || '',
      latitude: raw.latitude || '',
      longitude: raw.longitude || '',

      // 5. APPROVAL DETAILS
      layoutApprovalNo: raw.layoutApprovalNo || 'NA',
      layoutApprovalDate: raw.layoutApprovalDate || 'NA',
      layoutExpiryDate: raw.layoutExpiryDate || 'NA',
      buildingPlanApprovalNo: raw.buildingPlanApprovalNo || '',
      buildingPlanApprovalDate: raw.buildingPlanApprovalDate || '',
      buildingPlanExpiryDate: raw.buildingPlanExpiryDate || '',
      constructionCommencementDate: raw.constructionCommencementDate || '100% Completed',
      expectedCompletionDate: raw.expectedCompletionDate || 'NA',

      // 6. CONSTRUCTION DETAILS
      plotAreaDocs: raw.plotAreaDocs || '',
      demarcationAtSite: raw.demarcationAtSite || 'Yes',
      approvedBUATotal: raw.approvedBUATotal || '',
      approvedBUAFloors: defaultApprovedFloors,
      measuredBUATotal: raw.measuredBUATotal || '',
      measuredBUAFloors: defaultMeasuredFloors,
      isConstructionAsPerPlan: raw.isConstructionAsPerPlan || 'As per plan',
      detailsOfExtraConstruction: raw.detailsOfExtraConstruction || 'NA',
      sideMarginFront: raw.sideMarginFront || 'NA',
      sideMarginRight: raw.sideMarginRight || 'NA',
      sideMarginLeft: raw.sideMarginLeft || 'NA',
      sideMarginBack: raw.sideMarginBack || 'NA',
      qualityOfConstruction: raw.qualityOfConstruction || 'Good',
      maintenanceOfProperty: raw.maintenanceOfProperty || 'Good',
      currentLifeOfStructure: raw.currentLifeOfStructure || '',
      projectedLifeOfStructure: raw.projectedLifeOfStructure || '',

      // 7. Recommended Valuation
      recommendedRatePerSqft: raw.recommendedRatePerSqft || '',
      plotAreaForValuation: raw.plotAreaForValuation || '',
      plotRateForValuation: raw.plotRateForValuation || '',
      valueOfPlotFlat: raw.valueOfPlotFlat || '',
      estimatedCostOfConstruction: raw.estimatedCostOfConstruction || 'NA',
      totalCostOfConstruction: raw.totalCostOfConstruction || '',
      isUnderConstruction: raw.isUnderConstruction ?? false,
      constructionCostAsOnDate: raw.constructionCostAsOnDate || '',
      stageOfConstruction: raw.stageOfConstruction || '100%',
      percentWorkCompleted: raw.percentWorkCompleted || '100%',
      percentDisbursementRecommended: raw.percentDisbursementRecommended || '100%',
      currentValueOfProperty: raw.currentValueOfProperty || '',
      currentValueAsOnDate: raw.currentValueAsOnDate || '',
      dateOfPropertyVisit: raw.dateOfPropertyVisit || new Date().toISOString().split('T')[0],

      // 8 - 12
      valuationGovtReckonerRate: raw.valuationGovtReckonerRate || '',
      distressedValuation: raw.distressedValuation || '',
      rentalValuePerMonth: raw.rentalValuePerMonth || 'NA',
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
    };
  });

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [showSketchBoundaries, setShowSketchBoundaries] = useState<boolean>(() => {
    return !!(fields.boundaryEastSketch || fields.boundaryWestSketch || fields.boundaryNorthSketch || fields.boundarySouthSketch);
  });
  const [enableDistressedEdit, setEnableDistressedEdit] = useState(false);

  const handleChange = (k: keyof AxisHLLAPReportFields, v: any) => {
    setFields(p => ({ ...p, [k]: v }));
  };

  // Autosave setup (3s debounce)
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isReadOnly) return;
    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);

    debouncedTimer.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await saveReportDraft(projectId, fields);
        setAutoSaveStatus('saved');
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch (e) {
        console.error('Autosave error:', e);
        setAutoSaveStatus('error');
      }
    }, 3000);

    return () => {
      if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    };
  }, [fields, projectId, isReadOnly]);

  // Floor array management for Approved BUA
  const handleAddApprovedFloor = () => {
    const current = fields.approvedBUAFloors || [];
    const labels = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor'];
    const nextLbl = current.length < labels.length ? labels[current.length] : `Floor ${current.length + 1}`;
    const nextList = [...current, { floor: nextLbl, area: '' }];
    const total = nextList.reduce((acc, f) => acc + parseNum(f.area), 0);
    setFields(p => ({
      ...p,
      approvedBUAFloors: nextList,
      approvedBUATotal: total > 0 ? String(total) : '',
    }));
  };

  const handleRemoveApprovedFloor = (idx: number) => {
    const nextList = (fields.approvedBUAFloors || []).filter((_, i) => i !== idx);
    const total = nextList.reduce((acc, f) => acc + parseNum(f.area), 0);
    setFields(p => ({
      ...p,
      approvedBUAFloors: nextList,
      approvedBUATotal: total > 0 ? String(total) : '',
    }));
  };

  const handleApprovedFloorChange = (idx: number, field: 'floor' | 'area', val: string) => {
    const nextList = [...(fields.approvedBUAFloors || [])];
    nextList[idx] = { ...nextList[idx], [field]: val };
    const total = nextList.reduce((acc, f) => acc + parseNum(f.area), 0);
    setFields(p => ({
      ...p,
      approvedBUAFloors: nextList,
      approvedBUATotal: total > 0 ? String(total) : '',
    }));
  };

  // Floor array management for Measured BUA
  const handleAddMeasuredFloor = () => {
    const current = fields.measuredBUAFloors || [];
    const labels = ['Ground Floor', 'First Floor', 'Second Floor', 'Third Floor', 'Fourth Floor', 'Fifth Floor'];
    const nextLbl = current.length < labels.length ? labels[current.length] : `Floor ${current.length + 1}`;
    const nextList = [...current, { floor: nextLbl, area: '' }];
    const total = nextList.reduce((acc, f) => acc + parseNum(f.area), 0);
    setFields(p => ({
      ...p,
      measuredBUAFloors: nextList,
      measuredBUATotal: total > 0 ? String(total) : '',
    }));
  };

  const handleRemoveMeasuredFloor = (idx: number) => {
    const nextList = (fields.measuredBUAFloors || []).filter((_, i) => i !== idx);
    const total = nextList.reduce((acc, f) => acc + parseNum(f.area), 0);
    setFields(p => ({
      ...p,
      measuredBUAFloors: nextList,
      measuredBUATotal: total > 0 ? String(total) : '',
    }));
  };

  const handleMeasuredFloorChange = (idx: number, field: 'floor' | 'area', val: string) => {
    const nextList = [...(fields.measuredBUAFloors || [])];
    nextList[idx] = { ...nextList[idx], [field]: val };
    const total = nextList.reduce((acc, f) => acc + parseNum(f.area), 0);
    setFields(p => ({
      ...p,
      measuredBUAFloors: nextList,
      measuredBUATotal: total > 0 ? String(total) : '',
    }));
  };

  // Auto-calculation engine for Valuation
  const handleAutoCalculate = () => {
    const pArea = parseNum(fields.plotAreaForValuation);
    const pRate = parseNum(fields.plotRateForValuation);
    const pVal = pArea * pRate;

    const buaTotal = parseNum(fields.approvedBUATotal) || parseNum(fields.measuredBUATotal);
    const cRate = parseNum(fields.recommendedRatePerSqft) || 1800;
    const cVal = buaTotal * cRate;

    const currentTotal = pVal + cVal;

    let cValAsOnDate = cVal;
    let currentAsOnDate = currentTotal;

    if (fields.isUnderConstruction) {
      const pct = parseNum(fields.percentWorkCompleted) || 100;
      cValAsOnDate = Math.round(cVal * (pct / 100));
      currentAsOnDate = pVal + cValAsOnDate;
    }

    const distressedVal = Math.round((fields.isUnderConstruction ? currentAsOnDate : currentTotal) * 0.80);

    setFields(prev => ({
      ...prev,
      valueOfPlotFlat: pArea && pRate ? `Value of Plot- ${pArea}sqft X Rs.${pRate}/- = Rs.${formatIndianCurrency(pVal)}/-` : prev.valueOfPlotFlat,
      totalCostOfConstruction: buaTotal && cRate ? `${buaTotal}sqft X Rs.${cRate}/-=Rs.${formatIndianCurrency(cVal)}/-` : prev.totalCostOfConstruction,
      constructionCostAsOnDate: prev.isUnderConstruction && buaTotal
        ? `${buaTotal}sqft @ Rs.${Math.round(cRate * ((parseNum(prev.percentWorkCompleted) || 100) / 100))}/-= Rs.${formatIndianCurrency(cValAsOnDate)}/-`
        : '',
      currentValueOfProperty: pVal || cVal ? `Rs.${formatIndianCurrency(pVal)}/- + Rs.${formatIndianCurrency(cVal)}/- = Rs.${formatIndianCurrency(currentTotal)}/-` : prev.currentValueOfProperty,
      currentValueAsOnDate: prev.isUnderConstruction && (pVal || cValAsOnDate)
        ? `Rs.${formatIndianCurrency(pVal)}/- + Rs.${formatIndianCurrency(cValAsOnDate)}/- = Rs.${formatIndianCurrency(currentAsOnDate)}/-`
        : '',
      distressedValuation: currentTotal > 0 ? `Rs.${formatIndianCurrency(distressedVal)}/-` : prev.distressedValuation,
    }));
  };

  // File Upload Handlers for Maps
  const handleMapUpload = async (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
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

  const handleMapRemove = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages', idx?: number) => {
    if (idx === undefined) {
      setFields(p => ({ ...p, [fieldKey]: [] }));
      return;
    }
    setFields(p => ({
      ...p,
      [fieldKey]: (p[fieldKey] || []).filter((_, i) => i !== idx),
    }));
  };

  const handleMapReorder = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages', reordered: string[]) => {
    setFields(p => ({
      ...p,
      [fieldKey]: reordered,
    }));
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
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
          ...urls.map((_, i) => `Photograph ${(p.propertyImages?.length || 0) + i + 1}`),
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
        photoBytesList.push({ bytes: b, label: photoNames[i] || `Photograph ${i + 1}` });
      }
    }

    const locMapBytes = (await Promise.all((fields.locationMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const mouzaMapBytes = (await Promise.all((fields.mouzaMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const sketchMapBytes = (await Promise.all((fields.sketchMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    const renderer = new PDFAxisHLLAPRenderer();
    return await renderer.generateAxisHLLAPReport(
      fields,
      {
        photos: photoBytesList,
        locationMaps: locMapBytes,
        mouzaMaps: mouzaMapBytes,
        sketchMaps: sketchMapBytes,
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
    { id: 'axis-sec1', title: '1-3. Customer, App ID & Documents' },
    { id: 'axis-sec2', title: '4. Property Details & Boundaries' },
    { id: 'axis-sec3', title: '5. Approval Details' },
    { id: 'axis-sec4', title: '6. Construction Details' },
    { id: 'axis-sec5', title: '7-10. Valuation & Statutory Rates' },
    { id: 'axis-sec6', title: '11-12. Attachments & Remarks' },
    { id: 'axis-photos', title: '13. Property Photographs' },
    { id: 'axis-maps', title: '14. Location & Sketch Maps' },
  ];

  // Date picker helper component
  const DateInput = ({
    fieldKey,
    label,
    placeholder = '',
    span,
  }: {
    fieldKey: keyof AxisHLLAPReportFields;
    label: string;
    placeholder?: string;
    span?: number;
  }) => (
    <Field label={label} span={span}>
      <div className="relative flex items-center">
        <input
          type="text"
          className={inputCls + ' pr-9'}
          value={(fields[fieldKey] as string) || ''}
          onChange={e => handleChange(fieldKey, e.target.value)}
          disabled={isReadOnly}
          placeholder={placeholder}
        />
        {!isReadOnly && (
          <div className="absolute right-2.5 flex items-center pointer-events-auto">
            <input
              type="date"
              className="opacity-0 absolute inset-0 w-6 h-6 cursor-pointer"
              title="Choose Date"
              onChange={e => {
                if (e.target.value) handleChange(fieldKey, formatReportDate(e.target.value));
              }}
            />
            <span className="text-slate-400 hover:text-slate-600 text-sm">📅</span>
          </div>
        )}
      </div>
    </Field>
  );

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Top Active Configuration Banner */}
        <ActiveConfigBanner
          bankName="AXIS BANK"
          formatName="HL-LAP"
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

        {/* SECTION 1: 1 - 3. Customer, App ID & Documents Provided */}
        <Section id="axis-sec1" title="1 - 3. Customer, App ID & Documents Provided" number={1} defaultOpen={true}>
          {/* Header Reference & Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-200">
            <Field label="Reference Number">
              <input
                type="text"
                value={fields.refNo}
                onChange={e => handleChange('refNo', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </Field>

            <DateInput
              fieldKey="reportDate"
              label="Date of Report"
            />
          </div>

          {/* Questionnaire Fields 1 to 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Field label="1a. Name of the Customer">
              <input
                type="text"
                value={fields.customerName}
                onChange={e => handleChange('customerName', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="1b. Customer Contact Details">
              <input
                type="text"
                value={fields.customerContactDetails}
                onChange={e => handleChange('customerContactDetails', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="2. APP ID / Loan Account No">
              <input
                type="text"
                value={fields.appId}
                onChange={e => handleChange('appId', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="3. Documents Provided">
              <input
                type="text"
                value={fields.documentsProvided}
                onChange={e => handleChange('documentsProvided', e.target.value)}
                className={inputCls}
                placeholder="Copy of Sale deed, ROR, Approved plan"
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 2: 4. Property Details & Characteristics */}
        <Section id="axis-sec2" title="4. Property Details & Characteristics" number={2} defaultOpen={true}>
          {/* General Property Location & Identification */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <Field span={3} label="4. Property Details (Full Description / Address)">
              <textarea
                rows={3}
                value={fields.propertyDetailsHeader}
                onChange={e => handleChange('propertyDetailsHeader', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4a. Plot No">
              <input
                type="text"
                value={fields.plotNo}
                onChange={e => handleChange('plotNo', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4b. S No / G. No / Khasra No / Khata No">
              <input
                type="text"
                value={fields.khataNo}
                onChange={e => handleChange('khataNo', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4c. Locality">
              <input
                type="text"
                value={fields.locality}
                onChange={e => handleChange('locality', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4d. Road Width / Access Road">
              <input
                type="text"
                value={fields.road}
                onChange={e => handleChange('road', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4e. City">
              <input
                type="text"
                value={fields.city}
                onChange={e => handleChange('city', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4f. District">
              <input
                type="text"
                value={fields.district}
                onChange={e => handleChange('district', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4g. Pin Code">
              <input
                type="text"
                value={fields.pinCode}
                onChange={e => handleChange('pinCode', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4h. Nearby Landmark">
              <input
                type="text"
                value={fields.nearbyLandMark}
                onChange={e => handleChange('nearbyLandMark', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4i. Distance from City Center">
              <input
                type="text"
                value={fields.distanceFromCityCenter}
                onChange={e => handleChange('distanceFromCityCenter', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4j. Availability of Local Transport">
              <select
                value={fields.availabilityOfLocalTransport}
                onChange={e => handleChange('availabilityOfLocalTransport', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="">Select Local Transport</option>
                <option value="Taxi, Auto">Taxi, Auto</option>
                <option value="Bus, Taxi, Auto">Bus, Taxi, Auto</option>
                <option value="Metro, Bus, Auto">Metro, Bus, Auto</option>
                <option value="Local Train, Bus">Local Train, Bus</option>
              </select>
            </Field>

            <Field label="4k. Level of Land">
              <select
                value={fields.levelOfLand}
                onChange={e => handleChange('levelOfLand', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="">Select Level of Land</option>
                <option value="Regular level land">Regular level land</option>
                <option value="Low land">Low land</option>
                <option value="Sloping land">Sloping land</option>
                <option value="Elevated land">Elevated land</option>
              </select>
            </Field>

            <Field label="4l. Class of Locality">
              <select
                value={fields.classOfLocality}
                onChange={e => handleChange('classOfLocality', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="">Select Class of Locality</option>
                <option value="Middle Class">Middle Class</option>
                <option value="Higher Middle Class">Higher Middle Class</option>
                <option value="Posh">Posh</option>
                <option value="Lower Middle Class">Lower Middle Class</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            <Field label="4m. Quality of Infrastructure">
              <select
                value={fields.qualityOfInfrastructure}
                onChange={e => handleChange('qualityOfInfrastructure', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="">Select Quality</option>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Excellent">Excellent</option>
                <option value="Developing">Developing</option>
              </select>
            </Field>
          </div>

          {/* 4n. MULTI-SUBPOINT SOFT CONTAINER: Four Boundaries Comparison Table */}
          <div className="border border-purple-200 bg-purple-50/40 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-purple-900 text-sm tracking-wide uppercase">
                4n. Four Boundaries Comparison (Deed vs Actual vs Sketch Map)
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
                <thead className="bg-purple-100/80 text-purple-900 font-bold uppercase">
                  <tr>
                    <th className="p-3 border-b border-r border-purple-200 w-24">Direction</th>
                    <th className="p-3 border-b border-r border-purple-200">As Per Sale Deed</th>
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
                        placeholder=""
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="text"
                        value={fields.boundaryEastActual}
                        onChange={e => handleChange('boundaryEastActual', e.target.value)}
                        className={inputCls}
                        placeholder=""
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
                          placeholder=""
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
                        placeholder=""
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="text"
                        value={fields.boundaryWestActual}
                        onChange={e => handleChange('boundaryWestActual', e.target.value)}
                        className={inputCls}
                        placeholder=""
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
                          placeholder=""
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
                        placeholder=""
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="text"
                        value={fields.boundaryNorthActual}
                        onChange={e => handleChange('boundaryNorthActual', e.target.value)}
                        className={inputCls}
                        placeholder=""
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
                          placeholder=""
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
                        placeholder=""
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <input
                        type="text"
                        value={fields.boundarySouthActual}
                        onChange={e => handleChange('boundarySouthActual', e.target.value)}
                        className={inputCls}
                        placeholder=""
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
                          placeholder=""
                          disabled={isReadOnly}
                        />
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Questionnaire Fields 4o to 4y */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            <Field label="4o. Boundaries Matching Verification">
              <select
                value={fields.boundariesMatch}
                onChange={e => handleChange('boundariesMatch', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="Yes(Boundary matching as per documents)">Yes (Boundary matching as per documents)</option>
                <option value="Yes(Boundary is matching as per sketch map)">Yes (Boundary is matching as per sketch map)</option>
                <option value="No - Boundaries do not match">No - Boundaries do not match</option>
                <option value="Partial match observed">Partial match observed</option>
              </select>
            </Field>

            <Field label="4p. Status of the Land">
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

            <Field label="4q. Type of Property">
              <select
                value={fields.typeOfProperty}
                onChange={e => handleChange('typeOfProperty', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="Residential">Residential</option>
                <option value="Bungalow">Bungalow</option>
                <option value="Row House">Row House</option>
                <option value="Individual House">Individual House</option>
                <option value="Plot">Plot</option>
                <option value="Flat (1BHK/2BHK/3BHK)">Flat (1BHK/2BHK/3BHK)</option>
                <option value="Commercial">Commercial</option>
              </select>
            </Field>

            <Field label="4r. Approved Usage">
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

            <Field label="4s. Actual Usage">
              <select
                value={fields.actualUsage}
                onChange={e => handleChange('actualUsage', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Mixed">Mixed</option>
                <option value="Under construction">Under construction</option>
              </select>
            </Field>

            <Field label="4t. Type of Structure">
              <select
                value={fields.typeOfStructure}
                onChange={e => handleChange('typeOfStructure', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="RCC Framed Structure">RCC Framed Structure</option>
                <option value="Load Bearing">Load Bearing</option>
                <option value="Aluform shuttering">Aluform shuttering</option>
                <option value="Steel Structure">Steel Structure</option>
              </select>
            </Field>

            <Field label="4u. Number of Floors">
              <input
                type="text"
                value={fields.noOfFloors}
                onChange={e => handleChange('noOfFloors', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="4v. Occupancy Details">
              <select
                value={fields.occupancyDetails}
                onChange={e => handleChange('occupancyDetails', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="Self Occupied">Self Occupied</option>
                <option value="Rented">Rented</option>
                <option value="Vacant">Vacant</option>
                <option value="Under construction">Under construction</option>
              </select>
            </Field>

            <Field label="4w. Electricity, Water & Drainage">
              <select
                value={fields.hasElectricityWaterDrainage}
                onChange={e => handleChange('hasElectricityWaterDrainage', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Partial">Partial</option>
              </select>
            </Field>

            <Field label="4x. Proximity to Civic Amenities">
              <input
                type="text"
                value={fields.proximityToCivicAmenities}
                onChange={e => handleChange('proximityToCivicAmenities', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field span={2} label="4y. Development of Surrounding Area">
              <input
                type="text"
                value={fields.developmentOfSurroundingArea}
                onChange={e => handleChange('developmentOfSurroundingArea', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* 4z. MULTI-SUBPOINT SOFT CONTAINER: Longitude & Latitude Coordinates */}
          <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 sm:p-5 shadow-xs">
            <h3 className="font-semibold text-blue-900 mb-3 text-sm tracking-wide uppercase">
              4z. Longitude & Latitude of the Property
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="4z(i). Latitude">
                <input
                  type="text"
                  value={fields.latitude}
                  onChange={e => handleChange('latitude', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 20.2961"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="4z(ii). Longitude">
                <input
                  type="text"
                  value={fields.longitude}
                  onChange={e => handleChange('longitude', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 85.8245"
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION 3: 5. Approval Details */}
        <Section id="axis-sec3" title="5. Approval Details" number={3} defaultOpen={true}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="5a. Layout Approval No">
              <input
                type="text"
                value={fields.layoutApprovalNo}
                onChange={e => handleChange('layoutApprovalNo', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </Field>

            <DateInput
              fieldKey="layoutApprovalDate"
              label="5b. Layout Approval Date"
            />

            <DateInput
              fieldKey="layoutExpiryDate"
              label="5c. Layout Expiry Date"
            />

            <Field span={3} label="5d. Building Plan Approval Details">
              <textarea
                rows={2}
                value={fields.buildingPlanApprovalNo}
                onChange={e => handleChange('buildingPlanApprovalNo', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <DateInput
              fieldKey="buildingPlanApprovalDate"
              label="5e. Building Plan Approval Date"
            />

            <DateInput
              fieldKey="buildingPlanExpiryDate"
              label="5f. Building Plan Expiry Date"
            />

            <DateInput
              fieldKey="constructionCommencementDate"
              label="5g. Date of Commencement of Construction"
            />

            <DateInput
              fieldKey="expectedCompletionDate"
              label="5h. Expected Completion Date"
            />
          </div>
        </Section>

        {/* SECTION 4: 6. Construction Details */}
        <Section id="axis-sec4" title="6. Construction Details" number={4} defaultOpen={true}>
          {/* 6a & 6b Direct Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <Field label="6a. Area of the Plot / Flat (as per documents)">
              <input
                type="text"
                value={fields.plotAreaDocs}
                onChange={e => handleChange('plotAreaDocs', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="6b. Demarcation at Site">
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

          {/* 6c. MULTI-SUBPOINT SOFT CONTAINER: Approved BUA Floor Table */}
          <div className="border border-cyan-200 bg-cyan-50/40 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-cyan-950 text-sm tracking-wide uppercase">
                6c. Approved Built Up Area (BUA) Floor-wise Breakup
              </h3>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddApprovedFloor}
                  className="px-3 py-1 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  + Add Floor
                </button>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-center font-normal text-xs uppercase tracking-wider w-12">#</th>
                    <th className="px-3 py-2.5 text-left font-normal text-xs uppercase tracking-wider">Floor Name / Level</th>
                    <th className="px-3 py-2.5 text-right font-normal text-xs uppercase tracking-wider w-44">Area (Sq.Ft.)</th>
                    {!isReadOnly && <th className="px-2 py-2.5 w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.approvedBUAFloors || []).map((fl, idx) => (
                    <tr key={idx} className="bg-white hover:bg-neutral-50/50 transition-colors">
                      <td className="px-2 py-1.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={fl.floor}
                          onChange={e => handleApprovedFloorChange(idx, 'floor', e.target.value)}
                          className={inputCls + ' !py-1.5 text-xs font-normal text-[#0f2038]'}
                          placeholder="e.g. Ground Floor"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={fl.area}
                          onChange={e => handleApprovedFloorChange(idx, 'area', e.target.value)}
                          className={inputCls + ' !py-1.5 text-xs text-right font-medium'}
                          placeholder=""
                          disabled={isReadOnly}
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveApprovedFloor(idx)}
                            disabled={(fields.approvedBUAFloors || []).length <= 1}
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
                      Total Approved BUA:
                    </td>
                    <td className="px-3 py-2.5 text-right text-cyan-800 font-bold font-mono">
                      {fields.approvedBUATotal ? `${fields.approvedBUATotal} sqft` : '0 sqft'}
                    </td>
                    {!isReadOnly && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 6d. MULTI-SUBPOINT SOFT CONTAINER: Measured BUA Floor Table */}
          <div className="border border-cyan-200 bg-cyan-50/40 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-cyan-950 text-sm tracking-wide uppercase">
                6d. Measured Built Up Area (BUA) Floor-wise Breakup
              </h3>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddMeasuredFloor}
                  className="px-3 py-1 bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-semibold rounded-md shadow-xs transition-colors cursor-pointer"
                >
                  + Add Floor
                </button>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-center font-normal text-xs uppercase tracking-wider w-12">#</th>
                    <th className="px-3 py-2.5 text-left font-normal text-xs uppercase tracking-wider">Floor Name / Level</th>
                    <th className="px-3 py-2.5 text-right font-normal text-xs uppercase tracking-wider w-44">Area (Sq.Ft.)</th>
                    {!isReadOnly && <th className="px-2 py-2.5 w-12 text-center"></th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.measuredBUAFloors || []).map((fl, idx) => (
                    <tr key={idx} className="bg-white hover:bg-neutral-50/50 transition-colors">
                      <td className="px-2 py-1.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          value={fl.floor}
                          onChange={e => handleMeasuredFloorChange(idx, 'floor', e.target.value)}
                          className={inputCls + ' !py-1.5 text-xs font-normal text-[#0f2038]'}
                          placeholder="e.g. Ground Floor"
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-2 py-1.5">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={fl.area}
                          onChange={e => handleMeasuredFloorChange(idx, 'area', e.target.value)}
                          className={inputCls + ' !py-1.5 text-xs text-right font-medium'}
                          placeholder=""
                          disabled={isReadOnly}
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveMeasuredFloor(idx)}
                            disabled={(fields.measuredBUAFloors || []).length <= 1}
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
                      Total Measured BUA:
                    </td>
                    <td className="px-3 py-2.5 text-right text-cyan-800 font-bold font-mono">
                      {fields.measuredBUATotal ? `${fields.measuredBUATotal} sqft` : '0 sqft'}
                    </td>
                    {!isReadOnly && <td></td>}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* 6f & 6g Direct Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <Field label="6f. Construction as per Approved Plan">
              <select
                value={fields.isConstructionAsPerPlan}
                onChange={e => handleChange('isConstructionAsPerPlan', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="As per plan">As per plan</option>
                <option value="Yes (As perApproved)">Yes (As perApproved)</option>
                <option value="Deviation observed">Deviation observed</option>
                <option value="Unauthorized construction">Unauthorized construction</option>
              </select>
            </Field>

            <Field label="6g. Details of Extra Construction">
              <input
                type="text"
                value={fields.detailsOfExtraConstruction}
                onChange={e => handleChange('detailsOfExtraConstruction', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* 6h. MULTI-SUBPOINT SOFT CONTAINER: Side Margins */}
          <div className="border border-slate-200 bg-slate-50/80 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-slate-800 mb-3 text-sm tracking-wide uppercase">
              6h. Recommended / Available Side Margins (Setbacks)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
              <Field label="Margin: Front">
                <input
                  type="text"
                  value={fields.sideMarginFront}
                  onChange={e => handleChange('sideMarginFront', e.target.value)}
                  className={inputCls}
                  placeholder=""
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Margin: Right">
                <input
                  type="text"
                  value={fields.sideMarginRight}
                  onChange={e => handleChange('sideMarginRight', e.target.value)}
                  className={inputCls}
                  placeholder=""
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Margin: Left">
                <input
                  type="text"
                  value={fields.sideMarginLeft}
                  onChange={e => handleChange('sideMarginLeft', e.target.value)}
                  className={inputCls}
                  placeholder=""
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Margin: Back">
                <input
                  type="text"
                  value={fields.sideMarginBack}
                  onChange={e => handleChange('sideMarginBack', e.target.value)}
                  className={inputCls}
                  placeholder=""
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>

          {/* 6i - 6l Direct Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="6i. Quality of Construction">
              <select
                value={fields.qualityOfConstruction}
                onChange={e => handleChange('qualityOfConstruction', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Excellent">Excellent</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            <Field label="6j. Maintenance of Property">
              <select
                value={fields.maintenanceOfProperty}
                onChange={e => handleChange('maintenanceOfProperty', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Very Good">Very Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            <Field label="6k. Current Age of Structure">
              <input
                type="text"
                value={fields.currentLifeOfStructure}
                onChange={e => handleChange('currentLifeOfStructure', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="6l. Projected / Residual Life">
              <input
                type="text"
                value={fields.projectedLifeOfStructure}
                onChange={e => handleChange('projectedLifeOfStructure', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 5: 7 - 10. Valuation, Statutory Rates & Rental Value */}
        <Section id="axis-sec5" title="7 - 10. Valuation, Statutory Rates & Rental Value" number={5} defaultOpen={true}>
          {/* Construction Status Toggle Bar */}
          <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 mb-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-700 uppercase">Property Status:</span>
              <button
                type="button"
                onClick={() => handleChange('isUnderConstruction', !fields.isUnderConstruction)}
                disabled={isReadOnly}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer ${
                  fields.isUnderConstruction
                    ? 'bg-amber-500 text-white'
                    : 'bg-emerald-600 text-white'
                }`}
              >
                {fields.isUnderConstruction ? '🏗️ Under-Construction (< 100%)' : '✅ 100% Completed Property'}
              </button>
            </div>
            <button
              type="button"
              onClick={handleAutoCalculate}
              disabled={isReadOnly}
              className="px-4 py-2 bg-[#b8860b] hover:bg-[#8a6507] text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              ⚡ Auto-Calculate Valuation
            </button>
          </div>

          {/* Direct Valuation Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <Field label="7a. Plot Area for Valuation (sqft)">
              <input
                type="text"
                value={fields.plotAreaForValuation}
                onChange={e => handleChange('plotAreaForValuation', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="7b. Plot Rate (Rs./sqft)">
              <input
                type="text"
                value={fields.plotRateForValuation}
                onChange={e => handleChange('plotRateForValuation', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field label="7c. Recommended Rate Description">
              <input
                type="text"
                value={fields.recommendedRatePerSqft}
                onChange={e => handleChange('recommendedRatePerSqft', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field span={3} label="7d. Total Value of the Plot / Flat">
              <input
                type="text"
                value={fields.valueOfPlotFlat}
                onChange={e => handleChange('valueOfPlotFlat', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="7e. Estimated Cost of Construction">
              <input
                type="text"
                value={fields.estimatedCostOfConstruction}
                onChange={e => handleChange('estimatedCostOfConstruction', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field span={2} label="7f. Total Construction Cost (100% Completion)">
              <input
                type="text"
                value={fields.totalCostOfConstruction}
                onChange={e => handleChange('totalCostOfConstruction', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* MULTI-SUBPOINT SOFT CONTAINER: Under-Construction Breakdown (Only when active) */}
          {fields.isUnderConstruction && (
            <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
              <h3 className="font-semibold text-amber-900 mb-3 text-sm tracking-wide uppercase">
                Under-Construction Progress &amp; Valuation Breakdown
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="Stage of Construction">
                  <input
                    type="text"
                    value={fields.stageOfConstruction}
                    onChange={e => handleChange('stageOfConstruction', e.target.value)}
                    className={inputCls}
                    placeholder=""
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="% Work Completed">
                  <input
                    type="text"
                    value={fields.percentWorkCompleted}
                    onChange={e => handleChange('percentWorkCompleted', e.target.value)}
                    className={inputCls}
                    placeholder=""
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="% Disbursement Recommended">
                  <input
                    type="text"
                    value={fields.percentDisbursementRecommended}
                    onChange={e => handleChange('percentDisbursementRecommended', e.target.value)}
                    className={inputCls}
                    placeholder=""
                    disabled={isReadOnly}
                  />
                </Field>

                <Field span={2} label="Construction Cost As On Date">
                  <input
                    type="text"
                    value={fields.constructionCostAsOnDate || ''}
                    onChange={e => handleChange('constructionCostAsOnDate', e.target.value)}
                    className={inputCls}
                    placeholder=""
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Current Value As On Date">
                  <input
                    type="text"
                    value={fields.currentValueAsOnDate || ''}
                    onChange={e => handleChange('currentValueAsOnDate', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Summary, Statutory Rates & Visit Date Direct Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="7g. Current Value of Property (100% Completion)">
              <input
                type="text"
                value={fields.currentValueOfProperty}
                onChange={e => handleChange('currentValueOfProperty', e.target.value)}
                className={inputCls}
                disabled={isReadOnly}
              />
            </Field>

            <DateInput
              fieldKey="dateOfPropertyVisit"
              label="7h. Date of Property Visit"
            />

            <Field label="8. Valuation as per Govt Reckoner Rate">
              <input
                type="text"
                value={fields.valuationGovtReckonerRate}
                onChange={e => handleChange('valuationGovtReckonerRate', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>

            <Field
              label={
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>9. Distressed Valuation of Property</span>
                    <button
                      type="button"
                      onClick={() => setEnableDistressedEdit(!enableDistressedEdit)}
                      disabled={isReadOnly}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${
                        enableDistressedEdit ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${
                          enableDistressedEdit ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className={`text-xs font-medium normal-case ${enableDistressedEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                      {enableDistressedEdit ? 'Edit On' : 'Edit Off (Strictly 80%)'}
                    </span>
                  </div>
                  <span className="block normal-case text-gray-500 text-[10px] mt-0.5">
                    ([CURRENT MARKET VALUE] * 0.80 (Standard 80% distress factor))
                  </span>
                </div>
              }
            >
              <input
                type="text"
                value={fields.distressedValuation}
                onChange={e => handleChange('distressedValuation', e.target.value)}
                className={`${inputCls} ${!enableDistressedEdit ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={isReadOnly || !enableDistressedEdit}
              />
            </Field>

            <Field span={2} label="10. Rental Value per Month">
              <input
                type="text"
                value={fields.rentalValuePerMonth}
                onChange={e => handleChange('rentalValuePerMonth', e.target.value)}
                className={inputCls}
                placeholder=""
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </Section>

        {/* SECTION 6: 11 - 12. Attachments & Remarks */}
        <Section id="axis-sec6" title="11 - 12. Attachments, Remarks & Signatory" number={6} defaultOpen={true}>
          {/* 11. Attachments Direct Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <Field label="11a. 4 photos of the Property attached">
              <select
                value={fields.photosAttached}
                onChange={e => handleChange('photosAttached', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="Attached">Attached</option>
                <option value="Not Attached">Not Attached</option>
              </select>
            </Field>

            <Field label="11b. Location sketch for the property">
              <select
                value={fields.locationSketchAttached}
                onChange={e => handleChange('locationSketchAttached', e.target.value)}
                className={selectCls}
                disabled={isReadOnly}
              >
                <option value="Attached">Attached</option>
                <option value="Not Attached">Not Attached</option>
              </select>
            </Field>
          </div>

          {/* 12. Remarks Direct Field */}
          <div className="mb-5">
            <Field label="12. Remarks & Critical Observations">
              <textarea
                rows={5}
                value={fields.remarks}
                onChange={e => handleChange('remarks', e.target.value)}
                className={inputCls}
                placeholder="Subject property is..."
                disabled={isReadOnly}
              />
            </Field>
          </div>

          {/* MULTI-SUBPOINT SOFT CONTAINER: Valuer Undertaking & Signatory */}
          <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-5 shadow-xs">
            <h3 className="font-semibold text-blue-900 mb-3 text-sm tracking-wide uppercase">
              Valuer Undertaking &amp; Authorized Signatory
            </h3>
            <p className="text-xs text-slate-700 italic leading-relaxed mb-4">
              I have personally visited the property &amp; identified the same based on the documents provided.<br />
              I/We have no direct or Indirect Interest in the property being valued.<br />
              The information furnished above is true and correct to my/our knowledge.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-blue-100">
              <Field label="Valuer Name">
                <input
                  type="text"
                  value={fields.valuerName}
                  onChange={e => handleChange('valuerName', e.target.value)}
                  className={inputCls}
                  placeholder=""
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Designation / Authority">
                <input
                  type="text"
                  value={fields.valuerTitle}
                  onChange={e => handleChange('valuerTitle', e.target.value)}
                  className={inputCls}
                  placeholder=""
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION 7: Property Photographs */}
        <BasePhotographsSection
          title="Property Photographs"
          sectionId="axis-photos"
          sectionNumber={7}
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

        {/* SECTION 8: Location and Sketch Maps */}
        <BaseMapsSection
          title="Location and Sketch Maps"
          sectionId="axis-maps"
          sectionNumber={8}
          locationMapImages={fields.locationMapImages || []}
          mouzaMapImages={fields.mouzaMapImages || []}
          sketchMapImages={fields.sketchMapImages || []}
          coordinatesSectionName="4. Property Details & Characteristics"
          isReadOnly={isReadOnly}
          uploading={uploading}
          onLocationMapUpload={e => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={idx => handleMapRemove('locationMapImages', idx)}
          onMouzaMapUpload={e => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={idx => handleMapRemove('mouzaMapImages', idx)}
          onSketchMapUpload={e => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={idx => handleMapRemove('sketchMapImages', idx)}
          onReorderLocationMap={newImgs => handleMapReorder('locationMapImages', newImgs)}
          onReorderMouzaMap={newImgs => handleMapReorder('mouzaMapImages', newImgs)}
          onReorderSketchMap={newImgs => handleMapReorder('sketchMapImages', newImgs)}
        />

        {/* STANDARDIZED ACTION BAR (DOCKED AT BOTTOM OF MAIN CONTENT) */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={loading || uploading}
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
