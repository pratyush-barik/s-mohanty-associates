'use client';

import { useState, useRef } from 'react';
import { sendReportForRework, finalizeReport } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS } from '@/lib/supabase-client';

interface ManagerVerificationViewProps {
  projectId: string;
  projectCode: string;
  reportFields: any;
  serviceRequest: any;
}

export default function ManagerVerificationView({ projectId, projectCode, reportFields, serviceRequest }: ManagerVerificationViewProps) {
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{type: 'success'|'error', text: string} | null>(null);
  
  const reportRef = useRef<HTMLDivElement>(null);

  const handleRework = async () => {
    if (!confirm('Are you sure you want to send this back to the Report Agent?')) return;
    setLoading(true);
    setActionMessage(null);
    const res = await sendReportForRework(projectId);
    if (res.error) setActionMessage({ type: 'error', text: res.error });
    else setActionMessage({ type: 'success', text: 'Sent back for rework.' });
    setLoading(false);
  };

  const handleFinalize = async () => {
    if (!confirm('Generate PDF and finalize project? The client will be able to download it immediately.')) return;
    
    setLoading(true);
    setActionMessage(null);

    try {
      // 1. Generate PDF locally using html2pdf
      // We dynamically import it because it requires the window object
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = reportRef.current;
      const opt = {
        margin:       0.5,
        filename:     `${projectCode}-Valuation-Report.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      // Generate PDF blob
      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');

      // 2. Upload to Supabase Storage
      const fileName = `${projectId}/${projectCode}-Valuation-Report.pdf`;
      const { error: uploadError } = await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .upload(fileName, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data } = supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .getPublicUrl(fileName);

      // 3. Finalize in database
      const res = await finalizeReport(projectId, data.publicUrl);
      if (res.error) throw new Error(res.error);

      setActionMessage({ type: 'success', text: 'Report finalized and PDF generated successfully!' });
    } catch (err: any) {
      console.error(err);
      setActionMessage({ type: 'error', text: err.message || 'Failed to finalize report.' });
    } finally {
      setLoading(false);
    }
  };

  if (!reportFields) return null;

  return (
    <div className="space-y-6">
      {actionMessage && (
        <div className={`p-4 rounded-xl text-sm font-medium ${
          actionMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          {actionMessage.text}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-[#e9ecef] shadow-sm">
        <div className="flex-1">
          <h3 className="font-bold text-[#0f2038]">Manager Review</h3>
          <p className="text-xs text-[#6c757d]">Review the generated report. If it looks correct, click Finalize.</p>
        </div>
        <button
          onClick={handleRework}
          disabled={loading}
          className="btn btn-outline text-sm px-4 py-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
        >
          Send for Rework
        </button>
        <button
          onClick={handleFinalize}
          disabled={loading}
          className="btn btn-primary text-sm px-6 py-2 bg-[#1e3a5f] hover:bg-[#0f2038]"
        >
          {loading ? 'Generating PDF...' : 'Finalize & Generate PDF'}
        </button>
      </div>

      {/* The DOM element that will be captured as a PDF */}
      <div 
        ref={reportRef} 
        className="bg-white mx-auto relative overflow-hidden" 
        style={{ 
          maxWidth: '800px', 
          minHeight: '1056px',
          backgroundImage: "url('/images/letterhead.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          paddingTop: '180px',    // Space for the green header
          paddingBottom: '120px', // Space for the footer
          paddingLeft: '64px',
          paddingRight: '64px'
        }}
      >
        {/* PDF Header (Data only, since graphic header is in background) */}
        <div className="text-center mb-10 border-b border-[#e9ecef]/50 pb-6 relative z-10">
          <h1 className="text-2xl font-bold text-[#0f2038] tracking-wider mb-2">VALUATION REPORT</h1>
          <div className="mt-4 flex justify-between text-xs text-[#343a40]">
            <p><strong>Project Code:</strong> {projectCode}</p>
            <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* PDF Body */}
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-bold text-[#b8860b] uppercase tracking-wider mb-3 border-b border-[#b8860b]/20 pb-1">Client & Property</h2>
            <div className="grid grid-cols-2 gap-4 text-sm text-[#343a40]">
              <p><strong>Client Name:</strong> {serviceRequest.contactName}</p>
              <p><strong>Property Type:</strong> {serviceRequest.propertyType}</p>
              <p className="col-span-2"><strong>Address:</strong> {serviceRequest.propertyAddress}</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#b8860b] uppercase tracking-wider mb-3 border-b border-[#b8860b]/20 pb-1">Valuation Summary</h2>
            <div className="grid grid-cols-2 gap-4 text-sm text-[#343a40]">
              <p><strong>Fair Market Value:</strong> ₹{reportFields.marketValue}</p>
              <p><strong>Realizable Value:</strong> ₹{reportFields.realizableValue}</p>
              <p><strong>Distress Value:</strong> ₹{reportFields.distressValue}</p>
              <p><strong>Method Used:</strong> {reportFields.valuationMethod}</p>
              <p><strong>Condition:</strong> {reportFields.propertyCondition}</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold text-[#b8860b] uppercase tracking-wider mb-3 border-b border-[#b8860b]/20 pb-1">Observations</h2>
            <p className="text-sm text-[#343a40] whitespace-pre-wrap">{reportFields.observations}</p>
          </section>

          {reportFields.propertyImages && reportFields.propertyImages.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-[#b8860b] uppercase tracking-wider mb-3 border-b border-[#b8860b]/20 pb-1">Photographs</h2>
              <div className="grid grid-cols-2 gap-4">
                {reportFields.propertyImages.map((img: string, idx: number) => (
                  <img key={idx} src={img} alt="Property" className="w-full h-48 object-cover rounded-md border border-[#e9ecef]" crossOrigin="anonymous" />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
