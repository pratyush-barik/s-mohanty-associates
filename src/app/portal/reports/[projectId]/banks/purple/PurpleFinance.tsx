'use client';

import { sanitizeFilenameCode } from '@/lib/utils';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
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
  getEarliestFieldVisit,
  BasePhotoBucketModal,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFPurpleFinanceRenderer } from '@/lib/banks/pdf-purple-finance-renderer';

export const PURPLE_FINANCE_CONFIG: BankConfig = {
  bankId: 'PURPLE FINANCE',
  subTemplateId: '',
  displayName: 'Purple Finance Ltd',
  defaultValues: {
    purpose: 'Bungalow / Individual House / Resale Valuation',
  },
};

export interface PurpleFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function PurpleFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: PurpleFinanceProps) {
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
    { id: 'sec-customer', title: 'Customer & App Details' },
    { id: 'sec-property', title: 'Property & Locality' },
    { id: 'sec-approval', title: 'Approval Details' },
    { id: 'sec-construction', title: 'Construction Details' },
    { id: 'sec-valuation', title: 'Valuation & Rates' },
    { id: 'sec-remarks', title: 'Remarks & Undertaking' },
    { id: 'sec-documents', title: 'Documents' },
    { id: 'sec-maps', title: 'Maps' },
    { id: 'sec-photographs', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initial Fields with smart prefill fallback
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}), refNo: rawInitialFields?.refNo || projectCode || '' };
    const p = (prefill || {}) as any;

    // Header & Meta Details
    if (!d.valuationDate) d.valuationDate = earliestVisit ? formatReportDate(earliestVisit.date) : '';

    // 1. Customer Details
    if (!d.customerName) d.customerName = p.applicantName || '';
    if (!d.customerContact) {
      d.customerContact = p.contactName
        ? `${p.contactName}${p.contactPhone ? `, Mob-${p.contactPhone}` : ''}`
        : (p.contactPhone ? `Mob-${p.contactPhone}` : '');
    }
    if (!d.appId) d.appId = '';
    if (!d.documentsProvided) d.documentsProvided = '';

    // 2. Property Identification & Locality Details
    if (!d.propertyDetails) {
      d.propertyDetails = p.propertyAddress || '';
    }
    if (!d.plotNo) d.plotNo = '';
    if (!d.khataNo) d.khataNo = '';
    if (!d.locality) d.locality = '';
    if (!d.roadWidth) d.roadWidth = '';
    if (!d.city) d.city = '';
    if (!d.district) d.district = '';
    if (!d.pincode) d.pincode = '';
    if (!d.nearbyLandmark) d.nearbyLandmark = '';
    if (!d.distanceFromCityCenter) d.distanceFromCityCenter = '';
    if (!d.localTransport) d.localTransport = '';
    if (!d.landLevelCondition) d.landLevelCondition = '';
    if (!d.classOfLocality) d.classOfLocality = '';
    if (!d.qualityInfrastructure) d.qualityInfrastructure = '';

    // Boundaries
    if (!d.boundaryEastDeed) d.boundaryEastDeed = '';
    if (!d.boundaryWestDeed) d.boundaryWestDeed = '';
    if (!d.boundaryNorthDeed) d.boundaryNorthDeed = '';
    if (!d.boundarySouthDeed) d.boundarySouthDeed = '';

    if (!d.boundaryEastActual) d.boundaryEastActual = '';
    if (!d.boundaryWestActual) d.boundaryWestActual = '';
    if (!d.boundaryNorthActual) d.boundaryNorthActual = '';
    if (!d.boundarySouthActual) d.boundarySouthActual = '';

    if (!d.boundariesMatch) d.boundariesMatch = '';
    if (!d.statusOfLand) d.statusOfLand = '';
    if (!d.typeOfProperty) d.typeOfProperty = '';
    if (!d.approvedUsage) d.approvedUsage = '';
    if (!d.actualUsage) d.actualUsage = '';
    if (!d.typeOfStructure) d.typeOfStructure = '';
    if (!d.noOfFloors) d.noOfFloors = '';
    if (!d.occupancyDetails) d.occupancyDetails = '';
    if (!d.utilitiesConnection) d.utilitiesConnection = '';
    if (!d.proximityAmenities) d.proximityAmenities = '';
    if (!d.developmentSurrounding) d.developmentSurrounding = '';

    // Coordinates
    if (!d.latitude) d.latitude = '';
    if (!d.longitude) d.longitude = '';

    // 3. Approval Details
    if (!d.layoutApprovalNo) d.layoutApprovalNo = '';
    if (!d.layoutDateApproval) d.layoutDateApproval = '';
    if (!d.layoutExpiryDate) d.layoutExpiryDate = '';
    if (!d.buildingPlanNo) d.buildingPlanNo = '';
    if (!d.buildingDateApproval) d.buildingDateApproval = '';
    if (!d.buildingExpiryDate) d.buildingExpiryDate = '';
    if (!d.commencementDate) d.commencementDate = '';
    if (!d.expectedCompletion) d.expectedCompletion = '';

    // 4. Construction Details
    if (!d.plotArea) d.plotArea = '';
    if (!d.demarcationAtSite) d.demarcationAtSite = '';
    if (!d.approvedBua) d.approvedBua = '';
    if (!d.measuredBuaTotal) d.measuredBuaTotal = '';
    if (!d.measuredBuaGf) d.measuredBuaGf = '';
    if (!d.constructionAsPerPlan) d.constructionAsPerPlan = '';
    if (!d.extraConstructionDetails) d.extraConstructionDetails = '';

    if (!d.marginFront) d.marginFront = '';
    if (!d.marginRight) d.marginRight = '';
    if (!d.marginLeft) d.marginLeft = '';
    if (!d.marginBack) d.marginBack = '';

    if (!d.qualityOfConstruction) d.qualityOfConstruction = '';
    if (!d.maintenanceOfProperty) d.maintenanceOfProperty = '';
    if (!d.currentLife) d.currentLife = '';
    if (!d.projectedLife) d.projectedLife = '';

    // 5. Valuation & Rates
    if (!d.plotRate) d.plotRate = '';
    if (!d.plotValue) d.plotValue = '';
    if (!d.constAreaRcc) d.constAreaRcc = '';
    if (!d.constRateRcc) d.constRateRcc = '';
    if (!d.constructionValue) d.constructionValue = '';
    if (!d.stageOfConstruction) d.stageOfConstruction = '';
    if (!d.percentWorkCompleted) d.percentWorkCompleted = '';
    if (!d.percentDisbursement) d.percentDisbursement = '';
    if (!d.currentTotalValue) d.currentTotalValue = '';
    if (!d.dateOfVisit) d.dateOfVisit = d.valuationDate || '';
    if (!d.govtReckonerRate) d.govtReckonerRate = '';
    if (!d.distressValue) d.distressValue = '';
    if (!d.rentalValue) d.rentalValue = '';

    // 6. Remarks & Undertaking
    if (!d.photosAttached) d.photosAttached = '';
    if (!d.locationSketchAttached) d.locationSketchAttached = '';
    if (!d.remarks) d.remarks = '';
    if (!d.valuerName) d.valuerName = '';

    // Attachments
    if (!d.documentImages) d.documentImages = [];
    if (!d.documentImageNames) d.documentImageNames = [];
    if (!d.locationMapImages) d.locationMapImages = [];
    if (!d.mouzaMapImages) d.mouzaMapImages = [];
    if (!d.sketchMapImages) d.sketchMapImages = [];
    if (!d.propertyImages) d.propertyImages = [];
    if (!d.propertyImageNames) d.propertyImageNames = [];

    return d;
  });

  const handleChange = useCallback((key: string, value: any) => {
    setFields(prev => {
      const next = { ...prev, [key]: value };

      // Live auto-calculation for Purple Finance Valuation
      if (key === 'plotArea' || key === 'plotRate' || key === 'constAreaRcc' || key === 'constRateRcc') {
        const pArea = parseFloat(String(next.plotArea).replace(/[^0-9.]/g, '')) || 0;
        const pRate = parseFloat(String(next.plotRate).replace(/[^0-9.]/g, '')) || 0;
        const cArea = parseFloat(String(next.constAreaRcc).replace(/[^0-9.]/g, '')) || 0;
        const cRate = parseFloat(String(next.constRateRcc).replace(/[^0-9.]/g, '')) || 0;

        const pVal = Math.round(pArea * pRate);
        const cVal = Math.round(cArea * cRate);
        const total = pVal + cVal;
        const distress = Math.round(total * 0.80);

        next.plotValue = pVal.toString();
        next.constructionValue = cVal.toString();
        next.currentTotalValue = total.toString();
        next.distressValue = distress.toString();
      }

      return next;
    });
  }, []);

  // Save draft action
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: parseFloat(fields.currentTotalValue || 0) || 0,
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

  // Submit action
  const handleSubmitReport = async () => {
    if (!confirm('Are you sure you want to finalize and submit this valuation report?')) return;
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

  // Generate PDF Bytes
  const generatePdfBytes = async (): Promise<Uint8Array> => {
    const renderer = new PDFPurpleFinanceRenderer({ ...fields, projectCode });
    return await renderer.render();
  };

  // Preview PDF action
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

  // Download PDF action
  const handleDownloadPdf = async () => {
    setPreviewing(true);
    try {
      const pdfBytes = await generatePdfBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFilenameCode(`Purple_Finance_Valuation_${fields.refNo || projectCode || 'Report'}.pdf`)}.pdf`;
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

  // Document upload handler
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
        const fileName = `purple_doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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

      setFields(prev => ({
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

  // Map upload handler
  const handleMapUpload = async (mapField: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(mapField);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `purple_map_${mapField}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);

      setFields(prev => ({
        ...prev,
        [mapField]: [...(prev[mapField] || []), urlData.publicUrl],
      }));
    } catch (err: any) {
      alert(`Error uploading map: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Photo upload handler
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
        const fileName = `purple_photo_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
        newNames.push(`Photograph ${((fields.propertyImages || []).length + i + 1)}`);
      }

      setFields(prev => ({
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
      {/* ── Main Form Column ── */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Universal Bank Report Header */}
        <BankReportHeader
          bankName="Purple Finance Ltd"
          subclass="Bungalow / Individual House / Resale"
          formatName="Retail & Mortgage Assets Valuation Format"
          clientType="organisation"
          category="Retail Mortgage"
          serviceType="Valuation Report Builder"
          subjectType="Bungalow / Individual House / Resale"
          onResetWizard={onResetWizard}
          earliestVisit={earliestVisit}
          projectCode={projectCode}
          message={message}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: CUSTOMER & APPLICATION DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Customer & Application Details" number={1} id="sec-customer">
          <div className="grid md:grid-cols-2 gap-4 pb-4 border-b border-slate-100 mb-4">
            <Field label="Ref No:">
              <input
                type="text"
                className={inputCls}
                value={fields.refNo || projectCode || ''}
                placeholder="SMA-YYYY/MM-NNNN"
                disabled={true}
                readOnly={true}
              />
            </Field>

            <Field label="Date:">
              <input
                type="text"
                className={inputCls}
                value={fields.valuationDate || ''}
                onChange={e => handleChange('valuationDate', e.target.value)}
                disabled={isReadOnly}
                placeholder="DD/MM/YYYY"
              />
            </Field>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Field label="1. Name of the Customer">
              <input
                type="text"
                className={`${inputCls} font-semibold text-slate-900`}
                value={fields.customerName || ''}
                onChange={e => handleChange('customerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Customer Contact Details">
              <input
                type="text"
                className={inputCls}
                value={fields.customerContact || ''}
                onChange={e => handleChange('customerContact', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="2. APP ID">
              <input
                type="text"
                className={`${inputCls} font-bold`}
                value={fields.appId || ''}
                onChange={e => handleChange('appId', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="3. Documents Provided: Approved Layout/Plan/ROR">
              <input
                type="text"
                className={inputCls}
                value={fields.documentsProvided || ''}
                onChange={e => handleChange('documentsProvided', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: PROPERTY IDENTIFICATION & LOCALITY
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Property Identification & Locality" number={2} id="sec-property">
          <div className="space-y-6">
            <Field label="4. Property Details (Full Description)">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.propertyDetails || ''}
                onChange={e => handleChange('propertyDetails', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="a. Plot No">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.plotNo || ''}
                  onChange={e => handleChange('plotNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="b. SNo/G.No/Khasra No/Khata No">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.khataNo || ''}
                  onChange={e => handleChange('khataNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="c. Locality">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.locality || ''}
                  onChange={e => handleChange('locality', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="d. Road">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.roadWidth || ''}
                  onChange={e => handleChange('roadWidth', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="e. City">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.city || ''}
                  onChange={e => handleChange('city', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="f. District">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.district || ''}
                  onChange={e => handleChange('district', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="g. Pincode">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.pincode || ''}
                  onChange={e => handleChange('pincode', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="h. Nearby Landmark">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.nearbyLandmark || ''}
                  onChange={e => handleChange('nearbyLandmark', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="i. Distance from City Center">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceFromCityCenter || ''}
                  onChange={e => handleChange('distanceFromCityCenter', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="j. Availability of Local Transport">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.localTransport || ''}
                  onChange={e => handleChange('localTransport', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Taxi, Auto, Bus"
                />
              </Field>

              <Field label="k. Level of land / Topographical condition">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.landLevelCondition || ''}
                  onChange={e => handleChange('landLevelCondition', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="l. Class of Locality">
                <select
                  className={selectCls}
                  value={fields.classOfLocality || 'Middle Class'}
                  onChange={e => handleChange('classOfLocality', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Posh">Posh</option>
                  <option value="Higher Middle Class">Higher Middle Class</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Lower Middle Class">Lower Middle Class</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="m. Quality of Infrastructure">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.qualityInfrastructure || ''}
                  onChange={e => handleChange('qualityInfrastructure', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="p. Status of Land/Flat">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.statusOfLand || ''}
                  onChange={e => handleChange('statusOfLand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="FreeHold / Leased"
                />
              </Field>

              <Field label="q. Type of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfProperty || ''}
                  onChange={e => handleChange('typeOfProperty', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Rowhouse / Bungalow / Flat"
                />
              </Field>

              <Field label="r. Approved usage of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.approvedUsage || ''}
                  onChange={e => handleChange('approvedUsage', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="s. Actual Usage of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.actualUsage || ''}
                  onChange={e => handleChange('actualUsage', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="t. Type of Structure">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfStructure || ''}
                  onChange={e => handleChange('typeOfStructure', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="RCC / Load Bearing"
                />
              </Field>

              <Field label="u. No of Floors">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={e => handleChange('noOfFloors', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="v. Occupancy Details">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.occupancyDetails || ''}
                  onChange={e => handleChange('occupancyDetails', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Self-Occupied / Rented / Vacant"
                />
              </Field>

              <Field label="w. Utilities (Electricity/Water/Drainage)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.utilitiesConnection || ''}
                  onChange={e => handleChange('utilitiesConnection', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="x. Proximity to civic amenities">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.proximityAmenities || ''}
                  onChange={e => handleChange('proximityAmenities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="y. Development of surrounding area">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.developmentSurrounding || ''}
                  onChange={e => handleChange('developmentSurrounding', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="z. Latitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.latitude || ''}
                  onChange={e => handleChange('latitude', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Longitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.longitude || ''}
                  onChange={e => handleChange('longitude', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Boundaries Table (n) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                n. Boundaries of Property (As per Sale Deed vs Actual at Site)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-800">
                  <thead className="bg-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2 text-left">Direction</th>
                      <th className="p-2 text-left">Boundaries as per sale deed</th>
                      <th className="p-2 text-left">Boundaries as per Actual</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 font-bold">East</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryEastDeed || ''} onChange={e => handleChange('boundaryEastDeed', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryEastActual || ''} onChange={e => handleChange('boundaryEastActual', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">West</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryWestDeed || ''} onChange={e => handleChange('boundaryWestDeed', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryWestActual || ''} onChange={e => handleChange('boundaryWestActual', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">North</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryNorthDeed || ''} onChange={e => handleChange('boundaryNorthDeed', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryNorthActual || ''} onChange={e => handleChange('boundaryNorthActual', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">South</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundarySouthDeed || ''} onChange={e => handleChange('boundarySouthDeed', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundarySouthActual || ''} onChange={e => handleChange('boundarySouthActual', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <Field label="o. Does the Boundaries at Site match documentation?">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.boundariesMatch || ''}
                    onChange={e => handleChange('boundariesMatch', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: APPROVAL DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Approval Details" number={3} id="sec-approval">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="5.a Layout Approval No">
              <input
                type="text"
                className={inputCls}
                value={fields.layoutApprovalNo || ''}
                onChange={e => handleChange('layoutApprovalNo', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="b. Date of Approval">
              <input
                type="text"
                className={inputCls}
                value={fields.layoutDateApproval || ''}
                onChange={e => handleChange('layoutDateApproval', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="c. Expiry Date">
              <input
                type="text"
                className={inputCls}
                value={fields.layoutExpiryDate || ''}
                onChange={e => handleChange('layoutExpiryDate', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="d. Building Plan Approval No">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingPlanNo || ''}
                onChange={e => handleChange('buildingPlanNo', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="e. Date of Approval">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingDateApproval || ''}
                onChange={e => handleChange('buildingDateApproval', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="f. Expiry Date">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingExpiryDate || ''}
                onChange={e => handleChange('buildingExpiryDate', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="g. Commencement Date">
              <input
                type="text"
                className={inputCls}
                value={fields.commencementDate || ''}
                onChange={e => handleChange('commencementDate', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="h. Expected Completion">
              <input
                type="text"
                className={inputCls}
                value={fields.expectedCompletion || ''}
                onChange={e => handleChange('expectedCompletion', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: CONSTRUCTION DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Construction & Structural Details" number={4} id="sec-construction">
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="6.a Area of the Plot/flat">
                <input
                  type="text"
                  className={`${inputCls} font-bold`}
                  value={fields.plotArea || ''}
                  onChange={e => handleChange('plotArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 4138 sqft"
                />
              </Field>

              <Field label="b. Demarcation at Site">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.demarcationAtSite || ''}
                  onChange={e => handleChange('demarcationAtSite', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="c. Approved Built up Area">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.approvedBua || ''}
                  onChange={e => handleChange('approvedBua', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="d. Measured Built up Area (Total)">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-slate-900`}
                  value={fields.measuredBuaTotal || ''}
                  onChange={e => handleChange('measuredBuaTotal', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Measured BUA Breakup (G.F.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.measuredBuaGf || ''}
                    onChange={e => handleChange('measuredBuaGf', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="f. Construction as per plan/byelaws">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionAsPerPlan || ''}
                  onChange={e => handleChange('constructionAsPerPlan', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="g. Details of Extra Construction">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.extraConstructionDetails || ''}
                  onChange={e => handleChange('extraConstructionDetails', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="i. Quality of construction">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.qualityOfConstruction || ''}
                  onChange={e => handleChange('qualityOfConstruction', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="j. Maintenance of Property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.maintenanceOfProperty || ''}
                  onChange={e => handleChange('maintenanceOfProperty', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="k. Current Life of structure">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.currentLife || ''}
                  onChange={e => handleChange('currentLife', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="l. Projected Life of structure">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.projectedLife || ''}
                  onChange={e => handleChange('projectedLife', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Side Margins */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                h. Side Margins (Front, Right, Left, Back)
              </h4>
              <div className="grid md:grid-cols-4 gap-4">
                <Field label="Front">
                  <input type="text" className={inputCls} value={fields.marginFront || ''} onChange={e => handleChange('marginFront', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Right Side">
                  <input type="text" className={inputCls} value={fields.marginRight || ''} onChange={e => handleChange('marginRight', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Left Side">
                  <input type="text" className={inputCls} value={fields.marginLeft || ''} onChange={e => handleChange('marginLeft', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Back Side">
                  <input type="text" className={inputCls} value={fields.marginBack || ''} onChange={e => handleChange('marginBack', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5: VALUATION & RATES
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Valuation & Rates" number={5} id="sec-valuation">
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                7. Recommended Valuation Calculations
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="a. Recommended rate of Plot (Rs/Sqft)">
                  <input
                    type="number"
                    className={`${inputCls} font-bold`}
                    value={fields.plotRate || ''}
                    onChange={e => handleChange('plotRate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="b. Value of the Plot/Flat">
                  <input
                    type="text"
                    className={`${inputCls} font-bold bg-purple-50 text-purple-900`}
                    value={fields.plotValue ? `₹ ${formatIndianCurrency(fields.plotValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Measured RCC BUA (Sqft)">
                  <input
                    type="number"
                    className={`${inputCls} font-bold`}
                    value={fields.constAreaRcc || ''}
                    onChange={e => handleChange('constAreaRcc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="RCC Construction Rate (Rs/Sqft)">
                  <input
                    type="number"
                    className={`${inputCls} font-bold`}
                    value={fields.constRateRcc || ''}
                    onChange={e => handleChange('constRateRcc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="d. Total Cost of Construction">
                  <input
                    type="text"
                    className={`${inputCls} font-bold bg-purple-50 text-purple-900`}
                    value={fields.constructionValue ? `₹ ${formatIndianCurrency(fields.constructionValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Stage of Construction">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.stageOfConstruction || ''}
                    onChange={e => handleChange('stageOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Valuation Summary Card */}
            <div className="bg-purple-500/10 border border-purple-500/30 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                📊 Valuation Summary
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="h. Current Value of Property (Plot + Construction)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-base bg-white text-emerald-700`}
                    value={fields.currentTotalValue ? `₹ ${formatIndianCurrency(fields.currentTotalValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="9. Distressed Valuation (80%)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-base bg-white text-rose-700`}
                    value={fields.distressValue ? `₹ ${formatIndianCurrency(fields.distressValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="8. Valuation as per Govt. Reckoner Rate">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.govtReckonerRate || ''}
                    onChange={e => handleChange('govtReckonerRate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="10. Rental Value Per Month">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.rentalValue || ''}
                    onChange={e => handleChange('rentalValue', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6: REMARKS, UNDERTAKING & SIGNATURES
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Remarks, Undertaking & Declaration" number={6} id="sec-remarks">
          <div className="space-y-6">
            <Field label="12. Remarks:">
              <textarea
                rows={4}
                className={inputCls}
                value={fields.remarks || ''}
                onChange={e => handleChange('remarks', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Undertaking Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed text-justify">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide">
                Undertaking:
              </h4>
              <p>
                I have personally visited the property & identified the same based on the documents provided. I/We have no direct or Indirect Interest in the property being valued.
              </p>
              <p>
                The information furnished above is true and correct to my/our knowledge.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Approved Panel Valuer">
                <input
                  type="text"
                  className={`${inputCls} bg-slate-100 font-semibold`}
                  value={fields.valuerName || 'Er. Satyajit Mohanty Approved Panel Valuer'}
                  readOnly
                  disabled
                />
              </Field>

              <Field label="Authorized Signatory">
                <input
                  type="text"
                  className={`${inputCls} bg-slate-100 font-semibold`}
                  value="Authorized Signatory / Name & Seal of the Agency"
                  readOnly
                  disabled
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 7: DOCUMENTS
        ═══════════════════════════════════════════════════════════════ */}
        <BaseDocumentsSection
          title="Documents"
          sectionNumber={7}
          sectionId="sec-documents"
          documentImages={fields.documentImages || []}
          documentImageNames={fields.documentImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading === 'documents'}
          onUploadDocument={handleDocumentUpload}
          onRemoveDocument={idx => {
            setFields(prev => ({
              ...prev,
              documentImages: (prev.documentImages || []).filter((_: any, i: number) => i !== idx),
              documentImageNames: (prev.documentImageNames || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onDocumentNameChange={(idx, name) => {
            const next = [...(fields.documentImageNames || [])];
            while (next.length <= idx) next.push('');
            next[idx] = name;
            handleChange('documentImageNames', next);
          }}
          onReorderDocuments={(newImages, newNames) => {
            setFields(prev => ({
              ...prev,
              documentImages: newImages,
              documentImageNames: newNames,
            }));
          }}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 8: MAPS
        ═══════════════════════════════════════════════════════════════ */}
        <BaseMapsSection
          title="Maps"
          sectionNumber={8}
          sectionId="sec-maps"
          latitude={fields.latitude || '19.785472'}
          longitude={fields.longitude || '85.611083'}
          technicalAddress={fields.propertyDetails || ''}
          propertyAddress={fields.propertyDetails || ''}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Property Coordinates"
          locationMapImages={fields.locationMapImages || []}
          mouzaMapImages={fields.mouzaMapImages || []}
          sketchMapImages={fields.sketchMapImages || []}
          isReadOnly={isReadOnly}
          uploading={typeof uploading === 'string' && uploading.includes('Map')}
          onLocationMapUpload={e => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={idx => {
            setFields(prev => ({
              ...prev,
              locationMapImages: (prev.locationMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onMouzaMapUpload={e => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={idx => {
            setFields(prev => ({
              ...prev,
              mouzaMapImages: (prev.mouzaMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onSketchMapUpload={e => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={idx => {
            setFields(prev => ({
              ...prev,
              sketchMapImages: (prev.sketchMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onReorderLocationMap={newImgs => handleChange('locationMapImages', newImgs)}
          onReorderMouzaMap={newImgs => handleChange('mouzaMapImages', newImgs)}
          onReorderSketchMap={newImgs => handleChange('sketchMapImages', newImgs)}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 9: PHOTOGRAPHS
        ═══════════════════════════════════════════════════════════════ */}
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
            handleChange('propertyImageNames', next);
          }}
          onRemoveImage={idx => {
            setFields(prev => ({
              ...prev,
              propertyImages: (prev.propertyImages || []).filter((_: any, i: number) => i !== idx),
              propertyImageNames: (prev.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onReorderImages={(newImages, newNames) => {
            setFields(prev => ({
              ...prev,
              propertyImages: newImages,
              propertyImageNames: newNames,
            }));
          }}
          onUploadImages={handlePhotoUpload}
          onOpenBucketPicker={() => setShowBucketModal(true)}
        />

        {/* ═══════════════════════════════════════════════════════════════
            REPORT ACTION BAR
        ═══════════════════════════════════════════════════════════════ */}
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
            setFields(prev => ({
              ...prev,
              propertyImages: [...(prev.propertyImages || []), ...selectedUrls],
              propertyImageNames: [
                ...(prev.propertyImageNames || []),
                ...selectedUrls.map((_, i) => `Photograph ${((prev.propertyImages || []).length + i + 1)}`),
              ],
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
