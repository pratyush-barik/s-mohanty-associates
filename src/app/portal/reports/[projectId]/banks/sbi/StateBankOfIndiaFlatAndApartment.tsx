'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft } from '@/app/actions/project';
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
} from '../BaseBankReportComponents';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';
import { Lock, Plus, Trash2 } from 'lucide-react';

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
  getPDFRenderer: (data, projectCode) => {
    const { PDFSBIRenderer } = require('@/lib/banks/pdf-sbi-above-5cr-renderer');
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
      // Mode Toggle: 'FLAT' | 'LAND_AND_BUILDING'
      propertyValuationType: saved.propertyValuationType || 'FLAT',

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

      // ── FLAT SPECIFIC DEFAULTS ──
      natureOfApartment: saved.natureOfApartment !== undefined ? saved.natureOfApartment : 'Residential Apartment',
      aptLocationTsNo: saved.aptLocationTsNo !== undefined ? saved.aptLocationTsNo : '',
      aptLocationBlockNo: saved.aptLocationBlockNo !== undefined ? saved.aptLocationBlockNo : 'Tower-A',
      aptLocationWardNo: saved.aptLocationWardNo !== undefined ? saved.aptLocationWardNo : 'Not Applicable',
      aptLocationVillageCorp: saved.aptLocationVillageCorp !== undefined ? saved.aptLocationVillageCorp : 'Within Municipal Corporation area limit',
      aptLocationDoorRoadPin: saved.aptLocationDoorRoadPin !== undefined ? saved.aptLocationDoorRoadPin : '',
      localityDescription: saved.localityDescription !== undefined ? saved.localityDescription : 'Residential',
      yearOfConstruction: saved.yearOfConstruction !== undefined ? saved.yearOfConstruction : '2010',
      numberOfFloors: saved.numberOfFloors !== undefined ? saved.numberOfFloors : 'B+G+16 Storied',
      typeOfStructure: saved.typeOfStructure !== undefined ? saved.typeOfStructure : 'RCC Frame Structure',
      dwellingUnitsCount: saved.dwellingUnitsCount !== undefined ? saved.dwellingUnitsCount : 'Not Verified',
      qualityOfConstruction: saved.qualityOfConstruction !== undefined ? saved.qualityOfConstruction : 'Good',
      appearanceOfBuilding: saved.appearanceOfBuilding !== undefined ? saved.appearanceOfBuilding : 'Good',
      maintenanceOfBuilding: saved.maintenanceOfBuilding !== undefined ? saved.maintenanceOfBuilding : 'Good',
      facilityLift: saved.facilityLift !== undefined ? saved.facilityLift : 'Yes',
      facilityWaterSupply: saved.facilityWaterSupply !== undefined ? saved.facilityWaterSupply : 'Yes',
      facilitySewerage: saved.facilitySewerage !== undefined ? saved.facilitySewerage : 'Yes',
      facilityCarParking: saved.facilityCarParking !== undefined ? saved.facilityCarParking : 'Covered parking',
      facilityCompoundWall: saved.facilityCompoundWall !== undefined ? saved.facilityCompoundWall : 'Yes',
      facilityPavement: saved.facilityPavement !== undefined ? saved.facilityPavement : 'Yes',

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

      marketabilityRating: saved.marketabilityRating !== undefined ? saved.marketabilityRating : 'Good',
      factorsFavoringPotentialValue: saved.factorsFavoringPotentialValue !== undefined ? saved.factorsFavoringPotentialValue : 'The subject property located in a developed Residential area. All civic amenities are located within 2-3 Km radius.',
      negativeFactorsObserved: saved.negativeFactorsObserved !== undefined ? saved.negativeFactorsObserved : 'Nothing Observed',

      comparableSaleInstancesRate: saved.comparableSaleInstancesRate !== undefined ? saved.comparableSaleInstancesRate : 'Similar flats getting transacted in range of Rs.9800/- to Rs.10200/- Per Sft of SBA.',
      adoptedBasicCompositeRate: saved.adoptedBasicCompositeRate !== undefined ? saved.adoptedBasicCompositeRate : 'We have considered the market value as Rs.10000/- Per Sft of SBA.',
      rateBreakupBuildingServices: saved.rateBreakupBuildingServices !== undefined ? saved.rateBreakupBuildingServices : 'Rs.2500/- Per Sft',
      rateBreakupLandOthers: saved.rateBreakupLandOthers !== undefined ? saved.rateBreakupLandOthers : 'Rs.7500/- Per Sft',
      guidelineRateLandText: saved.guidelineRateLandText !== undefined ? saved.guidelineRateLandText : 'Rs.11,56,32,000/- Per Acre i.e. Rs.2655/- Per Sft | Total Value of UDS: 523.00 Sft X Rs.2655/- = Rs.13,88,565/-',

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

  const handleDownloadPdfInternal = async () => {
    try {
      const { PDFSBIRenderer } = require('@/lib/banks/pdf-sbi-above-5cr-renderer');
      const renderer = new PDFSBIRenderer(fields, projectCode);
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SBI_Above_5CR_${fields.propertyValuationType}_${projectCode || projectId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Error generating SBI PDF:', e);
    }
  };

  const isFlat = fields.propertyValuationType !== 'LAND_AND_BUILDING';

  return (
    <div className="space-y-6 pb-24">
      {/* ── Top Header Card with Dynamic Mode Toggle ── */}
      <div className="card p-6 bg-white border border-slate-200 shadow-xs rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              STATE BANK OF INDIA (SBI) — Flat & Apartment
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {isFlat ? '🏢 Flat / Apartment Format' : '🏡 Land & Building Format'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Valuation Report Questionnaire</h2>
          <p className="text-xs text-slate-500">
            Standard Statutory Bank Format addressing Asst. General Manager with full schedules.
          </p>
        </div>

        {/* Property Type Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div className="flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => handleChange('propertyValuationType', 'FLAT')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isFlat
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏢 Flat / Apartment
            </button>
            <button
              type="button"
              onClick={() => handleChange('propertyValuationType', 'LAND_AND_BUILDING')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !isFlat
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏡 Land & Building
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveInternal}
            disabled={saving || isReadOnly}
            className="btn btn-secondary text-xs px-4 py-2"
          >
            {saving ? 'Saving...' : saveSuccess ? '✓ Saved' : 'Save Draft'}
          </button>
          <button
            type="button"
            onClick={handleDownloadPdfInternal}
            className="btn btn-primary text-xs px-4 py-2 flex items-center gap-2"
          >
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ── Section 1: I. GENERAL (Color: Light Blue #e3f2fd) ── */}
      <Section title="I. GENERAL" number="I" defaultOpen={true}>
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
            fallbackValue={fields.purposeOfValuation || prefill?.purposeOfValuation || 'To assess the present Market Value of the Property for Loan purpose'}
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
              fallbackValue={fields.valuationDate || fields.reportDate || prefill?.reportDate || '06.08.2026'}
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
            fallbackValue={fields.ownerNameAndAddress || (prefill?.propertyOwner ? `${prefill.propertyOwner}, At: ${prefill.propertyAddress || ''}, Ph: ${prefill.customerPhone || ''}` : 'Mr. Srijit Mishra, S/o: Mr. Gopinath Mishra, Ph: 9861012345')}
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

      {/* ── Section 2: General & Location Details (Points 6-21) ── */}
      <Section title="General, Location & Boundaries" number={2} defaultOpen={true}>
        <div className="grid md:grid-cols-4 gap-3">
          <Field label="Plot / Survey No.">
            <input
              className={inputCls}
              value={fields.plotNo}
              onChange={(e) => handleChange('plotNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Door No.">
            <input
              className={inputCls}
              value={fields.doorNo}
              onChange={(e) => handleChange('doorNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Mouza / Village / T.S. No">
            <input
              className={inputCls}
              value={fields.tsNoVillage}
              onChange={(e) => handleChange('tsNoVillage', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="District">
            <input
              className={inputCls}
              value={fields.mandalDistrict}
              onChange={(e) => handleChange('mandalDistrict', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>

        {/* Boundaries Dual Columns */}
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">3 / 13. Boundaries of the Property</h4>
        <div className="space-y-2 mt-2">
          {['East', 'West', 'North', 'South'].map((dir) => {
            const vKey = `boundary${dir}Verification`;
            const dKey = `boundary${dir}Document`;
            return (
              <div key={dir} className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-medium text-slate-700">{dir}</span>
                <input
                  className={inputCls + ' !py-1.5 text-xs'}
                  value={fields[dKey] || ''}
                  onChange={(e) => handleChange(dKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="As per Document"
                />
                <input
                  className={inputCls + ' !py-1.5 text-xs'}
                  value={fields[vKey] || ''}
                  onChange={(e) => handleChange(vKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="As per Verification"
                />
              </div>
            );
          })}
        </div>

        {/* Dimensions Dual Columns */}
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">14.1 Dimensions of the Site</h4>
        <div className="space-y-2 mt-2">
          {['East', 'West', 'North', 'South'].map((dir) => {
            const deedKey = `dimension${dir}Deed`;
            const actKey = `dimension${dir}Actual`;
            return (
              <div key={dir} className="grid grid-cols-3 gap-2 items-center">
                <span className="text-xs font-medium text-slate-700">{dir}</span>
                <input
                  className={inputCls + ' !py-1.5 text-xs'}
                  value={fields[deedKey] || ''}
                  onChange={(e) => handleChange(deedKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="A - As per Deed"
                />
                <input
                  className={inputCls + ' !py-1.5 text-xs'}
                  value={fields[actKey] || ''}
                  onChange={(e) => handleChange(actKey, e.target.value)}
                  disabled={isReadOnly}
                  placeholder="B - Actual"
                />
              </div>
            );
          })}
        </div>

        <div className="grid md:grid-cols-3 gap-3 mt-4">
          <Field label="14.2 Coordinates Text">
            <input
              className={inputCls}
              value={fields.coordinatesText}
              onChange={(e) => handleChange('coordinatesText', e.target.value)}
              disabled={isReadOnly}
              placeholder="Latitude: 20.251088, Longitude: 85.787390"
            />
          </Field>
          <Field label="15. Extent of Site / Project">
            <input
              className={inputCls}
              value={fields.extentOfProjectSite}
              onChange={(e) => handleChange('extentOfProjectSite', e.target.value)}
              disabled={isReadOnly}
              placeholder="Total Area: Ac.0.115 Dec i.e. 5009.00 Sft"
            />
          </Field>
          <Field label="16. Extent Considered for Valuation (least of 14 A & 14 B)">
            <input
              className={inputCls}
              value={fields.extentConsideredValuation}
              onChange={(e) => handleChange('extentConsideredValuation', e.target.value)}
              disabled={isReadOnly}
              placeholder="Not Applicable / Extent Sft"
            />
          </Field>
        </div>
      </Section>

      {/* ── Mode A: Flat / Apartment Specific Sections ── */}
      {isFlat ? (
        <>
          <Section title="II. Apartment Building & Facilities" number={3} defaultOpen={false}>
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Nature of Apartment">
                <input
                  className={inputCls}
                  value={fields.natureOfApartment}
                  onChange={(e) => handleChange('natureOfApartment', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Year of Construction">
                <input
                  className={inputCls}
                  value={fields.yearOfConstruction}
                  onChange={(e) => handleChange('yearOfConstruction', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Number of Floors">
                <input
                  className={inputCls}
                  value={fields.numberOfFloors}
                  onChange={(e) => handleChange('numberOfFloors', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Type of Structure">
                <input
                  className={inputCls}
                  value={fields.typeOfStructure}
                  onChange={(e) => handleChange('typeOfStructure', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          <Section title="III. Flat Specifications & Area" number={4} defaultOpen={true}>
            <div className="grid md:grid-cols-4 gap-3">
              <Field label="Floor Number">
                <input
                  className={inputCls}
                  value={fields.flatFloorNumber}
                  onChange={(e) => handleChange('flatFloorNumber', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Door / Flat No.">
                <input
                  className={inputCls}
                  value={fields.flatDoorNumber}
                  onChange={(e) => handleChange('flatDoorNumber', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Super Built-up Area (Sft)">
                <input
                  className={inputCls + ' font-bold text-blue-700'}
                  value={fields.superBuiltUpArea}
                  onChange={(e) => handleChange('superBuiltUpArea', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="1375.00"
                />
              </Field>
              <Field label="Carpet Area">
                <input
                  className={inputCls}
                  value={fields.carpetArea}
                  onChange={(e) => handleChange('carpetArea', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          <Section title="VI. Rate, Composite Depreciation & Flat Valuation" number={5} defaultOpen={true}>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Rate: Building + Services (Rs./Sft)">
                <input
                  className={inputCls}
                  value={fields.finalDepreciatedBuildingRate}
                  onChange={(e) => handleChange('finalDepreciatedBuildingRate', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="2125"
                />
              </Field>
              <Field label="Rate: Land & Others (Rs./Sft)">
                <input
                  className={inputCls}
                  value={fields.finalRateLandOther}
                  onChange={(e) => handleChange('finalRateLandOther', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="7500"
                />
              </Field>
              <Field label="Total Composite Rate (Rs./Sft)">
                <input
                  className={inputCls + ' font-bold text-emerald-700'}
                  value={fields.finalTotalCompositeRate}
                  onChange={(e) => handleChange('finalTotalCompositeRate', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="9625"
                />
              </Field>
            </div>

            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mt-4">Details of Valuation (10 Items)</h4>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="1. Flat Present Value">
                <input
                  className={inputCls + ' font-bold'}
                  value={fields.valFlatPresentValue}
                  onChange={(e) => handleChange('valFlatPresentValue', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="2. Car Parking Space in LS">
                <input
                  className={inputCls}
                  value={fields.valCarParking}
                  onChange={(e) => handleChange('valCarParking', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Total Estimated Flat Value">
                <input
                  className={inputCls + ' font-bold bg-slate-50 text-blue-700'}
                  value={fields.valTotalEstimated}
                  onChange={(e) => handleChange('valTotalEstimated', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>
        </>
      ) : (
        /* ── Mode B: Land & Building Specific Sections ── */
        <>
          <Section title="II. Characteristics of the Site (19 Parameters)" number={3} defaultOpen={false}>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Classification of Locality">
                <input
                  className={inputCls}
                  value={fields.siteClassificationLocality}
                  onChange={(e) => handleChange('siteClassificationLocality', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Road Facilities Available">
                <input
                  className={inputCls}
                  value={fields.siteRoadFacilities}
                  onChange={(e) => handleChange('siteRoadFacilities', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
              <Field label="Width of Road">
                <input
                  className={inputCls}
                  value={fields.siteRoadWidth}
                  onChange={(e) => handleChange('siteRoadWidth', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>
          </Section>

          <Section title="Part A & B: Land and Building Valuation" number={4} defaultOpen={true}>
            <div className="grid md:grid-cols-3 gap-3">
              <Field label="Land Market Value (Rs.)">
                <input
                  className={inputCls + ' font-bold text-slate-900'}
                  value={fields.abstractMarketLand}
                  onChange={(e) => handleChange('abstractMarketLand', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Rs. 1,75,31,500.00"
                />
              </Field>
              <Field label="Building Net Value (Rs.)">
                <input
                  className={inputCls + ' font-bold text-slate-900'}
                  value={fields.abstractMarketBldg}
                  onChange={(e) => handleChange('abstractMarketBldg', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Rs. 1,27,02,792.00"
                />
              </Field>
              <Field label="Total Market Value (Rs.)">
                <input
                  className={inputCls + ' font-bold text-emerald-700 bg-emerald-50'}
                  value={fields.abstractMarketTotal}
                  onChange={(e) => handleChange('abstractMarketTotal', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Rs. 3,02,34,292.00"
                />
              </Field>
            </div>
          </Section>
        </>
      )}

      {/* ── Section: Method of Valuation Box ── */}
      <Section title="Method of Valuation Procedure" number={6} defaultOpen={false}>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Procedure Adopted Guidance (Left Box)">
            <textarea
              className={inputCls + ' min-h-[90px] text-xs bg-slate-50'}
              value={fields.methodOfValuationProcedure}
              onChange={(e) => handleChange('methodOfValuationProcedure', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Adopted Valuation Methodology (Right Box)">
            <textarea
              className={inputCls + ' min-h-[90px] text-xs'}
              value={fields.methodOfValuationText}
              onChange={(e) => handleChange('methodOfValuationText', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </Section>

      {/* ── Section: Total Abstract Matrix ── */}
      <Section title="Total Abstract for the Entire Property" number={7} defaultOpen={true}>
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
              className={inputCls + ' min-h-[80px]'}
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
  );
}
