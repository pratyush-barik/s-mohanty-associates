'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import {
  PDFArthanFinanceRenderer,
  ArthanFinanceReportFields,
  ArthanFinanceBUAFloor,
} from '@/lib/banks/pdf-arthan-finance-renderer';
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
  BasePhotographsSection,
  BasePhotoBucketModal,
  fetchBytes,
} from '../BaseBankReportComponents';
import { normalizeMapImages, BankConfig } from '@/lib/bank-fields';
import { decodeHtmlEntitiesDeep } from '@/lib/html-entities';

export const ARTHAN_FINANCE_CONFIG: BankConfig = {
  bankId: 'ARTHAN FINANCE',
  subTemplateId: '',
  displayName: 'Arthan Finance',
};

export interface ArthanFinanceProps {
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

export default function ArthanFinance({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: ArthanFinanceProps) {
  const router = useRouter();
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  // ── Initial State ──
  const initialData: ArthanFinanceReportFields = useMemo(() => {
    const raw = (typeof initialFields === 'object' && initialFields !== null) ? initialFields : {};
    return {
      // Header
      dateOfValuation: formatReportDate(raw.dateOfValuation || raw.dateOfReportSubmission || new Date()),

      // Section 1 — Technical Initiation Request Form Data
      proposalNo: raw.proposalNo || (projectCode ? `AFPL/${projectCode}` : ''),
      caseType: raw.caseType || 'SBL',
      dateOfInspection: formatReportDate(raw.dateOfInspection || prefill?.inspectionDate || ''),
      nearestLandmark: raw.nearestLandmark || '',
      customerName: raw.customerName || prefill?.contactName || '',
      ownerName: raw.ownerName || prefill?.contactName || '',
      personMetOnSite: raw.personMetOnSite || prefill?.contactName || '',
      addressAsPerTRF: raw.addressAsPerTRF || raw.propertyAddress || prefill?.propertyAddress || '',
      addressAsPerDocument: raw.addressAsPerDocument || raw.propertyAddress || prefill?.propertyAddress || '',
      addressAsPerActualSite: raw.addressAsPerActualSite || raw.propertyAddress || prefill?.propertyAddress || '',
      documentsProvided: raw.documentsProvided || 'Copy of ROR & Sketch map',

      // Section 2 — Locational & Property Specific Details
      statusOfLandHolding: raw.statusOfLandHolding || 'Freehold(Homestead)',
      developedBy: raw.developedBy || 'NA',
      typeOfProperty: raw.typeOfProperty || 'SORP',
      typeOfLocality: raw.typeOfLocality || 'Developing',
      dateOfInspectionSite: formatReportDate(raw.dateOfInspectionSite || raw.dateOfInspection || prefill?.inspectionDate || ''),
      occupationStatus: raw.occupationStatus || 'Self Occupied',
      locationZoningMasterPlan: raw.locationZoningMasterPlan || 'NA',
      propertyUsage: raw.propertyUsage || 'Residential',
      plotDemarcation: raw.plotDemarcation || 'No',
      propertyIdentifiable: raw.propertyIdentifiable || 'No',
      identifiedThrough: raw.identifiedThrough || 'Customer',
      withinMCLimit: raw.withinMCLimit || '',
      internalFinishing: raw.internalFinishing || 'Average',
      typeOfStructure: raw.typeOfStructure || 'RCC',
      noOfFloors: raw.noOfFloors || 'GF',
      locatedOnFloorNo: raw.locatedOnFloorNo || 'GF',
      totalFlatsUnits: raw.totalFlatsUnits || '1',
      externalFinishing: raw.externalFinishing || 'Average',
      externalFinishingDetail: raw.externalFinishingDetail || 'Average',
      yearOfCompletion: raw.yearOfCompletion || '',
      constructionStage: raw.constructionStage || '100%',
      disbursementRecommended: raw.disbursementRecommended || '100%',
      ageOfProperty: raw.ageOfProperty || '',
      futurePhysicalLife: raw.futurePhysicalLife || '',

      // Section 3 — Boundaries
      boundaryNorthDocs: raw.boundaryNorthDocs || 'Not provided',
      boundarySouthDocs: raw.boundarySouthDocs || 'Not provided',
      boundaryEastDocs: raw.boundaryEastDocs || 'Not provided',
      boundaryWestDocs: raw.boundaryWestDocs || 'Not provided',
      boundaryNorthSketch: raw.boundaryNorthSketch || '',
      boundarySouthSketch: raw.boundarySouthSketch || '',
      boundaryEastSketch: raw.boundaryEastSketch || '',
      boundaryWestSketch: raw.boundaryWestSketch || '',
      boundaryNorthSite: raw.boundaryNorthSite || '',
      boundarySouthSite: raw.boundarySouthSite || '',
      boundaryEastSite: raw.boundaryEastSite || '',
      boundaryWestSite: raw.boundaryWestSite || '',
      boundariesMatching: raw.boundariesMatching || 'Yes',
      boundariesNotMatchingReason: raw.boundariesNotMatchingReason || '',

      // Section 4 — Setbacks
      setbackFrontSanctioned: raw.setbackFrontSanctioned || 'NA',
      setbackRearSanctioned: raw.setbackRearSanctioned || 'NA',
      setbackLeftSanctioned: raw.setbackLeftSanctioned || 'NA',
      setbackRightSanctioned: raw.setbackRightSanctioned || 'NA',
      setbackFrontSite: raw.setbackFrontSite || '',
      setbackRearSite: raw.setbackRearSite || '',
      setbackLeftSite: raw.setbackLeftSite || '',
      setbackRightSite: raw.setbackRightSite || '',

      // Section 5 — Height
      heightSanctioned: raw.heightSanctioned || 'NA',
      heightSite: raw.heightSite || '',

      // Section 6 — BUA
      buaFloors: Array.isArray(raw.buaFloors) && raw.buaFloors.length > 0 ? raw.buaFloors : [
        { floor: 'Basement / Stilt', accommodation: 'NA', carpetArea: 'NA', actualBUA: 'NA', permissibleBUA: 'NA', adoptedBUA: 'NA' },
        { floor: 'Ground Floor', accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: 'NA', adoptedBUA: '' },
        { floor: 'First Floor', accommodation: 'NA', carpetArea: 'NA', actualBUA: 'NA', permissibleBUA: 'NA', adoptedBUA: 'NA' },
      ],
      violationObserved: raw.violationObserved || 'NA',

      // Section 7 — Plan Approvals
      constructionAsPerPlan: raw.constructionAsPerPlan || 'NA',
      approvedPlanDetails: raw.approvedPlanDetails || 'Details of approved plan with approval no and date',
      constructionPermissionNumberDate: raw.constructionPermissionNumberDate || 'NA',
      violationsObserved: raw.violationsObserved || 'NA',
      structureConfirmingByelaws: raw.structureConfirmingByelaws || 'NA',

      // Section 8 — Estimate Analysis
      estimatedCostTotal: raw.estimatedCostTotal || 'NA',
      estimatedCostPerSqft: raw.estimatedCostPerSqft || 'NA',
      justifiedEstimatedCostPerSqft: raw.justifiedEstimatedCostPerSqft || 'NA',
      adoptableJustifiedEstimatedCost: raw.adoptableJustifiedEstimatedCost || 'NA',

      // Section 9 — Valuation
      landAreaSqft: raw.landAreaSqft || '',
      adoptableBuiltUpArea: raw.adoptableBuiltUpArea || '',
      currentMarketRateRange: raw.currentMarketRateRange || '',
      constructionCostPerSqft: raw.constructionCostPerSqft || '',
      recommendedRateOfLand: raw.recommendedRateOfLand || '',
      totalConstructionValue100: raw.totalConstructionValue100 || '',
      totalLandValue: raw.totalLandValue || '',
      totalConstructionValuePresent: raw.totalConstructionValuePresent || '',
      marketValueLandBuilding: raw.marketValueLandBuilding || '',
      marketValueLandBuildingRight: raw.marketValueLandBuildingRight || '',
      distressValue100: raw.distressValue100 || '',
      distressValuePresent: raw.distressValuePresent || '',
      flatSBUA: raw.flatSBUA || 'NA',
      compositeSaleRate: raw.compositeSaleRate || 'NA',
      totalMarketValueApartment: raw.totalMarketValueApartment || 'NA',
      govtGuidelineRateLand: raw.govtGuidelineRateLand || '',
      landValueGovtRate: raw.landValueGovtRate || '',
      govtGuidelineRateFlats: raw.govtGuidelineRateFlats || 'NA',
      flatValueGovtRate: raw.flatValueGovtRate || 'NA',
      latitude: raw.latitude || '',
      longitude: raw.longitude || '',

      // Section 10 — Remarks
      remarks: raw.remarks || '',

      // Section 11 — Valuer Certification
      dateOfVisit: formatReportDate(raw.dateOfVisit || raw.dateOfInspection || prefill?.inspectionDate || ''),
      dateOfReportSubmission: formatReportDate(raw.dateOfReportSubmission || raw.dateOfValuation || new Date()),
      visitingEngineer: (raw.visitingEngineer && raw.visitingEngineer !== 'Visiting Engineer')
        ? raw.visitingEngineer
        : (formatAssignedEngineers(prefill?.fieldEmployees || prefill?.assignedFieldEmployees || prefill?.assignedEngineers) || raw.visitingEngineer || ''),
      authorizedSignatory: raw.authorizedSignatory || 'Er. Satyajit Mohanty',

      // Photos & Maps
      propertyImages: Array.isArray(raw.propertyImages) ? raw.propertyImages : [],
      propertyImageNames: Array.isArray(raw.propertyImageNames) ? raw.propertyImageNames : [],
      locationMapImages: normalizeMapImages(raw.locationMapImages),
      cadastralMapImages: normalizeMapImages(raw.cadastralMapImages),
    };
  }, [initialFields, projectCode, prefill]);

  const [fields, setFields] = useState<ArthanFinanceReportFields>(() => decodeHtmlEntitiesDeep(initialData));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const isInitialMount = useRef(true);
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-Save Draft
  useEffect(() => {
    if (isReadOnly) return;
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    setAutoSaveStatus('saving');
    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    debouncedTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        setAutoSaveStatus(res && 'error' in res && res.error ? 'error' : 'saved');
      } catch { setAutoSaveStatus('error'); }
    }, 1200);
    return () => { if (debouncedTimer.current) clearTimeout(debouncedTimer.current); };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!isReadOnly) saveReportDraft(projectId, fields).catch(console.error);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  // Auto-fill visitingEngineer
  useEffect(() => {
    if (!fields.visitingEngineer || fields.visitingEngineer === 'Visiting Engineer') {
      const assigned = formatAssignedEngineers(
        prefill?.fieldEmployees || prefill?.assignedFieldEmployees || prefill?.assignedEngineers
      );
      if (assigned) setFields(prev => ({ ...prev, visitingEngineer: assigned }));
    }
  }, [prefill?.fieldEmployees, prefill?.assignedFieldEmployees, prefill?.assignedEngineers]);

