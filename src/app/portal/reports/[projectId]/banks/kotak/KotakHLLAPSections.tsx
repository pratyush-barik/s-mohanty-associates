'use client';

import React from 'react';
import {
  Section,
  Field,
  BaseDateInput,
  inputCls,
  selectCls,
  textareaCls,
  BaseDocumentsSection,
  BaseMapsSection,
  BasePhotographsSection,
  ReportActionBar,
  BasePhotoBucketModal,
} from '../BaseBankReportComponents';
import {
  KotakHLLAPFields,
  KotakHLLAPCategory,
  KotakBoundaryVerificationRow,
  KOTAK_DECLARATION_CLAUSES,
} from './KotakHLLAPTypes';
import { Building2, Home, Factory, Trees, ShieldAlert, Sparkles, MapPin, FileCheck } from 'lucide-react';

interface SharedSectionProps {
  fields: KotakHLLAPFields;
  handleChange: (key: keyof KotakHLLAPFields, value: any) => void;
  isReadOnly?: boolean;
}

/**
 * Top Tab Bar to switch between the 5 Dedicated Kotak HL-LAP Builders
 */
export function KotakCategoryTabBar({
  currentCategory,
  onCategoryChange,
  isReadOnly = false,
}: {
  currentCategory: KotakHLLAPCategory;
  onCategoryChange?: (category: KotakHLLAPCategory) => void;
  isReadOnly?: boolean;
}) {
  const categories: { id: KotakHLLAPCategory; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: 'FLAT', label: 'Flat / Apartment', icon: <Building2 className="w-4 h-4" />, desc: 'Multi-storey / Apartment Method' },
    { id: 'IND', label: 'Industrial Property', icon: <Factory className="w-4 h-4" />, desc: 'Industrial Shed & Land Method' },
    { id: 'L&B', label: 'Land & Building', icon: <Home className="w-4 h-4" />, desc: 'Independent Land + Structure with Depreciation' },
    { id: 'RES-COM', label: 'Residential cum Comm.', icon: <Sparkles className="w-4 h-4" />, desc: 'Mixed-Use Residential + Commercial Unit' },
    { id: 'VL', label: 'Vacant Land', icon: <Trees className="w-4 h-4" />, desc: 'Land Only (No Structure / No Insurable)' },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-100">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Kotak Mahindra Bank HL-LAP Report Format
          </span>
          <h2 className="text-sm font-semibold text-slate-800">
            Selected Category: <span className="text-amber-600 font-bold">{categories.find(c => c.id === currentCategory)?.label}</span>
          </h2>
        </div>
        <span className="text-[11px] text-slate-500 italic">
          Switching category reconfigures valuation calculation and PDF output layout.
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {categories.map((c) => {
          const isActive = currentCategory === c.id;
          return (
            <button
              key={c.id}
              type="button"
              disabled={isReadOnly}
              onClick={() => onCategoryChange && onCategoryChange(c.id)}
              className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm font-semibold'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              } ${isReadOnly ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <div className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                {c.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{c.label}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Section 1: General Details
 */
export function KotakGeneralSection({
  fields,
  handleChange,
  isReadOnly = false,
  isVacantLand = false,
}: SharedSectionProps & { isVacantLand?: boolean }) {
  return (
    <Section title="1. GENERAL DETAILS" defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Date of Valuation (DD/MM/YYYY)">
          <input
            type="text"
            className={inputCls}
            value={fields.dateOfValuation || ''}
            onChange={(e) => handleChange('dateOfValuation', e.target.value)}
            disabled={isReadOnly}
            placeholder="DD/MM/YYYY"
          />
        </Field>

        <Field label="Purpose Of Loan">
          <input
            type="text"
            className={inputCls}
            value={fields.purposeOfLoan || ''}
            onChange={(e) => handleChange('purposeOfLoan', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Date of Technical Visit (DD/MM/YYYY)">
          <input
            type="text"
            className={inputCls}
            value={fields.dateOfTechnicalVisit || ''}
            onChange={(e) => handleChange('dateOfTechnicalVisit', e.target.value)}
            disabled={isReadOnly}
            placeholder="DD/MM/YYYY"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <Field label="Customer Name and Contact No.">
          <input
            type="text"
            className={inputCls}
            value={fields.customerNameAndContact || ''}
            onChange={(e) => handleChange('customerNameAndContact', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Name of document holder as per legal docs">
          <input
            type="text"
            className={inputCls}
            value={fields.nameOfDocumentHolder || ''}
            onChange={(e) => handleChange('nameOfDocumentHolder', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        {!isVacantLand && (
          <Field label="Name of the Project / Building / Society">
            <input
              type="text"
              className={inputCls}
              value={fields.nameOfProjectSociety || ''}
              onChange={(e) => handleChange('nameOfProjectSociety', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        )}

        <Field label="Builder / Seller Name and RERA ID">
          <input
            type="text"
            className={inputCls}
            value={fields.builderSellerNameAndRera || ''}
            onChange={(e) => handleChange('builderSellerNameAndRera', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Person(s) Met on Site [Name & Designation]">
          <input
            type="text"
            className={inputCls}
            value={fields.personMetOnSite || ''}
            onChange={(e) => handleChange('personMetOnSite', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Postal Address">
          <textarea
            className={textareaCls}
            rows={2}
            value={fields.postalAddress || ''}
            onChange={(e) => handleChange('postalAddress', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>
    </Section>
  );
}

/**
 * Section 2: Details of the Property
 */
export function KotakPropertySection({
  fields,
  handleChange,
  isReadOnly = false,
  isVacantLand = false,
}: SharedSectionProps & { isVacantLand?: boolean }) {
  const phys = fields.physicalAddress || {
    plotOrFlatNo: '',
    floorNo: '',
    wingNo: '',
    buildingName: '',
    sectorLocality: '',
    landmark: '',
    city: 'Bhubaneswar',
    pinCode: '',
  };

  const tech = fields.technicalAddress || {
    khataNo: '',
    plotNo: '',
    mouza: '',
    tahasil: '',
    district: 'Khordha',
  };

  const updatePhys = (key: keyof typeof phys, val: string) => {
    handleChange('physicalAddress', { ...phys, [key]: val });
  };

  const updateTech = (key: keyof typeof tech, val: string) => {
    handleChange('technicalAddress', { ...tech, [key]: val });
  };

  return (
    <Section title="2. DETAILS OF THE PROPERTY" defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Flat / House / Plot No.">
          <input
            type="text"
            className={inputCls}
            value={fields.flatHousePlotNo || ''}
            onChange={(e) => handleChange('flatHousePlotNo', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Property Type">
          <input
            type="text"
            className={inputCls}
            value={fields.propertyType || ''}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Valuation Method">
          <input
            type="text"
            className={inputCls}
            value={fields.valuationMethod || ''}
            onChange={(e) => handleChange('valuationMethod', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      {!isVacantLand ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
            <Field label="Construction Status">
              <select
                className={selectCls}
                value={fields.constructionStatus || 'Completed'}
                onChange={(e) => handleChange('constructionStatus', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Completed">Completed</option>
                <option value="Under Construction">Under Construction</option>
                <option value="Proposed">Proposed</option>
              </select>
            </Field>

            <Field label="Stage of Construction (in %)">
              <input
                type="text"
                className={inputCls}
                value={fields.stageOfConstructionPct || ''}
                onChange={(e) => handleChange('stageOfConstructionPct', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 100%"
              />
            </Field>

            <Field label="Year Built / Age of Property">
              <input
                type="text"
                className={inputCls}
                value={fields.yearBuiltAge || ''}
                onChange={(e) => handleChange('yearBuiltAge', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 5 Years"
              />
            </Field>

            <Field label="Residual Age of Property">
              <input
                type="text"
                className={inputCls}
                value={fields.residualAge || ''}
                onChange={(e) => handleChange('residualAge', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 55 Years"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <Field label="Occupancy Details">
              <select
                className={selectCls}
                value={fields.occupancyDetails || 'Self Occupied'}
                onChange={(e) => handleChange('occupancyDetails', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="Self Occupied">Self Occupied</option>
                <option value="Tenanted">Tenanted</option>
                <option value="Vacant">Vacant</option>
              </select>
            </Field>

            <Field label="Vacancy / Tenant Tenure">
              <input
                type="text"
                className={inputCls}
                value={fields.vacancyTenantTenure || ''}
                onChange={(e) => handleChange('vacancyTenantTenure', e.target.value)}
                disabled={isReadOnly}
                placeholder="NA or Lease Tenure"
              />
            </Field>

            <Field label="No. of Stories">
              <input
                type="text"
                className={inputCls}
                value={fields.noOfStories || ''}
                onChange={(e) => handleChange('noOfStories', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. G+4 or G+1"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
            <Field label="Comment on No. of Stories">
              <input
                type="text"
                className={inputCls}
                value={fields.commentOnNoOfStories || ''}
                onChange={(e) => handleChange('commentOnNoOfStories', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Total units in building">
              <input
                type="text"
                className={inputCls}
                value={fields.totalUnitsMultiStorey || ''}
                onChange={(e) => handleChange('totalUnitsMultiStorey', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Units on each floor">
              <input
                type="text"
                className={inputCls}
                value={fields.noOfUnitsEachFloor || ''}
                onChange={(e) => handleChange('noOfUnitsEachFloor', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Unit Details (e.g. 3 BHK)">
              <input
                type="text"
                className={inputCls}
                value={fields.unitDetails || ''}
                onChange={(e) => handleChange('unitDetails', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Field label="Amenities available (e.g. Roads)">
            <input
              type="text"
              className={inputCls}
              value={fields.amenitiesAvailable || 'Roads'}
              onChange={(e) => handleChange('amenitiesAvailable', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          <Field label="Encroachment on public land">
            <select
              className={selectCls}
              value={fields.encroachmentOnPublicLand || 'No'}
              onChange={(e) => handleChange('encroachmentOnPublicLand', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </Field>
        </div>
      )}

      {/* Sub-Table 1: Physical Address (Site Visit) */}
      <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold text-xs uppercase tracking-wider">
          <MapPin className="w-4 h-4 text-amber-600" />
          <span>Physical Address (as per Site Visit)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Plot / Flat / Door No.">
            <input
              type="text"
              className={inputCls}
              value={phys.plotOrFlatNo}
              onChange={(e) => updatePhys('plotOrFlatNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Floor No.">
            <input
              type="text"
              className={inputCls}
              value={phys.floorNo}
              onChange={(e) => updatePhys('floorNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Wing No.">
            <input
              type="text"
              className={inputCls}
              value={phys.wingNo}
              onChange={(e) => updatePhys('wingNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Building Name">
            <input
              type="text"
              className={inputCls}
              value={phys.buildingName}
              onChange={(e) => updatePhys('buildingName', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Sector / Area / Locality">
            <input
              type="text"
              className={inputCls}
              value={phys.sectorLocality}
              onChange={(e) => updatePhys('sectorLocality', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Landmark">
            <input
              type="text"
              className={inputCls}
              value={phys.landmark}
              onChange={(e) => updatePhys('landmark', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="City">
            <input
              type="text"
              className={inputCls}
              value={phys.city}
              onChange={(e) => updatePhys('city', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Pin Code">
            <input
              type="text"
              className={inputCls}
              value={phys.pinCode}
              onChange={(e) => updatePhys('pinCode', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </div>

      {/* Sub-Table 2: Technical Address */}
      <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold text-xs uppercase tracking-wider">
          <FileCheck className="w-4 h-4 text-blue-600" />
          <span>Technical Address of Property</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Field label="Khata No.">
            <input
              type="text"
              className={inputCls}
              value={tech.khataNo}
              onChange={(e) => updateTech('khataNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Plot No.">
            <input
              type="text"
              className={inputCls}
              value={tech.plotNo}
              onChange={(e) => updateTech('plotNo', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Mouza">
            <input
              type="text"
              className={inputCls}
              value={tech.mouza}
              onChange={(e) => updateTech('mouza', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Tahasil">
            <input
              type="text"
              className={inputCls}
              value={tech.tahasil}
              onChange={(e) => updateTech('tahasil', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="District">
            <input
              type="text"
              className={inputCls}
              value={tech.district}
              onChange={(e) => updateTech('district', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <Field label="Legal Address of Property">
          <textarea
            className={textareaCls}
            rows={2}
            value={fields.legalAddressOfProperty || ''}
            onChange={(e) => handleChange('legalAddressOfProperty', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        {!isVacantLand && (
          <Field label="Permissible use of building">
            <input
              type="text"
              className={inputCls}
              value={fields.permissibleUseOfBuilding || ''}
              onChange={(e) => handleChange('permissibleUseOfBuilding', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        )}
      </div>
    </Section>
  );
}

/**
 * Section 3: Surroundings, Accessibility & Proximity to Civic Amenities
 */
export function KotakSurroundingsSection({
  fields,
  handleChange,
  isReadOnly = false,
}: SharedSectionProps) {
  const compRows: KotakBoundaryVerificationRow[] = fields.boundaryComparison || [
    { direction: 'North', asPerSite: '', asPerDeed: '', asPerSketchMap: '' },
    { direction: 'South', asPerSite: '', asPerDeed: '', asPerSketchMap: '' },
    { direction: 'East', asPerSite: '', asPerDeed: '', asPerSketchMap: '' },
    { direction: 'West', asPerSite: '', asPerDeed: '', asPerSketchMap: '' },
  ];

  const updateComp = (idx: number, field: keyof KotakBoundaryVerificationRow, val: string) => {
    const updated = [...compRows];
    updated[idx] = { ...updated[idx], [field]: val };
    handleChange('boundaryComparison', updated);
  };

  return (
    <Section title="3. SURROUNDINGS, ACCESSIBILITY & PROXIMITY TO CIVIC AMENITIES" defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Field label="Nearest Railway Station">
          <input
            type="text"
            className={inputCls}
            value={fields.nearestRailwayStation || ''}
            onChange={(e) => handleChange('nearestRailwayStation', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Nearest Bus Stand">
          <input
            type="text"
            className={inputCls}
            value={fields.nearestBusStand || ''}
            onChange={(e) => handleChange('nearestBusStand', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Nearest Hospital">
          <input
            type="text"
            className={inputCls}
            value={fields.nearestHospital || ''}
            onChange={(e) => handleChange('nearestHospital', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Nearest Airport">
          <input
            type="text"
            className={inputCls}
            value={fields.nearestAirport || ''}
            onChange={(e) => handleChange('nearestAirport', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        <Field label="Conditions of Approach Road">
          <input
            type="text"
            className={inputCls}
            value={fields.conditionOfApproachRoad || ''}
            onChange={(e) => handleChange('conditionOfApproachRoad', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Access to Property">
          <input
            type="text"
            className={inputCls}
            value={fields.accessToProperty || ''}
            onChange={(e) => handleChange('accessToProperty', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Nearby Landmark">
          <input
            type="text"
            className={inputCls}
            value={fields.nearbyLandmark || ''}
            onChange={(e) => handleChange('nearbyLandmark', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
        <Field label="Classification of Area">
          <input
            type="text"
            className={inputCls}
            value={fields.classificationOfArea || ''}
            onChange={(e) => handleChange('classificationOfArea', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Condition of Locality">
          <input
            type="text"
            className={inputCls}
            value={fields.conditionOfLocality || ''}
            onChange={(e) => handleChange('conditionOfLocality', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Classification / Type of Locality">
          <input
            type="text"
            className={inputCls}
            value={fields.classificationTypeOfLocality || ''}
            onChange={(e) => handleChange('classificationTypeOfLocality', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Development of surrounding areas">
          <input
            type="text"
            className={inputCls}
            value={fields.developmentOfSurroundingAreas || ''}
            onChange={(e) => handleChange('developmentOfSurroundingAreas', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        <Field label="Does property fall in Municipal Limits?">
          <select
            className={selectCls}
            value={fields.withinMunicipalLimits || 'Yes (BMC Limits)'}
            onChange={(e) => handleChange('withinMunicipalLimits', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Yes (BMC Limits)">Yes (BMC Limits)</option>
            <option value="Yes (CMC Limits)">Yes (CMC Limits)</option>
            <option value="Yes (Gram Panchayat)">Yes (Gram Panchayat)</option>
            <option value="No">No</option>
          </select>
        </Field>

        <Field label="Any board of other bank indicating mortgage?">
          <select
            className={selectCls}
            value={fields.boardOfOtherBankIndicatingMortgage || 'No'}
            onChange={(e) => handleChange('boardOfOtherBankIndicatingMortgage', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </Field>

        <Field label="Plot / Property Demarcated at Site Mandatory">
          <input
            type="text"
            className={inputCls}
            value={fields.plotDemarcatedAtSite || 'Yes, bounded by boundary walls'}
            onChange={(e) => handleChange('plotDemarcatedAtSite', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="mt-3">
        <Field label="Property Identified Through">
          <input
            type="text"
            className={inputCls}
            value={fields.propertyIdentifiedThrough || 'Boundaries matching site inspection & deed'}
            onChange={(e) => handleChange('propertyIdentifiedThrough', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      {/* Surroundings as per Site Visit */}
      <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block mb-2">
          Boundaries as per Physical Site Inspection
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="North">
            <input
              type="text"
              className={inputCls}
              value={fields.surroundingsSiteNorth || ''}
              onChange={(e) => handleChange('surroundingsSiteNorth', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="South">
            <input
              type="text"
              className={inputCls}
              value={fields.surroundingsSiteSouth || ''}
              onChange={(e) => handleChange('surroundingsSiteSouth', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="East">
            <input
              type="text"
              className={inputCls}
              value={fields.surroundingsSiteEast || ''}
              onChange={(e) => handleChange('surroundingsSiteEast', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="West">
            <input
              type="text"
              className={inputCls}
              value={fields.surroundingsSiteWest || ''}
              onChange={(e) => handleChange('surroundingsSiteWest', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </div>

      {/* Legal Boundaries Comparison Table */}
      <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-800 block mb-3">
          Boundary Comparison (Site vs Deed vs Sketch Map)
        </span>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold">
                <th className="p-2 border border-slate-200 text-left w-24">Direction</th>
                <th className="p-2 border border-slate-200 text-left">As per Site</th>
                <th className="p-2 border border-slate-200 text-left">As per Deed</th>
                <th className="p-2 border border-slate-200 text-left">As per Sketch Map</th>
              </tr>
            </thead>
            <tbody>
              {compRows.map((r, i) => (
                <tr key={r.direction} className="hover:bg-slate-50">
                  <td className="p-2 border border-slate-200 font-bold bg-slate-50">{r.direction}</td>
                  <td className="p-1 border border-slate-200">
                    <input
                      type="text"
                      className="w-full p-1 border rounded text-xs"
                      value={r.asPerSite}
                      onChange={(e) => updateComp(i, 'asPerSite', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-1 border border-slate-200">
                    <input
                      type="text"
                      className="w-full p-1 border rounded text-xs"
                      value={r.asPerDeed}
                      onChange={(e) => updateComp(i, 'asPerDeed', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                  <td className="p-1 border border-slate-200">
                    <input
                      type="text"
                      className="w-full p-1 border rounded text-xs"
                      value={r.asPerSketchMap}
                      onChange={(e) => updateComp(i, 'asPerSketchMap', e.target.value)}
                      disabled={isReadOnly}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          <Field label="Whether site boundaries are matching with legal">
            <select
              className={selectCls}
              value={fields.boundariesMatchingWithLegal || 'Yes'}
              onChange={(e) => handleChange('boundariesMatchingWithLegal', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </Field>

          <Field label="Discrepancy found in Boundaries, If any plz specify">
            <input
              type="text"
              className={inputCls}
              value={fields.discrepancyInBoundaries || 'No discrepancy noticed'}
              onChange={(e) => handleChange('discrepancyInBoundaries', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </div>
    </Section>
  );
}

/**
 * Section 4: Survey of Construction (Omitted in Vacant Land)
 */
export function KotakConstructionSection({
  fields,
  handleChange,
  isReadOnly = false,
}: SharedSectionProps) {
  return (
    <Section title="4. SURVEY OF CONSTRUCTION" defaultOpen>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Nature of Soil">
          <input
            type="text"
            className={inputCls}
            value={fields.natureOfSoil || 'Ordinary Soil'}
            onChange={(e) => handleChange('natureOfSoil', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Type of Construction">
          <input
            type="text"
            className={inputCls}
            value={fields.typeOfConstruction || 'RCC Framed Structure'}
            onChange={(e) => handleChange('typeOfConstruction', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
        <Field label="Major Structural Irregularities / Cracks">
          <input
            type="text"
            className={inputCls}
            value={fields.majorStructuralIrregularities || 'No structural cracks or irregularities observed'}
            onChange={(e) => handleChange('majorStructuralIrregularities', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Improvement / Interior Decoration Done">
          <input
            type="text"
            className={inputCls}
            value={fields.improvementInteriorDecoration || 'No / Standard interior works done'}
            onChange={(e) => handleChange('improvementInteriorDecoration', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. No / yes (POP / wall decor / texture / furniture)"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        <Field label="Nature of Water Supply">
          <input
            type="text"
            className={inputCls}
            value={fields.natureOfWaterSupply || 'Overhead tank & pump / Borewell & Municipal'}
            onChange={(e) => handleChange('natureOfWaterSupply', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Quality of Construction">
          <select
            className={selectCls}
            value={fields.qualityOfConstruction || 'Good'}
            onChange={(e) => handleChange('qualityOfConstruction', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Excellent">Excellent</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </Field>

        <Field label="Exteriors Finishing">
          <input
            type="text"
            className={inputCls}
            value={fields.exteriorsFinishing || 'Weather coat paint'}
            onChange={(e) => handleChange('exteriorsFinishing', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
        <Field label="Interiors Finishing">
          <input
            type="text"
            className={inputCls}
            value={fields.interiorsFinishing || 'Plastic emulsion paint with vitrified tiles'}
            onChange={(e) => handleChange('interiorsFinishing', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Type of finishing (Paint)">
          <input
            type="text"
            className={inputCls}
            value={fields.typeOfFinishingPaint || 'Premium Acrylic Emulsion'}
            onChange={(e) => handleChange('typeOfFinishingPaint', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Type of Specification used">
          <input
            type="text"
            className={inputCls}
            value={fields.typeOfSpecificationUsed || 'First class building specifications'}
            onChange={(e) => handleChange('typeOfSpecificationUsed', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-3">
        <Field label="Amenities provided in building / society">
          <input
            type="text"
            className={inputCls}
            value={fields.amenitiesProvidedInBuilding || 'Lift, 24x7 Power Backup, Security'}
            onChange={(e) => handleChange('amenitiesProvidedInBuilding', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Construction progress up to / Stage in %">
          <input
            type="text"
            className={inputCls}
            value={fields.constructionProgressUpTo || '100% Complete'}
            onChange={(e) => handleChange('constructionProgressUpTo', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Projected Residual Life">
          <input
            type="text"
            className={inputCls}
            value={fields.projectedResidualLife || '55 Years'}
            onChange={(e) => handleChange('projectedResidualLife', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Encroachment on public land">
          <select
            className={selectCls}
            value={fields.encroachmentOnPublicLand || 'No'}
            onChange={(e) => handleChange('encroachmentOnPublicLand', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </Field>
      </div>
    </Section>
  );
}

/**
 * Section 5: Documents Verified (Sec 4 in Vacant Land)
 */
export function KotakDocumentsSection({
  fields,
  handleChange,
  isReadOnly = false,
  isVacantLand = false,
  isIndustrial = false,
}: SharedSectionProps & { isVacantLand?: boolean; isIndustrial?: boolean }) {
  const secNum = isVacantLand ? '4' : '5';
  return (
    <Section title={`${secNum}. DOCUMENTS VERIFIED`} defaultOpen>
      <div className="space-y-3">
        <Field label="a) Approved Layout / Building plans details">
          <input
            type="text"
            className={inputCls}
            value={fields.approvedLayoutPlansDetails || ''}
            onChange={(e) => handleChange('approvedLayoutPlansDetails', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        {!isVacantLand && (
          <>
            <Field label="b) Commencement Certificate / Building Permit">
              <input
                type="text"
                className={inputCls}
                value={fields.commencementCertificate || ''}
                onChange={(e) => handleChange('commencementCertificate', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="c) Occupation / Completion Certificate">
              <input
                type="text"
                className={inputCls}
                value={fields.occupationCompletionCertificate || ''}
                onChange={(e) => handleChange('occupationCompletionCertificate', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </>
        )}

        <Field label="d) Ownership Documents">
          <input
            type="text"
            className={inputCls}
            value={fields.ownershipDocuments || ''}
            onChange={(e) => handleChange('ownershipDocuments', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        {!isVacantLand && (
          <Field label="e) Allotment letter / BBA / Possession Letter">
            <input
              type="text"
              className={inputCls}
              value={fields.allotmentLetterBBA || ''}
              onChange={(e) => handleChange('allotmentLetterBBA', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        )}

        {isIndustrial && (
          <Field label="Extended utility bills (Conversion, Electricity, Tax)">
            <input
              type="text"
              className={inputCls}
              value={fields.extendedUtilityBills || ''}
              onChange={(e) => handleChange('extendedUtilityBills', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        )}
      </div>
    </Section>
  );
}

/**
 * Sub-Table: Amenities Valuation (Harmonized Universal Across All 5)
 */
export function KotakAmenitiesSubTableUI({
  fields,
  handleChange,
  isReadOnly = false,
}: SharedSectionProps) {
  const parkVal = parseFloat(String(fields.valueOfParking || '0').replace(/,/g, '')) || 0;
  const otherVal = parseFloat(String(fields.valueOfOtherAmenities || '0').replace(/,/g, '')) || 0;
  const autoTotal = parkVal + otherVal;

  return (
    <div className="mt-4 p-4 rounded-xl border border-amber-200 bg-amber-50/40">
      <div className="flex items-center gap-2 mb-3 text-amber-900 font-semibold text-xs uppercase tracking-wider">
        <Sparkles className="w-4 h-4 text-amber-600" />
        <span>Amenities Valuation (Car Parking & Other Amenities)</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Field label="No of Car Parking:">
          <input
            type="text"
            className={inputCls}
            value={fields.noOfCarParking || ''}
            onChange={(e) => handleChange('noOfCarParking', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. 1 Covered Parking"
          />
        </Field>
        <Field label="Value of Parking (in Rs.):">
          <input
            type="number"
            className={inputCls}
            value={fields.valueOfParking || ''}
            onChange={(e) => {
              handleChange('valueOfParking', e.target.value);
              const p = parseFloat(e.target.value || '0') || 0;
              handleChange('totalValueOfAmenities', String(p + otherVal));
            }}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Value of Other Amenities (in Rs.):">
          <input
            type="number"
            className={inputCls}
            value={fields.valueOfOtherAmenities || ''}
            onChange={(e) => {
              handleChange('valueOfOtherAmenities', e.target.value);
              const o = parseFloat(e.target.value || '0') || 0;
              handleChange('totalValueOfAmenities', String(parkVal + o));
            }}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Total Value of Amenities (in Rs.):">
          <input
            type="text"
            className={`${inputCls} font-bold bg-amber-100 text-amber-950`}
            value={fields.totalValueOfAmenities || String(autoTotal)}
            onChange={(e) => handleChange('totalValueOfAmenities', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>
    </div>
  );
}

/**
 * Section 7: Final Values & Declaration (Sec 6 in Vacant Land)
 */
export function KotakFinalValuesSection({
  fields,
  handleChange,
  isReadOnly = false,
  isVacantLand = false,
  includeInsurable = true,
}: SharedSectionProps & { isVacantLand?: boolean; includeInsurable?: boolean }) {
  const secNum = isVacantLand ? '6' : '7';
  const fmv = parseFloat(String(fields.finalMarketValue || '0').replace(/,/g, '')) || 0;

  // Auto 80% and 90%
  const auto80 = fmv > 0 ? Math.round(fmv * 0.8) : '';
  const auto90 = fmv > 0 ? Math.round(fmv * 0.9) : '';

  const handleFmvChange = (val: string) => {
    handleChange('finalMarketValue', val);
    const num = parseFloat(val.replace(/,/g, '')) || 0;
    if (num > 0) {
      handleChange('distressedValue', String(Math.round(num * 0.8)));
      handleChange('realizableValue', String(Math.round(num * 0.9)));
    }
  };

  const engName = fields.visitingEngineerName || 'Site Engineer';
  const visitDate = fields.dateOfTechnicalVisit || '';

  return (
    <Section title={`${secNum}. FINAL VALUES & VALUER DECLARATION`} defaultOpen>
      <div className="space-y-4">
        {/* Rationale for Valuation */}
        <div className="p-4 rounded-xl border border-slate-300 bg-slate-50">
          <Field label="Rationale for Valuation:">
            <textarea
              className={textareaCls}
              rows={3}
              value={fields.rationaleForValuation || ''}
              onChange={(e) => handleChange('rationaleForValuation', e.target.value)}
              disabled={isReadOnly}
              placeholder="State the methodology justification, market inquiries, and location factors..."
            />
          </Field>
        </div>

        {/* Final Market Value & Guideline Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Final Market Value (in Rs.) [Mandatory Base]">
            <input
              type="text"
              className={`${inputCls} font-bold text-base text-slate-900 border-amber-400 bg-amber-50/50`}
              value={fields.finalMarketValue || ''}
              onChange={(e) => handleFmvChange(e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 5200000"
            />
          </Field>

          <Field label="Guideline Value (in Rs.) [Govt Circle Rate benchmark]">
            <input
              type="text"
              className={inputCls}
              value={fields.guidelineValue || ''}
              onChange={(e) => handleChange('guidelineValue', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 3800000"
            />
          </Field>
        </div>

        {/* Distressed (80%), Realizable (90%), Insurable Value */}
        <div className={`grid grid-cols-1 ${includeInsurable && !isVacantLand ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
          <Field label="Distressed Value (in Rs.) (80% of FMV)">
            <input
              type="text"
              className={inputCls}
              value={fields.distressedValue || (auto80 ? String(auto80) : '')}
              onChange={(e) => handleChange('distressedValue', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          <Field label="Realizable Value (in Rs.) (90% of FMV)">
            <input
              type="text"
              className={inputCls}
              value={fields.realizableValue || (auto90 ? String(auto90) : '')}
              onChange={(e) => handleChange('realizableValue', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>

          {includeInsurable && !isVacantLand && (
            <Field label="Insurable Value (in Rs.) [Structure Cost]">
              <input
                type="text"
                className={inputCls}
                value={fields.insurableValue || ''}
                onChange={(e) => handleChange('insurableValue', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          )}
        </div>

        {/* Remarks / Observations */}
        <div className="mt-2">
          <Field label="Remarks / Observations (including boundary discrepancy & title notes):">
            <textarea
              className={textareaCls}
              rows={4}
              value={fields.remarks || ''}
              onChange={(e) => handleChange('remarks', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>

        {/* Valuer Declaration Clauses */}
        <div className="mt-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-950 block mb-2">
            Kotak Mahindra Bank Empanelled Valuer Declaration
          </span>

          <div className="space-y-2 text-xs text-slate-700 bg-white p-3 rounded-lg border border-indigo-100 max-h-48 overflow-y-auto">
            {KOTAK_DECLARATION_CLAUSES.map((clause, idx) => (
              <p key={idx} className="leading-relaxed">
                {idx === 0 ? (
                  <>
                    (I) I/We hereby declare that visiting engineer <strong>{engName.toUpperCase()}</strong> has personally inspected the property on <strong>{visitDate || '[Visit Date]'}</strong> and that the report has been prepared based on site observations and verification of copies of documents provided to us.
                  </>
                ) : (
                  clause
                )}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Field label="Visiting Engineer Name">
              <input
                type="text"
                className={inputCls}
                value={fields.visitingEngineerName || ''}
                onChange={(e) => handleChange('visitingEngineerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Date of Report (DD/MM/YYYY)">
              <input
                type="text"
                className={inputCls}
                value={fields.reportDate || ''}
                onChange={(e) => handleChange('reportDate', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <Field label="Place of Report">
              <input
                type="text"
                className={inputCls}
                value={fields.reportPlace || 'Bhubaneswar'}
                onChange={(e) => handleChange('reportPlace', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * Enclosures Section: Documents -> Maps -> Photographs (Inside main content column)
 */
export function KotakEnclosuresSections({
  fields,
  handleChange,
  bucketImages = [],
  isReadOnly = false,
  setIsPhotoModalOpen,
  sectionNumbers = { docs: 8, maps: 9, photos: 10 },
}: {
  fields: KotakHLLAPFields;
  handleChange: (key: keyof KotakHLLAPFields, val: any) => void;
  bucketImages?: any[];
  isReadOnly?: boolean;
  setIsPhotoModalOpen: (open: boolean) => void;
  sectionNumbers?: { docs: number; maps: number; photos: number };
}) {
  return (
    <>
      {/* Enclosure 1: Documents */}
      <div id="sec-docs-gallery">
        <BaseDocumentsSection
          title="Property Documents"
          sectionId="sec-docs-gallery"
          sectionNumber={sectionNumbers.docs}
          documentImages={fields.propertyDocuments || []}
          documentImageNames={fields.propertyDocumentNames || []}
          isReadOnly={isReadOnly}
          onRemoveDocument={(idx: number) => {
            handleChange('propertyDocuments', (fields.propertyDocuments || []).filter((_: any, i: number) => i !== idx));
            handleChange('propertyDocumentNames', (fields.propertyDocumentNames || []).filter((_: any, i: number) => i !== idx));
          }}
          onDocumentNameChange={(idx: number, name: string) => {
            const arr = [...(fields.propertyDocumentNames || [])];
            while (arr.length <= idx) arr.push('');
            arr[idx] = name;
            handleChange('propertyDocumentNames', arr);
          }}
          onReorderDocuments={(newDocs: string[], newNames: string[]) => {
            handleChange('propertyDocuments', newDocs);
            handleChange('propertyDocumentNames', newNames);
          }}
        />
      </div>

      {/* Enclosure 2: Maps */}
      <div id="sec-maps">
        <BaseMapsSection
          title="Location Maps"
          sectionId="sec-maps"
          sectionNumber={sectionNumbers.maps}
          locationMapImages={fields.locationMaps || []}
          latitude={fields.latitude || ''}
          longitude={fields.longitude || ''}
          onLatitudeChange={(val) => handleChange('latitude', val)}
          onLongitudeChange={(val) => handleChange('longitude', val)}
          propertyAddress={fields.postalAddress || ''}
          fields={fields}
          isReadOnly={isReadOnly}
          onLocationMapRemove={(idx?: number) => {
            if (idx !== undefined) {
              handleChange('locationMaps', (fields.locationMaps || []).filter((_: any, i: number) => i !== idx));
            }
          }}
        />
      </div>

      {/* Enclosure 3: Photographs */}
      <div id="sec-photos">
        <BasePhotographsSection
          title="Property Site Photographs"
          sectionId="sec-photos"
          sectionNumber={sectionNumbers.photos}
          propertyImages={fields.propertyPhotos || []}
          propertyImageNames={fields.propertyPhotoNames || []}
          isReadOnly={isReadOnly}
          bucketCount={bucketImages?.length || 0}
          onOpenBucketPicker={() => setIsPhotoModalOpen(true)}
          onRemoveImage={(idx: number) => {
            handleChange('propertyPhotos', (fields.propertyPhotos || []).filter((_: any, i: number) => i !== idx));
            handleChange('propertyPhotoNames', (fields.propertyPhotoNames || []).filter((_: any, i: number) => i !== idx));
          }}
          onImageNameChange={(idx: number, name: string) => {
            const arr = [...(fields.propertyPhotoNames || [])];
            while (arr.length <= idx) arr.push('');
            arr[idx] = name;
            handleChange('propertyPhotoNames', arr);
          }}
          onReorderImages={(newImgs: string[], newNames: string[]) => {
            handleChange('propertyPhotos', newImgs);
            handleChange('propertyPhotoNames', newNames);
          }}
        />
      </div>
    </>
  );
}

/**
 * Universal Enclosures & Floating Action Bar Component
 */
export function KotakUniversalEnclosuresAndActions({
  fields,
  handleChange,
  bucketImages = [],
  isReadOnly = false,
  userRole = 'REPORT_EMPLOYEE',
  isPhotoModalOpen,
  setIsPhotoModalOpen,
  onSaveDraft,
  onPreviewPDF,
  onDownloadPDF,
  isSaving,
  saveSuccess,
  saveError,
  sectionNumbers = { docs: 8, maps: 9, photos: 10 },
}: {
  fields: KotakHLLAPFields;
  handleChange: (key: keyof KotakHLLAPFields, val: any) => void;
  bucketImages?: any[];
  isReadOnly?: boolean;
  userRole?: string;
  isPhotoModalOpen: boolean;
  setIsPhotoModalOpen: (open: boolean) => void;
  onSaveDraft: () => void;
  onPreviewPDF: () => void;
  onDownloadPDF: () => void;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: string | null;
  sectionNumbers?: { docs: number; maps: number; photos: number };
}) {
  return (
    <>
      {/* Enclosure 1: Documents */}
      <div id="sec-docs-gallery">
        <BaseDocumentsSection
          title="Property Documents"
          sectionId="sec-docs-gallery"
          sectionNumber={sectionNumbers.docs}
          documentImages={fields.propertyDocuments || []}
          documentImageNames={fields.propertyDocumentNames || []}
          isReadOnly={isReadOnly}
          onRemoveDocument={(idx: number) => {
            handleChange('propertyDocuments', (fields.propertyDocuments || []).filter((_: any, i: number) => i !== idx));
            handleChange('propertyDocumentNames', (fields.propertyDocumentNames || []).filter((_: any, i: number) => i !== idx));
          }}
          onDocumentNameChange={(idx: number, name: string) => {
            const arr = [...(fields.propertyDocumentNames || [])];
            while (arr.length <= idx) arr.push('');
            arr[idx] = name;
            handleChange('propertyDocumentNames', arr);
          }}
          onReorderDocuments={(newDocs: string[], newNames: string[]) => {
            handleChange('propertyDocuments', newDocs);
            handleChange('propertyDocumentNames', newNames);
          }}
        />
      </div>

      {/* Enclosure 2: Maps */}
      <div id="sec-maps">
        <BaseMapsSection
          title="Location Maps"
          sectionId="sec-maps"
          sectionNumber={sectionNumbers.maps}
          locationMapImages={fields.locationMaps || []}
          latitude={fields.latitude || ''}
          longitude={fields.longitude || ''}
          onLatitudeChange={(val) => handleChange('latitude', val)}
          onLongitudeChange={(val) => handleChange('longitude', val)}
          propertyAddress={fields.postalAddress || ''}
          fields={fields}
          isReadOnly={isReadOnly}
          onLocationMapRemove={(idx?: number) => {
            if (idx !== undefined) {
              handleChange('locationMaps', (fields.locationMaps || []).filter((_: any, i: number) => i !== idx));
            }
          }}
        />
      </div>

      {/* Enclosure 3: Photographs */}
      <div id="sec-photos">
        <BasePhotographsSection
          title="Property Site Photographs"
          sectionId="sec-photos"
          sectionNumber={sectionNumbers.photos}
          propertyImages={fields.propertyPhotos || []}
          propertyImageNames={fields.propertyPhotoNames || []}
          isReadOnly={isReadOnly}
          bucketCount={bucketImages?.length || 0}
          onOpenBucketPicker={() => setIsPhotoModalOpen(true)}
          onRemoveImage={(idx: number) => {
            handleChange('propertyPhotos', (fields.propertyPhotos || []).filter((_: any, i: number) => i !== idx));
            handleChange('propertyPhotoNames', (fields.propertyPhotoNames || []).filter((_: any, i: number) => i !== idx));
          }}
          onImageNameChange={(idx: number, name: string) => {
            const arr = [...(fields.propertyPhotoNames || [])];
            while (arr.length <= idx) arr.push('');
            arr[idx] = name;
            handleChange('propertyPhotoNames', arr);
          }}
          onReorderImages={(newImgs: string[], newNames: string[]) => {
            handleChange('propertyPhotos', newImgs);
            handleChange('propertyPhotoNames', newNames);
          }}
        />
      </div>

      {/* Photo Bucket Modal */}
      {isPhotoModalOpen && (
        <BasePhotoBucketModal
          isOpen={isPhotoModalOpen}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setIsPhotoModalOpen(false)}
          onConfirm={(selectedUrls: string[]) => {
            handleChange('propertyPhotos', [...(fields.propertyPhotos || []), ...selectedUrls]);
            handleChange('propertyPhotoNames', [
              ...(fields.propertyPhotoNames || []),
              ...selectedUrls.map((_, i) => `Photograph ${(fields.propertyPhotos?.length || 0) + i + 1}`),
            ]);
            setIsPhotoModalOpen(false);
          }}
        />
      )}

      {/* Bottom Floating Action Bar */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={isSaving ? 'saving' : saveSuccess ? 'saved' : saveError ? 'error' : 'idle'}
        message={
          saveSuccess
            ? { text: 'Report draft saved successfully', type: 'success' }
            : saveError
            ? { text: saveError, type: 'error' }
            : null
        }
        loading={isSaving}
        onSaveDraft={onSaveDraft}
        onPreviewPDF={onPreviewPDF}
        onDownloadPDF={onDownloadPDF}
      />
    </>
  );
}
