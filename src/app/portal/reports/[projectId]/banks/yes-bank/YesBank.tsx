'use client';

import { sanitizeFilenameCode } from '@/lib/utils';

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
import { PDFYesBankRenderer } from '@/lib/banks/pdf-yes-bank-renderer';

export const YES_BANK_CONFIG: BankConfig = {
  bankId: 'YES BANK',
  subTemplateId: '',
  displayName: 'YES Bank Limited',
  defaultValues: {
    purpose: 'Housing Loan / Commercial / Project Loan',
  },
};

export interface YesBankProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function YesBank({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: YesBankProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  const navSections: NavItem[] = [
    { id: 'yes-sec-header', title: 'Header & Branch Details' },
    { id: 'yes-sec-basic', title: 'Basic Details' },
    { id: 'yes-sec-locality', title: 'Locality & Surroundings' },
    { id: 'yes-sec-property', title: 'Property Details' },
    { id: 'yes-sec-sanction', title: 'Sanction Plan Details' },
    { id: 'yes-sec-valuation', title: 'Valuation & Rates' },
    { id: 'yes-sec-market', title: 'Market Comparison & Remarks' },
    { id: 'yes-sec-declaration', title: 'Declaration & Sign-off' },
    { id: 'yes-sec-docs', title: 'Documents' },
    { id: 'yes-sec-maps', title: 'Maps' },
    { id: 'yes-sec-photos', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initialize fields
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}), refNo: rawInitialFields?.refNo || projectCode || '' };
    const p = (prefill || {}) as any;

    // Meta Header
    if (!d.branchName) d.branchName = p.branch || p.bankBranch || '';
    if (!d.typeOfCase) d.typeOfCase = 'NA';
    if (!d.valuerName) d.valuerName = 'M/s. S Mohanty Associates';
    if (!d.visitingEnggName) d.visitingEnggName = earliestVisit?.engineerName || p.firstFieldAgentName || p.fieldEmployees?.[0]?.name || 'M/s. S Mohanty Associates';
    if (!d.timeOfVisit) d.timeOfVisit = '';
    if (!d.dateOfVisit) d.dateOfVisit = earliestVisit ? formatReportDate(earliestVisit.date) : '';
    if (!d.reportDate) d.reportDate = formatReportDate(new Date().toISOString());
    if (!d.contactPerson) {
      d.contactPerson = p.applicantName || p.contactName
        ? `${p.applicantName || p.contactName}${p.contactPhone ? ', Mob-' + p.contactPhone : ''}`
        : '';
    }

    // 1. Basic Details
    if (!d.applicantName) d.applicantName = p.applicantName || p.contactName || '';
    if (!d.ownerName) d.ownerName = p.contactName || '';
    if (!d.propertyTypeDesc) d.propertyTypeDesc = p.propertyType || '';
    if (!d.currentUsage) d.currentUsage = '';
    if (!d.addressAtSite) d.addressAtSite = p.propertyAddress || '';
    if (!d.addressAsPerDoc) d.addressAsPerDoc = p.propertyAddress || '';
    if (!d.priorValuation) d.priorValuation = 'No';

    // 2. Surroundings & Locality Details
    if (!d.zoningMasterPlan) d.zoningMasterPlan = '';
    if (!d.proximityAmenities) d.proximityAmenities = '';
    if (!d.localityClass) d.localityClass = '';
    if (!d.railwayStation) d.railwayStation = '';
    if (!d.siteStatus) d.siteStatus = '';
    if (!d.busStop) d.busStop = '';
    if (!d.landmark) d.landmark = p.nearestLandmark || '';
    if (!d.distanceCityCenter) d.distanceCityCenter = '';
    if (!d.approachRoad) d.approachRoad = '';

    // 3. Property Details
    if (!d.briefDescription) d.briefDescription = '';
    if (!d.internalVisitDone) d.internalVisitDone = 'NA';
    if (!d.occupantStatus) d.occupantStatus = '';
    if (!d.occupantName) d.occupantName = '';
    if (!d.occupantRelation) d.occupantRelation = 'Self';

    if (!d.propertyDemarcated) d.propertyDemarcated = '';
    if (!d.propertyIdentifiedThrough) d.propertyIdentifiedThrough = '';
    if (!d.structureType) d.structureType = '';
    if (!d.landPlotAreaDesc) d.landPlotAreaDesc = '';
    if (!d.noOfBlocks) d.noOfBlocks = 'NA';
    if (!d.noOfFloors) d.noOfFloors = '';
    if (!d.noOfUnitsPerFloor) d.noOfUnitsPerFloor = 'NA';
    if (!d.noOfLifts) d.noOfLifts = 'NA';
    if (!d.amenitiesDesc) d.amenitiesDesc = '';

    if (!d.unitFloorNo) d.unitFloorNo = 'NA';
    if (!d.unitRooms) d.unitRooms = '';
    if (!d.remarksView) d.remarksView = 'No';

    if (!d.qualityExteriors) d.qualityExteriors = '';
    if (!d.qualityInteriors) d.qualityInteriors = '';
    if (!d.ageOfProperty) d.ageOfProperty = '';
    if (!d.residualLife) d.residualLife = '';

    // Boundaries
    if (!d.boundaryNorthSite) d.boundaryNorthSite = '';
    if (!d.boundarySouthSite) d.boundarySouthSite = '';
    if (!d.boundaryEastSite) d.boundaryEastSite = '';
    if (!d.boundaryWestSite) d.boundaryWestSite = '';

    if (!d.boundaryNorthDoc) d.boundaryNorthDoc = '';
    if (!d.boundarySouthDoc) d.boundarySouthDoc = '';
    if (!d.boundaryEastDoc) d.boundaryEastDoc = '';
    if (!d.boundaryWestDoc) d.boundaryWestDoc = '';

    if (!d.boundariesMatching) d.boundariesMatching = 'Yes';

    // 4. Sanctions & Documents
    if (!d.sanctionApprovalNo) d.sanctionApprovalNo = '';
    if (!d.commencementCert) d.commencementCert = 'NA';
    if (!d.ownershipType) d.ownershipType = '';
    if (!d.documentsVerified) d.documentsVerified = '';
    if (!d.municipalLimits) d.municipalLimits = '';
    if (!d.permissibleUsageMasterPlan) d.permissibleUsageMasterPlan = 'NA';

    // Setbacks
    if (!d.setbackFrontPlan) d.setbackFrontPlan = 'NA';
    if (!d.setbackFrontBye) d.setbackFrontBye = 'NA';
    if (!d.setbackFrontSite) d.setbackFrontSite = 'NA';
    if (!d.setbackFrontDev) d.setbackFrontDev = 'NA';

    if (!d.setbackSide1Plan) d.setbackSide1Plan = 'NA';
    if (!d.setbackSide1Bye) d.setbackSide1Bye = 'NA';
    if (!d.setbackSide1Site) d.setbackSide1Site = 'NA';
    if (!d.setbackSide1Dev) d.setbackSide1Dev = 'NA';

    if (!d.setbackSide2Plan) d.setbackSide2Plan = 'NA';
    if (!d.setbackSide2Bye) d.setbackSide2Bye = 'NA';
    if (!d.setbackSide2Site) d.setbackSide2Site = 'NA';
    if (!d.setbackSide2Dev) d.setbackSide2Dev = 'NA';

    if (!d.setbackRearPlan) d.setbackRearPlan = 'NA';
    if (!d.setbackRearBye) d.setbackRearBye = 'NA';
    if (!d.setbackRearSite) d.setbackRearSite = 'NA';
    if (!d.setbackRearDev) d.setbackRearDev = 'NA';

    if (!d.deviations) d.deviations = 'NA';
    if (!d.demolitionRisk) d.demolitionRisk = 'Low';

    // 5. Valuation (Area & Rates)
    if (!d.areaDeedCarpet) d.areaDeedCarpet = 'NA';
    if (!d.areaDeedSft) d.areaDeedSft = 'Sft';
    if (!d.areaPlanCarpet) d.areaPlanCarpet = 'NA';
    if (!d.areaPlanSft) d.areaPlanSft = 'NA';
    if (!d.areaMeasureCarpet) d.areaMeasureCarpet = '';
    if (!d.areaMeasureSft) d.areaMeasureSft = 'NA';

    if (!d.landAreaSqft) d.landAreaSqft = '';
    if (!d.landRateSqft) d.landRateSqft = '';
    if (!d.landValuationVal) d.landValuationVal = '';

    if (!d.constructionAreaSqft) d.constructionAreaSqft = '';
    if (!d.constructionRateSqft) d.constructionRateSqft = '';
    if (!d.constructionValuationVal) d.constructionValuationVal = '';

    if (!d.comparisonCarpetArea) d.comparisonCarpetArea = 'NA';
    if (!d.comparisonLoading) d.comparisonLoading = 'NA';
    if (!d.comparisonSaleableArea) d.comparisonSaleableArea = 'NA';
    if (!d.comparisonRateSft) d.comparisonRateSft = 'NA';
    if (!d.realizableComparison) d.realizableComparison = 'NA';

    if (!d.noOfCarParks) d.noOfCarParks = 'NA';
    if (!d.rateCarParking) d.rateCarParking = 'NA';
    if (!d.valCarPark) d.valCarPark = 'NA';
    if (!d.totalAmenitiesB) d.totalAmenitiesB = 'NA';

    if (!d.totalRealizableValue) d.totalRealizableValue = '';
    if (!d.forcedSaleValue) d.forcedSaleValue = '';
    if (!d.readyReckonerRate) d.readyReckonerRate = '';
    if (!d.readyReckonerTotal) d.readyReckonerTotal = '';
    if (!d.insuranceValue) d.insuranceValue = 'NA';
    if (!d.approxRentals) d.approxRentals = 'NA';
    if (!d.fmvReckonerDiffExplanation) d.fmvReckonerDiffExplanation = '';

    // 6-8. Market Comparison, Stage & Remarks
    if (!d.comp1Prop) d.comp1Prop = '';
    if (!d.comp1Val) d.comp1Val = '';
    if (!d.comp1Date) d.comp1Date = '';

    if (!d.comp2Prop) d.comp2Prop = '';
    if (!d.comp2Val) d.comp2Val = '';
    if (!d.comp2Date) d.comp2Date = '';

    if (!d.stageProgress) d.stageProgress = '100%';
    if (!d.stageReco) d.stageReco = '100%';

    if (!d.negativeRemarks) d.negativeRemarks = '';
    if (!d.positiveRemarks) d.positiveRemarks = '';
    if (!d.latitude) d.latitude = p.latitude || '';
    if (!d.longitude) d.longitude = p.longitude || '';
    if (!d.tentativeCompletion) d.tentativeCompletion = 'NA';
    if (!d.place) d.place = 'Bhubaneswar';

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
        next.totalRealizableValue = tot;
        next.forcedSaleValue = Math.round(tot * 0.75);
      }

      if (['constructionAreaSqft', 'constructionRateSqft'].includes(field)) {
        const area = Number(field === 'constructionAreaSqft' ? val : next.constructionAreaSqft) || 0;
        const rate = Number(field === 'constructionRateSqft' ? val : next.constructionRateSqft) || 0;
        const cVal = Math.round(area * rate);
        next.constructionValuationVal = cVal;
        const lVal = Number(next.landValuationVal) || 0;
        const tot = lVal + cVal;
        next.totalRealizableValue = tot;
        next.forcedSaleValue = Math.round(tot * 0.75);
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
        valuation_amount: fields.totalRealizableValue || 0,
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
    if (!confirm('Are you sure you want to submit this YES Bank report?')) return;
    try {
      setSubmitting(true);
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: fields.totalRealizableValue || 0,
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
      const renderer = new PDFYesBankRenderer({
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
      const renderer = new PDFYesBankRenderer({
        ...fields,
        projectCode,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFilenameCode(`YES_Bank_Valuation_${(fields.refNo || projectCode || 'Report')}.pdf`)}.pdf`;
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
      {/* ── Bank Report Header ── */}
      <BankReportHeader
        bankName="YES Bank"
        subTemplate={fields.organisationSubTemplate || 'Standard Format'}
        description="Technical Valuation Report with Schedule Approvals, Property Details & Floor Rates."
        projectCode={fields.refNo || projectCode}
        earliestVisit={earliestVisit}
        onResetWizard={onResetWizard}
        onSyncInspectionDate={
          earliestVisit
            ? () => {
                const dt = formatReportDate(earliestVisit.date);
                handleFieldChange('dateOfVisit', dt);
              }
            : undefined
        }
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">

        {/* 1. Header & Branch */}
        <div id="yes-sec-header">
          <Section title="Header & Branch Details" number={1}>
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
              <Field label="Valuer's Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valuerName || ''}
                  onChange={e => handleFieldChange('valuerName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Visiting Engg Name">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.visitingEnggName || ''}
                  onChange={e => handleFieldChange('visitingEnggName', e.target.value)}
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
              <Field label="Time of Visit">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.timeOfVisit || ''}
                  onChange={e => handleFieldChange('timeOfVisit', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Case Ref. No">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.refNo || projectCode || ''} disabled={true} readOnly={true} placeholder="SMA-YYYY/MM-NNNN"
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
              <Field label="Person contacted for property inspection with contact details">
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

        {/* 2. Basic Details */}
        <div id="yes-sec-basic">
          <Section title="Basic Details" number={2}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Applicants Name">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.applicantName || ''}
                    onChange={e => handleFieldChange('applicantName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Name of Owners">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerName || ''}
                    onChange={e => handleFieldChange('ownerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Type of property">
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
              <Field label="Property / Site Address">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.addressAtSite || ''}
                  onChange={e => handleFieldChange('addressAtSite', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Address as per Docs">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.addressAsPerDoc || ''}
                  onChange={e => handleFieldChange('addressAsPerDoc', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Has the valuer done valuation of this property before? If yes, for whom & when: -">
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

        {/* 3. Locality & Surroundings */}
        <div id="yes-sec-locality">
          <Section title="Locality & Surroundings" number={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Zoning as per Master Plan / Development plan">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.zoningMasterPlan || ''}
                  onChange={e => handleFieldChange('zoningMasterPlan', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Proximity from civic amenities / public transport">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.proximityAmenities || ''}
                  onChange={e => handleFieldChange('proximityAmenities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Class of locality (High / Middle Class / Lower / Negative)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.localityClass || ''}
                  onChange={e => handleFieldChange('localityClass', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Nearest Railway Station">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.railwayStation || ''}
                  onChange={e => handleFieldChange('railwayStation', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Site (Developed / under-developed)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.siteStatus || ''}
                  onChange={e => handleFieldChange('siteStatus', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Nearest Bus Stop">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.busStop || ''}
                  onChange={e => handleFieldChange('busStop', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Nearest Landmark">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.landmark || ''}
                  onChange={e => handleFieldChange('landmark', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Distance from City Centre">
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
              <Field label="Condition and width of approach road: -">
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

        {/* 4. Property Details */}
        <div id="yes-sec-property">
          <Section title="Property Details" number={4}>
            <Field label="Brief description of the property">
              <textarea
                rows={4}
                className={inputCls}
                value={fields.briefDescription || ''}
                onChange={e => handleFieldChange('briefDescription', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Occupant */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg my-4 space-y-4">
              <h4 className="font-semibold text-slate-800 text-sm">Occupant Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Vacant/Occupied">
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

            {/* Building details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg mb-4 space-y-4">
              <h4 className="font-semibold text-slate-800 text-sm">Building & Unit Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Property Demarcated (Yes/ No)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.propertyDemarcated || ''}
                    onChange={e => handleFieldChange('propertyDemarcated', e.target.value)}
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
                <Field label="Land/Plot Area (SFT)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landPlotAreaDesc || ''}
                    onChange={e => handleFieldChange('landPlotAreaDesc', e.target.value)}
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
                <Field label="Amenities">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenitiesDesc || ''}
                    onChange={e => handleFieldChange('amenitiesDesc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Located on Floor No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unitFloorNo || ''}
                    onChange={e => handleFieldChange('unitFloorNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No. of rooms / Unit configuration">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unitRooms || ''}
                    onChange={e => handleFieldChange('unitRooms', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Condition & Age */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="Exterior Condition">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.qualityExteriors || ''}
                  onChange={e => handleFieldChange('qualityExteriors', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Interior Condition">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.qualityInteriors || ''}
                  onChange={e => handleFieldChange('qualityInteriors', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Property Age (Yrs)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ageOfProperty || ''}
                  onChange={e => handleFieldChange('ageOfProperty', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Residual life (Yrs)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.residualLife || ''}
                  onChange={e => handleFieldChange('residualLife', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Boundaries Table */}
            <div className="mt-6">
              <h4 className="font-semibold text-slate-800 text-sm mb-3">Boundaries Schedule</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-2 border-r">Boundaries</th>
                      <th className="p-2 border-r">North</th>
                      <th className="p-2 border-r">South</th>
                      <th className="p-2 border-r">East</th>
                      <th className="p-2">West</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 font-medium bg-slate-50 border-r">Actual on site</td>
                      {['North', 'South', 'East', 'West'].map(dir => (
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
                      <td className="p-2 font-medium bg-slate-50 border-r">As per Title document Sale deed</td>
                      {['North', 'South', 'East', 'West'].map(dir => (
                        <td key={dir} className="p-2 border-r last:border-r-0">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[`boundary${dir}Doc`] || ''}
                            onChange={e => handleFieldChange(`boundary${dir}Doc`, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-3">
              <Field label="Boundaries matching with Sale Certificate(Yes / No)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.boundariesMatching || ''}
                  onChange={e => handleFieldChange('boundariesMatching', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 5. Sanction Plan Approval & Setbacks */}
        <div id="yes-sec-sanction">
          <Section title="Sanction Plan Details" number={5}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Sanctioned plans details">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sanctionApprovalNo || ''}
                  onChange={e => handleFieldChange('sanctionApprovalNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Ownership type">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ownershipType || ''}
                  onChange={e => handleFieldChange('ownershipType', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Property documents verified (Any others)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.documentsVerified || ''}
                  onChange={e => handleFieldChange('documentsVerified', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Is the property within Municipal Limits">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.municipalLimits || ''}
                  onChange={e => handleFieldChange('municipalLimits', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Setbacks */}
            <div className="mt-6">
              <h4 className="font-semibold text-slate-800 text-sm mb-3">Setbacks Table</h4>
              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b">
                    <tr>
                      <th className="p-2 border-r">Side</th>
                      <th className="p-2 border-r">As per plan</th>
                      <th className="p-2 border-r">As per Bye-Laws</th>
                      <th className="p-2 border-r">Actual at site</th>
                      <th className="p-2">Extra Coverage deviation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { side: 'Front', key: 'Front' },
                      { side: 'Side 1 (Right)', key: 'Side1' },
                      { side: 'Side 2 (Left)', key: 'Side2' },
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
                            value={fields[`setback${row.key}Bye`] || ''}
                            onChange={e => handleFieldChange(`setback${row.key}Bye`, e.target.value)}
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
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[`setback${row.key}Dev`] || ''}
                            onChange={e => handleFieldChange(`setback${row.key}Dev`, e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Deviations if any">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.deviations || ''}
                  onChange={e => handleFieldChange('deviations', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Demolition Risk">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.demolitionRisk || ''}
                  onChange={e => handleFieldChange('demolitionRisk', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 6. Valuation & Rates */}
        <div id="yes-sec-valuation">
          <Section title="Valuation & Rates" number={6}>
            <div className="space-y-6">
              {/* Land + Construction Method */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
                <h4 className="font-semibold text-slate-800 text-sm">
                  A1 : Land + Construction Method (Applicable for Villa / Bunglow / Row House / Industrial)
                </h4>
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
                  <Field label="Realizable Land Value (Rs.)">
                    <input
                      type="text"
                      className={`${inputCls} font-bold text-emerald-700 bg-slate-100`}
                      value={`Rs. ${formatIndianCurrency(Number(fields.landValuationVal) || 0)}/-`}
                      readOnly
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
                  <Field label="Construction Area (RCC G+2) (Sq.ft)">
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
                  <Field label="Realizable Construction Value (Rs.)">
                    <input
                      type="text"
                      className={`${inputCls} font-bold text-emerald-700 bg-slate-100`}
                      value={`Rs. ${formatIndianCurrency(Number(fields.constructionValuationVal) || 0)}/-`}
                      readOnly
                    />
                  </Field>
                </div>
              </div>

              {/* Ready Reckoner & Grand Summary */}
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Total Realizable Value (A1 or A2+B)">
                    <div className="text-xl font-bold text-emerald-800">
                      Rs. {formatIndianCurrency(Number(fields.totalRealizableValue) || 0)}/-
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {rupeesInWords(Number(fields.totalRealizableValue) || 0)}
                    </p>
                  </Field>
                  <Field label="Forced Sale / Distress Value (75%)">
                    <div className="text-lg font-bold text-slate-800">
                      Rs. {formatIndianCurrency(Number(fields.forcedSaleValue) || 0)}/-
                    </div>
                  </Field>
                  <Field label="Property Value as per Ready Reckoner">
                    <div className="text-lg font-semibold text-slate-700">
                      Rs. {formatIndianCurrency(Number(fields.readyReckonerTotal) || 0)}/-
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{fields.readyReckonerRate || 'Rs. 362/sqft'}</p>
                  </Field>
                </div>
                <Field label="Supporting explanation in case difference between FMV and Reckoner Rate is >20%">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.fmvReckonerDiffExplanation || ''}
                    onChange={e => handleFieldChange('fmvReckonerDiffExplanation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* 7. Market Comparison, Stage & Remarks */}
        <div id="yes-sec-market">
          <Section title="Market Comparison & Remarks" number={7}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Stage Progress (%)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.stageProgress || ''}
                  onChange={e => handleFieldChange('stageProgress', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Recommendation (%)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.stageReco || ''}
                  onChange={e => handleFieldChange('stageReco', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Negative Remarks">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.negativeRemarks || ''}
                  onChange={e => handleFieldChange('negativeRemarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Positive Remarks">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.positiveRemarks || ''}
                  onChange={e => handleFieldChange('positiveRemarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Latitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.latitude || ''}
                  onChange={e => handleFieldChange('latitude', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.longitude || ''}
                  onChange={e => handleFieldChange('longitude', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 8. Declaration & Sign Off */}
        <div id="yes-sec-declaration">
          <Section title="Declaration & Sign-off" number={8}>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs text-slate-700 leading-relaxed text-justify">
              <p><strong>1.</strong> Our representative physically inspected the property.</p>
              <p><strong>2.</strong> We have no direct/indirect interest in the property valued.</p>
              <p><strong>3.</strong> Report is prepared based on the information furnished to us or documents submitted or shown to us by the client.</p>
              <p><strong>4.</strong> The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties.</p>
              <p><strong>5.</strong> The client is free to obtain other independent opinions on the same.</p>
              <p><strong>6.</strong> This report does not certify of confirm any ownership or title of the property that has been valued.</p>
              <p><strong>7.</strong> The services provided by YES Bank to the Client will be limited to their use.</p>
              <p><strong>8.</strong> The Report will reflect matters, as they currently exist.</p>
              <p><strong>9.</strong> Changes in socio-economic, economic policy and political conditions could result in a substantially different situation.</p>
              <p><strong>10.</strong> We do not possess legal expertise and hence recommend you to take opinion of legal expert.</p>
              <p><strong>11.</strong> In the preparation of the Report, we have relied on information provided to us by the client, affiliates and publicly available sources.</p>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Sign & Stamp Authority">
                <input
                  type="text"
                  className={inputCls}
                  value="For : M/s. S Mohanty Associates"
                  disabled
                />
              </Field>
              <Field label="Place">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.place || 'Bhubaneswar'}
                  onChange={e => handleFieldChange('place', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </div>

        {/* 9. Attachments: Maps, Documents, Photographs */}
        <div id="yes-sec-attachments" className="space-y-6">
          <BaseDocumentsSection
            title="Documents"
            sectionId="yes-sec-docs"
            sectionNumber={9}
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
            title="Maps"
            sectionId="yes-sec-maps"
            sectionNumber={10}
            locationMapImages={fields.locationMapImages || []}
            mouzaMapImages={fields.mouzaMapImages || []}
            sketchMapImages={fields.sketchMapImages || []}
            cadastralMapImages={fields.cadastralMapImages || []}
            bdaMapImages={fields.bdaMapImages || []}
            latitude={fields.latitude}
            longitude={fields.longitude}
            fields={fields}
            hasExternalCoordinatesField={true}
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
            title="Photographs"
            sectionId="yes-sec-photos"
            sectionNumber={11}
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