  // Field change handler with auto-calculations
  const handleChange = useCallback((key: keyof ArthanFinanceReportFields, value: any) => {
    setFields(prev => {
      const next = { ...prev, [key]: value };

      // Auto-calculate Total Land Value
      if (key === 'landAreaSqft' || key === 'recommendedRateOfLand') {
        const area = parseNum(key === 'landAreaSqft' ? value : next.landAreaSqft);
        const rate = parseNum(key === 'recommendedRateOfLand' ? value : next.recommendedRateOfLand);
        if (area > 0 && rate > 0) next.totalLandValue = String(area * rate);
      }

      // Auto-calculate Total Construction Value (100% complete)
      if (key === 'adoptableBuiltUpArea' || key === 'constructionCostPerSqft') {
        const bua = parseNum(key === 'adoptableBuiltUpArea' ? value : next.adoptableBuiltUpArea);
        const cost = parseNum(key === 'constructionCostPerSqft' ? value : next.constructionCostPerSqft);
        if (bua > 0 && cost > 0) {
          const cv = bua * cost;
          next.totalConstructionValue100 = String(cv);
          // Construction value for present stage (same if 100%)
          const stagePct = parseNum(next.constructionStage) || 100;
          next.totalConstructionValuePresent = String(Math.round(cv * stagePct / 100));
        }
      }

      // Auto-calculate construction value when stage changes
      if (key === 'constructionStage' && next.totalConstructionValue100) {
        const cv = parseNum(next.totalConstructionValue100);
        const stagePct = parseNum(value) || 100;
        next.totalConstructionValuePresent = String(Math.round(cv * stagePct / 100));
      }

      // Auto-calculate Market Value = Land Value + Construction Value
      const lv = parseNum(next.totalLandValue);
      const cv = parseNum(next.totalConstructionValuePresent || next.totalConstructionValue100);
      if (lv > 0 || cv > 0) {
        const mv = lv + cv;
        next.marketValueLandBuilding = String(mv);
        next.marketValueLandBuildingRight = String(mv);
        // Distress Value = 80% of MV
        next.distressValue100 = String(Math.round(mv * 0.8));
        next.distressValuePresent = String(Math.round(mv * 0.8));
      }

      // Auto-calculate Land Value as per Govt Rate
      if (key === 'govtGuidelineRateLand') {
        const area = parseNum(next.landAreaSqft);
        const gRate = parseNum(value);
        if (area > 0 && gRate > 0) next.landValueGovtRate = String(area * gRate);
      }

      return next;
    });
  }, []);

