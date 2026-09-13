'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { formatIndianCurrency } from '@/lib/numberToWords';
import {
  PDFAnnapurnaMicroFinanceRenderer,
  AnnapurnaMicroFinanceReportFields,
  AnnapurnaMicroReportFields,
} from '@/lib/banks/pdf-annapurna-micro-finance-renderer';
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
  formatReportDate,
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  BaseAnnexureSection,
  fetchBytes,
} from '../BaseBankReportComponents';
import { reorderAndLabelAnnexures, AnnexureItem, normalizeMapImages, BankConfig } from '@/lib/bank-fields';
import { decodeHtmlEntitiesDeep } from '@/lib/html-entities';
// @ts-ignore
import * as XLSX from 'xlsx';

export const ANNAPURNA_MICRO_FINANCE_CONFIG: BankConfig = {
  bankId: 'ANNAPURNA MICRO FINANCE LTD',
  subTemplateId: '',
  displayName: 'Annapurna Micro Finance Ltd',
};

export interface AnnapurnaMicroFinanceProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole: string;
  bucketImages?: any[];
  prefill?: any;
  onResetWizard?: () => void;
}

export type AnnapurnaMicroProps = AnnapurnaMicroFinanceProps;

const parseNum = (v: any): number => {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? 0 : n;
};

