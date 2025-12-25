import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SponsorshipRequest {
  id: string;
  created_at: string;
  updated_at: string;
  sponsor_full_name: string;
  sponsor_phone: string;
  sponsor_email: string | null;
  sponsor_country: string | null;
  orphan_id: string;
  sponsorship_type: 'monthly' | 'yearly';
  amount: number;
  payment_method: string;
  transfer_receipt_image: string | null;
  admin_status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  cash_receipt_image: string | null;
  cash_receipt_number: string | null;
  cash_receipt_date: string | null;
  orphan?: {
    id: string;
    full_name: string;
    photo_url: string | null;
    monthly_amount: number;
  };
}

// Fetch all sponsorship requests (admin only)
export function useSponsorshipRequests() {
  return useQuery({
    queryKey: ['sponsorship-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .select(`
          *,
          orphan:orphans(id, full_name, photo_url, monthly_amount)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SponsorshipRequest[];
    },
  });
}

// Create a new sponsorship request (public)
export interface CreateSponsorshipRequestData {
  sponsor_full_name: string;
  sponsor_phone: string;
  sponsor_email?: string;
  sponsor_country?: string;
  orphan_id: string;
  sponsorship_type: 'monthly' | 'yearly';
  amount: number;
  transfer_receipt_image?: string;
}

export function useCreateSponsorshipRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSponsorshipRequestData) => {
      // Use minimal insert without .select() to avoid RLS SELECT permission requirement
      const { error } = await supabase
        .from('sponsorship_requests')
        .insert({
          sponsor_full_name: data.sponsor_full_name,
          sponsor_phone: data.sponsor_phone,
          sponsor_email: data.sponsor_email || null,
          sponsor_country: data.sponsor_country || null,
          orphan_id: data.orphan_id,
          sponsorship_type: data.sponsorship_type,
          amount: data.amount,
          payment_method: 'تحويل بنكي',
          transfer_receipt_image: data.transfer_receipt_image || null,
          admin_status: 'pending',
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorship-requests'] });
    },
  });
}

// Update sponsorship request status (admin only)
export interface UpdateSponsorshipRequestData {
  id: string;
  admin_status: 'approved' | 'rejected';
  admin_notes?: string;
}

export function useUpdateSponsorshipRequestStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, admin_status, admin_notes }: UpdateSponsorshipRequestData) => {
      const updateData: any = {
        admin_status,
        admin_notes: admin_notes || null,
      };

      if (admin_status === 'approved') {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      }

      const { data, error } = await supabase
        .from('sponsorship_requests')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorship-requests'] });
    },
  });
}

// Upload cash receipt (admin only)
export interface UploadCashReceiptData {
  id: string;
  cash_receipt_image: string;
  cash_receipt_number?: string;
  cash_receipt_date?: string;
}

export function useUploadCashReceipt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cash_receipt_image, cash_receipt_number, cash_receipt_date }: UploadCashReceiptData) => {
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .update({
          cash_receipt_image,
          cash_receipt_number: cash_receipt_number || null,
          cash_receipt_date: cash_receipt_date || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorship-requests'] });
    },
  });
}

// Lookup approved request by name and phone (public)
export function useLookupReceipt(sponsorName: string, sponsorPhone: string, enabled: boolean) {
  return useQuery({
    queryKey: ['receipt-lookup', sponsorName, sponsorPhone],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .select(`
          *,
          orphan:orphans(id, full_name, photo_url)
        `)
        .eq('admin_status', 'approved')
        .ilike('sponsor_full_name', `%${sponsorName}%`)
        .eq('sponsor_phone', sponsorPhone)
        .order('approved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SponsorshipRequest | null;
    },
    enabled,
  });
}
