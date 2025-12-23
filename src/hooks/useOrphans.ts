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
      const sponsoredOrphans = orphans?.filter(o => o.status === 'full').length || 0;

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
