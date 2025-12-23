import { Heart, Phone, Mail, MapPin } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-gradient-to-l from-primary/10 to-accent/10 py-20">
          <div className="container text-center">
            <Heart className="h-16 w-16 mx-auto text-primary fill-primary/20 mb-6" />
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">من نحن</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              نسعى لتوفير حياة كريمة للأيتام من خلال برامج الكفالة والدعم المستمر
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16">
          <div className="container max-w-4xl">
            <div className="prose prose-lg mx-auto text-center">
              <h2 className="text-3xl font-serif font-bold text-foreground mb-6">رسالتنا</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                نؤمن بأن كل يتيم يستحق حياة كريمة مليئة بالأمل والفرص. من خلال برامج الكفالة المتكاملة،
                نسعى لتوفير التعليم والرعاية الصحية والدعم النفسي لكل يتيم تحت رعايتنا.
                هدفنا هو بناء جيل واعٍ قادر على المساهمة في بناء مجتمعه.
              </p>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section className="py-16 bg-card">
          <div className="container max-w-4xl">
            <h2 className="text-3xl font-serif font-bold text-foreground text-center mb-10">تواصل معنا</h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-background rounded-2xl p-6 text-center shadow-card">
                <Phone className="h-10 w-10 mx-auto text-primary mb-4" />
                <h3 className="font-bold text-foreground mb-2">الهاتف</h3>
                <p className="text-muted-foreground" dir="ltr">+966 50 123 4567</p>
              </div>
              
              <div className="bg-background rounded-2xl p-6 text-center shadow-card">
                <Mail className="h-10 w-10 mx-auto text-primary mb-4" />
                <h3 className="font-bold text-foreground mb-2">البريد الإلكتروني</h3>
                <p className="text-muted-foreground">info@orphan-care.org</p>
              </div>
              
              <div className="bg-background rounded-2xl p-6 text-center shadow-card">
                <MapPin className="h-10 w-10 mx-auto text-primary mb-4" />
                <h3 className="font-bold text-foreground mb-2">العنوان</h3>
                <p className="text-muted-foreground">المملكة العربية السعودية</p>
              </div>
            </div>

            <div className="text-center mt-10">
              <Button asChild variant="hero" size="lg">
                <Link to="/orphans">ابدأ الكفالة الآن</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
