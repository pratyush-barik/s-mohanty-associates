'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';

// ─── Types ─────────────────────────────────────────────────────────
interface FloorRow {
  id: string;
  name: string;
  area: string;
  rate: string;
  yearBuilt: string;
  lifeYears: string;
  ageYears: string;
  depreciationPct: string;
}

interface ReportFields {
  // Section 1 – General Details
  propertyType: string;
  ownerName: string;
  ownerAddress: string;
  landmark: string;
  loanApplicationNo: string;
  documentHolderName: string;
  legalAddress: string;
  dateOfInspection: string;
  dateOfValuation: string;
  refNo: string;
  bankName: string;
  branchName: string;
  purpose: string;

  // Section 2 – Surrounding Locality Details
  wardNo: string;
  vicinity: string;
  classOfLocality: string;
  approachRoadWidth: string;
  plotDemarcated: string;
  distanceRailwayStation: string;
  distanceBusStop: string;
  distanceHospital: string;
  propertyIdentification: string;
  propertyIdentificationRemarks: string;
  proximityToFacilities: string;
  landmarkRailway: string;
  landmarkBusStop: string;
  landmarkHospital: string;
  landmarkNearest: string;

  // Section 3 – Property Details
  usageType: string;
  additionalAmenities: string;
  legalStatus: string;

  // Section 4 – Subject Property Details
  premisesType: string;
  occupiedBy: string;
  isPropertyRented: string;
  rentedOccupants: string;
  propertyTaxation: string;
  boundaryNorth: string;
  boundarySouth: string;
  boundaryEast: string;
  boundaryWest: string;
  buildingBoundaryNorth: string;
  buildingBoundarySouth: string;
  buildingBoundaryEast: string;
  buildingBoundaryWest: string;

  // Section 5 – Structural Details
  structureType: string;
  numberOfFloors: string;
  numberOfWings: string;
  unitsPerFloor: string;
  internalComposition: string;
  numberOfLifts: string;
  ageOfProperty: string;
  estimatedFutureLife: string;
  exteriors: string;
  qualityOfConstruction: string;
  maintenanceCondition: string;
  commonAreasRemarks: string;
  otherObservations: string;
  flooringType: string;
  roofType: string;
  qualityOfFixtures: string;
  foundation: string;
  superstructure: string;
  doorsWindows: string;
  plastering: string;
  sanitary: string;
  electrification: string;

  // Section 6 – Plan Approvals
  constructionApproved: string;
  approvalDetails: string;
  constructionPermission: string;
  violationsObserved: string;
  conformsToByelaws: string;
  documentsVerified: string;

  // Section 7 – Floor-wise
  floors: FloorRow[];
  floorAreaUnit: string;

  // Section 8 – Land Valuation
  landArea: string;
  landAreaUnit: string;
  landRatePerUnit: string;
  govtLandRate: string;
  recommendedRateBasis: string;
  buaAsPerApprovals: string;

  // Valuation extras
  marketability: string;
  valuationResult: string;
  replacementCost: string;
  deviations: string;

  // Abstract
  realizablePct: string;
  distressPct: string;
  guidelineValue: string;

  // Remarks & Declaration
  demarcation: string;
  possession: string;
  remarks: string;
  representativeName: string;

  // Photos & Maps
  propertyImages: string[];
  sketchMapImage: string;
  locationMapImage: string;
  latitude: string;
  longitude: string;

  // Legacy backward-compat fields
  localityType: string;
  khataNo: string;
  plotNo: string;
  mouza: string;
  tahasil: string;
  district: string;
  state: string;
  developmentStatus: string;
  civicAmenities: string[];
  civicAmenitiesOther: string;
  distanceMainRoad: string;
  distanceMainRoadUnit: string;
  distanceRailway: string;
  distanceRailwayUnit: string;
  nearbyLandmarks: string;
  reworkNotes?: string;
}

const DEFAULT_FIELDS: ReportFields = {
  propertyType: 'Residential',
  ownerName: '',
  ownerAddress: '',
  landmark: '',
  loanApplicationNo: '',
  documentHolderName: '',
  legalAddress: '',
  dateOfInspection: new Date().toISOString().split('T')[0],
  dateOfValuation: new Date().toISOString().split('T')[0],
  refNo: '',
  bankName: '',
  branchName: '',
  purpose: 'Home Loan',

  wardNo: '',
  vicinity: 'Residential',
  classOfLocality: 'Middle Class',
  approachRoadWidth: '40-20 Feet Road',
  plotDemarcated: 'Yes',
  distanceRailwayStation: '',
  distanceBusStop: '',
  distanceHospital: '',
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
  isPropertyRented: 'NA',
  rentedOccupants: 'NA',
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
  numberOfWings: 'NA',
  unitsPerFloor: 'NA',
  internalComposition: 'Good',
  numberOfLifts: 'NA',
  ageOfProperty: '',
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
  conformsToByelaws: 'NA',
  documentsVerified: '',

  floors: [{ id: '1', name: 'Ground Floor', area: '', rate: '', yearBuilt: '', lifeYears: '60', ageYears: '', depreciationPct: '' }],
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
  deviations: 'NA',

  realizablePct: '90',
  distressPct: '80',
  guidelineValue: '',

  demarcation: 'Clear',
  possession: 'With Owner',
  remarks: '',
  representativeName: '',

  propertyImages: [],
  sketchMapImage: '',
  locationMapImage: '',
  latitude: '',
  longitude: '',

  localityType: 'Residential',
  khataNo: '',
  plotNo: '',
  mouza: '',
  tahasil: '',
  district: '',
  state: 'Odisha',
  developmentStatus: 'Developed',
  civicAmenities: [],
  civicAmenitiesOther: '',
  distanceMainRoad: '',
  distanceMainRoadUnit: 'Meters',
  distanceRailway: '',
  distanceRailwayUnit: 'Km',
  nearbyLandmarks: '',
};

// ─── Helpers ───────────────────────────────────────────────────────
const parseNum = (v: string): number => parseFloat(v?.replace(/,/g, '') || '0') || 0;

function computeDepreciation(lifeYears: number, ageYears: number): number {
  if (lifeYears <= 0 || ageYears < 0) return 0;
  return Math.min(Math.round((ageYears / lifeYears) * 100), 90);
}

