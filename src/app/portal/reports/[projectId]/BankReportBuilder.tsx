'use client';

import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification, getBucketImages, deleteBucketImage } from '@/app/actions/project';
import { SERVICES_LIST } from './constants';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import { PDFBankRenderer } from '@/lib/pdf-bank-renderer';
import AiAssistPanel from '@/components/AiAssistPanel';
import type { BaseReportFields, BankConfig, FloorRow, AnnexureItem, ExtraFieldConfig } from '@/lib/bank-fields';
import { reorderAndLabelAnnexures } from '@/lib/bank-fields';
import { getFloorName, BasePhotographsSection, BaseAnnexureSection, AnnexureRefSelector } from './banks/BaseBankReportComponents';
import * as XLSX from 'xlsx';

const cleanAddressForMap = (rawAddr: string): string => {
  if (!rawAddr || !rawAddr.trim()) return '';
  let str = rawAddr.trim();
  str = str.replace(/\([^)]*\)/gi, '');
  str = str.replace(/\bAREA-?[^,]+/gi, '');
  str = str.replace(/\bKISSAM:?[^,]+/gi, '');
  str = str.replace(/\b(KHATA|PLOT|SURVEY|STREET|WARD)\s*NO:?[^,]+/gi, '');
  str = str.replace(/^(MR|MRS|DR|MS|M\/S)\.?[^,]+,?\s*/gi, '');
  str = str.replace(/^[A-Z\s.&]+\s*&\s*OTHERS,?\s*/gi, '');
  str = str.replace(/\b(AT\/PO|PS|DIST|THANA|TAHASIL|MOUZA):?\s*/gi, '');
  str = str.replace(/\b\d+([\/\-]\d+)*\b/g, '');
  str = str
    .replace(/["';]/g, '')
    .replace(/\s*,\s*/g, ', ')
    .replace(/(,\s*)+/g, ', ')
    .replace(/^[\s,.-]+|[\s,.-]+$/g, '')
    .trim();
  return str;
};

const UNIT_SQFT_MAP: Record<string, number> = {
  'DEC': 435.6,
  'DECIMAL': 435.6,
  'ACRE': 43560,
  'ACRES': 43560,
  'SQFT': 1,
  'SQ.FT.': 1,
  'SQ FT': 1,
  'SFT': 1,
  'SQMT': 10.7639,
  'SQ.MTR.': 10.7639,
  'SQ.M.': 10.7639,
  'SMT': 10.7639,
  'GUNTHA': 1089,
  'CENT': 435.6,
};

const getSqftFactor = (unitStr: string): number => {
  if (!unitStr) return 435.6;
  const u = unitStr.toUpperCase().trim();
  if (UNIT_SQFT_MAP[u]) return UNIT_SQFT_MAP[u];
  if (u.includes('ACRE')) return 43560;
  if (u.includes('SQFT') || u.includes('SQ.FT') || u.includes('SFT') || u === 'SF') return 1;
  if (u.includes('SQMT') || u.includes('SQ.M') || u.includes('SMT') || u === 'SM') return 10.7639;
  if (u.includes('GUNTHA')) return 1089;
  if (u.includes('CENT')) return 435.6;
  return 435.6;
};

const calculateTotalLandValue = (
  areaStr: string,
  areaUnit: string,
  rateStr: string,
  rateUnit?: string
): number => {
  const areaNum = parseFloat(String(areaStr).replace(/[^0-9.]/g, '')) || 0;
  const rateNum = parseFloat(String(rateStr).replace(/[^0-9.]/g, '')) || 0;
  if (!areaNum || !rateNum) return 0;

  const areaSqft = areaNum * getSqftFactor(areaUnit);
  const rateSqftFactor = getSqftFactor(rateUnit || areaUnit);

  const totalValue = (areaSqft / rateSqftFactor) * rateNum;
  return totalValue >= 100 ? Math.round(totalValue) : Number(totalValue.toFixed(2));
};

const blockNegativeKeys = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (['-', '+', 'e', 'E'].includes(e.key)) {
    e.preventDefault();
  }
};

