'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import {
  Section,
  Field,
  inputCls,
  selectCls,
  FloatingNavigator,
  ActiveConfigBanner,
  ReportActionBar,
  NavItem,
  formatReportDate,
  BaseDateInput,
  BaseDocumentsSection,
  BasePhotographsSection,
  BaseMapsSection,
  BasePhotoBucketModal,
  fetchBytes,
  getEarliestFieldVisit,
  EarliestFieldVisitBadge,
  DEFAULT_DOCUMENT_LABEL,
  DEFAULT_PHOTO_LABEL,
} from '../BaseBankReportComponents';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';
import { rupeesInWords, formatIndianCurrency } from '@/lib/numberToWords';
import { BankConfig } from '@/lib/bank-fields';
import { decodeHtmlEntitiesDeep } from '@/lib/html-entities';
import { PDFIDFCFirstBankRenderer } from '@/lib/banks/pdf-idfc-first-bank-renderer';

export const IDFC_FIRST_BANK_CONFIG: BankConfig = {
  bankId: 'IDFC FIRST BANK',
  subTemplateId: 'TECHNICAL APPRAISAL REPORT',
  displayName: 'IDFC FIRST Bank — Technical Appraisal Report',
  defaultValues: {
    purpose: 'Home Loan / LAP / Construction Valuation',
  },
};

export interface IDFCFirstBankProps {
  projectId: string;
  projectCode: string;
  initialFields: any;
  status: string;
  userRole: string;
  bucketImages?: any[];
  prefill?: any;
}

