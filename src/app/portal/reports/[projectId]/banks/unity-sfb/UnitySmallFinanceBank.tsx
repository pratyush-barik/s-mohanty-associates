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
import { PDFUnitySFBRenderer } from '@/lib/banks/pdf-unity-sfb-renderer';

export const UNITY_SFB_CONFIG: BankConfig = {
  bankId: 'UNITY SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Unity Small Finance Bank',
  defaultValues: {
    purpose: 'Housing Loan / Business Finance / LAP',
  },
};

export interface UnitySFBProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function UnitySmallFinanceBank({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: UnitySFBProps) {
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
    { id: 'unity-sec-header', title: 'Header & Branch' },
    { id: 'unity-sec-basic', title: 'Basic Details' },
    { id: 'unity-sec-locality', title: 'Locality & Surrounding' },
    { id: 'unity-sec-property', title: 'Property & Building' },
    { id: 'unity-sec-sanction', title: 'Sanction & Setbacks' },
    { id: 'unity-sec-valuation', title: 'Valuation & Rates' },
    { id: 'unity-sec-boundaries', title: 'Four Boundaries' },
    { id: 'unity-sec-remarks', title: 'Remarks & Declaration' },
    { id: 'unity-sec-docs', title: 'Documents' },
    { id: 'unity-sec-maps', title: 'Maps' },
    { id: 'unity-sec-photos', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initialize fields
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // Header & Meta Table
    if (!d.branchName) d.branchName = p.branch || '';
    if (!d.typeOfCase) d.typeOfCase = 'LAP';
    if (!d.valuerName) d.valuerName = 'Er. Satyajit Mohanty';
    if (!d.dateOfVisit) d.dateOfVisit = earliestVisit ? formatReportDate(earliestVisit.date) : '';
    if (!d.refNo) d.refNo = d.caseRefNo || projectCode || '';
    if (!d.caseRefNo) d.caseRefNo = d.refNo;
    if (!d.reportDate) d.reportDate = formatReportDate(new Date().toISOString());
    const cPhone = p.contactPhone || '';
    const cName = p.contactName || '';
    if (!d.contactPerson) d.contactPerson = cName ? (cPhone ? `${cName}, Mob:- ${cPhone}` : cName) : '';

    // 1-4. Basic Details
    if (!d.applicantName) d.applicantName = p.applicantName || '';
    if (!d.propertyTypeDesc) d.propertyTypeDesc = p.propertyType || '';
    if (!d.currentUsage) d.currentUsage = 'Residential';
    const defaultAddress = p.propertyAddress || '';
    if (!d.addressAtSite) d.addressAtSite = defaultAddress;
    if (!d.addressAsPerDoc) d.addressAsPerDoc = defaultAddress;
    if (!d.priorValuation) d.priorValuation = 'No';

    // 5-8. Locality & Surrounding
    if (!d.localityType) d.localityType = 'Residential';
    if (!d.localityClass) d.localityClass = 'Middle Class';
    if (!d.siteStatus) d.siteStatus = 'Developed';
    if (!d.proximityAmenities) d.proximityAmenities = '';
    if (!d.railwayStation) d.railwayStation = '';
    if (!d.busStop) d.busStop = '';
    if (!d.landmark) d.landmark = '';
    if (!d.distanceCityCenter) d.distanceCityCenter = '';
    if (!d.approachRoad) d.approachRoad = '';

    // 9-13. Property & Building
    if (!d.occupancyStatus) d.occupancyStatus = 'Occupied';
    if (!d.occupantName) d.occupantName = '';
    if (!d.occupantRelation) d.occupantRelation = '';
    if (!d.propertyDemarcation) d.propertyDemarcation = 'Yes';
    if (!d.propertyIdentifiedThrough) d.propertyIdentifiedThrough = 'Documents & Site Inspection';
    if (!d.structureType) d.structureType = 'RCC';
    if (!d.landPlotArea) d.landPlotArea = '';
    if (!d.noOfBlocks) d.noOfBlocks = 'NA';
    if (!d.noOfUnits) d.noOfUnits = 'NA';
    if (!d.noOfFloors) d.noOfFloors = '';
    if (!d.noOfLifts) d.noOfLifts = 'NA';

    if (!d.unitFloorNo) d.unitFloorNo = 'NA';
    if (!d.noOfRooms) d.noOfRooms = 'NA';
    if (!d.measuredBUA) d.measuredBUA = '';
    if (!d.carpetArea) d.carpetArea = '';
    if (!d.viewRemarks) d.viewRemarks = 'NA';

    if (!d.qualityExteriors) d.qualityExteriors = 'Good';
    if (!d.qualityInteriors) d.qualityInteriors = 'Good';
    if (!d.ageOfProperty) d.ageOfProperty = '';
    if (!d.residualLife) d.residualLife = '';

    // 14-20. Sanction & Setbacks
    if (!d.sanctionPlanVerified) d.sanctionPlanVerified = '';
    if (!d.ownershipType) d.ownershipType = 'Freehold';
    if (!d.documentsVerified) d.documentsVerified = '';
    if (!d.withinMunicipalLimits) d.withinMunicipalLimits = '';
    if (!d.permissibleUsageMasterPlan) d.permissibleUsageMasterPlan = '';

    if (!d.sbPlanFront) d.sbPlanFront = 'NA';
    if (!d.sbSiteFront) d.sbSiteFront = 'NA';
    if (!d.sbDevFront) d.sbDevFront = 'NA';
    if (!d.sbRemarks) d.sbRemarks = '';

    if (!d.sbPlanLeft) d.sbPlanLeft = 'NA';
    if (!d.sbSiteLeft) d.sbSiteLeft = 'NA';
    if (!d.sbPlanRight) d.sbPlanRight = 'NA';
    if (!d.sbSiteRight) d.sbSiteRight = 'NA';
    if (!d.sbPlanRear) d.sbPlanRear = 'NA';
    if (!d.sbSiteRear) d.sbSiteRear = 'NA';

    if (!d.floorPermBasement) d.floorPermBasement = 'NA';
    if (!d.floorPermStilt) d.floorPermStilt = '';
    if (!d.floorPermGF) d.floorPermGF = 'NA';
    if (!d.floorPermFF) d.floorPermFF = 'NA';
    if (!d.floorPermSF) d.floorPermSF = 'NA';
    if (!d.floorPermTF) d.floorPermTF = 'NA';

    if (!d.floorConstBasement) d.floorConstBasement = 'NA';
    if (!d.floorConstStilt) d.floorConstStilt = 'NA';
    if (!d.floorConstGF) d.floorConstGF = '';
    if (!d.floorConstFF) d.floorConstFF = '';
    if (!d.floorConstSF) d.floorConstSF = 'NA';
    if (!d.floorConstTF) d.floorConstTF = 'NA';

    // 21. Valuation & Rates (Live calculations)
    if (!d.valLandAreaNum) d.valLandAreaNum = 0;
    if (!d.valLandRateNum) d.valLandRateNum = 0;
    if (!d.valLandAmountNum) d.valLandAmountNum = 0;

    if (!d.valConstAreaNum) d.valConstAreaNum = 0;
    if (!d.valConstRateNum) d.valConstRateNum = 0;
    if (!d.valConstAmountNum) d.valConstAmountNum = 0;

    if (!d.valLandArea) d.valLandArea = '';
    if (!d.valLandRate) d.valLandRate = '';
    if (!d.valLandAmount) d.valLandAmount = '';

    if (!d.valConstArea) d.valConstArea = '';
    if (!d.valConstRate) d.valConstRate = '';
    if (!d.valConstAmount) d.valConstAmount = '';

    if (!d.stageOfConstruction) d.stageOfConstruction = '100%';
    if (!d.recConstValue) d.recConstValue = '100%';

    if (!d.amenityCarParking) d.amenityCarParking = 'NA';
    if (!d.amenityPlc) d.amenityPlc = 'NA';
    if (!d.amenityIdc) d.amenityIdc = 'NA';
    if (!d.amenityEdc) d.amenityEdc = 'NA';
    if (!d.amenityPowerBackup) d.amenityPowerBackup = 'NA';
    if (!d.amenityOther) d.amenityOther = 'NA';
    if (!d.totalAmenitiesCharges) d.totalAmenitiesCharges = 'NA';

    if (!d.totalMarketValueNum) d.totalMarketValueNum = 0;
    if (!d.totalMarketValue) d.totalMarketValue = '';
    if (!d.forcedSaleValueNum) d.forcedSaleValueNum = 0;
    if (!d.forcedSaleValue) d.forcedSaleValue = '';
    if (!d.approxRentals) d.approxRentals = 'NA';

    // 22. Boundaries
    if (!d.bndEastDeed) d.bndEastDeed = '';
    if (!d.bndWestDeed) d.bndWestDeed = '';
    if (!d.bndNorthDeed) d.bndNorthDeed = '';
    if (!d.bndSouthDeed) d.bndSouthDeed = '';

    if (!d.bndEastSketch) d.bndEastSketch = '';
    if (!d.bndWestSketch) d.bndWestSketch = '';
    if (!d.bndNorthSketch) d.bndNorthSketch = '';
    if (!d.bndSouthSketch) d.bndSouthSketch = '';

    if (!d.bndEastSite) d.bndEastSite = '';
    if (!d.bndWestSite) d.bndWestSite = '';
    if (!d.bndNorthSite) d.bndNorthSite = '';
    if (!d.bndSouthSite) d.bndSouthSite = '';

    if (!d.boundariesMatching) d.boundariesMatching = 'Yes';

    // Remarks & Declaration
    if (!d.remarks) {
      d.remarks =
        'Remarks:- Subject property visited and inspected. Property boundaries are demarcated. Valuation done based on prevailing local market rates.';
    }
    if (!d.visitingEngineer) d.visitingEngineer = 'Er. Satyajit Mohanty';

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

      // Live calculation
      const landA = parseFloat(String(next.valLandAreaNum ?? 0)) || 0;
      const landR = parseFloat(String(next.valLandRateNum ?? 0)) || 0;
      const constA = parseFloat(String(next.valConstAreaNum ?? 0)) || 0;
      const constR = parseFloat(String(next.valConstRateNum ?? 0)) || 0;

      const calcLandTotal = Math.round(landA * landR);
      const calcConstTotal = Math.round(constA * constR);
      const calcTotalMV = calcLandTotal + calcConstTotal;
      const calcForced = Math.round(calcTotalMV * 0.8);

      if (['valLandAreaNum', 'valLandRateNum', 'valConstAreaNum', 'valConstRateNum'].includes(key)) {
        next.valLandAmountNum = calcLandTotal;
        next.valLandAmount = `Rs.${calcLandTotal.toLocaleString('en-IN')}/-`;
        next.valLandArea = `${landA}Sqft`;
        next.valLandRate = `Rs.${landR}/-`;

        next.valConstAmountNum = calcConstTotal;
        next.valConstAmount = `Rs.${calcConstTotal.toLocaleString('en-IN')}/-`;
        next.valConstArea = `${constA}sqft`;
        next.valConstRate = `Rs.${constR}/-`;

        next.totalMarketValueNum = calcTotalMV;
        next.totalMarketValue = `Rs.${calcTotalMV.toLocaleString('en-IN')}/-`;
        next.forcedSaleValueNum = calcForced;
        next.forcedSaleValue = `Rs.${calcForced.toLocaleString('en-IN')}/-`;
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
        valuation_amount: fields.totalMarketValueNum || 0,
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
    if (!confirm('Are you sure you want to submit this Unity Small Finance Bank report?')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: fields.totalMarketValueNum || 0,
        updated_at: new Date().toISOString(),
      });
      await supabaseBrowser.from('projects').update({
        status: 'COMPLETED',
        valuation_amount: fields.totalMarketValueNum || 0,
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
    const renderer = new PDFUnitySFBRenderer({
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
      a.download = `Unity_SFB_Valuation_${(fields.refNo || fields.caseRefNo || projectCode || 'Report').replace(/[/\\]/g, '_')}.pdf`;
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
        bankName="Unity Small Finance Bank"
        subTemplate="Standard Format"
        description="Comprehensive Housing Loan, Business Finance & LAP Valuation Report."
        projectCode={projectCode}
        earliestVisit={earliestVisit}
        onResetWizard={onResetWizard}
        onSyncInspectionDate={
          earliestVisit
            ? () => {
                const dt = formatReportDate(earliestVisit.date);
                updateField('dateOfVisit', dt);
              }
            : undefined
        }
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">

        {/* 1. Header & Branch */}
        <div id="unity-sec-header">
          <Section title="Header & Branch Meta Details" number={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Branch Name">
                <input type="text" className={inputCls} value={fields.branchName || ''} onChange={(e) => updateField('branchName', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Type of Case">
                <input type="text" className={inputCls} value={fields.typeOfCase || ''} onChange={(e) => updateField('typeOfCase', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Valuer's Name">
                <input type="text" className={inputCls} value={fields.valuerName || ''} onChange={(e) => updateField('valuerName', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Date of Visit">
                <input type="text" className={inputCls} value={fields.dateOfVisit || ''} onChange={(e) => updateField('dateOfVisit', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Case Ref. No">
                <input type="text" className={inputCls} value={fields.refNo || fields.caseRefNo || projectCode || ''} disabled={true} readOnly={true} />
              </Field>
              <Field label="Date of Report">
                <input type="text" className={inputCls} value={fields.reportDate || ''} onChange={(e) => updateField('reportDate', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="Contacted Person for Property Inspection (Name / Mobile)">
                <input type="text" className={inputCls} value={fields.contactPerson || ''} onChange={(e) => updateField('contactPerson', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 2. Basic Details */}
        <div id="unity-sec-basic">
          <Section title="Basic Details (Points 1 - 4)" number={2}>
            <div className="space-y-4">
              <Field label="1. Applicant/s Name/s">
                <input type="text" className={inputCls} value={fields.applicantName || ''} onChange={(e) => updateField('applicantName', e.target.value)} disabled={isReadOnly} />
              </Field>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="2. Type of Property">
                  <input type="text" className={inputCls} value={fields.propertyTypeDesc || ''} onChange={(e) => updateField('propertyTypeDesc', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Current Usage">
                  <input type="text" className={inputCls} value={fields.currentUsage || ''} onChange={(e) => updateField('currentUsage', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
              <Field label="3. Address at Site">
                <input type="text" className={inputCls} value={fields.addressAtSite || ''} onChange={(e) => updateField('addressAtSite', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Address as per Document">
                <input type="text" className={inputCls} value={fields.addressAsPerDoc || ''} onChange={(e) => updateField('addressAsPerDoc', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="4. Has valuator done valuation of this property before this? If yes, when, for whom?">
                <input type="text" className={inputCls} value={fields.priorValuation || ''} onChange={(e) => updateField('priorValuation', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 3. Locality & Surrounding */}
        <div id="unity-sec-locality">
          <Section title="Locality & Surrounding Details (Points 5 - 8)" number={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Field label="5. Locality Type">
                <input type="text" className={inputCls} value={fields.localityType || ''} onChange={(e) => updateField('localityType', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Class of Locality">
                <input type="text" className={inputCls} value={fields.localityClass || ''} onChange={(e) => updateField('localityClass', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Site Status">
                <input type="text" className={inputCls} value={fields.siteStatus || ''} onChange={(e) => updateField('siteStatus', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Proximity to Civic Amenities">
                <input type="text" className={inputCls} value={fields.proximityAmenities || ''} onChange={(e) => updateField('proximityAmenities', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Railway Station">
                <input type="text" className={inputCls} value={fields.railwayStation || ''} onChange={(e) => updateField('railwayStation', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Bus Stop">
                <input type="text" className={inputCls} value={fields.busStop || ''} onChange={(e) => updateField('busStop', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="6. Close Vicinity / Landmark">
                <input type="text" className={inputCls} value={fields.landmark || ''} onChange={(e) => updateField('landmark', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="7. Distance from City Center">
                <input type="text" className={inputCls} value={fields.distanceCityCenter || ''} onChange={(e) => updateField('distanceCityCenter', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="8. Condition and Width of Approach Road">
                <input type="text" className={inputCls} value={fields.approachRoad || ''} onChange={(e) => updateField('approachRoad', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 4. Property & Building Details */}
        <div id="unity-sec-property">
          <Section title="Property & Building Details (Points 9 - 13)" number={4}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Field label="9. Vacant / Occupied">
                <input type="text" className={inputCls} value={fields.occupancyStatus || ''} onChange={(e) => updateField('occupancyStatus', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Name of Occupant">
                <input type="text" className={inputCls} value={fields.occupantName || ''} onChange={(e) => updateField('occupantName', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Relation with Applicant">
                <input type="text" className={inputCls} value={fields.occupantRelation || ''} onChange={(e) => updateField('occupantRelation', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Property Demarcation">
                <select className={selectCls} value={fields.propertyDemarcation || 'Yes'} onChange={(e) => updateField('propertyDemarcation', e.target.value)} disabled={isReadOnly}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <Field label="10. Property Identified Through">
                <input type="text" className={inputCls} value={fields.propertyIdentifiedThrough || ''} onChange={(e) => updateField('propertyIdentifiedThrough', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Type of Structure">
                <input type="text" className={inputCls} value={fields.structureType || ''} onChange={(e) => updateField('structureType', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Land / Plot Area">
                <input type="text" className={inputCls} value={fields.landPlotArea || ''} onChange={(e) => updateField('landPlotArea', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="No. of Floors">
                <input type="text" className={inputCls} value={fields.noOfFloors || ''} onChange={(e) => updateField('noOfFloors', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="No. of Lifts">
                <input type="text" className={inputCls} value={fields.noOfLifts || ''} onChange={(e) => updateField('noOfLifts', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="11. Carpet Area">
                <input type="text" className={inputCls} value={fields.carpetArea || ''} onChange={(e) => updateField('carpetArea', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <div className="mb-4">
              <Field label="Measured Built-up Area">
                <textarea rows={2} className={inputCls} value={fields.measuredBUA || ''} onChange={(e) => updateField('measuredBUA', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="12. Quality (Exteriors)">
                <input type="text" className={inputCls} value={fields.qualityExteriors || ''} onChange={(e) => updateField('qualityExteriors', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Quality (Interiors)">
                <input type="text" className={inputCls} value={fields.qualityInteriors || ''} onChange={(e) => updateField('qualityInteriors', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="13. Age of the Property">
                <input type="text" className={inputCls} value={fields.ageOfProperty || ''} onChange={(e) => updateField('ageOfProperty', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Residual Life">
                <input type="text" className={inputCls} value={fields.residualLife || ''} onChange={(e) => updateField('residualLife', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 5. Sanction & Setbacks */}
        <div id="unity-sec-sanction">
          <Section title="Sanction Plan Approval & Setbacks (Points 14 - 20)" number={5}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <Field label="14. Sanctioned Plans Verified">
                <input type="text" className={inputCls} value={fields.sanctionPlanVerified || ''} onChange={(e) => updateField('sanctionPlanVerified', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="15. Ownership Type">
                <input type="text" className={inputCls} value={fields.ownershipType || ''} onChange={(e) => updateField('ownershipType', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="16. Property Documents Verified">
                <input type="text" className={inputCls} value={fields.documentsVerified || ''} onChange={(e) => updateField('documentsVerified', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="17. Within Municipal Limits">
                <input type="text" className={inputCls} value={fields.withinMunicipalLimits || ''} onChange={(e) => updateField('withinMunicipalLimits', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">19. Setbacks Details</h4>
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg mb-4">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <thead className="bg-slate-100 dark:bg-slate-800 font-medium">
                  <tr>
                    <th className="px-3 py-2 text-left">Side</th>
                    <th className="px-3 py-2 text-left">As per Plan / Bye laws</th>
                    <th className="px-3 py-2 text-left">Actual at Site</th>
                    <th className="px-3 py-2 text-left">Deviation</th>
                    <th className="px-3 py-2 text-left">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">Front</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbPlanFront || 'NA'} onChange={(e) => updateField('sbPlanFront', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbSiteFront || 'NA'} onChange={(e) => updateField('sbSiteFront', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbDevFront || 'NA'} onChange={(e) => updateField('sbDevFront', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbRemarks || ''} onChange={(e) => updateField('sbRemarks', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">Side 1 (Left)</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbPlanLeft || 'NA'} onChange={(e) => updateField('sbPlanLeft', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbSiteLeft || 'NA'} onChange={(e) => updateField('sbSiteLeft', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5">NA</td>
                    <td className="px-2 py-1.5">-</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">Side 2 (Right)</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbPlanRight || 'NA'} onChange={(e) => updateField('sbPlanRight', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbSiteRight || 'NA'} onChange={(e) => updateField('sbSiteRight', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5">NA</td>
                    <td className="px-2 py-1.5">-</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">Rear</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbPlanRear || 'NA'} onChange={(e) => updateField('sbPlanRear', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.sbSiteRear || 'NA'} onChange={(e) => updateField('sbSiteRear', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5">NA</td>
                    <td className="px-2 py-1.5">-</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">20. Floor Wise Constructed Area</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Ground Floor Constructed">
                <input type="text" className={inputCls} value={fields.floorConstGF || ''} onChange={(e) => updateField('floorConstGF', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="First Floor Constructed">
                <input type="text" className={inputCls} value={fields.floorConstFF || ''} onChange={(e) => updateField('floorConstFF', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Second Floor Constructed">
                <input type="text" className={inputCls} value={fields.floorConstSF || ''} onChange={(e) => updateField('floorConstSF', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Basement / Stilt">
                <input type="text" className={inputCls} value={fields.floorConstBasement || ''} onChange={(e) => updateField('floorConstBasement', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 6. Valuation & Rates */}
        <div id="unity-sec-valuation">
          <Section title="Valuation & Rates (Point 21)" number={6}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="Land Area (Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.valLandAreaNum ?? ''}
                  onChange={(e) => updateField('valLandAreaNum', parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Land Rate (Rs per Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.valLandRateNum ?? ''}
                  onChange={(e) => updateField('valLandRateNum', parseFloat(e.target.value) || 0)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Total Land Amount (Rs)">
                <div className="p-2.5 rounded-lg bg-slate-100 font-bold text-slate-900 border border-slate-200">
                  {formatIndianCurrency(fields.valLandAmountNum)}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <Field label="Construction Area (Sqft)">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.valConstAreaNum ?? ''}
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
              <Field label="Total Construction Amount (Rs)">
                <div className="p-2.5 rounded-lg bg-slate-100 font-bold text-slate-900 border border-slate-200">
                  {formatIndianCurrency(fields.valConstAmountNum)}
                </div>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl mb-6">
              <div>
                <span className="text-xs uppercase font-semibold text-emerald-700 tracking-wider">TOTAL MARKET VALUE (100%)</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {formatIndianCurrency(fields.totalMarketValueNum)}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {rupeesInWords(fields.totalMarketValueNum || 0)}
                </div>
              </div>
              <div>
                <span className="text-xs uppercase font-semibold text-blue-700 tracking-wider">FORCED SALE VALUE (80%)</span>
                <div className="text-2xl font-black text-blue-900 mt-1">
                  {fields.forcedSaleValue}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  80% of Fair Market Value
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Stage of Construction (%)">
                <input type="text" className={inputCls} value={fields.stageOfConstruction || '100%'} onChange={(e) => updateField('stageOfConstruction', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Approx. Rentals in case of 100% complete">
                <input type="text" className={inputCls} value={fields.approxRentals || 'NA'} onChange={(e) => updateField('approxRentals', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
        </div>

        {/* 7. Four Boundaries */}
        <div id="unity-sec-boundaries">
          <Section title="Four Boundaries Matrix (Point 22)" number={7}>
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
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Sale Deed</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndEastDeed || ''} onChange={(e) => updateField('bndEastDeed', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndWestDeed || ''} onChange={(e) => updateField('bndWestDeed', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndNorthDeed || ''} onChange={(e) => updateField('bndNorthDeed', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSouthDeed || ''} onChange={(e) => updateField('bndSouthDeed', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">As per Sketch Map</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndEastSketch || ''} onChange={(e) => updateField('bndEastSketch', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndWestSketch || ''} onChange={(e) => updateField('bndWestSketch', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndNorthSketch || ''} onChange={(e) => updateField('bndNorthSketch', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSouthSketch || ''} onChange={(e) => updateField('bndSouthSketch', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-medium bg-slate-50 dark:bg-slate-800/40">At Site</td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndEastSite || ''} onChange={(e) => updateField('bndEastSite', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndWestSite || ''} onChange={(e) => updateField('bndWestSite', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndNorthSite || ''} onChange={(e) => updateField('bndNorthSite', e.target.value)} disabled={isReadOnly} /></td>
                    <td className="px-2 py-1.5"><input type="text" className={inputCls} value={fields.bndSouthSite || ''} onChange={(e) => updateField('bndSouthSite', e.target.value)} disabled={isReadOnly} /></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Field label="Boundaries Matching?">
              <input type="text" className={inputCls} value={fields.boundariesMatching || ''} onChange={(e) => updateField('boundariesMatching', e.target.value)} disabled={isReadOnly} />
            </Field>
          </Section>
        </div>

        {/* 8. Remarks & Declaration */}
        <div id="unity-sec-remarks">
          <Section title="Remarks & Sign-off" number={8}>
            <div className="space-y-4">
              <Field label="Remarks & Observations">
                <textarea rows={6} className={inputCls} value={fields.remarks || ''} onChange={(e) => updateField('remarks', e.target.value)} disabled={isReadOnly} />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                <Field label="Name of Engineer who visited property">
                  <input type="text" className={inputCls} value={fields.visitingEngineer || ''} onChange={(e) => updateField('visitingEngineer', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Report Date">
                  <input type="text" className={inputCls} value={fields.reportDate || ''} onChange={(e) => updateField('reportDate', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </Section>
        </div>

        {/* 9. Attachments: Documents, Maps & Photographs */}
        <div id="unity-sec-attachments" className="space-y-6">
          <BaseDocumentsSection
            title="Documents"
            sectionNumber={9}
            sectionId="unity-sec-docs"
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
            sectionNumber={10}
            sectionId="unity-sec-maps"
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
            sectionNumber={11}
            sectionId="unity-sec-photos"
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
