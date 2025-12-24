import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useReceipt } from '@/hooks/useSponsorships';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export default function ReceiptPage() {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();
  const navigate = useNavigate();
  const { data: receipt, isLoading, error } = useReceipt(receiptNumber || '');

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">جاري التحميل...</div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-4">لم يتم العثور على الإيصال</p>
          <Button onClick={() => navigate(-1)}>
            <ArrowRight className="h-4 w-4 ml-2" />
            رجوع
          </Button>
        </div>
      </div>
    );
  }

  const sponsorship = receipt.sponsorship;
  const orphan = sponsorship?.orphan;
  const sponsor = sponsorship?.sponsor;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-8">
      {/* Print Controls - Hidden when printing */}
      <div className="no-print container max-w-3xl mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowRight className="h-4 w-4 ml-2" />
          رجوع
        </Button>
        <Button onClick={handlePrint} variant="hero">
          <Printer className="h-5 w-5" />
          طباعة الإيصال
        </Button>
      </div>

      {/* Receipt */}
      <div className="container max-w-3xl">
        <div className="bg-card border-2 border-primary/30 rounded-2xl shadow-card overflow-hidden print:shadow-none print:rounded-none print:border-0">
          {/* Header */}
          <div className="bg-gradient-to-l from-primary to-primary/80 text-primary-foreground p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Heart className="h-10 w-10 fill-primary-foreground/30" />
              <h1 className="text-3xl font-serif font-bold">رعاية الأيتام</h1>
            </div>
            <p className="text-primary-foreground/80">إيصال كفالة يتيم</p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Receipt Number & Date */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-border">
              <div>
                <p className="text-sm text-muted-foreground">رقم الإيصال</p>
                <p className="text-xl font-mono font-bold text-primary" dir="ltr">
                  {receipt.receipt_number}
                </p>
              </div>
              <div className="text-left">
                <p className="text-sm text-muted-foreground">تاريخ الإصدار</p>
                <p className="font-medium">
                  {format(new Date(receipt.issue_date), 'dd MMMM yyyy', { locale: ar })}
                </p>
              </div>
            </div>

            {/* Sponsor Info */}
            <div className="mb-8">
              <h2 className="text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                بيانات الكافل
              </h2>
              <div className="bg-muted rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">الاسم</p>
                  <p className="font-medium">{sponsor?.full_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البريد الإلكتروني</p>
                  <p className="font-medium" dir="ltr">{sponsor?.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">الهاتف</p>
                  <p className="font-medium" dir="ltr">{sponsor?.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البلد</p>
                  <p className="font-medium">{sponsor?.country || '-'}</p>
                </div>
              </div>
            </div>

            {/* Orphan Info */}
            <div className="mb-8">
              <h2 className="text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-secondary rounded-full"></span>
                بيانات اليتيم المكفول
              </h2>
              <div className="bg-muted rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">الاسم</p>
                  <p className="font-medium">{orphan?.full_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">العمر</p>
                  <p className="font-medium">{orphan?.age} سنة</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المدينة</p>
                  <p className="font-medium">{orphan?.city || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">البلد</p>
                  <p className="font-medium">{orphan?.country || '-'}</p>
                </div>
              </div>
            </div>

            {/* Sponsorship Details */}
            <div className="mb-8">
              <h2 className="text-lg font-serif font-bold text-foreground mb-4 flex items-center gap-2">
                <span className="w-2 h-2 bg-accent rounded-full"></span>
                تفاصيل الكفالة
              </h2>
              <div className="bg-muted rounded-xl p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">نوع الكفالة</p>
                  <p className="font-medium">
                    {sponsorship?.type === 'monthly' ? 'شهرية' : 'سنوية'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">طريقة الدفع</p>
                  <p className="font-medium">
                    {sponsorship?.payment_method === 'bank_transfer' ? 'تحويل بنكي' :
                     sponsorship?.payment_method === 'credit_card' ? 'بطاقة ائتمان' : 'نقداً'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">تاريخ بدء الكفالة</p>
                  <p className="font-medium">
                    {sponsorship?.start_date ? 
                      format(new Date(sponsorship.start_date), 'dd MMMM yyyy', { locale: ar }) : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">المبلغ الشهري</p>
                  <p className="font-medium">{sponsorship?.monthly_amount} ر.س</p>
                </div>
              </div>
            </div>

            {/* Total Amount */}
            <div className="bg-primary/10 rounded-xl p-6 text-center">
              <p className="text-sm text-muted-foreground mb-2">إجمالي المبلغ المدفوع</p>
              <p className="text-4xl font-bold text-primary">{receipt.amount} ر.س</p>
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-border text-center text-sm text-muted-foreground">
              <p>جزاكم الله خيراً على مساهمتكم في رعاية الأيتام</p>
              <p className="mt-2">للاستفسارات: info@orphan-care.org</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
