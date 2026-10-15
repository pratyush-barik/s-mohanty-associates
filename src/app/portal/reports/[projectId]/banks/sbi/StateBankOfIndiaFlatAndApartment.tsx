'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { BankConfig } from '@/lib/bank-fields';
import { BankReportBuilderProps } from '../../BankReportBuilder';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  ActiveConfigBanner,
  ReportActionBar,
  FloatingNavigator,
  NavItem,
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { PDFSBIRenderer } from '@/lib/banks/pdf-sbi-flat-and-apartment-renderer';

// ─── PrefillField component with Edit Toggle & Hover Tooltip ────────────────
const PrefillField = ({
  label,
  value,
  onChange,
  tooltip,
  isReadOnly,
  type = 'text',
  fallbackValue,
  options,
  customInputProps,
  hideEditToggle = false,
  rows = 3
}: any) => {
  const [isEdit, setIsEdit] = useState(false);

  React.useEffect(() => {
    if (!isEdit && fallbackValue !== undefined && value !== fallbackValue) {
      onChange(fallbackValue);
    }
  }, [isEdit, fallbackValue, value, onChange]);

  const handleToggle = () => setIsEdit(!isEdit);
  const displayValue = isEdit ? (value || '') : (fallbackValue !== undefined ? (fallbackValue || '') : (value || ''));

  const labelWithToggle = (
    <div className="flex justify-between items-center w-full">
      <div className="flex-1 flex items-center pr-4 font-semibold text-xs text-slate-700">{label}</div>
      {!hideEditToggle && (
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold uppercase ${isEdit ? 'text-emerald-700' : 'text-gray-400'}`}>
            {isEdit ? 'Edit On' : 'Edit Off'}
          </span>
          <button
            type="button"
            onClick={handleToggle}
            disabled={isReadOnly}
            className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors duration-200 focus:outline-none ${isEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${isEdit ? 'translate-x-4' : 'translate-x-1'}`} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Field label={labelWithToggle}>
      <div className="relative mt-1">
        {type === 'textarea' ? (
          <textarea
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={displayValue}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
            rows={rows}
          />
        ) : type === 'select' ? (
          <select
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={displayValue}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
          >
            {options?.map((opt: any, i: number) => <option key={i} value={opt.value}>{opt.label}</option>)}
          </select>
        ) : (
          <input
            type={type === 'number' ? 'number' : type === 'date' ? 'date' : 'text'}
            className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
            value={displayValue}
            onChange={e => onChange(e.target.value)}
            disabled={isReadOnly || !isEdit}
          />
        )}
        {!isEdit && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title={tooltip}>
            <Lock className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          </div>
        )}
      </div>
    </Field>
  );
};

export const SBI_CONFIG: BankConfig = {
  bankId: 'STATE BANK OF INDIA-SBI',
  subTemplateId: 'Flat & Apartment',
  displayName: 'State Bank of India (SBI) — Flat & Apartment',
  defaultValues: {},
  getPDFRenderer: (data: any, projectCode?: string) => {
    return new PDFSBIRenderer(data, projectCode);
  },
};

export interface SBIProps extends BankReportBuilderProps {
  initialData?: any;
  isReadOnly?: boolean;
}

