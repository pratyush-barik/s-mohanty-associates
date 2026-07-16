'use client';

import { useState, useRef, useCallback } from 'react';
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
  // Section 1 – Basic Details
  ownerName: string;
  ownerAddress: string;
  bankName: string;
  branchName: string;
  purpose: string;
  dateOfInspection: string;
  dateOfValuation: string;

  // Section 2 – Property Description (As per Deed)
  khataNo: string;
  plotNo: string;
  mouza: string;
  tahasil: string;
  district: string;
  state: string;
  landArea: string;
  landAreaUnit: string;
  boundaryNorth: string;
  boundarySouth: string;
  boundaryEast: string;
  boundaryWest: string;

  // Section 3 – Locality
  localityType: string;
  developmentStatus: string;
  classOfLocality: string;
  civicAmenities: string[];
  distanceMainRoad: string;
  distanceRailway: string;
  nearbyLandmarks: string;

  // Section 4 – Building Description
  structureType: string;
  numberOfFloors: string;
  foundation: string;
  superstructure: string;
  roofType: string;
  flooringType: string;
  doorsWindows: string;
  plastering: string;
  sanitary: string;
  electrification: string;
  qualityOfConstruction: string;
  maintenanceCondition: string;
  buildingBoundaryNorth: string;
  buildingBoundarySouth: string;
  buildingBoundaryEast: string;
  buildingBoundaryWest: string;

  // Section 5 – Floor-wise Area
  floors: FloorRow[];

  // Section 6 – Land Valuation
  landRatePerUnit: string;

  // Section 8 – Abstract / Manual Override
  guidelineValue: string;

  // Section 9 – Remarks
  demarcation: string;
  possession: string;
  remarks: string;

  // Section 11 – Photos
  propertyImages: string[];
}

const DEFAULT_FIELDS: ReportFields = {
  ownerName: '',
  ownerAddress: '',
  bankName: '',
  branchName: '',
  purpose: 'Home Loan',
  dateOfInspection: new Date().toISOString().split('T')[0],
  dateOfValuation: new Date().toISOString().split('T')[0],

  khataNo: '',
  plotNo: '',
  mouza: '',
  tahasil: '',
  district: '',
  state: 'Odisha',
  landArea: '',
  landAreaUnit: 'Sqft',
  boundaryNorth: '',
  boundarySouth: '',
  boundaryEast: '',
  boundaryWest: '',

  localityType: 'Residential',
  developmentStatus: 'Developed',
  classOfLocality: 'Middle Class',
  civicAmenities: [],
  distanceMainRoad: '',
  distanceRailway: '',
  nearbyLandmarks: '',

  structureType: 'RCC Framed',
  numberOfFloors: '1',
  foundation: 'RCC',
  superstructure: 'Brick Masonry',
  roofType: 'RCC Slab',
  flooringType: 'Mosaic/Tiles',
  doorsWindows: 'Wooden/UPVC',
  plastering: 'Cement Plastering',
  sanitary: 'Standard',
  electrification: 'Concealed',
  qualityOfConstruction: 'Good',
  maintenanceCondition: 'Good',
  buildingBoundaryNorth: '',
  buildingBoundarySouth: '',
  buildingBoundaryEast: '',
  buildingBoundaryWest: '',

  floors: [{ id: '1', name: 'Ground Floor', area: '', rate: '', yearBuilt: '', lifeYears: '60', ageYears: '', depreciationPct: '' }],

  landRatePerUnit: '',

  guidelineValue: '',

  demarcation: '',
  possession: 'Self / Owner',
  remarks: '',

  propertyImages: [],
};

const CIVIC_AMENITIES_OPTIONS = [
  'Water Supply', 'Electricity', 'Drainage', 'Sewerage', 'Approach Road',
  'Street Lighting', 'School Nearby', 'Hospital Nearby', 'Market Nearby', 'Public Transport',
];

// ─── Helpers ───────────────────────────────────────────────────────
const parseNum = (v: string): number => parseFloat(v?.replace(/,/g, '') || '0') || 0;

function computeDepreciation(lifeYears: number, ageYears: number): number {
  if (lifeYears <= 0 || ageYears < 0) return 0;
  return Math.min(Math.round((ageYears / lifeYears) * 100), 90);
}

// ─── Section Wrapper ────────────────────────────────────────────────
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

