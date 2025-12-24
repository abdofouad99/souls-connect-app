import { Bell, Mail, CheckCircle, XCircle, RefreshCw, Search } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface NotificationLog {
  id: string;
  notification_type: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  status: string;
  error_message: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const notificationTypeLabels: Record<string, string> = {
  sponsorship_admin: 'إشعار كفالة للمشرف',
  sponsorship_sponsor: 'تأكيد كفالة للكفيل',
  deposit_admin: 'إشعار إيداع للمشرف',
  deposit_sponsor: 'تأكيد إيداع للكفيل',
};

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  sent: { label: 'تم الإرسال', variant: 'default' },
  failed: { label: 'فشل', variant: 'destructive' },
  pending: { label: 'قيد الانتظار', variant: 'secondary' },
};

export default function NotificationsLog() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notification-logs', typeFilter, statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('notification_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (typeFilter !== 'all') {
        query = query.eq('notification_type', typeFilter);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as NotificationLog[];
    },
  });

  const filteredNotifications = notifications?.filter((notification) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      notification.recipient_email.toLowerCase().includes(search) ||
      notification.recipient_name?.toLowerCase().includes(search) ||
      notification.subject.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: notifications?.length || 0,
    sent: notifications?.filter((n) => n.status === 'sent').length || 0,
    failed: notifications?.filter((n) => n.status === 'failed').length || 0,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-foreground flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              سجل الإشعارات
            </h1>
            <p className="text-muted-foreground mt-1">
              عرض جميع الإشعارات المرسلة عبر البريد الإلكتروني
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            تحديث
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الإشعارات</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                  <p className="text-sm text-muted-foreground">تم إرسالها</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                  <p className="text-sm text-muted-foreground">فشل الإرسال</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالبريد الإلكتروني أو الاسم..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="نوع الإشعار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الأنواع</SelectItem>
                  <SelectItem value="sponsorship_admin">إشعار كفالة للمشرف</SelectItem>
                  <SelectItem value="sponsorship_sponsor">تأكيد كفالة للكفيل</SelectItem>
                  <SelectItem value="deposit_admin">إشعار إيداع للمشرف</SelectItem>
                  <SelectItem value="deposit_sponsor">تأكيد إيداع للكفيل</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="الحالة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="sent">تم الإرسال</SelectItem>
                  <SelectItem value="failed">فشل</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">الإشعارات المرسلة</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : filteredNotifications?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد إشعارات مطابقة للبحث</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">المستلم</TableHead>
                      <TableHead className="text-right">الموضوع</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications?.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(notification.created_at), 'dd MMM yyyy HH:mm', {
                            locale: ar,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {notificationTypeLabels[notification.notification_type] ||
                              notification.notification_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            {notification.recipient_name && (
                              <p className="font-medium">{notification.recipient_name}</p>
                            )}
                            <p className="text-sm text-muted-foreground" dir="ltr">
                              {notification.recipient_email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {notification.subject}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={statusConfig[notification.status]?.variant || 'secondary'}
                          >
                            {notification.status === 'sent' && (
                              <CheckCircle className="h-3 w-3 ml-1" />
                            )}
                            {notification.status === 'failed' && (
                              <XCircle className="h-3 w-3 ml-1" />
                            )}
                            {statusConfig[notification.status]?.label || notification.status}
                          </Badge>
                          {notification.error_message && (
                            <p className="text-xs text-red-500 mt-1 max-w-xs truncate">
                              {notification.error_message}
                            </p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
