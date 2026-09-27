'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import {
  ActiveConfigBanner,
  FloatingNavigator,
  Section,
  Field,
  BaseDateInput,
  BasePhotoBucketModal,
  BasePhotographsSection,
  BaseMapsSection,
  BaseDocumentsSection,
  DEFAULT_PHOTO_LABEL,
  DEFAULT_DOCUMENT_LABEL,
  ReportActionBar,
  NavItem,
  inputCls,
  selectCls,
} from '../BaseBankReportComponents';
import {
  BandhanSMEReportFields,
  BandhanSMEPlotBoundary,
  BandhanSMEFloorDetail,
  BandhanSMEBuildingValuationRow,
  BandhanSMESubScheduleItem,
  BandhanSMEChecklistItem,
  BandhanSMEPhoto,
  PDFBandhanSMERenderer,
  generateBandhanSMEReport,
  generateBandhanSMEReportWithCount,
  convertAreaToSqft,
  parseSqftFromArea,
  parseAreaValueAndUnit,
  formatAreaOfLandStatement,
  formatDateDisplay,
  formatCommencementCompletion,
  getConstructionDetailsForStructure,
  parseNum,
  formatCurrencyINR,
} from '@/lib/banks/pdf-bandhan-sme-renderer';
import { BankConfig } from '@/lib/bank-fields';
import { formatReportDate } from '@/lib/pdf-bank-renderer';
import { formatIndianCurrency } from '@/lib/numberToWords';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';

export const BANDHAN_SME_CONFIG: BankConfig = {
  bankId: 'BANDHAN BANK',
  subTemplateId: 'SME',
  displayName: 'Bandhan Bank — SME',
  defaultValues: {
    purpose: 'SME / Commercial Valuation',
  },
};

