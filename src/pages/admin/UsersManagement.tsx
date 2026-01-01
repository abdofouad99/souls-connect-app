import { useState, useEffect } from 'react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Mail, Shield, Loader2, Edit, Users } from 'lucide-react';
import { z } from 'zod';
import type { AppRole } from '@/lib/types';

const inviteSchema = z.object({
  email: z.string().email({ message: 'صيغة البريد الإلكتروني غير صالحة' }),
  role: z.enum(['admin', 'staff', 'sponsor'], { required_error: 'الدور مطلوب' }),
});

interface UserWithRole {
  user_id: string;
  role: AppRole;
  profile: {
    full_name: string;
    email: string | null;
  } | null;
}

const roleLabels: Record<AppRole, string> = {
  admin: 'مدير نظام',
  staff: 'مشرف',
  sponsor: 'مستخدم عادي',
};

const roleBadgeVariants: Record<AppRole, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  staff: 'secondary',
  sponsor: 'outline',
};

export default function UsersManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'staff' | 'sponsor' | ''>('');
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const { toast } = useToast();

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      // Fetch user roles with profiles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email');

      if (profilesError) throw profilesError;

      // Combine data
      const usersWithRoles: UserWithRole[] = (rolesData || []).map((roleRecord) => {
        const profile = profilesData?.find((p) => p.user_id === roleRecord.user_id);
        return {
          user_id: roleRecord.user_id,
          role: roleRecord.role as AppRole,
          profile: profile ? { full_name: profile.full_name, email: profile.email } : null,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        variant: 'destructive',
        title: 'خطأ في تحميل المستخدمين',
        description: error.message,
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async () => {
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

      setEmail('');
      setRole('');
      setIsDialogOpen(false);
      fetchUsers();
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

  const handleEditRole = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsEditDialogOpen(true);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    setIsUpdatingRole(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast({
        title: 'تم تحديث الدور',
        description: `تم تغيير دور ${selectedUser.profile?.full_name || 'المستخدم'} إلى ${roleLabels[newRole]}`,
      });

      setIsEditDialogOpen(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
    } catch (error: any) {
      console.error('Update role error:', error);
      toast({
        variant: 'destructive',
        title: 'فشل تحديث الدور',
        description: error.message || 'حدث خطأ غير متوقع',
      });
    } finally {
      setIsUpdatingRole(false);
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
                  <Select value={role} onValueChange={(value: 'admin' | 'staff' | 'sponsor') => setRole(value)}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="اختر الدور" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">مدير نظام (Admin)</SelectItem>
                      <SelectItem value="staff">مشرف (Staff)</SelectItem>
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

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              قائمة المستخدمين
            </CardTitle>
            <CardDescription>
              جميع المستخدمين المسجلين في النظام مع صلاحياتهم
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                لا يوجد مستخدمين مسجلين
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>البريد الإلكتروني</TableHead>
                      <TableHead>الدور</TableHead>
                      <TableHead className="text-left">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell className="font-medium">
                          {user.profile?.full_name || 'غير محدد'}
                        </TableCell>
                        <TableCell dir="ltr" className="text-left">
                          {user.profile?.email || 'غير محدد'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={roleBadgeVariants[user.role]}>
                            {roleLabels[user.role]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditRole(user)}
                            className="gap-1"
                          >
                            <Edit className="h-4 w-4" />
                            تعديل الدور
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Role Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                تعديل دور المستخدم
              </DialogTitle>
              <DialogDescription>
                تغيير صلاحيات {selectedUser?.profile?.full_name || 'المستخدم'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  الدور الجديد
                </Label>
                <Select value={newRole} onValueChange={(value: AppRole) => setNewRole(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">مدير نظام (Admin)</SelectItem>
                    <SelectItem value="staff">مشرف (Staff)</SelectItem>
                    <SelectItem value="sponsor">مستخدم عادي (Sponsor)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                disabled={isUpdatingRole}
              >
                إلغاء
              </Button>
              <Button 
                onClick={handleUpdateRole} 
                disabled={isUpdatingRole || !newRole || newRole === selectedUser?.role}
                className="gap-2"
              >
                {isUpdatingRole ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري التحديث...
                  </>
                ) : (
                  'حفظ التغييرات'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">شرح الصلاحيات</CardTitle>
            <CardDescription>
              معلومات حول أدوار المستخدمين وصلاحياتهم
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
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
                  <Shield className="h-4 w-4 text-secondary" />
                  مشرف (Staff)
                </h3>
                <p className="text-sm text-muted-foreground">
                  يمكنه إدارة الأيتام والكفالات والإيصالات بدون صلاحيات إدارة المستخدمين
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
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