// ─── Main Component ────────────────────────────────────────────────
interface ReportBuilderProps {
  projectId: string;
  initialFields: any;
  status: string;
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

export default function ReportBuilder({ projectId, initialFields, status, prefill }: ReportBuilderProps) {
  // Merge defaults → initialFields → prefill
  const merged = {
    ...DEFAULT_FIELDS,
    ...(initialFields || {}),
    ownerName: initialFields?.ownerName || prefill?.contactName || DEFAULT_FIELDS.ownerName,
    ownerAddress: initialFields?.ownerAddress || prefill?.propertyAddress || DEFAULT_FIELDS.ownerAddress,
  };

  // Ensure floors is always an array
  if (!Array.isArray(merged.floors) || merged.floors.length === 0) {
    merged.floors = DEFAULT_FIELDS.floors;
  }

  const [fields, setFields] = useState<ReportFields>(merged);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const reportRef = useRef<HTMLDivElement>(null);

  const isReadOnly = status === 'MANAGER_REVIEW' || status === 'COMPLETED';

  const handleChange = useCallback((field: keyof ReportFields, value: any) => {
    setFields(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Floor row helpers ──
  const addFloor = () => {
    const newId = String(Date.now());
    handleChange('floors', [...fields.floors, {
      id: newId, name: `Floor ${fields.floors.length}`, area: '', rate: '',
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
    const depAmount = Math.round(estimated * depPct / 100);
    const netValue = estimated - depAmount;
    return { ...f, estimated, depPct, depAmount, netValue };
  });

  const totalBuildingValue = floorValuations.reduce((sum, f) => sum + f.netValue, 0);
  const totalPropertyValue = landValue + totalBuildingValue;
  const realizableValue = Math.round(totalPropertyValue * 0.9);
  const distressValue = Math.round(totalPropertyValue * 0.8);

  // ── Image upload ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setMessage(null);

    const newUrls = [...(fields.propertyImages || [])];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = file.name.split('.').pop();
      const fileName = `${projectId}-${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = `reports/${fileName}`;
      const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
      if (error) { setMessage({ type: 'error', text: `Failed to upload ${file.name}` }); continue; }
      const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
      newUrls.push(data.publicUrl);
    }
    handleChange('propertyImages', newUrls);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    handleChange('propertyImages', fields.propertyImages.filter((_, i) => i !== index));
  };

  // ── Save / Submit ──
  const handleSaveDraft = async () => {
    setLoading(true);
    setMessage(null);
    const result = await saveReportDraft(projectId, fields);
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Draft saved successfully!' });
    setLoading(false);
  };

  const handleGeneratePDF = async (): Promise<Blob | null> => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      // Create a hidden container with the report content for PDF
      const pdfContainer = document.createElement('div');
      pdfContainer.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:white;padding:40px;font-family:Arial,sans-serif;color:#111;';
      pdfContainer.innerHTML = generatePDFHTML();
      document.body.appendChild(pdfContainer);

      const canvas = await html2canvas(pdfContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 794,
        windowWidth: 794,
      });

      document.body.removeChild(pdfContainer);

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = position - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf.output('blob');
    } catch (err) {
      console.error('PDF generation failed:', err);
      return null;
    }
  };

  const handlePreviewPDF = async () => {
    setMessage({ type: 'success', text: 'Generating PDF preview...' });
    const pdfBlob = await handleGeneratePDF();
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, '_blank');
    }
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (!confirm('Submit this report for manager verification? You cannot edit it until the manager returns it.')) return;

    setLoading(true);
    setMessage(null);

    // Save first
    await saveReportDraft(projectId, fields);

    // Submit for verification (no PDF generation yet)
    const result = await submitReportForVerification(projectId);
    setMessage(result.error ? { type: 'error', text: result.error } : { type: 'success', text: 'Report submitted for verification! Manager will review it.' });
    setLoading(false);
  };

  const handleFinalize = async () => {
    if (!confirm('Finalize and save this report? This will generate the official PDF.')) return;
    setLoading(true);
    setMessage({ type: 'success', text: 'Generating final PDF...' });
    const pdfBlob = await handleGeneratePDF();
    if (pdfBlob) {
      const pdfFileName = `${projectId}-report-${Date.now()}.pdf`;
      const pdfPath = `reports/pdfs/${pdfFileName}`;
      const { error: uploadError } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(pdfPath, pdfBlob, { contentType: 'application/pdf' });
      if (!uploadError) {
        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(pdfPath);
        
        const { finalizeReport } = await import('@/app/actions/project');
        const res = await finalizeReport(projectId, urlData.publicUrl);
        if (res.error) setMessage({ type: 'error', text: res.error });
        else setMessage({ type: 'success', text: 'Project Finalized Successfully! PDF is now available to the client.' });
      } else {
        setMessage({ type: 'error', text: 'Failed to upload PDF.' });
      }
    }
    setLoading(false);
  };

  const handleRework = async () => {
    if (!confirm('Send back to the agent for rework?')) return;
    setLoading(true);
    const { sendReportForRework } = await import('@/app/actions/project');
    const res = await sendReportForRework(projectId);
    if (res.error) setMessage({ type: 'error', text: res.error });
    else setMessage({ type: 'success', text: 'Report sent for rework.' });
    setLoading(false);
  };

  // ── PDF HTML Template ──
  function generatePDFHTML(): string {
    const titleStyle = 'font-size:16px;font-weight:bold;text-align:center;margin:10px 0;text-decoration:underline;';
    const thStyle = 'border:1px solid #333;padding:6px 10px;background:#e8e0d4;font-weight:bold;text-align:left;font-size:11px;';
    const tdStyle = 'border:1px solid #333;padding:6px 10px;font-size:11px;';
    const headingStyle = 'font-size:13px;font-weight:bold;background:#d4c5a9;padding:6px 10px;border:1px solid #333;text-align:center;';

    const floorRowsHTML = floorValuations.map(f => `
      <tr>
        <td style="${tdStyle}">${f.name}</td>
        <td style="${tdStyle} text-align:right;">${formatIndianCurrency(f.area)}</td>
        <td style="${tdStyle} text-align:right;">₹${formatIndianCurrency(f.rate)}</td>
        <td style="${tdStyle} text-align:right;">₹${formatIndianCurrency(f.estimated)}</td>
        <td style="${tdStyle} text-align:center;">${f.lifeYears}</td>
        <td style="${tdStyle} text-align:center;">${f.ageYears}</td>
        <td style="${tdStyle} text-align:center;">${f.depPct}%</td>
        <td style="${tdStyle} text-align:right;">₹${formatIndianCurrency(f.depAmount)}</td>
        <td style="${tdStyle} text-align:right;">₹${formatIndianCurrency(f.netValue)}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family:Arial,sans-serif;color:#111;line-height:1.5;">
        <!-- Header Image (Letterhead) -->
        <div style="text-align:center;margin-bottom:20px;">
          <img src="/templates/letterhead.png" style="width:100%;max-height:180px;object-fit:contain;" alt="Letterhead" crossOrigin="anonymous" />
        </div>

        <p style="${titleStyle}">VALUATION REPORT</p>

        <!-- Part 1: Details Table -->
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
          <tr><td style="${headingStyle}" colspan="4">PART 1 — BASIC DETAILS</td></tr>
          <tr><td style="${thStyle}" width="25%">Owner / Applicant</td><td style="${tdStyle}" colspan="3">${fields.ownerName}</td></tr>
          <tr><td style="${thStyle}">Owner Address</td><td style="${tdStyle}" colspan="3">${fields.ownerAddress}</td></tr>
          <tr><td style="${thStyle}">Bank / FI</td><td style="${tdStyle}">${fields.bankName}</td><td style="${thStyle}">Branch</td><td style="${tdStyle}">${fields.branchName}</td></tr>
          <tr><td style="${thStyle}">Purpose</td><td style="${tdStyle}">${fields.purpose}</td><td style="${thStyle}">Date of Inspection</td><td style="${tdStyle}">${fields.dateOfInspection}</td></tr>
          <tr><td style="${thStyle}">Date of Valuation</td><td style="${tdStyle}" colspan="3">${fields.dateOfValuation}</td></tr>

          <tr><td style="${headingStyle}" colspan="4">PROPERTY DESCRIPTION (As per Deed)</td></tr>
          <tr><td style="${thStyle}">Khata No.</td><td style="${tdStyle}">${fields.khataNo}</td><td style="${thStyle}">Plot No.</td><td style="${tdStyle}">${fields.plotNo}</td></tr>
          <tr><td style="${thStyle}">Mouza / Area</td><td style="${tdStyle}">${fields.mouza}</td><td style="${thStyle}">Tahasil</td><td style="${tdStyle}">${fields.tahasil}</td></tr>
          <tr><td style="${thStyle}">District</td><td style="${tdStyle}">${fields.district}</td><td style="${thStyle}">State</td><td style="${tdStyle}">${fields.state}</td></tr>
          <tr><td style="${thStyle}">Land Area</td><td style="${tdStyle}" colspan="3">${fields.landArea} ${fields.landAreaUnit}</td></tr>
          <tr><td style="${thStyle}">Boundary — North</td><td style="${tdStyle}">${fields.boundaryNorth}</td><td style="${thStyle}">South</td><td style="${tdStyle}">${fields.boundarySouth}</td></tr>
          <tr><td style="${thStyle}">Boundary — East</td><td style="${tdStyle}">${fields.boundaryEast}</td><td style="${thStyle}">West</td><td style="${tdStyle}">${fields.boundaryWest}</td></tr>

          <tr><td style="${headingStyle}" colspan="4">LOCALITY DESCRIPTION</td></tr>
          <tr><td style="${thStyle}">Locality Type</td><td style="${tdStyle}">${fields.localityType}</td><td style="${thStyle}">Development Status</td><td style="${tdStyle}">${fields.developmentStatus}</td></tr>
          <tr><td style="${thStyle}">Class of Locality</td><td style="${tdStyle}">${fields.classOfLocality}</td><td style="${thStyle}">Distance from Main Road</td><td style="${tdStyle}">${fields.distanceMainRoad}</td></tr>
          <tr><td style="${thStyle}">Civic Amenities</td><td style="${tdStyle}" colspan="3">${fields.civicAmenities?.join(', ') || 'N/A'}</td></tr>

          <tr><td style="${headingStyle}" colspan="4">BUILDING DESCRIPTION</td></tr>
          <tr><td style="${thStyle}">Structure Type</td><td style="${tdStyle}">${fields.structureType}</td><td style="${thStyle}">No. of Floors</td><td style="${tdStyle}">${fields.numberOfFloors}</td></tr>
          <tr><td style="${thStyle}">Foundation</td><td style="${tdStyle}">${fields.foundation}</td><td style="${thStyle}">Superstructure</td><td style="${tdStyle}">${fields.superstructure}</td></tr>
          <tr><td style="${thStyle}">Roof</td><td style="${tdStyle}">${fields.roofType}</td><td style="${thStyle}">Flooring</td><td style="${tdStyle}">${fields.flooringType}</td></tr>
          <tr><td style="${thStyle}">Doors & Windows</td><td style="${tdStyle}">${fields.doorsWindows}</td><td style="${thStyle}">Plastering</td><td style="${tdStyle}">${fields.plastering}</td></tr>
          <tr><td style="${thStyle}">Sanitary</td><td style="${tdStyle}">${fields.sanitary}</td><td style="${thStyle}">Electrification</td><td style="${tdStyle}">${fields.electrification}</td></tr>
          <tr><td style="${thStyle}">Quality</td><td style="${tdStyle}">${fields.qualityOfConstruction}</td><td style="${thStyle}">Maintenance</td><td style="${tdStyle}">${fields.maintenanceCondition}</td></tr>
        </table>

        <!-- Floor-wise Depreciation Table -->
        <p style="${titleStyle}">VALUATION OF BUILDING (After Depreciation)</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
          <tr>
            <th style="${thStyle}">Floor</th>
            <th style="${thStyle} text-align:right;">Area (Sqft)</th>
            <th style="${thStyle} text-align:right;">Rate (₹/Sqft)</th>
            <th style="${thStyle} text-align:right;">Estimated (₹)</th>
            <th style="${thStyle} text-align:center;">Life (Yr)</th>
            <th style="${thStyle} text-align:center;">Age (Yr)</th>
            <th style="${thStyle} text-align:center;">Dep %</th>
            <th style="${thStyle} text-align:right;">Dep Amt (₹)</th>
            <th style="${thStyle} text-align:right;">Net Value (₹)</th>
          </tr>
          ${floorRowsHTML}
          <tr style="font-weight:bold;background:#f0ead6;">
            <td style="${tdStyle}" colspan="8">Total Building Value</td>
            <td style="${tdStyle} text-align:right;">₹${formatIndianCurrency(totalBuildingValue)}</td>
          </tr>
        </table>

        <!-- Abstract -->
        <p style="${titleStyle}">ABSTRACT OF VALUATION</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:15px;">
          <tr><td style="${thStyle}" width="60%">A. Value of Land</td><td style="${tdStyle} text-align:right;">₹ ${formatIndianCurrency(landValue)}</td></tr>
          <tr><td style="${thStyle}">B. Value of Building (After Depreciation)</td><td style="${tdStyle} text-align:right;">₹ ${formatIndianCurrency(totalBuildingValue)}</td></tr>
          <tr style="font-weight:bold;background:#f0ead6;"><td style="${tdStyle}">TOTAL FAIR MARKET VALUE (A + B)</td><td style="${tdStyle} text-align:right;">₹ ${formatIndianCurrency(totalPropertyValue)}</td></tr>
          <tr><td style="${thStyle}">In Words</td><td style="${tdStyle}">${rupeesInWords(totalPropertyValue)}</td></tr>
          <tr><td style="${thStyle}">Realizable Value (90%)</td><td style="${tdStyle} text-align:right;">₹ ${formatIndianCurrency(realizableValue)}</td></tr>
          <tr><td style="${thStyle}">Distress / Forced Sale Value (80%)</td><td style="${tdStyle} text-align:right;">₹ ${formatIndianCurrency(distressValue)}</td></tr>
          ${fields.guidelineValue ? `<tr><td style="${thStyle}">Government / Guideline Value</td><td style="${tdStyle} text-align:right;">₹ ${formatIndianCurrency(fields.guidelineValue)}</td></tr>` : ''}
        </table>

        <!-- Certificate -->
        <p style="${titleStyle}">VALUATION CERTIFICATE</p>
        <div style="border:1px solid #333;padding:15px;font-size:11px;line-height:1.8;margin-bottom:15px;">
          <p>This is to certify that the undersigned has personally inspected the property belonging to 
          <strong>${fields.ownerName}</strong> situated at <strong>${fields.ownerAddress}</strong> on 
          <strong>${fields.dateOfInspection}</strong> and after careful examination and consideration of all relevant factors,
          the Fair Market Value of the said property is assessed as under:</p>
          <br/>
          <p><strong>Fair Market Value: ₹ ${formatIndianCurrency(totalPropertyValue)} (${rupeesInWords(totalPropertyValue)})</strong></p>
          <p><strong>Realizable Value: ₹ ${formatIndianCurrency(realizableValue)} (${rupeesInWords(realizableValue)})</strong></p>
          <p><strong>Distress Sale Value: ₹ ${formatIndianCurrency(distressValue)} (${rupeesInWords(distressValue)})</strong></p>
        </div>

        <!-- Signature -->
        <div style="margin-top:40px;text-align:right;font-size:11px;">
          <p>_______________________________</p>
          <p style="font-weight:bold;">Satyajit Mohanty</p>
          <p>B.Sc.(Engg.), M.Tech (IIT Kharagpur)</p>
          <p>Registered Valuer — IBBI/RV/02/2019/10594</p>
          <p>S. Mohanty & Associates, Bhubaneswar</p>
        </div>
      </div>
    `;
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

      {/* ── Section 1: Basic Details ── */}
      <Section title="Basic Details" number={1}>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Owner / Applicant Name">
            <input className={inputCls} value={fields.ownerName} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} placeholder="Full name of property owner" />
          </Field>
          <Field label="Owner Address">
            <input className={inputCls} value={fields.ownerAddress} onChange={e => handleChange('ownerAddress', e.target.value)} disabled={isReadOnly} placeholder="Full address" />
          </Field>
          <Field label="Bank / Financial Institution">
            <input className={inputCls} value={fields.bankName} onChange={e => handleChange('bankName', e.target.value)} disabled={isReadOnly} placeholder="e.g. State Bank of India" />
          </Field>
          <Field label="Branch Name">
            <input className={inputCls} value={fields.branchName} onChange={e => handleChange('branchName', e.target.value)} disabled={isReadOnly} placeholder="Branch" />
          </Field>
          <Field label="Purpose of Valuation">
            <select className={selectCls} value={fields.purpose} onChange={e => handleChange('purpose', e.target.value)} disabled={isReadOnly}>
              <option>Home Loan</option><option>Mortgage Loan</option><option>Balance Transfer</option>
              <option>Top Up Loan</option><option>Capital Gain</option><option>Wealth Tax</option>
              <option>Balance Sheet</option><option>Insurance</option><option>Other</option>
            </select>
          </Field>
          <Field label="Date of Inspection">
            <input type="date" className={inputCls} value={fields.dateOfInspection} onChange={e => handleChange('dateOfInspection', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Date of Valuation">
            <input type="date" className={inputCls} value={fields.dateOfValuation} onChange={e => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: Property Description ── */}
      <Section title="Property Description (As per Deed)" number={2} defaultOpen={false}>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Khata No."><input className={inputCls} value={fields.khataNo} onChange={e => handleChange('khataNo', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Plot No."><input className={inputCls} value={fields.plotNo} onChange={e => handleChange('plotNo', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Mouza / Area"><input className={inputCls} value={fields.mouza} onChange={e => handleChange('mouza', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Tahasil"><input className={inputCls} value={fields.tahasil} onChange={e => handleChange('tahasil', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="District"><input className={inputCls} value={fields.district} onChange={e => handleChange('district', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="State">
            <select className={selectCls} value={fields.state} onChange={e => handleChange('state', e.target.value)} disabled={isReadOnly}>
              <option>Odisha</option><option>West Bengal</option><option>Jharkhand</option><option>Chhattisgarh</option><option>Other</option>
            </select>
          </Field>
          <Field label="Land Area">
            <div className="flex gap-2">
              <input className={inputCls + ' flex-1'} value={fields.landArea} onChange={e => handleChange('landArea', e.target.value)} disabled={isReadOnly} placeholder="e.g. 1500" />
              <select className={selectCls + ' w-24'} value={fields.landAreaUnit} onChange={e => handleChange('landAreaUnit', e.target.value)} disabled={isReadOnly}>
                <option>Sqft</option><option>Decimal</option><option>Acre</option><option>Sqm</option>
              </select>
            </div>
          </Field>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-3">Boundaries</p>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="North"><input className={inputCls} value={fields.boundaryNorth} onChange={e => handleChange('boundaryNorth', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="South"><input className={inputCls} value={fields.boundarySouth} onChange={e => handleChange('boundarySouth', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="East"><input className={inputCls} value={fields.boundaryEast} onChange={e => handleChange('boundaryEast', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="West"><input className={inputCls} value={fields.boundaryWest} onChange={e => handleChange('boundaryWest', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </div>
      </Section>

      {/* ── Section 3: Locality Description ── */}
      <Section title="Locality Description" number={3} defaultOpen={false}>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Locality Type">
            <select className={selectCls} value={fields.localityType} onChange={e => handleChange('localityType', e.target.value)} disabled={isReadOnly}>
              <option>Residential</option><option>Commercial</option><option>Industrial</option><option>Mixed</option><option>Agricultural</option>
            </select>
          </Field>
          <Field label="Development Status">
            <select className={selectCls} value={fields.developmentStatus} onChange={e => handleChange('developmentStatus', e.target.value)} disabled={isReadOnly}>
              <option>Developed</option><option>Developing</option><option>Under-developed</option>
            </select>
          </Field>
          <Field label="Class of Locality">
            <select className={selectCls} value={fields.classOfLocality} onChange={e => handleChange('classOfLocality', e.target.value)} disabled={isReadOnly}>
              <option>Upper Class</option><option>Middle Class</option><option>Lower Middle Class</option><option>Lower Class</option>
            </select>
          </Field>
          <Field label="Distance from Main Road"><input className={inputCls} value={fields.distanceMainRoad} onChange={e => handleChange('distanceMainRoad', e.target.value)} disabled={isReadOnly} placeholder="e.g. 50 meters" /></Field>
          <Field label="Distance from Railway Stn / Airport"><input className={inputCls} value={fields.distanceRailway} onChange={e => handleChange('distanceRailway', e.target.value)} disabled={isReadOnly} placeholder="e.g. 5 km" /></Field>
          <Field label="Nearby Landmarks"><input className={inputCls} value={fields.nearbyLandmarks} onChange={e => handleChange('nearbyLandmarks', e.target.value)} disabled={isReadOnly} /></Field>
        </div>
        <div className="mt-4">
          <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-3">Civic Amenities</p>
          <div className="flex flex-wrap gap-3">
            {CIVIC_AMENITIES_OPTIONS.map(opt => (
              <label key={opt} className="flex items-center gap-2 text-sm text-[#495057] cursor-pointer">
                <input
                  type="checkbox"
                  checked={fields.civicAmenities?.includes(opt)}
                  onChange={e => {
                    const arr = fields.civicAmenities || [];
                    handleChange('civicAmenities', e.target.checked ? [...arr, opt] : arr.filter(a => a !== opt));
                  }}
                  disabled={isReadOnly}
                  className="rounded border-[#dee2e6] text-[#b8860b] focus:ring-[#b8860b]"
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Section 4: Building Description ── */}
      <Section title="Building Description" number={4} defaultOpen={false}>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Structure Type">
            <select className={selectCls} value={fields.structureType} onChange={e => handleChange('structureType', e.target.value)} disabled={isReadOnly}>
              <option>RCC Framed</option><option>Load Bearing</option><option>Mixed (RCC + Load Bearing)</option><option>Steel Structure</option>
            </select>
          </Field>
          <Field label="Number of Floors"><input className={inputCls} value={fields.numberOfFloors} onChange={e => handleChange('numberOfFloors', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Foundation"><input className={inputCls} value={fields.foundation} onChange={e => handleChange('foundation', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Superstructure"><input className={inputCls} value={fields.superstructure} onChange={e => handleChange('superstructure', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Roof Type"><input className={inputCls} value={fields.roofType} onChange={e => handleChange('roofType', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Flooring"><input className={inputCls} value={fields.flooringType} onChange={e => handleChange('flooringType', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Doors & Windows"><input className={inputCls} value={fields.doorsWindows} onChange={e => handleChange('doorsWindows', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Plastering"><input className={inputCls} value={fields.plastering} onChange={e => handleChange('plastering', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Sanitary"><input className={inputCls} value={fields.sanitary} onChange={e => handleChange('sanitary', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Electrification"><input className={inputCls} value={fields.electrification} onChange={e => handleChange('electrification', e.target.value)} disabled={isReadOnly} /></Field>
          <Field label="Quality of Construction">
            <select className={selectCls} value={fields.qualityOfConstruction} onChange={e => handleChange('qualityOfConstruction', e.target.value)} disabled={isReadOnly}>
              <option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option>
            </select>
          </Field>
          <Field label="Maintenance Condition">
            <select className={selectCls} value={fields.maintenanceCondition} onChange={e => handleChange('maintenanceCondition', e.target.value)} disabled={isReadOnly}>
              <option>Excellent</option><option>Good</option><option>Average</option><option>Poor</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* ── Section 5: Floor-wise Area & Section 7: Depreciation (Combined) ── */}
      <Section title="Floor-wise Area & Building Valuation" number={5}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#0a1628] text-white">
                <th className="px-3 py-2.5 text-left font-semibold text-xs">Floor</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Area (Sqft)</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Rate (₹/Sqft)</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Estimated (₹)</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs">Life (Yr)</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs">Age (Yr)</th>
                <th className="px-3 py-2.5 text-center font-semibold text-xs">Dep %</th>
                <th className="px-3 py-2.5 text-right font-semibold text-xs">Net Value (₹)</th>
                {!isReadOnly && <th className="px-3 py-2.5 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {floorValuations.map((f, idx) => (
                <tr key={f.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#f8f9fa]'}>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input className={inputCls + ' !py-1.5 text-xs'} value={f.name} onChange={e => updateFloor(f.id, 'name', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input className={inputCls + ' !py-1.5 text-xs text-right'} value={f.area} onChange={e => updateFloor(f.id, 'area', e.target.value)} disabled={isReadOnly} placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input className={inputCls + ' !py-1.5 text-xs text-right'} value={f.rate} onChange={e => updateFloor(f.id, 'rate', e.target.value)} disabled={isReadOnly} placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef] text-right text-xs font-medium text-[#0f2038]">
                    ₹{formatIndianCurrency(f.estimated)}
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input className={inputCls + ' !py-1.5 text-xs text-center'} value={f.lifeYears} onChange={e => updateFloor(f.id, 'lifeYears', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input className={inputCls + ' !py-1.5 text-xs text-center'} value={f.ageYears} onChange={e => updateFloor(f.id, 'ageYears', e.target.value)} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef] text-center text-xs font-medium text-[#b8860b]">
                    {f.depPct}%
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef] text-right text-xs font-bold text-[#0f2038]">
                    ₹{formatIndianCurrency(f.netValue)}
                  </td>
                  {!isReadOnly && (
                    <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                      <button onClick={() => removeFloor(f.id)} className="text-red-400 hover:text-red-600 text-lg" title="Remove floor">×</button>
                    </td>
                  )}
                </tr>
              ))}
              {/* Totals */}
              <tr className="bg-[#f0ead6] font-bold">
                <td className="px-3 py-2.5 text-xs">TOTAL</td>
                <td className="px-3 py-2.5 text-right text-xs">{formatIndianCurrency(totalPlinthArea)} Sqft</td>
                <td className="px-3 py-2.5" colSpan={5}></td>
                <td className="px-3 py-2.5 text-right text-xs text-[#0f2038]">₹{formatIndianCurrency(totalBuildingValue)}</td>
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

      {/* ── Section 6: Land Valuation ── */}
      <Section title="Valuation of Land" number={6} defaultOpen={false}>
        <div className="grid md:grid-cols-3 gap-4">
          <Field label={`Land Area (${fields.landAreaUnit})`}>
            <input className={inputCls} value={fields.landArea} disabled={true} />
          </Field>
          <Field label={`Rate per ${fields.landAreaUnit} (₹)`}>
            <input className={inputCls} value={fields.landRatePerUnit} onChange={e => handleChange('landRatePerUnit', e.target.value)} disabled={isReadOnly} placeholder="e.g. 3000" />
          </Field>
          <Field label="Total Land Value (₹)">
            <div className="px-3 py-2.5 rounded-lg bg-[#f0ead6] border border-[#d4c5a9] text-sm font-bold text-[#0f2038]">
              ₹ {formatIndianCurrency(landValue)}
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Section 8: Abstract of Valuation ── */}
      <Section title="Abstract of Valuation" number={7}>
        <div className="space-y-3 max-w-xl">
          {[
            { label: 'A. Value of Land', value: landValue },
            { label: 'B. Value of Building (After Depreciation)', value: totalBuildingValue },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
              <span className="text-sm text-[#495057]">{item.label}</span>
              <span className="text-sm font-semibold text-[#0f2038]">₹ {formatIndianCurrency(item.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between py-3 bg-gradient-to-r from-[#f0ead6] to-[#f8f4eb] px-4 rounded-lg border border-[#d4c5a9]">
            <span className="text-sm font-bold text-[#0f2038]">TOTAL FAIR MARKET VALUE (A + B)</span>
            <span className="text-lg font-bold text-[#b8860b]">₹ {formatIndianCurrency(totalPropertyValue)}</span>
          </div>
          <p className="text-xs text-[#6c757d] italic pl-1">{rupeesInWords(totalPropertyValue)}</p>

          <div className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
            <span className="text-sm text-[#495057]">Realizable Value (90%)</span>
            <span className="text-sm font-semibold text-green-700">₹ {formatIndianCurrency(realizableValue)}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-[#e9ecef]">
            <span className="text-sm text-[#495057]">Distress / Forced Sale Value (80%)</span>
            <span className="text-sm font-semibold text-orange-700">₹ {formatIndianCurrency(distressValue)}</span>
          </div>

          <div className="mt-3">
            <Field label="Govt. / Guideline Value (₹) — Manual">
              <input className={inputCls} value={fields.guidelineValue} onChange={e => handleChange('guidelineValue', e.target.value)} disabled={isReadOnly} placeholder="As per Govt. record (optional)" />
            </Field>
          </div>
        </div>
      </Section>

      {/* ── Section 9: Remarks ── */}
      <Section title="Demarcation, Possession & Remarks" number={8} defaultOpen={false}>
        <div className="space-y-4">
          <Field label="Demarcation" span={2}>
            <textarea className={inputCls + ' resize-none'} rows={2} value={fields.demarcation} onChange={e => handleChange('demarcation', e.target.value)} disabled={isReadOnly} placeholder="Demarcation details..." />
          </Field>
          <Field label="Possession" span={2}>
            <input className={inputCls} value={fields.possession} onChange={e => handleChange('possession', e.target.value)} disabled={isReadOnly} />
          </Field>
          <Field label="Remarks / Observations" span={2}>
            <textarea className={inputCls + ' resize-none'} rows={3} value={fields.remarks} onChange={e => handleChange('remarks', e.target.value)} disabled={isReadOnly} placeholder="Any additional observations..." />
          </Field>
        </div>
      </Section>

      {/* ── Section 10: Valuation Certificate (Auto Preview) ── */}
      <Section title="Valuation Certificate (Auto-generated)" number={9} defaultOpen={false}>
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
            <p><strong>Fair Market Value:</strong> ₹ {formatIndianCurrency(totalPropertyValue)} ({rupeesInWords(totalPropertyValue)})</p>
            <p><strong>Realizable Value:</strong> ₹ {formatIndianCurrency(realizableValue)} ({rupeesInWords(realizableValue)})</p>
            <p><strong>Distress Sale Value:</strong> ₹ {formatIndianCurrency(distressValue)} ({rupeesInWords(distressValue)})</p>
          </div>
          <div className="text-right mt-8">
            <p className="font-bold">Satyajit Mohanty</p>
            <p className="text-xs text-[#6c757d]">B.Sc.(Engg.), M.Tech (IIT Kharagpur)</p>
            <p className="text-xs text-[#6c757d]">Registered Valuer — IBBI/RV/02/2019/10594</p>
          </div>
        </div>
      </Section>

      {/* ── Section 11: Property Photographs ── */}
      <Section title="Property Photographs" number={10} defaultOpen={false}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {fields.propertyImages?.map((url: string, idx: number) => (
            <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#e9ecef] aspect-square">
              <img src={url} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
              {!isReadOnly && (
                <button
                  onClick={() => removeImage(idx)}
                  className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                >×</button>
              )}
            </div>
          ))}
        </div>
        {!isReadOnly && (
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-[#b8860b] text-[#b8860b] text-sm font-medium cursor-pointer hover:bg-[#b8860b]/5 transition-colors">
            {uploading ? 'Uploading...' : '📷 Add Property Images'}
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={uploading} />
          </label>
        )}
      </Section>

      {/* ── Action Buttons ── */}
      <div className="flex flex-wrap gap-4 pt-2">
        {!isReadOnly && (
          <>
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-[#b8860b] text-[#b8860b] font-semibold text-sm hover:bg-[#b8860b]/5 transition-all disabled:opacity-50"
            >
              {loading ? '⏳ Saving...' : '💾 Save Draft'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-sm hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {loading ? '⏳ Submitting...' : '📤 Submit to Manager'}
            </button>
          </>
        )}

        <button
          onClick={handlePreviewPDF}
          disabled={loading}
          className="px-6 py-3 rounded-xl border-2 border-gray-400 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          📄 Preview PDF
        </button>

        {status === 'MANAGER_REVIEW' && isReadOnly && (
          <>
            <button
              onClick={handleRework}
              disabled={loading}
              className="px-6 py-3 rounded-xl border-2 border-red-500 text-red-600 font-semibold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
            >
              ❌ Send for Rework
            </button>
            <button
              onClick={handleFinalize}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold text-sm hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              ✅ Finalize & Download PDF
            </button>
          </>
        )}
      </div>
    </div>
  );
}
