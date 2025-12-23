import { Users, Heart, HandHeart, TrendingUp, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { StatsCard } from '@/components/admin/StatsCard';
import { useOrphanStats } from '@/hooks/useOrphans';

export default function AdminDashboard() {
  const { data: stats, isLoading } = useOrphanStats();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-1">مرحباً بك في لوحة إدارة نظام رعاية الأيتام</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-card rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatsCard
              title="إجمالي الأيتام"
              value={stats?.totalOrphans || 0}
              icon={Heart}
              color="primary"
            />
            <StatsCard
              title="متاح للكفالة"
              value={stats?.availableOrphans || 0}
              icon={CheckCircle}
              color="accent"
            />
            <StatsCard
              title="مكفول"
              value={stats?.sponsoredOrphans || 0}
              icon={TrendingUp}
              color="secondary"
            />
            <StatsCard
              title="الكفلاء"
              value={stats?.totalSponsors || 0}
              icon={Users}
              color="primary"
            />
            <StatsCard
              title="كفالات نشطة"
              value={stats?.activeSponsorships || 0}
              icon={HandHeart}
              color="accent"
            />
          </div>
        )}

        {/* Recent Activity Placeholder */}
        <div className="bg-card rounded-2xl p-6 shadow-card">
          <h2 className="text-xl font-serif font-bold text-foreground mb-4">نظرة عامة</h2>
          <p className="text-muted-foreground">
            استخدم القائمة الجانبية للتنقل بين صفحات الإدارة المختلفة.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
