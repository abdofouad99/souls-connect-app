import { Link } from 'react-router-dom';
import { Heart, Users, HandHeart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { useOrphanStats } from '@/hooks/useOrphans';

const Index = () => {
  const { data: stats } = useOrphanStats();

  const statCards = [
    { icon: Users, label: 'إجمالي الأيتام', value: stats?.totalOrphans || 0, color: 'text-primary' },
    { icon: Heart, label: 'يتيم مكفول', value: stats?.sponsoredOrphans || 0, color: 'text-secondary' },
    { icon: HandHeart, label: 'كافل كريم', value: stats?.totalSponsors || 0, color: 'text-accent' },
    { icon: TrendingUp, label: 'كفالة نشطة', value: stats?.activeSponsorships || 0, color: 'text-primary' },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-bl from-primary/10 via-background to-secondary/10" />
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-secondary rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 text-center py-20">
          <div className="animate-fade-up">
            <Heart className="h-20 w-20 mx-auto mb-6 text-primary fill-primary/20 animate-float" />
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-foreground mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            اكفل يتيماً
            <span className="block text-primary mt-2">وأنر حياته</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            ساهم في تغيير حياة يتيم من خلال كفالتك. كل يتيم يستحق فرصة للتعليم والرعاية والحياة الكريمة.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '0.3s' }}>
            <Button asChild variant="hero" size="xl">
              <Link to="/orphans">
                <Heart className="h-5 w-5" />
                ابدأ كفالة يتيم الآن
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link to="/about">تعرف علينا</Link>
            </Button>
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
