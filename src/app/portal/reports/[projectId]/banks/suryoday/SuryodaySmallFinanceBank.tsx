'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building,
  MapPin,
  FileText,
  DollarSign,
  Camera,
  Layers,
  ShieldCheck,
  Plus,
  Trash2,
} from 'lucide-react';

import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  getEarliestFieldVisit,
  BankReportHeader,
  FloatingNavigator,
  ReportActionBar,
  Field,
  Section,
  inputCls,
  selectCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  BasePhotoBucketModal,
  formatReportDate,
} from '../BaseBankReportComponents';

import {
  sanitizePositiveFloat,
  sanitizePositiveInt,
  sanitizePercentage,
  parseSafeFloat,
  multiplyExactDecimals,
  sumDecimals,
  calculatePercentageValue,
} from '@/lib/bank-input-constraints';

import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFSuryodayRenderer } from '@/lib/banks/pdf-suryoday-renderer';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';

export const SURYODAY_CONFIG: BankConfig = {
  bankId: 'SURYODAY SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Suryoday Small Finance Bank Limited',
  defaultValues: {
    purpose: 'Affordable Housing / MSME Finance',
  },
};

export interface SuryodaySmallFinanceBankProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

interface BuildingRow {
  id: string;
  floor: string;
  area: string;
  rate: string;
  stage: string;
}

interface ScheduleRow {
  activity: string;
  proposed: string;
  completed: string;
  progress: string;
  recommend: string;
}

const DEFAULT_SCHEDULE_ROWS: ScheduleRow[] = [
  { activity: 'Plinth', proposed: '20', completed: 'Completed', progress: '20', recommend: '20' },
  { activity: 'RCC', proposed: '40', completed: 'Completed', progress: '40', recommend: '40' },
  { activity: 'B/W', proposed: '10', completed: 'Completed', progress: '10', recommend: '10' },
  { activity: 'Plaster Internal', proposed: '5', completed: 'Completed', progress: '5', recommend: '5' },
  { activity: 'Plaster External', proposed: '5', completed: 'Completed', progress: '5', recommend: '5' },
  { activity: 'Flooring', proposed: '5', completed: 'Completed', progress: '5', recommend: '5' },
  { activity: 'Electrification', proposed: '5', completed: 'Completed', progress: '5', recommend: '5' },
  { activity: 'Plumbing', proposed: '5', completed: 'Completed', progress: '5', recommend: '5' },
  { activity: 'Woodwork', proposed: '3', completed: 'Completed', progress: '3', recommend: '3' },
  { activity: 'Painting Internal', proposed: '1', completed: 'Completed', progress: '1', recommend: '1' },
  { activity: 'Painting External', proposed: '1', completed: 'Completed', progress: '1', recommend: '1' },
];

