/**
 * bank-fields.ts — Shared field interfaces and configuration types
 * for the Bank/FIS Report Builder system.
 *
 * BaseReportFields contains the ~50 core fields shared by all bank reports
 * (extracted from GeneralReportBuilder's ReportFields interface).
 *
 * BankConfig is the delta configuration interface — each bank defines
 * only what differs from the GeneralReportBuilder defaults.
 */

import type { ReactNode } from 'react';

// ─── Floor Row (shared across all bank builders) ────────────────────
export interface FloorRow {
  id: string;
  name: string;
  area: string;
  rate: string;
  yearBuilt: string;
  lifeYears: string;
  ageYears: string;
  depreciationPct: string;
}

// ─── Annexure Item (shared) ──────────────────────────────────────────
export interface AnnexureItem {
  id: string;
  label: string;
  title?: string;
  excelFileUrl: string;
  excelFileName: string;
  parsedData?: {
    headers: string[];
    rows: string[][];
    allRows?: string[][];
    merges?: { sr: number; sc: number; er: number; ec: number }[];
    colWidths?: number[];
  };
}

// ─── Base Report Fields (identical to GeneralReportBuilder's ReportFields) ──
export interface BaseReportFields {
  // Section 1 – General Details
  propertyType: string;
  ownerName: string;
  ownerAddress: string;
  city: string;
  pincode: string;
  landmark: string;
  loanApplicationType?: string;
  loanApplicationNo: string;
  documentHolderName: string;
  legalAddress: string;
  legalState: string;
  legalPincode: string;
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
  railwayStationName: string;
  busStopName: string;
  hospitalName: string;
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

  // Section 7 – Floor-wise Area & Building Valuation
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
  representativeFatherName: string;

  // Photos & Maps
  propertyImages: string[];
  propertyImageNames: string[];
  sketchMapImages: string[];
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
  clientType?: string;
  organisationTemplate?: string;
  organisationSubTemplate?: string;
  institutionCategory?: string;
  serviceType?: string;
  subjectType?: string;
  valuationLayout?: 'land_building' | 'apartment';

  // Annexure
  annexureEnabled: boolean;
  annexureRef: string;
  annexureRefShowAlso: boolean;
  legalAnnexureEnabled: boolean;
  legalAnnexureRef: string;
  legalAnnexureRefShowAlso: boolean;
  annexures: AnnexureItem[];

  // Allow bank-specific extra fields
  [key: string]: any;
}

// ─── Extra Field Config ──────────────────────────────────────────────
export interface ExtraFieldConfig {
  /** Unique field key — stored in the report JSON data */
  key: string;
  /** Display label in the form */
  label: string;
  /** Field type (defaults to 'text') */
  type?: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'yesno';
  /** Options for select-type fields */
  options?: string[];
  /** Default value */
  default?: string;
  /** Make the field read-only */
  readOnly?: boolean;
  /** Span 2 columns in the grid */
  span?: 1 | 2;
  /** Inline positioning hint: render this field in a 2-col inline pair */
  inline?: 'left' | 'right';
}

// ─── Section Config ──────────────────────────────────────────────────
export interface SectionConfig {
  /** Unique section ID */
  id: string;
  /** Display title in the section header */
  title: string;
  /** Section number displayed in the accordion badge */
  number?: number | string;
  /** Whether the section is initially open */
  defaultOpen?: boolean;
  /** Render function for the section contents */
  render: (
    fields: BaseReportFields,
    handleChange: (key: string, value: any) => void,
    isReadOnly: boolean,
  ) => ReactNode;
}

// ─── Validation Rule ─────────────────────────────────────────────────
export interface ValidationRule {
  /** Field key to validate */
  field: string;
  /** Error message to show */
  message: string;
  /** Validation type */
  type: 'required' | 'minLength' | 'pattern';
  /** Value for minLength or pattern */
  value?: number | string;
}

// ─── Bank Config (Delta from General) ────────────────────────────────
/**
 * BankConfig defines ONLY what differs from the default GeneralReportBuilder.
 * Omit any property to use General defaults.
 */
export interface BankConfig {
  // ── Identity (always required) ──
  /** Bank name key — matches organisationTemplate value (e.g. 'ADITYA BIRLA CAPITAL LTD') */
  bankId: string;
  /** Sub-template key — matches organisationSubTemplate value (e.g. 'STSL') */
  subTemplateId: string;
  /** Human-readable display name (e.g. 'Aditya Birla Capital – STSL') */
  displayName: string;

  // ── Form Delta (all optional) ──
  /** Section IDs to hide entirely (e.g. ['section-8'] to remove Land Valuation) */
  hiddenSections?: string[];
  /** Base field keys to hide from the form (e.g. ['loanApplicationNo', 'documentHolderName']) */
  hiddenFields?: string[];
  /** Label overrides: base field key → new label text */
  fieldLabels?: Record<string, string>;
  /** Default value overrides merged into the base defaults */
  defaultValues?: Partial<BaseReportFields>;
  /** Extra fields injected into existing sections: sectionId → field configs */
  extraFields?: Record<string, ExtraFieldConfig[]>;
  /** Entirely new sections added to the form */
  extraSections?: SectionConfig[];
  /** Bank-specific validation rules added on top of base validation */
  validationRules?: ValidationRule[];

  // ── PDF Delta (optional) ──
  /** Factory function returning a bank-specific PDF renderer.
   *  If omitted, the default PDFGeneralRenderer is used. */
  getPDFRenderer?: () => any; // Returns a PDFBankRenderer or PDFGeneralRenderer
}