export default function IDFCFirstBank({
  projectId,
  projectCode,
  initialFields,
  status,
  userRole,
  bucketImages = [],
  prefill,
}: IDFCFirstBankProps) {
  const router = useRouter();

  // Navigation Items
  const navSections: NavItem[] = [
    { id: 'sec-header', title: '1. Case & Ref' },
    { id: 'sec-basic', title: '2. Basic Details' },
    { id: 'sec-surrounding', title: '3. Surrounding & Locality' },
    { id: 'sec-property', title: '4. Property & Building' },
    { id: 'sec-sanction', title: '5. Sanctions & Approvals' },
    { id: 'sec-setbacks', title: '6. Setbacks & Areas' },
    { id: 'sec-valuation', title: '7. Valuation Engine' },
    { id: 'sec-boundaries', title: '8. Boundaries & Remarks' },
    { id: 'sec-documents', title: '9. Verified Documents' },
    { id: 'sec-maps', title: '10. Maps & Location Sketch' },
    { id: 'sec-photos', title: '11. Property Photographs' },
  ];

  // Earliest visit info
  const earliestVisit = useMemo(() => {
    return getEarliestFieldVisit(initialFields, prefill);
  }, [initialFields, prefill]);

  // Form State
  const [formData, setFormData] = useState<Record<string, any>>(() => {
    const raw = initialFields?.raw_json || initialFields || {};
    const d = decodeHtmlEntitiesDeep(raw);

    return {
      // Header & Case Ref
      report_ref_no: d.report_ref_no || `SMA/IDFC/HL/${new Date().getFullYear()}/${projectCode || '01'}`,
      report_date: d.report_date || formatReportDate(new Date().toISOString()),
      branch_name: d.branch_name || prefill?.branchName || '',
      case_type: d.case_type || 'HL',
      valuer_name: d.valuer_name || 'ER. SATYAJIT MOHANTY',
      inspection_date: d.inspection_date || earliestVisit?.date || prefill?.fieldVisitDate || '',
      case_ref_no: d.case_ref_no || projectCode || '',
      contact_person: d.contact_person || prefill?.contactName || '',
      contact_phone: d.contact_phone || prefill?.contactPhone || '',

      // Basic Details (1-4)
      applicant_name: d.applicant_name || prefill?.applicantName || prefill?.contactName || '',
      property_type_desc: d.property_type_desc || prefill?.propertyType || '',
      current_usage: d.current_usage || prefill?.currentUsage || 'Residential',
      property_address_site: d.property_address_site || prefill?.propertyAddress || '',
      property_address_doc: d.property_address_doc || prefill?.propertyAddress || '',
      prior_valuation_done: d.prior_valuation_done || 'No',

      // Surrounding & Locality (5-8)
      approved_usage: d.approved_usage || 'Residential',
      class_of_locality: d.class_of_locality || 'Middle',
      site_status: d.site_status || 'Developing',
      proximity_civic_amenities: d.proximity_civic_amenities || 'Within 1-2Kms',
      proximity_railway: d.proximity_railway || '',
      proximity_bus: d.proximity_bus || '',
      landmark: d.landmark || prefill?.landmark || '',
      distance_city_centre: d.distance_city_centre || '',
      approach_road_width: d.approach_road_width || '',
      approach_road_condition: d.approach_road_condition || '',

      // Property & Building (9-13)
      occupant_status: d.occupant_status || 'Owner',
      occupant_name: d.occupant_name || prefill?.applicantName || prefill?.contactName || 'NA',
      relation_with_applicant: d.relation_with_applicant || 'Self',
      property_demarcation: d.property_demarcation || 'Yes',
      property_identified_through: d.property_identified_through || 'Identified by documents (Sale deed, ROR)',
      type_of_structure: d.type_of_structure || 'RCC',
      land_area_sqft: d.land_area_sqft || prefill?.landArea || '',
      land_area_unit: d.land_area_unit || '',
      no_of_wings: d.no_of_wings || 'NA',
      units_per_floor: d.units_per_floor || 'NA',
      no_of_floors: d.no_of_floors || '1 (GF)',
      no_of_lifts: d.no_of_lifts || 'NA',

      unit_floor_no: d.unit_floor_no || 'GF',
      no_of_rooms: d.no_of_rooms || '',
      carpet_area_measured: d.carpet_area_measured || '',
      builtup_area_measured: d.builtup_area_measured || prefill?.builtUpArea || '',
      road_facing: d.road_facing || 'Road Facing-South',
      quality_exteriors: d.quality_exteriors || 'Good',
      quality_interiors: d.quality_interiors || 'Good',
      age_of_property: d.age_of_property || '',
      residual_life: d.residual_life || '',

      // Sanction Plan & Documents (14-19)
      sanctioned_plan_approval_no: d.sanctioned_plan_approval_no || '',
      construction_as_per_plan: d.construction_as_per_plan || 'Yes',
      construction_permission: d.construction_permission || 'NA',
      permission_number_date: d.permission_number_date || 'NA',
      nature_of_land: d.nature_of_land || 'Homestead',
      checked_online_records: d.checked_online_records || 'Yes',
      ownership_type: d.ownership_type || 'Freehold',
      documents_verified_list: d.documents_verified_list || 'Copy of Sale deed, ROR, Approved plan',
      within_municipal_limits: d.within_municipal_limits || '',
      permissible_master_plan: d.permissible_master_plan || 'NA',
      surrounding_habitation: d.surrounding_habitation || '',

      // Setbacks (19A)
      setback_front_plan: d.setback_front_plan || `0'0"`,
      setback_front_site: d.setback_front_site || `0'0"`,
      setback_left_plan: d.setback_left_plan || `0'0"`,
      setback_left_site: d.setback_left_site || `0'0"`,
      setback_right_plan: d.setback_right_plan || `0'0"`,
      setback_right_site: d.setback_right_site || `0'0"`,
      setback_rear_plan: d.setback_rear_plan || `0'0"`,
      setback_rear_site: d.setback_rear_site || `0'0"`,
      setback_remarks: d.setback_remarks || 'NA',
      demolition_risk: d.demolition_risk || 'NIL',

      // Floor Area (19B & 20)
      floor_gf_plan_sqft: d.floor_gf_plan_sqft || '',
      floor_gf_plan_sqmt: d.floor_gf_plan_sqmt || '',
      floor_gf_site_sqft: d.floor_gf_site_sqft || '',
      floor_gf_site_sqmt: d.floor_gf_site_sqmt || '',
      floor_gf_deviation: d.floor_gf_deviation || 'NA',

      floor_ff_plan_sqft: d.floor_ff_plan_sqft || 'NA',
      floor_ff_plan_sqmt: d.floor_ff_plan_sqmt || 'NA',
      floor_ff_site_sqft: d.floor_ff_site_sqft || 'NA',
      floor_ff_site_sqmt: d.floor_ff_site_sqmt || 'NA',

      carpet_area_agreement: d.carpet_area_agreement || 'NA',
      carpet_area_plan: d.carpet_area_plan || '',
      area_considered_valuation: d.area_considered_valuation || prefill?.builtUpArea || '',
      ready_reckoner_rate: d.ready_reckoner_rate || '',

      // Valuation Point 21
      land_rate_sft: d.land_rate_sft || '',
      builtup_area_sqft: d.builtup_area_sqft || prefill?.builtUpArea || '',
      construction_rate_100: d.construction_rate_100 || '',
      stage_of_construction_pct: d.stage_of_construction_pct || '100',
      forced_sale_ratio_pct: d.forced_sale_ratio_pct || '80',
      reconstruction_rate_sqft: d.reconstruction_rate_sqft || '1500',
      amenities_value: d.amenities_value || '0',

      // Boundaries Point 22
      boundary_east_deed: d.boundary_east_deed || prefill?.boundaryEast || 'Not Mentioned',
      boundary_west_deed: d.boundary_west_deed || prefill?.boundaryWest || 'Not Mentioned',
      boundary_north_deed: d.boundary_north_deed || prefill?.boundaryNorth || 'Not Mentioned',
      boundary_south_deed: d.boundary_south_deed || prefill?.boundarySouth || 'Not Mentioned',

      boundary_east_map: d.boundary_east_map || 'NA',
      boundary_west_map: d.boundary_west_map || 'NA',
      boundary_north_map: d.boundary_north_map || 'NA',
      boundary_south_map: d.boundary_south_map || 'NA',

      boundary_east_site: d.boundary_east_site || prefill?.boundaryEast || '',
      boundary_west_site: d.boundary_west_site || prefill?.boundaryWest || '',
      boundary_north_site: d.boundary_north_site || prefill?.boundaryNorth || '',
      boundary_south_site: d.boundary_south_site || prefill?.boundarySouth || '',

      boundaries_matching: d.boundaries_matching || 'Yes',
      technical_remarks: d.technical_remarks || '',
      
      property_caution_area: d.property_caution_area || 'No',
      property_negative_area: d.property_negative_area || 'No',
      property_ogl: d.property_ogl || 'No',
      verified_online_record: d.verified_online_record || 'Yes',
      latitude: d.latitude || '',
      longitude: d.longitude || '',

      // Attachments
      documentImages: d.documentImages || [],
      documentImageNames: d.documentImageNames || [],
      locationMapImages: d.locationMapImages || [],
      mouzaMapImages: d.mouzaMapImages || [],
      sketchMapImages: d.sketchMapImages || [],
      cadastralMapImages: d.cadastralMapImages || [],
      bdaMapImages: d.bdaMapImages || [],
      propertyImages: d.propertyImages || [],
      propertyImageNames: d.propertyImageNames || [],
    };
  });

  const [uploading, setUploading] = useState<string | boolean>(false);
  const [showBucketModal, setShowBucketModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const isReadOnly = userRole === 'viewer' || status === 'completed';

  // Soft container styling
  const softCardCls = 'bg-slate-900/50 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4';

  const handleChange = useCallback((field: string, val: any) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  }, []);

  // Real-time valuation calculations
  const valuationMath = useMemo(() => {
    const landArea = parseFloat(formData.land_area_sqft) || 0;
    const landRate = parseFloat(formData.land_rate_sft) || 0;
    const landVal = Math.round(landArea * landRate);

    const bua = parseFloat(formData.builtup_area_sqft) || 0;
    const constRate100 = parseFloat(formData.construction_rate_100) || 0;
    const constVal100 = Math.round(bua * constRate100);

    const stagePct = parseFloat(formData.stage_of_construction_pct) || 0;
    const stageRate = constRate100 * (stagePct / 100);
    const stageConstVal = Math.round(constVal100 * (stagePct / 100));

    const amenities = parseFloat(formData.amenities_value) || 0;

    const total100 = landVal + constVal100 + amenities;
    const totalCurrent = landVal + stageConstVal + amenities;

    const forcedRatio = (parseFloat(formData.forced_sale_ratio_pct) || 80) / 100;
    const forcedSaleVal = Math.round(totalCurrent * forcedRatio);

    const reconsRate = parseFloat(formData.reconstruction_rate_sqft) || 1500;
    const reconsCost = Math.round(bua * reconsRate);

    return {
      landArea,
      landRate,
      landVal,
      bua,
      constRate100,
      constVal100,
      stagePct,
      stageRate,
      stageConstVal,
      amenities,
      total100,
      totalCurrent,
      forcedSaleVal,
      reconsCost,
      wordsCurrent: rupeesInWords(totalCurrent),
      words100: rupeesInWords(total100),
    };
  }, [
    formData.land_area_sqft,
    formData.land_rate_sft,
    formData.builtup_area_sqft,
    formData.construction_rate_100,
    formData.stage_of_construction_pct,
    formData.forced_sale_ratio_pct,
    formData.reconstruction_rate_sqft,
    formData.amenities_value,
  ]);

  // Upload handler for documents
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading('documents');
      const newUrls: string[] = [];
      const newNames: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filePath = `reports/${projectId}/docs/${Date.now()}_${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
        newNames.push(file.name.replace(/\.[^/.]+$/, ''));
      }

      setFormData((prev) => ({
        ...prev,
        documentImages: [...(prev.documentImages || []), ...newUrls],
        documentImageNames: [...(prev.documentImageNames || []), ...newNames],
      }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Upload handler for photos
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading('photos');
      const newUrls: string[] = [];
      const newNames: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filePath = `reports/${projectId}/photos/${Date.now()}_${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
        newNames.push(`Photograph ${(formData.propertyImages?.length || 0) + i + 1}`);
      }

      setFormData((prev) => ({
        ...prev,
        propertyImages: [...(prev.propertyImages || []), ...newUrls],
        propertyImageNames: [...(prev.propertyImageNames || []), ...newNames],
      }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Upload handler for maps
  const handleMapUpload = async (mapKey: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    try {
      setUploading(mapKey);
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop();
        const filePath = `reports/${projectId}/maps/${Date.now()}_${i}.${ext}`;
        const { error } = await supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).upload(filePath, file);
        if (error) throw error;
        const { data } = supabaseBrowser.storage.from(STORAGE_BUCKETS.VALUATION_DOCUMENTS).getPublicUrl(filePath);
        newUrls.push(data.publicUrl);
      }

      setFormData((prev) => ({
        ...prev,
        [mapKey]: [...(prev[mapKey] || []), ...newUrls],
      }));
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Save handler
  const handleSaveDraft = async () => {
    try {
      setSaving(true);
      setAutoSaveStatus('saving');
      await saveReportDraft(projectId, {
        ...formData,
        calculatedValuation: valuationMath,
        updated_at: new Date().toISOString(),
      });
      setAutoSaveStatus('saved');
      setMessage({ text: 'Draft saved successfully!', type: 'success' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error(err);
      setAutoSaveStatus('error');
      setMessage({ text: 'Error saving draft: ' + err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this IDFC First Bank report for verification?')) return;
    try {
      setSubmitting(true);
      await saveReportDraft(projectId, {
        ...formData,
        calculatedValuation: valuationMath,
        updated_at: new Date().toISOString(),
      });
      await submitReportForVerification(projectId);
      alert('Report submitted for verification!');
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert('Error submitting report: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // PDF Preview handler
  const handlePreviewPDF = async () => {
    try {
      setPreviewing(true);
      const renderer = new PDFIDFCFirstBankRenderer({
        ...formData,
        projectCode,
        calculatedValuation: valuationMath,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (err: any) {
      console.error(err);
      alert('Error generating preview: ' + err.message);
    } finally {
      setPreviewing(false);
    }
  };

  // PDF Download handler
  const handleDownloadPDF = async () => {
    try {
      setPreviewing(true);
      const renderer = new PDFIDFCFirstBankRenderer({
        ...formData,
        projectCode,
        calculatedValuation: valuationMath,
      });
      const pdfBytes = await renderer.render();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IDFC_First_Bank_${projectCode || 'Report'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Error generating PDF: ' + err.message);
    } finally {
      setPreviewing(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 pb-28">
      {/* Top Banner */}
      <ActiveConfigBanner
        bankName="IDFC FIRST BANK"
        formatName="TECHNICAL APPRAISAL REPORT"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <FloatingNavigator sections={navSections} />

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <span>🏦 IDFC FIRST Bank — Technical Appraisal Report</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Standard 22-Section format with floor schedules, stage valuation, boundary matrix & attachments.
            </p>
          </div>
        </div>

        {/* 1. Case & Ref */}
        <div id="sec-header" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">1. Header & Case Reference Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Report Ref No">
              <input
                type="text"
                className={inputCls}
                value={formData.report_ref_no}
                onChange={(e) => handleChange('report_ref_no', e.target.value)}
              />
            </Field>
            <Field label="Report Date">
              <input
                type="text"
                className={inputCls}
                value={formData.report_date}
                onChange={(e) => handleChange('report_date', e.target.value)}
              />
            </Field>
            <Field label="Branch Name">
              <input
                type="text"
                className={inputCls}
                value={formData.branch_name}
                onChange={(e) => handleChange('branch_name', e.target.value)}
              />
            </Field>
            <Field label="Type of Case">
              <input
                type="text"
                className={inputCls}
                value={formData.case_type}
                onChange={(e) => handleChange('case_type', e.target.value)}
              />
            </Field>
            <Field label="Valuer Name">
              <input
                type="text"
                className={inputCls}
                value={formData.valuer_name}
                onChange={(e) => handleChange('valuer_name', e.target.value)}
              />
            </Field>
            <Field label="Date of Visit / Inspection">
              <div className="space-y-1">
                <input
                  type="date"
                  className={inputCls}
                  value={formData.inspection_date}
                  onChange={(e) => handleChange('inspection_date', e.target.value)}
                />
                {earliestVisit && <EarliestFieldVisitBadge fieldVisit={earliestVisit} />}
              </div>
            </Field>
            <Field label="Case Ref. No.">
              <input
                type="text"
                className={inputCls}
                value={formData.case_ref_no}
                onChange={(e) => handleChange('case_ref_no', e.target.value)}
              />
            </Field>
            <Field label="Contact Person">
              <input
                type="text"
                className={inputCls}
                value={formData.contact_person}
                onChange={(e) => handleChange('contact_person', e.target.value)}
              />
            </Field>
            <Field label="Contact Phone">
              <input
                type="text"
                className={inputCls}
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* 2. Basic Details */}
        <div id="sec-basic" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">2. Basic Details (Points 1 - 4)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="1. Applicant/s Name/s">
              <input
                type="text"
                className={inputCls}
                value={formData.applicant_name}
                onChange={(e) => handleChange('applicant_name', e.target.value)}
              />
            </Field>
            <Field label="2. Type of Property">
              <input
                type="text"
                className={inputCls}
                value={formData.property_type_desc}
                onChange={(e) => handleChange('property_type_desc', e.target.value)}
              />
            </Field>
            <Field label="Current Usage">
              <input
                type="text"
                className={inputCls}
                value={formData.current_usage}
                onChange={(e) => handleChange('current_usage', e.target.value)}
              />
            </Field>
            <Field label="4. Has valuator done valuation before?">
              <select
                className={selectCls}
                value={formData.prior_valuation_done}
                onChange={(e) => handleChange('prior_valuation_done', e.target.value)}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <div className="md:col-span-2">
              <Field label="3. Address at site">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={formData.property_address_site}
                  onChange={(e) => handleChange('property_address_site', e.target.value)}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Address as per document">
                <textarea
                  rows={2}
                  className={inputCls}
                  value={formData.property_address_doc}
                  onChange={(e) => handleChange('property_address_doc', e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* 3. Surrounding & Locality */}
        <div id="sec-surrounding" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">3. Surrounding & Locality Details (Points 5 - 8)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Approved Usage of Property">
              <input
                type="text"
                className={inputCls}
                value={formData.approved_usage}
                onChange={(e) => handleChange('approved_usage', e.target.value)}
              />
            </Field>
            <Field label="Class of Locality">
              <select
                className={selectCls}
                value={formData.class_of_locality}
                onChange={(e) => handleChange('class_of_locality', e.target.value)}
              >
                <option value="High">High</option>
                <option value="Middle">Middle</option>
                <option value="Poor">Poor</option>
              </select>
            </Field>
            <Field label="Site Status (Dev./Under Dev.)">
              <input
                type="text"
                className={inputCls}
                value={formData.site_status}
                onChange={(e) => handleChange('site_status', e.target.value)}
              />
            </Field>
            <Field label="Proximity to civic amenities">
              <input
                type="text"
                className={inputCls}
                value={formData.proximity_civic_amenities}
                onChange={(e) => handleChange('proximity_civic_amenities', e.target.value)}
              />
            </Field>
            <Field label="Railway Station Proximity">
              <input
                type="text"
                className={inputCls}
                value={formData.proximity_railway}
                onChange={(e) => handleChange('proximity_railway', e.target.value)}
              />
            </Field>
            <Field label="Bus Stop Proximity">
              <input
                type="text"
                className={inputCls}
                value={formData.proximity_bus}
                onChange={(e) => handleChange('proximity_bus', e.target.value)}
              />
            </Field>
            <Field label="6. Close Vicinity / Landmark">
              <input
                type="text"
                className={inputCls}
                value={formData.landmark}
                onChange={(e) => handleChange('landmark', e.target.value)}
              />
            </Field>
            <Field label="7. Distance from City Centre">
              <input
                type="text"
                className={inputCls}
                value={formData.distance_city_centre}
                onChange={(e) => handleChange('distance_city_centre', e.target.value)}
              />
            </Field>
            <Field label="8. Approach Road Width & Condition">
              <div className="flex gap-2">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="10-feet"
                  value={formData.approach_road_width}
                  onChange={(e) => handleChange('approach_road_width', e.target.value)}
                />
                <input
                  type="text"
                  className={inputCls}
                  placeholder="wide soil road"
                  value={formData.approach_road_condition}
                  onChange={(e) => handleChange('approach_road_condition', e.target.value)}
                />
              </div>
            </Field>
          </div>
        </div>

        {/* 4. Property & Building Details */}
        <div id="sec-property" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">4. Property & Building Details (Points 9 - 13)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="9. Occupant Status">
              <input
                type="text"
                className={inputCls}
                value={formData.occupant_status}
                onChange={(e) => handleChange('occupant_status', e.target.value)}
              />
            </Field>
            <Field label="10. Name of Occupant">
              <input
                type="text"
                className={inputCls}
                value={formData.occupant_name}
                onChange={(e) => handleChange('occupant_name', e.target.value)}
              />
            </Field>
            <Field label="Relation with Applicant">
              <input
                type="text"
                className={inputCls}
                value={formData.relation_with_applicant}
                onChange={(e) => handleChange('relation_with_applicant', e.target.value)}
              />
            </Field>
            <Field label="Property Demarcation">
              <select
                className={selectCls}
                value={formData.property_demarcation}
                onChange={(e) => handleChange('property_demarcation', e.target.value)}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>

            <div className="md:col-span-2">
              <Field label="Property Identified through">
                <input
                  type="text"
                  className={inputCls}
                  value={formData.property_identified_through}
                  onChange={(e) => handleChange('property_identified_through', e.target.value)}
                />
              </Field>
            </div>
            <Field label="Type of Structure">
              <input
                type="text"
                className={inputCls}
                value={formData.type_of_structure}
                onChange={(e) => handleChange('type_of_structure', e.target.value)}
              />
            </Field>
            <Field label="Land/Plot Area (sqft & units)">
              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputCls}
                  value={formData.land_area_sqft}
                  onChange={(e) => handleChange('land_area_sqft', e.target.value)}
                />
                <input
                  type="text"
                  className={inputCls}
                  placeholder="AC.0.020Decs"
                  value={formData.land_area_unit}
                  onChange={(e) => handleChange('land_area_unit', e.target.value)}
                />
              </div>
            </Field>

            <Field label="No. of Blocks / Wings">
              <input
                type="text"
                className={inputCls}
                value={formData.no_of_wings}
                onChange={(e) => handleChange('no_of_wings', e.target.value)}
              />
            </Field>
            <Field label="No. of Units per floor">
              <input
                type="text"
                className={inputCls}
                value={formData.units_per_floor}
                onChange={(e) => handleChange('units_per_floor', e.target.value)}
              />
            </Field>
            <Field label="No. of Floors">
              <input
                type="text"
                className={inputCls}
                value={formData.no_of_floors}
                onChange={(e) => handleChange('no_of_floors', e.target.value)}
              />
            </Field>
            <Field label="No. of Lifts">
              <input
                type="text"
                className={inputCls}
                value={formData.no_of_lifts}
                onChange={(e) => handleChange('no_of_lifts', e.target.value)}
              />
            </Field>

            <Field label="11. Unit Located on Floor">
              <input
                type="text"
                className={inputCls}
                value={formData.unit_floor_no}
                onChange={(e) => handleChange('unit_floor_no', e.target.value)}
              />
            </Field>
            <Field label="No. of Rooms">
              <input
                type="text"
                className={inputCls}
                value={formData.no_of_rooms}
                onChange={(e) => handleChange('no_of_rooms', e.target.value)}
              />
            </Field>
            <Field label="Carpet Area (sqft)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={formData.carpet_area_measured}
                onChange={(e) => handleChange('carpet_area_measured', e.target.value)}
              />
            </Field>
            <Field label="Built-up Area (sqft)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={formData.builtup_area_measured}
                onChange={(e) => handleChange('builtup_area_measured', e.target.value)}
              />
            </Field>

            <Field label="Road Facing">
              <input
                type="text"
                className={inputCls}
                value={formData.road_facing}
                onChange={(e) => handleChange('road_facing', e.target.value)}
              />
            </Field>
            <Field label="12. Exteriors Quality">
              <input
                type="text"
                className={inputCls}
                value={formData.quality_exteriors}
                onChange={(e) => handleChange('quality_exteriors', e.target.value)}
              />
            </Field>
            <Field label="Interiors Quality">
              <input
                type="text"
                className={inputCls}
                value={formData.quality_interiors}
                onChange={(e) => handleChange('quality_interiors', e.target.value)}
              />
            </Field>
            <Field label="13. Age & Residual Life">
              <div className="flex gap-2">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="0 Years"
                  value={formData.age_of_property}
                  onChange={(e) => handleChange('age_of_property', e.target.value)}
                />
                <input
                  type="text"
                  className={inputCls}
                  placeholder="60 Years"
                  value={formData.residual_life}
                  onChange={(e) => handleChange('residual_life', e.target.value)}
                />
              </div>
            </Field>
          </div>
        </div>

        {/* 5. Sanctions & Approvals */}
        <div id="sec-sanction" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">5. Sanction Plan & Regulatory Approvals (Points 14 - 19)</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Field label="14. Sanctioned plan verified with approval no">
                <input
                  type="text"
                  className={inputCls}
                  value={formData.sanctioned_plan_approval_no}
                  onChange={(e) => handleChange('sanctioned_plan_approval_no', e.target.value)}
                />
              </Field>
            </div>
            <Field label="14A. Construction as per plan">
              <select
                className={selectCls}
                value={formData.construction_as_per_plan}
                onChange={(e) => handleChange('construction_as_per_plan', e.target.value)}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>

            <Field label="14B. Construction permission">
              <input
                type="text"
                className={inputCls}
                value={formData.construction_permission}
                onChange={(e) => handleChange('construction_permission', e.target.value)}
              />
            </Field>
            <Field label="14C. Number and Date">
              <input
                type="text"
                className={inputCls}
                value={formData.permission_number_date}
                onChange={(e) => handleChange('permission_number_date', e.target.value)}
              />
            </Field>
            <Field label="14D. Nature of Land (Online)">
              <input
                type="text"
                className={inputCls}
                value={formData.nature_of_land}
                onChange={(e) => handleChange('nature_of_land', e.target.value)}
              />
            </Field>

            <Field label="14E. Checked measurement & ownership online">
              <select
                className={selectCls}
                value={formData.checked_online_records}
                onChange={(e) => handleChange('checked_online_records', e.target.value)}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>
            <Field label="15. Ownership Type">
              <input
                type="text"
                className={inputCls}
                value={formData.ownership_type}
                onChange={(e) => handleChange('ownership_type', e.target.value)}
              />
            </Field>
            <Field label="17. Within Municipal Limits">
              <input
                type="text"
                className={inputCls}
                value={formData.within_municipal_limits}
                onChange={(e) => handleChange('within_municipal_limits', e.target.value)}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="16. Property documents verified">
                <input
                  type="text"
                  className={inputCls}
                  value={formData.documents_verified_list}
                  onChange={(e) => handleChange('documents_verified_list', e.target.value)}
                />
              </Field>
            </div>
            <Field label="18. Permissible usage as per master plan">
              <input
                type="text"
                className={inputCls}
                value={formData.permissible_master_plan}
                onChange={(e) => handleChange('permissible_master_plan', e.target.value)}
              />
            </Field>
            <Field label="19. Surroundings Habitation (%)">
              <input
                type="text"
                className={inputCls}
                value={formData.surrounding_habitation}
                onChange={(e) => handleChange('surrounding_habitation', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* 6. Setbacks & Areas */}
        <div id="sec-setbacks" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">6. Setbacks & Floor Wise Area Schedules (Points 19A, 19B, 20)</h2>
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">19A. Setbacks & Demolition Risk</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Setbacks</th>
                  <th className="p-2.5">As per plan / Bye-laws</th>
                  <th className="p-2.5">Actual at site</th>
                  <th className="p-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                <tr>
                  <td className="p-2.5 font-medium">Front</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.setback_front_plan} onChange={(e) => handleChange('setback_front_plan', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.setback_front_site} onChange={(e) => handleChange('setback_front_site', e.target.value)} /></td>
                  <td className="p-2" rowSpan={4}>
                    <textarea rows={4} className={inputCls} value={formData.setback_remarks} onChange={(e) => handleChange('setback_remarks', e.target.value)} />
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Side1 (Left)</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.setback_left_plan} onChange={(e) => handleChange('setback_left_plan', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.setback_left_site} onChange={(e) => handleChange('setback_left_site', e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Side2 (Right)</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.setback_right_plan} onChange={(e) => handleChange('setback_right_plan', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.setback_right_site} onChange={(e) => handleChange('setback_right_site', e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">Rear</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.setback_rear_plan} onChange={(e) => handleChange('setback_rear_plan', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.setback_rear_site} onChange={(e) => handleChange('setback_rear_site', e.target.value)} /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Field label="Demolition Risk (if any to be highlighted)">
              <input
                type="text"
                className={inputCls}
                value={formData.demolition_risk}
                onChange={(e) => handleChange('demolition_risk', e.target.value)}
              />
            </Field>
            <Field label="20A. Ready Reckoner Rate (Govt. Approved in sqft)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={formData.ready_reckoner_rate}
                onChange={(e) => handleChange('ready_reckoner_rate', e.target.value)}
              />
            </Field>
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 pt-3">19B. Floor Wise Area Schedule (SqFt / SqMt)</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Floor No</th>
                  <th className="p-2.5">Plan SqFt</th>
                  <th className="p-2.5">Plan SqMt</th>
                  <th className="p-2.5">Site SqFt</th>
                  <th className="p-2.5">Site SqMt</th>
                  <th className="p-2.5">Deviation (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                <tr>
                  <td className="p-2.5 font-medium">Ground Floor (GF)</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.floor_gf_plan_sqft} onChange={(e) => handleChange('floor_gf_plan_sqft', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.floor_gf_plan_sqmt} onChange={(e) => handleChange('floor_gf_plan_sqmt', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.floor_gf_site_sqft} onChange={(e) => handleChange('floor_gf_site_sqft', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.floor_gf_site_sqmt} onChange={(e) => handleChange('floor_gf_site_sqmt', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.floor_gf_deviation} onChange={(e) => handleChange('floor_gf_deviation', e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">First Floor (FF)</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.floor_ff_plan_sqft} onChange={(e) => handleChange('floor_ff_plan_sqft', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.floor_ff_plan_sqmt} onChange={(e) => handleChange('floor_ff_plan_sqmt', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.floor_ff_site_sqft} onChange={(e) => handleChange('floor_ff_site_sqft', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.floor_ff_site_sqmt} onChange={(e) => handleChange('floor_ff_site_sqmt', e.target.value)} /></td>
                  <td className="p-2 text-slate-500 italic p-2.5">NA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 7. Valuation Engine */}
        <div id="sec-valuation" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
            <h2 className="text-base font-semibold text-slate-200">7. Valuation Engine (Point 21)</h2>
            <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full border border-indigo-500/20 font-mono">
              Auto-Calculating
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="Land Area (sqft)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={formData.land_area_sqft}
                onChange={(e) => handleChange('land_area_sqft', e.target.value)}
              />
            </Field>
            <Field label="Land Rate (₹ / sqft)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={formData.land_rate_sft}
                onChange={(e) => handleChange('land_rate_sft', e.target.value)}
              />
            </Field>
            <Field label="Built-up Area (BUA sqft)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={formData.builtup_area_sqft}
                onChange={(e) => handleChange('builtup_area_sqft', e.target.value)}
              />
            </Field>
            <Field label="Const Rate @ 100% (₹ / sqft)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={formData.construction_rate_100}
                onChange={(e) => handleChange('construction_rate_100', e.target.value)}
              />
            </Field>

            <Field label="Stage of Construction (%)">
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                className={inputCls}
                value={formData.stage_of_construction_pct}
                onChange={(e) => handleChange('stage_of_construction_pct', e.target.value)}
              />
            </Field>
            <Field label="Extra Amenities (₹)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={formData.amenities_value}
                onChange={(e) => handleChange('amenities_value', e.target.value)}
              />
            </Field>
            <Field label="Forced Sale Ratio (%)">
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                className={inputCls}
                value={formData.forced_sale_ratio_pct}
                onChange={(e) => handleChange('forced_sale_ratio_pct', e.target.value)}
              />
            </Field>
            <Field label="Reconstruction Rate (₹/sqft)">
              <input
                type="number"
                step="0.01"
                min="0"
                className={inputCls}
                value={formData.reconstruction_rate_sqft}
                onChange={(e) => handleChange('reconstruction_rate_sqft', e.target.value)}
              />
            </Field>
          </div>

          {/* Real-time breakdown card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Valuation Computation Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Land Valuation:</span>
                <p className="text-base font-bold text-white mt-1">₹{formatIndianCurrency(valuationMath.landVal)}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{valuationMath.landArea} sqft @ ₹{valuationMath.landRate}/sqft</p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">100% Const. Value:</span>
                <p className="text-base font-bold text-white mt-1">₹{formatIndianCurrency(valuationMath.constVal100)}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{valuationMath.bua} sqft @ ₹{valuationMath.constRate100}/sqft</p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">As on date {valuationMath.stagePct}% Const. Value:</span>
                <p className="text-base font-bold text-emerald-400 mt-1">₹{formatIndianCurrency(valuationMath.stageConstVal)}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{valuationMath.bua} sqft @ ₹{valuationMath.stageRate.toFixed(2)}/sqft</p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">100% Completion Property Value:</span>
                <p className="text-base font-bold text-slate-200 mt-1">₹{formatIndianCurrency(valuationMath.total100)}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Land + 100% Const</p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Forced Sale Value ({formData.forced_sale_ratio_pct}%):</span>
                <p className="text-base font-bold text-amber-400 mt-1">₹{formatIndianCurrency(valuationMath.forcedSaleVal)}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{formData.forced_sale_ratio_pct}% of As-on-date Market Value</p>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="text-slate-400">Reconstruction Cost (Insurance):</span>
                <p className="text-base font-bold text-blue-400 mt-1">₹{formatIndianCurrency(valuationMath.reconsCost)}</p>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">{valuationMath.bua} sqft @ ₹{formData.reconstruction_rate_sqft}/sqft</p>
              </div>
            </div>

            {/* Prominent Market Value Banner */}
            <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-600/40 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <span className="text-xs uppercase font-semibold text-amber-400 tracking-wider">
                  Total Market Value of Property (As on date)
                </span>
                <p className="text-xs text-slate-300 mt-1">
                  Rupees in words: <span className="font-semibold text-white">{valuationMath.wordsCurrent}</span>
                </p>
              </div>
              <div className="text-2xl font-black text-amber-300">
                ₹ {formatIndianCurrency(valuationMath.totalCurrent)}/-
              </div>
            </div>
          </div>
        </div>

        {/* 8. Boundaries & Remarks */}
        <div id="sec-boundaries" className={softCardCls}>
          <div className="border-b border-slate-800 pb-2">
            <h2 className="text-base font-semibold text-slate-200">8. Boundaries Matrix & Final Observations (Point 22)</h2>
          </div>

          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Boundary Comparison Matrix</h3>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800 text-slate-200 uppercase font-semibold">
                <tr>
                  <th className="p-2.5">Schedule</th>
                  <th className="p-2.5">East</th>
                  <th className="p-2.5">West</th>
                  <th className="p-2.5">North</th>
                  <th className="p-2.5">South</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-900/40">
                <tr>
                  <td className="p-2.5 font-medium">As per Sale deed</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_east_deed} onChange={(e) => handleChange('boundary_east_deed', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_west_deed} onChange={(e) => handleChange('boundary_west_deed', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_north_deed} onChange={(e) => handleChange('boundary_north_deed', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_south_deed} onChange={(e) => handleChange('boundary_south_deed', e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">As per Sketch map</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_east_map} onChange={(e) => handleChange('boundary_east_map', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_west_map} onChange={(e) => handleChange('boundary_west_map', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_north_map} onChange={(e) => handleChange('boundary_north_map', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_south_map} onChange={(e) => handleChange('boundary_south_map', e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">At site</td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_east_site} onChange={(e) => handleChange('boundary_east_site', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_west_site} onChange={(e) => handleChange('boundary_west_site', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_north_site} onChange={(e) => handleChange('boundary_north_site', e.target.value)} /></td>
                  <td className="p-2"><input type="text" className={inputCls} value={formData.boundary_south_site} onChange={(e) => handleChange('boundary_south_site', e.target.value)} /></td>
                </tr>
              </tbody>
            </table>
          </div>

          <Field label="Boundaries Matching Status">
            <input
              type="text"
              className={inputCls}
              value={formData.boundaries_matching}
              onChange={(e) => handleChange('boundaries_matching', e.target.value)}
            />
          </Field>

          <Field label="Valuer's Detailed Remarks & Observations">
            <textarea
              rows={4}
              className={inputCls}
              value={formData.technical_remarks}
              onChange={(e) => handleChange('technical_remarks', e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <Field label="Caution Area (Y/N)">
              <select
                className={selectCls}
                value={formData.property_caution_area}
                onChange={(e) => handleChange('property_caution_area', e.target.value)}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="Negative Area (Y/N)">
              <select
                className={selectCls}
                value={formData.property_negative_area}
                onChange={(e) => handleChange('property_negative_area', e.target.value)}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="Property in OGL (Y/N)">
              <select
                className={selectCls}
                value={formData.property_ogl}
                onChange={(e) => handleChange('property_ogl', e.target.value)}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </Field>
            <Field label="Verified Online Record">
              <select
                className={selectCls}
                value={formData.verified_online_record}
                onChange={(e) => handleChange('verified_online_record', e.target.value)}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </Field>

            <Field label="Latitude">
              <input
                type="text"
                className={inputCls}
                value={formData.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
              />
            </Field>
            <Field label="Longitude">
              <input
                type="text"
                className={inputCls}
                value={formData.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* 9. Verified Documents */}
        <div id="sec-documents">
          <BaseDocumentsSection
            title="Verified Property Documents"
            sectionId="sec-documents"
            sectionNumber={9}
            documentImages={formData.documentImages || []}
            documentImageNames={formData.documentImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onUploadDocuments={handleDocUpload}
            onRemoveDocument={(idx) => setFormData((p) => ({
              ...p,
              documentImages: (p.documentImages || []).filter((_: any, i: number) => i !== idx),
              documentImageNames: (p.documentImageNames || []).filter((_: any, i: number) => i !== idx),
            }))}
            onDocumentNameChange={(idx, name) => {
              const arr = [...(formData.documentImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFormData((p) => ({ ...p, documentImageNames: arr }));
            }}
            onReorderDocuments={(newImgs, newNames) => setFormData((p) => ({
              ...p,
              documentImages: newImgs,
              documentImageNames: newNames,
            }))}
          />
        </div>

        {/* 10. Maps & Location Sketch */}
        <div id="sec-maps">
          <BaseMapsSection
            title="Location Sketch & Route Maps"
            sectionId="sec-maps"
            sectionNumber={10}
            locationMapImages={formData.locationMapImages || []}
            mouzaMapImages={formData.mouzaMapImages || []}
            sketchMapImages={formData.sketchMapImages || []}
            cadastralMapImages={formData.cadastralMapImages || []}
            bdaMapImages={formData.bdaMapImages || []}
            latitude={formData.latitude}
            longitude={formData.longitude}
            isReadOnly={isReadOnly}
            uploading={uploading}
            onLocationMapUpload={(e) => handleMapUpload('locationMapImages', e)}
            onLocationMapRemove={(idx) => setFormData((p) => ({ ...p, locationMapImages: (p.locationMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onMouzaMapUpload={(e) => handleMapUpload('mouzaMapImages', e)}
            onMouzaMapRemove={(idx) => setFormData((p) => ({ ...p, mouzaMapImages: (p.mouzaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onSketchMapUpload={(e) => handleMapUpload('sketchMapImages', e)}
            onSketchMapRemove={(idx) => setFormData((p) => ({ ...p, sketchMapImages: (p.sketchMapImages || []).filter((_: any, i: number) => i !== idx) }))}
            onCadastralMapUpload={(e) => handleMapUpload('cadastralMapImages', e)}
            onCadastralMapRemove={(idx) => setFormData((p) => ({ ...p, cadastralMapImages: (p.cadastralMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onBdaMapUpload={(e) => handleMapUpload('bdaMapImages', e)}
            onBdaMapRemove={(idx) => setFormData((p) => ({ ...p, bdaMapImages: (p.bdaMapImages || []).filter((_: any, i: number) => i !== (idx ?? 0)) }))}
            onReorderLocationMap={(newImgs) => setFormData((p) => ({ ...p, locationMapImages: newImgs }))}
            onReorderMouzaMap={(newImgs) => setFormData((p) => ({ ...p, mouzaMapImages: newImgs }))}
            onReorderSketchMap={(newImgs) => setFormData((p) => ({ ...p, sketchMapImages: newImgs }))}
            onReorderCadastralMap={(newImgs) => setFormData((p) => ({ ...p, cadastralMapImages: newImgs }))}
            onReorderBdaMap={(newImgs) => setFormData((p) => ({ ...p, bdaMapImages: newImgs }))}
          />
        </div>

        {/* 11. Property Photographs */}
        <div id="sec-photos">
          <BasePhotographsSection
            title="Property Photographs"
            sectionId="sec-photos"
            sectionNumber={11}
            propertyImages={formData.propertyImages || []}
            propertyImageNames={formData.propertyImageNames || []}
            isReadOnly={isReadOnly}
            uploading={uploading}
            bucketCount={bucketImages?.length || 0}
            onOpenBucketPicker={() => setShowBucketModal(true)}
            onUploadImages={handlePhotoUpload}
            onRemoveImage={(idx) => setFormData((p) => ({
              ...p,
              propertyImages: (p.propertyImages || []).filter((_: any, i: number) => i !== idx),
              propertyImageNames: (p.propertyImageNames || []).filter((_: any, i: number) => i !== idx),
            }))}
            onImageNameChange={(idx, name) => {
              const arr = [...(formData.propertyImageNames || [])];
              while (arr.length <= idx) arr.push('');
              arr[idx] = name;
              setFormData((p) => ({ ...p, propertyImageNames: arr }));
            }}
            onReorderImages={(newImgs, newNames) => setFormData((p) => ({
              ...p,
              propertyImages: newImgs,
              propertyImageNames: newNames,
            }))}
          />
        </div>
      </div>

      {/* Action Bar */}
      <ReportActionBar
        isReadOnly={isReadOnly}
        userRole={userRole}
        autoSaveStatus={autoSaveStatus}
        message={message}
        loading={saving || submitting || previewing || !!uploading}
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
        onPreviewPDF={handlePreviewPDF}
        onDownloadPDF={handleDownloadPDF}
      />

      {/* Cloud Photo Bucket Picker Modal */}
      {showBucketModal && (
        <BasePhotoBucketModal
          isOpen={showBucketModal}
          bucketImages={bucketImages}
          mode="propertyImages"
          onClose={() => setShowBucketModal(false)}
          onConfirm={(selectedUrls: string[]) => {
            setFormData((prev) => ({
              ...prev,
              propertyImages: [...(prev.propertyImages || []), ...selectedUrls],
              propertyImageNames: [
                ...(prev.propertyImageNames || []),
                ...selectedUrls.map((_, i) => `Photograph ${(prev.propertyImages?.length || 0) + i + 1}`),
              ],
            }));
            setShowBucketModal(false);
          }}
        />
      )}
    </div>
  );
}