const compressImageFile = (
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<{ dataUrl: string; blob: Blob }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ dataUrl, blob });
            } else {
              resolve({ dataUrl, blob: file });
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export interface BandhanSMEProps {
  projectId: string;
  projectCode?: string;
  initialFields?: any;
  initialData?: any;
  status?: string;
  userRole?: string;
  isReadOnly?: boolean;
  onResetWizard?: () => void;
  prefill?: any;
  bucketImages?: any[];
}

const NAV_SECTIONS: NavItem[] = [
  { id: 'sec-basic', title: 'I. Basic Information (Points A–M)' },
  { id: 'sec-prop-details', title: 'II. Valuation of Land (1. Details of Property)' },
  { id: 'sec-title-rent', title: 'II. Valuation of Land (2. Title, Ownership & Rent)' },
  { id: 'sec-desc-boundaries', title: 'II. Valuation of Land (3. Description & Boundaries)' },
  { id: 'sec-site-char', title: 'II. Valuation of Land (4. Site Characteristics & Location)' },
  { id: 'sec-other-issues', title: 'II. Valuation of Land (5. Other Issues & Sales Rationale)' },
  { id: 'sec-land-valuation', title: 'II. Valuation of Land (6. Valuation of Land)' },
  { id: 'sec-bldg-basic', title: 'III. Valuation of Building (1. Basic Info & Built-up Area)' },
  { id: 'sec-bldg-checklist', title: 'III. Valuation of Building (1. Occupancy & Checklist)' },
  { id: 'sec-bldg-tech', title: 'III. Valuation of Building (2. Technical Details of Building)' },
  { id: 'sec-bldg-specs', title: 'III. Valuation of Building (3. Specifications of Construction)' },
  { id: 'sec-bldg-valuation-schedules', title: 'III. Valuation of Building (4. Valuation, Sub-Schedules & 6.0 Matrix)' },
  { id: 'sec-remarks-opinion', title: 'IV. Remarks & Valuation Certificate (Opinion)' },
  { id: 'sec-declaration', title: 'V. Declaration & Credentials' },
  { id: 'sec-checklist', title: 'VI. Valuation Checklist (10 Points)' },
  { id: 'sec-documents', title: 'VII. Documents' },
  { id: 'sec-maps', title: 'VIII. Maps & Cadastral Plans' },
  { id: 'sec-photos', title: 'IX. Property Photographs' },
];

const sanitizePositiveInt = (val: string, maxLen?: number): string => {
  const digits = val.replace(/[^0-9]/g, '');
  return maxLen ? digits.slice(0, maxLen) : digits;
};

const sanitizePositiveFloat = (val: string): string => {
  let clean = val.replace(/[^0-9.]/g, '');
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  return clean;
};

const sanitizePercentage = (val: string): string => {
  const clean = sanitizePositiveFloat(val.replace(/%/g, ''));
  if (!clean) return '';
  const num = parseFloat(clean);
  if (num > 100) return '100';
  return clean;
};

const renderSelect = (
  value: string | undefined,
  options: string[],
  onChange: (v: string) => void,
  disabled?: boolean,
  defaultVal?: string
) => {
  const current = value !== undefined && value !== '' ? value : (defaultVal || options[0] || '');
  const hasCurrent = options.includes(current);
  return (
    <select
      className={selectCls}
      value={current}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    >
      {!hasCurrent && current && <option value={current}>{current}</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
};

function AreaOfLandField({
  label,
  value,
  fieldKey,
  onChange,
  isReadOnly = false,
}: {
  label: string;
  value?: string;
  fieldKey: 'areaLandDoc' | 'areaLandRor' | 'areaLandPhysical';
  onChange: (formatted: string, unit: string, numVal: string) => void;
  isReadOnly?: boolean;
}) {
  const parsed = useMemo(() => parseAreaValueAndUnit(value), [value]);
  const [unit, setUnit] = useState<string>(parsed.unit || 'ACRE_DEC');
  const [numVal, setNumVal] = useState<string>(parsed.value || '');
  const [isCustom, setIsCustom] = useState<boolean>(false);

  useEffect(() => {
    if (!isCustom && value) {
      const p = parseAreaValueAndUnit(value);
      if (p.unit) setUnit(p.unit);
      if (p.value) setNumVal(p.value);
    }
  }, [value, isCustom]);

  const handleUnitChange = (newUnit: string) => {
    setUnit(newUnit);
    if (!isCustom) {
      const res = formatAreaOfLandStatement(newUnit, numVal);
      onChange(numVal ? res.statement : '', newUnit, numVal);
    }
  };

  const handleValueChange = (newVal: string) => {
    const clean = sanitizePositiveFloat(newVal);
    setNumVal(clean);
    if (!isCustom) {
      const res = formatAreaOfLandStatement(unit, clean);
      onChange(clean ? res.statement : '', unit, clean);
    }
  };

  const currentFormatted = useMemo(() => {
    if (value && value.trim()) return value;
    if (numVal && numVal.trim()) return formatAreaOfLandStatement(unit, numVal).statement;
    return '';
  }, [value, unit, numVal]);

  return (
    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-slate-200/70">
        <label className="text-xs font-bold text-slate-800 tracking-wide">{label}</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCustom(!isCustom)}
            className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
          >
            {isCustom ? 'Use Unit Selector' : 'Edit Text'}
          </button>
        </div>
      </div>

      {!isCustom ? (
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
          <div className="sm:col-span-5">
            <span className="text-[11px] font-medium text-slate-600 block mb-1">Choose Unit:</span>
            <select
              className={selectCls}
              value={unit}
              onChange={(e) => handleUnitChange(e.target.value)}
              disabled={isReadOnly}
            >
              <option value="ACRE_DEC">Acre (Ac. ... Dec)</option>
              <option value="DECIMAL">Decimal (Dec)</option>
              <option value="SQFT">Sq.Ft (Sft)</option>
              <option value="SQYD">Sq.Yards (Sq.Yds)</option>
              <option value="SQMT">Sq.Meters (Sq.Mtr)</option>
              <option value="GUNTHA">Guntha</option>
            </select>
          </div>

          <div className="sm:col-span-7">
            <span className="text-[11px] font-medium text-slate-600 block mb-1">
              {unit === 'ACRE_DEC'
                ? 'Area in Acre (e.g. 0.069)'
                : unit === 'DECIMAL'
                ? 'Area in Decimal (e.g. 6.9)'
                : unit === 'SQFT'
                ? 'Area in Sq.Ft (e.g. 3006)'
                : unit === 'SQYD'
                ? 'Area in Sq.Yards (e.g. 334)'
                : unit === 'SQMT'
                ? 'Area in Sq.Meters (e.g. 279.27)'
                : 'Area in Guntha (e.g. 2.76)'}
            </span>
            <input
              type="text"
              className={inputCls}
              value={numVal}
              onChange={(e) => handleValueChange(e.target.value)}
              disabled={isReadOnly}
              placeholder={unit === 'ACRE_DEC' ? '0.069' : ''}
            />
          </div>

          {currentFormatted ? (
            <div className="sm:col-span-12 flex items-center gap-2 bg-indigo-50/80 border border-indigo-200/80 px-3 py-1.5 rounded-lg text-xs">
              <span className="font-semibold text-indigo-900 shrink-0">Report:</span>
              <span className="font-bold text-indigo-950 font-mono tracking-tight">{currentFormatted}</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-1">
          <span className="text-[11px] font-medium text-slate-600 block">Direct Custom Text:</span>
          <input
            type="text"
            className={inputCls}
            value={value || ''}
            onChange={(e) => onChange(e.target.value, unit, numVal)}
            disabled={isReadOnly}
            placeholder="Total Area: Ac.0.069 Dec i.e. 3006.00 Sft"
          />
        </div>
      )}
    </div>
  );
}

export default function BandhanSME({
  projectId,
  projectCode,
  initialFields,
  initialData,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  onResetWizard,
  prefill,
  bucketImages = [],
}: BandhanSMEProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');

  // Default Ref No
  const defaultRefNo = useMemo(() => {
    const id = projectCode || projectId || '';
    return id ? (id.toLowerCase().startsWith('bandhan/') ? id : `Bandhan/${id}`) : '';
  }, [projectCode, projectId]);

  // ── Find First Field Engineer Visit Date (Earliest Visit Date) ──
  const firstFieldAgentVisit = useMemo(() => {
    if (bucketImages && bucketImages.length > 0) {
      const validImages = [...bucketImages]
        .filter(img => img.createdAt)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (validImages.length > 0) {
        return {
          dateStr: formatReportDate(validImages[0].createdAt),
          rawDate: validImages[0].createdAt,
          agentName: validImages[0].employee?.name || prefill?.firstFieldAgentName || '',
          agentId: validImages[0].employee?.employeeId || '',
        };
      }
    }
    const fallbackDate = prefill?.fieldVisitDate || prefill?.inspectionDate;
    if (fallbackDate) {
      return {
        dateStr: formatReportDate(fallbackDate),
        rawDate: fallbackDate,
        agentName: prefill?.firstFieldAgentName || prefill?.fieldEmployees?.[0]?.name || '',
        agentId: prefill?.fieldEmployees?.[0]?.employeeId || '',
      };
    }
    return null;
  }, [bucketImages, prefill]);

  // State initialization with clean defaults and project prefill
  const [fields, setFields] = useState<BandhanSMEReportFields>(() => {
    const raw = typeof initialFields === 'object' && initialFields !== null ? initialFields : (initialData?.reportFields || initialData || {});

    const defaultPlots: BandhanSMEPlotBoundary[] = Array.isArray(raw.documentPlotBoundaries) && raw.documentPlotBoundaries.length > 0
      ? raw.documentPlotBoundaries
      : [
          { plotNo: raw.plotNo ? `Plot No: ${raw.plotNo}` : '', east: '', west: '', north: '', south: '' },
        ];

    const defaultBldgRows: BandhanSMEBuildingValuationRow[] = Array.isArray(raw.buildingValuationRows) && raw.buildingValuationRows.length > 0
      ? raw.buildingValuationRows
      : [
          {
            description: 'RESIDENTIAL & COMMERCIAL BUILDING',
            plinthArea: '',
            height: "10'-6\"",
            age: '',
            replacementRate: '',
            replacementCost: '',
            depreciation: '',
            valueAfterDepreciation: '',
          },
        ];

    const defaultChecklist: BandhanSMEChecklistItem[] = Array.isArray(raw.checklist) && raw.checklist.length > 0
      ? raw.checklist
      : [
          { pointNo: 1, question: 'Full names of all property owners are mentioned. Address of the property is mentioned and is same as latest title deed', answer: 'Yes' },
          { pointNo: 2, question: 'Boundaries of the property are mentioned as per both, title deed and actual observations', answer: 'Yes' },
          { pointNo: 3, question: 'Clearly mentioned that property has been identified by the valuer on his own based on the address', answer: 'Yes' },
          { pointNo: 4, question: 'Type of property is clearly mentioned (amongst agricultural, residential, commercial, industrial etc.)', answer: 'Yes' },
          { pointNo: 5, question: 'If land, clearly mentioned whether the land is land locked plot or independent land', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
          { pointNo: 6, question: 'If vacant land, clearly mentioned that proper demarcation and fencing has been done', answer: 'Yes' },
          { pointNo: 7, question: 'If building, clearly mentioned that construction has been done according to the building plan approval', subText: '(If not, deviation should be clearly specified)', answer: 'No' },
          { pointNo: 8, question: 'If building, clearly mentioned that building use / completion certificate has been obtained from competent authority', answer: 'No' },
          { pointNo: 9, question: 'Clearly mentioned whether access to the property is available', subText: '(Only "Yes" or "No" should be mentioned. "Not applicable" should not be mentioned here)', answer: 'Yes' },
          { pointNo: 10, question: 'Basis for arriving at government value has been mentioned and necessary documents have been enclosed', answer: 'Yes' },
        ];

    // Parse branch details from raw data if branchDetails not explicitly stored
    let branchDetails = raw.branchDetails || '';
    let branchName = raw.branchName || '';
    if (!branchDetails && branchName) {
      branchDetails = branchName.replace(/^The\s+Bandhan\s+Bank,?\s*|^Bandhan\s+Bank,?\s*/i, '').trim();
    }
    if (!branchName) {
      branchName = branchDetails ? `Bandhan Bank, ${branchDetails}` : 'Bandhan Bank';
    }

    // Parse letter no and date from raw data if not explicitly set
    let bankLetterNo = raw.bankLetterNo || '';
    let bankLetterDate = raw.bankLetterDate ? formatReportDate(raw.bankLetterDate) : '';
    let letterNoAndDate = raw.letterNoAndDate || '';
    if (!bankLetterNo && !bankLetterDate && letterNoAndDate) {
      const dtMatch = letterNoAndDate.match(/^(.*?)(?:\s*(?:Dt\.?|Date:?|\/|,|-)\s*)(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}-\d{2}-\d{2})$/i);
      if (dtMatch) {
        bankLetterNo = dtMatch[1].trim();
        bankLetterDate = formatReportDate(dtMatch[2].trim());
      } else {
        bankLetterNo = letterNoAndDate;
      }
    }
    if (!letterNoAndDate) {
      letterNoAndDate = [bankLetterNo, bankLetterDate ? `Dt. ${bankLetterDate}` : ''].filter(Boolean).join(' ');
    }

    const landAreaUnit = raw.landAreaUnit || 'ACRE_DEC';
    const landAreaValue = (() => {
      if (raw.landAreaValue !== undefined && raw.landAreaValue !== '') return raw.landAreaValue;
      const rawSrc = raw.extentOfSite || raw.areaLandDoc || raw.landAreaTotal || '';
      if (!rawSrc) return '';
      const s = String(rawSrc).trim();
      const acMatch = s.match(/AC\.(\d+(?:\.\d+)?)/i);
      if (acMatch && acMatch[1]) return acMatch[1];
      const parenMatch = s.match(/\((\d+(?:\.\d+)?)\s*(?:Decs|Sq\.Yds|Sq\.Mtr|Guntha|Acre|Decimal)/i);
      if (parenMatch && parenMatch[1]) return parenMatch[1];
      const sqftMatch = s.match(/^([\d,]+(?:\.\d+)?)\s*sqft/i);
      if (sqftMatch && sqftMatch[1]) return sqftMatch[1].replace(/,/g, '');
      if (/^\d+(?:\.\d+)?$/.test(s)) return s;
      return '';
    })();

    return {
      ...raw,
      clientType: raw.clientType || 'organisation',
      institutionCategory: raw.institutionCategory || 'Bank & FIS',
      organisationTemplate: raw.organisationTemplate || 'BANDHAN BANK',
      organisationSubTemplate: raw.organisationSubTemplate || 'SME',
      bankName: raw.bankName || 'BANDHAN BANK',
      serviceType: raw.serviceType || prefill?.purpose || undefined,
      subjectType: raw.subjectType || prefill?.propertyType || undefined,
      reworkNotes: raw.reworkNotes || '',

      // Header
      refNo: raw.refNo !== undefined ? raw.refNo : defaultRefNo,
      reportDate: formatReportDate(raw.reportDate || new Date()),

      // Section I: Basic Information (A - M)
      branchDetails,
      branchName,
      bankLetterNo,
      bankLetterDate,
      letterNoAndDate,
      valuationMadeAtBorrowerRequest: raw.valuationMadeAtBorrowerRequest || 'No',
      managerAccompanied: raw.managerAccompanied !== undefined ? raw.managerAccompanied : '',
      valuationType: raw.valuationType || 'Fresh Valuation',
      dateOfEarlierValuation: raw.dateOfEarlierValuation !== undefined ? raw.dateOfEarlierValuation : '',
      previousValuerName: raw.previousValuerName !== undefined ? raw.previousValuerName : '',
      dateOfVisit: raw.dateOfVisit
        ? formatReportDate(raw.dateOfVisit)
        : (firstFieldAgentVisit?.dateStr || (prefill?.fieldVisitDate ? formatReportDate(prefill.fieldVisitDate) : (prefill?.inspectionDate ? formatReportDate(prefill.inspectionDate) : formatReportDate(new Date())))),
      dateOfValuation: raw.dateOfValuation ? formatReportDate(raw.dateOfValuation) : (raw.reportDate ? formatReportDate(raw.reportDate) : formatReportDate(new Date())),
      personsPresent: raw.personsPresent !== undefined ? raw.personsPresent : (prefill?.contactName ? `${prefill.contactName}, Mob-${prefill?.serviceRequest?.guestPhone || ''}` : ''),
      documentsProduced: raw.documentsProduced !== undefined ? raw.documentsProduced : 'Xerox copy of Sale Deed, Patta, Sketch Map, Assessment of Holding',

      // Borrower Details (L)
      borrowerName: raw.borrowerName !== undefined ? raw.borrowerName : (prefill?.serviceRequest?.guestName || prefill?.contactName || ''),
      borrowerAt: raw.borrowerAt !== undefined ? raw.borrowerAt : (prefill?.propertyAddress || ''),
      borrowerPo: raw.borrowerPo !== undefined ? raw.borrowerPo : '',
      borrowerPs: raw.borrowerPs !== undefined ? raw.borrowerPs : '',
      borrowerDist: raw.borrowerDist !== undefined ? raw.borrowerDist : (prefill?.serviceRequest?.city || ''),
      borrowerPhone: raw.borrowerPhone !== undefined ? raw.borrowerPhone : (prefill?.serviceRequest?.guestPhone || ''),
      borrowerNatureOfBusiness: raw.borrowerNatureOfBusiness !== undefined ? raw.borrowerNatureOfBusiness : '',

      // Owner Details (M)
      ownerName: raw.ownerName !== undefined ? raw.ownerName : (prefill?.contactName || ''),
      ownerAt: raw.ownerAt !== undefined ? raw.ownerAt : (prefill?.propertyAddress || ''),
      ownerPo: raw.ownerPo !== undefined ? raw.ownerPo : '',
      ownerPs: raw.ownerPs !== undefined ? raw.ownerPs : '',
      ownerPin: raw.ownerPin !== undefined ? raw.ownerPin : (prefill?.serviceRequest?.pincode || ''),
      ownerDist: raw.ownerDist !== undefined ? raw.ownerDist : (prefill?.serviceRequest?.city || ''),
      ownerPhone: raw.ownerPhone !== undefined ? raw.ownerPhone : (prefill?.serviceRequest?.guestPhone || ''),
      ownerFatherName: raw.ownerFatherName !== undefined ? raw.ownerFatherName : '',

      // Section II: Valuation of Land
      // 1. Details of Property (A - L, I)
      detailsPropertyOffered: raw.detailsPropertyOffered !== undefined ? raw.detailsPropertyOffered : 'Land & Building',
      dateAcquisitionLand: raw.dateAcquisitionLand ? formatReportDate(raw.dateAcquisitionLand) : '',
      valueAsPerSaleDeed: raw.valueAsPerSaleDeed !== undefined ? raw.valueAsPerSaleDeed : '',
      saleDeedDocNo: raw.saleDeedDocNo !== undefined ? raw.saleDeedDocNo : '',
      landAreaUnit,
      landAreaValue,
      landAreaSqft: raw.landAreaSqft !== undefined ? raw.landAreaSqft : '',
      areaLandDoc: raw.areaLandDoc !== undefined ? raw.areaLandDoc : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),
      areaLandRor: raw.areaLandRor !== undefined ? raw.areaLandRor : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),
      areaLandPhysical: raw.areaLandPhysical !== undefined ? raw.areaLandPhysical : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),

      // Location of Property & Postal Address (H)
      plotNo: raw.plotNo !== undefined ? raw.plotNo : '',
      khataNo: raw.khataNo !== undefined ? raw.khataNo : '',
      propAt: raw.propAt !== undefined ? raw.propAt : (prefill?.propertyAddress || ''),
      propPo: raw.propPo !== undefined ? raw.propPo : '',
      propPs: raw.propPs !== undefined ? raw.propPs : '',
      propPin: raw.propPin !== undefined ? raw.propPin : (prefill?.serviceRequest?.pincode || ''),
      propDist: raw.propDist !== undefined ? raw.propDist : (prefill?.serviceRequest?.city || ''),

      urbanSemiUrbanRural: raw.urbanSemiUrbanRural !== undefined ? raw.urbanSemiUrbanRural : 'Urban Area',
      situatedAreaType: raw.situatedAreaType !== undefined ? raw.situatedAreaType : 'Residential cum Commercial Area',
      classificationOfLocality: raw.classificationOfLocality !== undefined ? raw.classificationOfLocality : 'Middle Class',
      typeOfProperty: raw.typeOfProperty !== undefined ? raw.typeOfProperty : 'Land & building',
      isAgricultural: raw.isAgricultural !== undefined ? raw.isAgricultural : 'No',
      agriculturalConversionContemplated: raw.agriculturalConversionContemplated !== undefined ? raw.agriculturalConversionContemplated : 'Not Applicable',
      isIndustrial: raw.isIndustrial !== undefined ? raw.isIndustrial : 'No',
      industrialActivitySuited: raw.industrialActivitySuited !== undefined ? raw.industrialActivitySuited : 'Not Applicable',
      isResidential: raw.isResidential !== undefined ? raw.isResidential : 'Yes',
      isCommercial: raw.isCommercial !== undefined ? raw.isCommercial : 'Yes',
      isInstitutional: raw.isInstitutional !== undefined ? raw.isInstitutional : 'No',
      isOthersSpecify: raw.isOthersSpecify !== undefined ? raw.isOthersSpecify : 'No',

      // 2.1 Title of Property Freehold / Leasehold
      titleFreeholdLeasehold: raw.titleFreeholdLeasehold !== undefined ? raw.titleFreeholdLeasehold : 'It is a free hold land',
      ownershipOfProperty: raw.ownershipOfProperty !== undefined ? raw.ownershipOfProperty : 'Single Ownership',
      jointOwnershipShare: raw.jointOwnershipShare !== undefined ? raw.jointOwnershipShare : 'Not Applicable',
      taxesPaidUpTo: raw.taxesPaidUpTo !== undefined ? raw.taxesPaidUpTo : 'We have not verified any recent rent receipt',
      landRevenue: raw.landRevenue !== undefined ? raw.landRevenue : 'We have not verified any recent rent receipt',
      landBuildingMunicipalTaxes: raw.landBuildingMunicipalTaxes !== undefined ? raw.landBuildingMunicipalTaxes : 'We have not verified any recent rent receipt',
      wealthTaxAssessedPaid: raw.wealthTaxAssessedPaid !== undefined ? raw.wealthTaxAssessedPaid : 'Not Applicable',

      // 2.2 If Leasehold
      isLeaseholdApplicable: raw.isLeaseholdApplicable !== undefined ? raw.isLeaseholdApplicable : 'No',
      lessorName: raw.lessorName !== undefined ? raw.lessorName : 'Not Applicable',
      lesseeName: raw.lesseeName !== undefined ? raw.lesseeName : 'Not Applicable',
      natureOfLease: raw.natureOfLease !== undefined ? raw.natureOfLease : 'Not Applicable',
      dateCommencementLease: raw.dateCommencementLease !== undefined ? raw.dateCommencementLease : 'Not Applicable',
      periodOfLease: raw.periodOfLease !== undefined ? raw.periodOfLease : 'Not Applicable',
      termsOfRenewal: raw.termsOfRenewal !== undefined ? raw.termsOfRenewal : 'Not Applicable',
      leasePremiumRentPerAnnum: raw.leasePremiumRentPerAnnum !== undefined ? raw.leasePremiumRentPerAnnum : 'Not Applicable',
      unexpiredPeriodOfLease: raw.unexpiredPeriodOfLease !== undefined ? raw.unexpiredPeriodOfLease : 'Not Applicable',
      initialPremium: raw.initialPremium !== undefined ? raw.initialPremium : 'Not Applicable',
      groundRentPerAnnum: raw.groundRentPerAnnum !== undefined ? raw.groundRentPerAnnum : 'Not Applicable',
      unearnedIncreasePayable: raw.unearnedIncreasePayable !== undefined ? raw.unearnedIncreasePayable : 'Not Applicable',
      leasePermitsMortgage: raw.leasePermitsMortgage !== undefined ? raw.leasePermitsMortgage : 'Not Applicable',

      // 2. Rent Details
      rentOccupationStatus: raw.rentOccupationStatus !== undefined ? raw.rentOccupationStatus : 'The Plot is occupied by Owner',
      tenantNames: raw.tenantNames !== undefined ? raw.tenantNames : 'Not Applicable',
      tenantPortionOccupied: raw.tenantPortionOccupied !== undefined ? raw.tenantPortionOccupied : 'Not Applicable',
      monthlyAnnualRentPaid: raw.monthlyAnnualRentPaid !== undefined ? raw.monthlyAnnualRentPaid : 'Not Applicable',
      grossRentReceived: raw.grossRentReceived !== undefined ? raw.grossRentReceived : 'Not Applicable',

      // 3. Brief Description of Property
      detailedAddressWithPin: raw.detailedAddressWithPin !== undefined ? raw.detailedAddressWithPin : (prefill?.propertyAddress || ''),
      municipalityWardNo: raw.municipalityWardNo !== undefined ? raw.municipalityWardNo : '',
      streetNo: raw.streetNo !== undefined ? raw.streetNo : '',
      surveyPlotNo: raw.surveyPlotNo !== undefined ? raw.surveyPlotNo : (raw.plotNo || ''),
      briefKhataNo: raw.briefKhataNo !== undefined ? raw.briefKhataNo : (raw.khataNo || ''),
      mouza: raw.mouza !== undefined ? raw.mouza : '',
      thanaNo: raw.thanaNo !== undefined ? raw.thanaNo : '',
      tehasilNo: raw.tehasilNo !== undefined ? raw.tehasilNo : '',
      tehasil: raw.tehasil !== undefined ? raw.tehasil : '',
      sro: raw.sro !== undefined ? raw.sro : '',
      policeStation: raw.policeStation !== undefined ? raw.policeStation : '',
      villageTownCity: raw.villageTownCity !== undefined ? raw.villageTownCity : 'City',
      district: raw.district !== undefined ? raw.district : (prefill?.serviceRequest?.city || ''),
      state: raw.state !== undefined ? raw.state : 'Odisha',

      dimensionDocEastWest: raw.dimensionDocEastWest !== undefined ? raw.dimensionDocEastWest : 'As per Sketch Map',
      dimensionDocNorthSouth: raw.dimensionDocNorthSouth !== undefined ? raw.dimensionDocNorthSouth : 'As per Sketch Map',
      dimensionMeasEastWest: raw.dimensionMeasEastWest !== undefined ? raw.dimensionMeasEastWest : 'As per Sketch Map',
      dimensionMeasNorthSouth: raw.dimensionMeasNorthSouth !== undefined ? raw.dimensionMeasNorthSouth : 'As per Sketch Map',
      extentOfSite: raw.extentOfSite !== undefined ? raw.extentOfSite : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),
      extentConsideredValuation: raw.extentConsideredValuation !== undefined ? raw.extentConsideredValuation : (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : ''),

      documentPlotBoundaries: defaultPlots,
      verifiedBoundaryEast: raw.verifiedBoundaryEast !== undefined ? raw.verifiedBoundaryEast : '',
      verifiedBoundaryWest: raw.verifiedBoundaryWest !== undefined ? raw.verifiedBoundaryWest : '',
      verifiedBoundaryNorth: raw.verifiedBoundaryNorth !== undefined ? raw.verifiedBoundaryNorth : '',
      verifiedBoundarySouth: raw.verifiedBoundarySouth !== undefined ? raw.verifiedBoundarySouth : '',
      sketchEnclosed: raw.sketchEnclosed !== undefined ? raw.sketchEnclosed : 'Yes, Enclosed',

      // 4. Characteristics of the Site
      levelOfLand: raw.levelOfLand !== undefined ? raw.levelOfLand : 'Leveled and Plain',
      useToWhichCanBePut: raw.useToWhichCanBePut !== undefined ? raw.useToWhichCanBePut : 'Residential cum Commercial Purpose',
      easementAgreements: raw.easementAgreements !== undefined ? raw.easementAgreements : 'No such agreement verified',
      restrictiveCovenant: raw.restrictiveCovenant !== undefined ? raw.restrictiveCovenant : 'No',
      approvalLetterNoDateDevelopment: raw.approvalLetterNoDateDevelopment !== undefined ? raw.approvalLetterNoDateDevelopment : 'Not Applicable',
      buildingUseCertificateObtained: raw.buildingUseCertificateObtained !== undefined ? raw.buildingUseCertificateObtained : 'Not Applicable',
      townPlanningSchemeInclusion: raw.townPlanningSchemeInclusion !== undefined ? raw.townPlanningSchemeInclusion : '',
      cornerOrIntermittentPlot: raw.cornerOrIntermittentPlot !== undefined ? raw.cornerOrIntermittentPlot : 'Intermittent Plot',
      isLandLocked: raw.isLandLocked !== undefined ? raw.isLandLocked : 'No',
      freeAccessAndProximity: raw.freeAccessAndProximity !== undefined ? raw.freeAccessAndProximity : 'Yes (15 ft wide CC Road) / Bike, Car, Bus',
      roadFacilities: raw.roadFacilities !== undefined ? raw.roadFacilities : 'Yes, Available at site',
      roadKindAndWidth: raw.roadKindAndWidth !== undefined ? raw.roadKindAndWidth : '15 ft wide BT Road',
      distMunicipalOffice: raw.distMunicipalOffice !== undefined ? raw.distMunicipalOffice : '',
      distMunicipalLimits: raw.distMunicipalLimits !== undefined ? raw.distMunicipalLimits : '',
      waterPotentialities: raw.waterPotentialities !== undefined ? raw.waterPotentialities : 'Good',
      possibilityFlooding: raw.possibilityFlooding !== undefined ? raw.possibilityFlooding : 'No',
      undergroundSewerageAvailable: raw.undergroundSewerageAvailable !== undefined ? raw.undergroundSewerageAvailable : 'No',
      drainageSystemsAvailable: raw.drainageSystemsAvailable !== undefined ? raw.drainageSystemsAvailable : 'Surface Drainage',
      powerSupplyAvailable: raw.powerSupplyAvailable !== undefined ? raw.powerSupplyAvailable : 'Yes',
      surroundingDevelopment: raw.surroundingDevelopment !== undefined ? raw.surroundingDevelopment : 'Residential Buildings',

      proximitySchool: raw.proximitySchool !== undefined ? raw.proximitySchool : '',
      proximityCollege: raw.proximityCollege !== undefined ? raw.proximityCollege : '',
      proximityHospital: raw.proximityHospital !== undefined ? raw.proximityHospital : '',
      proximityMarket: raw.proximityMarket !== undefined ? raw.proximityMarket : '',
      proximityBusStand: raw.proximityBusStand !== undefined ? raw.proximityBusStand : '',
      proximityRailwayStation: raw.proximityRailwayStation !== undefined ? raw.proximityRailwayStation : '',
      proximityOtherPlace: raw.proximityOtherPlace !== undefined ? raw.proximityOtherPlace : '',
      latitudeLongitude: raw.latitudeLongitude !== undefined ? raw.latitudeLongitude : '',
      latitude: raw.latitude !== undefined
        ? raw.latitude
        : (prefill?.serviceRequest?.latitude || (raw.latitudeLongitude ? (raw.latitudeLongitude.match(/([\d.]+)\s*°?\s*N?/i)?.[1] || '') : '')),
      longitude: raw.longitude !== undefined
        ? raw.longitude
        : (prefill?.serviceRequest?.longitude || (raw.latitudeLongitude ? (raw.latitudeLongitude.match(/([\d.]+)\s*°?\s*E?/i)?.[1] || '') : '')),
      locationAdvantages: raw.locationAdvantages !== undefined ? raw.locationAdvantages : '',
      locationDisadvantages: raw.locationDisadvantages !== undefined ? raw.locationDisadvantages : 'Nothing Observed',

      // 5. Other Issues / Points
      landAcquisitionNotification: raw.landAcquisitionNotification !== undefined ? raw.landAcquisitionNotification : 'No such documents verified',
      developmentContributionDemanded: raw.developmentContributionDemanded !== undefined ? raw.developmentContributionDemanded : 'No such documents verified',
      landCeilingEnactments: raw.landCeilingEnactments !== undefined ? raw.landCeilingEnactments : 'No such documents verified',
      salesInstancesInLocality: raw.salesInstancesInLocality !== undefined ? raw.salesInstancesInLocality : 'Transactions of the property are not available in the locality',
      salesBasisArrivingLandRate: raw.salesBasisArrivingLandRate !== undefined ? raw.salesBasisArrivingLandRate : 'The present market rate of land confirmed through local enquiry and property dealers and found to be acceptable.',
      adoptedLandRateRationale: raw.adoptedLandRateRationale !== undefined ? raw.adoptedLandRateRationale : '',

      // 6. Valuation of Land
      previousValuationDetails: raw.previousValuationDetails !== undefined ? raw.previousValuationDetails : 'Not Available / Not Applicable',
      presentValuationApproachDetails: raw.presentValuationApproachDetails !== undefined ? raw.presentValuationApproachDetails : 'Land & Building method of valuation has been adopted',
      landAreaTotal: raw.landAreaTotal !== undefined ? raw.landAreaTotal : (raw.areaLandDoc || (landAreaValue ? formatAreaOfLandStatement(landAreaUnit, landAreaValue).statement : '')),
      landGovtBenchmarkPerAcre: raw.landGovtBenchmarkPerAcre !== undefined ? raw.landGovtBenchmarkPerAcre : '',
      landGovtBenchmarkRate: raw.landGovtBenchmarkRate !== undefined ? raw.landGovtBenchmarkRate : '',
      landGovtValueTotal: raw.landGovtValueTotal !== undefined ? raw.landGovtValueTotal : '',
      landMarketRate: raw.landMarketRate !== undefined ? raw.landMarketRate : '',
      landMarketValueTotal: raw.landMarketValueTotal !== undefined ? raw.landMarketValueTotal : '',
      landDistressValue: raw.landDistressValue !== undefined ? raw.landDistressValue : '',
      landRealisableValue: raw.landRealisableValue !== undefined ? raw.landRealisableValue : '',
      distressSalePct: raw.distressSalePct !== undefined ? String(raw.distressSalePct) : '85',
      realisableValuePct: raw.realisableValuePct !== undefined ? String(raw.realisableValuePct) : '95',

      // Valuation of Building
      // 1. Basic Info
      buildingType: raw.buildingType !== undefined ? raw.buildingType : 'Residential Cum Commercial',
      yearCommencementCompletion: raw.yearCommencementCompletion !== undefined ? raw.yearCommencementCompletion : '',
      typeOfConstruction: raw.typeOfConstruction !== undefined ? raw.typeOfConstruction : 'RCC Frames',
      estimatedFutureLife: raw.estimatedFutureLife !== undefined ? raw.estimatedFutureLife : '60 Yrs',
      farFsiPermissibleUtilized: raw.farFsiPermissibleUtilized !== undefined ? raw.farFsiPermissibleUtilized : 'FAR: 3.46',
      buildingApprovalAuthorityDetails: raw.buildingApprovalAuthorityDetails !== undefined ? raw.buildingApprovalAuthorityDetails : '',
      constructionAsPerPlanDeviations: raw.constructionAsPerPlanDeviations !== undefined ? raw.constructionAsPerPlanDeviations : 'Yes',

      builtUpAreaAssessmentHolding: raw.builtUpAreaAssessmentHolding !== undefined ? raw.builtUpAreaAssessmentHolding : '',
      builtUpAreaAsPerActual: raw.builtUpAreaAsPerActual !== undefined ? raw.builtUpAreaAsPerActual : '',
      carpetAreaTotal: raw.carpetAreaTotal !== undefined ? raw.carpetAreaTotal : '',
      saleableAreaTotal: raw.saleableAreaTotal !== undefined ? raw.saleableAreaTotal : '',

      buildingOwnerOccupiedTenanted: raw.buildingOwnerOccupiedTenanted !== undefined ? raw.buildingOwnerOccupiedTenanted : 'Owner Occupied',
      ownerOccupiedPortion: raw.ownerOccupiedPortion !== undefined ? raw.ownerOccupiedPortion : 'Not Applicable',
      isUnderRentControlAct: raw.isUnderRentControlAct !== undefined ? raw.isUnderRentControlAct : 'No',
      buildingTenantNames: raw.buildingTenantNames !== undefined ? raw.buildingTenantNames : 'Not Applicable',
      buildingTenantPortions: raw.buildingTenantPortions !== undefined ? raw.buildingTenantPortions : 'Not Applicable',
      buildingMonthlyRent: raw.buildingMonthlyRent !== undefined ? raw.buildingMonthlyRent : 'Not Applicable',
      buildingGrossRent: raw.buildingGrossRent !== undefined ? raw.buildingGrossRent : 'Not Applicable',
      occupantsRelatedToOwner: raw.occupantsRelatedToOwner !== undefined ? raw.occupantsRelatedToOwner : 'Not Applicable',
      fixturesAmountRecovered: raw.fixturesAmountRecovered !== undefined ? raw.fixturesAmountRecovered : 'Borne by Owner',
      waterElectricityChargesBorneBy: raw.waterElectricityChargesBorneBy !== undefined ? raw.waterElectricityChargesBorneBy : 'Borne by Owner',
      isRentDisputePendingCourt: raw.isRentDisputePendingCourt !== undefined ? raw.isRentDisputePendingCourt : 'No',
      hasStandardRentFixed: raw.hasStandardRentFixed !== undefined ? raw.hasStandardRentFixed : 'Not Applicable',
      tenantBearMaintenance: raw.tenantBearMaintenance !== undefined ? raw.tenantBearMaintenance : 'Not Applicable',
      liftMaintenanceBorneBy: raw.liftMaintenanceBorneBy !== undefined ? raw.liftMaintenanceBorneBy : 'Not Applicable',
      pumpMaintenanceBorneBy: raw.pumpMaintenanceBorneBy !== undefined ? raw.pumpMaintenanceBorneBy : 'Borne by Owner',
      commonElectricityBorneBy: raw.commonElectricityBorneBy !== undefined ? raw.commonElectricityBorneBy : 'Borne by Owner',
      propertyTaxAmountBorneBy: raw.propertyTaxAmountBorneBy !== undefined ? raw.propertyTaxAmountBorneBy : 'No such document is verified',
      isBuildingInsuredDetails: raw.isBuildingInsuredDetails !== undefined ? raw.isBuildingInsuredDetails : 'No such document is verified',
      statutoryDuesPaid: raw.statutoryDuesPaid !== undefined ? raw.statutoryDuesPaid : 'No such document is verified',
      buildingFreeAccess: raw.buildingFreeAccess !== undefined ? raw.buildingFreeAccess : 'Yes',

      // 2. Technical Details
      numberOfFloorsAndHeight: raw.numberOfFloorsAndHeight !== undefined ? raw.numberOfFloorsAndHeight : "G+3 Storied Building & Height: 10'-6\"",
      floorDetails: (raw.floorDetails && raw.floorDetails.length > 0) ? raw.floorDetails : [
        { floorName: 'Ground Floor', height: raw.floorHeightGF || "10'-6\"", plinthArea: raw.plinthAreaGF || '', doorsWindows: raw.doorsWindowsGF || 'Iron Shutter', flooring: raw.flooringGF || 'VT Flooring', wallFinishing: raw.wallFinishingGF || 'Cement Plastering, Putty, Painting' },
        { floorName: 'First Floor', height: raw.floorHeightFF || 'Do', plinthArea: raw.plinthAreaFF || '', doorsWindows: raw.doorsWindowsFF || 'Sal wood choukath with non sal wood shutter', flooring: raw.flooringFF || 'Do', wallFinishing: raw.wallFinishingFF || 'Do' },
        { floorName: 'Second Floor', height: raw.floorHeightSF || 'Do', plinthArea: raw.plinthAreaSF || '', doorsWindows: raw.doorsWindowsSF || 'Do', flooring: raw.flooringSF || 'Do', wallFinishing: raw.wallFinishingSF || 'Do' },
        { floorName: 'Third Floor', height: raw.floorHeightTF || 'Do', plinthArea: raw.plinthAreaTF || '', doorsWindows: raw.doorsWindowsTF || 'Do', flooring: raw.flooringTF || 'Do', wallFinishing: raw.wallFinishingTF || 'Do' },
      ],
      floorHeightGF: raw.floorHeightGF !== undefined ? raw.floorHeightGF : "10'-6\"",
      floorHeightFF: raw.floorHeightFF !== undefined ? raw.floorHeightFF : 'Do',
      floorHeightSF: raw.floorHeightSF !== undefined ? raw.floorHeightSF : 'Do',
      floorHeightTF: raw.floorHeightTF !== undefined ? raw.floorHeightTF : 'Do',
      plinthAreaGF: raw.plinthAreaGF !== undefined ? raw.plinthAreaGF : '',
      plinthAreaFF: raw.plinthAreaFF !== undefined ? raw.plinthAreaFF : '',
      plinthAreaSF: raw.plinthAreaSF !== undefined ? raw.plinthAreaSF : '',
      plinthAreaTF: raw.plinthAreaTF !== undefined ? raw.plinthAreaTF : '',
      buildingConditionExterior: raw.buildingConditionExterior !== undefined ? raw.buildingConditionExterior : 'Good',
      buildingConditionInterior: raw.buildingConditionInterior !== undefined ? raw.buildingConditionInterior : 'Good',
      foundationType: raw.foundationType !== undefined ? raw.foundationType : 'Column Foundation',
      doorsWindowsGF: raw.doorsWindowsGF !== undefined ? raw.doorsWindowsGF : 'Iron Shutter',
      doorsWindowsFF: raw.doorsWindowsFF !== undefined ? raw.doorsWindowsFF : 'Sal wood choukath with non sal wood shutter',
      doorsWindowsSF: raw.doorsWindowsSF !== undefined ? raw.doorsWindowsSF : 'Do',
      doorsWindowsTF: raw.doorsWindowsTF !== undefined ? raw.doorsWindowsTF : 'Do',
      flooringGF: raw.flooringGF !== undefined ? raw.flooringGF : 'VT Flooring',
      flooringFF: raw.flooringFF !== undefined ? raw.flooringFF : 'Do',
      flooringSF: raw.flooringSF !== undefined ? raw.flooringSF : 'Do',
      flooringTF: raw.flooringTF !== undefined ? raw.flooringTF : 'Do',
      wallFinishingGF: raw.wallFinishingGF !== undefined ? raw.wallFinishingGF : 'Cement Plastering, Putty, Painting',
      wallFinishingFF: raw.wallFinishingFF !== undefined ? raw.wallFinishingFF : 'Do',
      wallFinishingSF: raw.wallFinishingSF !== undefined ? raw.wallFinishingSF : 'Do',
      wallFinishingTF: raw.wallFinishingTF !== undefined ? raw.wallFinishingTF : 'Do',

      // 3. Construction Specifications
      specFoundation: raw.specFoundation !== undefined ? raw.specFoundation : 'Column Foundation',
      specBasement: raw.specBasement !== undefined ? raw.specBasement : 'No',
      specSuperstructure: raw.specSuperstructure !== undefined ? raw.specSuperstructure : 'Brick Masonry Super Structure',
      specJoineryDoorsWindows: raw.specJoineryDoorsWindows !== undefined ? raw.specJoineryDoorsWindows : 'Sal wood choukath with non sal wood shutter',
      specRccWorks: raw.specRccWorks !== undefined ? raw.specRccWorks : 'Lintel, Chajja, Beam',
      specPlastering: raw.specPlastering !== undefined ? raw.specPlastering : 'Cement Plastering',
      specFlooringSkirting: raw.specFlooringSkirting !== undefined ? raw.specFlooringSkirting : 'VT Flooring',
      specSpecialFinishing: raw.specSpecialFinishing !== undefined ? raw.specSpecialFinishing : 'Yes',
      specRoofing: raw.specRoofing !== undefined ? raw.specRoofing : 'RCC Roof',
      specDrainage: raw.specDrainage !== undefined ? raw.specDrainage : 'Surface Drainage',
      specDecorativeFeatures: raw.specDecorativeFeatures !== undefined ? raw.specDecorativeFeatures : 'Interior work is done on Second & Third Floor',
      specInternalWiring: raw.specInternalWiring !== undefined ? raw.specInternalWiring : 'Concealed',
      specWiringFittingsClass: raw.specWiringFittingsClass !== undefined ? raw.specWiringFittingsClass : 'Superior',
      specSanitaryInstallation: raw.specSanitaryInstallation !== undefined ? raw.specSanitaryInstallation : 'Yes',
      specNoOfGeysers: raw.specNoOfGeysers !== undefined ? raw.specNoOfGeysers : 'Not Verified',
      specSanitaryFittingsClass: raw.specSanitaryFittingsClass !== undefined ? raw.specSanitaryFittingsClass : 'Superior',
      specCompoundWall: raw.specCompoundWall !== undefined ? raw.specCompoundWall : 'Yes',
      specCompoundWallHeightLength: raw.specCompoundWallHeightLength !== undefined ? raw.specCompoundWallHeightLength : "Height: 5'-0\", Length: 150'-0\"",
      specCompoundWallType: raw.specCompoundWallType !== undefined ? raw.specCompoundWallType : 'Brick Masonry Wall with Iron Gate',
      specLiftsCapacity: raw.specLiftsCapacity !== undefined ? raw.specLiftsCapacity : 'No',
      specUndergroundSump: raw.specUndergroundSump !== undefined ? raw.specUndergroundSump : 'Not Available',
      specOverheadTank: raw.specOverheadTank !== undefined ? raw.specOverheadTank : 'Yes',
      specOverheadTankLocation: raw.specOverheadTankLocation !== undefined ? raw.specOverheadTankLocation : 'On the top of the roof',
      specOverheadTankCapacity: raw.specOverheadTankCapacity !== undefined ? raw.specOverheadTankCapacity : '2000 Liters',
      specPumpsHp: raw.specPumpsHp !== undefined ? raw.specPumpsHp : '1 Nos & 1 HP Pump',
      specRoadsPavingCompound: raw.specRoadsPavingCompound !== undefined ? raw.specRoadsPavingCompound : 'No',
      specSewageDisposal: raw.specSewageDisposal !== undefined ? raw.specSewageDisposal : 'Connected to Public Sewers',
      specQualityClassConstruction: raw.specQualityClassConstruction !== undefined ? raw.specQualityClassConstruction : 'Good',

      // 4. Details of Building Valuation Table
      buildingValuationRows: defaultBldgRows,

      // 5. Sub-Schedules
      isExtraItemsNA: raw.isExtraItemsNA !== undefined ? raw.isExtraItemsNA : true,
      extraItems: Array.isArray(raw.extraItems) ? raw.extraItems : [
        { name: 'Portico', cost: '' },
        { name: 'Ornamental Front Door', cost: '' },
        { name: 'Sit Out / Verandah with Steel Grills', cost: '' },
        { name: 'Overhead Water Tank', cost: '' },
        { name: 'Extra Steel / Collapsible Gates', cost: '' },
      ],
      extraItemsTotal: raw.extraItemsTotal !== undefined ? raw.extraItemsTotal : 'Rs. 0.00',

      isAmenitiesNA: raw.isAmenitiesNA !== undefined ? raw.isAmenitiesNA : true,
      amenities: Array.isArray(raw.amenities) ? raw.amenities : [
        { name: 'Wardrobes', cost: '' },
        { name: 'Glazed Tiles', cost: '' },
        { name: 'Extra Sinks and Bath Tub', cost: '' },
        { name: 'Marble / Ceramic Tiles Flooring', cost: '' },
        { name: 'Interior Decorations', cost: '' },
        { name: 'Architectural Elevation Works', cost: '' },
        { name: 'Paneling Works', cost: '' },
        { name: 'Aluminium Works', cost: '' },
        { name: 'Aluminium Hand Rails', cost: '' },
        { name: 'False Ceiling', cost: '' },
      ],
      amenitiesTotal: raw.amenitiesTotal !== undefined ? raw.amenitiesTotal : 'Rs. 0.00',

      isMiscNA: raw.isMiscNA !== undefined ? raw.isMiscNA : true,
      miscItems: Array.isArray(raw.miscItems) ? raw.miscItems : [
        { name: 'Separate Toilet Room', cost: '' },
        { name: 'Separate Lumber Room', cost: '' },
        { name: 'Separate Water Tank / Sump', cost: '' },
        { name: 'Trees, Gardening', cost: '' },
      ],
      miscItemsTotal: raw.miscItemsTotal !== undefined ? raw.miscItemsTotal : 'Rs. 0.00',

      isServicesNA: raw.isServicesNA !== undefined ? raw.isServicesNA : true,
      servicesItems: Array.isArray(raw.servicesItems) ? raw.servicesItems : [
        { name: 'Water Supply Arrangement', cost: '' },
        { name: 'Drainage Arrangement', cost: '' },
        { name: 'Compound Wall', cost: '' },
        { name: 'C.B Deposit, Fitting etc.', cost: '' },
        { name: 'Pavement', cost: '' },
      ],
      servicesItemsTotal: raw.servicesItemsTotal !== undefined ? raw.servicesItemsTotal : 'Rs. 0.00',

      // 6.0 Total Abstract of Entire Property
      abstractGovtLand: raw.abstractGovtLand !== undefined ? raw.abstractGovtLand : '',
      abstractMarketLand: raw.abstractMarketLand !== undefined ? raw.abstractMarketLand : '',
      abstractRealLand: raw.abstractRealLand !== undefined ? raw.abstractRealLand : '',
      abstractDistressLand: raw.abstractDistressLand !== undefined ? raw.abstractDistressLand : '',

      abstractGovtBuilding: raw.abstractGovtBuilding !== undefined ? raw.abstractGovtBuilding : 'Rs. 0.00',
      abstractMarketBuilding: raw.abstractMarketBuilding !== undefined ? raw.abstractMarketBuilding : '',
      abstractRealBuilding: raw.abstractRealBuilding !== undefined ? raw.abstractRealBuilding : '',
      abstractDistressBuilding: raw.abstractDistressBuilding !== undefined ? raw.abstractDistressBuilding : '',

      abstractGovtExtra: raw.abstractGovtExtra !== undefined ? raw.abstractGovtExtra : 'Rs. 0.00',
      abstractMarketExtra: raw.abstractMarketExtra !== undefined ? raw.abstractMarketExtra : 'Rs. 0.00',
      abstractRealExtra: raw.abstractRealExtra !== undefined ? raw.abstractRealExtra : 'Rs. 0.00',
      abstractDistressExtra: raw.abstractDistressExtra !== undefined ? raw.abstractDistressExtra : 'Rs. 0.00',

      abstractGovtAmenities: raw.abstractGovtAmenities !== undefined ? raw.abstractGovtAmenities : 'Rs. 0.00',
      abstractMarketAmenities: raw.abstractMarketAmenities !== undefined ? raw.abstractMarketAmenities : 'Rs. 0.00',
      abstractRealAmenities: raw.abstractRealAmenities !== undefined ? raw.abstractRealAmenities : 'Rs. 0.00',
      abstractDistressAmenities: raw.abstractDistressAmenities !== undefined ? raw.abstractDistressAmenities : 'Rs. 0.00',

      abstractGovtMisc: raw.abstractGovtMisc !== undefined ? raw.abstractGovtMisc : 'Rs. 0.00',
      abstractMarketMisc: raw.abstractMarketMisc !== undefined ? raw.abstractMarketMisc : 'Rs. 0.00',
      abstractRealMisc: raw.abstractRealMisc !== undefined ? raw.abstractRealMisc : 'Rs. 0.00',
      abstractDistressMisc: raw.abstractDistressMisc !== undefined ? raw.abstractDistressMisc : 'Rs. 0.00',

      abstractGovtServices: raw.abstractGovtServices !== undefined ? raw.abstractGovtServices : 'Rs. 0.00',
      abstractMarketServices: raw.abstractMarketServices !== undefined ? raw.abstractMarketServices : 'Rs. 0.00',
      abstractRealServices: raw.abstractRealServices !== undefined ? raw.abstractRealServices : 'Rs. 0.00',
      abstractDistressServices: raw.abstractDistressServices !== undefined ? raw.abstractDistressServices : 'Rs. 0.00',

      abstractGovtTotal: raw.abstractGovtTotal !== undefined ? raw.abstractGovtTotal : '',
      abstractMarketTotal: raw.abstractMarketTotal !== undefined ? raw.abstractMarketTotal : '',
      abstractRealTotal: raw.abstractRealTotal !== undefined ? raw.abstractRealTotal : '',
      abstractDistressTotal: raw.abstractDistressTotal !== undefined ? raw.abstractDistressTotal : '',

      abstractGovtSay: raw.abstractGovtSay !== undefined ? raw.abstractGovtSay : '',
      abstractMarketSay: raw.abstractMarketSay !== undefined ? raw.abstractMarketSay : '',
      abstractRealSay: raw.abstractRealSay !== undefined ? raw.abstractRealSay : '',
      abstractDistressSay: raw.abstractDistressSay !== undefined ? raw.abstractDistressSay : '',

      // Remarks, Basis & Valuation Opinion
      valuationRemarksBox: raw.valuationRemarksBox !== undefined ? raw.valuationRemarksBox : '',
      basisOfValuationStatement: raw.basisOfValuationStatement !== undefined ? raw.basisOfValuationStatement : '(LAND & BUILDING METHOD OF VALUATION HAS BEEN ADOPTED FOR FINDING THE FAIR MARKET VALUE OF THE PROPERTY)',
      fairMarketValue: raw.fairMarketValue !== undefined ? raw.fairMarketValue : '',
      fairMarketValueWords: raw.fairMarketValueWords !== undefined ? raw.fairMarketValueWords : '',
      realisableValue: raw.realisableValue !== undefined ? raw.realisableValue : '',
      realisableValueWords: raw.realisableValueWords !== undefined ? raw.realisableValueWords : '',
      bookValueOfLand: raw.bookValueOfLand !== undefined ? raw.bookValueOfLand : '',
      bookValueOfLandWords: raw.bookValueOfLandWords !== undefined ? raw.bookValueOfLandWords : '',
      distressValue: raw.distressValue !== undefined ? raw.distressValue : '',
      distressValueWords: raw.distressValueWords !== undefined ? raw.distressValueWords : '',
      insurableValueOfProperty: raw.insurableValueOfProperty !== undefined ? raw.insurableValueOfProperty : '',
      insurableValueOfPropertyWords: raw.insurableValueOfPropertyWords !== undefined ? raw.insurableValueOfPropertyWords : '',

      // Declaration & Sign-off
      declarationItems: raw.declarationItems || [],
      reportPagesCount: raw.reportPagesCountLocked ? (raw.reportPagesCount || '') : '',
      reportPagesCountLocked: Boolean(raw.reportPagesCountLocked),
      siteEngineerName: raw.siteEngineerName !== undefined ? raw.siteEngineerName : 'MR. SIBA BEHERA',
      empanelledValuerName: raw.empanelledValuerName !== undefined ? raw.empanelledValuerName : 'Er. Satyajit Mohanty, (S MOHANTY ASSOCIATES)',
      valuerQualifications: (!raw.valuerQualifications || raw.valuerQualifications === 'B.Tech (Civil), M.Val (RE)' || raw.valuerQualifications.includes('B.Tech (Civil)'))
        ? 'B.E. (Civil), M.Tech (Civil), M.Sc. (Real Estate Valuation), MBA (Finance), MBA (HR)'
        : raw.valuerQualifications,
      valuerIovRegNo: raw.valuerIovRegNo !== undefined ? raw.valuerIovRegNo : 'No. F-26377',
      valuerWealthTaxRegNo: raw.valuerWealthTaxRegNo !== undefined ? raw.valuerWealthTaxRegNo : 'Regd. No.-107/2016-17, Cat -I',
      declarationDate: raw.declarationDate || formatReportDate(new Date()),

      // Checklist
      checklist: defaultChecklist,

      // Enclosures
      rorImageUrl: raw.rorImageUrl || '',
      locationMapImageUrl: raw.locationMapImageUrl || '',
      bhuNakshaImageUrl: raw.bhuNakshaImageUrl || '',
      guidelineValueImageUrl: raw.guidelineValueImageUrl || '',
      propertyPhotos: Array.isArray(raw.propertyPhotos) ? raw.propertyPhotos : [],
    };
  });

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [previewedPageCount, setPreviewedPageCount] = useState<number | null>(null);
  const isInitialMount = useRef(true);
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);

  // Auto-Save Draft Effect
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
          console.error('Autosave error:', res.error);
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (e) {
        console.error('Autosave network error:', e);
        setAutoSaveStatus('error');
      }
    }, 800);

    return () => {
      if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReadOnly) return;
      try {
        navigator.sendBeacon('/api/save-draft', JSON.stringify({ projectId, fields }));
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  // Field change handler
  const handleChange = useCallback((field: keyof BandhanSMEReportFields, value: any) => {
    setFields((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'reportDate') {
        if (!prev.dateOfValuation || prev.dateOfValuation === prev.reportDate) {
          next.dateOfValuation = value;
        }
        if (!prev.declarationDate || prev.declarationDate === prev.reportDate) {
          next.declarationDate = value;
        }
      }
      return next;
    });
  }, []);

  const handleAreaFieldChange = useCallback(
    (fieldKey: 'areaLandDoc' | 'areaLandRor' | 'areaLandPhysical', formatted: string, unit: string, numVal: string) => {
      const sqft = convertAreaToSqft(unit, numVal).sqft;
      setFields((prev) => {
        const next = {
          ...prev,
          [fieldKey]: formatted,
          landAreaUnit: unit,
          landAreaValue: numVal || prev.landAreaValue,
        };
        if (fieldKey === 'areaLandDoc' || !prev.extentOfSite) {
          next.extentOfSite = formatted;
          next.extentConsideredValuation = formatted;
          next.landAreaTotal = formatted;
          if (sqft > 0) {
            next.landAreaSqft = `${sqft} Sft`;
          }
        }
        return next;
      });
    },
    []
  );

  // Multi-Plot Boundary Handlers
  const handleAddPlotBoundary = () => {
    const nextPlotNo = `Plot No: Schedule ${fields.documentPlotBoundaries?.length ? fields.documentPlotBoundaries.length + 1 : 1}`;
    setFields((prev) => ({
      ...prev,
      documentPlotBoundaries: [
        ...(prev.documentPlotBoundaries || []),
        { plotNo: nextPlotNo, east: '', west: '', north: '', south: '' },
      ],
    }));
  };

  const handleRemovePlotBoundary = (index: number) => {
    setFields((prev) => ({
      ...prev,
      documentPlotBoundaries: prev.documentPlotBoundaries?.filter((_, i) => i !== index),
    }));
  };

  const handlePlotBoundaryChange = (index: number, key: keyof BandhanSMEPlotBoundary, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.documentPlotBoundaries || [])];
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, documentPlotBoundaries: updated };
    });
  };

  // Floor Details Handlers (Points A, B, E, F, G)
  const handleAddFloorDetail = () => {
    setFields((prev) => {
      const current = prev.floorDetails || [];
      const newFloorIdx = current.length + 1;
      const defaultName = newFloorIdx === 1 ? 'Ground Floor' : newFloorIdx === 2 ? 'First Floor' : newFloorIdx === 3 ? 'Second Floor' : newFloorIdx === 4 ? 'Third Floor' : `${newFloorIdx}th Floor`;
      const lastFloor = current[current.length - 1];
      const newFloor: BandhanSMEFloorDetail = {
        floorName: defaultName,
        height: lastFloor?.height || 'Do',
        plinthArea: '',
        doorsWindows: lastFloor?.doorsWindows || 'Do',
        flooring: lastFloor?.flooring || 'Do',
        wallFinishing: lastFloor?.wallFinishing || 'Do',
      };
      return {
        ...prev,
        floorDetails: [...current, newFloor],
      };
    });
  };

  const handleRemoveFloorDetail = (index: number) => {
    setFields((prev) => {
      const current = prev.floorDetails || [];
      if (current.length <= 1) return prev;
      return {
        ...prev,
        floorDetails: current.filter((_, idx) => idx !== index),
      };
    });
  };

  const handleFloorDetailChange = (index: number, key: keyof BandhanSMEFloorDetail, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.floorDetails || [])];
      if (!updated[index]) return prev;
      updated[index] = { ...updated[index], [key]: val };
      return { ...prev, floorDetails: updated };
    });
  };

  // Building Valuation Table Handlers
  const handleAddBuildingRow = () => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: [
        ...(prev.buildingValuationRows || []),
        {
          description: '',
          plinthArea: '',
          height: "10'-6\"",
          age: '',
          replacementRate: '',
          replacementCost: '',
          depreciation: '',
          valueAfterDepreciation: '',
        },
      ],
    }));
  };

  const handleRemoveBuildingRow = (index: number) => {
    setFields((prev) => ({
      ...prev,
      buildingValuationRows: prev.buildingValuationRows?.filter((_, i) => i !== index),
    }));
  };

  const handleBuildingRowChange = (index: number, key: keyof BandhanSMEBuildingValuationRow, val: string) => {
    setFields((prev) => {
      const updated = [...(prev.buildingValuationRows || [])];
      const row = { ...updated[index] };

      if (key === 'plinthArea' || key === 'replacementRate' || key === 'depreciation' || key === 'replacementCost' || key === 'valueAfterDepreciation') {
        row[key] = sanitizePositiveFloat(val);
      } else if (key === 'age') {
        row[key] = sanitizePositiveInt(val, 3);
      } else {
        row[key] = val;
      }

      // Auto calculate replacement cost & net value if plinth and rate exist
      const p = parseNum(key === 'plinthArea' ? val : row.plinthArea);
      const r = parseNum(key === 'replacementRate' ? val : row.replacementRate);
      let cost = parseNum(key === 'replacementCost' ? val : row.replacementCost);

      if (p > 0 && r > 0) {
        cost = Math.round((p * r + Number.EPSILON) * 100) / 100;
        row.replacementCost = `Rs. ${formatCurrencyINR(cost)}`;
      } else if (key === 'plinthArea' || key === 'replacementRate') {
        if (!p || !r) {
          row.replacementCost = '';
          cost = 0;
        }
      }

      const dep = parseNum(key === 'depreciation' ? val : row.depreciation);
      if (cost > 0) {
        const net = Math.max(0, Math.round((cost - dep + Number.EPSILON) * 100) / 100);
        row.valueAfterDepreciation = `Rs. ${formatCurrencyINR(net)}`;
      } else if (key === 'depreciation' || key === 'plinthArea' || key === 'replacementRate') {
        row.valueAfterDepreciation = '';
      }

      updated[index] = row;
      return { ...prev, buildingValuationRows: updated };
    });
  };

  // Checklist handler
  const handleChecklistChange = (index: number, answer: 'Yes' | 'No' | 'NA') => {
    setFields((prev) => {
      const updated = [...(prev.checklist || [])];
      updated[index] = { ...updated[index], answer };
      return { ...prev, checklist: updated };
    });
  };

  // Sub-Schedule items handler
  const handleSubScheduleChange = (
    scheduleKey: 'extraItems' | 'amenities' | 'miscItems' | 'servicesItems',
    index: number,
    costVal: string
  ) => {
    const cleanCost = sanitizePositiveFloat(costVal);
    setFields((prev) => {
      const updated = [...(prev[scheduleKey] || [])];
      updated[index] = { ...updated[index], cost: cleanCost };
      return { ...prev, [scheduleKey]: updated };
    });
  };

  // Photos state derivation
  const propertyImages: string[] = useMemo(() => {
    if (Array.isArray(fields.propertyPhotos) && fields.propertyPhotos.length > 0) {
      return fields.propertyPhotos.map((p: any) => (typeof p === 'string' ? p : p.url)).filter(Boolean);
    }
    if (Array.isArray(fields.propertyImages) && fields.propertyImages.length > 0) {
      return fields.propertyImages;
    }
    return [];
  }, [fields.propertyPhotos, fields.propertyImages]);

  const propertyImageNames: string[] = useMemo(() => {
    if (Array.isArray(fields.propertyImageNames) && fields.propertyImageNames.length > 0) {
      return fields.propertyImageNames;
    }
    if (Array.isArray(fields.propertyPhotos) && fields.propertyPhotos.length > 0) {
      return fields.propertyPhotos.map((p: any) => (typeof p === 'string' ? '' : (p.caption ?? '')));
    }
    return [];
  }, [fields.propertyImageNames, fields.propertyPhotos]);

  // Dynamic Total Pages Calculation (accounting for 2 maps per page & 2 photos per page)
  const dynamicTotalPages = useMemo(() => {
    const basePages = 8;
    const photoCount = propertyImages.length;
    const photoPages = photoCount > 0 ? Math.ceil(photoCount / 2) : 0;
    const rorCount = (fields.mouzaMapImages && fields.mouzaMapImages.length > 0) ? fields.mouzaMapImages.length : (fields.rorImageUrl ? 1 : 0);
    const locCount = (fields.locationMapImages && fields.locationMapImages.length > 0) ? fields.locationMapImages.length : (fields.locationMapImageUrl ? 1 : 0);
    const bhuCount = (fields.cadastralMapImages && fields.cadastralMapImages.length > 0) ? fields.cadastralMapImages.length : ((fields.bhuNakshaImages && fields.bhuNakshaImages.length > 0) ? fields.bhuNakshaImages.length : (fields.bhuNakshaImageUrl ? 1 : 0));
    const guideCount = (fields.sketchMapImages && fields.sketchMapImages.length > 0) ? fields.sketchMapImages.length : ((fields.guidelineRateImages && fields.guidelineRateImages.length > 0) ? fields.guidelineRateImages.length : (fields.guidelineValueImageUrl ? 1 : 0));
    const bdaCount = fields.bdaMapImages?.length || 0;
    const totalMaps = rorCount + locCount + bhuCount + guideCount + bdaCount;
    const mapPages = totalMaps > 0 ? Math.ceil(totalMaps / 2) : 0;

    return String(basePages + photoPages + mapPages);
  }, [
    propertyImages.length,
    fields.mouzaMapImages,
    fields.rorImageUrl,
    fields.locationMapImages,
    fields.locationMapImageUrl,
    fields.cadastralMapImages,
    fields.bhuNakshaImages,
    fields.bhuNakshaImageUrl,
    fields.sketchMapImages,
    fields.guidelineRateImages,
    fields.guidelineValueImageUrl,
    fields.bdaMapImages,
  ]);

  // Measure exact PDF page count in the background
  useEffect(() => {
    let cancelled = false;
    const calculateExactPages = async () => {
      try {
        const renderer = new PDFBandhanSMERenderer();
        const { pageCount } = await renderer.generateBandhanSMEReportWithCount(fields);
        if (!cancelled && pageCount > 0) {
          setPreviewedPageCount(pageCount);
        }
      } catch {
        // graceful fallback to dynamicTotalPages
      }
    };
    const timer = setTimeout(calculateExactPages, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    fields.propertyImages,
    fields.propertyPhotos,
    fields.mouzaMapImages,
    fields.rorImageUrl,
    fields.locationMapImages,
    fields.locationMapImageUrl,
    fields.cadastralMapImages,
    fields.bhuNakshaImages,
    fields.bhuNakshaImageUrl,
    fields.sketchMapImages,
    fields.guidelineRateImages,
    fields.guidelineValueImageUrl,
    fields.bdaMapImages,
    fields.buildingValuationRows,
    fields.propAt,
    fields.detailedAddressWithPin,
  ]);

  // Live Auto Calculation Engine (Valuation, Land, Building, Sub-schedules & Abstract)
  useEffect(() => {
    // 1. Land Calculations
    const pArea = parseSqftFromArea(fields.landAreaTotal || fields.extentOfSite || fields.areaLandDoc, fields.landAreaUnit, fields.landAreaValue);
    const lMktRate = parseNum(fields.landMarketRate);
    const lGovtRate = parseNum(fields.landGovtBenchmarkRate);
    const lGovtAcre = parseNum(fields.landGovtBenchmarkPerAcre);

    const effectiveGovtSftRate = lGovtRate > 0 ? lGovtRate : (lGovtAcre > 0 ? Math.round(lGovtAcre / 43560) : 0);
    const effectiveGovtAcreRate = lGovtAcre > 0 ? lGovtAcre : (lGovtRate > 0 ? Math.round(lGovtRate * 43560) : 0);

    const landMarketVal = (pArea > 0 && lMktRate > 0) ? Math.round(pArea * lMktRate) : 0;
    const landGovtVal = (pArea > 0 && effectiveGovtSftRate > 0) ? Math.round(pArea * effectiveGovtSftRate) : 0;
    const distPct = (fields.distressSalePct !== undefined && fields.distressSalePct !== '') ? parseNum(fields.distressSalePct) : 85;
    const realPct = (fields.realisableValuePct !== undefined && fields.realisableValuePct !== '') ? parseNum(fields.realisableValuePct) : 95;
    const landDistVal = Math.round(landMarketVal * (distPct / 100));
    const landRealVal = Math.round(landMarketVal * (realPct / 100));

    // 2. Building Calculations
    let bldgNetVal = 0;
    (fields.buildingValuationRows || []).forEach((br) => {
      const v = parseNum(br.valueAfterDepreciation || br.replacementCost);
      bldgNetVal += v;
    });
    const bldgDistVal = Math.round(bldgNetVal * (distPct / 100));
    const bldgRealVal = Math.round(bldgNetVal * (realPct / 100));

    // 3. Sub-schedules summation
    const sumSched = (items?: BandhanSMESubScheduleItem[], isNA?: boolean) => {
      if (isNA || !items) return 0;
      return items.reduce((acc, it) => acc + parseNum(it.cost), 0);
    };

    const extraVal = sumSched(fields.extraItems, fields.isExtraItemsNA);
    const amenitiesVal = sumSched(fields.amenities, fields.isAmenitiesNA);
    const miscVal = sumSched(fields.miscItems, fields.isMiscNA);
    const servicesVal = sumSched(fields.servicesItems, fields.isServicesNA);

    // 4. Total Abstract Matrix
    const totalGovt = landGovtVal;
    const totalMarket = landMarketVal + bldgNetVal + extraVal + amenitiesVal + miscVal + servicesVal;
    const totalReal = Math.round(totalMarket * (realPct / 100));
    const totalDist = Math.round(totalMarket * (distPct / 100));

    const roundSay = (n: number) => Math.round(n / 1000) * 1000;

    setFields((prev) => {
      let changed = false;
      const next = { ...prev };

      // Sync Land Valuation Totals
      const landMktStr = landMarketVal > 0
        ? `Total Market Value of Land: ${pArea.toFixed(2)} Sft X Rs.${formatCurrencyINR(lMktRate)}/- Per Sft = Rs.${formatCurrencyINR(landMarketVal)}/-`
        : '';
      const landGovtStr = (landGovtVal > 0 && effectiveGovtSftRate > 0)
        ? `Govt. Benchmark Value: Rs.${formatCurrencyINR(effectiveGovtAcreRate)} /- Per Acre i.e. Rs.${formatCurrencyINR(effectiveGovtSftRate)}/- Per Sft\nGuideline Value of Land= ${pArea.toFixed(2)} Sft X Rs.${formatCurrencyINR(effectiveGovtSftRate)}/- Per Sft = Rs.${formatCurrencyINR(landGovtVal)}/-`
        : '';
      const landDistStr = landDistVal > 0 ? `Rs.${formatCurrencyINR(landDistVal)}/-` : '';
      const landRealStr = landRealVal > 0 ? `Rs.${formatCurrencyINR(landRealVal)}/-` : '';

      if (landMarketVal > 0) {
        if (prev.landMarketValueTotal !== landMktStr) {
          next.landMarketValueTotal = landMktStr;
          changed = true;
        }
        if (prev.landDistressValue !== landDistStr) {
          next.landDistressValue = landDistStr;
          changed = true;
        }
        if (prev.landRealisableValue !== landRealStr) {
          next.landRealisableValue = landRealStr;
          changed = true;
        }
      }
      if (landGovtVal > 0 && prev.landGovtValueTotal !== landGovtStr) {
        next.landGovtValueTotal = landGovtStr;
        changed = true;
      }

      // Sync Abstract Matrix
      if (landMarketVal > 0) {
        const agl = `Rs. ${formatCurrencyINR(landGovtVal)}`;
        const aml = `Rs. ${formatCurrencyINR(landMarketVal)}`;
        const arl = `Rs. ${formatCurrencyINR(landRealVal)}`;
        const adl = `Rs. ${formatCurrencyINR(landDistVal)}`;
        if (prev.abstractGovtLand !== agl || prev.abstractMarketLand !== aml) {
          next.abstractGovtLand = agl;
          next.abstractMarketLand = aml;
          next.abstractRealLand = arl;
          next.abstractDistressLand = adl;
          changed = true;
        }
      }
      if (bldgNetVal > 0) {
        const amb = `Rs. ${formatCurrencyINR(bldgNetVal)}`;
        const arb = `Rs. ${formatCurrencyINR(bldgRealVal)}`;
        const adb = `Rs. ${formatCurrencyINR(bldgDistVal)}`;
        if (prev.abstractMarketBuilding !== amb) {
          next.abstractMarketBuilding = amb;
          next.abstractRealBuilding = arb;
          next.abstractDistressBuilding = adb;
          changed = true;
        }
      }

      // Sub-schedules totals sync
      const exTotStr = extraVal > 0 ? `Rs. ${formatCurrencyINR(extraVal)}` : 'Rs. 0.00';
      const amTotStr = amenitiesVal > 0 ? `Rs. ${formatCurrencyINR(amenitiesVal)}` : 'Rs. 0.00';
      const miTotStr = miscVal > 0 ? `Rs. ${formatCurrencyINR(miscVal)}` : 'Rs. 0.00';
      const seTotStr = servicesVal > 0 ? `Rs. ${formatCurrencyINR(servicesVal)}` : 'Rs. 0.00';

      if (prev.extraItemsTotal !== exTotStr) { next.extraItemsTotal = exTotStr; changed = true; }
      if (prev.amenitiesTotal !== amTotStr) { next.amenitiesTotal = amTotStr; changed = true; }
      if (prev.miscItemsTotal !== miTotStr) { next.miscItemsTotal = miTotStr; changed = true; }
      if (prev.servicesItemsTotal !== seTotStr) { next.servicesItemsTotal = seTotStr; changed = true; }

      if (totalMarket > 0) {
        const agt = `Rs. ${formatCurrencyINR(totalGovt)}`;
        const amt = `Rs. ${formatCurrencyINR(totalMarket)}`;
        const art = `Rs. ${formatCurrencyINR(totalReal)}`;
        const adt = `Rs. ${formatCurrencyINR(totalDist)}`;

        const ags = `Rs. ${formatCurrencyINR(roundSay(totalGovt))}`;
        const ams = `Rs. ${formatCurrencyINR(roundSay(totalMarket))}`;
        const ars = `Rs. ${formatCurrencyINR(roundSay(totalReal))}`;
        const ads = `Rs. ${formatCurrencyINR(roundSay(totalDist))}`;

        const fmv = `Rs.${formatCurrencyINR(roundSay(totalMarket))}/-`;
        const fmw = formatIndianCurrency(roundSay(totalMarket));
        const rv = `Rs.${formatCurrencyINR(roundSay(totalReal))}/-`;
        const rvw = formatIndianCurrency(roundSay(totalReal));
        const bvl = `Rs.${formatCurrencyINR(roundSay(landGovtVal))}/-`;
        const bvw = formatIndianCurrency(roundSay(landGovtVal));
        const dv = `Rs.${formatCurrencyINR(roundSay(totalDist))}/-`;
        const dvw = formatIndianCurrency(roundSay(totalDist));
        const ipv = `Rs.${formatCurrencyINR(bldgDistVal)}/-`;
        const ipvw = formatIndianCurrency(bldgDistVal);

        if (prev.abstractMarketSay !== ams || prev.fairMarketValue !== fmv) {
          next.abstractGovtTotal = agt;
          next.abstractMarketTotal = amt;
          next.abstractRealTotal = art;
          next.abstractDistressTotal = adt;

          next.abstractGovtSay = ags;
          next.abstractMarketSay = ams;
          next.abstractRealSay = ars;
          next.abstractDistressSay = ads;

          next.fairMarketValue = fmv;
          next.fairMarketValueWords = fmw;
          next.realisableValue = rv;
          next.realisableValueWords = rvw;
          next.bookValueOfLand = bvl;
          next.bookValueOfLandWords = bvw;
          next.distressValue = dv;
          next.distressValueWords = dvw;
          next.insurableValueOfProperty = ipv;
          next.insurableValueOfPropertyWords = ipvw;
          changed = true;
        }
      }

      if (!prev.reportPagesCountLocked && prev.reportPagesCount !== dynamicTotalPages) {
        next.reportPagesCount = dynamicTotalPages;
        changed = true;
      }

      return changed ? next : prev;
    });
  }, [
    fields.landAreaUnit,
    fields.landAreaValue,
    fields.landAreaTotal,
    fields.extentOfSite,
    fields.areaLandDoc,
    fields.landMarketRate,
    fields.landGovtBenchmarkRate,
    fields.landGovtBenchmarkPerAcre,
    fields.distressSalePct,
    fields.realisableValuePct,
    fields.buildingValuationRows,
    fields.isExtraItemsNA,
    fields.extraItems,
    fields.isAmenitiesNA,
    fields.amenities,
    fields.isMiscNA,
    fields.miscItems,
    fields.isServicesNA,
    fields.servicesItems,
    dynamicTotalPages,
  ]);

  // Save Draft
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
      setMessage({ text: 'Failed to save draft: ' + e.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Preview PDF
  const handlePreviewPDF = async () => {
    try {
      const { pdfBytes, pageCount } = await generateBandhanSMEReportWithCount(fields);
      setPreviewedPageCount(pageCount);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e: any) {
      alert('Failed to generate PDF preview: ' + e.message);
    }
  };

  // Download PDF
  const handleDownloadPDF = async () => {
    try {
      const { pdfBytes } = await generateBandhanSMEReportWithCount(fields);
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Bandhan_Bank_SME_${projectCode || projectId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch (e: any) {
      alert('Failed to download PDF: ' + e.message);
    }
  };

  // Submit Report
  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for review?')) return;
    setSubmitting(true);
    try {
      await saveReportDraft(projectId, fields);
      await submitReportForVerification(projectId);
      alert('Report submitted successfully!');
      router.refresh();
    } catch (e: any) {
      alert('Failed to submit report: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Multiple Photo Upload
  const handleUploadMultiplePhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const newPhotos: BandhanSMEPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const caption = '';
        const { dataUrl, blob } = await compressImageFile(file, 1280, 1280, 0.8);
        let uploadedUrl = dataUrl;
        try {
          const ext = 'jpg';
          const fileName = `${projectId}-photo-${Date.now()}-${i}.${ext}`;
          const filePath = `temp-photos/${projectId}/${fileName}`;
          const { error: uploadErr } = await supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Supabase storage upload fallback to compressed base64:', storageErr);
        }

        newPhotos.push({ url: uploadedUrl, caption });
      }

      setFields((prev) => ({
        ...prev,
        propertyPhotos: [...(prev.propertyPhotos || []), ...newPhotos],
      }));
    } catch (err: any) {
      console.error('Photo upload error:', err);
      alert(`Photo upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      e.target.value = '';
    }
  };

  const handlePhotoRemove = (idx: number) => {
    const updatedPhotos = (fields.propertyPhotos || []).filter((_, i) => i !== idx);
    setFields((prev) => ({
      ...prev,
      propertyPhotos: updatedPhotos,
      propertyImages: Array.isArray(prev.propertyImages) ? prev.propertyImages.filter((_: any, i: number) => i !== idx) : undefined,
      propertyImageNames: Array.isArray(prev.propertyImageNames) ? prev.propertyImageNames.filter((_: any, i: number) => i !== idx) : undefined,
    }));
  };

  const handlePhotoRename = (idx: number, name: string) => {
    const updatedPhotos = [...(fields.propertyPhotos || [])];
    if (updatedPhotos[idx]) {
      updatedPhotos[idx] = { ...updatedPhotos[idx], caption: name };
    } else if (propertyImages[idx]) {
      updatedPhotos[idx] = { url: propertyImages[idx], caption: name };
    }
    const updatedNames = [...(Array.isArray(fields.propertyImageNames) ? fields.propertyImageNames : [])];
    while (updatedNames.length <= idx) {
      updatedNames.push('');
    }
    updatedNames[idx] = name;
    setFields((prev) => ({
      ...prev,
      propertyPhotos: updatedPhotos,
      propertyImageNames: updatedNames,
    }));
  };

  const handlePhotoReorder = (newImages: string[], newNames: string[]) => {
    const newPhotos: BandhanSMEPhoto[] = newImages.map((url, idx) => ({
      url,
      caption: newNames[idx] ?? '',
    }));
    setFields((prev) => ({
      ...prev,
      propertyPhotos: newPhotos,
      propertyImages: newImages,
      propertyImageNames: newNames,
    }));
  };

  // Map Handlers for BaseMapsSection
  const handleMapUpload = async (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages', e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { dataUrl, blob } = await compressImageFile(file, 1600, 1600, 0.85);
        let uploadedUrl = dataUrl;
        try {
          const ext = 'jpg';
          const fileName = `${projectId}-${fieldKey}-${Date.now()}-${i}.${ext}`;
          const filePath = `temp-photos/${projectId}/${fileName}`;
          const { error: uploadErr } = await supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Map upload storage fallback to base64:', storageErr);
        }
        uploadedUrls.push(uploadedUrl);
      }
      setFields(prev => {
        const curr = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : (prev[fieldKey] ? [prev[fieldKey]] : []);
        return {
          ...prev,
          [fieldKey]: [...curr, ...uploadedUrls],
        };
      });
    } catch (err: any) {
      console.error('Map upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleMapRemove = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages', idx?: number) => {
    if (idx === undefined) {
      setFields(prev => ({ ...prev, [fieldKey]: [] }));
      return;
    }
    setFields(prev => {
      const curr = Array.isArray(prev[fieldKey]) ? prev[fieldKey] : (prev[fieldKey] ? [prev[fieldKey]] : []);
      return {
        ...prev,
        [fieldKey]: curr.filter((_, i) => i !== idx),
      };
    });
  };

  const handleMapReorder = (fieldKey: 'locationMapImages' | 'mouzaMapImages' | 'sketchMapImages' | 'cadastralMapImages' | 'bdaMapImages', newImgs: string[]) => {
    setFields(prev => ({ ...prev, [fieldKey]: newImgs }));
  };

  // Document Handlers for BaseDocumentsSection
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const { dataUrl, blob } = await compressImageFile(file, 1600, 1600, 0.85);
        let uploadedUrl = dataUrl;
        try {
          const ext = 'jpg';
          const fileName = `${projectId}-document-${Date.now()}-${i}.${ext}`;
          const filePath = `temp-photos/${projectId}/${fileName}`;
          const { error: uploadErr } = await supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .upload(filePath, blob, { contentType: 'image/jpeg', upsert: true });

          if (!uploadErr) {
            const { data: publicUrlData } = supabaseBrowser.storage
              .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
              .getPublicUrl(filePath);
            if (publicUrlData?.publicUrl) {
              uploadedUrl = publicUrlData.publicUrl;
            }
          }
        } catch (storageErr) {
          console.warn('Document upload storage fallback to base64:', storageErr);
        }
        uploadedUrls.push(uploadedUrl);
      }
      setFields(prev => {
        const currImgs = Array.isArray(prev.documentImages) ? prev.documentImages : [];
        const currNames = Array.isArray(prev.documentImageNames) ? prev.documentImageNames : [];
        const newNames = uploadedUrls.map(() => DEFAULT_DOCUMENT_LABEL);
        return {
          ...prev,
          documentImages: [...currImgs, ...uploadedUrls],
          documentImageNames: [...currNames, ...newNames],
        };
      });
    } catch (err: any) {
      console.error('Document upload error:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleDocumentRemove = (idx: number) => {
    setFields(prev => {
      const currImgs = Array.isArray(prev.documentImages) ? prev.documentImages : [];
      const currNames = Array.isArray(prev.documentImageNames) ? prev.documentImageNames : [];
      return {
        ...prev,
        documentImages: currImgs.filter((_, i) => i !== idx),
        documentImageNames: currNames.filter((_, i) => i !== idx),
      };
    });
  };

  const handleDocumentRename = (idx: number, name: string) => {
    setFields(prev => {
      const currNames = [...(Array.isArray(prev.documentImageNames) ? prev.documentImageNames : [])];
      while (currNames.length <= idx) {
        currNames.push('');
      }
      currNames[idx] = name;
      return {
        ...prev,
        documentImageNames: currNames,
      };
    });
  };

  const handleDocumentReorder = (newImages: string[], newNames: string[]) => {
    setFields(prev => ({
      ...prev,
      documentImages: newImages,
      documentImageNames: newNames,
    }));
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full bg-[#f8f9fa] min-h-screen p-4 sm:p-6 text-slate-900 font-sans">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-6 w-full">
        {/* Top Active Configuration Banner */}
        <ActiveConfigBanner
          clientType={(fields.clientType as 'organisation' | 'individual') || 'organisation'}
          category={fields.institutionCategory || 'Bank & FIS'}
          bankName={fields.bankName || fields.organisationTemplate || 'BANDHAN BANK'}
          subclass={fields.organisationSubTemplate || 'SME'}
          serviceType={fields.serviceType}
          subjectType={fields.subjectType}
          onResetWizard={onResetWizard}
        />

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

        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-semibold border shadow-xs ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {message.text}
          </div>
        )}



        {/* 1. BASIC INFORMATION */}
        <Section number={1} id="sec-basic" title="I. Basic Information (Points A–M)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Field label="A. Name of the Bank Branch / CBO / Asset Centre:">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <div className="relative">
                      <input
                        type="text"
                        className={`${inputCls} bg-slate-100/90 text-slate-700 font-semibold cursor-not-allowed`}
                        value="Bandhan Bank"
                        readOnly
                        disabled
                      />
                      <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
                        <span className="text-[10px] font-semibold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">Fixed</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.branchDetails || ''}
                      onChange={(e) => {
                        const bDetails = e.target.value;
                        const combined = bDetails ? `Bandhan Bank, ${bDetails}` : 'Bandhan Bank';
                        setFields((prev) => ({
                          ...prev,
                          branchDetails: bDetails,
                          branchName: combined,
                        }));
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="B. Bank Letter No. & Date Requesting Valuation:">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.bankLetterNo || ''}
                      onChange={(e) => {
                        const noVal = e.target.value;
                        const dtVal = fields.bankLetterDate || '';
                        const combined = [noVal, dtVal ? `Dt. ${dtVal}` : ''].filter(Boolean).join(' ');
                        setFields((prev) => ({
                          ...prev,
                          bankLetterNo: noVal,
                          letterNoAndDate: combined,
                        }));
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                  <div>
                    <BaseDateInput
                      value={fields.bankLetterDate || ''}
                      onChange={(dtVal) => {
                        const noVal = fields.bankLetterNo || '';
                        const combined = [noVal, dtVal ? `Dt. ${dtVal}` : ''].filter(Boolean).join(' ');
                        setFields((prev) => ({
                          ...prev,
                          bankLetterDate: dtVal,
                          letterNoAndDate: combined,
                        }));
                      }}
                      disabled={isReadOnly}
                    />
                  </div>
                </div>
              </Field>
            </div>
            <Field label="C. Valuation Made at Request of Borrower?:">
              <select
                className={selectCls}
                value={fields.valuationMadeAtBorrowerRequest || 'No'}
                onChange={(e) => handleChange('valuationMadeAtBorrowerRequest', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="D. Name of Manager / Officer who Accompanied:">
              <input
                type="text"
                className={inputCls}
                value={fields.managerAccompanied || ''}
                onChange={(e) => handleChange('managerAccompanied', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="E. Valuation Type:">
              <select
                className={selectCls}
                value={fields.valuationType || 'Fresh Valuation'}
                onChange={(e) => handleChange('valuationType', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Fresh Valuation">Fresh Valuation</option>
                <option value="Revaluation">Revaluation</option>
                <option value="Periodic Valuation">Periodic Valuation</option>
              </select>
            </Field>
            <Field label="F. Date of Earlier Valuation, if any:">
              <input
                type="text"
                className={inputCls}
                value={fields.dateOfEarlierValuation || ''}
                onChange={(e) => handleChange('dateOfEarlierValuation', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="G. Name of Previous Valuer, if any:">
              <input
                type="text"
                className={inputCls}
                value={fields.previousValuerName || ''}
                onChange={(e) => handleChange('previousValuerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="H. Date of Visit to the Property:">
              <div className="space-y-1">
                <BaseDateInput
                  value={fields.dateOfVisit || ''}
                  onChange={(val) => handleChange('dateOfVisit', val)}
                  disabled={isReadOnly}
                />
                {firstFieldAgentVisit?.dateStr && (
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                    <span className="truncate">
                      Earliest Field Visit: <span className="font-semibold text-slate-700">{firstFieldAgentVisit.dateStr}</span>
                      {firstFieldAgentVisit.agentName ? ` (${firstFieldAgentVisit.agentName})` : ''}
                    </span>
                    {!isReadOnly && fields.dateOfVisit !== firstFieldAgentVisit.dateStr && (
                      <button
                        type="button"
                        onClick={() => handleChange('dateOfVisit', firstFieldAgentVisit.dateStr)}
                        className="text-blue-600 hover:text-blue-800 font-semibold underline text-[11px] shrink-0 ml-2 cursor-pointer"
                      >
                        Use Field Date
                      </button>
                    )}
                  </div>
                )}
              </div>
            </Field>
            <Field label="I. Date on which Valuation is Made:">
              <BaseDateInput
                value={fields.dateOfValuation || ''}
                onChange={(val) => handleChange('dateOfValuation', val)}
                disabled={isReadOnly}
              />
            </Field>
            <div className="sm:col-span-2">
              <Field label="J. Person(s) in Presence of whom Valuation is Made:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.personsPresent || ''}
                  onChange={(e) => handleChange('personsPresent', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label="K. List of Documents Produced for Verification:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.documentsProduced || ''}
                  onChange={(e) => handleChange('documentsProduced', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Borrower Sub-Block */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">
                L. Borrower / Borrowal Account Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Borrower Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerName || ''}
                    onChange={(e) => handleChange('borrowerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="At (Location):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerAt || ''}
                    onChange={(e) => handleChange('borrowerAt', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.O:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerPo || ''}
                    onChange={(e) => handleChange('borrowerPo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.S:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerPs || ''}
                    onChange={(e) => handleChange('borrowerPs', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Dist & State:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerDist || ''}
                    onChange={(e) => handleChange('borrowerDist', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Phone / Mobile No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.borrowerPhone || ''}
                    onChange={(e) => handleChange('borrowerPhone', sanitizePositiveInt(e.target.value, 15))}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* Owner Sub-Block */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">
                M. Owner / Owner(s) of the Property
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Owner Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerName || ''}
                    onChange={(e) => handleChange('ownerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="At (Location):">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerAt || ''}
                    onChange={(e) => handleChange('ownerAt', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.O:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPo || ''}
                    onChange={(e) => handleChange('ownerPo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P.S:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPs || ''}
                    onChange={(e) => handleChange('ownerPs', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="PIN Code:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPin || ''}
                    onChange={(e) => handleChange('ownerPin', sanitizePositiveInt(e.target.value, 6))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="District:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerDist || ''}
                    onChange={(e) => handleChange('ownerDist', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Phone / Mobile No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerPhone || ''}
                    onChange={(e) => handleChange('ownerPhone', sanitizePositiveInt(e.target.value, 15))}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Father's Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.ownerFatherName || ''}
                    onChange={(e) => handleChange('ownerFatherName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 2. LAND DETAILS & MASTER AREA UNIT SELECTOR */}
        <Section number={2} id="sec-prop-details" title="II. Valuation of Land (1. Details of Property)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="A. Details of Property Offered as Secured:">
                {renderSelect(
                  fields.detailsPropertyOffered,
                  ['Land & Building', 'Vacant Land', 'Residential Land & Building', 'Commercial Land & Building', 'Residential Flat', 'Commercial Office / Shop', 'Industrial Land & Building'],
                  (v) => handleChange('detailsPropertyOffered', v),
                  isReadOnly,
                  'Land & Building'
                )}
              </Field>
              <Field label="B. Date of Acquisition / Purchase of Land:">
                <BaseDateInput
                  value={fields.dateAcquisitionLand || ''}
                  onChange={(val) => handleChange('dateAcquisitionLand', val)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="C. Value as per Registered Sale Deed:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.valueAsPerSaleDeed || ''}
                  onChange={(e) => handleChange('valueAsPerSaleDeed', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="D. Sale Deed / Title Deed Document No:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.saleDeedDocNo || ''}
                  onChange={(e) => handleChange('saleDeedDocNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              {/* E. Area of Land (As per Title Deed) */}
              <div className="sm:col-span-2">
                <AreaOfLandField
                  label="E. Area of Land (As per Title Deed):"
                  fieldKey="areaLandDoc"
                  value={fields.areaLandDoc || ''}
                  onChange={(formatted, unit, numVal) => handleAreaFieldChange('areaLandDoc', formatted, unit, numVal)}
                  isReadOnly={isReadOnly}
                />
              </div>

              {/* F. Area of Land (As per ROR) */}
              <div className="sm:col-span-2">
                <AreaOfLandField
                  label="F. Area of Land (As per ROR):"
                  fieldKey="areaLandRor"
                  value={fields.areaLandRor || ''}
                  onChange={(formatted, unit, numVal) => handleAreaFieldChange('areaLandRor', formatted, unit, numVal)}
                  isReadOnly={isReadOnly}
                />
              </div>

              {/* G. Area of Land (As per Physical Measurement) */}
              <div className="sm:col-span-2">
                <AreaOfLandField
                  label="G. Area of Land (As per Physical Measurement):"
                  fieldKey="areaLandPhysical"
                  value={fields.areaLandPhysical || ''}
                  onChange={(formatted, unit, numVal) => handleAreaFieldChange('areaLandPhysical', formatted, unit, numVal)}
                  isReadOnly={isReadOnly}
                />
              </div>

              {/* Property Address & Postal Location H */}
              <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <h4 className="font-semibold text-slate-800 text-sm">
                  H. Location of Property & Postal Address
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Plot No(s):">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.plotNo || ''}
                      onChange={(e) => handleChange('plotNo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="Khata No / Dag No:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.khataNo || ''}
                      onChange={(e) => handleChange('khataNo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="At:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propAt || ''}
                      onChange={(e) => handleChange('propAt', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="P.O:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propPo || ''}
                      onChange={(e) => handleChange('propPo', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="P.S:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propPs || ''}
                      onChange={(e) => handleChange('propPs', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="PIN Code:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propPin || ''}
                      onChange={(e) => handleChange('propPin', sanitizePositiveInt(e.target.value, 6))}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="District:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.propDist || ''}
                      onChange={(e) => handleChange('propDist', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>

              <Field label="I. Urban / Semi Urban / Rural:">
                {renderSelect(
                  fields.urbanSemiUrbanRural,
                  ['Urban Area', 'Semi Urban Area', 'Rural Area'],
                  (v) => handleChange('urbanSemiUrbanRural', v),
                  isReadOnly,
                  'Urban Area'
                )}
              </Field>
              <Field label="J. Locality Zone:">
                {renderSelect(
                  fields.situatedAreaType,
                  ['Residential Area', 'Commercial Area', 'Residential cum Commercial Area', 'Industrial Area', 'Mixed Area'],
                  (v) => handleChange('situatedAreaType', v),
                  isReadOnly,
                  'Residential cum Commercial Area'
                )}
              </Field>
              <Field label="K. Locality Classification:">
                {renderSelect(
                  fields.classificationOfLocality,
                  ['High Class', 'Middle Class', 'Poor Class'],
                  (v) => handleChange('classificationOfLocality', v),
                  isReadOnly,
                  'Middle Class'
                )}
              </Field>
              {/* L. Type of Property with nested statutory classification */}
              <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                <Field label="L. Type of Property:">
                  {renderSelect(
                    fields.typeOfProperty,
                    ['Land & building', 'Residential Land & Building', 'Commercial Land & Building', 'Vacant Land', 'Industrial Property', 'Mixed Use Property'],
                    (v) => handleChange('typeOfProperty', v),
                    isReadOnly,
                    'Land & building'
                  )}
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                  <Field label="I. A) Agricultural:">
                    {renderSelect(
                      fields.isAgricultural,
                      ['No', 'Yes'],
                      (v) => handleChange('isAgricultural', v),
                      isReadOnly,
                      'No'
                    )}
                  </Field>
                  <Field label="I. B) Conversion to House Site Plots Contemplated:">
                    {renderSelect(
                      fields.agriculturalConversionContemplated,
                      ['Not Applicable', 'Conversion Permitted', 'Applied for Conversion', 'No', 'Yes'],
                      (v) => handleChange('agriculturalConversionContemplated', v),
                      isReadOnly,
                      'Not Applicable'
                    )}
                  </Field>
                  <Field label="II. A) Industrial:">
                    {renderSelect(
                      fields.isIndustrial,
                      ['No', 'Yes'],
                      (v) => handleChange('isIndustrial', v),
                      isReadOnly,
                      'No'
                    )}
                  </Field>
                  <Field label="II. B) Activity / Industry Suited:">
                    {renderSelect(
                      fields.industrialActivitySuited,
                      ['Not Applicable', 'Light Engineering / Fabrication', 'Warehousing / Logistics', 'Manufacturing Unit', 'Commercial Warehouse', 'Yes'],
                      (v) => handleChange('industrialActivitySuited', v),
                      isReadOnly,
                      'Not Applicable'
                    )}
                  </Field>
                  <Field label="III. Residential (Restrictive clauses):">
                    {renderSelect(
                      fields.isResidential,
                      ['Yes', 'No'],
                      (v) => handleChange('isResidential', v),
                      isReadOnly,
                      'Yes'
                    )}
                  </Field>
                  <Field label="IV. Commercial:">
                    {renderSelect(
                      fields.isCommercial,
                      ['Yes', 'No'],
                      (v) => handleChange('isCommercial', v),
                      isReadOnly,
                      'Yes'
                    )}
                  </Field>
                  <Field label="V. Institutional:">
                    {renderSelect(
                      fields.isInstitutional,
                      ['No', 'Yes'],
                      (v) => handleChange('isInstitutional', v),
                      isReadOnly,
                      'No'
                    )}
                  </Field>
                  <Field label="VI. Others (Specify):">
                    {renderSelect(
                      fields.isOthersSpecify,
                      ['No', 'Yes', 'Mixed Use', 'Not Applicable'],
                      (v) => handleChange('isOthersSpecify', v),
                      isReadOnly,
                      'No'
                    )}
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 3. TITLE, OWNERSHIP & RENT */}
        <Section number={3} id="sec-title-rent" title="II. Valuation of Land (2. Title, Ownership & Rent)">
          <div className="space-y-4">
            {/* 2.1 Title of Property Freehold / Leasehold */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="pb-2 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm">2.1 Title of Property Free Hold / Lease Hold (Points A to F)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Field label="2.1 Title of Property (Freehold / Leasehold):">
                  <select
                    className={selectCls}
                    value={fields.titleFreeholdLeasehold || 'It is a free hold land'}
                    onChange={(e) => {
                      const val = e.target.value;
                      handleChange('titleFreeholdLeasehold', val);
                      if (val.toLowerCase().includes('lease')) {
                        handleChange('isLeaseholdApplicable', 'Yes');
                      }
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="It is a free hold land">Freehold</option>
                    <option value="It is a lease hold land">Leasehold</option>
                  </select>
                </Field>
                <Field label="A. Ownership of Property:">
                  {renderSelect(
                    fields.ownershipOfProperty,
                    ['Single Ownership', 'Joint Ownership'],
                    (v) => handleChange('ownershipOfProperty', v),
                    isReadOnly,
                    'Single Ownership'
                  )}
                </Field>
                <Field label="B. Joint Ownership Share:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.jointOwnershipShare || ''}
                    onChange={(e) => handleChange('jointOwnershipShare', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Taxes Paid Up To:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.taxesPaidUpTo || ''}
                    onChange={(e) => handleChange('taxesPaidUpTo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="D. Land Revenue:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landRevenue || ''}
                    onChange={(e) => handleChange('landRevenue', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="E. Municipal Taxes:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.landBuildingMunicipalTaxes || ''}
                    onChange={(e) => handleChange('landBuildingMunicipalTaxes', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="F. Wealth Tax Assessed / Paid:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.wealthTaxAssessedPaid || ''}
                    onChange={(e) => handleChange('wealthTaxAssessedPaid', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 2.2 If Leasehold */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="pb-2 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm">2.2 If Lease Hold (Points A to M)</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Field label="A. Name of the Lessor:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.lessorName || ''}
                    onChange={(e) => handleChange('lessorName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Name of the Lessee:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.lesseeName || ''}
                    onChange={(e) => handleChange('lesseeName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Nature of Lease:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.natureOfLease || ''}
                    onChange={(e) => handleChange('natureOfLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="D. Date of Commencement:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.dateCommencementLease || ''}
                    onChange={(e) => handleChange('dateCommencementLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="E. Period of Lease:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.periodOfLease || ''}
                    onChange={(e) => handleChange('periodOfLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="G. Terms of Renewal:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.termsOfRenewal || ''}
                    onChange={(e) => handleChange('termsOfRenewal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="H. Lease Premium / Rent Per Annum:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.leasePremiumRentPerAnnum || ''}
                    onChange={(e) => handleChange('leasePremiumRentPerAnnum', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="I. Un-expired Period of Lease:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unexpiredPeriodOfLease || ''}
                    onChange={(e) => handleChange('unexpiredPeriodOfLease', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="J. Initial Premium:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.initialPremium || ''}
                    onChange={(e) => handleChange('initialPremium', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="K. Ground Rent Payable Per Annum:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.groundRentPerAnnum || ''}
                    onChange={(e) => handleChange('groundRentPerAnnum', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="L. Unearned Increase Payable to Lessor:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.unearnedIncreasePayable || ''}
                    onChange={(e) => handleChange('unearnedIncreasePayable', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="M. Lease Agreement Permits Mortgage:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.leasePermitsMortgage || ''}
                    onChange={(e) => handleChange('leasePermitsMortgage', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 2.3 Rent Details */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">2.3 Rent Details (Points A to D)</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Occupation Status:">
                  {renderSelect(
                    fields.rentOccupationStatus,
                    ['The Plot is occupied by Owner', 'Tenanted', 'Partly Owner Occupied & Partly Tenanted', 'Vacant'],
                    (v) => handleChange('rentOccupationStatus', v),
                    isReadOnly,
                    'The Plot is occupied by Owner'
                  )}
                </Field>
                <Field label="A. Tenant Names:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.tenantNames || ''}
                    onChange={(e) => handleChange('tenantNames', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Portion in Occupation:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.tenantPortionOccupied || ''}
                    onChange={(e) => handleChange('tenantPortionOccupied', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="C. Monthly / Annual Rent:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.monthlyAnnualRentPaid || ''}
                    onChange={(e) => handleChange('monthlyAnnualRentPaid', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 4. DESCRIPTION & BOUNDARIES */}
        <Section number={4} id="sec-desc-boundaries" title="II. Valuation of Land (3. Description & Boundaries)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Field label="A. Detailed Postal Address (with PIN):">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.detailedAddressWithPin || ''}
                    onChange={(e) => handleChange('detailedAddressWithPin', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
              <Field label="B. Ward No:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.municipalityWardNo || ''}
                  onChange={(e) => handleChange('municipalityWardNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="C. Street No.:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.streetNo || ''}
                  onChange={(e) => handleChange('streetNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="D. Survey / Plot No.:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.surveyPlotNo || ''}
                  onChange={(e) => handleChange('surveyPlotNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="E. Khata No.:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.briefKhataNo || ''}
                  onChange={(e) => handleChange('briefKhataNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Field label="F. Mouza:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.mouza || ''}
                  onChange={(e) => handleChange('mouza', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="G. Thana No:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.thanaNo || ''}
                  onChange={(e) => handleChange('thanaNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="H. Tehasil No.:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.tehasilNo || ''}
                  onChange={(e) => handleChange('tehasilNo', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="I. Tehasil:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.tehasil || ''}
                  onChange={(e) => handleChange('tehasil', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <Field label="J. SRO:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sro || ''}
                  onChange={(e) => handleChange('sro', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="K. Police Station (P.S):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.policeStation || ''}
                  onChange={(e) => handleChange('policeStation', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="L. Village / Town / City:">
                {renderSelect(
                  fields.villageTownCity,
                  ['City', 'Town', 'Village'],
                  (v) => handleChange('villageTownCity', v),
                  isReadOnly,
                  'City'
                )}
              </Field>
              <Field label="M. District:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.district || ''}
                  onChange={(e) => handleChange('district', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="N. State:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.state || ''}
                  onChange={(e) => handleChange('state', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* O. Dimensions & Extent */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">
                O. Dimensions & Extent of Site (Points I to IV)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <p className="font-semibold text-xs text-slate-700">(I) Dimensions as per Document</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="A) East to West:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionDocEastWest || ''}
                        onChange={(e) => handleChange('dimensionDocEastWest', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="B) North to South:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionDocNorthSouth || ''}
                        onChange={(e) => handleChange('dimensionDocNorthSouth', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-md space-y-2">
                  <p className="font-semibold text-xs text-slate-700">(II) Dimensions as per Measurement</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="A) East to West:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionMeasEastWest || ''}
                        onChange={(e) => handleChange('dimensionMeasEastWest', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <Field label="B) North to South:">
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.dimensionMeasNorthSouth || ''}
                        onChange={(e) => handleChange('dimensionMeasNorthSouth', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>

                <Field label="(III) Extent of Site:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.extentOfSite || ''}
                    onChange={(e) => handleChange('extentOfSite', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(IV) Extent Considered for Valuation:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.extentConsideredValuation || ''}
                    onChange={(e) => handleChange('extentConsideredValuation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* P. Boundaries of the Property (Unified Points 1 & 2) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
              <div className="pb-2 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm">
                  P. Boundaries of the Property (Points 1 & 2)
                </h4>
              </div>

              {/* 1) Document Boundaries */}
              <div className="p-3 bg-white border border-slate-200 rounded-md space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <h5 className="font-semibold text-xs text-slate-700">
                    1) Boundaries as per Document / Deed (Dynamic Multi-Plot Support)
                  </h5>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleAddPlotBoundary}
                      className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded cursor-pointer transition-all"
                    >
                      + Add Plot Boundary
                    </button>
                  )}
                </div>

                {(fields.documentPlotBoundaries || []).map((pb, idx) => (
                  <div key={idx} className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-md space-y-2">
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        className="font-medium text-xs text-slate-900 bg-white border border-slate-200 rounded focus:outline-none focus:border-blue-500 w-64 px-2 py-1"
                        value={pb.plotNo}
                        placeholder="Plot No / Schedule"
                        onChange={(e) => handlePlotBoundaryChange(idx, 'plotNo', e.target.value)}
                        disabled={isReadOnly}
                      />
                      {!isReadOnly && (fields.documentPlotBoundaries || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePlotBoundary(idx)}
                          className="text-red-500 hover:text-red-700 text-xs font-semibold cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <Field label="I) East:">
                        <input
                          type="text"
                          className={inputCls}
                          value={pb.east}
                          onChange={(e) => handlePlotBoundaryChange(idx, 'east', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="II) West:">
                        <input
                          type="text"
                          className={inputCls}
                          value={pb.west}
                          onChange={(e) => handlePlotBoundaryChange(idx, 'west', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="III) North:">
                        <input
                          type="text"
                          className={inputCls}
                          value={pb.north}
                          onChange={(e) => handlePlotBoundaryChange(idx, 'north', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                      <Field label="IV) South:">
                        <input
                          type="text"
                          className={inputCls}
                          value={pb.south}
                          onChange={(e) => handlePlotBoundaryChange(idx, 'south', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>

              {/* 2) Physical Boundaries */}
              <div className="p-3 bg-white border border-slate-200 rounded-md space-y-3">
                <div className="pb-1 border-b border-slate-100">
                  <h5 className="font-semibold text-xs text-slate-700">
                    2) Boundaries as per Physical Verification on Site
                  </h5>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <Field label="I) East:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.verifiedBoundaryEast || ''}
                      onChange={(e) => handleChange('verifiedBoundaryEast', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="II) West:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.verifiedBoundaryWest || ''}
                      onChange={(e) => handleChange('verifiedBoundaryWest', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="III) North:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.verifiedBoundaryNorth || ''}
                      onChange={(e) => handleChange('verifiedBoundaryNorth', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                  <Field label="IV) South:">
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.verifiedBoundarySouth || ''}
                      onChange={(e) => handleChange('verifiedBoundarySouth', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 5. SITE CHARACTERISTICS & PROXIMITIES */}
        <Section number={5} id="sec-site-char" title="II. Valuation of Land (4. Site Characteristics & Location)">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="A. Level of Land / Topography:">
                {renderSelect(
                  fields.levelOfLand,
                  ['Leveled and Plain', 'Low Lying Land', 'Elevated / Sloping Land', 'Uneven / Undulated Land'],
                  (v) => handleChange('levelOfLand', v),
                  isReadOnly,
                  'Leveled and Plain'
                )}
              </Field>
              <Field label="B. Permitted Use:">
                {renderSelect(
                  fields.useToWhichCanBePut,
                  ['Residential cum Commercial Purpose', 'Residential Purpose', 'Commercial Purpose', 'Industrial Purpose', 'Institutional Purpose'],
                  (v) => handleChange('useToWhichCanBePut', v),
                  isReadOnly,
                  'Residential cum Commercial Purpose'
                )}
              </Field>
              <Field label="C. Agreement of Easements (Encroachments):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.easementAgreements || ''}
                  onChange={(e) => handleChange('easementAgreements', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="D. Restrictive Covenant:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.restrictiveCovenant || ''}
                  onChange={(e) => handleChange('restrictiveCovenant', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="E. Development Agency Approval Letter No. & Date:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.approvalLetterNoDateDevelopment || ''}
                  onChange={(e) => handleChange('approvalLetterNoDateDevelopment', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="F. Building Use Certificate Obtained?:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.buildingUseCertificateObtained || ''}
                  onChange={(e) => handleChange('buildingUseCertificateObtained', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="G. Town Planning Scheme / Development Plan Inclusion:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.townPlanningSchemeInclusion || ''}
                  onChange={(e) => handleChange('townPlanningSchemeInclusion', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="H. Corner / Intermittent Plot:">
                <select
                  className={selectCls}
                  value={fields.cornerOrIntermittentPlot || 'Intermittent Plot'}
                  onChange={(e) => handleChange('cornerOrIntermittentPlot', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="Intermittent Plot">Intermittent Plot</option>
                  <option value="Corner Plot">Corner Plot</option>
                </select>
              </Field>
              <Field label="I. Land Locked?:">
                <select
                  className={selectCls}
                  value={fields.isLandLocked || 'No'}
                  onChange={(e) => handleChange('isLandLocked', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </Field>
              <Field label="J. Free Access & Surface Communication Proximity:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.freeAccessAndProximity || ''}
                  onChange={(e) => handleChange('freeAccessAndProximity', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="K. Road Facilities:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.roadFacilities || ''}
                  onChange={(e) => handleChange('roadFacilities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="L. Road Kind & Width:">
                {renderSelect(
                  fields.roadKindAndWidth,
                  ['15 ft wide BT Road', '20 ft wide BT Road', '25 ft wide BT Road', '30 ft wide BT Road', '40 ft wide BT Road', '15 ft wide CC Road', '20 ft wide CC Road', '10 ft wide Morrum Road', 'Earthen Road'],
                  (v) => handleChange('roadKindAndWidth', v),
                  isReadOnly,
                  '15 ft wide BT Road'
                )}
              </Field>
            </div>

            {/* M. Distance from Municipal Office / Limits */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-slate-700">
                M. IF THE PROPERTY IS NOT WITHIN THE CITY/TOWN/MUNICIPAL LIMIT THEN STATE THE DISTANCE OF THE PROPERTY FROM THE:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="a. Municipal Office:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distMunicipalOffice || ''}
                    onChange={(e) => handleChange('distMunicipalOffice', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="b. Municipal Limits:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.distMunicipalLimits || ''}
                    onChange={(e) => handleChange('distMunicipalLimits', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* N to S Environmental & Infrastructure Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Field label="N. Water Potentialities:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.waterPotentialities || ''}
                  onChange={(e) => handleChange('waterPotentialities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="O. Possibility of Frequent Flooding:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.possibilityFlooding || ''}
                  onChange={(e) => handleChange('possibilityFlooding', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="P. Underground Sewerage System:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.undergroundSewerageAvailable || ''}
                  onChange={(e) => handleChange('undergroundSewerageAvailable', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Q. Drainage Systems Available:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.drainageSystemsAvailable || ''}
                  onChange={(e) => handleChange('drainageSystemsAvailable', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="R. Power Supply Available?:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.powerSupplyAvailable || ''}
                  onChange={(e) => handleChange('powerSupplyAvailable', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="S. Surrounding Area Development:">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.surroundingDevelopment || ''}
                  onChange={(e) => handleChange('surroundingDevelopment', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Civic Proximities T */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-slate-700">T. PROXIMITY TO CIVIC AMENITIES:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 text-xs">
                <Field label="(i) School:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximitySchool || ''}
                    onChange={(e) => handleChange('proximitySchool', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(ii) College:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityCollege || ''}
                    onChange={(e) => handleChange('proximityCollege', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(iii) Hospital:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityHospital || ''}
                    onChange={(e) => handleChange('proximityHospital', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(iv) Market:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityMarket || ''}
                    onChange={(e) => handleChange('proximityMarket', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(v) Bus Stand:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityBusStand || ''}
                    onChange={(e) => handleChange('proximityBusStand', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(vi) i) Railway Station:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityRailwayStation || ''}
                    onChange={(e) => handleChange('proximityRailwayStation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(vii) ii) Other Place:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.proximityOtherPlace || ''}
                    onChange={(e) => handleChange('proximityOtherPlace', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* U. Latitude / Longitude Coordinates */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-800 text-sm">
                  U. Latitude / Longitude Coordinates
                </h4>
                {fields.latitude && fields.longitude && (
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                    📍 {fields.latitude}, {fields.longitude}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="Latitude (DD):">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. 20.2961"
                    value={fields.latitude || ''}
                    onChange={(e) => {
                      const lat = e.target.value;
                      const lng = fields.longitude || '';
                      const combined = lat && lng ? `${lat}° N, ${lng}° E` : lat;
                      setFields((prev) => ({
                        ...prev,
                        latitude: lat,
                        latitudeLongitude: combined,
                      }));
                    }}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Longitude (DD):">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. 85.8245"
                    value={fields.longitude || ''}
                    onChange={(e) => {
                      const lng = e.target.value;
                      const lat = fields.latitude || '';
                      const combined = lat && lng ? `${lat}° N, ${lng}° E` : lng;
                      setFields((prev) => ({
                        ...prev,
                        longitude: lng,
                        latitudeLongitude: combined,
                      }));
                    }}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Combined Coordinates (Statutory Display):">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. 20.2961° N, 85.8245° E"
                    value={fields.latitudeLongitude || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      const parts = val.replace(/°\s*[NE]/gi, '').split(/[,\s/]+/);
                      const lat = parts[0] || fields.latitude || '';
                      const lng = parts[1] || fields.longitude || '';
                      setFields((prev) => ({
                        ...prev,
                        latitudeLongitude: val,
                        ...(lat && !isNaN(Number(lat)) ? { latitude: lat } : {}),
                        ...(lng && !isNaN(Number(lng)) ? { longitude: lng } : {}),
                      }));
                    }}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>

            {/* 4. Location Advantages & Disadvantages */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <p className="text-xs font-semibold text-slate-700">4. LOCATION ADVANTAGES & DISADVANTAGES</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="A. Location Advantages:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.locationAdvantages || ''}
                    onChange={(e) => handleChange('locationAdvantages', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="B. Location Disadvantages (Details):">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.locationDisadvantages || ''}
                    onChange={(e) => handleChange('locationDisadvantages', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 6. OTHER ISSUES & SALES RATIONALE */}
        <Section number={6} id="sec-other-issues" title="II. Valuation of Land (5. Other Issues & Sales Rationale)">
          <div className="space-y-4">
            <Field label="A. Land Acquisition Notification:">
              <input
                type="text"
                className={inputCls}
                value={fields.landAcquisitionNotification || ''}
                onChange={(e) => handleChange('landAcquisitionNotification', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="B. Development Contribution Demanded:">
              <input
                type="text"
                className={inputCls}
                value={fields.developmentContributionDemanded || ''}
                onChange={(e) => handleChange('developmentContributionDemanded', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="C. Urban Land Ceiling / Statutory Enactments:">
              <input
                type="text"
                className={inputCls}
                value={fields.landCeilingEnactments || ''}
                onChange={(e) => handleChange('landCeilingEnactments', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* D. Sales */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">D. SALES:</h4>
              <Field label="a. Give instance of sales of immovable property in the locality, if available, indicating the name and address of the property, registration no. sale price and area of the land sold:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.salesInstancesInLocality || ''}
                  onChange={(e) => handleChange('salesInstancesInLocality', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="b. If sale instance are not available or not relied upon, please furnished the basis of arriving at the land rate:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.salesBasisArrivingLandRate || ''}
                  onChange={(e) => handleChange('salesBasisArrivingLandRate', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="c. Land Rate Adopted in this Valuation:">
                <textarea
                  rows={3}
                  className={inputCls}
                  value={fields.adoptedLandRateRationale || ''}
                  onChange={(e) => handleChange('adoptedLandRateRationale', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* 7. VALUATION OF LAND */}
        <Section number={7} id="sec-land-valuation" title="II. Valuation of Land (6. Valuation of Land)">
          <div className="space-y-4">
            {/* A. Previous Valuation Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">A. PREVIOUS VALUATION DETAILS:</h4>
              <Field label="The Detail of the Previous Valuation:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.previousValuationDetails || ''}
                  onChange={(e) => handleChange('previousValuationDetails', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* B. Present Valuation Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4">
              <div className="pb-2 border-b border-slate-200">
                <h4 className="font-semibold text-slate-800 text-sm">B. PRESENT VALUATION DETAILS:</h4>
                <p className="text-xs text-slate-500 italic mt-0.5">
                  (HERE THE REGISTERED VALUER SHOULD DISCUSS IN DETAIL HIS APPROACH IN VALUATION OF THE PROPERTY AND INDICATE HOW THE VALUE HAS BEEN ARRIVED AT, SUPPORTED BY NECESSARY CALCULATIONS.)
                </p>
              </div>

              <Field label="Approach in Valuation of the Property:">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={fields.presentValuationApproachDetails || ''}
                  onChange={(e) => handleChange('presentValuationApproachDetails', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              {/* 1. Valuation of Land */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 tracking-wide">1. VALUATION OF LAND:</span>
                    <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <span>↳ Referenced from:</span>
                      <span className="font-semibold">E. Area of Land (As per Title Deed)</span>
                    </span>
                  </div>
                  {fields.areaLandDoc && (fields.landAreaTotal || '') !== fields.areaLandDoc && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => handleChange('landAreaTotal', fields.areaLandDoc || '')}
                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-md cursor-pointer transition-all shadow-xs"
                      title="Reset value to match Section 2 Point E (Title Deed Area)"
                    >
                      ↻ Sync from Title Deed
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  <textarea
                    rows={2}
                    className={inputCls}
                    placeholder="e.g. Total Area: Ac.0.069 Dec i.e. 3006.00 Sft (1 Acre = 1000 Dec)"
                    value={fields.landAreaTotal !== undefined ? fields.landAreaTotal : (fields.areaLandDoc || '')}
                    onChange={(e) => handleChange('landAreaTotal', e.target.value)}
                    disabled={isReadOnly}
                  />
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2 px-0.5">
                    <span>Editable statement for statutory valuation calculation.</span>
                    <span className="font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">
                      Effective Calculated Area: {parseSqftFromArea(fields.landAreaTotal || fields.areaLandDoc || fields.extentOfSite, fields.landAreaUnit, fields.landAreaValue).toFixed(2)} Sft
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. Govt. Value */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800 tracking-wide">2. GOVT. VALUE (Benchmark & Guideline Value):</span>
                  <span className="text-[11px] text-slate-500">
                    Area: <span className="font-semibold text-slate-700">{parseSqftFromArea(fields.landAreaTotal || fields.areaLandDoc || fields.extentOfSite, fields.landAreaUnit, fields.landAreaValue).toFixed(2)} Sft</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Govt. Benchmark Value (Per Acre):">
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="e.g. 172920000"
                      value={fields.landGovtBenchmarkPerAcre || ''}
                      onChange={(e) => {
                        const val = sanitizePositiveFloat(e.target.value);
                        const acreN = parseFloat(val) || 0;
                        const sftRate = acreN > 0 ? String(Math.round(acreN / 43560)) : '';
                        setFields(prev => ({
                          ...prev,
                          landGovtBenchmarkPerAcre: val,
                          landGovtBenchmarkRate: sftRate || prev.landGovtBenchmarkRate,
                        }));
                      }}
                      disabled={isReadOnly}
                    />
                  </Field>

                  <Field label="Govt. Benchmark Land Rate (Rs./Sq.ft):">
                    <input
                      type="text"
                      className={inputCls}
                      placeholder="e.g. 3970"
                      value={fields.landGovtBenchmarkRate || ''}
                      onChange={(e) => {
                        const val = sanitizePositiveFloat(e.target.value);
                        const sftN = parseFloat(val) || 0;
                        const acreVal = sftN > 0 ? String(Math.round(sftN * 43560)) : '';
                        setFields(prev => ({
                          ...prev,
                          landGovtBenchmarkRate: val,
                          landGovtBenchmarkPerAcre: acreVal || prev.landGovtBenchmarkPerAcre,
                        }));
                      }}
                      disabled={isReadOnly}
                    />
                  </Field>
                </div>

                <Field label="2. Govt. Value (Guideline Value Statement):">
                  <textarea
                    rows={3}
                    className={inputCls}
                    placeholder="Govt. Benchmark Value: Rs.17,29,20,000 /- Per Acre i.e. Rs.3970/- Per Sft&#10;Guideline Value of Land= 3006.00 Sft X Rs.3970/- Per Sft = Rs.1,19,33,820/-"
                    value={fields.landGovtValueTotal || ''}
                    onChange={(e) => handleChange('landGovtValueTotal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* 3. Market Value */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-800 tracking-wide">3. MARKET VALUE:</span>
                  <span className="text-[11px] text-slate-500">
                    Area: <span className="font-semibold text-slate-700">{parseSqftFromArea(fields.landAreaTotal || fields.areaLandDoc || fields.extentOfSite, fields.landAreaUnit, fields.landAreaValue).toFixed(2)} Sft</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Field label="Adopted Market Land Rate (Rs./Sq.ft):">
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="e.g. 6000"
                        value={fields.landMarketRate || ''}
                        onChange={(e) => handleChange('landMarketRate', sanitizePositiveFloat(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Field label="3. Market Value (Total Market Value Statement):">
                      <textarea
                        rows={2}
                        className={inputCls}
                        placeholder="Total Market Value of Land: 3006.00 Sft X Rs.6000/- Per Sft = Rs.1,80,36,000/-"
                        value={fields.landMarketValueTotal || ''}
                        onChange={(e) => handleChange('landMarketValueTotal', e.target.value)}
                        disabled={isReadOnly}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              {/* 4 & 5. Distress Sale & Realisable Estimation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* 4. Distress */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 tracking-wide">4. DISTRESS SALE VALUE</span>
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>🔒 Read-Only (Auto-calculated)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Distress %:">
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="85"
                        value={fields.distressSalePct !== undefined ? fields.distressSalePct : '85'}
                        onChange={(e) => handleChange('distressSalePct', sanitizePercentage(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <div className="col-span-2">
                      <Field label={`4. Distress Sale Value (${fields.distressSalePct || '85'}%):`}>
                        <input
                          type="text"
                          className={`${inputCls} bg-slate-50 font-bold text-slate-800 cursor-not-allowed border-slate-200`}
                          value={fields.landDistressValue || ''}
                          readOnly
                          disabled
                        />
                      </Field>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Auto-calculated as {fields.distressSalePct || '85'}% of Total Market Value.
                  </p>
                </div>

                {/* 5. Realisable */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 tracking-wide">5. REALISABLE ESTIMATION</span>
                    <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span>🔒 Read-Only (Auto-calculated)</span>
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Field label="Realisable %:">
                      <input
                        type="text"
                        className={inputCls}
                        placeholder="95"
                        value={fields.realisableValuePct !== undefined ? fields.realisableValuePct : '95'}
                        onChange={(e) => handleChange('realisableValuePct', sanitizePercentage(e.target.value))}
                        disabled={isReadOnly}
                      />
                    </Field>
                    <div className="col-span-2">
                      <Field label={`5. Realisable Value (${fields.realisableValuePct || '95'}%):`}>
                        <input
                          type="text"
                          className={`${inputCls} bg-slate-50 font-bold text-slate-800 cursor-not-allowed border-slate-200`}
                          value={fields.landRealisableValue || ''}
                          readOnly
                          disabled
                        />
                      </Field>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 italic leading-snug">
                    Auto-calculated as {fields.realisableValuePct || '95'}% of Total Market Value (distress bank sale estimation).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 8. BUILDING BASIC INFO & BUILT UP AREA */}
        <Section number={8} id="sec-bldg-basic" title="III. Valuation of Building (1. Basic Info & Built-up Area)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="A. Type of Building:">
              {renderSelect(
                fields.buildingType,
                ['Residential Cum Commercial', 'Residential Building', 'Commercial Building', 'Industrial Building', 'Apartment / Residential Flat'],
                (v) => handleChange('buildingType', v),
                isReadOnly,
                'Residential Cum Commercial'
              )}
            </Field>
            <Field label="B. Year of Commencement & Completion:">
              <input
                type="text"
                className={inputCls}
                value={fields.yearCommencementCompletion || ''}
                onChange={(e) => handleChange('yearCommencementCompletion', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="C. Construction Type:">
              {renderSelect(
                fields.typeOfConstruction,
                ['RCC Frames', 'Load Bearing Masonry', 'Steel Framed Structure', 'Aluform / Mivan Structure'],
                (v) => handleChange('typeOfConstruction', v),
                isReadOnly,
                'RCC Frames'
              )}
            </Field>
            <Field label="D. Estimated Future Life (Years):">
              {renderSelect(
                fields.estimatedFutureLife,
                ['60 Yrs', '50 Yrs', '40 Yrs', '30 Yrs', '20 Yrs', '70 Yrs'],
                (v) => handleChange('estimatedFutureLife', v),
                isReadOnly,
                '60 Yrs'
              )}
            </Field>
            <Field label="E. FAR / FSI Permissible & Utilized:">
              <input
                type="text"
                className={inputCls}
                value={fields.farFsiPermissibleUtilized || ''}
                onChange={(e) => handleChange('farFsiPermissibleUtilized', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="F. Approval Letter / Authority Details:">
              <input
                type="text"
                className={inputCls}
                value={fields.buildingApprovalAuthorityDetails || ''}
                onChange={(e) => handleChange('buildingApprovalAuthorityDetails', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
            <Field label="G. Construction as per Approved Plan?:">
              {renderSelect(
                fields.constructionAsPerPlanDeviations,
                ['Yes', 'No', 'Minor Deviations', 'Deviations within permissible limits'],
                (v) => handleChange('constructionAsPerPlanDeviations', v),
                isReadOnly,
                'Yes'
              )}
            </Field>

            {/* H. Built up Area Details */}
            <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">H. BUILT UP AREA DETAILS:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="(I) A) As per Assessment of Holding:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.builtUpAreaAssessmentHolding || ''}
                    onChange={(e) => handleChange('builtUpAreaAssessmentHolding', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(I) B) As per Actual:">
                  <textarea
                    rows={2}
                    className={inputCls}
                    value={fields.builtUpAreaAsPerActual || ''}
                    onChange={(e) => handleChange('builtUpAreaAsPerActual', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(II) Carpet Area:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.carpetAreaTotal || ''}
                    onChange={(e) => handleChange('carpetAreaTotal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="(III) Saleable Area:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.saleableAreaTotal || ''}
                    onChange={(e) => handleChange('saleableAreaTotal', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 9. BUILDING CHECKLIST */}
        <Section number={9} id="sec-bldg-checklist" title="III. Valuation of Building (1. Occupancy & Checklist)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <Field label="I. Occupancy:">
              <select
                className={selectCls}
                value={fields.buildingOwnerOccupiedTenanted || 'Owner Occupied'}
                onChange={(e) => handleChange('buildingOwnerOccupiedTenanted', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Owner Occupied">Owner Occupied</option>
                <option value="Tenanted">Tenanted</option>
                <option value="Both">Both</option>
              </select>
            </Field>
            <Field label="K. Under Rent Control Act:">
              <select
                className={selectCls}
                value={fields.isUnderRentControlAct || 'No'}
                onChange={(e) => handleChange('isUnderRentControlAct', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="W. Pump Maintenance:">
              {renderSelect(
                fields.pumpMaintenanceBorneBy,
                ['Borne by Owner', 'Borne by Tenant', 'Commonly Shared', 'Not Applicable'],
                (v) => handleChange('pumpMaintenanceBorneBy', v),
                isReadOnly,
                'Borne by Owner'
              )}
            </Field>
            <Field label="X. Common Electricity:">
              {renderSelect(
                fields.commonElectricityBorneBy,
                ['Borne by Owner', 'Borne by Tenant', 'Commonly Shared', 'Not Applicable'],
                (v) => handleChange('commonElectricityBorneBy', v),
                isReadOnly,
                'Borne by Owner'
              )}
            </Field>
          </div>
        </Section>

        {/* 10. TECHNICAL DETAILS OF THE BUILDING */}
        <Section number={10} id="sec-bldg-tech" title="III. Valuation of Building (2. Technical Details of Building)">
          <div className="space-y-4">
            {/* A. Number of Floors & Height */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs tracking-wide">
                    A. NUMBER OF FLOORS &amp; HEIGHT OF EACH FLOOR
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Define the floor schedule and heights below. The floor entries defined here dynamically populate Points B, E, F, and G.
                  </p>
                </div>
                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleAddFloorDetail}
                    className="px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-md cursor-pointer transition-all shadow-xs"
                  >
                    + Add Floor
                  </button>
                )}
              </div>

              <Field label="A. Number of Floors & Total Height (Summary Statement):">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. G+3 Storied Building & Height: 10'-6&quot;"
                  value={fields.numberOfFloorsAndHeight || ''}
                  onChange={(e) => handleChange('numberOfFloorsAndHeight', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              <div className="space-y-2.5 pt-1">
                <span className="text-[11px] font-bold text-slate-700 block uppercase tracking-wider">
                  Floor-Wise Height Details (Points A.i, A.ii...):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(fields.floorDetails || []).map((fl, idx) => {
                    const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
                    const rom = romans[idx] || `(${idx + 1})`;
                    return (
                      <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-2 shadow-2xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                          <div className="flex items-center gap-1.5 flex-1 mr-2">
                            <span className="font-bold text-xs text-blue-700">{rom}</span>
                            <input
                              type="text"
                              className="font-semibold text-xs text-slate-900 border-b border-slate-200 focus:outline-none focus:border-blue-500 w-full px-1 py-0.5"
                              value={fl.floorName}
                              onChange={(e) => handleFloorDetailChange(idx, 'floorName', e.target.value)}
                              disabled={isReadOnly}
                              placeholder={`Floor ${idx + 1}`}
                            />
                          </div>
                          {!isReadOnly && (fields.floorDetails || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveFloorDetail(idx)}
                              className="text-red-500 hover:text-red-700 text-xs font-bold cursor-pointer p-0.5"
                              title="Remove floor"
                            >
                              ×
                            </button>
                          )}
                        </div>
                        <Field label={`A.${rom} ${fl.floorName} Height:`}>
                          <input
                            type="text"
                            className={inputCls}
                            placeholder="e.g. 10'-6&quot; or Do"
                            value={fl.height || ''}
                            onChange={(e) => handleFloorDetailChange(idx, 'height', e.target.value)}
                            disabled={isReadOnly}
                          />
                        </Field>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* B. Plinth Area Floor-Wise */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-bold text-slate-800 text-xs tracking-wide">
                    B. PLINTH AREA FLOOR-WISE
                  </h4>
                  <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    ↳ Referenced from Point A ({(fields.floorDetails || []).length} Floors)
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-1 rounded-md">
                  Total Floor Plinth Area: {(fields.floorDetails || []).reduce((acc, f) => acc + (parseFloat(String(f.plinthArea).replace(/[^0-9.]/g, '')) || 0), 0).toFixed(2)} Sft
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(fields.floorDetails || []).map((fl, idx) => {
                  const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
                  const rom = romans[idx] || `(${idx + 1})`;
                  return (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 shadow-2xs">
                      <span className="font-bold text-xs text-slate-800 block">
                        B.{rom} {fl.floorName}
                      </span>
                      <Field label="Plinth Area (Sft):">
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="e.g. 2156.00"
                          value={fl.plinthArea || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'plinthArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* C. Condition of the Building */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs tracking-wide pb-2 border-b border-slate-200">
                C. CONDITION OF THE BUILDING
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="C. (i) Condition of Building (Exterior):">
                  {renderSelect(
                    fields.buildingConditionExterior,
                    ['Good', 'Very Good', 'Fair', 'Average', 'Poor'],
                    (v) => handleChange('buildingConditionExterior', v),
                    isReadOnly,
                    'Good'
                  )}
                </Field>
                <Field label="C. (ii) Condition of Building (Interior):">
                  {renderSelect(
                    fields.buildingConditionInterior,
                    ['Good', 'Very Good', 'Fair', 'Average', 'Poor'],
                    (v) => handleChange('buildingConditionInterior', v),
                    isReadOnly,
                    'Good'
                  )}
                </Field>
              </div>
            </div>

            {/* D. Type of Foundations */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs tracking-wide pb-2 border-b border-slate-200">
                D. TYPE OF FOUNDATIONS
              </h4>
              <div className="max-w-md">
                <Field label="D. Type of Foundations:">
                  {renderSelect(
                    fields.foundationType,
                    ['Column Foundation', 'Isolated Footing', 'Raft Foundation', 'Strip Footing', 'Pile Foundation', 'Under Reamed Pile'],
                    (v) => handleChange('foundationType', v),
                    isReadOnly,
                    'Column Foundation'
                  )}
                </Field>
              </div>
            </div>

            {/* E. Doors and Windows Floor-Wise */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs tracking-wide">
                  E. DOORS AND WINDOWS (FLOOR-WISE)
                </h4>
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  ↳ Referenced from Point A ({(fields.floorDetails || []).length} Floors)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(fields.floorDetails || []).map((fl, idx) => {
                  const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
                  const rom = romans[idx] || `(${idx + 1})`;
                  return (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 shadow-2xs">
                      <span className="font-bold text-xs text-slate-800 block">
                        E.{rom} {fl.floorName}
                      </span>
                      <Field label="Doors &amp; Windows:">
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="e.g. Sal wood choukath with shutter"
                          value={fl.doorsWindows || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'doorsWindows', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* F. Flooring Floor-Wise */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs tracking-wide">
                  F. FLOORING (FLOOR-WISE)
                </h4>
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  ↳ Referenced from Point A ({(fields.floorDetails || []).length} Floors)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(fields.floorDetails || []).map((fl, idx) => {
                  const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
                  const rom = romans[idx] || `(${idx + 1})`;
                  return (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 shadow-2xs">
                      <span className="font-bold text-xs text-slate-800 block">
                        F.{rom} {fl.floorName}
                      </span>
                      <Field label="Flooring Type:">
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="e.g. VT Flooring or Do"
                          value={fl.flooring || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'flooring', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* G. Wall Finishing Floor-Wise */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200">
                <h4 className="font-bold text-slate-800 text-xs tracking-wide">
                  G. WALL FINISHING (FLOOR-WISE)
                </h4>
                <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                  ↳ Referenced from Point A ({(fields.floorDetails || []).length} Floors)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(fields.floorDetails || []).map((fl, idx) => {
                  const romans = ['(i)', '(ii)', '(iii)', '(iv)', '(v)', '(vi)', '(vii)', '(viii)', '(ix)', '(x)'];
                  const rom = romans[idx] || `(${idx + 1})`;
                  return (
                    <div key={idx} className="p-3 bg-white border border-slate-200 rounded-lg space-y-1.5 shadow-2xs">
                      <span className="font-bold text-xs text-slate-800 block">
                        G.{rom} {fl.floorName}
                      </span>
                      <Field label="Wall Finishing:">
                        <input
                          type="text"
                          className={inputCls}
                          placeholder="e.g. Cement Plastering, Putty, Paint"
                          value={fl.wallFinishing || ''}
                          onChange={(e) => handleFloorDetailChange(idx, 'wallFinishing', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </Field>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Section>

        {/* 11. SPECIFICATIONS OF CONSTRUCTION */}
        <Section number={11} id="sec-bldg-specs" title="III. Valuation of Building (3. Specifications of Construction)">
          <div className="space-y-4">
            {/* Structure & Framework (A - E) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs tracking-wide pb-2 border-b border-slate-200 uppercase">
                Structure &amp; Joinery (Points A to E)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="A. Foundation:">
                  {renderSelect(
                    fields.specFoundation,
                    ['Column Foundation', 'Isolated Footing', 'Raft Foundation', 'Strip Footing', 'Pile Foundation', 'Under Reamed Pile'],
                    (v) => handleChange('specFoundation', v),
                    isReadOnly,
                    'Column Foundation'
                  )}
                </Field>
                <Field label="B. Basement:">
                  {renderSelect(
                    fields.specBasement,
                    ['No', 'Yes', 'Partial Basement', 'Full Basement', 'Not Applicable'],
                    (v) => handleChange('specBasement', v),
                    isReadOnly,
                    'No'
                  )}
                </Field>
                <Field label="C. Superstructure:">
                  {renderSelect(
                    fields.specSuperstructure,
                    ['Brick Masonry Super Structure', 'RCC Framed Structure', 'Fly Ash Brick Masonry', 'AAC Block Masonry', 'Load Bearing Structure', 'Stone Masonry'],
                    (v) => handleChange('specSuperstructure', v),
                    isReadOnly,
                    'Brick Masonry Super Structure'
                  )}
                </Field>
                <Field label="D. Joinery/Doors & Windows:">
                  {renderSelect(
                    fields.specJoineryDoorsWindows,
                    [
                      'Sal wood choukath with non sal wood shutter',
                      'Sal wood frames with flush doors & UPVC windows',
                      'Teak wood frames & shutters',
                      'UPVC frames and glazed windows',
                      'Aluminium sliding windows & wooden doors',
                      'Flush doors & steel windows'
                    ],
                    (v) => handleChange('specJoineryDoorsWindows', v),
                    isReadOnly,
                    'Sal wood choukath with non sal wood shutter'
                  )}
                </Field>
                <Field label="E. RCC Works:">
                  {renderSelect(
                    fields.specRccWorks,
                    ['Lintel, Chajja, Beam, Slab', 'Lintel, Chajja, Beam', 'RCC Columns, Beams & Slabs (M20/M25)', 'RCC Frame with Slabs & Lintels', 'Not Applicable'],
                    (v) => handleChange('specRccWorks', v),
                    isReadOnly,
                    'Lintel, Chajja, Beam'
                  )}
                </Field>
              </div>
            </div>

            {/* Finishes & Roofing (F - K) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs tracking-wide pb-2 border-b border-slate-200 uppercase">
                Finishes, Roofing &amp; Features (Points F to K)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="F. Plastering:">
                  {renderSelect(
                    fields.specPlastering,
                    ['Cement Plastering', 'Cement Plastering (1:6 / 1:4)', 'Smooth Cement Plaster with POP/Putty finish', 'Double Coat Sand Faced Plaster', 'Gypsum Plaster'],
                    (v) => handleChange('specPlastering', v),
                    isReadOnly,
                    'Cement Plastering'
                  )}
                </Field>
                <Field label="G. Flooring, Skirting, Dadoing:">
                  {renderSelect(
                    fields.specFlooringSkirting,
                    ['VT Flooring', 'Vitrified Tiles', 'Ceramic Tiles', 'Marble Flooring', 'Granite Flooring', 'Kota Stone', 'IPS / Cement Concrete Flooring'],
                    (v) => handleChange('specFlooringSkirting', v),
                    isReadOnly,
                    'VT Flooring'
                  )}
                </Field>
                <Field label="H. Special Finishing:">
                  {renderSelect(
                    fields.specSpecialFinishing,
                    ['Yes', 'No', 'Wall Putty & Plastic Emulsion Paint', 'Weather Coat Exterior Paint', 'POP False Ceiling & Texture Paint', 'Not Applicable'],
                    (v) => handleChange('specSpecialFinishing', v),
                    isReadOnly,
                    'Yes'
                  )}
                </Field>
                <Field label="I. Roofing (Weather Proof Course):">
                  {renderSelect(
                    fields.specRoofing,
                    ['RCC Roof', 'ACC Sheet', 'GI Sheet', 'Tiles Roof', 'Madras Terrace', 'Pre-cast RCC Slab'],
                    (v) => handleChange('specRoofing', v),
                    isReadOnly,
                    'RCC Roof'
                  )}
                </Field>
                <Field label="J. Drainage:">
                  {renderSelect(
                    fields.specDrainage,
                    ['Surface Drainage', 'Underground Concealed Drainage', 'PVC Pipe Drainage System', 'Connected to Municipal Drain', 'Open Surface Drain'],
                    (v) => handleChange('specDrainage', v),
                    isReadOnly,
                    'Surface Drainage'
                  )}
                </Field>
                <Field label="K. Special Architectural / Decorative Features:">
                  {renderSelect(
                    fields.specDecorativeFeatures,
                    ['Interior work is done on Second & Third Floor', 'Interior Decorative Works with False Ceiling', 'Standard Architectural Elevation', 'Normal Plaster Grooves', 'None'],
                    (v) => handleChange('specDecorativeFeatures', v),
                    isReadOnly,
                    'Interior work is done on Second & Third Floor'
                  )}
                </Field>
              </div>
            </div>

            {/* Electrical & Sanitary Utilities (L - O, Q - R, T - W) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs tracking-wide pb-2 border-b border-slate-200 uppercase">
                Utilities, Electrical &amp; Sanitary (Points L to O, Q, R, T to W)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="L. (i) Internal Wiring (Concealed/External):">
                  {renderSelect(
                    fields.specInternalWiring,
                    ['Concealed', 'External / Open Casing-Capping', 'Concealed Copper Wiring (ISI Mark)', 'Concealed Conduit Wiring'],
                    (v) => handleChange('specInternalWiring', v),
                    isReadOnly,
                    'Concealed'
                  )}
                </Field>
                <Field label="L. (ii) Class of Electrical Fittings:">
                  {renderSelect(
                    fields.specWiringFittingsClass,
                    ['Superior', 'Standard / Modular', 'Ordinary', 'Semi-Modular', 'Premium Modular (Anchor/Havells/Legrand)'],
                    (v) => handleChange('specWiringFittingsClass', v),
                    isReadOnly,
                    'Superior'
                  )}
                </Field>
                <Field label="M. Sanitary Installation:">
                  {renderSelect(
                    fields.specSanitaryInstallation,
                    ['Yes', 'No', 'Modern CPVC/PVC Sanitary System', 'Standard Sanitary Line with CP Fittings', 'Not Applicable'],
                    (v) => handleChange('specSanitaryInstallation', v),
                    isReadOnly,
                    'Yes'
                  )}
                </Field>
                <Field label="N. No. of Geysers:">
                  {renderSelect(
                    fields.specNoOfGeysers,
                    ['Not Verified', '1 Nos', '2 Nos', '3 Nos', '4 Nos', '5 Nos', 'None / Nil'],
                    (v) => handleChange('specNoOfGeysers', v),
                    isReadOnly,
                    'Not Verified'
                  )}
                </Field>
                <Field label="O. Class of Sanitary Fitting:">
                  {renderSelect(
                    fields.specSanitaryFittingsClass,
                    ['Superior', 'Standard', 'Ordinary', 'Premium (Jaquar/Cera/Hindware)', 'Luxury / High End'],
                    (v) => handleChange('specSanitaryFittingsClass', v),
                    isReadOnly,
                    'Superior'
                  )}
                </Field>
                <Field label="Q. No. of Lifts & Capacity:">
                  {renderSelect(
                    fields.specLiftsCapacity,
                    ['No', '1 Lift (4 Passengers / 272 kg)', '1 Lift (6 Passengers / 408 kg)', '1 Lift (8 Passengers / 544 kg)', '2 Lifts (6 Passengers)', 'Not Applicable'],
                    (v) => handleChange('specLiftsCapacity', v),
                    isReadOnly,
                    'No'
                  )}
                </Field>
                <Field label="R. Underground Sump (Capacity & Type):">
                  {renderSelect(
                    fields.specUndergroundSump,
                    ['Not Available', 'RCC Sump (5000 Liters)', 'RCC Sump (10000 Liters)', 'Brick Masonry Sump (3000 Liters)', 'Available (Capacity not specified)', 'Nil'],
                    (v) => handleChange('specUndergroundSump', v),
                    isReadOnly,
                    'Not Available'
                  )}
                </Field>
                <Field label="T. Pumps (No. & HP):">
                  {renderSelect(
                    fields.specPumpsHp,
                    ['1 Nos & 1 HP Pump', '1 Nos (0.5 HP Submersible)', '1 Nos (1.0 HP Submersible)', '1 Nos (1.5 HP Monobloc Pump)', '2 Nos (1 HP each)', 'Not Available'],
                    (v) => handleChange('specPumpsHp', v),
                    isReadOnly,
                    '1 Nos & 1 HP Pump'
                  )}
                </Field>
                <Field label="U. Roads & Paving in Compound:">
                  {renderSelect(
                    fields.specRoadsPavingCompound,
                    ['No', 'Yes (Interlocking Paver Blocks)', 'Yes (Concrete / CC Paving)', 'Yes (Stone Paving)', 'Not Applicable'],
                    (v) => handleChange('specRoadsPavingCompound', v),
                    isReadOnly,
                    'No'
                  )}
                </Field>
                <Field label="V. Sewage Disposal (Sewers/Septic):">
                  {renderSelect(
                    fields.specSewageDisposal,
                    ['Connected to Public Sewers', 'Septic Tank with Soak Pit', 'Septic Tank Only', 'Municipal Underground Sewerage System', 'Direct Open Drain'],
                    (v) => handleChange('specSewageDisposal', v),
                    isReadOnly,
                    'Connected to Public Sewers'
                  )}
                </Field>
                <Field label="W. Quality / Class of Construction:">
                  {renderSelect(
                    fields.specQualityClassConstruction,
                    ['Good', 'Very Good', 'Superior / First Class', 'Second Class / Average', 'Economy Class', 'Fair'],
                    (v) => handleChange('specQualityClassConstruction', v),
                    isReadOnly,
                    'Good'
                  )}
                </Field>
              </div>
            </div>

            {/* P. Compound Wall Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs tracking-wide pb-2 border-b border-slate-200 uppercase">
                P. Compound Wall Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="P. 1. Compound Wall:">
                  {renderSelect(
                    fields.specCompoundWall,
                    ['Yes', 'No', 'Partial', 'Not Applicable'],
                    (v) => handleChange('specCompoundWall', v),
                    isReadOnly,
                    'Yes'
                  )}
                </Field>
                <Field label="P. 2. Height and Length:">
                  <input
                    type="text"
                    className={inputCls}
                    placeholder="e.g. Height: 5'-0&quot;, Length: 150'-0&quot;"
                    value={fields.specCompoundWallHeightLength || ''}
                    onChange={(e) => handleChange('specCompoundWallHeightLength', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="P. 3. Type of Construction:">
                  {renderSelect(
                    fields.specCompoundWallType,
                    ['Brick Masonry Wall with Iron Gate', 'Brick Masonry Wall with Plaster & Paint', 'RCC / Precast Compound Wall', 'Stone Masonry Wall', 'Barbed Wire Fencing with MS Gate', 'Not Applicable'],
                    (v) => handleChange('specCompoundWallType', v),
                    isReadOnly,
                    'Brick Masonry Wall with Iron Gate'
                  )}
                </Field>
              </div>
            </div>

            {/* S. Overhead Tank Details */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <h4 className="font-bold text-slate-800 text-xs tracking-wide pb-2 border-b border-slate-200 uppercase">
                S. Overhead Tank Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Field label="S. 1. Overhead Tank:">
                  {renderSelect(
                    fields.specOverheadTank,
                    ['Yes', 'No', 'Not Applicable'],
                    (v) => handleChange('specOverheadTank', v),
                    isReadOnly,
                    'Yes'
                  )}
                </Field>
                <Field label="S. 2. Where Located:">
                  {renderSelect(
                    fields.specOverheadTankLocation,
                    ['On the top of the roof', 'Over Head Staging / Terrace', 'On RCC Slab Above Staircase Headroom', 'Not Applicable'],
                    (v) => handleChange('specOverheadTankLocation', v),
                    isReadOnly,
                    'On the top of the roof'
                  )}
                </Field>
                <Field label="S. 3. Capacity:">
                  {renderSelect(
                    fields.specOverheadTankCapacity,
                    ['2000 Liters', '1000 Liters (PVC/Sintex)', '1500 Liters', '3000 Liters', '5000 Liters (RCC/PVC)', 'Not Applicable'],
                    (v) => handleChange('specOverheadTankCapacity', v),
                    isReadOnly,
                    '2000 Liters'
                  )}
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 12. BUILDING VALUATION, SUB-SCHEDULES & 6.0 TOTAL ABSTRACT MATRIX */}
        <Section number={12} id="sec-bldg-valuation-schedules" title="III. Valuation of Building (4. Valuation, Sub-Schedules & 6.0 Matrix)">
          <div className="space-y-4">
            {/* 8-Col Valuation Table */}
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-800 text-sm">4. Details of Building Valuation</h4>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddBuildingRow}
                  className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded cursor-pointer"
                >
                  + Add Valuation Row
                </button>
              )}
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700">
                  <tr>
                    <th className="p-2 text-left">Description</th>
                    <th className="p-2 text-left">Plinth (sft)</th>
                    <th className="p-2 text-left">Height</th>
                    <th className="p-2 text-left">Age</th>
                    <th className="p-2 text-left">Repl. Rate</th>
                    <th className="p-2 text-left">Repl. Cost</th>
                    <th className="p-2 text-left">Depreciation</th>
                    <th className="p-2 text-left">Net Value</th>
                    {!isReadOnly && <th className="p-2 w-10 text-center">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {(fields.buildingValuationRows || []).map((br, idx) => (
                    <tr key={idx}>
                      <td className="p-1">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.description}
                          onChange={(e) => handleBuildingRowChange(idx, 'description', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-20">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.plinthArea}
                          onChange={(e) => handleBuildingRowChange(idx, 'plinthArea', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-16">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.height}
                          onChange={(e) => handleBuildingRowChange(idx, 'height', e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-16">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.age}
                          onChange={(e) => handleBuildingRowChange(idx, 'age', sanitizePositiveInt(e.target.value, 3))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-24">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.replacementRate}
                          onChange={(e) => handleBuildingRowChange(idx, 'replacementRate', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-28">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.replacementCost}
                          onChange={(e) => handleBuildingRowChange(idx, 'replacementCost', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-24">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.depreciation}
                          onChange={(e) => handleBuildingRowChange(idx, 'depreciation', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="p-1 w-28">
                        <input
                          type="text"
                          className={inputCls}
                          value={br.valueAfterDepreciation}
                          onChange={(e) => handleBuildingRowChange(idx, 'valueAfterDepreciation', sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </td>
                      {!isReadOnly && (
                        <td className="p-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveBuildingRow(idx)}
                            className="text-red-500 hover:text-red-700 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4 Sub-schedules */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              {/* Extra Items */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-slate-800">5.1 Extra Items</h5>
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fields.isExtraItemsNA}
                      onChange={(e) => handleChange('isExtraItemsNA', e.target.checked)}
                      disabled={isReadOnly}
                    />
                    Not Applicable
                  </label>
                </div>
                {!fields.isExtraItemsNA && (
                  <div className="space-y-1">
                    {(fields.extraItems || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                        <input
                          type="text"
                          className={`${inputCls} text-xs py-0.5`}
                          value={it.cost}
                          onChange={(e) => handleSubScheduleChange('extraItems', idx, sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Amenities */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-slate-800">5.2 Amenities</h5>
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fields.isAmenitiesNA}
                      onChange={(e) => handleChange('isAmenitiesNA', e.target.checked)}
                      disabled={isReadOnly}
                    />
                    Not Applicable
                  </label>
                </div>
                {!fields.isAmenitiesNA && (
                  <div className="space-y-1">
                    {(fields.amenities || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                        <input
                          type="text"
                          className={`${inputCls} text-xs py-0.5`}
                          value={it.cost}
                          onChange={(e) => handleSubScheduleChange('amenities', idx, sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Misc Items */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-slate-800">5.3 Miscellaneous Items</h5>
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fields.isMiscNA}
                      onChange={(e) => handleChange('isMiscNA', e.target.checked)}
                      disabled={isReadOnly}
                    />
                    Not Applicable
                  </label>
                </div>
                {!fields.isMiscNA && (
                  <div className="space-y-1">
                    {(fields.miscItems || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                        <input
                          type="text"
                          className={`${inputCls} text-xs py-0.5`}
                          value={it.cost}
                          onChange={(e) => handleSubScheduleChange('miscItems', idx, sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Services Items */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-xs text-slate-800">5.4 Services Items</h5>
                  <label className="text-xs flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={fields.isServicesNA}
                      onChange={(e) => handleChange('isServicesNA', e.target.checked)}
                      disabled={isReadOnly}
                    />
                    Not Applicable
                  </label>
                </div>
                {!fields.isServicesNA && (
                  <div className="space-y-1">
                    {(fields.servicesItems || []).map((it, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-xs text-slate-600 w-44 truncate">{it.name}</span>
                        <input
                          type="text"
                          className={`${inputCls} text-xs py-0.5`}
                          value={it.cost}
                          onChange={(e) => handleSubScheduleChange('servicesItems', idx, sanitizePositiveFloat(e.target.value))}
                          disabled={isReadOnly}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 6.0 Total Abstract Matrix */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 pt-3">
              <h4 className="font-semibold text-slate-800 text-sm">6.0. Total Abstract Matrix (Land + Building + Sub-Schedules)</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <Field label="Total Govt. Benchmark Value:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.abstractGovtSay || fields.abstractGovtTotal || ''}
                    disabled
                  />
                </Field>
                <Field label="Total Market Value:">
                  <input
                    type="text"
                    className={`${inputCls} font-bold text-slate-900`}
                    value={fields.abstractMarketSay || fields.abstractMarketTotal || ''}
                    disabled
                  />
                </Field>
                <Field label="Total Realisable Value (95%):">
                  <input
                    type="text"
                    className={`${inputCls} font-semibold`}
                    value={fields.abstractRealSay || fields.abstractRealTotal || ''}
                    disabled
                  />
                </Field>
                <Field label="Total Distress Sale Value (85%):">
                  <input
                    type="text"
                    className={`${inputCls} font-semibold`}
                    value={fields.abstractDistressSay || fields.abstractDistressTotal || ''}
                    disabled
                  />
                </Field>
              </div>
            </div>
          </div>
        </Section>

        {/* 13. REMARKS & CERTIFICATE OF VALUATION / OPINION */}
        <Section number={13} id="sec-remarks-opinion" title="IV. General Remarks & Certificate of Valuation / Valuer Opinion">
          <div className="space-y-4">
            <Field label="General Remarks & Condition of the Property / Remarks:">
              <textarea
                rows={3}
                className={inputCls}
                value={fields.valuationRemarksBox || ''}
                onChange={(e) => handleChange('valuationRemarksBox', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Basis of Valuation Statement:">
              <input
                type="text"
                className={inputCls}
                value={fields.basisOfValuationStatement || ''}
                onChange={(e) => handleChange('basisOfValuationStatement', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Fair Market Value (in words):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.fairMarketValueWords || ''}
                  onChange={(e) => handleChange('fairMarketValueWords', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Realisable Value (in words):">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.realisableValueWords || ''}
                  onChange={(e) => handleChange('realisableValueWords', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </div>
        </Section>

        {/* 14. DECLARATION & VALUER CREDENTIALS */}
        <Section number={14} id="sec-declaration" title="V. Declaration & Valuer Credentials">
          <div className="space-y-6">
            {/* Valuer Credentials & Sign-Off */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">Valuer Credentials & Sign-Off Block</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <Field label="Empanelled Valuer Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.empanelledValuerName || ''}
                    onChange={(e) => handleChange('empanelledValuerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Site Engineer Name:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.siteEngineerName || ''}
                    onChange={(e) => handleChange('siteEngineerName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Valuer Qualifications:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerQualifications || ''}
                    onChange={(e) => handleChange('valuerQualifications', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="IOV Reg No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerIovRegNo || ''}
                    onChange={(e) => handleChange('valuerIovRegNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Wealth Tax Reg No:">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.valuerWealthTaxRegNo || ''}
                    onChange={(e) => handleChange('valuerWealthTaxRegNo', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label="Declaration Date:">
                  <BaseDateInput
                    value={fields.declarationDate || ''}
                    onChange={(val) => handleChange('declarationDate', val)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Total Report Pages Count with Lock Toggle */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-700">
                      Total Report Pages (in Declaration Point O):
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!fields.reportPagesCountLocked}
                        onChange={(e) => {
                          const auto = e.target.checked;
                          setFields(prev => ({
                            ...prev,
                            reportPagesCountLocked: !auto,
                            reportPagesCount: auto ? dynamicTotalPages : prev.reportPagesCount,
                          }));
                        }}
                        disabled={isReadOnly}
                      />
                      <span>Auto calculate ({dynamicTotalPages} pages)</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    className={`${inputCls} mt-1`}
                    value={fields.reportPagesCount || ''}
                    onChange={(e) => handleChange('reportPagesCount', sanitizePositiveInt(e.target.value, 3))}
                    disabled={isReadOnly || !fields.reportPagesCountLocked}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* 15. VALUATION CHECKLIST */}
        <Section number={15} id="sec-checklist" title="VI. Valuation Report Check-List (10 Points)">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
              <h4 className="font-semibold text-slate-800 text-sm">Valuation Report Check-List (10 Points)</h4>
              <div className="space-y-2">
                {(fields.checklist || []).map((ci, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white border border-slate-200 rounded">
                    <span className="text-xs text-slate-700 pr-4">{ci.pointNo}. {ci.question}</span>
                    <select
                      className="text-xs border border-slate-300 rounded px-2 py-1 font-semibold"
                      value={ci.answer}
                      onChange={(e) => handleChecklistChange(idx, e.target.value as any)}
                      disabled={isReadOnly}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="NA">NA</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* 16. Documents */}
        <BaseDocumentsSection
          title="VII. Documents"
          sectionId="sec-documents"
          sectionNumber={16}
          documentImages={fields.documentImages || []}
          documentImageNames={fields.documentImageNames || []}
          isReadOnly={isReadOnly}
          uploading={saving}
          onUploadDocument={handleDocumentUpload}
          onRemoveDocument={handleDocumentRemove}
          onDocumentNameChange={handleDocumentRename}
          onReorderDocuments={handleDocumentReorder}
          defaultOpen={true}
        />

        {/* 17. Maps */}
        <BaseMapsSection
          title="VIII. Maps & Cadastral Plans"
          sectionId="sec-maps"
          sectionNumber={17}
          locationMapImages={fields.locationMapImages || (fields.locationMapImageUrl ? [fields.locationMapImageUrl] : [])}
          mouzaMapImages={fields.mouzaMapImages || (fields.rorImageUrl ? [fields.rorImageUrl] : [])}
          sketchMapImages={fields.sketchMapImages || (fields.guidelineValueImageUrl ? [fields.guidelineValueImageUrl] : [])}
          cadastralMapImages={fields.cadastralMapImages || (fields.bhuNakshaImageUrl ? [fields.bhuNakshaImageUrl] : [])}
          bdaMapImages={fields.bdaMapImages || []}
          latitude={fields.latitude || ''}
          longitude={fields.longitude || ''}
          technicalAddress={fields.detailedAddressWithPin || ''}
          propertyAddress={fields.propAt || ''}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Section 5 (Point U. Latitude / Longitude Coordinates)"
          isReadOnly={isReadOnly}
          uploading={saving}
          onLatitudeChange={(val) => {
            const lng = fields.longitude || '';
            const combined = val && lng ? `${val}° N, ${lng}° E` : val;
            setFields((prev) => ({
              ...prev,
              latitude: val,
              latitudeLongitude: combined,
            }));
          }}
          onLongitudeChange={(val) => {
            const lat = fields.latitude || '';
            const combined = lat && val ? `${lat}° N, ${val}° E` : val;
            setFields((prev) => ({
              ...prev,
              longitude: val,
              latitudeLongitude: combined,
            }));
          }}
          onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={(idx) => handleMapRemove('locationMapImages', idx)}
          onReorderLocationMap={(imgs) => handleMapReorder('locationMapImages', imgs)}
          onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={(idx) => handleMapRemove('mouzaMapImages', idx)}
          onReorderMouzaMap={(imgs) => handleMapReorder('mouzaMapImages', imgs)}
          onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={(idx) => handleMapRemove('sketchMapImages', idx)}
          onReorderSketchMap={(imgs) => handleMapReorder('sketchMapImages', imgs)}
          onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
          onCadastralMapRemove={(idx) => handleMapRemove('cadastralMapImages', idx)}
          onReorderCadastralMap={(imgs) => handleMapReorder('cadastralMapImages', imgs)}
          onBdaMapUpload={(e) => handleMapUpload('bdaMapImages', e)}
          onBdaMapRemove={(idx) => handleMapRemove('bdaMapImages', idx)}
          onReorderBdaMap={(imgs) => handleMapReorder('bdaMapImages', imgs)}
          defaultOpen={true}
        />

        {/* 18. Property Photographs */}
        <BasePhotographsSection
          title="IX. Property Photographs"
          sectionNumber={18}
          sectionId="sec-photos"
          propertyImages={propertyImages}
          propertyImageNames={propertyImageNames}
          isReadOnly={isReadOnly}
          uploading={saving}
          bucketCount={bucketImages?.length || 0}
          onOpenBucketPicker={() => setShowBucketModal(true)}
          onUploadImages={handleUploadMultiplePhotos}
          onRemoveImage={handlePhotoRemove}
          onImageNameChange={handlePhotoRename}
          onReorderImages={handlePhotoReorder}
          defaultOpen={true}
        />

        {/* STANDARDIZED ACTION BAR (DOCKED AT BOTTOM OF MAIN CONTENT) */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={saving || submitting}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmit}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>

      {/* Floating Section Navigator on the Right Side */}
      <FloatingNavigator sections={NAV_SECTIONS} />

      {/* Cloud Bucket Selection Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            const addedNames = selectedUrls.map((_, i) => `Photograph ${propertyImages.length + i + 1}`);
            const mergedImgs = [...propertyImages, ...selectedUrls];
            const mergedNames = [...propertyImageNames, ...addedNames];
            const mergedPhotos = mergedImgs.map((url, idx) => ({
              url,
              caption: mergedNames[idx] || `Photograph ${idx + 1}`,
            }));
            setFields((prev) => ({
              ...prev,
              propertyPhotos: mergedPhotos,
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
