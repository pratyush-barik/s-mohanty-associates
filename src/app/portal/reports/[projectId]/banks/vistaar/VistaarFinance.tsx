'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  ReportActionBar,
  FloatingNavigator,
  NavItem,
  formatReportDate,
  getEarliestFieldVisit,
  EarliestFieldVisitBadge,
  BasePhotoBucketModal,
  ActiveConfigBanner,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFVistaarFinanceRenderer } from '@/lib/banks/pdf-vistaar-finance-renderer';

export const VISTAAR_FINANCE_CONFIG: BankConfig = {
  bankId: 'VISTAAR FINANCE',
  subTemplateId: '',
  displayName: 'Vistaar Financial Services Pvt Ltd',
  defaultValues: {
    purpose: 'LAP / MSME Loan Against Property',
  },
};

export interface VistaarFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function VistaarFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: VistaarFinanceProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<string | boolean>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);

  const navSections: NavItem[] = [
    { id: 'vistaar-sec-meta', title: 'Header & Initiation' },
    { id: 'vistaar-sec-locational', title: 'Locational & Property Details' },
    { id: 'vistaar-sec-boundaries', title: 'Boundaries & Setbacks' },
    { id: 'vistaar-sec-bua', title: 'BUA & Accommodations' },
    { id: 'vistaar-sec-plan', title: 'Plan & Cost Analysis' },
    { id: 'vistaar-sec-valuation', title: 'Property Valuation' },
    { id: 'vistaar-sec-remarks', title: 'Remarks & Certification' },
    { id: 'vistaar-sec-attachments', title: 'Photos, Maps & Documents' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initialize fields
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // Header & Meta — only structural/agency defaults; property data comes from prefill or user input
    if (!d.valuationAgency) d.valuationAgency = 'M/S S MOHANTY ASSOCIATES';
    if (!d.valuationDate) d.valuationDate = earliestVisit ? formatReportDate(earliestVisit.date) : '';
    if (!d.proposalNo) d.proposalNo = projectCode || '';
    if (!d.caseType) d.caseType = 'LAP';
    if (!d.inspectionDate) d.inspectionDate = earliestVisit ? formatReportDate(earliestVisit.date) : '';
    if (!d.nearestLandmark) d.nearestLandmark = p.nearestLandmark || '';

    const custName = p.applicantName || p.contactName || '';
    const custPhone = p.contactPhone || '';
    if (!d.applicantDetails) d.applicantDetails = custName ? `${custName}${custPhone ? ', Mob-' + custPhone : ''}` : '';
    if (!d.ownerSeller) d.ownerSeller = p.contactName || '';
    if (!d.personMetAtSite) d.personMetAtSite = custName ? `${custName}${custPhone ? ', Mob-' + custPhone : ''}` : '';

    const defaultAddress = p.propertyAddress || '';
    if (!d.addressAsPerTRF) d.addressAsPerTRF = defaultAddress;
    if (!d.addressAsPerDoc) d.addressAsPerDoc = defaultAddress;
    if (!d.addressAtSite) d.addressAtSite = defaultAddress;
    if (!d.documentsProvided) d.documentsProvided = '';

    // Locational & Property Specific Details
    if (!d.landHoldingStatus) d.landHoldingStatus = 'Freehold';
    if (!d.developedBy) d.developedBy = 'Self';
    if (!d.typeOfProperty) d.typeOfProperty = p.propertyType || '';
    if (!d.typeOfLocality) d.typeOfLocality = '';
    if (!d.occupationStatus) d.occupationStatus = 'Self Occupied';
    if (!d.zoningMasterPlan) d.zoningMasterPlan = 'NA';
    if (!d.propertyUsage) d.propertyUsage = 'Residential';
    if (!d.plotDemarcation) d.plotDemarcation = 'Yes';
    if (!d.propertyIdentifiable) d.propertyIdentifiable = 'Yes';
    if (!d.identifiedThrough) d.identifiedThrough = 'Customer';
    if (!d.withinMCLimit) d.withinMCLimit = '';
    if (!d.internalFinishing) d.internalFinishing = '';
    if (!d.typeOfStructure) d.typeOfStructure = '';
    if (!d.noOfFloors) d.noOfFloors = '1';
    if (!d.locatedOnFloor) d.locatedOnFloor = 'NA';
    if (!d.totalFlats) d.totalFlats = 'NA';
    if (!d.externalFinishing) d.externalFinishing = '';
    if (!d.constructionStage) d.constructionStage = '100%';
    if (!d.yearOfCompletion) d.yearOfCompletion = '';
    if (!d.ageOfProperty) d.ageOfProperty = '';
    if (!d.futurePhysicalLife) d.futurePhysicalLife = '';

    // Boundaries — blank by default, user fills in from site visit
    if (!d.bndDocNorth) d.bndDocNorth = '';
    if (!d.bndDocSouth) d.bndDocSouth = '';
    if (!d.bndDocEast) d.bndDocEast = '';
    if (!d.bndDocWest) d.bndDocWest = '';

    if (!d.bndBhunakshaNorth) d.bndBhunakshaNorth = '';
    if (!d.bndBhunakshaSouth) d.bndBhunakshaSouth = '';
    if (!d.bndBhunakshaEast) d.bndBhunakshaEast = '';
    if (!d.bndBhunakshaWest) d.bndBhunakshaWest = '';

    if (!d.bndSiteNorth) d.bndSiteNorth = '';
    if (!d.bndSiteSouth) d.bndSiteSouth = '';
    if (!d.bndSiteEast) d.bndSiteEast = '';
    if (!d.bndSiteWest) d.bndSiteWest = '';

    if (!d.boundariesMatching) d.boundariesMatching = 'Yes';
    if (!d.boundariesMismatchReason) d.boundariesMismatchReason = '';

    // Setbacks & Storeys
    if (!d.sbPermFront) d.sbPermFront = 'NA';
    if (!d.sbPermRear) d.sbPermRear = 'NA';
    if (!d.sbPermLeft) d.sbPermLeft = 'NA';
    if (!d.sbPermRight) d.sbPermRight = 'NA';

    if (!d.sbActualFront) d.sbActualFront = 'NA';
    if (!d.sbActualRear) d.sbActualRear = 'NA';
    if (!d.sbActualLeft) d.sbActualLeft = 'NA';
    if (!d.sbActualRight) d.sbActualRight = 'NA';

    if (!d.heightPermissible) d.heightPermissible = 'NA';
    if (!d.heightActual) d.heightActual = '';

    // Built-up Area
    if (!d.buaBasementAccom) d.buaBasementAccom = 'NA';
    if (!d.buaBasementCarpet) d.buaBasementCarpet = 'NA';
    if (!d.buaBasementActual) d.buaBasementActual = 'NA';
    if (!d.buaBasementPerm) d.buaBasementPerm = 'NA';
    if (!d.buaBasementAdopted) d.buaBasementAdopted = 'NA';

    if (!d.buaGFAccom) d.buaGFAccom = '';
    if (!d.buaGFCarpet) d.buaGFCarpet = '';
    if (!d.buaGFActual) d.buaGFActual = '';
    if (!d.buaGFPerm) d.buaGFPerm = '';
    if (!d.buaGFAdopted) d.buaGFAdopted = '';

    if (!d.buaTotalAccom) d.buaTotalAccom = 'NA';
    if (!d.buaTotalCarpet) d.buaTotalCarpet = '';
    if (!d.buaTotalActual) d.buaTotalActual = '';
    if (!d.buaTotalPerm) d.buaTotalPerm = '';
    if (!d.buaTotalAdopted) d.buaTotalAdopted = '';

    if (!d.violationObserved) d.violationObserved = 'NA';

    // Plan & Cost
    if (!d.constructionAsPerPlan) d.constructionAsPerPlan = 'NA';
    if (!d.planApprovalDetails) d.planApprovalDetails = '';
    if (!d.constructionPermissionNo) d.constructionPermissionNo = 'NA';
    if (!d.approvalViolations) d.approvalViolations = 'NA';
    if (!d.confirmingByelaws) d.confirmingByelaws = 'NA';

    if (!d.estimatedCostTotal) d.estimatedCostTotal = 'NA';
    if (!d.estimatedCostRate) d.estimatedCostRate = 'NA';
    if (!d.justifiedCostRate) d.justifiedCostRate = 'NA';
    if (!d.adoptableJustifiedCost) d.adoptableJustifiedCost = 'NA';

    // Valuation — blank so user enters actual figures
    if (!d.landAreaSqft) d.landAreaSqft = '';
    if (!d.adoptableBUASqft) d.adoptableBUASqft = '';
    if (!d.marketRateLandRange) d.marketRateLandRange = '';
    if (!d.constructionRatePerSqft) d.constructionRatePerSqft = '';
    if (!d.recRateLandPerSqft) d.recRateLandPerSqft = '';

    if (!d.totalConstValue100) d.totalConstValue100 = '';
    if (!d.totalLandValue) d.totalLandValue = '';
    if (!d.totalConstValueStage) d.totalConstValueStage = '';
    if (!d.marketValue100) d.marketValue100 = '';
    if (!d.marketValueStage) d.marketValueStage = '';
    if (!d.distressValue100) d.distressValue100 = '';
    if (!d.distressValueStage) d.distressValueStage = '';

    if (!d.commercialSBUA) d.commercialSBUA = 'NA';
    if (!d.compositeRate) d.compositeRate = 'NA';
    if (!d.totalCommercialMV) d.totalCommercialMV = 'NA';

    if (!d.govtRateLand) d.govtRateLand = '';
    if (!d.landValueGovt) d.landValueGovt = 'NA';
    if (!d.govtRateFlats) d.govtRateFlats = 'NA';
    if (!d.flatValueGovt) d.flatValueGovt = 'NA';

    if (!d.latitude) d.latitude = p.latitude || '';
    if (!d.longitude) d.longitude = p.longitude || '';

    // Remarks & Certification
    if (!d.remarks) d.remarks = '';
    if (!d.reportSubmissionDate) d.reportSubmissionDate = earliestVisit ? formatReportDate(earliestVisit.date) : '';
    if (!d.visitingEngineer) d.visitingEngineer = 'M/S S MOHANTY ASSOCIATES';
    if (!d.authorizedSignatory) d.authorizedSignatory = 'M/S S MOHANTY ASSOCIATES\nEr. S. Mohanty (Approved Valuer)';

    // Attachments
    if (!d.propertyImages) d.propertyImages = [];
    if (!d.propertyImageNames) d.propertyImageNames = [];
    if (!d.documentImages) d.documentImages = [];
    if (!d.documentImageNames) d.documentImageNames = [];
    if (!d.locationMapImages) d.locationMapImages = [];
    if (!d.mouzaMapImages) d.mouzaMapImages = [];
    if (!d.sketchMapImages) d.sketchMapImages = [];
    if (!d.cadastralMapImages) d.cadastralMapImages = [];
    if (!d.bdaMapImages) d.bdaMapImages = [];

    return d;
  });

  const updateField = useCallback((key: string, value: any) => {
    setFields((prev) => {
      const next = { ...prev, [key]: value };

      // Auto calculate valuation components
      const landArea = parseFloat(String(next.landAreaSqft || 0)) || 0;
      const recRateLand = parseFloat(String(next.recRateLandPerSqft || 0)) || 0;
      const bua = parseFloat(String(next.adoptableBUASqft || 0)) || 0;
      const constRate = parseFloat(String(next.constructionRatePerSqft || 0)) || 0;

      const calcLandVal = Math.round(landArea * recRateLand);
      const calcConstVal = Math.round(bua * constRate);
      const calcMV = calcLandVal + calcConstVal;
      const calcDistress = Math.round(calcMV * 0.75);

      if (['landAreaSqft', 'recRateLandPerSqft', 'adoptableBUASqft', 'constructionRatePerSqft'].includes(key)) {
        next.totalLandValue = String(calcLandVal);
        next.totalConstValue100 = String(calcConstVal);
        next.totalConstValueStage = String(calcConstVal);
        next.marketValue100 = String(calcMV);
        next.marketValueStage = String(calcMV);
        next.distressValue100 = String(calcDistress);
        next.distressValueStage = String(calcDistress);
      }

      return next;
    });
  }, []);

  // Upload handler for maps
  const handleMapUpload = async (fieldKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading(fieldKey);
      const urls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `reports/${projectId}/maps/${Date.now()}_${i}.${ext}`;
        const { error: uploadErr } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: publicUrlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(path);
        urls.push(publicUrlData.publicUrl);
      }
      setFields((prev) => ({
        ...prev,
        [fieldKey]: [...(prev[fieldKey] || []), ...urls],
      }));
    } catch (err: any) {
      alert('Error uploading map image: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Upload handler for documents
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading('documents');
      const urls: string[] = [];
      const names: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `reports/${projectId}/documents/${Date.now()}_${i}.${ext}`;
        const { error: uploadErr } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: publicUrlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(path);
        urls.push(publicUrlData.publicUrl);
        names.push(file.name.replace(/\.[^/.]+$/, ''));
      }
      setFields((prev) => ({
        ...prev,
        documentImages: [...(prev.documentImages || []), ...urls],
        documentImageNames: [...(prev.documentImageNames || []), ...names],
      }));
    } catch (err: any) {
      alert('Error uploading documents: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Upload handler for photos
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading('photos');
      const urls: string[] = [];
      const names: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `reports/${projectId}/photos/${Date.now()}_${i}.${ext}`;
        const { error: uploadErr } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(path, file);
        if (uploadErr) throw uploadErr;
        const { data: publicUrlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(path);
        urls.push(publicUrlData.publicUrl);
        names.push(`Photograph ${(fields.propertyImages?.length || 0) + i + 1}`);
      }
      setFields((prev) => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...urls],
        propertyImageNames: [...(prev.propertyImageNames || []), ...names],
      }));
    } catch (err: any) {
      alert('Error uploading photos: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: fields.marketValue100 || 0,
        updated_at: new Date().toISOString(),
      });
      setAutoSaveStatus('saved');
      setMessage({ text: 'Draft saved successfully', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setAutoSaveStatus('error');
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report? It will mark the report as completed.')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: fields.marketValue100 || 0,
        updated_at: new Date().toISOString(),
      });
      await supabaseBrowser.from('projects').update({
        status: 'COMPLETED',
        valuation_amount: fields.marketValue100 || 0,
        updated_at: new Date().toISOString(),
      });
      alert('Report submitted successfully!');
      router.refresh();
    } catch (err: any) {
      alert('Error submitting report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // PDF Preview & Download
  const generatePdfBytes = async (): Promise<Uint8Array> => {
    const renderer = new PDFVistaarFinanceRenderer({
      ...fields,
      projectCode,
    });
    return await renderer.render();
  };

  const handlePreviewPDF = async () => {
    try {
      setPreviewing(true);
      const pdfBytes = await generatePdfBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert(`Error previewing PDF: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPreviewing(true);
      const pdfBytes = await generatePdfBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Vistaar_Finance_Report_${fields.proposalNo || projectCode || 'valuation'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Error downloading PDF: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="space-y-6 pb-28 w-full">
      {/* ── Active Configuration Banner with Change Parameters ── */}
      <ActiveConfigBanner
        clientType="organisation"
        category="Bank & FIS"
        bankName={fields.organisationTemplate || 'VISTAAR FINANCE'}
        subclass={fields.organisationSubTemplate || undefined}
        onResetWizard={onResetWizard}
        sticky={false}
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
        <div className="bg-white rounded-xl shadow border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              VISTAAR FINANCE — VALUATION REPORT
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Vistaar Financial Services Pvt Ltd • Proposal No: <span className="font-semibold text-slate-700">{fields.proposalNo || projectCode}</span>
            </p>
          </div>
          <EarliestFieldVisitBadge fieldVisit={earliestVisit} />
        </div>

        {earliestVisit && (
          <div className="flex items-center justify-between p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 text-sm">
            <span className="font-medium">Site inspection detected from uploaded images ({formatReportDate(earliestVisit.date)}).</span>
            <button
              type="button"
              onClick={() => {
                const dt = formatReportDate(earliestVisit.date);
                updateField('valuationDate', dt);
                updateField('inspectionDate', dt);
                updateField('reportSubmissionDate', dt);
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              Sync Inspection Dates
            </button>
          </div>
        )}

        {/* 1. Header & Technical Initiation */}
        <div id="vistaar-sec-meta">
          <Section title="Technical Initiation Request Form Data">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="Valuation Agency">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valuationAgency || ''}
                  onChange={(e) => updateField('valuationAgency', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Date of Valuation">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valuationDate || ''}
                  onChange={(e) => updateField('valuationDate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Proposal No">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.proposalNo || ''}
                  onChange={(e) => updateField('proposalNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Case Type">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.caseType || ''}
                  onChange={(e) => updateField('caseType', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Date of Inspection / Site Visit">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.inspectionDate || ''}
                  onChange={(e) => updateField('inspectionDate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Nearest Landmark">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nearestLandmark || ''}
                  onChange={(e) => updateField('nearestLandmark', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="Customer / Applicant & Contact">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.applicantDetails || ''}
                  onChange={(e) => updateField('applicantDetails', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Current Owner / Seller">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ownerSeller || ''}
                  onChange={(e) => updateField('ownerSeller', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Person Met at Site & Contact">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.personMetAtSite || ''}
                  onChange={(e) => updateField('personMetAtSite', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Field label="Address as per TRF">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.addressAsPerTRF || ''}
                  onChange={(e) => updateField('addressAsPerTRF', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Address as per Document">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.addressAsPerDoc || ''}
                  onChange={(e) => updateField('addressAsPerDoc', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Address as per Actual at Site">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.addressAtSite || ''}
                  onChange={(e) => updateField('addressAtSite', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Documents Provided">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.documentsProvided || ''}
                  onChange={(e) => updateField('documentsProvided', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 2. Locational & Property Specific Details */}
        <div id="vistaar-sec-locational">
          <Section title="Locational & Property Specific Details (based on site visit)">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Status of Land Holding">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.landHoldingStatus || ''}
                  onChange={(e) => updateField('landHoldingStatus', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Developed By">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.developedBy || ''}
                  onChange={(e) => updateField('developedBy', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Type of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfProperty || ''}
                  onChange={(e) => updateField('typeOfProperty', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Type of Locality">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfLocality || ''}
                  onChange={(e) => updateField('typeOfLocality', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Occupation Status">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.occupationStatus || ''}
                  onChange={(e) => updateField('occupationStatus', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Location/Zoning Master Plan">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.zoningMasterPlan || ''}
                  onChange={(e) => updateField('zoningMasterPlan', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Property Usage">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.propertyUsage || ''}
                  onChange={(e) => updateField('propertyUsage', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Plot Demarcation">
                <select
                  className={selectCls}
                  value={fields.plotDemarcation || 'Yes'}
                  onChange={(e) => updateField('plotDemarcation', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="Property Identifiable">
                <select
                  className={selectCls}
                  value={fields.propertyIdentifiable || 'Yes'}
                  onChange={(e) => updateField('propertyIdentifiable', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="Identified Through">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.identifiedThrough || ''}
                  onChange={(e) => updateField('identifiedThrough', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Within MC / GP Limit">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.withinMCLimit || ''}
                  onChange={(e) => updateField('withinMCLimit', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Type of Structure">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfStructure || ''}
                  onChange={(e) => updateField('typeOfStructure', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Internal Finishing">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.internalFinishing || ''}
                  onChange={(e) => updateField('internalFinishing', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="External Finishing">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.externalFinishing || ''}
                  onChange={(e) => updateField('externalFinishing', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="No. of Floors">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={(e) => updateField('noOfFloors', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Located on Floor No">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.locatedOnFloor || ''}
                  onChange={(e) => updateField('locatedOnFloor', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Construction Stage (%)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionStage || ''}
                  onChange={(e) => updateField('constructionStage', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Year of Completion">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.yearOfCompletion || ''}
                  onChange={(e) => updateField('yearOfCompletion', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Age of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ageOfProperty || ''}
                  onChange={(e) => updateField('ageOfProperty', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Future Physical Life">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.futurePhysicalLife || ''}
                  onChange={(e) => updateField('futurePhysicalLife', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 3. Boundaries & Setbacks */}
        <div id="vistaar-sec-boundaries">
          <Section title="Boundaries & Setbacks">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Four Boundaries Comparison</h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 font-medium">
                  <tr>
                    <th className="px-3 py-2 text-left">Basis</th>
                    <th className="px-3 py-2 text-left">North</th>
                    <th className="px-3 py-2 text-left">South</th>
                    <th className="px-3 py-2 text-left">East</th>
                    <th className="px-3 py-2 text-left">West</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Documents (Sale Deed)</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocNorth || ''} onChange={(e) => updateField('bndDocNorth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocSouth || ''} onChange={(e) => updateField('bndDocSouth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocEast || ''} onChange={(e) => updateField('bndDocEast', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocWest || ''} onChange={(e) => updateField('bndDocWest', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Bhunaksha / Map</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndBhunakshaNorth || ''} onChange={(e) => updateField('bndBhunakshaNorth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndBhunakshaSouth || ''} onChange={(e) => updateField('bndBhunakshaSouth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndBhunakshaEast || ''} onChange={(e) => updateField('bndBhunakshaEast', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndBhunakshaWest || ''} onChange={(e) => updateField('bndBhunakshaWest', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Site / Actual</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSiteNorth || ''} onChange={(e) => updateField('bndSiteNorth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSiteSouth || ''} onChange={(e) => updateField('bndSiteSouth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSiteEast || ''} onChange={(e) => updateField('bndSiteEast', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSiteWest || ''} onChange={(e) => updateField('bndSiteWest', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Field label="Boundaries Matching?">
                <select className={selectCls} value={fields.boundariesMatching || 'Yes'} onChange={(e) => updateField('boundariesMatching', e.target.value)} disabled={isReadOnly}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="If No, then reason thereon">
                <input type="text" className={inputCls} value={fields.boundariesMismatchReason || ''} onChange={(e) => updateField('boundariesMismatchReason', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Setbacks & Margins</h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 font-medium">
                  <tr>
                    <th className="px-3 py-2 text-left">Basis</th>
                    <th className="px-3 py-2 text-left">Front</th>
                    <th className="px-3 py-2 text-left">Rear</th>
                    <th className="px-3 py-2 text-left">Left Side</th>
                    <th className="px-3 py-2 text-left">Right Side</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Permissible Byelaws</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbPermFront || ''} onChange={(e) => updateField('sbPermFront', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbPermRear || ''} onChange={(e) => updateField('sbPermRear', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbPermLeft || ''} onChange={(e) => updateField('sbPermLeft', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbPermRight || ''} onChange={(e) => updateField('sbPermRight', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Site / Actual</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbActualFront || ''} onChange={(e) => updateField('sbActualFront', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbActualRear || ''} onChange={(e) => updateField('sbActualRear', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbActualLeft || ''} onChange={(e) => updateField('sbActualLeft', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbActualRight || ''} onChange={(e) => updateField('sbActualRight', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Height / Storeys (Permissible)">
                <input type="text" className={inputCls} value={fields.heightPermissible || ''} onChange={(e) => updateField('heightPermissible', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Height / Storeys (Actual at site)">
                <input type="text" className={inputCls} value={fields.heightActual || ''} onChange={(e) => updateField('heightActual', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 4. Built-up Area & Accommodations */}
        <div id="vistaar-sec-bua">
          <Section title="Built-up Area & Accommodation Details">
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 font-medium">
                  <tr>
                    <th className="px-3 py-2 text-left">Floor</th>
                    <th className="px-3 py-2 text-left">Accommodation</th>
                    <th className="px-3 py-2 text-left">Carpet Area (Sft)</th>
                    <th className="px-3 py-2 text-left">Actual BUA / SBUA (Sft)</th>
                    <th className="px-3 py-2 text-left">Permissible BUA (Sft)</th>
                    <th className="px-3 py-2 text-left font-semibold">Adopted BUA (Sft)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">Basement / Stilt</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaBasementAccom || ''} onChange={(e) => updateField('buaBasementAccom', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaBasementCarpet || ''} onChange={(e) => updateField('buaBasementCarpet', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaBasementActual || ''} onChange={(e) => updateField('buaBasementActual', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaBasementPerm || ''} onChange={(e) => updateField('buaBasementPerm', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaBasementAdopted || ''} onChange={(e) => updateField('buaBasementAdopted', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">Ground Floor</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaGFAccom || ''} onChange={(e) => updateField('buaGFAccom', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaGFCarpet || ''} onChange={(e) => updateField('buaGFCarpet', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaGFActual || ''} onChange={(e) => updateField('buaGFActual', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaGFPerm || ''} onChange={(e) => updateField('buaGFPerm', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaGFAdopted || ''} onChange={(e) => updateField('buaGFAdopted', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr className="font-semibold bg-slate-100/60 dark:bg-slate-800/60">
                    <td className="px-3 py-2">Total</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaTotalAccom || ''} onChange={(e) => updateField('buaTotalAccom', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaTotalCarpet || ''} onChange={(e) => updateField('buaTotalCarpet', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaTotalActual || ''} onChange={(e) => updateField('buaTotalActual', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaTotalPerm || ''} onChange={(e) => updateField('buaTotalPerm', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.buaTotalAdopted || ''} onChange={(e) => updateField('buaTotalAdopted', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Field label="Violation Observed (if any)">
              <input type="text" className={inputCls} value={fields.violationObserved || ''} onChange={(e) => updateField('violationObserved', e.target.value)} disabled={isReadOnly} />
            </Field>
          </Section>
        </div>

        {/* 5. Plan Approvals & Estimate Analysis */}
        <div id="vistaar-sec-plan">
          <Section title="Plan Approvals & Estimate Analysis">
            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Plan Approvals</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Construction as per approved/sanctioned plans">
                <input type="text" className={inputCls} value={fields.constructionAsPerPlan || ''} onChange={(e) => updateField('constructionAsPerPlan', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Details of approved plan with approval no & date">
                <input type="text" className={inputCls} value={fields.planApprovalDetails || ''} onChange={(e) => updateField('planApprovalDetails', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Construction permission Number and date">
                <input type="text" className={inputCls} value={fields.constructionPermissionNo || ''} onChange={(e) => updateField('constructionPermissionNo', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Violations Observed If Any">
                <input type="text" className={inputCls} value={fields.approvalViolations || ''} onChange={(e) => updateField('approvalViolations', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
            <div className="mb-6">
              <Field label="If plans not available then is the structure confirming to local byelaws?">
                <input type="text" className={inputCls} value={fields.confirmingByelaws || ''} onChange={(e) => updateField('confirmingByelaws', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Estimate Analysis (Self Construction cases)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Estimated Cost (In Rs)">
                <input type="text" className={inputCls} value={fields.estimatedCostTotal || ''} onChange={(e) => updateField('estimatedCostTotal', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Estimated Cost (Rs per Sqft)">
                <input type="text" className={inputCls} value={fields.estimatedCostRate || ''} onChange={(e) => updateField('estimatedCostRate', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Justified Estimated Cost (Rs per Sqft)">
                <input type="text" className={inputCls} value={fields.justifiedCostRate || ''} onChange={(e) => updateField('justifiedCostRate', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Adoptable Estimated Cost (In Rs)">
                <input type="text" className={inputCls} value={fields.adoptableJustifiedCost || ''} onChange={(e) => updateField('adoptableJustifiedCost', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 6. Property Valuation */}
        <div id="vistaar-sec-valuation">
          <Section title="Valuation of Property (Fair Market Valuation / Distress Valuation)">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="Land Area (In Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.landAreaSqft || ''}
                  onChange={(e) => updateField('landAreaSqft', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Adoptable Built-up Area (Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.adoptableBUASqft || ''}
                  onChange={(e) => updateField('adoptableBUASqft', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Market Rate Land (Range)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.marketRateLandRange || ''}
                  onChange={(e) => updateField('marketRateLandRange', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Recommended Rate of Land (Rs/Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.recRateLandPerSqft || ''}
                  onChange={(e) => updateField('recRateLandPerSqft', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Construction Cost (Rs per Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.constructionRatePerSqft || ''}
                  onChange={(e) => updateField('constructionRatePerSqft', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Total Land Value (In Rs)">
                <input
                  type="text"
                  className={`${inputCls} font-semibold text-emerald-600 dark:text-emerald-400`}
                  value={fields.totalLandValue || ''}
                  onChange={(e) => updateField('totalLandValue', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Total Const Value (100% complete)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalConstValue100 || ''}
                  onChange={(e) => updateField('totalConstValue100', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Total Const Value (Present stage)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.totalConstValueStage || ''}
                  onChange={(e) => updateField('totalConstValueStage', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl mb-4">
              <Field label="Market Value (100% complete)">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formatIndianCurrency(fields.marketValue100)}
                </div>
              </Field>
              <Field label="Market Value (Present Stage)">
                <div className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formatIndianCurrency(fields.marketValueStage)}
                </div>
              </Field>
              <Field label="Distress Value @ 75% (100% complete)">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatIndianCurrency(fields.distressValue100)}
                </div>
              </Field>
              <Field label="Distress Value @ 75% (As on date)">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatIndianCurrency(fields.distressValueStage)}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Govt Guideline Rate Land (Rs/Sqft)">
                <input type="text" className={inputCls} value={fields.govtRateLand || ''} onChange={(e) => updateField('govtRateLand', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Land Value as per Govt Rate (Rs)">
                <input type="text" className={inputCls} value={fields.landValueGovt || ''} onChange={(e) => updateField('landValueGovt', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Latitude (N)">
                <input type="text" className={inputCls} value={fields.latitude || ''} onChange={(e) => updateField('latitude', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Longitude (E)">
                <input type="text" className={inputCls} value={fields.longitude || ''} onChange={(e) => updateField('longitude', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 7. Remarks & Certification */}
        <div id="vistaar-sec-remarks">
          <Section title="Property Specific Remarks & Observation">
            <div className="space-y-4">
              <Field label="Detailed Remarks & Observation">
                <textarea
                  rows={5}
                  className={inputCls}
                  value={fields.remarks || ''}
                  onChange={(e) => updateField('remarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <Field label="Date of Visit">
                  <input type="text" className={inputCls} value={fields.inspectionDate || ''} onChange={(e) => updateField('inspectionDate', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Date of Report Submission">
                  <input type="text" className={inputCls} value={fields.reportSubmissionDate || ''} onChange={(e) => updateField('reportSubmissionDate', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Engineer Visited the Property">
                  <input type="text" className={inputCls} value={fields.visitingEngineer || ''} onChange={(e) => updateField('visitingEngineer', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Authorized Signatory">
                  <input type="text" className={inputCls} value={fields.authorizedSignatory || ''} onChange={(e) => updateField('authorizedSignatory', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* 8. Attachments: Photographs, Maps & Verified Documents */}
        <div id="vistaar-sec-attachments" className="space-y-6">
          <BaseDocumentsSection
            title="Verified Property Documents"
            sectionId="vistaar-sec-docs"
            documentImages={fields.documentImages || []}
            documentImageNames={fields.documentImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onUploadDocuments={handleDocUpload}
            onRemoveDocument={(idx) =>
              setFields((p) => ({
                ...p,
                documentImages: (p.documentImages || []).filter((_: any, i: number) => i !== idx),
                documentImageNames: (p.documentImageNames || []).filter((_: any, i: number) => i !== idx),
              }))
            }
            onDocumentNameChange={(idx, name) => {
              const arr = [...(fields.documentImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFields((p) => ({ ...p, documentImageNames: arr }));
            }}
            onReorderDocuments={(newImgs, newNames) =>
              setFields((p) => ({ ...p, documentImages: newImgs, documentImageNames: newNames }))
            }
          />

          <BaseMapsSection
            title="Location Sketch & Route Maps"
            sectionId="vistaar-sec-maps"
            locationMapImages={fields.locationMapImages || []}
            mouzaMapImages={fields.mouzaMapImages || []}
            sketchMapImages={fields.sketchMapImages || []}
            cadastralMapImages={fields.cadastralMapImages || []}
            bdaMapImages={fields.bdaMapImages || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
            onLocationMapRemove={(idx) =>
              setFields((p) => ({
                ...p,
                locationMapImages: (p.locationMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)),
              }))
            }
            onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
            onMouzaMapRemove={(idx) =>
              setFields((p) => ({
                ...p,
                mouzaMapImages: (p.mouzaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)),
              }))
            }
            onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
            onSketchMapRemove={(idx) =>
              setFields((p) => ({
                ...p,
                sketchMapImages: (p.sketchMapImages || []).filter((_: any, i: number) => i !== idx),
              }))
            }
            onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
            onCadastralMapRemove={(idx) =>
              setFields((p) => ({
                ...p,
                cadastralMapImages: (p.cadastralMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)),
              }))
            }
            onBdaMapUpload={(e) => handleMapUpload('bdaMapImages', e)}
            onBdaMapRemove={(idx) =>
              setFields((p) => ({
                ...p,
                bdaMapImages: (p.bdaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)),
              }))
            }
            onReorderLocationMap={(newImgs) => setFields((p) => ({ ...p, locationMapImages: newImgs }))}
            onReorderMouzaMap={(newImgs) => setFields((p) => ({ ...p, mouzaMapImages: newImgs }))}
            onReorderSketchMap={(newImgs) => setFields((p) => ({ ...p, sketchMapImages: newImgs }))}
            onReorderCadastralMap={(newImgs) => setFields((p) => ({ ...p, cadastralMapImages: newImgs }))}
            onReorderBdaMap={(newImgs) => setFields((p) => ({ ...p, bdaMapImages: newImgs }))}
          />

          <BasePhotographsSection
            title="Property Site Photographs"
            sectionId="vistaar-sec-photos"
            propertyImages={fields.propertyImages || []}
            propertyImageNames={fields.propertyImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            bucketCount={bucketImages?.length || 0}
            onOpenBucketPicker={() => setShowBucketModal(true)}
            onUploadImages={handlePhotoUpload}
            onRemoveImage={(idx) =>
              setFields((p) => ({
                ...p,
                propertyImages: (p.propertyImages || []).filter((_: any, i: number) => i !== idx),
                propertyImageNames: (p.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
              }))
            }
            onImageNameChange={(idx, name) => {
              const arr = [...(fields.propertyImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFields((p) => ({ ...p, propertyImageNames: arr }));
            }}
            onReorderImages={(newImgs, newNames) =>
              setFields((p) => ({ ...p, propertyImages: newImgs, propertyImageNames: newNames }))
            }
          />
        </div>
      </div>

      {/* ── Right Sections Nav Panel ── */}
      <FloatingNavigator sections={navSections} />
    </div>

      {/* Floating Action Bar */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={autoSaveStatus}
        message={message}
        loading={saving || submitting || previewing || !!uploading}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Bucket Selector Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            setFields((prev) => ({
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
