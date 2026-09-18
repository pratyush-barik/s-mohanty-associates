'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useRef, useEffect } from 'react';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { PDFArkaFinanceRenderer, ArkaReportFields } from '@/lib/banks/pdf-arka-finance-renderer';
import { fetchBytes } from '@/lib/pdf-bank-renderer';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ReportActionBar,
  ActiveConfigBanner,
  NavItem,
  BaseDateInput,
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
    // Section 1: Cover Page
    propertyOwners: [{ name: '', fatherName: '' }],
    arkaAddressOfTheProperty: '',
    presentMarketValue: '',
    distressSaleValue: '',
    enableCoverPageValueEdit: false,
    purposeOfValuationDropdown: 'default',
    purposeOfValuation: 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY',
    preparedByCompany: 'M/s. S MOHANTY ASSOCIATES',
    preparedByDesignation: 'EMPANELLED VALUER & CHARTERED ENGINEER',
    preparedByPlotNo: 'Plot no-859/2494/3232 & 858/2493/3295',
    preparedByStreet: 'Shiv Nagar Tankapani Road',
    preparedByCity: 'Bhubaneswar',
    preparedByState: 'Odisha',
    preparedByPinCode: '751018',
    preparedByPhone: '06742381145',
    preparedByMobile: '9937023855/9437074855',
    refNo: '',
    dateOfReport: '',
    // Section 2: Client & Application
    nameOfCustomer: '',
    customerContactDetails: '',
    appIdLoanAccountNo: '',
    documentsProvidedOther: '',
    // Section 3: Property Overview & Location
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
    availabilityOfLocalTransportOther: '',
    levelOfLand: '',
    classOfLocality: '',
    qualityOfInfrastructure: '',
    qualityOfInfrastructureOther: '',
    // Section 4: Boundary Details & Property Characteristics
    eastSaleDeed: '',
    eastActual: '',
    eastSketchMap: '',
    westSaleDeed: '',
    westActual: '',
    westSketchMap: '',
    northSaleDeed: '',
    northActual: '',
    northSketchMap: '',
    southSaleDeed: '',
    southActual: '',
    southSketchMap: '',
    boundariesMatch: '',
    landStatus: '',
    landStatusOther: '',
    propertyType: '',
    propertyTypeOther: '',
    approvedUsage: '',
    approvedUsageOther: '',
    actualUsage: '',
    actualUsageOther: '',
    structureType: '',
    structureTypeOther: '',
    numberOfFloors: '',
    occupancyDetails: '',
    occupancyDetailsOther: '',
    electricityWaterDrainage: '',
    electricityWaterDrainageOther: '',
    proximityToCivicAmenities: '',
    developmentOfSurroundingArea: '',
    longitude: '',
    latitude: '',
    // Section 5: Construction & Regulatory Approvals
    buildingPlanApprovalNo: '',
    dateOfApproval: '',
    expiryDate: '',
    expectedCompletion: '',
    areaOfPlot: '',
    demarcationAtSite: '',
    demarcationAtSiteOther: '',
    approvedBuaFloors: [
      { floor: 'G.F. (ground floor)', rccArea: '', accArea: '' },
      { floor: 'F.F. (first floor)', rccArea: '', accArea: '' },
      { floor: 'M.F. (mezzanine floor)', rccArea: '', accArea: '' },
      { floor: 'S.F(second floor)', rccArea: '', accArea: '' },
    ],
    measuredBuaFloors: [
      { floor: 'G.F. (ground floor)', rccArea: '', accArea: '' },
      { floor: 'F.F. (first floor)', rccArea: '', accArea: '' },
      { floor: 'S.F. (second floor)', rccArea: '', accArea: '' },
      { floor: 'T.F(third floor)', rccArea: '', accArea: '' },
    ],
    constructionAsPerPlan: '',
    constructionAsPerPlanOther: '',
    qualityOfConstruction: '',
    qualityOfConstructionOther: '',
    maintenanceOfProperty: '',
    maintenanceOfPropertyOther: '',
    currentLifeOfStructure: '',
    projectedLifeOfStructure: '',
    // Section 6: Valuation Details
    recommendedRateOfPlot: '',
    valueOfPlot: '',
    estimatedCostOfConstruction: '',
    constructionRate: '',
    totalCostOfConstructionMeasured: '',
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
    // Edit toggles for dependent fields
    enableEditValueOfPlot: false,
    enableEditTotalCost: false,
    enableEditDepreciation: false,
    enableEditCurrentValue: false,
    enableEditDistressed: false,
    photosAttached: 'Attached',
    photosAttachedOther: '',
    locationSketchAttached: 'Attached',
    locationSketchAttachedOther: '',
    // Media
    propertyImages: [],
    propertyImageNames: [],
    locationMapImages: [],
    sketchMapImages: [],
    mouzaMapImages: [],
    cadastralMapImages: [],
    ...initialFields,
    documentsProvided: initialFields?.documentsProvided || 'Multiple'
  });

  const [loading, setLoading] = useState(false);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [message, setMessage] = useState<any>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle'|'saving'|'saved'|'error'>('idle');
  const [uploading, setUploading] = useState(false);
  const [plotKhasraEditMode, setPlotKhasraEditMode] = useState(false);
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

  // Auto-extract Plot No and Khasra/Khata No from Property Details address text
  const extractPlotAndKhasra = (text: string, force?: boolean) => {
    if (!force && plotKhasraEditMode) return; // Skip extraction when manual edit is on

    // Plot No extraction: Plot no-XXX/YYY or Plot No XXX
    const plotMatches = [...text.matchAll(/Plot\s*no[-\s.:]*([0-9\/]+)/gi)];
    const plotValues = plotMatches.map(m => m[1]).filter(Boolean);
    const plotResult = plotValues.join(', ');

    // Khasra/Khata extraction: Khata No-XXX, Khasra No XXX, S.No XXX, G.No XXX
    const khasraMatches = [...text.matchAll(/(?:Khata|Khasra|\bS|\bG)\.?\s*No[-.:\s]*([0-9\/]+)/gi)];
    const khasraValues = khasraMatches.map(m => m[1]).filter(Boolean);
    const khasraResult = khasraValues.join(', ');

    setFields((p: any) => ({
      ...p,
      plotNo: plotResult || p.plotNo,
      khasraNoKhataNo: khasraResult || p.khasraNoKhataNo,
    }));
  };

  // Auto-extract on initial load when address exists but plotNo/khasraNoKhataNo are empty
  useEffect(() => {
    const address = fields.propertyDetailsAddress;
    if (address && (!fields.plotNo || !fields.khasraNoKhataNo)) {
      extractPlotAndKhasra(address, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill refNo from projectCode or projectId
  useEffect(() => {
    if (!fields.refNo && (projectCode || projectId)) {
      setFields((p: any) => ({ ...p, refNo: projectCode || projectId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectCode, projectId]);

  // Mathematical Dependencies & Auto-Calculation Logic
  useEffect(() => {
    const extractNum = (val: any) => {
      if (!val) return 0;
      const str = String(val).replace(/Rs\.?\s*/ig, '').replace(/[^0-9.]/g, '');
      const parsed = parseFloat(str);
      return isNaN(parsed) ? 0 : parsed;
    };

    setFields((prev: any) => {
      const next = { ...prev };
      let changed = false;

      const updateField = (key: string, value: string) => {
        if (next[key] !== value) {
          next[key] = value;
          changed = true;
        }
      };

      // 1. Plot Value = Area * Recommended Rate
      if (!next.enableEditValueOfPlot) {
        const area = extractNum(next.areaOfPlot);
        const rate = extractNum(next.recommendedRateOfPlot);
        const plotVal = area * rate;
        updateField('valueOfPlot', plotVal > 0 ? `Rs. ${plotVal.toLocaleString('en-IN')}/-` : '');
      }

      // 2. Construction Cost = SUM(RCC Areas) * Construction Rate
      if (!next.enableEditTotalCost) {
        const sumRcc = Array.isArray(next.measuredBuaFloors)
          ? next.measuredBuaFloors.reduce((sum: number, f: any) => sum + extractNum(f.rccArea), 0)
          : 0;
        const constRate = extractNum(next.constructionRate);
        const totalCostCalc = sumRcc * constRate;
        updateField('totalCostOfConstructionMeasured', totalCostCalc > 0 ? `Rs. ${totalCostCalc.toLocaleString('en-IN')}/-` : '');
      }

      // 3. Depreciation Value = Total Cost (updated per user request)
      if (!next.enableEditDepreciation) {
        const totalCost = extractNum(next.totalCostOfConstructionMeasured);
        updateField('depreciationValue', totalCost > 0 ? `Rs. ${totalCost.toLocaleString('en-IN')}/-` : '');
      }

      // 4. Current Value = Plot Value + Depreciation Value
      if (!next.enableEditCurrentValue) {
        const plotV = extractNum(next.valueOfPlot);
        const depV = extractNum(next.depreciationValue);
        const currentVal = plotV + depV;
        updateField('currentValueOfTheProperty', currentVal > 0 ? `Rs. ${currentVal.toLocaleString('en-IN')}/-` : '');
      }

      // 5. Distressed Valuation = Current Value * 0.80
      if (!next.enableEditDistressed) {
        const currentVal = extractNum(next.currentValueOfTheProperty);
        updateField('distressedValuation', currentVal > 0 ? `Rs. ${(currentVal * 0.80).toLocaleString('en-IN')}/-` : '');
      }

      // 6. Cover Page Values State Mirroring
      if (!next.enableCoverPageValueEdit) {
        updateField('presentMarketValue', next.currentValueOfTheProperty || '');
        updateField('distressSaleValue', next.distressedValuation || '');
      }

      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Source inputs
    fields.areaOfPlot,
    fields.recommendedRateOfPlot,
    fields.measuredBuaFloors,
    fields.constructionRate,
    fields.currentLifeOfStructure,
    // Computed fields that act as inputs when manually overridden
    fields.totalCostOfConstructionMeasured,
    fields.valueOfPlot,
    fields.depreciationValue,
    fields.currentValueOfTheProperty,
    fields.distressedValuation,
    // Edit toggle flags
    fields.enableEditValueOfPlot,
    fields.enableEditTotalCost,
    fields.enableEditDepreciation,
    fields.enableEditCurrentValue,
    fields.enableEditDistressed,
    fields.enableCoverPageValueEdit
  ]);

  const navSections: NavItem[] = [
    { id: 'arka-cover', title: '1. Cover Page Details' },
    { id: 'arka-sec2', title: '2. Client & Application' },
    { id: 'arka-sec3', title: '3. Property Overview' },
    { id: 'arka-sec4', title: '4. Boundaries & Characteristics' },
    { id: 'arka-sec5', title: '5. Construction & Approvals' },
    { id: 'arka-sec6', title: '6. Valuation Details' },
    { id: 'arka-sec7', title: '7. Remarks & Undertaking' },
    { id: 'arka-photos', title: '8. Property Photographs' },
    { id: 'arka-maps', title: '9. Location and Sketch Maps' },
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
      // Convert image URLs to byte arrays for the PDF renderer
      const propImages = fields.propertyImages || [];
      const photoBytesList = await Promise.all(propImages.map(fetchBytes));
      const photos = propImages.map((url: string, idx: number) => ({
        bytes: photoBytesList[idx] as Uint8Array,
        label: fields.propertyImageNames?.[idx] || 'Site Picture',
      })).filter((p: any) => p.bytes && p.bytes.length > 0);

      const locImages = fields.locationMapImages || [];
      const locBytes = (await Promise.all(locImages.map(fetchBytes))).filter((b: Uint8Array | null): b is Uint8Array => b !== null);

      const mouzaImages = fields.mouzaMapImages || [];
      const mouzaBytes = (await Promise.all(mouzaImages.map(fetchBytes))).filter((b: Uint8Array | null): b is Uint8Array => b !== null);

      const sketchImages = fields.sketchMapImages || [];
      const sketchBytes = (await Promise.all(sketchImages.map(fetchBytes))).filter((b: Uint8Array | null): b is Uint8Array => b !== null);

      const renderer = new PDFArkaFinanceRenderer();
      await renderer.init();
      const bytes = await renderer.render({
        ...fields,
        propertyImages: photos,
        locationMapImages: locBytes,
        mouzaMapImages: mouzaBytes,
        sketchMapImages: sketchBytes,
      } as ArkaReportFields);
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
    if (fields.pinCode && fields.pinCode.length > 0 && fields.pinCode.length < 6) {
      alert('PIN code must be exactly 6 digits');
      return;
    }
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
      // Convert image URLs to byte arrays for the PDF renderer
      const propImages = fields.propertyImages || [];
      const photoBytesList = await Promise.all(propImages.map(fetchBytes));
      const photos = propImages.map((url: string, idx: number) => ({
        bytes: photoBytesList[idx] as Uint8Array,
        label: fields.propertyImageNames?.[idx] || 'Site Picture',
      })).filter((p: any) => p.bytes && p.bytes.length > 0);

      const locImages = fields.locationMapImages || [];
      const locBytes = (await Promise.all(locImages.map(fetchBytes))).filter((b: Uint8Array | null): b is Uint8Array => b !== null);

      const mouzaImages = fields.mouzaMapImages || [];
      const mouzaBytes = (await Promise.all(mouzaImages.map(fetchBytes))).filter((b: Uint8Array | null): b is Uint8Array => b !== null);

      const sketchImages = fields.sketchMapImages || [];
      const sketchBytes = (await Promise.all(sketchImages.map(fetchBytes))).filter((b: Uint8Array | null): b is Uint8Array => b !== null);

      const renderer = new PDFArkaFinanceRenderer();
      await renderer.init();
      const bytes = await renderer.render({
        ...fields,
        propertyImages: photos,
        locationMapImages: locBytes,
        mouzaMapImages: mouzaBytes,
        sketchMapImages: sketchBytes,
      } as ArkaReportFields);
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

  // Helper: Add / Remove dynamic floor rows
  const handleAddBuaFloor = (key: 'approvedBuaFloors' | 'measuredBuaFloors') => {
    const current = fields[key] || [];
    const nextIdx = current.length;
    const floorNames = ['Ground Floor (GF)', 'First Floor (FF)', 'Second Floor (SF)', 'Third Floor (TF)', 'Fourth Floor', 'Fifth Floor'];
    const floorName = nextIdx < floorNames.length ? floorNames[nextIdx] : `Floor ${nextIdx + 1}`;
    handleChange(key, [...current, { floor: floorName, rccArea: '', accArea: '' }]);
  };

  const handleRemoveBuaFloor = (key: 'approvedBuaFloors' | 'measuredBuaFloors', idx: number) => {
    const current = fields[key] || [];
    handleChange(key, current.filter((_: any, i: number) => i !== idx));
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start animate-fade-in relative w-full">
      <div className="flex-1 min-w-0 space-y-6 w-full">
        <ActiveConfigBanner
          clientType={fields.clientType || 'organisation'}
          category={fields.institutionCategory || 'Bank & FIS'}
          bankName={fields.organisationTemplate || fields.bankName || 'ARKA FINANCE LTD'}
          subclass={fields.organisationSubTemplate || undefined}
          serviceType={fields.serviceType || prefill?.purpose || undefined}
          subjectType={fields.subjectType || prefill?.propertyType || undefined}
          onResetWizard={onResetWizard}
        />

        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold shadow-sm ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.text}
          </div>
        )}

        {/* SECTION 1: COVER PAGE DETAILS (unchanged) */}
        <Section id="arka-cover" title="Cover Page Details" number={1} defaultOpen>
          <div className="border border-blue-200 bg-[#f8fafc] rounded-md p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">PROPERTY OWNER</h3>
              <button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 text-sm rounded-md shadow-sm transition-colors"
                onClick={() => handleChange('propertyOwners', [...(fields.propertyOwners || []), { name: '', relationship: 'S/O', relativeName: '' }])}
                disabled={isReadOnly}
              >
                + Add Row
              </button>
            </div>
            <div className="space-y-4">
              {(fields.propertyOwners || [{ name: '', relationship: 'S/O', relativeName: '' }]).map((owner: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-end bg-white p-3 rounded-md border border-gray-100 shadow-sm">
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
                  <Field label="Relationship" className="w-40">
                    <input
                      list={`relations-${idx}`}
                      className={inputCls}
                      value={owner.relationship || ''}
                      onChange={(e) => {
                        const arr = [...(fields.propertyOwners || [])];
                        arr[idx] = { ...arr[idx], relationship: e.target.value };
                        handleChange('propertyOwners', arr);
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
                        const arr = [...(fields.propertyOwners || [])];
                        arr[idx] = { ...arr[idx], relativeName: e.target.value, fatherName: e.target.value };
                        handleChange('propertyOwners', arr);
                      }}
                      disabled={isReadOnly}
                      placeholder="e.g. PRAHALLAD NAYAK"
                    />
                  </Field>
                  {(fields.propertyOwners?.length > 1 || idx > 0) && (
                    <button
                      type="button"
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 text-sm rounded-md shadow-sm transition-colors h-10"
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
          <div className="mt-4 mb-4">
            <Field label="ADDRESS OF THE PROPERTY">
              <textarea className={inputCls} rows={3} value={fields.arkaAddressOfTheProperty || ''} onChange={e => handleChange('arkaAddressOfTheProperty', e.target.value)} disabled={isReadOnly} />
            </Field>
          </div>
          <div className="border border-red-200 bg-[#fff5f5] rounded-xl p-4 mb-4 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700">VALUE OF THE PROPERTY</h3>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleChange('enableCoverPageValueEdit', !fields.enableCoverPageValueEdit)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.enableCoverPageValueEdit ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.enableCoverPageValueEdit ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${fields.enableCoverPageValueEdit ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {fields.enableCoverPageValueEdit ? 'Edit On' : 'Edit Off'}
                </span>
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-md shadow-sm">
              <div className="flex border-b border-gray-200">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">PRESENT MARKET VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input className={`${inputCls} ${!fields.enableCoverPageValueEdit ? 'bg-gray-50' : ''}`} value={fields.presentMarketValue || ''} onChange={(e) => handleChange('presentMarketValue', e.target.value)} disabled={isReadOnly || !fields.enableCoverPageValueEdit} />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Current Value of Property (Plot + Construction) field from Section 6.</span>
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2 md:w-[40%] p-3 border-r border-gray-200 flex items-center">
                  <span className="text-sm font-medium text-gray-700">DISTRESS SALE VALUE</span>
                </div>
                <div className="w-1/2 md:w-[60%] p-2 flex flex-col justify-center">
                  <input className={`${inputCls} ${!fields.enableCoverPageValueEdit ? 'bg-gray-50' : ''}`} value={fields.distressSaleValue || ''} onChange={(e) => handleChange('distressSaleValue', e.target.value)} disabled={isReadOnly || !fields.enableCoverPageValueEdit} />
                  <span className="text-[10px] text-gray-500 mt-1 pl-1">Distressed Valuation of the Property field from Section 6</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-4 mb-4">
            <Field label="PURPOSE OF VALUATION">
              <select
                className={inputCls}
                value={fields.purposeOfValuationDropdown || 'default'}
                onChange={(e) => {
                  const val = e.target.value;
                  handleChange('purposeOfValuationDropdown', val);
                  if (val === 'default') {
                    handleChange('purposeOfValuation', 'TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY');
                  } else {
                    handleChange('purposeOfValuation', '');
                  }
                }}
                disabled={isReadOnly}
              >
                <option value="default">TO ASSESS THE FAIR MARKET VALUE OF THE COLLATERAL SECURITY</option>
                <option value="other">Other</option>
              </select>
            </Field>
            {fields.purposeOfValuationDropdown === 'other' && (
              <div className="mt-3">
                <textarea className={inputCls} rows={3} placeholder="Enter custom purpose of valuation..." value={fields.purposeOfValuation || ''} onChange={(e) => handleChange('purposeOfValuation', e.target.value)} disabled={isReadOnly} />
              </div>
            )}
          </div>
          <div className="border border-green-200 bg-green-50 rounded-xl p-4 mb-4">
            <h3 className="font-bold text-gray-700 mb-4">PREPARED BY</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Company/Entity Name"><input className={inputCls} value={fields.preparedByCompany || ''} onChange={e => handleChange('preparedByCompany', e.target.value)} disabled={isReadOnly} /></Field>
              <Field label="Professional Designation"><input className={inputCls} value={fields.preparedByDesignation || ''} onChange={e => handleChange('preparedByDesignation', e.target.value)} disabled={isReadOnly} /></Field>
            </div>
            <div className="border border-blue-200 bg-blue-50 rounded-md p-4 mt-4 mb-4">
              <h4 className="font-bold text-gray-700 mb-3">Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Plot Number"><input className={inputCls} value={fields.preparedByPlotNo || ''} onChange={e => handleChange('preparedByPlotNo', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="Street/Locality"><input className={inputCls} value={fields.preparedByStreet || ''} onChange={e => handleChange('preparedByStreet', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="City"><input className={inputCls} value={fields.preparedByCity || ''} onChange={e => handleChange('preparedByCity', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="State"><input className={inputCls} value={fields.preparedByState || ''} onChange={e => handleChange('preparedByState', e.target.value)} disabled={isReadOnly} /></Field>
                <Field label="PIN Code"><input className={inputCls} value={fields.preparedByPinCode || ''} onChange={e => handleChange('preparedByPinCode', e.target.value)} disabled={isReadOnly} /></Field>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Phone (Landline)">
                <input className={inputCls} value={fields.preparedByPhone || ''} onChange={e => { handleChange('preparedByPhone', e.target.value.replace(/[^0-9]/g, '')); }} disabled={isReadOnly} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputCls} value={fields.preparedByMobile || ''} onChange={e => { handleChange('preparedByMobile', e.target.value.replace(/[a-zA-Z]/g, '')); }} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </Section>
        {/* SECTION 2: CLIENT & APPLICATION DETAILS */}
        <Section id="arka-sec2" title="Client & Application Details" number={2}>
          {/* Container: Report Reference & Date - light orange */}
          <div className="border border-orange-200 bg-orange-50 rounded-xl p-5 mb-5">
            <h3 className="font-semibold text-orange-800 mb-4 text-sm tracking-wide uppercase">Report Reference & Date</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Reference No">
                <input className={inputCls} value={fields.refNo || ''} onChange={e => handleChange('refNo', e.target.value)} disabled={isReadOnly} placeholder="e.g. SMA-2026-001" />
              </Field>
              <BaseDateInput
                label="Date of Valuation Report"
                value={fields.dateOfReport || ''}
                onChange={val => handleChange('dateOfReport', val)}
                disabled={isReadOnly}
              />
            </div>
          </div>
          {/* Container: Customer Information - light blue */}
          <div className="border border-sky-200 bg-sky-50 rounded-xl p-5 mb-5">
            <h3 className="font-semibold text-sky-800 mb-4 text-sm tracking-wide uppercase">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name of the Customer">
                <input className={inputCls} value={fields.nameOfCustomer || ''} onChange={e => handleChange('nameOfCustomer', e.target.value)} disabled={isReadOnly} placeholder="Full name of the customer" />
              </Field>
              <Field label="Customer Contact Details">
                <input className={inputCls} value={fields.customerContactDetails || ''} onChange={e => handleChange('customerContactDetails', e.target.value)} disabled={isReadOnly} placeholder="Phone / Email" />
              </Field>
            </div>
          </div>
          {/* Container: Application & Documents - light amber */}
          <div className="border border-amber-200 bg-amber-50 rounded-xl p-5">
            <h3 className="font-semibold text-amber-800 mb-4 text-sm tracking-wide uppercase">Application & Documents</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="APP ID / Loan Account No">
                <input className={inputCls} value={fields.appIdLoanAccountNo || ''} onChange={e => handleChange('appIdLoanAccountNo', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Documents Provided">
                <select className={selectCls} value={fields.documentsProvided || ''} onChange={e => handleChange('documentsProvided', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Approved Layout">Approved Layout</option>
                  <option value="Approved Building Plan">Approved Building Plan</option>
                  <option value="NA Order">NA Order</option>
                  <option value="Four Boundaries Details">Four Boundaries Details</option>
                  <option value="Multiple">Multiple Documents</option>
                </select>
              </Field>
              {fields.documentsProvided === 'Multiple' && (
                <Field label="Specify Documents" span={2}>
                  <textarea className={inputCls} rows={2} value={fields.documentsProvidedOther || ''} onChange={e => handleChange('documentsProvidedOther', e.target.value)} disabled={isReadOnly} placeholder="List all documents provided..." />
                </Field>
              )}
            </div>
          </div>
        </Section>

        {/* SECTION 3: PROPERTY OVERVIEW & LOCATION */}
        <Section id="arka-sec3" title="Property Overview & Location" number={3}>
          {/* Container: Property Identification - light green */}
          <div className="border border-emerald-200 bg-emerald-50 rounded-xl p-5 mb-5">
            <h3 className="font-semibold text-emerald-800 mb-4 text-sm tracking-wide uppercase">Property Identification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field span={3} label="Property Details (Address)">
                <textarea 
                  className={inputCls} 
                  rows={3} 
                  value={fields.propertyDetailsAddress || ''} 
                  onChange={e => handleChange('propertyDetailsAddress', e.target.value)}
                  onBlur={e => extractPlotAndKhasra(e.target.value)}
                  disabled={isReadOnly} 
                  placeholder="Full address of the property" 
                />
              </Field>
              {/* Edit Switch for Plot No / Khasra No auto-extraction */}
              <div className="col-span-1 md:col-span-3 flex items-center gap-3 -mt-2 mb-1">
                <button
                  type="button"
                  onClick={() => setPlotKhasraEditMode(!plotKhasraEditMode)}
                  disabled={isReadOnly}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${plotKhasraEditMode ? 'bg-emerald-500' : 'bg-gray-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${plotKhasraEditMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                <span className={`text-xs font-medium ${plotKhasraEditMode ? 'text-emerald-700' : 'text-gray-500'}`}>
                  {plotKhasraEditMode ? 'Edit On' : 'Edit Off'} — Plot No & Khasra/Khata No {plotKhasraEditMode ? '(Manual Override)' : '(Auto-extracted from Address)'}
                </span>
              </div>
              <Field label="Plot No">
                <input 
                  className={`${inputCls} ${!plotKhasraEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                  value={fields.plotNo || ''} 
                  onChange={e => handleChange('plotNo', e.target.value)} 
                  disabled={isReadOnly || !plotKhasraEditMode} 
                  placeholder={plotKhasraEditMode ? 'Enter plot number' : ''}
                />
              </Field>
              <Field label="S No / G. No / Khasra No / Khata No">
                <input 
                  className={`${inputCls} ${!plotKhasraEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`} 
                  value={fields.khasraNoKhataNo || ''} 
                  onChange={e => handleChange('khasraNoKhataNo', e.target.value)} 
                  disabled={isReadOnly || !plotKhasraEditMode} 
                  placeholder={plotKhasraEditMode ? 'Enter Khasra/Khata number' : ''}
                />
              </Field>
              <Field label="Locality">
                <input className={inputCls} value={fields.locality || ''} onChange={e => handleChange('locality', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Road">
                <input className={inputCls} value={fields.road || ''} onChange={e => handleChange('road', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="City">
                <input className={inputCls} value={fields.city || ''} onChange={e => handleChange('city', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="District">
                <input className={inputCls} value={fields.district || ''} onChange={e => handleChange('district', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Pin Code">
                <input 
                  className={`${inputCls} ${fields.pinCode && fields.pinCode.length > 0 && fields.pinCode.length < 6 ? 'border-red-500' : ''}`} 
                  value={fields.pinCode || ''} 
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    handleChange('pinCode', val);
                  }}
                  onBlur={() => {
                    if (fields.pinCode && fields.pinCode.length > 0 && fields.pinCode.length < 6) {
                      setMessage({ type: 'error', text: 'PIN code must be exactly 6 digits' });
                      setTimeout(() => setMessage(null), 3000);
                    }
                  }}
                  disabled={isReadOnly} 
                  maxLength={6}
                />
                {fields.pinCode && fields.pinCode.length > 0 && fields.pinCode.length < 6 && (
                  <span className="text-red-500 text-xs mt-1">PIN code must be exactly 6 digits</span>
                )}
              </Field>
              <Field label="Nearby Land Mark">
                <input className={inputCls} value={fields.nearbyLandMark || ''} onChange={e => handleChange('nearbyLandMark', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
          {/* Container: Location Characteristics - light rose */}
          <div className="border border-rose-200 bg-rose-50 rounded-xl p-5">
            <h3 className="font-semibold text-rose-800 mb-4 text-sm tracking-wide uppercase">Location Characteristics</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Distance from City Center">
                <input className={inputCls} value={fields.distanceFromCityCenter || ''} onChange={e => handleChange('distanceFromCityCenter', e.target.value)} disabled={isReadOnly} placeholder="e.g. 5 KM" />
              </Field>
              <Field label="Availability of Local Transport">
                <select className={selectCls} value={fields.availabilityOfLocalTransport || ''} onChange={e => handleChange('availabilityOfLocalTransport', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Metro">Metro</option>
                  <option value="Local Train">Local Train</option>
                  <option value="Bus">Bus</option>
                  <option value="Auto/Taxi">Auto / Taxi</option>
                  <option value="Multiple">Multiple Modes</option>
                  <option value="custom">custom</option>
                </select>
                {fields.availabilityOfLocalTransport === 'custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.availabilityOfLocalTransportOther || ''} onChange={e => handleChange('availabilityOfLocalTransportOther', e.target.value)} disabled={isReadOnly} placeholder="Describe local transport..." />
                  </div>
                )}
              </Field>
              <Field label="Level of Land (Topographical Conditions)">
                <input className={inputCls} value={fields.levelOfLand || ''} onChange={e => handleChange('levelOfLand', e.target.value)} disabled={isReadOnly} placeholder="e.g. Plain / Elevated / Sloping" />
              </Field>
              <Field label="Class of Locality">
                <select className={selectCls} value={fields.classOfLocality || ''} onChange={e => handleChange('classOfLocality', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Posh">Posh</option>
                  <option value="Higher Middle Class">Higher Middle Class</option>
                  <option value="Middle Class">Middle Class</option>
                  <option value="Lower Middle Class">Lower Middle Class</option>
                  <option value="Poor">Poor</option>
                </select>
              </Field>
              <Field span={2} label="Quality of Infrastructure in the Vicinity">
                <select className={selectCls} value={fields.qualityOfInfrastructure || ''} onChange={e => handleChange('qualityOfInfrastructure', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Bad">Bad</option>
                  <option value="custom">custom</option>
                </select>
                {fields.qualityOfInfrastructure === 'custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.qualityOfInfrastructureOther || ''} onChange={e => handleChange('qualityOfInfrastructureOther', e.target.value)} disabled={isReadOnly} placeholder="Describe infrastructure quality..." />
                  </div>
                )}
              </Field>
            </div>
          </div>
        </Section>
        {/* SECTION 4: BOUNDARY DETAILS & PROPERTY CHARACTERISTICS */}
        <Section id="arka-sec4" title="Boundary Details & Property Characteristics" number={4}>
          {/* Container: Boundary Details - light purple */}
          <div className="border border-violet-200 bg-violet-50 rounded-xl p-5 mb-5">
            <h3 className="font-semibold text-violet-800 mb-4 text-sm tracking-wide uppercase">Boundary Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-violet-100">
                    <th className="border border-violet-200 px-3 py-2 text-left font-semibold text-violet-700">Direction</th>
                    <th className="border border-violet-200 px-3 py-2 text-left font-semibold text-violet-700">As per Sale Deed</th>
                    <th className="border border-violet-200 px-3 py-2 text-left font-semibold text-violet-700">As per Actual</th>
                    <th className="border border-violet-200 px-3 py-2 text-left font-semibold text-violet-700">Boundaries of Property as per sketch map</th>
                  </tr>
                </thead>
                <tbody>
                  {(['East', 'West', 'North', 'South'] as const).map((dir) => {
                    const lower = dir.toLowerCase();
                    return (
                      <tr key={dir} className="bg-white hover:bg-violet-50/50 transition-colors">
                        <td className="border border-violet-200 px-3 py-2 font-medium text-gray-700">{dir}</td>
                        <td className="border border-violet-200 px-1 py-1">
                          <input className={inputCls} value={fields[`${lower}SaleDeed`] || ''} onChange={e => handleChange(`${lower}SaleDeed`, e.target.value)} disabled={isReadOnly} />
                        </td>
                        <td className="border border-violet-200 px-1 py-1">
                          <input className={inputCls} value={fields[`${lower}Actual`] || ''} onChange={e => handleChange(`${lower}Actual`, e.target.value)} disabled={isReadOnly} />
                        </td>
                        <td className="border border-violet-200 px-1 py-1">
                          <input className={inputCls} value={fields[`${lower}SketchMap`] || ''} onChange={e => handleChange(`${lower}SketchMap`, e.target.value)} disabled={isReadOnly} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <Field label="Do the boundaries at site match as mentioned in documentation?">
                <input className={inputCls} value={fields.boundariesMatch || ''} onChange={e => handleChange('boundariesMatch', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
          {/* Container: Property Specifications & Usage - light cyan */}
          <div className="border border-cyan-200 bg-cyan-50 rounded-xl p-5">
            <h3 className="font-semibold text-cyan-800 mb-4 text-sm tracking-wide uppercase">Property Specifications & Usage</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Status of the Land / Flat">
                <select className={selectCls} value={fields.landStatus || ''} onChange={e => handleChange('landStatus', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Free Hold">Free Hold</option>
                  <option value="Lease Hold">Lease Hold</option>
                  <option value="Development Authority">Development Authority</option>
                  <option value="NA">NA</option>
                  <option value="custom">custom</option>
                </select>
                {fields.landStatus === 'custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.landStatusOther || ''} onChange={e => handleChange('landStatusOther', e.target.value)} disabled={isReadOnly} placeholder="Describe status..." />
                  </div>
                )}
              </Field>
              <Field label="Type of Property">
                <select className={selectCls} value={fields.propertyType || ''} onChange={e => handleChange('propertyType', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Bungalow">Bungalow</option>
                  <option value="Row House">Row House</option>
                  <option value="Plot">Plot</option>
                  <option value="Flat - 1BHK">Flat (1BHK)</option>
                  <option value="Flat - 2BHK">Flat (2BHK)</option>
                  <option value="Flat - 3BHK">Flat (3BHK)</option>
                  <option value="Commercial">Commercial</option>
                  <option value="NA">NA</option>
                  <option value="custom">custom</option>
                </select>
                {fields.propertyType === 'custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.propertyTypeOther || ''} onChange={e => handleChange('propertyTypeOther', e.target.value)} disabled={isReadOnly} placeholder="Describe property type..." />
                  </div>
                )}
              </Field>
              <Field label="Approved Usage of Property">
                <select className={selectCls} value={fields.approvedUsage || ''} onChange={e => handleChange('approvedUsage', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Mixed">Mixed</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Residential">Residential</option>
                  <option value="NA">NA</option>
                  <option value="custom">custom</option>
                </select>
                {fields.approvedUsage === 'custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.approvedUsageOther || ''} onChange={e => handleChange('approvedUsageOther', e.target.value)} disabled={isReadOnly} placeholder="Describe approved usage..." />
                  </div>
                )}
              </Field>
              <Field label="Actual Usage of the Property">
                <select className={selectCls} value={fields.actualUsage || ''} onChange={e => handleChange('actualUsage', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Agricultural">Agricultural</option>
                  <option value="Industrial">Industrial</option>
                  <option value="Commercial">Commercial</option>
                  <option value="Residential">Residential</option>
                  <option value="Mixed">Mixed</option>
                  <option value="NA">NA</option>
                  <option value="custom">custom</option>
                </select>
                {fields.actualUsage === 'custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.actualUsageOther || ''} onChange={e => handleChange('actualUsageOther', e.target.value)} disabled={isReadOnly} placeholder="Describe actual usage..." />
                  </div>
                )}
              </Field>
              <Field label="Type of Structure">
                <select className={selectCls} value={fields.structureType || ''} onChange={e => handleChange('structureType', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Load Bearing">Load Bearing</option>
                  <option value="RCC">RCC</option>
                  <option value="Aluform Shuttering">Aluform Shuttering</option>
                  <option value="NA">NA</option>
                  <option value="custom">custom</option>
                </select>
                {fields.structureType === 'custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.structureTypeOther || ''} onChange={e => handleChange('structureTypeOther', e.target.value)} disabled={isReadOnly} placeholder="Describe structure type..." />
                  </div>
                )}
              </Field>
              <Field label="No. of Floors">
                <input className={inputCls} type="number" min="0" value={fields.numberOfFloors || ''} onChange={e => handleChange('numberOfFloors', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Occupancy Details">
                <select className={selectCls} value={fields.occupancyDetails || ''} onChange={e => handleChange('occupancyDetails', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Self Occupied">Self Occupied</option>
                  <option value="Rented">Rented</option>
                  <option value="Vacant">Vacant</option>
                  <option value="NA">NA</option>
                  <option value="custom">custom</option>
                </select>
                {fields.occupancyDetails === 'custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.occupancyDetailsOther || ''} onChange={e => handleChange('occupancyDetailsOther', e.target.value)} disabled={isReadOnly} placeholder="Describe occupancy..." />
                  </div>
                )}
              </Field>
              <Field label="Electricity / Water / Drainage Connection">
                <select className={selectCls} value={fields.electricityWaterDrainage || ''} onChange={e => handleChange('electricityWaterDrainage', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="All Available">All Available (Electricity, Water & Drainage)</option>
                  <option value="Electricity & Water Only">Electricity & Water Only</option>
                  <option value="Electricity Only">Electricity Only</option>
                  <option value="None">None</option>
                  <option value="NA">NA</option>
                  <option value="custom">custom</option>
                </select>
                {fields.electricityWaterDrainage === 'custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.electricityWaterDrainageOther || ''} onChange={e => handleChange('electricityWaterDrainageOther', e.target.value)} disabled={isReadOnly} placeholder="Describe connections..." />
                  </div>
                )}
              </Field>
              <Field span={2} label="Proximity to Civic Amenities (School, Hospital, Market, etc.)">
                <input className={inputCls} value={fields.proximityToCivicAmenities || ''} onChange={e => handleChange('proximityToCivicAmenities', e.target.value)} disabled={isReadOnly} placeholder="e.g. School 0.5 km, Hospital 1 km..." />
              </Field>
              <Field span={2} label="Development of Surrounding Area">
                <input className={inputCls} value={fields.developmentOfSurroundingArea || ''} onChange={e => handleChange('developmentOfSurroundingArea', e.target.value)} disabled={isReadOnly} placeholder="Describe surrounding development..." />
              </Field>
              <Field label="Longitude">
                <input className={inputCls} value={fields.longitude || ''} onChange={e => handleChange('longitude', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label="Latitude">
                <input className={inputCls} value={fields.latitude || ''} onChange={e => handleChange('latitude', e.target.value)} disabled={isReadOnly} />
              </Field>
            </div>
          </div>
        </Section>
        {/* SECTION 5: CONSTRUCTION & REGULATORY APPROVALS */}
        <Section id="arka-sec5" title="Construction & Regulatory Approvals" number={5}>
          {/* Container: Approval Details - light orange */}
          <div className="border border-orange-200 bg-orange-50 rounded-xl p-5 mb-5">
            <h3 className="font-semibold text-orange-800 mb-4 text-sm tracking-wide uppercase">Approval Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Building Plan Approval No">
                <input className={inputCls} value={fields.buildingPlanApprovalNo || ''} onChange={e => handleChange('buildingPlanApprovalNo', e.target.value)} disabled={isReadOnly} />
              </Field>
              <Field label={
                <div className="flex items-center gap-3">
                  <span>Date of Approval</span>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 cursor-pointer bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded border border-gray-200 transition-colors">
                    <input type="checkbox" className="w-3 h-3 rounded border-gray-300 text-orange-600 focus:ring-orange-500" checked={fields.dateOfApproval === 'NA'} onChange={e => handleChange('dateOfApproval', e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                    NA
                  </label>
                </div>
              }>
                <BaseDateInput value={fields.dateOfApproval === 'NA' ? '' : (fields.dateOfApproval || '')} onChange={val => handleChange('dateOfApproval', val)} disabled={isReadOnly || fields.dateOfApproval === 'NA'} />
              </Field>
              <Field label={
                <div className="flex items-center gap-3">
                  <span>Expiry Date</span>
                  <label className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 cursor-pointer bg-gray-100 hover:bg-gray-200 px-1.5 py-0.5 rounded border border-gray-200 transition-colors">
                    <input type="checkbox" className="w-3 h-3 rounded border-gray-300 text-orange-600 focus:ring-orange-500" checked={fields.expiryDate === 'NA'} onChange={e => handleChange('expiryDate', e.target.checked ? 'NA' : '')} disabled={isReadOnly} />
                    NA
                  </label>
                </div>
              }>
                <BaseDateInput value={fields.expiryDate === 'NA' ? '' : (fields.expiryDate || '')} onChange={val => handleChange('expiryDate', val)} disabled={isReadOnly || fields.expiryDate === 'NA'} />
              </Field>
              <Field label="Expected Completion">
                <input className={inputCls} value={fields.expectedCompletion || ''} onChange={e => handleChange('expectedCompletion', e.target.value)} disabled={isReadOnly} placeholder="e.g. Dec 2026" />
              </Field>
            </div>
          </div>
          {/* Container: Construction Details - light teal */}
          <div className="border border-teal-200 bg-teal-50 rounded-xl p-5">
            <h3 className="font-semibold text-teal-800 mb-4 text-sm tracking-wide uppercase">Construction Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <Field label="Area of the Plot / Flat">
                <input className={inputCls} value={fields.areaOfPlot || ''} onChange={e => handleChange('areaOfPlot', e.target.value)} disabled={isReadOnly} placeholder="in sq. ft." />
              </Field>
              <Field label="Demarcation at Site">
                <select className={selectCls} value={fields.demarcationAtSite || ''} onChange={e => handleChange('demarcationAtSite', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                  <option value="Partially">Partially</option>
                  <option value="NA">NA</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.demarcationAtSite === 'Custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.demarcationAtSiteOther || ''} onChange={e => handleChange('demarcationAtSiteOther', e.target.value)} disabled={isReadOnly} placeholder="Describe demarcation..." />
                  </div>
                )}
              </Field>
            </div>
            {/* Approved BUA Table */}
            <div className="border border-teal-200 bg-white rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-teal-700 text-sm">Approved Built Up Area (Floor-wise)</h4>
                  <p className="text-red-500 text-[10px] mt-0.5">(Floor names given below can be rename/ editable)</p>
                </div>
                <button type="button" className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 text-xs rounded-md shadow-sm transition-colors mt-1" onClick={() => handleAddBuaFloor('approvedBuaFloors')} disabled={isReadOnly}>+ Add Floor</button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-3 items-center px-1 -mb-1">
                  <div className="flex-1"></div>
                  <div className="flex flex-1 gap-2">
                    <span className="flex-1 text-[11px] font-semibold text-teal-800">RCC Area(sqft)</span>
                    <span className="flex-1 text-[11px] font-semibold text-teal-800">ACC Area(sqft)</span>
                  </div>
                  {(fields.approvedBuaFloors?.length > 1) && <div className="w-5"></div>}
                </div>
                {(fields.approvedBuaFloors || []).map((f: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input className={`${inputCls} flex-1`} value={f.floor} onChange={e => { const arr = [...fields.approvedBuaFloors]; arr[idx] = { ...arr[idx], floor: e.target.value }; handleChange('approvedBuaFloors', arr); }} disabled={isReadOnly} placeholder="Floor name" />
                    <div className="flex flex-1 gap-2">
                      <input className={`${inputCls} flex-1`} value={f.rccArea} onChange={e => { const arr = [...fields.approvedBuaFloors]; arr[idx] = { ...arr[idx], rccArea: e.target.value }; handleChange('approvedBuaFloors', arr); }} disabled={isReadOnly} placeholder="RCC Area" />
                      <input className={`${inputCls} flex-1`} value={f.accArea} onChange={e => { const arr = [...fields.approvedBuaFloors]; arr[idx] = { ...arr[idx], accArea: e.target.value }; handleChange('approvedBuaFloors', arr); }} disabled={isReadOnly} placeholder="ACC Area" />
                    </div>
                    {(fields.approvedBuaFloors?.length > 1) && (
                      <button type="button" className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1" onClick={() => handleRemoveBuaFloor('approvedBuaFloors', idx)} disabled={isReadOnly}>&#x2715;</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            {/* Measured BUA Table */}
            <div className="border border-teal-200 bg-white rounded-lg p-4 mb-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-teal-700 text-sm">Measured Built Up Area (Floor-wise)</h4>
                  <p className="text-red-500 text-[10px] mt-0.5">(Floor names given below can be rename/ editable)</p>
                </div>
                <button type="button" className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 text-xs rounded-md shadow-sm transition-colors mt-1" onClick={() => handleAddBuaFloor('measuredBuaFloors')} disabled={isReadOnly}>+ Add Floor</button>
              </div>
              <div className="space-y-2">
                <div className="flex gap-3 items-center px-1 -mb-1">
                  <div className="flex-1"></div>
                  <div className="flex flex-1 gap-2">
                    <span className="flex-1 text-[11px] font-semibold text-teal-800">RCC Area(sqft)</span>
                    <span className="flex-1 text-[11px] font-semibold text-teal-800">ACC Area(sqft)</span>
                  </div>
                  {(fields.measuredBuaFloors?.length > 1) && <div className="w-5"></div>}
                </div>
                {(fields.measuredBuaFloors || []).map((f: any, idx: number) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <input className={`${inputCls} flex-1`} value={f.floor} onChange={e => { const arr = [...fields.measuredBuaFloors]; arr[idx] = { ...arr[idx], floor: e.target.value }; handleChange('measuredBuaFloors', arr); }} disabled={isReadOnly} placeholder="Floor name" />
                    <div className="flex flex-1 gap-2">
                      <input className={`${inputCls} flex-1`} value={f.rccArea} onChange={e => { const arr = [...fields.measuredBuaFloors]; arr[idx] = { ...arr[idx], rccArea: e.target.value }; handleChange('measuredBuaFloors', arr); }} disabled={isReadOnly} placeholder="RCC Area" />
                      <input className={`${inputCls} flex-1`} value={f.accArea} onChange={e => { const arr = [...fields.measuredBuaFloors]; arr[idx] = { ...arr[idx], accArea: e.target.value }; handleChange('measuredBuaFloors', arr); }} disabled={isReadOnly} placeholder="ACC Area" />
                    </div>
                    {(fields.measuredBuaFloors?.length > 1) && (
                      <button type="button" className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1" onClick={() => handleRemoveBuaFloor('measuredBuaFloors', idx)} disabled={isReadOnly}>&#x2715;</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field span={2} label="Is the construction as per approved building plan / local bye laws?">
                <select className={selectCls} value={fields.constructionAsPerPlan || ''} onChange={e => handleChange('constructionAsPerPlan', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Yes (As per approved plan)">Yes (As per approved plan)</option>
                  <option value="Yes (As per local byelaws)">Yes (As per local byelaws)</option>
                  <option value="Yes (As per both approved plan and local byelaws)">Yes (As per both approved plan and local byelaws)</option>
                  <option value="No">No</option>
                  <option value="NA">NA</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.constructionAsPerPlan === 'Custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.constructionAsPerPlanOther || ''} onChange={e => handleChange('constructionAsPerPlanOther', e.target.value)} disabled={isReadOnly} placeholder="Describe details..." />
                  </div>
                )}
              </Field>
              <Field label="Quality of Construction">
                <select className={selectCls} value={fields.qualityOfConstruction || ''} onChange={e => handleChange('qualityOfConstruction', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Good">Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                  <option value="NA">NA</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.qualityOfConstruction === 'Custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.qualityOfConstructionOther || ''} onChange={e => handleChange('qualityOfConstructionOther', e.target.value)} disabled={isReadOnly} placeholder="Describe quality..." />
                  </div>
                )}
              </Field>
              <Field label="Maintenance of the Property">
                <select className={selectCls} value={fields.maintenanceOfProperty || ''} onChange={e => handleChange('maintenanceOfProperty', e.target.value)} disabled={isReadOnly}>
                  <option value="">-- Select --</option>
                  <option value="Excellent">Excellent</option>
                  <option value="Very Good">Very Good</option>
                  <option value="Average">Average</option>
                  <option value="Poor">Poor</option>
                  <option value="NA">NA</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.maintenanceOfProperty === 'Custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.maintenanceOfPropertyOther || ''} onChange={e => handleChange('maintenanceOfPropertyOther', e.target.value)} disabled={isReadOnly} placeholder="Describe maintenance..." />
                  </div>
                )}
              </Field>
              <Field label="Current Life of the Structure">
                <input className={inputCls} value={fields.currentLifeOfStructure || ''} onChange={e => handleChange('currentLifeOfStructure', e.target.value)} disabled={isReadOnly} placeholder="e.g. 10 years" />
              </Field>
              <Field label="Projected Life of the Structure">
                <input className={inputCls} value={fields.projectedLifeOfStructure || ''} onChange={e => handleChange('projectedLifeOfStructure', e.target.value)} disabled={isReadOnly} placeholder="e.g. 50 years" />
              </Field>
            </div>
          </div>
        </Section>
        {/* SECTION 6: VALUATION DETAILS */}
        <Section id="arka-sec6" title="Valuation Details" number={6}>
          {/* Container: Recommended Valuation - light indigo */}
          <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-5 mb-5">
            <h3 className="font-semibold text-indigo-800 mb-4 text-sm tracking-wide uppercase">Recommended Valuation</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Recommended Rate of the Plot / Flat" className="self-end">
                <input className={inputCls} value={fields.recommendedRateOfPlot || ''} onChange={e => handleChange('recommendedRateOfPlot', e.target.value)} disabled={isReadOnly} placeholder="&#8377; per sq. ft." />
              </Field>
              <Field 
                label={
                  <>
                    <div>
                      <span>Value of the Plot / Flat</span>
                      <span className="block normal-case mt-0.5">(Area of the Plot / Flat * Recommended Rate of the Plot / Flat)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => handleChange('enableEditValueOfPlot', !fields.enableEditValueOfPlot)} disabled={isReadOnly} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.enableEditValueOfPlot ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.enableEditValueOfPlot ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-medium normal-case ${fields.enableEditValueOfPlot ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {fields.enableEditValueOfPlot ? 'Edit On' : 'Edit Off'}
                      </span>
                    </div>
                  </>
                }
              >
                <input className={`${inputCls} ${!fields.enableEditValueOfPlot ? 'bg-gray-50' : ''}`} value={fields.valueOfPlot || ''} onChange={e => handleChange('valueOfPlot', e.target.value)} disabled={isReadOnly || !fields.enableEditValueOfPlot} placeholder="&#8377;" />
              </Field>
              <Field label="Estimated Cost of Construction">
                <input className={inputCls} value={fields.estimatedCostOfConstruction || ''} onChange={e => handleChange('estimatedCostOfConstruction', e.target.value)} disabled={isReadOnly} placeholder="&#8377;" />
              </Field>
              <Field label="Construction Rate">
                <input className={inputCls} value={fields.constructionRate || ''} onChange={e => handleChange('constructionRate', e.target.value)} disabled={isReadOnly} placeholder="&#8377; per sq. ft." />
              </Field>
              <Field 
                label={
                  <>
                    <div>
                      <span>Total Cost of Construction (Total Measured RCC)</span>
                      <span className="block normal-case mt-0.5">(Total of RCC Area(sqft) column * Construction Rate)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => handleChange('enableEditTotalCost', !fields.enableEditTotalCost)} disabled={isReadOnly} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.enableEditTotalCost ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.enableEditTotalCost ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-medium normal-case ${fields.enableEditTotalCost ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {fields.enableEditTotalCost ? 'Edit On' : 'Edit Off'}
                      </span>
                    </div>
                  </>
                }
              >
                <input className={`${inputCls} ${!fields.enableEditTotalCost ? 'bg-gray-50' : ''}`} value={fields.totalCostOfConstructionMeasured || ''} onChange={e => handleChange('totalCostOfConstructionMeasured', e.target.value)} disabled={isReadOnly || !fields.enableEditTotalCost} placeholder="&#8377;" />
              </Field>
              <Field 
                span={2} 
                label={
                  <>
                    <div>
                      <span>Depreciation Value</span>
                      <span className="block normal-case mt-0.5">(Total of RCC Area(sqft) column * Construction Rate)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => handleChange('enableEditDepreciation', !fields.enableEditDepreciation)} disabled={isReadOnly} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.enableEditDepreciation ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.enableEditDepreciation ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-medium normal-case ${fields.enableEditDepreciation ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {fields.enableEditDepreciation ? 'Edit On' : 'Edit Off'}
                      </span>
                    </div>
                  </>
                }
              >
                <input className={`${inputCls} font-bold ${!fields.enableEditDepreciation ? 'bg-gray-50' : ''}`} value={fields.depreciationValue || ''} onChange={e => handleChange('depreciationValue', e.target.value)} disabled={isReadOnly || !fields.enableEditDepreciation} placeholder="&#8377;" />
              </Field>
              <Field label="Stage of Construction">
                <input className={inputCls} value={fields.stageOfConstruction || ''} onChange={e => handleChange('stageOfConstruction', e.target.value)} disabled={isReadOnly} placeholder="e.g. Completed / Plinth / Superstructure" />
              </Field>
              <Field label="% Work Completed">
                <input className={inputCls} value={fields.percentWorkCompleted || ''} onChange={e => handleChange('percentWorkCompleted', e.target.value)} disabled={isReadOnly} placeholder="e.g. 100%" />
              </Field>
              <Field label="% Disbursement Recommended" className="self-end">
                <input className={inputCls} value={fields.percentDisbursementRecommended || ''} onChange={e => handleChange('percentDisbursementRecommended', e.target.value)} disabled={isReadOnly} placeholder="e.g. 100%" />
              </Field>
              <Field 
                label={
                  <>
                    <div>
                      <span>Current Value of Property (Plot + Construction)</span>
                      <span className="block normal-case mt-0.5">(Value of the Plot / Flat + Depreciation Value)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => handleChange('enableEditCurrentValue', !fields.enableEditCurrentValue)} disabled={isReadOnly} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.enableEditCurrentValue ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.enableEditCurrentValue ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`text-xs font-medium normal-case ${fields.enableEditCurrentValue ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {fields.enableEditCurrentValue ? 'Edit On' : 'Edit Off'}
                      </span>
                    </div>
                  </>
                }
              >
                <input className={`${inputCls} font-bold ${!fields.enableEditCurrentValue ? 'bg-gray-50' : ''}`} value={fields.currentValueOfTheProperty || ''} onChange={e => handleChange('currentValueOfTheProperty', e.target.value)} disabled={isReadOnly || !fields.enableEditCurrentValue} placeholder="&#8377;" />
              </Field>
              <BaseDateInput
                span={2}
                label="Date of Property Visit"
                value={fields.dateOfPropertyVisit || ''}
                onChange={val => handleChange('dateOfPropertyVisit', val)}
                disabled={isReadOnly}
              />
            </div>
          </div>
          {/* Container: Additional Valuations - light lime */}
          <div className="border border-lime-200 bg-lime-50 rounded-xl p-5">
            <h3 className="font-semibold text-lime-800 mb-4 text-sm tracking-wide uppercase">Additional Valuations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Valuation as per Government Reckoner Rates" className="self-end">
                <input className={inputCls} value={fields.valuationAsPerGovernmentReckoner || ''} onChange={e => handleChange('valuationAsPerGovernmentReckoner', e.target.value)} disabled={isReadOnly} placeholder="&#8377;" />
              </Field>
              <Field 
                label={
                  <>
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span>Distressed Valuation of the Property</span>
                        <button type="button" onClick={() => handleChange('enableEditDistressed', !fields.enableEditDistressed)} disabled={isReadOnly} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${fields.enableEditDistressed ? 'bg-emerald-500' : 'bg-gray-300'} ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow ${fields.enableEditDistressed ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`text-xs font-medium normal-case ${fields.enableEditDistressed ? 'text-emerald-700' : 'text-gray-500'}`}>
                          {fields.enableEditDistressed ? 'Edit On' : 'Edit Off'}
                        </span>
                      </div>
                      <span className="block normal-case mt-0.5">([CURRENT VALUE OF PROPERTY (PLOT + CONSTRUCTION)] * 0.80 (Standard 80% distress factor))</span>
                    </div>
                  </>
                }
              >
                <input className={`${inputCls} font-bold ${!fields.enableEditDistressed ? 'bg-gray-50' : ''}`} value={fields.distressedValuation || ''} onChange={e => handleChange('distressedValuation', e.target.value)} disabled={isReadOnly || !fields.enableEditDistressed} placeholder="&#8377;" />
              </Field>
              <Field label="Rental Value per Month">
                <input className={inputCls} value={fields.rentalValuePerMonth || ''} onChange={e => handleChange('rentalValuePerMonth', e.target.value)} disabled={isReadOnly} placeholder="&#8377; / month" />
              </Field>
            </div>
          </div>
          {/* Container: Attachments - light orange */}
          <div className="border border-orange-200 bg-orange-50 rounded-xl p-5 mt-5">
            <h3 className="font-semibold text-orange-800 mb-4 text-sm tracking-wide uppercase">Attachments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="4 photos of the Property from inside/outside are attached">
                <select className={selectCls} value={fields.photosAttached || 'Attached'} onChange={e => handleChange('photosAttached', e.target.value)} disabled={isReadOnly}>
                  <option value="Attached">Attached</option>
                  <option value="Not Attached">Not Attached</option>
                  <option value="NA">NA</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.photosAttached === 'Custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.photosAttachedOther || ''} onChange={e => handleChange('photosAttachedOther', e.target.value)} disabled={isReadOnly} placeholder="Enter details..." />
                  </div>
                )}
              </Field>
              <Field label="Location sketch for the property">
                <select className={selectCls} value={fields.locationSketchAttached || 'Attached'} onChange={e => handleChange('locationSketchAttached', e.target.value)} disabled={isReadOnly}>
                  <option value="Attached">Attached</option>
                  <option value="Not Attached">Not Attached</option>
                  <option value="NA">NA</option>
                  <option value="Custom">Custom</option>
                </select>
                {fields.locationSketchAttached === 'Custom' && (
                  <div className="mt-3">
                    <input className={inputCls} value={fields.locationSketchAttachedOther || ''} onChange={e => handleChange('locationSketchAttachedOther', e.target.value)} disabled={isReadOnly} placeholder="Enter details..." />
                  </div>
                )}
              </Field>
            </div>
          </div>
        </Section>

        {/* SECTION 7: REMARKS & UNDERTAKING */}
        <Section id="arka-sec7" title="Remarks & Undertaking" number={7}>
          {/* Container: Remarks - light yellow */}
          <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-5 mb-5">
            <h3 className="font-semibold text-yellow-800 mb-4 text-sm tracking-wide uppercase">Remarks</h3>
            <div className="grid grid-cols-1 gap-4">
              <Field label="COMMENT ON">
                <textarea 
                  className={inputCls} 
                  rows={3} 
                  value={fields.commentOn ?? '(Comment on - resistance for valuation if any from the current occupants for rented property, if the property falls in a community dominated areas, if the approach road to the building is small and will not be able to accommodate a fire extinguisher, does the property falls under land locked area or is prone to frequent floods & any other critical observation.)'} 
                  onChange={e => handleChange('commentOn', e.target.value)} 
                  disabled={isReadOnly} 
                  placeholder="Enter comments..." 
                />
              </Field>
              <Field label="Remarks Details">
                <textarea 
                  className={inputCls} 
                  rows={4} 
                  value={fields.remarksDetails ?? 'Subject property is a single storied residential cum commercial building, land extent of 2613sqft, having total measured BUA 923sqft (RCC-663sqft & ACC-260sqft). Approved plan is not provided. Property is accessible with 30-Feet wide road. All civic amenities are within 1-2 Kms & about 27 Kms from Nayagarh city centre. This plot is coming Ranganipatna GP limit. This Building is occupied by the customer for residential cum commercial purpose. Valuation has been done for land & measured BUA of RCC GF only. As approved plan is not provided, it is up to sole discretion of Arka Finance to consider the BUA value or not.'} 
                  onChange={e => handleChange('remarksDetails', e.target.value)} 
                  disabled={isReadOnly} 
                  placeholder="Enter remarks details..." 
                />
              </Field>
            </div>
          </div>
          
          {/* Container: Declaration - light blue */}
          <div className="border border-blue-200 bg-blue-50 rounded-xl p-5">
            <h3 className="font-semibold text-blue-800 mb-4 text-sm tracking-wide uppercase">Declaration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Undertaking Details" span={2}>
                <textarea 
                  className={inputCls} 
                  rows={4} 
                  value={fields.undertakingDetails ?? 'I have personally visited the property & identified the same based on the documents provided.\nI/We have no direct or Indirect Interest in the property being valued.\nThe information furnished above is true and correct to my/our knowledge.'} 
                  onChange={e => handleChange('undertakingDetails', e.target.value)} 
                  disabled={isReadOnly} 
                  placeholder="Enter undertaking details..." 
                />
              </Field>
              <Field label="Name of Valuer">
                <input 
                  className={inputCls} 
                  value={fields.nameOfValuer ?? 'Er. Satyajit Mohanty'} 
                  onChange={e => handleChange('nameOfValuer', e.target.value)} 
                  disabled={isReadOnly} 
                  placeholder="Enter valuer name..." 
                />
              </Field>
              <Field label="Designation">
                <input 
                  className={inputCls} 
                  value={fields.designation ?? 'Approved Panel Valuer'} 
                  onChange={e => handleChange('designation', e.target.value)} 
                  disabled={isReadOnly} 
                  placeholder="Enter designation..." 
                />
              </Field>
            </div>
          </div>
        </Section>

        <BasePhotographsSection
          title="Property Photographs"
          sectionId="arka-photos"
          sectionNumber={8}
          propertyImages={fields.propertyImages || []}
          propertyImageNames={fields.propertyImageNames || []}
          isReadOnly={isReadOnly}
          uploading={uploading}
          bucketCount={bucketImages?.length || 0}
          onOpenBucketPicker={() => setBucketPickerOpen(true)}
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
          onReorderImages={(newImgs: string[], newNames: string[]) => {
            handleChange('propertyImages', newImgs);
            handleChange('propertyImageNames', newNames);
          }}
          withoutSectionWrapper={false}
        />

        <BaseMapsSection
          title="Location and Sketch Maps"
          sectionId="arka-maps"
          sectionNumber={9}
          locationMapImages={fields.locationMapImages || []}
          mouzaMapImages={fields.mouzaMapImages || []}
          sketchMapImages={fields.sketchMapImages || []}
          cadastralMapImages={fields.cadastralMapImages || []}
          latitude={fields.latitude}
          longitude={fields.longitude}
          propertyAddress={fields.arkaAddressOfTheProperty || ""}
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