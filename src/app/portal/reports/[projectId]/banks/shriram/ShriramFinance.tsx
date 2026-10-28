'use client';

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
import { PDFShriramFinanceRenderer } from '@/lib/banks/pdf-shriram-finance-renderer';

export const SHRIRAM_FINANCE_CONFIG: BankConfig = {
  bankId: 'SHRIRAM FINANCE',
  subTemplateId: '',
  displayName: 'Shriram Finance Ltd',
  defaultValues: {
    purpose: 'Standard Valuation / NPA / Retail & Commercial Housing',
  },
};

export interface ShriramFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function ShriramFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: ShriramFinanceProps) {
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
    { id: 'sec-basic', title: 'Basic Details' },
    { id: 'sec-surrounding', title: 'Surrounding & Locality' },
    { id: 'sec-property', title: 'Property Details' },
    { id: 'sec-sanction', title: 'Sanction Plan & Approvals' },
    { id: 'sec-valuation', title: 'Valuation' },
    { id: 'sec-boundaries', title: 'Boundaries & Declaration' },
    { id: 'sec-documents', title: 'Documents' },
    { id: 'sec-maps', title: 'Maps' },
    { id: 'sec-photographs', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initial Fields with smart prefill fallback
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // Header & Meta Details
    if (!d.branchName) d.branchName = 'Bhubaneswar';
    if (!d.typeOfCase) d.typeOfCase = 'NPA';
    if (!d.valuerName) d.valuerName = 'Er. Satyajit Mohanty';
    if (!d.dateOfVisit) d.dateOfVisit = earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date());
    if (!d.refNo) d.refNo = d.caseRefNo || projectCode || '';
    if (!d.caseRefNo) d.caseRefNo = d.refNo;
    if (!d.dateOfReport) d.dateOfReport = formatReportDate(new Date());
    if (!d.contactPersonInspection) {
      d.contactPersonInspection = p.contactName
        ? `${p.contactName}${p.contactPhone ? `, Mob:- ${p.contactPhone}` : ''}`
        : '';
    }

    // 1. Basic Details
    if (!d.applicantName) d.applicantName = p.applicantName || '';
    if (!d.propertyType) d.propertyType = 'Residential Flat';
    if (!d.currentUsage) d.currentUsage = 'Vacant';
    if (!d.addressAtSite) d.addressAtSite = p.propertyAddress || '';
    if (!d.addressAsPerDocument) d.addressAsPerDocument = d.addressAtSite;
    if (!d.previousValuation) d.previousValuation = 'No';

    // 2. Surrounding & Locality Details
    if (!d.localityType) d.localityType = 'Residential';
    if (!d.localityClass) d.localityClass = 'Middle Class';
    if (!d.siteDevStatus) d.siteDevStatus = 'Developed';
    if (!d.proximityCivicAmenities) d.proximityCivicAmenities = '';
    if (!d.railwayStationDistance) d.railwayStationDistance = '';
    if (!d.busStopDistance) d.busStopDistance = '';
    if (!d.vicinityLandmark) d.vicinityLandmark = p.nearestLandmark || '';
    if (!d.distanceFromCityCenter) d.distanceFromCityCenter = '';
    if (!d.approachRoad) d.approachRoad = '';

    // 3. Property Details
    if (!d.occupancyStatus) d.occupancyStatus = '';
    if (!d.occupantName) d.occupantName = '';
    if (!d.occupantRelation) d.occupantRelation = '';
    if (!d.propertyDemarcation) d.propertyDemarcation = '';
    if (!d.propertyIdentifiedThrough) d.propertyIdentifiedThrough = d.contactPersonInspection;

    if (!d.structureType) d.structureType = 'RCC framed structure';
    if (!d.plotAreaUds) d.plotAreaUds = 'NA';
    if (!d.noOfBlocks) d.noOfBlocks = '';
    if (!d.noOfUnits) d.noOfUnits = '';
    if (!d.noOfFloors) d.noOfFloors = '';
    if (!d.noOfLifts) d.noOfLifts = '';

