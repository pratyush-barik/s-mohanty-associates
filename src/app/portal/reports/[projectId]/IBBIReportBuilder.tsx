'use client';

/**
 * IBBIReportBuilder — Report Builder for IBBI-IVS Valuation Reports
 * (Organisation Client: IBBI)
 *
 * Mirrors the architecture of GeneralReportBuilder.tsx but with IBBI-specific
 * sections (14 statutory sections), fields, and PDF layout.
 *
 * Key differences from GeneralReportBuilder:
 *   - Sections 1–3 are auto-generated (IBBI statutory text)
 *   - Valuation Certificate appears BEFORE Section 1 in the PDF
 *   - Section 13 uses Annexure Excel uploads for plot-by-plot tables
 *   - No wizard flow — this builder is directly for IBBI organisation clients
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import { PDFIBBIRenderer } from '@/lib/pdf-ibbi-renderer';
import AiAssistPanel from '@/components/AiAssistPanel';
import type { Suggestion } from '@/lib/ai/predictor';
// @ts-ignore
import * as XLSX from 'xlsx';

const SERVICES_LIST = [
  { id: 'mortgage_loan', title: 'Mortgage & Loan Security Valuation' },
  { id: 'land_valuation', title: 'Land Valuation' },
  { id: 'apartment_valuation', title: 'Apartment Valuation' },
];

// ─── Types ─────────────────────────────────────────────────────────
interface AnnexureItem {
  id: string;
  label: string;          // 'A', 'B', 'C', ...
  title?: string;         // Custom title for the annexure
  excelFileUrl: string;   // Uploaded Excel URL from Supabase
  excelFileName: string;  // Original filename
  parsedData?: {          // Parsed Excel table data
    headers: string[];
    rows: string[][];
  };
}

export interface ValuationRow {
  id: string;
  plotNo: string;
  khataNo: string;
  area: string;
  rate: string;
  guidelineValue: string;
  fairMarketValue: string;
}

interface IBBIFields {
  // ── Common / Cover Page ──
  ownerName: string;
  ownerAddress: string;
  propertyAddress: string;
  addressPrefixType?: string;
  customAddressPrefix?: string;
  legalAddress: string;
  dateOfInspection: string;
  dateOfValuation: string;
  refNo: string;

  // ── Section 4: Brief Description ──
  applicantName: string;
  hasManagingDirector?: string;
  managingDirectorName?: string;
  propertyType: string;
  currentUsage: string;
  revenuePlotNo: string;
  revenueKhataNo: string;
  revenueVillage: string;
  revenueTahasil: string;
  revenuePS: string;
  revenueGP: string;
  revenueDistrict: string;
  revenueState: string;
  classificationArea: string;
  conversionStatus: string;
  boundEast: string;
  boundWest: string;
  boundNorth: string;
  boundSouth: string;
  extentOfSite: string;
  occupancyStatus: string;

  // ── Section 5: Town Planning ──
  masterPlanProvision: string;
  approvedPlanDate: string;
  approvedPlanAuthority: string;
  developmentControls: string;
  groundCoverage: string;
  surroundingLandUse: string;

  // ── Section 6: Legal Aspects ──
  ownershipDocuments: string;
  ownerAsPerROR: string;
  easementAgreement: string;
  acquisitionNotification: string;
  roadWideningNotification: string;
  heritageRestriction: string;
  transferability: string;
  existingMortgages: string;
  guaranteeIssued: string;
  sarfaesiCompliant: string;
  disputesDues: string;

  // ── Section 7: Infrastructure ──
  waterSupply: string;
  sewerage: string;
  stormWater: string;
  solidWaste: string;
  electricity: string;
  roadConnectivity: string;
  policeStationDist: string;
  busStopDist: string;
  schoolDist: string;
  collegeDist: string;

  // ── Section 8 & 9: Socio-Cultural / Environment ──
  socialStructure: string;
  socialInfrastructure: string;
  ecoMaterials: string;
  rainWaterHarvesting: string;
  solarSystem: string;
  environmentalPollution: string;

  // ── Section 10 & 11: Marketability / Architecture ──
  locationalAttributes: string;
  scarcity: string;
  demandSupply: string;
  architecturalAspects: string;

  // ── Section 12: Engineering ──
  constructionType: string;
  materialsUsed: string;
  specifications: string;
  maintenanceIssues: string;
  ageOfBuilding: string;
  residualLife: string;
  extentDeterioration: string;
  structuralSafety: string;
  naturalDisasterProtection: string;
  visibleDamage: string;

  // ── Section 13: Valuation ──
  bookValueTotal: string;
  fairMarketValueTotal: string;
  presentMarketValueTotal: string;
  realisableValueTotal: string;
  valuationRows: ValuationRow[];

  // ── Section 14: Site Location ──
  latitude: string;
  longitude: string;

  // ── Photos & Maps ──
  propertyImages: string[];
  propertyImageNames: string[];
  sketchMapImages: string[];
  locationMapImage: string;

  // ── Remarks ──
  remarks: string;
  representativeName: string;
  representativeFatherName: string;
  valuerQualifications: string;
  valuerAdditionalDetails: string;
  registeredOfficeAddress: string;
  registeredOfficeTel: string;

  // ── Annexure ──
  annexureEnabled: boolean;
  annexures: AnnexureItem[];

  // ── Meta ──
  clientType?: string;
  organisationTemplate?: string;
  [key: string]: any;
}

const DEFAULT_FIELDS: IBBIFields = {
  ownerName: '',
  ownerAddress: '',
  propertyAddress: '',
  addressPrefixType: 'none',
  customAddressPrefix: '',
  legalAddress: '',
  dateOfInspection: new Date().toISOString().split('T')[0],
  dateOfValuation: new Date().toISOString().split('T')[0],
  refNo: '',
  purposeOfValuation: 'To assess the Fair Market Value for Auction / Liquidation purpose',
  valuationMethod: 'Sale Comparison Method coupled with Replacement Cost Approach',
  propertyDescription: '',
  caseReferenceNo: '',
  appointedBy: '',
  appointmentDate: '',

  applicantName: '',
  hasManagingDirector: 'no',
  managingDirectorName: '',
  propertyType: 'Defunct Industrial Unit',
  currentUsage: 'Vacant',
  revenuePlotNo: '',
  revenueKhataNo: '',
  revenueVillage: '',
  revenueTahasil: '',
  revenuePS: '',
  revenueGP: '',
  revenueDistrict: '',
  revenueState: 'Odisha',
  classificationArea: 'Rural Area',
  conversionStatus: 'Agricultural',
  boundEast: '',
  boundWest: '',
  boundNorth: '',
  boundSouth: '',
  extentOfSite: '',
  occupancyStatus: 'Vacant',

  masterPlanProvision: '',
  approvedPlanDate: '',
  approvedPlanAuthority: '',
  developmentControls: '',
  groundCoverage: '',
  surroundingLandUse: '',

  ownershipDocuments: 'ROR',
  ownerAsPerROR: '',
  easementAgreement: 'None',
  acquisitionNotification: 'None',
  roadWideningNotification: 'None',
  heritageRestriction: 'None',
  transferability: 'No restriction',
  existingMortgages: 'None',
  guaranteeIssued: 'No information',
  sarfaesiCompliant: 'Pending Legal Opinion',
  disputesDues: 'None observed',

  waterSupply: 'Not Available',
  sewerage: 'Not Available',
  stormWater: 'No',
  solidWaste: 'No',
  electricity: 'Not Available',
  roadConnectivity: '',
  policeStationDist: '',
  busStopDist: '',
  schoolDist: '',
  collegeDist: '',

  socialStructure: 'Average',
  socialInfrastructure: 'No',
  ecoMaterials: 'No',
  rainWaterHarvesting: 'No',
  solarSystem: 'No',
  environmentalPollution: 'None observed',

  locationalAttributes: 'Average',
  scarcity: 'No',
  demandSupply: 'Restricted',
  architecturalAspects: 'None',

  constructionType: 'None at site',
  materialsUsed: 'None at site',
  specifications: 'None at site',
  maintenanceIssues: 'None at site',
  ageOfBuilding: '0',
  residualLife: '0',
  extentDeterioration: 'None',
  structuralSafety: 'None',
  naturalDisasterProtection: 'None',
  visibleDamage: 'None',

  bookValueTotal: '',
  fairMarketValueTotal: '',
  presentMarketValueTotal: '',
  realisableValueTotal: '',
  valuationRows: [],

  latitude: '',
  longitude: '',

  propertyImages: [],
  propertyImageNames: [],
  sketchMapImages: [],
  locationMapImage: '',

  remarks: '',
  representativeName: '',
  representativeFatherName: '',
  valuerQualifications: '',
  valuerAdditionalDetails: '',
  registeredOfficeAddress: '',
  registeredOfficeTel: '',

  annexureEnabled: false,
  annexures: [],

  clientType: 'organisation',
  organisationTemplate: 'IBBI_IVS',
};

// ─── UI Sub-Components ─────────────────────────────────────────────
function Section({ title, number, children, defaultOpen = true }: { title: string; number: number | string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div id={`section-${number}`} className="card border border-[#e9ecef] overflow-hidden scroll-mt-24">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#0a1628] to-[#162d4a] text-white hover:from-[#0f1e35] hover:to-[#1e3a5f] transition-all"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-[#b8860b] flex items-center justify-center text-sm font-bold">{number}</span>
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

const FloatingNavigator = ({ annexureEnabled }: { annexureEnabled: boolean }) => {
  const [activeId, setActiveId] = useState<string>('');

  const NAV_SECTIONS = [
    { id: 'section-1', title: '1. Objective' },
    { id: 'section-4', title: '4. Description' },
    { id: 'section-5', title: '5. Town Planning' },
    { id: 'section-6', title: '6. Legal Aspects' },
    { id: 'section-7', title: '7. Infrastructure' },
    { id: 'section-8', title: '8-9. Socio-Env' },
    { id: 'section-10', title: '10-11. Market' },
    { id: 'section-12', title: '12. Engineering' },
    { id: 'section-13', title: '13. Valuation' },
    { id: 'section-14', title: '14. Photos/Maps' },
    ...(annexureEnabled ? [{ id: 'section-annexure', title: 'Annexures' }] : []),
  ];

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

    NAV_SECTIONS.forEach(sec => {
      const el = document.getElementById(sec.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [annexureEnabled]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="hidden xl:flex flex-col gap-0 bg-white/80 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.1)] border border-[#e9ecef] p-2 rounded-2xl w-[160px] sticky top-24 shrink-0 z-40">
      <div className="text-[10px] font-black text-neutral-400 mb-1 px-2 uppercase tracking-widest">IBBI Sections</div>
      {NAV_SECTIONS.map((sec) => {
        const isActive = activeId === sec.id;
        return (
          <button
            key={sec.id}
            type="button"
            onClick={() => scrollTo(sec.id)}
            className={`text-left px-3 py-1 text-[11px] font-bold rounded-lg transition-all truncate ${
              isActive
                ? 'bg-[#b8860b] text-white shadow-md'
                : 'text-slate-500 hover:bg-[#b8860b]/10 hover:text-[#b8860b]'
            }`}
          >
            {sec.title}
          </button>
        );
      })}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────
interface BucketImageItem {
  id: string;
  url: string;
  fileName: string;
  size: number;
  createdAt: string;
  employee: { name: string; employeeId: string };
}

interface IBBIReportBuilderProps {
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
  onReset?: () => void;
}

export default function IBBIReportBuilder({ projectId, projectCode, initialFields, status, userRole = 'REPORT_EMPLOYEE', bucketImages = [], prefill, onReset }: IBBIReportBuilderProps) {
  const router = useRouter();


  const merged: IBBIFields = {
    ...DEFAULT_FIELDS,
    ...(typeof initialFields === 'object' && initialFields !== null ? initialFields : {}),
    refNo: initialFields?.refNo || projectCode || DEFAULT_FIELDS.refNo,
    ownerName: initialFields?.ownerName || prefill?.contactName || DEFAULT_FIELDS.ownerName,
    ownerAddress: initialFields?.ownerAddress || prefill?.propertyAddress || DEFAULT_FIELDS.ownerAddress,
    propertyImages: Array.isArray(initialFields?.propertyImages) ? initialFields.propertyImages : DEFAULT_FIELDS.propertyImages,
    propertyImageNames: Array.isArray(initialFields?.propertyImageNames) ? initialFields.propertyImageNames : DEFAULT_FIELDS.propertyImageNames,
    sketchMapImages: Array.isArray(initialFields?.sketchMapImages) 
      ? initialFields.sketchMapImages 
      : (typeof initialFields?.sketchMapImage === 'string' && initialFields.sketchMapImage ? [initialFields.sketchMapImage] : DEFAULT_FIELDS.sketchMapImages),
    valuationRows: Array.isArray(initialFields?.valuationRows) ? initialFields.valuationRows : DEFAULT_FIELDS.valuationRows,
    annexures: Array.isArray(initialFields?.annexures) ? initialFields.annexures : DEFAULT_FIELDS.annexures,
    clientType: 'organisation',
    organisationTemplate: 'IBBI_IVS',
  };

  const [fields, setFields] = useState<IBBIFields>(merged);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading...');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Bucket Picker State
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [bucketPickerMode, setBucketPickerMode] = useState<'propertyImages' | 'sketchMapImages' | 'locationMapImage'>('propertyImages');
  const [bucketSelected, setBucketSelected] = useState<Set<string>>(new Set());
  const [bucketPickerAgent, setBucketPickerAgent] = useState<string | null>(null);

  const bypassUnloadRef = useRef(false);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypassUnloadRef.current) return;
      saveReportDraft(projectId, fields).catch(e => console.error(e));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields]);

  const handleChange = useCallback((field: string, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
  }, []);

  const openBucketPicker = (mode: 'propertyImages' | 'sketchMapImages' | 'locationMapImage') => {
    setBucketPickerMode(mode);
    setBucketSelected(new Set());
    setBucketPickerAgent(null);
    setBucketPickerOpen(true);
  };

  const handleBucketConfirm = () => {
    const selectedImages = (bucketImages || []).filter(img => bucketSelected.has(img.id));
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

  const reportRef = useRef<HTMLDivElement>(null);
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkComment, setReworkComment] = useState('');

  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  const handleResetWizard = async () => {
    if (confirm("Are you sure you want to change report parameters? This will permanently clear all your typed data and reset the report.")) {
      if (onReset) {
        onReset();
      }
    }
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

  const handleFinalize = async () => {
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

  const handleAiAcceptSuggestion = useCallback((fieldKey: string, value: string) => {
    handleChange(fieldKey, value);
  }, [handleChange]);

  const handleAiAcceptFloorSuggestion = useCallback((floorId: string, fieldName: string, value: string) => {
    // No-op for IBBI signature compatibility
  }, []);

  const handleAiAcceptAll = useCallback((suggestions: Record<string, Suggestion>) => {
    setFields(prev => {
      const updated = { ...prev };
      for (const [key, suggestion] of Object.entries(suggestions)) {
        (updated as any)[key] = suggestion.value;
      }
      return updated;
    });
  }, []);

  // ── Valuation Table Helpers ──
  const addValuationRow = () => {
    handleChange('valuationRows', [
      ...fields.valuationRows,
      { id: String(Date.now()), plotNo: '', khataNo: '', area: '', rate: '', guidelineValue: '', fairMarketValue: '' }
    ]);
  };
  
  const removeValuationRow = (id: string) => {
    handleChange('valuationRows', fields.valuationRows.filter(row => row.id !== id));
  };
  
  const updateValuationRow = (id: string, field: keyof ValuationRow, value: string) => {
    handleChange('valuationRows', fields.valuationRows.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // ── Annexure helpers ──
  const addAnnexure = () => {
    const nextIndex = fields.annexures.length;
    const label = String.fromCharCode(65 + nextIndex); // A, B, C, ...
    handleChange('annexures', [...fields.annexures, {
      id: String(Date.now()),
      label,
      title: '',
      excelFileUrl: '',
      excelFileName: '',
    }]);
  };
  const removeAnnexure = (id: string) => {
    handleChange('annexures', fields.annexures.filter((a: AnnexureItem) => a.id !== id));
  };
  const updateAnnexureTitle = (id: string, title: string) => {
    handleChange('annexures', fields.annexures.map((a: AnnexureItem) => a.id === id ? { ...a, title } : a));
  };
  const handleAnnexureUpload = async (annexureId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setUploadError('File exceeds 10MB limit.'); return; }

    setUploading(true);
    setUploadError(null);

    let parsedData: { headers: string[]; rows: string[][] } | undefined;
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: string[][] = XLSX.utils.sheet_to_json(firstSheet, { header: 1, defval: '' });
      if (jsonData.length > 0) {
        parsedData = {
          headers: jsonData[0].map(h => String(h)),
          rows: jsonData.slice(1).map(row => row.map(cell => String(cell))),
        };
      }
    } catch (parseErr) {
      console.warn('Could not parse Excel file:', parseErr);
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
      handleChange('annexures', fields.annexures.map((a: AnnexureItem) =>
        a.id === annexureId ? { ...a, excelFileUrl: data.publicUrl, excelFileName: file.name, parsedData } : a
      ));
    }
    setUploading(false);
  };
  const removeAnnexureFile = (annexureId: string) => {
    handleChange('annexures', fields.annexures.map((a: AnnexureItem) =>
      a.id === annexureId ? { ...a, excelFileUrl: '', excelFileName: '', parsedData: undefined } : a
    ));
  };

  // ── File upload (photos + maps) ──
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

  const removeSketchMap = (index: number) => {
    handleChange('sketchMapImages', (fields.sketchMapImages || []).filter((_, i) => i !== index));
  };

  const removeImage = (index: number) => {
    handleChange('propertyImages', fields.propertyImages.filter((_: any, i: number) => i !== index));
    if (fields.propertyImageNames) {
      handleChange('propertyImageNames', fields.propertyImageNames.filter((_: any, i: number) => i !== index));
    }
  };

  // ── Save / Submit ──
  const handleSaveDraft = async () => {
    setLoading(true); setMessage(null);
    const result = await saveReportDraft(projectId, fields);
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Draft saved successfully!' });
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!confirm('Submit this report for manager verification?')) return;
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

  // ── PDF Generation (IBBI Layout — matches real IBBI sample reports) ──
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

      const propertyImgs = Array.isArray(fields.propertyImages) ? fields.propertyImages.filter((img: string) => typeof img === 'string' && img.length > 0) : [];

      const [letterheadBytes, ...imageResults] = await Promise.all([
        fetchBytes('/templates/letterhead.png'),
        ...propertyImgs.map((url: string) => fetchBytes(url)),
        ...(fields.sketchMapImages && fields.sketchMapImages.length > 0 ? fields.sketchMapImages.map((u: string) => fetchBytes(u)) : []),
        ...(fields.locationMapImage ? [fetchBytes(fields.locationMapImage)] : []),
      ]);

      const propImageBytes: Uint8Array[] = imageResults.slice(0, propertyImgs.length) as Uint8Array[];
      let imgIdx = propertyImgs.length;
      const sketchBytesList = fields.sketchMapImages?.length ? imageResults.slice(imgIdx, imgIdx + fields.sketchMapImages.length) : null;
      if (fields.sketchMapImages?.length) imgIdx += fields.sketchMapImages.length;
      const locationBytes = fields.locationMapImage ? imageResults[imgIdx++] : null;

      const r = new PDFIBBIRenderer();
      await r.init(letterheadBytes || undefined);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  COVER PAGE
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.advanceCursor(60);
      r.drawCenteredTitle('VALUATION REPORT', 20);
      r.advanceCursor(6);
      let prefix = '';
      if (fields.addressPrefixType === 'multiple_plots') prefix = 'OVER MULTIPLE PLOTS IN ';
      else if (fields.addressPrefixType === 'idco_plot') prefix = 'OVER IDCO PLOT, ';
      else if (fields.addressPrefixType === 'other') prefix = fields.customAddressPrefix ? fields.customAddressPrefix.trim() + ', ' : '';
      
      r.drawTextBlock(`OF ${fields.propertyType || 'Property'} BELONGING TO`.toUpperCase(), { bold: true, align: 'center', fontSize: 13 });
      r.drawTextBlock(`${fields.applicantName || fields.ownerName || '________'}`.toUpperCase(), { bold: true, align: 'center', fontSize: 13 });
      if (fields.hasManagingDirector === 'yes' && fields.managingDirectorName) {
        r.drawTextBlock('REPRESENTED THROUGH ITS MANAGING DIRECTOR', { align: 'center', fontSize: 13 });
        r.drawTextBlock(fields.managingDirectorName.toUpperCase(), { align: 'center', fontSize: 13 });
      }
      r.drawTextBlock(`${prefix}${fields.propertyAddress || '________'}`.toUpperCase(), { bold: true, align: 'center', fontSize: 13 });
      r.advanceCursor(12);
      r.drawCenteredTitle('OWNER OF THE PROPERTY', 13);
      r.advanceCursor(4);
      r.drawTextBlock((fields.applicantName || fields.ownerName || '________').toUpperCase(), { bold: true, align: 'center', fontSize: 11, underline: true });
      if (fields.hasManagingDirector === 'yes' && fields.managingDirectorName) {
        r.drawTextBlock('REPRESENTED THROUGH ITS MANAGING DIRECTOR', { align: 'center', fontSize: 11 });
        r.drawTextBlock(fields.managingDirectorName.toUpperCase(), { align: 'center', fontSize: 11 });
      }
      r.advanceCursor(24);

      // Value summary table on cover
      r.drawSimpleRow('FAIR MARKET VALUE', `Rs.${formatIndianCurrency(fields.fairMarketValueTotal || '0')}/-`);
      r.drawSimpleRow('LIQUIDATION VALUE', `Rs.${formatIndianCurrency(fields.realisableValueTotal || '0')}/-`);
      r.drawSimpleRow('GOVT. GUIDELINE VALUE', `Rs.${formatIndianCurrency(fields.bookValueTotal || '0')}/-`);
      r.advanceCursor(24);

      // Prepared By block
      r.drawCenteredTitle('PREPARED BY', 12);
      r.advanceCursor(4);
      r.drawTextBlock(`${fields.representativeName || ''}${fields.valuerQualifications ? ' ' + fields.valuerQualifications : ''}`, { bold: true, align: 'center', underline: true });
      if (fields.valuerAdditionalDetails) {
        fields.valuerAdditionalDetails.split('\n').forEach((line: string) => {
          if (line.trim()) r.drawTextBlock(line.trim(), { align: 'center' });
        });
      }
      r.advanceCursor(6);
      r.drawTextBlock(`REGISTERED OFFICE ADDRESS ${fields.registeredOfficeAddress || ''} ${fields.registeredOfficeTel ? 'Tel-' + fields.registeredOfficeTel : ''}`.trim(), { align: 'center' });

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  TABLE OF CONTENTS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawCenteredTitle('CONTENTS', 16);
      r.advanceCursor(12);
      const tocPageMap: Record<string, number> = {};
      const tocItems = [
        'VALUATION CERTIFICATE',
        '1.  OBJECTIVE',
        '    1.1  Valuation Standard',
        '    1.2  Purpose of Valuation',
        '    1.3  Conflict of Interest',
        '    1.4  Currency and Measurement',
        '    1.5  Responsibility to Third Parties',
        '    1.6  Disclosure and Publication',
        '    1.7  Limitations on Liability',
        '2.  SCOPE OF ENQUIRIES AND INVESTIGATION',
        '3.  BASIS OF VALUATION',
        '4.  BRIEF DESCRIPTION OF THE PROPERTY',
        '5.  TOWN PLANNING PARAMETERS',
        '6.  DOCUMENT DETAILS AND LEGAL ASPECTS',
        '7.  FUNCTIONAL AND INFRASTRUCTURE ASPECTS',
        '8.  SOCIO-CULTURAL ASPECTS',
        '9.  ENVIRONMENTAL FACTORS',
        '10. MARKETABILITY OF THE PROPERTY',
        '11. ARCHITECTURAL ASPECTS',
        '12. ENGINEERING ASPECTS',
        '13. VALUATION APPROACHES & METHODOLOGY',
        '    13.1  Methodology',
        '    13.2  Valuation Bases',
        '    13.3  Valuation Considerations',
        '    13.4  Valuation Assumptions',
        '    13.5  Valuation Analysis',
        '    13.6  Details of Valuation',
        '14. SITE LOCATION',
        '15. ASSUMPTIONS & LIMITATIONS',
        'CONCLUSION',
        'DECLARATION AND UNDERTAKING',
        'PROPERTY PHOTOGRAPHS',
      ];
      if (fields.annexureEnabled && fields.annexures.length > 0) {
        fields.annexures.forEach((ann: AnnexureItem) => {
          tocItems.push(`ANNEXURE ${ann.label}${ann.title ? ': ' + ann.title.toUpperCase() : ''}`);
        });
      }
      for (const item of tocItems) {
        r.drawTOCRow(item, item);
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  VALUATION CERTIFICATE (enhanced with label-value table)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawRichTextBlock([
        { text: `Ref: ${fields.refNo || '________'}` },
      ]);
      r.drawRichTextBlock([
        { text: `Date: ${fields.dateOfValuation || '________'}` },
      ]);
      r.advanceCursor(6);
      r.drawCenteredTitle('VALUATION CERTIFICATE');
      tocPageMap['VALUATION CERTIFICATE'] = r.getPageCount();
      r.advanceCursor(6);

      // Certificate introductory paragraph
      const certOwner = fields.applicantName || fields.ownerName || '________';
      const certAddress = fields.propertyAddress || fields.ownerAddress || '________';
      const certDate = fields.dateOfInspection || '________';
      const coverDesc = fields.propertyType || 'Property';
      const appointedByText = fields.appointedBy ? `Pursuant to Letter of Appointment from ${fields.appointedBy}` : 'Pursuant to Letter of Appointment';
      const appointmentDateText = fields.appointmentDate ? ` on ${fields.appointmentDate}` : '';
      const caseRefText = fields.caseReferenceNo ? `, vide Reference ${fields.caseReferenceNo}` : '';

      r.drawTextBlock(
        `${appointedByText}${appointmentDateText} for carrying out Valuation of Immovable assets${caseRefText}, to assess the fair market and thereby deriving liquidation value of ${coverDesc} at ${certAddress}, currently owned by ${certOwner}, inspected on ${certDate}.`
      );
      r.advanceCursor(6);
      r.drawTextBlock('The Valuation Certificate is to be used in conjunction with the Detailed Valuation Report Enclosed herewith based on the information and particulars furnished and actual observation, Valuation methodology, assumption, limitations, Disclaimer and bases of valuation stated herein and should not be referred in Isolation.');
      r.advanceCursor(8);

      // Certificate table (label-value pairs matching IBBI sample)
      r.drawSimpleRow('CLIENT NAME', certOwner.toUpperCase());
      r.drawSimpleRow('PROPERTY ADDRESS', certAddress.toUpperCase());
      r.drawSimpleRow('PURPOSE OF VALUATION', (fields.purposeOfValuation || 'ACCESS OF FAIR MARKET VALUE').toUpperCase());
      r.drawSimpleRow('CURRENT OWNER, CONTACT DETAILS', certOwner.toUpperCase());
      r.drawSimpleRow('DESCRIPTION', coverDesc.toUpperCase());
      r.drawSimpleRow('AREA', fields.extentOfSite || 'N/A');
      r.drawSimpleRow('STATUS OF PLOT', `${fields.conversionStatus || fields.currentUsage || 'N/A'} (${fields.occupancyStatus || 'N/A'})`);
      r.drawSimpleRow('VALUATION METHOD', (fields.valuationMethod || 'Sale Comparison Method').toUpperCase());
      r.drawSimpleRow('VALUATION DATE', fields.dateOfValuation || 'N/A');
      r.drawSimpleRow('PRESENT VALUE (in Rs)', `Rs.${formatIndianCurrency(fields.fairMarketValueTotal || fields.presentMarketValueTotal || '0')}/-`);
      r.drawSimpleRow('VALUERS DETAILS', `${fields.representativeName ? fields.representativeName.toUpperCase() : ''}${fields.valuerQualifications ? ' ' + fields.valuerQualifications : ''}\n${fields.valuerAdditionalDetails || ''}\n${fields.registeredOfficeAddress || ''}`);
      r.advanceCursor(8);

      // Certificate closing + realisable value
      const certValue = fields.fairMarketValueTotal || fields.presentMarketValueTotal || '0';
      const realValue = fields.realisableValueTotal || '0';
      r.drawTextBlock(`After considering various important factors discussed above, we are of the opinion that the Realisable value of the property is INR. ${formatIndianCurrency(realValue)} (${rupeesInWords(parseFloat(realValue) || 0)}).`);
      r.advanceCursor(12);

      // Signature
      r.drawSignatureBlock([
        { text: 'Signature & Seal of Valuer' },
        { text: `Place - Bhubaneswar`, italic: true },
        { text: `Name of the Valuer - ${fields.representativeName || ''}${fields.valuerQualifications ? ' ' + fields.valuerQualifications : ''}`, bold: true },
      ]);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  VALUATION REPORT — SECTIONS 1-3 (statutory auto-text)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawCenteredTitle('VALUATION REPORT');
      r.advanceCursor(8);

      // ── 1. OBJECTIVE ──
      r.drawSectionHeader('1. OBJECTIVE:');
      tocPageMap['1.  OBJECTIVE'] = r.getPageCount();

      // Introductory paragraph for Section 1 (from sample)
      const objParagraph = fields.appointedBy
        ? `Pursuant to request from ${certOwner}, represented through ${fields.representativeName ? 'Mr. ' + fields.representativeName : 'its authorized representative'}${caseRefText}, to assess the fair market value of ${coverDesc} at ${certAddress}, currently owned by ${certOwner}, inspected on ${certDate}.`
        : `To assess the fair market value of ${coverDesc} at ${certAddress}, currently owned by ${certOwner}, inspected on ${certDate}.`;
      r.drawTextBlock(objParagraph);
      r.advanceCursor(6);

      r.drawTextBlock('1.1 VALUATION STANDARD', { bold: true });
      tocPageMap['    1.1  Valuation Standard'] = r.getPageCount();
      r.drawTextBlock('The entire valuation exercise has been carried out in accordance of Standard procedures laid down as per the International Valuation Standards.');
      r.advanceCursor(4);
      r.drawTextBlock('1.2 PURPOSE OF VALUATION', { bold: true });
      tocPageMap['    1.2  Purpose of Valuation'] = r.getPageCount();
      r.drawTextBlock(`The Valuation is required for the purpose of ${fields.purposeOfValuation || 'accessing the impartial and true Liquidation / Realisable Market value'} of the aforesaid property on the basis of market survey method as on the date of valuation.`);
      r.advanceCursor(4);
      r.drawTextBlock('1.3 CONFLICT OF INTEREST', { bold: true });
      tocPageMap['    1.3  Conflict of Interest'] = r.getPageCount();
      r.drawTextBlock('The valuer has no direct or indirect interest in the property valued, nor any personal interest or bias with respect to the parties involved.');
      r.advanceCursor(4);
      r.drawTextBlock('1.4 CURRENCY AND MEASUREMENT', { bold: true });
      tocPageMap['    1.4  Currency and Measurement'] = r.getPageCount();
      r.drawTextBlock('All amounts are in Indian Rupees (INR). Land is measured in Acres/Decimals/Sq. ft. as applicable.');
      r.advanceCursor(4);
      r.drawTextBlock('1.5 RESPONSIBILITY TO THIRD PARTIES', { bold: true });
      tocPageMap['    1.5  Responsibility to Third Parties'] = r.getPageCount();
      r.drawTextBlock('This report is prepared only for the stated purpose and the parties named herein.');
      r.advanceCursor(4);
      r.drawTextBlock('1.6 DISCLOSURE AND PUBLICATION', { bold: true });
      tocPageMap['    1.6  Disclosure and Publication'] = r.getPageCount();
      r.drawTextBlock('This valuation report or any reference thereof should not be used in any published document without the consent of the valuer.');
      r.advanceCursor(4);
      r.drawTextBlock('1.7 LIMITATIONS ON LIABILITY', { bold: true });
      tocPageMap['    1.7  Limitations on Liability'] = r.getPageCount();
      r.drawTextBlock('The valuer shall not be liable for any loss or damage arising from this report except to the extent that such loss or damage is caused by the valuer\'s negligence.');
      r.advanceCursor(8);

      // ── 2. SCOPE OF ENQUIRIES ──
      r.drawSectionHeader('2. SCOPE OF ENQUIRIES AND INVESTIGATION:');
      tocPageMap['2.  SCOPE OF ENQUIRIES AND INVESTIGATION'] = r.getPageCount();
      r.drawTextBlock('2.1 SITE INSPECTION', { bold: true });
      r.drawTextBlock(`Site inspection was carried out on ${fields.dateOfInspection || '________'}.`);
      r.advanceCursor(4);
      r.drawTextBlock('2.2 ENQUIRIES', { bold: true });
      r.drawTextBlock('Enquiries were made with local people, real estate agents, and brokers to assess the prevailing market conditions.');
      r.advanceCursor(4);
      r.drawTextBlock('2.3 LEGAL PARAMETERS OF PROPERTY', { bold: true });
      r.drawTextBlock('Documents and records relating to title, extent, and encumbrances were examined.');
      r.advanceCursor(4);
      r.drawTextBlock('2.4 ENVIRONMENTAL ASPECTS', { bold: true });
      r.drawTextBlock('The property was assessed for environmental conditions as observed during inspection.');
      r.advanceCursor(4);
      r.drawTextBlock('2.5 INFORMATION PROVIDED', { bold: true });
      r.drawTextBlock('Information was provided by the property owners, authorized representatives, and from public records.');
      r.advanceCursor(8);

      // ── 3. BASIS OF VALUATION ──
      r.drawSectionHeader('3. BASIS OF VALUATION:');
      tocPageMap['3.  BASIS OF VALUATION'] = r.getPageCount();
      r.drawTextBlock('The valuation is based on Fair Market Value as defined in IVS 104 -- the estimated amount for which an asset or liability should exchange on the valuation date between a willing buyer and a willing seller in an arm\'s length transaction, after proper marketing and where the parties had each acted knowledgeably, prudently and without compulsion.');
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  SECTIONS 4-12 (dynamic data from form)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

      // ── 4. BRIEF DESCRIPTION ──
      r.drawSectionHeader('4. BRIEF DESCRIPTION OF THE PROPERTY');
      tocPageMap['4.  BRIEF DESCRIPTION OF THE PROPERTY'] = r.getPageCount();
      // Introductory prose paragraph (matches sample format)
      if (fields.propertyDescription) {
        r.drawTextBlock(`The Property in consideration is ${fields.propertyDescription} conveniently located at ${fields.propertyAddress || '________'}.`);
        r.advanceCursor(6);
      }
      r.drawTextBlock('BASIC DETAILS OF THE PROPERTY', { bold: true });
      r.advanceCursor(4);
      r.drawSimpleRow('4.1  Applicant Name / Owners', fields.applicantName || fields.ownerName);
      r.drawSimpleRow('4.2  Type of Property', fields.propertyType);
      r.drawSimpleRow('     Current Usage', fields.currentUsage);
      r.drawSimpleRow('4.3  Site Address', fields.propertyAddress);
      r.drawSimpleRow('     Address as per Documents', fields.legalAddress);
      r.drawSimpleRow('4.8  Revenue Plot No', fields.revenuePlotNo);
      r.drawSimpleRow('     Khata No', fields.revenueKhataNo);
      r.drawSimpleRow('     Village (Mouza)', fields.revenueVillage);
      r.drawSimpleRow('     Tahasil', fields.revenueTahasil);
      r.drawSimpleRow('     Police Station', fields.revenuePS);
      r.drawSimpleRow('     District', fields.revenueDistrict);
      r.drawSimpleRow('     State', fields.revenueState);
      r.drawSimpleRow('4.10 Classification of Area', fields.classificationArea);
      r.drawSimpleRow('4.13 Conversion Status', fields.conversionStatus);
      r.drawSimpleRow('4.14 Boundaries (North)', fields.boundNorth);
      r.drawSimpleRow('     Boundaries (South)', fields.boundSouth);
      r.drawSimpleRow('     Boundaries (East)', fields.boundEast);
      r.drawSimpleRow('     Boundaries (West)', fields.boundWest);
      r.drawSimpleRow('4.15 Extent of Site', fields.extentOfSite);
      r.drawSimpleRow('4.16 Occupancy Status', fields.occupancyStatus);
      r.advanceCursor(8);

      // ── 5. TOWN PLANNING ──
      r.drawSectionHeader('5. TOWN PLANNING PARAMETERS:');
      tocPageMap['5.  TOWN PLANNING PARAMETERS'] = r.getPageCount();
      r.drawSimpleRow('Master Plan Provision', fields.masterPlanProvision);
      r.drawSimpleRow('Approved Plan Date', fields.approvedPlanDate);
      r.drawSimpleRow('Approved Plan Authority', fields.approvedPlanAuthority);
      r.drawSimpleRow('Development Controls', fields.developmentControls);
      r.drawSimpleRow('Ground Coverage', fields.groundCoverage);
      r.drawSimpleRow('Surrounding Land Use', fields.surroundingLandUse);
      r.advanceCursor(8);

      // ── 6. LEGAL ASPECTS ──
      r.drawSectionHeader('6. DOCUMENT DETAILS AND LEGAL ASPECTS OF THE PROPERTY:');
      tocPageMap['6.  DOCUMENT DETAILS AND LEGAL ASPECTS'] = r.getPageCount();
      r.drawSimpleRow('Ownership Documents', fields.ownershipDocuments);
      r.drawSimpleRow('Owner as per ROR', fields.ownerAsPerROR);
      r.drawSimpleRow('Easement Agreement', fields.easementAgreement);
      r.drawSimpleRow('Acquisition Notification', fields.acquisitionNotification);
      r.drawSimpleRow('Road Widening Notification', fields.roadWideningNotification);
      r.drawSimpleRow('Heritage Restriction', fields.heritageRestriction);
      r.drawSimpleRow('Transferability', fields.transferability);
      r.drawSimpleRow('Existing Mortgages / Charge', fields.existingMortgages);
      r.drawSimpleRow('Guarantee Issued', fields.guaranteeIssued);
      r.drawSimpleRow('SARFAESI Compliant', fields.sarfaesiCompliant);
      r.drawSimpleRow('Disputes / Dues', fields.disputesDues);
      r.advanceCursor(8);

      // ── 7. INFRASTRUCTURE ──
      r.drawSectionHeader('7. FUNCTIONAL AND INFRASTRUCTURE ASPECTS OF THE PROPERTY:');
      tocPageMap['7.  FUNCTIONAL AND INFRASTRUCTURE ASPECTS'] = r.getPageCount();
      r.drawSimpleRow('Water Supply', fields.waterSupply);
      r.drawSimpleRow('Sewerage', fields.sewerage);
      r.drawSimpleRow('Storm Water Drainage', fields.stormWater);
      r.drawSimpleRow('Solid Waste Management', fields.solidWaste);
      r.drawSimpleRow('Electricity', fields.electricity);
      r.drawSimpleRow('Road Connectivity', fields.roadConnectivity);
      r.drawSimpleRow('Nearest Police Station', fields.policeStationDist);
      r.drawSimpleRow('Nearest Bus Stop', fields.busStopDist);
      r.drawSimpleRow('Nearest School', fields.schoolDist);
      r.drawSimpleRow('Nearest College', fields.collegeDist);
      r.advanceCursor(8);

      // ── 8. SOCIO-CULTURAL ──
      r.drawSectionHeader('8. SOCIO-CULTURAL ASPECTS OF THE PROPERTY:');
      tocPageMap['8.  SOCIO-CULTURAL ASPECTS'] = r.getPageCount();
      r.drawSimpleRow('Social Structure', fields.socialStructure);
      r.drawSimpleRow('Social Infrastructure', fields.socialInfrastructure);
      r.advanceCursor(8);

      // ── 9. ENVIRONMENTAL ──
      r.drawSectionHeader('9. ENVIRONMENTAL FACTORS AFFECTING THE PROPERTY:');
      tocPageMap['9.  ENVIRONMENTAL FACTORS'] = r.getPageCount();
      r.drawSimpleRow('Eco-friendly Materials', fields.ecoMaterials);
      r.drawSimpleRow('Rain Water Harvesting', fields.rainWaterHarvesting);
      r.drawSimpleRow('Solar System', fields.solarSystem);
      r.drawSimpleRow('Environmental Pollution', fields.environmentalPollution);
      r.advanceCursor(8);

      // ── 10. MARKETABILITY ──
      r.drawSectionHeader('10. MARKETABILITY ASPECTS OF THE PROPERTY:');
      tocPageMap['10. MARKETABILITY OF THE PROPERTY'] = r.getPageCount();
      r.drawSimpleRow('Locational Attributes', fields.locationalAttributes);
      r.drawSimpleRow('Scarcity', fields.scarcity);
      r.drawSimpleRow('Demand & Supply', fields.demandSupply);
      r.advanceCursor(8);

      // ── 11. ARCHITECTURAL ──
      r.drawSectionHeader('11. ARCHITECTURAL ASPECTS:');
      tocPageMap['11. ARCHITECTURAL ASPECTS'] = r.getPageCount();
      r.drawSimpleRow('Architectural Aspects', fields.architecturalAspects);
      r.advanceCursor(8);

      // ── 12. ENGINEERING ──
      r.drawSectionHeader('12. ENGINEERING ASPECTS OF THE PROPERTY:');
      tocPageMap['12. ENGINEERING ASPECTS'] = r.getPageCount();
      r.drawSimpleRow('Type of Construction', fields.constructionType);
      r.drawSimpleRow('Materials Used', fields.materialsUsed);
      r.drawSimpleRow('Specifications', fields.specifications);
      r.drawSimpleRow('Maintenance Issues', fields.maintenanceIssues);
      r.drawSimpleRow('Age of Building', fields.ageOfBuilding ? `${fields.ageOfBuilding} Years` : 'N/A');
      r.drawSimpleRow('Residual Life', fields.residualLife ? `${fields.residualLife} Years` : 'N/A');
      r.drawSimpleRow('Extent of Deterioration', fields.extentDeterioration);
      r.drawSimpleRow('Structural Safety', fields.structuralSafety);
      r.drawSimpleRow('Natural Disaster Protection', fields.naturalDisasterProtection);
      r.drawSimpleRow('Visible Damage', fields.visibleDamage);
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  SECTION 13: VALUATION (with sub-sections 13.1-13.6)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.drawSectionHeader('13. VALUATION APPROACHES & METHODOLOGY ADOPTED');
      tocPageMap['13. VALUATION APPROACHES & METHODOLOGY'] = r.getPageCount();
      r.advanceCursor(4);

      r.drawTextBlock('13.1 METHODOLOGY', { bold: true });
      tocPageMap['    13.1  Methodology'] = r.getPageCount();
      r.drawTextBlock(`${fields.valuationMethod || 'Sale Comparison Method coupled with Replacement Cost Approach'} has been adopted for the valuation of the subject property. The market approach is based on actual market transactions of comparable properties in the vicinity. The cost approach estimates the replacement cost of the improvements less depreciation.`);
      r.advanceCursor(4);

      r.drawTextBlock('13.2 VALUATION BASES', { bold: true });
      tocPageMap['    13.2  Valuation Bases'] = r.getPageCount();
      r.drawTextBlock('The valuation has been carried out on the basis of Fair Market Value which is defined as the price that a property would bring in a competitive and open market under all conditions requisite to a fair sale -- the buyer and seller each acting prudently and knowledgeably, and assuming the price is not affected by undue stimulus.');
      r.advanceCursor(4);

      r.drawTextBlock('13.3 VALUATION CONSIDERATIONS', { bold: true });
      tocPageMap['    13.3  Valuation Considerations'] = r.getPageCount();
      r.drawTextBlock('In arriving at the valuation, the following factors have been considered: location and accessibility, size and shape of the plot, nature of surrounding development, availability of civic amenities, demand and supply position, comparable sale instances, and applicable government rates.');
      r.advanceCursor(4);

      r.drawTextBlock('13.4 VALUATION ASSUMPTIONS', { bold: true });
      tocPageMap['    13.4  Valuation Assumptions'] = r.getPageCount();
      r.drawTextBlock('The valuation assumes that the property has a clear and marketable title, that there are no hidden or unapparent conditions of the property that would affect value, that the information provided by the client is true and correct, and that the property conforms to applicable government regulations.');
      r.advanceCursor(4);

      r.drawTextBlock('13.5 VALUATION ANALYSIS', { bold: true });
      tocPageMap['    13.5  Valuation Analysis'] = r.getPageCount();
      r.drawTextBlock('Based on the market survey conducted in the area and analysis of comparable sale transactions, the prevailing market rates have been assessed. The government guideline rates as published by the Registration Department have also been considered. After due consideration of all relevant factors including location, accessibility, amenities, and market conditions, the values have been arrived at as detailed below.');
      r.advanceCursor(6);

      r.drawTextBlock('13.6 DETAILS OF VALUATION', { bold: true });
      tocPageMap['    13.6  Details of Valuation'] = r.getPageCount();
      r.advanceCursor(4);

      // Dynamic valuation rows table (if manual rows exist)
      if (fields.valuationRows && fields.valuationRows.length > 0) {
        const headers = ['Sl No', 'Plot No', 'Khata No', 'Area', 'Rate/Unit', 'Guideline Value', 'Fair Market Value'];
        const rows = fields.valuationRows.map((row: ValuationRow, i: number) => [
          String(i + 1),
          row.plotNo || '-',
          row.khataNo || '-',
          row.area || '-',
          row.rate || '-',
          row.guidelineValue || '-',
          row.fairMarketValue || '-',
        ]);

        r.drawDataTable(headers, rows);
        r.advanceCursor(6);
      }

      // Annexure reference
      if (fields.annexureEnabled && fields.annexures.length > 0) {
        const firstAnnexure = fields.annexures.find((a: AnnexureItem) => a.parsedData);
        const annexureLabel = firstAnnexure ? firstAnnexure.label : fields.annexures[0].label;
        r.drawTextBlock(`The detailed plot-by-plot calculations and area abstracts are provided in Annexure ${annexureLabel}.`);
        r.advanceCursor(6);
      }

      // Valuation summary totals
      r.drawSimpleRow('Total Govt. Guideline / Book Value', `Rs.${formatIndianCurrency(fields.bookValueTotal || '0')}/-`);
      r.drawSimpleRow('Total Fair Market Value', `Rs.${formatIndianCurrency(fields.fairMarketValueTotal || '0')}/- (${rupeesInWords(parseFloat(fields.fairMarketValueTotal) || 0)})`);
      r.drawSimpleRow('Total Present Market Value', `Rs.${formatIndianCurrency(fields.presentMarketValueTotal || '0')}/-`);
      r.drawSimpleRow('Realisable / Liquidation Value', `Rs.${formatIndianCurrency(fields.realisableValueTotal || '0')}/- (${rupeesInWords(parseFloat(fields.realisableValueTotal) || 0)})`);
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  SECTION 14: SITE LOCATION (reference)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.drawSectionHeader('14. SITE LOCATION:');
      tocPageMap['14. SITE LOCATION'] = r.getPageCount();
      if (fields.latitude || fields.longitude) {
        r.drawSimpleRow('Latitude', fields.latitude || 'N/A');
        r.drawSimpleRow('Longitude', fields.longitude || 'N/A');
      }
      r.drawTextBlock('Site location maps and photographs are enclosed herewith at the end of this report.');
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  SECTION 15: ASSUMPTION & LIMITATION (matches sample)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.drawSectionHeader('15. ASSUMPTION & LIMITATION.');
      tocPageMap['15. ASSUMPTIONS & LIMITATIONS'] = r.getPageCount();
      r.advanceCursor(4);
      r.drawTextBlock('For this report we have carried out analysis and assessments of the market(s) under consideration and the demand-supply for the residential and commercial sectors in general.');
      r.advanceCursor(4);
      r.drawTextBlock('This report is not based on comprehensive market research of the overall market for all possible situations. We have covered specific market and situations, which are highlighted in the report. The opinions expressed in the report are subject to the limitations mentioned in this para.');
      r.advanceCursor(4);
      r.drawTextBlock('It should be noted that value assessments are based upon the facts and evidence available at the date of assessment. Changes in socio-economic and political conditions could result in a substantially different situation that the value assessments be periodically reviewed.');
      r.advanceCursor(4);
      r.drawTextBlock(`The report is only for the purpose of assessing fair market value of the property as per detail provided by the client and for the exclusive use of ${certOwner}, and should not be used by any other person or for any other purpose. Report provided is limited to opinion of value and do not constitute an audit, a due diligence and tax related services. Through this report we do not express an opinion on the financial information of the business of any party, including the owners and its affiliates and subsidiaries. The report is prepared solely for the purpose stated, and should not be used for any other purpose.`);
      r.advanceCursor(4);
      r.drawTextBlock('No investigation of the title of the assets has been made and owners claims to the assets are assumed to be valid. It is assumed that the property is free from all encumbrance.');
      r.advanceCursor(4);
      r.drawTextBlock('It is also assumed, that there is no liability of outstanding on the owners taxation or any other expense towards statutory compliance for realization.');
      r.advanceCursor(4);
      r.drawTextBlock('In the preparations of the report, we have relied on the following information:');
      r.drawTextBlock('\u2022 The information provided by the owner\'s or their representative appointed / its affiliates subsidiaries during the visits.');
      r.drawTextBlock('\u2022 Recent data on the industry segments and market projections.');
      r.advanceCursor(4);
      r.drawTextBlock('The value assessed is my best opinion under the current circumstances and market scenario and is not a guarantee. Real estate prices are subject to wide fluctuations and the valuation need to be reviewed at suitable regular intervals.');
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  CONCLUSION
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.drawSectionHeader('CONCLUSION');
      tocPageMap['CONCLUSION'] = r.getPageCount();
      r.advanceCursor(4);
      const fmvVal = parseFloat(fields.fairMarketValueTotal) || 0;
      const realVal = parseFloat(fields.realisableValueTotal) || 0;
      const guideVal = parseFloat(fields.bookValueTotal) || 0;
      r.drawTextBlock('The present market value of a property is the price which a willing buyer will pay to a willing seller considering the risks involved at the reality and authenticity of the property, including thorough investigation about its genuineness of existence and all that required. Liquidation value of the assets in present consideration, is estimated in a reasonable manner and judiciously on the basis of facts and circumstances observed by us & estimation of benefits, subject to its propriety, on above consideration. It will of course vary from professionals opinion and case to case, place to place, location to location and for different characteristics too. We assess it accordingly, based on the above considerations.');
      r.advanceCursor(6);
      r.drawTextBlock(`After considering various important factor discussed above, we are of the opinion that the fair market Value of ${coverDesc} as per the current date at ${certAddress}, currently owned by ${certOwner}`);
      r.advanceCursor(4);
      r.drawTextBlock(`Present Market Value is INR. ${formatIndianCurrency(fields.fairMarketValueTotal || '0')}. (${rupeesInWords(fmvVal).toUpperCase()}).`, { bold: true });
      r.advanceCursor(2);
      if (fields.realisableValueTotal) {
        r.drawTextBlock(`Realisable value is INR. ${formatIndianCurrency(fields.realisableValueTotal || '0')}. (${rupeesInWords(realVal).toUpperCase()}).`, { bold: true });
        r.advanceCursor(2);
      }
      if (fields.bookValueTotal) {
        r.drawTextBlock(`Govt Guideline Value is INR. ${formatIndianCurrency(fields.bookValueTotal || '0')}. (${rupeesInWords(guideVal).toUpperCase()}).`, { bold: true });
        r.advanceCursor(2);
      }
      r.advanceCursor(8);

      // Conclusion signature
      r.drawSignatureBlock([
        { text: `Date: ${fields.dateOfValuation || '________'}` },
        { text: 'Signature & Seal of Valuer' },
        { text: `Place: Bhubaneswar` },
        { text: `Name of the Valuer - ${fields.representativeName ? fields.representativeName.toUpperCase() : ''}${fields.valuerQualifications ? ' ' + fields.valuerQualifications.toUpperCase() : ''}`, bold: true },
      ]);

      // ── Remarks ──
      if (fields.remarks) {
        r.drawSectionHeader('REMARKS');
        r.drawTextBlock(fields.remarks);
        r.advanceCursor(8);
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  DECLARATION AND UNDERTAKING (exact 16 clauses from sample)
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawSectionHeader('DECLARATION AND UNDERTAKING');
      tocPageMap['DECLARATION AND UNDERTAKING'] = r.getPageCount();
      r.advanceCursor(6);
      r.drawTextBlock(`I ${fields.representativeName ? 'Mr. ' + fields.representativeName : 'Mr. ________'}${fields.representativeFatherName ? ', S/o: ' + fields.representativeFatherName : ''} do hereby solemnly affirm and state that:`, { bold: true });
      r.advanceCursor(4);
      const declarations = [
        'I am citizen of India.',
        'I will not undertake valuation of any assets in which I have a direct or indirect interest or become so interested at any time during a period of three years prior to my appointments as valuer or three years after the valuation of assets was conducted by me.',
        `The information furnished in my valuation report dated ${fields.dateOfValuation || '________'} is true & correct to the best of my knowledge & belief & I have made an impartial & true valuation of the property.`,
        `I have personally inspected the property on ${fields.dateOfInspection || '________'}. The work is not sub-contracted to any other valuer & carried out by myself.`,
        'I have not been removed from service/employment earlier.',
        'I have not been convicted of any offence & sentenced to a term of imprisonment.',
        'I have not been declared to be unsound mind.',
        'I have not been found guilty of misconduct in my professional capacity.',
        'I am not an undischarged bankrupt, or have not applied to be adjudicated as a bankrupt.',
        'I have not undischarged insolvent.',
        'I have not been levied a penalty under section 271J of Income-Tax Act, 1961 (43 of 1961) and time limit for filing appeal before commissioner of Income Tax (Appeals) or Income-Tax Appellate Tribunal, as the case may be has expired, or such penalty has been confirmed by Income-Tax Appellate Tribunal, and five years have not elapsed after levy of such penalty.',
        'I have not been convicted of an offence connected with any proceeding under the Income-Tax Act 1961, wealth Tax Act 1957 or Gift Tax Act 1958.',
        'My PAN Card number as applicable is AOVPP5837R.',
        'I have not concealed or suppressed any material information, facts and records and I have made a complete and full disclosure.',
        'I have read the International Valuation Standards (IVS) & the report submitted to the Bank for the respective asset class is in conformity to the "Standards" enshrined for valuation in the IVS in "General Standards" & "Asset Standards" as applicable.',
        'I abide by the Model Code of Conduct for empanelment of valuer in the Bank.',
        'I am not registered under Section 34 AB of the Wealth Tax Act, 1957.',
        'I am valuer registered with Insolvency & Bankruptcy Board of India (IBBI).',
        'I am the authorized official of the firm who is competent to sign this valuation report.',
        'Further, I hereby provide the following information.',
      ];
      for (let i = 0; i < declarations.length; i++) {
        r.drawTextBlock(declarations[i]);
        r.advanceCursor(3);
      }
      r.advanceCursor(8);

      // Declaration signature
      r.drawSignatureBlock([
        { text: `Date: ${fields.dateOfValuation || '________'}` },
        { text: 'Signature & Seal of Valuer' },
        { text: 'Place: Bhubaneswar' },
        { text: `Name of the Valuer - ${fields.representativeName ? fields.representativeName.toUpperCase() : ''}${fields.valuerQualifications ? ' ' + fields.valuerQualifications.toUpperCase() : ''}`, bold: true },
      ]);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  PROPERTY PHOTOGRAPHS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (propImageBytes.length > 0) {
        r.newPage();
        r.drawCenteredTitle('PROPERTY PHOTOGRAPHS');
      tocPageMap['PROPERTY PHOTOGRAPHS'] = r.getPageCount();
        r.advanceCursor(6);

        for (let i = 0; i < propImageBytes.length; i += 2) {
          const name1 = fields.propertyImageNames?.[i] || '';
          const caption1 = name1 ? `Figure ${i + 1} - ${name1.toUpperCase()}` : `Figure ${i + 1}`;
          const img2 = i + 1 < propImageBytes.length ? propImageBytes[i + 1] : null;
          const name2 = fields.propertyImageNames?.[i + 1] || '';
          const caption2 = name2 ? `Figure ${i + 2} - ${name2.toUpperCase()}` : `Figure ${i + 2}`;

          await r.drawImagePair(propImageBytes[i], caption1, img2, caption2);
          r.advanceCursor(2);
        }
      }

      // ── Sketch Maps ──
      if (sketchBytesList && sketchBytesList.length > 0) {
        for (let i = 0; i < sketchBytesList.length; i++) {
          const sBytes = sketchBytesList[i];
          if (sBytes) {
            r.checkPageBreak(300);
            r.drawCenteredTitle(`SKETCH MAP${sketchBytesList.length > 1 ? ` ${i + 1}` : ''}`);
            r.advanceCursor(4);
            await r.drawImageBlock(sBytes, { maxWidth: 450, maxHeight: 450, centered: true });
            r.advanceCursor(4);
          }
        }
      }

      // ── Location Map ──
      if (locationBytes && locationBytes.length > 0) {
        r.checkPageBreak(300);
        r.drawCenteredTitle('LOCATION MAP');
        r.advanceCursor(4);
        await r.drawImageBlock(locationBytes, { maxWidth: 450, maxHeight: 450, centered: true });
        if (fields.latitude || fields.longitude) {
          r.drawTextBlock(`Lat: ${fields.latitude || 'N/A'}, Long: ${fields.longitude || 'N/A'}`, { bold: true, align: 'center' });
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  ANNEXURES
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      if (fields.annexureEnabled && fields.annexures.length > 0) {
        for (const annexure of fields.annexures) {
          if (annexure.parsedData && annexure.parsedData.headers.length > 0) {
            r.newPage();
            r.drawCenteredTitle(annexure.title ? `ANNEXURE ${annexure.label} - ${annexure.title.toUpperCase()}` : `ANNEXURE ${annexure.label}`);
            tocPageMap[`ANNEXURE ${annexure.label}${annexure.title ? ': ' + annexure.title.toUpperCase() : ''}`] = r.getPageCount();
            r.advanceCursor(8);
            r.drawDataTable(annexure.parsedData.headers, annexure.parsedData.rows);
          }
        }
      }

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  ANNEXURE I: GENERAL PRINCIPLES AND LIMITING CONDITIONS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawCenteredTitle('ANNEXURE I: GENERAL PRINCIPLES AND LIMITING CONDITIONS');
      r.advanceCursor(8);
      r.drawTextBlock('General Principles Adopted and Limiting Conditions in the Preparation of Valuations and Reports. These are the general principles and limiting conditions upon which our valuation and reports are normally prepared; they apply unless we have specifically mentioned otherwise in the body of the report.');
      r.advanceCursor(6);
      r.drawTextBlock('CONFIDENTIALITY', { bold: true });
      r.drawTextBlock('Our valuation and reports are confidential to the client or to whom they are addressed for the specific purpose to which they refer. They may be disclosed to other professional advisors assisting the client in respect of that purpose, but the client shall not disclose the report to any other party. No responsibility is accepted to any other party and neither the whole, nor any part, nor reference thereto may be included in any published document, statement or circular, or published in any way, nor in any communication with third parties, without our prior written approval of the form and context in which it will appear.');
      r.advanceCursor(4);
      r.drawTextBlock('USE OF REPORT', { bold: true });
      r.drawTextBlock('The opinion of value expressed in this Report shall be used for the purpose stated in this Report only. We are not responsible for any consequences arising from the Valuation being quoted out of context.');
      r.advanceCursor(4);
      r.drawTextBlock('SOURCE OF INFORMATION', { bold: true });
      r.drawTextBlock('Where it is stated in the Report that information has been supplied by the sources listed, this information is believed to be reliable and no responsibility is accepted should it prove incorrect. All other information stated without being attributed directly to another party is obtained from our searches of documents or enquiries with the relevant authorities. This Report has been prepared on the basis that full disclosure of all information and facts which may affect the Valuation have been made known to ourselves and we cannot accept any liability or responsibility in any event, unless such full disclosure has been made.');
      r.advanceCursor(4);
      r.drawTextBlock('LEGAL TITLE', { bold: true });
      r.drawTextBlock('Whilst we may have inspected the title of the property as recorded in the Register Document of Title, we cannot accept any responsibility for its legal validity.');
      r.advanceCursor(4);
      r.drawTextBlock('TOWN PLANNING AND OTHER STATUTORY REGULATIONS', { bold: true });
      r.drawTextBlock('Whilst we may make verbal enquiries or gather information on Town Planning, we do not normally carry out requisitions with the various public authorities to confirm that the property is not adversely affected by any public schemes such as road and drainage improvements. If reassurance is required, we recommend that verification be obtained from your lawyers or other professional advisors.');
      r.drawTextBlock('Our valuation has been prepared on the basis and any improvements thereon comply with all relevant statutory regulations. It is assumed that they have been, or will be issued with a Certificate of Fitness for Occupation by the competent authority.');
      r.advanceCursor(4);
      r.drawTextBlock('LEASES AND TENANCIES', { bold: true });
      r.drawTextBlock('Enquiries as to the financial standing of actual or prospective lessees or tenants are not normally made unless specifically requested. Where properties are valued with the benefit of lettings, it is therefore assumed that the lessees or tenants are capable of meeting their obligations under the lease or tenancy and that there are no arrears of rent or undisclosed breaches of covenant.');
      r.advanceCursor(4);
      r.drawTextBlock('DEVELOPMENT AGREEMENTS', { bold: true });
      r.drawTextBlock('Unless otherwise stated, no allowances are made in our valuation for any joint venture agreement, development right agreement or other similar contracts.');
      r.advanceCursor(4);
      r.drawTextBlock('SITE SURVEYS', { bold: true });
      r.drawTextBlock('We have conducted boundary checks, and, we assume that the dimensions correspond with those shown in the title document, certified plan or any relevant agreement.');
      r.advanceCursor(4);
      r.drawTextBlock('STRUCTURAL SURVEYS', { bold: true });
      r.drawTextBlock('We have neither carried out a building survey nor any testing of services, nor have we inspected those parts of the property which are inaccessible. We cannot express an opinion about or advice upon the condition of uninspected parts and this Report should not be taken as making any implied representation or statement about such parts.');
      r.advanceCursor(8);

      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      //  ANNEXURE II: GENERAL ASSUMPTIONS
      // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      r.newPage();
      r.drawCenteredTitle('ANNEXURE II: GENERAL ASSUMPTIONS');
      r.advanceCursor(8);
      r.drawTextBlock('We assume that information provided by client or its representative for this Valuation for all relevant projects is true and accurate. It includes details of measurements of land and built up area, etc.');
      r.advanceCursor(4);
      r.drawTextBlock('We have not gone through the legal aspects like documents of title deed, lease deed, revenue records, court matters (if any), and documentation like joint development with other companies. We also assume for this valuation assignment that the title and development rights of all the properties lies with the Company and is clear, marketable and free of all encumbrances, restrictions, easements or charges which may have detrimental effect upon the value of the property. It is also assumed that company has paid all property related taxes.');
      r.advanceCursor(4);
      r.drawTextBlock('We have neither carried out any soil testing nor structural surveys nor are we experts in the field of structural survey. Therefore, we do not give any assurance that properties are free from structural defect. If any investigation identifies any structural defect in the property our report may require revision. Neither are we the experts in the town planning to factor the town planning aspects in the project. Sewers, main services and the roads giving access to the property have been provided.');
      r.advanceCursor(4);
      r.drawTextBlock('We assumed that all the constructed structures and proposed construction is/will be free from harmful materials and/or techniques. Our valuation is on the basis that no such materials or techniques have been used.');
      r.advanceCursor(4);
      r.drawTextBlock('Unless advised by the company or representative of the company, we do not normally make allowance for any liability already incurred, but not yet discharged, in respect of balance land cost, completed works, or obligations in favour of contractors, subcontractors or any other professional.');
      r.advanceCursor(4);
      r.drawTextBlock('Unless advised by the company or representative of the company, no allowance is made for any expense of realization or for taxation, which may arise in the event of a disposal. The property is considered as if free and clears of all mortgages or other charges that may be secured thereon.');
      r.advanceCursor(8);

      // Annexure II signature
      r.drawSignatureBlock([
        { text: `Date: ${fields.dateOfValuation || '________'}` },
        { text: 'Signature & Seal of Valuer' },
        { text: 'Place: Bhubaneswar' },
        { text: `Name of the Valuer - ${fields.representativeName ? fields.representativeName.toUpperCase() : ''}${fields.valuerQualifications ? ' ' + fields.valuerQualifications.toUpperCase() : ''}`, bold: true },
      ]);

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
          <head><title>Generating IBBI PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #b8860b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating IBBI-IVS PDF Preview...</p>
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

    try {
      const blob = await handleGeneratePDF();
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
    }
  };

  const handleDownloadPDF = async () => {
    setMessage({ type: 'success', text: 'Generating PDF for download...' });
    try {
      const blob = await handleGeneratePDF();
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fields.applicantName ? fields.applicantName.replace(/\s+/g, '_') : 'IBBI'}_Valuation_Report_${projectId}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      }
      setMessage(null);
    } catch (err: any) {
      setMessage({ type: 'error', text: 'PDF Error: ' + (err?.message || String(err)) });
    }
  };

  // Feature flag: AI Assist panel visibility
  const aiAssistEnabled = process.env.NEXT_PUBLIC_AI_ASSIST_ENABLED === 'true';

  // ── Main Return ──
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] rounded-2xl border border-neutral-200 shadow-md w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#b8860b] border-t-transparent"></div>
        <p className="mt-4 text-sm font-bold text-[#0f2038]">{loadingText}</p>
      </div>
    );
  }

  return (
    <div className={`flex ${aiAssistEnabled ? 'gap-4' : 'gap-6'} items-start w-full`} ref={reportRef}>
      {message && (
        <div className={`fixed top-0 left-0 right-0 z-[100] px-6 py-3 text-sm font-semibold text-center shadow-lg ${message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-4 text-white/80 hover:text-white">&times;</button>
        </div>
      )}

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
               {fields.institutionCategory && fields.institutionCategory !== 'IBBI' && fields.institutionCategory !== 'IBBI_IVS' && (
                 <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                   {fields.institutionCategory}
                 </span>
               )}
               <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                 Service: {(SERVICES_LIST.find(s => s.id === fields.serviceType)?.title || fields.serviceType || 'Land Valuation').replace(/_/g, ' ')}
               </span>
               <span className="text-xs font-bold text-[#0f2038] bg-white px-3 py-1.5 rounded-full border border-[#dee2e6] shadow-sm flex items-center gap-1.5 uppercase">
                 Subject: {(fields.subjectType || 'Residential Land').replace(/_/g, ' ')}
               </span>
             </div>
          </div>
          <button
            type="button"
            onClick={handleResetWizard}
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

          {/* ── Section 1: Objective & Dates ── */}
          <Section title="Objective & Static Declarations" number={1}>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-xs text-blue-800">Sections 1 (Objective), 2 (Scope), and 3 (Basis) are standard IBBI-IVS statutory texts. They will be <strong>auto-generated</strong> in the PDF. Fill the Cover Page, Certificate, and Declaration fields below.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Date of Inspection">
                <input type="date" value={fields.dateOfInspection} onChange={e => handleChange('dateOfInspection', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Date of Valuation Report">
                <input type="date" value={fields.dateOfValuation} onChange={e => handleChange('dateOfValuation', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Reference No">
                <input type="text" value={fields.refNo} onChange={e => handleChange('refNo', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Representative Name (for Declaration)">
                <input type="text" value={fields.representativeName} onChange={e => handleChange('representativeName', e.target.value)} className={inputCls} placeholder="Name of inspecting representative" disabled={isReadOnly} />
              </Field>
              <Field label="Representative's Father's Name">
                <input type="text" value={fields.representativeFatherName} onChange={e => handleChange('representativeFatherName', e.target.value)} className={inputCls} placeholder="Father's name of representative" disabled={isReadOnly} />
              </Field>
              <Field label="Valuer Qualifications (Appears next to name)">
                <input type="text" value={fields.valuerQualifications} onChange={e => handleChange('valuerQualifications', e.target.value)} className={inputCls} placeholder="e.g. , (B.TECH, Civil) FIIV, AIV" disabled={isReadOnly} />
              </Field>
              <Field label="Additional Valuer Details (Each line will appear centered below)" span={2}>
                <textarea rows={3} value={fields.valuerAdditionalDetails} onChange={e => handleChange('valuerAdditionalDetails', e.target.value)} className={inputCls + ' resize-none'} placeholder="e.g.\nRegistered Valuer, IBBI Govt. of India (Regd. No.-...)\nM.SC(Real Estate Valuation)..." disabled={isReadOnly} />
              </Field>
              <Field label="Registered Office Address">
                <input type="text" value={fields.registeredOfficeAddress} onChange={e => handleChange('registeredOfficeAddress', e.target.value)} className={inputCls} placeholder="e.g. AL 71 OSHB COLONY VSS NAGAR BHUBANESWAR 751007" disabled={isReadOnly} />
              </Field>
              <Field label="Registered Office Telephone">
                <input type="text" value={fields.registeredOfficeTel} onChange={e => handleChange('registeredOfficeTel', e.target.value)} className={inputCls} placeholder="e.g. (0674)3594365" disabled={isReadOnly} />
              </Field>
              <Field label="Case Reference No" span={2}>
                <input type="text" value={fields.caseReferenceNo || ''} onChange={e => handleChange('caseReferenceNo', e.target.value)} className={inputCls} placeholder="e.g. C.P.(IB) No. 300/KB/2017" disabled={isReadOnly} />
              </Field>
              <Field label="Appointed By">
                <input type="text" value={fields.appointedBy || ''} onChange={e => handleChange('appointedBy', e.target.value)} className={inputCls} placeholder="e.g. CA Sonu Jain (Insolvency Professional)" disabled={isReadOnly} />
              </Field>
              <Field label="Appointment Date">
                <input type="date" value={fields.appointmentDate || ''} onChange={e => handleChange('appointmentDate', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Purpose of Valuation" span={2}>
                <input type="text" value={fields.purposeOfValuation || ''} onChange={e => handleChange('purposeOfValuation', e.target.value)} className={inputCls} placeholder="To assess the Fair Market Value for..." disabled={isReadOnly} />
              </Field>
              <Field label="Valuation Method" span={2}>
                <input type="text" value={fields.valuationMethod || ''} onChange={e => handleChange('valuationMethod', e.target.value)} className={inputCls} placeholder="Sale Comparison Method coupled with..." disabled={isReadOnly} />
              </Field>
            </div>
          </Section>

          {/* ── Section 4: Brief Description ── */}
          <Section title="Brief Description of the Property" number={4}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Applicant / Owner Name(s)" span={2}>
                <textarea value={fields.applicantName} onChange={e => handleChange('applicantName', e.target.value)} className={inputCls} rows={2} placeholder="Full list of owners" disabled={isReadOnly} />
              </Field>
              <Field label="Managing Director">
                <select value={fields.hasManagingDirector || 'no'} onChange={e => handleChange('hasManagingDirector', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </Field>
              {fields.hasManagingDirector === 'yes' && (
                <Field label="Managing Director's Name">
                  <input type="text" value={fields.managingDirectorName || ''} onChange={e => handleChange('managingDirectorName', e.target.value)} className={inputCls} placeholder="e.g. MR. RAJENDRA PRASAD AGARWAL" disabled={isReadOnly} />
                </Field>
              )}
              <Field label="Type of Property">
                <select value={fields.propertyType} onChange={e => handleChange('propertyType', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="Defunct Industrial Unit">Defunct Industrial Unit</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Agricultural Land">Agricultural Land</option>
                  <option value="Residential cum Commercial">Residential cum Commercial</option>
                  <option value="Vacant Plot">Vacant Plot</option>
                </select>
              </Field>
              <Field label="Current Usage">
                <select value={fields.currentUsage} onChange={e => handleChange('currentUsage', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="Vacant">Vacant</option>
                  <option value="Self Occupied">Self Occupied</option>
                  <option value="Rented">Rented</option>
                  <option value="Under Construction">Under Construction</option>
                  <option value="Industrial Use">Industrial Use</option>
                  <option value="Agricultural">Agricultural</option>
                </select>
              </Field>
              <Field label="Address Prefix (Cover Page)">
                <div className="flex flex-col gap-2">
                  <select value={fields.addressPrefixType || 'none'} onChange={e => handleChange('addressPrefixType', e.target.value)} className={selectCls} disabled={isReadOnly}>
                    <option value="none">None</option>
                    <option value="multiple_plots">OVER MULTIPLE PLOTS</option>
                    <option value="idco_plot">OVER IDCO PLOT</option>
                    <option value="other">Other (Custom)</option>
                  </select>
                  {fields.addressPrefixType === 'other' && (
                    <input type="text" value={fields.customAddressPrefix || ''} onChange={e => handleChange('customAddressPrefix', e.target.value)} className={inputCls} placeholder="Custom prefix..." disabled={isReadOnly} />
                  )}
                </div>
              </Field>
              <Field label="Site Address">
                <textarea value={fields.propertyAddress} onChange={e => handleChange('propertyAddress', e.target.value)} className={inputCls} rows={2} placeholder="Full site address" disabled={isReadOnly} />
              </Field>
              <Field label="Postal Address" span={2}>
                <textarea value={fields.legalAddress} onChange={e => handleChange('legalAddress', e.target.value)} className={inputCls} rows={2} disabled={isReadOnly} />
              </Field>
              <Field label="Revenue Plot No">
                <input type="text" value={fields.revenuePlotNo} onChange={e => handleChange('revenuePlotNo', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Revenue Khata No">
                <input type="text" value={fields.revenueKhataNo} onChange={e => handleChange('revenueKhataNo', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Village (Mouza)">
                <input type="text" value={fields.revenueVillage} onChange={e => handleChange('revenueVillage', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Tahasil">
                <input type="text" value={fields.revenueTahasil} onChange={e => handleChange('revenueTahasil', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Police Station (PS)">
                <input type="text" value={fields.revenuePS} onChange={e => handleChange('revenuePS', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Gram Panchayat (GP)">
                <input type="text" value={fields.revenueGP} onChange={e => handleChange('revenueGP', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="District">
                <input type="text" value={fields.revenueDistrict} onChange={e => handleChange('revenueDistrict', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="State">
                <input type="text" value={fields.revenueState} onChange={e => handleChange('revenueState', e.target.value)} className={inputCls} disabled={isReadOnly} />
              </Field>
              <Field label="Classification of Area">
                <select value={fields.classificationArea} onChange={e => handleChange('classificationArea', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="Rural Area">Rural Area</option>
                  <option value="Semi-Urban">Semi-Urban</option>
                  <option value="Urban">Urban</option>
                  <option value="Industrial Zone">Industrial Zone</option>
                </select>
              </Field>
              <Field label="Extent of Site (Acres/Dec/Sqft)">
                <input type="text" value={fields.extentOfSite} onChange={e => handleChange('extentOfSite', e.target.value)} className={inputCls} placeholder="e.g. 0.45 Acres" disabled={isReadOnly} />
              </Field>
              <Field label="Occupancy Status">
                <select value={fields.occupancyStatus} onChange={e => handleChange('occupancyStatus', e.target.value)} className={selectCls} disabled={isReadOnly}>
                  <option value="Vacant">Vacant</option>
                  <option value="Occupied">Occupied</option>
                  <option value="Partially Occupied">Partially Occupied</option>
                </select>
              </Field>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-[#495057] uppercase tracking-wider mb-2">Boundaries</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="North"><input type="text" value={fields.boundNorth} onChange={e => handleChange('boundNorth', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
                <Field label="South"><input type="text" value={fields.boundSouth} onChange={e => handleChange('boundSouth', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
                <Field label="East"><input type="text" value={fields.boundEast} onChange={e => handleChange('boundEast', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
                <Field label="West"><input type="text" value={fields.boundWest} onChange={e => handleChange('boundWest', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              </div>
            </div>
          </Section>

          {/* ── Section 5: Town Planning ── */}
          <Section title="Town Planning Parameters" number={5}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Master Plan Provision"><input type="text" value={fields.masterPlanProvision} onChange={e => handleChange('masterPlanProvision', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Approved Plan Authority"><input type="text" value={fields.approvedPlanAuthority} onChange={e => handleChange('approvedPlanAuthority', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Ground Coverage"><input type="text" value={fields.groundCoverage} onChange={e => handleChange('groundCoverage', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Surrounding Land Use"><input type="text" value={fields.surroundingLandUse} onChange={e => handleChange('surroundingLandUse', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Development Controls" span={2}><textarea value={fields.developmentControls} onChange={e => handleChange('developmentControls', e.target.value)} className={inputCls} rows={2} disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 6: Legal Aspects ── */}
          <Section title="Document Details & Legal Aspects" number={6}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Ownership Documents"><input type="text" value={fields.ownershipDocuments} onChange={e => handleChange('ownershipDocuments', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Owner as per ROR"><input type="text" value={fields.ownerAsPerROR} onChange={e => handleChange('ownerAsPerROR', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Easement Agreement"><input type="text" value={fields.easementAgreement} onChange={e => handleChange('easementAgreement', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Acquisition Notification"><input type="text" value={fields.acquisitionNotification} onChange={e => handleChange('acquisitionNotification', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Transferability"><input type="text" value={fields.transferability} onChange={e => handleChange('transferability', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Existing Mortgages / Charge"><input type="text" value={fields.existingMortgages} onChange={e => handleChange('existingMortgages', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="SARFAESI Compliant"><input type="text" value={fields.sarfaesiCompliant} onChange={e => handleChange('sarfaesiCompliant', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Disputes / Dues"><input type="text" value={fields.disputesDues} onChange={e => handleChange('disputesDues', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 7: Infrastructure ── */}
          <Section title="Functional & Infrastructure Aspects" number={7}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Water Supply"><input type="text" value={fields.waterSupply} onChange={e => handleChange('waterSupply', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Sewerage"><input type="text" value={fields.sewerage} onChange={e => handleChange('sewerage', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Electricity"><input type="text" value={fields.electricity} onChange={e => handleChange('electricity', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Road Connectivity"><input type="text" value={fields.roadConnectivity} onChange={e => handleChange('roadConnectivity', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Distance to Police Station"><input type="text" value={fields.policeStationDist} onChange={e => handleChange('policeStationDist', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Distance to Bus Stop"><input type="text" value={fields.busStopDist} onChange={e => handleChange('busStopDist', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 8–9: Socio-Cultural & Environmental ── */}
          <Section title="Socio-Cultural & Environmental Factors" number={8}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Social Structure"><input type="text" value={fields.socialStructure} onChange={e => handleChange('socialStructure', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Social Infrastructure"><input type="text" value={fields.socialInfrastructure} onChange={e => handleChange('socialInfrastructure', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Eco-friendly Materials"><input type="text" value={fields.ecoMaterials} onChange={e => handleChange('ecoMaterials', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Rain Water Harvesting"><input type="text" value={fields.rainWaterHarvesting} onChange={e => handleChange('rainWaterHarvesting', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Solar System"><input type="text" value={fields.solarSystem} onChange={e => handleChange('solarSystem', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Environmental Pollution"><input type="text" value={fields.environmentalPollution} onChange={e => handleChange('environmentalPollution', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 10–11: Marketability & Architecture ── */}
          <Section title="Marketability & Architectural Aspects" number={10}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Locational Attributes"><input type="text" value={fields.locationalAttributes} onChange={e => handleChange('locationalAttributes', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Scarcity"><input type="text" value={fields.scarcity} onChange={e => handleChange('scarcity', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Demand & Supply"><input type="text" value={fields.demandSupply} onChange={e => handleChange('demandSupply', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Architectural Aspects"><input type="text" value={fields.architecturalAspects} onChange={e => handleChange('architecturalAspects', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 12: Engineering ── */}
          <Section title="Engineering Aspects" number={12}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Type of Construction"><input type="text" value={fields.constructionType} onChange={e => handleChange('constructionType', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Materials Used"><input type="text" value={fields.materialsUsed} onChange={e => handleChange('materialsUsed', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Specifications"><input type="text" value={fields.specifications} onChange={e => handleChange('specifications', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Maintenance Issues"><input type="text" value={fields.maintenanceIssues} onChange={e => handleChange('maintenanceIssues', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Age of Building (Years)"><input type="number" value={fields.ageOfBuilding} onChange={e => handleChange('ageOfBuilding', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Residual Life (Years)"><input type="number" value={fields.residualLife} onChange={e => handleChange('residualLife', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Extent of Deterioration"><input type="text" value={fields.extentDeterioration} onChange={e => handleChange('extentDeterioration', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Structural Safety"><input type="text" value={fields.structuralSafety} onChange={e => handleChange('structuralSafety', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Natural Disaster Protection"><input type="text" value={fields.naturalDisasterProtection} onChange={e => handleChange('naturalDisasterProtection', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Visible Damage"><input type="text" value={fields.visibleDamage} onChange={e => handleChange('visibleDamage', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Section 13: Valuation ── */}
          <Section title="Valuation Approaches & Methodology" number={13}>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-sm text-blue-800 font-medium">Upload detailed plot-by-plot Valuation Tables using the <strong>Annexure</strong> section below. The PDF will auto-reference them. Enter the summary totals here:</p>
            </div>
            
            {/* Dynamic Valuation Rows Table */}
            <div className="mt-6 mb-6">
              <p className="text-xs font-bold text-[#495057] uppercase tracking-wider mb-2">Detailed Plot-by-Plot Valuation (Optional)</p>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 text-xs uppercase font-semibold">
                      <tr>
                        <th className="px-4 py-3">Sl No</th>
                        <th className="px-4 py-3">Plot No</th>
                        <th className="px-4 py-3">Khata No</th>
                        <th className="px-4 py-3">Area</th>
                        <th className="px-4 py-3">Rate/Unit</th>
                        <th className="px-4 py-3">Guideline Value</th>
                        <th className="px-4 py-3">Fair Market Value</th>
                        {!isReadOnly && <th className="px-4 py-3 w-10"></th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {fields.valuationRows.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-6 text-center text-slate-400 italic">
                            No manual rows added. You can use this table OR the Annexure upload below.
                          </td>
                        </tr>
                      )}
                      {fields.valuationRows.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-2 text-slate-500 font-medium">{idx + 1}</td>
                          <td className="px-4 py-2">
                            <input type="text" value={row.plotNo} onChange={e => updateValuationRow(row.id, 'plotNo', e.target.value)} className="w-full bg-transparent border-none p-1 focus:ring-1 focus:ring-amber-400 rounded" placeholder="Plot..." disabled={isReadOnly} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" value={row.khataNo} onChange={e => updateValuationRow(row.id, 'khataNo', e.target.value)} className="w-full bg-transparent border-none p-1 focus:ring-1 focus:ring-amber-400 rounded" placeholder="Khata..." disabled={isReadOnly} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" value={row.area} onChange={e => updateValuationRow(row.id, 'area', e.target.value)} className="w-full bg-transparent border-none p-1 focus:ring-1 focus:ring-amber-400 rounded" placeholder="Area..." disabled={isReadOnly} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" value={row.rate} onChange={e => updateValuationRow(row.id, 'rate', e.target.value)} className="w-full bg-transparent border-none p-1 focus:ring-1 focus:ring-amber-400 rounded" placeholder="Rate..." disabled={isReadOnly} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" value={row.guidelineValue} onChange={e => updateValuationRow(row.id, 'guidelineValue', e.target.value)} className="w-full bg-transparent border-none p-1 focus:ring-1 focus:ring-amber-400 rounded" placeholder="Value..." disabled={isReadOnly} />
                          </td>
                          <td className="px-4 py-2">
                            <input type="text" value={row.fairMarketValue} onChange={e => updateValuationRow(row.id, 'fairMarketValue', e.target.value)} className="w-full bg-transparent border-none p-1 focus:ring-1 focus:ring-amber-400 rounded" placeholder="Value..." disabled={isReadOnly} />
                          </td>
                          {!isReadOnly && (
                            <td className="px-4 py-2 text-center">
                              <button onClick={() => removeValuationRow(row.id)} className="text-red-400 hover:text-red-600 transition-colors" title="Remove Row">
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
                  <div className="bg-slate-50 border-t border-slate-200 p-2 text-center">
                    <button type="button" onClick={addValuationRow} className="text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors uppercase tracking-wider px-4 py-1.5 rounded hover:bg-amber-100">
                      + Add Row
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Total Govt. Guideline / Book Value (Rs)"><input type="text" value={fields.bookValueTotal} onChange={e => handleChange('bookValueTotal', e.target.value)} className={inputCls} placeholder="e.g. 17200000" disabled={isReadOnly} /></Field>
              <Field label="Total Fair Market Value (Rs)"><input type="text" value={fields.fairMarketValueTotal} onChange={e => handleChange('fairMarketValueTotal', e.target.value)} className={inputCls} placeholder="e.g. 18450000" disabled={isReadOnly} /></Field>
              <Field label="Total Present Market Value (Rs)"><input type="text" value={fields.presentMarketValueTotal} onChange={e => handleChange('presentMarketValueTotal', e.target.value)} className={inputCls} disabled={isReadOnly} /></Field>
              <Field label="Realisable / Liquidation Value (Rs)"><input type="text" value={fields.realisableValueTotal} onChange={e => handleChange('realisableValueTotal', e.target.value)} className={inputCls} placeholder="e.g. 14760000" disabled={isReadOnly} /></Field>
            </div>
            <div className="mt-4">
              <Field label="Remarks / Observations" span={2}>
                <textarea value={fields.remarks} onChange={e => handleChange('remarks', e.target.value)} className={inputCls} rows={3} disabled={isReadOnly} />
              </Field>
            </div>
          </Section>
          {/* ── Section 14: Photos & Maps ── */}
          <Section title="Property Photographs, Sketch & Location Maps" number={14}>
            {/* Property Photos */}
            <div>
              <p className="text-xs font-bold text-[#495057] uppercase tracking-wider mb-2">Property Photographs</p>
              {!isReadOnly && (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                      {uploading ? 'Uploading...' : '📷 Add Property Images'}
                      <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileUpload(e, 'propertyImages')} disabled={uploading} />
                    </label>
                    {bucketImages && bucketImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openBucketPicker('propertyImages')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e3a5f] text-[#1e3a5f] text-sm font-medium hover:bg-[#1e3a5f]/5 transition-colors"
                      >
                        📸 Pick from Bucket ({bucketImages.length})
                      </button>
                    )}
                    <span className="text-xs text-[#6c757d]">Max size: 5MB per photograph</span>
                  </div>
                  {uploadError && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                      ⚠️ {uploadError}
                    </div>
                  )}
                </div>
              )}
              {fields.propertyImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {fields.propertyImages.map((url: string, i: number) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-200">
                      <img src={url} alt={`Property ${i + 1}`} className="w-full h-24 object-cover" />
                      {!isReadOnly && (
                        <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">&times;</button>
                      )}
                      <input
                        type="text"
                        placeholder={`Caption for Figure ${i + 1}`}
                        value={fields.propertyImageNames?.[i] || ''}
                        onChange={e => {
                          const names = [...(fields.propertyImageNames || [])];
                          while (names.length <= i) names.push('');
                          names[i] = e.target.value;
                          handleChange('propertyImageNames', names);
                        }}
                        disabled={isReadOnly}
                        className="w-full text-xs px-2 py-1 border-t border-slate-200 bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#b8860b]/40"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sketch Maps */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-[#495057] uppercase tracking-wider">Sketch Maps</p>
              </div>
              {!isReadOnly && (
                <div className="mb-3">
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                    {uploading ? 'Uploading...' : '🗺️ Upload Sketch Maps'}
                    <input type="file" multiple accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'sketchMapImages')} disabled={uploading} />
                  </label>
                </div>
              )}
              {fields.sketchMapImages && fields.sketchMapImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {fields.sketchMapImages.map((url, idx) => (
                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200">
                      <img src={url} alt={`Sketch Map ${idx + 1}`} className="w-full h-32 object-contain bg-[#f8f9fa]" />
                      {!isReadOnly && (
                        <button onClick={() => removeSketchMap(idx)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed rounded-lg text-gray-500 text-sm">
                  No sketch maps added
                </div>
              )}
            </div>

            {/* Location Map */}
            <div className="mt-6">
              <p className="text-xs font-bold text-[#495057] uppercase tracking-wider mb-2">Location Map</p>
              {fields.locationMapImage ? (
                <div className="relative group rounded-lg overflow-hidden border border-slate-200 max-w-lg">
                  <img src={fields.locationMapImage} alt="Location Map" className="w-full max-h-48 object-contain" />
                  {!isReadOnly && (
                    <button onClick={() => handleChange('locationMapImage', '')} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                  )}
                </div>
              ) : (
                !isReadOnly && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                      {uploading ? 'Uploading...' : '🗺️ Upload Location Map'}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'locationMapImage')} disabled={uploading} />
                    </label>
                    {bucketImages && bucketImages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => openBucketPicker('locationMapImage')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1e3a5f] text-[#1e3a5f] text-sm font-medium hover:bg-[#1e3a5f]/5 transition-colors"
                      >
                        📸 Pick from Bucket
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
            {/* Lat/Long */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Field label="Latitude"><input type="text" value={fields.latitude} onChange={e => handleChange('latitude', e.target.value)} className={inputCls} placeholder="e.g. 20.2961" disabled={isReadOnly} /></Field>
              <Field label="Longitude"><input type="text" value={fields.longitude} onChange={e => handleChange('longitude', e.target.value)} className={inputCls} placeholder="e.g. 85.8245" disabled={isReadOnly} /></Field>
            </div>
          </Section>

          {/* ── Annexure Section ── */}
          <Section title="Annexures (Excel Uploads)" number={'A'} defaultOpen={fields.annexureEnabled}>
            <div id="section-annexure">
              <div className="flex items-center gap-3 mb-4">
                <label className="text-sm font-bold text-slate-700">Enable Annexures</label>
                <button
                  type="button"
                  onClick={() => handleChange('annexureEnabled', !fields.annexureEnabled)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${fields.annexureEnabled ? 'bg-amber-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${fields.annexureEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {fields.annexureEnabled && (
                <div className="space-y-4">
                  {fields.annexures.map((ann: AnnexureItem, index: number) => (
                    <div key={ann.id} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="bg-amber-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm">{ann.label}</span>
                        <input
                          type="text"
                          value={ann.title || ''}
                          onChange={e => updateAnnexureTitle(ann.id, e.target.value)}
                          placeholder="Annexure title (optional)"
                          className="flex-1 px-3 py-2 rounded-lg border border-amber-300 bg-white text-sm"
                          disabled={isReadOnly}
                        />
                        {!isReadOnly && (
                          <button onClick={() => removeAnnexure(ann.id)} className="text-red-500 hover:text-red-700 text-sm font-bold">Remove</button>
                        )}
                      </div>
                      {ann.excelFileUrl ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-emerald-700 font-semibold">📎 {ann.excelFileName}</span>
                          {ann.parsedData && <span className="text-xs text-slate-500">({ann.parsedData.rows.length} rows)</span>}
                          {!isReadOnly && <button onClick={() => removeAnnexureFile(ann.id)} className="text-xs text-red-500 hover:underline ml-2">Remove</button>}
                        </div>
                      ) : (
                        <input
                          type="file"
                          accept=".xlsx,.xls,.csv"
                          onChange={e => handleAnnexureUpload(ann.id, e)}
                          className="text-sm"
                          disabled={isReadOnly || uploading}
                        />
                      )}
                    </div>
                  ))}
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={addAnnexure}
                      className="w-full py-3 border-2 border-dashed border-amber-400 rounded-xl text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors"
                    >
                      + Add Annexure {String.fromCharCode(65 + fields.annexures.length)}
                    </button>
                  )}
                </div>
              )}
            </div>
          </Section>

      <div className="flex flex-wrap gap-4 pt-4 items-center w-full">
        {status === 'COMPLETED' && (
          <div className="w-full p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 font-bold flex items-center gap-2">
            <span>✅</span> Verified and Completed (Pushed to storage for client download)
          </div>
        )}

        {status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE' && (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold mb-2">
            <span>⏳ Currently Under Manager Review.</span>
            <button
              onClick={handleCancelSubmission}
              disabled={loading}
              className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
            >
              ↩️ Cancel Submission (Pull back to Draft)
            </button>
          </div>
        )}

        {!isReadOnly && (
          <>
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-[#b8860b] text-[#b8860b] font-semibold text-sm hover:bg-[#b8860b]/5 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? '⏳ Saving...' : '💾 Save Draft'}
            </button>
            {userRole === 'REPORT_EMPLOYEE' && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? '⏳ Submitting...' : '📤 Submit to Manager'}
              </button>
            )}
          </>
        )}

        <button
          onClick={handlePreviewPDF}
          disabled={loading}
          className="px-6 py-3 rounded-xl border-2 border-gray-400 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          👁️ Preview PDF
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="px-6 py-3 rounded-xl border-2 border-gray-400 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50 flex items-center gap-2"
        >
          📥 Download PDF
        </button>

        {status === 'MANAGER_REVIEW' && isManagerOrOwner && (
          <>
            <button
              onClick={handleReworkClick}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-red-500 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              ❌ Send for Rework
            </button>
            <button
              onClick={handleFinalize}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-sm hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              ✅ Finalize & Share to Client
            </button>
          </>
        )}
      </div>

      </div>

      {/* Rework Modal */}
      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#e9ecef] bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#0f2038]">
                Send for Rework
              </h2>
              <p className="text-xs text-[#6c757d] mt-1">Please provide specific feedback for the report agent.</p>
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

      {/* Bucket Picker Modal */}
      {bucketPickerOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
            <div className="p-5 border-b border-[#e9ecef] bg-[#f8f9fa] flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-[#0f2038] flex items-center gap-2">
                  📸 Pick from Photo Bucket
                </h2>
                <p className="text-xs text-[#6c757d] mt-1">
                  {bucketPickerMode === 'propertyImages'
                    ? 'Select one or more photos to add to the report'
                    : bucketPickerMode === 'sketchMapImages'
                    ? 'Select one or more photos to use as Sketch Maps'
                    : 'Select a single photo for the map'}
                </p>
              </div>
              <button
                onClick={() => setBucketPickerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200 text-gray-500 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              {bucketImages && bucketImages.length > 0 ? (
                bucketPickerAgent === null ? (
                  <div className="space-y-4">
                    <p className="text-sm font-semibold text-[#495057] mb-2">Select a Field Agent to view their uploaded photos:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Array.from(new Set(bucketImages.map(img => img.employee.employeeId))).map(empId => {
                        const agentImages = bucketImages.filter(img => img.employee.employeeId === empId);
                        const agentName = agentImages[0].employee.name;
                        const selectedCount = agentImages.filter(img => bucketSelected.has(img.id)).length;
                        return (
                          <div
                            key={empId}
                            onClick={() => setBucketPickerAgent(empId)}
                            className="bg-white rounded-xl border border-[#e9ecef] p-4 flex items-center justify-between cursor-pointer hover:border-[#1e3a5f] hover:shadow-md transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#f8f9fa] flex items-center justify-center text-xl">
                                👤
                              </div>
                              <div>
                                <p className="font-bold text-[#0f2038]">{agentName}</p>
                                <p className="text-xs text-[#6c757d]">{agentImages.length} photos uploaded</p>
                              </div>
                            </div>
                            {selectedCount > 0 && (
                              <span className="bg-[#1e3a5f] text-white text-[10px] font-bold px-2 py-1 rounded-full">
                                {selectedCount} selected
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => setBucketPickerAgent(null)}
                      className="text-sm font-bold text-[#1e3a5f] hover:underline flex items-center gap-1 mb-2"
                    >
                      ← Back to Agents
                    </button>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {bucketImages.filter(img => img.employee.employeeId === bucketPickerAgent).map((img) => {
                        const isSelected = bucketSelected.has(img.id);
                        return (
                          <div
                            key={img.id}
                            onClick={() => toggleBucketImage(img.id)}
                            className={`relative group bg-white rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                              isSelected ? 'border-[#1e3a5f] shadow-md scale-[0.98]' : 'border-transparent shadow-sm hover:shadow-md'
                            }`}
                          >
                            <div className="aspect-square bg-gray-100">
                              <img src={img.url} alt={img.fileName} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                            <div className="p-2 border-t border-gray-100">
                              <p className="text-[10px] font-bold text-[#0f2038] truncate">{img.employee.name}</p>
                              <p className="text-[9px] text-[#6c757d]">
                                {new Date(img.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-[#1e3a5f] text-white rounded-full flex items-center justify-center shadow-sm">
                                ✓
                              </div>
                            )}
                            {!isSelected && (
                              <div className="absolute top-2 right-2 w-6 h-6 bg-black/20 border-2 border-white/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-sm font-medium text-[#6c757d]">No photos in the bucket yet.</p>
                  <p className="text-xs text-[#adb5bd] mt-1">Field agents need to upload photos to this project first.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[#e9ecef] bg-white flex justify-end gap-3">
              <button
                onClick={() => setBucketPickerOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-[#dee2e6] text-sm font-semibold text-[#495057] hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleBucketConfirm}
                disabled={!bucketSelected || bucketSelected.size === 0}
                className="px-5 py-2.5 rounded-xl bg-[#1e3a5f] text-white text-sm font-bold hover:bg-[#0f2038] transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                Add Selected ({bucketSelected ? bucketSelected.size : 0})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Navigator */}
      {!aiAssistEnabled && <FloatingNavigator annexureEnabled={fields.annexureEnabled} />}

      {/* AI Assist Sidebar */}
      {aiAssistEnabled && (
        <>
          <div className="hidden lg:block w-[340px] shrink-0">
            <AiAssistPanel
              fields={fields}
              onAcceptSuggestion={handleAiAcceptSuggestion}
              onAcceptFloorSuggestion={handleAiAcceptFloorSuggestion}
              onAcceptAll={handleAiAcceptAll}
              isReadOnly={isReadOnly}
            />
          </div>
          <div className="lg:hidden">
            <AiAssistPanel
              fields={fields}
              onAcceptSuggestion={handleAiAcceptSuggestion}
              onAcceptFloorSuggestion={handleAiAcceptFloorSuggestion}
              onAcceptAll={handleAiAcceptAll}
              isReadOnly={isReadOnly}
            />
          </div>
        </>
      )}
    </div>
  );
}
