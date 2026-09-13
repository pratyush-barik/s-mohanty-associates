'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFArkaFinanceRenderer, ArkaReportFields } from '@/lib/banks/pdf-arka-finance-renderer';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ReportActionBar,
  ActiveConfigBanner,
  NavItem,
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal
} from '../BaseBankReportComponents';

export default function ArkaFinance({
  projectId,
  initialFields,
  status,
  userRole,
  bucketImages,
  prefill,
  onResetWizard
}: any) {
  const router = useRouter();
  const isReadOnly = status === 'COMPLETED' || (status === 'MANAGER_REVIEW' && userRole === 'REPORT_EMPLOYEE');
  const [fields, setFields] = useState<any>({
    propertyOwners: [{ name: '', fatherName: '' }],
    refNo: '',
    dateOfReport: '',
    nameOfCustomer: '',
    customerContactDetails: '',
    appIdLoanAccountNo: '',
    documentsProvided: '',
    propertyDetailsAddress: '',
    plotNo: '',
    khasraNoKhataNo: '',
    locality: '',
    road: '',
    city: '',
    district: '',
    pinCode: '',
    nearbyLandMark: '',
    distanceFromCityCenter: '',
    availabilityOfLocalTransport: '',
    levelOfLand: '',
    classOfLocality: '',
    qualityOfInfrastructure: '',
    eastSaleDeed: '',
    eastActual: '',
    westSaleDeed: '',
    westActual: '',
    northSaleDeed: '',
    northActual: '',
    southSaleDeed: '',
    southActual: '',
    occupancyStatus: '',
    proximityToCivicAmenities: '',
    developmentOfSurroundingArea: '',
    longitude: '',
    latitude: '',
    buildingPlanApprovalNo: '',
    dateOfApproval: '',
    expiryDate: '',
    expectedCompletion: '',
    areaOfPlot: '',
    demarcationAtSite: '',
    approvedBuaGf: '',
    approvedBuaFf: '',
    approvedBuaMf: '',
    approvedBuaSf: '',
    recommendedRateOfPlot: '',
    valueOfPlot: '',
    estimatedCostOfConstruction: '',
    totalCostOfConstructionMeasuredGfRcc: '',
    depreciationValue: '',
    stageOfConstruction: '',
    percentWorkCompleted: '',
    percentDisbursementRecommended: '',
    currentValueOfTheProperty: '',
    dateOfPropertyVisit: '',
    valuationAsPerGovernmentReckoner: '',
    distressedValuation: '',
    rentalValuePerMonth: '',
    remarks: '',
    propertyImages: [],
    locationMapImages: [],
    sketchMapImages: [],
    mouzaMapImages: [],
    ...initialFields
  });
  
  const [loading, setLoading] = useState(false);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [message, setMessage] = useState<any>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const debouncedTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isReadOnly) return;
    setAutoSaveStatus('saving');
    if (debouncedTimer.current) clearTimeout(debouncedTimer.current);

    debouncedTimer.current = setTimeout(async () => {
      try {
        const res = await saveReportDraft(projectId, fields);
        if (res && 'error' in res && res.error) {
          setAutoSaveStatus('error');
        } else {
          setAutoSaveStatus('saved');
        }
      } catch (err) {
        console.error('Auto-save error:', err);
        setAutoSaveStatus('error');
      }
    }, 1200);

    return () => {
      if (debouncedTimer.current) clearTimeout(debouncedTimer.current);
    };
  }, [fields, projectId, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReadOnly) return;
      saveReportDraft(projectId, fields).catch(e => console.error(e));
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [projectId, fields, isReadOnly]);

  const handleChange = (k: string, v: any) => {
    setFields((p: any) => ({ ...p, [k]: v }));
  };

  const navSections: NavItem[] = [
    { id: 'arka-cover', title: 'Cover Page Details' },
    { id: 'arka-details', title: 'Property & Customer Details' },
    { id: 'arka-boundaries', title: 'Boundaries' },
    { id: 'arka-documents', title: 'Document Details' },
    { id: 'arka-valuation', title: 'Recommended Valuation' },
    { id: 'arka-photos', title: 'Photographs' },
    { id: 'arka-maps', title: 'Sketch & Location Maps' }
  ];


  const handleMapUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const fileName = `map-${key}-${Date.now()}.${ext}`;
      const path = `maps/${projectId}/${fileName}`;
      const { error } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(path, file);
      if (error) throw error;
      const { data } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(path);
      const existing = fields[key] || [];
      handleChange(key, [...existing, data.publicUrl]);
    } catch (err: any) {
      alert(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleMapRemove = (key: string, idx?: number) => {
    if (idx === undefined) {
      handleChange(key, []);
    } else {
      const existing = fields[key] || [];
      handleChange(key, existing.filter((_: any, i: number) => i !== idx));
    }
  };

  const handleReorderMap = (key: string, newImgs: any[]) => {
    handleChange(key, newImgs);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadedUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `photo-${Date.now()}-${i}.${ext}`;
        const path = `property-images/${projectId}/${fileName}`;
        const { error } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(path, file);
        if (!error) {
          const { data } = supabaseBrowser.storage
            .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
            .getPublicUrl(path);
          uploadedUrls.push(data.publicUrl);
        }
      }
      const existing = fields.propertyImages || [];
      handleChange('propertyImages', [...existing, ...uploadedUrls]);
    } catch (err) {
      alert(`Upload error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setUploading(false);
    }
  };

  const handleBucketConfirm = (selectedUrls: string[]) => {
    const existing = fields.propertyImages || [];
    handleChange('propertyImages', [...existing, ...selectedUrls]);
  };

  const handleDownloadPDF = async () => {
    setLoading(true);
    try {
      const renderer = new PDFArkaFinanceRenderer();
      await renderer.init();
      const bytes = await renderer.render(fields);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Arka_Valuation_${fields.refNo || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`PDF Download Failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitForVerification = async () => {
    if ((fields.propertyImages || []).length < 2) {
      alert('Please upload at least 2 photographs of the property before submitting.');
      return;
    }
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      const res = await submitReportForVerification(projectId);
      if (res && typeof res === 'object' && 'error' in res && res.error) {
        setMessage({ text: res.error, type: 'error' });
      } else {
        router.refresh();
      }
    } catch (err) {
      alert(`Submission failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviewPDF = async () => {
    // Open a blank tab synchronously in the click handler to bypass browser pop-up blockers
    const previewWindow = window.open('', '_blank');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head><title>Generating Arka Finance PDF Preview...</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8f9fa; color: #495057;">
            <div style="text-align: center;">
              <div style="border: 4px solid #dee2e6; border-top: 4px solid #b8860b; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
              <p style="font-size: 16px; font-weight: 600; margin: 0;">Generating Arka Finance PDF Preview...</p>
              <p style="font-size: 12px; color: #6c757d; margin: 8px 0 0;">Please wait while the document compiles.</p>
            </div>
            <style>
              @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
          </body>
        </html>
      `);
      previewWindow.document.close();
    }

    setLoading(true);
    try {
      const renderer = new PDFArkaFinanceRenderer();
      await renderer.init();
      const bytes = await renderer.render(fields as ArkaReportFields);
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = url;
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err: any) {
      if (previewWindow && !previewWindow.closed) previewWindow.close();
      alert('Preview failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    try {
      await saveReportDraft(projectId, fields);
      setMessage({ type: 'success', text: 'Draft saved' });
      setTimeout(() => setMessage(null), 3000);
    } catch(err) {
      alert('Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full">
      <div className="flex-1 min-w-0 space-y-6 w-full">
        <ActiveConfigBanner
          bankName="ARKA FINANCE LTD"
          formatName="Valuation Report"
          category="Bank & FIS"
          onResetWizard={onResetWizard}
        />

        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

       <Section id="arka-cover" title="Cover Page Details" defaultOpen>
          <div className="border border-gray-300 rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">PROPERTY OWNER</h3>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                onClick={() => handleChange('propertyOwners', [...(fields.propertyOwners || []), { name: '', fatherName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            
            <div className="space-y-4">
              {(fields.propertyOwners || [{ name: '', fatherName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-gray-50 p-3 rounded-md border border-gray-100">
                  <Field label="OWNER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.name}
                      onChange={(e) => {
                        const arr = [...(fields.propertyOwners || [])];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        handleChange('propertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRASANNA NAYAK"
                    />
                  </Field>
                  <Field label="OWNER'S FATHER'S NAME" className="flex-1">
                    <input
                      className={inputCls}
                      value={owner.fatherName}
                      onChange={(e) => {
                        const arr = [...(fields.propertyOwners || [])];
                        arr[idx] = { ...arr[idx], fatherName: e.target.value };
                        handleChange('propertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.propertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-[42px]"
                      onClick={() => {
                        const arr = [...fields.propertyOwners];
                        arr.splice(idx, 1);
                        handleChange('propertyOwners', arr);
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
        </Section>

        <Section id="arka-details" title="Property & Customer Details" defaultOpen>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field label="Ref No"><input className={inputCls} value={fields.refNo || ''} onChange={e => handleChange('refNo', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Date of Report"><input type="date" className={inputCls} value={fields.dateOfReport || ''} onChange={e => handleChange('dateOfReport', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Name of Customer"><input className={inputCls} value={fields.nameOfCustomer || ''} onChange={e => handleChange('nameOfCustomer', e.target.value)} disabled={isReadOnly} /></Field>
            <Field span={3} label="Customer Contact Details"><input className={inputCls} value={fields.customerContactDetails || ''} onChange={e => handleChange('customerContactDetails', e.target.value)} disabled={isReadOnly} /></Field>
            <Field span={2} label="APP ID/Loan Account No"><input className={inputCls} value={fields.appIdLoanAccountNo || ''} onChange={e => handleChange('appIdLoanAccountNo', e.target.value)} disabled={isReadOnly} /></Field>
            <Field span={3} label="Documents Provided"><input className={inputCls} value={fields.documentsProvided || ''} onChange={e => handleChange('documentsProvided', e.target.value)} disabled={isReadOnly} /></Field>
            <Field span={3} label="Property Details (Address)"><textarea className={inputCls} rows={3} value={fields.propertyDetailsAddress || ''} onChange={e => handleChange('propertyDetailsAddress', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Plot No"><input className={inputCls} value={fields.plotNo || ''} onChange={e => handleChange('plotNo', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Khata/Khasra No"><input className={inputCls} value={fields.khasraNoKhataNo || ''} onChange={e => handleChange('khasraNoKhataNo', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Locality"><input className={inputCls} value={fields.locality || ''} onChange={e => handleChange('locality', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Road"><input className={inputCls} value={fields.road || ''} onChange={e => handleChange('road', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="City"><input className={inputCls} value={fields.city || ''} onChange={e => handleChange('city', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="District"><input className={inputCls} value={fields.district || ''} onChange={e => handleChange('district', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Pin Code"><input className={inputCls} value={fields.pinCode || ''} onChange={e => handleChange('pinCode', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Nearby Land Mark"><input className={inputCls} value={fields.nearbyLandMark || ''} onChange={e => handleChange('nearbyLandMark', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Distance from City Center"><input className={inputCls} value={fields.distanceFromCityCenter || ''} onChange={e => handleChange('distanceFromCityCenter', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Local Transport"><input className={inputCls} value={fields.availabilityOfLocalTransport || ''} onChange={e => handleChange('availabilityOfLocalTransport', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Level of land"><input className={inputCls} value={fields.levelOfLand || ''} onChange={e => handleChange('levelOfLand', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Class Of Locality"><input className={inputCls} value={fields.classOfLocality || ''} onChange={e => handleChange('classOfLocality', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Quality of Infrastructure"><input className={inputCls} value={fields.qualityOfInfrastructure || ''} onChange={e => handleChange('qualityOfInfrastructure', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </Section>

        <Section id="arka-boundaries" title="Boundaries">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="East (Sale Deed)"><input className={inputCls} value={fields.eastSaleDeed || ''} onChange={e => handleChange('eastSaleDeed', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="East (Actual)"><input className={inputCls} value={fields.eastActual || ''} onChange={e => handleChange('eastActual', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="West (Sale Deed)"><input className={inputCls} value={fields.westSaleDeed || ''} onChange={e => handleChange('westSaleDeed', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="West (Actual)"><input className={inputCls} value={fields.westActual || ''} onChange={e => handleChange('westActual', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="North (Sale Deed)"><input className={inputCls} value={fields.northSaleDeed || ''} onChange={e => handleChange('northSaleDeed', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="North (Actual)"><input className={inputCls} value={fields.northActual || ''} onChange={e => handleChange('northActual', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="South (Sale Deed)"><input className={inputCls} value={fields.southSaleDeed || ''} onChange={e => handleChange('southSaleDeed', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="South (Actual)"><input className={inputCls} value={fields.southActual || ''} onChange={e => handleChange('southActual', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </Section>

        <Section id="arka-documents" title="Document Details">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Field span={3} label="Occupancy Status"><input className={inputCls} value={fields.occupancyStatus || ''} onChange={e => handleChange('occupancyStatus', e.target.value)} disabled={isReadOnly} /></Field>
            <Field span={3} label="Proximity to civic amenities"><input className={inputCls} value={fields.proximityToCivicAmenities || ''} onChange={e => handleChange('proximityToCivicAmenities', e.target.value)} disabled={isReadOnly} /></Field>
            <Field span={3} label="Development of surrounding Area"><input className={inputCls} value={fields.developmentOfSurroundingArea || ''} onChange={e => handleChange('developmentOfSurroundingArea', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Longitude"><input className={inputCls} value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Latitude"><input className={inputCls} value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} /></Field>
            <div className="col-span-3 border-t my-2"></div>
            <Field label="Building Plan Approval No"><input className={inputCls} value={fields.buildingPlanApprovalNo || ''} onChange={e => handleChange('buildingPlanApprovalNo', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Date of Approval"><input className={inputCls} value={fields.dateOfApproval || ''} onChange={e => handleChange('dateOfApproval', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Expiry date"><input className={inputCls} value={fields.expiryDate || ''} onChange={e => handleChange('expiryDate', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Expected completion"><input className={inputCls} value={fields.expectedCompletion || ''} onChange={e => handleChange('expectedCompletion', e.target.value)} disabled={isReadOnly} /></Field>
            <div className="col-span-3 border-t my-2"></div>
            <Field label="Area of Plot"><input className={inputCls} value={fields.areaOfPlot || ''} onChange={e => handleChange('areaOfPlot', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Demarcation at site"><input className={inputCls} value={fields.demarcationAtSite || ''} onChange={e => handleChange('demarcationAtSite', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Approved BUA (GF)"><input className={inputCls} value={fields.approvedBuaGf || ''} onChange={e => handleChange('approvedBuaGf', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Approved BUA (FF)"><input className={inputCls} value={fields.approvedBuaFf || ''} onChange={e => handleChange('approvedBuaFf', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Approved BUA (MF)"><input className={inputCls} value={fields.approvedBuaMf || ''} onChange={e => handleChange('approvedBuaMf', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Approved BUA (SF)"><input className={inputCls} value={fields.approvedBuaSf || ''} onChange={e => handleChange('approvedBuaSf', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </Section>

        <Section id="arka-valuation" title="Recommended Valuation">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Recommended rate of Plot/Flat"><input className={inputCls} value={fields.recommendedRateOfPlot || ''} onChange={e => handleChange('recommendedRateOfPlot', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Value of Plot/Flat"><input className={inputCls} value={fields.valueOfPlot || ''} onChange={e => handleChange('valueOfPlot', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Estimated Cost of construction"><input className={inputCls} value={fields.estimatedCostOfConstruction || ''} onChange={e => handleChange('estimatedCostOfConstruction', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Total Cost of construction"><input className={inputCls} value={fields.totalCostOfConstructionMeasuredGfRcc || ''} onChange={e => handleChange('totalCostOfConstructionMeasuredGfRcc', e.target.value)} disabled={isReadOnly} /></Field>
            <Field span={2} label="Depreciation value (Bold)"><input className={inputCls} value={fields.depreciationValue || ''} onChange={e => handleChange('depreciationValue', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Stage of Construction"><input className={inputCls} value={fields.stageOfConstruction || ''} onChange={e => handleChange('stageOfConstruction', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="% Work completed"><input className={inputCls} value={fields.percentWorkCompleted || ''} onChange={e => handleChange('percentWorkCompleted', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="% Disbursement Recommended"><input className={inputCls} value={fields.percentDisbursementRecommended || ''} onChange={e => handleChange('percentDisbursementRecommended', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Current Value of Property (Bold)"><input className={inputCls} value={fields.currentValueOfTheProperty || ''} onChange={e => handleChange('currentValueOfTheProperty', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Date of Property Visit"><input className={inputCls} value={fields.dateOfPropertyVisit || ''} onChange={e => handleChange('dateOfPropertyVisit', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Valuation as per Gov Reckoner"><input className={inputCls} value={fields.valuationAsPerGovernmentReckoner || ''} onChange={e => handleChange('valuationAsPerGovernmentReckoner', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Distressed valuation (Bold)"><input className={inputCls} value={fields.distressedValuation || ''} onChange={e => handleChange('distressedValuation', e.target.value)} disabled={isReadOnly} /></Field>
            <Field label="Rental value per month"><input className={inputCls} value={fields.rentalValuePerMonth || ''} onChange={e => handleChange('rentalValuePerMonth', e.target.value)} disabled={isReadOnly} /></Field>
            <Field span={2} label="Remarks"><textarea className={inputCls} rows={3} value={fields.remarks || ''} onChange={e => handleChange('remarks', e.target.value)} disabled={isReadOnly} /></Field>
          </div>
        </Section>

        <BasePhotographsSection
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading}
          bucketCount={bucketImages?.length || 0}
          onOpenBucket={() => setBucketPickerOpen(true)}
          onImageNameChange={(idx: number, name: string) => {
            const updated = [...(fields.propertyImageNames || [])];
            while (updated.length <= idx) updated.push("");
            updated[idx] = name;
            handleChange("propertyImageNames", updated);
          }}
          onRemoveImage={(idx: number) => {
            handleChange("propertyImages", (fields.propertyImages || []).filter((_: any, i: number) => i !== idx));
            handleChange("propertyImageNames", (fields.propertyImageNames || []).filter((_: any, i: number) => i !== idx));
          }}
          onUploadImages={handlePhotoUpload}
          onReorderImages={(newImgs: any) => handleChange('propertyImages', newImgs)}
          withoutSectionWrapper={false}
        />

        <BaseMapsSection
          locationMapImages={fields.locationMapImages || []}
          mouzaMapImages={fields.mouzaMapImages || []}
          sketchMapImages={fields.sketchMapImages || []}
          cadastralMapImages={fields.cadastralMapImages || []}
          latitude={fields.latitude}
          longitude={fields.longitude}
          propertyAddress={fields.addressOfTheProperty || ""}
          hasExternalCoordinatesField={true}
          coordinatesSectionName="Cover Page Details"
          isReadOnly={isReadOnly}
          uploading={uploading}
          onLocationMapUpload={e => handleMapUpload('locationMapImages', e)}
          onLocationMapRemove={idx => handleMapRemove('locationMapImages', idx)}
          onMouzaMapUpload={e => handleMapUpload('mouzaMapImages', e)}
          onMouzaMapRemove={idx => handleMapRemove('mouzaMapImages', idx)}
          onSketchMapUpload={e => handleMapUpload('sketchMapImages', e)}
          onSketchMapRemove={idx => handleMapRemove('sketchMapImages', idx)}
          onCadastralMapUpload={e => handleMapUpload('cadastralMapImages', e)}
          onCadastralMapRemove={idx => handleMapRemove('cadastralMapImages', idx)}
          onReorderLocationMap={newImgs => handleReorderMap('locationMapImages', newImgs)}
          onReorderMouzaMap={newImgs => handleReorderMap('mouzaMapImages', newImgs)}
          onReorderSketchMap={newImgs => handleReorderMap('sketchMapImages', newImgs)}
          onReorderCadastralMap={newImgs => handleReorderMap('cadastralMapImages', newImgs)}
        />

        {/* STANDARDIZED ACTION BAR */}
        <ReportActionBar
          isReadOnly={isReadOnly}
          userRole={userRole}
          autoSaveStatus={autoSaveStatus}
          message={message}
          loading={loading || uploading}
          onSaveDraft={handleSaveDraft}
          onSubmit={handleSubmitForVerification}
          onPreviewPDF={handlePreviewPDF}
          onDownloadPDF={handleDownloadPDF}
        />
      </div>

      <FloatingNavigator sections={navSections} />
      <BasePhotoBucketModal
        isOpen={bucketPickerOpen}
        bucketImages={bucketImages}
        mode="propertyImages"
        onClose={() => setBucketPickerOpen(false)}
        onConfirm={handleBucketConfirm}
      />
    </div>
  );
}
