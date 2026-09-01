'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import * as XLSX from 'xlsx';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { PDFAdityaBirlaMLAPRenderer, MLAPReportFields } from '@/lib/banks/pdf-aditya-birla-mlap-renderer';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ActiveConfigBanner,
  ReportActionBar,
  NavItem,
  getFloorName,
  formatAssignedEngineers,
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  AnnexureRefSelector,
  BaseAnnexureSection,
} from '../BaseBankReportComponents';
import { reorderAndLabelAnnexures, AnnexureItem } from '@/lib/bank-fields';

export interface AdityaBirlaCapitalMLAPProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole: string;
  bucketImages?: any[];
  prefill?: any;
  onResetWizard?: () => void;
}

interface AccomRow {
  floor: string;
  drawingRoom: string;
  bedroom: string;
  diningRoom: string;
  kitchen: string;
  bathroom: string;
  balcony: string;
}

interface BuaRow {
  floor: string;
  asPerSite: string;
  asPerPlan: string;
  percentageDeviation: string;
}

const DEFAULT_ACCOM_ROWS: AccomRow[] = [
  { floor: 'Ground Floor', drawingRoom: '', bedroom: '', diningRoom: '', kitchen: '', bathroom: '', balcony: '' },
];

const DEFAULT_BUA_ROWS: BuaRow[] = [
  { floor: 'Ground Floor', asPerSite: '', asPerPlan: 'NA', percentageDeviation: 'NA' },
];

// ── Bank Specific Nav Sections (12 exact sections) ──
const NAV_SECTIONS: NavItem[] = [
  { id: 'section-1', title: 'Basic Details' },
  { id: 'section-2', title: 'Location Details' },
  { id: 'section-3', title: 'Property Detailings' },
  { id: 'section-4', title: 'Documentation' },
  { id: 'section-5', title: 'Accommodation' },
  { id: 'section-6', title: 'Build Up Details' },
  { id: 'section-7', title: 'Valuation Analysis' },
  { id: 'section-8', title: 'Boundary Details' },
  { id: 'section-9', title: 'Remarks' },
  { id: 'section-10', title: 'Maps & Documents' },
  { id: 'section-11', title: 'Photographs' },
  { id: 'section-12-annexure', title: 'Annexures' },
];

