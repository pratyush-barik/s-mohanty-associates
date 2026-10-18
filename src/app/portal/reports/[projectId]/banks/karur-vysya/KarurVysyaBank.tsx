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
} from 'lucide-react';

import { saveReportDraft } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  getEarliestFieldVisit,
  BankReportHeader,
  BankReportTitleCard,
  ActiveConfigBanner,
  FloatingNavigator,
  ReportActionBar,
  EarliestFieldVisitBadge,
  Field,
  Section,
  inputCls,
  selectCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  BasePhotoBucketModal,
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
import { PDFKarurVysyaRenderer } from '@/lib/banks/pdf-karur-vysya-renderer';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';

export const KARUR_VYSYA_CONFIG: BankConfig = {
  bankId: 'KARUR VYSYA BANK',
  subTemplateId: '',
  displayName: 'Karur Vysya Bank Limited',
  defaultValues: {
    purpose: 'Commercial / Industrial Valuation',
  },
};

export interface KarurVysyaBankProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
}

const DEFAULT_OWNERSHIP_DEEDS = '';

const DEFAULT_OTHER_DOCUMENTS = '';

const DEFAULT_REMARKS = `1  Legal aspects are out of scope of valuation.
2  Genuineness of original documents to be verified by the bank authorities before disbursement.
3  All the documents received by us are soft copies only. The bank should verify the authenticity for the documents.
4  The valuer is not responsible for any legal implications such as Any Court Cases, Land Acquisition Proceedings, Encroaches, Encumbrances, Defects in titles and any such other legal claims on the property.
5  This report is prepared on the basis of the copies of the limited documents as mentioned in the report.
6  The property is identified through an identifier & provided document received from bank only. Actual measured land area is more or less matched with Deed land area.
7  The subject property is well demarcated with boundary walls on all side.
8  This valuation report may give a completely different result if any of the assumptions mentioned above are found to be not true. Lenders should check and think of necessary mitigate, as may found suitable, in case of adverse situation, WRT future sale-ability in the open market, at this existing condition.
9  The basic civic amenities are all available within a minimum distance of approx. 2-8 Kms. from the subject property.
10 Thus, based on the above stated facts the Valuation of the subject property is recommended. Futuristic Complications will not be complying this report.`;

const DEFAULT_DECLARATIONS = `1  The information furnished in our valuation report is true and correct to best of my knowledge and belief and in an impartial and true valuation of the property.
2  We have no direct or indirect interest in the property valued.
3  Information furnished in the report is true and correct to the best of our knowledge and belief.
4  Fair market value indicated in the report is an opinion of the value prevailing on the date of the said report and is based on market feedback on values of similar properties. The client is free to obtain other independent opinions on the same. The fair, market value of such properties/localities may increase or decrease, depending on the future market conditions & scenarios. This report does not certify or confirm any ownership or title of the property that has been valued.
5  No structural survey was conducted by us.
6  We have deputed our representative to Inspect the property. Our representative has personally inspected the property.
7  We are not required to give testimony or appear in court by any reason of this appraisal report, with reference to the property in question.
8  We have also taken into consideration the slump in the market and the oversupply condition in the market. The demand for quality construction and maintenance for properties is also considered.
9  We have compared other comparable properties on the basis of many factors and as far as possible tried to remove/ account for the differences in type, location and quality of the properties.
10 Ownership papers may please be verified by the legal adviser at your end to ascertain the right title & area.`;

