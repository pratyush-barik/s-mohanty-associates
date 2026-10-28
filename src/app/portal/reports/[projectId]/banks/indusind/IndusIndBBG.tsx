'use client';

import { sanitizeFilenameCode } from '@/lib/utils';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import {
  getEarliestFieldVisit,
  BankReportHeader,
  BankReportTitleCard,
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ActiveConfigBanner,
  ReportActionBar,
  NavItem,
  formatReportDate,
  BaseDateInput,
  BaseDocumentsSection,
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  fetchBytes,
  EarliestFieldVisitBadge,
} from '../BaseBankReportComponents';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import { BankConfig } from '@/lib/bank-fields';
import { PDFIndusIndBBGRenderer } from '@/lib/banks/pdf-indusind-bbg-renderer';

export const INDUSIND_BBG_CONFIG: BankConfig = {
  bankId: 'INDUSIND BANK',
  subTemplateId: 'BBG',
  displayName: 'IndusInd Bank — BBG (Business Banking Group)',
  defaultValues: {
    purpose: 'Valuation of property for ABG/BBG/CBG - IndusInd Bank',
  },
};

export interface IndusIndBBGProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole: string;
  bucketImages?: any[];
  prefill?: any;
  onResetWizard?: () => void;
}

export default function IndusIndBBG({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: IndusIndBBGProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<boolean | string>(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [activeTab, setActiveTab] = useState('bbg-sec-a');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isReadOnly = status === 'verified' || status === 'completed';

  const earliestVisit = useMemo(
    () => getEarliestFieldVisit(bucketImages, prefill),
    [bucketImages, prefill]
  );

  // Master Fields State
  const [fields, setFields] = useState<any>(() => {
    const raw = initialFields || {};
    return {
      ...raw,
      bankName: 'INDUSIND BANK',
      organisationTemplate: 'INDUSIND BANK',
      organisationSubTemplate: 'BBG',

      // Header
      refNo: raw.refNo || raw.indusBBGRefNo || projectCode || '',
    indusBBGRefNo: raw.refNo || raw.indusBBGRefNo || projectCode || '',
      indusBBGReportDate: raw.indusBBGReportDate || raw.valuationDate || '',

      // Section A: General Details
      indusBBGCustomerName: raw.indusBBGCustomerName || raw.applicantName || '',
      indusBBGRequestFrom: raw.indusBBGRequestFrom || 'IndusInd Bank Ltd.',
      indusBBGDocHolderName: raw.indusBBGDocHolderName || raw.ownerName || '',
      indusBBGAddressRequest: raw.indusBBGAddressRequest || raw.propertyAddress || '',
      indusBBGAddressSite: raw.indusBBGAddressSite || raw.propertyAddress || '',
      indusBBGAddressLegal: raw.indusBBGAddressLegal || '',
      indusBBGCoordinates: raw.indusBBGCoordinates || (raw.latitude && raw.longitude ? `${raw.latitude}, ${raw.longitude}` : ''),
      indusBBGLandmark: raw.indusBBGLandmark || raw.landmark || '',
      indusBBGInspectionDate: raw.indusBBGInspectionDate || raw.inspectionDate || earliestVisit?.dateStr || '',

      // Section B: Surrounding Locality
      indusBBGWardNo: raw.indusBBGWardNo || '',
      indusBBGVicinity: raw.indusBBGVicinity || '',
      indusBBGLocalityClass: raw.indusBBGLocalityClass || 'Middle Class',
      indusBBGAmenitiesList: raw.indusBBGAmenitiesList || [
        'Railway Station / Bus Stand : 2-3 Kms',
        'Hospital / Clinic : 1-2 Kms',
        'School / College : Within 1 Km',
        'Market / Commercial Hub : 1-2 Kms',
      ],
      indusBBGApproachRoad: raw.indusBBGApproachRoad || 'Good & Motorable (40 ft Road)',
      indusBBGPlotDemarcated: raw.indusBBGPlotDemarcated || 'Yes',

      // Boundaries
      indusBBGBoundaryDocNorth: raw.indusBBGBoundaryDocNorth || prefill?.property?.boundaries?.north?.asPerDeed || prefill?.property?.northBoundary || '',
      indusBBGBoundaryDocSouth: raw.indusBBGBoundaryDocSouth || prefill?.property?.boundaries?.south?.asPerDeed || prefill?.property?.southBoundary || '',
      indusBBGBoundaryDocEast: raw.indusBBGBoundaryDocEast || prefill?.property?.boundaries?.east?.asPerDeed || prefill?.property?.eastBoundary || '',
      indusBBGBoundaryDocWest: raw.indusBBGBoundaryDocWest || prefill?.property?.boundaries?.west?.asPerDeed || prefill?.property?.westBoundary || '',
      indusBBGBoundarySiteNorth: raw.indusBBGBoundarySiteNorth || prefill?.property?.boundaries?.north?.asPerSite || prefill?.property?.northBoundary || '',
      indusBBGBoundarySiteSouth: raw.indusBBGBoundarySiteSouth || prefill?.property?.boundaries?.south?.asPerSite || prefill?.property?.southBoundary || '',
      indusBBGBoundarySiteEast: raw.indusBBGBoundarySiteEast || prefill?.property?.boundaries?.east?.asPerSite || prefill?.property?.eastBoundary || '',
      indusBBGBoundarySiteWest: raw.indusBBGBoundarySiteWest || prefill?.property?.boundaries?.west?.asPerSite || prefill?.property?.westBoundary || '',
      indusBBGBoundariesMatching: raw.indusBBGBoundariesMatching || 'Yes',
      indusBBGPropertyIdentified: raw.indusBBGPropertyIdentified || 'Boundaries matching as per document',

      // Section C: Property Details
      indusBBGPropertyDesc: raw.indusBBGPropertyDesc || 'Commercial / Residential Building',
      indusBBGTypeOfProperty: raw.indusBBGTypeOfProperty || 'Commercial',
      indusBBGUsage_BF: raw.indusBBGUsage_BF || 'Parking / Storage',
      indusBBGUsage_GF: raw.indusBBGUsage_GF || 'Commercial Office / Retail',
      indusBBGUsage_FF: raw.indusBBGUsage_FF || 'Commercial Office',
      indusBBGUsage_SF: raw.indusBBGUsage_SF || 'Commercial Office',
      indusBBGAcc_BF: raw.indusBBGAcc_BF || 'Open Hall, Security',
      indusBBGAcc_GF: raw.indusBBGAcc_GF || 'Office Hall, Cabins, Toilet',
      indusBBGAcc_FF: raw.indusBBGAcc_FF || 'Rooms, Pantry, Bathrooms',
      indusBBGAcc_SF: raw.indusBBGAcc_SF || 'Rooms, Bathrooms',
      indusBBGAdditionalAmenities: raw.indusBBGAdditionalAmenities || 'Power Backup, Lift, CCTV',
      indusBBGAreaActual: raw.indusBBGAreaActual || (prefill?.property?.plotArea ? `${prefill.property.plotArea} sqft` : ''),
      indusBBGCarpetArea: raw.indusBBGCarpetArea || '',
      indusBBGBuiltUpSaleableArea: raw.indusBBGBuiltUpSaleableArea || '',

      indusBBGPerm_BF: raw.indusBBGPerm_BF || '0.00',
      indusBBGPerm_GF: raw.indusBBGPerm_GF || '0.00',
      indusBBGPerm_FF: raw.indusBBGPerm_FF || '0.00',
      indusBBGPerm_SF: raw.indusBBGPerm_SF || '0.00',
      indusBBGPerm_TF: raw.indusBBGPerm_TF || '0.00',

      indusBBGAreaSaleDeed: raw.indusBBGAreaSaleDeed || (prefill?.property?.plotArea ? `${prefill.property.plotArea} sqft` : ''),
      indusBBGAdherenceSanctionPlan: raw.indusBBGAdherenceSanctionPlan || 'Adhered with minor internal deviations',

      indusBBGDeviationRows: raw.indusBBGDeviationRows || [
        { floor: 'BF', actual: '0.00', actPct: '0%', perm: '0.00', permPct: '0%', excess: '0.00', excessPct: '0%' },
        { floor: 'GF', actual: '0.00', actPct: '0%', perm: '0.00', permPct: '0%', excess: '0.00', excessPct: '0%' },
        { floor: 'FF', actual: '0.00', actPct: '0%', perm: '0.00', permPct: '0%', excess: '0.00', excessPct: '0%' },
        { floor: 'SF', actual: '0.00', actPct: '0%', perm: '0.00', permPct: '0%', excess: '0.00', excessPct: '0%' },
        { floor: 'TF', actual: '0.00', actPct: '0%', perm: '0.00', permPct: '0%', excess: '0.00', excessPct: '0%' },
      ],
      indusBBGRiskDemolition: raw.indusBBGRiskDemolition || 'Low',
      indusBBGOccupiedBy: raw.indusBBGOccupiedBy || 'Owner',
      indusBBGOccupiedSince: raw.indusBBGOccupiedSince || '5',

      // Section D: Subject Property
      indusBBGLandTenure: raw.indusBBGLandTenure || 'Freehold',
      indusBBGDrawingApprovals: raw.indusBBGDrawingApprovals || 'Approved by Municipal Authority',
      indusBBGSocietyName: raw.indusBBGSocietyName || 'NA',
      indusBBGSocietyRegNo: raw.indusBBGSocietyRegNo || 'NA',
      indusBBGSharesCertificateNo: raw.indusBBGSharesCertificateNo || 'NA',
      indusBBGOutgoesPerMonth: raw.indusBBGOutgoesPerMonth || 'NA',

      // Section E: Structural
      indusBBGStructureType: raw.indusBBGStructureType || 'RCC Framed',
      indusBBGNoOfFloors: raw.indusBBGNoOfFloors || 'G+2',
      indusBBGNoOfWings: raw.indusBBGNoOfWings || '1',
      indusBBGFlatsPerFloor: raw.indusBBGFlatsPerFloor || '2',
      indusBBGLiftsPerWing: raw.indusBBGLiftsPerWing || 'NA',
      indusBBGAgeOfProperty: raw.indusBBGAgeOfProperty || '10',
      indusBBGFutureLife: raw.indusBBGFutureLife || '50',
      indusBBGBeamColumn: raw.indusBBGBeamColumn || 'Sound & Stable',
      indusBBGAppearance: raw.indusBBGAppearance || 'Good',
      indusBBGMaintenance: raw.indusBBGMaintenance || 'Well Maintained',
      indusBBG_CA_Reception: raw.indusBBG_CA_Reception || 'Good',
      indusBBG_CA_Staircase: raw.indusBBG_CA_Staircase || 'Good',
      indusBBG_CA_WaterTank: raw.indusBBG_CA_WaterTank || 'Overhead PVC Tank (Good)',
      indusBBG_CA_Sanitation: raw.indusBBG_CA_Sanitation || 'Properly Connected to Sewer Line',
      indusBBGFlooringInteriors: raw.indusBBGFlooringInteriors || 'Vitrified Tiles',
      indusBBGFinishingInteriors: raw.indusBBGFinishingInteriors || 'Plastic Emulsion Paint with Putty',
      indusBBGRoofingTerracing: raw.indusBBGRoofingTerracing || 'RCC Slab with Waterproofing',

      // Section F: Unit Details
      indusBBGUnitFloorNo: raw.indusBBGUnitFloorNo || 'GF & FF',
      indusBBGInternalComposition: raw.indusBBGInternalComposition || 'Office Hall, Cabins, Pantry, Restrooms',
      indusBBGUnitFlooring: raw.indusBBGUnitFlooring || 'Vitrified Tiles',
      indusBBGFittingsQuality: raw.indusBBGFittingsQuality || 'Good Quality Concealed Electrical & Sanitary',
      indusBBGWoodwork: raw.indusBBGWoodwork || 'Flush Doors & Aluminum Glazed Windows',

      // Section G: Valuation
      indusBBGValDrawingsApprovals: raw.indusBBGValDrawingsApprovals || 'Approved by Local Planning Authority',
      indusBBGValAreaConsidered: raw.indusBBGValAreaConsidered || (prefill?.property?.plotArea ? `${prefill.property.plotArea} sqft` : ''),
      indusBBGAgeYrs: raw.indusBBGAgeYrs || '',
      indusBBGFutureLifeYrs: raw.indusBBGFutureLifeYrs || '',
      indusBBGPresentCondition: raw.indusBBGPresentCondition || 'Good & Habitable',
      indusBBGCommentsSpecs: raw.indusBBGCommentsSpecs || 'All civic amenities and motorable access road available',
      indusBBGMarketRatesVicinity: raw.indusBBGMarketRatesVicinity || '',
      indusBBGInquiriesFrom: raw.indusBBGInquiriesFrom || 'Local Property Consultants & Direct Market Verification',
      indusBBGValRemarks: raw.indusBBGValRemarks || 'Valuation reflects Fair Market Value as on inspection date',
      indusBBGGovtGuidelineValue: raw.indusBBGGovtGuidelineValue || '',

      // (I) Land & Building Math
      indusBBGLandAreaSqft: raw.indusBBGLandAreaSqft ?? (prefill?.property?.plotArea ? String(prefill.property.plotArea) : '0.00'),
      indusBBGLandRate: raw.indusBBGLandRate ?? (prefill?.property?.marketRate ? String(prefill.property.marketRate) : '0.00'),
      indusBBGBuiltUpAreaSqft: raw.indusBBGBuiltUpAreaSqft ?? '0.00',
      indusBBGBldgRateDep: raw.indusBBGBldgRateDep ?? '0.00',
      indusBBGLessRepairs: raw.indusBBGLessRepairs ?? '0.00',

      // (II) Flat Math
      indusBBGFlatBUA: raw.indusBBGFlatBUA ?? '0.00',
      indusBBGFlatRate: raw.indusBBGFlatRate ?? '0.00',

      // Other Valuation Items
      indusBBGConstructionEstimate: raw.indusBBGConstructionEstimate || 'NA',
      indusBBGEstimateValid: raw.indusBBGEstimateValid || 'Yes',
      indusBBGMortgageValue: raw.indusBBGMortgageValue || '',
      indusBBGDistressValue: raw.indusBBGDistressValue || '',
      indusBBGInsuranceValue: raw.indusBBGInsuranceValue || '',
      indusBBGForSale: raw.indusBBGForSale || 'High Demand Locality',
      indusBBGForLeaseRental: raw.indusBBGForLeaseRental || '',
      indusBBGVolatility: raw.indusBBGVolatility || 'Low / Stable',

      // Sign-off
      indusBBGPlace: raw.indusBBGPlace || 'Bhubaneswar',

      // Attachments
      documentImages: raw.documentImages || [],
      documentImageNames: raw.documentImageNames || [],
      locationMapImages: raw.locationMapImages || [],
      mouzaMapImages: raw.mouzaMapImages || [],
      sketchMapImages: raw.sketchMapImages || [],
      cadastralMapImages: raw.cadastralMapImages || [],
      bdaMapImages: raw.bdaMapImages || [],
      propertyImages: raw.propertyImages || [],
      propertyImageNames: raw.propertyImageNames || [],
    };
  });

  const updateField = (key: string, val: any) => {
    setFields((prev: any) => ({ ...prev, [key]: val }));
  };

  // ─────────────────────────────────────────────────────────────
  // Auto-Calculation Engine for BBG
  // ─────────────────────────────────────────────────────────────
  const calculatedLandValue = useMemo(() => {
    const area = parseFloat(fields.indusBBGLandAreaSqft) || 0;
    const rate = parseFloat(fields.indusBBGLandRate) || 0;
    return Math.round(area * rate);
  }, [fields.indusBBGLandAreaSqft, fields.indusBBGLandRate]);

  const calculatedBldgValue = useMemo(() => {
    const bua = parseFloat(fields.indusBBGBuiltUpAreaSqft) || 0;
    const rate = parseFloat(fields.indusBBGBldgRateDep) || 0;
    const less = parseFloat(fields.indusBBGLessRepairs) || 0;
    return Math.max(0, Math.round(bua * rate - less));
  }, [fields.indusBBGBuiltUpAreaSqft, fields.indusBBGBldgRateDep, fields.indusBBGLessRepairs]);

  const totalLBValue = calculatedLandValue + calculatedBldgValue;

  const calculatedFlatValue = useMemo(() => {
    const bua = parseFloat(fields.indusBBGFlatBUA) || 0;
    const rate = parseFloat(fields.indusBBGFlatRate) || 0;
    return Math.round(bua * rate);
  }, [fields.indusBBGFlatBUA, fields.indusBBGFlatRate]);

  // Sync auto-calculated totals into fields state
  useEffect(() => {
    setFields((prev: any) => {
      const landStr = String(calculatedLandValue);
      const bldgStr = String(calculatedBldgValue);
      const totStr = String(totalLBValue);
      const flatStr = String(calculatedFlatValue);
      const defaultDistress = String(Math.round(totalLBValue * 0.85));
      const defaultInsurance = String(calculatedBldgValue);

      if (
        prev.indusBBGLandValue === landStr &&
        prev.indusBBGBuildingValue === bldgStr &&
        prev.indusBBGFlatPresentValue === flatStr &&
        prev.indusBBGMortgageValue === totStr
      ) {
        return prev;
      }

      return {
        ...prev,
        indusBBGLandValue: landStr,
        indusBBGBuildingValue: bldgStr,
        indusBBGFlatPresentValue: flatStr,
        indusBBGMortgageValue: prev.indusBBGMortgageValue || totStr,
        indusBBGDistressValue: prev.indusBBGDistressValue || defaultDistress,
        indusBBGInsuranceValue: prev.indusBBGInsuranceValue || defaultInsurance,
      };
    });
  }, [calculatedLandValue, calculatedBldgValue, totalLBValue, calculatedFlatValue]);

  // ─────────────────────────────────────────────────────────────
  // Action Handlers
  // ─────────────────────────────────────────────────────────────
  const handleSaveDraft = async () => {
    setSaving(true);
    setAutoSaveStatus('saving');
    try {
      await saveReportDraft(projectId, fields);
      setAutoSaveStatus('saved');
      setMessage({ text: 'Draft saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (e: any) {
      setAutoSaveStatus('error');
      setMessage({ text: `Error saving draft: ${e.message}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this IndusInd BBG report for verification?')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, fields);
      await submitReportForVerification(projectId);
      router.push(`/portal/projects/${projectId}`);
    } catch (e: any) {
      alert(`Error submitting report: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const compilePdfBytes = async (): Promise<Uint8Array> => {
    const docBytesList: { bytes: Uint8Array; title?: string }[] = [];
    for (let i = 0; i < (fields.documentImages || []).length; i++) {
      const b = await fetchBytes(fields.documentImages[i]);
      if (b) docBytesList.push({ bytes: b, title: fields.documentImageNames?.[i] });
    }

    const photoBytesList: { bytes: Uint8Array; label?: string }[] = [];
    for (let i = 0; i < (fields.propertyImages || []).length; i++) {
      const b = await fetchBytes(fields.propertyImages[i]);
      if (b) photoBytesList.push({ bytes: b, label: fields.propertyImageNames?.[i] });
    }

    const locMapBytes = (await Promise.all((fields.locationMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const mouzaMapBytes = (await Promise.all((fields.mouzaMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const sketchMapBytes = (await Promise.all((fields.sketchMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const cadastralMapBytes = (await Promise.all((fields.cadastralMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const bdaMapBytes = (await Promise.all((fields.bdaMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    const renderer = new PDFIndusIndBBGRenderer({
      ...fields,
      projectCode,
      documents: docBytesList,
      photos: photoBytesList,
      maps: [...locMapBytes, ...mouzaMapBytes, ...sketchMapBytes, ...cadastralMapBytes, ...bdaMapBytes],
    });

    return await renderer.render();
  };

  const handlePreviewPDF = async () => {
    setPreviewing(true);
    try {
      const pdfBytes = await compilePdfBytes();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      alert(`Error generating PDF preview: ${e.message}`);
      console.error(e);
    } finally {
      setPreviewing(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfBytes = await compilePdfBytes();
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${sanitizeFilenameCode(`IndusInd_BBG_${projectCode || projectId}`)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Error downloading PDF: ${e.message}`);
    }
  };

  // Upload Handlers
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading('documents');
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `doc_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;
        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);
        return urlData.publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      setFields((p: any) => ({
        ...p,
        documentImages: [...(p.documentImages || []), ...urls],
        documentImageNames: [...(p.documentImageNames || []), ...urls.map(() => '')],
      }));
    } catch (err: any) {
      alert(`Error uploading documents: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMapUpload = async (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(category);
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `map_${category}_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;
        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);
        return urlData.publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      setFields((p: any) => ({
        ...p,
        [category]: [...(p[category] || []), ...urls],
      }));
    } catch (err: any) {
      alert(`Error uploading map: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading('photos');
    try {
      const uploadPromises = Array.from(files).map(async file => {
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `photo_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
        const filePath = `${projectId}/${fileName}`;
        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(filePath, file);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(filePath);
        return urlData.publicUrl;
      });
      const urls = await Promise.all(uploadPromises);
      setFields((p: any) => ({
        ...p,
        propertyImages: [...(p.propertyImages || []), ...urls],
        propertyImageNames: [
          ...(p.propertyImageNames || []),
          ...urls.map((_, i) => `Photograph ${(p.propertyImages?.length || 0) + i + 1}`),
        ],
      }));
    } catch (err: any) {
      alert(`Error uploading photos: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Nav Items
  const navSections: NavItem[] = [
    { id: 'bbg-sec-a', title: 'General Details' },
    { id: 'bbg-sec-b', title: 'Locality Details' },
    { id: 'bbg-sec-c', title: 'Property Details & Deviations' },
    { id: 'bbg-sec-g', title: 'Valuation & Calculations' },
    { id: 'bbg-sec-disc', title: 'Disclosures & Declaration' },
    { id: 'bbg-sec-docs', title: 'Documents' },
    { id: 'bbg-sec-maps', title: 'Maps' },
    { id: 'bbg-sec-photos', title: 'Photographs' },
  ];

  return (
    <div className="space-y-6 pb-28 w-full">
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* Center Main Form */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Standardized Universal Bank Report Header */}
          <BankReportHeader
            bankName={fields.organisationTemplate || 'INDUSIND BANK'}
            subclass={fields.organisationSubTemplate || 'BBG Format'}
            clientType="organisation"
            category="Bank & FIS"
            onResetWizard={onResetWizard}
            title="Valuation Report Builder"
            description="IndusInd Bank Business Banking Group Commercial Format."
            earliestVisit={earliestVisit}
            projectCode={projectCode}
            reworkNotes={fields.reworkNotes}
            status={status}
            message={message}
          />

          {/* Section A: General Details */}
          <Section id="bbg-sec-a" title="General Details" number={1}>
            <div className="border border-slate-200 bg-[#F8FAFC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Header &amp; Inspection Info
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Ref. No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.refNo || projectCode || ''} disabled={true} readOnly={true} placeholder="SMA-YYYY/MM-NNNN"
                  />
                </Field>
                <Field label="Date of Report (DATED)">
                  <input
                    type="date"
                    className={inputCls}
                    value={fields.indusBBGReportDate}
                    onChange={(e) => updateField('indusBBGReportDate', e.target.value)}
                  />
                </Field>
                <Field label="1. Name of Customer (Applicant)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBBGCustomerName}
                    onChange={(e) => updateField('indusBBGCustomerName', e.target.value)}
                  />
                </Field>
                <Field label="2. Request Received From">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBBGRequestFrom}
                    onChange={(e) => updateField('indusBBGRequestFrom', e.target.value)}
                  />
                </Field>
                <div className="md:col-span-2">
                  <Field label="3. Name of Document Holder (as per sale deed)">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.indusBBGDocHolderName}
                      onChange={(e) => updateField('indusBBGDocHolderName', e.target.value)}
                    />
                  </Field>
                </div>
                <Field label="4. Property Address (as per request)">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.indusBBGAddressRequest}
                    onChange={(e) => updateField('indusBBGAddressRequest', e.target.value)}
                  />
                </Field>
                <Field label="5. Property Address (on-site inspection)">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.indusBBGAddressSite}
                    onChange={(e) => updateField('indusBBGAddressSite', e.target.value)}
                  />
                </Field>
                <Field label="6. Property Legal Address (as per docs)">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.indusBBGAddressLegal}
                    onChange={(e) => updateField('indusBBGAddressLegal', e.target.value)}
                  />
                </Field>
                <div className="space-y-3">
                  <Field label="7a. Google Coordinates (Lat, Long)">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.indusBBGCoordinates}
                      onChange={(e) => updateField('indusBBGCoordinates', e.target.value)}
                      placeholder="e.g. 20.2961, 85.8245"
                    />
                  </Field>
                  <Field label="7b. Landmark">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.indusBBGLandmark}
                      onChange={(e) => updateField('indusBBGLandmark', e.target.value)}
                    />
                  </Field>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Field label="8. Date of Inspection">
                    <input
                      type="date"
                      className={inputCls}
                      value={fields.indusBBGInspectionDate}
                      onChange={(e) => updateField('indusBBGInspectionDate', e.target.value)}
                    />
                  </Field>
                  <EarliestFieldVisitBadge
                    fieldVisit={earliestVisit}
                    currentValue={fields.indusBBGInspectionDate}
                    onSync={(dt) => updateField('indusBBGInspectionDate', dt)}
                    isReadOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>
          </Section>

          {/* Section B: Locality Details */}
          <Section id="bbg-sec-b" title="Locality Details" number={2}>
            <div className="border border-blue-200 bg-[#F0F7FF] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="1. Ward No. / Municipal Land No.">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBBGWardNo}
                    onChange={(e) => updateField('indusBBGWardNo', e.target.value)}
                  />
                </Field>
                <Field label="2. Vicinity">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBBGVicinity}
                    onChange={(e) => updateField('indusBBGVicinity', e.target.value)}
                  />
                </Field>
                <Field label="3. Classification of Locality">
                  <select
                    className={selectCls}
                    value={fields.indusBBGLocalityClass}
                    onChange={(e) => updateField('indusBBGLocalityClass', e.target.value)}
                  >
                    <option value="Posh">Posh</option>
                    <option value="Upper Middle Class">Upper Middle Class</option>
                    <option value="Middle Class">Middle Class</option>
                    <option value="Lower Middle Class">Lower Middle Class</option>
                  </select>
                </Field>
              </div>

              {/* Boundaries Comparison Soft Container */}
              <div className="border border-slate-200 bg-white rounded-lg p-3 space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  7 &amp; 8. Four Boundaries Comparison (Document vs Site)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 border-r pr-2">
                    <span className="text-xs font-semibold text-slate-600">7. As Per Document</span>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="North"><input type="text" className={inputCls} value={fields.indusBBGBoundaryDocNorth} onChange={(e) => updateField('indusBBGBoundaryDocNorth', e.target.value)} /></Field>
                      <Field label="South"><input type="text" className={inputCls} value={fields.indusBBGBoundaryDocSouth} onChange={(e) => updateField('indusBBGBoundaryDocSouth', e.target.value)} /></Field>
                      <Field label="East"><input type="text" className={inputCls} value={fields.indusBBGBoundaryDocEast} onChange={(e) => updateField('indusBBGBoundaryDocEast', e.target.value)} /></Field>
                      <Field label="West"><input type="text" className={inputCls} value={fields.indusBBGBoundaryDocWest} onChange={(e) => updateField('indusBBGBoundaryDocWest', e.target.value)} /></Field>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-xs font-semibold text-slate-600">8. As Per Site</span>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="North"><input type="text" className={inputCls} value={fields.indusBBGBoundarySiteNorth} onChange={(e) => updateField('indusBBGBoundarySiteNorth', e.target.value)} /></Field>
                      <Field label="South"><input type="text" className={inputCls} value={fields.indusBBGBoundarySiteSouth} onChange={(e) => updateField('indusBBGBoundarySiteSouth', e.target.value)} /></Field>
                      <Field label="East"><input type="text" className={inputCls} value={fields.indusBBGBoundarySiteEast} onChange={(e) => updateField('indusBBGBoundarySiteEast', e.target.value)} /></Field>
                      <Field label="West"><input type="text" className={inputCls} value={fields.indusBBGBoundarySiteWest} onChange={(e) => updateField('indusBBGBoundarySiteWest', e.target.value)} /></Field>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="9. Boundaries Matching?">
                  <select
                    className={selectCls}
                    value={fields.indusBBGBoundariesMatching}
                    onChange={(e) => updateField('indusBBGBoundariesMatching', e.target.value)}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>
                <Field label="6. Plot Demarcated at Site?">
                  <select
                    className={selectCls}
                    value={fields.indusBBGPlotDemarcated}
                    onChange={(e) => updateField('indusBBGPlotDemarcated', e.target.value)}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </Field>
                <Field label="5. Approach Road Condition">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBBGApproachRoad}
                    onChange={(e) => updateField('indusBBGApproachRoad', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Section C: Property Details & Deviations */}
          <Section id="bbg-sec-c" title="Property Details & Deviations" number={3}>
            <div className="border border-indigo-200 bg-[#F5F3FF] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="1. Description of Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBBGPropertyDesc}
                    onChange={(e) => updateField('indusBBGPropertyDesc', e.target.value)}
                  />
                </Field>
                <Field label="2. Type of Property">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBBGTypeOfProperty}
                    onChange={(e) => updateField('indusBBGTypeOfProperty', e.target.value)}
                  />
                </Field>
              </div>

              {/* Usage & Accommodation Sub-table */}
              <div className="overflow-x-auto border border-slate-200 bg-white rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-2 text-left w-28">Floor</th>
                      <th className="p-2 text-left">3. Type of Usage</th>
                      <th className="p-2 text-left">4. Accommodation Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[
                      { floor: 'Basement', uKey: 'indusBBGUsage_BF', aKey: 'indusBBGAcc_BF' },
                      { floor: 'GF', uKey: 'indusBBGUsage_GF', aKey: 'indusBBGAcc_GF' },
                      { floor: 'FF', uKey: 'indusBBGUsage_FF', aKey: 'indusBBGAcc_FF' },
                      { floor: 'SF', uKey: 'indusBBGUsage_SF', aKey: 'indusBBGAcc_SF' },
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2 font-semibold text-slate-700">{row.floor}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[row.uKey]}
                            onChange={(e) => updateField(row.uKey, e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={fields[row.aKey]}
                            onChange={(e) => updateField(row.aKey, e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 12. Deviations comparison table */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  12. Deviations from Sanction Plan / Building Byelaws
                </span>
                <div className="overflow-x-auto border border-slate-200 bg-white rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="p-2 text-center w-14">Floor</th>
                        <th className="p-2 text-right">Actual Area (sqft)</th>
                        <th className="p-2 text-right w-20">%</th>
                        <th className="p-2 text-right">Permissible (sqft)</th>
                        <th className="p-2 text-right w-20">%</th>
                        <th className="p-2 text-right">Excess Coverage</th>
                        <th className="p-2 text-right w-20">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(fields.indusBBGDeviationRows || []).map((dr: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2 text-center font-bold text-slate-600">{dr.floor}</td>
                          <td className="p-2"><input type="number" step="0.01" className={`${inputCls} text-right`} value={dr.actual} onChange={(e) => {
                            const copy = [...fields.indusBBGDeviationRows];
                            copy[idx].actual = e.target.value;
                            updateField('indusBBGDeviationRows', copy);
                          }} /></td>
                          <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={dr.actPct} onChange={(e) => {
                            const copy = [...fields.indusBBGDeviationRows];
                            copy[idx].actPct = e.target.value;
                            updateField('indusBBGDeviationRows', copy);
                          }} /></td>
                          <td className="p-2"><input type="number" step="0.01" className={`${inputCls} text-right`} value={dr.perm} onChange={(e) => {
                            const copy = [...fields.indusBBGDeviationRows];
                            copy[idx].perm = e.target.value;
                            updateField('indusBBGDeviationRows', copy);
                          }} /></td>
                          <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={dr.permPct} onChange={(e) => {
                            const copy = [...fields.indusBBGDeviationRows];
                            copy[idx].permPct = e.target.value;
                            updateField('indusBBGDeviationRows', copy);
                          }} /></td>
                          <td className="p-2"><input type="number" step="0.01" className={`${inputCls} text-right`} value={dr.excess} onChange={(e) => {
                            const copy = [...fields.indusBBGDeviationRows];
                            copy[idx].excess = e.target.value;
                            updateField('indusBBGDeviationRows', copy);
                          }} /></td>
                          <td className="p-2"><input type="text" className={`${inputCls} text-right`} value={dr.excessPct} onChange={(e) => {
                            const copy = [...fields.indusBBGDeviationRows];
                            copy[idx].excessPct = e.target.value;
                            updateField('indusBBGDeviationRows', copy);
                          }} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </Section>

          {/* Section G: Valuation */}
          <Section id="bbg-sec-g" title="Valuation & Calculations" number={4}>
            <div className="border border-emerald-200 bg-[#F0FDF4] rounded-xl p-4 sm:p-5 shadow-2xs space-y-6">
              <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                (I) For Land &amp; Building (Auto-Summed &amp; Constrained)
              </div>

              {/* Land Component */}
              <div className="border border-emerald-300 bg-white p-4 rounded-lg grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="A. Land Area (Sqft)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`${inputCls} font-mono`}
                    value={fields.indusBBGLandAreaSqft}
                    onChange={(e) => updateField('indusBBGLandAreaSqft', e.target.value)}
                  />
                </Field>
                <Field label="Adopted Rate (Rs./sqft)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`${inputCls} font-mono`}
                    value={fields.indusBBGLandRate}
                    onChange={(e) => updateField('indusBBGLandRate', e.target.value)}
                  />
                </Field>
                <Field label="Total Land Value (In Rs.)">
                  <input
                    type="text"
                    className={`${inputCls} font-mono font-bold bg-slate-100`}
                    value={`Rs. ${formatIndianCurrency(calculatedLandValue)}/-`}
                    readOnly
                  />
                </Field>
              </div>

              {/* Building Component */}
              <div className="border border-emerald-300 bg-white p-4 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="B. Built Up Area (Sqft)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`${inputCls} font-mono`}
                    value={fields.indusBBGBuiltUpAreaSqft}
                    onChange={(e) => updateField('indusBBGBuiltUpAreaSqft', e.target.value)}
                  />
                </Field>
                <Field label="Rate (After Dep.)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`${inputCls} font-mono`}
                    value={fields.indusBBGBldgRateDep}
                    onChange={(e) => updateField('indusBBGBldgRateDep', e.target.value)}
                  />
                </Field>
                <Field label="Less For Repairs (Rs.)">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={`${inputCls} font-mono`}
                    value={fields.indusBBGLessRepairs}
                    onChange={(e) => updateField('indusBBGLessRepairs', e.target.value)}
                  />
                </Field>
                <Field label="Total Building Value (In Rs.)">
                  <input
                    type="text"
                    className={`${inputCls} font-mono font-bold bg-slate-100`}
                    value={`Rs. ${formatIndianCurrency(calculatedBldgValue)}/-`}
                    readOnly
                  />
                </Field>
              </div>

              {/* Total Value Banner */}
              <div className="p-4 bg-emerald-100 border border-emerald-300 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-900">
                    C. Total Value of Property (A + B):
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-950 font-mono">
                    Rs. {formatIndianCurrency(totalLBValue)}/-
                  </span>
                </div>
                <p className="text-xs font-semibold text-emerald-800 italic">
                  {rupeesInWords(totalLBValue)}
                </p>
              </div>

              {/* (II) For Flat/Shop */}
              <div className="border border-emerald-300 bg-white p-4 rounded-lg space-y-3">
                <div className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  (II) For Flat / Shop / Floor
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Field label="Built Up Area (Sqft)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`${inputCls} font-mono`}
                      value={fields.indusBBGFlatBUA}
                      onChange={(e) => updateField('indusBBGFlatBUA', e.target.value)}
                    />
                  </Field>
                  <Field label="Adopted Rate (Rs.)">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`${inputCls} font-mono`}
                      value={fields.indusBBGFlatRate}
                      onChange={(e) => updateField('indusBBGFlatRate', e.target.value)}
                    />
                  </Field>
                  <Field label="Present Value (Rs.)">
                    <input
                      type="text"
                      className={`${inputCls} font-mono font-bold bg-slate-100`}
                      value={`Rs. ${formatIndianCurrency(calculatedFlatValue)}/-`}
                      readOnly
                    />
                  </Field>
                </div>
              </div>

              {/* Mortgage & Distress Values */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="13. Mortgage Value (as on date)">
                  <input
                    type="number"
                    step="0.01"
                    className={`${inputCls} font-mono font-bold`}
                    value={fields.indusBBGMortgageValue}
                    onChange={(e) => updateField('indusBBGMortgageValue', e.target.value)}
                  />
                </Field>
                <Field label="14. Forced / Distress Sale Value">
                  <input
                    type="number"
                    step="0.01"
                    className={`${inputCls} font-mono font-bold`}
                    value={fields.indusBBGDistressValue}
                    onChange={(e) => updateField('indusBBGDistressValue', e.target.value)}
                  />
                </Field>
                <Field label="15. Replacement Value (Insurance)">
                  <input
                    type="number"
                    step="0.01"
                    className={`${inputCls} font-mono font-bold`}
                    value={fields.indusBBGInsuranceValue}
                    onChange={(e) => updateField('indusBBGInsuranceValue', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Section VII & VIII: Disclosures & Declaration */}
          <Section id="bbg-sec-disc" title="Disclosures & Declaration" number={5}>
            <div className="border border-amber-200 bg-[#FFFBEB] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Statutory Bank Declarations
              </div>
              <p className="text-xs text-amber-900 leading-relaxed text-justify">
                All 7 Disclosure Statements and 14 Standard IndusInd Bank Declarations (including 45-day report validity, non-ownership certification disclaimer, and inspection confirmation) are automatically bound into the generated PDF report.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Field label="Place">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBBGPlace}
                    onChange={(e) => updateField('indusBBGPlace', e.target.value)}
                  />
                </Field>
                <Field label="Date">
                  <input
                    type="date"
                    className={inputCls}
                    value={fields.indusBBGReportDate}
                    onChange={(e) => updateField('indusBBGReportDate', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* Inherited Attachments Sections */}
          <div id="bbg-sec-docs">
            <BaseDocumentsSection
              title="Documents" sectionNumber={6}
              sectionId="bbg-sec-docs"
              documentImages={fields.documentImages || []}
              documentImageNames={fields.documentImageNames || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              onUploadDocument={handleDocumentUpload}
              onRemoveDocument={(idx) => setFields((p: any) => ({
                ...p,
                documentImages: (p.documentImages || []).filter((_: any, i: number) => i !== idx),
                documentImageNames: (p.documentImageNames || []).filter((_: any, i: number) => i !== idx),
              }))}
              onDocumentNameChange={(idx, name) => {
                const arr = [...(fields.documentImageNames || [])];
                while (arr.length <= idx) arr.push('');
                arr[idx] = name;
                setFields((p: any) => ({ ...p, documentImageNames: arr }));
              }}
              onReorderDocuments={(newImgs, newNames) => setFields((p: any) => ({ ...p, documentImages: newImgs, documentImageNames: newNames }))}
            />
          </div>

          <div id="bbg-sec-maps">
            <BaseMapsSection
              title="Maps" sectionNumber={7}
              sectionId="bbg-sec-maps"
              locationMapImages={fields.locationMapImages || []}
              mouzaMapImages={fields.mouzaMapImages || []}
              sketchMapImages={fields.sketchMapImages || []}
              cadastralMapImages={fields.cadastralMapImages || []}
              bdaMapImages={fields.bdaMapImages || []}
              latitude={fields.latitude}
              longitude={fields.longitude}
              fields={fields}
              hasExternalCoordinatesField={true}
              technicalAddress={fields.indusBBGAddressSite || ''}
              propertyAddress={fields.indusBBGAddressLegal || ''}
              isReadOnly={isReadOnly}
              uploading={uploading}
              onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
              onLocationMapRemove={(idx) => setFields((p: any) => ({ ...p, locationMapImages: (p.locationMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
              onMouzaMapRemove={(idx) => setFields((p: any) => ({ ...p, mouzaMapImages: (p.mouzaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
              onSketchMapRemove={(idx) => setFields((p: any) => ({ ...p, sketchMapImages: (p.sketchMapImages || []).filter((_: any, i: number) => i !== idx) }))}
              onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
              onCadastralMapRemove={(idx) => setFields((p: any) => ({ ...p, cadastralMapImages: (p.cadastralMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onBdaMapUpload={(e) => handleMapUpload('bdaMapImages', e)}
              onBdaMapRemove={(idx) => setFields((p: any) => ({ ...p, bdaMapImages: (p.bdaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
              onReorderLocationMap={(newImgs) => setFields((p: any) => ({ ...p, locationMapImages: newImgs }))}
              onReorderMouzaMap={(newImgs) => setFields((p: any) => ({ ...p, mouzaMapImages: newImgs }))}
              onReorderSketchMap={(newImgs) => setFields((p: any) => ({ ...p, sketchMapImages: newImgs }))}
              onReorderCadastralMap={(newImgs) => setFields((p: any) => ({ ...p, cadastralMapImages: newImgs }))}
              onReorderBdaMap={(newImgs) => setFields((p: any) => ({ ...p, bdaMapImages: newImgs }))}
            />
          </div>

          <div id="bbg-sec-photos">
            <BasePhotographsSection
              title="Photographs" sectionNumber={8}
              sectionId="bbg-sec-photos"
              propertyImages={fields.propertyImages || []}
              propertyImageNames={fields.propertyImageNames || []}
              isReadOnly={isReadOnly}
              uploading={uploading}
              bucketCount={bucketImages?.length || 0}
              onOpenBucketPicker={() => setShowBucketModal(true)}
              onUploadImages={handlePhotoUpload}
              onRemoveImage={(idx) => setFields((p: any) => ({
                ...p,
                propertyImages: (p.propertyImages || []).filter((_: any, i: number) => i !== idx),
                propertyImageNames: (p.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
              }))}
              onImageNameChange={(idx, name) => {
                const arr = [...(fields.propertyImageNames || [])];
                while (arr.length <= idx) arr.push('');
                arr[idx] = name;
                setFields((p: any) => ({ ...p, propertyImageNames: arr }));
              }}
              onReorderImages={(newImgs, newNames) => setFields((p: any) => ({ ...p, propertyImages: newImgs, propertyImageNames: newNames }))}
            />
          </div>
        </div>

        {/* Floating Navigator */}
        <FloatingNavigator sections={navSections} />
      </div>

      {/* Action Bar */}
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
            setFields((prev: any) => ({
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
