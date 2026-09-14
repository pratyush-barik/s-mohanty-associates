'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import {
  Section,
  Field,
  inputCls,
  FloatingNavigator,
  ActiveConfigBanner,
  ReportActionBar,
  NavItem,
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
  displayName: 'Axis Bank — HL-LAP (Bungalow/Individual House/Resale)',
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
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    return `Axis/SMA/${mm}-${yy}/${projectCode?.replace(/[^0-9]/g, '') || '01'}`;
  }, [projectCode]);

  // Initial State Setup
  const [fields, setFields] = useState<AxisHLLAPReportFields>(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : {};

    const defaultApprovedFloors: AxisHLLAPBUAFloor[] = Array.isArray(raw.approvedBUAFloors) && raw.approvedBUAFloors.length > 0
      ? raw.approvedBUAFloors
      : [
          { floor: 'G.F. (ground floor)', area: '510' },
          { floor: 'F.F. (first floor)', area: '510' },
        ];

    const defaultMeasuredFloors: AxisHLLAPBUAFloor[] = Array.isArray(raw.measuredBUAFloors) && raw.measuredBUAFloors.length > 0
      ? raw.measuredBUAFloors
      : [
          { floor: 'G.F. (ground floor)', area: '522' },
          { floor: 'F.F. (first floor)', area: '522' },
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
      road: raw.road || '15-Feet wide Road',
      city: raw.city || prefill?.serviceRequest?.city || 'Berhampur',
      district: raw.district || 'Ganjam',
      pinCode: raw.pinCode || prefill?.serviceRequest?.pincode || '',
      nearbyLandMark: raw.nearbyLandMark || '',
      distanceFromCityCenter: raw.distanceFromCityCenter || '',
      availabilityOfLocalTransport: raw.availabilityOfLocalTransport || 'Taxi, Auto',
      levelOfLand: raw.levelOfLand || 'Regular level land',
      classOfLocality: raw.classOfLocality || 'Middle Class',
      qualityOfInfrastructure: raw.qualityOfInfrastructure || 'Good',

      // 4n. Boundaries
      boundaryEastDeed: raw.boundaryEastDeed || 'Seller',
      boundaryEastActual: raw.boundaryEastActual || 'Vacant land',
      boundaryWestDeed: raw.boundaryWestDeed || '',
      boundaryWestActual: raw.boundaryWestActual || '',
      boundaryNorthDeed: raw.boundaryNorthDeed || '',
      boundaryNorthActual: raw.boundaryNorthActual || '',
      boundarySouthDeed: raw.boundarySouthDeed || 'Road',
      boundarySouthActual: raw.boundarySouthActual || '15 feet wide Road',

      // 4o - 4z
      boundariesMatch: raw.boundariesMatch || 'Yes(Boundary matching as per documents)',
      statusOfLand: raw.statusOfLand || 'Free Hold',
      typeOfProperty: raw.typeOfProperty || 'Residential',
      approvedUsage: raw.approvedUsage || 'Residential',
      actualUsage: raw.actualUsage || 'Residential',
      typeOfStructure: raw.typeOfStructure || 'RCC Framed Structure',
      noOfFloors: raw.noOfFloors || 'G+1 storied Residential building',
      occupancyDetails: raw.occupancyDetails || 'Self Occupied',
      hasElectricityWaterDrainage: raw.hasElectricityWaterDrainage || 'Yes',
      proximityToCivicAmenities: raw.proximityToCivicAmenities || 'Within 2-3 kms range',
      developmentOfSurroundingArea: raw.developmentOfSurroundingArea || 'Developing in surrounding area',
      latitude: raw.latitude || prefill?.latitude || '',
      longitude: raw.longitude || prefill?.longitude || '',

      // 5. APPROVAL DETAILS
      layoutApprovalNo: raw.layoutApprovalNo || 'NA',
      layoutApprovalDate: raw.layoutApprovalDate || 'NA',
      layoutExpiryDate: raw.layoutExpiryDate || 'NA',
      buildingPlanApprovalNo: raw.buildingPlanApprovalNo || 'Plan has been approved by Sarpanch Talapada GP vide letter no-01/26, dated-22/01/2026 for G+1 residential building',
      buildingPlanApprovalDate: raw.buildingPlanApprovalDate || '22/01/2026',
      buildingPlanExpiryDate: raw.buildingPlanExpiryDate || '21/01/2031',
      constructionCommencementDate: raw.constructionCommencementDate || '100% Completed',
      expectedCompletionDate: raw.expectedCompletionDate || 'NA',

      // 6. CONSTRUCTION DETAILS
      plotAreaDocs: raw.plotAreaDocs || 'Area of the plot=1263sqft(as per Documents)',
      demarcationAtSite: raw.demarcationAtSite || 'Yes',
      approvedBUATotal: raw.approvedBUATotal || '1020sqft',
      approvedBUAFloors: defaultApprovedFloors,
      measuredBUATotal: raw.measuredBUATotal || '1044sqft(Measured G+1)',
      measuredBUAFloors: defaultMeasuredFloors,
      isConstructionAsPerPlan: raw.isConstructionAsPerPlan || 'As per plan',
      detailsOfExtraConstruction: raw.detailsOfExtraConstruction || 'NA',
      sideMarginFront: raw.sideMarginFront || 'NA',
      sideMarginRight: raw.sideMarginRight || 'NA',
      sideMarginLeft: raw.sideMarginLeft || 'NA',
      sideMarginBack: raw.sideMarginBack || 'NA',
      qualityOfConstruction: raw.qualityOfConstruction || 'Good',
      maintenanceOfProperty: raw.maintenanceOfProperty || 'Good',
      currentLifeOfStructure: raw.currentLifeOfStructure || '2-Years',
      projectedLifeOfStructure: raw.projectedLifeOfStructure || '58-Years',

      // 7. Recommended Valuation
      recommendedRatePerSqft: raw.recommendedRatePerSqft || '500',
      plotAreaForValuation: raw.plotAreaForValuation || '522',
      plotRateForValuation: raw.plotRateForValuation || '500',
      valueOfPlotFlat: raw.valueOfPlotFlat || 'Value of Plot- 522sqft X Rs.500/- = Rs.2,61,000/-',
      estimatedCostOfConstruction: raw.estimatedCostOfConstruction || 'NA',
      totalCostOfConstruction: raw.totalCostOfConstruction || '1020sqft X Rs.1800/-=Rs.18,36,000/-',
      stageOfConstruction: raw.stageOfConstruction || '100%',
      percentWorkCompleted: raw.percentWorkCompleted || '100%',
      percentDisbursementRecommended: raw.percentDisbursementRecommended || '100%',
      currentValueOfProperty: raw.currentValueOfProperty || 'Rs.2,61,000/-+ Rs.18,36,000/-=Rs.20,97,000/-',
      dateOfPropertyVisit: raw.dateOfPropertyVisit || new Date().toISOString().split('T')[0],

      // 8 - 12
      valuationGovtReckonerRate: raw.valuationGovtReckonerRate || 'Rs.40/-per sqft of land',
      distressedValuation: raw.distressedValuation || 'Rs.16,77,600/-',
      rentalValuePerMonth: raw.rentalValuePerMonth || 'NA',
      photosAttached: raw.photosAttached || 'Attached',
      locationSketchAttached: raw.locationSketchAttached || 'Attached',
      remarks: raw.remarks || 'Subject Property is a G+1 storied residential building having land extent of 522sqft. Having total measured BUA 1044sqft. Plan has been approved by Sarpanch Talapada GP vide letter no-01/26, dated-22/01/2026 for G+1 residential building. Age of the building is more than 2-Years. All civic amenities are present within 2-3 kms & about 50kms form Berhampur city center. It is accessible with 15-feet wide road & surrounding areas are residential in nature. This building is used by the customer for residential purpose. Valuation has been done for land & approved BUA of G+1 only.',

      // Signatory
      valuerName: raw.valuerName || 'Er. Satyajit Mohanty',
      valuerTitle: raw.valuerTitle || 'Approved Panel Valuer',

      // Images
      propertyImages: raw.propertyImages || [],
      propertyImageNames: raw.propertyImageNames || [],
      locationMapImages: raw.locationMapImages || [],
      mouzaMapImages: raw.mouzaMapImages || [],
      sketchMapImages: raw.sketchMapImages || [],
    };
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showBucketModal, setShowBucketModal] = useState(false);

  // Field change handler
  const handleChange = (key: keyof AxisHLLAPReportFields, val: any) => {
    setFields(prev => ({ ...prev, [key]: val }));
  };

  // Dynamic Floor Handlers
  const addApprovedFloor = () => {
    setFields(prev => ({
      ...prev,
      approvedBUAFloors: [...(prev.approvedBUAFloors || []), { floor: 'New Floor', area: '0' }],
    }));
  };

  const removeApprovedFloor = (idx: number) => {
    setFields(prev => ({
      ...prev,
      approvedBUAFloors: prev.approvedBUAFloors.filter((_, i) => i !== idx),
    }));
  };

  const updateApprovedFloor = (idx: number, patch: Partial<AxisHLLAPBUAFloor>) => {
    setFields(prev => {
      const copy = [...prev.approvedBUAFloors];
      copy[idx] = { ...copy[idx], ...patch };
      return { ...prev, approvedBUAFloors: copy };
    });
  };

  const addMeasuredFloor = () => {
    setFields(prev => ({
      ...prev,
      measuredBUAFloors: [...(prev.measuredBUAFloors || []), { floor: 'New Floor', area: '0' }],
    }));
  };

  const removeMeasuredFloor = (idx: number) => {
    setFields(prev => ({
      ...prev,
      measuredBUAFloors: prev.measuredBUAFloors.filter((_, i) => i !== idx),
    }));
  };

  const updateMeasuredFloor = (idx: number, patch: Partial<AxisHLLAPBUAFloor>) => {
    setFields(prev => {
      const copy = [...prev.measuredBUAFloors];
      copy[idx] = { ...copy[idx], ...patch };
      return { ...prev, measuredBUAFloors: copy };
    });
  };

  // Recalculate totals and valuation whenever numeric inputs change
  const handleAutoCalculateValuation = () => {
    // 1. Calculate plot value
    const plotArea = parseNum(fields.plotAreaForValuation);
    const plotRate = parseNum(fields.plotRateForValuation || fields.recommendedRatePerSqft);
    const plotTotal = plotArea * plotRate;

    // 2. Sum approved BUA
    const appSum = fields.approvedBUAFloors.reduce((acc, f) => acc + parseNum(f.area), 0);
    // Parse construction rate from totalCostOfConstruction string or default 1800
    const constRateMatch = String(fields.totalCostOfConstruction).match(/Rs\.?\s*([0-9]+)/i);
    const constRate = constRateMatch ? parseNum(constRateMatch[1]) : 1800;
    const constTotal = appSum * constRate;

    // 3. Current Market Value = Plot Value + Construction Value
    const currentTotal = plotTotal + constTotal;

    // 4. Distressed Value = Exactly 80% of Current Value
    const distressedTotal = Math.round(currentTotal * 0.80);

    setFields(prev => ({
      ...prev,
      approvedBUATotal: `${appSum}sqft`,
      valueOfPlotFlat: `Value of Plot- ${plotArea}sqft X Rs.${plotRate}/- = Rs.${formatIndianCurrency(plotTotal)}/-`,
      totalCostOfConstruction: `${appSum}sqft X Rs.${constRate}/-=Rs.${formatIndianCurrency(constTotal)}/-`,
      currentValueOfProperty: `Rs.${formatIndianCurrency(plotTotal)}/-+ Rs.${formatIndianCurrency(constTotal)}/-=Rs.${formatIndianCurrency(currentTotal)}/-`,
      distressedValuation: `Rs.${formatIndianCurrency(distressedTotal)}/-`,
    }));

    setMessage({ text: 'Calculations updated successfully!', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  // Autosave setup
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (isReadOnly) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(async () => {
      setAutoSaveStatus('saving');
      try {
        await saveReportDraft(projectId, fields);
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('error');
      }
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [fields, projectId, isReadOnly]);

  // Manual Draft Save
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      setMessage({ text: 'Draft saved successfully!', type: 'success' });
      setAutoSaveStatus('saved');
    } catch {
      setMessage({ text: 'Failed to save draft.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  // Submit to Manager
  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this valuation report for verification?')) return;
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      await submitReportForVerification(projectId);
      setMessage({ text: 'Report submitted successfully!', type: 'success' });
      router.refresh();
    } catch {
      setMessage({ text: 'Failed to submit report.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3500);
    }
  };

  // Image Upload Handlers
  const handleUploadPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      const names: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${projectId}/axis_photo_${Date.now()}_${i}.${file.name.split('.').pop()}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(path, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(path);
        urls.push(data.publicUrl);
        names.push(file.name.replace(/\.[^/.]+$/, ''));
      }
      setFields(prev => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...urls],
        propertyImageNames: [...(prev.propertyImageNames || []), ...names],
      }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleUploadSingleMap = async (key: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const path = `${projectId}/axis_${key}_${Date.now()}_${i}.${file.name.split('.').pop()}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(path, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      setFields(prev => ({
        ...prev,
        [key]: [...(prev[key] || []), ...urls],
      }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // PDF Generation Flow
  const buildPDF = async (): Promise<Uint8Array> => {
    // 1. Fetch photos bytes
    const photoBytesList: { bytes: Uint8Array; label?: string }[] = [];
    if (fields.propertyImages && fields.propertyImages.length > 0) {
      for (let i = 0; i < fields.propertyImages.length; i++) {
        const url = fields.propertyImages[i];
        const b = await fetchBytes(url);
        if (b) {
          photoBytesList.push({
            bytes: b,
            label: fields.propertyImageNames?.[i] || `Photo ${i + 1}`,
          });
        }
      }
    }

    // 2. Fetch maps bytes
    const locMapBytes: Uint8Array[] = [];
    if (fields.locationMapImages && fields.locationMapImages.length > 0) {
      for (const url of fields.locationMapImages) {
        const b = await fetchBytes(url);
        if (b) locMapBytes.push(b);
      }
    }

    const mouzaMapBytes: Uint8Array[] = [];
    if (fields.mouzaMapImages && fields.mouzaMapImages.length > 0) {
      for (const url of fields.mouzaMapImages) {
        const b = await fetchBytes(url);
        if (b) mouzaMapBytes.push(b);
      }
    }

    const sketchMapBytes: Uint8Array[] = [];
    if (fields.sketchMapImages && fields.sketchMapImages.length > 0) {
      for (const url of fields.sketchMapImages) {
        const b = await fetchBytes(url);
        if (b) sketchMapBytes.push(b);
      }
    }

    // 3. Renderer instantiation
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
    setLoading(true);
    try {
      const pdfBytes = await buildPDF();
      const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert('Error generating PDF preview: ' + err.message);
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
    { id: 'sec-1', title: '1. Customer & Loan Details' },
    { id: 'sec-2', title: '2. Documents Provided' },
    { id: 'sec-3', title: '3. Property Overview & Location' },
    { id: 'sec-4', title: '4. Boundaries (Deed vs Actual)' },
    { id: 'sec-5', title: '5. Site & Structure Attributes' },
    { id: 'sec-6', title: '6. Approval Details' },
    { id: 'sec-7', title: '7. Construction Details & Dynamic BUA' },
    { id: 'sec-8', title: '8. Recommended Valuation' },
    { id: 'sec-9', title: '9. Govt Reckoner & Distressed Value' },
    { id: 'sec-10', title: '10. Rental & Attachments' },
    { id: 'sec-11', title: '11. Photographs & Location Maps' },
    { id: 'sec-12', title: '12. Remarks & Valuer Signatory' },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24">
      {/* 1. Top Active Configuration Banner */}
      <ActiveConfigBanner
        bankName="AXIS BANK"
        formatName="HL-LAP (Bungalow/Individual House/Resale)"
        onResetWizard={onResetWizard}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 flex gap-6">
        {/* Floating Navigator */}
        <FloatingNavigator sections={NAV_SECTIONS} />

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">

          {/* Section 1: Customer & Loan Details */}
          <Section title="1. Customer & Loan Details" id="sec-1" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Reference Number">
                <input
                  type="text"
                  value={fields.refNo}
                  onChange={e => handleChange('refNo', e.target.value)}
                  className={inputCls}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Date of Report">
                <input
                  type="date"
                  value={fields.reportDate}
                  onChange={e => handleChange('reportDate', e.target.value)}
                  className={inputCls}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Name of the Customer">
                <input
                  type="text"
                  value={fields.customerName}
                  onChange={e => handleChange('customerName', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Jitendra Kumar Sahu"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Customer Contact Details">
                <input
                  type="text"
                  value={fields.customerContactDetails}
                  onChange={e => handleChange('customerContactDetails', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Jitendra Kumar Sahu - 7600427255"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="2. APP ID">
                <input
                  type="text"
                  value={fields.appId}
                  onChange={e => handleChange('appId', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 30890902"
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          {/* Section 2: Documents Provided */}
          <Section title="2. Documents Provided" id="sec-2" defaultOpen={true}>
            <Field label="3. Documents Provided: Approved Layout/ Approved Building Plan/ NA order/ Four Boundaries Details">
              <textarea
                rows={3}
                value={fields.documentsProvided}
                onChange={e => handleChange('documentsProvided', e.target.value)}
                className={inputCls}
                placeholder="e.g. Copy of Sale deed, ROR, Approved plan"
                disabled={isReadOnly}
              />
            </Field>
          </Section>

          {/* Section 3: Property Details & Location */}
          <Section title="3. Property Overview & Location" id="sec-3" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="4. Property Details (Full Description)" span={2}>
                <textarea
                  rows={2}
                  value={fields.propertyDetailsHeader}
                  onChange={e => handleChange('propertyDetailsHeader', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Khata No-344/113, Plot No-1677/2604 (Ac.0.012Decs, Homestead), Mouza- Ambajhara Nuapalli, Tahasil/PS- Khalikot, Dist- Ganjam, Odisha, Pin- 761031"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="a. Plot No">
                <input
                  type="text"
                  value={fields.plotNo}
                  onChange={e => handleChange('plotNo', e.target.value)}
                  className={inputCls}
                  placeholder="Plot No- 1677/2604"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="b. S No/G. No/Khasra No/Khata No">
                <input
                  type="text"
                  value={fields.khataNo}
                  onChange={e => handleChange('khataNo', e.target.value)}
                  className={inputCls}
                  placeholder="Khata No-344/113"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="c. Locality">
                <input
                  type="text"
                  value={fields.locality}
                  onChange={e => handleChange('locality', e.target.value)}
                  className={inputCls}
                  placeholder="Ambajhara Nuapalli"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="d. Road">
                <input
                  type="text"
                  value={fields.road}
                  onChange={e => handleChange('road', e.target.value)}
                  className={inputCls}
                  placeholder="15-Feet wide Road"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="e. City">
                <input
                  type="text"
                  value={fields.city}
                  onChange={e => handleChange('city', e.target.value)}
                  className={inputCls}
                  placeholder="Berhampur"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="f. District">
                <input
                  type="text"
                  value={fields.district}
                  onChange={e => handleChange('district', e.target.value)}
                  className={inputCls}
                  placeholder="Ganjam"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="g. Pin code">
                <input
                  type="text"
                  value={fields.pinCode}
                  onChange={e => handleChange('pinCode', e.target.value)}
                  className={inputCls}
                  placeholder="761031"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="h. Nearby Land Mark">
                <input
                  type="text"
                  value={fields.nearbyLandMark}
                  onChange={e => handleChange('nearbyLandMark', e.target.value)}
                  className={inputCls}
                  placeholder="Near Khandeswar Temple"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="i. Distance from City Center">
                <input
                  type="text"
                  value={fields.distanceFromCityCenter}
                  onChange={e => handleChange('distanceFromCityCenter', e.target.value)}
                  className={inputCls}
                  placeholder="50-kms from Berhampur city center"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="j. Availability of Local Transport : Metro/ Local Train/ Bus">
                <input
                  type="text"
                  value={fields.availabilityOfLocalTransport}
                  onChange={e => handleChange('availabilityOfLocalTransport', e.target.value)}
                  className={inputCls}
                  placeholder="Taxi, Auto"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="k. Level of land with topographical conditions">
                <input
                  type="text"
                  value={fields.levelOfLand}
                  onChange={e => handleChange('levelOfLand', e.target.value)}
                  className={inputCls}
                  placeholder="Regular level land"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="l. Class Of Locality">
                <input
                  type="text"
                  value={fields.classOfLocality}
                  onChange={e => handleChange('classOfLocality', e.target.value)}
                  className={inputCls}
                  placeholder="Middle Class"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="m. Quality of Infrastructure in the vicinity">
                <input
                  type="text"
                  value={fields.qualityOfInfrastructure}
                  onChange={e => handleChange('qualityOfInfrastructure', e.target.value)}
                  className={inputCls}
                  placeholder="Good"
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          {/* Section 4: Boundaries (Deed vs Actual) */}
          <Section title="4. Boundaries (Deed vs Actual)" id="sec-4" defaultOpen={true}>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-3 border-b border-r w-24">Direction</th>
                    <th className="p-3 border-b border-r">As Per Sale Deed</th>
                    <th className="p-3 border-b">As Per Actual (Site)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50 border-r">East</td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        value={fields.boundaryEastDeed}
                        onChange={e => handleChange('boundaryEastDeed', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Seller"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={fields.boundaryEastActual}
                        onChange={e => handleChange('boundaryEastActual', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Vacant land"
                        disabled={isReadOnly}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50 border-r">West</td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        value={fields.boundaryWestDeed}
                        onChange={e => handleChange('boundaryWestDeed', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Balaram Swain"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={fields.boundaryWestActual}
                        onChange={e => handleChange('boundaryWestActual', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. House of Balaram Swain"
                        disabled={isReadOnly}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50 border-r">North</td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        value={fields.boundaryNorthDeed}
                        onChange={e => handleChange('boundaryNorthDeed', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Laxman Swain"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={fields.boundaryNorthActual}
                        onChange={e => handleChange('boundaryNorthActual', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Land of Laxman Swain"
                        disabled={isReadOnly}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-slate-600 bg-slate-50 border-r">South</td>
                    <td className="p-2 border-r">
                      <input
                        type="text"
                        value={fields.boundarySouthDeed}
                        onChange={e => handleChange('boundarySouthDeed', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. Road"
                        disabled={isReadOnly}
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={fields.boundarySouthActual}
                        onChange={e => handleChange('boundarySouthActual', e.target.value)}
                        className={inputCls}
                        placeholder="e.g. 15 feet wide Road"
                        disabled={isReadOnly}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <Field label="o. Does the Boundaries at Site match, as mentioned in documentation?">
                <input
                  type="text"
                  value={fields.boundariesMatch}
                  onChange={e => handleChange('boundariesMatch', e.target.value)}
                  className={inputCls}
                  placeholder="Yes(Boundary matching as per documents)"
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          {/* Section 5: Site & Structure Attributes */}
          <Section title="5. Site & Structure Attributes" id="sec-5" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="p. Status of the Land/ Flat : Free Hold/Leased / Development Authority">
                <input
                  type="text"
                  value={fields.statusOfLand}
                  onChange={e => handleChange('statusOfLand', e.target.value)}
                  className={inputCls}
                  placeholder="Free Hold"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="q. Type of Property : Bungalow/row house/Plot/ flat /commercial">
                <input
                  type="text"
                  value={fields.typeOfProperty}
                  onChange={e => handleChange('typeOfProperty', e.target.value)}
                  className={inputCls}
                  placeholder="Residential"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="r. Approved usage of Property">
                <input
                  type="text"
                  value={fields.approvedUsage}
                  onChange={e => handleChange('approvedUsage', e.target.value)}
                  className={inputCls}
                  placeholder="Residential"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="s. Actual Usage of the Property">
                <input
                  type="text"
                  value={fields.actualUsage}
                  onChange={e => handleChange('actualUsage', e.target.value)}
                  className={inputCls}
                  placeholder="Residential"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="t. Type of Structure : Load Bearing/RCC/Aluform shuttering">
                <input
                  type="text"
                  value={fields.typeOfStructure}
                  onChange={e => handleChange('typeOfStructure', e.target.value)}
                  className={inputCls}
                  placeholder="RCC Framed Structure"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="u. No of Floors">
                <input
                  type="text"
                  value={fields.noOfFloors}
                  onChange={e => handleChange('noOfFloors', e.target.value)}
                  className={inputCls}
                  placeholder="G+1 storied Residential building"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="v. Occupancy Details: Self Occupied/Rented/ Vacant">
                <input
                  type="text"
                  value={fields.occupancyDetails}
                  onChange={e => handleChange('occupancyDetails', e.target.value)}
                  className={inputCls}
                  placeholder="Self"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="w. Does property have Electricity / Water / Drainage connection">
                <input
                  type="text"
                  value={fields.hasElectricityWaterDrainage}
                  onChange={e => handleChange('hasElectricityWaterDrainage', e.target.value)}
                  className={inputCls}
                  placeholder="Yes"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="x. Proximity to civic amenities like school, hospital, market, etc">
                <input
                  type="text"
                  value={fields.proximityToCivicAmenities}
                  onChange={e => handleChange('proximityToCivicAmenities', e.target.value)}
                  className={inputCls}
                  placeholder="Within 2-3 kms range"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="y. Development of surrounding area">
                <input
                  type="text"
                  value={fields.developmentOfSurroundingArea}
                  onChange={e => handleChange('developmentOfSurroundingArea', e.target.value)}
                  className={inputCls}
                  placeholder="Developing in surrounding area"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="z. (i) Latitude">
                <input
                  type="text"
                  value={fields.latitude}
                  onChange={e => handleChange('latitude', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 19.597680"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="z. (ii) Longitude">
                <input
                  type="text"
                  value={fields.longitude}
                  onChange={e => handleChange('longitude', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. 85.001200"
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          {/* Section 6: Approval Details */}
          <Section title="6. Approval Details" id="sec-6" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="a. Layout Approval No">
                <input
                  type="text"
                  value={fields.layoutApprovalNo}
                  onChange={e => handleChange('layoutApprovalNo', e.target.value)}
                  className={inputCls}
                  placeholder="NA"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="b. Date of Layout Approval">
                <input
                  type="text"
                  value={fields.layoutApprovalDate}
                  onChange={e => handleChange('layoutApprovalDate', e.target.value)}
                  className={inputCls}
                  placeholder="NA"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="c. Expiry Date of Layout Approval">
                <input
                  type="text"
                  value={fields.layoutExpiryDate}
                  onChange={e => handleChange('layoutExpiryDate', e.target.value)}
                  className={inputCls}
                  placeholder="NA"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="d. Building Plan Approval No" span={2}>
                <textarea
                  rows={2}
                  value={fields.buildingPlanApprovalNo}
                  onChange={e => handleChange('buildingPlanApprovalNo', e.target.value)}
                  className={inputCls}
                  placeholder="Plan has been approved by Sarpanch Talapada GP vide letter no-01/26, dated-22/01/2026 for G+1 residential building"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="e. Date of Plan Approval">
                <input
                  type="text"
                  value={fields.buildingPlanApprovalDate}
                  onChange={e => handleChange('buildingPlanApprovalDate', e.target.value)}
                  className={inputCls}
                  placeholder="22/01/2026"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="f. Expiry Date of Plan Approval">
                <input
                  type="text"
                  value={fields.buildingPlanExpiryDate}
                  onChange={e => handleChange('buildingPlanExpiryDate', e.target.value)}
                  className={inputCls}
                  placeholder="21/01/2031"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="g. Date of Commencement of Construction">
                <input
                  type="text"
                  value={fields.constructionCommencementDate}
                  onChange={e => handleChange('constructionCommencementDate', e.target.value)}
                  className={inputCls}
                  placeholder="100% Completed"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="h. Expected Completion">
                <input
                  type="text"
                  value={fields.expectedCompletionDate}
                  onChange={e => handleChange('expectedCompletionDate', e.target.value)}
                  className={inputCls}
                  placeholder="NA"
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          {/* Section 7: Construction Details & Dynamic BUA */}
          <Section title="7. Construction Details & Dynamic BUA" id="sec-7" defaultOpen={true}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="a. Area of the Plot/Flat (as per Documents)">
                  <input
                    type="text"
                    value={fields.plotAreaDocs}
                    onChange={e => handleChange('plotAreaDocs', e.target.value)}
                    className={inputCls}
                    placeholder="Area of the plot=1263sqft(as per Documents)"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="b. Demarcation at Site">
                  <input
                    type="text"
                    value={fields.demarcationAtSite}
                    onChange={e => handleChange('demarcationAtSite', e.target.value)}
                    className={inputCls}
                    placeholder="Yes"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Dynamic Approved BUA Floor Table */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    c. Approved Built up Area (Floor-wise Breakup)
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full">
                      Total: {fields.approvedBUATotal}
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={addApprovedFloor}
                        className="px-3 py-1 text-xs font-bold bg-[#1e3a5f] text-white rounded-lg hover:bg-[#0f2038] transition-colors"
                      >
                        + Add Floor
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {fields.approvedBUAFloors.map((fl, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={fl.floor}
                        onChange={e => updateApprovedFloor(idx, { floor: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs border rounded-lg bg-white"
                        placeholder="e.g. G.F. (ground floor)"
                        disabled={isReadOnly}
                      />
                      <input
                        type="text"
                        value={fl.area}
                        onChange={e => updateApprovedFloor(idx, { area: e.target.value })}
                        className="w-32 px-3 py-2 text-xs border rounded-lg bg-white text-right font-semibold"
                        placeholder="Area (sqft)"
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && fields.approvedBUAFloors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeApprovedFloor(idx)}
                          className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold"
                          title="Remove floor"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic Measured BUA Floor Table */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    d. Measured Built up Area (Floor-wise Breakup)
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                      Total: {fields.measuredBUATotal}
                    </span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={addMeasuredFloor}
                        className="px-3 py-1 text-xs font-bold bg-[#1e3a5f] text-white rounded-lg hover:bg-[#0f2038] transition-colors"
                      >
                        + Add Floor
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  {fields.measuredBUAFloors.map((fl, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={fl.floor}
                        onChange={e => updateMeasuredFloor(idx, { floor: e.target.value })}
                        className="flex-1 px-3 py-2 text-xs border rounded-lg bg-white"
                        placeholder="e.g. G.F. (ground floor)"
                        disabled={isReadOnly}
                      />
                      <input
                        type="text"
                        value={fl.area}
                        onChange={e => updateMeasuredFloor(idx, { area: e.target.value })}
                        className="w-32 px-3 py-2 text-xs border rounded-lg bg-white text-right font-semibold"
                        placeholder="Area (sqft)"
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && fields.measuredBUAFloors.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMeasuredFloor(idx)}
                          className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold"
                          title="Remove floor"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="f. Whether construction is as per approved plan">
                  <input
                    type="text"
                    value={fields.isConstructionAsPerPlan}
                    onChange={e => handleChange('isConstructionAsPerPlan', e.target.value)}
                    className={inputCls}
                    placeholder="As per plan"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="g. Details of Extra Construction">
                  <input
                    type="text"
                    value={fields.detailsOfExtraConstruction}
                    onChange={e => handleChange('detailsOfExtraConstruction', e.target.value)}
                    className={inputCls}
                    placeholder="NA"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Side Margins */}
              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  h. Recommended / Available Side Margin
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Front</label>
                    <input
                      type="text"
                      value={fields.sideMarginFront}
                      onChange={e => handleChange('sideMarginFront', e.target.value)}
                      className={inputCls}
                      placeholder="NA"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Right Side</label>
                    <input
                      type="text"
                      value={fields.sideMarginRight}
                      onChange={e => handleChange('sideMarginRight', e.target.value)}
                      className={inputCls}
                      placeholder="NA"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Left Side</label>
                    <input
                      type="text"
                      value={fields.sideMarginLeft}
                      onChange={e => handleChange('sideMarginLeft', e.target.value)}
                      className={inputCls}
                      placeholder="NA"
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 block mb-1">Back Side</label>
                    <input
                      type="text"
                      value={fields.sideMarginBack}
                      onChange={e => handleChange('sideMarginBack', e.target.value)}
                      className={inputCls}
                      placeholder="NA"
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Field label="i. Quality of construction">
                  <input
                    type="text"
                    value={fields.qualityOfConstruction}
                    onChange={e => handleChange('qualityOfConstruction', e.target.value)}
                    className={inputCls}
                    placeholder="Good"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="j. Maintenance of Property">
                  <input
                    type="text"
                    value={fields.maintenanceOfProperty}
                    onChange={e => handleChange('maintenanceOfProperty', e.target.value)}
                    className={inputCls}
                    placeholder="Good"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="k. Current Life of structure">
                  <input
                    type="text"
                    value={fields.currentLifeOfStructure}
                    onChange={e => handleChange('currentLifeOfStructure', e.target.value)}
                    className={inputCls}
                    placeholder="2-Years"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="l. Projected Life of Structure">
                  <input
                    type="text"
                    value={fields.projectedLifeOfStructure}
                    onChange={e => handleChange('projectedLifeOfStructure', e.target.value)}
                    className={inputCls}
                    placeholder="58-Years"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Section 8: Recommended Valuation */}
          <Section title="8. Recommended Valuation of Property" id="sec-8" defaultOpen={true}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  Enter parameters below and click &quot;Auto-Calculate&quot; to update land, construction &amp; distressed values.
                </span>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAutoCalculateValuation}
                    className="px-4 py-1.5 text-xs font-bold bg-[#b8860b] text-white rounded-lg hover:bg-[#8a6507] transition-all shadow-xs"
                  >
                    ⚡ Auto-Calculate Values
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Plot Area for Valuation (sqft)">
                  <input
                    type="text"
                    value={fields.plotAreaForValuation}
                    onChange={e => handleChange('plotAreaForValuation', e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 522"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="a. Recommended Rate (Rs/sqft)">
                  <input
                    type="text"
                    value={fields.plotRateForValuation}
                    onChange={e => handleChange('plotRateForValuation', e.target.value)}
                    className={inputCls}
                    placeholder="e.g. 500"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Estimated Cost of Construction">
                  <input
                    type="text"
                    value={fields.estimatedCostOfConstruction}
                    onChange={e => handleChange('estimatedCostOfConstruction', e.target.value)}
                    className={inputCls}
                    placeholder="NA"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="b. Value of the Plot/Flat (Description/Result)">
                  <input
                    type="text"
                    value={fields.valueOfPlotFlat}
                    onChange={e => handleChange('valueOfPlotFlat', e.target.value)}
                    className={inputCls}
                    placeholder="Value of Plot- 522sqft X Rs.500/- = Rs.2,61,000/-"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="d. Total Cost of construction (approved G+1)">
                  <input
                    type="text"
                    value={fields.totalCostOfConstruction}
                    onChange={e => handleChange('totalCostOfConstruction', e.target.value)}
                    className={inputCls}
                    placeholder="1020sqft X Rs.1800/-=Rs.18,36,000/-"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="e. Stage of Construction">
                  <input
                    type="text"
                    value={fields.stageOfConstruction}
                    onChange={e => handleChange('stageOfConstruction', e.target.value)}
                    className={inputCls}
                    placeholder="100%"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="f. % Work completed">
                  <input
                    type="text"
                    value={fields.percentWorkCompleted}
                    onChange={e => handleChange('percentWorkCompleted', e.target.value)}
                    className={inputCls}
                    placeholder="100%"
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="g. % Disbursement Recommended">
                  <input
                    type="text"
                    value={fields.percentDisbursementRecommended}
                    onChange={e => handleChange('percentDisbursementRecommended', e.target.value)}
                    className={inputCls}
                    placeholder="100%"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
                <Field label="Current Value of the Property (Plot + Construction) on 100% Completion">
                  <input
                    type="text"
                    value={fields.currentValueOfProperty}
                    onChange={e => handleChange('currentValueOfProperty', e.target.value)}
                    className={`${inputCls} font-bold text-amber-900`}
                    placeholder="Rs.2,61,000/-+ Rs.18,36,000/-=Rs.20,97,000/-"
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="i. Date of Property Visit">
                  <input
                    type="date"
                    value={fields.dateOfPropertyVisit}
                    onChange={e => handleChange('dateOfPropertyVisit', e.target.value)}
                    className={inputCls}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Section 9: Govt Reckoner & Distressed Value */}
          <Section title="9. Govt Reckoner & Distressed Value" id="sec-9" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="8. Valuation as per Government reckoner rates">
                <input
                  type="text"
                  value={fields.valuationGovtReckonerRate}
                  onChange={e => handleChange('valuationGovtReckonerRate', e.target.value)}
                  className={inputCls}
                  placeholder="Rs.40/-per sqft of land"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="9. Distressed Valuation of Property (80% of Current Market Value)">
                <input
                  type="text"
                  value={fields.distressedValuation}
                  onChange={e => handleChange('distressedValuation', e.target.value)}
                  className={`${inputCls} font-bold text-rose-700 bg-rose-50/40`}
                  placeholder="Rs.16,77,600/-"
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          {/* Section 10: Rental & Attachments */}
          <Section title="10. Rental & Attachments" id="sec-10" defaultOpen={true}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="10. Rental value per month">
                <input
                  type="text"
                  value={fields.rentalValuePerMonth}
                  onChange={e => handleChange('rentalValuePerMonth', e.target.value)}
                  className={inputCls}
                  placeholder="NA"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="11a. Photos attached">
                <input
                  type="text"
                  value={fields.photosAttached}
                  onChange={e => handleChange('photosAttached', e.target.value)}
                  className={inputCls}
                  placeholder="Attached"
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="11b. Location sketch attached">
                <input
                  type="text"
                  value={fields.locationSketchAttached}
                  onChange={e => handleChange('locationSketchAttached', e.target.value)}
                  className={inputCls}
                  placeholder="Attached"
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          {/* Section 11: Photographs & Maps */}
          <Section title="11. Photographs & Location Maps" id="sec-11" defaultOpen={true}>
            <div className="space-y-6">
              {/* Photographs with Bucket Modal & Local Upload */}
              <BasePhotographsSection
                title="Property Photographs"
                propertyImages={fields.propertyImages || []}
                propertyImageNames={fields.propertyImageNames || []}
                isReadOnly={isReadOnly}
                uploading={uploading}
                bucketCount={bucketImages.length}
                onImageNameChange={(idx, name) => {
                  setFields(prev => {
                    const copy = [...(prev.propertyImageNames || [])];
                    copy[idx] = name;
                    return { ...prev, propertyImageNames: copy };
                  });
                }}
                onRemoveImage={idx => {
                  setFields(prev => ({
                    ...prev,
                    propertyImages: (prev.propertyImages || []).filter((_, i) => i !== idx),
                    propertyImageNames: (prev.propertyImageNames || []).filter((_, i) => i !== idx),
                  }));
                }}
                onReorderImages={(newImgs, newNames) => {
                  setFields(prev => ({
                    ...prev,
                    propertyImages: newImgs,
                    propertyImageNames: newNames,
                  }));
                }}
                onUploadImages={handleUploadPhotos}
                onOpenBucketPicker={() => setShowBucketModal(true)}
                withoutSectionWrapper={true}
              />

              {/* Maps & Documents (Device Upload Only) */}
              <div className="pt-6 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-800 mb-4 block">
                  Maps (Location Map &amp; Mouza Map)
                </span>
                <BaseMapsSection
                  locationMapImages={fields.locationMapImages || []}
                  mouzaMapImages={fields.mouzaMapImages || []}
                  sketchMapImages={fields.sketchMapImages || []}
                  latitude={fields.latitude}
                  longitude={fields.longitude}
                  isReadOnly={isReadOnly}
                  uploading={uploading}
                  onLatitudeChange={val => handleChange('latitude', val)}
                  onLongitudeChange={val => handleChange('longitude', val)}
                  onLocationMapUpload={e => handleUploadSingleMap('locationMapImages', e)}
                  onLocationMapRemove={idx => {
                    setFields(prev => ({
                      ...prev,
                      locationMapImages: (prev.locationMapImages || []).filter((_, i) => i !== idx),
                    }));
                  }}
                  onMouzaMapUpload={e => handleUploadSingleMap('mouzaMapImages', e)}
                  onMouzaMapRemove={idx => {
                    setFields(prev => ({
                      ...prev,
                      mouzaMapImages: (prev.mouzaMapImages || []).filter((_, i) => i !== idx),
                    }));
                  }}
                  onSketchMapUpload={e => handleUploadSingleMap('sketchMapImages', e)}
                  onSketchMapRemove={idx => {
                    setFields(prev => ({
                      ...prev,
                      sketchMapImages: prev.sketchMapImages?.filter((_, i) => i !== idx) || [],
                    }));
                  }}
                  withoutSectionWrapper={true}
                />
              </div>
            </div>
          </Section>

          {/* Section 12: Remarks & Signatory */}
          <Section title="12. Remarks & Valuer Signatory" id="sec-12" defaultOpen={true}>
            <div className="space-y-4">
              <Field label="12. Remarks (Mandatory Observations)">
                <textarea
                  rows={6}
                  value={fields.remarks}
                  onChange={e => handleChange('remarks', e.target.value)}
                  className={inputCls}
                  placeholder="Enter detailed observations..."
                  disabled={isReadOnly}
                />
              </Field>

              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Undertaking &amp; Signatory
                </span>
                <p className="text-xs text-slate-600 italic">
                  I have personally visited the property &amp; identified the same based on the documents provided.
                  I/We have no direct or Indirect Interest in the property being valued.
                  The information furnished above is true and correct to my/our knowledge.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <Field label="Valuer Name">
                    <input
                      type="text"
                      value={fields.valuerName}
                      onChange={e => handleChange('valuerName', e.target.value)}
                      className={inputCls}
                      placeholder="Er. Satyajit Mohanty"
                      disabled={isReadOnly}
                    />
                  </Field>

                  <Field label="Designation / Authority">
                    <input
                      type="text"
                      value={fields.valuerTitle}
                      onChange={e => handleChange('valuerTitle', e.target.value)}
                      className={inputCls}
                      placeholder="Approved Panel Valuer"
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </Section>

        </div>
      </div>

      {/* Report Action Bar (Sticky Bottom) */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={autoSaveStatus}
        message={message}
        loading={loading}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
      />

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
