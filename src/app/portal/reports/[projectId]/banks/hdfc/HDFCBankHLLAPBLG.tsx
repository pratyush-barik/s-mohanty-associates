'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import * as XLSX from 'xlsx';
import {
  BankReportHeader,
  FloatingNavigator,
  NavItem,
  ReportActionBar,
  BasePhotographsSection,
  BaseDocumentsSection,
  BaseMapsSection,
  BaseAnnexureSection,
  BasePhotoBucketModal,
  getEarliestFieldVisit,
} from '../BaseBankReportComponents';
import {
  HDFCReportFields,
  HDFCAnnexureItem,
  getHDFCInitialFields,
} from './HDFCTypes';
import {
  HDFCGeneralSection,
  HDFCSurroundingsSection,
  HDFCPropertySection,
  HDFCSubjectPropertySection,
  HDFCStructuralDetailsSection,
  HDFCPlanApprovalsSection,
  HDFCValuationSection,
  HDFCAbstractSection,
  HDFCRemarksDeclarationSection,
} from './HDFCSections';
import { PDFHDFCBankRenderer } from '@/lib/banks/pdf-hdfc-bank-renderer';

const NAV_SECTIONS: NavItem[] = [
  { id: 'sec-general', title: '1. General Details' },
  { id: 'sec-surroundings', title: '2. Surrounding Locality Details' },
  { id: 'sec-property', title: '3. Property Details' },
  { id: 'sec-subject-property', title: '4. Subject Property & Boundaries' },
  { id: 'sec-structural', title: '5. Structural Details' },
  { id: 'sec-plan-approvals', title: '6. Plan Approvals' },
  { id: 'sec-valuation', title: '7. Land & Building Valuation' },
  { id: 'sec-abstract', title: '8. Abstract of Valuation' },
  { id: 'sec-remarks', title: '9. Remarks & Declaration' },
  { id: 'sec-documents', title: 'Enclosure 1: Documents' },
  { id: 'sec-maps', title: 'Enclosure 2: Maps' },
  { id: 'sec-photos', title: 'Enclosure 3: Photographs' },
  { id: 'sec-annexures', title: 'Enclosure 4: Annexures' },
];

