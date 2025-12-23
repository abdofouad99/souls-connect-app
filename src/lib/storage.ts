import { supabase } from '@/integrations/supabase/client';

export async function uploadOrphanPhoto(file: File, orphanId: string): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${orphanId}-${Date.now()}.${fileExt}`;
  const filePath = `orphans/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('orphan-photos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('orphan-photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function deleteOrphanPhoto(photoUrl: string): Promise<void> {
  // Extract file path from URL
  const urlParts = photoUrl.split('/orphan-photos/');
  if (urlParts.length < 2) return;

  const filePath = urlParts[1];

  const { error } = await supabase.storage
    .from('orphan-photos')
    .remove([filePath]);

  if (error) {
    console.error('Error deleting photo:', error);
  }
}
