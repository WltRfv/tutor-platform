import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export const HOMEWORK_BUCKET = 'homework-files';

export async function uploadHomeworkFile(
  userId: string,
  file: File
): Promise<{ url: string; path: string; name: string; size: number; type: string }> {
  const ext = file.name.split('.').pop() || 'bin';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${userId}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from(HOMEWORK_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Ошибка загрузки: ${error.message}`);

  const { data: signed } = await supabaseAdmin.storage
    .from(HOMEWORK_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  return {
    url: signed?.signedUrl || '',
    path,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

export async function getSignedUrl(path: string): Promise<string | null> {
  const { data } = await supabaseAdmin.storage
    .from(HOMEWORK_BUCKET)
    .createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl || null;
}

export const PUBLIC_BUCKET = 'public-images';

export async function uploadPublicImage(
  userId: string,
  file: File
): Promise<{ url: string; path: string; name: string; size: number }> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `teacher-images/${userId}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabaseAdmin.storage
    .from(PUBLIC_BUCKET)
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });

  if (error) throw new Error(`Ошибка загрузки: ${error.message}`);

  // Публичный URL
  const { data } = supabaseAdmin.storage.from(PUBLIC_BUCKET).getPublicUrl(path);

  return {
    url: data.publicUrl,
    path,
    name: file.name,
    size: file.size,
  };
}