import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useOrphans } from '@/hooks/useOrphans';
import { useSiteSetting } from '@/hooks/useSiteSettings';
import { SkeletonCard } from '@/components/common/LoadingSpinner';
const statusLabels: Record<string, {
  label: string;
  class: string;
}> = {
  available: {
    label: 'متاح للكفالة',
    class: 'bg-primary text-primary-foreground'
  },
  partially_sponsored: {
    label: 'مكفول جزئياً',
    class: 'bg-secondary text-secondary-foreground'
  },
  fully_sponsored: {
    label: 'مكفول بالكامل',
    class: 'bg-muted text-muted-foreground'
  },
  inactive: {
    label: 'غير نشط',
    class: 'bg-muted text-muted-foreground'
  },
  // Legacy values (for backward compatibility during migration)
  partial: {
    label: 'مكفول جزئياً',
    class: 'bg-secondary text-secondary-foreground'
  },
  full: {
    label: 'مكفول بالكامل',
    class: 'bg-muted text-muted-foreground'
  },
  sponsored: {
    label: 'مكفول بالكامل',
    class: 'bg-muted text-muted-foreground'
  }
};
export default function OrphansPage() {
  const {
    data: orphans,
    isLoading
  } = useOrphans();
  const { data: sponsorshipAmountSetting } = useSiteSetting("sponsorship_amount_text");
  const [search, setSearch] = useState('');
  const filteredOrphans = orphans?.filter(orphan => orphan.full_name.includes(search) || orphan.city.includes(search) || orphan.country.includes(search)) || [];
  return <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-gradient-to-l from-primary/10 to-accent/10 py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              لبدء الكفالة في غزة
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              اختر يتيماً لتكفله وتغير حياته للأفضل
            </p>
          </div>
        </section>

        {/* Search & Filter */}
        <section className="container py-8">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input placeholder="ابحث بالاسم أو المدينة..." value={search} onChange={e => setSearch(e.target.value)} className="pr-10" />
          </div>
        </section>

        {/* Orphans Grid */}
        <section className="container pb-16">
          {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
            </div> : filteredOrphans.length === 0 ? <div className="text-center py-20">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">لا يوجد أيتام حالياً</p>
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOrphans.map((orphan, index) => <div key={orphan.id} className="bg-card rounded-2xl p-6 shadow-card card-hover animate-fade-up flex flex-col" style={{
            animationDelay: `${0.05 * index}s`
          }}>
                  <div className="text-center font-bold text-primary border-b pb-2 mb-3">
                    بيانات اليتيم
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-serif font-bold text-xl text-foreground">{orphan.full_name}</h3>
                    <Badge className={statusLabels[orphan.status].class}>
                      {statusLabels[orphan.status].label}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm flex-1">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-foreground whitespace-nowrap">مكان الميلاد:</span>
                      <span className="text-muted-foreground">{orphan.birth_place || '—'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-foreground whitespace-nowrap">تاريخ الميلاد:</span>
                      <span className="text-muted-foreground" dir="ltr">{orphan.birth_date || '—'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-foreground whitespace-nowrap">تاريخ وفاة الأب:</span>
                      <span className="text-muted-foreground" dir="ltr">{orphan.father_death_date || '—'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-foreground whitespace-nowrap">المستوى التعليمي:</span>
                      <span className="text-muted-foreground">{orphan.education_level || '—'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-foreground whitespace-nowrap">ملاحظة:</span>
                      <span className="text-muted-foreground">{orphan.notes || '—'}</span>
                    </div>
                    <div className="flex flex-col gap-1 pt-2 border-t mt-3">
                      <span className="font-bold text-foreground">مبلغ الكفالة:</span>
                      <span className="text-primary">{sponsorshipAmountSetting?.value || "٦٠ ريال سعودي • ١٥ دولار • او مايقابله ٢٥ الف ريال يمني"}</span>
                      {['fully_sponsored', 'full', 'sponsored'].includes(orphan.status) && (
                        <span className="mt-2 inline-block text-center bg-muted text-muted-foreground rounded-full py-1 px-3 font-bold">
                          مكفول بالكامل
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {!['fully_sponsored', 'full', 'sponsored'].includes(orphan.status) && <Button asChild variant="hero" size="sm" className="flex-1">
                        <Link to={`/orphan/${orphan.id}?sponsor=true`}>أكفل هذا اليتيم</Link>
                      </Button>}
                  </div>
                </div>)}
            </div>}
        </section>
      </div>
    </Layout>;
}