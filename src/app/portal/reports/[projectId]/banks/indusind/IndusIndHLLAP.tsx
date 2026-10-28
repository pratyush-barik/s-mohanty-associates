'use client';

import { sanitizeFilenameCode } from '@/lib/utils';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
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
  getFloorName,
  EarliestFieldVisitBadge,
  DEFAULT_DOCUMENT_LABEL,
  DEFAULT_PHOTO_LABEL,
} from '../BaseBankReportComponents';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import { BankConfig } from '@/lib/bank-fields';
import { decodeHtmlEntitiesDeep } from '@/lib/html-entities';
import { PDFIndusIndHLLAPRenderer } from '@/lib/banks/pdf-indusind-hllap-renderer';

export const INDUSIND_HLLAP_CONFIG: BankConfig = {
  bankId: 'INDUSIND BANK',
  subTemplateId: 'HL-LAP',
  displayName: 'IndusInd Bank — HL-LAP',
  defaultValues: {
    purpose: 'To assess fair market value for collateral security',
  },
};

export interface IndusIndHLLAPProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole: string;
  bucketImages?: any[];
  prefill?: any;
  onResetWizard?: () => void;
}

export default function IndusIndHLLAP({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: IndusIndHLLAPProps) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [uploading, setUploading] = useState<boolean | string>(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [activeTab, setActiveTab] = useState('section-1');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isReadOnly = status === 'verified' || status === 'completed';

  // Master Fields State
  const [fields, setFields] = useState<any>(() => {
    const raw = initialFields || {};
    const p = (prefill || {}) as any;
    return {
      ...raw,
      bankName: 'INDUSIND BANK',
      organisationTemplate: 'INDUSIND BANK',
      organisationSubTemplate: 'HL-LAP',
      refNo: raw.refNo || projectCode || '',

      // 1 General
      indusValuationRequestedBy: raw.indusValuationRequestedBy || 'Indusind Bank Ltd.',
      indusPropertyOccupiedBy: raw.indusPropertyOccupiedBy || 'Vacant',
      indusPurposeOfValuation: raw.indusPurposeOfValuation || raw.purpose || 'To assess fair market value for collateral security',
      indusDateOfReport: raw.indusDateOfReport || raw.valuationDate || '',
      indusFieldEngineerName: raw.indusFieldEngineerName || p.firstFieldAgentName || '',
      indusDateOfVisit: raw.indusDateOfVisit || raw.inspectionDate || '',
      indusVettedByName: raw.indusVettedByName || 'Er. Satyajit Mohanty',

      // 2 Customer
      indusCustomerName: raw.indusCustomerName || raw.applicantName || '',
      indusApplicationNumber: raw.indusApplicationNumber || raw.applicationNo || '',
      indusPropertyOwnerName: raw.indusPropertyOwnerName || raw.ownerName || '',
      indusPersonMetAtSite: raw.indusPersonMetAtSite || '',

      // 3 Property
      indusPropertyAddressSite: raw.indusPropertyAddressSite || raw.propertyAddress || '',
      indusPropertyAddressLegal: raw.indusPropertyAddressLegal || '',
      indusNearbyLandmark: raw.indusNearbyLandmark || raw.landmark || '',

      // 4 Documents
      indusLayoutPlanProvided: raw.indusLayoutPlanProvided || 'Yes/No',
      indusLayoutAuthority: raw.indusLayoutAuthority || '',
      indusLayoutDateNumber: raw.indusLayoutDateNumber || '',
      indusBuildingPlanProvided: raw.indusBuildingPlanProvided || 'Yes/No',
      indusBuildingAuthority: raw.indusBuildingAuthority || '',
      indusBuildingDateNumber: raw.indusBuildingDateNumber || '',
      indusConstPermissionProvided: raw.indusConstPermissionProvided || 'Yes/No',
      indusConstAuthority: raw.indusConstAuthority || '',
      indusConstDateNumber: raw.indusConstDateNumber || '',
      indusApprovedUsage: raw.indusApprovedUsage || 'Residential',
      indusUsageAtSite: raw.indusUsageAtSite || 'Residential',
      indusDocListPerusal: raw.indusDocListPerusal || 'Copy of Sale deed & Approved plan',

      // 5 Physical
      indusBoundaryEastDoc: raw.indusBoundaryEastDoc || prefill?.boundaryEast || '',
      indusBoundaryEastSite: raw.indusBoundaryEastSite || prefill?.boundaryEast || '',
      indusBoundaryWestDoc: raw.indusBoundaryWestDoc || prefill?.boundaryWest || '',
      indusBoundaryWestSite: raw.indusBoundaryWestSite || prefill?.boundaryWest || '',
      indusBoundaryNorthDoc: raw.indusBoundaryNorthDoc || prefill?.boundaryNorth || '',
      indusBoundaryNorthSite: raw.indusBoundaryNorthSite || prefill?.boundaryNorth || '',
      indusBoundarySouthDoc: raw.indusBoundarySouthDoc || prefill?.boundarySouth || '',
      indusBoundarySouthSite: raw.indusBoundarySouthSite || prefill?.boundarySouth || '',
      indusBoundariesMatching: raw.indusBoundariesMatching || 'Yes',
      indusBoundariesRemarks: raw.indusBoundariesRemarks || 'Boundary matching as per document',
      indusPlotDetailsDoc: raw.indusPlotDetailsDoc || '',
      indusPlotDemarcated: raw.indusPlotDemarcated || 'Yes',
      indusApprovedLandUse: raw.indusApprovedLandUse || 'Residential',
      indusSurroundingInfrastructure: raw.indusSurroundingInfrastructure || 'Residential-developed',
      indusNatureOfLocality: raw.indusNatureOfLocality || 'Developed',
      indusClassOfLocality: raw.indusClassOfLocality || 'Middle Class',
      indusPropertyLocationLimit: raw.indusPropertyLocationLimit || 'Municipal Limit',
      indusDistanceFromOffice: raw.indusDistanceFromOffice || '',
      indusElectricityConnection: raw.indusElectricityConnection || 'Residential',
      indusTypeOfProperty: raw.indusTypeOfProperty || 'Residential',

      indusFloorDescriptionItems: raw.indusFloorDescriptionItems || [
        { floor: 'Ground Floor', rooms: '', kitchens: '', bathrooms: '', halls: '', usage: 'Residential' },
      ],

      indusTypeOfStructure: raw.indusTypeOfStructure || 'RCC Framed',
      indusInteriorsFinishing: raw.indusInteriorsFinishing || 'Good',
      indusExteriorsFinishing: raw.indusExteriorsFinishing || 'Good',
      indusMaintenanceLevel: raw.indusMaintenanceLevel || 'Good',
      indusAgeOfProperty: raw.indusAgeOfProperty || '',
      indusResidualAge: raw.indusResidualAge || '',
      indusAmenities: raw.indusAmenities || '',

      // 6 Occupancy
      indusOccupancyStatus: raw.indusOccupancyStatus || 'Occupied',
      indusOccupiedBy: raw.indusOccupiedBy || 'Owner',
      indusRelationshipOccupant: raw.indusRelationshipOccupant || 'Self',
      indusOccupantSince: raw.indusOccupantSince || '',
      indusCompletionStatus: raw.indusCompletionStatus || '100%',
      indusRentalValue: raw.indusRentalValue || '',

      // 7 Specific comments
      indusSpecificComments: raw.indusSpecificComments || '',

      // 8 Valuation
      indusValuationMode: raw.indusValuationMode || 'land_building', // 'land_building' | 'flat'

      // 8.a Land & Building
      indusValuationLandAreaApp: raw.indusValuationLandAreaApp ?? (prefill?.property?.plotArea ? String(prefill.property.plotArea) : ''),
      indusValuationLandAreaAct: raw.indusValuationLandAreaAct ?? (prefill?.property?.plotArea ? String(prefill.property.plotArea) : ''),
      indusPrevailingLandRange: raw.indusPrevailingLandRange || '',
      indusLandRateAdopted: raw.indusLandRateAdopted ?? (prefill?.property?.marketRate ? String(prefill.property.marketRate) : '0'),
      indusLandRateUnit: raw.indusLandRateUnit || 'Per sq.ft',

      indusBldgValueRows: raw.indusBldgValueRows || [
        { desc: 'Basement Floor', appArea: '0.00', actArea: '0.00', rate: '0', total: '0' },
        { desc: 'Ground Floor', appArea: '0.00', actArea: '0.00', rate: '0', total: '0' },
        { desc: 'First Floor', appArea: '0.00', actArea: '0.00', rate: '0', total: '0' },
        { desc: 'Second Floor', appArea: '0.00', actArea: '0.00', rate: '0', total: '0' },
      ],
      indusDepreciationPct: raw.indusDepreciationPct ?? '0',
      indusDepreciationPctText: raw.indusDepreciationPctText || '',

      // 8.b Flat / Shop
      indusFlatApp_UDS: raw.indusFlatApp_UDS || 'N.A.',
      indusFlatAct_UDS: raw.indusFlatAct_UDS || 'N.A.',
      indusFlatApp_BUA: raw.indusFlatApp_BUA || 'N.A.',
      indusFlatAct_BUA: raw.indusFlatAct_BUA || 'N.A.',
      indusFlatApp_Terrace: raw.indusFlatApp_Terrace || 'N.A.',
      indusFlatAct_Terrace: raw.indusFlatAct_Terrace || 'N.A.',
      indusFlatApp_SBUA: raw.indusFlatApp_SBUA || 'NA',
      indusFlatAct_SBUA: raw.indusFlatAct_SBUA || 'NA',
      indusFlatPrevailingRate: raw.indusFlatPrevailingRate || 'NA',
      indusFlatFMV: raw.indusFlatFMV || 'NA',
      indusTerraceFMV: raw.indusTerraceFMV || 'NA',
      indusPropertyFMVFlat: raw.indusPropertyFMVFlat || 'NA',

      // 8.c Remarks
      indusValuationRemarks: raw.indusValuationRemarks || 'NA',

      // 9 Deviation
      indusDeviationRows: raw.indusDeviationRows || [
        { detail: 'Total Plot area (sq.ft)', app: '0.00 sqft', site: '0.00 sqft', dev: '0.00 sqft', pct: 'NA' },
        { detail: 'No. of Floors', app: '0', site: '0', dev: '-', pct: 'NA' },
        { detail: 'No. Of Units', app: '0', site: '0', dev: '-', pct: 'NA' },
        { detail: 'Total Built-up area (sqft)', app: '0.00 sqft', site: '0.00 sqft', dev: '0.00 sqft', pct: 'NA' },
        { detail: 'Basement', app: '0.00 sqft', site: '0.00 sqft', dev: '0.00 sqft', pct: 'NA' },
        { detail: 'Ground Floor', app: '0.00 sqft', site: '0.00 sqft', dev: '0.00 sqft', pct: 'NA' },
        { detail: 'First Floor', app: '0.00 sqft', site: '0.00 sqft', dev: '0.00 sqft', pct: 'NA' },
        { detail: 'Second Floor', app: '0.00 sqft', site: '0.00 sqft', dev: '0.00 sqft', pct: 'NA' },
        { detail: 'FSI', app: 'N.A.', site: '', dev: 'N.A.', pct: 'N.A.' },
        { detail: 'Plot Coverage', app: 'N.A.', site: '', dev: 'N.A.', pct: 'N.A.' },
      ],
      indusSetbackPlanNote: raw.indusSetbackPlanNote || 'Plan details not provided',

      // 10 Remarks & Declaration
      indusSynthesizedRemarks: raw.indusSynthesizedRemarks || '',
      indusValuationPlace: raw.indusValuationPlace || 'Bhubaneswar',

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
  // Auto Calculations for Land & Building Valuation
  // ─────────────────────────────────────────────────────────────
  const calculatedLandValue = useMemo(() => {
    const area = parseFloat(fields.indusValuationLandAreaAct) || 0;
    const rate = parseFloat(fields.indusLandRateAdopted) || 0;
    return Math.round(area * rate);
  }, [fields.indusValuationLandAreaAct, fields.indusLandRateAdopted]);

  const { totalAppBUA, totalActBUA, totalConstCost, netConstValue, totalFMV } = useMemo(() => {
    let appSum = 0;
    let actSum = 0;
    let constCost = 0;

    const bldgRows = Array.isArray(fields.indusBldgValueRows) ? fields.indusBldgValueRows : [];
    for (const r of bldgRows) {
      const appA = parseFloat(r.appArea) || 0;
      const actA = parseFloat(r.actArea) || 0;
      const rate = parseFloat(r.rate) || 0;
      appSum += appA;
      actSum += actA;
      constCost += Math.round(actA * rate);
    }

    const depPct = parseFloat(fields.indusDepreciationPct) || 0;
    const depVal = Math.round((constCost * depPct) / 100);
    const netConst = constCost - depVal;
    const fmv = calculatedLandValue + netConst;

    return {
      totalAppBUA: appSum,
      totalActBUA: actSum,
      totalConstCost: constCost,
      netConstValue: netConst,
      totalFMV: fmv,
    };
  }, [fields.indusBldgValueRows, fields.indusDepreciationPct, calculatedLandValue]);

  // Sync formatted strings to fields
  useEffect(() => {
    setFields((prev: any) => {
      const formattedLandVal = `Rs.${formatIndianCurrency(calculatedLandValue)}/-`;
      const formattedConstVal = `Rs.${formatIndianCurrency(totalConstCost)}/-`;
      const formattedNetConst = `Rs.${formatIndianCurrency(netConstValue)}/-`;
      const formattedFMV = `Rs.${formatIndianCurrency(totalFMV)}/-`;
      const words = `(${rupeesInWords(totalFMV)})`;

      if (
        prev.indusTotalLandValue === formattedLandVal &&
        prev.indusTotalFMVLandBldg === formattedFMV &&
        prev.indusFMVWords === words
      ) {
        return prev;
      }

      return {
        ...prev,
        indusTotalLandValue: formattedLandVal,
        indusTotalConstructionVal: formattedConstVal,
        indusDepreciatedConstVal: formattedNetConst,
        indusTotalFMVLandBldg: formattedFMV,
        indusFMVWords: words,
        indusTotalAppBUA: `${totalAppBUA.toFixed(2)} sqft`,
        indusTotalActBUA: `${totalActBUA.toFixed(2)} sqft`,
      };
    });
  }, [calculatedLandValue, totalAppBUA, totalActBUA, totalConstCost, netConstValue, totalFMV]);

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
    if (!confirm('Are you sure you want to submit this report for verification?')) return;
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
      if (b) {
        docBytesList.push({ bytes: b, title: fields.documentImageNames?.[i] });
      }
    }

    const photoBytesList: { bytes: Uint8Array; label?: string }[] = [];
    for (let i = 0; i < (fields.propertyImages || []).length; i++) {
      const b = await fetchBytes(fields.propertyImages[i]);
      if (b) {
        photoBytesList.push({ bytes: b, label: fields.propertyImageNames?.[i] });
      }
    }

    const locMapBytes = (await Promise.all((fields.locationMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const mouzaMapBytes = (await Promise.all((fields.mouzaMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const sketchMapBytes = (await Promise.all((fields.sketchMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const cadastralMapBytes = (await Promise.all((fields.cadastralMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);
    const bdaMapBytes = (await Promise.all((fields.bdaMapImages || []).map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    const renderer = new PDFIndusIndHLLAPRenderer({
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
      a.download = `${sanitizeFilenameCode(`IndusInd_HL_LAP_${projectCode || projectId}`)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Error downloading PDF: ${e.message}`);
    }
  };

  // Document Upload Handlers
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
        documentImageNames: [
          ...(p.documentImageNames || []),
          ...urls.map(() => ''),
        ],
      }));
    } catch (err: any) {
      alert(`Error uploading documents: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDocumentRemove = (idx: number) => {
    setFields((p: any) => ({
      ...p,
      documentImages: (p.documentImages || []).filter((_: any, i: number) => i !== idx),
      documentImageNames: (p.documentImageNames || []).filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleDocumentRename = (idx: number, name: string) => {
    const arr = [...(fields.documentImageNames || [])];
    while (arr.length <= idx) arr.push('');
    arr[idx] = name;
    setFields((p: any) => ({ ...p, documentImageNames: arr }));
  };

  const handleDocumentReorder = (newImgs: string[], newNames: string[]) => {
    setFields((p: any) => ({ ...p, documentImages: newImgs, documentImageNames: newNames }));
  };

  // Map Upload Handlers
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

  const handleMapRemove = (category: string, idx: number) => {
    setFields((p: any) => ({
      ...p,
      [category]: (p[category] || []).filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleMapReorder = (category: string, newImgs: string[]) => {
    setFields((p: any) => ({ ...p, [category]: newImgs }));
  };

  // Photo Upload Handlers
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

  const handlePhotoRemove = (idx: number) => {
    setFields((p: any) => ({
      ...p,
      propertyImages: (p.propertyImages || []).filter((_: any, i: number) => i !== idx),
      propertyImageNames: (p.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
    }));
  };

  const handlePhotoRename = (idx: number, name: string) => {
    const arr = [...(fields.propertyImageNames || [])];
    while (arr.length <= idx) arr.push('');
    arr[idx] = name;
    setFields((p: any) => ({ ...p, propertyImageNames: arr }));
  };

  const handlePhotoReorder = (newImgs: string[], newNames: string[]) => {
    setFields((p: any) => ({ ...p, propertyImages: newImgs, propertyImageNames: newNames }));
  };

  // Nav Items
  const navSections: NavItem[] = [
    { id: 'section-1', title: 'General Details' },
    { id: 'section-2', title: 'Customer Details' },
    { id: 'section-3', title: 'Property Details' },
    { id: 'section-4', title: 'Document Details' },
    { id: 'section-5', title: 'Physical Details' },
    { id: 'section-6', title: 'Occupancy Details' },
    { id: 'section-7', title: 'Specific Comments' },
    { id: 'section-8', title: 'Valuation & Calculations' },
    { id: 'section-9', title: 'Deviation Details' },
    { id: 'section-10', title: 'Declaration & Signature' },
    { id: 'section-documents', title: 'Documents' },
    { id: 'section-maps', title: 'Maps' },
    { id: 'section-photos', title: 'Photographs' },
  ];

  return (
    <div className="space-y-6 pb-28 w-full">
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* Center Main Form */}
        <div className="flex-1 min-w-0 space-y-8 w-full">
          {/* Standardized Universal Bank Report Header */}
          <BankReportHeader
            bankName={fields.organisationTemplate || 'INDUSIND BANK'}
            subclass={fields.organisationSubTemplate || 'HL-LAP Format'}
            clientType="organisation"
            category="Bank & FIS"
            onResetWizard={onResetWizard}
            title="Valuation Report Builder"
            description="Comprehensive Housing Loan & Loan Against Property Valuation Engine."
            earliestVisit={getEarliestFieldVisit(bucketImages, prefill)}
            projectCode={projectCode}
            reworkNotes={fields.reworkNotes}
            status={status}
            message={message}
          />

{/* Section 1: General Details */}
          <Section id="section-1" title="General Details" number={1}>
            <div className="border border-slate-200 bg-[#F8FAFC] rounded-xl p-4 sm:p-5 shadow-2xs space-y-4">
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Bank &amp; Inspection Info
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Valuation Request Given By">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusValuationRequestedBy}
                    onChange={(e) => updateField('indusValuationRequestedBy', e.target.value)}
                  />
                </Field>
                <Field label="Property is Occupied By">
                  <select
                    className={selectCls}
                    value={fields.indusPropertyOccupiedBy}
                    onChange={(e) => updateField('indusPropertyOccupiedBy', e.target.value)}
                  >
                    <option value="Vacant">Vacant</option>
                    <option value="Owner">Owner</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Self & Tenant">Self & Tenant</option>
                  </select>
                </Field>
                <Field label="Purpose of Valuation">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusPurposeOfValuation}
                    onChange={(e) => updateField('indusPurposeOfValuation', e.target.value)}
                  />
                </Field>
                <Field label="Date of Valuation Report">
                  <input
                    type="date"
                    className={inputCls}
                    value={fields.indusDateOfReport}
                    onChange={(e) => updateField('indusDateOfReport', e.target.value)}
                  />
                </Field>
                <Field label="Field Engineer Name">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusFieldEngineerName}
                    onChange={(e) => updateField('indusFieldEngineerName', e.target.value)}
                  />
                </Field>
                <div className="space-y-1.5">
                  <Field label="Date of Visit / Inspection">
                    <input
                      type="date"
                      className={inputCls}
                      value={fields.indusDateOfVisit}
                      onChange={(e) => updateField('indusDateOfVisit', e.target.value)}
                    />
                  </Field>
                  <EarliestFieldVisitBadge
                    fieldVisit={getEarliestFieldVisit(bucketImages, prefill)}
                    currentValue={fields.indusDateOfVisit}
                    onSync={(dt) => updateField('indusDateOfVisit', dt)}
                    isReadOnly={isReadOnly}
                  />
                </div>
                <div className="md:col-span-2">
                  <Field label="Assessment of FMV & Vetted By">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.indusVettedByName}
                      onChange={(e) => updateField('indusVettedByName', e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </Section>

          {/* Section 2: Customer Details */}
          <Section id="section-2" title="Customer Details" number={2}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name of Customer / Applicant">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.indusCustomerName}
                  onChange={(e) => updateField('indusCustomerName', e.target.value)}
                />
              </Field>
              <Field label="Application Number (of file)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.indusApplicationNumber}
                  onChange={(e) => updateField('indusApplicationNumber', e.target.value)}
                />
              </Field>
              <Field label="Property Owner Name (as reported)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.indusPropertyOwnerName}
                  onChange={(e) => updateField('indusPropertyOwnerName', e.target.value)}
                />
              </Field>
              <Field label="Person Met at Site (with Phone No)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.indusPersonMetAtSite}
                  onChange={(e) => updateField('indusPersonMetAtSite', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* Section 3: Property Details */}
          <Section id="section-3" title="Property Details" number={3}>
            <div className="space-y-4">
              <Field label="Address of Property (at site) i.e. Postal address with Pin-code & Phone no">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.indusPropertyAddressSite}
                  onChange={(e) => updateField('indusPropertyAddressSite', e.target.value)}
                />
              </Field>
              <Field label="Address as per Legal Document (Khata / Plot / Mouza / Tahasil)">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.indusPropertyAddressLegal}
                  onChange={(e) => updateField('indusPropertyAddressLegal', e.target.value)}
                />
              </Field>
              <Field label="Nearby Landmark">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.indusNearbyLandmark}
                  onChange={(e) => updateField('indusNearbyLandmark', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* Section 4: Document Details */}
          <Section id="section-4" title="Document Details" number={4}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border p-3 rounded bg-slate-50">
                <Field label="Layout Plan Provided?">
                  <select
                    className={selectCls}
                    value={fields.indusLayoutPlanProvided}
                    onChange={(e) => updateField('indusLayoutPlanProvided', e.target.value)}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Yes/No">Yes/No</option>
                  </select>
                </Field>
                <Field label="Approving Authority">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusLayoutAuthority}
                    onChange={(e) => updateField('indusLayoutAuthority', e.target.value)}
                  />
                </Field>
                <Field label="Approval Date & Number">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusLayoutDateNumber}
                    onChange={(e) => updateField('indusLayoutDateNumber', e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border p-3 rounded bg-slate-50">
                <Field label="Building Plan Provided?">
                  <select
                    className={selectCls}
                    value={fields.indusBuildingPlanProvided}
                    onChange={(e) => updateField('indusBuildingPlanProvided', e.target.value)}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Yes/No">Yes/No</option>
                  </select>
                </Field>
                <Field label="Approving Authority">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBuildingAuthority}
                    onChange={(e) => updateField('indusBuildingAuthority', e.target.value)}
                  />
                </Field>
                <Field label="Approval Date & Number">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBuildingDateNumber}
                    onChange={(e) => updateField('indusBuildingDateNumber', e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border p-3 rounded bg-slate-50">
                <Field label="Construction Permission?">
                  <select
                    className={selectCls}
                    value={fields.indusConstPermissionProvided}
                    onChange={(e) => updateField('indusConstPermissionProvided', e.target.value)}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Yes/No">Yes/No</option>
                  </select>
                </Field>
                <Field label="Approving Authority">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusConstAuthority}
                    onChange={(e) => updateField('indusConstAuthority', e.target.value)}
                  />
                </Field>
                <Field label="Approval Date & Number">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusConstDateNumber}
                    onChange={(e) => updateField('indusConstDateNumber', e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Type of Approved Usage as per Plan">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusApprovedUsage}
                    onChange={(e) => updateField('indusApprovedUsage', e.target.value)}
                  />
                </Field>
                <Field label="Type of Usage at Site">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusUsageAtSite}
                    onChange={(e) => updateField('indusUsageAtSite', e.target.value)}
                  />
                </Field>
              </div>

              <Field label="List of Property Document Produced for Perusal">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.indusDocListPerusal}
                  onChange={(e) => updateField('indusDocListPerusal', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* Section 5: Physical Details */}
          <Section id="section-5" title="Physical Details" number={5}>
            <div className="space-y-6">
              {/* 5.A Boundaries Table */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">5.A Boundaries on Site</h4>
                <div className="overflow-x-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="p-2 text-left w-24">Direction</th>
                        <th className="p-2 text-left">As per Documents</th>
                        <th className="p-2 text-left">Actual at Site</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="p-2 font-medium">East</td>
                        <td className="p-2"><input type="text" className={inputCls} value={fields.indusBoundaryEastDoc} onChange={(e) => updateField('indusBoundaryEastDoc', e.target.value)} /></td>
                        <td className="p-2"><input type="text" className={inputCls} value={fields.indusBoundaryEastSite} onChange={(e) => updateField('indusBoundaryEastSite', e.target.value)} /></td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">West</td>
                        <td className="p-2"><input type="text" className={inputCls} value={fields.indusBoundaryWestDoc} onChange={(e) => updateField('indusBoundaryWestDoc', e.target.value)} /></td>
                        <td className="p-2"><input type="text" className={inputCls} value={fields.indusBoundaryWestSite} onChange={(e) => updateField('indusBoundaryWestSite', e.target.value)} /></td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">North</td>
                        <td className="p-2"><input type="text" className={inputCls} value={fields.indusBoundaryNorthDoc} onChange={(e) => updateField('indusBoundaryNorthDoc', e.target.value)} /></td>
                        <td className="p-2"><input type="text" className={inputCls} value={fields.indusBoundaryNorthSite} onChange={(e) => updateField('indusBoundaryNorthSite', e.target.value)} /></td>
                      </tr>
                      <tr>
                        <td className="p-2 font-medium">South</td>
                        <td className="p-2"><input type="text" className={inputCls} value={fields.indusBoundarySouthDoc} onChange={(e) => updateField('indusBoundarySouthDoc', e.target.value)} /></td>
                        <td className="p-2"><input type="text" className={inputCls} value={fields.indusBoundarySouthSite} onChange={(e) => updateField('indusBoundarySouthSite', e.target.value)} /></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5.B Boundaries Matching */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Boundaries Matching?">
                  <select
                    className={selectCls}
                    value={fields.indusBoundariesMatching}
                    onChange={(e) => updateField('indusBoundariesMatching', e.target.value)}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Yes / No">Yes / No</option>
                  </select>
                </Field>
                <Field label="Boundaries Remarks">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusBoundariesRemarks}
                    onChange={(e) => updateField('indusBoundariesRemarks', e.target.value)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Plot Details as per Document">
                  <input type="text" className={inputCls} value={fields.indusPlotDetailsDoc} onChange={(e) => updateField('indusPlotDetailsDoc', e.target.value)} />
                </Field>
                <Field label="Flat / Plot Demarcated at Site?">
                  <select className={selectCls} value={fields.indusPlotDemarcated} onChange={(e) => updateField('indusPlotDemarcated', e.target.value)}>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                    <option value="Yes / No">Yes / No</option>
                  </select>
                </Field>
                <Field label="Approved Land/Building Use">
                  <input type="text" className={inputCls} value={fields.indusApprovedLandUse} onChange={(e) => updateField('indusApprovedLandUse', e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Infrastructure of Surrounding Area">
                  <input type="text" className={inputCls} value={fields.indusSurroundingInfrastructure} onChange={(e) => updateField('indusSurroundingInfrastructure', e.target.value)} />
                </Field>
                <Field label="Nature of Locality">
                  <input type="text" className={inputCls} value={fields.indusNatureOfLocality} onChange={(e) => updateField('indusNatureOfLocality', e.target.value)} />
                </Field>
                <Field label="Class of Locality">
                  <input type="text" className={inputCls} value={fields.indusClassOfLocality} onChange={(e) => updateField('indusClassOfLocality', e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Property Location Limit">
                  <input type="text" className={inputCls} value={fields.indusPropertyLocationLimit} onChange={(e) => updateField('indusPropertyLocationLimit', e.target.value)} />
                </Field>
                <Field label="Distance from Indusind Office">
                  <input type="text" className={inputCls} value={fields.indusDistanceFromOffice} onChange={(e) => updateField('indusDistanceFromOffice', e.target.value)} />
                </Field>
                <Field label="Electricity Connection">
                  <input type="text" className={inputCls} value={fields.indusElectricityConnection} onChange={(e) => updateField('indusElectricityConnection', e.target.value)} />
                </Field>
                <Field label="Type of Property">
                  <input type="text" className={inputCls} value={fields.indusTypeOfProperty} onChange={(e) => updateField('indusTypeOfProperty', e.target.value)} />
                </Field>
              </div>

              {/* 5.M Floor-wise Description Table */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">5.M Property Description (Floor-wise)</h4>
                <div className="overflow-x-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 border-b">
                      <tr>
                        <th className="p-2 text-left">Floor</th>
                        <th className="p-2 text-left">No. of Rooms</th>
                        <th className="p-2 text-left">No. of Kitchens</th>
                        <th className="p-2 text-left">No. of Bathrooms</th>
                        <th className="p-2 text-left">No. of Hall</th>
                        <th className="p-2 text-left">Usage & Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {(fields.indusFloorDescriptionItems || []).map((f: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2 font-medium">{f.floor}</td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={f.rooms}
                              onChange={(e) => {
                                const copy = [...fields.indusFloorDescriptionItems];
                                copy[idx].rooms = e.target.value;
                                updateField('indusFloorDescriptionItems', copy);
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={f.kitchens}
                              onChange={(e) => {
                                const copy = [...fields.indusFloorDescriptionItems];
                                copy[idx].kitchens = e.target.value;
                                updateField('indusFloorDescriptionItems', copy);
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={f.bathrooms}
                              onChange={(e) => {
                                const copy = [...fields.indusFloorDescriptionItems];
                                copy[idx].bathrooms = e.target.value;
                                updateField('indusFloorDescriptionItems', copy);
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={f.halls}
                              onChange={(e) => {
                                const copy = [...fields.indusFloorDescriptionItems];
                                copy[idx].halls = e.target.value;
                                updateField('indusFloorDescriptionItems', copy);
                              }}
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              className={inputCls}
                              value={f.usage}
                              onChange={(e) => {
                                const copy = [...fields.indusFloorDescriptionItems];
                                copy[idx].usage = e.target.value;
                                updateField('indusFloorDescriptionItems', copy);
                              }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Type of Structure">
                  <input type="text" className={inputCls} value={fields.indusTypeOfStructure} onChange={(e) => updateField('indusTypeOfStructure', e.target.value)} />
                </Field>
                <Field label="Interiors Finishing">
                  <input type="text" className={inputCls} value={fields.indusInteriorsFinishing} onChange={(e) => updateField('indusInteriorsFinishing', e.target.value)} />
                </Field>
                <Field label="Exteriors Finishing">
                  <input type="text" className={inputCls} value={fields.indusExteriorsFinishing} onChange={(e) => updateField('indusExteriorsFinishing', e.target.value)} />
                </Field>
                <Field label="Maintenance Level">
                  <input type="text" className={inputCls} value={fields.indusMaintenanceLevel} onChange={(e) => updateField('indusMaintenanceLevel', e.target.value)} />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Field label="Age of Property">
                  <input type="text" className={inputCls} value={fields.indusAgeOfProperty} onChange={(e) => updateField('indusAgeOfProperty', e.target.value)} />
                </Field>
                <Field label="Residual Age (Years)">
                  <input type="text" className={inputCls} value={fields.indusResidualAge} onChange={(e) => updateField('indusResidualAge', e.target.value)} />
                </Field>
                <Field label="Amenities">
                  <input type="text" className={inputCls} value={fields.indusAmenities} onChange={(e) => updateField('indusAmenities', e.target.value)} />
                </Field>
              </div>
            </div>
          </Section>

          {/* Section 6: Occupancy Details */}
          <Section id="section-6" title="Occupancy Details" number={6}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Status of Occupancy">
                <input type="text" className={inputCls} value={fields.indusOccupancyStatus} onChange={(e) => updateField('indusOccupancyStatus', e.target.value)} />
              </Field>
              <Field label="Occupied By">
                <input type="text" className={inputCls} value={fields.indusOccupiedBy} onChange={(e) => updateField('indusOccupiedBy', e.target.value)} />
              </Field>
              <Field label="Relationship with Customer">
                <input type="text" className={inputCls} value={fields.indusRelationshipOccupant} onChange={(e) => updateField('indusRelationshipOccupant', e.target.value)} />
              </Field>
              <Field label="Occupied Since">
                <input type="text" className={inputCls} value={fields.indusOccupantSince} onChange={(e) => updateField('indusOccupantSince', e.target.value)} />
              </Field>
              <Field label="Completion Status (%)">
                <input type="text" className={inputCls} value={fields.indusCompletionStatus} onChange={(e) => updateField('indusCompletionStatus', e.target.value)} />
              </Field>
              <Field label="Rental Value">
                <input type="text" className={inputCls} value={fields.indusRentalValue} onChange={(e) => updateField('indusRentalValue', e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Section 7: Specific Comments */}
          <Section id="section-7" title="Specific Comments" number={7}>
            <Field label="Detailed Comments & Technical Observations">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.indusSpecificComments}
                onChange={(e) => updateField('indusSpecificComments', e.target.value)}
              />
            </Field>
          </Section>

          {/* Section 8: Valuation */}
          <Section id="section-8" title="Valuation & Calculations" number={8}>
            <div className="space-y-6">
              <div className="flex items-center gap-4 border-b pb-3">
                <label className="text-sm font-semibold text-slate-700">Valuation Mode:</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="valMode"
                      value="land_building"
                      checked={fields.indusValuationMode === 'land_building'}
                      onChange={() => updateField('indusValuationMode', 'land_building')}
                    />
                    8.a Row house / Bungalow / Land & Building
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="valMode"
                      value="flat"
                      checked={fields.indusValuationMode === 'flat'}
                      onChange={() => updateField('indusValuationMode', 'flat')}
                    />
                    8.b Flat / Shop (UDS / Super Built-up)
                  </label>
                </div>
              </div>

              {/* 8.a Land & Building Table */}
              {fields.indusValuationMode === 'land_building' && (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-slate-700">8.a Land & Building Construction Valuation</h4>

                  {/* Land Component */}
                  <div className="border p-4 rounded bg-slate-50 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">Land Valuation</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Field label="Land Area (sqft)">
                        <input
                          type="number"
                          className={inputCls}
                          value={fields.indusValuationLandAreaAct}
                          onChange={(e) => updateField('indusValuationLandAreaAct', e.target.value)}
                        />
                      </Field>
                      <Field label="Adopted Rate (Rs.)">
                        <input
                          type="number"
                          className={inputCls}
                          value={fields.indusLandRateAdopted}
                          onChange={(e) => updateField('indusLandRateAdopted', e.target.value)}
                        />
                      </Field>
                      <Field label="Rate Unit">
                        <input
                          type="text"
                          className={inputCls}
                          value={fields.indusLandRateUnit}
                          onChange={(e) => updateField('indusLandRateUnit', e.target.value)}
                        />
                      </Field>
                      <Field label="Total Land Value (Auto)">
                        <input
                          type="text"
                          className={`${inputCls} font-bold bg-slate-100`}
                          value={`Rs.${formatIndianCurrency(calculatedLandValue)}/-`}
                          readOnly
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Building Component Table */}
                  <div className="border p-4 rounded bg-slate-50 space-y-3">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">Building Floor Breakdown</h5>
                    </div>
                    <div className="overflow-x-auto border rounded">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 border-b">
                          <tr>
                            <th className="p-2 text-left">Floor / Item</th>
                            <th className="p-2 text-left">Approved Area (sqft)</th>
                            <th className="p-2 text-left">Actual Area (sqft)</th>
                            <th className="p-2 text-left">Rate (Per sqft)</th>
                            <th className="p-2 text-left">Total (Rs.)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {(fields.indusBldgValueRows || []).map((row: any, idx: number) => {
                            const rowTot = Math.round((parseFloat(row.actArea) || 0) * (parseFloat(row.rate) || 0));
                            return (
                              <tr key={idx}>
                                <td className="p-2 font-medium">{row.desc}</td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className={`${inputCls} font-mono`}
                                    value={row.appArea}
                                    onChange={(e) => {
                                      const copy = [...fields.indusBldgValueRows];
                                      copy[idx].appArea = e.target.value;
                                      updateField('indusBldgValueRows', copy);
                                    }}
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className={`${inputCls} font-mono`}
                                    value={row.actArea}
                                    onChange={(e) => {
                                      const copy = [...fields.indusBldgValueRows];
                                      copy[idx].actArea = e.target.value;
                                      copy[idx].total = String(Math.round((parseFloat(e.target.value) || 0) * (parseFloat(row.rate) || 0)));
                                      updateField('indusBldgValueRows', copy);
                                    }}
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className={`${inputCls} font-mono`}
                                    value={row.rate}
                                    onChange={(e) => {
                                      const copy = [...fields.indusBldgValueRows];
                                      copy[idx].rate = e.target.value;
                                      copy[idx].total = String(Math.round((parseFloat(row.actArea) || 0) * (parseFloat(e.target.value) || 0)));
                                      updateField('indusBldgValueRows', copy);
                                    }}
                                  />
                                </td>
                                <td className="p-2 font-semibold font-mono">
                                  Rs. {formatIndianCurrency(rowTot)}/-
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <Field label="Total Construction Cost">
                        <input
                          type="text"
                          className={`${inputCls} font-bold bg-slate-100`}
                          value={`Rs.${formatIndianCurrency(totalConstCost)}/-`}
                          readOnly
                        />
                      </Field>
                      <Field label="Depreciation (%)">
                        <input
                          type="number"
                          className={inputCls}
                          value={fields.indusDepreciationPct}
                          onChange={(e) => updateField('indusDepreciationPct', e.target.value)}
                        />
                      </Field>
                      <Field label="Net Value of Construction">
                        <input
                          type="text"
                          className={`${inputCls} font-bold bg-slate-100`}
                          value={`Rs.${formatIndianCurrency(netConstValue)}/-`}
                          readOnly
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Total FMV Highlight Banner */}
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-emerald-800">
                        Total Fair Market Value (Land + Building):
                      </span>
                      <span className="text-xl font-extrabold text-emerald-900">
                        Rs.{formatIndianCurrency(totalFMV)}/-
                      </span>
                    </div>
                    <p className="text-xs font-medium text-emerald-700 italic">
                      {rupeesInWords(totalFMV)}
                    </p>
                  </div>
                </div>
              )}

              {/* 8.b Flat / Shop Table */}
              {fields.indusValuationMode === 'flat' && (
                <div className="space-y-4 border p-4 rounded bg-slate-50">
                  <h4 className="text-sm font-semibold text-slate-700">8.b Flat / Shop Valuation Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Land Area / UDS">
                      <input type="text" className={inputCls} value={fields.indusFlatAct_UDS} onChange={(e) => updateField('indusFlatAct_UDS', e.target.value)} />
                    </Field>
                    <Field label="Built-up Area (Measured)">
                      <input type="text" className={inputCls} value={fields.indusFlatAct_BUA} onChange={(e) => updateField('indusFlatAct_BUA', e.target.value)} />
                    </Field>
                    <Field label="Super Built-up Area">
                      <input type="text" className={inputCls} value={fields.indusFlatAct_SBUA} onChange={(e) => updateField('indusFlatAct_SBUA', e.target.value)} />
                    </Field>
                    <Field label="Prevailing Market Rate">
                      <input type="text" className={inputCls} value={fields.indusFlatPrevailingRate} onChange={(e) => updateField('indusFlatPrevailingRate', e.target.value)} />
                    </Field>
                    <Field label="FMV of Flat (Rs.)">
                      <input type="text" className={inputCls} value={fields.indusFlatFMV} onChange={(e) => updateField('indusFlatFMV', e.target.value)} />
                    </Field>
                    <Field label="FMV of Terrace (Rs.)">
                      <input type="text" className={inputCls} value={fields.indusTerraceFMV} onChange={(e) => updateField('indusTerraceFMV', e.target.value)} />
                    </Field>
                  </div>
                </div>
              )}

              <Field label="Valuation Remarks">
                <input type="text" className={inputCls} value={fields.indusValuationRemarks} onChange={(e) => updateField('indusValuationRemarks', e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Section 9: Deviations */}
          <Section id="section-9" title="Deviation Details" number={9}>
            <div className="space-y-4">
              <div className="overflow-x-auto border rounded">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="p-2 text-left">Detail</th>
                      <th className="p-2 text-left">As Per Approved</th>
                      <th className="p-2 text-left">As Per Site</th>
                      <th className="p-2 text-left">Deviation</th>
                      <th className="p-2 text-left">% of Deviation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {(fields.indusDeviationRows || []).map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td className="p-2 font-medium">{d.detail}</td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={d.app}
                            onChange={(e) => {
                              const copy = [...fields.indusDeviationRows];
                              copy[idx].app = e.target.value;
                              updateField('indusDeviationRows', copy);
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={d.site}
                            onChange={(e) => {
                              const copy = [...fields.indusDeviationRows];
                              copy[idx].site = e.target.value;
                              updateField('indusDeviationRows', copy);
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={d.dev}
                            onChange={(e) => {
                              const copy = [...fields.indusDeviationRows];
                              copy[idx].dev = e.target.value;
                              updateField('indusDeviationRows', copy);
                            }}
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            className={inputCls}
                            value={d.pct}
                            onChange={(e) => {
                              const copy = [...fields.indusDeviationRows];
                              copy[idx].pct = e.target.value;
                              updateField('indusDeviationRows', copy);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Field label="Setback Plan Note">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.indusSetbackPlanNote}
                  onChange={(e) => updateField('indusSetbackPlanNote', e.target.value)}
                />
              </Field>
            </div>
          </Section>

          {/* Section 10: Remarks & Declaration */}
          <Section id="section-10" title="Declaration & Signature" number={10}>
            <div className="space-y-4">
              <Field label="Synthesized Remarks">
                <textarea
                  rows={4}
                  className={inputCls}
                  value={fields.indusSynthesizedRemarks}
                  onChange={(e) => updateField('indusSynthesizedRemarks', e.target.value)}
                />
              </Field>

              <div className="border p-4 rounded bg-slate-50 space-y-2 text-sm text-slate-700 leading-relaxed text-justify">
                <p className="font-semibold">I/We hereby declare that :</p>
                <p>(1) The property was inspected by me/us</p>
                <p>(2) I/We have no direct or Indirect Interest in the property valued</p>
                <p>(3) The information furnished above is true and correct to my/our knowledge</p>
                <p className="font-bold text-slate-900">
                  (4) Total Fair Market Value of the property is {fields.indusTotalFMVLandBldg || `Rs.${formatIndianCurrency(totalFMV)}/-`}
                </p>
                <p className="italic text-slate-600 font-medium">
                  {fields.indusFMVWords || `(${rupeesInWords(totalFMV)})`}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <Field label="Valuation Place">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.indusValuationPlace}
                    onChange={(e) => updateField('indusValuationPlace', e.target.value)}
                  />
                </Field>
                <Field label="Signature Date">
                  <input
                    type="date"
                    className={inputCls}
                    value={fields.indusDateOfReport}
                    onChange={(e) => updateField('indusDateOfReport', e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </Section>

          {/* SECTION 11: Documents */}
          <BaseDocumentsSection
            title="Documents" sectionNumber={11}
            sectionId="section-documents"
            documentImages={fields.documentImages || []}
            documentImageNames={fields.documentImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onUploadDocument={handleDocumentUpload}
            onRemoveDocument={handleDocumentRemove}
            onDocumentNameChange={handleDocumentRename}
            onReorderDocuments={handleDocumentReorder}
          />

          {/* SECTION 12: Maps */}
          <BaseMapsSection
            title="Maps" sectionNumber={12}
            sectionId="section-maps"
            locationMapImages={fields.locationMapImages || []}
            mouzaMapImages={fields.mouzaMapImages || []}
            sketchMapImages={fields.sketchMapImages || []}
            cadastralMapImages={fields.cadastralMapImages || []}
            bdaMapImages={fields.bdaMapImages || []}
            latitude={fields.latitude}
            longitude={fields.longitude}
            technicalAddress={fields.indusPropertyAddressSite || ''}
            propertyAddress={fields.indusPropertyAddressLegal || ''}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
            onLocationMapRemove={(idx) => handleMapRemove('locationMapImages', idx ?? 0)}
            onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
            onMouzaMapRemove={(idx) => handleMapRemove('mouzaMapImages', idx ?? 0)}
            onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
            onSketchMapRemove={(idx) => handleMapRemove('sketchMapImages', idx)}
            onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
            onCadastralMapRemove={(idx) => handleMapRemove('cadastralMapImages', idx ?? 0)}
            onBdaMapUpload={(e) => handleMapUpload('bdaMapImages', e)}
            onBdaMapRemove={(idx) => handleMapRemove('bdaMapImages', idx ?? 0)}
            onReorderLocationMap={(newImgs) => handleMapReorder('locationMapImages', newImgs)}
            onReorderMouzaMap={(newImgs) => handleMapReorder('mouzaMapImages', newImgs)}
            onReorderSketchMap={(newImgs) => handleMapReorder('sketchMapImages', newImgs)}
            onReorderCadastralMap={(newImgs) => handleMapReorder('cadastralMapImages', newImgs)}
            onReorderBdaMap={(newImgs) => handleMapReorder('bdaMapImages', newImgs)}
          />

          {/* SECTION 13: Property Photographs */}
          <BasePhotographsSection
            title="Photographs" sectionNumber={13}
            sectionId="section-photos"
            propertyImages={fields.propertyImages || []}
            propertyImageNames={fields.propertyImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            bucketCount={bucketImages?.length || 0}
            onOpenBucketPicker={() => setShowBucketModal(true)}
            onUploadImages={handlePhotoUpload}
            onRemoveImage={handlePhotoRemove}
            onImageNameChange={handlePhotoRename}
            onReorderImages={handlePhotoReorder}
          />

        </div>

        {/* Floating Navigator */}
        <FloatingNavigator sections={navSections} />
      </div>

      {/* STANDARDIZED ACTION BAR */}
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

      {/* Cloud Photo Bucket Picker Modal */}
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
