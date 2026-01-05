import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BankAccount {
  id: string;
  bank_name: string;
  account_number: string;
  iban: string | null;
  beneficiary_name: string;
  notes: string | null;
  display_order: number;
}

export function useBankAccounts() {
  return useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as BankAccount[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}