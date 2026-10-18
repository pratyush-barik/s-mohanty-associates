'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  BankReportHeader,
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
import { PDFAUSmallFinanceBankRenderer } from '@/lib/banks/pdf-au-small-finance-bank-renderer';

export const AU_SMALL_FINANCE_BANK_CONFIG: BankConfig = {
  bankId: 'AU SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'AU Small Finance Bank',
  defaultValues: {
    purpose: 'Mortgage / Home Loan / SME Lending',
  },
};

export interface AUSmallFinanceBankProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function AUSmallFinanceBank({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: AUSmallFinanceBankProps) {
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
    { id: 'sec-assignment', title: 'Assignment Details' },
    { id: 'sec-locality', title: 'Locality Details' },
    { id: 'sec-property', title: 'Property & Boundaries' },
    { id: 'sec-specifications', title: 'Specifications' },
    { id: 'sec-policy', title: 'Policy Checks' },
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
    const p = (prefill || {}) as any;

    return {
      // Header / Meta
      applicationNo: projectCode || '',
      dateOfTechnicalVisit: visitDate,
      customerName: p.ownerName || p.applicantName || '',
      contactNo: p.contactPhone || '',
      productCategory: 'SME / Commercial Mortgage',
      purposeOfValuation: 'Fair Market Value for SME Mortgage Credit',
      ownershipAsPerDocs: p.ownerName || p.applicantName || '',
      leaseOrFreehold: 'Freehold',
      occupationStatus: 'Occupied',
      documentsProvided: '',
      propertyAddressActual: p.propertyAddress || '',
      propertyAddressDocs: p.propertyAddress || '',
      pincode: '',
      subRegistrarOffice: '',
      allocatedBy: '',

      // Locality Details
      localityType: '',
      localityClass: '',
      developmentPercentage: '',
      distanceFromBranch: '',
      nearestRailway: '',
      nearestBus: '',
      nearestHospital: '',
      approachRoadWidth: '',
      approachRoadType: 'Bitumen Road',
      landmark: p.nearestLandmark || '',
      seismicZone: 'Zone III',
      floodZone: 'Safe / Non-flood',
      cycloneZone: 'Moderate',
      negativesToLocality: 'None observed',
      basicAmenitiesAvailable: 'Yes',

      // Property & Boundaries
      landAreaSqft: '',
      landAreaSqm: '',
      landAreaSqyd: '',
      propertyUsage: 'Commercial Building',
      natureOfConstruction: 'RCC Framed Structure',
      propertyAge: '',
      residualAge: '',
      occupantName: '',
      occupancyStatusDetailed: '',
      plotDemarcated: 'Yes',
      propertyIdentifiedThrough: '',
      dimensionNorthDoc: '',
      boundaryNorthDeed: '',
      boundaryNorthActual: '',
      dimensionSouthDoc: '',
      boundarySouthDeed: '',
      boundarySouthActual: '',
      dimensionEastDoc: '',
      boundaryEastDeed: '',
      boundaryEastActual: '',
      dimensionWestDoc: '',
      boundaryWestDeed: '',
      boundaryWestActual: '',
      stageOfConstruction: '100% Completed',
      workCompletePercentage: '100',
      buaGF: '',
      buaFF: '',
      buaSF: '',
      totalBUA: '',

      // Specifications
      structureType: 'RCC Framed Structure',
      foundationType: 'Column & Footing',
      roofType: 'RCC Slab',
      flooringType: 'Vitrified Tiles',
      qualityExterior: 'Good',
      qualityInterior: 'Good',
      maintenanceLevel: 'Good',
      setbackFront: '',
      setbackBack: '',
      setbackSides: '',
      adherenceSanction: '',

      // Policy Checks
      checkAge45: 'No',
      checkDevelopment30: 'No',
      checkAreaMismatch20: 'No',
      checkValuerSelfie: 'Yes',
      checkRoadUnder5Ft: 'No',
      checkDirectAccess: 'Yes',

      // Valuation
      dlcRate: '',
      marketLandRate: '',
      constructionRate: '',
      marketValue: '',
      distressValue: '',
      conservativeValue: '',
      insurableValue: '',
      priceConfirmFrom: '',
      dealerContact: '',
      marketabilityRating: 'Good',

      // Coordinates
      latitude: p.latitude || '',
      longitude: p.longitude || '',

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

      if (['landAreaSqft', 'dlcRate', 'marketLandRate', 'totalBUA', 'constructionRate'].includes(name)) {
        const lArea = parseFloat(name === 'landAreaSqft' ? value : updated.landAreaSqft) || 0;
        const mRate = parseFloat(name === 'marketLandRate' ? value : updated.marketLandRate) || 0;
        const bua = parseFloat(name === 'totalBUA' ? value : updated.totalBUA) || 0;
        const cRate = parseFloat(name === 'constructionRate' ? value : updated.constructionRate) || 0;

        const landVal = lArea * mRate;
        const bldVal = bua * cRate;
        const total = landVal + bldVal;
        const distress = Math.round(total * 0.80);
        const conservative = Math.round(total * 0.90);
        const insurable = Math.round(bldVal);

        updated.marketValue = String(total);
        updated.distressValue = String(distress);
        updated.conservativeValue = String(conservative);
        updated.insurableValue = String(insurable);
      }

      return updated;
    });
  }, []);

  const totalMarketValueNum = useMemo(() => {
    const lArea = parseFloat(fields.landAreaSqft) || 0;
    const mRate = parseFloat(fields.marketLandRate) || 0;
    const bua = parseFloat(fields.totalBUA) || 0;
    const cRate = parseFloat(fields.constructionRate) || 0;
    return lArea * mRate + bua * cRate;
  }, [fields.landAreaSqft, fields.marketLandRate, fields.totalBUA, fields.constructionRate]);

  const distressSaleValueNum = useMemo(() => {
    return Math.round(totalMarketValueNum * 0.80);
  }, [totalMarketValueNum]);

  const conservativeValueNum = useMemo(() => {
    return Math.round(totalMarketValueNum * 0.90);
  }, [totalMarketValueNum]);

  const insurableValueNum = useMemo(() => {
    const bua = parseFloat(fields.totalBUA) || 0;
    const cRate = parseFloat(fields.constructionRate) || 0;
    return Math.round(bua * cRate);
  }, [fields.totalBUA, fields.constructionRate]);

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
    if (!confirm('Are you sure you want to finalize and submit this valuation report for AU Small Finance Bank?')) return;
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
    const renderer = new PDFAUSmallFinanceBankRenderer({ ...fields, projectCode });
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
      a.download = `Valuation_Report_AU_SFB_${projectCode || fields.customerName || 'Draft'}.pdf`;
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
        const fileName = `au_doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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
      const fileName = `au_map_${mapField}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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
        const fileName = `au_photo_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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
        {/* Standardized Universal Bank Report Header */}
        <BankReportHeader
          clientType="organisation"
          bankName="AU SMALL FINANCE BANK"
          subclass="Standard / Retail & SME Mortgages"
          onResetWizard={onResetWizard}
          title="Valuation Report Builder"
          description="Comprehensive retail mortgages, SME lending, and commercial valuation format for AU Small Finance Bank."
          earliestVisit={earliestVisit}
          projectCode={projectCode}
          status={status}
          message={message}
        />

        {/* ══════════════════════════════════════════
            SECTION 1: ASSIGNMENT & CUSTOMER DETAILS
            ══════════════════════════════════════════ */}
        <Section id="sec-assignment" number={1} title="Information Shared During Assignment of Valuation">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Application Number *">
              <input
                type="text"
                value={fields.applicationNo || ''}
                onChange={(e) => updateField('applicationNo', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="AU-VAL-2026-001"
              />
            </Field>

            <Field label="Date of Technical Visit *">
              <input
                type="text"
                value={fields.dateOfTechnicalVisit || ''}
                onChange={(e) => updateField('dateOfTechnicalVisit', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Name of Customer / Co-Applicant *">
              <input
                type="text"
                value={fields.customerName || ''}
                onChange={(e) => updateField('customerName', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Name of customer"
              />
            </Field>

            <Field label="Contact Number *">
              <input
                type="text"
                value={fields.contactNo || ''}
                onChange={(e) => updateField('contactNo', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Mobile number"
              />
            </Field>

            <Field label="Product Category *">
              <select
                value={fields.productCategory || ''}
                onChange={(e) => updateField('productCategory', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="SME / Commercial Mortgage">SME / Commercial Mortgage</option>
                <option value="Home Loan / Retail Mortgage">Home Loan / Retail Mortgage</option>
                <option value="Loan Against Property (LAP)">Loan Against Property (LAP)</option>
                <option value="Gram Samridhi / Agri Asset">Gram Samridhi / Agri Asset</option>
              </select>
            </Field>

            <Field label="Purpose of Valuation *">
              <input
                type="text"
                value={fields.purposeOfValuation || ''}
                onChange={(e) => updateField('purposeOfValuation', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Ownership as per Documents *">
              <input
                type="text"
                value={fields.ownershipAsPerDocs || ''}
                onChange={(e) => updateField('ownershipAsPerDocs', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Leasehold / Freehold *">
              <select
                value={fields.leaseOrFreehold || ''}
                onChange={(e) => updateField('leaseOrFreehold', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Freehold">Freehold</option>
                <option value="Leasehold">Leasehold</option>
              </select>
            </Field>

            <Field label="Occupation Status *">
              <select
                value={fields.occupationStatus || ''}
                onChange={(e) => updateField('occupationStatus', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Occupied by Relative / Commercial Use">Occupied by Relative / Commercial Use</option>
                <option value="Self Occupied">Self Occupied</option>
                <option value="Rented">Rented</option>
                <option value="Vacant">Vacant</option>
                <option value="Partly Self Partly Rented">Partly Self Partly Rented</option>
              </select>
            </Field>

            <Field label="Pincode *">
              <input
                type="text"
                value={fields.pincode || ''}
                onChange={(e) => updateField('pincode', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="769001"
              />
            </Field>

            <Field label="Sub Registrar Office">
              <input
                type="text"
                value={fields.subRegistrarOffice || ''}
                onChange={(e) => updateField('subRegistrarOffice', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Panposh / Rourkela"
              />
            </Field>

            <Field label="Allocated by (RO / BM)">
              <input
                type="text"
                value={fields.allocatedBy || ''}
                onChange={(e) => updateField('allocatedBy', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="AU Branch / RO name"
              />
            </Field>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Documents Provided for Valuation *">
                <input
                  type="text"
                  value={fields.documentsProvided || ''}
                  onChange={(e) => updateField('documentsProvided', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                  placeholder="Copy of Sale deed, ROR, Approved Plan, Layout sketch map"
                />
              </Field>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Property Address (as per actual) *">
                <textarea
                  rows={2}
                  value={fields.propertyAddressActual || ''}
                  onChange={(e) => updateField('propertyAddressActual', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                  placeholder="Plot no, Khata no, Mouza, Landmark, District, State, PIN"
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
                  placeholder="Address as recorded in legal sale deed / title document"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 2: LOCALITY DETAILS
            ══════════════════════════════════════════ */}
        <Section id="sec-locality" number={2} title="Locality Details">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Type of Locality *">
              <select
                value={fields.localityType || ''}
                onChange={(e) => updateField('localityType', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Commercial / Semi-Commercial Hub">Commercial / Semi-Commercial Hub</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Mixed Commercial + Residential">Mixed Commercial + Residential</option>
                <option value="Industrial">Industrial</option>
                <option value="Agricultural">Agricultural</option>
              </select>
            </Field>

            <Field label="Locality Classification">
              <select
                value={fields.localityClass || ''}
                onChange={(e) => updateField('localityClass', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Middle Class / Commercial Belt">Middle Class / Commercial Belt</option>
                <option value="Lower Class">Lower Class</option>
                <option value="Middle Class">Middle Class</option>
                <option value="Upper Middle Class">Upper Middle Class</option>
              </select>
            </Field>

            <Field label="Total Development in Locality (%)">
              <input
                type="text"
                value={fields.developmentPercentage || ''}
                onChange={(e) => updateField('developmentPercentage', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="80"
              />
            </Field>

            <Field label="Distance from AU Base Branch (KM)">
              <input
                type="text"
                value={fields.distanceFromBranch || ''}
                onChange={(e) => updateField('distanceFromBranch', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="0.9"
              />
            </Field>

            <Field label="Nearest Railway Station">
              <input
                type="text"
                value={fields.nearestRailway || ''}
                onChange={(e) => updateField('nearestRailway', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Rourkela Station (2.5 KM)"
              />
            </Field>

            <Field label="Nearest Bus Stand">
              <input
                type="text"
                value={fields.nearestBus || ''}
                onChange={(e) => updateField('nearestBus', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Panposh Bus Stand (1.0 KM)"
              />
            </Field>

            <Field label="Nearest Hospital">
              <input
                type="text"
                value={fields.nearestHospital || ''}
                onChange={(e) => updateField('nearestHospital', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Verma Eye Hospital (0.1 KM)"
              />
            </Field>

            <Field label="Approach Road Width (ft)">
              <input
                type="text"
                value={fields.approachRoadWidth || ''}
                onChange={(e) => updateField('approachRoadWidth', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="40"
              />
            </Field>

            <Field label="Approach Road Type">
              <select
                value={fields.approachRoadType || ''}
                onChange={(e) => updateField('approachRoadType', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Bitumen Road">Bitumen Road</option>
                <option value="Cemented Road">Cemented Road</option>
                <option value="Gravel Road">Gravel Road</option>
              </select>
            </Field>

            <Field label="Nearby Landmark">
              <input
                type="text"
                value={fields.landmark || ''}
                onChange={(e) => updateField('landmark', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Prominent landmark"
              />
            </Field>

            <Field label="Seismic Zone">
              <input
                type="text"
                value={fields.seismicZone || ''}
                onChange={(e) => updateField('seismicZone', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Zone III"
              />
            </Field>

            <Field label="Flood Zone Status">
              <input
                type="text"
                value={fields.floodZone || ''}
                onChange={(e) => updateField('floodZone', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Safe / Non-flood"
              />
            </Field>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Any Negative to Locality">
                <input
                  type="text"
                  value={fields.negativesToLocality || ''}
                  onChange={(e) => updateField('negativesToLocality', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                  placeholder="Crematoriums, slums, riot prone, gases, high tension lines etc."
                />
              </Field>
            </div>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Basic Amenities Availability">
                <input
                  type="text"
                  value={fields.basicAmenitiesAvailable || ''}
                  onChange={(e) => updateField('basicAmenitiesAvailable', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                  placeholder="Water, electricity, road, sewerage, telecommunication"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 3: PROPERTY DETAILS, DIMENSIONS & BOUNDARIES
            ══════════════════════════════════════════ */}
        <Section id="sec-property" number={3} title="Property Details, Dimensions & Boundaries">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Area of Land (Sq. ft) *">
              <input
                type="text"
                value={fields.landAreaSqft || ''}
                onChange={(e) => updateField('landAreaSqft', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="2395"
              />
            </Field>

            <Field label="Area of Land (Sq. m)">
              <input
                type="text"
                value={fields.landAreaSqm || ''}
                onChange={(e) => updateField('landAreaSqm', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="222.5"
              />
            </Field>

            <Field label="Area of Land (Sq. yd)">
              <input
                type="text"
                value={fields.landAreaSqyd || ''}
                onChange={(e) => updateField('landAreaSqyd', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="266.11"
              />
            </Field>

            <Field label="Usage of Property">
              <input
                type="text"
                value={fields.propertyUsage || ''}
                onChange={(e) => updateField('propertyUsage', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Commercial / Mixed / Residential"
              />
            </Field>

            <Field label="Nature of Construction">
              <input
                type="text"
                value={fields.natureOfConstruction || ''}
                onChange={(e) => updateField('natureOfConstruction', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="RCC Framed Structure (G+2)"
              />
            </Field>

            <Field label="Age of Property (Years)">
              <input
                type="text"
                value={fields.propertyAge || ''}
                onChange={(e) => updateField('propertyAge', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="10"
              />
            </Field>

            <Field label="Residual Age of Property (Years)">
              <input
                type="text"
                value={fields.residualAge || ''}
                onChange={(e) => updateField('residualAge', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="50"
              />
            </Field>

            <Field label="Occupant Name">
              <input
                type="text"
                value={fields.occupantName || ''}
                onChange={(e) => updateField('occupantName', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Relative / Tenant / Self"
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
                placeholder="Boundary verification, ROR, Sale Deed"
              />
            </Field>

            <Field label="Stage of Construction">
              <input
                type="text"
                value={fields.stageOfConstruction || ''}
                onChange={(e) => updateField('stageOfConstruction', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="100% Completed"
              />
            </Field>

            <Field label="Work Complete (%)">
              <input
                type="text"
                value={fields.workCompletePercentage || ''}
                onChange={(e) => updateField('workCompletePercentage', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="100"
              />
            </Field>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-amber-600 mb-3">
              Dimensions & Boundaries Schedule (As per Deed vs Actual at Site)
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="py-2.5 px-4 font-semibold">Side</th>
                    <th className="py-2.5 px-4 font-semibold">Dimension (Doc)</th>
                    <th className="py-2.5 px-4 font-semibold">Boundary (Deed)</th>
                    <th className="py-2.5 px-4 font-semibold">Actual at Site</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">North</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.dimensionNorthDoc || ''}
                        onChange={(e) => updateField('dimensionNorthDoc', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                        placeholder="50 ft"
                      />
                    </td>
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
                        value={fields.dimensionSouthDoc || ''}
                        onChange={(e) => updateField('dimensionSouthDoc', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                        placeholder="50 ft"
                      />
                    </td>
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
                  <tr>
                    <td className="py-2.5 px-4 font-medium text-slate-700">East</td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        value={fields.dimensionEastDoc || ''}
                        onChange={(e) => updateField('dimensionEastDoc', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                        placeholder="48 ft"
                      />
                    </td>
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
                        value={fields.dimensionWestDoc || ''}
                        onChange={(e) => updateField('dimensionWestDoc', e.target.value)}
                        disabled={isReadOnly}
                        className={inputCls}
                        placeholder="48 ft"
                      />
                    </td>
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
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Field label="GF BUA (Sq. ft)">
              <input
                type="text"
                value={fields.buaGF || ''}
                onChange={(e) => updateField('buaGF', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="1200"
              />
            </Field>

            <Field label="FF BUA (Sq. ft)">
              <input
                type="text"
                value={fields.buaFF || ''}
                onChange={(e) => updateField('buaFF', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="1200"
              />
            </Field>

            <Field label="SF BUA (Sq. ft)">
              <input
                type="text"
                value={fields.buaSF || ''}
                onChange={(e) => updateField('buaSF', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="1082"
              />
            </Field>

            <Field label="Total BUA (Sq. ft) *">
              <input
                type="text"
                value={fields.totalBUA || ''}
                onChange={(e) => updateField('totalBUA', e.target.value)}
                disabled={isReadOnly}
                className={`${inputCls} font-bold text-slate-800`}
                placeholder="3482"
              />
            </Field>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 4: SPECIFICATION & MAINTENANCE
            ══════════════════════════════════════════ */}
        <Section id="sec-specifications" number={4} title="Specification & Maintenance">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Structure Type *">
              <input
                type="text"
                value={fields.structureType || ''}
                onChange={(e) => updateField('structureType', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="RCC Framed Structure (G+2 Floors)"
              />
            </Field>

            <Field label="Foundation Type">
              <input
                type="text"
                value={fields.foundationType || ''}
                onChange={(e) => updateField('foundationType', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Column & Footing"
              />
            </Field>

            <Field label="Roof Type">
              <input
                type="text"
                value={fields.roofType || ''}
                onChange={(e) => updateField('roofType', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="RCC Slab"
              />
            </Field>

            <Field label="Flooring Type">
              <input
                type="text"
                value={fields.flooringType || ''}
                onChange={(e) => updateField('flooringType', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Vitrified Tiles & Kota Stone"
              />
            </Field>

            <Field label="Quality of Construction (Exterior)">
              <select
                value={fields.qualityExterior || ''}
                onChange={(e) => updateField('qualityExterior', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            <Field label="Quality of Construction (Interior)">
              <select
                value={fields.qualityInterior || ''}
                onChange={(e) => updateField('qualityInterior', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            <Field label="Maintenance Level">
              <select
                value={fields.maintenanceLevel || ''}
                onChange={(e) => updateField('maintenanceLevel', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Well Maintained / Good">Well Maintained / Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            <Field label="Setback Front">
              <input
                type="text"
                value={fields.setbackFront || ''}
                onChange={(e) => updateField('setbackFront', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="10 ft"
              />
            </Field>

            <Field label="Setback Back & Sides">
              <input
                type="text"
                value={fields.setbackSides || ''}
                onChange={(e) => updateField('setbackSides', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Back: 5ft | Sides: 3ft"
              />
            </Field>

            <div className="md:col-span-2 lg:col-span-3">
              <Field label="Adherence to Sanction Plan / Byelaws">
                <input
                  type="text"
                  value={fields.adherenceSanction || ''}
                  onChange={(e) => updateField('adherenceSanction', e.target.value)}
                  disabled={isReadOnly}
                  className={inputCls}
                  placeholder="Constructed generally in adherence to local municipal building byelaws"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 5: POLICY CHECKS & NEGATIVE TRIGGERS
            ══════════════════════════════════════════ */}
        <Section id="sec-policy" number={5} title="Policy Checks & Negative Triggers">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Field label="Age > 45 Years Check">
              <input
                type="text"
                value={fields.checkAge45 || ''}
                onChange={(e) => updateField('checkAge45', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Development < 30% Check">
              <input
                type="text"
                value={fields.checkDevelopment30 || ''}
                onChange={(e) => updateField('checkDevelopment30', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Legal vs Actual Mismatch > 20%">
              <input
                type="text"
                value={fields.checkAreaMismatch20 || ''}
                onChange={(e) => updateField('checkAreaMismatch20', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Valuer Selfie Available at Site *">
              <input
                type="text"
                value={fields.checkValuerSelfie || ''}
                onChange={(e) => updateField('checkValuerSelfie', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Approach Road Under 5 Ft Check">
              <input
                type="text"
                value={fields.checkRoadUnder5Ft || ''}
                onChange={(e) => updateField('checkRoadUnder5Ft', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Direct Access Available">
              <input
                type="text"
                value={fields.checkDirectAccess || ''}
                onChange={(e) => updateField('checkDirectAccess', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>
          </div>
        </Section>

        {/* ══════════════════════════════════════════
            SECTION 6: VALUATION COMPUTATION & COSTING
            ══════════════════════════════════════════ */}
        <Section id="sec-valuation" number={6} title="Valuation Computation & Costing">
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
                  <td className="py-2.5 px-4 font-medium text-slate-700">Land Component (DLC Govt. Value)</td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={fields.landAreaSqft ?? ''}
                      onChange={(e) => updateField('landAreaSqft', e.target.value)}
                      disabled={isReadOnly}
                      className={inputCls}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={fields.dlcRate ?? ''}
                      onChange={(e) => updateField('dlcRate', e.target.value)}
                      disabled={isReadOnly}
                      className={inputCls}
                    />
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-600">
                    ₹ {formatIndianCurrency((parseFloat(fields.landAreaSqft) || 0) * (parseFloat(fields.dlcRate) || 0))}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-700">Land Component (Market Rate adopted)</td>
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    {fields.landAreaSqft} Sq.ft
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={fields.marketLandRate ?? ''}
                      onChange={(e) => updateField('marketLandRate', e.target.value)}
                      disabled={isReadOnly}
                      className={inputCls}
                    />
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600">
                    ₹ {formatIndianCurrency((parseFloat(fields.landAreaSqft) || 0) * (parseFloat(fields.marketLandRate) || 0))}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-700">Building Construction (G+2 Total BUA)</td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={fields.totalBUA ?? ''}
                      onChange={(e) => updateField('totalBUA', e.target.value)}
                      disabled={isReadOnly}
                      className={inputCls}
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="number"
                      value={fields.constructionRate ?? ''}
                      onChange={(e) => updateField('constructionRate', e.target.value)}
                      disabled={isReadOnly}
                      className={inputCls}
                    />
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-emerald-600">
                    ₹ {formatIndianCurrency((parseFloat(fields.totalBUA) || 0) * (parseFloat(fields.constructionRate) || 0))}
                  </td>
                </tr>
                <tr className="bg-amber-50 font-bold border-t-2 border-amber-300">
                  <td className="py-3 px-4 text-amber-900" colSpan={3}>
                    TOTAL FAIR MARKET VALUE OF PROPERTY
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <Field label="Fair Market Value (Rs.) *">
              <input
                type="text"
                value={`₹ ${formatIndianCurrency(totalMarketValueNum)}`}
                readOnly
                className={`${inputCls} bg-slate-100 font-bold text-emerald-700`}
              />
            </Field>

            <Field label="QSV / Distress Value (80%) *">
              <input
                type="text"
                value={`₹ ${formatIndianCurrency(distressSaleValueNum)}`}
                readOnly
                className={`${inputCls} bg-slate-100 font-bold text-amber-700`}
              />
            </Field>

            <Field label="Conservative Value (90%)">
              <input
                type="text"
                value={`₹ ${formatIndianCurrency(conservativeValueNum)}`}
                readOnly
                className={`${inputCls} bg-slate-100 font-bold text-blue-700`}
              />
            </Field>

            <Field label="Insurable Value (Rs.)">
              <input
                type="text"
                value={`₹ ${formatIndianCurrency(insurableValueNum)}`}
                readOnly
                className={`${inputCls} bg-slate-100 font-bold text-cyan-700`}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Field label="Price Confirmed From">
              <input
                type="text"
                value={fields.priceConfirmFrom || ''}
                onChange={(e) => updateField('priceConfirmFrom', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Local Realtor / Dealer Contact">
              <input
                type="text"
                value={fields.dealerContact || ''}
                onChange={(e) => updateField('dealerContact', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
              />
            </Field>

            <Field label="Marketability Rating">
              <select
                value={fields.marketabilityRating || ''}
                onChange={(e) => updateField('marketabilityRating', e.target.value)}
                disabled={isReadOnly}
                className={selectCls}
              >
                <option value="Good (Prime location near Verma Eye Hospital)">Good (Prime location)</option>
                <option value="Excellent">Excellent</option>
                <option value="Average">Average</option>
                <option value="Below Average">Below Average</option>
              </select>
            </Field>
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
          latitude={fields.latitude || '22.227415'}
          longitude={fields.longitude || '84.853612'}
          technicalAddress={fields.propertyAddressActual || ''}
          propertyAddress={fields.propertyAddressDocs || fields.propertyAddressActual || ''}
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
