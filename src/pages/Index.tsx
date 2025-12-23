import { Link } from 'react-router-dom';
import { Heart, Users, HandHeart, TrendingUp, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useOrphanStats } from '@/hooks/useOrphans';
import heroImage from '@/assets/hero-image.jpg';

const Index = () => {
  const { data: stats } = useOrphanStats();

  const statCards = [
    { icon: Users, label: 'إجمالي الأيتام', value: stats?.totalOrphans || 0, color: 'text-primary' },
    { icon: Heart, label: 'يتيم مكفول', value: stats?.sponsoredOrphans || 0, color: 'text-secondary' },
    { icon: HandHeart, label: 'كافل كريم', value: stats?.totalSponsors || 0, color: 'text-accent' },
    { icon: TrendingUp, label: 'كفالة نشطة', value: stats?.activeSponsorships || 0, color: 'text-primary' },
  ];

  const contactNumbers = [
    '77243079',
    '04251675',
    '784665006',
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="py-12 md:py-20">
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            {/* العنوان الرئيسي */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-foreground mb-8 animate-fade-up">
              جمعية الأقصى _ المكتب النسوي _ تعز
            </h1>
            
            {/* الصورة الرئيسية */}
            <div className="mb-10 animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <img
                src={heroImage}
                alt="مشروع كفالة الأيتام - جمعية الأقصى"
                className="w-full max-w-3xl mx-auto rounded-2xl shadow-xl"
              />
            </div>
            
            {/* قسم أرقام التواصل */}
            <div className="bg-card rounded-2xl p-6 md:p-8 shadow-card max-w-md mx-auto animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-center gap-3 mb-6">
                <Phone className="h-6 w-6 text-primary" />
                <h2 className="text-xl md:text-2xl font-bold text-foreground">أرقام التواصل</h2>
              </div>
              
              <div className="space-y-4">
                {contactNumbers.map((number) => (
                  <a
                    key={number}
                    href={`tel:${number}`}
                    className="flex items-center justify-center gap-3 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-lg md:text-xl py-3 px-6 rounded-xl transition-colors"
                    dir="ltr"
                  >
                    <Phone className="h-5 w-5" />
                    {number}
                  </a>
                ))}
              </div>
            </div>
            
            {/* أزرار الإجراء */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10 animate-fade-up" style={{ animationDelay: '0.3s' }}>
              <Button asChild variant="hero" size="xl">
                <Link to="/orphans">
                  <Heart className="h-5 w-5" />
                  ابدأ كفالة يتيم الآن
                </Link>
              </Button>
              <Button asChild variant="outline" size="xl">
                <Link to="/deposit-request">طلب سند إيداع</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-card">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {statCards.map((stat, index) => (
              <div
                key={stat.label}
                className="bg-background rounded-2xl p-6 text-center shadow-card card-hover animate-fade-up"
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                <stat.icon className={`h-10 w-10 mx-auto mb-3 ${stat.color}`} />
                <div className="text-3xl md:text-4xl font-bold text-foreground mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-6">
              رسالتنا
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-8">
              نؤمن بأن كل يتيم يستحق حياة كريمة مليئة بالأمل والفرص. من خلال برامج الكفالة المتكاملة، 
              نسعى لتوفير التعليم والرعاية الصحية والدعم النفسي لكل يتيم تحت رعايتنا.
            </p>
            <Button asChild variant="gold" size="lg">
              <Link to="/orphans">استعرض الأيتام المتاحين للكفالة</Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
