'use client';
import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFAxisSBBRenderer } from '@/lib/banks/pdf-axis-sbb-renderer';
import { Field, inputCls } from '../BaseBankReportComponents';

export const AXIS_SBB_CONFIG: BankConfig = {
  bankId: 'AXIS BANK',
  subTemplateId: 'SBB',
  displayName: 'Axis Bank — SBB (Small Business Banking)',
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6'],
  extraSections: [],
    axisSbbDeedNumberDate: '',
    axisSbbDeedNumberDateIsNA: false,
    axisSbbDeedNumberDateEditOn: false,
    axisSbbPlotKhasraNo: '',
    axisSbbPlotKhasraNoIsNA: false,
    axisSbbPlotKhasraNoEditOn: false,
    axisSbbRoadWidthMaterial: '',
    axisSbbRoadWidthMaterialIsNA: false,
    axisSbbColonySector: '',
    axisSbbColonySectorIsNA: false,
    axisSbbLocalityLandmark: '',
    axisSbbLocalityLandmarkIsNA: false,
    axisSbbVillageCity: '',
    axisSbbVillageCityIsNA: false,
    axisSbbVillageCityEditOn: false,
    axisSbbDistrict: '',
    axisSbbDistrictIsNA: false,
    axisSbbDistrictEditOn: false,
    axisSbbDistrictDropdown: '',
    axisSbbState: 'ODISHA',
    axisSbbStateIsNA: false,
    axisSbbStateEditOn: false,
    axisSbbStateDropdown: 'ODISHA',
    axisSbbPinCode: '',
    axisSbbPinCodeIsNA: false,
    axisSbbPinCodeEditOn: false,
    axisSbbDistanceFromCityCenter: '',
    axisSbbDistanceFromCityCenterIsNA: false,
    axisSbbDistanceFromCityCenterEditOn: false,
    axisSbbDistanceKm: '',
    
    // SECTION 5
    axisSbbPropertyType: [],
    axisSbbPropertyTypeIsNA: false,
    axisSbbLevelOfLand: 'PLAIN',
    axisSbbLevelOfLandIsNA: false,
    axisSbbLevelOfLandEditOn: false,
    axisSbbLevelOfLandDropdown: 'PLAIN',
    axisSbbAnyConstructionObserved: '',
    axisSbbAnyConstructionObservedIsNA: false,
    axisSbbPercentOfConstruction: '100',
    axisSbbPercentOfConstructionIsNA: false,
    axisSbbPercentOfConstructionEditOn: false,
    axisSbbVacantLandDemarcated: '',
    axisSbbVacantLandDemarcatedIsNA: false,
    axisSbbResidentialProperty: [],
    axisSbbResidentialPropertyIsNA: false,
    axisSbbCommercialIndustrialProperty: [],
    axisSbbCommercialIndustrialPropertyIsNA: false,
    
    axisSbbCivicAmenities: 'AVAILABLE, WITHIN THE RADIUS OF 1-2 KMS',
    axisSbbCivicAmenitiesIsNA: false,
    axisSbbCivicAmenitiesEditOn: false,
    axisSbbLocalTransport: [],
    axisSbbLocalTransportIsNA: false,
    axisSbbDistRailwayStationKm: '03',
    axisSbbDistRailwayStationName: '',
    axisSbbDistRailwayStation: '',
    axisSbbDistRailwayStationIsNA: false,
    axisSbbDistRailwayStationEditOn: false,
    axisSbbDistBusStopKm: '03',
    axisSbbDistBusStopName: '',
    axisSbbDistBusStop: '',
    axisSbbDistBusStopIsNA: false,
    axisSbbDistBusStopEditOn: false,

    // SECTION 6
    axisSbbApproachRoadSmall: '',
    axisSbbApproachRoadSmallIsNA: false,
    axisSbbApproachRoadRemark: '',
    axisSbbApproachRoadRemarkIsNA: false,
    axisSbbApproachRoadRemarkEditOn: false,
    axisSbbFireExtinguisher: 'YES',
    axisSbbFireExtinguisherIsNA: false,
    axisSbbFireExtinguisherEditOn: false,
    axisSbbLandLockedArea: 'NO',
    axisSbbLandLockedAreaIsNA: false,
    axisSbbLandLockedAreaEditOn: false,
    axisSbbCommunityDominatedArea: 'NO',
    axisSbbCommunityDominatedAreaIsNA: false,
    axisSbbCommunityDominatedAreaEditOn: false,
    axisSbbBoundariesMatchDocument: 'YES',
    axisSbbBoundariesMatchDocumentIsNA: false,
    axisSbbBoundariesMatchDocumentEditOn: false,

    axisSbbNorthAsPerDeed: '',
    axisSbbNorthAsPerDeedIsNA: false,
    axisSbbNorthAsPerActual: '',
    axisSbbNorthAsPerActualIsNA: false,
    axisSbbNorthEditOn: false,
    axisSbbSouthAsPerDeed: '',
    axisSbbSouthAsPerDeedIsNA: false,
    axisSbbSouthAsPerActual: '',
    axisSbbSouthAsPerActualIsNA: false,
    axisSbbSouthEditOn: false,
    axisSbbEastAsPerDeed: '',
    axisSbbEastAsPerDeedIsNA: false,
    axisSbbEastAsPerActual: '',
    axisSbbEastAsPerActualIsNA: false,
    axisSbbEastEditOn: false,
    axisSbbWestAsPerDeed: '',
    axisSbbWestAsPerDeedIsNA: false,
    axisSbbWestAsPerActual: '',
    axisSbbWestAsPerActualIsNA: false,
    axisSbbWestEditOn: false,

    axisSbbPlotAreaAsPerDocument: '',
    axisSbbPlotAreaAsPerDocumentIsNA: false,
    axisSbbPlotAreaAsPerDocumentEditOn: false,
    axisSbbPlotAreaSqft: '',
    axisSbbPlotAreaAcres: '',
    axisSbbPlotAreaAsPerSaleDeed: '',
    axisSbbPlotAreaAsPerSaleDeedIsNA: false,
    axisSbbPlotAreaAsPerSaleDeedEditOn: false,
    axisSbbClassOfLocality: 'MIDDLE CLASS',
    axisSbbClassOfLocalityIsNA: false,
    axisSbbClassOfLocalityEditOn: false,
    axisSbbQualityOfInfrastructure: 'GOOD',
    axisSbbQualityOfInfrastructureIsNA: false,
    axisSbbQualityOfInfrastructureEditOn: false,
    axisSbbOwnershipStatus: 'FREE HOLD',
    axisSbbOwnershipStatusIsNA: false,
    axisSbbOwnershipStatusEditOn: false,
    axisSbbOwnershipStatusSpecify: '',
    axisSbbApprovedUsage: 'RESIDENTIAL',
    axisSbbApprovedUsageIsNA: false,
    axisSbbApprovedUsageEditOn: false,
    axisSbbActualUsage: 'COMMERCIAL',
    axisSbbActualUsageIsNA: false,
    axisSbbActualUsageEditOn: false,
    axisSbbRestrictiveCovenants: 'NA',
    axisSbbRestrictiveCovenantsIsNA: false,
    axisSbbRestrictiveCovenantsEditOn: false,

    axisSbbPropertyLocation: '',
    axisSbbGoverningBody: '',
    axisSbbTownPlanningSubType: '',
    axisSbbDocPrevValuation: false,
    axisSbbDocApprovedLayout: false,
    axisSbbDocCommencement: false,
    axisSbbDocApprovedBuildingPlan: false,
    axisSbbDocSaleDeed: false,
    axisSbbDocOccupancy: false,
    axisSbbDocPartitionDeed: false,
    axisSbbDocSketchMap: false,
    axisSbbReportRefNo: '',
    axisSbbReportInitiatedBy: '',
    axisSbbAreaName: '',
    axisSbbOwnerName: '',
    axisSbbCustomerName: '',
    axisSbbDateOfVisit: '',
    axisSbbDateOfReport: '',
    axisSbbSaleDeedDiscretions: '',
    axisSbbPropertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    axisSbbAddressOfTheProperty: '',
    axisSbbPresentMarketValue: '',
    axisSbbDistressSaleValue: '',
    axisSbbEnableCoverPageValueEdit: false,
    axisSbbPurposeOfValuationDropdown: 'default',
    axisSbbPurposeOfValuation: 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY',
    axisSbbPreparedByCompany: 'M/s. S MOHANTY ASSOCIATES',
    axisSbbPreparedByDesignation: 'EMPANELLED VALUER & CHARTERED ENGINEER',
    axisSbbPreparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    axisSbbPreparedByStreet: 'Shiv Nagar Tankapani Road',
    axisSbbPreparedByCity: 'Bhubaneswar',
    axisSbbPreparedByState: 'Odisha',
    axisSbbPreparedByPinCode: '751018',
    axisSbbPreparedByPhone: '06742381145',
    axisSbbPreparedByMobile: '9937023855/9437074855',
  },
  extraSectionsStart: [
    {
      id: 'section-cover',
      title: 'Cover Page Details',
      number: 1,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => (
        <div className="animate-fade-in space-y-6">
          <div className="border border-blue-200 bg-[#f8fafc] rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">PROPERTY OWNER</h3>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                onClick={() => handleChange('axisSbbPropertyOwners', [...(fields.axisSbbPropertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.axisSbbPropertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.axisSbbPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRASANNA NAYAK"
                    />
                  </Field>
                  <Field label="Relationship" className="w-40">
                    <input
                      list={`sbb-relations-${idx}`}
                      className={inputCls}
                      value={owner.relationship || ''}
                      onChange={(e) => {
                        const arr = [...(fields.axisSbbPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. S/O"
                    />
                    <datalist id={`sbb-relations-${idx}`}>
                      <option value="S/O" />
                      <option value="D/O" />
                      <option value="W/O" />
                      <option value="C/O" />
                    </datalist>
                  </Field>
                  <Field label="OWNER'S RELATIVE'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.relativeName || owner.fatherName || ''}
                      onChange={(e) => {
                        const arr = [...(fields.axisSbbPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.axisSbbPropertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
                      onClick={() => {
                        const arr = [...fields.axisSbbPropertyOwners];
                        arr.splice(idx, 1);
                        handleChange('axisSbbPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="ADDRESS OF THE PROPERTY">
              <textarea className={inputCls} rows={3} value={fields.axisSbbAddressOfTheProperty || ''} onChange={e => handleChange('axisSbbAddressOfTheProperty', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <div className="border border-red-200 bg-[#fff5f5] rounded-xl p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('axisSbbEnableCoverPageValueEdit', !fields.axisSbbEnableCoverPageValueEdit)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.axisSbbEnableCoverPageValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.axisSbbEnableCoverPageValueEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${fields.axisSbbEnableCoverPageValueEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {fields.axisSbbEnableCoverPageValueEdit ? 'Edit On' : 'Edit Off'}
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">PRESENT MARKET VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input 
                    className={`${inputCls} ${!fields.axisSbbEnableCoverPageValueEdit ? 'bg-gray-50 text-gray-500' : ''}`} 
                    value={fields.axisSbbEnableCoverPageValueEdit ? (fields.axisSbbPresentMarketValue || '') : (() => {
                      const v8 = Number(fields.axisSbbTotalValueOfPropertyAfterCompletion || 0);
                      if (v8 > 0) return v8.toFixed(2);
                      const v7 = Number(fields.axisSbbMarketValueOfTheUnit || 0);
                      return v7 > 0 ? v7.toFixed(2) : '0.00';
                    })()} 
                    onChange={(e) => handleChange('axisSbbPresentMarketValue', e.target.value)} 
                    disabled={isReadOnly || !fields.axisSbbEnableCoverPageValueEdit} 
                  />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Current Value of Property (Plot + Construction) from Section 7 / Section 8</span>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">DISTRESS SALE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input 
                    className={`${inputCls} ${!fields.axisSbbEnableCoverPageValueEdit ? 'bg-gray-50 text-gray-500' : ''}`} 
                    value={fields.axisSbbEnableCoverPageValueEdit ? (fields.axisSbbDistressSaleValue || '') : (() => {
                      const v9 = Number(fields.axisSbbDistressValueOfTheProperty || 0);
                      return v9 > 0 ? v9.toFixed(2) : '0.00';
                    })()} 
                    onChange={(e) => handleChange('axisSbbDistressSaleValue', e.target.value)} 
                    disabled={isReadOnly || !fields.axisSbbEnableCoverPageValueEdit} 
                  />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Distress Valuation of the Property field from Section 9</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.axisSbbPurposeOfValuationDropdown || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('axisSbbPurposeOfValuationDropdown', val);
                  if (val === 'default') {
                    handleChange('axisSbbPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY');
                  } else {
                    handleChange('axisSbbPurposeOfValuation', '');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="default">TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {fields.axisSbbPurposeOfValuationDropdown === 'other' && (
              <div className="mt-3">
                <textarea className={inputCls} rows={3} placeholder="Enter custom purpose of valuation..." value={fields.axisSbbPurposeOfValuation || ''} onChange={(e) => handleChange('axisSbbPurposeOfValuation', e.target.value)} disabled={isReadOnly} />
              </div>
            )}
          </div>
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">PREPARED BY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company/Entity Name"><input className={inputCls} value={fields.axisSbbPreparedByCompany || ''} onChange={e => handleChange('axisSbbPreparedByCompany', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Professional Designation"><input className={inputCls} value={fields.axisSbbPreparedByDesignation || ''} onChange={e => handleChange('axisSbbPreparedByDesignation', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot Number"><input className={inputCls} value={fields.axisSbbPreparedByPlotNo || ''} onChange={e => handleChange('axisSbbPreparedByPlotNo', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Street/Locality"><input className={inputCls} value={fields.axisSbbPreparedByStreet || ''} onChange={e => handleChange('axisSbbPreparedByStreet', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="City"><input className={inputCls} value={fields.axisSbbPreparedByCity || ''} onChange={e => handleChange('axisSbbPreparedByCity', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="State"><input className={inputCls} value={fields.axisSbbPreparedByState || ''} onChange={e => handleChange('axisSbbPreparedByState', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="PIN Code"><input className={inputCls} value={fields.axisSbbPreparedByPinCode || ''} onChange={e => handleChange('axisSbbPreparedByPinCode', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone (Landline)">
                <input className={inputCls} value={fields.axisSbbPreparedByPhone || ''} onChange={e => { handleChange('axisSbbPreparedByPhone', e.target.value.replace(/[^0-9]/g, '')); }} disabled={isReadOnly} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={fields.axisSbbPreparedByMobile || ''} onChange={e => { handleChange('axisSbbPreparedByMobile', e.target.value.replace(/[a-zA-Z]/g, '')); }} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'axis-sbb-section-2',
      title: 'Case Details & Report Metadata',
      number: 2,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const isOwnerEditOn = fields.axisSbbEnableOwnerNameEdit || false;
        const computedOwnersText = (fields.axisSbbPropertyOwners || [])
          .filter((o: any) => o.name)
          .map((o: any) => `${o.name}`)
          .join(' & ');
        const propertyOwnerValue = isOwnerEditOn ? (fields.axisSbbOwnerName ?? computedOwnersText) : computedOwnersText;

        const maxVisitDate = new Date().toISOString().split('T')[0];

        return (
        <div className="animate-fade-in space-y-6">
          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' }}>
            <h3 className="font-bold text-gray-700 mb-4">CASE DETAILS & REPORT METADATA</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Report Reference Number">
                <input className={inputCls} required value={fields.axisSbbReportRefNo || ''} onChange={e => handleChange('axisSbbReportRefNo', e.target.value.toUpperCase())} disabled={isReadOnly} placeholder="E.g., SMA/1/07-26/09" />
              </Field>
              <Field label="Report Initiated By Area">
                <input list="axisSbbInitiatedByList" className={inputCls} value={fields.axisSbbReportInitiatedBy || ''} onChange={e => handleChange('axisSbbReportInitiatedBy', e.target.value)} disabled={isReadOnly} placeholder="E.g., BHUBANESWAR" />
                <datalist id="axisSbbInitiatedByList">
                  <option value="BHUBANESWAR" />
                  <option value="CUTTACK" />
                  <option value="SAMBALPUR" />
                </datalist>
              </Field>
              <Field label="Name of Area">
                <input className={inputCls} value={fields.axisSbbAreaName || ''} onChange={e => handleChange('axisSbbAreaName', e.target.value.toUpperCase())} disabled={isReadOnly} placeholder="E.g., SAMBALPUR" />
              </Field>

              <div className="col-span-1 w-full flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Name of Owner <span className="text-red-500">*</span></label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isOwnerEditOn ? 'On' : 'Off'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwnerEditOn && !fields.axisSbbOwnerName) {
                           handleChange('axisSbbOwnerName', computedOwnersText);
                        }
                        handleChange('axisSbbEnableOwnerNameEdit', !isOwnerEditOn);
                      }}
                      disabled={isReadOnly}
                      className={`w-8 h-4 rounded-full relative transition-colors ${isOwnerEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isOwnerEditOn ? 'translate-x-4' : ''}`} />
                    </button>
                  </div>
                </div>
                <input
                  className={inputCls}
                  required
                  value={propertyOwnerValue}
                  onChange={e => handleChange('axisSbbOwnerName', e.target.value.toUpperCase())}
                  readOnly={!isOwnerEditOn}
                  disabled={isReadOnly || !isOwnerEditOn}
                />
              </div>

              <Field label="Name of Customer">
                <input className={inputCls} required value={fields.axisSbbCustomerName || ''} onChange={e => handleChange('axisSbbCustomerName', e.target.value.toUpperCase())} disabled={isReadOnly} placeholder="E.g., SHREE MATESWARI ENTERPRISES" />
              </Field>
              <Field label="Date of Property Visit">
                <input type="date" max={maxVisitDate} className={inputCls} value={fields.axisSbbDateOfVisit || ''} onChange={e => handleChange('axisSbbDateOfVisit', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Date of Report">
                <input type="date" min={fields.axisSbbDateOfVisit || ''} className={inputCls} value={fields.axisSbbDateOfReport || ''} onChange={e => handleChange('axisSbbDateOfReport', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Sale Deed Discretions For Which Valuation Done" span={2}>
                <textarea className={inputCls} rows={2} value={fields.axisSbbSaleDeedDiscretions || ''} onChange={e => handleChange('axisSbbSaleDeedDiscretions', e.target.value)} disabled={isReadOnly} placeholder="E.g., COPY OF SALE DEED, ROR & SKETCH MAP" />
              </Field>
            </div>
          </div>
        </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-3',
      title: 'Legal Verification & Property Classification',
      number: 3,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const isGramPanchayat = fields.axisSbbGoverningBody === 'Town or Gram Panchayat or Rural';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}>
              <h3 className="font-bold text-gray-700 mb-4">LOCATION CLASSIFICATION & LOCAL AUTHORITY</h3>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Location of Property <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  {['Urban', 'Semi-Urban', 'Rural/Gram Panchayat'].map((opt) => (
                    <label key={opt} className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-sky-200 shadow-sm hover:bg-sky-50 transition-colors">
                      <input
                        type="radio"
                        name="property_location"
                        value={opt}
                        checked={fields.axisSbbPropertyLocation === opt}
                        onChange={e => handleChange('axisSbbPropertyLocation', e.target.value)}
                        disabled={isReadOnly}
                        className="text-sky-600 focus:ring-sky-500"
                        required
                      />
                      <span className="text-sm text-gray-700 font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Governing Body Authority <span className="text-red-500">*</span></label>
                <div className="flex gap-4">
                  {['Corporation', 'Municipality', 'Town or Gram Panchayat or Rural'].map((opt) => (
                    <label key={opt} className="flex items-center space-x-2 cursor-pointer bg-white px-4 py-2 rounded-lg border border-sky-200 shadow-sm hover:bg-sky-50 transition-colors">
                      <input
                        type="radio"
                        name="governing_body"
                        value={opt}
                        checked={fields.axisSbbGoverningBody === opt}
                        onChange={e => {
                          handleChange('axisSbbGoverningBody', e.target.value);
                          if (e.target.value !== 'Town or Gram Panchayat or Rural') {
                            handleChange('axisSbbTownPlanningSubType', '');
                          }
                        }}
                        disabled={isReadOnly}
                        className="text-sky-600 focus:ring-sky-500"
                        required
                      />
                      <span className="text-sm text-gray-700 font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={`mt-4 p-4 border rounded-lg transition-all duration-300 ${isGramPanchayat ? 'bg-white border-sky-200' : 'bg-slate-50 border-slate-200 opacity-60 grayscale-[50%]'}`}>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Town / Gram Panchayat Planning Sub-Type <span className="text-red-500">*</span></label>
                <div className="flex flex-col space-y-3">
                  {[
                    'Type 1: Layout plan & individual construction both are approved by Town Planning Authority.',
                    'Type 2A: Layout plan approved by Town Planning Authority and construction approved by Grampanchayat.',
                    'Type 2B: Layout plan & individual construction both are approved by Grampanchayat but property now falls in Municipality.',
                    'Type 3: Layout plan & individual construction both are approved by Grampanchayat but property now falls inside Gram Panchayat.'
                  ].map((opt) => (
                    <label key={opt} className={`flex items-start space-x-3 p-2 rounded-md transition-colors ${isGramPanchayat ? 'cursor-pointer hover:bg-sky-50' : 'cursor-not-allowed'}`}>
                      <input
                        type="radio"
                        name="town_gp_subtype"
                        value={opt}
                        checked={fields.axisSbbTownPlanningSubType === opt}
                        onChange={e => handleChange('axisSbbTownPlanningSubType', e.target.value)}
                        disabled={isReadOnly || !isGramPanchayat}
                        className={`mt-1 ${isGramPanchayat ? 'text-sky-600 focus:ring-sky-500' : 'text-slate-400'}`}
                        required={isGramPanchayat}
                      />
                      <span className={`text-sm ${isGramPanchayat ? 'text-gray-700' : 'text-gray-400'}`}>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
              <h3 className="font-bold text-gray-700 mb-4">DOCUMENTS PROVIDED CHECKLIST</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { id: 'axisSbbDocPrevValuation', label: 'Copy of Previous Valuation Report' },
                  { id: 'axisSbbDocApprovedLayout', label: 'Approved Layout' },
                  { id: 'axisSbbDocCommencement', label: 'Commencement Certificate' },
                  { id: 'axisSbbDocApprovedBuildingPlan', label: 'Approved Building Plan' },
                  { id: 'axisSbbDocSaleDeed', label: 'Copy of Sale Deed / Patta Certificate' },
                  { id: 'axisSbbDocOccupancy', label: 'Occupancy Certificate' },
                  { id: 'axisSbbDocPartitionDeed', label: 'Copy Partition Deed' },
                  { id: 'axisSbbDocSketchMap', label: 'Sketch Map / ROR' }
                ].map((doc) => {
                  const isChecked = !!fields[doc.id];
                  return (
                  <div key={doc.id} className={`flex items-center justify-between bg-white p-3 rounded-lg border shadow-sm transition-colors ${isChecked ? 'border-emerald-300 bg-emerald-50/30' : 'border-emerald-100 hover:bg-emerald-50'}`}>
                    <label className="flex items-center space-x-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={e => handleChange(doc.id, e.target.checked)}
                        disabled={isReadOnly}
                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                      />
                      <span className="text-sm text-gray-700 font-medium">{doc.label}</span>
                    </label>
                    {isChecked && (
                      <label className="cursor-pointer p-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors flex items-center justify-center animate-fade-in" title="Attach Document / View Link">
                        <input type="file" accept=".pdf,image/*" className="hidden" disabled={isReadOnly} />
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </label>
                    )}
                  </div>
                )})}
              </div>
              
              {!fields.axisSbbDocSaleDeed && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md animate-fade-in flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Required:</strong> At least one title ownership document (e.g., Copy of Sale Deed / Patta Certificate) must be selected.</span>
                </div>
              )}
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-4',
      title: 'Property Identification & Postal Address',
      number: 4,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const address = fields.axisSbbAddressOfTheProperty || '';
        
        // Auto-fill computations from address
        const plotComputed = address.split(/MOUZA|VILLAGE/i)[0].trim().toUpperCase() || 'KHATA NO. XX, PLOT NO. YY';
        const mouzaMatch = address.match(/(?:MOUZA|VILLAGE)[-\s]*(.*?)(?=,|$|DIST)/i);
        const mouzaComputed = mouzaMatch ? mouzaMatch[0].toUpperCase() : '';
        const distMatch = address.match(/DIST(?:RICT)?[-\s]*(.*?)(?=,|-|PIN|$)/i);
        const distComputed = distMatch ? distMatch[1].trim().toUpperCase() : '';
        const pinMatch = address.match(/PIN[-\s]*(\d{6})/i);
        const pinComputed = pinMatch ? pinMatch[1] : '';
        const distanceKm = fields.axisSbbDistanceKm || '03';
        const refCity = distComputed || mouzaComputed || 'CITY';
        const distanceComputed = `${distanceKm}- KMS FROM ${refCity} CITY CENTRE`.toUpperCase();

        const renderNaToggle = (fieldName: string) => (
          <label className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-gray-500 cursor-pointer ml-4">
            <input 
              type="checkbox" 
              checked={!!fields[`${fieldName}IsNA`]} 
              onChange={e => handleChange(`${fieldName}IsNA`, e.target.checked)}
              disabled={isReadOnly}
              className="w-3 h-3 text-red-500 rounded focus:ring-red-500 border-gray-300"
            />
            <span>NA</span>
          </label>
        );

        const renderEditSwitch = (fieldName: string, disabled: boolean) => {
          const isEditOn = !!fields[`${fieldName}EditOn`];
          return (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isEditOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => handleChange(`${fieldName}EditOn`, !isEditOn)}
                disabled={disabled || isReadOnly}
                className={`w-8 h-4 rounded-full relative transition-colors ${isEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isEditOn ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          );
        };

        const distDropdown = fields.axisSbbDistrictDropdown || '';
        const stateDropdown = fields.axisSbbStateDropdown || 'ODISHA';
        
        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }}>
              <h3 className="font-bold text-gray-700 mb-4">CADASTRAL & POSTAL ADDRESS DETAILS</h3>
              
              <div className="grid grid-cols-1 gap-5">
                
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">LEASE/SALE DEED NUMBER(S) & DATE <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbDeedNumberDate')}
                    </div>
                    {renderEditSwitch('axisSbbDeedNumberDate', !!fields.axisSbbDeedNumberDateIsNA)}
                  </div>
                  <textarea
                    className={`${inputCls} resize-y min-h-[40px]`}
                    rows={1}
                    value={fields.axisSbbDeedNumberDateIsNA ? 'NA' : (fields.axisSbbDeedNumberDateEditOn ? (fields.axisSbbDeedNumberDate || '') : (fields.axisSbbDeedNumberDate || ''))}
                    onChange={e => handleChange('axisSbbDeedNumberDate', e.target.value.toUpperCase())}
                    readOnly={!fields.axisSbbDeedNumberDateEditOn || fields.axisSbbDeedNumberDateIsNA}
                    disabled={isReadOnly || (!fields.axisSbbDeedNumberDateEditOn && !fields.axisSbbDeedNumberDateIsNA)}
                    placeholder="2108, DATED-22.08.2005"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">PLOT NO/ S.NO/ G.NO/ KHASRA NO/PATTA NO <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbPlotKhasraNo')}
                    </div>
                    {renderEditSwitch('axisSbbPlotKhasraNo', !!fields.axisSbbPlotKhasraNoIsNA)}
                  </div>
                  <textarea
                    className={`${inputCls} resize-y min-h-[40px]`}
                    rows={1}
                    value={fields.axisSbbPlotKhasraNoIsNA ? 'NA' : (fields.axisSbbPlotKhasraNoEditOn ? (fields.axisSbbPlotKhasraNo || '') : plotComputed)}
                    onChange={e => handleChange('axisSbbPlotKhasraNo', e.target.value.toUpperCase())}
                    readOnly={!fields.axisSbbPlotKhasraNoEditOn || fields.axisSbbPlotKhasraNoIsNA}
                    disabled={isReadOnly || (!fields.axisSbbPlotKhasraNoEditOn && !fields.axisSbbPlotKhasraNoIsNA)}
                  />
                  <span className="text-[10px] text-gray-400 mt-1">Parsed from Section 1 Address</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">ROAD <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbRoadWidthMaterial')}
                    </div>
                    <input
                      className={inputCls}
                      required
                      value={fields.axisSbbRoadWidthMaterialIsNA ? 'NA' : (fields.axisSbbRoadWidthMaterial || '')}
                      onChange={e => handleChange('axisSbbRoadWidthMaterial', e.target.value.toUpperCase())}
                      readOnly={fields.axisSbbRoadWidthMaterialIsNA}
                      disabled={isReadOnly || fields.axisSbbRoadWidthMaterialIsNA}
                      placeholder="20 FEET WIDE CC ROAD"
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex items-center mb-1">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">COLONY/NAGAR/SECTOR</label>
                      {renderNaToggle('axisSbbColonySector')}
                    </div>
                    <input
                      className={inputCls}
                      value={fields.axisSbbColonySectorIsNA ? 'NA' : (fields.axisSbbColonySector || '')}
                      onChange={e => handleChange('axisSbbColonySector', e.target.value.toUpperCase())}
                      readOnly={fields.axisSbbColonySectorIsNA}
                      disabled={isReadOnly || fields.axisSbbColonySectorIsNA}
                      placeholder="SAMBALPUR"
                    />
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-1">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">LOCALITY/ LANDMARK <span className="text-red-500">*</span></label>
                    {renderNaToggle('axisSbbLocalityLandmark')}
                  </div>
                  <input
                    className={inputCls}
                    required
                    value={fields.axisSbbLocalityLandmarkIsNA ? 'NA' : (fields.axisSbbLocalityLandmark || '')}
                    onChange={e => {
                      const val = e.target.value;
                      const cap = val.replace(/\b\w/g, char => char.toUpperCase());
                      handleChange('axisSbbLocalityLandmark', cap);
                    }}
                    readOnly={fields.axisSbbLocalityLandmarkIsNA}
                    disabled={isReadOnly || fields.axisSbbLocalityLandmarkIsNA}
                    placeholder="Near Pratima Clinic"
                  />
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">VILLAGE/TOWN/CITY <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbVillageCity')}
                    </div>
                    {renderEditSwitch('axisSbbVillageCity', !!fields.axisSbbVillageCityIsNA)}
                  </div>
                  <textarea
                    className={`${inputCls} resize-y min-h-[40px]`}
                    rows={1}
                    value={fields.axisSbbVillageCityIsNA ? 'NA' : (fields.axisSbbVillageCityEditOn ? (fields.axisSbbVillageCity || '') : mouzaComputed)}
                    onChange={e => handleChange('axisSbbVillageCity', e.target.value.toUpperCase())}
                    readOnly={!fields.axisSbbVillageCityEditOn || fields.axisSbbVillageCityIsNA}
                    disabled={isReadOnly || (!fields.axisSbbVillageCityEditOn && !fields.axisSbbVillageCityIsNA)}
                  />
                  <span className="text-[10px] text-gray-400 mt-1">Parsed from Section 1 Address</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DISTRICT <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbDistrict')}
                      </div>
                      {renderEditSwitch('axisSbbDistrict', !!fields.axisSbbDistrictIsNA)}
                    </div>
                    <select
                      className={selectCls}
                      required
                      value={fields.axisSbbDistrictIsNA ? 'NA' : (fields.axisSbbDistrictEditOn ? distDropdown : 'AUTO')}
                      onChange={e => {
                        const v = e.target.value;
                        handleChange('axisSbbDistrictDropdown', v);
                        if (v !== 'CUSTOM') {
                          handleChange('axisSbbDistrict', v);
                        }
                      }}
                      disabled={isReadOnly || !fields.axisSbbDistrictEditOn || fields.axisSbbDistrictIsNA}
                    >
                      {!fields.axisSbbDistrictEditOn && <option value="AUTO">{distComputed}</option>}
                      <option value="">Select District</option>
                      <option value="SAMBALPUR">SAMBALPUR</option>
                      <option value="CUTTACK">CUTTACK</option>
                      <option value="BHUBANESWAR">BHUBANESWAR</option>
                      <option value="CUSTOM">Custom...</option>
                    </select>
                    {fields.axisSbbDistrictEditOn && distDropdown === 'CUSTOM' && !fields.axisSbbDistrictIsNA && (
                      <input
                        className={`${inputCls} mt-2`}
                        value={fields.axisSbbDistrict || ''}
                        onChange={e => handleChange('axisSbbDistrict', e.target.value.toUpperCase())}
                        disabled={isReadOnly}
                        placeholder="Enter Custom District"
                      />
                    )}
                    <span className="text-[10px] text-gray-400 mt-1">Parsed from Section 1 Address</span>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">STATE <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbState')}
                      </div>
                      {renderEditSwitch('axisSbbState', !!fields.axisSbbStateIsNA)}
                    </div>
                    <select
                      className={selectCls}
                      required
                      value={fields.axisSbbStateIsNA ? 'NA' : stateDropdown}
                      onChange={e => {
                        const v = e.target.value;
                        handleChange('axisSbbStateDropdown', v);
                        if (v !== 'CUSTOM') {
                          handleChange('axisSbbState', v);
                        }
                      }}
                      disabled={isReadOnly || !fields.axisSbbStateEditOn || fields.axisSbbStateIsNA}
                    >
                      <option value="">Select State</option>
                      <option value="ODISHA">ODISHA</option>
                      <option value="CHHATTISGARH">CHHATTISGARH</option>
                      <option value="JHARKHAND">JHARKHAND</option>
                      <option value="WEST BENGAL">WEST BENGAL</option>
                      <option value="ANDHRA PRADESH">ANDHRA PRADESH</option>
                      <option value="TELANGANA">TELANGANA</option>
                      <option value="CUSTOM">Custom...</option>
                    </select>
                    {fields.axisSbbStateEditOn && stateDropdown === 'CUSTOM' && !fields.axisSbbStateIsNA && (
                      <input
                        className={`${inputCls} mt-2`}
                        value={fields.axisSbbState || ''}
                        onChange={e => handleChange('axisSbbState', e.target.value.toUpperCase())}
                        disabled={isReadOnly}
                        placeholder="Enter Custom State"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">PIN CODE <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbPinCode')}
                      </div>
                      {renderEditSwitch('axisSbbPinCode', !!fields.axisSbbPinCodeIsNA)}
                    </div>
                    <input
                      className={inputCls}
                      required
                      pattern="[0-9]{6}"
                      maxLength={6}
                      value={fields.axisSbbPinCodeIsNA ? 'NA' : (fields.axisSbbPinCodeEditOn ? (fields.axisSbbPinCode || '') : pinComputed)}
                      onChange={e => handleChange('axisSbbPinCode', e.target.value.replace(/\D/g, ''))}
                      readOnly={!fields.axisSbbPinCodeEditOn || fields.axisSbbPinCodeIsNA}
                      disabled={isReadOnly || (!fields.axisSbbPinCodeEditOn && !fields.axisSbbPinCodeIsNA)}
                      placeholder="768006"
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DISTANCE <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbDistanceFromCityCenter')}
                      </div>
                      {renderEditSwitch('axisSbbDistanceFromCityCenter', !!fields.axisSbbDistanceFromCityCenterIsNA)}
                    </div>
                    {!fields.axisSbbDistanceFromCityCenterEditOn && !fields.axisSbbDistanceFromCityCenterIsNA && (
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="number"
                          className={`${inputCls} w-20`}
                          placeholder="KM"
                          value={fields.axisSbbDistanceKm || ''}
                          onChange={e => handleChange('axisSbbDistanceKm', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium whitespace-nowrap">KM from {refCity}</span>
                      </div>
                    )}
                    <textarea
                      className={`${inputCls} resize-y min-h-[40px] ${!fields.axisSbbDistanceFromCityCenterEditOn && !fields.axisSbbDistanceFromCityCenterIsNA ? 'bg-amber-50 text-amber-800 border-amber-300' : ''}`}
                      rows={1}
                      value={fields.axisSbbDistanceFromCityCenterIsNA ? 'NA' : (fields.axisSbbDistanceFromCityCenterEditOn ? (fields.axisSbbDistanceFromCityCenter || '') : distanceComputed)}
                      onChange={e => handleChange('axisSbbDistanceFromCityCenter', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbDistanceFromCityCenterEditOn || fields.axisSbbDistanceFromCityCenterIsNA}
                      disabled={isReadOnly || (!fields.axisSbbDistanceFromCityCenterEditOn && !fields.axisSbbDistanceFromCityCenterIsNA)}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-5',
      title: 'Property Characteristics & Physical Site Assessment',
      number: 5,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const renderNaToggle = (fieldName: string) => (
          <label className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-gray-500 cursor-pointer ml-4">
            <input 
              type="checkbox" 
              checked={!!fields[`${fieldName}IsNA`]} 
              onChange={e => handleChange(`${fieldName}IsNA`, e.target.checked)}
              disabled={isReadOnly}
              className="w-3 h-3 text-red-500 rounded focus:ring-red-500 border-gray-300"
            />
            <span>NA</span>
          </label>
        );

        const renderEditSwitch = (fieldName: string, disabled: boolean) => {
          const isEditOn = !!fields[`${fieldName}EditOn`];
          return (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isEditOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => handleChange(`${fieldName}EditOn`, !isEditOn)}
                disabled={disabled || isReadOnly}
                className={`w-8 h-4 rounded-full relative transition-colors ${isEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isEditOn ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          );
        };

        const handleMultiSelect = (field: string, val: string) => {
          const arr = Array.isArray(fields[field]) ? [...fields[field]] : [];
          if (arr.includes(val)) {
            handleChange(field, arr.filter(x => x !== val));
          } else {
            handleChange(field, [...arr, val]);
          }
        };

        const renderMultiSelect = (field: string, options: string[], isNA: boolean) => (
          <div className={`grid grid-cols-2 md:grid-cols-3 gap-3 ${isNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            {options.map(opt => {
              const isChecked = Array.isArray(fields[field]) && fields[field].includes(opt);
              return (
                <label key={opt} className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-yellow-50/50 border-yellow-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleMultiSelect(field, opt)}
                    disabled={isReadOnly || isNA}
                    className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500 border-gray-300"
                  />
                  <span className="text-xs font-semibold text-gray-700">{opt}</span>
                </label>
              );
            })}
          </div>
        );

        // Auto computed station and bus stand names based on address
        const address = fields.axisSbbAddressOfTheProperty || '';
        const distMatch = address.match(/DIST(?:RICT)?[-\s]*(.*?)(?=,|-|PIN|$)/i);
        const mouzaMatch = address.match(/(?:MOUZA|VILLAGE)[-\s]*(.*?)(?=,|$|DIST)/i);
        const parsedCity = (distMatch ? distMatch[1] : (mouzaMatch ? mouzaMatch[1] : 'CITY')).trim().toUpperCase();

        const stationName = fields.axisSbbDistRailwayStationName || parsedCity;
        const busStopName = fields.axisSbbDistBusStopName || parsedCity;
        const stationDistKm = fields.axisSbbDistRailwayStationKm || '03';
        const busStopDistKm = fields.axisSbbDistBusStopKm || '03';

        const stationComputed = `${stationDistKm}-KMS (${stationName} RAILWAY STATION)`.toUpperCase();
        const busStopComputed = `${busStopDistKm}-KMS. (${busStopName} BUS STOP)`.toUpperCase();

        const levelDropdown = fields.axisSbbLevelOfLandDropdown || 'PLAIN';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FEFCE8', borderColor: '#FEF08A' }}>
              <h3 className="font-bold text-gray-700 mb-4">TYPE OF PROPERTY</h3>
              
              <div className="space-y-6">
                
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">(A) PLOT/UNDER CONSTRUCTION</label>
                    {renderNaToggle('axisSbbPropertyType')}
                  </div>
                  {renderMultiSelect('axisSbbPropertyType', ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'VACANT LAND/PLOT'], !!fields.axisSbbPropertyTypeIsNA)}
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">LEVEL OF LAND WITH TOPOGRAPHICAL CONDITIONS <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbLevelOfLand')}
                    </div>
                    {renderEditSwitch('axisSbbLevelOfLand', !!fields.axisSbbLevelOfLandIsNA)}
                  </div>
                  <select
                    className={selectCls}
                    value={fields.axisSbbLevelOfLandIsNA ? 'NA' : levelDropdown}
                    onChange={e => {
                      const v = e.target.value;
                      handleChange('axisSbbLevelOfLandDropdown', v);
                      if (v !== 'CUSTOM') handleChange('axisSbbLevelOfLand', v);
                    }}
                    disabled={isReadOnly || !fields.axisSbbLevelOfLandEditOn || fields.axisSbbLevelOfLandIsNA}
                  >
                    <option value="PLAIN">PLAIN</option>
                    <option value="SLOPING">SLOPING</option>
                    <option value="LOW LYING">LOW LYING</option>
                    <option value="ELEVATED / HILLY">ELEVATED / HILLY</option>
                    <option value="CUSTOM">Custom...</option>
                  </select>
                  {fields.axisSbbLevelOfLandEditOn && levelDropdown === 'CUSTOM' && !fields.axisSbbLevelOfLandIsNA && (
                    <input
                      className={`${inputCls} mt-2`}
                      value={fields.axisSbbLevelOfLand || ''}
                      onChange={e => handleChange('axisSbbLevelOfLand', e.target.value.toUpperCase())}
                      disabled={isReadOnly}
                      placeholder="Enter custom level of land"
                    />
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">ANY CONSTRUCTION OBSERVED ON PLOT <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbAnyConstructionObserved')}
                    </div>
                    <div className={`flex space-x-4 ${fields.axisSbbAnyConstructionObservedIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      {['YES', 'NO'].map(opt => (
                        <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="radio"
                            name="any_construction_observed_on_plot"
                            value={opt}
                            checked={fields.axisSbbAnyConstructionObserved === opt && !fields.axisSbbAnyConstructionObservedIsNA}
                            onChange={e => {
                              handleChange('axisSbbAnyConstructionObserved', e.target.value);
                              if (e.target.value === 'NO') {
                                handleChange('axisSbbPercentOfConstruction', '0');
                              }
                            }}
                            disabled={isReadOnly || fields.axisSbbAnyConstructionObservedIsNA}
                            className="text-yellow-500 focus:ring-yellow-400"
                          />
                          <span className="text-sm font-semibold">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">% OF CONSTRUCTION <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbPercentOfConstruction')}
                      </div>
                      {renderEditSwitch('axisSbbPercentOfConstruction', !!fields.axisSbbPercentOfConstructionIsNA)}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        className={`${inputCls} pr-8`}
                        value={fields.axisSbbPercentOfConstructionIsNA ? '' : (fields.axisSbbPercentOfConstruction || '')}
                        onChange={e => handleChange('axisSbbPercentOfConstruction', e.target.value)}
                        readOnly={!fields.axisSbbPercentOfConstructionEditOn || fields.axisSbbPercentOfConstructionIsNA}
                        disabled={isReadOnly || (!fields.axisSbbPercentOfConstructionEditOn && !fields.axisSbbPercentOfConstructionIsNA)}
                        placeholder={fields.axisSbbPercentOfConstructionIsNA ? 'NA' : '100'}
                      />
                      <span className="absolute right-3 top-2.5 text-gray-500 font-bold">%</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">WHETHER VACANT LAND PROPERTY IS DEMARCATED</label>
                    {renderNaToggle('axisSbbVacantLandDemarcated')}
                  </div>
                  <div className={`flex space-x-2 ${fields.axisSbbVacantLandDemarcatedIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    {['YES', 'NO'].map(opt => {
                      const active = fields.axisSbbVacantLandDemarcated === opt && !fields.axisSbbVacantLandDemarcatedIsNA;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleChange('axisSbbVacantLandDemarcated', opt)}
                          disabled={isReadOnly || fields.axisSbbVacantLandDemarcatedIsNA}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-colors ${active ? 'bg-yellow-100 border-yellow-400 text-yellow-800' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">(B) RESIDENTIAL PROPERTY:</label>
                    {renderNaToggle('axisSbbResidentialProperty')}
                  </div>
                  {renderMultiSelect('axisSbbResidentialProperty', ['INDEPENDENT HOUSE', 'BUNGALOW', 'ROW HOUSE/FLAT'], !!fields.axisSbbResidentialPropertyIsNA)}
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">(C) COMMERCIAL/INDUSTRIAL PROPERTY:</label>
                    {renderNaToggle('axisSbbCommercialIndustrialProperty')}
                  </div>
                  {renderMultiSelect('axisSbbCommercialIndustrialProperty', ['GODOWN', 'INDURSTRIAL', 'PETROL PUMP', 'OFFICE', 'VACANT LAND', 'UNIT IN A MALL'], !!fields.axisSbbCommercialIndustrialPropertyIsNA)}
                </div>

              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#ECFEFF', borderColor: '#A5F3FC' }}>
              <h3 className="font-bold text-gray-700 mb-4">ACCESSIBILITY/ BOUNDARIES/OTHERS</h3>
              
              <div className="space-y-5">
                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">CIVIC AMENITIES LIKE SCHOOL, HOSPITAL, MARKET, ETC. <span className="text-red-500">*</span></label>
                      {renderNaToggle('axisSbbCivicAmenities')}
                    </div>
                    {renderEditSwitch('axisSbbCivicAmenities', !!fields.axisSbbCivicAmenitiesIsNA)}
                  </div>
                  <div className={`flex flex-col md:flex-row gap-3 ${fields.axisSbbCivicAmenitiesIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    {['AVAILABLE, WITHIN THE RADIUS OF 1-2 KMS', 'NOT AVAILABLE'].map(opt => (
                      <label key={opt} className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${(fields.axisSbbCivicAmenities === opt && !fields.axisSbbCivicAmenitiesIsNA) ? 'bg-cyan-50/50 border-cyan-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                        <input
                          type="radio"
                          name="civic_amenities_like_school_hospital_market_etc"
                          value={opt}
                          checked={fields.axisSbbCivicAmenities === opt && !fields.axisSbbCivicAmenitiesIsNA}
                          onChange={e => handleChange('axisSbbCivicAmenities', e.target.value)}
                          disabled={isReadOnly || !fields.axisSbbCivicAmenitiesEditOn || fields.axisSbbCivicAmenitiesIsNA}
                          className="text-cyan-500 focus:ring-cyan-400 border-gray-300"
                        />
                        <span className="text-xs font-semibold text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">AVAILABILITY OF LOCAL TRANSPORT</label>
                    {renderNaToggle('axisSbbLocalTransport')}
                  </div>
                  <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${fields.axisSbbLocalTransportIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    {['METRO', 'LOCAL TRAIN', 'BUS', 'PERSONAL TRANSPORT'].map(opt => {
                      const isChecked = Array.isArray(fields.axisSbbLocalTransport) && fields.axisSbbLocalTransport.includes(opt);
                      return (
                        <label key={opt} className={`flex justify-center items-center p-2 border rounded-full cursor-pointer transition-colors ${isChecked ? 'bg-cyan-500 border-cyan-500 text-white shadow-sm' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={isChecked}
                            onChange={() => handleMultiSelect('axisSbbLocalTransport', opt)}
                            disabled={isReadOnly || fields.axisSbbLocalTransportIsNA}
                          />
                          <span className="text-[11px] font-bold tracking-wide">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DISTANCE FROM RAILWAY STATION <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbDistRailwayStation')}
                      </div>
                      {renderEditSwitch('axisSbbDistRailwayStation', !!fields.axisSbbDistRailwayStationIsNA)}
                    </div>
                    {!fields.axisSbbDistRailwayStationEditOn && !fields.axisSbbDistRailwayStationIsNA && (
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="number"
                          className={`${inputCls} w-20 px-2`}
                          placeholder="KM"
                          value={fields.axisSbbDistRailwayStationKm || ''}
                          onChange={e => handleChange('axisSbbDistRailwayStationKm', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium">KMS (</span>
                        <input
                          type="text"
                          className={`${inputCls} flex-1 px-2 uppercase`}
                          placeholder={parsedCity}
                          value={fields.axisSbbDistRailwayStationName || ''}
                          onChange={e => handleChange('axisSbbDistRailwayStationName', e.target.value.toUpperCase())}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium">RAILWAY STATION)</span>
                      </div>
                    )}
                    <input
                      className={`${inputCls} ${!fields.axisSbbDistRailwayStationEditOn && !fields.axisSbbDistRailwayStationIsNA ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : ''}`}
                      value={fields.axisSbbDistRailwayStationIsNA ? 'NA' : (fields.axisSbbDistRailwayStationEditOn ? (fields.axisSbbDistRailwayStation || '') : stationComputed)}
                      onChange={e => handleChange('axisSbbDistRailwayStation', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbDistRailwayStationEditOn || fields.axisSbbDistRailwayStationIsNA}
                      disabled={isReadOnly || (!fields.axisSbbDistRailwayStationEditOn && !fields.axisSbbDistRailwayStationIsNA)}
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">BUS STOP/TAXI/ AUTO STAND <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbDistBusStop')}
                      </div>
                      {renderEditSwitch('axisSbbDistBusStop', !!fields.axisSbbDistBusStopIsNA)}
                    </div>
                    {!fields.axisSbbDistBusStopEditOn && !fields.axisSbbDistBusStopIsNA && (
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="number"
                          className={`${inputCls} w-20 px-2`}
                          placeholder="KM"
                          value={fields.axisSbbDistBusStopKm || ''}
                          onChange={e => handleChange('axisSbbDistBusStopKm', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium">KMS (</span>
                        <input
                          type="text"
                          className={`${inputCls} flex-1 px-2 uppercase`}
                          placeholder={parsedCity}
                          value={fields.axisSbbDistBusStopName || ''}
                          onChange={e => handleChange('axisSbbDistBusStopName', e.target.value.toUpperCase())}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium">BUS STOP)</span>
                      </div>
                    )}
                    <input
                      className={`${inputCls} ${!fields.axisSbbDistBusStopEditOn && !fields.axisSbbDistBusStopIsNA ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : ''}`}
                      value={fields.axisSbbDistBusStopIsNA ? 'NA' : (fields.axisSbbDistBusStopEditOn ? (fields.axisSbbDistBusStop || '') : busStopComputed)}
                      onChange={e => handleChange('axisSbbDistBusStop', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbDistBusStopEditOn || fields.axisSbbDistBusStopIsNA}
                      disabled={isReadOnly || (!fields.axisSbbDistBusStopEditOn && !fields.axisSbbDistBusStopIsNA)}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-sbb-section-6',
      title: 'Boundaries, Accessibility & Site Risk Checks',
      number: 6,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const renderNaToggle = (fieldName: string) => (
          <label className="flex items-center space-x-1.5 text-[10px] uppercase font-bold text-gray-500 cursor-pointer ml-4">
            <input 
              type="checkbox" 
              checked={!!fields[`${fieldName}IsNA`]} 
              onChange={e => handleChange(`${fieldName}IsNA`, e.target.checked)}
              disabled={isReadOnly}
              className="w-3 h-3 text-red-500 rounded focus:ring-red-500 border-gray-300"
            />
            <span>NA</span>
          </label>
        );

        const renderEditSwitch = (fieldName: string, disabled: boolean) => {
          const isEditOn = !!fields[`${fieldName}EditOn`];
          return (
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isEditOn ? 'On' : 'Off'}</span>
              <button
                type="button"
                onClick={() => handleChange(`${fieldName}EditOn`, !isEditOn)}
                disabled={disabled || isReadOnly}
                className={`w-8 h-4 rounded-full relative transition-colors ${isEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isEditOn ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          );
        };

        const renderRadioGroup = (field: string, options: string[]) => (
          <div className={`flex flex-wrap gap-3 ${fields[`${field}IsNA`] ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
            {options.map(opt => (
              <label key={opt} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${(fields[field] === opt && !fields[`${field}IsNA`]) ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                <input
                  type="radio"
                  name={field}
                  value={opt}
                  checked={fields[field] === opt && !fields[`${field}IsNA`]}
                  onChange={e => handleChange(field, e.target.value)}
                  disabled={isReadOnly || !!fields[`${field}IsNA`] || (!fields[`${field}EditOn`] && fields[`${field}EditOn`] !== undefined)}
                  className="text-blue-500 focus:ring-blue-400 border-gray-300"
                />
                <span className="text-xs font-semibold text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        );

        const remarkComputed = (fields.axisSbbRoadWidthMaterial || '20 FEET WIDE ROAD').toUpperCase();
        const fireExtComputed = parseInt(fields.axisSbbRoadWidthMaterial || '0') >= 15 ? 'YES' : 'NO';
        
        const sqft = fields.axisSbbPlotAreaSqft || '0';
        const acres = fields.axisSbbPlotAreaAcres || '0.000';
        const areaComputed = `${sqft} SQFT (AC.${acres}DECS)`.toUpperCase();

        const renderBoundaryRow = (dir: string, deedField: string, actualField: string, editField: string) => (
          <tr className="border-b">
            <td className="p-3 font-bold text-xs text-gray-700 w-1/4 align-top">
              <div className="flex items-center justify-between">
                <span>{dir.toUpperCase()}:</span>
                <div className="flex items-center space-x-2">
                  {renderEditSwitch(editField, false)}
                </div>
              </div>
            </td>
            <td className="p-2 border-l border-r w-3/8 align-top">
              <div className="flex items-center mb-1">
                {renderNaToggle(deedField)}
              </div>
              <textarea
                className={`${inputCls} resize-y ${!fields[`${editField}EditOn`] && !fields[`${deedField}IsNA`] ? 'bg-slate-50 border-slate-300' : ''}`}
                rows={1}
                value={fields[`${deedField}IsNA`] ? 'NA' : (fields[deedField] || '')}
                onChange={e => handleChange(deedField, e.target.value.toUpperCase())}
                readOnly={!fields[`${editField}EditOn`] || !!fields[`${deedField}IsNA`]}
                disabled={isReadOnly || (!fields[`${editField}EditOn`] && !fields[`${deedField}IsNA`])}
                placeholder={`AS PER SALE DEED`}
              />
            </td>
            <td className="p-2 w-3/8 align-top">
              <div className="flex items-center mb-1">
                {renderNaToggle(actualField)}
              </div>
              <textarea
                className={`${inputCls} resize-y ${!fields[`${editField}EditOn`] && !fields[`${actualField}IsNA`] ? 'bg-slate-50 border-slate-300' : ''}`}
                rows={1}
                value={fields[`${actualField}IsNA`] ? 'NA' : (fields[actualField] || '')}
                onChange={e => handleChange(actualField, e.target.value.toUpperCase())}
                readOnly={!fields[`${editField}EditOn`] || !!fields[`${actualField}IsNA`]}
                disabled={isReadOnly || (!fields[`${editField}EditOn`] && !fields[`${actualField}IsNA`])}
                placeholder={`AS PER ACTUAL SITE`}
              />
            </td>
          </tr>
        );

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }}>
              <h3 className="font-bold text-gray-700 mb-4">ACCESSIBILITY/ BOUNDARIES/OTHERS (Physical Access & Site Risk Checks)</h3>
              
              <div className="space-y-5">
                <div className="flex flex-col">
                  <div className="flex items-center mb-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">DOES THE APPROACH ROAD TO THE BUILDING IS SMALL AND <span className="text-red-500">*</span></label>
                    {renderNaToggle('axisSbbApproachRoadSmall')}
                  </div>
                  <div className={`flex space-x-4 ${fields.axisSbbApproachRoadSmallIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                    {['YES', 'NO'].map(opt => (
                      <label key={opt} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="does_approach_road_small"
                          value={opt}
                          checked={fields.axisSbbApproachRoadSmall === opt && !fields.axisSbbApproachRoadSmallIsNA}
                          onChange={e => handleChange('axisSbbApproachRoadSmall', e.target.value)}
                          disabled={isReadOnly || fields.axisSbbApproachRoadSmallIsNA}
                          className="text-rose-500 focus:ring-rose-400"
                        />
                        <span className="text-sm font-semibold">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">REMARK</label>
                      {renderNaToggle('axisSbbApproachRoadRemark')}
                    </div>
                    {renderEditSwitch('axisSbbApproachRoadRemark', !!fields.axisSbbApproachRoadRemarkIsNA)}
                  </div>
                  <input
                    type="text"
                    className={`${inputCls} ${!fields.axisSbbApproachRoadRemarkEditOn && !fields.axisSbbApproachRoadRemarkIsNA ? 'bg-rose-50 text-rose-800 border-rose-300' : ''}`}
                    value={fields.axisSbbApproachRoadRemarkIsNA ? 'NA' : (fields.axisSbbApproachRoadRemarkEditOn ? (fields.axisSbbApproachRoadRemark || '') : remarkComputed)}
                    onChange={e => handleChange('axisSbbApproachRoadRemark', e.target.value.toUpperCase())}
                    readOnly={!fields.axisSbbApproachRoadRemarkEditOn || fields.axisSbbApproachRoadRemarkIsNA}
                    disabled={isReadOnly || (!fields.axisSbbApproachRoadRemarkEditOn && !fields.axisSbbApproachRoadRemarkIsNA)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide truncate">WILL IT BE ABLE TO ACCOMMODATE A FIRE EXTINGUISHER</label>
                        {renderNaToggle('axisSbbFireExtinguisher')}
                      </div>
                      {renderEditSwitch('axisSbbFireExtinguisher', !!fields.axisSbbFireExtinguisherIsNA)}
                    </div>
                    <div className={`flex flex-wrap gap-3 ${fields.axisSbbFireExtinguisherIsNA ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                      {['YES', 'NO'].map(opt => (
                        <label key={opt} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${((fields.axisSbbFireExtinguisherEditOn ? fields.axisSbbFireExtinguisher : fireExtComputed) === opt && !fields.axisSbbFireExtinguisherIsNA) ? 'bg-rose-50 border-rose-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                          <input
                            type="radio"
                            name="accommodate_fire_extinguisher"
                            value={opt}
                            checked={(fields.axisSbbFireExtinguisherEditOn ? fields.axisSbbFireExtinguisher : fireExtComputed) === opt && !fields.axisSbbFireExtinguisherIsNA}
                            onChange={e => handleChange('axisSbbFireExtinguisher', e.target.value)}
                            disabled={isReadOnly || !!fields.axisSbbFireExtinguisherIsNA || !fields.axisSbbFireExtinguisherEditOn}
                            className="text-rose-500 focus:ring-rose-400 border-gray-300"
                          />
                          <span className="text-xs font-semibold text-gray-700">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide truncate">DOES THE PROPERTY FALLS UNDER LAND LOCKED AREA</label>
                        {renderNaToggle('axisSbbLandLockedArea')}
                      </div>
                      {renderEditSwitch('axisSbbLandLockedArea', !!fields.axisSbbLandLockedAreaIsNA)}
                    </div>
                    {renderRadioGroup('axisSbbLandLockedArea', ['YES', 'NO'])}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide truncate">DOES THE PROPERTY FALLS IN A COMMUNITY DOMINATED AREA</label>
                        {renderNaToggle('axisSbbCommunityDominatedArea')}
                      </div>
                      {renderEditSwitch('axisSbbCommunityDominatedArea', !!fields.axisSbbCommunityDominatedAreaIsNA)}
                    </div>
                    {renderRadioGroup('axisSbbCommunityDominatedArea', ['YES', 'NO'])}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide truncate">DOES THE BOUNDARIES AT SITE MATCH AS MENTIONED IN DOCUMENT</label>
                        {renderNaToggle('axisSbbBoundariesMatchDocument')}
                      </div>
                      {renderEditSwitch('axisSbbBoundariesMatchDocument', !!fields.axisSbbBoundariesMatchDocumentIsNA)}
                    </div>
                    {renderRadioGroup('axisSbbBoundariesMatchDocument', ['YES', 'NO'])}
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4 overflow-x-auto" style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}>
              <h3 className="font-bold text-gray-700 mb-4">BOUNDARIES/DIMENSIONS (Comparison Matrix)</h3>
              
              <table className="w-full border-collapse bg-white rounded shadow-sm">
                <thead>
                  <tr className="bg-slate-100 border-b border-t border-l border-r">
                    <th className="p-3 text-left text-xs font-bold text-slate-700 w-1/4">BOUNDARIES/DIMENSIONS</th>
                    <th className="p-3 text-left text-xs font-bold text-slate-700 w-3/8 border-l">(AS PER SALE DEED)</th>
                    <th className="p-3 text-left text-xs font-bold text-slate-700 w-3/8 border-l">(AS PER ACTUAL SITE)</th>
                  </tr>
                </thead>
                <tbody className="border-l border-r border-b">
                  {renderBoundaryRow('NORTH', 'axisSbbNorthAsPerDeed', 'axisSbbNorthAsPerActual', 'axisSbbNorth')}
                  {renderBoundaryRow('SOUTH', 'axisSbbSouthAsPerDeed', 'axisSbbSouthAsPerActual', 'axisSbbSouth')}
                  {renderBoundaryRow('EAST', 'axisSbbEastAsPerDeed', 'axisSbbEastAsPerActual', 'axisSbbEast')}
                  {renderBoundaryRow('WEST', 'axisSbbWestAsPerDeed', 'axisSbbWestAsPerActual', 'axisSbbWest')}
                </tbody>
              </table>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#ECFCCB', borderColor: '#D9F99D' }}>
              <h3 className="font-bold text-gray-700 mb-4">PLOT AREA, LOCALITY, INFRASTRUCTURE & USAGE</h3>
              
              <div className="space-y-5">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">PLOT AREA AS PER DOCUMENTS</label>
                        {renderNaToggle('axisSbbPlotAreaAsPerDocument')}
                      </div>
                      {renderEditSwitch('axisSbbPlotAreaAsPerDocument', !!fields.axisSbbPlotAreaAsPerDocumentIsNA)}
                    </div>
                    <textarea
                      className={`${inputCls} resize-y`}
                      rows={1}
                      value={fields.axisSbbPlotAreaAsPerDocumentIsNA ? 'NA' : (fields.axisSbbPlotAreaAsPerDocument || '')}
                      onChange={e => handleChange('axisSbbPlotAreaAsPerDocument', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbPlotAreaAsPerDocumentEditOn || fields.axisSbbPlotAreaAsPerDocumentIsNA}
                      disabled={isReadOnly || (!fields.axisSbbPlotAreaAsPerDocumentEditOn && !fields.axisSbbPlotAreaAsPerDocumentIsNA)}
                    />
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">PLOT AREA AS PER SALE DEED <span className="text-red-500">*</span></label>
                        {renderNaToggle('axisSbbPlotAreaAsPerSaleDeed')}
                      </div>
                      {renderEditSwitch('axisSbbPlotAreaAsPerSaleDeed', !!fields.axisSbbPlotAreaAsPerSaleDeedIsNA)}
                    </div>
                    {!fields.axisSbbPlotAreaAsPerSaleDeedEditOn && !fields.axisSbbPlotAreaAsPerSaleDeedIsNA && (
                      <div className="flex items-center space-x-2 mb-2">
                        <input
                          type="number"
                          className={`${inputCls} w-24 px-2`}
                          placeholder="SQFT"
                          value={fields.axisSbbPlotAreaSqft || ''}
                          onChange={e => handleChange('axisSbbPlotAreaSqft', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium">SQFT (AC.</span>
                        <input
                          type="number"
                          className={`${inputCls} w-24 px-2`}
                          placeholder="0.000"
                          step="0.001"
                          value={fields.axisSbbPlotAreaAcres || ''}
                          onChange={e => handleChange('axisSbbPlotAreaAcres', e.target.value)}
                          disabled={isReadOnly}
                        />
                        <span className="text-xs text-gray-500 font-medium">DECS)</span>
                      </div>
                    )}
                    <textarea
                      className={`${inputCls} resize-y ${!fields.axisSbbPlotAreaAsPerSaleDeedEditOn && !fields.axisSbbPlotAreaAsPerSaleDeedIsNA ? 'bg-lime-50 text-lime-900 border-lime-300' : ''}`}
                      rows={1}
                      value={fields.axisSbbPlotAreaAsPerSaleDeedIsNA ? 'NA' : (fields.axisSbbPlotAreaAsPerSaleDeedEditOn ? (fields.axisSbbPlotAreaAsPerSaleDeed || '') : areaComputed)}
                      onChange={e => handleChange('axisSbbPlotAreaAsPerSaleDeed', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbPlotAreaAsPerSaleDeedEditOn || fields.axisSbbPlotAreaAsPerSaleDeedIsNA}
                      disabled={isReadOnly || (!fields.axisSbbPlotAreaAsPerSaleDeedEditOn && !fields.axisSbbPlotAreaAsPerSaleDeedIsNA)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">CLASS OF LOCALITY</label>
                        {renderNaToggle('axisSbbClassOfLocality')}
                      </div>
                      {renderEditSwitch('axisSbbClassOfLocality', !!fields.axisSbbClassOfLocalityIsNA)}
                    </div>
                    {renderRadioGroup('axisSbbClassOfLocality', ['POSH', 'HIGHER MIDDLE CLASS', 'MIDDLE CLASS', 'LOWER MIDDLE CLASS', 'POOR'])}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">QUALITY OF INFRASTRUCTURE</label>
                        {renderNaToggle('axisSbbQualityOfInfrastructure')}
                      </div>
                      {renderEditSwitch('axisSbbQualityOfInfrastructure', !!fields.axisSbbQualityOfInfrastructureIsNA)}
                    </div>
                    {renderRadioGroup('axisSbbQualityOfInfrastructure', ['EXCELLENT', 'GOOD', 'AVERAGE', 'POOR'])}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">OWNERSHIP STATUS OF THE PROPERTY</label>
                        {renderNaToggle('axisSbbOwnershipStatus')}
                      </div>
                      {renderEditSwitch('axisSbbOwnershipStatus', !!fields.axisSbbOwnershipStatusIsNA)}
                    </div>
                    {renderRadioGroup('axisSbbOwnershipStatus', ['FREE HOLD', 'LEASE HOLD', 'REG. LEASE', 'GOVT. AUTHORITY, SPECIFY'])}
                    {fields.axisSbbOwnershipStatus === 'GOVT. AUTHORITY, SPECIFY' && !fields.axisSbbOwnershipStatusIsNA && (
                      <input
                        type="text"
                        className={`${inputCls} mt-2`}
                        placeholder="Specify Govt Authority"
                        value={fields.axisSbbOwnershipStatusSpecify || ''}
                        onChange={e => handleChange('axisSbbOwnershipStatusSpecify', e.target.value.toUpperCase())}
                        disabled={isReadOnly || (!fields.axisSbbOwnershipStatusEditOn && fields.axisSbbOwnershipStatusEditOn !== undefined)}
                      />
                    )}
                  </div>

                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">APPROVED USAGE OF PROPERTY</label>
                        {renderNaToggle('axisSbbApprovedUsage')}
                      </div>
                      {renderEditSwitch('axisSbbApprovedUsage', !!fields.axisSbbApprovedUsageIsNA)}
                    </div>
                    {renderRadioGroup('axisSbbApprovedUsage', ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'VACANT LAND', 'MIX/AGRI', 'OTHERS/AGRI'])}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">ACTUAL USAGE OF PROPERTY</label>
                        {renderNaToggle('axisSbbActualUsage')}
                      </div>
                      {renderEditSwitch('axisSbbActualUsage', !!fields.axisSbbActualUsageIsNA)}
                    </div>
                    {renderRadioGroup('axisSbbActualUsage', ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'VACANT LAND', 'MIX/AGRI', 'OTHERS/AGRI'])}
                  </div>
                  
                  <div className="flex flex-col">
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex items-center">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">RESTRICTIVE COVENANTS IN REGARDS TO LAND USE</label>
                        {renderNaToggle('axisSbbRestrictiveCovenants')}
                      </div>
                      {renderEditSwitch('axisSbbRestrictiveCovenants', !!fields.axisSbbRestrictiveCovenantsIsNA)}
                    </div>
                    <input
                      type="text"
                      className={`${inputCls}`}
                      value={fields.axisSbbRestrictiveCovenantsIsNA ? 'NA' : (fields.axisSbbRestrictiveCovenants || '')}
                      onChange={e => handleChange('axisSbbRestrictiveCovenants', e.target.value.toUpperCase())}
                      readOnly={!fields.axisSbbRestrictiveCovenantsEditOn || fields.axisSbbRestrictiveCovenantsIsNA}
                      disabled={isReadOnly || (!fields.axisSbbRestrictiveCovenantsEditOn && !fields.axisSbbRestrictiveCovenantsIsNA)}
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      }
    },
  ],
  getPDFRenderer: (fields: any) => new PDFAxisSBBRenderer(fields),
};

export default function AxisSBB(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_SBB_CONFIG} {...props} />;
}
