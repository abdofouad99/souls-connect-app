import { supabase } from '@/integrations/supabase/client';

// Maximum file size in bytes (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Compress image before upload
async function compressImage(file: File, maxSizeMB: number = 2): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Calculate new dimensions (max 1200px on any side)
        const maxDimension = 1200;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Start with quality 0.8 and reduce if needed
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Could not compress image'));
                return;
              }

              // If still too large and quality > 0.3, try again with lower quality
              if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
                quality -= 0.1;
                tryCompress();
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress();
      };

      img.onerror = () => reject(new Error('Could not load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

export async function uploadOrphanPhoto(file: File, orphanId: string): Promise<string> {
  let fileToUpload = file;

  // Compress image if it's too large
  if (file.size > MAX_FILE_SIZE) {
    try {
      fileToUpload = await compressImage(file);
    } catch (error) {
      console.error('Error compressing image:', error);
      throw new Error('حجم الصورة كبير جداً ولم نتمكن من ضغطها. الرجاء اختيار صورة أصغر (أقل من 5MB)');
    }
  }

  const fileExt = 'jpg'; // Always use jpg after compression
  const fileName = `${orphanId}-${Date.now()}.${fileExt}`;
  const filePath = `orphans/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('orphan-photos')
    .upload(filePath, fileToUpload, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    if (uploadError.message?.includes('exceeded the maximum allowed size')) {
      throw new Error('حجم الصورة كبير جداً. الرجاء اختيار صورة أصغر (أقل من 5MB)');
    }
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
