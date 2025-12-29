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
  user_id: string | null;
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

// Fetch user's own sponsorship requests
export function useMyRequests(userId: string | undefined) {
  return useQuery({
    queryKey: ['my-requests', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('sponsorship_requests')
        .select(`
          *,
          orphan:orphans(id, full_name, photo_url, monthly_amount)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as SponsorshipRequest[];
    },
    enabled: !!userId,
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
  user_id?: string;
}

export function useCreateSponsorshipRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSponsorshipRequestData) => {
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
          user_id: data.user_id || null,
        });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorship-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
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
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: any = {
        admin_status,
        admin_notes: admin_notes || null,
      };

      if (admin_status === 'approved') {
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      }

      // Update the request status
      const { data: updatedRequest, error: updateError } = await supabase
        .from('sponsorship_requests')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          orphan:orphans(id, full_name, monthly_amount)
        `)
        .single();

      if (updateError) throw updateError;

      // If approved, also create/update a sponsorship record using upsert
      if (admin_status === 'approved' && updatedRequest) {
        // Generate receipt number
        const { data: receiptNumber } = await supabase.rpc('generate_receipt_number');

        // If user_id exists, find or create a sponsor record
        let sponsorId: string | null = null;
        
        if (updatedRequest.user_id) {
          // Check if sponsor already exists for this user
          const { data: existingSponsor } = await supabase
            .from('sponsors')
            .select('id')
            .eq('user_id', updatedRequest.user_id)
            .maybeSingle();

          if (existingSponsor) {
            sponsorId = existingSponsor.id;
          } else {
            // Create a new sponsor record
            const { data: newSponsor, error: sponsorError } = await supabase
              .from('sponsors')
              .insert({
                user_id: updatedRequest.user_id,
                full_name: updatedRequest.sponsor_full_name,
                phone: updatedRequest.sponsor_phone,
                email: updatedRequest.sponsor_email || '',
                country: updatedRequest.sponsor_country,
              })
              .select('id')
              .single();

            if (!sponsorError && newSponsor) {
              sponsorId = newSponsor.id;
            }
          }
        }

        // Upsert sponsorship using request_id as conflict key
        const { data: sponsorshipData, error: upsertError } = await supabase
          .from('sponsorships')
          .upsert({
            request_id: id,
            orphan_id: updatedRequest.orphan_id,
            sponsor_id: sponsorId,
            sponsor_full_name: updatedRequest.sponsor_full_name,
            sponsor_phone: updatedRequest.sponsor_phone,
            sponsor_email: updatedRequest.sponsor_email,
            sponsor_country: updatedRequest.sponsor_country,
            type: updatedRequest.sponsorship_type,
            monthly_amount: updatedRequest.amount,
            payment_method: updatedRequest.payment_method,
            transfer_receipt_image: updatedRequest.transfer_receipt_image,
            cash_receipt_image: updatedRequest.cash_receipt_image,
            cash_receipt_number: updatedRequest.cash_receipt_number,
            cash_receipt_date: updatedRequest.cash_receipt_date,
            approved_at: updateData.approved_at,
            approved_by: updateData.approved_by,
            receipt_number: receiptNumber || `RCP-${Date.now()}`,
            status: 'active',
          }, {
            onConflict: 'request_id',
            ignoreDuplicates: false,
          })
          .select('id, receipt_number, monthly_amount')
          .single();

        if (upsertError) {
          console.error('[Approve] Error upserting sponsorship:', upsertError);
          // Don't throw - the request is already approved
        } else if (sponsorshipData) {
          // Create/update receipt record
          const { error: receiptError } = await supabase
            .from('receipts')
            .upsert({
              sponsorship_id: sponsorshipData.id,
              receipt_number: sponsorshipData.receipt_number,
              amount: sponsorshipData.monthly_amount,
              issue_date: new Date().toISOString().split('T')[0],
            }, {
              onConflict: 'sponsorship_id',
              ignoreDuplicates: false,
            });

          if (receiptError) {
            console.error('[Approve] Error creating receipt:', receiptError);
          }
        }

        // Update orphan status to fully_sponsored (using standardized value)
        await supabase
          .from('orphans')
          .update({ status: 'fully_sponsored' })
          .eq('id', updatedRequest.orphan_id);
      }

      return updatedRequest;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorship-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorships'] });
      queryClient.invalidateQueries({ queryKey: ['orphans'] });
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['my-receipts'] });
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
      // Update sponsorship_requests - the trigger will sync to sponsorships
      const { data: requestData, error: requestError } = await supabase
        .from('sponsorship_requests')
        .update({
          cash_receipt_image,
          cash_receipt_number: cash_receipt_number || null,
          cash_receipt_date: cash_receipt_date || null,
        })
        .eq('id', id)
        .select()
        .single();

      if (requestError) throw requestError;

      return requestData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsorship-requests'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorships'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
    },
  });
}

// Lookup approved request by name, phone and amount (public)
export function useLookupReceipt(sponsorName: string, sponsorPhone: string, amount: number, enabled: boolean) {
  return useQuery({
    queryKey: ['receipt-lookup', sponsorName, sponsorPhone, amount],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sponsorship_requests')
        .select(`
          *,
          orphan:orphans(id, full_name, photo_url)
        `)
        .eq('admin_status', 'approved')
        .eq('sponsor_full_name', sponsorName.trim())
        .eq('sponsor_phone', sponsorPhone.trim())
        .eq('amount', amount)
        .order('approved_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as SponsorshipRequest | null;
    },
    enabled,
  });
}
