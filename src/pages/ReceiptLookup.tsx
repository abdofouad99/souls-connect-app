import { useState } from "react";
import { Search, FileCheck, Clock, Download, ExternalLink, Heart, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLookupReceipt } from "@/hooks/useSponsorshipRequests";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
export default function ReceiptLookup() {
  const [searchData, setSearchData] = useState({
    sponsorName: "",
    sponsorPhone: "",
  });
  const [shouldSearch, setShouldSearch] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const {
    data: receipt,
    isLoading,
    error,
  } = useLookupReceipt(searchData.sponsorName, searchData.sponsorPhone, shouldSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchData.sponsorName.trim() && searchData.sponsorPhone.trim()) {
      setShouldSearch(true);
    }
  };

  const resetSearch = () => {
    setShouldSearch(false);
    setSearchData({ sponsorName: "", sponsorPhone: "" });
  };

  // Download receipt using blob for cross-origin support
  const handleDownload = async () => {
    if (!receipt?.cash_receipt_image) return;

    setDownloading(true);
    try {
      // Fetch the image as blob
      const response = await fetch(receipt.cash_receipt_image);
      if (!response.ok) throw new Error("فشل في تحميل الصورة");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Create hidden link and trigger download
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `سند-قبض-${receipt.cash_receipt_number || receipt.id}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      URL.revokeObjectURL(objectUrl);
      toast({ title: "تم بدء التحميل" });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({ title: "فشل في تحميل السند", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-2xl">
          <div className="text-center mb-8">
            <FileCheck className="h-16 w-16 mx-auto text-primary mb-4" />
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">استعلام عن سند القبض</h1>
            <p className="text-muted-foreground">أدخل بياناتك للاستعلام عن سند القبض الخاص بكفالتك</p>
          </div>

          {/* Search Form */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">بيانات البحث</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <Label htmlFor="sponsorName">اسم الكافل *</Label>
                  <Input
                    id="sponsorName"
                    required
                    value={searchData.sponsorName}
                    onChange={(e) => {
                      setSearchData({ ...searchData, sponsorName: e.target.value });
                      setShouldSearch(false);
                    }}
                    placeholder="أدخل اسمك الكامل"
                  />
                </div>

                <div>
                  <Label htmlFor="sponsorPhone">رقم الجوال *</Label>
                  <Input
                    id="sponsorPhone"
                    required
                    value={searchData.sponsorPhone}
                    onChange={(e) => {
                      setSearchData({ ...searchData, sponsorPhone: e.target.value });
                      setShouldSearch(false);
                    }}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    className="text-right"
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    <Search className="h-4 w-4 ml-2" />
                    {isLoading ? "جاري البحث..." : "بحث"}
                  </Button>
                  {shouldSearch && (
                    <Button type="button" variant="outline" onClick={resetSearch}>
                      بحث جديد
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Results */}
          {shouldSearch && !isLoading && (
            <div className="space-y-4">
              {error && (
                <Card className="border-destructive">
                  <CardContent className="p-6 text-center text-destructive">
                    حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.
                  </CardContent>
                </Card>
              )}

              {!receipt && !error && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">لا يوجد سند حتى الآن</h3>
                    <p className="text-muted-foreground">
                      قد يكون طلب الكفالة قيد المراجعة من الإدارة.
                      <br />
                      يرجى التحقق من البيانات المدخلة أو المحاولة لاحقًا.
                    </p>
                  </CardContent>
                </Card>
              )}

              {receipt && !receipt.cash_receipt_image && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-8 text-center">
                    <Clock className="h-12 w-12 mx-auto text-primary mb-4" />
                    <h3 className="text-lg font-bold text-foreground mb-2">تم اعتماد الطلب ✓</h3>
                    <p className="text-muted-foreground mb-4">
                      جارٍ إصدار سند القبض من قبل الإدارة.
                      <br />
                      سيتم رفع السند قريبًا إن شاء الله.
                    </p>
                    {receipt.orphan && (
                      <div className="bg-card rounded-lg p-4 mt-4 text-right">
                        <p className="text-sm text-muted-foreground">اليتيم المكفول</p>
                        <p className="font-bold text-foreground">{receipt.orphan.full_name}</p>
                        <p className="text-sm text-muted-foreground mt-2">مبلغ الكفالة</p>
                        <p className="font-bold text-primary">{receipt.amount} ر.س</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {receipt && receipt.cash_receipt_image && (
                <Card className="border-green-500/50 bg-green-50 dark:bg-green-950/20">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <FileCheck className="h-8 w-8 text-green-600" />
                      <div>
                        <h3 className="text-lg font-bold text-foreground">سند القبض جاهز</h3>
                        <p className="text-sm text-muted-foreground">يمكنك عرض وتحميل السند</p>
                      </div>
                    </div>

                    {/* Receipt Details */}
                    <div className="bg-card rounded-lg p-4 mb-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">اسم الكافل</span>
                        <span className="font-medium">{receipt.sponsor_full_name}</span>
                      </div>
                      {receipt.orphan && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">اليتيم المكفول</span>
                          <span className="font-medium">{receipt.orphan.full_name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">نوع الكفالة</span>
                        <span className="font-medium">
                          {receipt.sponsorship_type === "monthly" ? "شهرية" : "سنوية"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">المبلغ</span>
                        <span className="font-bold text-primary">{receipt.amount} ر.س</span>
                      </div>
                      {receipt.cash_receipt_number && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">رقم السند</span>
                          <span className="font-medium">{receipt.cash_receipt_number}</span>
                        </div>
                      )}
                      {receipt.cash_receipt_date && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">تاريخ السند</span>
                          <span className="font-medium">
                            {format(new Date(receipt.cash_receipt_date), "dd MMMM yyyy", { locale: ar })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Receipt Image */}
                    <div className="rounded-lg overflow-hidden border border-border mb-4">
                      <img src={receipt.cash_receipt_image} alt="سند القبض" className="w-full" />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => window.open(receipt.cash_receipt_image!, "_blank")}
                      >
                        <ExternalLink className="h-4 w-4 ml-2" />
                        فتح
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Info Note */}
          <Card className="mt-8 bg-muted/50">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Heart className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-1">ملاحظة هامة</p>
                  <p>
                    يتم إصدار سند القبض بعد مراجعة واعتماد طلب الكفالة من الإدارة. قد يستغرق ذلك بعض الوقت. شكرًا لصبركم
                    وتفهمكم.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
