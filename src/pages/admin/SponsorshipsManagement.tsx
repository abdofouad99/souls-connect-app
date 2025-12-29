import { useState, useCallback } from 'react';
import { Search, ExternalLink, Download, Image as ImageIcon, FileImage, Receipt } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useSponsorships, useUpdateSponsorshipStatus } from '@/hooks/useSponsorships';
import { exportSponsorships } from '@/lib/exportUtils';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { SignedImage } from '@/components/common/SignedImage';

const statusLabels = {
  active: { label: 'نشطة', class: 'bg-primary text-primary-foreground' },
  paused: { label: 'متوقفة', class: 'bg-secondary text-secondary-foreground' },
  completed: { label: 'مكتملة', class: 'bg-accent text-accent-foreground' },
  cancelled: { label: 'ملغاة', class: 'bg-muted text-muted-foreground' },
};

const typeLabels = {
  monthly: 'شهرية',
  yearly: 'سنوية',
};

export default function SponsorshipsManagement() {
  const { data: sponsorships, isLoading } = useSponsorships();
  const updateStatus = useUpdateSponsorshipStatus();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const handleImageError = useCallback((sponsorshipId: string, url: string) => {
    console.error(`[ImageError] Failed to load image for sponsorship ${sponsorshipId}:`, url);
    setImageErrors(prev => ({ ...prev, [sponsorshipId]: true }));
  }, []);

  const filteredSponsorships = sponsorships?.filter(sponsorship => {
    // Get sponsor name from direct field or relation
    const sponsorName = (sponsorship as any).sponsor_full_name || sponsorship.sponsor?.full_name || '';
    const sponsorPhone = (sponsorship as any).sponsor_phone || sponsorship.sponsor?.phone || '';
    
    const matchesSearch = 
      sponsorship.orphan?.full_name.includes(search) ||
      sponsorName.includes(search) ||
      sponsorPhone.includes(search) ||
      sponsorship.receipt_number.includes(search);
    
    const matchesStatus = statusFilter === 'all' || sponsorship.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast({ title: 'تم تحديث حالة الكفالة' });
    } catch (error) {
      toast({ title: 'حدث خطأ', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground">إدارة الكفالات</h1>
            <p className="text-muted-foreground mt-1">عرض وإدارة جميع الكفالات</p>
          </div>
          <Button onClick={() => sponsorships && exportSponsorships(sponsorships)} variant="outline" disabled={!sponsorships?.length}>
            <Download className="h-5 w-5" />
            تصدير Excel
          </Button>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-card">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="بحث باسم اليتيم أو الكافل أو رقم الإيصال..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="active">نشطة</SelectItem>
                <SelectItem value="paused">متوقفة</SelectItem>
                <SelectItem value="completed">مكتملة</SelectItem>
                <SelectItem value="cancelled">ملغاة</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded" />
              ))}
            </div>
          ) : filteredSponsorships.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              لا توجد كفالات
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الإيصال</TableHead>
                    <TableHead>اليتيم</TableHead>
                    <TableHead>الكافل</TableHead>
                    <TableHead>النوع</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>تاريخ البدء</TableHead>
                    <TableHead>صورة التحويل</TableHead>
                    <TableHead>سند القبض</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSponsorships.map((sponsorship) => (
                    <TableRow key={sponsorship.id}>
                      <TableCell className="font-mono text-sm" dir="ltr">
                        {sponsorship.receipt_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sponsorship.orphan?.full_name || '-'}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {(sponsorship as any).sponsor_full_name || sponsorship.sponsor?.full_name || '-'}
                          </div>
                          {((sponsorship as any).sponsor_phone || sponsorship.sponsor?.phone) && (
                            <div className="text-sm text-muted-foreground" dir="ltr">
                              {(sponsorship as any).sponsor_phone || sponsorship.sponsor?.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{typeLabels[sponsorship.type]}</TableCell>
                      <TableCell>{sponsorship.monthly_amount} ر.س</TableCell>
                      <TableCell>
                        {format(new Date(sponsorship.start_date), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      {/* صورة التحويل */}
                      <TableCell>
                        {(sponsorship as any).transfer_receipt_image || (sponsorship as any).receipt_image_url ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="group relative w-12 h-12 rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer">
                                {imageErrors[sponsorship.id] ? (
                                  <div className="w-full h-full flex items-center justify-center bg-muted">
                                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                                  </div>
                                ) : (
                                  <>
                                    <SignedImage 
                                      path={(sponsorship as any).transfer_receipt_image || (sponsorship as any).receipt_image_url}
                                      bucket="deposit-receipts"
                                      alt="صورة التحويل" 
                                      className="w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                      <ImageIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                  </>
                                )}
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>صورة إيصال التحويل</DialogTitle>
                                <DialogDescription>
                                  رقم الإيصال: {sponsorship.receipt_number}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="mt-4">
                                <SignedImage 
                                  path={(sponsorship as any).transfer_receipt_image || (sponsorship as any).receipt_image_url}
                                  bucket="deposit-receipts"
                                  alt="صورة التحويل" 
                                  className="w-full rounded-lg border border-border"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground text-sm">لا يوجد</span>
                        )}
                      </TableCell>
                      
                      {/* سند القبض */}
                      <TableCell>
                        {(sponsorship as any).cash_receipt_image ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <button className="group relative w-12 h-12 rounded-lg overflow-hidden border border-primary/50 hover:border-primary transition-colors cursor-pointer bg-primary/5">
                                <SignedImage 
                                  path={(sponsorship as any).cash_receipt_image}
                                  bucket="cash-receipts"
                                  alt="سند القبض" 
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <FileImage className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Receipt className="h-5 w-5 text-primary" />
                                  بيانات سند القبض
                                </DialogTitle>
                                <DialogDescription>
                                  رقم الكفالة: {sponsorship.receipt_number}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <Tabs defaultValue="cash-receipt" className="mt-4">
                                <TabsList className="grid w-full grid-cols-2">
                                  <TabsTrigger value="cash-receipt">سند القبض (صورة المشرف)</TabsTrigger>
                                  <TabsTrigger value="system-receipt">إيصال النظام</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="cash-receipt" className="space-y-4">
                                  {/* بيانات السند */}
                                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                                    <div>
                                      <p className="text-sm text-muted-foreground">رقم سند القبض</p>
                                      <p className="font-medium font-mono">
                                        {(sponsorship as any).cash_receipt_number || '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">تاريخ السند</p>
                                      <p className="font-medium">
                                        {(sponsorship as any).cash_receipt_date 
                                          ? format(new Date((sponsorship as any).cash_receipt_date), 'dd MMM yyyy', { locale: ar })
                                          : '-'}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {/* صورة السند */}
                                  <SignedImage 
                                    path={(sponsorship as any).cash_receipt_image}
                                    bucket="cash-receipts"
                                    alt="سند القبض" 
                                    className="w-full rounded-lg border border-border max-h-[500px] object-contain"
                                  />
                                </TabsContent>
                                
                                <TabsContent value="system-receipt">
                                  <div className="text-center py-8">
                                    <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground mb-4">إيصال النظام الإلكتروني</p>
                                    <Button asChild>
                                      <Link to={`/receipt/${sponsorship.receipt_number}`}>
                                        <ExternalLink className="h-4 w-4 ml-2" />
                                        فتح الإيصال
                                      </Link>
                                    </Button>
                                  </div>
                                </TabsContent>
                              </Tabs>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground text-sm">لم يُرفع</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={sponsorship.status}
                          onValueChange={(v) => handleStatusChange(sponsorship.id, v)}
                        >
                          <SelectTrigger className="w-28 h-8">
                            <Badge className={statusLabels[sponsorship.status].class}>
                              {statusLabels[sponsorship.status].label}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">نشطة</SelectItem>
                            <SelectItem value="paused">متوقفة</SelectItem>
                            <SelectItem value="completed">مكتملة</SelectItem>
                            <SelectItem value="cancelled">ملغاة</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link to={`/receipt/${sponsorship.receipt_number}`}>
                            <ExternalLink className="h-4 w-4 ml-1" />
                            الإيصال
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
    </AdminLayout>
  );
}
