'use client';

import { useState, useRef } from 'react';
import { updateInspectionStatus, updateInspectionMilestone, saveBucketImage, deleteBucketImage } from '@/app/actions/project';
import { supabaseBrowser, STORAGE_BUCKETS, STORAGE_PATHS } from '@/lib/supabase-client';

interface BucketImageData {
  id: string;
  url: string;
  storagePath: string;
  fileName: string;
  size: number;
  mimeType: string;
  createdAt: string;
  employeeId: string;
  employee: {
    name: string;
    employeeId: string;
  };
}

interface InspectionClientProps {
  projectId: string;
  initialStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  initialNotes: string | null;
  initialMeasurements: any;
  initialBucketImages: BucketImageData[];
  currentUserId: string;
}

export default function InspectionClient({
  projectId,
  initialStatus,
  initialNotes,
  initialMeasurements,
  initialBucketImages,
  currentUserId,
}: InspectionClientProps) {
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes || '');
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Parse measurements/milestones
  const getInitialMilestones = () => {
    try {
      if (initialMeasurements && typeof initialMeasurements === 'object') {
        return initialMeasurements.milestones || {};
      }
    } catch (e) {
      console.error(e);
    }
    return {};
  };

  const [milestones, setMilestones] = useState<Record<string, string>>(getInitialMilestones());
  const [saveNotesLoading, setSaveNotesLoading] = useState(false);

  // ── Photo Bucket State ──
  const [bucketImages, setBucketImages] = useState<BucketImageData[]>(initialBucketImages);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<BucketImageData | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleSaveNotes = async () => {
    setSaveNotesLoading(true);
    setMessage(null);
    const result = await updateInspectionStatus(projectId, status, notes);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Field notes saved successfully!' });
      setTimeout(() => setMessage(null), 3000);
    }
    setSaveNotesLoading(false);
  };

  const handleMilestoneClick = async (
    key: 'startedAt' | 'reachedSiteAt' | 'inspectedAt' | 'completedAt'
  ) => {
    setLoading(key);
    setMessage(null);

    const result = await updateInspectionMilestone(projectId, key, notes);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      if (key === 'startedAt') {
        setStatus('IN_PROGRESS');
      } else if (key === 'completedAt') {
        setStatus('COMPLETED');
      }
      
      const newMilestones = result.measurements?.milestones || {
        ...milestones,
        [key]: new Date().toISOString(),
      };
      setMilestones(newMilestones);
      setMessage({ type: 'success', text: 'Inspection milestone recorded!' });
      setTimeout(() => setMessage(null), 3000);
    }
    setLoading(null);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  // ── Photo Bucket Handlers ──
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setShowUploadModal(false);
    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${file.name}... (${i + 1}/${files.length})`);

      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: `${file.name} exceeds 10MB limit.` });
        continue;
      }

      try {
        const ext = file.name.split('.').pop() || 'jpg';
        const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
        const storagePath = `${STORAGE_PATHS.INSPECTION_PHOTOS(projectId)}/${uniqueName}`;

        const { error: uploadError } = await supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .upload(storagePath, file);

        if (uploadError) {
          setMessage({ type: 'error', text: `Upload failed: ${uploadError.message}` });
          continue;
        }

        const { data: urlData } = supabaseBrowser.storage
          .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
          .getPublicUrl(storagePath);

        const result = await saveBucketImage(projectId, {
          url: urlData.publicUrl,
          storagePath,
          fileName: file.name,
          size: file.size,
          mimeType: file.type || 'image/jpeg',
        });

        if (result.error) {
          setMessage({ type: 'error', text: result.error });
        } else if (result.image) {
          setBucketImages((prev) => [result.image as BucketImageData, ...prev]);
        }
      } catch (err) {
        console.error('Upload error:', err);
        setMessage({ type: 'error', text: `Failed to upload ${file.name}` });
      }
    }

    setUploading(false);
    setUploadProgress(null);
    setMessage({ type: 'success', text: `Photo${files.length > 1 ? 's' : ''} uploaded to bucket!` });
    setTimeout(() => setMessage(null), 3000);

    // Reset inputs
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (galleryInputRef.current) galleryInputRef.current.value = '';
  };

  const handleDeleteImage = async (image: BucketImageData) => {
    if (!confirm('Delete this photo from the bucket?')) return;
    setDeletingId(image.id);

    try {
      // Delete from Supabase Storage
      await supabaseBrowser.storage
        .from(STORAGE_BUCKETS.VALUATION_DOCUMENTS)
        .remove([image.storagePath]);

      // Delete from database
      const result = await deleteBucketImage(image.id);
      if (result.error) {
        setMessage({ type: 'error', text: result.error });
      } else {
        setBucketImages((prev) => prev.filter((img) => img.id !== image.id));
        setMessage({ type: 'success', text: 'Photo deleted.' });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error('Delete error:', err);
      setMessage({ type: 'error', text: 'Failed to delete photo.' });
    }
    setDeletingId(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Define steps
  const steps = [
    {
      key: 'startedAt',
      title: 'Start Inspection',
      subtitle: 'Triggered when you start traveling to site',
      buttonText: '🚀 Start Trip',
      completedText: 'Trip Started',
    },
    {
      key: 'reachedSiteAt',
      title: 'Reached Site',
      subtitle: 'Record when you physically arrive at location',
      buttonText: '📍 Reached Site',
      completedText: 'At Site',
      dependsOn: 'startedAt',
    },
    {
      key: 'inspectedAt',
      title: 'Inspected',
      subtitle: 'Record when property measurements are done',
      buttonText: '📐 Completed Survey',
      completedText: 'Survey Done',
      dependsOn: 'reachedSiteAt',
    },
    {
      key: 'completedAt',
      title: 'Complete Inspection',
      subtitle: 'Mark the whole inspection process as finished',
      buttonText: '✅ Mark Finished',
      completedText: 'Inspection Finished',
      dependsOn: 'inspectedAt',
    },
  ];

  return (
    <>
      <div className="card p-6 border border-[#b8860b]/20 bg-[#b8860b]/5 space-y-6">
        <div>
          <h3 className="text-lg font-bold text-[#0f2038] mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Inspection Milestones
          </h3>
          <p className="text-xs text-[#6c757d]">Record key milestones as they happen during your site visit.</p>
        </div>

        {message && (
          <div className={`p-3.5 rounded-xl text-sm border font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Vertical Interactive Timeline */}
        <div className="relative border-l border-gray-200 ml-4 pl-6 space-y-6">
          {steps.map((step, idx) => {
            const isDone = !!milestones[step.key];
            const canTrigger = !isDone && (idx === 0 || !!milestones[steps[idx - 1].key]);
            
            return (
              <div key={step.key} className="relative">
                {/* Checkmark indicator */}
                <span className={`absolute -left-[35px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
                  isDone 
                    ? 'border-green-600 bg-green-600 text-white' 
                    : canTrigger 
                    ? 'border-[#b8860b] bg-white text-[#b8860b] animate-pulse' 
                    : 'border-gray-200 bg-gray-50 text-gray-400'
                }`}>
                  {isDone ? '✓' : idx + 1}
                </span>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className={`text-sm font-bold ${isDone ? 'text-green-700' : 'text-[#0f2038]'}`}>
                      {isDone ? step.completedText : step.title}
                    </h4>
                    <p className="text-xs text-[#6c757d] mt-0.5">{step.subtitle}</p>
                    
                    {isDone && (
                      <span className="inline-flex items-center text-[10px] text-green-600 font-mono bg-green-50 px-2 py-0.5 rounded border border-green-200 mt-1.5 font-bold">
                        ⏱ {formatDate(milestones[step.key])} @ {formatTime(milestones[step.key])}
                      </span>
                    )}
                  </div>

                  <div>
                    {canTrigger && (
                      <button
                        onClick={() => handleMilestoneClick(step.key as any)}
                        disabled={!!loading}
                        className="px-4 py-2 bg-[#1e3a5f] hover:bg-[#0f2038] text-white text-xs font-bold rounded-xl shadow-sm transition-all whitespace-nowrap disabled:opacity-50"
                      >
                        {loading === step.key ? 'Saving...' : step.buttonText}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <hr className="border-gray-200" />

        {/* Field Notes Area */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#343a40]">
            Field Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Type notes here..."
            className="w-full px-4 py-3 rounded-xl border border-[#dee2e6] bg-white text-[#212529] text-sm focus:outline-none focus:ring-2 focus:ring-[#b8860b]/30 focus:border-[#b8860b] transition-all resize-none mb-2"
          />
          <button
            onClick={handleSaveNotes}
            disabled={saveNotesLoading}
            className="px-4 py-2 border border-[#b8860b]/60 rounded-xl text-xs font-bold text-[#b8860b] hover:bg-[#b8860b]/10 transition-colors disabled:opacity-50"
          >
            {saveNotesLoading ? 'Saving Notes...' : 'Save Field Notes'}
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* PHOTO BUCKET SECTION                       */}
      {/* ══════════════════════════════════════════ */}
      <div className="card p-6 border border-[#1e3a5f]/15 bg-gradient-to-br from-[#f8f9fa] to-[#edf2f7] space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-[#0f2038] flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              📸 Photo Bucket
              {bucketImages.length > 0 && (
                <span className="bg-[#1e3a5f] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {bucketImages.length}
                </span>
              )}
            </h3>
            <p className="text-xs text-[#6c757d] mt-0.5">All team members share this bucket • Upload site photos here</p>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => setShowUploadModal(true)}
          disabled={uploading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-[#1e3a5f] hover:bg-[#0f2038] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 active:scale-[0.98]"
        >
          {uploading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {uploadProgress || 'Uploading...'}
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Photos to Bucket
            </>
          )}
        </button>

        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageUpload}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Image Grid */}
        {bucketImages.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {bucketImages.map((img) => (
              <div
                key={img.id}
                className="group relative bg-white rounded-xl border border-[#e9ecef] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Thumbnail */}
                <div
                  className="aspect-square cursor-pointer overflow-hidden"
                  onClick={() => setPreviewImage(img)}
                >
                  <img
                    src={img.url}
                    alt={img.fileName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* Info overlay */}
                <div className="p-2">
                  <p className="text-[10px] font-bold text-[#0f2038] truncate">{img.employee.name}</p>
                  <p className="text-[9px] text-[#6c757d]">
                    {formatDate(img.createdAt)} • {formatFileSize(img.size)}
                  </p>
                </div>

                {/* Delete button (only for own uploads) */}
                {img.employeeId === currentUserId && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(img); }}
                    disabled={deletingId === img.id}
                    className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-red-500/90 text-white text-xs opacity-0 group-hover:opacity-100 hover:bg-red-600 transition-all shadow-sm"
                    title="Delete photo"
                  >
                    {deletingId === img.id ? '…' : '✕'}
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-[#dee2e6] rounded-xl">
            <div className="text-3xl mb-2">📷</div>
            <p className="text-sm font-medium text-[#6c757d]">No photos yet</p>
            <p className="text-xs text-[#adb5bd] mt-1">Tap &quot;Add Photos&quot; to capture or upload site images</p>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════ */}
      {/* UPLOAD OPTIONS MODAL (Bottom Sheet)        */}
      {/* ══════════════════════════════════════════ */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowUploadModal(false)}
          />
          {/* Modal */}
          <div className="relative w-full sm:w-96 bg-white rounded-t-2xl sm:rounded-2xl p-6 space-y-3 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-bold text-[#0f2038]">Add Photos</h4>
              <button
                onClick={() => setShowUploadModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#f8f9fa] text-[#6c757d] transition-colors"
              >
                ✕
              </button>
            </div>

            <button
              onClick={() => { cameraInputRef.current?.click(); }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#e9ecef] hover:border-[#b8860b]/40 hover:bg-[#b8860b]/5 transition-all text-left"
            >
              <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#1e3a5f]/10 text-xl flex-shrink-0">📷</span>
              <div>
                <p className="text-sm font-bold text-[#0f2038]">Take Photo</p>
                <p className="text-xs text-[#6c757d]">Open camera to capture a new photo</p>
              </div>
            </button>

            <button
              onClick={() => { galleryInputRef.current?.click(); }}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#e9ecef] hover:border-[#b8860b]/40 hover:bg-[#b8860b]/5 transition-all text-left"
            >
              <span className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#b8860b]/10 text-xl flex-shrink-0">🖼️</span>
              <div>
                <p className="text-sm font-bold text-[#0f2038]">Choose from Gallery</p>
                <p className="text-xs text-[#6c757d]">Select existing photos from your device</p>
              </div>
            </button>

            {/* Bottom drag indicator for mobile feel */}
            <div className="flex justify-center pt-2 sm:hidden">
              <div className="w-10 h-1 bg-[#dee2e6] rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════ */}
      {/* FULL-SIZE IMAGE PREVIEW LIGHTBOX            */}
      {/* ══════════════════════════════════════════ */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setPreviewImage(null)}>
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg transition-colors z-10"
          >
            ✕
          </button>
          <img
            src={previewImage.url}
            alt={previewImage.fileName}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-xl text-xs backdrop-blur-sm">
            <span className="font-bold">{previewImage.employee.name}</span> • {formatDate(previewImage.createdAt)} • {previewImage.fileName}
          </div>
        </div>
      )}

      {/* Inline CSS for modal slide-up animation */}
      <style jsx>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.25s ease-out;
        }
      `}</style>
    </>
  );
}
