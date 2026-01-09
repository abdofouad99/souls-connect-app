import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  label: string;
  created_at: string;
  updated_at: string;
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .order("key");

      if (error) throw error;
      return data as SiteSetting[];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useSiteSetting(key: string) {
  return useQuery({
    queryKey: ["site-settings", key],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .eq("key", key)
        .single();

      if (error) throw error;
      return data as SiteSetting;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

export function useUpdateSiteSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: string }) => {
      const { data, error } = await supabase
        .from("site_settings")
        .update({ value })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as SiteSetting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
    },
  });
}
