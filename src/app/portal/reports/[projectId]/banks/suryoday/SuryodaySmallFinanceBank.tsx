'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronDown,
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
  ActiveConfigBanner,
  FloatingNavigator,
  ReportActionBar,
  getEarliestFieldVisit,
  EarliestFieldVisitBadge,
  Field,
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
    return {
      applicationNo: f.applicationNo || projectCode || 'APP-2024-0529',
      dateOfInspection: f.dateOfInspection || (prefill as any)?.fieldVisitDate || '29.05.2024',
      dateOfReport: f.dateOfReport || '29.05.2024',

      // Section A: General details
      customerName: f.customerName || prefill?.contactName || 'Samir Kumar Mohanty, Mob- 9437077899 / 9338011499',
      currentOwner: f.currentOwner || 'Samir Kumar Mohanty, S/O- Hadibandhu Mohanty',
      proposedOwner: f.proposedOwner || 'Samir Kumar Mohanty, S/O- Hadibandhu Mohanty',
      propertyAddressDocs: f.propertyAddressDocs || prefill?.propertyAddress || 'Khata No-77, Plot No-230(AC.0.080Decs,Homestead),Mouza-Cuttack Sahara Unit no-31 Gonadola,Tahasil-Cuttack,PS-Madhupatna,Dist-Cuttack,Odisha,Pin-753013',
      propertyAddressInspection: f.propertyAddressInspection || prefill?.propertyAddress || 'Khata No-77, Plot No-230(AC.0.080Decs,Homestead),Mouza-Cuttack Sahara Unit no-31 Gonadola,Tahasil-Cuttack,PS-Madhupatna,Dist-Cuttack,Odisha,Pin-753013',
      landmark: f.landmark || 'Near Kusuma Devi Owmens College, Kalyani Nagar',
      latLong: f.latLong || 'LAT:-20.449170, LONG- 85.905970',
      propertyIdentifiedThrough: f.propertyIdentifiedThrough || 'Mr. Samir Kumar Mohanty, Mob- 9437077899 / 9338011499',
      occupiedBy: f.occupiedBy || 'Tenants',
      occupiedSince: f.occupiedSince || '2012',

      // Section B: Surrounding locality details
      withinLimitationOf: f.withinLimitationOf || 'Within CDA limit',
      habitationVicinity: f.habitationVicinity || 'Residential',
      classificationLocality: f.classificationLocality || 'Middle class',
      approachRoadCondition: f.approachRoadCondition || '10-Feet wide Road',
      amenitiesAvailability: f.amenitiesAvailability || 'Within 1-2 Kms',

      // Section C: Property details
      propertyDescription: f.propertyDescription || 'Subject property is a G+2 residential building',
      propertyType: f.propertyType || prefill?.propertyType || 'Residential',
      propertyUsage: f.propertyUsage || 'Residential',

      // Boundaries
      boundaryEastSite: f.boundaryEastSite || 'Others building(Plot no-667)',
      boundaryEastDeed: f.boundaryEastDeed || 'Plot no-667',
      boundaryWestSite: f.boundaryWestSite || '10-Feet wide Road',
      boundaryWestDeed: f.boundaryWestDeed || 'Passage Road',
      boundaryNorthSite: f.boundaryNorthSite || 'Others building',
      boundaryNorthDeed: f.boundaryNorthDeed || 'Vijilance Colony',
      boundarySouthSite: f.boundarySouthSite || 'Others building(Manmath Mohanty & Plot no-233)',
      boundarySouthDeed: f.boundarySouthDeed || 'Manmath Mohanty & Plot no-233',
      boundaryRemark: f.boundaryRemark || 'Boundary matches as per sale deed',
      plotDemarcated: f.plotDemarcated || 'No',

      // Section D: Structural details
      typeOfStructure: f.typeOfStructure || 'RCC framed structure',
      noOfFloorsSiteAndPlan: f.noOfFloorsSiteAndPlan || 'Plan not provide',
      noOfWings: f.noOfWings || 'NA',
      noOfFlatsPerFloor: f.noOfFlatsPerFloor || 'NA',
      noOfLifts: f.noOfLifts || 'NA',
      constructionProgress: f.constructionProgress || '100%',
      constructionRecommend: f.constructionRecommend || '100%',
      ageOfProperty: f.ageOfProperty || '12-Years',
      futureLife: f.futureLife || '48-Years',
      qualityOfConstruction: f.qualityOfConstruction || 'Good',

      // Section E: Documents details
      saleDeedDetails: f.saleDeedDetails || 'Copy of sale deed, ROR, Sketch map',
      constructionPermission: f.constructionPermission || 'Plan not provide',
      completionCertificate: f.completionCertificate || 'NA',
      approvedBuildingPlan: f.approvedBuildingPlan || 'Plan not provide',
      landTenure: f.landTenure || 'Freehold',
      otherDocuments: f.otherDocuments || 'NA',
      reraApplicable: f.reraApplicable || 'Not applicable',
      reraRegNo: f.reraRegNo || 'REG No:-NA',

      // Section F: Valuation & Market Rates
      readyReckonerRate: f.readyReckonerRate || 'Not Available',
      marketRateVicinity: f.marketRateVicinity || 'Rs.3000/- to Rs.3500/- per sqft of land',
      inquiriesFrom: f.inquiriesFrom || 'Broker & Local Market',

      // Section G: Area details for Land & Building
      areaApprovedPlan: f.areaApprovedPlan || 'Plan not provide',
      areaDocument: f.areaDocument || 'Land are=3484sqft',
      areaSiteMeasurement: f.areaSiteMeasurement || 'Land are=3484sqft, GF-1311sqft, FF-1311sqft, SF-1311sqft',
      areaConsideredFar: f.areaConsideredFar || 'Land are=3484sqft, GF-1311sqft, FF-1311sqft, SF-1311sqft',
      deviationSanctionPlan: f.deviationSanctionPlan || 'NA',
      riskOfDemolition: f.riskOfDemolition || 'Low',

      // Section H: Land & Building Valuation
      landArea: f.landArea || '3484',
      landRate: f.landRate || '3100',
      landRemark: f.landRemark || 'Adopted market rate',

      buildingRows: f.buildingRows || [
        { id: '1', floor: 'G+2', area: '3933', rate: '1500', stage: '100' },
        { id: '2', floor: 'SF', area: '0', rate: '0', stage: '100' },
        { id: '3', floor: 'TF', area: '0', rate: '0', stage: '100' },
      ],

      constructionEstimateCustomer: f.constructionEstimateCustomer || 'NA',

      // Section I: Flat / Shop Area Details
      flatAreaApprovedPlan: f.flatAreaApprovedPlan || '3343',
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
      remarks: f.remarks || 'Subject property is a residential premises having land extent of 3484Sqft, contains two buildng units. One G+2 RCC building having total measured BUA 3933sqft. Another asbestos roofing house having measured BUA 2000sqft. Age of the property is about 12-Years. Approved plan is not provided. Property is accessible with 10-feet wide Road. All civic amenities are present within 1-2 kms from the property. Entire building is used by multi tenants for residential purpose. Valuation has been done for land & measured BUA of G+2 RCC building, as actual BUA is coming within permissible FAR (FAR-1.5 as per CDA norms). Asbestos roofing BUA value is not considered, as it is temporary in nature.',

      // Section M: Marketability
      marketabilityForSale: f.marketabilityForSale || 'Average marketability with selling period in range of 1 to 6 months',
      marketabilityForLease: f.marketabilityForLease || 'NA-',

      // Section N: Declaration
      inspectingEngineer: f.inspectingEngineer || 'Deepak Bhoi',
      inspectionDate: f.inspectionDate || '29.05.2024',
      reportDate: f.reportDate || '29.05.2024',
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
    setForm((prev: any) => {
      if (prev.buildingRows.length <= 1) return prev;
      const nextRows = prev.buildingRows.filter((_: any, i: number) => i !== index);
      return { ...prev, buildingRows: nextRows };
    });
  };

  // ═══════════════════════════════════════════════
  // MEDIA UPLOADS
  // ═══════════════════════════════════════════════
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

  // Floating Navigator Sections (0 numeric prefixes)
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

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    'sec-general': true,
    'sec-surrounding': true,
    'sec-property': true,
    'sec-structural': true,
    'sec-documents': true,
    'sec-valuation-market': true,
    'sec-area-details': true,
    'sec-land-building-val': true,
    'sec-flat-area-details': true,
    'sec-sales-comparison': true,
    'sec-observations': true,
    'sec-marketability': true,
    'sec-schedule-i': true,
    'sec-documents-annexure': true,
    'sec-maps-annexure': true,
    'sec-photos-annexure': true,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800">
      {/* Active Configuration Banner */}
      <ActiveConfigBanner
        clientType="organisation"
        category="Bank & FIS"
        bankName="SURYODAY SMALL FINANCE BANK"
        onResetWizard={onResetWizard}
        sticky={false}
      />

      {/* Floating Navigator */}
      <FloatingNavigator sections={navSections} />

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Title Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full border border-amber-200">
                Suryoday Small Finance Bank Limited
              </span>
              <span className="text-xs text-slate-400">|</span>
              <span className="text-xs text-slate-500 font-medium">Standard Format</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">Valuation Report Builder</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Dual valuation engines (Land & Building + Sales Comparison Approach) with Schedule I construction matrix.
            </p>
          </div>
          {earliestVisit && (
            <EarliestFieldVisitBadge fieldVisit={earliestVisit} />
          )}
        </div>

        {/* 1. General Details */}
        <div id="sec-general" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-general')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Building className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">General Details</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-general'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-general'] && (
            <div className="p-6 space-y-4">
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
            </div>
          )}
        </div>

        {/* 2. Surrounding Locality */}
        <div id="sec-surrounding" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-surrounding')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <MapPin className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Surrounding Locality</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-surrounding'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-surrounding'] && (
            <div className="p-6 space-y-4">
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
                <Field label="Habitation & Vicinity">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.habitationVicinity}
                    onChange={e => updateField('habitationVicinity', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Classification of Locality">
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
                <Field label="Condition of approach road along with width">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.approachRoadCondition}
                    onChange={e => updateField('approachRoadCondition', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Availability of Amenities (water, drainage, power) & distance">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.amenitiesAvailability}
                    onChange={e => updateField('amenitiesAvailability', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* 3. Property Details & Boundaries */}
        <div id="sec-property" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-property')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Property Details & Boundaries</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-property'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-property'] && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Description of Property">
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
                <Field label="Type of Usage of Entire Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.propertyUsage}
                    onChange={e => updateField('propertyUsage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* 4-Direction Boundaries Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden mt-4">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-700 uppercase tracking-wide">
                  Boundaries Comparison
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-3 gap-3 font-semibold text-xs text-slate-500 border-b border-slate-200 pb-2">
                    <div>Direction</div>
                    <div>As Per Site</div>
                    <div>As Per Sale Deed</div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-center">
                    <span className="text-sm font-semibold text-slate-700">East</span>
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundaryEastSite}
                      onChange={e => updateField('boundaryEastSite', e.target.value)}
                      disabled={isReadOnly}
                    />
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundaryEastDeed}
                      onChange={e => updateField('boundaryEastDeed', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-center">
                    <span className="text-sm font-semibold text-slate-700">West</span>
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundaryWestSite}
                      onChange={e => updateField('boundaryWestSite', e.target.value)}
                      disabled={isReadOnly}
                    />
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundaryWestDeed}
                      onChange={e => updateField('boundaryWestDeed', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-center">
                    <span className="text-sm font-semibold text-slate-700">North</span>
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundaryNorthSite}
                      onChange={e => updateField('boundaryNorthSite', e.target.value)}
                      disabled={isReadOnly}
                    />
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundaryNorthDeed}
                      onChange={e => updateField('boundaryNorthDeed', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 items-center">
                    <span className="text-sm font-semibold text-slate-700">South</span>
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundarySouthSite}
                      onChange={e => updateField('boundarySouthSite', e.target.value)}
                      disabled={isReadOnly}
                    />
                    <input
                      type="text"
                      className={inputCls}
                      value={form.boundarySouthDeed}
                      onChange={e => updateField('boundarySouthDeed', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <Field label="Remark on Boundaries">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.boundaryRemark}
                    onChange={e => updateField('boundaryRemark', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Plot demarcated at site">
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
            </div>
          )}
        </div>

        {/* 4. Structural Details */}
        <div id="sec-structural" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-structural')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Building className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Structural Details</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-structural'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-structural'] && (
            <div className="p-6 space-y-4">
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
                <Field label="No. of floors as per site and as per Plan">
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

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Flats on each floor & unit position">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.noOfFlatsPerFloor}
                    onChange={e => updateField('noOfFlatsPerFloor', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="No. of lifts in Building">
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
                <Field label="Future Life of Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.futureLife}
                    onChange={e => updateField('futureLife', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Quality of Construction">
                  <select
                    className={selectCls}
                    value={form.qualityOfConstruction}
                    onChange={e => updateField('qualityOfConstruction', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                  </select>
                </Field>
                <Field label="Stage of Construction - Progress">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.constructionProgress}
                    onChange={e => updateField('constructionProgress', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Stage of Construction - Recommend">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.constructionRecommend}
                    onChange={e => updateField('constructionRecommend', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* 5. Document Details */}
        <div id="sec-documents" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-documents')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Document Details</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-documents'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-documents'] && (
            <div className="p-6 space-y-4">
              <Field label="Sale Deed or Agreement for Sale (Parties, Date, Regd. No., SRO, Amount)">
                <input
                  type="text"
                  className={inputCls}
                  value={form.saleDeedDetails}
                  onChange={e => updateField('saleDeedDetails', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Construction Permission (Authority & Sanction No.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.constructionPermission}
                    onChange={e => updateField('constructionPermission', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Completion Certificate">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.completionCertificate}
                    onChange={e => updateField('completionCertificate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Approved Building Plan (Sanction No & Date)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.approvedBuildingPlan}
                    onChange={e => updateField('approvedBuildingPlan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Land Tenure">
                  <select
                    className={selectCls}
                    value={form.landTenure}
                    onChange={e => updateField('landTenure', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Freehold">Freehold</option>
                    <option value="Leasehold">Leasehold</option>
                  </select>
                </Field>
                <Field label="Other Documents if any">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.otherDocuments}
                    onChange={e => updateField('otherDocuments', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="RERA Status">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.reraApplicable}
                    onChange={e => updateField('reraApplicable', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="RERA Registration No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.reraRegNo}
                    onChange={e => updateField('reraRegNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* 6. Valuation & Market Rates */}
        <div id="sec-valuation-market" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-valuation-market')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Valuation & Market Rates</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-valuation-market'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-valuation-market'] && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Ready Reckoner Rate">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.readyReckonerRate}
                    onChange={e => updateField('readyReckonerRate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Market Rates Range (vicinity/sqft)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.marketRateVicinity}
                    onChange={e => updateField('marketRateVicinity', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Inquiries Made From">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.inquiriesFrom}
                    onChange={e => updateField('inquiriesFrom', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* 7. Area Details (Land & Building) */}
        <div id="sec-area-details" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-area-details')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Area Details (Land & Building)</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-area-details'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-area-details'] && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Land Area & BUA as per Approved Plan (Sq. Ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.areaApprovedPlan}
                    onChange={e => updateField('areaApprovedPlan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Land Area & BUA as per Document (Sq. Ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.areaDocument}
                    onChange={e => updateField('areaDocument', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Land Area & BUA as per Site Measurement (Sq. Ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.areaSiteMeasurement}
                    onChange={e => updateField('areaSiteMeasurement', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Area Considered for Valuation (Sq. Ft.) as per FAR=1.5">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.areaConsideredFar}
                    onChange={e => updateField('areaConsideredFar', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Deviation from Sanction Plan / Building Byelaws">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.deviationSanctionPlan}
                    onChange={e => updateField('deviationSanctionPlan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Risk of Demolition (Valuer's Views)">
                  <select
                    className={selectCls}
                    value={form.riskOfDemolition}
                    onChange={e => updateField('riskOfDemolition', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="Low">Low</option>
                    <option value="Nil">Nil</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* 8. Land & Building Valuation (Section H) */}
        <div id="sec-land-building-val" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-land-building-val')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Land & Building Valuation</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-land-building-val'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-land-building-val'] && (
            <div className="p-6 space-y-6">
              {/* Land Component */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">1. Land Valuation</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <Field label="Land Area (Sq. Ft.)">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.landArea}
                      onChange={e => updateField('landArea', sanitizePositiveFloat(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Rate Adopted (Rs./Sq. Ft.)">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.landRate}
                      onChange={e => updateField('landRate', sanitizePositiveFloat(e.target.value))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Land Value (Rs.)</label>
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold rounded-lg text-sm">
                      ₹ {formatIndianCurrency(landValue)}
                    </div>
                  </div>
                  <Field label="Remark (if any)">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.landRemark}
                      onChange={e => updateField('landRemark', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>

              {/* Building Component (RCC Roofing) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">2. Built-up Area Valuation (RCC Roofing Only)</h3>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleAddBuildingRow}
                      className="px-2.5 py-1 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Floor
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-xs font-semibold text-slate-500 pb-1">
                    <div className="col-span-3">Floor / Description</div>
                    <div className="col-span-2">BUA (Sq. Ft.)</div>
                    <div className="col-span-2">Rate (Rs./Sq. Ft.)</div>
                    <div className="col-span-2">Stage (%)</div>
                    <div className="col-span-2 text-right">Building Value (Rs.)</div>
                    <div className="col-span-1"></div>
                  </div>

                  {(form.buildingRows || []).map((row: BuildingRow, idx: number) => {
                    const rowArea = parseSafeFloat(row.area);
                    const rowRate = parseSafeFloat(row.rate);
                    const rowStage = parseSafeFloat(row.stage || 100);
                    const rowFull = multiplyExactDecimals(rowArea, rowRate);
                    const rowVal = calculatePercentageValue(rowFull, rowStage);

                    return (
                      <div key={row.id || idx} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-3">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.floor}
                            onChange={e => handleBuildingRowChange(idx, 'floor', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.area}
                            onChange={e => handleBuildingRowChange(idx, 'area', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.rate}
                            onChange={e => handleBuildingRowChange(idx, 'rate', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={row.stage}
                            onChange={e => handleBuildingRowChange(idx, 'stage', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </div>
                        <div className="col-span-2 text-right font-semibold text-slate-800 text-sm">
                          ₹ {formatIndianCurrency(rowVal)}
                        </div>
                        <div className="col-span-1 flex justify-center">
                          {!isReadOnly && form.buildingRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveBuildingRow(idx)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-700 uppercase">Total Building Value</span>
                  <span className="text-base font-extrabold text-indigo-700">₹ {formatIndianCurrency(totalBuildingValue)}</span>
                </div>
              </div>

              {/* Valuation Summary Box */}
              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
                <h3 className="text-sm font-bold text-indigo-900">Valuation Summary & Distress Computation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex justify-between p-2.5 bg-white rounded-lg border border-indigo-100">
                    <span className="text-slate-600 font-medium">3. Fair Market Value (Present Stage) [1+2]:</span>
                    <span className="font-bold text-slate-900">₹ {formatIndianCurrency(presentFMV)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-lg border border-indigo-100">
                    <span className="text-slate-600 font-medium">4. Total Value of Building (100% Completed):</span>
                    <span className="font-bold text-slate-900">₹ {formatIndianCurrency(totalCompletedBuildingValue)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-lg border border-indigo-100">
                    <span className="text-slate-600 font-medium">5. Fair Market Value (100% Completed) [1+4]:</span>
                    <span className="font-bold text-slate-900">₹ {formatIndianCurrency(completedFMV)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-amber-50 rounded-lg border border-amber-200">
                    <span className="text-amber-800 font-bold">6. Forced / Distress Sale Value (80%):</span>
                    <span className="font-extrabold text-amber-900">₹ {formatIndianCurrency(distressValue)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-lg border border-indigo-100">
                    <span className="text-slate-600 font-medium">7. Replacement Value for Insurance:</span>
                    <span className="font-bold text-slate-900">₹ {formatIndianCurrency(replacementInsuranceValue)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 bg-white rounded-lg border border-indigo-100">
                    <span className="text-slate-600 font-medium">II) Justified Value of Building:</span>
                    <span className="font-bold text-slate-900">₹ {formatIndianCurrency(replacementInsuranceValue)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Field label="I) Construction estimate given by customer">
                    <input
                      type="text"
                      className={inputCls}
                      value={form.constructionEstimateCustomer}
                      onChange={e => updateField('constructionEstimateCustomer', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 9. Flat / Shop Area Details (Section I) */}
        <div id="sec-flat-area-details" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-flat-area-details')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Building className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Flat / Shop Area Details</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-flat-area-details'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-flat-area-details'] && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Area as per Approved Plan (Carpet) (Sq. Ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatAreaApprovedPlan}
                    onChange={e => updateField('flatAreaApprovedPlan', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Area as per Site Measurement (Carpet)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatAreaSiteMeasurement}
                    onChange={e => updateField('flatAreaSiteMeasurement', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Area as per Document (Carpet/BUA/SBUA)">
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
                <Field label="Super Built-up Area (Sq. Ft.) based on calculation">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatSuperBuiltUpArea}
                    onChange={e => updateField('flatSuperBuiltUpArea', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Deviation from Sanction Plan / Byelaws">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatDeviation}
                    onChange={e => updateField('flatDeviation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Risk of Demolition">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.flatRiskDemolition}
                    onChange={e => updateField('flatRiskDemolition', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          )}
        </div>

        {/* 10. Sales Comparison Valuation (Section J) */}
        <div id="sec-sales-comparison" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-sales-comparison')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Sales Comparison Valuation</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-sales-comparison'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-sales-comparison'] && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Super Built-Up Area (Sq. Ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesSbua}
                    onChange={e => updateField('salesSbua', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Rate Adopted (Rs./Sq. Ft.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesRate}
                    onChange={e => updateField('salesRate', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Other Amenities Value (Rs.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesAmenities}
                    onChange={e => updateField('salesAmenities', sanitizePositiveFloat(e.target.value))}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="1. Fair Market Value (100% Completed)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesFmvCompleted}
                    onChange={e => updateField('salesFmvCompleted', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="2. Stage of Construction">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesStage}
                    onChange={e => updateField('salesStage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="3. Fair Market Value (Present Stage)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesFmvPresent}
                    onChange={e => updateField('salesFmvPresent', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="4. Forced / Distress Sale Value (80%)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.salesDistressVal}
                    onChange={e => updateField('salesDistressVal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <Field label="5. Replacement Value for Insurance Purposes">
                <input
                  type="text"
                  className={inputCls}
                  value={form.salesInsuranceVal}
                  onChange={e => updateField('salesInsuranceVal', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          )}
        </div>

        {/* 11. Observations & Remarks */}
        <div id="sec-observations" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-observations')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Observations & Remarks</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-observations'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-observations'] && (
            <div className="p-6 space-y-4">
              <Field label="Observation (if any)">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={form.observations}
                  onChange={e => updateField('observations', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Remarks (if any)">
                <textarea
                  rows={6}
                  className={inputCls}
                  value={form.remarks}
                  onChange={e => updateField('remarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          )}
        </div>

        {/* 12. Marketability & Declaration */}
        <div id="sec-marketability" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-marketability')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Marketability & Declaration</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-marketability'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-marketability'] && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="For Sale (Selling Period)">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.marketabilityForSale}
                    onChange={e => updateField('marketabilityForSale', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="For Lease – Estimated Rental Income">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.marketabilityForLease}
                    onChange={e => updateField('marketabilityForLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide">Valuer Declaration Terms (Items 1 - 7)</h3>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
                  <li>Property was Inspected by our Engineer Mr. {form.inspectingEngineer || 'Deepak Bhoi'} on dated-{form.inspectionDate || '29.05.2024'}.</li>
                  <li>I have no direct or indirect interest in the property valued.</li>
                  <li>Information furnished in the report is true and correct to the best of my knowledge and belief.</li>
                  <li>Documents to be verified at your end to ascertain the right title & areas.</li>
                  <li>Fair market value is an opinion based on prevailing market conditions and does not certify title.</li>
                  <li>Validity of this report is for 45 days from date.</li>
                  <li>Area considered for valuation are as per Norms & ByLaws.</li>
                </ul>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Inspecting Engineer">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.inspectingEngineer}
                    onChange={e => updateField('inspectingEngineer', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Inspection Date">
                  <input
                    type="text"
                    className={inputCls}
                    value={form.inspectionDate}
                    onChange={e => updateField('inspectionDate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Report Date">
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
            </div>
          )}
        </div>

        {/* 13. Schedule I - Stage of Construction */}
        <div id="sec-schedule-i" className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('sec-schedule-i')}
            className="w-full px-6 py-4 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors border-b border-slate-200 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <Layers className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Schedule I - Stage of Construction</h2>
            </div>
            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${openSections['sec-schedule-i'] ? 'rotate-180' : ''}`} />
          </button>
          {openSections['sec-schedule-i'] && (
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 italic">
                Construction stage is considered based on Building activity / work / Progress, not as per individual Floor / Flat.
              </p>

              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase">
                    <tr>
                      <th className="px-4 py-2.5">Schedule I Activity</th>
                      <th className="px-4 py-2.5">Proposed (%)</th>
                      <th className="px-4 py-2.5">Completed Work on Site</th>
                      <th className="px-4 py-2.5">Progress (%)</th>
                      <th className="px-4 py-2.5">Recommend (%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(form.scheduleIRows || []).map((row: ScheduleRow, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 font-medium text-slate-800">{row.activity}</td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            value={row.proposed}
                            onChange={e => handleUpdateScheduleRow(idx, 'proposed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            className="w-32 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            value={row.completed}
                            onChange={e => handleUpdateScheduleRow(idx, 'completed', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            value={row.progress}
                            onChange={e => handleUpdateScheduleRow(idx, 'progress', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            className="w-20 px-2 py-1 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500"
                            value={row.recommend}
                            onChange={e => handleUpdateScheduleRow(idx, 'recommend', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold text-slate-800 border-t border-slate-200">
                    <tr>
                      <td className="px-4 py-2.5">Total</td>
                      <td className="px-4 py-2.5">100%</td>
                      <td className="px-4 py-2.5">—</td>
                      <td className="px-4 py-2.5 text-indigo-700">{totalScheduleProgress}%</td>
                      <td className="px-4 py-2.5 text-indigo-700">{totalScheduleRecommend}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <Field label="Description of Work (Summary)">
                <input
                  type="text"
                  className={inputCls}
                  value={form.scheduleWorkDescription}
                  onChange={e => updateField('scheduleWorkDescription', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          )}
        </div>

        {/* 14. Documents Annexure */}
        <div id="sec-documents-annexure">
          <BaseDocumentsSection
            title="Property Documents"
            sectionId="sec-documents-annexure"
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

        {/* 15. Maps Annexure */}
        <div id="sec-maps-annexure">
          <BaseMapsSection
            title="Location Maps"
            sectionId="sec-maps-annexure"
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

        {/* 16. Photographs Annexure */}
        <div id="sec-photos-annexure" className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-indigo-600" />
              Photo Cover Header Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="List of Photographs">
                <input
                  type="text"
                  className={inputCls}
                  value={form.photoListNames}
                  onChange={e => updateField('photoListNames', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Customer Contact / Display Line">
                <input
                  type="text"
                  className={inputCls}
                  value={form.customerName}
                  onChange={e => updateField('customerName', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>

          <BasePhotographsSection
            title="Property Photographs"
            sectionId="sec-photos-annexure"
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

      {/* Bucket Photo Picker Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            setForm((prev: any) => ({
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

      {/* Fixed Action Bar */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={autoSaveStatus}
        message={message}
        loading={saving || submitting || previewing || !!uploading}
        onSaveDraft={handleSaveDraft}
        onSubmit={async () => {
          setSubmitting(true);
          try {
            await handleSaveDraft();
            router.push(`/portal/projects/${projectId}`);
          } finally {
            setSubmitting(false);
          }
        }}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
}
