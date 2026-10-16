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
import { PDFVarthanaFinanceRenderer } from '@/lib/banks/pdf-varthana-finance-renderer';

export const VARTHANA_FINANCE_CONFIG: BankConfig = {
  bankId: 'VARTHANA FINANCE',
  subTemplateId: '',
  displayName: 'Varthana Finance (School Loans)',
  defaultValues: {
    purpose: 'School & Educational Institution Infrastructure Valuation',
  },
};

export interface VarthanaFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function VarthanaFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: VarthanaFinanceProps) {
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
    { id: 'varthana-sec-meta', title: 'Header & Application Details' },
    { id: 'varthana-sec-access', title: 'Location, Access & Boundaries' },
    { id: 'varthana-sec-technical', title: 'Technical Details & Areas' },
    { id: 'varthana-sec-valuation', title: 'Valuation & Net Mortgagable' },
    { id: 'varthana-sec-remarks', title: 'Declaration & Remarks' },
    { id: 'varthana-sec-attachments', title: 'Amin Map, Documents & Photos' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initialize fields
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // Header & Application Details
    if (!d.refNo) d.refNo = projectCode || '';
    if (!d.valuationDate) d.valuationDate = earliestVisit ? formatReportDate(earliestVisit.date) : '';
    if (!d.valuerName) d.valuerName = 'M/s. S MOHANTY ASSOCIATES';
    if (!d.schoolName) d.schoolName = p.applicantName || '';
    if (!d.customerRepName) d.customerRepName = p.contactName ? `${p.contactName} (Customer)` : '';
    if (!d.contactNos) d.contactNos = p.contactPhone ? `${p.contactName || ''}, Mob-${p.contactPhone}` : '';
    if (!d.ownerName) d.ownerName = p.contactName ? `${p.contactName}` : '';
    if (!d.holdingType) d.holdingType = 'Free Hold';
    if (!d.propertyDescription) d.propertyDescription = '';
    if (!d.documentsProvided) d.documentsProvided = '';
    if (!d.planAndDeedDetails) d.planAndDeedDetails = '';
    if (!d.withinMunicipalLimits) d.withinMunicipalLimits = '';
    if (!d.propertyUsageActual) d.propertyUsageActual = '';

    const defaultAddress = p.propertyAddress || '';
    if (!d.addressAsPerDoc) d.addressAsPerDoc = defaultAddress;
    if (!d.addressAtSite) d.addressAtSite = defaultAddress;
    if (!d.landmark) d.landmark = '';
    if (!d.latitude) d.latitude = '';
    if (!d.longitude) d.longitude = '';
    if (!d.natureOfLocation) d.natureOfLocation = 'Institutional';

    // Accessibility & Proximity
    if (!d.existingRoadWidth) d.existingRoadWidth = '';
    if (!d.siteAccessType) d.siteAccessType = 'Independent access';
    if (!d.proximityPostOffice) d.proximityPostOffice = '';
    if (!d.proximityBanks) d.proximityBanks = '';
    if (!d.proximityPoliceStation) d.proximityPoliceStation = '';
    if (!d.proximityOtherAmenities) d.proximityOtherAmenities = '';

    if (!d.conversionOrderDetails) d.conversionOrderDetails = '';
    if (!d.riskHiTension) d.riskHiTension = 'No';
    if (!d.riskWaterBody) d.riskWaterBody = 'No';

    // Boundaries
    if (!d.bndDocEast) d.bndDocEast = '';
    if (!d.bndDocWest) d.bndDocWest = '';
    if (!d.bndDocNorth) d.bndDocNorth = '';
    if (!d.bndDocSouth) d.bndDocSouth = '';

    if (!d.bndSiteEast) d.bndSiteEast = '';
    if (!d.bndSiteWest) d.bndSiteWest = '';
    if (!d.bndSiteNorth) d.bndSiteNorth = '';
    if (!d.bndSiteSouth) d.bndSiteSouth = '';

    if (!d.propertyIdentification) d.propertyIdentification = '';
    if (!d.sanctionPlanDetails) d.sanctionPlanDetails = '';
    if (!d.sanctionedFloors) d.sanctionedFloors = '';
    if (!d.constructedUptoFloors) d.constructedUptoFloors = '';
    if (!d.sanctionedArea) d.sanctionedArea = '';
    if (!d.constructedAreaAtSite) d.constructedAreaAtSite = '';
    if (!d.farDeviationPercent) d.farDeviationPercent = '';
    if (!d.setbackDeviationComments) d.setbackDeviationComments = '';
    if (!d.noOfUnitsSanctioned) d.noOfUnitsSanctioned = '';
    if (!d.noOfUnitsConstructed) d.noOfUnitsConstructed = '';
    if (!d.deviationRegularized) d.deviationRegularized = 'NA';
    if (!d.deviationRegularizedHow) d.deviationRegularizedHow = '';

    // Technical Details
    if (!d.typeOfProperty) d.typeOfProperty = 'Institutional';
    if (!d.noOfStories) d.noOfStories = '';
    if (!d.tenementPosition) d.tenementPosition = 'Self Occupied';
    if (!d.constructionType) d.constructionType = 'R.C.C framed structure';
    if (!d.noOfLifts) d.noOfLifts = 'Nil';
    if (!d.occupancyStatus) d.occupancyStatus = 'Self-owned';
    if (!d.noOfOccupants) d.noOfOccupants = '';
    if (!d.commercialUsageDetails) d.commercialUsageDetails = '';

    // Finishes
    if (!d.finishExterior) d.finishExterior = '';
    if (!d.finishWall) d.finishWall = '';
    if (!d.finishFlooring) d.finishFlooring = '';
    if (!d.finishDoorWindow) d.finishDoorWindow = '';
    if (!d.finishFittings) d.finishFittings = '';

    if (!d.totalPermissibleArea) d.totalPermissibleArea = '';
    if (!d.totalConstructedArea) d.totalConstructedArea = '';
    if (!d.landArea) d.landArea = '';

    // Floor-wise
    if (!d.floorConstGF) d.floorConstGF = '';
    if (!d.floorConstFF) d.floorConstFF = '';
    if (!d.floorPermGF) d.floorPermGF = '';
    if (!d.floorPermFF) d.floorPermFF = '';

    // Completion Status
    if (!d.stageOfConstruction) d.stageOfConstruction = '';
    if (!d.ageOfProperty) d.ageOfProperty = '';
    if (!d.residualAge) d.residualAge = '';

    // Valuation
    if (d.valLandAreaNum === undefined) d.valLandAreaNum = 0;
    if (d.valLandRateNum === undefined) d.valLandRateNum = 0;
    if (d.valLandTotalNum === undefined) d.valLandTotalNum = 0;

    if (d.valConstAreaNum === undefined) d.valConstAreaNum = 0;
    if (d.valConstRateNum === undefined) d.valConstRateNum = 0;
    if (d.valConstTotalNum === undefined) d.valConstTotalNum = 0;

    if (d.valDepPercentNum === undefined) d.valDepPercentNum = 0;
    if (d.valDepAmountNum === undefined) d.valDepAmountNum = 0;
    if (d.valPresentAfterDepNum === undefined) d.valPresentAfterDepNum = 0;
    if (d.valTotalValueNum === undefined) d.valTotalValueNum = 0;

    if (!d.valLandArea) d.valLandArea = '';
    if (!d.valLandRate) d.valLandRate = '';
    if (!d.valLandTotal) d.valLandTotal = '';

    if (!d.valConstArea) d.valConstArea = '';
    if (!d.valConstRate) d.valConstRate = '';
    if (!d.valConstTotal) d.valConstTotal = '';

    if (!d.valDepPercent) d.valDepPercent = '';
    if (!d.valDepAmount) d.valDepAmount = '';
    if (!d.valPresentAfterDep) d.valPresentAfterDep = '';
    if (!d.valTotalValue) d.valTotalValue = '';

    // Net Mortgagable
    if (!d.govtRateValue) d.govtRateValue = '';
    if (!d.forcedMarketPercent) d.forcedMarketPercent = '75% of the market value';
    if (!d.forcedMarketValue) d.forcedMarketValue = '';
    if (!d.earlierValued) d.earlierValued = 'No';
    if (!d.demolitionRisk) d.demolitionRisk = 'No';
    if (!d.marketabilityComments) d.marketabilityComments = 'High';
    if (!d.adverseRemarks) d.adverseRemarks = '';

    // Remarks & Sign-off
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
      const landA = parseFloat(String(next.valLandAreaNum ?? 0)) || 0;
      const landR = parseFloat(String(next.valLandRateNum ?? 0)) || 0;
      const constA = parseFloat(String(next.valConstAreaNum ?? 0)) || 0;
      const constR = parseFloat(String(next.valConstRateNum ?? 0)) || 0;
      const depP = parseFloat(String(next.valDepPercentNum ?? 0)) || 0;

      const calcLandTotal = Math.round(landA * landR);
      const calcConstTotal = Math.round(constA * constR);
      const calcDepAmt = Math.round((calcConstTotal * depP) / 100);
      const calcPresentConst = calcConstTotal - calcDepAmt;
      const calcTotalVal = calcLandTotal + calcPresentConst;
      const calcForced = Math.round(calcTotalVal * 0.75);

      if (['valLandAreaNum', 'valLandRateNum', 'valConstAreaNum', 'valConstRateNum', 'valDepPercentNum'].includes(key)) {
        next.valLandTotalNum = calcLandTotal;
        next.valLandTotal = `Rs.${calcLandTotal.toLocaleString('en-IN')}/-`;
        next.valLandArea = `${landA}sqft`;
        next.valLandRate = `Rs.${landR}/-`;

        next.valConstTotalNum = calcConstTotal;
        next.valConstTotal = `Rs.${calcConstTotal.toLocaleString('en-IN')}/-`;
        next.valConstArea = `${constA}Sqfts`;
        next.valConstRate = `Rs.${constR}/-`;

        next.valDepPercent = `${depP}%`;
        next.valDepAmountNum = calcDepAmt;
        next.valDepAmount = `${calcDepAmt.toLocaleString('en-IN')}/-`;

        next.valPresentAfterDepNum = calcPresentConst;
        next.valPresentAfterDep = `Rs.${calcPresentConst.toLocaleString('en-IN')}/-`;

        next.valTotalValueNum = calcTotalVal;
        next.valTotalValue = `Rs.${calcTotalVal.toLocaleString('en-IN')}/-`;

        next.forcedMarketValue = `Rs.${calcForced.toLocaleString('en-IN')}/-`;
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
      alert('Error uploading map image: ' + err.message);
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
        valuation_amount: fields.valTotalValueNum || 0,
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
    if (!confirm('Are you sure you want to submit this Varthana Finance report? It will mark the report as completed.')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: fields.valTotalValueNum || 0,
        updated_at: new Date().toISOString(),
      });
      await supabaseBrowser.from('projects').update({
        status: 'COMPLETED',
        valuation_amount: fields.valTotalValueNum || 0,
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
    const renderer = new PDFVarthanaFinanceRenderer({
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
      a.download = `Varthana_Finance_Valuation_${fields.refNo || projectCode || 'Report'}.pdf`;
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
      {/* ── Active Configuration Banner with Change Parameters ── */}
      <ActiveConfigBanner
        clientType="organisation"
        category="Bank & FIS"
        bankName={fields.organisationTemplate || 'VARTHANA FINANCE'}
        subclass={fields.organisationSubTemplate || undefined}
        onResetWizard={onResetWizard}
        sticky={false}
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
        <div className="bg-white rounded-xl shadow border border-slate-200 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              VARTHANA FINANCE — VALUATION REPORT
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Varthana Finance Format • Ref No: <span className="font-semibold text-slate-700">{fields.refNo || projectCode}</span>
            </p>
          </div>
          <EarliestFieldVisitBadge fieldVisit={earliestVisit} />
        </div>

        {earliestVisit && (
          <div className="flex items-center justify-between p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-900 text-sm">
            <span className="font-medium">Site inspection detected from uploaded images ({formatReportDate(earliestVisit.date)}).</span>
            <button
              type="button"
              onClick={() => {
                const dt = formatReportDate(earliestVisit.date);
                updateField('valuationDate', dt);
              }}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg shadow-sm transition"
            >
              Sync Valuation Date
            </button>
          </div>
        )}

        {/* 1. Header & Application Details */}
        <div id="varthana-sec-meta">
          <Section title="Application Details">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="Ref No">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.refNo || ''}
                  onChange={(e) => updateField('refNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Date of Valuation">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valuationDate || ''}
                  onChange={(e) => updateField('valuationDate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Valuer's Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valuerName || ''}
                  onChange={(e) => updateField('valuerName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Field label="Name of the School">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.schoolName || ''}
                  onChange={(e) => updateField('schoolName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Customer's Representative (at site)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.customerRepName || ''}
                  onChange={(e) => updateField('customerRepName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Contact Person's Nos">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.contactNos || ''}
                  onChange={(e) => updateField('contactNos', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Property Owner's Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ownerName || ''}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Holding Type">
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
              <Field label="Property Description">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.propertyDescription || ''}
                  onChange={(e) => updateField('propertyDescription', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <Field label="Documents Provided for Valuation Purpose">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.documentsProvided || ''}
                  onChange={(e) => updateField('documentsProvided', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Sale deed, Layout plan & Building sanction plan details">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.planAndDeedDetails || ''}
                  onChange={(e) => updateField('planAndDeedDetails', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Within Municipal Limits / Outskirts">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.withinMunicipalLimits || ''}
                    onChange={(e) => updateField('withinMunicipalLimits', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property Usage (Actual)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyUsageActual || ''}
                    onChange={(e) => updateField('propertyUsageActual', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* 2. Location, Access & Boundaries */}
        <div id="varthana-sec-access">
          <Section title="Location, Accessibility & Boundaries">
            <div className="space-y-3 mb-4">
              <Field label="Address of Property (As per documents)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.addressAsPerDoc || ''}
                  onChange={(e) => updateField('addressAsPerDoc', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Address of Property (As per site)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.addressAtSite || ''}
                  onChange={(e) => updateField('addressAtSite', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="Landmark">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.landmark || ''}
                  onChange={(e) => updateField('landmark', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Latitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.latitude || ''}
                  onChange={(e) => updateField('latitude', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.longitude || ''}
                  onChange={(e) => updateField('longitude', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Nature of the Location">
                <select
                  className={selectCls}
                  value={fields.natureOfLocation || 'Institutional'}
                  onChange={(e) => updateField('natureOfLocation', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Institutional">Institutional</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="Existing Road Width">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.existingRoadWidth || ''}
                  onChange={(e) => updateField('existingRoadWidth', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Site Access / Independent Access">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.siteAccessType || ''}
                  onChange={(e) => updateField('siteAccessType', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Proximity to Amenities</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Field label="Post Office">
                <input type="text" className={inputCls} value={fields.proximityPostOffice || ''} onChange={(e) => updateField('proximityPostOffice', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Banks">
                <input type="text" className={inputCls} value={fields.proximityBanks || ''} onChange={(e) => updateField('proximityBanks', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Police Station">
                <input type="text" className={inputCls} value={fields.proximityPoliceStation || ''} onChange={(e) => updateField('proximityPoliceStation', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Other Amenities">
                <input type="text" className={inputCls} value={fields.proximityOtherAmenities || ''} onChange={(e) => updateField('proximityOtherAmenities', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Field label="Conversion Order Details (Agri to Non-Agri)">
                <input type="text" className={inputCls} value={fields.conversionOrderDetails || ''} onChange={(e) => updateField('conversionOrderDetails', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Risk of Hi-Tension Lines/Towers">
                <input type="text" className={inputCls} value={fields.riskHiTension || ''} onChange={(e) => updateField('riskHiTension', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Risk of Water Body / River / Nala">
                <input type="text" className={inputCls} value={fields.riskWaterBody || ''} onChange={(e) => updateField('riskWaterBody', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Four Site Boundaries</h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 font-medium">
                  <tr>
                    <th className="px-3 py-2 text-left">Basis</th>
                    <th className="px-3 py-2 text-left">East</th>
                    <th className="px-3 py-2 text-left">West</th>
                    <th className="px-3 py-2 text-left">North</th>
                    <th className="px-3 py-2 text-left">South</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Document</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocEast || ''} onChange={(e) => updateField('bndDocEast', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocWest || ''} onChange={(e) => updateField('bndDocWest', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocNorth || ''} onChange={(e) => updateField('bndDocNorth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndDocSouth || ''} onChange={(e) => updateField('bndDocSouth', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Site</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSiteEast || ''} onChange={(e) => updateField('bndSiteEast', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSiteWest || ''} onChange={(e) => updateField('bndSiteWest', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSiteNorth || ''} onChange={(e) => updateField('bndSiteNorth', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSiteSouth || ''} onChange={(e) => updateField('bndSiteSouth', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Property Identification">
                <input type="text" className={inputCls} value={fields.propertyIdentification || ''} onChange={(e) => updateField('propertyIdentification', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Sanction Plan Details">
                <input type="text" className={inputCls} value={fields.sanctionPlanDetails || ''} onChange={(e) => updateField('sanctionPlanDetails', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Sanctioned Floors">
                <input type="text" className={inputCls} value={fields.sanctionedFloors || ''} onChange={(e) => updateField('sanctionedFloors', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Constructed Upto Floors">
                <input type="text" className={inputCls} value={fields.constructedUptoFloors || ''} onChange={(e) => updateField('constructedUptoFloors', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Sanctioned Area">
                <textarea rows={2} className={inputCls} value={fields.sanctionedArea || ''} onChange={(e) => updateField('sanctionedArea', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Constructed Area at Site">
                <textarea rows={2} className={inputCls} value={fields.constructedAreaAtSite || ''} onChange={(e) => updateField('constructedAreaAtSite', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="FAR Deviation %">
                <input type="text" className={inputCls} value={fields.farDeviationPercent || ''} onChange={(e) => updateField('farDeviationPercent', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Setback Comments">
                <input type="text" className={inputCls} value={fields.setbackDeviationComments || ''} onChange={(e) => updateField('setbackDeviationComments', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Can Deviation be Regularized?">
                <select className={selectCls} value={fields.deviationRegularized || 'NA'} onChange={(e) => updateField('deviationRegularized', e.target.value)} disabled={isReadOnly}>
                  <option value="NA">NA</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="If Regularized, How?">
                <input type="text" className={inputCls} value={fields.deviationRegularizedHow || ''} onChange={(e) => updateField('deviationRegularizedHow', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 3. Technical Details & Areas */}
        <div id="varthana-sec-technical">
          <Section title="Technical Details & Finishes">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="Type of Property">
                <input type="text" className={inputCls} value={fields.typeOfProperty || ''} onChange={(e) => updateField('typeOfProperty', e.target.value)} disabled={isReadOnly} />
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
              <Field label="No. of Lifts">
                <input type="text" className={inputCls} value={fields.noOfLifts || ''} onChange={(e) => updateField('noOfLifts', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Occupancy Status">
                <input type="text" className={inputCls} value={fields.occupancyStatus || ''} onChange={(e) => updateField('occupancyStatus', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="No. of Occupants">
                <input type="text" className={inputCls} value={fields.noOfOccupants || ''} onChange={(e) => updateField('noOfOccupants', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Commercial Usage Details">
                <input type="text" className={inputCls} value={fields.commercialUsageDetails || ''} onChange={(e) => updateField('commercialUsageDetails', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Finishes</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              <Field label="Exterior">
                <input type="text" className={inputCls} value={fields.finishExterior || ''} onChange={(e) => updateField('finishExterior', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Wall Finish">
                <input type="text" className={inputCls} value={fields.finishWall || ''} onChange={(e) => updateField('finishWall', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Flooring">
                <input type="text" className={inputCls} value={fields.finishFlooring || ''} onChange={(e) => updateField('finishFlooring', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Doors & Windows">
                <input type="text" className={inputCls} value={fields.finishDoorWindow || ''} onChange={(e) => updateField('finishDoorWindow', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Fittings">
                <input type="text" className={inputCls} value={fields.finishFittings || ''} onChange={(e) => updateField('finishFittings', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Floor-wise Area Breakdown</h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 font-medium">
                  <tr>
                    <th className="px-3 py-2 text-left">Basis</th>
                    <th className="px-3 py-2 text-left">Basement</th>
                    <th className="px-3 py-2 text-left">Ground Floor</th>
                    <th className="px-3 py-2 text-left">First Floor</th>
                    <th className="px-3 py-2 text-left">Second Floor</th>
                    <th className="px-3 py-2 text-left">Third Floor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">Constructed Area</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorConstBasement || 'NA'} onChange={(e) => updateField('floorConstBasement', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorConstGF || ''} onChange={(e) => updateField('floorConstGF', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorConstFF || ''} onChange={(e) => updateField('floorConstFF', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorConstSF || 'NA'} onChange={(e) => updateField('floorConstSF', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorConstTF || 'NA'} onChange={(e) => updateField('floorConstTF', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">Permissible Area</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorPermBasement || 'NA'} onChange={(e) => updateField('floorPermBasement', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorPermGF || ''} onChange={(e) => updateField('floorPermGF', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorPermFF || ''} onChange={(e) => updateField('floorPermFF', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorPermSF || 'NA'} onChange={(e) => updateField('floorPermSF', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.floorPermTF || 'NA'} onChange={(e) => updateField('floorPermTF', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="Total Permissible Area">
                <input type="text" className={inputCls} value={fields.totalPermissibleArea || ''} onChange={(e) => updateField('totalPermissibleArea', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Total Constructed Area">
                <input type="text" className={inputCls} value={fields.totalConstructedArea || ''} onChange={(e) => updateField('totalConstructedArea', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Land Area Extent">
                <input type="text" className={inputCls} value={fields.landArea || ''} onChange={(e) => updateField('landArea', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-4 mb-2">Completion Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Stage of Construction">
                <input type="text" className={inputCls} value={fields.stageOfConstruction || ''} onChange={(e) => updateField('stageOfConstruction', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Age of Property">
                <input type="text" className={inputCls} value={fields.ageOfProperty || ''} onChange={(e) => updateField('ageOfProperty', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Residual Age">
                <input type="text" className={inputCls} value={fields.residualAge || ''} onChange={(e) => updateField('residualAge', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 4. Valuation & Net Mortgagable */}
        <div id="varthana-sec-valuation">
          <Section title="Valuation (Live Calculation)">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
              <Field label="Gross Construction Value (Rs)">
                <div className="p-2.5 rounded-lg bg-slate-100 font-bold text-slate-900 border border-slate-200">
                  {formatIndianCurrency(fields.valConstTotalNum)}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Field label="Building Depreciation (%)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.valDepPercentNum ?? 0}
                  onChange={(e) => updateField('valDepPercentNum', parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Depreciation Amount (Rs)">
                <div className="p-2.5 rounded-lg bg-slate-100 font-medium text-rose-700 border border-slate-200">
                  {formatIndianCurrency(fields.valDepAmountNum)}
                </div>
              </Field>
              <Field label="Present Value After Depreciation (Rs)">
                <div className="p-2.5 rounded-lg bg-slate-100 font-bold text-emerald-800 border border-slate-200">
                  {formatIndianCurrency(fields.valPresentAfterDepNum)}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl mb-6">
              <div>
                <span className="text-xs uppercase font-semibold text-emerald-700 tracking-wider">Total Fair Market Value</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {formatIndianCurrency(fields.valTotalValueNum)}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {rupeesInWords(fields.valTotalValueNum || 0)}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-blue-700 tracking-wider">Forced Market Value (75%)</span>
                <div className="text-2xl font-black text-blue-900 mt-1">
                  {fields.forcedMarketValue}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  75% of fair market value
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Field label="Value as per Govt Rates">
                <input type="text" className={inputCls} value={fields.govtRateValue || ''} onChange={(e) => updateField('govtRateValue', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Comments on Marketability">
                <select className={selectCls} value={fields.marketabilityComments || 'High'} onChange={(e) => updateField('marketabilityComments', e.target.value)} disabled={isReadOnly}>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </Field>
              <Field label="Demolition Risk?">
                <input type="text" className={inputCls} value={fields.demolitionRisk || ''} onChange={(e) => updateField('demolitionRisk', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Earlier Valued by You?">
                <select className={selectCls} value={fields.earlierValued || 'No'} onChange={(e) => updateField('earlierValued', e.target.value)} disabled={isReadOnly}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
              <Field label="Other Adverse Remarks">
                <input type="text" className={inputCls} value={fields.adverseRemarks || ''} onChange={(e) => updateField('adverseRemarks', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 5. Declaration & Remarks */}
        <div id="varthana-sec-remarks">
          <Section title="Declaration, Observations & Sign-off">
            <div className="space-y-4">
              <Field label="Valuation Remarks & Observations">
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
                <Field label="Date of Inspection / Sign">
                  <input type="text" className={inputCls} value={fields.valuationDate || ''} onChange={(e) => updateField('valuationDate', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* 6. Attachments: Amin Map, Documents & Photographs */}
        <div id="varthana-sec-attachments" className="space-y-6">
          <BaseMapsSection
            title="Amin Sketch-Map & Location Plans"
            sectionId="varthana-sec-maps"
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

          <BaseDocumentsSection
            title="Verified Property Documents"
            sectionId="varthana-sec-docs"
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

          <BasePhotographsSection
            title="Property Site Photographs"
            sectionId="varthana-sec-photos"
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
