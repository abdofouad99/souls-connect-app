import { useState, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Loader2, Download, Upload, FileSpreadsheet } from 'lucide-react';
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
  DialogDescription,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ImageUpload } from '@/components/ui/image-upload';
import { useOrphans, useCreateOrphan, useUpdateOrphan, useDeleteOrphan } from '@/hooks/useOrphans';
import { uploadOrphanPhoto } from '@/lib/storage';
import { exportOrphans, parseExcelFile, mapOrphanImportData, downloadOrphansTemplate } from '@/lib/exportUtils';
import { toast } from '@/hooks/use-toast';
import type { Orphan } from '@/lib/types';

const statusLabels: Record<string, { label: string; class: string }> = {
  available: { label: 'متاح', class: 'bg-primary text-primary-foreground' },
  partially_sponsored: { label: 'جزئي', class: 'bg-secondary text-secondary-foreground' },
  fully_sponsored: { label: 'مكفول', class: 'bg-muted text-muted-foreground' },
  inactive: { label: 'غير نشط', class: 'bg-muted text-muted-foreground' },
  // Legacy values (for backward compatibility)
  partial: { label: 'جزئي', class: 'bg-secondary text-secondary-foreground' },
  full: { label: 'مكفول', class: 'bg-muted text-muted-foreground' },
  sponsored: { label: 'مكفول', class: 'bg-muted text-muted-foreground' },
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
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedOrphan, setSelectedOrphan] = useState<Orphan | null>(null);
  const [formData, setFormData] = useState<Omit<Orphan, 'id' | 'created_at' | 'updated_at'>>(emptyOrphan);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredOrphans = orphans?.filter(orphan =>
    orphan.full_name.includes(search) ||
    orphan.city.includes(search) ||
    orphan.country.includes(search)
  ) || [];

  const handleOpenCreate = () => {
    setSelectedOrphan(null);
    setFormData(emptyOrphan);
    setSelectedFile(null);
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
    setSelectedFile(null);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let photoUrl = formData.photo_url;

      // Upload photo if a new file was selected
      if (selectedFile) {
        const tempId = selectedOrphan?.id || `temp-${Date.now()}`;
        photoUrl = await uploadOrphanPhoto(selectedFile, tempId);
      }

      const dataToSave = { ...formData, photo_url: photoUrl };

      if (selectedOrphan) {
        await updateOrphan.mutateAsync({ id: selectedOrphan.id, ...dataToSave });
        toast({ title: 'تم تحديث بيانات اليتيم بنجاح' });
      } else {
        await createOrphan.mutateAsync(dataToSave);
        toast({ title: 'تمت إضافة اليتيم بنجاح' });
      }
      setDialogOpen(false);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error?.message || 'حدث خطأ غير متوقع';
      toast({ title: errorMessage, variant: 'destructive' });
    } finally {
      setUploading(false);
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await parseExcelFile(file);
      const mappedData = mapOrphanImportData(data);
      setImportPreview(mappedData);
      setImportDialogOpen(true);
    } catch (error) {
      toast({ title: 'خطأ في قراءة الملف', variant: 'destructive' });
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImport = async () => {
    if (importPreview.length === 0) return;
    
    setImporting(true);
    let successCount = 0;
    let errorCount = 0;

    for (const orphan of importPreview) {
      try {
        // Validate required fields
        if (!orphan.full_name || !orphan.city || !orphan.country) {
          errorCount++;
          continue;
        }

        await createOrphan.mutateAsync({
          full_name: orphan.full_name,
          age: orphan.age || 5,
          gender: orphan.gender || 'male',
          city: orphan.city,
          country: orphan.country,
          status: orphan.status || 'available',
          monthly_amount: orphan.monthly_amount || 100,
          story: orphan.story || '',
          photo_url: '',
          intro_video_url: '',
        });
        successCount++;
      } catch (error) {
        errorCount++;
      }
    }

    setImporting(false);
    setImportDialogOpen(false);
    setImportPreview([]);

    if (successCount > 0) {
      toast({ title: `تم استيراد ${successCount} يتيم بنجاح` });
    }
    if (errorCount > 0) {
      toast({ title: `فشل استيراد ${errorCount} سجل`, variant: 'destructive' });
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
          <div className="flex gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".xlsx,.xls"
              className="hidden"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Upload className="h-5 w-5" />
                  استيراد
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <FileSpreadsheet className="h-4 w-4 ml-2" />
                  استيراد من Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadOrphansTemplate}>
                  <Download className="h-4 w-4 ml-2" />
                  تحميل القالب
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={() => orphans && exportOrphans(orphans)} variant="outline" disabled={!orphans?.length}>
              <Download className="h-5 w-5" />
              تصدير Excel
            </Button>
            <Button onClick={handleOpenCreate} variant="hero">
              <Plus className="h-5 w-5" />
              إضافة يتيم
            </Button>
          </div>
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
                    <TableHead>الصورة</TableHead>
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
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden">
                          {orphan.photo_url ? (
                            <img src={orphan.photo_url} alt={orphan.full_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                              لا صورة
                            </div>
                          )}
                        </div>
                      </TableCell>
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
            {/* Photo Upload */}
            <div>
              <Label>صورة اليتيم</Label>
              <ImageUpload
                value={formData.photo_url}
                onChange={(url) => setFormData({ ...formData, photo_url: url })}
                onFileSelect={setSelectedFile}
                disabled={uploading}
              />
            </div>

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
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">متاح للكفالة</SelectItem>
                    <SelectItem value="partially_sponsored">مكفول جزئياً</SelectItem>
                    <SelectItem value="fully_sponsored">مكفول بالكامل</SelectItem>
                    <SelectItem value="inactive">غير نشط</SelectItem>
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

            <div>
              <Label>رابط الفيديو التعريفي</Label>
              <Input
                value={formData.intro_video_url}
                onChange={(e) => setFormData({ ...formData, intro_video_url: e.target.value })}
                placeholder="https://youtube.com/..."
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="flex-1" disabled={uploading}>
                إلغاء
              </Button>
              <Button type="submit" variant="hero" className="flex-1" disabled={uploading || createOrphan.isPending || updateOrphan.isPending}>
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    جاري الرفع...
                  </>
                ) : selectedOrphan ? 'تحديث' : 'إضافة'}
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

      {/* Import Preview Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">معاينة الاستيراد</DialogTitle>
            <DialogDescription>
              سيتم استيراد {importPreview.length} سجل. تأكد من صحة البيانات قبل المتابعة.
            </DialogDescription>
          </DialogHeader>
          
          {importPreview.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>الاسم</TableHead>
                    <TableHead>العمر</TableHead>
                    <TableHead>الجنس</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>البلد</TableHead>
                    <TableHead>المبلغ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importPreview.slice(0, 10).map((orphan, index) => (
                    <TableRow key={index}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{orphan.full_name || '-'}</TableCell>
                      <TableCell>{orphan.age || '-'}</TableCell>
                      <TableCell>{orphan.gender === 'male' ? 'ذكر' : orphan.gender === 'female' ? 'أنثى' : '-'}</TableCell>
                      <TableCell>{orphan.city || '-'}</TableCell>
                      <TableCell>{orphan.country || '-'}</TableCell>
                      <TableCell>{orphan.monthly_amount || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {importPreview.length > 10 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  و {importPreview.length - 10} سجلات أخرى...
                </p>
              )}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setImportDialogOpen(false);
                setImportPreview([]);
              }} 
              className="flex-1"
              disabled={importing}
            >
              إلغاء
            </Button>
            <Button 
              onClick={handleImport} 
              variant="hero" 
              className="flex-1" 
              disabled={importing || importPreview.length === 0}
            >
              {importing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الاستيراد...
                </>
              ) : (
                `استيراد ${importPreview.length} سجل`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