    if (!d.floorNo) d.floorNo = '';
    if (!d.noOfRooms) d.noOfRooms = '';
    if (!d.builtUpAreaSbua) d.builtUpAreaSbua = '';
    if (!d.carpetArea) d.carpetArea = '';
    if (!d.viewRemarks) d.viewRemarks = 'NA';

    if (!d.constructionQualityExterior) d.constructionQualityExterior = 'Good';
    if (!d.constructionQualityInterior) d.constructionQualityInterior = 'Good';
    if (!d.propertyAge) d.propertyAge = 'Under construction';
    if (!d.residualLife) d.residualLife = '60-Years';

    // 4. Sanction Plan & Documents Details
    if (!d.sanctionPlanNo) d.sanctionPlanNo = '';
    if (!d.ownershipType) d.ownershipType = 'Freehold';
    if (!d.documentsVerified) d.documentsVerified = 'Copy of Agreement for sale & Allotment letter';
    if (!d.withinMunicipalLimits) d.withinMunicipalLimits = 'No(Within BDA limit)';
    if (!d.permissibleUsage) d.permissibleUsage = 'Residential';

    // Setbacks
    if (!d.setbackFrontPlan) d.setbackFrontPlan = 'N.A';
    if (!d.setbackFrontSite) d.setbackFrontSite = 'N.A';
    if (!d.setbackFrontDev) d.setbackFrontDev = 'Nil';
    if (!d.setbackFrontRemarks) d.setbackFrontRemarks = 'Plan not provided';

    if (!d.setbackSide1Plan) d.setbackSide1Plan = 'N.A';
    if (!d.setbackSide1Site) d.setbackSide1Site = 'N.A';
    if (!d.setbackSide1Dev) d.setbackSide1Dev = 'Nil';
    if (!d.setbackSide1Remarks) d.setbackSide1Remarks = '';

    if (!d.setbackSide2Plan) d.setbackSide2Plan = 'N.A';
    if (!d.setbackSide2Site) d.setbackSide2Site = 'N.A';
    if (!d.setbackSide2Dev) d.setbackSide2Dev = 'Nil';
    if (!d.setbackSide2Remarks) d.setbackSide2Remarks = '';

    if (!d.setbackRearPlan) d.setbackRearPlan = 'N.A';
    if (!d.setbackRearSite) d.setbackRearSite = 'N.A';
    if (!d.setbackRearDev) d.setbackRearDev = 'Nil';
    if (!d.setbackRearRemarks) d.setbackRearRemarks = '';

    // Floor areas
    if (!d.perm4th) d.perm4th = '1159sqft';
    if (!d.const4th) d.const4th = '1159sqft';

    // 5. Valuation
    if (!d.landArea) d.landArea = 'NA';
    if (!d.landRate) d.landRate = 'NA';
    if (!d.landAmount) d.landAmount = 'NA';

    if (!d.area100) d.area100 = '';
    if (!d.rate100) d.rate100 = '';
    if (!d.amount100) d.amount100 = '';

    if (!d.completionStagePercent) d.completionStagePercent = '';
    if (!d.areaAsOnDate) d.areaAsOnDate = '';
    if (!d.rateAsOnDate) d.rateAsOnDate = '';
    if (!d.amountAsOnDate) d.amountAsOnDate = '';

    if (!d.amenityCarParking) d.amenityCarParking = 'Including';
    if (!d.amenityPLC) d.amenityPLC = 'NA';
    if (!d.amenityIDC) d.amenityIDC = 'NA';
    if (!d.amenityEDC) d.amenityEDC = 'NA';
    if (!d.amenityPowerBackup) d.amenityPowerBackup = 'NA';
    if (!d.amenityMisc) d.amenityMisc = 'NA';
    if (!d.totalAmenitiesCharges) d.totalAmenitiesCharges = 'Including';

    if (!d.marketValue100) d.marketValue100 = '';
    if (!d.marketValueAsOnDate) d.marketValueAsOnDate = '';
    if (!d.realizableValue) d.realizableValue = '';
    if (!d.distressValue) d.distressValue = '';
    if (!d.rentalValue) d.rentalValue = '';