const sanitizePositiveDecimal = (val: string): string => {
  if (!val) return '';
  let cleaned = val.replace(/[^0-9.]/g, '');
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

const parseNum = (v: any): number => {
  if (typeof v === 'number') return isNaN(v) ? 0 : v;
  if (typeof v === 'string') return parseFloat(v.replace(/,/g, '') || '0') || 0;
  return 0;
};

function computeDepreciation(lifeYears: number, ageYears: number): number {
  if (lifeYears <= 0 || ageYears < 0) return 0;
  return Math.min(Math.round((ageYears / lifeYears) * 100), 90);
}

const DEFAULT_BASE_FIELDS: BaseReportFields = {
  valuationLayout: 'land_building',
  propertyType: 'Residential',
  ownerName: '',
  ownerAddress: '',
  city: '',
  pincode: '',
  landmark: '',
  loanApplicationType: '',
  loanApplicationNo: '',
  documentHolderName: '',
  legalAddress: '',
  legalState: '',
  legalPincode: '',
  dateOfInspection: new Date().toISOString().split('T')[0],
  dateOfValuation: new Date().toISOString().split('T')[0],
  refNo: '',
  bankName: '',
  branchName: '',
  to: '',
  purpose: 'Home Loan',

  wardNo: '',
  vicinity: 'Residential',
  classOfLocality: 'Middle Class',
  approachRoadWidth: '40-20 Feet Road',
  plotDemarcated: 'Yes',
  distanceRailwayStation: '',
  distanceBusStop: '',
  distanceHospital: '',
  railwayStationName: '',
  busStopName: '',
  hospitalName: '',
  propertyIdentification: 'Easy to Identify',
  propertyIdentificationRemarks: '',
  proximityToFacilities: '1-3 Kms',
  landmarkRailway: '',
  landmarkBusStop: '',
  landmarkHospital: '',
  landmarkNearest: '',

  usageType: 'Residential',
  additionalAmenities: 'Not Applicable',
  legalStatus: 'Freehold',

  premisesType: 'Row House',
  occupiedBy: 'Self Occupied',
  isPropertyRented: '',
  rentedOccupants: '',
  propertyTaxation: 'Average',
  boundaryNorth: '',
  boundarySouth: '',
  boundaryEast: '',
  boundaryWest: '',
  buildingBoundaryNorth: '',
  buildingBoundarySouth: '',
  buildingBoundaryEast: '',
  buildingBoundaryWest: '',

  structureType: 'RCC',
  numberOfFloors: '1',
  numberOfWings: '',
  unitsPerFloor: '',
  internalComposition: 'Good',
  numberOfLifts: '',
  ageOfProperty: '',
  ageOfPropertyActual: '',
  estimatedFutureLife: '',
  exteriors: 'Beam & Column Structure',
  qualityOfConstruction: 'Good',
  maintenanceCondition: 'Good',
  commonAreasRemarks: 'Normal',
  otherObservations: '',
  flooringType: 'Tile Flooring',
  roofType: 'RCC Roofing',
  qualityOfFixtures: 'Good Quality Fittings',
  foundation: 'RCC',
  superstructure: 'Brick Masonry',
  doorsWindows: 'Wooden/UPVC',
  plastering: 'Cement Plastering',
  sanitary: 'Standard',
  electrification: 'Concealed',

  constructionApproved: 'Yes',
  approvalDetails: '',
  constructionPermission: '',
  violationsObserved: 'Low',
  conformsToByelaws: '',
  documentsVerified: '',

  floors: [{ id: '1', name: 'Ground', area: '', rate: '', yearBuilt: '', lifeYears: '60', ageYears: '', depreciationPct: '' }],
  floorAreaUnit: 'Sqft',

  landArea: '',
  landAreaUnit: 'Sqft',
  landRatePerUnit: '',
  govtLandRate: '',
  recommendedRateBasis: '',
  buaAsPerApprovals: '',

  marketability: 'Good',
  valuationResult: 'Positive',
  replacementCost: '',
  deviations: '',

  realizablePct: '90',
  distressPct: '80',
  guidelineValue: '',

  demarcation: 'Clear',
  possession: 'With Owner',
  remarks: '',
  representativeName: '',
  representativeFatherName: '',

  propertyImages: [],
  propertyImageNames: [],
  sketchMapImages: [],
  locationMapImage: '',
  latitude: '',
  longitude: '',

  // Annexure
  annexureEnabled: false,
  annexureRef: '',
  annexureRefShowAlso: false,
  legalAnnexureEnabled: false,
  legalAnnexureRef: '',
  legalAnnexureRefShowAlso: false,
  annexures: [],

  localityType: 'Residential',
  khataNo: '',
  plotNo: '',
  mouza: '',
  tahasil: '',
  district: '',
  state: '',
  developmentStatus: 'Developed',
  civicAmenities: [],
  civicAmenitiesOther: '',
  distanceMainRoad: '',
  distanceMainRoadUnit: 'Meters',
  distanceRailway: '',
  distanceRailwayUnit: 'Km',
  nearbyLandmarks: '',
  clientType: 'organisation',
  organisationTemplate: '',
  organisationSubTemplate: '',
  institutionCategory: 'Bank & FIS',
  serviceType: '',
  subjectType: '',
  annexureEnabled: false,
  annexureRef: '',
  annexureRefShowAlso: false,
  legalAnnexureEnabled: false,
  legalAnnexureRef: '',
  legalAnnexureRefShowAlso: false,
  annexures: [],
};

// ─── UI Components ─────────────────────────────────────────────────
function Section({ title, number, id, children, defaultOpen = true }: { title: string; number?: number | string; id?: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const secId = id || (number ? `section-${number}` : undefined);
  return (
    <div id={secId} className="card border border-[#e9ecef] overflow-hidden scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0a1628] to-[#162d4a] text-white hover:from-[#0f1e35] hover:to-[#1e3a5f] transition-all"
      >
        <div className="flex items-center gap-3">
          {number && <span className="w-8 h-8 rounded-lg bg-[#b8860b] flex items-center justify-center text-sm font-bold">{number}</span>}
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <svg className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="p-6 space-y-5">{children}</div>}
    </div>
  );
}

function Field({ label, children, span = 1 }: { label: string; children: React.ReactNode; span?: number }) {
  return (
    <div className={span === 2 ? 'md:col-span-2' : ''}>
      <label className="block text-xs font-semibold text-[#495057] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-lg border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] disabled:bg-[#f1f3f5] disabled:text-[#6c757d]";
const selectCls = inputCls;

const FloatingNavigator = ({ sections }: { sections: { id: string; title: string; special?: boolean }[] }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-10% 0px -80% 0px' }
    );

    sections.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="hidden xl:flex flex-col gap-1 bg-white/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-[#e9ecef] p-2 rounded-2xl w-[160px] sticky top-24 shrink-0 z-40">
      <div className="text-[10px] font-black text-emerald-500 mb-1 px-2 uppercase tracking-widest">Sections</div>
      {sections.map((sec) => {
        const isActive = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            className={`w-full py-1.5 px-3 rounded-full text-center transition-all duration-200 text-xs font-bold my-0.5 ${
              isActive
                ? 'bg-[#b8860b] text-white border border-[#96700a] shadow-md font-extrabold scale-[1.02]'
                : 'bg-indigo-50/90 text-indigo-900 border border-indigo-100/80 shadow-sm hover:bg-indigo-100 hover:border-indigo-200'
            }`}
          >
            <span className="leading-tight truncate block w-full">
              {sec.title}
            </span>
          </button>
        );
      })}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────
export interface BucketImageItem {
  id: string;
  url: string;
  fileName: string;
  size: number;
  createdAt: string;
  employee: { name: string; employeeId: string };
}

export interface BankReportBuilderProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole?: string;
  bucketImages?: BucketImageItem[];
  prefill?: {
    ownerName?: string;
    ownerAddress?: string;
    propertyAddress?: string;
    propertyType?: string;
    purpose?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
  config?: BankConfig;
  onResetWizard?: () => void;
}

export default function BankReportBuilder({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole = 'REPORT_EMPLOYEE',
  bucketImages = [],
  prefill,
  config,
  onResetWizard,
}: BankReportBuilderProps) {
  const mappedServiceId = prefill?.propertyType
    ? SERVICES_LIST.find(s => s.title.toLowerCase() === prefill.propertyType?.toLowerCase())?.id
    : undefined;

  const initialServiceType = initialFields?.serviceType;
  const isValidServiceType = initialServiceType && SERVICES_LIST.some(s => s.id === initialServiceType);

  const finalServiceType = isValidServiceType
    ? initialServiceType
    : (mappedServiceId || DEFAULT_BASE_FIELDS.serviceType);

  const finalSubjectType = initialFields?.subjectType || prefill?.purpose || DEFAULT_BASE_FIELDS.subjectType;
  const finalValuationLayout = initialFields?.valuationLayout ||
    (/apartment|flat/i.test(finalSubjectType || '') ? 'apartment' : 'land_building');

  const defaultBank = config?.bankId || initialFields?.bankName || initialFields?.organisationTemplate || '';
  const defaultSub = config?.subTemplateId || initialFields?.organisationSubTemplate || '';

  const merged: BaseReportFields = {
    ...DEFAULT_BASE_FIELDS,
    ...(config?.defaultValues || {}),
    ...(typeof initialFields === 'object' && initialFields !== null ? initialFields : {}),
    refNo: initialFields?.refNo || projectCode || DEFAULT_BASE_FIELDS.refNo,
    to: initialFields?.to || (defaultBank ? (defaultSub ? `${defaultBank} - ${defaultSub}` : defaultBank) : DEFAULT_BASE_FIELDS.to),
    city: initialFields?.city || DEFAULT_BASE_FIELDS.city,
    pincode: initialFields?.pincode || DEFAULT_BASE_FIELDS.pincode,
    serviceType: finalServiceType,
    subjectType: finalSubjectType,
    ownerName: initialFields?.ownerName || prefill?.contactName || DEFAULT_BASE_FIELDS.ownerName,
    ownerAddress: initialFields?.ownerAddress || prefill?.propertyAddress || DEFAULT_BASE_FIELDS.ownerAddress,
    bankName: initialFields?.bankName || defaultBank,
    organisationTemplate: initialFields?.organisationTemplate || defaultBank,
    organisationSubTemplate: initialFields?.organisationSubTemplate || defaultSub,
    clientType: 'organisation',
    institutionCategory: initialFields?.institutionCategory || 'Bank & FIS',
    propertyImages: Array.isArray(initialFields?.propertyImages) ? initialFields.propertyImages : (typeof initialFields?.propertyImages === 'string' && initialFields.propertyImages ? [initialFields.propertyImages] : DEFAULT_BASE_FIELDS.propertyImages),
    propertyImageNames: Array.isArray(initialFields?.propertyImageNames) ? initialFields.propertyImageNames : DEFAULT_BASE_FIELDS.propertyImageNames,
    sketchMapImages: Array.isArray(initialFields?.sketchMapImages) 
      ? initialFields.sketchMapImages 
      : (typeof initialFields?.sketchMapImage === 'string' && initialFields.sketchMapImage ? [initialFields.sketchMapImage] : DEFAULT_BASE_FIELDS.sketchMapImages),
    civicAmenities: Array.isArray(initialFields?.civicAmenities) ? initialFields.civicAmenities : DEFAULT_BASE_FIELDS.civicAmenities,
    ageOfPropertyActual: typeof initialFields?.ageOfPropertyActual === 'string' ? initialFields.ageOfPropertyActual : DEFAULT_BASE_FIELDS.ageOfPropertyActual,
    valuationLayout: finalValuationLayout,
  };

  if (!Array.isArray(merged.floors) || merged.floors.length === 0) {
    merged.floors = DEFAULT_BASE_FIELDS.floors;
  }

  const [fields, setFields] = useState<BaseReportFields>(merged);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Bucket Picker State
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [bucketPickerMode, setBucketPickerMode] = useState<'propertyImages' | 'sketchMapImages' | 'locationMapImage'>('propertyImages');
  const [bucketSelected, setBucketSelected] = useState<Set<string>>(new Set());
  const [localBucketImages, setLocalBucketImages] = useState<any[]>(bucketImages);

  const handleDeleteBucketImage = async (img: any) => {
    if (!confirm('Delete this photo from the bucket?')) return;
    try {
      await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .remove([img.storagePath]);

      const res = await deleteBucketImage(img.id);
      if (res.error) {
        alert(res.error);
      } else {
        setLocalBucketImages(prev => prev.filter(i => i.id !== img.id));
        setBucketSelected(prev => {
          const next = new Set(prev);
          next.delete(img.id);
          return next;
        });
      }
    } catch (e) {
      console.error('Delete error:', e);
      alert('Failed to delete photo.');
    }
  };

  const openBucketPicker = async (mode: 'propertyImages' | 'sketchMapImages' | 'locationMapImage') => {
    setBucketPickerMode(mode);
    setBucketSelected(new Set());
    setBucketPickerOpen(true);
    try {
      const res = await getBucketImages(projectId);
      if (res.images) {
        setLocalBucketImages(res.images.map((img: any) => ({
          ...img,
          createdAt: img.createdAt instanceof Date ? img.createdAt.toISOString() : String(img.createdAt)
        })));
      }
    } catch (e) {
      console.error('Bucket fetch error:', e);
    }
  };

  const handleBucketConfirm = () => {
    const selectedImages = localBucketImages.filter(img => bucketSelected.has(img.id));
    if (selectedImages.length === 0) { setBucketPickerOpen(false); return; }

    if (bucketPickerMode === 'propertyImages') {
      const newUrls = [...(fields.propertyImages || []), ...selectedImages.map(img => img.url)];
      handleChange('propertyImages', newUrls);
    } else if (bucketPickerMode === 'sketchMapImages') {
      const newUrls = [...(fields.sketchMapImages || []), ...selectedImages.map(img => img.url)];
      handleChange('sketchMapImages', newUrls);
    } else if (bucketPickerMode === 'locationMapImage') {
      handleChange('locationMapImage', selectedImages[0].url);
    }

    setBucketPickerOpen(false);
    setBucketSelected(new Set());
    setMessage({ type: 'success', text: `${selectedImages.length} photo${selectedImages.length > 1 ? 's' : ''} added from bucket!` });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleBucketImage = (id: string) => {
    setBucketSelected(prev => {
      const next = new Set(prev);
      if (bucketPickerMode !== 'propertyImages' && bucketPickerMode !== 'sketchMapImages') {
        next.clear();
        next.add(id);
      } else {
        if (next.has(id)) next.delete(id); else next.add(id);
      }
      return next;
    });
  };

  const PREDEFINED_AMENITIES = [
    "Garden",
    "Swimming Pool",
    "Gymnasium",
    "Club House",
    "Children's Play Area",
    "Community Hall",
    "Power Backup"
  ];

  const [isOtherChecked, setIsOtherChecked] = useState(false);
  const [otherText, setOtherText] = useState('');

  useEffect(() => {
    const val = initialFields?.additionalAmenities || merged.additionalAmenities || '';
    if (typeof val === 'string' && val && val !== 'Not Applicable' && val !== 'N/A') {
      const selected = val.split(', ').map(s => s.trim()).filter(Boolean);
      const hasOther = selected.some(item => !PREDEFINED_AMENITIES.includes(item));
      setIsOtherChecked(hasOther);
      const others = selected.filter(item => !PREDEFINED_AMENITIES.includes(item));
      setOtherText(others.join(', '));
    } else {
      setIsOtherChecked(false);
      setOtherText('');
    }
  }, [projectId]);

  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const bypassUnloadRef = useRef(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkComment, setReworkComment] = useState('');
  const isInitialMount = useRef(true);
  const debouncedSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (isReadOnly) return;

    setAutoSaveStatus('saving');

    if (debouncedSaveTimer.current) {
      clearTimeout(debouncedSaveTimer.current);
    }

    debouncedSaveTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res?.error) {
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
      if (debouncedSaveTimer.current) {
        clearTimeout(debouncedSaveTimer.current);
      }
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypassUnloadRef.current || isReadOnly) return;
      saveReportDraft(projectId, fields).catch(e => console.error(e));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  const reportRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleReset = async () => {
    if (confirm("Are you sure you want to change report parameters? This will permanently clear all your typed data and reset the report.")) {
      if (onResetWizard) {
        onResetWizard();
      }
    }
  };

  const handleChange = useCallback((field: string, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
  }, []);

  const getFullAddress = useCallback(() => {
    const parts = [
      fields.ownerAddress,
      fields.state,
      fields.pincode ? `PIN: ${fields.pincode}` : ''
    ].filter(Boolean);
    return parts.join(', ');
  }, [fields.ownerAddress, fields.state, fields.pincode]);

  const getLegalFullAddress = useCallback(() => {
    const parts = [
      fields.legalAddress,
      fields.legalState,
      fields.legalPincode ? `PIN: ${fields.legalPincode}` : ''
    ].filter(Boolean);
    return parts.join(', ');
  }, [fields.legalAddress, fields.legalState, fields.legalPincode]);

  // ── Floor helpers ──
  const addFloor = () => {
    handleChange('floors', [...fields.floors, {
      id: String(Date.now()), name: getFloorName(fields.floors.length), area: '', rate: '',
      yearBuilt: '', lifeYears: '60', ageYears: '', depreciationPct: '',
    }]);
  };
  const removeFloor = (id: string) => {
    if (fields.floors.length <= 1) return;
    handleChange('floors', fields.floors.filter(f => f.id !== id));
  };
  const updateFloor = (id: string, key: keyof FloorRow, value: string) => {
    handleChange('floors', fields.floors.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  // ── Annexure helpers (Strictly ordered: 1. Technical, 2. Legal, 3+. Custom) ──
  const addAnnexure = () => {
    const newAnnexure: AnnexureItem = {
      id: String(Date.now()),
      label: 'A',
      title: '',
      excelFileUrl: '',
      excelFileName: '',
    };
    const updated = [...fields.annexures, newAnnexure];
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
    const remaining = fields.annexures.filter(a => a.id !== id);
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
    handleChange('annexures', fields.annexures.map(a => a.id === id ? { ...a, title } : a));
  };
  const handleAnnexureUpload = async (annexureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUploadError('File exceeds 10MB limit.'); return; }

    setUploading(true);
    setUploadError(null);

    let parsedData: AnnexureItem['parsedData'] | undefined;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const ref = ws['!ref'];
      if (ref) {
        const range = XLSX.utils.decode_range(ref);
        let rawAllRows: string[][] = [];
        for (let r = range.s.r; r <= range.e.r; r++) {
          const row: string[] = [];
          for (let c = range.s.c; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[addr];
            row.push(cell ? String(XLSX.utils.format_cell(cell)) : '');
          }
          rawAllRows.push(row);
        }
        const rawMerges = ((ws['!merges'] || []) as any[]).map((m: any) => ({
          sr: m.s.r - range.s.r, sc: m.s.c - range.s.c,
          er: m.e.r - range.s.r, ec: m.e.c - range.s.c,
        }));
        const wsCols: any[] = ws['!cols'] || [];
        const numCols = range.e.c - range.s.c + 1;
        const rawW: number[] = [];
        for (let c = 0; c < numCols; c++) {
          const col = wsCols[range.s.c + c];
          rawW.push(col?.wpx || (col?.wch ? col.wch * 7 : 0) || 64);
        }

        let minCol = 0;
        while (minCol < numCols) {
          if (!rawAllRows.every(row => !row[minCol] || row[minCol].trim() === '')) break;
          minCol++;
        }
        let maxCol = numCols - 1;
        while (maxCol >= minCol) {
          if (!rawAllRows.every(row => !row[maxCol] || row[maxCol].trim() === '')) break;
          maxCol--;
        }
        let minRow = 0;
        while (minRow < rawAllRows.length) {
          if (!rawAllRows[minRow].every(cell => !cell || cell.trim() === '')) break;
          minRow++;
        }
        let maxRow = rawAllRows.length - 1;
        while (maxRow >= minRow) {
          if (!rawAllRows[maxRow].every(cell => !cell || cell.trim() === '')) break;
          maxRow--;
        }

        if (minCol <= maxCol && minRow <= maxRow) {
          const allRows = rawAllRows.slice(minRow, maxRow + 1).map(row => row.slice(minCol, maxCol + 1));
          const trimmedRawW = rawW.slice(minCol, maxCol + 1);
          const totalW = trimmedRawW.reduce((s, w) => s + w, 0) || (maxCol - minCol + 1) * 64;
          const colWidths = trimmedRawW.map(w => w / totalW);

          const newNumRows = maxRow - minRow + 1;
          const newNumCols = maxCol - minCol + 1;
          const merges: { sr: number; sc: number; er: number; ec: number }[] = [];

          for (const m of rawMerges) {
            const sr = m.sr - minRow;
            const er = m.er - minRow;
            const sc = m.sc - minCol;
            const ec = m.ec - minCol;
            if (er < 0 || sr >= newNumRows || ec < 0 || sc >= newNumCols) continue;
            merges.push({
              sr: Math.max(0, sr),
              sc: Math.max(0, sc),
              er: Math.min(newNumRows - 1, er),
              ec: Math.min(newNumCols - 1, ec),
            });
          }

          for (let r = 0; r < allRows.length; r++) {
            const row = allRows[r];
            const nonEmpties = row.map((cell, c) => ({ cell: cell.trim(), c })).filter(item => item.cell !== '');
            if (nonEmpties.length === 1 && newNumCols > 1) {
              const firstCol = nonEmpties[0].c;
              const existing = merges.find(m => m.sr === r && m.sc === firstCol);
              if (!existing) {
                merges.push({ sr: r, sc: firstCol, er: r, ec: newNumCols - 1 });
              }
            }
          }

          parsedData = {
            headers: allRows[0]?.map(h => String(h)) || [],
            rows: allRows.slice(1).map(row => row.map(c => String(c))),
            allRows,
            merges,
            colWidths,
          };
        }
      }
    } catch (parseErr) {
      console.warn('Could not parse Excel/CSV file:', parseErr);
    }

    const ext = file.name.split('.').pop();
    const fileName = `annexure-${annexureId}-${Date.now()}.${ext}`;
    const filePath = `annexures/${projectId}/${fileName}`;

    const { error } = await supabaseBrowser.storage
      .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
      .upload(filePath, file);

    if (error) {
      setUploadError(`Upload failed: ${error.message}`);
    } else {
      const { data } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);
      handleChange('annexures', fields.annexures.map(a =>
        a.id === annexureId ? { ...a, excelFileUrl: data.publicUrl, excelFileName: file.name, parsedData } : a
      ));
    }
    setUploading(false);
  };
  const removeAnnexureFile = (annexureId: string) => {
    handleChange('annexures', fields.annexures.map(a =>
      a.id === annexureId ? { ...a, excelFileUrl: '', excelFileName: '', parsedData: undefined } : a
    ));
  };

  // ── AI Assist handlers ──
  const handleAiAcceptSuggestion = useCallback((fieldKey: string, value: string) => {
    handleChange(fieldKey, value);
  }, [handleChange]);

  const handleAiAcceptFloorSuggestion = useCallback((floorId: string, fieldName: string, value: string) => {
    handleChange('floors', fields.floors.map(f => f.id === floorId ? { ...f, [fieldName]: value } : f));
  }, [handleChange, fields.floors]);

  const handleAiAcceptAll = useCallback((suggestions: Record<string, Suggestion>) => {
    setFields(prev => {
      const updated = { ...prev };
      const floorUpdates: Record<string, Record<string, string>> = {};

      for (const [key, suggestion] of Object.entries(suggestions)) {
        const floorMatch = key.match(/^floor_(.+)_(rate|lifeYears|depreciationPct|ageYears)$/);
        if (floorMatch) {
          const [, floorId, fieldName] = floorMatch;
          if (!floorUpdates[floorId]) floorUpdates[floorId] = {};
          floorUpdates[floorId][fieldName] = suggestion.value;
        } else {
          (updated as any)[key] = suggestion.value;
        }
      }

      if (Object.keys(floorUpdates).length > 0 && Array.isArray(updated.floors)) {
        updated.floors = updated.floors.map(f => {
          if (floorUpdates[f.id]) {
            return { ...f, ...floorUpdates[f.id] };
          }
          return f;
        });
      }

      return updated;
    });
  }, []);

  // ── Computed values ──
  const totalPlinthArea = fields.floors.reduce((sum, f) => sum + parseNum(f.area), 0);
  const landValue = calculateTotalLandValue(fields.landArea, fields.landAreaUnit, fields.landRatePerUnit);

  const floorValuations = fields.floors.map(f => {
    const area = parseNum(f.area);
    const rate = parseNum(f.rate);
    const estimated = area * rate;
    const life = parseNum(f.lifeYears);
    const age = parseNum(f.ageYears);
    const depPct = f.depreciationPct ? parseNum(f.depreciationPct) : computeDepreciation(life, age);
    const depAmount = estimated * depPct / 100;
    const netValue = estimated - depAmount;
    return { ...f, area, rate, estimated, depPct, depAmount, netValue };
  });

  const totalBuildingValue = floorValuations.reduce((sum, f) => sum + f.netValue, 0);

  const isApartmentFlat = fields.valuationLayout === 'apartment';
  const totalPropertyValue = isApartmentFlat ? totalBuildingValue : landValue + totalBuildingValue;
  const realizableValue = totalPropertyValue * (parseNum(fields.realizablePct || '90') / 100);
  const distressValue = totalPropertyValue * (parseNum(fields.distressPct || '80') / 100);

  // ── File upload ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'propertyImages' | 'sketchMapImages' | 'locationMapImage') => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError(null);

    if (fieldName === 'propertyImages' || fieldName === 'sketchMapImages') {
      const newUrls = [...(fields[fieldName] || [])];
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.size > 5 * 1024 * 1024) { setUploadError(`${file.name}: exceeds 5MB.`); continue; }
        const ext = file.name.split('.').pop();
        const fileName = `${projectId}-${Math.random().toString(36).substring(2)}.${ext}`;
        const filePath = `temp-photos/${projectId}/${fileName}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) { setUploadError(`Failed: ${error.message}`); continue; }
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }
      handleChange(fieldName, newUrls);
    } else {
      const file = fileList[0];
      if (file.size > 5 * 1024 * 1024) { setUploadError(`${file.name}: exceeds 5MB.`); setUploading(false); return; }
      const ext = file.name.split('.').pop();
      const fileName = `${projectId}-${fieldName}-${Date.now()}.${ext}`;
      const filePath = `temp-photos/${projectId}/${fileName}`;
      const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
      if (error) { setUploadError(`Failed: ${error.message}`); }
      else {
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        handleChange(fieldName, data.publicUrl);
      }
    }
    setUploading(false);
  };

  const removeImage = (index: number) => {
    handleChange('propertyImages', fields.propertyImages.filter((_, i) => i !== index));
    if (fields.propertyImageNames) {
      handleChange('propertyImageNames', fields.propertyImageNames.filter((_, i) => i !== index));
    }
  };

  const removeSketchMap = (index: number) => {
    handleChange('sketchMapImages', (fields.sketchMapImages || []).filter((_, i) => i !== index));
  };

  // ── Save / Submit / Finalize ──
  const handleSaveDraft = async () => {
    setLoading(true); setMessage(null);
    const result = await saveReportDraft(projectId, fields);
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Draft saved successfully!' });
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!Array.isArray(fields.propertyImages) || fields.propertyImages.length < 2) {
      setMessage({ type: 'error', text: 'Please upload at least 2 property photographs before submitting.' });
      return;
    }
    if (!confirm('Submit this report for manager verification? You cannot edit it until the manager returns it.')) return;
    setLoading(true); setMessage(null);
    await saveReportDraft(projectId, fields);
    const result = await submitReportForVerification(projectId);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else {
      setMessage({ type: 'success', text: 'Report submitted for verification!' });
      router.refresh();
    }
    setLoading(false);
  };

  const handleGeneratePDF = async () => {
    try {
      const fetchBytes = async (url: string | undefined): Promise<Uint8Array | null> => {
        if (!url) return null;
        try {
          const resp = await fetch(url);
          const buf = await resp.arrayBuffer();
          return new Uint8Array(buf);
        } catch { return null; }
      };

      const propertyImgs = Array.isArray(fields.propertyImages) ? fields.propertyImages.filter(img => typeof img === 'string' && img.length > 0) : [];

      const [letterheadBytes, ...imageResults] = await Promise.all([
        fetchBytes('/templates/letterhead.png'),
        ...propertyImgs.map(url => fetchBytes(url)),
        ...(fields.sketchMapImages && fields.sketchMapImages.length > 0 ? fields.sketchMapImages.map(u => fetchBytes(u)) : []),
        ...(fields.locationMapImage ? [fetchBytes(fields.locationMapImage)] : []),
      ]);

      const propImageBytes: Uint8Array[] = imageResults.slice(0, propertyImgs.length).filter(Boolean) as Uint8Array[];
      let imgIdx = propertyImgs.length;
      const sketchBytesList = fields.sketchMapImages?.length ? imageResults.slice(imgIdx, imgIdx + fields.sketchMapImages.length) : null;
      if (fields.sketchMapImages?.length) imgIdx += fields.sketchMapImages.length;
      const locationBytes = fields.locationMapImage ? imageResults[imgIdx++] : null;

      // Date formatter: YYYY-MM-DD → DD/MM/YYYY
      const fmtDate = (d: string) => {
        if (!d || !d.trim()) return '________';
        const t = d.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(t)) { const [y,m,dd] = t.split('-'); return `${dd}/${m}/${y}`; }
        return t;
      };

      // If bank has a fully custom PDF generator (e.g. Aditya Birla MLAP), delegate to it
      if (config?.generateCustomPDF) {
        return await config.generateCustomPDF(fields, letterheadBytes, imageResults, fmtDate);
      }

      // Instantiate renderer: use config custom renderer or default base renderer
      const r = config?.getPDFRenderer ? config.getPDFRenderer() : new PDFBankRenderer();
      await r.init(letterheadBytes || undefined);

      let titleText = 'VALUATION REPORT';

      r.drawTextBlock('To', { bold: true });
      r.drawTextBlock(fields.to || '________', { bold: true });
      r.drawRichTextBlock([{ text: 'Date of valuation report: ' }, { text: fmtDate(fields.dateOfValuation), bold: true }]);
      r.drawRichTextBlock([{ text: 'Ref: ' }, { text: fields.refNo || '________', bold: true }]);
      r.advanceCursor(6);
      r.drawCenteredTitle(titleText);
      r.advanceCursor(8);

      const drawExtraPDFFields = (secId: string) => {
        if (config?.extraFields?.[secId]) {
          for (const ef of config.extraFields[secId]) {
            const val = fields[ef.key] !== undefined ? fields[ef.key] : (ef.default || '');
            if (val !== '' && val !== null && val !== undefined) {
              r.drawSimpleRow(ef.label, String(val));
            }
          }
        }
      };

      // ── General Details ──
      if (!isSectionHidden('section-1')) {
        r.drawSectionHeader('GENERAL DETAILS');
        r.drawOptionRow('Type of property', ['Residential', 'Commercial', 'Residential cum Commercial', 'Industrial', 'Vacant Plot'], fields.propertyType);
        r.drawSimpleRow(config?.fieldLabels?.ownerName || 'Name of the Customer(s)', `"${fields.ownerName || 'N/A'}"`);
        
        if (fields.annexureEnabled && fields.annexures.length > 0 && !fields.annexureRefShowAlso) {
          const linkedAnn = fields.annexureRef
            ? fields.annexures.find(a => a.id === fields.annexureRef)
            : (fields.annexures.find(a => a.parsedData) || fields.annexures[0]);
          const annexureTitle = linkedAnn ? (linkedAnn.title || `Annexure ${linkedAnn.label}`) : 'Annexure';
          r.drawSimpleRow(config?.fieldLabels?.ownerAddress || 'Property Address', `Refer to annexure ${annexureTitle}`);
        } else {
          r.drawSimpleRow(config?.fieldLabels?.ownerAddress || 'Property Address', getFullAddress());
          r.drawSimpleRow('Landmark', fields.landmark || '');
        }
        const loanAppLabel = fields.loanApplicationType ? `${fields.loanApplicationType} Application number` : (config?.fieldLabels?.loanApplicationNo || 'Application number');
        r.drawSimpleRow(loanAppLabel, fields.loanApplicationNo);
        r.drawSimpleRow(config?.fieldLabels?.documentHolderName || 'Name of Document holder', fields.documentHolderName || fields.ownerName);

        if (fields.legalAnnexureEnabled && fields.annexures.length > 0 && !fields.legalAnnexureRefShowAlso) {
          const linkedAnn = fields.legalAnnexureRef
            ? fields.annexures.find(a => a.id === fields.legalAnnexureRef)
            : (fields.annexures.find(a => a.parsedData) || fields.annexures[0]);
          const annexureTitle = linkedAnn ? (linkedAnn.title || `Annexure ${linkedAnn.label}`) : 'Annexure';
          r.drawSimpleRow('Legal address of property ( Hissa No / Survey no / khasra No : - )', `Refer to annexure ${annexureTitle}`);
        } else {
          r.drawSimpleRow('Legal address of property ( Hissa No / Survey no / khasra No : - )', getLegalFullAddress() || '');
        }

        r.drawSimpleRow('Date of Inspection', fmtDate(fields.dateOfInspection));
        r.drawSimpleRow('Date of Valuation Report', fmtDate(fields.dateOfValuation));
        
        const fullBankText = fields.organisationSubTemplate ? `${fields.bankName || fields.organisationTemplate} (${fields.organisationSubTemplate})` : (fields.bankName || fields.organisationTemplate);
        r.drawSimpleRow('Name of Bank / Institution', fullBankText || 'N/A');
        r.drawSimpleRow('Branch Name', fields.branchName || 'N/A');
        drawExtraPDFFields('section-1');
        r.advanceCursor(8);
      }

      // ── Surrounding Locality Details ──
      if (!isSectionHidden('section-2')) {
        r.drawSectionHeader('SURROUNDING LOCALITY DETAILS');
        r.drawSimpleRow('Ward No / Municipal Land No', fields.wardNo);
        r.drawOptionRow('Vicinity', ['Slum', 'Residential', 'Commercial', 'Mixed', 'Industrial'], fields.vicinity);
        r.drawOptionRow('Locality Type', ['Elite/Posh/High Class', 'Upper Middle Class', 'Middle Class', 'Lower Middle Class'], fields.classOfLocality);
        r.drawOptionRow('Approach Road Width', ['>=60 Feet Road', '60-40 Feet Road', '40-20 Feet Road', '<20 Feet Road'], fields.approachRoadWidth);
        r.drawOptionRow('Plot Demarcated at Site', ['Yes', 'No'], fields.plotDemarcated);
        r.drawProximityRow('Proximity to Civic Amenities',
          ['Nearest Railway Station', 'Nearest Bus Stop', 'Nearest Hospital'],
          [`1. ${fields.railwayStationName || 'Railway Station'}${fields.distanceRailwayStation ? ' — ' + fields.distanceRailwayStation + ' km' : ''}`, `2. ${fields.busStopName || 'Bus Stop'}${fields.distanceBusStop ? ' — ' + fields.distanceBusStop + ' km' : ''}`, `3. ${fields.hospitalName || 'Hospital'}${fields.distanceHospital ? ' — ' + fields.distanceHospital + ' km' : ''}`]
        );
        r.drawOptionRow('Property Identification', ['Easy to Identify', 'Identification by documents', 'Additional documents required', 'Difficult to identify'], fields.propertyIdentification);
        r.drawOptionRow('Proximity to Facilities', ['<1 Km', '1-3 Kms', '3-5 Kms', '>5 Kms'], fields.proximityToFacilities);
        r.drawProximityRow('Landmark Details',
          ['Nearest Railway Station', 'Nearest Bus Stop', 'Nearest Hospital', 'Nearest Landmark'],
          [`1. ${fields.landmarkRailway || 'N/A'}`, `2. ${fields.landmarkBusStop || 'N/A'}`, `3. ${fields.landmarkHospital || 'N/A'}`, `4. ${fields.landmarkNearest || fields.landmark || 'N/A'}`]
        );
        drawExtraPDFFields('section-2');
        r.advanceCursor(8);
      }

      // ── Property Details ──
      if (!isSectionHidden('section-3')) {
        r.drawSectionHeader('PROPERTY DETAILS');
        r.drawSimpleRow('Type of Usage of Entire Property', fields.usageType);
        r.drawSimpleRow('Additional Amenities', fields.additionalAmenities || 'N/A');
        r.drawOptionRow('Legal Status of Property', ['Freehold', 'Lease hold >30 yrs.', 'Lease hold 15-30 yrs.', 'Lease hold <15 yrs.'], fields.legalStatus);
        drawExtraPDFFields('section-3');
        r.advanceCursor(8);
      }

      // ── Subject Property Details ──
      if (!isSectionHidden('section-4')) {
        r.drawSectionHeader('SUBJECT PROPERTY DETAILS');
        r.drawSimpleRow('Type of Premises', fields.premisesType);
        r.drawSimpleRow('Occupied by / Vacant', fields.occupiedBy);
        r.drawSimpleRow('Is Property Rented', fields.isPropertyRented);
        r.drawSimpleRow('If Rented, List of Occupants', fields.rentedOccupants);
        r.drawOptionRow('Property Taxation / Maintenance', ['Low', 'Average', 'High', 'Very High'], fields.propertyTaxation);
        r.drawSimpleRow('Boundary (As per Sketch Map)', `N: ${fields.boundaryNorth || '-'}  |  E: ${fields.boundaryEast || '-'}  |  S: ${fields.boundarySouth || '-'}  |  W: ${fields.boundaryWest || '-'}`);
        r.drawSimpleRow('Boundary (At Site)', `N: ${fields.buildingBoundaryNorth || '-'}  |  E: ${fields.buildingBoundaryEast || '-'}  |  S: ${fields.buildingBoundarySouth || '-'}  |  W: ${fields.buildingBoundaryWest || '-'}`);
        drawExtraPDFFields('section-4');
        r.advanceCursor(8);
      }

      // ── Structural Details ──
      if (!isSectionHidden('section-5')) {
        r.drawSectionHeader('STRUCTURAL DETAILS');
        r.drawOptionRow('Type of Structure', ['RCC', 'Load Bearing', 'Steel Structure', 'Composite Structure', 'Industrial Shed', 'A/C Sheet', 'G/I Sheet', 'Asbestos Roofing'], fields.structureType);
        r.drawSimpleRow('No. of Floors', fields.numberOfFloors);
        r.drawSimpleRow('No. of Wings', fields.numberOfWings);
        r.drawSimpleRow('No. of Units on Each Floor', fields.unitsPerFloor);
        r.drawSimpleRow('Internal Composition', fields.internalComposition);
        r.drawSimpleRow('No. of Lifts', fields.numberOfLifts);
        r.drawAgeOptionRow('Age of Property', ['1-10 years', '11-25 years', '26-50 years', '>50 years'], fields.ageOfProperty, fields.ageOfPropertyActual);
        r.drawSimpleRow('Estimated Future Life', fields.estimatedFutureLife);
        r.drawSimpleRow('Exteriors', fields.exteriors);
        r.drawOptionRow('Quality of Construction', ['Very Good', 'Good', 'Average', 'Poor'], fields.qualityOfConstruction);
        r.drawSimpleRow('Common Areas Remarks', fields.commonAreasRemarks);
        r.drawSimpleRow('Other Observations', fields.otherObservations);
        r.drawSimpleRow('Flooring & Finishing', fields.flooringType);
        r.drawSimpleRow('Roofing & Terracing', fields.roofType);
        r.drawSimpleRow('Quality of Fixtures', fields.qualityOfFixtures);
        drawExtraPDFFields('section-5');
        r.advanceCursor(8);
      }

      // ── Plan Approvals ──
      if (!isSectionHidden('section-6')) {
        r.drawSectionHeader('PLAN APPROVALS');
        r.drawOptionRow('Construction as per Approved Plans', ['Yes', 'No'], fields.constructionApproved);
        r.drawSimpleRow('Details of Approved Plan', fields.approvalDetails);
        r.drawSimpleRow('Construction Permission No. & Date', fields.constructionPermission || 'Not mentioned');
        r.drawSimpleRow('Violations / Risk of Demolition', fields.violationsObserved);
        r.drawSimpleRow('Conforms to Local Byelaws', fields.conformsToByelaws);
        r.drawSimpleRow('Other Documents Verified', fields.documentsVerified);
        drawExtraPDFFields('section-6');
        r.advanceCursor(8);
      }

      // ── Land Valuation ──
      if (!isApartmentFlat && !isSectionHidden('section-8')) {
        r.drawSectionHeader('VALUATION \u2014 Land');
        r.drawSimpleRow('Land Area', `${fields.landArea || '0'} ${fields.landAreaUnit}`);
        r.drawSimpleRow('Current Govt. Approved Rates for Land', `Rs.${fields.govtLandRate || fields.guidelineValue || 'N/A'}/- Per ${fields.landAreaUnit}`);
        r.drawSimpleRow('Recommended Rate & Basis', `Rs.${fields.landRatePerUnit || 'N/A'}/- Per ${fields.landAreaUnit} ${fields.recommendedRateBasis ? '(' + fields.recommendedRateBasis + ')' : ''}`);
        r.drawSimpleRow('Land Value', `${fields.landArea || '0'} ${fields.landAreaUnit} \u00D7 Rs.${fields.landRatePerUnit || '0'}/- = Rs.${formatIndianCurrency(landValue)}/-`);
        r.drawSimpleRow('Actual BUA of Premises', `${formatIndianCurrency(totalPlinthArea)} ${fields.floorAreaUnit || 'Sqft'}`);
        if (fields.buaAsPerApprovals) r.drawSimpleRow('BUA as per Approvals', fields.buaAsPerApprovals);
        drawExtraPDFFields('section-8');
        r.advanceCursor(8);
      }

      // ── Building / Apartment Valuation Table ──
      if (!isSectionHidden('section-7')) {
        r.drawCenteredTitle(isApartmentFlat ? 'VALUATION OF APARTMENT/FLAT (After Depreciation)' : 'VALUATION OF BUILDING (After Depreciation)');
        r.advanceCursor(4);
        const unit = fields.floorAreaUnit || fields.landAreaUnit || 'Sqft';
        r.drawFloorTable(
          ['Floor', `Area (${unit})`, `Rate (Rs./${unit})`, 'Estimated (Rs.)', 'Life (Yr)', 'Age (Yr)', 'Dep%', 'Net Value (Rs.)'],
          floorValuations.map(f => ({
            name: f.name,
            area: formatIndianCurrency(f.area),
            rate: `Rs.${formatIndianCurrency(f.rate)}`,
            estimated: `Rs.${formatIndianCurrency(f.estimated)}`,
            life: String(f.lifeYears),
            age: String(f.ageYears),
            dep: `${f.depPct}%`,
            netValue: `Rs.${formatIndianCurrency(f.netValue)}`,
          })),
          'Total Building Value',
          `Rs.${formatIndianCurrency(totalBuildingValue)}`,
        );
        drawExtraPDFFields('section-7');
        r.advanceCursor(8);
      }

      // ── Extra Custom Bank Sections ──
      if (config?.extraSections) {
        for (const sec of config.extraSections) {
          r.drawSectionHeader(sec.title.toUpperCase());
          drawExtraPDFFields(sec.id);
          r.advanceCursor(8);
        }
      }

      // ── Abstract of Valuation ──
      if (!isSectionHidden('section-9')) {
        r.drawSectionHeader('ABSTRACT OF VALUATION');
        r.drawSimpleRow(
          isApartmentFlat ? 'Market Value (Apartment/Flat)' : 'Market Value (Land + Building)',
          `Rs.${formatIndianCurrency(totalPropertyValue)}/- (${rupeesInWords(totalPropertyValue)})`
        );
        r.drawSimpleRow(`Realizable Value (${fields.realizablePct || '90'}%)`, `Rs.${formatIndianCurrency(realizableValue)}/-`);
        r.drawSimpleRow(`Forced Sale / Distress Value (${fields.distressPct || '80'}%)`, `Rs.${formatIndianCurrency(distressValue)}/- (${rupeesInWords(distressValue)})`);
        r.drawOptionRow('Marketability', ['Excellent', 'Very Good', 'Good', 'Difficult'], fields.marketability);
        r.drawOptionRow('Valuation Result', ['Positive', 'Negative'], fields.valuationResult);
        r.drawSimpleRow('Replacement Cost / Insurance Value', fields.replacementCost ? `Rs.${formatIndianCurrency(fields.replacementCost)}/-` : 'N/A');
        r.drawSimpleRow('Deviations in Property', fields.deviations);
        if (fields.guidelineValue) r.drawSimpleRow('Govt./Guideline Value', `Rs.${formatIndianCurrency(fields.guidelineValue)}/-`);
        drawExtraPDFFields('section-9');
        r.advanceCursor(8);
      }

      // ── Remarks ──
      if (!isSectionHidden('section-10')) {
        r.drawSectionHeader('REMARKS, DEMARCATION & POSSESSION');
        r.drawSimpleRow('Demarcation', fields.demarcation);
        r.drawSimpleRow('Possession', fields.possession);
        r.drawSimpleRow('Remarks / Observations', fields.remarks);
        drawExtraPDFFields('section-10');
        r.advanceCursor(8);
      }

      // ── Declaration ──
      r.drawTextBlock('Declaration:', { bold: true, fontSize: 14 });
      r.advanceCursor(2);
      r.drawTextBlock('I hereby declare that:');
      r.advanceCursor(2);
      r.drawTextBlock(`\u2022 I have deputed my representative ${fields.representativeName ? 'Mr. ' + fields.representativeName : '______'}${fields.representativeFatherName ? ', S/o: ' + fields.representativeFatherName : ''} to inspect the property on ${fmtDate(fields.dateOfInspection)}.`);
      r.drawTextBlock('\u2022 I have no direct or indirect interest in the property valued.');
      r.drawTextBlock('\u2022 The information furnished is true and correct to the best of my knowledge and belief.');
      r.advanceCursor(10);

      // ── Valuation Certificate ──
      r.checkPageBreak(200);
      r.drawCenteredTitle('VALUATION CERTIFICATE', undefined, true);
      r.advanceCursor(6);
      r.drawCertificateBox([
        {
          segments: [
            { text: 'This is to certify that the undersigned has personally inspected the property belonging to ' },
            { text: fields.ownerName, bold: true },
            { text: ' situated at ' },
            { text: fields.annexureEnabled && fields.annexures.length > 0 ? `address as provided in Annexure ${(fields.annexures.find(a => a.parsedData) || fields.annexures[0]).label}` : getFullAddress(), bold: true },
            { text: ' on ' },
            { text: fields.dateOfInspection, bold: true },
            { text: ' and after careful examination and consideration of all relevant factors, the Fair Market Value of the said property is assessed as under:' },
          ],
        },
        { segments: [{ text: `Fair Market Value: Rs. ${formatIndianCurrency(totalPropertyValue)} (${rupeesInWords(totalPropertyValue)})`, bold: true }] },
        { segments: [{ text: `Realizable Value (${fields.realizablePct || '90'}%): Rs. ${formatIndianCurrency(realizableValue)} (${rupeesInWords(realizableValue)})`, bold: true }] },
        { segments: [{ text: `Distress Sale Value (${fields.distressPct || '80'}%): Rs. ${formatIndianCurrency(distressValue)} (${rupeesInWords(distressValue)})`, bold: true }] },
      ]);

      // ── Signature ──
      r.drawSignatureBlock([
        { text: '_______________________________' },
        { text: 'Satyajit Mohanty', bold: true, fontSize: 14 },
        { text: 'B.E.(Civil), M.Tech (Structural)', italic: true },
        { text: 'Registered Valuer \u2014 IBBI/RV/02/2019/10594', italic: true },
        { text: 'S Mohanty & Associates, Bhubaneswar', italic: true },
      ]);

      // ── Property Photographs ──
      if (propImageBytes.length > 0) {
        r.newPage();
        r.drawCenteredTitle('PROPERTY PHOTOGRAPHS');
        r.advanceCursor(8);

        for (let i = 0; i < propImageBytes.length; i += 2) {
          const caption1 = fields.propertyImageNames?.[i] !== undefined
            ? fields.propertyImageNames[i]
            : 'Site Picture';
          const img2 = i + 1 < propImageBytes.length ? propImageBytes[i + 1] : null;
          const caption2 = (i + 1 < propImageBytes.length)
            ? (fields.propertyImageNames?.[i + 1] !== undefined ? fields.propertyImageNames[i + 1] : 'Site Picture')
            : '';

          await r.drawImagePair(propImageBytes[i], caption1, img2, caption2);
          r.advanceCursor(4);
        }
      }

      // ── Sketch Map ──
      if (sketchBytesList && sketchBytesList.length > 0) {
        for (let i = 0; i < sketchBytesList.length; i++) {
          const sBytes = sketchBytesList[i];
          if (sBytes) {
            r.newPage();
            r.drawCenteredTitle(`SKETCH MAP${sketchBytesList.length > 1 ? ` ${i + 1}` : ''}`);
            r.advanceCursor(8);
            await r.drawImageBlock(sBytes, {
              maxWidth: 450, maxHeight: 500, centered: true,
            });
          }
        }
      }

      // ── Location Map ──
      if (locationBytes && locationBytes.length > 0) {
        r.newPage();
        r.drawCenteredTitle('LOCATION MAP');
        r.advanceCursor(8);
        await r.drawImageBlock(locationBytes, {
          maxWidth: 450, maxHeight: 500, centered: true,
        });
        if (fields.latitude || fields.longitude) {
          r.drawTextBlock(`Lat: ${fields.latitude || 'N/A'}, Long: ${fields.longitude || 'N/A'}`, { bold: true, align: 'center' });
        }
      }

      // ── Annexure Sections ──
      if (fields.annexures && fields.annexures.length > 0) {
        for (const annexure of fields.annexures) {
          if (annexure.parsedData && annexure.parsedData.headers.length > 0) {
            r.newPage();
            r.drawCenteredTitle(annexure.title ? `ANNEXURE ${annexure.label} - ${annexure.title.toUpperCase()}` : `ANNEXURE ${annexure.label}`);
            r.advanceCursor(8);
            if (annexure.parsedData.allRows && annexure.parsedData.merges && annexure.parsedData.colWidths) {
              r.drawMergedTable(
                annexure.parsedData.allRows,
                annexure.parsedData.merges,
                annexure.parsedData.colWidths,
              );
            } else {
              r.drawDataTable(annexure.parsedData.headers, annexure.parsedData.rows);
            }
          }
        }
      }

      return await r.toBlob();
    } catch (err) {
      console.error('PDF generation failed:', err);
      throw err;
    }
  };

  const handlePreviewPDF = async () => {
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
          </body>
        </html>
      `);
    }

    try {
      setLoading(true);
      setLoadingText('Compiling PDF...');
      const blob = await handleGeneratePDF();
      const url = URL.createObjectURL(blob);

      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Valuation-Report-${fields.refNo || projectId}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      if (previewWindow) previewWindow.close();
      setMessage({ type: 'error', text: `Failed to compile PDF: ${err?.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
      setLoadingText('Loading...');
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setLoading(true);
      setLoadingText('Downloading PDF...');
      const blob = await handleGeneratePDF();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setMessage({ type: 'error', text: `Download failed: ${err?.message || 'Unknown error'}` });
    } finally {
      setLoading(false);
      setLoadingText('Loading...');
    }
  };

  const handleFinalize = async () => {
    if (!Array.isArray(fields.propertyImages) || fields.propertyImages.length < 2) {
      setMessage({ type: 'error', text: 'Please upload at least 2 property photographs before finalizing.' });
      return;
    }
    if (!confirm('Finalize this report and share it with the client? This will generate the official PDF and delete temporary draft images.')) return;
    setLoading(true);
    setMessage({ type: 'success', text: 'Generating final PDF...' });
    try {
      await saveReportDraft(projectId, fields);
      const pdfBlob = await handleGeneratePDF();
      if (pdfBlob) {
        const pdfFileName = `${projectId}-report-${Date.now()}.pdf`;
        const pdfPath = `reports/pdfs/${pdfFileName}`;
        const { error: uploadErr } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });
        if (!uploadErr) {
          const { data: urlData } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(pdfPath);
          try {
            const { data: files } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).list(`temp-photos/${projectId}`);
            if (files && files.length > 0) {
              const paths = files.map(f => `temp-photos/${projectId}/${f.name}`);
              await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).remove(paths);
            }
          } catch (err) { console.error('Failed to cleanup temp photos:', err); }
          const finalFields = { ...fields, propertyImages: [] };
          await saveReportDraft(projectId, finalFields);
          const { finalizeReport } = await import('@/app/actions/project');
          const res = await finalizeReport(projectId, urlData.publicUrl);
          if (res.error) setMessage({ type: 'error', text: res.error });
          else { setFields(finalFields); setMessage({ type: 'success', text: 'Project Finalized Successfully! PDF is now available to the client.' }); }
        } else {
          setMessage({ type: 'error', text: 'Failed to upload PDF.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    } finally {
      setLoading(false);
    }
  };

  const handleReworkClick = () => {
    setShowReworkModal(true);
  };

  const submitRework = async () => {
    if (!reworkComment.trim()) {
      setMessage({ type: 'error', text: 'Please provide a comment for rework.' });
      return;
    }
    setLoading(true);
    const { sendReportForRework } = await import('@/app/actions/project');
    const res = await sendReportForRework(projectId, reworkComment);
    if (res.error) setMessage({ type: 'error', text: res.error });
    else {
      setMessage({ type: 'success', text: 'Report sent for rework.' });
      setShowReworkModal(false);
      router.refresh();
    }
    setLoading(false);
  };

  const handleCancelSubmission = async () => {
    if (!confirm('Cancel this submission and return to drafting?')) return;
    setLoading(true);
    const { cancelReportSubmission } = await import('@/app/actions/project');
    const res = await cancelReportSubmission(projectId);
    if (res.error) setMessage({ type: 'error', text: res.error });
    else {
      setMessage({ type: 'success', text: 'Submission cancelled. You can now edit the report.' });
      router.refresh();
    }
    setLoading(false);
  };

  const renderExtraField = (ef: ExtraFieldConfig) => {
    const val = fields[ef.key] !== undefined ? fields[ef.key] : (ef.default || '');
    return (
      <Field key={ef.key} label={ef.label} span={ef.span || 1}>
        {ef.type === 'textarea' ? (
          <textarea
            className={inputCls}
            rows={3}
            value={val}
            onChange={e => handleChange(ef.key, e.target.value)}
            disabled={isReadOnly || ef.readOnly}
            placeholder={`Enter ${ef.label.toLowerCase()}...`}
          />
        ) : ef.type === 'select' ? (
          <select
            className={selectCls}
            value={val}
            onChange={e => handleChange(ef.key, e.target.value)}
            disabled={isReadOnly || ef.readOnly}
          >
            {(ef.options || []).map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : ef.type === 'yesno' ? (
          <select
            className={selectCls}
            value={val}
            onChange={e => handleChange(ef.key, e.target.value)}
            disabled={isReadOnly || ef.readOnly}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        ) : (
          <input
            type={ef.type || 'text'}
            className={inputCls}
            value={val}
            onChange={e => handleChange(ef.key, e.target.value)}
            disabled={isReadOnly || ef.readOnly}
            placeholder={`Enter ${ef.label.toLowerCase()}...`}
          />
        )}
      </Field>
    );
  };

  const renderExtraFields = (sectionId: string) => {
    const extras = config?.extraFields?.[sectionId];
    if (!extras || extras.length === 0) return null;
    return (
      <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-[#e9ecef]/60">
        {extras.map(renderExtraField)}
      </div>
    );
  };

  const isFieldHidden = (key: string) => config?.hiddenFields?.includes(key) || false;
  const isSectionHidden = (sectionId: string) => config?.hiddenSections?.includes(sectionId) || false;
  const getLabel = (key: string, fallback: string) => config?.fieldLabels?.[key] || fallback;

  const aiAssistEnabled = process.env.NEXT_PUBLIC_AI_ASSIST_ENABLED === 'true';

  return (
    <div className={`flex ${aiAssistEnabled ? 'gap-4' : 'gap-6'} items-start w-full`} ref={reportRef}>
      {/* ── Main Form Column ── */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Template Info Banner */}
        <div className="p-4 bg-white border border-[#dee2e6] flex flex-row items-center justify-between gap-4 shadow-md rounded-2xl sticky top-2 z-50">
          <div className="flex items-center gap-4">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider leading-tight min-w-[90px] select-none">
              Active<br />Configuration
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                {fields.clientType === 'organisation' ? 'Organisation / Bank' : 'Individual'}
              </span>
              {(fields.institutionCategory || fields.clientType === 'organisation') && (
                <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                  {fields.institutionCategory || 'Bank & FIS'}
                </span>
              )}
              <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                {config?.displayName || fields.bankName || fields.organisationTemplate || 'Bank Report'}
              </span>
              {fields.organisationSubTemplate && (
                <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  Format: {fields.organisationSubTemplate}
                </span>
              )}
              {fields.serviceType && (
                <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                  Service: {(fields.serviceType || '').replace(/_/g, ' ')}
                </span>
              )}
              {fields.subjectType && (
                <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                  Subject: {(fields.subjectType || '').replace(/_/g, ' ')}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-[#b8860b] hover:text-[#8a6507] hover:underline font-bold transition-colors shrink-0 pr-2 uppercase"
          >
            Change Parameters
          </button>
        </div>

        {/* Rework Banner */}
        {fields.reworkNotes && status === 'REPORT_DRAFTING' && (
          <div className="card p-5 border-2 border-red-200 bg-red-50 shadow-md">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xl">⚠️</span>
              <h2 className="text-sm font-bold text-red-800 uppercase tracking-wider">Manager Rework Requested</h2>
            </div>
            <p className="text-sm text-red-700 bg-white/60 p-4 rounded-lg border border-red-100 whitespace-pre-wrap">
              {fields.reworkNotes}
            </p>
          </div>
        )}

        {/* ── Section 1: General Details ── */}
        {!isSectionHidden('section-1') && (
          <Section title="General Details" number={1}>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 bg-amber-50/30 p-4 rounded-xl border border-amber-200/50 mb-2">
                {!isFieldHidden('to') && (
                  <Field label={getLabel('to', 'To (Recipient / Bank)')} span={2}>
                    <input className={inputCls} value={fields.to} onChange={e => handleChange('to', e.target.value)} disabled={isReadOnly} placeholder="e.g. HDFC BANK LTD., Bhubaneswar" />
                  </Field>
                )}
                {!isFieldHidden('dateOfValuation') && (
                  <Field label={getLabel('dateOfValuation', 'Date of Valuation Report')}>
                    <input type="date" className={inputCls} value={fields.dateOfValuation} onChange={e => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} />
                  </Field>
                )}
                {!isFieldHidden('refNo') && (
                  <Field label="Ref No. (Locked)">
                    <input className={inputCls} value={fields.refNo} disabled={true} readOnly={true} placeholder="Project ID" />
                  </Field>
                )}
                {!isFieldHidden('bankName') && (
                  <Field label={getLabel('bankName', 'Name of Bank / Institution')}>
                    <input className={inputCls} value={fields.bankName} onChange={e => handleChange('bankName', e.target.value)} disabled={isReadOnly} placeholder="e.g. State Bank of India" />
                  </Field>
                )}
                {!isFieldHidden('branchName') && (
                  <Field label={getLabel('branchName', 'Branch Name')}>
                    <input className={inputCls} value={fields.branchName} onChange={e => handleChange('branchName', e.target.value)} disabled={isReadOnly} placeholder="e.g. Commercial Branch, Cuttack" />
                  </Field>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {!isFieldHidden('propertyType') && (
                  <Field label={getLabel('propertyType', 'Type of Property')}>
                    <select className={selectCls} value={fields.propertyType} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly}>
                      <option value="Residential">Residential</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Residential cum Commercial">Residential cum Commercial</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Vacant Plot">Vacant Plot</option>
                    </select>
                  </Field>
                )}
                {!isFieldHidden('ownerName') && (
                  <Field label={getLabel('ownerName', 'Name of Customer(s)')}>
                    <input className={inputCls} value={fields.ownerName} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} placeholder="e.g. Mr. Rajesh Kumar" />
                  </Field>
                )}
                {/* Property Address Card with Annexure Toggle */}
                {!isFieldHidden('ownerAddress') && (
                  <div className="md:col-span-2 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                      <h3 className="text-sm font-bold text-[#0f2038]">{getLabel('ownerAddress', 'Property Address')}</h3>
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
                        onSelectRef={id => handleChange('annexureRef', id)}
                        reportRefText="Property Address"
                      />
                    </div>
                    {(!fields.annexureEnabled || fields.annexureRefShowAlso) && (
                      <Field label={getLabel('ownerAddress', 'Property Address')} span={2}>
                        <textarea className={inputCls} rows={2} value={fields.ownerAddress} onChange={e => handleChange('ownerAddress', e.target.value)} disabled={isReadOnly} placeholder="Detailed property address..." />
                      </Field>
                    )}
                  </div>
                )}

                {/* Legal Address Card with Annexure Toggle */}
                {!isFieldHidden('legalAddress') && (
                  <div className="md:col-span-2 bg-white p-4 rounded-xl border border-neutral-200 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-neutral-100 pb-3 flex-wrap gap-2">
                      <h3 className="text-sm font-bold text-[#0f2038]">
                        Legal Address <span className="text-[10px] font-normal text-[#6c757d] normal-case">(Hissa / Survey / Khasra No)</span>
                      </h3>
                      <AnnexureRefSelector
                        label="Legal Address"
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
                                title: 'Legal Address',
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
                        onSelectRef={id => handleChange('legalAnnexureRef', id)}
                        reportRefText="Legal Address"
                      />
                    </div>
                    {(!fields.legalAnnexureEnabled || fields.legalAnnexureRefShowAlso) && (
                      <Field label="Legal Address (Hissa / Survey / Khasra No)" span={2}>
                        <textarea className={inputCls} rows={2} value={fields.legalAddress} onChange={e => handleChange('legalAddress', e.target.value)} disabled={isReadOnly} placeholder="Hissa / Survey / Khasra No..." />
                      </Field>
                    )}
                  </div>
                )}
                {!isFieldHidden('landmark') && (
                  <Field label={getLabel('landmark', 'Landmark')}>
                    <input className={inputCls} value={fields.landmark} onChange={e => handleChange('landmark', e.target.value)} disabled={isReadOnly} placeholder="e.g. Near SBI ATM" />
                  </Field>
                )}
                {!isFieldHidden('loanApplicationNo') && (
                  <Field label={getLabel('loanApplicationNo', 'Loan Application Number')}>
                    <input className={inputCls} value={fields.loanApplicationNo} onChange={e => handleChange('loanApplicationNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. HL-2024-00123" />
                  </Field>
                )}
                {!isFieldHidden('documentHolderName') && (
                  <Field label={getLabel('documentHolderName', 'Document Holder Name')}>
                    <input className={inputCls} value={fields.documentHolderName} onChange={e => handleChange('documentHolderName', e.target.value)} disabled={isReadOnly} placeholder="e.g. Mr. Rajesh Kumar" />
                  </Field>
                )}
                {!isFieldHidden('dateOfInspection') && (
                  <Field label={getLabel('dateOfInspection', 'Date of Inspection')}>
                    <input type="date" className={inputCls} value={fields.dateOfInspection} onChange={e => handleChange('dateOfInspection', e.target.value)} disabled={isReadOnly} />
                  </Field>
                )}
              </div>
              {renderExtraFields('section-1')}
            </div>
          </Section>
        )}

        {/* ── Section 2: Surrounding Locality Details ── */}
        {!isSectionHidden('section-2') && (
          <Section title="Surrounding Locality Details" number={2}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Ward No / Municipal Land No">
                <input className={inputCls} value={fields.wardNo} onChange={e => handleChange('wardNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. Ward 12" />
              </Field>
              <Field label="Vicinity">
                <select className={selectCls} value={fields.vicinity} onChange={e => handleChange('vicinity', e.target.value)} disabled={isReadOnly}>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Slum">Slum</option>
                </select>
              </Field>
              <Field label="Class of Locality">
                <select className={selectCls} value={fields.classOfLocality} onChange={e => handleChange('classOfLocality', e.target.value)} disabled={isReadOnly}>
                  <option value="Elite/Posh/High Class">Elite/Posh/High Class</option>
                  <option value="Upper Middle Class">Upper Middle Class</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Lower Middle Class">Lower Middle Class</option>
                </select>
              </Field>
              <Field label="Approach Road Width">
                <select className={selectCls} value={fields.approachRoadWidth} onChange={e => handleChange('approachRoadWidth', e.target.value)} disabled={isReadOnly}>
                  <option value=">=60 Feet Road">&gt;=60 Feet Road</option>
                  <option value="60-40 Feet Road">60-40 Feet Road</option>
                  <option value="40-20 Feet Road">40-20 Feet Road</option>
                  <option value="<20 Feet Road">&lt;20 Feet Road</option>
                </select>
              </Field>
              <Field label="Plot Demarcated at Site">
                <select className={selectCls} value={fields.plotDemarcated} onChange={e => handleChange('plotDemarcated', e.target.value)} disabled={isReadOnly}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="Proximity to Facilities">
                <select className={selectCls} value={fields.proximityToFacilities} onChange={e => handleChange('proximityToFacilities', e.target.value)} disabled={isReadOnly}>
                  <option value="<1 Km">&lt;1 Km</option>
                  <option value="1-3 Kms">1-3 Kms</option>
                  <option value="3-5 Kms">3-5 Kms</option>
                  <option value=">5 Kms">&gt;5 Kms</option>
                </select>
              </Field>
            </div>
            {renderExtraFields('section-2')}
          </Section>
        )}

        {/* ── Section 3: Property Details ── */}
        {!isSectionHidden('section-3') && (
          <Section title="Property Details" number={3}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Usage Type">
                <input className={inputCls} value={fields.usageType} onChange={e => handleChange('usageType', e.target.value)} disabled={isReadOnly} placeholder="e.g. Residential" />
              </Field>
              <Field label="Legal Status">
                <select className={selectCls} value={fields.legalStatus} onChange={e => handleChange('legalStatus', e.target.value)} disabled={isReadOnly}>
                  <option value="Freehold">Freehold</option>
                  <option value="Lease hold >30 yrs.">Lease hold &gt;30 yrs.</option>
                  <option value="Lease hold 15-30 yrs.">Lease hold 15-30 yrs.</option>
                  <option value="Lease hold <15 yrs.">Lease hold &lt;15 yrs.</option>
                </select>
              </Field>
            </div>
            {renderExtraFields('section-3')}
          </Section>
        )}

        {/* ── Section 4: Subject Property Details ── */}
        {!isSectionHidden('section-4') && (
          <Section title="Subject Property Details" number={4}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Premises Type">
                <input className={inputCls} value={fields.premisesType} onChange={e => handleChange('premisesType', e.target.value)} disabled={isReadOnly} placeholder="e.g. Row House / Independent Building" />
              </Field>
              <Field label="Occupied By">
                <select className={selectCls} value={fields.occupiedBy} onChange={e => handleChange('occupiedBy', e.target.value)} disabled={isReadOnly}>
                  <option value="Self Occupied">Self Occupied</option>
                  <option value="Tenant">Tenant</option>
                  <option value="Vacant">Vacant</option>
                </select>
              </Field>
              <Field label="Boundaries as per Sketch Map (N, S, E, W)" span={2}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <input className={inputCls} value={fields.boundaryNorth} onChange={e => handleChange('boundaryNorth', e.target.value)} disabled={isReadOnly} placeholder="North" />
                  <input className={inputCls} value={fields.boundarySouth} onChange={e => handleChange('boundarySouth', e.target.value)} disabled={isReadOnly} placeholder="South" />
                  <input className={inputCls} value={fields.boundaryEast} onChange={e => handleChange('boundaryEast', e.target.value)} disabled={isReadOnly} placeholder="East" />
                  <input className={inputCls} value={fields.boundaryWest} onChange={e => handleChange('boundaryWest', e.target.value)} disabled={isReadOnly} placeholder="West" />
                </div>
              </Field>
            </div>
            {renderExtraFields('section-4')}
          </Section>
        )}

        {/* ── Section 5: Structural Details ── */}
        {!isSectionHidden('section-5') && (
          <Section title="Structural Details" number={5}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Type of Structure">
                <select className={selectCls} value={fields.structureType} onChange={e => handleChange('structureType', e.target.value)} disabled={isReadOnly}>
                  <option value="RCC">RCC</option>
                  <option value="Load Bearing">Load Bearing</option>
                  <option value="Steel Structure">Steel Structure</option>
                  <option value="Composite Structure">Composite Structure</option>
                  <option value="Industrial Shed">Industrial Shed</option>
                </select>
              </Field>
              <Field label="No. of Floors">
                <input className={inputCls} value={fields.numberOfFloors} onChange={e => handleChange('numberOfFloors', e.target.value)} disabled={isReadOnly} placeholder="e.g. Ground + 2" />
              </Field>
              <Field label="Age of Property (Years)">
                <input className={inputCls} value={fields.ageOfPropertyActual} onChange={e => handleChange('ageOfPropertyActual', e.target.value)} disabled={isReadOnly} placeholder="e.g. 5" />
              </Field>
              <Field label="Estimated Future Life (Years)">
                <input className={inputCls} value={fields.estimatedFutureLife} onChange={e => handleChange('estimatedFutureLife', e.target.value)} disabled={isReadOnly} placeholder="e.g. 55" />
              </Field>
              <Field label="Quality of Construction">
                <select className={selectCls} value={fields.qualityOfConstruction} onChange={e => handleChange('qualityOfConstruction', e.target.value)} disabled={isReadOnly}>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
              <Field label="Maintenance Condition">
                <select className={selectCls} value={fields.maintenanceCondition} onChange={e => handleChange('maintenanceCondition', e.target.value)} disabled={isReadOnly}>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
            </div>
            {renderExtraFields('section-5')}
          </Section>
        )}

        {/* ── Section 6: Plan Approvals ── */}
        {!isSectionHidden('section-6') && (
          <Section title="Plan Approvals" number={6}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Construction Approved">
                <select className={selectCls} value={fields.constructionApproved} onChange={e => handleChange('constructionApproved', e.target.value)} disabled={isReadOnly}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </Field>
              <Field label="Approval Details">
                <input className={inputCls} value={fields.approvalDetails} onChange={e => handleChange('approvalDetails', e.target.value)} disabled={isReadOnly} placeholder="e.g. Approved by BDA/CMC" />
              </Field>
              <Field label="Violations Observed">
                <select className={selectCls} value={fields.violationsObserved} onChange={e => handleChange('violationsObserved', e.target.value)} disabled={isReadOnly}>
                  <option value="Low">Low</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                  <option value="None">None</option>
                </select>
              </Field>
              <Field label="Conforms to Byelaws">
                <input className={inputCls} value={fields.conformsToByelaws} onChange={e => handleChange('conformsToByelaws', e.target.value)} disabled={isReadOnly} placeholder="e.g. Yes / Conforms to norms" />
              </Field>
            </div>
            {renderExtraFields('section-6')}
          </Section>
        )}

        {/* ── Section 7: Floor-wise Valuation ── */}
        {!isSectionHidden('section-7') && (
          <Section title="Floor-wise Area & Building Valuation" number={7}>
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0a1628] text-white">
                      <th className="px-3 py-2.5 text-left font-semibold text-xs uppercase tracking-wider">Floor</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Area (Sqft)</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Rate (Rs/Sqft)</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Est. Cost (Rs)</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Life (Yrs)</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Age (Yrs)</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-xs uppercase tracking-wider">Dep %</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-xs uppercase tracking-wider">Net Value (Rs)</th>
                      {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {floorValuations.map((f, idx) => (
                      <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input className={inputCls + ' !py-1.5 text-xs font-bold text-[#0f2038]'} value={f.name} onChange={e => updateFloor(f.id, 'name', e.target.value)} disabled={isReadOnly} />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input className={inputCls + ' !py-1.5 text-xs text-right'} value={f.area} onChange={e => updateFloor(f.id, 'area', e.target.value)} disabled={isReadOnly} placeholder="0" />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input className={inputCls + ' !py-1.5 text-xs text-right'} value={f.rate} onChange={e => updateFloor(f.id, 'rate', e.target.value)} disabled={isReadOnly} placeholder="0" />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef] text-right font-mono font-semibold text-[#0f2038] text-xs">
                          Rs. {formatIndianCurrency(f.estimated)}
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input className={inputCls + ' !py-1.5 text-xs text-center'} value={f.lifeYears} onChange={e => updateFloor(f.id, 'lifeYears', e.target.value)} disabled={isReadOnly} placeholder="60" />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input className={inputCls + ' !py-1.5 text-xs text-center'} value={f.ageYears} onChange={e => updateFloor(f.id, 'ageYears', e.target.value)} disabled={isReadOnly} placeholder="0" />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                          <input className={inputCls + ' !py-1.5 text-xs text-center font-bold text-[#b8860b]'} value={f.depreciationPct} onChange={e => updateFloor(f.id, 'depreciationPct', e.target.value)} disabled={isReadOnly} placeholder={`${f.depPct}%`} />
                        </td>
                        <td className="px-2 py-1.5 border-b border-[#e9ecef] text-right font-mono font-bold text-[#0f2038] text-xs">
                          Rs. {formatIndianCurrency(f.netValue)}
                        </td>
                        {!isReadOnly && (
                          <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center">
                            {fields.floors.length > 1 && (
                              <button type="button" onClick={() => removeFloor(f.id)} className="text-red-400 hover:text-red-600 text-lg leading-none" title="Remove Floor">&times;</button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-[#f0ead6] font-bold text-[#0f2038]">
                      <td className="px-3 py-2.5 text-xs uppercase tracking-wider" colSpan={7}>Total Building Value</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#b8860b] text-sm" colSpan={2}>
                        Rs. {formatIndianCurrency(totalBuildingValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={addFloor}
                  className="text-sm text-[#b8860b] hover:text-[#96700a] font-semibold flex items-center gap-1.5 pt-1"
                >
                  <span className="text-lg leading-none">+</span> Add Floor
                </button>
              )}
              {renderExtraFields('section-7')}
            </div>
          </Section>
        )}

        {/* ── Section 8: Land Valuation (if not apartment) ── */}
        {!isApartmentFlat && !isSectionHidden('section-8') && (
          <Section title="Land Valuation" number={8}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Land Area">
                <input className={inputCls} value={fields.landArea} onChange={e => handleChange('landArea', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1500" />
              </Field>
              <Field label="Land Area Unit">
                <select className={selectCls} value={fields.landAreaUnit} onChange={e => handleChange('landAreaUnit', e.target.value)} disabled={isReadOnly}>
                  <option value="Sqft">Sqft</option>
                  <option value="Dec">Dec (Decimal)</option>
                  <option value="Acre">Acre</option>
                  <option value="Sqmt">Sqmt</option>
                  <option value="Guntha">Guntha</option>
                </select>
              </Field>
              <Field label="Land Rate (Rs per Unit)">
                <input className={inputCls} value={fields.landRatePerUnit} onChange={e => handleChange('landRatePerUnit', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2500" />
              </Field>
              <Field label="Govt / Guideline Rate">
                <input className={inputCls} value={fields.govtLandRate} onChange={e => handleChange('govtLandRate', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1800" />
              </Field>
              <div className="md:col-span-2 p-3 bg-amber-50 rounded-lg border border-amber-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-700">Calculated Land Value:</span>
                <span className="text-sm font-bold font-mono text-[#b8860b]">Rs. {formatIndianCurrency(landValue)}</span>
              </div>
            </div>
            {renderExtraFields('section-8')}
          </Section>
        )}

        {/* ── Section 9: Valuation Abstract ── */}
        {!isSectionHidden('section-9') && (
          <Section title="Valuation Abstract" number={isApartmentFlat ? 8 : 9}>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Fair Market Value</p>
                <p className="text-lg font-bold font-mono text-[#0f2038]">Rs. {formatIndianCurrency(totalPropertyValue)}</p>
                <p className="text-[11px] text-slate-500 mt-1 italic">{rupeesInWords(totalPropertyValue)}</p>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <p className="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-1">Realizable Value ({fields.realizablePct || '90'}%)</p>
                <p className="text-lg font-bold font-mono text-blue-900">Rs. {formatIndianCurrency(realizableValue)}</p>
              </div>
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-wider mb-1">Distress Value ({fields.distressPct || '80'}%)</p>
                <p className="text-lg font-bold font-mono text-amber-900">Rs. {formatIndianCurrency(distressValue)}</p>
              </div>
              <Field label="Marketability">
                <select className={selectCls} value={fields.marketability} onChange={e => handleChange('marketability', e.target.value)} disabled={isReadOnly}>
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Difficult">Difficult</option>
                </select>
              </Field>
              <Field label="Valuation Result">
                <select className={selectCls} value={fields.valuationResult} onChange={e => handleChange('valuationResult', e.target.value)} disabled={isReadOnly}>
                  <option value="Positive">Positive</option>
                  <option value="Negative">Negative</option>
                </select>
              </Field>
            </div>
            {renderExtraFields('section-9')}
          </Section>
        )}

        {/* ── Section 10: Remarks & Declaration ── */}
        {!isSectionHidden('section-10') && (
          <Section title="Remarks & Declaration" number={isApartmentFlat ? 9 : 10}>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Demarcation">
                <input className={inputCls} value={fields.demarcation} onChange={e => handleChange('demarcation', e.target.value)} disabled={isReadOnly} placeholder="Clear" />
              </Field>
              <Field label="Possession">
                <input className={inputCls} value={fields.possession} onChange={e => handleChange('possession', e.target.value)} disabled={isReadOnly} placeholder="With Owner" />
              </Field>
              <Field label="Remarks / Observations" span={2}>
                <textarea className={inputCls} rows={3} value={fields.remarks} onChange={e => handleChange('remarks', e.target.value)} disabled={isReadOnly} placeholder="General observations..." />
              </Field>
            </div>
            {renderExtraFields('section-10')}
          </Section>
        )}

        {/* ── Extra Bank-Specific Sections ── */}
        {config?.extraSections?.map(sec => (
          <Section key={sec.id} id={sec.id} title={sec.title} number={sec.number} defaultOpen={sec.defaultOpen ?? true}>
            {sec.render(fields, handleChange, isReadOnly)}
          </Section>
        ))}

        {/* ── Section 11: Photographs ── */}
        {!isSectionHidden('section-11') && (
          <BasePhotographsSection
            propertyImages={fields.propertyImages || []}
            propertyImageNames={fields.propertyImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            bucketCount={bucketImages?.length || 0}
            onImageNameChange={(idx, name) => {
              const updatedNames = [...(fields.propertyImageNames || [])];
              while (updatedNames.length <= idx) {
                updatedNames.push('');
              }
              updatedNames[idx] = name;
              handleChange('propertyImageNames', updatedNames);
            }}
            onRemoveImage={removeImage}
            onReorderImages={(newImages, newNames) => {
              handleChange('propertyImages', newImages);
              handleChange('propertyImageNames', newNames);
            }}
            onUploadImages={(e) => handleFileUpload(e, 'propertyImages')}
            onOpenBucketPicker={() => openBucketPicker('propertyImages')}
            sectionNumber={isApartmentFlat ? 10 : 11}
            sectionId="section-11"
          />
        )}

        {/* ── Section 12: Sketch Maps & Mouza/Cadastral Maps ── */}
        {!isSectionHidden('section-12') && (
          <Section title="Maps & Sketches" number={isApartmentFlat ? 11 : 12}>
            <div className="space-y-6">
              {/* Mouza & Cadastral Upload Slots */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border border-[#dee2e6] rounded-xl bg-slate-50 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Mouza Map (Bhulekh)</h4>
                  {fields.mouzaMapImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-[#dee2e6] aspect-video bg-white">
                      <img src={fields.mouzaMapImage} alt="Mouza Map" className="w-full h-full object-contain" />
                      {!isReadOnly && (
                        <button type="button" onClick={() => handleChange('mouzaMapImage', '')} className="absolute top-2 right-2 bg-red-600 text-white rounded p-1 text-[10px] font-bold">Remove</button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-xs font-semibold cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                        <span>🗺️ Upload Mouza Map</span>
                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'mouzaMapImage')} className="hidden" disabled={uploading || isReadOnly} />
                      </label>
                    </div>
                  )}
                </div>

                <div className="p-4 border border-[#dee2e6] rounded-xl bg-slate-50 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Cadastral Satellite Map</h4>
                  {fields.cadastralMapImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-[#dee2e6] aspect-video bg-white">
                      <img src={fields.cadastralMapImage} alt="Cadastral Map" className="w-full h-full object-contain" />
                      {!isReadOnly && (
                        <button type="button" onClick={() => handleChange('cadastralMapImage', '')} className="absolute top-2 right-2 bg-red-600 text-white rounded p-1 text-[10px] font-bold">Remove</button>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-xs font-semibold cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                        <span>🗺️ Upload Cadastral Map</span>
                        <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'cadastralMapImage')} className="hidden" disabled={uploading || isReadOnly} />
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Amin Sketch Maps */}
              <div className="space-y-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Amin Hand-Drawn Sketch Maps</h4>
                  <div className="flex items-center gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#b8860b] text-[#b8860b] text-xs font-semibold cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                      <span>+ Add Sketch Map</span>
                      <input type="file" multiple accept="image/*" onChange={e => handleFileUpload(e, 'sketchMapImages')} className="hidden" disabled={uploading || isReadOnly} />
                    </label>
                  </div>
                </div>
                {Array.isArray(fields.sketchMapImages) && fields.sketchMapImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {fields.sketchMapImages.map((img, idx) => (
                      <div key={idx} className="relative group border rounded-xl overflow-hidden shadow-sm aspect-video bg-slate-100">
                        <img src={img} alt={`Sketch ${idx + 1}`} className="w-full h-full object-contain" />
                        {!isReadOnly && (
                          <button type="button" onClick={() => removeSketchMap(idx)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-80 hover:opacity-100 shadow">✕</button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No sketch maps uploaded yet.</p>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* ── Section 13: Location Map ── */}
        {!isSectionHidden('section-13') && (
          <Section title="Location Map" number={isApartmentFlat ? 12 : 13}>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Latitude">
                  <input className={inputCls} value={fields.latitude} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 20.2961" />
                </Field>
                <Field label="Longitude">
                  <input className={inputCls} value={fields.longitude} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 85.8245" />
                </Field>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#b8860b] text-[#b8860b] text-sm font-semibold cursor-pointer hover:bg-[#b8860b]/10 transition-all shadow-xs">
                  <span>📷 Upload Location Map</span>
                  <input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'locationMapImage')} className="hidden" disabled={uploading || isReadOnly} />
                </label>
              </div>
              {fields.locationMapImage ? (
                <div className="relative group border rounded-xl overflow-hidden shadow-sm max-w-sm aspect-video bg-slate-100">
                  <img src={fields.locationMapImage} alt="Location Map" className="w-full h-full object-contain" />
                  {!isReadOnly && (
                    <button type="button" onClick={() => handleChange('locationMapImage', '')} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-80 hover:opacity-100 shadow">✕</button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No location map uploaded yet.</p>
              )}
            </div>
          </Section>
        )}

        {/* ── Section 14 / 15: Annexures (Always available) ── */}
        <BaseAnnexureSection
          annexures={fields.annexures || []}
          isReadOnly={isReadOnly}
          uploading={uploading}
          onAddAnnexure={addAnnexure}
          onRemoveAnnexure={removeAnnexure}
          onUpdateTitle={updateAnnexureTitle}
          onUploadExcel={handleAnnexureUpload}
          onRemoveFile={removeAnnexureFile}
          sectionNumber={isApartmentFlat ? 14 : 15}
          sectionId={`section-${isApartmentFlat ? 14 : 15}`}
        />

        {/* ── Action Buttons Footer ── */}
        <div className="p-5 bg-[#556B2F] border-2 border-[#3F5021] rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-4 sticky bottom-4 z-40">
          {status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE' && (
            <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold mb-2">
              <span>⏳ Currently Under Manager Review.</span>
              <button
                type="button"
                onClick={handleCancelSubmission}
                disabled={loading}
                className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
              >
                ↩️ Cancel Submission (Pull back to Draft)
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            {!isReadOnly && (
              <>
                {autoSaveStatus === 'saving' && (
                  <span className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                    Auto-saving...
                  </span>
                )}
                {autoSaveStatus === 'saved' && (
                  <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    ✓ Auto-saved
                  </span>
                )}
                {autoSaveStatus === 'error' && (
                  <span className="text-xs font-bold text-rose-900 bg-rose-50 border border-rose-300 px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    ⚠️ Auto-save failed
                  </span>
                )}
              </>
            )}
            {message && (
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full shadow-xs ${message.type === 'error' ? 'bg-red-100 text-red-900 border border-red-300' : 'bg-green-100 text-green-900 border border-green-300'}`}>
                {message.text}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isReadOnly && (
              <>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-white border-2 border-[#b8860b] text-[#b8860b] font-bold text-sm hover:bg-amber-50 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                >
                  {loading ? '⏳ Saving...' : '💾 Save Draft'}
                </button>
                {userRole === 'REPORT_EMPLOYEE' && (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-6 py-2.5 rounded-full bg-[#1e3a5f] text-white font-bold text-sm hover:bg-[#0f2038] shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading ? '⏳ Submitting...' : '📤 Submit to Manager'}
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={handlePreviewPDF}
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-white border border-gray-300 text-gray-800 font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              👁️ Preview PDF
            </button>

            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={loading}
              className="px-6 py-2.5 rounded-full bg-white border border-gray-300 text-gray-800 font-bold text-sm hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              📥 Download PDF
            </button>

            {status === 'MANAGER_REVIEW' && isManagerOrOwner && (
              <>
                <button
                  type="button"
                  onClick={handleReworkClick}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full border-2 border-red-500 text-red-600 font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  ❌ Send for Rework
                </button>
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={loading}
                  className="px-6 py-2.5 rounded-full bg-green-600 text-white font-bold text-sm hover:bg-green-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  ✅ Finalize & Share to Client
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Floating Navigator ── */}
      <FloatingNavigator
        sections={
          config?.navSections || [
            { id: 'section-1', title: 'General Details' },
            { id: 'section-2', title: 'Locality Details' },
            { id: 'section-3', title: 'Property Details' },
            { id: 'section-4', title: 'Subject Property' },
            { id: 'section-5', title: 'Structural Details' },
            { id: 'section-6', title: 'Plan Approvals' },
            { id: 'section-7', title: 'Area Valuation' },
            ...(isApartmentFlat ? [] : [{ id: 'section-8', title: 'Land Valuation' }]),
            { id: `section-${isApartmentFlat ? 8 : 9}`, title: 'Valuation Abstract' },
            { id: `section-${isApartmentFlat ? 9 : 10}`, title: 'Remarks' },
            { id: `section-${isApartmentFlat ? 10 : 11}`, title: 'Certificate' },
            ...(config?.extraSections || []).map((es, idx) => ({ id: es.id || `extra-section-${idx}`, title: es.title })),
            { id: `section-${isApartmentFlat ? 11 : 12}`, title: 'Photographs' },
            { id: `section-${isApartmentFlat ? 12 : 13}`, title: 'Sketch Maps' },
            { id: `section-${isApartmentFlat ? 13 : 14}`, title: 'Location Map' },
            { id: `section-${isApartmentFlat ? 14 : 15}`, title: 'Annexures' },
          ]
        }
      />

      {/* ── Rework Modal ── */}
      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#e9ecef] bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
                Send for Rework
              </h2>
              <p className="text-xs text-[#6c757d] mt-1">Please provide specific feedback for the report analyst.</p>
            </div>
            <div className="p-6">
              <textarea
                value={reworkComment}
                onChange={(e) => setReworkComment(e.target.value)}
                placeholder="List the changes required..."
                className="w-full min-h-[150px] p-4 text-sm rounded-xl border border-[#dee2e6] bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-red-500/30 focus:border-red-500 resize-y"
                autoFocus
              />
            </div>
            <div className="p-4 border-t border-[#e9ecef] bg-[#f8f9fa] flex justify-end gap-3">
              <button
                onClick={() => { setShowReworkModal(false); setReworkComment(''); }}
                className="px-5 py-2.5 rounded-xl border border-[#dee2e6] text-sm font-semibold text-[#495057] hover:bg-white transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={submitRework}
                disabled={loading || !reworkComment.trim()}
                className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Confirm Rework'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bucket Picker Modal ── */}
      {bucketPickerOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-[#0f2038]">
                Select Images from Project Bucket ({localBucketImages.length} available)
              </h3>
              <button onClick={() => setBucketPickerOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-3 gap-3 p-1">
              {localBucketImages.map(img => {
                const selected = bucketSelected.has(img.id);
                return (
                  <div
                    key={img.id}
                    onClick={() => toggleBucketImage(img.id)}
                    className={`relative border-2 rounded-xl overflow-hidden cursor-pointer aspect-square transition-all ${selected ? 'border-[#b8860b] shadow-md ring-2 ring-[#b8860b]/30' : 'border-slate-200 hover:border-slate-400'}`}
                  >
                    <img src={img.url} alt={img.fileName} className="w-full h-full object-cover" />
                    {selected && (
                      <div className="absolute top-1.5 right-1.5 bg-[#b8860b] text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold">✓</div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDeleteBucketImage(img); }}
                      className="absolute top-1.5 left-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 border-t pt-3">
              <button onClick={() => setBucketPickerOpen(false)} className="px-4 py-2 rounded-lg border border-[#dee2e6] text-xs font-semibold text-[#495057] hover:bg-slate-50 transition-colors">Cancel</button>
              <button onClick={handleBucketConfirm} className="px-4 py-2 rounded-lg bg-[#b8860b] text-white text-xs font-bold hover:bg-[#9a6f08] transition-colors">
                Add Selected ({bucketSelected.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
