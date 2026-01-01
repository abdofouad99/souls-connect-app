import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Mail, Shield, Loader2 } from 'lucide-react';
import { z } from 'zod';

const inviteSchema = z.object({
  email: z.string().email({ message: 'صيغة البريد الإلكتروني غير صالحة' }),
  role: z.enum(['admin', 'sponsor'], { required_error: 'الدور مطلوب' }),
});

export default function UsersManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'sponsor' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async () => {
    // Validate input
    const validation = inviteSchema.safeParse({ email, role });
    if (!validation.success) {
      toast({
        variant: 'destructive',
        title: 'خطأ في البيانات',
        description: validation.error.errors[0].message,
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('invite-user', {
        body: { email, role },
      });

      if (error) {
        throw new Error(error.message || 'فشل إرسال الدعوة');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: 'تم إرسال الدعوة',
        description: `تم إرسال دعوة إلى ${email} بنجاح`,
      });

      // Reset form and close dialog
      setEmail('');
      setRole('');
      setIsDialogOpen(false);
    } catch (error: any) {
      console.error('Invite error:', error);
      toast({
        variant: 'destructive',
        title: 'فشل إرسال الدعوة',
        description: error.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-foreground">إدارة المستخدمين</h1>
            <p className="text-muted-foreground">دعوة مستخدمين جدد وإدارة صلاحياتهم</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                دعوة مستخدم جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  دعوة مستخدم جديد
                </DialogTitle>
                <DialogDescription>
                  سيتم إرسال رابط الدعوة إلى البريد الإلكتروني المحدد
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    dir="ltr"
                    className="text-left"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    الدور
                  </Label>
                  <Select value={role} onValueChange={(value: 'admin' | 'sponsor') => setRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير نظام (Admin)</SelectItem>
                      <SelectItem value="sponsor">مستخدم عادي (Sponsor)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isLoading}
                >
                  إلغاء
                </Button>
                <Button 
                  onClick={handleInvite} 
                  disabled={isLoading || !email || !role}
                  className="gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Mail className="h-4 w-4" />
                      إرسال الدعوة
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">كيفية عمل الدعوات</CardTitle>
            <CardDescription>
              معلومات حول نظام دعوة المستخدمين
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  مدير نظام (Admin)
                </h3>
                <p className="text-sm text-muted-foreground">
                  يمكنه الوصول الكامل للوحة التحكم وإدارة جميع البيانات والمستخدمين
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <UserPlus className="h-4 w-4 text-primary" />
                  مستخدم عادي (Sponsor)
                </h3>
                <p className="text-sm text-muted-foreground">
                  يمكنه تصفح الأيتام وتقديم طلبات الكفالة ومتابعة كفالاته
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card">
              <h3 className="font-medium mb-2">خطوات الدعوة:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>أدخل البريد الإلكتروني للمستخدم الجديد</li>
                <li>اختر الدور المناسب له</li>
                <li>سيستقبل المستخدم رسالة بالبريد تحتوي على رابط الدعوة</li>
                <li>عند فتح الرابط، سيقوم بتعيين كلمة المرور الخاصة به</li>
                <li>بعد ذلك يمكنه تسجيل الدخول واستخدام النظام</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