export default function AnnapurnaMicroFinance({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
  onResetWizard,
}: AnnapurnaMicroFinanceProps) {
  const router = useRouter();
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  // ── Clean Initial State (ZERO dummy prefills) ──
  const initialData: AnnapurnaMicroFinanceReportFields = useMemo(() => {
    const raw = (typeof initialFields === 'object' && initialFields !== null) ? initialFields : {};
    return {
      // Section 1: Application Details
      refNo: raw.refNo || (projectCode ? `AFPL/${projectCode}` : 'AFPL/'),
      reportDate: formatReportDate(raw.reportDate || raw.dateOfValuation || new Date()),
      fileNo: raw.fileNo || '',
      dateOfVisit: formatReportDate(raw.dateOfVisit || raw.dateOfInspection || prefill?.inspectionDate || ''),
      applicantName: raw.applicantName || prefill?.contactName || '',
      contactPerson: raw.contactPerson || prefill?.contactName || '',
      loanType: raw.loanType || 'LAP',
      personMetOnSite: raw.personMetOnSite || '',
      ownerName: raw.ownerName || raw.propertyOwner || prefill?.contactName || '',
      propertyOwner: raw.ownerName || raw.propertyOwner || prefill?.contactName || '',
      documentsProvided: raw.documentsProvided || 'Sale deed, ROR & Sketch map',

      // Section 2: Location Details
      propertyAddressSite: raw.propertyAddressSite || raw.addressAsPerSite || raw.propertyAddress || prefill?.propertyAddress || '',
      addressAsPerSite: raw.propertyAddressSite || raw.addressAsPerSite || raw.propertyAddress || prefill?.propertyAddress || '',
      locality: raw.locality || 'RURAL',
      landmark: raw.landmark || raw.landmarkNearBy || raw.nearbyLandmarks || '',
      landmarkNearBy: raw.landmark || raw.landmarkNearBy || raw.nearbyLandmarks || '',
      distanceFromBranch: raw.distanceFromBranch || '',
      latitude: raw.latitude || '',
      longitude: raw.longitude || '',
      propertyAddressLegal: raw.propertyAddressLegal || raw.addressAsPerLegal || raw.legalAddress || '',
      addressAsPerLegal: raw.propertyAddressLegal || raw.addressAsPerLegal || raw.legalAddress || '',
      floorNo: raw.floorNo || 'NA',
      propertyState: raw.propertyState || raw.state || 'Odisha',
      propertyCity: raw.propertyCity || raw.city || '',
      propertyPincode: raw.propertyPincode || raw.pincode || '',
      addressMatching: raw.addressMatching || 'YES',
      jurisdiction: raw.jurisdiction || '',
      holdingType: raw.holdingType || 'FREE HOLD',
      marketability: raw.marketability || 'FAIR',
      occupiedBy: raw.occupiedBy || raw.propertyOccupiedBy || 'Self',
      propertyOccupiedBy: raw.occupiedBy || raw.propertyOccupiedBy || 'Self',
      propertyType: raw.propertyType || raw.propertyTypeCategory || 'Commercial Building',
      propertyTypeCategory: raw.propertyType || raw.propertyTypeCategory || 'Commercial Building',
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
      natureOfBuilding: raw.natureOfBuilding || 'NA',
      planAspectRatio: raw.planAspectRatio || 'NA',
      structureType: raw.structureType || 'NA',
      projectedParts: raw.projectedParts || 'NA',
      masonryType: raw.masonryType || 'NA',
      expansionJoints: raw.expansionJoints || 'NA',
      roofType: raw.roofType || 'NA',
      steelGrade: raw.steelGrade || 'NA',
      mortarType: raw.mortarType || 'NA',
      concreteGrade: raw.concreteGrade || 'NA',
      environmentExposure: raw.environmentExposure || 'NA',
      footingType: raw.footingType || 'NA',
      seismicZone: raw.seismicZone || 'NA',
      soilLiquefiable: raw.soilLiquefiable || 'NA',
      coastalRegulatoryZone: raw.coastalRegulatoryZone || 'NA',
      soilSlopeVulnerable: raw.soilSlopeVulnerable || 'NA',
      floodProneArea: raw.floodProneArea || 'NA',
      groundSlopeMoreThan20: raw.groundSlopeMoreThan20 || 'NA',
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
      accommodationDetails: raw.accommodationDetails || '',

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
        { floor: 'Ground Floor', rooms: '', kitchens: '', bathrooms: '', sanctionedUsage: 'NA', actualUsage: 'Commercial' },
        { floor: 'First Floor', rooms: '', kitchens: '', bathrooms: '', sanctionedUsage: 'NA', actualUsage: 'Commercial' },
      ],

      // FSI & Demolition Details
      permissibleAreaPlan: raw.permissibleAreaPlan || 'NA',
      landComponent: raw.landComponent || 'NA',
      permissibleFsi: raw.permissibleFsi || 'NA',
      permissibleConstructionFsi: raw.permissibleConstructionFsi || 'NA',
      actualConstructionBua: raw.actualConstructionBua || 'NA',
      considerConstructionBua: raw.considerConstructionBua || 'NA',
      riskOfDemolition: raw.riskOfDemolition || 'LOW',
      propertyStatus: raw.propertyStatus !== undefined ? raw.propertyStatus : (raw.isCompleted || 'COMPLETED'),
      isCompleted: raw.isCompleted !== undefined ? raw.isCompleted : (raw.propertyStatus || 'COMPLETED'),
      completedPct: raw.completedPct !== undefined ? raw.completedPct : '100%',
      recommendedPct: raw.recommendedPct !== undefined ? raw.recommendedPct : '100%',
      currentAge: raw.currentAge || '',
      residualAge: raw.residualAge || '',

      // Section 6: Valuation
      landAreaSqft: raw.landAreaSqft || raw.landArea || '',
      landRateSqft: raw.landRateSqft || raw.landRatePerUnit || '',
      landTotalValue: raw.landTotalValue || '',
      buaAreaSqft: raw.buaAreaSqft || '',
      buaRateSqft: raw.buaRateSqft || '',
      buaTotalValue: raw.buaTotalValue || '',
      marketValue: raw.marketValue || '',
      distressedPct: raw.distressedPct !== undefined && raw.distressedPct !== null && raw.distressedPct !== '' ? String(raw.distressedPct) : '0',
      distressedValue: raw.distressedValue !== undefined && raw.distressedValue !== null ? String(raw.distressedValue) : '',
      govtRate: raw.govtRate || raw.govtLandRate || '',
      inDemolitionList: raw.inDemolitionList || 'NO',
      inNegativeArea: raw.inNegativeArea || 'NO',
      remarks: raw.remarks || '',

      // Section 8: Additional Checks
      approachRoadType: raw.approachRoadType || 'SINGLE LANE',
      surroundingAreaDevelopment: raw.surroundingAreaDevelopment || raw.developmentSurroundingArea || '',
      developmentSurroundingArea: raw.surroundingAreaDevelopment || raw.developmentSurroundingArea || '',
      distanceFromCityCentre: raw.distanceFromCityCentre || '',
      distanceFromCorpLimits: raw.distanceFromCorpLimits || raw.distanceFromCorporationLimits || '',
      distanceFromCorporationLimits: raw.distanceFromCorpLimits || raw.distanceFromCorporationLimits || '',
      electricity: raw.electricity || 'NA',
      electricityDistributor: raw.electricityDistributor || 'NA',
      waterSupply: raw.waterSupply || 'NA',
      waterDistributor: raw.waterDistributor || 'NA',
      sewerProvision: raw.sewerProvision || 'NA',
      sewerConnected: raw.sewerConnected || raw.sewerLineConnected || 'NA',
      sewerLineConnected: raw.sewerConnected || raw.sewerLineConnected || 'NA',
      futureDemolitionThreat: raw.futureDemolitionThreat || raw.demolitionThreat || 'NA',
      demolitionThreat: raw.futureDemolitionThreat || raw.demolitionThreat || 'NA',

      // Section 8: Declaration
      declarationDate: formatReportDate(raw.declarationDate || raw.reportDate || raw.dateOfVisit || new Date()),
      visitingEngineer: (raw.visitingEngineer && raw.visitingEngineer !== 'Visiting Engineer' && raw.visitingEngineer !== 'Mr. Engineer')
        ? raw.visitingEngineer
        : (formatAssignedEngineers(prefill?.fieldEmployees || prefill?.assignedFieldEmployees || prefill?.assignedEngineers) || raw.visitingEngineer || ''),
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
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const isInitialMount = useRef(true);
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-Save Draft with Debounce
  useEffect(() => {
    if (isReadOnly) return;
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

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

  // Auto-fill visitingEngineer from assigned field inspectors if empty or default
  useEffect(() => {
    if (!fields.visitingEngineer || fields.visitingEngineer === 'Visiting Engineer' || fields.visitingEngineer === 'Mr. Engineer') {
      const assigned = formatAssignedEngineers(
        prefill?.fieldEmployees ||
        prefill?.assignedFieldEmployees ||
        prefill?.assignedEngineers
      );
      if (assigned) {
        setFields(prev => ({ ...prev, visitingEngineer: assigned }));
      }
    }
  }, [prefill?.fieldEmployees, prefill?.assignedFieldEmployees, prefill?.assignedEngineers]);

  // Field change handler
  const handleChange = useCallback((key: keyof AnnapurnaMicroReportFields, value: any) => {
    setFields(prev => {
      const next = { ...prev, [key]: value };

      // Bi-directional alias synchronizations to prevent any UI-vs-Renderer discrepancies
      if (key === 'propertyAddressLegal' || key === 'addressAsPerLegal') {
        next.propertyAddressLegal = value;
        next.addressAsPerLegal = value;
      }
      if (key === 'propertyAddressSite' || key === 'addressAsPerSite') {
        next.propertyAddressSite = value;
        next.addressAsPerSite = value;
      }
      if (key === 'ownerName' || key === 'propertyOwner') {
        next.ownerName = value;
        next.propertyOwner = value;
      }
      if (key === 'landmark' || key === 'landmarkNearBy') {
        next.landmark = value;
        next.landmarkNearBy = value;
      }
      if (key === 'propertyPincode' || key === 'pincode') {
        next.propertyPincode = value;
        next.pincode = value;
      }
      if (key === 'occupiedBy' || key === 'propertyOccupiedBy') {
        next.occupiedBy = value;
        next.propertyOccupiedBy = value;
      }
      if (key === 'propertyType' || key === 'propertyTypeCategory') {
        next.propertyType = value;
        next.propertyTypeCategory = value;
      }
      if (key === 'surroundingAreaDevelopment' || key === 'developmentSurroundingArea') {
        next.surroundingAreaDevelopment = value;
        next.developmentSurroundingArea = value;
      }
      if (key === 'distanceFromCorpLimits' || key === 'distanceFromCorporationLimits') {
        next.distanceFromCorpLimits = value;
        next.distanceFromCorporationLimits = value;
      }
      if (key === 'sewerConnected' || key === 'sewerLineConnected') {
        next.sewerConnected = value;
        next.sewerLineConnected = value;
      }
      if (key === 'futureDemolitionThreat' || key === 'demolitionThreat') {
        next.futureDemolitionThreat = value;
        next.demolitionThreat = value;
      }
      if (key === 'propertyStatus' || key === 'isCompleted') {
        next.propertyStatus = value;
        next.isCompleted = value;
      }
      if (key === 'distressedPct') {
        next.distressedPct = value;
      }
      if (key === 'distressedValue') {
        next.distressedValue = value;
      }

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
      let marketVal = landTot + buaTot;
      if (marketVal === 0 && next.marketValue) {
        marketVal = parseNum(next.marketValue);
      }
      if (marketVal > 0) {
        next.marketValue = String(marketVal);
        const pctStr = next.distressedPct !== undefined && next.distressedPct !== null ? String(next.distressedPct).trim() : '0';
        const distPct = pctStr === '' ? 0 : parseNum(pctStr);
        next.distressedValue = String(Math.round(marketVal * (distPct / 100)));
      } else {
        next.marketValue = '';
        next.distressedValue = '';
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

  const handleReorderMap = (
    key: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages',
    newImages: string[]
  ) => {
    handleChange(key, newImages);
    if (key === 'locationMapImages') handleChange('locationMapImage', newImages[0] || '');
    if (key === 'mouzaMapImages') handleChange('mouzaMapImage', newImages[0] || '');
    if (key === 'cadastralMapImages') handleChange('cadastralMapImage', newImages[0] || '');
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

  const handleBucketConfirm = (selectedUrls: string[]) => {
    const existing = fields.propertyImages || [];
    const updated = [...existing, ...selectedUrls];
    handleChange('propertyImages', updated);
  };

  const handleAddFloor = () => {
    const currentFloors = fields.bauFloors || [];
    const nextFloorName = getFloorName(currentFloors.length);
    const updated = [
      ...currentFloors,
      {
        floor: nextFloorName,
        rooms: '',
        kitchens: '',
        bathrooms: '',
        sanctionedUsage: 'NA',
        actualUsage: 'Commercial',
      },
    ];
    handleChange('bauFloors', updated);
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
    // 1. Fetch property photographs
    const propImages = fields.propertyImages || [];
    const photoBytesList = await Promise.all(propImages.map(fetchBytes));
    const photos = propImages.map((url, idx) => ({
      bytes: photoBytesList[idx] as Uint8Array,
      label: fields.propertyImageNames?.[idx] || 'Site Picture',
    })).filter(p => p.bytes && p.bytes.length > 0);

    // 2. Fetch Google Satellite maps
    const locImages = fields.locationMapImages || normalizeMapImages(fields.locationMapImage);
    const locBytes = (await Promise.all(locImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // 3. Fetch Mouza maps
    const mouzaImages = fields.mouzaMapImages || normalizeMapImages(fields.mouzaMapImage);
    const mouzaBytes = (await Promise.all(mouzaImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // 4. Fetch Sketch maps
    const sketchImages = fields.sketchMapImages || [];
    const sketchBytes = (await Promise.all(sketchImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // 5. Fetch Cadastral maps
    const cadastralImages = fields.cadastralMapImages || normalizeMapImages(fields.cadastralMapImage);
    const cadastralBytes = (await Promise.all(cadastralImages.map(fetchBytes))).filter((b): b is Uint8Array => b !== null);

    // 6. Render report (Letterhead is automatically defaulted and embedded by base renderer)
    const renderer = new PDFAnnapurnaMicroFinanceRenderer();
    await renderer.init();

    const renderFields: AnnapurnaMicroFinanceReportFields = {
      ...fields,
      addressAsPerSite: fields.propertyAddressSite || fields.addressAsPerSite || '',
      propertyAddressSite: fields.propertyAddressSite || fields.addressAsPerSite || '',
      addressAsPerLegal: fields.propertyAddressLegal || fields.addressAsPerLegal || fields.propertyAddressSite || fields.addressAsPerSite || '',
      propertyAddressLegal: fields.propertyAddressLegal || fields.addressAsPerLegal || fields.propertyAddressSite || fields.addressAsPerSite || '',
      ownerName: fields.ownerName || fields.propertyOwner || '',
      propertyOwner: fields.ownerName || fields.propertyOwner || '',
      landmark: fields.landmark || fields.landmarkNearBy || '',
      landmarkNearBy: fields.landmark || fields.landmarkNearBy || '',
      propertyPincode: fields.propertyPincode || fields.pincode || '',
      pincode: fields.propertyPincode || fields.pincode || '',
      occupiedBy: fields.occupiedBy || fields.propertyOccupiedBy || 'Self',
      propertyOccupiedBy: fields.occupiedBy || fields.propertyOccupiedBy || 'Self',
      propertyType: fields.propertyType || fields.propertyTypeCategory || 'Commercial Building',
      propertyTypeCategory: fields.propertyType || fields.propertyTypeCategory || 'Commercial Building',
      surroundingAreaDevelopment: fields.surroundingAreaDevelopment || fields.developmentSurroundingArea || '',
      developmentSurroundingArea: fields.surroundingAreaDevelopment || fields.developmentSurroundingArea || '',
      distanceFromCorpLimits: fields.distanceFromCorpLimits || fields.distanceFromCorporationLimits || '',
      distanceFromCorporationLimits: fields.distanceFromCorpLimits || fields.distanceFromCorporationLimits || '',
      sewerConnected: fields.sewerConnected || fields.sewerLineConnected || 'NA',
      sewerLineConnected: fields.sewerConnected || fields.sewerLineConnected || 'NA',
      futureDemolitionThreat: fields.futureDemolitionThreat || fields.demolitionThreat || 'NA',
      demolitionThreat: fields.futureDemolitionThreat || fields.demolitionThreat || 'NA',
      landAreaSqft: fields.landAreaSqft || fields.landAreaSite || fields.landAreaDocs || '',
      landAreaSite: fields.landAreaSite || fields.landAreaSqft || fields.landAreaDocs || '',
      landAreaDocs: fields.landAreaDocs || fields.landAreaSqft || fields.landAreaSite || '',
      declarationDate: fields.declarationDate || fields.reportDate || fields.dateOfVisit || '',
    };

    return renderer.generateAnnapurnaReport(renderFields, {
      photos,
      locationMaps: locBytes,
      mouzaMaps: mouzaBytes,
      sketchMaps: sketchBytes,
      cadastralMaps: cadastralBytes,
    });
  };

  const handlePreviewPDF = async () => {
    // Open a blank tab synchronously in the click handler to bypass browser pop-up blockers
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Generating Annapurna Microfinance PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #b8860b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating Annapurna Microfinance PDF Preview...</p>
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
      const bytes = await generatePDFBytes();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = url;
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      if (previewWindow && !previewWindow.closed) previewWindow.close();
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

  // Nav Items (clean titles without numbering)
  const navSections: NavItem[] = [
    { id: 'sec-1', title: 'Application Details' },
    { id: 'sec-2', title: 'Location Details' },
    { id: 'sec-3', title: 'NDMA Parameters' },
    { id: 'sec-4', title: 'Approved Plan Details' },
    { id: 'sec-5', title: 'Technical Details' },
    { id: 'sec-6', title: 'Valuation' },
    { id: 'sec-7', title: 'Additional Checks' },
    { id: 'sec-8', title: 'Declaration' },
    { id: 'sec-9', title: 'Photographs' },
    { id: 'sec-10', title: 'Maps & Documents' },
    { id: 'sec-11', title: 'Annexures' },
  ];

  return (
    <div className="flex gap-6 items-start w-full">
      {/* ── Main Form Column ── */}
      <div className="flex-1 min-w-0 space-y-4">
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
            <Field label="Date of Visit (DD/MM/YYYY)">
              <div className="relative flex items-center">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.dateOfVisit || ''}
                  onChange={e => handleChange('dateOfVisit', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="DD/MM/YYYY"
                />
                {!isReadOnly && (
                  <input
                    type="date"
                    className="absolute right-2 opacity-0 w-8 h-8 cursor-pointer"
                    title="Choose Date"
                    onChange={e => {
                      if (e.target.value) {
                        handleChange('dateOfVisit', formatReportDate(e.target.value));
                      }
                    }}
                  />
                )}
              </div>
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

        {/* ════ SECTION 2: LOCATION DETAILS & SCHEDULE OF PROPERTY ════ */}
        <Section title="Location Details & Schedule of the Property" number={2} id="sec-2" defaultOpen={true}>
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
            <Field label="Type of the Property (Flat/Independent House/Commercial Building/Commercial Unit/Industrial/Vacant Plot/Agricultural/Homestead)">
              <select className={selectCls} value={fields.propertyType || 'Commercial Building'} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly}>
                <option value="Commercial Building">Commercial Building</option>
                <option value="Flat">Flat</option>
                <option value="Independent House">Independent House</option>
                <option value="Commercial Unit">Commercial Unit</option>
                <option value="Industrial">Industrial</option>
                <option value="Vacant Plot">Vacant Plot</option>
                <option value="Agricultural">Agricultural</option>
                <option value="Homestead">Homestead</option>
              </select>
            </Field>
            <Field label="Occupancy Status">
              <select className={selectCls} value={fields.occupancyStatus || 'SORP'} onChange={e => handleChange('occupancyStatus', e.target.value)} disabled={isReadOnly}>
                <option value="SORP">SORP (Self Occupied Residential Property)</option>
                <option value="SOCP">SOCP (Self Occupied Commercial Property)</option>
                <option value="Rented">Rented</option>
                <option value="Vacant">Vacant</option>
              </select>
            </Field>

            {/* Schedule of the Property (Boundaries) Sub-Section */}
            <div className="md:col-span-2 border-t border-slate-200 pt-5 mt-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Schedule of the Property (Boundaries)
              </h3>
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
          </div>
        </Section>

        {/* ════ SECTION 3: NDMA PARAMETERS ════ */}
        <Section title="NDMA Parameters" number={3} id="sec-3" defaultOpen={false}>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Nature of Building/Wing">
              <input className={inputCls} value={fields.natureOfBuilding || 'NA'} onChange={e => handleChange('natureOfBuilding', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Plan Aspect Ratio">
              <input className={inputCls} value={fields.planAspectRatio || 'NA'} onChange={e => handleChange('planAspectRatio', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Structure Type">
              <input className={inputCls} value={fields.structureType || 'NA'} onChange={e => handleChange('structureType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Projected Parts Available">
              <input className={inputCls} value={fields.projectedParts || 'NA'} onChange={e => handleChange('projectedParts', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Type of Masonry">
              <input className={inputCls} value={fields.masonryType || 'NA'} onChange={e => handleChange('masonryType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Expansion Joints Available">
              <input className={inputCls} value={fields.expansionJoints || 'NA'} onChange={e => handleChange('expansionJoints', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Roof Type">
              <input className={inputCls} value={fields.roofType || 'NA'} onChange={e => handleChange('roofType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Steel Grade">
              <input className={inputCls} value={fields.steelGrade || 'NA'} onChange={e => handleChange('steelGrade', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Mortar Type">
              <input className={inputCls} value={fields.mortarType || 'NA'} onChange={e => handleChange('mortarType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Concrete Grade">
              <input className={inputCls} value={fields.concreteGrade || 'NA'} onChange={e => handleChange('concreteGrade', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Environment Exposure">
              <input className={inputCls} value={fields.environmentExposure || 'NA'} onChange={e => handleChange('environmentExposure', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Footing Type">
              <input className={inputCls} value={fields.footingType || 'NA'} onChange={e => handleChange('footingType', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Seismic Zone">
              <input className={inputCls} value={fields.seismicZone || 'NA'} onChange={e => handleChange('seismicZone', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Soil Liquefiable">
              <input className={inputCls} value={fields.soilLiquefiable || 'NA'} onChange={e => handleChange('soilLiquefiable', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Coastal Regulatory Zone">
              <input className={inputCls} value={fields.coastalRegulatoryZone || 'NA'} onChange={e => handleChange('coastalRegulatoryZone', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Soil Slope Vulnerable to Landslide">
              <input className={inputCls} value={fields.soilSlopeVulnerable || 'NA'} onChange={e => handleChange('soilSlopeVulnerable', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Flood Prone Area">
              <input className={inputCls} value={fields.floodProneArea || 'NA'} onChange={e => handleChange('floodProneArea', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Ground Slope More than 20%">
              <input className={inputCls} value={fields.groundSlopeMoreThan20 || 'NA'} onChange={e => handleChange('groundSlopeMoreThan20', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Fire Exit">
              <input className={inputCls} value={fields.fireExit || 'NA'} onChange={e => handleChange('fireExit', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 4: APPROVED PLAN DETAILS ════ */}
        <Section title="Approved Plan Details (if self-construction)" number={4} id="sec-4" defaultOpen={false}>
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
            <Field label="Approved Usages (Residential/Industrial/Commercial/Mixed Usages)">
              <select
                className={selectCls}
                value={fields.approvedUsages || 'NA'}
                onChange={e => handleChange('approvedUsages', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="NA">NA</option>
                <option value="Residential">Residential</option>
                <option value="Industrial">Industrial</option>
                <option value="Commercial">Commercial</option>
                <option value="Mixed Usages">Mixed Usages</option>
              </select>
            </Field>
            <Field label="Number of Floors in Building">
              <input className={inputCls} value={fields.numberOfFloorsInBuilding || 'NA'} onChange={e => handleChange('numberOfFloorsInBuilding', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 5: TECHNICAL DETAILS ════ */}
        <Section title="Technical Details & Area Statements" number={5} id="sec-5" defaultOpen={false}>
          <div className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Current Occupant of Property (Owner/Tenant/Vacant)">
                <select
                  className={selectCls}
                  value={fields.currentOccupant || 'Owner'}
                  onChange={e => handleChange('currentOccupant', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Owner">Owner</option>
                  <option value="Tenant">Tenant</option>
                  <option value="Vacant">Vacant</option>
                  <option value="NA">NA</option>
                </select>
              </Field>
              <Field label="Separate Independent Access (Yes/No)">
                <select
                  className={selectCls}
                  value={fields.separateAccess || 'NA'}
                  onChange={e => handleChange('separateAccess', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="NA">NA</option>
                </select>
              </Field>
              <Field label="Accommodation Details">
                <input className={inputCls} value={fields.accommodationDetails || ''} onChange={e => handleChange('accommodationDetails', e.target.value)} disabled={isReadOnly} placeholder="NA" />
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
                        <input className="w-full p-1 border rounded text-xs font-bold" value={fields.landAreaDocs || ''} onChange={e => handleChange('landAreaDocs', e.target.value)} disabled={isReadOnly} placeholder="NA" />
                      </td>
                      <td className="p-1.5 border-r border-[#dee2e6]">
                        <input className="w-full p-1 border rounded text-xs font-bold" value={fields.landAreaSite || ''} onChange={e => handleChange('landAreaSite', e.target.value)} disabled={isReadOnly} placeholder="NA" />
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
                    onClick={handleAddFloor}
                    className="text-xs font-bold text-[#b8860b] hover:underline cursor-pointer"
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
                      <th className="p-2 text-center border-r border-[#dee2e6]">Rooms</th>
                      <th className="p-2 text-center border-r border-[#dee2e6]">Kitchens</th>
                      <th className="p-2 text-center border-r border-[#dee2e6]">Bathrooms</th>
                      <th className="p-2 text-left border-r border-[#dee2e6]">Sanctioned Usage</th>
                      <th className="p-2 text-left">Actual Usage</th>
                      {!isReadOnly && <th className="p-2 text-center w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#dee2e6]">
                    {(fields.bauFloors || []).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-1.5 border-r border-[#dee2e6] min-w-[140px]">
                          <input
                            className={inputCls + ' !py-1.5 text-xs font-bold text-[#0f2038]'}
                            value={row.floor}
                            onChange={e => {
                              const updated = [...(fields.bauFloors || [])];
                              updated[idx] = { ...updated[idx], floor: e.target.value };
                              handleChange('bauFloors', updated);
                            }}
                            disabled={isReadOnly}
                            placeholder="e.g. Ground Floor"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#dee2e6] w-24">
                          <input
                            className={inputCls + ' !py-1.5 text-xs text-center'}
                            value={row.rooms}
                            onChange={e => {
                              const updated = [...(fields.bauFloors || [])];
                              updated[idx] = { ...updated[idx], rooms: e.target.value };
                              handleChange('bauFloors', updated);
                            }}
                            disabled={isReadOnly}
                            placeholder="NA"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#dee2e6] w-24">
                          <input
                            className={inputCls + ' !py-1.5 text-xs text-center'}
                            value={row.kitchens}
                            onChange={e => {
                              const updated = [...(fields.bauFloors || [])];
                              updated[idx] = { ...updated[idx], kitchens: e.target.value };
                              handleChange('bauFloors', updated);
                            }}
                            disabled={isReadOnly}
                            placeholder="NA"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#dee2e6] w-24">
                          <input
                            className={inputCls + ' !py-1.5 text-xs text-center'}
                            value={row.bathrooms}
                            onChange={e => {
                              const updated = [...(fields.bauFloors || [])];
                              updated[idx] = { ...updated[idx], bathrooms: e.target.value };
                              handleChange('bauFloors', updated);
                            }}
                            disabled={isReadOnly}
                            placeholder="NA"
                          />
                        </td>
                        <td className="p-1.5 border-r border-[#dee2e6] min-w-[130px]">
                          <input
                            className={inputCls + ' !py-1.5 text-xs'}
                            value={row.sanctionedUsage}
                            onChange={e => {
                              const updated = [...(fields.bauFloors || [])];
                              updated[idx] = { ...updated[idx], sanctionedUsage: e.target.value };
                              handleChange('bauFloors', updated);
                            }}
                            disabled={isReadOnly}
                            placeholder="NA"
                          />
                        </td>
                        <td className="p-1.5 min-w-[140px]">
                          <select
                            className={selectCls + ' !py-1.5 text-xs'}
                            value={row.actualUsage || 'Residential'}
                            onChange={e => {
                              const updated = [...(fields.bauFloors || [])];
                              updated[idx] = { ...updated[idx], actualUsage: e.target.value };
                              handleChange('bauFloors', updated);
                            }}
                            disabled={isReadOnly}
                          >
                            <option value="Residential">Residential</option>
                            <option value="Industrial">Industrial</option>
                            <option value="Commercial">Commercial</option>
                            <option value="Mixed Usage">Mixed Usage</option>
                            <option value="NA">NA</option>
                          </select>
                        </td>
                        {!isReadOnly && (
                          <td className="p-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (fields.bauFloors || []).filter((_, i) => i !== idx);
                                handleChange('bauFloors', updated);
                              }}
                              className="w-6 h-6 flex items-center justify-center rounded-full text-red-500 hover:bg-red-50 hover:text-red-700 font-bold transition-colors cursor-pointer"
                              title="Delete floor row"
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

            {/* Items Container */}
            <div className="p-4 border border-[#dee2e6] rounded-2xl bg-slate-50/70 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                Items
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="Permissible Area as per Plan (Sq.Ft)">
                  <input className={inputCls} value={fields.permissibleAreaPlan || 'NA'} onChange={e => handleChange('permissibleAreaPlan', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Land Component (Sq.Ft)">
                  <input className={inputCls} value={fields.landComponent || 'NA'} onChange={e => handleChange('landComponent', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Permissible FSI">
                  <input className={inputCls} value={fields.permissibleFsi || 'NA'} onChange={e => handleChange('permissibleFsi', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Actual Construction (BUA) (Sq.Ft)">
                  <input className={inputCls} value={fields.actualConstructionBua || 'NA'} onChange={e => handleChange('actualConstructionBua', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Consider Construction (BUA) (Sq.Ft)">
                  <input className={inputCls} value={fields.considerConstructionBua || 'NA'} onChange={e => handleChange('considerConstructionBua', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>

            {/* Risk of Demolition */}
            <div className="grid md:grid-cols-3 gap-4 pt-1">
              <Field label="Risk of Demolition">
                <select className={selectCls} value={fields.riskOfDemolition || 'LOW'} onChange={e => handleChange('riskOfDemolition', e.target.value)} disabled={isReadOnly}>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </Field>
            </div>

            {/* Status of the Property Container (Heading = Column 1, Sub-parts = Columns 2, 3, 4) */}
            <div className="p-4 border border-[#dee2e6] rounded-2xl bg-slate-50/70 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Status of the Property (Plot/ Under Construction/ Completed/ Construction on Hold)
              </h4>
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="COMPLETED (Y/N)">
                  <input
                    className={inputCls}
                    value={fields.propertyStatus !== undefined ? fields.propertyStatus : 'COMPLETED'}
                    onChange={e => handleChange('propertyStatus', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. COMPLETED or NA"
                  />
                </Field>
                <Field label="100% Completed">
                  <input
                    className={inputCls}
                    value={fields.completedPct !== undefined ? fields.completedPct : '100%'}
                    onChange={e => handleChange('completedPct', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 100% or NA"
                  />
                </Field>
                <Field label="100% Recommended">
                  <input
                    className={inputCls}
                    value={fields.recommendedPct !== undefined ? fields.recommendedPct : '100%'}
                    onChange={e => handleChange('recommendedPct', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 100% or NA"
                  />
                </Field>
              </div>
            </div>

            {/* Property Age Metrics */}
            <div className="grid md:grid-cols-2 gap-4 pt-1">
              <Field label="Current Age of Property">
                <input className={inputCls} value={fields.currentAge || ''} onChange={e => handleChange('currentAge', e.target.value)} disabled={isReadOnly} placeholder="e.g. 7-Years" />
              </Field>
              <Field label="Residual Age of Property">
                <input className={inputCls} value={fields.residualAge || ''} onChange={e => handleChange('residualAge', e.target.value)} disabled={isReadOnly} placeholder="e.g. 53-Years" />
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 6: VALUATION ════ */}
        <Section title="Valuation" number={6} id="sec-6" defaultOpen={true}>
          <div className="space-y-6">
            {/* Tabular Valuation Table matching PDF template */}
            <div className="overflow-x-auto border border-[#dee2e6] rounded-2xl overflow-hidden bg-white shadow-xs">
              <table className="w-full text-xs">
                <thead className="bg-[#1a3a5c] text-white font-bold">
                  <tr>
                    <th className="p-3 text-left w-[32%] border-r border-[#2a4d70]">Items</th>
                    <th className="p-3 text-center w-[22%] border-r border-[#2a4d70]">Area Details in Sq. Ft.</th>
                    <th className="p-3 text-center w-[22%] border-r border-[#2a4d70]">Rate per Sq. Ft.</th>
                    <th className="p-3 text-center w-[24%]">Total Values in Rupees</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#dee2e6]">
                  {/* Row 1: Land Value */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-800 bg-slate-50/60 border-r border-[#dee2e6]">
                      Land Value
                    </td>
                    <td className="p-2 border-r border-[#dee2e6]">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          className="w-full p-1.5 border border-slate-300 rounded text-xs text-center font-bold"
                          value={fields.landAreaSqft || ''}
                          onChange={e => handleChange('landAreaSqft', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">SQFT</span>
                      </div>
                    </td>
                    <td className="p-2 border-r border-[#dee2e6]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">Rs.</span>
                        <input
                          type="text"
                          className="w-full p-1.5 border border-slate-300 rounded text-xs text-center font-bold"
                          value={fields.landRateSqft || ''}
                          onChange={e => handleChange('landRateSqft', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">/-</span>
                      </div>
                    </td>
                    <td className="p-2 text-center font-extrabold text-blue-900 bg-blue-50/30">
                      {fields.landTotalValue ? `Rs. ${formatIndianCurrency(parseNum(fields.landTotalValue))}/-` : 'Rs. 0/-'}
                    </td>
                  </tr>

                  {/* Row 2: BUA Value RCC GF */}
                  <tr className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-bold text-slate-800 bg-slate-50/60 border-r border-[#dee2e6]">
                      BUA Value RCC GF
                    </td>
                    <td className="p-2 border-r border-[#dee2e6]">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          className="w-full p-1.5 border border-slate-300 rounded text-xs text-center font-bold"
                          value={fields.buaAreaSqft || ''}
                          onChange={e => handleChange('buaAreaSqft', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">SQFT</span>
                      </div>
                    </td>
                    <td className="p-2 border-r border-[#dee2e6]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">Rs.</span>
                        <input
                          type="text"
                          className="w-full p-1.5 border border-slate-300 rounded text-xs text-center font-bold"
                          value={fields.buaRateSqft || ''}
                          onChange={e => handleChange('buaRateSqft', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">/-</span>
                      </div>
                    </td>
                    <td className="p-2 text-center font-extrabold text-blue-900 bg-blue-50/30">
                      {fields.buaTotalValue ? `Rs. ${formatIndianCurrency(parseNum(fields.buaTotalValue))}/-` : 'Rs. 0/-'}
                    </td>
                  </tr>

                  {/* Row 3: Market Value After Completion */}
                  <tr className="bg-emerald-50/40">
                    <td colSpan={3} className="p-2.5 font-extrabold text-slate-800 border-r border-[#dee2e6]">
                      Market Value After Completion <span className="text-red-500 font-semibold">(In Rs.)</span>
                    </td>
                    <td className="p-2 text-center font-black text-emerald-800 text-sm">
                      {fields.marketValue ? `Rs. ${formatIndianCurrency(parseNum(fields.marketValue))}/-` : 'Rs. 0/-'}
                    </td>
                  </tr>

                  {/* Row 4: Distressed/Force Value */}
                  <tr className="bg-amber-50/40">
                    <td colSpan={3} className="p-2.5 border-r border-[#dee2e6]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-extrabold text-slate-800">
                          Distressed/Force Value ({fields.distressedPct !== undefined && fields.distressedPct !== '' ? fields.distressedPct : '0'}%) <span className="text-red-500 font-semibold">(In Rs.)</span>
                        </span>
                        {!isReadOnly && (
                          <div className="flex items-center gap-1 text-[11px] font-normal text-slate-500">
                            <span>Distress:</span>
                            <input
                              type="text"
                              className="w-14 p-1 border border-amber-300 rounded text-xs text-center font-bold bg-white"
                              value={fields.distressedPct !== undefined ? fields.distressedPct : '0'}
                              onChange={e => handleChange('distressedPct', e.target.value)}
                              placeholder="0"
                            />
                            <span>%</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-2 text-center font-black text-amber-900 text-sm">
                      {fields.distressedValue && parseNum(fields.distressedValue) > 0 ? `Rs. ${formatIndianCurrency(parseNum(fields.distressedValue))}/-` : 'Rs. 0/-'}
                    </td>
                  </tr>

                  {/* Row 5: Government/Circle Rate Value */}
                  <tr className="hover:bg-slate-50/70">
                    <td colSpan={3} className="p-2.5 font-bold text-slate-800 border-r border-[#dee2e6]">
                      Government/Circle Rate Value
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">Rs.</span>
                        <input
                          type="text"
                          className="w-24 p-1.5 border border-slate-300 rounded text-xs text-center font-bold"
                          value={fields.govtRate || ''}
                          onChange={e => handleChange('govtRate', e.target.value)}
                          disabled={isReadOnly}
                          placeholder="NA"
                        />
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">/- PER SQFT</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
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

        {/* ════ SECTION 7: ADDITIONAL CHECKS ════ */}
        <Section title="Additional Checks of Properties" number={7} id="sec-7" defaultOpen={false}>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Approach Road to Property">
              <select className={selectCls} value={fields.approachRoadType || 'SINGLE LANE'} onChange={e => handleChange('approachRoadType', e.target.value)} disabled={isReadOnly}>
                <option value="SINGLE LANE">SINGLE LANE</option>
                <option value="DOUBLE LANE">DOUBLE LANE</option>
                <option value="FOUR LANE">FOUR LANE</option>
              </select>
            </Field>
            <Field label="Development of Surrounding Area">
              <input className={inputCls} value={fields.surroundingAreaDevelopment || ''} onChange={e => handleChange('surroundingAreaDevelopment', e.target.value)} disabled={isReadOnly} placeholder="e.g. SURROUNDING 30%-40% DEVELOPING" />
            </Field>
            <Field label="Distance from City Centre in Kms">
              <input className={inputCls} value={fields.distanceFromCityCentre || ''} onChange={e => handleChange('distanceFromCityCentre', e.target.value)} disabled={isReadOnly} placeholder="e.g. 50 KMS" />
            </Field>
            <Field label="Distance from Corporation Limits in Kms">
              <input className={inputCls} value={fields.distanceFromCorpLimits || ''} onChange={e => handleChange('distanceFromCorpLimits', e.target.value)} disabled={isReadOnly} placeholder="e.g. 5 KMS" />
            </Field>
            <Field label="Electricity (Available/Notavailable)">
              <select className={selectCls} value={fields.electricity || 'NA'} onChange={e => handleChange('electricity', e.target.value)} disabled={isReadOnly}>
                <option value="NA">NA</option>
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
              </select>
            </Field>
            <Field label="Electricity Distributor (Govt./Semi-Govt./Private)">
              <select className={selectCls} value={fields.electricityDistributor || 'NA'} onChange={e => handleChange('electricityDistributor', e.target.value)} disabled={isReadOnly}>
                <option value="NA">NA</option>
                <option value="Govt.">Govt.</option>
                <option value="Semi-Govt.">Semi-Govt.</option>
                <option value="Private">Private</option>
              </select>
            </Field>
            <Field label="Water supply (Available/Not Available)">
              <select className={selectCls} value={fields.waterSupply || 'NA'} onChange={e => handleChange('waterSupply', e.target.value)} disabled={isReadOnly}>
                <option value="NA">NA</option>
                <option value="Available">Available</option>
                <option value="Not Available">Not Available</option>
              </select>
            </Field>
            <Field label="Water Distributor (Govt./Self/Boringwater)">
              <select className={selectCls} value={fields.waterDistributor || 'NA'} onChange={e => handleChange('waterDistributor', e.target.value)} disabled={isReadOnly}>
                <option value="NA">NA</option>
                <option value="Govt.">Govt.</option>
                <option value="Self">Self</option>
                <option value="Boring water">Boring water</option>
              </select>
            </Field>
            <Field label="Sewer provision (Yes/No)">
              <select className={selectCls} value={fields.sewerProvision || 'NA'} onChange={e => handleChange('sewerProvision', e.target.value)} disabled={isReadOnly}>
                <option value="NA">NA</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Sewer line connected to main sewer (Yes/No)">
              <select className={selectCls} value={fields.sewerConnected || 'NA'} onChange={e => handleChange('sewerConnected', e.target.value)} disabled={isReadOnly}>
                <option value="NA">NA</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="Any demolition threat in future development/expansion (Yes/No)">
              <select className={selectCls} value={fields.futureDemolitionThreat || 'NA'} onChange={e => handleChange('futureDemolitionThreat', e.target.value)} disabled={isReadOnly}>
                <option value="NA">NA</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* ════ SECTION 8: DECLARATION ════ */}
        <Section title="Declaration & Sign-Off" number={8} id="sec-8" defaultOpen={false}>
          <div className="space-y-4">
            <div className="p-4 border border-[#dee2e6] rounded-xl bg-slate-50 space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900 mb-1">Declaration Clauses (Included in Final PDF):</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>The final valuation has been concluded on the basis of Land & Building valuation approach and rates are cross-verified with the rates prevalent in the nearby localities.</li>
                <li>We have no direct/indirect interest in the property valued.</li>
                <li>The information furnished in the report is true and correct to the best of my knowledge.</li>
                <li>
                  {fields.visitingEngineer?.includes(' and ') ? '' : (fields.visitingEngineer?.startsWith('Mr.') ? '' : 'Mr. ')}
                  <span className="font-bold">{fields.visitingEngineer || 'Visiting Engineer'}</span> {fields.visitingEngineer?.includes(' and ') ? 'have' : 'has'} visited the property on dated <span className="font-bold">{formatReportDate(fields.dateOfVisit) || '...'}</span> & provided the data as collected during site inspection.
                </li>
                <li>I have not been convicted of any offence and sentenced to a term of Imprisonment.</li>
              </ul>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Field label="Engineer Visited Name">
                <input className={inputCls} value={fields.visitingEngineer || ''} onChange={e => handleChange('visitingEngineer', e.target.value)} disabled={isReadOnly} placeholder="e.g. Mr. Kundan Singh" />
              </Field>
              <Field label="Date">
                <div className="relative flex items-center">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.declarationDate || ''}
                    onChange={e => handleChange('declarationDate', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="DD/MM/YYYY"
                  />
                  {!isReadOnly && (
                    <input
                      type="date"
                      className="absolute right-2 opacity-0 w-8 h-8 cursor-pointer"
                      title="Choose Date"
                      onChange={e => {
                        if (e.target.value) {
                          handleChange('declarationDate', formatReportDate(e.target.value));
                        }
                      }}
                    />
                  )}
                </div>
              </Field>
              <Field label="Place">
                <input className={inputCls} value={fields.place || 'Bhubaneswar'} onChange={e => handleChange('place', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </Section>

        {/* ════ SECTION 9: PHOTOGRAPHS OF THE PROPERTY ════ */}
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
          onOpenBucketPicker={() => setBucketPickerOpen(true)}
          sectionNumber={9}
          sectionId="sec-9"
        />

        {/* ════ SECTION 10: MAPS & DOCUMENTS (MULTI-PHOTO) ════ */}
        {/* Strictly in the requested order: Google Satellite Map, Mouza Map, Sketch Map, Cadastral Map */}
        <BaseMapsSection
          locationMapImages={fields.locationMapImages || []}
          mouzaMapImages={fields.mouzaMapImages || []}
          sketchMapImages={fields.sketchMapImages || []}
          cadastralMapImages={fields.cadastralMapImages || []}
          latitude={fields.latitude}
          longitude={fields.longitude}
          propertyAddress={fields.propertyAddressSite || fields.addressAsPerSite || fields.propertyAddressLegal || ''}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Section 2: Location Details & Schedule"
          isReadOnly={isReadOnly}
          uploading={uploading}
          onLocationMapUpload={e => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={idx => handleMapRemove('locationMapImages', idx)}
          onMouzaMapUpload={e => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={idx => handleMapRemove('mouzaMapImages', idx)}
          onSketchMapUpload={e => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={idx => handleMapRemove('sketchMapImages', idx)}
          onCadastralMapUpload={e => handleMapUpload('cadastralMapImages', e)}
          onCadastralMapRemove={idx => handleMapRemove('cadastralMapImages', idx)}
          onReorderLocationMap={newImgs => handleReorderMap('locationMapImages', newImgs)}
          onReorderMouzaMap={newImgs => handleReorderMap('mouzaMapImages', newImgs)}
          onReorderSketchMap={newImgs => handleReorderMap('sketchMapImages', newImgs)}
          onReorderCadastralMap={newImgs => handleReorderMap('cadastralMapImages', newImgs)}
          mapOrder={['location', 'mouza', 'sketch', 'cadastral']}
          sectionNumber={10}
          sectionId="sec-10"
        />

        {/* ════ SECTION 11: ANNEXURES ════ */}
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
          sectionNumber={11}
          sectionId="sec-11"
        />

        {/* ═══ STANDARDIZED ACTION BAR ═══ */}
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

      {/* ── Right Column: Dynamic Floating Navigator ── */}
      <FloatingNavigator sections={navSections} />

      {/* ── Photo Bucket Picker Modal (for Site Photographs) ── */}
      <BasePhotoBucketModal
        isOpen={bucketPickerOpen}
        bucketImages={bucketImages}
        mode="propertyImages"
        onClose={() => setBucketPickerOpen(false)}
        onConfirm={handleBucketConfirm}
      />
    </div>
  );
}
