import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Heart, Printer } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';

export default function ThankYouPage() {
  const { receiptNumber } = useParams<{ receiptNumber: string }>();

  return (
    <Layout>
      <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-primary/5 to-background py-16">
        <div className="container max-w-lg text-center">
          <div className="bg-card rounded-3xl p-10 shadow-card animate-scale-in">
            <CheckCircle className="h-20 w-20 mx-auto text-primary mb-6" />
            
            <h1 className="text-3xl font-serif font-bold text-foreground mb-4">
              جزاك الله خيراً
            </h1>
            
            <p className="text-lg text-muted-foreground mb-6">
              تمت كفالتك بنجاح! شكراً لمساهمتك في رعاية يتيم.
            </p>

            <div className="bg-primary/10 rounded-xl p-6 mb-8">
              <div className="text-sm text-muted-foreground mb-2">رقم الإيصال</div>
              <div className="text-2xl font-bold text-primary font-mono" dir="ltr">
                {receiptNumber}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to={`/receipt/${receiptNumber}`}>
                  <Printer className="h-5 w-5" />
                  عرض الإيصال
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg">
                <Link to="/orphans">
                  <Heart className="h-5 w-5" />
                  كفالة يتيم آخر
                </Link>
              </Button>
              
              <Button asChild variant="ghost">
                <Link to="/">العودة للرئيسية</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