    // 6. Boundaries & Declaration
    if (!d.boundaryEastDoc) d.boundaryEastDoc = '';
    if (!d.boundaryWestDoc) d.boundaryWestDoc = '';
    if (!d.boundaryNorthDoc) d.boundaryNorthDoc = '';
    if (!d.boundarySouthDoc) d.boundarySouthDoc = '';

    if (!d.boundaryEastSite) d.boundaryEastSite = p.boundaryEast || '';
    if (!d.boundaryWestSite) d.boundaryWestSite = p.boundaryWest || '';
    if (!d.boundaryNorthSite) d.boundaryNorthSite = p.boundaryNorth || '';
    if (!d.boundarySouthSite) d.boundarySouthSite = p.boundarySouth || '';

    if (!d.boundariesMatching) d.boundariesMatching = 'Yes';

    if (!d.remarks) {
      d.remarks = '';
    }

    if (!d.visitingEngineer) d.visitingEngineer = 'Er. Satyajit Mohanty';

    // Coordinates
    if (!d.latitude) d.latitude = p.latitude || '';
    if (!d.longitude) d.longitude = p.longitude || '';

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

      // Auto-calculate valuation amounts
      if (key === 'area100' || key === 'rate100' || key === 'completionStagePercent') {
        const a100 = parseFloat(next.area100) || 0;
        const r100 = parseFloat(next.rate100) || 0;
        const pct = parseFloat(next.completionStagePercent) || 70;

        const amt100 = Math.round(a100 * r100);
        next.amount100 = amt100.toString();
        next.marketValue100 = amt100.toString();

        const rateDate = Math.round(r100 * (pct / 100));
        next.rateAsOnDate = rateDate.toString();
        next.areaAsOnDate = a100.toString();

        const amtDate = Math.round(a100 * rateDate);
        next.amountAsOnDate = amtDate.toString();
        next.marketValueAsOnDate = amtDate.toString();

        next.realizableValue = Math.round(amtDate * 0.85).toString();
        next.distressValue = Math.round(amtDate * 0.80).toString();
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
        valuation_amount: parseFloat(fields.marketValueAsOnDate || fields.amountAsOnDate || 0) || 0,
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
    const renderer = new PDFShriramFinanceRenderer({ ...fields, projectCode });
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
      a.download = `Shriram_Finance_Valuation_${(fields.refNo || fields.caseRefNo || projectCode || 'Report').replace(/[/\\]/g, '_')}.pdf`;
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
        const fileName = `shriram_doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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
      const fileName = `shriram_map_${mapField}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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
        const fileName = `shriram_photo_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
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
        {/* Wizard Selection Banner */}
        {/* Universal Bank Report Header */}
        <BankReportHeader
          bankName="Shriram Finance Ltd"
          subclass="Standard Format"
          formatName="Retail & Commercial Assets, Housing Loans & NPA Valuation Format"
          clientType="organisation"
          category="Retail & Commercial Assets"
          serviceType="Valuation Report Builder"
          subjectType="Standard Valuation / NPA / Retail & Commercial Housing"
          onResetWizard={onResetWizard}
          earliestVisit={earliestVisit}
          projectCode={projectCode}
          message={message}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: BASIC DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Basic Details" number={1} id="sec-basic">
          {/* Header Meta Information Container */}
          <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 mb-5 shadow-xs">
            <h3 className="font-semibold text-amber-900 mb-4 text-sm tracking-wide uppercase">
              🏛️ Valuation Report Meta Details
            </h3>
            <div className="grid md:grid-cols-4 gap-4">
              <Field label="Branch Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.branchName || ''}
                  onChange={e => handleChange('branchName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Type of Case">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfCase || ''}
                  onChange={e => handleChange('typeOfCase', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. NPA / Housing / Retail"
                />
              </Field>

              <Field label="Valuer Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valuerName || ''}
                  onChange={e => handleChange('valuerName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Date of Visit">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.dateOfVisit || ''}
                  onChange={e => handleChange('dateOfVisit', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="DD/MM/YYYY"
                />
              </Field>

              <Field label="Case Ref. No">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.refNo || fields.caseRefNo || projectCode || ''} disabled={true} readOnly={true} placeholder="SMA-YYYY/MM-NNNN"
                />
              </Field>

              <Field label="Date of Report">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.dateOfReport || ''}
                  onChange={e => handleChange('dateOfReport', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="DD/MM/YYYY"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Contacted Person for property inspection (Name/ Mobile)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.contactPersonInspection || ''}
                    onChange={e => handleChange('contactPersonInspection', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. Mr. Rudranarayan, Mob:- 8908015464"
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="1. Applicant/s Name/s">
                <input
                  type="text"
                  className={`${inputCls} font-semibold text-slate-900`}
                  value={fields.applicantName || ''}
                  onChange={e => handleChange('applicantName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <Field label="2. Type of property">
              <input
                type="text"
                className={inputCls}
                value={fields.propertyType || ''}
                onChange={e => handleChange('propertyType', e.target.value)}
                disabled={isReadOnly}
                placeholder="Residential Flat / Commercial / Land"
              />
            </Field>

            <Field label="Current Usage">
              <input
                type="text"
                className={inputCls}
                value={fields.currentUsage || ''}
                onChange={e => handleChange('currentUsage', e.target.value)}
                disabled={isReadOnly}
                placeholder="Vacant / Self-Occupied / Rented"
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="3. Address at site">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.addressAtSite || ''}
                  onChange={e => handleChange('addressAtSite', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Address as per document">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.addressAsPerDocument || ''}
                  onChange={e => handleChange('addressAsPerDocument', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="4. Has the valuator done valuation of this property before this? If yes, when, for whom?">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.previousValuation || ''}
                  onChange={e => handleChange('previousValuation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="No / Yes (give details)"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: SURROUNDING & LOCALITY DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Surrounding & Locality Details" number={2} id="sec-surrounding">
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="5. Location Type (Comm., Res, Ind, Mix)">
              <select
                className={selectCls}
                value={fields.localityType || 'Residential'}
                onChange={e => handleChange('localityType', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Mixed">Mixed</option>
              </select>
            </Field>

            <Field label="Class of Locality">
              <select
                className={selectCls}
                value={fields.localityClass || 'Middle Class'}
                onChange={e => handleChange('localityClass', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="High Class">High Class</option>
                <option value="Middle Class">Middle Class</option>
                <option value="Lower Middle Class">Lower Middle Class</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            <Field label="Site is (Dev, Under Dev)">
              <select
                className={selectCls}
                value={fields.siteDevStatus || 'Developed'}
                onChange={e => handleChange('siteDevStatus', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Developed">Developed</option>
                <option value="Under Developed">Under Developed</option>
                <option value="Developing">Developing</option>
              </select>
            </Field>

            <Field label="Proximity to civic amenities">
              <input
                type="text"
                className={inputCls}
                value={fields.proximityCivicAmenities || ''}
                onChange={e => handleChange('proximityCivicAmenities', e.target.value)}
                disabled={isReadOnly}
                placeholder="Within 1-2 Kms"
              />
            </Field>

            <Field label="Railway Station">
              <input
                type="text"
                className={inputCls}
                value={fields.railwayStationDistance || ''}
                onChange={e => handleChange('railwayStationDistance', e.target.value)}
                disabled={isReadOnly}
                placeholder="1Km (Patia Railway station)"
              />
            </Field>

            <Field label="Bus Stop">
              <input
                type="text"
                className={inputCls}
                value={fields.busStopDistance || ''}
                onChange={e => handleChange('busStopDistance', e.target.value)}
                disabled={isReadOnly}
                placeholder="2Kms (KIIT Square Bus Stop)"
              />
            </Field>

            <Field label="6. Close Vicinity/Landmark">
              <input
                type="text"
                className={inputCls}
                value={fields.vicinityLandmark || ''}
                onChange={e => handleChange('vicinityLandmark', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="7. Distance from City Center">
              <input
                type="text"
                className={inputCls}
                value={fields.distanceFromCityCenter || ''}
                onChange={e => handleChange('distanceFromCityCenter', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="8. Condition & Width of approach road">
              <input
                type="text"
                className={inputCls}
                value={fields.approachRoad || ''}
                onChange={e => handleChange('approachRoad', e.target.value)}
                disabled={isReadOnly}
                placeholder="20-Feet wide Road"
              />
            </Field>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: PROPERTY DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Property Details" number={3} id="sec-property">
          <div className="space-y-6">
            {/* Occupant Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                9. Occupancy & Demarcation
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Vacant / Occupied">
                  <select
                    className={selectCls}
                    value={fields.occupancyStatus || 'Vacant'}
                    onChange={e => handleChange('occupancyStatus', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Self-Occupied">Self-Occupied</option>
                    <option value="Tenant">Tenant</option>
                  </select>
                </Field>

                <Field label="Name of Occupant">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.occupantName || ''}
                    onChange={e => handleChange('occupantName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Relation with applicant">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.occupantRelation || ''}
                    onChange={e => handleChange('occupantRelation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Property Demarcation">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyDemarcation || ''}
                    onChange={e => handleChange('propertyDemarcation', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Yes / No"
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Property Identified through">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propertyIdentifiedThrough || ''}
                      onChange={e => handleChange('propertyIdentifiedThrough', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>

            {/* Building Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                10. Building Details
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Type of Structure">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.structureType || ''}
                    onChange={e => handleChange('structureType', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="RCC framed structure"
                  />
                </Field>

                <Field label="Land/Plot Area (UDS)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.plotAreaUds || ''}
                    onChange={e => handleChange('plotAreaUds', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="No. of Blocks">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfBlocks || ''}
                    onChange={e => handleChange('noOfBlocks', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="No. of Units">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfUnits || ''}
                    onChange={e => handleChange('noOfUnits', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Inside visit not done"
                  />
                </Field>

                <Field label="No. of Floors">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfFloors || ''}
                    onChange={e => handleChange('noOfFloors', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="5 (S+4)"
                  />
                </Field>

                <Field label="No. of Lifts">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfLifts || ''}
                    onChange={e => handleChange('noOfLifts', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Unit Details & Quality */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                11-13. Unit Details, Quality & Age
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Located on Floor No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.floorNo || ''}
                    onChange={e => handleChange('floorNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="No. of Rooms">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfRooms || ''}
                    onChange={e => handleChange('noOfRooms', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="2BHK"
                  />
                </Field>

                <Field label="Built up area (SBUA)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-slate-900`}
                    value={fields.builtUpAreaSbua || ''}
                    onChange={e => handleChange('builtUpAreaSbua', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Carpet area (approx.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.carpetArea || ''}
                    onChange={e => handleChange('carpetArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Remarks on view from property">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.viewRemarks || ''}
                    onChange={e => handleChange('viewRemarks', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="12. Quality of Construction (Exteriors)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.constructionQualityExterior || ''}
                    onChange={e => handleChange('constructionQualityExterior', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Good / Avg / Bad"
                  />
                </Field>

                <Field label="Quality of Construction (Interiors)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.constructionQualityInterior || ''}
                    onChange={e => handleChange('constructionQualityInterior', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Good / Avg / Bad"
                  />
                </Field>

                <Field label="13. Age of the property">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyAge || ''}
                    onChange={e => handleChange('propertyAge', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Under construction"
                  />
                </Field>

                <Field label="Residual Life">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.residualLife || ''}
                    onChange={e => handleChange('residualLife', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="60-Years"
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Sanction Plan Approval & Document Details" number={4} id="sec-sanction">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Field label="14. Sanctioned plans verified with approval no">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.sanctionPlanNo || ''}
                    onChange={e => handleChange('sanctionPlanNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="15. Ownership type (Leasehold/ Freehold)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ownershipType || ''}
                  onChange={e => handleChange('ownershipType', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="16. Property documents verified">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.documentsVerified || ''}
                  onChange={e => handleChange('documentsVerified', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="17. Is the property within Municipal Limits">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.withinMunicipalLimits || ''}
                  onChange={e => handleChange('withinMunicipalLimits', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="18. Permissible usage allow as per master plan">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.permissibleUsage || ''}
                  onChange={e => handleChange('permissibleUsage', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Setbacks Table */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                19. Setbacks Details
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-800">
                  <thead className="bg-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2 text-left">Setbacks</th>
                      <th className="p-2 text-left">As per plan/ Bye laws</th>
                      <th className="p-2 text-left">Actual at site</th>
                      <th className="p-2 text-left">Deviation</th>
                      <th className="p-2 text-left">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 font-bold">Front</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackFrontPlan || ''} onChange={e => handleChange('setbackFrontPlan', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackFrontSite || ''} onChange={e => handleChange('setbackFrontSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackFrontDev || ''} onChange={e => handleChange('setbackFrontDev', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackFrontRemarks || ''} onChange={e => handleChange('setbackFrontRemarks', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">Side 1 (Left)</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackSide1Plan || ''} onChange={e => handleChange('setbackSide1Plan', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackSide1Site || ''} onChange={e => handleChange('setbackSide1Site', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackSide1Dev || ''} onChange={e => handleChange('setbackSide1Dev', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackSide1Remarks || ''} onChange={e => handleChange('setbackSide1Remarks', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">Side 2 (Right)</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackSide2Plan || ''} onChange={e => handleChange('setbackSide2Plan', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackSide2Site || ''} onChange={e => handleChange('setbackSide2Site', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackSide2Dev || ''} onChange={e => handleChange('setbackSide2Dev', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackSide2Remarks || ''} onChange={e => handleChange('setbackSide2Remarks', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">Rear</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackRearPlan || ''} onChange={e => handleChange('setbackRearPlan', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackRearSite || ''} onChange={e => handleChange('setbackRearSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackRearDev || ''} onChange={e => handleChange('setbackRearDev', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.setbackRearRemarks || ''} onChange={e => handleChange('setbackRearRemarks', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Floor Wise Area Table */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                20. Floor Wise Area (In Sft.)
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Permissible Area (SBUA)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.perm4th || ''}
                    onChange={e => handleChange('perm4th', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 1159 sqft"
                  />
                </Field>
                <Field label="Total Constructed Area (SBUA)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.const4th || ''}
                    onChange={e => handleChange('const4th', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 1159 sqft"
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5: VALUATION
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Valuation" number={5} id="sec-valuation">
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                (A) Description of Constructed Area and Rates
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="21. Area on 100% completion (Sft.)">
                  <input
                    type="number"
                    className={`${inputCls} font-bold`}
                    value={fields.area100 || ''}
                    onChange={e => handleChange('area100', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Rate per Sft. (100% Completion)">
                  <input
                    type="number"
                    className={`${inputCls} font-bold`}
                    value={fields.rate100 || ''}
                    onChange={e => handleChange('rate100', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Total Amount (100% Completion)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold bg-amber-50 text-amber-900`}
                    value={fields.amount100 ? `₹ ${formatIndianCurrency(fields.amount100)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Completion Stage Percentage (%)">
                  <input
                    type="number"
                    className={inputCls}
                    value={fields.completionStagePercent || '70'}
                    onChange={e => handleChange('completionStagePercent', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Rate per Sft. (As On Date)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.rateAsOnDate ? `₹ ${fields.rateAsOnDate}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Total Amount (As On Date)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold bg-amber-50 text-amber-900`}
                    value={fields.amountAsOnDate ? `₹ ${formatIndianCurrency(fields.amountAsOnDate)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>
              </div>
            </div>

            {/* Extra Amenities */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                (B) Value of Extra Amenities if applicable
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Car Parking">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenityCarParking || ''}
                    onChange={e => handleChange('amenityCarParking', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Power Backup">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenityPowerBackup || ''}
                    onChange={e => handleChange('amenityPowerBackup', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Total Amenities Charges">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalAmenitiesCharges || ''}
                    onChange={e => handleChange('totalAmenitiesCharges', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Valuation Summary Card */}
            <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                📊 Valuation Summary Metrics
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Total Market Value of Property (100%)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-base bg-white text-slate-900`}
                    value={fields.marketValue100 ? `₹ ${formatIndianCurrency(fields.marketValue100)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label={`Total Market Value As on date (${fields.completionStagePercent || 70}%)`}>
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-base bg-white text-emerald-700`}
                    value={fields.marketValueAsOnDate ? `₹ ${formatIndianCurrency(fields.marketValueAsOnDate)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Realizable Value (85%)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-base bg-white text-slate-900`}
                    value={fields.realizableValue ? `₹ ${formatIndianCurrency(fields.realizableValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Forced Sale / Distress Value (80%)">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-base bg-white text-rose-700`}
                    value={fields.distressValue ? `₹ ${formatIndianCurrency(fields.distressValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Approx. Rentals in case of 100% complete property">
                    <input
                      type="text"
                      className={`${inputCls} bg-white text-slate-900 font-semibold`}
                      value={fields.rentalValue || ''}
                      onChange={e => handleChange('rentalValue', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6: BOUNDARIES, REMARKS & DECLARATION
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Boundaries, Remarks & Declaration" number={6} id="sec-boundaries">
          <div className="space-y-6">
            {/* Boundaries Table */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                22. Boundaries
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-800">
                  <thead className="bg-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2 text-left">Boundaries</th>
                      <th className="p-2 text-left">EAST</th>
                      <th className="p-2 text-left">WEST</th>
                      <th className="p-2 text-left">NORTH</th>
                      <th className="p-2 text-left">SOUTH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 font-bold">As per agreement to sale</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryEastDoc || ''} onChange={e => handleChange('boundaryEastDoc', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryWestDoc || ''} onChange={e => handleChange('boundaryWestDoc', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryNorthDoc || ''} onChange={e => handleChange('boundaryNorthDoc', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundarySouthDoc || ''} onChange={e => handleChange('boundarySouthDoc', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">At site (Project Boundaries)</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryEastSite || ''} onChange={e => handleChange('boundaryEastSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryWestSite || ''} onChange={e => handleChange('boundaryWestSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryNorthSite || ''} onChange={e => handleChange('boundaryNorthSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundarySouthSite || ''} onChange={e => handleChange('boundarySouthSite', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <Field label="Boundaries Matching">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.boundariesMatching || ''}
                    onChange={e => handleChange('boundariesMatching', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Remarks */}
            <Field label="Remarks:-">
              <textarea
                rows={4}
                className={inputCls}
                value={fields.remarks || ''}
                onChange={e => handleChange('remarks', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Declaration */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700 leading-relaxed text-justify">
              <h4 className="font-bold text-slate-800 uppercase tracking-wide">
                Declaration:-
              </h4>
              <p>1. I hereby declare that, I have no direct and indirect interest in the property valued and the information furnished in the report is true and correct to the best of my knowledge of belief.</p>
              <p>2. Any additions or alterations after the date of inspection shall not fall under the scope of this report.</p>
              <p>3. The legal aspects are not in the scope of evaluation of the property.</p>
              <p>4. The Property is identified by the owner before the valuer. This valuation report is prepared without any prejudice and bias to any person or institution.</p>
              <p>5. This report has been prepared on basis of verifications in the locality.</p>
              <p>6. I am not required to given testimony or appear in court by any reason of this appraisal report, with reference to the property in question.</p>
            </div>

            {/* Engineer & Signatures */}
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Name of Engineer who visited the property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.visitingEngineer || ''}
                  onChange={e => handleChange('visitingEngineer', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Authorized Signatory">
                <input
                  type="text"
                  className={`${inputCls} bg-slate-100 font-semibold`}
                  value="Er. Satyajit Mohanty (Authorized Signatory)"
                  disabled
                  readOnly
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
          latitude={fields.latitude || '20.353400'}
          longitude={fields.longitude || '85.841866'}
          technicalAddress={fields.addressAtSite || ''}
          propertyAddress={fields.addressAsPerDocument || fields.addressAtSite || ''}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Location Coordinates"
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
