import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useMyRequests } from '@/hooks/useSponsorshipRequests';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, Calendar, Clock, CheckCircle, XCircle, User, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const statusConfig = {
  pending: {
    label: 'قيد المراجعة',
    icon: Clock,
    variant: 'secondary' as const,
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  approved: {
    label: 'معتمد',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  rejected: {
    label: 'مرفوض',
    icon: XCircle,
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
};

const sponsorshipTypeLabels = {
  monthly: 'شهرية',
  yearly: 'سنوية',
};

export default function MyRequests() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: requests, isLoading } = useMyRequests(user?.id);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  if (authLoading || isLoading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-4xl mx-auto space-y-6">
            <Skeleton className="h-12 w-64" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </Layout>
    );
  }

  const pendingCount = requests?.filter(r => r.admin_status === 'pending').length || 0;
  const approvedCount = requests?.filter(r => r.admin_status === 'approved').length || 0;
  const rejectedCount = requests?.filter(r => r.admin_status === 'rejected').length || 0;

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center animate-fade-up">
            <h1 className="text-4xl font-bold text-foreground mb-4">طلباتي</h1>
            <p className="text-muted-foreground">
              متابعة حالة طلبات الكفالة الخاصة بك
            </p>
          </div>

          {/* Summary Stats */}
          {requests && requests.length > 0 && (
            <div className="grid grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: '0.05s' }}>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-500" />
                    <span className="text-2xl font-bold text-foreground">{pendingCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">قيد المراجعة</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-2xl font-bold text-foreground">{approvedCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">معتمد</p>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-2xl font-bold text-foreground">{rejectedCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">مرفوض</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Requests List */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                جميع الطلبات
              </CardTitle>
              <CardDescription>
                {requests && requests.length > 0
                  ? `لديك ${requests.length} طلب كفالة`
                  : 'لا توجد طلبات بعد'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {requests && requests.length > 0 ? (
                <div className="space-y-4">
                  {requests.map((request) => {
                    const status = statusConfig[request.admin_status];
                    const StatusIcon = status.icon;

                    return (
                      <div
                        key={request.id}
                        className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                      >
                        {/* Orphan Image */}
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                          {request.orphan?.photo_url ? (
                            <img
                              src={request.orphan.photo_url}
                              alt={request.orphan.full_name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Heart className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>

                        {/* Request Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-foreground">
                              كفالة {request.orphan?.full_name || 'يتيم'}
                            </h4>
                            <Badge className={status.className}>
                              <StatusIcon className="h-3 w-3 ml-1" />
                              {status.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {sponsorshipTypeLabels[request.sponsorship_type]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {request.sponsor_full_name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            تاريخ الطلب: {format(new Date(request.created_at), 'dd MMMM yyyy', { locale: ar })}
                          </p>
                          {request.admin_status === 'approved' && request.approved_at && (
                            <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-1">
                              <CheckCircle className="h-3 w-3" />
                              تم الاعتماد: {format(new Date(request.approved_at), 'dd MMMM yyyy', { locale: ar })}
                            </p>
                          )}
                          {request.admin_notes && request.admin_status === 'rejected' && (
                            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                              سبب الرفض: {request.admin_notes}
                            </p>
                          )}
                        </div>

                        {/* Amount */}
                        <div className="text-left flex-shrink-0">
                          <p className="font-bold text-primary text-lg">
                            {request.amount.toLocaleString('ar-SA')} ر.س
                          </p>
                        </div>

                        {/* Cash Receipt Info */}
                        {request.admin_status === 'approved' && request.cash_receipt_image && (
                          <div className="flex-shrink-0">
                            <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-200">
                              تم إصدار السند
                            </Badge>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">لا توجد طلبات كفالة بعد</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    ابدأ رحلة الخير بكفالة يتيم الآن
                  </p>
                  <Button onClick={() => navigate('/orphans')}>
                    <Heart className="h-4 w-4 ml-2" />
                    اكفل يتيماً الآن
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Info Note */}
          {requests && requests.length > 0 && (
            <Card className="animate-fade-up bg-muted/50" style={{ animationDelay: '0.2s' }}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground mb-1">ملاحظة</h4>
                    <p className="text-sm text-muted-foreground">
                      يتم مراجعة طلبات الكفالة من قبل الإدارة خلال 24-48 ساعة. 
                      بعد الاعتماد، سيتم إصدار سند القبض ويمكنك الاستعلام عنه من صفحة "استعلام عن السند".
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
