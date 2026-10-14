'use client';
import React, { useState } from 'react';
import BankReportBuilder, { BankReportBuilderProps } from '../../BankReportBuilder';
import { BankConfig } from '@/lib/bank-fields';
import { Field, inputCls } from '../BaseBankReportComponents';
import { Lock, Plus, Trash2, AlertCircle } from 'lucide-react';
import { PDFIciciBankNpaRenderer } from '@/lib/banks/pdf-icici-bank-npa-renderer';
import { rupeesInWords } from '@/lib/numberToWords';

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

// ─── DigitalSignaturePad component ──────────────────────────────────────────
const DigitalSignaturePad = ({
  value,
  onChange,
  disabled
}: {
  value?: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'upload' | 'draw'>(value?.startsWith('data:image') ? 'draw' : 'upload');

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onChange(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    onChange('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onChange(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={`border border-amber-200 rounded-lg p-3 bg-white/90 shadow-sm ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="inline-flex rounded-md shadow-sm border border-amber-200 p-0.5 bg-amber-50">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setMode('upload')}
            className={`px-3 py-1 text-xs font-medium rounded transition ${mode === 'upload' ? 'bg-amber-600 text-white shadow' : 'text-amber-900 hover:text-amber-950'}`}
          >
            Upload File
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setMode('draw')}
            className={`px-3 py-1 text-xs font-medium rounded transition ${mode === 'draw' ? 'bg-amber-600 text-white shadow' : 'text-amber-900 hover:text-amber-950'}`}
          >
            Digital Pad
          </button>
        </div>

        {value && !disabled && (
          <button
            type="button"
            onClick={clearCanvas}
            className="text-xs text-red-600 hover:text-red-800 font-medium inline-flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear Signature
          </button>
        )}
      </div>

      {mode === 'upload' ? (
        <div className="space-y-2">
          <input
            type="file"
            accept="image/*"
            disabled={disabled}
            onChange={handleFileUpload}
            className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-900 hover:file:bg-amber-200 cursor-pointer disabled:cursor-not-allowed"
          />
          {value && (
            <div className="mt-2 p-2 border border-dashed border-amber-300 rounded bg-amber-50/50 flex justify-center">
              <img src={value} alt="Valuer Signature with Seal" className="max-h-24 object-contain" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="text-[11px] text-gray-500">Sign inside the box below with mouse or touch:</div>
          <canvas
            ref={canvasRef}
            width={400}
            height={110}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full border-2 border-dashed border-amber-300 rounded bg-white touch-none cursor-crosshair h-28"
          />
          {value && (
            <div className="flex justify-between items-center text-xs text-emerald-700">
              <span>✓ Digital Signature captured</span>
              {!disabled && (
                <button type="button" onClick={clearCanvas} className="text-red-500 hover:underline">Clear & Redraw</button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── FileUploadBox component ────────────────────────────────────────────────
const FileUploadBox = ({
  label,
  fileData,
  fileName,
  onChange,
  disabled
}: {
  label: string;
  fileData?: string;
  fileName?: string;
  onChange: (dataUrl: string, name: string) => void;
  disabled?: boolean;
}) => {
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result as string, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const isImage = fileData && (fileData.startsWith('data:image') || fileName?.match(/\.(jpg|jpeg|png|webp|gif)$/i));

  return (
    <div className="bg-white/80 border border-amber-200 rounded-lg p-3 space-y-2">
      <label className="block text-xs font-semibold text-gray-700">{label}</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        disabled={disabled}
        onChange={handleFile}
        className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200 cursor-pointer disabled:cursor-not-allowed"
      />
      {fileData && (
        <div className="flex items-center justify-between p-2 bg-amber-50 rounded border border-amber-200 text-xs text-gray-800">
          <div className="flex items-center gap-2 truncate">
            {isImage ? (
              <img src={fileData} alt={fileName || 'Document'} className="w-8 h-8 object-cover rounded border" />
            ) : (
              <span className="font-semibold text-amber-900 bg-amber-200 px-1.5 py-0.5 rounded text-[10px]">PDF</span>
            )}
            <span className="truncate">{fileName || 'Uploaded Document'}</span>
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={() => onChange('', '')}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove file"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Bank Config ─────────────────────────────────────────────────────────────
export const ICICI_BANK_NPA_CONFIG: BankConfig = {
  bankId: 'ICICI BANK',
  subTemplateId: 'NPA',
  displayName: 'ICICI Bank — NPA',
  id: 'icici-npa',
  hiddenFields: ['to', 'dateOfValuation', 'refNo'],
  hiddenSections: ['section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'section-6', 'section-7', 'section-7b', 'section-7c', 'section-8', 'section-9', 'section-10', 'section-11', 'section-12', 'section-13', 'section-14', 'section-15', 'annexures'],
  navSections: [
    { id: 'icicinpa-section-1', title: 'VALUATION OF IMMOVABLE PROPERTY' },
    { id: 'icicinpa-section-2', title: 'INDIVIDUAL TECHNICAL REPORT' },
    { id: 'icicinpa-section-3', title: 'PROPERTY DETAILS' },
    { id: 'icicinpa-section-4', title: 'CONTACT DETAILS' },
    { id: 'icicinpa-section-5', title: 'ATTACHED DOCUMENT DETAILS' },
    { id: 'icicinpa-section-6', title: 'BOUNDARIES ON SITE' },
    { id: 'icicinpa-section-7', title: 'PROPERTY DETAILS (TECHNICAL SPECIFICATIONS)' },
    { id: 'icicinpa-section-8', title: 'UNIT DETAILS' },
    { id: 'icicinpa-section-9', title: 'VALUATION' },
    { id: 'icicinpa-section-10', title: 'VALUATION AS PER GOVT. APPROVED RATE & MISCELLANEOUS' },
    { id: 'icicinpa-section-11', title: 'REMARKS & DECLARATION' },
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
    // ── SECTION 8: UNIT DETAILS ─────────────────────────────────
    {
      id: 'icicinpa-section-8',
      title: 'UNIT DETAILS',
      number: 8,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const rooms = Array.isArray(fields.icicinpaRoomUsage) && fields.icicinpaRoomUsage.length > 0
          ? fields.icicinpaRoomUsage
          : [{ details: 'GF', rooms: '', kitchen: '', bathrooms: '', remarks: '' }];

        const updateRooms = (newRooms: any[]) => handleChange('icicinpaRoomUsage', newRooms);

        const addRow = () => {
          updateRooms([...rooms, { details: 'GF', rooms: '', kitchen: '', bathrooms: '', remarks: '' }]);
        };

        const removeRow = (idx: number) => {
          const next = rooms.filter((_: any, i: number) => i !== idx);
          updateRooms(next.length > 0 ? next : [{ details: 'GF', rooms: '', kitchen: '', bathrooms: '', remarks: '' }]);
        };

        const updateRow = (idx: number, patch: any) => {
          const next = rooms.map((r: any, i: number) => i === idx ? { ...r, ...patch } : r);
          updateRooms(next);
        };

        const totalLifespan = fields.icicinpaTotalLifespan !== undefined && fields.icicinpaTotalLifespan !== '' ? Number(fields.icicinpaTotalLifespan) : 60;
        const approxAge = Number(fields.icicinpaApproxAgeOfProperty || 0);
        const autoResidualAge = fields.icicinpaApproxAgeOfProperty !== undefined && fields.icicinpaApproxAgeOfProperty !== ''
          ? String(Math.max(0, totalLifespan - approxAge))
          : '';

        return (
          <div className="space-y-6">
            {/* Table/Container: Room Usage (Dynamic Rows) */}
            <div style={{ backgroundColor: '#fce4ec', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <div className="flex justify-between items-center border-b border-pink-200 pb-2">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Room Usage (Dynamic Rows)
                </h4>
                <button
                  type="button"
                  onClick={addRow}
                  disabled={isReadOnly}
                  className="inline-flex items-center gap-1 bg-pink-700 hover:bg-pink-800 text-white text-xs font-semibold px-3 py-1.5 rounded shadow-sm transition disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="space-y-3">
                {rooms.map((row: any, idx: number) => (
                  <div key={idx} className="bg-white/80 border border-pink-100 rounded-lg p-3 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-end">
                    {/* Details Dropdown */}
                    <div className="w-full md:w-36">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Details
                      </label>
                      <select
                        className={inputCls}
                        value={row.details || 'GF'}
                        onChange={e => updateRow(idx, { details: e.target.value })}
                        disabled={isReadOnly}
                      >
                        <option value="GF">GF (Ground Floor)</option>
                        <option value="FF">FF (First Floor)</option>
                        <option value="SF">SF (Second Floor)</option>
                        <option value="TF">TF (Third Floor)</option>
                        <option value="Fourth Floor">Fourth Floor</option>
                        <option value="Basement">Basement</option>
                        <option value="Entire Building">Entire Building</option>
                        <option value="Custom">Custom / Other</option>
                      </select>
                      {row.details === 'Custom' && (
                        <input
                          type="text"
                          placeholder="Floor/Details..."
                          className={`${inputCls} mt-2`}
                          value={row.detailsCustom || ''}
                          onChange={e => updateRow(idx, { detailsCustom: e.target.value })}
                          disabled={isReadOnly}
                        />
                      )}
                    </div>

                    {/* No. of Rooms */}
                    <div className="w-full md:w-28">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        No. of Rooms
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className={inputCls}
                        value={row.rooms || ''}
                        onChange={e => updateRow(idx, { rooms: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* No. of Kitchen */}
                    <div className="w-full md:w-28">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        No. of Kitchen
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className={inputCls}
                        value={row.kitchen || ''}
                        onChange={e => updateRow(idx, { kitchen: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* No. of Bathrooms */}
                    <div className="w-full md:w-32">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        No. of Bathrooms
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        className={inputCls}
                        value={row.bathrooms || ''}
                        onChange={e => updateRow(idx, { bathrooms: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Usages and Remarks */}
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Usages and Remarks
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Residential 2BHK / Hall / Dining"
                        className={inputCls}
                        value={row.remarks || ''}
                        onChange={e => updateRow(idx, { remarks: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Remove button */}
                    {rooms.length > 1 && (
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

            {/* Container: Structure & Occupancy */}
            <div style={{ backgroundColor: '#fce4ec', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-pink-200 pb-1">
                Structure & Occupancy
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Structure */}
                <Field label="Structure">
                  <select
                    className={inputCls}
                    value={fields.icicinpaStructure || ''}
                    onChange={e => handleChange('icicinpaStructure', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Structure...</option>
                    <option value="RCC Framed Structure">RCC Framed Structure</option>
                    <option value="Load Bearing Structure">Load Bearing Structure</option>
                    <option value="Steel Structure">Steel Structure</option>
                    <option value="Pucca Structure">Pucca Structure</option>
                    <option value="Semi-Pucca Structure">Semi-Pucca Structure</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.icicinpaStructure === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom structure..."
                      className={`${inputCls} mt-2`}
                      value={fields.icicinpaStructureCustom || ''}
                      onChange={e => handleChange('icicinpaStructureCustom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                </Field>

                {/* Interior */}
                <Field label="Interior">
                  <select
                    className={inputCls}
                    value={fields.icicinpaInterior || ''}
                    onChange={e => handleChange('icicinpaInterior', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Interior...</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.icicinpaInterior === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom interior..."
                      className={`${inputCls} mt-2`}
                      value={fields.icicinpaInteriorCustom || ''}
                      onChange={e => handleChange('icicinpaInteriorCustom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                </Field>

                {/* Exterior */}
                <Field label="Exterior">
                  <select
                    className={inputCls}
                    value={fields.icicinpaExterior || ''}
                    onChange={e => handleChange('icicinpaExterior', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Exterior...</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.icicinpaExterior === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom exterior..."
                      className={`${inputCls} mt-2`}
                      value={fields.icicinpaExteriorCustom || ''}
                      onChange={e => handleChange('icicinpaExteriorCustom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                </Field>

                {/* Maintenance Level */}
                <Field label="Maintenance Level">
                  <select
                    className={inputCls}
                    value={fields.icicinpaMaintenanceLevel || ''}
                    onChange={e => handleChange('icicinpaMaintenanceLevel', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Maintenance...</option>
                    <option value="Good">Good</option>
                    <option value="Average">Average</option>
                    <option value="Poor">Poor</option>
                    <option value="Excellent">Excellent</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.icicinpaMaintenanceLevel === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom maintenance..."
                      className={`${inputCls} mt-2`}
                      value={fields.icicinpaMaintenanceLevelCustom || ''}
                      onChange={e => handleChange('icicinpaMaintenanceLevelCustom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                </Field>

                {/* Approx. Age Of Property */}
                <Field label="Approx. Age Of Property (Years)">
                  <input
                    type="number"
                    className={inputCls}
                    value={fields.icicinpaApproxAgeOfProperty || ''}
                    onChange={e => handleChange('icicinpaApproxAgeOfProperty', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 5"
                  />
                </Field>

                {/* Status Of Occupancy */}
                <Field label="Status Of Occupancy">
                  <select
                    className={inputCls}
                    value={fields.icicinpaStatusOfOccupancy || ''}
                    onChange={e => handleChange('icicinpaStatusOfOccupancy', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Status...</option>
                    <option value="Occupied">Occupied</option>
                    <option value="Vacant">Vacant</option>
                    <option value="Self Occupied">Self Occupied</option>
                    <option value="Tenant Occupied">Tenant Occupied</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.icicinpaStatusOfOccupancy === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom status..."
                      className={`${inputCls} mt-2`}
                      value={fields.icicinpaStatusOfOccupancyCustom || ''}
                      onChange={e => handleChange('icicinpaStatusOfOccupancyCustom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                </Field>

                {/* Occupied By */}
                <Field label="Occupied By">
                  <select
                    className={inputCls}
                    value={fields.icicinpaOccupiedBy || ''}
                    onChange={e => handleChange('icicinpaOccupiedBy', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Occupied By...</option>
                    <option value="Owner / Customer">Owner / Customer</option>
                    <option value="Tenant">Tenant</option>
                    <option value="Relative / Family">Relative / Family</option>
                    <option value="Vacant">Vacant</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.icicinpaOccupiedBy === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom occupied by..."
                      className={`${inputCls} mt-2`}
                      value={fields.icicinpaOccupiedByCustom || ''}
                      onChange={e => handleChange('icicinpaOccupiedByCustom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                </Field>

                {/* Relationship Of Occupant With Customer */}
                <Field label="Relationship Of Occupant With Customer">
                  <select
                    className={inputCls}
                    value={fields.icicinpaRelationshipOfOccupant || ''}
                    onChange={e => handleChange('icicinpaRelationshipOfOccupant', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Relationship...</option>
                    <option value="Self">Self</option>
                    <option value="Family / Relative">Family / Relative</option>
                    <option value="Tenant">Tenant</option>
                    <option value="None / NA">None / NA</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.icicinpaRelationshipOfOccupant === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom relationship..."
                      className={`${inputCls} mt-2`}
                      value={fields.icicinpaRelationshipOfOccupantCustom || ''}
                      onChange={e => handleChange('icicinpaRelationshipOfOccupantCustom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                </Field>

                {/* Occupied Since */}
                <Field label="Occupied Since (Year / Years)">
                  <input
                    type="number"
                    className={inputCls}
                    value={fields.icicinpaOccupiedSince || ''}
                    onChange={e => handleChange('icicinpaOccupiedSince', e.target.value)}
                    disabled={isReadOnly}
                    placeholder="e.g. 2018"
                  />
                </Field>

                {/* Residual Age of Property — Prefill/Auto-calculates fields (Total Lifespan - Approx Age) */}
                <PrefillField
                  label={
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Residual Age of Property</span>
                      <span className="text-xs text-gray-500 font-normal">([Lifespan:</span>
                      <input
                        type="number"
                        className="w-12 text-xs border border-gray-300 rounded px-1 py-0.5 text-center font-medium bg-white"
                        value={totalLifespan}
                        onChange={(e: any) => handleChange('icicinpaTotalLifespan', e.target.value)}
                        disabled={isReadOnly}
                        title="Total Lifespan (Years)"
                      />
                      <span className="text-xs text-gray-500 font-normal">Yrs] - Age)</span>
                    </div>
                  }
                  type="number"
                  value={fields.icicinpaResidualAge}
                  onChange={(val: string) => handleChange('icicinpaResidualAge', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill/Auto-calculates (Total Lifespan - Approx Age)"
                  fallbackValue={autoResidualAge}
                />
              </div>
            </div>
          </div>
        );
      }
    },
    // ── SECTION 9: VALUATION ────────────────────────────────────
    {
      id: 'icicinpa-section-9',
      title: 'VALUATION',
      number: 9,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const rows = Array.isArray(fields.icicinpaValuationRows) && fields.icicinpaValuationRows.length > 0
          ? fields.icicinpaValuationRows
          : [
              { description: 'Land', area: fields.icicinpaPlotArea || '', rate: '', amount: '' },
              { description: 'Building', area: fields.icicinpaCarpetAreaMeasured || '', rate: '', amount: '' },
            ];

        const updateRows = (newRows: any[]) => handleChange('icicinpaValuationRows', newRows);

        const addRow = () => {
          updateRows([...rows, { description: 'Building', area: '', rate: '', amount: '' }]);
        };

        const removeRow = (idx: number) => {
          const next = rows.filter((_: any, i: number) => i !== idx);
          updateRows(next.length > 0 ? next : [{ description: 'Land', area: '', rate: '', amount: '' }]);
        };

        const updateRow = (idx: number, patch: any) => {
          const next = rows.map((r: any, i: number) => {
            if (i !== idx) return r;
            const updated = { ...r, ...patch };
            // Auto-prefill area from Section 7 if empty on description selection
            if (patch.description === 'Land' && !updated.area && fields.icicinpaPlotArea) {
              updated.area = fields.icicinpaPlotArea;
            } else if (patch.description === 'Building' && !updated.area && fields.icicinpaCarpetAreaMeasured) {
              updated.area = fields.icicinpaCarpetAreaMeasured;
            }
            // Auto-calculate amount if area and rate are present and amount wasn't manually overridden
            const a = Number(updated.area || 0);
            const rt = Number(updated.rate || 0);
            if (patch.amount === undefined && a > 0 && rt > 0) {
              updated.amount = String(Math.round(a * rt));
            }
            return updated;
          });
          updateRows(next);
        };

        // Compute total sum of amounts
        const sumAmounts = rows.reduce((acc: number, r: any) => {
          const amt = r.amount !== undefined && r.amount !== '' ? Number(r.amount) : (Number(r.area || 0) * Number(r.rate || 0));
          return acc + (isNaN(amt) ? 0 : amt);
        }, 0);

        const autoTotal = sumAmounts > 0 ? String(Math.round(sumAmounts)) : '';
        const autoRoundOff = autoTotal;
        const autoInWords = Number(fields.icicinpaRoundOffTotal || autoRoundOff) > 0
          ? rupeesInWords(Number(fields.icicinpaRoundOffTotal || autoRoundOff))
          : '';

        return (
          <div className="space-y-6">
            {/* Table/Container: Calculation Output (Dynamic Rows) */}
            <div style={{ backgroundColor: '#e0f2f1', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <div className="flex justify-between items-center border-b border-teal-200 pb-2">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Calculation Output (Dynamic Rows)
                </h4>
                <button
                  type="button"
                  onClick={addRow}
                  disabled={isReadOnly}
                  className="inline-flex items-center gap-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold px-3 py-1.5 rounded shadow-sm transition disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="space-y-3">
                {rows.map((row: any, idx: number) => {
                  const fallbackArea = row.description === 'Land'
                    ? (fields.icicinpaPlotArea || '')
                    : (row.description === 'Building' ? (fields.icicinpaCarpetAreaMeasured || '') : '');
                  const currentArea = row.area !== undefined && row.area !== '' ? row.area : fallbackArea;
                  const currentRate = row.rate || '';
                  const calcAmt = (Number(currentArea || 0) * Number(currentRate || 0)) > 0
                    ? String(Math.round(Number(currentArea || 0) * Number(currentRate || 0)))
                    : '';
                  const currentAmt = row.amount !== undefined && row.amount !== '' ? row.amount : calcAmt;

                  return (
                    <div key={idx} className="bg-white/80 border border-teal-100 rounded-lg p-3 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-end">
                      {/* Description Dropdown */}
                      <div className="w-full md:w-44">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Description
                        </label>
                        <select
                          className={inputCls}
                          value={row.description || 'Land'}
                          onChange={e => updateRow(idx, { description: e.target.value })}
                          disabled={isReadOnly}
                        >
                          <option value="Land">Land</option>
                          <option value="Building">Building</option>
                          <option value="First Floor Building">First Floor Building</option>
                          <option value="Second Floor Building">Second Floor Building</option>
                          <option value="Open Terrace">Open Terrace</option>
                          <option value="Amenities / Others">Amenities / Others</option>
                          <option value="Custom">Custom / Other</option>
                        </select>
                        {row.description === 'Custom' && (
                          <input
                            type="text"
                            placeholder="Enter description..."
                            className={`${inputCls} mt-2`}
                            value={row.descriptionCustom || ''}
                            onChange={e => updateRow(idx, { descriptionCustom: e.target.value })}
                            disabled={isReadOnly}
                          />
                        )}
                      </div>

                      {/* Area (In Sqft) — Prefill from Plot Area / BUA */}
                      <div className="w-full md:w-36">
                        <label className="block text-xs font-semibold text-gray-600 mb-1" title="Prefill/Auto-calculates from Section 7">
                          Area (In Sqft)
                        </label>
                        <input
                          type="number"
                          placeholder="0"
                          className={inputCls}
                          value={currentArea}
                          onChange={e => updateRow(idx, { area: e.target.value })}
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Rate per Sqft(INR) */}
                      <div className="w-full md:w-36">
                        <label className="block text-xs font-semibold text-gray-600 mb-1">
                          Rate per Sqft (INR)
                        </label>
                        <input
                          type="number"
                          placeholder="Rs."
                          className={inputCls}
                          value={currentRate}
                          onChange={e => updateRow(idx, { rate: e.target.value })}
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Amount(INR) — Prefill/Auto-calculates (Area * Rate) */}
                      <div className="flex-1 w-full">
                        <label className="block text-xs font-semibold text-gray-600 mb-1" title="Auto-calculates (Area * Rate)">
                          Amount (INR)
                        </label>
                        <input
                          type="number"
                          placeholder="Rs."
                          className={inputCls}
                          value={currentAmt}
                          onChange={e => updateRow(idx, { amount: e.target.value })}
                          disabled={isReadOnly}
                        />
                      </div>

                      {/* Delete Button */}
                      {rows.length > 1 && (
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
                  );
                })}
              </div>
            </div>

            {/* Container: Final Calculation */}
            <div style={{ backgroundColor: '#e0f2f1', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-teal-200 pb-1">
                Final Calculation
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* TOTAL */}
                <PrefillField
                  label="TOTAL (INR)"
                  type="number"
                  value={fields.icicinpaTotalAmount}
                  onChange={(val: string) => handleChange('icicinpaTotalAmount', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill/Auto-calculates (Sum of Amounts)"
                  fallbackValue={autoTotal}
                />

                {/* Round Off Total */}
                <PrefillField
                  label="Round Off Total (INR)"
                  type="number"
                  value={fields.icicinpaRoundOffTotal}
                  onChange={(val: string) => handleChange('icicinpaRoundOffTotal', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill/Auto-calculates (Rounded Total)"
                  fallbackValue={autoRoundOff}
                />
              </div>

              {/* Round Off Total In Words */}
              <PrefillField
                label="Round Off Total In Words"
                type="textarea"
                rows={2}
                value={fields.icicinpaRoundOffTotalInWords}
                onChange={(val: string) => handleChange('icicinpaRoundOffTotalInWords', val)}
                isReadOnly={isReadOnly}
                tooltip="Prefill/Auto-calculates (Number to Words)"
                fallbackValue={autoInWords}
              />
            </div>
          </div>
        );
      }
    },
    // ── SECTION 10: VALUATION AS PER GOVT. APPROVED RATE & MISCELLANEOUS ─
    {
      id: 'icicinpa-section-10',
      title: 'VALUATION AS PER GOVT. APPROVED RATE & MISCELLANEOUS',
      number: 10,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        // Government Rates Calculations
        const govtLandArea = fields.icicinpaGovtLandArea !== undefined && fields.icicinpaGovtLandArea !== ''
          ? fields.icicinpaGovtLandArea
          : (fields.icicinpaPlotArea || '');
        const govtAreaRate = fields.icicinpaGovtAreaRate || '';
        const govtConstArea = fields.icicinpaGovtConstructedArea !== undefined && fields.icicinpaGovtConstructedArea !== ''
          ? fields.icicinpaGovtConstructedArea
          : (fields.icicinpaCarpetAreaMeasured || '');
        const govtConstRate = fields.icicinpaGovtConstructedRate !== undefined && fields.icicinpaGovtConstructedRate !== ''
          ? fields.icicinpaGovtConstructedRate
          : (fields.icicinpaCostOfConstruction || '');

        const autoGovtTotal = ((Number(govtLandArea || 0) * Number(govtAreaRate || 0)) + (Number(govtConstArea || 0) * Number(govtConstRate || 0))) > 0
          ? String(Math.round((Number(govtLandArea || 0) * Number(govtAreaRate || 0)) + (Number(govtConstArea || 0) * Number(govtConstRate || 0))))
          : '';

        // Construction Rows
        const constRows = Array.isArray(fields.icicinpaConstructionRows) && fields.icicinpaConstructionRows.length > 0
          ? fields.icicinpaConstructionRows
          : [
              { stage: 'Completed', structure: 'RCC Framed Structure', stageDesc: 'Finishing works complete, ready for possession', pctComplete: '100', pctRecommended: '100' }
            ];

        const updateConstRows = (newRows: any[]) => handleChange('icicinpaConstructionRows', newRows);

        const addConstRow = () => {
          updateConstRows([...constRows, { stage: '', structure: '', stageDesc: '', pctComplete: '100', pctRecommended: '100' }]);
        };

        const removeConstRow = (idx: number) => {
          const next = constRows.filter((_: any, i: number) => i !== idx);
          updateConstRows(next.length > 0 ? next : [{ stage: '', structure: '', stageDesc: '', pctComplete: '100', pctRecommended: '100' }]);
        };

        const updateConstRow = (idx: number, patch: any) => {
          const next = constRows.map((r: any, i: number) => i === idx ? { ...r, ...patch } : r);
          updateConstRows(next);
        };

        // Auto-calculates fields to "Completed" if 100%
        const isAll100 = constRows.length > 0 && constRows.every((r: any) => Number(r.pctComplete) === 100);
        const autoCompletion = isAll100 ? 'Completed' : 'Under Construction';

        return (
          <div className="space-y-6">
            {/* Container: Government Rates */}
            <div style={{ backgroundColor: '#e8eaf6', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-indigo-200 pb-1">
                Government Rates
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Land Area/Built Up Area/(Sq.Ft.) */}
                <PrefillField
                  label="Land Area/Built Up Area/(Sq.Ft.)"
                  type="number"
                  value={fields.icicinpaGovtLandArea}
                  onChange={(val: string) => handleChange('icicinpaGovtLandArea', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill from Plot Area (Section 7)"
                  fallbackValue={fields.icicinpaPlotArea}
                />

                {/* Area Rate (Per Sq. Ft.) */}
                <Field label="Area Rate (Per Sq. Ft.)">
                  <input
                    type="number"
                    placeholder="Rs."
                    className={inputCls}
                    value={fields.icicinpaGovtAreaRate || ''}
                    onChange={e => handleChange('icicinpaGovtAreaRate', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Constructed Area(BUA) */}
                <PrefillField
                  label="Constructed Area(BUA) (Sq.Ft.)"
                  type="number"
                  value={fields.icicinpaGovtConstructedArea}
                  onChange={(val: string) => handleChange('icicinpaGovtConstructedArea', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill from Measured BUA / Carpet Area (Section 7)"
                  fallbackValue={fields.icicinpaCarpetAreaMeasured}
                />

                {/* Constructed Rate (Per Sq. Ft.) */}
                <PrefillField
                  label="Constructed Rate (Per Sq. Ft.)"
                  type="number"
                  value={fields.icicinpaGovtConstructedRate}
                  onChange={(val: string) => handleChange('icicinpaGovtConstructedRate', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill from Cost of Construction (Section 7)"
                  fallbackValue={fields.icicinpaCostOfConstruction}
                />

                {/* Total Value */}
                <PrefillField
                  label="Total Value (INR)"
                  type="number"
                  value={fields.icicinpaGovtTotalValue}
                  onChange={(val: string) => handleChange('icicinpaGovtTotalValue', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Auto-calculates (Land Area * Rate + Constructed Area * Rate)"
                  fallbackValue={autoGovtTotal}
                />

                {/* Floor wise Building Usage */}
                <Field label="Floor wise Building Usage">
                  <select
                    className={inputCls}
                    value={fields.icicinpaFloorwiseUsage || ''}
                    onChange={e => handleChange('icicinpaFloorwiseUsage', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select Floor Usage...</option>
                    <option value="Residential">Residential</option>
                    <option value="Commercial">Commercial</option>
                    <option value="Ground Floor Commercial, Upper Floors Residential">Ground Floor Commercial, Upper Floors Residential</option>
                    <option value="Ground Floor Parking, Upper Floors Residential">Ground Floor Parking, Upper Floors Residential</option>
                    <option value="Mixed Use">Mixed Use</option>
                    <option value="Vacant / Under Construction">Vacant / Under Construction</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.icicinpaFloorwiseUsage === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom floor usage..."
                      className={`${inputCls} mt-2`}
                      value={fields.icicinpaFloorwiseUsageCustom || ''}
                      onChange={e => handleChange('icicinpaFloorwiseUsageCustom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                </Field>
              </div>
            </div>

            {/* Table/Container: Request Data (Read-Only text prefill from Section 2) */}
            <div style={{ backgroundColor: '#e8eaf6', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-indigo-200 pb-1">
                Request Data (Read-Only)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Request Code">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-700 pr-8`}
                      value={fields.icicinpaRequestId || 'NA'}
                      disabled
                      title="Prefill from Request ID (Section 2)"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Field>

                <Field label="Request Date">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-700 pr-8`}
                      value={fields.icicinpaDate || fields.valuationDate || 'NA'}
                      disabled
                      title="Valuation Date"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Field>

                <Field label="Parent Prod.Type">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-700 pr-8`}
                      value={fields.icicinpaProductName || fields.icicinpaProductType || 'NA'}
                      disabled
                      title="Prefill from Product Name / Type (Section 2)"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Field>

                <Field label="Product Type">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-700 pr-8`}
                      value={fields.icicinpaProductType || 'NA'}
                      disabled
                      title="Prefill from Product Type (Section 2)"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Field>
              </div>
            </div>

            {/* Table/Container: Construction Status (Dynamic Rows) */}
            <div style={{ backgroundColor: '#e8eaf6', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <div className="flex justify-between items-center border-b border-indigo-200 pb-2">
                <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Construction Status (Dynamic Rows)
                </h4>
                <button
                  type="button"
                  onClick={addConstRow}
                  disabled={isReadOnly}
                  className="inline-flex items-center gap-1 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-semibold px-3 py-1.5 rounded shadow-sm transition disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
              </div>

              <div className="space-y-3">
                {constRows.map((row: any, idx: number) => (
                  <div key={idx} className="bg-white/80 border border-indigo-100 rounded-lg p-3 shadow-sm flex flex-col md:flex-row gap-3 items-start md:items-end">
                    {/* Stage of Construction */}
                    <div className="w-full md:w-40">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Stage of Construction
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Completed"
                        className={inputCls}
                        value={row.stage || ''}
                        onChange={e => updateConstRow(idx, { stage: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Description of Structure */}
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Description of Structure
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RCC Framed Structure"
                        className={inputCls}
                        value={row.structure || ''}
                        onChange={e => updateConstRow(idx, { structure: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Description of Stage */}
                    <div className="flex-1 w-full">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        Description of Stage
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Finishing works ready"
                        className={inputCls}
                        value={row.stageDesc || ''}
                        onChange={e => updateConstRow(idx, { stageDesc: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* % Completion */}
                    <div className="w-full md:w-28">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        % Completion
                      </label>
                      <input
                        type="number"
                        placeholder="100"
                        className={inputCls}
                        value={row.pctComplete || ''}
                        onChange={e => updateConstRow(idx, { pctComplete: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* % Recommended */}
                    <div className="w-full md:w-28">
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        % Recommended
                      </label>
                      <input
                        type="number"
                        placeholder="100"
                        className={inputCls}
                        value={row.pctRecommended || ''}
                        onChange={e => updateConstRow(idx, { pctRecommended: e.target.value })}
                        disabled={isReadOnly}
                      />
                    </div>

                    {/* Delete Button */}
                    {constRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeConstRow(idx)}
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

            {/* Container: Verification Status */}
            <div style={{ backgroundColor: '#e8eaf6', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-indigo-200 pb-1">
                Verification Status
              </h4>

              <div className="space-y-4">
                {/* Completion Status — Prefill/Auto-calculates to "Completed" if 100% */}
                <PrefillField
                  label="Completion Status"
                  type="select"
                  options={[
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Under Construction', label: 'Under Construction' },
                    { value: 'Near Completion (Above 80%)', label: 'Near Completion (Above 80%)' },
                    { value: 'Mid Stage (50% - 80%)', label: 'Mid Stage (50% - 80%)' },
                    { value: 'Initial Stage (Below 50%)', label: 'Initial Stage (Below 50%)' },
                    { value: 'Stalled / Incomplete', label: 'Stalled / Incomplete' },
                    { value: 'Custom', label: 'Custom / Other' },
                  ]}
                  value={fields.icicinpaCompletionStatus}
                  onChange={(val: string) => handleChange('icicinpaCompletionStatus', val)}
                  isReadOnly={isReadOnly}
                  tooltip='Prefill/Auto-calculates to "Completed" if 100%'
                  fallbackValue={autoCompletion}
                />

                {/* Violations Observed If Any */}
                <Field label="Violations Observed If Any">
                  <textarea
                    rows={3}
                    placeholder="Enter violations if any, e.g. No violations observed / Construction as per approved norms..."
                    className={`${inputCls} resize-y`}
                    value={fields.icicinpaViolationsObserved || ''}
                    onChange={e => handleChange('icicinpaViolationsObserved', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>
            </div>
          </div>
        );
      }
    },
    // ── SECTION 11: REMARKS & DECLARATION ───────────────────────
    {
      id: 'icicinpa-section-11',
      title: 'REMARKS & DECLARATION',
      number: 11,
      defaultOpen: true,
      render: (fields, handleChange, isReadOnly) => {
        const valuerProfileName = fields.valuerName || 'Er. Satyajit Mohanty';
        const valuerProfileCity = fields.valuerCity || 'Bhubaneswar';
        const todayDate = new Date().toISOString().split('T')[0];

        const isDeclAccepted = fields.icicinpaDeclarationAccepted === true;

        return (
          <div className="space-y-6">
            {/* Container: Evaluator Notes */}
            <div style={{ backgroundColor: '#fff8e1', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-amber-200 pb-1">
                Evaluator Notes
              </h4>
              <Field label="Remarks">
                <textarea
                  rows={5}
                  placeholder="Enter evaluator notes, observations, detailed property condition..."
                  className={`${inputCls} resize-y`}
                  value={fields.icicinpaRemarks || ''}
                  onChange={e => handleChange('icicinpaRemarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Container: Tracking & Approvals */}
            <div style={{ backgroundColor: '#fff8e1', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-amber-200 pb-1">
                Tracking & Approvals
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visited By */}
                <PrefillField
                  label="Visited By"
                  type="select"
                  options={[
                    { value: valuerProfileName, label: `${valuerProfileName} (Chief Valuer)` },
                    { value: 'Field Engineer', label: 'Field Engineer (Inspection Team)' },
                    { value: 'Associate Valuer', label: 'Associate Valuer' },
                    { value: 'Technical Officer', label: 'Technical Officer' },
                    { value: 'Custom', label: 'Custom / Other' },
                  ]}
                  value={fields.icicinpaVisitedBy}
                  onChange={(val: string) => handleChange('icicinpaVisitedBy', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill/Auto-calculates based on valuer profile"
                  fallbackValue={valuerProfileName}
                />

                {/* Visited On */}
                <Field label="Visited On">
                  <input
                    type="date"
                    className={inputCls}
                    value={fields.icicinpaVisitedOn || fields.dateOfInspection || fields.icicinpaDate || ''}
                    onChange={e => handleChange('icicinpaVisitedOn', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Visited User Type */}
                <Field label="Visited User Type">
                  <select
                    className={inputCls}
                    value={fields.icicinpaVisitedUserType || ''}
                    onChange={e => handleChange('icicinpaVisitedUserType', e.target.value)}
                    disabled={isReadOnly}
                  >
                    <option value="">Select User Type...</option>
                    <option value="Technical Valuer">Technical Valuer</option>
                    <option value="Empanelled Valuer">Empanelled Valuer</option>
                    <option value="Field Engineer">Field Engineer</option>
                    <option value="External Consultant">External Consultant</option>
                    <option value="Bank Official">Bank Official</option>
                    <option value="Custom">Custom / Other</option>
                  </select>
                  {fields.icicinpaVisitedUserType === 'Custom' && (
                    <input
                      type="text"
                      placeholder="Enter custom user type..."
                      className={`${inputCls} mt-2`}
                      value={fields.icicinpaVisitedUserTypeCustom || ''}
                      onChange={e => handleChange('icicinpaVisitedUserTypeCustom', e.target.value)}
                      disabled={isReadOnly}
                    />
                  )}
                </Field>

                {/* Entered On */}
                <Field label="Entered On">
                  <input
                    type="date"
                    className={inputCls}
                    value={fields.icicinpaEnteredOn || fields.icicinpaDate || todayDate}
                    onChange={e => handleChange('icicinpaEnteredOn', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Entered By */}
                <PrefillField
                  label="Entered By"
                  type="select"
                  options={[
                    { value: valuerProfileName, label: `${valuerProfileName} (Chief Valuer)` },
                    { value: 'Report Data Operator', label: 'Report Data Operator' },
                    { value: 'Technical Assistant', label: 'Technical Assistant' },
                    { value: 'Custom', label: 'Custom / Other' },
                  ]}
                  value={fields.icicinpaEnteredBy}
                  onChange={(val: string) => handleChange('icicinpaEnteredBy', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill/Auto-calculates based on valuer profile"
                  fallbackValue={valuerProfileName}
                />

                {/* Approver ID */}
                <Field label="Approver ID">
                  <input
                    type="text"
                    placeholder="e.g. SMA/VAL/01"
                    className={inputCls}
                    value={fields.icicinpaApproverId || ''}
                    onChange={e => handleChange('icicinpaApproverId', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Approver Name */}
                <Field label="Approver Name">
                  <input
                    type="text"
                    placeholder="e.g. Er. Satyajit Mohanty"
                    className={inputCls}
                    value={fields.icicinpaApproverName || ''}
                    onChange={e => handleChange('icicinpaApproverName', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>

                {/* Approver Designation */}
                <Field label="Approver Designation">
                  <input
                    type="text"
                    placeholder="e.g. Chief Valuer & Consultant"
                    className={inputCls}
                    value={fields.icicinpaApproverDesignation || ''}
                    onChange={e => handleChange('icicinpaApproverDesignation', e.target.value)}
                    disabled={isReadOnly}
                  />
                </Field>
              </div>

              {/* Approver Remarks */}
              <Field label="Approver Remarks">
                <textarea
                  rows={2}
                  placeholder="e.g. Valuation recommended and approved as per bank norms..."
                  className={`${inputCls} resize-y`}
                  value={fields.icicinpaApproverRemarks || ''}
                  onChange={e => handleChange('icicinpaApproverRemarks', e.target.value)}
                  disabled={isReadOnly}
                />
              </Field>
            </div>

            {/* Container: Image Links */}
            <div style={{ backgroundColor: '#fff8e1', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-amber-200 pb-1">
                Image Links
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FileUploadBox
                  label="Image / Document :1 (JPG/PNG/PDF)"
                  fileData={fields.icicinpaImageDoc1}
                  fileName={fields.icicinpaImageDoc1Name}
                  onChange={(dataUrl, name) => {
                    handleChange('icicinpaImageDoc1', dataUrl);
                    handleChange('icicinpaImageDoc1Name', name);
                  }}
                  disabled={isReadOnly}
                />
                <FileUploadBox
                  label="Image / Document :2 (JPG/PNG/PDF)"
                  fileData={fields.icicinpaImageDoc2}
                  fileName={fields.icicinpaImageDoc2Name}
                  onChange={(dataUrl, name) => {
                    handleChange('icicinpaImageDoc2', dataUrl);
                    handleChange('icicinpaImageDoc2Name', name);
                  }}
                  disabled={isReadOnly}
                />
              </div>
            </div>

            {/* Table/Container: Parameter Info */}
            <div style={{ backgroundColor: '#fff8e1', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-amber-200 pb-1">
                Parameter Info (Read-Only)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Field label="Application No.">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-700 pr-8`}
                      value={fields.icicinpaApplicationNo || 'NA'}
                      disabled
                      title="Prefill from Section 2"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Field>

                <Field label="Customer Name">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-700 pr-8`}
                      value={fields.icicinpaCustomerName || 'NA'}
                      disabled
                      title="Prefill from Section 2"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Field>

                <Field label="Channel Name /Employee Name">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-700 pr-8`}
                      value={(fields.icicinpaChannelName ? fields.icicinpaChannelName + (fields.icicinpaPreparedBy ? ' / ' + fields.icicinpaPreparedBy : '') : (fields.icicinpaPreparedBy || 'NA'))}
                      disabled
                      title="Prefill from Section 2"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Field>

                <Field label="Date">
                  <div className="relative">
                    <input
                      type="text"
                      className={`${inputCls} bg-gray-100 cursor-not-allowed text-gray-700 pr-8`}
                      value={fields.icicinpaDate || fields.valuationDate || todayDate}
                      disabled
                      title="Report Date"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Lock className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </Field>
              </div>
            </div>

            {/* Container: Signatories */}
            <div style={{ backgroundColor: '#fff8e1', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-amber-200 pb-1">
                Signatories & Declarations
              </h4>

              {/* Mandatory Declaration Checkbox */}
              <div className="p-3 bg-white/90 border border-amber-300 rounded-lg shadow-sm">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    checked={isDeclAccepted}
                    onChange={e => handleChange('icicinpaDeclarationAccepted', e.target.checked)}
                    disabled={isReadOnly}
                  />
                  <div className="text-xs text-gray-800 leading-relaxed font-medium">
                    <span className="font-bold text-amber-900 block mb-0.5">Mandatory Declaration (Unlocks Signature):</span>
                    &ldquo;I/We hereby declare that 1. The property was inspected by us. 2. We have no direct or indirect interest in the property valued. 3. The information furnished above is true and correct to the best of our knowledge and belief.&rdquo;
                  </div>
                </label>
              </div>

              {!isDeclAccepted && (
                <div className="flex items-center gap-2 p-2 bg-amber-100/70 border border-amber-300 rounded text-xs text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Please check and accept the mandatory declaration above to unlock the signature upload & digital pad.</span>
                </div>
              )}

              {/* Signature with Seal (File Upload / Digital Pad) */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-gray-700">
                  Signature with seal {isDeclAccepted ? <span className="text-emerald-600 font-normal">(Unlocked)</span> : <span className="text-amber-700 font-normal">(Locked)</span>}
                </label>
                <DigitalSignaturePad
                  value={fields.icicinpaSignatureSeal}
                  onChange={(val: string) => handleChange('icicinpaSignatureSeal', val)}
                  disabled={isReadOnly || !isDeclAccepted}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Date */}
                <PrefillField
                  label="Date"
                  type="date"
                  value={fields.icicinpaSignDate}
                  onChange={(val: string) => handleChange('icicinpaSignDate', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill/Auto-calculates fields to current date"
                  fallbackValue={todayDate}
                />

                {/* Place */}
                <PrefillField
                  label="Place"
                  type="text"
                  value={fields.icicinpaSignPlace}
                  onChange={(val: string) => handleChange('icicinpaSignPlace', val)}
                  isReadOnly={isReadOnly}
                  tooltip="Prefill/Auto-calculates based on valuer profile"
                  fallbackValue={valuerProfileCity}
                />
              </div>
            </div>

            {/* Container: Legal Statement */}
            <div style={{ backgroundColor: '#fff8e1', padding: '16px', borderRadius: '8px' }} className="space-y-4">
              <h4 className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b border-amber-200 pb-1">
                Legal Statement
              </h4>

              <div className="p-3.5 bg-white/90 border border-amber-300 rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2 border-b border-amber-100 pb-1">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wide">DISCLAIMER (Read-Only)</span>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500">
                    <Lock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Protected Standard Clause</span>
                  </div>
                </div>
                <p className="text-xs text-gray-700 leading-relaxed font-normal text-justify">
                  DISCLAIMER: This valuation report has been prepared solely for the technical assessment and internal guidance of ICICI Bank. The valuation is carried out in good faith based on the documents, visual physical inspection, information, and representations furnished by the applicant/bank. No warranty is given or implied regarding structural stability, hidden foundations, soil strata, concealed installations, or legal title correctness. This report is confidential and cannot be reproduced, transferred, or used by any third party without prior written permission of S Mohanty Associates.
                </p>
              </div>
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
