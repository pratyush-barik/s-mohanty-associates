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
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFLICPVR4Renderer } from '@/lib/banks/pdf-lic-pvr4-renderer';

export const LIC_PVR4_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-4(LAND PURCHASE ONLY)',
  displayName: 'LIC Housing Finance Ltd — PVR-4 (Residential Plot Purchase)',
  defaultValues: {
    purpose: 'Valuation Report by Panel Valuer for Home Loan (Purchase of Residential Plot)',
  },
};

export interface LICPVR4Props extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function LICPVR4({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
}: LICPVR4Props) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  const navSections: NavItem[] = [
    { id: 'pvr4-header', title: '1. Header & Case' },
    { id: 'pvr4-general', title: '2. General Details' },
    { id: 'pvr4-inspection', title: '3. Inspection & Boundaries' },
    { id: 'pvr4-attributes', title: '4. Plot Attributes' },
    { id: 'pvr4-valuation', title: '5. Land Valuation' },
    { id: 'pvr4-remarks', title: '6. Remarks & Methodology' },
    { id: 'pvr4-docs', title: '7. Documents' },
    { id: 'pvr4-maps', title: '8. Maps' },
    { id: 'pvr4-photos', title: '9. Photographs' },
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
      appointingAuthority: raw.appointingAuthority || 'LIC HFL(BR-I)',
      dateOfValuation: raw.dateOfValuation || formatReportDate(new Date().toISOString()),
      reraNo: raw.reraNo || 'NA',
      areaOffice: raw.areaOffice || 'Bhubaneswar',

      // A. General
      applicationNo: raw.applicationNo || (prefill as any)?.loanAccountNo || (prefill as any)?.projectCode || '',
      customerName: raw.customerName || (prefill as any)?.applicantName || (prefill as any)?.contactName || '',
      plotNo: raw.plotNo || (prefill as any)?.property?.plotNo || '',
      villageTaluk: raw.villageTaluk || (prefill as any)?.property?.mouza || '',
      districtMunicipality: raw.districtMunicipality || (prefill as any)?.property?.district || '',
      landmark: raw.landmark || (prefill as any)?.property?.landmark || '',

      // B. Inspection & Boundaries
      boundaryNorth: raw.boundaryNorth || (prefill as any)?.property?.boundaries?.north?.asPerDeed || (prefill as any)?.property?.northBoundary || '',
      boundarySouth: raw.boundarySouth || (prefill as any)?.property?.boundaries?.south?.asPerDeed || (prefill as any)?.property?.southBoundary || '',
      boundaryEast: raw.boundaryEast || (prefill as any)?.property?.boundaries?.east?.asPerDeed || (prefill as any)?.property?.eastBoundary || '',
      boundaryWest: raw.boundaryWest || (prefill as any)?.property?.boundaries?.west?.asPerDeed || (prefill as any)?.property?.westBoundary || '',

      locationSketchVerified: raw.locationSketchVerified || 'Yes',
      surveyVillageTaluk: raw.surveyVillageTaluk || '',
      characterOfLocality: raw.characterOfLocality || 'Residential',
      layoutApprovalAuthority: raw.layoutApprovalAuthority || '',
      layoutApprovalNo: raw.layoutApprovalNo || '',

      surroundingDevelopment: raw.surroundingDevelopment || 'Middle',
      basicAmenitiesAvailable: raw.basicAmenitiesAvailable || 'Yes',
      levelRelativeToRoad: raw.levelRelativeToRoad || 'Road level is equal to plot level',
      shapeOfPlot: raw.shapeOfPlot || 'Regular',
      plotDemarcated: raw.plotDemarcated || 'Yes',
      otherFinancierNotice: raw.otherFinancierNotice || 'No',
      widthOnRoadFacing: raw.widthOnRoadFacing || '',
      isCornerPlot: raw.isCornerPlot || 'No',
      negativesToLocality: raw.negativesToLocality || 'No',
      favourableConsiderations: raw.favourableConsiderations || 'All civic amenities like school, hospital, market area are within 1-2Kms.',
      marketability: raw.marketability || 'Good',
      clearAccess: raw.clearAccess || 'Yes',
      highTensionLines: raw.highTensionLines || 'No',
      plotAreaSqft: raw.plotAreaSqft || ((prefill as any)?.property?.plotArea ? String((prefill as any).property.plotArea) : '0'),

      // Valuation
      unitRateMV: raw.unitRateMV || ((prefill as any)?.property?.marketRate ? String((prefill as any).property.marketRate) : '0'),
      unitRateGV: raw.unitRateGV || '0',
      acceptableMortgageValue: raw.acceptableMortgageValue || 'NA',
      marketValueSource: raw.marketValueSource || 'By analysis of rates of material, labour etc & from local market data of similar properties.',
      otherRemarks: raw.otherRemarks || '',

      // Methodology
      methodologyBackground: raw.methodologyBackground || '',
      methodologySources: raw.methodologySources || 'Recent transactions, Property Brokers, local market feedback.',
      methodologyProcedures: raw.methodologyProcedures || 'Land value arrived by comparing similar land parcels in that locality.',
      methodologyAdopted: raw.methodologyAdopted || 'Sales comparison method of valuation adopted.',
      methodologyFactors: raw.methodologyFactors || 'Location & accessibility to civic amenities etc.',

      // Certificate
      inspectionDate: raw.inspectionDate || earliestVisit?.date || '',
      valuationStation: raw.valuationStation || 'Bhubaneswar',

      // Attachments
      documentImages: raw.documentImages || [],
      documentImageNames: raw.documentImageNames || [],
      locationMapImages: raw.locationMapImages || [],
      mouzaMapImages: raw.mouzaMapImages || [],
      sketchMapImages: raw.sketchMapImages || [],
      cadastralMapImages: raw.cadastralMapImages || [],
      bdaMapImages: raw.bdaMapImages || [],
      propertyImages: raw.propertyImages || [],
      propertyImageNames: raw.propertyImageNames || [],
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
    const area = parseFloat(formData.plotAreaSqft) || 0;
    const rateMV = parseFloat(formData.unitRateMV) || 0;
    const rateGV = parseFloat(formData.unitRateGV) || 0;
    const marketVal = Math.round(area * rateMV);
    const guideVal = Math.round(area * rateGV);

    return {
      area,
      rateMV,
      rateGV,
      marketVal,
      guideVal,
      wordsMV: rupeesInWords(marketVal),
      wordsGV: rupeesInWords(guideVal),
    };
  }, [formData.plotAreaSqft, formData.unitRateMV, formData.unitRateGV]);

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
    if (!confirm('Are you sure you want to submit this PVR-4 plot report?')) return;
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
      const renderer = new PDFLICPVR4Renderer({
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
      const renderer = new PDFLICPVR4Renderer({
        ...formData,
        projectCode,
        calculatedValuation: valuationMath,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LIC_PVR4_${projectCode || 'Report'}.pdf`;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <FloatingNavigator sections={navSections} />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>📐 LIC Housing Finance Ltd — PVR-4 (Residential Plot Purchase)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Purchase of Residential Plot Valuation Report (Dual Market & Guideline calculation).
            </p>
          </div>
        </div>

        {/* 1. Header & Case */}
        <div id="pvr4-header" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">1. Header & Case Reference</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="File No">
              <input type="text" className={inputCls} value={formData.fileNo} onChange={(e) => handleChange('fileNo', e.target.value)} />
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
            <Field label="Appointing Authority">
              <input type="text" className={inputCls} value={formData.appointingAuthority} onChange={(e) => handleChange('appointingAuthority', e.target.value)} />
            </Field>
            <Field label="Area Office">
              <input type="text" className={inputCls} value={formData.areaOffice} onChange={(e) => handleChange('areaOffice', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* 2. General Details */}
        <div id="pvr4-general" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">2. General Details (A. GENERAL)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Customer Name">
              <input type="text" className={inputCls} value={formData.customerName} onChange={(e) => handleChange('customerName', e.target.value)} />
            </Field>
            <Field label="Plot No.">
              <input type="text" className={inputCls} value={formData.plotNo} onChange={(e) => handleChange('plotNo', e.target.value)} />
            </Field>
            <Field label="Village/Block/Taluk">
              <input type="text" className={inputCls} value={formData.villageTaluk} onChange={(e) => handleChange('villageTaluk', e.target.value)} />
            </Field>
            <Field label="District/Municipality/Pin">
              <input type="text" className={inputCls} value={formData.districtMunicipality} onChange={(e) => handleChange('districtMunicipality', e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Nearby Landmark">
                <input type="text" className={inputCls} value={formData.landmark} onChange={(e) => handleChange('landmark', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {/* 3. Inspection & Boundaries */}
        <div id="pvr4-inspection" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">3. Inspection & Boundaries (B. INSPECTION)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="North / Front">
              <input type="text" className={inputCls} value={formData.boundaryNorth} onChange={(e) => handleChange('boundaryNorth', e.target.value)} />
            </Field>
            <Field label="East / Left (Side 1)">
              <input type="text" className={inputCls} value={formData.boundaryEast} onChange={(e) => handleChange('boundaryEast', e.target.value)} />
            </Field>
            <Field label="South / Rear">
              <input type="text" className={inputCls} value={formData.boundarySouth} onChange={(e) => handleChange('boundarySouth', e.target.value)} />
            </Field>
            <Field label="West / Right (Side 2)">
              <input type="text" className={inputCls} value={formData.boundaryWest} onChange={(e) => handleChange('boundaryWest', e.target.value)} />
            </Field>

            <Field label="Character of Locality">
              <input type="text" className={inputCls} value={formData.characterOfLocality} onChange={(e) => handleChange('characterOfLocality', e.target.value)} />
            </Field>
            <Field label="Layout Approval Authority">
              <input type="text" className={inputCls} value={formData.layoutApprovalAuthority} onChange={(e) => handleChange('layoutApprovalAuthority', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* 4. Plot Attributes */}
        <div id="pvr4-attributes" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">4. Plot Attributes (Items 5 - 18)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Level relative to road">
              <input type="text" className={inputCls} value={formData.levelRelativeToRoad} onChange={(e) => handleChange('levelRelativeToRoad', e.target.value)} />
            </Field>
            <Field label="Shape of Plot">
              <input type="text" className={inputCls} value={formData.shapeOfPlot} onChange={(e) => handleChange('shapeOfPlot', e.target.value)} />
            </Field>
            <Field label="Plot Demarcated with Boundaries?">
              <select className={selectCls} value={formData.plotDemarcated} onChange={(e) => handleChange('plotDemarcated', e.target.value)}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Width on road facing side">
              <input type="text" className={inputCls} value={formData.widthOnRoadFacing} onChange={(e) => handleChange('widthOnRoadFacing', e.target.value)} />
            </Field>
            <Field label="Is it a corner plot?">
              <input type="text" className={inputCls} value={formData.isCornerPlot} onChange={(e) => handleChange('isCornerPlot', e.target.value)} />
            </Field>
            <Field label="Plot Area (sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.plotAreaSqft} onChange={(e) => handleChange('plotAreaSqft', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* 5. Land Valuation */}
        <div id="pvr4-valuation" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-200">5. Land Valuation (Point 19)</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono">
              Auto-Calculated
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Unit Rate (Market Value ₹/sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.unitRateMV} onChange={(e) => handleChange('unitRateMV', e.target.value)} />
            </Field>
            <Field label="Guideline Rate (₹/sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.unitRateGV} onChange={(e) => handleChange('unitRateGV', e.target.value)} />
            </Field>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400">Total Market Value:</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">₹{formatIndianCurrency(valuationMath.marketVal)}/-</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{valuationMath.wordsMV}</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400">Total Guideline Value:</span>
              <p className="text-xl font-bold text-slate-200 mt-1">₹{formatIndianCurrency(valuationMath.guideVal)}/-</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{valuationMath.wordsGV}</p>
            </div>
          </div>
        </div>

        {/* 6. Remarks & Methodology */}
        <div id="pvr4-remarks" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">6. Remarks & Methodology</h2>
          </div>
          <Field label="Other Remarks">
            <textarea rows={2} className={inputCls} value={formData.otherRemarks} onChange={(e) => handleChange('otherRemarks', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Field label="Methodology Adopted">
              <input type="text" className={inputCls} value={formData.methodologyAdopted} onChange={(e) => handleChange('methodologyAdopted', e.target.value)} />
            </Field>
            <Field label="Background Info">
              <input type="text" className={inputCls} value={formData.methodologyBackground} onChange={(e) => handleChange('methodologyBackground', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Attachments */}
        <div id="pvr4-docs">
          <BaseDocumentsSection
            title="Verified Property Documents"
            sectionId="pvr4-docs"
            sectionNumber={7}
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

        <div id="pvr4-maps">
          <BaseMapsSection
            title="Location Sketch & Route Maps"
            sectionId="pvr4-maps"
            sectionNumber={8}
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

        <div id="pvr4-photos">
          <BasePhotographsSection
            title="Property Photographs"
            sectionId="pvr4-photos"
            sectionNumber={9}
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
