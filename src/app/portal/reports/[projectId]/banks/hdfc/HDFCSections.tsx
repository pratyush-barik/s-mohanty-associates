'use client';

import React, { useState } from 'react';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  textareaCls,
  BaseDateInput,
  StructureDerivationBadge,
  getConstructionDetailsForStructure,
  getNdmaStructureTypeForStructure,
  getWorkProgressStructureLabel,
  getFloorName,
} from '../BaseBankReportComponents';
import {
  HDFCReportFields,
  HDFCFloorRow,
  STRUCTURE_TYPE_OPTIONS,
  PREDEFINED_AMENITIES,
  deriveApproachRoadWidthRange,
  deriveAgeOfPropertyRange,
  calculateTotalLandValue,
  parseNum,
  formatNum,
} from './HDFCTypes';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { formatIndianCurrency, rupeesInWords } from '@/lib/numberToWords';

export interface HDFCSectionProps {
  fields: HDFCReportFields;
  handleChange: (field: keyof HDFCReportFields, value: any) => void;
  isReadOnly?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   1. General Details Section
   ───────────────────────────────────────────────────────────────────────────── */
export function HDFCGeneralSection({ fields, handleChange, isReadOnly = false }: HDFCSectionProps) {
  return (
    <Section title="1. General Details" number={1} defaultOpen={true}>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Property Type">
          <select
            className={selectCls}
            value={fields.propertyType || 'Residential'}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Residential cum Commercial">Residential cum Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Institutional">Institutional</option>
            <option value="Vacant Plot">Vacant Plot</option>
            <option value="Other">Other</option>
          </select>
        </Field>

        {fields.propertyType === 'Other' && (
          <Field label="Specify Other Property Type">
            <input
              type="text"
              className={inputCls}
              value={fields.propertyTypeOther || ''}
              onChange={(e) => handleChange('propertyTypeOther', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Warehouse / Godown"
            />
          </Field>
        )}

        <Field label="Customer / Owner Name">
          <input
            type="text"
            className={inputCls}
            value={fields.ownerName || ''}
            onChange={(e) => handleChange('ownerName', e.target.value)}
            disabled={isReadOnly}
            placeholder="Full name of the borrower / owner"
          />
        </Field>

        <Field label="Name of Document Holder">
          <input
            type="text"
            className={inputCls}
            value={fields.documentHolderName || ''}
            onChange={(e) => handleChange('documentHolderName', e.target.value)}
            disabled={isReadOnly}
            placeholder="Name as per deed"
          />
        </Field>

        <Field label="Loan Application Type">
          <input
            type="text"
            className={inputCls}
            value={fields.loanApplicationType || ''}
            onChange={(e) => handleChange('loanApplicationType', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Housing Loan / LAP / Business Loan Group"
          />
        </Field>

        <Field label="Loan Application Number">
          <input
            type="text"
            className={inputCls}
            value={fields.loanApplicationNo || ''}
            onChange={(e) => handleChange('loanApplicationNo', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. HDFC-APP-123456"
          />
        </Field>

        <Field label="Date of Inspection">
          <BaseDateInput
            value={fields.dateOfInspection}
            onChange={(val) => handleChange('dateOfInspection', val)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Date of Valuation Report">
          <BaseDateInput
            value={fields.dateOfValuation}
            onChange={(val) => handleChange('dateOfValuation', val)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Bank / Institution Name">
          <input
            type="text"
            className={inputCls}
            value={fields.bankName || 'HDFC BANK'}
            onChange={(e) => handleChange('bankName', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Branch Name">
          <input
            type="text"
            className={inputCls}
            value={fields.branchName || ''}
            onChange={(e) => handleChange('branchName', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Bhubaneswar Main Branch"
          />
        </Field>

        <Field label="Addressed To (Report Title Header)">
          <input
            type="text"
            className={inputCls}
            value={fields.to || 'HDFC BANK LTD - HL-LAP-BLG'}
            onChange={(e) => handleChange('to', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Valuation Purpose">
          <input
            type="text"
            className={inputCls}
            value={fields.purpose || 'Home Loan / LAP / Business Loan Group'}
            onChange={(e) => handleChange('purpose', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      {/* Property Address & Annexure Link */}
      <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Property Physical Address (On-Site)
          </span>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={fields.annexureEnabled}
              onChange={(e) => handleChange('annexureEnabled', e.target.checked)}
              disabled={isReadOnly}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Link to Annexure</span>
          </label>
        </div>

        {fields.annexureEnabled ? (
          <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center justify-between">
            <span>Property Address is referenced via Annexure schedule.</span>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium text-amber-800">
              <input
                type="checkbox"
                checked={fields.annexureRefShowAlso}
                onChange={(e) => handleChange('annexureRefShowAlso', e.target.checked)}
                disabled={isReadOnly}
              />
              <span>Also show full address in report</span>
            </label>
          </div>
        ) : null}

        {(!fields.annexureEnabled || fields.annexureRefShowAlso) && (
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Field label="Address Line 1 (Plot, Street, Mouza)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.ownerAddress || ''}
                  onChange={(e) => handleChange('ownerAddress', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Plot/Building No, Locality"
                />
              </Field>
            </div>
            <Field label="City">
              <input
                type="text"
                className={inputCls}
                value={fields.city || ''}
                onChange={(e) => handleChange('city', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Bhubaneswar"
              />
            </Field>
            <Field label="State">
              <input
                type="text"
                className={inputCls}
                value={fields.state || ''}
                onChange={(e) => handleChange('state', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Odisha"
              />
            </Field>
            <Field label="Pincode">
              <input
                type="text"
                className={inputCls}
                value={fields.pincode || ''}
                onChange={(e) => handleChange('pincode', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. 751001"
              />
            </Field>
            <Field label="Prominent Landmark">
              <input
                type="text"
                className={inputCls}
                value={fields.landmark || ''}
                onChange={(e) => handleChange('landmark', e.target.value)}
                disabled={isReadOnly}
                placeholder="e.g. Near Big Bazaar"
              />
            </Field>
          </div>
        )}
      </div>

      {/* Legal Address & Annexure Link */}
      <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Legal Address (As per Title Deed / ROR)
          </span>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
            <input
              type="checkbox"
              checked={fields.legalAnnexureEnabled}
              onChange={(e) => handleChange('legalAnnexureEnabled', e.target.checked)}
              disabled={isReadOnly}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Link Legal Address to Annexure</span>
          </label>
        </div>

        {(!fields.legalAnnexureEnabled || fields.legalAnnexureRefShowAlso) && (
          <div className="grid md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <Field label="Legal Address (Khata, Plot, Mouza, Tahasil)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.legalAddress || ''}
                  onChange={(e) => handleChange('legalAddress', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Khata No, Plot No, Mouza, Tahasil"
                />
              </Field>
            </div>
            <Field label="State">
              <input
                type="text"
                className={inputCls}
                value={fields.legalState || fields.state || ''}
                onChange={(e) => handleChange('legalState', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   2. Surrounding Locality Details Section
   ───────────────────────────────────────────────────────────────────────────── */
export function HDFCSurroundingsSection({ fields, handleChange, isReadOnly = false }: HDFCSectionProps) {
  const roadWidthRange = deriveApproachRoadWidthRange(fields.approachRoadWidthActual || fields.approachRoadWidth || '');

  return (
    <Section title="2. Surrounding Locality Details" number={2} defaultOpen={true}>
      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Ward No">
          <input
            type="text"
            className={inputCls}
            value={fields.wardNo || ''}
            onChange={(e) => handleChange('wardNo', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Ward 12"
          />
        </Field>

        <Field label="Vicinity / Surroundings">
          <select
            className={selectCls}
            value={fields.vicinity || 'Residential'}
            onChange={(e) => handleChange('vicinity', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Mixed / Semi-Commercial">Mixed / Semi-Commercial</option>
            <option value="Industrial">Industrial</option>
            <option value="Agricultural">Agricultural</option>
          </select>
        </Field>

        <Field label="Class of Locality">
          <select
            className={selectCls}
            value={fields.classOfLocality || 'Middle Class'}
            onChange={(e) => handleChange('classOfLocality', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="High / Posh Class">High / Posh Class</option>
            <option value="Upper Middle Class">Upper Middle Class</option>
            <option value="Middle Class">Middle Class</option>
            <option value="Lower Middle Class">Lower Middle Class</option>
            <option value="Underdeveloped / Slum">Underdeveloped / Slum</option>
          </select>
        </Field>

        <Field label="Actual Approach Road Width (in Ft / Mtr)">
          <input
            type="text"
            className={inputCls}
            value={fields.approachRoadWidthActual || fields.approachRoadWidth || ''}
            onChange={(e) => {
              handleChange('approachRoadWidthActual', e.target.value);
              const derived = deriveApproachRoadWidthRange(e.target.value);
              if (derived) handleChange('approachRoadWidth', derived);
            }}
            disabled={isReadOnly}
            placeholder="e.g. 30 Feet Road"
          />
        </Field>

        <Field label="Approach Road Category (Auto-Derived)">
          <select
            className={selectCls}
            value={fields.approachRoadWidth || roadWidthRange || '<20 Feet Road'}
            onChange={(e) => handleChange('approachRoadWidth', e.target.value)}
            disabled={isReadOnly}
          >
            <option value=">=60 Feet Road">&gt;=60 Feet Road</option>
            <option value="60-40 Feet Road">60-40 Feet Road</option>
            <option value="40-20 Feet Road">40-20 Feet Road</option>
            <option value="<20 Feet Road">&lt;20 Feet Road</option>
          </select>
        </Field>

        <Field label="Plot Demarcated on Site">
          <select
            className={selectCls}
            value={fields.plotDemarcated || 'Yes'}
            onChange={(e) => handleChange('plotDemarcated', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Partially Demarcated">Partially Demarcated</option>
          </select>
        </Field>

        <Field label="Distance to Railway Station">
          <input
            type="text"
            className={inputCls}
            value={fields.distanceRailwayStation || ''}
            onChange={(e) => handleChange('distanceRailwayStation', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. 5.2 Km"
          />
        </Field>

        <Field label="Railway Station Name">
          <input
            type="text"
            className={inputCls}
            value={fields.railwayStationName || ''}
            onChange={(e) => handleChange('railwayStationName', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Bhubaneswar Railway Station"
          />
        </Field>

        <Field label="Distance to Bus Stop">
          <input
            type="text"
            className={inputCls}
            value={fields.distanceBusStop || ''}
            onChange={(e) => handleChange('distanceBusStop', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. 500 Meters"
          />
        </Field>

        <Field label="Bus Stop Name">
          <input
            type="text"
            className={inputCls}
            value={fields.busStopName || ''}
            onChange={(e) => handleChange('busStopName', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Baramunda Bus Stand"
          />
        </Field>

        <Field label="Distance to Hospital">
          <input
            type="text"
            className={inputCls}
            value={fields.distanceHospital || ''}
            onChange={(e) => handleChange('distanceHospital', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. 2.0 Km"
          />
        </Field>

        <Field label="Hospital Name">
          <input
            type="text"
            className={inputCls}
            value={fields.hospitalName || ''}
            onChange={(e) => handleChange('hospitalName', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. AIIMS Hospital"
          />
        </Field>

        <Field label="Property Identification">
          <select
            className={selectCls}
            value={fields.propertyIdentification || 'Easy to Identify'}
            onChange={(e) => handleChange('propertyIdentification', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Easy to Identify">Easy to Identify</option>
            <option value="Moderate Identification">Moderate Identification</option>
            <option value="Difficult to Identify">Difficult to Identify</option>
          </select>
        </Field>

        <Field label="Proximity to Basic Facilities">
          <select
            className={selectCls}
            value={fields.proximityToFacilities || '1-3 Kms'}
            onChange={(e) => handleChange('proximityToFacilities', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="< 1 Km">&lt; 1 Km</option>
            <option value="1-3 Kms">1-3 Kms</option>
            <option value="3-5 Kms">3-5 Kms</option>
            <option value="> 5 Kms">&gt; 5 Kms</option>
          </select>
        </Field>

        <Field label="Nearest Landmark Description">
          <input
            type="text"
            className={inputCls}
            value={fields.landmarkNearest || ''}
            onChange={(e) => handleChange('landmarkNearest', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Opposite Post Office"
          />
        </Field>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   3. Property Details Section
   ───────────────────────────────────────────────────────────────────────────── */
export function HDFCPropertySection({ fields, handleChange, isReadOnly = false }: HDFCSectionProps) {
  const selectedAmenities = (fields.additionalAmenities || '')
    .split(', ')
    .map((s) => s.trim())
    .filter(Boolean);

  const [isOtherChecked, setIsOtherChecked] = useState(() =>
    selectedAmenities.some((item) => !PREDEFINED_AMENITIES.includes(item) && item !== 'Not Applicable')
  );

  const [otherText, setOtherText] = useState(() => {
    const custom = selectedAmenities.filter(
      (item) => !PREDEFINED_AMENITIES.includes(item) && item !== 'Not Applicable'
    );
    return custom.join(', ');
  });

  const handleAmenityToggle = (amenity: string, checked: boolean) => {
    let current = selectedAmenities.filter((item) => item !== 'Not Applicable');
    if (checked) {
      if (!current.includes(amenity)) current.push(amenity);
    } else {
      current = current.filter((item) => item !== amenity);
    }

    if (isOtherChecked && otherText.trim()) {
      current = current.filter((item) => PREDEFINED_AMENITIES.includes(item));
      current.push(otherText.trim());
    }

    handleChange('additionalAmenities', current.length > 0 ? current.join(', ') : 'Not Applicable');
  };

  return (
    <Section title="3. Property Details" number={3} defaultOpen={true}>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Usage Type">
          <select
            className={selectCls}
            value={fields.usageType || 'Residential'}
            onChange={(e) => handleChange('usageType', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Mixed (Resi + Comm)">Mixed (Resi + Comm)</option>
            <option value="Industrial">Industrial</option>
            <option value="Institutional">Institutional</option>
            <option value="Agricultural">Agricultural</option>
          </select>
        </Field>

        <Field label="Legal Status">
          <select
            className={selectCls}
            value={fields.legalStatus || 'Freehold'}
            onChange={(e) => handleChange('legalStatus', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Freehold">Freehold</option>
            <option value="Leasehold (Govt/BDA)">Leasehold (Govt/BDA)</option>
            <option value="Leasehold (Private)">Leasehold (Private)</option>
            <option value="Possession Rights">Possession Rights</option>
          </select>
        </Field>
      </div>

      <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block">
          Additional Amenities Checklist
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {PREDEFINED_AMENITIES.map((amenity) => {
            const checked = selectedAmenities.includes(amenity);
            return (
              <label
                key={amenity}
                className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-amber-50/30"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => handleAmenityToggle(amenity, e.target.checked)}
                  disabled={isReadOnly}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                <span>{amenity}</span>
              </label>
            );
          })}

          <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 cursor-pointer hover:bg-amber-50/30">
            <input
              type="checkbox"
              checked={isOtherChecked}
              onChange={(e) => {
                setIsOtherChecked(e.target.checked);
                if (!e.target.checked) {
                  setOtherText('');
                  const filtered = selectedAmenities.filter((item) => PREDEFINED_AMENITIES.includes(item));
                  handleChange('additionalAmenities', filtered.length > 0 ? filtered.join(', ') : 'Not Applicable');
                }
              }}
              disabled={isReadOnly}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <span>Other Amenities</span>
          </label>
        </div>

        {isOtherChecked && (
          <div className="mt-2">
            <input
              type="text"
              className={inputCls}
              value={otherText}
              onChange={(e) => {
                setOtherText(e.target.value);
                const current = selectedAmenities.filter((item) => PREDEFINED_AMENITIES.includes(item));
                if (e.target.value.trim()) current.push(e.target.value.trim());
                handleChange('additionalAmenities', current.join(', '));
              }}
              disabled={isReadOnly}
              placeholder="e.g. CCTV, Solar Panels, Intercom"
            />
          </div>
        )}
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   4. Subject Property Details Section (Boundaries)
   ───────────────────────────────────────────────────────────────────────────── */
export function HDFCSubjectPropertySection({ fields, handleChange, isReadOnly = false }: HDFCSectionProps) {
  return (
    <Section title="4. Subject Property Details & Boundaries" number={4} defaultOpen={true}>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Field label="Premises Type">
          <select
            className={selectCls}
            value={fields.premisesType || 'Row House'}
            onChange={(e) => handleChange('premisesType', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Independent House / Villa">Independent House / Villa</option>
            <option value="Row House">Row House</option>
            <option value="Flat / Apartment">Flat / Apartment</option>
            <option value="Commercial Unit / Shop">Commercial Unit / Shop</option>
            <option value="Industrial Shed">Industrial Shed</option>
            <option value="Vacant Plot">Vacant Plot</option>
          </select>
        </Field>

        <Field label="Occupied By">
          <select
            className={selectCls}
            value={fields.occupiedBy || 'Self Occupied'}
            onChange={(e) => handleChange('occupiedBy', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Self Occupied">Self Occupied</option>
            <option value="Tenant Occupied">Tenant Occupied</option>
            <option value="Vacant">Vacant</option>
            <option value="Partially Self / Tenant">Partially Self / Tenant</option>
          </select>
        </Field>

        <Field label="Property Taxation Status">
          <input
            type="text"
            className={inputCls}
            value={fields.propertyTaxation || 'Average'}
            onChange={(e) => handleChange('propertyTaxation', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. Up to date / Paid"
          />
        </Field>
      </div>

      {/* Plot Boundaries */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-3">
          Plot / Land Boundaries (As per Site &amp; Title Deed)
        </span>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="North Boundary">
            <input
              type="text"
              className={inputCls}
              value={fields.boundaryNorth || ''}
              onChange={(e) => handleChange('boundaryNorth', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Plot No 120"
            />
          </Field>
          <Field label="South Boundary">
            <input
              type="text"
              className={inputCls}
              value={fields.boundarySouth || ''}
              onChange={(e) => handleChange('boundarySouth', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 30 Ft Wide Road"
            />
          </Field>
          <Field label="East Boundary">
            <input
              type="text"
              className={inputCls}
              value={fields.boundaryEast || ''}
              onChange={(e) => handleChange('boundaryEast', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Plot No 119"
            />
          </Field>
          <Field label="West Boundary">
            <input
              type="text"
              className={inputCls}
              value={fields.boundaryWest || ''}
              onChange={(e) => handleChange('boundaryWest', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. Open Land"
            />
          </Field>
        </div>
      </div>

      {/* Building Boundaries */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-3">
          Building / Superstructure Physical Boundaries
        </span>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Field label="North">
            <input
              type="text"
              className={inputCls}
              value={fields.buildingBoundaryNorth || ''}
              onChange={(e) => handleChange('buildingBoundaryNorth', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="South">
            <input
              type="text"
              className={inputCls}
              value={fields.buildingBoundarySouth || ''}
              onChange={(e) => handleChange('buildingBoundarySouth', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="East">
            <input
              type="text"
              className={inputCls}
              value={fields.buildingBoundaryEast || ''}
              onChange={(e) => handleChange('buildingBoundaryEast', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="West">
            <input
              type="text"
              className={inputCls}
              value={fields.buildingBoundaryWest || ''}
              onChange={(e) => handleChange('buildingBoundaryWest', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   5. Structural Details Section
   ───────────────────────────────────────────────────────────────────────────── */
export function HDFCStructuralDetailsSection({ fields, handleChange, isReadOnly = false }: HDFCSectionProps) {
  const ageRange = deriveAgeOfPropertyRange(fields.ageOfPropertyActual || fields.ageOfProperty || '');

  return (
    <Section title="5. Structural Details" number={5} defaultOpen={true}>
      <div className="grid md:grid-cols-3 gap-4 mb-4">
        <Field label="Structure Type">
          <select
            className={selectCls}
            value={fields.structureType || 'RCC'}
            onChange={(e) => handleChange('structureType', e.target.value)}
            disabled={isReadOnly}
          >
            {STRUCTURE_TYPE_OPTIONS.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Number of Floors">
          <input
            type="text"
            className={inputCls}
            value={fields.numberOfFloors || '1'}
            onChange={(e) => handleChange('numberOfFloors', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. G+1 / G+2"
          />
        </Field>

        <Field label="Internal Composition">
          <input
            type="text"
            className={inputCls}
            value={fields.internalComposition || 'Good'}
            onChange={(e) => handleChange('internalComposition', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. 3 BHK Ground Floor, 2 BHK First Floor"
          />
        </Field>

        <Field label="Actual Age of Property (in Years)">
          <input
            type="text"
            className={inputCls}
            value={fields.ageOfPropertyActual || fields.ageOfProperty || ''}
            onChange={(e) => {
              handleChange('ageOfPropertyActual', e.target.value);
              const derived = deriveAgeOfPropertyRange(e.target.value);
              if (derived) handleChange('ageOfProperty', derived);
            }}
            disabled={isReadOnly}
            placeholder="e.g. 5 Years"
          />
        </Field>

        <Field label="Age of Property Category (Auto-Derived)">
          <select
            className={selectCls}
            value={fields.ageOfProperty || ageRange || '1-10 years'}
            onChange={(e) => handleChange('ageOfProperty', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="1-10 years">1-10 years</option>
            <option value="11-25 years">11-25 years</option>
            <option value="26-50 years">26-50 years</option>
            <option value=">50 years">&gt;50 years</option>
          </select>
        </Field>

        <Field label="Estimated Future Life (in Years)">
          <input
            type="text"
            className={inputCls}
            value={fields.estimatedFutureLife || ''}
            onChange={(e) => handleChange('estimatedFutureLife', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. 55 Years"
          />
        </Field>

        <Field label="Quality of Construction">
          <select
            className={selectCls}
            value={fields.qualityOfConstruction || 'Good'}
            onChange={(e) => handleChange('qualityOfConstruction', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Superior">Superior</option>
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Poor">Poor</option>
          </select>
        </Field>

        <Field label="Maintenance Condition">
          <select
            className={selectCls}
            value={fields.maintenanceCondition || 'Good'}
            onChange={(e) => handleChange('maintenanceCondition', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Good">Good</option>
            <option value="Average">Average</option>
            <option value="Needs Maintenance">Needs Maintenance</option>
          </select>
        </Field>

        <Field label="Foundation">
          <input
            type="text"
            className={inputCls}
            value={fields.foundation || 'RCC'}
            onChange={(e) => handleChange('foundation', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Superstructure">
          <input
            type="text"
            className={inputCls}
            value={fields.superstructure || 'Brick Masonry'}
            onChange={(e) => handleChange('superstructure', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Flooring Type">
          <input
            type="text"
            className={inputCls}
            value={fields.flooringType || 'Tile Flooring'}
            onChange={(e) => handleChange('flooringType', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Roof Type">
          <input
            type="text"
            className={inputCls}
            value={fields.roofType || 'RCC Roofing'}
            onChange={(e) => handleChange('roofType', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Doors &amp; Windows">
          <input
            type="text"
            className={inputCls}
            value={fields.doorsWindows || 'Wooden/UPVC'}
            onChange={(e) => handleChange('doorsWindows', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Sanitary &amp; Plumbing">
          <input
            type="text"
            className={inputCls}
            value={fields.sanitary || 'Standard'}
            onChange={(e) => handleChange('sanitary', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Electrification">
          <input
            type="text"
            className={inputCls}
            value={fields.electrification || 'Concealed'}
            onChange={(e) => handleChange('electrification', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   6. Plan Approvals Section
   ───────────────────────────────────────────────────────────────────────────── */
export function HDFCPlanApprovalsSection({ fields, handleChange, isReadOnly = false }: HDFCSectionProps) {
  return (
    <Section title="6. Plan Approvals & Compliance" number={6} defaultOpen={true}>
      <div className="grid md:grid-cols-3 gap-4">
        <Field label="Construction Approved by Authority">
          <select
            className={selectCls}
            value={fields.constructionApproved || 'Yes'}
            onChange={(e) => handleChange('constructionApproved', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Yes">Yes</option>
            <option value="No">No</option>
            <option value="Gram Panchayat / Not Applicable">Gram Panchayat / Not Applicable</option>
          </select>
        </Field>

        <Field label="Approval Details / Letter No">
          <input
            type="text"
            className={inputCls}
            value={fields.approvalDetails || ''}
            onChange={(e) => handleChange('approvalDetails', e.target.value)}
            disabled={isReadOnly}
            placeholder="e.g. BMC/PL/2022/104"
          />
        </Field>

        <Field label="Violations Observed">
          <select
            className={selectCls}
            value={fields.violationsObserved || 'Low'}
            onChange={(e) => handleChange('violationsObserved', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Nil">Nil</option>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="Significant Deviation">Significant Deviation</option>
          </select>
        </Field>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   7. Land & Building Valuation Section
   ───────────────────────────────────────────────────────────────────────────── */
export function HDFCValuationSection({ fields, handleChange, isReadOnly = false }: HDFCSectionProps) {
  const isApartment = fields.valuationLayout === 'apartment';

  const handleFloorChange = (index: number, key: keyof HDFCFloorRow, val: string) => {
    const list = [...(fields.floors || [])];
    list[index] = { ...list[index], [key]: val };

    // Auto-calculate depreciation if lifeYears & ageYears change
    if (key === 'lifeYears' || key === 'ageYears') {
      const life = parseNum(list[index].lifeYears) || 60;
      const age = parseNum(list[index].ageYears) || 0;
      const depr = life > 0 ? Math.min(100, Math.round((age / life) * 100)) : 0;
      list[index].depreciationPct = String(depr);
    }

    handleChange('floors', list);
  };

  const handleAddFloor = () => {
    const current = fields.floors || [];
    const newFloor: HDFCFloorRow = {
      id: String(Date.now()),
      name: getFloorName(current.length),
      basisOfValuation: 'Built-up Area',
      area: '',
      rate: '',
      yearBuilt: '',
      lifeYears: '60',
      ageYears: '',
      depreciationPct: '0',
    };
    handleChange('floors', [...current, newFloor]);
  };

  const handleRemoveFloor = (index: number) => {
    const current = fields.floors || [];
    if (current.length <= 1) return;
    handleChange('floors', current.filter((_, i) => i !== index));
  };

  // Calculations
  const landVal = calculateTotalLandValue(fields.landArea, fields.landAreaUnit || 'Sqft', fields.landRatePerUnit);

  let totalBldgVal = 0;
  (fields.floors || []).forEach((fl) => {
    const a = parseNum(fl.area);
    const r = parseNum(fl.rate);
    const d = parseNum(fl.depreciationPct) / 100;
    const gross = a * r;
    const net = gross * (1 - d);
    totalBldgVal += net;
  });

  const totalMarketVal = landVal + totalBldgVal;

  return (
    <Section title="7. Land & Building Valuation" number={7} defaultOpen={true}>
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Valuation Methodology Layout
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleChange('valuationLayout', 'land_building')}
            disabled={isReadOnly}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              !isApartment
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-500'
            }`}
          >
            Land &amp; Building Method
          </button>
          <button
            type="button"
            onClick={() => handleChange('valuationLayout', 'apartment')}
            disabled={isReadOnly}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isApartment
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-amber-500'
            }`}
          >
            Flat / Apartment Method
          </button>
        </div>
      </div>

      {/* Part A: Land Valuation */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-3">
          Part A: Land Valuation
        </span>
        <div className="grid md:grid-cols-4 gap-3">
          <Field label="Land Area">
            <input
              type="text"
              className={inputCls}
              value={fields.landArea || ''}
              onChange={(e) => handleChange('landArea', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 2400"
            />
          </Field>

          <Field label="Unit of Area">
            <select
              className={selectCls}
              value={fields.landAreaUnit || 'Sqft'}
              onChange={(e) => handleChange('landAreaUnit', e.target.value)}
              disabled={isReadOnly}
            >
              <option value="Sqft">Sqft</option>
              <option value="Decimal">Decimal</option>
              <option value="Acre">Acre</option>
              <option value="SqMt">SqMt</option>
              <option value="Guntha">Guntha</option>
            </select>
          </Field>

          <Field label="Prevailing Market Rate (per unit)">
            <input
              type="text"
              className={inputCls}
              value={fields.landRatePerUnit || ''}
              onChange={(e) => handleChange('landRatePerUnit', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 2500"
            />
          </Field>

          <Field label="Govt Guideline Rate (per unit)">
            <input
              type="text"
              className={inputCls}
              value={fields.govtLandRate || ''}
              onChange={(e) => handleChange('govtLandRate', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1800"
            />
          </Field>
        </div>

        <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-600">Calculated Land Value (Part A):</span>
          <span className="text-sm font-bold text-amber-900">
            {landVal > 0 ? formatIndianCurrency(landVal) : '₹0'}
          </span>
        </div>
      </div>

      {/* Part B: Floor-wise Building Valuation */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Part B: Building Superstructure Valuation (Floor-wise)
          </span>
          {!isReadOnly && (
            <button
              type="button"
              onClick={handleAddFloor}
              className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Floor Level</span>
            </button>
          )}
        </div>

        <div className="space-y-3">
          {(fields.floors || []).map((floor, idx) => {
            const a = parseNum(floor.area);
            const r = parseNum(floor.rate);
            const d = parseNum(floor.depreciationPct) / 100;
            const netVal = a * r * (1 - d);

            return (
              <div
                key={floor.id || idx}
                className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-2.5 items-end"
              >
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Floor Level</label>
                  <input
                    type="text"
                    className={`${inputCls} text-xs py-1.5`}
                    value={floor.name}
                    onChange={(e) => handleFloorChange(idx, 'name', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Built-up Area (Sqft)</label>
                  <input
                    type="text"
                    className={`${inputCls} text-xs py-1.5`}
                    value={floor.area}
                    onChange={(e) => handleFloorChange(idx, 'area', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Area"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Rate (Rs/Sqft)</label>
                  <input
                    type="text"
                    className={`${inputCls} text-xs py-1.5`}
                    value={floor.rate}
                    onChange={(e) => handleFloorChange(idx, 'rate', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Rate"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Age (Yrs)</label>
                  <input
                    type="text"
                    className={`${inputCls} text-xs py-1.5`}
                    value={floor.ageYears}
                    onChange={(e) => handleFloorChange(idx, 'ageYears', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Depr (%)</label>
                  <input
                    type="text"
                    className={`${inputCls} text-xs py-1.5`}
                    value={floor.depreciationPct}
                    onChange={(e) => handleFloorChange(idx, 'depreciationPct', e.target.value)}
                    disabled={isReadOnly}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Net Value</label>
                  <div className="text-xs font-bold text-slate-800 py-2">
                    {netVal > 0 ? formatIndianCurrency(Math.round(netVal)) : '₹0'}
                  </div>
                </div>
                <div className="text-right">
                  {!isReadOnly && (fields.floors?.length || 0) > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFloor(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-4 rounded-xl border border-amber-300 bg-amber-50 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-900 uppercase block">Total Fair Market Valuation</span>
            <span className="text-[11px] text-amber-700">Land Value (Part A) + Building Net Value (Part B)</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-black text-amber-900 block">
              {totalMarketVal > 0 ? formatIndianCurrency(Math.round(totalMarketVal)) : '₹0'}
            </span>
            <span className="text-[11px] font-medium text-amber-800">
              {totalMarketVal > 0 ? rupeesInWords(Math.round(totalMarketVal)) : ''}
            </span>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   8. Abstract of Valuation Section
   ───────────────────────────────────────────────────────────────────────────── */
export function HDFCAbstractSection({ fields, handleChange, isReadOnly = false }: HDFCSectionProps) {
  return (
    <Section title="8. Abstract of Valuation & Guidelines" number={8} defaultOpen={true}>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Field label="Realizable Value Percentage (%)">
          <input
            type="text"
            className={inputCls}
            value={fields.realizablePct || '90'}
            onChange={(e) => handleChange('realizablePct', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>

        <Field label="Distress Sale Value Percentage (%)">
          <input
            type="text"
            className={inputCls}
            value={fields.distressPct || '80'}
            onChange={(e) => handleChange('distressPct', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-800 block mb-3">
          Government Guideline Valuation Reference
        </span>
        <div className="grid md:grid-cols-3 gap-3">
          <Field label="Guideline Land Area">
            <input
              type="text"
              className={inputCls}
              value={fields.guidelineLandArea || ''}
              onChange={(e) => handleChange('guidelineLandArea', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Guideline Land Rate">
            <input
              type="text"
              className={inputCls}
              value={fields.guidelineLandRate || ''}
              onChange={(e) => handleChange('guidelineLandRate', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
          <Field label="Total Guideline Value">
            <input
              type="text"
              className={inputCls}
              value={fields.guidelineValue || ''}
              onChange={(e) => handleChange('guidelineValue', e.target.value)}
              disabled={isReadOnly}
            />
          </Field>
        </div>
      </div>
    </Section>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   9. Remarks, Declaration & Valuation Certificate Section
   ───────────────────────────────────────────────────────────────────────────── */
export function HDFCRemarksDeclarationSection({ fields, handleChange, isReadOnly = false }: HDFCSectionProps) {
  return (
    <Section title="9. Remarks, Declaration & Certificate" number={9} defaultOpen={true}>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Field label="Demarcation on Site">
          <select
            className={selectCls}
            value={fields.demarcation || 'Clear'}
            onChange={(e) => handleChange('demarcation', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="Clear">Clear</option>
            <option value="Not Demarcated">Not Demarcated</option>
            <option value="Partially Demarcated">Partially Demarcated</option>
          </select>
        </Field>

        <Field label="Possession Status">
          <select
            className={selectCls}
            value={fields.possession || 'With Owner'}
            onChange={(e) => handleChange('possession', e.target.value)}
            disabled={isReadOnly}
          >
            <option value="With Owner">With Owner</option>
            <option value="With Tenant">With Tenant</option>
            <option value="Vacant Possession">Vacant Possession</option>
          </select>
        </Field>
      </div>

      <div className="mb-4">
        <Field label="Valuer Observations &amp; Remarks">
          <textarea
            rows={4}
            className={textareaCls}
            value={fields.remarks || ''}
            onChange={(e) => handleChange('remarks', e.target.value)}
            disabled={isReadOnly}
            placeholder="Special conditions, marketability comments, or legal encumbrance notes..."
          />
        </Field>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Field label="Inspecting Engineer / Representative Name">
          <input
            type="text"
            className={inputCls}
            value={fields.representativeName || ''}
            onChange={(e) => handleChange('representativeName', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
        <Field label="Representative Father's Name">
          <input
            type="text"
            className={inputCls}
            value={fields.representativeFatherName || ''}
            onChange={(e) => handleChange('representativeFatherName', e.target.value)}
            disabled={isReadOnly}
          />
        </Field>
      </div>

      {/* Valuation Certificate Box */}
      <div className="p-4 rounded-xl border border-slate-300 bg-slate-100/70 text-xs text-slate-700 leading-relaxed">
        <h4 className="font-bold text-slate-900 uppercase tracking-wide mb-1.5">
          Valuation Certificate &amp; Declaration
        </h4>
        <p>
          I hereby certify that I have physically inspected the subject property on{' '}
          <strong>{fields.dateOfInspection || '________'}</strong>. The statements of fact contained in this report are
          true and correct to the best of my knowledge and professional judgment. I have no direct or indirect interest in
          the property valued herein. The valuation has been prepared in conformity with the Indian Valuation Standards and
          procedural guidelines for <strong>HDFC Bank</strong>.
        </p>
      </div>
    </Section>
  );
}
