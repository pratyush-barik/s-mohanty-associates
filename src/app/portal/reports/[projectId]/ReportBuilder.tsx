'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  city: string;
  pincode: string;
  landmark: string;
  loanApplicationNo: string;
  documentHolderName: string;
  legalAddress: string;
  dateOfInspection: string;
  dateOfValuation: string;
  refNo: string;
  bankName: string;
  branchName: string;
  to: string;
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
  ageOfPropertyActual: string;
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
  propertyImageNames: string[];
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
  reworkNotes?: string;
  clientType?: string;
  organisationTemplate?: string;
  serviceType?: string;
  subjectType?: string;
}

const DEFAULT_FIELDS: ReportFields = {
  propertyType: 'Residential',
  ownerName: '',
  ownerAddress: '',
  city: '',
  pincode: '',
  landmark: '',
  loanApplicationNo: '',
  documentHolderName: '',
  legalAddress: '',
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
  deviations: '',

  realizablePct: '90',
  distressPct: '80',
  guidelineValue: '',

  demarcation: 'Clear',
  possession: 'With Owner',
  remarks: '',
  representativeName: '',

  propertyImages: [],
  propertyImageNames: [],
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
  state: '',
  developmentStatus: 'Developed',
  civicAmenities: [],
  civicAmenitiesOther: '',
  distanceMainRoad: '',
  distanceMainRoadUnit: 'Meters',
  distanceRailway: '',
  distanceRailwayUnit: 'Km',
  nearbyLandmarks: '',
  clientType: '',
  organisationTemplate: '',
  serviceType: '',
  subjectType: '',
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

const SERVICES_LIST = [
  {
    id: 'mortgage_loan',
    title: 'Mortgage & Loan Security Valuation',
    icon: '🏦',
    desc: 'Home Loan, LAP, Commercial, Working Capital',
    subjects: [
      'Home Loan Valuation',
      'Loan Against Property (LAP)',
      'Commercial Property Valuation',
      'Industrial Property Valuation',
      'Construction Finance Valuation',
      'Project Finance Valuation',
      'Working Capital Security Valuation',
      'Loan Renewal & Enhancement Valuation'
    ]
  },
  {
    id: 'banking_services',
    title: 'Banking & Financial Institution Services',
    icon: '💼',
    desc: 'Primary Security, Collateral Security, Periodic Revaluation',
    subjects: [
      'Primary Security Valuation',
      'Collateral Security Valuation',
      'Periodic Revaluation',
      'Security Monitoring',
      'Consortium Lending Valuation'
    ]
  },
  {
    id: 'sarfaesi_recovery',
    title: 'SARFAESI & Recovery Valuation',
    icon: '⚖️',
    desc: 'Distress Value, Forced Sale Value, Auction Valuation',
    subjects: [
      'Reserve Price Determination',
      'Distress Value',
      'Forced Sale Value',
      'Realizable Value',
      'Auction Valuation',
      'Recovery & Enforcement Valuation'
    ]
  },
  {
    id: 'land_valuation',
    title: 'Land Valuation',
    icon: '🌍',
    desc: 'Residential, Commercial, Industrial, Agricultural Land',
    subjects: [
      'Residential Land',
      'Commercial Land',
      'Industrial Land',
      'Agricultural Land',
      'Institutional Land',
      'Development Land',
      'Freehold & Leasehold Land',
      'Government Leasehold Properties'
    ]
  },
  {
    id: 'building_valuation',
    title: 'Building Valuation',
    icon: '🏢',
    desc: 'Apartments, Villas, Commercial Buildings, Warehouses',
    subjects: [
      'Residential Buildings',
      'Apartments',
      'Villas',
      'Commercial Buildings',
      'Office Spaces',
      'Shopping Complexes',
      'Warehouses',
      'Industrial Buildings',
      'Hotels',
      'Hospitals',
      'Schools',
      'Colleges',
      'Institutional Buildings'
    ]
  },
  {
    id: 'project_construction',
    title: 'Project & Construction Consultancy',
    icon: '🏗️',
    desc: 'Inspection, Progress Certification, Fund Utilization',
    subjects: [
      'Construction Stage Inspection',
      'Progress Certification',
      'Cost-to-Complete Assessment',
      'Construction Cost Estimation',
      'Fund Utilization Verification',
      'Technical Monitoring'
    ]
  },
  {
    id: 'corporate_assets',
    title: 'Corporate & Fixed Asset Valuation',
    icon: '🏭',
    desc: 'Fixed Assets, Fair Market Value, Replacement Cost',
    subjects: [
      'Fixed Asset Valuation',
      'Fair Market Value (FMV)',
      'Replacement Cost'
    ]
  },
  {
    id: 'ibc_insolvency',
    title: 'IBC & Insolvency Valuation Support',
    icon: '📉',
    desc: 'Fair Value, Liquidation Value, RP Assistance',
    subjects: [
      'Fair Value',
      'Liquidation Value',
      'Resolution Professional Assistance'
    ]
  },
  {
    id: 'development_investment',
    title: 'Development & Investment Advisory',
    icon: '📈',
    desc: 'HBU Analysis, Feasibility Studies, Investment Advisory',
    subjects: [
      'Highest & Best Use (HBU) Analysis',
      'Residual Land Valuation',
      'Development Feasibility',
      'Joint Development Valuation',
      'Investment Advisory',
      'Marketability Assessment'
    ]
  },
  {
    id: 'government_statutory',
    title: 'Government & Statutory Valuation',
    icon: '🏛️',
    desc: 'Acquisition, Municipal Asset, Infrastructure',
    subjects: [
      'Land Acquisition',
      'Compensation Assessment',
      'Municipal & Government Asset Valuation',
      'Public Infrastructure Valuation',
      'Property Tax Assessment Support'
    ]
  },
  {
    id: 'specialized_property',
    title: 'Specialized Property Valuation',
    icon: '⚡',
    desc: 'Petrol Pumps, Cold Storages, Rice Mills, Resorts',
    subjects: [
      'Petrol Pumps',
      'Cold Storages',
      'Rice Mills',
      'Resorts',
      'Data Centres',
      'Renewable Energy Projects',
      'Mixed-Use Developments',
      'Heritage Properties'
    ]
  },
  {
    id: 'market_research',
    title: 'Market Research & Advisory',
    icon: '📊',
    desc: 'Rental Assessment, Market Trend Analysis, Circle Rate Study',
    subjects: [
      'Comparable Market Analysis',
      'Rental Assessment',
      'Market Trend Analysis',
      'Demand–Supply Analysis',
      'Circle Rate Study',
      'Feasibility Studies'
    ]
  },
  {
    id: 'customized_valuation',
    title: 'Customized Valuation & Advisory',
    icon: '🤝',
    desc: 'Tailor-made Reports, Due Diligence, Expert Opinion',
    subjects: [
      'Tailor-made Valuation Reports',
      'Investor Due Diligence',
      'Asset Acquisition Advisory',
      'Technical Audit Support',
      'Independent Expert Opinion'
    ]
  }
];

// ─── Main Component ────────────────────────────────────────────────
interface ReportBuilderProps {
  projectId: string;
  projectCode: string;
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

export default function ReportBuilder({ projectId, projectCode, initialFields, status, userRole = 'REPORT_EMPLOYEE', prefill }: ReportBuilderProps) {
  const merged = {
    ...DEFAULT_FIELDS,
    ...(initialFields || {}),
    refNo: initialFields?.refNo || projectCode || DEFAULT_FIELDS.refNo,
    to: initialFields?.to || DEFAULT_FIELDS.to,
    city: initialFields?.city || DEFAULT_FIELDS.city,
    pincode: initialFields?.pincode || DEFAULT_FIELDS.pincode,
    serviceType: initialFields?.serviceType || DEFAULT_FIELDS.serviceType,
    subjectType: initialFields?.subjectType || DEFAULT_FIELDS.subjectType,
    ownerName: initialFields?.ownerName || prefill?.contactName || DEFAULT_FIELDS.ownerName,
    ownerAddress: initialFields?.ownerAddress || prefill?.propertyAddress || DEFAULT_FIELDS.ownerAddress,
    propertyImages: Array.isArray(initialFields?.propertyImages) ? initialFields.propertyImages : (typeof initialFields?.propertyImages === 'string' && initialFields.propertyImages ? [initialFields.propertyImages] : DEFAULT_FIELDS.propertyImages),
    propertyImageNames: Array.isArray(initialFields?.propertyImageNames) ? initialFields.propertyImageNames : DEFAULT_FIELDS.propertyImageNames,
    civicAmenities: Array.isArray(initialFields?.civicAmenities) ? initialFields.civicAmenities : DEFAULT_FIELDS.civicAmenities,
    ageOfPropertyActual: typeof initialFields?.ageOfPropertyActual === 'string' ? initialFields.ageOfPropertyActual : DEFAULT_FIELDS.ageOfPropertyActual,
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

  // Additional Amenities Checkbox States
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

  const reportRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [selectingOrg, setSelectingOrg] = useState(false);
  const [wizardStep, setWizardStep] = useState<'client_type' | 'service' | 'subject'>(
    !merged.clientType ? 'client_type' : !merged.serviceType ? 'service' : 'subject'
  );

  const handleSelectClientType = (type: 'individual' | 'organisation') => {
    if (type === 'individual') {
      setFields(prev => ({ ...prev, clientType: 'individual', organisationTemplate: '' }));
    } else {
      setSelectingOrg(true);
    }
  };

  const handleSelectOrganisation = (num: string) => {
    setFields(prev => ({
      ...prev,
      clientType: 'organisation',
      organisationTemplate: num
    }));
    setSelectingOrg(false);
  };

  const handleSelectService = (service: string) => {
    setFields(prev => ({ ...prev, serviceType: service }));
    setWizardStep('subject');
  };

  const handleSelectSubject = (subject: string) => {
    setFields(prev => ({ ...prev, subjectType: subject }));
  };

  const getSelectedAmenities = () => {
    const valStr = fields.additionalAmenities || '';
    if (typeof valStr !== 'string' || !valStr || valStr === 'Not Applicable' || valStr === 'N/A') return [];
    return valStr.split(', ').map(s => s.trim()).filter(Boolean);
  };

  const handleAmenityCheckboxChange = (amenity: string, checked: boolean) => {
    const selected = getSelectedAmenities();
    let next = selected.filter(item => item !== 'Not Applicable');
    if (checked) {
      if (!next.includes(amenity)) next.push(amenity);
    } else {
      next = next.filter(item => item !== amenity);
    }
    // Append otherText if other is checked and has text
    if (isOtherChecked && otherText.trim()) {
      // Remove previous other values first to avoid duplication
      next = next.filter(item => PREDEFINED_AMENITIES.includes(item));
      next.push(otherText.trim());
    }
    handleChange('additionalAmenities', next.length > 0 ? next.join(', ') : 'Not Applicable');
  };

  const handleOtherCheckboxChange = (checked: boolean) => {
    setIsOtherChecked(checked);
    if (!checked) {
      setOtherText('');
      const selected = getSelectedAmenities();
      const next = selected.filter(item => PREDEFINED_AMENITIES.includes(item));
      handleChange('additionalAmenities', next.length > 0 ? next.join(', ') : 'Not Applicable');
    }
  };

  const handleOtherTextChange = (text: string) => {
    setOtherText(text);
    const selected = getSelectedAmenities();
    const next = selected.filter(item => PREDEFINED_AMENITIES.includes(item));
    if (text.trim()) {
      next.push(text.trim());
    }
    handleChange('additionalAmenities', next.length > 0 ? next.join(', ') : 'Not Applicable');
  };

  const handleResetWizard = () => {
    if (confirm('Are you sure you want to change report parameters? (This will not clear your typed text, but will change the PDF template layout category)')) {
      setFields(prev => ({
        ...prev,
        clientType: '',
        organisationTemplate: '',
        serviceType: '',
        subjectType: ''
      }));
      setWizardStep('client_type');
    }
  };

  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const isManagerOrOwner = userRole === 'MANAGER' || userRole === 'OWNER';

  const handleChange = useCallback((field: keyof ReportFields, value: any) => {
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
    if (fields.propertyImageNames) {
      handleChange('propertyImageNames', fields.propertyImageNames.filter((_, i) => i !== index));
    }
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
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');
      const loadImage = (src: string): Promise<HTMLImageElement> => new Promise((resolve, reject) => {
        const img = new Image(); img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img); img.onerror = (e) => reject(e); img.src = src;
      });
      const letterheadImg = await loadImage('/templates/letterhead.png');

      // US Letter @96dpi dimensions
      const PAGE_W = 816, PAGE_H = 1056;
      const PAD_T = 112, PAD_B = 107, PAD_LR = 72;
      const CONTENT_W = PAGE_W - PAD_LR * 2; // 672px
      const MAX_H = PAGE_H - PAD_T - PAD_B;  // 837px usable

      // Generate all content blocks
      const blocks = generatePDFBlocks();

      // ── Measure each block in a hidden container ──
      const measurer = document.createElement('div');
      measurer.style.cssText = `position:fixed;left:-9999px;top:0;width:${CONTENT_W}px;font-family:'Times New Roman',serif;color:#000;line-height:1.3;visibility:hidden;`;
      document.body.appendChild(measurer);

      const blockHeights: number[] = [];
      for (const block of blocks) {
        const el = document.createElement('div');
        el.innerHTML = block;
        measurer.appendChild(el);
        blockHeights.push(el.offsetHeight);
        measurer.removeChild(el);
      }
      document.body.removeChild(measurer);

      // ── Distribute blocks into pages (no overflow past footer) ──
      const pages: string[][] = [[]];
      let currentH = 0;

      for (let i = 0; i < blocks.length; i++) {
        const h = blockHeights[i];
        // If adding this block would overflow AND current page has content, start new page
        if (currentH + h > MAX_H && pages[pages.length - 1].length > 0) {
          pages.push([]);
          currentH = 0;
        }
        pages[pages.length - 1].push(blocks[i]);
        currentH += h;
      }

      // ── Render each page ──
      const pdf = new jsPDF('p', 'in', 'letter');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) pdf.addPage();
        pdf.addImage(letterheadImg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

        const container = document.createElement('div');
        container.style.cssText = `position:fixed;left:-9999px;top:0;width:${PAGE_W}px;height:${PAGE_H}px;background:transparent;padding:${PAD_T}px ${PAD_LR}px ${PAD_B}px ${PAD_LR}px;box-sizing:border-box;font-family:'Times New Roman',serif;color:#000;overflow:hidden;`;
        container.innerHTML = `<div style="line-height:1.3;">${pages[i].join('')}</div>`;
        document.body.appendChild(container);

        const canvas = await html2canvas(container, {
          scale: 2, useCORS: true, logging: false, backgroundColor: null,
          width: PAGE_W, height: PAGE_H, windowWidth: PAGE_W, windowHeight: PAGE_H,
        });
        document.body.removeChild(container);
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      }
      return pdf.output('blob');
    } catch (err) { console.error('PDF generation failed:', err); return null; }
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

    const blob = await handleGeneratePDF();
    if (blob && previewWindow) {
      const url = URL.createObjectURL(blob);
      previewWindow.location.href = url;
    } else if (previewWindow) {
      previewWindow.close();
      setMessage({ type: 'error', text: 'Failed to generate PDF preview.' });
    }
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
    if (!Array.isArray(fields.propertyImages) || fields.propertyImages.length < 2) {
      setMessage({ type: 'error', text: 'Please upload at least 2 property photographs before finalizing.' });
      return;
    }
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

  // ── PDF Content Blocks (dynamically paginated) ──
  function generatePDFBlocks(): string[] {
    const ff = "'Times New Roman', serif";
    const ts = `width:100%;border-collapse:collapse;font-family:${ff};`;
    const cellBorder = '1px solid #000';
    const cellPad = '2.5px 8px 6.5px 8px';
    const lblBg = 'rgba(219, 230, 240, 0.45)';
    const optLblBg = 'rgba(221, 233, 246, 0.45)';

    // ── Row helpers ──
    // Simple inline row: full-width "Label: - Value"
    const simpleRow = (label: string, val: string) => {
      return `<tr><td colspan="3" style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">${label}: - <b>${val || 'N/A'}</b></td></tr>`;
    };

    // Option row: 3 columns — Label | Options list | Selected value
    const optionRow = (label: string, opts: string[], val: string) => {
      const n = opts.length;
      const innerDivs = opts.map((o, i) =>
        `<div style="border-bottom:${i === n - 1 ? 'none' : '1px solid #000'};padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;background:${optLblBg};word-break:break-word;word-wrap:break-word;overflow:visible;">${o}</div>`
      ).join('');
      return `<tr>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;background:${lblBg};line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="28%">${label}</td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="35%">${innerDivs}</td>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;text-align:center;background:${optLblBg};line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="37%">${val || 'N/A'}</td>
      </tr>`;
    };

    // Age option row: 3 columns — Label | Options list (selected range is bolded) | Actual age value
    const ageOptionRow = (label: string, opts: string[], selectedOpt: string, actualVal: string) => {
      const n = opts.length;
      const innerDivs = opts.map((o, i) => {
        const isSelected = o === selectedOpt;
        const fontStyle = isSelected ? 'font-weight:bold;' : '';
        return `<div style="border-bottom:${i === n - 1 ? 'none' : '1px solid #000'};padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;background:${optLblBg};word-break:break-word;word-wrap:break-word;overflow:visible;${fontStyle}">${o}</div>`;
      }).join('');
      return `<tr>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;background:${lblBg};line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="28%">${label}</td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="35%">${innerDivs}</td>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;text-align:center;background:${optLblBg};line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="37%">${actualVal || 'N/A'}</td>
      </tr>`;
    };

    // Section header row
    const sectionHeader = (title: string) => {
      return `<tr><td colspan="3" style="border:${cellBorder};padding:4px 8px 8px 8px;font-family:${ff};font-size:16pt;font-weight:bold;background:${lblBg};vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">${title}</td></tr>`;
    };

    // Wrap rows in a table
    const wrapTable = (rows: string) => `<table style="${ts};margin-bottom:10px;">${rows}</table>`;

    // ═══════════════════════════════════════════════════════════════════
    // Build content blocks — each block is an independently measurable chunk
    // ═══════════════════════════════════════════════════════════════════
    const allBlocks: string[] = [];

    const serviceObj = SERVICES_LIST.find(s => s.id === fields.serviceType) || { title: 'Valuation' };
    const serviceName = serviceObj.title.toUpperCase();
    const subjectName = fields.subjectType ? fields.subjectType.toUpperCase() : 'RESIDENTIAL';

    let titleText = '• &nbsp;STANDARD VALUATION REPORT FORMAT';
    if (fields.clientType === 'organisation') {
      titleText = `• &nbsp;${subjectName} ${serviceName} REPORT FOR INSTITUTION ${fields.organisationTemplate}`;
    } else {
      titleText = `• &nbsp;${subjectName} ${serviceName} REPORT`;
    }

    // ── BLOCK: "To" block + Title (always page 1 start) ──
    allBlocks.push(`<div style="font-family:${ff};font-size:12pt;margin-bottom:10px;line-height:1.6;">
      <p style="margin:0;"><b>To</b></p>
      <p style="margin:0;"><b>${fields.to || '________'}</b></p>
      <p style="margin:0;">Date of valuation report: -<b>${fields.dateOfValuation || '________'}</b></p>
      <p style="margin:0;">Ref: -<b>${fields.refNo || '________'}</b></p>
    </div>
    <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin:6px 0 12px;">${titleText}</p>`);

    // ── BLOCK: General Details ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('GENERAL DETAILS')}
      ${optionRow('Type of property', ['Residential', 'Commercial', 'Residential cum Commercial', 'Industrial', 'Vacant Plot'], fields.propertyType)}
      ${simpleRow('Name of the Customer(s)', `"${fields.ownerName || 'N/A'}"`)}
      ${simpleRow('Property Address', getFullAddress())}
      ${simpleRow('Landmark', fields.landmark || '')}
      ${simpleRow('Loan Application number', fields.loanApplicationNo)}
      ${simpleRow('Name of Document holder', fields.documentHolderName || fields.ownerName)}
      ${simpleRow('Date of Inspection', fields.dateOfInspection)}
      ${simpleRow('Date of Valuation Report', fields.dateOfValuation)}
      ${simpleRow('Purpose', fields.purpose)}
    `));

    // ── BLOCK: Surrounding Locality Details ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('SURROUNDING LOCALITY DETAILS')}
      ${simpleRow('Ward No / Municipal Land No', fields.wardNo)}
      ${optionRow('Vicinity', ['Slum', 'Residential', 'Commercial', 'Mixed', 'Industrial'], fields.vicinity)}
      ${optionRow('Locality Type', ['Elite/Posh/High Class', 'Upper Middle Class', 'Middle Class', 'Lower Middle Class'], fields.classOfLocality)}
      ${optionRow('Approach Road Width', ['>=60 Feet Road', '60-40 Feet Road', '40-20 Feet Road', '<20 Feet Road'], fields.approachRoadWidth)}
      ${optionRow('Plot Demarcated at Site', ['Yes', 'No'], fields.plotDemarcated)}
      <tr>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;background:${lblBg};line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="28%">Proximity to Civic Amenities</td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="35%">
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Railway Station</div>
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Bus Stop</div>
          <div style="padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Hospital</div>
        </td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="37%">
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">1. ${fields.landmarkRailway || fields.distanceRailwayStation || 'N/A'}</div>
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">2. ${fields.landmarkBusStop || fields.distanceBusStop || 'N/A'}</div>
          <div style="padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">3. ${fields.landmarkHospital || fields.distanceHospital || 'N/A'}</div>
        </td>
      </tr>
      ${optionRow('Property Identification', ['Easy to Identify', 'Identification by documents', 'Additional documents required', 'Difficult to identify'], fields.propertyIdentification)}
      ${optionRow('Proximity to Facilities', ['<1 Km', '1-3 Kms', '3-5 Kms', '>5 Kms'], fields.proximityToFacilities)}
      <tr>
        <td style="border:${cellBorder};padding:${cellPad};font-family:${ff};font-size:12pt;vertical-align:middle;font-weight:bold;background:${lblBg};line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;" width="28%">Landmark Details</td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="35%">
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Railway Station</div>
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Bus Stop</div>
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Hospital</div>
          <div style="padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">Nearest Landmark</div>
        </td>
        <td style="border:${cellBorder};padding:0;font-family:${ff};font-size:12pt;vertical-align:top;background:${optLblBg};" width="37%">
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">1. ${fields.landmarkRailway || 'N/A'}</div>
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">2. ${fields.landmarkBusStop || 'N/A'}</div>
          <div style="border-bottom:1px solid #000;padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">3. ${fields.landmarkHospital || 'N/A'}</div>
          <div style="padding:2.5px 8px 6.5px 8px;font-family:${ff};font-size:12pt;line-height:1.35em;box-sizing:border-box;word-break:break-word;word-wrap:break-word;overflow:visible;">4. ${fields.landmarkNearest || fields.landmark || 'N/A'}</div>
        </td>
      </tr>
    `));

    // ── BLOCK: Property Details ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('PROPERTY DETAILS')}
      ${simpleRow('Type of Usage of Entire Property', fields.usageType)}
      ${simpleRow('Additional Amenities', fields.additionalAmenities || 'N/A')}
      ${optionRow('Legal Status of Property', ['Freehold', 'Lease hold >30 yrs.', 'Lease hold 15-30 yrs.', 'Lease hold <15 yrs.'], fields.legalStatus)}
    `));

    // ── BLOCK: Subject Property Details ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('SUBJECT PROPERTY DETAILS')}
      ${simpleRow('Type of Premises', fields.premisesType)}
      ${simpleRow('Occupied by / Vacant', fields.occupiedBy)}
      ${simpleRow('Is Property Rented', fields.isPropertyRented)}
      ${simpleRow('If Rented, List of Occupants', fields.rentedOccupants)}
      ${optionRow('Property Taxation / Maintenance', ['Low', 'Average', 'High', 'Very High'], fields.propertyTaxation)}
      ${simpleRow('Boundary (As per Sketch Map)', `N: ${fields.boundaryNorth || '-'} &nbsp;|&nbsp; E: ${fields.boundaryEast || '-'} &nbsp;|&nbsp; S: ${fields.boundarySouth || '-'} &nbsp;|&nbsp; W: ${fields.boundaryWest || '-'}`)}
      ${simpleRow('Boundary (At Site)', `N: ${fields.buildingBoundaryNorth || '-'} &nbsp;|&nbsp; E: ${fields.buildingBoundaryEast || '-'} &nbsp;|&nbsp; S: ${fields.buildingBoundarySouth || '-'} &nbsp;|&nbsp; W: ${fields.buildingBoundaryWest || '-'}`)}
    `));

    // ── BLOCK: Structural Details ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('STRUCTURAL DETAILS')}
      ${optionRow('Type of Structure', ['RCC', 'Load Bearing', 'Steel Structure', 'Composite Structure', 'Industrial Shed', 'A/C Sheet', 'G/I Sheet', 'Asbestos Roofing'], fields.structureType)}
      ${simpleRow('No. of Floors', fields.numberOfFloors)}
      ${simpleRow('No. of Wings', fields.numberOfWings)}
      ${simpleRow('No. of Units on Each Floor', fields.unitsPerFloor)}
      ${simpleRow('Internal Composition', fields.internalComposition)}
      ${simpleRow('No. of Lifts', fields.numberOfLifts)}
      ${ageOptionRow('Age of Property', ['1-10 years', '11-25 years', '26-50 years', '>50 years'], fields.ageOfProperty, fields.ageOfPropertyActual)}
      ${simpleRow('Estimated Future Life', fields.estimatedFutureLife)}
      ${simpleRow('Exteriors', fields.exteriors)}
      ${optionRow('Quality of Construction', ['Very Good', 'Good', 'Average', 'Poor'], fields.qualityOfConstruction)}
      ${simpleRow('Common Areas Remarks', fields.commonAreasRemarks)}
      ${simpleRow('Other Observations', fields.otherObservations)}
      ${simpleRow('Flooring &amp; Finishing', fields.flooringType)}
      ${simpleRow('Roofing &amp; Terracing', fields.roofType)}
      ${simpleRow('Quality of Fixtures', fields.qualityOfFixtures)}
    `));

    // ── BLOCK: Plan Approvals ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('PLAN APPROVALS')}
      ${optionRow('Construction as per Approved Plans', ['Yes', 'No'], fields.constructionApproved)}
      ${simpleRow('Details of Approved Plan', fields.approvalDetails)}
      ${simpleRow('Construction Permission No. &amp; Date', fields.constructionPermission || 'Not mentioned')}
      ${simpleRow('Violations / Risk of Demolition', fields.violationsObserved)}
      ${simpleRow('Conforms to Local Byelaws', fields.conformsToByelaws)}
      ${simpleRow('Other Documents Verified', fields.documentsVerified)}
    `));

    // ── BLOCK: Land Valuation ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('VALUATION \u2014 Land')}
      ${simpleRow('Land Area', `${fields.landArea || '0'} ${fields.landAreaUnit}`)}
      ${simpleRow('Current Govt. Approved Rates for Land', `Rs.${fields.govtLandRate || fields.guidelineValue || 'N/A'}/- Per ${fields.landAreaUnit}`)}
      ${simpleRow('Recommended Rate &amp; Basis', `Rs.${fields.landRatePerUnit || 'N/A'}/- Per ${fields.landAreaUnit} ${fields.recommendedRateBasis ? '(' + fields.recommendedRateBasis + ')' : ''}`)}
      ${simpleRow('Land Value', `${fields.landArea || '0'} ${fields.landAreaUnit} \u00D7 Rs.${fields.landRatePerUnit || '0'}/- = Rs.${formatIndianCurrency(landValue)}/-`)}
      ${simpleRow('Actual BUA of Premises', `${formatIndianCurrency(totalPlinthArea)} ${fields.floorAreaUnit || 'Sqft'}`)}
      ${fields.buaAsPerApprovals ? simpleRow('BUA as per Approvals', fields.buaAsPerApprovals) : ''}
    `));

    // ── BLOCK: Building Valuation ──
    const floorRowsHTML = floorValuations.map((f, idx) => {
      const bg = idx % 2 === 0 ? '#FFF' : '#F5F5F5';
      return `<tr style="background:${bg};">
        <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">${f.name}</td>
        <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;text-align:right;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">${formatIndianCurrency(f.area)}</td>
        <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;text-align:right;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">\u20B9${formatIndianCurrency(f.rate)}</td>
        <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;text-align:right;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">\u20B9${formatIndianCurrency(f.estimated)}</td>
        <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;text-align:center;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">${f.lifeYears}</td>
        <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;text-align:center;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">${f.ageYears}</td>
        <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;text-align:center;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">${f.depPct}%</td>
        <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;text-align:right;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">\u20B9${formatIndianCurrency(f.netValue)}</td>
      </tr>`;
    }).join('');

    allBlocks.push(`
      <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin:8px 0 6px;">VALUATION OF BUILDING (After Depreciation)</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:10px;font-family:${ff};font-size:11pt;">
        <tr style="background:#000;">
          <th style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;color:#FFF;font-weight:bold;text-align:center;font-family:${ff};vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">Floor</th>
          <th style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;color:#FFF;font-weight:bold;text-align:right;font-family:${ff};vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">Area</th>
          <th style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;color:#FFF;font-weight:bold;text-align:right;font-family:${ff};vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">Rate (\u20B9)</th>
          <th style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;color:#FFF;font-weight:bold;text-align:right;font-family:${ff};vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">Estimated (\u20B9)</th>
          <th style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;color:#FFF;font-weight:bold;text-align:center;font-family:${ff};vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">Life</th>
          <th style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;color:#FFF;font-weight:bold;text-align:center;font-family:${ff};vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">Age</th>
          <th style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;color:#FFF;font-weight:bold;text-align:center;font-family:${ff};vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">Dep%</th>
          <th style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;color:#FFF;font-weight:bold;text-align:right;font-family:${ff};vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;">Net Value (\u20B9)</th>
        </tr>
        ${floorRowsHTML}
        <tr style="font-weight:bold;">
          <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;" colspan="7"><b>Total Building Value</b></td>
          <td style="border:${cellBorder};padding:0.5px 6px 4.5px 6px;font-family:${ff};font-size:11pt;text-align:right;vertical-align:middle;line-height:1.35em;word-break:break-word;word-wrap:break-word;overflow:visible;"><b>\u20B9${formatIndianCurrency(totalBuildingValue)}</b></td>
        </tr>
      </table>
    `);

    // ── BLOCK: Abstract of Valuation ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('ABSTRACT OF VALUATION')}
      ${simpleRow('Market Value (Land + Building)', `Rs.${formatIndianCurrency(totalPropertyValue)}/- (${rupeesInWords(totalPropertyValue)})`)}
      ${simpleRow(`Realizable Value (${fields.realizablePct || '90'}%)`, `Rs.${formatIndianCurrency(realizableValue)}/-`)}
      ${simpleRow(`Forced Sale / Distress Value (${fields.distressPct || '80'}%)`, `Rs.${formatIndianCurrency(distressValue)}/- (${rupeesInWords(distressValue)})`)}
      ${optionRow('Marketability', ['Excellent', 'Very Good', 'Good', 'Difficult'], fields.marketability)}
      ${optionRow('Valuation Result', ['Positive', 'Negative'], fields.valuationResult)}
      ${simpleRow('Replacement Cost / Insurance Value', fields.replacementCost ? `Rs.${formatIndianCurrency(fields.replacementCost)}/-` : 'N/A')}
      ${simpleRow('Deviations in Property', fields.deviations)}
      ${fields.guidelineValue ? simpleRow('Govt./Guideline Value', `Rs.${formatIndianCurrency(fields.guidelineValue)}/-`) : ''}
    `));

    // ── BLOCK: Remarks, Demarcation & Possession ──
    allBlocks.push(wrapTable(`
      ${sectionHeader('REMARKS, DEMARCATION & POSSESSION')}
      ${simpleRow('Demarcation', fields.demarcation)}
      ${simpleRow('Possession', fields.possession)}
      ${simpleRow('Remarks / Observations', fields.remarks)}
    `));

    // ── BLOCK: Declaration ──
    allBlocks.push(`<div style="margin-top:10px;font-family:${ff};font-size:12pt;line-height:1.6;">
      <p style="font-weight:bold;font-size:14pt;margin-bottom:4px;">Declaration:</p>
      <p style="margin-bottom:3px;">I hereby declare that:</p>
      <p style="margin-bottom:3px;">\u2022 I have deputed my representative <b>${fields.representativeName ? 'Mr. ' + fields.representativeName : '______'}</b> to inspect the property on <b>${fields.dateOfInspection || '______'}</b>.</p>
      <p style="margin-bottom:3px;">\u2022 I have no direct or indirect interest in the property valued.</p>
      <p style="margin-bottom:3px;">\u2022 The information furnished is true and correct to the best of my knowledge and belief.</p>
    </div>`);

    // ── BLOCK: Valuation Certificate + Signature ──
    allBlocks.push(`
      <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin:14px 0 8px;">VALUATION CERTIFICATE</p>
      <div style="border:1.5px solid #000;padding:12px;font-family:${ff};font-size:12pt;line-height:1.6;">
        <p style="margin-top:0;">This is to certify that the undersigned has personally inspected the property belonging to
        <b>${fields.ownerName}</b> situated at <b>${getFullAddress()}</b> on
        <b>${fields.dateOfInspection}</b> and after careful examination and consideration of all relevant factors,
        the Fair Market Value of the said property is assessed as under:</p>
        <p style="padding:4px 0;margin:4px 0;"><b>Fair Market Value: \u20B9 ${formatIndianCurrency(totalPropertyValue)} (${rupeesInWords(totalPropertyValue)})</b></p>
        <p style="padding:4px 0;margin:2px 0;"><b>Realizable Value (${fields.realizablePct || '90'}%): \u20B9 ${formatIndianCurrency(realizableValue)} (${rupeesInWords(realizableValue)})</b></p>
        <p style="padding:4px 0;margin:2px 0;"><b>Distress Sale Value (${fields.distressPct || '80'}%): \u20B9 ${formatIndianCurrency(distressValue)} (${rupeesInWords(distressValue)})</b></p>
      </div>
      <div style="margin-top:28px;text-align:right;font-family:${ff};font-size:12pt;line-height:1.5;">
        <p style="margin:0;">_______________________________</p>
        <p style="font-weight:bold;margin:3px 0;font-size:14pt;">Satyajit Mohanty</p>
        <p style="margin:2px 0;font-style:italic;font-size:12pt;">B.Sc.(Engg.), M.Tech (IIT Kharagpur)</p>
        <p style="margin:2px 0;font-style:italic;font-size:12pt;">Registered Valuer \u2014 IBBI/RV/02/2019/10594</p>
        <p style="margin:2px 0;font-style:italic;font-size:12pt;">S. Mohanty &amp; Associates, Bhubaneswar</p>
      </div>
    `);

    // ── BLOCKS: Property Photographs (6 per page) ──
    if (Array.isArray(fields.propertyImages) && fields.propertyImages.length > 0) {
      const IMGS_PER_PAGE = 6;
      const totalImages = fields.propertyImages.length;
      const totalPhotoPages = Math.ceil(totalImages / IMGS_PER_PAGE);

      for (let pg = 0; pg < totalPhotoPages; pg++) {
        const startIdx = pg * IMGS_PER_PAGE;
        const pageImages = fields.propertyImages.slice(startIdx, startIdx + IMGS_PER_PAGE);
        const imgCount = pageImages.length;
        const rows = Math.ceil(imgCount / 2);
        const availableH = 680;
        const gapBetweenRows = rows > 1 ? Math.min(16, Math.floor((availableH - rows * 160) / (rows + 1))) : 20;
        const imgH = Math.min(220, Math.max(140, Math.floor((availableH - (rows + 1) * gapBetweenRows - rows * 22) / rows)));

        const title = pg === 0
          ? `<p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin-bottom:${gapBetweenRows}px;">PROPERTY PHOTOGRAPHS</p>`
          : `<p style="font-family:${ff};font-size:12pt;font-weight:bold;text-align:center;margin-bottom:${gapBetweenRows}px;font-style:italic;">Property Photographs (Contd.)</p>`;

        let gridHTML = '';
        for (let r = 0; r < rows; r++) {
          const img1 = pageImages[r * 2];
          const img2 = pageImages[r * 2 + 1];
          const gIdx1 = startIdx + r * 2;
          const gIdx2 = startIdx + r * 2 + 1;
          const name1 = fields.propertyImageNames?.[gIdx1] || '';
          const name2 = fields.propertyImageNames?.[gIdx2] || '';
          const caption1 = name1 ? `Figure ${gIdx1 + 1}: ${name1}` : `Figure ${gIdx1 + 1}`;
          const caption2 = name2 ? `Figure ${gIdx2 + 1}: ${name2}` : `Figure ${gIdx2 + 1}`;

          gridHTML += `<tr>`;
          gridHTML += `<td style="width:50%;padding:${r === 0 ? 0 : gapBetweenRows}px 4px 0 0;vertical-align:top;"><div style="border:1px solid #000;padding:4px;text-align:center;"><img src="${img1}" style="width:100%;height:${imgH}px;object-fit:cover;" crossOrigin="anonymous" /><p style="font-family:${ff};font-size:10pt;margin:4px 0 0;font-style:italic;">${caption1}</p></div></td>`;
          if (img2) {
            gridHTML += `<td style="width:50%;padding:${r === 0 ? 0 : gapBetweenRows}px 0 0 4px;vertical-align:top;"><div style="border:1px solid #000;padding:4px;text-align:center;"><img src="${img2}" style="width:100%;height:${imgH}px;object-fit:cover;" crossOrigin="anonymous" /><p style="font-family:${ff};font-size:10pt;margin:4px 0 0;font-style:italic;">${caption2}</p></div></td>`;
          } else {
            gridHTML += `<td style="width:50%;padding:0;"></td>`;
          }
          gridHTML += `</tr>`;
        }

        allBlocks.push(`<div style="font-family:${ff};color:#000;">
          ${title}
          <table style="width:100%;border-collapse:collapse;">${gridHTML}</table>
        </div>`);
      }
    }

    // ── BLOCK: Sketch Map ──
    if (fields.sketchMapImage) {
      const sketchFigNum = (Array.isArray(fields.propertyImages) ? fields.propertyImages.length : 0) + 1;
      allBlocks.push(`<div style="font-family:${ff};color:#000;">
        <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin-bottom:12px;">SKETCH MAP</p>
        <div style="text-align:center;border:1px solid #000;padding:6px;">
          <img src="${fields.sketchMapImage}" style="max-width:100%;max-height:680px;" crossOrigin="anonymous" />
          <p style="font-family:${ff};font-size:12pt;font-style:italic;margin-top:6px;">Figure ${sketchFigNum}: Revenue Sketch Map</p>
        </div>
        <p style="font-family:${ff};font-size:12pt;font-style:italic;text-align:center;margin-top:4px;">Source: Site Visit dated ${fields.dateOfInspection || 'N/A'}</p>
      </div>`);
    }

    // ── BLOCK: Location Map ──
    if (fields.locationMapImage) {
      const locFigNum = (Array.isArray(fields.propertyImages) ? fields.propertyImages.length : 0) + (fields.sketchMapImage ? 1 : 0) + 1;
      allBlocks.push(`<div style="font-family:${ff};color:#000;">
        <p style="font-family:${ff};font-size:14pt;font-weight:bold;text-align:center;margin-bottom:12px;">LOCATION MAP</p>
        <div style="text-align:center;border:1px solid #000;padding:6px;">
          <img src="${fields.locationMapImage}" style="max-width:100%;max-height:630px;" crossOrigin="anonymous" />
          <p style="font-family:${ff};font-size:12pt;font-style:italic;margin-top:6px;">Figure ${locFigNum}: Location Map</p>
        </div>
        ${fields.latitude || fields.longitude ? `<p style="text-align:center;font-family:${ff};font-size:12pt;margin-top:6px;font-weight:bold;">Lat: ${fields.latitude || 'N/A'}, Long: ${fields.longitude || 'N/A'}</p>` : ''}
        <p style="font-family:${ff};font-size:12pt;font-style:italic;text-align:center;margin-top:2px;">Source: Site Visit dated ${fields.dateOfInspection || 'N/A'}</p>
      </div>`);
    }

    return allBlocks;
  }

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════
  if (!fields.clientType || !fields.serviceType || !fields.subjectType) {
    const activeStep = !fields.clientType ? 'client_type' : !fields.serviceType ? 'service' : 'subject';
    
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-gradient-to-br from-[#f8f9fa] to-[#e9ecef] p-8 rounded-2xl border border-neutral-200">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0f2038] tracking-tight">
              Draft New Valuation Report
            </h2>
            <p className="text-[#6c757d] mt-2 text-base">
              Set up the report parameters for Project <span className="font-mono font-bold text-[#b8860b]">{projectCode}</span>
            </p>
            {/* Step Indicators */}
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className={`w-2.5 h-2.5 rounded-full ${activeStep === 'client_type' ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}`}></span>
              <span className={`w-8 h-[2px] ${fields.clientType ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full ${activeStep === 'service' ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}`}></span>
              <span className={`w-8 h-[2px] ${fields.serviceType ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}`}></span>
              <span className={`w-2.5 h-2.5 rounded-full ${activeStep === 'subject' ? 'bg-[#b8860b]' : 'bg-[#dee2e6]'}`}></span>
            </div>
          </div>

          {activeStep === 'client_type' && (
            <>
              {!selectingOrg ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Individual Card */}
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectClientType('individual');
                      setWizardStep('service');
                    }}
                    className="flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent hover:border-[#b8860b] shadow-lg hover:shadow-xl transition-all duration-300 group text-center w-full"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#fcf8ee] flex items-center justify-center mb-5 text-[#b8860b] group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#0f2038] mb-2">Individual Client</h3>
                    <p className="text-sm text-[#6c757d]">
                      Generate a standard valuation report formatted for individual owners and standard purposes.
                    </p>
                  </button>

                  {/* Organisation Card */}
                  <button
                    type="button"
                    onClick={() => handleSelectClientType('organisation')}
                    className="flex flex-col items-center p-8 bg-white rounded-2xl border-2 border-transparent hover:border-[#b8860b] shadow-lg hover:shadow-xl transition-all duration-300 group text-center w-full"
                  >
                    <div className="w-16 h-16 rounded-full bg-[#e8f0f8] flex items-center justify-center mb-5 text-[#0f2038] group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#0f2038] mb-2">Organisation / Bank</h3>
                    <p className="text-sm text-[#6c757d]">
                      Select an institutional layout mapped to specific banking and credit organisation requirements.
                    </p>
                  </button>
                </div>
              ) : (
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#e9ecef] space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-[#e9ecef]">
                    <h3 className="text-lg font-bold text-[#0f2038]">Select Institution Template</h3>
                    <button
                      type="button"
                      onClick={() => setSelectingOrg(false)}
                      className="text-sm text-[#b8860b] hover:text-[#8a6507] font-medium"
                    >
                      ← Back
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {Array.from({ length: 10 }).map((_, idx) => {
                      const num = String(idx + 1);
                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            handleSelectOrganisation(num);
                            setWizardStep('service');
                          }}
                          className="p-4 rounded-xl border border-[#dee2e6] hover:border-[#b8860b] hover:bg-[#fffbf0] text-center font-bold text-lg text-[#0f2038] hover:text-[#b8860b] transition-all duration-200"
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {activeStep === 'service' && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#e9ecef] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e9ecef]">
                <h3 className="text-lg font-bold text-[#0f2038]">Select Valuation Service</h3>
                <button
                  type="button"
                  onClick={() => {
                    setFields(prev => ({ ...prev, clientType: '', organisationTemplate: '' }));
                    setWizardStep('client_type');
                  }}
                  className="text-sm text-[#b8860b] hover:text-[#8a6507] font-medium"
                >
                  ← Back
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto p-3 border border-[#dee2e6] rounded-xl bg-neutral-50/50">
                {SERVICES_LIST.map((srv) => {
                  const isSelected = fields.serviceType === srv.id;
                  return (
                    <button
                      key={srv.id}
                      type="button"
                      onClick={() => handleSelectService(srv.id)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-start gap-3 w-full
                        ${isSelected 
                          ? 'border-[#b8860b] bg-[#fffbf0] shadow-sm' 
                          : 'border-[#dee2e6] bg-white hover:border-[#b8860b] hover:bg-[#fffbf0]/40'}`}
                    >
                      <div className="text-2xl shrink-0 p-1.5 bg-neutral-100/50 rounded-lg">
                        {srv.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-[#0f2038] truncate">{srv.title}</h4>
                        <p className="text-[10px] text-[#6c757d] line-clamp-2 mt-0.5">{srv.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeStep === 'subject' && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-[#e9ecef] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#e9ecef]">
                <h3 className="text-lg font-bold text-[#0f2038]">Select Report Subject</h3>
                <button
                  type="button"
                  onClick={() => {
                    setFields(prev => ({ ...prev, serviceType: '' }));
                    setWizardStep('service');
                  }}
                  className="text-sm text-[#b8860b] hover:text-[#8a6507] font-medium"
                >
                  ← Back
                </button>
              </div>

              {(() => {
                const serviceObj = SERVICES_LIST.find(s => s.id === fields.serviceType);
                const subjects = serviceObj?.subjects || ['Residential', 'Commercial', 'Industrial'];
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[360px] overflow-y-auto p-3 border border-[#dee2e6] rounded-xl bg-neutral-50/50">
                    {subjects.map((sub) => {
                      const isSelected = fields.subjectType === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => handleSelectSubject(sub)}
                          className={`p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-3 w-full
                            ${isSelected 
                              ? 'border-[#b8860b] bg-[#fffbf0] shadow-sm' 
                              : 'border-[#dee2e6] bg-white hover:border-[#b8860b] hover:bg-[#fffbf0]/40'}`}
                        >
                          <div className="w-8 h-8 rounded-full bg-neutral-100/80 text-[#0f2038] flex items-center justify-center font-bold text-xs shrink-0">
                            {sub.charAt(0)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-[#0f2038] truncate">{sub}</h4>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" ref={reportRef}>
      {/* Template Info Banner */}
      <div className="card p-4 bg-gradient-to-r from-[#f8f9fa] to-[#e9ecef] border border-[#e9ecef] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <span className="text-[10px] font-bold text-[#adb5bd] uppercase tracking-wider">Active Configuration</span>
          <div className="flex flex-wrap gap-2">
            <span className="text-xs font-bold text-[#0f2038] bg-white px-2.5 py-1 rounded-lg border border-[#dee2e6] uppercase shadow-sm flex items-center gap-1.5">
              {fields.clientType === 'organisation' ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  Org (Template {fields.organisationTemplate})
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Individual
                </>
              )}
            </span>
            <span className="text-xs font-bold text-[#0f2038] bg-white px-2.5 py-1 rounded-lg border border-[#dee2e6] uppercase shadow-sm">
              Service: {fields.serviceType === 'land_valuation' ? 'Land Valuation' : fields.serviceType === 'building_valuation' ? 'Building Structure' : 'Land & Building'}
            </span>
            <span className="text-xs font-bold text-[#0f2038] bg-white px-2.5 py-1 rounded-lg border border-[#dee2e6] uppercase shadow-sm">
              Subject: {fields.subjectType}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleResetWizard}
          className="text-xs text-[#b8860b] hover:text-[#8a6507] hover:underline font-bold transition-colors shrink-0"
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
      <Section title="General Details" number={1}>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 bg-amber-50/30 p-4 rounded-xl border border-amber-200/50 mb-2">
            <Field label="To (Recipient / Bank)" span={2}>
              <input className={inputCls} value={fields.to} onChange={e => handleChange('to', e.target.value)} disabled={isReadOnly} placeholder="e.g. HDFC BANK LTD., Bhubaneswar" />
            </Field>
            <Field label="Date of Valuation Report">
              <input type="date" className={inputCls} value={fields.dateOfValuation} onChange={e => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Ref No. (Locked)">
              <input className={inputCls} value={fields.refNo} disabled={true} readOnly={true} placeholder="Project ID" />
            </Field>
          </div>

          <Field label="Type of Property">
            <select className={selectCls} value={fields.propertyType} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly}>
              <option>Residential</option><option>Commercial</option><option>Residential cum Commercial</option><option>Industrial</option><option>Vacant Plot</option>
            </select>
          </Field>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Name of Customer(s)">
              <input className={inputCls} value={fields.ownerName} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} placeholder="Full name of property owner" />
            </Field>
            <Field label="Address Line 1" span={2}>
              <input className={inputCls} value={fields.ownerAddress} onChange={e => handleChange('ownerAddress', e.target.value)} disabled={isReadOnly} placeholder="Plot/Building No, Street/Locality" />
            </Field>
            <Field label="State">
              <input list="states-list" className={inputCls} value={fields.state || ''} onChange={e => handleChange('state', e.target.value)} disabled={isReadOnly} placeholder="Search or enter state..." />
              <datalist id="states-list">
                <option value="Andhra Pradesh" />
                <option value="Arunachal Pradesh" />
                <option value="Assam" />
                <option value="Bihar" />
                <option value="Chhattisgarh" />
                <option value="Goa" />
                <option value="Gujarat" />
                <option value="Haryana" />
                <option value="Himachal Pradesh" />
                <option value="Jharkhand" />
                <option value="Karnataka" />
                <option value="Kerala" />
                <option value="Madhya Pradesh" />
                <option value="Maharashtra" />
                <option value="Manipur" />
                <option value="Meghalaya" />
                <option value="Mizoram" />
                <option value="Nagaland" />
                <option value="Odisha" />
                <option value="Punjab" />
                <option value="Rajasthan" />
                <option value="Sikkim" />
                <option value="Tamil Nadu" />
                <option value="Telangana" />
                <option value="Tripura" />
                <option value="Uttar Pradesh" />
                <option value="Uttarakhand" />
                <option value="West Bengal" />
                <option value="Andaman and Nicobar Islands" />
                <option value="Chandigarh" />
                <option value="Dadra and Nagar Haveli and Daman and Diu" />
                <option value="Delhi" />
                <option value="Jammu and Kashmir" />
                <option value="Ladakh" />
                <option value="Lakshadweep" />
                <option value="Puducherry" />
              </datalist>
            </Field>
            <Field label="Pincode">
              <input className={inputCls} value={fields.pincode || ''} onChange={e => handleChange('pincode', e.target.value)} disabled={isReadOnly} placeholder="e.g. 751001" maxLength={6} />
            </Field>
            <Field label="Landmark">
              <input className={inputCls} value={fields.landmark || ''} onChange={e => handleChange('landmark', e.target.value)} disabled={isReadOnly} placeholder="e.g. Near Kantapada UP School" />
            </Field>
            <Field label="Loan Application Number">
              <input className={inputCls} value={fields.loanApplicationNo || ''} onChange={e => handleChange('loanApplicationNo', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Name of Document Holder">
              <input className={inputCls} value={fields.documentHolderName || ''} onChange={e => handleChange('documentHolderName', e.target.value)} disabled={isReadOnly} />
            </Field>
            <Field label="Date of Inspection">
              <input type="date" className={inputCls} value={fields.dateOfInspection} onChange={e => handleChange('dateOfInspection', e.target.value)} disabled={isReadOnly} />
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
                <option>Elite/Posh/High Class</option><option>Upper Middle Class</option><option>Middle Class</option><option>Lower Middle Class</option>
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
            <Field label="Nearest Railway Station (in Km)"><input type="number" min="0" step="any" className={inputCls} value={fields.distanceRailwayStation} onChange={e => handleChange('distanceRailwayStation', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="e.g. 2" /></Field>
            <Field label="Nearest Bus Stop (in Km)"><input type="number" min="0" step="any" className={inputCls} value={fields.distanceBusStop} onChange={e => handleChange('distanceBusStop', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="e.g. 1" /></Field>
            <Field label="Nearest Hospital (in Km)"><input type="number" min="0" step="any" className={inputCls} value={fields.distanceHospital} onChange={e => handleChange('distanceHospital', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="e.g. 3" /></Field>
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
            <Field label="Additional Amenities" span={2}>
              <div className="p-4 bg-[#f8f9fa] border border-[#dee2e6] rounded-xl space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {PREDEFINED_AMENITIES.map(amenity => {
                    const isChecked = getSelectedAmenities().includes(amenity);
                    return (
                      <label key={amenity} className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={isReadOnly}
                          onChange={(e) => handleAmenityCheckboxChange(amenity, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                        {amenity}
                      </label>
                    );
                  })}
                  
                  {/* Other Checkbox */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isOtherChecked}
                      disabled={isReadOnly}
                      onChange={(e) => handleOtherCheckboxChange(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    Other
                  </label>

                  {/* Not Applicable Checkbox */}
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={getSelectedAmenities().length === 0 || getSelectedAmenities().includes('Not Applicable')}
                      disabled={isReadOnly}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setIsOtherChecked(false);
                          setOtherText('');
                          handleChange('additionalAmenities', 'Not Applicable');
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    Not Applicable
                  </label>
                </div>

                {/* Show other text input when "Other" is checked */}
                {isOtherChecked && (
                  <div className="pt-2 border-t border-[#dee2e6] mt-2">
                    <input
                      type="text"
                      value={otherText}
                      onChange={(e) => handleOtherTextChange(e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Specify other amenities (comma separated)..."
                      className={`${inputCls} text-xs`}
                    />
                  </div>
                )}
              </div>
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
            <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-3">Boundary Details: As per Sketch Map</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="North"><input className={inputCls} value={fields.boundaryNorth} onChange={e => handleChange('boundaryNorth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="East"><input className={inputCls} value={fields.boundaryEast} onChange={e => handleChange('boundaryEast', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="South"><input className={inputCls} value={fields.boundarySouth} onChange={e => handleChange('boundarySouth', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="West"><input className={inputCls} value={fields.boundaryWest} onChange={e => handleChange('boundaryWest', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#495057] uppercase tracking-wider mb-3">Boundary Details: At Site</p>
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
            <Field label="Age of the Property (Range)">
              <select className={selectCls} value={fields.ageOfProperty} onChange={e => handleChange('ageOfProperty', e.target.value)} disabled={isReadOnly}>
                <option value="">Select...</option><option>1-10 years</option><option>11-25 years</option><option>26-50 years</option><option>{'>'}50 years</option>
              </select>
            </Field>
            <Field label="Age of the Property (Actual Value)">
              <input className={inputCls} value={fields.ageOfPropertyActual || ''} onChange={e => handleChange('ageOfPropertyActual', e.target.value)} disabled={isReadOnly} placeholder="e.g. 5 Years" />
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
                    <input type="number" min="0" step="any" className={inputCls + ' !py-1.5 text-xs text-right'} value={f.area || ''} onChange={e => updateFloor(f.id, 'area', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" step="any" className={inputCls + ' !py-1.5 text-xs text-right'} value={f.rate || ''} onChange={e => updateFloor(f.id, 'rate', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="0" />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef] text-right text-xs font-medium text-[#0f2038]">
                    &#8377;{formatIndianCurrency(f.estimated)}
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" className={inputCls + ' !py-1.5 text-xs text-center'} value={f.lifeYears || ''} onChange={e => updateFloor(f.id, 'lifeYears', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input type="number" min="0" className={inputCls + ' !py-1.5 text-xs text-center'} value={f.ageYears || ''} onChange={e => updateFloor(f.id, 'ageYears', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} />
                  </td>
                  <td className="px-2 py-1.5 border-b border-[#e9ecef]">
                    <input
                      type="number" min="0"
                      className={inputCls + ' !py-1.5 text-xs text-center font-bold text-[#b8860b]'}
                      value={f.depreciationPct !== undefined && f.depreciationPct !== null ? f.depreciationPct : ''}
                      onChange={e => updateFloor(f.id, 'depreciationPct', e.target.value)}
                      onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
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
            <Field label="Current Govt. Approved Rate (₹)">
              <input className={inputCls} value={fields.govtLandRate} onChange={e => handleChange('govtLandRate', e.target.value)} disabled={isReadOnly} placeholder="e.g. 23" />
            </Field>
            <Field label={`Recommended Rate per ${fields.landAreaUnit} (₹)`}>
              <input type="number" min="0" step="any" className={inputCls} value={fields.landRatePerUnit} onChange={e => handleChange('landRatePerUnit', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="e.g. 450" />
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
                <input type="number" min="0" className={inputCls + ' !py-1 !px-2 text-xs w-16 text-center'} value={fields.realizablePct} onChange={e => handleChange('realizablePct', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="90" />
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
                <input type="number" min="0" className={inputCls + ' !py-1 !px-2 text-xs w-16 text-center'} value={fields.distressPct} onChange={e => handleChange('distressPct', e.target.value)} onKeyDown={e => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()} disabled={isReadOnly} placeholder="80" />
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
            <strong> {getFullAddress() || '________'}</strong> on
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

      {(!isReadOnly || (Array.isArray(fields.propertyImages) && fields.propertyImages.length > 0)) && (
        <Section title="Property Photographs" number={12} defaultOpen={false}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Array.isArray(fields.propertyImages) && fields.propertyImages.map((url: string, idx: number) => (
              <div key={idx} className="flex flex-col border border-[#e9ecef] rounded-xl overflow-hidden bg-white shadow-sm">
                <div className="relative group w-full h-36">
                  <img src={url} alt={`Property ${idx + 1}`} className="w-full h-full object-cover" />
                  {!isReadOnly && (
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs shadow-md cursor-pointer"
                    >&times;</button>
                  )}
                </div>
                <div className="p-2 bg-gray-50 border-t border-[#e9ecef]">
                  <input
                    type="text"
                    placeholder={`Photo ${idx + 1} Name`}
                    value={fields.propertyImageNames?.[idx] || ''}
                    disabled={isReadOnly}
                    onChange={(e) => {
                      const newNames = [...(fields.propertyImageNames || [])];
                      while (newNames.length <= idx) {
                        newNames.push('');
                      }
                      newNames[idx] = e.target.value;
                      handleChange('propertyImageNames', newNames);
                    }}
                    className="w-full text-xs p-1.5 border border-[#dee2e6] rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                  />
                </div>
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
              <div className={`text-xs font-semibold ${
                (Array.isArray(fields.propertyImages) ? fields.propertyImages.length : 0) < 2 ? 'text-amber-600' : 'text-green-600'
              }`}>
                {Array.isArray(fields.propertyImages) ? fields.propertyImages.length : 0} / 2 minimum uploaded
                {(Array.isArray(fields.propertyImages) ? fields.propertyImages.length : 0) < 2 && ' — At least 2 photographs are required to submit.'}
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

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.text}
        </div>
      )}

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
