'use client';

import { useState } from 'react';
import { saveReportDraft, submitReportForVerification } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';

interface ReportBuilderProps {
  projectId: string;
  initialFields: any;
  status: string;
}

export default function ReportBuilder({ projectId, initialFields, status }: ReportBuilderProps) {
  const [fields, setFields] = useState<any>(initialFields || {
    marketValue: '',
    realizableValue: '',
    distressValue: '',
    propertyCondition: 'Good',
    valuationMethod: 'Market Approach',
    observations: '',
    propertyImages: []
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);

  const isReadOnly = status === 'MANAGER_REVIEW' || status === 'COMPLETED';

  const handleChange = (field: string, value: any) => {
    setFields((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setMessage(null);

    const newImageUrls = [...(fields.propertyImages || [])];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `reports/${fileName}`;

      const { error } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(filePath, file);

      if (error) {
        setMessage({ type: 'error', text: `Failed to upload ${file.name}` });
        continue;
      }

      const { data } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(filePath);

      newImageUrls.push(data.publicUrl);
    }

    handleChange('propertyImages', newImageUrls);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    const newImages = [...fields.propertyImages];
    newImages.splice(index, 1);
    handleChange('propertyImages', newImages);
  };

  const handleSaveDraft = async () => {
    setLoading(true);
    setMessage(null);
    const result = await saveReportDraft(projectId, fields);
    
    if (result.error) setMessage({ type: 'error', text: result.error });
    else setMessage({ type: 'success', text: 'Draft saved successfully!' });
    
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!confirm('Are you sure you want to submit this report for manager verification? You will not be able to edit it unless it is returned for rework.')) {
      return;
    }
    
    setLoading(true);
    setMessage(null);
    
    // Save first, then submit
    await saveReportDraft(projectId, fields);
    const result = await submitReportForVerification(projectId);

    if (result.error) setMessage({ type: 'error', text: result.error });
    else setMessage({ type: 'success', text: 'Report submitted for verification!' });
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      <div className="card p-6 border border-[#b8860b]/20">
        <h3 className="text-lg font-bold text-[#0f2038] mb-6" style={{ fontFamily: 'var(--font-heading)' }}>
          Standard Valuation Form
        </h3>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">Fair Market Value (₹)</label>
            <input
              type="text"
              value={fields.marketValue}
              onChange={(e) => handleChange('marketValue', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1,50,00,000"
              className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">Realizable Value (₹)</label>
            <input
              type="text"
              value={fields.realizableValue}
              onChange={(e) => handleChange('realizableValue', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1,20,00,000"
              className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">Distress Value (₹)</label>
            <input
              type="text"
              value={fields.distressValue}
              onChange={(e) => handleChange('distressValue', e.target.value)}
              disabled={isReadOnly}
              placeholder="e.g. 1,00,00,000"
              className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#343a40] mb-1.5">Property Condition</label>
            <select
              value={fields.propertyCondition}
              onChange={(e) => handleChange('propertyCondition', e.target.value)}
              disabled={isReadOnly}
              className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
            >
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#343a40] mb-1.5">Valuation Method Used</label>
          <input
            type="text"
            value={fields.valuationMethod}
            onChange={(e) => handleChange('valuationMethod', e.target.value)}
            disabled={isReadOnly}
            className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#343a40] mb-1.5">Key Observations / Comments</label>
          <textarea
            value={fields.observations}
            onChange={(e) => handleChange('observations', e.target.value)}
            disabled={isReadOnly}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 resize-none"
          />
        </div>

        {/* Image Uploads */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-[#343a40] mb-3">Property Images</label>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {fields.propertyImages?.map((url: string, idx: number) => (
              <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#e9ecef] aspect-square">
                <img src={url} alt="Property" className="w-full h-full object-cover" />
                {!isReadOnly && (
                  <button 
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {!isReadOnly && (
            <div>
              <label className="btn btn-outline text-sm px-4 py-2 cursor-pointer inline-flex items-center gap-2">
                {uploading ? 'Uploading...' : 'Add Images'}
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
          )}
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex gap-4">
          <button
            onClick={handleSaveDraft}
            disabled={loading}
            className="btn btn-outline text-sm px-6 py-2.5"
          >
            {loading ? 'Saving...' : 'Save Draft'}
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-primary text-sm px-6 py-2.5 bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Submitting...' : 'Submit to Manager for Verification'}
          </button>
        </div>
      )}
    </div>
  );
}
