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
    user_id?: string;
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
      console.log('[useCreateSponsorship] Starting mutation with data:', {
        email: data.sponsorData.email,
        orphanId: data.orphanId,
        type: data.type,
        paymentMethod: data.paymentMethod,
        monthlyAmount: data.monthlyAmount,
      });

      // Create or get sponsor
      console.log('[useCreateSponsorship] Checking for existing sponsor...');
      const { data: existingSponsor, error: existingError } = await supabase
        .from('sponsors')
        .select('id')
        .eq('email', data.sponsorData.email)
        .maybeSingle();

      if (existingError) {
        console.error('[useCreateSponsorship] Error checking existing sponsor:', {
          message: existingError.message,
          code: existingError.code,
          details: existingError.details,
          hint: existingError.hint,
        });
        throw existingError;
      }

      let sponsorId: string;

      if (existingSponsor) {
        sponsorId = existingSponsor.id;
        console.log('[useCreateSponsorship] Found existing sponsor:', sponsorId);
        
        // Update sponsor info
        const { error: updateError } = await supabase
          .from('sponsors')
          .update(data.sponsorData)
          .eq('id', sponsorId);
        
        if (updateError) {
          console.error('[useCreateSponsorship] Error updating sponsor:', {
            message: updateError.message,
            code: updateError.code,
            details: updateError.details,
            hint: updateError.hint,
          });
          throw updateError;
        }
      } else {
        console.log('[useCreateSponsorship] Creating new sponsor...');
        const { data: newSponsor, error: sponsorError } = await supabase
          .from('sponsors')
          .insert(data.sponsorData)
          .select()
          .single();

        if (sponsorError) {
          console.error('[useCreateSponsorship] Error creating sponsor:', {
            message: sponsorError.message,
            code: sponsorError.code,
            details: sponsorError.details,
            hint: sponsorError.hint,
          });
          throw sponsorError;
        }
        sponsorId = newSponsor.id;
        console.log('[useCreateSponsorship] Created new sponsor:', sponsorId);
      }

      // Generate receipt number
      const receiptNumber = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
      console.log('[useCreateSponsorship] Generated receipt number:', receiptNumber);

      // Create sponsorship
      console.log('[useCreateSponsorship] Creating sponsorship...');
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

      if (sponsorshipError) {
        console.error('[useCreateSponsorship] Error creating sponsorship:', {
          message: sponsorshipError.message,
          code: sponsorshipError.code,
          details: sponsorshipError.details,
          hint: sponsorshipError.hint,
        });
        throw sponsorshipError;
      }
      console.log('[useCreateSponsorship] Created sponsorship:', sponsorship.id);

      // Create receipt
      console.log('[useCreateSponsorship] Creating receipt...');
      const { error: receiptError } = await supabase
        .from('receipts')
        .insert({
          sponsorship_id: sponsorship.id,
          receipt_number: receiptNumber,
          amount: data.type === 'yearly' ? data.monthlyAmount * 12 : data.monthlyAmount,
        });

      if (receiptError) {
        console.error('[useCreateSponsorship] Error creating receipt:', {
          message: receiptError.message,
          code: receiptError.code,
          details: receiptError.details,
          hint: receiptError.hint,
        });
        throw receiptError;
      }
      console.log('[useCreateSponsorship] Created receipt');

      // Update orphan status
      console.log('[useCreateSponsorship] Updating orphan status...');
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

      console.log('[useCreateSponsorship] Completed successfully!');
      return { receiptNumber, sponsorship };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orphans'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorships'] });
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['orphan-stats'] });
    },
    onError: (error: any) => {
      console.error('[useCreateSponsorship] Mutation failed:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status,
        stack: error?.stack,
      });
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

interface CreateReceiptData {
  sponsorship_id: string;
  amount: number;
  payment_reference?: string;
}

export function useCreateReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReceiptData) => {
      // Generate receipt number
      const receiptNumber = `RCP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      const { data: receipt, error } = await supabase
        .from('receipts')
        .insert({
          sponsorship_id: data.sponsorship_id,
          receipt_number: receiptNumber,
          amount: data.amount,
          payment_reference: data.payment_reference,
        })
        .select()
        .single();

      if (error) throw error;
      return receipt;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
    },
  });
}
