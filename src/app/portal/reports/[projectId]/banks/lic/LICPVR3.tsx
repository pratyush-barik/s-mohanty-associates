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
import { PDFLICPVR3Renderer } from '@/lib/banks/pdf-lic-pvr3-renderer';

export const LIC_PVR3_CONFIG: BankConfig = {
  bankId: 'LIC HOUSING FINANCE LTD',
  subTemplateId: 'PVR-3(LAP-RENNOVATION-BOTH L&B-FLAT)',
  displayName: 'LIC Housing Finance Ltd — PVR-3 (Completed Building / LAP)',
  defaultValues: {
    purpose: 'Valuation Report by Panel Valuer for Home Loan / LAP (PVR-3)',
  },
};

export interface LICPVR3Props extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function LICPVR3({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: LICPVR3Props) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  const navSections: NavItem[] = [
    { id: 'pvr3-header', title: '1. Header & Case' },
    { id: 'pvr3-property', title: '2. Property Details' },
    { id: 'pvr3-drawing', title: '3. Drawing & Approvals' },
    { id: 'pvr3-building', title: '4. Building Details' },
    { id: 'pvr3-valuation', title: '5. Valuation Details' },
    { id: 'pvr3-improvements', title: '6. Improvements & Progress' },
    { id: 'pvr3-remarks', title: '7. Remarks & Methodology' },
    { id: 'pvr3-docs', title: '8. Documents' },
    { id: 'pvr3-maps', title: '9. Maps' },
    { id: 'pvr3-photos', title: '10. Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const raw = rawInitialFields || {};
    return {
      // Top Meta
      fileNo: raw.fileNo || (prefill as any)?.loanAccountNo || (prefill as any)?.projectCode || '',
      nameOfValuer: raw.nameOfValuer || 'Er. Satyajit Mohanty',
      codeNo: raw.codeNo || 'BH-AOV0078',
      appointingAuthority: raw.appointingAuthority || 'LIC HFL(Cuttack)',
      dateOfValuation: raw.dateOfValuation || formatReportDate(new Date().toISOString()),
      reraNo: raw.reraNo || 'NA',
      areaOffice: raw.areaOffice || 'Bhubaneswar',

      // 1. Property Details
      applicantName: raw.applicantName || (prefill as any)?.applicantName || (prefill as any)?.contactName || '',
      documentPerused: raw.documentPerused || 'Copy of Sale Deed, ROR, Rent receipt & Approved Plan',
      surveyNumber: raw.surveyNumber || (prefill as any)?.property?.plotNo || '',
      blockVillage: raw.blockVillage || (prefill as any)?.property?.mouza || '',
      wardTaluk: raw.wardTaluk || (prefill as any)?.property?.tahasil || '',
      districtMunicipality: raw.districtMunicipality || (prefill as any)?.property?.district || '',
      locationSketchVerified: raw.locationSketchVerified || 'Yes',

      boundaryNorth: raw.boundaryNorth || (prefill as any)?.property?.boundaries?.north?.asPerDeed || (prefill as any)?.property?.northBoundary || '',
      boundarySouth: raw.boundarySouth || (prefill as any)?.property?.boundaries?.south?.asPerDeed || (prefill as any)?.property?.southBoundary || '',
      boundaryEast: raw.boundaryEast || (prefill as any)?.property?.boundaries?.east?.asPerDeed || (prefill as any)?.property?.eastBoundary || '',
      boundaryWest: raw.boundaryWest || (prefill as any)?.property?.boundaries?.west?.asPerDeed || (prefill as any)?.property?.westBoundary || '',

      plotAreaSqft: raw.plotAreaSqft || ((prefill as any)?.property?.plotArea ? String((prefill as any).property.plotArea) : ''),
      approvedBua: raw.approvedBua || '',
      measuredBua: raw.measuredBua || '',

      propertyType: raw.propertyType || 'Bungalow',
      occupantStatus: raw.occupantStatus || 'Self-Occupied',
      occupantName: raw.occupantName || 'Self',
      buildingUsage: raw.buildingUsage || 'Residential',
      landmark: raw.landmark || (prefill as any)?.property?.landmark || '',
      surroundingDevelopment: raw.surroundingDevelopment || 'Middle Class',
      basicAmenitiesAvailable: raw.basicAmenitiesAvailable || 'Yes',
      negativesToLocality: raw.negativesToLocality || 'No',
      favourableConsiderations: raw.favourableConsiderations || 'All civic amenities like school, hospital, market area are within 1-2Kms.',
      otherFinancierNotice: raw.otherFinancierNotice || 'Not Observed',

      // 2. Drawing
      approvedDrawingAvailable: raw.approvedDrawingAvailable || 'Yes.',
      approvalNoDate: raw.approvalNoDate || '',
      constructionAsPerPlan: raw.constructionAsPerPlan || 'Yes',
      deviationsDrawingActual: raw.deviationsDrawingActual || 'NA',
      deviationsNature: raw.deviationsNature || 'NA',

      // 3. Building Details
      marketability: raw.marketability || 'Good',
      ageOfBuilding: raw.ageOfBuilding || '',
      residualLife: raw.residualLife || '',
      fsiApproved: raw.fsiApproved || '',
      fsiActual: raw.fsiActual || '',
      specFoundation: raw.specFoundation || 'R.C.C. Framed Structure',
      specRoof: raw.specRoof || 'R.C.C',
      specFlooring: raw.specFlooring || 'Marble/Tile Flooring',
      qualityConstruction: raw.qualityConstruction || 'Good',
      safetySpecsComplied: raw.safetySpecsComplied || 'Yes',
      highTensionLines: raw.highTensionLines || 'No',

      // 4. Valuation Point 4
      landAreaSqft: raw.landAreaSqft || ((prefill as any)?.property?.plotArea ? String((prefill as any).property.plotArea) : '0'),
      landRateSft: raw.landRateSft || ((prefill as any)?.property?.marketRate ? String((prefill as any).property.marketRate) : '0'),
      landGuidelineRate: raw.landGuidelineRate || '0',

      bldgGfArea: raw.bldgGfArea || '0',
      bldgGfRate: raw.bldgGfRate || '0',
      bldgGfGuideRate: raw.bldgGfGuideRate || '0',

      bldgFfArea: raw.bldgFfArea || '0',
      bldgFfRate: raw.bldgFfRate || '0',
      bldgFfGuideRate: raw.bldgFfGuideRate || '0',

      extraAmenitiesValue: raw.extraAmenitiesValue || '0',
      extraAmenitiesGuideVal: raw.extraAmenitiesGuideVal || '0',
      marketValueSource: raw.marketValueSource || 'By analysis of rates of material, labour etc & from local market data of similar properties.',

      // 5 & 6 Improvements
      improvementDesc: raw.improvementDesc || 'NA',
      improvementAmountApplicant: raw.improvementAmountApplicant || '0',
      improvementEstimateReasonable: raw.improvementEstimateReasonable || 'NA',
      estimatedValueAfterImprovements: raw.estimatedValueAfterImprovements || 'NA',

      // 8. Remarks & Methodology
      technicalRemarks: raw.technicalRemarks || '',
      methodologyBackground: raw.methodologyBackground || '',
      methodologySources: raw.methodologySources || 'Recent transactions, Property Brokers, local market feedback.',
      methodologyProcedures: raw.methodologyProcedures || 'Land value arrived by comparing similar land parcels in that locality while building value arrived by cost incurred to construct a similar house as on date.',
      methodologyAdopted: raw.methodologyAdopted || 'Land & Building method of valuation adopted',
      methodologyFactors: raw.methodologyFactors || 'Location & accessibility to civic amenities etc.',

      // 9. Certificate
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

  // Dual-Rate Valuation Computations
  const valuationMath = useMemo(() => {
    const lArea = parseFloat(formData.landAreaSqft) || 0;
    const lRate = parseFloat(formData.landRateSft) || 0;
    const lGuideRate = parseFloat(formData.landGuidelineRate) || 0;
    const landMV = Math.round(lArea * lRate);
    const landGV = Math.round(lArea * lGuideRate);

    const gfA = parseFloat(formData.bldgGfArea) || 0;
    const gfR = parseFloat(formData.bldgGfRate) || 0;
    const gfGR = parseFloat(formData.bldgGfGuideRate) || 0;
    const gfMV = Math.round(gfA * gfR);
    const gfGV = Math.round(gfA * gfGR);

    const ffA = parseFloat(formData.bldgFfArea) || 0;
    const ffR = parseFloat(formData.bldgFfRate) || 0;
    const ffGR = parseFloat(formData.bldgFfGuideRate) || 0;
    const ffMV = Math.round(ffA * ffR);
    const ffGV = Math.round(ffA * ffGR);

    const amenMV = parseFloat(formData.extraAmenitiesValue) || 0;
    const amenGV = parseFloat(formData.extraAmenitiesGuideVal) || 0;

    const totalMV = landMV + gfMV + ffMV + amenMV;
    const totalGV = landGV + gfGV + ffGV + amenGV;

    return {
      landMV,
      landGV,
      gfMV,
      gfGV,
      ffMV,
      ffGV,
      totalMV,
      totalGV,
      wordsMV: rupeesInWords(totalMV),
      wordsGV: rupeesInWords(totalGV),
    };
  }, [
    formData.landAreaSqft,
    formData.landRateSft,
    formData.landGuidelineRate,
    formData.bldgGfArea,
    formData.bldgGfRate,
    formData.bldgGfGuideRate,
    formData.bldgFfArea,
    formData.bldgFfRate,
    formData.bldgFfGuideRate,
    formData.extraAmenitiesValue,
    formData.extraAmenitiesGuideVal,
  ]);

  // Upload Handlers
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
      console.error(err);
      setAutoSaveStatus('error');
      setMessage({ text: 'Error saving draft: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this PVR-3 report for verification?')) return;
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
      const renderer = new PDFLICPVR3Renderer({
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
      const renderer = new PDFLICPVR3Renderer({
        ...formData,
        projectCode,
        calculatedValuation: valuationMath,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LIC_PVR3_${projectCode || 'Report'}.pdf`;
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
      {/* Top Banner */}
      <ActiveConfigBanner
        bankName="LIC HOUSING FINANCE LTD"
        formatName="PVR-3 (Completed Building / LAP)"
        onResetWizard={onResetWizard}
        sticky={false}
      />

      <div className="flex flex-col xl:flex-row gap-6 items-start w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>🏠 LIC Housing Finance Ltd — PVR-3 (Completed Building / LAP)</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Valuation Report by Panel Valuer for Home Loan (Dual Market & Guideline calculation).
            </p>
          </div>
        </div>

        {/* 1. Header & Case */}
        <div id="pvr3-header" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">1. Header & Reference Details</h2>
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

        {/* 2. Property Details */}
        <div id="pvr3-property" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">2. Property Details (Points 1a - 1n)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Applicant Name">
              <input type="text" className={inputCls} value={formData.applicantName} onChange={(e) => handleChange('applicantName', e.target.value)} />
            </Field>
            <Field label="Document Perused">
              <input type="text" className={inputCls} value={formData.documentPerused} onChange={(e) => handleChange('documentPerused', e.target.value)} />
            </Field>
            <Field label="Survey Number">
              <input type="text" className={inputCls} value={formData.surveyNumber} onChange={(e) => handleChange('surveyNumber', e.target.value)} />
            </Field>
            <Field label="Block No./Village">
              <input type="text" className={inputCls} value={formData.blockVillage} onChange={(e) => handleChange('blockVillage', e.target.value)} />
            </Field>
            <Field label="Ward No./Taluk">
              <input type="text" className={inputCls} value={formData.wardTaluk} onChange={(e) => handleChange('wardTaluk', e.target.value)} />
            </Field>
            <Field label="District/Municipality/Pin">
              <input type="text" className={inputCls} value={formData.districtMunicipality} onChange={(e) => handleChange('districtMunicipality', e.target.value)} />
            </Field>

            <div className="md:col-span-2 pt-2">
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Boundaries</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="North / Front">
                  <input type="text" className={inputCls} value={formData.boundaryNorth} onChange={(e) => handleChange('boundaryNorth', e.target.value)} />
                </Field>
                <Field label="South / Rear">
                  <input type="text" className={inputCls} value={formData.boundarySouth} onChange={(e) => handleChange('boundarySouth', e.target.value)} />
                </Field>
                <Field label="East / Left">
                  <input type="text" className={inputCls} value={formData.boundaryEast} onChange={(e) => handleChange('boundaryEast', e.target.value)} />
                </Field>
                <Field label="West / Right">
                  <input type="text" className={inputCls} value={formData.boundaryWest} onChange={(e) => handleChange('boundaryWest', e.target.value)} />
                </Field>
              </div>
            </div>

            <Field label="Plot Area (sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.plotAreaSqft} onChange={(e) => handleChange('plotAreaSqft', e.target.value)} />
            </Field>
            <Field label="Approved BUA (sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.approvedBua} onChange={(e) => handleChange('approvedBua', e.target.value)} />
            </Field>
            <Field label="Measured BUA (sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.measuredBua} onChange={(e) => handleChange('measuredBua', e.target.value)} />
            </Field>
            <Field label="Type of Property">
              <input type="text" className={inputCls} value={formData.propertyType} onChange={(e) => handleChange('propertyType', e.target.value)} />
            </Field>
            <Field label="Occupant Status">
              <input type="text" className={inputCls} value={formData.occupantStatus} onChange={(e) => handleChange('occupantStatus', e.target.value)} />
            </Field>
            <Field label="Nearby Landmark">
              <input type="text" className={inputCls} value={formData.landmark} onChange={(e) => handleChange('landmark', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* 3. Drawing & Approvals */}
        <div id="pvr3-drawing" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">3. Drawing & Approvals (Section 2)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Approval No & Date">
              <input type="text" className={inputCls} value={formData.approvalNoDate} onChange={(e) => handleChange('approvalNoDate', e.target.value)} />
            </Field>
            <Field label="Construction as per approved plan?">
              <select className={selectCls} value={formData.constructionAsPerPlan} onChange={(e) => handleChange('constructionAsPerPlan', e.target.value)}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
          </div>
        </div>

        {/* 4. Building Details */}
        <div id="pvr3-building" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">4. Building Details (Section 3)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Age of Building (Years)">
              <input type="number" step="1" min="0" className={inputCls} value={formData.ageOfBuilding} onChange={(e) => handleChange('ageOfBuilding', e.target.value)} />
            </Field>
            <Field label="Residual Life Expected (Years)">
              <input type="number" step="1" min="0" className={inputCls} value={formData.residualLife} onChange={(e) => handleChange('residualLife', e.target.value)} />
            </Field>
            <Field label="FSI (Plan / Actual)">
              <div className="flex gap-2">
                <input type="text" className={inputCls} placeholder="Plan: 0.60" value={formData.fsiApproved} onChange={(e) => handleChange('fsiApproved', e.target.value)} />
                <input type="text" className={inputCls} placeholder="Act: 0.90" value={formData.fsiActual} onChange={(e) => handleChange('fsiActual', e.target.value)} />
              </div>
            </Field>
          </div>
        </div>

        {/* 5. Valuation Details */}
        <div id="pvr3-valuation" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-200">5. Valuation Details (Section 4 - Dual Rate Engine)</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono">
              Auto-Calculated
            </span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Description</th>
                  <th className="p-2.5">Area (sqft)</th>
                  <th className="p-2.5">Market Rate (₹)</th>
                  <th className="p-2.5">Market Value (₹)</th>
                  <th className="p-2.5">Guideline Rate (₹)</th>
                  <th className="p-2.5">Guideline Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                <tr>
                  <td className="p-2.5 font-medium">Land</td>
                  <td className="p-2"><input type="number" step="0.01" min="0" className={inputCls} value={formData.landAreaSqft} onChange={(e) => handleChange('landAreaSqft', e.target.value)} /></td>
                  <td className="p-2"><input type="number" step="0.01" min="0" className={inputCls} value={formData.landRateSft} onChange={(e) => handleChange('landRateSft', e.target.value)} /></td>
                  <td className="p-2.5 font-bold text-white">₹{formatIndianCurrency(valuationMath.landMV)}</td>
                  <td className="p-2"><input type="number" step="0.01" min="0" className={inputCls} value={formData.landGuidelineRate} onChange={(e) => handleChange('landGuidelineRate', e.target.value)} /></td>
                  <td className="p-2.5 font-bold text-slate-300">₹{formatIndianCurrency(valuationMath.landGV)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Building GF</td>
                  <td className="p-2"><input type="number" step="0.01" min="0" className={inputCls} value={formData.bldgGfArea} onChange={(e) => handleChange('bldgGfArea', e.target.value)} /></td>
                  <td className="p-2"><input type="number" step="0.01" min="0" className={inputCls} value={formData.bldgGfRate} onChange={(e) => handleChange('bldgGfRate', e.target.value)} /></td>
                  <td className="p-2.5 font-bold text-white">₹{formatIndianCurrency(valuationMath.gfMV)}</td>
                  <td className="p-2"><input type="number" step="0.01" min="0" className={inputCls} value={formData.bldgGfGuideRate} onChange={(e) => handleChange('bldgGfGuideRate', e.target.value)} /></td>
                  <td className="p-2.5 font-bold text-slate-300">₹{formatIndianCurrency(valuationMath.gfGV)}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Building FF</td>
                  <td className="p-2"><input type="number" step="0.01" min="0" className={inputCls} value={formData.bldgFfArea} onChange={(e) => handleChange('bldgFfArea', e.target.value)} /></td>
                  <td className="p-2"><input type="number" step="0.01" min="0" className={inputCls} value={formData.bldgFfRate} onChange={(e) => handleChange('bldgFfRate', e.target.value)} /></td>
                  <td className="p-2.5 font-bold text-white">₹{formatIndianCurrency(valuationMath.ffMV)}</td>
                  <td className="p-2"><input type="number" step="0.01" min="0" className={inputCls} value={formData.bldgFfGuideRate} onChange={(e) => handleChange('bldgFfGuideRate', e.target.value)} /></td>
                  <td className="p-2.5 font-bold text-slate-300">₹{formatIndianCurrency(valuationMath.ffGV)}</td>
                </tr>
                <tr className="bg-slate-800/60 font-bold">
                  <td className="p-2.5 uppercase" colSpan={3}>Total Property Value:</td>
                  <td className="p-2.5 text-base text-emerald-400">₹{formatIndianCurrency(valuationMath.totalMV)}/-</td>
                  <td className="p-2.5"></td>
                  <td className="p-2.5 text-base text-slate-200">₹{formatIndianCurrency(valuationMath.totalGV)}/-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. Improvements & Remarks */}
        <div id="pvr3-remarks" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">6. Technical Remarks & Mandatory Methodology</h2>
          </div>
          <Field label="Valuer's Observations & Remarks">
            <textarea rows={3} className={inputCls} value={formData.technicalRemarks} onChange={(e) => handleChange('technicalRemarks', e.target.value)} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Field label="Background Info">
              <input type="text" className={inputCls} value={formData.methodologyBackground} onChange={(e) => handleChange('methodologyBackground', e.target.value)} />
            </Field>
            <Field label="Valuation Methodology Adopted">
              <input type="text" className={inputCls} value={formData.methodologyAdopted} onChange={(e) => handleChange('methodologyAdopted', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Attachments */}
        <div id="pvr3-docs">
          <BaseDocumentsSection
            title="Verified Property Documents"
            sectionId="pvr3-docs"
            sectionNumber={8}
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

        <div id="pvr3-maps">
          <BaseMapsSection
            title="Location Sketch & Route Maps"
            sectionId="pvr3-maps"
            sectionNumber={9}
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

        <div id="pvr3-photos">
          <BasePhotographsSection
            title="Property Photographs"
            sectionId="pvr3-photos"
            sectionNumber={10}
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