export default function HDFCBankHLLAPBLG({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole = 'REPORT_EMPLOYEE',
  bucketImages = [],
  prefill,
  onResetWizard,
}: BankReportBuilderProps) {
  const router = useRouter();

  const [fields, setFields] = useState<HDFCReportFields>(() =>
    getHDFCInitialFields(initialFields, prefill, bucketImages, projectCode)
  );

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [uploading, setUploading] = useState<string | boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');

  const earliestVisit = useMemo(
    () => getEarliestFieldVisit(bucketImages, prefill),
    [bucketImages, prefill]
  );

  const handleChange = useCallback((key: keyof HDFCReportFields, value: any) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  }, []);

  // ── Document Handlers ──────────────────────────────────────────────────────
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading('documents');
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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
      setFields((prev) => ({
        ...prev,
        documentImages: [...(prev.documentImages || []), ...urls],
        documentImageNames: [
          ...(prev.documentImageNames || []),
          ...urls.map((_, i) => `Document ${(prev.documentImages?.length || 0) + i + 1}`),
        ],
      }));
    } catch (err: any) {
      alert(`Error uploading documents: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentRemove = (idx: number) => {
    setFields((prev) => ({
      ...prev,
      documentImages: (prev.documentImages || []).filter((_, i) => i !== idx),
      documentImageNames: (prev.documentImageNames || []).filter((_, i) => i !== idx),
    }));
  };

  const handleDocumentRename = (idx: number, name: string) => {
    const arr = [...(fields.documentImageNames || [])];
    while (arr.length <= idx) arr.push('');
    arr[idx] = name;
    setFields((prev) => ({ ...prev, documentImageNames: arr }));
  };

  const handleDocumentReorder = (newImages: string[], newNames: string[]) => {
    setFields((prev) => ({ ...prev, documentImages: newImages, documentImageNames: newNames }));
  };

  // ── Map Handlers ───────────────────────────────────────────────────────────
  const handleMapUpload = async (
    fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(fieldKey);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `map_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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
      setFields((prev) => ({
        ...prev,
        [fieldKey]: [...((prev[fieldKey] as string[]) || []), ...urls],
      }));
    } catch (err: any) {
      alert(`Error uploading map: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMapRemove = (
    fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages',
    idx?: number
  ) => {
    const targetIdx = idx ?? 0;
    setFields((prev) => ({
      ...prev,
      [fieldKey]: ((prev[fieldKey] as string[]) || []).filter((_, i) => i !== targetIdx),
    }));
  };

  const handleMapReorder = (
    fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages',
    newImgs: string[]
  ) => {
    setFields((prev) => ({ ...prev, [fieldKey]: newImgs }));
  };

  // ── Photograph Handlers ────────────────────────────────────────────────────
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading('photos');
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
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
      setFields((prev) => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...urls],
        propertyImageNames: [
          ...(prev.propertyImageNames || []),
          ...urls.map((_, i) => `Photograph ${(prev.propertyImages?.length || 0) + i + 1}`),
        ],
      }));
    } catch (err: any) {
      alert(`Error uploading photos: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoRemove = (idx: number) => {
    setFields((prev) => ({
      ...prev,
      propertyImages: (prev.propertyImages || []).filter((_, i) => i !== idx),
      propertyImageNames: (prev.propertyImageNames || []).filter((_, i) => i !== idx),
    }));
  };

  const handlePhotoRename = (idx: number, name: string) => {
    const arr = [...(fields.propertyImageNames || [])];
    while (arr.length <= idx) arr.push('');
    arr[idx] = name;
    setFields((prev) => ({ ...prev, propertyImageNames: arr }));
  };

  const handlePhotoReorder = (newImages: string[], newNames: string[]) => {
    setFields((prev) => ({ ...prev, propertyImages: newImages, propertyImageNames: newNames }));
  };

  // ── Annexure Handlers ──────────────────────────────────────────────────────
  const handleAddAnnexure = () => {
    const current = fields.annexures || [];
    const nextLabel = String.fromCharCode(65 + current.length);
    const newAnn: HDFCAnnexureItem = {
      id: String(Date.now()),
      label: nextLabel,
      title: `Schedule ${nextLabel}`,
      excelFileUrl: '',
      excelFileName: '',
    };
    handleChange('annexures', [...current, newAnn]);
  };

  const handleRemoveAnnexure = (id: string) => {
    const updated = (fields.annexures || [])
      .filter((a) => a.id !== id)
      .map((a, i) => ({ ...a, label: String.fromCharCode(65 + i) }));
    handleChange('annexures', updated);
  };

  const handleUpdateAnnexureTitle = (id: string, title: string) => {
    const updated = (fields.annexures || []).map((a) => (a.id === id ? { ...a, title } : a));
    handleChange('annexures', updated);
  };

  const handleRemoveAnnexureFile = (id: string) => {
    const updated = (fields.annexures || []).map((a) =>
      a.id === id ? { ...a, excelFileUrl: '', excelFileName: '', parsedData: undefined } : a
    );
    handleChange('annexures', updated);
  };

  const handleUploadExcel = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'xlsx';
      const fileName = `annexure_${Date.now()}.${ext}`;
      const filePath = `${projectId}/${fileName}`;
      const { error: uploadError } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);

      // Parse spreadsheet for preview
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const ref = ws['!ref'];
      let parsedData: HDFCAnnexureItem['parsedData'] | undefined;
      if (ref) {
        const range = XLSX.utils.decode_range(ref);
        const rows: string[][] = [];
        for (let r = range.s.r; r <= range.e.r; r++) {
          const row: string[] = [];
          for (let c = range.s.c; c <= range.e.c; c++) {
            const cell = ws[XLSX.utils.encode_cell({ r, c })];
            row.push(cell ? String(XLSX.utils.format_cell(cell)) : '');
          }
          rows.push(row);
        }
        if (rows.length > 0) {
          parsedData = {
            headers: rows[0] || [],
            rows: rows.slice(1),
            allRows: rows,
          };
        }
      }

      const updated = (fields.annexures || []).map((a) =>
        a.id === id
          ? {
              ...a,
              excelFileUrl: urlData.publicUrl,
              excelFileName: file.name,
              parsedData,
            }
          : a
      );
      handleChange('annexures', updated);
    } catch (err: any) {
      alert(`Excel upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // ── Save / Export Handlers ─────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await saveReportDraft(projectId, fields);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err?.message || 'Failed to save draft');
      setTimeout(() => setSaveError(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const renderer = new PDFHDFCBankRenderer(fields, projectCode);
      const bytes = await renderer.render();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HDFC_Bank_HL_LAP_BLG_${projectCode || 'report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('PDF download error:', err);
      alert('Failed to generate PDF: ' + (err?.message || String(err)));
    }
  };

  const handlePreviewPDF = async () => {
    try {
      const renderer = new PDFHDFCBankRenderer(fields, projectCode);
      const bytes = await renderer.render();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      console.error('PDF preview error:', err);
      alert('Failed to preview PDF: ' + (err?.message || String(err)));
    }
  };

  return (
    <div className="space-y-6 pb-28 w-full max-w-7xl mx-auto px-4 sm:px-6">
      {/* Bank Report Header */}
      <BankReportHeader
        bankName="HDFC BANK"
        subclass="HL-LAP-BLG"
        formatName="Home Loan / LAP / Business Loan Group"
        title="HDFC Bank — HL-LAP-BLG Valuation Report"
        description="Standardized institutional technical and financial valuation format for HDFC Bank Home Loans and Loan Against Property."
        projectCode={projectCode}
        earliestVisit={earliestVisit}
        onResetWizard={onResetWizard}
      />

      <div className="flex gap-6">
        {/* Floating Sidebar Navigation */}
        <FloatingNavigator sections={NAV_SECTIONS} />

        {/* Main Valuation Form */}
        <div className="flex-1 space-y-6 min-w-0">
          <div id="sec-general">
            <HDFCGeneralSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
          </div>

          <div id="sec-surroundings">
            <HDFCSurroundingsSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
          </div>

          <div id="sec-property">
            <HDFCPropertySection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
          </div>

          <div id="sec-subject-property">
            <HDFCSubjectPropertySection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
          </div>

          <div id="sec-structural">
            <HDFCStructuralDetailsSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
          </div>

          <div id="sec-plan-approvals">
            <HDFCPlanApprovalsSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
          </div>

          <div id="sec-valuation">
            <HDFCValuationSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
          </div>

          <div id="sec-abstract">
            <HDFCAbstractSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
          </div>

          <div id="sec-remarks">
            <HDFCRemarksDeclarationSection fields={fields} handleChange={handleChange} isReadOnly={isReadOnly} />
          </div>

          {/* Universal Enclosures */}
          <div id="sec-documents">
            <BaseDocumentsSection
              title="Verified Document Copies"
              sectionNumber="Enclosure 1"
              sectionId="sec-documents"
              documentImages={fields.documentImages || []}
              documentImageNames={fields.documentImageNames || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              onUploadDocument={handleDocumentUpload}
              onRemoveDocument={handleDocumentRemove}
              onDocumentNameChange={handleDocumentRename}
              onReorderDocuments={handleDocumentReorder}
            />
          </div>

          <div id="sec-maps">
            <BaseMapsSection
              title="Maps &amp; Layout Plans"
              sectionNumber="Enclosure 2"
              sectionId="sec-maps"
              locationMapImages={fields.locationMapImages || []}
              mouzaMapImages={fields.mouzaMapImages || []}
              sketchMapImages={fields.sketchMapImages || []}
              cadastralMapImages={fields.cadastralMapImages || []}
              bdaMapImages={fields.bdaMapImages || []}
              latitude={fields.latitude}
              longitude={fields.longitude}
              propertyAddress={[fields.ownerAddress, fields.city, fields.state, fields.pincode].filter(Boolean).join(', ')}
              isReadOnly={isReadOnly}
              uploading={uploading}
              onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
              onLocationMapRemove={(idx) => handleMapRemove('locationMapImages', idx)}
              onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
              onMouzaMapRemove={(idx) => handleMapRemove('mouzaMapImages', idx)}
              onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
              onSketchMapRemove={(idx) => handleMapRemove('sketchMapImages', idx)}
              onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
              onCadastralMapRemove={(idx) => handleMapRemove('cadastralMapImages', idx)}
              onBdaMapUpload={(e) => handleMapUpload('bdaMapImages', e)}
              onBdaMapRemove={(idx) => handleMapRemove('bdaMapImages', idx)}
              onReorderLocationMap={(newImgs) => handleMapReorder('locationMapImages', newImgs)}
              onReorderMouzaMap={(newImgs) => handleMapReorder('mouzaMapImages', newImgs)}
            />
          </div>

          <div id="sec-photos">
            <BasePhotographsSection
              title="Photographs of Subject Property"
              sectionNumber="Enclosure 3"
              sectionId="sec-photos"
              propertyImages={fields.propertyImages || []}
              propertyImageNames={fields.propertyImageNames || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              bucketCount={bucketImages.length}
              onOpenBucketPicker={() => setIsPhotoModalOpen(true)}
              onUploadImages={handlePhotoUpload}
              onRemoveImage={handlePhotoRemove}
              onImageNameChange={handlePhotoRename}
              onReorderImages={handlePhotoReorder}
            />
          </div>

          <div id="sec-annexures">
            <BaseAnnexureSection
              title="Annexures &amp; Schedules"
              sectionNumber="Enclosure 4"
              sectionId="sec-annexures"
              annexures={fields.annexures || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              onAddAnnexure={handleAddAnnexure}
              onRemoveAnnexure={handleRemoveAnnexure}
              onUpdateTitle={handleUpdateAnnexureTitle}
              onUploadExcel={handleUploadExcel}
              onRemoveFile={handleRemoveAnnexureFile}
            />
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={isSaving ? 'saving' : saveSuccess ? 'saved' : saveError ? 'error' : 'idle'}
        message={
          saveSuccess
            ? { text: 'Report draft saved successfully', type: 'success' }
            : saveError
            ? { text: saveError, type: 'error' }
            : null
        }
        loading={isSaving}
        onSaveDraft={handleSaveDraft}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Photo Bucket Modal */}
      {isPhotoModalOpen && (
        <BasePhotoBucketModal
          isOpen={isPhotoModalOpen}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setIsPhotoModalOpen(false)}
          onConfirm={(selectedUrls: string[]) => {
            handleChange('propertyImages', [...(fields.propertyImages || []), ...selectedUrls]);
            handleChange('propertyImageNames', [
              ...(fields.propertyImageNames || []),
              ...selectedUrls.map((_, i) => `Photograph ${(fields.propertyImages?.length || 0) + i + 1}`),
            ]);
            setIsPhotoModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
