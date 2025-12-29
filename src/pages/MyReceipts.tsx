import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Download, Eye, Calendar, Receipt, User } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface ReceiptWithDetails {
  id: string;
  receipt_number: string;
  issue_date: string;
  amount: number;
  payment_reference: string | null;
  created_at: string;
  sponsorship: {
    id: string;
    type: string;
    status: string;
    orphan: {
      id: string;
      full_name: string;
      photo_url: string | null;
    } | null;
  } | null;
}

export default function MyReceipts() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch user receipts - improved query using user_id from sponsorship_requests
  const { data: receipts, isLoading } = useQuery({
    queryKey: ['my-receipts', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Method 1: Try via sponsors table (for properly linked sponsorships)
      const { data: sponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let sponsorshipIds: string[] = [];

      if (sponsor) {
        const { data: sponsorships } = await supabase
          .from('sponsorships')
          .select('id')
          .eq('sponsor_id', sponsor.id);
        
        if (sponsorships) {
          sponsorshipIds = sponsorships.map(s => s.id);
        }
      }

      // Method 2: Also get sponsorships via sponsorship_requests.user_id
      const { data: userRequests } = await supabase
        .from('sponsorship_requests')
        .select('id')
        .eq('user_id', user.id)
        .eq('admin_status', 'approved');

      if (userRequests && userRequests.length > 0) {
        const requestIds = userRequests.map(r => r.id);
        const { data: requestSponsorships } = await supabase
          .from('sponsorships')
          .select('id')
          .in('request_id', requestIds);

        if (requestSponsorships) {
          // Merge and dedupe
          const newIds = requestSponsorships.map(s => s.id);
          sponsorshipIds = [...new Set([...sponsorshipIds, ...newIds])];
        }
      }

      if (sponsorshipIds.length === 0) return [];

      // Get all receipts for these sponsorships
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          sponsorship:sponsorships(
            id,
            type,
            status,
            orphan:orphans(
              id,
              full_name,
              photo_url
            )
          )
        `)
        .in('sponsorship_id', sponsorshipIds)
        .order('issue_date', { ascending: false });

      if (error) throw error;
      return data as ReceiptWithDetails[];
    },
    enabled: !!user?.id,
  });

  const handleDownload = (receiptNumber: string) => {
    // Open receipt page in new tab for printing/downloading
    window.open(`/receipt/${receiptNumber}`, '_blank');
  };

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

  return (
    <Layout>
      <div className="container py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center animate-fade-up">
            <h1 className="text-4xl font-bold text-foreground mb-4">إيصالاتي</h1>
            <p className="text-muted-foreground">
              عرض وتحميل جميع إيصالات الكفالة الخاصة بك
            </p>
          </div>

          {/* Receipts List */}
          <Card className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                جميع الإيصالات
              </CardTitle>
              <CardDescription>
                {receipts && receipts.length > 0
                  ? `لديك ${receipts.length} إيصال`
                  : 'لا توجد إيصالات بعد'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {receipts && receipts.length > 0 ? (
                <div className="space-y-4">
                  {receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                    >
                      {/* Receipt Icon or Orphan Image */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
                        {receipt.sponsorship?.orphan?.photo_url ? (
                          <img
                            src={receipt.sponsorship.orphan.photo_url}
                            alt={receipt.sponsorship.orphan.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Receipt Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-foreground">
                            {receipt.receipt_number}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {receipt.sponsorship?.type === 'monthly' ? 'شهري' : 'سنوي'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {receipt.sponsorship?.orphan?.full_name || 'يتيم'}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(receipt.issue_date), 'dd MMMM yyyy', { locale: ar })}
                        </p>
                      </div>

                      {/* Amount */}
                      <div className="text-left flex-shrink-0">
                        <p className="font-bold text-primary text-lg">
                          {receipt.amount.toLocaleString('ar-SA')} ر.س
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link to={`/receipt/${receipt.receipt_number}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleDownload(receipt.receipt_number)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">لا توجد إيصالات بعد</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    ستظهر إيصالاتك هنا بعد إتمام كفالة
                  </p>
                  <Button onClick={() => navigate('/orphans')}>
                    اكفل يتيماً الآن
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary Card */}
          {receipts && receipts.length > 0 && (
            <Card className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-3xl font-bold text-primary">{receipts.length}</p>
                    <p className="text-sm text-muted-foreground">إجمالي الإيصالات</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      {receipts.reduce((sum, r) => sum + r.amount, 0).toLocaleString('ar-SA')}
                    </p>
                    <p className="text-sm text-muted-foreground">إجمالي المبلغ (ر.س)</p>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <p className="text-3xl font-bold text-primary">
                      {new Set(receipts.map(r => r.sponsorship?.orphan?.id).filter(Boolean)).size}
                    </p>
                    <p className="text-sm text-muted-foreground">أيتام مكفولين</p>
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
