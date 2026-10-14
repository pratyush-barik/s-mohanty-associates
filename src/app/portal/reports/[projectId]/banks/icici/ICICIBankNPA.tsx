'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Plus, Trash2 } from 'lucide-react';
import { PDFIciciBankNpaRenderer } from '@/lib/banks/pdf-icici-bank-npa-renderer';

// ─── PrefillField component (same pattern as ICICIBankHLLAPBBG) ─────────────
const PrefillField = ({ label, value, onChange, tooltip, isReadOnly, type = 'text', fallbackValue, options, customInputProps, hideEditToggle = false, rows = 3 }: any) => {
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
      <div className="flex-1 flex items-center pr-4">{label}</div>
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
          (() => {
            const optionValues = options?.map((opt: any) => opt.value) || [];
            const isKnownOption = optionValues.includes(displayValue);
            if (!isEdit && !isKnownOption && displayValue) {
              return <input type="text" className={`${inputCls} pr-8 bg-gray-100 cursor-not-allowed text-gray-700`} value={displayValue} disabled />;
            }
            return (
              <>
                <select
                   className={`${inputCls} pr-8 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
                   value={displayValue}
                   onChange={e => onChange(e.target.value)}
                   disabled={isReadOnly || !isEdit}
                >
                  {options?.map((opt: any, i: number) => <option key={i} value={opt.value}>{opt.label}</option>)}
                </select>
                {displayValue === 'Custom' && customInputProps && (
                  <input
                    type="text"
                    className={`${inputCls} mt-2 ${!isEdit ? 'bg-gray-100 cursor-not-allowed text-gray-700' : 'bg-white'}`}
                    value={customInputProps.value || ''}
                    onChange={e => customInputProps.onChange(e.target.value)}
                    disabled={isReadOnly || !isEdit}
                  />
                )}
              </>
            );
          })()
        ) : type === 'radio' ? (
          <div className="flex gap-4 items-center h-full pt-2 pl-2">
            {options?.map((opt: string) => (
              <label key={opt} className={`flex items-center gap-2 text-sm font-medium ${!isEdit ? 'cursor-not-allowed text-gray-500' : 'cursor-pointer text-gray-700'}`}>
                <input type="radio" value={opt} checked={displayValue === opt} onChange={e => onChange(e.target.value)} disabled={isReadOnly || !isEdit} className="text-indigo-600 focus:ring-indigo-500 h-4 w-4 disabled:opacity-50" />
                {opt}
              </label>
            ))}
          </div>
        ) : (
          <input
            type={type === 'number' ? 'number' : 'text'}
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

// ─── Bank Config ─────────────────────────────────────────────────────────────
export const ICICI_BANK_NPA_CONFIG: BankConfig = {
  bankId: 'ICICI BANK',
  subTemplateId: 'NPA',
  displayName: 'ICICI Bank — NPA',
  id: 'icici-npa',
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10', 'section-15', 'annexures'],
  navSections: [
    { id: 'icicinpa-section-1', title: 'VALUATION OF IMMOVABLE PROPERTY' },
    { id: 'icicinpa-section-2', title: 'INDIVIDUAL TECHNICAL REPORT' },
    { id: 'icicinpa-section-3', title: 'PROPERTY DETAILS' },
    { id: 'icicinpa-section-4', title: 'CONTACT DETAILS' },
    { id: 'icicinpa-section-5', title: 'ATTACHED DOCUMENT DETAILS' },
    { id: 'icicinpa-section-6', title: 'BOUNDARIES ON SITE' },
    { id: 'icicinpa-section-7', title: 'PROPERTY DETAILS (TECHNICAL SPECIFICATIONS)' },
  ],
  getPDFRenderer: (fields: any, projectCode?: string) => new PDFIciciBankNpaRenderer({ ...fields, projectCode }),
  extraSectionsStart: [
    // ── SECTION 1: VALUATION OF IMMOVABLE PROPERTY ──────────────────
    {
      id: 'icicinpa-section-1',
      title: 'VALUATION OF IMMOVABLE PROPERTY',
      number: 1,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#f5f5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Container: General Information */}
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-gray-300 pb-1">
              General Information
            </h4>

            {/* PROPERTY OWNER — prefill from Customer Name (Section 2) */}
            <PrefillField
              label="PROPERTY OWNER"
              type="text"
              value={fields.icicinpaPropOwner}
              onChange={(val: string) => handleChange('icicinpaPropOwner', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Customer Name (Section 2)'
              fallbackValue={fields.icicinpaCustomerName}
            />

            {/* ADDRESS OF THE PROPERTY — prefill from Property Address (Section 3) */}
            <PrefillField
              label="ADDRESS OF THE PROPERTY"
              type="textarea"
              rows={3}
              value={fields.icicinpaPropAddress}
              onChange={(val: string) => handleChange('icicinpaPropAddress', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Property Address (Section 3)'
              fallbackValue={fields.icicinpaPropertyAddress}
            />

            {/* PRESENT MARKET VALUE — prefill from Round Off Total (Section 9) */}
            <PrefillField
              label="PRESENT MARKET VALUE"
              type="number"
              value={fields.icicinpaPresentMarketValue}
              onChange={(val: string) => handleChange('icicinpaPresentMarketValue', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Round Off Total (Section 9)'
              fallbackValue={fields.icicinpaRoundOffTotal}
            />

            {/* DISTRESS SALE VALUE — prefill from Distress Value (Section 7) */}
            <PrefillField
              label="DISTRESS SALE VALUE"
              type="number"
              value={fields.icicinpaDistressSaleValue}
              onChange={(val: string) => handleChange('icicinpaDistressSaleValue', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Distress Value (Section 7)'
              fallbackValue={fields.icicinpaDistressValue}
            />

            {/* REALIZABLE VALUE — prefill from Realize Value (Section 7) */}
            <PrefillField
              label="REALIZABLE VALUE"
              type="number"
              value={fields.icicinpaRealizableValue}
              onChange={(val: string) => handleChange('icicinpaRealizableValue', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Realize Value (Section 7)'
              fallbackValue={fields.icicinpaRealizeValue}
            />

            {/* PURPOSE OF VALUATION — Dropdown */}
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.icicinpaPurposeOfValuation || ''}
                onChange={e => handleChange('icicinpaPurposeOfValuation', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Purpose...</option>
                <option value="TO ASSESS THE PRESENT MARKET VALUE FOR NPA PURPOSES">
                  TO ASSESS THE PRESENT MARKET VALUE FOR NPA PURPOSES
                </option>
                <option value="TO ASSESS THE PRESENT MARKET VALUE FOR LOAN PURPOSES">
                  TO ASSESS THE PRESENT MARKET VALUE FOR LOAN PURPOSES
                </option>
                <option value="TO ASSESS THE PRESENT MARKET VALUE FOR MORTGAGE PURPOSES">
                  TO ASSESS THE PRESENT MARKET VALUE FOR MORTGAGE PURPOSES
                </option>
                <option value="TO ASSESS THE PRESENT MARKET VALUE FOR AUCTION PURPOSES">
                  TO ASSESS THE PRESENT MARKET VALUE FOR AUCTION PURPOSES
                </option>
                <option value="Custom">Custom / Other</option>
              </select>
              {fields.icicinpaPurposeOfValuation === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom purpose..."
                  className={`${inputCls} mt-2`}
                  value={fields.icicinpaPurposeOfValuationCustom || ''}
                  onChange={e => handleChange('icicinpaPurposeOfValuationCustom', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </Field>

            {/* PREPARED BY — prefill from logged-in valuer profile */}
            <PrefillField
              label="PREPARED BY"
              type="text"
              value={fields.icicinpaPreparedBy}
              onChange={(val: string) => handleChange('icicinpaPreparedBy', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from logged-in valuer profile'
              fallbackValue={fields.valuerName}
            />
          </div>
        );
      }
    },
    // ── SECTION 2: INDIVIDUAL TECHNICAL REPORT ─────────────────────
    {
      id: 'icicinpa-section-2',
      title: 'INDIVIDUAL TECHNICAL REPORT',
      number: 2,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#e3f2fd', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Container: Request Details */}
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-blue-200 pb-1">
              Request Details
            </h4>

            {/* Request ID */}
            <Field label="Request ID">
              <input
                type="text"
                className={inputCls}
                value={fields.icicinpaRequestId || ''}
                onChange={e => handleChange('icicinpaRequestId', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Customer Name */}
            <Field label="Customer Name">
              <input
                type="text"
                className={inputCls}
                value={fields.icicinpaCustomerName || ''}
                onChange={e => handleChange('icicinpaCustomerName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Channel Name — Dropdown */}
            <Field label="Channel Name">
              <select
                className={inputCls}
                value={fields.icicinpaChannelName || ''}
                onChange={e => handleChange('icicinpaChannelName', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Channel...</option>
                <option value="DSMG">DSMG</option>
                <option value="DSA">DSA</option>
                <option value="BRANCH">BRANCH</option>
                <option value="DIGITAL">DIGITAL</option>
                <option value="DIRECT">DIRECT</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {fields.icicinpaChannelName === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom channel name..."
                  className={`${inputCls} mt-2`}
                  value={fields.icicinpaChannelNameCustom || ''}
                  onChange={e => handleChange('icicinpaChannelNameCustom', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </Field>

            {/* Report Type — Dropdown */}
            <Field label="Report Type">
              <select
                className={inputCls}
                value={fields.icicinpaReportType || ''}
                onChange={e => handleChange('icicinpaReportType', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Report Type...</option>
                <option value="Valuation Report">Valuation Report</option>
                <option value="Technical Report">Technical Report</option>
                <option value="NPA Valuation Report">NPA Valuation Report</option>
                <option value="Desktop Valuation">Desktop Valuation</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {fields.icicinpaReportType === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom report type..."
                  className={`${inputCls} mt-2`}
                  value={fields.icicinpaReportTypeCustom || ''}
                  onChange={e => handleChange('icicinpaReportTypeCustom', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </Field>

            {/* Product Type — Dropdown */}
            <Field label="Product Type">
              <select
                className={inputCls}
                value={fields.icicinpaProductType || ''}
                onChange={e => handleChange('icicinpaProductType', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Product Type...</option>
                <option value="HL">HL</option>
                <option value="LAP">LAP</option>
                <option value="BL">BL</option>
                <option value="CV">CV</option>
                <option value="NPA">NPA</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {fields.icicinpaProductType === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom product type..."
                  className={`${inputCls} mt-2`}
                  value={fields.icicinpaProductTypeCustom || ''}
                  onChange={e => handleChange('icicinpaProductTypeCustom', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </Field>

            {/* Application No */}
            <Field label="Application No">
              <input
                type="text"
                className={inputCls}
                value={fields.icicinpaApplicationNo || ''}
                onChange={e => handleChange('icicinpaApplicationNo', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Business Group — Dropdown */}
            <Field label="Business Group">
              <select
                className={inputCls}
                value={fields.icicinpaBusinessGroup || ''}
                onChange={e => handleChange('icicinpaBusinessGroup', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Business Group...</option>
                <option value="DSMG">DSMG</option>
                <option value="RETAIL">RETAIL</option>
                <option value="SME">SME</option>
                <option value="CORPORATE">CORPORATE</option>
                <option value="NPA">NPA</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {fields.icicinpaBusinessGroup === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom business group..."
                  className={`${inputCls} mt-2`}
                  value={fields.icicinpaBusinessGroupCustom || ''}
                  onChange={e => handleChange('icicinpaBusinessGroupCustom', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </Field>

            {/* Product Name — Dropdown */}
            <Field label="Product Name">
              <select
                className={inputCls}
                value={fields.icicinpaProductName || ''}
                onChange={e => handleChange('icicinpaProductName', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Product Name...</option>
                <option value="HL">HL</option>
                <option value="Home Loan">Home Loan</option>
                <option value="LAP">LAP</option>
                <option value="Loan Against Property">Loan Against Property</option>
                <option value="Business Loan">Business Loan</option>
                <option value="NPA Recovery">NPA Recovery</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {fields.icicinpaProductName === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom product name..."
                  className={`${inputCls} mt-2`}
                  value={fields.icicinpaProductNameCustom || ''}
                  onChange={e => handleChange('icicinpaProductNameCustom', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </Field>
          </div>
        );
      }
    },
    // ── SECTION 3: PROPERTY DETAILS ─────────────────────────────
    {
      id: 'icicinpa-section-3',
      title: 'PROPERTY DETAILS',
      number: 3,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#e8f5e9', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Container: Project & Address Info */}
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-green-200 pb-1">
              Project & Address Info
            </h4>

            {/* Project Name */}
            <Field label="Project Name">
              <input
                type="text"
                className={inputCls}
                value={fields.icicinpaProjectName || ''}
                onChange={e => handleChange('icicinpaProjectName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Building Name */}
            <Field label="Building Name">
              <input
                type="text"
                className={inputCls}
                value={fields.icicinpaBuildingName || ''}
                onChange={e => handleChange('icicinpaBuildingName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Images — Enclosed / Not Enclosed */}
            <Field label="Images">
              <div className="flex gap-6">
                {['Enclosed', 'Not Enclosed'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={fields.icicinpaImagesEnclosed === opt}
                      onChange={() => handleChange('icicinpaImagesEnclosed', fields.icicinpaImagesEnclosed === opt ? '' : opt)}
                      disabled={isReadOnly}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>

            {/* Property Type — Dropdown */}
            <Field label="Property Type">
              <select
                className={inputCls}
                value={fields.icicinpaPropertyType || ''}
                onChange={e => handleChange('icicinpaPropertyType', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Property Type...</option>
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Mixed">Mixed</option>
                <option value="Industrial">Industrial</option>
                <option value="Open Land">Open Land</option>
              </select>
            </Field>

            {/* Unit Type — Dropdown */}
            <Field label="Unit Type">
              <select
                className={inputCls}
                value={fields.icicinpaUnitType || ''}
                onChange={e => handleChange('icicinpaUnitType', e.target.value)}
                disabled={isReadOnly}
              >
                <option value="">Select Unit Type...</option>
                <option value="Flat">Flat</option>
                <option value="House">House</option>
                <option value="Villa">Villa</option>
                <option value="Plot">Plot</option>
                <option value="Shop">Shop</option>
                <option value="Office">Office</option>
                <option value="Warehouse">Warehouse</option>
                <option value="Custom">Custom / Other</option>
              </select>
              {fields.icicinpaUnitType === 'Custom' && (
                <input
                  type="text"
                  placeholder="Enter custom unit type..."
                  className={`${inputCls} mt-2`}
                  value={fields.icicinpaUnitTypeCustom || ''}
                  onChange={e => handleChange('icicinpaUnitTypeCustom', e.target.value)}
                  disabled={isReadOnly}
                />
              )}
            </Field>

            {/* Unit No */}
            <Field label="Unit No">
              <input
                type="text"
                className={inputCls}
                value={fields.icicinpaUnitNo || ''}
                onChange={e => handleChange('icicinpaUnitNo', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Images — Attached / Not Attached */}
            <Field label="Images (Documents)">
              <div className="flex gap-6">
                {['Attached', 'Not Attached'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={fields.icicinpaDocsAttached === opt}
                      onChange={() => handleChange('icicinpaDocsAttached', fields.icicinpaDocsAttached === opt ? '' : opt)}
                      disabled={isReadOnly}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </Field>

            {/* Property Address */}
            <Field label="Property Address">
              <textarea
                className={`${inputCls} resize-y`}
                rows={3}
                value={fields.icicinpaPropertyAddress || ''}
                onChange={e => handleChange('icicinpaPropertyAddress', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Country — Dropdown (default: India) */}
              <Field label="Country">
                <select
                  className={inputCls}
                  value={fields.icicinpaCountry || 'India'}
                  onChange={e => handleChange('icicinpaCountry', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="India">India</option>
                  <option value="Other">Other</option>
                </select>
              </Field>

              {/* State — Dropdown */}
              <Field label="State">
                <select
                  className={inputCls}
                  value={fields.icicinpaState || ''}
                  onChange={e => handleChange('icicinpaState', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select State...</option>
                  <option value="Odisha">Odisha</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Custom">Other / Custom</option>
                </select>
                {fields.icicinpaState === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter state name..."
                    className={`${inputCls} mt-2`}
                    value={fields.icicinpaStateCustom || ''}
                    onChange={e => handleChange('icicinpaStateCustom', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Field>

              {/* City — Dropdown */}
              <Field label="City">
                <select
                  className={inputCls}
                  value={fields.icicinpaCity || ''}
                  onChange={e => handleChange('icicinpaCity', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select City...</option>
                  <option value="Bhubaneswar">Bhubaneswar</option>
                  <option value="Cuttack">Cuttack</option>
                  <option value="Nayagarh">Nayagarh</option>
                  <option value="Puri">Puri</option>
                  <option value="Berhampur">Berhampur</option>
                  <option value="Rourkela">Rourkela</option>
                  <option value="Sambalpur">Sambalpur</option>
                  <option value="Balasore">Balasore</option>
                  <option value="Baripada">Baripada</option>
                  <option value="Jeypore">Jeypore</option>
                  <option value="Custom">Other / Custom</option>
                </select>
                {fields.icicinpaCity === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter city name..."
                    className={`${inputCls} mt-2`}
                    value={fields.icicinpaCityCustom || ''}
                    onChange={e => handleChange('icicinpaCityCustom', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Field>

              {/* Pincode */}
              <Field label="Pincode">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.icicinpaPincode || ''}
                  onChange={e => handleChange('icicinpaPincode', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Nearby Landmark */}
            <Field label="Nearby Landmark">
              <input
                type="text"
                className={inputCls}
                value={fields.icicinpaNearbyLandmark || ''}
                onChange={e => handleChange('icicinpaNearbyLandmark', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Legal Address same as Property Address — checkbox */}
            <Field label="">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  checked={!!fields.icicinpaLegalAddressSame}
                  onChange={e => handleChange('icicinpaLegalAddressSame', e.target.checked)}
                  disabled={isReadOnly}
                />
                Legal Address is same as Property Address
              </label>
            </Field>

            {/* Legal Address — prefill if checkbox is checked */}
            <PrefillField
              label="Legal Address"
              type="textarea"
              rows={3}
              value={fields.icicinpaLegalAddress}
              onChange={(val: string) => handleChange('icicinpaLegalAddress', val)}
              isReadOnly={isReadOnly}
              tooltip={fields.icicinpaLegalAddressSame ? 'Prefill from Property Address' : ''}
              fallbackValue={fields.icicinpaLegalAddressSame ? fields.icicinpaPropertyAddress : undefined}
            />
          </div>
        );
      }
    },
    // ── SECTION 4: CONTACT DETAILS ──────────────────────────────
    {
      id: 'icicinpa-section-4',
      title: 'CONTACT DETAILS',
      number: 4,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        return (
          <div style={{ backgroundColor: '#fffde7', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Container: Contact Information */}
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-yellow-200 pb-1">
              Contact Information
            </h4>

            {/* Name — prefill from Customer Name (Section 2) */}
            <PrefillField
              label="Name"
              type="text"
              value={fields.icicinpaContactName}
              onChange={(val: string) => handleChange('icicinpaContactName', val)}
              isReadOnly={isReadOnly}
              tooltip='Prefill from Customer Name (Section 2)'
              fallbackValue={fields.icicinpaCustomerName}
            />

            {/* Mobile 1/Landline1 */}
            <Field label="Mobile 1/Landline1">
              <input
                type="number"
                className={inputCls}
                value={fields.icicinpaMobile1 || ''}
                onChange={e => handleChange('icicinpaMobile1', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Req Initiator Id */}
            <Field label="Req Initiator Id">
              <input
                type="text"
                className={inputCls}
                value={fields.icicinpaReqInitiatorId || ''}
                onChange={e => handleChange('icicinpaReqInitiatorId', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>

            {/* Req Initiator Name */}
            <Field label="Req Initiator Name">
              <input
                type="text"
                className={inputCls}
                value={fields.icicinpaReqInitiatorName || ''}
                onChange={e => handleChange('icicinpaReqInitiatorName', e.target.value)}
                disabled={isReadOnly}
              />
            </Field>
          </div>
        );
      }
    },
    // ── SECTION 5: ATTACHED DOCUMENT DETAILS ────────────────────
    {
      id: 'icicinpa-section-5',
      title: 'ATTACHED DOCUMENT DETAILS',
      number: 5,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const docs = Array.isArray(fields.icicinpaAttachedDocs) && fields.icicinpaAttachedDocs.length > 0
          ? fields.icicinpaAttachedDocs
          : [{ docName: '', docNameCustom: '', fieldName: '', fieldValue: '' }];

        const updateDocs = (newDocs: any[]) => handleChange('icicinpaAttachedDocs', newDocs);

        const addRow = () => {
          updateDocs([...docs, { docName: '', docNameCustom: '', fieldName: '', fieldValue: '' }]);
        };

        const removeRow = (idx: number) => {
          const next = docs.filter((_: any, i: number) => i !== idx);
          updateDocs(next.length > 0 ? next : [{ docName: '', docNameCustom: '', fieldName: '', fieldValue: '' }]);
        };

        const updateRow = (idx: number, patch: any) => {
          const next = docs.map((d: any, i: number) => i === idx ? { ...d, ...patch } : d);
          updateDocs(next);
        };

        return (
          <div style={{ backgroundColor: '#f3e5f5', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Table/Container: Documents (Dynamic Rows) */}
            <div className="flex justify-between items-center border-b border-purple-200 pb-2">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                Documents (Dynamic Rows)
              </h4>
              <button
                type="button"
                onClick={addRow}
                disabled={isReadOnly}
                className="inline-flex items-center gap-1 bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold px-3 py-1.5 rounded shadow-sm transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" /> Add Row
              </button>
            </div>

            <div className="space-y-3">
              {docs.map((doc: any, idx: number) => (
                <div key={idx} className="bg-white/80 border border-purple-100 rounded-lg p-3 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-end">
                  {/* Document Name */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Document Name
                    </label>
                    <select
                      className={inputCls}
                      value={doc.docName || ''}
                      onChange={e => updateRow(idx, { docName: e.target.value })}
                      disabled={isReadOnly}
                    >
                      <option value="">Select Document...</option>
                      <option value="Copy of Sale Deed">Copy of Sale Deed</option>
                      <option value="Copy of Title Deed">Copy of Title Deed</option>
                      <option value="Copy of Patta / RoR">Copy of Patta / RoR</option>
                      <option value="Copy of Mutation">Copy of Mutation</option>
                      <option value="Copy of Approved Building Plan">Copy of Approved Building Plan</option>
                      <option value="Copy of Possession Certificate">Copy of Possession Certificate</option>
                      <option value="Copy of Tax Receipt">Copy of Tax Receipt</option>
                      <option value="Copy of Electricity Bill">Copy of Electricity Bill</option>
                      <option value="Copy of Encumbrance Certificate">Copy of Encumbrance Certificate</option>
                      <option value="Copy of Agreement to Sell">Copy of Agreement to Sell</option>
                      <option value="Copy of Conversion Order">Copy of Conversion Order</option>
                      <option value="Custom">Custom / Other</option>
                    </select>
                    {doc.docName === 'Custom' && (
                      <input
                        type="text"
                        placeholder="Enter custom document name..."
                        className={`${inputCls} mt-2`}
                        value={doc.docNameCustom || ''}
                        onChange={e => updateRow(idx, { docNameCustom: e.target.value })}
                        disabled={isReadOnly}
                      />
                    )}
                  </div>

                  {/* Field Name */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Field Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Deed No / Date / Khata"
                      className={inputCls}
                      value={doc.fieldName || ''}
                      onChange={e => updateRow(idx, { fieldName: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Field Value */}
                  <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                      Field Value
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 1234/2021"
                      className={inputCls}
                      value={doc.fieldValue || ''}
                      onChange={e => updateRow(idx, { fieldValue: e.target.value })}
                      disabled={isReadOnly}
                    />
                  </div>

                  {/* Remove button */}
                  {docs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      disabled={isReadOnly}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition self-end md:self-auto"
                      title="Remove row"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      }
    },
    // ── SECTION 6: BOUNDARIES ON SITE ───────────────────────────
    {
      id: 'icicinpa-section-6',
      title: 'BOUNDARIES ON SITE',
      number: 6,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const northMatch = (fields.icicinpaNorthDeed || '').trim().toLowerCase() === (fields.icicinpaNorthActual || '').trim().toLowerCase() && !!(fields.icicinpaNorthDeed || '').trim();
        const southMatch = (fields.icicinpaSouthDeed || '').trim().toLowerCase() === (fields.icicinpaSouthActual || '').trim().toLowerCase() && !!(fields.icicinpaSouthDeed || '').trim();
        const eastMatch = (fields.icicinpaEastDeed || '').trim().toLowerCase() === (fields.icicinpaEastActual || '').trim().toLowerCase() && !!(fields.icicinpaEastDeed || '').trim();
        const westMatch = (fields.icicinpaWestDeed || '').trim().toLowerCase() === (fields.icicinpaWestActual || '').trim().toLowerCase() && !!(fields.icicinpaWestDeed || '').trim();

        const isAllMatching = northMatch && southMatch && eastMatch && westMatch;
        const autoMatching = isAllMatching ? 'Yes' : ((fields.icicinpaNorthDeed || fields.icicinpaSouthDeed || fields.icicinpaEastDeed || fields.icicinpaWestDeed) ? 'No' : 'NA');

        const directions = [
          { dir: 'North', deedKey: 'icicinpaNorthDeed', actualKey: 'icicinpaNorthActual' },
          { dir: 'South', deedKey: 'icicinpaSouthDeed', actualKey: 'icicinpaSouthActual' },
          { dir: 'East', deedKey: 'icicinpaEastDeed', actualKey: 'icicinpaEastActual' },
          { dir: 'West', deedKey: 'icicinpaWestDeed', actualKey: 'icicinpaWestActual' },
        ];

        return (
          <div style={{ backgroundColor: '#e0f7fa', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Table/Container: Site Directions & Verification */}
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-cyan-200 pb-1">
              Site Directions & Verification
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse bg-white/80 rounded-md overflow-hidden border border-cyan-200">
                <thead>
                  <tr className="bg-cyan-100/70 text-gray-700 text-xs uppercase">
                    <th className="py-2.5 px-4 text-left font-semibold border-b border-cyan-200 w-1/4">Direction</th>
                    <th className="py-2.5 px-4 text-left font-semibold border-b border-cyan-200 w-3/8">As Per Sale Deed</th>
                    <th className="py-2.5 px-4 text-left font-semibold border-b border-cyan-200 w-3/8">Actual at Site</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-100">
                  {directions.map(({ dir, deedKey, actualKey }) => (
                    <tr key={dir} className="hover:bg-cyan-50/50">
                      <td className="py-2.5 px-4 font-semibold text-gray-700">{dir}</td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          placeholder={`${dir} (As Per Deed)`}
                          className={inputCls}
                          value={fields[deedKey] || ''}
                          onChange={e => handleChange(deedKey, e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          placeholder={`${dir} (Actual at Site)`}
                          className={inputCls}
                          value={fields[actualKey] || ''}
                          onChange={e => handleChange(actualKey, e.target.value)}
                          disabled={isReadOnly}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Boundary Matching */}
            <div className="pt-2">
              <PrefillField
                label="Boundary Matching"
                type="radio"
                options={['Yes', 'No', 'NA']}
                value={fields.icicinpaBoundaryMatching}
                onChange={(val: string) => handleChange('icicinpaBoundaryMatching', val)}
                isReadOnly={isReadOnly}
                tooltip="Auto-calculates to 'Yes' if Deed and Site strings match"
                fallbackValue={autoMatching}
              />
            </div>
          </div>
        );
      }
    },
    // ── SECTION 7: PROPERTY DETAILS ─────────────────────────────
    {
      id: 'icicinpa-section-7',
      title: 'PROPERTY DETAILS',
      number: 7,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const marketVal = Number(fields.icicinpaRoundOffTotal || fields.icicinpaPresentMarketValue || 0);
        const distressPct = fields.icicinpaDistressPct !== undefined && fields.icicinpaDistressPct !== '' ? Number(fields.icicinpaDistressPct) : 80;
        const realizePct = fields.icicinpaRealizePct !== undefined && fields.icicinpaRealizePct !== '' ? Number(fields.icicinpaRealizePct) : 85;

        const autoDistressValue = marketVal > 0 ? String(Math.round(marketVal * (distressPct / 100))) : '';
        const autoRealizeValue = marketVal > 0 ? String(Math.round(marketVal * (realizePct / 100))) : '';

        return (
          <div style={{ backgroundColor: '#fff3e0', padding: '16px', borderRadius: '8px' }} className="space-y-4">
            {/* Container: Technical Specifications */}
            <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-orange-200 pb-1">
              Technical Specifications
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plot Area */}
              <Field label="Plot Area">
                <div className="relative">
                  <input
                    type="number"
                    className={`${inputCls} pr-14`}
                    value={fields.icicinpaPlotArea || ''}
                    onChange={e => handleChange('icicinpaPlotArea', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 1500"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-gray-500 pointer-events-none">
                    sqft
                  </span>
                </div>
              </Field>

              {/* Plot Demarcated At Site */}
              <Field label="Plot Demarcated At Site">
                <div className="flex gap-6 items-center h-10">
                  {['Yes', 'No'].map(opt => (
                    <label key={opt} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                      <input
                        type="radio"
                        value={opt}
                        checked={fields.icicinpaPlotDemarcated === opt}
                        onChange={e => handleChange('icicinpaPlotDemarcated', e.target.value)}
                        disabled={isReadOnly}
                        className="text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              </Field>

              {/* Approved Land Use */}
              <Field label="Approved Land Use">
                <select
                  className={inputCls}
                  value={fields.icicinpaApprovedLandUse || ''}
                  onChange={e => handleChange('icicinpaApprovedLandUse', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Land Use...</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed (Residential + Commercial)">Mixed (Residential + Commercial)</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Institutional">Institutional</option>
                  <option value="Custom">Custom / Other</option>
                </select>
                {fields.icicinpaApprovedLandUse === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom land use..."
                    className={`${inputCls} mt-2`}
                    value={fields.icicinpaApprovedLandUseCustom || ''}
                    onChange={e => handleChange('icicinpaApprovedLandUseCustom', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Field>

              {/* Infrastructure of the Surrounding Area */}
              <Field label="Infrastructure of the Surrounding Area">
                <select
                  className={inputCls}
                  value={fields.icicinpaInfrastructureSurrounding || ''}
                  onChange={e => handleChange('icicinpaInfrastructureSurrounding', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Infrastructure...</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Developing">Developing</option>
                  <option value="Poor">Poor</option>
                  <option value="Fully Developed">Fully Developed</option>
                  <option value="Custom">Custom / Other</option>
                </select>
                {fields.icicinpaInfrastructureSurrounding === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom infrastructure..."
                    className={`${inputCls} mt-2`}
                    value={fields.icicinpaInfrastructureSurroundingCustom || ''}
                    onChange={e => handleChange('icicinpaInfrastructureSurroundingCustom', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Field>

              {/* Nature of Locality */}
              <Field label="Nature of Locality">
                <select
                  className={inputCls}
                  value={fields.icicinpaNatureOfLocality || ''}
                  onChange={e => handleChange('icicinpaNatureOfLocality', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Nature...</option>
                  <option value="Residential">Residential</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Semi-Urban">Semi-Urban</option>
                  <option value="Rural">Rural</option>
                  <option value="Custom">Custom / Other</option>
                </select>
                {fields.icicinpaNatureOfLocality === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom nature..."
                    className={`${inputCls} mt-2`}
                    value={fields.icicinpaNatureOfLocalityCustom || ''}
                    onChange={e => handleChange('icicinpaNatureOfLocalityCustom', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Field>

              {/* Class of Locality */}
              <Field label="Class of Locality">
                <select
                  className={inputCls}
                  value={fields.icicinpaClassOfLocality || ''}
                  onChange={e => handleChange('icicinpaClassOfLocality', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Class...</option>
                  <option value="High Class / Premium">High Class / Premium</option>
                  <option value="Upper Middle Class">Upper Middle Class</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Lower Middle Class">Lower Middle Class</option>
                  <option value="Low Class">Low Class</option>
                  <option value="Custom">Custom / Other</option>
                </select>
                {fields.icicinpaClassOfLocality === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom class..."
                    className={`${inputCls} mt-2`}
                    value={fields.icicinpaClassOfLocalityCustom || ''}
                    onChange={e => handleChange('icicinpaClassOfLocalityCustom', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Field>

              {/* Property Location */}
              <Field label="Property Location">
                <select
                  className={inputCls}
                  value={fields.icicinpaPropertyLocation || ''}
                  onChange={e => handleChange('icicinpaPropertyLocation', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Location...</option>
                  <option value="Main Road">Main Road</option>
                  <option value="Interior Road">Interior Road</option>
                  <option value="Corner Plot">Corner Plot</option>
                  <option value="Gated Community / Complex">Gated Community / Complex</option>
                  <option value="City Center">City Center</option>
                  <option value="Suburban">Suburban</option>
                  <option value="Outskirts">Outskirts</option>
                  <option value="Custom">Custom / Other</option>
                </select>
                {fields.icicinpaPropertyLocation === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom location..."
                    className={`${inputCls} mt-2`}
                    value={fields.icicinpaPropertyLocationCustom || ''}
                    onChange={e => handleChange('icicinpaPropertyLocationCustom', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Field>

              {/* Distance From City Center(Km) */}
              <Field label="Distance From City Center(Km)">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.icicinpaDistanceFromCityCenter || ''}
                  onChange={e => handleChange('icicinpaDistanceFromCityCenter', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="e.g. 5 Km"
                />
              </Field>

              {/* Type of Property */}
              <Field label="Type of Property">
                <select
                  className={inputCls}
                  value={fields.icicinpaTypeOfProperty || ''}
                  onChange={e => handleChange('icicinpaTypeOfProperty', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Type...</option>
                  <option value="Independent House / Villa">Independent House / Villa</option>
                  <option value="Residential Flat / Apartment">Residential Flat / Apartment</option>
                  <option value="Commercial Building / Shop / Office">Commercial Building / Shop / Office</option>
                  <option value="Vacant Land / Plot">Vacant Land / Plot</option>
                  <option value="Industrial Shed / Warehouse">Industrial Shed / Warehouse</option>
                  <option value="Mixed Use Building">Mixed Use Building</option>
                  <option value="Custom">Custom / Other</option>
                </select>
                {fields.icicinpaTypeOfProperty === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom property type..."
                    className={`${inputCls} mt-2`}
                    value={fields.icicinpaTypeOfPropertyCustom || ''}
                    onChange={e => handleChange('icicinpaTypeOfPropertyCustom', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Field>

              {/* No. of Floors */}
              <Field label="No. of Floors">
                <select
                  className={inputCls}
                  value={fields.icicinpaNoOfFloors || ''}
                  onChange={e => handleChange('icicinpaNoOfFloors', e.target.value)}
                  disabled={isReadOnly}
                >
                  <option value="">Select Floors...</option>
                  <option value="Ground Floor (G)">Ground Floor (G)</option>
                  <option value="G+1">G+1</option>
                  <option value="G+2">G+2</option>
                  <option value="G+3">G+3</option>
                  <option value="G+4">G+4</option>
                  <option value="Basement + G+1">Basement + G+1</option>
                  <option value="Stilt + 4 Floors">Stilt + 4 Floors</option>
                  <option value="Multi-Storeyed">Multi-Storeyed</option>
                  <option value="Custom">Custom / Other</option>
                </select>
                {fields.icicinpaNoOfFloors === 'Custom' && (
                  <input
                    type="text"
                    placeholder="Enter custom floors..."
                    className={`${inputCls} mt-2`}
                    value={fields.icicinpaNoOfFloorsCustom || ''}
                    onChange={e => handleChange('icicinpaNoOfFloorsCustom', e.target.value)}
                    disabled={isReadOnly}
                  />
                )}
              </Field>

              {/* Cost of Construction */}
              <Field label="Cost of Construction">
                <input
                  type="number"
                  className={inputCls}
                  value={fields.icicinpaCostOfConstruction || ''}
                  onChange={e => handleChange('icicinpaCostOfConstruction', e.target.value)}
                  disabled={isReadOnly}
                  placeholder="Rs."
                />
              </Field>

              {/* To Be Billed */}
              <Field label="To Be Billed">
                <input
                  type="text"
                  className={inputCls}
                  value={fields.icicinpaToBeBilled || ''}
                  onChange={e => handleChange('icicinpaToBeBilled', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>

              {/* Carpet Area (Measured) */}
              <Field label="Carpet Area (Measured)">
                <div className="relative">
                  <input
                    type="number"
                    className={`${inputCls} pr-14`}
                    value={fields.icicinpaCarpetAreaMeasured || ''}
                    onChange={e => handleChange('icicinpaCarpetAreaMeasured', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 1200"
                  />
                  <span className="absolute right-3 top-2.5 text-xs font-semibold text-gray-500 pointer-events-none">
                    sqft
                  </span>
                </div>
              </Field>
            </div>

            {/* Property Area(BUA)RCC G+1 */}
            <Field label="Property Area(BUA)RCC G+1">
              <textarea
                rows={3}
                className={`${inputCls} resize-y`}
                value={fields.icicinpaPropertyAreaBua || ''}
                onChange={e => handleChange('icicinpaPropertyAreaBua', e.target.value)}
                disabled={isReadOnly}
                placeholder="Enter built-up area details / breakdown..."
              />
            </Field>

            {/* Distress Value & Realize Value (Auto-calculates as % of Market Value) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-orange-200">
              <PrefillField
                label={
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Distress Value</span>
                    <span className="text-xs text-gray-500 font-normal">(@</span>
                    <input
                      type="number"
                      className="w-12 text-xs border border-gray-300 rounded px-1 py-0.5 text-center font-medium bg-white"
                      value={distressPct}
                      onChange={(e: any) => handleChange('icicinpaDistressPct', e.target.value)}
                      disabled={isReadOnly}
                      title="Distress Percentage"
                    />
                    <span className="text-xs text-gray-500 font-normal">% of Market Value)</span>
                  </div>
                }
                type="number"
                value={fields.icicinpaDistressValue}
                onChange={(val: string) => handleChange('icicinpaDistressValue', val)}
                isReadOnly={isReadOnly}
                tooltip="Prefill/Auto-calculates as % of Market Value"
                fallbackValue={autoDistressValue}
              />

              <PrefillField
                label={
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>Realize Value</span>
                    <span className="text-xs text-gray-500 font-normal">(@</span>
                    <input
                      type="number"
                      className="w-12 text-xs border border-gray-300 rounded px-1 py-0.5 text-center font-medium bg-white"
                      value={realizePct}
                      onChange={(e: any) => handleChange('icicinpaRealizePct', e.target.value)}
                      disabled={isReadOnly}
                      title="Realize Percentage"
                    />
                    <span className="text-xs text-gray-500 font-normal">% of Market Value)</span>
                  </div>
                }
                type="number"
                value={fields.icicinpaRealizeValue}
                onChange={(val: string) => handleChange('icicinpaRealizeValue', val)}
                isReadOnly={isReadOnly}
                tooltip="Prefill/Auto-calculates as % of Market Value"
                fallbackValue={autoRealizeValue}
              />
            </div>
          </div>
        );
      }
    },
    // Additional sections will be added here as prompts are provided
  ]
};

export default function ICICIBankNPA(props: BankReportBuilderProps) {
  return <BankReportBuilder config={ICICI_BANK_NPA_CONFIG} {...props} />;
}
