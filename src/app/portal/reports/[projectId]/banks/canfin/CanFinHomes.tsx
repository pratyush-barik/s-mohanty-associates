'use client';
import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls, BaseDateInput } from '../BaseBankReportComponents';
import { Lock } from 'lucide-react';

export const CANFIN_HOMES_CONFIG: BankConfig = {
  bankId: 'CANFIN HOMES LTD',
  subTemplateId: '',
  displayName: 'CanFin Homes Ltd',
  hiddenSections: [
    'section-1', 'section-1a', 'section-2', 'section-3', 
    'section-4', 'section-5', 'section-6', 'section-7', 'section-7b', 'section-7c', 
    'section-8', 'section-9', 'section-10', 'section-13', 'section-14', 'section-15'
  ],
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  navSections: [
    { id: 'section-cover', title: '1. Cover Page Details' },
    { id: 'canfin-section-2', title: '2. General' },
    { id: 'canfin-section-3', title: '3. Details of the Property' },
    { id: 'canfin-section-4', title: '4. Surroundings, Accesibility & Proximity to Civil Ameneties' },
    { id: 'canfin-section-5', title: '5. Survey of Construction' },
    { id: 'canfin-section-6', title: '6. Documents Verified' },
    { id: 'canfin-section-7', title: '7. Valuation Report' },
    { id: 'canfin-section-8', title: '8. The Condition of Structure' },
    { id: 'canfin-section-9', title: '9. Concluding Declarations' },
    { id: 'section-documents', title: '10. Documents' },
    { id: 'section-12', title: '11. Maps' },
    { id: 'section-11', title: '12. Photographs' },
  ],
  fieldLabels: {
    'documents-title': '10. Documents',
    'section-documents-title': '10. Documents',
    'section-12-title': '11. Location & Sketch Maps',
    'section-11-title': '12. Property Photographs',
  },
  defaultValues: {
    purpose: 'Housing Loan / Composite Loan',
    
    // Section 9 Variables
    canfinHomesRemarks: '',
    canfinHomesDeclarations: { pt1: false, pt2: false, pt3: false, pt4: false, pt5: false },
    canfinHomesEnableDeclarationDateEdit: false,
    canfinHomesDeclarationDateManual: '',
    canfinHomesSealSignatureFile: null,

    // Section 8 Variables
    canfinHomesStructuralIrregularities: 'No',
    canfinHomesStructuralIrregularitiesDetails: '',
    canfinHomesImprovementDone: 'No',
    canfinHomesImprovementOptions: { pop: false, wallDecoration: false, wallTexture: false, fixedFurniture: false, custom: false },
    canfinHomesImprovementCustomDetails: '',
    canfinHomesNatureOfWaterSupply: '',
    canfinHomesNatureOfWaterSupplyNA: false,
    canfinHomesGovtAssessedValue: '',
    canfinHomesCurrentMarketLandRate: '',
    canfinHomesConstructionMarketRate: '',
    canfinHomesDepreciationPercentage: '',
    
    canfinHomesEnableFairMarketRateEdit: false,
    canfinHomesFairMarketRateManual: '',
    
    canfinHomesEnableTotalFairMarketValueEdit: false,
    canfinHomesTotalFairMarketValueManual: '',
    
    canfinHomesEnableDistressValueEdit: false,
    canfinHomesDistressValueManual: '',
    
    canfinHomesEnableRealizableValueEdit: false,
    canfinHomesRealizableValueManual: '',

    // Section 7 Variables
    canfinHomesEnableDateOfVisitEdit: false,
    canfinHomesDateOfVisit: '',
    canfinHomesTypeOfLocalityDropdown: 'Middle class',
    canfinHomesTypeOfLocality: 'Middle class',
    canfinHomesLandArea: '',
    canfinHomesLandAreaNA: false,
    canfinHomesCarpetArea: '',
    canfinHomesCarpetAreaNA: false,
    canfinHomesAreaAsPer: '',
    canfinHomesAreaAsPerNA: false,
    canfinHomesBUA: '',
    canfinHomesBUANA: false,
    canfinHomesSuperBUA: '',
    canfinHomesSuperBUANA: false,
    canfinHomesEncroachmentOnPublicLand: 'No',

    // Section 6 Variables
    canfinHomesApprovedPlansProvided: false,
    canfinHomesApprovedPlansDetails: '',
    canfinHomesApprovedPlansDetailsNA: false,
    canfinHomesCommencementCertificateProvided: false,
    canfinHomesCommencementCertificateDetails: '',
    canfinHomesCommencementCertificateDetailsNA: false,
    canfinHomesOccupationCertificateProvided: false,
    canfinHomesOccupationCertificateDetails: '',
    canfinHomesOccupationCertificateDetailsNA: false,
    canfinHomesOwnershipDocumentsProvided: false,
    canfinHomesOwnershipDocumentsDetails: '',
    canfinHomesOwnershipDocumentsDetailsNA: false,
    canfinHomesOwnershipDocumentsFiles: [],
    
    // Section 5 Variables
    canfinHomesNatureOfSoil: '',
    canfinHomesNatureOfSoilNA: false,
    canfinHomesTypeOfConstructionDropdown: 'RCC construction',
    canfinHomesTypeOfConstruction: 'RCC construction',
    canfinHomesQualityOfConstructionDropdown: 'Good',
    canfinHomesQualityOfConstruction: 'Good',
    canfinHomesExteriorsDropdown: 'Good',
    canfinHomesExteriors: 'Good',
    canfinHomesInteriorsDropdown: 'Good',
    canfinHomesInteriors: 'Good',
    canfinHomesTypeOfFinishing: '',
    canfinHomesTypeOfFinishingNA: false,
    canfinHomesTypeOfSpecificationUsed: '',
    canfinHomesTypeOfSpecificationUsedNA: false,
    canfinHomesAmenitiesProvided: '',
    canfinHomesAmenitiesProvidedNA: false,
    canfinHomesConstructionProgressUpTo: '',
    canfinHomesConstructionProgressUpToNA: false,
    canfinHomesStageOfConstruction: '',
    canfinHomesEnableProjectedResidualLifeEdit: false,
    canfinHomesProjectedResidualLife: '',

    // Section 4 Variables
    canfinHomesNearestRailwayStation: '',
    canfinHomesNearestBusStand: '',
    canfinHomesNearestHospital: '',
    canfinHomesConditionsOfApproachRoadDropdown: 'Good',
    canfinHomesConditionsOfApproachRoad: 'Good',
    canfinHomesAccessToPropertyDropdown: 'Easy',
    canfinHomesAccessToProperty: 'Easy',
    canfinHomesNearbyLandMark: '',
    canfinHomesNearbyLandMarkNA: false,
    canfinHomesConditionOfTheLocalityDropdown: 'Good',
    canfinHomesConditionOfTheLocality: 'Good',
    canfinHomesDevelopmentOfSurroundingAreasDropdown: 'Developing',
    canfinHomesDevelopmentOfSurroundingAreas: 'Developing',
    canfinHomesAnyBoardIndicatingMortgage: 'No',
    canfinHomesNameOfBankFinanceCo: '',
    canfinHomesPhotoOfBoard: null,
    canfinHomesPlotPropertyDemarcated: 'Yes',
    canfinHomesPropertyIdentifiedThrough: '',
    canfinHomesSurroundingsAsPerSiteNorth: '',
    canfinHomesSurroundingsAsPerSiteSouth: '',
    canfinHomesSurroundingsAsPerSiteEast: '',
    canfinHomesSurroundingsAsPerSiteWest: '',
    canfinHomesSurroundingsAsPerDeedNorth: '',
    canfinHomesSurroundingsAsPerDeedSouth: '',
    canfinHomesSurroundingsAsPerDeedEast: '',
    canfinHomesSurroundingsAsPerDeedWest: '',
    canfinHomesWhetherBoundariesMatching: 'Yes',
    canfinHomesDiscrepancyFoundInBoundaries: '',
    canfinHomesDiscrepancyFoundInBoundariesNA: false,
    
    // Section 3 Variables
    canfinHomesEnablePlotNoEdit: false,
    canfinHomesFlatHousePlotNo: '',
    canfinHomesTypeOfPropertyDropdown: 'Commercial',
    canfinHomesTypeOfProperty: 'Commercial',
    canfinHomesNoOfStories: '',
    canfinHomesTotalNoOfUnits: '',
    canfinHomesTotalNoOfUnitsNA: false,
    canfinHomesNoOfUnitsOnEachFloor: '',
    canfinHomesNoOfUnitsOnEachFloorNA: false,
    canfinHomesDetailsOfUnit: '',
    canfinHomesDetailsOfUnitNA: false,
    canfinHomesAgeOfTheProperty: '',
    canfinHomesEstimatedTotalLifespan: '60',
    canfinHomesEnableResidualAgeEdit: false,
    canfinHomesResidualAgeOfTheProperty: '',
    canfinHomesOccupancyDetails: 'Self occupied',
    canfinHomesVacantOrTenantedDetails: '',
    canfinHomesVacantOrTenantedDetailsNA: false,
    canfinHomesEnableTechnicalAddressEdit: false,
    canfinHomesTechnicalAddress: '',
    canfinHomesSameAsTechnicalAddress: false,
    canfinHomesEnableLegalAddressEdit: false,
    canfinHomesLegalAddress: '',
    canfinHomesEnablePinCodeEdit: false,
    canfinHomesPinCode: '',
    canfinHomesDateOfValuation: '',
    
    // Section 2 Variables
    canfinHomesEnableDocHolderEdit: false,
    canfinHomesPurposeOfLoanDropdown: 'Home Loan',
    canfinHomesPurposeOfLoan: '',
    canfinHomesCustomerName: '',
    canfinHomesDocHolderName: '',
    canfinHomesDateOfTechnicalVisit: '',
    canfinHomesBuildingSocietyName: '',
    canfinHomesBuildingSocietyNameNA: false,
    canfinHomesBuilderSellerName: '',
    canfinHomesBuilderSellerNameNA: false,
    canfinHomesPersonsMet: '',
    
    // Cover Page Variables
    canfinHomesPropertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    canfinHomesAddressOfTheProperty: '',
    canfinHomesPresentMarketValue: '',
    canfinHomesDistressSaleValue: '',
    canfinHomesRealizableValue: '',
    canfinHomesEnableCoverPageValueEdit: false,
    canfinHomesPurposeOfValuationDropdown: 'default',
    canfinHomesPurposeOfValuation: 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY',
    canfinHomesPreparedByCompany: 'M/s. S MOHANTY ASSOCIATES',
    canfinHomesPreparedByDesignation: 'EMPANELLED VALUER & CHARTERED ENGINEER',
    canfinHomesPreparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    canfinHomesPreparedByStreet: 'Shiv Nagar Tankapani Road',
    canfinHomesPreparedByCity: 'Bhubaneswar',
    canfinHomesPreparedByState: 'Odisha',
    canfinHomesPreparedByPinCode: '751018',
    canfinHomesPreparedByPhone: '06742381145',
    canfinHomesPreparedByMobile: '9937023855/9437074855',
  },
  extraSectionsStart: [
    {
      id: 'section-cover',
      title: 'Cover Page Details',
      number: 1,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // Fallbacks if not edited (for now defaults to 0 as in screenshot when empty)
        const presentMarketValue = 0;
        const distressSaleValue = 0;
        const realizableValue = 0;

        return (
        <div className="animate-fade-in space-y-6">
          <div className="border border-blue-200 bg-[#f8fafc] rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">PROPERTY OWNER</h3>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                onClick={() => handleChange('canfinHomesPropertyOwners', [...(fields.canfinHomesPropertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.canfinHomesPropertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.canfinHomesPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('canfinHomesPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRASANNA NAYAK"
                    />
                  </Field>
                  <Field label="RELATIONSHIP" className="w-40">
                    <select
                      className={inputCls}
                      value={owner.relationship || ''}
                      onChange={(e) => {
                        const arr = [...(fields.canfinHomesPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('canfinHomesPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                    >
                      <option value="">Select</option>
                      <option value="S/O">S/O</option>
                      <option value="D/O">D/O</option>
                      <option value="W/O">W/O</option>
                      <option value="C/O">C/O</option>
                    </select>
                  </Field>
                  <Field label="OWNER'S RELATIVE'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.relativeName || owner.fatherName || ''}
                      onChange={(e) => {
                        const arr = [...(fields.canfinHomesPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('canfinHomesPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.canfinHomesPropertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
                      onClick={() => {
                        const arr = [...fields.canfinHomesPropertyOwners];
                        arr.splice(idx, 1);
                        handleChange('canfinHomesPropertyOwners', arr);
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
            <Field label={<span>ADDRESS OF THE PROPERTY <span className="text-red-500">*</span></span>}>
              <textarea className={inputCls} rows={3} value={fields.canfinHomesAddressOfTheProperty || ''} onChange={e => handleChange('canfinHomesAddressOfTheProperty', e.target.value)} disabled={isReadOnly} required />
            </Field>
          </div>
          <div className="border border-red-200 bg-[#fff5f5] rounded-xl p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('canfinHomesEnableCoverPageValueEdit', !fields.canfinHomesEnableCoverPageValueEdit)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableCoverPageValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableCoverPageValueEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${fields.canfinHomesEnableCoverPageValueEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {fields.canfinHomesEnableCoverPageValueEdit ? 'Edit On' : 'Edit Off'}
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">PRESENT MARKET VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1">
                    <input 
                      className={`${inputCls} pr-8 ${!fields.canfinHomesEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.canfinHomesEnableCoverPageValueEdit ? (fields.canfinHomesPresentMarketValue || '') : presentMarketValue.toFixed(2)} 
                      onChange={(e) => handleChange('canfinHomesPresentMarketValue', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableCoverPageValueEdit} 
                    />
                    {!fields.canfinHomesEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Locked'>
                        <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">DISTRESS SALE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1">
                    <input 
                      className={`${inputCls} pr-8 ${!fields.canfinHomesEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.canfinHomesEnableCoverPageValueEdit ? (fields.canfinHomesDistressSaleValue || '') : distressSaleValue.toFixed(2)} 
                      onChange={(e) => handleChange('canfinHomesDistressSaleValue', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableCoverPageValueEdit} 
                    />
                    {!fields.canfinHomesEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Locked'>
                        <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">REALIZABLE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <div className="relative mt-1">
                    <input 
                      className={`${inputCls} pr-8 ${!fields.canfinHomesEnableCoverPageValueEdit ? 'bg-[#A7F3D0] cursor-not-allowed font-bold text-emerald-800' : 'bg-white'}`} 
                      value={fields.canfinHomesEnableCoverPageValueEdit ? (fields.canfinHomesRealizableValue || '') : realizableValue.toFixed(2)} 
                      onChange={(e) => handleChange('canfinHomesRealizableValue', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableCoverPageValueEdit} 
                    />
                    {!fields.canfinHomesEnableCoverPageValueEdit && (
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 group cursor-help" title='Locked'>
                        <Lock className="w-5 h-5 text-emerald-800 group-hover:text-emerald-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.canfinHomesPurposeOfValuationDropdown || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('canfinHomesPurposeOfValuationDropdown', val);
                  if (val === 'default') {
                    handleChange('canfinHomesPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY');
                  } else if (val === 'present_market_value') {
                    handleChange('canfinHomesPurposeOfValuation', 'TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY');
                  } else {
                    handleChange('canfinHomesPurposeOfValuation', '');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="default">TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY</option>
                <option value="present_market_value">TO ASSESS THE PRESENT MARKET VALUE OF THE PROPERTY</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {fields.canfinHomesPurposeOfValuationDropdown === 'other' && (
              <div className="mt-3">
                <textarea className={inputCls} rows={3} placeholder="Enter custom purpose of valuation..." value={fields.canfinHomesPurposeOfValuation || ''} onChange={(e) => handleChange('canfinHomesPurposeOfValuation', e.target.value)} disabled={isReadOnly} />
              </div>
            )}
          </div>
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">PREPARED BY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company/Entity Name"><input className={inputCls} value={fields.canfinHomesPreparedByCompany || ''} onChange={e => handleChange('canfinHomesPreparedByCompany', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Professional Designation"><input className={inputCls} value={fields.canfinHomesPreparedByDesignation || ''} onChange={e => handleChange('canfinHomesPreparedByDesignation', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot Number"><input className={inputCls} value={fields.canfinHomesPreparedByPlotNo || ''} onChange={e => handleChange('canfinHomesPreparedByPlotNo', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Street/Locality"><input className={inputCls} value={fields.canfinHomesPreparedByStreet || ''} onChange={e => handleChange('canfinHomesPreparedByStreet', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="City"><input className={inputCls} value={fields.canfinHomesPreparedByCity || ''} onChange={e => handleChange('canfinHomesPreparedByCity', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="State"><input className={inputCls} value={fields.canfinHomesPreparedByState || ''} onChange={e => handleChange('canfinHomesPreparedByState', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="PIN Code"><input className={inputCls} value={fields.canfinHomesPreparedByPinCode || ''} onChange={e => handleChange('canfinHomesPreparedByPinCode', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone (Landline)">
                <input className={inputCls} value={fields.canfinHomesPreparedByPhone || ''} onChange={e => { handleChange('canfinHomesPreparedByPhone', e.target.value.replace(/[^0-9]/g, '')); }} disabled={isReadOnly} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={fields.canfinHomesPreparedByMobile || ''} onChange={e => { handleChange('canfinHomesPreparedByMobile', e.target.value.replace(/[a-zA-Z]/g, '')); }} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
        );
      }
    },
    {
      id: 'canfin-section-2',
      title: '2. GENERAL',
      number: 2,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const prefilledDocHolder = fields.canfinHomesPropertyOwners?.map((o: any) => o.name).filter(Boolean).join(', ') || '';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-blue-200 bg-[#e3f2fd] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Loan & Customer Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Field label="Purpose Of Loan">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesPurposeOfLoanDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesPurposeOfLoanDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesPurposeOfLoan', e.target.value);
                        } else {
                          handleChange('canfinHomesPurposeOfLoan', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Home Loan">Home Loan</option>
                      <option value="Loan Against Property">Loan Against Property</option>
                      <option value="Working Capital">Working Capital</option>
                      <option value="Priority Banking">Priority Banking</option>
                      <option value="Agri">Agri</option>
                      <option value="CC">CC</option>
                      <option value="BT">BT</option>
                      <option value="TL">TL</option>
                      <option value="LAP DOD">LAP DOD</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesPurposeOfLoanDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom purpose..."
                      value={fields.canfinHomesPurposeOfLoan || ''} 
                      onChange={e => handleChange('canfinHomesPurposeOfLoan', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <Field label="Name of the Customer">
                  <input className={inputCls} value={fields.canfinHomesCustomerName || ''} onChange={e => handleChange('canfinHomesCustomerName', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Name of Document holder as per legal docs</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableDocHolderEdit', !fields.canfinHomesEnableDocHolderEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableDocHolderEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableDocHolderEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <input 
                      className={`${inputCls} pr-10 ${fields.canfinHomesEnableDocHolderEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnableDocHolderEdit ? (fields.canfinHomesDocHolderName || '') : prefilledDocHolder} 
                      onChange={e => handleChange('canfinHomesDocHolderName', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableDocHolderEdit} 
                      title='>>Prefill from section 1, field "PROPERTY OWNER"<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Prefill from section 1, field "PROPERTY OWNER"<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnableDocHolderEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>
                <Field label="Date of Technical Visit">
                  <BaseDateInput
                    value={fields.canfinHomesDateOfTechnicalVisit || ''}
                    onChange={(val) => handleChange('canfinHomesDateOfTechnicalVisit', val)}
                    disabled={isReadOnly}
                  />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Name of The Building/Society</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesBuildingSocietyNameNA} 
                        onChange={e => {
                          handleChange('canfinHomesBuildingSocietyNameNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesBuildingSocietyName', 'NA');
                          else handleChange('canfinHomesBuildingSocietyName', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesBuildingSocietyNameNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesBuildingSocietyNameNA ? 'NA' : (fields.canfinHomesBuildingSocietyName || '')} 
                    onChange={e => handleChange('canfinHomesBuildingSocietyName', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesBuildingSocietyNameNA} 
                  />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Name of the Builder/Seller</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesBuilderSellerNameNA} 
                        onChange={e => {
                          handleChange('canfinHomesBuilderSellerNameNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesBuilderSellerName', 'NA');
                          else handleChange('canfinHomesBuilderSellerName', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesBuilderSellerNameNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesBuilderSellerNameNA ? 'NA' : (fields.canfinHomesBuilderSellerName || '')} 
                    onChange={e => handleChange('canfinHomesBuilderSellerName', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesBuilderSellerNameNA} 
                  />
                </Field>
                <Field label="Person(s) Met [Name & Designation]">
                  <input className={inputCls} value={fields.canfinHomesPersonsMet || ''} onChange={e => handleChange('canfinHomesPersonsMet', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'canfin-section-3',
      title: '3. DETAILS OF THE PROPERTY',
      number: 3,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        const prefilledPlotNo = fields.canfinHomesPreparedByPlotNo || '';
        const estimatedLifespan = Number(fields.canfinHomesEstimatedTotalLifespan || 60);
        const ageOfProperty = Number(fields.canfinHomesAgeOfTheProperty || 0);
        const autoResidualAge = Math.max(0, estimatedLifespan - ageOfProperty).toString();
        const prefilledTechnicalAddress = fields.canfinHomesAddressOfTheProperty || '';
        const prefilledPinCode = fields.canfinHomesPreparedByPinCode || '';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-green-200 bg-[#e8f5e9] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Property Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Flat/House/Plot No.</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnablePlotNoEdit', !fields.canfinHomesEnablePlotNoEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnablePlotNoEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnablePlotNoEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <input 
                      className={`${inputCls} pr-10 ${fields.canfinHomesEnablePlotNoEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnablePlotNoEdit ? (fields.canfinHomesFlatHousePlotNo || '') : prefilledPlotNo} 
                      onChange={e => handleChange('canfinHomesFlatHousePlotNo', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnablePlotNoEdit} 
                      title='>>Prefill from section 1, field "PLOT NUMBER"<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Prefill from section 1, field "PLOT NUMBER"<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnablePlotNoEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>
                <div className="flex flex-col gap-2">
                  <Field label="Type of Property">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesTypeOfPropertyDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesTypeOfPropertyDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesTypeOfProperty', e.target.value);
                        } else {
                          handleChange('canfinHomesTypeOfProperty', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Commercial">Commercial</option>
                      <option value="Godown">Godown</option>
                      <option value="Industrial">Industrial</option>
                      <option value="Specialized property">Specialized property</option>
                      <option value="Vacant Plot">Vacant Plot</option>
                      <option value="Hotel">Hotel</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesTypeOfPropertyDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom property type..."
                      value={fields.canfinHomesTypeOfProperty || ''} 
                      onChange={e => handleChange('canfinHomesTypeOfProperty', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <Field label="No. of Stories">
                  <input type="number" className={inputCls} value={fields.canfinHomesNoOfStories || ''} onChange={e => handleChange('canfinHomesNoOfStories', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>

            <div className="border border-green-200 bg-[#e8f5e9] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Multi-Storey Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>For Multi storey building: Total no of units</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesTotalNoOfUnitsNA} 
                        onChange={e => {
                          handleChange('canfinHomesTotalNoOfUnitsNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesTotalNoOfUnits', 'NA');
                          else handleChange('canfinHomesTotalNoOfUnits', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    type={fields.canfinHomesTotalNoOfUnitsNA ? 'text' : 'number'}
                    className={`${inputCls} ${fields.canfinHomesTotalNoOfUnitsNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesTotalNoOfUnitsNA ? 'NA' : (fields.canfinHomesTotalNoOfUnits || '')} 
                    onChange={e => handleChange('canfinHomesTotalNoOfUnits', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesTotalNoOfUnitsNA} 
                  />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>No of Units on each floor</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesNoOfUnitsOnEachFloorNA} 
                        onChange={e => {
                          handleChange('canfinHomesNoOfUnitsOnEachFloorNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesNoOfUnitsOnEachFloor', 'NA');
                          else handleChange('canfinHomesNoOfUnitsOnEachFloor', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    type={fields.canfinHomesNoOfUnitsOnEachFloorNA ? 'text' : 'number'}
                    className={`${inputCls} ${fields.canfinHomesNoOfUnitsOnEachFloorNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesNoOfUnitsOnEachFloorNA ? 'NA' : (fields.canfinHomesNoOfUnitsOnEachFloor || '')} 
                    onChange={e => handleChange('canfinHomesNoOfUnitsOnEachFloor', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesNoOfUnitsOnEachFloorNA} 
                  />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Details of unit</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesDetailsOfUnitNA} 
                        onChange={e => {
                          handleChange('canfinHomesDetailsOfUnitNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesDetailsOfUnit', 'NA');
                          else handleChange('canfinHomesDetailsOfUnit', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                } className="md:col-span-2">
                  <input 
                    className={`${inputCls} ${fields.canfinHomesDetailsOfUnitNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesDetailsOfUnitNA ? 'NA' : (fields.canfinHomesDetailsOfUnit || '')} 
                    onChange={e => handleChange('canfinHomesDetailsOfUnit', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesDetailsOfUnitNA} 
                  />
                </Field>
              </div>
            </div>

            <div className="border border-green-200 bg-[#e8f5e9] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Age & Occupancy Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Age Of The property">
                  <input type="number" className={inputCls} value={fields.canfinHomesAgeOfTheProperty || ''} onChange={e => handleChange('canfinHomesAgeOfTheProperty', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Residual age of the Property</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableResidualAgeEdit', !fields.canfinHomesEnableResidualAgeEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableResidualAgeEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableResidualAgeEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <input 
                      className={`${inputCls} pr-10 ${fields.canfinHomesEnableResidualAgeEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnableResidualAgeEdit ? (fields.canfinHomesResidualAgeOfTheProperty || '') : autoResidualAge} 
                      onChange={e => handleChange('canfinHomesResidualAgeOfTheProperty', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableResidualAgeEdit} 
                      title='>>Auto calculates values from [Estimated Total Lifespan - Age Of The property]<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Auto calculates values from [Estimated Total Lifespan - Age Of The property]<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnableResidualAgeEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>
                <Field label="Occupancy details" className="md:col-span-2">
                  <div className="flex flex-wrap gap-4 mt-2">
                    {['Self occupied', 'Vacant', 'Tenanted'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="canfinHomesOccupancyDetails"
                          value={opt}
                          checked={fields.canfinHomesOccupancyDetails === opt}
                          onChange={(e) => handleChange('canfinHomesOccupancyDetails', e.target.value)}
                          disabled={isReadOnly}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                {(fields.canfinHomesOccupancyDetails === 'Vacant' || fields.canfinHomesOccupancyDetails === 'Tenanted') && (
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>IF Vacant then from how long/ If tenanted then Name/List of Tenants</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={fields.canfinHomesVacantOrTenantedDetailsNA} 
                          onChange={e => {
                            handleChange('canfinHomesVacantOrTenantedDetailsNA', e.target.checked);
                            if (e.target.checked) handleChange('canfinHomesVacantOrTenantedDetails', 'NA');
                            else handleChange('canfinHomesVacantOrTenantedDetails', '');
                          }} 
                          className="rounded text-emerald-600 focus:ring-emerald-500" 
                          disabled={isReadOnly} 
                        />
                        <span className="text-xs font-medium text-gray-500">NA</span>
                      </label>
                    </div>
                  } className="md:col-span-2">
                    <input 
                      className={`${inputCls} ${fields.canfinHomesVacantOrTenantedDetailsNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                      value={fields.canfinHomesVacantOrTenantedDetailsNA ? 'NA' : (fields.canfinHomesVacantOrTenantedDetails || '')} 
                      onChange={e => handleChange('canfinHomesVacantOrTenantedDetails', e.target.value)} 
                      disabled={isReadOnly || fields.canfinHomesVacantOrTenantedDetailsNA} 
                    />
                  </Field>
                )}
              </div>
            </div>

            <div className="border border-green-200 bg-[#e8f5e9] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Address Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Technical Address of property (Survey No./Plot no/House no/Flat No.) Location/District/State</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableTechnicalAddressEdit', !fields.canfinHomesEnableTechnicalAddressEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableTechnicalAddressEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableTechnicalAddressEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <textarea 
                      className={`${inputCls} pr-10 ${fields.canfinHomesEnableTechnicalAddressEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      rows={3}
                      value={fields.canfinHomesEnableTechnicalAddressEdit ? (fields.canfinHomesTechnicalAddress || '') : prefilledTechnicalAddress} 
                      onChange={e => handleChange('canfinHomesTechnicalAddress', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableTechnicalAddressEdit} 
                      title='>>Prefill from section 1, field "ADDRESS OF THE PROPERTY"<<'
                    />
                    <div
                      className="absolute top-2 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Prefill from section 1, field "ADDRESS OF THE PROPERTY"<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnableTechnicalAddressEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>
                <div className="flex flex-col gap-2">
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Legal Address of property (Survey No./Plot no/House no/Flat No.) Location/District/State Pls mention as per deed</span>
                      {fields.canfinHomesSameAsTechnicalAddress && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-500">Edit</span>
                          <button
                            type="button"
                            onClick={() => handleChange('canfinHomesEnableLegalAddressEdit', !fields.canfinHomesEnableLegalAddressEdit)}
                            disabled={isReadOnly}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableLegalAddressEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableLegalAddressEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                        </div>
                      )}
                    </div>
                  }>
                    <div className="relative">
                      <textarea 
                        className={`${inputCls} pr-10 ${fields.canfinHomesSameAsTechnicalAddress && !fields.canfinHomesEnableLegalAddressEdit ? 'bg-white text-gray-700' : (fields.canfinHomesSameAsTechnicalAddress && fields.canfinHomesEnableLegalAddressEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : '')}`} 
                        rows={3}
                        value={fields.canfinHomesSameAsTechnicalAddress ? (fields.canfinHomesEnableLegalAddressEdit ? (fields.canfinHomesLegalAddress || '') : (fields.canfinHomesEnableTechnicalAddressEdit ? (fields.canfinHomesTechnicalAddress || '') : prefilledTechnicalAddress)) : (fields.canfinHomesLegalAddress || '')} 
                        onChange={e => handleChange('canfinHomesLegalAddress', e.target.value)} 
                        disabled={isReadOnly || (fields.canfinHomesSameAsTechnicalAddress && !fields.canfinHomesEnableLegalAddressEdit)} 
                        title={fields.canfinHomesSameAsTechnicalAddress ? '>>Prefill from section 3, field "Technical Address of property"<<' : ''}
                      />
                      {fields.canfinHomesSameAsTechnicalAddress && (
                        <div
                          className="absolute top-2 right-0 flex items-center pr-3 group text-gray-400 pointer-events-none"
                          title='>>Prefill from section 3, field "Technical Address of property"<<'
                        >
                          <Lock className={`w-4 h-4 ${fields.canfinHomesEnableLegalAddressEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                        </div>
                      )}
                    </div>
                  </Field>
                  <label className="flex items-center gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={fields.canfinHomesSameAsTechnicalAddress}
                      onChange={(e) => handleChange('canfinHomesSameAsTechnicalAddress', e.target.checked)}
                      disabled={isReadOnly}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">Same as Technical Address</span>
                  </label>
                </div>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Pin Code</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnablePinCodeEdit', !fields.canfinHomesEnablePinCodeEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnablePinCodeEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnablePinCodeEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <input 
                      type="number"
                      className={`${inputCls} pr-10 ${fields.canfinHomesEnablePinCodeEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnablePinCodeEdit ? (fields.canfinHomesPinCode || '') : prefilledPinCode} 
                      onChange={e => handleChange('canfinHomesPinCode', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnablePinCodeEdit} 
                      title='>>Prefill from section 1, field "PIN CODE"<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Prefill from section 1, field "PIN CODE"<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnablePinCodeEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>
                <Field label="Date of Valuation">
                  <BaseDateInput
                    value={fields.canfinHomesDateOfValuation || ''}
                    onChange={(val) => handleChange('canfinHomesDateOfValuation', val)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'canfin-section-4',
      title: '4. SURROUNDINGS, ACCESIBILITY & PROXIMITY TO CIVIL AMENETIES',
      number: 4,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-yellow-200 bg-[#fffde7] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Proximity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Nearest Railway Station">
                  <input className={inputCls} value={fields.canfinHomesNearestRailwayStation || ''} onChange={e => handleChange('canfinHomesNearestRailwayStation', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Nearest Bus Stand">
                  <input className={inputCls} value={fields.canfinHomesNearestBusStand || ''} onChange={e => handleChange('canfinHomesNearestBusStand', e.target.value)} disabled={isReadOnly} />
                </Field>
                <Field label="Nearest Hospital">
                  <input className={inputCls} value={fields.canfinHomesNearestHospital || ''} onChange={e => handleChange('canfinHomesNearestHospital', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>

            <div className="border border-yellow-200 bg-[#fffde7] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Approach & Locality</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Field label="Conditions of Approach Road">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesConditionsOfApproachRoadDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesConditionsOfApproachRoadDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesConditionsOfApproachRoad', e.target.value);
                        } else {
                          handleChange('canfinHomesConditionsOfApproachRoad', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Kachi sadak">Kachi sadak</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesConditionsOfApproachRoadDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom road condition..."
                      value={fields.canfinHomesConditionsOfApproachRoad || ''} 
                      onChange={e => handleChange('canfinHomesConditionsOfApproachRoad', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Field label="Access to property">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesAccessToPropertyDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesAccessToPropertyDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesAccessToProperty', e.target.value);
                        } else {
                          handleChange('canfinHomesAccessToProperty', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Restricted">Restricted</option>
                      <option value="Difficult">Difficult</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesAccessToPropertyDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom access..."
                      value={fields.canfinHomesAccessToProperty || ''} 
                      onChange={e => handleChange('canfinHomesAccessToProperty', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Nearby Land Mark</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesNearbyLandMarkNA} 
                        onChange={e => {
                          handleChange('canfinHomesNearbyLandMarkNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesNearbyLandMark', 'NA');
                          else handleChange('canfinHomesNearbyLandMark', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesNearbyLandMarkNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesNearbyLandMarkNA ? 'NA' : (fields.canfinHomesNearbyLandMark || '')} 
                    onChange={e => handleChange('canfinHomesNearbyLandMark', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesNearbyLandMarkNA} 
                  />
                </Field>
                <div className="flex flex-col gap-2">
                  <Field label="Condition of The Locality">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesConditionOfTheLocalityDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesConditionOfTheLocalityDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesConditionOfTheLocality', e.target.value);
                        } else {
                          handleChange('canfinHomesConditionOfTheLocality', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Bad">Bad</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesConditionOfTheLocalityDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom locality condition..."
                      value={fields.canfinHomesConditionOfTheLocality || ''} 
                      onChange={e => handleChange('canfinHomesConditionOfTheLocality', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Field label="Development of surrounding areas">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesDevelopmentOfSurroundingAreasDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesDevelopmentOfSurroundingAreasDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesDevelopmentOfSurroundingAreas', e.target.value);
                        } else {
                          handleChange('canfinHomesDevelopmentOfSurroundingAreas', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Under-developed">Under-developed</option>
                      <option value="Developing">Developing</option>
                      <option value="Developed">Developed</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesDevelopmentOfSurroundingAreasDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom development status..."
                      value={fields.canfinHomesDevelopmentOfSurroundingAreas || ''} 
                      onChange={e => handleChange('canfinHomesDevelopmentOfSurroundingAreas', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="border border-yellow-200 bg-[#fffde7] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Site Identification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Any board of other bank or finance co. indicating mortgage found on site" className="md:col-span-2">
                  <div className="flex flex-wrap gap-4 mt-2">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="canfinHomesAnyBoardIndicatingMortgage"
                          value={opt}
                          checked={fields.canfinHomesAnyBoardIndicatingMortgage === opt}
                          onChange={(e) => handleChange('canfinHomesAnyBoardIndicatingMortgage', e.target.value)}
                          disabled={isReadOnly}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                {fields.canfinHomesAnyBoardIndicatingMortgage === 'Yes' && (
                  <>
                    <Field label="Name of Bank/Finance Co.">
                      <input className={inputCls} value={fields.canfinHomesNameOfBankFinanceCo || ''} onChange={e => handleChange('canfinHomesNameOfBankFinanceCo', e.target.value)} disabled={isReadOnly} />
                    </Field>
                    <Field label="Photo of Board">
                      <div className="border border-dashed border-gray-300 rounded p-4 text-center bg-white">
                        <input type="file" onChange={e => {
                           if (e.target.files && e.target.files.length > 0) {
                             handleChange('canfinHomesPhotoOfBoard', e.target.files[0]);
                           }
                        }} disabled={isReadOnly} className="text-sm" />
                      </div>
                    </Field>
                  </>
                )}
                <Field label="Plot/Property Demarcated at Site Mandatory" className="md:col-span-2">
                  <div className="flex flex-wrap gap-4 mt-2">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="canfinHomesPlotPropertyDemarcated"
                          value={opt}
                          checked={fields.canfinHomesPlotPropertyDemarcated === opt}
                          onChange={(e) => handleChange('canfinHomesPlotPropertyDemarcated', e.target.value)}
                          disabled={isReadOnly}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                <Field label="Property Identified through">
                  <input className={inputCls} value={fields.canfinHomesPropertyIdentifiedThrough || ''} onChange={e => handleChange('canfinHomesPropertyIdentifiedThrough', e.target.value)} disabled={isReadOnly} />
                </Field>
              </div>
            </div>

            <div className="border border-yellow-200 bg-[#fffde7] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Boundary Verification</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-600 text-sm">Surroundings as per site visit</h4>
                  <Field label="North"><input className={inputCls} value={fields.canfinHomesSurroundingsAsPerSiteNorth || ''} onChange={e => handleChange('canfinHomesSurroundingsAsPerSiteNorth', e.target.value)} disabled={isReadOnly} /></Field>
                  <Field label="South"><input className={inputCls} value={fields.canfinHomesSurroundingsAsPerSiteSouth || ''} onChange={e => handleChange('canfinHomesSurroundingsAsPerSiteSouth', e.target.value)} disabled={isReadOnly} /></Field>
                  <Field label="East"><input className={inputCls} value={fields.canfinHomesSurroundingsAsPerSiteEast || ''} onChange={e => handleChange('canfinHomesSurroundingsAsPerSiteEast', e.target.value)} disabled={isReadOnly} /></Field>
                  <Field label="West"><input className={inputCls} value={fields.canfinHomesSurroundingsAsPerSiteWest || ''} onChange={e => handleChange('canfinHomesSurroundingsAsPerSiteWest', e.target.value)} disabled={isReadOnly} /></Field>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-600 text-sm">Surroundings as per Sale deed</h4>
                  <Field label="North"><input className={inputCls} value={fields.canfinHomesSurroundingsAsPerDeedNorth || ''} onChange={e => handleChange('canfinHomesSurroundingsAsPerDeedNorth', e.target.value)} disabled={isReadOnly} /></Field>
                  <Field label="South"><input className={inputCls} value={fields.canfinHomesSurroundingsAsPerDeedSouth || ''} onChange={e => handleChange('canfinHomesSurroundingsAsPerDeedSouth', e.target.value)} disabled={isReadOnly} /></Field>
                  <Field label="East"><input className={inputCls} value={fields.canfinHomesSurroundingsAsPerDeedEast || ''} onChange={e => handleChange('canfinHomesSurroundingsAsPerDeedEast', e.target.value)} disabled={isReadOnly} /></Field>
                  <Field label="West"><input className={inputCls} value={fields.canfinHomesSurroundingsAsPerDeedWest || ''} onChange={e => handleChange('canfinHomesSurroundingsAsPerDeedWest', e.target.value)} disabled={isReadOnly} /></Field>
                </div>
                <Field label="Whether Boundaries matching (actual site verification with Legal docs)" className="md:col-span-2">
                  <div className="flex flex-wrap gap-4 mt-2">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="canfinHomesWhetherBoundariesMatching"
                          value={opt}
                          checked={fields.canfinHomesWhetherBoundariesMatching === opt}
                          onChange={(e) => handleChange('canfinHomesWhetherBoundariesMatching', e.target.value)}
                          disabled={isReadOnly}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>
                {fields.canfinHomesWhetherBoundariesMatching === 'No' && (
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Discrepancy found in Boundaries, If any plz specify</span>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={fields.canfinHomesDiscrepancyFoundInBoundariesNA} 
                          onChange={e => {
                            handleChange('canfinHomesDiscrepancyFoundInBoundariesNA', e.target.checked);
                            if (e.target.checked) handleChange('canfinHomesDiscrepancyFoundInBoundaries', 'NA');
                            else handleChange('canfinHomesDiscrepancyFoundInBoundaries', '');
                          }} 
                          className="rounded text-emerald-600 focus:ring-emerald-500" 
                          disabled={isReadOnly} 
                        />
                        <span className="text-xs font-medium text-gray-500">NA</span>
                      </label>
                    </div>
                  } className="md:col-span-2">
                    <textarea 
                      className={`${inputCls} ${fields.canfinHomesDiscrepancyFoundInBoundariesNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                      rows={3}
                      value={fields.canfinHomesDiscrepancyFoundInBoundariesNA ? 'NA' : (fields.canfinHomesDiscrepancyFoundInBoundaries || '')} 
                      onChange={e => handleChange('canfinHomesDiscrepancyFoundInBoundaries', e.target.value)} 
                      disabled={isReadOnly || fields.canfinHomesDiscrepancyFoundInBoundariesNA} 
                    />
                  </Field>
                )}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'canfin-section-5',
      title: '5. SURVEY OF CONSTRUCTION',
      number: 5,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // Compute prefilled fields
        const autoResidualAge = fields.canfinHomesResidualAgeOfTheProperty || '';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-purple-200 bg-[#f3e5f5] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Materials & Finishing</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Nature of Soil</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesNatureOfSoilNA} 
                        onChange={e => {
                          handleChange('canfinHomesNatureOfSoilNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesNatureOfSoil', 'NA');
                          else handleChange('canfinHomesNatureOfSoil', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesNatureOfSoilNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesNatureOfSoilNA ? 'NA' : (fields.canfinHomesNatureOfSoil || '')} 
                    onChange={e => handleChange('canfinHomesNatureOfSoil', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesNatureOfSoilNA} 
                  />
                </Field>
                <div className="flex flex-col gap-2">
                  <Field label="Type of Construction">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesTypeOfConstructionDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesTypeOfConstructionDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesTypeOfConstruction', e.target.value);
                        } else {
                          handleChange('canfinHomesTypeOfConstruction', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="RCC construction">RCC construction</option>
                      <option value="GCI Sheet">GCI Sheet</option>
                      <option value="Load bearing structure">Load bearing structure</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesTypeOfConstructionDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom type..."
                      value={fields.canfinHomesTypeOfConstruction || ''} 
                      onChange={e => handleChange('canfinHomesTypeOfConstruction', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Field label="Quality of The Construction">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesQualityOfConstructionDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesQualityOfConstructionDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesQualityOfConstruction', e.target.value);
                        } else {
                          handleChange('canfinHomesQualityOfConstruction', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesQualityOfConstructionDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom quality..."
                      value={fields.canfinHomesQualityOfConstruction || ''} 
                      onChange={e => handleChange('canfinHomesQualityOfConstruction', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Field label="Exteriors">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesExteriorsDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesExteriorsDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesExteriors', e.target.value);
                        } else {
                          handleChange('canfinHomesExteriors', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesExteriorsDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom exteriors..."
                      value={fields.canfinHomesExteriors || ''} 
                      onChange={e => handleChange('canfinHomesExteriors', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Field label="Interiors">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesInteriorsDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesInteriorsDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesInteriors', e.target.value);
                        } else {
                          handleChange('canfinHomesInteriors', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesInteriorsDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom interiors..."
                      value={fields.canfinHomesInteriors || ''} 
                      onChange={e => handleChange('canfinHomesInteriors', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Type of finishing (Paint)</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesTypeOfFinishingNA} 
                        onChange={e => {
                          handleChange('canfinHomesTypeOfFinishingNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesTypeOfFinishing', 'NA');
                          else handleChange('canfinHomesTypeOfFinishing', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesTypeOfFinishingNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesTypeOfFinishingNA ? 'NA' : (fields.canfinHomesTypeOfFinishing || '')} 
                    onChange={e => handleChange('canfinHomesTypeOfFinishing', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesTypeOfFinishingNA} 
                  />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Type of specification used</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesTypeOfSpecificationUsedNA} 
                        onChange={e => {
                          handleChange('canfinHomesTypeOfSpecificationUsedNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesTypeOfSpecificationUsed', 'NA');
                          else handleChange('canfinHomesTypeOfSpecificationUsed', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                } className="md:col-span-2">
                  <textarea 
                    className={`${inputCls} ${fields.canfinHomesTypeOfSpecificationUsedNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    rows={3}
                    value={fields.canfinHomesTypeOfSpecificationUsedNA ? 'NA' : (fields.canfinHomesTypeOfSpecificationUsed || '')} 
                    onChange={e => handleChange('canfinHomesTypeOfSpecificationUsed', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesTypeOfSpecificationUsedNA} 
                  />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Amenities provided in building/society</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesAmenitiesProvidedNA} 
                        onChange={e => {
                          handleChange('canfinHomesAmenitiesProvidedNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesAmenitiesProvided', 'NA');
                          else handleChange('canfinHomesAmenitiesProvided', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                } className="md:col-span-2">
                  <input 
                    className={`${inputCls} ${fields.canfinHomesAmenitiesProvidedNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesAmenitiesProvidedNA ? 'NA' : (fields.canfinHomesAmenitiesProvided || '')} 
                    onChange={e => handleChange('canfinHomesAmenitiesProvided', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesAmenitiesProvidedNA} 
                  />
                </Field>
              </div>
            </div>

            <div className="border border-purple-200 bg-[#f3e5f5] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Lifecycle & Progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Construction progress up to</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesConstructionProgressUpToNA} 
                        onChange={e => {
                          handleChange('canfinHomesConstructionProgressUpToNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesConstructionProgressUpTo', 'NA');
                          else handleChange('canfinHomesConstructionProgressUpTo', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesConstructionProgressUpToNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesConstructionProgressUpToNA ? 'NA' : (fields.canfinHomesConstructionProgressUpTo || '')} 
                    onChange={e => handleChange('canfinHomesConstructionProgressUpTo', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesConstructionProgressUpToNA} 
                  />
                </Field>
                <Field label="Stage of construction in %">
                  <input 
                    type="number"
                    className={inputCls} 
                    value={fields.canfinHomesStageOfConstruction || ''} 
                    onChange={e => handleChange('canfinHomesStageOfConstruction', e.target.value)} 
                    disabled={isReadOnly} 
                  />
                </Field>
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>The Projected Residual Life of The Structure (in Years)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableProjectedResidualLifeEdit', !fields.canfinHomesEnableProjectedResidualLifeEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableProjectedResidualLifeEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableProjectedResidualLifeEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <input 
                      type="number"
                      className={`${inputCls} pr-10 ${fields.canfinHomesEnableProjectedResidualLifeEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnableProjectedResidualLifeEdit ? (fields.canfinHomesProjectedResidualLife || '') : autoResidualAge} 
                      onChange={e => handleChange('canfinHomesProjectedResidualLife', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableProjectedResidualLifeEdit} 
                      title='>>Prefill from section 3, field "Residual age of the Property"<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Prefill from section 3, field "Residual age of the Property"<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnableProjectedResidualLifeEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'canfin-section-6',
      title: '6. DOCUMENTS VERIFIED',
      number: 6,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-cyan-200 bg-[#e0f7fa] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Legal & Municipal Approvals</h3>
              <div className="space-y-6">
                
                {/* a) Approved plans Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesApprovedPlansProvided} 
                        onChange={e => handleChange('canfinHomesApprovedPlansProvided', e.target.checked)} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="font-semibold text-gray-700">a) Approved plans Details (Provided / Not Provided)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesApprovedPlansDetailsNA} 
                        onChange={e => {
                          handleChange('canfinHomesApprovedPlansDetailsNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesApprovedPlansDetails', 'NA');
                          else handleChange('canfinHomesApprovedPlansDetails', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesApprovedPlansDetailsNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    placeholder="Enter details..."
                    value={fields.canfinHomesApprovedPlansDetailsNA ? 'NA' : (fields.canfinHomesApprovedPlansDetails || '')} 
                    onChange={e => handleChange('canfinHomesApprovedPlansDetails', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesApprovedPlansDetailsNA} 
                  />
                </div>

                {/* b) Commencement Certificate / Building Permit Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesCommencementCertificateProvided} 
                        onChange={e => handleChange('canfinHomesCommencementCertificateProvided', e.target.checked)} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="font-semibold text-gray-700">b) Commencement Certificate / Building Permit Details (Provided / Not Provided)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesCommencementCertificateDetailsNA} 
                        onChange={e => {
                          handleChange('canfinHomesCommencementCertificateDetailsNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesCommencementCertificateDetails', 'NA');
                          else handleChange('canfinHomesCommencementCertificateDetails', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesCommencementCertificateDetailsNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    placeholder="Enter details..."
                    value={fields.canfinHomesCommencementCertificateDetailsNA ? 'NA' : (fields.canfinHomesCommencementCertificateDetails || '')} 
                    onChange={e => handleChange('canfinHomesCommencementCertificateDetails', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesCommencementCertificateDetailsNA} 
                  />
                </div>

                {/* c) Occupation/Completion certificate details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesOccupationCertificateProvided} 
                        onChange={e => handleChange('canfinHomesOccupationCertificateProvided', e.target.checked)} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="font-semibold text-gray-700">c) Occupation/Completion certificate details (Provided / Not Provided)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesOccupationCertificateDetailsNA} 
                        onChange={e => {
                          handleChange('canfinHomesOccupationCertificateDetailsNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesOccupationCertificateDetails', 'NA');
                          else handleChange('canfinHomesOccupationCertificateDetails', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesOccupationCertificateDetailsNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    placeholder="Enter details..."
                    value={fields.canfinHomesOccupationCertificateDetailsNA ? 'NA' : (fields.canfinHomesOccupationCertificateDetails || '')} 
                    onChange={e => handleChange('canfinHomesOccupationCertificateDetails', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesOccupationCertificateDetailsNA} 
                  />
                </div>

                {/* d) Ownership Documents */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesOwnershipDocumentsProvided} 
                        onChange={e => handleChange('canfinHomesOwnershipDocumentsProvided', e.target.checked)} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="font-semibold text-gray-700">d) Ownership Documents (Provided / Not Provided)</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesOwnershipDocumentsDetailsNA} 
                        onChange={e => {
                          handleChange('canfinHomesOwnershipDocumentsDetailsNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesOwnershipDocumentsDetails', 'NA');
                          else handleChange('canfinHomesOwnershipDocumentsDetails', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesOwnershipDocumentsDetailsNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    placeholder="Enter details (e.g., Sale deed, ROR, Amin Sketch map)..."
                    value={fields.canfinHomesOwnershipDocumentsDetailsNA ? 'NA' : (fields.canfinHomesOwnershipDocumentsDetails || '')} 
                    onChange={e => handleChange('canfinHomesOwnershipDocumentsDetails', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesOwnershipDocumentsDetailsNA} 
                  />
                  <div className="mt-2 border border-dashed border-gray-300 bg-white rounded p-4 text-center">
                    <span className="block text-sm text-gray-500 mb-2">Upload document copies</span>
                    <input 
                      type="file" 
                      multiple 
                      onChange={e => {
                        if (e.target.files) {
                          const fileArray = Array.from(e.target.files);
                          handleChange('canfinHomesOwnershipDocumentsFiles', fileArray);
                        }
                      }} 
                      disabled={isReadOnly}
                      className="text-sm text-gray-600"
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
      id: 'canfin-section-7',
      title: '7. VALUATION REPORT',
      number: 7,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // Computed values
        const prefilledDateOfVisit = fields.canfinHomesDateOfTechnicalVisit || '';

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border border-orange-200 bg-[#fff3e0] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Area Measurements</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Date Of Visit</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableDateOfVisitEdit', !fields.canfinHomesEnableDateOfVisitEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableDateOfVisitEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableDateOfVisitEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    {fields.canfinHomesEnableDateOfVisitEdit ? (
                      <BaseDateInput
                        value={fields.canfinHomesDateOfVisit || ''}
                        onChange={(val) => handleChange('canfinHomesDateOfVisit', val)}
                        disabled={isReadOnly}
                      />
                    ) : (
                      <input 
                        className={`${inputCls} pr-10 bg-white text-gray-700`} 
                        value={prefilledDateOfVisit} 
                        readOnly 
                        disabled={isReadOnly}
                        title='>>Prefill from section 2, field "Date of Technical Visit"<<'
                      />
                    )}
                    {!fields.canfinHomesEnableDateOfVisitEdit && (
                      <div
                        className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                        title='>>Prefill from section 2, field "Date of Technical Visit"<<'
                      >
                        <Lock className={`w-4 h-4 text-gray-400`} />
                      </div>
                    )}
                  </div>
                </Field>

                <div className="flex flex-col gap-2">
                  <Field label="Type of Locality">
                    <select 
                      className={inputCls} 
                      value={fields.canfinHomesTypeOfLocalityDropdown || ''} 
                      onChange={e => {
                        handleChange('canfinHomesTypeOfLocalityDropdown', e.target.value);
                        if (e.target.value !== 'Custom') {
                          handleChange('canfinHomesTypeOfLocality', e.target.value);
                        } else {
                          handleChange('canfinHomesTypeOfLocality', '');
                        }
                      }} 
                      disabled={isReadOnly}
                    >
                      <option value="Lower middle class">Lower middle class</option>
                      <option value="Middle class">Middle class</option>
                      <option value="Upper Middle class">Upper Middle class</option>
                      <option value="Posh">Posh</option>
                      <option value="Custom">Custom</option>
                    </select>
                  </Field>
                  {fields.canfinHomesTypeOfLocalityDropdown === 'Custom' && (
                    <input 
                      className={inputCls} 
                      placeholder="Enter custom locality..."
                      value={fields.canfinHomesTypeOfLocality || ''} 
                      onChange={e => handleChange('canfinHomesTypeOfLocality', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Land Area (if applicable)(sqyd/sqmt)</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesLandAreaNA} 
                        onChange={e => {
                          handleChange('canfinHomesLandAreaNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesLandArea', 'NA');
                          else handleChange('canfinHomesLandArea', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    type={fields.canfinHomesLandAreaNA ? "text" : "number"}
                    className={`${inputCls} ${fields.canfinHomesLandAreaNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesLandAreaNA ? 'NA' : (fields.canfinHomesLandArea || '')} 
                    onChange={e => handleChange('canfinHomesLandArea', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesLandAreaNA} 
                  />
                </Field>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Carpet Area as per physical measurement (Approx.)</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesCarpetAreaNA} 
                        onChange={e => {
                          handleChange('canfinHomesCarpetAreaNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesCarpetArea', 'NA');
                          else handleChange('canfinHomesCarpetArea', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    type={fields.canfinHomesCarpetAreaNA ? "text" : "number"}
                    className={`${inputCls} ${fields.canfinHomesCarpetAreaNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesCarpetAreaNA ? 'NA' : (fields.canfinHomesCarpetArea || '')} 
                    onChange={e => handleChange('canfinHomesCarpetArea', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesCarpetAreaNA} 
                  />
                </Field>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>area as per</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesAreaAsPerNA} 
                        onChange={e => {
                          handleChange('canfinHomesAreaAsPerNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesAreaAsPer', 'NA');
                          else handleChange('canfinHomesAreaAsPer', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesAreaAsPerNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesAreaAsPerNA ? 'NA' : (fields.canfinHomesAreaAsPer || '')} 
                    onChange={e => handleChange('canfinHomesAreaAsPer', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesAreaAsPerNA} 
                  />
                </Field>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Super BUA (sq. ft.)</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesSuperBUANA} 
                        onChange={e => {
                          handleChange('canfinHomesSuperBUANA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesSuperBUA', 'NA');
                          else handleChange('canfinHomesSuperBUA', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    type={fields.canfinHomesSuperBUANA ? "text" : "number"}
                    className={`${inputCls} ${fields.canfinHomesSuperBUANA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesSuperBUANA ? 'NA' : (fields.canfinHomesSuperBUA || '')} 
                    onChange={e => handleChange('canfinHomesSuperBUA', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesSuperBUANA} 
                  />
                </Field>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>BUA (sq. ft.) (For Row house BUA on each floor to be mentioned)</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesBUANA} 
                        onChange={e => {
                          handleChange('canfinHomesBUANA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesBUA', 'NA');
                          else handleChange('canfinHomesBUA', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                } className="md:col-span-2">
                  <textarea 
                    className={`${inputCls} ${fields.canfinHomesBUANA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    rows={3}
                    value={fields.canfinHomesBUANA ? 'NA' : (fields.canfinHomesBUA || '')} 
                    onChange={e => handleChange('canfinHomesBUA', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesBUANA} 
                  />
                </Field>

                <Field label="Encroachment on public land" className="md:col-span-2">
                  <div className="flex flex-wrap gap-4 mt-2">
                    {['Yes', 'No'].map(opt => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="canfinHomesEncroachmentOnPublicLand"
                          value={opt}
                          checked={fields.canfinHomesEncroachmentOnPublicLand === opt}
                          onChange={(e) => handleChange('canfinHomesEncroachmentOnPublicLand', e.target.value)}
                          disabled={isReadOnly}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                        />
                        <span className="text-gray-700 text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </Field>

              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'canfin-section-8',
      title: '8. THE CONDITION OF STRUCTURE',
      number: 8,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // Calculations
        const currentLandRate = parseFloat(fields.canfinHomesCurrentMarketLandRate || '0') || 0;
        const constructionMarketRate = parseFloat(fields.canfinHomesConstructionMarketRate || '0') || 0;
        
        const autoFairMarketRate = (currentLandRate + constructionMarketRate).toFixed(2);
        
        const fairMarketRateValue = parseFloat(fields.canfinHomesEnableFairMarketRateEdit ? (fields.canfinHomesFairMarketRateManual || '0') : autoFairMarketRate) || 0;
        const autoTotalFairMarketValue = fairMarketRateValue.toFixed(2);

        const totalFairMarketValue = parseFloat(fields.canfinHomesEnableTotalFairMarketValueEdit ? (fields.canfinHomesTotalFairMarketValueManual || '0') : autoTotalFairMarketValue) || 0;

        const autoDistressValue = (totalFairMarketValue * 0.8).toFixed(2);
        const autoRealizableValue = (totalFairMarketValue * 0.9).toFixed(2);

        return (
          <div className="animate-fade-in space-y-6">
            
            {/* Structural Condition & Rates */}
            <div className="border border-pink-200 bg-[#fce4ec] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Structural Condition & Rates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Major Structural Irregularities/Cracks */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Field label="Major Structural Irregularities/Cracks">
                    <div className="flex flex-wrap gap-4 mt-2">
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="canfinHomesStructuralIrregularities"
                            value={opt}
                            checked={fields.canfinHomesStructuralIrregularities === opt}
                            onChange={(e) => handleChange('canfinHomesStructuralIrregularities', e.target.value)}
                            disabled={isReadOnly}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <span className="text-gray-700 text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                  {fields.canfinHomesStructuralIrregularities === 'Yes' && (
                    <input 
                      className={inputCls} 
                      placeholder="Specify details of irregularities/cracks..."
                      value={fields.canfinHomesStructuralIrregularitiesDetails || ''} 
                      onChange={e => handleChange('canfinHomesStructuralIrregularitiesDetails', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  )}
                </div>

                {/* Improvement/Interior Decoration Done */}
                <div className="flex flex-col gap-2 md:col-span-2">
                  <Field label="Improvement/Interior Decoration Done">
                    <div className="flex flex-wrap gap-4 mt-2">
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="canfinHomesImprovementDone"
                            value={opt}
                            checked={fields.canfinHomesImprovementDone === opt}
                            onChange={(e) => handleChange('canfinHomesImprovementDone', e.target.value)}
                            disabled={isReadOnly}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                          />
                          <span className="text-gray-700 text-sm">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                  {fields.canfinHomesImprovementDone === 'Yes' && (
                    <div className="mt-2 space-y-2 p-3 bg-white/50 border border-pink-100 rounded">
                      <div className="flex flex-wrap gap-4">
                        {[
                          { key: 'pop', label: 'POP' },
                          { key: 'wallDecoration', label: 'wall decoration' },
                          { key: 'wallTexture', label: 'wall texture' },
                          { key: 'fixedFurniture', label: 'fixed furniture' },
                          { key: 'custom', label: 'Custom' }
                        ].map((opt) => (
                          <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={fields.canfinHomesImprovementOptions?.[opt.key] || false}
                              onChange={(e) => {
                                const currentOpts = fields.canfinHomesImprovementOptions || { pop: false, wallDecoration: false, wallTexture: false, fixedFurniture: false, custom: false };
                                handleChange('canfinHomesImprovementOptions', {
                                  ...currentOpts,
                                  [opt.key]: e.target.checked
                                });
                              }}
                              disabled={isReadOnly}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-700">{opt.label}</span>
                          </label>
                        ))}
                      </div>
                      {fields.canfinHomesImprovementOptions?.custom && (
                        <input 
                          className={inputCls} 
                          placeholder="Enter custom improvement details..."
                          value={fields.canfinHomesImprovementCustomDetails || ''} 
                          onChange={e => handleChange('canfinHomesImprovementCustomDetails', e.target.value)} 
                          disabled={isReadOnly} 
                        />
                      )}
                    </div>
                  )}
                </div>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Nature of water Supply</span>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={fields.canfinHomesNatureOfWaterSupplyNA} 
                        onChange={e => {
                          handleChange('canfinHomesNatureOfWaterSupplyNA', e.target.checked);
                          if (e.target.checked) handleChange('canfinHomesNatureOfWaterSupply', 'NA');
                          else handleChange('canfinHomesNatureOfWaterSupply', '');
                        }} 
                        className="rounded text-emerald-600 focus:ring-emerald-500" 
                        disabled={isReadOnly} 
                      />
                      <span className="text-xs font-medium text-gray-500">NA</span>
                    </label>
                  </div>
                }>
                  <input 
                    className={`${inputCls} ${fields.canfinHomesNatureOfWaterSupplyNA ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                    value={fields.canfinHomesNatureOfWaterSupplyNA ? 'NA' : (fields.canfinHomesNatureOfWaterSupply || '')} 
                    onChange={e => handleChange('canfinHomesNatureOfWaterSupply', e.target.value)} 
                    disabled={isReadOnly || fields.canfinHomesNatureOfWaterSupplyNA} 
                  />
                </Field>

                <Field label="Govt. Assessed Value">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input 
                      type="number"
                      className={`${inputCls} pl-8`} 
                      value={fields.canfinHomesGovtAssessedValue || ''} 
                      onChange={e => handleChange('canfinHomesGovtAssessedValue', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  </div>
                </Field>

                <Field label="Current market land rate / per sqmt / sq. ft.">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input 
                      type="number"
                      className={`${inputCls} pl-8`} 
                      value={fields.canfinHomesCurrentMarketLandRate || ''} 
                      onChange={e => handleChange('canfinHomesCurrentMarketLandRate', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  </div>
                </Field>

                <Field label="Construction Market Rate / SqFt. Measured (G+1)">
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input 
                      type="number"
                      className={`${inputCls} pl-8`} 
                      value={fields.canfinHomesConstructionMarketRate || ''} 
                      onChange={e => handleChange('canfinHomesConstructionMarketRate', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                  </div>
                </Field>

                <Field label="Depreciation % age (1. 5% per year) (For 20-years)">
                  <div className="relative">
                    <input 
                      type="number"
                      className={`${inputCls} pr-8`} 
                      value={fields.canfinHomesDepreciationPercentage || ''} 
                      onChange={e => handleChange('canfinHomesDepreciationPercentage', e.target.value)} 
                      disabled={isReadOnly} 
                    />
                    <span className="absolute right-3 top-2 text-gray-500">%</span>
                  </div>
                </Field>

              </div>
            </div>

            {/* Final Valuation Outputs */}
            <div className="border border-pink-200 bg-[#fce4ec] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Final Valuation Outputs</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Recommended/Fair Market Rate (i+ii)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableFairMarketRateEdit', !fields.canfinHomesEnableFairMarketRateEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableFairMarketRateEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableFairMarketRateEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input 
                      type="number"
                      className={`${inputCls} pl-8 pr-10 ${fields.canfinHomesEnableFairMarketRateEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnableFairMarketRateEdit ? (fields.canfinHomesFairMarketRateManual || '') : autoFairMarketRate} 
                      onChange={e => handleChange('canfinHomesFairMarketRateManual', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableFairMarketRateEdit} 
                      title='>>Auto calculates values from [Current market land rate + Construction Market Rate]<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Auto calculates values from [Current market land rate + Construction Market Rate]<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnableFairMarketRateEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Total Fair Market Value on 100% complete</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableTotalFairMarketValueEdit', !fields.canfinHomesEnableTotalFairMarketValueEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableTotalFairMarketValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableTotalFairMarketValueEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input 
                      type="number"
                      className={`${inputCls} pl-8 pr-10 ${fields.canfinHomesEnableTotalFairMarketValueEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnableTotalFairMarketValueEdit ? (fields.canfinHomesTotalFairMarketValueManual || '') : autoTotalFairMarketValue} 
                      onChange={e => handleChange('canfinHomesTotalFairMarketValueManual', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableTotalFairMarketValueEdit} 
                      title='>>Prefill from section 8, field "Recommended/Fair Market Rate"<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Prefill from section 8, field "Recommended/Fair Market Rate"<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnableTotalFairMarketValueEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Distress Value (80%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableDistressValueEdit', !fields.canfinHomesEnableDistressValueEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableDistressValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableDistressValueEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input 
                      type="number"
                      className={`${inputCls} pl-8 pr-10 ${fields.canfinHomesEnableDistressValueEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnableDistressValueEdit ? (fields.canfinHomesDistressValueManual || '') : autoDistressValue} 
                      onChange={e => handleChange('canfinHomesDistressValueManual', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableDistressValueEdit} 
                      title='>>Auto calculates values from [Total Fair Market Value * 0.8]<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Auto calculates values from [Total Fair Market Value * 0.8]<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnableDistressValueEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>

                <Field label={
                  <div className="flex items-center justify-between">
                    <span>Realizable Value (90%)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-500">Edit</span>
                      <button
                        type="button"
                        onClick={() => handleChange('canfinHomesEnableRealizableValueEdit', !fields.canfinHomesEnableRealizableValueEdit)}
                        disabled={isReadOnly}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableRealizableValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableRealizableValueEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  </div>
                }>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">₹</span>
                    <input 
                      type="number"
                      className={`${inputCls} pl-8 pr-10 ${fields.canfinHomesEnableRealizableValueEdit ? 'bg-[#A7F3D0] border-emerald-500 font-bold text-emerald-800' : 'bg-white text-gray-700'}`} 
                      value={fields.canfinHomesEnableRealizableValueEdit ? (fields.canfinHomesRealizableValueManual || '') : autoRealizableValue} 
                      onChange={e => handleChange('canfinHomesRealizableValueManual', e.target.value)} 
                      disabled={isReadOnly || !fields.canfinHomesEnableRealizableValueEdit} 
                      title='>>Auto calculates values from [Total Fair Market Value * 0.9]<<'
                    />
                    <div
                      className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                      title='>>Auto calculates values from [Total Fair Market Value * 0.9]<<'
                    >
                      <Lock className={`w-4 h-4 ${fields.canfinHomesEnableRealizableValueEdit ? 'text-emerald-700' : 'text-gray-400'}`} />
                    </div>
                  </div>
                </Field>

              </div>
            </div>
            
          </div>
        );
      }
    },
    {
      id: 'canfin-section-9',
      title: '9. CONCLUDING DECLARATIONS',
      number: 9,
      defaultOpen: true,
      render: (fields: any, handleChange: any, isReadOnly: boolean) => {
        // System date for prefill
        const systemDate = new Date().toISOString().split('T')[0];
        
        return (
          <div className="animate-fade-in space-y-6">
            
            {/* Remarks & Declarations */}
            <div className="border border-green-200 bg-[#f1f8e9] rounded-md p-4 mb-4">
              <h3 className="font-bold text-gray-700 mb-4">Remarks & Declarations</h3>
              
              <div className="space-y-6">
                
                {/* Remarks / Note */}
                <Field label="Remarks / Note">
                  <textarea 
                    className={inputCls} 
                    rows={4}
                    placeholder="Enter final remarks or notes here..."
                    value={fields.canfinHomesRemarks || ''} 
                    onChange={e => handleChange('canfinHomesRemarks', e.target.value)} 
                    disabled={isReadOnly} 
                  />
                </Field>

                {/* DECLARATION (Points I to V) */}
                <div className="space-y-3 bg-white/60 p-4 rounded border border-green-100 text-sm text-gray-700">
                  <p className="font-semibold text-gray-800">DECLARATION</p>
                  
                  {[
                    { key: 'pt1', text: 'I. I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief.' },
                    { key: 'pt2', text: 'II. I have no direct or indirect interest in the property valued.' },
                    { key: 'pt3', text: 'III. I have personally inspected the property on the date mentioned above.' },
                    { key: 'pt4', text: 'IV. I have not been convicted of any offence and no criminal proceedings are pending against me.' },
                    { key: 'pt5', text: 'V. The valuation report has been prepared by me strictly in accordance with the guidelines issued by the Bank.' },
                  ].map((decl) => (
                    <label key={decl.key} className="flex items-start gap-3 cursor-pointer group">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={fields.canfinHomesDeclarations?.[decl.key] || false}
                          onChange={(e) => {
                            const currentDecls = fields.canfinHomesDeclarations || { pt1: false, pt2: false, pt3: false, pt4: false, pt5: false };
                            handleChange('canfinHomesDeclarations', {
                              ...currentDecls,
                              [decl.key]: e.target.checked
                            });
                          }}
                          disabled={isReadOnly}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300 shadow-sm"
                        />
                      </div>
                      <span className="flex-1 group-hover:text-gray-900 transition-colors">{decl.text}</span>
                    </label>
                  ))}
                  <p className="text-xs text-red-500 italic mt-2">* All declarations must be accepted for final submission.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  
                  {/* Date */}
                  <Field label={
                    <div className="flex items-center justify-between">
                      <span>Date</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">Edit</span>
                        <button
                          type="button"
                          onClick={() => handleChange('canfinHomesEnableDeclarationDateEdit', !fields.canfinHomesEnableDeclarationDateEdit)}
                          disabled={isReadOnly}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.canfinHomesEnableDeclarationDateEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.canfinHomesEnableDeclarationDateEdit ? 'translate-x-5' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  }>
                    <div className="relative">
                      {fields.canfinHomesEnableDeclarationDateEdit ? (
                        <BaseDateInput
                          value={fields.canfinHomesDeclarationDateManual || ''}
                          onChange={(val) => handleChange('canfinHomesDeclarationDateManual', val)}
                          disabled={isReadOnly}
                        />
                      ) : (
                        <input 
                          className={`${inputCls} pr-10 bg-white text-gray-700`} 
                          value={systemDate} 
                          readOnly 
                          disabled={isReadOnly}
                          title='>>Prefill from system current date<<'
                        />
                      )}
                      {!fields.canfinHomesEnableDeclarationDateEdit && (
                        <div
                          className="absolute inset-y-0 right-0 flex items-center pr-3 group text-gray-500 hover:text-gray-700 pointer-events-none"
                          title='>>Prefill from system current date<<'
                        >
                          <Lock className={`w-4 h-4 text-gray-400`} />
                        </div>
                      )}
                    </div>
                  </Field>

                  {/* Seal Signature of the Panel Valuer */}
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Seal Signature of the Panel Valuer
                    </label>
                    <div className="border-2 border-dashed border-green-300 bg-white rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-green-50 transition-colors">
                      <span className="block text-sm text-gray-500 mb-3">Upload signature / seal image</span>
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            handleChange('canfinHomesSealSignatureFile', Array.from(e.target.files));
                          }
                        }} 
                        disabled={isReadOnly}
                        className="text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer w-full"
                      />
                    </div>
                  </div>

                </div>

              </div>
            </div>
            
          </div>
        );
      }
    }
  ],
  getPDFRenderer: (data, projectCode) => {
    const { PDFCanFinHomesRenderer } = require('@/lib/banks/pdf-canfin-homes-renderer');
    return new PDFCanFinHomesRenderer(data, projectCode);
  },
};

export default function CanFinHomes(props: BankReportBuilderProps) {
  return <BankReportBuilder config={CANFIN_HOMES_CONFIG} {...props} />;
}
