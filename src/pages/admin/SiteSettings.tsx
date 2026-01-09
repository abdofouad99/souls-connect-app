import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Loader2, Eye } from "lucide-react";
import { useSiteSettings, useUpdateSiteSetting } from "@/hooks/useSiteSettings";
import { toast } from "@/hooks/use-toast";

export default function SiteSettings() {
  const { data: settings, isLoading } = useSiteSettings();
  const updateSetting = useUpdateSiteSetting();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form data from settings
  useEffect(() => {
    if (settings) {
      const initialData: Record<string, string> = {};
      settings.forEach((setting) => {
        initialData[setting.id] = setting.value;
      });
      setFormData(initialData);
    }
  }, [settings]);

  const handleChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
    setHasChanges(true);
  };

  const handleSave = async (id: string) => {
    try {
      await updateSetting.mutateAsync({ id, value: formData[id] });
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الإعداد بنجاح",
      });
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving setting:", error);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعداد",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const sponsorshipAmountSetting = settings?.find((s) => s.key === "sponsorship_amount_text");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">إعدادات الموقع</h1>
          <p className="text-muted-foreground mt-2">إدارة الإعدادات العامة للموقع</p>
        </div>

        <div className="grid gap-6">
          {/* Sponsorship Amount Text Setting */}
          {sponsorshipAmountSetting && (
            <Card>
              <CardHeader>
                <CardTitle>{sponsorshipAmountSetting.label}</CardTitle>
                <CardDescription>
                  هذا النص يظهر في صفحة تفاصيل اليتيم وصفحة الكفالة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="sponsorship-amount">صيغة النص</Label>
                  <Input
                    id="sponsorship-amount"
                    value={formData[sponsorshipAmountSetting.id] || ""}
                    onChange={(e) => handleChange(sponsorshipAmountSetting.id, e.target.value)}
                    className="text-lg"
                    dir="rtl"
                  />
                </div>

                {/* Preview Section */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    معاينة
                  </Label>
                  <div className="bg-primary/10 rounded-xl p-4 border border-border">
                    <div className="text-sm text-muted-foreground mb-1">قيمة الكفالة الشهرية</div>
                    <div className="text-xl font-bold text-primary">
                      {formData[sponsorshipAmountSetting.id] || sponsorshipAmountSetting.value}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleSave(sponsorshipAmountSetting.id)}
                  disabled={updateSetting.isPending || !hasChanges}
                >
                  {updateSetting.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 ml-2" />
                      حفظ التغييرات
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