export default function AdityaBirlaCapitalMLAP({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: AdityaBirlaCapitalMLAPProps) {
  const router = useRouter();

  // Initialize fields cleanly: dynamic prefill from project, standard dropdown defaults, blank case inputs
  const [fields, setFields] = useState<MLAPReportFields>(() => ({
    // Basic Details
    clientName: initialFields?.clientName || initialFields?.ownerName || prefill?.contactName || '',
    ownerName: initialFields?.ownerName || initialFields?.clientName || prefill?.contactName || '',
    initiationDate: initialFields?.initiationDate || prefill?.initiationDate || new Date().toISOString().split('T')[0],
    valuerName: initialFields?.valuerName || 'Er. Satyajit Mohanty',
    dateOfInspection: initialFields?.dateOfInspection || prefill?.inspectionDate || new Date().toISOString().split('T')[0],
    dateOfValuation: initialFields?.dateOfValuation || new Date().toISOString().split('T')[0],
    loanApplicationNo: initialFields?.loanApplicationNo || initialFields?.caseReferenceNumber || '',
    propertyOwnerName: initialFields?.propertyOwnerName || prefill?.contactName || '',

    // Location Details
    propertyAddressAsDocs: initialFields?.propertyAddressAsDocs || prefill?.propertyAddress || '',
    propertyAddressAsVisit: initialFields?.propertyAddressAsVisit || prefill?.propertyAddress || '',
    addressMatching: initialFields?.addressMatching || 'Yes (As per documents)',
    latitude: initialFields?.latitude || '',
    longitude: initialFields?.longitude || '',
    mainLocality: initialFields?.mainLocality || '',
    subLocality: initialFields?.subLocality || '',
    localityType: initialFields?.localityType || 'Residential',
    landmark: initialFields?.landmark || '',
    localityOccupancy: initialFields?.localityOccupancy || 'Fully Occupied',
    populationDensity: initialFields?.populationDensity || 'Moderate',
    distanceFromBranch: initialFields?.distanceFromBranch || '',
    distanceFromCityCenter: initialFields?.distanceFromCityCenter || '',
    distanceBusStop: initialFields?.distanceBusStop || '',
    distanceRailwayStation: initialFields?.distanceRailwayStation || '',
    amenitiesAvailability: initialFields?.amenitiesAvailability || '',
    approachRoadWidth: initialFields?.approachRoadWidth || '',
    valuedBefore: initialFields?.valuedBefore || 'No',
    valuedBeforeDate: initialFields?.valuedBeforeDate || '',
    landLocked: initialFields?.landLocked || 'No',
    otherEncumbranceFeatures: initialFields?.otherEncumbranceFeatures || 'No',

    // Property Detailings
    occupiedBy: initialFields?.occupiedBy || 'Vacant',
    occupantName: initialFields?.occupantName || '',
    occupantRelation: initialFields?.occupantRelation || '',
    plotDemarcated: initialFields?.plotDemarcated || 'No',
    propertyIdentification: initialFields?.propertyIdentification || 'Yes',
    propertyType: initialFields?.propertyType || prefill?.propertyType || 'Residential',
    propertySubType: initialFields?.propertySubType || 'Single / Multi-units building - R',
    propertyHolding: initialFields?.propertyHolding || 'Freehold',
    propertyJurisdiction: initialFields?.propertyJurisdiction || 'Gram Panchayat',
    marketability: initialFields?.marketability || 'Average',
    ageOfPropertyActual: initialFields?.ageOfPropertyActual || '',
    estimatedFutureLife: initialFields?.estimatedFutureLife || '',
    qualityOfConstruction: initialFields?.qualityOfConstruction || 'Average',
    structureType: initialFields?.structureType || 'RCC',
    dimensionWidth: initialFields?.dimensionWidth || '',
    dimensionDepth: initialFields?.dimensionDepth || '',
    cautiousLocations: initialFields?.cautiousLocations || '',
    flatConfigurationType: initialFields?.flatConfigurationType || '',
    percentageCompletion: initialFields?.percentageCompletion || '',
    percentageRecommendation: initialFields?.percentageRecommendation || '',

    // Documentation
    documentsProvided: initialFields?.documentsProvided || '',
    sanctionPlanDetails: initialFields?.sanctionPlanDetails || '',
    utilityBills: initialFields?.utilityBills || '',

    // Accommodations & BUA
    accommodationRows: initialFields?.accommodationRows || DEFAULT_ACCOM_ROWS,
    buaRows: initialFields?.buaRows || DEFAULT_BUA_ROWS,

    // Valuation
    plotAreaDocs: initialFields?.plotAreaDocs || '',
    plotAreaPhysical: initialFields?.plotAreaPhysical || '',
    plotAreaConsidered: initialFields?.plotAreaConsidered || '',
    landRate: initialFields?.landRate || '',
    buaPlan: initialFields?.buaPlan || '',
    buaActual: initialFields?.buaActual || '',
    buaActualRate: initialFields?.buaActualRate || '',
    buaConsidered: initialFields?.buaConsidered || '',
    buaConsideredRate: initialFields?.buaConsideredRate || '',
    superBua: initialFields?.superBua || '',
    amenitiesValue: initialFields?.amenitiesValue || '0',

    // Boundaries
    boundarySketchNorth: initialFields?.boundarySketchNorth || '',
    boundarySketchSouth: initialFields?.boundarySketchSouth || '',
    boundarySketchEast: initialFields?.boundarySketchEast || '',
    boundarySketchWest: initialFields?.boundarySketchWest || '',
    boundaryMouzaNorth: initialFields?.boundaryMouzaNorth || '',
    boundaryMouzaSouth: initialFields?.boundaryMouzaSouth || '',
    boundaryMouzaEast: initialFields?.boundaryMouzaEast || '',
    boundaryMouzaWest: initialFields?.boundaryMouzaWest || '',
    boundaryActualNorth: initialFields?.boundaryActualNorth || '',
    boundaryActualSouth: initialFields?.boundaryActualSouth || '',
    boundaryActualEast: initialFields?.boundaryActualEast || '',
    boundaryActualWest: initialFields?.boundaryActualWest || '',
    boundariesMatching: initialFields?.boundariesMatching || 'Yes (Boundary matching as per sketch map)',

    // Remarks & Signoff
    remarks: initialFields?.remarks || '',
    engineerVisitedName: initialFields?.engineerVisitedName || formatAssignedEngineers(prefill?.fieldEmployees),

    // Maps & Images
    locationMapImage: initialFields?.locationMapImage || '',
    mouzaMapImage: initialFields?.mouzaMapImage || '',
    cadastralMapImage: initialFields?.cadastralMapImage || '',
    sketchMapImages: initialFields?.sketchMapImages || [],
    propertyImages: initialFields?.propertyImages || [],
    propertyImageNames: initialFields?.propertyImageNames || [],

    // Annexures
    annexureEnabled: initialFields?.annexureEnabled ?? false,
    annexureRef: initialFields?.annexureRef || '',
    annexureRefShowAlso: initialFields?.annexureRefShowAlso ?? false,
    legalAnnexureEnabled: initialFields?.legalAnnexureEnabled ?? false,
    legalAnnexureRef: initialFields?.legalAnnexureRef || '',
    legalAnnexureRefShowAlso: initialFields?.legalAnnexureRefShowAlso ?? false,
    annexures: Array.isArray(initialFields?.annexures) ? initialFields.annexures : [],

    reworkNotes: initialFields?.reworkNotes || '',
    clientType: initialFields?.clientType || 'organisation',
    organisationTemplate: initialFields?.organisationTemplate || 'ADITYA BIRLA CAPITAL LTD',
    organisationSubTemplate: initialFields?.organisationSubTemplate || 'MLAP',
    institutionCategory: initialFields?.institutionCategory || '',
    serviceType: initialFields?.serviceType || prefill?.purpose || '',
    subjectType: initialFields?.subjectType || prefill?.propertyType || '',
  }));

  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [bucketPickerMode, setBucketPickerMode] = useState<'propertyImages' | 'sketchMapImages' | 'locationMapImage'>('propertyImages');

  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');

  const handleChange = (key: keyof MLAPReportFields, val: any) => {
    setFields(prev => ({ ...prev, [key]: val }));
  };

  // ── Dynamic Navigation Sections (includes Annexures when enabled or present) ──
  const dynamicNavSections: NavItem[] = useMemo(() => {
    const base = [...NAV_SECTIONS];
    if (fields.annexureEnabled || fields.legalAnnexureEnabled || (fields.annexures && fields.annexures.length > 0)) {
      base.push({ id: 'section-12-annexure', title: 'Annexures' });
    }
    return base;
  }, [fields.annexureEnabled, fields.legalAnnexureEnabled, fields.annexures]);

  // ── Annexure State Handlers (Strictly ordered: 1. Technical, 2. Legal, 3+. Custom) ──
  const addAnnexure = () => {
    const newAnnexure: AnnexureItem = {
      id: String(Date.now()),
      label: 'A',
      title: '',
      excelFileUrl: '',
      excelFileName: '',
    };
    const updated = [...(fields.annexures || []), newAnnexure];
    handleChange('annexures', reorderAndLabelAnnexures(
      updated,
      fields.annexureRef,
      fields.legalAnnexureRef,
      fields.annexureEnabled,
      fields.legalAnnexureEnabled
    ));
  };

  const removeAnnexure = (id: string) => {
    const isTech = fields.annexureRef === id;
    const isLegal = fields.legalAnnexureRef === id;
    const remaining = (fields.annexures || []).filter(a => a.id !== id);
    const nextTechEnabled = isTech ? false : fields.annexureEnabled;
    const nextTechRef = isTech ? '' : fields.annexureRef;
    const nextLegalEnabled = isLegal ? false : fields.legalAnnexureEnabled;
    const nextLegalRef = isLegal ? '' : fields.legalAnnexureRef;

    setFields(prev => ({
      ...prev,
      annexureEnabled: nextTechEnabled,
      annexureRef: nextTechRef,
      annexureRefShowAlso: isTech ? false : prev.annexureRefShowAlso,
      legalAnnexureEnabled: nextLegalEnabled,
      legalAnnexureRef: nextLegalRef,
      legalAnnexureRefShowAlso: isLegal ? false : prev.legalAnnexureRefShowAlso,
      annexures: reorderAndLabelAnnexures(
        remaining,
        nextTechRef,
        nextLegalRef,
        nextTechEnabled,
        nextLegalEnabled
      ),
    }));
  };

  const updateAnnexureTitle = (id: string, title: string) => {
    handleChange('annexures', (fields.annexures || []).map(a => a.id === id ? { ...a, title } : a));
  };

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
      alert(`Failed to upload/parse annexure: ${err.message}`);
    } finally {
      setUploadingTarget(null);
    }
  };

  const removeAnnexureFile = (annexureId: string) => {
    handleChange('annexures', (fields.annexures || []).map(a =>
      a.id === annexureId ? { ...a, excelFileUrl: '', excelFileName: '', parsedData: undefined } : a
    ));
  };

  // ── Dynamic Row Handlers ──
  const addAccommodationRow = () => {
    const currentList = fields.accommodationRows || DEFAULT_ACCOM_ROWS;
    const newRow: AccomRow = {
      floor: getFloorName(currentList.length),
      drawingRoom: '',
      bedroom: '',
      diningRoom: '',
      kitchen: '',
      bathroom: '',
      balcony: '',
    };
    handleChange('accommodationRows', [...currentList, newRow]);
  };

  const removeAccommodationRow = (idx: number) => {
    const updated = (fields.accommodationRows || DEFAULT_ACCOM_ROWS).filter((_, i) => i !== idx);
    handleChange('accommodationRows', updated);
  };

  const addBuaRow = () => {
    const currentList = fields.buaRows || DEFAULT_BUA_ROWS;
    const newRow: BuaRow = {
      floor: getFloorName(currentList.length),
      asPerSite: '',
      asPerPlan: 'NA',
      percentageDeviation: 'NA',
    };
    handleChange('buaRows', [...currentList, newRow]);
  };

  const removeBuaRow = (idx: number) => {
    const updated = (fields.buaRows || DEFAULT_BUA_ROWS).filter((_, i) => i !== idx);
    handleChange('buaRows', updated);
  };

  // ── Auto-Calculated Valuation Values ──
  const plotSqft = parseFloat(fields.plotAreaDocs || '0') || 0;
  const landRate = parseFloat(fields.landRate || '0') || 0;
  const landTotalVal = plotSqft * landRate;

  const buaSqft = parseFloat(fields.buaActual || '0') || 0;
  const bua100Rate = parseFloat(fields.buaActualRate || '0') || 0;
  const bua100TotalVal = buaSqft * bua100Rate;

  const buaConsRate = parseFloat(fields.buaConsideredRate || '0') || 0;
  const buaConsTotalVal = buaSqft * buaConsRate;

  const amenitiesVal = parseFloat(fields.amenitiesValue || '0') || 0;
  const totalVal = landTotalVal + buaConsTotalVal + amenitiesVal;
  const realizableVal = totalVal * 0.9;
  const distressVal = totalVal * 0.8;

  // ── Auto-Save Effect ──
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isReadOnly) return;

    setAutoSaveStatus('saving');
    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);

    debouncedTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res && 'error' in res && res.error) {
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('error');
      }
    }, 1200);

    return () => {
      if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReadOnly) return;
      saveReportDraft(projectId, fields).catch(e => console.error(e));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  // ── Image Upload Handlers ──
  const handleUploadSingleImage = async (e: React.ChangeEvent<HTMLInputElement>, targetKey: 'locationMapImage' | 'mouzaMapImage' | 'cadastralMapImage') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTarget(targetKey);
    try {
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} exceeds 5MB size limit.`);
        return;
      }
      const ext = file.name.split('.').pop();
      const fileName = `${projectId}-${targetKey}-${Date.now()}.${ext}`;
      const filePath = `temp-photos/${projectId}/${fileName}`;
      const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
      if (error) throw error;
      const { data: publicUrlData } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
      handleChange(targetKey, publicUrlData.publicUrl);
    } catch (err: any) {
      alert(`Image upload failed: ${err.message}`);
    } finally {
      e.target.value = '';
      setUploadingTarget(null);
    }
  };

  const handleUploadMultiplePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadingTarget('photos');
    try {
      const newUrls: string[] = [...(fields.propertyImages || [])];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} exceeds 5MB size limit.`);
          continue;
        }
        const ext = file.name.split('.').pop();
        const fileName = `${projectId}-photo-${Date.now()}-${i}.${ext}`;
        const filePath = `temp-photos/${projectId}/${fileName}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) {
          console.error(`Upload error for ${file.name}:`, error);
          alert(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }
        const { data: publicUrlData } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(publicUrlData.publicUrl);
      }
      handleChange('propertyImages', newUrls);
    } catch (err: any) {
      alert(`Photo upload failed: ${err.message}`);
    } finally {
      e.target.value = '';
      setUploadingTarget(null);
    }
  };

  const handleUploadMultipleSketches = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadingTarget('sketches');
    try {
      const newUrls: string[] = [...(fields.sketchMapImages || [])];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} exceeds 5MB size limit.`);
          continue;
        }
        const ext = file.name.split('.').pop();
        const fileName = `${projectId}-sketch-${Date.now()}-${i}.${ext}`;
        const filePath = `temp-photos/${projectId}/${fileName}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) {
          console.error(`Upload error for ${file.name}:`, error);
          alert(`Failed to upload ${file.name}: ${error.message}`);
          continue;
        }
        const { data: publicUrlData } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(publicUrlData.publicUrl);
      }
      handleChange('sketchMapImages', newUrls);
    } catch (err: any) {
      alert(`Sketch upload failed: ${err.message}`);
    } finally {
      e.target.value = '';
      setUploadingTarget(null);
    }
  };

  // ── PDF Generation Hook ──
  const generatePDFBytes = async (): Promise<Uint8Array> => {
    let letterheadBytes: Uint8Array | null = null;
    try {
      const res = await fetch('/templates/letterhead.png');
      if (res.ok) letterheadBytes = new Uint8Array(await res.arrayBuffer());
    } catch { /* ignore */ }

    const allUrls: string[] = [
      ...(fields.propertyImages || []),
      ...(fields.sketchMapImages || []),
      fields.locationMapImage || '',
      fields.mouzaMapImage || '',
      fields.cadastralMapImage || '',
    ].filter(Boolean);

    const imageResults = await Promise.all(
      allUrls.map(async url => {
        try {
          const res = await fetch(url);
          if (res.ok) return new Uint8Array(await res.arrayBuffer());
          return null;
        } catch {
          return null;
        }
      })
    );

    const fmtDate = (d: string) => {
      if (!d) return '________';
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        const [y, m, dd] = d.split('-');
        return `${dd}-${m}-${y}`;
      }
      return d;
    };

    const r = new PDFAdityaBirlaMLAPRenderer();
    await r.init(letterheadBytes || undefined);

    const W_LABEL_2COL = 140;
    const W_VAL_2COL = 347.28;
    const W_LABEL_4COL = 110;
    const W_VAL_4COL = 133.64;

    // 1. Header
    r.drawMainHeader('Aditya Birla Capital Ltd (MLAP)');

    // 2. Basic Details
    r.drawSectionHeader('Basic Details');
    r.drawKeyValueRow([
      { label: 'Client Name', value: fields.ownerName || fields.clientName || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Initiation Date', value: fmtDate(fields.initiationDate || fields.dateOfInspection || ''), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Valuer Name', value: fields.valuerName || 'Er. Satyajit Mohanty', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Visit Date', value: fmtDate(fields.dateOfInspection || ''), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Application No.', value: fields.loanApplicationNo || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Report Date', value: fmtDate(fields.dateOfValuation || ''), labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Name of Property Owner', value: fields.propertyOwnerName || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL },
    ]);

    // 3. Location Details
    r.drawSectionHeader('Location Details');
    let propDocsText = fields.propertyAddressAsDocs || 'N/A';
    if (fields.annexureEnabled && fields.annexures && fields.annexures.length > 0) {
      const linked = fields.annexures.find(a => a.id === fields.annexureRef) || (fields.annexures.find(a => a.parsedData) || fields.annexures[0]);
      const annTitle = linked ? (linked.title || `Annexure ${linked.label}`) : 'Annexure';
      if (!fields.annexureRefShowAlso) {
        propDocsText = `Refer to ${annTitle}`;
      } else if (fields.propertyAddressAsDocs) {
        propDocsText = `${fields.propertyAddressAsDocs} (Refer to ${annTitle})`;
      }
    }
    r.drawKeyValueRow([{ label: 'Address as per Document', value: propDocsText, labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    let propVisitText = fields.propertyAddressAsVisit || 'N/A';
    if (fields.annexureEnabled && fields.annexures && fields.annexures.length > 0 && !fields.annexureRefShowAlso) {
      const linked = fields.annexures.find(a => a.id === fields.annexureRef) || (fields.annexures.find(a => a.parsedData) || fields.annexures[0]);
      const annTitle = linked ? (linked.title || `Annexure ${linked.label}`) : 'Annexure';
      propVisitText = `Refer to ${annTitle}`;
    }
    r.drawKeyValueRow([{ label: 'Address as per Physical', value: propVisitText, labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Address matching', value: fields.addressMatching || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Co-Ordinates', value: fields.latitude && fields.longitude ? `Lat: ${fields.latitude}, Long: ${fields.longitude}` : (fields.latitude || fields.longitude || 'N/A'), labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    r.drawKeyValueRow([
      { label: 'Main Locality', value: fields.mainLocality || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Sub Locality', value: fields.subLocality || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Locality Type', value: fields.localityType || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
      { label: 'Landmark', value: fields.landmark || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL },
    ]);
    r.drawKeyValueRow([
      { label: 'Occupancy of Locality', value: fields.localityOccupancy || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, highlight: true },
      { label: 'Population Density', value: fields.populationDensity || 'N/A', labelWidth: W_LABEL_4COL, valueWidth: W_VAL_4COL, highlight: true },
    ]);
    r.drawKeyValueRow([{ label: 'Distance from ABCL Branch', value: fields.distanceFromBranch || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Distance from City Center', value: fields.distanceFromCityCenter || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Distance from Bus Stand', value: fields.distanceBusStop || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Distance from Nearest Railway Station', value: fields.distanceRailwayStation || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Availability of Amenities (school,market etc)', value: fields.amenitiesAvailability || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Approach Road Width', value: fields.approachRoadWidth || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    const whenVal = fields.valuedBefore === 'Yes'
      ? (fmtDate(fields.valuedBeforeDate || '') || 'NA')
      : 'NA';
    r.drawKeyValueRow([
      { label: 'Has the Valuator Done Valuation for this property before?', value: fields.valuedBefore || 'No', labelWidth: 240, valueWidth: 45 },
      { label: 'If Yes When?', value: whenVal, labelWidth: 90, valueWidth: 112.28 },
    ]);
    r.drawKeyValueRow([{ label: 'Land Locked', value: fields.landLocked || 'No', labelWidth: 330, valueWidth: 157.28, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Any other features like board of other financier indicating mortgage, notice of Court/any authority which may affect the title', value: fields.otherEncumbranceFeatures || 'No', labelWidth: 330, valueWidth: 157.28, highlight: true }]);

    // 4. Property Detailings
    r.drawSectionHeader('Property Detailings');
    r.drawKeyValueRow([{ label: 'Occupancy', value: fields.occupiedBy || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Occupied By', value: fields.occupantName || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Relationship of Occupant with Client', value: fields.occupantRelation || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Property Demarcation (yes/no)', value: fields.plotDemarcated || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Identification (yes/no)', value: fields.propertyIdentification || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Type', value: fields.propertyType || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Sub Type', value: fields.propertySubType || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Holding', value: fields.propertyHolding || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property situated in Limits', value: fields.propertyJurisdiction || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Marketability', value: fields.marketability || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Property Age', value: fields.ageOfPropertyActual || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Residual Age', value: fields.estimatedFutureLife || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Construction Quality', value: fields.qualityOfConstruction || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Structure Type', value: fields.structureType || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([
      { label: 'Dimensions of Property: Width (Facing Road Side) in feet', value: fields.dimensionWidth || 'N/A', labelWidth: 240, valueWidth: 45, highlight: true },
      { label: 'Depth (in feet)', value: fields.dimensionDepth || 'N/A', labelWidth: 90, valueWidth: 112.28, highlight: true },
    ]);
    r.drawKeyValueRow([{ label: 'Cautious Locations', value: fields.cautiousLocations || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'If Flat, Configuration Type', value: fields.flatConfigurationType || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Percentage Completion of Property', value: fields.percentageCompletion || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);
    r.drawKeyValueRow([{ label: 'Percentage Recommendation of Property', value: fields.percentageRecommendation || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL, highlight: true }]);

    // 5. Documentation
    r.drawSectionHeader('Documentation');
    let docsText = fields.documentsProvided || 'N/A';
    if (fields.legalAnnexureEnabled && fields.annexures && fields.annexures.length > 0) {
      const linked = fields.annexures.find(a => a.id === fields.legalAnnexureRef) || (fields.annexures.find(a => a.parsedData) || fields.annexures[0]);
      const annTitle = linked ? (linked.title || `Annexure ${linked.label}`) : 'Annexure';
      if (!fields.legalAnnexureRefShowAlso) {
        docsText = `Refer to ${annTitle}`;
      } else if (fields.documentsProvided) {
        docsText = `${fields.documentsProvided} (Refer to ${annTitle})`;
      }
    }
    r.drawKeyValueRow([{ label: 'Documents Provided', value: docsText, labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Sanction Plan details if provided', value: fields.sanctionPlanDetails || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);
    r.drawKeyValueRow([{ label: 'Utility Bills (Water bill, electricity bill)', value: fields.utilityBills || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // 6. Accommodation Details
    r.drawSectionHeader('Accomodation Details');
    const accomCols = [75, 65, 65, 65, 65, 75, 77.28];
    const accomRows = (fields.accommodationRows || DEFAULT_ACCOM_ROWS).map((row: AccomRow) => [
      row.floor, row.drawingRoom || '', row.bedroom || '', row.diningRoom || '', row.kitchen || '', row.bathroom || '', row.balcony || ''
    ]);
    r.drawTable(
      ['Unit Details', 'Drawing Room', 'Bedroom', 'Dining Room', 'Kitchen', 'Bathroom', 'Balcony'],
      accomRows,
      accomCols
    );

    // 7. Build Up Details
    r.drawSectionHeader('Build Up Details');
    const buaCols = [100, 130, 130, 127.28];
    const buaRowsData = (fields.buaRows || DEFAULT_BUA_ROWS).map((row: BuaRow) => [
      row.floor, row.asPerSite || 'NA', row.asPerPlan || 'NA', row.percentageDeviation || 'NA'
    ]);
    r.drawTable(
      ['Floor', 'As per site', 'As per Plan/Allowed', 'Percentage Deviation'],
      buaRowsData,
      buaCols
    );

    // 8. Valuation
    r.drawSectionHeader('Valuation');
    const valCols = [220, 90, 90, 87.28];
    r.drawTable(
      ['Detailings', 'Area in Sqft', 'Rate/sqft', 'Value'],
      [
        ['Plot Area (As per Documents)', String(plotSqft), String(landRate), `Rs. ${formatIndianCurrency(landTotalVal)}`],
        ['Plot Area (As per Physical)', fields.plotAreaPhysical || String(plotSqft), '-', '-'],
        ['Plot Area (Considered For Valuation)', fields.plotAreaConsidered || String(plotSqft), '-', '-'],
        ['Build Up Area (As per Plan/Document)', fields.buaPlan || '-', '-', '-'],
        ['Build Up Area (As per Actual) GF RCC on 100% comp', String(buaSqft), String(bua100Rate), `Rs. ${formatIndianCurrency(bua100TotalVal)}`],
        ['Build Up Area (Considered for Valuation) as on date', String(buaSqft), String(buaConsRate), `Rs. ${formatIndianCurrency(buaConsTotalVal)}`],
        ['Super Build Up Area (In case of Composite)', fields.superBua || '-', '-', '-'],
        ['Amenities (like parking etc in unit or lumpsum value)', String(amenitiesVal), '-', `Rs. ${formatIndianCurrency(amenitiesVal)}`],
        ['Total Value', '', '', `Rs. ${formatIndianCurrency(totalVal)}`],
        ['Realizable Value(90%)', '', '', `Rs. ${formatIndianCurrency(realizableVal)}`],
        ['Distress Value(80%)', '', '', `Rs. ${formatIndianCurrency(distressVal)}`],
      ],
      valCols,
      [3]
    );

    // 9. Boundary Details
    r.drawSectionHeader('Boundary Details');
    const boundCols = [95.28, 98, 98, 98, 98];
    r.drawTable(
      ['Detailings', 'North', 'South', 'East', 'West'],
      [
        ['As per Sketch map', fields.boundarySketchNorth || '', fields.boundarySketchSouth || '', fields.boundarySketchEast || '', fields.boundarySketchWest || ''],
        ['As per Mouza Map', fields.boundaryMouzaNorth || '', fields.boundaryMouzaSouth || '', fields.boundaryMouzaEast || '', fields.boundaryMouzaWest || ''],
        ['As per actual', fields.boundaryActualNorth || '', fields.boundaryActualSouth || '', fields.boundaryActualEast || '', fields.boundaryActualWest || ''],
      ],
      boundCols
    );
    r.drawKeyValueRow([{ label: 'Boundaries Matching', value: fields.boundariesMatching || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // 10. Remarks
    r.drawRemarksBox('Remarks', fields.remarks || 'N/A');
    r.drawKeyValueRow([{ label: 'Name of the Engineer Visited', value: fields.engineerVisitedName || 'N/A', labelWidth: W_LABEL_2COL, valueWidth: W_VAL_2COL }]);

    // 11. Location Map
    let imgPointer = (fields.propertyImages || []).length;
    const sketchImgs = fields.sketchMapImages || [];
    const sketchBytes = imageResults.slice(imgPointer, imgPointer + sketchImgs.length);
    imgPointer += sketchImgs.length;
    const locMapBytes = fields.locationMapImage ? imageResults[imgPointer++] : null;
    const mouzaMapBytes = fields.mouzaMapImage ? imageResults[imgPointer++] : null;
    const cadastralMapBytes = fields.cadastralMapImage ? imageResults[imgPointer++] : null;

    if (locMapBytes) {
      r.checkPageBreak(300);
      r.drawSectionHeader('Location Map');
      await r.drawImageSection(locMapBytes, `Latitude: ${fields.latitude || ''}, Longitude: ${fields.longitude || ''}`);
    }

    // 12. Photographs Grid
    const propImgs = fields.propertyImages || [];
    if (propImgs.length > 0) {
      const photos = propImgs.map((imgUrl: string, idx: number) => ({
        bytes: imageResults[idx],
        label: fields.propertyImageNames?.[idx] !== undefined
          ? fields.propertyImageNames[idx]
          : 'Site Picture',
      })).filter((p: any) => p.bytes && p.bytes.length > 0);

      await r.drawPhotoGrid(photos);
    }

    // 13. Maps
    if (mouzaMapBytes) {
      r.checkPageBreak(300);
      r.drawSectionHeader('MOUZA MAP');
      await r.drawImageSection(mouzaMapBytes, 'Mouza Map (Bhulekh Plot Detail)');
    }

    if (cadastralMapBytes) {
      r.checkPageBreak(300);
      r.drawSectionHeader('CADASTRAL MAP');
      await r.drawImageSection(cadastralMapBytes, 'Cadastral Satellite Plot Boundary Map');
    }

    if (sketchBytes && sketchBytes.length > 0) {
      for (let i = 0; i < sketchBytes.length; i++) {
        if (sketchBytes[i]) {
          r.checkPageBreak(300);
          r.drawSectionHeader(i === 0 ? 'AMIN HAND-DRAWN SKETCH MAP' : `SKETCH MAP ${i + 1}`);
          await r.drawImageSection(sketchBytes[i], `Hand-Drawn Sketch Map ${i + 1}`);
        }
      }
    }

    // 14. Annexures & Schedules
    if (fields.annexures && fields.annexures.length > 0) {
      r.renderAnnexures(fields.annexures);
    }

    return await r.save();
  };

  const handlePreviewPDF = async () => {
    // Open a blank tab synchronously in the click handler to bypass browser pop-up blockers
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Generating PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #b8860b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating PDF Preview...</p>
              <p style="font-size: 12px; color: #6c757d; margin: 8px 0 0;">Please wait while the document compiles.</p>
            </div>
            <style>
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }

    setLoading(true);
    try {
      const pdfBytes = await generatePDFBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      if (blob && previewWindow) {
        const url = URL.createObjectURL(blob);
        previewWindow.location.href = url;
      } else if (previewWindow) {
        previewWindow.close();
        setMessage({ type: 'error', text: 'Failed to generate PDF preview.' });
      }
    } catch (err: any) {
      if (previewWindow) previewWindow.close();
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const pdfBytes = await generatePDFBytes();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Aditya_Birla_MLAP_Valuation_${projectCode || 'Report'}.pdf`;
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

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for Manager verification?')) return;
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      const res = await submitReportForVerification(projectId);
      if (res && 'error' in res && res.error) {
        alert(res.error);
      } else {
        alert('Report submitted for Manager Review!');
        router.refresh();
      }
    } catch (err: any) {
      alert(`Submit failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-6 items-start w-full">
      {/* ── Main Form Column (Only exact sections created) ── */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* Standard Active Configuration Top Banner */}
        <ActiveConfigBanner
          bankName={fields.organisationTemplate || 'ADITYA BIRLA CAPITAL LTD'}
          formatName={fields.organisationSubTemplate || undefined}
          category={fields.institutionCategory || undefined}
          serviceType={fields.serviceType || prefill?.purpose || undefined}
          subjectType={fields.subjectType || prefill?.propertyType || undefined}
          onResetWizard={onResetWizard}
        />

        {/* ═══ SECTION 1: BASIC DETAILS ═══ */}
        <Section title="Basic Details" number={1}>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Client Name">
                <input type="text" value={fields.ownerName || ''} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} className={inputCls} />
              </Field>
              <Field label="Initiation Date">
                <input type="date" value={fields.initiationDate || ''} onChange={e => handleChange('initiationDate', e.target.value)} disabled={isReadOnly} className={inputCls} />
              </Field>
              <Field label="Visit Date (Date of Inspection)">
                <input type="date" value={fields.dateOfInspection || ''} onChange={e => handleChange('dateOfInspection', e.target.value)} disabled={isReadOnly} className={inputCls} />
              </Field>
              <Field label="Application No. (Case Ref No)">
                <input type="text" value={fields.loanApplicationNo || ''} onChange={e => handleChange('loanApplicationNo', e.target.value)} disabled={isReadOnly} className={inputCls} />
              </Field>
              <Field label="Report Date (Date of Valuation)">
                <input type="date" value={fields.dateOfValuation || ''} onChange={e => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} className={inputCls} />
              </Field>
              <Field label="Name of Property Owner (with S/O, W/O)">
                <input type="text" value={fields.propertyOwnerName || ''} onChange={e => handleChange('propertyOwnerName', e.target.value)} disabled={isReadOnly} className={inputCls} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 2: LOCATION DETAILS ═══ */}
        <Section title="Location Details & Distance Matrix" number={2}>
          <div className="space-y-4">
            {/* Property Address Card with Annexure Toggle */}
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                <h3 className="text-sm font-bold text-[#0f2038]">
                  Property Address <span className="text-[10px] font-normal text-[#6c757d] normal-case">(Khata, Plot, Mouza, Tahasil, Dist, Pin)</span>
                </h3>
                <AnnexureRefSelector
                  label="Property Address"
                  annexureEnabled={fields.annexureEnabled}
                  annexureRef={fields.annexureRef}
                  annexureRefShowAlso={fields.annexureRefShowAlso}
                  annexures={fields.annexures || []}
                  isReadOnly={isReadOnly}
                  onToggleEnabled={() => {
                    setFields(prev => {
                      if (prev.annexureEnabled) {
                        const remaining = (prev.annexures || []).filter(a => a.id !== prev.annexureRef);
                        return {
                          ...prev,
                          annexureEnabled: false,
                          annexureRef: '',
                          annexureRefShowAlso: false,
                          annexures: reorderAndLabelAnnexures(
                            remaining,
                            '',
                            prev.legalAnnexureRef,
                            false,
                            prev.legalAnnexureEnabled
                          ),
                        };
                      } else {
                        const newId = String(Date.now());
                        const newAnnexure: AnnexureItem = {
                          id: newId,
                          label: 'A',
                          title: 'Property Address Schedule',
                          excelFileUrl: '',
                          excelFileName: '',
                        };
                        const updated = [...(prev.annexures || []), newAnnexure];
                        return {
                          ...prev,
                          annexureEnabled: true,
                          annexureRef: newId,
                          annexures: reorderAndLabelAnnexures(
                            updated,
                            newId,
                            prev.legalAnnexureRef,
                            true,
                            prev.legalAnnexureEnabled
                          ),
                        };
                      }
                    });
                  }}
                  onToggleShowAlso={() => handleChange('annexureRefShowAlso', !fields.annexureRefShowAlso)}
                  onSelectRef={(id) => handleChange('annexureRef', id)}
                  reportRefText="Address as per Document"
                />
              </div>

              {(!fields.annexureEnabled || fields.annexureRefShowAlso) && (
                <div className="space-y-3">
                  <Field label="Address as per Document (Khata, Plot, Mouza, Tahasil, Dist, Pin)">
                    <textarea rows={2} value={fields.propertyAddressAsDocs || ''} onChange={e => handleChange('propertyAddressAsDocs', e.target.value)} disabled={isReadOnly} className={inputCls} />
                  </Field>
                  <Field label="Address as per Physical / Site Visit">
                    <textarea rows={2} value={fields.propertyAddressAsVisit || ''} onChange={e => handleChange('propertyAddressAsVisit', e.target.value)} disabled={isReadOnly} className={inputCls} />
                  </Field>
                </div>
              )}

              {fields.annexureEnabled && (
                <div className="space-y-2">
                  {/* Chip selector — only when 2+ annexures */}
                  {(fields.annexures || []).length > 1 && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#6c757d] uppercase tracking-wider">Select Annexure</label>
                      <div className="flex flex-wrap gap-2">
                        {(fields.annexures || []).map(ann => {
                          const isSelected = fields.annexureRef === ann.id;
                          const displayTitle = ann.title || `Annexure ${ann.label}`;
                          return (
                            <button
                              key={ann.id}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => handleChange('annexureRef', isSelected ? '' : ann.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'bg-[#b8860b] text-white border-[#b8860b] shadow-xs'
                                  : 'bg-white text-[#6c757d] border-[#dee2e6] hover:border-[#b8860b] hover:text-[#b8860b]'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/30' : 'bg-[#f0ead6] text-[#b8860b]'}`}>{ann.label}</span>
                              {displayTitle}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Linked confirmation pill */}
                  {(() => {
                    const linked = (fields.annexures || []).find(a => a.id === fields.annexureRef) || (fields.annexures || []).find(a => a.parsedData) || (fields.annexures || [])[0];
                    if (!linked) return null;
                    const displayTitle = linked.title || `Annexure ${linked.label}`;
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fff8e1] border border-[#ffe082] text-xs text-[#7b6b2e]">
                        <svg className="w-3.5 h-3.5 shrink-0 text-[#b8860b]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>In report: <strong>Address as per Document — Refer to {displayTitle}</strong></span>
                        <span className="ml-auto text-[10px] text-[#b8860b]/60">Edit title &amp; file in Annexure section ↓</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Address Matching">
                <select value={fields.addressMatching || 'Yes (As per documents)'} onChange={e => handleChange('addressMatching', e.target.value)} disabled={isReadOnly} className={selectCls}>
                  <option value="Yes (As per documents)">Yes (As per documents)</option>
                  <option value="No (Discrepancy observed)">No (Discrepancy observed)</option>
                  <option value="Partially Matching">Partially Matching</option>
                </select>
              </Field>
              <Field label="Latitude">
                <input type="text" value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 21.636778" />
              </Field>
              <Field label="Longitude">
                <input type="text" value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 85.628000" />
              </Field>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Main Locality">
                <input type="text" value={fields.mainLocality || ''} onChange={e => handleChange('mainLocality', e.target.value)} disabled={isReadOnly} className={inputCls} />
              </Field>
              <Field label="Sub Locality">
                <input type="text" value={fields.subLocality || ''} onChange={e => handleChange('subLocality', e.target.value)} disabled={isReadOnly} className={inputCls} />
              </Field>
              <Field label="Locality Type">
                <select value={fields.localityType || 'Residential'} onChange={e => handleChange('localityType', e.target.value)} disabled={isReadOnly} className={selectCls}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Institutional">Institutional</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Residential cum commercial">Residential cum commercial</option>
                </select>
              </Field>
              <Field label="Landmark">
                <input type="text" value={fields.landmark || ''} onChange={e => handleChange('landmark', e.target.value)} disabled={isReadOnly} className={inputCls} />
              </Field>
              <Field label="Occupancy of Locality">
                <select value={fields.localityOccupancy || 'Fully Occupied'} onChange={e => handleChange('localityOccupancy', e.target.value)} disabled={isReadOnly} className={selectCls}>
                  <option value="Fully Occupied">Fully Occupied</option>
                  <option value="Moderately Occupied">Moderately Occupied</option>
                  <option value="Sparsely Occupied">Sparsely Occupied</option>
                </select>
              </Field>
              <Field label="Population Density">
                <select value={fields.populationDensity || 'Moderate'} onChange={e => handleChange('populationDensity', e.target.value)} disabled={isReadOnly} className={selectCls}>
                  <option value="High">High</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Low">Low</option>
                </select>
              </Field>
            </div>

            {/* Distance Matrix */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Distance & Infrastructure Matrix</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Distance from ABCL Branch">
                  <input type="text" value={fields.distanceFromBranch || ''} onChange={e => handleChange('distanceFromBranch', e.target.value)} disabled={isReadOnly} className={inputCls} />
                </Field>
                <Field label="Distance from City Center / Market">
                  <input type="text" value={fields.distanceFromCityCenter || ''} onChange={e => handleChange('distanceFromCityCenter', e.target.value)} disabled={isReadOnly} className={inputCls} />
                </Field>
                <Field label="Distance from Bus Stand">
                  <input type="text" value={fields.distanceBusStop || ''} onChange={e => handleChange('distanceBusStop', e.target.value)} disabled={isReadOnly} className={inputCls} />
                </Field>
                <Field label="Distance from Nearest Railway Station">
                  <input type="text" value={fields.distanceRailwayStation || ''} onChange={e => handleChange('distanceRailwayStation', e.target.value)} disabled={isReadOnly} className={inputCls} />
                </Field>
                <Field label="Availability of Amenities (School/Market)">
                  <input type="text" value={fields.amenitiesAvailability || ''} onChange={e => handleChange('amenitiesAvailability', e.target.value)} disabled={isReadOnly} className={inputCls} />
                </Field>
                <Field label="Approach Road Width">
                  <input type="text" value={fields.approachRoadWidth || ''} onChange={e => handleChange('approachRoadWidth', e.target.value)} disabled={isReadOnly} className={inputCls} />
                </Field>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Has Valuator Done Valuation Before?">
                <select
                  value={fields.valuedBefore || 'No'}
                  onChange={e => {
                    const val = e.target.value;
                    handleChange('valuedBefore', val);
                    if (val === 'No') {
                      handleChange('valuedBeforeDate', '');
                    }
                  }}
                  disabled={isReadOnly}
                  className={selectCls}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
              {fields.valuedBefore === 'Yes' ? (
                <Field label="If Yes When? (Date of Prior Valuation)">
                  <input
                    type="date"
                    value={fields.valuedBeforeDate || ''}
                    onChange={e => handleChange('valuedBeforeDate', e.target.value)}
                    disabled={isReadOnly}
                    className={inputCls}
                  />
                </Field>
              ) : (
                <div className="hidden md:block" />
              )}
              <Field label="Land Locked">
                <select value={fields.landLocked || 'No'} onChange={e => handleChange('landLocked', e.target.value)} disabled={isReadOnly} className={selectCls}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
              <Field label="Encumbrance / Court Notice / Other Financier Board">
                <select value={fields.otherEncumbranceFeatures || 'No'} onChange={e => handleChange('otherEncumbranceFeatures', e.target.value)} disabled={isReadOnly} className={selectCls}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
            </div>
          </div>
        </Section>

        {/* ═══ SECTION 3: PROPERTY DETAILING ═══ */}
        <Section title="Property Detailings" number={3}>
          <div className="grid md:grid-cols-2 gap-4">
            {/* 1. Occupancy */}
            <Field label="Occupancy">
              <select value={fields.occupiedBy || 'Vacant'} onChange={e => handleChange('occupiedBy', e.target.value)} disabled={isReadOnly} className={selectCls}>
                <option value="Vacant">Vacant</option>
                <option value="Self Occupied">Self Occupied</option>
                <option value="Tenanted">Tenanted</option>
                <option value="Under Construction">Under Construction</option>
              </select>
            </Field>

            {/* 2. Occupied By */}
            <Field label="Occupied By">
              <input type="text" value={fields.occupantName || ''} onChange={e => handleChange('occupantName', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA or Occupant Name" />
            </Field>

            {/* 3. Relationship of Occupant with Client */}
            <Field label="Relationship of Occupant with Client">
              <input type="text" value={fields.occupantRelation || ''} onChange={e => handleChange('occupantRelation', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. NA or Relative" />
            </Field>

            {/* 4. Property Demarcation (yes/no) */}
            <Field label="Property Demarcation (yes/no)">
              <select value={fields.plotDemarcated || 'No'} onChange={e => handleChange('plotDemarcated', e.target.value)} disabled={isReadOnly} className={selectCls}>
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>

            {/* 5. Property Identification (yes/no) */}
            <Field label="Property Identification (yes/no)">
              <select value={fields.propertyIdentification || 'Yes'} onChange={e => handleChange('propertyIdentification', e.target.value)} disabled={isReadOnly} className={selectCls}>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>

            {/* 6. Property Type */}
            <Field label="Property Type">
              <input type="text" value={fields.propertyType || 'Residential'} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly} className={inputCls} />
            </Field>

            {/* 7. Property Sub Type */}
            <Field label="Property Sub Type">
              <input type="text" value={fields.propertySubType || 'Single / Multi-units building - R'} onChange={e => handleChange('propertySubType', e.target.value)} disabled={isReadOnly} className={inputCls} />
            </Field>

            {/* 8. Property Holding */}
            <Field label="Property Holding">
              <select value={fields.propertyHolding || 'Freehold'} onChange={e => handleChange('propertyHolding', e.target.value)} disabled={isReadOnly} className={selectCls}>
                <option value="Freehold">Freehold</option>
                <option value="Leasehold">Leasehold</option>
              </select>
            </Field>

            {/* 9. Property situated in Limits */}
            <Field label="Property situated in Limits">
              <select value={fields.propertyJurisdiction || 'Gram Panchayat'} onChange={e => handleChange('propertyJurisdiction', e.target.value)} disabled={isReadOnly} className={selectCls}>
                <option value="Gram Panchayat">Gram Panchayat</option>
                <option value="Municipal Corporation">Municipal Corporation</option>
                <option value="Municipality">Municipality</option>
                <option value="Development Authority / BDA">Development Authority / BDA</option>
                <option value="NAC">NAC</option>
              </select>
            </Field>

            {/* 10. Marketability */}
            <Field label="Marketability">
              <select value={fields.marketability || 'Average'} onChange={e => handleChange('marketability', e.target.value)} disabled={isReadOnly} className={selectCls}>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            {/* 11. Property Age */}
            <Field label="Property Age">
              <input type="text" value={fields.ageOfPropertyActual || ''} onChange={e => handleChange('ageOfPropertyActual', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 0-Years or 5-Years" />
            </Field>

            {/* 12. Residual Age */}
            <Field label="Residual Age">
              <input type="text" value={fields.estimatedFutureLife || ''} onChange={e => handleChange('estimatedFutureLife', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 60-Years" />
            </Field>

            {/* 13. Construction Quality */}
            <Field label="Construction Quality">
              <select value={fields.qualityOfConstruction || 'Average'} onChange={e => handleChange('qualityOfConstruction', e.target.value)} disabled={isReadOnly} className={selectCls}>
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>

            {/* 14. Structure Type */}
            <Field label="Structure Type">
              <select value={fields.structureType || 'RCC'} onChange={e => handleChange('structureType', e.target.value)} disabled={isReadOnly} className={selectCls}>
                <option value="RCC">RCC</option>
                <option value="Load Bearing">Load Bearing</option>
                <option value="Steel Structure">Steel Structure</option>
                <option value="Semi-Pucca">Semi-Pucca</option>
              </select>
            </Field>

            {/* 15. Dimensions of the Property Container */}
            <div className="col-span-full bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-3">
              <div className="border-b border-neutral-100 pb-2">
                <h3 className="text-sm font-bold text-[#0f2038] uppercase tracking-wide">
                  Dimensions of the Property
                </h3>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Width (Facing Road Side) in feet">
                  <input type="text" value={fields.dimensionWidth || ''} onChange={e => handleChange('dimensionWidth', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 30 feet or NA" />
                </Field>
                <Field label="Depth (in feet)">
                  <input type="text" value={fields.dimensionDepth || ''} onChange={e => handleChange('dimensionDepth', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 45 feet or NA" />
                </Field>
              </div>
            </div>

            {/* 16. Cautious Locations */}
            <Field label="Cautious Locations">
              <input type="text" value={fields.cautiousLocations || ''} onChange={e => handleChange('cautiousLocations', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. No / High tension wire / NA" />
            </Field>

            {/* 17. If Flat, Configuration Type */}
            <Field label="If Flat, Configuration Type">
              <input type="text" value={fields.flatConfigurationType || ''} onChange={e => handleChange('flatConfigurationType', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 2BHK / 3BHK or NA" />
            </Field>

            {/* 18. Percentage Completion of Property */}
            <Field label="Percentage Completion of Property">
              <input type="text" value={fields.percentageCompletion || ''} onChange={e => handleChange('percentageCompletion', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 65% or 100%" />
            </Field>

            {/* 19. Percentage Recommendation of Property */}
            <Field label="Percentage Recommendation of Property">
              <input type="text" value={fields.percentageRecommendation || ''} onChange={e => handleChange('percentageRecommendation', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. 70% or 100%" />
            </Field>
          </div>
        </Section>

        {/* ═══ SECTION 4: DOCUMENTATION ═══ */}
        <Section title="Documentation" number={4}>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                <h3 className="text-sm font-bold text-[#0f2038]">
                  Documents Provided <span className="text-[10px] font-normal text-[#6c757d] normal-case">(Title Deeds, ROR, Plans)</span>
                </h3>
                <AnnexureRefSelector
                  label="Legal / Documentation"
                  annexureEnabled={fields.legalAnnexureEnabled}
                  annexureRef={fields.legalAnnexureRef}
                  annexureRefShowAlso={fields.legalAnnexureRefShowAlso}
                  annexures={fields.annexures || []}
                  isReadOnly={isReadOnly}
                  onToggleEnabled={() => {
                    setFields(prev => {
                      if (prev.legalAnnexureEnabled) {
                        const remaining = (prev.annexures || []).filter(a => a.id !== prev.legalAnnexureRef);
                        return {
                          ...prev,
                          legalAnnexureEnabled: false,
                          legalAnnexureRef: '',
                          legalAnnexureRefShowAlso: false,
                          annexures: reorderAndLabelAnnexures(
                            remaining,
                            prev.annexureRef,
                            '',
                            prev.annexureEnabled,
                            false
                          ),
                        };
                      } else {
                        const newId = String(Date.now());
                        const newAnnexure: AnnexureItem = {
                          id: newId,
                          label: 'B',
                          title: 'Legal & Title Details',
                          excelFileUrl: '',
                          excelFileName: '',
                        };
                        const updated = [...(prev.annexures || []), newAnnexure];
                        return {
                          ...prev,
                          legalAnnexureEnabled: true,
                          legalAnnexureRef: newId,
                          annexures: reorderAndLabelAnnexures(
                            updated,
                            prev.annexureRef,
                            newId,
                            prev.annexureEnabled,
                            true
                          ),
                        };
                      }
                    });
                  }}
                  onToggleShowAlso={() => handleChange('legalAnnexureRefShowAlso', !fields.legalAnnexureRefShowAlso)}
                  onSelectRef={(id) => handleChange('legalAnnexureRef', id)}
                  reportRefText="Documents Provided"
                />
              </div>

              {(!fields.legalAnnexureEnabled || fields.legalAnnexureRefShowAlso) && (
                <Field label="Documents Provided">
                  <input type="text" value={fields.documentsProvided || ''} onChange={e => handleChange('documentsProvided', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Copy of Sale Deed, ROR, Sketch Map" />
                </Field>
              )}

              {fields.legalAnnexureEnabled && (
                <div className="space-y-2">
                  {(fields.annexures || []).length > 1 && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-[#6c757d] uppercase tracking-wider">Select Annexure</label>
                      <div className="flex flex-wrap gap-2">
                        {(fields.annexures || []).map(ann => {
                          const isSelected = fields.legalAnnexureRef === ann.id;
                          const displayTitle = ann.title || `Annexure ${ann.label}`;
                          return (
                            <button
                              key={ann.id}
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => handleChange('legalAnnexureRef', isSelected ? '' : ann.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                isSelected
                                  ? 'bg-[#b8860b] text-white border-[#b8860b] shadow-xs'
                                  : 'bg-white text-[#6c757d] border-[#dee2e6] hover:border-[#b8860b] hover:text-[#b8860b]'
                              }`}
                            >
                              <span className={`w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center shrink-0 ${isSelected ? 'bg-white/30' : 'bg-[#f0ead6] text-[#b8860b]'}`}>{ann.label}</span>
                              {displayTitle}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const linked = (fields.annexures || []).find(a => a.id === fields.legalAnnexureRef) || (fields.annexures || []).find(a => a.parsedData) || (fields.annexures || [])[0];
                    if (!linked) return null;
                    const displayTitle = linked.title || `Annexure ${linked.label}`;
                    return (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#fff8e1] border border-[#ffe082] text-xs text-[#7b6b2e]">
                        <svg className="w-3.5 h-3.5 shrink-0 text-[#b8860b]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span>In report: <strong>Documents Provided — Refer to {displayTitle}</strong></span>
                        <span className="ml-auto text-[10px] text-[#b8860b]/60">Edit title &amp; file in Annexure section ↓</span>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            <Field label="Sanction Plan details if provided">
              <input type="text" value={fields.sanctionPlanDetails || ''} onChange={e => handleChange('sanctionPlanDetails', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Approved Plan No. or Plan not provided" />
            </Field>
            <Field label="Utility Bills (Water bill, electricity bill)">
              <input type="text" value={fields.utilityBills || ''} onChange={e => handleChange('utilityBills', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="e.g. Electricity Bill verified / NA" />
            </Field>
          </div>
        </Section>

        {/* ═══ SECTION 5: ACCOMMODATION DETAILS ═══ */}
        <Section title="Accommodation Details" number={5}>
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Unit Details / Floor</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Drawing Room</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Bedroom</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Dining Room</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Kitchen</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Bathroom</th>
                    <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Balcony</th>
                    {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {(fields.accommodationRows || DEFAULT_ACCOM_ROWS).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          className={inputCls + ' !py-1.5 text-xs font-bold text-[#0f2038]'}
                          value={row.floor || ''}
                          onChange={e => {
                            const updated = [...(fields.accommodationRows || DEFAULT_ACCOM_ROWS)];
                            updated[idx] = { ...updated[idx], floor: e.target.value };
                            handleChange('accommodationRows', updated);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                      {(['drawingRoom', 'bedroom', 'diningRoom', 'kitchen', 'bathroom', 'balcony'] as (keyof AccomRow)[]).map((colKey) => (
                        <td key={colKey} className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input
                            type="text"
                            value={row[colKey] || ''}
                            disabled={isReadOnly}
                            onChange={e => {
                              const updated = [...(fields.accommodationRows || DEFAULT_ACCOM_ROWS)];
                              updated[idx] = { ...updated[idx], [colKey]: e.target.value };
                              handleChange('accommodationRows', updated);
                            }}
                            className={inputCls + ' !py-1.5 text-xs text-center'}
                            placeholder="NA"
                          />
                        </td>
                      ))}
                      {!isReadOnly && (
                        <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center">
                          <button
                            type="button"
                            onClick={() => removeAccommodationRow(idx)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                            title="Remove Floor"
                          >
                            &times;
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addAccommodationRow}
                className="text-sm text-[#b8860b] hover:text-[#96700a] font-semibold flex items-center gap-1.5 pt-1"
              >
                <span className="text-lg leading-none">+</span> Add Unit / Floor
              </button>
            )}
          </div>
        </Section>

        {/* ═══ SECTION 6: BUILD UP DETAILS ═══ */}
        <Section title="Build Up Details" number={6}>
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Floor</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">As per site</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">As per Plan / Allowed</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Percentage Deviation</th>
                    {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {(fields.buaRows || DEFAULT_BUA_ROWS).map((row, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          className={inputCls + ' !py-1.5 text-xs font-bold text-[#0f2038]'}
                          value={row.floor || ''}
                          onChange={e => {
                            const updated = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
                            updated[idx] = { ...updated[idx], floor: e.target.value };
                            handleChange('buaRows', updated);
                          }}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          value={row.asPerSite || ''}
                          disabled={isReadOnly}
                          onChange={e => {
                            const updated = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
                            updated[idx] = { ...updated[idx], asPerSite: e.target.value };
                            handleChange('buaRows', updated);
                          }}
                          className={inputCls + ' !py-1.5 text-xs'}
                          placeholder="e.g. RCC-1441sqft"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          value={row.asPerPlan || ''}
                          disabled={isReadOnly}
                          onChange={e => {
                            const updated = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
                            updated[idx] = { ...updated[idx], asPerPlan: e.target.value };
                            handleChange('buaRows', updated);
                          }}
                          className={inputCls + ' !py-1.5 text-xs'}
                          placeholder="NA"
                        />
                      </td>
                      <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                        <input
                          type="text"
                          value={row.percentageDeviation || ''}
                          disabled={isReadOnly}
                          onChange={e => {
                            const updated = [...(fields.buaRows || DEFAULT_BUA_ROWS)];
                            updated[idx] = { ...updated[idx], percentageDeviation: e.target.value };
                            handleChange('buaRows', updated);
                          }}
                          className={inputCls + ' !py-1.5 text-xs'}
                          placeholder="NA"
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center">
                          <button
                            type="button"
                            onClick={() => removeBuaRow(idx)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                            title="Remove Floor"
                          >
                            &times;
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!isReadOnly && (
              <button
                type="button"
                onClick={addBuaRow}
                className="text-sm text-[#b8860b] hover:text-[#96700a] font-semibold flex items-center gap-1.5 pt-1"
              >
                <span className="text-lg leading-none">+</span> Add Floor Details
              </button>
            )}
          </div>
        </Section>

        {/* ═══ SECTION 7: VALUATION & RATE ANALYSIS ═══ */}
        <Section title="Valuation & Rate Analysis" number={7}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#0a1628] text-white">
                  <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Detailings</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Area in Sqft</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Rate / Sqft (Rs.)</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Value (Rs.)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs">Plot Area (As per Documents)</td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" value={fields.plotAreaDocs || ''} onChange={e => handleChange('plotAreaDocs', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs text-right'} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" value={fields.landRate || ''} onChange={e => handleChange('landRate', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs text-right'} />
                  </td>
                  <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-bold text-xs bg-amber-50/50 text-[#0f2038]">
                    &#8377;{formatIndianCurrency(landTotalVal)}
                  </td>
                </tr>
                <tr className="bg-[#f8f9fa]">
                  <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs">Plot Area (As per Physical)</td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="text" value={fields.plotAreaPhysical || ''} onChange={e => handleChange('plotAreaPhysical', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs text-right'} />
                  </td>
                  <td className="px-3 py-2 border-b border-[#e9ecef] text-right text-xs text-slate-400">-</td>
                  <td className="px-3 py-2 border-b border-[#e9ecef] text-right text-xs text-slate-400">-</td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs">Plot Area (Considered For Valuation)</td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="text" value={fields.plotAreaConsidered || ''} onChange={e => handleChange('plotAreaConsidered', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs text-right'} />
                  </td>
                  <td className="px-3 py-2 border-b border-[#e9ecef] text-right text-xs text-slate-400">-</td>
                  <td className="px-3 py-2 border-b border-[#e9ecef] text-right text-xs text-slate-400">-</td>
                </tr>
                <tr className="bg-[#f8f9fa]">
                  <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs">Build Up Area (As per Plan/Document)</td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]" colSpan={3}>
                    <input type="text" value={fields.buaPlan || ''} onChange={e => handleChange('buaPlan', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} />
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs">Build Up Area (As per Actual) GF RCC on 100% comp</td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" value={fields.buaActual || ''} onChange={e => handleChange('buaActual', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs text-right'} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" value={fields.buaActualRate || ''} onChange={e => handleChange('buaActualRate', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs text-right'} />
                  </td>
                  <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-bold text-xs bg-amber-50/50 text-[#0f2038]">
                    &#8377;{formatIndianCurrency(bua100TotalVal)}
                  </td>
                </tr>
                <tr className="bg-[#f8f9fa]">
                  <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs">Build Up Area (Considered for Valuation) as on date</td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" value={fields.buaConsidered || ''} onChange={e => handleChange('buaConsidered', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs text-right'} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" value={fields.buaConsideredRate || ''} onChange={e => handleChange('buaConsideredRate', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs text-right'} />
                  </td>
                  <td className="px-3 py-2 border-b border-[#e9ecef] text-right font-bold text-xs bg-amber-50/50 text-[#0f2038]">
                    &#8377;{formatIndianCurrency(buaConsTotalVal)}
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 border-b border-[#e9ecef] font-medium text-xs">Amenities (like parking etc in unit or lumpsum value)</td>
                  <td className="px-3 py-2 border-b border-[#e9ecef]" colSpan={2}></td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" value={fields.amenitiesValue || '0'} onChange={e => handleChange('amenitiesValue', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs text-right'} />
                  </td>
                </tr>

                {/* Abstract Totals matching General styling */}
                <tr className="bg-[#f0ead6] font-bold text-[#0f2038]">
                  <td className="px-3 py-3 text-sm uppercase tracking-wider" colSpan={3}>TOTAL FAIR MARKET VALUE</td>
                  <td className="px-3 py-3 text-right text-base text-[#b8860b]">&#8377;{formatIndianCurrency(totalVal)}</td>
                </tr>
                <tr className="bg-white font-semibold">
                  <td className="px-3 py-2.5 border-b border-[#e9ecef] text-xs" colSpan={3}>Realizable Value (90%)</td>
                  <td className="px-3 py-2.5 border-b border-[#e9ecef] text-right text-sm text-green-700">&#8377;{formatIndianCurrency(realizableVal)}</td>
                </tr>
                <tr className="bg-white font-semibold">
                  <td className="px-3 py-2.5 border-b border-[#e9ecef] text-xs" colSpan={3}>Distress / Forced Sale Value (80%)</td>
                  <td className="px-3 py-2.5 border-b border-[#e9ecef] text-right text-sm text-orange-700">&#8377;{formatIndianCurrency(distressVal)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* ═══ SECTION 8: BOUNDARY DETAILS ═══ */}
        <Section title="Boundary Details (4-Way Comparison)" number={8}>
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#0a1628] text-white">
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Detailings</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">North</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">South</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">East</th>
                    <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">West</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-bold text-xs text-[#0f2038]">As per Sketch map</td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundarySketchNorth || ''} onChange={e => handleChange('boundarySketchNorth', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundarySketchSouth || ''} onChange={e => handleChange('boundarySketchSouth', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundarySketchEast || ''} onChange={e => handleChange('boundarySketchEast', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundarySketchWest || ''} onChange={e => handleChange('boundarySketchWest', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                  </tr>
                  <tr className="bg-[#f8f9fa]">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-bold text-xs text-[#0f2038]">As per Mouza Map</td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundaryMouzaNorth || ''} onChange={e => handleChange('boundaryMouzaNorth', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundaryMouzaSouth || ''} onChange={e => handleChange('boundaryMouzaSouth', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundaryMouzaEast || ''} onChange={e => handleChange('boundaryMouzaEast', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundaryMouzaWest || ''} onChange={e => handleChange('boundaryMouzaWest', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-3 py-2 border-b border-[#e9ecef] font-bold text-xs text-[#0f2038]">As per actual site</td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundaryActualNorth || ''} onChange={e => handleChange('boundaryActualNorth', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundaryActualSouth || ''} onChange={e => handleChange('boundaryActualSouth', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundaryActualEast || ''} onChange={e => handleChange('boundaryActualEast', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]"><input type="text" value={fields.boundaryActualWest || ''} onChange={e => handleChange('boundaryActualWest', e.target.value)} disabled={isReadOnly} className={inputCls + ' !py-1.5 text-xs'} /></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Field label="Boundaries Matching Status">
              <input type="text" value={fields.boundariesMatching || ''} onChange={e => handleChange('boundariesMatching', e.target.value)} disabled={isReadOnly} className={inputCls} />
            </Field>
          </div>
        </Section>

        {/* ═══ SECTION 9: REMARKS & SIGNOFF ═══ */}
        <Section title="Remarks & Visited Engineer" number={9}>
          <div className="space-y-4">
            <Field label="Detailed Valuation Remarks">
              <textarea rows={5} value={fields.remarks || ''} onChange={e => handleChange('remarks', e.target.value)} disabled={isReadOnly} className={inputCls} placeholder="Enter valuation remarks..." />
            </Field>
            <Field label="Name of the Engineer Visited">
              <input
                type="text"
                value={fields.engineerVisitedName || ''}
                onChange={e => handleChange('engineerVisitedName', e.target.value)}
                disabled={isReadOnly}
                className={inputCls}
                placeholder="Assigned Field Engineer(s)"
              />
            </Field>
          </div>
        </Section>

        {/* ═══ SECTION 10: MAPS & ATTACHMENTS ═══ */}
        <BaseMapsSection
          locationMapImage={fields.locationMapImage}
          latitude={fields.latitude}
          longitude={fields.longitude}
          propertyAddress={fields.propertyAddressAsDocs || fields.propertyAddressAsVisit || ''}
          sketchMapImages={fields.sketchMapImages}
          mouzaMapImage={fields.mouzaMapImage}
          cadastralMapImage={fields.cadastralMapImage}
          isReadOnly={isReadOnly}
          uploading={!!uploadingTarget}
          bucketCount={bucketImages?.length || 0}
          onLocationMapUpload={(e) => handleUploadSingleImage(e, 'locationMapImage')}
          onLocationMapRemove={() => handleChange('locationMapImage', '')}
          onSketchMapUpload={handleUploadMultipleSketches}
          onSketchMapRemove={(idx) => {
            const updated = (fields.sketchMapImages || []).filter((_, i) => i !== idx);
            handleChange('sketchMapImages', updated);
          }}
          onMouzaMapUpload={(e) => handleUploadSingleImage(e, 'mouzaMapImage')}
          onMouzaMapRemove={() => handleChange('mouzaMapImage', '')}
          onCadastralMapUpload={(e) => handleUploadSingleImage(e, 'cadastralMapImage')}
          onCadastralMapRemove={() => handleChange('cadastralMapImage', '')}
          sectionNumber={10}
          sectionId="section-10"
        />

        {/* ═══ SECTION 11: PHOTOGRAPHS ═══ */}
        <BasePhotographsSection
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploadingTarget === 'photos'}
          bucketCount={bucketImages?.length || 0}
          onImageNameChange={(idx, name) => {
            const updatedNames = [...(fields.propertyImageNames || [])];
            while (updatedNames.length <= idx) {
              updatedNames.push('');
            }
            updatedNames[idx] = name;
            handleChange('propertyImageNames', updatedNames);
          }}
          onRemoveImage={(idx) => {
            const updatedImgs = (fields.propertyImages || []).filter((_, i) => i !== idx);
            const updatedNames = (fields.propertyImageNames || []).filter((_, i) => i !== idx);
            handleChange('propertyImages', updatedImgs);
            handleChange('propertyImageNames', updatedNames);
          }}
          onReorderImages={(newImages, newNames) => {
            handleChange('propertyImages', newImages);
            handleChange('propertyImageNames', newNames);
          }}
          onUploadImages={handleUploadMultiplePhotos}
          onOpenBucketPicker={() => {
            setBucketPickerMode('propertyImages');
            setBucketPickerOpen(true);
          }}
          sectionNumber={11}
          sectionId="section-11"
        />

        {/* ═══ SECTION 12: ANNEXURES (Always available) ═══ */}
        <BaseAnnexureSection
          annexures={fields.annexures || []}
          isReadOnly={isReadOnly}
          uploading={uploadingTarget !== null}
          onAddAnnexure={addAnnexure}
          onRemoveAnnexure={removeAnnexure}
          onUpdateTitle={updateAnnexureTitle}
          onUploadExcel={handleAnnexureUpload}
          onRemoveFile={removeAnnexureFile}
          sectionNumber={12}
          sectionId="section-12-annexure"
        />

        {/* ═══ STANDARDIZED ACTION BAR ═══ */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={loading}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
        />

      </div>

      {/* ── Right Column: Dynamic Floating Navigator drawn from this bank's exact sections ── */}
      <FloatingNavigator sections={NAV_SECTIONS} />

      {/* ── Standard Photo Bucket Modal ── */}
      <BasePhotoBucketModal
        isOpen={bucketPickerOpen}
        bucketImages={bucketImages}
        mode={bucketPickerMode}
        onClose={() => setBucketPickerOpen(false)}
        onConfirm={(selectedUrls) => {
          if (bucketPickerMode === 'propertyImages') {
            const combined = [...(fields.propertyImages || []), ...selectedUrls];
            handleChange('propertyImages', combined);
          } else if (bucketPickerMode === 'sketchMapImages') {
            const combined = [...(fields.sketchMapImages || []), ...selectedUrls];
            handleChange('sketchMapImages', combined);
          } else if (bucketPickerMode === 'locationMapImage' && selectedUrls[0]) {
            handleChange('locationMapImage', selectedUrls[0]);
          }
        }}
      />

    </div>
  );
}