  // BUA Floor Handlers
  const handleAddBUAFloor = () => {
    const current = fields.buaFloors || [];
    const nextFloor = getFloorName(current.length);
    const updated: ArthanFinanceBUAFloor[] = [
      ...current,
      { floor: nextFloor, accommodation: 'NA', carpetArea: '', actualBUA: '', permissibleBUA: 'NA', adoptedBUA: '' },
    ];
    handleChange('buaFloors', updated);
  };

  const handleBUAFloorChange = (idx: number, field: keyof ArthanFinanceBUAFloor, value: string) => {
    const updated = (fields.buaFloors || []).map((f, i) => i === idx ? { ...f, [field]: value } : f);
    handleChange('buaFloors', updated);
  };

  const handleRemoveBUAFloor = (idx: number) => {
    const updated = (fields.buaFloors || []).filter((_, i) => i !== idx);
    handleChange('buaFloors', updated);
  };

  // Map Upload Handlers (device upload only)
  const handleMapUpload = async (
    key: 'locationMapImages' | 'cadastralMapImages',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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

  const handleMapRemove = (key: 'locationMapImages' | 'cadastralMapImages', index: number) => {
    const updated = (fields[key] || []).filter((_, i) => i !== index);
    handleChange(key, updated);
  };

  // Photo Handlers
  const handleBucketConfirm = (selectedUrls: string[]) => {
    const existing = fields.propertyImages || [];
    handleChange('propertyImages', [...existing, ...selectedUrls]);
  };

  const handlePhotoRemove = (idx: number) => {
    const updated = (fields.propertyImages || []).filter((_, i) => i !== idx);
    const updatedNames = (fields.propertyImageNames || []).filter((_, i) => i !== idx);
    handleChange('propertyImages', updated);
    handleChange('propertyImageNames', updatedNames);
  };

  // Save Draft
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

  // PDF Generation
  const generatePDFBytes = async (): Promise<Uint8Array> => {
    // Fetch property photos
    const propImages = fields.propertyImages || [];
    const photoBytesList = await Promise.all(propImages.map(fetchBytes));
    const photos = propImages.map((url, idx) => ({
      bytes: photoBytesList[idx] as Uint8Array,
      label: fields.propertyImageNames?.[idx] || 'Site Picture',
    })).filter(p => p.bytes && p.bytes.length > 0);

    // Fetch location maps
    const locImages = fields.locationMapImages || [];
    const locBytes = (await Promise.all(locImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // Fetch cadastral maps
    const cadImages = fields.cadastralMapImages || [];
    const cadBytes = (await Promise.all(cadImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    const renderer = new PDFArthanFinanceRenderer();
    await renderer.init();

    return renderer.generateArthanReport(fields, {
      photos,
      locationMaps: locBytes,
      cadastralMaps: cadBytes,
    });
  };

  const handlePreviewPDF = async () => {
    setLoading(true);
    try {
      const bytes = await generatePDFBytes();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (err: any) {
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
      a.download = `Arthan_Valuation_${projectCode || 'Report'}.pdf`;
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

  const handleSubmitForVerification = async () => {
    if ((fields.propertyImages || []).length < 2) {
      alert('Please upload at least 2 photographs of the property before submitting.');
      return;
    }
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      const res = await submitReportForVerification(projectId);
      if (res && 'error' in res && res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Date field helper
  const DateInput = ({ fieldKey, label }: { fieldKey: keyof ArthanFinanceReportFields; label: string }) => (
    <Field label={label}>
      <div className="relative flex items-center">
        <input
          type="text"
          className={inputCls}
          value={(fields[fieldKey] as string) || ''}
          onChange={e => handleChange(fieldKey, e.target.value)}
          disabled={isReadOnly}
          placeholder="DD/MM/YYYY"
        />
        {!isReadOnly && (
          <input
            type="date"
            className="absolute right-2 opacity-0 w-8 h-8 cursor-pointer"
            title="Choose Date"
            onChange={e => { if (e.target.value) handleChange(fieldKey, formatReportDate(e.target.value)); }}
          />
        )}
      </div>
    </Field>
  );

  // Nav sections
  const navSections: NavItem[] = [
    { id: 'sec-1', title: 'Technical Initiation' },
    { id: 'sec-2', title: 'Locational & Property' },
    { id: 'sec-3', title: 'Boundaries' },
    { id: 'sec-4', title: 'Setbacks / Margin' },
    { id: 'sec-5', title: 'Height / Storieys' },
    { id: 'sec-6', title: 'BUA & Accommodation' },
    { id: 'sec-7', title: 'Plan Approvals' },
    { id: 'sec-8', title: 'Estimate Analysis' },
    { id: 'sec-9', title: 'Valuation' },
    { id: 'sec-10', title: 'Remarks' },
    { id: 'sec-11', title: 'Valuer Certification' },
    { id: 'sec-12', title: 'Photographs' },
    { id: 'sec-13', title: 'Maps' },
  ];

  return (
    <div className="flex gap-6 items-start w-full">
      {/* ── Main Form Column ── */}
      <div className="flex-1 min-w-0 space-y-4">
        <ActiveConfigBanner
          bankName="ARTHAN FINANCE"
          formatName="Valuation Report"
          category="Bank & FIS"
          onResetWizard={onResetWizard}
        />

        {message && (
          <div className={`p-4 rounded-xl text-sm font-semibold ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* ════ SECTION 1: TECHNICAL INITIATION REQUEST FORM DATA ════ */}
        <Section title="Technical Initiation Request Form Data" number={1} id="sec-1" defaultOpen={true}>
          {/* Date of Valuation (header field) */}
          <div className="mb-4 flex justify-end items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <span className="text-sm font-semibold text-blue-700">Date of Valuation:</span>
            <div className="relative flex items-center">
              <input
                type="text"
                className={`${inputCls} w-40`}
                value={fields.dateOfValuation || ''}
                onChange={e => handleChange('dateOfValuation', e.target.value)}
                disabled={isReadOnly}
                placeholder="DD/MM/YYYY"
              />
              {!isReadOnly && (
                <input
                  type="date"
                  className="absolute right-2 opacity-0 w-8 h-8 cursor-pointer"
                  onChange={e => { if (e.target.value) handleChange('dateOfValuation', formatReportDate(e.target.value)); }}
                />
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Proposal No.">
              <input className={inputCls} value={fields.proposalNo || ''} onChange={e => handleChange('proposalNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. AFPL/SMA-001" />
            </Field>
            <Field label="Case Type">
              <input className={inputCls} value={fields.caseType || ''} onChange={e => handleChange('caseType', e.target.value)} disabled={isReadOnly} placeholder="e.g. SBL" />
            </Field>
            <DateInput fieldKey="dateOfInspection" label="Date of Inspection / Site visit (DD/MM/YYYY)" />
            <Field label="Nearest Landmark">
              <input className={inputCls} value={fields.nearestLandmark || ''} onChange={e => handleChange('nearestLandmark', e.target.value)} disabled={isReadOnly} placeholder="e.g. Near Ishkon Temple, Antara" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Name of Customer/Applicant & Contact Details">
                <input className={inputCls} value={fields.customerName || ''} onChange={e => handleChange('customerName', e.target.value)} disabled={isReadOnly} placeholder="Applicant name & mobile number" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Name of Current Owner / Seller">
                <input className={inputCls} value={fields.ownerName || ''} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} placeholder="Owner name as per sale deed" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Name of the Person met at site & Contact No.">
                <input className={inputCls} value={fields.personMetOnSite || ''} onChange={e => handleChange('personMetOnSite', e.target.value)} disabled={isReadOnly} placeholder="Person met & contact number" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Address of the property — As per TRF">
                <textarea rows={2} className={inputCls} value={fields.addressAsPerTRF || ''} onChange={e => handleChange('addressAsPerTRF', e.target.value)} disabled={isReadOnly} placeholder="Address as per Technical Review Form" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Address of the property — As per Document">
                <textarea rows={2} className={inputCls} value={fields.addressAsPerDocument || ''} onChange={e => handleChange('addressAsPerDocument', e.target.value)} disabled={isReadOnly} placeholder="Address as per sale deed / ROR" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Address of the property — As per Actual at Site">
                <textarea rows={2} className={inputCls} value={fields.addressAsPerActualSite || ''} onChange={e => handleChange('addressAsPerActualSite', e.target.value)} disabled={isReadOnly} placeholder="Address as observed on site" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Documents Provided">
                <input className={inputCls} value={fields.documentsProvided || ''} onChange={e => handleChange('documentsProvided', e.target.value)} disabled={isReadOnly} placeholder="e.g. Copy of ROR & Sketch map" />
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 2: LOCATIONAL & PROPERTY SPECIFIC DETAILS ════ */}
        <Section title="Locational & Property Specific Details (based on site visit)" number={2} id="sec-2">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Status of Land Holding">
              <input className={inputCls} value={fields.statusOfLandHolding || ''} onChange={e => handleChange('statusOfLandHolding', e.target.value)} disabled={isReadOnly} placeholder="e.g. Freehold(Homestead)" />
            </Field>
            <Field label="Developed By">
              <input className={inputCls} value={fields.developedBy || ''} onChange={e => handleChange('developedBy', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA" />
            </Field>
            <Field label="Type of Property">
              <input className={inputCls} value={fields.typeOfProperty || ''} onChange={e => handleChange('typeOfProperty', e.target.value)} disabled={isReadOnly} placeholder="e.g. SORP" />
            </Field>
            <Field label="Type of Locality">
              <select className={selectCls} value={fields.typeOfLocality || ''} onChange={e => handleChange('typeOfLocality', e.target.value)} disabled={isReadOnly}>
                <option value="">Select...</option>
                <option value="Developing">Developing</option>
                <option value="Developed">Developed</option>
                <option value="Semi-Developed">Semi-Developed</option>
                <option value="Rural">Rural</option>
              </select>
            </Field>
            <DateInput fieldKey="dateOfInspectionSite" label="Date of Inspection / Site visit" />
            <Field label="Occupation Status">
              <select className={selectCls} value={fields.occupationStatus || ''} onChange={e => handleChange('occupationStatus', e.target.value)} disabled={isReadOnly}>
                <option value="">Select...</option>
                <option value="Self Occupied">Self Occupied</option>
                <option value="Tenant Occupied">Tenant Occupied</option>
                <option value="Vacant">Vacant</option>
                <option value="Under Construction">Under Construction</option>
              </select>
            </Field>
            <Field label="Location/Zoning as per Master Plan">
              <input className={inputCls} value={fields.locationZoningMasterPlan || ''} onChange={e => handleChange('locationZoningMasterPlan', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA / Residential Zone" />
            </Field>
            <Field label="Property Usage">
              <select className={selectCls} value={fields.propertyUsage || ''} onChange={e => handleChange('propertyUsage', e.target.value)} disabled={isReadOnly}>
                <option value="">Select...</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Mixed">Mixed</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Industrial">Industrial</option>
              </select>
            </Field>
            <Field label="Plot Demarcation">
              <select className={selectCls} value={fields.plotDemarcation || ''} onChange={e => handleChange('plotDemarcation', e.target.value)} disabled={isReadOnly}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Property Identifiable">
              <select className={selectCls} value={fields.propertyIdentifiable || ''} onChange={e => handleChange('propertyIdentifiable', e.target.value)} disabled={isReadOnly}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Identified Through">
              <select className={selectCls} value={fields.identifiedThrough || ''} onChange={e => handleChange('identifiedThrough', e.target.value)} disabled={isReadOnly}>
                <option value="Customer">Customer</option>
                <option value="Document">Document</option>
                <option value="Map">Map</option>
                <option value="GPS Coordinates">GPS Coordinates</option>
              </select>
            </Field>
            <Field label="Within MC / GP Limit & Distance From Nearest M.C">
              <input className={inputCls} value={fields.withinMCLimit || ''} onChange={e => handleChange('withinMCLimit', e.target.value)} disabled={isReadOnly} placeholder="e.g. Within Antara GP Limit" />
            </Field>
            <Field label="Internal Finishing">
              <select className={selectCls} value={fields.internalFinishing || ''} onChange={e => handleChange('internalFinishing', e.target.value)} disabled={isReadOnly}>
                <option value="Average">Average</option>
                <option value="Good">Good</option>
                <option value="Poor">Poor</option>
                <option value="Excellent">Excellent</option>
              </select>
            </Field>
            <Field label="Type of Structure">
              <select className={selectCls} value={fields.typeOfStructure || ''} onChange={e => handleChange('typeOfStructure', e.target.value)} disabled={isReadOnly}>
                <option value="RCC">RCC</option>
                <option value="Load Bearing">Load Bearing</option>
                <option value="Pre-Engineered">Pre-Engineered</option>
                <option value="Steel">Steel</option>
                <option value="Timber">Timber</option>
              </select>
            </Field>
            <Field label="No. of Floors in the building">
              <input className={inputCls} value={fields.noOfFloors || ''} onChange={e => handleChange('noOfFloors', e.target.value)} disabled={isReadOnly} placeholder="e.g. GF, G+1" />
            </Field>
            <Field label="Located on Floor No.">
              <input className={inputCls} value={fields.locatedOnFloorNo || ''} onChange={e => handleChange('locatedOnFloorNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. GF" />
            </Field>
            <Field label="Total No. of Flats / Unit in building">
              <input className={inputCls} value={fields.totalFlatsUnits || ''} onChange={e => handleChange('totalFlatsUnits', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1" />
            </Field>
            <Field label="External Finishing">
              <select className={selectCls} value={fields.externalFinishing || ''} onChange={e => handleChange('externalFinishing', e.target.value)} disabled={isReadOnly}>
                <option value="Average">Average</option>
                <option value="Good">Good</option>
                <option value="Poor">Poor</option>
                <option value="Excellent">Excellent</option>
              </select>
            </Field>
            <Field label="External Finishing Detail">
              <input className={inputCls} value={fields.externalFinishingDetail || ''} onChange={e => handleChange('externalFinishingDetail', e.target.value)} disabled={isReadOnly} placeholder="e.g. Average" />
            </Field>
            <Field label="Year of Completion of Property">
              <input className={inputCls} value={fields.yearOfCompletion || ''} onChange={e => handleChange('yearOfCompletion', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2018" />
            </Field>
            <Field label="Construction Stage of the Property (in 100%)">
              <input className={inputCls} value={fields.constructionStage || ''} onChange={e => handleChange('constructionStage', e.target.value)} disabled={isReadOnly} placeholder="e.g. 100%" />
            </Field>
            <Field label="Disbursement Recommended (in %)">
              <input className={inputCls} value={fields.disbursementRecommended || ''} onChange={e => handleChange('disbursementRecommended', e.target.value)} disabled={isReadOnly} placeholder="e.g. 100%" />
            </Field>
            <Field label="Age of the Property">
              <input className={inputCls} value={fields.ageOfProperty || ''} onChange={e => handleChange('ageOfProperty', e.target.value)} disabled={isReadOnly} placeholder="e.g. 7-Years" />
            </Field>
            <Field label="Future Physical Life of Property">
              <input className={inputCls} value={fields.futurePhysicalLife || ''} onChange={e => handleChange('futurePhysicalLife', e.target.value)} disabled={isReadOnly} placeholder="e.g. 53-Years" />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 3: BOUNDARIES ════ */}
        <Section title="Boundaries" number={3} id="sec-3">
          <div className="space-y-4">
            {/* Column headers */}
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="font-semibold text-sm text-slate-600">Source</div>
              <div className="font-semibold text-sm text-blue-700">North</div>
              <div className="font-semibold text-sm text-blue-700">South</div>
              <div className="font-semibold text-sm text-blue-700">East</div>
              <div className="font-semibold text-sm text-blue-700">West</div>
            </div>
            {/* As per Documents */}
            <div className="grid grid-cols-5 gap-2 items-center">
              <div className="text-sm font-medium text-slate-600 bg-slate-50 rounded px-2 py-1">As per Documents (Sale Deed)</div>
              {(['boundaryNorthDocs', 'boundarySouthDocs', 'boundaryEastDocs', 'boundaryWestDocs'] as const).map(k => (
                <input key={k} className={inputCls} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="Not provided" />
              ))}
            </div>
            {/* As per Sketch Map */}
            <div className="grid grid-cols-5 gap-2 items-center">
              <div className="text-sm font-medium text-slate-600 bg-slate-50 rounded px-2 py-1">As per Sketch Map</div>
              {(['boundaryNorthSketch', 'boundarySouthSketch', 'boundaryEastSketch', 'boundaryWestSketch'] as const).map(k => (
                <input key={k} className={inputCls} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="" />
              ))}
            </div>
            {/* As per Site / Actual */}
            <div className="grid grid-cols-5 gap-2 items-center">
              <div className="text-sm font-medium text-slate-600 bg-slate-50 rounded px-2 py-1">As per Site / Actual</div>
              {(['boundaryNorthSite', 'boundarySouthSite', 'boundaryEastSite', 'boundaryWestSite'] as const).map(k => (
                <input key={k} className={inputCls} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="" />
              ))}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Boundaries Matching">
                <select className={selectCls} value={fields.boundariesMatching || 'Yes'} onChange={e => handleChange('boundariesMatching', e.target.value)} disabled={isReadOnly}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              {fields.boundariesMatching === 'No' && (
                <Field label="If No, reason thereon">
                  <input className={inputCls} value={fields.boundariesNotMatchingReason || ''} onChange={e => handleChange('boundariesNotMatchingReason', e.target.value)} disabled={isReadOnly} placeholder="Reason for mismatch" />
                </Field>
              )}
            </div>
          </div>
        </Section>

        {/* ════ SECTION 4: SETBACKS / MARGIN ════ */}
        <Section title="Setbacks / Margin" number={4} id="sec-4">
          <div className="space-y-4">
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="font-semibold text-sm text-slate-600">Source</div>
              <div className="font-semibold text-sm text-blue-700">Front</div>
              <div className="font-semibold text-sm text-blue-700">Rear</div>
              <div className="font-semibold text-sm text-blue-700">Left Side</div>
              <div className="font-semibold text-sm text-blue-700">Right Side</div>
            </div>
            <div className="grid grid-cols-5 gap-2 items-center">
              <div className="text-sm font-medium text-slate-600 bg-slate-50 rounded px-2 py-1">As per sanctioned byelaws</div>
              {(['setbackFrontSanctioned', 'setbackRearSanctioned', 'setbackLeftSanctioned', 'setbackRightSanctioned'] as const).map(k => (
                <input key={k} className={inputCls} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="NA" />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-2 items-center">
              <div className="text-sm font-medium text-slate-600 bg-slate-50 rounded px-2 py-1">As per Site / Actual</div>
              {(['setbackFrontSite', 'setbackRearSite', 'setbackLeftSite', 'setbackRightSite'] as const).map(k => (
                <input key={k} className={inputCls} value={fields[k] || ''} onChange={e => handleChange(k, e.target.value)} disabled={isReadOnly} placeholder="" />
              ))}
            </div>
          </div>
        </Section>

        {/* ════ SECTION 5: HEIGHT / STORIEYS ════ */}
        <Section title="Height / Storieys" number={5} id="sec-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="As per sanctioned / permissible byelaws">
              <input className={inputCls} value={fields.heightSanctioned || ''} onChange={e => handleChange('heightSanctioned', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA" />
            </Field>
            <Field label="As per Site / Actual">
              <input className={inputCls} value={fields.heightSite || ''} onChange={e => handleChange('heightSite', e.target.value)} disabled={isReadOnly} placeholder="e.g. GF" />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 6: BUA & ACCOMMODATION DETAILS ════ */}
        <Section title="Built-up Area & Accommodation Details" number={6} id="sec-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-50">
                  <th className="border border-slate-300 px-2 py-2 text-left">Floor</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Accommodation</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Carpet Area (Sft)</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Actual BUA / SBUA (Sft)</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Permissible BUA (Sft)</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Adopted BUA (Sft)</th>
                  {!isReadOnly && <th className="border border-slate-300 px-2 py-2"></th>}
                </tr>
              </thead>
              <tbody>
                {(fields.buaFloors || []).map((fl, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 px-2 py-1">
                      <input className={inputCls} value={fl.floor || ''} onChange={e => handleBUAFloorChange(idx, 'floor', e.target.value)} disabled={isReadOnly} />
                    </td>
                    <td className="border border-slate-300 px-2 py-1">
                      <input className={inputCls} value={fl.accommodation || ''} onChange={e => handleBUAFloorChange(idx, 'accommodation', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                    </td>
                    <td className="border border-slate-300 px-2 py-1">
                      <input className={inputCls} value={fl.carpetArea || ''} onChange={e => handleBUAFloorChange(idx, 'carpetArea', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                    </td>
                    <td className="border border-slate-300 px-2 py-1">
                      <input className={inputCls} value={fl.actualBUA || ''} onChange={e => handleBUAFloorChange(idx, 'actualBUA', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                    </td>
                    <td className="border border-slate-300 px-2 py-1">
                      <input className={inputCls} value={fl.permissibleBUA || ''} onChange={e => handleBUAFloorChange(idx, 'permissibleBUA', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                    </td>
                    <td className="border border-slate-300 px-2 py-1">
                      <input className={inputCls} value={fl.adoptedBUA || ''} onChange={e => handleBUAFloorChange(idx, 'adoptedBUA', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                    </td>
                    {!isReadOnly && (
                      <td className="border border-slate-300 px-2 py-1 text-center">
                        <button onClick={() => handleRemoveBUAFloor(idx)} className="text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isReadOnly && (
            <button
              onClick={handleAddBUAFloor}
              className="mt-3 px-4 py-2 text-sm font-semibold text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
            >
              + Add Floor
            </button>
          )}
          <div className="mt-4">
            <Field label="Violation observed if any">
              <input className={inputCls} value={fields.violationObserved || ''} onChange={e => handleChange('violationObserved', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 7: PLAN APPROVALS ════ */}
        <Section title="Plan Approvals BP not Provided" number={7} id="sec-7">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Construction as per approved / sanctioned plans">
              <select className={selectCls} value={fields.constructionAsPerPlan || 'NA'} onChange={e => handleChange('constructionAsPerPlan', e.target.value)} disabled={isReadOnly}>
                <option value="NA">NA</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Details of approved plan with approval no. and date">
              <input className={inputCls} value={fields.approvedPlanDetails || ''} onChange={e => handleChange('approvedPlanDetails', e.target.value)} disabled={isReadOnly} placeholder="Approval no. and date" />
            </Field>
            <Field label="Construction permission Number and date">
              <input className={inputCls} value={fields.constructionPermissionNumberDate || ''} onChange={e => handleChange('constructionPermissionNumberDate', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA" />
            </Field>
            <Field label="Violations Observed if Any">
              <input className={inputCls} value={fields.violationsObserved || ''} onChange={e => handleChange('violationsObserved', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA" />
            </Field>
            <div className="md:col-span-2">
              <Field label="If plans not available, is the structure confirming to local byelaws?">
                <select className={selectCls} value={fields.structureConfirmingByelaws || 'NA'} onChange={e => handleChange('structureConfirmingByelaws', e.target.value)} disabled={isReadOnly}>
                  <option value="NA">NA</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 8: ESTIMATE ANALYSIS ════ */}
        <Section title="Estimate Analysis (Applicable only in Self Construction cases)" number={8} id="sec-8">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Estimated Cost (In Rs)">
              <input className={inputCls} value={fields.estimatedCostTotal || ''} onChange={e => handleChange('estimatedCostTotal', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="Estimated Cost (in Rs per Sqft)">
              <input className={inputCls} value={fields.estimatedCostPerSqft || ''} onChange={e => handleChange('estimatedCostPerSqft', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="Justified Estimated Cost (in Rs per Sqft)">
              <input className={inputCls} value={fields.justifiedEstimatedCostPerSqft || ''} onChange={e => handleChange('justifiedEstimatedCostPerSqft', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="Adoptable / Justified Estimated Cost (In Rs)">
              <input className={inputCls} value={fields.adoptableJustifiedEstimatedCost || ''} onChange={e => handleChange('adoptableJustifiedEstimatedCost', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 9: VALUATION OF PROPERTY ════ */}
        <Section title="Valuation of Property (Fair Market Valuation / Distress Valuation)" number={9} id="sec-9">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Land Area (In Sqft)">
              <input className={inputCls} value={fields.landAreaSqft || ''} onChange={e => handleChange('landAreaSqft', e.target.value)} disabled={isReadOnly} placeholder="e.g. 8276" />
            </Field>
            <Field label="Adoptable Built-up Area (in Sqft) GF RCC">
              <input className={inputCls} value={fields.adoptableBuiltUpArea || ''} onChange={e => handleChange('adoptableBuiltUpArea', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1128" />
            </Field>
            <Field label="Current Market Rate of land (Range) in Rs per Sqft">
              <input className={inputCls} value={fields.currentMarketRateRange || ''} onChange={e => handleChange('currentMarketRateRange', e.target.value)} disabled={isReadOnly} placeholder="e.g. 100-200" />
            </Field>
            <Field label="Construction Cost (Rs per sft)">
              <input className={inputCls} value={fields.constructionCostPerSqft || ''} onChange={e => handleChange('constructionCostPerSqft', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1300" />
            </Field>
            <Field label="Recommended Rate of Land (Rs per sqft)">
              <input className={inputCls} value={fields.recommendedRateOfLand || ''} onChange={e => handleChange('recommendedRateOfLand', e.target.value)} disabled={isReadOnly} placeholder="e.g. 150" />
            </Field>
            <Field label="Total Construction Value for 100% complete building (in Rs)">
              <input className={inputCls} value={fields.totalConstructionValue100 || ''} onChange={e => handleChange('totalConstructionValue100', e.target.value)} disabled={isReadOnly} placeholder="Auto-calculated" />
            </Field>
            <Field label="Total Land Value (in Rs)">
              <input className={`${inputCls} bg-yellow-50`} value={fields.totalLandValue || ''} onChange={e => handleChange('totalLandValue', e.target.value)} disabled={isReadOnly} placeholder="Auto-calculated" readOnly />
            </Field>
            <Field label="Total Construction Value for present construction stage (in Rs)">
              <input className={`${inputCls} bg-yellow-50`} value={fields.totalConstructionValuePresent || ''} onChange={e => handleChange('totalConstructionValuePresent', e.target.value)} disabled={isReadOnly} placeholder="Auto-calculated" readOnly />
            </Field>
            <Field label="Market Value of Land & Building Only (in Rs)">
              <input className={`${inputCls} bg-green-50 font-semibold`} value={fields.marketValueLandBuilding || ''} onChange={e => handleChange('marketValueLandBuilding', e.target.value)} disabled={isReadOnly} placeholder="Auto-calculated" readOnly />
            </Field>
            <Field label="Market Value of Land & Building Only (in Rs) [right]">
              <input className={`${inputCls} bg-green-50 font-semibold`} value={fields.marketValueLandBuildingRight || ''} onChange={e => handleChange('marketValueLandBuildingRight', e.target.value)} disabled={isReadOnly} placeholder="Auto-calculated" readOnly />
            </Field>
            <Field label="Distress Value of 100% complete property @ 80% of MV">
              <input className={`${inputCls} bg-orange-50`} value={fields.distressValue100 || ''} onChange={e => handleChange('distressValue100', e.target.value)} disabled={isReadOnly} placeholder="Auto-calculated" readOnly />
            </Field>
            <Field label="Distress Value of present completed property @ 80% of MV">
              <input className={`${inputCls} bg-orange-50`} value={fields.distressValuePresent || ''} onChange={e => handleChange('distressValuePresent', e.target.value)} disabled={isReadOnly} placeholder="Auto-calculated" readOnly />
            </Field>
            <Field label="Flat / Apartment / Shop / Office SBUA (in Sqft)">
              <input className={inputCls} value={fields.flatSBUA || ''} onChange={e => handleChange('flatSBUA', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="Composite sale rate (Rs per sqft)">
              <input className={inputCls} value={fields.compositeSaleRate || ''} onChange={e => handleChange('compositeSaleRate', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Total Market Value of Apartment / Shop / Flat / Office (Rs per sqft)">
                <input className={inputCls} value={fields.totalMarketValueApartment || ''} onChange={e => handleChange('totalMarketValueApartment', e.target.value)} disabled={isReadOnly} placeholder="NA" />
              </Field>
            </div>
            <Field label="Government Guideline / Circle rate for Land (Rs per sqft)">
              <input className={inputCls} value={fields.govtGuidelineRateLand || ''} onChange={e => handleChange('govtGuidelineRateLand', e.target.value)} disabled={isReadOnly} placeholder="e.g. 28.00" />
            </Field>
            <Field label="Land Value as per Government Rate (Rs)">
              <input className={`${inputCls} bg-yellow-50`} value={fields.landValueGovtRate || ''} onChange={e => handleChange('landValueGovtRate', e.target.value)} disabled={isReadOnly} placeholder="Auto-calculated" readOnly />
            </Field>
            <Field label="Government Guideline / Circle rate for Flats (Rs per sqft)">
              <input className={inputCls} value={fields.govtGuidelineRateFlats || ''} onChange={e => handleChange('govtGuidelineRateFlats', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="Flat / Apartment Value as per Government Rate (Rs)">
              <input className={inputCls} value={fields.flatValueGovtRate || ''} onChange={e => handleChange('flatValueGovtRate', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="Latitude (N)">
              <input className={inputCls} value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 21.1705" />
            </Field>
            <Field label="Longitude (E)">
              <input className={inputCls} value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 86.492417" />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 10: REMARKS ════ */}
        <Section title="Property Specific Remarks & Observation" number={10} id="sec-10">
          <Field label="Remarks / Observation">
            <textarea
              rows={5}
              className={inputCls}
              value={fields.remarks || ''}
              onChange={e => handleChange('remarks', e.target.value)}
              disabled={isReadOnly}
              placeholder="Describe the property observations, access, amenities, and basis of valuation..."
            />
          </Field>
        </Section>

        {/* ════ SECTION 11: VALUER CERTIFICATION ════ */}
        <Section title="Valuer Certification" number={11} id="sec-11">
          <div className="grid md:grid-cols-2 gap-4">
            <DateInput fieldKey="dateOfVisit" label="Date of Visit (DD/MM/YYYY)" />
            <DateInput fieldKey="dateOfReportSubmission" label="Date of Report Submission (DD/MM/YYYY)" />
            <Field label="Name of Engineer Visited the property">
              <input className={inputCls} value={fields.visitingEngineer || ''} onChange={e => handleChange('visitingEngineer', e.target.value)} disabled={isReadOnly} placeholder="Auto-filled from field inspector" />
            </Field>
            <Field label="Authorized Signatory Name & Signature">
              <input className={inputCls} value={fields.authorizedSignatory || ''} onChange={e => handleChange('authorizedSignatory', e.target.value)} disabled={isReadOnly} placeholder="Er. Satyajit Mohanty" />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 12: PROPERTY PHOTOGRAPHS ════ */}
        <Section title="Property Photographs" number={12} id="sec-12">
          <BasePhotographsSection
            propertyImages={fields.propertyImages || []}
            propertyImageNames={fields.propertyImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onRemove={handlePhotoRemove}
            onOpenBucketPicker={() => setBucketPickerOpen(true)}
          />
          {bucketPickerOpen && (
            <BasePhotoBucketModal
              isOpen={bucketPickerOpen}
              bucketImages={bucketImages}
              onConfirm={handleBucketConfirm}
              onClose={() => setBucketPickerOpen(false)}
            />
          )}
        </Section>

        {/* ════ SECTION 13: MAPS ════ */}
        <Section title="Location cum Route Map showing property Boundaries" number={13} id="sec-13">
          <div className="space-y-6">
            {/* Location Map */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-700">Location Map (Google Satellite)</h4>
                {!isReadOnly && (
                  <label className="cursor-pointer px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                    + Upload Location Map
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleMapUpload('locationMapImages', e)} />
                  </label>
                )}
              </div>
              {(fields.locationMapImages || []).length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {(fields.locationMapImages || []).map((url, i) => (
                    <div key={i} className="relative w-48 h-32 rounded border overflow-hidden">
                      <img src={url} alt={`Location Map ${i + 1}`} className="w-full h-full object-cover" />
                      {!isReadOnly && (
                        <button onClick={() => handleMapRemove('locationMapImages', i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No location map uploaded</p>
              )}
            </div>

            {/* Cadastral / Sketch Map */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-slate-700">Cadastral / Sketch Map</h4>
                {!isReadOnly && (
                  <label className="cursor-pointer px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                    + Upload Cadastral / Sketch Map
                    <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleMapUpload('cadastralMapImages', e)} />
                  </label>
                )}
              </div>
              {(fields.cadastralMapImages || []).length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {(fields.cadastralMapImages || []).map((url, i) => (
                    <div key={i} className="relative w-48 h-32 rounded border overflow-hidden">
                      <img src={url} alt={`Cadastral Map ${i + 1}`} className="w-full h-full object-cover" />
                      {!isReadOnly && (
                        <button onClick={() => handleMapRemove('cadastralMapImages', i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No cadastral / sketch map uploaded</p>
              )}
            </div>
          </div>
        </Section>

        {/* ── Action Bar ── */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          message={message}
          loading={loading}
          autoSaveStatus={autoSaveStatus}
          onSaveDraft={handleSaveDraft}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
          onSubmit={handleSubmitForVerification}
        />
      </div>

      {/* ── Floating Navigator ── */}
      <FloatingNavigator sections={navSections} />
    </div>
  );
}
