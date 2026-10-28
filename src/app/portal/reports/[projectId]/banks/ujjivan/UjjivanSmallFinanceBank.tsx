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
import { PDFUjjivanRenderer } from '@/lib/banks/pdf-ujjivan-renderer';
import {
  sanitizePositiveFloat,
  sanitizePositiveInt,
  sanitizePercentage,
  sanitizePositiveRange,
  sanitizeYearsWithNA,
  sanitizeDimensionWithNA,
  parseSafeFloat,
  multiplyExactDecimals,
  sumDecimals,
} from '@/lib/bank-input-constraints';

export const UJJIVAN_SMALL_FINANCE_BANK_CONFIG: BankConfig = {
  bankId: 'UJJIVAN SMALL FINANCE BANK',
  subTemplateId: '',
  displayName: 'Ujjivan Small Finance Bank',
  defaultValues: {
    purpose: 'To Ascertain fair market value of the property as on date',
  },
};

export interface UjjivanSmallFinanceBankProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function UjjivanSmallFinanceBank({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: UjjivanSmallFinanceBankProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  // 1-to-1 NavItems matching form sections with ZERO numbers
  const navSections: NavItem[] = [
    { id: 'ujjivan-sec-general', title: 'General Details' },
    { id: 'ujjivan-sec-layout', title: 'Layout & Amenities' },
    { id: 'ujjivan-sec-schedule', title: 'Schedule & Dimensions' },
    { id: 'ujjivan-sec-tech', title: 'Technical Details' },
    { id: 'ujjivan-sec-statutory', title: 'Statutory & Floor Areas' },
    { id: 'ujjivan-sec-valuation', title: 'Valuation Engine' },
    { id: 'ujjivan-sec-workstatus', title: 'Work Status & Recommendations' },
    { id: 'ujjivan-sec-remarks', title: 'Remarks & Declaration' },
    { id: 'ujjivan-sec-docs', title: 'Documents' },
    { id: 'ujjivan-sec-maps', title: 'Maps' },
    { id: 'ujjivan-sec-photos', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initializing state with reference-accurate defaults and prefill
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}), refNo: rawInitialFields?.refNo || projectCode || '' };
    const p = (prefill || {}) as any;

    // SECTION 1: General Details
    if (!d.applicantName) d.applicantName = p.applicantName || '';
    if (!d.purposeOfValuation) d.purposeOfValuation = 'To Ascertain fair market value of the property as on date';
    if (!d.nameOfValuer) d.nameOfValuer = 'M/s. S. Mohanty Associates';
    if (!d.valuationDate) d.valuationDate = earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date());
    if (!d.caseType) d.caseType = 'HEL';
    if (!d.contactPersonAndNumber) d.contactPersonAndNumber = p.contactName ? `${p.contactName}${p.contactPhone ? `, Mob-${p.contactPhone}` : ''}` : '';
    if (!d.inspectionDate) d.inspectionDate = earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date());
    if (!d.ownerNameAsPerDoc) d.ownerNameAsPerDoc = p.ownerName || p.applicantName || '';
    if (!d.providedDocuments) d.providedDocuments = 'Copy of Sale deed, ROR';
    if (!d.siteNoDoorNo) d.siteNoDoorNo = '';
    if (!d.propertyAddressDoc) {
      d.propertyAddressDoc = p.propertyAddress || '';
    }
    if (!d.propertyAddressActual) {
      d.propertyAddressActual = p.propertyAddress || '';
    }
    if (!d.isDemarcated) d.isDemarcated = 'Yes';
    if (!d.place) d.place = p.city || 'Bhubaneswar';
    if (!d.nearestLandmark) d.nearestLandmark = p.nearestLandmark || '';
    if (!d.distanceCityCentre) d.distanceCityCentre = '';
    if (!d.accessRoadName) d.accessRoadName = '';
    if (!d.typeOfProperty) d.typeOfProperty = 'Residential';
    if (!d.jurisdiction) d.jurisdiction = '';
    if (!d.shapeOfPlot) d.shapeOfPlot = 'Rectangular';
    if (!d.zonalClassification) d.zonalClassification = 'Residential';

    // SECTION 2: Layout & Amenities
    if (!d.waterFacility) d.waterFacility = 'Yes';
    if (!d.undergroundDrainage) d.undergroundDrainage = 'No';
    if (!d.typeOfRoad) d.typeOfRoad = 'Road';
    if (!d.electricity) d.electricity = 'Yes';
    if (!d.classOfLocality) d.classOfLocality = 'Middle Class';
    if (!d.marketability) d.marketability = 'GOOD';
    if (!d.surroundingLocality) d.surroundingLocality = 'Developed';
    if (!d.surroundingHabitation) d.surroundingHabitation = 'Yes(80%)';
    if (!d.nearbyCivicAmenities) d.nearbyCivicAmenities = 'School, ATM, Bank, Market (within 1-2 kms)';

    // SECTION 3: Schedule & Dimensions
    if (!d.boundDocEast) d.boundDocEast = 'Road';
    if (!d.boundActEast) d.boundActEast = 'Road';
    if (!d.boundRemarksEast) d.boundRemarksEast = '';
    if (!d.boundDocWest) d.boundDocWest = '';
    if (!d.boundActWest) d.boundActWest = '';
    if (!d.boundRemarksWest) d.boundRemarksWest = '';
    if (!d.boundDocNorth) d.boundDocNorth = '';
    if (!d.boundActNorth) d.boundActNorth = '';
    if (!d.boundRemarksNorth) d.boundRemarksNorth = '';
    if (!d.boundDocSouth) d.boundDocSouth = '';
    if (!d.boundActSouth) d.boundActSouth = '';
    if (!d.boundRemarksSouth) d.boundRemarksSouth = '';

    if (!d.boundAminEast) d.boundAminEast = 'NA';
    if (!d.boundAminWest) d.boundAminWest = 'NA';
    if (!d.boundAminNorth) d.boundAminNorth = 'NA';
    if (!d.boundAminSouth) d.boundAminSouth = 'NA';

    if (!d.dimAminEW) d.dimAminEW = 'NA';
    if (!d.dimAminNS) d.dimAminNS = 'NA';
    if (!d.dimActEW) d.dimActEW = '90\'-0"';
    if (!d.dimActNS) d.dimActNS = '13\'-0"';

    // SECTION 4: Technical & Structural Details
    if (!d.typeOfConstruction) d.typeOfConstruction = 'RCC Framed';
    if (!d.qualityOfConstruction) d.qualityOfConstruction = 'Average';
    if (!d.electricalFittings) d.electricalFittings = 'Standard';
    if (!d.sanitaryFittings) d.sanitaryFittings = 'Standard';
    if (!d.lifts) d.lifts = 'No';
    if (!d.compoundWall) d.compoundWall = 'No';
    if (!d.superStructure) d.superStructure = 'RCC Framed structure';
    if (!d.roofType) d.roofType = 'RCC Roof';
    if (!d.doorsWindows) d.doorsWindows = 'grilled door & window';
    if (!d.flooring) d.flooring = 'Tile';
    if (!d.yearOfConstruction) d.yearOfConstruction = '2026';
    if (!d.ageOfBuilding) d.ageOfBuilding = '0';
    if (!d.futureLifeRcc) d.futureLifeRcc = '60';
    if (!d.futureLifeAcSheet) d.futureLifeAcSheet = '0';

    // SECTION 5: Statutory & Floor Areas
    if (!d.siteAreaSchedule) d.siteAreaSchedule = '1176sqft (As per ROR)';
    if (!d.siteAreaPlan) d.siteAreaPlan = 'NA';
    if (!d.siteAreaActual) d.siteAreaActual = '1176sqft (As per Actual)';
    if (!d.statutoryApprovalDetails) d.statutoryApprovalDetails = 'Approval Plan not Provided';
    if (!d.approvalNumberAndDate) d.approvalNumberAndDate = 'NA';
    if (!d.fsiFarPermitted) d.fsiFarPermitted = 'NA';
    if (!d.permittedUse) d.permittedUse = 'NA';
    if (!d.actualUse) d.actualUse = 'Under construction (Residential)';
    if (!d.approvedFloors) d.approvedFloors = 'NA';
    if (!d.asBuiltFloors) d.asBuiltFloors = 'G+3';
    if (!d.adheresToNbcBis) d.adheresToNbcBis = 'Yes';
    if (!d.adheresToNdma) d.adheresToNdma = 'Yes';

    // Floorwise BUA
    if (!d.buaGfPerm) d.buaGfPerm = 'NA';
    if (!d.buaGfAct) d.buaGfAct = '1162';
    if (!d.buaFfPerm) d.buaFfPerm = 'NA';
    if (!d.buaFfAct) d.buaFfAct = '1162';
    if (!d.buaSfPerm) d.buaSfPerm = 'NA';
    if (!d.buaSfAct) d.buaSfAct = '1162';
    if (!d.buaTfPerm) d.buaTfPerm = 'NA';
    if (!d.buaTfAct) d.buaTfAct = '1162';
    if (!d.carpetArea) d.carpetArea = '3950.8';
    if (!d.adherenceSanctionPlan) d.adherenceSanctionPlan = 'NA';
    if (!d.devHorizontal) d.devHorizontal = 'NA';
    if (!d.devVertical) d.devVertical = 'NA';
    if (!d.devSetback) d.devSetback = 'NA';
    if (!d.riskOfDemolition) d.riskOfDemolition = 'LOW';
    if (!d.propertyTenure) d.propertyTenure = 'Free Hold';
    if (!d.internalComposition) d.internalComposition = 'Good';
    if (!d.presentOccupancy) d.presentOccupancy = 'Vacant (Under construction)';

    // SECTION 6: Valuation & Calculations (Table 22)
    if (!d.vicinityMarketRateMin) d.vicinityMarketRateMin = '6000';
    if (!d.vicinityMarketRateMax) d.vicinityMarketRateMax = '8000';
    if (!d.adoptedSalesRate) d.adoptedSalesRate = '8000';
    if (!d.constructionEstimateCustomer) d.constructionEstimateCustomer = 'NA';
    if (!d.landAreaSqft) d.landAreaSqft = '1176';
    if (!d.buaFar100) d.buaFar100 = '1764';
    if (!d.rateFar100) d.rateFar100 = '2000';
    if (!d.buaFarStage) d.buaFarStage = '1764';
    if (!d.rateFarStage) d.rateFarStage = '1600';
    if (!d.stagePercentage) d.stagePercentage = '80';
    if (!d.valOthers) d.valOthers = '0';
    if (!d.valElevation) d.valElevation = '0';
    if (!d.valInteriors) d.valInteriors = '0';

    // SECTION 7: Work Status & Recommendation
    if (!d.geoTagLatitude) d.geoTagLatitude = p.latitude || '';
    if (!d.geoTagLongitude) d.geoTagLongitude = p.longitude || '';
    if (!d.workStatusDescription) d.workStatusDescription = 'G+3=plastering work completed.';
    if (!d.progressCivil) d.progressCivil = '80';
    if (!d.recommendedCivil) d.recommendedCivil = '85';
    if (!d.progressInteriors) d.progressInteriors = '80';
    if (!d.recommendedInteriors) d.recommendedInteriors = '85';

    // SECTION 8: Remarks & Declaration
    if (!d.synthesisRemarks) {
      d.synthesisRemarks = '';
    }
    if (!d.reportDate) d.reportDate = d.valuationDate || formatReportDate(new Date());
    if (!d.reportPlace) d.reportPlace = 'Bhubaneswar';

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

  // Floor BUA total computation
  const totalActualBua = useMemo(() => {
    return sumDecimals([fields.buaGfAct, fields.buaFfAct, fields.buaSfAct, fields.buaTfAct]);
  }, [fields.buaGfAct, fields.buaFfAct, fields.buaSfAct, fields.buaTfAct]);

  // Table 22 Financial Valuation Engine Calculations
  const calculations = useMemo(() => {
    const landArea = parseSafeFloat(fields.landAreaSqft);
    const landRate = parseSafeFloat(fields.adoptedSalesRate);
    const landValue = multiplyExactDecimals(landArea, landRate);

    const bua100 = parseSafeFloat(fields.buaFar100);
    const rate100 = parseSafeFloat(fields.rateFar100);
    const val100 = multiplyExactDecimals(bua100, rate100);

    const buaStage = parseSafeFloat(fields.buaFarStage);
    const rateStage = parseSafeFloat(fields.rateFarStage);
    const valStage = multiplyExactDecimals(buaStage, rateStage);

    const valOthers = parseSafeFloat(fields.valOthers);
    const valElevation = parseSafeFloat(fields.valElevation);
    const valInteriors = parseSafeFloat(fields.valInteriors);

    const grossConstructionValue = sumDecimals([valStage, valOthers, valElevation, valInteriors]);
    const netConstructionValue = grossConstructionValue; // Less depreciation @ 0

    const presentValue = sumDecimals([landValue, netConstructionValue]);
    const forcedSaleValue = Math.round(presentValue * 0.8);
    const afterCompletionValue = sumDecimals([landValue, val100]);

    return {
      landArea,
      landRate,
      landValue,
      bua100,
      rate100,
      val100,
      buaStage,
      rateStage,
      valStage,
      grossConstructionValue,
      netConstructionValue,
      presentValue,
      forcedSaleValue,
      afterCompletionValue,
    };
  }, [
    fields.landAreaSqft,
    fields.adoptedSalesRate,
    fields.buaFar100,
    fields.rateFar100,
    fields.buaFarStage,
    fields.rateFarStage,
    fields.valOthers,
    fields.valElevation,
    fields.valInteriors,
  ]);

  // Sync stage cost when 100% cost or stage % changes
  const handleStagePercentChange = useCallback((pctVal: string) => {
    const sanitizedPct = sanitizePercentage(pctVal);
    const pctNum = parseSafeFloat(sanitizedPct);
    const cost100 = parseSafeFloat(fields.rateFar100);
    const newStageCost = cost100 > 0 && pctNum > 0 ? Math.round((cost100 * pctNum) / 100) : 0;
    setFields(prev => ({
      ...prev,
      stagePercentage: sanitizedPct,
      rateFarStage: newStageCost > 0 ? String(newStageCost) : prev.rateFarStage,
    }));
  }, [fields.rateFar100]);

  // PDF Preview Handler
  const handlePreviewPDF = useCallback(async () => {
    setPreviewing(true);
    try {
      const mergedFields = {
        ...fields,
        buaTotalAct: totalActualBua,
        calculatedLandValue: calculations.landValue,
        calculatedVal100: calculations.val100,
        calculatedValStage: calculations.valStage,
        calculatedPresentValue: calculations.presentValue,
        calculatedForcedSaleValue: calculations.forcedSaleValue,
        calculatedAfterCompletionValue: calculations.afterCompletionValue,
      };
      const renderer = new PDFUjjivanRenderer({
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
  }, [fields, projectCode, totalActualBua, calculations]);

  // PDF Download Handler
  const handleDownloadPDF = useCallback(async () => {
    try {
      const mergedFields = {
        ...fields,
        buaTotalAct: totalActualBua,
        calculatedLandValue: calculations.landValue,
        calculatedVal100: calculations.val100,
        calculatedValStage: calculations.valStage,
        calculatedPresentValue: calculations.presentValue,
        calculatedForcedSaleValue: calculations.forcedSaleValue,
        calculatedAfterCompletionValue: calculations.afterCompletionValue,
      };
      const renderer = new PDFUjjivanRenderer({
        ...mergedFields,
        projectCode,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Ujjivan_SFB_Report_${projectCode || 'Draft'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to download PDF:', err);
      alert('Error downloading PDF: ' + (err.message || 'Unknown error'));
    }
  }, [fields, projectCode, totalActualBua, calculations]);

  // Draft Save Handler
  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        ...fields,
        buaTotalAct: totalActualBua,
        calculatedPresentValue: calculations.presentValue,
        calculatedForcedSaleValue: calculations.forcedSaleValue,
        calculatedAfterCompletionValue: calculations.afterCompletionValue,
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
  }, [projectId, fields, totalActualBua, calculations]);

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
    if (!confirm('Are you sure you want to submit this Ujjivan Small Finance Bank report?')) return;
    try {
      setSubmitting(true);
      await saveReportDraft(projectId, {
        ...fields,
        buaTotalAct: totalActualBua,
        calculatedPresentValue: calculations.presentValue,
        calculatedForcedSaleValue: calculations.forcedSaleValue,
        calculatedAfterCompletionValue: calculations.afterCompletionValue,
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
            bankName="Ujjivan Small Finance Bank"
            subclass="Immovable Property Valuation Format"
            formatName="Technical Report on Immovable Property"
            clientType="organisation"
            category="Small Finance Banking"
            serviceType="Valuation Report Builder"
            subjectType="Immovable Property Valuation"
            onResetWizard={onResetWizard}
            earliestVisit={earliestVisit}
            projectCode={fields.clientId || projectCode}
            message={message}
          />

          {/* ═══════════════════════════════════════════════
              SECTION 1: GENERAL DETAILS
          ═══════════════════════════════════════════════ */}
          <Section title="General Details" id="ujjivan-sec-general" number={1}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Applicant Name">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.applicantName || ''}
                  onChange={e => handleFieldChange('applicantName', e.target.value)}
                />
              </Field>

              <Field label="Purpose of Valuation">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.purposeOfValuation || ''}
                  onChange={e => handleFieldChange('purposeOfValuation', e.target.value)}
                />
              </Field>

              <Field label="Name of Valuer">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.nameOfValuer || ''}
                  onChange={e => handleFieldChange('nameOfValuer', e.target.value)}
                />
              </Field>

              <Field label="Valuation Date">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.valuationDate || ''}
                  onChange={e => handleFieldChange('valuationDate', e.target.value)}
                />
              </Field>

              <Field label="Client ID">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.refNo || fields.clientId || projectCode || ''} disabled={true} readOnly={true} placeholder="SMA-YYYY/MM-NNNN"
                />
              </Field>

              <Field label="Case Type">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.caseType || ''}
                  onChange={e => handleFieldChange('caseType', e.target.value)}
                />
              </Field>

              <Field label="Contact Person & Number">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.contactPersonAndNumber || ''}
                  onChange={e => handleFieldChange('contactPersonAndNumber', e.target.value)}
                />
              </Field>

              <Field label="Date of Inspection">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.inspectionDate || ''}
                  onChange={e => handleFieldChange('inspectionDate', e.target.value)}
                />
              </Field>

              <Field label="Owner as per Document">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.ownerNameAsPerDoc || ''}
                  onChange={e => handleFieldChange('ownerNameAsPerDoc', e.target.value)}
                />
              </Field>

              <Field label="Provided Documents for Valuation">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.providedDocuments || ''}
                  onChange={e => handleFieldChange('providedDocuments', e.target.value)}
                />
              </Field>

              <Field label="Site No. / Door No.">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.siteNoDoorNo || ''}
                  onChange={e => handleFieldChange('siteNoDoorNo', e.target.value)}
                />
              </Field>

              <Field label="Property Demarcated?">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.isDemarcated || 'Yes'}
                  onChange={e => handleFieldChange('isDemarcated', e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Place">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.place || ''}
                  onChange={e => handleFieldChange('place', e.target.value)}
                />
              </Field>

              <Field label="Nearest Landmark">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.nearestLandmark || ''}
                  onChange={e => handleFieldChange('nearestLandmark', e.target.value)}
                />
              </Field>

              <Field label="Distance From City Centre / Branch">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.distanceCityCentre || ''}
                  onChange={e => handleFieldChange('distanceCityCentre', e.target.value)}
                />
              </Field>

              <Field label="Road Name / Width for Access">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.accessRoadName || ''}
                  onChange={e => handleFieldChange('accessRoadName', e.target.value)}
                />
              </Field>

              <Field label="Type of Property">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.typeOfProperty || 'Residential'}
                  onChange={e => handleFieldChange('typeOfProperty', e.target.value)}
                >
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed">Mixed</option>
                </select>
              </Field>

              <Field label="Jurisdiction">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.jurisdiction || ''}
                  onChange={e => handleFieldChange('jurisdiction', e.target.value)}
                />
              </Field>

              <Field label="Shape of the Plot">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.shapeOfPlot || ''}
                  onChange={e => handleFieldChange('shapeOfPlot', e.target.value)}
                />
              </Field>

              <Field label="Zonal Classification">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.zonalClassification || ''}
                  onChange={e => handleFieldChange('zonalClassification', e.target.value)}
                />
              </Field>
            </div>

            {/* Address comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Field label="Property Address (As per Document)">
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.propertyAddressDoc || ''}
                  onChange={e => handleFieldChange('propertyAddressDoc', e.target.value)}
                />
              </Field>

              <Field label="Property Address (Actual at Site)">
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.propertyAddressActual || ''}
                  onChange={e => handleFieldChange('propertyAddressActual', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 2: LAYOUT & AMENITIES
          ═══════════════════════════════════════════════ */}
          <Section title="Layout & Amenities" id="ujjivan-sec-layout" number={2}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Water Facility">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.waterFacility || 'Yes'}
                  onChange={e => handleFieldChange('waterFacility', e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Underground Drainage">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.undergroundDrainage || 'No'}
                  onChange={e => handleFieldChange('undergroundDrainage', e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>

              <Field label="Type of Road">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.typeOfRoad || ''}
                  onChange={e => handleFieldChange('typeOfRoad', e.target.value)}
                />
              </Field>

              <Field label="Electricity">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.electricity || 'Yes'}
                  onChange={e => handleFieldChange('electricity', e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              <Field label="Class of Locality">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.classOfLocality || 'Middle Class'}
                  onChange={e => handleFieldChange('classOfLocality', e.target.value)}
                >
                  <option value="Middle Class">Middle Class</option>
                  <option value="Upper Class">Upper Class</option>
                  <option value="Lower Middle Class">Lower Middle Class</option>
                </select>
              </Field>

              <Field label="Marketability">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.marketability || 'GOOD'}
                  onChange={e => handleFieldChange('marketability', e.target.value)}
                >
                  <option value="EXCELLENT">EXCELLENT</option>
                  <option value="GOOD">GOOD</option>
                  <option value="AVERAGE">AVERAGE</option>
                  <option value="POOR">POOR</option>
                </select>
              </Field>

              <Field label="Surrounding Locality">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.surroundingLocality || ''}
                  onChange={e => handleFieldChange('surroundingLocality', e.target.value)}
                />
              </Field>

              <Field label="Surrounding Habitation (200m)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.surroundingHabitation || ''}
                  onChange={e => handleFieldChange('surroundingHabitation', e.target.value)}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Nearby Civic Amenities">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.nearbyCivicAmenities || ''}
                    onChange={e => handleFieldChange('nearbyCivicAmenities', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 3: SCHEDULE & DIMENSIONS
          ═══════════════════════════════════════════════ */}
          <Section title="Schedule & Dimensions" id="ujjivan-sec-schedule" number={3}>
            <div className="text-sm font-semibold text-slate-300 mb-2">Boundaries Comparison</div>
            <div className="overflow-x-auto border border-slate-800 rounded-xl mb-6">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-slate-300 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-28">Direction</th>
                    <th className="p-3">As per Document</th>
                    <th className="p-3">As per Actual</th>
                    <th className="p-3">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-3 font-medium text-slate-300">East By</td>
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
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundRemarksEast || ''}
                        onChange={e => handleFieldChange('boundRemarksEast', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">West By</td>
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
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundRemarksWest || ''}
                        onChange={e => handleFieldChange('boundRemarksWest', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">North By</td>
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
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundRemarksNorth || ''}
                        onChange={e => handleFieldChange('boundRemarksNorth', e.target.value)}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">South By</td>
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
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.boundRemarksSouth || ''}
                        onChange={e => handleFieldChange('boundRemarksSouth', e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-sm font-semibold text-slate-300 mb-2">Amin Sketch & Site Dimensions</div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Amin Sketch (E-W)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.dimAminEW || ''}
                  onChange={e => handleFieldChange('dimAminEW', sanitizeDimensionWithNA(e.target.value))}
                />
              </Field>

              <Field label="Amin Sketch (N-S)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.dimAminNS || ''}
                  onChange={e => handleFieldChange('dimAminNS', sanitizeDimensionWithNA(e.target.value))}
                />
              </Field>

              <Field label="Actual Site (E-W)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.dimActEW || ''}
                  onChange={e => handleFieldChange('dimActEW', sanitizeDimensionWithNA(e.target.value))}
                />
              </Field>

              <Field label="Actual Site (N-S)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.dimActNS || ''}
                  onChange={e => handleFieldChange('dimActNS', sanitizeDimensionWithNA(e.target.value))}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 4: TECHNICAL DETAILS
          ═══════════════════════════════════════════════ */}
          <Section title="Technical Details" id="ujjivan-sec-tech" number={4}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="Type of Construction">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.typeOfConstruction || ''}
                  onChange={e => handleFieldChange('typeOfConstruction', e.target.value)}
                />
              </Field>

              <Field label="Quality of Construction">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.qualityOfConstruction || 'Average'}
                  onChange={e => handleFieldChange('qualityOfConstruction', e.target.value)}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>

              <Field label="Electrical Fittings">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.electricalFittings || ''}
                  onChange={e => handleFieldChange('electricalFittings', e.target.value)}
                />
              </Field>

              <Field label="Sanitary Fittings">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.sanitaryFittings || ''}
                  onChange={e => handleFieldChange('sanitaryFittings', e.target.value)}
                />
              </Field>

              <Field label="Lifts Available?">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.lifts || 'No'}
                  onChange={e => handleFieldChange('lifts', e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>

              <Field label="Compound Wall">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.compoundWall || 'No'}
                  onChange={e => handleFieldChange('compoundWall', e.target.value)}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>

              <Field label="Super Structure">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.superStructure || ''}
                  onChange={e => handleFieldChange('superStructure', e.target.value)}
                />
              </Field>

              <Field label="Roof Type">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.roofType || ''}
                  onChange={e => handleFieldChange('roofType', e.target.value)}
                />
              </Field>

              <Field label="Doors & Windows">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.doorsWindows || ''}
                  onChange={e => handleFieldChange('doorsWindows', e.target.value)}
                />
              </Field>

              <Field label="Flooring">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.flooring || ''}
                  onChange={e => handleFieldChange('flooring', e.target.value)}
                />
              </Field>

              <Field label="Year of Construction">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.yearOfConstruction || ''}
                  onChange={e => handleFieldChange('yearOfConstruction', sanitizePositiveInt(e.target.value, 4))}
                />
              </Field>

              <Field label="Age of Building (Years)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.ageOfBuilding || ''}
                  onChange={e => handleFieldChange('ageOfBuilding', sanitizePositiveInt(e.target.value, 3))}
                />
              </Field>

              <Field label="Future Life (RCC Structure)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.futureLifeRcc || ''}
                  onChange={e => handleFieldChange('futureLifeRcc', sanitizePositiveInt(e.target.value, 3))}
                />
              </Field>

              <Field label="Future Life (AC Sheet)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.futureLifeAcSheet || ''}
                  onChange={e => handleFieldChange('futureLifeAcSheet', sanitizePositiveInt(e.target.value, 3))}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 5: STATUTORY & FLOOR AREAS
          ═══════════════════════════════════════════════ */}
          <Section title="Statutory & Floor Areas" id="ujjivan-sec-statutory" number={5}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="Site Area as per Schedule">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.siteAreaSchedule || ''}
                  onChange={e => handleFieldChange('siteAreaSchedule', e.target.value)}
                />
              </Field>

              <Field label="Site Area as per Plan">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.siteAreaPlan || ''}
                  onChange={e => handleFieldChange('siteAreaPlan', e.target.value)}
                />
              </Field>

              <Field label="Site Area as per Actual">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.siteAreaActual || ''}
                  onChange={e => handleFieldChange('siteAreaActual', e.target.value)}
                />
              </Field>

              <Field label="Statutory Approval Details">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.statutoryApprovalDetails || ''}
                  onChange={e => handleFieldChange('statutoryApprovalDetails', e.target.value)}
                />
              </Field>

              <Field label="Approval Number & Date">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.approvalNumberAndDate || ''}
                  onChange={e => handleFieldChange('approvalNumberAndDate', e.target.value)}
                />
              </Field>

              <Field label="F.S.I / FAR Permitted">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.fsiFarPermitted || ''}
                  onChange={e => handleFieldChange('fsiFarPermitted', e.target.value)}
                />
              </Field>

              <Field label="Permitted Use">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.permittedUse || ''}
                  onChange={e => handleFieldChange('permittedUse', e.target.value)}
                />
              </Field>

              <Field label="Actual Use">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.actualUse || ''}
                  onChange={e => handleFieldChange('actualUse', e.target.value)}
                />
              </Field>

              <Field label="Approved No. of Floors">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.approvedFloors || ''}
                  onChange={e => handleFieldChange('approvedFloors', e.target.value)}
                />
              </Field>

              <Field label="As Built No. of Floors">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.asBuiltFloors || ''}
                  onChange={e => handleFieldChange('asBuiltFloors', e.target.value)}
                />
              </Field>

              <Field label="Adheres to NBC / BIS Code?">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.adheresToNbcBis || 'Yes'}
                  onChange={e => handleFieldChange('adheresToNbcBis', e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>

              <Field label="Adheres to NDMA Guidelines?">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.adheresToNdma || 'Yes'}
                  onChange={e => handleFieldChange('adheresToNdma', e.target.value)}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
            </div>

            {/* Floorwise BUA Table */}
            <div className="mt-6 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800">
                Floorwise Built-up Area Breakdown (Sft)
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/40 text-slate-300 font-medium border-b border-slate-800">
                  <tr>
                    <th className="p-3">Floor Level</th>
                    <th className="p-3">Permissible BUA (Sft)</th>
                    <th className="p-3">Actual Gross BUA (Sft)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-3 font-medium text-slate-300">Ground Floor</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaGfPerm || ''}
                        onChange={e => handleFieldChange('buaGfPerm', e.target.value)}
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
                        value={fields.buaFfPerm || ''}
                        onChange={e => handleFieldChange('buaFfPerm', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaFfAct || ''}
                        onChange={e => handleFieldChange('buaFfAct', sanitizePositiveFloat(e.target.value))}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">Second Floor</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaSfPerm || ''}
                        onChange={e => handleFieldChange('buaSfPerm', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaSfAct || ''}
                        onChange={e => handleFieldChange('buaSfAct', sanitizePositiveFloat(e.target.value))}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">Third Floor</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaTfPerm || ''}
                        onChange={e => handleFieldChange('buaTfPerm', e.target.value)}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        inputMode="decimal"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.buaTfAct || ''}
                        onChange={e => handleFieldChange('buaTfAct', sanitizePositiveFloat(e.target.value))}
                      />
                    </td>
                  </tr>
                  <tr className="bg-slate-900/60 font-semibold text-emerald-400">
                    <td className="p-3">Total Built-up Area</td>
                    <td className="p-3">NA</td>
                    <td className="p-3">{totalActualBua.toLocaleString('en-IN')} Sft</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Field label="Carpet Area (Sft)">
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.carpetArea || ''}
                  onChange={e => handleFieldChange('carpetArea', sanitizePositiveFloat(e.target.value))}
                />
              </Field>

              <Field label="Adherence to Sanction Plan">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.adherenceSanctionPlan || ''}
                  onChange={e => handleFieldChange('adherenceSanctionPlan', e.target.value)}
                />
              </Field>

              <Field label="Demolition Risk">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.riskOfDemolition || 'LOW'}
                  onChange={e => handleFieldChange('riskOfDemolition', e.target.value)}
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </Field>

              <Field label="Property Tenure">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.propertyTenure || ''}
                  onChange={e => handleFieldChange('propertyTenure', e.target.value)}
                />
              </Field>

              <Field label="Internal Composition">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.internalComposition || ''}
                  onChange={e => handleFieldChange('internalComposition', e.target.value)}
                />
              </Field>

              <Field label="Present Occupancy">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.presentOccupancy || ''}
                  onChange={e => handleFieldChange('presentOccupancy', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 6: VALUATION ENGINE (TABLE 22)
          ═══════════════════════════════════════════════ */}
          <Section title="Valuation Engine" id="ujjivan-sec-valuation" number={6}>
            {/* Live Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-yellow-950/60 to-slate-900 border border-yellow-500/40 shadow-lg">
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wider block">
                  Present Value of Property (Land + Current Stage)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.presentValue)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.presentValue)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/60 to-slate-900 border border-sky-500/40 shadow-lg">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                  Forced Sale Value (80% of Present Value)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.forcedSaleValue)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.forcedSaleValue)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 shadow-lg">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  After Completion Value (100% Completion)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.afterCompletionValue)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.afterCompletionValue)}
                </span>
              </div>
            </div>

            {/* Vicinity Market Rates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Field label="Vicinity Market Rate Min (₹/Sft)">
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.vicinityMarketRateMin || ''}
                  onChange={e => handleFieldChange('vicinityMarketRateMin', sanitizePositiveFloat(e.target.value))}
                />
              </Field>

              <Field label="Vicinity Market Rate Max (₹/Sft)">
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.vicinityMarketRateMax || ''}
                  onChange={e => handleFieldChange('vicinityMarketRateMax', sanitizePositiveFloat(e.target.value))}
                />
              </Field>

              <Field label="Sales / Adopted Land Rate (₹/Sft)">
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.adoptedSalesRate || ''}
                  onChange={e => handleFieldChange('adoptedSalesRate', sanitizePositiveFloat(e.target.value))}
                />
              </Field>
            </div>

            {/* Table 22 Inputs & Computations */}
            <div className="border border-slate-800 rounded-xl p-5 bg-slate-900/40 space-y-6">
              <div className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
                Table 22: Valuation Breakdown (Document Area Considered)
              </div>

              {/* Land Component */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Land Area Considered (Sft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.landAreaSqft || ''}
                    onChange={e => handleFieldChange('landAreaSqft', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="Land Rate (₹/Sft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.adoptedSalesRate || ''}
                    onChange={e => handleFieldChange('adoptedSalesRate', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="a. Calculated Land Value (₹)">
                  <input
                    type="text"
                    disabled
                    className={`${inputCls} bg-slate-800/80 font-bold text-yellow-400`}
                    value={`₹ ${formatIndianCurrency(calculations.landValue)}`}
                  />
                </Field>
              </div>

              {/* 100% Construction Component */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Measured BUA FAR 1.5 (100% Completion) (Sft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.buaFar100 || ''}
                    onChange={e => handleFieldChange('buaFar100', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="100% Construction Rate (₹/Sft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.rateFar100 || ''}
                    onChange={e => handleFieldChange('rateFar100', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="b. 100% Construction Value (₹)">
                  <input
                    type="text"
                    disabled
                    className={`${inputCls} bg-slate-800/80 font-bold text-emerald-400`}
                    value={`₹ ${formatIndianCurrency(calculations.val100)}`}
                  />
                </Field>
              </div>

              {/* Stage Construction Component */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Measured BUA FAR 1.5 (Stage) (Sft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.buaFarStage || ''}
                    onChange={e => handleFieldChange('buaFarStage', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="Stage Completion (%)">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.stagePercentage || ''}
                    onChange={e => handleStagePercentChange(e.target.value)}
                    placeholder="e.g. 80%"
                  />
                </Field>

                <Field label="Stage Construction Rate (₹/Sft)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.rateFarStage || ''}
                    onChange={e => handleFieldChange('rateFarStage', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="c. Stage Construction Value (₹)">
                  <input
                    type="text"
                    disabled
                    className={`${inputCls} bg-slate-800/80 font-bold text-sky-400`}
                    value={`₹ ${formatIndianCurrency(calculations.valStage)}`}
                  />
                </Field>
              </div>

              {/* Additional Components */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="e. Others (Sump, Parapet, OHT) (₹)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.valOthers || ''}
                    onChange={e => handleFieldChange('valOthers', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="f. Elevation Treatment (₹)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.valElevation || ''}
                    onChange={e => handleFieldChange('valElevation', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>

                <Field label="g. Interiors (₹)">
                  <input
                    type="text"
                    inputMode="decimal"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.valInteriors || ''}
                    onChange={e => handleFieldChange('valInteriors', sanitizePositiveFloat(e.target.value))}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 7: WORK STATUS & RECOMMENDATIONS
          ═══════════════════════════════════════════════ */}
          <Section title="Work Status & Recommendations" id="ujjivan-sec-workstatus" number={7}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Geographical Latitude">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.geoTagLatitude || ''}
                  onChange={e => handleFieldChange('geoTagLatitude', e.target.value)}
                  placeholder="e.g. 19.804528"
                />
              </Field>

              <Field label="Geographical Longitude">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.geoTagLongitude || ''}
                  onChange={e => handleFieldChange('geoTagLongitude', e.target.value)}
                  placeholder="e.g. 85.822250"
                />
              </Field>
            </div>

            <div className="mt-4">
              <Field label="Description of Present Work Status">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.workStatusDescription || ''}
                  onChange={e => handleFieldChange('workStatusDescription', e.target.value)}
                  placeholder="e.g. G+3=plastering work completed."
                />
              </Field>
            </div>

            {/* Recommendation Table */}
            <div className="mt-6 border border-slate-800 rounded-xl overflow-hidden">
              <div className="bg-slate-900/80 px-4 py-3 text-sm font-semibold text-slate-200 border-b border-slate-800">
                Present Status of Work & Recommendation
              </div>
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/40 text-slate-300 font-medium border-b border-slate-800">
                  <tr>
                    <th className="p-3">Work Component</th>
                    <th className="p-3">Progress (%)</th>
                    <th className="p-3">Recommended (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="p-3 font-medium text-slate-300">Civil Work</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.progressCivil || ''}
                        onChange={e => handleFieldChange('progressCivil', sanitizePercentage(e.target.value))}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.recommendedCivil || ''}
                        onChange={e => handleFieldChange('recommendedCivil', sanitizePercentage(e.target.value))}
                      />
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3 font-medium text-slate-300">Interiors</td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.progressInteriors || ''}
                        onChange={e => handleFieldChange('progressInteriors', sanitizePercentage(e.target.value))}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="text"
                        disabled={isReadOnly}
                        className={inputCls}
                        value={fields.recommendedInteriors || ''}
                        onChange={e => handleFieldChange('recommendedInteriors', sanitizePercentage(e.target.value))}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 8: REMARKS & DECLARATION
          ═══════════════════════════════════════════════ */}
          <Section title="Remarks & Declaration" id="ujjivan-sec-remarks" number={8}>
            <Field label="Valuation Synthesis Remarks / Comments">
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
            title="Documents"
            sectionId="ujjivan-sec-docs"
            sectionNumber={9}
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
            sectionId="ujjivan-sec-maps"
            sectionNumber={10}
            locationMapImages={fields.locationMapImages || []}
            mouzaMapImages={fields.mouzaMapImages || []}
            sketchMapImages={fields.sketchMapImages || []}
            cadastralMapImages={fields.cadastralMapImages || []}
            bdaMapImages={fields.bdaMapImages || []}
            latitude={fields.geoTagLatitude}
            longitude={fields.geoTagLongitude}
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
            sectionId="ujjivan-sec-photos"
            sectionNumber={11}
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
