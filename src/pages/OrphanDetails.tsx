import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Heart, MapPin, Calendar, ArrowRight, Upload, X, Loader2, Phone, MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOrphan } from "@/hooks/useOrphans";
import { useCreateSponsorshipRequest } from "@/hooks/useSponsorshipRequests";
import { useSiteSetting } from "@/hooks/useSiteSettings";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

// Zod schema for sponsorship form validation
const sponsorshipFormSchema = z.object({
  fullName: z.string().trim().min(2, {
    message: "الاسم يجب أن يكون حرفين على الأقل"
  }).max(100, {
    message: "الاسم يجب أن يكون أقل من 100 حرف"
  }),
  phone: z.string().trim().regex(/^[0-9]{9}$/, {
    message: "رقم الهاتف يجب أن يكون 9 أرقام"
  }),
  country: z.string().trim().max(100, {
    message: "اسم البلد يجب أن يكون أقل من 100 حرف"
  }).optional().or(z.literal("")),
  sponsorshipType: z.enum(["monthly", "yearly"])
});
const statusLabels: Record<string, {
  label: string;
  class: string;
}> = {
  available: {
    label: "متاح للكفالة",
    class: "bg-primary text-primary-foreground"
  },
  partially_sponsored: {
    label: "مكفول جزئياً",
    class: "bg-secondary text-secondary-foreground"
  },
  fully_sponsored: {
    label: "مكفول بالكامل",
    class: "bg-muted text-muted-foreground"
  },
  inactive: {
    label: "غير نشط",
    class: "bg-muted text-muted-foreground"
  },
  // Legacy values
  partial: {
    label: "مكفول جزئياً",
    class: "bg-secondary text-secondary-foreground"
  },
  full: {
    label: "مكفول بالكامل",
    class: "bg-muted text-muted-foreground"
  },
  sponsored: {
    label: "مكفول بالكامل",
    class: "bg-muted text-muted-foreground"
  }
};
export default function OrphanDetailsPage() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user
  } = useAuth();
  const {
    data: orphan,
    isLoading
  } = useOrphan(id || "");
  const {
    data: sponsorshipAmountSetting
  } = useSiteSetting("sponsorship_amount_text");
  const createSponsorshipRequest = useCreateSponsorshipRequest();
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    country: "",
    sponsorshipType: "monthly"
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Auto-open form if sponsor=true in URL
  useEffect(() => {
    if (searchParams.get('sponsor') === 'true') {
      setShowForm(true);
    }
  }, [searchParams]);

  // Pre-fill form data from user account
  useEffect(() => {
    if (user) {
      const userMeta = user.user_metadata || {};
      setFormData(prev => ({
        ...prev,
        fullName: userMeta.full_name || prev.fullName,
        phone: userMeta.phone || prev.phone,
        country: userMeta.country || prev.country
      }));
    }
  }, [user]);
  const handleReceiptFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast({
          title: "خطأ",
          description: "يرجى اختيار ملف صورة فقط",
          variant: "destructive"
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 5MB",
          variant: "destructive"
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
    if (!receiptFile) return null;
    try {
      const fileExt = receiptFile.name.split(".").pop();
      // Store only path (not public URL) for private bucket
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const {
        error: uploadError
      } = await supabase.storage.from("deposit-receipts").upload(fileName, receiptFile);
      if (uploadError) throw uploadError;

      // Return only the file path, NOT the public URL (bucket is private)
      return fileName;
    } catch (error) {
      console.error("Error uploading receipt:", error);
      return null;
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orphan) return;

    // Validate form using Zod schema
    const validationResult = sponsorshipFormSchema.safeParse(formData);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast({
        title: "بيانات غير صالحة",
        description: firstError.message,
        variant: "destructive"
      });
      return;
    }
    const validatedData = validationResult.data;
    setSubmitting(true);
    try {
      // Upload receipt image if exists
      let receiptImageUrl: string | null = null;
      if (receiptFile) {
        receiptImageUrl = await uploadReceiptImage();
      }

      // Calculate amount - fixed at 60 SAR per month
      const SPONSOR_AMOUNT_SAR = 60;
      const amount = validatedData.sponsorshipType === "yearly" ? SPONSOR_AMOUNT_SAR * 12 : SPONSOR_AMOUNT_SAR;

      // Create sponsorship request (pending status) with user_id
      await createSponsorshipRequest.mutateAsync({
        sponsor_full_name: validatedData.fullName,
        sponsor_phone: validatedData.phone,
        sponsor_country: validatedData.country || undefined,
        orphan_id: orphan.id,
        sponsorship_type: validatedData.sponsorshipType,
        amount,
        transfer_receipt_image: receiptImageUrl || undefined,
        user_id: user?.id
      });

      // Navigate to thank you page with pending message
      const params = new URLSearchParams({
        name: validatedData.fullName,
        amount: amount.toString(),
        status: "pending"
      });
      navigate(`/thanks?${params.toString()}`);
    } catch (error: any) {
      console.error("[SponsorshipRequest] Error:", error);
      console.error("[SponsorshipRequest] Error details:", {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        details: error?.details
      });

      // Better error messages based on error type
      let errorMessage = "لم نتمكن من إرسال طلب الكفالة. يرجى المحاولة مرة أخرى.";
      if (error?.message?.includes("fetch") || error?.message?.includes("network")) {
        errorMessage = "تعذر الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت.";
      } else if (error?.code === "23505") {
        errorMessage = "يوجد طلب كفالة سابق بنفس البيانات.";
      } else if (error?.code === "42501" || error?.status === 403 || error?.status === 401) {
        errorMessage = "لا تملك صلاحية تنفيذ هذه العملية.";
      } else if (error?.code === "413" || error?.message?.includes("too large")) {
        errorMessage = "حجم الملف كبير جداً. الحد الأقصى 5MB.";
      } else if (error?.code?.startsWith("22") || error?.status === 400) {
        errorMessage = "تأكد من إدخال جميع البيانات المطلوبة بشكل صحيح.";
      }
      toast({
        title: "حدث خطأ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };
  if (isLoading) {
    return <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
        </div>
      </Layout>;
  }
  if (!orphan) {
    return <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">لم يتم العثور على اليتيم</p>
          </div>
        </div>
      </Layout>;
  }
  return <Layout>
      <div className="min-h-screen bg-background py-8">
        <div className="container">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>

          {/* Sponsorship Form Only */}
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-8 shadow-card space-y-6">
              <h2 className="text-2xl font-serif font-bold text-foreground mb-2">نموذج كفالة {orphan.full_name}</h2>
              <p className="text-muted-foreground text-sm mb-6">
                فضلاً أدخل بياناتك وهي سرية للجمعية فقط حتى نتمكن من التأكيد والمتابعة
              </p>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="fullName">الاسم الكامل *</Label>
                  <Input id="fullName" required value={formData.fullName} onChange={e => setFormData({
                    ...formData,
                    fullName: e.target.value
                  })} />
                </div>

                <div>
                  <Label htmlFor="phone">رقم الهاتف</Label>
                  <Input id="phone" value={formData.phone} onChange={e => setFormData({
                    ...formData,
                    phone: e.target.value
                  })} />
                </div>

                <div>
                  <Label htmlFor="country">البلد</Label>
                  <Input id="country" value={formData.country} onChange={e => setFormData({
                    ...formData,
                    country: e.target.value
                  })} />
                </div>

                <div>
                  <Label>نوع الكفالة *</Label>
                  <RadioGroup value={formData.sponsorshipType} onValueChange={v => setFormData({
                    ...formData,
                    sponsorshipType: v
                  })} className="flex flex-row-reverse justify-end gap-6 mt-2" dir="rtl">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="monthly" id="monthly" />
                      <Label htmlFor="monthly" className="cursor-pointer">
                        <span>شهرية</span>
                        <span className="text-muted-foreground mr-1">(60 ر.س / 15$)</span>
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="yearly" id="yearly" />
                      <Label htmlFor="yearly" className="cursor-pointer">
                        <span>سنوية</span>
                        <span className="text-muted-foreground mr-1">(720 ر.س / 180$)</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Contact Numbers Section */}
                <div className="bg-primary/10 rounded-xl p-4">
                  <div className="font-bold text-primary mb-3 text-center">طريقة الدفع: تواصلوا معنا على الأرقام التالية</div>
                  <div className="flex flex-col gap-3">
                    <a href="tel:04251675" className="flex items-center justify-center gap-2 bg-background hover:bg-muted rounded-lg p-3 transition-colors border">
                      <Phone className="h-5 w-5 text-primary" />
                      <span className="font-medium" dir="ltr">04251675</span>
                      <span className="text-muted-foreground text-sm">(اتصال)</span>
                    </a>
                    <a href="https://wa.me/967784665006" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 rounded-lg p-3 transition-colors border border-green-200">
                      <MessageCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium" dir="ltr">784665006</span>
                      <span className="text-green-600 text-sm">(واتساب)</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1">
                  رجوع
                </Button>
                <Button type="submit" variant="hero" className="flex-1" disabled={submitting}>
                  {submitting ? <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري الإرسال...
                  </> : "إرسال طلب الكفالة"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>;
}