export default function KarurVysyaBank({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  onResetWizard,
}: KarurVysyaBankProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || userRole === 'viewer' || status === 'completed';

  const [form, setForm] = useState<any>(() => {
    const f = rawInitialFields || {};
    return {
      reportNumber: f.reportNumber || f.refNo || projectCode || '',
      dateOfReport: f.dateOfReport || f.reportDate || '',

      // 1. GENERAL
      applicantName: f.applicantName || prefill?.contactName || '',
      applicationNumber: f.applicationNumber || '',
      ownerName: f.ownerName || '',
      dateOfTechnicalVisit: f.dateOfTechnicalVisit || f.inspectionDate || (prefill as any)?.fieldVisitDate || '',
      buildingSocietyName: f.buildingSocietyName || '',
      builderSellerName: f.builderSellerName || '',
      personMetAtSite: f.personMetAtSite || '',

      // 2. DETAILS OF THE PROPERTY
      electricMeterNumber: f.electricMeterNumber || '',
      propertyType: f.propertyType || prefill?.propertyType || '',
      basement: f.basement || '',
      noOfStories: f.noOfStories || '',
      propertyLocatedOn: f.propertyLocatedOn || '',
      totalNoOfUnits: f.totalNoOfUnits || '',
      lift: f.lift || '',
      propertyConfiguration: f.propertyConfiguration || '',
      noOfBathrooms: f.noOfBathrooms || '',
      ageOfProperty: f.ageOfProperty || '',
      residualAge: f.residualAge || '',
      occupancyStatus: f.occupancyStatus || '',
      vacantDuration: f.vacantDuration || '',
      selfOccupiedDuration: f.selfOccupiedDuration || '',
      tenantDuration: f.tenantDuration || '',
      propertyAddressInitiation: f.propertyAddressInitiation || prefill?.propertyAddress || '',
      propertyAddressSite: f.propertyAddressSite || prefill?.propertyAddress || '',
      propertyAddressDocs: f.propertyAddressDocs || prefill?.propertyAddress || '',
      pinCode: f.pinCode || '',
      approvedBuildingUsage: f.approvedBuildingUsage || '',
      onSiteBuildingUsage: f.onSiteBuildingUsage || '',
      zoningMasterPlan: f.zoningMasterPlan || '',
      landClassification: f.landClassification || '',
      crzAsiRegulations: f.crzAsiRegulations || '',

      // 3. SURROUNDINGS, ACCESIBILITY & PROXIMITY
      distanceCityCenter: f.distanceCityCenter || '',
      nearestRailwayStation: f.nearestRailwayStation || '',
      nearestBusStand: f.nearestBusStand || '',
      nearestHospital: f.nearestHospital || '',
      widthOfApproachRoad: f.widthOfApproachRoad || '',
      nearbyLandmark: f.nearbyLandmark || '',
      typeOfLocality: f.typeOfLocality || '',
      occupancyRatio: f.occupancyRatio || '',
      developmentSurroundings: f.developmentSurroundings || '',
      plotDemarcatedAtSite: f.plotDemarcatedAtSite || '',
      demolitionRisk: f.demolitionRisk || '',
      propertyIdentifiedThrough: f.propertyIdentifiedThrough || '',
      municipalLimit: f.municipalLimit || '',

      // Boundaries Matrix
      boundNorthSite: f.boundNorthSite || '',
      boundNorthPlan: f.boundNorthPlan || '',
      boundSouthSite: f.boundSouthSite || '',
      boundSouthPlan: f.boundSouthPlan || '',
      boundEastSite: f.boundEastSite || '',
      boundEastPlan: f.boundEastPlan || '',
      boundWestSite: f.boundWestSite || '',
      boundWestPlan: f.boundWestPlan || '',
      boundariesMatching: f.boundariesMatching || '',
      boundariesDiscrepancy: f.boundariesDiscrepancy || '',

      // 4. SURVEY OF CONSTRUCTION
      typeOfConstruction: f.typeOfConstruction || '',
      qualityOfConstruction: f.qualityOfConstruction || '',
      exteriors: f.exteriors || '',
      interiors: f.interiors || '',
      amenitiesProvided: f.amenitiesProvided || '',
      constructionProgress: f.constructionProgress || '',
      completionStagePct: f.completionStagePct || '',
      recommendedStagePct: f.recommendedStagePct || '',

      // 5. DOCUMENTS VERIFIED
      approvedLayoutPlans: f.approvedLayoutPlans || '',
      approvedBuildingPlans: f.approvedBuildingPlans || '',
      commencementCertificate: f.commencementCertificate || '',
      buPermissionDetails: f.buPermissionDetails || '',
      reraNo: f.reraNo || '',
      ownershipProof: f.ownershipProof || DEFAULT_OWNERSHIP_DEEDS,
      otherDocuments: f.otherDocuments || DEFAULT_OTHER_DOCUMENTS,

      // 6. LAND & BUILDING AREA DETAILS
      landAreaSite: f.landAreaSite || '',
      landAreaPlan: f.landAreaPlan || '',
      landAreaDocs: f.landAreaDocs || '',
      shedAreaSite: f.shedAreaSite || '',
      shedAreaPlan: f.shedAreaPlan || '',
      shedAreaDocs: f.shedAreaDocs || '',
      rccAreaSite: f.rccAreaSite || '',
      rccAreaPlan: f.rccAreaPlan || '',
      rccAreaDocs: f.rccAreaDocs || '',
      violationDetails: f.violationDetails || '',

      // 7. VALUATION DETAILS
      valLandArea: f.valLandArea !== undefined ? String(f.valLandArea) : '0',
      valLandRate: f.valLandRate !== undefined ? String(f.valLandRate) : '0',
      valShedArea: f.valShedArea !== undefined ? String(f.valShedArea) : '0',
      valShedRate: f.valShedRate !== undefined ? String(f.valShedRate) : '0',
      valRccArea: f.valRccArea !== undefined ? String(f.valRccArea) : '0',
      valRccRate: f.valRccRate !== undefined ? String(f.valRccRate) : '0',
      valOtherLs: f.valOtherLs !== undefined ? String(f.valOtherLs) : '0',
      valSayTotal: f.valSayTotal !== undefined ? String(f.valSayTotal) : '0',

      // 8. GOVERNMENT VALUE
      govtLandArea: f.govtLandArea || '',
      govtLandRate: f.govtLandRate || '',
      govtLandVal: f.govtLandVal || '',
      govtConstArea: f.govtConstArea || '',
      govtConstRate: f.govtConstRate || '',
      govtConstVal: f.govtConstVal || '',
      govtTotalVal: f.govtTotalVal || '',

      // 9. REMARKS & DECLARATION
      remarks: f.remarks || DEFAULT_REMARKS,
      declarations: f.declarations || DEFAULT_DECLARATIONS,
      visitedPersonName: f.visitedPersonName || '',

      // Annexures
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
  // LIVE VALUATION MATHEMATICS (Section 7 & 9)
  // ═══════════════════════════════════════════════
  const landAreaNum = parseSafeFloat(form.valLandArea);
  const landRateNum = parseSafeFloat(form.valLandRate);
  const landValue = useMemo(() => multiplyExactDecimals(landAreaNum, landRateNum), [landAreaNum, landRateNum]);

  const shedAreaNum = parseSafeFloat(form.valShedArea);
  const shedRateNum = parseSafeFloat(form.valShedRate);
  const shedValue = useMemo(() => multiplyExactDecimals(shedAreaNum, shedRateNum), [shedAreaNum, shedRateNum]);

  const rccAreaNum = parseSafeFloat(form.valRccArea);
  const rccRateNum = parseSafeFloat(form.valRccRate);
  const rccValue = useMemo(() => multiplyExactDecimals(rccAreaNum, rccRateNum), [rccAreaNum, rccRateNum]);

  const otherLsNum = parseSafeFloat(form.valOtherLs);
  const exactTotal = useMemo(
    () => sumDecimals([landValue, shedValue, rccValue, otherLsNum]),
    [landValue, shedValue, rccValue, otherLsNum]
  );

  const sayTotalNum = useMemo(() => {
    const rawSay = parseSafeFloat(form.valSayTotal);
    return rawSay > 0 ? rawSay : exactTotal;
  }, [form.valSayTotal, exactTotal]);

  // Section 9 Metrics
  const realizableValue = useMemo(() => calculatePercentageValue(sayTotalNum, 90), [sayTotalNum]);
  const distressValue = useMemo(() => calculatePercentageValue(sayTotalNum, 80), [sayTotalNum]);
  const insurableValue = useMemo(() => sumDecimals([shedValue, rccValue]), [shedValue, rccValue]);

  // Upload Handlers
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
      const renderer = new PDFKarurVysyaRenderer({ ...form, projectCode });
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
      const renderer = new PDFKarurVysyaRenderer({ ...form, projectCode });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KVB_Valuation_${form.reportNumber || projectCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMessage({ text: 'Failed to download PDF: ' + err.message, type: 'error' });
    }
  };

  // 14 Floating Navigator Sections (0 numeric prefixes)
  const navSections = useMemo(
    () => [
      { id: 'sec-general', title: 'General Information' },
      { id: 'sec-property', title: 'Property Details' },
      { id: 'sec-surroundings', title: 'Surroundings & Boundaries' },
      { id: 'sec-construction', title: 'Survey of Construction' },
      { id: 'sec-documents', title: 'Documents Verified' },
      { id: 'sec-area-details', title: 'Area Details' },
      { id: 'sec-valuation', title: 'Valuation Details' },
      { id: 'sec-govt-val', title: 'Government Value' },
      { id: 'sec-final-val', title: 'Final Valuation & Insurance' },
      { id: 'sec-remarks', title: 'Remarks' },
      { id: 'sec-declaration', title: 'Declaration' },
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
          {/* Universal Standardized Bank Report Header */}
          <BankReportHeader
            clientType="organisation"
            category="Bank & FIS"
            bankName="Karur Vysya Bank Limited"
            subclass="Standard Valuation Format"
            onResetWizard={onResetWizard}
            title="Valuation Report Builder"
            description="Commercial / Industrial valuation format with 11 core sections, multi-deed legal matrix, and media annexures."
            earliestVisit={earliestVisit}
            projectCode={projectCode}
            status={status}
            message={message}
            onDismissMessage={() => setMessage(null)}
          />

          {/* 1. General Information */}
          <div id="sec-general">
            <Section title="General Information" number={1} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Report Number">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.reportNumber}
                    onChange={e => updateField('reportNumber', e.target.value)}
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
                <Field label="Date of Technical Visit">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.dateOfTechnicalVisit}
                    onChange={e => updateField('dateOfTechnicalVisit', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name of the Applicant">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.applicantName}
                    onChange={e => updateField('applicantName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Application Number (If Any)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.applicationNumber}
                    onChange={e => updateField('applicationNumber', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name of Owner (As per legal docs)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.ownerName}
                    onChange={e => updateField('ownerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Name of the Builder/Seller">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.builderSellerName}
                    onChange={e => updateField('builderSellerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name of The Building/Society">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.buildingSocietyName}
                    onChange={e => updateField('buildingSocietyName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Person Met at site and contact number">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.personMetAtSite}
                    onChange={e => updateField('personMetAtSite', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 2. Property Details */}
          <div id="sec-property">
            <Section title="Property Details" number={2} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Electric Meter Number">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.electricMeterNumber}
                    onChange={e => updateField('electricMeterNumber', e.target.value)}
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
                <Field label="Basement">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.basement}
                    onChange={e => updateField('basement', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="No. of Stories">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.noOfStories}
                    onChange={e => updateField('noOfStories', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property located on">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.propertyLocatedOn}
                    onChange={e => updateField('propertyLocatedOn', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Total no of units">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.totalNoOfUnits}
                    onChange={e => updateField('totalNoOfUnits', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Lift">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.lift}
                    onChange={e => updateField('lift', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No of Bathrooms">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.noOfBathrooms}
                    onChange={e => updateField('noOfBathrooms', sanitizePositiveInt(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property Configuration">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.propertyConfiguration}
                    onChange={e => updateField('propertyConfiguration', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Age of The property (Years)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.ageOfProperty}
                    onChange={e => updateField('ageOfProperty', sanitizePositiveInt(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Residual age of the Property (Years)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.residualAge}
                    onChange={e => updateField('residualAge', sanitizePositiveInt(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Occupancy Status">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.occupancyStatus}
                    onChange={e => updateField('occupancyStatus', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="If Vacant then from how long">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.vacantDuration}
                    onChange={e => updateField('vacantDuration', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="If Self Occupied then from how long">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.selfOccupiedDuration}
                    onChange={e => updateField('selfOccupiedDuration', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="If Tenant then from how long">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.tenantDuration}
                    onChange={e => updateField('tenantDuration', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Three-way Address Matrix */}
              <div className="space-y-4 pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Property Address Matrix</h3>
                <Field label="Property Address as per Initiation">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={form.propertyAddressInitiation}
                    onChange={e => updateField('propertyAddressInitiation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property Address as per Site">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={form.propertyAddressSite}
                    onChange={e => updateField('propertyAddressSite', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property Address as per Documents">
                  <textarea
                    rows={3}
                    className={inputCls}
                    value={form.propertyAddressDocs}
                    onChange={e => updateField('propertyAddressDocs', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <Field label="Pin Code">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.pinCode}
                    onChange={e => updateField('pinCode', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Approved Building Usage">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.approvedBuildingUsage}
                    onChange={e => updateField('approvedBuildingUsage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="On site Building Usage">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.onSiteBuildingUsage}
                    onChange={e => updateField('onSiteBuildingUsage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Zoning as per Master plan">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.zoningMasterPlan}
                    onChange={e => updateField('zoningMasterPlan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Classification of land as per IGRS/Regnet, Patta etc.">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.landClassification}
                    onChange={e => updateField('landClassification', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="CRZ/ASI regulations If any">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.crzAsiRegulations}
                    onChange={e => updateField('crzAsiRegulations', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 3. Surroundings & Boundaries */}
          <div id="sec-surroundings">
            <Section title="Surroundings & Boundaries" number={3} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Distance from City Center">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.distanceCityCenter}
                    onChange={e => updateField('distanceCityCenter', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nearest Railway Station">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.nearestRailwayStation}
                    onChange={e => updateField('nearestRailwayStation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nearest Bus Stand">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.nearestBusStand}
                    onChange={e => updateField('nearestBusStand', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nearest Hospital">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.nearestHospital}
                    onChange={e => updateField('nearestHospital', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Width of Approach Road">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.widthOfApproachRoad}
                    onChange={e => updateField('widthOfApproachRoad', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Nearby Land Mark">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.nearbyLandmark}
                    onChange={e => updateField('nearbyLandmark', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Type of Locality">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.typeOfLocality}
                    onChange={e => updateField('typeOfLocality', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Occupancy ratio in Project / Location">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.occupancyRatio}
                    onChange={e => updateField('occupancyRatio', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Development of surrounding areas">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.developmentSurroundings}
                    onChange={e => updateField('developmentSurroundings', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Demolition Risk">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.demolitionRisk}
                    onChange={e => updateField('demolitionRisk', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot/ Property Demarcated at Site">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.plotDemarcatedAtSite}
                    onChange={e => updateField('plotDemarcatedAtSite', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Property falls under Corporation / Municipality / Panchayat">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.municipalLimit}
                    onChange={e => updateField('municipalLimit', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="Property Identified through">
                <input
                  type="text"
                  className={inputCls}
                  value={form.propertyIdentifiedThrough}
                  onChange={e => updateField('propertyIdentifiedThrough', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              {/* Schedule Boundaries Comparison Table */}
              <div className="pt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Schedule Boundaries (Along with dimensions)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2.5 w-32">Direction</th>
                        <th className="px-4 py-2.5">As per Site</th>
                        <th className="px-4 py-2.5">As per Site Plan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">North</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundNorthSite}
                            onChange={e => updateField('boundNorthSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundNorthPlan}
                            onChange={e => updateField('boundNorthPlan', e.target.value)}
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
                            value={form.boundSouthSite}
                            onChange={e => updateField('boundSouthSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundSouthPlan}
                            onChange={e => updateField('boundSouthPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-slate-800">East</td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundEastSite}
                            onChange={e => updateField('boundEastSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundEastPlan}
                            onChange={e => updateField('boundEastPlan', e.target.value)}
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
                            value={form.boundWestSite}
                            onChange={e => updateField('boundWestSite', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-3 py-1.5">
                          <input
                            type="text"
                            className={inputCls}
                            value={form.boundWestPlan}
                            onChange={e => updateField('boundWestPlan', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <Field label="Whether Boundaries matching">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundariesMatching}
                      onChange={e => updateField('boundariesMatching', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Discrepancy found in Boundaries, if any please specify">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundariesDiscrepancy}
                      onChange={e => updateField('boundariesDiscrepancy', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </Section>
          </div>

          {/* 4. Survey of Construction */}
          <div id="sec-construction">
            <Section title="Survey of Construction" number={4} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Type of Construction">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.typeOfConstruction}
                    onChange={e => updateField('typeOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Quality of The Construction">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.qualityOfConstruction}
                    onChange={e => updateField('qualityOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Exteriors">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.exteriors}
                    onChange={e => updateField('exteriors', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Interiors">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.interiors}
                    onChange={e => updateField('interiors', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Amenities provided">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.amenitiesProvided}
                    onChange={e => updateField('amenitiesProvided', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Construction progress">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.constructionProgress}
                    onChange={e => updateField('constructionProgress', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Completion Stage of construction in %">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.completionStagePct}
                    onChange={e => updateField('completionStagePct', sanitizePercentage(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Recommended stage of construction in %">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.recommendedStagePct}
                    onChange={e => updateField('recommendedStagePct', sanitizePercentage(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </Section>
          </div>

          {/* 5. Documents Verified */}
          <div id="sec-documents">
            <Section title="Documents Verified" number={5} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Approved Layout Plans Details">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.approvedLayoutPlans}
                    onChange={e => updateField('approvedLayoutPlans', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Commencement Certificate">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.commencementCertificate}
                    onChange={e => updateField('commencementCertificate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="BU Permission Details">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.buPermissionDetails}
                    onChange={e => updateField('buPermissionDetails', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Approved Building Plans Details">
                  <textarea
                    rows={4}
                    className={inputCls}
                    value={form.approvedBuildingPlans}
                    onChange={e => updateField('approvedBuildingPlans', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="RERA No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.reraNo}
                    onChange={e => updateField('reraNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="Ownership Proof (Multi-Deed Matrix)">
                <textarea
                  rows={8}
                  className={`${inputCls} font-mono text-xs leading-relaxed`}
                  value={form.ownershipProof}
                  onChange={e => updateField('ownershipProof', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <Field label="Other documents (Land Conversion & Composite Plans)">
                <textarea
                  rows={6}
                  className={`${inputCls} font-mono text-xs leading-relaxed`}
                  value={form.otherDocuments}
                  onChange={e => updateField('otherDocuments', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 6. Area Details */}
          <div id="sec-area-details">
            <Section title="Area Details" number={6} defaultOpen={true}>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 w-40">Item</th>
                      <th className="px-4 py-2.5">As per Site</th>
                      <th className="px-4 py-2.5">As per Plan</th>
                      <th className="px-4 py-2.5">As per Document</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">Land</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.landAreaSite}
                          onChange={e => updateField('landAreaSite', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.landAreaPlan}
                          onChange={e => updateField('landAreaPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.landAreaDocs}
                          onChange={e => updateField('landAreaDocs', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">Shed area</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.shedAreaSite}
                          onChange={e => updateField('shedAreaSite', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.shedAreaPlan}
                          onChange={e => updateField('shedAreaPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.shedAreaDocs}
                          onChange={e => updateField('shedAreaDocs', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">RCC area</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.rccAreaSite}
                          onChange={e => updateField('rccAreaSite', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.rccAreaPlan}
                          onChange={e => updateField('rccAreaPlan', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.rccAreaDocs}
                          onChange={e => updateField('rccAreaDocs', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Field label="Violation Details if any">
                <input
                  type="text"
                  className={inputCls}
                  value={form.violationDetails}
                  onChange={e => updateField('violationDetails', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 7. Valuation Details */}
          <div id="sec-valuation">
            <Section title="Valuation Details" number={7} defaultOpen={true}>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 w-48">Item</th>
                      <th className="px-4 py-2.5 w-40">Area (Sq. ft.)</th>
                      <th className="px-4 py-2.5 w-40">Rate (Rs / Sq. ft.)</th>
                      <th className="px-4 py-2.5 text-right">Subtotal Value (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {/* Land */}
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        Land
                        <span className="block text-xs text-slate-500 font-normal">(including land development)</span>
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valLandArea}
                          onChange={e => updateField('valLandArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valLandRate}
                          onChange={e => updateField('valLandRate', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹ {formatIndianCurrency(landValue)}
                      </td>
                    </tr>

                    {/* Construction-Shed */}
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        Construction-Shed
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valShedArea}
                          onChange={e => updateField('valShedArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valShedRate}
                          onChange={e => updateField('valShedRate', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹ {formatIndianCurrency(shedValue)}
                      </td>
                    </tr>

                    {/* Construction-RCC */}
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        Construction-RCC
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valRccArea}
                          onChange={e => updateField('valRccArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.valRccRate}
                          onChange={e => updateField('valRccRate', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900">
                        ₹ {formatIndianCurrency(rccValue)}
                      </td>
                    </tr>

                    {/* Other LS Cost */}
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">
                        Other LS cost if any
                      </td>
                      <td className="px-3 py-1.5 text-slate-400">—</td>
                      <td className="px-3 py-1.5 text-slate-400">—</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={`${inputCls} text-right font-mono font-bold`}
                          value={form.valOtherLs}
                          onChange={e => updateField('valOtherLs', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Totals Summary Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calculated Exact Total</span>
                  <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
                    ₹ {formatIndianCurrency(exactTotal)}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Sum of Land + Shed + RCC + LS Cost</p>
                </div>
                <Field label="Rounded Value / Say Total (Rs)">
                  <input
                    type="text"
                    className={`${inputCls} text-lg font-bold font-mono text-emerald-700 bg-emerald-50/30 border-emerald-300`}
                    value={form.valSayTotal}
                    onChange={e => updateField('valSayTotal', sanitizePositiveInt(e.target.value))}
                    disabled={isReadOnly}
                  />
                  <p className="text-xs text-slate-500 mt-1">Adopted as final Fair Market Value (FMV)</p>
                </Field>
              </div>
            </Section>
          </div>

          {/* 8. Government Value */}
          <div id="sec-govt-val">
            <Section title="Government Value" number={8} defaultOpen={true}>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5 w-64">Item</th>
                      <th className="px-4 py-2.5 w-40">Area</th>
                      <th className="px-4 py-2.5">Rate in Rs/unit</th>
                      <th className="px-4 py-2.5 w-48 text-right">Value (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">Govt. Assessed Value (Land)</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.govtLandArea}
                          onChange={e => updateField('govtLandArea', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.govtLandRate}
                          onChange={e => updateField('govtLandRate', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={`${inputCls} text-right font-mono font-bold`}
                          value={form.govtLandVal}
                          onChange={e => updateField('govtLandVal', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium text-slate-800">Govt. Assessed Value (Construction)</td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.govtConstArea}
                          onChange={e => updateField('govtConstArea', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={inputCls}
                          value={form.govtConstRate}
                          onChange={e => updateField('govtConstRate', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-3 py-1.5">
                        <input
                          type="text"
                          className={`${inputCls} text-right font-mono`}
                          value={form.govtConstVal}
                          onChange={e => updateField('govtConstVal', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <Field label="Total Govt. Assessed Value">
                <input
                  type="text"
                  className={`${inputCls} font-bold font-mono text-base`}
                  value={form.govtTotalVal}
                  onChange={e => updateField('govtTotalVal', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 9. Final Valuation & Insurance */}
          <div id="sec-final-val">
            <Section title="Final Valuation & Insurance" number={9} defaultOpen={true}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FMV Card */}
                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">Total Fair Market Value (FMV)</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold">100%</span>
                  </div>
                  <div className="text-2xl font-black text-blue-950 font-mono">
                    ₹ {formatIndianCurrency(sayTotalNum)}
                  </div>
                  <p className="text-xs text-blue-800/80 font-medium italic">
                    {rupeesInWords(sayTotalNum)}
                  </p>
                </div>

                {/* Realizable Value Card */}
                <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Total Realizable Value</span>
                    <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold">90% of FMV</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-950 font-mono">
                    ₹ {formatIndianCurrency(realizableValue)}
                  </div>
                  <p className="text-xs text-emerald-800/80 font-medium italic">
                    {rupeesInWords(realizableValue)}
                  </p>
                </div>

                {/* Distress Value Card */}
                <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">Distress Value / Force Sale Value</span>
                    <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold">80% of FMV</span>
                  </div>
                  <div className="text-2xl font-black text-amber-950 font-mono">
                    ₹ {formatIndianCurrency(distressValue)}
                  </div>
                  <p className="text-xs text-amber-800/80 font-medium italic">
                    {rupeesInWords(distressValue)}
                  </p>
                </div>

                {/* Insurable Value Card */}
                <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wider">Insurable Value of Building</span>
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold">Shed + RCC</span>
                  </div>
                  <div className="text-2xl font-black text-purple-950 font-mono">
                    ₹ {formatIndianCurrency(insurableValue)}
                  </div>
                  <p className="text-xs text-purple-800/80 font-medium italic">
                    {rupeesInWords(insurableValue)}
                  </p>
                </div>
              </div>
            </Section>
          </div>

          {/* 10. Remarks */}
          <div id="sec-remarks">
            <Section title="Remarks" number={10} defaultOpen={true}>
              <Field label="Remarks & Specific Clauses">
                <textarea
                  rows={14}
                  className={`${inputCls} text-xs leading-relaxed`}
                  value={form.remarks}
                  onChange={e => updateField('remarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </Section>
          </div>

          {/* 11. Declaration */}
          <div id="sec-declaration">
            <Section title="Declaration" number={11} defaultOpen={true}>
              <Field label="Declaration Clauses">
                <textarea
                  rows={12}
                  className={`${inputCls} text-xs leading-relaxed`}
                  value={form.declarations}
                  onChange={e => updateField('declarations', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Field label="Visited Person Name (Representative)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.visitedPersonName}
                    onChange={e => updateField('visitedPersonName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                  <span className="font-bold text-slate-800">Authorized Signatory:</span>
                  <p>S. MOHANTY ASSOCIATES</p>
                  <p>Empanelled Valuer & Chartered Engineer</p>
                </div>
              </div>
            </Section>
          </div>

          {/* 12. Documents */}
          <div id="sec-documents-annexure">
            <BaseDocumentsSection
              title="Documents"
              sectionId="sec-documents-annexure"
              sectionNumber={12}
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

          {/* 13. Maps */}
          <div id="sec-maps-annexure">
            <BaseMapsSection
              title="Maps"
              sectionId="sec-maps-annexure"
              sectionNumber={13}
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

          {/* 14. Photographs */}
          <div id="sec-photos-annexure">
            <BasePhotographsSection
              title="Photographs"
              sectionId="sec-photos-annexure"
              sectionNumber={14}
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
