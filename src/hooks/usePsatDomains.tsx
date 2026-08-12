import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { isMissingColumn } from "@/lib/missingTable";

// Program Sustainability Assessment Tool (Schell et al. 2013, Implementation
// Science): eight domains, each self-rated 1 to 5. Stored on
// sustainability_plans.psat_domains as { domain_key: rating }.
export type PsatRatings = Record<string, number>;

export const PSAT_DOMAINS: { key: string; label: string; description: string }[] = [
  { key: "funding_stability", label: "Funding Stability", description: "The work has funding that is stable enough to count on, not year to year scramble." },
  { key: "partnerships", label: "Partnerships", description: "Partners who share the goal are invested and show up for the work." },
  { key: "organizational_capacity", label: "Organizational Capacity", description: "There are enough people, time, and systems to keep this running well." },
  { key: "program_adaptation", label: "Program Adaptation", description: "The work can flex to new conditions without losing its core." },
  { key: "program_evaluation", label: "Program Evaluation", description: "You collect and use data to show the work is worth continuing." },
  { key: "communications", label: "Communications", description: "You tell the story of this work to the people who need to hear it." },
  { key: "strategic_planning", label: "Strategic Planning", description: "There is a clear plan for where this work is headed next." },
  { key: "political_support", label: "Political/Community Support", description: "Decision makers and the community back this work out loud." },
];

export function usePsatDomains(initiativeId: string | undefined) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const key = ["psat-domains", initiativeId];

  const { data, isLoading } = useQuery({
    queryKey: key,
    enabled: !!initiativeId,
    queryFn: async () => {
      // Naming the column lets a not-yet-migrated database fail here so we can
      // degrade to the awaiting-update state. Cast: types predate the column.
      const { data, error } = await supabase
        .from("sustainability_plans" as any)
        .select("id, psat_domains")
        .eq("initiative_id", initiativeId!)
        .maybeSingle();
      if (error) {
        if (isMissingColumn(error)) return { missingColumn: true, ratings: {} as PsatRatings };
        throw error;
      }
      const row = data as { psat_domains?: PsatRatings } | null;
      return { missingColumn: false, ratings: (row?.psat_domains as PsatRatings) ?? {} };
    },
  });

  const save = useMutation({
    mutationFn: async (ratings: PsatRatings) => {
      // sustainability_plans has no required columns beyond initiative_id, so a
      // minimal upsert is safe whether or not a plan row exists yet.
      const { error } = await supabase
        .from("sustainability_plans" as any)
        .upsert({ initiative_id: initiativeId!, psat_domains: ratings }, { onConflict: "initiative_id" });
      if (error) {
        if (isMissingColumn(error)) return { missingColumn: true };
        throw error;
      }
      return { missingColumn: false };
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
    onError: (e: Error) =>
      toast({ title: "Could not save the sustainability ratings", description: e.message, variant: "destructive" }),
  });

  return {
    ratings: data?.ratings ?? ({} as PsatRatings),
    missingColumn: data?.missingColumn ?? false,
    isLoading,
    save: save.mutate,
    isSaving: save.isPending,
  };
}
