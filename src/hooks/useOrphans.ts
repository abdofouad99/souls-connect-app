import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Orphan } from '@/lib/types';

export function useOrphans() {
  return useQuery({
    queryKey: ['orphans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orphans')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Orphan[];
    },
  });
}

export function useOrphan(id: string) {
  return useQuery({
    queryKey: ['orphan', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orphans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Orphan;
    },
    enabled: !!id,
  });
}

export function useCreateOrphan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orphan: Omit<Orphan, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('orphans')
        .insert(orphan)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphans'] });
    },
  });
}

export function useUpdateOrphan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Orphan> & { id: string }) => {
      const { data, error } = await supabase
        .from('orphans')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphans'] });
    },
  });
}

export function useDeleteOrphan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('orphans')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphans'] });
    },
  });
}

export function useOrphanStats() {
  return useQuery({
    queryKey: ['orphan-stats'],
    queryFn: async () => {
      const { data: orphans, error: orphansError } = await supabase
        .from('orphans')
        .select('status');

      if (orphansError) throw orphansError;

      const { count: sponsorsCount, error: sponsorsError } = await supabase
        .from('sponsors')
        .select('*', { count: 'exact', head: true });

      if (sponsorsError) throw sponsorsError;

      const { count: activeSponsorships, error: sponsorshipsError } = await supabase
        .from('sponsorships')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      if (sponsorshipsError) throw sponsorshipsError;

      const totalOrphans = orphans?.length || 0;
      const availableOrphans = orphans?.filter(o => o.status === 'available').length || 0;
      // Count both new and legacy values for sponsored orphans
      const sponsoredOrphans = orphans?.filter(o => 
        o.status === 'fully_sponsored' || o.status === 'full' || o.status === 'sponsored'
      ).length || 0;

      return {
        totalOrphans,
        availableOrphans,
        sponsoredOrphans,
        totalSponsors: sponsorsCount || 0,
        activeSponsorships: activeSponsorships || 0,
      };
    },
  });
}

export function useDashboardChartData() {
  return useQuery({
    queryKey: ['dashboard-charts'],
    queryFn: async () => {
      // Fetch orphans with details
      const { data: orphans } = await supabase
        .from('orphans')
        .select('gender, age, city, country, status, monthly_amount, created_at');

      // Fetch sponsorships with details
      const { data: sponsorships } = await supabase
        .from('sponsorships')
        .select('type, status, monthly_amount, start_date, payment_method, created_at');

      // Fetch receipts
      const { data: receipts } = await supabase
        .from('receipts')
        .select('amount, issue_date, created_at');

      // Process data for charts
      
      // 1. Orphans by gender
      const genderData = [
        { name: 'ذكور', value: orphans?.filter(o => o.gender === 'male').length || 0, fill: 'hsl(160, 60%, 35%)' },
        { name: 'إناث', value: orphans?.filter(o => o.gender === 'female').length || 0, fill: 'hsl(38, 75%, 55%)' },
      ];

      // 2. Orphans by status (includes legacy values for backwards compatibility)
      const statusData = [
        { name: 'متاح', value: orphans?.filter(o => o.status === 'available').length || 0, fill: 'hsl(160, 60%, 35%)' },
        { name: 'جزئي', value: orphans?.filter(o => o.status === 'partially_sponsored' || o.status === 'partial').length || 0, fill: 'hsl(38, 75%, 55%)' },
        { name: 'مكفول', value: orphans?.filter(o => o.status === 'fully_sponsored' || o.status === 'full' || o.status === 'sponsored').length || 0, fill: 'hsl(175, 45%, 40%)' },
      ];

      // 3. Orphans by age groups
      const ageGroups = [
        { name: '0-5', value: orphans?.filter(o => o.age >= 0 && o.age <= 5).length || 0 },
        { name: '6-10', value: orphans?.filter(o => o.age >= 6 && o.age <= 10).length || 0 },
        { name: '11-15', value: orphans?.filter(o => o.age >= 11 && o.age <= 15).length || 0 },
        { name: '16-18', value: orphans?.filter(o => o.age >= 16 && o.age <= 18).length || 0 },
        { name: '18+', value: orphans?.filter(o => o.age > 18).length || 0 },
      ];

      // 4. Sponsorship types
      const sponsorshipTypes = [
        { name: 'شهري', value: sponsorships?.filter(s => s.type === 'monthly').length || 0, fill: 'hsl(160, 60%, 35%)' },
        { name: 'سنوي', value: sponsorships?.filter(s => s.type === 'yearly').length || 0, fill: 'hsl(38, 75%, 55%)' },
      ];

      // 5. Sponsorship status breakdown
      const sponsorshipStatus = [
        { name: 'نشط', value: sponsorships?.filter(s => s.status === 'active').length || 0, fill: 'hsl(160, 60%, 35%)' },
        { name: 'متوقف', value: sponsorships?.filter(s => s.status === 'paused').length || 0, fill: 'hsl(38, 75%, 55%)' },
        { name: 'مكتمل', value: sponsorships?.filter(s => s.status === 'completed').length || 0, fill: 'hsl(175, 45%, 40%)' },
        { name: 'ملغي', value: sponsorships?.filter(s => s.status === 'cancelled').length || 0, fill: 'hsl(0, 72%, 51%)' },
      ];

      // 6. Monthly revenue (last 6 months)
      const now = new Date();
      const monthlyRevenue = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
        
        const monthReceipts = receipts?.filter(r => {
          const date = new Date(r.issue_date);
          return date >= monthDate && date <= monthEnd;
        }) || [];
        
        const total = monthReceipts.reduce((sum, r) => sum + (r.amount || 0), 0);
        
        monthlyRevenue.push({
          month: monthDate.toLocaleDateString('ar-SA', { month: 'short' }),
          amount: total,
        });
      }

      // 7. Top countries
      const countryCounts: Record<string, number> = {};
      orphans?.forEach(o => {
        countryCounts[o.country] = (countryCounts[o.country] || 0) + 1;
      });
      const topCountries = Object.entries(countryCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      // 8. Total amounts
      const totalMonthlyAmount = orphans?.reduce((sum, o) => sum + (o.monthly_amount || 0), 0) || 0;
      const totalReceivedAmount = receipts?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

      return {
        genderData,
        statusData,
        ageGroups,
        sponsorshipTypes,
        sponsorshipStatus,
        monthlyRevenue,
        topCountries,
        totalMonthlyAmount,
        totalReceivedAmount,
      };
    },
  });
}
