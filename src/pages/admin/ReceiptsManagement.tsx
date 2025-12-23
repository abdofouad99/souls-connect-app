import { useState } from 'react';
import { Search, Printer, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useReceipts, useSponsorships, useCreateReceipt } from '@/hooks/useSponsorships';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ReceiptsManagement() {
  const { data: receipts, isLoading } = useReceipts();
  const { data: sponsorships } = useSponsorships();
  const createReceipt = useCreateReceipt();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    sponsorship_id: '',
    amount: 0,
    payment_reference: '',
  });

  const filteredReceipts = receipts?.filter(receipt =>
    receipt.receipt_number.includes(search) ||
    receipt.sponsorship?.orphan?.full_name.includes(search) ||
    receipt.sponsorship?.sponsor?.full_name.includes(search)
  ) || [];

  // Get active sponsorships for the dropdown
  const activeSponsorships = sponsorships?.filter(s => s.status === 'active') || [];

  const handleOpenCreate = () => {
    setFormData({
      sponsorship_id: '',
      amount: 0,
      payment_reference: '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sponsorship_id) {
      toast({ title: 'يرجى اختيار الكفالة', variant: 'destructive' });
      return;
    }

    try {
      await createReceipt.mutateAsync({
        sponsorship_id: formData.sponsorship_id,
        amount: formData.amount,
        payment_reference: formData.payment_reference || undefined,
      });
      toast({ title: 'تم إضافة الإيصال بنجاح' });
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const handleSponsorshipChange = (sponsorshipId: string) => {
    const selectedSponsorship = sponsorships?.find(s => s.id === sponsorshipId);
    if (selectedSponsorship) {
      setFormData({
        ...formData,
        sponsorship_id: sponsorshipId,
        amount: selectedSponsorship.monthly_amount,
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">إدارة الإيصالات</h1>
            <p className="text-muted-foreground mt-1">عرض وإضافة وطباعة إيصالات الكفالة</p>
          </div>
          <Button onClick={handleOpenCreate} variant="hero">
            <Plus className="h-5 w-5" />
            إضافة إيصال
          </Button>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="بحث برقم الإيصال أو اسم اليتيم أو الكافل..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد إيصالات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الإيصال</TableHead>
                    <TableHead>الكافل</TableHead>
                    <TableHead>اليتيم</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>مرجع الدفع</TableHead>
                    <TableHead>تاريخ الإصدار</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReceipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-mono text-sm" dir="ltr">
                        {receipt.receipt_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {receipt.sponsorship?.sponsor?.full_name || '-'}
                      </TableCell>
                      <TableCell>
                        {receipt.sponsorship?.orphan?.full_name || '-'}
                      </TableCell>
                      <TableCell className="font-bold text-primary">
                        {receipt.amount} ر.س
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {receipt.payment_reference || '-'}
                      </TableCell>
                      <TableCell>
                        {format(new Date(receipt.issue_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="outline" size="sm">
                          <Link to={`/receipt/${receipt.receipt_number}`}>
                            <Printer className="h-4 w-4 ml-1" />
                            طباعة
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Add Receipt Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">إضافة إيصال جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>الكفالة *</Label>
              <Select value={formData.sponsorship_id} onValueChange={handleSponsorshipChange}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الكفالة..." />
                </SelectTrigger>
                <SelectContent>
                  {activeSponsorships.map((sponsorship) => (
                    <SelectItem key={sponsorship.id} value={sponsorship.id}>
                      {sponsorship.orphan?.full_name} - {sponsorship.sponsor?.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>المبلغ (ر.س) *</Label>
              <Input
                type="number"
                required
                min={1}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label>مرجع الدفع (اختياري)</Label>
              <Input
                value={formData.payment_reference}
                onChange={(e) => setFormData({ ...formData, payment_reference: e.target.value })}
                placeholder="رقم التحويل أو العملية..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                إلغاء
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={createReceipt.isPending}>
                {createReceipt.isPending ? 'جاري الإضافة...' : 'إضافة الإيصال'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
