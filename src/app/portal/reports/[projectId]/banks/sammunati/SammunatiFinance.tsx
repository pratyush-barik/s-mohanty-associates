'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
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
  getEarliestFieldVisit,
  BasePhotoBucketModal,
  ActiveConfigBanner,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFSammunatiFinanceRenderer } from '@/lib/banks/pdf-sammunati-finance-renderer';

export const SAMMUNATI_FINANCE_CONFIG: BankConfig = {
  bankId: 'SAMMUNATI FINANCE',
  subTemplateId: '',
  displayName: 'Sammunati Financial Intermediation & Services Pvt Ltd',
  defaultValues: {
    purpose: 'Agri-Commerce / Warehouse / Land Valuation',
  },
};

export interface SammunatiFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function SammunatiFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: SammunatiFinanceProps) {
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
    { id: 'sec-general', title: 'General Details' },
    { id: 'sec-locality', title: 'Locality & Boundaries' },
    { id: 'sec-property', title: 'Property Details' },
    { id: 'sec-tenure', title: 'Tenure & Legal' },
    { id: 'sec-structural', title: 'Structural Details' },
    { id: 'sec-valuation', title: 'Valuation & Costing' },
    { id: 'sec-documents', title: 'Documents' },
    { id: 'sec-maps', title: 'Maps' },
    { id: 'sec-photographs', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  const defaultValues: Record<string, any> = useMemo(() => {
    const today = formatReportDate(new Date());
    const visitDate = earliestVisit || today;

    return {
      // Header / Meta
      refNo: `SAM/${new Date().getMonth() + 1 < 10 ? '0' + (new Date().getMonth() + 1) : new Date().getMonth() + 1}-${String(new Date().getFullYear()).slice(-2)}/01`,
      valuationDate: visitDate,
      customerName: prefill.ownerName || 'Deepak Kumar Nayak',
      requestReceivedFrom: 'Samunnati Financial Intermediation & Services Pvt Ltd, through Mr. Satyajit Mohanty',
      docHolderName: prefill.ownerName || 'Hengula Farmers & Producer Company Limited (Director-Deepak Kumar Nayak)',
      propertyAddressRequest: prefill.propertyAddress || 'Khata no-799/1101, Plot no-692/2391, Mouza-Brahmagiri, Tahasil/PS-Brahmagiri, Dist-Puri, Odisha, Pin-752011',
      propertyAddressInspection: prefill.propertyAddress || 'Khata no-799/1101, Plot no-692/2391, Mouza-Brahmagiri, Tahasil/PS-Brahmagiri, Dist-Puri, Odisha, Pin-752011',
      propertyAddressDocs: prefill.propertyAddress || 'Khata no-799/1101, Plot no-692/2391 (AC.0.200 Decs, Homestead), Mouza-Brahmagiri, Tahasil/PS-Brahmagiri, Dist-Puri, Odisha, Pin-752011',
      landmark: 'Near Brahmagiri Bus Stop',
      inspectionDate: visitDate,
      contactPersonMet: prefill.contactName || prefill.ownerName || 'Deepak Kumar Nayak / Representative',

      // Locality & Boundaries
      wardNo: 'Brahmagiri GP',
      vicinity: 'Residential / Commercial / Industrial',
      classificationOfLocality: 'Middle class',
      proximityRailway: 'Puri Railway Station (20 KM)',
      proximityBus: 'Brahmagiri Bus Stop (0.5 KM)',
      proximityHospital: 'Brahmagiri CHC (1.0 KM)',
      approachRoadCondition: '20 feet wide paved road',
      plotDemarcated: 'Yes, clearly demarcated with boundary pillars',
      propertyIdentifiedThrough: 'Sale deed, ROR, site demarcation & neighbor inquiry',
      boundaryEastDeed: 'Purnachandra Sahoo & Others',
      boundaryEastActual: 'Purnachandra Sahoo & Others',
      boundaryWestDeed: '20ft Wide Road',
      boundaryWestActual: '20ft Wide Road',
      boundaryNorthDeed: 'Pankaj Kumar Nayak',
      boundaryNorthActual: 'Pankaj Kumar Nayak',
      boundarySouthDeed: 'Rankanath Nayak',
      boundarySouthActual: 'Rankanath Nayak',

      // Property Details
      propertyDescription: 'Vacant plot demarcated at site for agro-commercial development',
      propertyType: 'Commercial / Agro-Industrial / Residential',
      propertyUsage: 'Vacant Plot',
      accommodationDetails: 'NA (Vacant Land)',
      additionalAmenities: 'Paved access road, electrical line available nearby, clear title',
      actualArea: '8712',
      carpetArea: 'NA',
      builtUpArea: 'NA',
      permittedArea: 'As per local building bye-laws',
      areaAsPerDeed: '8712',
      adherenceSanction: 'Yes / NA (Vacant Land)',
      deviationDetails: 'Nil / NA',
      demolitionRisk: 'Low',
      occupiedBy: 'Vacant Land (Under possession of customer)',
      occupiedSince: 'NA',

      // Legal & Tenure
      landTenure: 'Freehold (Sthitiban / Homestead)',
      approvalDetails: 'Brahmagiri Gram Panchayat jurisdiction, ROR mutated in record',
      societyName: 'Hengula Farmers & Producer Company Limited',
      societyRegNo: 'U01110OR2020PTC033456',
      sharesDetails: 'NA',
      monthlyOutgoes: 'Nil',

      // Structural
      structureType: 'NA (Vacant Land)',
      floorsWings: 'NA',
      flatsPerFloor: 'NA',
      buildingAge: 'NA',
      futureLife: 'NA',
      constructionQuality: 'NA (Vacant Plot)',
      unitDetails: 'NA',

      // Valuation & Costing
      areaConsidered: '8712',
      prevailingMarketRate: 'Rs. 1,000/- to Rs. 1,200/- per Sq. ft',
      inquiriesSource: 'Local realtors, property owners and Sub-Registrar guideline value',
      landAreaVal: '8712',
      landRateVal: '1200',
      bldAreaVal: '0',
      bldRateVal: '0',
      totalPropertyValue: '10454400',
      forcedSaleValue: '8363520',
      insuranceValue: '8886240',
      marketabilitySale: 'Good / High demand for agro-commercial & residential',
      marketabilityLease: 'Good / Commercial demand in Brahmagiri',
      priceVolatility: 'Low to Medium',

      // Coordinates
      latitude: '19.801234',
      longitude: '85.789123',

      // Attachments
      documentImages: [],
      documentImageNames: [],
      locationMapImages: [],
      mouzaMapImages: [],
      sketchMapImages: [],
      propertyImages: [],
      propertyImageNames: [],
    };
  }, [earliestVisit, prefill]);

  const [fields, setFields] = useState<Record<string, any>>(() => {
    return { ...defaultValues, ...(rawInitialFields || {}) };
  });

  const updateField = useCallback((name: string, value: any) => {
    setFields((prev) => {
      const updated = { ...prev, [name]: value };

      if (['landAreaVal', 'landRateVal', 'bldAreaVal', 'bldRateVal'].includes(name)) {
        const lArea = parseFloat(name === 'landAreaVal' ? value : updated.landAreaVal) || 0;
        const lRate = parseFloat(name === 'landRateVal' ? value : updated.landRateVal) || 0;
        const bArea = parseFloat(name === 'bldAreaVal' ? value : updated.bldAreaVal) || 0;
        const bRate = parseFloat(name === 'bldRateVal' ? value : updated.bldRateVal) || 0;

        const landTot = lArea * lRate;
        const bldTot = bArea * bRate;
        const total = landTot + bldTot;
        const distress = Math.round(total * 0.8);
        const insurance = Math.round(total * 0.85);

        updated.totalPropertyValue = String(total);
        updated.forcedSaleValue = String(distress);
        updated.insuranceValue = String(insurance);
      }

      return updated;
    });
  }, []);

  const totalMarketValueNum = useMemo(() => {
    const lArea = parseFloat(fields.landAreaVal) || 0;
    const lRate = parseFloat(fields.landRateVal) || 0;
    const bArea = parseFloat(fields.bldAreaVal) || 0;
    const bRate = parseFloat(fields.bldRateVal) || 0;
    return lArea * lRate + bArea * bRate;
  }, [fields.landAreaVal, fields.landRateVal, fields.bldAreaVal, fields.bldRateVal]);

  const distressSaleValueNum = useMemo(() => {
    return Math.round(totalMarketValueNum * 0.8);
  }, [totalMarketValueNum]);

  const insuranceValueNum = useMemo(() => {
    return Math.round(totalMarketValueNum * 0.85);
  }, [totalMarketValueNum]);

  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: totalMarketValueNum,
        updated_at: new Date().toISOString(),
      });
      setAutoSaveStatus('saved');
      setMessage({ text: 'Report draft saved successfully!', type: 'success' });
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (e: any) {
      setAutoSaveStatus('error');
      setMessage({ text: e.message || 'Error saving report draft', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    if (!confirm('Are you sure you want to finalize and submit this valuation report for Sammunati Finance?')) return;
    setSubmitting(true);
    try {
      await handleSaveDraft();
      router.push(`/portal/reports/${projectId}?status=submitted`);
    } catch (e: any) {
      alert(`Error submitting report: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const generatePdfBytes = async (): Promise<Uint8Array> => {
    const renderer = new PDFSammunatiFinanceRenderer({ ...fields, projectCode });
    return await renderer.render();
  };

  const handlePreviewPdf = async () => {
    setPreviewing(true);
    try {
      const pdfBytes = await generatePdfBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      alert(`Error generating PDF preview: ${e.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPdf = async () => {
    setPreviewing(true);
    try {
      const pdfBytes = await generatePdfBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Valuation_Report_Sammunati_${projectCode || fields.customerName || 'Draft'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Error downloading PDF: ${e.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading('documents');
    try {
      const newUrls: string[] = [];
      const newNames: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `sam_doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
        newNames.push(file.name.replace(/\.[^/.]+$/, ''));
      }

      setFields((prev) => ({
        ...prev,
        documentImages: [...(prev.documentImages || []), ...newUrls],
        documentImageNames: [...(prev.documentImageNames || []), ...newNames],
      }));
    } catch (err: any) {
      alert(`Error uploading documents: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMapUpload = async (mapField: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(mapField);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `sam_map_${mapField}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);

      setFields((prev) => ({
        ...prev,
        [mapField]: [...(prev[mapField] || []), urlData.publicUrl],
      }));
    } catch (err: any) {
      alert(`Error uploading map: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading('photos');
    try {
      const newUrls: string[] = [];
      const newNames: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `sam_photo_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
        newNames.push(`Photograph ${(fields.propertyImages || []).length + i + 1}`);
      }

      setFields((prev) => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...newUrls],
        propertyImageNames: [...(prev.propertyImageNames || []), ...newNames],
      }));
    } catch (err: any) {
      alert(`Error uploading photographs: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900">
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Title Card */}
        <BankReportTitleCard
          bankName="Sammunati Financial Intermediation & Services Pvt Ltd"
          subclass="Agri-Commerce & Land Format"
          title="Valuation Report Builder"
          description="Comprehensive agricultural / commercial / land valuation report for Sammunati Financial Intermediation & Services Pvt Ltd."
          earliestVisit={earliestVisit}
          projectCode={projectCode}
        />

        {/* Wizard Selection Banner */}
        <ActiveConfigBanner
          clientType="organisation"
          bankName="SAMMUNATI FINANCE"
          subclass="Agri-Commerce & Land Format"
          onResetWizard={onResetWizard}
          sticky={false}
        />

        {message && (
          <div
            className={`p-4 rounded-xl border text-sm font-medium ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* ══════════════════════════════════════════
            SECTION 1: GENERAL DETAILS
            ══════════════════════════════════════════ */}
        <Section id="sec-general" number={1} title="General Details">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Reference Number *">
              <input
                type="text"
                value={fields.refNo || ''}
                onChange={(e) => updateField('refNo', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="SAM/07-26/01"
              />
            </Field>

            <Field label="Date of Valuation *">
              <input
                type="text"
                value={fields.valuationDate || ''}
                onChange={(e) => updateField('valuationDate', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Name of Customer *">
              <input
                type="text"
                value={fields.customerName || ''}
                onChange={(e) => updateField('customerName', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Full name of customer"
              />
            </Field>

            <Field label="Request Received From *">
              <input
                type="text"
                value={fields.requestReceivedFrom || ''}
                onChange={(e) => updateField('requestReceivedFrom', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Name of Document Holder (as per Sale Deed) *">
              <input
                type="text"
                value={fields.docHolderName || ''}
                onChange={(e) => updateField('docHolderName', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Document holder / entity name"
              />
            </Field>

            <Field label="Date of Inspection *">
              <input
                type="text"
                value={fields.inspectionDate || ''}
                onChange={(e) => updateField('inspectionDate', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Landmark">
              <input
                type="text"
                value={fields.landmark || ''}
                onChange={(e) => updateField('landmark', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Nearby prominent landmark"
              />
            </Field>

            <Field label="Contact Person / Representative Met">
              <input
                type="text"
                value={fields.contactPersonMet || ''}
                onChange={(e) => updateField('contactPersonMet', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Representative present at site"
              />
            </Field>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Property Address (as per request) *">
                <textarea
                  rows={2}
                  value={fields.propertyAddressRequest || ''}
                  onChange={(e) => updateField('propertyAddressRequest', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                  placeholder="Khata no, Plot no, Mouza, Tahasil/PS, District, State, PIN"
                />
              </Field>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Property Address (on inspection) *">
                <textarea
                  rows={2}
                  value={fields.propertyAddressInspection || ''}
                  onChange={(e) => updateField('propertyAddressInspection', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                  placeholder="Physical site address found on inspection"
                />
              </Field>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Property Address (as per docs) *">
                <textarea
                  rows={2}
                  value={fields.propertyAddressDocs || ''}
                  onChange={(e) => updateField('propertyAddressDocs', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                  placeholder="Address recorded in legal documents / Sale Deed"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 2: SURROUNDING LOCALITY & BOUNDARIES
            ══════════════════════════════════════════ */}
        <Section id="sec-locality" number={2} title="Surrounding Locality & Boundaries">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Ward No. / Municipal / GP Area">
              <input
                type="text"
                value={fields.wardNo || ''}
                onChange={(e) => updateField('wardNo', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Gram Panchayat / Ward name"
              />
            </Field>

            <Field label="Vicinity / Area Type">
              <select
                value={fields.vicinity || ''}
                onChange={(e) => updateField('vicinity', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Residential / Commercial / Industrial">Residential / Commercial / Industrial</option>
                <option value="Commercial / Agricultural">Commercial / Agricultural</option>
                <option value="Residential">Residential</option>
                <option value="Industrial">Industrial</option>
                <option value="Agricultural">Agricultural</option>
              </select>
            </Field>

            <Field label="Classification of Locality">
              <select
                value={fields.classificationOfLocality || ''}
                onChange={(e) => updateField('classificationOfLocality', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Middle class">Middle class</option>
                <option value="High class">High class</option>
                <option value="Lower middle class">Lower middle class</option>
                <option value="Commercial / Industrial Belt">Commercial / Industrial Belt</option>
              </select>
            </Field>

            <Field label="Proximity: Nearest Railway Station">
              <input
                type="text"
                value={fields.proximityRailway || ''}
                onChange={(e) => updateField('proximityRailway', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Station name & distance (e.g. Puri Station - 20 KM)"
              />
            </Field>

            <Field label="Proximity: Nearest Bus Stop">
              <input
                type="text"
                value={fields.proximityBus || ''}
                onChange={(e) => updateField('proximityBus', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Bus stop & distance (e.g. Brahmagiri - 0.5 KM)"
              />
            </Field>

            <Field label="Proximity: Nearest Hospital">
              <input
                type="text"
                value={fields.proximityHospital || ''}
                onChange={(e) => updateField('proximityHospital', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Hospital & distance (e.g. Brahmagiri CHC - 1.0 KM)"
              />
            </Field>

            <Field label="Condition & Width of Approach Road">
              <input
                type="text"
                value={fields.approachRoadCondition || ''}
                onChange={(e) => updateField('approachRoadCondition', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="e.g. 20 feet wide paved road"
              />
            </Field>

            <Field label="Plot Demarcated at Site">
              <input
                type="text"
                value={fields.plotDemarcated || ''}
                onChange={(e) => updateField('plotDemarcated', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Yes / Clearly demarcated"
              />
            </Field>

            <Field label="Property Identified Through">
              <input
                type="text"
                value={fields.propertyIdentifiedThrough || ''}
                onChange={(e) => updateField('propertyIdentifiedThrough', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Sale Deed, ROR, demarcation"
              />
            </Field>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-600 mb-3">
              Boundaries Schedule (As per Deed vs Actual at Site)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-4 font-semibold">Direction</th>
                    <th className="py-2.5 px-4 font-semibold">As per Sale Deed</th>
                    <th className="py-2.5 px-4 font-semibold">Actual at Site</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">East</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.boundaryEastDeed || ''}
                        onChange={(e) => updateField('boundaryEastDeed', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.boundaryEastActual || ''}
                        onChange={(e) => updateField('boundaryEastActual', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">West</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.boundaryWestDeed || ''}
                        onChange={(e) => updateField('boundaryWestDeed', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.boundaryWestActual || ''}
                        onChange={(e) => updateField('boundaryWestActual', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">North</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.boundaryNorthDeed || ''}
                        onChange={(e) => updateField('boundaryNorthDeed', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.boundaryNorthActual || ''}
                        onChange={(e) => updateField('boundaryNorthActual', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">South</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.boundarySouthDeed || ''}
                        onChange={(e) => updateField('boundarySouthDeed', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.boundarySouthActual || ''}
                        onChange={(e) => updateField('boundarySouthActual', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 3: PROPERTY DETAILS & USAGE
            ══════════════════════════════════════════ */}
        <Section id="sec-property" number={3} title="Property Details & Usage">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Description of Property">
              <input
                type="text"
                value={fields.propertyDescription || ''}
                onChange={(e) => updateField('propertyDescription', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="e.g. Vacant plot demarcated at site"
              />
            </Field>

            <Field label="Type of Property">
              <select
                value={fields.propertyType || ''}
                onChange={(e) => updateField('propertyType', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Commercial / Agro-Industrial / Residential">Commercial / Agro-Industrial / Residential</option>
                <option value="Commercial Land & Building">Commercial Land & Building</option>
                <option value="Vacant Residential Land">Vacant Residential Land</option>
                <option value="Agri-Storage / Warehouse">Agri-Storage / Warehouse</option>
              </select>
            </Field>

            <Field label="Type of Usage of Entire Property">
              <input
                type="text"
                value={fields.propertyUsage || ''}
                onChange={(e) => updateField('propertyUsage', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Vacant plot / Office / Godown"
              />
            </Field>

            <Field label="Accommodation Details">
              <input
                type="text"
                value={fields.accommodationDetails || ''}
                onChange={(e) => updateField('accommodationDetails', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA / Rooms / Halls"
              />
            </Field>

            <Field label="Additional Amenities">
              <input
                type="text"
                value={fields.additionalAmenities || ''}
                onChange={(e) => updateField('additionalAmenities', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Access road, water, electricity"
              />
            </Field>

            <Field label="Actual Area at Site (Sq. ft) *">
              <input
                type="text"
                value={fields.actualArea || ''}
                onChange={(e) => updateField('actualArea', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="8712"
              />
            </Field>

            <Field label="Carpet Area (approx Sq. ft)">
              <input
                type="text"
                value={fields.carpetArea || ''}
                onChange={(e) => updateField('carpetArea', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA"
              />
            </Field>

            <Field label="Built-up / Saleable Area (Sq. ft)">
              <input
                type="text"
                value={fields.builtUpArea || ''}
                onChange={(e) => updateField('builtUpArea', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA"
              />
            </Field>

            <Field label="Permitted Area as per Byelaws">
              <input
                type="text"
                value={fields.permittedArea || ''}
                onChange={(e) => updateField('permittedArea', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Area as per Sale Deed (Sq. ft)">
              <input
                type="text"
                value={fields.areaAsPerDeed || ''}
                onChange={(e) => updateField('areaAsPerDeed', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="8712"
              />
            </Field>

            <Field label="Adherence to Sanction Plan">
              <input
                type="text"
                value={fields.adherenceSanction || ''}
                onChange={(e) => updateField('adherenceSanction', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Deviation Details (if any)">
              <input
                type="text"
                value={fields.deviationDetails || ''}
                onChange={(e) => updateField('deviationDetails', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Nil / NA"
              />
            </Field>

            <Field label="Risk of Demolition">
              <select
                value={fields.demolitionRisk || ''}
                onChange={(e) => updateField('demolitionRisk', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>

            <Field label="Property Occupied By">
              <input
                type="text"
                value={fields.occupiedBy || ''}
                onChange={(e) => updateField('occupiedBy', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="If Self-Occupied, Since When">
              <input
                type="text"
                value={fields.occupiedSince || ''}
                onChange={(e) => updateField('occupiedSince', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 4: TENURE, LEGAL & SOCIETY DETAILS
            ══════════════════════════════════════════ */}
        <Section id="sec-tenure" number={4} title="Tenure, Legal & Society Details">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Land Tenure *">
              <select
                value={fields.landTenure || ''}
                onChange={(e) => updateField('landTenure', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Freehold (Sthitiban / Homestead)">Freehold (Sthitiban / Homestead)</option>
                <option value="Freehold">Freehold</option>
                <option value="Leasehold">Leasehold</option>
              </select>
            </Field>

            <Field label="Approval / Drawing Authority">
              <input
                type="text"
                value={fields.approvalDetails || ''}
                onChange={(e) => updateField('approvalDetails', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="e.g. Gram Panchayat / ROR Mutated"
              />
            </Field>

            <Field label="Name of Society / Company / FPO">
              <input
                type="text"
                value={fields.societyName || ''}
                onChange={(e) => updateField('societyName', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Entity name"
              />
            </Field>

            <Field label="Registration No. / CIN">
              <input
                type="text"
                value={fields.societyRegNo || ''}
                onChange={(e) => updateField('societyRegNo', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="CIN / Reg No"
              />
            </Field>

            <Field label="No. of Shares / Certificate Details">
              <input
                type="text"
                value={fields.sharesDetails || ''}
                onChange={(e) => updateField('sharesDetails', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA"
              />
            </Field>

            <Field label="Monthly Outgoes / Maintenance">
              <input
                type="text"
                value={fields.monthlyOutgoes || ''}
                onChange={(e) => updateField('monthlyOutgoes', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Nil / NA"
              />
            </Field>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 5: STRUCTURAL & CONSTRUCTION DETAILS
            ══════════════════════════════════════════ */}
        <Section id="sec-structural" number={5} title="Structural & Construction Details">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Type of Structure">
              <input
                type="text"
                value={fields.structureType || ''}
                onChange={(e) => updateField('structureType', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA / RCC Framed / Industrial Shed"
              />
            </Field>

            <Field label="Number of Floors / Wings">
              <input
                type="text"
                value={fields.floorsWings || ''}
                onChange={(e) => updateField('floorsWings', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA"
              />
            </Field>

            <Field label="Flats / Units per Floor">
              <input
                type="text"
                value={fields.flatsPerFloor || ''}
                onChange={(e) => updateField('flatsPerFloor', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA"
              />
            </Field>

            <Field label="Age of the Property">
              <input
                type="text"
                value={fields.buildingAge || ''}
                onChange={(e) => updateField('buildingAge', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA / Years"
              />
            </Field>

            <Field label="Estimated Future Economic Life">
              <input
                type="text"
                value={fields.futureLife || ''}
                onChange={(e) => updateField('futureLife', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA / Years"
              />
            </Field>

            <Field label="Quality of Construction">
              <input
                type="text"
                value={fields.constructionQuality || ''}
                onChange={(e) => updateField('constructionQuality', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Good / Average / NA"
              />
            </Field>

            <Field label="Unit Details / Fittings">
              <input
                type="text"
                value={fields.unitDetails || ''}
                onChange={(e) => updateField('unitDetails', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="NA"
              />
            </Field>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 6: VALUATION, COSTING & DECLARATIONS
            ══════════════════════════════════════════ */}
        <Section id="sec-valuation" number={6} title="Valuation, Costing & Declarations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Area Considered for Valuation (Sq. ft) *">
              <input
                type="text"
                value={fields.areaConsidered || ''}
                onChange={(e) => updateField('areaConsidered', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="8712"
              />
            </Field>

            <Field label="Market Prevailing Rates in Vicinity">
              <input
                type="text"
                value={fields.prevailingMarketRate || ''}
                onChange={(e) => updateField('prevailingMarketRate', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Rs. 1,000/- to Rs. 1,200/- per Sq. ft"
              />
            </Field>

            <Field label="Inquiries Source">
              <input
                type="text"
                value={fields.inquiriesSource || ''}
                onChange={(e) => updateField('inquiriesSource', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Local realtors, registry rate"
              />
            </Field>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-600 mb-3">
              Valuation Computation Table
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-4 font-semibold">Component</th>
                    <th className="py-2.5 px-4 font-semibold">Area (Sq. ft)</th>
                    <th className="py-2.5 px-4 font-semibold">Rate adopted (Rs.)</th>
                    <th className="py-2.5 px-4 font-semibold">Total Value (Rs.)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">Land Component</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={fields.landAreaVal ?? ''}
                        onChange={(e) => updateField('landAreaVal', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={fields.landRateVal ?? ''}
                        onChange={(e) => updateField('landRateVal', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-emerald-600">
                      ₹ {formatIndianCurrency((parseFloat(fields.landAreaVal) || 0) * (parseFloat(fields.landRateVal) || 0))}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">Building Component (after dep.)</td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={fields.bldAreaVal ?? ''}
                        onChange={(e) => updateField('bldAreaVal', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        value={fields.bldRateVal ?? ''}
                        onChange={(e) => updateField('bldRateVal', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                      />
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-emerald-600">
                      ₹ {formatIndianCurrency((parseFloat(fields.bldAreaVal) || 0) * (parseFloat(fields.bldRateVal) || 0))}
                    </td>
                  </tr>
                  <tr className="bg-amber-50 font-bold border-t-2 border-amber-300">
                    <td className="py-3 px-4 text-amber-900" colSpan={3}>
                      TOTAL FAIR MARKET VALUE (A + B)
                    </td>
                    <td className="py-3 px-4 text-amber-900 text-base">
                      ₹ {formatIndianCurrency(totalMarketValueNum)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-500 italic">
              Amount in Words: <span className="font-semibold text-amber-800">Rupees {rupeesInWords(totalMarketValueNum)} Only</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            <Field label="Realizable / Mortgage Value (Rs.) *">
              <input
                type="text"
                value={`₹ ${formatIndianCurrency(totalMarketValueNum)}`}
                readOnly
                className={`${inputCls} bg-slate-100 font-bold text-emerald-700`}
              />
            </Field>

            <Field label="Forced / Distress Sale Value (80%) *">
              <input
                type="text"
                value={`₹ ${formatIndianCurrency(distressSaleValueNum)}`}
                readOnly
                className={`${inputCls} bg-slate-100 font-bold text-amber-700`}
              />
            </Field>

            <Field label="Insurance Replacement Value (Rs.)">
              <input
                type="text"
                value={`₹ ${formatIndianCurrency(insuranceValueNum)}`}
                readOnly
                className={`${inputCls} bg-slate-100 font-bold text-cyan-700`}
              />
            </Field>

            <Field label="Marketability for Sale">
              <input
                type="text"
                value={fields.marketabilitySale || ''}
                onChange={(e) => updateField('marketabilitySale', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Marketability for Lease / Rental">
              <input
                type="text"
                value={fields.marketabilityLease || ''}
                onChange={(e) => updateField('marketabilityLease', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Price Volatility">
              <select
                value={fields.priceVolatility || ''}
                onChange={(e) => updateField('priceVolatility', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Low to Medium">Low to Medium</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-white text-xs text-slate-600 space-y-2">
            <h5 className="font-semibold text-slate-800 uppercase tracking-wider">
              Disclosures & Valuer Declaration
            </h5>
            <p>1. Statements of facts presented in this report are true and correct to the best of our knowledge.</p>
            <p>2. We (valuer) have no direct or indirect interest in the property or transaction.</p>
            <p>3. Valuation is independent and compensation is not contingent upon reporting a predetermined value.</p>
            <p>4. Site inspection was carried out personally by qualified site engineer.</p>
            <p>5. Title and legal ownership papers must be verified by the lending institution’s legal advocate.</p>
            <p>6. Validity of this report is 45 days from the date of issue.</p>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 7: DOCUMENTS
            ══════════════════════════════════════════ */}
        <BaseDocumentsSection
          title="Documents"
          sectionNumber={7}
          sectionId="sec-documents"
          documentImages={fields.documentImages || []}
          documentImageNames={fields.documentImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading === 'documents'}
          onUploadDocument={handleDocumentUpload}
          onRemoveDocument={(idx) => {
            setFields((prev) => ({
              ...prev,
              documentImages: (prev.documentImages || []).filter((_: any, i: number) => i !== idx),
              documentImageNames: (prev.documentImageNames || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onDocumentNameChange={(idx, name) => {
            const next = [...(fields.documentImageNames || [])];
            while (next.length <= idx) next.push('');
            next[idx] = name;
            updateField('documentImageNames', next);
          }}
          onReorderDocuments={(newImages, newNames) => {
            setFields((prev) => ({
              ...prev,
              documentImages: newImages,
              documentImageNames: newNames,
            }));
          }}
        />

        {/* ══════════════════════════════════════════
            SECTION 8: MAPS
            ══════════════════════════════════════════ */}
        <BaseMapsSection
          title="Maps"
          sectionNumber={8}
          sectionId="sec-maps"
          latitude={fields.latitude || '19.801234'}
          longitude={fields.longitude || '85.789123'}
          technicalAddress={fields.propertyAddressInspection || ''}
          propertyAddress={fields.propertyAddressDocs || fields.propertyAddressInspection || ''}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Location Coordinates"
          locationMapImages={fields.locationMapImages || []}
          mouzaMapImages={fields.mouzaMapImages || []}
          sketchMapImages={fields.sketchMapImages || []}
          isReadOnly={isReadOnly}
          uploading={typeof uploading === 'string' && uploading.includes('Map')}
          onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={(idx) => {
            setFields((prev) => ({
              ...prev,
              locationMapImages: (prev.locationMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={(idx) => {
            setFields((prev) => ({
              ...prev,
              mouzaMapImages: (prev.mouzaMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={(idx) => {
            setFields((prev) => ({
              ...prev,
              sketchMapImages: (prev.sketchMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onReorderLocationMap={(newImgs) => updateField('locationMapImages', newImgs)}
          onReorderMouzaMap={(newImgs) => updateField('mouzaMapImages', newImgs)}
          onReorderSketchMap={(newImgs) => updateField('sketchMapImages', newImgs)}
        />

        {/* ══════════════════════════════════════════
            SECTION 9: PHOTOGRAPHS
            ══════════════════════════════════════════ */}
        <BasePhotographsSection
          title="Photographs"
          sectionNumber={9}
          sectionId="sec-photographs"
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading === 'photos'}
          bucketCount={bucketImages.length}
          onImageNameChange={(idx, name) => {
            const next = [...(fields.propertyImageNames || [])];
            while (next.length <= idx) next.push('');
            next[idx] = name;
            updateField('propertyImageNames', next);
          }}
          onRemoveImage={(idx) => {
            setFields((prev) => ({
              ...prev,
              propertyImages: (prev.propertyImages || []).filter((_: any, i: number) => i !== idx),
              propertyImageNames: (prev.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onReorderImages={(newImages, newNames) => {
            setFields((prev) => ({
              ...prev,
              propertyImages: newImages,
              propertyImageNames: newNames,
            }));
          }}
          onUploadImages={handlePhotoUpload}
          onOpenBucketPicker={() => setShowBucketModal(true)}
        />

        {/* ══════════════════════════════════════════
            REPORT ACTION BAR
            ══════════════════════════════════════════ */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={saving || submitting || previewing || !!uploading}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmitReport}
          onPreviewPDF={handlePreviewPdf}
          onDownloadPDF={handleDownloadPdf}
        />
      </div>

      {/* ── Floating Navigator Column ── */}
      <FloatingNavigator sections={navSections} />

      {/* ── Photo Bucket Picker Modal ── */}
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
                ...selectedUrls.map((_, i) => `Photograph ${(prev.propertyImages || []).length + i + 1}`),
              ],
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
