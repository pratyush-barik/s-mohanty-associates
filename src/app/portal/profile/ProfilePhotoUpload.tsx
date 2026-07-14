'use client';

import { useState, useRef } from 'react';
import { uploadProfilePhoto } from '@/app/actions/employee';

interface ProfilePhotoUploadProps {
  currentPhoto: string | null;
  userName: string;
}

export default function ProfilePhotoUpload({ currentPhoto, userName }: ProfilePhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentPhoto);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side preview
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setMessage(null);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setMessage({ type: 'error', text: 'Please select an image first.' });
      return;
    }

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append('photo', file);

    const result = await uploadProfilePhoto(formData);

    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
      if (result.url) setPreview(result.url);
    }

    setUploading(false);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="card p-6">
      <h2 className="text-base font-bold text-[#0f2038] mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Profile Photo
      </h2>

      {/* Photo Display */}
      <div className="flex justify-center mb-5">
        <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#162d4a] flex items-center justify-center shadow-lg">
          {preview ? (
            <img src={preview} alt={userName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-5xl font-bold">{userName.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
        id="photo-upload"
      />

      <div className="space-y-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-dashed border-[#dee2e6] text-sm font-medium text-[#6c757d] hover:border-[#b8860b] hover:text-[#b8860b] transition-all text-center"
        >
          {preview && preview !== currentPhoto ? 'Change Image' : 'Select Image'}
        </button>

        {preview && preview !== currentPhoto && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="btn btn-primary w-full py-2.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Photo'
            )}
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`mt-3 p-3 rounded-xl text-xs font-medium ${
          message.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <p className="text-[10px] text-[#adb5bd] mt-3 text-center">
        JPEG, PNG, or WebP • Max 5MB
      </p>
    </div>
  );
}
