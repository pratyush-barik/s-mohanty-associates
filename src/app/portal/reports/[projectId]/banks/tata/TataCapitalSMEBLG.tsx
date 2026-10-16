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
import { PDFTataCapitalSMEBLGRenderer } from '@/lib/banks/pdf-tata-capital-sme-blg-renderer';

export const TATA_CAPITAL_SME_BLG_CONFIG: BankConfig = {
  bankId: 'TATA CAPITAL LTD',
  subTemplateId: 'SME-BLG',
  displayName: 'Tata Capital Ltd — SME-BLG',
  defaultValues: {
    purpose: 'SME / Business Loan Group Valuation',
  },
};

export interface TataCapitalSMEBLGProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function TataCapitalSMEBLG({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: TataCapitalSMEBLGProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';

  // 1-to-1 NavItems matching form sections with ZERO numbers
  const navSections: NavItem[] = [
    { id: 'tata-sec-general', title: 'General Details' },
    { id: 'tata-sec-structure', title: 'Structure & Boundaries' },
    { id: 'tata-sec-specs', title: 'Property Specifications' },
    { id: 'tata-sec-assumptions', title: 'Assumptions & Basis' },
    { id: 'tata-sec-valuation', title: 'Valuation & Calculations' },
    { id: 'tata-sec-remarks', title: 'Remarks & Declaration' },
    { id: 'tata-sec-docs', title: 'Property Documents' },
    { id: 'tata-sec-maps', title: 'Location Maps' },
    { id: 'tata-sec-photos', title: 'Property Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initializing state with rich defaults and prefill
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // PART A: General Details
    if (!d.purposeOfValuation) d.purposeOfValuation = 'TO ASSESS THE FMV OF THE PROPERTY';
    if (!d.inspectionDate) d.inspectionDate = earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date().toISOString());
    if (!d.valuerCode) d.valuerCode = 'SMA/11-25/01';
    if (!d.suburbName) d.suburbName = 'NA';
    if (!d.clusterId) d.clusterId = 'Not Provided';
    if (!d.customerName) d.customerName = p.applicantName || p.contactName || 'Kapilash Bizcorps LLP';
    if (!d.projectName) d.projectName = 'NA';
    if (!d.ownerName) d.ownerName = p.contactName || p.applicantName || 'Rina Poddar';
    if (!d.flatFloorNo) d.flatFloorNo = 'NA';
    if (!d.buildingName) d.buildingName = 'NA';
    if (!d.propertyDescription) {
      d.propertyDescription = p.propertyAddress || 'Khata No-325/2544, 325/2916 & 325/3004, Plot No-702/2830, 703/3003/5671 & 703/3004, Mouza-Saptasajya, PS-Dhenkanal Sadar, Tahasil-Dhenkanal, Dist-Dhenkanal, Odisha, Pin-759013.';
    }
    if (!d.locationStreetWard) d.locationStreetWard = p.nearestLandmark || 'Saptasajya';
    if (!d.sNoPlotNoCtsNo) d.sNoPlotNoCtsNo = 'Plot No-702/2830, 703/3003/5671 & 703/3004';
    if (!d.classificationOfLocality) d.classificationOfLocality = 'Middle Class';
    if (!d.proximityCivicAmenities) d.proximityCivicAmenities = '1-2Kms';
    if (!d.nearestRailwayStation) d.nearestRailwayStation = '5.8-Kms from Dhenkanal Railway station';
    if (!d.modesOfTransport) d.modesOfTransport = 'By Road';
    if (!d.roadAccessName) d.roadAccessName = 'Road';
    if (!d.landAreaOtherDetails) d.landAreaOtherDetails = '0.610 Decs (26572 sqft)';
    if (!d.landTenure) d.landTenure = 'Freehold';
    if (!d.approvalDrawings) {
      d.approvalDrawings = 'Plan has been approved by Dhenkanal municipality vide letter no-BP/DKN/022118, DKL, dated-19/09/2025 for single storied residential building.';
    }
    if (!d.cooperativeSocietyDetails) d.cooperativeSocietyDetails = 'NA';
    if (!d.identifiedBy) d.identifiedBy = 'Mr. Manoj Das';
    if (!d.visitedBy) d.visitedBy = earliestVisit?.engineerName || p.firstFieldAgentName || 'Mr. Manoj Das';

    // PART B: Structure & Boundaries
    if (!d.yearOfConstruction) d.yearOfConstruction = 'New Constructed';
    if (!d.ageAndLife) d.ageAndLife = 'New / Anticipated Life: 60-Years';
    if (!d.presentCondition) d.presentCondition = 'Good / NA';
    if (!d.typeOfConstruction) d.typeOfConstruction = 'RCC Roofing';

    if (!d.boundarySketchNorth) d.boundarySketchNorth = 'Plot No-703(P)';
    if (!d.boundarySketchEast) d.boundarySketchEast = 'Plot No-702(P)';
    if (!d.boundarySketchSouth) d.boundarySketchSouth = 'Plot No-704';
    if (!d.boundarySketchWest) d.boundarySketchWest = 'Road';

    if (!d.boundarySiteNorth) d.boundarySiteNorth = d.boundarySketchNorth || 'Plot No-703(P)';
    if (!d.boundarySiteEast) d.boundarySiteEast = d.boundarySketchEast || 'Plot No-702(P)';
    if (!d.boundarySiteSouth) d.boundarySiteSouth = d.boundarySketchSouth || 'Plot No-704';
    if (!d.boundarySiteWest) d.boundarySiteWest = d.boundarySketchWest || 'Road';

    // PART C: Property Specifications
    if (!d.estimatedDateCompletion) d.estimatedDateCompletion = 'NA';
    if (!d.permittedUse) d.permittedUse = 'NA';
    if (!d.actualUse) d.actualUse = 'Commercial';
    if (!d.noOfFloors) d.noOfFloors = '1 (GF)';
    if (!d.noOfLifts) d.noOfLifts = 'Nil';
    if (!d.tanksAndPumps) d.tanksAndPumps = 'NA';
    if (!d.flooringOpenSpaces) d.flooringOpenSpaces = 'NA';
    if (!d.compoundWallGates) d.compoundWallGates = 'Yes';
    if (!d.elevation) d.elevation = 'Good';
    if (!d.amenities) d.amenities = 'NA';
    if (!d.commentsOnSpecification) d.commentsOnSpecification = 'NA';

    // Flat / Unit Checklist (Points 1 - 18)
    if (!d.unitFloorsFlats) d.unitFloorsFlats = '1 / NA';
    if (!d.unitRooms) d.unitRooms = 'NA';
    if (!d.unitBalconies) d.unitBalconies = 'NA';
    if (!d.unitWallsPlaster) d.unitWallsPlaster = 'NA';
    if (!d.unitDoorsWindows) d.unitDoorsWindows = 'NA';
    if (!d.unitFlooring) d.unitFlooring = 'NA';
    if (!d.unitSanitaryToilets) d.unitSanitaryToilets = 'NA';
    if (!d.unitKitchenSink) d.unitKitchenSink = 'NA';
    if (!d.unitPlumbing) d.unitPlumbing = 'NA';
    if (!d.unitElectrical) d.unitElectrical = 'NA';
    if (!d.unitActualArea) d.unitActualArea = '4743 sqft';
    if (!d.unitPermittedArea) d.unitPermittedArea = '4032 sqft';
    if (!d.unitSaleAgreementArea) d.unitSaleAgreementArea = 'NA';
    if (!d.unitAdherencePlan) d.unitAdherencePlan = 'Adhered to plan';
    if (!d.unitDeviationObserved) d.unitDeviationObserved = 'Nil';
    if (!d.unitDemolitionRisk) d.unitDemolitionRisk = 'Low';
    if (!d.unitOccupiedBy) d.unitOccupiedBy = 'Occupied by customer';
    if (!d.unitSelfOccupiedSince) d.unitSelfOccupiedSince = '2025';

    // PART D: Assumptions & Basis
    if (!d.drawingsAndApprovals) {
      d.drawingsAndApprovals = 'Plan has been approved by Dhenkanal municipality vide letter no-BP/DKN/022118, DKL, dated-19/09/2025 for single storied residential building.';
    }
    if (!d.areaConsideredValuation) {
      d.areaConsideredValuation = '0.610 Decs or 26572 sqft of Land & 4032 sqft of BUA has been considered for valuation.';
    }
    if (!d.ageFutureLife) d.ageFutureLife = 'Age of building is 0-Years & Future life is 60-Years.';
    if (!d.presentConditionBasis) d.presentConditionBasis = 'Good';
    if (!d.commentsOnSpecificationBasis) d.commentsOnSpecificationBasis = 'RCC Roofing';
    if (!d.marketRatesVicinity) {
      d.marketRatesVicinity = 'Local inquiries revealed that the market rate of land in this vicinity is ranging from Rs.2800/- to Rs.3200/- per sqft depending on the location, size and frontage.';
    }

    // PART E: Land & Building Valuation Engine
    if (!d.landAreaSqft) d.landAreaSqft = 26572;
    if (!d.govtApprovedLandRate) d.govtApprovedLandRate = 298;
    if (!d.govtApprovedLandRateText) d.govtApprovedLandRateText = 'Rs.298/- per sqfft of land';
    if (!d.recommendedLandRate) d.recommendedLandRate = 3000;
    if (!d.basisRecommendation) {
      d.basisRecommendation = 'The site is located in Saptasajya, having good access road and civic amenities nearby. Considering the location, accessibility and prevailing market trends, the rate of Rs.3000/- per sqft is recommended.';
    }
    if (!d.approvedBuaSqft) d.approvedBuaSqft = 4032;
    if (!d.constructionCostPerSqft) d.constructionCostPerSqft = 2500;
    if (!d.actualBuaSqft) d.actualBuaSqft = 4743;
    if (!d.deviationDetails) d.deviationDetails = '711 sqft (Constructed beyond approved plan)';
    if (!d.constructionValueConsideredText) d.constructionValueConsideredText = 'Approved BUA only (Rs. 10,080,000/-)';

    // Optional Flat Valuation defaults
    if (!d.flatFmvPerSqft) d.flatFmvPerSqft = 'NA';
    if (!d.flatReplacementCost) d.flatReplacementCost = 'NA';
    if (!d.flatDepreciatedValue) d.flatDepreciatedValue = 'NA';
    if (!d.flatLifeAndValidity) d.flatLifeAndValidity = 'NA';
    if (!d.flatRepairDeductions) d.flatRepairDeductions = 'NA';
    if (!d.flatValuationTotal) d.flatValuationTotal = 'NA';
    if (!d.flatForcedSaleValue) d.flatForcedSaleValue = 'NA';
    if (!d.flatInsuranceValue) d.flatInsuranceValue = 'NA';
    if (!d.flatAdditionalComments) d.flatAdditionalComments = 'NA';

    // Remarks & Declaration
    if (!d.synthesisRemarks) {
      d.synthesisRemarks = 'Subject property is a freehold land with newly constructed RCC building situated at Mouza-Saptasajya, Dist-Dhenkanal. The property has proper access from the road and basic civic amenities are available. Valuation is assessed based on the approved plan, physical inspection and prevailing local market rates. Land value is assessed at Rs.3000/- per sqft and approved building BUA of 4032 sqft at Rs.2500/- per sqft.';
    }
    if (!d.reportDate) d.reportDate = d.inspectionDate || '03-11-2025';
    if (!d.reportPlace) d.reportPlace = 'Bhubaneswar';

    return d;
  });

  // UI status states
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<string | false>(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);

  // Field change helper
  const handleFieldChange = useCallback((field: string, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
  }, []);

  // Sync Site Boundaries with Sketch Map
  const handleSyncBoundaries = useCallback(() => {
    setFields(prev => ({
      ...prev,
      boundarySiteNorth: prev.boundarySketchNorth || '',
      boundarySiteEast: prev.boundarySketchEast || '',
      boundarySiteSouth: prev.boundarySketchSouth || '',
      boundarySiteWest: prev.boundarySketchWest || '',
    }));
  }, []);

  // Auto-calculated values for Part E (Land & Building)
  const calculations = useMemo(() => {
    const landArea = parseFloat(String(fields.landAreaSqft || 0).replace(/,/g, '')) || 0;
    const landRate = parseFloat(String(fields.recommendedLandRate || 0).replace(/,/g, '')) || 0;
    const landValueA = landArea * landRate;

    const approvedBua = parseFloat(String(fields.approvedBuaSqft || 0).replace(/,/g, '')) || 0;
    const constrRate = parseFloat(String(fields.constructionCostPerSqft || 0).replace(/,/g, '')) || 0;
    const totalConstructionValueB = approvedBua * constrRate;

    const totalMarketValue = landValueA + totalConstructionValueB;
    const forcedSaleValue = Math.round(totalMarketValue * 0.8);
    const insuranceValue = Math.round(totalConstructionValueB * 0.85);

    return {
      landArea,
      landRate,
      landValueA,
      approvedBua,
      constrRate,
      totalConstructionValueB,
      totalMarketValue,
      forcedSaleValue,
      insuranceValue,
    };
  }, [
    fields.landAreaSqft,
    fields.recommendedLandRate,
    fields.approvedBuaSqft,
    fields.constructionCostPerSqft,
  ]);

  // Synchronize calculated values into fields before save/export
  const currentMergedFields = useMemo(() => {
    return {
      ...fields,
      landValueA: calculations.landValueA,
      totalConstructionValueB: calculations.totalConstructionValueB,
      totalMarketValue: calculations.totalMarketValue,
      forcedSaleValue: calculations.forcedSaleValue,
      insuranceValue: calculations.insuranceValue,
    };
  }, [fields, calculations]);

  // Document and Photo Upload Handlers
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

  // Actions
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setAutoSaveStatus('saving');
      await saveReportDraft(projectId, {
        custom_fields: currentMergedFields,
        valuation_amount: calculations.totalMarketValue || 0,
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
    if (!confirm('Are you sure you want to submit this Tata Capital SME-BLG report?')) return;
    try {
      setSubmitting(true);
      await saveReportDraft(projectId, {
        custom_fields: currentMergedFields,
        valuation_amount: calculations.totalMarketValue || 0,
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
      const renderer = new PDFTataCapitalSMEBLGRenderer({
        ...currentMergedFields,
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
      const renderer = new PDFTataCapitalSMEBLGRenderer({
        ...currentMergedFields,
        projectCode,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tata_Capital_SME_BLG_Valuation_${projectCode || 'Report'}.pdf`;
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
      {/* ── Active Configuration Banner (Zero hallucination standard, exact chain) ── */}
      <ActiveConfigBanner
        clientType="organisation"
        category="Bank & FIS"
        bankName="TATA CAPITAL LTD"
        subclass="SME-BLG"
        onResetWizard={onResetWizard}
        sticky={false}
      />

      {earliestVisit && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EarliestFieldVisitBadge fieldVisit={earliestVisit} />
        </div>
      )}

      {/* Main Grid: Form Left, Floating Navigator Right */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 w-full space-y-8 min-w-0">

          {/* ═══════════════════════════════════════════════
              SECTION 1: GENERAL DETAILS (PART A)
          ═══════════════════════════════════════════════ */}
          <Section title="General Details" id="tata-sec-general">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="1. Purpose of valuation">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.purposeOfValuation || ''}
                  onChange={e => handleFieldChange('purposeOfValuation', e.target.value)}
                />
              </Field>

              <Field label="2. Date of inspection and valuation">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.inspectionDate || ''}
                  onChange={e => handleFieldChange('inspectionDate', e.target.value)}
                />
              </Field>

              <Field label="3. Valuer code">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.valuerCode || ''}
                  onChange={e => handleFieldChange('valuerCode', e.target.value)}
                />
              </Field>

              <Field label="4. Suburb name">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.suburbName || ''}
                  onChange={e => handleFieldChange('suburbName', e.target.value)}
                />
              </Field>

              <Field label="5. Cluster id">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.clusterId || ''}
                  onChange={e => handleFieldChange('clusterId', e.target.value)}
                />
              </Field>

              <Field label="6. Customer name">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.customerName || ''}
                  onChange={e => handleFieldChange('customerName', e.target.value)}
                />
              </Field>

              <Field label="7. Project name (if any)">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.projectName || ''}
                  onChange={e => handleFieldChange('projectName', e.target.value)}
                />
              </Field>

              <Field label="8. Name of the owners of property">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.ownerName || ''}
                  onChange={e => handleFieldChange('ownerName', e.target.value)}
                />
              </Field>

              <Field label="9. Flat & Floor No">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.flatFloorNo || ''}
                  onChange={e => handleFieldChange('flatFloorNo', e.target.value)}
                />
              </Field>

              <Field label="10. Name of the building">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.buildingName || ''}
                  onChange={e => handleFieldChange('buildingName', e.target.value)}
                />
              </Field>

              <Field label="12. Location, street, ward no">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.locationStreetWard || ''}
                  onChange={e => handleFieldChange('locationStreetWard', e.target.value)}
                />
              </Field>

              <Field label="13. S. No., plot no. and C.T.S. No.">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.sNoPlotNoCtsNo || ''}
                  onChange={e => handleFieldChange('sNoPlotNoCtsNo', e.target.value)}
                />
              </Field>

              <Field label="14. Classification of locality">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.classificationOfLocality || 'Middle Class'}
                  onChange={e => handleFieldChange('classificationOfLocality', e.target.value)}
                >
                  <option value="Middle Class">Middle Class</option>
                  <option value="High Class">High Class</option>
                  <option value="Lower Middle Class">Lower Middle Class</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Residential">Residential</option>
                  <option value="Developing">Developing</option>
                </select>
              </Field>

              <Field label="15. Proximity to civic amenities">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.proximityCivicAmenities || ''}
                  onChange={e => handleFieldChange('proximityCivicAmenities', e.target.value)}
                />
              </Field>

              <Field label="16. Nearest railway station & distance">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.nearestRailwayStation || ''}
                  onChange={e => handleFieldChange('nearestRailwayStation', e.target.value)}
                />
              </Field>

              <Field label="17. Modes of transport">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.modesOfTransport || ''}
                  onChange={e => handleFieldChange('modesOfTransport', e.target.value)}
                />
              </Field>

              <Field label="18. Name of the road for access">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.roadAccessName || ''}
                  onChange={e => handleFieldChange('roadAccessName', e.target.value)}
                />
              </Field>

              <Field label="19. Area of the land & other details">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.landAreaOtherDetails || ''}
                  onChange={e => handleFieldChange('landAreaOtherDetails', e.target.value)}
                />
              </Field>

              <Field label="20. Land tenure">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.landTenure || 'Freehold'}
                  onChange={e => handleFieldChange('landTenure', e.target.value)}
                >
                  <option value="Freehold">Freehold</option>
                  <option value="Leasehold">Leasehold</option>
                  <option value="Govt Grant">Govt Grant</option>
                </select>
              </Field>

              <Field label="22. Co-operative Housing society">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.cooperativeSocietyDetails || ''}
                  onChange={e => handleFieldChange('cooperativeSocietyDetails', e.target.value)}
                />
              </Field>

              <Field label="23. Identified by">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.identifiedBy || ''}
                  onChange={e => handleFieldChange('identifiedBy', e.target.value)}
                />
              </Field>

              <Field label="24. Visited by">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.visitedBy || ''}
                  onChange={e => handleFieldChange('visitedBy', e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-4 space-y-4">
              <Field label="11. Brief description of the property (Khata, Plot, Mouza, PS, Tahasil, Dist, State, Pin)">
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.propertyDescription || ''}
                  onChange={e => handleFieldChange('propertyDescription', e.target.value)}
                />
              </Field>

              <Field label="21. Approvals for drawings from municipal authorities">
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.approvalDrawings || ''}
                  onChange={e => handleFieldChange('approvalDrawings', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 2: STRUCTURE & BOUNDARIES (PART B)
          ═══════════════════════════════════════════════ */}
          <Section title="Structure & Boundaries" id="tata-sec-structure">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Field label="1. Year of construction">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.yearOfConstruction || ''}
                  onChange={e => handleFieldChange('yearOfConstruction', e.target.value)}
                />
              </Field>

              <Field label="2. Age & Anticipated Life">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.ageAndLife || ''}
                  onChange={e => handleFieldChange('ageAndLife', e.target.value)}
                />
              </Field>

              <Field label="3. Present condition of flat & bldg">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.presentCondition || ''}
                  onChange={e => handleFieldChange('presentCondition', e.target.value)}
                />
              </Field>

              <Field label="4. Type of construction">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.typeOfConstruction || ''}
                  onChange={e => handleFieldChange('typeOfConstruction', e.target.value)}
                />
              </Field>
            </div>

            {/* Boundary Comparison Table */}
            <div className="mt-6 border border-slate-700/60 rounded-xl overflow-hidden bg-slate-900/40">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-800/60 border-b border-slate-700/60">
                <span className="text-sm font-semibold text-slate-200">
                  Boundary Details (Sketch Map vs Actual Site)
                </span>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleSyncBoundaries}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-md transition-colors"
                  >
                    Sync Site with Sketch Map
                  </button>
                )}
              </div>

              <div className="p-4 grid grid-cols-1 gap-4">
                <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-800">
                  <div className="col-span-2">Direction</div>
                  <div className="col-span-5">As per Sketch Map</div>
                  <div className="col-span-5">As per Actual at Site</div>
                </div>

                {/* North */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 font-medium text-slate-300">North</div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      className={inputCls}
                      value={fields.boundarySketchNorth || ''}
                      onChange={e => handleFieldChange('boundarySketchNorth', e.target.value)}
                      placeholder="e.g. Plot No-703(P)"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      className={inputCls}
                      value={fields.boundarySiteNorth || ''}
                      onChange={e => handleFieldChange('boundarySiteNorth', e.target.value)}
                      placeholder="e.g. Plot No-703(P)"
                    />
                  </div>
                </div>

                {/* East */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 font-medium text-slate-300">East</div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      className={inputCls}
                      value={fields.boundarySketchEast || ''}
                      onChange={e => handleFieldChange('boundarySketchEast', e.target.value)}
                      placeholder="e.g. Plot No-702(P)"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      className={inputCls}
                      value={fields.boundarySiteEast || ''}
                      onChange={e => handleFieldChange('boundarySiteEast', e.target.value)}
                      placeholder="e.g. Plot No-702(P)"
                    />
                  </div>
                </div>

                {/* South */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 font-medium text-slate-300">South</div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      className={inputCls}
                      value={fields.boundarySketchSouth || ''}
                      onChange={e => handleFieldChange('boundarySketchSouth', e.target.value)}
                      placeholder="e.g. Plot No-704"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      className={inputCls}
                      value={fields.boundarySiteSouth || ''}
                      onChange={e => handleFieldChange('boundarySiteSouth', e.target.value)}
                      placeholder="e.g. Plot No-704"
                    />
                  </div>
                </div>

                {/* West */}
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 font-medium text-slate-300">West</div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      className={inputCls}
                      value={fields.boundarySketchWest || ''}
                      onChange={e => handleFieldChange('boundarySketchWest', e.target.value)}
                      placeholder="e.g. Road"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      disabled={isReadOnly}
                      className={inputCls}
                      value={fields.boundarySiteWest || ''}
                      onChange={e => handleFieldChange('boundarySiteWest', e.target.value)}
                      placeholder="e.g. Road"
                    />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 3: PROPERTY SPECIFICATIONS (PART C)
          ═══════════════════════════════════════════════ */}
          <Section title="Property Specifications" id="tata-sec-specs">
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              Building Level Specifications (Points 1 - 11)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="1. Estimated date of completion">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.estimatedDateCompletion || ''}
                  onChange={e => handleFieldChange('estimatedDateCompletion', e.target.value)}
                />
              </Field>

              <Field label="2. Permitted use">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.permittedUse || ''}
                  onChange={e => handleFieldChange('permittedUse', e.target.value)}
                />
              </Field>

              <Field label="3. Actual use">
                <select
                  disabled={isReadOnly}
                  className={selectCls}
                  value={fields.actualUse || 'Commercial'}
                  onChange={e => handleFieldChange('actualUse', e.target.value)}
                >
                  <option value="Commercial">Commercial</option>
                  <option value="Residential">Residential</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Mixed (Resi-Comm)">Mixed (Resi-Comm)</option>
                </select>
              </Field>

              <Field label="4. No. of floors">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={e => handleFieldChange('noOfFloors', e.target.value)}
                />
              </Field>

              <Field label="5. No. of lifts">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.noOfLifts || ''}
                  onChange={e => handleFieldChange('noOfLifts', e.target.value)}
                />
              </Field>

              <Field label="6. Tanks & pumps">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.tanksAndPumps || ''}
                  onChange={e => handleFieldChange('tanksAndPumps', e.target.value)}
                />
              </Field>

              <Field label="7. Flooring open spaces & staircase">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.flooringOpenSpaces || ''}
                  onChange={e => handleFieldChange('flooringOpenSpaces', e.target.value)}
                />
              </Field>

              <Field label="8. Compound wall & gates">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.compoundWallGates || ''}
                  onChange={e => handleFieldChange('compoundWallGates', e.target.value)}
                />
              </Field>

              <Field label="9. Elevation">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.elevation || ''}
                  onChange={e => handleFieldChange('elevation', e.target.value)}
                />
              </Field>

              <Field label="10. Amenities">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.amenities || ''}
                  onChange={e => handleFieldChange('amenities', e.target.value)}
                />
              </Field>

              <Field label="11. Comments on specification">
                <input
                  type="text"
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.commentsOnSpecification || ''}
                  onChange={e => handleFieldChange('commentsOnSpecification', e.target.value)}
                />
              </Field>
            </div>

            {/* Flat / Unit Checklist (Points 1 - 18) */}
            <div className="mt-8 pt-6 border-t border-slate-700/60">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-3">
                Flat / Unit Checklist (Points 1 - 18)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Field label="1. No. of floors and flats">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitFloorsFlats || ''}
                    onChange={e => handleFieldChange('unitFloorsFlats', e.target.value)}
                  />
                </Field>

                <Field label="2. Rooms">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitRooms || ''}
                    onChange={e => handleFieldChange('unitRooms', e.target.value)}
                  />
                </Field>

                <Field label="3. Balconies">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitBalconies || ''}
                    onChange={e => handleFieldChange('unitBalconies', e.target.value)}
                  />
                </Field>

                <Field label="4. Walls and plaster finish">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitWallsPlaster || ''}
                    onChange={e => handleFieldChange('unitWallsPlaster', e.target.value)}
                  />
                </Field>

                <Field label="5. Doors and windows">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitDoorsWindows || ''}
                    onChange={e => handleFieldChange('unitDoorsWindows', e.target.value)}
                  />
                </Field>

                <Field label="6. Flooring">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitFlooring || ''}
                    onChange={e => handleFieldChange('unitFlooring', e.target.value)}
                  />
                </Field>

                <Field label="7. Sanitary and toilets">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitSanitaryToilets || ''}
                    onChange={e => handleFieldChange('unitSanitaryToilets', e.target.value)}
                  />
                </Field>

                <Field label="8. Kitchen sink & fittings">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitKitchenSink || ''}
                    onChange={e => handleFieldChange('unitKitchenSink', e.target.value)}
                  />
                </Field>

                <Field label="9. Plumbing">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitPlumbing || ''}
                    onChange={e => handleFieldChange('unitPlumbing', e.target.value)}
                  />
                </Field>

                <Field label="10. Electrical">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitElectrical || ''}
                    onChange={e => handleFieldChange('unitElectrical', e.target.value)}
                  />
                </Field>

                <Field label="11. Actual area (carpet/SBU/saleable)">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitActualArea || ''}
                    onChange={e => handleFieldChange('unitActualArea', e.target.value)}
                  />
                </Field>

                <Field label="12. Permitted area (carpet/SBU/saleable)">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitPermittedArea || ''}
                    onChange={e => handleFieldChange('unitPermittedArea', e.target.value)}
                  />
                </Field>

                <Field label="13. Sale agreement area">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitSaleAgreementArea || ''}
                    onChange={e => handleFieldChange('unitSaleAgreementArea', e.target.value)}
                  />
                </Field>

                <Field label="14. Adherence to sanction plan">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitAdherencePlan || ''}
                    onChange={e => handleFieldChange('unitAdherencePlan', e.target.value)}
                  />
                </Field>

                <Field label="15. Deviation observed">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitDeviationObserved || ''}
                    onChange={e => handleFieldChange('unitDeviationObserved', e.target.value)}
                  />
                </Field>

                <Field label="16. Risk of demolition">
                  <select
                    disabled={isReadOnly}
                    className={selectCls}
                    value={fields.unitDemolitionRisk || 'Low'}
                    onChange={e => handleFieldChange('unitDemolitionRisk', e.target.value)}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Nil">Nil</option>
                  </select>
                </Field>

                <Field label="17. Occupied by">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitOccupiedBy || ''}
                    onChange={e => handleFieldChange('unitOccupiedBy', e.target.value)}
                  />
                </Field>

                <Field label="18. If self-occupied since when">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.unitSelfOccupiedSince || ''}
                    onChange={e => handleFieldChange('unitSelfOccupiedSince', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 4: ASSUMPTIONS & BASIS (PART D)
          ═══════════════════════════════════════════════ */}
          <Section title="Assumptions & Basis" id="tata-sec-assumptions">
            <div className="space-y-4">
              <Field label="1. Drawings and approvals">
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.drawingsAndApprovals || ''}
                  onChange={e => handleFieldChange('drawingsAndApprovals', e.target.value)}
                />
              </Field>

              <Field label="2. Area considered for valuation">
                <textarea
                  rows={2}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.areaConsideredValuation || ''}
                  onChange={e => handleFieldChange('areaConsideredValuation', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="3. Age of building & future life">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.ageFutureLife || ''}
                    onChange={e => handleFieldChange('ageFutureLife', e.target.value)}
                  />
                </Field>

                <Field label="4. Present condition">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.presentConditionBasis || ''}
                    onChange={e => handleFieldChange('presentConditionBasis', e.target.value)}
                  />
                </Field>

                <Field label="5. Comments on specification">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.commentsOnSpecificationBasis || ''}
                    onChange={e => handleFieldChange('commentsOnSpecificationBasis', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="6. Market rates of properties in vicinity">
                <textarea
                  rows={3}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.marketRatesVicinity || ''}
                  onChange={e => handleFieldChange('marketRatesVicinity', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 5: VALUATION & CALCULATIONS (PART E)
          ═══════════════════════════════════════════════ */}
          <Section title="Valuation & Calculations" id="tata-sec-valuation">
            {/* Live Financial Calculation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/30">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                  Total Market Value (A + B)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.totalMarketValue)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.totalMarketValue)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-950/50 to-slate-900 border border-amber-500/30">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
                  Forced Sale Value (80%)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.forcedSaleValue)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.forcedSaleValue)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-sky-950/50 to-slate-900 border border-sky-500/30">
                <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider block">
                  Insurance Value (85% Constr.)
                </span>
                <span className="text-2xl font-bold text-white mt-1 block">
                  ₹ {formatIndianCurrency(calculations.insuranceValue)}
                </span>
                <span className="text-xs text-slate-400 mt-1 block italic">
                  {rupeesInWords(calculations.insuranceValue)}
                </span>
              </div>
            </div>

            {/* Land & Building Inputs */}
            <div className="border border-slate-700/60 rounded-xl p-5 bg-slate-900/40 space-y-6">
              <div className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2">
                1. Land Valuation Component (A)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Land Area (in Sq. Ft)">
                  <input
                    type="number"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.landAreaSqft ?? ''}
                    onChange={e => handleFieldChange('landAreaSqft', e.target.value)}
                  />
                </Field>

                <Field label="Adopted Rate per Sq. Ft (₹)">
                  <input
                    type="number"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.recommendedLandRate ?? ''}
                    onChange={e => handleFieldChange('recommendedLandRate', e.target.value)}
                  />
                </Field>

                <Field label="Calculated Land Value (A) (₹)">
                  <input
                    type="text"
                    disabled
                    className={`${inputCls} bg-slate-800/80 font-semibold text-emerald-400`}
                    value={`₹ ${formatIndianCurrency(calculations.landValueA)}`}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Current Govt. Approved Rate Text">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.govtApprovedLandRateText || ''}
                    onChange={e => handleFieldChange('govtApprovedLandRateText', e.target.value)}
                    placeholder="e.g. Rs.298/- per sqfft of land"
                  />
                </Field>

                <Field label="Basis of Recommended Land Rate">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.basisRecommendation || ''}
                    onChange={e => handleFieldChange('basisRecommendation', e.target.value)}
                  />
                </Field>
              </div>

              <div className="text-sm font-semibold text-slate-200 border-b border-slate-800 pb-2 pt-2">
                2. Construction / Building Valuation Component (B)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Approved BUA of Building (Sq. Ft)">
                  <input
                    type="number"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.approvedBuaSqft ?? ''}
                    onChange={e => handleFieldChange('approvedBuaSqft', e.target.value)}
                  />
                </Field>

                <Field label="Construction Cost per Sq. Ft (₹)">
                  <input
                    type="number"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.constructionCostPerSqft ?? ''}
                    onChange={e => handleFieldChange('constructionCostPerSqft', e.target.value)}
                  />
                </Field>

                <Field label="Total Construction Value (B) (₹)">
                  <input
                    type="text"
                    disabled
                    className={`${inputCls} bg-slate-800/80 font-semibold text-emerald-400`}
                    value={`₹ ${formatIndianCurrency(calculations.totalConstructionValueB)}`}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Actual BUA of Building at Site (Sq. Ft)">
                  <input
                    type="number"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.actualBuaSqft ?? ''}
                    onChange={e => handleFieldChange('actualBuaSqft', e.target.value)}
                  />
                </Field>

                <Field label="Deviation Details (if any)">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.deviationDetails || ''}
                    onChange={e => handleFieldChange('deviationDetails', e.target.value)}
                  />
                </Field>

                <Field label="Construction Value Considered Description">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    className={inputCls}
                    value={fields.constructionValueConsideredText || ''}
                    onChange={e => handleFieldChange('constructionValueConsideredText', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 6: REMARKS & DECLARATION
          ═══════════════════════════════════════════════ */}
          <Section title="Remarks & Declaration" id="tata-sec-remarks">
            <div className="space-y-4">
              <Field label="Synthesis & Valuation Remarks">
                <textarea
                  rows={4}
                  disabled={isReadOnly}
                  className={inputCls}
                  value={fields.synthesisRemarks || ''}
                  onChange={e => handleFieldChange('synthesisRemarks', e.target.value)}
                />
              </Field>

              <Field label="Statutory Declarations (Clauses 1 to 7)">
                <textarea
                  rows={6}
                  disabled={isReadOnly}
                  className={`${inputCls} text-xs leading-relaxed`}
                  value={
                    typeof fields.statutoryDeclarations === 'string'
                      ? fields.statutoryDeclarations
                      : [
                          '1. The information provided in this valuation report is true and correct to the best of our knowledge and belief.',
                          '2. The property was physically inspected by our authorized engineer/representative.',
                          '3. I/We have no direct or indirect interest in the property valued, nor in any transaction involving this property.',
                          '4. Our professional fee is not contingent upon the reporting of a predetermined value or direction in value that favors the cause of the client.',
                          '5. The report has been prepared in accordance with professional valuation standards and guidelines prescribed by Tata Capital Ltd.',
                          '6. The fair market value indicated is based on prevalent market rates of similar properties in the locality as on date of valuation.',
                          '7. The valuation does not certify legal title or encumbrances, which must be independently verified by the bank\'s legal counsel.',
                        ].join('\n')
                  }
                  onChange={e => handleFieldChange('statutoryDeclarations', e.target.value)}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
                    value={fields.reportPlace || 'Bhubaneswar'}
                    onChange={e => handleFieldChange('reportPlace', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* ═══════════════════════════════════════════════
              SECTION 7: PROPERTY DOCUMENTS (NO SECTION NUMBER)
          ═══════════════════════════════════════════════ */}
          <BaseDocumentsSection
            title="Property Documents"
            sectionId="tata-sec-docs"
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

          {/* ═══════════════════════════════════════════════
              SECTION 8: LOCATION MAPS (NO SECTION NUMBER)
          ═══════════════════════════════════════════════ */}
          <BaseMapsSection
            title="Location Maps"
            sectionId="tata-sec-maps"
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

          {/* ═══════════════════════════════════════════════
              SECTION 9: PROPERTY PHOTOGRAPHS (NO SECTION NUMBER)
          ═══════════════════════════════════════════════ */}
          <BasePhotographsSection
            title="Property Photographs"
            sectionId="tata-sec-photos"
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

        {/* ── Right Sections Nav Panel (Clean, unnumbered pills matching sections 1-to-1) ── */}
        <FloatingNavigator sections={navSections} />
      </div>

      {/* ── Sticky Action Bar ── */}
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

      {/* ── Bucket Photo Picker Modal ── */}
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
