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
  BasePhotoBucketModal,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFTataHousingFinanceRenderer } from '@/lib/banks/pdf-tata-housing-finance-renderer';
import {
  sanitizePositiveFloat,
  sanitizePositiveInt,
  sanitizePercentage,
  sanitizeYearsWithNA,
  sanitizeDimensionWithNA,
  parseSafeFloat,
  multiplyExactDecimals,
  sumDecimals,
  calculatePercentageValue,
} from '@/lib/bank-input-constraints';

export const TATA_HOUSING_FINANCE_CONFIG: BankConfig = {
  bankId: 'TATA HOUSING FINANCE LTD',
  subTemplateId: '',
  displayName: 'Tata Housing Finance Ltd',
  defaultValues: {
    purpose: 'Valuation Report - Self Construction/HEL/HIL',
  },
};

export interface TataHousingFinanceProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function TataHousingFinance({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: TataHousingFinanceProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  // 1-to-1 NavItems matching form sections with ZERO numbers
  const navSections: NavItem[] = [
    { id: 'tata-housing-sec-general', title: 'General Details' },
    { id: 'tata-housing-sec-boundaries', title: 'Boundaries & Road' },
    { id: 'tata-housing-sec-technical', title: 'Technical & Floor Areas' },
    { id: 'tata-housing-sec-valuation', title: 'Valuation & Calculations' },
    { id: 'tata-housing-sec-remarks', title: 'Remarks & Due Diligence' },
    { id: 'tata-housing-sec-docs', title: 'Documents' },
    { id: 'tata-housing-sec-maps', title: 'Maps' },
    { id: 'tata-housing-sec-photos', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initializing state with reference-accurate defaults and prefill
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // SECTION 1: General Details
    if (!d.caseType) d.caseType = 'Valuation Report - Self Construction/HEL/HIL';
    if (!d.refNo) d.refNo = d.webTopNo || projectCode || '';
    if (!d.webTopNo) d.webTopNo = d.refNo;
    if (!d.reportDate) d.reportDate = earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date());
    if (!d.customerName) d.customerName = p.applicantName || p.contactName || '';
    if (!d.coOwners) d.coOwners = 'NA';
    if (!d.propertyAddress) {
      d.propertyAddress = p.propertyAddress || '';
    }
    if (!d.city) d.city = '';
    if (!d.state) d.state = 'Odisha';
    if (!d.pinCode) d.pinCode = '';
    if (!d.nearbyLandmark) d.nearbyLandmark = p.nearestLandmark || '';
    if (!d.distanceCityCenter) d.distanceCityCenter = '';
    if (!d.classOfLocality) d.classOfLocality = 'Middle';
    if (!d.occupancyDetails) d.occupancyDetails = 'Vacant';
    if (!d.monthlyRentals) d.monthlyRentals = 'Rs.(NA) Under construction';
    if (!d.nameOfLease) d.nameOfLease = 'NA';
    if (!d.typeOfProperty) d.typeOfProperty = 'Bungalow';
    if (!d.statusOfProperty) d.statusOfProperty = 'Free Hold';
    if (!d.actualUsage) d.actualUsage = 'Residential (Under-construction)';
    if (!d.approvedUsage) d.approvedUsage = 'Residential';
    if (!d.demarcationAtSite) d.demarcationAtSite = 'Not Available';

    // SECTION 2: Boundaries & Road
    if (!d.boundDocEast) d.boundDocEast = '';
    if (!d.boundActEast) d.boundActEast = '';
    if (!d.boundDocWest) d.boundDocWest = '';
    if (!d.boundActWest) d.boundActWest = '';
    if (!d.boundDocNorth) d.boundDocNorth = '';
    if (!d.boundActNorth) d.boundActNorth = '';
    if (!d.boundDocSouth) d.boundDocSouth = '';
    if (!d.boundActSouth) d.boundActSouth = '';

    if (!d.roadWidth1) d.roadWidth1 = "12'-0\"";
    if (!d.roadWidth2) d.roadWidth2 = 'NA';
    if (!d.latitude) d.latitude = p.latitude || '';
    if (!d.longitude) d.longitude = p.longitude || '';
    if (!d.urbanRuralClassification) d.urbanRuralClassification = 'Rural';

    // SECTION 3: Technical & Floor Areas
    if (!d.approvalDetailsText) d.approvalDetailsText = '';
    if (!d.approvalPlanDate) d.approvalPlanDate = '';
    if (!d.approvalNo) d.approvalNo = 'Not Mentioned';
    if (!d.commencementCertDate) d.commencementCertDate = 'NA';
    if (!d.commencementCertNo) d.commencementCertNo = 'NA';
    if (!d.occupancyCertDate) d.occupancyCertDate = 'NA';
    if (!d.occupancyCertNo) d.occupancyCertNo = 'NA';
    if (!d.dateStartingConstruction) d.dateStartingConstruction = 'Under-construction';
    if (!d.expectedLifeOfStructure) d.expectedLifeOfStructure = '60-Years';
    if (!d.typeOfStructure) d.typeOfStructure = 'RCC';
    if (!d.noOfFloors) d.noOfFloors = '';
    if (!d.plotAreaSqft) d.plotAreaSqft = p.plotArea || '';
    if (!d.qualityOfConstruction) d.qualityOfConstruction = 'Good';

    // BUA
    if (!d.buaGfApp) d.buaGfApp = '';
    if (!d.buaGfAct) d.buaGfAct = '';
    if (!d.buaFfApp) d.buaFfApp = 'NA';
    if (!d.buaFfAct) d.buaFfAct = 'NA';
    if (!d.buaTotalApp) d.buaTotalApp = '';
    if (!d.buaTotalAct) d.buaTotalAct = '';

    // Margins
    if (!d.marginFront) d.marginFront = '';
    if (!d.marginLeft) d.marginLeft = '';
    if (!d.marginRight) d.marginRight = '';
    if (!d.marginRear) d.marginRear = '';

    // SECTION 4: Valuation & Calculations
    if (!d.landAreaSqft) d.landAreaSqft = p.plotArea || '';
    if (!d.landMarketRate) d.landMarketRate = '';
    if (!d.leastBuaConsidered) d.leastBuaConsidered = '';
    if (!d.recommendedConstructionRate) d.recommendedConstructionRate = '';
    if (!d.materialFinishingDetails) {
      d.materialFinishingDetails = 'Marble flooring, Flush door, Aluminum Panel window, Distempering, weather coat, Bore well etc.';
    }
    if (!d.percentWorkCompleted) d.percentWorkCompleted = '';
    if (!d.percentDisbursementRecommended) d.percentDisbursementRecommended = '';
    if (!d.govtLandRatePerSqft) d.govtLandRatePerSqft = '';
    if (!d.govtConstructionRate) d.govtConstructionRate = '';

    // SECTION 5: Remarks & Due Diligence
    if (!d.synthesisRemarks) {
      d.synthesisRemarks = '';
    }
    if (!d.ddApprovedPlans) d.ddApprovedPlans = 'Available';
    if (!d.ddIdentificationPossible) d.ddIdentificationPossible = 'Available';
    if (!d.ddOwnershipMatrix) d.ddOwnershipMatrix = 'Available';
    if (!d.ddLandConversion) d.ddLandConversion = 'Available';
    if (!d.ddNegativeList) d.ddNegativeList = 'No';
    if (!d.ddLocalByeLaws) d.ddLocalByeLaws = 'Yes';
    if (!d.ddDemolitionRisk) d.ddDemolitionRisk = 'Low';

    if (!d.personVisitedSite) d.personVisitedSite = earliestVisit?.engineerName || p.firstFieldAgentName || 'Er. Satyajit Mohanty';
    if (!d.dateOfInspection) d.dateOfInspection = earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date());
    if (!d.valuationAgency) d.valuationAgency = 'M/s. S Mohanty Associates';

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

  // Sync actual boundaries with document
  const handleSyncBoundaries = useCallback(() => {
    setFields(prev => ({
      ...prev,
      boundActEast: prev.boundDocEast || '',
      boundActWest: prev.boundDocWest || '',
      boundActNorth: prev.boundDocNorth || '',
      boundActSouth: prev.boundDocSouth || '',
    }));
  }, []);

  // Exact 3-Tier Financial Valuation Calculations
  const calculations = useMemo(() => {
    const landArea = parseSafeFloat(fields.landAreaSqft);
    const landRate = parseSafeFloat(fields.landMarketRate);
    const landVal = multiplyExactDecimals(landArea, landRate);

    const constrArea = parseSafeFloat(fields.leastBuaConsidered);
    const constrRate = parseSafeFloat(fields.recommendedConstructionRate);
    const constrVal = multiplyExactDecimals(constrArea, constrRate);

    const completionVal = sumDecimals([landVal, constrVal]);

    const stagePct = parseSafeFloat(fields.percentWorkCompleted);
    const stageConstVal = calculatePercentageValue(constrVal, stagePct);
    const currentVal = sumDecimals([landVal, stageConstVal]);

    const govtLandRate = parseSafeFloat(fields.govtLandRatePerSqft);
    const govtLandVal = multiplyExactDecimals(landArea, govtLandRate);

    const govtConstrRate = parseSafeFloat(fields.govtConstructionRate);
    const govtConstrVal = multiplyExactDecimals(constrArea, govtConstrRate);

    const govtTotalVal = sumDecimals([govtLandVal, govtConstrVal]);

    return {
      landArea,
      landRate,
      landVal,
      constrArea,
      constrRate,
      constrVal,
      completionVal,
      stagePct,
      stageConstVal,
      currentVal,
      govtLandRate,
      govtLandVal,
      govtConstrRate,
      govtConstrVal,
      govtTotalVal,
    };
  }, [
    fields.landAreaSqft,
    fields.landMarketRate,
    fields.leastBuaConsidered,
    fields.recommendedConstructionRate,
    fields.percentWorkCompleted,
    fields.govtLandRatePerSqft,
    fields.govtConstructionRate,
  ]);

  // PDF Preview Handler
  const handlePreviewPDF = useCallback(async () => {
    setPreviewing(true);
    try {
      const mergedFields = {
        ...fields,
        calculatedLandValue: calculations.landVal,
        calculatedConstrValue: calculations.constrVal,
        calculatedCompletionValue: calculations.completionVal,
        calculatedCurrentValue: calculations.currentVal,
        calculatedGovtTotalValue: calculations.govtTotalVal,
      };
      const renderer = new PDFTataHousingFinanceRenderer({
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
        calculatedConstrValue: calculations.constrVal,
        calculatedCompletionValue: calculations.completionVal,
        calculatedCurrentValue: calculations.currentVal,
        calculatedGovtTotalValue: calculations.govtTotalVal,
      };
      const renderer = new PDFTataHousingFinanceRenderer({
        ...mergedFields,
        projectCode,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tata_Housing_Finance_Report_${projectCode || 'Draft'}.pdf`;
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
        calculatedCompletionValue: calculations.completionVal,
        calculatedCurrentValue: calculations.currentVal,
        calculatedGovtTotalValue: calculations.govtTotalVal,
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

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this Tata Housing Finance report?')) return;
    try {
      setSubmitting(true);
      await saveReportDraft(projectId, {
        ...fields,
        calculatedLandValue: calculations.landVal,
        calculatedCompletionValue: calculations.completionVal,
        calculatedCurrentValue: calculations.currentVal,
        calculatedGovtTotalValue: calculations.govtTotalVal,
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
      {/* Main Layout: Left Form & Right Floating Navigator */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* Left Form Column */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Universal Bank Report Header */}
          <BankReportHeader
            bankName="Tata Housing Finance Ltd"
            subclass="Self Construction / HEL / HIL"
            formatName="Technical Valuation Report Format"
            clientType="organisation"
            category="Housing Finance"
            serviceType="Valuation Report Builder"
            subjectType="Self Construction / HEL / HIL Valuation"
            onResetWizard={onResetWizard}
            earliestVisit={earliestVisit}
            projectCode={fields.webTopNo || projectCode}
            message={message}
          />

          {/* ═══════════════════════════════════════════════
              SECTION 1: GENERAL DETAILS
          ═══════════════════════════════════════════════ */}
          <Section title="General Details" id="tata-housing-sec-general" number={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Case Type / Subtitle">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.caseType || ''}
                  onChange={e => handleFieldChange('caseType', e.target.value)}
                />
              </Field>

              <Field label="WebTop Application No.">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.refNo || fields.webTopNo || projectCode || ''} disabled={true} readOnly={true} placeholder="SMA-YYYY/MM-NNNN"
                />
              </Field>

              <Field label="Date of Valuation">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.reportDate || ''}
                  onChange={e => handleFieldChange('reportDate', e.target.value)}
                />
              </Field>

              <Field label="Customer Name">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.customerName || ''}
                  onChange={e => handleFieldChange('customerName', e.target.value)}
                />
              </Field>

              <Field label="Name of Co-Owners">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.coOwners || ''}
                  onChange={e => handleFieldChange('coOwners', e.target.value)}
                />
              </Field>

              <Field label="City">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.city || ''}
                  onChange={e => handleFieldChange('city', e.target.value)}
                />
              </Field>

              <Field label="State">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.state || ''}
                  onChange={e => handleFieldChange('state', e.target.value)}
                />
              </Field>

              <Field label="Pin Code">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.pinCode || ''}
                  onChange={e => handleFieldChange('pinCode', sanitizePositiveInt(e.target.value, 6))}
                />
              </Field>

              <Field label="Nearby Landmark">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.nearbyLandmark || ''}
                  onChange={e => handleFieldChange('nearbyLandmark', e.target.value)}
                />
              </Field>

              <Field label="Distance from City Center">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.distanceCityCenter || ''}
                  onChange={e => handleFieldChange('distanceCityCenter', e.target.value)}
                />
              </Field>

              <Field label="Class of Locality">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.classOfLocality || 'Middle'}
                  onChange={e => handleFieldChange('classOfLocality', e.target.value)}
                >
                  <option value="Poor">Poor</option>
                  <option value="Middle">Middle</option>
                  <option value="Upper Middle">Upper Middle</option>
                  <option value="High Class">High Class</option>
                  <option value="Posh">Posh</option>
                </select>
              </Field>

              <Field label="Occupancy Details">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.occupancyDetails || 'Vacant'}
                  onChange={e => handleFieldChange('occupancyDetails', e.target.value)}
                >
                  <option value="Vacant">Vacant</option>
                  <option value="Self">Self</option>
                  <option value="Rented">Rented</option>
                </select>
              </Field>

              <Field label="Monthly Rentals">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.monthlyRentals || ''}
                  onChange={e => handleFieldChange('monthlyRentals', e.target.value)}
                />
              </Field>

              <Field label="Name of Lease">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.nameOfLease || ''}
                  onChange={e => handleFieldChange('nameOfLease', e.target.value)}
                />
              </Field>

              <Field label="Type of Property">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.typeOfProperty || 'Bungalow'}
                  onChange={e => handleFieldChange('typeOfProperty', e.target.value)}
                >
                  <option value="Bungalow">Bungalow</option>
                  <option value="Rowhouse">Rowhouse</option>
                  <option value="Plot">Plot</option>
                  <option value="Commercial Building">Commercial Building</option>
                  <option value="Office Building">Office Building</option>
                </select>
              </Field>

              <Field label="Status of Property">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.statusOfProperty || 'Free Hold'}
                  onChange={e => handleFieldChange('statusOfProperty', e.target.value)}
                >
                  <option value="Free Hold">Free Hold</option>
                  <option value="Development Authority Lease">Development Authority Lease</option>
                </select>
              </Field>

              <Field label="Actual Usage">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.actualUsage || ''}
                  onChange={e => handleFieldChange('actualUsage', e.target.value)}
                />
              </Field>

              <Field label="Approved Usage">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.approvedUsage || ''}
                  onChange={e => handleFieldChange('approvedUsage', e.target.value)}
                />
              </Field>

              <Field label="Demarcation at Site">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.demarcationAtSite || 'Not Available'}
                  onChange={e => handleFieldChange('demarcationAtSite', e.target.value)}
                >
                  <option value="Available">Available</option>
                  <option value="Not Available">Not Available</option>
                </select>
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Complete Property Address">
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.propertyAddress || ''}
                  onChange={e => handleFieldChange('propertyAddress', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 2: BOUNDARIES & ROAD
          ═══════════════════════════════════════════════ */}
          <Section title="Boundaries & Road" id="tata-housing-sec-boundaries" number={2}>
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-semibold text-slate-300">Four Boundaries Comparison</div>
              <button
                type="button"
                onClick={handleSyncBoundaries}
                disabled={isReadOnly}
                className="text-xs px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
              >
                Copy Submitted to Actual
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl mb-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-28">Direction</th>
                    <th className="p-3">As per Submitted Document</th>
                    <th className="p-3">Actual as per Site</th>
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
                        value={fields.boundDocEast || ''}
                        onChange={e => handleFieldChange('boundDocEast', e.target.value)}
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
                        value={fields.boundDocWest || ''}
                        onChange={e => handleFieldChange('boundDocWest', e.target.value)}
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
                        value={fields.boundDocNorth || ''}
                        onChange={e => handleFieldChange('boundDocNorth', e.target.value)}
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
                        value={fields.boundDocSouth || ''}
                        onChange={e => handleFieldChange('boundDocSouth', e.target.value)}
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Abutting Road Width 1">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.roadWidth1 || ''}
                  onChange={e => handleFieldChange('roadWidth1', sanitizeDimensionWithNA(e.target.value))}
                />
              </Field>

              <Field label="Abutting Road Width 2">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.roadWidth2 || ''}
                  onChange={e => handleFieldChange('roadWidth2', sanitizeDimensionWithNA(e.target.value))}
                />
              </Field>

              <Field label="GPS Latitude">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.latitude || ''}
                  onChange={e => handleFieldChange('latitude', e.target.value)}
                />
              </Field>

              <Field label="GPS Longitude">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.longitude || ''}
                  onChange={e => handleFieldChange('longitude', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 3: TECHNICAL & FLOOR AREAS
          ═══════════════════════════════════════════════ */}
          <Section title="Technical & Floor Areas" id="tata-housing-sec-technical" number={3}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Approval Details">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.approvalDetailsText || ''}
                  onChange={e => handleFieldChange('approvalDetailsText', e.target.value)}
                />
              </Field>

              <Field label="Approval Plan Date">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.approvalPlanDate || ''}
                  onChange={e => handleFieldChange('approvalPlanDate', e.target.value)}
                />
              </Field>

              <Field label="Approval No.">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.approvalNo || ''}
                  onChange={e => handleFieldChange('approvalNo', e.target.value)}
                />
              </Field>

              <Field label="Type of Structure">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.typeOfStructure || 'RCC'}
                  onChange={e => handleFieldChange('typeOfStructure', e.target.value)}
                >
                  <option value="RCC">RCC</option>
                  <option value="Load bearing">Load bearing</option>
                  <option value="Steel">Steel</option>
                </select>
              </Field>

              <Field label="Number of Floors">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={e => handleFieldChange('noOfFloors', e.target.value)}
                />
              </Field>

              <Field label="Expected Life of Structure">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.expectedLifeOfStructure || ''}
                  onChange={e => handleFieldChange('expectedLifeOfStructure', sanitizeYearsWithNA(e.target.value))}
                />
              </Field>

              <Field label="Plot Area (Sqft)">
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.plotAreaSqft || ''}
                  onChange={e => handleFieldChange('plotAreaSqft', sanitizePositiveFloat(e.target.value))}
                />
              </Field>

              <Field label="Quality of Construction">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.qualityOfConstruction || 'Good'}
                  onChange={e => handleFieldChange('qualityOfConstruction', e.target.value)}
                >
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
            </div>

            {/* Floorwise BUA */}
            <div className="mt-6 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800">
                Floorwise Built-up Area (BUA) Comparison
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/40 text-slate-300 font-medium border-b border-slate-800">
                  <tr>
                    <th className="p-3">Floor Level</th>
                    <th className="p-3">Approved BUA (Sqft)</th>
                    <th className="p-3">Actual BUA (Sqft)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-3 font-medium text-slate-300">Ground Floor</td>
                    <td className="p-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaGfApp || ''}
                        onChange={e => handleFieldChange('buaGfApp', sanitizePositiveFloat(e.target.value))}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaGfAct || ''}
                        onChange={e => handleFieldChange('buaGfAct', sanitizePositiveFloat(e.target.value))}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">First Floor</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaFfApp || ''}
                        onChange={e => handleFieldChange('buaFfApp', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaFfAct || ''}
                        onChange={e => handleFieldChange('buaFfAct', e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Side Margins */}
            <div className="mt-6 border border-slate-800 rounded-xl p-4 bg-slate-900/40">
              <div className="text-sm font-semibold text-slate-200 mb-3">Side Margins / Setbacks (Actual at Site)</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Front Margin">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.marginFront || ''}
                    onChange={e => handleFieldChange('marginFront', sanitizeDimensionWithNA(e.target.value))}
                  />
                </Field>

                <Field label="Left Margin">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.marginLeft || ''}
                    onChange={e => handleFieldChange('marginLeft', sanitizeDimensionWithNA(e.target.value))}
                  />
                </Field>

                <Field label="Right Margin">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.marginRight || ''}
                    onChange={e => handleFieldChange('marginRight', sanitizeDimensionWithNA(e.target.value))}
                  />
                </Field>

                <Field label="Rear Margin">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.marginRear || ''}
                    onChange={e => handleFieldChange('marginRear', sanitizeDimensionWithNA(e.target.value))}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 4: VALUATION & CALCULATIONS
          ═══════════════════════════════════════════════ */}
          <Section title="Valuation & Calculations" id="tata-housing-sec-valuation" number={4}>
            {/* Live Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-lg">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  Current Value of Property (Land + Current Stage)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.currentVal)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.currentVal)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-950/60 to-slate-900 border border-yellow-500/40 shadow-lg">
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider block">
                  Total Value on 100% Completion (A + B)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.completionVal)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.completionVal)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-500/40 shadow-lg">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                  Government Valuation Total
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.govtTotalVal)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.govtTotalVal)}
                </span>
              </div>
            </div>

            {/* Land Valuation Component */}
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/40 space-y-4 mb-6">
              <div className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
                A. Land Market Valuation
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Land Area Considered (Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.landAreaSqft || ''}
                    onChange={e => handleFieldChange('landAreaSqft', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="Adopted Land Rate (₹/Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.landMarketRate || ''}
                    onChange={e => handleFieldChange('landMarketRate', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="Calculated Land Value (A) (₹)">
                  <input
                    type="text"
                    disabled
                    className={`${inputCls} bg-slate-800/80 font-bold text-emerald-400`}
                    value={`₹ ${formatIndianCurrency(calculations.landVal)}`}
                  />
                </Field>
              </div>
            </div>

            {/* Construction Valuation Component */}
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/40 space-y-4 mb-6">
              <div className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
                B. Construction Valuation & Stage Completion
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Least BUA Considered (Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.leastBuaConsidered || ''}
                    onChange={e => handleFieldChange('leastBuaConsidered', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="Recommended Construction Rate (₹/Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.recommendedConstructionRate || ''}
                    onChange={e => handleFieldChange('recommendedConstructionRate', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="Total Recommended Construction Cost (B) (₹)">
                  <input
                    type="text"
                    disabled
                    className={`${inputCls} bg-slate-800/80 font-bold text-yellow-400`}
                    value={`₹ ${formatIndianCurrency(calculations.constrVal)}`}
                  />
                </Field>
              </div>

              <Field label="Material & Finishing Details">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.materialFinishingDetails || ''}
                  onChange={e => handleFieldChange('materialFinishingDetails', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Percentage of Work Completed (%)">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.percentWorkCompleted || ''}
                    onChange={e => handleFieldChange('percentWorkCompleted', sanitizePercentage(e.target.value))}
                  />
                </Field>

                <Field label="Disbursement Recommended (%)">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.percentDisbursementRecommended || ''}
                    onChange={e => handleFieldChange('percentDisbursementRecommended', sanitizePercentage(e.target.value))}
                  />
                </Field>
              </div>
            </div>

            {/* Government Valuation Component */}
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/40 space-y-4">
              <div className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
                C. Government Valuation
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Govt. Land Rate (₹/Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.govtLandRatePerSqft || ''}
                    onChange={e => handleFieldChange('govtLandRatePerSqft', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="Govt. Construction Rate (₹/Sqft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.govtConstructionRate || ''}
                    onChange={e => handleFieldChange('govtConstructionRate', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 5: REMARKS & DUE DILIGENCE
          ═══════════════════════════════════════════════ */}
          <Section title="Remarks & Due Diligence" id="tata-housing-sec-remarks" number={5}>
            <Field label="Valuation Synthesis Remarks">
              <textarea
                rows={4}
                disabled={isReadOnly}
                className={inputCls}
                value={fields.synthesisRemarks || ''}
                onChange={e => handleFieldChange('synthesisRemarks', e.target.value)}
              />
            </Field>

            <div className="mt-6 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800">
                Due Diligence Checklist (Points 1 - 7)
              </div>
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-3">1. Copy of approved Plans by Appropriate authority</td>
                    <td className="p-3 w-40">
                      <select
                        disabled={isReadOnly}
                        className={selectCls}
                        value={fields.ddApprovedPlans || 'Available'}
                        onChange={e => handleFieldChange('ddApprovedPlans', e.target.value)}
                      >
                        <option value="Available">Available</option>
                        <option value="Not available">Not available</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">2. Property identification possible with available documents</td>
                    <td className="p-3 w-40">
                      <select
                        disabled={isReadOnly}
                        className={selectCls}
                        value={fields.ddIdentificationPossible || 'Available'}
                        onChange={e => handleFieldChange('ddIdentificationPossible', e.target.value)}
                      >
                        <option value="Available">Available</option>
                        <option value="Not available">Not available</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">3. Ownership Matrix for property, share of ownership & identification</td>
                    <td className="p-3 w-40">
                      <select
                        disabled={isReadOnly}
                        className={selectCls}
                        value={fields.ddOwnershipMatrix || 'Available'}
                        onChange={e => handleFieldChange('ddOwnershipMatrix', e.target.value)}
                      >
                        <option value="Available">Available</option>
                        <option value="Not available">Not available</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">4. Conversion of Land by District Collector for current use</td>
                    <td className="p-3 w-40">
                      <select
                        disabled={isReadOnly}
                        className={selectCls}
                        value={fields.ddLandConversion || 'Available'}
                        onChange={e => handleFieldChange('ddLandConversion', e.target.value)}
                      >
                        <option value="Available">Available</option>
                        <option value="Not available">Not available</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">5. Does property fall in Negative Property List?</td>
                    <td className="p-3 w-40">
                      <select
                        disabled={isReadOnly}
                        className={selectCls}
                        value={fields.ddNegativeList || 'No'}
                        onChange={e => handleFieldChange('ddNegativeList', e.target.value)}
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">6. Property constructed as per local Bye Laws</td>
                    <td className="p-3 w-40">
                      <select
                        disabled={isReadOnly}
                        className={selectCls}
                        value={fields.ddLocalByeLaws || 'Yes'}
                        onChange={e => handleFieldChange('ddLocalByeLaws', e.target.value)}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">7. Risk of Demolition</td>
                    <td className="p-3 w-40">
                      <select
                        disabled={isReadOnly}
                        className={selectCls}
                        value={fields.ddDemolitionRisk || 'Low'}
                        onChange={e => handleFieldChange('ddDemolitionRisk', e.target.value)}
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Nil">Nil</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <Field label="Person Visited Site">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.personVisitedSite || ''}
                  onChange={e => handleFieldChange('personVisitedSite', e.target.value)}
                />
              </Field>

              <Field label="Date of Inspection">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.dateOfInspection || ''}
                  onChange={e => handleFieldChange('dateOfInspection', e.target.value)}
                />
              </Field>

              <Field label="Valuation Agency">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.valuationAgency || ''}
                  onChange={e => handleFieldChange('valuationAgency', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              ATTACHMENTS (DOCUMENTS, MAPS, PHOTOGRAPHS)
          ═══════════════════════════════════════════════ */}
          <BaseDocumentsSection
            title="Documents"
            sectionId="tata-housing-sec-docs"
            sectionNumber={6}
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
            title="Maps"
            sectionId="tata-housing-sec-maps"
            sectionNumber={7}
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
            title="Photographs"
            sectionId="tata-housing-sec-photos"
            sectionNumber={8}
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
