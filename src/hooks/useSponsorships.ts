import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Sponsorship, Sponsor, Receipt } from '@/lib/types';

export function useSponsorships() {
  return useQuery({
    queryKey: ['sponsorships'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsorships')
        .select(`
          *,
          orphan:orphans(*),
          sponsor:sponsors(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Sponsorship[];
    },
  });
}

export function useSponsors() {
  return useQuery({
    queryKey: ['sponsors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Sponsor[];
    },
  });
}

export function useReceipts() {
  return useQuery({
    queryKey: ['receipts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          sponsorship:sponsorships(
            *,
            orphan:orphans(*),
            sponsor:sponsors(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Receipt[];
    },
  });
}

export function useReceipt(receiptNumber: string) {
  return useQuery({
    queryKey: ['receipt', receiptNumber],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('receipts')
        .select(`
          *,
          sponsorship:sponsorships(
            *,
            orphan:orphans(*),
            sponsor:sponsors(*)
          )
        `)
        .eq('receipt_number', receiptNumber)
        .single();

      if (error) throw error;
      return data as Receipt;
    },
    enabled: !!receiptNumber,
  });
}

interface CreateSponsorshipData {
  sponsorData: {
    full_name: string;
    email: string;
    phone?: string;
    country?: string;
    preferred_contact: string;
  };
  orphanId: string;
  type: 'monthly' | 'yearly';
  paymentMethod: string;
  monthlyAmount: number;
}

export function useCreateSponsorship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSponsorshipData) => {
      // Create or get sponsor
      const { data: existingSponsor } = await supabase
        .from('sponsors')
        .select('id')
        .eq('email', data.sponsorData.email)
        .maybeSingle();

      let sponsorId: string;

      if (existingSponsor) {
        sponsorId = existingSponsor.id;
        // Update sponsor info
        await supabase
          .from('sponsors')
          .update(data.sponsorData)
          .eq('id', sponsorId);
      } else {
        const { data: newSponsor, error: sponsorError } = await supabase
          .from('sponsors')
          .insert(data.sponsorData)
          .select()
          .single();

        if (sponsorError) throw sponsorError;
        sponsorId = newSponsor.id;
      }

      // Generate receipt number
      const receiptNumber = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      // Create sponsorship
      const { data: sponsorship, error: sponsorshipError } = await supabase
        .from('sponsorships')
        .insert({
          orphan_id: data.orphanId,
          sponsor_id: sponsorId,
          type: data.type,
          monthly_amount: data.monthlyAmount,
          payment_method: data.paymentMethod,
          receipt_number: receiptNumber,
          status: 'active',
        })
        .select()
        .single();

      if (sponsorshipError) throw sponsorshipError;

      // Create receipt
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert({
          sponsorship_id: sponsorship.id,
          receipt_number: receiptNumber,
          amount: data.type === 'yearly' ? data.monthlyAmount * 12 : data.monthlyAmount,
        });

      if (receiptError) throw receiptError;

      // Update orphan status
      const { data: orphanSponsorships } = await supabase
        .from('sponsorships')
        .select('id')
        .eq('orphan_id', data.orphanId)
        .eq('status', 'active');

      const newStatus = (orphanSponsorships?.length || 0) >= 1 ? 'full' : 'partial';

      await supabase
        .from('orphans')
        .update({ status: newStatus })
        .eq('id', data.orphanId);

      return { receiptNumber, sponsorship };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphans'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorships'] });
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['orphan-stats'] });
    },
  });
}

export function useUpdateSponsorshipStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data, error } = await supabase
        .from('sponsorships')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorships'] });
    },
  });
}
