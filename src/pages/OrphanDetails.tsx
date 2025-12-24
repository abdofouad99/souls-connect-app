import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MapPin, Calendar, ArrowRight, Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrphan } from '@/hooks/useOrphans';
import { useCreateSponsorship } from '@/hooks/useSponsorships';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const statusLabels = {
  available: { label: 'متاح للكفالة', class: 'bg-primary text-primary-foreground' },
  partial: { label: 'كفالة جزئية', class: 'bg-secondary text-secondary-foreground' },
  full: { label: 'مكفول', class: 'bg-muted text-muted-foreground' },
};

export default function OrphanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: orphan, isLoading } = useOrphan(id || '');
  const createSponsorship = useCreateSponsorship();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: '',
    preferredContact: 'email',
    sponsorshipType: 'monthly',
    paymentMethod: 'bank_transfer',
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);

  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'خطأ',
          description: 'يرجى اختيار ملف صورة فقط',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'خطأ',
          description: 'حجم الصورة يجب أن يكون أقل من 5MB',
          variant: 'destructive',
        });
        return;
      }
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = () => setReceiptPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeReceiptImage = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  const uploadReceiptImage = async (): Promise<string | null> => {
    if (!receiptFile || !user) return null;
    
    setUploadingReceipt(true);
    try {
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('deposit-receipts')
        .upload(fileName, receiptFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('deposit-receipts')
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      return null;
    } finally {
      setUploadingReceipt(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orphan) return;

    try {
      console.log('[Sponsorship] Starting sponsorship creation...', {
        orphanId: orphan.id,
        sponsorEmail: formData.email,
        type: formData.sponsorshipType,
        paymentMethod: formData.paymentMethod,
        monthlyAmount: orphan.monthly_amount,
        userId: user?.id,
      });

      // Check if user is logged in
      if (!user) {
        toast({
          title: 'يرجى تسجيل الدخول',
          description: 'يجب تسجيل الدخول أولاً لإتمام عملية الكفالة.',
          variant: 'destructive',
        });
        navigate('/auth');
        return;
      }

      // Upload receipt image if exists
      let receiptImageUrl: string | null = null;
      if (receiptFile) {
        receiptImageUrl = await uploadReceiptImage();
      }

      const result = await createSponsorship.mutateAsync({
        sponsorData: {
          full_name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          preferred_contact: formData.preferredContact,
          user_id: user.id,
        },
        orphanId: orphan.id,
        type: formData.sponsorshipType as 'monthly' | 'yearly',
        paymentMethod: formData.paymentMethod,
        monthlyAmount: orphan.monthly_amount,
        receiptImageUrl: receiptImageUrl || undefined,
      });

      console.log('[Sponsorship] Success! Receipt:', result.receiptNumber);

      // Navigate to sponsor thank you page with details
      const params = new URLSearchParams({
        name: formData.fullName,
        amount: (formData.sponsorshipType === 'yearly' ? orphan.monthly_amount * 12 : orphan.monthly_amount).toString(),
        receipt: result.receiptNumber,
      });
      navigate(`/thanks?${params.toString()}`);
    } catch (error: any) {
      // Enhanced error logging
      console.error('[Sponsorship] Error creating sponsorship:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status,
        statusCode: error?.statusCode,
        stack: error?.stack,
      });

      // Determine user-friendly error message
      let errorMessage = 'لم نتمكن من إتمام الكفالة. يرجى المحاولة مرة أخرى.';
      
      if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
        errorMessage = 'فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.';
      } else if (error?.code === 'PGRST301' || error?.code === '42501') {
        errorMessage = 'صلاحيات غير كافية. يرجى تسجيل الدخول والمحاولة مرة أخرى.';
      } else if (error?.code === '23505') {
        errorMessage = 'توجد كفالة مسجلة بالفعل لهذا اليتيم.';
      } else if (error?.status === 401 || error?.statusCode === 401) {
        errorMessage = 'يرجى تسجيل الدخول أولاً.';
      } else if (error?.status === 403 || error?.statusCode === 403) {
        errorMessage = 'ليس لديك صلاحية لإتمام هذه العملية.';
      } else if (error?.status >= 500 || error?.statusCode >= 500) {
        errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً.';
      } else if (error?.message) {
        errorMessage = `خطأ: ${error.message}`;
      }

      toast({
        title: 'حدث خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
        </div>
      </Layout>
    );
  }

  if (!orphan) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">لم يتم العثور على اليتيم</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="container">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Orphan Info */}
            <div>
              <div className="bg-card rounded-2xl overflow-hidden shadow-card">
                <div className="aspect-video bg-muted relative">
                  {orphan.photo_url ? (
                    <img src={orphan.photo_url} alt={orphan.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="h-24 w-24 text-muted-foreground/50" />
                    </div>
                  )}
                  <Badge className={`absolute top-4 right-4 ${statusLabels[orphan.status].class}`}>
                    {statusLabels[orphan.status].label}
                  </Badge>
                </div>

                <div className="p-6">
                  <h1 className="text-3xl font-serif font-bold text-foreground mb-4">{orphan.full_name}</h1>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-5 w-5" />
                      <span>{orphan.city}، {orphan.country}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-5 w-5" />
                      <span>{orphan.age} سنة</span>
                    </div>
                  </div>

                  <div className="bg-primary/10 rounded-xl p-4 mb-6">
                    <div className="text-sm text-muted-foreground mb-1">قيمة الكفالة الشهرية</div>
                    <div className="text-2xl font-bold text-primary">{orphan.monthly_amount} ر.س</div>
                  </div>

                  {orphan.story && (
                    <div>
                      <h3 className="font-serif font-bold text-lg mb-2">القصة</h3>
                      <p className="text-muted-foreground leading-relaxed">{orphan.story}</p>
                    </div>
                  )}

                  {orphan.intro_video_url && (
                    <div className="mt-6">
                      <h3 className="font-serif font-bold text-lg mb-2">فيديو تعريفي</h3>
                      <video controls className="w-full rounded-lg" src={orphan.intro_video_url} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sponsorship Form */}
            <div>
              {!showForm ? (
                <div className="bg-card rounded-2xl p-8 shadow-card text-center">
                  <Heart className="h-16 w-16 mx-auto text-primary fill-primary/20 mb-4" />
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-4">
                    كن كافلاً لـ {orphan.full_name}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    ساهم في توفير حياة كريمة لهذا اليتيم من خلال كفالتك الشهرية أو السنوية
                  </p>
                  {orphan.status !== 'full' ? (
                    <Button variant="hero" size="xl" onClick={() => setShowForm(true)} className="w-full">
                      أكفل هذا اليتيم الآن
                    </Button>
                  ) : (
                    <p className="text-muted-foreground">هذا اليتيم مكفول بالكامل</p>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-foreground mb-6">نموذج الكفالة</h2>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName">الاسم الكامل *</Label>
                      <Input id="fullName" required value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} />
                    </div>

                    <div>
                      <Label htmlFor="email">البريد الإلكتروني *</Label>
                      <Input id="email" type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>

                    <div>
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>

                    <div>
                      <Label htmlFor="country">البلد</Label>
                      <Input id="country" value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value })} />
                    </div>

                    <div>
                      <Label>نوع الكفالة *</Label>
                      <RadioGroup value={formData.sponsorshipType} onValueChange={(v) => setFormData({ ...formData, sponsorshipType: v })} className="flex gap-4 mt-2">
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="monthly" id="monthly" />
                          <Label htmlFor="monthly">شهرية ({orphan.monthly_amount} ر.س)</Label>
                        </div>
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <RadioGroupItem value="yearly" id="yearly" />
                          <Label htmlFor="yearly">سنوية ({orphan.monthly_amount * 12} ر.س)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label>طريقة الدفع *</Label>
                      <Select value={formData.paymentMethod} onValueChange={(v) => setFormData({ ...formData, paymentMethod: v })}>
                        <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                          <SelectItem value="credit_card">بطاقة ائتمان</SelectItem>
                          <SelectItem value="cash">نقداً</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Receipt Image Upload */}
                    <div>
                      <Label>صورة الإيصال / الحوالة</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        يمكنك رفع صورة إيصال الدفع أو الحوالة البنكية (اختياري)
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptFileChange}
                        className="hidden"
                        id="receipt-upload"
                      />
                      {receiptPreview ? (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border">
                          <img
                            src={receiptPreview}
                            alt="صورة الإيصال"
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 left-2"
                            onClick={removeReceiptImage}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <label
                          htmlFor="receipt-upload"
                          className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">اضغط لرفع صورة الإيصال</span>
                          <span className="text-xs text-muted-foreground">PNG, JPG (حد أقصى 5MB)</span>
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">إلغاء</Button>
                    <Button type="submit" variant="hero" className="flex-1" disabled={createSponsorship.isPending}>
                      {createSponsorship.isPending ? 'جاري الإرسال...' : 'تأكيد الكفالة'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