// ─── UI Components ─────────────────────────────────────────────────
function Section({ title, number, children, defaultOpen = true }: { title: string; number: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card border border-[#e9ecef] overflow-hidden">
      <button
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

/** 3-Column Option Field matching sample report format:
 * Col1 = Label | Col2 = All Options (clickable) | Col3 = Selected Value */
function OptionField({ label, options, value, onChange, disabled, customValue, onCustomChange, showCustomInput = false }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void; disabled?: boolean;
  customValue?: string; onCustomChange?: (v: string) => void; showCustomInput?: boolean;
}) {
  return (
    <div className="border border-[#c8d6e5] rounded-lg overflow-hidden">
      <div className="flex min-h-[40px]">
        {/* Col 1: Label */}
        <div className="w-44 md:w-52 shrink-0 bg-[#d5e8f5] px-3 py-2 text-[10px] font-bold text-[#1a3a5c] uppercase tracking-wider border-r border-[#c8d6e5] flex items-start pt-2.5">
          {label}
        </div>
        {/* Col 2: Options List */}
        <div className="w-48 md:w-56 shrink-0 border-r border-[#c8d6e5]">
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => !disabled && onChange(opt)}
              className={`px-3 py-1.5 text-xs border-b border-[#c8d6e5] last:border-b-0 transition-colors
                ${value === opt ? 'bg-[#a8cce0] font-bold text-[#0f2038]' : 'bg-[#e8f0f8] text-[#333]'}
                ${disabled ? 'cursor-default opacity-70' : 'cursor-pointer hover:bg-[#c5ddf0]'}`}
            >
              {opt}
            </div>
          ))}
        </div>
        {/* Col 3: Selected Value */}
        <div className="flex-1 flex items-center px-4 py-2 bg-white min-w-0">
          {showCustomInput ? (
            <div className="w-full space-y-1.5">
              <span className="text-sm font-semibold text-[#0f2038] block">{value || '\u2014'}</span>
              <input
                className="w-full px-2 py-1.5 rounded border border-[#dee2e6] bg-white text-[#212529] text-xs focus:outline-none focus:ring-1 focus:ring-[#b8860b]/30 disabled:bg-[#f1f3f5]"
                value={customValue || ''}
                onChange={e => onCustomChange?.(e.target.value)}
                disabled={disabled}
                placeholder="Additional remarks..."
              />
            </div>
          ) : (
            <span className="text-sm font-semibold text-[#0f2038]">{value || '\u2014'}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Landmark/Distance field: Label | Sub-labels | Input values */
function LandmarkField({ label, rows, disabled }: {
  label: string;
  rows: { subLabel: string; value: string; onChange: (v: string) => void }[];
  disabled?: boolean;
}) {
  return (
    <div className="border border-[#c8d6e5] rounded-lg overflow-hidden">
      <div className="flex min-h-[40px]">
        <div className="w-44 md:w-52 shrink-0 bg-[#d5e8f5] px-3 py-2 text-[10px] font-bold text-[#1a3a5c] uppercase tracking-wider border-r border-[#c8d6e5] flex items-start pt-2.5">
          {label}
        </div>
        <div className="w-48 md:w-56 shrink-0 border-r border-[#c8d6e5]">
          {rows.map((r, i) => (
            <div key={i} className="px-3 py-1.5 text-xs border-b border-[#c8d6e5] last:border-b-0 bg-[#e8f0f8] font-semibold text-[#333]">
              {r.subLabel}
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          {rows.map((r, i) => (
            <div key={i} className="border-b border-[#c8d6e5] last:border-b-0">
              <input
                className="w-full px-3 py-1.5 text-xs bg-white text-[#212529] focus:outline-none focus:bg-[#fffbf0] disabled:bg-[#f1f3f5] disabled:text-[#6c757d]"
                value={r.value}
                onChange={e => r.onChange(e.target.value)}
                disabled={disabled}
                placeholder="Enter details..."
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
interface ReportBuilderProps {
  projectId: string;
  initialFields: any;
  status: string;
  userRole?: string;
  prefill?: {
    ownerName?: string;
    ownerAddress?: string;
    propertyAddress?: string;
    propertyType?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
  };
}

export default function ReportBuilder({ projectId, initialFields, status, userRole = 'REPORT_EMPLOYEE', prefill }: ReportBuilderProps) {
  const merged = {
    ...DEFAULT_FIELDS,
    ...(initialFields || {}),
    ownerName: initialFields?.ownerName || prefill?.contactName || DEFAULT_FIELDS.ownerName,
    ownerAddress: initialFields?.ownerAddress || prefill?.propertyAddress || DEFAULT_FIELDS.ownerAddress,
    propertyImages: initialFields?.propertyImages || DEFAULT_FIELDS.propertyImages,
  };
  if (!Array.isArray(merged.floors) || merged.floors.length === 0) {
    merged.floors = DEFAULT_FIELDS.floors;
  }

  const [fields, setFields] = useState<ReportFields>(merged);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Rework Modal State
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [reworkComment, setReworkComment] = useState('');

  const reportRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  const handleChange = useCallback((field: keyof ReportFields, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Floor helpers ──
  const addFloor = () => {
    handleChange('floors', [...fields.floors, {
      id: String(Date.now()), name: `Floor ${fields.floors.length}`, area: '', rate: '',
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

  // ── Computed values ──
  const totalPlinthArea = fields.floors.reduce((sum, f) => sum + parseNum(f.area), 0);
  const landValue = parseNum(fields.landArea) * parseNum(fields.landRatePerUnit);

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
  const totalPropertyValue = landValue + totalBuildingValue;
  const realizableValue = totalPropertyValue * (parseNum(fields.realizablePct || '90') / 100);
  const distressValue = totalPropertyValue * (parseNum(fields.distressPct || '80') / 100);

  // ── File upload (photos + maps) ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'propertyImages' | 'sketchMapImage' | 'locationMapImage') => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadError(null);

    if (fieldName === 'propertyImages') {
      const newUrls = [...(fields.propertyImages || [])];
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
      handleChange('propertyImages', newUrls);
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
  };

  // ── Save / Submit / Finalize ──
  const handleSaveDraft = async () => {
    setLoading(true); setMessage(null);
    const result = await saveReportDraft(projectId, fields);
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Draft saved successfully!' });
    setLoading(false);
  };

  const handleSubmit = async () => {
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
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img); img.onerror = (e) => reject(e); img.src = src;
      });
      const letterheadImg = await loadImage('/templates/letterhead.png');
      const pages = generatePDFPages();
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(letterheadImg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
        const pageContainer = document.createElement('div');
        pageContainer.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;background:transparent;padding:170px 55px 90px 55px;box-sizing:border-box;font-family:Arial,sans-serif;color:#111;overflow:hidden;';
        pageContainer.innerHTML = pages[i];
        document.body.appendChild(pageContainer);
        const canvas = await html2canvas(pageContainer, {
          scale: 2, useCORS: true, logging: false, backgroundColor: null,
          width: 794, height: 1123, windowWidth: 794, windowHeight: 1123,
        });
        document.body.removeChild(pageContainer);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      }
      return pdf.output('blob');
    } catch (err) { console.error('PDF generation failed:', err); return null; }
  };

  const handlePreviewPDF = async () => {
    setMessage({ type: 'success', text: 'Generating PDF preview...' });
    const blob = await handleGeneratePDF();
    if (blob) { const url = URL.createObjectURL(blob); window.open(url, '_blank'); }
    setMessage(null);
  };

  const handleDownloadPDF = async () => {
    setMessage({ type: 'success', text: 'Generating PDF for download...' });
    const blob = await handleGeneratePDF();
    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fields.ownerName ? fields.ownerName.replace(/\s+/g, '_') : 'Valuation'}_Report_${projectId}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    }
    setMessage(null);
  };

  const handleFinalize = async () => {
    if (!confirm('Finalize this report and share it with the client? This will generate the official PDF and delete temporary draft images.')) return;
    setLoading(true);
    setMessage({ type: 'success', text: 'Generating final PDF...' });
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

  // ── PDF HTML Template (3-Column Format) ──
  function generatePDFPages(): string[] {
    // ── Style constants ──────────────────────────────────────────────────────
    const ts = 'width:100%;border-collapse:collapse;margin-bottom:10px;font-family:Calibri,Arial,sans-serif;';
    // Base styles (background and text color applied dynamically per row type)
    const lbl = 'border:1px solid #AAAAAA;padding:4px 6px;font-size:9px;text-align:left;vertical-align:middle;';
    const optS = 'border:1px solid #AAAAAA;padding:0;font-size:8.5px;vertical-align:top;';
    const valS = 'border:1px solid #AAAAAA;padding:4px 6px;font-size:9px;vertical-align:middle;';
    const hd = 'font-size:10px;font-weight:bold;background:#1F4E78;padding:5px 6px;border:1px solid #1F4E78;text-align:center;color:#FFFFFF;letter-spacing:0.5px;';

    // ── Alternating row colors ────────────────────────────────────────────────
    let rowIdx = 0;
    const resetRowIdx = () => { rowIdx = 0; };
    const rowBg = () => { const bg = rowIdx % 2 === 0 ? '#FFFFFF' : '#EEF4FB'; rowIdx++; return bg; };

    // ── Row helpers ───────────────────────────────────────────────────────────
    const simpleRow = (label: string, val: string, bgOverride?: string) => {
      const bg = bgOverride !== undefined ? bgOverride : rowBg();
      return `<tr style="background:${bg};"><td style="${lbl}color:#000000;" width="30%">${label}</td><td style="${valS}color:#000000;" colspan="2">${val || 'N/A'}</td></tr>`;
    };
    const optionRow = (label: string, opts: string[], val: string) => {
      const bg = '#DDEEF7'; // User requested entire row blue for option rows
      rowIdx++;
      return `<tr style="background:${bg};"><td style="${lbl}font-weight:bold;color:#000000;" width="30%">${label}</td><td style="${optS}" width="32%">${opts.map(o => `<div style="border-bottom:1px solid #AAAAAA;padding:3px 5px;font-weight:bold;color:#000000;">${o}</div>`).join('')}</td><td style="${valS}font-weight:bold;color:#000000;">${val ? val : 'N/A'}</td></tr>`;
    };

    // ── Per-page header (logo left | company name center | ref+date right) ──
    const pageHeader = `
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;border-bottom:2px solid #1F4E78;padding-bottom:5px;">
        <tr>
          <td style="width:25%;vertical-align:middle;">
            <img src="/smohantyassociate_logo.svg" alt="S Mohanty Associates" style="height:34px;width:auto;object-fit:contain;" crossOrigin="anonymous" onerror="this.style.display='none'" />
          </td>
          <td style="text-align:center;vertical-align:middle;">
            <div style="font-family:Calibri,Arial,sans-serif;font-size:11px;font-weight:bold;color:#1F4E78;letter-spacing:0.5px;">S. MOHANTY &amp; ASSOCIATES</div>
            <div style="font-family:Calibri,Arial,sans-serif;font-size:7.5px;color:#555;margin-top:1px;">Government Registered Valuers &amp; Chartered Engineers</div>
          </td>
          <td style="width:25%;text-align:right;vertical-align:middle;">
            <div style="font-family:Calibri,Arial,sans-serif;font-size:8px;color:#333;line-height:1.5;">
              ${fields.refNo ? `<div>Ref: <b>${fields.refNo}</b></div>` : ''}
              ${fields.dateOfValuation ? `<div>Date: <b>${fields.dateOfValuation}</b></div>` : ''}
            </div>
          </td>
        </tr>
      </table>`;

    // ── Per-page footer (IBBI left | Confidential center | Page X of Y right) ──
    const pageFooter = (pageNum: number, totalPgs: number) => `
      <table style="width:100%;border-collapse:collapse;margin-top:10px;border-top:1px solid #1F4E78;padding-top:4px;">
        <tr>
          <td style="font-family:Calibri,Arial,sans-serif;font-size:7.5px;color:#555;text-align:left;vertical-align:middle;">IBBI/RV/02/2019/10594</td>
          <td style="font-family:Calibri,Arial,sans-serif;font-size:7.5px;color:#555;text-align:center;font-style:italic;vertical-align:middle;">Confidential</td>
          <td style="font-family:Calibri,Arial,sans-serif;font-size:7.5px;color:#555;text-align:right;vertical-align:middle;">Page ${pageNum} of ${totalPgs}</td>
        </tr>
      </table>`;

    // ── Report title block ────────────────────────────────────────────────────
    const reportTitle = `<p style="font-family:Calibri,Arial,sans-serif;font-size:14px;font-weight:bold;text-align:center;color:#1F4E78;margin:4px 0 10px;text-transform:uppercase;text-decoration:underline;letter-spacing:1px;">Standard Valuation Report</p>`;

    // ═══════════════════════════════════════════════════════════════════
    // PAGE 1 — General Details
    // ═══════════════════════════════════════════════════════════════════
    resetRowIdx();
    const page1 = `<div style="font-family:Calibri,Arial,sans-serif;color:#111;line-height:1.15;">
      ${pageHeader}
      ${reportTitle}
      <table style="${ts}">
        <tr><td style="${hd}" colspan="3">1. GENERAL DETAILS</td></tr>
        ${optionRow('Type of Property', ['Residential', 'Commercial', 'Residential cum Commercial', 'Industrial', 'Vacant Plot'], fields.propertyType)}
        ${simpleRow('Name of Customer(s)', `<b>${fields.ownerName || 'N/A'}</b>`)}
        ${simpleRow('Property Address with Pin Code', fields.ownerAddress)}
        ${simpleRow('Landmark', fields.landmark || fields.nearbyLandmarks)}
        ${simpleRow('Loan Application Number', fields.loanApplicationNo)}
        ${simpleRow('Name of Document Holder', fields.documentHolderName || fields.ownerName)}
        ${simpleRow('Legal Address of Property', fields.legalAddress || fields.ownerAddress)}
        ${simpleRow('Date of Inspection', fields.dateOfInspection)}
        ${simpleRow('Date of Valuation Report', fields.dateOfValuation)}
        ${simpleRow('Bank / Financial Institution', fields.bankName)}
        ${simpleRow('Branch', fields.branchName)}
        ${simpleRow('Purpose', fields.purpose)}
      </table>
      ${pageFooter(1, 0)}
    </div>`;

    // ═══════════════════════════════════════════════════════════════════
    // PAGE 2 — Locality + Property Details
    // ═══════════════════════════════════════════════════════════════════
    resetRowIdx();
    const page2 = `<div style="font-family:Calibri,Arial,sans-serif;color:#111;line-height:1.15;">
      ${pageHeader}
      <table style="${ts}">
        <tr><td style="${hd}" colspan="3">2. SURROUNDING LOCALITY DETAILS</td></tr>
        ${simpleRow('Ward No / Municipal Land No', fields.wardNo)}
        ${optionRow('Vicinity', ['Slum', 'Residential', 'Commercial', 'Mixed', 'Industrial'], fields.vicinity)}
        ${optionRow('Locality Type', ['Elite/Posh/High Class', 'Upper Middle Class', 'Middle Class', 'Lower Middle Class', 'Poor / Slum'], fields.classOfLocality)}
        ${optionRow('Approach Road Width', ['>=60 Feet Road', '60-40 Feet Road', '40-20 Feet Road', '<20 Feet Road'], fields.approachRoadWidth)}
        ${optionRow('Plot Demarcated at Site', ['Yes', 'No'], fields.plotDemarcated)}
        <tr style="background:${rowBg()};"><td style="${lbl}color:#000000;" width="30%">Proximity to Civic Amenities</td><td style="${optS}" width="32%">
          <div style="border-bottom:1px solid #AAAAAA;padding:2px 5px;">Nearest Railway Station</div>
          <div style="border-bottom:1px solid #AAAAAA;padding:2px 5px;">Nearest Bus Stop</div>
          <div style="padding:2px 5px;">Nearest Hospital</div>
        </td><td style="${valS}color:#000000;">
          1. ${fields.landmarkRailway || fields.distanceRailwayStation || 'N/A'}<br/>
          2. ${fields.landmarkBusStop || fields.distanceBusStop || 'N/A'}<br/>
          3. ${fields.landmarkHospital || fields.distanceHospital || 'N/A'}
        </td></tr>
        ${optionRow('Property Identification', ['Easy to Identify', 'Identification by documents', 'Additional documents required', 'Difficult to identify'], fields.propertyIdentification)}
        ${optionRow('Proximity to Facilities', ['<1 Km', '1-3 Kms', '3-5 Kms', '>5 Kms'], fields.proximityToFacilities)}
        <tr style="background:${rowBg()};"><td style="${lbl}color:#000000;">Landmark Details</td><td style="${optS}">
          <div style="border-bottom:1px solid #AAAAAA;padding:2px 5px;">Nearest Railway Station</div>
          <div style="border-bottom:1px solid #AAAAAA;padding:2px 5px;">Nearest Bus Stop</div>
          <div style="border-bottom:1px solid #AAAAAA;padding:2px 5px;">Nearest Hospital</div>
          <div style="padding:2px 5px;">Nearest Landmark</div>
        </td><td style="${valS}color:#000000;">
          1. ${fields.landmarkRailway || 'N/A'}<br/>
          2. ${fields.landmarkBusStop || 'N/A'}<br/>
          3. ${fields.landmarkHospital || 'N/A'}<br/>
          4. ${fields.landmarkNearest || fields.landmark || 'N/A'}
        </td></tr>
      </table>
      <table style="${ts}">
        <tr><td style="${hd}" colspan="3">3. PROPERTY DETAILS</td></tr>
        ${(() => { resetRowIdx(); return ''; })()}
        ${simpleRow('Type of Usage', `<b>${fields.usageType || 'N/A'}</b>`)}
        ${simpleRow('Additional Amenities', fields.additionalAmenities || 'N/A')}
        ${optionRow('Legal Status of Property', ['Freehold', 'Lease hold >30 yrs.', 'Lease hold 15-30 yrs.', 'Lease hold <15 yrs.'], fields.legalStatus)}
      </table>
      ${pageFooter(2, 0)}
    </div>`;

    // ═══════════════════════════════════════════════════════════════════
    // PAGE 3 — Subject Property + Structural + Plan Approvals
    // ═══════════════════════════════════════════════════════════════════
    resetRowIdx();
    const page3 = `<div style="font-family:Calibri,Arial,sans-serif;color:#111;line-height:1.15;">
      ${pageHeader}
      <table style="${ts}">
        <tr><td style="${hd}" colspan="3">4. SUBJECT PROPERTY DETAILS</td></tr>
        ${simpleRow('Type of Premises', `<b>${fields.premisesType || 'N/A'}</b>`)}
        ${simpleRow('Occupied by / Vacant', fields.occupiedBy)}
        ${simpleRow('Is Property Rented', fields.isPropertyRented)}
        ${simpleRow('If Rented, List of Occupants', fields.rentedOccupants)}
        ${optionRow('Property Taxation / Maintenance', ['Low', 'Average', 'High', 'Very High'], fields.propertyTaxation)}
        ${simpleRow('Boundary (As per Sketch Map)', `N: ${fields.boundaryNorth || '-'} &nbsp;|&nbsp; E: ${fields.boundaryEast || '-'} &nbsp;|&nbsp; S: ${fields.boundarySouth || '-'} &nbsp;|&nbsp; W: ${fields.boundaryWest || '-'}`)}
        ${simpleRow('Boundary (At Site)', `N: ${fields.buildingBoundaryNorth || '-'} &nbsp;|&nbsp; E: ${fields.buildingBoundaryEast || '-'} &nbsp;|&nbsp; S: ${fields.buildingBoundarySouth || '-'} &nbsp;|&nbsp; W: ${fields.buildingBoundaryWest || '-'}`)}
      </table>
      <table style="${ts}">
        <tr><td style="${hd}" colspan="3">5. STRUCTURAL DETAILS</td></tr>
        ${(() => { resetRowIdx(); return ''; })()}
        ${optionRow('Type of Structure', ['RCC', 'Load Bearing', 'Steel Structure', 'Composite Structure', 'Industrial Shed', 'A/C Sheet', 'G/I Sheet', 'Asbestos Roofing'], fields.structureType)}
        ${simpleRow('No. of Floors', fields.numberOfFloors)}
        ${simpleRow('No. of Wings', fields.numberOfWings)}
        ${simpleRow('No. of Units on Each Floor', fields.unitsPerFloor)}
        ${simpleRow('Internal Composition', fields.internalComposition)}
        ${simpleRow('No. of Lifts', fields.numberOfLifts)}
        ${optionRow('Age of Property', ['1-10 years', '11-25 years', '26-50 years', '>50 years'], fields.ageOfProperty)}
        ${simpleRow('Estimated Future Life', fields.estimatedFutureLife)}
        ${simpleRow('Exteriors', fields.exteriors)}
        ${optionRow('Quality of Construction', ['Very Good', 'Good', 'Average', 'Poor'], fields.qualityOfConstruction)}
        ${simpleRow('Common Areas Remarks', fields.commonAreasRemarks, '#F2F2F2')}
        ${simpleRow('Other Observations', fields.otherObservations, '#F2F2F2')}
        ${simpleRow('Flooring &amp; Finishing', fields.flooringType)}
        ${simpleRow('Roofing &amp; Terracing', fields.roofType)}
        ${simpleRow('Quality of Fixtures', fields.qualityOfFixtures)}
      </table>
      <table style="${ts}">
        <tr><td style="${hd}" colspan="3">6. PLAN APPROVALS</td></tr>
        ${(() => { resetRowIdx(); return ''; })()}
        ${optionRow('Construction as per Approved Plans', ['Yes', 'No'], fields.constructionApproved)}
        ${simpleRow('Details of Approved Plan', fields.approvalDetails)}
        ${simpleRow('Construction Permission No. &amp; Date', fields.constructionPermission || 'Not mentioned')}
        ${simpleRow('Violations / Risk of Demolition', fields.violationsObserved)}
        ${simpleRow('Conforms to Local Byelaws', fields.conformsToByelaws)}
        ${simpleRow('Other Documents Verified', fields.documentsVerified)}
      </table>
      ${pageFooter(3, 0)}
    </div>`;

    // ═══════════════════════════════════════════════════════════════════
    // PAGE 4 — Valuation (Land + Building + Abstract)
    // ═══════════════════════════════════════════════════════════════════
    // Floor rows with alternating colors
    let floorRowBgIdx = 0;
    const floorRowsHTML = floorValuations.map(f => {
      const bg = floorRowBgIdx % 2 === 0 ? '#FFFFFF' : '#DCE6F1';
      floorRowBgIdx++;
      return `<tr style="background:${bg};">
        <td style="${valS};background:${bg};">${f.name}</td>
        <td style="${valS};background:${bg};text-align:right;">${formatIndianCurrency(f.area)}</td>
        <td style="${valS};background:${bg};text-align:right;">\u20B9${formatIndianCurrency(f.rate)}</td>
        <td style="${valS};background:${bg};text-align:right;">\u20B9${formatIndianCurrency(f.estimated)}</td>
        <td style="${valS};background:${bg};text-align:center;">${f.lifeYears}</td>
        <td style="${valS};background:${bg};text-align:center;">${f.ageYears}</td>
        <td style="${valS};background:${bg};text-align:center;">${f.depPct}%</td>
        <td style="${valS};background:${bg};text-align:right;">\u20B9${formatIndianCurrency(f.netValue)}</td>
      </tr>`;
    }).join('');

    resetRowIdx();
    const page4 = `<div style="font-family:Calibri,Arial,sans-serif;color:#111;line-height:1.15;">
      ${pageHeader}
      <table style="${ts}">
        <tr><td style="${hd}" colspan="3">7. VALUATION \u2014 Land</td></tr>
        ${simpleRow('Land Area', `${fields.landArea || '0'} ${fields.landAreaUnit}`)}
        ${simpleRow('Current Govt. Approved Rates for Land', `Rs.${fields.govtLandRate || fields.guidelineValue || 'N/A'}/- Per ${fields.landAreaUnit}`)}
        ${simpleRow('Recommended Rate &amp; Basis', `Rs.${fields.landRatePerUnit || 'N/A'}/- Per ${fields.landAreaUnit} ${fields.recommendedRateBasis ? '(' + fields.recommendedRateBasis + ')' : ''}`)}
        ${simpleRow('Land Value', `${fields.landArea || '0'} ${fields.landAreaUnit} &times; Rs.${fields.landRatePerUnit || '0'}/- = <b>Rs.${formatIndianCurrency(landValue)}/-</b>`)}
        ${simpleRow('Actual BUA of Premises', `${formatIndianCurrency(totalPlinthArea)} ${fields.floorAreaUnit || 'Sqft'}`)}
        ${fields.buaAsPerApprovals ? simpleRow('BUA as per Approvals', fields.buaAsPerApprovals) : ''}
      </table>
      <p style="font-size:10px;font-weight:bold;color:#1F4E78;text-decoration:underline;margin:6px 0 4px;text-align:center;font-family:Calibri,Arial,sans-serif;">8. VALUATION OF BUILDING (After Depreciation)</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:8px;font-size:8.5px;font-family:Calibri,Arial,sans-serif;">
        <tr style="background:#1F4E78;">
          <th style="border:1px solid #1F4E78;padding:4px 5px;color:#FFF;font-weight:bold;text-align:center;">Floor</th>
          <th style="border:1px solid #1F4E78;padding:4px 5px;color:#FFF;font-weight:bold;text-align:right;">Area</th>
          <th style="border:1px solid #1F4E78;padding:4px 5px;color:#FFF;font-weight:bold;text-align:right;">Rate (\u20B9)</th>
          <th style="border:1px solid #1F4E78;padding:4px 5px;color:#FFF;font-weight:bold;text-align:right;">Estimated (\u20B9)</th>
          <th style="border:1px solid #1F4E78;padding:4px 5px;color:#FFF;font-weight:bold;text-align:center;">Life</th>
          <th style="border:1px solid #1F4E78;padding:4px 5px;color:#FFF;font-weight:bold;text-align:center;">Age</th>
          <th style="border:1px solid #1F4E78;padding:4px 5px;color:#FFF;font-weight:bold;text-align:center;">Dep%</th>
          <th style="border:1px solid #1F4E78;padding:4px 5px;color:#FFF;font-weight:bold;text-align:right;">Net Value (\u20B9)</th>
        </tr>
        ${floorRowsHTML}
        <tr style="background:#FFF2CC;font-weight:bold;">
          <td style="${valS};background:#FFF2CC;color:#1F4E78;" colspan="7">Total Building Value</td>
          <td style="${valS};background:#FFF2CC;text-align:right;color:#1F4E78;">\u20B9${formatIndianCurrency(totalBuildingValue)}</td>
        </tr>
      </table>
      <table style="${ts}">
        <tr><td style="${hd}" colspan="3">9. ABSTRACT OF VALUATION</td></tr>
        ${(() => { resetRowIdx(); return ''; })()}
        ${simpleRow('Market Value (Land + Building)', `<b>Rs.${formatIndianCurrency(totalPropertyValue)}/- (${rupeesInWords(totalPropertyValue)})</b>`, '#E2EFDA')}
        ${simpleRow(`Realizable Value (${fields.realizablePct || '90'}%)`, `<b>Rs.${formatIndianCurrency(realizableValue)}/-</b>`, '#E2EFDA')}
        ${simpleRow(`Forced Sale / Distress Value (${fields.distressPct || '80'}%)`, `<b>Rs.${formatIndianCurrency(distressValue)}/- (${rupeesInWords(distressValue)})</b>`, '#FFF2CC')}
        ${optionRow('Marketability', ['Excellent', 'Very Good', 'Good', 'Difficult'], fields.marketability)}
        ${optionRow('Valuation Result', ['Positive', 'Negative'], fields.valuationResult)}
        ${simpleRow('Replacement Cost / Insurance Value', fields.replacementCost ? `Rs.${formatIndianCurrency(fields.replacementCost)}/-` : 'N/A')}
        ${simpleRow('Deviations in Property', fields.deviations, '#F2F2F2')}
        ${fields.guidelineValue ? simpleRow('Govt./Guideline Value', `Rs.${formatIndianCurrency(fields.guidelineValue)}/-`) : ''}
      </table>
      ${pageFooter(4, 0)}
    </div>`;

    // ═══════════════════════════════════════════════════════════════════
    // PAGE 5 — Remarks, Declaration & Valuation Certificate
    // ═══════════════════════════════════════════════════════════════════
    resetRowIdx();
    const page5 = `<div style="font-family:Calibri,Arial,sans-serif;color:#111;line-height:1.15;">
      ${pageHeader}
      <table style="${ts}">
        <tr><td style="${hd}" colspan="2">10. REMARKS, DEMARCATION &amp; POSSESSION</td></tr>
        <tr style="background:#F2F2F2;"><td style="${lbl}" width="25%">Demarcation</td><td style="${valS};font-family:Cambria,'Times New Roman',serif;font-size:9px;background:#F2F2F2;">${fields.demarcation || 'N/A'}</td></tr>
        <tr><td style="${lbl}">Possession</td><td style="${valS};font-family:Cambria,'Times New Roman',serif;font-size:9px;">${fields.possession || 'N/A'}</td></tr>
        <tr style="background:#F2F2F2;"><td style="${lbl}">Remarks / Observations</td><td style="${valS};font-family:Cambria,'Times New Roman',serif;font-size:9px;background:#F2F2F2;">${fields.remarks || 'N/A'}</td></tr>
      </table>
      <div style="margin-top:10px;font-size:9px;line-height:1.5;font-family:Cambria,'Times New Roman',serif;color:#333;">
        <p style="font-weight:bold;font-size:10px;color:#1F4E78;text-decoration:underline;margin-bottom:4px;font-family:Calibri,Arial,sans-serif;">Declaration:</p>
        <p style="margin-bottom:3px;">I hereby declare that:</p>
        <p style="margin-bottom:3px;">&bull; I have deputed my representative <b>${fields.representativeName ? 'Mr. ' + fields.representativeName : '______'}</b> to inspect the property on <b>${fields.dateOfInspection || '______'}</b>.</p>
        <p style="margin-bottom:3px;">&bull; I have no direct or indirect interest in the property valued.</p>
        <p style="margin-bottom:3px;">&bull; The information furnished is true and correct to the best of my knowledge and belief.</p>
      </div>
      <p style="font-size:11px;font-weight:bold;text-align:center;margin:14px 0 8px;text-decoration:underline;color:#1F4E78;font-family:Calibri,Arial,sans-serif;">11. VALUATION CERTIFICATE</p>
      <div style="border:1.5px solid #1F4E78;padding:12px;font-size:9px;line-height:1.6;background:#FDFCF8;font-family:Cambria,'Times New Roman',serif;">
        <p style="margin-top:0;">This is to certify that the undersigned has personally inspected the property belonging to
        <b>${fields.ownerName}</b> situated at <b>${fields.ownerAddress}</b> on
        <b>${fields.dateOfInspection}</b> and after careful examination and consideration of all relevant factors,
        the Fair Market Value of the said property is assessed as under:</p>
        <p style="background:#E2EFDA;padding:4px 8px;margin:4px 0;"><b>Fair Market Value: \u20B9 ${formatIndianCurrency(totalPropertyValue)} (${rupeesInWords(totalPropertyValue)})</b></p>
        <p style="padding:4px 0;margin:2px 0;"><b>Realizable Value (${fields.realizablePct || '90'}%): \u20B9 ${formatIndianCurrency(realizableValue)} (${rupeesInWords(realizableValue)})</b></p>
        <p style="background:#FFF2CC;padding:4px 8px;margin:4px 0;"><b>Distress Sale Value (${fields.distressPct || '80'}%): \u20B9 ${formatIndianCurrency(distressValue)} (${rupeesInWords(distressValue)})</b></p>
      </div>
      <div style="margin-top:28px;text-align:right;font-size:9px;line-height:1.5;font-family:Calibri,Arial,sans-serif;">
        <p style="margin:0;">_______________________________</p>
        <p style="font-weight:bold;margin:3px 0;color:#1F4E78;font-size:10px;">Satyajit Mohanty</p>
        <p style="margin:2px 0;color:#333;">B.Sc.(Engg.), M.Tech (IIT Kharagpur)</p>
        <p style="margin:2px 0;color:#333;">Registered Valuer \u2014 IBBI/RV/02/2019/10594</p>
        <p style="margin:2px 0;color:#555;">S. Mohanty &amp; Associates, Bhubaneswar</p>
      </div>
      ${pageFooter(5, 0)}
    </div>`;

    const generatedPages = [page1, page2, page3, page4, page5];
    let pageCount = 5;

    // ═══════════════════════════════════════════════════════════════════
    // PROPERTY PHOTOGRAPHS PAGE
    // ═══════════════════════════════════════════════════════════════════
    if (fields.propertyImages && fields.propertyImages.length > 0) {
      pageCount++;
      const photoPageNum = pageCount;
      generatedPages.push(`<div style="font-family:Calibri,Arial,sans-serif;color:#111;">
        ${pageHeader}
        <p style="font-size:11px;font-weight:bold;text-align:center;text-decoration:underline;margin-bottom:12px;color:#1F4E78;">12. PROPERTY PHOTOGRAPHS</p>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
          ${fields.propertyImages.map((url, idx) => `
            <div style="border:0.75pt solid #AAAAAA;padding:4px;text-align:center;background:#FFF;">
              <img src="${url}" style="width:100%;height:180px;object-fit:cover;" crossOrigin="anonymous" />
              <p style="font-size:8.5px;margin:5px 0 0;font-style:italic;color:#555;font-family:Calibri,Arial,sans-serif;">Figure ${idx + 1}: Photograph ${idx + 1}</p>
            </div>
          `).join('')}
        </div>
        ${pageFooter(photoPageNum, 0)}
      </div>`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // SKETCH MAP PAGE
    // ═══════════════════════════════════════════════════════════════════
    if (fields.sketchMapImage) {
      pageCount++;
      const sketchPageNum = pageCount;
      const sketchFigNum = (fields.propertyImages?.length || 0) + 1;
      generatedPages.push(`<div style="font-family:Calibri,Arial,sans-serif;color:#111;">
        ${pageHeader}
        <p style="font-size:11px;font-weight:bold;text-align:center;text-decoration:underline;margin-bottom:12px;color:#1F4E78;">13. SKETCH MAP</p>
        <div style="text-align:center;border:0.75pt solid #AAAAAA;padding:6px;">
          <img src="${fields.sketchMapImage}" style="max-width:100%;max-height:680px;" crossOrigin="anonymous" />
          <p style="font-size:9px;font-style:italic;color:#555;margin-top:6px;font-family:Calibri,Arial,sans-serif;">Figure ${sketchFigNum}: Revenue Sketch Map</p>
        </div>
        <p style="font-size:8px;color:#555;text-align:center;margin-top:4px;font-style:italic;">Source: Site Visit dated ${fields.dateOfInspection || 'N/A'}</p>
        ${pageFooter(sketchPageNum, 0)}
      </div>`);
    }

    // ═══════════════════════════════════════════════════════════════════
    // LOCATION MAP PAGE
    // ═══════════════════════════════════════════════════════════════════
    if (fields.locationMapImage) {
      pageCount++;
      const locPageNum = pageCount;
      const locFigNum = (fields.propertyImages?.length || 0) + (fields.sketchMapImage ? 1 : 0) + 1;
      generatedPages.push(`<div style="font-family:Calibri,Arial,sans-serif;color:#111;">
        ${pageHeader}
        <p style="font-size:11px;font-weight:bold;text-align:center;text-decoration:underline;margin-bottom:12px;color:#1F4E78;">14. LOCATION MAP</p>
        <div style="text-align:center;border:0.75pt solid #AAAAAA;padding:6px;">
          <img src="${fields.locationMapImage}" style="max-width:100%;max-height:630px;" crossOrigin="anonymous" />
          <p style="font-size:9px;font-style:italic;color:#555;margin-top:6px;font-family:Calibri,Arial,sans-serif;">Figure ${locFigNum}: Location Map</p>
        </div>
        ${fields.latitude || fields.longitude ? `<p style="text-align:center;font-size:8.5px;margin-top:6px;color:#1F4E78;font-weight:bold;">Lat: ${fields.latitude || 'N/A'}, Long: ${fields.longitude || 'N/A'}</p>` : ''}
        <p style="font-size:8px;color:#555;text-align:center;margin-top:2px;font-style:italic;">Source: Site Visit dated ${fields.dateOfInspection || 'N/A'}</p>
        ${pageFooter(locPageNum, 0)}
      </div>`);
    }

    // Post-process: inject correct total page count into all footers (replaces "Page N of 0")
    const total = generatedPages.length;
    return generatedPages.map((p, i) =>
      p.replace(/Page \d+ of 0/g, `Page ${i + 1} of ${total}`)
    );
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-4" ref={reportRef}>
      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

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
      <Section title="General Details" number={1}>
        <div className="space-y-3">
          <Field label="Type of Property">
            <select className={selectCls} value={fields.propertyType} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly}>
              <option>Residential</option><option>Commercial</option><option>Residential cum Commercial</option><option>Industrial</option><option>Vacant Plot</option>
            </select>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Name of Customer(s)">
              <input className={inputCls} value={fields.ownerName} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} placeholder="Full name of property owner" />
            </Field>
            <Field label="Property Address with Pin Code">
              <input className={inputCls} value={fields.ownerAddress} onChange={e => handleChange('ownerAddress', e.target.value)} disabled={isReadOnly} placeholder="Full property address with pin code" />
            </Field>
            <Field label="Landmark">
              <input className={inputCls} value={fields.landmark} onChange={e => handleChange('landmark', e.target.value)} disabled={isReadOnly} placeholder="e.g. Near Kantapada UP School" />
            </Field>
            <Field label="Loan Application Number">
              <input className={inputCls} value={fields.loanApplicationNo} onChange={e => handleChange('loanApplicationNo', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Name of Document Holder">
              <input className={inputCls} value={fields.documentHolderName} onChange={e => handleChange('documentHolderName', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Legal Address of Property" span={2}>
              <input className={inputCls} value={fields.legalAddress} onChange={e => handleChange('legalAddress', e.target.value)} disabled={isReadOnly} placeholder="Hissa/Survey/Khasra No, Khata No, Plot No, Mouza, Tahasil, District" />
            </Field>
            <Field label="Date of Inspection">
              <input type="date" className={inputCls} value={fields.dateOfInspection} onChange={e => handleChange('dateOfInspection', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Date of Valuation Report">
              <input type="date" className={inputCls} value={fields.dateOfValuation} onChange={e => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Bank / Financial Institution">
              <input className={inputCls} value={fields.bankName} onChange={e => handleChange('bankName', e.target.value)} disabled={isReadOnly} placeholder="e.g. HDFC Bank" />
            </Field>
            <Field label="Branch Name">
              <input className={inputCls} value={fields.branchName} onChange={e => handleChange('branchName', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Ref No.">
              <input className={inputCls} value={fields.refNo} onChange={e => handleChange('refNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. SMA/07-26/22" />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 2: Surrounding Locality Details ── */}
      <Section title="Surrounding Locality Details" number={2} defaultOpen={false}>
        <div className="space-y-3">
          <Field label="Ward No / Municipal Land No" span={2}>
            <input className={inputCls} value={fields.wardNo} onChange={e => handleChange('wardNo', e.target.value)} disabled={isReadOnly} />
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Vicinity">
              <select className={selectCls} value={fields.vicinity} onChange={e => handleChange('vicinity', e.target.value)} disabled={isReadOnly}>
                <option>Slum</option><option>Residential</option><option>Commercial</option><option>Mixed</option><option>Industrial</option>
              </select>
            </Field>
            <Field label="Locality Type">
              <select className={selectCls} value={fields.classOfLocality} onChange={e => handleChange('classOfLocality', e.target.value)} disabled={isReadOnly}>
                <option>Elite/Posh/High Class</option><option>Upper Middle Class</option><option>Middle Class</option><option>Lower Middle Class</option><option>Poor / Slum</option>
              </select>
            </Field>
            <Field label="Approach Road Width">
              <select className={selectCls} value={fields.approachRoadWidth} onChange={e => handleChange('approachRoadWidth', e.target.value)} disabled={isReadOnly}>
                <option>{'>'}=60 Feet Road</option><option>60-40 Feet Road</option><option>40-20 Feet Road</option><option>{'<'}20 Feet Road</option>
              </select>
            </Field>
            <Field label="Plot Demarcated at Site">
              <select className={selectCls} value={fields.plotDemarcated} onChange={e => handleChange('plotDemarcated', e.target.value)} disabled={isReadOnly}>
                <option>Yes</option><option>No</option>
              </select>
            </Field>
          </div>
          <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mt-2">Proximity to Civic Amenities</p>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Nearest Railway Station"><input className={inputCls} value={fields.distanceRailwayStation} onChange={e => handleChange('distanceRailwayStation', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2 Km" /></Field>
            <Field label="Nearest Bus Stop"><input className={inputCls} value={fields.distanceBusStop} onChange={e => handleChange('distanceBusStop', e.target.value)} disabled={isReadOnly} placeholder="e.g. 0.5 Km" /></Field>
            <Field label="Nearest Hospital"><input className={inputCls} value={fields.distanceHospital} onChange={e => handleChange('distanceHospital', e.target.value)} disabled={isReadOnly} placeholder="e.g. 3 Km" /></Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Property Identification">
              <select className={selectCls} value={fields.propertyIdentification} onChange={e => handleChange('propertyIdentification', e.target.value)} disabled={isReadOnly}>
                <option>Easy to Identify</option><option>Identification by documents</option><option>Additional documents required</option><option>Difficult to identify</option>
              </select>
            </Field>
            <Field label="Identification Remarks"><input className={inputCls} value={fields.propertyIdentificationRemarks} onChange={e => handleChange('propertyIdentificationRemarks', e.target.value)} disabled={isReadOnly} placeholder="Additional remarks..." /></Field>
            <Field label="Proximity to Facilities (Educational, Recreational)">
              <select className={selectCls} value={fields.proximityToFacilities} onChange={e => handleChange('proximityToFacilities', e.target.value)} disabled={isReadOnly}>
                <option>{'<'}1 Km</option><option>1-3 Kms</option><option>3-5 Kms</option><option>{'>'}5 Kms</option>
              </select>
            </Field>
          </div>
          <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mt-2">Landmark Details</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Nearest Railway Station"><input className={inputCls} value={fields.landmarkRailway} onChange={e => handleChange('landmarkRailway', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Nearest Bus Stop"><input className={inputCls} value={fields.landmarkBusStop} onChange={e => handleChange('landmarkBusStop', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Nearest Hospital"><input className={inputCls} value={fields.landmarkHospital} onChange={e => handleChange('landmarkHospital', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Nearest Landmark"><input className={inputCls} value={fields.landmarkNearest} onChange={e => handleChange('landmarkNearest', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Property Details ── */}
      <Section title="Property Details" number={3} defaultOpen={false}>
        <div className="space-y-3">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Type of Usage of Entire Property">
              <select className={selectCls} value={fields.usageType} onChange={e => handleChange('usageType', e.target.value)} disabled={isReadOnly}>
                <option>Residential</option><option>Commercial</option><option>Residential cum Commercial</option><option>Industrial</option><option>Vacant Plot</option>
              </select>
            </Field>
            <Field label="Additional Amenities">
              <select className={selectCls} value={fields.additionalAmenities} onChange={e => handleChange('additionalAmenities', e.target.value)} disabled={isReadOnly}>
                <option>Garden</option><option>Swimming Pool</option><option>Not Applicable</option>
              </select>
            </Field>
            <Field label="Legal Status of Property">
              <select className={selectCls} value={fields.legalStatus} onChange={e => handleChange('legalStatus', e.target.value)} disabled={isReadOnly}>
                <option>Freehold</option><option>Lease hold {'>'}30 yrs.</option><option>Lease hold 15-30 yrs.</option><option>Lease hold {'<'}15 yrs.</option>
              </select>
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 4: Subject Property Details ── */}
      <Section title="Subject Property Details" number={4} defaultOpen={false}>
        <div className="space-y-3">
          <Field label="Type of Premises">
            <select className={selectCls} value={fields.premisesType} onChange={e => handleChange('premisesType', e.target.value)} disabled={isReadOnly}>
              <option>Residential Flat</option><option>Gala</option><option>Shop</option><option>Bungalow</option><option>Row House</option><option>Office</option><option>Chawl</option><option>Open Plot</option><option>Showroom</option><option>Duplex Flat</option><option>Pent House</option>
            </select>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Occupied by / Is Property Vacant">
              <input className={inputCls} value={fields.occupiedBy} onChange={e => handleChange('occupiedBy', e.target.value)} disabled={isReadOnly} placeholder="e.g. Self Occupied" />
            </Field>
            <Field label="Is Property Rented">
              <input className={inputCls} value={fields.isPropertyRented} onChange={e => handleChange('isPropertyRented', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="If Rented, List of Occupants" span={2}>
              <input className={inputCls} value={fields.rentedOccupants} onChange={e => handleChange('rentedOccupants', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
          </div>
          <Field label="Property Taxation / Maintenance Cost">
            <select className={selectCls} value={fields.propertyTaxation} onChange={e => handleChange('propertyTaxation', e.target.value)} disabled={isReadOnly}>
              <option>Low</option><option>Average</option><option>High</option><option>Very High</option>
            </select>
          </Field>
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-3">Boundary Details \u2014 As per Sketch Map</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="North"><input className={inputCls} value={fields.boundaryNorth} onChange={e => handleChange('boundaryNorth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="East"><input className={inputCls} value={fields.boundaryEast} onChange={e => handleChange('boundaryEast', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="South"><input className={inputCls} value={fields.boundarySouth} onChange={e => handleChange('boundarySouth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="West"><input className={inputCls} value={fields.boundaryWest} onChange={e => handleChange('boundaryWest', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-3">Boundary Details \u2014 At Site</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="North"><input className={inputCls} value={fields.buildingBoundaryNorth} onChange={e => handleChange('buildingBoundaryNorth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="East"><input className={inputCls} value={fields.buildingBoundaryEast} onChange={e => handleChange('buildingBoundaryEast', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="South"><input className={inputCls} value={fields.buildingBoundarySouth} onChange={e => handleChange('buildingBoundarySouth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="West"><input className={inputCls} value={fields.buildingBoundaryWest} onChange={e => handleChange('buildingBoundaryWest', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Section 5: Structural Details ── */}
      <Section title="Structural Details" number={5} defaultOpen={false}>
        <div className="space-y-3">
          <Field label="Type of Structure">
            <select className={selectCls} value={fields.structureType} onChange={e => handleChange('structureType', e.target.value)} disabled={isReadOnly}>
              <option>RCC</option><option>Load Bearing</option><option>Steel Structure</option><option>Composite Structure</option><option>Industrial Shed</option><option>A/C Sheet</option><option>G/I Sheet</option><option>Asbestos Roofing</option>
            </select>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="No. of Floors"><input className={inputCls} value={fields.numberOfFloors} onChange={e => handleChange('numberOfFloors', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="No. of Wings"><input className={inputCls} value={fields.numberOfWings} onChange={e => handleChange('numberOfWings', e.target.value)} disabled={isReadOnly} placeholder="NA" /></Field>
            <Field label="No. of Units on Each Floor"><input className={inputCls} value={fields.unitsPerFloor} onChange={e => handleChange('unitsPerFloor', e.target.value)} disabled={isReadOnly} placeholder="NA" /></Field>
            <Field label="Internal Composition"><input className={inputCls} value={fields.internalComposition} onChange={e => handleChange('internalComposition', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="No. of Lifts"><input className={inputCls} value={fields.numberOfLifts} onChange={e => handleChange('numberOfLifts', e.target.value)} disabled={isReadOnly} placeholder="NA" /></Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Age of the Property">
              <select className={selectCls} value={fields.ageOfProperty} onChange={e => handleChange('ageOfProperty', e.target.value)} disabled={isReadOnly}>
                <option value="">Select...</option><option>1-10 years</option><option>11-25 years</option><option>26-50 years</option><option>{'>'}50 years</option>
              </select>
            </Field>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Estimated Future Life"><input className={inputCls} value={fields.estimatedFutureLife} onChange={e => handleChange('estimatedFutureLife', e.target.value)} disabled={isReadOnly} placeholder="e.g. 52 Years" /></Field>
            <Field label="Exteriors"><input className={inputCls} value={fields.exteriors} onChange={e => handleChange('exteriors', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
          <Field label="Quality of Construction, Appearance & Maintenance">
            <select className={selectCls} value={fields.qualityOfConstruction} onChange={e => handleChange('qualityOfConstruction', e.target.value)} disabled={isReadOnly}>
              <option>Very Good</option><option>Good</option><option>Average</option><option>Poor</option>
            </select>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Common Areas Remarks"><input className={inputCls} value={fields.commonAreasRemarks} onChange={e => handleChange('commonAreasRemarks', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Other Observations" span={2}>
              <textarea className={inputCls + ' resize-none'} rows={2} value={fields.otherObservations} onChange={e => handleChange('otherObservations', e.target.value)} disabled={isReadOnly} placeholder="e.g. No appearance of cracks or major defects observed" />
            </Field>
          </div>
          <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mt-4">Interiors</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Flooring & Finishing"><input className={inputCls} value={fields.flooringType} onChange={e => handleChange('flooringType', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Roofing & Terracing"><input className={inputCls} value={fields.roofType} onChange={e => handleChange('roofType', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Quality of Fixtures & Fittings"><input className={inputCls} value={fields.qualityOfFixtures} onChange={e => handleChange('qualityOfFixtures', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </div>
      </Section>

      {/* ── Section 6: Plan Approvals ── */}
      <Section title="Plan Approvals" number={6} defaultOpen={false}>
        <div className="space-y-3">
          <Field label="Construction as per Approved Plans">
            <select className={selectCls} value={fields.constructionApproved} onChange={e => handleChange('constructionApproved', e.target.value)} disabled={isReadOnly}>
              <option>Yes</option><option>No</option>
            </select>
          </Field>
          <div className="space-y-4">
            <Field label="Details of Approved Plan (Approval No. & Date)" span={2}>
              <textarea className={inputCls + ' resize-none'} rows={2} value={fields.approvalDetails} onChange={e => handleChange('approvalDetails', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Construction Permission No. & Date">
              <input className={inputCls} value={fields.constructionPermission} onChange={e => handleChange('constructionPermission', e.target.value)} disabled={isReadOnly} placeholder="Not mentioned" />
            </Field>
            <Field label="Violations Observed / Risk of Demolition">
              <input className={inputCls} value={fields.violationsObserved} onChange={e => handleChange('violationsObserved', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="If Plans Not Available, Does Structure Conform to Local Byelaws">
              <input className={inputCls} value={fields.conformsToByelaws} onChange={e => handleChange('conformsToByelaws', e.target.value)} disabled={isReadOnly} placeholder="NA (Plan available)" />
            </Field>
            <Field label="Other Documents Verified" span={2}>
              <textarea className={inputCls + ' resize-none'} rows={2} value={fields.documentsVerified} onChange={e => handleChange('documentsVerified', e.target.value)} disabled={isReadOnly} placeholder="e.g. Xerox copy of Sale deed, ROR, Sketch map & approved plan verified" />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 7: Floor-wise Area & Building Valuation ── */}
      <Section title="Floor-wise Area & Building Valuation" number={7}>
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-sm font-semibold text-[#0f2038]">Building Valuation Details</h4>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6c757d] font-bold uppercase tracking-wide">Floor Unit:</span>
            <select
              className={selectCls + ' !py-1 !text-xs w-28'}
              value={fields.floorAreaUnit || fields.landAreaUnit || 'Sqft'}
              onChange={e => handleChange('floorAreaUnit', e.target.value)}
              disabled={isReadOnly}
            >
              <option>Sqft</option><option>Decimal</option><option>Acre</option><option>Sqm</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#0a1628] text-white">
                <th className="px-3 py-2.5 text-left font-semibold text-xs">Floor</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Area ({fields.floorAreaUnit || fields.landAreaUnit || 'Sqft'})</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Rate (&#8377;/{fields.floorAreaUnit || fields.landAreaUnit || 'Sqft'})</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Estimated (&#8377;)</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs">Life (Yr)</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs">Age (Yr)</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs">Dep %</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Net Value (&#8377;)</th>
                {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {floorValuations.map((f, idx) => (
                <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input className={inputCls + ' !py-1.5 text-xs'} value={f.name || ''} onChange={e => updateFloor(f.id, 'name', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" step="any" className={inputCls + ' !py-1.5 text-xs text-right'} value={f.area || ''} onChange={e => updateFloor(f.id, 'area', e.target.value)} disabled={isReadOnly} placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" step="any" className={inputCls + ' !py-1.5 text-xs text-right'} value={f.rate || ''} onChange={e => updateFloor(f.id, 'rate', e.target.value)} disabled={isReadOnly} placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef] text-right text-xs font-medium text-[#0f2038]">
                    &#8377;{formatIndianCurrency(f.estimated)}
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" className={inputCls + ' !py-1.5 text-xs text-center'} value={f.lifeYears || ''} onChange={e => updateFloor(f.id, 'lifeYears', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" className={inputCls + ' !py-1.5 text-xs text-center'} value={f.ageYears || ''} onChange={e => updateFloor(f.id, 'ageYears', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input
                      type="number" min="0"
                      className={inputCls + ' !py-1.5 text-xs text-center font-bold text-[#b8860b]'}
                      value={f.depreciationPct !== undefined && f.depreciationPct !== null ? f.depreciationPct : ''}
                      onChange={e => updateFloor(f.id, 'depreciationPct', e.target.value)}
                      disabled={isReadOnly}
                      placeholder={`${computeDepreciation(parseNum(f.lifeYears), parseNum(f.ageYears))}`}
                    />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef] text-right text-xs font-bold text-[#0f2038]">
                    &#8377;{formatIndianCurrency(f.netValue)}
                  </td>
                  {!isReadOnly && (
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <button onClick={() => removeFloor(f.id)} className="text-red-400 hover:text-red-600 text-lg" title="Remove floor">&times;</button>
                    </td>
                  )}
                </tr>
              ))}
              <tr className="bg-[#f0ead6] font-bold">
                <td className="px-3 py-2.5 text-xs">TOTAL</td>
                <td className="px-3 py-2.5 text-right text-xs">{formatIndianCurrency(totalPlinthArea)} {fields.floorAreaUnit || fields.landAreaUnit || 'Sqft'}</td>
                <td className="px-3 py-2.5" colSpan={5}></td>
                <td className="px-3 py-2.5 text-right text-xs text-[#0f2038]">&#8377;{formatIndianCurrency(totalBuildingValue)}</td>
                {!isReadOnly && <td></td>}
              </tr>
            </tbody>
          </table>
        </div>
        {!isReadOnly && (
          <button onClick={addFloor} className="mt-3 text-sm text-[#b8860b] hover:text-[#96700a] font-medium flex items-center gap-1">
            <span className="text-lg">+</span> Add Floor
          </button>
        )}
      </Section>

      {/* ── Section 8: Valuation of Land ── */}
      <Section title="Valuation of Land" number={8} defaultOpen={false}>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Land Area">
              <input className={inputCls} value={fields.landArea} onChange={e => handleChange('landArea', e.target.value)} disabled={isReadOnly} placeholder="e.g. 13068" />
            </Field>
            <Field label="Land Area Unit">
              <select className={selectCls} value={fields.landAreaUnit} onChange={e => handleChange('landAreaUnit', e.target.value)} disabled={isReadOnly}>
                <option>Sqft</option><option>Decimal</option><option>Acre</option><option>Sqm</option>
              </select>
            </Field>
            <Field label="Current Govt. Approved Rate (&#8377;)">
              <input className={inputCls} value={fields.govtLandRate} onChange={e => handleChange('govtLandRate', e.target.value)} disabled={isReadOnly} placeholder="e.g. 23" />
            </Field>
            <Field label={`Recommended Rate per ${fields.landAreaUnit} (&#8377;)`}>
              <input type="number" min="0" step="any" className={inputCls} value={fields.landRatePerUnit} onChange={e => handleChange('landRatePerUnit', e.target.value)} disabled={isReadOnly} placeholder="e.g. 450" />
            </Field>
            <Field label="Basis for Recommendation" span={2}>
              <input className={inputCls} value={fields.recommendedRateBasis} onChange={e => handleChange('recommendedRateBasis', e.target.value)} disabled={isReadOnly} placeholder="e.g. As per local feedback and market survey" />
            </Field>
          </div>
          <div className="px-4 py-3 rounded-lg bg-[#f0ead6] border border-[#d4c5a9] text-sm font-bold text-[#0f2038]">
            Total Land Value: &#8377; {formatIndianCurrency(landValue)}
          </div>
          <Field label="BUA as per Approvals">
            <input className={inputCls} value={fields.buaAsPerApprovals} onChange={e => handleChange('buaAsPerApprovals', e.target.value)} disabled={isReadOnly} placeholder="e.g. 2 X 1600sqft = 3200sqft" />
          </Field>
        </div>
      </Section>

      {/* ── Section 9: Abstract of Valuation ── */}
      <Section title="Abstract of Valuation" number={9}>
        <div className="space-y-3 max-w-xl">
          {[
            { label: 'A. Value of Land', value: landValue },
            { label: 'B. Value of Building (After Depreciation)', value: totalBuildingValue },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
              <span className="text-sm text-[#495057]">{item.label}</span>
              <span className="text-sm font-semibold text-[#0f2038]">&#8377; {formatIndianCurrency(item.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-3 bg-gradient-to-r from-[#f0ead6] to-[#f8f4eb] px-4 rounded-lg border border-[#d4c5a9]">
            <span className="text-sm font-bold text-[#0f2038]">TOTAL FAIR MARKET VALUE (A + B)</span>
            <span className="text-lg font-bold text-[#b8860b]">&#8377; {formatIndianCurrency(totalPropertyValue)}</span>
          </div>
          <p className="text-xs text-[#6c757d] italic pl-1">{rupeesInWords(totalPropertyValue)}</p>

          <div className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#495057]">Realizable Value</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#495057]">(</span>
                <input type="number" min="0" className={inputCls + ' !py-1 !px-2 text-xs w-16 text-center'} value={fields.realizablePct} onChange={e => handleChange('realizablePct', e.target.value)} disabled={isReadOnly} placeholder="90" />
                <span className="text-sm text-[#495057]">%)</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-green-700">&#8377; {formatIndianCurrency(realizableValue)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#495057]">Distress / Forced Sale Value</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-[#495057]">(</span>
                <input type="number" min="0" className={inputCls + ' !py-1 !px-2 text-xs w-16 text-center'} value={fields.distressPct} onChange={e => handleChange('distressPct', e.target.value)} disabled={isReadOnly} placeholder="80" />
                <span className="text-sm text-[#495057]">%)</span>
              </div>
            </div>
            <span className="text-sm font-semibold text-orange-700">&#8377; {formatIndianCurrency(distressValue)}</span>
          </div>

          <div className="mt-3 space-y-3">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Marketability">
                <select className={selectCls} value={fields.marketability} onChange={e => handleChange('marketability', e.target.value)} disabled={isReadOnly}>
                  <option>Excellent</option><option>Very Good</option><option>Good</option><option>Difficult</option>
                </select>
              </Field>
              <Field label="Valuation Result">
                <select className={selectCls} value={fields.valuationResult} onChange={e => handleChange('valuationResult', e.target.value)} disabled={isReadOnly}>
                  <option>Positive</option><option>Negative</option>
                </select>
              </Field>
            </div>
            <Field label="Replacement Cost / Insurance Value (&#8377;)">
              <input className={inputCls} value={fields.replacementCost} onChange={e => handleChange('replacementCost', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Deviations in Property">
              <input className={inputCls} value={fields.deviations} onChange={e => handleChange('deviations', e.target.value)} disabled={isReadOnly} placeholder="NA" />
            </Field>
            <Field label="Govt. / Guideline Value (&#8377;)">
              <input className={inputCls} value={fields.guidelineValue} onChange={e => handleChange('guidelineValue', e.target.value)} disabled={isReadOnly} placeholder="As per Govt. record (optional)" />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 10: Remarks & Declaration ── */}
      <Section title="Remarks & Declaration" number={10} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Demarcation" span={2}>
            <textarea className={inputCls + ' resize-none'} rows={2} value={fields.demarcation} onChange={e => handleChange('demarcation', e.target.value)} disabled={isReadOnly} placeholder="Demarcation details..." />
          </Field>
          <Field label="Possession" span={2}>
            <input className={inputCls} value={fields.possession} onChange={e => handleChange('possession', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Remarks / Observations" span={2}>
            <textarea className={inputCls + ' resize-none'} rows={4} value={fields.remarks} onChange={e => handleChange('remarks', e.target.value)} disabled={isReadOnly} placeholder="Detailed remarks about the property..." />
          </Field>
          <Field label="Name of Representative who Inspected">
            <input className={inputCls} value={fields.representativeName} onChange={e => handleChange('representativeName', e.target.value)} disabled={isReadOnly} placeholder="e.g. Dinesh Das" />
          </Field>
        </div>
      </Section>

      {/* ── Section 11: Valuation Certificate (Auto-generated) ── */}
      <Section title="Valuation Certificate (Auto-generated)" number={11} defaultOpen={false}>
        <div className="bg-[#fdfcf8] border border-[#d4c5a9] rounded-xl p-6 text-sm leading-relaxed text-[#333]">
          <p className="text-center font-bold text-base mb-4 underline">VALUATION CERTIFICATE</p>
          <p className="mb-3">
            This is to certify that the undersigned has personally inspected the property belonging to
            <strong> {fields.ownerName || '________'}</strong> situated at
            <strong> {fields.ownerAddress || '________'}</strong> on
            <strong> {fields.dateOfInspection || '________'}</strong> and after careful examination and consideration
            of all relevant factors, the Fair Market Value of the said property is assessed as under:
          </p>
          <div className="space-y-2 my-4 pl-4 border-l-4 border-[#b8860b]">
            <p><strong>Fair Market Value:</strong> &#8377; {formatIndianCurrency(totalPropertyValue)} ({rupeesInWords(totalPropertyValue)})</p>
            <p><strong>Realizable Value ({fields.realizablePct || '90'}%):</strong> &#8377; {formatIndianCurrency(realizableValue)} ({rupeesInWords(realizableValue)})</p>
            <p><strong>Distress Sale Value ({fields.distressPct || '80'}%):</strong> &#8377; {formatIndianCurrency(distressValue)} ({rupeesInWords(distressValue)})</p>
          </div>
          <div className="text-right mt-8">
            <p className="font-bold">Satyajit Mohanty</p>
            <p className="text-xs text-[#6c757d]">B.Sc.(Engg.), M.Tech (IIT Kharagpur)</p>
            <p className="text-xs text-[#6c757d]">Registered Valuer &mdash; IBBI/RV/02/2019/10594</p>
          </div>
        </div>
      </Section>

      {/* ── Section 12: Property Photographs ── */}
      {(!isReadOnly || (fields.propertyImages && fields.propertyImages.length > 0)) && (
        <Section title="Property Photographs" number={12} defaultOpen={false}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {fields.propertyImages?.map((url: string, idx: number) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#e9ecef] aspect-square">
                <img src={url} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                {!isReadOnly && (
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  >&times;</button>
                )}
              </div>
            ))}
          </div>
          {!isReadOnly && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                  {uploading ? 'Uploading...' : '\uD83D\uDCF7 Add Property Images'}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={e => handleFileUpload(e, 'propertyImages')} disabled={uploading} />
                </label>
                <span className="text-xs text-[#6c757d]">Max size: 5MB per photograph</span>
              </div>
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                  &#x26A0;&#xFE0F; {uploadError}
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* ── Section 13: Sketch Map ── */}
      <Section title="Sketch Map" number={13} defaultOpen={false}>
        {fields.sketchMapImage ? (
          <div className="space-y-3">
            <div className="relative group rounded-xl overflow-hidden border border-[#e9ecef] max-w-lg">
              <img src={fields.sketchMapImage} alt="Sketch Map" className="w-full object-contain" />
              {!isReadOnly && (
                <button onClick={() => handleChange('sketchMapImage', '')} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
              )}
            </div>
          </div>
        ) : (
          !isReadOnly && (
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
              {uploading ? 'Uploading...' : '\uD83D\uDDFA\uFE0F Upload Sketch Map'}
              <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'sketchMapImage')} disabled={uploading} />
            </label>
          )
        )}
      </Section>

      {/* ── Section 14: Location Map ── */}
      <Section title="Location Map" number={14} defaultOpen={false}>
        <div className="space-y-4">
          {/* Live Google Maps Embed — auto-reads from property address */}
          {(() => {
            const mapQuery = fields.latitude && fields.longitude
              ? `${fields.latitude},${fields.longitude}`
              : fields.ownerAddress || '';
            const encodedQuery = encodeURIComponent(mapQuery);
            const hasQuery = mapQuery.trim().length > 0;
            const googleMapsUrl = fields.latitude && fields.longitude
              ? `https://www.google.com/maps?q=${fields.latitude},${fields.longitude}&z=15&t=k`
              : `https://www.google.com/maps/search/${encodedQuery}`;
            return (
              <div className="space-y-3">
                {hasQuery ? (
                  <div className="rounded-xl overflow-hidden border border-[#c8d6e5] shadow-sm">
                    <div className="bg-[#d5e8f5] px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-[#1a3a5c] uppercase tracking-wider">
                        Live Map Preview — Auto-loaded from Property Address
                      </span>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#b8860b] hover:underline"
                      >
                        Open in Google Maps &#x2197;
                      </a>
                    </div>
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodedQuery}&t=k&z=16&output=embed`}
                      width="100%"
                      height="400"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Property Location Map"
                    />
                    {fields.latitude && fields.longitude && (
                      <div className="bg-[#0a1628] text-[#f0c040] px-4 py-2 text-sm font-bold text-center">
                        Latitude: {fields.latitude}, Longitude: {fields.longitude}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl bg-[#f8f9fa] border border-[#dee2e6] text-center text-sm text-[#6c757d]">
                    <p className="font-semibold mb-1">No address found.</p>
                    <p>Fill in the <strong>Property Address</strong> in Section 1 (General Details) or enter Lat/Long below to auto-load the map.</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Screenshot upload for PDF (iframe can't be captured by html2canvas) */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider">
              Screenshot for PDF Report
            </p>
            <p className="text-xs text-[#6c757d]">
              The live map above is for reference. To include a map in the PDF, open Google Maps via the link above, take a satellite screenshot with the pin visible, and upload it below.
            </p>
            {fields.locationMapImage ? (
              <div className="relative group rounded-xl overflow-hidden border border-[#e9ecef] max-w-lg">
                <img src={fields.locationMapImage} alt="Location Map Screenshot" className="w-full object-contain" />
                {!isReadOnly && (
                  <button onClick={() => handleChange('locationMapImage', '')} className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-center text-xs py-1 font-semibold">
                  &#x2705; Screenshot uploaded — will appear in PDF
                </div>
              </div>
            ) : (
              !isReadOnly && (
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
                  {uploading ? 'Uploading...' : '\uD83D\uDCCD Upload Map Screenshot for PDF'}
                  <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'locationMapImage')} disabled={uploading} />
                </label>
              )
            )}
          </div>

          {/* Lat/Long inputs */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Latitude">
              <input className={inputCls} value={fields.latitude} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 19.976652" />
            </Field>
            <Field label="Longitude">
              <input className={inputCls} value={fields.longitude} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} placeholder="e.g. 86.240795" />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-4 pt-2 items-center">
        {status === 'COMPLETED' && (
          <div className="w-full p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 font-bold flex items-center gap-2">
            <span>&#x2705;</span> Verified and Completed (Pushed to storage for client download)
          </div>
        )}

        {status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE' && (
          <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 font-semibold mb-2">
            <span>&#x23F3; Currently Under Manager Review.</span>
            <button
              onClick={handleCancelSubmission}
              disabled={loading}
              className="px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors"
            >
              &#x21A9;&#xFE0F; Cancel Submission (Pull back to Draft)
            </button>
          </div>
        )}

        {!isReadOnly && (
          <>
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-[#b8860b] text-[#b8860b] font-semibold text-sm hover:bg-[#b8860b]/5 transition-all disabled:opacity-50"
            >
              {loading ? '\u23F3 Saving...' : '\uD83D\uDCBE Save Draft'}
            </button>
            {userRole === 'REPORT_EMPLOYEE' && (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {loading ? '\u23F3 Submitting...' : '\uD83D\uDCE4 Submit to Manager'}
              </button>
            )}
          </>
        )}

        <button
          onClick={handlePreviewPDF}
          disabled={loading}
          className="px-6 py-3 rounded-xl border-2 border-gray-400 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          &#x1F441;&#xFE0F; Preview PDF
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={loading}
          className="px-6 py-3 rounded-xl border-2 border-gray-400 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          &#x1F4E5; Download PDF
        </button>

        {status === 'MANAGER_REVIEW' && isManagerOrOwner && (
          <>
            <button
              onClick={handleReworkClick}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-red-500 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
            >
              &#x274C; Send for Rework
            </button>
            <button
              onClick={handleFinalize}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-sm hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              &#x2705; Finalize & Share to Client
            </button>
          </>
        )}
      </div>

      {/* Rework Modal */}
      {showReworkModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-6 border-b border-[#e9ecef] bg-[#f8f9fa]">
              <h2 className="text-xl font-bold text-[#0f2038]" style={{ fontFamily: 'var(--font-heading)' }}>
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
    </div>
  );
}