export default function SuryodaySmallFinanceBank({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: SuryodaySmallFinanceBankProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || userRole === 'viewer' || status === 'completed';

  const [form, setForm] = useState<any>(() => {
    const f = rawInitialFields || {};
    const p = (prefill || {}) as any;
    return {
      applicationNo: f.applicationNo || projectCode || '',
      dateOfInspection: f.dateOfInspection || p.fieldVisitDate || formatReportDate(new Date()),
      dateOfReport: f.dateOfReport || formatReportDate(new Date()),

      // Section A: General details
      customerName: f.customerName || (p.contactName ? `${p.contactName}${p.contactPhone ? `, Mob- ${p.contactPhone}` : ''}` : ''),
      currentOwner: f.currentOwner || p.applicantName || p.ownerName || '',
      proposedOwner: f.proposedOwner || p.applicantName || p.ownerName || '',
      propertyAddressDocs: f.propertyAddressDocs || p.propertyAddress || '',
      propertyAddressInspection: f.propertyAddressInspection || p.propertyAddress || '',
      landmark: f.landmark || p.nearestLandmark || '',
      latLong: f.latLong || (p.latitude && p.longitude ? `LAT:-${p.latitude}, LONG- ${p.longitude}` : ''),
      propertyIdentifiedThrough: f.propertyIdentifiedThrough || (p.contactName ? `Mr. ${p.contactName}${p.contactPhone ? `, Mob- ${p.contactPhone}` : ''}` : ''),
      occupiedBy: f.occupiedBy || '',
      occupiedSince: f.occupiedSince || '',

      // Section B: Surrounding locality details
      withinLimitationOf: f.withinLimitationOf || '',
      habitationVicinity: f.habitationVicinity || 'Residential',
      classificationLocality: f.classificationLocality || 'Middle class',
      approachRoadCondition: f.approachRoadCondition || '',
      amenitiesAvailability: f.amenitiesAvailability || '',

      // Section C: Property details
      propertyDescription: f.propertyDescription || '',
      propertyType: f.propertyType || prefill?.propertyType || 'Residential',
      propertyUsage: f.propertyUsage || 'Residential',

      // Boundaries
      boundaryEastSite: f.boundaryEastSite || p.boundaryEast || '',
      boundaryEastDeed: f.boundaryEastDeed || p.boundaryEast || '',
      boundaryWestSite: f.boundaryWestSite || p.boundaryWest || '',
      boundaryWestDeed: f.boundaryWestDeed || p.boundaryWest || '',
      boundaryNorthSite: f.boundaryNorthSite || p.boundaryNorth || '',
      boundaryNorthDeed: f.boundaryNorthDeed || p.boundaryNorth || '',
      boundarySouthSite: f.boundarySouthSite || p.boundarySouth || '',
      boundarySouthDeed: f.boundarySouthDeed || p.boundarySouth || '',
      boundaryRemark: f.boundaryRemark || 'Boundary matches as per sale deed',
      plotDemarcated: f.plotDemarcated || 'No',

      // Section D: Structural details
      typeOfStructure: f.typeOfStructure || 'RCC framed structure',
      noOfFloorsSiteAndPlan: f.noOfFloorsSiteAndPlan || '',
      noOfWings: f.noOfWings || 'NA',
      noOfFlatsPerFloor: f.noOfFlatsPerFloor || 'NA',
      noOfLifts: f.noOfLifts || 'NA',
      constructionProgress: f.constructionProgress || '100%',
      constructionRecommend: f.constructionRecommend || '100%',
      ageOfProperty: f.ageOfProperty || '',
      residualAge: f.residualAge || '',

      // Section E: Document details
      documentsProduced: f.documentsProduced || 'Sale deed, Mutation, Electricity Bill, Legal Opinion',
      ownershipType: f.ownershipType || 'Free hold',
      approvedPlanStatus: f.approvedPlanStatus || 'No',

      // Section F: Valuation & Market Rates
      marketRateLand: f.marketRateLand || '',
      guidelineRateLand: f.guidelineRateLand || '',
      natureOfLand: f.natureOfLand || 'Homestead',

      // Section G: Area Details (Land & Building)
      deedArea: f.deedArea || p.plotArea || '',
      actualArea: f.actualArea || p.plotArea || '',
      consideredArea: f.consideredArea || p.plotArea || '',
      landMeasurementRemark: f.landMeasurementRemark || 'As per deed, converted into sqft',

      carpetAreaPlan: f.carpetAreaPlan || 'NA',
      carpetAreaSite: f.carpetAreaSite || '',
      builtUpAreaPlan: f.builtUpAreaPlan || 'NA',
      builtUpAreaSite: f.builtUpAreaSite || '',
      superBuiltUpAreaPlan: f.superBuiltUpAreaPlan || 'NA',
      superBuiltUpAreaSite: f.superBuiltUpAreaSite || 'NA',
      areaDeviation: f.areaDeviation || 'NA',

      // Section H: Valuation Details (Land & Building Method)
      landArea: f.landArea !== undefined ? String(f.landArea) : (p.plotArea || ''),
      landRate: f.landRate !== undefined ? String(f.landRate) : '',
      landRemark: f.landRemark || 'Adopted market rate',

      buildingRows: f.buildingRows || [
        { id: '1', floor: 'GF', area: '', rate: '', stage: '100' },
      ],

      constructionEstimateCustomer: f.constructionEstimateCustomer || 'NA',

      // Section I: Flat / Shop Area Details
      flatAreaApprovedPlan: f.flatAreaApprovedPlan || '',
      flatAreaSiteMeasurement: f.flatAreaSiteMeasurement || 'NA',
      flatAreaDocument: f.flatAreaDocument || 'NA',
      flatSuperBuiltUpArea: f.flatSuperBuiltUpArea || 'NA',
      flatDeviation: f.flatDeviation || 'NA',
      flatRiskDemolition: f.flatRiskDemolition || 'No',

      // Section J: Valuation - By Sales Comparison Approach
      salesSbua: f.salesSbua || '0',
      salesRate: f.salesRate || '0',
      salesAmenities: f.salesAmenities || '0',
      salesFmvCompleted: f.salesFmvCompleted || '',
      salesStage: f.salesStage || '',
      salesFmvPresent: f.salesFmvPresent || '',
      salesDistressVal: f.salesDistressVal || '',
      salesInsuranceVal: f.salesInsuranceVal || '',

      // Section K & L: Observation & Remarks
      observations: f.observations || 'Subject property is well situated in a developed residential neighborhood with good connectivity.',
      remarks: f.remarks || '',

      // Section M: Marketability
      marketabilityForSale: f.marketabilityForSale || 'Average marketability with selling period in range of 1 to 6 months',
      marketabilityForLease: f.marketabilityForLease || 'NA-',

      // Section N: Declaration
      inspectingEngineer: f.inspectingEngineer || p.firstFieldAgentName || '',
      inspectionDate: f.inspectionDate || f.dateOfInspection || formatReportDate(new Date()),
      reportDate: f.reportDate || f.dateOfReport || formatReportDate(new Date()),
      reportPlace: f.reportPlace || 'Bhubaneswar',

      // Schedule I
      scheduleIRows: f.scheduleIRows || DEFAULT_SCHEDULE_ROWS,
      scheduleWorkDescription: f.scheduleWorkDescription || '100% completed.',

      // Media Annexures
      photoListNames: f.photoListNames || 'Approch road, Selfie of Engineer, Building, Name Board, Hall, Kitchen, Line Plan as per site.',
      propertyImages: f.propertyImages || [],
      propertyImageNames: f.propertyImageNames || [],
      documentImages: f.documentImages || [],
      documentImageNames: f.documentImageNames || [],
      locationMapImages: f.locationMapImages || [],
      mouzaMapImages: f.mouzaMapImages || [],
      sketchMapImages: f.sketchMapImages || [],
      cadastralMapImages: f.cadastralMapImages || [],
      bdaMapImages: f.bdaMapImages || [],
    };
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<string | false>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);

  const updateField = useCallback((key: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  }, []);

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(form.propertyImages, prefill);
  }, [form.propertyImages, prefill]);

  // ═══════════════════════════════════════════════
  // LIVE VALUATION MATHEMATICS (Section H)
  // ═══════════════════════════════════════════════
  const landAreaNum = parseSafeFloat(form.landArea);
  const landRateNum = parseSafeFloat(form.landRate);
  const landValue = useMemo(() => multiplyExactDecimals(landAreaNum, landRateNum), [landAreaNum, landRateNum]);

  const { totalBuildingValue, totalCompletedBuildingValue } = useMemo(() => {
    let currSum = 0;
    let fullSum = 0;
    (form.buildingRows || []).forEach((row: BuildingRow) => {
      const a = parseSafeFloat(row.area);
      const r = parseSafeFloat(row.rate);
      const s = parseSafeFloat(row.stage || 100);
      const full = multiplyExactDecimals(a, r);
      const curr = calculatePercentageValue(full, s);
      currSum = sumDecimals([currSum, curr]);
      fullSum = sumDecimals([fullSum, full]);
    });
    return { totalBuildingValue: currSum, totalCompletedBuildingValue: fullSum };
  }, [form.buildingRows]);

  const presentFMV = useMemo(() => sumDecimals([landValue, totalBuildingValue]), [landValue, totalBuildingValue]);
  const completedFMV = useMemo(() => sumDecimals([landValue, totalCompletedBuildingValue]), [landValue, totalCompletedBuildingValue]);
  const distressValue = useMemo(() => calculatePercentageValue(presentFMV, 80), [presentFMV]); // 80%
  const replacementInsuranceValue = totalCompletedBuildingValue;

  // ═══════════════════════════════════════════════
  // SCHEDULE I PROGRESS SYNCHRONIZATION
  // ═══════════════════════════════════════════════
  const totalScheduleProgress = useMemo(() => {
    let sum = 0;
    (form.scheduleIRows || []).forEach((r: ScheduleRow) => {
      sum = sumDecimals([sum, parseSafeFloat(r.progress)]);
    });
    return sum;
  }, [form.scheduleIRows]);

  const totalScheduleRecommend = useMemo(() => {
    let sum = 0;
    (form.scheduleIRows || []).forEach((r: ScheduleRow) => {
      sum = sumDecimals([sum, parseSafeFloat(r.recommend)]);
    });
    return sum;
  }, [form.scheduleIRows]);

  const handleUpdateScheduleRow = (index: number, key: keyof ScheduleRow, val: string) => {
    setForm((prev: any) => {
      const nextRows = [...prev.scheduleIRows];
      const sanitized = key === 'progress' || key === 'recommend' || key === 'proposed'
        ? sanitizePercentage(val)
        : val;
      nextRows[index] = { ...nextRows[index], [key]: sanitized };
      return { ...prev, scheduleIRows: nextRows };
    });
  };

  const handleBuildingRowChange = (index: number, field: keyof BuildingRow, val: string) => {
    setForm((prev: any) => {
      const nextRows = [...prev.buildingRows];
      const sanitized = field === 'area' || field === 'rate'
        ? sanitizePositiveFloat(val)
        : field === 'stage'
        ? sanitizePercentage(val)
        : val;
      nextRows[index] = { ...nextRows[index], [field]: sanitized };
      return { ...prev, buildingRows: nextRows };
    });
  };

  const handleAddBuildingRow = () => {
    setForm((prev: any) => ({
      ...prev,
      buildingRows: [
        ...prev.buildingRows,
        { id: String(Date.now()), floor: 'New Floor', area: '0', rate: '0', stage: '100' },
      ],
    }));
  };

  const handleRemoveBuildingRow = (index: number) => {
    setForm((prev: any) => ({
      ...prev,
      buildingRows: prev.buildingRows.filter((_: any, i: number) => i !== index),
    }));
  };

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
      setForm((prev: any) => ({
        ...prev,
        documentImages: [...(prev.documentImages || []), ...newUrls],
        documentImageNames: [...(prev.documentImageNames || []), ...newNames],
      }));
      setMessage({ text: 'Documents uploaded successfully', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
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
      setForm((prev: any) => ({
        ...prev,
        [mapKey]: [...(prev[mapKey] || []), ...newUrls],
      }));
      setMessage({ text: 'Map uploaded successfully', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
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
        newNames.push(`Photograph ${(form.propertyImages?.length || 0) + i + 1}`);
      }
      setForm((prev: any) => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...newUrls],
        propertyImageNames: [...(prev.propertyImageNames || []), ...newNames],
      }));
      setMessage({ text: 'Photos uploaded successfully', type: 'success' });
    } catch (err: any) {
      setMessage({ text: 'Upload failed: ' + err.message, type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // ═══════════════════════════════════════════════
  // AUTO-SAVE DRAFT ACTION
  // ═══════════════════════════════════════════════
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, form);
      setAutoSaveStatus('saved');
      setMessage({ text: 'Report draft saved successfully', type: 'success' });
    } catch (err: any) {
      setAutoSaveStatus('error');
      setMessage({ text: 'Failed to save draft: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPDF = async () => {
    setPreviewing(true);
    try {
      const renderer = new PDFSuryodayRenderer({ ...form, projectCode });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      setMessage({ text: 'Failed to generate PDF preview: ' + err.message, type: 'error' });
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const renderer = new PDFSuryodayRenderer({ ...form, projectCode });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Suryoday_Valuation_${form.applicationNo || projectCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMessage({ text: 'Failed to download PDF: ' + err.message, type: 'error' });
    }
  };

  // 16 Floating Navigator Sections (0 numeric prefixes)
  const navSections = useMemo(
    () => [
      { id: 'sec-general', title: 'General Details' },
      { id: 'sec-surrounding', title: 'Surrounding Locality' },
      { id: 'sec-property', title: 'Property Details & Boundaries' },
      { id: 'sec-structural', title: 'Structural Details' },
      { id: 'sec-documents', title: 'Document Details' },
      { id: 'sec-valuation-market', title: 'Valuation & Market Rates' },
      { id: 'sec-area-details', title: 'Area Details (Land & Building)' },
      { id: 'sec-land-building-val', title: 'Land & Building Valuation' },
      { id: 'sec-flat-area-details', title: 'Flat / Shop Area Details' },
      { id: 'sec-sales-comparison', title: 'Sales Comparison Valuation' },
      { id: 'sec-observations', title: 'Observations & Remarks' },
      { id: 'sec-marketability', title: 'Marketability & Declaration' },
      { id: 'sec-schedule-i', title: 'Schedule I - Stage of Construction' },
      { id: 'sec-documents-annexure', title: 'Documents' },
      { id: 'sec-maps-annexure', title: 'Maps' },
      { id: 'sec-photos-annexure', title: 'Photographs' },
    ],
    []
  );

  return (
    <div className="space-y-6 pb-28 w-full">
      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full px-4 sm:px-6 lg:px-8">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Universal Bank Report Header */}
          <BankReportHeader
            bankName="Suryoday Small Finance Bank Limited"
            subclass="Standard Format"
            formatName="Affordable Housing / MSME Finance Valuation Format"
            clientType="organisation"
            category="Affordable Housing & MSME"
            serviceType="Valuation Report Builder"
            subjectType="Affordable Housing / MSME Finance"
            onResetWizard={onResetWizard}
            earliestVisit={earliestVisit}
            projectCode={projectCode}
            message={message}
          />

          {/* 1. General Details */}
          <div id="sec-general">
            <Section title="General Details" number={1} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Application No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.applicationNo}
                    onChange={e => updateField('applicationNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Date of Inspection">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.dateOfInspection}
                    onChange={e => updateField('dateOfInspection', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Date of Report">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.dateOfReport}
                    onChange={e => updateField('dateOfReport', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Name of Customer">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.customerName}
                    onChange={e => updateField('customerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Current Owner">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.currentOwner}
                    onChange={e => updateField('currentOwner', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Proposed Owner">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.proposedOwner}
                    onChange={e => updateField('proposedOwner', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Property Address (as per docs)">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={form.propertyAddressDocs}
                    onChange={e => updateField('propertyAddressDocs', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property Address (on inspection) with Pin code">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={form.propertyAddressInspection}
                    onChange={e => updateField('propertyAddressInspection', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Landmark">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.landmark}
                    onChange={e => updateField('landmark', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Latitude & Longitude">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.latLong}
                    onChange={e => updateField('latLong', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Occupied By">
                  <select
                    className={selectCls}
                    value={form.occupiedBy}
                    onChange={e => updateField('occupiedBy', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Tenants">Tenants</option>
                    <option value="Owner">Owner</option>
                    <option value="Self">Self</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                </Field>
                <Field label="If occupied, since when">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.occupiedSince}
                    onChange={e => updateField('occupiedSince', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="Property identified through along with contact no & relationship">
                <input
                  type="text"
                  className={inputCls}
                  value={form.propertyIdentifiedThrough}
                  onChange={e => updateField('propertyIdentifiedThrough', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 2. Surrounding Locality */}
          <div id="sec-surrounding">
            <Section title="Surrounding Locality" number={2} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Within the Limitation of">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.withinLimitationOf}
                    onChange={e => updateField('withinLimitationOf', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Habitation in vicinity">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.habitationVicinity}
                    onChange={e => updateField('habitationVicinity', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Classification of locality">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.classificationLocality}
                    onChange={e => updateField('classificationLocality', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Approach Road condition">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.approachRoadCondition}
                    onChange={e => updateField('approachRoadCondition', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Availability of civic amenities">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.amenitiesAvailability}
                    onChange={e => updateField('amenitiesAvailability', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 3. Property Details & Boundaries */}
          <div id="sec-property">
            <Section title="Property Details & Boundaries" number={3} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Brief Description of Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.propertyDescription}
                    onChange={e => updateField('propertyDescription', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.propertyType}
                    onChange={e => updateField('propertyType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Usage of Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.propertyUsage}
                    onChange={e => updateField('propertyUsage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Boundaries Matrix Table */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Boundaries Matrix (As per Site vs Deed)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 w-32">Direction</th>
                        <th className="px-4 py-2.5">As per Actual Site</th>
                        <th className="px-4 py-2.5">As per Deed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">East</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundaryEastSite}
                            onChange={e => updateField('boundaryEastSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundaryEastDeed}
                            onChange={e => updateField('boundaryEastDeed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">West</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundaryWestSite}
                            onChange={e => updateField('boundaryWestSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundaryWestDeed}
                            onChange={e => updateField('boundaryWestDeed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">North</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundaryNorthSite}
                            onChange={e => updateField('boundaryNorthSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundaryNorthDeed}
                            onChange={e => updateField('boundaryNorthDeed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">South</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundarySouthSite}
                            onChange={e => updateField('boundarySouthSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundarySouthDeed}
                            onChange={e => updateField('boundarySouthDeed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Field label="Remark on Boundary Matching">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.boundaryRemark}
                    onChange={e => updateField('boundaryRemark', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Whether plot is demarcated at site">
                  <select
                    className={selectCls}
                    value={form.plotDemarcated}
                    onChange={e => updateField('plotDemarcated', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>
              </div>
            </Section>
          </div>

          {/* 4. Structural Details */}
          <div id="sec-structural">
            <Section title="Structural Details" number={4} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Type of Structure">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.typeOfStructure}
                    onChange={e => updateField('typeOfStructure', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No. of Floors (Site & Plan)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.noOfFloorsSiteAndPlan}
                    onChange={e => updateField('noOfFloorsSiteAndPlan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No. of Wings">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.noOfWings}
                    onChange={e => updateField('noOfWings', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="No. of Flats per Floor">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.noOfFlatsPerFloor}
                    onChange={e => updateField('noOfFlatsPerFloor', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No. of Lifts">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.noOfLifts}
                    onChange={e => updateField('noOfLifts', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Age of Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.ageOfProperty}
                    onChange={e => updateField('ageOfProperty', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Construction Progress (%)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.constructionProgress}
                    onChange={e => updateField('constructionProgress', sanitizePercentage(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Recommended Stage (%)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.constructionRecommend}
                    onChange={e => updateField('constructionRecommend', sanitizePercentage(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Residual Age (Years)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.residualAge}
                    onChange={e => updateField('residualAge', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 5. Document Details */}
          <div id="sec-documents">
            <Section title="Document Details" number={5} defaultOpen={true}>
              <Field label="Documents produced for perusal">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={form.documentsProduced}
                  onChange={e => updateField('documentsProduced', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Type of Ownership">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.ownershipType}
                    onChange={e => updateField('ownershipType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Approved Plan Availability Status">
                  <select
                    className={selectCls}
                    value={form.approvedPlanStatus}
                    onChange={e => updateField('approvedPlanStatus', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>
              </div>
            </Section>
          </div>

          {/* 6. Valuation & Market Rates */}
          <div id="sec-valuation-market">
            <Section title="Valuation & Market Rates" number={6} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Market Rate of Land (Rs/Sqft)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.marketRateLand}
                    onChange={e => updateField('marketRateLand', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Guideline Rate of Land (Rs/Sqft)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.guidelineRateLand}
                    onChange={e => updateField('guidelineRateLand', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nature of Land">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.natureOfLand}
                    onChange={e => updateField('natureOfLand', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 7. Area Details (Land & Building) */}
          <div id="sec-area-details">
            <Section title="Area Details (Land & Building)" number={7} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Land Area as per Deed (Sq. ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.deedArea}
                    onChange={e => updateField('deedArea', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Land Area as per Actual Site (Sq. ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.actualArea}
                    onChange={e => updateField('actualArea', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Land Area Considered for Valuation (Sq. ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.consideredArea}
                    onChange={e => updateField('consideredArea', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="Land Measurement Remark">
                <input
                  type="text"
                  className={inputCls}
                  value={form.landMeasurementRemark}
                  onChange={e => updateField('landMeasurementRemark', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              {/* Built-Up Area Matrix */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Building Area Details (Plan vs Site)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Area Type</th>
                        <th className="px-4 py-2.5">As per Plan (Sq. ft.)</th>
                        <th className="px-4 py-2.5">As per Site (Sq. ft.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">Carpet Area</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.carpetAreaPlan}
                            onChange={e => updateField('carpetAreaPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.carpetAreaSite}
                            onChange={e => updateField('carpetAreaSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">Built-Up Area</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.builtUpAreaPlan}
                            onChange={e => updateField('builtUpAreaPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.builtUpAreaSite}
                            onChange={e => updateField('builtUpAreaSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">Super Built-Up Area</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.superBuiltUpAreaPlan}
                            onChange={e => updateField('superBuiltUpAreaPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.superBuiltUpAreaSite}
                            onChange={e => updateField('superBuiltUpAreaSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <Field label="Deviation / Violations if any">
                <input
                  type="text"
                  className={inputCls}
                  value={form.areaDeviation}
                  onChange={e => updateField('areaDeviation', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 8. Land & Building Valuation */}
          <div id="sec-land-building-val">
            <Section title="Land & Building Valuation" number={8} defaultOpen={true}>
              {/* Land Valuation Section */}
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Land Valuation
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Considered Land Area (Sq. ft.)">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.landArea}
                      onChange={e => updateField('landArea', sanitizePositiveFloat(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Adopted Rate per Sq. ft. (Rs)">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.landRate}
                      onChange={e => updateField('landRate', sanitizePositiveFloat(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Computed Land Value (Rs)">
                    <input
                      type="text"
                      className={`${inputCls} bg-emerald-50/50 font-mono font-bold text-emerald-800`}
                      value={`Rs. ${formatIndianCurrency(landValue)}/-`}
                      readOnly
                    />
                  </Field>
                </div>
                <Field label="Remark for Adopted Land Rate">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.landRemark}
                    onChange={e => updateField('landRemark', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Building Floor Rows */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Building Valuation (Floor-wise)
                  </h3>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleAddBuildingRow}
                      className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-semibold hover:bg-indigo-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Floor
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5">Floor</th>
                        <th className="px-4 py-2.5">Area (Sq.ft)</th>
                        <th className="px-4 py-2.5">Rate (Rs/Sq.ft)</th>
                        <th className="px-4 py-2.5">Stage (%)</th>
                        <th className="px-4 py-2.5">Present Value (Rs)</th>
                        {!isReadOnly && <th className="px-4 py-2.5 w-12 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(form.buildingRows || []).map((row: BuildingRow, idx: number) => {
                        const rowArea = parseSafeFloat(row.area);
                        const rowRate = parseSafeFloat(row.rate);
                        const rowStage = parseSafeFloat(row.stage || 100);
                        const rowFull = multiplyExactDecimals(rowArea, rowRate);
                        const rowPresent = calculatePercentageValue(rowFull, rowStage);
                        return (
                          <tr key={row.id || idx}>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={row.floor}
                                onChange={e => handleBuildingRowChange(idx, 'floor', e.target.value)}
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={row.area}
                                onChange={e => handleBuildingRowChange(idx, 'area', e.target.value)}
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={row.rate}
                                onChange={e => handleBuildingRowChange(idx, 'rate', e.target.value)}
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="px-3 py-1.5">
                              <input
                                type="text"
                                className={inputCls}
                                value={row.stage}
                                onChange={e => handleBuildingRowChange(idx, 'stage', e.target.value)}
                                disabled={isReadOnly}
                              />
                            </td>
                            <td className="px-4 py-2 font-mono font-bold text-slate-800">
                              ₹ {formatIndianCurrency(rowPresent)}
                            </td>
                            {!isReadOnly && (
                              <td className="px-3 py-1.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBuildingRow(idx)}
                                  className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Delete Floor"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200">
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Present FMV</span>
                  <div className="text-xl font-bold text-blue-900 mt-1 font-mono">
                    ₹ {formatIndianCurrency(presentFMV)}
                  </div>
                  <span className="text-[11px] text-blue-600">Land + Current Stage Building</span>
                </div>

                <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
                  <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Completed FMV</span>
                  <div className="text-xl font-bold text-emerald-900 mt-1 font-mono">
                    ₹ {formatIndianCurrency(completedFMV)}
                  </div>
                  <span className="text-[11px] text-emerald-600">On 100% Completion</span>
                </div>

                <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200">
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Distress Value (80%)</span>
                  <div className="text-xl font-bold text-amber-900 mt-1 font-mono">
                    ₹ {formatIndianCurrency(distressValue)}
                  </div>
                  <span className="text-[11px] text-amber-600">80% of Present FMV</span>
                </div>

                <div className="p-4 bg-purple-50/50 rounded-xl border border-purple-200">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Insurance Value</span>
                  <div className="text-xl font-bold text-purple-900 mt-1 font-mono">
                    ₹ {formatIndianCurrency(replacementInsuranceValue)}
                  </div>
                  <span className="text-[11px] text-purple-600">Building 100% Cost</span>
                </div>
              </div>

              <div className="pt-2 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <strong>Present FMV in Words:</strong> {rupeesInWords(presentFMV)}
              </div>
            </Section>
          </div>

          {/* 9. Flat / Shop Area Details */}
          <div id="sec-flat-area-details">
            <Section title="Flat / Shop Area Details" number={9} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Approved Plan Area (Sq. ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatAreaApprovedPlan}
                    onChange={e => updateField('flatAreaApprovedPlan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Site Measurement Area (Sq. ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatAreaSiteMeasurement}
                    onChange={e => updateField('flatAreaSiteMeasurement', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Document Area (Sq. ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatAreaDocument}
                    onChange={e => updateField('flatAreaDocument', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Super Built-Up Area (Sq. ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatSuperBuiltUpArea}
                    onChange={e => updateField('flatSuperBuiltUpArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Deviation if any">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatDeviation}
                    onChange={e => updateField('flatDeviation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Risk of Demolition">
                  <select
                    className={selectCls}
                    value={form.flatRiskDemolition}
                    onChange={e => updateField('flatRiskDemolition', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </Field>
              </div>
            </Section>
          </div>

          {/* 10. Sales Comparison Valuation */}
          <div id="sec-sales-comparison">
            <Section title="Sales Comparison Valuation" number={10} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="SBUA Area (Sq. ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesSbua}
                    onChange={e => updateField('salesSbua', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Adopted Rate per Sq. ft. (Rs)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesRate}
                    onChange={e => updateField('salesRate', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Amenities / Parking Cost (Rs)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesAmenities}
                    onChange={e => updateField('salesAmenities', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="FMV on Completion (Rs)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesFmvCompleted}
                    onChange={e => updateField('salesFmvCompleted', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Stage of Construction (%)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesStage}
                    onChange={e => updateField('salesStage', sanitizePercentage(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Present FMV (Rs)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesFmvPresent}
                    onChange={e => updateField('salesFmvPresent', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Distress Value (Rs)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesDistressVal}
                    onChange={e => updateField('salesDistressVal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 11. Observations & Remarks */}
          <div id="sec-observations">
            <Section title="Observations & Remarks" number={11} defaultOpen={true}>
              <Field label="Specific Observations">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={form.observations}
                  onChange={e => updateField('observations', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Comprehensive Remarks & Valuer Opinion">
                <textarea
                  rows={6}
                  className={inputCls}
                  value={form.remarks}
                  onChange={e => updateField('remarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 12. Marketability & Declaration */}
          <div id="sec-marketability">
            <Section title="Marketability & Declaration" number={12} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Marketability for Sale">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.marketabilityForSale}
                    onChange={e => updateField('marketabilityForSale', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Marketability for Lease">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.marketabilityForLease}
                    onChange={e => updateField('marketabilityForLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <Field label="Inspecting Engineer">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.inspectingEngineer}
                    onChange={e => updateField('inspectingEngineer', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Date of Inspection">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.inspectionDate}
                    onChange={e => updateField('inspectionDate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Date of Report">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.reportDate}
                    onChange={e => updateField('reportDate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Report Place">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.reportPlace}
                    onChange={e => updateField('reportPlace', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 13. Schedule I - Stage of Construction */}
          <div id="sec-schedule-i">
            <Section title="Schedule I - Stage of Construction" number={13} defaultOpen={true}>
              <p className="text-xs text-slate-500 mb-3">
                Mandatory milestone progress schedule for Suryoday Small Finance Bank Limited.
              </p>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Activity</th>
                      <th className="px-4 py-2.5">Proposed (%)</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5">Progress (%)</th>
                      <th className="px-4 py-2.5">Recommended (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(form.scheduleIRows || []).map((row: ScheduleRow, idx: number) => (
                      <tr key={row.activity || idx}>
                        <td className="px-4 py-2 font-medium text-slate-800">{row.activity}</td>
                        <td className="px-3 py-1.5 w-28">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.proposed}
                            onChange={e => handleUpdateScheduleRow(idx, 'proposed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5 w-32">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.completed}
                            onChange={e => handleUpdateScheduleRow(idx, 'completed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5 w-28">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.progress}
                            onChange={e => handleUpdateScheduleRow(idx, 'progress', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5 w-28">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.recommend}
                            onChange={e => handleUpdateScheduleRow(idx, 'recommend', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 font-bold border-t border-slate-200 text-slate-900">
                    <tr>
                      <td className="px-4 py-2.5">Total Schedule</td>
                      <td className="px-4 py-2.5">100%</td>
                      <td className="px-4 py-2.5">—</td>
                      <td className="px-4 py-2.5">{totalScheduleProgress}%</td>
                      <td className="px-4 py-2.5">{totalScheduleRecommend}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <Field label="Schedule Work Description">
                <input
                  type="text"
                  className={inputCls}
                  value={form.scheduleWorkDescription}
                  onChange={e => updateField('scheduleWorkDescription', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 14. Documents */}
          <div id="sec-documents-annexure">
            <BaseDocumentsSection
              title="Documents"
              sectionId="sec-documents-annexure"
              sectionNumber={14}
              documentImages={form.documentImages || []}
              documentImageNames={form.documentImageNames || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              onUploadDocuments={handleDocUpload}
              onRemoveDocument={(idx: number) => {
                setForm((prev: any) => ({
                  ...prev,
                  documentImages: (prev.documentImages || []).filter((_: any, i: number) => i !== idx),
                  documentImageNames: (prev.documentImageNames || []).filter((_: any, i: number) => i !== idx),
                }));
              }}
              onDocumentNameChange={(idx: number, name: string) => {
                setForm((prev: any) => {
                  const arr = [...(prev.documentImageNames || [])];
                  while (arr.length <= idx) arr.push('');
                  arr[idx] = name;
                  return { ...prev, documentImageNames: arr };
                });
              }}
              onReorderDocuments={(newImgs: string[], newNames: string[]) => {
                setForm((prev: any) => ({
                  ...prev,
                  documentImages: newImgs,
                  documentImageNames: newNames,
                }));
              }}
            />
          </div>

          {/* 15. Maps */}
          <div id="sec-maps-annexure">
            <BaseMapsSection
              title="Maps"
              sectionId="sec-maps-annexure"
              sectionNumber={15}
              locationMapImages={form.locationMapImages || []}
              mouzaMapImages={form.mouzaMapImages || []}
              sketchMapImages={form.sketchMapImages || []}
              cadastralMapImages={form.cadastralMapImages || []}
              bdaMapImages={form.bdaMapImages || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              onLocationMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('locationMapImages', e)}
              onLocationMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, locationMapImages: (p.locationMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onMouzaMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('mouzaMapImages', e)}
              onMouzaMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, mouzaMapImages: (p.mouzaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onSketchMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('sketchMapImages', e)}
              onSketchMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, sketchMapImages: (p.sketchMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onCadastralMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('cadastralMapImages', e)}
              onCadastralMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, cadastralMapImages: (p.cadastralMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onBdaMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('bdaMapImages', e)}
              onBdaMapRemove={(idx?: number) => setForm((p: any) => ({ ...p, bdaMapImages: (p.bdaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onReorderLocationMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, locationMapImages: newImgs }))}
              onReorderMouzaMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, mouzaMapImages: newImgs }))}
              onReorderSketchMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, sketchMapImages: newImgs }))}
              onReorderCadastralMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, cadastralMapImages: newImgs }))}
              onReorderBdaMap={(newImgs: string[]) => setForm((p: any) => ({ ...p, bdaMapImages: newImgs }))}
            />
          </div>

          {/* 16. Photographs */}
          <div id="sec-photos-annexure">
            <BasePhotographsSection
              title="Photographs"
              sectionId="sec-photos-annexure"
              sectionNumber={16}
              propertyImages={form.propertyImages || []}
              propertyImageNames={form.propertyImageNames || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              bucketCount={bucketImages?.length || 0}
              onOpenBucketPicker={() => setShowBucketModal(true)}
              onUploadImages={handlePhotoUpload}
              onRemoveImage={(idx: number) => {
                setForm((prev: any) => ({
                  ...prev,
                  propertyImages: (prev.propertyImages || []).filter((_: any, i: number) => i !== idx),
                  propertyImageNames: (prev.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
                }));
              }}
              onImageNameChange={(idx: number, name: string) => {
                setForm((prev: any) => {
                  const arr = [...(prev.propertyImageNames || [])];
                  while (arr.length <= idx) arr.push('');
                  arr[idx] = name;
                  return { ...prev, propertyImageNames: arr };
                });
              }}
              onReorderImages={(newImgs: string[], newNames: string[]) => {
                setForm((prev: any) => ({
                  ...prev,
                  propertyImages: newImgs,
                  propertyImageNames: newNames,
                }));
              }}
            />
          </div>
        </div>

        {/* ── Right Sections Nav Panel ── */}
        <FloatingNavigator sections={navSections} />
      </div>

      {/* Action Bar */}
      <ReportActionBar
        autoSaveStatus={autoSaveStatus}
        userRole={userRole}
        message={message}
        loading={saving || previewing || !!uploading}
        onSaveDraft={handleSaveDraft}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
        isReadOnly={isReadOnly}
      />

      {/* Cloud Storage Photo Picker Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            const nextImgs = [...(form.propertyImages || []), ...selectedUrls];
            const nextNames = [...(form.propertyImageNames || [])];
            selectedUrls.forEach((_, i) => {
              nextNames.push(`Photograph ${(form.propertyImages?.length || 0) + i + 1}`);
            });
            setForm((prev: any) => ({
              ...prev,
              propertyImages: nextImgs,
              propertyImageNames: nextNames,
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
