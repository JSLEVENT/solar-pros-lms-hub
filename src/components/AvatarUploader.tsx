import React, { useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile } from '@/lib/storage';

interface AvatarUploaderProps {
  profileId: string;
  currentUrl?: string | null;
  onChange?: (url: string) => void;
  size?: number;
}

export const AvatarUploader: React.FC<AvatarUploaderProps> = ({ profileId, currentUrl, onChange, size = 72 }) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile('avatars', file, `${profileId}/`);
      const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = publicUrl?.publicUrl || '';
      if (url) {
        setPreview(url);
        await supabase.from('profiles').update({ avatar_url: url }).eq('id', profileId);
        onChange?.(url);
      }
    } catch (err) {
      console.error('Avatar upload failed', err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <div
        className="rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border"
        style={{ width: size, height: size }}
      >
        {preview ? (
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-gray-500">No Avatar</span>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          className="px-3 py-1 text-sm rounded bg-blue-600 text-white disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Change Avatar'}
        </button>
        <input
          ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
        />
      </div>
    </div>
  );
};
