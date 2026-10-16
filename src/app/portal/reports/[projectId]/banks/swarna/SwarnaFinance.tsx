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
import { PDFSwarnaFinanceRenderer } from '@/lib/banks/pdf-swarna-finance-renderer';
import {
  sanitizePositiveFloat,
  sanitizePositiveInt,
  sanitizePercentage,
  sanitizeYearsWithNA,
  parseSafeFloat,
  multiplyExactDecimals,
  sumDecimals,
} from '@/lib/bank-input-constraints';

export const SWARNA_FINANCE_CONFIG: BankConfig = {
  bankId: 'SWARNA FINANCE',
  subTemplateId: '',
  displayName: 'SwarnaPragati Housing Microfinance Pvt Ltd',
  defaultValues: {
    purpose: 'To determine Fair Market Value & Distress Value of the property',
  },
};

export interface SwarnaFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function SwarnaFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: SwarnaFinanceProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  // 1-to-1 NavItems matching form sections with ZERO numbers
  const navSections: NavItem[] = [
    { id: 'swarna-sec-general', title: 'General Details' },
    { id: 'swarna-sec-locality', title: 'Surrounding Locality' },
    { id: 'swarna-sec-occupancy', title: 'Usage & Occupancy' },
    { id: 'swarna-sec-building', title: 'Building Details' },
    { id: 'swarna-sec-quality', title: 'Quality of Construction' },
    { id: 'swarna-sec-unit', title: 'Approvals & Unit Details' },
    { id: 'swarna-sec-valuation', title: 'Valuation & Boundaries' },
    { id: 'swarna-sec-remarks', title: 'Remarks & Declaration' },
    { id: 'swarna-sec-docs', title: 'Property Documents' },
    { id: 'swarna-sec-maps', title: 'Location Maps' },
    { id: 'swarna-sec-photos', title: 'Property Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initializing state with reference-accurate defaults and prefill
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // SECTION 1: General Details (A, B, C)
    if (!d.refNo) d.refNo = 'SPHM/2023-24/01';
    if (!d.refDate) d.refDate = earliestVisit ? formatReportDate(earliestVisit.date) : '19/04/2023';
    if (!d.subjectText) {
      d.subjectText = 'Valuation report for House no.- NA, Ward no.-NA ,village- Bija Bahali,Teh.-Puintala, Dist- Bolangir';
    }
    if (!d.purposeOfValuation) {
      d.purposeOfValuation = 'To determine Fair Market Value & Distress Value of the above mentioned property as on date for SwarnaPragati Housing Microfinance Pvt Ltd, Branch Bolangir';
    }
    if (!d.branchName) d.branchName = 'Bolangir';
    if (!d.customerName) d.customerName = p.applicantName || 'Kamalendu Banachhor';
    if (!d.customerPhone) d.customerPhone = p.contactPhone || '7381324988';
    if (!d.propertyAddressFile) {
      d.propertyAddressFile = p.propertyAddress || 'Khata no-39/39, Plot no-63/447(AC.0.030Decs, Homestead), Mouza-Bija Bahali, Tahasil-Puintala, PS-Bolangir, Dist-Bolangir, Odisha, Pin-767002';
    }
    if (!d.landmark) d.landmark = p.nearestLandmark || 'Near Bijabahali Primary School';
    if (!d.documentHolderName) d.documentHolderName = p.ownerName || 'Kamalendu Banachhor, S/O-Kabiraj Banachhor';
    if (!d.legalAddress) {
      d.legalAddress = p.propertyAddress || 'Khata no-39/39, Plot no-63/447(AC.0.030Decs, Homestead), Mouza-Bija Bahali, Tahasil-Puintala, PS-Bolangir, Dist-Bolangir, Odisha, Pin-767002';
    }
    if (!d.dateOfInspection) d.dateOfInspection = earliestVisit ? formatReportDate(earliestVisit.date) : '18/04/2023';

    // SECTION 2: Surrounding Locality Details (D)
    if (!d.wardNoMunicipalNo) d.wardNoMunicipalNo = 'NA';
    if (!d.vicinity) d.vicinity = 'Mix / Residential/Commercial';
    if (!d.localityType) d.localityType = 'Middle Class/ Upper class';
    if (!d.proximityAmenitiesText) {
      d.proximityAmenitiesText = '1.  6Kms From Bolangir Railway Station\n2.  7Kms From Bolangir Bus Stop\n3.  7Kms From Bolangir Govt. Hospital Stop';
    }

    // SECTION 3: Usage & Occupant Details (E)
    if (!d.typeOfPremises) d.typeOfPremises = 'Residential';
    if (!d.occupantName) d.occupantName = 'Self';
    if (!d.relationshipWithApplicant) d.relationshipWithApplicant = 'Owner';
    if (!d.isPropertyRented) d.isPropertyRented = 'No';
    if (!d.rentedListOccupants) d.rentedListOccupants = 'NA';

    // SECTION 4: Building Details (F)
    if (!d.typesOfStructure) d.typesOfStructure = 'RCC Framed Structure';
    if (!d.noOfFloors) d.noOfFloors = 'GF Only';
    if (!d.noOfWings) d.noOfWings = 'NA';
    if (!d.noOfFlatsPerFloor) d.noOfFlatsPerFloor = 'NA';
    if (!d.noOfLifts) d.noOfLifts = 'NA';
    if (!d.completenessProperty) d.completenessProperty = '80';
    if (!d.ageOfProperty) d.ageOfProperty = '1-Year';
    if (!d.estimatedFurtherLife) d.estimatedFurtherLife = '59-Years';
    if (!d.buildingDemolitionRisk) d.buildingDemolitionRisk = 'Low';

    // SECTION 5: Quality of Construction (G)
    if (!d.exteriorQuality) d.exteriorQuality = 'Average';
    if (!d.beamAndColumn) d.beamAndColumn = 'RCC';
    if (!d.appearanceOfHouse) d.appearanceOfHouse = 'Average';
    if (!d.maintenanceOfHouse) d.maintenanceOfHouse = 'Average';
    if (!d.commonAreasRemark) d.commonAreasRemark = 'NA';
    if (!d.interiorQuality) d.interiorQuality = 'Average';
    if (!d.qualityOfFittings) d.qualityOfFittings = 'Average';
    if (!d.flooringInterior) d.flooringInterior = 'AS Flooring';
    if (!d.finishingInterior) d.finishingInterior = 'Average';
    if (!d.roofingTerracing) d.roofingTerracing = 'RCC Roof';

    // SECTION 6: Approvals & Unit Details (H, I)
    if (!d.detailsOfPlanApprovals) d.detailsOfPlanApprovals = 'Plan not provided';
    if (!d.situatedOnFloor) d.situatedOnFloor = 'GF';
    if (!d.internalComposition) d.internalComposition = 'Average';
    if (!d.unitFlooring) d.unitFlooring = 'AS Flooring';
    if (!d.electricalInstallations) d.electricalInstallations = 'Yes';
    if (!d.plumbingLines) d.plumbingLines = 'NA';
    if (!d.kitchenPlatformType) d.kitchenPlatformType = 'NA';
    if (!d.doorsAndWindows) d.doorsAndWindows = 'Hard wood';
    if (!d.additionalAmenities) d.additionalAmenities = 'NA';

    // SECTION 7: Valuation Engine & Boundaries (J)
    if (!d.landAreaSqft) d.landAreaSqft = '1307';
    if (!d.carpetAreaSqft) d.carpetAreaSqft = '765';
    if (!d.loadingForBua) d.loadingForBua = 'NA';
    if (!d.builtUpAreaSqft) d.builtUpAreaSqft = '900';
    if (!d.landRatePerSqft) d.landRatePerSqft = '0';
    if (!d.buildingRatePerSqft) d.buildingRatePerSqft = '0';

    // Boundaries
    if (!d.boundDeedEast) d.boundDeedEast = 'Saina Chhatria';
    if (!d.boundDeedWest) d.boundDeedWest = 'Self';
    if (!d.boundDeedNorth) d.boundDeedNorth = 'Sanadev Banachhor';
    if (!d.boundDeedSouth) d.boundDeedSouth = 'Bansi Banachhor';

    if (!d.boundActEast) d.boundActEast = 'Building of Sanadev Banachhor';
    if (!d.boundActWest) d.boundActWest = 'Building of Rajbihari Banachhor';
    if (!d.boundActNorth) d.boundActNorth = 'Vacant land';
    if (!d.boundActSouth) d.boundActSouth = 'Road';
    if (!d.boundaryMismatchStatus) d.boundaryMismatchStatus = 'Boundary mis matches';

    // SECTION 8: Remarks & Declaration (K & Declarations)
    if (!d.synthesisRemarks) {
      d.synthesisRemarks = 'Subject property is a single storied residential building having land extent of 1307sqft., having measured BUA is 900sqft. Approved plan is not provided. Age of property is about 1-years. Property located in developing area of Puintala & approaches 15 feet wide Road. The building is occupied by the customer for residential purpose.\nNote- Property shown by the customer/GPS location is mis matching with the revenue mouza map/Bhu-Naksa. Property is located somewhere else. Hence this case is not recommended.';
    }
    if (!d.reportDate) d.reportDate = d.refDate || '19/04/2023';
    if (!d.reportPlace) d.reportPlace = 'Bolangir';

    return d;
  });

  // UI state
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<string | false>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);

  // Field change handler
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
  }, []);

  // Sync actual boundaries with sale deed
  const handleSyncBoundaries = useCallback(() => {
    setFields(prev => ({
      ...prev,
      boundActEast: prev.boundDeedEast || '',
      boundActWest: prev.boundDeedWest || '',
      boundActNorth: prev.boundDeedNorth || '',
      boundActSouth: prev.boundDeedSouth || '',
    }));
  }, []);

  // Exact Financial Valuation Calculations
  const calculations = useMemo(() => {
    const landArea = parseSafeFloat(fields.landAreaSqft);
    const landRate = parseSafeFloat(fields.landRatePerSqft);
    const landVal = multiplyExactDecimals(landArea, landRate);

    const bua = parseSafeFloat(fields.builtUpAreaSqft);
    const buildingRate = parseSafeFloat(fields.buildingRatePerSqft);
    const bldVal = multiplyExactDecimals(bua, buildingRate);

    const fmv = sumDecimals([landVal, bldVal]);
    const distressVal = Math.round(fmv * 0.75);

    return {
      landArea,
      landRate,
      landVal,
      bua,
      buildingRate,
      bldVal,
      fmv,
      distressVal,
    };
  }, [
    fields.landAreaSqft,
    fields.landRatePerSqft,
    fields.builtUpAreaSqft,
    fields.buildingRatePerSqft,
  ]);

  // Document, Map, and Photograph upload handlers
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

  // PDF Preview Handler
  const handlePreviewPDF = useCallback(async () => {
    setPreviewing(true);
    try {
      const mergedFields = {
        ...fields,
        calculatedLandValue: calculations.landVal,
        calculatedBuildingValue: calculations.bldVal,
        calculatedFMV: calculations.fmv,
        calculatedDistressValue: calculations.distressVal,
      };
      const renderer = new PDFSwarnaFinanceRenderer({
        ...mergedFields,
        projectCode,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      console.error('Failed to preview PDF:', err);
      alert('Error generating PDF preview: ' + (err.message || 'Unknown error'));
    } finally {
      setPreviewing(false);
    }
  }, [fields, projectCode, calculations]);

  // PDF Download Handler
  const handleDownloadPDF = useCallback(async () => {
    try {
      const mergedFields = {
        ...fields,
        calculatedLandValue: calculations.landVal,
        calculatedBuildingValue: calculations.bldVal,
        calculatedFMV: calculations.fmv,
        calculatedDistressValue: calculations.distressVal,
      };
      const renderer = new PDFSwarnaFinanceRenderer({
        ...mergedFields,
        projectCode,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Swarna_Finance_Report_${projectCode || 'Draft'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
      alert('Error downloading PDF: ' + (err.message || 'Unknown error'));
    }
  }, [fields, projectCode, calculations]);

  // Draft Save Handler
  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        ...fields,
        calculatedLandValue: calculations.landVal,
        calculatedBuildingValue: calculations.bldVal,
        calculatedFMV: calculations.fmv,
        calculatedDistressValue: calculations.distressVal,
      };
      const res = await saveReportDraft(projectId, payload);
      if (res.success) {
        setMessage({ text: 'Draft saved successfully', type: 'success' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: res.error || 'Failed to save draft', type: 'error' });
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Save error', type: 'error' });
    } finally {
      setSaving(false);
    }
  }, [projectId, fields, calculations]);

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this Swarna Finance report?')) return;
    try {
      setSubmitting(true);
      await saveReportDraft(projectId, {
        ...fields,
        calculatedLandValue: calculations.landVal,
        calculatedBuildingValue: calculations.bldVal,
        calculatedFMV: calculations.fmv,
        calculatedDistressValue: calculations.distressVal,
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

  return (
    <div className="space-y-6 pb-28 w-full">
      {/* Truthful Active Configuration Banner */}
      <ActiveConfigBanner
        clientType="organisation"
        category="Bank & FIS"
        bankName="SWARNA FINANCE"
        onResetWizard={onResetWizard}
        sticky={false}
      />

      {/* Main Layout: Left Form & Right Floating Navigator */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* Left Form Column */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          <div className="bg-slate-900/90 rounded-xl shadow border border-slate-800 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                SWARNA FINANCE — TECHNICAL VALUATION REPORT
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                SwarnaPragati Housing Microfinance Pvt Ltd • Ref: <span className="font-semibold text-slate-200">{fields.refNo || projectCode}</span>
              </p>
            </div>
            {earliestVisit && <EarliestFieldVisitBadge fieldVisit={earliestVisit} />}
          </div>

          {message && (
            <div
              className={`p-4 rounded-xl text-sm font-medium border ${
                message.type === 'success'
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/70 border-rose-500/40 text-rose-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* ═══════════════════════════════════════════════
              SECTION 1: GENERAL DETAILS (A, B, C)
          ═══════════════════════════════════════════════ */}
          <Section title="General Details" id="swarna-sec-general">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Reference Number">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.refNo || ''}
                  onChange={e => handleFieldChange('refNo', e.target.value)}
                />
              </Field>

              <Field label="Reference Date">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.refDate || ''}
                  onChange={e => handleFieldChange('refDate', e.target.value)}
                />
              </Field>

              <Field label="Branch Name">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.branchName || ''}
                  onChange={e => handleFieldChange('branchName', e.target.value)}
                />
              </Field>

              <Field label="Name Of Customer">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.customerName || ''}
                  onChange={e => handleFieldChange('customerName', e.target.value)}
                />
              </Field>

              <Field label="Customer Mobile No.">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.customerPhone || ''}
                  onChange={e => handleFieldChange('customerPhone', e.target.value)}
                />
              </Field>

              <Field label="Name Of Document Holder">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.documentHolderName || ''}
                  onChange={e => handleFieldChange('documentHolderName', e.target.value)}
                />
              </Field>

              <Field label="Land Mark">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.landmark || ''}
                  onChange={e => handleFieldChange('landmark', e.target.value)}
                />
              </Field>

              <Field label="Date Of Inspection">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.dateOfInspection || ''}
                  onChange={e => handleFieldChange('dateOfInspection', e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4 space-y-4">
              <Field label="A. Subject Description">
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.subjectText || ''}
                  onChange={e => handleFieldChange('subjectText', e.target.value)}
                />
              </Field>

              <Field label="B. Purpose of Valuation">
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.purposeOfValuation || ''}
                  onChange={e => handleFieldChange('purposeOfValuation', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="C.2. Property Address (As per File)">
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.propertyAddressFile || ''}
                    onChange={e => handleFieldChange('propertyAddressFile', e.target.value)}
                  />
                </Field>

                <Field label="C.5. Legal Address Of Property">
                  <textarea
                    rows={3}
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.legalAddress || ''}
                    onChange={e => handleFieldChange('legalAddress', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 2: SURROUNDING LOCALITY (D)
          ═══════════════════════════════════════════════ */}
          <Section title="Surrounding Locality" id="swarna-sec-locality">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="1. Ward No. / Municipal Land No.">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.wardNoMunicipalNo || ''}
                  onChange={e => handleFieldChange('wardNoMunicipalNo', e.target.value)}
                />
              </Field>

              <Field label="2. Vicinity">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.vicinity || 'Mix / Residential/Commercial'}
                  onChange={e => handleFieldChange('vicinity', e.target.value)}
                >
                  <option value="Mix / Residential/Commercial">Mix / Residential/Commercial</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                </select>
              </Field>

              <Field label="3. Locality Type">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.localityType || 'Middle Class/ Upper class'}
                  onChange={e => handleFieldChange('localityType', e.target.value)}
                >
                  <option value="Middle Class/ Upper class">Middle Class/ Upper class</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Upper Class">Upper Class</option>
                  <option value="Lower Middle Class">Lower Middle Class</option>
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="4. Proximity To Civic Amenities">
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.proximityAmenitiesText || ''}
                  onChange={e => handleFieldChange('proximityAmenitiesText', e.target.value)}
                  placeholder="e.g. 1. 6Kms From Railway Station..."
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 3: USAGE & OCCUPANCY (E)
          ═══════════════════════════════════════════════ */}
          <Section title="Usage & Occupancy" id="swarna-sec-occupancy">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="1. Type Of Premises">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.typeOfPremises || 'Residential'}
                  onChange={e => handleFieldChange('typeOfPremises', e.target.value)}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </Field>

              <Field label="Name of the Occupant">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.occupantName || ''}
                  onChange={e => handleFieldChange('occupantName', e.target.value)}
                />
              </Field>

              <Field label="Relationship with Applicant">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.relationshipWithApplicant || ''}
                  onChange={e => handleFieldChange('relationshipWithApplicant', e.target.value)}
                />
              </Field>

              <Field label="Is Property Rented?">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.isPropertyRented || 'No'}
                  onChange={e => handleFieldChange('isPropertyRented', e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="If Rented, List of Occupants">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.rentedListOccupants || ''}
                  onChange={e => handleFieldChange('rentedListOccupants', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 4: BUILDING DETAILS (F)
          ═══════════════════════════════════════════════ */}
          <Section title="Building Details" id="swarna-sec-building">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="1. Types of Structure">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.typesOfStructure || ''}
                  onChange={e => handleFieldChange('typesOfStructure', e.target.value)}
                />
              </Field>

              <Field label="2. No of Floors">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={e => handleFieldChange('noOfFloors', e.target.value)}
                />
              </Field>

              <Field label="3. No of Wings">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.noOfWings || ''}
                  onChange={e => handleFieldChange('noOfWings', e.target.value)}
                />
              </Field>

              <Field label="4. No of flats per floor">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.noOfFlatsPerFloor || ''}
                  onChange={e => handleFieldChange('noOfFlatsPerFloor', e.target.value)}
                />
              </Field>

              <Field label="5. No of lift in each wings">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.noOfLifts || ''}
                  onChange={e => handleFieldChange('noOfLifts', e.target.value)}
                />
              </Field>

              <Field label="6. Completeness of Property (%)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.completenessProperty || ''}
                  onChange={e => handleFieldChange('completenessProperty', sanitizePercentage(e.target.value))}
                />
              </Field>

              <Field label="7. Age of Property">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.ageOfProperty || ''}
                  onChange={e => handleFieldChange('ageOfProperty', sanitizeYearsWithNA(e.target.value))}
                />
              </Field>

              <Field label="8. Estimated further life">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.estimatedFurtherLife || ''}
                  onChange={e => handleFieldChange('estimatedFurtherLife', sanitizeYearsWithNA(e.target.value))}
                />
              </Field>

              <Field label="9. Building Demolition Risk">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.buildingDemolitionRisk || 'Low'}
                  onChange={e => handleFieldChange('buildingDemolitionRisk', e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Nil">Nil</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 5: QUALITY OF CONSTRUCTION (G)
          ═══════════════════════════════════════════════ */}
          <Section title="Quality of Construction" id="swarna-sec-quality">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Exterior Quality
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Field label="1. Beam & column">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.beamAndColumn || ''}
                  onChange={e => handleFieldChange('beamAndColumn', e.target.value)}
                />
              </Field>

              <Field label="2. Appearance of the House">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.appearanceOfHouse || 'Average'}
                  onChange={e => handleFieldChange('appearanceOfHouse', e.target.value)}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="3. Maintenance of the House">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.maintenanceOfHouse || 'Average'}
                  onChange={e => handleFieldChange('maintenanceOfHouse', e.target.value)}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="4. Common Areas of Remark">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.commonAreasRemark || ''}
                  onChange={e => handleFieldChange('commonAreasRemark', e.target.value)}
                />
              </Field>
            </div>

            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Interiors Quality
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Field label="5. Quality of Fittings">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.qualityOfFittings || 'Average'}
                  onChange={e => handleFieldChange('qualityOfFittings', e.target.value)}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="6. Flooring">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.flooringInterior || ''}
                  onChange={e => handleFieldChange('flooringInterior', e.target.value)}
                />
              </Field>

              <Field label="7. Finishing">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.finishingInterior || 'Average'}
                  onChange={e => handleFieldChange('finishingInterior', e.target.value)}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="8. Roofing & Terracing">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.roofingTerracing || ''}
                  onChange={e => handleFieldChange('roofingTerracing', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 6: APPROVALS & UNIT DETAILS (H, I)
          ═══════════════════════════════════════════════ */}
          <Section title="Approvals & Unit Details" id="swarna-sec-unit">
            <div className="mb-4">
              <Field label="H.1. Details of Plan & Approvals">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.detailsOfPlanApprovals || ''}
                  onChange={e => handleFieldChange('detailsOfPlanApprovals', e.target.value)}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Field label="I.1. Situated on floor no.">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.situatedOnFloor || ''}
                  onChange={e => handleFieldChange('situatedOnFloor', e.target.value)}
                />
              </Field>

              <Field label="I.2. Internal Composition">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.internalComposition || ''}
                  onChange={e => handleFieldChange('internalComposition', e.target.value)}
                />
              </Field>

              <Field label="I.3. Flooring">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.unitFlooring || ''}
                  onChange={e => handleFieldChange('unitFlooring', e.target.value)}
                />
              </Field>

              <Field label="I.4. Electrical installations">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.electricalInstallations || 'Yes'}
                  onChange={e => handleFieldChange('electricalInstallations', e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Plumbing Lines">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.plumbingLines || ''}
                  onChange={e => handleFieldChange('plumbingLines', e.target.value)}
                />
              </Field>

              <Field label="I.5. Kitchen Platform type">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.kitchenPlatformType || ''}
                  onChange={e => handleFieldChange('kitchenPlatformType', e.target.value)}
                />
              </Field>

              <Field label="I.6. Door & Window">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.doorsAndWindows || ''}
                  onChange={e => handleFieldChange('doorsAndWindows', e.target.value)}
                />
              </Field>

              <Field label="I.7. Additional amenities">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.additionalAmenities || ''}
                  onChange={e => handleFieldChange('additionalAmenities', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 7: VALUATION & BOUNDARIES (J)
          ═══════════════════════════════════════════════ */}
          <Section title="Valuation & Boundaries" id="swarna-sec-valuation">
            {/* Live Financial Valuation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-lg">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  Fair Market Value (Plot + Const.)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.fmv)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.fmv)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/60 to-slate-900 border border-amber-500/40 shadow-lg">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                  Distress Value (75%)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.distressVal)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.distressVal)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/60 shadow">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Land Value (₹)
                </span>
                <span className="text-xl font-bold text-slate-200 mt-1 block">
                  ₹ {formatIndianCurrency(calculations.landVal)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-700/60 shadow">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Building Value (₹)
                </span>
                <span className="text-xl font-bold text-slate-200 mt-1 block">
                  ₹ {formatIndianCurrency(calculations.bldVal)}
                </span>
              </div>
            </div>

            {/* Area & Rates Inputs */}
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/40 space-y-4 mb-6">
              <div className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
                Valuation Engine Inputs
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="1. Land Area (Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.landAreaSqft || ''}
                    onChange={e => handleFieldChange('landAreaSqft', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="2. Carpet Area (Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.carpetAreaSqft || ''}
                    onChange={e => handleFieldChange('carpetAreaSqft', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="3. Loading for BUA">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.loadingForBua || ''}
                    onChange={e => handleFieldChange('loadingForBua', e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="4. Built Up Area (BUA) (Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.builtUpAreaSqft || ''}
                    onChange={e => handleFieldChange('builtUpAreaSqft', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="5. Land Rate (₹/Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.landRatePerSqft || ''}
                    onChange={e => handleFieldChange('landRatePerSqft', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="Building / Construction Rate (₹/Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.buildingRatePerSqft || ''}
                    onChange={e => handleFieldChange('buildingRatePerSqft', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>
              </div>
            </div>

            {/* Boundaries Comparison */}
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-semibold text-slate-300">
                Boundaries Comparison (Sale Deed vs Actual)
              </div>
              <button
                type="button"
                onClick={handleSyncBoundaries}
                disabled={isReadOnly}
                className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                Copy Deed to Actual
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl mb-4">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-28">Direction</th>
                    <th className="p-3">As per Sale Deed</th>
                    <th className="p-3">As per Actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-3 font-medium text-slate-300">East</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundDeedEast || ''}
                        onChange={e => handleFieldChange('boundDeedEast', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundActEast || ''}
                        onChange={e => handleFieldChange('boundActEast', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">West</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundDeedWest || ''}
                        onChange={e => handleFieldChange('boundDeedWest', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundActWest || ''}
                        onChange={e => handleFieldChange('boundActWest', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">North</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundDeedNorth || ''}
                        onChange={e => handleFieldChange('boundDeedNorth', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundActNorth || ''}
                        onChange={e => handleFieldChange('boundActNorth', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">South</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundDeedSouth || ''}
                        onChange={e => handleFieldChange('boundDeedSouth', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundActSouth || ''}
                        onChange={e => handleFieldChange('boundActSouth', e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Field label="12. Boundary Status / Mismatch Observation">
              <input
                type="text"
                disabled={isReadOnly}
                className={inputCls}
                value={fields.boundaryMismatchStatus || ''}
                onChange={e => handleFieldChange('boundaryMismatchStatus', e.target.value)}
                placeholder="e.g. Boundary mis matches"
              />
            </Field>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 8: REMARKS & DECLARATION (K)
          ═══════════════════════════════════════════════ */}
          <Section title="Remarks & Declaration" id="swarna-sec-remarks">
            <Field label="K. Remarks / Valuation Synthesis">
              <textarea
                rows={5}
                disabled={isReadOnly}
                className={inputCls}
                value={fields.synthesisRemarks || ''}
                onChange={e => handleFieldChange('synthesisRemarks', e.target.value)}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Report Date">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.reportDate || ''}
                  onChange={e => handleFieldChange('reportDate', e.target.value)}
                />
              </Field>

              <Field label="Report Place">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.reportPlace || ''}
                  onChange={e => handleFieldChange('reportPlace', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              ATTACHMENTS (DOCUMENTS, MAPS, PHOTOGRAPHS)
          ═══════════════════════════════════════════════ */}
          <BaseDocumentsSection
            title="Property Documents"
            sectionId="swarna-sec-docs"
            documentImages={fields.documentImages || []}
            documentImageNames={fields.documentImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onUploadDocuments={handleDocUpload}
            onRemoveDocument={(idx: number) => setFields(p => ({
              ...p,
              documentImages: (p.documentImages || []).filter((_: any, i: number) => i !== idx),
              documentImageNames: (p.documentImageNames || []).filter((_: any, i: number) => i !== idx),
            }))}
            onDocumentNameChange={(idx: number, name: string) => {
              const arr = [...(fields.documentImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFields(p => ({ ...p, documentImageNames: arr }));
            }}
            onReorderDocuments={(newImgs: string[], newNames: string[]) => setFields(p => ({ ...p, documentImages: newImgs, documentImageNames: newNames }))}
          />

          <BaseMapsSection
            title="Location Maps"
            sectionId="swarna-sec-maps"
            locationMapImages={fields.locationMapImages || []}
            mouzaMapImages={fields.mouzaMapImages || []}
            sketchMapImages={fields.sketchMapImages || []}
            cadastralMapImages={fields.cadastralMapImages || []}
            bdaMapImages={fields.bdaMapImages || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onLocationMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('locationMapImages', e)}
            onLocationMapRemove={(idx?: number) => setFields(p => ({ ...p, locationMapImages: (p.locationMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onMouzaMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('mouzaMapImages', e)}
            onMouzaMapRemove={(idx?: number) => setFields(p => ({ ...p, mouzaMapImages: (p.mouzaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onSketchMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('sketchMapImages', e)}
            onSketchMapRemove={(idx?: number) => setFields(p => ({ ...p, sketchMapImages: (p.sketchMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onCadastralMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('cadastralMapImages', e)}
            onCadastralMapRemove={(idx?: number) => setFields(p => ({ ...p, cadastralMapImages: (p.cadastralMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onBdaMapUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleMapUpload('bdaMapImages', e)}
            onBdaMapRemove={(idx?: number) => setFields(p => ({ ...p, bdaMapImages: (p.bdaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onReorderLocationMap={(newImgs: string[]) => setFields(p => ({ ...p, locationMapImages: newImgs }))}
            onReorderMouzaMap={(newImgs: string[]) => setFields(p => ({ ...p, mouzaMapImages: newImgs }))}
            onReorderSketchMap={(newImgs: string[]) => setFields(p => ({ ...p, sketchMapImages: newImgs }))}
            onReorderCadastralMap={(newImgs: string[]) => setFields(p => ({ ...p, cadastralMapImages: newImgs }))}
            onReorderBdaMap={(newImgs: string[]) => setFields(p => ({ ...p, bdaMapImages: newImgs }))}
          />

          <BasePhotographsSection
            title="Property Photographs"
            sectionId="swarna-sec-photos"
            propertyImages={fields.propertyImages || []}
            propertyImageNames={fields.propertyImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            bucketCount={bucketImages?.length || 0}
            onOpenBucketPicker={() => setShowBucketModal(true)}
            onUploadImages={handlePhotoUpload}
            onRemoveImage={(idx: number) => setFields(p => ({
              ...p,
              propertyImages: (p.propertyImages || []).filter((_: any, i: number) => i !== idx),
              propertyImageNames: (p.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
            }))}
            onImageNameChange={(idx: number, name: string) => {
              const arr = [...(fields.propertyImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFields(p => ({ ...p, propertyImageNames: arr }));
            }}
            onReorderImages={(newImgs: string[], newNames: string[]) => setFields(p => ({ ...p, propertyImages: newImgs, propertyImageNames: newNames }))}
          />
        </div>

        {/* Right Sections Nav Panel */}
        <FloatingNavigator sections={navSections} />
      </div>

      {/* Sticky Action Bar */}
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

      {/* Bucket Photo Picker Modal */}
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
