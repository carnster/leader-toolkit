import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface InitiativeTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  evidence_base: string;
  target_outcomes: string[];
  typical_timeline: string | null;
  resources_needed: string[] | null;
  active_ingredients: any;
  decision_brief_template: any | null;
  created_at: string;
  updated_at: string;
}

export function useInitiativeTemplates() {
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ["initiative-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiative_templates" as any)
        .select("*")
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as unknown as InitiativeTemplate[];
    },
  });

  const getTemplatesByCategory = (category: string) => {
    return templates?.filter(t => t.category === category) || [];
  };

  const getAllCategories = () => {
    const categories = new Set(templates?.map(t => t.category) || []);
    return Array.from(categories).sort();
  };

  return {
    templates: templates || [],
    isLoading,
    error,
    getTemplatesByCategory,
    getAllCategories,
  };
}
