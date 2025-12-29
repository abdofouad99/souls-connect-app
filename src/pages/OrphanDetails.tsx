import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, MapPin, Calendar, ArrowRight, Upload, X, Loader2, Copy, Check } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOrphan } from "@/hooks/useOrphans";
import { useCreateSponsorshipRequest } from "@/hooks/useSponsorshipRequests";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const statusLabels: Record<string, { label: string; class: string }> = {
  available: { label: "متاح للكفالة", class: "bg-primary text-primary-foreground" },
  partially_sponsored: { label: "مكفول جزئياً", class: "bg-secondary text-secondary-foreground" },
  fully_sponsored: { label: "مكفول بالكامل", class: "bg-muted text-muted-foreground" },
  inactive: { label: "غير نشط", class: "bg-muted text-muted-foreground" },
  // Legacy values
  partial: { label: "مكفول جزئياً", class: "bg-secondary text-secondary-foreground" },
  full: { label: "مكفول بالكامل", class: "bg-muted text-muted-foreground" },
  sponsored: { label: "مكفول بالكامل", class: "bg-muted text-muted-foreground" },
};

// Bank accounts data - replace placeholders with actual data later
const bankAccounts = [
  {
    bankName: "بنك الكريمي",
    accountName: "الحساب اليمني",
    iban: "3073854128",
  },
  {
    bankName: "بنك الكريمي",
    accountName: "الحساب السعودي",
    iban: "3137559853",
  },
  {
    bankName: "بنك الكريمي",
    accountName: "الحساب الدولار",
    iban: "3153152739",
  },
  {
    bankName: "بنك الكريمي",
    accountName: "الحساب اليمني",
    iban: "3063750157",
  },
  {
    bankName: "بنك الكريمي",
    accountName: "الحساب السعودي",
    iban: "3131509811",
  },
  {
    bankName: "بنك الكريمي",
    accountName: "الحساب الدولار",
    iban: "3164552135",
  },
];

function BankAccountsSection() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text.replace(/\s/g, ""));
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <div className="bg-muted/50 rounded-xl p-4 border border-border">
      <h3 className="font-bold text-foreground mb-3">بيانات الحسابات البنكية</h3>
      <div className="space-y-4">
        {bankAccounts.map((account, index) => (
          <div key={index} className="bg-card rounded-lg p-3 border border-border">
            <div className="text-sm text-muted-foreground mb-1">اسم البنك</div>
            <div className="font-medium text-foreground mb-2 select-all">{account.bankName}</div>

            <div className="text-sm text-muted-foreground mb-1">اسم الحساب</div>
            <div className="font-medium text-foreground mb-2 select-all">{account.accountName}</div>

            <div className="text-sm text-muted-foreground mb-1">رقم الحساب / IBAN</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-muted px-2 py-1 rounded text-sm font-mono select-all" dir="ltr">
                {account.iban}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(account.iban, index)}
                className="shrink-0"
              >
                {copiedIndex === index ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="mr-1 text-green-500">تم النسخ</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span className="mr-1">نسخ</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrphanDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: orphan, isLoading } = useOrphan(id || "");
  const createSponsorshipRequest = useCreateSponsorshipRequest();

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    country: "",
    sponsorshipType: "monthly",
  });
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form data from user account
  useEffect(() => {
    if (user) {
      const userMeta = user.user_metadata || {};
      setFormData(prev => ({
        ...prev,
        fullName: userMeta.full_name || prev.fullName,
        email: user.email || prev.email,
        phone: userMeta.phone || prev.phone,
        country: userMeta.country || prev.country,
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
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "خطأ",
          description: "حجم الصورة يجب أن يكون أقل من 5MB",
          variant: "destructive",
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
      const fileName = `public/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("deposit-receipts").upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("deposit-receipts").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading receipt:", error);
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!orphan) return;

    // Validate required fields
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى إدخال الاسم ورقم الهاتف",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload receipt image if exists
      let receiptImageUrl: string | null = null;
      if (receiptFile) {
        receiptImageUrl = await uploadReceiptImage();
      }

      // Calculate amount
      const amount = formData.sponsorshipType === "yearly" ? orphan.monthly_amount * 12 : orphan.monthly_amount;

      // Create sponsorship request (pending status) with user_id
      await createSponsorshipRequest.mutateAsync({
        sponsor_full_name: formData.fullName,
        sponsor_phone: formData.phone,
        sponsor_email: formData.email || undefined,
        sponsor_country: formData.country || undefined,
        orphan_id: orphan.id,
        sponsorship_type: formData.sponsorshipType as "monthly" | "yearly",
        amount,
        transfer_receipt_image: receiptImageUrl || undefined,
        user_id: user?.id,
      });

      // Navigate to thank you page with pending message
      const params = new URLSearchParams({
        name: formData.fullName,
        amount: amount.toString(),
        status: "pending",
      });
      navigate(`/thanks?${params.toString()}`);
    } catch (error: any) {
      console.error("[SponsorshipRequest] Error:", error);
      console.error("[SponsorshipRequest] Error details:", {
        message: error?.message,
        code: error?.code,
        status: error?.status,
        details: error?.details,
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
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
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
                      <span>
                        {orphan.city}، {orphan.country}
                      </span>
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
                  {!['fully_sponsored', 'full', 'sponsored'].includes(orphan.status) ? (
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
                      <Input
                        id="fullName"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">البريد الإلكتروني *</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="country">البلد</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>نوع الكفالة *</Label>
                      <RadioGroup
                        value={formData.sponsorshipType}
                        onValueChange={(v) => setFormData({ ...formData, sponsorshipType: v })}
                        className="flex gap-4 mt-2"
                      >
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
                      <div className="mt-2 px-3 py-2 bg-muted rounded-md text-foreground">تحويل بنكي</div>
                    </div>

                    {/* Bank Account Details Section */}
                    <BankAccountsSection />

                    {/* Receipt Image Upload */}
                    <div>
                      <Label>صورة الإيصال / الحوالة (اختياري)</Label>
                      <p className="text-xs text-muted-foreground mb-2">
                        يمكنك رفع صورة إيصال التحويل البنكي لتسريع المراجعة
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
                          <img src={receiptPreview} alt="صورة الإيصال" className="w-full h-full object-cover" />
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
                    <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                      إلغاء
                    </Button>
                    <Button type="submit" variant="hero" className="flex-1" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : (
                        "إرسال طلب الكفالة"
                      )}
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