export default function StateBankOfIndiaFlatAndApartment({
  projectId,
  projectCode,
  initialFields: rawInitialFields,
  initialData,
  status,
  userRole = 'field_engineer',
  isReadOnly: isReadOnlyProp = false,
  bucketImages = [],
  prefill = {},
  config,
  onResetWizard,
}: SBIProps) {
  const router = useRouter();
  const isReadOnly = isReadOnlyProp || status === 'COMPLETED';
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Initial State with Pure Project Prefill & Dual Mode Support ──
  const initialFields = useMemo(() => {
    const saved = rawInitialFields || initialData?.reportData || {};
    const pf = (prefill || {}) as any;

    return {
      // Mode: Strictly FLAT for Flat & Apartment builder
      propertyValuationType: 'FLAT',
      clientType: saved.clientType || 'organisation',
      organisationTemplate: saved.organisationTemplate || 'STATE BANK OF INDIA-SBI',
      organisationSubTemplate: saved.organisationSubTemplate || 'Flat & Apartment',
      institutionCategory: saved.institutionCategory || 'Bank & FIS',
      serviceType: saved.serviceType || pf.serviceType || 'MORTGAGE_AND_LOAN_SECURITY_VALUATION',
      subjectType: saved.subjectType || pf.subjectType || 'HOME_LOAN_VALUATION',

      // Header Address
      toAuthority: saved.toAuthority !== undefined ? saved.toAuthority : 'THE ASST. GENERAL MANAGER,',
      bankName: saved.bankName !== undefined ? saved.bankName : (pf.bankName || 'STATE BANK OF INDIA,'),
      rboOffice: saved.rboOffice !== undefined ? saved.rboOffice : 'RBO, PURI, DIST: PURI, ODISHA',
      branchAddress: saved.branchAddress !== undefined ? saved.branchAddress : '',
      districtState: saved.districtState !== undefined ? saved.districtState : 'DIST: PURI, ODISHA',

      // Metadata
      refNo: saved.refNo || saved.reportRefNo || projectCode || 'SMA/08/2026/01',
      reportDate: saved.reportDate || pf.reportDate || '06.08.2026',
      borrowerName: saved.borrowerName || pf.customerName || 'Mr. Srijit Mishra',

      // ── SECTION I. GENERAL DEFAULTS ──
      // 1. Purpose for which the valuation is made
      sbiFlatPurposeOfValuation: saved.sbiFlatPurposeOfValuation !== undefined ? saved.sbiFlatPurposeOfValuation : (saved.purposeOfValuation || pf.purposeOfValuation || 'To assess the present Market Value of the Property for Loan purpose'),
      purposeOfValuation: saved.purposeOfValuation !== undefined ? saved.purposeOfValuation : (saved.sbiFlatPurposeOfValuation || pf.purposeOfValuation || 'To assess the present Market Value of the Property for Loan purpose'),

      // 2. a) Date of inspection & 2. b) Date on which the valuation is made
      sbiFlatInspectionDate: saved.sbiFlatInspectionDate !== undefined ? saved.sbiFlatInspectionDate : (saved.inspectionDate || pf.inspectionDate || '03.08.2026'),
      inspectionDate: saved.inspectionDate || saved.sbiFlatInspectionDate || pf.inspectionDate || '03.08.2026',
      sbiFlatValuationDate: saved.sbiFlatValuationDate !== undefined ? saved.sbiFlatValuationDate : (saved.valuationDate || saved.reportDate || pf.reportDate || '06.08.2026'),
      valuationDate: saved.valuationDate || saved.sbiFlatValuationDate || pf.reportDate || '06.08.2026',

      // 3. List of documents produced for perusal [i), ii), iii)]
      sbiFlatDocumentsProduced: Array.isArray(saved.sbiFlatDocumentsProduced) && saved.sbiFlatDocumentsProduced.length > 0
        ? saved.sbiFlatDocumentsProduced
        : (Array.isArray(saved.documentsProduced) && saved.documentsProduced.length > 0 ? saved.documentsProduced : ['Sale Deed', 'Approved Building Plan', 'Record of Rights (Patta)']),
      documentsProduced: Array.isArray(saved.documentsProduced) && saved.documentsProduced.length > 0
        ? saved.documentsProduced
        : (Array.isArray(saved.sbiFlatDocumentsProduced) && saved.sbiFlatDocumentsProduced.length > 0 ? saved.sbiFlatDocumentsProduced : ['Sale Deed', 'Approved Building Plan', 'Record of Rights (Patta)']),

      // 4. Name of the Owner and his / their address (es) with Phone no.
      sbiFlatOwnerNameAndAddress: saved.sbiFlatOwnerNameAndAddress !== undefined ? saved.sbiFlatOwnerNameAndAddress : (saved.ownerNameAndAddress || (pf.propertyOwner ? `${pf.propertyOwner}, At: ${pf.propertyAddress || ''}, Ph: ${pf.customerPhone || ''}` : 'Mr. Srijit Mishra, S/o: Mr. Gopinath Mishra, Ph: 9861012345')),
      ownerNameAndAddress: saved.ownerNameAndAddress !== undefined ? saved.ownerNameAndAddress : (saved.sbiFlatOwnerNameAndAddress || (pf.propertyOwner ? `${pf.propertyOwner}, At: ${pf.propertyAddress || ''}, Ph: ${pf.customerPhone || ''}` : 'Mr. Srijit Mishra, S/o: Mr. Gopinath Mishra, Ph: 9861012345')),

      // 5. Brief description of the property
      sbiFlatPropertyDescription: saved.sbiFlatPropertyDescription !== undefined ? saved.sbiFlatPropertyDescription : (saved.propertyDescription || pf.propertyAddress || 'Residential Flat on First Floor, Block-A with car parking space.'),
      propertyDescription: saved.propertyDescription !== undefined ? saved.propertyDescription : (saved.sbiFlatPropertyDescription || pf.propertyAddress || 'Residential Flat on First Floor, Block-A with car parking space.'),

      // 6. Location of property (Plot No., Door No., T.S. No., Ward, District)
      sbiFlatPlotNo: saved.sbiFlatPlotNo !== undefined ? saved.sbiFlatPlotNo : (saved.plotNo || pf.plotNo || ''),
      plotNo: saved.plotNo !== undefined ? saved.plotNo : (saved.sbiFlatPlotNo || pf.plotNo || ''),
      sbiFlatDoorNo: saved.sbiFlatDoorNo !== undefined ? saved.sbiFlatDoorNo : (saved.doorNo || ''),
      doorNo: saved.doorNo !== undefined ? saved.doorNo : (saved.sbiFlatDoorNo || ''),
      sbiFlatTsNo: saved.sbiFlatTsNo !== undefined ? saved.sbiFlatTsNo : (saved.tsNoVillage || pf.mouza || ''),
      tsNoVillage: saved.tsNoVillage !== undefined ? saved.tsNoVillage : (saved.sbiFlatTsNo || pf.mouza || ''),
      sbiFlatWard: saved.sbiFlatWard !== undefined ? saved.sbiFlatWard : (saved.wardTaluka || ''),
      wardTaluka: saved.wardTaluka !== undefined ? saved.wardTaluka : (saved.sbiFlatWard || ''),
      sbiFlatDistrict: saved.sbiFlatDistrict !== undefined ? saved.sbiFlatDistrict : (saved.mandalDistrict || pf.district || 'Khurda, Odisha'),
      mandalDistrict: saved.mandalDistrict !== undefined ? saved.mandalDistrict : (saved.sbiFlatDistrict || pf.district || 'Khurda, Odisha'),

      // 7. Postal address of the property
      sbiFlatPostalAddress: saved.sbiFlatPostalAddress !== undefined ? saved.sbiFlatPostalAddress : (saved.postalAddress || pf.propertyAddress || ''),
      postalAddress: saved.postalAddress !== undefined ? saved.postalAddress : (saved.sbiFlatPostalAddress || pf.propertyAddress || ''),

      // 8. City / Town (Residential/Commercial/Industrial Area)
      sbiFlatCityTownType: saved.sbiFlatCityTownType !== undefined ? saved.sbiFlatCityTownType : (saved.residentialArea || 'Residential Area'),
      cityTown: saved.cityTown !== undefined ? saved.cityTown : 'City',
      residentialArea: saved.residentialArea !== undefined ? saved.residentialArea : 'Residential Area',
      commercialArea: saved.commercialArea !== undefined ? saved.commercialArea : 'Not Applicable',
      industrialArea: saved.industrialArea !== undefined ? saved.industrialArea : 'Not Applicable',

      // 9. Classification of the area (High/Middle/Poor, Urban/Semi Urban/Rural)
      sbiFlatClassOfLocality: saved.sbiFlatClassOfLocality !== undefined ? saved.sbiFlatClassOfLocality : (saved.classificationHighMiddlePoor || 'Middle Class'),
      classificationHighMiddlePoor: saved.classificationHighMiddlePoor !== undefined ? saved.classificationHighMiddlePoor : 'Middle Class',
      sbiFlatUrbanRural: saved.sbiFlatUrbanRural !== undefined ? saved.sbiFlatUrbanRural : (saved.classificationUrbanRural || 'Urban Area'),
      classificationUrbanRural: saved.classificationUrbanRural !== undefined ? saved.classificationUrbanRural : 'Urban Area',

      // 10 Coming under Corporation limit/ Village Panchayat / Municipality
      sbiFlatLocalBodyLimit: saved.sbiFlatLocalBodyLimit !== undefined ? saved.sbiFlatLocalBodyLimit : (saved.localBodyLimit || 'Bhubaneswar Municipal Corporation area limit'),
      localBodyLimit: saved.localBodyLimit !== undefined ? saved.localBodyLimit : (saved.sbiFlatLocalBodyLimit || 'Bhubaneswar Municipal Corporation area limit'),

      // 11 Whether covered under any State / Central Govt. enactments
      sbiFlatGovtEnactmentsCovered: saved.sbiFlatGovtEnactmentsCovered !== undefined ? saved.sbiFlatGovtEnactmentsCovered : (saved.govtEnactmentsCovered === 'Yes' || saved.govtEnactmentsCovered === true),
      sbiFlatGovtEnactmentsDetails: saved.sbiFlatGovtEnactmentsDetails || '',
      govtEnactmentsCovered: saved.govtEnactmentsCovered !== undefined ? saved.govtEnactmentsCovered : 'No',

      // 12 In case it is an agricultural land, any conversion to house site plots is contemplated
      sbiFlatAgriculturalConversion: saved.sbiFlatAgriculturalConversion !== undefined ? saved.sbiFlatAgriculturalConversion : (saved.agriculturalConversion || 'The Plot is already converted to Homestead'),
      agriculturalConversion: saved.agriculturalConversion !== undefined ? saved.agriculturalConversion : (saved.sbiFlatAgriculturalConversion || 'The Plot is already converted to Homestead'),

      // 13. Boundaries of the property (East, West, North, South)
      sbiFlatBoundaryEastDoc: saved.sbiFlatBoundaryEastDoc !== undefined ? saved.sbiFlatBoundaryEastDoc : (saved.boundaryEastDocument || pf.boundaryEast || 'Flat No: A-042'),
      sbiFlatBoundaryEastVerif: saved.sbiFlatBoundaryEastVerif !== undefined ? saved.sbiFlatBoundaryEastVerif : (saved.boundaryEastVerification || 'Flat No: A-042'),
      boundaryEastDocument: saved.boundaryEastDocument !== undefined ? saved.boundaryEastDocument : (pf.boundaryEast || 'Flat No: A-042'),
      boundaryEastVerification: saved.boundaryEastVerification !== undefined ? saved.boundaryEastVerification : 'Flat No: A-042',

      sbiFlatBoundaryWestDoc: saved.sbiFlatBoundaryWestDoc !== undefined ? saved.sbiFlatBoundaryWestDoc : (saved.boundaryWestDocument || pf.boundaryWest || 'Open Space'),
      sbiFlatBoundaryWestVerif: saved.sbiFlatBoundaryWestVerif !== undefined ? saved.sbiFlatBoundaryWestVerif : (saved.boundaryWestVerification || 'Open Space'),
      boundaryWestDocument: saved.boundaryWestDocument !== undefined ? saved.boundaryWestDocument : (pf.boundaryWest || 'Open Space'),
      boundaryWestVerification: saved.boundaryWestVerification !== undefined ? saved.boundaryWestVerification : 'Open Space',

      sbiFlatBoundaryNorthDoc: saved.sbiFlatBoundaryNorthDoc !== undefined ? saved.sbiFlatBoundaryNorthDoc : (saved.boundaryNorthDocument || pf.boundaryNorth || 'Green Park'),
      sbiFlatBoundaryNorthVerif: saved.sbiFlatBoundaryNorthVerif !== undefined ? saved.sbiFlatBoundaryNorthVerif : (saved.boundaryNorthVerification || 'Green Park'),
      boundaryNorthDocument: saved.boundaryNorthDocument !== undefined ? saved.boundaryNorthDocument : (pf.boundaryNorth || 'Green Park'),
      boundaryNorthVerification: saved.boundaryNorthVerification !== undefined ? saved.boundaryNorthVerification : 'Green Park',

      sbiFlatBoundarySouthDoc: saved.sbiFlatBoundarySouthDoc !== undefined ? saved.sbiFlatBoundarySouthDoc : (saved.boundarySouthDocument || pf.boundarySouth || 'Corridor / Road'),
      sbiFlatBoundarySouthVerif: saved.sbiFlatBoundarySouthVerif !== undefined ? saved.sbiFlatBoundarySouthVerif : (saved.boundarySouthVerification || 'Corridor / Road'),
      boundarySouthDocument: saved.boundarySouthDocument !== undefined ? saved.boundarySouthDocument : (pf.boundarySouth || 'Road'),
      boundarySouthVerification: saved.boundarySouthVerification !== undefined ? saved.boundarySouthVerification : 'Road',

      // 14.1 Dimensions of the site (East, West, North, South)
      sbiFlatDimEastDeed: saved.sbiFlatDimEastDeed !== undefined ? saved.sbiFlatDimEastDeed : (saved.dimensionEastDeed || 'Not Applicable (Flat)'),
      sbiFlatDimEastActual: saved.sbiFlatDimEastActual !== undefined ? saved.sbiFlatDimEastActual : (saved.dimensionEastActual || ''),
      dimensionEastDeed: saved.dimensionEastDeed !== undefined ? saved.dimensionEastDeed : 'Not Applicable (Flat)',
      dimensionEastActual: saved.dimensionEastActual !== undefined ? saved.dimensionEastActual : '',

      sbiFlatDimWestDeed: saved.sbiFlatDimWestDeed !== undefined ? saved.sbiFlatDimWestDeed : (saved.dimensionWestDeed || 'Not Applicable (Flat)'),
      sbiFlatDimWestActual: saved.sbiFlatDimWestActual !== undefined ? saved.sbiFlatDimWestActual : (saved.dimensionWestActual || ''),
      dimensionWestDeed: saved.dimensionWestDeed !== undefined ? saved.dimensionWestDeed : 'Not Applicable (Flat)',
      dimensionWestActual: saved.dimensionWestActual !== undefined ? saved.dimensionWestActual : '',

      sbiFlatDimNorthDeed: saved.sbiFlatDimNorthDeed !== undefined ? saved.sbiFlatDimNorthDeed : (saved.dimensionNorthDeed || 'Not Applicable (Flat)'),
      sbiFlatDimNorthActual: saved.sbiFlatDimNorthActual !== undefined ? saved.sbiFlatDimNorthActual : (saved.dimensionNorthActual || ''),
      dimensionNorthDeed: saved.dimensionNorthDeed !== undefined ? saved.dimensionNorthDeed : 'Not Applicable (Flat)',
      dimensionNorthActual: saved.dimensionNorthActual !== undefined ? saved.dimensionNorthActual : '',

      sbiFlatDimSouthDeed: saved.sbiFlatDimSouthDeed !== undefined ? saved.sbiFlatDimSouthDeed : (saved.dimensionSouthDeed || 'Not Applicable (Flat)'),
      sbiFlatDimSouthActual: saved.sbiFlatDimSouthActual !== undefined ? saved.sbiFlatDimSouthActual : (saved.dimensionSouthActual || ''),
      dimensionSouthDeed: saved.dimensionSouthDeed !== undefined ? saved.dimensionSouthDeed : 'Not Applicable (Flat)',
      dimensionSouthActual: saved.dimensionSouthActual !== undefined ? saved.dimensionSouthActual : '',

      // 14.2 Latitude, Longitude and Coordinates of the site
      sbiFlatLatitude: saved.sbiFlatLatitude !== undefined ? saved.sbiFlatLatitude : (saved.latitude || pf.latitude || '20.2961° N'),
      latitude: saved.latitude !== undefined ? saved.latitude : (pf.latitude || '20.2961° N'),
      sbiFlatLongitude: saved.sbiFlatLongitude !== undefined ? saved.sbiFlatLongitude : (saved.longitude || pf.longitude || '85.8245° E'),
      longitude: saved.longitude !== undefined ? saved.longitude : (pf.longitude || '85.8245° E'),
      sbiFlatCoordinates: saved.sbiFlatCoordinates !== undefined ? saved.sbiFlatCoordinates : (saved.coordinatesText || '20.2961, 85.8245'),
      coordinatesText: saved.coordinatesText !== undefined ? saved.coordinatesText : '20.2961, 85.8245',

      // 15 Extent of the site of the Project
      sbiFlatExtentOfSiteProject: saved.sbiFlatExtentOfSiteProject !== undefined ? saved.sbiFlatExtentOfSiteProject : (saved.extentOfProjectSite || 'Ac. 1.250 Dec (54450 Sq.ft)'),
      extentOfProjectSite: saved.extentOfProjectSite !== undefined ? saved.extentOfProjectSite : 'Ac. 1.250 Dec (54450 Sq.ft)',

      // 16 Extent of the site considered for valuation
      sbiFlatExtentOfSiteValuation: saved.sbiFlatExtentOfSiteValuation !== undefined ? saved.sbiFlatExtentOfSiteValuation : (saved.extentConsideredValuation || 'Super Built-up Area: 1250 Sq.ft (UDS: 350 Sq.ft)'),
      extentConsideredValuation: saved.extentConsideredValuation !== undefined ? saved.extentConsideredValuation : 'Super Built-up Area: 1250 Sq.ft (UDS: 350 Sq.ft)',

      // 17 Whether occupied by the owner / tenant?
      sbiFlatOccupancyStatus: saved.sbiFlatOccupancyStatus !== undefined ? saved.sbiFlatOccupancyStatus : (saved.occupancyStatusOwnerTenant || 'Self Occupied by Owner'),
      occupancyStatusOwnerTenant: saved.occupancyStatusOwnerTenant !== undefined ? saved.occupancyStatusOwnerTenant : 'Self Occupied by Owner',

      // 18 Date of issue and validity of layout of approved map / plan
      sbiFlatApprovedPlanDateValidity: saved.sbiFlatApprovedPlanDateValidity !== undefined ? saved.sbiFlatApprovedPlanDateValidity : (saved.approvedPlanValidity || 'Validity: 3 Yrs from the approval'),
      approvedPlanValidity: saved.approvedPlanValidity !== undefined ? saved.approvedPlanValidity : 'Validity: 3 Yrs from the approval',

      // 19 Approved map / plan issuing authority
      sbiFlatApprovedPlanAuthority: saved.sbiFlatApprovedPlanAuthority !== undefined ? saved.sbiFlatApprovedPlanAuthority : (saved.approvedPlanAuthority || 'Plan has been approved by BDA'),
      approvedPlanAuthority: saved.approvedPlanAuthority !== undefined ? saved.approvedPlanAuthority : 'Plan has been approved by BDA',

      // 20 Whether genuineness or authenticity of approved map / plan is verified
      sbiFlatPlanAuthenticityVerified: saved.sbiFlatPlanAuthenticityVerified !== undefined ? saved.sbiFlatPlanAuthenticityVerified : true,
      approvedPlanAuthenticity: saved.approvedPlanAuthenticity !== undefined ? saved.approvedPlanAuthenticity : 'Yes, Verified from the authenticated authority',

      // 21 Any other comments by our empanelled valuers on authentic of approved plan
      sbiFlatValuerCommentsOnPlan: saved.sbiFlatValuerCommentsOnPlan !== undefined ? saved.sbiFlatValuerCommentsOnPlan : (saved.valuerCommentsOnPlan || 'The building construction is in conformity with the approved plan and statutory setback norms.'),
      valuerCommentsOnPlan: saved.valuerCommentsOnPlan !== undefined ? saved.valuerCommentsOnPlan : 'The building construction is in conformity with the approved plan and statutory setback norms.',

      // ── FLAT SPECIFIC DEFAULTS & SECTION II. APARTMENT BUILDING ──
      natureOfApartment: saved.natureOfApartment !== undefined ? saved.natureOfApartment : 'Residential Apartment',
      aptLocationTsNo: saved.aptLocationTsNo !== undefined ? saved.aptLocationTsNo : 'NA',
      aptLocationBlockNo: saved.aptLocationBlockNo !== undefined ? saved.aptLocationBlockNo : 'Tower-A',
      aptLocationWardNo: saved.aptLocationWardNo !== undefined ? saved.aptLocationWardNo : 'Not Applicable',
      aptLocationVillageCorp: saved.aptLocationVillageCorp !== undefined ? saved.aptLocationVillageCorp : 'Within Municipal Corporation area limit',
      aptLocationDoorRoadPin: saved.aptLocationDoorRoadPin !== undefined ? saved.aptLocationDoorRoadPin : 'NA',
      localityDescription: saved.localityDescription !== undefined ? saved.localityDescription : 'Residential',
      yearOfConstruction: saved.yearOfConstruction !== undefined ? saved.yearOfConstruction : '2010',
      numberOfFloors: saved.numberOfFloors !== undefined ? saved.numberOfFloors : '16',
      typeOfStructure: saved.typeOfStructure !== undefined ? saved.typeOfStructure : 'RCC Frame Structure',
      dwellingUnitsCount: saved.dwellingUnitsCount !== undefined ? saved.dwellingUnitsCount : '64',
      qualityOfConstruction: saved.qualityOfConstruction !== undefined ? saved.qualityOfConstruction : 'Good',
      appearanceOfBuilding: saved.appearanceOfBuilding !== undefined ? saved.appearanceOfBuilding : 'Good',
      maintenanceOfBuilding: saved.maintenanceOfBuilding !== undefined ? saved.maintenanceOfBuilding : 'Good',
      facilityLift: saved.facilityLift !== undefined ? saved.facilityLift : 'Yes',
      facilityWaterSupply: saved.facilityWaterSupply !== undefined ? saved.facilityWaterSupply : 'Yes',
      facilitySewerage: saved.facilitySewerage !== undefined ? saved.facilitySewerage : 'Yes',
      facilityCarParking: saved.facilityCarParking !== undefined ? saved.facilityCarParking : 'Covered parking',
      facilityCompoundWall: saved.facilityCompoundWall !== undefined ? saved.facilityCompoundWall : 'Yes',
      facilityPavement: saved.facilityPavement !== undefined ? saved.facilityPavement : 'Yes',
      hasLift: saved.hasLift !== undefined ? saved.hasLift : true,
      hasWaterSupply: saved.hasWaterSupply !== undefined ? saved.hasWaterSupply : true,
      hasSewerage: saved.hasSewerage !== undefined ? saved.hasSewerage : true,
      hasCarParking: saved.hasCarParking !== undefined ? saved.hasCarParking : true,
      hasCompoundWall: saved.hasCompoundWall !== undefined ? saved.hasCompoundWall : true,
      hasPavement: saved.hasPavement !== undefined ? saved.hasPavement : true,

      sbiFlatNatureOfApartment: saved.sbiFlatNatureOfApartment !== undefined ? saved.sbiFlatNatureOfApartment : (saved.natureOfApartment || 'Residential Apartment'),
      sbiFlatLocalityDescription: saved.sbiFlatLocalityDescription !== undefined ? saved.sbiFlatLocalityDescription : (saved.localityDescription || 'Residential'),
      sbiFlatYearOfConstruction: saved.sbiFlatYearOfConstruction !== undefined ? saved.sbiFlatYearOfConstruction : (saved.yearOfConstruction || '2010'),
      sbiFlatNumberOfFloors: saved.sbiFlatNumberOfFloors !== undefined ? saved.sbiFlatNumberOfFloors : (saved.numberOfFloors || '16'),
      sbiFlatTypeOfStructure: saved.sbiFlatTypeOfStructure !== undefined ? saved.sbiFlatTypeOfStructure : (saved.typeOfStructure || 'RCC Frame Structure'),
      sbiFlatDwellingUnitsCount: saved.sbiFlatDwellingUnitsCount !== undefined ? saved.sbiFlatDwellingUnitsCount : (saved.dwellingUnitsCount || '64'),
      sbiFlatQualityOfConstruction: saved.sbiFlatQualityOfConstruction !== undefined ? saved.sbiFlatQualityOfConstruction : (saved.qualityOfConstruction || 'Good'),
      sbiFlatAppearanceOfBuilding: saved.sbiFlatAppearanceOfBuilding !== undefined ? saved.sbiFlatAppearanceOfBuilding : (saved.appearanceOfBuilding || 'Good'),
      sbiFlatMaintenanceOfBuilding: saved.sbiFlatMaintenanceOfBuilding !== undefined ? saved.sbiFlatMaintenanceOfBuilding : (saved.maintenanceOfBuilding || 'Good'),

      flatFloorNumber: saved.flatFloorNumber !== undefined ? saved.flatFloorNumber : '4th Floor',
      flatDoorNumber: saved.flatDoorNumber !== undefined ? saved.flatDoorNumber : 'Flat No: A-041, Tower-A',
      specRoof: saved.specRoof !== undefined ? saved.specRoof : 'RCC Roof',
      specFlooring: saved.specFlooring !== undefined ? saved.specFlooring : 'VT Flooring',
      specDoors: saved.specDoors !== undefined ? saved.specDoors : 'Hard Ply wood doors',
      specWindows: saved.specWindows !== undefined ? saved.specWindows : 'Aluminum frame with glass fitting windows',
      specFittings: saved.specFittings !== undefined ? saved.specFittings : 'Superior',
      specFinishing: saved.specFinishing !== undefined ? saved.specFinishing : 'Cement Plastering, Putty, Modular Kitchen, Roof Ceiling with Decorative Light, Cupboard, Wardrobes',

      assessmentNumber: saved.assessmentNumber !== undefined ? saved.assessmentNumber : 'Not Verified',
      taxPaidName: saved.taxPaidName !== undefined ? saved.taxPaidName : 'Not Verified',
      taxAmount: saved.taxAmount !== undefined ? saved.taxAmount : 'Not Verified',
      electricityConnectionNo: saved.electricityConnectionNo !== undefined ? saved.electricityConnectionNo : 'Not Verified',
      meterCardName: saved.meterCardName !== undefined ? saved.meterCardName : 'Not Verified',
      flatMaintenanceCondition: saved.flatMaintenanceCondition !== undefined ? saved.flatMaintenanceCondition : 'Good',
      saleDeedExecutedName: saved.saleDeedExecutedName !== undefined ? saved.saleDeedExecutedName : 'Mr. Srijit Mishra',
      undividedLandArea: saved.undividedLandArea !== undefined ? saved.undividedLandArea : 'Ac.0.012 Dec i.e. 523.00 Sft',
      superBuiltUpArea: saved.superBuiltUpArea !== undefined ? saved.superBuiltUpArea : '1375.00',
      floorSpaceIndex: saved.floorSpaceIndex !== undefined ? saved.floorSpaceIndex : 'As per approval plan',
      carpetArea: saved.carpetArea !== undefined ? saved.carpetArea : '948.00 Sft (Approx.)',
      poshClassMediumOrdinary: saved.poshClassMediumOrdinary !== undefined ? saved.poshClassMediumOrdinary : 'I Class',
      usageResidentialCommercial: saved.usageResidentialCommercial !== undefined ? saved.usageResidentialCommercial : 'Residential Purpose',
      flatOccupancyOwnerTenant: saved.flatOccupancyOwnerTenant !== undefined ? saved.flatOccupancyOwnerTenant : 'The Flat is occupied by Owner',
      monthlyRentIfRented: saved.monthlyRentIfRented !== undefined ? saved.monthlyRentIfRented : 'Not Applicable',

      // Section 3 (III. FLAT) keys
      sbiFlatFloorNumber: saved.sbiFlatFloorNumber !== undefined ? saved.sbiFlatFloorNumber : (saved.flatFloorNumber || '4th Floor'),
      sbiFlatDoorNumber: saved.sbiFlatDoorNumber !== undefined ? saved.sbiFlatDoorNumber : (saved.flatDoorNumber || 'Flat No: A-041, Tower-A'),
      sbiFlatMaintenanceCondition: saved.sbiFlatMaintenanceCondition !== undefined ? saved.sbiFlatMaintenanceCondition : (saved.flatMaintenanceCondition || 'Good'),
      sbiFlatSaleDeedExecutedName: saved.sbiFlatSaleDeedExecutedName !== undefined ? saved.sbiFlatSaleDeedExecutedName : (saved.saleDeedExecutedName || 'Mr. Srijit Mishra'),
      sbiFlatUndividedLandArea: saved.sbiFlatUndividedLandArea !== undefined ? saved.sbiFlatUndividedLandArea : (saved.undividedLandArea || 'Ac.0.012 Dec i.e. 523.00 Sft'),
      sbiFlatSuperBuiltUpArea: saved.sbiFlatSuperBuiltUpArea !== undefined ? saved.sbiFlatSuperBuiltUpArea : (saved.superBuiltUpArea || '1375.00'),
      sbiFlatFloorSpaceIndex: saved.sbiFlatFloorSpaceIndex !== undefined ? saved.sbiFlatFloorSpaceIndex : (saved.floorSpaceIndex || 'As per approval plan'),
      sbiFlatCarpetArea: saved.sbiFlatCarpetArea !== undefined ? saved.sbiFlatCarpetArea : (saved.carpetArea || '948.00 Sft (Approx.)'),
      sbiFlatPoshClassMediumOrdinary: saved.sbiFlatPoshClassMediumOrdinary !== undefined ? saved.sbiFlatPoshClassMediumOrdinary : (saved.poshClassMediumOrdinary || 'I Class'),
      sbiFlatUsageResidentialCommercial: saved.sbiFlatUsageResidentialCommercial !== undefined ? saved.sbiFlatUsageResidentialCommercial : (saved.usageResidentialCommercial || 'Residential Purpose'),
      sbiFlatOccupancyOwnerTenant: saved.sbiFlatOccupancyOwnerTenant !== undefined ? saved.sbiFlatOccupancyOwnerTenant : (saved.flatOccupancyOwnerTenant || 'The Flat is occupied by Owner'),
      sbiFlatMonthlyRentIfRented: saved.sbiFlatMonthlyRentIfRented !== undefined ? saved.sbiFlatMonthlyRentIfRented : (saved.monthlyRentIfRented || ''),

      marketabilityRating: saved.marketabilityRating !== undefined ? saved.marketabilityRating : 'Good',
      factorsFavoringPotentialValue: saved.factorsFavoringPotentialValue !== undefined ? saved.factorsFavoringPotentialValue : 'The subject property located in a developed Residential area. All civic amenities are located within 2-3 Km radius.',
      negativeFactorsObserved: saved.negativeFactorsObserved !== undefined ? saved.negativeFactorsObserved : 'Nothing Observed',
      sbiFlatMarketabilityRating: saved.sbiFlatMarketabilityRating !== undefined ? saved.sbiFlatMarketabilityRating : (saved.marketabilityRating || 'Good'),
      sbiFlatFactorsFavoringPotentialValue: saved.sbiFlatFactorsFavoringPotentialValue !== undefined ? saved.sbiFlatFactorsFavoringPotentialValue : (saved.factorsFavoringPotentialValue || 'The subject property located in a developed Residential area. All civic amenities are located within 2-3 Km radius.'),
      sbiFlatNegativeFactorsObserved: saved.sbiFlatNegativeFactorsObserved !== undefined ? saved.sbiFlatNegativeFactorsObserved : (saved.negativeFactorsObserved || 'Nothing Observed'),

      comparableSaleInstancesRate: saved.comparableSaleInstancesRate !== undefined ? saved.comparableSaleInstancesRate : 'Similar flats getting transacted in range of Rs.9800/- to Rs.10200/- Per Sft of SBA.',
      adoptedBasicCompositeRate: saved.adoptedBasicCompositeRate !== undefined ? saved.adoptedBasicCompositeRate : 'We have considered the market value as Rs.10000/- Per Sft of SBA.',
      rateBreakupBuildingServices: saved.rateBreakupBuildingServices !== undefined ? saved.rateBreakupBuildingServices : 'Rs.2500/- Per Sft',
      rateBreakupLandOthers: saved.rateBreakupLandOthers !== undefined ? saved.rateBreakupLandOthers : 'Rs.7500/- Per Sft',
      guidelineRateLandText: saved.guidelineRateLandText !== undefined ? saved.guidelineRateLandText : 'Rs.11,56,32,000/- Per Acre i.e. Rs.2655/- Per Sft | Total Value of UDS: 523.00 Sft X Rs.2655/- = Rs.13,88,565/-',
      sbiFlatComparableSaleInstancesRate: saved.sbiFlatComparableSaleInstancesRate !== undefined ? saved.sbiFlatComparableSaleInstancesRate : (saved.comparableSaleInstancesRate || 'Similar flats getting transacted in range of Rs.9800/- to Rs.10200/- Per Sft of SBA.'),
      sbiFlatAdoptedBasicCompositeRate: saved.sbiFlatAdoptedBasicCompositeRate !== undefined ? saved.sbiFlatAdoptedBasicCompositeRate : (saved.adoptedBasicCompositeRate || 'We have considered the market value as Rs.10000/- Per Sft of SBA.'),
      sbiFlatRateBreakupBuildingServices: saved.sbiFlatRateBreakupBuildingServices !== undefined ? saved.sbiFlatRateBreakupBuildingServices : (saved.rateBreakupBuildingServices || '2500'),
      sbiFlatRateBreakupLandOthers: saved.sbiFlatRateBreakupLandOthers !== undefined ? saved.sbiFlatRateBreakupLandOthers : (saved.rateBreakupLandOthers || '7500'),
      sbiFlatGuidelineRateLandText: saved.sbiFlatGuidelineRateLandText !== undefined ? saved.sbiFlatGuidelineRateLandText : (saved.guidelineRateLandText || 'Rs.11,56,32,000/- Per Acre i.e. Rs.2655/- Per Sft | Total Value of UDS: 523.00 Sft X Rs.2655/- = Rs.13,88,565/-'),

      depreciatedBuildingRateAnnualFormula: saved.depreciatedBuildingRateAnnualFormula !== undefined ? saved.depreciatedBuildingRateAnnualFormula : '1.5% Per Annum (1.5% X 10 Yrs = 15%)',
      replacementCostOfFlat: saved.replacementCostOfFlat !== undefined ? saved.replacementCostOfFlat : 'Rs.2500/- X 15% = Rs.375/- | Rs.2500.00 - Rs.375/- = Rs.2125/- Per Sft',
      buildingAge: saved.buildingAge !== undefined ? saved.buildingAge : '10',
      buildingLife: saved.buildingLife !== undefined ? saved.buildingLife : '50',
      depreciationSalvagePercentage: saved.depreciationSalvagePercentage !== undefined ? saved.depreciationSalvagePercentage : 'Age: 10 Yrs, Useful Life: 60 Yrs. Salvage Value: 10%. Considering straight-line method of depreciation.',
      depreciationRatio: saved.depreciationRatio !== undefined ? saved.depreciationRatio : '1.5% Per Annum',

      finalDepreciatedBuildingRate: saved.finalDepreciatedBuildingRate !== undefined ? saved.finalDepreciatedBuildingRate : '2125',
      finalRateLandOther: saved.finalRateLandOther !== undefined ? saved.finalRateLandOther : '7500',
      finalTotalCompositeRate: saved.finalTotalCompositeRate !== undefined ? saved.finalTotalCompositeRate : '9625',

      // Flat 10-item breakdown
      valFlatPresentValue: saved.valFlatPresentValue !== undefined ? saved.valFlatPresentValue : 'Rs. 1,32,34,375/-',
      valCarParking: saved.valCarParking !== undefined ? saved.valCarParking : '0',
      valWardrobes: saved.valWardrobes !== undefined ? saved.valWardrobes : '0',
      valModularKitchen: saved.valModularKitchen !== undefined ? saved.valModularKitchen : '0',
      valCupboard: saved.valCupboard !== undefined ? saved.valCupboard : '0',
      valInteriorDecorations: saved.valInteriorDecorations !== undefined ? saved.valInteriorDecorations : '0',
      valElectricityDeposits: saved.valElectricityDeposits !== undefined ? saved.valElectricityDeposits : '0',
      valExtraGrillCollapsible: saved.valExtraGrillCollapsible !== undefined ? saved.valExtraGrillCollapsible : '0',
      valPotentialValue: saved.valPotentialValue !== undefined ? saved.valPotentialValue : '0',
      valOthers: saved.valOthers !== undefined ? saved.valOthers : '0',
      valTotalEstimated: saved.valTotalEstimated !== undefined ? saved.valTotalEstimated : 'Rs. 1,32,34,375/-',

      // ── LAND & BUILDING SPECIFIC DEFAULTS ──
      siteClassificationLocality: saved.siteClassificationLocality || 'Developed',
      siteDevelopmentSurrounding: saved.siteDevelopmentSurrounding || 'The surrounding area has been developed with Residential cum Commercial buildings.',
      siteFloodingPossibility: saved.siteFloodingPossibility || 'No',
      siteCivicAmenities: saved.siteCivicAmenities || 'All the civic amenities are within 2-3 km radious from the site.',
      siteTopographicalLevel: saved.siteTopographicalLevel || 'Leveled and Plain',
      siteShapeOfLand: saved.siteShapeOfLand || 'Regular in Size.',
      siteTypePutUse: saved.siteTypePutUse || 'Residential Purpose',
      siteUsageRestriction: saved.siteUsageRestriction || 'Industrial',
      siteTownPlanningApproved: saved.siteTownPlanningApproved || 'No',
      siteCornerOrIntermittent: saved.siteCornerOrIntermittent || 'Intermittent Plot',
      siteRoadFacilities: saved.siteRoadFacilities || 'Yes, Available at the site',
      siteRoadTypeAvailable: saved.siteRoadTypeAvailable || 'CC Road',
      siteRoadWidth: saved.siteRoadWidth || '15 ft Wide Road',
      siteLandLocked: saved.siteLandLocked || 'No, It is free land',
      siteWaterPotentiality: saved.siteWaterPotentiality || 'Good',
      siteUndergroundSewerage: saved.siteUndergroundSewerage || 'Yes, Available at the site',
      sitePowerSupply: saved.sitePowerSupply || 'Yes, Available at the site',
      siteAdvantage: saved.siteAdvantage || 'The subject property is situated within a developed Residential cum Commercial Area. All civic amenities within 2-3 Km.',
      siteSpecialRemarksCRZ: saved.siteSpecialRemarksCRZ || 'On enquiry at site, we have not observed or inspected any public acquisition or road widening.',

      landSizeNorthSouth: saved.landSizeNorthSouth || "N: 85'-0\", S: 60'-0\"",
      landSizeEastWest: saved.landSizeEastWest || "E: 73'-0\", W: 70'-0\"",
      landTotalExtent: saved.landTotalExtent || 'Total Area: Ac.0.115 Dec i.e. 5009.00 Sft',
      landPrevailingMarketRate: saved.landPrevailingMarketRate || 'Rs.3400/- to Rs.3600/- Per Sft',
      landGuidelineRate: saved.landGuidelineRate || 'Govt. Benchmark Value: Rs.6,00,00,000/- Per Acre i.e. Rs.1377/- Per Sft',
      landAdoptedRate: saved.landAdoptedRate || 'Rs.3500/- Per Sft',
      landEstimatedMarketValue: saved.landEstimatedMarketValue || 'Rs.1,75,31,500/-',

      bldgType: saved.bldgType || 'Residential Building',
      bldgTypeConstruction: saved.bldgTypeConstruction || 'RCC Frame',
      bldgYearConstruction: saved.bldgYearConstruction || 'Year of construction- 2010\nYear of complete - 2015',
      bldgNumberFloorsHeight: saved.bldgNumberFloorsHeight || "G+3 Storied Building & Height: 10'-6\" each",
      bldgPlinthActualText: saved.bldgPlinthActualText || 'RCC Ground Floor: 4149.00 Sft, First Floor: 4149.00 Sft, Second: 4149.00 Sft, Third: 1500.00 Sft. Total: 13947.00 Sft',
      bldgConditionExterior: saved.bldgConditionExterior || 'Good',
      bldgConditionInterior: saved.bldgConditionInterior || 'Good',
      bldgApprovedPlanDateValidity: saved.bldgApprovedPlanDateValidity || 'Date of Issue: 02.09.2010, Validity: 5 Yrs',
      bldgApprovedPlanAuthority: saved.bldgApprovedPlanAuthority || 'Approved by Regional Improvement Trust',
      bldgApprovedPlanGenuineness: saved.bldgApprovedPlanGenuineness || 'No such verification done',
      bldgValuerCommentsPlan: saved.bldgValuerCommentsPlan || 'Not Applicable',
      bldgAge: saved.bldgAge || '11 Yrs',
      bldgResidualLife: saved.bldgResidualLife || '54 Yrs',

      // Land & Bldg Abstract Matrix
      abstractGovtLand: saved.abstractGovtLand || 'Rs. 68,97,393.00',
      abstractMarketLand: saved.abstractMarketLand || 'Rs. 1,75,31,500.00',
      abstractRealizableLand: saved.abstractRealizableLand || 'Rs. 1,66,54,925.00',
      abstractDistressLand: saved.abstractDistressLand || 'Rs. 1,49,01,775.00',
      abstractGovtBldg: saved.abstractGovtBldg || 'Rs. 0.00',
      abstractMarketBldg: saved.abstractMarketBldg || 'Rs. 1,27,02,792.00',
      abstractRealizableBldg: saved.abstractRealizableBldg || 'Rs. 1,20,67,652.40',
      abstractDistressBldg: saved.abstractDistressBldg || 'Rs. 1,07,97,373.20',
      abstractGovtTotal: saved.abstractGovtTotal || 'Rs. 68,97,393.00',
      abstractMarketTotal: saved.abstractMarketTotal || 'Rs. 3,02,34,292.00',
      abstractRealizableTotal: saved.abstractRealizableTotal || 'Rs. 2,87,22,577.40',
      abstractDistressTotal: saved.abstractDistressTotal || 'Rs. 2,56,99,148.20',

      // Shared Total Abstract
      abstractGovtValueLand: saved.abstractGovtValueLand !== undefined ? saved.abstractGovtValueLand : 'Rs. 13,88,565/-',
      abstractMarketValue: saved.abstractMarketValue !== undefined ? saved.abstractMarketValue : 'Rs. 1,32,34,000/-',
      abstractRealizablePct: saved.abstractRealizablePct !== undefined ? saved.abstractRealizablePct : '95',
      abstractRealizableValue: saved.abstractRealizableValue !== undefined ? saved.abstractRealizableValue : 'Rs. 1,25,73,000/-',
      abstractDistressPct: saved.abstractDistressPct !== undefined ? saved.abstractDistressPct : '85',
      abstractDistressValue: saved.abstractDistressValue !== undefined ? saved.abstractDistressValue : 'Rs. 1,12,49,000/-',
      abstractOrSayGovtLand: saved.abstractOrSayGovtLand !== undefined ? saved.abstractOrSayGovtLand : 'Rs. 13,89,000/-',
      abstractOrSayMarket: saved.abstractOrSayMarket !== undefined ? saved.abstractOrSayMarket : 'Rs. 1,32,34,000/-',
      abstractOrSayRealizable: saved.abstractOrSayRealizable !== undefined ? saved.abstractOrSayRealizable : 'Rs. 1,25,73,000/-',
      abstractOrSayDistress: saved.abstractOrSayDistress !== undefined ? saved.abstractOrSayDistress : 'Rs. 1,12,49,000/-',

      // Method of Valuation (Dual container)
      methodOfValuationProcedure: saved.methodOfValuationProcedure || 'Here, the procedure adopted for arriving at the valuation has to be highlighted. The valuer may consider various approaches of property valuation and state explicitly the reasons for adoption of a particular approach and the basis on which the final valuation judgment is arrived at. A detailed analysis and descriptive account of the approaches, assumptions made, basis adopted, supporting data (in terms of comparable sales), reconciliation of various factors, departures, final valuation arrived at has to be presented here',
      methodOfValuationText: saved.methodOfValuationText || 'Valuation of the assets under consideration is carried out on the basis of our perception about the macro & micro economic factors presently governing the real estate industry, location of property, existing market conditions, degree of development of infrastructure in the area, Demand-supply conditions, internal amenities, common amenities etc.\n\nLand & Building method of valuation has been adopted for finding the fair market value of the Property',

      // Remarks & Opinions
      remarksText: saved.remarksText !== undefined ? saved.remarksText : '',
      opinionMarketValueWords: saved.opinionMarketValueWords !== undefined ? saved.opinionMarketValueWords : '',
      opinionRealizableValueWords: saved.opinionRealizableValueWords !== undefined ? saved.opinionRealizableValueWords : '',
      opinionGovtLandValueWords: saved.opinionGovtLandValueWords !== undefined ? saved.opinionGovtLandValueWords : '',
      opinionDistressValueWords: saved.opinionDistressValueWords !== undefined ? saved.opinionDistressValueWords : '',

      valuerName: saved.valuerName !== undefined ? saved.valuerName : 'Mr. Satyajit Mohanty',
      valuerFatherName: saved.valuerFatherName !== undefined ? saved.valuerFatherName : 'Mr. Nityananda Mohanty',
      valuerPan: saved.valuerPan !== undefined ? saved.valuerPan : 'AONPM6997B',
      signaturePlace: saved.signaturePlace !== undefined ? saved.signaturePlace : 'Bhubaneswar',
      signatureDate: saved.signatureDate !== undefined ? saved.signatureDate : (pf.reportDate || '06.08.2026'),

      // Enclosures
      documentImages: saved.documentImages || [],
      documentImageNames: saved.documentImageNames || [],
      locationMapImages: saved.locationMapImages || [],
      mouzaMapImages: saved.mouzaMapImages || [],
      sketchMapImages: saved.sketchMapImages || [],
      cadastralMapImages: saved.cadastralMapImages || [],
      bdaMapImages: saved.bdaMapImages || [],
      propertyImages: saved.propertyImages || [],
      propertyImageNames: saved.propertyImageNames || [],
    };
  }, [rawInitialFields, initialData, projectCode, projectId, prefill]);

  const [fields, setFields] = useState<any>(initialFields);

  const handleChange = (key: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [key]: value }));
  };

  const parseNum = (val: any): number => {
    if (val === undefined || val === null || val === '') return 0;
    const str = String(val).replace(/,/g, '').replace(/[^0-9.-]/g, '');
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  };

  const parsePct = (val: any, fallback = 100): number => {
    if (val === undefined || val === null || String(val).trim() === '') return fallback;
    const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
    return isNaN(n) ? fallback : Math.min(100, Math.max(0, n));
  };

  // ── Auto-Calculate Rates & Valuation Totals ──
  useEffect(() => {
    if (fields.propertyValuationType === 'LAND_AND_BUILDING') {
      const landMkt = parseNum(fields.abstractMarketLand);
      const bldgMkt = parseNum(fields.abstractMarketBldg);
      const totalMkt = landMkt + bldgMkt;

      const rPct = parsePct(fields.abstractRealizablePct, 100);
      const dPct = parsePct(fields.abstractDistressPct, 100);

      const realTotal = Math.round((totalMkt * rPct) / 100);
      const distTotal = Math.round((totalMkt * dPct) / 100);

      setFields((prev: any) => ({
        ...prev,
        abstractMarketTotal: totalMkt > 0 ? `Rs. ${formatIndianCurrency(totalMkt)}` : prev.abstractMarketTotal,
        abstractRealizableTotal: realTotal > 0 ? `Rs. ${formatIndianCurrency(realTotal)}` : prev.abstractRealizableTotal,
        abstractDistressTotal: distTotal > 0 ? `Rs. ${formatIndianCurrency(distTotal)}` : prev.abstractDistressTotal,
        opinionMarketValueWords: totalMkt > 0 ? rupeesInWords(totalMkt) : prev.opinionMarketValueWords,
        opinionRealizableValueWords: realTotal > 0 ? rupeesInWords(realTotal) : prev.opinionRealizableValueWords,
        opinionDistressValueWords: distTotal > 0 ? rupeesInWords(distTotal) : prev.opinionDistressValueWords,
      }));
    } else {
      const sba = parseNum(fields.superBuiltUpArea);
      const bldgRate = parseNum(fields.finalDepreciatedBuildingRate);
      const landRate = parseNum(fields.finalRateLandOther);
      const compRate = Math.round((bldgRate + landRate) * 100) / 100;
      const flatVal = Math.round(sba * (compRate > 0 ? compRate : parseNum(fields.finalTotalCompositeRate)));

      const extraTotal =
        parseNum(fields.valCarParking) +
        parseNum(fields.valWardrobes) +
        parseNum(fields.valModularKitchen) +
        parseNum(fields.valCupboard) +
        parseNum(fields.valInteriorDecorations) +
        parseNum(fields.valElectricityDeposits) +
        parseNum(fields.valExtraGrillCollapsible) +
        parseNum(fields.valPotentialValue) +
        parseNum(fields.valOthers);

      const totalEst = flatVal + extraTotal;
      const rPct = parsePct(fields.abstractRealizablePct, 100);
      const dPct = parsePct(fields.abstractDistressPct, 100);

      const realVal = Math.round((totalEst * rPct) / 100);
      const distVal = Math.round((totalEst * dPct) / 100);

      setFields((prev: any) => ({
        ...prev,
        finalTotalCompositeRate: prev.finalTotalCompositeRate || (compRate > 0 ? `Rs. ${compRate}` : ''),
        valFlatPresentValue: prev.valFlatPresentValue || (flatVal > 0 ? `Rs. ${formatIndianCurrency(flatVal)}` : ''),
        valTotalEstimated: prev.valTotalEstimated || (totalEst > 0 ? `Rs. ${formatIndianCurrency(totalEst)}` : ''),
        abstractMarketValue: prev.abstractMarketValue || (totalEst > 0 ? `Rs. ${formatIndianCurrency(totalEst)}` : ''),
        abstractRealizableValue: prev.abstractRealizableValue || (realVal > 0 ? `Rs. ${formatIndianCurrency(realVal)}` : ''),
        abstractDistressValue: prev.abstractDistressValue || (distVal > 0 ? `Rs. ${formatIndianCurrency(distVal)}` : ''),
        opinionMarketValueWords: prev.opinionMarketValueWords || (totalEst > 0 ? rupeesInWords(totalEst) : ''),
        opinionRealizableValueWords: prev.opinionRealizableValueWords || (realVal > 0 ? rupeesInWords(realVal) : ''),
        opinionDistressValueWords: prev.opinionDistressValueWords || (distVal > 0 ? rupeesInWords(distVal) : ''),
      }));
    }
  }, [
    fields.propertyValuationType,
    fields.superBuiltUpArea,
    fields.finalDepreciatedBuildingRate,
    fields.finalRateLandOther,
    fields.abstractMarketLand,
    fields.abstractMarketBldg,
    fields.abstractRealizablePct,
    fields.abstractDistressPct,
  ]);

  const handleSaveInternal = async () => {
    if (!projectId || isReadOnly) return;
    setSaving(true);
    try {
      await saveReportDraft(projectId, {
        ...fields,
        clientType: 'organisation',
        organisationTemplate: 'STATE BANK OF INDIA-SBI',
        organisationSubTemplate: 'Flat & Apartment',
        institutionCategory: 'Bank & FIS',
        propertyValuationType: 'FLAT',
        reportData: fields,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save report draft', e);
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewPdfInternal = async () => {
    try {
      const renderer = new PDFSBIRenderer(fields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error('Error generating SBI PDF Preview:', e);
      alert('Error generating PDF preview.');
    }
  };

  const handleDownloadPdfInternal = async () => {
    try {
      const renderer = new PDFSBIRenderer(fields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SBI_Flat_And_Apartment_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating SBI PDF:', e);
    }
  };

  const handleSubmitInternal = async () => {
    if (!projectId || isReadOnly) return;
    if (!confirm('Are you sure you want to submit this report for manager verification?')) return;
    setSaving(true);
    try {
      await saveReportDraft(projectId, {
        ...fields,
        clientType: 'organisation',
        organisationTemplate: 'STATE BANK OF INDIA-SBI',
        organisationSubTemplate: 'Flat & Apartment',
        institutionCategory: 'Bank & FIS',
        propertyValuationType: 'FLAT',
        reportData: fields,
      });
      const res = await submitReportForVerification(projectId);
      if (res && 'error' in res && res.error) {
        alert(`Failed to submit report: ${res.error}`);
      } else {
        alert('Report submitted successfully to Manager!');
        router.refresh();
      }
    } catch (e: any) {
      console.error('Failed to submit report', e);
      alert(`Error submitting report: ${e?.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const pf = (prefill || {}) as any;

  const NAV_SECTIONS: NavItem[] = [
    { id: 'sbi-flat-general', title: 'GENERAL' },
    { id: 'sbi-flat-building', title: 'APARTMENT BUILDING' },
    { id: 'sbi-flat-flat', title: 'FLAT SPECIFICATIONS' },
    { id: 'sbi-flat-marketability', title: 'MARKETABILITY' },
    { id: 'sbi-flat-rate', title: 'RATE' },
    { id: 'sbi-flat-abstract', title: 'TOTAL ABSTRACT' },
    { id: 'section-documents', title: 'DOCUMENTS' },
    { id: 'section-maps', title: 'MAPS' },
    { id: 'section-photographs', title: 'PHOTOGRAPHS' },
  ];

  return (
    <div className="space-y-6 pb-24 w-full">
      {/* ── Active Configuration Banner with Change Parameters ── */}
      <ActiveConfigBanner
        clientType={(fields.clientType as 'organisation' | 'individual') || 'organisation'}
        category={fields.institutionCategory || 'Bank & FIS'}
        bankName={fields.bankName || fields.organisationTemplate || 'STATE BANK OF INDIA (SBI)'}
        subclass={fields.organisationSubTemplate || 'Flat & Apartment'}
        serviceType={fields.serviceType}
        subjectType={fields.subjectType}
        onResetWizard={onResetWizard}
        sticky={false}
      />

      {/* ── Main Layout: Form (Left) & Floating Navigator (Right) ── */}
      <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
        {/* ── Left Form Column ── */}
        <div className="flex-1 min-w-0 space-y-6 w-full">


      {/* ── Section 1: I. GENERAL (Color: Light Blue #e3f2fd) ── */}
      <Section id="sbi-flat-general" title="I. GENERAL" number="I" defaultOpen={true}>
        <div style={{ backgroundColor: '#e3f2fd', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-blue-200">
          {/* Header Title inside light blue box */}
          <div className="border-b border-blue-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-blue-900 text-sm uppercase tracking-wider">
              I. GENERAL PARTICULARS
            </h3>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200">
              Statutory Questionnaire
            </span>
          </div>

          {/* 1. Purpose for which the valuation is made */}
          <PrefillField
            label="1. Purpose for which the valuation is made"
            value={fields.sbiFlatPurposeOfValuation}
            onChange={(val: string) => {
              handleChange('sbiFlatPurposeOfValuation', val);
              handleChange('purposeOfValuation', val);
            }}
            isReadOnly={isReadOnly}
            tooltip='>>Prefill from section COVER PAGE, "PURPOSE :"<<'
            fallbackValue={fields.purposeOfValuation || pf.purposeOfValuation || 'To assess the present Market Value of the Property for Loan purpose'}
          />

          {/* 2. a) Date of inspection & 2. b) Date on which the valuation is made */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="2. a) Date of inspection">
              <input
                type="date"
                className={inputCls}
                value={fields.sbiFlatInspectionDate || ''}
                onChange={e => {
                  handleChange('sbiFlatInspectionDate', e.target.value);
                  handleChange('inspectionDate', e.target.value);
                }}
                disabled={isReadOnly}
              />
            </Field>

            <PrefillField
              label="2. b) Date on which the valuation is made"
              type="date"
              value={fields.sbiFlatValuationDate}
              onChange={(val: string) => {
                handleChange('sbiFlatValuationDate', val);
                handleChange('valuationDate', val);
                handleChange('reportDate', val);
              }}
              isReadOnly={isReadOnly}
              tooltip='>>Prefill from section COVER PAGE, "DATE:"<<'
              fallbackValue={fields.valuationDate || fields.reportDate || pf.reportDate || '06.08.2026'}
            />
          </div>

          {/* 3. List of documents produced for perusal [i), ii), iii)] */}
          <Field label="3. List of documents produced for perusal [i), ii), iii)]">
            <div className="space-y-2">
              {(fields.sbiFlatDocumentsProduced || []).map((doc: string, idx: number) => {
                const romanNumerals = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x'];
                const prefix = `${romanNumerals[idx] || (idx + 1)})`;
                return (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-8 text-xs font-bold text-blue-900 text-right">{prefix}</span>
                    <input
                      type="text"
                      className={inputCls}
                      value={doc}
                      onChange={e => {
                        const updated = [...(fields.sbiFlatDocumentsProduced || [])];
                        updated[idx] = e.target.value;
                        handleChange('sbiFlatDocumentsProduced', updated);
                        handleChange('documentsProduced', updated);
                      }}
                      disabled={isReadOnly}
                      placeholder={`Document ${prefix}`}
                    />
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (fields.sbiFlatDocumentsProduced || []).filter((_: any, i: number) => i !== idx);
                          handleChange('sbiFlatDocumentsProduced', updated);
                          handleChange('documentsProduced', updated);
                        }}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...(fields.sbiFlatDocumentsProduced || []), ''];
                    handleChange('sbiFlatDocumentsProduced', updated);
                    handleChange('documentsProduced', updated);
                  }}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1 mt-1 px-3 py-1.5 rounded-lg border border-blue-300 bg-white hover:bg-blue-50 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Document
                </button>
              )}
            </div>
          </Field>

          {/* 4. Name of the Owner and his / their address (es) with Phone no. */}
          <PrefillField
            type="textarea"
            rows={2}
            label="4. Name of the Owner and his / their address (es) with Phone no."
            value={fields.sbiFlatOwnerNameAndAddress}
            onChange={(val: string) => {
              handleChange('sbiFlatOwnerNameAndAddress', val);
              handleChange('ownerNameAndAddress', val);
            }}
            isReadOnly={isReadOnly}
            tooltip='>>Prefill from section COVER PAGE, "NAME OF THE OWNER"<<'
            fallbackValue={fields.ownerNameAndAddress || (pf.propertyOwner ? `${pf.propertyOwner}, At: ${pf.propertyAddress || ''}, Ph: ${pf.customerPhone || ''}` : 'Mr. Srijit Mishra, S/o: Mr. Gopinath Mishra, Ph: 9861012345')}
          />

          {/* 5. Brief description of the property */}
          <Field label="5. Brief description of the property">
            <textarea
              className={inputCls}
              rows={2}
              value={fields.sbiFlatPropertyDescription || ''}
              onChange={e => {
                handleChange('sbiFlatPropertyDescription', e.target.value);
                handleChange('propertyDescription', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Brief description including leasehold / freehold status, unit location, etc."
            />
          </Field>

          {/* 6. Location of property (Plot No., Door No., T.S. No., Ward, District) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              6. Location of property (Plot No., Door No., T.S. No., Ward, District)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-white/70 p-3 rounded-xl border border-blue-200">
              <Field label="Plot No. / Survey No.">
                <input
                  className={inputCls}
                  value={fields.sbiFlatPlotNo || ''}
                  onChange={e => {
                    handleChange('sbiFlatPlotNo', e.target.value);
                    handleChange('plotNo', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="Plot No."
                />
              </Field>
              <Field label="Door No.">
                <input
                  className={inputCls}
                  value={fields.sbiFlatDoorNo || ''}
                  onChange={e => {
                    handleChange('sbiFlatDoorNo', e.target.value);
                    handleChange('doorNo', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="Door No."
                />
              </Field>
              <Field label="T.S. No. / Village">
                <input
                  className={inputCls}
                  value={fields.sbiFlatTsNo || ''}
                  onChange={e => {
                    handleChange('sbiFlatTsNo', e.target.value);
                    handleChange('tsNoVillage', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="T.S. / Mouza"
                />
              </Field>
              <Field label="Ward / Taluka">
                <input
                  className={inputCls}
                  value={fields.sbiFlatWard || ''}
                  onChange={e => {
                    handleChange('sbiFlatWard', e.target.value);
                    handleChange('wardTaluka', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="Ward No."
                />
              </Field>
              <Field label="District">
                <input
                  className={inputCls}
                  value={fields.sbiFlatDistrict || ''}
                  onChange={e => {
                    handleChange('sbiFlatDistrict', e.target.value);
                    handleChange('mandalDistrict', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="District"
                />
              </Field>
            </div>
          </div>

          {/* 7. Postal address of the property */}
          <Field label="7. Postal address of the property">
            <textarea
              className={inputCls}
              rows={2}
              value={fields.sbiFlatPostalAddress || ''}
              onChange={e => {
                handleChange('sbiFlatPostalAddress', e.target.value);
                handleChange('postalAddress', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="Full postal address with PIN code..."
            />
          </Field>

          {/* 8. City / Town (Residential/Commercial/Industrial Area) */}
          <Field label="8. City / Town (Residential/Commercial/Industrial Area)">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/70 p-3 rounded-xl border border-blue-200">
              {['Residential Area', 'Commercial Area', 'Industrial Area', 'Residential / Commercial Mix'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                  <input
                    type="radio"
                    name="sbiFlatCityTownType"
                    value={opt}
                    checked={(fields.sbiFlatCityTownType || 'Residential Area') === opt}
                    onChange={e => {
                      handleChange('sbiFlatCityTownType', e.target.value);
                      handleChange('residentialArea', e.target.value === 'Residential Area' ? 'Residential Area' : 'Not Applicable');
                      handleChange('commercialArea', e.target.value === 'Commercial Area' ? 'Commercial Area' : 'Not Applicable');
                      handleChange('industrialArea', e.target.value === 'Industrial Area' ? 'Industrial Area' : 'Not Applicable');
                    }}
                    disabled={isReadOnly}
                    className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </Field>

          {/* 9. Classification of the area (High/Middle/Poor, Urban/Semi Urban/Rural) */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="9. i) Classification of Area (Income Class)">
              <select
                className={selectCls}
                value={fields.sbiFlatClassOfLocality || 'Middle Class'}
                onChange={e => {
                  handleChange('sbiFlatClassOfLocality', e.target.value);
                  handleChange('classificationHighMiddlePoor', e.target.value);
                }}
                disabled={isReadOnly}
              >
                <option value="High Class">High Class</option>
                <option value="Middle Class">Middle Class</option>
                <option value="Poor">Poor / Low Income</option>
              </select>
            </Field>

            <Field label="9. ii) Classification of Area (Urban / Rural)">
              <select
                className={selectCls}
                value={fields.sbiFlatUrbanRural || 'Urban Area'}
                onChange={e => {
                  handleChange('sbiFlatUrbanRural', e.target.value);
                  handleChange('classificationUrbanRural', e.target.value);
                }}
                disabled={isReadOnly}
              >
                <option value="Urban Area">Urban Area</option>
                <option value="Semi Urban Area">Semi Urban Area</option>
                <option value="Rural Area">Rural Area</option>
              </select>
            </Field>
          </div>

          {/* 10 Coming under Corporation limit/ Village Panchayat / Municipality */}
          <Field label="10 Coming under Corporation limit/ Village Panchayat / Municipality">
            <input
              type="text"
              className={inputCls}
              value={fields.sbiFlatLocalBodyLimit || ''}
              onChange={e => {
                handleChange('sbiFlatLocalBodyLimit', e.target.value);
                handleChange('localBodyLimit', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Bhubaneswar Municipal Corporation limit"
            />
          </Field>

          {/* 11 Whether covered under any State / Central Govt. enactments */}
          <Field label="11 Whether covered under any State / Central Govt. enactments (e.g. Urban Land Ceiling Act, CRZ, etc.)">
            <div className="space-y-2 bg-white/70 p-3 rounded-xl border border-blue-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!fields.sbiFlatGovtEnactmentsCovered}
                  onChange={e => {
                    handleChange('sbiFlatGovtEnactmentsCovered', e.target.checked);
                    handleChange('govtEnactmentsCovered', e.target.checked ? 'Yes' : 'No');
                  }}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Yes, covered under State / Central Govt. enactments
                </span>
              </label>
              {fields.sbiFlatGovtEnactmentsCovered && (
                <textarea
                  className={inputCls + ' mt-2'}
                  rows={2}
                  value={fields.sbiFlatGovtEnactmentsDetails || ''}
                  onChange={e => {
                    handleChange('sbiFlatGovtEnactmentsDetails', e.target.value);
                    handleChange('govtEnactmentsCovered', `Yes, ${e.target.value}`);
                  }}
                  disabled={isReadOnly}
                  placeholder="Provide specific enactment details (e.g. Urban Land Ceiling Act, CRZ, etc.)..."
                />
              )}
            </div>
          </Field>

          {/* 12 In case it is an agricultural land, any conversion to house site plots is contemplated */}
          <Field label="12 In case it is an agricultural land, any conversion to house site plots is contemplated">
            <input
              type="text"
              className={inputCls}
              value={fields.sbiFlatAgriculturalConversion || ''}
              onChange={e => {
                handleChange('sbiFlatAgriculturalConversion', e.target.value);
                handleChange('agriculturalConversion', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Converted to Homestead (Gharabari) / Not Applicable"
            />
          </Field>

          {/* 13. Boundaries of the property (East, West, North, South) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              13. Boundaries of the property (East, West, North, South)
            </label>
            <div className="bg-white/70 p-3 rounded-xl border border-blue-200 space-y-3">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-700 pb-1 border-b border-blue-200">
                <span className="col-span-2">Direction</span>
                <span className="col-span-5">As per Deed / Document</span>
                <span className="col-span-5">Actual at Site / Physical Verification</span>
              </div>
              {[
                { dir: 'East', docKey: 'sbiFlatBoundaryEastDoc', verifKey: 'sbiFlatBoundaryEastVerif', stdDoc: 'boundaryEastDocument', stdVerif: 'boundaryEastVerification' },
                { dir: 'West', docKey: 'sbiFlatBoundaryWestDoc', verifKey: 'sbiFlatBoundaryWestVerif', stdDoc: 'boundaryWestDocument', stdVerif: 'boundaryWestVerification' },
                { dir: 'North', docKey: 'sbiFlatBoundaryNorthDoc', verifKey: 'sbiFlatBoundaryNorthVerif', stdDoc: 'boundaryNorthDocument', stdVerif: 'boundaryNorthVerification' },
                { dir: 'South', docKey: 'sbiFlatBoundarySouthDoc', verifKey: 'sbiFlatBoundarySouthVerif', stdDoc: 'boundarySouthDocument', stdVerif: 'boundarySouthVerification' },
              ].map(({ dir, docKey, verifKey, stdDoc, stdVerif }) => (
                <div key={dir} className="grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-2 text-xs font-bold text-blue-950">{dir}</span>
                  <div className="col-span-5">
                    <textarea
                      rows={2}
                      className={inputCls + ' text-xs'}
                      value={fields[docKey] || ''}
                      onChange={e => {
                        handleChange(docKey, e.target.value);
                        handleChange(stdDoc, e.target.value);
                      }}
                      disabled={isReadOnly}
                      placeholder={`As per deed (${dir})`}
                    />
                  </div>
                  <div className="col-span-5">
                    <textarea
                      rows={2}
                      className={inputCls + ' text-xs'}
                      value={fields[verifKey] || ''}
                      onChange={e => {
                        handleChange(verifKey, e.target.value);
                        handleChange(stdVerif, e.target.value);
                      }}
                      disabled={isReadOnly}
                      placeholder={`Actual at site (${dir})`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 14.1 Dimensions of the site (East, West, North, South) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              14.1 Dimensions of the site (East, West, North, South)
            </label>
            <div className="bg-white/70 p-3 rounded-xl border border-blue-200 space-y-2">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-700 pb-1 border-b border-blue-200">
                <span className="col-span-2">Direction</span>
                <span className="col-span-5">As per Deed</span>
                <span className="col-span-5">Actual at Site</span>
              </div>
              {[
                { dir: 'East', deedKey: 'sbiFlatDimEastDeed', actKey: 'sbiFlatDimEastActual', stdDeed: 'dimensionEastDeed', stdAct: 'dimensionEastActual' },
                { dir: 'West', deedKey: 'sbiFlatDimWestDeed', actKey: 'sbiFlatDimWestActual', stdDeed: 'dimensionWestDeed', stdAct: 'dimensionWestActual' },
                { dir: 'North', deedKey: 'sbiFlatDimNorthDeed', actKey: 'sbiFlatDimNorthActual', stdDeed: 'dimensionNorthDeed', stdAct: 'dimensionNorthActual' },
                { dir: 'South', deedKey: 'sbiFlatDimSouthDeed', actKey: 'sbiFlatDimSouthActual', stdDeed: 'dimensionSouthDeed', stdAct: 'dimensionSouthActual' },
              ].map(({ dir, deedKey, actKey, stdDeed, stdAct }) => (
                <div key={dir} className="grid grid-cols-12 gap-2 items-center">
                  <span className="col-span-2 text-xs font-bold text-blue-950">{dir}</span>
                  <div className="col-span-5">
                    <input
                      type="text"
                      className={inputCls + ' text-xs'}
                      value={fields[deedKey] || ''}
                      onChange={e => {
                        handleChange(deedKey, e.target.value);
                        handleChange(stdDeed, e.target.value);
                      }}
                      disabled={isReadOnly}
                      placeholder="Deed dimension"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      className={inputCls + ' text-xs'}
                      value={fields[actKey] || ''}
                      onChange={e => {
                        handleChange(actKey, e.target.value);
                        handleChange(stdAct, e.target.value);
                      }}
                      disabled={isReadOnly}
                      placeholder="Actual dimension"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 14.2 Latitude, Longitude and Coordinates of the site */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              14.2 Latitude, Longitude and Coordinates of the site
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/70 p-3 rounded-xl border border-blue-200">
              <Field label="Latitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sbiFlatLatitude || ''}
                  onChange={e => {
                    handleChange('sbiFlatLatitude', e.target.value);
                    handleChange('latitude', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="e.g. 20.2961° N"
                />
              </Field>
              <Field label="Longitude">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sbiFlatLongitude || ''}
                  onChange={e => {
                    handleChange('sbiFlatLongitude', e.target.value);
                    handleChange('longitude', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="e.g. 85.8245° E"
                />
              </Field>
              <Field label="GPS Coordinates Reference">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sbiFlatCoordinates || ''}
                  onChange={e => {
                    handleChange('sbiFlatCoordinates', e.target.value);
                    handleChange('coordinatesText', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="e.g. 20.2961, 85.8245"
                />
              </Field>
            </div>
          </div>

          {/* 15 Extent of the site of the Project & 16 Extent of the site considered for valuation */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="15 Extent of the site of the Project">
              <input
                type="text"
                className={inputCls}
                value={fields.sbiFlatExtentOfSiteProject || ''}
                onChange={e => {
                  handleChange('sbiFlatExtentOfSiteProject', e.target.value);
                  handleChange('extentOfProjectSite', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. Ac. 1.250 Dec / 54450 Sq.ft"
              />
            </Field>

            <Field label="16 Extent of the site considered for valuation">
              <input
                type="text"
                className={inputCls}
                value={fields.sbiFlatExtentOfSiteValuation || ''}
                onChange={e => {
                  handleChange('sbiFlatExtentOfSiteValuation', e.target.value);
                  handleChange('extentConsideredValuation', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. Super Built-up Area: 1250 Sq.ft (UDS: 350 Sq.ft)"
              />
            </Field>
          </div>

          {/* 17 Whether occupied by the owner / tenant? */}
          <Field label="17 Whether occupied by the owner / tenant?">
            <select
              className={selectCls}
              value={fields.sbiFlatOccupancyStatus || 'Self Occupied by Owner'}
              onChange={e => {
                handleChange('sbiFlatOccupancyStatus', e.target.value);
                handleChange('occupancyStatusOwnerTenant', e.target.value);
              }}
              disabled={isReadOnly}
            >
              <option value="Self Occupied by Owner">Self Occupied by Owner</option>
              <option value="Occupied by Tenant">Occupied by Tenant</option>
              <option value="Vacant">Vacant</option>
              <option value="Under Construction">Under Construction</option>
              <option value="Partially Occupied by Owner & Tenant">Partially Occupied by Owner & Tenant</option>
            </select>
          </Field>

          {/* 18 Date of issue and validity of layout of approved map / plan & 19 Approved map / plan issuing authority */}
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="18 Date of issue and validity of layout of approved map / plan">
              <input
                type="text"
                className={inputCls}
                value={fields.sbiFlatApprovedPlanDateValidity || ''}
                onChange={e => {
                  handleChange('sbiFlatApprovedPlanDateValidity', e.target.value);
                  handleChange('approvedPlanValidity', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. Letter No: 1245/BDA dtd 14.03.2023, Valid for 3 years"
              />
            </Field>

            <Field label="19 Approved map / plan issuing authority">
              <input
                type="text"
                className={inputCls}
                value={fields.sbiFlatApprovedPlanAuthority || ''}
                onChange={e => {
                  handleChange('sbiFlatApprovedPlanAuthority', e.target.value);
                  handleChange('approvedPlanAuthority', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. Bhubaneswar Development Authority (BDA)"
              />
            </Field>
          </div>

          {/* 20 Whether genuineness or authenticity of approved map / plan is verified */}
          <Field label="20 Whether genuineness or authenticity of approved map / plan is verified">
            <div className="bg-white/70 p-3 rounded-xl border border-blue-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!fields.sbiFlatPlanAuthenticityVerified}
                  onChange={e => {
                    handleChange('sbiFlatPlanAuthenticityVerified', e.target.checked);
                    handleChange('approvedPlanAuthenticity', e.target.checked ? 'Yes, Verified from the authenticated authority' : 'No');
                  }}
                  disabled={isReadOnly}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-slate-800">
                  {fields.sbiFlatPlanAuthenticityVerified ? 'Yes, verified from authentic authority' : 'No / Not Verified'}
                </span>
              </label>
            </div>
          </Field>

          {/* 21 Any other comments by our empanelled valuers on authentic of approved plan */}
          <Field label="21 Any other comments by our empanelled valuers on authentic of approved plan">
            <textarea
              className={inputCls}
              rows={2}
              value={fields.sbiFlatValuerCommentsOnPlan || ''}
              onChange={e => {
                handleChange('sbiFlatValuerCommentsOnPlan', e.target.value);
                handleChange('valuerCommentsOnPlan', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. The building construction is in conformity with the approved plan and statutory setback norms."
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 2: II. APARTMENT BUILDING (Color: Light Green #e8f5e9) ── */}
      <Section id="sbi-flat-building" title="II. APARTMENT BUILDING" number="II" defaultOpen={true}>
        <div style={{ backgroundColor: '#e8f5e9', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-emerald-200">
          {/* Header Title inside light green box */}
          <div className="border-b border-emerald-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-emerald-900 text-sm uppercase tracking-wider">
              II. APARTMENT BUILDING
            </h3>
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              Building Particulars & Facilities
            </span>
          </div>

          {/* 1. Nature of the Apartment */}
          <Field label="1. Nature of the Apartment">
            <input
              type="text"
              className={inputCls}
              value={fields.sbiFlatNatureOfApartment || fields.natureOfApartment || ''}
              onChange={e => {
                handleChange('sbiFlatNatureOfApartment', e.target.value);
                handleChange('natureOfApartment', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Residential Apartment"
            />
          </Field>

          {/* 2. Location (T.S. No, Block No, Ward No, Village, Door No.) */}
          <Field label="2. Location (T.S. No, Block No, Ward No, Village, Door No.)">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 bg-white/70 p-3.5 rounded-xl border border-emerald-200">
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  T.S. No
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={fields.aptLocationTsNo || ''}
                  onChange={e => handleChange('aptLocationTsNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="T.S. No (or NA)"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  Block No
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={fields.aptLocationBlockNo || ''}
                  onChange={e => handleChange('aptLocationBlockNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. Tower-A"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  Ward No
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={fields.aptLocationWardNo || ''}
                  onChange={e => handleChange('aptLocationWardNo', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Ward No"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  Village / Municipality
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={fields.aptLocationVillageCorp || ''}
                  onChange={e => handleChange('aptLocationVillageCorp', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Village / Municipality"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                  Door No / Road / Pin
                </label>
                <input
                  type="text"
                  className={inputCls}
                  value={fields.aptLocationDoorRoadPin || ''}
                  onChange={e => handleChange('aptLocationDoorRoadPin', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Door No / Street"
                />
              </div>
            </div>
          </Field>

          {/* 3. Description of the locality Residential / Commercial / Mixed */}
          <Field label="3. Description of the locality Residential / Commercial / Mixed">
            <select
              className={selectCls}
              value={fields.sbiFlatLocalityDescription || fields.localityDescription || 'Residential'}
              onChange={e => {
                handleChange('sbiFlatLocalityDescription', e.target.value);
                handleChange('localityDescription', e.target.value);
              }}
              disabled={isReadOnly}
            >
              <option value="Residential">Residential</option>
              <option value="Commercial">Commercial</option>
              <option value="Mixed">Mixed</option>
              <option value="Industrial">Industrial</option>
              <option value="Residential cum Commercial">Residential cum Commercial</option>
            </select>
          </Field>

          {/* 4. Year of Construction, 5. Number of Floors, 6. Type of Structure, 7. Dwelling units */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Field label="4. Year of Construction">
              <input
                type="number"
                className={inputCls}
                value={fields.sbiFlatYearOfConstruction || fields.yearOfConstruction || ''}
                onChange={e => {
                  handleChange('sbiFlatYearOfConstruction', e.target.value);
                  handleChange('yearOfConstruction', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. 2010"
              />
            </Field>

            <Field label="5. Number of Floors">
              <input
                type="number"
                className={inputCls}
                value={fields.sbiFlatNumberOfFloors || fields.numberOfFloors || ''}
                onChange={e => {
                  handleChange('sbiFlatNumberOfFloors', e.target.value);
                  handleChange('numberOfFloors', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. 16"
              />
            </Field>

            <Field label="6. Type of Structure">
              <select
                className={selectCls}
                value={fields.sbiFlatTypeOfStructure || fields.typeOfStructure || 'RCC Frame Structure'}
                onChange={e => {
                  handleChange('sbiFlatTypeOfStructure', e.target.value);
                  handleChange('typeOfStructure', e.target.value);
                }}
                disabled={isReadOnly}
              >
                <option value="RCC Frame Structure">RCC Frame Structure</option>
                <option value="Load Bearing Structure">Load Bearing Structure</option>
                <option value="Steel Frame Structure">Steel Frame Structure</option>
                <option value="Composite Structure">Composite Structure</option>
              </select>
            </Field>

            <Field label="7. Number of Dwelling units in the building">
              <input
                type="number"
                className={inputCls}
                value={fields.sbiFlatDwellingUnitsCount || fields.dwellingUnitsCount || ''}
                onChange={e => {
                  handleChange('sbiFlatDwellingUnitsCount', e.target.value);
                  handleChange('dwellingUnitsCount', e.target.value);
                }}
                disabled={isReadOnly}
                placeholder="e.g. 64"
              />
            </Field>
          </div>

          {/* 8. Quality of Construction, 9. Appearance, 10. Maintenance */}
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="8. Quality of Construction">
              <select
                className={selectCls}
                value={fields.sbiFlatQualityOfConstruction || fields.qualityOfConstruction || 'Good'}
                onChange={e => {
                  handleChange('sbiFlatQualityOfConstruction', e.target.value);
                  handleChange('qualityOfConstruction', e.target.value);
                }}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
                <option value="Superior">Superior</option>
                <option value="Very Good">Very Good</option>
              </select>
            </Field>

            <Field label="9. Appearance of the Building">
              <select
                className={selectCls}
                value={fields.sbiFlatAppearanceOfBuilding || fields.appearanceOfBuilding || 'Good'}
                onChange={e => {
                  handleChange('sbiFlatAppearanceOfBuilding', e.target.value);
                  handleChange('appearanceOfBuilding', e.target.value);
                }}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
                <option value="Very Good">Very Good</option>
                <option value="Ordinary">Ordinary</option>
              </select>
            </Field>

            <Field label="10 Maintenance of the Building">
              <select
                className={selectCls}
                value={fields.sbiFlatMaintenanceOfBuilding || fields.maintenanceOfBuilding || 'Good'}
                onChange={e => {
                  handleChange('sbiFlatMaintenanceOfBuilding', e.target.value);
                  handleChange('maintenanceOfBuilding', e.target.value);
                }}
                disabled={isReadOnly}
              >
                <option value="Good">Good</option>
                <option value="Average">Average</option>
                <option value="Poor">Poor</option>
                <option value="Well Maintained">Well Maintained</option>
                <option value="Fair">Fair</option>
              </select>
            </Field>
          </div>

          {/* 11 Facilities Available (Lift, Water, Sewerage, Parking, Wall, Pavement) */}
          <Field label="11 Facilities Available (Lift, Water, Sewerage, Parking, Wall, Pavement)">
            <div className="bg-white/80 p-4 rounded-xl border border-emerald-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* 1. Lift */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  (fields.facilityLift === 'Yes' || fields.hasLift)
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    checked={fields.facilityLift === 'Yes' || !!fields.hasLift}
                    onChange={e => {
                      const checked = e.target.checked;
                      handleChange('hasLift', checked);
                      handleChange('facilityLift', checked ? 'Yes' : 'No');
                    }}
                    disabled={isReadOnly}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Lift</span>
                    <span className="text-[11px] text-slate-500">Passenger / Service Elevator</span>
                  </div>
                </label>

                {/* 2. Water Supply */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  (fields.facilityWaterSupply === 'Yes' || fields.hasWaterSupply)
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    checked={fields.facilityWaterSupply === 'Yes' || !!fields.hasWaterSupply}
                    onChange={e => {
                      const checked = e.target.checked;
                      handleChange('hasWaterSupply', checked);
                      handleChange('facilityWaterSupply', checked ? 'Yes' : 'No');
                    }}
                    disabled={isReadOnly}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Water Supply</span>
                    <span className="text-[11px] text-slate-500">Protected Drinking Water</span>
                  </div>
                </label>

                {/* 3. Sewerage */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  (fields.facilitySewerage === 'Yes' || fields.hasSewerage)
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    checked={fields.facilitySewerage === 'Yes' || !!fields.hasSewerage}
                    onChange={e => {
                      const checked = e.target.checked;
                      handleChange('hasSewerage', checked);
                      handleChange('facilitySewerage', checked ? 'Yes' : 'No');
                    }}
                    disabled={isReadOnly}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Sewerage</span>
                    <span className="text-[11px] text-slate-500">Under Ground Sewerage</span>
                  </div>
                </label>

                {/* 4. Car Parking */}
                <div className={`p-3 rounded-lg border transition-all ${
                  (fields.facilityCarParking && fields.facilityCarParking !== 'No' && fields.facilityCarParking !== 'None')
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                      checked={!!(fields.facilityCarParking && fields.facilityCarParking !== 'No' && fields.facilityCarParking !== 'None')}
                      onChange={e => {
                        const checked = e.target.checked;
                        handleChange('hasCarParking', checked);
                        handleChange('facilityCarParking', checked ? 'Covered parking' : 'No');
                      }}
                      disabled={isReadOnly}
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Car Parking</span>
                      <span className="text-[11px] text-slate-500">Open / Covered Parking</span>
                    </div>
                  </label>
                  {!!(fields.facilityCarParking && fields.facilityCarParking !== 'No' && fields.facilityCarParking !== 'None') && (
                    <div className="mt-2 pl-7">
                      <select
                        className="text-xs py-1 px-2 border border-emerald-300 rounded bg-white text-emerald-900 w-full focus:outline-emerald-500"
                        value={fields.facilityCarParking}
                        onChange={e => handleChange('facilityCarParking', e.target.value)}
                        disabled={isReadOnly}
                      >
                        <option value="Covered parking">Covered parking</option>
                        <option value="Open parking">Open parking</option>
                        <option value="Stilt parking">Stilt parking</option>
                        <option value="Basement parking">Basement parking</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 5. Compound Wall */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  (fields.facilityCompoundWall === 'Yes' || fields.hasCompoundWall)
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    checked={fields.facilityCompoundWall === 'Yes' || !!fields.hasCompoundWall}
                    onChange={e => {
                      const checked = e.target.checked;
                      handleChange('hasCompoundWall', checked);
                      handleChange('facilityCompoundWall', checked ? 'Yes' : 'No');
                    }}
                    disabled={isReadOnly}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Compound Wall</span>
                    <span className="text-[11px] text-slate-500">Compound Wall with Gate</span>
                  </div>
                </label>

                {/* 6. Pavement */}
                <label className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                  (fields.facilityPavement === 'Yes' || fields.hasPavement)
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    checked={fields.facilityPavement === 'Yes' || !!fields.hasPavement}
                    onChange={e => {
                      const checked = e.target.checked;
                      handleChange('hasPavement', checked);
                      handleChange('facilityPavement', checked ? 'Yes' : 'No');
                    }}
                    disabled={isReadOnly}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Pavement</span>
                    <span className="text-[11px] text-slate-500">Paved Area Around Building</span>
                  </div>
                </label>
              </div>
            </div>
          </Field>
        </div>
      </Section>

      {/* ── Section 3: III. FLAT (Color: Light Yellow #fffde7) ── */}
      <Section id="sbi-flat-flat" title="III. FLAT" number="III" defaultOpen={true}>
            <div style={{ backgroundColor: '#fffde7', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-amber-200">
              {/* Header Title inside light yellow box */}
              <div className="border-b border-amber-300 pb-2 flex justify-between items-center">
                <h3 className="font-bold text-amber-900 text-sm uppercase tracking-wider">
                  III. FLAT
                </h3>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  Flat Specifications & Tenancy
                </span>
              </div>

              {/* 1 The floor on which the flat is situated & 2 Door No of the Flat */}
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="1 The floor on which the flat is situated">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.sbiFlatFloorNumber || fields.flatFloorNumber || ''}
                    onChange={e => {
                      handleChange('sbiFlatFloorNumber', e.target.value);
                      handleChange('flatFloorNumber', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="e.g. 4th Floor"
                  />
                </Field>

                <Field label="2 Door No of the Flat">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.sbiFlatDoorNumber || fields.flatDoorNumber || ''}
                    onChange={e => {
                      handleChange('sbiFlatDoorNumber', e.target.value);
                      handleChange('flatDoorNumber', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="e.g. Flat No: A-041, Tower-A"
                  />
                </Field>
              </div>

              {/* 3 Specifications of the flat (Roof, Flooring, Doors, Windows, Fittings, Finishing) */}
              <Field label="3 Specifications of the flat (Roof, Flooring, Doors, Windows, Fittings, Finishing)">
                <div className="bg-white/80 p-3.5 rounded-xl border border-amber-200 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                        Roof
                      </label>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.specRoof || ''}
                        onChange={e => handleChange('specRoof', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. RCC Roof"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                        Flooring
                      </label>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.specFlooring || ''}
                        onChange={e => handleChange('specFlooring', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. VT Flooring / Vitrified Tiles"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                        Doors
                      </label>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.specDoors || ''}
                        onChange={e => handleChange('specDoors', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Hard Ply wood doors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                        Windows
                      </label>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.specWindows || ''}
                        onChange={e => handleChange('specWindows', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Aluminum frame with glass fitting windows"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                        Fittings
                      </label>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.specFittings || ''}
                        onChange={e => handleChange('specFittings', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Superior / Standard CP fittings"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                        Finishing
                      </label>
                      <input
                        type="text"
                        className={inputCls}
                        value={fields.specFinishing || ''}
                        onChange={e => handleChange('specFinishing', e.target.value)}
                        disabled={isReadOnly}
                        placeholder="e.g. Cement Plastering, Putty, Modular Kitchen"
                      />
                    </div>
                  </div>
                </div>
              </Field>

              {/* 4 Assessment No (Tax paid in name of, Tax Amount) */}
              <Field label="4 Assessment No (Tax paid in name of, Tax Amount)">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-white/80 p-3.5 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Assessment No
                    </label>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.assessmentNumber || ''}
                      onChange={e => handleChange('assessmentNumber', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Assessment No (or Not Verified)"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Tax paid in name of
                    </label>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.taxPaidName || ''}
                      onChange={e => handleChange('taxPaidName', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Tax paid in name of"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Tax Amount
                    </label>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.taxAmount || ''}
                      onChange={e => handleChange('taxAmount', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Tax Amount (or Not Verified)"
                    />
                  </div>
                </div>
              </Field>

              {/* 5 Electricity Service Connection No (Meter Card in name of) */}
              <Field label="5 Electricity Service Connection No (Meter Card in name of)">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white/80 p-3.5 rounded-xl border border-amber-200">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Electricity Service Connection No
                    </label>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.electricityConnectionNo || ''}
                      onChange={e => handleChange('electricityConnectionNo', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Connection No (or Not Verified)"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-1">
                      Meter Card in name of
                    </label>
                    <input
                      type="text"
                      className={inputCls}
                      value={fields.meterCardName || ''}
                      onChange={e => handleChange('meterCardName', e.target.value)}
                      disabled={isReadOnly}
                      placeholder="Meter Card in name of"
                    />
                  </div>
                </div>
              </Field>

              {/* 6 How is the maintenance of the flat? */}
              <Field label="6 How is the maintenance of the flat?">
                <select
                  className={selectCls}
                  value={fields.sbiFlatMaintenanceCondition || fields.flatMaintenanceCondition || 'Good'}
                  onChange={e => {
                    handleChange('sbiFlatMaintenanceCondition', e.target.value);
                    handleChange('flatMaintenanceCondition', e.target.value);
                  }}
                  disabled={isReadOnly}
                >
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                  <option value="Well Maintained">Well Maintained</option>
                  <option value="Fair">Fair</option>
                </select>
              </Field>

              {/* 7 Sale Deed executed in the name of */}
              <PrefillField
                type="textarea"
                rows={2}
                label="7 Sale Deed executed in the name of"
                value={fields.sbiFlatSaleDeedExecutedName || fields.saleDeedExecutedName}
                onChange={(val: string) => {
                  handleChange('sbiFlatSaleDeedExecutedName', val);
                  handleChange('saleDeedExecutedName', val);
                }}
                isReadOnly={isReadOnly}
                tooltip='>>Prefill from section I. GENERAL, "4. Name of the Owner and his / their address (es) with Phone no."<<'
                fallbackValue={fields.sbiFlatOwnerNameAndAddress || fields.ownerNameAndAddress || (pf.propertyOwner ? `${pf.propertyOwner}, At: ${pf.propertyAddress || ''}, Ph: ${pf.customerPhone || ''}` : 'Mr. Srijit Mishra')}
              />

              {/* 8 Undivided area, 9 Super Built up Area, 10 Floor Space Index, 11 Carpet Area */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Field label="8 What is the undivided area of land as per Sale Deed?">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.sbiFlatUndividedLandArea || fields.undividedLandArea || ''}
                    onChange={e => {
                      handleChange('sbiFlatUndividedLandArea', e.target.value);
                      handleChange('undividedLandArea', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="Ac.0.012 Dec i.e. 523.00 Sft"
                  />
                </Field>

                <Field label="9 What is the Super Built up Area of the flat?">
                  <input
                    type="text"
                    className={inputCls + ' font-bold text-blue-700'}
                    value={fields.sbiFlatSuperBuiltUpArea || fields.superBuiltUpArea || ''}
                    onChange={e => {
                      handleChange('sbiFlatSuperBuiltUpArea', e.target.value);
                      handleChange('superBuiltUpArea', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="1375.00"
                  />
                </Field>

                <Field label="10 What is the floor space index (app.)">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.sbiFlatFloorSpaceIndex || fields.floorSpaceIndex || ''}
                    onChange={e => {
                      handleChange('sbiFlatFloorSpaceIndex', e.target.value);
                      handleChange('floorSpaceIndex', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="As per approval plan"
                  />
                </Field>

                <Field label="11 What is the Carpet Area of the flat?">
                  <input
                    type="text"
                    className={inputCls}
                    value={fields.sbiFlatCarpetArea || fields.carpetArea || ''}
                    onChange={e => {
                      handleChange('sbiFlatCarpetArea', e.target.value);
                      handleChange('carpetArea', e.target.value);
                    }}
                    disabled={isReadOnly}
                    placeholder="948.00 Sft (Approx.)"
                  />
                </Field>
              </div>

              {/* 12 Is it Posh/ I class / Medium / Ordinary?, 13 Residential/Commercial, 14 Owner-occupied/let out */}
              <div className="grid md:grid-cols-3 gap-4">
                <Field label="12 Is it Posh/ I class / Medium / Ordinary?">
                  <select
                    className={selectCls}
                    value={fields.sbiFlatPoshClassMediumOrdinary || fields.poshClassMediumOrdinary || 'I Class'}
                    onChange={e => {
                      handleChange('sbiFlatPoshClassMediumOrdinary', e.target.value);
                      handleChange('poshClassMediumOrdinary', e.target.value);
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="I Class">I Class</option>
                    <option value="Posh">Posh</option>
                    <option value="Medium">Medium</option>
                    <option value="Ordinary">Ordinary</option>
                  </select>
                </Field>

                <Field label="13 Is it being used for Residential or Commercial purpose?">
                  <select
                    className={selectCls}
                    value={fields.sbiFlatUsageResidentialCommercial || fields.usageResidentialCommercial || 'Residential Purpose'}
                    onChange={e => {
                      handleChange('sbiFlatUsageResidentialCommercial', e.target.value);
                      handleChange('usageResidentialCommercial', e.target.value);
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="Residential Purpose">Residential Purpose</option>
                    <option value="Commercial Purpose">Commercial Purpose</option>
                    <option value="Mixed Purpose">Mixed Purpose</option>
                  </select>
                </Field>

                <Field label="14 Is it Owner-occupied or let out?">
                  <select
                    className={selectCls}
                    value={fields.sbiFlatOccupancyOwnerTenant || fields.flatOccupancyOwnerTenant || 'The Flat is occupied by Owner'}
                    onChange={e => {
                      handleChange('sbiFlatOccupancyOwnerTenant', e.target.value);
                      handleChange('flatOccupancyOwnerTenant', e.target.value);
                    }}
                    disabled={isReadOnly}
                  >
                    <option value="The Flat is occupied by Owner">The Flat is occupied by Owner</option>
                    <option value="Owner-occupied">Owner-occupied</option>
                    <option value="Let out / Rented">Let out / Rented</option>
                    <option value="Vacant">Vacant</option>
                  </select>
                </Field>
              </div>

              {/* 15 If rented, what is the monthly rent? */}
              <Field label="15 If rented, what is the monthly rent?">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.sbiFlatMonthlyRentIfRented || fields.monthlyRentIfRented || ''}
                  onChange={e => {
                    handleChange('sbiFlatMonthlyRentIfRented', e.target.value);
                    handleChange('monthlyRentIfRented', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="e.g. 15000 (or leave blank / 0 if not rented)"
                />
              </Field>
            </div>
          </Section>

      {/* ── Section 4: IV. MARKETABILITY (Color: Light Purple #f3e5f5) ── */}
      <Section id="sbi-flat-marketability" title="IV. MARKETABILITY" number="IV" defaultOpen={true}>
        <div style={{ backgroundColor: '#f3e5f5', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-purple-200">
          {/* Header Title inside light purple box */}
          <div className="border-b border-purple-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-purple-900 text-sm uppercase tracking-wider">
              IV. MARKETABILITY
            </h3>
            <span className="text-[11px] font-semibold text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full border border-purple-300">
              Marketability Assessment
            </span>
          </div>

          {/* 1 How is the marketability? */}
          <Field label="1 How is the marketability?">
            <select
              className={selectCls}
              value={fields.sbiFlatMarketabilityRating || fields.marketabilityRating || fields.marketability || 'Good'}
              onChange={e => {
                handleChange('sbiFlatMarketabilityRating', e.target.value);
                handleChange('marketabilityRating', e.target.value);
                handleChange('marketability', e.target.value);
              }}
              disabled={isReadOnly}
            >
              <option value="Good">Good</option>
              <option value="Very Good">Very Good</option>
              <option value="Excellent">Excellent</option>
              <option value="Fair">Fair</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </Field>

          {/* 2 What are the factors favoring for an extra Potential Value? */}
          <Field label="2 What are the factors favoring for an extra Potential Value?">
            <textarea
              className={inputCls + ' min-h-20'}
              value={fields.sbiFlatFactorsFavoringPotentialValue !== undefined ? fields.sbiFlatFactorsFavoringPotentialValue : (fields.factorsFavoringPotentialValue || '')}
              onChange={e => {
                handleChange('sbiFlatFactorsFavoringPotentialValue', e.target.value);
                handleChange('factorsFavoringPotentialValue', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. The subject property located in a developed Residential area. All civic amenities are located within 2-3 Km radius."
            />
          </Field>

          {/* 3 Any negative factors are observed which affect the market value in general? */}
          <Field label="3 Any negative factors are observed which affect the market value in general?">
            <textarea
              className={inputCls + ' min-h-20'}
              value={fields.sbiFlatNegativeFactorsObserved !== undefined ? fields.sbiFlatNegativeFactorsObserved : (fields.negativeFactorsObserved || '')}
              onChange={e => {
                handleChange('sbiFlatNegativeFactorsObserved', e.target.value);
                handleChange('negativeFactorsObserved', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Nothing Observed"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section 5: V. RATE (Color: Light Cyan #e0f7fa) ── */}
      <Section id="sbi-flat-rate" title="V. RATE" number="V" defaultOpen={true}>
        <div style={{ backgroundColor: '#e0f7fa', padding: '20px', borderRadius: '12px' }} className="space-y-6 border border-cyan-200">
          {/* Header Title inside light cyan box */}
          <div className="border-b border-cyan-300 pb-2 flex justify-between items-center">
            <h3 className="font-bold text-cyan-900 text-sm uppercase tracking-wider">
              V. RATE
            </h3>
            <span className="text-[11px] font-semibold text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded-full border border-cyan-300">
              Composite Rate & Valuation Break-up
            </span>
          </div>

          {/* 1 After analyzing the comparable sale instances... */}
          <Field label="1 After analyzing the comparable sale instances, what is the composite rate for a similar flat with same specifications in the adjoining locality?">
            <textarea
              className={inputCls + ' min-h-20'}
              value={fields.sbiFlatComparableSaleInstancesRate !== undefined ? fields.sbiFlatComparableSaleInstancesRate : (fields.comparableSaleInstancesRate || '')}
              onChange={e => {
                handleChange('sbiFlatComparableSaleInstancesRate', e.target.value);
                handleChange('comparableSaleInstancesRate', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Similar flats getting transacted in range of Rs.9800/- to Rs.10200/- Per Sft of SBA."
            />
          </Field>

          {/* 2 Assuming it is a new construction, what is the adopted basic composite rate... */}
          <Field label="2 Assuming it is a new construction, what is the adopted basic composite rate of the flat under valuation after comparing with specifications and other factors">
            <textarea
              className={inputCls + ' min-h-20'}
              value={fields.sbiFlatAdoptedBasicCompositeRate !== undefined ? fields.sbiFlatAdoptedBasicCompositeRate : (fields.adoptedBasicCompositeRate || '')}
              onChange={e => {
                handleChange('sbiFlatAdoptedBasicCompositeRate', e.target.value);
                handleChange('adoptedBasicCompositeRate', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. We have considered the market value as Rs.10000/- Per Sft of SBA."
            />
          </Field>

          {/* 3. Break - up for the rate (Building + Services, Land + Others) */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#495057] uppercase tracking-wider">
              3. Break - up for the rate (Building + Services, Land + Others)
            </div>
            <div className="grid md:grid-cols-2 gap-4 bg-white/70 p-4 rounded-xl border border-cyan-200">
              <Field label="i Building + Services (Rs. / Sft)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sbiFlatRateBreakupBuildingServices !== undefined ? fields.sbiFlatRateBreakupBuildingServices : (fields.rateBreakupBuildingServices || '')}
                  onChange={e => {
                    handleChange('sbiFlatRateBreakupBuildingServices', e.target.value);
                    handleChange('rateBreakupBuildingServices', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="2500"
                />
              </Field>
              <Field label="ii Land + Others (Rs. / Sft)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.sbiFlatRateBreakupLandOthers !== undefined ? fields.sbiFlatRateBreakupLandOthers : (fields.rateBreakupLandOthers || '')}
                  onChange={e => {
                    handleChange('sbiFlatRateBreakupLandOthers', e.target.value);
                    handleChange('rateBreakupLandOthers', e.target.value);
                  }}
                  disabled={isReadOnly}
                  placeholder="7500"
                />
              </Field>
            </div>
          </div>

          {/* 4. Guideline rate obtained from the Registrar's office */}
          <Field label="4. Guideline rate obtained from the Registrar's office (an evidence thereof to be enclosed)">
            <textarea
              className={inputCls + ' min-h-20'}
              value={fields.sbiFlatGuidelineRateLandText !== undefined ? fields.sbiFlatGuidelineRateLandText : (fields.guidelineRateLandText || '')}
              onChange={e => {
                handleChange('sbiFlatGuidelineRateLandText', e.target.value);
                handleChange('guidelineRateLandText', e.target.value);
              }}
              disabled={isReadOnly}
              placeholder="e.g. Rs.11,56,32,000/- Per Acre i.e. Rs.2655/- Per Sft | Total Value of UDS: 523.00 Sft X Rs.2655/- = Rs.13,88,565/-"
            />
          </Field>
        </div>
      </Section>

      {/* ── Section: Total Abstract Matrix ── */}
      <Section id="sbi-flat-abstract" title="Total Abstract for the Entire Property" number={7} defaultOpen={true}>
        <div className="grid md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
          <Field label="Govt. Value of Land (Rs.)">
            <input
              className={inputCls}
              value={fields.abstractGovtValueLand}
              onChange={(e) => handleChange('abstractGovtValueLand', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Market Value (Rs.)">
            <input
              className={inputCls + ' font-bold text-slate-900'}
              value={fields.abstractMarketValue}
              onChange={(e) => handleChange('abstractMarketValue', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Realizable Value (%)">
            <div className="space-y-1">
              <input
                className={inputCls}
                value={fields.abstractRealizablePct}
                onChange={(e) => handleChange('abstractRealizablePct', e.target.value)}
                disabled={isReadOnly}
                placeholder="100 (Default)"
              />
              <input
                className={inputCls}
                value={fields.abstractRealizableValue}
                onChange={(e) => handleChange('abstractRealizableValue', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </Field>
          <Field label="Distress Value (%)">
            <div className="space-y-1">
              <input
                className={inputCls}
                value={fields.abstractDistressPct}
                onChange={(e) => handleChange('abstractDistressPct', e.target.value)}
                disabled={isReadOnly}
                placeholder="100 (Default)"
              />
              <input
                className={inputCls}
                value={fields.abstractDistressValue}
                onChange={(e) => handleChange('abstractDistressValue', e.target.value)}
                disabled={isReadOnly}
              />
            </div>
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Remarks & Observations">
            <textarea
              className={inputCls + ' min-h-20'}
              value={fields.remarksText}
              onChange={(e) => handleChange('remarksText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section: Base Documents ── */}
      <BaseDocumentsSection
        title="Documents"
        documentImages={fields.documentImages || []}
        documentImageNames={fields.documentImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={8}
        sectionId="section-documents"
      />

      {/* ── Section: Base Maps ── */}
      <BaseMapsSection
        title="Maps"
        locationMapImages={fields.locationMapImages || []}
        mouzaMapImages={fields.mouzaMapImages || []}
        sketchMapImages={fields.sketchMapImages || []}
        cadastralMapImages={fields.cadastralMapImages || []}
        bdaMapImages={fields.bdaMapImages || []}
        latitude={fields.latitude}
        longitude={fields.longitude}
        technicalAddress={fields.postalAddress || ''}
        propertyAddress={fields.propertyDescription || ''}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={9}
        sectionId="section-maps"
      />

      {/* ── Section: Photographs ── */}
      <BasePhotographsSection
        title="Property Photographs"
        propertyImages={fields.propertyImages || []}
        propertyImageNames={fields.propertyImageNames || []}
        isReadOnly={isReadOnly}
        uploading={false}
        sectionNumber={10}
        sectionId="section-photographs"
      />
        </div>

        {/* ── Right Sections Nav Panel ── */}
        <FloatingNavigator sections={NAV_SECTIONS} />
      </div>

      {/* ── Standard Sticky Bottom Action Bar with 4 Buttons ── */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={saving ? 'saving' : saveSuccess ? 'saved' : 'idle'}
        loading={saving}
        onSaveDraft={handleSaveInternal}
        onSubmit={handleSubmitInternal}
        onPreviewPDF={handlePreviewPdfInternal}
        onDownloadPDF={handleDownloadPdfInternal}
      />
    </div>
  );
}
