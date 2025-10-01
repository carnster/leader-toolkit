import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  organization: string | null;
}

export function useProfiles() {
  const { data: profiles, isLoading } = useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, role, organization")
        .order("full_name", { ascending: true });

      if (error) throw error;
      return data as Profile[];
    },
  });

  return {
    profiles: profiles || [],
    isLoading,
  };
}
