import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  iban: string | null;
  beneficiary_name: string;
  notes: string | null;
  is_active: boolean;
  display_order: number;
}

const emptyAccount: Omit<BankAccount, 'id'> = {
  bank_name: '',
  account_number: '',
  iban: '',
  beneficiary_name: '',
  notes: '',
  is_active: true,
  display_order: 0,
};

export default function BankAccountsManagement() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState(emptyAccount);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchAccounts();
  }, [isAdmin, navigate]);

  const fetchAccounts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الحسابات البنكية',
        variant: 'destructive',
      });
    } else {
      setAccounts(data || []);
    }
    setLoading(false);
  };

  const handleAdd = () => {
    setSelectedAccount(null);
    setFormData({ ...emptyAccount, display_order: accounts.length });
    setDialogOpen(true);
  };

  const handleEdit = (account: BankAccount) => {
    setSelectedAccount(account);
    setFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      iban: account.iban || '',
      beneficiary_name: account.beneficiary_name,
      notes: account.notes || '',
      is_active: account.is_active,
      display_order: account.display_order,
    });
    setDialogOpen(true);
  };

  const handleDelete = (account: BankAccount) => {
    setSelectedAccount(account);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAccount) return;

    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', selectedAccount.id);

    if (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الحساب البنكي',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'تم الحذف',
        description: 'تم حذف الحساب البنكي بنجاح',
      });
      fetchAccounts();
    }
    setDeleteDialogOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = {
      bank_name: formData.bank_name,
      account_number: formData.account_number,
      iban: formData.iban || null,
      beneficiary_name: formData.beneficiary_name,
      notes: formData.notes || null,
      is_active: formData.is_active,
      display_order: formData.display_order,
    };

    if (selectedAccount) {
      const { error } = await supabase
        .from('bank_accounts')
        .update(payload)
        .eq('id', selectedAccount.id);

      if (error) {
        toast({
          title: 'خطأ',
          description: 'فشل في تحديث الحساب البنكي',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'تم التحديث',
          description: 'تم تحديث الحساب البنكي بنجاح',
        });
        setDialogOpen(false);
        fetchAccounts();
      }
    } else {
      const { error } = await supabase
        .from('bank_accounts')
        .insert([payload]);

      if (error) {
        toast({
          title: 'خطأ',
          description: 'فشل في إضافة الحساب البنكي',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'تمت الإضافة',
          description: 'تم إضافة الحساب البنكي بنجاح',
        });
        setDialogOpen(false);
        fetchAccounts();
      }
    }
    setSaving(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">إدارة الحسابات البنكية</h1>
          </div>
          <Button onClick={handleAdd} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة حساب
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">جاري التحميل...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد حسابات بنكية. أضف حساباً جديداً للبدء.
          </div>
        ) : (
          <div className="rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم البنك</TableHead>
                  <TableHead>رقم الحساب</TableHead>
                  <TableHead>IBAN</TableHead>
                  <TableHead>المستفيد</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.bank_name}</TableCell>
                    <TableCell dir="ltr" className="text-right">{account.account_number}</TableCell>
                    <TableCell dir="ltr" className="text-right">{account.iban || '-'}</TableCell>
                    <TableCell>{account.beneficiary_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        account.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {account.is_active ? 'نشط' : 'غير نشط'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(account)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(account)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedAccount ? 'تعديل الحساب البنكي' : 'إضافة حساب بنكي جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>اسم البنك *</Label>
              <Input
                required
                value={formData.bank_name}
                onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                placeholder="مثال: بنك الراجحي"
              />
            </div>
            <div>
              <Label>رقم الحساب *</Label>
              <Input
                required
                value={formData.account_number}
                onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                placeholder="رقم الحساب"
                dir="ltr"
              />
            </div>
            <div>
              <Label>رقم IBAN</Label>
              <Input
                value={formData.iban}
                onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                placeholder="SA..."
                dir="ltr"
              />
            </div>
            <div>
              <Label>اسم المستفيد *</Label>
              <Input
                required
                value={formData.beneficiary_name}
                onChange={(e) => setFormData({ ...formData, beneficiary_name: e.target.value })}
                placeholder="اسم صاحب الحساب"
              />
            </div>
            <div>
              <Label>ملاحظات</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={2}
              />
            </div>
            <div>
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                min={0}
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>نشط (يظهر للزوار)</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'جاري الحفظ...' : selectedAccount ? 'حفظ التغييرات' : 'إضافة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الحساب البنكي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف حساب "{selectedAccount?.bank_name}"؟ هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}