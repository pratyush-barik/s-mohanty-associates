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
import { PDFUtkarshSFBRenderer } from '@/lib/banks/pdf-utkarsh-sfb-renderer';

export const UTKARSH_CONFIG: BankConfig = {
  bankId: 'UTKARSH SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Utkarsh Small Finance Bank',
  defaultValues: {
    purpose: 'Housing Loan / LAP / Micro Mortgages',
  },
};

export interface UtkarshSFBProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function UtkarshSmallFinanceBank({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: UtkarshSFBProps) {
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
    { id: 'utkarsh-sec-app', title: 'Application Details' },
    { id: 'utkarsh-sec-location', title: 'Location & Boundaries' },
    { id: 'utkarsh-sec-municipal', title: 'Municipal & Legal Docs' },
    { id: 'utkarsh-sec-technical', title: 'Technical Details & Accommodations' },
    { id: 'utkarsh-sec-valuation', title: 'Valuation & Net Mortgage' },
    { id: 'utkarsh-sec-remarks', title: 'Remarks & Declaration' },
    { id: 'utkarsh-sec-docs', title: 'Documents' },
    { id: 'utkarsh-sec-maps', title: 'Maps' },
    { id: 'utkarsh-sec-photos', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initialize fields
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // Application Details
    if (!d.refNo) d.refNo = d.fileRefNo || projectCode || '';
    if (!d.fileRefNo) d.fileRefNo = d.refNo;
    if (!d.reportDate) d.reportDate = earliestVisit ? formatReportDate(earliestVisit.date) : '';
    if (!d.loanType) d.loanType = 'LAP';
    if (!d.applicantName) d.applicantName = p.applicantName || '';
    const cPhone = p.contactPhone || '';
    const cName = p.contactName || p.applicantName || '';
    if (!d.contactPersonsNos) d.contactPersonsNos = cPhone ? `${cName}: ${cPhone}` : cName;
    if (!d.ownerName) d.ownerName = p.contactName || '';
    if (!d.propertyArea) d.propertyArea = '';
    if (!d.holdingType) d.holdingType = 'Free Hold';
    if (!d.propertyUsage) d.propertyUsage = 'Residential';
    if (!d.areaAuthorisedTCP) d.areaAuthorisedTCP = '';

    // Location Details
    const defaultAddress = p.propertyAddress || '';
    if (!d.addressAsPerFiring) d.addressAsPerFiring = defaultAddress;
    if (!d.addressOnInspection) d.addressOnInspection = defaultAddress;
    if (!d.addressAsPerDocs) d.addressAsPerDocs = defaultAddress;

    if (!d.personMetNos) d.personMetNos = cPhone ? `${cName}: ${cPhone}` : cName;
    if (!d.addressMatching) d.addressMatching = 'Yes';
    if (!d.landmark) d.landmark = '';
    if (!d.zoneAsPerCity) d.zoneAsPerCity = 'Residential';
    if (!d.locationGPS) d.locationGPS = '';

    // Boundaries
    if (!d.bndActualNorth) d.bndActualNorth = '';
    if (!d.bndDocNorth) d.bndDocNorth = '';
    if (!d.bndActualEast) d.bndActualEast = '';
    if (!d.bndDocEast) d.bndDocEast = '';
    if (!d.bndActualWest) d.bndActualWest = '';
    if (!d.bndDocWest) d.bndDocWest = '';
    if (!d.bndActualSouth) d.bndActualSouth = '';
    if (!d.bndDocSouth) d.bndDocSouth = '';
    if (!d.boundaryTalliedRemark) d.boundaryTalliedRemark = '';

    // Accessibility
    if (!d.neighbourhoodType) d.neighbourhoodType = 'Middle';
    if (!d.marketability) d.marketability = 'Good';
    if (!d.proximityAmenities) d.proximityAmenities = '';
    if (!d.siteAccess) d.siteAccess = '';
    if (!d.withinMunicipalLimits) d.withinMunicipalLimits = 'Yes';
    if (!d.plotDemarcation) d.plotDemarcation = 'Yes';
    if (!d.neighboursInquiry) d.neighboursInquiry = 'Yes';

    // Document / Municipal Details
    if (!d.sanctionPlanProvided) d.sanctionPlanProvided = 'No';
    if (!d.sanctionPermitNo) d.sanctionPermitNo = 'NA';
    if (!d.sanctionDate) d.sanctionDate = 'NA';
    if (!d.validTill) d.validTill = 'NA';
    if (!d.floorsSanctioned) d.floorsSanctioned = 'NA';
    if (!d.sanctionedAreas) d.sanctionedAreas = 'NA';
    if (!d.sanctioningAuthority) d.sanctioningAuthority = '';
    if (!d.municipalCompliance) d.municipalCompliance = '';
    if (!d.localByLawsCompliance) d.localByLawsCompliance = '';
    if (!d.commencementCertDetails) d.commencementCertDetails = 'NA';
    if (!d.legalDocsProvided) d.legalDocsProvided = 'Yes';
    if (!d.legalDocsDetails) d.legalDocsDetails = '';

    // Technical Details
    if (!d.technicalPropertyType) d.technicalPropertyType = p.propertyType || 'Residential';
    if (!d.noOfStories) d.noOfStories = '';
    if (!d.tenementPosition) d.tenementPosition = 'Self occupied';
    if (!d.constructionType) d.constructionType = 'RCC';
    if (!d.noOfLifts) d.noOfLifts = 'Nil';

    // Accommodation
    if (!d.accoBF) d.accoBF = 'Nil';
    if (!d.accoMezz) d.accoMezz = 'Nil';
    if (!d.accoGF) d.accoGF = '';
    if (!d.accoSF) d.accoSF = '';
    if (!d.accoFF) d.accoFF = '';
    if (!d.accoTF) d.accoTF = 'NA';
    if (!d.acco4thF) d.acco4thF = 'NA';

    if (!d.flatFloorNo) d.flatFloorNo = 'NA';
    if (!d.flatAccommodation) d.flatAccommodation = 'NA';
    if (!d.independentAccessUnit) d.independentAccessUnit = 'Yes';

    if (!d.occupancyStatus) d.occupancyStatus = 'Owner';
    if (!d.occupantName) d.occupantName = '';
    if (!d.finishExterior) d.finishExterior = '';
    if (!d.finishInterior) d.finishInterior = '';
    if (!d.finishFlooring) d.finishFlooring = '';
    if (!d.finishWood) d.finishWood = '';
    if (!d.commercialUsageDetails) d.commercialUsageDetails = 'NA';
    if (!d.completionStatus) d.completionStatus = '100% Completed';
    if (!d.currentAge) d.currentAge = '';
    if (!d.residualAge) d.residualAge = '';

    // Valuation calculation numbers
    if (d.valConstAreaNum === undefined) d.valConstAreaNum = 0;
    if (d.valConstRateNum === undefined) d.valConstRateNum = 0;
    if (d.valConstTotalNum === undefined) d.valConstTotalNum = 0;

    if (d.valLandAreaNum === undefined) d.valLandAreaNum = 0;
    if (d.valLandRateNum === undefined) d.valLandRateNum = 0;
    if (d.valLandTotalNum === undefined) d.valLandTotalNum = 0;

    if (d.netMortgageValueNum === undefined) d.netMortgageValueNum = 0;
    if (d.forcedValueNum === undefined) d.forcedValueNum = 0;

    if (!d.valConstArea) d.valConstArea = '';
    if (!d.valConstRate) d.valConstRate = '';
    if (!d.valConstTotal) d.valConstTotal = '';
    if (!d.valTotalBUA) d.valTotalBUA = '';
    if (!d.valDepDesc) d.valDepDesc = '';
    if (!d.valDepAmount) d.valDepAmount = 'Nil';
    if (!d.valConstAfterDep) d.valConstAfterDep = '';

    if (!d.valLandArea) d.valLandArea = '';
    if (!d.valLandRate) d.valLandRate = '';
    if (!d.valLandTotal) d.valLandTotal = '';

    if (!d.carParkingNos) d.carParkingNos = 'NA';
    if (!d.carParkingRate) d.carParkingRate = 'NA';
    if (!d.carParkingTotal) d.carParkingTotal = 'NA';
    if (!d.otherOneTimeCost) d.otherOneTimeCost = 'NA';

    if (!d.netMortgageValue) d.netMortgageValue = '';
    if (!d.govtRate) d.govtRate = '';
    if (!d.forcedValue) d.forcedValue = '';
    if (!d.valuationDoneEarlier) d.valuationDoneEarlier = 'No';
    if (!d.inDemolitionList) d.inDemolitionList = 'No';
    if (!d.inNegativeArea) d.inNegativeArea = 'NO';
    if (!d.litigationObserved) d.litigationObserved = 'NO';
    if (!d.deviationsAccepted) d.deviationsAccepted = 'NA';

    // Remarks & Declaration
    if (!d.remarks) d.remarks = '';
    if (!d.place) d.place = 'Bhubaneswar';

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

      // Live valuation calculation
      const constA = parseFloat(String(next.valConstAreaNum ?? 0)) || 0;
      const constR = parseFloat(String(next.valConstRateNum ?? 0)) || 0;
      const landA = parseFloat(String(next.valLandAreaNum ?? 0)) || 0;
      const landR = parseFloat(String(next.valLandRateNum ?? 0)) || 0;

      const calcConstVal = Math.round(constA * constR);
      const calcLandVal = Math.round(landA * landR);
      const calcNet = calcConstVal + calcLandVal;
      const calcForced = Math.round(calcNet * 0.8); // 80% forced value standard

      if (['valConstAreaNum', 'valConstRateNum', 'valLandAreaNum', 'valLandRateNum'].includes(key)) {
        next.valConstTotalNum = calcConstVal;
        next.valConstTotal = `Rs.${calcConstVal.toLocaleString('en-IN')}/-`;
        next.valTotalBUA = `Rs.${calcConstVal.toLocaleString('en-IN')}/-`;
        next.valConstAfterDep = `Rs.${calcConstVal.toLocaleString('en-IN')}/-`;
        next.valConstArea = `${constA}sqft`;
        next.valConstRate = `Rs.${constR}/-`;

        next.valLandTotalNum = calcLandVal;
        next.valLandTotal = `Rs.${calcLandVal.toLocaleString('en-IN')}/-`;
        next.valLandArea = `${landA}sqft`;
        next.valLandRate = `Rs.${landR}/-`;

        next.netMortgageValueNum = calcNet;
        next.netMortgageValue = `Rs.${calcNet.toLocaleString('en-IN')}/-`;
        next.forcedValueNum = calcForced;
        next.forcedValue = `Rs.${calcForced.toLocaleString('en-IN')}/-`;
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
      alert('Error uploading map: ' + err.message);
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
        valuation_amount: fields.netMortgageValueNum || 0,
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
    if (!confirm('Are you sure you want to submit this Utkarsh Small Finance Bank report?')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: fields.netMortgageValueNum || 0,
        updated_at: new Date().toISOString(),
      });
      await supabaseBrowser.from('projects').update({
        status: 'COMPLETED',
        valuation_amount: fields.netMortgageValueNum || 0,
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
    const renderer = new PDFUtkarshSFBRenderer({
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
      a.download = `Utkarsh_SFB_Valuation_${(fields.refNo || fields.fileRefNo || projectCode || 'Report').replace(/[/\\]/g, '_')}.pdf`;
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
      {/* ── Bank Report Header ── */}
      <BankReportHeader
        bankName="Utkarsh Small Finance Bank"
        subTemplate="Standard Format"
        description="Comprehensive Housing Loan, LAP & Micro-Mortgage Valuation Report."
        projectCode={projectCode}
        earliestVisit={earliestVisit}
        onResetWizard={onResetWizard}
        onSyncInspectionDate={
          earliestVisit
            ? () => {
                const dt = formatReportDate(earliestVisit.date);
                updateField('reportDate', dt);
              }
            : undefined
        }
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">

        {/* 1. Application Details */}
        <div id="utkarsh-sec-app">
          <Section title="Application Details" number={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Field label="File Ref NO. / LAN No.">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.refNo || fields.fileRefNo || projectCode || ''} disabled={true} readOnly={true} placeholder="SMA-YYYY/MM-NNNN"
                />
              </Field>
              <Field label="Date of Report">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.reportDate || ''}
                  onChange={(e) => updateField('reportDate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Loan Type">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.loanType || ''}
                  onChange={(e) => updateField('loanType', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Name of Applicant">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.applicantName || ''}
                  onChange={(e) => updateField('applicantName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Contact Persons / Nos">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.contactPersonsNos || ''}
                  onChange={(e) => updateField('contactPersonsNos', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Name of Property Owner">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ownerName || ''}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Property Area">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.propertyArea || ''}
                  onChange={(e) => updateField('propertyArea', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Property Holding Type">
                <select
                  className={selectCls}
                  value={fields.holdingType || 'Free Hold'}
                  onChange={(e) => updateField('holdingType', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Free Hold">Free Hold</option>
                  <option value="Lease Hold">Lease Hold</option>
                </select>
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
              <Field label="Area Authorised as per TCP">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.areaAuthorisedTCP || ''}
                  onChange={(e) => updateField('areaAuthorisedTCP', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 2. Location Details & Boundaries */}
        <div id="utkarsh-sec-location">
          <Section title="Location Details & Site Boundaries" number={2}>
            <div className="space-y-3 mb-4">
              <Field label="Address as per Firing">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.addressAsPerFiring || ''}
                  onChange={(e) => updateField('addressAsPerFiring', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Address on Inspection (Postal)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.addressOnInspection || ''}
                  onChange={(e) => updateField('addressOnInspection', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Address as per Docs (Sanction & Legal)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.addressAsPerDocs || ''}
                  onChange={(e) => updateField('addressAsPerDocs', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="Person Met / Nos">
                <input type="text" className={inputCls} value={fields.personMetNos || ''} onChange={(e) => updateField('personMetNos', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Address Matching?">
                <select className={selectCls} value={fields.addressMatching || 'Yes'} onChange={(e) => updateField('addressMatching', e.target.value)} disabled={isReadOnly}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="Landmark">
                <input type="text" className={inputCls} value={fields.landmark || ''} onChange={(e) => updateField('landmark', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Zone as per City">
                <input type="text" className={inputCls} value={fields.zoneAsPerCity || ''} onChange={(e) => updateField('zoneAsPerCity', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <div className="mb-6">
              <Field label="Location of Plot / Property (GPS Lat, Long)">
                <input type="text" className={inputCls} value={fields.locationGPS || ''} onChange={(e) => updateField('locationGPS', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Four Site Boundaries</h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 font-medium">
                  <tr>
                    <th className="px-3 py-2 text-left">Basis</th>
                    <th className="px-3 py-2 text-left">North</th>
                    <th className="px-3 py-2 text-left">East</th>
                    <th className="px-3 py-2 text-left">West</th>
                    <th className="px-3 py-2 text-left">South</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">Actual as Verified at Site</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndActualNorth || ''} onChange={(e) => updateField('bndActualNorth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndActualEast || ''} onChange={(e) => updateField('bndActualEast', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndActualWest || ''} onChange={(e) => updateField('bndActualWest', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndActualSouth || ''} onChange={(e) => updateField('bndActualSouth', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Sale Deed</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocNorth || ''} onChange={(e) => updateField('bndDocNorth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocEast || ''} onChange={(e) => updateField('bndDocEast', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocWest || ''} onChange={(e) => updateField('bndDocWest', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocSouth || ''} onChange={(e) => updateField('bndDocSouth', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Boundaries Tallied Remark">
                <input type="text" className={inputCls} value={fields.boundaryTalliedRemark || ''} onChange={(e) => updateField('boundaryTalliedRemark', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Neighbourhood Type">
                <input type="text" className={inputCls} value={fields.neighbourhoodType || ''} onChange={(e) => updateField('neighbourhoodType', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Marketability">
                <select className={selectCls} value={fields.marketability || 'Good'} onChange={(e) => updateField('marketability', e.target.value)} disabled={isReadOnly}>
                  <option value="Poor">Poor</option>
                  <option value="Average">Average</option>
                  <option value="Good">Good</option>
                </select>
              </Field>
              <Field label="Site Access">
                <input type="text" className={inputCls} value={fields.siteAccess || ''} onChange={(e) => updateField('siteAccess', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 3. Municipal & Legal Docs */}
        <div id="utkarsh-sec-municipal">
          <Section title="Municipal Details & Legal Documents" number={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="Sanction Plan Provided?">
                <select className={selectCls} value={fields.sanctionPlanProvided || 'No'} onChange={(e) => updateField('sanctionPlanProvided', e.target.value)} disabled={isReadOnly}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="Sanction / Permit No.">
                <input type="text" className={inputCls} value={fields.sanctionPermitNo || ''} onChange={(e) => updateField('sanctionPermitNo', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Date of Sanction">
                <input type="text" className={inputCls} value={fields.sanctionDate || ''} onChange={(e) => updateField('sanctionDate', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Valid Till">
                <input type="text" className={inputCls} value={fields.validTill || ''} onChange={(e) => updateField('validTill', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Field label="No. of Floors Sanctioned">
                <input type="text" className={inputCls} value={fields.floorsSanctioned || ''} onChange={(e) => updateField('floorsSanctioned', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Sanctioned Areas">
                <input type="text" className={inputCls} value={fields.sanctionedAreas || ''} onChange={(e) => updateField('sanctionedAreas', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Sanctioning Authority">
                <input type="text" className={inputCls} value={fields.sanctioningAuthority || ''} onChange={(e) => updateField('sanctioningAuthority', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Local By-Laws Compliance (If plan not available)">
                <input type="text" className={inputCls} value={fields.localByLawsCompliance || ''} onChange={(e) => updateField('localByLawsCompliance', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Details of Legal Docs Provided">
                <input type="text" className={inputCls} value={fields.legalDocsDetails || ''} onChange={(e) => updateField('legalDocsDetails', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 4. Technical Details & Accommodations */}
        <div id="utkarsh-sec-technical">
          <Section title="Technical Details & Accommodations" number={4}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="Type of Property">
                <input type="text" className={inputCls} value={fields.technicalPropertyType || ''} onChange={(e) => updateField('technicalPropertyType', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="No. of Stories">
                <input type="text" className={inputCls} value={fields.noOfStories || ''} onChange={(e) => updateField('noOfStories', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Tenement Position">
                <input type="text" className={inputCls} value={fields.tenementPosition || ''} onChange={(e) => updateField('tenementPosition', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Construction Type">
                <input type="text" className={inputCls} value={fields.constructionType || ''} onChange={(e) => updateField('constructionType', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Floor-wise Measured Accommodation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="Ground Floor (G.F. RCC)">
                <input type="text" className={inputCls} value={fields.accoGF || ''} onChange={(e) => updateField('accoGF', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="First Floor (F.F. RCC)">
                <input type="text" className={inputCls} value={fields.accoFF || ''} onChange={(e) => updateField('accoFF', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Second Floor (S.F.)">
                <input type="text" className={inputCls} value={fields.accoSF || ''} onChange={(e) => updateField('accoSF', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Basement / Mezzanine">
                <input type="text" className={inputCls} value={fields.accoBF || 'Nil'} onChange={(e) => updateField('accoBF', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Completion Status">
                <input type="text" className={inputCls} value={fields.completionStatus || ''} onChange={(e) => updateField('completionStatus', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Current Age of Property">
                <input type="text" className={inputCls} value={fields.currentAge || ''} onChange={(e) => updateField('currentAge', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Residual Physical Life">
                <input type="text" className={inputCls} value={fields.residualAge || ''} onChange={(e) => updateField('residualAge', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 5. Valuation & Net Mortgage Value */}
        <div id="utkarsh-sec-valuation">
          <Section title="Valuation (Live Calculation)" number={5}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="Construction Area (Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.valConstAreaNum ?? 0}
                  onChange={(e) => updateField('valConstAreaNum', parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Construction Rate (Rs per Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.valConstRateNum ?? 0}
                  onChange={(e) => updateField('valConstRateNum', parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Total Construction Value (Rs)">
                <div className="p-2.5 rounded-lg bg-slate-100 font-bold text-slate-900 border border-slate-200">
                  {formatIndianCurrency(fields.valConstTotalNum)}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Field label="Land Area (Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.valLandAreaNum ?? 0}
                  onChange={(e) => updateField('valLandAreaNum', parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Land Rate (Rs per Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.valLandRateNum ?? 0}
                  onChange={(e) => updateField('valLandRateNum', parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Total Land Value (Rs)">
                <div className="p-2.5 rounded-lg bg-slate-100 font-bold text-slate-900 border border-slate-200">
                  {formatIndianCurrency(fields.valLandTotalNum)}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Field label="Car Parking (Nos.)">
                <input type="text" className={inputCls} value={fields.carParkingNos || 'NA'} onChange={(e) => updateField('carParkingNos', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Car Parking Rate (Rs)">
                <input type="text" className={inputCls} value={fields.carParkingRate || 'NA'} onChange={(e) => updateField('carParkingRate', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Other One Time Cost (Rs)">
                <input type="text" className={inputCls} value={fields.otherOneTimeCost || 'NA'} onChange={(e) => updateField('otherOneTimeCost', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl mb-6">
              <div>
                <span className="text-xs uppercase font-semibold text-emerald-700 tracking-wider">NET MORTGAGE VALUE</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {formatIndianCurrency(fields.netMortgageValueNum)}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {rupeesInWords(fields.netMortgageValueNum || 0)}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-blue-700 tracking-wider">DISTRESSED / FORCED VALUE</span>
                <div className="text-2xl font-black text-blue-900 mt-1">
                  {fields.forcedValue}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Assessed distress realization
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Government Rate (Rs/Sqft)">
                <input type="text" className={inputCls} value={fields.govtRate || ''} onChange={(e) => updateField('govtRate', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Valuation Done Earlier">
                <input type="text" className={inputCls} value={fields.valuationDoneEarlier || ''} onChange={(e) => updateField('valuationDoneEarlier', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="In Demolition List?">
                <input type="text" className={inputCls} value={fields.inDemolitionList || ''} onChange={(e) => updateField('inDemolitionList', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="In Negative Area?">
                <input type="text" className={inputCls} value={fields.inNegativeArea || 'NO'} onChange={(e) => updateField('inNegativeArea', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Any Litigation Observed?">
                <input type="text" className={inputCls} value={fields.litigationObserved || 'NO'} onChange={(e) => updateField('litigationObserved', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Deviations Accepted (LAP/BL)">
                <input type="text" className={inputCls} value={fields.deviationsAccepted || 'NA'} onChange={(e) => updateField('deviationsAccepted', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 6. Remarks & Declaration */}
        <div id="utkarsh-sec-remarks">
          <Section title="Remarks & Sign-off" number={6}>
            <div className="space-y-4">
              <Field label="Remarks & Observations">
                <textarea
                  rows={6}
                  className={inputCls}
                  value={fields.remarks || ''}
                  onChange={(e) => updateField('remarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <Field label="Place">
                  <input type="text" className={inputCls} value={fields.place || 'Bhubaneswar'} onChange={(e) => updateField('place', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Report Date">
                  <input type="text" className={inputCls} value={fields.reportDate || ''} onChange={(e) => updateField('reportDate', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* 7. Attachments: Documents, Maps & Photographs */}
        <div id="utkarsh-sec-attachments" className="space-y-6">
          <BaseDocumentsSection
            title="Documents"
            sectionNumber={7}
            sectionId="utkarsh-sec-docs"
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
            title="Maps"
            sectionNumber={8}
            sectionId="utkarsh-sec-maps"
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
            title="Photographs"
            sectionNumber={9}
            sectionId="utkarsh-sec-photos"
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
