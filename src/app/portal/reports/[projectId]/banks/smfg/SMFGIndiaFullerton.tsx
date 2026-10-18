'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  BankReportHeader,
  Section,
  Field,
  inputCls,
  selectCls,
  textareaCls,
  renderedParagraphCls,
  renderedBoxedContentCls,
  renderedDeclarationPointCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  ReportActionBar,
  FloatingNavigator,
  NavItem,
  formatReportDate,
  getEarliestFieldVisit,
  BasePhotoBucketModal,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFSMFGIndiaFullertonRenderer } from '@/lib/banks/pdf-smfg-india-fullerton-renderer';

export const SMFG_FULLERTON_CONFIG: BankConfig = {
  bankId: 'SMFG INDIA-FULLERTON',
  subTemplateId: '',
  displayName: 'SMFG India Credit (Fullerton India)',
  defaultValues: {
    purpose: 'Housing Loan / Loan Against Property (LAP)',
  },
};

export interface SMFGIndiaFullertonProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

export default function SMFGIndiaFullerton({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: SMFGIndiaFullertonProps) {
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
    { id: 'sec-meta', title: 'Application & Meta' },
    { id: 'sec-property', title: 'Property & Locality' },
    { id: 'sec-sanction', title: 'Sanction Plan & Docs' },
    { id: 'sec-boundaries', title: 'Boundaries & Occupant' },
    { id: 'sec-building', title: 'Building & Unit Details' },
    { id: 'sec-valuation', title: 'Valuation & Calculations' },
    { id: 'sec-documents', title: 'Documents' },
    { id: 'sec-maps', title: 'Maps' },
    { id: 'sec-photographs', title: 'Photographs' },
  ];

  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(bucketImages, prefill);
  }, [bucketImages, prefill]);

  // Initial Fields with smart prefill fallback
  const [fields, setFields] = useState<Record<string, any>>(() => {
    const d = { ...(rawInitialFields || {}) };
    const p = (prefill || {}) as any;

    // Cover & Meta Header
    if (!d.propertyOwner) d.propertyOwner = p.contactName ? `${p.contactName}` : '';
    if (!d.purposeOfValuation) d.purposeOfValuation = 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY';
    if (!d.refNo) d.refNo = projectCode || '';
    if (!d.dealNo) d.dealNo = '';
    if (!d.vertical) d.vertical = 'NA';
    if (!d.branchName) d.branchName = '';
    if (!d.typeOfCase) d.typeOfCase = 'Mass LAP';
    if (!d.valuerName) d.valuerName = 'M/s. S MOHANTY ASSOCIATES';
    if (!d.dateOfInitiate) d.dateOfInitiate = formatReportDate(new Date());
    if (!d.dateOfVisit) d.dateOfVisit = earliestVisit ? formatReportDate(earliestVisit.date) : formatReportDate(new Date());
    if (!d.dateOfReport) d.dateOfReport = formatReportDate(new Date());
    if (!d.contactPerson) {
      d.contactPerson = p.contactName
        ? `${p.contactName}${p.contactPhone ? `, Mob:- ${p.contactPhone}` : ''}`
        : '';
    }

    // 1. Application Details
    if (!d.applicantName) d.applicantName = p.applicantName || '';
    if (!d.propertyType) d.propertyType = 'Single storied Residential building';
    if (!d.currentUsage) d.currentUsage = 'Residential';
    if (!d.addressAtSite) {
      d.addressAtSite = p.propertyAddress || '';
    }
    if (!d.addressAsPerFiring) d.addressAsPerFiring = d.addressAtSite;
    if (!d.addressAsPerDocument) d.addressAsPerDocument = d.addressAtSite;
    if (!d.previousValuation) d.previousValuation = 'No';

    // 2. Sanction Plan & Documents Details
    if (!d.sanctionPlanDetails) d.sanctionPlanDetails = 'Plan no. NA, Structure: NA, Authority: NA, Area: NA';
    if (!d.documentsVerified) d.documentsVerified = 'Copy of Sale Deed, ROR & Sketch map';
    if (!d.ownershipType) d.ownershipType = 'Freehold';
    if (!d.constructionCompliance) d.constructionCompliance = 'Bye Laws';
    if (!d.permissibleUsage) d.permissibleUsage = 'Master Plan not Publish';
    if (!d.demolitionList) d.demolitionList = 'Not observed';

    // 3. Boundaries & Occupancy Details
    if (!d.boundaryEastDoc) d.boundaryEastDoc = p.boundaryEast || '';
    if (!d.boundaryWestDoc) d.boundaryWestDoc = p.boundaryWest || '';
    if (!d.boundaryNorthDoc) d.boundaryNorthDoc = p.boundaryNorth || '';
    if (!d.boundarySouthDoc) d.boundarySouthDoc = p.boundarySouth || '';

    if (!d.boundaryEastSketch) d.boundaryEastSketch = 'NA';
    if (!d.boundaryWestSketch) d.boundaryWestSketch = 'NA';
    if (!d.boundaryNorthSketch) d.boundaryNorthSketch = 'NA';
    if (!d.boundarySouthSketch) d.boundarySouthSketch = 'NA';

    if (!d.boundaryEastSite) d.boundaryEastSite = p.boundaryEast || '';
    if (!d.boundaryWestSite) d.boundaryWestSite = p.boundaryWest || '';
    if (!d.boundaryNorthSite) d.boundaryNorthSite = p.boundaryNorth || '';
    if (!d.boundarySouthSite) d.boundarySouthSite = p.boundarySouth || '';

    if (!d.boundariesMatching) d.boundariesMatching = 'Yes';

    if (!d.occupancyStatus) d.occupancyStatus = '';
    if (!d.occupantName) d.occupantName = '';
    if (!d.occupantRelation) d.occupantRelation = '';
    if (!d.propertyDemarcation) d.propertyDemarcation = '';
    if (!d.identifiedThrough) d.identifiedThrough = d.contactPerson || 'Customer';

    // 4. Building & Unit Details
    if (!d.structureType) d.structureType = 'RCC';
    if (!d.plotArea) d.plotArea = p.plotArea || '';
    if (!d.noOfFloors) d.noOfFloors = '';
    if (!d.floorValued) d.floorValued = '';
    if (!d.unitsPerFloor) d.unitsPerFloor = 'NA';
    if (!d.liftsCount) d.liftsCount = 'Nil';

    if (!d.unitRooms) d.unitRooms = '';
    if (!d.sbuaPermissible) d.sbuaPermissible = 'NA';
    if (!d.carpetArea) d.carpetArea = '';
    if (!d.viewRemarks) d.viewRemarks = 'NA';

    if (!d.constructionQuality) d.constructionQuality = 'Good';
    if (!d.propertyAge) d.propertyAge = '';
    if (!d.localityType) d.localityType = 'Residential';
    if (!d.localityClass) d.localityClass = 'Middle class';
    if (!d.siteDevStatus) d.siteDevStatus = 'Developing';
    if (!d.proximityAmenities) d.proximityAmenities = '';
    if (!d.landmark) d.landmark = p.nearestLandmark || '';
    if (!d.municipalLimits) d.municipalLimits = '';
    if (!d.siteAccessRoad) d.siteAccessRoad = '';
    if (!d.basicAmenitiesAvailable) d.basicAmenitiesAvailable = 'Yes';
    if (!d.marketability) d.marketability = 'Good';
    if (!d.electricityMeterNo) d.electricityMeterNo = '';

    // 21. Floor Wise Area
    if (!d.actualBuaBase) d.actualBuaBase = 'NA';
    if (!d.actualBuaStilt) d.actualBuaStilt = 'NA';
    if (!d.actualBuaGround) d.actualBuaGround = '';
    if (!d.actualBuaFirst) d.actualBuaFirst = 'NA';
    if (!d.actualBuaSecond) d.actualBuaSecond = 'NA';
    if (!d.actualBuaThird) d.actualBuaThird = 'NA';

    if (!d.permissibleBuaBase) d.permissibleBuaBase = 'NA';
    if (!d.permissibleBuaStilt) d.permissibleBuaStilt = 'NA';
    if (!d.permissibleBuaGround) d.permissibleBuaGround = 'NA';
    if (!d.permissibleBuaFirst) d.permissibleBuaFirst = 'NA';
    if (!d.permissibleBuaSecond) d.permissibleBuaSecond = 'NA';
    if (!d.permissibleBuaThird) d.permissibleBuaThird = 'Nil';

    if (!d.extraCoverageBase) d.extraCoverageBase = 'NA';
    if (!d.extraCoverageStilt) d.extraCoverageStilt = 'NA';
    if (!d.extraCoverageGround) d.extraCoverageGround = 'NA';
    if (!d.extraCoverageFirst) d.extraCoverageFirst = 'NA';
    if (!d.extraCoverageSecond) d.extraCoverageSecond = 'NA';
    if (!d.extraCoverageThird) d.extraCoverageThird = 'NA';

    if (!d.totalActualBua) d.totalActualBua = '';
    if (!d.totalPermissibleBua) d.totalPermissibleBua = 'NA';
    if (!d.saleableArea) d.saleableArea = 'NA';
    if (!d.compositeExtraCoverage) d.compositeExtraCoverage = 'NA';

    // 22. Valuation & Rates
    if (!d.landArea) d.landArea = '';
    if (!d.landRate) d.landRate = '';
    if (!d.landValue) d.landValue = '';

    if (!d.constArea) d.constArea = '';
    if (!d.constRate) d.constRate = '';
    if (!d.buildingValue) d.buildingValue = '';

    if (!d.stageOfConstruction) d.stageOfConstruction = '100%';
    if (!d.stagePercent) d.stagePercent = '100%';
    if (!d.recommendedPercent) d.recommendedPercent = '100%';
    if (!d.marketValue) d.marketValue = '';
    if (!d.distressValue) d.distressValue = '';
    if (!d.circleRate) d.circleRate = '';

    // Extra Amenities
    if (!d.amenityCarParking) d.amenityCarParking = 'NA';
    if (!d.amenityPlc) d.amenityPlc = 'NA';
    if (!d.amenityIdc) d.amenityIdc = 'NA';
    if (!d.amenityEdc) d.amenityEdc = 'NA';
    if (!d.amenityPowerBackup) d.amenityPowerBackup = 'NA';
    if (!d.amenityClub) d.amenityClub = 'NA';
    if (!d.amenityOther) d.amenityOther = 'NA';
    if (!d.totalAmenitiesCharges) d.totalAmenitiesCharges = 'Nil';
    if (!d.approxRentals) d.approxRentals = '-';

    // Structural specs
    if (!d.seismicZone) d.seismicZone = 'III';
    if (!d.footingType) d.footingType = 'Independent Footing';
    if (!d.roofType) d.roofType = 'RCC slab';
    if (!d.masonryType) d.masonryType = 'Brick';
    if (!d.soilType) d.soilType = 'Red soil';

    // Page 3: Floorwise Details of Usage of Property
    if (!d.floorwiseUsageRows) {
      d.floorwiseUsageRows = [
        { floor: 'Basement', usage: 'NA', units: '', tenantedYear: '', rentalAssessment: '' },
        { floor: 'Ground', usage: 'Residential', units: '', tenantedYear: 'Self', rentalAssessment: 'NA' },
        { floor: 'First', usage: 'NA', units: '', tenantedYear: 'NA', rentalAssessment: 'NA' },
        { floor: 'Second', usage: 'NA', units: '', tenantedYear: 'NA', rentalAssessment: 'NA' },
        { floor: 'Third', usage: 'NA', units: '', tenantedYear: '', rentalAssessment: '' },
        { floor: '4th/above', usage: 'NA', units: '', tenantedYear: '', rentalAssessment: '' },
      ];
    }

    // Remarks & Declaration
    if (!d.remarks) {
      d.remarks = '';
    }

    // Coordinates
    if (!d.latitude) d.latitude = p.latitude || '';
    if (!d.longitude) d.longitude = p.longitude || '';

    // Attachments
    if (!d.documentImages) d.documentImages = [];
    if (!d.documentImageNames) d.documentImageNames = [];
    if (!d.locationMapImages) d.locationMapImages = [];
    if (!d.mouzaMapImages) d.mouzaMapImages = [];
    if (!d.sketchMapImages) d.sketchMapImages = [];
    if (!d.cadastralMapImages) d.cadastralMapImages = [];
    if (!d.bdaMapImages) d.bdaMapImages = [];
    if (!d.propertyImages) d.propertyImages = [];
    if (!d.propertyImageNames) d.propertyImageNames = [];

    return d;
  });

  const handleChange = useCallback((key: string, value: any) => {
    setFields(prev => {
      const next = { ...prev, [key]: value };

      // Live auto-calculation for SMFG Valuation
      if (key === 'landArea' || key === 'landRate' || key === 'constArea' || key === 'constRate') {
        const lArea = parseFloat(String(next.landArea).replace(/[^0-9.]/g, '')) || 0;
        const lRate = parseFloat(String(next.landRate).replace(/[^0-9.]/g, '')) || 0;
        const cArea = parseFloat(String(next.constArea).replace(/[^0-9.]/g, '')) || 0;
        const cRate = parseFloat(String(next.constRate).replace(/[^0-9.]/g, '')) || 0;

        const lVal = Math.round(lArea * lRate);
        const cVal = Math.round(cArea * cRate);
        const mVal = lVal + cVal;
        const dVal = Math.round(mVal * 0.80);

        next.landValue = lVal.toString();
        next.buildingValue = cVal.toString();
        next.marketValue = mVal.toString();
        next.distressValue = dVal.toString();
      }

      return next;
    });
  }, []);

  const handleFloorwiseUsageChange = useCallback((index: number, colKey: string, val: string) => {
    setFields(prev => {
      const rows = [...(prev.floorwiseUsageRows || [])];
      rows[index] = { ...rows[index], [colKey]: val };
      return { ...prev, floorwiseUsageRows: rows };
    });
  }, []);

  // Save draft action
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, {
        custom_fields: fields,
        valuation_amount: parseFloat(fields.marketValue || 0) || 0,
        updated_at: new Date().toISOString(),
      });
      setAutoSaveStatus('saved');
      setMessage({ text: 'Report draft saved successfully!', type: 'success' });
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    } catch (e: any) {
      setAutoSaveStatus('error');
      setMessage({ text: e.message || 'Error saving report draft', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Submit action
  const handleSubmitReport = async () => {
    if (!confirm('Are you sure you want to finalize and submit this valuation report?')) return;
    setSubmitting(true);
    try {
      await handleSaveDraft();
      router.push(`/portal/reports/${projectId}?status=submitted`);
    } catch (e: any) {
      alert(`Error submitting report: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Generate PDF Bytes
  const generatePdfBytes = async (): Promise<Uint8Array> => {
    const renderer = new PDFSMFGIndiaFullertonRenderer({ ...fields, projectCode });
    return await renderer.render();
  };

  // Preview PDF action
  const handlePreviewPdf = async () => {
    setPreviewing(true);
    try {
      const pdfBytes = await generatePdfBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      alert(`Error generating PDF preview: ${e.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  // Download PDF action
  const handleDownloadPdf = async () => {
    setPreviewing(true);
    try {
      const pdfBytes = await generatePdfBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SMFG_India_Valuation_${fields.refNo || projectCode || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Error downloading PDF: ${e.message}`);
    } finally {
      setPreviewing(false);
    }
  };

  // Document upload handler
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading('documents');
    try {
      const newUrls: string[] = [];
      const newNames: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `smfg_doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
        newNames.push(file.name.replace(/\.[^/.]+$/, ''));
      }

      setFields(prev => ({
        ...prev,
        documentImages: [...(prev.documentImages || []), ...newUrls],
        documentImageNames: [...(prev.documentImageNames || []), ...newNames],
      }));
    } catch (err: any) {
      alert(`Error uploading documents: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Map upload handler
  const handleMapUpload = async (mapField: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(mapField);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `smfg_map_${mapField}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `${projectId}/${fileName}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);

      setFields(prev => ({
        ...prev,
        [mapField]: [...(prev[mapField] || []), urlData.publicUrl],
      }));
    } catch (err: any) {
      alert(`Error uploading map: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Photo upload handler
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading('photos');
    try {
      const newUrls: string[] = [];
      const newNames: string[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const ext = file.name.split('.').pop() || 'jpg';
        const fileName = `smfg_photo_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);

        newUrls.push(urlData.publicUrl);
        newNames.push(`Photograph ${((fields.propertyImages || []).length + i + 1)}`);
      }

      setFields(prev => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...newUrls],
        propertyImageNames: [...(prev.propertyImageNames || []), ...newNames],
      }));
    } catch (err: any) {
      alert(`Error uploading photographs: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900">
      {/* ── Main Form Column ── */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Universal Bank Report Header */}
        <BankReportHeader
          bankName="SMFG India Credit (Fullerton India)"
          subclass="Mass LAP / Standard Format"
          formatName="Retail & MSME Mortgages, Loan Against Property (LAP) Valuation Format"
          clientType="organisation"
          category="Retail & MSME Mortgages"
          serviceType="Valuation Report Builder"
          subjectType="Housing Loan / Loan Against Property (LAP)"
          onResetWizard={onResetWizard}
          earliestVisit={earliestVisit}
          projectCode={projectCode}
          message={message}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 1: APPLICATION & PROPERTY META
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Application & Property Meta" number={1} id="sec-meta">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <Field label="Property Owner:">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-slate-900`}
                  value={fields.propertyOwner || ''}
                  onChange={e => handleChange('propertyOwner', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Purpose of Valuation:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.purposeOfValuation || ''}
                  onChange={e => handleChange('purposeOfValuation', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <Field label="Ref No:">
              <input
                type="text"
                className={inputCls}
                value={fields.refNo || ''}
                onChange={e => handleChange('refNo', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Deal No:">
              <input
                type="text"
                className={inputCls}
                value={fields.dealNo || ''}
                onChange={e => handleChange('dealNo', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Branch Name:">
              <input
                type="text"
                className={inputCls}
                value={fields.branchName || ''}
                onChange={e => handleChange('branchName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Type of Case:">
              <input
                type="text"
                className={inputCls}
                value={fields.typeOfCase || ''}
                onChange={e => handleChange('typeOfCase', e.target.value)}
                disabled={isReadOnly}
                placeholder="Mass LAP / Retail"
              />
            </Field>

            <Field label="Date of Initiate:">
              <input
                type="text"
                className={inputCls}
                value={fields.dateOfInitiate || ''}
                onChange={e => handleChange('dateOfInitiate', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Date of Visit:">
              <input
                type="text"
                className={inputCls}
                value={fields.dateOfVisit || ''}
                onChange={e => handleChange('dateOfVisit', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Date of Report:">
              <input
                type="text"
                className={inputCls}
                value={fields.dateOfReport || ''}
                onChange={e => handleChange('dateOfReport', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Valuer Name:">
              <input
                type="text"
                className={inputCls}
                value={fields.valuerName || ''}
                onChange={e => handleChange('valuerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <div className="md:col-span-4">
              <Field label="Contacted Person at site (ID proof details):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.contactPerson || ''}
                  onChange={e => handleChange('contactPerson', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 2: PROPERTY IDENTIFICATION & LOCALITY
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Property Identification & Locality" number={2} id="sec-property">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="1. Name/s of the applicant/s">
                <input
                  type="text"
                  className={`${inputCls} font-bold text-slate-900`}
                  value={fields.applicantName || ''}
                  onChange={e => handleChange('applicantName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="2. Type of property">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.propertyType || ''}
                  onChange={e => handleChange('propertyType', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Single storied Residential building"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="3. Address at site">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.addressAtSite || ''}
                    onChange={e => handleChange('addressAtSite', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="md:col-span-2">
                <Field label="Address as per document">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.addressAsPerDocument || ''}
                    onChange={e => handleChange('addressAsPerDocument', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="4. Has valuator done valuation of this property before this?">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.previousValuation || ''}
                  onChange={e => handleChange('previousValuation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="No / Yes"
                />
              </Field>

              <Field label="Current Usage">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.currentUsage || ''}
                  onChange={e => handleChange('currentUsage', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Residential / Commercial"
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 3: SANCTION PLAN & DOCUMENTS DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Sanction Plan & Documents Details" number={3} id="sec-sanction">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="5. Sanctioned plans verified with approval no">
              <input
                type="text"
                className={inputCls}
                value={fields.sanctionPlanDetails || ''}
                onChange={e => handleChange('sanctionPlanDetails', e.target.value)}
                disabled={isReadOnly}
                placeholder="Plan no. NA, Structure: NA, Authority: NA, Area: NA"
              />
            </Field>

            <Field label="6. Property Documents verified">
              <input
                type="text"
                className={inputCls}
                value={fields.documentsVerified || ''}
                onChange={e => handleChange('documentsVerified', e.target.value)}
                disabled={isReadOnly}
                placeholder="Copy of Sale Deed, ROR & Sketch map"
              />
            </Field>

            <Field label="7. Ownership type">
              <input
                type="text"
                className={inputCls}
                value={fields.ownershipType || ''}
                onChange={e => handleChange('ownershipType', e.target.value)}
                disabled={isReadOnly}
                placeholder="Freehold / Leasehold"
              />
            </Field>

            <Field label="8. Construction as per approved Building plan/Bye Laws">
              <input
                type="text"
                className={inputCls}
                value={fields.constructionCompliance || ''}
                onChange={e => handleChange('constructionCompliance', e.target.value)}
                disabled={isReadOnly}
                placeholder="Bye Laws / Approved Plan"
              />
            </Field>

            <Field label="9. Permissible usage allows as per master plan">
              <input
                type="text"
                className={inputCls}
                value={fields.permissibleUsage || ''}
                onChange={e => handleChange('permissibleUsage', e.target.value)}
                disabled={isReadOnly}
                placeholder="Master Plan not Publish"
              />
            </Field>

            <Field label="10. Is the property in demolition list">
              <input
                type="text"
                className={inputCls}
                value={fields.demolitionList || ''}
                onChange={e => handleChange('demolitionList', e.target.value)}
                disabled={isReadOnly}
                placeholder="Not observed"
              />
            </Field>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 4: BOUNDARIES & OCCUPANCY DETAILS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Boundaries & Occupancy Details" number={4} id="sec-boundaries">
          <div className="space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                11. Boundaries as Per Documents & Site
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-slate-800">
                  <thead className="bg-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-2 text-left">Schedule</th>
                      <th className="p-2 text-left">EAST</th>
                      <th className="p-2 text-left">WEST</th>
                      <th className="p-2 text-left">NORTH</th>
                      <th className="p-2 text-left">SOUTH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="p-2 font-bold">As per Documents</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryEastDoc || ''} onChange={e => handleChange('boundaryEastDoc', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryWestDoc || ''} onChange={e => handleChange('boundaryWestDoc', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryNorthDoc || ''} onChange={e => handleChange('boundaryNorthDoc', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundarySouthDoc || ''} onChange={e => handleChange('boundarySouthDoc', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">As per Sketch map</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryEastSketch || ''} onChange={e => handleChange('boundaryEastSketch', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryWestSketch || ''} onChange={e => handleChange('boundaryWestSketch', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryNorthSketch || ''} onChange={e => handleChange('boundaryNorthSketch', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundarySouthSketch || ''} onChange={e => handleChange('boundarySouthSketch', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="p-2 font-bold">At site</td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryEastSite || ''} onChange={e => handleChange('boundaryEastSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryWestSite || ''} onChange={e => handleChange('boundaryWestSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundaryNorthSite || ''} onChange={e => handleChange('boundaryNorthSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="p-2"><input type="text" className={inputCls} value={fields.boundarySouthSite || ''} onChange={e => handleChange('boundarySouthSite', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-3">
                <Field label="Boundaries Matching:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.boundariesMatching || ''}
                    onChange={e => handleChange('boundariesMatching', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Occupant Details */}
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="12. Occupancy Status:">
                <select
                  className={selectCls}
                  value={fields.occupancyStatus || 'Occupied'}
                  onChange={e => handleChange('occupancyStatus', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Occupied">Occupied</option>
                  <option value="Self occupied">Self occupied</option>
                  <option value="Vacant">Vacant</option>
                  <option value="Tenant">Tenant</option>
                </select>
              </Field>

              <Field label="Name of Occupant:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.occupantName || ''}
                  onChange={e => handleChange('occupantName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Relation with applicant:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.occupantRelation || ''}
                  onChange={e => handleChange('occupantRelation', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="13. Property Demarcation:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.propertyDemarcation || ''}
                  onChange={e => handleChange('propertyDemarcation', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Yes / No"
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="Property Identified through:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.identifiedThrough || ''}
                    onChange={e => handleChange('identifiedThrough', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 5: BUILDING & UNIT SPECIFICATIONS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Building & Unit Specifications" number={5} id="sec-building">
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Type of Structure:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.structureType || ''}
                  onChange={e => handleChange('structureType', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="RCC / Load Bearing"
                />
              </Field>

              <Field label="Plot Area (Sqft):">
                <input
                  type="text"
                  className={`${inputCls} font-bold`}
                  value={fields.plotArea || ''}
                  onChange={e => handleChange('plotArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="4007sqft"
                />
              </Field>

              <Field label="No. of Floors:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.noOfFloors || ''}
                  onChange={e => handleChange('noOfFloors', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="GF"
                />
              </Field>

              <Field label="Floor Valued:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.floorValued || ''}
                  onChange={e => handleChange('floorValued', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="No of unit per floor:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.unitsPerFloor || ''}
                  onChange={e => handleChange('unitsPerFloor', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="No. of Lifts:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.liftsCount || ''}
                  onChange={e => handleChange('liftsCount', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="md:col-span-2">
                <Field label="14. No. of rooms (Unit details):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unitRooms || ''}
                    onChange={e => handleChange('unitRooms', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="GF:- 3-Room, 1-Toilets, 1-Hall, 1-Kitchen"
                  />
                </Field>
              </div>

              <Field label="Carpet area (Actual):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.carpetArea || ''}
                  onChange={e => handleChange('carpetArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="1212sqft"
                />
              </Field>

              <Field label="15. Quality of construction:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.constructionQuality || ''}
                  onChange={e => handleChange('constructionQuality', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Good / Average"
                />
              </Field>

              <Field label="16. Age of property:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.propertyAge || ''}
                  onChange={e => handleChange('propertyAge', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="7-Years"
                />
              </Field>

              <Field label="Class of Locality:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.localityClass || ''}
                  onChange={e => handleChange('localityClass', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Middle class"
                />
              </Field>

              <Field label="Site Development:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.siteDevStatus || ''}
                  onChange={e => handleChange('siteDevStatus', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Developing"
                />
              </Field>

              <Field label="Proximity to civic amenities:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.proximityAmenities || ''}
                  onChange={e => handleChange('proximityAmenities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="17. Close Vicinity / Landmark:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.landmark || ''}
                  onChange={e => handleChange('landmark', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="18. Municipal Limits:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.municipalLimits || ''}
                  onChange={e => handleChange('municipalLimits', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="19. Site Access Road:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.siteAccessRoad || ''}
                  onChange={e => handleChange('siteAccessRoad', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="20. Marketability:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.marketability || ''}
                  onChange={e => handleChange('marketability', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Latitude:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.latitude || ''}
                  onChange={e => handleChange('latitude', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Longitude:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.longitude || ''}
                  onChange={e => handleChange('longitude', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 6: VALUATION & CALCULATIONS
        ═══════════════════════════════════════════════════════════════ */}
        <Section title="Valuation & Calculations" number={6} id="sec-valuation">
          <div className="space-y-6">
            {/* 21. Floor Wise Area (In Sqft.) Table */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                21. Floor Wise Area (In Sqft.)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="border border-slate-300 p-2">Area&apos;s</th>
                      <th className="border border-slate-300 p-2">Base.</th>
                      <th className="border border-slate-300 p-2">Stilt</th>
                      <th className="border border-slate-300 p-2">Ground</th>
                      <th className="border border-slate-300 p-2">First</th>
                      <th className="border border-slate-300 p-2">Second</th>
                      <th className="border border-slate-300 p-2">Third/above</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold">Actual BUA</td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.actualBuaBase || 'NA'}
                          onChange={e => handleChange('actualBuaBase', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.actualBuaStilt || 'NA'}
                          onChange={e => handleChange('actualBuaStilt', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs font-bold`}
                          value={fields.actualBuaGround || ''}
                          onChange={e => handleChange('actualBuaGround', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.actualBuaFirst || 'NA'}
                          onChange={e => handleChange('actualBuaFirst', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.actualBuaSecond || 'NA'}
                          onChange={e => handleChange('actualBuaSecond', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.actualBuaThird || 'NA'}
                          onChange={e => handleChange('actualBuaThird', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold">Permissible</td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.permissibleBuaBase || 'NA'}
                          onChange={e => handleChange('permissibleBuaBase', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.permissibleBuaStilt || 'NA'}
                          onChange={e => handleChange('permissibleBuaStilt', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.permissibleBuaGround || 'NA'}
                          onChange={e => handleChange('permissibleBuaGround', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.permissibleBuaFirst || 'NA'}
                          onChange={e => handleChange('permissibleBuaFirst', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.permissibleBuaSecond || 'NA'}
                          onChange={e => handleChange('permissibleBuaSecond', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.permissibleBuaThird || 'Nil'}
                          onChange={e => handleChange('permissibleBuaThird', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2 font-semibold">Extra Coverage (%)</td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.extraCoverageBase || 'NA'}
                          onChange={e => handleChange('extraCoverageBase', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.extraCoverageStilt || 'NA'}
                          onChange={e => handleChange('extraCoverageStilt', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.extraCoverageGround || 'NA'}
                          onChange={e => handleChange('extraCoverageGround', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.extraCoverageFirst || 'NA'}
                          onChange={e => handleChange('extraCoverageFirst', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.extraCoverageSecond || 'NA'}
                          onChange={e => handleChange('extraCoverageSecond', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="border border-slate-300 p-1">
                        <input
                          type="text"
                          className={`${inputCls} py-1 text-xs`}
                          value={fields.extraCoverageThird || 'NA'}
                          onChange={e => handleChange('extraCoverageThird', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="grid md:grid-cols-4 gap-3 pt-2">
                <Field label="Total Actual (In Sqft):">
                  <input
                    type="text"
                    className={`${inputCls} font-bold`}
                    value={fields.totalActualBua || ''}
                    onChange={e => handleChange('totalActualBua', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Total Permissible (In Sqft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalPermissibleBua || 'NA'}
                    onChange={e => handleChange('totalPermissibleBua', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Saleable (In Sqft):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.saleableArea || 'NA'}
                    onChange={e => handleChange('saleableArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Composite Extra Coverage:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.compositeExtraCoverage || 'NA'}
                    onChange={e => handleChange('compositeExtraCoverage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 22. (A) Description of Constructed Area and Rates */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3">
                22. (A) Description of Constructed Area and Rates
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Land Area (Sqft):">
                  <input
                    type="number"
                    className={`${inputCls} font-bold`}
                    value={fields.landArea || ''}
                    onChange={e => handleChange('landArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Land Rate (Rs/Sqft):">
                  <input
                    type="number"
                    className={`${inputCls} font-bold`}
                    value={fields.landRate || ''}
                    onChange={e => handleChange('landRate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Total Land Value:">
                  <input
                    type="text"
                    className={`${inputCls} font-bold bg-indigo-50 text-indigo-900`}
                    value={fields.landValue ? `₹ ${formatIndianCurrency(fields.landValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Measured RCC BUA (Sqft):">
                  <input
                    type="number"
                    className={`${inputCls} font-bold`}
                    value={fields.constArea || ''}
                    onChange={e => handleChange('constArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Construction Rate (Rs/Sqft):">
                  <input
                    type="number"
                    className={`${inputCls} font-bold`}
                    value={fields.constRate || ''}
                    onChange={e => handleChange('constRate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Total Building Value:">
                  <input
                    type="text"
                    className={`${inputCls} font-bold bg-indigo-50 text-indigo-900`}
                    value={fields.buildingValue ? `₹ ${formatIndianCurrency(fields.buildingValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>
              </div>
            </div>

            {/* 22. (B) Value of Extra Amenities */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                22. (B) Value of Extra Amenities
              </h4>
              <div className="grid md:grid-cols-4 gap-3">
                <Field label="Car Parking:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenityCarParking || 'NA'}
                    onChange={e => handleChange('amenityCarParking', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="PLC:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenityPlc || 'NA'}
                    onChange={e => handleChange('amenityPlc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="IDC:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenityIdc || 'NA'}
                    onChange={e => handleChange('amenityIdc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="EDC:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenityEdc || 'NA'}
                    onChange={e => handleChange('amenityEdc', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Power Backup:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenityPowerBackup || 'NA'}
                    onChange={e => handleChange('amenityPowerBackup', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Club Membership:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenityClub || 'NA'}
                    onChange={e => handleChange('amenityClub', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Other:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.amenityOther || 'NA'}
                    onChange={e => handleChange('amenityOther', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Total Amenities Charges (in Rs.):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.totalAmenitiesCharges || 'Nil'}
                    onChange={e => handleChange('totalAmenitiesCharges', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Approx. Rentals (100% complete):" className="md:col-span-2">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.approxRentals || '-'}
                    onChange={e => handleChange('approxRentals', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Valuation Summary Box */}
            <div className="bg-indigo-500/10 border border-indigo-500/30 p-5 rounded-2xl space-y-4">
              <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                📊 Valuation Summary
              </h4>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Market Value of Property as on date:">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-base bg-white text-emerald-700`}
                    value={fields.marketValue ? `₹ ${formatIndianCurrency(fields.marketValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Forced Sale / Distress Value (80%):">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-base bg-white text-rose-700`}
                    value={fields.distressValue ? `₹ ${formatIndianCurrency(fields.distressValue)}` : ''}
                    readOnly
                    disabled
                  />
                </Field>

                <Field label="Govt. Circle Rate (in Rs.):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.circleRate || ''}
                    onChange={e => handleChange('circleRate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                <Field label="Stage of Construction:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.stageOfConstruction || '100%'}
                    onChange={e => handleChange('stageOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Structural & Engineering Specifications */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Structural & Engineering Specifications
              </h4>
              <div className="grid md:grid-cols-3 gap-3">
                <Field label="Seismic Zone:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.seismicZone || 'III'}
                    onChange={e => handleChange('seismicZone', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Footing:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.footingType || 'Independent Footing'}
                    onChange={e => handleChange('footingType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Roof:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.roofType || 'RCC slab'}
                    onChange={e => handleChange('roofType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Masonry:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.masonryType || 'Brick'}
                    onChange={e => handleChange('masonryType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Soil:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.soilType || 'Red soil'}
                    onChange={e => handleChange('soilType', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Page 3: FLOORWISE DETAILS OF USAGE OF PROPERTY */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Floorwise Details of Usage of Property (Page 3)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-100 font-bold text-slate-700">
                    <tr>
                      <th className="border border-slate-300 p-2">Floor</th>
                      <th className="border border-slate-300 p-2">Usage</th>
                      <th className="border border-slate-300 p-2">Units</th>
                      <th className="border border-slate-300 p-2">If Tenanted, Yr of Current Tenancy</th>
                      <th className="border border-slate-300 p-2">Rental Assessment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(fields.floorwiseUsageRows || []).map((row: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-100/50">
                        <td className="border border-slate-300 p-2 font-semibold">
                          <input
                            type="text"
                            className={`${inputCls} py-1 text-xs font-bold bg-transparent border-0 focus:ring-1`}
                            value={row.floor || ''}
                            onChange={e => handleFloorwiseUsageChange(idx, 'floor', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            className={`${inputCls} py-1 text-xs`}
                            value={row.usage || ''}
                            onChange={e => handleFloorwiseUsageChange(idx, 'usage', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            className={`${inputCls} py-1 text-xs`}
                            value={row.units || ''}
                            onChange={e => handleFloorwiseUsageChange(idx, 'units', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            className={`${inputCls} py-1 text-xs`}
                            value={row.tenantedYear || ''}
                            onChange={e => handleFloorwiseUsageChange(idx, 'tenantedYear', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="border border-slate-300 p-1">
                          <input
                            type="text"
                            className={`${inputCls} py-1 text-xs`}
                            value={row.rentalAssessment || ''}
                            onChange={e => handleFloorwiseUsageChange(idx, 'rentalAssessment', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Remarks & Declaration */}
            <Field label="Remarks:">
              <textarea
                rows={4}
                className={textareaCls}
                value={fields.remarks || ''}
                onChange={e => handleChange('remarks', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <div className={renderedBoxedContentCls}>
              <h4 className="font-bold text-slate-800 uppercase tracking-wide">
                Declaration:
              </h4>
              <p className={renderedParagraphCls}>1. The property is physically inspected by our Engineer/Representative.</p>
              <p className={renderedParagraphCls}>2. We have no direct/indirect interest in the property valued.</p>
              <p className={renderedParagraphCls}>3. The information furnished above is true & correct to the best of our knowledge and belief and takes account information and or document submitted or shown to us by the client.</p>
              <p className={renderedParagraphCls}>4. The ownership papers/sale deeds may please be verified at your end to ascertain the right title & area.</p>
              <p className={renderedParagraphCls}>5. The fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties.</p>
            </div>
          </div>
        </Section>

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 7: DOCUMENTS
        ═══════════════════════════════════════════════════════════════ */}
        <BaseDocumentsSection
          title="Documents"
          sectionNumber={7}
          sectionId="sec-documents"
          documentImages={fields.documentImages || []}
          documentImageNames={fields.documentImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading === 'documents'}
          onUploadDocument={handleDocumentUpload}
          onRemoveDocument={idx => {
            setFields(prev => ({
              ...prev,
              documentImages: (prev.documentImages || []).filter((_: any, i: number) => i !== idx),
              documentImageNames: (prev.documentImageNames || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onDocumentNameChange={(idx, name) => {
            const next = [...(fields.documentImageNames || [])];
            while (next.length <= idx) next.push('');
            next[idx] = name;
            handleChange('documentImageNames', next);
          }}
          onReorderDocuments={(newImages, newNames) => {
            setFields(prev => ({
              ...prev,
              documentImages: newImages,
              documentImageNames: newNames,
            }));
          }}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 8: MAPS
        ═══════════════════════════════════════════════════════════════ */}
        <BaseMapsSection
          title="Maps"
          sectionNumber={8}
          sectionId="sec-maps"
          latitude={fields.latitude || ''}
          longitude={fields.longitude || ''}
          technicalAddress={fields.addressAtSite || ''}
          propertyAddress={fields.addressAsPerDocument || fields.addressAtSite || ''}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Location Coordinates"
          locationMapImages={fields.locationMapImages || []}
          mouzaMapImages={fields.mouzaMapImages || []}
          sketchMapImages={fields.sketchMapImages || []}
          cadastralMapImages={fields.cadastralMapImages || []}
          bdaMapImages={fields.bdaMapImages || []}
          isReadOnly={isReadOnly}
          uploading={typeof uploading === 'string' && uploading.includes('Map')}
          onLatitudeChange={v => handleChange('latitude', v)}
          onLongitudeChange={v => handleChange('longitude', v)}
          onLocationMapUpload={e => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={idx => {
            setFields(prev => ({
              ...prev,
              locationMapImages: (prev.locationMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onMouzaMapUpload={e => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={idx => {
            setFields(prev => ({
              ...prev,
              mouzaMapImages: (prev.mouzaMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onSketchMapUpload={e => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={idx => {
            setFields(prev => ({
              ...prev,
              sketchMapImages: (prev.sketchMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onCadastralMapUpload={e => handleMapUpload('cadastralMapImages', e)}
          onCadastralMapRemove={idx => {
            setFields(prev => ({
              ...prev,
              cadastralMapImages: (prev.cadastralMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onBdaMapUpload={e => handleMapUpload('bdaMapImages', e)}
          onBdaMapRemove={idx => {
            setFields(prev => ({
              ...prev,
              bdaMapImages: (prev.bdaMapImages || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onReorderLocationMap={newImgs => handleChange('locationMapImages', newImgs)}
          onReorderMouzaMap={newImgs => handleChange('mouzaMapImages', newImgs)}
          onReorderSketchMap={newImgs => handleChange('sketchMapImages', newImgs)}
          onReorderCadastralMap={newImgs => handleChange('cadastralMapImages', newImgs)}
          onReorderBdaMap={newImgs => handleChange('bdaMapImages', newImgs)}
        />

        {/* ═══════════════════════════════════════════════════════════════
            SECTION 9: PHOTOGRAPHS
        ═══════════════════════════════════════════════════════════════ */}
        <BasePhotographsSection
          title="Photographs"
          sectionNumber={9}
          sectionId="sec-photographs"
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading === 'photos'}
          bucketCount={bucketImages.length}
          onImageNameChange={(idx, name) => {
            const next = [...(fields.propertyImageNames || [])];
            while (next.length <= idx) next.push('');
            next[idx] = name;
            handleChange('propertyImageNames', next);
          }}
          onRemoveImage={idx => {
            setFields(prev => ({
              ...prev,
              propertyImages: (prev.propertyImages || []).filter((_: any, i: number) => i !== idx),
              propertyImageNames: (prev.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
            }));
          }}
          onReorderImages={(newImages, newNames) => {
            setFields(prev => ({
              ...prev,
              propertyImages: newImages,
              propertyImageNames: newNames,
            }));
          }}
          onUploadImages={handlePhotoUpload}
          onOpenBucketPicker={() => setShowBucketModal(true)}
        />

        {/* ═══════════════════════════════════════════════════════════════
            REPORT ACTION BAR
        ═══════════════════════════════════════════════════════════════ */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={saving || submitting || previewing || !!uploading}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmitReport}
          onPreviewPDF={handlePreviewPdf}
          onDownloadPDF={handleDownloadPdf}
        />
      </div>

      {/* ── Floating Navigator Column ── */}
      <FloatingNavigator sections={navSections} />

      {/* ── Photo Bucket Picker Modal ── */}
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
                ...selectedUrls.map((_, i) => `Photograph ${((prev.propertyImages || []).length + i + 1)}`),
              ],
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
