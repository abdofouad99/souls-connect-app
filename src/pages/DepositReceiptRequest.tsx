import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X, FileText, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// Schema للتحقق من البيانات
const depositRequestSchema = z.object({
  sponsorName: z
    .string()
    .min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'الاسم طويل جداً'),
  phoneNumber: z
    .string()
    .min(10, 'رقم الجوال يجب أن يكون 10 أرقام على الأقل')
    .max(15, 'رقم الجوال طويل جداً')
    .regex(/^[0-9]+$/, 'رقم الجوال يجب أن يحتوي على أرقام فقط'),
  depositAmount: z
    .string()
    .min(1, 'يرجى إدخال مبلغ الإيداع')
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, 'المبلغ يجب أن يكون أكبر من 0'),
  bankMethod: z
    .string()
    .min(2, 'يرجى تحديد البنك أو طريقة التحويل')
    .max(200, 'النص طويل جداً'),
});

type DepositRequestForm = z.infer<typeof depositRequestSchema>;

export default function DepositReceiptRequest() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<DepositRequestForm>({
    resolver: zodResolver(depositRequestSchema),
  });

  // معالجة اختيار الملف
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // التحقق من نوع الملف
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: 'destructive',
          title: 'نوع ملف غير مدعوم',
          description: 'يرجى اختيار صورة (JPG, PNG, WebP) أو ملف PDF',
        });
        return;
      }

      // التحقق من حجم الملف (5 ميجا كحد أقصى)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'حجم الملف كبير',
          description: 'الحد الأقصى لحجم الملف 5 ميجابايت',
        });
        return;
      }

      setSelectedFile(file);
      
      // معاينة الصورة
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    }
  };

  // إزالة الملف المحدد
  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // إرسال النموذج
  const onSubmit = async (data: DepositRequestForm) => {
    // التحقق من تسجيل الدخول
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'يجب تسجيل الدخول',
        description: 'يرجى تسجيل الدخول أولاً لإرسال طلب سند الإيداع',
      });
      navigate('/auth');
      return;
    }

    setIsSubmitting(true);

    try {
      let receiptUrl = null;

      // رفع الملف إلى bucket إذا وُجد
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('deposit-receipts')
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('deposit-receipts')
            .getPublicUrl(fileName);
          receiptUrl = urlData.publicUrl;
        }
      }

      // حفظ البيانات في قاعدة البيانات
      const { error: insertError } = await supabase
        .from('deposit_receipt_requests')
        .insert({
          sponsor_name: data.sponsorName,
          phone_number: data.phoneNumber,
          deposit_amount: Number(data.depositAmount),
          bank_method: data.bankMethod,
          receipt_image_url: receiptUrl,
          user_id: user?.id,
        });

      if (insertError) {
        throw insertError;
      }

      // إرسال إشعار بالبريد الإلكتروني (اختياري - لا يوقف العملية إذا فشل)
      try {
        await supabase.functions.invoke('send-deposit-notification', {
          body: {
            sponsorName: data.sponsorName,
            phoneNumber: data.phoneNumber,
            depositAmount: Number(data.depositAmount),
            bankMethod: data.bankMethod,
            // لم يعد يتم إرسال adminEmail - يتم استخدام متغير البيئة ADMIN_EMAIL
          },
        });
        console.log('Email notification sent');
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // لا نريد إيقاف العملية إذا فشل إرسال البريد
      }

      setIsSuccess(true);
      toast({
        title: 'تم إرسال الطلب بنجاح',
        description: 'سيتم التواصل معك قريباً لإصدار سند الإيداع الرسمي',
      });

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        variant: 'destructive',
        title: 'حدث خطأ',
        description: 'يرجى المحاولة مرة أخرى',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // إعادة تعيين النموذج
  const handleReset = () => {
    reset();
    removeFile();
    setIsSuccess(false);
  };

  // شاشة النجاح
  if (isSuccess) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-lg mx-auto">
            <Card className="text-center">
              <CardContent className="pt-12 pb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  تم إرسال الطلب بنجاح!
                </h2>
                <p className="text-muted-foreground mb-8">
                  سيتم التواصل معك قريباً لإصدار سند الإيداع الرسمي
                </p>
                <div className="flex gap-4 justify-center">
                  <Button onClick={handleReset} variant="outline">
                    إرسال طلب جديد
                  </Button>
                  <Button onClick={() => navigate('/')}>
                    العودة للرئيسية
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-xl mx-auto">
          <Card className="shadow-card">
            {/* رأس النموذج */}
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                طلب سند الإيداع
              </CardTitle>
              <CardDescription className="text-base mt-2">
                املأ البيانات التالية وسيتم التواصل معك لإصدار سند الإيداع الرسمي
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* اسم الكفيل */}
                <div className="space-y-2">
                  <Label htmlFor="sponsorName" className="text-foreground font-medium">
                    اسم الكفيل <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="sponsorName"
                    placeholder="أدخل اسمك الكامل"
                    {...register('sponsorName')}
                    className={errors.sponsorName ? 'border-destructive' : ''}
                  />
                  {errors.sponsorName && (
                    <p className="text-sm text-destructive">{errors.sponsorName.message}</p>
                  )}
                </div>

                {/* رقم الجوال */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-foreground font-medium">
                    رقم الجوال <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phoneNumber"
                    placeholder="مثال: 0501234567"
                    dir="ltr"
                    {...register('phoneNumber')}
                    className={errors.phoneNumber ? 'border-destructive' : ''}
                  />
                  {errors.phoneNumber && (
                    <p className="text-sm text-destructive">{errors.phoneNumber.message}</p>
                  )}
                </div>

                {/* مبلغ الإيداع */}
                <div className="space-y-2">
                  <Label htmlFor="depositAmount" className="text-foreground font-medium">
                    مبلغ الإيداع <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="depositAmount"
                      placeholder="أدخل المبلغ"
                      dir="ltr"
                      {...register('depositAmount')}
                      className={`pl-14 ${errors.depositAmount ? 'border-destructive' : ''}`}
                    />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      ر.س
                    </span>
                  </div>
                  {errors.depositAmount && (
                    <p className="text-sm text-destructive">{errors.depositAmount.message}</p>
                  )}
                </div>

                {/* البنك/طريقة التحويل */}
                <div className="space-y-2">
                  <Label htmlFor="bankMethod" className="text-foreground font-medium">
                    البنك / طريقة التحويل <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="bankMethod"
                    placeholder="مثال: البنك الأهلي، حوالة بنكية... إلخ"
                    {...register('bankMethod')}
                    className={errors.bankMethod ? 'border-destructive' : ''}
                  />
                  {errors.bankMethod && (
                    <p className="text-sm text-destructive">{errors.bankMethod.message}</p>
                  )}
                </div>

                {/* صورة إيصال التحويل */}
                <div className="space-y-2">
                  <Label className="text-foreground font-medium">
                    صورة إيصال التحويل <span className="text-muted-foreground text-sm">(اختياري)</span>
                  </Label>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="hidden"
                  />

                  {!selectedFile ? (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">
                        اضغط لاختيار ملف أو اسحب الملف هنا
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        JPG, PNG, WebP أو PDF (حد أقصى 5 ميجا)
                      </p>
                    </button>
                  ) : (
                    <div className="border border-border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        {/* معاينة الصورة أو أيقونة الملف */}
                        {filePreview ? (
                          <img
                            src={filePreview}
                            alt="معاينة"
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                            <FileText className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} ميجابايت
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={removeFile}
                          className="p-1 hover:bg-destructive/10 rounded-full transition-colors"
                        >
                          <X className="w-5 h-5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* أزرار الإرسال */}
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                        جاري الإرسال...
                      </>
                    ) : (
                      'إرسال الطلب'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* ملاحظة مساعدة */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            هل تحتاج مساعدة؟ تواصل معنا عبر{' '}
            <a href="mailto:support@example.com" className="text-primary hover:underline">
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </Layout>
  );
}
