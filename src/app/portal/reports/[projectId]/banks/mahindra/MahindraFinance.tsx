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
import { PDFMahindraFinanceRenderer } from '@/lib/banks/pdf-mahindra-finance-renderer';

export const MAHINDRA_FINANCE_CONFIG: BankConfig = {
  bankId: 'MAHINDRA FINANCE LTD',
  subTemplateId: '',
  displayName: 'Mahindra & Mahindra Financial Services Ltd',
  defaultValues: {
    purpose: 'Housing / SME / Commercial Asset Valuation',
  },
};

export interface MahindraFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function MahindraFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: MahindraFinanceProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  const navSections: NavItem[] = [
    { id: 'mh-sec-header', title: 'Header & Branch' },
    { id: 'mh-sec-basic', title: '1-4. Basic Details' },
    { id: 'mh-sec-locality', title: '5-8. Locality & Surrounding' },
    { id: 'mh-sec-property', title: '9-13. Property & Building' },
    { id: 'mh-sec-sanction', title: '14-20. Sanction & Setbacks' },
    { id: 'mh-sec-valuation', title: '21. Valuation & Rates' },
    { id: 'mh-sec-boundaries', title: '22. Boundaries & Remarks' },
    { id: 'mh-sec-declaration', title: 'Declaration & Sign-off' },
    { id: 'mh-sec-attachments', title: 'Attachments' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initialize fields
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // Meta Header
    if (!d.branchName) d.branchName = p.branch || 'Bhubaneswar';
    if (!d.typeOfCase) d.typeOfCase = 'NA';
    if (!d.valuerName) d.valuerName = 'Er. Satyajit Mohanty';
    if (!d.dateOfVisit) d.dateOfVisit = earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date().toISOString());
    if (!d.caseRefNo) d.caseRefNo = projectCode || '';
    if (!d.reportDate) d.reportDate = formatReportDate(new Date().toISOString());
    if (!d.contactPerson) {
      d.contactPerson = p.applicantName || p.contactName
        ? `${p.applicantName || p.contactName}${p.contactPhone ? `, Mob: ${p.contactPhone}` : ''}`
        : '';
    }

    // 1-4 Basic Details
    if (!d.applicantName) d.applicantName = p.applicantName || p.contactName || '';
    if (!d.propertyTypeDesc) d.propertyTypeDesc = p.propertyType || '';
    if (!d.currentUsage) d.currentUsage = p.currentUsage || '';
    if (!d.addressAtSite) d.addressAtSite = p.propertyAddress || '';
    if (!d.addressAsPerDoc) d.addressAsPerDoc = p.propertyAddress || '';
    if (!d.priorValuation) d.priorValuation = 'No';

    // 5-8 Locality Details
    if (!d.localityType) d.localityType = 'Residential';
    if (!d.localityClass) d.localityClass = 'Middle Class';
    if (!d.siteStatus) d.siteStatus = 'Developing';
    if (!d.proximityAmenities) d.proximityAmenities = 'Within 1-2 Kms';
    if (!d.railwayStation) d.railwayStation = '';
    if (!d.busStop) d.busStop = '';
    if (!d.landmark) d.landmark = p.landmark || '';
    if (!d.distanceCityCenter) d.distanceCityCenter = '';
    if (!d.approachRoad) d.approachRoad = '';

    // 9-13 Property Details
    if (!d.occupantStatus) d.occupantStatus = 'Owner';
    if (!d.occupantName) d.occupantName = p.applicantName || p.contactName || 'NA';
    if (!d.occupantRelation) d.occupantRelation = 'Self';

    if (!d.propertyDemarcation) d.propertyDemarcation = 'Yes';
    if (!d.propertyIdentifiedThrough) d.propertyIdentifiedThrough = p.applicantName || p.contactName || '';
    if (!d.structureType) d.structureType = 'RCC framed structure';
    if (!d.landPlotAreaDesc) d.landPlotAreaDesc = p.landArea ? `${p.landArea} sq.ft` : '';
    if (!d.noOfBlocks) d.noOfBlocks = '1';
    if (!d.noOfUnits) d.noOfUnits = '1';
    if (!d.noOfFloors) d.noOfFloors = 'GF';
    if (!d.noOfLifts) d.noOfLifts = 'NA';

    if (!d.unitFloorNo) d.unitFloorNo = 'NA';
    if (!d.unitRooms) d.unitRooms = 'NA';
    if (!d.unitBuaMeasured) d.unitBuaMeasured = p.builtUpArea ? `${p.builtUpArea} sq.ft` : '';
    if (!d.unitCarpetArea) d.unitCarpetArea = '';
    if (!d.unitRemarksView) d.unitRemarksView = 'NA';

    if (!d.qualityExteriors) d.qualityExteriors = 'Average';
    if (!d.qualityInteriors) d.qualityInteriors = 'Average';
    if (!d.ageOfProperty) d.ageOfProperty = '';
    if (!d.residualLife) d.residualLife = '';

    // 14-20 Sanctions & Setbacks
    if (!d.sanctionApprovalNo) d.sanctionApprovalNo = 'Plan not provided';
    if (!d.ownershipType) d.ownershipType = 'Freehold';
    if (!d.documentsVerified) d.documentsVerified = 'Copy of Sale deed, ROR';
    if (!d.municipalLimits) d.municipalLimits = '';
    if (!d.permissibleUsageMasterPlan) d.permissibleUsageMasterPlan = 'NA';

    // Setbacks
    if (!d.setbackFrontPlan) d.setbackFrontPlan = 'NA';
    if (!d.setbackFrontSite) d.setbackFrontSite = 'NA';
    if (!d.setbackFrontDev) d.setbackFrontDev = 'NA';
    if (!d.setbackFrontRem) d.setbackFrontRem = 'NA';

    if (!d.setbackSide1Plan) d.setbackSide1Plan = 'NA';
    if (!d.setbackSide1Site) d.setbackSide1Site = 'NA';
    if (!d.setbackSide1Dev) d.setbackSide1Dev = 'NA';
    if (!d.setbackSide1Rem) d.setbackSide1Rem = 'NA';

    if (!d.setbackSide2Plan) d.setbackSide2Plan = 'NA';
    if (!d.setbackSide2Site) d.setbackSide2Site = 'NA';
    if (!d.setbackSide2Dev) d.setbackSide2Dev = 'NA';
    if (!d.setbackSide2Rem) d.setbackSide2Rem = 'NA';

    if (!d.setbackRearPlan) d.setbackRearPlan = 'NA';
    if (!d.setbackRearSite) d.setbackRearSite = 'NA';
    if (!d.setbackRearDev) d.setbackRearDev = 'NA';
    if (!d.setbackRearRem) d.setbackRearRem = 'NA';

    // Floor Wise Area
    if (!d.permBasement) d.permBasement = 'NA';
    if (!d.permStilt) d.permStilt = 'NA';
    if (!d.permGround) d.permGround = 'NA';
    if (!d.permFirst) d.permFirst = 'NA';
    if (!d.permSecond) d.permSecond = 'NA';
    if (!d.permThird) d.permThird = 'NA';

    if (!d.constBasement) d.constBasement = 'NA';
    if (!d.constStilt) d.constStilt = 'NA';
    if (!d.constGround) d.constGround = '';
    if (!d.constFirst) d.constFirst = '';
    if (!d.constSecond) d.constSecond = 'NA';
    if (!d.constThird) d.constThird = 'NA';

    // 21 Valuation
    if (!d.landAreaSqft) d.landAreaSqft = p.landArea || 0;
    if (!d.landRateSqft) d.landRateSqft = 0;
    if (!d.landValuationVal) d.landValuationVal = 0;

    if (!d.constructionDesc) d.constructionDesc = p.builtUpArea ? `Construction (${p.builtUpArea} sq.ft)` : 'Construction';
    if (!d.constructionAreaSqft) d.constructionAreaSqft = p.builtUpArea || 0;
    if (!d.constructionRateSqft) d.constructionRateSqft = 0;
    if (!d.constructionValuationVal) d.constructionValuationVal = 0;
    if (!d.stageOfConstruction) d.stageOfConstruction = '100%';

    if (!d.amenityCarParking) d.amenityCarParking = 'NA';
    if (!d.amenityPlc) d.amenityPlc = 'NA';
    if (!d.amenityIdc) d.amenityIdc = 'NA';
    if (!d.amenityEdc) d.amenityEdc = 'NA';
    if (!d.amenityPowerBackup) d.amenityPowerBackup = 'NA';
    if (!d.amenityOther) d.amenityOther = 'NA';
    if (!d.totalAmenitiesCharges) d.totalAmenitiesCharges = 'Nil';

    if (!d.totalMarketValue) d.totalMarketValue = 0;
    if (!d.forcedSalePercent) d.forcedSalePercent = 80;
    if (!d.forcedSaleValue) d.forcedSaleValue = 0;
    if (!d.approxRentals) d.approxRentals = '';

    // 22 Boundaries & Remarks
    if (!d.boundaryEastDeed) d.boundaryEastDeed = p.boundaryEast || 'Not Mentioned';
    if (!d.boundaryWestDeed) d.boundaryWestDeed = p.boundaryWest || 'Not Mentioned';
    if (!d.boundaryNorthDeed) d.boundaryNorthDeed = p.boundaryNorth || 'Not Mentioned';
    if (!d.boundarySouthDeed) d.boundarySouthDeed = p.boundarySouth || 'Not Mentioned';

    if (!d.boundaryEastSite) d.boundaryEastSite = p.boundaryEast || '';
    if (!d.boundaryWestSite) d.boundaryWestSite = p.boundaryWest || '';
    if (!d.boundaryNorthSite) d.boundaryNorthSite = p.boundaryNorth || '';
    if (!d.boundarySouthSite) d.boundarySouthSite = p.boundarySouth || '';

    if (!d.boundaryEastSketch) d.boundaryEastSketch = '';
    if (!d.boundaryWestSketch) d.boundaryWestSketch = '';
    if (!d.boundaryNorthSketch) d.boundaryNorthSketch = '';
    if (!d.boundarySouthSketch) d.boundarySouthSketch = '';

    if (!d.boundariesMatching) d.boundariesMatching = 'Yes';
    if (!d.remarks) d.remarks = '';

    if (!d.engineerName) d.engineerName = 'Er. Satyajit Mohanty';

    // Attachments
    if (!d.documentImages) d.documentImages = [];
    if (!d.documentImageNames) d.documentImageNames = [];
    if (!d.locationMapImages) d.locationMapImages = [];
    if (!d.sketchMapImages) d.sketchMapImages = [];
    if (!d.mouzaMapImages) d.mouzaMapImages = [];
    if (!d.cadastralMapImages) d.cadastralMapImages = [];
    if (!d.bdaMapImages) d.bdaMapImages = [];
    if (!d.propertyImages) d.propertyImages = [];
    if (!d.propertyImageNames) d.propertyImageNames = [];

    return d;
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<string | boolean>(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleFieldChange = useCallback((field: string, val: any) => {
    setFields(prev => {
      const next = { ...prev, [field]: val };

      // Auto compute valuation
      if (['landAreaSqft', 'landRateSqft'].includes(field)) {
        const area = Number(field === 'landAreaSqft' ? val : next.landAreaSqft) || 0;
        const rate = Number(field === 'landRateSqft' ? val : next.landRateSqft) || 0;
        const landVal = Math.round(area * rate);
        next.landValuationVal = landVal;
        const cVal = Number(next.constructionValuationVal) || 0;
        const tot = landVal + cVal;
        next.totalMarketValue = tot;
        const fPct = Number(next.forcedSalePercent) || 80;
        next.forcedSaleValue = Math.round((tot * fPct) / 100);
      }

      if (['constructionAreaSqft', 'constructionRateSqft'].includes(field)) {
        const area = Number(field === 'constructionAreaSqft' ? val : next.constructionAreaSqft) || 0;
        const rate = Number(field === 'constructionRateSqft' ? val : next.constructionRateSqft) || 0;
        const cVal = Math.round(area * rate);
        next.constructionValuationVal = cVal;
        const lVal = Number(next.landValuationVal) || 0;
        const tot = lVal + cVal;
        next.totalMarketValue = tot;
        const fPct = Number(next.forcedSalePercent) || 80;
        next.forcedSaleValue = Math.round((tot * fPct) / 100);
      }

      if (field === 'forcedSalePercent') {
        const fPct = Number(val) || 80;
        const tot = Number(next.totalMarketValue) || 0;
        next.forcedSaleValue = Math.round((tot * fPct) / 100);
      }

      return next;
    });
  }, []);

  // Upload handlers
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
      setFields(prev => ({
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
        newNames.push(`Photograph ${(fields.propertyImages?.length || 0) + i + 1}`);
      }
      setFields(prev => ({
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
      setFields(prev => ({
        ...prev,
        [mapKey]: [...(prev[mapKey] || []), ...newUrls],
      }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Save handler
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setAutoSaveStatus('saving');
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: fields.totalMarketValue || 0,
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
    if (!confirm('Are you sure you want to submit this Mahindra Finance report?')) return;
    try {
      setSubmitting(true);
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: fields.totalMarketValue || 0,
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

  // PDF Preview & Download
  const handlePreviewPDF = async () => {
    try {
      setPreviewing(true);
      const renderer = new PDFMahindraFinanceRenderer({
        ...fields,
        projectCode,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert('Error previewing PDF: ' + err.message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setPreviewing(true);
      const renderer = new PDFMahindraFinanceRenderer({
        ...fields,
        projectCode,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mahindra_Finance_${projectCode || 'Report'}.pdf`;
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
    <div className="space-y-6 pb-28 w-full">
      {/* ── Active Configuration Banner with Change Parameters ── */}
      <ActiveConfigBanner
        clientType="organisation"
        category="Bank & FIS"
        bankName={fields.organisationTemplate || 'MAHINDRA RURAL HOUSING FINANCE LTD'}
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
              MAHINDRA FINANCE - VALUATION REPORT
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Mahindra & Mahindra Financial Services Limited Format • Project Code: <span className="font-semibold text-slate-700">{projectCode}</span>
            </p>
          </div>
          <EarliestFieldVisitBadge fieldVisit={earliestVisit} />
        </div>

        {/* 1. Header & Branch */}
        <div id="mh-sec-header">
          <Section title="Header & Branch Meta Details">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Branch Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.branchName || ''}
                  onChange={e => handleFieldChange('branchName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Type of Case">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.typeOfCase || ''}
                  onChange={e => handleFieldChange('typeOfCase', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Valuer Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valuerName || ''}
                  onChange={e => handleFieldChange('valuerName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Date of Visit">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.dateOfVisit || ''}
                  onChange={e => handleFieldChange('dateOfVisit', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Case Ref. No">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.caseRefNo || ''}
                  onChange={e => handleFieldChange('caseRefNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Date of Report">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.reportDate || ''}
                  onChange={e => handleFieldChange('reportDate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Contacted Person for property inspection (Name/ Mobile)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.contactPerson || ''}
                  onChange={e => handleFieldChange('contactPerson', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 2. Basic Details (Points 1 - 4) */}
        <div id="mh-sec-basic">
          <Section title="BASIC DETAILS (Points 1 - 4)">
            <div className="space-y-4">
              <Field label="1. Applicant/s Name/s">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.applicantName || ''}
                  onChange={e => handleFieldChange('applicantName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="2. Type of property">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyTypeDesc || ''}
                    onChange={e => handleFieldChange('propertyTypeDesc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Current Usage">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.currentUsage || ''}
                    onChange={e => handleFieldChange('currentUsage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
              <Field label="3. Address at site">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.addressAtSite || ''}
                  onChange={e => handleFieldChange('addressAtSite', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Address as per document">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.addressAsPerDoc || ''}
                  onChange={e => handleFieldChange('addressAsPerDoc', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="4. Has the valuator done valuation of this property before this? If yes, when, for whom?">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.priorValuation || ''}
                  onChange={e => handleFieldChange('priorValuation', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 3. Locality & Surrounding (Points 5 - 8) */}
        <div id="mh-sec-locality">
          <Section title="SURROUNDING & LOCALITY DETAILS (Points 5 - 8)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="5. Location - Type (Comm., Res, Ind, Mix)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.localityType || ''}
                  onChange={e => handleFieldChange('localityType', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Class of Locality">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.localityClass || ''}
                  onChange={e => handleFieldChange('localityClass', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Site is (Dev, Under Dev)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.siteStatus || ''}
                  onChange={e => handleFieldChange('siteStatus', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Proximity to civic amenities/public transport">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.proximityAmenities || ''}
                  onChange={e => handleFieldChange('proximityAmenities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Railway Station">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.railwayStation || ''}
                  onChange={e => handleFieldChange('railwayStation', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Bus Stop">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.busStop || ''}
                  onChange={e => handleFieldChange('busStop', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="6. Close Vicinity / Landmark">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.landmark || ''}
                  onChange={e => handleFieldChange('landmark', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="7. Distance from City Center">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.distanceCityCenter || ''}
                  onChange={e => handleFieldChange('distanceCityCenter', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="8. Condition and width of approach road">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.approachRoad || ''}
                  onChange={e => handleFieldChange('approachRoad', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 4. Property & Building Details (Points 9 - 13) */}
        <div id="mh-sec-property">
          <Section title="PROPERTY & BUILDING DETAILS (Points 9 - 13)">
            {/* 9. Occupant */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4 space-y-4">
              <h4 className="font-semibold text-slate-800 text-sm">9. Occupant</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Vacant / Occupied">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.occupantStatus || ''}
                    onChange={e => handleFieldChange('occupantStatus', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Name of Occupant">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.occupantName || ''}
                    onChange={e => handleFieldChange('occupantName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Relation with applicant">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.occupantRelation || ''}
                    onChange={e => handleFieldChange('occupantRelation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 10. Building Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4 space-y-4">
              <h4 className="font-semibold text-slate-800 text-sm">10. Building Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Property Demarcation">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyDemarcation || ''}
                    onChange={e => handleFieldChange('propertyDemarcation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property Identified through">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyIdentifiedThrough || ''}
                    onChange={e => handleFieldChange('propertyIdentifiedThrough', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of structure">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.structureType || ''}
                    onChange={e => handleFieldChange('structureType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Land/Plot Area">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landPlotAreaDesc || ''}
                    onChange={e => handleFieldChange('landPlotAreaDesc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No of Blocks">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfBlocks || ''}
                    onChange={e => handleFieldChange('noOfBlocks', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No of Units">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfUnits || ''}
                    onChange={e => handleFieldChange('noOfUnits', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No. of Floors">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfFloors || ''}
                    onChange={e => handleFieldChange('noOfFloors', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No. of Lifts">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.noOfLifts || ''}
                    onChange={e => handleFieldChange('noOfLifts', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 11. Unit Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4 space-y-4">
              <h4 className="font-semibold text-slate-800 text-sm">11. Unit Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Located on Floor No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unitFloorNo || ''}
                    onChange={e => handleFieldChange('unitFloorNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No. of rooms">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unitRooms || ''}
                    onChange={e => handleFieldChange('unitRooms', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Built up area Measured">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unitBuaMeasured || ''}
                    onChange={e => handleFieldChange('unitBuaMeasured', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Carpet area">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unitCarpetArea || ''}
                    onChange={e => handleFieldChange('unitCarpetArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
              <Field label="Remarks on view from property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.unitRemarksView || ''}
                  onChange={e => handleFieldChange('unitRemarksView', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* 12-13. Quality & Age */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="12. Quality - Exteriors">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.qualityExteriors || ''}
                  onChange={e => handleFieldChange('qualityExteriors', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Quality - Interiors">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.qualityInteriors || ''}
                  onChange={e => handleFieldChange('qualityInteriors', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="13. Age of property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ageOfProperty || ''}
                  onChange={e => handleFieldChange('ageOfProperty', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Residual life">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.residualLife || ''}
                  onChange={e => handleFieldChange('residualLife', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 5. Sanction Plan Approval & Setbacks (Points 14 - 20) */}
        <div id="mh-sec-sanction">
          <Section title="SANCTION PLAN APPROVAL & OTHER DOCUMENTS DETAILS (Points 14 - 20)">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="14. Sanctioned plans verified with approval no">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sanctionApprovalNo || ''}
                  onChange={e => handleFieldChange('sanctionApprovalNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="15. Ownership type (Leasehold/ Freehold)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ownershipType || ''}
                  onChange={e => handleFieldChange('ownershipType', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="16. Property documents verified">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.documentsVerified || ''}
                  onChange={e => handleFieldChange('documentsVerified', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="17. Is the property within Municipal Limits">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.municipalLimits || ''}
                  onChange={e => handleFieldChange('municipalLimits', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="18. Permissible usage allow as per master plan">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.permissibleUsageMasterPlan || ''}
                  onChange={e => handleFieldChange('permissibleUsageMasterPlan', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* 19. Setbacks Matrix */}
            <div className="mt-6">
              <h4 className="font-semibold text-slate-800 text-sm mb-3">19. Setbacks Table</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-2 border-r">Side</th>
                      <th className="p-2 border-r">As per plan / Bye laws</th>
                      <th className="p-2 border-r">Actual at site</th>
                      <th className="p-2 border-r">Deviation</th>
                      <th className="p-2">Remarks, if any</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { side: 'Front', key: 'Front' },
                      { side: 'Side1 (Left)', key: 'Side1' },
                      { side: 'Side2 (Right)', key: 'Side2' },
                      { side: 'Rear', key: 'Rear' },
                    ].map(row => (
                      <tr key={row.key}>
                        <td className="p-2 font-medium bg-slate-50 border-r">{row.side}</td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[`setback${row.key}Plan`] || ''}
                            onChange={e => handleFieldChange(`setback${row.key}Plan`, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[`setback${row.key}Site`] || ''}
                            onChange={e => handleFieldChange(`setback${row.key}Site`, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2 border-r">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[`setback${row.key}Dev`] || ''}
                            onChange={e => handleFieldChange(`setback${row.key}Dev`, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[`setback${row.key}Rem`] || ''}
                            onChange={e => handleFieldChange(`setback${row.key}Rem`, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 20. Floor Wise Area (In Sft.) */}
            <div className="mt-6">
              <h4 className="font-semibold text-slate-800 text-sm mb-3">20. Floor Wise Area (In Sft.)</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-2 border-r">Category</th>
                      <th className="p-2 border-r">Basement</th>
                      <th className="p-2 border-r">Stilt</th>
                      <th className="p-2 border-r">Ground</th>
                      <th className="p-2 border-r">First</th>
                      <th className="p-2 border-r">Second</th>
                      <th className="p-2">Third</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 font-medium bg-slate-50 border-r">Permissible area</td>
                      {['Basement', 'Stilt', 'Ground', 'First', 'Second', 'Third'].map(fl => (
                        <td key={fl} className="p-2 border-r last:border-r-0">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[`perm${fl}`] || ''}
                            onChange={e => handleFieldChange(`perm${fl}`, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-2 font-medium bg-slate-50 border-r">Total Constructed</td>
                      {['Basement', 'Stilt', 'Ground', 'First', 'Second', 'Third'].map(fl => (
                        <td key={fl} className="p-2 border-r last:border-r-0">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[`const${fl}`] || ''}
                            onChange={e => handleFieldChange(`const${fl}`, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </Section>
        </div>

        {/* 6. Valuation & Rates (Point 21) */}
        <div id="mh-sec-valuation">
          <Section title="21. VALUATION (Description of Constructed Area, Amenities & Rates)">
            <div className="space-y-6">
              {/* Land Component */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">Land Valuation (A)</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Land Area (Sq.ft)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={inputCls}
                      value={fields.landAreaSqft ?? ''}
                      onChange={e => handleFieldChange('landAreaSqft', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Rate per Sq.ft (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={inputCls}
                      value={fields.landRateSqft ?? ''}
                      onChange={e => handleFieldChange('landRateSqft', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Land Amount (Rs.)">
                    <input
                      type="text"
                      className={`${inputCls} font-bold text-emerald-700 bg-slate-100`}
                      value={`Rs. ${formatIndianCurrency(Number(fields.landValuationVal) || 0)}/-`}
                      readOnly
                    />
                  </Field>
                </div>
              </div>

              {/* Construction Component */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">Construction Valuation (B)</h4>
                <Field label="Construction Description">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.constructionDesc || ''}
                    onChange={e => handleFieldChange('constructionDesc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Field label="BUA (Sq.ft)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={inputCls}
                      value={fields.constructionAreaSqft ?? ''}
                      onChange={e => handleFieldChange('constructionAreaSqft', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Rate per Sq.ft (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={inputCls}
                      value={fields.constructionRateSqft ?? ''}
                      onChange={e => handleFieldChange('constructionRateSqft', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Stage of Construction">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.stageOfConstruction || ''}
                      onChange={e => handleFieldChange('stageOfConstruction', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Recommended Construction (Rs.)">
                    <input
                      type="text"
                      className={`${inputCls} font-bold text-emerald-700 bg-slate-100`}
                      value={`Rs. ${formatIndianCurrency(Number(fields.constructionValuationVal) || 0)}/-`}
                      readOnly
                    />
                  </Field>
                </div>
              </div>

              {/* Extra Amenities */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">Value of Extra Amenities (if applicable)</h4>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  <Field label="Car Parking">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.amenityCarParking || ''}
                      onChange={e => handleFieldChange('amenityCarParking', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="PLC">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.amenityPlc || ''}
                      onChange={e => handleFieldChange('amenityPlc', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="IDC">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.amenityIdc || ''}
                      onChange={e => handleFieldChange('amenityIdc', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="EDC">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.amenityEdc || ''}
                      onChange={e => handleFieldChange('amenityEdc', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Power Backup">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.amenityPowerBackup || ''}
                      onChange={e => handleFieldChange('amenityPowerBackup', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Other">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.amenityOther || ''}
                      onChange={e => handleFieldChange('amenityOther', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
                <Field label="Total Amenities charges">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalAmenitiesCharges || ''}
                    onChange={e => handleFieldChange('totalAmenitiesCharges', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Total Market Value & Forced Sale Summary */}
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Total Market Value of Property (A+B)">
                    <div className="text-xl font-bold text-emerald-800">
                      Rs. {formatIndianCurrency(Number(fields.totalMarketValue) || 0)}/-
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {rupeesInWords(Number(fields.totalMarketValue) || 0)}
                    </p>
                  </Field>
                  <Field label="Forced Sale Value (%) & Amount">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        className={`${inputCls} w-20`}
                        value={fields.forcedSalePercent ?? 80}
                        onChange={e => handleFieldChange('forcedSalePercent', e.target.value)}
                        disabled={isReadOnly}
                      />
                      <span className="font-semibold text-slate-700">% =</span>
                      <span className="font-bold text-slate-900">
                        Rs. {formatIndianCurrency(Number(fields.forcedSaleValue) || 0)}/-
                      </span>
                    </div>
                  </Field>
                  <Field label="Approx. Rentals in case of 100% complete property">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.approxRentals || ''}
                      onChange={e => handleFieldChange('approxRentals', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* 7. Boundaries & Remarks (Point 22) */}
        <div id="mh-sec-boundaries">
          <Section title="22. BOUNDARIES & REMARKS">
            <div className="overflow-x-auto border border-slate-200 rounded-lg mb-4">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                  <tr>
                    <th className="p-2 border-r">Boundaries</th>
                    <th className="p-2 border-r">EAST</th>
                    <th className="p-2 border-r">WEST</th>
                    <th className="p-2 border-r">NORTH</th>
                    <th className="p-2">SOUTH</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="p-2 font-medium bg-slate-50 border-r">As per deed/Sale deed</td>
                    {['East', 'West', 'North', 'South'].map(dir => (
                      <td key={dir} className="p-2 border-r last:border-r-0">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields[`boundary${dir}Deed`] || ''}
                          onChange={e => handleFieldChange(`boundary${dir}Deed`, e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 font-medium bg-slate-50 border-r">At site</td>
                    {['East', 'West', 'North', 'South'].map(dir => (
                      <td key={dir} className="p-2 border-r last:border-r-0">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields[`boundary${dir}Site`] || ''}
                          onChange={e => handleFieldChange(`boundary${dir}Site`, e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="p-2 font-medium bg-slate-50 border-r">As per sketch map</td>
                    {['East', 'West', 'North', 'South'].map(dir => (
                      <td key={dir} className="p-2 border-r last:border-r-0">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields[`boundary${dir}Sketch`] || ''}
                          onChange={e => handleFieldChange(`boundary${dir}Sketch`, e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <Field label="Boundaries Matching">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.boundariesMatching || ''}
                  onChange={e => handleFieldChange('boundariesMatching', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Remarks:- (Detailed Valuation & Amalgamation Narrative)">
                <textarea
                  rows={6}
                  className={inputCls}
                  value={fields.remarks || ''}
                  onChange={e => handleFieldChange('remarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 8. Declaration & Sign Off */}
        <div id="mh-sec-declaration">
          <Section title="Declaration & Sign-off">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-700 leading-relaxed">
              <p><strong>1.</strong> I hereby declare that; I have no direct and indirect interest in the property valued and the information furnished in the report is true and correct to the best of my knowledge of belief.</p>
              <p><strong>2.</strong> Any additions or alterations after the date of inspection shall not fall under the scope of this report.</p>
              <p><strong>3.</strong> The legal aspects are not in the scope of evaluation of the property.</p>
              <p><strong>4.</strong> The Property is identified by the owner before the valuer. This valuation report is prepared without any prejudice and bias to any person or institution.</p>
              <p><strong>5.</strong> This report has been prepared on basis of verifications in the locality.</p>
              <p><strong>6.</strong> I am not required to given testimony or appear in court by any reason of this appraisal report, with reference to the property in question.</p>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name of Engineer who visited the property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.engineerName || ''}
                  onChange={e => handleFieldChange('engineerName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Signatory Authority">
                <input
                  type="text"
                  className={inputCls}
                  value="(Authorized Signatory)"
                  disabled
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 9. Attachments: Maps, Documents, Photographs */}
        <div id="mh-sec-attachments" className="space-y-6">
          <BaseDocumentsSection
            title="Verified Property Documents"
            sectionId="mh-sec-docs"
            documentImages={fields.documentImages || []}
            documentImageNames={fields.documentImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onUploadDocuments={handleDocUpload}
            onRemoveDocument={idx => setFields(p => ({
              ...p,
              documentImages: (p.documentImages || []).filter((_: any, i: number) => i !== idx),
              documentImageNames: (p.documentImageNames || []).filter((_: any, i: number) => i !== idx),
            }))}
            onDocumentNameChange={(idx, name) => {
              const arr = [...(fields.documentImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFields(p => ({ ...p, documentImageNames: arr }));
            }}
            onReorderDocuments={(newImgs, newNames) => setFields(p => ({ ...p, documentImages: newImgs, documentImageNames: newNames }))}
          />

          <BaseMapsSection
            title="Location Sketch & Route Maps"
            sectionId="mh-sec-maps"
            locationMapImages={fields.locationMapImages || []}
            mouzaMapImages={fields.mouzaMapImages || []}
            sketchMapImages={fields.sketchMapImages || []}
            cadastralMapImages={fields.cadastralMapImages || []}
            bdaMapImages={fields.bdaMapImages || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onLocationMapUpload={e => handleMapUpload('locationMapImages', e)}
            onLocationMapRemove={idx => setFields(p => ({ ...p, locationMapImages: (p.locationMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onMouzaMapUpload={e => handleMapUpload('mouzaMapImages', e)}
            onMouzaMapRemove={idx => setFields(p => ({ ...p, mouzaMapImages: (p.mouzaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onSketchMapUpload={e => handleMapUpload('sketchMapImages', e)}
            onSketchMapRemove={idx => setFields(p => ({ ...p, sketchMapImages: (p.sketchMapImages || []).filter((_: any, i: number) => i !== idx) }))}
            onCadastralMapUpload={e => handleMapUpload('cadastralMapImages', e)}
            onCadastralMapRemove={idx => setFields(p => ({ ...p, cadastralMapImages: (p.cadastralMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onBdaMapUpload={e => handleMapUpload('bdaMapImages', e)}
            onBdaMapRemove={idx => setFields(p => ({ ...p, bdaMapImages: (p.bdaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onReorderLocationMap={newImgs => setFields(p => ({ ...p, locationMapImages: newImgs }))}
            onReorderMouzaMap={newImgs => setFields(p => ({ ...p, mouzaMapImages: newImgs }))}
            onReorderSketchMap={newImgs => setFields(p => ({ ...p, sketchMapImages: newImgs }))}
            onReorderCadastralMap={newImgs => setFields(p => ({ ...p, cadastralMapImages: newImgs }))}
            onReorderBdaMap={newImgs => setFields(p => ({ ...p, bdaMapImages: newImgs }))}
          />

          <BasePhotographsSection
            title="Property Site Photographs"
            sectionId="mh-sec-photos"
            propertyImages={fields.propertyImages || []}
            propertyImageNames={fields.propertyImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            bucketCount={bucketImages?.length || 0}
            onOpenBucketPicker={() => setShowBucketModal(true)}
            onUploadImages={handlePhotoUpload}
            onRemoveImage={idx => setFields(p => ({
              ...p,
              propertyImages: (p.propertyImages || []).filter((_: any, i: number) => i !== idx),
              propertyImageNames: (p.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
            }))}
            onImageNameChange={(idx, name) => {
              const arr = [...(fields.propertyImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFields(p => ({ ...p, propertyImageNames: arr }));
            }}
            onReorderImages={(newImgs, newNames) => setFields(p => ({ ...p, propertyImages: newImgs, propertyImageNames: newNames }))}
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
            setFields(prev => ({
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
