import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useOrphans, useCreateOrphan, useUpdateOrphan, useDeleteOrphan } from '@/hooks/useOrphans';
import { toast } from '@/hooks/use-toast';
import type { Orphan } from '@/lib/types';

const statusLabels = {
  available: { label: 'متاح', class: 'bg-primary text-primary-foreground' },
  partial: { label: 'جزئي', class: 'bg-secondary text-secondary-foreground' },
  full: { label: 'مكفول', class: 'bg-muted text-muted-foreground' },
};

const emptyOrphan: Omit<Orphan, 'id' | 'created_at' | 'updated_at'> = {
  full_name: '',
  gender: 'male',
  age: 5,
  city: '',
  country: '',
  status: 'available',
  monthly_amount: 100,
  story: '',
  photo_url: '',
  intro_video_url: '',
};

export default function OrphansManagement() {
  const { data: orphans, isLoading } = useOrphans();
  const createOrphan = useCreateOrphan();
  const updateOrphan = useUpdateOrphan();
  const deleteOrphan = useDeleteOrphan();

  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrphan, setSelectedOrphan] = useState<Orphan | null>(null);
  const [formData, setFormData] = useState<Omit<Orphan, 'id' | 'created_at' | 'updated_at'>>(emptyOrphan);

  const filteredOrphans = orphans?.filter(orphan =>
    orphan.full_name.includes(search) ||
    orphan.city.includes(search) ||
    orphan.country.includes(search)
  ) || [];

  const handleOpenCreate = () => {
    setSelectedOrphan(null);
    setFormData(emptyOrphan);
    setDialogOpen(true);
  };

  const handleOpenEdit = (orphan: Orphan) => {
    setSelectedOrphan(orphan);
    setFormData({
      full_name: orphan.full_name,
      gender: orphan.gender,
      age: orphan.age,
      city: orphan.city,
      country: orphan.country,
      status: orphan.status,
      monthly_amount: orphan.monthly_amount,
      story: orphan.story || '',
      photo_url: orphan.photo_url || '',
      intro_video_url: orphan.intro_video_url || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedOrphan) {
        await updateOrphan.mutateAsync({ id: selectedOrphan.id, ...formData });
        toast({ title: 'تم تحديث بيانات اليتيم بنجاح' });
      } else {
        await createOrphan.mutateAsync(formData);
        toast({ title: 'تمت إضافة اليتيم بنجاح' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedOrphan) return;
    try {
      await deleteOrphan.mutateAsync(selectedOrphan.id);
      toast({ title: 'تم حذف اليتيم بنجاح' });
      setDeleteDialogOpen(false);
      setSelectedOrphan(null);
    } catch (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">إدارة الأيتام</h1>
            <p className="text-muted-foreground mt-1">إضافة وتعديل وحذف بيانات الأيتام</p>
          </div>
          <Button onClick={handleOpenCreate} variant="hero">
            <Plus className="h-5 w-5" />
            إضافة يتيم
          </Button>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="بحث..."
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
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>العمر</TableHead>
                    <TableHead>الجنس</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>المبلغ الشهري</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrphans.map((orphan) => (
                    <TableRow key={orphan.id}>
                      <TableCell className="font-medium">{orphan.full_name}</TableCell>
                      <TableCell>{orphan.age} سنة</TableCell>
                      <TableCell>{orphan.gender === 'male' ? 'ذكر' : 'أنثى'}</TableCell>
                      <TableCell>{orphan.city}</TableCell>
                      <TableCell>
                        <Badge className={statusLabels[orphan.status].class}>
                          {statusLabels[orphan.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>{orphan.monthly_amount} ر.س</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(orphan)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedOrphan(orphan);
                              setDeleteDialogOpen(true);
                            }}
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {selectedOrphan ? 'تعديل بيانات اليتيم' : 'إضافة يتيم جديد'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الاسم الكامل *</Label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label>العمر *</Label>
                <Input
                  type="number"
                  required
                  min={1}
                  max={24}
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>الجنس *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v as 'male' | 'female' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">ذكر</SelectItem>
                    <SelectItem value="female">أنثى</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>الحالة *</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as 'available' | 'partial' | 'full' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">متاح للكفالة</SelectItem>
                    <SelectItem value="partial">كفالة جزئية</SelectItem>
                    <SelectItem value="full">مكفول</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>المدينة *</Label>
                <Input
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <Label>البلد *</Label>
                <Input
                  required
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>المبلغ الشهري (ر.س) *</Label>
              <Input
                type="number"
                required
                min={1}
                value={formData.monthly_amount}
                onChange={(e) => setFormData({ ...formData, monthly_amount: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label>القصة</Label>
              <Textarea
                value={formData.story}
                onChange={(e) => setFormData({ ...formData, story: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>رابط الصورة</Label>
                <Input
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                />
              </div>
              <div>
                <Label>رابط الفيديو</Label>
                <Input
                  value={formData.intro_video_url}
                  onChange={(e) => setFormData({ ...formData, intro_video_url: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1">
                إلغاء
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={createOrphan.isPending || updateOrphan.isPending}>
                {selectedOrphan ? 'تحديث' : 'إضافة'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف بيانات اليتيم "{selectedOrphan?.full_name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
