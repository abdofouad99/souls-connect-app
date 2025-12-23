import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Heart } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useOrphans } from '@/hooks/useOrphans';

const statusLabels = {
  available: { label: 'متاح للكفالة', class: 'bg-primary text-primary-foreground' },
  partial: { label: 'كفالة جزئية', class: 'bg-secondary text-secondary-foreground' },
  full: { label: 'مكفول', class: 'bg-muted text-muted-foreground' },
};

export default function OrphansPage() {
  const { data: orphans, isLoading } = useOrphans();
  const [search, setSearch] = useState('');

  const filteredOrphans = orphans?.filter(orphan =>
    orphan.full_name.includes(search) ||
    orphan.city.includes(search) ||
    orphan.country.includes(search)
  ) || [];

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <section className="bg-gradient-to-l from-primary/10 to-accent/10 py-16">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
              الأيتام
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
            <Input
              placeholder="ابحث بالاسم أو المدينة..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
          </div>
        </section>

        {/* Orphans Grid */}
        <section className="container pb-16">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-card rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : filteredOrphans.length === 0 ? (
            <div className="text-center py-20">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">لا يوجد أيتام حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredOrphans.map((orphan, index) => (
                <div
                  key={orphan.id}
                  className="bg-card rounded-2xl overflow-hidden shadow-card card-hover animate-fade-up"
                  style={{ animationDelay: `${0.05 * index}s` }}
                >
                  <div className="aspect-square bg-muted relative">
                    {orphan.photo_url ? (
                      <img
                        src={orphan.photo_url}
                        alt={orphan.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Heart className="h-16 w-16 text-muted-foreground/50" />
                      </div>
                    )}
                    <Badge className={`absolute top-3 right-3 ${statusLabels[orphan.status].class}`}>
                      {statusLabels[orphan.status].label}
                    </Badge>
                  </div>
                  
                  <div className="p-5">
                    <h3 className="font-serif font-bold text-lg text-foreground mb-2">
                      {orphan.full_name}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>{orphan.city}، {orphan.country}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">
                        {orphan.age} سنة • {orphan.gender === 'male' ? 'ذكر' : 'أنثى'}
                      </span>
                      <span className="font-bold text-primary">
                        {orphan.monthly_amount} ر.س/شهر
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link to={`/orphan/${orphan.id}`}>تفاصيل</Link>
                      </Button>
                      {orphan.status !== 'full' && (
                        <Button asChild variant="hero" size="sm" className="flex-1">
                          <Link to={`/orphan/${orphan.id}`}>أكفل هذا اليتيم</Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
