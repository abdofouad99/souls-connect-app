import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Search, Eye, CheckCircle, XCircle, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

// Component لعرض صورة الإيصال باستخدام signed URL
const ReceiptImageViewer = ({ imageUrl }: { imageUrl: string }) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getSignedUrl = async () => {
      try {
        // استخراج اسم الملف من URL
        const urlParts = imageUrl.split('/deposit-receipts/');
        if (urlParts.length < 2) {
          setError('رابط الصورة غير صالح');
          setIsLoading(false);
          return;
        }
        
        const filePath = urlParts[1];
        
        // الحصول على signed URL صالح لمدة ساعة
        const { data, error: signedUrlError } = await supabase.storage
          .from('deposit-receipts')
          .createSignedUrl(filePath, 3600); // صالح لمدة ساعة

        if (signedUrlError) {
          console.error('Error creating signed URL:', signedUrlError);
          setError('فشل في تحميل الصورة');
        } else {
          setSignedUrl(data.signedUrl);
        }
      } catch (err) {
        console.error('Error:', err);
        setError('حدث خطأ أثناء تحميل الصورة');
      } finally {
        setIsLoading(false);
      }
    };

    getSignedUrl();
  }, [imageUrl]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل الصورة...
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-2">صورة الإيصال</p>
      <a
        href={signedUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-primary hover:underline"
      >
        <ExternalLink className="h-4 w-4" />
        عرض الصورة
      </a>
    </div>
  );
};

interface DepositRequest {
  id: string;
  sponsor_name: string;
  phone_number: string;
  deposit_amount: number;
  bank_method: string;
  receipt_image_url: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: 'قيد الانتظار', variant: 'secondary' },
  approved: { label: 'تمت الموافقة', variant: 'default' },
  rejected: { label: 'مرفوض', variant: 'destructive' },
};

export default function DepositRequestsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<DepositRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  // Fetch deposit requests
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['deposit-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deposit_receipt_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as DepositRequest[];
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const { error } = await supabase
        .from('deposit_receipt_requests')
        .update({ status, notes })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deposit-requests'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الطلب بنجاح',
      });
      setDetailsOpen(false);
    },
    onError: () => {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الطلب',
      });
    },
  });

  // Filter requests
  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      request.sponsor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.phone_number.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    approved: requests.filter((r) => r.status === 'approved').length,
    rejected: requests.filter((r) => r.status === 'rejected').length,
  };

  const handleViewDetails = (request: DepositRequest) => {
    setSelectedRequest(request);
    setDetailsOpen(true);
  };

  const handleUpdateStatus = (status: string) => {
    if (selectedRequest) {
      updateStatusMutation.mutate({ id: selectedRequest.id, status });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">طلبات سند الإيداع</h1>
          <p className="text-muted-foreground">إدارة ومتابعة طلبات سندات الإيداع</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 border border-border">
            <p className="text-sm text-muted-foreground">إجمالي الطلبات</p>
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <p className="text-sm text-muted-foreground">قيد الانتظار</p>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">موافق عليها</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border border-border">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <p className="text-sm text-muted-foreground">مرفوضة</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو رقم الجوال..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد الانتظار</SelectItem>
              <SelectItem value="approved">موافق عليها</SelectItem>
              <SelectItem value="rejected">مرفوضة</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">اسم الكفيل</TableHead>
                <TableHead className="text-right">رقم الجوال</TableHead>
                <TableHead className="text-right">المبلغ</TableHead>
                <TableHead className="text-right">طريقة التحويل</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.sponsor_name}</TableCell>
                    <TableCell dir="ltr" className="text-right">{request.phone_number}</TableCell>
                    <TableCell>{request.deposit_amount.toLocaleString()} ر.س</TableCell>
                    <TableCell>{request.bank_method}</TableCell>
                    <TableCell>
                      <Badge variant={statusConfig[request.status]?.variant || 'secondary'}>
                        {statusConfig[request.status]?.label || request.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(request.created_at), 'dd MMM yyyy', { locale: ar })}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تفاصيل الطلب</DialogTitle>
            </DialogHeader>
            {selectedRequest && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">اسم الكفيل</p>
                    <p className="font-medium">{selectedRequest.sponsor_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">رقم الجوال</p>
                    <p className="font-medium" dir="ltr">{selectedRequest.phone_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">المبلغ</p>
                    <p className="font-medium">{selectedRequest.deposit_amount.toLocaleString()} ر.س</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">طريقة التحويل</p>
                    <p className="font-medium">{selectedRequest.bank_method}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">الحالة</p>
                    <Badge variant={statusConfig[selectedRequest.status]?.variant || 'secondary'}>
                      {statusConfig[selectedRequest.status]?.label || selectedRequest.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">تاريخ الطلب</p>
                    <p className="font-medium">
                      {format(new Date(selectedRequest.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                    </p>
                  </div>
                </div>

                {selectedRequest.receipt_image_url && (
                  <ReceiptImageViewer imageUrl={selectedRequest.receipt_image_url} />
                )}

                {selectedRequest.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <Button
                      className="flex-1"
                      onClick={() => handleUpdateStatus('approved')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4 ml-2" />
                      موافقة
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleUpdateStatus('rejected')}
                      disabled={updateStatusMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 ml-2" />
                      رفض
                    </Button>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
