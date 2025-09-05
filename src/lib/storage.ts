import { supabase } from '@/integrations/supabase/client';

export async function getPublicOrSignedUrl(bucket: string, path: string, expiresInSeconds = 3600) {
  // First try public URL
  const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(path);
  if (publicUrl?.publicUrl) return publicUrl.publicUrl;
  // Fallback to signed URL
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) throw error;
  return data.signedUrl;
}

export async function uploadFile(bucket: string, file: File, prefix = '') {
  const filePath = `${prefix}${Date.now()}_${file.name}`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, { upsert: false });
  if (error) throw error;
  return filePath;
}

export async function removeFile(bucket: string, path: string) {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) throw error;
}
