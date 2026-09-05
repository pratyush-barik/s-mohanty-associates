'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { PDFAnnapurnaMicroRenderer, AnnapurnaMicroReportFields } from '@/lib/banks/pdf-annapurna-micro-renderer';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ActiveConfigBanner,
  ReportActionBar,
  NavItem,
  formatAssignedEngineers,
  BasePhotographsSection,
  BaseMapsSection,
  BaseAnnexureSection,
} from '../BaseBankReportComponents';
import { reorderAndLabelAnnexures, AnnexureItem, normalizeMapImages } from '@/lib/bank-fields';
import { decodeHtmlEntitiesDeep } from '@/lib/html-entities';
// @ts-ignore
import * as XLSX from 'xlsx';

export interface AnnapurnaMicroProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole: string;
  bucketImages?: any[];
  prefill?: any;
  onResetWizard?: () => void;
}

const parseNum = (v: any): number => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

export default function AnnapurnaMicro({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: AnnapurnaMicroProps) {
  const router = useRouter();
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  // ── Clean Initial State (ZERO dummy prefills) ──
  const initialData: AnnapurnaMicroReportFields = useMemo(() => {
    const raw = (typeof initialFields === 'object' && initialFields !== null) ? initialFields : {};
    return {
      // Section 1: Application Details
      refNo: raw.refNo || (projectCode ? `AFPL/${projectCode}` : 'AFPL/'),
      reportDate: raw.reportDate || raw.dateOfValuation || new Date().toLocaleDateString('en-GB'),
      fileNo: raw.fileNo || '',
      dateOfVisit: raw.dateOfVisit || raw.dateOfInspection || prefill?.inspectionDate || '',
      applicantName: raw.applicantName || prefill?.contactName || '',
      contactPerson: raw.contactPerson || prefill?.contactName || '',
      loanType: raw.loanType || 'LAP',
      personMetOnSite: raw.personMetOnSite || '',
      ownerName: raw.ownerName || prefill?.contactName || '',
      documentsProvided: raw.documentsProvided || 'Sale deed, ROR & Sketch map',

      // Section 2: Location Details
      propertyAddressSite: raw.propertyAddressSite || raw.propertyAddress || prefill?.propertyAddress || '',
      locality: raw.locality || 'RURAL',
      landmark: raw.landmark || raw.nearbyLandmarks || '',
      distanceFromBranch: raw.distanceFromBranch || '',
      latitude: raw.latitude || '',
      longitude: raw.longitude || '',
      propertyAddressLegal: raw.propertyAddressLegal || raw.legalAddress || prefill?.propertyAddress || '',
      floorNo: raw.floorNo || 'NA',
      propertyState: raw.propertyState || raw.state || 'Odisha',
      propertyCity: raw.propertyCity || raw.city || '',
      propertyPincode: raw.propertyPincode || raw.pincode || '',
      addressMatching: raw.addressMatching || 'YES',
      jurisdiction: raw.jurisdiction || '',
      holdingType: raw.holdingType || 'FREE HOLD',
      marketability: raw.marketability || 'FAIR',
      occupiedBy: raw.occupiedBy || 'Self',
      propertyType: raw.propertyType || 'Commercial Building',
      occupancyStatus: raw.occupancyStatus || 'SORP',

      // Section 3: Schedule of Property
      northLegal: raw.northLegal || 'Not mentioned',
      northSite: raw.northSite || '',
      northSketch: raw.northSketch || '',
      eastLegal: raw.eastLegal || 'Not mentioned',
      eastSite: raw.eastSite || '',
      eastSketch: raw.eastSketch || '',
      westLegal: raw.westLegal || 'Not mentioned',
      westSite: raw.westSite || '',
      westSketch: raw.westSketch || '',
      southLegal: raw.southLegal || 'Not mentioned',
      southSite: raw.southSite || '',
      southSketch: raw.southSketch || '',
      boundariesMatching: raw.boundariesMatching || 'Boundary is matching',
      propertyIdentified: raw.propertyIdentified || 'Yes',
      approachRoadSize: raw.approachRoadSize || '>20 FT',

      // Section 4: NDMA Parameters
      natureOfBuilding: raw.natureOfBuilding || 'RCC',
      planAspectRatio: raw.planAspectRatio || 'NA',
      structureType: raw.structureType || 'RCC',
      projectedParts: raw.projectedParts || 'NA',
      masonryType: raw.masonryType || 'BRICK',
      expansionJoints: raw.expansionJoints || 'No',
      roofType: raw.roofType || 'RCC',
      steelGrade: raw.steelGrade || 'FE 450',
      mortarType: raw.mortarType || 'NA',
      concreteGrade: raw.concreteGrade || 'NA',
      environmentExposure: raw.environmentExposure || 'Mild',
      footingType: raw.footingType || 'NA',
      seismicZone: raw.seismicZone || 'II&III',
      soilLiquefiable: raw.soilLiquefiable || 'No',
      coastalRegulatoryZone: raw.coastalRegulatoryZone || 'NO',
      soilSlopeVulnerable: raw.soilSlopeVulnerable || 'NA',
      floodProneArea: raw.floodProneArea || 'No',
      groundSlopeMoreThan20: raw.groundSlopeMoreThan20 || 'No',
      fireExit: raw.fireExit || 'NA',

      // Section 5: Approved Plan Details
      sanctionedPlanProvided: raw.sanctionedPlanProvided || 'NO',
      layoutPlanNo: raw.layoutPlanNo || 'NA',
      constructionPlanNo: raw.constructionPlanNo || 'NA',
      dateOfSanction: raw.dateOfSanction || 'NA',
      planValidity: raw.planValidity || 'NA',
      approvingAuthority: raw.approvingAuthority || 'NA',
      approvedUsages: raw.approvedUsages || 'NA',
      numberOfFloorsInBuilding: raw.numberOfFloorsInBuilding || 'NA',

      // Section 6: Technical Details
      currentOccupant: raw.currentOccupant || 'Owner',
      separateAccess: raw.separateAccess || 'NA',
      accommodationDetails: raw.accommodationDetails || 'G+1',

      // Plot Area Details
      eastDocs: raw.eastDocs || 'NA',
      eastSiteMeas: raw.eastSiteMeas || 'NA',
      eastPlan: raw.eastPlan || 'NA',
      westDocs: raw.westDocs || 'NA',
      westSiteMeas: raw.westSiteMeas || 'NA',
      westPlan: raw.westPlan || 'NA',
      northDocs: raw.northDocs || 'NA',
      northSiteMeas: raw.northSiteMeas || 'NA',
      northPlan: raw.northPlan || 'NA',
      southDocs: raw.southDocs || 'NA',
      southSiteMeas: raw.southSiteMeas || 'NA',
      southPlan: raw.southPlan || 'NA',
      landAreaDocs: raw.landAreaDocs || '',
      landAreaSite: raw.landAreaSite || '',
      landAreaPlan: raw.landAreaPlan || '',

      // BAU Floors Details
      bauFloors: Array.isArray(raw.bauFloors) && raw.bauFloors.length > 0 ? raw.bauFloors : [
        { floor: 'Basement/Stilt Floor', rooms: 'NA', kitchens: 'NA', bathrooms: 'NA', sanctionedUsage: 'NA', actualUsage: 'NA' },
        { floor: 'GROUND FLOOR', rooms: '', kitchens: '', bathrooms: '', sanctionedUsage: 'NA', actualUsage: 'Commercial' },
        { floor: 'First Floor', rooms: '', kitchens: '', bathrooms: '', sanctionedUsage: 'NA', actualUsage: 'Commercial' },
      ],

      // FSI & Demolition Details
      permissibleAreaPlan: raw.permissibleAreaPlan || 'NA',
      landComponent: raw.landComponent || '',
      permissibleFsi: raw.permissibleFsi || 'NA',
      permissibleConstructionFsi: raw.permissibleConstructionFsi || 'NA',
      actualConstructionBua: raw.actualConstructionBua || '',
      considerConstructionBua: raw.considerConstructionBua || '',
      riskOfDemolition: raw.riskOfDemolition || 'LOW',
      propertyStatus: raw.propertyStatus || 'COMPLETED',
      isCompleted: raw.isCompleted || 'Y',
      completedPct: raw.completedPct || '100%',
      recommendedPct: raw.recommendedPct || '100%',
      currentAge: raw.currentAge || '',
      residualAge: raw.residualAge || '',

      // Section 7: Valuation
      landAreaSqft: raw.landAreaSqft || raw.landArea || '',
      landRateSqft: raw.landRateSqft || raw.landRatePerUnit || '',
      landTotalValue: raw.landTotalValue || '',
      buaAreaSqft: raw.buaAreaSqft || '',
      buaRateSqft: raw.buaRateSqft || '',
      buaTotalValue: raw.buaTotalValue || '',
      marketValue: raw.marketValue || '',
      distressedPct: raw.distressedPct || '80',
      distressedValue: raw.distressedValue || '',
      govtRate: raw.govtRate || raw.govtLandRate || '',
      inDemolitionList: raw.inDemolitionList || 'NO',
      inNegativeArea: raw.inNegativeArea || 'NO',
      remarks: raw.remarks || '',

      // Section 8: Additional Checks
      approachRoadType: raw.approachRoadType || 'SINGLE LANE',
      surroundingAreaDevelopment: raw.surroundingAreaDevelopment || 'SURROUNDING 30%-40% DEVELOPING',
      distanceFromCityCentre: raw.distanceFromCityCentre || '',
      distanceFromCorpLimits: raw.distanceFromCorpLimits || '',
      electricity: raw.electricity || 'YES',
      electricityDistributor: raw.electricityDistributor || 'NA',
      waterSupply: raw.waterSupply || 'NA',
      waterDistributor: raw.waterDistributor || 'NA',
      sewerProvision: raw.sewerProvision || 'NA',
      sewerConnected: raw.sewerConnected || 'NA',
      futureDemolitionThreat: raw.futureDemolitionThreat || 'NA',

      // Section 9: Declaration
      visitingEngineer: raw.visitingEngineer || (prefill?.assignedFieldEmployees ? formatAssignedEngineers(prefill.assignedFieldEmployees) : ''),
      place: raw.place || 'Bhubaneswar',

      // Photos & Maps
      propertyImages: Array.isArray(raw.propertyImages) ? raw.propertyImages : [],
      propertyImageNames: Array.isArray(raw.propertyImageNames) ? raw.propertyImageNames : [],
      locationMapImages: normalizeMapImages(raw.locationMapImages || raw.locationMapImage),
      locationMapImage: raw.locationMapImage || '',
      mouzaMapImages: normalizeMapImages(raw.mouzaMapImages || raw.mouzaMapImage),
      mouzaMapImage: raw.mouzaMapImage || '',
      sketchMapImages: normalizeMapImages(raw.sketchMapImages),
      cadastralMapImages: normalizeMapImages(raw.cadastralMapImages || raw.cadastralMapImage),
      cadastralMapImage: raw.cadastralMapImage || '',

      // Annexures
      annexures: Array.isArray(raw.annexures) ? raw.annexures : [],
      annexureEnabled: Boolean(raw.annexureEnabled),
      annexureRef: raw.annexureRef || '',
      annexureRefShowAlso: Boolean(raw.annexureRefShowAlso),
    };
  }, [initialFields, projectCode, prefill]);

  const [fields, setFields] = useState<AnnapurnaMicroReportFields>(() => decodeHtmlEntitiesDeep(initialData));
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Field change handler
  const handleChange = useCallback((key: keyof AnnapurnaMicroReportFields, value: any) => {
    setFields(prev => {
      const next = { ...prev, [key]: value };

      // Auto-calculations for Valuation Section
      if (key === 'landAreaSqft' || key === 'landRateSqft') {
        const area = parseNum(key === 'landAreaSqft' ? value : next.landAreaSqft);
        const rate = parseNum(key === 'landRateSqft' ? value : next.landRateSqft);
        const total = area * rate;
        next.landTotalValue = total > 0 ? String(total) : '';
      }

      if (key === 'buaAreaSqft' || key === 'buaRateSqft') {
        const area = parseNum(key === 'buaAreaSqft' ? value : next.buaAreaSqft);
        const rate = parseNum(key === 'buaRateSqft' ? value : next.buaRateSqft);
        const total = area * rate;
        next.buaTotalValue = total > 0 ? String(total) : '';
      }

      const landTot = parseNum(next.landTotalValue);
      const buaTot = parseNum(next.buaTotalValue);
      const marketVal = landTot + buaTot;
      if (marketVal > 0) {
        next.marketValue = String(marketVal);
        const distPct = parseNum(next.distressedPct || '80');
        next.distressedValue = String(Math.round(marketVal * (distPct / 100)));
      }

      return next;
    });
  }, []);

  // Multi-upload handler
  const handleMapUpload = async (
    key: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `temp-photos/${projectId}/${key}-${Date.now()}-${i}.${ext}`;
        const { error } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(path, file);
        if (!error) {
          const { data } = supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }

      const existing = fields[key] || [];
      const updated = [...existing, ...uploadedUrls];
      handleChange(key, updated);

      // Sync legacy single string
      if (key === 'locationMapImages') handleChange('locationMapImage', updated[0] || '');
      if (key === 'mouzaMapImages') handleChange('mouzaMapImage', updated[0] || '');
      if (key === 'cadastralMapImages') handleChange('cadastralMapImage', updated[0] || '');
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMapRemove = (
    key: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages',
    index?: number
  ) => {
    const existing = fields[key] || [];
    const updated = typeof index === 'number' ? existing.filter((_, i) => i !== index) : [];
    handleChange(key, updated);
    if (key === 'locationMapImages') handleChange('locationMapImage', updated[0] || '');
    if (key === 'mouzaMapImages') handleChange('mouzaMapImage', updated[0] || '');
    if (key === 'cadastralMapImages') handleChange('cadastralMapImage', updated[0] || '');
  };

  // Property Photos Handlers
  const handlePhotosUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 10 * 1024 * 1024) continue;
        const ext = file.name.split('.').pop() || 'jpg';
        const path = `temp-photos/${projectId}/property-${Date.now()}-${i}.${ext}`;
        const { error } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(path, file);
        if (!error) {
          const { data } = supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }
      const existing = fields.propertyImages || [];
      const updated = [...existing, ...uploadedUrls];
      handleChange('propertyImages', updated);
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePhotoRemove = (idx: number) => {
    const updated = (fields.propertyImages || []).filter((_, i) => i !== idx);
    const updatedNames = (fields.propertyImageNames || []).filter((_, i) => i !== idx);
    handleChange('propertyImages', updated);
    handleChange('propertyImageNames', updatedNames);
  };

  // ── Save Draft ──
  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      const res = await saveReportDraft(projectId, fields);
      if (res && 'error' in res && res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        setMessage({ text: 'Draft saved successfully!', type: 'success' });
        setAutoSaveStatus('saved');
      }
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to save draft.', type: 'error' });
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  // ── PDF Generation ──
  const generatePDFBytes = async (): Promise<Uint8Array> => {
    // 1. Fetch letterhead
    let letterheadBytes: Uint8Array | null = null;
    try {
      const res = await fetch('/letterhead.png');
      if (res.ok) {
        const buf = await res.arrayBuffer();
        letterheadBytes = new Uint8Array(buf);
      }
    } catch { /* ignore */ }

    // 2. Fetch image helper
    const fetchBytes = async (url: string): Promise<Uint8Array | null> => {
      if (!url || !url.trim()) return null;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const buf = await res.arrayBuffer();
          return new Uint8Array(buf);
        }
      } catch { /* ignore */ }
      return null;
    };

    // 3. Fetch property photographs
    const propImages = fields.propertyImages || [];
    const photoBytesList = await Promise.all(propImages.map(fetchBytes));
    const photos = propImages.map((url, idx) => ({
      bytes: photoBytesList[idx] as Uint8Array,
      label: fields.propertyImageNames?.[idx] || 'Site Picture',
    })).filter(p => p.bytes && p.bytes.length > 0);

    // 4. Fetch Google Satellite maps
    const locImages = fields.locationMapImages || normalizeMapImages(fields.locationMapImage);
    const locBytes = (await Promise.all(locImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // 5. Fetch Mouza maps
    const mouzaImages = fields.mouzaMapImages || normalizeMapImages(fields.mouzaMapImage);
    const mouzaBytes = (await Promise.all(mouzaImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // 6. Fetch Sketch maps
    const sketchImages = fields.sketchMapImages || [];
    const sketchBytes = (await Promise.all(sketchImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // 7. Fetch Cadastral maps
    const cadastralImages = fields.cadastralMapImages || normalizeMapImages(fields.cadastralMapImage);
    const cadastralBytes = (await Promise.all(cadastralImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // 8. Render report
    const renderer = new PDFAnnapurnaMicroRenderer();
    await renderer.init(letterheadBytes || undefined);

    return renderer.generateAnnapurnaReport(fields, {
      photos,
      locationMaps: locBytes,
      mouzaMaps: mouzaBytes,
      sketchMaps: sketchBytes,
      cadastralMaps: cadastralBytes,
    });
  };

  const handlePreviewPDF = async () => {
    setLoading(true);
    try {
      const bytes = await generatePDFBytes();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      alert(`PDF Preview Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const bytes = await generatePDFBytes();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Annapurna_Valuation_${projectCode || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`PDF Download Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForVerification = async () => {
    if ((fields.propertyImages || []).length < 2) {
      alert('Please upload at least 2 photographs of the property before submitting.');
      return;
    }
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      const res = await submitReportForVerification(projectId);
      if (res && 'error' in res && res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        router.refresh();
      }
    } catch (err: any) {
      alert(`Submission failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  const handleAnnexureUpload = async (annexureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget(annexureId);
    let parsedData: any = undefined;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const firstSheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheetName];

      const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });
      if (rawRows.length > 0) {
        const headers = (rawRows[0] || []).map((h: any) => String(h ?? '').trim());
        const rows = rawRows.slice(1).map(row => (row || []).map((cell: any) => String(cell ?? '').trim()));

        const rawMerges = (sheet['!merges'] || []).map(m => ({
          sr: m.s.r,
          sc: m.s.c,
          er: m.e.r,
          ec: m.e.c,
        }));

        const colWidths = sheet['!cols'] ? sheet['!cols'].map(c => c?.wpx || c?.wch || 10) : undefined;

        parsedData = {
          headers,
          rows,
          allRows: rawRows.map(row => (row || []).map((cell: any) => String(cell ?? '').trim())),
          merges: rawMerges,
          colWidths,
        };
      }

      const ext = file.name.split('.').pop() || 'xlsx';
      const fileName = `annexure-${annexureId}-${Date.now()}.${ext}`;
      const filePath = `annexures/${projectId}/${fileName}`;

      const { error: uploadError } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);

      handleChange('annexures', (fields.annexures || []).map(a =>
        a.id === annexureId ? { ...a, excelFileUrl: data.publicUrl, excelFileName: file.name, parsedData } : a
      ));
    } catch (err: any) {
      console.error('Annexure upload error:', err);
      alert(`Failed to upload Excel sheet: ${err.message}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  const removeAnnexureFile = (annexureId: string) => {
    handleChange('annexures', (fields.annexures || []).map(a =>
      a.id === annexureId ? { ...a, excelFileUrl: '', excelFileName: '', parsedData: undefined } : a
    ));
  };

  // Nav Items
  const navSections: NavItem[] = [
    { id: 'sec-1', title: '1. Application Details' },
    { id: 'sec-2', title: '2. Location Details' },
    { id: 'sec-3', title: '3. Schedule of Property' },
    { id: 'sec-4', title: '4. NDMA Parameters' },
    { id: 'sec-5', title: '5. Approved Plan Details' },
    { id: 'sec-6', title: '6. Technical Details' },
    { id: 'sec-7', title: '7. Valuation' },
    { id: 'sec-8', title: '8. Additional Checks' },
    { id: 'sec-9', title: '9. Declaration' },
    { id: 'sec-10', title: '10. Photographs' },
    { id: 'sec-11', title: '11. Maps & Documents' },
    { id: 'sec-12', title: '12. Annexures' },
  ];

  return (
    <div className="flex gap-6 max-w-[1600px] mx-auto p-4 relative items-start">
      {/* Sidebar Navigator */}
      <FloatingNavigator sections={navSections} />

      {/* Main Form Content */}
      <div className="flex-1 space-y-6 min-w-0 pb-28">
        <ActiveConfigBanner
          bankName="ANNAPURNA MICRO FINANCE LTD"
          formatName="Valuation Report"
          category="Bank & FIS"
          onResetWizard={onResetWizard}
        />

        {message && (
          <div className={`p-4 rounded-xl text-sm font-semibold ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* ════ SECTION 1: APPLICATION DETAILS ════ */}
        <Section title="Application Details" number={1} id="sec-1" defaultOpen={true}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="File No. / LAN No. / Lead No.">
              <input className={inputCls} value={fields.fileNo || ''} onChange={e => handleChange('fileNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. 20159644" />
            </Field>
            <Field label="Date of Visit">
              <input type="date" className={inputCls} value={fields.dateOfVisit || ''} onChange={e => handleChange('dateOfVisit', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Name of Applicant & No.">
              <input className={inputCls} value={fields.applicantName || ''} onChange={e => handleChange('applicantName', e.target.value)} disabled={isReadOnly} placeholder="Applicant name & contact" />
            </Field>
            <Field label="Contact Person Name & No.">
              <input className={inputCls} value={fields.contactPerson || ''} onChange={e => handleChange('contactPerson', e.target.value)} disabled={isReadOnly} placeholder="Contact person name & contact" />
            </Field>
            <Field label="Loan Type (HL/LAP/BT)">
              <select className={selectCls} value={fields.loanType || 'LAP'} onChange={e => handleChange('loanType', e.target.value)} disabled={isReadOnly}>
                <option value="LAP">LAP</option>
                <option value="HL">HL</option>
                <option value="BT">BT</option>
              </select>
            </Field>
            <Field label="Person Met on Site & Contact number">
              <input className={inputCls} value={fields.personMetOnSite || ''} onChange={e => handleChange('personMetOnSite', e.target.value)} disabled={isReadOnly} placeholder="Person met & contact" />
            </Field>
            <div className="md:col-span-2">
              <Field label="Name of Property Owner as per Legal Document & No.">
                <input className={inputCls} value={fields.ownerName || ''} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} placeholder="Owner name as per deed" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Documents Provided">
                <input className={inputCls} value={fields.documentsProvided || ''} onChange={e => handleChange('documentsProvided', e.target.value)} disabled={isReadOnly} placeholder="e.g. Copy of Sale deed, ROR & Sketch map" />
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 2: LOCATION DETAILS ════ */}
        <Section title="Location Details" number={2} id="sec-2" defaultOpen={true}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Field label="Address as per Site">
                <textarea rows={2} className={inputCls} value={fields.propertyAddressSite || ''} onChange={e => handleChange('propertyAddressSite', e.target.value)} disabled={isReadOnly} placeholder="Complete property address as per site" />
              </Field>
            </div>
            <Field label="Locality">
              <select className={selectCls} value={fields.locality || 'RURAL'} onChange={e => handleChange('locality', e.target.value)} disabled={isReadOnly}>
                <option value="URBAN">URBAN</option>
                <option value="SEMI-URBAN">SEMI-URBAN</option>
                <option value="RURAL">RURAL</option>
              </select>
            </Field>
            <Field label="Landmark Near By">
              <input className={inputCls} value={fields.landmark || ''} onChange={e => handleChange('landmark', e.target.value)} disabled={isReadOnly} placeholder="e.g. Near Gopinath Temple" />
            </Field>
            <Field label="Distance from Branch in km">
              <input className={inputCls} value={fields.distanceFromBranch || ''} onChange={e => handleChange('distanceFromBranch', e.target.value)} disabled={isReadOnly} placeholder="e.g. 50" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Latitude">
                <input className={inputCls} value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 20.349222" />
              </Field>
              <Field label="Longitude">
                <input className={inputCls} value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 85.416528" />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Legal Address of the Property (As per Title Deed)">
                <textarea rows={2} className={inputCls} value={fields.propertyAddressLegal || ''} onChange={e => handleChange('propertyAddressLegal', e.target.value)} disabled={isReadOnly} placeholder="Address as per registered deed" />
              </Field>
            </div>
            <Field label="Floor No. of Property">
              <input className={inputCls} value={fields.floorNo || ''} onChange={e => handleChange('floorNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. NA / GF / G+1" />
            </Field>
            <Field label="Property State">
              <input className={inputCls} value={fields.propertyState || 'Odisha'} onChange={e => handleChange('propertyState', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Property City">
              <input className={inputCls} value={fields.propertyCity || ''} onChange={e => handleChange('propertyCity', e.target.value)} disabled={isReadOnly} placeholder="e.g. Cuttack" />
            </Field>
            <Field label="Property Pincode">
              <input className={inputCls} value={fields.propertyPincode || ''} onChange={e => handleChange('propertyPincode', e.target.value)} disabled={isReadOnly} placeholder="e.g. 754009" />
            </Field>
            <Field label="Address Matching (Yes/No)">
              <select className={selectCls} value={fields.addressMatching || 'YES'} onChange={e => handleChange('addressMatching', e.target.value)} disabled={isReadOnly}>
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
            </Field>
            <Field label="Jurisdiction / Municipal Body / Authority">
              <input className={inputCls} value={fields.jurisdiction || ''} onChange={e => handleChange('jurisdiction', e.target.value)} disabled={isReadOnly} placeholder="e.g. GP limit" />
            </Field>
            <Field label="Property Holding Type">
              <select className={selectCls} value={fields.holdingType || 'FREE HOLD'} onChange={e => handleChange('holdingType', e.target.value)} disabled={isReadOnly}>
                <option value="FREE HOLD">FREE HOLD</option>
                <option value="LEASEHOLD">LEASEHOLD</option>
              </select>
            </Field>
            <Field label="Marketability">
              <select className={selectCls} value={fields.marketability || 'FAIR'} onChange={e => handleChange('marketability', e.target.value)} disabled={isReadOnly}>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="POOR">POOR</option>
              </select>
            </Field>
            <Field label="Property Occupied By">
              <select className={selectCls} value={fields.occupiedBy || 'Self'} onChange={e => handleChange('occupiedBy', e.target.value)} disabled={isReadOnly}>
                <option value="Self">Self</option>
                <option value="Tenant">Tenant</option>
                <option value="Vacant">Vacant</option>
                <option value="Under Construction">Under Construction</option>
              </select>
            </Field>
            <Field label="Type of Property">
              <input className={inputCls} value={fields.propertyType || 'Commercial Building'} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Occupancy Status">
              <select className={selectCls} value={fields.occupancyStatus || 'SORP'} onChange={e => handleChange('occupancyStatus', e.target.value)} disabled={isReadOnly}>
                <option value="SORP">SORP (Self Occupied Residential Property)</option>
                <option value="SOCP">SOCP (Self Occupied Commercial Property)</option>
                <option value="Rented">Rented</option>
                <option value="Vacant">Vacant</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 3: SCHEDULE OF PROPERTY ════ */}
        <Section title="Schedule of the Property (Boundaries)" number={3} id="sec-3" defaultOpen={false}>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs border border-[#dee2e6] rounded-xl overflow-hidden">
                <thead className="bg-[#d5e8f5] text-[#1a3a5c] font-bold">
                  <tr>
                    <th className="p-2.5 text-left border-r border-[#dee2e6]">Side</th>
                    <th className="p-2.5 text-left border-r border-[#dee2e6]">As per Legal Documents</th>
                    <th className="p-2.5 text-left border-r border-[#dee2e6]">As per Site Visit</th>
                    <th className="p-2.5 text-left">As per Sketch Map</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6]">
                  {(['North', 'East', 'West', 'South'] as const).map(side => {
                    const lKey = `${side.toLowerCase()}Legal` as keyof AnnapurnaMicroReportFields;
                    const sKey = `${side.toLowerCase()}Site` as keyof AnnapurnaMicroReportFields;
                    const skKey = `${side.toLowerCase()}Sketch` as keyof AnnapurnaMicroReportFields;
                    return (
                      <tr key={side} className="hover:bg-slate-50">
                        <td className="p-2 font-bold text-slate-700 bg-slate-50 border-r border-[#dee2e6]">{side}</td>
                        <td className="p-1.5 border-r border-[#dee2e6]">
                          <input className="w-full p-1 border rounded text-xs" value={fields[lKey] || ''} onChange={e => handleChange(lKey, e.target.value)} disabled={isReadOnly} />
                        </td>
                        <td className="p-1.5 border-r border-[#dee2e6]">
                          <input className="w-full p-1 border rounded text-xs" value={fields[sKey] || ''} onChange={e => handleChange(sKey, e.target.value)} disabled={isReadOnly} />
                        </td>
                        <td className="p-1.5">
                          <input className="w-full p-1 border rounded text-xs" value={fields[skKey] || ''} onChange={e => handleChange(skKey, e.target.value)} disabled={isReadOnly} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <Field label="Boundaries Matching (Yes/No)">
                <input className={inputCls} value={fields.boundariesMatching || 'Boundary is matching'} onChange={e => handleChange('boundariesMatching', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Property Identified (Yes/No)">
                <select className={selectCls} value={fields.propertyIdentified || 'Yes'} onChange={e => handleChange('propertyIdentified', e.target.value)} disabled={isReadOnly}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="Approach Road Size">
                <input className={inputCls} value={fields.approachRoadSize || '>20 FT'} onChange={e => handleChange('approachRoadSize', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 4: NDMA PARAMETERS ════ */}
        <Section title="NDMA Parameters" number={4} id="sec-4" defaultOpen={false}>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Nature of Building/Wing">
              <input className={inputCls} value={fields.natureOfBuilding || 'RCC'} onChange={e => handleChange('natureOfBuilding', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Plan Aspect Ratio">
              <input className={inputCls} value={fields.planAspectRatio || 'NA'} onChange={e => handleChange('planAspectRatio', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Structure Type">
              <input className={inputCls} value={fields.structureType || 'RCC'} onChange={e => handleChange('structureType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Projected Parts Available">
              <input className={inputCls} value={fields.projectedParts || 'NA'} onChange={e => handleChange('projectedParts', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Type of Masonry">
              <input className={inputCls} value={fields.masonryType || 'BRICK'} onChange={e => handleChange('masonryType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Expansion Joints Available">
              <input className={inputCls} value={fields.expansionJoints || 'No'} onChange={e => handleChange('expansionJoints', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Roof Type">
              <input className={inputCls} value={fields.roofType || 'RCC'} onChange={e => handleChange('roofType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Steel Grade">
              <input className={inputCls} value={fields.steelGrade || 'FE 450'} onChange={e => handleChange('steelGrade', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Mortar Type">
              <input className={inputCls} value={fields.mortarType || 'NA'} onChange={e => handleChange('mortarType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Concrete Grade">
              <input className={inputCls} value={fields.concreteGrade || 'NA'} onChange={e => handleChange('concreteGrade', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Environment Exposure">
              <input className={inputCls} value={fields.environmentExposure || 'Mild'} onChange={e => handleChange('environmentExposure', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Footing Type">
              <input className={inputCls} value={fields.footingType || 'NA'} onChange={e => handleChange('footingType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Seismic Zone">
              <input className={inputCls} value={fields.seismicZone || 'II&III'} onChange={e => handleChange('seismicZone', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Soil Liquefiable">
              <input className={inputCls} value={fields.soilLiquefiable || 'No'} onChange={e => handleChange('soilLiquefiable', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Coastal Regulatory Zone">
              <input className={inputCls} value={fields.coastalRegulatoryZone || 'NO'} onChange={e => handleChange('coastalRegulatoryZone', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Soil Slope Vulnerable to Landslide">
              <input className={inputCls} value={fields.soilSlopeVulnerable || 'NA'} onChange={e => handleChange('soilSlopeVulnerable', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Flood Prone Area">
              <input className={inputCls} value={fields.floodProneArea || 'No'} onChange={e => handleChange('floodProneArea', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Ground Slope More than 20%">
              <input className={inputCls} value={fields.groundSlopeMoreThan20 || 'No'} onChange={e => handleChange('groundSlopeMoreThan20', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Fire Exit">
              <input className={inputCls} value={fields.fireExit || 'NA'} onChange={e => handleChange('fireExit', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 5: APPROVED PLAN DETAILS ════ */}
        <Section title="Approved Plan Details (if self-construction)" number={5} id="sec-5" defaultOpen={false}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Sanctioned Plan Provided (Yes/No)">
              <select className={selectCls} value={fields.sanctionedPlanProvided || 'NO'} onChange={e => handleChange('sanctionedPlanProvided', e.target.value)} disabled={isReadOnly}>
                <option value="NO">NO</option>
                <option value="YES">YES</option>
              </select>
            </Field>
            <Field label="Layout Plan Details (Sanctioned/Permit No)">
              <input className={inputCls} value={fields.layoutPlanNo || 'NA'} onChange={e => handleChange('layoutPlanNo', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Construction Plan Details (Sanctioned/Permit No)">
              <input className={inputCls} value={fields.constructionPlanNo || 'NA'} onChange={e => handleChange('constructionPlanNo', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Date of Sanction">
              <input className={inputCls} value={fields.dateOfSanction || 'NA'} onChange={e => handleChange('dateOfSanction', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Plan Validity">
              <input className={inputCls} value={fields.planValidity || 'NA'} onChange={e => handleChange('planValidity', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Approving Authority">
              <input className={inputCls} value={fields.approvingAuthority || 'NA'} onChange={e => handleChange('approvingAuthority', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Approved Usages">
              <input className={inputCls} value={fields.approvedUsages || 'NA'} onChange={e => handleChange('approvedUsages', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Number of Floors in Building">
              <input className={inputCls} value={fields.numberOfFloorsInBuilding || 'NA'} onChange={e => handleChange('numberOfFloorsInBuilding', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 6: TECHNICAL DETAILS ════ */}
        <Section title="Technical Details & Area Statements" number={6} id="sec-6" defaultOpen={false}>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Current Occupant of Property">
                <input className={inputCls} value={fields.currentOccupant || 'Owner'} onChange={e => handleChange('currentOccupant', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Separate Independent Access">
                <input className={inputCls} value={fields.separateAccess || 'NA'} onChange={e => handleChange('separateAccess', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Accommodation Details">
                <input className={inputCls} value={fields.accommodationDetails || 'G+1'} onChange={e => handleChange('accommodationDetails', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>

            {/* Plot Area Details Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Plot Area Details</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-[#dee2e6] rounded-xl overflow-hidden">
                  <thead className="bg-[#d5e8f5] text-[#1a3a5c] font-bold">
                    <tr>
                      <th className="p-2 text-left border-r border-[#dee2e6]">Side / Metric</th>
                      <th className="p-2 text-left border-r border-[#dee2e6]">As Per Documents</th>
                      <th className="p-2 text-left border-r border-[#dee2e6]">As Per Site Visit</th>
                      <th className="p-2 text-left">As Per Plan / Sketch Map</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dee2e6]">
                    {(['East', 'West', 'North', 'South'] as const).map(side => {
                      const dKey = `${side.toLowerCase()}Docs` as keyof AnnapurnaMicroReportFields;
                      const sKey = `${side.toLowerCase()}SiteMeas` as keyof AnnapurnaMicroReportFields;
                      const pKey = `${side.toLowerCase()}Plan` as keyof AnnapurnaMicroReportFields;
                      return (
                        <tr key={side}>
                          <td className="p-2 font-bold text-slate-700 bg-slate-50 border-r border-[#dee2e6]">{side}</td>
                          <td className="p-1.5 border-r border-[#dee2e6]">
                            <input className="w-full p-1 border rounded text-xs" value={fields[dKey] || ''} onChange={e => handleChange(dKey, e.target.value)} disabled={isReadOnly} placeholder="NA" />
                          </td>
                          <td className="p-1.5 border-r border-[#dee2e6]">
                            <input className="w-full p-1 border rounded text-xs" value={fields[sKey] || ''} onChange={e => handleChange(sKey, e.target.value)} disabled={isReadOnly} placeholder="NA" />
                          </td>
                          <td className="p-1.5">
                            <input className="w-full p-1 border rounded text-xs" value={fields[pKey] || ''} onChange={e => handleChange(pKey, e.target.value)} disabled={isReadOnly} placeholder="NA" />
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-amber-50/60 font-semibold">
                      <td className="p-2 text-slate-800 border-r border-[#dee2e6]">Land Area (In Sqft.)</td>
                      <td className="p-1.5 border-r border-[#dee2e6]">
                        <input className="w-full p-1 border rounded text-xs font-bold" value={fields.landAreaDocs || ''} onChange={e => handleChange('landAreaDocs', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2657" />
                      </td>
                      <td className="p-1.5 border-r border-[#dee2e6]">
                        <input className="w-full p-1 border rounded text-xs font-bold" value={fields.landAreaSite || ''} onChange={e => handleChange('landAreaSite', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2657" />
                      </td>
                      <td className="p-1.5">
                        <input className="w-full p-1 border rounded text-xs font-bold" value={fields.landAreaPlan || ''} onChange={e => handleChange('landAreaPlan', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* BAU Area Details Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">BAU Area Details (Floor-wise)</h4>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(fields.bauFloors || []), { floor: `Floor ${(fields.bauFloors || []).length}`, rooms: '', kitchens: '', bathrooms: '', sanctionedUsage: 'NA', actualUsage: 'Commercial' }];
                      handleChange('bauFloors', updated);
                    }}
                    className="text-xs font-bold text-[#b8860b] hover:underline"
                  >
                    + Add Floor
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-[#dee2e6] rounded-xl overflow-hidden">
                  <thead className="bg-[#d5e8f5] text-[#1a3a5c] font-bold">
                    <tr>
                      <th className="p-2 text-left border-r border-[#dee2e6]">Floor</th>
                      <th className="p-2 text-left border-r border-[#dee2e6]">Rooms</th>
                      <th className="p-2 text-left border-r border-[#dee2e6]">Kitchens</th>
                      <th className="p-2 text-left border-r border-[#dee2e6]">Bathrooms</th>
                      <th className="p-2 text-left border-r border-[#dee2e6]">Sanctioned Usage</th>
                      <th className="p-2 text-left">Actual Usage</th>
                      {!isReadOnly && <th className="p-2 text-center w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dee2e6]">
                    {(fields.bauFloors || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1.5 border-r border-[#dee2e6]">
                          <input className="w-full p-1 border rounded text-xs font-semibold" value={row.floor} onChange={e => {
                            const updated = [...(fields.bauFloors || [])];
                            updated[idx] = { ...updated[idx], floor: e.target.value };
                            handleChange('bauFloors', updated);
                          }} disabled={isReadOnly} />
                        </td>
                        <td className="p-1.5 border-r border-[#dee2e6]">
                          <input className="w-full p-1 border rounded text-xs" value={row.rooms} onChange={e => {
                            const updated = [...(fields.bauFloors || [])];
                            updated[idx] = { ...updated[idx], rooms: e.target.value };
                            handleChange('bauFloors', updated);
                          }} disabled={isReadOnly} placeholder="NA" />
                        </td>
                        <td className="p-1.5 border-r border-[#dee2e6]">
                          <input className="w-full p-1 border rounded text-xs" value={row.kitchens} onChange={e => {
                            const updated = [...(fields.bauFloors || [])];
                            updated[idx] = { ...updated[idx], kitchens: e.target.value };
                            handleChange('bauFloors', updated);
                          }} disabled={isReadOnly} placeholder="NA" />
                        </td>
                        <td className="p-1.5 border-r border-[#dee2e6]">
                          <input className="w-full p-1 border rounded text-xs" value={row.bathrooms} onChange={e => {
                            const updated = [...(fields.bauFloors || [])];
                            updated[idx] = { ...updated[idx], bathrooms: e.target.value };
                            handleChange('bauFloors', updated);
                          }} disabled={isReadOnly} placeholder="NA" />
                        </td>
                        <td className="p-1.5 border-r border-[#dee2e6]">
                          <input className="w-full p-1 border rounded text-xs" value={row.sanctionedUsage} onChange={e => {
                            const updated = [...(fields.bauFloors || [])];
                            updated[idx] = { ...updated[idx], sanctionedUsage: e.target.value };
                            handleChange('bauFloors', updated);
                          }} disabled={isReadOnly} placeholder="NA" />
                        </td>
                        <td className="p-1.5">
                          <input className="w-full p-1 border rounded text-xs" value={row.actualUsage} onChange={e => {
                            const updated = [...(fields.bauFloors || [])];
                            updated[idx] = { ...updated[idx], actualUsage: e.target.value };
                            handleChange('bauFloors', updated);
                          }} disabled={isReadOnly} />
                        </td>
                        {!isReadOnly && (
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (fields.bauFloors || []).filter((_, i) => i !== idx);
                                handleChange('bauFloors', updated);
                              }}
                              className="text-red-500 hover:text-red-700 font-bold"
                            >
                              ✕
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* FSI & Demolition Area Metrics */}
            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <Field label="Permissible Area as per Plan (Sq.Ft)">
                <input className={inputCls} value={fields.permissibleAreaPlan || 'NA'} onChange={e => handleChange('permissibleAreaPlan', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Land Component (Sq.Ft)">
                <input className={inputCls} value={fields.landComponent || ''} onChange={e => handleChange('landComponent', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2657" />
              </Field>
              <Field label="Permissible FSI">
                <input className={inputCls} value={fields.permissibleFsi || 'NA'} onChange={e => handleChange('permissibleFsi', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Actual Construction (BUA) (Sq.Ft)">
                <input className={inputCls} value={fields.actualConstructionBua || ''} onChange={e => handleChange('actualConstructionBua', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1600" />
              </Field>
              <Field label="Consider Construction (BUA) (Sq.Ft)">
                <input className={inputCls} value={fields.considerConstructionBua || ''} onChange={e => handleChange('considerConstructionBua', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1600" />
              </Field>
              <Field label="Risk of Demolition">
                <select className={selectCls} value={fields.riskOfDemolition || 'LOW'} onChange={e => handleChange('riskOfDemolition', e.target.value)} disabled={isReadOnly}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </Field>
              <Field label="Status of the Property">
                <input className={inputCls} value={fields.propertyStatus || 'COMPLETED'} onChange={e => handleChange('propertyStatus', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Current Age of Property">
                <input className={inputCls} value={fields.currentAge || ''} onChange={e => handleChange('currentAge', e.target.value)} disabled={isReadOnly} placeholder="e.g. 7-Years" />
              </Field>
              <Field label="Residual Age of Property">
                <input className={inputCls} value={fields.residualAge || ''} onChange={e => handleChange('residualAge', e.target.value)} disabled={isReadOnly} placeholder="e.g. 53-Years" />
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 7: VALUATION ════ */}
        <Section title="Valuation" number={7} id="sec-7" defaultOpen={true}>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4 p-4 border border-[#dee2e6] rounded-2xl bg-amber-50/30">
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Land Valuation</h4>
                <div className="space-y-2">
                  <Field label="Land Area (Sq.Ft)">
                    <input className={inputCls} value={fields.landAreaSqft || ''} onChange={e => handleChange('landAreaSqft', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2657" />
                  </Field>
                  <Field label="Rate per Sq.Ft (Rs)">
                    <input className={inputCls} value={fields.landRateSqft || ''} onChange={e => handleChange('landRateSqft', e.target.value)} disabled={isReadOnly} placeholder="e.g. 700" />
                  </Field>
                  <Field label="Total Land Value (Rs)">
                    <input className={`${inputCls} bg-white font-bold text-blue-900`} value={fields.landTotalValue ? formatIndianCurrency(parseNum(fields.landTotalValue)) : ''} readOnly placeholder="Auto-calculated" />
                  </Field>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Building / BUA Valuation</h4>
                <div className="space-y-2">
                  <Field label="BUA Area (Sq.Ft)">
                    <input className={inputCls} value={fields.buaAreaSqft || ''} onChange={e => handleChange('buaAreaSqft', e.target.value)} disabled={isReadOnly} placeholder="e.g. 800" />
                  </Field>
                  <Field label="Rate per Sq.Ft (Rs)">
                    <input className={inputCls} value={fields.buaRateSqft || ''} onChange={e => handleChange('buaRateSqft', e.target.value)} disabled={isReadOnly} placeholder="e.g. 0" />
                  </Field>
                  <Field label="Total BUA Value (Rs)">
                    <input className={`${inputCls} bg-white font-bold text-blue-900`} value={fields.buaTotalValue ? formatIndianCurrency(parseNum(fields.buaTotalValue)) : ''} readOnly placeholder="Auto-calculated" />
                  </Field>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Abstract & Final Values</h4>
                <div className="space-y-2">
                  <Field label="Market Value After Completion (Rs)">
                    <input className={`${inputCls} bg-white font-extrabold text-emerald-800`} value={fields.marketValue ? formatIndianCurrency(parseNum(fields.marketValue)) : ''} readOnly placeholder="Auto-calculated sum" />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Distress %">
                      <input className={inputCls} value={fields.distressedPct || '80'} onChange={e => handleChange('distressedPct', e.target.value)} disabled={isReadOnly} />
                    </Field>
                    <Field label="Distressed Value (Rs)">
                      <input className={`${inputCls} bg-white font-bold text-amber-900`} value={fields.distressedValue ? formatIndianCurrency(parseNum(fields.distressedValue)) : ''} readOnly />
                    </Field>
                  </div>
                  <Field label="Govt / Circle Rate (Rs/Sq.Ft)">
                    <input className={inputCls} value={fields.govtRate || ''} onChange={e => handleChange('govtRate', e.target.value)} disabled={isReadOnly} placeholder="e.g. 41" />
                  </Field>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="In Municipal Demolition List (Yes/No)">
                <select className={selectCls} value={fields.inDemolitionList || 'NO'} onChange={e => handleChange('inDemolitionList', e.target.value)} disabled={isReadOnly}>
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </select>
              </Field>
              <Field label="Is Property in Negative Area (Yes/No)">
                <select className={selectCls} value={fields.inNegativeArea || 'NO'} onChange={e => handleChange('inNegativeArea', e.target.value)} disabled={isReadOnly}>
                  <option value="NO">NO</option>
                  <option value="YES">YES</option>
                </select>
              </Field>
            </div>

            <Field label="Valuation Remarks">
              <textarea rows={4} className={inputCls} value={fields.remarks || ''} onChange={e => handleChange('remarks', e.target.value)} disabled={isReadOnly} placeholder="Detailed valuation remarks and observations" />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 8: ADDITIONAL CHECKS ════ */}
        <Section title="Additional Checks of Properties" number={8} id="sec-8" defaultOpen={false}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Approach Road to Property">
              <select className={selectCls} value={fields.approachRoadType || 'SINGLE LANE'} onChange={e => handleChange('approachRoadType', e.target.value)} disabled={isReadOnly}>
                <option value="SINGLE LANE">SINGLE LANE</option>
                <option value="DOUBLE LANE">DOUBLE LANE</option>
                <option value="FOUR LANE">FOUR LANE</option>
              </select>
            </Field>
            <Field label="Development of Surrounding Area">
              <input className={inputCls} value={fields.surroundingAreaDevelopment || 'SURROUNDING 30%-40% DEVELOPING'} onChange={e => handleChange('surroundingAreaDevelopment', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Distance from City Centre in Kms">
              <input className={inputCls} value={fields.distanceFromCityCentre || ''} onChange={e => handleChange('distanceFromCityCentre', e.target.value)} disabled={isReadOnly} placeholder="e.g. 50 KMS" />
            </Field>
            <Field label="Distance from Corporation Limits in Kms">
              <input className={inputCls} value={fields.distanceFromCorpLimits || ''} onChange={e => handleChange('distanceFromCorpLimits', e.target.value)} disabled={isReadOnly} placeholder="e.g. 5 KMS" />
            </Field>
            <Field label="Electricity">
              <select className={selectCls} value={fields.electricity || 'YES'} onChange={e => handleChange('electricity', e.target.value)} disabled={isReadOnly}>
                <option value="YES">YES</option>
                <option value="NO">NO</option>
              </select>
            </Field>
            <Field label="Electricity Distributor">
              <input className={inputCls} value={fields.electricityDistributor || 'NA'} onChange={e => handleChange('electricityDistributor', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Water Supply">
              <input className={inputCls} value={fields.waterSupply || 'NA'} onChange={e => handleChange('waterSupply', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Water Distributor">
              <input className={inputCls} value={fields.waterDistributor || 'NA'} onChange={e => handleChange('waterDistributor', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Sewer Provision (Yes/No)">
              <input className={inputCls} value={fields.sewerProvision || 'NA'} onChange={e => handleChange('sewerProvision', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Sewer Line Connected (Yes/No)">
              <input className={inputCls} value={fields.sewerConnected || 'NA'} onChange={e => handleChange('sewerConnected', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Any Demolition Threat in Future">
              <input className={inputCls} value={fields.futureDemolitionThreat || 'NA'} onChange={e => handleChange('futureDemolitionThreat', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 9: DECLARATION ════ */}
        <Section title="Declaration & Sign-Off" number={9} id="sec-9" defaultOpen={false}>
          <div className="space-y-4">
            <div className="p-4 border border-[#dee2e6] rounded-xl bg-slate-50 space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900 mb-1">Declaration Clauses (Included in Final PDF):</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>The final valuation has been concluded basis Land & Building valuation approach and rates are cross verified with the rates Prevalent in the nearby localities.</li>
                <li>We have no direct/indirect interest in the property valued.</li>
                <li>The information furnished in the report is true and correct to the best of my knowledge.</li>
                <li>Mr. <span className="font-bold">{fields.visitingEngineer || 'Visiting Engineer'}</span> has visited the property on dated <span className="font-bold">{fields.dateOfVisit || '...'}</span> & provide the data as collected during site inspection.</li>
                <li>I have not been convicted of any offence and sentenced to a term of Imprisonment.</li>
              </ul>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Engineer Visited Name">
                <input className={inputCls} value={fields.visitingEngineer || ''} onChange={e => handleChange('visitingEngineer', e.target.value)} disabled={isReadOnly} placeholder="e.g. Mr. Kundan Singh" />
              </Field>
              <Field label="Place">
                <input className={inputCls} value={fields.place || 'Bhubaneswar'} onChange={e => handleChange('place', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 10: PHOTOGRAPHS OF THE PROPERTY ════ */}
        <BasePhotographsSection
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading}
          bucketCount={bucketImages.length}
          onImageNameChange={(idx, name) => {
            const updated = [...(fields.propertyImageNames || [])];
            while (updated.length <= idx) updated.push('');
            updated[idx] = name;
            handleChange('propertyImageNames', updated);
          }}
          onRemoveImage={handlePhotoRemove}
          onReorderImages={(newImgs, newNames) => {
            handleChange('propertyImages', newImgs);
            handleChange('propertyImageNames', newNames);
          }}
          onUploadImages={handlePhotosUpload}
          sectionNumber={10}
          sectionId="sec-10"
        />

        {/* ════ SECTION 11: MAPS & DOCUMENTS (MULTI-PHOTO) ════ */}
        {/* Strictly in the requested order: Google Satellite Map, Mouza Map, Sketch Map, Cadastral Map */}
        <BaseMapsSection
          locationMapImages={fields.locationMapImages || []}
          mouzaMapImages={fields.mouzaMapImages || []}
          sketchMapImages={fields.sketchMapImages || []}
          cadastralMapImages={fields.cadastralMapImages || []}
          latitude={fields.latitude}
          longitude={fields.longitude}
          propertyAddress={fields.propertyAddressSite || fields.propertyAddressLegal}
          isReadOnly={isReadOnly}
          uploading={uploading}
          bucketCount={bucketImages.length}
          onLocationMapUpload={e => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={idx => handleMapRemove('locationMapImages', idx)}
          onMouzaMapUpload={e => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={idx => handleMapRemove('mouzaMapImages', idx)}
          onSketchMapUpload={e => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={idx => handleMapRemove('sketchMapImages', idx)}
          onCadastralMapUpload={e => handleMapUpload('cadastralMapImages', e)}
          onCadastralMapRemove={idx => handleMapRemove('cadastralMapImages', idx)}
          mapOrder={['location', 'mouza', 'sketch', 'cadastral']}
          sectionNumber={11}
          sectionId="sec-11"
        />

        {/* ════ SECTION 12: ANNEXURES ════ */}
        <BaseAnnexureSection
          annexures={fields.annexures || []}
          isReadOnly={isReadOnly}
          uploading={uploadingTarget !== null}
          onAddAnnexure={() => {
            const updated = [...(fields.annexures || []), { id: String(Date.now()), label: 'A', title: '', excelFileUrl: '', excelFileName: '' }];
            handleChange('annexures', reorderAndLabelAnnexures(updated, fields.annexureRef, '', fields.annexureEnabled, false));
          }}
          onRemoveAnnexure={id => {
            const updated = (fields.annexures || []).filter(a => a.id !== id);
            handleChange('annexures', reorderAndLabelAnnexures(updated, fields.annexureRef, '', fields.annexureEnabled, false));
          }}
          onUpdateTitle={(id, title) => {
            const updated = (fields.annexures || []).map(a => a.id === id ? { ...a, title } : a);
            handleChange('annexures', updated);
          }}
          onUploadExcel={handleAnnexureUpload}
          onRemoveFile={removeAnnexureFile}
          sectionNumber={12}
          sectionId="sec-12"
        />
      </div>

      {/* Persistent Bottom Action Bar */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={autoSaveStatus}
        message={message}
        loading={loading}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmitForVerification}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
      />
    </div>
  );
}
