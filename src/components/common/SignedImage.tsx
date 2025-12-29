import { useState, useEffect } from 'react';
import { Loader2, ImageOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SignedImageProps {
  /** المسار أو URL - يدعم كلا الحالتين للتوافق للخلف */
  path: string | null | undefined;
  /** اسم الـ bucket */
  bucket: 'deposit-receipts' | 'cash-receipts';
  /** النص البديل للصورة */
  alt: string;
  /** class للصورة */
  className?: string;
  /** مدة صلاحية الرابط بالثواني (افتراضي 15 دقيقة) */
  expiresIn?: number;
}

/**
 * مكون لعرض الصور من buckets خاصة باستخدام signed URLs
 * يدعم التوافق للخلف: إذا كان المسار URL كامل قديم، يستخرج منه المسار
 */
export function SignedImage({ 
  path, 
  bucket, 
  alt, 
  className = '',
  expiresIn = 900 // 15 دقيقة افتراضي
}: SignedImageProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setIsLoading(false);
      setError('لا يوجد ملف');
      return;
    }

    const getSignedUrl = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let filePath = path;
        
        // التوافق للخلف: إذا كانت القيمة URL كامل، استخرج المسار
        if (path.startsWith('http')) {
          const bucketPattern = new RegExp(`/${bucket}/([^?]+)`);
          const match = path.match(bucketPattern);
          
          if (match && match[1]) {
            filePath = decodeURIComponent(match[1]);
          } else {
            // محاولة استخراج من نهاية URL
            const urlParts = path.split(`/${bucket}/`);
            if (urlParts.length >= 2) {
              filePath = urlParts[1].split('?')[0];
            }
          }
        }
        
        // الحصول على signed URL
        const { data, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, expiresIn);

        if (signedUrlError) {
          console.error('Error creating signed URL:', signedUrlError);
          setError('فشل في تحميل الصورة');
        } else if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('حدث خطأ أثناء تحميل الصورة');
      } finally {
        setIsLoading(false);
      }
    };

    getSignedUrl();
  }, [path, bucket, expiresIn]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted text-muted-foreground ${className}`}>
        <ImageOff className="h-8 w-8 mb-2" />
        <span className="text-xs">{error || 'لا يوجد صورة'}</span>
      </div>
    );
  }

  return (
    <img 
      src={signedUrl} 
      alt={alt} 
      className={className}
      onError={() => setError('فشل في عرض الصورة')}
    />
  );
}

/**
 * Hook للحصول على signed URL
 */
export function useSignedUrl(
  path: string | null | undefined, 
  bucket: 'deposit-receipts' | 'cash-receipts',
  expiresIn: number = 900
) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setIsLoading(false);
      return;
    }

    const getSignedUrl = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let filePath = path;
        
        // التوافق للخلف
        if (path.startsWith('http')) {
          const bucketPattern = new RegExp(`/${bucket}/([^?]+)`);
          const match = path.match(bucketPattern);
          
          if (match && match[1]) {
            filePath = decodeURIComponent(match[1]);
          } else {
            const urlParts = path.split(`/${bucket}/`);
            if (urlParts.length >= 2) {
              filePath = urlParts[1].split('?')[0];
            }
          }
        }
        
        const { data, error: signedUrlError } = await supabase.storage
          .from(bucket)
          .createSignedUrl(filePath, expiresIn);

        if (signedUrlError) {
          console.error('Error creating signed URL:', signedUrlError);
          setError('فشل في إنشاء الرابط');
        } else if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('حدث خطأ');
      } finally {
        setIsLoading(false);
      }
    };

    getSignedUrl();
  }, [path, bucket, expiresIn]);

  return { signedUrl, isLoading, error };
}
