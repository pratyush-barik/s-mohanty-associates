'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  getEarliestFieldVisit,
  BankReportTitleCard,
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
  ActiveConfigBanner,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFLTFinancialServicesRenderer } from '@/lib/banks/pdf-lt-financial-services-renderer';

export const LT_FINANCIAL_CONFIG: BankConfig = {
  bankId: 'L&T FINANCIAL SERVICES',
  subTemplateId: 'LAP - TOPUP',
  displayName: 'L&T Financial Services (LAP - TOPUP)',
  defaultValues: {
    purpose: 'Valuation Report for LAP - TOPUP (L&T Finance Services)',
  },
};

export interface LTFinancialProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function LTFinancialServices({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: LTFinancialProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  const navSections: NavItem[] = [
    { id: 'lt-sec-1', title: 'I. Header & Customer' },
    { id: 'lt-sec-2', title: 'II. Property & Boundaries' },
    { id: 'lt-sec-3', title: 'III. Documents Received' },
    { id: 'lt-sec-4', title: 'IV. Location' },
    { id: 'lt-sec-5', title: 'V. Property & Configuration' },
    { id: 'lt-sec-6', title: 'VI. Due Diligence' },
    { id: 'lt-sec-7', title: 'VII. Valuation Engine' },
    { id: 'lt-sec-8', title: 'VIII. Progress & Remarks' },
    { id: 'lt-sec-9', title: 'IX. Requirement Details' },
    { id: 'lt-sec-docs', title: 'Documents' },
    { id: 'lt-sec-maps', title: 'Maps' },
    { id: 'lt-sec-photos', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const raw = rawInitialFields || {};
    return {
      // Section I
      customerName: raw.customerName || (prefill as any)?.applicantName || (prefill as any)?.contactName || '',
      lanNo: raw.lanNo || (prefill as any)?.loanAccountNo || (prefill as any)?.projectCode || '',
      productType: raw.productType || 'LAP - TOPUP',
      initiatedBy: raw.initiatedBy || 'L&T Finance',

      // Section II
      propertyShortAddress: raw.propertyShortAddress || (prefill as any)?.property?.propertyAddress || '',
      legalAddress: raw.legalAddress || (prefill as any)?.property?.propertyAddress || '',
      city: raw.city || (prefill as any)?.property?.city || 'Bhubaneswar',
      state: raw.state || (prefill as any)?.property?.state || 'Odisha',
      pincode: raw.pincode || (prefill as any)?.property?.pincode || '',
      landmark: raw.landmark || (prefill as any)?.property?.landmark || '',
      projectName: raw.projectName || 'NA',

      boundaryNorthDoc: raw.boundaryNorthDoc || (prefill as any)?.property?.boundaries?.north?.asPerDeed || (prefill as any)?.property?.northBoundary || '',
      boundaryNorthSite: raw.boundaryNorthSite || (prefill as any)?.property?.boundaries?.north?.asPerSite || (prefill as any)?.property?.northBoundary || '',
      boundarySouthDoc: raw.boundarySouthDoc || (prefill as any)?.property?.boundaries?.south?.asPerDeed || (prefill as any)?.property?.southBoundary || '',
      boundarySouthSite: raw.boundarySouthSite || (prefill as any)?.property?.boundaries?.south?.asPerSite || (prefill as any)?.property?.southBoundary || '',
      boundaryEastDoc: raw.boundaryEastDoc || (prefill as any)?.property?.boundaries?.east?.asPerDeed || (prefill as any)?.property?.eastBoundary || '',
      boundaryEastSite: raw.boundaryEastSite || (prefill as any)?.property?.boundaries?.east?.asPerSite || (prefill as any)?.property?.eastBoundary || '',
      boundaryWestDoc: raw.boundaryWestDoc || (prefill as any)?.property?.boundaries?.west?.asPerDeed || (prefill as any)?.property?.westBoundary || '',
      boundaryWestSite: raw.boundaryWestSite || (prefill as any)?.property?.boundaries?.west?.asPerSite || (prefill as any)?.property?.westBoundary || '',
      boundariesMatching: raw.boundariesMatching || 'Boundary is matching as per documents',

      // Section III
      docDeedAuth: raw.docDeedAuth || 'Registering officer',
      docDeedDate: raw.docDeedDate || '',
      docDeedRef: raw.docDeedRef || '',
      docPlanAuth: raw.docPlanAuth || '',
      docPlanDate: raw.docPlanDate || '',
      docPlanRef: raw.docPlanRef || '',
      docOccAuth: raw.docOccAuth || 'NA',
      docOccDate: raw.docOccDate || 'NA',
      docOccRef: raw.docOccRef || 'NA',
      ownershipAsPerDoc: raw.ownershipAsPerDoc || (prefill as any)?.ownerName || (prefill as any)?.applicantName || '',

      // Section IV
      natureOfLocality: raw.natureOfLocality || 'Developed',
      vicinity: raw.vicinity || 'Mixed',
      classOfLocality: raw.classOfLocality || 'Middle class',
      qualityInfrastructure: raw.qualityInfrastructure || 'Good',
      publicTransport: raw.publicTransport || 'Good',
      proximityCivicAmenities: raw.proximityCivicAmenities || 'Good',

      // Section V
      approvedUse: raw.approvedUse || 'Residential',
      propertyType: raw.propertyType || 'Row House',
      structureType: raw.structureType || 'RCC',
      noOfFloors: raw.noOfFloors || '',
      propertyHolding: raw.propertyHolding || 'Freehold',
      residualAge: raw.residualAge || '',
      propertyAge: raw.propertyAge || '',
      floorNo: raw.floorNo || '',
      buildingStructure: raw.buildingStructure || 'RCC',
      noOfLifts: raw.noOfLifts || 'NA',
      noOfWings: raw.noOfWings || 'NA',
      externalAppearance: raw.externalAppearance || 'Good',
      maintenance: raw.maintenance || 'Good',

      cfgGfBed: raw.cfgGfBed || '',
      cfgGfKit: raw.cfgGfKit || '',
      cfgGfHall: raw.cfgGfHall || '',
      cfgGfBath: raw.cfgGfBath || '',
      cfgGfRem: raw.cfgGfRem || '',

      cfgFfBed: raw.cfgFfBed || '',
      cfgFfKit: raw.cfgFfKit || '',
      cfgFfHall: raw.cfgFfHall || '',
      cfgFfBath: raw.cfgFfBath || '',
      cfgFfRem: raw.cfgFfRem || '',

      cfgSfBed: raw.cfgSfBed || '',
      cfgSfKit: raw.cfgSfKit || '',
      cfgSfHall: raw.cfgSfHall || '',
      cfgSfBath: raw.cfgSfBath || '',
      cfgSfRem: raw.cfgSfRem || '',

      // Section VI
      fprName: raw.fprName || '',
      fprRelation: raw.fprRelation || '',
      fprContact: raw.fprContact || '',
      fprKyc: raw.fprKyc || 'Aadhar',
      societyBoardVerified: raw.societyBoardVerified || 'NA',
      ownerNameMatching: raw.ownerNameMatching || 'NA',
      discrepancies: raw.discrepancies || 'No',
      occupancyStatus: raw.occupancyStatus || 'Occupied',
      occupiedBy: raw.occupiedBy || 'Self occupied',
      residingSince: raw.residingSince || '',

      // Section VII
      plotAreaSqft: raw.plotAreaSqft || ((prefill as any)?.property?.plotArea ? String((prefill as any).property.plotArea) : '0'),
      plotRateSft: raw.plotRateSft || ((prefill as any)?.property?.marketRate ? String((prefill as any).property.marketRate) : '0'),
      carpetAreaSqft: raw.carpetAreaSqft || '0',
      measuredBuaDesc: raw.measuredBuaDesc || '',
      measuredBuaSqft: raw.measuredBuaSqft || '0',
      planBuaDesc: raw.planBuaDesc || '',
      planBuaSqft: raw.planBuaSqft || '0',
      bldgRateSft: raw.bldgRateSft || '0',
      amenitiesValue: raw.amenitiesValue || '0',
      distressRatioPct: raw.distressRatioPct || '80',

      // Section VIII & IX
      stageProperty: raw.stageProperty || '100%',
      progressProperty: raw.progressProperty || '100%',
      recoProperty: raw.recoProperty || '100%',
      deviations: raw.deviations || 'NA',
      remarks: raw.remarks || '',

      // Section X & XI
      latitude: raw.latitude || ((prefill as any)?.property?.latitude ? String((prefill as any).property.latitude) : ''),
      longitude: raw.longitude || ((prefill as any)?.property?.longitude ? String((prefill as any).property.longitude) : ''),
      dateOfVisit: raw.dateOfVisit || earliestVisit?.date || '',
      visitedBy: raw.visitedBy || 'Er. Satyajit Mohanty',
      dateOfReport: raw.dateOfReport || formatReportDate(new Date().toISOString()),
      approvedBy: raw.approvedBy || 'NA',

      // Requirements
      reqSetbacks: raw.reqSetbacks || '',
      reqSetbackDeviation: raw.reqSetbackDeviation || 'NIL / Minor within permissible limits',
      reqFloorBua: raw.reqFloorBua || '',
      reqExtraCoverage: raw.reqExtraCoverage || '',
      reqAddressCheck: raw.reqAddressCheck || 'Matching with physical boundaries at site',
      reqBoundariesMismatch: raw.reqBoundariesMismatch || 'No (Mismatch: NA)',

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
    const pArea = parseFloat(formData.plotAreaSqft) || 0;
    const pRate = parseFloat(formData.plotRateSft) || 0;
    const plotVal = Math.round(pArea * pRate);

    const bArea = parseFloat(formData.planBuaSqft) || 0;
    const bRate = parseFloat(formData.bldgRateSft) || 0;
    const bldgVal = Math.round(bArea * bRate);

    const amenVal = parseFloat(formData.amenitiesValue) || 0;
    const grandTotal = plotVal + bldgVal + amenVal;

    const distressRatio = (parseFloat(formData.distressRatioPct) || 80) / 100;
    const distressVal = Math.round(grandTotal * distressRatio);

    return {
      pArea,
      pRate,
      plotVal,
      bArea,
      bRate,
      bldgVal,
      amenVal,
      grandTotal,
      distressVal,
      wordsGrand: rupeesInWords(grandTotal),
      wordsDistress: rupeesInWords(distressVal),
    };
  }, [formData.plotAreaSqft, formData.plotRateSft, formData.planBuaSqft, formData.bldgRateSft, formData.amenitiesValue, formData.distressRatioPct]);

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
    if (!confirm('Are you sure you want to submit this L&T Finance report?')) return;
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
      const renderer = new PDFLTFinancialServicesRenderer({
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
      const renderer = new PDFLTFinancialServicesRenderer({
        ...formData,
        projectCode,
        calculatedValuation: valuationMath,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LT_Finance_${projectCode || 'Report'}.pdf`;
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
        bankName="L&T FINANCIAL SERVICES"
        formatName="LAP - TOPUP"
        onResetWizard={onResetWizard}
        sticky={false}
      />

      <div className="flex flex-col xl:flex-row gap-6 items-start w-full px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex-1 min-w-0 space-y-6 w-full">
          <BankReportTitleCard
        bankName="L&T Financial Services"
        subclass="LAP / TOPUP Format"
        title="Valuation Report Builder"
        description="Standard 11-Section L&T Format with Configuration Matrix & Requirement Checklist."
        earliestVisit={getEarliestFieldVisit(bucketImages, prefill)}
        projectCode={projectCode}
      />

        {/* Section I */}
        <div id="lt-sec-1" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">I. Header & Customer Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Customer Name">
              <input type="text" className={inputCls} value={formData.customerName} onChange={(e) => handleChange('customerName', e.target.value)} />
            </Field>
            <Field label="LAN No.">
              <input type="text" className={inputCls} value={formData.lanNo} onChange={(e) => handleChange('lanNo', e.target.value)} />
            </Field>
            <Field label="Product">
              <input type="text" className={inputCls} value={formData.productType} onChange={(e) => handleChange('productType', e.target.value)} />
            </Field>
            <Field label="Initiated by">
              <input type="text" className={inputCls} value={formData.initiatedBy} onChange={(e) => handleChange('initiatedBy', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Section II */}
        <div id="lt-sec-2" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">II. Property & Legal Address</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Property Banner Address">
                <input type="text" className={inputCls} value={formData.propertyShortAddress} onChange={(e) => handleChange('propertyShortAddress', e.target.value)} />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Legal Address (Complete)">
                <textarea rows={2} className={inputCls} value={formData.legalAddress} onChange={(e) => handleChange('legalAddress', e.target.value)} />
              </Field>
            </div>
            <Field label="City">
              <input type="text" className={inputCls} value={formData.city} onChange={(e) => handleChange('city', e.target.value)} />
            </Field>
            <Field label="State">
              <input type="text" className={inputCls} value={formData.state} onChange={(e) => handleChange('state', e.target.value)} />
            </Field>
            <Field label="Pincode">
              <input type="text" className={inputCls} value={formData.pincode} onChange={(e) => handleChange('pincode', e.target.value)} />
            </Field>
            <Field label="Landmark">
              <input type="text" className={inputCls} value={formData.landmark} onChange={(e) => handleChange('landmark', e.target.value)} />
            </Field>

            {/* Boundary Schedule */}
            <div className="md:col-span-2 pt-2">
              <h3 className="text-xs font-semibold uppercase text-slate-400 mb-2">Boundary Schedule</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
                    <tr>
                      <th className="p-2.5">Boundary</th>
                      <th className="p-2.5">As per Document</th>
                      <th className="p-2.5">As per Site</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                    <tr>
                      <td className="p-2.5 font-medium">North</td>
                      <td className="p-2"><input type="text" className={inputCls} value={formData.boundaryNorthDoc} onChange={(e) => handleChange('boundaryNorthDoc', e.target.value)} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={formData.boundaryNorthSite} onChange={(e) => handleChange('boundaryNorthSite', e.target.value)} /></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">South</td>
                      <td className="p-2"><input type="text" className={inputCls} value={formData.boundarySouthDoc} onChange={(e) => handleChange('boundarySouthDoc', e.target.value)} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={formData.boundarySouthSite} onChange={(e) => handleChange('boundarySouthSite', e.target.value)} /></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">East</td>
                      <td className="p-2"><input type="text" className={inputCls} value={formData.boundaryEastDoc} onChange={(e) => handleChange('boundaryEastDoc', e.target.value)} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={formData.boundaryEastSite} onChange={(e) => handleChange('boundaryEastSite', e.target.value)} /></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-medium">West</td>
                      <td className="p-2"><input type="text" className={inputCls} value={formData.boundaryWestDoc} onChange={(e) => handleChange('boundaryWestDoc', e.target.value)} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={formData.boundaryWestSite} onChange={(e) => handleChange('boundaryWestSite', e.target.value)} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="md:col-span-2">
              <Field label="Plot Boundaries Matching (Y/N)">
                <input type="text" className={inputCls} value={formData.boundariesMatching} onChange={(e) => handleChange('boundariesMatching', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Section III */}
        <div id="lt-sec-3" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">III. Documents Received</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Sale Deed Auth / Date">
              <div className="flex gap-2">
                <input type="text" className={inputCls} placeholder="Registering officer" value={formData.docDeedAuth} onChange={(e) => handleChange('docDeedAuth', e.target.value)} />
                <input type="text" className={inputCls} placeholder="21-Jan-02" value={formData.docDeedDate} onChange={(e) => handleChange('docDeedDate', e.target.value)} />
              </div>
            </Field>
            <Field label="Approved Plan Auth / Date / Ref">
              <div className="flex gap-2">
                <input type="text" className={inputCls} placeholder="BDA" value={formData.docPlanAuth} onChange={(e) => handleChange('docPlanAuth', e.target.value)} />
                <input type="text" className={inputCls} placeholder="Ref: 2282" value={formData.docPlanRef} onChange={(e) => handleChange('docPlanRef', e.target.value)} />
              </div>
            </Field>
            <Field label="Ownership as per document">
              <input type="text" className={inputCls} value={formData.ownershipAsPerDoc} onChange={(e) => handleChange('ownershipAsPerDoc', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Section IV & V */}
        <div id="lt-sec-4" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">IV. Location & V. Property Specifications</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Nature of Locality">
              <input type="text" className={inputCls} value={formData.natureOfLocality} onChange={(e) => handleChange('natureOfLocality', e.target.value)} />
            </Field>
            <Field label="Class of Locality">
              <input type="text" className={inputCls} value={formData.classOfLocality} onChange={(e) => handleChange('classOfLocality', e.target.value)} />
            </Field>
            <Field label="Property Type">
              <input type="text" className={inputCls} value={formData.propertyType} onChange={(e) => handleChange('propertyType', e.target.value)} />
            </Field>
            <Field label="Structure Type">
              <input type="text" className={inputCls} value={formData.structureType} onChange={(e) => handleChange('structureType', e.target.value)} />
            </Field>
            <Field label="No. of Floors">
              <input type="text" className={inputCls} value={formData.noOfFloors} onChange={(e) => handleChange('noOfFloors', e.target.value)} />
            </Field>
            <Field label="Property Holding">
              <input type="text" className={inputCls} value={formData.propertyHolding} onChange={(e) => handleChange('propertyHolding', e.target.value)} />
            </Field>
            <Field label="Property Age / Residual">
              <div className="flex gap-2">
                <input type="text" className={inputCls} placeholder="11" value={formData.propertyAge} onChange={(e) => handleChange('propertyAge', e.target.value)} />
                <input type="text" className={inputCls} placeholder="49" value={formData.residualAge} onChange={(e) => handleChange('residualAge', e.target.value)} />
              </div>
            </Field>
            <Field label="Maintenance">
              <input type="text" className={inputCls} value={formData.maintenance} onChange={(e) => handleChange('maintenance', e.target.value)} />
            </Field>
          </div>

          <h3 className="text-xs font-semibold uppercase text-slate-400 pt-2">Configuration Schedule</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Floor</th>
                  <th className="p-2.5">Bedroom</th>
                  <th className="p-2.5">Kitchen</th>
                  <th className="p-2.5">Hall</th>
                  <th className="p-2.5">Bathroom</th>
                  <th className="p-2.5">Usage Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                <tr>
                  <td className="p-2.5 font-medium">GF</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgGfBed} onChange={(e) => handleChange('cfgGfBed', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgGfKit} onChange={(e) => handleChange('cfgGfKit', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgGfHall} onChange={(e) => handleChange('cfgGfHall', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgGfBath} onChange={(e) => handleChange('cfgGfBath', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgGfRem} onChange={(e) => handleChange('cfgGfRem', e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">FF</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgFfBed} onChange={(e) => handleChange('cfgFfBed', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgFfKit} onChange={(e) => handleChange('cfgFfKit', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgFfHall} onChange={(e) => handleChange('cfgFfHall', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgFfBath} onChange={(e) => handleChange('cfgFfBath', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgFfRem} onChange={(e) => handleChange('cfgFfRem', e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">SF</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgSfBed} onChange={(e) => handleChange('cfgSfBed', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgSfKit} onChange={(e) => handleChange('cfgSfKit', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgSfHall} onChange={(e) => handleChange('cfgSfHall', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgSfBath} onChange={(e) => handleChange('cfgSfBath', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.cfgSfRem} onChange={(e) => handleChange('cfgSfRem', e.target.value)} /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section VI */}
        <div id="lt-sec-6" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">VI. Additional Due Diligence & Occupancy</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Name of FPR met at site">
              <input type="text" className={inputCls} value={formData.fprName} onChange={(e) => handleChange('fprName', e.target.value)} />
            </Field>
            <Field label="Relationship with Applicant">
              <input type="text" className={inputCls} value={formData.fprRelation} onChange={(e) => handleChange('fprRelation', e.target.value)} />
            </Field>
            <Field label="Contact Number">
              <input type="text" className={inputCls} value={formData.fprContact} onChange={(e) => handleChange('fprContact', e.target.value)} />
            </Field>
            <Field label="KYC Reference">
              <input type="text" className={inputCls} value={formData.fprKyc} onChange={(e) => handleChange('fprKyc', e.target.value)} />
            </Field>
            <Field label="Occupancy Status">
              <input type="text" className={inputCls} value={formData.occupancyStatus} onChange={(e) => handleChange('occupancyStatus', e.target.value)} />
            </Field>
            <Field label="Occupied by">
              <input type="text" className={inputCls} value={formData.occupiedBy} onChange={(e) => handleChange('occupiedBy', e.target.value)} />
            </Field>
            <Field label="Residing Since (Years)">
              <input type="text" className={inputCls} value={formData.residingSince} onChange={(e) => handleChange('residingSince', e.target.value)} />
            </Field>
            <Field label="Discrepancies if any">
              <input type="text" className={inputCls} value={formData.discrepancies} onChange={(e) => handleChange('discrepancies', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Section VII: Valuation */}
        <div id="lt-sec-7" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-200">VII. Valuation Engine</h2>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/20 font-mono">
              Auto-Calculated
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Plot Area (sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.plotAreaSqft} onChange={(e) => handleChange('plotAreaSqft', e.target.value)} />
            </Field>
            <Field label="Plot Rate (₹ / sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.plotRateSft} onChange={(e) => handleChange('plotRateSft', e.target.value)} />
            </Field>
            <Field label="Plan BUA (sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.planBuaSqft} onChange={(e) => handleChange('planBuaSqft', e.target.value)} />
            </Field>
            <Field label="Building Rate (₹ / sqft)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.bldgRateSft} onChange={(e) => handleChange('bldgRateSft', e.target.value)} />
            </Field>
            <Field label="Amenities Value (₹)">
              <input type="number" step="0.01" min="0" className={inputCls} value={formData.amenitiesValue} onChange={(e) => handleChange('amenitiesValue', e.target.value)} />
            </Field>
            <Field label="Distress Value Ratio (%)">
              <input type="number" step="1" min="0" max="100" className={inputCls} value={formData.distressRatioPct} onChange={(e) => handleChange('distressRatioPct', e.target.value)} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Measured BUA Description">
                <input type="text" className={inputCls} value={formData.measuredBuaDesc} onChange={(e) => handleChange('measuredBuaDesc', e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400">Grand Total Market Value:</span>
              <p className="text-xl font-bold text-emerald-400 mt-1">₹{formatIndianCurrency(valuationMath.grandTotal)}/-</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{valuationMath.wordsGrand}</p>
            </div>
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-xs text-slate-400">Distress Value ({formData.distressRatioPct}%):</span>
              <p className="text-xl font-bold text-amber-400 mt-1">₹{formatIndianCurrency(valuationMath.distressVal)}/-</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{valuationMath.wordsDistress}</p>
            </div>
          </div>
        </div>

        {/* Section VIII & IX */}
        <div id="lt-sec-8" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">VIII. Progress Assessment & Remarks</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Property Stage / Progress / Reco">
              <div className="flex gap-2">
                <input type="text" className={inputCls} placeholder="100%" value={formData.stageProperty} onChange={(e) => handleChange('stageProperty', e.target.value)} />
                <input type="text" className={inputCls} placeholder="100%" value={formData.progressProperty} onChange={(e) => handleChange('progressProperty', e.target.value)} />
                <input type="text" className={inputCls} placeholder="100%" value={formData.recoProperty} onChange={(e) => handleChange('recoProperty', e.target.value)} />
              </div>
            </Field>
            <Field label="Deviations if any">
              <input type="text" className={inputCls} value={formData.deviations} onChange={(e) => handleChange('deviations', e.target.value)} />
            </Field>
            <Field label="Coordinates (Lat / Long)">
              <div className="flex gap-2">
                <input type="text" className={inputCls} placeholder="Lat" value={formData.latitude} onChange={(e) => handleChange('latitude', e.target.value)} />
                <input type="text" className={inputCls} placeholder="Long" value={formData.longitude} onChange={(e) => handleChange('longitude', e.target.value)} />
              </div>
            </Field>
            <div className="md:col-span-3">
              <Field label="Valuer Detailed Remarks">
                <textarea rows={3} className={inputCls} value={formData.remarks} onChange={(e) => handleChange('remarks', e.target.value)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Requirement Details */}
        <div id="lt-sec-9" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">Requirement Details in Report Format</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="1. Setback as per measured / Bye Laws / Plan">
              <input type="text" className={inputCls} value={formData.reqSetbacks} onChange={(e) => handleChange('reqSetbacks', e.target.value)} />
            </Field>
            <Field label="2. Setback Deviation">
              <input type="text" className={inputCls} value={formData.reqSetbackDeviation} onChange={(e) => handleChange('reqSetbackDeviation', e.target.value)} />
            </Field>
            <Field label="3. Floor BUA as per Measured / Plan">
              <input type="text" className={inputCls} value={formData.reqFloorBua} onChange={(e) => handleChange('reqFloorBua', e.target.value)} />
            </Field>
            <Field label="4. Extra Coverage Area on each Floor">
              <input type="text" className={inputCls} value={formData.reqExtraCoverage} onChange={(e) => handleChange('reqExtraCoverage', e.target.value)} />
            </Field>
            <Field label="5. Property Address as per Site / Docs">
              <input type="text" className={inputCls} value={formData.reqAddressCheck} onChange={(e) => handleChange('reqAddressCheck', e.target.value)} />
            </Field>
            <Field label="6. Property Boundaries Mismatch">
              <input type="text" className={inputCls} value={formData.reqBoundariesMismatch} onChange={(e) => handleChange('reqBoundariesMismatch', e.target.value)} />
            </Field>
          </div>
        </div>

        {/* Attachments */}
        <div id="lt-sec-docs">
          <BaseDocumentsSection
            title="Documents" sectionNumber={10}
            sectionId="lt-sec-docs"
            
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

        <div id="lt-sec-maps">
          <BaseMapsSection
            title="Maps" sectionNumber={11}
            sectionId="lt-sec-maps"
            
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

        <div id="lt-sec-photos">
          <BasePhotographsSection
            title="Photographs" sectionNumber={12}
            sectionId="lt-sec-photos"
            
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
