import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Heart, X } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useOrphans } from '@/hooks/useOrphans';
import { LazyImage } from '@/components/common/LazyImage';
import { SkeletonCard } from '@/components/common/LoadingSpinner';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
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
interface SelectedImage {
  url: string;
  name: string;
}
export default function OrphansPage() {
  const {
    data: orphans,
    isLoading
  } = useOrphans();
  const [search, setSearch] = useState('');
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const filteredOrphans = orphans?.filter(orphan => orphan.full_name.includes(search) || orphan.city.includes(search) || orphan.country.includes(search)) || [];
  const handleImageClick = (e: React.MouseEvent, photoUrl: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedImage({
      url: photoUrl,
      name
    });
  };
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
            </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredOrphans.map((orphan, index) => <div key={orphan.id} className="bg-card rounded-2xl overflow-hidden shadow-card card-hover animate-fade-up" style={{
            animationDelay: `${0.05 * index}s`
          }}>
                  <div className="aspect-square bg-muted relative">
                    {orphan.photo_url ? <div className="w-full h-full cursor-pointer" onClick={e => handleImageClick(e, orphan.photo_url!, orphan.full_name)}>
                        <LazyImage src={orphan.photo_url} alt={`صورة اليتيم ${orphan.full_name}`} className="w-full h-full" fallback={<div className="w-full h-full flex items-center justify-center bg-muted">
                              <Heart className="h-16 w-16 text-muted-foreground/50" />
                            </div>} />
                      </div> : <div className="w-full h-full flex items-center justify-center">
                        <Heart className="h-16 w-16 text-muted-foreground/50" />
                      </div>}
                    <Badge className={`absolute top-3 right-3 ${statusLabels[orphan.status].class}`}>
                      {statusLabels[orphan.status].label}
                    </Badge>
                  </div>
                  
                  <div className="p-5 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-foreground whitespace-nowrap">اليتيم:</span>
                      <span className="font-serif font-bold text-lg text-foreground">{orphan.full_name}</span>
                    </div>
                    
                    
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">الجنس:</span>
                      <span>{orphan.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-bold text-foreground">العمر:</span>
                      <span>{orphan.age} سنة</span>
                    </div>
                    
                    <div className="flex flex-col gap-1 text-sm">
                      <span className="font-bold text-foreground">مبلغ الكفالة:</span>
                      <span className="text-primary">60 ريال سعودي • 15 دولار • او مايقابله 25 الف ريال يمني</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link to={`/orphan/${orphan.id}`}>تفاصيل</Link>
                      </Button>
                      {!['fully_sponsored', 'full', 'sponsored'].includes(orphan.status) && <Button asChild variant="hero" size="sm" className="flex-1">
                          <Link to={`/orphan/${orphan.id}`}>أكفل هذا اليتيم</Link>
                        </Button>}
                    </div>
                  </div>
                </div>)}
            </div>}
        </section>
      </div>

      {/* Image Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {selectedImage?.name ? `صورة ${selectedImage.name}` : 'صورة اليتيم'}
          </DialogTitle>
          <div className="relative">
            <Button variant="ghost" size="icon" className="absolute top-2 left-2 z-10 bg-background/80 hover:bg-background" onClick={() => setSelectedImage(null)}>
              <X className="h-5 w-5" />
            </Button>
            {selectedImage && <img src={selectedImage.url} alt={`صورة ${selectedImage.name}`} className="w-full h-auto max-h-[90vh] object-contain" />}
          </div>
        </DialogContent>
      </Dialog>
    </Layout>;
}