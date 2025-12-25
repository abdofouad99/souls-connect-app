import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, Eye, Upload, FileCheck, Image as ImageIcon, Loader2 } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useSponsorshipRequests,
  useUpdateSponsorshipRequestStatus,
  useUploadCashReceipt,
  SponsorshipRequest,
} from '@/hooks/useSponsorshipRequests';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig = {
  pending: { label: 'قيد المراجعة', icon: Clock, class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  approved: { label: 'معتمد', icon: CheckCircle2, class: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  rejected: { label: 'مرفوض', icon: XCircle, class: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export default function SponsorshipRequestsManagement() {
  const { data: requests, isLoading } = useSponsorshipRequests();
  const updateStatus = useUpdateSponsorshipRequestStatus();
  const uploadCashReceipt = useUploadCashReceipt();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedRequest, setSelectedRequest] = useState<SponsorshipRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  
  const [rejectNotes, setRejectNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [uploading, setUploading] = useState(false);

  const filteredRequests = requests?.filter((req) => {
    const matchesStatus = statusFilter === 'all' || req.admin_status === statusFilter;
    const matchesSearch = 
      req.sponsor_full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.sponsor_phone.includes(searchQuery) ||
      req.orphan?.full_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleApprove = async (request: SponsorshipRequest) => {
    try {
      console.log('[Approve] Approving request:', request.id);
      await updateStatus.mutateAsync({
        id: request.id,
        admin_status: 'approved',
      });
      console.log('[Approve] Success');
      toast({ title: 'تم اعتماد الطلب بنجاح' });
      // Close details dialog if open
      if (selectedRequest?.id === request.id) {
        setShowDetailsDialog(false);
      }
    } catch (error: any) {
      console.error('[Approve] Error:', error);
      let errorMsg = 'حدث خطأ أثناء اعتماد الطلب';
      if (error?.code === '42501' || error?.message?.includes('policy')) {
        errorMsg = 'لا تملك صلاحية اعتماد الطلبات';
      }
      toast({ title: errorMsg, variant: 'destructive' });
    }
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectNotes.trim()) {
      toast({ title: 'يرجى إدخال سبب الرفض', variant: 'destructive' });
      return;
    }

    try {
      console.log('[Reject] Rejecting request:', selectedRequest.id);
      await updateStatus.mutateAsync({
        id: selectedRequest.id,
        admin_status: 'rejected',
        admin_notes: rejectNotes,
      });
      console.log('[Reject] Success');
      toast({ title: 'تم رفض الطلب' });
      setShowRejectDialog(false);
      setRejectNotes('');
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('[Reject] Error:', error);
      let errorMsg = 'حدث خطأ أثناء رفض الطلب';
      if (error?.code === '42501' || error?.message?.includes('policy')) {
        errorMsg = 'لا تملك صلاحية رفض الطلبات';
      }
      toast({ title: errorMsg, variant: 'destructive' });
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedRequest || !receiptFile) {
      toast({ title: 'يرجى اختيار صورة السند', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      console.log('[UploadReceipt] Uploading receipt for:', selectedRequest.id);
      
      // Upload to storage
      const fileExt = receiptFile.name.split('.').pop();
      const fileName = `${selectedRequest.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('cash-receipts')
        .upload(fileName, receiptFile);

      if (uploadError) {
        console.error('[UploadReceipt] Storage upload error:', uploadError);
        throw uploadError;
      }
      
      console.log('[UploadReceipt] File uploaded:', uploadData);

      // Get signed URL (private bucket)
      const { data: signedData, error: signedError } = await supabase.storage
        .from('cash-receipts')
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      if (signedError || !signedData?.signedUrl) {
        console.error('[UploadReceipt] Signed URL error:', signedError);
        throw new Error('فشل في إنشاء رابط الصورة');
      }
      
      console.log('[UploadReceipt] Got signed URL');

      // Update request
      await uploadCashReceipt.mutateAsync({
        id: selectedRequest.id,
        cash_receipt_image: signedData.signedUrl,
        cash_receipt_number: receiptNumber || undefined,
        cash_receipt_date: receiptDate || undefined,
      });

      console.log('[UploadReceipt] Success');
      toast({ title: 'تم رفع سند القبض بنجاح' });
      setShowReceiptDialog(false);
      setReceiptFile(null);
      setReceiptNumber('');
      setReceiptDate('');
      setSelectedRequest(null);
    } catch (error: any) {
      console.error('[UploadReceipt] Error:', error);
      let errorMsg = 'حدث خطأ أثناء رفع السند';
      if (error?.message?.includes('policy') || error?.statusCode === 403) {
        errorMsg = 'لا تملك صلاحية رفع الملفات';
      } else if (error?.message?.includes('too large') || error?.statusCode === 413) {
        errorMsg = 'حجم الملف كبير جداً';
      }
      toast({ title: errorMsg, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const openDetails = (request: SponsorshipRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const openRejectDialog = (request: SponsorshipRequest) => {
    setSelectedRequest(request);
    setRejectNotes('');
    setShowRejectDialog(true);
  };

  const openReceiptDialog = (request: SponsorshipRequest) => {
    setSelectedRequest(request);
    setReceiptFile(null);
    setReceiptNumber('');
    setReceiptDate('');
    setShowReceiptDialog(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-serif font-bold">طلبات الكفالة</h1>
          <div className="flex items-center gap-3 text-sm">
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {requests?.filter(r => r.admin_status === 'pending').length || 0} قيد المراجعة
            </Badge>
            <Badge variant="outline" className="gap-1 text-green-600">
              <CheckCircle2 className="h-3 w-3" />
              {requests?.filter(r => r.admin_status === 'approved').length || 0} معتمد
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="بحث بالاسم أو الهاتف أو اليتيم..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:max-w-xs"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="sm:w-48">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحالات</SelectItem>
              <SelectItem value="pending">قيد المراجعة</SelectItem>
              <SelectItem value="approved">معتمد</SelectItem>
              <SelectItem value="rejected">مرفوض</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-card rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الكافل</TableHead>
                <TableHead>اليتيم</TableHead>
                <TableHead>النوع</TableHead>
                <TableHead>المبلغ</TableHead>
                <TableHead>التاريخ</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>السند</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : filteredRequests?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    لا توجد طلبات
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests?.map((request) => {
                  const StatusIcon = statusConfig[request.admin_status].icon;
                  return (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.sponsor_full_name}</div>
                          <div className="text-sm text-muted-foreground">{request.sponsor_phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>{request.orphan?.full_name || '-'}</TableCell>
                      <TableCell>
                        {request.sponsorship_type === 'monthly' ? 'شهرية' : 'سنوية'}
                      </TableCell>
                      <TableCell className="font-bold">{request.amount} ر.س</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(request.created_at), 'dd/MM/yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusConfig[request.admin_status].class}>
                          <StatusIcon className="h-3 w-3 ml-1" />
                          {statusConfig[request.admin_status].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {request.admin_status === 'approved' && (
                          request.cash_receipt_image ? (
                            <Badge className="bg-green-100 text-green-800">
                              <FileCheck className="h-3 w-3 ml-1" />
                              تم الرفع
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-yellow-600">
                              <Clock className="h-3 w-3 ml-1" />
                              في الانتظار
                            </Badge>
                          )
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetails(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {request.admin_status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() => handleApprove(request)}
                                disabled={updateStatus.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => openRejectDialog(request)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}

                          {request.admin_status === 'approved' && !request.cash_receipt_image && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary"
                              onClick={() => openReceiptDialog(request)}
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تفاصيل طلب الكفالة</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">اسم الكافل</Label>
                  <p className="font-medium">{selectedRequest.sponsor_full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">رقم الهاتف</Label>
                  <p className="font-medium" dir="ltr">{selectedRequest.sponsor_phone}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">البريد الإلكتروني</Label>
                  <p className="font-medium">{selectedRequest.sponsor_email || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">البلد</Label>
                  <p className="font-medium">{selectedRequest.sponsor_country || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">اليتيم المكفول</Label>
                  <p className="font-medium">{selectedRequest.orphan?.full_name || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">نوع الكفالة</Label>
                  <p className="font-medium">
                    {selectedRequest.sponsorship_type === 'monthly' ? 'شهرية' : 'سنوية'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">المبلغ</Label>
                  <p className="font-bold text-primary">{selectedRequest.amount} ر.س</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">تاريخ الطلب</Label>
                  <p className="font-medium">
                    {format(new Date(selectedRequest.created_at), 'dd MMMM yyyy - HH:mm', { locale: ar })}
                  </p>
                </div>
              </div>

              {selectedRequest.transfer_receipt_image && (
                <div>
                  <Label className="text-muted-foreground mb-2 block">صورة إثبات التحويل</Label>
                  <img
                    src={selectedRequest.transfer_receipt_image}
                    alt="إثبات التحويل"
                    className="rounded-lg border max-h-64 object-contain"
                  />
                </div>
              )}

              {selectedRequest.admin_status === 'rejected' && selectedRequest.admin_notes && (
                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg">
                  <Label className="text-red-600 mb-1 block">سبب الرفض</Label>
                  <p>{selectedRequest.admin_notes}</p>
                </div>
              )}

              {selectedRequest.cash_receipt_image ? (
                <div>
                  <Label className="text-muted-foreground mb-2 block">سند القبض</Label>
                  <img
                    src={selectedRequest.cash_receipt_image}
                    alt="سند القبض"
                    className="rounded-lg border max-h-64 object-contain"
                  />
                  {selectedRequest.cash_receipt_number && (
                    <p className="mt-2 text-sm">رقم السند: {selectedRequest.cash_receipt_number}</p>
                  )}
                  {selectedRequest.cash_receipt_date && (
                    <p className="text-sm">تاريخ السند: {selectedRequest.cash_receipt_date}</p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedRequest.cash_receipt_image!, '_blank')}
                    >
                      <Eye className="h-4 w-4 ml-1" />
                      فتح
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a href={selectedRequest.cash_receipt_image!} download>
                        تحميل
                      </a>
                    </Button>
                  </div>
                </div>
              ) : selectedRequest.admin_status === 'approved' && (
                <div className="bg-muted/50 p-4 rounded-lg border border-dashed">
                  <Label className="text-muted-foreground mb-3 block">رفع سند القبض</Label>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">صورة السند *</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                        className="mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm">رقم السند</Label>
                        <Input
                          value={receiptNumber}
                          onChange={(e) => setReceiptNumber(e.target.value)}
                          placeholder="اختياري"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">تاريخ السند</Label>
                        <Input
                          type="date"
                          value={receiptDate}
                          onChange={(e) => setReceiptDate(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        if (receiptFile) {
                          handleUploadReceipt();
                        } else {
                          toast({ title: 'يرجى اختيار صورة السند', variant: 'destructive' });
                        }
                      }}
                      disabled={uploading || !receiptFile}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                          جاري الرفع...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 ml-2" />
                          حفظ السند
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Action buttons for pending requests in dialog */}
              {selectedRequest.admin_status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    variant="default"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={updateStatus.isPending}
                  >
                    {updateStatus.isPending ? (
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                    )}
                    اعتماد الطلب
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => {
                      setShowDetailsDialog(false);
                      openRejectDialog(selectedRequest);
                    }}
                  >
                    <XCircle className="h-4 w-4 ml-2" />
                    رفض الطلب
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفض الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>سبب الرفض *</Label>
              <Textarea
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                placeholder="يرجى توضيح سبب رفض الطلب..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={updateStatus.isPending}
            >
              {updateStatus.isPending ? 'جاري الرفض...' : 'تأكيد الرفض'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upload Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>رفع سند القبض</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>صورة السند *</Label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                className="hidden"
                id="cash-receipt-upload"
              />
              {receiptFile ? (
                <div className="mt-2 p-4 bg-muted rounded-lg flex items-center gap-3">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="font-medium">{receiptFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReceiptFile(null)}
                  >
                    إزالة
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="cash-receipt-upload"
                  className="mt-2 flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">اضغط لرفع صورة السند</span>
                </label>
              )}
            </div>

            <div>
              <Label>رقم السند (اختياري)</Label>
              <Input
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="مثال: 12345"
              />
            </div>

            <div>
              <Label>تاريخ السند (اختياري)</Label>
              <Input
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUploadReceipt} disabled={uploading || !receiptFile}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                'حفظ السند'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
