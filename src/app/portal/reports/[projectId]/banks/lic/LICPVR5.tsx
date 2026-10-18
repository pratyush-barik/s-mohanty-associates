'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  getEarliestFieldVisit,
  BankReportHeader,
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
  EarliestFieldVisitBadge,
  BasePhotoBucketModal,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFLICPVR5Renderer } from '@/lib/banks/pdf-lic-pvr5-renderer';

export const LIC_PVR5_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-5 (SUBSEQUENT VALUATION REPORT)',
  displayName: 'LIC Housing Finance Ltd — PVR-5 (Subsequent Valuation Report)',
  defaultValues: {
    purpose: 'Subsequent Valuation Report by Panel Valuer for Home Loan (House Construction)',
  },
};

export interface LICPVR5Props extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function LICPVR5({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: LICPVR5Props) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  const navSections: NavItem[] = [
    { id: 'pvr5-header', title: '1. Header & Case' },
    { id: 'pvr5-general', title: '2. General Details' },
    { id: 'pvr5-inspection', title: '3. Inspection Details' },
    { id: 'pvr5-value', title: '4. Total Value' },
    { id: 'pvr5-docs', title: 'Documents' },
    { id: 'pvr5-maps', title: 'Maps' },
    { id: 'pvr5-photos', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const raw = rawInitialFields || {};
    return {
      fileNo: raw.fileNo || (prefill as any)?.loanAccountNo || (prefill as any)?.projectCode || '',
      nameOfValuer: raw.nameOfValuer || 'Er. Satyajit Mohanty',
      codeNo: raw.codeNo || 'BH-AOV0078',
      dateOfValuation: raw.dateOfValuation || formatReportDate(new Date().toISOString()),
      areaOffice: raw.areaOffice || 'Bhubaneswar',

      // A. General
      previousReportDateRef: raw.previousReportDateRef || '',
      applicantName: raw.applicantName || (prefill as any)?.applicantName || (prefill as any)?.contactName || '',
      dateOfInspection: raw.dateOfInspection || earliestVisit?.date || '',
      propertyLocation: raw.propertyLocation || (prefill as any)?.property?.propertyAddress || '',
      plotSurveyNo: raw.plotSurveyNo || (prefill as any)?.property?.plotNo || '',
      villageTalukWard: raw.villageTalukWard || (prefill as any)?.property?.mouza || '',
      districtMunicipality: raw.districtMunicipality || (prefill as any)?.property?.district || '',

      // B. Inspection
      plinthApproved: raw.plinthApproved || '',
      plinthActual: raw.plinthActual || '',
      fsiApproved: raw.fsiApproved || '',
      fsiActual: raw.fsiActual || '',
      unitsApproved: raw.unitsApproved || '1',
      unitsActual: raw.unitsActual || '1',

      constructionAsPerPlan: raw.constructionAsPerPlan || 'Yes',
      deviationApprovedActual: raw.deviationApprovedActual || 'NA',
      deviationMinorMajor: raw.deviationMinorMajor || 'NA',
      deviationRevisedApproval: raw.deviationRevisedApproval || 'No',
      safetySpecsComplied: raw.safetySpecsComplied || 'Yes',
      highTensionLines: raw.highTensionLines || 'No',

      // C. Total Value
      landMarketValue: raw.landMarketValue || ((prefill as any)?.property?.plotArea && (prefill as any)?.property?.marketRate ? String(Math.round((prefill as any).property.plotArea * (prefill as any).property.marketRate)) : '0'),
      stageOfConstructionPct: raw.stageOfConstructionPct || '100',
      stageConstMarketValue: raw.stageConstMarketValue || '0',
      bldg100CompletionValue: raw.bldg100CompletionValue || '0',

      // Certificate
      inspectionDate: raw.inspectionDate || earliestVisit?.date || '',
      valuationStation: raw.valuationStation || 'Bhubaneswar',

      // Attachments
      propertyImages: raw.propertyImages || [],
      propertyImageNames: raw.propertyImageNames || [],
      locationMapImages: raw.locationMapImages || [],
      mouzaMapImages: raw.mouzaMapImages || [],
      sketchMapImages: raw.sketchMapImages || [],
      cadastralMapImages: raw.cadastralMapImages || [],
      bdaMapImages: raw.bdaMapImages || [],
      documentImages: raw.documentImages || [],
      documentImageNames: raw.documentImageNames || [],
    };
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<string | boolean>(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const softCardCls = 'bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4';

  const handleChange = useCallback((field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  }, []);

  const valuationMath = useMemo(() => {
    const lVal = parseFloat(formData.landMarketValue) || 0;
    const stageVal = parseFloat(formData.stageConstMarketValue) || 0;
    const totalPresent = lVal + stageVal;
    const bldg100 = parseFloat(formData.bldg100CompletionValue) || 0;

    return {
      lVal,
      stageVal,
      totalPresent,
      bldg100,
      wordsPresent: rupeesInWords(totalPresent),
      words100: rupeesInWords(bldg100),
    };
  }, [formData.landMarketValue, formData.stageConstMarketValue, formData.bldg100CompletionValue]);

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading('documents');
      const newUrls: string[] = [];
      const newNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filePath = `reports/${projectId}/docs/${Date.now()}_${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
        newNames.push(file.name.replace(/\.[^/.]+$/, ''));
      }
      setFormData((prev) => ({
        ...prev,
        documentImages: [...(prev.documentImages || []), ...newUrls],
        documentImageNames: [...(prev.documentImageNames || []), ...newNames],
      }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading('photos');
      const newUrls: string[] = [];
      const newNames: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filePath = `reports/${projectId}/photos/${Date.now()}_${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
        newNames.push(`Photograph ${(formData.propertyImages?.length || 0) + i + 1}`);
      }
      setFormData((prev) => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...newUrls],
        propertyImageNames: [...(prev.propertyImageNames || []), ...newNames],
      }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleMapUpload = async (mapKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading(mapKey);
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filePath = `reports/${projectId}/maps/${Date.now()}_${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }
      setFormData((prev) => ({
        ...prev,
        [mapKey]: [...(prev[mapKey] || []), ...newUrls],
      }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setAutoSaveStatus('saving');
      await saveReportDraft(projectId, {
        ...formData,
        calculatedValuation: valuationMath,
        updated_at: new Date().toISOString(),
      });
      setAutoSaveStatus('saved');
      setMessage({ text: 'Draft saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setAutoSaveStatus('error');
      setMessage({ text: 'Error saving draft: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this PVR-5 subsequent valuation report?')) return;
    try {
      setSubmitting(true);
      await saveReportDraft(projectId, {
        ...formData,
        calculatedValuation: valuationMath,
        updated_at: new Date().toISOString(),
      });
      alert('Report submitted for verification!');
      router.refresh();
    } catch (err: any) {
      alert('Error submitting report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreviewPDF = async () => {
    try {
      setPreviewing(true);
      const renderer = new PDFLICPVR5Renderer({
        ...formData,
        projectCode,
        calculatedValuation: valuationMath,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert('Error generating preview: ' + err.message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPreviewing(true);
      const renderer = new PDFLICPVR5Renderer({
        ...formData,
        projectCode,
        calculatedValuation: valuationMath,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LIC_PVR5_${projectCode || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert('Error generating PDF: ' + err.message);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Universal Standardized Bank Report Header */}
      <div className="w-full px-4 sm:px-6 lg:px-8 pt-6">
        <BankReportHeader
          bankName="LIC HOUSING FINANCE LTD"
          subclass="PVR-5 (Subsequent Valuation Report)"
          clientType="organisation"
          category="Bank & FIS"
          onResetWizard={onResetWizard}
          title="Valuation Report Builder"
          description="Subsequent Progress & Stage Disbursement Inspection Valuation Report."
          earliestVisit={earliestVisit}
          projectCode={projectCode}
          status={status}
          message={message}
          onDismissMessage={() => setMessage(null)}
        />
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start w-full px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex-1 min-w-0 space-y-6 w-full">

        {/* 1. Header & Case */}
        <div id="pvr5-header" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">1. Header & Case Reference</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="File No">
              <input type="text" className={inputCls} value={formData.fileNo} onChange={(e) => handleChange('fileNo', e.target.value)} />
            </Field>
            <Field label="Previous Report Date & Ref">
              <input type="text" className={inputCls} value={formData.previousReportDateRef} onChange={(e) => handleChange('previousReportDateRef', e.target.value)} />
            </Field>
            <Field label="Date of Valuation">
              <input type="text" className={inputCls} value={formData.dateOfValuation} onChange={(e) => handleChange('dateOfValuation', e.target.value)} />
            </Field>
            <Field label="Valuer Name">
              <input type="text" className={inputCls} value={formData.nameOfValuer} onChange={(e) => handleChange('nameOfValuer', e.target.value)} />
            </Field>
            <Field label="Code No">
              <input type="text" className={inputCls} value={formData.codeNo} onChange={(e) => handleChange('codeNo', e.target.value)} />
            </Field>
            <Field label="Area Office">
              <input type="text" className={inputCls} value={formData.areaOffice} onChange={(e) => handleChange('areaOffice', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* 2. General Details */}
        <div id="pvr5-general" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">2. General Details (A. GENERAL)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Applicant Name">
              <input type="text" className={inputCls} value={formData.applicantName} onChange={(e) => handleChange('applicantName', e.target.value)} />
            </Field>
            <Field label="Date of Inspection">
              <input type="text" className={inputCls} value={formData.dateOfInspection} onChange={(e) => handleChange('dateOfInspection', e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Location of Property">
                <input type="text" className={inputCls} value={formData.propertyLocation} onChange={(e) => handleChange('propertyLocation', e.target.value)} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Plot No. / Survey No. / Villa Name">
                <input type="text" className={inputCls} value={formData.plotSurveyNo} onChange={(e) => handleChange('plotSurveyNo', e.target.value)} />
              </Field>
            </div>
            <Field label="Village / Taluk / Ward">
              <input type="text" className={inputCls} value={formData.villageTalukWard} onChange={(e) => handleChange('villageTalukWard', e.target.value)} />
            </Field>
            <Field label="District / Corporation / Municipality">
              <input type="text" className={inputCls} value={formData.districtMunicipality} onChange={(e) => handleChange('districtMunicipality', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* 3. Inspection Details */}
        <div id="pvr5-inspection" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">3. Construction Details & Deviations (B. INSPECTION)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Plinth Area (Plan / Actual)">
              <div className="flex gap-2">
                <input type="text" className={inputCls} placeholder="Plan: 858sqft" value={formData.plinthApproved} onChange={(e) => handleChange('plinthApproved', e.target.value)} />
                <input type="text" className={inputCls} placeholder="Act: 858sqft" value={formData.plinthActual} onChange={(e) => handleChange('plinthActual', e.target.value)} />
              </div>
            </Field>
            <Field label="F.S.I. (Plan / Actual)">
              <div className="flex gap-2">
                <input type="text" className={inputCls} placeholder="1.17" value={formData.fsiApproved} onChange={(e) => handleChange('fsiApproved', e.target.value)} />
                <input type="text" className={inputCls} placeholder="1.17" value={formData.fsiActual} onChange={(e) => handleChange('fsiActual', e.target.value)} />
              </div>
            </Field>
            <Field label="No. of Dwelling Units (Plan / Actual)">
              <div className="flex gap-2">
                <input type="text" className={inputCls} placeholder="2" value={formData.unitsApproved} onChange={(e) => handleChange('unitsApproved', e.target.value)} />
                <input type="text" className={inputCls} placeholder="2" value={formData.unitsActual} onChange={(e) => handleChange('unitsActual', e.target.value)} />
              </div>
            </Field>

            <Field label="Construction as per approved plan?">
              <select className={selectCls} value={formData.constructionAsPerPlan} onChange={(e) => handleChange('constructionAsPerPlan', e.target.value)}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Deviations between approved & actual?">
              <input type="text" className={inputCls} value={formData.deviationApprovedActual} onChange={(e) => handleChange('deviationApprovedActual', e.target.value)} />
            </Field>
            <Field label="Revised approval necessary?">
              <select className={selectCls} value={formData.deviationRevisedApproval} onChange={(e) => handleChange('deviationRevisedApproval', e.target.value)}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
          </div>
        </div>

        {/* 4. Total Value */}
        <div id="pvr5-value" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-200">4. Valuation Computation (C. TOTAL VALUE)</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono">
              Auto-Calculated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="1. Value of Land (₹)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.landMarketValue} onChange={(e) => handleChange('landMarketValue', e.target.value)} />
            </Field>
            <Field label="Present Stage (%)">
              <input type="number" step="1" min="0" max="100" className={inputCls} value={formData.stageOfConstructionPct} onChange={(e) => handleChange('stageOfConstructionPct', e.target.value)} />
            </Field>
            <Field label="2. Present Stage Const Value (₹)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.stageConstMarketValue} onChange={(e) => handleChange('stageConstMarketValue', e.target.value)} />
            </Field>
            <Field label="4. Building Value on 100% (₹)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.bldg100CompletionValue} onChange={(e) => handleChange('bldg100CompletionValue', e.target.value)} />
            </Field>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400">3. Total Present Value of Existing Building (1+2):</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">₹{formatIndianCurrency(valuationMath.totalPresent)}/-</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{valuationMath.wordsPresent}</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400">4. Value of Building on 100% Completion:</span>
              <p className="text-xl font-bold text-amber-400 mt-1">₹{formatIndianCurrency(valuationMath.bldg100)}/-</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{valuationMath.words100}</p>
            </div>
          </div>
        </div>

        {/* Attachments: Documents, Maps, Photographs */}
        <div id="pvr5-docs">
          <BaseDocumentsSection
            title="Documents"
            sectionId="pvr5-docs"
            documentImages={formData.documentImages || []}
            documentImageNames={formData.documentImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onUploadDocuments={handleDocUpload}
            onRemoveDocument={(idx) => setFormData((p) => ({
              ...p,
              documentImages: (p.documentImages || []).filter((_: any, i: number) => i !== idx),
              documentImageNames: (p.documentImageNames || []).filter((_: any, i: number) => i !== idx),
            }))}
            onDocumentNameChange={(idx, name) => {
              const arr = [...(formData.documentImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFormData((p) => ({ ...p, documentImageNames: arr }));
            }}
            onReorderDocuments={(newImgs, newNames) => setFormData((p) => ({ ...p, documentImages: newImgs, documentImageNames: newNames }))}
          />
        </div>

        <div id="pvr5-maps">
          <BaseMapsSection
            title="Maps"
            sectionId="pvr5-maps"
            locationMapImages={formData.locationMapImages || []}
            mouzaMapImages={formData.mouzaMapImages || []}
            sketchMapImages={formData.sketchMapImages || []}
            cadastralMapImages={formData.cadastralMapImages || []}
            bdaMapImages={formData.bdaMapImages || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
            onLocationMapRemove={(idx) => setFormData((p) => ({ ...p, locationMapImages: (p.locationMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
            onMouzaMapRemove={(idx) => setFormData((p) => ({ ...p, mouzaMapImages: (p.mouzaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
            onSketchMapRemove={(idx) => setFormData((p) => ({ ...p, sketchMapImages: (p.sketchMapImages || []).filter((_: any, i: number) => i !== idx) }))}
            onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
            onCadastralMapRemove={(idx) => setFormData((p) => ({ ...p, cadastralMapImages: (p.cadastralMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onBdaMapUpload={(e) => handleMapUpload('bdaMapImages', e)}
            onBdaMapRemove={(idx) => setFormData((p) => ({ ...p, bdaMapImages: (p.bdaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onReorderLocationMap={(newImgs) => setFormData((p) => ({ ...p, locationMapImages: newImgs }))}
            onReorderMouzaMap={(newImgs) => setFormData((p) => ({ ...p, mouzaMapImages: newImgs }))}
            onReorderSketchMap={(newImgs) => setFormData((p) => ({ ...p, sketchMapImages: newImgs }))}
            onReorderCadastralMap={(newImgs) => setFormData((p) => ({ ...p, cadastralMapImages: newImgs }))}
            onReorderBdaMap={(newImgs) => setFormData((p) => ({ ...p, bdaMapImages: newImgs }))}
          />
        </div>

        <div id="pvr5-photos">
          <BasePhotographsSection
            title="Photographs"
            sectionId="pvr5-photos"
            propertyImages={formData.propertyImages || []}
            propertyImageNames={formData.propertyImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            bucketCount={bucketImages?.length || 0}
            onOpenBucketPicker={() => setShowBucketModal(true)}
            onUploadImages={handlePhotoUpload}
            onRemoveImage={(idx) => setFormData((p) => ({
              ...p,
              propertyImages: (p.propertyImages || []).filter((_: any, i: number) => i !== idx),
              propertyImageNames: (p.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
            }))}
            onImageNameChange={(idx, name) => {
              const arr = [...(formData.propertyImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFormData((p) => ({ ...p, propertyImageNames: arr }));
            }}
            onReorderImages={(newImgs, newNames) => setFormData((p) => ({ ...p, propertyImages: newImgs, propertyImageNames: newNames }))}
          />
        </div>
      </div>

      {/* ── Right Sections Nav Panel ── */}
      <FloatingNavigator sections={navSections} />
    </div>

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

      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            setFormData((prev) => ({
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
