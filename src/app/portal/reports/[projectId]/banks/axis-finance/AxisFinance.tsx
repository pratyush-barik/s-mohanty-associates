'use client';
import React from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { PDFAxisFinanceRenderer } from '@/lib/banks/pdf-axis-finance-renderer';
import { Field, inputCls } from '../BaseBankReportComponents';

export const AXIS_FINANCE_CONFIG: BankConfig = {
  bankId: 'AXIS FINANCE LTD',
  subTemplateId: '',
  displayName: 'Axis Finance Ltd',
  navSections: [
    { id: 'section-cover', title: 'Cover Page' },
    { id: 'axis-section-2', title: 'Client Info' },
    { id: 'axis-section-3', title: 'Location' },
    { id: 'axis-section-4', title: 'Boundaries' },
    { id: 'axis-section-5', title: 'Approvals' },
    { id: 'axis-section-6', title: 'Measurements' },
    { id: 'axis-section-7', title: 'Valuation' },
    { id: 'axis-section-8', title: 'Cost Estimate' },
    { id: 'axis-section-9', title: 'Govt & Distress' },
    { id: 'axis-section-10', title: 'Remarks & Cert' },
    { id: 'section-11', title: 'Photos' },
    { id: 'section-12', title: 'Maps' },
  ],
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-7a', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10', 'annexures'],
  extraSections: [],
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  fieldLabels: {
    'section-11-title': 'Property Photographs',
    'section-12-title': 'Location & Sketch Maps',
  },
  defaultValues: {
    axisPropertyOwners: [{ name: '', relationship: 'S/O', relativeName: '' }],
    axisAddressOfTheProperty: '',
    axisPresentMarketValue: '',
    axisDistressSaleValue: '',
    axisEnableCoverPageValueEdit: false,
    axisPurposeOfValuationDropdown: 'default',
    axisPurposeOfValuation: 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY',
    axisPreparedByCompany: 'M/s. S MOHANTY ASSOCIATES',
    axisPreparedByDesignation: 'EMPANELLED VALUER & CHARTERED ENGINEER',
    axisPreparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    axisPreparedByStreet: 'Shiv Nagar Tankapani Road',
    axisPreparedByCity: 'Bhubaneswar',
    axisPreparedByState: 'Odisha',
    axisPreparedByPinCode: '751018',
    axisPreparedByPhone: '06742381145',
    axisPreparedByMobile: '9937023855/9437074855',
    axisLayoutPlanApprovalAuthority: '',
    axisLayoutPlanApprovalNo: '',
    axisLayoutPlanApprovalDate: '',
    axisBuildingPlanApprovalAuthority: '',
    axisBuildingPlanApprovalNo: '',
    axisBuildingPlanApprovalDate: '',
    axisAgeOfBuilding: '',
    axisEstimatedLifeOfBuilding: '',
    axisConstructionYear: '',
    axisConstructionType: '',
    axisCommentsOnFeasibility: '',
    axisDepreciationPercentage: '',
    axisNoOfFloorsPlan: '',
    axisNoOfFloorsSite: '',

    axisMeasuredCarpetArea: '',
    axisApprovedCarpetArea: '',
    axisUDSLand: '',
    axisAgreementCarpetArea: '',
    axisLoadingAdoptedForValuation: '',
    axisSaleableAreaOfUnit: '',
    axisBuiltUpArea: '',
    axisPrevailingRateForBuilding: '',
    axisFloorRiseRate: '',
    axisAdoptedRateBuilding: '',
    axisMarketValueOfTheUnit: '',
    axisCarParkingDropdown: '',
    axisNoOfCarParking: '',
    axisParkingArea: '',
    axisCarParkingPrice: '',
    
    axisPlotArea: '',
    axisFloorWiseBreakUp: '',
    axisAsPerApproval: '',
    axisAsPerMaxPermissibleFARNorms: '',
    axisDeviationSqFt: '',
    axisDeviationPercentage: '',

    axisSideMarginApprovalFront: '',
    axisSideMarginApprovalLeft: '',
    axisSideMarginApprovalRight: '',
    axisSideMarginApprovalRear: '',
    axisSideMarginApprovalRemarks: '',

    axisSideMarginActualFront: '',
    axisSideMarginActualLeft: '',
    axisSideMarginActualRight: '',
    axisSideMarginActualRear: '',
    axisSideMarginActualRemarks: '',
    
    axisSideMarginDeviationFront: '',
    axisSideMarginDeviationLeft: '',
    axisSideMarginDeviationRight: '',
    axisSideMarginDeviationRear: '',
    axisSideMarginDeviationRemarks: '',

    axisQualityOfConstruction: '',
    axisMaintenanceOfTheProperty: '',

    axisAreaOfLand: '',
    axisMarketRateOfLand: '',
    axisValueOfTheLand: '',

    axisCostBreakupApprovedBUAGF: '', axisCostBreakupApprovedBUAFF: '', axisCostBreakupApprovedBUASF: '', axisCostBreakupApprovedBUATF: '', axisCostBreakupApprovedBUANA: '', axisCostBreakupApprovedBUATotal: '',
    axisCostBreakupActualBUAGF: '', axisCostBreakupActualBUAFF: '', axisCostBreakupActualBUASF: '', axisCostBreakupActualBUATF: '', axisCostBreakupActualBUANA: '', axisCostBreakupActualBUATotal: '',
    axisCostBreakupConstructionCostGF: '', axisCostBreakupConstructionCostFF: '', axisCostBreakupConstructionCostSF: '', axisCostBreakupConstructionCostTF: '', axisCostBreakupConstructionCostNA: '', axisCostBreakupConstructionCostTotal: '',
    axisCostBreakupTotalBUAValueGF: '', axisCostBreakupTotalBUAValueFF: '', axisCostBreakupTotalBUAValueSF: '', axisCostBreakupTotalBUAValueTF: '', axisCostBreakupTotalBUAValueNA: '', axisCostBreakupTotalBUAValueTotal: '',

    axisValueOfApprovedBUA: '',
    axisMarketValueOfTheUnitLandAndConstruction: '',

    axisEstimatedCostOfConstruction: '',
    axisStandardCostOfConstruction: '',
    axisEstimatedRatePerSqft: '',
    axisStandardRatePerSqft: '',
    axisMaterialAndFinishingDetails: '',
    axisStageOfConstruction: '',
    axisRecommendedForDisbursement: '',
    axisRecommendedConstructionRate: '',
    axisRecommendedCostOfConstruction: '',
    axisTotalValueOfPropertyAfterCompletion: '',

    axisAreaOfLandGovt: '',
    axisGovernmentRate: '',
    axisValueOfTheLandGovt: '',
    axisGovtValueOfTheUnit: '',
    axisDistressValueOfTheProperty: '',

    axisRedFlagComments: '',
    axisTechnicalStatus: '',
    axisCustomTechnicalStatus: '',
    axisUndertakingClause1: true,
    axisUndertakingClause2: true,
    axisUndertakingClause3: true,
    axisNameOfPersonVisitedSite: '',
    axisNameOfValuationAgency: '',
    axisSealOfTheAgency: null,
    axisDateOfInspection: '',
    axisAttachments: [
      { text: 'Photos of the Property from inside/outside.' },
      { text: 'Location sketch for the property' }
    ],
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
                onClick={() => handleChange('axisPropertyOwners', [...(fields.axisPropertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.axisPropertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.axisPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('axisPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRASANNA NAYAK"
                    />
                  </Field>
                  <Field label="Relationship" className="w-40">
                    <input
                      list={`relations-${idx}`}
                      className={inputCls}
                      value={owner.relationship || ''}
                      onChange={(e) => {
                        const arr = [...(fields.axisPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('axisPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. S/O"
                    />
                    <datalist id={`relations-${idx}`}>
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
                        const arr = [...(fields.axisPropertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('axisPropertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.axisPropertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
                      onClick={() => {
                        const arr = [...fields.axisPropertyOwners];
                        arr.splice(idx, 1);
                        handleChange('axisPropertyOwners', arr);
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
              <textarea className={inputCls} rows={3} value={fields.axisAddressOfTheProperty || ''} onChange={e => handleChange('axisAddressOfTheProperty', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <div className="border border-red-200 bg-[#fff5f5] rounded-xl p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('axisEnableCoverPageValueEdit', !fields.axisEnableCoverPageValueEdit)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.axisEnableCoverPageValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.axisEnableCoverPageValueEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${fields.axisEnableCoverPageValueEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {fields.axisEnableCoverPageValueEdit ? 'Edit On' : 'Edit Off'}
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">PRESENT MARKET VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input className={`${inputCls} ${!fields.axisEnableCoverPageValueEdit ? 'bg-gray-50' : ''}`} value={fields.axisPresentMarketValue || ''} onChange={(e) => handleChange('axisPresentMarketValue', e.target.value)} disabled={isReadOnly || !fields.axisEnableCoverPageValueEdit} />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Current Value of Property (Plot + Construction) field from Section 6.</span>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">DISTRESS SALE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input className={`${inputCls} ${!fields.axisEnableCoverPageValueEdit ? 'bg-gray-50' : ''}`} value={fields.axisDistressSaleValue || ''} onChange={(e) => handleChange('axisDistressSaleValue', e.target.value)} disabled={isReadOnly || !fields.axisEnableCoverPageValueEdit} />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Distressed Valuation of the Property field from Section 6</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.axisPurposeOfValuationDropdown || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('axisPurposeOfValuationDropdown', val);
                  if (val === 'default') {
                    handleChange('axisPurposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY');
                  } else {
                    handleChange('axisPurposeOfValuation', '');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="default">TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {fields.axisPurposeOfValuationDropdown === 'other' && (
              <div className="mt-3">
                <textarea className={inputCls} rows={3} placeholder="Enter custom purpose of valuation..." value={fields.axisPurposeOfValuation || ''} onChange={(e) => handleChange('axisPurposeOfValuation', e.target.value)} disabled={isReadOnly} />
              </div>
            )}
          </div>
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">PREPARED BY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company/Entity Name"><input className={inputCls} value={fields.axisPreparedByCompany || ''} onChange={e => handleChange('axisPreparedByCompany', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Professional Designation"><input className={inputCls} value={fields.axisPreparedByDesignation || ''} onChange={e => handleChange('axisPreparedByDesignation', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot Number"><input className={inputCls} value={fields.axisPreparedByPlotNo || ''} onChange={e => handleChange('axisPreparedByPlotNo', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Street/Locality"><input className={inputCls} value={fields.axisPreparedByStreet || ''} onChange={e => handleChange('axisPreparedByStreet', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="City"><input className={inputCls} value={fields.axisPreparedByCity || ''} onChange={e => handleChange('axisPreparedByCity', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="State"><input className={inputCls} value={fields.axisPreparedByState || ''} onChange={e => handleChange('axisPreparedByState', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="PIN Code"><input className={inputCls} value={fields.axisPreparedByPinCode || ''} onChange={e => handleChange('axisPreparedByPinCode', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone (Landline)">
                <input className={inputCls} value={fields.axisPreparedByPhone || ''} onChange={e => { handleChange('axisPreparedByPhone', e.target.value.replace(/[^0-9]/g, '')); }} disabled={isReadOnly} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={fields.axisPreparedByMobile || ''} onChange={e => { handleChange('axisPreparedByMobile', e.target.value.replace(/[a-zA-Z]/g, '')); }} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'axis-section-2',
      title: 'Client & Application Details',
      number: 2,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const isOwnerEditOn = fields.enablePropertyOwnerEdit || false;
        const computedOwnersText = (fields.axisPropertyOwners || [])
          .filter((o: any) => o.name)
          .map((o: any) => `${o.name}, ${o.relationship || 'S/O'}- ${o.relativeName || o.fatherName || ''}`)
          .join('\n');
        const propertyOwnerValue = isOwnerEditOn ? (fields.propertyOwnerNames ?? computedOwnersText) : computedOwnersText;
        
        return (
        <div className="animate-fade-in space-y-6">
          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F0F7FF', borderColor: '#BAE6FD' }}>
            <h3 className="font-bold text-gray-700 mb-4">CUSTOMER & LOAN INFORMATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Product / Loan Category (LOAN AGAINST PROPERTY (LAP))"><input className={inputCls} value={fields.productLoanCategory || ''} onChange={e => handleChange('productLoanCategory', e.target.value)} disabled={isReadOnly} placeholder="e.g., LAP – RESIDENTIAL BUILDING" /></Field>
              <Field label="Application Number"><input className={inputCls} value={fields.loanApplicationNo || ''} onChange={e => handleChange('loanApplicationNo', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Date"><input type="date" className={inputCls} value={fields.dateOfValuation || ''} onChange={e => handleChange('dateOfValuation', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Name of the Customer"><input className={inputCls} value={fields.ownerName || ''} onChange={e => handleChange('ownerName', e.target.value)} disabled={isReadOnly} /></Field>
              
              <div className="col-span-1 w-full flex flex-col">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Name of the Property Owner(S)</label>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] uppercase font-bold text-gray-400">Edit {isOwnerEditOn ? 'On' : 'Off'}</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (!isOwnerEditOn && !fields.propertyOwnerNames) {
                           handleChange('propertyOwnerNames', computedOwnersText);
                        }
                        handleChange('enablePropertyOwnerEdit', !isOwnerEditOn);
                      }}
                      disabled={isReadOnly}
                      className={`w-8 h-4 rounded-full relative transition-colors ${isOwnerEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isOwnerEditOn ? 'translate-x-4' : ''}`} />
                    </button>
                  </div>
                </div>
                <textarea
                  className={inputCls}
                  rows={isOwnerEditOn ? 3 : Math.max(1, (fields.axisPropertyOwners || []).length)}
                  value={propertyOwnerValue}
                  onChange={e => handleChange('propertyOwnerNames', e.target.value)}
                  readOnly={!isOwnerEditOn}
                  disabled={isReadOnly || !isOwnerEditOn}
                />
              </div>

              <Field label="Collateral Ownership"><input className={inputCls} value={fields.collateralOwnership || ''} onChange={e => handleChange('collateralOwnership', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Collateral Category"><input className={inputCls} value={fields.collateralCategory || ''} onChange={e => handleChange('collateralCategory', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Property Documents Received" span={2}>
                <textarea className={inputCls} rows={3} value={fields.propertyDocumentsReceived || ''} onChange={e => handleChange('propertyDocumentsReceived', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </div>
      );
      }
    },
    {
      id: 'axis-section-3',
      title: 'Property Location & Locality Details',
      number: 3,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        let computedCity = '';
        let computedDistrict = '';
        let computedState = '';
        let computedPinCode = '';
        
        const address = [fields.propertyDetailsAxis, fields.propertyAddressAxis, fields.axisAddressOfTheProperty].filter(Boolean).join(' ');
        if (address) {
          const pinMatch = address.match(/\b(\d{6})\b/);
          if (pinMatch) computedPinCode = pinMatch[1];
          
          const distMatch = address.match(/(?:Dist|District)[\s-]*([A-Za-z]+)/i);
          if (distMatch && distMatch[1]) {
            computedDistrict = distMatch[1];
            computedCity = computedDistrict;
          }
          
          const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'];
          for (const s of states) {
            if (address.toLowerCase().includes(s.toLowerCase())) {
              computedState = s;
              break;
            }
          }
          
          if (!computedDistrict) {
            const parts = address.split(',').map((p: string) => p.trim());
            const stateIdx = parts.findIndex((p: string) => computedState && p.toLowerCase().includes(computedState.toLowerCase()));
            if (stateIdx > 0) {
              computedCity = parts[stateIdx - 1];
            } else if (parts.length >= 3) {
              computedCity = parts[parts.length - 3];
            }
          }
        }

        const renderDropdownWithCustom = (label: string, fieldKey: string, options: string[]) => {
          const isCustomKey = `${fieldKey}_isCustom`;
          const isCustom = fields[isCustomKey] || false;
          return (
            <Field label={label}>
              <select
                className={inputCls}
                value={isCustom ? 'Custom' : (fields[fieldKey] || '')}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'Custom') {
                    handleChange(isCustomKey, true);
                    handleChange(fieldKey, '');
                  } else {
                    handleChange(isCustomKey, false);
                    handleChange(fieldKey, val);
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="">Select...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {isCustom && (
                <input className={`${inputCls} mt-2`} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly} placeholder="Enter custom value..." />
              )}
            </Field>
          );
        };

        const renderToggleLabel = (labelText: string, editFieldKey: string, valueFieldKey: string) => {
          const isEditOn = fields[editFieldKey] || false;
          return (
            <div className="flex justify-between items-center w-full">
              <span>{labelText}</span>
              <div className="flex items-center space-x-2">
                <span className="text-[9px] font-bold text-gray-400 normal-case">Edit {isEditOn ? 'On' : 'Off'}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (isEditOn) {
                      handleChange(valueFieldKey, undefined);
                    }
                    handleChange(editFieldKey, !isEditOn);
                  }}
                  disabled={isReadOnly}
                  className={`w-8 h-4 rounded-full relative transition-colors ${isEditOn ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isEditOn ? 'translate-x-4' : ''}`} />
                </button>
              </div>
            </div>
          );
        };

        return (
        <div className="animate-fade-in space-y-6">
          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }}>
            <h3 className="font-bold text-gray-700 mb-4">PROPERTY ADDRESS & IDENTIFICATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label={renderToggleLabel('Property details', 'enablePropertyDetailsEditAxis', 'propertyDetailsAxis')} span={2}>
                <textarea className={inputCls} rows={3} value={fields.enablePropertyDetailsEditAxis ? (fields.propertyDetailsAxis ?? fields.axisAddressOfTheProperty ?? '') : (fields.axisAddressOfTheProperty ?? '')} onChange={e => handleChange('propertyDetailsAxis', e.target.value)} disabled={isReadOnly || !fields.enablePropertyDetailsEditAxis} />
              </Field>
              <Field label={renderToggleLabel('Property Address', 'enablePropertyAddressEditAxis', 'propertyAddressAxis')} span={2}>
                <textarea className={inputCls} rows={3} value={fields.enablePropertyAddressEditAxis ? (fields.propertyAddressAxis ?? fields.axisAddressOfTheProperty ?? '') : (fields.axisAddressOfTheProperty ?? '')} onChange={e => handleChange('propertyAddressAxis', e.target.value)} disabled={isReadOnly || !fields.enablePropertyAddressEditAxis} />
              </Field>
              <Field label={renderToggleLabel('City', 'enableCityEditAxis', 'city')}><input className={inputCls} value={fields.enableCityEditAxis ? (fields.city ?? computedCity) : computedCity} onChange={e => handleChange('city', e.target.value)} disabled={isReadOnly || !fields.enableCityEditAxis} /></Field>
              <Field label={renderToggleLabel('District', 'enableDistrictEditAxis', 'district')}><input className={inputCls} value={fields.enableDistrictEditAxis ? (fields.district ?? computedDistrict) : computedDistrict} onChange={e => handleChange('district', e.target.value)} disabled={isReadOnly || !fields.enableDistrictEditAxis} /></Field>
              <Field label={renderToggleLabel('State', 'enableStateEditAxis', 'state')}><input className={inputCls} value={fields.enableStateEditAxis ? (fields.state ?? computedState) : computedState} onChange={e => handleChange('state', e.target.value)} disabled={isReadOnly || !fields.enableStateEditAxis} /></Field>
              <Field label={renderToggleLabel('Pin Code', 'enablePinCodeEditAxis', 'pinCode')}><input className={inputCls} value={fields.enablePinCodeEditAxis ? (fields.pinCode ?? computedPinCode) : computedPinCode} onChange={e => handleChange('pinCode', e.target.value)} disabled={isReadOnly || !fields.enablePinCodeEditAxis} /></Field>
            </div>
          </div>
          
          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }}>
            <h3 className="font-bold text-gray-700 mb-4">LOCALITY & OCCUPANCY CHARACTERISTICS</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nearby Land Mark"><input className={inputCls} value={fields.landmark || ''} onChange={e => handleChange('landmark', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Distance from City Center"><input className={inputCls} value={fields.distanceFromCityCenter || ''} onChange={e => handleChange('distanceFromCityCenter', e.target.value)} disabled={isReadOnly} /></Field>
              
              {renderDropdownWithCustom('Classification of Locality', 'classificationOfLocalityAxis', ['Developing', 'Developed', 'Underdeveloped', 'Stagnant / Fully Developed', 'Decaying / Declining', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Approved by Town', 'approvedByTownAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'Agricultural', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Locality Classification', 'localityClassificationAxis', ['Residential', 'Commercial', 'Industrial', 'Mixed', 'Agricultural', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Building Type', 'buildingTypeAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'Institutional', 'Warehouse', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Class of Locality', 'classOfLocality', ['Upper Class / Posh', 'Upper Middle Class', 'Middle Class', 'Lower Middle Class', 'Slum / Low Income', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Type of Locality', 'typeOfLocalityAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'Mixed Use', 'Rural / Village Abadi', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Condition of Building', 'conditionOfBuildingAxis', ['Excellent', 'Good', 'Average / Fair', 'Poor', 'Dilapidated / Under Construction', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Occupancy Details', 'occupancyDetailsAxis', ['Self-Occupied', 'Tenanted', 'Vacant', 'Partly Self / Partly Tenanted', 'NA', 'Custom'])}
              <Field label="Monthly Rentals for Freehold Prop"><input className={inputCls} value={fields.monthlyRentalsFreeholdAxis || ''} onChange={e => handleChange('monthlyRentalsFreeholdAxis', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Name of the Lease"><input className={inputCls} value={fields.nameOfTheLeaseAxis || ''} onChange={e => handleChange('nameOfTheLeaseAxis', e.target.value)} disabled={isReadOnly} /></Field>
              {renderDropdownWithCustom('Type Of Property', 'propertyType', ['Single-storied Residential Building', 'Multi-storied Residential Building', 'Independent Bungalow / Villa', 'Residential Flat / Apartment', 'Commercial Shop / Office', 'Vacant Plot', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Status Of Property', 'statusOfPropertyAxis', ['Free Hold', 'Lease Hold', 'Power of Attorney (POA)', 'Government Allotted', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Actual Usage Of Property', 'actualUsageOfPropertyAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'Mixed (Residential + Commercial)', 'Vacant', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Approved Usage of Property', 'approvedUsageOfPropertyAxis', ['Residential', 'Commercial', 'Industrial', 'Residential Cum Industrial', 'NA / Unapproved / GP Limit', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Property Demarcation at Site', 'plotDemarcated', ['Yes', 'No', 'NA', 'Custom'])}
            </div>
          </div>

          <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }}>
            <h3 className="font-bold text-gray-700 mb-4">AMENITIES, INTERIORS & ORIENTATION</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Distance: Nearest Metro / Bus Station / Railway Station/Airport"><input className={inputCls} value={fields.distanceNearestMetroBusRailwayAirportAxis || ''} onChange={e => handleChange('distanceNearestMetroBusRailwayAirportAxis', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Nearness to recreation facilities"><input className={inputCls} value={fields.nearnessToRecreationFacilitiesAxis || ''} onChange={e => handleChange('nearnessToRecreationFacilitiesAxis', e.target.value)} disabled={isReadOnly} /></Field>
              {renderDropdownWithCustom('Quality of Interiors', 'qualityOfInteriorsAxis', ['Excellent', 'Good', 'Average', 'Poor', 'NA', 'Custom'])}
              {renderDropdownWithCustom('Vastu Compliance or direction of the entrance', 'vastuComplianceDirectionAxis', ['North-faced', 'East-faced', 'West-faced', 'South-faced', 'North-East faced', 'North-West faced', 'South-East faced', 'South-West faced', 'NA', 'Custom'])}
            </div>
          </div>
        </div>
      );
      }
    },
    {
      id: 'axis-section-4',
      title: 'Boundaries, Access & Geolocation',
      number: 4,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white";
        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }}>
              <h3 className="font-bold text-gray-700 mb-4">Four Boundaries of the Property</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-white bg-opacity-50 border-b">
                    <tr>
                      <th className="px-4 py-2">Source / Description</th>
                      <th className="px-4 py-2">East</th>
                      <th className="px-4 py-2">West</th>
                      <th className="px-4 py-2">North</th>
                      <th className="px-4 py-2">South</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium">As Per saledeed</td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.eastAsPerDeed || ''} onChange={e => handleChange('eastAsPerDeed', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.westAsPerDeed || ''} onChange={e => handleChange('westAsPerDeed', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.northAsPerDeed || ''} onChange={e => handleChange('northAsPerDeed', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.southAsPerDeed || ''} onChange={e => handleChange('southAsPerDeed', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium">As per Sketch map</td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.eastAsPerPlan || ''} onChange={e => handleChange('eastAsPerPlan', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.westAsPerPlan || ''} onChange={e => handleChange('westAsPerPlan', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.northAsPerPlan || ''} onChange={e => handleChange('northAsPerPlan', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.southAsPerPlan || ''} onChange={e => handleChange('southAsPerPlan', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Actual as per Site</td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.eastAsPerSite || ''} onChange={e => handleChange('eastAsPerSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.westAsPerSite || ''} onChange={e => handleChange('westAsPerSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.northAsPerSite || ''} onChange={e => handleChange('northAsPerSite', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.southAsPerSite || ''} onChange={e => handleChange('southAsPerSite', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }}>
              <h3 className="font-bold text-gray-700 mb-4">Abutting Road & Geo Coordinates</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Width of the abutting Road - Road 1"><input className={inputCls} value={fields.widthOfRoad1 || ''} onChange={e => handleChange('widthOfRoad1', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Width of the abutting Road - Road 2"><input className={inputCls} value={fields.widthOfRoad2 || ''} onChange={e => handleChange('widthOfRoad2', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Latitude"><input className={inputCls} value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Longitude"><input className={inputCls} value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-section-5',
      title: 'Approval & Structural Information',
      number: 5,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white";
        const renderDropdownWithCustom = (label: string, fieldKey: string, options: string[]) => {
          const isCustomKey = `${fieldKey}_isCustom`;
          const isCustom = fields[isCustomKey] || false;
          return (
            <Field label={label}>
              <select
                className={inputCls}
                value={isCustom ? 'Custom' : (fields[fieldKey] || '')}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'Custom') {
                    handleChange(isCustomKey, true);
                    handleChange(fieldKey, '');
                  } else {
                    handleChange(isCustomKey, false);
                    handleChange(fieldKey, val);
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="">Select...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {isCustom && (
                <input className={`${inputCls} mt-2`} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly} placeholder="Enter custom value..." />
              )}
            </Field>
          );
        };

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F7FEE7', borderColor: '#D9F99D' }}>
              <h3 className="font-bold text-gray-700 mb-4">Approval Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-white bg-opacity-50 border-b">
                    <tr>
                      <th className="px-4 py-2">Description</th>
                      <th className="px-4 py-2">Approval authority</th>
                      <th className="px-4 py-2">Approval no</th>
                      <th className="px-4 py-2">Approval Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium">Layout Plan</td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.axisLayoutPlanApprovalAuthority || ''} onChange={e => handleChange('axisLayoutPlanApprovalAuthority', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.axisLayoutPlanApprovalNo || ''} onChange={e => handleChange('axisLayoutPlanApprovalNo', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input type="date" className={inputCls} value={fields.axisLayoutPlanApprovalDate || ''} onChange={e => handleChange('axisLayoutPlanApprovalDate', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Building/Construction Plan</td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.axisBuildingPlanApprovalAuthority || ''} onChange={e => handleChange('axisBuildingPlanApprovalAuthority', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input className={inputCls} value={fields.axisBuildingPlanApprovalNo || ''} onChange={e => handleChange('axisBuildingPlanApprovalNo', e.target.value)} disabled={isReadOnly} /></td>
                      <td className="px-2 py-1"><input type="date" className={inputCls} value={fields.axisBuildingPlanApprovalDate || ''} onChange={e => handleChange('axisBuildingPlanApprovalDate', e.target.value)} disabled={isReadOnly} /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }}>
              <h3 className="font-bold text-gray-700 mb-4">Building Specifications & Condition</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Age of Building (Years)"><input className={inputCls} value={fields.axisAgeOfBuilding || ''} onChange={e => handleChange('axisAgeOfBuilding', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Estimated Life of Building (Years)"><input className={inputCls} value={fields.axisEstimatedLifeOfBuilding || ''} onChange={e => handleChange('axisEstimatedLifeOfBuilding', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Construction Year"><input className={inputCls} value={fields.axisConstructionYear || ''} onChange={e => handleChange('axisConstructionYear', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Construction Type (e.g., RCC, Load Bearing)"><input className={inputCls} value={fields.axisConstructionType || ''} onChange={e => handleChange('axisConstructionType', e.target.value)} disabled={isReadOnly} /></Field>
                {renderDropdownWithCustom('Comments on Feasibility', 'axisCommentsOnFeasibility', ['Good', 'Satisfactory', 'Feasible', 'Poor', 'Not Feasible', 'NA', 'Custom'])}
                <Field label="Depreciation%"><input className={inputCls} value={fields.axisDepreciationPercentage || ''} onChange={e => handleChange('axisDepreciationPercentage', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="No Of Floors (As per Plan)"><input className={inputCls} value={fields.axisNoOfFloorsPlan || ''} onChange={e => handleChange('axisNoOfFloorsPlan', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="No Of Floors (As per Site)"><input className={inputCls} value={fields.axisNoOfFloorsSite || ''} onChange={e => handleChange('axisNoOfFloorsSite', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-section-6',
      title: 'Unit Measurements & Setbacks',
      number: 6,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500";
        
        const renderField = (label: string, fieldKey: string) => (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">{label}</label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={fields[fieldKey] === 'NA'} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
              </label>
            </div>
            <input className={inputCls} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly || fields[fieldKey] === 'NA'} />
          </div>
        );

        const renderDropdownWithCustom = (label: string, fieldKey: string, options: string[]) => {
          const isCustomKey = `${fieldKey}_isCustom`;
          const isCustom = fields[isCustomKey] || false;
          const isNA = fields[fieldKey] === 'NA';
          return (
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">{label}</label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={isNA} onChange={e => {
                    if (e.target.checked) {
                      handleChange(isCustomKey, false);
                      handleChange(fieldKey, 'NA');
                    } else {
                      handleChange(fieldKey, '');
                    }
                  }} disabled={isReadOnly} />
                  <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
                </label>
              </div>
              <select
                className={inputCls}
                value={isNA ? 'NA' : (isCustom ? 'Custom' : (fields[fieldKey] || ''))}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'Custom') {
                    handleChange(isCustomKey, true);
                    handleChange(fieldKey, '');
                  } else {
                    handleChange(isCustomKey, false);
                    handleChange(fieldKey, val);
                  }
                }}
                disabled={isReadOnly || isNA}
              >
                <option value="">Select...</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
              {isCustom && !isNA && (
                <input className={`${inputCls} mt-2`} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly} placeholder="Enter custom value..." />
              )}
            </div>
          );
        };

        const renderTableCell = (fieldKey: string) => (
          <div className="flex flex-col space-y-1 px-1 py-1">
            <div className="flex justify-end">
              <label className="flex items-center space-x-1 cursor-pointer" title="Not Applicable">
                <input type="checkbox" className="w-2.5 h-2.5" checked={fields[fieldKey] === 'NA'} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                <span className="text-[9px] text-gray-400 font-medium leading-none">NA</span>
              </label>
            </div>
            <input className={`${inputCls} text-xs p-1`} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly || fields[fieldKey] === 'NA'} />
          </div>
        );
        
        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#ECFEFF', borderColor: '#A5F3FC' }}>
              <h3 className="font-bold text-gray-700 mb-4">Valuation of the Property Flat/Shop/Office/</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Measured Carpet Area (Sq. Ft.)', 'axisMeasuredCarpetArea')}
                {renderField('Approved Carpet Area (Sq. Ft.)', 'axisApprovedCarpetArea')}
                {renderField('UDS Land (Sq. Ft.)', 'axisUDSLand')}
                {renderField('Agreement Carpet Area (Sq. Ft.)', 'axisAgreementCarpetArea')}
                {renderField('Loading Adopted for Valuation (%)', 'axisLoadingAdoptedForValuation')}
                {renderField('Saleable Area of Unit (Sq. Ft.)', 'axisSaleableAreaOfUnit')}
                {renderField('Built Up Area (Sq. Ft.)', 'axisBuiltUpArea')}
                {renderField('Prevailing Rate for Building (Rs.)', 'axisPrevailingRateForBuilding')}
                {renderField('Floor Rise Rate (Rs.)', 'axisFloorRiseRate')}
                {renderField('Adopted Rate Building', 'axisAdoptedRateBuilding')}
                {renderField('Market Value Of the Unit', 'axisMarketValueOfTheUnit')}
                {renderDropdownWithCustom('Car Parking', 'axisCarParkingDropdown', ['Available', 'Covered', 'Open', 'Basement', 'NA', 'Custom'])}
                {renderField('No. of Car Parking', 'axisNoOfCarParking')}
                {renderField('Parking Area', 'axisParkingArea')}
                {renderField('Car Parking Price', 'axisCarParkingPrice')}
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }}>
              <h3 className="font-bold text-gray-700 mb-4">Unit Details - Row House/ Independent House/Plot</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('Plot Area', 'axisPlotArea')}
                {renderField('Floor wise Break-up (As per actual BUA)', 'axisFloorWiseBreakUp')}
                {renderField('As per Approval (Approved BUA)', 'axisAsPerApproval')}
                {renderField('As per max. Permissible FAR norms', 'axisAsPerMaxPermissibleFARNorms')}
                {renderField('Deviation (Sq. Ft.)', 'axisDeviationSqFt')}
                {renderField('Deviation (%)', 'axisDeviationPercentage')}
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FEFCE8', borderColor: '#FEF08A' }}>
              <h3 className="font-bold text-gray-700 mb-4">Side Margin Details</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-white bg-opacity-50 border-b">
                    <tr>
                      <th className="px-4 py-2 min-w-30">Margin Reference</th>
                      <th className="px-2 py-2 min-w-25">Front</th>
                      <th className="px-2 py-2 min-w-25">Left Side</th>
                      <th className="px-2 py-2 min-w-25">Right Side</th>
                      <th className="px-2 py-2 min-w-25">Rear</th>
                      <th className="px-2 py-2 min-w-25">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium">As per Approval</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginApprovalFront')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginApprovalLeft')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginApprovalRight')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginApprovalRear')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginApprovalRemarks')}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium">Actual at Site</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginActualFront')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginActualLeft')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginActualRight')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginActualRear')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginActualRemarks')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Deviation %</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginDeviationFront')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginDeviationLeft')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginDeviationRight')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginDeviationRear')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisSideMarginDeviationRemarks')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }}>
              <h3 className="font-bold text-gray-700 mb-4">Quality of Construction & Upkeep</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderDropdownWithCustom('Quality of Construction', 'axisQualityOfConstruction', ['Excellent', 'Good', 'Average', 'Poor', 'NA', 'Custom'])}
                {renderDropdownWithCustom('Maintenance of the Property', 'axisMaintenanceOfTheProperty', ['Well Maintained', 'Good', 'Average', 'Poor', 'NA', 'Custom'])}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-section-7',
      title: 'Valuation & Construction Cost Break-up',
      number: 7,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500";
        
        const safeNum = (val: any) => {
          if (val === 'NA' || !val) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        };

        const renderFieldWithUnit = (label: string, fieldKey: string, unitTag: string) => (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">{label}</label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={fields[fieldKey] === 'NA'} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
              </label>
            </div>
            <div className="relative">
              <input className={`${inputCls} pr-16`} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly || fields[fieldKey] === 'NA'} />
              <div className="absolute right-1 top-1.5 px-2 bg-gray-100 rounded text-xs text-gray-500 pointer-events-none">{unitTag}</div>
            </div>
          </div>
        );

        const renderFieldWithFormulaAndUnit = (label: string, fieldKey: string, formulaLabel: string, calculatedValue: number | string, unitTag?: string, isRedFormula?: boolean) => {
          const isManual = fields[`${fieldKey}_isManual`] || false;
          const isNA = fields[fieldKey] === 'NA';
          const displayValue = (isManual || isNA) ? (fields[fieldKey] || '') : calculatedValue;
          
          return (
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">{label} <span className={`font-normal italic ml-1 ${isRedFormula ? 'text-red-500' : 'text-gray-400'}`}>{formulaLabel}</span></label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1" title="Toggle Manual Override">
                    <span className="text-[9px] text-gray-500 font-medium uppercase">Edit</span>
                    <button type="button" className={`w-6 h-3 rounded-full relative transition-colors ${isManual ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => handleChange(`${fieldKey}_isManual`, !isManual)} disabled={isReadOnly}>
                      <div className={`w-2 h-2 bg-white rounded-full absolute top-0.5 transition-transform ${isManual ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={isNA} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                    <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
                  </label>
                </div>
              </div>
              <div className="relative">
                <input className={`${inputCls} ${unitTag ? 'pr-16' : ''} ${!isManual ? 'bg-green-50/50' : ''}`} value={displayValue} onChange={e => isManual && handleChange(fieldKey, e.target.value)} disabled={isReadOnly || isNA || !isManual} />
                {unitTag && <div className="absolute right-1 top-1.5 px-2 bg-gray-100 rounded text-xs text-gray-500 pointer-events-none">{unitTag}</div>}
              </div>
            </div>
          );
        };

        const renderTableCell = (fieldKey: string) => (
          <div className="flex flex-col space-y-1 px-1 py-1">
            <div className="flex justify-end">
              <label className="flex items-center space-x-1 cursor-pointer" title="Not Applicable">
                <input type="checkbox" className="w-2.5 h-2.5" checked={fields[fieldKey] === 'NA'} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                <span className="text-[9px] text-gray-400 font-medium leading-none">NA</span>
              </label>
            </div>
            <input className={`${inputCls} text-xs p-1`} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly || fields[fieldKey] === 'NA'} />
          </div>
        );

        const renderTableCellWithFormula = (fieldKey: string, calculatedValue: number | string, formulaLabel: string) => {
          const isManual = fields[`${fieldKey}_isManual`] || false;
          const isNA = fields[fieldKey] === 'NA';
          const displayValue = (isManual || isNA) ? (fields[fieldKey] || '') : calculatedValue;
          
          return (
            <div className="flex flex-col space-y-1 px-1 py-1 group relative">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-0.5">
                  <button type="button" className={`w-5 h-2.5 rounded-full relative transition-colors ${isManual ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => handleChange(`${fieldKey}_isManual`, !isManual)} disabled={isReadOnly} title="Toggle Edit">
                    <div className={`w-1.5 h-1.5 bg-white rounded-full absolute top-0.5 transition-transform ${isManual ? 'translate-x-2.5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <label className="flex items-center space-x-1 cursor-pointer" title="Not Applicable">
                  <input type="checkbox" className="w-2.5 h-2.5" checked={isNA} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                  <span className="text-[9px] text-gray-400 font-medium leading-none">NA</span>
                </label>
              </div>
              <input className={`${inputCls} text-xs p-1 ${!isManual ? 'bg-green-50/50' : ''}`} value={displayValue} onChange={e => isManual && handleChange(fieldKey, e.target.value)} disabled={isReadOnly || isNA || !isManual} title={formulaLabel} />
            </div>
          );
        };

        // Calculations
        const landArea = safeNum(fields.axisAreaOfLand);
        const landRate = safeNum(fields.axisMarketRateOfLand);
        const landValueCalc = (landArea * landRate).toFixed(2);

        const floors = ['GF', 'FF', 'SF', 'TF', 'NA'];
        const approvedBuaTotal = floors.reduce((sum, f) => sum + safeNum(fields[`axisCostBreakupApprovedBUA${f}`]), 0);
        const actualBuaTotal = floors.reduce((sum, f) => sum + safeNum(fields[`axisCostBreakupActualBUA${f}`]), 0);

        const totalBuaValues = floors.reduce((acc, f) => {
          acc[f] = safeNum(fields[`axisCostBreakupActualBUA${f}`]) * safeNum(fields[`axisCostBreakupConstructionCost${f}`]);
          return acc;
        }, {} as Record<string, number>);
        const totalBuaValueSum = floors.reduce((sum, f) => sum + totalBuaValues[f], 0);

        const approvedBuaValueTotal = floors.reduce((sum, f) => sum + (safeNum(fields[`axisCostBreakupApprovedBUA${f}`]) * safeNum(fields[`axisCostBreakupConstructionCost${f}`])), 0);
        const totalLandVal = fields.axisValueOfTheLand_isManual ? safeNum(fields.axisValueOfTheLand) : safeNum(landValueCalc);
        const totalConstructionVal = fields.axisCostBreakupTotalBUAValueTotal_isManual ? safeNum(fields.axisCostBreakupTotalBUAValueTotal) : totalBuaValueSum;
        const marketValueUnitCalc = (totalLandVal + totalConstructionVal).toFixed(2);
        
        const recommendedConstructionRate = safeNum(fields.axisRecommendedConstructionRate);
        const recommendedConstCostCalc = (approvedBuaTotal * recommendedConstructionRate).toFixed(2);
        const recommendedConstCost = fields.axisRecommendedCostOfConstruction_isManual ? safeNum(fields.axisRecommendedCostOfConstruction) : safeNum(recommendedConstCostCalc);
        const totalValueCalc = (totalLandVal + recommendedConstCost).toFixed(2);

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F4F6F0', borderColor: '#D5DDC5' }}>
              <h3 className="font-bold text-gray-700 mb-4">Market Value of Independent Property (Land)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderFieldWithUnit('Area of Land (As per Documents)', 'axisAreaOfLand', 'Sq. Ft.')}
                {renderFieldWithUnit('Market rate of the Land', 'axisMarketRateOfLand', 'Rs./Sq. Ft.')}
                <div className="md:col-span-2">
                  {renderFieldWithFormulaAndUnit('Value of the Land', 'axisValueOfTheLand', '[Formula: Area × Rate]', landValueCalc, 'Rs.')}
                </div>
              </div>
            </div>



            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FCF4F9', borderColor: '#F2CCE2' }}>
              <h3 className="font-bold text-gray-700 mb-4">Cost of Construction Break-up</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="text-xs text-gray-700 uppercase bg-white bg-opacity-50 border-b">
                    <tr>
                      <th className="px-4 py-2 min-w-35">Parameter</th>
                      <th className="px-2 py-2 min-w-22.5">GF</th>
                      <th className="px-2 py-2 min-w-22.5">FF</th>
                      <th className="px-2 py-2 min-w-22.5">SF</th>
                      <th className="px-2 py-2 min-w-22.5">TF</th>
                      <th className="px-2 py-2 min-w-22.5">NA / Other</th>
                      <th className="px-2 py-2 min-w-25">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium">Approved BUA (Sq. Ft.)</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupApprovedBUAGF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupApprovedBUAFF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupApprovedBUASF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupApprovedBUATF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupApprovedBUANA')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCellWithFormula('axisCostBreakupApprovedBUATotal', approvedBuaTotal.toFixed(2), '[Formula: Sum of all floors]')}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium">Actual BUA Sq ft</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupActualBUAGF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupActualBUAFF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupActualBUASF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupActualBUATF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupActualBUANA')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCellWithFormula('axisCostBreakupActualBUATotal', actualBuaTotal.toFixed(2), '[Formula: Sum of all floors]')}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-2 font-medium">Construction Cost Rs. Per Sq ft</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupConstructionCostGF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupConstructionCostFF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupConstructionCostSF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupConstructionCostTF')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupConstructionCostNA')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCell('axisCostBreakupConstructionCostTotal')}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 font-medium">Total BUA Value</td>
                      <td className="px-1 py-1 align-top">{renderTableCellWithFormula('axisCostBreakupTotalBUAValueGF', totalBuaValues.GF.toFixed(2), '[Formula: Actual BUA × Cost]')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCellWithFormula('axisCostBreakupTotalBUAValueFF', totalBuaValues.FF.toFixed(2), '[Formula: Actual BUA × Cost]')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCellWithFormula('axisCostBreakupTotalBUAValueSF', totalBuaValues.SF.toFixed(2), '[Formula: Actual BUA × Cost]')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCellWithFormula('axisCostBreakupTotalBUAValueTF', totalBuaValues.TF.toFixed(2), '[Formula: Actual BUA × Cost]')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCellWithFormula('axisCostBreakupTotalBUAValueNA', totalBuaValues.NA.toFixed(2), '[Formula: Actual BUA × Cost]')}</td>
                      <td className="px-1 py-1 align-top">{renderTableCellWithFormula('axisCostBreakupTotalBUAValueTotal', totalBuaValueSum.toFixed(2), '[Formula: Sum of all floor values]')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF5F5', borderColor: '#FED7D7' }}>
              <h3 className="font-bold text-gray-700 mb-4">Unit Market Value Summary</h3>
              <div className="grid grid-cols-1 gap-4">
                {renderFieldWithFormulaAndUnit('Value of the Approved BUA', 'axisValueOfApprovedBUA', '[Formula: Approved BUA × Construction Rate]', approvedBuaValueTotal.toFixed(2), 'Rs.')}
                {renderFieldWithFormulaAndUnit('Market Value of the Unit : (Land + Construction)', 'axisMarketValueOfTheUnitLandAndConstruction', '[Formula: Land Value + Construction Value]', marketValueUnitCalc, 'Rs.')}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-section-8',
      title: 'Construction Cost (For Plot Plus Construction)',
      number: 8,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white shadow-inner";
        const safeNum = (val: any) => {
          const n = parseFloat(val);
          return isNaN(n) ? 0 : n;
        };

        const renderFieldWithUnit = (label: string, fieldKey: string, unitTag?: string) => (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">{label}</label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={fields[fieldKey] === 'NA'} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
              </label>
            </div>
            <div className="relative">
              <input className={`${inputCls} ${unitTag ? 'pr-16' : ''}`} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly || fields[fieldKey] === 'NA'} />
              {unitTag && <div className="absolute right-1 top-1.5 px-2 bg-gray-100 rounded text-xs text-gray-500 pointer-events-none">{unitTag}</div>}
            </div>
          </div>
        );

        const renderFieldWithFormulaAndUnit = (label: string, fieldKey: string, formulaLabel: string, calculatedValue: number | string, unitTag?: string, isRedFormula?: boolean) => {
          const isManual = fields[`${fieldKey}_isManual`] || false;
          const isNA = fields[fieldKey] === 'NA';
          const displayValue = (isManual || isNA) ? (fields[fieldKey] || '') : calculatedValue;
          
          return (
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">{label} <span className={`font-normal italic ml-1 ${isRedFormula ? 'text-red-500' : 'text-gray-400'}`}>{formulaLabel}</span></label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1" title="Toggle Manual Override">
                    <span className="text-[9px] text-gray-500 font-medium uppercase">Edit</span>
                    <button type="button" className={`w-6 h-3 rounded-full relative transition-colors ${isManual ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => handleChange(`${fieldKey}_isManual`, !isManual)} disabled={isReadOnly}>
                      <div className={`w-2 h-2 bg-white rounded-full absolute top-0.5 transition-transform ${isManual ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={isNA} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                    <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
                  </label>
                </div>
              </div>
              <div className="relative">
                <input className={`${inputCls} ${unitTag ? 'pr-16' : ''} ${!isManual ? 'bg-green-50/50' : ''}`} value={displayValue} onChange={e => isManual && handleChange(fieldKey, e.target.value)} disabled={isReadOnly || isNA || !isManual} />
                {unitTag && <div className="absolute right-1 top-1.5 px-2 bg-gray-100 rounded text-xs text-gray-500 pointer-events-none">{unitTag}</div>}
              </div>
            </div>
          );
        };

        const landArea = safeNum(fields.axisAreaOfLand);
        const landRate = safeNum(fields.axisMarketRateOfLand);
        const landValueCalc = (landArea * landRate).toFixed(2);
        
        const floors = ['GF', 'FF', 'SF', 'TF', 'NA'];
        const approvedBuaTotal = floors.reduce((sum, f) => sum + safeNum(fields[`axisCostBreakupApprovedBUA${f}`]), 0);
        
        const totalLandVal = fields.axisValueOfTheLand_isManual ? safeNum(fields.axisValueOfTheLand) : safeNum(landValueCalc);
        
        const recommendedConstructionRate = safeNum(fields.axisRecommendedConstructionRate);
        const recommendedConstCostCalc = (approvedBuaTotal * recommendedConstructionRate).toFixed(2);
        const recommendedConstCost = fields.axisRecommendedCostOfConstruction_isManual ? safeNum(fields.axisRecommendedCostOfConstruction) : safeNum(recommendedConstCostCalc);
        const totalValueCalc = (totalLandVal + recommendedConstCost).toFixed(2);

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FDF4FF', borderColor: '#F5D0FE' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-700">Construction Cost & Technical Specifications</h3>
              </div>
              <div className="bg-fuchsia-50 text-fuchsia-800 text-xs p-2 rounded border border-fuchsia-200 mb-4 inline-block">
                <strong>Note:</strong> Cost of Construction to be worked out on Approved area only
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderFieldWithUnit('Estimated Cost Of Construction', 'axisEstimatedCostOfConstruction', 'Rs.')}
                {renderFieldWithUnit('Standard Cost Of Construction', 'axisStandardCostOfConstruction', 'Rs.')}
                
                {renderFieldWithUnit('Estimated Rate Per Sq ft', 'axisEstimatedRatePerSqft', 'Rs. / Sq. Ft.')}
                {renderFieldWithUnit('Standard Rate Per Sq ft', 'axisStandardRatePerSqft', 'Rs. / Sq. Ft.')}
                
                <div className="md:col-span-2">
                  <div className="space-y-1">
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-gray-700">Material & Finishing Details as proposed in Estimate</label>
                      <label className="flex items-center space-x-1 cursor-pointer">
                        <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={fields.axisMaterialAndFinishingDetails === 'NA'} onChange={e => handleChange('axisMaterialAndFinishingDetails', e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                        <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
                      </label>
                    </div>
                    <textarea 
                      className={`${inputCls} min-h-20 resize-none placeholder:text-gray-400`} 
                      placeholder="Describe the Flooring, Doors, Windows, Wall Finish, Lighting, and Plumbing etc."
                      value={fields.axisMaterialAndFinishingDetails || ''} 
                      onChange={e => handleChange('axisMaterialAndFinishingDetails', e.target.value)} 
                      disabled={isReadOnly || fields.axisMaterialAndFinishingDetails === 'NA'} 
                    />
                  </div>
                </div>

                {renderFieldWithUnit('Stage of Construction', 'axisStageOfConstruction', '%')}
                {renderFieldWithUnit('Recommended For Disbursement', 'axisRecommendedForDisbursement', '%')}
                
                {renderFieldWithUnit('Recommended construction rate based on the proposed specifications', 'axisRecommendedConstructionRate', 'Rs. / Sq. Ft.')}
                {renderFieldWithFormulaAndUnit('Recommended Cost of Construction', 'axisRecommendedCostOfConstruction', '[Formula: Approved BUA × Recommended Construction Rate]', recommendedConstCostCalc, 'Rs.', true)}

                <div className="md:col-span-2">
                  {renderFieldWithFormulaAndUnit('Total Value of property after Completion', 'axisTotalValueOfPropertyAfterCompletion', '[Formula: Market Value of Land + Recommended Const Cost]', totalValueCalc, 'Rs.', true)}
                </div>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-section-9',
      title: 'Government Valuation & Distress Value',
      number: 9,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500";
        
        const safeNum = (val: any) => {
          if (val === 'NA' || !val) return 0;
          const num = parseFloat(val);
          return isNaN(num) ? 0 : num;
        };

        const renderFieldWithUnit = (label: string, fieldKey: string, unitTag?: string) => (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">{label}</label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={fields[fieldKey] === 'NA'} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
              </label>
            </div>
            <div className="relative">
              <input className={`${inputCls} ${unitTag ? 'pr-16' : ''}`} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly || fields[fieldKey] === 'NA'} />
              {unitTag && <div className="absolute right-1 top-1.5 px-2 bg-gray-100 rounded text-xs text-gray-500 pointer-events-none">{unitTag}</div>}
            </div>
          </div>
        );

        const renderFieldWithFormulaAndUnit = (label: string, fieldKey: string, formulaLabel: string, calculatedValue: number | string, unitTag?: string, isRedFormula?: boolean) => {
          const isManual = fields[`${fieldKey}_isManual`] || false;
          const isNA = fields[fieldKey] === 'NA';
          const displayValue = (isManual || isNA) ? (fields[fieldKey] || '') : calculatedValue;
          
          return (
            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-gray-700">{label} <span className={`font-normal italic ml-1 ${isRedFormula ? 'text-red-500' : 'text-gray-400'}`}>{formulaLabel}</span></label>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1" title="Toggle Manual Override">
                    <span className="text-[9px] text-gray-500 font-medium uppercase">Edit</span>
                    <button type="button" className={`w-6 h-3 rounded-full relative transition-colors ${isManual ? 'bg-green-500' : 'bg-gray-300'}`} onClick={() => handleChange(`${fieldKey}_isManual`, !isManual)} disabled={isReadOnly}>
                      <div className={`w-2 h-2 bg-white rounded-full absolute top-0.5 transition-transform ${isManual ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
                    </button>
                  </div>
                  <label className="flex items-center space-x-1 cursor-pointer">
                    <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={isNA} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                    <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
                  </label>
                </div>
              </div>
              <div className="relative">
                <input className={`${inputCls} ${unitTag ? 'pr-16' : ''} ${!isManual ? 'bg-green-50/50' : ''}`} value={displayValue} onChange={e => isManual && handleChange(fieldKey, e.target.value)} disabled={isReadOnly || isNA || !isManual} />
                {unitTag && <div className="absolute right-1 top-1.5 px-2 bg-gray-100 rounded text-xs text-gray-500 pointer-events-none">{unitTag}</div>}
              </div>
            </div>
          );
        };

        // Calculations
        const govtLandValueCalc = (safeNum(fields.axisAreaOfLandGovt) * safeNum(fields.axisGovernmentRate)).toFixed(2);
        const finalGovtLandVal = fields.axisValueOfTheLandGovt_isManual ? safeNum(fields.axisValueOfTheLandGovt) : safeNum(govtLandValueCalc);
        
        // BUA total construction cost from Section 7
        const floors = ['GF', 'FF', 'SF', 'TF', 'NA'];
        const totalBuaValues = floors.reduce((acc, f) => {
          acc[f] = safeNum(fields[`axisCostBreakupActualBUA${f}`]) * safeNum(fields[`axisCostBreakupConstructionCost${f}`]);
          return acc;
        }, {} as Record<string, number>);
        const totalBuaValueSum = floors.reduce((sum, f) => sum + totalBuaValues[f], 0);
        const totalConstructionVal = fields.axisCostBreakupTotalBUAValueTotal_isManual ? safeNum(fields.axisCostBreakupTotalBUAValueTotal) : totalBuaValueSum;
        
        const govtValueOfUnitCalc = (finalGovtLandVal + totalConstructionVal).toFixed(2);
        
        // Market value from Section 7/8
        const totalLandVal = fields.axisValueOfTheLand_isManual ? safeNum(fields.axisValueOfTheLand) : (safeNum(fields.axisAreaOfLand) * safeNum(fields.axisMarketRateOfLand));
        const marketValueUnitCalc = (totalLandVal + totalConstructionVal).toFixed(2);
        const finalMarketVal = fields.axisMarketValueOfTheUnitLandAndConstruction_isManual ? safeNum(fields.axisMarketValueOfTheUnitLandAndConstruction) : safeNum(marketValueUnitCalc);
        
        const distressValueCalc = (finalMarketVal * 0.85).toFixed(2);

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }}>
              <h3 className="font-bold text-gray-700 mb-4">Government Valuation of Independent Property</h3>
              <div className="grid grid-cols-1 gap-4">
                {renderFieldWithUnit('Area of Land', 'axisAreaOfLandGovt', 'Sq. Ft.')}
                {renderFieldWithUnit('Government Rate', 'axisGovernmentRate', 'Rs. / Sq. Ft.')}
                {renderFieldWithFormulaAndUnit('Value of the Land', 'axisValueOfTheLandGovt', '[Formula: Area of Land × Government Rate]', govtLandValueCalc, 'Rs.', true)}
                {renderFieldWithFormulaAndUnit('Govt Value of the Unit : Rs. (Government Land cost + Construction cost calculated above)', 'axisGovtValueOfTheUnit', '[Formula: Value of the Land + Construction Cost calculated above]', govtValueOfUnitCalc, 'Rs.', true)}
                {renderFieldWithFormulaAndUnit('Distress Value of the Property : Rs.', 'axisDistressValueOfTheProperty', '[Formula: 80% to 85% of Market Value]', distressValueCalc, 'Rs.', true)}
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'axis-section-10',
      title: 'Remarks, Certification & Attachments',
      number: 10,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const inputCls = "w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-white disabled:bg-gray-100 disabled:text-gray-500";
        
        const renderField = (label: string, fieldKey: string, type = 'text', options: any = null) => (
          <div className="space-y-1">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-semibold text-gray-700">{label}</label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={fields[fieldKey] === 'NA'} onChange={e => handleChange(fieldKey, e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
              </label>
            </div>
            {type === 'select' ? (
              <select className={inputCls} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly || fields[fieldKey] === 'NA'}>
                <option value="">Select...</option>
                {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : type === 'date' ? (
              <input type="date" className={inputCls} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly || fields[fieldKey] === 'NA'} />
            ) : type === 'file' ? (
              <input type="file" accept="image/png, image/jpeg" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50" onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  handleChange(fieldKey, e.target.files[0]);
                }
              }} disabled={isReadOnly || fields[fieldKey] === 'NA'} />
            ) : (
              <input className={inputCls} value={fields[fieldKey] || ''} onChange={e => handleChange(fieldKey, e.target.value)} disabled={isReadOnly || fields[fieldKey] === 'NA'} />
            )}
          </div>
        );

        return (
          <div className="animate-fade-in space-y-6">
            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#FFF3E0', borderColor: '#FFE0B2' }}>
              <h3 className="font-bold text-gray-700 mb-4">Red Flag Comments & Technical Status</h3>
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-700">Red Flag comments / Remarks</label>
                    <label className="flex items-center space-x-1 cursor-pointer">
                      <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={fields.axisRedFlagComments === 'NA'} onChange={e => handleChange('axisRedFlagComments', e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                      <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
                    </label>
                  </div>
                  <textarea 
                    className={`${inputCls} min-h-25 placeholder:text-gray-400`} 
                    placeholder="Enter negative remarks, violations, high tension wires, or clearance issues..."
                    value={fields.axisRedFlagComments || ''} 
                    onChange={e => handleChange('axisRedFlagComments', e.target.value)} 
                    disabled={isReadOnly || fields.axisRedFlagComments === 'NA'} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Technical Status', 'axisTechnicalStatus', 'select', ['Positive', 'Negative', 'Neutral / Refer to Bank', 'Acceptable with Conditions', 'Custom'])}
                  {fields.axisTechnicalStatus === 'Custom' && (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-semibold text-gray-700">Custom Technical Status</label>
                      </div>
                      <input className={inputCls} value={fields.axisCustomTechnicalStatus || ''} onChange={e => handleChange('axisCustomTechnicalStatus', e.target.value)} disabled={isReadOnly} placeholder="Enter custom status..." />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F8FAFC', borderColor: '#CBD5E1' }}>
              <h3 className="font-bold text-gray-700 mb-4">Undertaking & Site Sign-off</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  {[
                    { key: 'axisUndertakingClause1', defaultText: 'I have personally visited the property & identified the same based on the documents provided' },
                    { key: 'axisUndertakingClause2', defaultText: 'I/We have no direct or Indirect Interest in the property being valued' },
                    { key: 'axisUndertakingClause3', defaultText: 'The information furnished above is true and correct to my/our knowledge' }
                  ].map((clause) => {
                    const isNA = fields[`${clause.key}NA`] === true;
                    return (
                      <div key={clause.key} className={`flex items-start space-x-3 p-2 rounded transition-colors ${isNA ? 'opacity-50 grayscale bg-gray-50' : 'hover:bg-white/50'}`}>
                        <input type="checkbox" className="mt-2 w-4 h-4 text-green-500 rounded border-gray-300 focus:ring-green-500 cursor-pointer" checked={fields[clause.key] !== false} onChange={e => handleChange(clause.key, e.target.checked)} disabled={isReadOnly || isNA} title="Active Confirmation Toggle" />
                        <textarea
                          className={`${inputCls} min-h-10 resize-y flex-1 ${isNA ? 'bg-gray-100' : ''}`}
                          value={fields[`${clause.key}Text`] !== undefined ? fields[`${clause.key}Text`] : clause.defaultText}
                          onChange={e => handleChange(`${clause.key}Text`, e.target.value)}
                          disabled={isReadOnly || isNA}
                        />
                        <label className="flex items-center space-x-1 cursor-pointer mt-2">
                          <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={isNA} onChange={e => handleChange(`${clause.key}NA`, e.target.checked)} disabled={isReadOnly} />
                          <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {renderField('Name of The Person Visited Site', 'axisNameOfPersonVisitedSite')}
                  {renderField('Name of The Valuation Agency', 'axisNameOfValuationAgency')}
                  {renderField('Date of Inspection', 'axisDateOfInspection', 'date')}
                  {renderField('Seal Of the Agency', 'axisSealOfTheAgency', 'file')}
                </div>
              </div>
            </div>

            <div className="border rounded-xl p-4 mb-4" style={{ backgroundColor: '#F9FAFB', borderColor: '#E5E7EB' }}>
              <h3 className="font-bold text-gray-700 mb-4">Attachment</h3>
              <div className="space-y-3">
                {(fields.axisAttachments || []).map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-600 w-6">{idx + 1}.</span>
                    <div className="flex-1 relative">
                      <input 
                        className={inputCls} 
                        value={item.text || ''} 
                        onChange={e => {
                          const arr = [...(fields.axisAttachments || [])];
                          arr[idx] = { ...arr[idx], text: e.target.value };
                          handleChange('axisAttachments', arr);
                        }} 
                        disabled={isReadOnly || item.text === 'NA'} 
                      />
                    </div>
                    <label className="flex items-center space-x-1 cursor-pointer min-w-10">
                      <input type="checkbox" className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500" checked={item.text === 'NA'} onChange={e => {
                        const arr = [...(fields.axisAttachments || [])];
                        arr[idx] = { ...arr[idx], text: e.target.checked ? 'NA' : '' };
                        handleChange('axisAttachments', arr);
                      }} disabled={isReadOnly} />
                      <span className="text-[10px] text-gray-500 font-medium leading-none">NA</span>
                    </label>
                  </div>
                ))}
                {!isReadOnly && (
                  <div className="flex items-center space-x-6 mt-2">
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      onClick={() => {
                        const arr = [...(fields.axisAttachments || [])];
                        arr.push({ text: '' });
                        handleChange('axisAttachments', arr);
                      }}
                    >
                      + Add Attachment Item
                    </button>
                    {(fields.axisAttachments || []).length > 2 && (
                      <button
                        type="button"
                        className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center transition-colors"
                        onClick={() => {
                          const arr = [...(fields.axisAttachments || [])];
                          if (arr.length > 2) {
                            arr.pop();
                            handleChange('axisAttachments', arr);
                          }
                        }}
                      >
                        - Remove Attachment Item
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }
    }
  ],
  getPDFRenderer: (fields) => {
    // Inject computed fields if edit is off so PDF renderer sees them
    if (!fields.enableAddressEdit) {
      const address = [fields.propertyDetailsAxis, fields.propertyAddressAxis, fields.axisAddressOfTheProperty].filter(Boolean).join(' ');
      let computedCity = '';
      let computedDistrict = '';
      let computedState = '';
      let computedPinCode = '';
      if (address) {
        const pinMatch = address.match(/\b(\d{6})\b/);
        if (pinMatch) computedPinCode = pinMatch[1];
        const distMatch = address.match(/(?:Dist|District)[\s-]*([A-Za-z]+)/i);
        if (distMatch && distMatch[1]) {
          computedDistrict = distMatch[1];
          computedCity = computedDistrict;
        }
        const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Delhi'];
        for (const s of states) {
          if (address.toLowerCase().includes(s.toLowerCase())) {
            computedState = s;
            break;
          }
    
    // Inject calculated values for Section 7 into fields for PDF renderer if they are auto-calculated
    const safeNum = (val: any) => {
      if (val === 'NA' || !val) return 0;
      const num = parseFloat(val);
      return isNaN(num) ? 0 : num;
    };
    
    // Land value
    if (!fields.axisValueOfTheLand_isManual && fields.axisValueOfTheLand !== 'NA') {
      fields.axisValueOfTheLand = (safeNum(fields.axisAreaOfLand) * safeNum(fields.axisMarketRateOfLand)).toFixed(2);
    }
    
    // Table values
    const floors = ['GF', 'FF', 'SF', 'TF', 'NA'];
    const totalBuaValues: Record<string, number> = {};
    let approvedBuaTotal = 0;
    let actualBuaTotal = 0;
    let approvedBuaValueTotal = 0;
    
    floors.forEach(f => {
      approvedBuaTotal += safeNum(fields[`axisCostBreakupApprovedBUA${f}`]);
      actualBuaTotal += safeNum(fields[`axisCostBreakupActualBUA${f}`]);
      
      const actual = safeNum(fields[`axisCostBreakupActualBUA${f}`]);
      const cost = safeNum(fields[`axisCostBreakupConstructionCost${f}`]);
      totalBuaValues[f] = actual * cost;
      
      if (!fields[`axisCostBreakupTotalBUAValue${f}_isManual`] && fields[`axisCostBreakupTotalBUAValue${f}`] !== 'NA') {
        fields[`axisCostBreakupTotalBUAValue${f}`] = (actual * cost).toFixed(2);
      }
      
      approvedBuaValueTotal += safeNum(fields[`axisCostBreakupApprovedBUA${f}`]) * cost;
    });

    if (!fields.axisCostBreakupApprovedBUATotal_isManual && fields.axisCostBreakupApprovedBUATotal !== 'NA') {
      fields.axisCostBreakupApprovedBUATotal = approvedBuaTotal.toFixed(2);
    }
    if (!fields.axisCostBreakupActualBUATotal_isManual && fields.axisCostBreakupActualBUATotal !== 'NA') {
      fields.axisCostBreakupActualBUATotal = actualBuaTotal.toFixed(2);
    }
    
    const totalBuaValueSum = Object.values(totalBuaValues).reduce((sum, v) => sum + v, 0);
    if (!fields.axisCostBreakupTotalBUAValueTotal_isManual && fields.axisCostBreakupTotalBUAValueTotal !== 'NA') {
      fields.axisCostBreakupTotalBUAValueTotal = totalBuaValueSum.toFixed(2);
    }

    if (!fields.axisValueOfApprovedBUA_isManual && fields.axisValueOfApprovedBUA !== 'NA') {
      fields.axisValueOfApprovedBUA = approvedBuaValueTotal.toFixed(2);
    }
    
    const finalLandVal = safeNum(fields.axisValueOfTheLand);
    const finalConstrVal = safeNum(fields.axisCostBreakupTotalBUAValueTotal);
    if (!fields.axisMarketValueOfTheUnitLandAndConstruction_isManual && fields.axisMarketValueOfTheUnitLandAndConstruction !== 'NA') {
      fields.axisMarketValueOfTheUnitLandAndConstruction = (finalLandVal + finalConstrVal).toFixed(2);
    }
    
    // Section 8 calculated fields
    const finalRecommendedConstRate = safeNum(fields.axisRecommendedConstructionRate);
    if (!fields.axisRecommendedCostOfConstruction_isManual && fields.axisRecommendedCostOfConstruction !== 'NA') {
      fields.axisRecommendedCostOfConstruction = (approvedBuaTotal * finalRecommendedConstRate).toFixed(2);
    }
    const finalRecommendedConstCost = safeNum(fields.axisRecommendedCostOfConstruction);
    if (!fields.axisTotalValueOfPropertyAfterCompletion_isManual && fields.axisTotalValueOfPropertyAfterCompletion !== 'NA') {
      fields.axisTotalValueOfPropertyAfterCompletion = (finalLandVal + finalRecommendedConstCost).toFixed(2);
    }
    
    // Section 9 calculated fields
    if (!fields.axisValueOfTheLandGovt_isManual && fields.axisValueOfTheLandGovt !== 'NA') {
      fields.axisValueOfTheLandGovt = (safeNum(fields.axisAreaOfLandGovt) * safeNum(fields.axisGovernmentRate)).toFixed(2);
    }
    const finalGovtLandVal = safeNum(fields.axisValueOfTheLandGovt);
    if (!fields.axisGovtValueOfTheUnit_isManual && fields.axisGovtValueOfTheUnit !== 'NA') {
      fields.axisGovtValueOfTheUnit = (finalGovtLandVal + finalConstrVal).toFixed(2);
    }
    if (!fields.axisDistressValueOfTheProperty_isManual && fields.axisDistressValueOfTheProperty !== 'NA') {
      const marketVal = safeNum(fields.axisMarketValueOfTheUnitLandAndConstruction);
      fields.axisDistressValueOfTheProperty = (marketVal * 0.85).toFixed(2);
    }
        }
        if (!computedDistrict) {
          const parts = address.split(',').map((p: string) => p.trim());
          const stateIdx = parts.findIndex((p: string) => computedState && p.toLowerCase().includes(computedState.toLowerCase()));
          if (stateIdx > 0) computedCity = parts[stateIdx - 1];
          else if (parts.length >= 3) computedCity = parts[parts.length - 3];
        }
      }
      fields = {
        ...fields,
        propertyDetailsAxis: fields.axisAddressOfTheProperty || '',
        propertyAddressAxis: fields.axisAddressOfTheProperty || '',
        city: computedCity,
        district: computedDistrict,
        state: computedState,
        pinCode: computedPinCode
      };
    }
    return new PDFAxisFinanceRenderer(fields);
  }
};

export default function AxisFinance(props: BankReportBuilderProps) {
  return <BankReportBuilder config={AXIS_FINANCE_CONFIG} {...props} />;
}

